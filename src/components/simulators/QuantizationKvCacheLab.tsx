"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw } from "lucide-react";
import type { SimulatorProps } from "./registry";
import { getSimulatorById } from "@/data/simulators";
import {
  computeLlmCapacityAndRoofline,
  generateSampleWeights,
  LLM_PRESETS,
  quantizeWeights,
  type KvCacheFormat,
  type WeightQuantFormat,
} from "@/lib/simulators/quantizationKvCache";

const FORMAT_OPTIONS: Array<{ id: WeightQuantFormat; label: string }> = [
  { id: "FP32", label: "FP32" },
  { id: "FP16", label: "FP16" },
  { id: "BF16", label: "BF16" },
  { id: "INT8_SYM", label: "INT8 Sym" },
  { id: "INT8_ASYM", label: "INT8 Asym" },
  { id: "INT4_GROUP", label: "INT4 Group" },
];

export function QuantizationKvCacheLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const meta = getSimulatorById("quantization-kv");
  const goalText = challengeGoal ?? meta?.challengeDescription;

  const [presetId, setPresetId] = useState("llama3-70b");
  const [paramsBillions, setParamsBillions] = useState(70);
  const [numLayers, setNumLayers] = useState(80);
  const [numQueryHeads, setNumQueryHeads] = useState(64);
  const [numKvHeads, setNumKvHeads] = useState(8);
  const [headDim, setHeadDim] = useState(128);
  const [seqLen, setSeqLen] = useState(32768);
  const [batchSize, setBatchSize] = useState(1);
  const [weightFormat, setWeightFormat] = useState<WeightQuantFormat>("FP16");
  const [kvFormat, setKvFormat] = useState<KvCacheFormat>("FP16");
  const [includeOutliers, setIncludeOutliers] = useState(true);
  const [groupSize, setGroupSize] = useState(32);

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const completedRef = useRef(false);

  const sampleWeights = useMemo(
    () => generateSampleWeights(256, includeOutliers, 2025),
    [includeOutliers]
  );

  const quantMetrics = useMemo(
    () => quantizeWeights(sampleWeights, weightFormat, groupSize),
    [sampleWeights, weightFormat, groupSize]
  );

  const capacity = useMemo(
    () =>
      computeLlmCapacityAndRoofline({
        paramsBillions,
        numLayers,
        numQueryHeads,
        numKvHeads,
        headDim,
        seqLen,
        batchSize,
        weightFormat,
        kvFormat,
        hbmLimitGb: 80,
        gpuTflopsFp16: 989,
        gpuBandwidthGbs: 3350,
      }),
    [
      paramsBillions,
      numLayers,
      numQueryHeads,
      numKvHeads,
      headDim,
      seqLen,
      batchSize,
      weightFormat,
      kvFormat,
    ]
  );

  // Challenge: fit 70B-class model at >= 32k context within 80 GB HBM
  useEffect(() => {
    const solved =
      paramsBillions >= 65 &&
      seqLen >= 32768 &&
      capacity.fitsInHbm &&
      capacity.gqaCompressionRatio >= 2;
    if (solved && !completedRef.current) {
      completedRef.current = true;
      setChallengeCompleted(true);
      onChallengeComplete?.();
    }
  }, [paramsBillions, seqLen, capacity, onChallengeComplete]);

  function applyPreset(id: string) {
    const p = LLM_PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(p.id);
    setParamsBillions(p.paramsBillions);
    setNumLayers(p.numLayers);
    setNumQueryHeads(p.numQueryHeads);
    setNumKvHeads(p.numKvHeads);
    setHeadDim(p.headDim);
  }

  function handleReset() {
    applyPreset("llama3-70b");
    setSeqLen(32768);
    setBatchSize(1);
    setWeightFormat("FP16");
    setKvFormat("FP16");
    setIncludeOutliers(true);
    setGroupSize(32);
  }

  const maxBinCount = Math.max(
    1,
    ...quantMetrics.histogramBins.map((b) =>
      Math.max(b.originalCount, b.quantizedCount)
    )
  );

  const totalBarScale = Math.max(80, capacity.totalHbmGb);
  const weightPct = (capacity.weightGb / totalBarScale) * 100;
  const kvPct = (capacity.kvCacheGb / totalBarScale) * 100;
  const actPct = (capacity.activationOverheadGb / totalBarScale) * 100;
  const limitPct = (80 / totalBarScale) * 100;

  return (
    <div className="swiss-card p-5 text-[var(--text-primary)] space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            LLM Inference Systems · Quantization &amp; Roofline Capacity Planner
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            {meta?.title ?? "KV-Cache & Quantization Memory Calculator"}
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

      {/* Top Controls: Model Presets & Bit-Widths */}
      <div className="grid gap-4 lg:grid-cols-12">
        {/* Left: Capacity Planner Controls */}
        <div className="space-y-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 lg:col-span-6">
          <div className="text-xs font-semibold">Model &amp; Context Config</div>
          <div className="flex flex-wrap gap-1.5">
            {LLM_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id)}
                className={`rounded border px-2 py-1 font-mono text-[11px] ${
                  presetId === p.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <div className="flex justify-between text-xs">
                <span>Context (S)</span>
                <span className="font-mono swiss-tabular">
                  {seqLen.toLocaleString()}
                </span>
              </div>
              <input
                type="range"
                min={2048}
                max={65536}
                step={2048}
                value={seqLen}
                onChange={(e) => setSeqLen(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span>Batch Size (B)</span>
                <span className="font-mono swiss-tabular">{batchSize}</span>
              </div>
              <input
                type="range"
                min={1}
                max={32}
                step={1}
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span>KV Heads (n_kv)</span>
                <span className="font-mono swiss-tabular">
                  {numKvHeads} / {numQueryHeads} (GQA{" "}
                  {capacity.gqaCompressionRatio.toFixed(0)}:1)
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={numQueryHeads}
                step={1}
                value={numKvHeads}
                onChange={(e) => setNumKvHeads(Number(e.target.value))}
                className="mt-1 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs">
                <span>KV-Cache Precision</span>
              </div>
              <div className="mt-1 flex gap-1">
                {(["FP16", "FP8", "INT4"] as KvCacheFormat[]).map((kv) => (
                  <button
                    key={kv}
                    type="button"
                    onClick={() => setKvFormat(kv)}
                    className={`flex-1 rounded border px-2 py-1 font-mono text-[11px] ${
                      kvFormat === kv
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {kv}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold">Weight Quantization</div>
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-6">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setWeightFormat(f.id)}
                  className={`rounded border px-1.5 py-1 font-mono text-[11px] ${
                    weightFormat === f.id
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: HBM Footprint & Roofline Readouts */}
        <div className="space-y-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 lg:col-span-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold">
              80 GiB H100 HBM Footprint Breakdown
            </span>
            <span
              className={`rounded border px-2 py-0.5 font-mono text-xs font-semibold ${
                capacity.fitsInHbm
                  ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                  : "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]"
              }`}
            >
              {capacity.totalHbmGb.toFixed(1)} / 80.0 GiB (
              {capacity.fitsInHbm ? "FITS" : "OOM"})
            </span>
          </div>

          {/* Stacked HBM Bar with 80 GiB Marker */}
          <div className="relative h-7 w-full overflow-hidden rounded border border-[var(--border-strong)] bg-[var(--bg-subtle)]">
            <div className="flex h-full">
              <div
                style={{ width: `${weightPct}%` }}
                className="bg-[var(--accent-blue)]"
                title={`Weights: ${capacity.weightGb.toFixed(2)} GiB`}
              />
              <div
                style={{ width: `${kvPct}%` }}
                className="bg-[var(--accent-amber)]"
                title={`KV Cache: ${capacity.kvCacheGb.toFixed(2)} GiB`}
              />
              <div
                style={{ width: `${actPct}%` }}
                className="bg-[var(--text-muted)]"
                title={`Runtime/Activations: ${capacity.activationOverheadGb.toFixed(2)} GiB`}
              />
            </div>
            <div
              style={{ left: `${Math.min(99, limitPct)}%` }}
              className="absolute top-0 bottom-0 w-0.5 bg-[var(--accent-crimson)]"
              title="80 GiB HBM Limit"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 font-mono text-xs swiss-tabular sm:grid-cols-4">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Weights
              </div>
              <div className="font-semibold text-[var(--accent-blue)]">
                {capacity.weightGb.toFixed(2)} GiB
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                KV Cache
              </div>
              <div className="font-semibold text-[var(--accent-amber)]">
                {capacity.kvCacheGb.toFixed(2)} GiB
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                GQA Saved
              </div>
              <div className="font-semibold text-[var(--accent-emerald)]">
                {capacity.gqaSavingsGb.toFixed(2)} GiB
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                MHA Would Be
              </div>
              <div className="font-semibold">
                {capacity.mhaKvCacheGb.toFixed(1)} GiB
              </div>
            </div>
          </div>

          {/* Roofline Throughput Estimate */}
          <div className="grid grid-cols-2 gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 font-mono text-xs swiss-tabular">
            <div>
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Prefill (Compute-Bound)
              </div>
              <div className="text-sm font-semibold">
                {Math.round(capacity.prefillTokensPerSec).toLocaleString()} tok/s
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                AI = {capacity.prefillArithmeticIntensity.toFixed(0)} FLOP/B
              </div>
            </div>
            <div>
              <div className="text-[10px] uppercase text-[var(--text-muted)]">
                Decode ({capacity.decodeIsMemoryBound ? "BW-Bound" : "Compute-Bound"})
              </div>
              <div className="text-sm font-semibold">
                {capacity.decodeTokensPerSec.toFixed(1)} tok/s
              </div>
              <div className="text-[10px] text-[var(--text-muted)]">
                AI = {capacity.decodeArithmeticIntensity.toFixed(2)} vs Ridge{" "}
                {capacity.ridgePointFlopsPerByte.toFixed(0)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom: Weight Distribution & Quantization Error Analyzer */}
      <section className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-sm font-semibold">
              Weight Tensor Distribution &amp; Quantization Error ({weightFormat})
            </h4>
            <p className="text-xs text-[var(--text-muted)]">
              Compare FP32 original weights (blue outline) vs quantized levels (amber bars).
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeOutliers}
                onChange={(e) => setIncludeOutliers(e.target.checked)}
              />
              <span>Inject Outlier Weights</span>
            </label>
            {weightFormat === "INT4_GROUP" && (
              <div className="flex items-center gap-1 font-mono">
                <span>Group:</span>
                {[16, 32, 128].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGroupSize(g)}
                    className={`rounded border px-1.5 py-0.5 text-[11px] ${
                      groupSize === g
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                        : "border-[var(--border-subtle)]"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Histogram Bars */}
        <div className="mt-3 flex h-28 items-end gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
          {quantMetrics.histogramBins.map((bin, idx) => {
            const origH = (bin.originalCount / maxBinCount) * 100;
            const quantH = (bin.quantizedCount / maxBinCount) * 100;
            return (
              <div
                key={idx}
                className="relative flex h-full flex-1 items-end justify-center gap-0.5"
                title={`Bin ${bin.binCenter}: orig=${bin.originalCount}, quant=${bin.quantizedCount}`}
              >
                <div
                  style={{ height: `${origH}%` }}
                  className="w-1/2 rounded-t-[2px] border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                />
                <div
                  style={{ height: `${quantH}%` }}
                  className="w-1/2 rounded-t-[2px] bg-[var(--accent-amber)]"
                />
              </div>
            );
          })}
        </div>

        {/* Error Metrics */}
        <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-xs swiss-tabular sm:grid-cols-4">
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">MSE</div>
            <div>{quantMetrics.mse.toExponential(3)}</div>
          </div>
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Max |Error|
            </div>
            <div>{quantMetrics.maxAbsError.toFixed(4)}</div>
          </div>
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">SQNR</div>
            <div>
              {Number.isFinite(quantMetrics.sqnrDb)
                ? `${quantMetrics.sqnrDb.toFixed(1)} dB`
                : "∞ dB (Exact)"}
            </div>
          </div>
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Weight Compression
            </div>
            <div>{quantMetrics.compressionRatioVsFp32.toFixed(1)}× vs FP32</div>
          </div>
        </div>
      </section>
    </div>
  );
}
