export type PositionalEncodingMode = "sinusoidal" | "rope" | "none";

export interface AttentionConfig {
  prompt: string;
  dk: number; // e.g. 4, 8, 16, 32, 64
  numHeads: number; // e.g. 4
  selectedHead: number;
  useScaling: boolean; // toggle 1 / sqrt(dk)
  temperature: number; // e.g. 0.2 .. 3.0
  causalMask: boolean;
  posEncoding: PositionalEncodingMode;
}

export interface AttentionHeadResult {
  headIndex: number;
  Q: number[][];
  K: number[][];
  V: number[][];
  rawScores: number[][]; // Q K^T
  scaledScores: number[][]; // raw / (sqrt(dk) * T) with -Infinity for masked
  attentionWeights: number[][]; // exact softmax rows summing to 1.0
  outputVectors: number[][]; // Attn * V
  rowEntropiesBits: number[];
  rowMaxWeights: number[];
  meanEntropyBits: number;
  meanMaxWeight: number;
}

export interface AttentionResult {
  tokens: string[];
  embeddings: number[][];
  heads: AttentionHeadResult[];
  activeHead: AttentionHeadResult;
  scaleFactor: number;
}

export interface AttentionPromptPreset {
  id: string;
  label: string;
  prompt: string;
}

export const ATTENTION_PROMPT_PRESETS: AttentionPromptPreset[] = [
  {
    id: "cat-mat",
    label: "Coreference & Syntax",
    prompt: "The quick cat sat on the warm mat",
  },
  {
    id: "bank-polysemy",
    label: "Polysemy (Bank / River)",
    prompt: "The river bank flooded near the money bank",
  },
  {
    id: "causal-code",
    label: "Autoregressive Code",
    prompt: "fn add ( x , y ) -> x + y",
  },
];

// ============================================================================
// Deterministic Hashing, Embeddings & Positional Vectors
// ============================================================================

function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

function seededUnitNormal(seed: number): () => number {
  let a = seed >>> 0;
  const nextU = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return () => {
    const u1 = Math.max(1e-7, nextU());
    const u2 = nextU();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };
}

export function tokenizePrompt(prompt: string, maxTokens = 12): string[] {
  const raw = prompt
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  if (raw.length === 0) return ["<bos>"];
  return raw.slice(0, maxTokens);
}

const SEMANTIC_CLUSTERS: Record<string, number> = {
  cat: 0,
  dog: 0,
  mat: 0,
  sat: 0,
  river: 1,
  water: 1,
  flooded: 1,
  money: 2,
  loan: 2,
  bank: 2,
  fn: 3,
  add: 3,
  x: 3,
  y: 3,
};

function buildTokenEmbedding(token: string, dim: number): number[] {
  const lower = token.toLowerCase();
  const rng = seededUnitNormal(fnv1a32(lower) ^ (dim * 7919));
  const vec = new Array<number>(dim);
  for (let i = 0; i < dim; i++) {
    vec[i] = rng();
  }

  // Inject subtle semantic affinity along early axes so related words align naturally
  const cluster = SEMANTIC_CLUSTERS[lower];
  if (cluster !== undefined && dim >= 4) {
    vec[cluster % dim] += 1.4;
  }

  // Normalize RMS to 1.0 so dot products scale cleanly with sqrt(dk)
  let sq = 0;
  for (let i = 0; i < dim; i++) sq += vec[i] * vec[i];
  const rms = Math.sqrt(sq / dim) || 1;
  return vec.map((v) => v / rms);
}

function addSinusoidalPositional(
  emb: number[][],
  dim: number
): number[][] {
  return emb.map((vec, pos) =>
    vec.map((val, i) => {
      const pairIdx = Math.floor(i / 2);
      const angle = pos / Math.pow(10000, (2 * pairIdx) / dim);
      const pe = i % 2 === 0 ? Math.sin(angle) : Math.cos(angle);
      return val + 0.35 * pe;
    })
  );
}

function applyRoPE(vec: number[], pos: number): number[] {
  const out = [...vec];
  const dim = vec.length;
  for (let i = 0; i + 1 < dim; i += 2) {
    const theta = pos / Math.pow(10000, i / dim);
    const cosT = Math.cos(theta);
    const sinT = Math.sin(theta);
    const x0 = vec[i];
    const x1 = vec[i + 1];
    out[i] = x0 * cosT - x1 * sinT;
    out[i + 1] = x0 * sinT + x1 * cosT;
  }
  return out;
}

function projectMatrix(
  input: number[][],
  inDim: number,
  outDim: number,
  seed: number
): number[][] {
  const rng = seededUnitNormal(seed);
  // Variance 1 / inDim preserves unit component variance in Q, K, V
  const scale = 1 / Math.sqrt(inDim);
  const W: number[][] = Array.from({ length: inDim }, () =>
    Array.from({ length: outDim }, () => rng() * scale)
  );

  return input.map((row) => {
    const out = new Array<number>(outDim).fill(0);
    for (let j = 0; j < outDim; j++) {
      let acc = 0;
      for (let i = 0; i < inDim; i++) {
        acc += row[i] * W[i][j];
      }
      out[j] = acc;
    }
    return out;
  });
}

// ============================================================================
// Scaled Dot-Product Attention & Softmax Metrics
// ============================================================================

export function softmaxRow(logits: number[]): number[] {
  let maxVal = -Infinity;
  for (let i = 0; i < logits.length; i++) {
    if (Number.isFinite(logits[i]) && logits[i] > maxVal) {
      maxVal = logits[i];
    }
  }

  if (!Number.isFinite(maxVal)) {
    return new Array<number>(logits.length).fill(0);
  }

  const exps = new Array<number>(logits.length);
  let sum = 0;
  for (let i = 0; i < logits.length; i++) {
    if (logits[i] === -Infinity) {
      exps[i] = 0;
    } else {
      const e = Math.exp(logits[i] - maxVal);
      exps[i] = e;
      sum += e;
    }
  }

  if (sum <= 0) return new Array<number>(logits.length).fill(0);
  return exps.map((e) => e / sum);
}

export function computeShannonEntropyBits(probs: number[]): number {
  let h = 0;
  for (const p of probs) {
    if (p > 1e-12) {
      h -= p * Math.log2(p);
    }
  }
  return h;
}

export function runScaledDotProductAttention(
  config: AttentionConfig
): AttentionResult {
  const tokens = tokenizePrompt(config.prompt);
  const dk = Math.max(2, Math.min(128, Math.round(config.dk)));
  const numHeads = Math.max(1, Math.min(8, Math.round(config.numHeads)));
  const selectedHead = Math.max(
    0,
    Math.min(numHeads - 1, Math.round(config.selectedHead))
  );
  const temperature = Math.max(0.05, config.temperature);
  const dModel = Math.max(16, dk);

  const rawEmbeddings = tokens.map((tok) => buildTokenEmbedding(tok, dModel));
  const embeddings =
    config.posEncoding === "sinusoidal"
      ? addSinusoidalPositional(rawEmbeddings, dModel)
      : rawEmbeddings;

  const scaleFactor = config.useScaling ? 1 / Math.sqrt(dk) : 1;
  const heads: AttentionHeadResult[] = [];

  for (let h = 0; h < numHeads; h++) {
    const headSeed = 9001 + h * 1009;
    let Q = projectMatrix(embeddings, dModel, dk, headSeed + 1);
    let K = projectMatrix(embeddings, dModel, dk, headSeed + 2);
    const V = projectMatrix(embeddings, dModel, dk, headSeed + 3);

    if (config.posEncoding === "rope") {
      Q = Q.map((qVec, pos) => applyRoPE(qVec, pos));
      K = K.map((kVec, pos) => applyRoPE(kVec, pos));
    }

    const n = tokens.length;
    const rawScores: number[][] = Array.from({ length: n }, () =>
      new Array<number>(n).fill(0)
    );
    const scaledScores: number[][] = Array.from({ length: n }, () =>
      new Array<number>(n).fill(0)
    );
    const attentionWeights: number[][] = Array.from({ length: n }, () =>
      new Array<number>(n).fill(0)
    );

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        let dot = 0;
        for (let k = 0; k < dk; k++) {
          dot += Q[i][k] * K[j][k];
        }
        rawScores[i][j] = dot;
        if (config.causalMask && j > i) {
          scaledScores[i][j] = -Infinity;
        } else {
          scaledScores[i][j] = (dot * scaleFactor) / temperature;
        }
      }
      attentionWeights[i] = softmaxRow(scaledScores[i]);
    }

    // Output = AttentionWeights * V
    const outputVectors: number[][] = Array.from({ length: n }, (_, i) => {
      const out = new Array<number>(dk).fill(0);
      for (let j = 0; j < n; j++) {
        const w = attentionWeights[i][j];
        for (let k = 0; k < dk; k++) {
          out[k] += w * V[j][k];
        }
      }
      return out;
    });

    const rowEntropiesBits = attentionWeights.map((row) =>
      computeShannonEntropyBits(row)
    );
    const rowMaxWeights = attentionWeights.map((row) => Math.max(...row));
    const meanEntropyBits =
      rowEntropiesBits.reduce((a, b) => a + b, 0) / Math.max(1, n);
    const meanMaxWeight =
      rowMaxWeights.reduce((a, b) => a + b, 0) / Math.max(1, n);

    heads.push({
      headIndex: h,
      Q,
      K,
      V,
      rawScores,
      scaledScores,
      attentionWeights,
      outputVectors,
      rowEntropiesBits,
      rowMaxWeights,
      meanEntropyBits,
      meanMaxWeight,
    });
  }

  return {
    tokens,
    embeddings,
    heads,
    activeHead: heads[selectedHead],
    scaleFactor,
  };
}
