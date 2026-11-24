"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  FastForward,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  getDefaultPipelineSequence,
  simulatePipeline,
  type BranchPredictorMode,
  type PipelineStage,
} from "@/lib/simulators/pipelineHazard";

export function PipelineHazardSimulator({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const instructions = useMemo(() => getDefaultPipelineSequence(), []);

  const [exToExForwarding, setExToExForwarding] = useState(false);
  const [memToExForwarding, setMemToExForwarding] = useState(false);
  const [branchPredictor, setBranchPredictor] =
    useState<BranchPredictorMode>("always-not-taken");
  const [visibleCycle, setVisibleCycle] = useState(5);
  const [playing, setPlaying] = useState(false);

  const completedRef = useRef(false);

  const baseline = useMemo(
    () =>
      simulatePipeline(instructions, {
        exToExForwarding: false,
        memToExForwarding: false,
        branchPredictor: "always-not-taken",
      }),
    [instructions]
  );

  const sim = useMemo(
    () =>
      simulatePipeline(instructions, {
        exToExForwarding,
        memToExForwarding,
        branchPredictor,
      }),
    [instructions, exToExForwarding, memToExForwarding, branchPredictor]
  );

  const clampedVisible = Math.min(visibleCycle, sim.totalCycles);

  const challengeMet =
    exToExForwarding &&
    branchPredictor === "two-bit" &&
    sim.totalCycles < baseline.totalCycles &&
    clampedVisible >= sim.totalCycles;

  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  useEffect(() => {
    if (!playing) return;
    if (clampedVisible >= sim.totalCycles) {
      setPlaying(false);
      return;
    }
    const id = window.setInterval(() => {
      setVisibleCycle((c) => {
        if (c + 1 >= sim.totalCycles) {
          setPlaying(false);
          return sim.totalCycles;
        }
        return c + 1;
      });
    }, 240);
    return () => window.clearInterval(id);
  }, [playing, clampedVisible, sim.totalCycles]);

  const stageClass = (stage: PipelineStage | null) => {
    switch (stage) {
      case "IF":
        return "bg-[var(--bg-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]";
      case "ID":
        return "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)] border-[var(--accent-blue)]";
      case "EX":
        return "bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] border-[var(--accent-emerald)]";
      case "MEM":
        return "bg-[var(--bg-muted)] text-[var(--text-primary)] border-[var(--border-strong)]";
      case "WB":
        return "bg-[var(--bg-surface)] text-[var(--text-primary)] border-[var(--border-strong)] font-bold";
      case "STALL":
        return "bg-[var(--accent-amber-soft)] text-[var(--accent-amber)] border-[var(--accent-amber)] font-bold";
      case "FLUSH":
        return "bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)] border-[var(--accent-crimson)] font-bold";
      default:
        return "border-transparent";
    }
  };

  const handleReset = () => {
    setPlaying(false);
    setExToExForwarding(false);
    setMemToExForwarding(false);
    setBranchPredictor("always-not-taken");
    setVisibleCycle(5);
  };

  const speedupPct =
    baseline.totalCycles > 0
      ? ((baseline.totalCycles - sim.totalCycles) / baseline.totalCycles) * 100
      : 0;

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 08 · Pipelining &amp; Hazards
          </p>
          <h3 className="text-lg font-semibold">5-Stage Pipeline &amp; Hazard Visualizer</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {challengeMet && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setVisibleCycle((c) => Math.min(sim.totalCycles, c + 1));
            }}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs"
          >
            <StepForward className="h-3.5 w-3.5" /> Step Cycle
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="inline-flex items-center gap-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)]"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : "Animate"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setVisibleCycle(sim.totalCycles);
            }}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs"
          >
            <FastForward className="h-3.5 w-3.5" /> Run All
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Goal: </strong>
          {challengeGoal}
        </div>
      )}

      {/* Hazard & Predictor Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-1.5 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={exToExForwarding}
              onChange={(e) => {
                setExToExForwarding(e.target.checked);
                setVisibleCycle(sim.totalCycles);
              }}
            />
            EX → EX Forwarding
          </label>
          <label className="inline-flex items-center gap-1.5 font-medium cursor-pointer">
            <input
              type="checkbox"
              checked={memToExForwarding}
              onChange={(e) => {
                setMemToExForwarding(e.target.checked);
                setVisibleCycle(sim.totalCycles);
              }}
            />
            MEM → EX Forwarding
          </label>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="text-[var(--text-muted)]">Branch Predictor:</span>
          <select
            value={branchPredictor}
            onChange={(e) => {
              setBranchPredictor(e.target.value as BranchPredictorMode);
              setVisibleCycle(sim.totalCycles);
            }}
            className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1 text-xs"
          >
            <option value="always-not-taken">Always-Not-Taken</option>
            <option value="two-bit">2-Bit Saturating BHT</option>
          </select>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 font-mono text-xs swiss-tabular">
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] text-[var(--text-muted)]">Total Cycles</div>
          <div className="text-sm font-bold text-[var(--accent-blue)]">
            {sim.totalCycles}{" "}
            <span className="text-[10px] font-normal text-[var(--text-muted)]">
              (base {baseline.totalCycles})
            </span>
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] text-[var(--text-muted)]">CPI</div>
          <div className="text-sm font-bold">{sim.cpi.toFixed(2)}</div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] text-[var(--text-muted)]">Stall Bubbles</div>
          <div className="text-sm font-bold text-[var(--accent-amber)]">
            {sim.stallCycles}
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] text-[var(--text-muted)]">Mispred / Flushes</div>
          <div className="text-sm font-bold text-[var(--accent-crimson)]">
            {sim.branchMispredictions} ({sim.flushCycles} cyc)
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] text-[var(--text-muted)]">Cycle Reduction</div>
          <div className="text-sm font-bold text-[var(--accent-emerald)]">
            {speedupPct.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Cycle-by-Stage Grid Diagram */}
      <div className="rounded border border-[var(--border-subtle)] overflow-x-auto">
        <table className="w-full border-collapse font-mono text-[10.5] swiss-tabular">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]">
              <th className="py-1.5 px-2.5 text-left sticky left-0 bg-[var(--bg-subtle)] min-w-[155px]">
                Instruction
              </th>
              {Array.from({ length: clampedVisible }, (_, c) => (
                <th key={c} className="py-1.5 px-1 text-center min-w-[34px]">
                  C{c + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sim.instructions.map((instr, iIdx) => (
              <tr key={instr.id} className="border-b border-[var(--border-subtle)]">
                <td className="py-1 px-2.5 text-left sticky left-0 bg-[var(--bg-surface)] border-r border-[var(--border-subtle)] whitespace-nowrap font-medium">
                  <span className="text-[var(--text-muted)] mr-1.5">#{iIdx}</span>
                  {instr.text}
                </td>
                {Array.from({ length: clampedVisible }, (_, cIdx) => {
                  const stage = sim.timeline[iIdx]?.[cIdx] ?? null;
                  return (
                    <td key={cIdx} className="p-0.5 text-center">
                      {stage && (
                        <div
                          className={`rounded border py-0.5 text-[10px] ${stageClass(
                            stage
                          )}`}
                        >
                          {stage === "STALL" ? "STL" : stage === "FLUSH" ? "FLS" : stage}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Hazard & Forwarding Event Log */}
      <div className="rounded border border-[var(--border-subtle)] p-3 max-h-36 overflow-y-auto font-mono text-[11px] space-y-1">
        <div className="font-sans text-xs font-semibold mb-1">
          Detected Hazard &amp; Forwarding Events ({sim.hazards.filter((h) => h.cycle < clampedVisible).length})
        </div>
        {sim.hazards
          .filter((h) => h.cycle < clampedVisible)
          .slice(-10)
          .map((h, idx) => (
            <div key={idx} className="flex items-center gap-2.5">
              <span className="text-[var(--text-muted)] w-10">C{h.cycle + 1}</span>
              <span
                className={`w-28 font-semibold ${
                  h.kind === "EX->EX" || h.kind === "MEM->EX"
                    ? "text-[var(--accent-emerald)]"
                    : h.kind === "BRANCH-FLUSH"
                    ? "text-[var(--accent-crimson)]"
                    : "text-[var(--accent-amber)]"
                }`}
              >
                {h.kind}
              </span>
              <span className="text-[var(--text-secondary)]">{h.description}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default PipelineHazardSimulator;
