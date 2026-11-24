"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  StepForward,
  Trash2,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  SCHEDULER_PRESETS,
  runScheduler,
  type ProcessSpec,
  type SchedulerPolicy,
} from "@/lib/simulators/osScheduler";

const PALETTE = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed"];

export function OsSchedulerSimulator({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [policy, setPolicy] = useState<SchedulerPolicy>("MLFQ");
  const [timeQuantum, setTimeQuantum] = useState(3);
  const [csOverhead, setCsOverhead] = useState(0);
  const [mlfqBoost, setMlfqBoost] = useState(25);
  const [processes, setProcesses] = useState<ProcessSpec[]>(
    SCHEDULER_PRESETS[0].processes
  );
  const [cursorTime, setCursorTime] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const result = useMemo(
    () =>
      runScheduler(processes, {
        policy,
        timeQuantum,
        contextSwitchOverhead: csOverhead,
        mlfqBoostInterval: mlfqBoost,
      }),
    [processes, policy, timeQuantum, csOverhead, mlfqBoost]
  );

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  useEffect(() => {
    const interactiveMetrics = result.processMetrics.filter((m) => {
      const spec = processes.find((p) => p.id === m.id);
      return spec && (spec.ioEvery ?? 0) > 0;
    });
    const batchMetrics = result.processMetrics.filter((m) => {
      const spec = processes.find((p) => p.id === m.id);
      return spec && !(spec.ioEvery ?? 0);
    });
    const interactiveFast =
      interactiveMetrics.length > 0 &&
      interactiveMetrics.every((m) => m.responseTime < 15);
    const batchCompleted =
      batchMetrics.length > 0 &&
      batchMetrics.every((m) => m.completionTime > m.arrivalTime);

    if (!completedRef.current && interactiveFast && batchCompleted) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [result, processes, onChallengeComplete]);

  const effectiveCursor = cursorTime ?? result.totalTime;

  useEffect(() => {
    if (!isPlaying) return;
    if (effectiveCursor >= result.totalTime) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setCursorTime((t) => Math.min(result.totalTime, (t ?? 0) + 1));
    }, 180);
    return () => clearTimeout(timer);
  }, [isPlaying, effectiveCursor, result.totalTime]);

  const colorMap = useMemo(() => {
    const map: Record<string, string> = {};
    processes.forEach((p, idx) => {
      map[p.id] = p.color ?? PALETTE[idx % PALETTE.length];
    });
    return map;
  }, [processes]);

  const updateProc = (
    idx: number,
    field: keyof ProcessSpec,
    value: string | number
  ) => {
    setProcesses((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const addProcess = () => {
    const nextIdx = processes.length + 1;
    setProcesses((prev) => [
      ...prev,
      {
        id: `P${nextIdx}`,
        name: `Task-${nextIdx}`,
        arrivalTime: 0,
        cpuBurst: 6,
        ioEvery: 0,
        ioDuration: 0,
        color: PALETTE[(nextIdx - 1) % PALETTE.length],
      },
    ]);
  };

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · Operating Systems
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            CPU Process Scheduler (FCFS / SJF / RR / MLFQ)
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

      {/* Policy & Sliders */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <span className="font-medium">Scheduling Policy</span>
          <select
            value={policy}
            onChange={(e) => setPolicy(e.target.value as SchedulerPolicy)}
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)]"
          >
            <option value="FCFS">FCFS (Non-preemptive)</option>
            <option value="SJF">SJF (Shortest Job First)</option>
            <option value="RR">Round-Robin (RR)</option>
            <option value="MLFQ">MLFQ (3-Queue Feedback)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span className="font-medium">Time Quantum (ms)</span>
            <span className="font-mono swiss-tabular">{timeQuantum}</span>
          </div>
          <input
            type="range"
            min={1}
            max={10}
            value={timeQuantum}
            disabled={policy === "FCFS" || policy === "SJF"}
            onChange={(e) => setTimeQuantum(Number(e.target.value))}
            className="accent-[var(--accent-blue)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span className="font-medium">CS Overhead (ms)</span>
            <span className="font-mono swiss-tabular">{csOverhead}</span>
          </div>
          <input
            type="range"
            min={0}
            max={3}
            value={csOverhead}
            onChange={(e) => setCsOverhead(Number(e.target.value))}
            className="accent-[var(--accent-blue)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span className="font-medium">MLFQ Boost (ms)</span>
            <span className="font-mono swiss-tabular">{mlfqBoost}</span>
          </div>
          <input
            type="range"
            min={10}
            max={50}
            step={5}
            value={mlfqBoost}
            disabled={policy !== "MLFQ"}
            onChange={(e) => setMlfqBoost(Number(e.target.value))}
            className="accent-[var(--accent-blue)]"
          />
        </label>
      </div>

      {/* Presets & Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          {SCHEDULER_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setProcesses(preset.processes);
                setCursorTime(null);
                setIsPlaying(false);
              }}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
            >
              {preset.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setIsPlaying(false);
              setCursorTime((t) =>
                t === null ? 1 : Math.min(result.totalTime, t + 1)
              );
            }}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          >
            <StepForward className="h-3.5 w-3.5" />
            Step
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isPlaying && effectiveCursor >= result.totalTime) {
                setCursorTime(0);
              }
              setIsPlaying((p) => !p);
            }}
            className="inline-flex items-center gap-1 rounded bg-[var(--accent-blue)] px-3 py-1 text-xs font-medium text-white hover:opacity-90"
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
              setCursorTime(null);
            }}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Full View
          </button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            Avg Response
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular text-[var(--accent-blue)]">
            {result.avgResponseTime.toFixed(1)} ms
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            Avg Waiting
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular">
            {result.avgWaitingTime.toFixed(1)} ms
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            Avg Turnaround
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular text-[var(--accent-emerald)]">
            {result.avgTurnaroundTime.toFixed(1)} ms
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            Ctx Switches
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular text-[var(--accent-amber)]">
            {result.contextSwitches}
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            CPU Util
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular">
            {(result.cpuUtilization * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Gantt Timeline */}
      <div className="rounded border border-[var(--border-subtle)] p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-primary)]">
            Gantt Execution Timeline (t = 0 .. {effectiveCursor} / {result.totalTime} ms)
          </span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            {policy === "MLFQ" ? "Labels show process + Q-level" : policy}
          </span>
        </div>

        <div className="flex h-12 w-full overflow-hidden rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
          {result.timeline.map((seg, i) => {
            if (seg.start >= effectiveCursor) return null;
            const visibleEnd = Math.min(seg.end, effectiveCursor);
            const widthPct =
              result.totalTime > 0
                ? ((visibleEnd - seg.start) / result.totalTime) * 100
                : 0;
            const isSystem = seg.processId === "IDLE" || seg.processId === "CS";
            const bg =
              seg.processId === "IDLE"
                ? "var(--bg-muted)"
                : seg.processId === "CS"
                  ? "var(--accent-amber)"
                  : colorMap[seg.processId] ?? "var(--accent-blue)";
            return (
              <div
                key={`${seg.processId}-${seg.start}-${i}`}
                style={{ width: `${widthPct}%`, backgroundColor: bg }}
                title={`${seg.label} [${seg.start}-${seg.end}ms]`}
                className={`flex flex-col items-center justify-center overflow-hidden border-r border-white/20 px-0.5 font-mono text-[10px] font-semibold ${
                  isSystem && seg.processId === "IDLE"
                    ? "text-[var(--text-muted)]"
                    : "text-white"
                }`}
              >
                <span className="truncate">{seg.processId}</span>
                {seg.queueLevel !== undefined && widthPct > 4 && (
                  <span className="text-[9px] opacity-85">Q{seg.queueLevel}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Editable Process Table & Per-Process Metrics */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-mono text-xs swiss-tabular">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
              <th className="py-2 pr-2">Process</th>
              <th className="py-2 pr-2">Arrival</th>
              <th className="py-2 pr-2">CPU Burst</th>
              <th className="py-2 pr-2">I/O Every</th>
              <th className="py-2 pr-2">I/O Dur</th>
              <th className="py-2 pr-2">Response</th>
              <th className="py-2 pr-2">Wait</th>
              <th className="py-2 pr-2">Turnaround</th>
              <th className="py-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((proc, idx) => {
              const m = result.processMetrics.find((x) => x.id === proc.id);
              return (
                <tr
                  key={proc.id}
                  className="border-b border-[var(--border-subtle)] last:border-b-0"
                >
                  <td className="py-1.5 pr-2 font-semibold">
                    <span
                      className="mr-1.5 inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: colorMap[proc.id] }}
                    />
                    {proc.name}
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      max={40}
                      value={proc.arrivalTime}
                      onChange={(e) =>
                        updateProc(idx, "arrivalTime", Math.max(0, Number(e.target.value)))
                      }
                      className="w-14 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={1}
                      max={40}
                      value={proc.cpuBurst}
                      onChange={(e) =>
                        updateProc(idx, "cpuBurst", Math.max(1, Number(e.target.value)))
                      }
                      className="w-14 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={proc.ioEvery ?? 0}
                      onChange={(e) =>
                        updateProc(idx, "ioEvery", Math.max(0, Number(e.target.value)))
                      }
                      className="w-14 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5"
                    />
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={proc.ioDuration ?? 0}
                      onChange={(e) =>
                        updateProc(idx, "ioDuration", Math.max(0, Number(e.target.value)))
                      }
                      className="w-14 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5"
                    />
                  </td>
                  <td className="py-1.5 pr-2 text-[var(--accent-blue)]">
                    {m?.responseTime ?? 0}ms
                  </td>
                  <td className="py-1.5 pr-2">{m?.waitingTime ?? 0}ms</td>
                  <td className="py-1.5 pr-2 text-[var(--accent-emerald)]">
                    {m?.turnaroundTime ?? 0}ms
                  </td>
                  <td className="py-1.5 text-right">
                    <button
                      type="button"
                      disabled={processes.length <= 1}
                      onClick={() =>
                        setProcesses((prev) => prev.filter((_, i) => i !== idx))
                      }
                      className="rounded p-1 text-[var(--text-muted)] hover:text-[var(--accent-crimson)] disabled:opacity-40"
                      aria-label={`Remove ${proc.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={addProcess}
        className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
      >
        <Plus className="h-3.5 w-3.5" /> Add Process
      </button>
    </div>
  );
}
