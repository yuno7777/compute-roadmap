"use client";

import {
  AlertCircle,
  Award,
  Brain,
  CheckCircle2,
  Filter,
  Layers,
  RotateCcw,
  RotateCw,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { AssessmentEngine } from "@/components/assessment/AssessmentEngine";
import { MathText } from "@/components/math/MathText";
import { getCurriculumPlanEntry } from "@/data/curriculumPlan";
import { DOMAINS, TRACKS, getDomainById } from "@/data/domains";
import { ALL_TRACK_EXAMS } from "@/data/exams";
import { ALL_LESSONS } from "@/data/lessons";
import { getWeakConceptTags } from "@/lib/curriculumGraph";
import { getDueCards } from "@/lib/spacedRepetition";
import { useLearningStore } from "@/store/learningStore";
import type { AssessmentQuestion } from "@/types/assessment";
import type { DomainId, TrackId } from "@/types/curriculum";

type ReviewTab = "sm2" | "mistakes" | "weak" | "flashcards" | "exams";

const QUALITY_BUTTONS = [
  { q: 0, label: "0 · Blackout", tone: "crimson" },
  { q: 1, label: "1 · Wrong", tone: "crimson" },
  { q: 2, label: "2 · Hard miss", tone: "amber" },
  { q: 3, label: "3 · Hard pass", tone: "amber" },
  { q: 4, label: "4 · Good", tone: "blue" },
  { q: 5, label: "5 · Perfect", tone: "emerald" },
];

export default function ReviewPage() {
  const { state, reviewQuestion, resolveMistake } = useLearningStore();
  const [activeTab, setActiveTab] = useState<ReviewTab>("sm2");
  const [revealedCardId, setRevealedCardId] = useState<string | null>(null);
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [flashcardFlipped, setFlashcardFlipped] = useState(false);
  const [selectedExamTrack, setSelectedExamTrack] = useState<TrackId>("track-1");
  const [scopeTrack, setScopeTrack] = useState<TrackId | "all">("all");
  const [scopeDomain, setScopeDomain] = useState<DomainId | "all">("all");

  const availableDomains = useMemo(() => {
    if (scopeTrack === "all") return DOMAINS;
    return DOMAINS.filter((d) => d.trackId === scopeTrack);
  }, [scopeTrack]);

  const matchesScope = useCallback(
    (lessonSlug?: string, explicitTrackId?: TrackId) => {
      if (scopeTrack === "all" && scopeDomain === "all") return true;
      const entry = lessonSlug ? getCurriculumPlanEntry(lessonSlug) : undefined;
      const resolvedTrack = explicitTrackId ?? entry?.trackId;
      const resolvedDomain = entry?.domainId;

      if (scopeTrack !== "all" && resolvedTrack !== scopeTrack) return false;
      if (scopeDomain !== "all" && resolvedDomain !== scopeDomain) return false;
      return true;
    },
    [scopeTrack, scopeDomain]
  );

  const questionIndex = useMemo(() => {
    const map = new Map<
      string,
      { question: AssessmentQuestion; lessonSlug: string; lessonTitle: string }
    >();
    for (const lesson of ALL_LESSONS) {
      for (const q of lesson.assessments) {
        map.set(q.id, {
          question: q,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
        });
      }
    }
    for (const exam of ALL_TRACK_EXAMS) {
      for (const q of exam.questions) {
        if (!map.has(q.id)) {
          map.set(q.id, {
            question: q,
            lessonSlug: exam.trackId,
            lessonTitle: exam.title,
          });
        }
      }
    }
    return map;
  }, []);

  const dueCards = useMemo(
    () =>
      getDueCards(state.reviewCards).filter((card) =>
        matchesScope(card.lessonSlug)
      ),
    [state.reviewCards, matchesScope]
  );

  const unresolvedMistakes = useMemo(
    () =>
      state.mistakes.filter(
        (m) => !m.resolved && matchesScope(m.lessonSlug, m.trackId)
      ),
    [state.mistakes, matchesScope]
  );

  const scopedMistakes = useMemo(
    () =>
      state.mistakes.filter((m) => matchesScope(m.lessonSlug, m.trackId)),
    [state.mistakes, matchesScope]
  );

  const weakTags = useMemo(
    () => getWeakConceptTags(scopedMistakes, 8),
    [scopedMistakes]
  );

  const { adaptiveQuestions, prioritizedMistakeCount, prioritizedDueCount } =
    useMemo(() => {
      const seen = new Set<string>();
      const collected: AssessmentQuestion[] = [];
      let mistakeCount = 0;
      let dueCount = 0;

      const pushUnique = (q: AssessmentQuestion | undefined): boolean => {
        if (!q || seen.has(q.id) || collected.length >= 10) return false;
        seen.add(q.id);
        collected.push(q);
        return true;
      };

      // 1. Prioritize unresolved mistakes in the selected scope
      for (const mistake of unresolvedMistakes) {
        const entry = questionIndex.get(mistake.questionId);
        if (pushUnique(entry?.question)) {
          mistakeCount += 1;
        }
      }

      // 2. Prioritize due SM-2 cards in the selected scope
      for (const card of dueCards) {
        const entry = questionIndex.get(card.questionId);
        if (pushUnique(entry?.question)) {
          dueCount += 1;
        }
      }

      // 3. Questions matching weak concept tags in scope
      const weakSet = new Set(weakTags.map((w) => w.conceptTag));
      for (const lesson of ALL_LESSONS) {
        if (!matchesScope(lesson.slug, lesson.trackId)) continue;
        for (const q of lesson.assessments) {
          if (weakSet.has(q.conceptTag)) {
            pushUnique(q);
          }
        }
      }

      // 4. When scoped to a specific Track or Domain, fill up to 10 module/domain items
      if (scopeTrack !== "all" || scopeDomain !== "all") {
        for (const lesson of ALL_LESSONS) {
          if (!matchesScope(lesson.slug, lesson.trackId)) continue;
          for (const q of lesson.assessments) {
            pushUnique(q);
          }
        }
      }

      return {
        adaptiveQuestions: collected,
        prioritizedMistakeCount: mistakeCount,
        prioritizedDueCount: dueCount,
      };
    }, [
      unresolvedMistakes,
      dueCards,
      weakTags,
      questionIndex,
      matchesScope,
      scopeTrack,
      scopeDomain,
    ]);

  const flashcards = useMemo(() => {
    const cards: Array<{
      id: string;
      front: string;
      back: string;
      lessonSlug: string;
      lessonTitle: string;
    }> = [];
    for (const lesson of ALL_LESSONS) {
      lesson.revisionNotes.forEach((note, idx) => {
        cards.push({
          id: `${lesson.slug}-rev-${idx}`,
          front: `${lesson.title} — Key Concept #${idx + 1}`,
          back: note,
          lessonSlug: lesson.slug,
          lessonTitle: lesson.title,
        });
      });
    }
    return cards;
  }, []);

  const currentExam = useMemo(
    () => ALL_TRACK_EXAMS.find((e) => e.trackId === selectedExamTrack),
    [selectedExamTrack]
  );

  const tabs: Array<{ id: ReviewTab; label: string; count?: number }> = [
    { id: "sm2", label: "SM-2 Due Queue", count: dueCards.length },
    { id: "mistakes", label: "Mistake Drill", count: unresolvedMistakes.length },
    {
      id: "weak",
      label: "Adaptive Practice",
      count:
        scopeTrack !== "all" || scopeDomain !== "all"
          ? adaptiveQuestions.length
          : weakTags.length,
    },
    { id: "flashcards", label: "Revision Flashcards", count: flashcards.length },
    { id: "exams", label: "Track Exams", count: ALL_TRACK_EXAMS.length },
  ];

  const activeDueCard = dueCards[0];
  const activeDueDetail = activeDueCard
    ? questionIndex.get(activeDueCard.questionId)
    : undefined;

  const activeFlashcard =
    flashcards[flashcardIndex % Math.max(1, flashcards.length)];

  const scopeLabel = useMemo(() => {
    if (scopeDomain !== "all") {
      return getDomainById(scopeDomain)?.title ?? scopeDomain;
    }
    if (scopeTrack !== "all") {
      const t = TRACKS.find((tr) => tr.id === scopeTrack);
      return t ? `Track ${t.number}: ${t.title}` : scopeTrack;
    }
    return "All Domains";
  }, [scopeTrack, scopeDomain]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="border-b border-[var(--border-subtle)] pb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
          Active Recall &amp; Verification
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Spaced Repetition, Mistake Drills &amp; Track Exams
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Strengthen long-term retention with SM-2 scheduling, resolve past errors, run domain-scoped adaptive practice, and pass cumulative Track examinations.
        </p>
      </header>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Review modes"
        className="flex flex-wrap gap-2 border-b border-[var(--border-subtle)] pb-3"
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              type="button"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="rounded bg-[var(--bg-canvas)] px-1.5 py-0.5 font-mono text-[10px] swiss-tabular">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Domain / Track Scope Bar for SM-2, Mistakes, and Adaptive Practice */}
      {(activeTab === "sm2" ||
        activeTab === "mistakes" ||
        activeTab === "weak") && (
        <div className="swiss-card flex flex-wrap items-center gap-3 p-3.5">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
            <Filter className="h-3.5 w-3.5" />
            <span>Practice Scope</span>
          </div>

          <select
            aria-label="Filter practice by track"
            value={scopeTrack}
            onChange={(e) => {
              setScopeTrack(e.target.value as TrackId | "all");
              setScopeDomain("all");
            }}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="all">All 6 Tracks</option>
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>
                Track {t.number}: {t.title}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter practice by domain"
            value={scopeDomain}
            onChange={(e) =>
              setScopeDomain(e.target.value as DomainId | "all")
            }
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
          >
            <option value="all">
              All Domains ({availableDomains.length})
            </option>
            {availableDomains.map((d) => (
              <option key={d.id} value={d.id}>
                {d.order}. {d.title}
              </option>
            ))}
          </select>

          {(scopeTrack !== "all" || scopeDomain !== "all") && (
            <button
              type="button"
              onClick={() => {
                setScopeTrack("all");
                setScopeDomain("all");
              }}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <RotateCcw className="h-3 w-3" />
              All Domains
            </button>
          )}
        </div>
      )}

      {/* 1. SM-2 Spaced Repetition Queue */}
      {activeTab === "sm2" && (
        <section className="space-y-4">
          {!activeDueCard ? (
            <div className="swiss-card p-8 text-center">
              <Brain className="mx-auto h-7 w-7 text-[var(--accent-emerald)]" />
              <h2 className="mt-2 text-base font-semibold">
                All SM-2 cards in {scopeLabel} are caught up
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Total cards tracked:{" "}
                <span className="font-mono">
                  {Object.keys(state.reviewCards).length}
                </span>
                . Answering questions inside any lesson automatically schedules SM-2 review intervals.
              </p>
            </div>
          ) : (
            <div className="swiss-card p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
                <div>
                  <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-blue)]">
                    Due Card 1 of {dueCards.length} ({scopeLabel})
                  </span>
                  <p className="text-xs text-[var(--text-muted)]">
                    Lesson:{" "}
                    {getCurriculumPlanEntry(activeDueCard.lessonSlug)?.title ??
                      activeDueCard.lessonSlug}
                  </p>
                </div>
                <span className="font-mono text-xs text-[var(--text-muted)] swiss-tabular">
                  EF {activeDueCard.easeFactor.toFixed(2)} · Reps{" "}
                  {activeDueCard.repetitions}
                </span>
              </div>

              {activeDueDetail ? (
                <>
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    <MathText text={activeDueDetail.question.prompt} />
                  </div>
                  {activeDueDetail.question.codeSnippet && (
                    <pre className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 font-mono text-xs">
                      <code>{activeDueDetail.question.codeSnippet}</code>
                    </pre>
                  )}

                  {revealedCardId !== activeDueCard.questionId ? (
                    <button
                      type="button"
                      onClick={() => setRevealedCardId(activeDueCard.questionId)}
                      className="rounded bg-[var(--accent-blue)] px-4 py-2 text-xs font-medium text-white hover:opacity-90"
                    >
                      Reveal Answer &amp; Explanation
                    </button>
                  ) : (
                    <div className="space-y-4">
                      <div className="rounded-md border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] p-4 text-xs">
                        <p className="font-semibold text-[var(--text-primary)]">
                          Correct Answer:{" "}
                          <span className="font-mono">
                            {JSON.stringify(
                              activeDueDetail.question.correctAnswer
                            )}
                          </span>
                        </p>
                        <p className="mt-1.5 leading-relaxed text-[var(--text-secondary)]">
                          <MathText text={activeDueDetail.question.explanation} />
                        </p>
                      </div>

                      <div>
                        <p className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
                          Rate your recall quality (SM-2 scale 0–5):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {QUALITY_BUTTONS.map((btn) => (
                            <button
                              key={btn.q}
                              type="button"
                              onClick={() => {
                                reviewQuestion(
                                  activeDueCard.questionId,
                                  activeDueCard.lessonSlug,
                                  btn.q
                                );
                                setRevealedCardId(null);
                              }}
                              className="rounded border border-[var(--border-strong)] bg-[var(--bg-canvas)] px-3 py-1.5 font-mono text-xs hover:border-[var(--accent-blue)] hover:bg-[var(--bg-subtle)]"
                            >
                              {btn.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="space-y-3 text-xs text-[var(--text-secondary)]">
                  <p>
                    Question ID: <code>{activeDueCard.questionId}</code>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {QUALITY_BUTTONS.map((btn) => (
                      <button
                        key={btn.q}
                        type="button"
                        onClick={() =>
                          reviewQuestion(
                            activeDueCard.questionId,
                            activeDueCard.lessonSlug,
                            btn.q
                          )
                        }
                        className="rounded border border-[var(--border-subtle)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-subtle)]"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {/* 2. Mistake Drill */}
      {activeTab === "mistakes" && (
        <section className="space-y-3">
          {unresolvedMistakes.length === 0 ? (
            <div className="swiss-card p-8 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-[var(--accent-emerald)]" />
              <h2 className="mt-2 text-base font-semibold">
                No unresolved mistakes logged in {scopeLabel}
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Any missed quiz or exam question is recorded here for targeted follow-up.
              </p>
            </div>
          ) : (
            unresolvedMistakes.map((mistake) => {
              const entry = mistake.lessonSlug
                ? getCurriculumPlanEntry(mistake.lessonSlug)
                : undefined;
              return (
                <article key={mistake.id} className="swiss-card p-5 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs text-[var(--accent-crimson)]">
                      <AlertCircle className="h-3.5 w-3.5" />
                      #{mistake.conceptTag}
                    </span>
                    {entry && (
                      <Link
                        href={`/learn/${entry.slug}`}
                        className="text-xs text-[var(--accent-blue)] hover:underline"
                      >
                        Review Lesson {entry.number}: {entry.title}
                      </Link>
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    <MathText text={mistake.prompt} />
                  </p>
                  <div className="grid gap-2 text-xs sm:grid-cols-2">
                    <div className="rounded border border-[var(--border-subtle)] bg-[var(--accent-crimson-soft)] p-2.5">
                      <span className="font-mono text-[10px] uppercase text-[var(--accent-crimson)]">
                        Your Answer
                      </span>
                      <p className="mt-0.5 font-mono">
                        {JSON.stringify(mistake.userAnswer)}
                      </p>
                    </div>
                    <div className="rounded border border-[var(--border-subtle)] bg-[var(--accent-emerald-soft)] p-2.5">
                      <span className="font-mono text-[10px] uppercase text-[var(--accent-emerald)]">
                        Expected Answer
                      </span>
                      <p className="mt-0.5 font-mono">
                        {JSON.stringify(mistake.correctAnswer)}
                      </p>
                    </div>
                  </div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => resolveMistake(mistake.id)}
                      className="rounded border border-[var(--border-subtle)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                    >
                      Mark Resolved
                    </button>
                  </div>
                </article>
              );
            })
          )}
        </section>
      )}

      {/* 3. Domain-Scoped & Weak-Topic Adaptive Practice */}
      {activeTab === "weak" && (
        <section className="space-y-4">
          {weakTags.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {weakTags.map((tag) => (
                <div key={tag.conceptTag} className="swiss-card p-4">
                  <p className="font-mono text-xs font-semibold text-[var(--accent-amber)]">
                    #{tag.conceptTag}
                  </p>
                  <p className="mt-1 font-mono text-lg font-semibold swiss-tabular">
                    {tag.unresolvedCount} open
                  </p>
                  <p className="text-[11px] text-[var(--text-muted)]">
                    {tag.totalCount} total misses
                  </p>
                </div>
              ))}
            </div>
          )}

          {adaptiveQuestions.length === 0 ? (
            <div className="swiss-card p-8 text-center">
              <Target className="mx-auto h-7 w-7 text-[var(--accent-blue)]" />
              <h2 className="mt-2 text-base font-semibold">
                Select a Track or Domain above for focused practice
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                No weak concept tags or due cards are queued across all domains yet. Choose any of the 6 Tracks or 24 Domains above to drill module questions immediately.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="swiss-card flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-xs text-[var(--text-secondary)]">
                <span>
                  Scope:{" "}
                  <strong className="font-semibold text-[var(--text-primary)]">
                    {scopeLabel}
                  </strong>
                </span>
                <span className="font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
                  Prioritizing {prioritizedMistakeCount} unresolved mistake
                  {prioritizedMistakeCount === 1 ? "" : "s"} ·{" "}
                  {prioritizedDueCount} due SM-2 card
                  {prioritizedDueCount === 1 ? "" : "s"}
                </span>
              </div>

              <AssessmentEngine
                key={`${scopeTrack}-${scopeDomain}`}
                questions={adaptiveQuestions}
                mode="practice"
                title={`Adaptive Practice Set · ${scopeLabel}`}
              />
            </div>
          )}
        </section>
      )}

      {/* 4. Revision Flashcards */}
      {activeTab === "flashcards" && (
        <section className="space-y-4">
          {flashcards.length === 0 ? (
            <div className="swiss-card p-8 text-center">
              <Layers className="mx-auto h-7 w-7 text-[var(--text-muted)]" />
              <h2 className="mt-2 text-base font-semibold">
                No revision flashcards loaded yet
              </h2>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Flashcards are generated automatically from lesson revision notes once lessons are wired into <code>src/data/lessons/index.ts</code>.
              </p>
            </div>
          ) : (
            activeFlashcard && (
              <div className="swiss-card p-6 space-y-4">
                <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
                  <span className="font-mono swiss-tabular">
                    Card {(flashcardIndex % flashcards.length) + 1} /{" "}
                    {flashcards.length}
                  </span>
                  <Link
                    href={`/learn/${activeFlashcard.lessonSlug}`}
                    className="text-[var(--accent-blue)] hover:underline"
                  >
                    {activeFlashcard.lessonTitle}
                  </Link>
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setFlashcardFlipped((p) => !p)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setFlashcardFlipped((p) => !p);
                    }
                  }}
                  className="min-h-[160px] cursor-pointer rounded-md border border-[var(--border-strong)] bg-[var(--bg-canvas)] p-6 flex flex-col justify-center"
                >
                  <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                    {flashcardFlipped ? "Revision Note" : "Prompt (Click to flip)"}
                  </p>
                  <p className="mt-2 text-base font-medium leading-relaxed text-[var(--text-primary)]">
                    <MathText
                      text={
                        flashcardFlipped
                          ? activeFlashcard.back
                          : activeFlashcard.front
                      }
                    />
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setFlashcardFlipped((p) => !p)}
                    className="inline-flex items-center gap-1.5 rounded border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-subtle)]"
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    Flip Card
                  </button>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIndex(
                          (prev) =>
                            (prev - 1 + flashcards.length) % flashcards.length
                        );
                      }}
                      className="rounded border border-[var(--border-subtle)] px-3 py-1.5 text-xs hover:bg-[var(--bg-subtle)]"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setFlashcardFlipped(false);
                        setFlashcardIndex(
                          (prev) => (prev + 1) % flashcards.length
                        );
                      }}
                      className="rounded bg-[var(--accent-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
                    >
                      Next Card
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </section>
      )}

      {/* 5. Track Cumulative Examinations */}
      {activeTab === "exams" && (
        <section className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRACKS.map((track) => {
              const exam = ALL_TRACK_EXAMS.find((e) => e.trackId === track.id);
              const score = state.examScores[track.id];
              const selected = selectedExamTrack === track.id;

              return (
                <button
                  key={track.id}
                  type="button"
                  onClick={() => setSelectedExamTrack(track.id)}
                  className={`swiss-card p-4 text-left transition-colors ${
                    selected
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                      : "hover:border-[var(--border-strong)]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-blue)]">
                      Track {track.number} Exam
                    </span>
                    {score?.passed && (
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--accent-emerald)]">
                        <Award className="h-3 w-3" />
                        Passed ({score.bestPercentage}%)
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm font-semibold">{track.title}</p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
                    {exam ? `${exam.questions.length} questions` : "Pending"}
                    {score && !score.passed
                      ? ` · Best ${score.bestPercentage}%`
                      : ""}
                  </p>
                </button>
              );
            })}
          </div>

          {currentExam ? (
            <div className="space-y-4">
              <div className="swiss-card p-5">
                <h2 className="text-lg font-semibold">{currentExam.title}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {currentExam.description}
                </p>
                <p className="mt-2 font-mono text-xs text-[var(--text-muted)]">
                  Passing threshold: {currentExam.passingScore}%
                </p>
              </div>
              <AssessmentEngine
                key={currentExam.id}
                questions={currentExam.questions}
                trackId={currentExam.trackId}
                mode="exam"
                passingScore={currentExam.passingScore}
                title={currentExam.title}
              />
            </div>
          ) : (
            <div className="swiss-card p-8 text-center text-sm text-[var(--text-muted)]">
              Track exam questions for {selectedExamTrack} are pending barrel integration in{" "}
              <code>src/data/exams/index.ts</code>.
            </div>
          )}
        </section>
      )}
    </div>
  );
}
