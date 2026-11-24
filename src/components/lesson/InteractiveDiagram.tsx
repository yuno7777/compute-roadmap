"use client";

import { Info } from "lucide-react";
import { useMemo, useState } from "react";
import type { LessonDiagramNode, LessonDiagramSpec } from "@/types/curriculum";

function getToneColors(tone: LessonDiagramNode["tone"] = "neutral") {
  switch (tone) {
    case "accent":
      return {
        stroke: "var(--accent-blue)",
        fill: "var(--accent-blue-soft)",
        badge: "var(--accent-blue)",
      };
    case "emerald":
      return {
        stroke: "var(--accent-emerald)",
        fill: "var(--accent-emerald-soft)",
        badge: "var(--accent-emerald)",
      };
    case "amber":
      return {
        stroke: "var(--accent-amber)",
        fill: "var(--accent-amber-soft)",
        badge: "var(--accent-amber)",
      };
    default:
      return {
        stroke: "var(--border-strong)",
        fill: "var(--bg-surface)",
        badge: "var(--text-muted)",
      };
  }
}

export interface InteractiveDiagramProps {
  diagram: LessonDiagramSpec;
}

export function InteractiveDiagram({ diagram }: InteractiveDiagramProps) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(
    diagram.nodes[0]?.id ?? null
  );

  const layout = useMemo(() => {
    if (diagram.nodes.length === 0) {
      return {
        width: 720,
        height: 280,
        positions: new Map<string, { x: number; y: number }>(),
      };
    }

    const xs = diagram.nodes.map((n) => n.x);
    const ys = diagram.nodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const spanX = maxX - minX;
    const spanY = maxY - minY;

    // Normalize small coordinate spaces (e.g. 0..100) into roomy SVG pixel space
    const scaleX = spanX > 0 && spanX <= 160 ? 580 / spanX : 1;
    const scaleY = spanY > 0 && spanY <= 160 ? 220 / spanY : 1;

    const padX = 110;
    const padY = 64;

    const positions = new Map<string, { x: number; y: number }>();
    let maxCanvasX = 0;
    let maxCanvasY = 0;

    for (const node of diagram.nodes) {
      const cx = (node.x - minX) * scaleX + padX;
      const cy = (node.y - minY) * scaleY + padY;
      positions.set(node.id, { x: cx, y: cy });
      maxCanvasX = Math.max(maxCanvasX, cx);
      maxCanvasY = Math.max(maxCanvasY, cy);
    }

    return {
      width: Math.max(680, maxCanvasX + padX),
      height: Math.max(260, maxCanvasY + padY),
      positions,
    };
  }, [diagram.nodes]);

  const selectedNode = useMemo(
    () => diagram.nodes.find((n) => n.id === selectedNodeId) ?? null,
    [diagram.nodes, selectedNodeId]
  );

  const connectedEdges = useMemo(() => {
    if (!selectedNodeId) return [];
    return diagram.edges.filter(
      (e) => e.from === selectedNodeId || e.to === selectedNodeId
    );
  }, [diagram.edges, selectedNodeId]);

  const NODE_W = 154;
  const NODE_H = 54;

  return (
    <section className="swiss-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Interactive Schematic
          </p>
          <h3 className="mt-0.5 text-base font-semibold text-[var(--text-primary)]">
            {diagram.title}
          </h3>
        </div>
        <span className="text-xs text-[var(--text-muted)]">
          Click any node to inspect connections
        </span>
      </div>

      <div className="mt-4 overflow-x-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-2">
        <svg
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          className="h-auto w-full min-w-[540px]"
          role="img"
          aria-label={diagram.title}
        >
          <defs>
            <marker
              id="diagram-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--border-strong)" />
            </marker>
            <marker
              id="diagram-arrow-active"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-blue)" />
            </marker>
          </defs>

          {/* Edges */}
          {diagram.edges.map((edge, idx) => {
            const fromPos = layout.positions.get(edge.from);
            const toPos = layout.positions.get(edge.to);
            if (!fromPos || !toPos) return null;

            const isHighlighted =
              selectedNodeId !== null &&
              (edge.from === selectedNodeId || edge.to === selectedNodeId);

            // Offset line endpoints toward node perimeter along vector
            const dx = toPos.x - fromPos.x;
            const dy = toPos.y - fromPos.y;
            const dist = Math.hypot(dx, dy) || 1;
            const ux = dx / dist;
            const uy = dy / dist;

            const startX = fromPos.x + ux * (Math.abs(ux) > 0.5 ? NODE_W / 2 : 24);
            const startY = fromPos.y + uy * (Math.abs(uy) > 0.5 ? NODE_H / 2 : 16);
            const endX = toPos.x - ux * (Math.abs(ux) > 0.5 ? NODE_W / 2 + 4 : 28);
            const endY = toPos.y - uy * (Math.abs(uy) > 0.5 ? NODE_H / 2 + 4 : 20);

            const midX = (startX + endX) / 2;
            const midY = (startY + endY) / 2;

            return (
              <g key={`${edge.from}-${edge.to}-${idx}`}>
                <line
                  x1={startX}
                  y1={startY}
                  x2={endX}
                  y2={endY}
                  stroke={
                    isHighlighted
                      ? "var(--accent-blue)"
                      : "var(--border-strong)"
                  }
                  strokeWidth={isHighlighted ? 2.25 : 1.5}
                  markerEnd={
                    isHighlighted
                      ? "url(#diagram-arrow-active)"
                      : "url(#diagram-arrow)"
                  }
                />
                {edge.label && (
                  <g transform={`translate(${midX}, ${midY})`}>
                    <rect
                      x={-Math.min(72, edge.label.length * 3.4 + 8)}
                      y={-10}
                      width={Math.min(144, edge.label.length * 6.8 + 16)}
                      height={18}
                      rx={4}
                      fill="var(--bg-surface)"
                      stroke="var(--border-subtle)"
                      strokeWidth={1}
                    />
                    <text
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="10"
                      fill={
                        isHighlighted
                          ? "var(--accent-blue)"
                          : "var(--text-muted)"
                      }
                      fontFamily="var(--font-mono-stack)"
                    >
                      {edge.label}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {diagram.nodes.map((node) => {
            const pos = layout.positions.get(node.id);
            if (!pos) return null;
            const isSelected = node.id === selectedNodeId;
            const colors = getToneColors(node.tone);

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x - NODE_W / 2}, ${pos.y - NODE_H / 2})`}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                onClick={() => setSelectedNodeId(node.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setSelectedNodeId(node.id);
                  }
                }}
                className="cursor-pointer focus:outline-none"
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  fill={colors.fill}
                  stroke={isSelected ? "var(--accent-blue)" : colors.stroke}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
                <text
                  x={NODE_W / 2}
                  y={node.sublabel ? 21 : NODE_H / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="12"
                  fontWeight="600"
                  fill="var(--text-primary)"
                  fontFamily="var(--font-sans-stack)"
                >
                  {node.label.length > 22
                    ? `${node.label.slice(0, 21)}…`
                    : node.label}
                </text>
                {node.sublabel && (
                  <text
                    x={NODE_W / 2}
                    y={38}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="10"
                    fill="var(--text-muted)"
                    fontFamily="var(--font-mono-stack)"
                  >
                    {node.sublabel.length > 24
                      ? `${node.sublabel.slice(0, 23)}…`
                      : node.sublabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {selectedNode && (
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3 rounded-md border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-blue)]" />
            <div>
              <p className="font-semibold text-[var(--text-primary)]">
                {selectedNode.label}
              </p>
              {selectedNode.sublabel && (
                <p className="mt-0.5 text-[var(--text-secondary)]">
                  {selectedNode.sublabel}
                </p>
              )}
            </div>
          </div>
          {connectedEdges.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {connectedEdges.map((edge, idx) => (
                <span
                  key={idx}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-muted)]"
                >
                  {edge.from} → {edge.to}
                  {edge.label ? ` (${edge.label})` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="mt-2.5 text-xs text-[var(--text-muted)]">{diagram.caption}</p>
    </section>
  );
}
