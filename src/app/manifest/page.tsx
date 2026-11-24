import { CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { DOMAINS, TRACKS, getDomainById } from "@/data/domains";
import { ALL_TRACK_EXAMS } from "@/data/exams";
import { ALL_GLOSSARY_TERMS } from "@/data/glossary";
import { ALL_LESSONS } from "@/data/lessons";
import { SIMULATOR_CATALOG } from "@/data/simulators";

export default function ManifestPage() {
  const lessonMap = new Map(ALL_LESSONS.map((l) => [l.slug, l]));
  const completeLessons = ALL_LESSONS.filter((l) => l.status === "complete").length;
  const partialLessons = ALL_LESSONS.filter((l) => l.status === "partial").length;
  const totalAssessments = ALL_LESSONS.reduce(
    (sum, l) => sum + l.assessments.length,
    0
  );
  const totalExamQuestions = ALL_TRACK_EXAMS.reduce(
    (sum, e) => sum + e.questions.length,
    0
  );

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <header className="border-b border-[var(--border-subtle)] pb-5">
        <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-blue)]">
          Dynamic Audit
        </p>
        <h1 className="mt-1 text-2xl font-semibold sm:text-3xl">
          Honest Curriculum Coverage Manifest
        </h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Live structural audit generated directly from{" "}
          <code>CURRICULUM_PLAN</code>, <code>ALL_LESSONS</code>,{" "}
          <code>SIMULATOR_CATALOG</code>, <code>ALL_GLOSSARY_TERMS</code>, and{" "}
          <code>ALL_TRACK_EXAMS</code>.
        </p>
      </header>

      {/* Summary Audit Counters */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
            Tracks &amp; Domains
          </p>
          <p className="mt-1 font-mono text-xl font-semibold swiss-tabular">
            {TRACKS.length} / {DOMAINS.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Tracks / Domains defined
          </p>
        </div>

        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
            Lesson Modules
          </p>
          <p className="mt-1 font-mono text-xl font-semibold swiss-tabular">
            {ALL_LESSONS.length} / {CURRICULUM_PLAN.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)] swiss-tabular">
            {completeLessons} complete · {partialLessons} partial
          </p>
        </div>

        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
            Interactive Labs
          </p>
          <p className="mt-1 font-mono text-xl font-semibold swiss-tabular">
            {SIMULATOR_CATALOG.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Registered simulators
          </p>
        </div>

        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
            Glossary &amp; Assessments
          </p>
          <p className="mt-1 font-mono text-xl font-semibold swiss-tabular">
            {ALL_GLOSSARY_TERMS.length} / {totalAssessments}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            Terms / Lesson questions
          </p>
        </div>

        <div className="swiss-card p-4">
          <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
            Track Exams
          </p>
          <p className="mt-1 font-mono text-xl font-semibold swiss-tabular">
            {ALL_TRACK_EXAMS.length} / {TRACKS.length}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)] swiss-tabular">
            {totalExamQuestions} exam questions
          </p>
        </div>
      </section>

      {/* Domain Coverage Table */}
      <section className="swiss-card overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-5 py-3">
          <h2 className="text-base font-semibold">
            24-Domain Coverage Breakdown
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] font-mono text-[10px] uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Domain</th>
                <th className="px-4 py-2.5">Track</th>
                <th className="px-4 py-2.5">Planned</th>
                <th className="px-4 py-2.5">Authored</th>
                <th className="px-4 py-2.5">Glossary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {DOMAINS.map((domain) => {
                const planned = CURRICULUM_PLAN.filter(
                  (e) => e.domainId === domain.id
                ).length;
                const authored = ALL_LESSONS.filter(
                  (l) => l.domainId === domain.id
                ).length;
                const terms = ALL_GLOSSARY_TERMS.filter(
                  (t) => t.domainId === domain.id
                ).length;
                return (
                  <tr key={domain.id} className="hover:bg-[var(--bg-subtle)]">
                    <td className="px-4 py-2.5 font-mono text-[var(--text-muted)] swiss-tabular">
                      {domain.order}
                    </td>
                    <td className="px-4 py-2.5 font-medium text-[var(--text-primary)]">
                      <Link
                        href={`/curriculum?domain=${domain.id}`}
                        className="hover:text-[var(--accent-blue)]"
                      >
                        {domain.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[var(--text-muted)]">
                      {domain.trackId}
                    </td>
                    <td className="px-4 py-2.5 font-mono swiss-tabular">
                      {planned}
                    </td>
                    <td className="px-4 py-2.5 font-mono swiss-tabular">
                      {authored}
                    </td>
                    <td className="px-4 py-2.5 font-mono swiss-tabular">
                      {terms}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* All 58 Lessons Status Table */}
      <section className="swiss-card overflow-hidden">
        <div className="border-b border-[var(--border-subtle)] px-5 py-3">
          <h2 className="text-base font-semibold">
            58-Lesson Content &amp; Lab Audit
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] font-mono text-[10px] uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-4 py-2.5">#</th>
                <th className="px-4 py-2.5">Lesson</th>
                <th className="px-4 py-2.5">Domain</th>
                <th className="px-4 py-2.5">Simulator</th>
                <th className="px-4 py-2.5">Questions</th>
                <th className="px-4 py-2.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {CURRICULUM_PLAN.map((entry) => {
                const authored = lessonMap.get(entry.slug);
                const domain = getDomainById(entry.domainId);
                return (
                  <tr key={entry.slug} className="hover:bg-[var(--bg-subtle)]">
                    <td className="px-4 py-2.5 font-mono text-[var(--text-muted)] swiss-tabular">
                      {String(entry.number).padStart(2, "0")}
                    </td>
                    <td className="px-4 py-2.5 font-medium">
                      <Link
                        href={`/learn/${entry.slug}`}
                        className="text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
                      >
                        {entry.title}
                      </Link>
                    </td>
                    <td className="px-4 py-2.5 text-[var(--text-secondary)]">
                      {domain?.title ?? entry.domainId}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-[var(--text-muted)]">
                      {entry.simulatorId ? (
                        <Link
                          href={`/labs/${entry.simulatorId}`}
                          className="text-[var(--accent-blue)] hover:underline"
                        >
                          {entry.simulatorId}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-2.5 font-mono swiss-tabular">
                      {authored ? authored.assessments.length : 0}
                    </td>
                    <td className="px-4 py-2.5">
                      {authored ? (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--accent-emerald)]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {authored.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[var(--text-muted)]">
                          <Clock className="h-3.5 w-3.5" />
                          planned
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
