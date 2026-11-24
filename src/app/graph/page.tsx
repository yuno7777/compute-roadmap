import { CurriculumGraph } from "@/components/graph/CurriculumGraph";

export default function GraphPage() {
  return (
    <div className="flex h-[calc(100vh-53px)] flex-col">
      <div className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3 lg:px-6">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h1 className="text-lg font-semibold">
              Curriculum Prerequisite Knowledge Graph
            </h1>
            <p className="text-xs text-[var(--text-muted)]">
              58 lessons arranged deterministically by Track column and topological depth. Hover to trace lineage; click to open.
            </p>
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <CurriculumGraph />
      </div>
    </div>
  );
}
