"use client";

import { Check, Copy, Terminal } from "lucide-react";
import { useState } from "react";
import { MathText } from "@/components/math/MathText";
import type { LessonCodeExample } from "@/types/curriculum";

export interface CodeExampleCardProps {
  example: LessonCodeExample;
}

export function CodeExampleCard({ example }: CodeExampleCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(example.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable in restricted context
    }
  };

  return (
    <div className="swiss-card overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--text-muted)]">
            {example.language}
          </span>
          <h4 className="truncate text-sm font-semibold text-[var(--text-primary)]">
            {example.title}
          </h4>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          aria-label={`Copy ${example.title}`}
          className="inline-flex shrink-0 items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-canvas)] hover:text-[var(--text-primary)]"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-[var(--accent-emerald)]" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>

      <div className="p-4">
        <pre className="m-0 overflow-x-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3.5 font-mono text-xs leading-relaxed text-[var(--text-primary)]">
          <code>{example.code}</code>
        </pre>

        <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">
          <MathText text={example.explanation} />
        </p>

        {example.output && (
          <div className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
            <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-[var(--text-muted)]">
              <Terminal className="h-3 w-3" />
              <span>Output / Trace</span>
            </div>
            <pre className="mt-1.5 border-0 bg-transparent p-0 font-mono text-xs text-[var(--text-primary)]">
              <code>{example.output}</code>
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
