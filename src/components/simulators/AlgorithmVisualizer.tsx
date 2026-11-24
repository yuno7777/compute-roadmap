"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  DEFAULT_WEIGHTED_GRAPH,
  traceBinarySearch,
  traceBfs,
  traceDfs,
  traceDijkstra,
  traceMergesort,
  traceQuicksort,
  type AlgorithmKind,
  type ArrayStep,
  type GraphInput,
  type GraphStep,
} from "@/lib/simulators/algorithms";

export function AlgorithmVisualizer({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [algo, setAlgo] = useState<AlgorithmKind>("dijkstra");
  const [arrayInput, setArrayInput] = useState("38, 27, 43, 3, 9, 82, 10");
  const [searchTarget, setSearchTarget] = useState(43);
  const [graph, setGraph] = useState<GraphInput>(DEFAULT_WEIGHTED_GRAPH);
  const [startNode, setStartNode] = useState("A");
  const [targetNode, setTargetNode] = useState("D");
  const [stepIdx, setStepIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const isGraphAlgo = algo === "bfs" || algo === "dfs" || algo === "dijkstra";

  const parsedArray = useMemo(() => {
    const nums = arrayInput
      .split(/[,\s]+/)
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n));
    return nums.length > 0 ? nums.slice(0, 16) : [5, 2, 8, 1, 9];
  }, [arrayInput]);

  const arraySteps: ArrayStep[] = useMemo(() => {
    if (algo === "quicksort") return traceQuicksort(parsedArray);
    if (algo === "mergesort") return traceMergesort(parsedArray);
    if (algo === "binary-search")
      return traceBinarySearch(parsedArray, searchTarget);
    return [];
  }, [algo, parsedArray, searchTarget]);

  const graphSteps: GraphStep[] = useMemo(() => {
    if (algo === "bfs") return traceBfs(graph, startNode, targetNode);
    if (algo === "dfs") return traceDfs(graph, startNode, targetNode);
    if (algo === "dijkstra") return traceDijkstra(graph, startNode, targetNode);
    return [];
  }, [algo, graph, startNode, targetNode]);

  const totalSteps = isGraphAlgo ? graphSteps.length : arraySteps.length;
  const clampedStep = Math.min(stepIdx, Math.max(0, totalSteps - 1));

  // Track BFS vs Dijkstra comparison for challenge completion
  const bfsBaseline = useMemo(
    () => traceBfs(graph, startNode, targetNode),
    [graph, startNode, targetNode]
  );
  const dijkstraBaseline = useMemo(
    () => traceDijkstra(graph, startNode, targetNode),
    [graph, startNode, targetNode]
  );

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    if (clampedStep >= totalSteps - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setStepIdx((s) => Math.min(totalSteps - 1, s + 1));
    }, 520);
    return () => clearTimeout(timer);
  }, [isPlaying, clampedStep, totalSteps]);

  useEffect(() => {
    if (algo !== "dijkstra" || clampedStep < totalSteps - 1) return;
    const bfsCost = bfsBaseline[bfsBaseline.length - 1]?.totalCost;
    const dijkCost = dijkstraBaseline[dijkstraBaseline.length - 1]?.totalCost;
    if (
      !completedRef.current &&
      bfsCost !== null &&
      bfsCost !== undefined &&
      dijkCost !== null &&
      dijkCost !== undefined &&
      dijkCost < bfsCost
    ) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [algo, clampedStep, totalSteps, bfsBaseline, dijkstraBaseline, onChallengeComplete]);

  const switchAlgo = (next: AlgorithmKind) => {
    setAlgo(next);
    setStepIdx(0);
    setIsPlaying(false);
  };

  const updateEdgeWeight = (idx: number, w: number) => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.map((e, i) =>
        i === idx ? { ...e, weight: Math.max(1, w) } : e
      ),
    }));
    setStepIdx(0);
    setIsPlaying(false);
  };

  const currentArrStep = arraySteps[clampedStep];
  const currentGraphStep = graphSteps[clampedStep];
  const maxArrVal = Math.max(1, ...parsedArray.map((n) => Math.abs(n)));

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · Algorithms &amp; Graphs
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            Sorting, Search &amp; Shortest-Path Animator
          </h3>
        </div>
        {challengeDone && (
          <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Challenge Passed
          </span>
        )}
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <strong className="font-semibold text-[var(--text-primary)]">
            Challenge:
          </strong>{" "}
          {challengeGoal}
        </div>
      )}

      {/* Algorithm Selector & Playback */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["dijkstra", "Dijkstra"],
              ["bfs", "BFS"],
              ["dfs", "DFS"],
              ["quicksort", "Quicksort"],
              ["mergesort", "Mergesort"],
              ["binary-search", "Binary Search"],
            ] as Array<[AlgorithmKind, string]>
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => switchAlgo(id)}
              className={`rounded px-2.5 py-1 text-xs font-medium ${
                algo === id
                  ? "bg-[var(--accent-blue)] text-white"
                  : "border border-[var(--border-strong)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx((s) => Math.min(totalSteps - 1, s + 1));
            }}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-primary)]"
          >
            <StepForward className="h-3.5 w-3.5" /> Step
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPlaying && clampedStep >= totalSteps - 1) setStepIdx(0);
              setIsPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1 rounded bg-[var(--accent-blue)] px-3 py-1 text-xs font-medium text-white"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Play
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setStepIdx(0);
            }}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Main Visualization */}
      {isGraphAlgo && currentGraphStep ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded border border-[var(--border-subtle)] p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span>Start:</span>
                <select
                  value={startNode}
                  onChange={(e) => {
                    setStartNode(e.target.value);
                    setStepIdx(0);
                  }}
                  className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
                >
                  {graph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id}
                    </option>
                  ))}
                </select>
                <span>Target:</span>
                <select
                  value={targetNode}
                  onChange={(e) => {
                    setTargetNode(e.target.value);
                    setStepIdx(0);
                  }}
                  className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
                >
                  {graph.nodes.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.id}
                    </option>
                  ))}
                </select>
              </div>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                Step {clampedStep + 1}/{totalSteps} · Comparisons:{" "}
                {currentGraphStep.comparisons}
              </span>
            </div>

            <svg
              viewBox="0 0 560 260"
              className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
            >
              {graph.edges.map((edge, idx) => {
                const a = graph.nodes.find((n) => n.id === edge.from)!;
                const b = graph.nodes.find((n) => n.id === edge.to)!;
                const onPath =
                  currentGraphStep.path.length > 1 &&
                  currentGraphStep.path.some(
                    (id, i) =>
                      i < currentGraphStep.path.length - 1 &&
                      ((id === edge.from && currentGraphStep.path[i + 1] === edge.to) ||
                        (id === edge.to && currentGraphStep.path[i + 1] === edge.from))
                  );
                const isRelaxed =
                  currentGraphStep.relaxedEdge &&
                  ((currentGraphStep.relaxedEdge.from === edge.from &&
                    currentGraphStep.relaxedEdge.to === edge.to) ||
                    (currentGraphStep.relaxedEdge.from === edge.to &&
                      currentGraphStep.relaxedEdge.to === edge.from));
                const mx = (a.x + b.x) / 2;
                const my = (a.y + b.y) / 2;
                return (
                  <g key={`${edge.from}-${edge.to}-${idx}`}>
                    <line
                      x1={a.x}
                      y1={a.y}
                      x2={b.x}
                      y2={b.y}
                      stroke={
                        onPath
                          ? "var(--accent-emerald)"
                          : isRelaxed
                            ? "var(--accent-amber)"
                            : "var(--border-strong)"
                      }
                      strokeWidth={onPath ? 3.5 : isRelaxed ? 3 : 1.75}
                    />
                    <rect
                      x={mx - 12}
                      y={my - 10}
                      width={24}
                      height={18}
                      rx={4}
                      fill="var(--bg-surface)"
                      stroke="var(--border-subtle)"
                    />
                    <text
                      x={mx}
                      y={my + 3}
                      textAnchor="middle"
                      fontSize="11"
                      fontFamily="var(--font-mono-stack)"
                      fill="var(--text-primary)"
                    >
                      {edge.weight}
                    </text>
                  </g>
                );
              })}

              {graph.nodes.map((node) => {
                const isCurr = currentGraphStep.currentNodeId === node.id;
                const isVisited = currentGraphStep.visited.includes(node.id);
                const inFrontier = currentGraphStep.frontier.includes(node.id);
                const distVal = currentGraphStep.distances[node.id];
                const fill = isCurr
                  ? "var(--accent-amber)"
                  : isVisited
                    ? "var(--accent-emerald)"
                    : inFrontier
                      ? "var(--accent-blue)"
                      : "var(--bg-surface)";
                const textColor =
                  isCurr || isVisited || inFrontier
                    ? "#ffffff"
                    : "var(--text-primary)";

                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r={22}
                      fill={fill}
                      stroke="var(--border-strong)"
                      strokeWidth={2}
                    />
                    <text
                      x={node.x}
                      y={node.y - 2}
                      textAnchor="middle"
                      fontSize="13"
                      fontWeight="700"
                      fontFamily="var(--font-mono-stack)"
                      fill={textColor}
                    >
                      {node.label}
                    </text>
                    <text
                      x={node.x}
                      y={node.y + 12}
                      textAnchor="middle"
                      fontSize="9.5"
                      fontFamily="var(--font-mono-stack)"
                      fill={textColor}
                    >
                      {distVal === Infinity ? "∞" : `d=${distVal}`}
                    </text>
                  </g>
                );
              })}
            </svg>

            <div className="rounded bg-[var(--bg-subtle)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]">
              {currentGraphStep.description}
            </div>
          </div>

          {/* Edge Weights Editor & BFS vs Dijkstra Summary */}
          <div className="rounded border border-[var(--border-subtle)] p-3.5 space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              Editable Edge Weights
            </h4>
            <div className="space-y-1.5 font-mono text-xs">
              {graph.edges.map((edge, idx) => (
                <div
                  key={`${edge.from}-${edge.to}-${idx}`}
                  className="flex items-center justify-between gap-2"
                >
                  <span>
                    {edge.from} &lt;-&gt; {edge.to}
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={edge.weight}
                    onChange={(e) =>
                      updateEdgeWeight(idx, Number(e.target.value))
                    }
                    className="w-16 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-0.5 text-right"
                  />
                </div>
              ))}
            </div>

            <div className="border-t border-[var(--border-subtle)] pt-3 space-y-1 font-mono text-xs">
              <div className="text-[11px] uppercase text-[var(--text-muted)]">
                Path Comparison ({startNode} -&gt; {targetNode})
              </div>
              <div className="flex justify-between">
                <span>BFS (fewest hops):</span>
                <span className="text-[var(--accent-amber)]">
                  cost={bfsBaseline[bfsBaseline.length - 1]?.totalCost ?? "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Dijkstra (min cost):</span>
                <span className="text-[var(--accent-emerald)]">
                  cost={dijkstraBaseline[dijkstraBaseline.length - 1]?.totalCost ?? "—"}
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        currentArrStep && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <span>Array:</span>
                <input
                  type="text"
                  value={arrayInput}
                  onChange={(e) => {
                    setArrayInput(e.target.value);
                    setStepIdx(0);
                  }}
                  className="w-64 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs text-[var(--text-primary)]"
                />
              </label>
              {algo === "binary-search" && (
                <label className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span>Target:</span>
                  <input
                    type="number"
                    value={searchTarget}
                    onChange={(e) => {
                      setSearchTarget(Number(e.target.value));
                      setStepIdx(0);
                    }}
                    className="w-20 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs text-[var(--text-primary)]"
                  />
                </label>
              )}
              <div className="ml-auto font-mono text-xs text-[var(--text-muted)] swiss-tabular">
                Step {clampedStep + 1}/{totalSteps} · Comparisons:{" "}
                {currentArrStep.comparisons} · Swaps: {currentArrStep.swaps}
              </div>
            </div>

            <div className="flex h-48 items-end gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4">
              {currentArrStep.array.map((val, idx) => {
                const isActive = currentArrStep.activeIndices.includes(idx);
                const isSorted = currentArrStep.sortedIndices.includes(idx);
                const isPivot = currentArrStep.pivotIndex === idx;
                const heightPct = Math.max(12, (Math.abs(val) / maxArrVal) * 100);
                const bg = isPivot
                  ? "var(--accent-amber)"
                  : isActive
                    ? "var(--accent-blue)"
                    : isSorted
                      ? "var(--accent-emerald)"
                      : "var(--border-strong)";
                return (
                  <div
                    key={idx}
                    className="flex flex-1 flex-col items-center justify-end h-full"
                  >
                    <span className="mb-1 font-mono text-xs font-semibold swiss-tabular">
                      {val}
                    </span>
                    <div
                      style={{ height: `${heightPct}%`, backgroundColor: bg }}
                      className="w-full rounded-t transition-all duration-150"
                    />
                    <span className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">
                      {idx}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="rounded bg-[var(--bg-subtle)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]">
              {currentArrStep.description}
            </div>
          </div>
        )
      )}
    </div>
  );
}
