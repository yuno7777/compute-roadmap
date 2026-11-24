"use client";

import {
  CheckCircle2,
  Circle,
  Cpu,
  Filter,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { DOMAINS, TRACKS, getDomainById } from "@/data/domains";
import { ALL_LESSONS } from "@/data/lessons";
import { useLearningStore } from "@/store/learningStore";
import type { DomainId, TrackId } from "@/types/curriculum";

function CurriculumCatalogInner() {
  const searchParams = useSearchParams();
  const { state } = useLearningStore();

  const initialTrack =
    (searchParams.get("track") as TrackId | null) ?? "all";
  const initialDomain =
    (searchParams.get("domain") as DomainId | null) ?? "all";

  const [trackFilter, setTrackFilter] = useState<TrackId | "all">(initialTrack);
  const [domainFilter, setDomainFilter] = useState<DomainId | "all">(
    initialDomain
  );
  const [statusFilter, setStatusFilter] = useState<
    "all" | "completed" | "incomplete"
  >("all");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const t = searchParams.get("track") as TrackId | null;
    const d = searchParams.get("domain") as DomainId | null;
    if (t) setTrackFilter(t);
    if (d) setDomainFilter(d);
  }, [searchParams]);

  const authoredMap = useMemo(
    () => new Map(ALL_LESSONS.map((l) => [l.slug, l])),
    []
  );

  const availableDomains = useMemo(() => {
    if (trackFilter === "all") return DOMAINS;
    return DOMAINS.filter((d) => d.trackId === trackFilter);
  }, [trackFilter]);

  const filteredLessons = useMemo(() => {
    const q = query.trim().toLowerCase();
    return CURRICULUM_PLAN.filter((entry) => {
      if (trackFilter !== "all" && entry.trackId !== trackFilter) return false;
      if (domainFilter !== "all" && entry.domainId !== domainFilter)
        return false;
      const done = Boolean(state.completedLessons[entry.slug]?.completed);
      if (statusFilter === "completed" && !done) return false;
      if (statusFilter === "incomplete" && done) return false;
      if (q) {
        const domainTitle =
          getDomainById(entry.domainId)?.title.toLowerCase() ?? "";
        if (
          !entry.title.toLowerCase().includes(q) &&
          !entry.moduleTitle.toLowerCase().includes(q) &&
          !domainTitle.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [trackFilter, domainFilter, statusFilter, query, state.completedLessons]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="border-b border-[var(--border-subtle)] pb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
          Complete Syllabus
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          6 Tracks · 24 Domains · 58 Lessons
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Browse every module from charge carriers and MOSFETs to distributed consensus, GPUs, and foundation model inference.
        </p>
      </header>

      {/* Filter Toolbar */}
      <div className="swiss-card flex flex-wrap items-center gap-3 p-4">
        <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-muted)]">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters</span>
        </div>

        <select
          aria-label="Filter by track"
          value={trackFilter}
          onChange={(e) => {
            setTrackFilter(e.target.value as TrackId | "all");
            setDomainFilter("all");
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
          aria-label="Filter by domain"
          value={domainFilter}
          onChange={(e) =>
            setDomainFilter(e.target.value as DomainId | "all")
          }
          className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
        >
          <option value="all">All Domains ({availableDomains.length})</option>
          {availableDomains.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by completion"
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(
              e.target.value as "all" | "completed" | "incomplete"
            )
          }
          className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="incomplete">Incomplete</option>
        </select>

        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter lessons by title or module..."
            aria-label="Search curriculum catalog"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Grouped Track & Domain Catalog */}
      {filteredLessons.length === 0 ? (
        <div className="swiss-card p-8 text-center text-sm text-[var(--text-muted)]">
          No lessons match your current filters.
        </div>
      ) : (
        <div className="space-y-8">
          {TRACKS.map((track) => {
            const trackLessons = filteredLessons.filter(
              (l) => l.trackId === track.id
            );
            if (trackLessons.length === 0) return null;

            return (
              <section key={track.id} className="space-y-4">
                <div className="border-b border-[var(--border-subtle)] pb-2">
                  <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
                    Track {track.number} · {track.subtitle}
                  </p>
                  <h2 className="mt-0.5 text-xl font-semibold">
                    {track.title}
                  </h2>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {track.description}
                  </p>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  {trackLessons.map((entry) => {
                    const domain = getDomainById(entry.domainId);
                    const full = authoredMap.get(entry.slug);
                    const done = Boolean(
                      state.completedLessons[entry.slug]?.completed
                    );

                    return (
                      <Link
                        key={entry.slug}
                        href={`/learn/${entry.slug}`}
                        className="swiss-card flex items-start justify-between gap-3 p-4 hover:border-[var(--accent-blue)]"
                      >
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            <span className="font-mono font-semibold text-[var(--accent-blue)] swiss-tabular">
                              Lesson {String(entry.number).padStart(2, "0")}
                            </span>
                            <span className="text-[var(--text-muted)]">·</span>
                            <span className="text-[var(--text-muted)]">
                              {domain?.title ?? entry.domainId}
                            </span>
                          </div>
                          <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
                            {entry.title}
                          </h3>
                          {full?.subtitle ? (
                            <p className="mt-1 line-clamp-2 text-xs text-[var(--text-secondary)]">
                              {full.subtitle}
                            </p>
                          ) : (
                            <p className="mt-1 text-xs text-[var(--text-muted)]">
                              {entry.moduleTitle}
                            </p>
                          )}

                          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
                            {entry.simulatorId && (
                              <span className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1.5 py-0.5">
                                <Cpu className="h-2.5 w-2.5" />
                                {entry.simulatorId}
                              </span>
                            )}
                            {full && (
                              <span>{full.estimatedMinutes} min</span>
                            )}
                            {entry.prerequisites.length > 0 && (
                              <span>
                                {entry.prerequisites.length} prereq
                                {entry.prerequisites.length > 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="shrink-0 pt-0.5">
                          {done ? (
                            <CheckCircle2
                              className="h-5 w-5 text-[var(--accent-emerald)]"
                              aria-label="Completed"
                            />
                          ) : (
                            <Circle
                              className="h-5 w-5 text-[var(--border-strong)]"
                              aria-hidden="true"
                            />
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function CurriculumPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-6 py-10 text-sm text-[var(--text-muted)]">
          Loading curriculum catalog...
        </div>
      }
    >
      <CurriculumCatalogInner />
    </Suspense>
  );
}
