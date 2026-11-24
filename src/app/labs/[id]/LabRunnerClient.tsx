"use client";

import { ArrowLeft, CheckCircle2, Cpu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getSimulatorComponent } from "@/components/simulators/registry";
import { getCurriculumPlanEntry } from "@/data/curriculumPlan";
import { getDomainById } from "@/data/domains";
import { getSimulatorById } from "@/data/simulators";
import type { SimulatorId } from "@/types/simulator";

export function LabRunnerClient({ simulatorId }: { simulatorId: SimulatorId }) {
  const meta = getSimulatorById(simulatorId);
  const SimulatorComponent = getSimulatorComponent(simulatorId);
  const domain = meta ? getDomainById(meta.domainId) : undefined;
  const [challengeDone, setChallengeDone] = useState(false);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <Link
            href="/labs"
            className="inline-flex items-center gap-1 text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All 21 Labs
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-0.5 font-mono text-[10px] uppercase text-[var(--accent-blue)]">
              <Cpu className="h-3 w-3" />
              {meta?.category ?? "lab"}
            </span>
            {domain && (
              <span className="text-xs text-[var(--text-muted)]">
                {domain.title}
              </span>
            )}
          </div>
          <h1 className="mt-1.5 text-2xl font-semibold">
            {meta?.title ?? simulatorId}
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {meta?.subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {meta?.lessonSlugs.map((slug) => {
            const entry = getCurriculumPlanEntry(slug);
            return (
              <Link
                key={slug}
                href={`/learn/${slug}`}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-1.5 text-xs font-medium hover:border-[var(--accent-blue)]"
              >
                {entry ? `Lesson ${entry.number}: ${entry.title}` : slug}
              </Link>
            );
          })}
        </div>
      </div>

      {meta && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="swiss-card p-4 text-xs">
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              Controls Guide
            </p>
            <p className="mt-1 leading-relaxed text-[var(--text-secondary)]">
              {meta.controlsSummary}
            </p>
          </div>
          <div
            className={`swiss-card p-4 text-xs ${
              challengeDone
                ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-blue)]">
                Lab Challenge
              </p>
              {challengeDone && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-semibold text-[var(--accent-emerald)]">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Completed
                </span>
              )}
            </div>
            <p className="mt-1 leading-relaxed text-[var(--text-primary)]">
              {meta.challengeDescription}
            </p>
          </div>
        </div>
      )}

      <SimulatorComponent
        challengeGoal={meta?.challengeDescription}
        onChallengeComplete={() => setChallengeDone(true)}
      />
    </div>
  );
}
