export type WeightQuantFormat =
  | "FP32"
  | "FP16"
  | "BF16"
  | "INT8_SYM"
  | "INT8_ASYM"
  | "INT4_GROUP";

export type KvCacheFormat = "FP16" | "FP8" | "INT4";

export interface QuantizationMetrics {
  format: WeightQuantFormat;
  bitsPerParam: number;
  original: number[];
  quantized: number[];
  residuals: number[];
  mse: number;
  rmse: number;
  maxAbsError: number;
  sqnrDb: number;
  compressionRatioVsFp32: number;
  histogramBins: Array<{
    binCenter: number;
    originalCount: number;
    quantizedCount: number;
  }>;
}

export interface LlmCapacityConfig {
  paramsBillions: number; // e.g. 7, 8, 70
  numLayers: number; // L
  numQueryHeads: number; // n_q
  numKvHeads: number; // n_kv (GQA when < n_q)
  headDim: number; // d_head
  seqLen: number; // S
  batchSize: number; // B
  weightFormat: WeightQuantFormat;
  kvFormat: KvCacheFormat;
  hbmLimitGb: number; // e.g. 80
  gpuTflopsFp16: number; // e.g. 989 (H100 SXM)
  gpuBandwidthGbs: number; // e.g. 3350 (H100 SXM)
}

export interface LlmCapacityResult {
  weightBytes: number;
  weightGb: number; // GiB (bytes / 1024^3)
  kvCacheBytes: number; // Exact 2 * L * n_kv * d_head * S * B * kvBytesPerElem
  kvCacheGb: number;
  mhaKvCacheBytes: number;
  mhaKvCacheGb: number;
  gqaCompressionRatio: number;
  gqaSavingsGb: number;
  activationOverheadGb: number;
  totalHbmGb: number;
  hbmLimitGb: number;
  fitsInHbm: boolean;
  headroomGb: number;
  prefillTokensPerSec: number;
  decodeTokensPerSec: number;
  prefillArithmeticIntensity: number;
  decodeArithmeticIntensity: number;
  ridgePointFlopsPerByte: number;
  decodeIsMemoryBound: boolean;
}

export interface LlmPreset {
  id: string;
  name: string;
  paramsBillions: number;
  numLayers: number;
  numQueryHeads: number;
  numKvHeads: number;
  headDim: number;
}

export const LLM_PRESETS: LlmPreset[] = [
  {
    id: "llama3-8b",
    name: "Llama-3 8B (GQA 4:1)",
    paramsBillions: 8,
    numLayers: 32,
    numQueryHeads: 32,
    numKvHeads: 8,
    headDim: 128,
  },
  {
    id: "llama2-7b-mha",
    name: "7B Standard MHA (1:1)",
    paramsBillions: 7,
    numLayers: 32,
    numQueryHeads: 32,
    numKvHeads: 32,
    headDim: 128,
  },
  {
    id: "llama3-70b",
    name: "Llama-3 70B (GQA 8:1)",
    paramsBillions: 70,
    numLayers: 80,
    numQueryHeads: 64,
    numKvHeads: 8,
    headDim: 128,
  },
];

// ============================================================================
// 1. Weight Tensor Quantization & Error Metrics
// ============================================================================

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateSampleWeights(
  count = 256,
  includeOutliers = true,
  seed = 2025
): number[] {
  const rng = mulberry32(seed);
  const weights: number[] = [];

  for (let i = 0; i < count; i++) {
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    const g = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    let w = g * 0.28;
    if (includeOutliers && i % 47 === 13) {
      w = (i % 2 === 0 ? 1 : -1) * (1.8 + rng() * 0.6);
    }
    weights.push(w);
  }
  return weights;
}

/** Exact IEEE-754 binary16 (FP16) rounding simulation */
export function roundToFp16(val: number): number {
  if (val === 0) return 0;
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  if (abs >= 65504) return sign * 65504;
  if (abs < Math.pow(2, -24)) return 0;

  const exp = Math.floor(Math.log2(abs));
  if (exp < -14) {
    // Subnormal: 2^-24 resolution
    const step = Math.pow(2, -24);
    return sign * Math.round(abs / step) * step;
  }
  // Normal: 10 mantissa bits -> step = 2^(exp - 10)
  const step = Math.pow(2, exp - 10);
  return sign * Math.round(abs / step) * step;
}

/** Exact BF16 (8-bit exponent, 7-bit mantissa) rounding simulation */
export function roundToBf16(val: number): number {
  if (val === 0) return 0;
  const f32 = new Float32Array(1);
  const u32 = new Uint32Array(f32.buffer);
  f32[0] = val;
  // Round-to-nearest-even on lower 16 bits
  const bits = u32[0];
  const roundingBias = 0x7fff + ((bits >>> 16) & 1);
  u32[0] = (bits + roundingBias) & 0xffff0000;
  return f32[0];
}

export function getFormatBits(format: WeightQuantFormat): number {
  switch (format) {
    case "FP32":
      return 32;
    case "FP16":
    case "BF16":
      return 16;
    case "INT8_SYM":
    case "INT8_ASYM":
      return 8;
    case "INT4_GROUP":
      return 4;
  }
}

export function quantizeWeights(
  weights: number[],
  format: WeightQuantFormat,
  groupSize = 32
): QuantizationMetrics {
  const n = Math.max(1, weights.length);
  const quantized = new Array<number>(n);

  if (format === "FP32") {
    for (let i = 0; i < n; i++) quantized[i] = weights[i];
  } else if (format === "FP16") {
    for (let i = 0; i < n; i++) quantized[i] = roundToFp16(weights[i]);
  } else if (format === "BF16") {
    for (let i = 0; i < n; i++) quantized[i] = roundToBf16(weights[i]);
  } else if (format === "INT8_SYM") {
    const maxAbs = Math.max(1e-8, ...weights.map((w) => Math.abs(w)));
    const scale = maxAbs / 127;
    for (let i = 0; i < n; i++) {
      const q = Math.max(-127, Math.min(127, Math.round(weights[i] / scale)));
      quantized[i] = q * scale;
    }
  } else if (format === "INT8_ASYM") {
    const minVal = Math.min(...weights);
    const maxVal = Math.max(...weights);
    const scale = Math.max(1e-8, (maxVal - minVal) / 255);
    const zeroPoint = Math.round(-minVal / scale);
    for (let i = 0; i < n; i++) {
      const q = Math.max(
        0,
        Math.min(255, Math.round(weights[i] / scale) + zeroPoint)
      );
      quantized[i] = (q - zeroPoint) * scale;
    }
  } else {
    // INT4_GROUP: symmetric per-group [-7, 7]
    const gSize = Math.max(4, groupSize);
    for (let start = 0; start < n; start += gSize) {
      const end = Math.min(n, start + gSize);
      let maxAbs = 1e-8;
      for (let i = start; i < end; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(weights[i]));
      }
      const scale = maxAbs / 7;
      for (let i = start; i < end; i++) {
        const q = Math.max(-7, Math.min(7, Math.round(weights[i] / scale)));
        quantized[i] = q * scale;
      }
    }
  }

  const residuals = weights.map((w, i) => w - quantized[i]);
  let sqSignal = 0;
  let sqError = 0;
  let maxAbsError = 0;

  for (let i = 0; i < n; i++) {
    sqSignal += weights[i] * weights[i];
    const err = Math.abs(residuals[i]);
    sqError += err * err;
    if (err > maxAbsError) maxAbsError = err;
  }

  const mse = sqError / n;
  const rmse = Math.sqrt(mse);
  const sqnrDb =
    sqError <= 1e-18 ? Infinity : 10 * Math.log10(sqSignal / sqError);

  // Build 17-bin histogram over [-1.6, 1.6]
  const numBins = 17;
  const minRange = -1.6;
  const maxRange = 1.6;
  const binWidth = (maxRange - minRange) / numBins;
  const origCounts = new Array<number>(numBins).fill(0);
  const quantCounts = new Array<number>(numBins).fill(0);

  const toBin = (val: number) =>
    Math.max(
      0,
      Math.min(numBins - 1, Math.floor((val - minRange) / binWidth))
    );

  for (let i = 0; i < n; i++) {
    origCounts[toBin(weights[i])]++;
    quantCounts[toBin(quantized[i])]++;
  }

  const histogramBins = origCounts.map((originalCount, idx) => ({
    binCenter: Number((minRange + (idx + 0.5) * binWidth).toFixed(2)),
    originalCount,
    quantizedCount: quantCounts[idx],
  }));

  const bitsPerParam = getFormatBits(format);

  return {
    format,
    bitsPerParam,
    original: weights,
    quantized,
    residuals,
    mse,
    rmse,
    maxAbsError,
    sqnrDb,
    compressionRatioVsFp32: 32 / bitsPerParam,
    histogramBins,
  };
}

// ============================================================================
// 2. LLM Memory Footprint, KV-Cache & Roofline Inference Engine
// ============================================================================

const GIB = 1024 ** 3;

export function getKvBytesPerElement(format: KvCacheFormat): number {
  switch (format) {
    case "FP16":
      return 2;
    case "FP8":
      return 1;
    case "INT4":
      return 0.5;
  }
}

export function computeKvCacheBytes(params: {
  numLayers: number;
  numKvHeads: number;
  headDim: number;
  seqLen: number;
  batchSize: number;
  kvBytesPerElement: number;
}): number {
  return (
    2 *
    params.numLayers *
    params.numKvHeads *
    params.headDim *
    params.seqLen *
    params.batchSize *
    params.kvBytesPerElement
  );
}

export function computeLlmCapacityAndRoofline(
  config: LlmCapacityConfig
): LlmCapacityResult {
  const weightBits = getFormatBits(config.weightFormat);
  const weightBytesPerParam = weightBits / 8;
  // Include small ~3% metadata overhead for INT4 group scales
  const metadataMultiplier = config.weightFormat === "INT4_GROUP" ? 1.03125 : 1;
  const weightBytes =
    config.paramsBillions * 1e9 * weightBytesPerParam * metadataMultiplier;
  const weightGb = weightBytes / GIB;

  const kvBytesPerElement = getKvBytesPerElement(config.kvFormat);
  const kvCacheBytes = computeKvCacheBytes({
    numLayers: config.numLayers,
    numKvHeads: config.numKvHeads,
    headDim: config.headDim,
    seqLen: config.seqLen,
    batchSize: config.batchSize,
    kvBytesPerElement,
  });
  const kvCacheGb = kvCacheBytes / GIB;

  const mhaKvCacheBytes = computeKvCacheBytes({
    numLayers: config.numLayers,
    numKvHeads: config.numQueryHeads,
    headDim: config.headDim,
    seqLen: config.seqLen,
    batchSize: config.batchSize,
    kvBytesPerElement,
  });
  const mhaKvCacheGb = mhaKvCacheBytes / GIB;

  const gqaCompressionRatio =
    config.numQueryHeads / Math.max(1, config.numKvHeads);
  const gqaSavingsGb = Math.max(0, mhaKvCacheGb - kvCacheGb);

  // Runtime activation scratch + CUDA context overhead (~1.5 GB base + small batch term)
  const activationOverheadGb =
    1.2 + Math.min(4, (config.batchSize * config.seqLen) / 32768);
  const totalHbmGb = weightGb + kvCacheGb + activationOverheadGb;
  const fitsInHbm = totalHbmGb <= config.hbmLimitGb;
  const headroomGb = config.hbmLimitGb - totalHbmGb;

  // Roofline analysis (Prefill = Compute-Bound, Decode = Memory-Bandwidth-Bound)
  const paramsCount = config.paramsBillions * 1e9;
  // Quantized tensor cores give ~2x peak FLOPS for INT8/INT4/FP8 vs FP16, 0.5x for FP32
  const computeMultiplier =
    config.weightFormat === "FP32"
      ? 0.25
      : config.weightFormat === "FP16" || config.weightFormat === "BF16"
      ? 1.0
      : 1.8;
  const effectivePeakFlops = config.gpuTflopsFp16 * 1e12 * computeMultiplier;
  const bandwidthBytesPerSec = config.gpuBandwidthGbs * 1e9;
  const ridgePointFlopsPerByte = effectivePeakFlops / bandwidthBytesPerSec;

  // Prefill processes S*B tokens in parallel: 2 * P * S * B FLOPs
  const prefillFlops = 2 * paramsCount * config.seqLen * config.batchSize;
  const prefillBytes = weightBytes + kvCacheBytes;
  const prefillArithmeticIntensity = prefillFlops / Math.max(1, prefillBytes);
  const prefillAttainableFlops = Math.min(
    effectivePeakFlops,
    prefillArithmeticIntensity * bandwidthBytesPerSec
  );
  // Apply realistic ~65% MFU efficiency
  const prefillTimeSec = prefillFlops / (prefillAttainableFlops * 0.65);
  const prefillTokensPerSec =
    (config.seqLen * config.batchSize) / Math.max(1e-9, prefillTimeSec);

  // Decode generates B tokens per forward step: reads all weights + KV cache
  const decodeFlops = 2 * paramsCount * config.batchSize;
  const decodeBytes = weightBytes + kvCacheBytes;
  const decodeArithmeticIntensity = decodeFlops / Math.max(1, decodeBytes);
  const decodeIsMemoryBound = decodeArithmeticIntensity < ridgePointFlopsPerByte;
  const decodeAttainableFlops = Math.min(
    effectivePeakFlops,
    decodeArithmeticIntensity * bandwidthBytesPerSec
  );
  // Apply realistic ~80% HBM bandwidth utilization
  const decodeStepTimeSec = decodeFlops / (decodeAttainableFlops * 0.8);
  const decodeTokensPerSec =
    config.batchSize / Math.max(1e-9, decodeStepTimeSec);

  return {
    weightBytes,
    weightGb,
    kvCacheBytes,
    kvCacheGb,
    mhaKvCacheBytes,
    mhaKvCacheGb,
    gqaCompressionRatio,
    gqaSavingsGb,
    activationOverheadGb,
    totalHbmGb,
    hbmLimitGb: config.hbmLimitGb,
    fitsInHbm,
    headroomGb,
    prefillTokensPerSec,
    decodeTokensPerSec,
    prefillArithmeticIntensity,
    decodeArithmeticIntensity,
    ridgePointFlopsPerByte,
    decodeIsMemoryBound,
  };
}
