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
import { getSimulatorById } from "@/data/simulators";
import {
  createMlpState,
  sampleDecisionBoundary,
  stepMlpEpoch,
  type ActivationType,
  type DatasetType,
  type MlpState,
} from "@/lib/simulators/neuralBackprop";

const CANVAS_SIZE = 260;

export function NeuralNetBackpropLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const meta = getSimulatorById("neural-backprop");
  const goalText = challengeGoal ?? meta?.challengeDescription;

  const [dataset, setDataset] = useState<DatasetType>("xor");
  const [activation, setActivation] = useState<ActivationType>("tanh");
  const [hiddenWidth, setHiddenWidth] = useState(4);
  const [learningRate, setLearningRate] = useState(0.4);
  const [l2Reg, setL2Reg] = useState(0.0005);
  const [training, setTraining] = useState(false);

  const [mlpState, setMlpState] = useState<MlpState>(() =>
    createMlpState({
      dataset: "xor",
      activation: "tanh",
      hiddenWidth: 4,
      learningRate: 0.4,
      l2Reg: 0.0005,
    })
  );
  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const completedRef = useRef(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Re-initialize only when architecture/dataset changes
  const resetModel = (
    nextDataset = dataset,
    nextAct = activation,
    nextWidth = hiddenWidth,
    nextLr = learningRate,
    nextL2 = l2Reg
  ) => {
    setTraining(false);
    setMlpState(
      createMlpState({
        dataset: nextDataset,
        activation: nextAct,
        hiddenWidth: nextWidth,
        learningRate: nextLr,
        l2Reg: nextL2,
      })
    );
  };

  // Keep live learning rate / L2 synced into state config without wiping weights
  useEffect(() => {
    setMlpState((prev) => ({
      ...prev,
      config: {
        ...prev.config,
        learningRate,
        l2Reg,
      },
    }));
  }, [learningRate, l2Reg]);

  useEffect(() => {
    if (!training) return;
    const timer = window.setInterval(() => {
      setMlpState((prev) => stepMlpEpoch(prev, 4));
    }, 50);
    return () => window.clearInterval(timer);
  }, [training]);

  // Challenge: solve non-linear XOR or spiral (>= 92% accuracy and loss < 0.25)
  useEffect(() => {
    const solved =
      (mlpState.config.dataset === "xor" || mlpState.config.dataset === "spiral") &&
      mlpState.epoch >= 5 &&
      mlpState.lastAccuracy >= 0.92 &&
      mlpState.lastBatchLoss < 0.3;
    if (solved && !completedRef.current) {
      completedRef.current = true;
      setChallengeCompleted(true);
      onChallengeComplete?.();
    }
  }, [mlpState, onChallengeComplete]);

  const boundaryGrid = useMemo(
    () => sampleDecisionBoundary(mlpState, 52, -1.25, 1.25),
    [mlpState]
  );

  // Render 2D decision boundary + scatter points on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { resolution, minCoord, maxCoord, values } = boundaryGrid;
    const cellW = CANVAS_SIZE / resolution;
    const cellH = CANVAS_SIZE / resolution;

    for (let r = 0; r < resolution; r++) {
      for (let c = 0; c < resolution; c++) {
        const p = values[r * resolution + c];
        // Interpolate Amber (class 0) <-> Neutral <-> Cobalt Blue (class 1)
        const red = Math.round(217 * (1 - p) + 37 * p);
        const green = Math.round(119 * (1 - p) + 99 * p);
        const blue = Math.round(6 * (1 - p) + 235 * p);
        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.42)`;
        ctx.fillRect(c * cellW, r * cellH, Math.ceil(cellW), Math.ceil(cellH));
      }
    }

    // Subtle axes
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(CANVAS_SIZE / 2, 0);
    ctx.lineTo(CANVAS_SIZE / 2, CANVAS_SIZE);
    ctx.moveTo(0, CANVAS_SIZE / 2);
    ctx.lineTo(CANVAS_SIZE, CANVAS_SIZE / 2);
    ctx.stroke();

    // Data points
    const span = maxCoord - minCoord;
    for (const pt of mlpState.dataset) {
      const px = ((pt.x1 - minCoord) / span) * CANVAS_SIZE;
      const py = ((maxCoord - pt.x2) / span) * CANVAS_SIZE;
      ctx.beginPath();
      ctx.arc(px, py, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = pt.label === 1 ? "#2563eb" : "#d97706";
      ctx.fill();
      ctx.lineWidth = 1.1;
      ctx.strokeStyle = "#ffffff";
      ctx.stroke();
    }
  }, [boundaryGrid, mlpState.dataset]);

  // SVG Loss Curve path
  const lossPolyline = useMemo(() => {
    const pts = mlpState.lossHistory;
    if (pts.length < 2) return "";
    const maxLoss = Math.max(0.8, ...pts.map((p) => p.loss));
    const w = 260;
    const h = 76;
    return pts
      .map((p, idx) => {
        const x = (idx / Math.max(1, pts.length - 1)) * w;
        const y = h - Math.min(1, p.loss / maxLoss) * (h - 8) - 4;
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [mlpState.lossHistory]);

  const hiddenCount = mlpState.config.hiddenWidth;
  const grads = mlpState.lastTrace.gradients;

  return (
    <div className="swiss-card p-5 text-[var(--text-primary)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Reverse-Mode Autodiff · 2 → {hiddenCount} → 1 MLP
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            {meta?.title ?? "Computation Graph & Backprop Playground"}
          </h3>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setTraining((t) => !t)}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-blue)]"
          >
            {training ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {training ? "Pause" : "Train"}
          </button>
          <button
            type="button"
            onClick={() => {
              setTraining(false);
              setMlpState((prev) => stepMlpEpoch(prev, 1));
            }}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-muted)]"
          >
            <StepForward className="h-3.5 w-3.5" />
            Step 1 Epoch
          </button>
          <button
            type="button"
            onClick={() => resetModel()}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-subtle)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
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

      {/* Main Grid */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: 2D Decision Boundary + Loss Curve */}
        <div className="space-y-3 lg:col-span-5">
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-semibold">2D Decision Boundary</span>
              <span className="font-mono swiss-tabular text-[var(--text-muted)]">
                Epoch {mlpState.epoch}
              </span>
            </div>
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="rounded border border-[var(--border-strong)]"
              />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2 font-mono text-xs swiss-tabular">
              <div>
                <div className="text-[10px] uppercase text-[var(--text-muted)]">
                  BCE Loss
                </div>
                <div className="font-semibold">
                  {mlpState.lastBatchLoss.toFixed(4)}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[var(--text-muted)]">
                  Accuracy
                </div>
                <div className="font-semibold text-[var(--accent-emerald)]">
                  {(mlpState.lastAccuracy * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>

          {/* Epoch Loss Curve */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="font-semibold">Epoch Loss Curve</span>
              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                L = BCE + ½λ‖W‖²
              </span>
            </div>
            <svg
              viewBox="0 0 260 76"
              className="h-20 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
            >
              {lossPolyline && (
                <polyline
                  fill="none"
                  stroke="var(--accent-blue)"
                  strokeWidth="2"
                  points={lossPolyline}
                />
              )}
            </svg>
          </div>
        </div>

        {/* Right: Hyperparameters & Computation Graph Weights/Gradients */}
        <div className="space-y-3 lg:col-span-7">
          {/* Controls */}
          <div className="grid gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 sm:grid-cols-2">
            <div>
              <div className="text-xs font-semibold">Dataset</div>
              <div className="mt-1.5 flex gap-1">
                {(["xor", "circle", "spiral"] as DatasetType[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDataset(d);
                      resetModel(d, activation, hiddenWidth, learningRate, l2Reg);
                    }}
                    className={`flex-1 rounded border px-2 py-1 font-mono text-xs uppercase ${
                      dataset === d
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold">Hidden Activation</div>
              <div className="mt-1.5 flex gap-1">
                {(["tanh", "relu", "sigmoid"] as ActivationType[]).map((fn) => (
                  <button
                    key={fn}
                    type="button"
                    onClick={() => {
                      setActivation(fn);
                      resetModel(dataset, fn, hiddenWidth, learningRate, l2Reg);
                    }}
                    className={`flex-1 rounded border px-2 py-1 font-mono text-xs ${
                      activation === fn
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {fn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span>Hidden Width</span>
                <span className="font-mono swiss-tabular">{hiddenWidth} units</span>
              </div>
              <input
                type="range"
                min={2}
                max={8}
                step={1}
                value={hiddenWidth}
                onChange={(e) => {
                  const w = Number(e.target.value);
                  setHiddenWidth(w);
                  resetModel(dataset, activation, w, learningRate, l2Reg);
                }}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span>Learning Rate (η)</span>
                <span className="font-mono swiss-tabular">
                  {learningRate.toFixed(2)}
                </span>
              </div>
              <input
                type="range"
                min={0.02}
                max={1.2}
                step={0.02}
                value={learningRate}
                onChange={(e) => setLearningRate(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex justify-between text-xs">
                <span>L2 Weight Decay (λ)</span>
                <span className="font-mono swiss-tabular">
                  {l2Reg.toFixed(4)}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={0.02}
                step={0.0005}
                value={l2Reg}
                onChange={(e) => setL2Reg(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          {/* Computation Graph & Exact Gradients Table */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold">
                Hidden Layer Parameters &amp; Analytical Gradients (∂L/∂W)
              </span>
              <span className="font-mono text-[11px] text-[var(--text-muted)] swiss-tabular">
                ∂L/∂b₂ = {grads.db2.toFixed(4)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse font-mono text-[11px] swiss-tabular">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-left text-[var(--text-muted)]">
                    <th className="py-1 pr-2">Unit</th>
                    <th className="py-1 pr-2">W1[0], W1[1]</th>
                    <th className="py-1 pr-2">∂L/∂W1</th>
                    <th className="py-1 pr-2">W2</th>
                    <th className="py-1">∂L/∂W2</th>
                  </tr>
                </thead>
                <tbody>
                  {mlpState.weights.w2.map((w2, h) => (
                    <tr
                      key={h}
                      className="border-b border-[var(--border-subtle)] last:border-0"
                    >
                      <td className="py-1 pr-2 font-semibold text-[var(--accent-blue)]">
                        h{h + 1}
                      </td>
                      <td className="py-1 pr-2">
                        {mlpState.weights.w1[h][0].toFixed(2)},{" "}
                        {mlpState.weights.w1[h][1].toFixed(2)}
                      </td>
                      <td className="py-1 pr-2 text-[var(--text-secondary)]">
                        {grads.dW1[h][0].toFixed(3)}, {grads.dW1[h][1].toFixed(3)}
                      </td>
                      <td className="py-1 pr-2">{w2.toFixed(3)}</td>
                      <td
                        className={`py-1 ${
                          Math.abs(grads.dW2[h]) < 1e-4
                            ? "text-[var(--accent-amber)]"
                            : "text-[var(--text-primary)]"
                        }`}
                      >
                        {grads.dW2[h].toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
