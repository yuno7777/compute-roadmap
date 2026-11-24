"use client";

import { BookOpen, Search } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { MathBlock, MathText } from "@/components/math/MathText";
import { getCurriculumPlanEntry } from "@/data/curriculumPlan";
import { DOMAINS, getDomainById } from "@/data/domains";
import { ALL_GLOSSARY_TERMS } from "@/data/glossary";
import type { DomainId } from "@/types/curriculum";

function GlossaryInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQuery);
  const [domainFilter, setDomainFilter] = useState<DomainId | "all">("all");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setQuery(q);
  }, [searchParams]);

  const filteredTerms = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...ALL_GLOSSARY_TERMS]
      .filter((term) => {
        if (domainFilter !== "all" && term.domainId !== domainFilter) {
          return false;
        }
        if (q) {
          if (
            !term.term.toLowerCase().includes(q) &&
            !term.shortDefinition.toLowerCase().includes(q) &&
            !term.detailedExplanation.toLowerCase().includes(q)
          ) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => a.term.localeCompare(b.term));
  }, [query, domainFilter]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="border-b border-[var(--border-subtle)] pb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
          Technical Reference
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Computing &amp; AI Glossary
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Precise definitions, mathematical formulations, and cross-references across all 24 computing domains. Currently indexed:{" "}
          <span className="font-mono font-medium text-[var(--text-primary)]">
            {ALL_GLOSSARY_TERMS.length}
          </span>{" "}
          terms.
        </p>
      </header>

      <div className="swiss-card flex flex-wrap items-center gap-3 p-4">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--text-muted)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search terms, definitions, or formulas..."
            aria-label="Search glossary terms"
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] py-1.5 pl-8 pr-3 text-xs text-[var(--text-primary)]"
          />
        </div>

        <select
          aria-label="Filter glossary by domain"
          value={domainFilter}
          onChange={(e) =>
            setDomainFilter(e.target.value as DomainId | "all")
          }
          className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
        >
          <option value="all">All 24 Domains</option>
          {DOMAINS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.title}
            </option>
          ))}
        </select>
      </div>

      {ALL_GLOSSARY_TERMS.length === 0 ? (
        <div className="swiss-card p-8 text-center">
          <BookOpen className="mx-auto h-6 w-6 text-[var(--text-muted)]" />
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            Glossary entries pending barrel integration
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Terms from <code>src/data/glossary/index.ts</code> will appear here automatically once populated.
          </p>
        </div>
      ) : filteredTerms.length === 0 ? (
        <div className="swiss-card p-8 text-center text-sm text-[var(--text-muted)]">
          No glossary terms match your query.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredTerms.map((term) => {
            const domain = getDomainById(term.domainId);
            return (
              <article key={term.id} className="swiss-card p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                    {term.term}
                  </h2>
                  <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]">
                    {domain?.title ?? term.domainId}
                  </span>
                </div>

                <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                  <MathText text={term.shortDefinition} />
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-secondary)]">
                  <MathText text={term.detailedExplanation} />
                </p>

                {term.formulaLatex && (
                  <div className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-2">
                    <MathBlock latex={term.formulaLatex} />
                  </div>
                )}

                {term.relatedLessonSlugs.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-[var(--border-subtle)] pt-3">
                    <span className="text-[11px] text-[var(--text-muted)]">
                      Lessons:
                    </span>
                    {term.relatedLessonSlugs.map((slug) => {
                      const entry = getCurriculumPlanEntry(slug);
                      return (
                        <Link
                          key={slug}
                          href={`/learn/${slug}`}
                          className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2 py-0.5 text-[11px] text-[var(--accent-blue)] hover:border-[var(--accent-blue)]"
                        >
                          {entry
                            ? `L${entry.number}: ${entry.title}`
                            : slug}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GlossaryPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-5xl px-6 py-10 text-sm text-[var(--text-muted)]">
          Loading glossary...
        </div>
      }
    >
      <GlossaryInner />
    </Suspense>
  );
}
