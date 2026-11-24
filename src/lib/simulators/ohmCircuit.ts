export type ResistorTopology = "series" | "parallel";

export interface OhmCircuitParams {
  /** Supply voltage in Volts (V) */
  voltage: number;
  /** Resistance in Ohms (Ω) */
  resistance: number;
  /** Capacitance in Picofarads (pF) */
  capacitancePf: number;
}

export interface RcWaveformPoint {
  /** Time in nanoseconds (ns) */
  timeNs: number;
  /** Capacitor voltage Vc(t) in Volts */
  voltageV: number;
  /** Charging current I(t) in milliamperes (mA) */
  currentMa: number;
}

export interface OhmCircuitResult {
  /** Steady-state / peak current I = V / R in Amperes */
  currentA: number;
  /** Steady-state / peak current in milliamperes (mA) */
  currentMa: number;
  /** Peak power dissipation P = V^2 / R in Watts */
  powerW: number;
  /** Peak power dissipation in milliwatts (mW) */
  powerMw: number;
  /** Time constant tau = R * C in seconds */
  tauSeconds: number;
  /** Time constant tau in nanoseconds */
  tauNs: number;
  /** 10%-90% rise time = ln(9) * RC ≈ 2.197224577 * RC in nanoseconds */
  riseTimeNs: number;
  /** Time to reach 10% of supply voltage in nanoseconds */
  t10Ns: number;
  /** Time to reach 90% of supply voltage in nanoseconds */
  t90Ns: number;
  /** Stored capacitor energy E = 0.5 * C * V^2 in picojoules (pJ) */
  energyPj: number;
  /** Sampled charging waveform from t = 0 to 5 * tau */
  waveform: RcWaveformPoint[];
  /** True when the 10%-90% rise time < 2.2 ns and peak power <= 25 mW */
  meetsChallenge: boolean;
}

export const LN_9 = Math.log(9); // ~2.1972245773362196

/**
 * Computes equivalent resistance for a network of resistors in series or parallel.
 */
export function equivalentResistance(
  resistors: number[],
  topology: ResistorTopology
): number {
  const valid = resistors.filter((r) => Number.isFinite(r) && r > 0);
  if (valid.length === 0) return 0;
  if (topology === "series") {
    return valid.reduce((sum, r) => sum + r, 0);
  }
  const invSum = valid.reduce((sum, r) => sum + 1 / r, 0);
  return invSum > 0 ? 1 / invSum : 0;
}

/**
 * Evaluates capacitor charging voltage Vc(t) = Vs * (1 - exp(-t / (R * C))).
 */
export function capacitorVoltageAtTime(
  supplyVoltage: number,
  resistanceOhms: number,
  capacitancePf: number,
  timeNs: number
): number {
  if (resistanceOhms <= 0 || capacitancePf <= 0 || timeNs <= 0) {
    return 0;
  }
  const tauNs = (resistanceOhms * capacitancePf) / 1000;
  return supplyVoltage * (1 - Math.exp(-timeNs / tauNs));
}

/**
 * Computes full Ohm's law, RC time constant, 10%-90% rise time, and waveform points.
 */
export function simulateOhmCircuit(
  params: OhmCircuitParams,
  samples = 80
): OhmCircuitResult {
  const voltage = Math.max(0, params.voltage);
  const resistance = Math.max(1e-6, params.resistance);
  const capacitancePf = Math.max(1e-6, params.capacitancePf);

  const currentA = voltage / resistance;
  const currentMa = currentA * 1000;
  const powerW = (voltage * voltage) / resistance;
  const powerMw = powerW * 1000;

  // C in Farads = capacitancePf * 1e-12; tau in ns = R * C * 1e9 = R * C_pF * 1e-3
  const tauSeconds = resistance * capacitancePf * 1e-12;
  const tauNs = (resistance * capacitancePf) / 1000;
  const t10Ns = -Math.log(0.9) * tauNs;
  const t90Ns = -Math.log(0.1) * tauNs;
  const riseTimeNs = LN_9 * tauNs;
  const energyPj = 0.5 * capacitancePf * voltage * voltage;

  const maxTimeNs = Math.max(5 * tauNs, 0.05);
  const waveform: RcWaveformPoint[] = [];
  const count = Math.max(10, samples);
  for (let i = 0; i <= count; i++) {
    const t = (maxTimeNs * i) / count;
    const expTerm = Math.exp(-t / tauNs);
    waveform.push({
      timeNs: t,
      voltageV: voltage * (1 - expTerm),
      currentMa: currentMa * expTerm,
    });
  }

  const meetsChallenge =
    voltage > 0 && riseTimeNs < 2.2 && powerMw <= 25;

  return {
    currentA,
    currentMa,
    powerW,
    powerMw,
    tauSeconds,
    tauNs,
    riseTimeNs,
    t10Ns,
    t90Ns,
    energyPj,
    waveform,
    meetsChallenge,
  };
}
