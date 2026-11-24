export type ActivationType = "relu" | "tanh" | "sigmoid";
export type DatasetType = "xor" | "circle" | "spiral";

export interface DataPoint2D {
  x1: number;
  x2: number;
  label: 0 | 1;
}

export interface MlpConfig {
  hiddenWidth: number; // 2..8
  activation: ActivationType;
  learningRate: number;
  l2Reg: number;
  dataset: DatasetType;
  seed?: number;
}

export interface MlpWeights {
  /** hiddenWidth x 2 row-major: W1[h][i] */
  w1: number[][];
  /** length hiddenWidth */
  b1: number[];
  /** length hiddenWidth (single output neuron) */
  w2: number[];
  b2: number;
}

export interface MlpGradients {
  dW1: number[][];
  db1: number[];
  dW2: number[];
  db2: number;
}

export interface ForwardBackwardTrace {
  x: [number, number];
  label: 0 | 1;
  z1: number[];
  a1: number[];
  z2: number;
  yHat: number;
  loss: number;
  dz2: number;
  da1: number[];
  dz1: number[];
  gradients: MlpGradients;
}

export interface LossHistoryPoint {
  epoch: number;
  loss: number;
  accuracy: number;
}

export interface MlpState {
  config: MlpConfig;
  weights: MlpWeights;
  dataset: DataPoint2D[];
  epoch: number;
  lossHistory: LossHistoryPoint[];
  lastBatchLoss: number;
  lastAccuracy: number;
  lastTrace: ForwardBackwardTrace;
}

// ============================================================================
// Deterministic PRNG & Dataset Generators
// ============================================================================

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function generateDataset(
  type: DatasetType,
  seed = 42
): DataPoint2D[] {
  const rng = mulberry32(seed);
  const randSigned = () => rng() * 2 - 1;
  const points: DataPoint2D[] = [];

  if (type === "xor") {
    const perQuad = 16;
    const centers: Array<{ cx: number; cy: number; label: 0 | 1 }> = [
      { cx: 0.6, cy: 0.6, label: 0 },
      { cx: -0.6, cy: -0.6, label: 0 },
      { cx: -0.6, cy: 0.6, label: 1 },
      { cx: 0.6, cy: -0.6, label: 1 },
    ];
    for (const q of centers) {
      for (let i = 0; i < perQuad; i++) {
        points.push({
          x1: q.cx + randSigned() * 0.28,
          x2: q.cy + randSigned() * 0.28,
          label: q.label,
        });
      }
    }
    return points;
  }

  if (type === "circle") {
    const nPerClass = 40;
    for (let i = 0; i < nPerClass; i++) {
      const r = rng() * 0.45;
      const theta = rng() * Math.PI * 2;
      points.push({
        x1: r * Math.cos(theta),
        x2: r * Math.sin(theta),
        label: 1,
      });
    }
    for (let i = 0; i < nPerClass; i++) {
      const r = 0.68 + rng() * 0.32;
      const theta = rng() * Math.PI * 2;
      points.push({
        x1: r * Math.cos(theta),
        x2: r * Math.sin(theta),
        label: 0,
      });
    }
    return points;
  }

  // Spiral dataset (two interleaved arms)
  const nPerArm = 44;
  for (let arm = 0; arm < 2; arm++) {
    const label: 0 | 1 = arm === 0 ? 0 : 1;
    for (let i = 0; i < nPerArm; i++) {
      const r = (i / nPerArm) * 0.92 + 0.08;
      const theta =
        (i / nPerArm) * Math.PI * 2.5 +
        (arm === 1 ? Math.PI : 0) +
        randSigned() * 0.14;
      points.push({
        x1: r * Math.cos(theta),
        x2: r * Math.sin(theta),
        label,
      });
    }
  }
  return points;
}

// ============================================================================
// Activations & Derivatives
// ============================================================================

export function sigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

export function activate(z: number, fn: ActivationType): number {
  switch (fn) {
    case "relu":
      return z > 0 ? z : 0;
    case "tanh":
      return Math.tanh(z);
    case "sigmoid":
      return sigmoid(z);
  }
}

export function activateDerivativeFromZ(
  z: number,
  a: number,
  fn: ActivationType
): number {
  switch (fn) {
    case "relu":
      return z > 0 ? 1 : 0;
    case "tanh":
      return 1 - a * a;
    case "sigmoid":
      return a * (1 - a);
  }
}

// ============================================================================
// Weight Initialization, Forward Pass & Reverse-Mode Backprop
// ============================================================================

export function initWeights(
  hiddenWidth: number,
  activation: ActivationType,
  seed = 1337
): MlpWeights {
  const width = Math.max(2, Math.min(8, Math.round(hiddenWidth)));
  const rng = mulberry32(seed);
  const scale1 =
    activation === "relu" ? Math.sqrt(2 / 2) : Math.sqrt(1 / 2) * 1.4;
  const scale2 = Math.sqrt(2 / width);

  const randNorm = () => {
    // Box-Muller using seeded rng
    const u1 = Math.max(1e-7, rng());
    const u2 = rng();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  };

  const w1: number[][] = [];
  const b1: number[] = [];
  for (let h = 0; h < width; h++) {
    w1.push([randNorm() * scale1, randNorm() * scale1]);
    b1.push(activation === "relu" ? 0.05 : 0);
  }

  const w2: number[] = [];
  for (let h = 0; h < width; h++) {
    w2.push(randNorm() * scale2);
  }

  return { w1, b1, w2, b2: 0 };
}

function emptyGradients(hiddenWidth: number): MlpGradients {
  return {
    dW1: Array.from({ length: hiddenWidth }, () => [0, 0]),
    db1: new Array<number>(hiddenWidth).fill(0),
    dW2: new Array<number>(hiddenWidth).fill(0),
    db2: 0,
  };
}

export function forwardBackwardSample(
  weights: MlpWeights,
  point: DataPoint2D,
  activation: ActivationType,
  l2Reg: number
): ForwardBackwardTrace {
  const H = weights.w2.length;
  const x: [number, number] = [point.x1, point.x2];

  // Forward: Layer 1
  const z1 = new Array<number>(H);
  const a1 = new Array<number>(H);
  for (let h = 0; h < H; h++) {
    z1[h] = weights.w1[h][0] * x[0] + weights.w1[h][1] * x[1] + weights.b1[h];
    a1[h] = activate(z1[h], activation);
  }

  // Forward: Output layer + Sigmoid
  let z2 = weights.b2;
  for (let h = 0; h < H; h++) {
    z2 += weights.w2[h] * a1[h];
  }
  const yHat = sigmoid(z2);

  // Binary cross-entropy loss + 0.5 * l2Reg * ||W||^2
  const eps = 1e-12;
  const p = Math.max(eps, Math.min(1 - eps, yHat));
  const bce = -(point.label * Math.log(p) + (1 - point.label) * Math.log(1 - p));
  let weightSq = 0;
  for (let h = 0; h < H; h++) {
    weightSq +=
      weights.w1[h][0] * weights.w1[h][0] +
      weights.w1[h][1] * weights.w1[h][1] +
      weights.w2[h] * weights.w2[h];
  }
  const loss = bce + 0.5 * l2Reg * weightSq;

  // Backward: dL/dz2 = yHat - y
  const dz2 = yHat - point.label;
  const gradients = emptyGradients(H);
  gradients.db2 = dz2;

  const da1 = new Array<number>(H);
  const dz1 = new Array<number>(H);

  for (let h = 0; h < H; h++) {
    gradients.dW2[h] = dz2 * a1[h] + l2Reg * weights.w2[h];
    da1[h] = dz2 * weights.w2[h];
    dz1[h] = da1[h] * activateDerivativeFromZ(z1[h], a1[h], activation);
    gradients.db1[h] = dz1[h];
    gradients.dW1[h][0] = dz1[h] * x[0] + l2Reg * weights.w1[h][0];
    gradients.dW1[h][1] = dz1[h] * x[1] + l2Reg * weights.w1[h][1];
  }

  return {
    x,
    label: point.label,
    z1,
    a1,
    z2,
    yHat,
    loss,
    dz2,
    da1,
    dz1,
    gradients,
  };
}

export function evaluateBatch(
  weights: MlpWeights,
  dataset: DataPoint2D[],
  activation: ActivationType,
  l2Reg: number
): {
  loss: number;
  accuracy: number;
  gradients: MlpGradients;
  sampleTrace: ForwardBackwardTrace;
} {
  const H = weights.w2.length;
  const n = Math.max(1, dataset.length);
  const accGrads = emptyGradients(H);

  let bceSum = 0;
  let correct = 0;
  let firstTrace: ForwardBackwardTrace | null = null;

  for (const pt of dataset) {
    // Pass 0 for per-sample l2Reg and add regularization once to batch loss/grads
    const tr = forwardBackwardSample(weights, pt, activation, 0);
    if (!firstTrace) firstTrace = tr;
    bceSum += tr.loss;
    const pred = tr.yHat >= 0.5 ? 1 : 0;
    if (pred === pt.label) correct++;

    accGrads.db2 += tr.gradients.db2;
    for (let h = 0; h < H; h++) {
      accGrads.dW2[h] += tr.gradients.dW2[h];
      accGrads.db1[h] += tr.gradients.db1[h];
      accGrads.dW1[h][0] += tr.gradients.dW1[h][0];
      accGrads.dW1[h][1] += tr.gradients.dW1[h][1];
    }
  }

  let weightSq = 0;
  accGrads.db2 /= n;
  for (let h = 0; h < H; h++) {
    accGrads.dW2[h] = accGrads.dW2[h] / n + l2Reg * weights.w2[h];
    accGrads.db1[h] /= n;
    accGrads.dW1[h][0] = accGrads.dW1[h][0] / n + l2Reg * weights.w1[h][0];
    accGrads.dW1[h][1] = accGrads.dW1[h][1] / n + l2Reg * weights.w1[h][1];
    weightSq +=
      weights.w1[h][0] * weights.w1[h][0] +
      weights.w1[h][1] * weights.w1[h][1] +
      weights.w2[h] * weights.w2[h];
  }

  const loss = bceSum / n + 0.5 * l2Reg * weightSq;
  const accuracy = correct / n;

  return {
    loss,
    accuracy,
    gradients: accGrads,
    sampleTrace: firstTrace!,
  };
}

export function computeNumericalGradients(
  weights: MlpWeights,
  dataset: DataPoint2D[],
  activation: ActivationType,
  l2Reg: number,
  eps = 1e-5
): MlpGradients {
  const cloneWeights = (): MlpWeights => ({
    w1: weights.w1.map((row) => [...row]),
    b1: [...weights.b1],
    w2: [...weights.w2],
    b2: weights.b2,
  });

  const evalLoss = (w: MlpWeights) =>
    evaluateBatch(w, dataset, activation, l2Reg).loss;

  const H = weights.w2.length;
  const num = emptyGradients(H);

  // b2
  {
    const wp = cloneWeights();
    const wm = cloneWeights();
    wp.b2 += eps;
    wm.b2 -= eps;
    num.db2 = (evalLoss(wp) - evalLoss(wm)) / (2 * eps);
  }

  for (let h = 0; h < H; h++) {
    // w2[h]
    {
      const wp = cloneWeights();
      const wm = cloneWeights();
      wp.w2[h] += eps;
      wm.w2[h] -= eps;
      num.dW2[h] = (evalLoss(wp) - evalLoss(wm)) / (2 * eps);
    }
    // b1[h]
    {
      const wp = cloneWeights();
      const wm = cloneWeights();
      wp.b1[h] += eps;
      wm.b1[h] -= eps;
      num.db1[h] = (evalLoss(wp) - evalLoss(wm)) / (2 * eps);
    }
    // w1[h][0..1]
    for (let i = 0; i < 2; i++) {
      const wp = cloneWeights();
      const wm = cloneWeights();
      wp.w1[h][i] += eps;
      wm.w1[h][i] -= eps;
      num.dW1[h][i] = (evalLoss(wp) - evalLoss(wm)) / (2 * eps);
    }
  }

  return num;
}

// ============================================================================
// State Initialization, Stepping & Decision Boundary Grid
// ============================================================================

export function createMlpState(partialConfig?: Partial<MlpConfig>): MlpState {
  const config: MlpConfig = {
    hiddenWidth: Math.max(2, Math.min(8, partialConfig?.hiddenWidth ?? 4)),
    activation: partialConfig?.activation ?? "tanh",
    learningRate: partialConfig?.learningRate ?? 0.35,
    l2Reg: partialConfig?.l2Reg ?? 0.0005,
    dataset: partialConfig?.dataset ?? "xor",
    seed: partialConfig?.seed ?? 101,
  };

  const dataset = generateDataset(config.dataset, config.seed);
  const weights = initWeights(
    config.hiddenWidth,
    config.activation,
    (config.seed ?? 101) + 77
  );
  const initial = evaluateBatch(
    weights,
    dataset,
    config.activation,
    config.l2Reg
  );

  return {
    config,
    weights,
    dataset,
    epoch: 0,
    lossHistory: [{ epoch: 0, loss: initial.loss, accuracy: initial.accuracy }],
    lastBatchLoss: initial.loss,
    lastAccuracy: initial.accuracy,
    lastTrace: {
      ...initial.sampleTrace,
      gradients: initial.gradients,
      loss: initial.loss,
    },
  };
}

export function stepMlpEpoch(state: MlpState, steps = 1): MlpState {
  const weights: MlpWeights = {
    w1: state.weights.w1.map((r) => [...r]),
    b1: [...state.weights.b1],
    w2: [...state.weights.w2],
    b2: state.weights.b2,
  };
  const lossHistory = [...state.lossHistory];
  let epoch = state.epoch;
  let lastEval = evaluateBatch(
    weights,
    state.dataset,
    state.config.activation,
    state.config.l2Reg
  );

  const lr = state.config.learningRate;
  const H = weights.w2.length;

  for (let s = 0; s < steps; s++) {
    const g = lastEval.gradients;
    weights.b2 -= lr * g.db2;
    for (let h = 0; h < H; h++) {
      weights.w2[h] -= lr * g.dW2[h];
      weights.b1[h] -= lr * g.db1[h];
      weights.w1[h][0] -= lr * g.dW1[h][0];
      weights.w1[h][1] -= lr * g.dW1[h][1];
    }

    epoch++;
    lastEval = evaluateBatch(
      weights,
      state.dataset,
      state.config.activation,
      state.config.l2Reg
    );

    lossHistory.push({
      epoch,
      loss: lastEval.loss,
      accuracy: lastEval.accuracy,
    });
  }

  return {
    ...state,
    weights,
    epoch,
    lossHistory: lossHistory.slice(-240),
    lastBatchLoss: lastEval.loss,
    lastAccuracy: lastEval.accuracy,
    lastTrace: {
      ...lastEval.sampleTrace,
      gradients: lastEval.gradients,
      loss: lastEval.loss,
    },
  };
}

export function predictPoint(
  weights: MlpWeights,
  x1: number,
  x2: number,
  activation: ActivationType
): number {
  const H = weights.w2.length;
  let z2 = weights.b2;
  for (let h = 0; h < H; h++) {
    const z1 = weights.w1[h][0] * x1 + weights.w1[h][1] * x2 + weights.b1[h];
    z2 += weights.w2[h] * activate(z1, activation);
  }
  return sigmoid(z2);
}

export interface DecisionBoundaryGrid {
  resolution: number;
  minCoord: number;
  maxCoord: number;
  /** Row-major probabilities [row * resolution + col], row 0 is top (maxCoord) */
  values: Float32Array;
}

export function sampleDecisionBoundary(
  state: MlpState,
  resolution = 36,
  minCoord = -1.25,
  maxCoord = 1.25
): DecisionBoundaryGrid {
  const res = Math.max(8, Math.floor(resolution));
  const values = new Float32Array(res * res);
  const span = maxCoord - minCoord;

  for (let row = 0; row < res; row++) {
    const x2 = maxCoord - ((row + 0.5) / res) * span;
    for (let col = 0; col < res; col++) {
      const x1 = minCoord + ((col + 0.5) / res) * span;
      values[row * res + col] = predictPoint(
        state.weights,
        x1,
        x2,
        state.config.activation
      );
    }
  }

  return { resolution: res, minCoord, maxCoord, values };
}
