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
import {
  parseQuantumGateSequence,
  simulatePoissonDieYield,
  simulateQuantumInterference,
} from "@/lib/simulators/chipletYieldQubit";

type FrontierTab = "yield" | "qubit";

export function ChipletYieldQubitLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [tab, setTab] = useState<FrontierTab>("yield");

  // Poisson Die Yield state (default 8.0 cm^2 = 800 mm^2 reticle limit)
  const [totalAreaCm2, setTotalAreaCm2] = useState(8.0);
  const [defectDensity, setDefectDensity] = useState(0.5);
  const [tileCount, setTileCount] = useState(1);

  // Single-Qubit Interference state
  const [gateInput, setGateInput] = useState("H Z H");
  const [stepIdx, setStepIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [verifiedInterference, setVerifiedInterference] = useState(false);

  const completedRef = useRef(false);

  const yieldSim = useMemo(
    () =>
      simulatePoissonDieYield({
        totalAreaCm2,
        defectDensityPerCm2: defectDensity,
        tileCount,
      }),
    [totalAreaCm2, defectDensity, tileCount]
  );

  const gates = useMemo(() => parseQuantumGateSequence(gateInput), [gateInput]);
  const qubitSim = useMemo(() => simulateQuantumInterference(gates), [gates]);

  const clampedStep = Math.min(stepIdx, qubitSim.snapshots.length - 1);
  const currentQubit = qubitSim.snapshots[clampedStep] ?? qubitSim.snapshots[0];

  useEffect(() => {
    if (
      clampedStep > 0 &&
      clampedStep === qubitSim.snapshots.length - 1 &&
      (currentQubit.prob1 > 0.99 || currentQubit.prob0 > 0.99)
    ) {
      setVerifiedInterference(true);
    }
  }, [clampedStep, qubitSim.snapshots.length, currentQubit.prob0, currentQubit.prob1]);

  const chipletYieldGoalMet = tileCount >= 2 && yieldSim.tileYield > 0.75;
  const challengeMet = chipletYieldGoalMet && verifiedInterference;

  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  useEffect(() => {
    if (!playing) return;
    if (clampedStep >= qubitSim.snapshots.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setInterval(() => {
      setStepIdx((s) => {
        if (s + 1 >= qubitSim.snapshots.length - 1) {
          setPlaying(false);
        }
        return Math.min(qubitSim.snapshots.length - 1, s + 1);
      });
    }, 550);
    return () => window.clearInterval(id);
  }, [playing, clampedStep, qubitSim.snapshots.length]);

  const handleReset = () => {
    setTotalAreaCm2(8.0);
    setDefectDensity(0.5);
    setTileCount(1);
    setGateInput("H Z H");
    setStepIdx(0);
    setPlaying(false);
    setVerifiedInterference(false);
  };

  // Yield curve SVG geometry
  const W = 480;
  const H = 205;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (n: number) => padL + ((n - 1) / 15) * plotW;
  const toY = (y: number) => padT + plotH - y * plotH;

  const tileYieldPath = yieldSim.yieldCurve
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"}${toX(pt.tileCount).toFixed(1)},${toY(
          pt.tileYield
        ).toFixed(1)}`
    )
    .join(" ");

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab · Semiconductor Yield &amp; Quantum Interference
          </p>
          <h3 className="text-lg font-semibold">
            Poisson Die Yield, Chiplets &amp; Qubit Interference Lab
          </h3>
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
              onClick={() => setTab("yield")}
              className={`px-3 py-1 ${
                tab === "yield"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              Chiplets &amp; Yield
            </button>
            <button
              type="button"
              onClick={() => setTab("qubit")}
              className={`px-3 py-1 ${
                tab === "qubit"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              Quantum Interference
            </button>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-[var(--text-primary)]">Goal: </strong>
            {challengeGoal}
          </span>
          <span className="font-mono text-[11px] flex items-center gap-3">
            <span
              className={
                chipletYieldGoalMet
                  ? "text-[var(--accent-emerald)]"
                  : "text-[var(--text-muted)]"
              }
            >
              [{chipletYieldGoalMet ? "✓" : " "}] Chiplet Yield &gt; 75%
            </span>
            <span
              className={
                verifiedInterference
                  ? "text-[var(--accent-emerald)]"
                  : "text-[var(--text-muted)]"
              }
            >
              [{verifiedInterference ? "✓" : " "}] Run Qubit Interference
            </span>
          </span>
        </div>
      )}

      {tab === "yield" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5 space-y-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-[var(--text-secondary)]">
                    Total Silicon Area A
                  </label>
                  <span className="font-mono swiss-tabular font-semibold">
                    {totalAreaCm2.toFixed(1)} cm² ({Math.round(totalAreaCm2 * 100)} mm²)
                  </span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={10}
                  step={0.5}
                  value={totalAreaCm2}
                  onChange={(e) => setTotalAreaCm2(Number(e.target.value))}
                  className="w-full accent-[var(--accent-blue)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-[var(--text-secondary)]">
                    Defect Density D
                  </label>
                  <span className="font-mono swiss-tabular font-semibold">
                    {defectDensity.toFixed(2)} / cm²
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.05}
                  value={defectDensity}
                  onChange={(e) => setDefectDensity(Number(e.target.value))}
                  className="w-full accent-[var(--accent-blue)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-[var(--text-secondary)]">
                    Chiplet Tile Count N
                  </label>
                  <span className="font-mono swiss-tabular font-semibold">
                    {tileCount} {tileCount === 1 ? "(Monolithic)" : "chiplets"}
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={16}
                  step={1}
                  value={tileCount}
                  onChange={(e) => setTileCount(Number(e.target.value))}
                  className="w-full accent-[var(--accent-blue)]"
                />
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs swiss-tabular">
                <div className="rounded border border-[var(--border-subtle)] p-2.5">
                  <div className="text-[11px] text-[var(--text-muted)]">Monolithic Y</div>
                  <div className="text-sm font-bold text-[var(--accent-crimson)] mt-0.5">
                    {(yieldSim.monolithicYield * 100).toFixed(1)}%
                  </div>
                </div>
                <div
                  className={`rounded border p-2.5 ${
                    yieldSim.tileYield > 0.75
                      ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="text-[11px] text-[var(--text-muted)]">Tile Yield Y</div>
                  <div className="text-sm font-bold text-[var(--accent-emerald)] mt-0.5">
                    {(yieldSim.tileYield * 100).toFixed(1)}%
                  </div>
                </div>
                <div className="rounded border border-[var(--border-subtle)] p-2.5">
                  <div className="text-[11px] text-[var(--text-muted)]">Tile Area</div>
                  <div className="text-sm font-bold mt-0.5">
                    {yieldSim.tileAreaCm2.toFixed(2)} cm²
                  </div>
                </div>
                <div className="rounded border border-[var(--border-subtle)] p-2.5">
                  <div className="text-[11px] text-[var(--text-muted)]">KGD Gain</div>
                  <div className="text-sm font-bold text-[var(--accent-blue)] mt-0.5">
                    {yieldSim.kgdAdvantageRatio.toFixed(2)}×
                  </div>
                </div>
              </div>

              {/* Chiplet grid visualization */}
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                <div className="flex items-center justify-between text-xs font-mono mb-2">
                  <span>
                    Package Partition: {tileCount} × {yieldSim.tileAreaCm2.toFixed(2)} cm²
                  </span>
                  <span className="text-[var(--text-muted)]">
                    Y = e<sup>−(A/N)D</sup>
                  </span>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                  {Array.from({ length: tileCount }, (_, i) => (
                    <div
                      key={i}
                      className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] py-2 text-center font-mono text-[10.5] font-semibold text-[var(--accent-blue)]"
                    >
                      T{i + 1}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Poisson Yield Curve */}
          <div className="rounded border border-[var(--border-subtle)] p-3.5">
            <div className="flex items-center justify-between text-xs font-mono mb-1">
              <span className="font-semibold">
                Single-Tile Poisson Yield vs. Chiplet Count N
              </span>
              <span className="text-[var(--accent-emerald)]">75% target line</span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border-strong)" />
              <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="var(--border-strong)" />
              <line
                x1={padL}
                y1={toY(0.75)}
                x2={padL + plotW}
                y2={toY(0.75)}
                stroke="var(--accent-emerald)"
                strokeDasharray="4 3"
              />
              <line
                x1={padL}
                y1={toY(yieldSim.monolithicYield)}
                x2={padL + plotW}
                y2={toY(yieldSim.monolithicYield)}
                stroke="var(--accent-crimson)"
                strokeDasharray="3 3"
              />
              <path d={tileYieldPath} fill="none" stroke="var(--accent-blue)" strokeWidth="2.4" />
              <circle
                cx={toX(tileCount)}
                cy={toY(yieldSim.tileYield)}
                r="4.5"
                fill="var(--accent-blue)"
                stroke="var(--bg-surface)"
                strokeWidth="1.5"
              />
              <text x={padL - 6} y={padT + 8} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                100%
              </text>
              <text x={padL - 6} y={toY(0.75) + 3} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--accent-emerald)">
                75%
              </text>
              <text x={toX(1)} y={H - 8} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                N=1
              </text>
              <text x={toX(8)} y={H - 8} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                N=8
              </text>
              <text x={toX(16)} y={H - 8} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                N=16
              </text>
            </svg>
          </div>
        </div>
      )}

      {tab === "qubit" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="space-y-1 text-xs">
                <span className="text-[var(--text-muted)] block">
                  Gate Sequence (H, X, Z up to 20 gates)
                </span>
                <input
                  type="text"
                  value={gateInput}
                  onChange={(e) => {
                    setPlaying(false);
                    setGateInput(e.target.value);
                    setStepIdx(0);
                  }}
                  className="w-56 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-sm uppercase"
                  placeholder="H Z H"
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setGateInput("H Z H");
                  setStepIdx(0);
                }}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs"
              >
                H Z H (→ |1⟩)
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setGateInput("H H");
                  setStepIdx(0);
                }}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs"
              >
                H H (→ |0⟩)
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStepIdx((s) => Math.min(qubitSim.snapshots.length - 1, s + 1));
                }}
                disabled={clampedStep >= qubitSim.snapshots.length - 1}
                className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs disabled:opacity-40"
              >
                <StepForward className="h-3.5 w-3.5" /> Step
              </button>
              <button
                type="button"
                onClick={() => {
                  if (clampedStep >= qubitSim.snapshots.length - 1) setStepIdx(0);
                  setPlaying((p) => !p);
                }}
                className="inline-flex items-center gap-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)]"
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                {playing ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStepIdx(0);
                }}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs"
              >
                Rewind
              </button>
            </div>
          </div>

          {/* Gate Tape */}
          <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
            <span
              className={`rounded border px-2.5 py-1 ${
                clampedStep === 0
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                  : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
              }`}
            >
              |0⟩
            </span>
            {gates.map((g, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setStepIdx(idx + 1);
                }}
                className={`rounded border px-2.5 py-1 font-bold ${
                  clampedStep === idx + 1
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                    : idx + 1 < clampedStep
                    ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                {g}
              </button>
            ))}
          </div>

          {/* Amplitudes & SVG Phase Diagram */}
          <div className="grid gap-4 lg:grid-cols-12">
            <div className="lg:col-span-5 grid grid-cols-2 gap-2.5 font-mono text-xs swiss-tabular">
              <div className="rounded border border-[var(--border-subtle)] p-3">
                <div className="text-[11px] text-[var(--text-muted)]">Amplitude α (|0⟩)</div>
                <div className="text-base font-bold text-[var(--accent-blue)] mt-0.5">
                  {currentQubit.alpha.toFixed(4)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  P(0) = {(currentQubit.prob0 * 100).toFixed(1)}%
                </div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-3">
                <div className="text-[11px] text-[var(--text-muted)]">Amplitude β (|1⟩)</div>
                <div className="text-base font-bold text-[var(--accent-emerald)] mt-0.5">
                  {currentQubit.beta.toFixed(4)}
                </div>
                <div className="text-[11px] text-[var(--text-muted)] mt-1">
                  P(1) = {(currentQubit.prob1 * 100).toFixed(1)}%
                </div>
              </div>
              <div className="col-span-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                <div className="text-[11px] text-[var(--text-muted)]">Quantum State</div>
                <div className="text-sm font-bold mt-0.5">{currentQubit.phaseLabel}</div>
              </div>
            </div>

            {/* SVG Amplitude & Phase Bar Diagram */}
            <div className="lg:col-span-7 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <svg viewBox="0 0 400 136" className="w-full h-auto">
                {/* Zero baseline */}
                <line x1="40" y1="74" x2="360" y2="74" stroke="var(--border-strong)" strokeWidth="1.5" />
                <text x="32" y="77" textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                  0
                </text>
                <text x="32" y="24" textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                  +1
                </text>
                <text x="32" y="128" textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                  −1
                </text>

                {/* Alpha bar */}
                {(() => {
                  const barH = Math.abs(currentQubit.alpha) * 52;
                  const y = currentQubit.alpha >= 0 ? 74 - barH : 74;
                  return (
                    <g>
                      <rect
                        x="95"
                        y={y}
                        width="54"
                        height={Math.max(2, barH)}
                        fill="var(--accent-blue)"
                        rx="3"
                      />
                      <text x="122" y="16" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono-stack)" fill="var(--accent-blue)">
                        α|0⟩ ({currentQubit.alpha >= 0 ? "+" : "−"}phase)
                      </text>
                    </g>
                  );
                })()}

                {/* Beta bar */}
                {(() => {
                  const barH = Math.abs(currentQubit.beta) * 52;
                  const y = currentQubit.beta >= 0 ? 74 - barH : 74;
                  return (
                    <g>
                      <rect
                        x="235"
                        y={y}
                        width="54"
                        height={Math.max(2, barH)}
                        fill={currentQubit.beta >= 0 ? "var(--accent-emerald)" : "var(--accent-crimson)"}
                        rx="3"
                      />
                      <text x="262" y="16" textAnchor="middle" fontSize="10.5" fontWeight="700" fontFamily="var(--font-mono-stack)" fill={currentQubit.beta >= 0 ? "var(--accent-emerald)" : "var(--accent-crimson)"}>
                        β|1⟩ ({currentQubit.beta >= 0 ? "+" : "−"}phase)
                      </text>
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChipletYieldQubitLab;
