"use client";

import { FileText, Trash2, X } from "lucide-react";
import { useLearningStore } from "@/store/learningStore";

export interface LessonNotesDrawerProps {
  open: boolean;
  onClose: () => void;
  lessonSlug: string;
  lessonTitle: string;
}

export function LessonNotesDrawer({
  open,
  onClose,
  lessonSlug,
  lessonTitle,
}: LessonNotesDrawerProps) {
  const { state, setLessonNote } = useLearningStore();
  const note = state.notes[lessonSlug] ?? "";

  if (!open) return null;

  const appendTemplate = (snippet: string) => {
    const next = note.trim() ? `${note.trimEnd()}\n\n${snippet}` : snippet;
    setLessonNote(lessonSlug, next);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label={`Personal notes for ${lessonTitle}`}
      onClick={onClose}
    >
      <aside
        className="flex h-full w-full max-w-md flex-col border-l border-[var(--border-subtle)] bg-[var(--bg-surface)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] px-5 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="h-4 w-4 shrink-0 text-[var(--accent-blue)]" />
            <div className="min-w-0">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
                Lesson Notes
              </p>
              <h3 className="truncate text-sm font-semibold text-[var(--text-primary)]">
                {lessonTitle}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close notes drawer"
            className="rounded p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-5 py-2.5">
          <span className="text-[11px] text-[var(--text-muted)]">Insert:</span>
          <button
            type="button"
            onClick={() => appendTemplate("## Key Takeaway\n- ")}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            + Key Takeaway
          </button>
          <button
            type="button"
            onClick={() => appendTemplate("## Open Question\n- ")}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            + Question
          </button>
          <button
            type="button"
            onClick={() => appendTemplate("## Mental Model\n- ")}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            + Mental Model
          </button>
        </div>

        <div className="flex flex-1 flex-col p-5">
          <textarea
            value={note}
            onChange={(e) => setLessonNote(lessonSlug, e.target.value)}
            placeholder="Write markdown or plain-text notes, equations, or questions for this lesson. Saved automatically to localStorage."
            aria-label="Lesson notes editor"
            className="w-full flex-1 resize-none rounded-md border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 font-mono text-xs leading-relaxed text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent-blue)] focus:outline-none"
          />

          <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-muted)]">
            <span className="font-mono swiss-tabular">
              {note.length} chars · Saved locally
            </span>
            {note.length > 0 && (
              <button
                type="button"
                onClick={() => setLessonNote(lessonSlug, "")}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-[var(--accent-crimson)] hover:bg-[var(--accent-crimson-soft)]"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
