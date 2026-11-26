"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  DEFAULT_SATURATION_CURRENT_A,
  DEFAULT_THERMAL_VOLTAGE_V,
  evaluateShockleyDiode,
  simulateChargeDrift,
  type CarrierType,
} from "@/lib/simulators/pnDiodeCharge";

type PnTab = "drift" | "diode";

export function PnDiodeChargeLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [tab, setTab] = useState<PnTab>("diode");

  // Charge & Electron Drift state
  const [chargeC, setChargeC] = useState(4.0);
  const [timeS, setTimeS] = useState(2.0);
  const [carrierType, setCarrierType] = useState<CarrierType>("electron");
  const [driftPhase, setDriftPhase] = useState(0);

  // Shockley Diode & PN Junction state
  const [biasVoltage, setBiasVoltage] = useState(0.0);
  const [isPicoAmps, setIsPicoAmps] = useState(1.0);
  const [ideality, setIdeality] = useState(1.0);
  const [dopingScale, setDopingScale] = useState(2.0);

  const completedRef = useRef(false);

  const driftRes = useMemo(
    () =>
      simulateChargeDrift({
        chargeCoulombs: chargeC,
        timeSeconds: timeS,
        carrierType,
      }),
    [chargeC, timeS, carrierType]
  );

  const diodeRes = useMemo(
    () =>
      evaluateShockleyDiode({
        biasVoltage,
        saturationCurrentA: isPicoAmps * 1e-12,
        idealityFactor: ideality,
        thermalVoltageV: DEFAULT_THERMAL_VOLTAGE_V,
        dopingScale,
      }),
    [biasVoltage, isPicoAmps, ideality, dopingScale]
  );

  const challengeMet =
    diodeRes.regime === "forward" &&
    diodeRes.depletionWidthUm < 0.35 &&
    biasVoltage <= 0.75;

  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  // Animate carrier drift particles smoothly
  useEffect(() => {
    if (tab !== "drift" || driftRes.currentAmps <= 0) return;
    const id = window.setInterval(() => {
      setDriftPhase((p) => (p + Math.min(8, Math.max(1, driftRes.currentAmps * 0.8))) % 100);
    }, 60);
    return () => window.clearInterval(id);
  }, [tab, driftRes.currentAmps]);

  const handleReset = () => {
    setChargeC(4.0);
    setTimeS(2.0);
    setCarrierType("electron");
    setBiasVoltage(0.0);
    setIsPicoAmps(1.0);
    setIdeality(1.0);
    setDopingScale(2.0);
  };

  // I-V SVG geometry
  const W = 480;
  const H = 210;
  const padL = 52;
  const padR = 16;
  const padT = 16;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const vMin = -0.6;
  const vMax = 0.75;
  const maxCurveMa = Math.max(
    1,
    ...diodeRes.ivCurve.map((pt) => Math.abs(pt.currentMa))
  );
  const toX = (v: number) => padL + ((v - vMin) / (vMax - vMin)) * plotW;
  const toY = (iMa: number) =>
    padT + plotH - 12 - (Math.max(0, iMa) / maxCurveMa) * (plotH - 18);

  const ivPath = diodeRes.ivCurve
    .map(
      (pt, idx) =>
        `${idx === 0 ? "M" : "L"}${toX(pt.voltage).toFixed(1)},${toY(
          pt.currentMa
        ).toFixed(1)}`
    )
    .join(" ");

  const formatCurrent = (amps: number) => {
    const abs = Math.abs(amps);
    if (abs >= 1) return `${amps.toFixed(3)} A`;
    if (abs >= 1e-3) return `${(amps * 1e3).toFixed(3)} mA`;
    if (abs >= 1e-6) return `${(amps * 1e6).toFixed(3)} µA`;
    if (abs >= 1e-9) return `${(amps * 1e9).toFixed(3)} nA`;
    return `${(amps * 1e12).toFixed(3)} pA`;
  };

  // Depletion visual width in SVG
  const depletionPx = Math.min(110, Math.max(12, diodeRes.depletionWidthUm * 130));

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab · Semiconductors &amp; Charge Drift
          </p>
          <h3 className="text-lg font-semibold">
            PN Junction, Carrier Drift &amp; Shockley Diode Lab
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
              onClick={() => setTab("drift")}
              className={`px-3 py-1 ${
                tab === "drift"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              Charge &amp; Drift
            </button>
            <button
              type="button"
              onClick={() => setTab("diode")}
              className={`px-3 py-1 ${
                tab === "diode"
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
              }`}
            >
              PN Junction &amp; Diode
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
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Goal: </strong>
          {challengeGoal}
        </div>
      )}

      {tab === "drift" && (
        <div className="grid gap-4 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-medium text-[var(--text-secondary)]">
                  Total Charge Q
                </label>
                <span className="font-mono swiss-tabular font-semibold">
                  {chargeC.toFixed(1)} C
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={12}
                step={0.2}
                value={chargeC}
                onChange={(e) => setChargeC(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="font-medium text-[var(--text-secondary)]">
                  Elapsed Time t
                </label>
                <span className="font-mono swiss-tabular font-semibold">
                  {timeS.toFixed(1)} s
                </span>
              </div>
              <input
                type="range"
                min={0.1}
                max={12}
                step={0.1}
                value={timeS}
                onChange={(e) => setTimeS(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div className="space-y-1.5 text-xs">
              <span className="font-medium text-[var(--text-secondary)] block">
                Charge Carrier Sign
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["electron", "hole"] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCarrierType(c)}
                    className={`rounded border py-1.5 font-mono text-xs font-semibold capitalize ${
                      carrierType === c
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {c === "electron" ? "Negative (e⁻)" : "Positive (h⁺)"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-3">
            <div className="grid grid-cols-3 gap-2.5 font-mono text-xs swiss-tabular">
              <div className="rounded border border-[var(--border-subtle)] p-2.5">
                <div className="text-[11px] text-[var(--text-muted)]">Current I = Q/t</div>
                <div className="text-sm font-bold text-[var(--accent-blue)] mt-0.5">
                  {driftRes.currentAmps.toFixed(3)} A
                </div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2.5">
                <div className="text-[11px] text-[var(--text-muted)]">Carriers N = Q/e</div>
                <div className="text-sm font-bold mt-0.5">
                  {driftRes.carrierCount.toExponential(3)}
                </div>
              </div>
              <div className="rounded border border-[var(--border-subtle)] p-2.5">
                <div className="text-[11px] text-[var(--text-muted)]">Carrier Drift</div>
                <div className="text-sm font-bold text-[var(--accent-amber)] mt-0.5 uppercase">
                  {driftRes.driftDirection === "left" ? "← Left" : "Right →"}
                </div>
              </div>
            </div>

            {/* Animated SVG Wire Drift Diagram */}
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <svg viewBox="0 0 460 120" className="w-full h-auto">
                <text
                  x="230"
                  y="16"
                  textAnchor="middle"
                  fontSize="10.5"
                  fontFamily="var(--font-mono-stack)"
                  fill="var(--accent-emerald)"
                >
                  Conventional Current I → (Positive to Negative)
                </text>
                <line
                  x1="120"
                  y1="24"
                  x2="340"
                  y2="24"
                  stroke="var(--accent-emerald)"
                  strokeWidth="2"
                />
                <polygon points="340,20 348,24 340,28" fill="var(--accent-emerald)" />

                {/* Conductor cylinder */}
                <rect
                  x="30"
                  y="40"
                  width="400"
                  height="48"
                  rx="8"
                  fill="var(--bg-surface)"
                  stroke="var(--border-strong)"
                  strokeWidth="2"
                />

                {/* Animated charge carriers */}
                {Array.from({ length: 8 }, (_, idx) => {
                  const base = (idx * 50 + (carrierType === "electron" ? 100 - driftPhase : driftPhase) * 4) % 380;
                  const cx = 42 + base;
                  const cy = idx % 2 === 0 ? 56 : 72;
                  return (
                    <g key={idx}>
                      <circle
                        cx={cx}
                        cy={cy}
                        r="8"
                        fill={
                          carrierType === "electron"
                            ? "var(--accent-blue-soft)"
                            : "var(--accent-amber-soft)"
                        }
                        stroke={
                          carrierType === "electron"
                            ? "var(--accent-blue)"
                            : "var(--accent-amber)"
                        }
                        strokeWidth="1.5"
                      />
                      <text
                        x={cx}
                        y={cy + 3.5}
                        textAnchor="middle"
                        fontSize="10"
                        fontWeight="700"
                        fill={
                          carrierType === "electron"
                            ? "var(--accent-blue)"
                            : "var(--accent-amber)"
                        }
                      >
                        {carrierType === "electron" ? "−" : "+"}
                      </text>
                    </g>
                  );
                })}

                <text
                  x="230"
                  y="108"
                  textAnchor="middle"
                  fontSize="10"
                  fontFamily="var(--font-mono-stack)"
                  fill="var(--text-secondary)"
                >
                  {carrierType === "electron"
                    ? "← Electrons (e⁻) physically drift opposite to conventional current I"
                    : "Holes (h⁺) drift in the same direction as conventional current I →"}
                </text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {tab === "diode" && (
        <div className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-12">
            {/* Controls */}
            <div className="lg:col-span-5 space-y-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-[var(--text-secondary)]">
                    Bias Voltage V<sub>D</sub>
                  </label>
                  <span className="font-mono swiss-tabular font-semibold">
                    {biasVoltage >= 0 ? "+" : ""}
                    {biasVoltage.toFixed(2)} V
                  </span>
                </div>
                <input
                  type="range"
                  min={-0.6}
                  max={0.75}
                  step={0.01}
                  value={biasVoltage}
                  onChange={(e) => setBiasVoltage(Number(e.target.value))}
                  className="w-full accent-[var(--accent-blue)]"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="font-medium text-[var(--text-secondary)]">
                    Doping Density Scale (N<sub>a</sub>, N<sub>d</sub>)
                  </label>
                  <span className="font-mono swiss-tabular font-semibold">
                    {dopingScale.toFixed(1)}×
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={dopingScale}
                  onChange={(e) => setDopingScale(Number(e.target.value))}
                  className="w-full accent-[var(--accent-blue)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <label className="space-y-1">
                  <span className="text-[var(--text-muted)] font-mono block">
                    I<sub>s</sub> (pA)
                  </span>
                  <input
                    type="number"
                    min={0.1}
                    max={100}
                    step={0.5}
                    value={isPicoAmps}
                    onChange={(e) =>
                      setIsPicoAmps(Math.max(0.1, Number(e.target.value) || 1))
                    }
                    className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-[var(--text-muted)] font-mono block">
                    Ideality n
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={2}
                    step={0.1}
                    value={ideality}
                    onChange={(e) =>
                      setIdeality(Math.min(2, Math.max(1, Number(e.target.value) || 1)))
                    }
                    className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
                  />
                </label>
              </div>
              <div className="text-[11px] font-mono text-[var(--text-muted)]">
                V<sub>T</sub> = {DEFAULT_THERMAL_VOLTAGE_V} V · I<sub>s</sub> ={" "}
                {(isPicoAmps * DEFAULT_SATURATION_CURRENT_A).toExponential(1)} A
              </div>
            </div>

            {/* Readouts + PN Depletion Cross-Section */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs swiss-tabular">
                <div className="rounded border border-[var(--border-subtle)] p-2.5">
                  <div className="text-[11px] text-[var(--text-muted)]">Diode Current I</div>
                  <div className="text-sm font-bold text-[var(--accent-blue)] mt-0.5">
                    {formatCurrent(diodeRes.currentAmps)}
                  </div>
                </div>
                <div className="rounded border border-[var(--border-subtle)] p-2.5">
                  <div className="text-[11px] text-[var(--text-muted)]">Bias Regime</div>
                  <div className="text-sm font-bold capitalize mt-0.5">
                    {diodeRes.regime}
                  </div>
                </div>
                <div
                  className={`rounded border p-2.5 ${
                    diodeRes.depletionWidthUm < 0.35
                      ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  <div className="text-[11px] text-[var(--text-muted)]">Depletion W</div>
                  <div className="text-sm font-bold mt-0.5">
                    {diodeRes.depletionWidthUm.toFixed(3)} µm
                  </div>
                </div>
                <div className="rounded border border-[var(--border-subtle)] p-2.5">
                  <div className="text-[11px] text-[var(--text-muted)]">Barrier φ</div>
                  <div className="text-sm font-bold text-[var(--accent-amber)] mt-0.5">
                    {diodeRes.barrierHeightV.toFixed(2)} V
                  </div>
                </div>
              </div>

              {/* PN Junction Depletion SVG */}
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
                <svg viewBox="0 0 460 100" className="w-full h-auto">
                  {/* P-type region */}
                  <rect
                    x="30"
                    y="18"
                    width="200"
                    height="62"
                    fill="var(--accent-crimson-soft)"
                    stroke="var(--border-strong)"
                  />
                  {/* N-type region */}
                  <rect
                    x="230"
                    y="18"
                    width="200"
                    height="62"
                    fill="var(--accent-blue-soft)"
                    stroke="var(--border-strong)"
                  />
                  {/* Depletion zone centered at x=230 */}
                  <rect
                    x={230 - depletionPx / 2}
                    y="18"
                    width={depletionPx}
                    height="62"
                    fill="var(--bg-surface)"
                    fillOpacity="0.88"
                    stroke="var(--accent-amber)"
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  <text x="95" y="47" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--accent-crimson)">
                    P-Type (Holes +)
                  </text>
                  <text x="365" y="47" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--accent-blue)">
                    N-Type (Electrons −)
                  </text>
                  <text
                    x="230"
                    y="94"
                    textAnchor="middle"
                    fontSize="10"
                    fontFamily="var(--font-mono-stack)"
                    fill="var(--text-secondary)"
                  >
                    Depletion Zone W = {diodeRes.depletionWidthUm.toFixed(3)} µm
                  </text>
                </svg>
              </div>
            </div>
          </div>

          {/* Shockley I-V Curve SVG */}
          <div className="rounded border border-[var(--border-subtle)] p-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold">
                Shockley I–V Curve: I = I<sub>s</sub>(e<sup>V/(nV<sub>T</sub>)</sup> − 1)
              </span>
              <span className="text-[var(--text-muted)]">
                V<sub>D</sub> ∈ [-0.60 V, +0.75 V]
              </span>
            </div>
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border-strong)" />
              <line x1={padL} y1={toY(0)} x2={padL + plotW} y2={toY(0)} stroke="var(--border-strong)" />
              <line
                x1={toX(0)}
                y1={padT}
                x2={toX(0)}
                y2={padT + plotH}
                stroke="var(--border-subtle)"
                strokeDasharray="3 3"
              />
              <path d={ivPath} fill="none" stroke="var(--accent-blue)" strokeWidth="2.4" />
              <circle
                cx={toX(biasVoltage)}
                cy={toY(diodeRes.currentMa)}
                r="4.5"
                fill="var(--accent-crimson)"
                stroke="var(--bg-surface)"
                strokeWidth="1.5"
              />
              <text x={toX(vMin)} y={H - 8} fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                -0.6V
              </text>
              <text x={toX(0)} y={H - 8} textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                0V
              </text>
              <text x={toX(vMax)} y={H - 8} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                +0.75V
              </text>
              <text x={padL - 6} y={padT + 10} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                {maxCurveMa.toFixed(1)}mA
              </text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}

export default PnDiodeChargeLab;
