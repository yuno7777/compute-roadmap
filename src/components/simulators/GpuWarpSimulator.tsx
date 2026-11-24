"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import { getSimulatorById } from "@/data/simulators";
import {
  analyzeSharedMemoryBanks,
  simulateGlobalMemoryCoalescing,
  simulateWarpExecution,
  WARP_PROGRAM_PRESETS,
  WARP_SIZE,
  type MemoryLayout,
} from "@/lib/simulators/gpuWarp";

export function GpuWarpSimulator({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const meta = getSimulatorById("gpu-warp");
  const goalText = challengeGoal ?? meta?.challengeDescription;

  const [presetId, setPresetId] = useState(WARP_PROGRAM_PRESETS[0].id);
  const [currentCycle, setCurrentCycle] = useState(0);
  const [playing, setPlaying] = useState(false);

  // Memory coalescing & bank-conflict controls
  const [layout, setLayout] = useState<MemoryLayout>("AoS");
  const [aosStrideBytes, setAosStrideBytes] = useState(16);
  const [sharedStrideWords, setSharedStrideWords] = useState(32);
  const [sharedPaddingWords, setSharedPaddingWords] = useState(0);

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const completedRef = useRef(false);

  const activePreset =
    WARP_PROGRAM_PRESETS.find((p) => p.id === presetId) ?? WARP_PROGRAM_PRESETS[0];

  const warpResult = useMemo(
    () => simulateWarpExecution(activePreset.statements, activePreset.title),
    [activePreset]
  );

  const memResult = useMemo(
    () =>
      simulateGlobalMemoryCoalescing({
        layout,
        strideBytes: aosStrideBytes,
        elementBytes: 4,
      }),
    [layout, aosStrideBytes]
  );

  const bankResult = useMemo(
    () =>
      analyzeSharedMemoryBanks({
        strideWords: sharedStrideWords,
        paddingWords: sharedPaddingWords,
      }),
    [sharedStrideWords, sharedPaddingWords]
  );

  useEffect(() => {
    setCurrentCycle(0);
    setPlaying(false);
  }, [presetId]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setCurrentCycle((c) => {
        if (c + 1 >= warpResult.totalCycles) {
          setPlaying(false);
          return c;
        }
        return c + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [playing, warpResult.totalCycles]);

  // Challenge: 128B global memory transactions == 1 (4x better than AoS 16B) AND bank conflict == 1
  useEffect(() => {
    const solved =
      memResult.transactions128B === 1 && bankResult.conflictWay === 1;
    if (solved && !completedRef.current) {
      completedRef.current = true;
      setChallengeCompleted(true);
      onChallengeComplete?.();
    }
  }, [memResult.transactions128B, bankResult.conflictWay, onChallengeComplete]);

  const activeStep =
    warpResult.cycles[Math.min(currentCycle, warpResult.cycles.length - 1)];

  function handleReset() {
    setPresetId(WARP_PROGRAM_PRESETS[0].id);
    setCurrentCycle(0);
    setPlaying(false);
    setLayout("AoS");
    setAosStrideBytes(16);
    setSharedStrideWords(32);
    setSharedPaddingWords(0);
  }

  return (
    <div className="swiss-card p-5 text-[var(--text-primary)] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            SIMT Architecture · 32-Thread Warp &amp; Memory Hierarchy
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            {meta?.title ?? "GPU SIMT Warp & Memory Coalescing Lab"}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-subtle)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Challenge Banner */}
      {goalText && (
        <div
          className={`flex items-center justify-between gap-3 rounded border px-3 py-2 text-xs ${
            challengeCompleted
              ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
          }`}
        >
          <p className="text-[var(--text-secondary)]">
            <strong className="font-semibold text-[var(--text-primary)]">
              Challenge:
            </strong>{" "}
            {goalText}
          </p>
          {challengeCompleted && (
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Solved
            </span>
          )}
        </div>
      )}

      {/* Section A: 32-Lane SIMT Warp Divergence Timeline */}
      <section className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">
              1. 32-Lane SIMT Branch Divergence Timeline
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              {activePreset.description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {WARP_PROGRAM_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPresetId(p.id)}
                className={`rounded border px-2 py-1 font-mono text-[11px] ${
                  presetId === p.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Playback Controls + Summary Metrics */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-muted)]"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() =>
                setCurrentCycle((c) => (c + 1) % warpResult.totalCycles)
              }
              className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-muted)]"
            >
              <StepForward className="h-3.5 w-3.5" />
              Step Cycle
            </button>
          </div>

          <div className="flex flex-wrap gap-4 font-mono text-xs swiss-tabular">
            <span>
              Total Cycles: <strong>{warpResult.totalCycles}</strong>
            </span>
            <span>
              Penalty:{" "}
              <strong
                className={
                  warpResult.serializationPenaltyCycles > 0
                    ? "text-[var(--accent-amber)]"
                    : "text-[var(--accent-emerald)]"
                }
              >
                +{warpResult.serializationPenaltyCycles}
              </strong>
            </span>
            <span>
              Warp Efficiency:{" "}
              <strong>{(warpResult.warpEfficiency * 100).toFixed(1)}%</strong>
            </span>
          </div>
        </div>

        {/* Cycle-by-cycle 32-lane mask grid */}
        <div className="mt-3 space-y-1.5 overflow-x-auto">
          {warpResult.cycles.map((step) => {
            const isSelected = step.cycleIndex === activeStep?.cycleIndex;
            return (
              <div
                key={step.cycleIndex}
                onClick={() => setCurrentCycle(step.cycleIndex)}
                className={`flex min-w-[640px] cursor-pointer items-center gap-3 rounded border px-2.5 py-1.5 ${
                  isSelected
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-subtle)]"
                }`}
              >
                <div className="w-12 shrink-0 font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
                  C{step.cycleIndex + 1}
                </div>
                <div className="w-40 shrink-0 truncate font-mono text-xs">
                  {step.instructionLabel}
                </div>
                <div
                  className="grid flex-1 gap-0.5"
                  style={{ gridTemplateColumns: "repeat(32, minmax(0, 1fr))" }}
                >
                  {step.activeMask.map((active, lane) => (
                    <div
                      key={lane}
                      title={`Lane ${lane}: ${active ? "Active" : "Masked"}`}
                      className={`h-4 rounded-[2px] border text-center font-mono text-[9px] leading-4 ${
                        active
                          ? step.diverged
                            ? "border-[var(--accent-amber)] bg-[var(--accent-amber)] text-white"
                            : "border-[var(--accent-emerald)] bg-[var(--accent-emerald)] text-white"
                          : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                      }`}
                    >
                      {lane % 8 === 0 ? lane : ""}
                    </div>
                  ))}
                </div>
                <div className="w-16 shrink-0 text-right font-mono text-[11px] swiss-tabular">
                  {step.activeCount}/{WARP_SIZE}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section B: Global Memory Coalescing & Shared Memory Banks */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Global Memory Coalescing */}
        <section className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">
              2. Global Memory Coalescing (128B Lines)
            </h4>
            <div className="flex gap-1">
              {(["AoS", "SoA"] as MemoryLayout[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setLayout(m)}
                  className={`rounded border px-2 py-0.5 font-mono text-xs ${
                    layout === m
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text-secondary)]">
                {layout === "SoA"
                  ? "SoA Contiguous Element Stride"
                  : "AoS Struct Stride (bytes)"}
              </span>
              <span className="font-mono swiss-tabular">
                {memResult.strideBytes} B / thread
              </span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              step={4}
              disabled={layout === "SoA"}
              value={layout === "SoA" ? 4 : aosStrideBytes}
              onChange={(e) => setAosStrideBytes(Number(e.target.value))}
              className="mt-1 w-full accent-[var(--accent-blue)]"
            />
          </div>

          <div className="mt-3 grid grid-cols-3 gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 font-mono text-xs swiss-tabular">
            <div>
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                128B Txns
              </div>
              <div
                className={`text-sm font-semibold ${
                  memResult.transactions128B === 1
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-amber)]"
                }`}
              >
                {memResult.transactions128B}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Bytes Fetched
              </div>
              <div className="text-sm font-semibold">
                {memResult.bytesTransferred} B
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Bus Utilization
              </div>
              <div className="text-sm font-semibold">
                {(memResult.busUtilization * 100).toFixed(0)}%
              </div>
            </div>
          </div>

          {/* Visual Cache Line Mapping */}
          <div className="mt-3">
            <div className="mb-1 font-mono text-[10px] uppercase text-[var(--text-muted)]">
              32 Lanes → 128B Cache Line Buckets
            </div>
            <div className="grid grid-cols-8 gap-1">
              {memResult.laneAccesses.map((acc) => (
                <div
                  key={acc.lane}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-1 py-0.5 text-center font-mono text-[10px] swiss-tabular"
                  title={`Lane ${acc.lane}: addr ${acc.address}B (Line ${acc.cacheLineIndex})`}
                >
                  <span className="text-[var(--text-muted)]">T{acc.lane}→</span>
                  <span className="font-semibold text-[var(--accent-blue)]">
                    L{acc.cacheLineIndex}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Shared-Memory 32-Bank Conflict Analyzer */}
        <section className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
          <h4 className="text-sm font-semibold">
            3. 32-Bank Shared Memory Conflict Analyzer
          </h4>

          <div className="mt-3 space-y-2">
            <div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">
                  Word Stride (4B words)
                </span>
                <span className="font-mono swiss-tabular">
                  {sharedStrideWords} words
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={32}
                step={1}
                value={sharedStrideWords}
                onChange={(e) => setSharedStrideWords(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span className="text-[var(--text-secondary)]">
                  Row Padding (+words to break power-of-2 aliasing)
                </span>
                <span className="font-mono swiss-tabular">
                  +{sharedPaddingWords} word
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={sharedPaddingWords}
                onChange={(e) => setSharedPaddingWords(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 font-mono text-xs swiss-tabular">
            <div>
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Conflict Degree
              </div>
              <div
                className={`text-sm font-semibold ${
                  bankResult.conflictWay === 1
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-crimson)]"
                }`}
              >
                {bankResult.conflictWay}-way{" "}
                {bankResult.conflictWay === 1 ? "(Conflict-Free)" : "Serialized"}
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Effective Stride
              </div>
              <div className="text-sm font-semibold">
                {sharedStrideWords + sharedPaddingWords} words
              </div>
            </div>
          </div>

          {/* 32 Banks Grid */}
          <div className="mt-3">
            <div className="mb-1 font-mono text-[10px] uppercase text-[var(--text-muted)]">
              Shared Memory Banks 0..31 (hits per bank)
            </div>
            <div className="grid grid-cols-8 gap-1">
              {bankResult.banks.map((b) => (
                <div
                  key={b.bank}
                  className={`rounded border px-1 py-1 text-center font-mono text-[10px] swiss-tabular ${
                    b.hasConflict
                      ? "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]"
                      : b.distinctWordAddresses === 1
                      ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  B{b.bank}: {b.distinctWordAddresses}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
