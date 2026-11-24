"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  ExternalLink,
  FileText,
  Layers,
  ListChecks,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AssessmentEngine } from "@/components/assessment/AssessmentEngine";
import { MathBlock, MathText } from "@/components/math/MathText";
import { getSimulatorComponent } from "@/components/simulators/registry";
import { CURRICULUM_PLAN, getCurriculumPlanEntry } from "@/data/curriculumPlan";
import { getDomainById, getTrackById } from "@/data/domains";
import { ALL_GLOSSARY_TERMS } from "@/data/glossary";
import { getSimulatorById } from "@/data/simulators";
import { getUnmetPrerequisites } from "@/lib/curriculumGraph";
import { useLearningStore } from "@/store/learningStore";
import type { DifficultyLevel, Lesson } from "@/types/curriculum";
import { CodeExampleCard } from "./CodeExampleCard";
import { InteractiveDiagram } from "./InteractiveDiagram";
import { LessonNotesDrawer } from "./LessonNotesDrawer";

const EXPLANATION_MODES: Array<{ id: DifficultyLevel; label: string }> = [
  { id: "beginner", label: "Beginner" },
  { id: "intermediate", label: "Intermediate" },
  { id: "advanced", label: "Advanced" },
];

export interface LessonViewProps {
  lesson: Lesson;
}

export function LessonView({ lesson }: LessonViewProps) {
  const {
    state,
    markLessonVisited,
    toggleLessonComplete,
    toggleBookmark,
    isBookmarked,
    setExplanationMode,
  } = useLearningStore();

  const [notesOpen, setNotesOpen] = useState(false);
  const [mechanismIndex, setMechanismIndex] = useState(0);
  const [showAllMechanisms, setShowAllMechanisms] = useState(false);
  const [deepDiveOpen, setDeepDiveOpen] = useState(false);
  const [simChallengeVerified, setSimChallengeVerified] = useState(false);

  useEffect(() => {
    markLessonVisited(lesson.slug);
    setMechanismIndex(0);
    setSimChallengeVerified(false);
  }, [lesson.slug, markLessonVisited]);

  const track = getTrackById(lesson.trackId);
  const domain = getDomainById(lesson.domainId);
  const isCompleted = Boolean(state.completedLessons[lesson.slug]?.completed);
  const bookmarked = isBookmarked(lesson.slug);
  const hasNote = Boolean(state.notes[lesson.slug]?.trim());

  const unmetPrerequisites = useMemo(
    () =>
      getUnmetPrerequisites(
        lesson.slug,
        state.completedLessons,
        CURRICULUM_PLAN
      ),
    [lesson.slug, state.completedLessons]
  );

  const { prevEntry, nextEntry } = useMemo(() => {
    const sorted = [...CURRICULUM_PLAN].sort((a, b) => a.number - b.number);
    const idx = sorted.findIndex((e) => e.slug === lesson.slug);
    return {
      prevEntry: idx > 0 ? sorted[idx - 1] : undefined,
      nextEntry: idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : undefined,
    };
  }, [lesson.slug]);

  const SimulatorComponent = lesson.simulatorId
    ? getSimulatorComponent(lesson.simulatorId)
    : null;
  const simulatorMeta = lesson.simulatorId
    ? getSimulatorById(lesson.simulatorId)
    : undefined;

  const glossaryTerms = useMemo(() => {
    const ids = new Set(lesson.glossaryTermIds);
    return ALL_GLOSSARY_TERMS.filter((t) => ids.has(t.id));
  }, [lesson.glossaryTermIds]);

  const currentMechanism = lesson.mechanisms[mechanismIndex];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:py-10">
      {/* Breadcrumb & Metadata Header */}
      <header className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
          <span>{track ? `Track ${track.number}: ${track.title}` : lesson.trackId}</span>
          <span>/</span>
          <span>{domain?.title ?? lesson.domainId}</span>
          <span>/</span>
          <span className="text-[var(--accent-blue)]">
            Lesson {String(lesson.number).padStart(2, "0")}
          </span>
        </div>

        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          {lesson.moduleTitle} · {lesson.chapterTitle}
        </p>

        <h1 className="mt-1.5 text-2xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-3xl">
          {lesson.title}
        </h1>
        <p className="mt-2 text-base text-[var(--text-secondary)]">
          <MathText text={lesson.subtitle} />
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-[var(--text-secondary)] swiss-tabular">
              <Clock className="h-3.5 w-3.5 text-[var(--text-muted)]" />
              {lesson.estimatedMinutes} min
            </span>
            <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono capitalize text-[var(--text-secondary)]">
              {lesson.difficulty}
            </span>
            {lesson.status !== "complete" && (
              <span className="rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] px-2.5 py-1 font-mono uppercase text-[var(--accent-amber)]">
                {lesson.status}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                hasNote
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              <FileText className="h-3.5 w-3.5" />
              {hasNote ? "Notes (Saved)" : "Notes"}
            </button>

            <button
              type="button"
              onClick={() => toggleBookmark(lesson.slug)}
              aria-pressed={bookmarked}
              className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                bookmarked
                  ? "border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] text-[var(--accent-amber)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {bookmarked ? (
                <BookmarkCheck className="h-3.5 w-3.5" />
              ) : (
                <Bookmark className="h-3.5 w-3.5" />
              )}
              {bookmarked ? "Bookmarked" : "Bookmark"}
            </button>

            <button
              type="button"
              onClick={() => toggleLessonComplete(lesson.slug)}
              aria-pressed={isCompleted}
              className={`inline-flex items-center gap-1.5 rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                isCompleted
                  ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                  : "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white hover:opacity-90"
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <Circle className="h-3.5 w-3.5" />
              )}
              {isCompleted ? "Completed" : "Mark Complete"}
            </button>
          </div>
        </div>
      </header>

      <div className="mt-6 space-y-8">
        {/* Non-blocking Prerequisite Advisory Banner */}
        {unmetPrerequisites.length > 0 && (
          <aside
            aria-label="Prerequisite advisory"
            className="rounded-lg border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] p-4"
          >
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-amber)]" />
              <div className="text-xs leading-relaxed">
                <p className="font-semibold text-[var(--text-primary)]">
                  Prerequisite Advisory (Non-blocking)
                </p>
                <p className="mt-0.5 text-[var(--text-secondary)]">
                  This lesson builds on concepts introduced earlier. You may read freely now or review recommended foundations first:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {unmetPrerequisites.map((prereq) => (
                    <Link
                      key={prereq.slug}
                      href={`/learn/${prereq.slug}`}
                      className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-medium text-[var(--text-primary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                    >
                      <span className="font-mono text-[10px] text-[var(--text-muted)]">
                        #{prereq.number}
                      </span>
                      {prereq.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Depth Explanation Mode Selector */}
        <section className="swiss-card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                Adaptive Depth Lens
              </p>
              <h2 className="mt-0.5 text-base font-semibold">
                Framing &amp; Mental Model
              </h2>
            </div>

            <div
              role="group"
              aria-label="Explanation depth mode"
              className="inline-flex rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-0.5"
            >
              {EXPLANATION_MODES.map((mode) => {
                const active = state.explanationMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setExplanationMode(mode.id)}
                    className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "bg-[var(--accent-blue)] text-white"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {mode.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
            <MathText text={lesson.depthExplanations[state.explanationMode]} />
          </div>
        </section>

        {/* Objectives */}
        {lesson.objectives.length > 0 && (
          <section className="swiss-card p-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2.5">
              <ListChecks className="h-4 w-4 text-[var(--accent-blue)]" />
              <h2 className="text-base font-semibold">Learning Objectives</h2>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-[var(--text-secondary)]">
              {lesson.objectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="mt-1 font-mono text-xs text-[var(--accent-blue)] swiss-tabular">
                    {String(idx + 1).padStart(2, "0")}.
                  </span>
                  <span>
                    <MathText text={obj} />
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Intuition */}
        <section>
          <h2 className="text-lg font-semibold">First-Principles Intuition</h2>
          <div className="mt-2.5 space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
            {lesson.intuition.split("\n\n").map((para, idx) => (
              <p key={idx}>
                <MathText text={para} />
              </p>
            ))}
          </div>
        </section>

        {/* Interactive Diagram */}
        {lesson.diagram && <InteractiveDiagram diagram={lesson.diagram} />}

        {/* Embedded Simulator */}
        {SimulatorComponent && (
          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-blue)]">
                  Interactive Lab · {simulatorMeta?.title ?? lesson.simulatorId}
                </p>
                {lesson.simulatorPrompt && (
                  <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    <MathText text={lesson.simulatorPrompt} />
                  </p>
                )}
              </div>
              {lesson.simulatorId && (
                <Link
                  href={`/labs/${lesson.simulatorId}`}
                  className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                >
                  Open Full Lab
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>

            {simChallengeVerified && (
              <div className="rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-3.5 py-2 text-xs font-medium text-[var(--accent-emerald)]">
                Lab challenge condition verified!
              </div>
            )}

            <SimulatorComponent
              challengeGoal={
                lesson.simulatorPrompt ?? simulatorMeta?.challengeDescription
              }
              onChallengeComplete={() => setSimChallengeVerified(true)}
            />
          </section>
        )}

        {/* Technical Theory + Math Notes */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Technical Theory</h2>
          <div className="space-y-3 text-sm leading-7 text-[var(--text-secondary)]">
            {lesson.technicalTheory.split("\n\n").map((para, idx) => (
              <p key={idx}>
                <MathText text={para} />
              </p>
            ))}
          </div>

          {lesson.mathNotes && lesson.mathNotes.length > 0 && (
            <div className="grid gap-3 pt-2 sm:grid-cols-2">
              {lesson.mathNotes.map((note, idx) => (
                <div key={idx} className="swiss-card p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {note.title}
                  </h3>
                  <div className="my-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2">
                    <MathBlock latex={note.latex} />
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    <MathText text={note.explanation} />
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Step-by-Step Internal Mechanisms */}
        {lesson.mechanisms.length > 0 && (
          <section className="swiss-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
                  Step-by-Step Execution
                </p>
                <h2 className="mt-0.5 text-base font-semibold">
                  Internal Mechanism Walkthrough
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setShowAllMechanisms((prev) => !prev)}
                className="rounded border border-[var(--border-subtle)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              >
                {showAllMechanisms ? "Stepper View" : "Show All Steps"}
              </button>
            </div>

            {showAllMechanisms ? (
              <ol className="mt-4 space-y-3">
                {lesson.mechanisms.map((step) => (
                  <li
                    key={step.step}
                    className="rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="font-mono text-xs font-semibold text-[var(--accent-blue)] swiss-tabular">
                        Step {step.step}
                      </span>
                      <h3 className="text-sm font-semibold">{step.title}</h3>
                    </div>
                    <p className="mt-1.5 text-sm text-[var(--text-secondary)]">
                      <MathText text={step.detail} />
                    </p>
                    {step.stateNote && (
                      <p className="mt-2 rounded bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)]">
                        State: {step.stateNote}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              currentMechanism && (
                <div className="mt-4">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                    {lesson.mechanisms.map((step, idx) => (
                      <button
                        key={step.step}
                        type="button"
                        onClick={() => setMechanismIndex(idx)}
                        className={`rounded border px-2.5 py-1 font-mono text-xs swiss-tabular transition-colors ${
                          idx === mechanismIndex
                            ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] font-semibold text-[var(--accent-blue)]"
                            : "border-[var(--border-subtle)] text-[var(--text-muted)] hover:bg-[var(--bg-subtle)]"
                        }`}
                      >
                        {step.step}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4">
                    <p className="font-mono text-xs text-[var(--accent-blue)] swiss-tabular">
                      Step {currentMechanism.step} of {lesson.mechanisms.length}
                    </p>
                    <h3 className="mt-1 text-base font-semibold">
                      {currentMechanism.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
                      <MathText text={currentMechanism.detail} />
                    </p>
                    {currentMechanism.stateNote && (
                      <p className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]">
                        State: {currentMechanism.stateNote}
                      </p>
                    )}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <button
                      type="button"
                      disabled={mechanismIndex === 0}
                      onClick={() =>
                        setMechanismIndex((prev) => Math.max(0, prev - 1))
                      }
                      className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
                    >
                      <ChevronLeft className="h-3.5 w-3.5" />
                      Previous Step
                    </button>
                    <button
                      type="button"
                      disabled={mechanismIndex >= lesson.mechanisms.length - 1}
                      onClick={() =>
                        setMechanismIndex((prev) =>
                          Math.min(lesson.mechanisms.length - 1, prev + 1)
                        )
                      }
                      className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-3 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] disabled:opacity-40"
                    >
                      Next Step
                      <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              )
            )}
          </section>
        )}

        {/* Code / Worked Examples */}
        {lesson.codeExamples.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">Code &amp; Worked Examples</h2>
            <div className="space-y-4">
              {lesson.codeExamples.map((example, idx) => (
                <CodeExampleCard key={idx} example={example} />
              ))}
            </div>
          </section>
        )}

        {/* Connections Across the Stack */}
        {lesson.connections.length > 0 && (
          <section className="swiss-card p-5">
            <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2.5">
              <Layers className="h-4 w-4 text-[var(--accent-blue)]" />
              <h2 className="text-base font-semibold">
                Connections Across the Stack
              </h2>
            </div>
            <ul className="mt-3 divide-y divide-[var(--border-subtle)]">
              {lesson.connections.map((conn, idx) => {
                const target = getCurriculumPlanEntry(conn.lessonSlug);
                return (
                  <li key={idx} className="py-2.5 first:pt-0 last:pb-0">
                    <Link
                      href={`/learn/${conn.lessonSlug}`}
                      className="text-sm font-medium text-[var(--accent-blue)] hover:underline"
                    >
                      {target
                        ? `Lesson ${target.number}: ${target.title}`
                        : conn.lessonSlug}
                    </Link>
                    <p className="mt-0.5 text-xs text-[var(--text-secondary)]">
                      <MathText text={conn.relationship} />
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Real-World Applications: Simplified Model vs Real Hardware/Software */}
        {lesson.realWorldApplications.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Real-World Engineering &amp; Model Reality Check
            </h2>
            <div className="grid gap-3">
              {lesson.realWorldApplications.map((app, idx) => (
                <div key={idx} className="swiss-card p-4">
                  <h3 className="text-sm font-semibold">{app.title}</h3>
                  <div className="mt-2.5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                        Simplified Model vs. Real Systems
                      </p>
                      <p className="mt-1 leading-relaxed text-[var(--text-secondary)]">
                        <MathText text={app.simplifiedVsReal} />
                      </p>
                    </div>
                    <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 text-xs">
                      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-emerald)]">
                        Modern Production Example
                      </p>
                      <p className="mt-1 leading-relaxed text-[var(--text-secondary)]">
                        <MathText text={app.modernExample} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Common Misconceptions */}
        {lesson.misconceptions.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Common Misconceptions</h2>
            <div className="space-y-2.5">
              {lesson.misconceptions.map((item, idx) => (
                <div
                  key={idx}
                  className="swiss-card grid gap-3 p-4 sm:grid-cols-2"
                >
                  <div>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-crimson)]">
                      Myth
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-primary)]">
                      <MathText text={item.myth} />
                    </p>
                  </div>
                  <div className="border-t border-[var(--border-subtle)] pt-2 sm:border-l sm:border-t-0 sm:pl-4 sm:pt-0">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-emerald)]">
                      Reality
                    </span>
                    <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
                      <MathText text={item.reality} />
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Collapsible Optional Deep Dive */}
        {lesson.deepDive && (
          <section className="swiss-card overflow-hidden">
            <button
              type="button"
              aria-expanded={deepDiveOpen}
              onClick={() => setDeepDiveOpen((prev) => !prev)}
              className="flex w-full items-center justify-between gap-2 px-5 py-4 text-left hover:bg-[var(--bg-subtle)]"
            >
              <div>
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-blue)]">
                  Optional Deep Dive
                </p>
                <h2 className="mt-0.5 text-base font-semibold">
                  {lesson.deepDive.title}
                </h2>
              </div>
              <ChevronDown
                className={`h-4 w-4 text-[var(--text-muted)] transition-transform ${
                  deepDiveOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            {deepDiveOpen && (
              <div className="border-t border-[var(--border-subtle)] px-5 py-4 text-sm leading-7 text-[var(--text-secondary)]">
                {lesson.deepDive.content.split("\n\n").map((para, idx) => (
                  <p key={idx} className="mb-3 last:mb-0">
                    <MathText text={para} />
                  </p>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Revision Notes & Glossary */}
        {(lesson.revisionNotes.length > 0 || glossaryTerms.length > 0) && (
          <section className="grid gap-4 md:grid-cols-2">
            {lesson.revisionNotes.length > 0 && (
              <div className="swiss-card p-5">
                <h2 className="text-base font-semibold">Revision Summary</h2>
                <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[var(--text-secondary)]">
                  {lesson.revisionNotes.map((note, idx) => (
                    <li key={idx}>
                      <MathText text={note} />
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {glossaryTerms.length > 0 && (
              <div className="swiss-card p-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold">Key Terms</h2>
                  <Link
                    href="/glossary"
                    className="text-xs text-[var(--accent-blue)] hover:underline"
                  >
                    Full Glossary
                  </Link>
                </div>
                <dl className="mt-3 space-y-2.5 text-xs">
                  {glossaryTerms.map((term) => (
                    <div key={term.id}>
                      <dt className="font-semibold text-[var(--text-primary)]">
                        {term.term}
                      </dt>
                      <dd className="mt-0.5 text-[var(--text-secondary)]">
                        <MathText text={term.shortDefinition} />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </section>
        )}

        {/* Authoritative References */}
        {lesson.references.length > 0 && (
          <section className="swiss-card p-5">
            <h2 className="text-base font-semibold">
              Authoritative References
            </h2>
            <ul className="mt-3 divide-y divide-[var(--border-subtle)] text-xs">
              {lesson.references.map((ref, idx) => (
                <li key={idx} className="py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <a
                      href={ref.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-[var(--accent-blue)] hover:underline"
                    >
                      {ref.title}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--text-muted)]">
                      {ref.type}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[var(--text-muted)]">
                    {ref.author} — {ref.note}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Knowledge Assessments */}
        <section className="pt-2">
          <AssessmentEngine
            questions={lesson.assessments}
            lessonSlug={lesson.slug}
            trackId={lesson.trackId}
            mode="lesson"
            title="Lesson Knowledge Check"
          />
        </section>

        {/* Prev / Next Lesson Footer */}
        <footer className="grid gap-3 border-t border-[var(--border-subtle)] pt-6 sm:grid-cols-2">
          {prevEntry ? (
            <Link
              href={`/learn/${prevEntry.slug}`}
              className="swiss-card flex items-center gap-3 p-4 hover:border-[var(--accent-blue)]"
            >
              <ArrowLeft className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                  Previous · Lesson {prevEntry.number}
                </p>
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {prevEntry.title}
                </p>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {nextEntry && (
            <Link
              href={`/learn/${nextEntry.slug}`}
              className="swiss-card flex items-center justify-between gap-3 p-4 text-right hover:border-[var(--accent-blue)]"
            >
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                  Next · Lesson {nextEntry.number}
                </p>
                <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                  {nextEntry.title}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
            </Link>
          )}
        </footer>
      </div>

      <LessonNotesDrawer
        open={notesOpen}
        onClose={() => setNotesOpen(false)}
        lessonSlug={lesson.slug}
        lessonTitle={lesson.title}
      />
    </div>
  );
}
