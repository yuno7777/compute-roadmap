"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Play, RotateCcw } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  accessCache,
  createCacheState,
  createMesiState,
  decomposeCacheAddress,
  runCacheTrace,
  stepMesi,
  type CacheAssociativity,
  type CacheSimulationState,
  type MesiState,
} from "@/lib/simulators/cacheMemory";

const STRIDED_TRACE = [0x0000, 0x0040, 0x0000, 0x0040, 0x0000, 0x0040, 0x0000, 0x0040];
const SEQUENTIAL_TRACE = [0x0000, 0x0004, 0x0008, 0x0010, 0x0014, 0x0020, 0x0024, 0x0030];

export function CacheMemorySimulator({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [tab, setTab] = useState<"cache" | "mesi">("cache");

  // Cache config
  const [cacheSizeBytes, setCacheSizeBytes] = useState(64);
  const [blockSizeBytes, setBlockSizeBytes] = useState(16);
  const [associativity, setAssociativity] = useState<CacheAssociativity>(1);
  const [customAddrHex, setCustomAddrHex] = useState("0x0040");
  const [cacheState, setCacheState] = useState<CacheSimulationState>(() =>
    createCacheState({ cacheSizeBytes: 64, blockSizeBytes: 16, associativity: 1 })
  );

  // MESI state
  const [mesi, setMesi] = useState(() => createMesiState(42));
  const [writeVal, setWriteVal] = useState(99);

  const completedRef = useRef(false);

  const parsedCustomAddr = useMemo(() => {
    const clean = customAddrHex.trim();
    const num = clean.toLowerCase().startsWith("0x")
      ? parseInt(clean, 16)
      : Number(clean);
    return Number.isFinite(num) && num >= 0 ? num & 0xffff : 0;
  }, [customAddrHex]);

  const liveBreakdown = useMemo(
    () =>
      decomposeCacheAddress(parsedCustomAddr, {
        cacheSizeBytes,
        blockSizeBytes,
        associativity,
        addressBits: 16,
      }),
    [parsedCustomAddr, cacheSizeBytes, blockSizeBytes, associativity]
  );

  // Challenge: eliminate conflict misses on strided traversal by switching to 2-way (or 4-way)
  const challengeMet =
    associativity >= 2 &&
    cacheState.hits >= 4 &&
    cacheState.conflictMisses === 0;

  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  const reconfigureCache = (
    nextSize: number,
    nextBlock: number,
    nextAssoc: CacheAssociativity
  ) => {
    setCacheSizeBytes(nextSize);
    setBlockSizeBytes(nextBlock);
    setAssociativity(nextAssoc);
    setCacheState(
      createCacheState({
        cacheSizeBytes: nextSize,
        blockSizeBytes: nextBlock,
        associativity: nextAssoc,
      })
    );
  };

  const handleRunTrace = (trace: number[]) => {
    setCacheState(
      runCacheTrace({ cacheSizeBytes, blockSizeBytes, associativity }, trace)
    );
  };

  const handleSingleAccess = () => {
    setCacheState((prev) => accessCache(prev, parsedCustomAddr).nextState);
  };

  const totalAccesses = cacheState.hits + cacheState.misses;
  const hitRatePct = totalAccesses > 0 ? (cacheState.hits / totalAccesses) * 100 : 0;

  const mesiBadgeClass = (s: MesiState) => {
    switch (s) {
      case "M":
        return "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]";
      case "E":
        return "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]";
      case "S":
        return "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]";
      case "I":
        return "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]";
    }
  };

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 07 · Memory Hierarchy &amp; Coherence
          </p>
          <h3 className="text-lg font-semibold">Set-Associative Cache &amp; MESI Lab</h3>
        </div>
        <div className="flex items-center gap-2">
          {challengeMet && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <div className="inline-flex rounded border border-[var(--border-subtle)] overflow-hidden text-xs font-medium">
            <button
              type="button"
              onClick={() => setTab("cache")}
              className={`px-3 py-1 ${
                tab === "cache"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              Cache Sets &amp; 3C Misses
            </button>
            <button
              type="button"
              onClick={() => setTab("mesi")}
              className={`px-3 py-1 ${
                tab === "mesi"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              MESI Dual-Core
            </button>
          </div>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Goal: </strong>
          {challengeGoal}
        </div>
      )}

      {tab === "cache" && (
        <div className="space-y-4">
          {/* Config + Trace controls */}
          <div className="grid gap-3 md:grid-cols-12">
            <div className="md:col-span-7 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 grid grid-cols-3 gap-2 text-xs font-mono">
              <label className="space-y-1">
                <span className="text-[var(--text-muted)] block">Cache Size</span>
                <select
                  value={cacheSizeBytes}
                  onChange={(e) =>
                    reconfigureCache(Number(e.target.value), blockSizeBytes, associativity)
                  }
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1"
                >
                  <option value={64}>64 B</option>
                  <option value={128}>128 B</option>
                  <option value={256}>256 B</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[var(--text-muted)] block">Block Size</span>
                <select
                  value={blockSizeBytes}
                  onChange={(e) =>
                    reconfigureCache(cacheSizeBytes, Number(e.target.value), associativity)
                  }
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1"
                >
                  <option value={16}>16 B</option>
                  <option value={32}>32 B</option>
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[var(--text-muted)] block">Associativity</span>
                <select
                  value={associativity}
                  onChange={(e) =>
                    reconfigureCache(
                      cacheSizeBytes,
                      blockSizeBytes,
                      Number(e.target.value) as CacheAssociativity
                    )
                  }
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1"
                >
                  <option value={1}>1-way (Direct)</option>
                  <option value={2}>2-way Set-Assoc</option>
                  <option value={4}>4-way Set-Assoc</option>
                </select>
              </label>
            </div>

            <div className="md:col-span-5 rounded border border-[var(--border-subtle)] p-3 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={customAddrHex}
                onChange={(e) => setCustomAddrHex(e.target.value)}
                className="w-24 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
                placeholder="0x0040"
              />
              <button
                type="button"
                onClick={handleSingleAccess}
                className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)]"
              >
                Access
              </button>
              <button
                type="button"
                onClick={() => handleRunTrace(STRIDED_TRACE)}
                className="inline-flex items-center gap-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue)] px-2.5 py-1 text-xs font-medium text-white"
              >
                <Play className="h-3 w-3" /> Strided Trace
              </button>
              <button
                type="button"
                onClick={() => handleRunTrace(SEQUENTIAL_TRACE)}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1 text-xs"
              >
                Seq Trace
              </button>
              <button
                type="button"
                onClick={() => reconfigureCache(cacheSizeBytes, blockSizeBytes, associativity)}
                className="rounded border border-[var(--border-subtle)] p-1 text-[var(--text-muted)]"
                title="Clear cache"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Address Tag / Index / Offset Splitter */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 space-y-2">
            <div className="flex items-center justify-between font-mono text-xs">
              <span className="text-[var(--text-muted)]">
                16-Bit Address Breakdown ({liveBreakdown.hex})
              </span>
              <span className="text-[var(--text-secondary)]">
                {cacheState.numSets} sets × {associativity} ways
              </span>
            </div>
            <div className="grid grid-cols-12 gap-1.5 font-mono text-xs swiss-tabular text-center">
              <div className="col-span-6 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] py-1.5">
                <div className="text-[10px] text-[var(--text-muted)]">
                  Tag ({liveBreakdown.tagBits}b)
                </div>
                <div className="font-bold text-[var(--accent-blue)]">
                  0x{liveBreakdown.tag.toString(16).toUpperCase()}
                </div>
              </div>
              <div className="col-span-3 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] py-1.5">
                <div className="text-[10px] text-[var(--text-muted)]">
                  Index ({liveBreakdown.indexBits}b)
                </div>
                <div className="font-bold text-[var(--accent-emerald)]">
                  Set {liveBreakdown.index}
                </div>
              </div>
              <div className="col-span-3 rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] py-1.5">
                <div className="text-[10px] text-[var(--text-muted)]">
                  Offset ({liveBreakdown.offsetBits}b)
                </div>
                <div className="font-bold text-[var(--accent-amber)]">
                  +{liveBreakdown.offset}B
                </div>
              </div>
            </div>
          </div>

          {/* Hit/Miss 3C Readout */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-xs swiss-tabular">
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Hit Rate</div>
              <div className="text-sm font-bold text-[var(--accent-emerald)]">
                {hitRatePct.toFixed(1)}% ({cacheState.hits}/{totalAccesses})
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Total Misses</div>
              <div className="text-sm font-bold">{cacheState.misses}</div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Compulsory</div>
              <div className="text-sm font-bold text-[var(--accent-blue)]">
                {cacheState.compulsoryMisses}
              </div>
            </div>
            <div
              className={`rounded border p-2.5 ${
                cacheState.conflictMisses > 0
                  ? "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]"
                  : "border-[var(--border-subtle)]"
              }`}
            >
              <div className="text-[11px] text-[var(--text-muted)]">Conflict</div>
              <div className="text-sm font-bold">{cacheState.conflictMisses}</div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Capacity</div>
              <div className="text-sm font-bold text-[var(--accent-amber)]">
                {cacheState.capacityMisses}
              </div>
            </div>
          </div>

          {/* Sets x Ways Table */}
          <div className="rounded border border-[var(--border-subtle)] overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs swiss-tabular">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
                  <th className="py-1.5 px-3">Set</th>
                  {Array.from({ length: associativity }, (_, w) => (
                    <th key={w} className="py-1.5 px-3">
                      Way {w}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cacheState.sets.map((ways, setIdx) => (
                  <tr key={setIdx} className="border-b border-[var(--border-subtle)]">
                    <td className="py-1.5 px-3 font-semibold text-[var(--text-muted)]">
                      Set {setIdx}
                    </td>
                    {ways.map((slot, wIdx) => (
                      <td key={wIdx} className="py-1.5 px-3">
                        {slot.valid ? (
                          <span className="inline-flex items-center gap-2 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2 py-0.5 text-[11px]">
                            <span className="font-bold text-[var(--accent-blue)]">
                              Tag 0x{slot.tag.toString(16).toUpperCase()}
                            </span>
                            <span className="text-[var(--text-muted)]">
                              t={slot.lastUsedTick}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)]">— empty —</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "mesi" && (
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            {([0, 1] as const).map((coreIdx) => {
              const core = mesi.cores[coreIdx];
              return (
                <div
                  key={coreIdx}
                  className="rounded border border-[var(--border-subtle)] p-3.5 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">Core {coreIdx} L1 Line</span>
                    <span
                      className={`rounded border px-2.5 py-0.5 font-mono text-xs font-bold ${mesiBadgeClass(
                        core.state
                      )}`}
                    >
                      State: {core.state}
                    </span>
                  </div>
                  <div className="font-mono text-xs text-[var(--text-secondary)]">
                    Cached Value:{" "}
                    <strong className="text-[var(--text-primary)]">
                      {core.state === "I" ? "Invalid" : core.value}
                    </strong>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMesi((m) => stepMesi(m, coreIdx, "PrRd"))}
                      className="flex-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] py-1 font-mono text-xs font-semibold text-[var(--accent-blue)]"
                    >
                      PrRd
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMesi((m) => stepMesi(m, coreIdx, "PrWr", writeVal));
                        setWriteVal((v) => v + 1);
                      }}
                      className="flex-1 rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] py-1 font-mono text-xs font-semibold text-[var(--accent-amber)]"
                    >
                      PrWr ({writeVal})
                    </button>
                  </div>
                </div>
              );
            })}

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Shared RAM &amp; Bus</span>
                <button
                  type="button"
                  onClick={() => setMesi(createMesiState(42))}
                  className="text-xs font-mono text-[var(--text-muted)] underline"
                >
                  Reset
                </button>
              </div>
              <div className="font-mono text-xs">
                Memory Value: <strong>{mesi.memoryValue}</strong>
              </div>
              <div className="font-mono text-xs text-[var(--accent-blue)]">
                Last Bus Tx: <strong>{mesi.lastEvent?.busTx ?? "Idle"}</strong>
              </div>
              {mesi.lastEvent && (
                <p className="text-xs text-[var(--text-secondary)]">
                  {mesi.lastEvent.summary}
                </p>
              )}
            </div>
          </div>

          {mesi.log.length > 0 && (
            <div className="rounded border border-[var(--border-subtle)] p-3 max-h-40 overflow-y-auto font-mono text-[11px] space-y-1">
              {mesi.log.map((entry) => (
                <div key={entry.step} className="flex items-center gap-3">
                  <span className="text-[var(--text-muted)] w-8">#{entry.step}</span>
                  <span className="w-16 text-[var(--accent-blue)]">
                    C{entry.actor} {entry.op}
                  </span>
                  <span className="w-16 font-semibold text-[var(--accent-amber)]">
                    {entry.busTx}
                  </span>
                  <span className="w-16">
                    [{entry.core0},{entry.core1}]
                  </span>
                  <span className="text-[var(--text-secondary)]">{entry.summary}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CacheMemorySimulator;
