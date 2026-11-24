import { ArrowLeft, ArrowRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LessonView } from "@/components/lesson/LessonView";
import { getSimulatorComponent } from "@/components/simulators/registry";
import { CURRICULUM_PLAN, getCurriculumPlanEntry } from "@/data/curriculumPlan";
import { getDomainById, getTrackById } from "@/data/domains";
import { getLessonBySlug } from "@/data/lessons";
import { getSimulatorById } from "@/data/simulators";

export function generateStaticParams() {
  return CURRICULUM_PLAN.map((entry) => ({
    slug: entry.slug,
  }));
}

export default async function LearnLessonPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lesson = getLessonBySlug(slug);

  if (lesson) {
    return <LessonView lesson={lesson} />;
  }

  const planEntry = getCurriculumPlanEntry(slug);
  if (!planEntry) {
    notFound();
  }

  // Graceful fallback when lesson content barrel is not yet populated
  const track = getTrackById(planEntry.trackId);
  const domain = getDomainById(planEntry.domainId);
  const sorted = [...CURRICULUM_PLAN].sort((a, b) => a.number - b.number);
  const idx = sorted.findIndex((e) => e.slug === planEntry.slug);
  const prevEntry = idx > 0 ? sorted[idx - 1] : undefined;
  const nextEntry =
    idx >= 0 && idx < sorted.length - 1 ? sorted[idx + 1] : undefined;

  const SimComponent = planEntry.simulatorId
    ? getSimulatorComponent(planEntry.simulatorId)
    : null;
  const simMeta = planEntry.simulatorId
    ? getSimulatorById(planEntry.simulatorId)
    : undefined;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:py-10">
      <header className="border-b border-[var(--border-subtle)] pb-6">
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs text-[var(--text-muted)]">
          <span>{track ? `Track ${track.number}: ${track.title}` : planEntry.trackId}</span>
          <span>/</span>
          <span>{domain?.title ?? planEntry.domainId}</span>
          <span>/</span>
          <span className="text-[var(--accent-blue)]">
            Lesson {String(planEntry.number).padStart(2, "0")}
          </span>
        </div>
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
          {planEntry.moduleTitle} · {planEntry.chapterTitle}
        </p>
        <h1 className="mt-1.5 text-2xl font-semibold sm:text-3xl">
          {planEntry.title}
        </h1>
      </header>

      <div className="swiss-card border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] p-5">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-[var(--accent-amber)]" />
          <div className="text-sm">
            <h2 className="font-semibold text-[var(--text-primary)]">
              Lesson Content Pending Integration
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
              This lesson is registered in the curriculum plan (Lesson{" "}
              {planEntry.number} of {CURRICULUM_PLAN.length}), and its full textbook content module has not yet been wired into{" "}
              <code>src/data/lessons/index.ts</code>. You can inspect its prerequisites, simulator lab, or check the{" "}
              <Link
                href="/manifest"
                className="font-medium text-[var(--accent-blue)] underline"
              >
                Curriculum Manifest
              </Link>{" "}
              for live coverage.
            </p>
          </div>
        </div>
      </div>

      {planEntry.prerequisites.length > 0 && (
        <section className="swiss-card p-5">
          <h2 className="text-sm font-semibold">Prerequisites</h2>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {planEntry.prerequisites.map((preSlug) => {
              const pre = getCurriculumPlanEntry(preSlug);
              return (
                <Link
                  key={preSlug}
                  href={`/learn/${preSlug}`}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent-blue)]"
                >
                  {pre ? `Lesson ${pre.number}: ${pre.title}` : preSlug}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {SimComponent && (
        <section className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
            Assigned Interactive Lab · {simMeta?.title ?? planEntry.simulatorId}
          </p>
          <SimComponent challengeGoal={simMeta?.challengeDescription} />
        </section>
      )}

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
              <p className="truncate text-sm font-medium">{prevEntry.title}</p>
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
              <p className="truncate text-sm font-medium">{nextEntry.title}</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          </Link>
        )}
      </footer>
    </div>
  );
}
