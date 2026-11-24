"use client";

import { BookOpen, Cpu, FlaskConical, Layers, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { DOMAINS } from "@/data/domains";
import { ALL_GLOSSARY_TERMS } from "@/data/glossary";
import { ALL_LESSONS } from "@/data/lessons";
import { SIMULATOR_CATALOG } from "@/data/simulators";

interface SearchResult {
  id: string;
  kind: "lesson" | "domain" | "simulator" | "glossary";
  title: string;
  subtitle: string;
  href: string;
  badge: string;
}

export interface SearchModalProps {
  open: boolean;
  onClose: () => void;
}

export function SearchModal({ open, onClose }: SearchModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const lessonBySlug = useMemo(
    () => new Map(ALL_LESSONS.map((l) => [l.slug, l])),
    []
  );

  const searchableItems = useMemo<SearchResult[]>(() => {
    const items: SearchResult[] = [];

    for (const entry of CURRICULUM_PLAN) {
      const full = lessonBySlug.get(entry.slug);
      items.push({
        id: `lesson-${entry.slug}`,
        kind: "lesson",
        title: `${String(entry.number).padStart(2, "0")}. ${entry.title}`,
        subtitle: full?.subtitle ?? `${entry.moduleTitle} · ${entry.chapterTitle}`,
        href: `/learn/${entry.slug}`,
        badge: "Lesson",
      });
    }

    for (const domain of DOMAINS) {
      items.push({
        id: `domain-${domain.id}`,
        kind: "domain",
        title: domain.title,
        subtitle: domain.description,
        href: `/curriculum?domain=${domain.id}`,
        badge: "Domain",
      });
    }

    for (const sim of SIMULATOR_CATALOG) {
      items.push({
        id: `sim-${sim.id}`,
        kind: "simulator",
        title: sim.title,
        subtitle: sim.subtitle,
        href: `/labs/${sim.id}`,
        badge: "Lab",
      });
    }

    for (const term of ALL_GLOSSARY_TERMS) {
      items.push({
        id: `glossary-${term.id}`,
        kind: "glossary",
        title: term.term,
        subtitle: term.shortDefinition,
        href: `/glossary?q=${encodeURIComponent(term.term)}`,
        badge: "Glossary",
      });
    }

    return items;
  }, [lessonBySlug]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return searchableItems.slice(0, 12);
    }

    return searchableItems
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q)
      )
      .slice(0, 20);
  }, [query, searchableItems]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  if (!open) return null;

  const navigateTo = (href: string) => {
    onClose();
    router.push(href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length === 0 ? 0 : (prev + 1) % results.length
      );
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        results.length === 0
          ? 0
          : (prev - 1 + results.length) % results.length
      );
      return;
    }
    if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      navigateTo(results[selectedIndex].href);
    }
  };

  const IconForKind = (kind: SearchResult["kind"]) => {
    switch (kind) {
      case "lesson":
        return BookOpen;
      case "domain":
        return Layers;
      case "simulator":
        return Cpu;
      case "glossary":
        return FlaskConical;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-16 sm:pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Search curriculum"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 58 lessons, 24 domains, 21 labs, or glossary terms..."
            aria-label="Search query"
            className="w-full bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="rounded p-1 text-[var(--text-muted)] hover:bg-[var(--bg-subtle)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
              No matches for &ldquo;{query}&rdquo;.
            </p>
          ) : (
            <ul role="listbox" className="space-y-1">
              {results.map((item, idx) => {
                const Icon = IconForKind(item.kind);
                const selected = idx === selectedIndex;
                return (
                  <li key={item.id} role="option" aria-selected={selected}>
                    <button
                      type="button"
                      onClick={() => navigateTo(item.href)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex w-full items-start justify-between gap-3 rounded-md px-3 py-2 text-left transition-colors ${
                        selected
                          ? "bg-[var(--accent-blue-soft)] text-[var(--text-primary)]"
                          : "hover:bg-[var(--bg-subtle)]"
                      }`}
                    >
                      <span className="flex items-start gap-2.5 min-w-0">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-blue)]" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-[var(--text-primary)]">
                            {item.title}
                          </span>
                          <span className="block truncate text-xs text-[var(--text-muted)]">
                            {item.subtitle}
                          </span>
                        </span>
                      </span>
                      <span className="shrink-0 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-1.5 py-0.5 font-mono text-[10px] uppercase text-[var(--text-muted)]">
                        {item.badge}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-4 py-2 text-[11px] text-[var(--text-muted)]">
          <span>Use Up/Down arrows to select, Enter to open</span>
          <span className="font-mono">Esc to close</span>
        </div>
      </div>
    </div>
  );
}
