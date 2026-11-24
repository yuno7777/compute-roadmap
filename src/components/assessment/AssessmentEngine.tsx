"use client";

import {
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  GripVertical,
  HelpCircle,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { MathBlock, MathText } from "@/components/math/MathText";
import { getSimulatorComponent } from "@/components/simulators/registry";
import { useLearningStore } from "@/store/learningStore";
import type {
  AssessmentQuestion,
  MatchingPair,
} from "@/types/assessment";
import type { TrackId } from "@/types/curriculum";

type AnswerValue = string | string[] | boolean | number | Record<string, string>;

interface QuestionState {
  answer: AnswerValue | undefined;
  submitted: boolean;
  isCorrect: boolean;
  hintsRevealed: number;
}

function deterministicShuffle(items: string[], seedStr: string): string[] {
  const copy = [...items];
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }
  for (let i = copy.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const j = seed % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((v, i) => v === b[i]);
}

function normalizeString(val: string): string {
  return val.trim().toLowerCase().replace(/\s+/g, " ");
}

function evaluateAnswer(
  question: AssessmentQuestion,
  userAnswer: AnswerValue | undefined
): boolean {
  if (userAnswer === undefined) return false;

  switch (question.type) {
    case "mcq": {
      return String(userAnswer) === String(question.correctAnswer);
    }

    case "multi-select": {
      const selected = Array.isArray(userAnswer) ? [...userAnswer].sort() : [];
      const expected = Array.isArray(question.correctAnswer)
        ? [...question.correctAnswer].sort()
        : [String(question.correctAnswer)];
      return arraysEqual(selected, expected);
    }

    case "true-false": {
      const expectedBool =
        typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
          : String(question.correctAnswer).toLowerCase() === "true";
      return Boolean(userAnswer) === expectedBool;
    }

    case "fill-blank": {
      const userNorm = normalizeString(String(userAnswer));
      if (!userNorm) return false;
      const candidates = [
        String(question.correctAnswer),
        ...(question.acceptableAnswers ?? []),
      ].map(normalizeString);
      return candidates.includes(userNorm);
    }

    case "predict-output":
    case "debugging": {
      if (question.options && question.options.length > 0) {
        return String(userAnswer) === String(question.correctAnswer);
      }
      const userNorm = normalizeString(String(userAnswer));
      if (!userNorm) return false;
      const candidates = [
        String(question.correctAnswer),
        ...(question.acceptableAnswers ?? []),
      ].map(normalizeString);
      return candidates.includes(userNorm);
    }

    case "math": {
      const raw = String(userAnswer).trim();
      if (!raw) return false;
      const expectedNum =
        typeof question.correctAnswer === "number"
          ? question.correctAnswer
          : Number(question.correctAnswer);
      const userNum = Number(raw);

      if (Number.isFinite(expectedNum) && Number.isFinite(userNum)) {
        const tol = question.numericTolerance ?? 1e-4;
        if (Math.abs(userNum - expectedNum) <= tol) return true;
      }

      const userNorm = normalizeString(raw);
      const candidates = [
        String(question.correctAnswer),
        ...(question.acceptableAnswers ?? []),
      ].map(normalizeString);
      return candidates.includes(userNorm);
    }

    case "ordering": {
      const userArr = Array.isArray(userAnswer) ? userAnswer : [];
      const expectedArr = Array.isArray(question.correctAnswer)
        ? question.correctAnswer
        : [];
      return arraysEqual(userArr, expectedArr);
    }

    case "matching": {
      const userMap =
        typeof userAnswer === "object" &&
        userAnswer !== null &&
        !Array.isArray(userAnswer)
          ? (userAnswer as Record<string, string>)
          : {};
      const expectedMap =
        typeof question.correctAnswer === "object" &&
        question.correctAnswer !== null &&
        !Array.isArray(question.correctAnswer)
          ? (question.correctAnswer as Record<string, string>)
          : {};
      const pairs = question.matchingPairs ?? [];
      if (pairs.length === 0) return false;

      return pairs.every((pair) => {
        const expectedRight =
          expectedMap[pair.id] ?? expectedMap[pair.left] ?? pair.right;
        return userMap[pair.id] === expectedRight;
      });
    }

    case "simulation-challenge": {
      return userAnswer === true || userAnswer === "completed";
    }
  }
}

function getInitialOrdering(question: AssessmentQuestion): string[] {
  const base = question.orderingItems ?? [];
  const expected = Array.isArray(question.correctAnswer)
    ? question.correctAnswer
    : [];
  if (base.length <= 1) return [...base];
  if (arraysEqual(base, expected)) {
    // Deterministically rotate by 1 so the learner starts from an unsorted sequence
    return [...base.slice(1), base[0]];
  }
  return [...base];
}

export interface AssessmentEngineProps {
  questions: AssessmentQuestion[];
  lessonSlug?: string;
  trackId?: TrackId;
  mode?: "lesson" | "exam" | "practice";
  passingScore?: number;
  title?: string;
  onCompleteSummary?: (score: number, total: number) => void;
}

export function AssessmentEngine({
  questions,
  lessonSlug,
  trackId,
  mode = "lesson",
  passingScore = 70,
  title = "Knowledge Checks",
  onCompleteSummary,
}: AssessmentEngineProps) {
  const {
    recordLessonQuizScore,
    recordExamScore,
    recordMistake,
    resolveMistakesForQuestion,
    reviewQuestion,
  } = useLearningStore();

  const [responses, setResponses] = useState<Record<string, QuestionState>>({});
  const [recordedSummary, setRecordedSummary] = useState(false);

  // Initialize ordering items per question cleanly
  useEffect(() => {
    setResponses((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const q of questions) {
        if (q.type === "ordering" && !next[q.id]) {
          next[q.id] = {
            answer: getInitialOrdering(q),
            submitted: false,
            isCorrect: false,
            hintsRevealed: 0,
          };
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [questions]);

  const stats = useMemo(() => {
    const total = questions.length;
    const submittedCount = questions.filter((q) => responses[q.id]?.submitted).length;
    const correctCount = questions.filter((q) => responses[q.id]?.isCorrect).length;
    return {
      total,
      submittedCount,
      correctCount,
      percentage: total === 0 ? 0 : Math.round((correctCount / total) * 100),
      allSubmitted: total > 0 && submittedCount === total,
    };
  }, [questions, responses]);

  // Persist aggregate quiz/exam score once all questions have been submitted
  useEffect(() => {
    if (!stats.allSubmitted || recordedSummary) return;
    setRecordedSummary(true);
    if (mode === "lesson" && lessonSlug) {
      recordLessonQuizScore(lessonSlug, stats.correctCount, stats.total);
    } else if (mode === "exam" && trackId) {
      recordExamScore(trackId, stats.correctCount, stats.total, passingScore);
    }
    onCompleteSummary?.(stats.correctCount, stats.total);
  }, [
    stats.allSubmitted,
    stats.correctCount,
    stats.total,
    recordedSummary,
    mode,
    lessonSlug,
    trackId,
    passingScore,
    recordLessonQuizScore,
    recordExamScore,
    onCompleteSummary,
  ]);

  const updateAnswer = (qId: string, answer: AnswerValue) => {
    setResponses((prev) => ({
      ...prev,
      [qId]: {
        answer,
        submitted: false,
        isCorrect: false,
        hintsRevealed: prev[qId]?.hintsRevealed ?? 0,
      },
    }));
  };

  const revealHint = (qId: string, maxHints: number) => {
    setResponses((prev) => {
      const current = prev[qId] ?? {
        answer: undefined,
        submitted: false,
        isCorrect: false,
        hintsRevealed: 0,
      };
      return {
        ...prev,
        [qId]: {
          ...current,
          hintsRevealed: Math.min(maxHints, current.hintsRevealed + 1),
        },
      };
    });
  };

  const submitQuestion = (
    question: AssessmentQuestion,
    overrideAnswer?: AnswerValue
  ) => {
    const current = responses[question.id];
    const finalAnswer =
      overrideAnswer !== undefined ? overrideAnswer : current?.answer;
    const isCorrect = evaluateAnswer(question, finalAnswer);
    const hintsUsed = current?.hintsRevealed ?? 0;

    setResponses((prev) => ({
      ...prev,
      [question.id]: {
        answer: finalAnswer,
        submitted: true,
        isCorrect,
        hintsRevealed: hintsUsed,
      },
    }));

    const slugForCard = lessonSlug ?? trackId ?? "general";
    if (isCorrect) {
      resolveMistakesForQuestion(question.id);
      reviewQuestion(question.id, slugForCard, hintsUsed > 0 ? 3 : 5);
    } else {
      recordMistake({
        questionId: question.id,
        lessonSlug,
        trackId,
        conceptTag: question.conceptTag,
        prompt: question.prompt,
        userAnswer: finalAnswer ?? "",
        correctAnswer: question.correctAnswer,
      });
      reviewQuestion(question.id, slugForCard, 1);
    }
  };

  const retryQuestion = (question: AssessmentQuestion) => {
    setRecordedSummary(false);
    setResponses((prev) => ({
      ...prev,
      [question.id]: {
        answer:
          question.type === "ordering" ? getInitialOrdering(question) : undefined,
        submitted: false,
        isCorrect: false,
        hintsRevealed: prev[question.id]?.hintsRevealed ?? 0,
      },
    }));
  };

  const resetAll = () => {
    setRecordedSummary(false);
    const fresh: Record<string, QuestionState> = {};
    for (const q of questions) {
      if (q.type === "ordering") {
        fresh[q.id] = {
          answer: getInitialOrdering(q),
          submitted: false,
          isCorrect: false,
          hintsRevealed: 0,
        };
      }
    }
    setResponses(fresh);
  };

  if (questions.length === 0) {
    return (
      <div className="swiss-card p-5 text-sm text-[var(--text-muted)]">
        No assessment items are loaded for this section yet.
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            {title}
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            {stats.submittedCount} of {stats.total} answered ·{" "}
            <span className="font-mono swiss-tabular">
              {stats.correctCount}/{stats.total} ({stats.percentage}%)
            </span>
          </p>
        </div>
        {stats.submittedCount > 0 && (
          <button
            type="button"
            onClick={resetAll}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset All
          </button>
        )}
      </div>

      {questions.map((question, idx) => (
        <QuestionCard
          key={question.id}
          index={idx}
          question={question}
          qState={responses[question.id]}
          onUpdateAnswer={(val) => updateAnswer(question.id, val)}
          onRevealHint={() => revealHint(question.id, question.hints.length)}
          onSubmit={(override) => submitQuestion(question, override)}
          onRetry={() => retryQuestion(question)}
        />
      ))}

      {stats.allSubmitted && (
        <div
          className={`swiss-card p-4 ${
            stats.percentage >= passingScore
              ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
              : "border-[var(--accent-amber)] bg-[var(--accent-amber-soft)]"
          }`}
        >
          <p className="text-sm font-semibold text-[var(--text-primary)]">
            Assessment Complete: {stats.correctCount} / {stats.total} (
            {stats.percentage}%)
          </p>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {stats.percentage >= passingScore
              ? "Mastery target achieved. Your score and SM-2 review intervals have been recorded."
              : "Missed concepts have been added to your Mistake Drill and SM-2 spaced repetition queue."}
          </p>
        </div>
      )}
    </section>
  );
}

interface QuestionCardProps {
  index: number;
  question: AssessmentQuestion;
  qState?: QuestionState;
  onUpdateAnswer: (val: AnswerValue) => void;
  onRevealHint: () => void;
  onSubmit: (override?: AnswerValue) => void;
  onRetry: () => void;
}

function QuestionCard({
  index,
  question,
  qState,
  onUpdateAnswer,
  onRevealHint,
  onSubmit,
  onRetry,
}: QuestionCardProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const submitted = qState?.submitted ?? false;
  const isCorrect = qState?.isCorrect ?? false;
  const hintsRevealed = qState?.hintsRevealed ?? 0;

  const shuffledRightOptions = useMemo(() => {
    const pairs = question.matchingPairs ?? [];
    return deterministicShuffle(
      pairs.map((p) => p.right),
      question.id
    );
  }, [question.matchingPairs, question.id]);

  const difficultyBadgeClass =
    question.difficulty === "rigorous"
      ? "border-[var(--accent-crimson)] text-[var(--accent-crimson)]"
      : question.difficulty === "intermediate"
      ? "border-[var(--accent-amber)] text-[var(--accent-amber)]"
      : "border-[var(--accent-emerald)] text-[var(--accent-emerald)]";

  const canSubmit = (() => {
    if (question.type === "simulation-challenge") return true;
    const ans = qState?.answer;
    if (ans === undefined) return false;
    if (typeof ans === "string") return ans.trim().length > 0;
    if (Array.isArray(ans)) return ans.length > 0;
    if (typeof ans === "object") {
      return (
        Object.keys(ans).length >= (question.matchingPairs?.length ?? 1)
      );
    }
    return true;
  })();

  const renderBody = () => {
    // 1. MCQ & option-based predict-output / debugging
    if (
      question.type === "mcq" ||
      ((question.type === "predict-output" || question.type === "debugging") &&
        question.options &&
        question.options.length > 0)
    ) {
      const selectedId =
        typeof qState?.answer === "string" ? qState.answer : undefined;
      return (
        <div className="mt-3 space-y-2">
          {(question.options ?? []).map((opt) => {
            const isSelected = selectedId === opt.id;
            const isOptionCorrect = String(question.correctAnswer) === opt.id;
            let borderStyle = "border-[var(--border-subtle)] bg-[var(--bg-canvas)]";
            if (submitted) {
              if (isOptionCorrect) {
                borderStyle =
                  "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]";
              } else if (isSelected) {
                borderStyle =
                  "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]";
              }
            } else if (isSelected) {
              borderStyle =
                "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]";
            }

            return (
              <div key={opt.id}>
                <button
                  type="button"
                  disabled={submitted}
                  onClick={() => onUpdateAnswer(opt.id)}
                  className={`flex w-full items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-left text-sm transition-colors ${borderStyle}`}
                >
                  <span className="mt-0.5 font-mono text-xs font-semibold uppercase text-[var(--text-muted)]">
                    {opt.id}.
                  </span>
                  <span className="flex-1 text-[var(--text-primary)]">
                    <MathText text={opt.text} />
                  </span>
                </button>
                {submitted && (isSelected || isOptionCorrect) && opt.explanation && (
                  <p className="mt-1 px-2 text-xs text-[var(--text-secondary)]">
                    <MathText text={opt.explanation} />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // 2. Multi-select
    if (question.type === "multi-select") {
      const selected = Array.isArray(qState?.answer) ? qState.answer : [];
      const expectedSet = new Set(
        Array.isArray(question.correctAnswer) ? question.correctAnswer : []
      );
      const toggleOpt = (id: string) => {
        if (submitted) return;
        const next = selected.includes(id)
          ? selected.filter((x) => x !== id)
          : [...selected, id];
        onUpdateAnswer(next);
      };

      return (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[var(--text-muted)]">
            Select all options that apply.
          </p>
          {(question.options ?? []).map((opt) => {
            const checked = selected.includes(opt.id);
            const isExpected = expectedSet.has(opt.id);
            let borderStyle = "border-[var(--border-subtle)] bg-[var(--bg-canvas)]";
            if (submitted) {
              if (isExpected) {
                borderStyle =
                  "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]";
              } else if (checked) {
                borderStyle =
                  "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]";
              }
            } else if (checked) {
              borderStyle =
                "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]";
            }

            return (
              <div key={opt.id}>
                <label
                  className={`flex cursor-pointer items-start gap-2.5 rounded-md border px-3.5 py-2.5 text-sm ${borderStyle}`}
                >
                  <input
                    type="checkbox"
                    disabled={submitted}
                    checked={checked}
                    onChange={() => toggleOpt(opt.id)}
                    className="mt-1"
                  />
                  <span className="flex-1 text-[var(--text-primary)]">
                    <MathText text={opt.text} />
                  </span>
                </label>
                {submitted && (checked || isExpected) && opt.explanation && (
                  <p className="mt-1 px-2 text-xs text-[var(--text-secondary)]">
                    <MathText text={opt.explanation} />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    // 3. True / False
    if (question.type === "true-false") {
      const selectedBool =
        typeof qState?.answer === "boolean" ? qState.answer : undefined;
      const expectedBool =
        typeof question.correctAnswer === "boolean"
          ? question.correctAnswer
          : String(question.correctAnswer).toLowerCase() === "true";

      return (
        <div className="mt-3 grid grid-cols-2 gap-3 max-w-sm">
          {[true, false].map((val) => {
            const isSelected = selectedBool === val;
            let style = "border-[var(--border-subtle)] bg-[var(--bg-canvas)]";
            if (submitted) {
              if (val === expectedBool) {
                style =
                  "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]";
              } else if (isSelected) {
                style =
                  "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]";
              }
            } else if (isSelected) {
              style =
                "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]";
            }

            return (
              <button
                key={String(val)}
                type="button"
                disabled={submitted}
                onClick={() => onUpdateAnswer(val)}
                className={`rounded-md border px-4 py-2 text-sm font-medium ${style}`}
              >
                {val ? "True" : "False"}
              </button>
            );
          })}
        </div>
      );
    }

    // 4. Fill-blank, text-based predict-output/debugging, and math
    if (
      question.type === "fill-blank" ||
      question.type === "predict-output" ||
      question.type === "debugging" ||
      question.type === "math"
    ) {
      const textVal = typeof qState?.answer === "string" ? qState.answer : "";
      return (
        <div className="mt-3">
          <input
            type="text"
            disabled={submitted}
            value={textVal}
            onChange={(e) => onUpdateAnswer(e.target.value)}
            placeholder={
              question.type === "math"
                ? "Enter numeric or symbolic value..."
                : "Type your answer..."
            }
            aria-label={`Answer for question ${index + 1}`}
            className="w-full max-w-lg rounded-md border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3.5 py-2 font-mono text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
          />
          {question.type === "math" && question.numericTolerance !== undefined && (
            <p className="mt-1 text-[11px] text-[var(--text-muted)]">
              Accepted numeric tolerance: ±{question.numericTolerance}
            </p>
          )}
        </div>
      );
    }

    // 5. Ordering (drag-and-drop + accessible Up/Down buttons)
    if (question.type === "ordering") {
      const items = Array.isArray(qState?.answer)
        ? qState.answer
        : getInitialOrdering(question);

      const moveItem = (fromIdx: number, toIdx: number) => {
        if (submitted) return;
        if (toIdx < 0 || toIdx >= items.length) return;
        const copy = [...items];
        const [moved] = copy.splice(fromIdx, 1);
        copy.splice(toIdx, 0, moved);
        onUpdateAnswer(copy);
      };

      return (
        <div className="mt-3 space-y-2">
          <p className="text-xs text-[var(--text-muted)]">
            Drag items or use the arrow buttons to arrange them in the correct order.
          </p>
          <ol className="space-y-1.5">
            {items.map((item, pos) => (
              <li
                key={`${item}-${pos}`}
                draggable={!submitted}
                onDragStart={() => setDragIndex(pos)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex !== null && dragIndex !== pos) {
                    moveItem(dragIndex, pos);
                  }
                  setDragIndex(null);
                }}
                className="flex items-center justify-between gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <GripVertical className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
                  <span className="font-mono text-xs text-[var(--text-muted)] swiss-tabular">
                    {pos + 1}.
                  </span>
                  <span className="text-[var(--text-primary)]">
                    <MathText text={item} />
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    disabled={submitted || pos === 0}
                    onClick={() => moveItem(pos, pos - 1)}
                    aria-label={`Move "${item}" up`}
                    className="rounded border border-[var(--border-subtle)] p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-30"
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={submitted || pos === items.length - 1}
                    onClick={() => moveItem(pos, pos + 1)}
                    aria-label={`Move "${item}" down`}
                    className="rounded border border-[var(--border-subtle)] p-1 text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-30"
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                </span>
              </li>
            ))}
          </ol>
        </div>
      );
    }

    // 6. Matching pairs
    if (question.type === "matching") {
      const pairs: MatchingPair[] = question.matchingPairs ?? [];
      const currentMap =
        typeof qState?.answer === "object" &&
        qState.answer !== null &&
        !Array.isArray(qState.answer)
          ? (qState.answer as Record<string, string>)
          : {};

      const setPair = (pairId: string, rightVal: string) => {
        onUpdateAnswer({ ...currentMap, [pairId]: rightVal });
      };

      return (
        <div className="mt-3 space-y-2.5">
          {pairs.map((pair) => (
            <div
              key={pair.id}
              className="grid gap-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 sm:grid-cols-2 sm:items-center"
            >
              <div className="text-sm font-medium text-[var(--text-primary)]">
                <MathText text={pair.left} />
              </div>
              <select
                disabled={submitted}
                aria-label={`Match for ${pair.left}`}
                value={currentMap[pair.id] ?? ""}
                onChange={(e) => setPair(pair.id, e.target.value)}
                className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
              >
                <option value="">Select matching concept...</option>
                {shuffledRightOptions.map((rightOpt) => (
                  <option key={rightOpt} value={rightOpt}>
                    {rightOpt}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      );
    }

    // 7. Simulation challenge
    if (question.type === "simulation-challenge") {
      const Sim = question.simulatorId
        ? getSimulatorComponent(question.simulatorId)
        : null;

      return (
        <div className="mt-3 space-y-3">
          {question.challengeGoal && (
            <div className="rounded-md border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-3.5 py-2.5 text-xs text-[var(--text-primary)]">
              <strong className="font-semibold">Lab Challenge Goal:</strong>{" "}
              <MathText text={question.challengeGoal} />
            </div>
          )}

          {Sim ? (
            <Sim
              challengeGoal={question.challengeGoal}
              onChallengeComplete={() => onSubmit(true)}
            />
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Simulator not specified for this challenge.
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <article className="swiss-card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold text-[var(--text-muted)] swiss-tabular">
            Q{index + 1}
          </span>
          <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--text-muted)]">
            {question.type}
          </span>
          <span
            className={`rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase ${difficultyBadgeClass}`}
          >
            {question.difficulty}
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--text-muted)]">
          #{question.conceptTag}
        </span>
      </div>

      <div className="mt-3 text-sm font-medium leading-relaxed text-[var(--text-primary)]">
        <MathText text={question.prompt} />
      </div>

      {question.latex && (
        <div className="mt-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2">
          <MathBlock latex={question.latex} />
        </div>
      )}

      {question.codeSnippet && (
        <pre className="mt-3 overflow-x-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 font-mono text-xs text-[var(--text-primary)]">
          <code>{question.codeSnippet}</code>
        </pre>
      )}

      {renderBody()}

      {/* Progressive Hints */}
      {question.hints.length > 0 && hintsRevealed > 0 && (
        <div className="mt-3 space-y-1.5 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
          {question.hints.slice(0, hintsRevealed).map((hint, hIdx) => (
            <p key={hIdx} className="text-xs text-[var(--text-secondary)]">
              <strong className="font-semibold text-[var(--text-primary)]">
                Hint {hIdx + 1}:
              </strong>{" "}
              <MathText text={hint} />
            </p>
          ))}
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-subtle)] pt-3">
        <div className="flex items-center gap-2">
          {!submitted && (
            <button
              type="button"
              disabled={!canSubmit}
              onClick={() =>
                onSubmit(
                  question.type === "simulation-challenge" ? true : undefined
                )
              }
              className="rounded bg-[var(--accent-blue)] px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {question.type === "simulation-challenge"
                ? "Verify Challenge Complete"
                : "Check Answer"}
            </button>
          )}
          {submitted && (
            <button
              type="button"
              onClick={onRetry}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <RotateCcw className="h-3 w-3" />
              Retry
            </button>
          )}
        </div>

        {question.hints.length > 0 && hintsRevealed < question.hints.length && !submitted && (
          <button
            type="button"
            onClick={onRevealHint}
            className="inline-flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            Hint ({hintsRevealed}/{question.hints.length})
          </button>
        )}
      </div>

      {/* Feedback & Explanation */}
      {submitted && (
        <div
          className={`mt-3 rounded-md border p-3.5 text-xs ${
            isCorrect
              ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
              : "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]"
          }`}
        >
          <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
            {isCorrect ? (
              <>
                <CheckCircle2 className="h-4 w-4 text-[var(--accent-emerald)]" />
                <span>Correct</span>
              </>
            ) : (
              <>
                <XCircle className="h-4 w-4 text-[var(--accent-crimson)]" />
                <span>Incorrect</span>
              </>
            )}
          </div>
          <p className="mt-1.5 leading-relaxed text-[var(--text-secondary)]">
            <MathText text={question.explanation} />
          </p>
        </div>
      )}
    </article>
  );
}
