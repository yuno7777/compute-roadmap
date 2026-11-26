// ============================================================================
// 1. Numerical Differentiation (Forward vs Central + Floating-Point Cancellation)
// ============================================================================

export type DiffFunctionId = "x3" | "sin" | "exp";
export type DiffMethod = "forward" | "central";

export type ErrorRegime =
  | "truncation-dominated"
  | "optimal-region"
  | "cancellation-dominated";

export interface DerivativeResult {
  fn: DiffFunctionId;
  method: DiffMethod;
  x: number;
  h: number;
  estimate: number;
  exact: number;
  absError: number;
  relError: number;
  regime: ErrorRegime;
}

export function evalFunction(fn: DiffFunctionId, x: number): number {
  switch (fn) {
    case "x3":
      return x * x * x;
    case "sin":
      return Math.sin(x);
    case "exp":
      return Math.exp(x);
  }
}

export function evalExactDerivative(fn: DiffFunctionId, x: number): number {
  switch (fn) {
    case "x3":
      return 3 * x * x;
    case "sin":
      return Math.cos(x);
    case "exp":
      return Math.exp(x);
  }
}

export function computeNumericalDerivative(
  fn: DiffFunctionId,
  x: number,
  h: number,
  method: DiffMethod
): DerivativeResult {
  const safeH = Math.max(1e-15, Math.abs(h));
  const exact = evalExactDerivative(fn, x);
  const estimate =
    method === "forward"
      ? (evalFunction(fn, x + safeH) - evalFunction(fn, x)) / safeH
      : (evalFunction(fn, x + safeH) - evalFunction(fn, x - safeH)) /
        (2 * safeH);

  const absError = Math.abs(estimate - exact);
  const relError = exact !== 0 ? absError / Math.abs(exact) : absError;

  const optimalBoundary = method === "central" ? 1e-5 : 1e-8;
  let regime: ErrorRegime = "optimal-region";
  if (safeH > 1e-2) {
    regime = "truncation-dominated";
  } else if (safeH < optimalBoundary * 0.1) {
    regime = "cancellation-dominated";
  }

  return {
    fn,
    method,
    x,
    h: safeH,
    estimate,
    exact,
    absError,
    relError,
    regime,
  };
}

export interface StepSweepPoint {
  exponent: number; // 0 down to -12
  h: number;
  forwardError: number;
  centralError: number;
}

export function generateStepSweep(
  fn: DiffFunctionId,
  x: number
): StepSweepPoint[] {
  const points: StepSweepPoint[] = [];
  for (let exp = 0; exp >= -12; exp--) {
    const h = Math.pow(10, exp);
    const fwd = computeNumericalDerivative(fn, x, h, "forward");
    const cen = computeNumericalDerivative(fn, x, h, "central");
    points.push({
      exponent: exp,
      h,
      forwardError: Math.max(1e-16, fwd.absError),
      centralError: Math.max(1e-16, cen.absError),
    });
  }
  return points;
}

// ============================================================================
// 2. Shannon Entropy, Cross-Entropy & KL Divergence (Binary Distribution)
// ============================================================================

export interface BinaryInfoMetrics {
  p: number;
  q: number;
  surpriseP: number;
  surpriseNotP: number;
  entropy: number; // H(p) in bits
  crossEntropy: number; // H(p, q) in bits
  klDivergence: number; // D_KL(p || q) = H(p, q) - H(p) in bits
}

function safeTerm(prob: number, modelProb: number): number {
  if (prob <= 0) return 0;
  return -prob * Math.log2(modelProb);
}

export function computeBinaryInfoMetrics(
  rawP: number,
  rawQ: number
): BinaryInfoMetrics {
  const p = Math.min(1, Math.max(0, rawP));
  const q = Math.min(0.999, Math.max(0.001, rawQ));

  const surpriseP = p > 0 ? -Math.log2(p) : Infinity;
  const surpriseNotP = 1 - p > 0 ? -Math.log2(1 - p) : Infinity;

  const entropy = safeTerm(p, p) + safeTerm(1 - p, 1 - p);
  const crossEntropy = safeTerm(p, q) + safeTerm(1 - p, 1 - q);
  const klDivergence = Math.max(0, crossEntropy - entropy);

  return {
    p,
    q,
    surpriseP,
    surpriseNotP,
    entropy,
    crossEntropy,
    klDivergence,
  };
}

export function generateBinaryEntropyCurve(
  steps = 40
): Array<{ p: number; entropy: number }> {
  const pts: Array<{ p: number; entropy: number }> = [];
  for (let i = 0; i <= steps; i++) {
    const p = i / steps;
    const m = computeBinaryInfoMetrics(p, 0.5);
    pts.push({ p, entropy: m.entropy });
  }
  return pts;
}
