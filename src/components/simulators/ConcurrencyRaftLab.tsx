"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  StepForward,
  Wifi,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  appendClientCommand,
  createRaftCluster,
  healAllPartitions,
  setNodeAlive,
  setNodePartitionGroup,
  stepRaftTicks,
  type RaftClusterState,
} from "@/lib/simulators/concurrencyRaft";

export function ConcurrencyRaftLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [cluster, setCluster] = useState<RaftClusterState>(() =>
    createRaftCluster(42)
  );
  const [commandInput, setCommandInput] = useState("SET balance=100");
  const [isPlaying, setIsPlaying] = useState(false);
  const [sawPartition, setSawPartition] = useState(false);

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  useEffect(() => {
    const anyMinority = cluster.nodes.some((n) => n.partitionGroup === 1);
    if (anyMinority) setSawPartition(true);

    const allHealed = cluster.nodes.every((n) => n.partitionGroup === 0);
    const activeLeader = cluster.nodes.find((n) => n.alive && n.role === "leader");
    const committed = activeLeader && activeLeader.commitIndex >= 1;

    if (!completedRef.current && sawPartition && allHealed && committed) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [cluster, sawPartition, onChallengeComplete]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => {
      setCluster((prev) => stepRaftTicks(prev, 1));
    }, 350);
    return () => clearTimeout(timer);
  }, [isPlaying, cluster.tick]);

  const handleAppend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim()) return;
    setCluster((prev) => appendClientCommand(prev, commandInput.trim()).state);
  };

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · Distributed Consensus
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            5-Node Raft Consensus &amp; Partition Lab
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

      {/* Cluster Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs font-semibold swiss-tabular">
            Tick {cluster.tick}
          </span>
          <button
            type="button"
            onClick={() => setCluster((prev) => stepRaftTicks(prev, 1))}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium"
          >
            <StepForward className="h-3.5 w-3.5" /> +1 Tick
          </button>
          <button
            type="button"
            onClick={() => setCluster((prev) => stepRaftTicks(prev, 10))}
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium"
          >
            +10 Ticks
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
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
            onClick={() => setCluster((prev) => healAllPartitions(prev))}
            className="inline-flex items-center gap-1 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-emerald)]"
          >
            <Wifi className="h-3.5 w-3.5" /> Heal Partitions
          </button>
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setSawPartition(false);
              completedRef.current = false;
              setChallengeDone(false);
              setCluster(createRaftCluster(42));
            }}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        <form onSubmit={handleAppend} className="flex items-center gap-2">
          <input
            type="text"
            value={commandInput}
            onChange={(e) => setCommandInput(e.target.value)}
            className="w-40 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
            aria-label="Client log command"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1 rounded bg-[var(--accent-emerald)] px-2.5 py-1 text-xs font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Append Log
          </button>
        </form>
      </div>

      {/* 5 Nodes Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cluster.nodes.map((node) => {
          const roleColor = !node.alive
            ? "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]"
            : node.role === "leader"
              ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
              : node.role === "candidate"
                ? "border-[var(--accent-amber)] bg-[var(--accent-amber-soft)]"
                : "border-[var(--border-subtle)] bg-[var(--bg-surface)]";
          return (
            <div
              key={node.id}
              className={`rounded border p-3 space-y-2.5 ${roleColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold">{node.id}</span>
                <span className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] uppercase font-semibold">
                  {!node.alive ? "CRASHED" : node.role}
                </span>
              </div>

              <div className="space-y-0.5 font-mono text-[11px] swiss-tabular">
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Term:</span>
                  <span>{node.currentTerm}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">CommitIdx:</span>
                  <span>{node.commitIndex}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Timeout:</span>
                  <span>
                    {node.electionElapsed}/{node.electionTimeout}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Network:</span>
                  <span
                    className={
                      node.partitionGroup === 1
                        ? "text-[var(--accent-amber)] font-semibold"
                        : ""
                    }
                  >
                    {node.partitionGroup === 0 ? "Main (G0)" : "Minority (G1)"}
                  </span>
                </div>
              </div>

              {/* Log entries */}
              <div className="border-t border-[var(--border-subtle)] pt-1.5 font-mono text-[10px] space-y-0.5 max-h-24 overflow-y-auto">
                {node.log.length === 0 ? (
                  <div className="text-[var(--text-muted)]">Log empty</div>
                ) : (
                  node.log.map((entry) => (
                    <div
                      key={entry.index}
                      className={`truncate rounded px-1 py-0.5 ${
                        entry.index <= node.commitIndex
                          ? "bg-[var(--bg-surface)] font-semibold text-[var(--accent-emerald)]"
                          : "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      #{entry.index} [T{entry.term}] {entry.command}
                    </div>
                  ))
                )}
              </div>

              {/* Per-node actions */}
              <div className="flex flex-col gap-1 pt-1">
                <button
                  type="button"
                  onClick={() =>
                    setCluster((prev) => setNodeAlive(prev, node.id, !node.alive))
                  }
                  className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 text-[11px] font-medium"
                >
                  {node.alive ? "Kill Node" : "Revive Node"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCluster((prev) =>
                      setNodePartitionGroup(
                        prev,
                        node.id,
                        node.partitionGroup === 0 ? 1 : 0
                      )
                    )
                  }
                  className="inline-flex items-center justify-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 text-[11px]"
                >
                  <ShieldAlert className="h-3 w-3" />
                  {node.partitionGroup === 0 ? "Isolate (G1)" : "Rejoin (G0)"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Event Log */}
      <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
        <div className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          Cluster Event Log
        </div>
        <div className="max-h-32 overflow-y-auto space-y-0.5 font-mono text-[11px] text-[var(--text-secondary)]">
          {[...cluster.events].reverse().map((ev, idx) => (
            <div key={idx}>{ev}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
