"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { SimulatorProps } from "./registry";
import { getSimulatorById } from "@/data/simulators";
import {
  ATTENTION_PROMPT_PRESETS,
  runScaledDotProductAttention,
  type PositionalEncodingMode,
} from "@/lib/simulators/transformerAttention";

export function TransformerAttentionLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const meta = getSimulatorById("transformer-attention");
  const goalText = challengeGoal ?? meta?.challengeDescription;

  const [prompt, setPrompt] = useState(ATTENTION_PROMPT_PRESETS[0].prompt);
  const [dk, setDk] = useState(64);
  const [selectedHead, setSelectedHead] = useState(0);
  const [useScaling, setUseScaling] = useState(true);
  const [temperature, setTemperature] = useState(1.0);
  const [causalMask, setCausalMask] = useState(true);
  const [posEncoding, setPosEncoding] =
    useState<PositionalEncodingMode>("rope");
  const [selectedQueryIdx, setSelectedQueryIdx] = useState(0);

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const completedRef = useRef(false);

  const result = useMemo(
    () =>
      runScaledDotProductAttention({
        prompt,
        dk,
        numHeads: 4,
        selectedHead,
        useScaling,
        temperature,
        causalMask,
        posEncoding,
      }),
    [prompt, dk, selectedHead, useScaling, temperature, causalMask, posEncoding]
  );

  const safeQueryIdx = Math.min(selectedQueryIdx, result.tokens.length - 1);
  const activeHead = result.activeHead;
  const queryDistribution = activeHead.attentionWeights[safeQueryIdx] ?? [];

  // Challenge: observe how removing 1/sqrt(dk) scaling saturates softmax into near-one-hot
  useEffect(() => {
    const solved =
      !useScaling && dk >= 32 && activeHead.meanMaxWeight >= 0.72;
    if (solved && !completedRef.current) {
      completedRef.current = true;
      setChallengeCompleted(true);
      onChallengeComplete?.();
    }
  }, [useScaling, dk, activeHead.meanMaxWeight, onChallengeComplete]);

  function handleReset() {
    setPrompt(ATTENTION_PROMPT_PRESETS[0].prompt);
    setDk(64);
    setSelectedHead(0);
    setUseScaling(true);
    setTemperature(1.0);
    setCausalMask(true);
    setPosEncoding("rope");
    setSelectedQueryIdx(0);
  }

  return (
    <div className="swiss-card p-5 text-[var(--text-primary)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Self-Attention · Softmax(QKᵀ / √dₖ) V
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            {meta?.title ?? "Scaled Dot-Product Attention Visualizer"}
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

      {/* Prompt & Controls */}
      <div className="grid gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-6">
          <div className="text-xs font-semibold">Token Prompt</div>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Enter space-separated tokens..."
            className="w-full rounded border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {ATTENTION_PROMPT_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPrompt(p.prompt)}
                className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                  prompt === p.prompt
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:col-span-6">
          <div>
            <div className="flex justify-between text-xs">
              <span>Head Dim (dₖ)</span>
              <span className="font-mono swiss-tabular">{dk}</span>
            </div>
            <input
              type="range"
              min={4}
              max={64}
              step={4}
              value={dk}
              onChange={(e) => setDk(Number(e.target.value))}
              className="mt-1 w-full accent-[var(--accent-blue)]"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs">
              <span>Temperature (τ)</span>
              <span className="font-mono swiss-tabular">
                {temperature.toFixed(2)}
              </span>
            </div>
            <input
              type="range"
              min={0.2}
              max={2.5}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(Number(e.target.value))}
              className="mt-1 w-full accent-[var(--accent-blue)]"
            />
          </div>

          <div className="col-span-2 flex flex-wrap items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={useScaling}
                onChange={(e) => setUseScaling(e.target.checked)}
              />
              <span className="font-mono">1 / √dₖ Scaling</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={causalMask}
                onChange={(e) => setCausalMask(e.target.checked)}
              />
              <span className="font-mono">Causal Mask (j &gt; i → −∞)</span>
            </label>

            <div className="flex items-center gap-1 font-mono">
              <span className="text-[var(--text-muted)]">Pos:</span>
              {(["rope", "sinusoidal", "none"] as PositionalEncodingMode[]).map(
                (mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPosEncoding(mode)}
                    className={`rounded border px-1.5 py-0.5 text-[11px] ${
                      posEncoding === mode
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                        : "border-[var(--border-subtle)]"
                    }`}
                  >
                    {mode}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Head Selector & Entropy Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-xs text-[var(--text-muted)]">
            Head:
          </span>
          {result.heads.map((h) => (
            <button
              key={h.headIndex}
              type="button"
              onClick={() => setSelectedHead(h.headIndex)}
              className={`rounded border px-2 py-0.5 font-mono text-xs ${
                selectedHead === h.headIndex
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-surface)]"
              }`}
            >
              H{h.headIndex + 1}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-4 font-mono text-xs swiss-tabular">
          <span>
            Scale: <strong>{result.scaleFactor.toFixed(3)}</strong>
          </span>
          <span>
            Mean Entropy:{" "}
            <strong
              className={
                activeHead.meanEntropyBits < 0.7
                  ? "text-[var(--accent-amber)]"
                  : "text-[var(--accent-emerald)]"
              }
            >
              {activeHead.meanEntropyBits.toFixed(2)} bits
            </strong>
          </span>
          <span>
            Mean Max Weight:{" "}
            <strong
              className={
                activeHead.meanMaxWeight > 0.7
                  ? "text-[var(--accent-crimson)]"
                  : "text-[var(--text-primary)]"
              }
            >
              {(activeHead.meanMaxWeight * 100).toFixed(1)}%
            </strong>
          </span>
        </div>
      </div>

      {/* Heatmap Matrix + Per-Token Distribution */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Attention Weight Matrix */}
        <div className="overflow-x-auto rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 lg:col-span-7">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold">
              Attention Matrix (Click row to inspect Query token)
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              Rows = Query (i), Cols = Key (j)
            </span>
          </div>

          <table className="border-collapse font-mono text-[11px] swiss-tabular">
            <thead>
              <tr>
                <th className="p-1 text-left text-[var(--text-muted)]">Q \ K</th>
                {result.tokens.map((tok, j) => (
                  <th
                    key={`${tok}-${j}`}
                    className="min-w-[44px] p-1 text-center font-medium text-[var(--text-secondary)]"
                  >
                    {tok}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.tokens.map((qTok, i) => {
                const isSelected = i === safeQueryIdx;
                return (
                  <tr
                    key={`${qTok}-${i}`}
                    onClick={() => setSelectedQueryIdx(i)}
                    className={`cursor-pointer ${
                      isSelected ? "ring-1 ring-[var(--accent-amber)]" : ""
                    }`}
                  >
                    <td className="p-1 pr-2 font-semibold text-[var(--text-primary)]">
                      {qTok}
                    </td>
                    {activeHead.attentionWeights[i].map((w, j) => {
                      const masked = causalMask && j > i;
                      const alpha = Math.min(1, Math.max(0.05, w));
                      return (
                        <td
                          key={j}
                          title={`Q[${qTok}] → K[${result.tokens[j]}]: weight=${w.toFixed(3)}, raw QKᵀ=${activeHead.rawScores[i][j].toFixed(2)}`}
                          style={
                            masked
                              ? undefined
                              : {
                                  backgroundColor: `rgba(37, 99, 235, ${alpha.toFixed(2)})`,
                                  color: w > 0.48 ? "#ffffff" : "var(--text-primary)",
                                }
                          }
                          className={`border border-[var(--border-subtle)] p-1 text-center ${
                            masked
                              ? "bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                              : ""
                          }`}
                        >
                          {masked ? "−∞" : w.toFixed(2)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Query Token Softmax Distribution */}
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 lg:col-span-5">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-2">
            <div>
              <div className="text-xs font-semibold">
                Query Distribution: &ldquo;{result.tokens[safeQueryIdx]}&rdquo;
              </div>
              <div className="font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
                Row Entropy: {activeHead.rowEntropiesBits[safeQueryIdx]?.toFixed(3)} bits
              </div>
            </div>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              ∑p = {queryDistribution.reduce((a, b) => a + b, 0).toFixed(2)}
            </span>
          </div>

          <div className="mt-3 space-y-2">
            {result.tokens.map((kTok, j) => {
              const p = queryDistribution[j] ?? 0;
              const raw = activeHead.rawScores[safeQueryIdx]?.[j] ?? 0;
              const masked = causalMask && j > safeQueryIdx;
              return (
                <div key={`${kTok}-${j}`} className="space-y-0.5">
                  <div className="flex justify-between font-mono text-xs swiss-tabular">
                    <span>
                      {kTok}{" "}
                      <span className="text-[10px] text-[var(--text-muted)]">
                        (QKᵀ={raw.toFixed(2)})
                      </span>
                    </span>
                    <span>{masked ? "masked (0.000)" : `${(p * 100).toFixed(1)}%`}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded bg-[var(--bg-subtle)]">
                    <div
                      className="h-full bg-[var(--accent-blue)] transition-all"
                      style={{ width: `${(p * 100).toFixed(1)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
