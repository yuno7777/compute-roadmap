"use client";

import {
  ArrowRight,
  BookOpen,
  Compass,
  Cpu,
  Flame,
  GitBranch,
  Play,
  Target,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import { ComputeLogo } from "@/components/layout/ComputeLogo";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { DOMAINS, TRACKS, getDomainsByTrack } from "@/data/domains";
import { SIMULATOR_CATALOG } from "@/data/simulators";
import {
  getDomainMastery,
  getLessonsCompletedTodayCount,
  getRecommendedNextLesson,
  getTrackMastery,
} from "@/lib/curriculumGraph";
import { useLearningStore } from "@/store/learningStore";

export default function HomePage() {
  const { state, hydrated } = useLearningStore();

  const completedCount = useMemo(
    () =>
      CURRICULUM_PLAN.filter((e) => state.completedLessons[e.slug]?.completed)
        .length,
    [state.completedLessons]
  );

  const completedTodayCount = useMemo(
    () => (hydrated ? getLessonsCompletedTodayCount(state.completedLessons) : 0),
    [hydrated, state.completedLessons]
  );

  const recommended = useMemo(
    () => getRecommendedNextLesson(state.completedLessons, CURRICULUM_PLAN),
    [state.completedLessons]
  );

  const continueEntry = useMemo(() => {
    const visited = Object.values(state.completedLessons)
      .filter((p) => !p.completed)
      .sort((a, b) => b.lastVisitedAt.localeCompare(a.lastVisitedAt));
    if (visited.length > 0) {
      return CURRICULUM_PLAN.find((e) => e.slug === visited[0].lessonSlug);
    }
    return undefined;
  }, [state.completedLessons]);

  const primaryCtaEntry =
    continueEntry ?? recommended ?? CURRICULUM_PLAN[0];
  const hasStarted = Object.keys(state.completedLessons).length > 0;

  const dailyPct = Math.min(
    100,
    Math.round(
      (state.todayMinutes / Math.max(1, state.dailyGoalMinutes)) * 100
    )
  );

  const featuredLabs = SIMULATOR_CATALOG.slice(0, 6);

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-8 sm:px-6 lg:py-10">
      {/* Executive Hero + Daily Goal / Continue Learning */}
      <section className="grid gap-6 lg:grid-cols-3">
        <div className="swiss-card flex flex-col justify-between p-6 lg:col-span-2">
          <div>
            <div className="flex items-center gap-2.5">
              <ComputeLogo size={26} />
              <p className="font-mono text-xs uppercase tracking-widest text-[var(--accent-blue)]">
                COMPUTE · First-Principles Computing Curriculum
              </p>
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              From Electrons to Artificial Intelligence
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              A rigorous, interactive engineering textbook spanning{" "}
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {TRACKS.length}
              </span>{" "}
              tracks,{" "}
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {DOMAINS.length}
              </span>{" "}
              domains,{" "}
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {CURRICULUM_PLAN.length}
              </span>{" "}
              interconnected lessons, and{" "}
              <span className="font-mono font-medium text-[var(--text-primary)]">
                {SIMULATOR_CATALOG.length}
              </span>{" "}
              live hardware, systems, and AI simulators.
            </p>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href={`/learn/${primaryCtaEntry.slug}`}
              className="inline-flex items-center gap-2 rounded-md bg-[var(--accent-blue)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
            >
              <Play className="h-4 w-4" />
              {hasStarted
                ? `Continue: Lesson ${primaryCtaEntry.number}`
                : 'Start Lesson 1: "What Is an Electron?"'}
            </Link>

            <Link
              href="/graph"
              className="inline-flex items-center gap-2 rounded-md border border-[var(--border-strong)] bg-[var(--bg-surface)] px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]"
            >
              <GitBranch className="h-4 w-4 text-[var(--accent-blue)]" />
              Explore Knowledge Graph
            </Link>

            <Link
              href="/curriculum"
              className="inline-flex items-center gap-1.5 px-2 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Full Syllabus
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        {/* Daily Goal, Streak & Recommended Next */}
        <aside className="swiss-card flex flex-col justify-between gap-5 p-6">
          <div>
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <Target className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
                Daily Study Goal
              </span>
              <span className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--text-primary)] swiss-tabular">
                <Flame className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
                {state.streakDays}d streak
              </span>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <span className="font-mono text-2xl font-semibold swiss-tabular">
                {state.todayMinutes} min
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)] swiss-tabular">
                of {state.dailyGoalMinutes} min goal
              </span>
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
              <div
                className="h-full bg-[var(--accent-blue)] transition-all"
                style={{ width: `${dailyPct}%` }}
              />
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)] swiss-tabular">
              <span>
                Completed today:{" "}
                <span className="font-mono font-medium text-[var(--text-primary)]">
                  {completedTodayCount} lesson
                  {completedTodayCount === 1 ? "" : "s"}
                </span>
              </span>
              <span>
                Total: {completedCount}/{CURRICULUM_PLAN.length}
              </span>
            </div>
          </div>

          {recommended && (
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-emerald)]">
                Recommended Next Lesson
              </p>
              <Link
                href={`/learn/${recommended.slug}`}
                className="mt-1 block text-sm font-semibold text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
              >
                {String(recommended.number).padStart(2, "0")}.{" "}
                {recommended.title}
              </Link>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {recommended.moduleTitle}
              </p>
            </div>
          )}
        </aside>
      </section>

      {/* 6-Track & 24-Domain Overview */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">
              6-Track &amp; 24-Domain Architecture
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Just-in-time math and physics integrated directly into engineering layers.
            </p>
          </div>
          <Link
            href="/progress"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-blue)] hover:underline"
          >
            Detailed Mastery Report
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((track) => {
            const mastery = getTrackMastery(
              track.id,
              state.completedLessons,
              state.lessonQuizScores
            );
            const domains = getDomainsByTrack(track.id);

            return (
              <article key={track.id} className="swiss-card flex flex-col justify-between p-5">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--accent-blue)]">
                      Track {track.number}
                    </span>
                    <span className="font-mono text-xs text-[var(--text-muted)] swiss-tabular">
                      {mastery.completed}/{mastery.total} ({mastery.percentage}%)
                    </span>
                  </div>
                  <h3 className="mt-1 text-base font-semibold">{track.title}</h3>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {track.subtitle}
                  </p>

                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                    <div
                      className="h-full bg-[var(--accent-emerald)]"
                      style={{ width: `${mastery.percentage}%` }}
                    />
                  </div>

                  <ul className="mt-4 space-y-1.5">
                    {domains.map((domain) => {
                      const dMastery = getDomainMastery(
                        domain.id,
                        state.completedLessons
                      );
                      return (
                        <li
                          key={domain.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <Link
                            href={`/curriculum?domain=${domain.id}`}
                            className="truncate text-[var(--text-secondary)] hover:text-[var(--accent-blue)]"
                          >
                            {domain.title}
                          </Link>
                          <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
                            {dMastery.completed}/{dMastery.total}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="mt-4 border-t border-[var(--border-subtle)] pt-3">
                  <Link
                    href={`/curriculum?track=${track.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-blue)] hover:underline"
                  >
                    Open Track {track.number}
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Interactive Labs Showcase */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">Interactive Engineering Labs</h2>
            <p className="text-xs text-[var(--text-muted)]">
              {SIMULATOR_CATALOG.length} deterministic simulations from Ohm&apos;s law and CMOS to Raft consensus and KV-cache quantization.
            </p>
          </div>
          <Link
            href="/labs"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--accent-blue)] hover:underline"
          >
            View All {SIMULATOR_CATALOG.length} Labs
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featuredLabs.map((sim) => (
            <Link
              key={sim.id}
              href={`/labs/${sim.id}`}
              className="swiss-card flex flex-col justify-between p-4 hover:border-[var(--accent-blue)]"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent-blue)]">
                    <Cpu className="h-3 w-3" />
                    {sim.category}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {sim.id}
                  </span>
                </div>
                <h3 className="mt-1.5 text-sm font-semibold text-[var(--text-primary)]">
                  {sim.title}
                </h3>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {sim.subtitle}
                </p>
              </div>
              <p className="mt-3 text-[11px] font-medium text-[var(--accent-blue)]">
                Launch Simulator →
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Graph & Review Quick Links */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/graph"
          className="swiss-card flex items-start gap-4 p-5 hover:border-[var(--accent-blue)]"
        >
          <Compass className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent-blue)]" />
          <div>
            <h3 className="text-base font-semibold">
              Interactive Prerequisite DAG
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Inspect all 58 lessons across 6 tracks, trace upstream physics &amp; math prerequisites, and see what each concept unlocks.
            </p>
          </div>
        </Link>

        <Link
          href="/review"
          className="swiss-card flex items-start gap-4 p-5 hover:border-[var(--accent-blue)]"
        >
          <BookOpen className="mt-0.5 h-6 w-6 shrink-0 text-[var(--accent-emerald)]" />
          <div>
            <h3 className="text-base font-semibold">
              Spaced Repetition &amp; Track Exams
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Drill SM-2 due cards, resolve logged mistakes, practice weak concept tags, and pass cumulative Track Exams.
            </p>
          </div>
        </Link>
      </section>
    </div>
  );
}
