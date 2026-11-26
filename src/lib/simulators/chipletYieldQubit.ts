export type QuantumGate = "H" | "X" | "Z";

export interface PoissonYieldParams {
  /** Total silicon area A in cm^2 (e.g. 0.5..10 cm^2; 8.0 cm^2 = 800 mm^2) */
  totalAreaCm2: number;
  /** Defect density D in defects/cm^2 (0..2) */
  defectDensityPerCm2: number;
  /** Number of chiplet tiles N (1..16) */
  tileCount: number;
}

export interface PoissonYieldResult {
  totalAreaCm2: number;
  defectDensityPerCm2: number;
  tileCount: number;
  tileAreaCm2: number;
  /** Monolithic die yield Y_mono = exp(-A * D) */
  monolithicYield: number;
  /** Single-chiplet tile yield Y_tile = exp(-(A/N) * D) */
  tileYield: number;
  /** Ratio Y_tile / Y_mono showing known-good-die yield improvement */
  kgdAdvantageRatio: number;
  /** Expected usable silicon fraction */
  effectiveGoodSiliconFraction: number;
  /** Curve across N = 1..16 chiplets */
  yieldCurve: Array<{ tileCount: number; tileYield: number; monolithicYield: number }>;
}

export interface QubitStateSnapshot {
  stepIndex: number;
  gateApplied: QuantumGate | "INIT";
  alpha: number; // real amplitude of |0>
  beta: number; // real amplitude of |1>
  prob0: number;
  prob1: number;
  phaseLabel: string;
}

export interface QuantumInterferenceResult {
  gates: QuantumGate[];
  snapshots: QubitStateSnapshot[];
  finalState: QubitStateSnapshot;
}

const INV_SQRT2 = Math.SQRT1_2;

/**
 * Evaluates Poisson die yield for monolithic vs N-chiplet partitioned silicon.
 */
export function simulatePoissonDieYield(
  params: PoissonYieldParams
): PoissonYieldResult {
  const A = Math.max(0.05, params.totalAreaCm2);
  const D = Math.max(0, params.defectDensityPerCm2);
  const N = Math.max(1, Math.min(16, Math.round(params.tileCount)));

  const tileAreaCm2 = A / N;
  const monolithicYield = Math.exp(-A * D);
  const tileYield = Math.exp(-tileAreaCm2 * D);
  const kgdAdvantageRatio = monolithicYield > 0 ? tileYield / monolithicYield : 1;

  const yieldCurve: PoissonYieldResult["yieldCurve"] = [];
  for (let k = 1; k <= 16; k++) {
    yieldCurve.push({
      tileCount: k,
      tileYield: Math.exp(-(A / k) * D),
      monolithicYield,
    });
  }

  return {
    totalAreaCm2: A,
    defectDensityPerCm2: D,
    tileCount: N,
    tileAreaCm2,
    monolithicYield,
    tileYield,
    kgdAdvantageRatio,
    effectiveGoodSiliconFraction: tileYield,
    yieldCurve,
  };
}

/**
 * Parses a space/comma-separated gate sequence string into QuantumGate[].
 */
export function parseQuantumGateSequence(input: string): QuantumGate[] {
  return input
    .toUpperCase()
    .replace(/[^HXZ]/g, " ")
    .split(/\s+/)
    .filter((tok): tok is QuantumGate => tok === "H" || tok === "X" || tok === "Z")
    .slice(0, 20);
}

/**
 * Applies a single-qubit H, X, or Z gate to real amplitudes (alpha, beta).
 */
export function applySingleQubitGate(
  alpha: number,
  beta: number,
  gate: QuantumGate
): { alpha: number; beta: number } {
  switch (gate) {
    case "H":
      return {
        alpha: INV_SQRT2 * (alpha + beta),
        beta: INV_SQRT2 * (alpha - beta),
      };
    case "X":
      return { alpha: beta, beta: alpha };
    case "Z":
      return { alpha, beta: -beta };
  }
}

function describePhase(alpha: number, beta: number): string {
  const p0 = alpha * alpha;
  const p1 = beta * beta;
  if (p0 > 0.999) return "|0⟩";
  if (p1 > 0.999) return "|1⟩";
  if (Math.abs(p0 - 0.5) < 0.01) {
    return alpha * beta >= 0 ? "|+⟩ = (|0⟩+|1⟩)/√2" : "|−⟩ = (|0⟩−|1⟩)/√2";
  }
  return `${alpha.toFixed(2)}|0⟩ + ${beta.toFixed(2)}|1⟩`;
}

/**
 * Simulates a single-qubit interference circuit starting in |0⟩ across up to 20 H/X/Z gates.
 */
export function simulateQuantumInterference(
  gates: QuantumGate[]
): QuantumInterferenceResult {
  const limited = gates.slice(0, 20);
  let alpha = 1;
  let beta = 0;

  const snapshots: QubitStateSnapshot[] = [
    {
      stepIndex: 0,
      gateApplied: "INIT",
      alpha,
      beta,
      prob0: 1,
      prob1: 0,
      phaseLabel: "|0⟩",
    },
  ];

  limited.forEach((gate, idx) => {
    const next = applySingleQubitGate(alpha, beta, gate);
    // Clean floating-point dust near 0/1
    alpha = Math.abs(next.alpha) < 1e-12 ? 0 : next.alpha;
    beta = Math.abs(next.beta) < 1e-12 ? 0 : next.beta;
    const prob0 = Math.min(1, Math.max(0, alpha * alpha));
    const prob1 = Math.min(1, Math.max(0, beta * beta));
    snapshots.push({
      stepIndex: idx + 1,
      gateApplied: gate,
      alpha,
      beta,
      prob0,
      prob1,
      phaseLabel: describePhase(alpha, beta),
    });
  });

  return {
    gates: limited,
    snapshots,
    finalState: snapshots[snapshots.length - 1],
  };
}
