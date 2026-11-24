"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  checkNandPuzzle,
  evaluateGate,
  generateTruthTable,
  getCanonicalNandCircuit,
  simulateRippleAdder4,
  stepDFlipFlop,
  type DffTraceSample,
  type LogicGateType,
  type NandGateNode,
  type NandInputRef,
} from "@/lib/simulators/logicGates";

type LabTab = "gates" | "nand-puzzle" | "adder-dff";

const ALL_GATES: LogicGateType[] = ["AND", "OR", "NOT", "NAND", "NOR", "XOR", "XNOR"];
const PUZZLE_TARGETS = ["NOT", "AND", "OR", "XOR"] as const;

export function LogicGateLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [tab, setTab] = useState<LabTab>("nand-puzzle");

  // Tab 1: Basic Gate Explorer
  const [selectedGate, setSelectedGate] = useState<LogicGateType>("XOR");
  const [gateA, setGateA] = useState(true);
  const [gateB, setGateB] = useState(false);

  // Tab 2: Universal NAND Builder
  const [puzzleTarget, setPuzzleTarget] = useState<(typeof PUZZLE_TARGETS)[number]>("XOR");
  const [nandNodes, setNandNodes] = useState<NandGateNode[]>([
    { id: "g1", in1: { kind: "input", name: "A" }, in2: { kind: "input", name: "B" } },
    { id: "g2", in1: { kind: "input", name: "A" }, in2: { kind: "gate", id: "g1" } },
  ]);
  const [outputGateId, setOutputGateId] = useState("g2");
  const [xorSolvedOnce, setXorSolvedOnce] = useState(false);

  // Tab 3: 4-Bit Ripple Adder & DFF
  const [adderA, setAdderA] = useState(5);
  const [adderB, setAdderB] = useState(3);
  const [adderCin, setAdderCin] = useState(false);
  const [dffD, setDffD] = useState(0b1010);
  const [dffClk, setDffClk] = useState(false);
  const [dffQ, setDffQ] = useState(0);
  const [dffLatchedOnce, setDffLatchedOnce] = useState(false);
  const [dffTrace, setDffTrace] = useState<DffTraceSample[]>([
    { tick: 0, clk: false, d: 0b1010, q: 0, risingEdge: false },
  ]);

  const completedRef = useRef(false);

  const gateOut = useMemo(
    () => evaluateGate(selectedGate, gateA, gateB),
    [selectedGate, gateA, gateB]
  );
  const truthTable = useMemo(() => generateTruthTable(selectedGate), [selectedGate]);

  const puzzleResult = useMemo(
    () => checkNandPuzzle(puzzleTarget, nandNodes, outputGateId),
    [puzzleTarget, nandNodes, outputGateId]
  );

  const adderResult = useMemo(
    () => simulateRippleAdder4(adderA, adderB, adderCin),
    [adderA, adderB, adderCin]
  );

  useEffect(() => {
    if (puzzleTarget === "XOR" && puzzleResult.passed) {
      setXorSolvedOnce(true);
    }
  }, [puzzleTarget, puzzleResult.passed]);

  const challengeMet = xorSolvedOnce && dffLatchedOnce;
  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  const updateNodeInput = (
    idx: number,
    slot: "in1" | "in2",
    encoded: string
  ) => {
    const ref: NandInputRef =
      encoded === "A" || encoded === "B"
        ? { kind: "input", name: encoded }
        : { kind: "gate", id: encoded };
    setNandNodes((prev) =>
      prev.map((n, i) => (i === idx ? { ...n, [slot]: ref } : n))
    );
  };

  const addNandNode = () => {
    const nextNum = nandNodes.length + 1;
    const id = `g${nextNum}`;
    setNandNodes((prev) => [
      ...prev,
      { id, in1: { kind: "input", name: "A" }, in2: { kind: "input", name: "B" } },
    ]);
    setOutputGateId(id);
  };

  const removeLastNandNode = () => {
    if (nandNodes.length <= 1) return;
    const trimmed = nandNodes.slice(0, -1);
    setNandNodes(trimmed);
    if (!trimmed.some((n) => n.id === outputGateId)) {
      setOutputGateId(trimmed[trimmed.length - 1].id);
    }
  };

  const loadCanonical = () => {
    const c = getCanonicalNandCircuit(puzzleTarget);
    setNandNodes(c.nodes);
    setOutputGateId(c.outputGateId);
  };

  const toggleClockEdge = () => {
    const nextClk = !dffClk;
    const step = stepDFlipFlop(dffClk, nextClk, dffD, dffQ, 4);
    setDffClk(nextClk);
    setDffQ(step.q);
    if (step.risingEdge && step.q !== 0) {
      setDffLatchedOnce(true);
    }
    setDffTrace((prev) => [
      ...prev.slice(-15),
      {
        tick: (prev[prev.length - 1]?.tick ?? 0) + 1,
        clk: nextClk,
        d: dffD,
        q: step.q,
        risingEdge: step.risingEdge,
      },
    ]);
  };

  const pulseClock = () => {
    // Low -> High (rising edge) -> Low
    const rise = stepDFlipFlop(dffClk, true, dffD, dffQ, 4);
    if (rise.risingEdge && rise.q !== 0) {
      setDffLatchedOnce(true);
    }
    const fall = stepDFlipFlop(true, false, dffD, rise.q, 4);
    setDffClk(false);
    setDffQ(fall.q);
    setDffTrace((prev) => {
      const lastTick = prev[prev.length - 1]?.tick ?? 0;
      return [
        ...prev.slice(-14),
        { tick: lastTick + 1, clk: true, d: dffD, q: rise.q, risingEdge: rise.risingEdge },
        { tick: lastTick + 2, clk: false, d: dffD, q: fall.q, risingEdge: false },
      ];
    });
  };

  const encodeRef = (r: NandInputRef) => (r.kind === "input" ? r.name : r.id);

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 03 · Combinational &amp; Sequential Logic
          </p>
          <h3 className="text-lg font-semibold">Digital Logic &amp; Flip-Flop Bench</h3>
        </div>
        <div className="flex items-center gap-2">
          {challengeMet && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <div className="inline-flex rounded border border-[var(--border-subtle)] overflow-hidden text-xs font-medium">
            {[
              { id: "gates", label: "Gates" },
              { id: "nand-puzzle", label: "NAND Builder" },
              { id: "adder-dff", label: "Adder & D-FF" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id as LabTab)}
                className={`px-3 py-1 ${
                  tab === item.id
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-[var(--text-primary)]">Goal: </strong>
            {challengeGoal}
          </span>
          <span className="font-mono text-[11px] flex items-center gap-3">
            <span className={xorSolvedOnce ? "text-[var(--accent-emerald)]" : "text-[var(--text-muted)]"}>
              [{xorSolvedOnce ? "✓" : " "}] NAND→XOR
            </span>
            <span className={dffLatchedOnce ? "text-[var(--accent-emerald)]" : "text-[var(--text-muted)]"}>
              [{dffLatchedOnce ? "✓" : " "}] D-FF Edge Latch
            </span>
          </span>
        </div>
      )}

      {/* TAB 1: Basic Gate Explorer */}
      {tab === "gates" && (
        <div className="grid gap-4 md:grid-cols-12">
          <div className="md:col-span-6 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {ALL_GATES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGate(g)}
                  className={`rounded border px-2.5 py-1 font-mono text-xs font-semibold ${
                    selectedGate === g
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 flex items-center justify-between gap-4">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setGateA((v) => !v)}
                  className={`block w-24 rounded border px-3 py-1.5 font-mono text-xs font-semibold ${
                    gateA
                      ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                  }`}
                >
                  A = {gateA ? "1" : "0"}
                </button>
                {selectedGate !== "NOT" && (
                  <button
                    type="button"
                    onClick={() => setGateB((v) => !v)}
                    className={`block w-24 rounded border px-3 py-1.5 font-mono text-xs font-semibold ${
                      gateB
                        ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                    }`}
                  >
                    B = {gateB ? "1" : "0"}
                  </button>
                )}
              </div>

              <svg viewBox="0 0 180 80" className="w-40 h-20">
                <line x1="10" y1="26" x2="55" y2="26" stroke={gateA ? "var(--accent-emerald)" : "var(--border-strong)"} strokeWidth="2.5" />
                {selectedGate !== "NOT" && (
                  <line x1="10" y1="54" x2="55" y2="54" stroke={gateB ? "var(--accent-emerald)" : "var(--border-strong)"} strokeWidth="2.5" />
                )}
                <rect x="55" y="14" width="68" height="52" rx="8" fill="var(--bg-surface)" stroke="var(--accent-blue)" strokeWidth="2" />
                <text x="89" y="44" textAnchor="middle" fontSize="13" fontWeight="700" fontFamily="var(--font-mono-stack)" fill="var(--text-primary)">
                  {selectedGate}
                </text>
                <line x1="123" y1="40" x2="170" y2="40" stroke={gateOut ? "var(--accent-emerald)" : "var(--border-strong)"} strokeWidth="2.5" />
              </svg>

              <div
                className={`rounded border px-4 py-2 font-mono text-sm font-bold ${
                  gateOut
                    ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                }`}
              >
                Y = {gateOut ? "1" : "0"}
              </div>
            </div>
          </div>

          <div className="md:col-span-6">
            <table className="w-full text-left border-collapse font-mono text-xs swiss-tabular">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <th className="py-1.5 px-3">A</th>
                  {selectedGate !== "NOT" && <th className="py-1.5 px-3">B</th>}
                  <th className="py-1.5 px-3">{selectedGate}(A{selectedGate !== "NOT" ? ", B" : ""})</th>
                </tr>
              </thead>
              <tbody>
                {truthTable.map((row, idx) => {
                  const active =
                    row.a === gateA && (selectedGate === "NOT" || row.b === gateB);
                  return (
                    <tr
                      key={idx}
                      className={`border-b border-[var(--border-subtle)] ${
                        active ? "bg-[var(--accent-blue-soft)] font-semibold" : ""
                      }`}
                    >
                      <td className="py-1.5 px-3">{row.a ? 1 : 0}</td>
                      {selectedGate !== "NOT" && (
                        <td className="py-1.5 px-3">{row.b ? 1 : 0}</td>
                      )}
                      <td className="py-1.5 px-3 text-[var(--accent-blue)]">
                        {row.output ? 1 : 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Universal NAND Builder */}
      {tab === "nand-puzzle" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[var(--text-muted)]">Target:</span>
                {PUZZLE_TARGETS.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setPuzzleTarget(t)}
                    className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold ${
                      puzzleTarget === t
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={addNandNode}
                  className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1 text-xs"
                >
                  <Plus className="h-3 w-3" /> Add NAND
                </button>
                <button
                  type="button"
                  onClick={removeLastNandNode}
                  className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1 text-xs"
                >
                  <Trash2 className="h-3 w-3" /> Trim
                </button>
                <button
                  type="button"
                  onClick={loadCanonical}
                  className="inline-flex items-center gap-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2 py-1 text-xs text-[var(--accent-blue)]"
                >
                  <Sparkles className="h-3 w-3" /> Canonical Solution
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {nandNodes.map((node, idx) => {
                const availableSources = [
                  "A",
                  ...(puzzleTarget !== "NOT" ? ["B"] : []),
                  ...nandNodes.slice(0, idx).map((prev) => prev.id),
                ];
                return (
                  <div
                    key={node.id}
                    className="flex flex-wrap items-center gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-xs"
                  >
                    <span className="font-bold text-[var(--accent-blue)] w-8">
                      {node.id}
                    </span>
                    <span>= NAND(</span>
                    <select
                      value={encodeRef(node.in1)}
                      onChange={(e) => updateNodeInput(idx, "in1", e.target.value)}
                      className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5"
                    >
                      {availableSources.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                    <span>,</span>
                    <select
                      value={encodeRef(node.in2)}
                      onChange={(e) => updateNodeInput(idx, "in2", e.target.value)}
                      className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-0.5"
                    >
                      {availableSources.map((src) => (
                        <option key={src} value={src}>
                          {src}
                        </option>
                      ))}
                    </select>
                    <span>)</span>
                    <label className="ml-auto inline-flex items-center gap-1 text-[11px] text-[var(--text-muted)] cursor-pointer">
                      <input
                        type="radio"
                        name="nand-out"
                        checked={outputGateId === node.id}
                        onChange={() => setOutputGateId(node.id)}
                      />
                      Output
                    </label>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-5 rounded border border-[var(--border-subtle)] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Truth Table Verification</span>
              <span
                className={`font-mono font-semibold ${
                  puzzleResult.passed
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-amber)]"
                }`}
              >
                {puzzleResult.passed
                  ? `PASS (${puzzleResult.gateCount} NANDs)`
                  : "Mismatch"}
              </span>
            </div>
            <table className="w-full text-left border-collapse font-mono text-xs swiss-tabular">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[var(--text-muted)]">
                  <th className="py-1 px-2">A</th>
                  {puzzleTarget !== "NOT" && <th className="py-1 px-2">B</th>}
                  <th className="py-1 px-2">Actual</th>
                  <th className="py-1 px-2">Target</th>
                  <th className="py-1 px-2">OK</th>
                </tr>
              </thead>
              <tbody>
                {puzzleResult.rows.map((r, i) => (
                  <tr key={i} className="border-b border-[var(--border-subtle)]">
                    <td className="py-1 px-2">{r.a ? 1 : 0}</td>
                    {puzzleTarget !== "NOT" && (
                      <td className="py-1 px-2">{r.b ? 1 : 0}</td>
                    )}
                    <td className="py-1 px-2">{r.actual === null ? "?" : r.actual ? 1 : 0}</td>
                    <td className="py-1 px-2">{r.expected ? 1 : 0}</td>
                    <td
                      className={`py-1 px-2 font-semibold ${
                        r.match ? "text-[var(--accent-emerald)]" : "text-[var(--accent-crimson)]"
                      }`}
                    >
                      {r.match ? "✓" : "✗"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: 4-Bit Ripple-Carry Adder + D Flip-Flop */}
      {tab === "adder-dff" && (
        <div className="grid gap-4 lg:grid-cols-12">
          {/* 4-bit Ripple Carry Adder */}
          <div className="lg:col-span-6 rounded border border-[var(--border-subtle)] p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold">4-Bit Ripple-Carry Adder</span>
              <span className="font-mono text-xs swiss-tabular text-[var(--accent-blue)]">
                {adderA} + {adderB} + {adderCin ? 1 : 0} ={" "}
                <strong>{(adderResult.cout ? 16 : 0) + adderResult.sumValue}</strong> (Cout=
                {adderResult.cout ? 1 : 0}, S=0b
                {adderResult.sumValue.toString(2).padStart(4, "0")})
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-xs">
              <label className="space-y-1">
                <span className="text-[var(--text-muted)] font-mono">A (0–15)</span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={adderA}
                  onChange={(e) => setAdderA(Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[var(--text-muted)] font-mono">B (0–15)</span>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={adderB}
                  onChange={(e) => setAdderB(Math.min(15, Math.max(0, Number(e.target.value) || 0)))}
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
                />
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => setAdderCin((c) => !c)}
                  className={`w-full rounded border px-2 py-1 font-mono text-xs ${
                    adderCin
                      ? "border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] text-[var(--accent-amber)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                  }`}
                >
                  C<sub>in</sub> = {adderCin ? 1 : 0}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2">
              {[...adderResult.stages].reverse().map((st) => (
                <div
                  key={st.bitIndex}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2 font-mono text-[11px] swiss-tabular space-y-0.5"
                >
                  <div className="font-semibold text-[var(--text-primary)]">
                    FA{st.bitIndex}
                  </div>
                  <div>
                    A={st.a ? 1 : 0} B={st.b ? 1 : 0}
                  </div>
                  <div className="text-[var(--text-muted)]">Cin={st.cin ? 1 : 0}</div>
                  <div className="text-[var(--accent-blue)] font-semibold">
                    Sum={st.sum ? 1 : 0}
                  </div>
                  <div className="text-[var(--accent-amber)]">Cout={st.cout ? 1 : 0}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 4-bit Clocked D Flip-Flop */}
          <div className="lg:col-span-6 rounded border border-[var(--border-subtle)] p-3.5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-semibold">4-Bit Rising-Edge D-Flip-Flop</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleClockEdge}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1 font-mono text-[11px]"
                >
                  CLK: {dffClk ? "HIGH (1)" : "LOW (0)"}
                </button>
                <button
                  type="button"
                  onClick={pulseClock}
                  className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 font-mono text-[11px] font-semibold text-[var(--accent-blue)]"
                >
                  Pulse Rising Edge ↑
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDffClk(false);
                    setDffQ(0);
                    setDffTrace([{ tick: 0, clk: false, d: dffD, q: 0, risingEdge: false }]);
                  }}
                  className="rounded border border-[var(--border-subtle)] p-1 text-[var(--text-muted)]"
                  title="Reset DFF"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 rounded bg-[var(--bg-subtle)] px-3 py-2 font-mono text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-[var(--text-muted)]">D[3:0]:</span>
                {[3, 2, 1, 0].map((bit) => {
                  const on = Boolean((dffD >> bit) & 1);
                  return (
                    <button
                      key={bit}
                      type="button"
                      onClick={() => setDffD((v) => v ^ (1 << bit))}
                      className={`h-6 w-6 rounded border font-semibold ${
                        on
                          ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                          : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
                      }`}
                    >
                      {on ? 1 : 0}
                    </button>
                  );
                })}
                <span className="ml-1 text-[var(--text-muted)]">({dffD})</span>
              </div>
              <div>
                Q[3:0] ={" "}
                <strong className="text-[var(--accent-emerald)]">
                  0b{dffQ.toString(2).padStart(4, "0")} ({dffQ})
                </strong>
              </div>
            </div>

            {/* Timing Waveform Trace */}
            <svg viewBox="0 0 380 96" className="w-full h-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)]">
              <text x="8" y="24" fontSize="10" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                CLK
              </text>
              <text x="8" y="54" fontSize="10" fontFamily="var(--font-mono-stack)" fill="var(--accent-blue)">
                D
              </text>
              <text x="8" y="82" fontSize="10" fontFamily="var(--font-mono-stack)" fill="var(--accent-emerald)">
                Q
              </text>
              {dffTrace.map((sample, i) => {
                const x = 42 + i * 20;
                const prev = dffTrace[i - 1];
                const clkY = sample.clk ? 12 : 28;
                const prevClkY = prev ? (prev.clk ? 12 : 28) : clkY;
                return (
                  <g key={sample.tick}>
                    {i > 0 && prevClkY !== clkY && (
                      <line x1={x} y1={prevClkY} x2={x} y2={clkY} stroke="var(--text-primary)" strokeWidth="1.5" />
                    )}
                    <line x1={x} y1={clkY} x2={x + 20} y2={clkY} stroke="var(--text-primary)" strokeWidth="1.5" />
                    {sample.risingEdge && (
                      <line x1={x} y1={8} x2={x} y2={90} stroke="var(--accent-amber)" strokeDasharray="2 2" />
                    )}
                    <text x={x + 10} y="54" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono-stack)" fill="var(--accent-blue)">
                      {sample.d.toString(16).toUpperCase()}
                    </text>
                    <text x={x + 10} y="82" textAnchor="middle" fontSize="9" fontFamily="var(--font-mono-stack)" fill="var(--accent-emerald)">
                      {sample.q.toString(16).toUpperCase()}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default LogicGateLab;
