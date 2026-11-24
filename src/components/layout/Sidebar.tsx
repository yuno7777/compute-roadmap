"use client";

import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Cpu,
  PanelLeftClose,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { TRACKS } from "@/data/domains";
import { useLearningStore } from "@/store/learningStore";
import type { TrackId } from "@/types/curriculum";

export interface SidebarProps {
  desktopOpen: boolean;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onCollapseDesktop: () => void;
}

export function Sidebar({
  desktopOpen,
  mobileOpen,
  onCloseMobile,
  onCollapseDesktop,
}: SidebarProps) {
  const pathname = usePathname();
  const { state } = useLearningStore();

  const activeSlug = pathname.startsWith("/learn/")
    ? pathname.replace("/learn/", "").split("/")[0]
    : undefined;

  const activeTrackId = useMemo(() => {
    if (!activeSlug) return "track-1";
    return (
      CURRICULUM_PLAN.find((e) => e.slug === activeSlug)?.trackId ?? "track-1"
    );
  }, [activeSlug]);

  const [expandedTracks, setExpandedTracks] = useState<Record<TrackId, boolean>>({
    "track-1": true,
    "track-2": false,
    "track-3": false,
    "track-4": false,
    "track-5": false,
    "track-6": false,
  });

  useEffect(() => {
    if (activeTrackId) {
      setExpandedTracks((prev) =>
        prev[activeTrackId] ? prev : { ...prev, [activeTrackId]: true }
      );
    }
  }, [activeTrackId]);

  const lessonsByTrack = useMemo(() => {
    const grouped: Record<TrackId, typeof CURRICULUM_PLAN> = {
      "track-1": [],
      "track-2": [],
      "track-3": [],
      "track-4": [],
      "track-5": [],
      "track-6": [],
    };
    for (const entry of CURRICULUM_PLAN) {
      grouped[entry.trackId].push(entry);
    }
    return grouped;
  }, []);

  const toggleTrack = (trackId: TrackId) => {
    setExpandedTracks((prev) => ({ ...prev, [trackId]: !prev[trackId] }));
  };

  const totalCompleted = useMemo(
    () =>
      CURRICULUM_PLAN.filter((e) => state.completedLessons[e.slug]?.completed)
        .length,
    [state.completedLessons]
  );

  const renderBody = (isMobile: boolean) => (
    <div className="flex h-full flex-col bg-[var(--bg-surface)] text-[var(--text-primary)]">
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-4 py-3">
        <Link
          href="/"
          onClick={isMobile ? onCloseMobile : undefined}
          className="flex items-center gap-2 font-semibold tracking-tight text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
        >
          <Cpu className="h-4 w-4 text-[var(--accent-blue)]" />
          <span className="font-mono text-sm tracking-wider">COMPUTE</span>
        </Link>
        <button
          type="button"
          onClick={isMobile ? onCloseMobile : onCollapseDesktop}
          aria-label={
            isMobile ? "Close curriculum sidebar" : "Collapse curriculum sidebar"
          }
          className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
        >
          <PanelLeftClose className="h-4 w-4" />
        </button>
      </div>

      <div className="border-b border-[var(--border-subtle)] px-4 py-2.5">
        <div className="flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>Curriculum Progress</span>
          <span className="font-mono swiss-tabular">
            {totalCompleted}/{CURRICULUM_PLAN.length}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
          <div
            className="h-full bg-[var(--accent-emerald)] transition-all duration-300"
            style={{
              width: `${Math.round(
                (totalCompleted / Math.max(1, CURRICULUM_PLAN.length)) * 100
              )}%`,
            }}
          />
        </div>
      </div>

      <nav
        aria-label="Curriculum navigation"
        className="flex-1 overflow-y-auto px-2 py-3"
      >
        <ul className="space-y-1.5">
          {TRACKS.map((track) => {
            const lessons = lessonsByTrack[track.id];
            const isExpanded = expandedTracks[track.id];
            const trackDone = lessons.filter(
              (l) => state.completedLessons[l.slug]?.completed
            ).length;

            return (
              <li key={track.id} className="rounded-md">
                <button
                  type="button"
                  onClick={() => toggleTrack(track.id)}
                  aria-expanded={isExpanded}
                  className="flex w-full items-start justify-between gap-2 rounded-md px-2 py-2 text-left text-xs font-semibold text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)]"
                >
                  <span className="flex items-start gap-1.5">
                    {isExpanded ? (
                      <ChevronDown className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                    ) : (
                      <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                    )}
                    <span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-blue)]">
                        Track {track.number}
                      </span>
                      <span className="block leading-snug">{track.title}</span>
                    </span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] font-normal text-[var(--text-muted)] swiss-tabular">
                    {trackDone}/{lessons.length}
                  </span>
                </button>

                {isExpanded && (
                  <ul className="ml-3.5 mt-1 space-y-0.5 border-l border-[var(--border-subtle)] pl-2">
                    {lessons.map((lesson) => {
                      const isActive = lesson.slug === activeSlug;
                      const isDone = Boolean(
                        state.completedLessons[lesson.slug]?.completed
                      );

                      return (
                        <li key={lesson.slug}>
                          <Link
                            href={`/learn/${lesson.slug}`}
                            onClick={isMobile ? onCloseMobile : undefined}
                            aria-current={isActive ? "page" : undefined}
                            className={`flex items-start gap-2 rounded px-2 py-1.5 text-xs transition-colors focus-visible:outline-2 focus-visible:outline-[var(--accent-blue)] ${
                              isActive
                                ? "bg-[var(--accent-blue-soft)] font-medium text-[var(--accent-blue)]"
                                : "text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
                            }`}
                          >
                            {isDone ? (
                              <CheckCircle2
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-emerald)]"
                                aria-label="Completed"
                              />
                            ) : (
                              <Circle
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--border-strong)]"
                                aria-hidden="true"
                              />
                            )}
                            <span className="leading-snug">
                              <span className="mr-1 font-mono text-[10px] text-[var(--text-muted)] swiss-tabular">
                                {String(lesson.number).padStart(2, "0")}
                              </span>
                              {lesson.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {desktopOpen && (
        <aside className="hidden w-72 shrink-0 border-r border-[var(--border-subtle)] lg:block">
          <div className="sticky top-0 h-screen">{renderBody(false)}</div>
        </aside>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Curriculum sidebar"
        >
          <div
            className="fixed inset-0 bg-black/40"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-50 h-full w-72 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)]">
            {renderBody(true)}
          </aside>
        </div>
      )}
    </>
  );
}
