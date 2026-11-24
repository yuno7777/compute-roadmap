"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Layers, Plus, RotateCcw, Search } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  bplusAmplification,
  bplusInsert,
  bplusRangeScan,
  bplusSearch,
  createBPlusTree,
  createLsmTree,
  lsmAmplification,
  lsmCompactLevel,
  lsmFlushMemtable,
  lsmGet,
  lsmPut,
  type BPlusNode,
  type BPlusTreeState,
  type LsmTreeState,
} from "@/lib/simulators/databaseStorage";

function collectBPlusLevels(state: BPlusTreeState): BPlusNode[][] {
  const levels: BPlusNode[][] = [];
  let currentIds = [state.rootId];
  while (currentIds.length > 0) {
    const levelNodes = currentIds
      .map((id) => state.nodes[id])
      .filter((n): n is BPlusNode => Boolean(n));
    levels.push(levelNodes);
    const nextIds: string[] = [];
    for (const node of levelNodes) {
      if (!node.isLeaf && node.children) {
        nextIds.push(...node.children);
      }
    }
    currentIds = nextIds;
  }
  return levels;
}

export function DatabaseBTreeLsmLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [order, setOrder] = useState(4);
  const [memtableCap, setMemtableCap] = useState(4);
  const [keyInput, setKeyInput] = useState(15);
  const [nextSeqKey, setNextSeqKey] = useState(10);
  const [rangeStart, setRangeStart] = useState(10);
  const [rangeEnd, setRangeEnd] = useState(25);

  const [btree, setBtree] = useState<BPlusTreeState>(() => {
    let t = createBPlusTree(4);
    for (const k of [10, 20, 30, 5, 15]) t = bplusInsert(t, k);
    return t;
  });

  const [lsm, setLsm] = useState<LsmTreeState>(() => {
    let t = createLsmTree(4, 2);
    for (const k of [10, 20, 30, 5, 15]) t = lsmPut(t, k);
    return t;
  });

  const [highlightedNodes, setHighlightedNodes] = useState<string[]>([]);
  const [lookupMessage, setLookupMessage] = useState<string>("");

  const btreeAmp = useMemo(() => bplusAmplification(btree), [btree]);
  const lsmAmp = useMemo(() => lsmAmplification(lsm), [lsm]);
  const btreeLevels = useMemo(() => collectBPlusLevels(btree), [btree]);

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  useEffect(() => {
    if (
      !completedRef.current &&
      lsm.stats.logicalWrites >= 10 &&
      lsm.stats.flushes >= 2 &&
      lsmAmp.writeAmplification < btreeAmp.writeAmplification
    ) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [
    lsm.stats.logicalWrites,
    lsm.stats.flushes,
    lsmAmp.writeAmplification,
    btreeAmp.writeAmplification,
    onChallengeComplete,
  ]);

  const resetBoth = (nextOrder = order, nextCap = memtableCap) => {
    setBtree(createBPlusTree(nextOrder));
    setLsm(createLsmTree(nextCap, 2));
    setHighlightedNodes([]);
    setLookupMessage("");
    setNextSeqKey(1);
    completedRef.current = false;
    setChallengeDone(false);
  };

  const insertKeyBoth = (k: number) => {
    setBtree((prev) => bplusInsert(prev, k, `v${k}`));
    setLsm((prev) => lsmPut(prev, k, `v${k}`));
    setHighlightedNodes([]);
  };

  const bulkSequentialInsert = () => {
    let b = btree;
    let l = lsm;
    let k = nextSeqKey;
    for (let i = 0; i < 8; i++) {
      b = bplusInsert(b, k, `seq-${k}`);
      l = lsmPut(l, k, `seq-${k}`);
      k += 1;
    }
    setBtree(b);
    setLsm(l);
    setNextSeqKey(k);
  };

  const handleLookup = () => {
    const bRes = bplusSearch(btree, keyInput);
    const lRes = lsmGet(lsm, keyInput);
    setLsm(lRes.state);
    setHighlightedNodes(bRes.visitedNodeIds);
    setLookupMessage(
      `Key ${keyInput}: B+ Tree ${bRes.found ? `FOUND (${bRes.value})` : "MISS"} via [${bRes.visitedNodeIds.join(" -> ")}] | LSM ${lRes.found ? `FOUND (${lRes.value})` : "MISS"} via [${lRes.checkedLocations.join(" -> ")}]`
    );
  };

  const handleRangeScan = () => {
    const scan = bplusRangeScan(btree, rangeStart, rangeEnd);
    setHighlightedNodes(scan.visitedLeafIds);
    setLookupMessage(
      `B+ Tree Range [${rangeStart}..${rangeEnd}]: ${scan.entries.length} entries across leaves [${scan.visitedLeafIds.join(" -> ")}]`
    );
  };

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · Database Storage Engines
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            B+ Tree vs. LSM-Tree Storage Lab
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

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs">
            <span>B+ Order:</span>
            <select
              value={order}
              onChange={(e) => {
                const v = Number(e.target.value);
                setOrder(v);
                resetBoth(v, memtableCap);
              }}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </label>

          <label className="flex items-center gap-1.5 text-xs">
            <span>Memtable Cap:</span>
            <select
              value={memtableCap}
              onChange={(e) => {
                const v = Number(e.target.value);
                setMemtableCap(v);
                resetBoth(order, v);
              }}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
            >
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={6}>6</option>
            </select>
          </label>

          <input
            type="number"
            value={keyInput}
            onChange={(e) => setKeyInput(Number(e.target.value))}
            className="w-20 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
            aria-label="Database key"
          />
          <button
            type="button"
            onClick={() => insertKeyBoth(keyInput)}
            className="inline-flex items-center gap-1 rounded bg-[var(--accent-blue)] px-2.5 py-1 text-xs font-medium text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Insert
          </button>
          <button
            type="button"
            onClick={handleLookup}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs font-medium"
          >
            <Search className="h-3.5 w-3.5" /> Lookup
          </button>
          <button
            type="button"
            onClick={bulkSequentialInsert}
            className="rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-emerald)]"
          >
            +8 Sequential Keys
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setLsm((prev) => lsmFlushMemtable(prev))}
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs"
          >
            Flush Memtable
          </button>
          <button
            type="button"
            onClick={() => setLsm((prev) => lsmCompactLevel(prev, 0))}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs"
          >
            <Layers className="h-3.5 w-3.5" /> Compact L0-&gt;L1
          </button>
          <button
            type="button"
            onClick={() => resetBoth()}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 text-xs text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* Range Scan Bar & Lookup Status */}
      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span>Range Scan:</span>
        <input
          type="number"
          value={rangeStart}
          onChange={(e) => setRangeStart(Number(e.target.value))}
          className="w-16 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
        />
        <span>to</span>
        <input
          type="number"
          value={rangeEnd}
          onChange={(e) => setRangeEnd(Number(e.target.value))}
          className="w-16 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
        />
        <button
          type="button"
          onClick={handleRangeScan}
          className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-medium"
        >
          Run Leaf Scan
        </button>
        {lookupMessage && (
          <span className="font-mono text-[11px] text-[var(--accent-blue)]">
            {lookupMessage}
          </span>
        )}
      </div>

      {/* Amplification Comparison */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            B+ Write Amp
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular text-[var(--accent-amber)]">
            {btreeAmp.writeAmplification.toFixed(2)} pages/op
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            LSM Write Amp
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular text-[var(--accent-emerald)]">
            {lsmAmp.writeAmplification.toFixed(2)} entries/op
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            B+ Read Amp / Splits
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular">
            {btreeAmp.readAmplification} lvl / {btree.stats.splits} splits
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            LSM Read Amp / Bloom
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular">
            {lsmAmp.readAmplification} runs / {lsm.stats.bloomSkippedSstables} skipped
          </div>
        </div>
      </div>

      {/* Dual Engine Views */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* B+ Tree */}
        <div className="rounded border border-[var(--border-subtle)] p-3.5 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              B+ Tree (Order {btree.order} · Height {btree.height})
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {btree.totalKeys} keys
            </span>
          </div>

          <div className="space-y-3 overflow-x-auto">
            {btreeLevels.map((lvl, lvlIdx) => (
              <div
                key={lvlIdx}
                className="flex flex-wrap items-center justify-center gap-2"
              >
                {lvl.map((node) => {
                  const hit = highlightedNodes.includes(node.id);
                  return (
                    <div
                      key={node.id}
                      className={`rounded border px-2 py-1.5 font-mono text-xs swiss-tabular ${
                        hit
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                          : node.isLeaf
                            ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                            : "border-[var(--border-strong)] bg-[var(--bg-subtle)]"
                      }`}
                    >
                      <div className="text-[9px] uppercase text-[var(--text-muted)]">
                        {node.id} {node.isLeaf ? "LEAF" : "INT"}
                      </div>
                      <div className="font-semibold">
                        [{node.keys.join(" | ")}]
                      </div>
                      {node.isLeaf && node.next && (
                        <div className="text-[9px] text-[var(--text-muted)]">
                          next -&gt; {node.next}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* LSM-Tree */}
        <div className="rounded border border-[var(--border-subtle)] p-3.5 space-y-3">
          <div className="flex justify-between text-xs">
            <span className="font-semibold text-[var(--text-primary)]">
              LSM-Tree (Memtable + Leveled SSTables + Bloom)
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {lsm.stats.compactions} compactions
            </span>
          </div>

          <div className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] p-2.5 font-mono text-xs">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Memtable ({lsm.memtable.length}/{lsm.memtableCapacity})
            </div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {lsm.memtable.length === 0 ? (
                <span className="text-[var(--text-muted)]">Empty</span>
              ) : (
                lsm.memtable.map((e) => (
                  <span
                    key={e.key}
                    className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5"
                  >
                    {e.key}
                  </span>
                ))
              )}
            </div>
          </div>

          {lsm.levels.map((runs, lvlIdx) => (
            <div
              key={lvlIdx}
              className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 font-mono text-xs space-y-1.5"
            >
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Level L{lvlIdx} ({runs.length} SSTable{runs.length === 1 ? "" : "s"})
              </div>
              {runs.length === 0 ? (
                <div className="text-[11px] text-[var(--text-muted)]">—</div>
              ) : (
                runs.map((run) => (
                  <div
                    key={run.id}
                    className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2"
                  >
                    <div className="flex justify-between text-[11px]">
                      <span className="font-semibold">{run.id}</span>
                      <span>
                        range [{run.minKey}..{run.maxKey}] ({run.entries.length} keys)
                      </span>
                    </div>
                    <div className="mt-1 flex gap-0.5">
                      {run.bloomBits.map((bit, bIdx) => (
                        <span
                          key={bIdx}
                          className={`h-1.5 flex-1 rounded-xs ${
                            bit
                              ? "bg-[var(--accent-emerald)]"
                              : "bg-[var(--bg-muted)]"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
