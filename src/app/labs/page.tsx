"use client";

import { Cpu, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { getCurriculumPlanEntry } from "@/data/curriculumPlan";
import { getDomainById } from "@/data/domains";
import { SIMULATOR_CATALOG } from "@/data/simulators";
import type { SimulatorCategory } from "@/types/simulator";

const CATEGORIES: Array<{ id: SimulatorCategory | "all"; label: string }> = [
  { id: "all", label: `All ${SIMULATOR_CATALOG.length} Labs` },
  { id: "hardware", label: "Hardware & Silicon" },
  { id: "systems", label: "OS, Compilers & Distributed" },
  { id: "graphics-ai", label: "Graphics, GPUs & AI" },
];

export default function LabsDirectoryPage() {
  const [category, setCategory] = useState<SimulatorCategory | "all">("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SIMULATOR_CATALOG.filter((sim) => {
      if (category !== "all" && sim.category !== category) return false;
      if (q) {
        if (
          !sim.title.toLowerCase().includes(q) &&
          !sim.subtitle.toLowerCase().includes(q) &&
          !sim.id.toLowerCase().includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [category, query]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="border-b border-[var(--border-subtle)] pb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
          Interactive Simulations
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          {SIMULATOR_CATALOG.length} Interactive Engineering Labs
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Hands-on deterministic simulations for circuits, logic gates, pipelines, virtual memory, TCP congestion, Raft consensus, GPU warps, attention, and quantization.
        </p>
      </header>

      <div className="swiss-card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`rounded border px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat.id
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                  : "border-[var(--border-subtle)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter labs..."
            aria-label="Filter interactive labs"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)]"
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((sim) => {
          const domain = getDomainById(sim.domainId);
          return (
            <article
              key={sim.id}
              className="swiss-card flex flex-col justify-between p-5"
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent-blue)]">
                    <Cpu className="h-3 w-3" />
                    {sim.category}
                  </span>
                  <span className="font-mono text-[10px] text-[var(--text-muted)]">
                    {domain?.title ?? sim.domainId}
                  </span>
                </div>

                <h2 className="mt-2 text-base font-semibold">{sim.title}</h2>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {sim.subtitle}
                </p>

                <p className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-[11px] text-[var(--text-secondary)]">
                  <strong className="font-semibold text-[var(--text-primary)]">
                    Challenge:
                  </strong>{" "}
                  {sim.challengeDescription}
                </p>
              </div>

              <div className="mt-4 space-y-2.5 border-t border-[var(--border-subtle)] pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {sim.lessonSlugs.map((slug) => {
                    const entry = getCurriculumPlanEntry(slug);
                    return (
                      <Link
                        key={slug}
                        href={`/learn/${slug}`}
                        className="rounded border border-[var(--border-subtle)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)]"
                      >
                        L{entry?.number ?? "?"}
                      </Link>
                    );
                  })}
                </div>

                <Link
                  href={`/labs/${sim.id}`}
                  className="inline-flex w-full items-center justify-center rounded bg-[var(--accent-blue)] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                  Open Lab Runner
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
