export type CarrierType = "electron" | "hole";

export interface ChargeDriftParams {
  /** Total charge Q in Coulombs (0..12 C) */
  chargeCoulombs: number;
  /** Elapsed time t in seconds (0.1..12 s) */
  timeSeconds: number;
  /** Majority carrier sign */
  carrierType: CarrierType;
}

export interface ChargeDriftResult {
  chargeCoulombs: number;
  timeSeconds: number;
  carrierType: CarrierType;
  /** Exact current I = Q / t in Amperes */
  currentAmps: number;
  /** Number of elementary charges N = Q / e */
  carrierCount: number;
  /** Drift direction relative to positive +x conventional current */
  driftDirection: "left" | "right";
  /** Conventional current direction (+x) */
  conventionalDirection: "right";
}

export type BiasRegime = "reverse" | "equilibrium" | "forward";

export interface ShockleyDiodeParams {
  /** Junction bias voltage V (-0.6..+0.75 V) */
  biasVoltage: number;
  /** Reverse saturation current Is in Amperes (default 1e-12 A = 1 pA) */
  saturationCurrentA?: number;
  /** Ideality factor n (default 1) */
  idealityFactor?: number;
  /** Thermal voltage VT in Volts (default 0.02585 V at 300 K) */
  thermalVoltageV?: number;
  /** Normalized doping scale (1..10, higher doping narrows depletion width) */
  dopingScale?: number;
}

export interface ShockleyDiodeResult {
  biasVoltage: number;
  saturationCurrentA: number;
  idealityFactor: number;
  thermalVoltageV: number;
  /** Exact Shockley diode current I = Is * (exp(V / (n * VT)) - 1) in Amperes */
  currentAmps: number;
  /** Current in milliamperes */
  currentMa: number;
  regime: BiasRegime;
  /** Relative depletion width in micrometers (um) */
  depletionWidthUm: number;
  /** Effective barrier height in Volts */
  barrierHeightV: number;
  /** Sampled I-V curve points from -0.6 V to +0.75 V */
  ivCurve: Array<{ voltage: number; currentMa: number }>;
}

export const ELEMENTARY_CHARGE_C = 1.602176634e-19;
export const DEFAULT_THERMAL_VOLTAGE_V = 0.02585;
export const DEFAULT_SATURATION_CURRENT_A = 1e-12;

/**
 * Evaluates macroscopic current I = Q / t, carrier count N = Q / e,
 * and physical carrier drift vs conventional current direction.
 */
export function simulateChargeDrift(params: ChargeDriftParams): ChargeDriftResult {
  const q = Math.max(0, params.chargeCoulombs);
  const t = Math.max(1e-6, params.timeSeconds);
  const currentAmps = q / t;
  const carrierCount = q / ELEMENTARY_CHARGE_C;

  return {
    chargeCoulombs: q,
    timeSeconds: t,
    carrierType: params.carrierType,
    currentAmps,
    carrierCount,
    driftDirection: params.carrierType === "electron" ? "left" : "right",
    conventionalDirection: "right",
  };
}

/**
 * Evaluates the Shockley ideal diode equation I = Is * (exp(V / (n * VT)) - 1)
 * along with depletion width and barrier height for a step PN junction.
 */
export function evaluateShockleyDiode(
  params: ShockleyDiodeParams
): ShockleyDiodeResult {
  const V = params.biasVoltage;
  const Is = params.saturationCurrentA ?? DEFAULT_SATURATION_CURRENT_A;
  const n = Math.max(1, params.idealityFactor ?? 1);
  const VT = Math.max(1e-4, params.thermalVoltageV ?? DEFAULT_THERMAL_VOLTAGE_V);
  const doping = Math.max(1, params.dopingScale ?? 2);

  const computeI = (v: number) => {
    const exponent = Math.min(40, Math.max(-40, v / (n * VT)));
    return Is * (Math.exp(exponent) - 1);
  };

  const currentAmps = computeI(V);
  const currentMa = currentAmps * 1000;

  let regime: BiasRegime = "equilibrium";
  if (V > 0.02) regime = "forward";
  else if (V < -0.02) regime = "reverse";

  const builtInV = 0.78;
  const barrierHeightV = Math.max(0.03, builtInV - V);
  // Abrupt junction W ~ sqrt(Vbi - V) / sqrt(doping)
  const depletionWidthUm =
    (0.65 / Math.sqrt(doping)) * Math.sqrt(Math.max(0.03, barrierHeightV) / builtInV);

  const ivCurve: Array<{ voltage: number; currentMa: number }> = [];
  const steps = 54;
  for (let i = 0; i <= steps; i++) {
    const v = -0.6 + ((0.75 - -0.6) * i) / steps;
    ivCurve.push({ voltage: v, currentMa: computeI(v) * 1000 });
  }

  return {
    biasVoltage: V,
    saturationCurrentA: Is,
    idealityFactor: n,
    thermalVoltageV: VT,
    currentAmps,
    currentMa,
    regime,
    depletionWidthUm,
    barrierHeightV,
    ivCurve,
  };
}
