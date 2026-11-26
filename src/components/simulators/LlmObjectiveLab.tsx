"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, RotateCcw } from "lucide-react";
import type { SimulatorProps } from "./registry";
import { getSimulatorById } from "@/data/simulators";
import {
  computeChinchillaScaling,
  evaluateLlmObjective,
} from "@/lib/simulators/llmObjective";

export function LlmObjectiveLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const meta = getSimulatorById("llm-training-objective");
  const goalText = challengeGoal ?? meta?.challengeDescription;

  // Policy & Reward Objective sliders
  const [pThetaA, setPThetaA] = useState(0.5);
  const [pRefA, setPRefA] = useState(0.5);
  const [rewardA, setRewardA] = useState(1.0);
  const [rewardB, setRewardB] = useState(2.0);
  const [beta, setBeta] = useState(0.25);

  // Chinchilla scaling law sliders
  const [log10Flops, setLog10Flops] = useState(23.0);
  const [paramsBillions, setParamsBillions] = useState(15);

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const completedRef = useRef(false);

  const obj = useMemo(
    () =>
      evaluateLlmObjective({
        pThetaA,
        pRefA,
        rewardA,
        rewardB,
        beta,
      }),
    [pThetaA, pRefA, rewardA, rewardB, beta]
  );

  const scaling = useMemo(
    () =>
      computeChinchillaScaling({
        log10Flops,
        paramsBillions,
      }),
    [log10Flops, paramsBillions]
  );

  // Challenge: hit Chinchilla ~20 tok/param frontier AND positive DPO margin without KL collapse
  useEffect(() => {
    const solved =
      scaling.isNearOptimal &&
      obj.dpoPreferenceMargin > 0.2 &&
      obj.klDivergenceNats < 0.6;
    if (solved && !completedRef.current) {
      completedRef.current = true;
      setChallengeCompleted(true);
      onChallengeComplete?.();
    }
  }, [scaling.isNearOptimal, obj.dpoPreferenceMargin, obj.klDivergenceNats, onChallengeComplete]);

  function handleReset() {
    setPThetaA(0.5);
    setPRefA(0.5);
    setRewardA(1.0);
    setRewardB(2.0);
    setBeta(0.25);
    setLog10Flops(23.0);
    setParamsBillions(15);
  }

  // SVG Curve for Expected Reward vs KL-Regularized RLHF Objective
  const { rewardPath, rlhfPath } = useMemo(() => {
    const w = 280;
    const h = 110;
    const minY = -3.5;
    const maxY = 3.5;
    const toY = (val: number) => {
      const clamped = Math.max(minY, Math.min(maxY, val));
      return h - ((clamped - minY) / (maxY - minY)) * (h - 12) - 6;
    };
    const toX = (p: number) => p * w;

    const rPts = obj.curve
      .map((pt) => `${toX(pt.p).toFixed(1)},${toY(pt.expectedReward).toFixed(1)}`)
      .join(" ");
    const rlPts = obj.curve
      .map((pt) => `${toX(pt.p).toFixed(1)},${toY(pt.rlhfObjective).toFixed(1)}`)
      .join(" ");
    return { rewardPath: rPts, rlhfPath: rlPts };
  }, [obj.curve]);

  return (
    <div className="swiss-card p-5 text-[var(--text-primary)] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Post-Training &amp; Scaling · NLL vs RLHF/DPO &amp; Chinchilla
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            {meta?.title ?? "LLM Pretraining, Scaling Laws & DPO Lab"}
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

      {/* Section 1: NLL vs RLHF / DPO Reward Objective */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="space-y-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 lg:col-span-6">
          <div className="text-xs font-semibold">
            1. Policy Probabilities, Rewards &amp; KL Penalty
          </div>

          <SliderRow
            label="Policy Prob p_θ(A)"
            valueDisplay={`${pThetaA.toFixed(2)} (B=${(1 - pThetaA).toFixed(2)})`}
            min={0.01}
            max={0.99}
            step={0.01}
            value={pThetaA}
            onChange={setPThetaA}
          />
          <SliderRow
            label="Reference Prob p_ref(A)"
            valueDisplay={`${pRefA.toFixed(2)}`}
            min={0.01}
            max={0.99}
            step={0.01}
            value={pRefA}
            onChange={setPRefA}
          />
          <div className="grid grid-cols-2 gap-3">
            <SliderRow
              label="Reward r(A)"
              valueDisplay={rewardA.toFixed(1)}
              min={-3}
              max={3}
              step={0.1}
              value={rewardA}
              onChange={setRewardA}
            />
            <SliderRow
              label="Reward r(B)"
              valueDisplay={rewardB.toFixed(1)}
              min={-3}
              max={3}
              step={0.1}
              value={rewardB}
              onChange={setRewardB}
            />
          </div>
          <SliderRow
            label="KL Penalty (β)"
            valueDisplay={beta.toFixed(2)}
            min={0}
            max={2}
            step={0.05}
            value={beta}
            onChange={setBeta}
          />

          {obj.policyRewardDisagreement && (
            <div className="flex items-start gap-2 rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] px-2.5 py-2 text-xs text-[var(--text-primary)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-amber)]" />
              <span>
                <strong>Policy-Reward Misalignment:</strong> Highest-reward
                response is <strong>{obj.chosenCandidate}</strong>, but the
                model&apos;s most probable output is{" "}
                <strong>{obj.mostProbableCandidate}</strong>.
              </span>
            </div>
          )}
        </div>

        {/* Right: Metrics + Objective Curve */}
        <div className="space-y-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 lg:col-span-6">
          <div className="grid grid-cols-2 gap-2 font-mono text-xs swiss-tabular sm:grid-cols-3">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Pretrain / SFT NLL(A)
              </div>
              <div className="font-semibold text-[var(--accent-blue)]">
                {obj.nllBitsA.toFixed(2)} bits
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                {obj.nllNatsA.toFixed(2)} nats
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Expected E[r]
              </div>
              <div className="font-semibold">
                {obj.expectedReward.toFixed(3)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                KL = {obj.klDivergenceNats.toFixed(3)} nats
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                RLHF J(θ)
              </div>
              <div className="font-semibold text-[var(--accent-emerald)]">
                {obj.rlhfObjective.toFixed(3)}
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                p*(A) = {obj.optimalPolicyProbA.toFixed(2)}
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                DPO Margin
              </div>
              <div
                className={`font-semibold ${
                  obj.dpoPreferenceMargin >= 0
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-crimson)]"
                }`}
              >
                {obj.dpoPreferenceMargin.toFixed(3)}
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                DPO Loss
              </div>
              <div className="font-semibold">{obj.dpoLoss.toFixed(3)}</div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Policy Entropy
              </div>
              <div className="font-semibold">
                {obj.policyEntropyBits.toFixed(2)} bits
              </div>
            </div>
          </div>

          {/* Objective Curve */}
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span className="font-semibold">
                RLHF Objective vs Expected Reward across p_θ(A)
              </span>
              <span className="font-mono text-[10px] text-[var(--text-muted)]">
                Blue: E[r] · Emerald: E[r] − β·KL
              </span>
            </div>
            <svg
              viewBox="0 0 280 110"
              className="h-28 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
            >
              <line
                x1="0"
                y1="55"
                x2="280"
                y2="55"
                stroke="var(--border-strong)"
                strokeDasharray="3 3"
              />
              <polyline
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth="1.8"
                points={rewardPath}
              />
              <polyline
                fill="none"
                stroke="var(--accent-emerald)"
                strokeWidth="2"
                points={rlhfPath}
              />
              <line
                x1={(pThetaA * 280).toFixed(1)}
                y1="4"
                x2={(pThetaA * 280).toFixed(1)}
                y2="106"
                stroke="var(--accent-amber)"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* Section 2: Chinchilla Compute-Optimal Scaling */}
      <section className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h4 className="text-sm font-semibold">
              2. Chinchilla Compute-Optimal Scaling (C = 6·N·D)
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Allocate fixed FLOPs between Parameters (N) and Training Tokens (D).
            </p>
          </div>
          <span
            className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold ${
              scaling.isNearOptimal
                ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                : "border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] text-[var(--accent-amber)]"
            }`}
          >
            {scaling.tokensPerParam.toFixed(1)} tok/param{" "}
            {scaling.isNearOptimal ? "(Near Chinchilla ~20:1)" : "(Off Frontier)"}
          </span>
        </div>

        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <SliderRow
            label="Compute Budget (10^x FLOPs)"
            valueDisplay={`10^${log10Flops.toFixed(1)} FLOPs`}
            min={20}
            max={25}
            step={0.5}
            value={log10Flops}
            onChange={setLog10Flops}
          />
          <SliderRow
            label="Model Parameters (N)"
            valueDisplay={`${paramsBillions.toFixed(1)} B`}
            min={1}
            max={200}
            step={1}
            value={paramsBillions}
            onChange={setParamsBillions}
          />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 font-mono text-xs swiss-tabular sm:grid-cols-4">
          <div>
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Tokens (D)
            </div>
            <div className="font-semibold">
              {(scaling.tokensD / 1e9).toFixed(1)} B
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Predicted Loss
            </div>
            <div className="font-semibold">
              {scaling.predictedLoss.toFixed(3)}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Optimal N* / D*
            </div>
            <div className="font-semibold text-[var(--accent-blue)]">
              {scaling.optimalParamsBillions.toFixed(1)}B /{" "}
              {scaling.optimalTokensBillions.toFixed(0)}B
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Frontier Loss L*
            </div>
            <div className="font-semibold text-[var(--accent-emerald)]">
              {scaling.optimalLoss.toFixed(3)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function SliderRow({
  label,
  valueDisplay,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueDisplay: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-mono swiss-tabular">{valueDisplay}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--accent-blue)]"
      />
    </div>
  );
}
