"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Pause, Play, RotateCcw } from "lucide-react";
import type { SimulatorProps } from "./registry";
import { simulateCmosInverter } from "@/lib/simulators/mosfetCmos";

export function MosfetCmosSimulator({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [vdd, setVdd] = useState(1.8);
  const [vin, setVin] = useState(0.0);
  const [vth, setVth] = useState(0.4);
  const [knMaV2, setKnMaV2] = useState(6.0);
  const [kpMaV2, setKpMaV2] = useState(6.0);
  const [loadCapFf, setLoadCapFf] = useState(100);
  const [frequencyGhz, setFrequencyGhz] = useState(2.0);
  const [activityFactor, setActivityFactor] = useState(0.5);
  const [sweeping, setSweeping] = useState(false);
  const [visitedVm, setVisitedVm] = useState(false);

  const completedRef = useRef(false);

  const sim = useMemo(
    () =>
      simulateCmosInverter(
        {
          vdd,
          vthN: vth,
          vthP: vth,
          knMaV2,
          kpMaV2,
          loadCapFf,
          frequencyGhz,
          activityFactor,
        },
        vin,
        64
      ),
    [vdd, vth, knMaV2, kpMaV2, loadCapFf, frequencyGhz, activityFactor, vin]
  );

  // Track if user has inspected near switching threshold V_M
  useEffect(() => {
    if (Math.abs(vin - sim.switchingThresholdV) <= 0.15) {
      setVisitedVm(true);
    }
  }, [vin, sim.switchingThresholdV]);

  // Challenge: identify V_M and minimize peak crowbar current (< 0.45 mA)
  const crowbarMinimized = sim.peakCrowbarMa < 0.45;
  const challengeMet = visitedVm && crowbarMinimized;

  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  useEffect(() => {
    if (!sweeping) return;
    const id = window.setInterval(() => {
      setVin((prev) => {
        const next = prev + vdd / 40;
        return next > vdd ? 0 : next;
      });
    }, 60);
    return () => window.clearInterval(id);
  }, [sweeping, vdd]);

  const clampedVin = Math.min(vdd, vin);

  // VTC plot geometry
  const W = 480;
  const H = 220;
  const padL = 44;
  const padR = 44;
  const padT = 16;
  const padB = 30;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;

  const toX = (v: number) => padL + (v / Math.max(0.1, vdd)) * plotW;
  const toYV = (v: number) => padT + plotH - (v / Math.max(0.1, vdd)) * plotH;
  const maxCrowbarScale = Math.max(sim.peakCrowbarMa * 1.15, 0.5);
  const toYI = (ma: number) => padT + plotH - (ma / maxCrowbarScale) * plotH;

  const vtcPath = sim.vtc
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"}${toX(pt.vin).toFixed(1)},${toYV(pt.vout).toFixed(1)}`
    )
    .join(" ");

  const crowbarPath = sim.vtc
    .map(
      (pt, i) =>
        `${i === 0 ? "M" : "L"}${toX(pt.vin).toFixed(1)},${toYI(pt.crowbarMa).toFixed(1)}`
    )
    .join(" ");

  const handleReset = () => {
    setSweeping(false);
    setVdd(1.8);
    setVin(0);
    setVth(0.4);
    setKnMaV2(6.0);
    setKpMaV2(6.0);
    setLoadCapFf(100);
    setFrequencyGhz(2.0);
    setActivityFactor(0.5);
    setVisitedVm(false);
  };

  const regionColor = (region: string) => {
    if (region === "cutoff") return "var(--text-muted)";
    if (region === "triode") return "var(--accent-emerald)";
    return "var(--accent-amber)";
  };

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 02 · Semiconductors &amp; CMOS
          </p>
          <h3 className="text-lg font-semibold">MOSFET &amp; CMOS Inverter Sandbox</h3>
        </div>
        <div className="flex items-center gap-2">
          {challengeMet && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <button
            type="button"
            onClick={() => setSweeping((s) => !s)}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)]"
          >
            {sweeping ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {sweeping ? "Pause Sweep" : "Sweep Vin"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
          <div>
            <span className="font-semibold text-[var(--text-primary)]">Goal: </span>
            {challengeGoal}
          </div>
          <div className="flex items-center gap-2 font-mono text-[11px]">
            <span className={visitedVm ? "text-[var(--accent-emerald)]" : "text-[var(--text-muted)]"}>
              [{visitedVm ? "✓" : " "}] Inspect V<sub>M</sub>
            </span>
            <span className={crowbarMinimized ? "text-[var(--accent-emerald)]" : "text-[var(--text-muted)]"}>
              [{crowbarMinimized ? "✓" : " "}] Peak I<sub>crowbar</sub> &lt; 0.45 mA
            </span>
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Controls */}
        <div className="space-y-3 lg:col-span-5 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="font-medium text-[var(--text-secondary)]">
                Gate Input V<sub>in</sub>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVin(Number(sim.switchingThresholdV.toFixed(2)))}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--accent-blue)]"
                >
                  Jump to V<sub>M</sub>
                </button>
                <span className="font-mono swiss-tabular font-semibold">
                  {clampedVin.toFixed(2)} V
                </span>
              </div>
            </div>
            <input
              type="range"
              min={0}
              max={vdd}
              step={0.02}
              value={clampedVin}
              onChange={(e) => {
                setSweeping(false);
                setVin(Number(e.target.value));
              }}
              className="w-full accent-[var(--accent-blue)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-[var(--text-secondary)]">V<sub>DD</sub></label>
                <span className="font-mono swiss-tabular">{vdd.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min={1.0}
                max={3.3}
                step={0.1}
                value={vdd}
                onChange={(e) => setVdd(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-[var(--text-secondary)]">|V<sub>th</sub>|</label>
                <span className="font-mono swiss-tabular">{vth.toFixed(2)} V</span>
              </div>
              <input
                type="range"
                min={0.2}
                max={0.9}
                step={0.05}
                value={vth}
                onChange={(e) => setVth(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-[var(--text-secondary)]">k<sub>n</sub> (mA/V²)</label>
                <span className="font-mono swiss-tabular">{knMaV2.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={knMaV2}
                onChange={(e) => setKnMaV2(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-[var(--text-secondary)]">k<sub>p</sub> (mA/V²)</label>
                <span className="font-mono swiss-tabular">{kpMaV2.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={kpMaV2}
                onChange={(e) => setKpMaV2(Number(e.target.value))}
                className="w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[var(--border-subtle)]">
            <label className="text-[11px] space-y-1">
              <span className="text-[var(--text-muted)] block">C<sub>L</sub> (fF)</span>
              <input
                type="number"
                min={10}
                max={500}
                step={10}
                value={loadCapFf}
                onChange={(e) => setLoadCapFf(Math.max(1, Number(e.target.value) || 1))}
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="text-[var(--text-muted)] block">f (GHz)</span>
              <input
                type="number"
                min={0.1}
                max={6}
                step={0.1}
                value={frequencyGhz}
                onChange={(e) => setFrequencyGhz(Math.max(0.1, Number(e.target.value) || 0.1))}
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
              />
            </label>
            <label className="text-[11px] space-y-1">
              <span className="text-[var(--text-muted)] block">α (0–1)</span>
              <input
                type="number"
                min={0.05}
                max={1}
                step={0.05}
                value={activityFactor}
                onChange={(e) =>
                  setActivityFactor(Math.min(1, Math.max(0.05, Number(e.target.value) || 0.1)))
                }
                className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs"
              />
            </label>
          </div>
        </div>

        {/* Schematic + Metrics */}
        <div className="space-y-3 lg:col-span-7">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Output V<sub>out</sub></div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular text-[var(--accent-blue)]">
                {sim.operatingPoint.vout.toFixed(3)} V
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Threshold V<sub>M</sub></div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular">
                {sim.switchingThresholdV.toFixed(3)} V
              </div>
            </div>
            <div
              className={`rounded border p-2.5 ${
                crowbarMinimized
                  ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                  : "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)]"
              }`}
            >
              <div className="text-[11px] text-[var(--text-muted)]">Peak Crowbar I</div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular">
                {sim.peakCrowbarMa.toFixed(3)} mA
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Dynamic P = αCV²f</div>
              <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular text-[var(--accent-amber)]">
                {sim.dynamicPowerMw.toFixed(3)} mW
              </div>
            </div>
          </div>

          {/* CMOS Inverter Schematic */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
            <svg viewBox="0 0 460 156" className="w-full h-auto">
              {/* VDD Rail */}
              <line x1="180" y1="18" x2="260" y2="18" stroke="var(--accent-crimson)" strokeWidth="2.5" />
              <text x="270" y="22" fontSize="10.5" fontFamily="var(--font-mono-stack)" fill="var(--accent-crimson)">
                VDD = {vdd.toFixed(2)}V
              </text>

              {/* PMOS pull-up */}
              <line x1="220" y1="18" x2="220" y2="38" stroke="var(--border-strong)" strokeWidth="2" />
              <rect
                x="198"
                y="38"
                width="44"
                height="28"
                rx="4"
                fill="var(--bg-surface)"
                stroke={regionColor(sim.operatingPoint.pmos.region)}
                strokeWidth="2"
              />
              <text x="220" y="55" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">
                PMOS
              </text>
              <text x="252" y="50" fontSize="10" fontFamily="var(--font-mono-stack)" fill={regionColor(sim.operatingPoint.pmos.region)}>
                {sim.operatingPoint.pmos.region.toUpperCase()}
              </text>
              <text x="252" y="63" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                Id={sim.operatingPoint.pmos.drainCurrentMa.toFixed(3)} mA
              </text>

              {/* Midpoint / Vout wire */}
              <line x1="220" y1="66" x2="220" y2="94" stroke="var(--accent-blue)" strokeWidth="2" />
              <line x1="220" y1="80" x2="340" y2="80" stroke="var(--accent-blue)" strokeWidth="2" />
              <circle cx="220" cy="80" r="3.5" fill="var(--accent-blue)" />
              <text x="348" y="84" fontSize="11" fontWeight="600" fontFamily="var(--font-mono-stack)" fill="var(--accent-blue)">
                Vout = {sim.operatingPoint.vout.toFixed(2)}V
              </text>

              {/* NMOS pull-down */}
              <rect
                x="198"
                y="94"
                width="44"
                height="28"
                rx="4"
                fill="var(--bg-surface)"
                stroke={regionColor(sim.operatingPoint.nmos.region)}
                strokeWidth="2"
              />
              <text x="220" y="111" textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--text-primary)">
                NMOS
              </text>
              <text x="252" y="106" fontSize="10" fontFamily="var(--font-mono-stack)" fill={regionColor(sim.operatingPoint.nmos.region)}>
                {sim.operatingPoint.nmos.region.toUpperCase()}
              </text>
              <text x="252" y="119" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                Id={sim.operatingPoint.nmos.drainCurrentMa.toFixed(3)} mA
              </text>

              {/* GND */}
              <line x1="220" y1="122" x2="220" y2="140" stroke="var(--border-strong)" strokeWidth="2" />
              <line x1="205" y1="140" x2="235" y2="140" stroke="var(--border-strong)" strokeWidth="2" />
              <line x1="210" y1="145" x2="230" y2="145" stroke="var(--border-strong)" strokeWidth="2" />

              {/* Common Gate Vin */}
              <line x1="90" y1="80" x2="176" y2="80" stroke="var(--text-primary)" strokeWidth="2" />
              <line x1="176" y1="52" x2="176" y2="108" stroke="var(--text-primary)" strokeWidth="2" />
              <circle cx="192" cy="52" r="4" fill="var(--bg-surface)" stroke="var(--text-primary)" strokeWidth="1.5" />
              <line x1="176" y1="52" x2="188" y2="52" stroke="var(--text-primary)" strokeWidth="1.8" />
              <line x1="176" y1="108" x2="198" y2="108" stroke="var(--text-primary)" strokeWidth="1.8" />
              <text x="82" y="84" textAnchor="end" fontSize="11" fontWeight="600" fontFamily="var(--font-mono-stack)" fill="var(--text-primary)">
                Vin={clampedVin.toFixed(2)}V
              </text>
            </svg>
          </div>
        </div>
      </div>

      {/* VTC + Crowbar Curve */}
      <div className="rounded border border-[var(--border-subtle)] p-3.5 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-[var(--accent-blue)] inline-block" />
              V<sub>out</sub>(V<sub>in</sub>)
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-4 rounded-sm bg-[var(--accent-crimson)] inline-block" />
              I<sub>crowbar</sub>(V<sub>in</sub>)
            </span>
          </div>
          <span className="font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
            NM<sub>L</sub> = {sim.noiseMarginLowV.toFixed(2)} V · NM<sub>H</sub> ={" "}
            {sim.noiseMarginHighV.toFixed(2)} V · I<sub>crowbar</sub>(V<sub>in</sub>) ={" "}
            {sim.operatingPoint.crowbarCurrentMa.toFixed(3)} mA
          </span>
        </div>

        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
          <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border-strong)" />
          <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="var(--border-strong)" />

          {/* Vout = Vin diagonal */}
          <line
            x1={toX(0)}
            y1={toYV(0)}
            x2={toX(vdd)}
            y2={toYV(vdd)}
            stroke="var(--border-subtle)"
            strokeDasharray="4 4"
          />

          {/* V_M vertical marker */}
          <line
            x1={toX(sim.switchingThresholdV)}
            y1={padT}
            x2={toX(sim.switchingThresholdV)}
            y2={padT + plotH}
            stroke="var(--accent-emerald)"
            strokeDasharray="3 3"
          />
          <text
            x={toX(sim.switchingThresholdV) + 4}
            y={padT + 12}
            fontSize="9.5"
            fontFamily="var(--font-mono-stack)"
            fill="var(--accent-emerald)"
          >
            V_M={sim.switchingThresholdV.toFixed(2)}V
          </text>

          {/* Crowbar curve */}
          <path d={crowbarPath} fill="none" stroke="var(--accent-crimson)" strokeWidth="1.8" />
          {/* VTC curve */}
          <path d={vtcPath} fill="none" stroke="var(--accent-blue)" strokeWidth="2.5" />

          {/* Operating point dots */}
          <circle
            cx={toX(clampedVin)}
            cy={toYV(sim.operatingPoint.vout)}
            r="4.5"
            fill="var(--accent-blue)"
            stroke="var(--bg-surface)"
            strokeWidth="1.5"
          />
          <circle
            cx={toX(clampedVin)}
            cy={toYI(sim.operatingPoint.crowbarCurrentMa)}
            r="3.5"
            fill="var(--accent-crimson)"
            stroke="var(--bg-surface)"
            strokeWidth="1.2"
          />

          <text x={padL - 6} y={padT + 8} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
            {vdd.toFixed(1)}V
          </text>
          <text x={padL - 6} y={padT + plotH} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
            0V
          </text>
          <text x={padL + plotW} y={H - 8} textAnchor="end" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
            Vin = {vdd.toFixed(1)}V
          </text>
        </svg>
      </div>
    </div>
  );
}

export default MosfetCmosSimulator;
