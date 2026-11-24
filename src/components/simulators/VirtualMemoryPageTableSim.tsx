"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward, CheckCircle2 } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  VM_WORKLOAD_PRESETS,
  accessVirtualAddress,
  createVirtualMemoryState,
  decodeVirtualAddress,
  type TlbPolicy,
  type VirtualMemoryConfig,
  type VirtualMemoryState,
} from "@/lib/simulators/virtualMemory";

function toHex(n: number, pad = 4): string {
  return "0x" + n.toString(16).toUpperCase().padStart(pad, "0");
}

function toBin(n: number, bits: number): string {
  return n.toString(2).padStart(bits, "0");
}

export function VirtualMemoryPageTableSim({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [pageSize, setPageSize] =
    useState<VirtualMemoryConfig["pageSize"]>(256);
  const [tlbCapacity, setTlbCapacity] = useState(4);
  const [tlbPolicy, setTlbPolicy] = useState<TlbPolicy>("LRU");
  const [numFrames, setNumFrames] = useState(4);
  const [presetId, setPresetId] = useState(VM_WORKLOAD_PRESETS[0].id);
  const [queueIndex, setQueueIndex] = useState(0);
  const [customAddr, setCustomAddr] = useState("0x0104");
  const [isWrite, setIsWrite] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [vm, setVm] = useState<VirtualMemoryState>(() =>
    createVirtualMemoryState({ pageSize: 256, tlbCapacity: 4, tlbPolicy: "LRU", numFrames: 4 })
  );

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  const activePreset = useMemo(
    () =>
      VM_WORKLOAD_PRESETS.find((p) => p.id === presetId) ??
      VM_WORKLOAD_PRESETS[0],
    [presetId]
  );

  const resetSim = (
    nextPageSize = pageSize,
    nextTlbCap = tlbCapacity,
    nextPolicy = tlbPolicy,
    nextFrames = numFrames
  ) => {
    setIsPlaying(false);
    setQueueIndex(0);
    completedRef.current = false;
    setChallengeDone(false);
    setVm(
      createVirtualMemoryState({
        pageSize: nextPageSize,
        tlbCapacity: nextTlbCap,
        tlbPolicy: nextPolicy,
        numFrames: nextFrames,
      })
    );
  };

  useEffect(() => {
    if (
      !completedRef.current &&
      vm.metrics.totalAccesses >= 8 &&
      vm.metrics.tlbHitRate >= 0.8
    ) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [vm.metrics.totalAccesses, vm.metrics.tlbHitRate, onChallengeComplete]);

  const stepPreset = () => {
    const addr =
      activePreset.addresses[queueIndex % activePreset.addresses.length];
    setVm((prev) => accessVirtualAddress(prev, addr, isWrite));
    setQueueIndex((i) => i + 1);
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (queueIndex >= activePreset.addresses.length) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(stepPreset, 550);
    return () => clearTimeout(timer);
  });

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = customAddr.trim().toLowerCase();
    const parsed = cleaned.startsWith("0x")
      ? parseInt(cleaned, 16)
      : parseInt(cleaned, 10);
    if (!Number.isFinite(parsed) || parsed < 0) return;
    setVm((prev) => accessVirtualAddress(prev, parsed & 0xffff, isWrite));
  };

  const latest = vm.history[vm.history.length - 1];
  const previewBreakdown =
    latest?.breakdown ?? decodeVirtualAddress(0x0104, pageSize);

  return (
    <div className="swiss-card p-5 space-y-5">
      {/* Header & Challenge */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · MMU &amp; Virtual Memory
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            2-Level Page Table &amp; TLB Translator
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

      {/* Configuration Controls */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <span className="font-medium">Page Size</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const next = Number(e.target.value) as VirtualMemoryConfig["pageSize"];
              setPageSize(next);
              resetSim(next, tlbCapacity, tlbPolicy, numFrames);
            }}
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)]"
          >
            <option value={64}>64 B (6-bit offset)</option>
            <option value={256}>256 B (8-bit offset)</option>
            <option value={1024}>1024 B (10-bit offset)</option>
            <option value={4096}>4096 B (12-bit offset)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <span className="font-medium">TLB Policy</span>
          <select
            value={tlbPolicy}
            onChange={(e) => {
              const next = e.target.value as TlbPolicy;
              setTlbPolicy(next);
              resetSim(pageSize, tlbCapacity, next, numFrames);
            }}
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-primary)]"
          >
            <option value="LRU">LRU (Least Recently Used)</option>
            <option value="FIFO">FIFO (First-In First-Out)</option>
          </select>
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span className="font-medium">TLB Entries</span>
            <span className="font-mono swiss-tabular">{tlbCapacity}</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            value={tlbCapacity}
            onChange={(e) => {
              const next = Number(e.target.value);
              setTlbCapacity(next);
              resetSim(pageSize, next, tlbPolicy, numFrames);
            }}
            className="accent-[var(--accent-blue)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span className="font-medium">Physical Frames</span>
            <span className="font-mono swiss-tabular">{numFrames}</span>
          </div>
          <input
            type="range"
            min={2}
            max={8}
            value={numFrames}
            onChange={(e) => {
              const next = Number(e.target.value);
              setNumFrames(next);
              resetSim(pageSize, tlbCapacity, tlbPolicy, next);
            }}
            className="accent-[var(--accent-blue)]"
          />
        </label>
      </div>

      {/* Workload & Address Submission */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={presetId}
            onChange={(e) => {
              setPresetId(e.target.value);
              resetSim();
            }}
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-primary)]"
          >
            {VM_WORKLOAD_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={stepPreset}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          >
            <StepForward className="h-3.5 w-3.5" />
            Step ({Math.min(queueIndex, activePreset.addresses.length)}/
            {activePreset.addresses.length})
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1 rounded bg-[var(--accent-blue)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
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
            onClick={() => resetSim()}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        <form onSubmit={handleCustomSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={customAddr}
            onChange={(e) => setCustomAddr(e.target.value)}
            aria-label="Virtual address in hex"
            placeholder="0x0104"
            className="w-24 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1.5 font-mono text-xs text-[var(--text-primary)]"
          />
          <label className="inline-flex items-center gap-1 text-xs text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={isWrite}
              onChange={(e) => setIsWrite(e.target.checked)}
            />
            Write
          </label>
          <button
            type="submit"
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--bg-muted)]"
          >
            Translate
          </button>
        </form>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-[var(--border-subtle)] p-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Accesses
          </div>
          <div className="mt-1 font-mono text-lg font-semibold swiss-tabular">
            {vm.metrics.totalAccesses}
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            TLB Hit Rate
          </div>
          <div
            className={`mt-1 font-mono text-lg font-semibold swiss-tabular ${
              vm.metrics.tlbHitRate >= 0.8
                ? "text-[var(--accent-emerald)]"
                : "text-[var(--accent-blue)]"
            }`}
          >
            {(vm.metrics.tlbHitRate * 100).toFixed(1)}%
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)]">
            {vm.metrics.tlbHits} hit / {vm.metrics.tlbMisses} miss
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Page Faults
          </div>
          <div className="mt-1 font-mono text-lg font-semibold swiss-tabular text-[var(--accent-amber)]">
            {vm.metrics.pageFaults}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)]">
            {(vm.metrics.pageFaultRate * 100).toFixed(1)}% fault rate
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-3">
          <div className="text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Last Translation
          </div>
          <div className="mt-1 font-mono text-sm font-semibold swiss-tabular">
            {latest
              ? `${toHex(latest.virtualAddress)} -> ${toHex(latest.physicalAddress)}`
              : "Idle"}
          </div>
          <div className="font-mono text-[11px] text-[var(--text-muted)]">
            {latest
              ? latest.tlbHit
                ? "TLB HIT"
                : latest.pageFault
                  ? "PAGE FAULT"
                  : "PT HIT"
              : "Step to begin"}
          </div>
        </div>
      </div>

      {/* Bit-Slice Translation Diagram */}
      <div className="rounded border border-[var(--border-subtle)] p-4">
        <div className="mb-2 text-xs font-medium text-[var(--text-secondary)]">
          16-Bit Virtual Address Breakdown (VA{" "}
          <span className="font-mono">{toHex(previewBreakdown.virtualAddress)}</span>)
        </div>
        <div className="grid grid-cols-3 gap-2 font-mono text-xs">
          <div className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] p-2.5">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              VPN1 ({previewBreakdown.vpn1Bits}b) · L1 Index
            </div>
            <div className="mt-0.5 text-sm font-semibold swiss-tabular text-[var(--accent-blue)]">
              {toBin(previewBreakdown.vpn1, previewBreakdown.vpn1Bits)} (0x
              {previewBreakdown.vpn1.toString(16).toUpperCase()})
            </div>
          </div>
          <div className="rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] p-2.5">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              VPN2 ({previewBreakdown.vpn2Bits}b) · L2 Index
            </div>
            <div className="mt-0.5 text-sm font-semibold swiss-tabular text-[var(--accent-emerald)]">
              {toBin(previewBreakdown.vpn2, previewBreakdown.vpn2Bits)} (0x
              {previewBreakdown.vpn2.toString(16).toUpperCase()})
            </div>
          </div>
          <div className="rounded border border-[var(--border-strong)] bg-[var(--bg-subtle)] p-2.5">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Offset ({previewBreakdown.offsetBits}b)
            </div>
            <div className="mt-0.5 text-sm font-semibold swiss-tabular">
              {toBin(previewBreakdown.offset, previewBreakdown.offsetBits)} (0x
              {previewBreakdown.offset.toString(16).toUpperCase()})
            </div>
          </div>
        </div>

        {latest && (
          <ul className="mt-3 space-y-1 border-t border-[var(--border-subtle)] pt-2.5 font-mono text-xs text-[var(--text-secondary)]">
            {latest.walkDetails.map((line, i) => (
              <li key={i}>• {line}</li>
            ))}
          </ul>
        )}
      </div>

      {/* TLB & Physical Frames Side-by-Side */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded border border-[var(--border-subtle)] p-3.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            TLB Cache ({vm.tlb.length}/{vm.config.tlbCapacity} · {vm.config.tlbPolicy})
          </h4>
          <div className="mt-2 space-y-1.5 font-mono text-xs">
            {vm.tlb.length === 0 ? (
              <p className="text-[var(--text-muted)]">TLB empty</p>
            ) : (
              vm.tlb.map((entry) => (
                <div
                  key={entry.vpn}
                  className={`flex items-center justify-between rounded border px-2.5 py-1.5 swiss-tabular ${
                    latest?.breakdown.vpn === entry.vpn
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                  }`}
                >
                  <span>VPN 0x{entry.vpn.toString(16).toUpperCase()}</span>
                  <span>-&gt; PFN {entry.pfn}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    t_use={entry.lastUsedAt}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded border border-[var(--border-subtle)] p-3.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Physical Memory Frames ({vm.config.numFrames} frames · LRU Eviction)
          </h4>
          <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs">
            {vm.frames.map((frame) => (
              <div
                key={frame.frameIndex}
                className={`rounded border p-2 swiss-tabular ${
                  latest?.pfn === frame.frameIndex
                    ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                <div className="flex justify-between font-semibold">
                  <span>PFN {frame.frameIndex}</span>
                  {frame.dirty && (
                    <span className="text-[10px] text-[var(--accent-amber)]">
                      DIRTY
                    </span>
                  )}
                </div>
                <div className="mt-1 text-[11px] text-[var(--text-secondary)]">
                  {frame.vpn === null
                    ? "FREE"
                    : `VPN 0x${frame.vpn.toString(16).toUpperCase()} (t=${frame.lastUsedAt})`}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
