"use client";

import {
  Background,
  Controls,
  Handle,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { ArrowRight, CheckCircle2, Cpu, Filter, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CURRICULUM_PLAN } from "@/data/curriculumPlan";
import { DOMAINS, TRACKS, getDomainById, getTrackById } from "@/data/domains";
import {
  arePrerequisitesMet,
  getDependentsRecursive,
  getPrerequisitesRecursive,
  getTopologicalDepths,
} from "@/lib/curriculumGraph";
import { useLearningStore } from "@/store/learningStore";
import type { CurriculumPlanEntry, DomainId, TrackId } from "@/types/curriculum";

type MasteryStatus = "completed" | "ready" | "advisory";
type HighlightRole = "none" | "selected" | "upstream" | "downstream" | "dimmed";

interface LessonNodeData extends Record<string, unknown> {
  entry: CurriculumPlanEntry;
  domainTitle: string;
  trackNumber: number;
  depth: number;
  status: MasteryStatus;
  role: HighlightRole;
}

type LessonNodeType = Node<LessonNodeData, "lessonNode">;

function LessonDagNode({ data }: NodeProps<LessonNodeType>) {
  const { entry, domainTitle, trackNumber, status, role } = data;

  let borderClass = "border-[var(--border-strong)]";
  let badgeClass = "bg-[var(--bg-subtle)] text-[var(--text-muted)]";
  let statusText = "Advisory prereqs";

  if (status === "completed") {
    borderClass = "border-[var(--accent-emerald)]";
    badgeClass = "bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]";
    statusText = "Completed";
  } else if (status === "ready") {
    borderClass = "border-[var(--accent-blue)]";
    badgeClass = "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]";
    statusText = "Prereqs met";
  }

  let ringClass = "";
  let opacityClass = "opacity-100";
  if (role === "selected") {
    ringClass = "ring-2 ring-[var(--accent-blue)]";
  } else if (role === "upstream") {
    ringClass = "ring-2 ring-[var(--accent-amber)]";
  } else if (role === "downstream") {
    ringClass = "ring-2 ring-[var(--accent-emerald)]";
  } else if (role === "dimmed") {
    opacityClass = "opacity-30";
  }

  return (
    <div
      className={`w-[232px] rounded-md border-2 bg-[var(--bg-surface)] px-3 py-2.5 text-left transition-opacity ${borderClass} ${ringClass} ${opacityClass}`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!h-2 !w-2 !border-[var(--border-strong)] !bg-[var(--bg-subtle)]"
      />
      <div className="flex items-center justify-between gap-1.5">
        <span className="font-mono text-[10px] font-medium uppercase tracking-wider text-[var(--text-muted)] swiss-tabular">
          T{trackNumber} · #{String(entry.number).padStart(2, "0")}
        </span>
        <span
          className={`inline-flex items-center gap-1 rounded px-1.5 py-0.5 font-mono text-[10px] font-medium ${badgeClass}`}
        >
          {status === "completed" && <CheckCircle2 className="h-2.5 w-2.5" />}
          {statusText}
        </span>
      </div>
      <div className="mt-1 line-clamp-2 text-xs font-semibold leading-snug text-[var(--text-primary)]">
        {entry.title}
      </div>
      <div className="mt-1.5 flex items-center justify-between gap-1 text-[10px] text-[var(--text-muted)]">
        <span className="truncate">{domainTitle}</span>
        {entry.simulatorId && (
          <span className="inline-flex shrink-0 items-center gap-0.5 rounded border border-[var(--border-subtle)] px-1 py-0.5 font-mono text-[9px]">
            <Cpu className="h-2.5 w-2.5" />
            Lab
          </span>
        )}
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!h-2 !w-2 !border-[var(--border-strong)] !bg-[var(--bg-subtle)]"
      />
    </div>
  );
}

const NODE_TYPES = {
  lessonNode: LessonDagNode,
};

export interface CurriculumGraphProps {
  initialTrackFilter?: TrackId | "all";
  initialDomainFilter?: DomainId | "all";
}

export function CurriculumGraph({
  initialTrackFilter = "all",
  initialDomainFilter = "all",
}: CurriculumGraphProps) {
  const router = useRouter();
  const { state, resolvedTheme } = useLearningStore();

  const [trackFilter, setTrackFilter] = useState<TrackId | "all">(
    initialTrackFilter
  );
  const [domainFilter, setDomainFilter] = useState<DomainId | "all">(
    initialDomainFilter
  );
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [clickBehavior, setClickBehavior] = useState<"navigate" | "inspect">(
    "navigate"
  );

  const depths = useMemo(() => getTopologicalDepths(CURRICULUM_PLAN), []);

  const availableDomains = useMemo(() => {
    if (trackFilter === "all") return DOMAINS;
    return DOMAINS.filter((d) => d.trackId === trackFilter);
  }, [trackFilter]);

  const filteredEntries = useMemo(() => {
    return CURRICULUM_PLAN.filter((entry) => {
      if (trackFilter !== "all" && entry.trackId !== trackFilter) return false;
      if (domainFilter !== "all" && entry.domainId !== domainFilter)
        return false;
      return true;
    });
  }, [trackFilter, domainFilter]);

  const activeSlug = hoveredSlug ?? selectedSlug;

  const { upstreamSet, downstreamSet } = useMemo(() => {
    if (!activeSlug) {
      return {
        upstreamSet: new Set<string>(),
        downstreamSet: new Set<string>(),
      };
    }
    return {
      upstreamSet: new Set(getPrerequisitesRecursive(activeSlug, CURRICULUM_PLAN)),
      downstreamSet: new Set(
        getDependentsRecursive(activeSlug, CURRICULUM_PLAN)
      ),
    };
  }, [activeSlug]);

  // Deterministic Track-column + Topological-depth layout
  const { nodes, edges } = useMemo(() => {
    const visibleSlugs = new Set(filteredEntries.map((e) => e.slug));

    // Group by trackId and topological depth inside that track
    const byTrack = new Map<TrackId, CurriculumPlanEntry[]>();
    for (const track of TRACKS) {
      byTrack.set(track.id, []);
    }
    for (const entry of filteredEntries) {
      byTrack.get(entry.trackId)?.push(entry);
    }

    const activeTracks = TRACKS.filter(
      (t) => (byTrack.get(t.id)?.length ?? 0) > 0
    );

    const TRACK_LANE_WIDTH = 560;
    const NODE_COL_OFFSET = 264;
    const ROW_HEIGHT = 128;

    const computedNodes: LessonNodeType[] = [];

    activeTracks.forEach((track, trackColIndex) => {
      const trackLessons = (byTrack.get(track.id) ?? []).sort(
        (a, b) => a.number - b.number
      );
      const minDepth = Math.min(...trackLessons.map((l) => depths[l.slug] ?? 0));

      const depthBuckets = new Map<number, CurriculumPlanEntry[]>();
      for (const lesson of trackLessons) {
        const relDepth = (depths[lesson.slug] ?? 0) - minDepth;
        const bucket = depthBuckets.get(relDepth) ?? [];
        bucket.push(lesson);
        depthBuckets.set(relDepth, bucket);
      }

      const sortedDepths = Array.from(depthBuckets.keys()).sort((a, b) => a - b);
      let currentY = 40;

      for (const relDepth of sortedDepths) {
        const bucket = depthBuckets.get(relDepth) ?? [];
        const rowsInBucket = Math.ceil(bucket.length / 2);

        bucket.forEach((entry, idx) => {
          const subCol = bucket.length === 1 ? 0 : idx % 2;
          const subRow = Math.floor(idx / 2);
          const x =
            trackColIndex * TRACK_LANE_WIDTH +
            (bucket.length === 1 ? 120 : subCol * NODE_COL_OFFSET) +
            20;
          const y = currentY + subRow * ROW_HEIGHT;

          const isDone = Boolean(state.completedLessons[entry.slug]?.completed);
          const ready = arePrerequisitesMet(
            entry.slug,
            state.completedLessons,
            CURRICULUM_PLAN
          );
          const status: MasteryStatus = isDone
            ? "completed"
            : ready
            ? "ready"
            : "advisory";

          let role: HighlightRole = "none";
          if (activeSlug) {
            if (entry.slug === activeSlug) role = "selected";
            else if (upstreamSet.has(entry.slug)) role = "upstream";
            else if (downstreamSet.has(entry.slug)) role = "downstream";
            else role = "dimmed";
          }

          const domainTitle =
            getDomainById(entry.domainId)?.title ?? entry.domainId;

          computedNodes.push({
            id: entry.slug,
            type: "lessonNode",
            position: { x, y },
            data: {
              entry,
              domainTitle,
              trackNumber: track.number,
              depth: depths[entry.slug] ?? 0,
              status,
              role,
            },
          });
        });

        currentY += rowsInBucket * ROW_HEIGHT + 24;
      }
    });

    const computedEdges: Edge[] = [];
    for (const entry of filteredEntries) {
      for (const prereq of entry.prerequisites) {
        if (!visibleSlugs.has(prereq)) continue;

        const isHighlighted =
          activeSlug !== null &&
          ((prereq === activeSlug && downstreamSet.has(entry.slug)) ||
            (entry.slug === activeSlug && upstreamSet.has(prereq)) ||
            (upstreamSet.has(prereq) && upstreamSet.has(entry.slug)) ||
            (downstreamSet.has(prereq) && downstreamSet.has(entry.slug)));

        const isUpstreamEdge =
          activeSlug !== null &&
          (entry.slug === activeSlug || upstreamSet.has(entry.slug)) &&
          upstreamSet.has(prereq);

        const isDownstreamEdge =
          activeSlug !== null &&
          (prereq === activeSlug || downstreamSet.has(prereq)) &&
          downstreamSet.has(entry.slug);

        const stroke = isUpstreamEdge
          ? "var(--accent-amber)"
          : isDownstreamEdge
          ? "var(--accent-emerald)"
          : isHighlighted
          ? "var(--accent-blue)"
          : "var(--border-strong)";

        computedEdges.push({
          id: `${prereq}->${entry.slug}`,
          source: prereq,
          target: entry.slug,
          type: "smoothstep",
          animated: isHighlighted,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: stroke,
            width: 14,
            height: 14,
          },
          style: {
            stroke,
            strokeWidth: isHighlighted ? 2.2 : 1.25,
            opacity: activeSlug && !isHighlighted ? 0.18 : 0.9,
          },
        });
      }
    }

    return { nodes: computedNodes, edges: computedEdges };
  }, [
    filteredEntries,
    depths,
    state.completedLessons,
    activeSlug,
    upstreamSet,
    downstreamSet,
  ]);

  const focusedEntry = useMemo(
    () => CURRICULUM_PLAN.find((e) => e.slug === (selectedSlug ?? hoveredSlug)),
    [selectedSlug, hoveredSlug]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Control & filter toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--text-secondary)]">
            <Filter className="h-3.5 w-3.5 text-[var(--text-muted)]" />
            <span>Filter:</span>
          </div>

          <select
            aria-label="Filter by track"
            value={trackFilter}
            onChange={(e) => {
              const val = e.target.value as TrackId | "all";
              setTrackFilter(val);
              setDomainFilter("all");
            }}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
          >
            <option value="all">All 6 Tracks ({CURRICULUM_PLAN.length})</option>
            {TRACKS.map((track) => (
              <option key={track.id} value={track.id}>
                Track {track.number}: {track.title}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by domain"
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value as DomainId | "all")}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
          >
            <option value="all">All Domains ({availableDomains.length})</option>
            {availableDomains.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.title}
              </option>
            ))}
          </select>

          {(trackFilter !== "all" || domainFilter !== "all" || selectedSlug) && (
            <button
              type="button"
              onClick={() => {
                setTrackFilter("all");
                setDomainFilter("all");
                setSelectedSlug(null);
              }}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] px-2 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[var(--text-muted)]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border-2 border-[var(--accent-emerald)]" />
            Completed
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border-2 border-[var(--accent-blue)]" />
            Prereqs Met
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm border-2 border-[var(--border-strong)]" />
            Advisory Prereqs
          </span>

          <div className="flex items-center rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-0.5">
            <button
              type="button"
              onClick={() => setClickBehavior("navigate")}
              className={`rounded px-2 py-0.5 text-[11px] ${
                clickBehavior === "navigate"
                  ? "bg-[var(--bg-surface)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              Click: Open Lesson
            </button>
            <button
              type="button"
              onClick={() => setClickBehavior("inspect")}
              className={`rounded px-2 py-0.5 text-[11px] ${
                clickBehavior === "inspect"
                  ? "bg-[var(--bg-surface)] font-medium text-[var(--text-primary)]"
                  : "text-[var(--text-muted)]"
              }`}
            >
              Click: Pin Lineage
            </button>
          </div>
        </div>
      </div>

      {/* Main Flow Canvas */}
      <div className="relative flex-1 min-h-[540px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={NODE_TYPES}
          className={resolvedTheme === "dark" ? "dark" : undefined}
          style={{
            colorScheme: resolvedTheme,
            backgroundColor: "var(--bg-canvas)",
          }}
          fitView
          fitViewOptions={{ padding: 0.14 }}
          minZoom={0.18}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          onNodeMouseEnter={(_, node) => setHoveredSlug(node.id)}
          onNodeMouseLeave={() => setHoveredSlug(null)}
          onNodeClick={(_, node) => {
            if (clickBehavior === "navigate") {
              router.push(`/learn/${node.id}`);
            } else {
              setSelectedSlug((prev) => (prev === node.id ? null : node.id));
            }
          }}
          onPaneClick={() => setSelectedSlug(null)}
        >
          <Background gap={24} size={1} color="var(--border-subtle)" />
          <Controls showInteractive={false} />
          <MiniMap
            pannable
            zoomable
            maskColor={
              resolvedTheme === "dark"
                ? "rgba(10, 11, 13, 0.7)"
                : "rgba(250, 250, 250, 0.7)"
            }
            nodeColor={(node) => {
              const data = node.data as LessonNodeData | undefined;
              if (data?.status === "completed") return "#059669";
              if (data?.status === "ready") return "#2563eb";
              return "#9ca3af";
            }}
          />
        </ReactFlow>

        {/* Focused lineage floating summary card */}
        {focusedEntry && (
          <div className="pointer-events-auto absolute bottom-4 left-4 z-10 max-w-sm rounded-lg border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3.5">
            <div className="flex items-center justify-between gap-2 text-[11px] font-mono text-[var(--text-muted)]">
              <span>
                Track {getTrackById(focusedEntry.trackId)?.number} · Lesson{" "}
                {focusedEntry.number}
              </span>
              <span className="swiss-tabular">
                {upstreamSet.size} prereqs · {downstreamSet.size} unlocks
              </span>
            </div>
            <h3 className="mt-1 text-sm font-semibold text-[var(--text-primary)]">
              {focusedEntry.title}
            </h3>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {focusedEntry.moduleTitle}
            </p>
            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--text-muted)]">
                Amber = upstream · Emerald = downstream
              </span>
              <Link
                href={`/learn/${focusedEntry.slug}`}
                className="inline-flex items-center gap-1 rounded bg-[var(--accent-blue)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90"
              >
                Open
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
