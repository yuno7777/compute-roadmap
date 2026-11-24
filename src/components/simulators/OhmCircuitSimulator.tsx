"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Zap } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  capacitorVoltageAtTime,
  equivalentResistance,
  simulateOhmCircuit,
  type ResistorTopology,
} from "@/lib/simulators/ohmCircuit";

export function OhmCircuitSimulator({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [voltage, setVoltage] = useState(5.0);
  const [resistance, setResistance] = useState(500);
  const [capacitancePf, setCapacitancePf] = useState(3.0);
  const [probeTimeFrac, setProbeTimeFrac] = useState(0.2);

  // Equivalent resistance helper state
  const [topology, setTopology] = useState<ResistorTopology>("parallel");
  const [r1, setR1] = useState(2000);
  const [r2, setR2] = useState(2000);

  const completedRef = useRef(false);

  const sim = useMemo(
    () => simulateOhmCircuit({ voltage, resistance, capacitancePf }, 80),
    [voltage, resistance, capacitancePf]
  );

  const eqRes = useMemo(
    () => equivalentResistance([r1, r2], topology),
    [r1, r2, topology]
  );

  const maxTimeNs = Math.max(5 * sim.tauNs, 0.05);
  const probeTimeNs = probeTimeFrac * maxTimeNs;
  const probeVoltage = capacitorVoltageAtTime(
    voltage,
    resistance,
    capacitancePf,
    probeTimeNs
  );

  useEffect(() => {
    if (sim.meetsChallenge && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [sim.meetsChallenge, onChallengeComplete]);

  // SVG plot geometry
  const W = 520;
  const H = 220;
  const padL = 46;
  const padR = 16;
  const padT = 18;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (t: number) => padL + (t / maxTimeNs) * plotW;
  const toYV = (v: number) =>
    padT + plotH - (voltage > 0 ? (v / voltage) * plotH : 0);
  const toYI = (iMa: number) =>
    padT + plotH - (sim.currentMa > 0 ? (iMa / sim.currentMa) * plotH : 0);

  const vPath = sim.waveform
    .map(
      (pt, idx) =>
        `${idx === 0 ? "M" : "L"}${toX(pt.timeNs).toFixed(1)},${toYV(pt.voltageV).toFixed(1)}`
    )
    .join(" ");

  const iPath = sim.waveform
    .map(
      (pt, idx) =>
        `${idx === 0 ? "M" : "L"}${toX(pt.timeNs).toFixed(1)},${toYI(pt.currentMa).toFixed(1)}`
    )
    .join(" ");

  const handleReset = () => {
    setVoltage(5.0);
    setResistance(500);
    setCapacitancePf(3.0);
    setProbeTimeFrac(0.2);
  };

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 01 · Physics &amp; RC Timing
          </p>
          <h3 className="text-lg font-semibold">Ohm&apos;s Law &amp; RC Charging Lab</h3>
        </div>
        <div className="flex items-center gap-2">
          {sim.meetsChallenge && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">Goal: </span>
          {challengeGoal}
        </div>
      )}

      {/* Top Controls + Readouts */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 lg:col-span-5">
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-medium text-[var(--text-secondary)]">
                  Supply Voltage (V<sub>s</sub>)
                </label>
                <span className="font-mono swiss-tabular font-semibold">
                  {voltage.toFixed(2)} V
                </span>
              </div>
              <input
                type="range"
                min={0.5}
                max={12}
                step={0.1}
                value={voltage}
                onChange={(e) => setVoltage(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-medium text-[var(--text-secondary)]">
                  Resistance (R)
                </label>
                <span className="font-mono swiss-tabular font-semibold">
                  {resistance} Ω
                </span>
              </div>
              <input
                type="range"
                min={50}
                max={5000}
                step={25}
                value={resistance}
                onChange={(e) => setResistance(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-medium text-[var(--text-secondary)]">
                  Capacitance (C)
                </label>
                <span className="font-mono swiss-tabular font-semibold">
                  {capacitancePf.toFixed(1)} pF
                </span>
              </div>
              <input
                type="range"
                min={0.2}
                max={20}
                step={0.1}
                value={capacitancePf}
                onChange={(e) => setCapacitancePf(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          {/* Series / Parallel Helper */}
          <div className="rounded border border-[var(--border-subtle)] p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[var(--text-primary)]">
                Network Equivalent R<sub>eq</sub>
              </span>
              <div className="inline-flex rounded border border-[var(--border-subtle)] overflow-hidden text-[11px] font-mono">
                {(["series", "parallel"] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setTopology(mode)}
                    className={`px-2 py-0.5 capitalize ${
                      topology === mode
                        ? "bg-[var(--accent-blue)] text-white"
                        : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="space-y-1">
                <span className="text-[var(--text-muted)] font-mono">R1 (Ω)</span>
                <input
                  type="number"
                  min={10}
                  max={10000}
                  step={50}
                  value={r1}
                  onChange={(e) => setR1(Math.max(10, Number(e.target.value) || 10))}
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono swiss-tabular text-xs"
                />
              </label>
              <label className="space-y-1">
                <span className="text-[var(--text-muted)] font-mono">R2 (Ω)</span>
                <input
                  type="number"
                  min={10}
                  max={10000}
                  step={50}
                  value={r2}
                  onChange={(e) => setR2(Math.max(10, Number(e.target.value) || 10))}
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono swiss-tabular text-xs"
                />
              </label>
            </div>
            <div className="flex items-center justify-between pt-1 text-xs">
              <span className="font-mono swiss-tabular text-[var(--text-secondary)]">
                R<sub>eq</sub> = <strong>{eqRes.toFixed(1)} Ω</strong>
              </span>
              <button
                type="button"
                onClick={() =>
                  setResistance(Math.min(5000, Math.max(50, Math.round(eqRes))))
                }
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-0.5 font-mono text-[11px] text-[var(--accent-blue)] hover:border-[var(--accent-blue)]"
              >
                Apply to Circuit
              </button>
            </div>
          </div>
        </div>

        {/* Schematic + Readouts */}
        <div className="space-y-3 lg:col-span-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Peak Current I</div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular text-[var(--accent-amber)]">
                {sim.currentMa.toFixed(2)} mA
              </div>
            </div>
            <div
              className={`rounded border p-2.5 ${
                sim.powerMw <= 25
                  ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                  : "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]"
              }`}
            >
              <div className="text-[11px] text-[var(--text-muted)]">Peak Power V²/R</div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular">
                {sim.powerMw.toFixed(2)} mW
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Time Const τ=RC</div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular text-[var(--accent-blue)]">
                {sim.tauNs.toFixed(3)} ns
              </div>
            </div>
            <div
              className={`rounded border p-2.5 ${
                sim.riseTimeNs < 2.2
                  ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                  : "border-[var(--border-subtle)]"
              }`}
            >
              <div className="text-[11px] text-[var(--text-muted)]">10–90% Rise Time</div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular">
                {sim.riseTimeNs.toFixed(3)} ns
              </div>
            </div>
          </div>

          {/* Crisp SVG RC Circuit Schematic */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-mono text-[11px] text-[var(--text-muted)] flex items-center gap-1">
                <Zap className="h-3 w-3 text-[var(--accent-amber)]" />
                RC Step-Response Schematic
              </span>
              <span className="font-mono text-[11px] swiss-tabular text-[var(--text-secondary)]">
                E<sub>cap</sub> = {sim.energyPj.toFixed(2)} pJ
              </span>
            </div>
            <svg viewBox="0 0 460 118" className="w-full h-auto">
              {/* Loop wires */}
              <path
                d="M 70 42 L 70 26 L 145 26 M 225 26 L 340 26 L 340 44 M 340 72 L 340 94 L 70 94 L 70 74"
                fill="none"
                stroke="var(--border-strong)"
                strokeWidth="2"
              />
              {/* Voltage source circle */}
              <circle
                cx="70"
                cy="58"
                r="16"
                fill="var(--bg-surface)"
                stroke="var(--accent-blue)"
                strokeWidth="2"
              />
              <text
                x="70"
                y="55"
                textAnchor="middle"
                fontSize="10"
                fontWeight="700"
                fill="var(--text-primary)"
              >
                +
              </text>
              <text
                x="70"
                y="67"
                textAnchor="middle"
                fontSize="10"
                fill="var(--text-muted)"
              >
                −
              </text>
              <text
                x="38"
                y="61"
                textAnchor="end"
                fontSize="11"
                fontFamily="var(--font-mono-stack)"
                fill="var(--text-primary)"
              >
                {voltage.toFixed(1)}V
              </text>

              {/* Resistor zigzag */}
              <path
                d="M 145 26 L 153 18 L 165 34 L 177 18 L 189 34 L 201 18 L 213 34 L 225 26"
                fill="none"
                stroke="var(--accent-amber)"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              <text
                x="185"
                y="13"
                textAnchor="middle"
                fontSize="10.5"
                fontFamily="var(--font-mono-stack)"
                fill="var(--text-primary)"
              >
                R = {resistance} Ω
              </text>

              {/* Current arrow */}
              <line
                x1="255"
                y1="17"
                x2="295"
                y2="17"
                stroke="var(--accent-amber)"
                strokeWidth="1.6"
              />
              <polygon points="295,13 303,17 295,21" fill="var(--accent-amber)" />
              <text
                x="276"
                y="12"
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="var(--font-mono-stack)"
                fill="var(--accent-amber)"
              >
                I(0)={sim.currentMa.toFixed(1)}mA
              </text>

              {/* Capacitor plates */}
              <line
                x1="322"
                y1="44"
                x2="358"
                y2="44"
                stroke="var(--accent-blue)"
                strokeWidth="3"
              />
              <line
                x1="322"
                y1="72"
                x2="358"
                y2="72"
                stroke="var(--accent-blue)"
                strokeWidth="3"
              />
              <text
                x="368"
                y="54"
                fontSize="10.5"
                fontFamily="var(--font-mono-stack)"
                fill="var(--text-primary)"
              >
                C = {capacitancePf.toFixed(1)} pF
              </text>
              <text
                x="368"
                y="69"
                fontSize="10"
                fontFamily="var(--font-mono-stack)"
                fill="var(--accent-blue)"
              >
                Vc = {probeVoltage.toFixed(2)} V
              </text>

              {/* Ground symbol */}
              <line x1="205" y1="94" x2="205" y2="104" stroke="var(--border-strong)" strokeWidth="2" />
              <line x1="193" y1="104" x2="217" y2="104" stroke="var(--border-strong)" strokeWidth="2" />
              <line x1="197" y1="109" x2="213" y2="109" stroke="var(--border-strong)" strokeWidth="2" />
            </svg>
          </div>
        </div>
      </div>

      {/* RC Waveform SVG Plot */}
      <div className="rounded border border-[var(--border-subtle)] p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-2 w-4 rounded-sm bg-[var(--accent-blue)] inline-block" />
              V<sub>c</sub>(t)
            </span>
            <span className="inline-flex items-center gap-1.5 font-mono text-[11px]">
              <span className="h-0.5 w-4 border-t-2 border-dashed border-[var(--accent-amber)] inline-block" />
              I(t)
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              t<sub>10%</sub>={sim.t10Ns.toFixed(2)}ns · t<sub>90%</sub>=
              {sim.t90Ns.toFixed(2)}ns
            </span>
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px] swiss-tabular">
            <span className="text-[var(--text-muted)]">Probe t:</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={probeTimeFrac}
              onChange={(e) => setProbeTimeFrac(Number(e.target.value))}
              className="w-28 accent-[var(--accent-blue)]"
            />
            <span>{probeTimeNs.toFixed(2)} ns</span>
          </div>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          {/* Grid & axes */}
          <line
            x1={padL}
            y1={padT}
            x2={padL}
            y2={padT + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />
          <line
            x1={padL}
            y1={padT + plotH}
            x2={padL + plotW}
            y2={padT + plotH}
            stroke="var(--border-strong)"
            strokeWidth="1"
          />

          {/* 10% and 90% guide lines */}
          {[0.1, 0.9].map((frac) => {
            const y = toYV(voltage * frac);
            return (
              <g key={frac}>
                <line
                  x1={padL}
                  y1={y}
                  x2={padL + plotW}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="3 3"
                />
                <text
                  x={padL - 6}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9.5"
                  fontFamily="var(--font-mono-stack)"
                  fill="var(--text-muted)"
                >
                  {Math.round(frac * 100)}%
                </text>
              </g>
            );
          })}

          {/* Tau vertical marker */}
          <line
            x1={toX(sim.tauNs)}
            y1={padT}
            x2={toX(sim.tauNs)}
            y2={padT + plotH}
            stroke="var(--accent-emerald)"
            strokeDasharray="4 3"
            strokeWidth="1"
          />
          <text
            x={toX(sim.tauNs) + 4}
            y={padT + 12}
            fontSize="9.5"
            fontFamily="var(--font-mono-stack)"
            fill="var(--accent-emerald)"
          >
            τ (63.2%)
          </text>

          {/* Current decay dashed curve */}
          <path
            d={iPath}
            fill="none"
            stroke="var(--accent-amber)"
            strokeWidth="1.6"
            strokeDasharray="5 3"
          />
          {/* Voltage charging curve */}
          <path
            d={vPath}
            fill="none"
            stroke="var(--accent-blue)"
            strokeWidth="2.4"
          />

          {/* Probe cursor */}
          <line
            x1={toX(probeTimeNs)}
            y1={padT}
            x2={toX(probeTimeNs)}
            y2={padT + plotH}
            stroke="var(--text-primary)"
            strokeOpacity="0.35"
            strokeWidth="1"
          />
          <circle
            cx={toX(probeTimeNs)}
            cy={toYV(probeVoltage)}
            r="4"
            fill="var(--accent-blue)"
            stroke="var(--bg-surface)"
            strokeWidth="1.5"
          />

          {/* X axis labels */}
          {[0, 1, 2, 3, 4, 5].map((k) => {
            const x = toX(k * sim.tauNs);
            return (
              <text
                key={k}
                x={x}
                y={H - 8}
                textAnchor="middle"
                fontSize="9.5"
                fontFamily="var(--font-mono-stack)"
                fill="var(--text-muted)"
              >
                {k}τ
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default OhmCircuitSimulator;
