"use client";

import {
  Bookmark,
  CheckCircle2,
  Download,
  FileText,
  Flame,
  RotateCcw,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CURRICULUM_PLAN, getCurriculumPlanEntry } from "@/data/curriculumPlan";
import { DOMAINS, TRACKS } from "@/data/domains";
import { getDomainMastery, getTrackMastery } from "@/lib/curriculumGraph";
import { useLearningStore } from "@/store/learningStore";

export default function ProgressPage() {
  const {
    state,
    setDailyGoalMinutes,
    exportLearningState,
    importLearningState,
    resetLearningState,
  } = useLearningStore();

  const [importText, setImportText] = useState("");
  const [importFeedback, setImportFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [copiedExport, setCopiedExport] = useState(false);

  const completedCount = useMemo(
    () =>
      CURRICULUM_PLAN.filter((e) => state.completedLessons[e.slug]?.completed)
        .length,
    [state.completedLessons]
  );

  const handleDownloadJson = () => {
    const json = exportLearningState();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `comp-roadmap-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(exportLearningState());
      setCopiedExport(true);
      setTimeout(() => setCopiedExport(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleImportSubmit = () => {
    const res = importLearningState(importText);
    if (res.ok) {
      setImportFeedback({
        ok: true,
        message: "Learning progress imported and validated successfully.",
      });
      setImportText("");
    } else {
      setImportFeedback({ ok: false, message: res.error });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const res = importLearningState(content);
      if (res.ok) {
        setImportFeedback({
          ok: true,
          message: `Imported ${file.name} successfully.`,
        });
      } else {
        setImportFeedback({ ok: false, message: res.error });
      }
    };
    reader.readAsText(file);
  };

  const noteEntries = Object.entries(state.notes).filter(
    ([, val]) => val.trim().length > 0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="border-b border-[var(--border-subtle)] pb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
          Analytics &amp; Portability
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Learning Progress, Notes &amp; Backup
        </h1>
      </header>

      {/* Top KPI Cards & Daily Goal Slider */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Lessons Completed
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold swiss-tabular">
            {completedCount} / {CURRICULUM_PLAN.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {Math.round(
              (completedCount / Math.max(1, CURRICULUM_PLAN.length)) * 100
            )}
            % of roadmap
          </p>
        </div>

        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Streak &amp; Today
          </p>
          <p className="mt-1 flex items-center gap-1.5 font-mono text-2xl font-semibold swiss-tabular">
            <Flame className="h-5 w-5 text-[var(--accent-amber)]" />
            {state.streakDays}d
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)] swiss-tabular">
            {state.todayMinutes} / {state.dailyGoalMinutes} min today
          </p>
        </div>

        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
            Quizzes &amp; Exams
          </p>
          <p className="mt-1 font-mono text-2xl font-semibold swiss-tabular">
            {Object.keys(state.lessonQuizScores).length} /{" "}
            {Object.keys(state.examScores).length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Lesson quizzes / Track exams
          </p>
        </div>

        <div className="swiss-card p-4">
          <div className="flex items-center justify-between">
            <label
              htmlFor="daily-goal-slider"
              className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]"
            >
              Daily Goal
            </label>
            <span className="font-mono text-xs font-semibold text-[var(--accent-blue)] swiss-tabular">
              {state.dailyGoalMinutes} min
            </span>
          </div>
          <input
            id="daily-goal-slider"
            type="range"
            min={5}
            max={180}
            step={5}
            value={state.dailyGoalMinutes}
            onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
            className="mt-4 w-full accent-[var(--accent-blue)]"
          />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-[var(--text-muted)]">
            <span>5m</span>
            <span>60m</span>
            <span>180m</span>
          </div>
        </div>
      </section>

      {/* Track Mastery Summary */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Track Mastery</h2>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {TRACKS.map((track) => {
            const mastery = getTrackMastery(
              track.id,
              state.completedLessons,
              state.lessonQuizScores
            );
            const exam = state.examScores[track.id];
            return (
              <div key={track.id} className="swiss-card p-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-[var(--accent-blue)]">
                    Track {track.number}
                  </span>
                  <span className="font-mono text-[var(--text-muted)] swiss-tabular">
                    {mastery.completed}/{mastery.total}
                  </span>
                </div>
                <h3 className="mt-1 text-sm font-semibold">{track.title}</h3>
                <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                  <div
                    className="h-full bg-[var(--accent-emerald)]"
                    style={{ width: `${mastery.percentage}%` }}
                  />
                </div>
                <div className="mt-2 flex justify-between text-[11px] text-[var(--text-muted)] swiss-tabular">
                  <span>Avg Quiz: {mastery.averageQuizPercentage}%</span>
                  <span>
                    Exam:{" "}
                    {exam
                      ? `${exam.bestPercentage}% (${exam.passed ? "Passed" : "Retry"})`
                      : "Not taken"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 24-Domain Mastery Breakdown */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">24-Domain Mastery Breakdown</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAINS.map((domain) => {
            const m = getDomainMastery(
              domain.id,
              state.completedLessons,
              state.lessonQuizScores
            );
            return (
              <Link
                key={domain.id}
                href={`/curriculum?domain=${domain.id}`}
                className="swiss-card p-3.5 hover:border-[var(--accent-blue)]"
              >
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-semibold text-[var(--text-primary)] truncate">
                    {domain.order}. {domain.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
                    {m.completed}/{m.total}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--bg-subtle)]">
                  <div
                    className="h-full bg-[var(--accent-blue)]"
                    style={{ width: `${m.percentage}%` }}
                  />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Bookmarks & Personal Notes */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="swiss-card p-5">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2.5">
            <Bookmark className="h-4 w-4 text-[var(--accent-amber)]" />
            <h2 className="text-base font-semibold">
              Bookmarked Lessons ({state.bookmarks.length})
            </h2>
          </div>
          {state.bookmarks.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              No bookmarks yet. Bookmark lessons from any lesson header.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {state.bookmarks.map((slug) => {
                const entry = getCurriculumPlanEntry(slug);
                return (
                  <li key={slug}>
                    <Link
                      href={`/learn/${slug}`}
                      className="font-medium text-[var(--accent-blue)] hover:underline"
                    >
                      {entry ? `Lesson ${entry.number}: ${entry.title}` : slug}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="swiss-card p-5">
          <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-2.5">
            <FileText className="h-4 w-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-semibold">
              Personal Notes ({noteEntries.length})
            </h2>
          </div>
          {noteEntries.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              No lesson notes yet. Open the Notes drawer inside any lesson to record takeaways.
            </p>
          ) : (
            <ul className="mt-3 space-y-3 text-xs">
              {noteEntries.map(([slug, content]) => {
                const entry = getCurriculumPlanEntry(slug);
                return (
                  <li
                    key={slug}
                    className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3"
                  >
                    <Link
                      href={`/learn/${slug}`}
                      className="font-semibold text-[var(--accent-blue)] hover:underline"
                    >
                      {entry ? `Lesson ${entry.number}: ${entry.title}` : slug}
                    </Link>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap font-mono text-[11px] text-[var(--text-secondary)]">
                      {content}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Validated JSON Export & Import */}
      <section className="swiss-card p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
          <div>
            <h2 className="text-base font-semibold">
              Export &amp; Import Learning State (JSON)
            </h2>
            <p className="text-xs text-[var(--text-muted)]">
              Back up or transfer your localStorage progress, notes, bookmarks, mistakes, and SM-2 cards.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleDownloadJson}
              className="inline-flex items-center gap-1.5 rounded bg-[var(--accent-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
            >
              <Download className="h-3.5 w-3.5" />
              Download JSON
            </button>
            <button
              type="button"
              onClick={handleCopyJson}
              className="rounded border border-[var(--border-subtle)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-subtle)]"
            >
              {copiedExport ? "Copied!" : "Copy JSON"}
            </button>
            <button
              type="button"
              onClick={resetLearningState}
              className="inline-flex items-center gap-1 rounded border border-[var(--accent-crimson)] px-3 py-1.5 text-xs font-medium text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson-soft)]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset Local Progress
            </button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 text-xs font-medium hover:bg-[var(--bg-subtle)]">
              <Upload className="h-3.5 w-3.5" />
              <span>Upload .json File</span>
              <input
                type="file"
                accept="application/json,.json"
                onChange={handleFileUpload}
                className="sr-only"
              />
            </label>
            <span className="text-xs text-[var(--text-muted)]">
              or paste exported JSON below:
            </span>
          </div>

          <textarea
            rows={4}
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='{"version": 1, ...}'
            aria-label="Paste JSON learning state to import"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3 font-mono text-xs text-[var(--text-primary)]"
          />

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!importText.trim()}
              onClick={handleImportSubmit}
              className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-3.5 py-1.5 text-xs font-medium text-[var(--accent-blue)] hover:opacity-90 disabled:opacity-40"
            >
              Validate &amp; Import JSON
            </button>

            {importFeedback && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${
                  importFeedback.ok
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-crimson)]"
                }`}
              >
                {importFeedback.ok && <CheckCircle2 className="h-3.5 w-3.5" />}
                {importFeedback.message}
              </span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
