export type MosfetRegion = "cutoff" | "triode" | "saturation";

export interface MosfetEvalResult {
  region: MosfetRegion;
  /** Drain current magnitude in milliamperes (mA) */
  drainCurrentMa: number;
  /** Overdrive voltage |Vgs| - |Vth| in Volts */
  overdriveV: number;
}

export interface CmosParams {
  /** Supply voltage VDD in Volts */
  vdd: number;
  /** NMOS threshold voltage Vthn in Volts (> 0) */
  vthN: number;
  /** PMOS threshold voltage magnitude |Vthp| in Volts (> 0) */
  vthP: number;
  /** NMOS transconductance parameter kn in mA/V^2 */
  knMaV2: number;
  /** PMOS transconductance parameter kp in mA/V^2 */
  kpMaV2: number;
  /** Load capacitance CL in femtofarads (fF) */
  loadCapFf: number;
  /** Switching frequency f in GHz */
  frequencyGhz: number;
  /** Activity factor alpha (0..1) */
  activityFactor: number;
}

export interface VtcPoint {
  vin: number;
  vout: number;
  crowbarMa: number;
  nmosRegion: MosfetRegion;
  pmosRegion: MosfetRegion;
}

export interface CmosOperatingPoint {
  vin: number;
  vout: number;
  nmos: MosfetEvalResult;
  pmos: MosfetEvalResult;
  crowbarCurrentMa: number;
  staticPowerMw: number;
}

export interface CmosSimulationResult {
  /** Analytical/VTC switching threshold V_M where Vout = Vin */
  switchingThresholdV: number;
  /** Noise margin high NM_H = V_DD - V_IH (simplified V_M bound or unity-gain) */
  noiseMarginHighV: number;
  /** Noise margin low NM_L = V_IL */
  noiseMarginLowV: number;
  /** Peak crowbar (shoot-through) current near V_M in mA */
  peakCrowbarMa: number;
  /** Dynamic switching power P = alpha * C * Vdd^2 * f in mW */
  dynamicPowerMw: number;
  /** Sampled Voltage Transfer Characteristic curve */
  vtc: VtcPoint[];
  /** Operating point at the queried Vin */
  operatingPoint: CmosOperatingPoint;
}

/**
 * Evaluates an NMOS transistor using the square-law Shichman-Hodges model.
 */
export function evaluateNmos(
  vgs: number,
  vds: number,
  vthN: number,
  knMaV2: number,
  lambda = 0
): MosfetEvalResult {
  const overdrive = vgs - vthN;
  if (overdrive <= 0 || vds <= 0) {
    return { region: "cutoff", drainCurrentMa: 0, overdriveV: overdrive };
  }
  if (vds < overdrive) {
    const id = knMaV2 * (overdrive * vds - 0.5 * vds * vds) * (1 + lambda * vds);
    return { region: "triode", drainCurrentMa: Math.max(0, id), overdriveV: overdrive };
  }
  const id = 0.5 * knMaV2 * overdrive * overdrive * (1 + lambda * vds);
  return { region: "saturation", drainCurrentMa: Math.max(0, id), overdriveV: overdrive };
}

/**
 * Evaluates a PMOS transistor in terms of source-gate (Vsg) and source-drain (Vsd) voltages.
 */
export function evaluatePmos(
  vsg: number,
  vsd: number,
  absVthP: number,
  kpMaV2: number,
  lambda = 0
): MosfetEvalResult {
  const overdrive = vsg - absVthP;
  if (overdrive <= 0 || vsd <= 0) {
    return { region: "cutoff", drainCurrentMa: 0, overdriveV: overdrive };
  }
  if (vsd < overdrive) {
    const id = kpMaV2 * (overdrive * vsd - 0.5 * vsd * vsd) * (1 + lambda * vsd);
    return { region: "triode", drainCurrentMa: Math.max(0, id), overdriveV: overdrive };
  }
  const id = 0.5 * kpMaV2 * overdrive * overdrive * (1 + lambda * vsd);
  return { region: "saturation", drainCurrentMa: Math.max(0, id), overdriveV: overdrive };
}

const CMOS_LAMBDA = 0.04;

/**
 * Solves CMOS inverter Vout(Vin) by finding the root of Id_nmos(Vin, Vout) - Id_pmos(Vin, Vout) = 0.
 */
export function solveCmosOutputVoltage(vin: number, params: CmosParams): CmosOperatingPoint {
  const { vdd, vthN, vthP, knMaV2, kpMaV2 } = params;
  const clampedVin = Math.max(0, Math.min(vdd, vin));

  const nmosOff = clampedVin <= vthN;
  const pmosOff = vdd - clampedVin <= vthP;

  let vout: number;
  if (nmosOff && !pmosOff) {
    vout = vdd;
  } else if (pmosOff && !nmosOff) {
    vout = 0;
  } else if (nmosOff && pmosOff) {
    vout = clampedVin < vdd / 2 ? vdd : 0;
  } else {
    // Both devices conduct: channel-length modulation ensures f(vout) = Idn - Idp is strictly increasing
    let lo = 0;
    let hi = vdd;
    for (let i = 0; i < 52; i++) {
      const mid = 0.5 * (lo + hi);
      const idn = evaluateNmos(clampedVin, mid, vthN, knMaV2, CMOS_LAMBDA).drainCurrentMa;
      const idp = evaluatePmos(vdd - clampedVin, vdd - mid, vthP, kpMaV2, CMOS_LAMBDA).drainCurrentMa;
      if (idn > idp) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    vout = 0.5 * (lo + hi);
  }

  const nmos = evaluateNmos(clampedVin, vout, vthN, knMaV2, CMOS_LAMBDA);
  const pmos = evaluatePmos(vdd - clampedVin, vdd - vout, vthP, kpMaV2, CMOS_LAMBDA);
  const crowbarCurrentMa = Math.min(nmos.drainCurrentMa, pmos.drainCurrentMa);

  return {
    vin: clampedVin,
    vout,
    nmos,
    pmos,
    crowbarCurrentMa,
    staticPowerMw: vdd * crowbarCurrentMa,
  };
}

/**
 * Computes analytical CMOS inverter switching threshold V_M (both transistors saturated at Vout = Vin).
 */
export function computeSwitchingThreshold(params: CmosParams): number {
  const { vdd, vthN, vthP, knMaV2, kpMaV2 } = params;
  const ratio = Math.sqrt(Math.max(1e-9, knMaV2) / Math.max(1e-9, kpMaV2));
  const vm = (vdd - vthP + ratio * vthN) / (1 + ratio);
  return Math.max(0, Math.min(vdd, vm));
}

/**
 * Runs full CMOS inverter VTC sweep, noise margins, crowbar current, and dynamic power calculation.
 */
export function simulateCmosInverter(
  params: CmosParams,
  vin: number,
  samples = 60
): CmosSimulationResult {
  const vtc: VtcPoint[] = [];
  const count = Math.max(20, samples);
  let peakCrowbarMa = 0;

  for (let i = 0; i <= count; i++) {
    const v = (params.vdd * i) / count;
    const pt = solveCmosOutputVoltage(v, params);
    if (pt.crowbarCurrentMa > peakCrowbarMa) {
      peakCrowbarMa = pt.crowbarCurrentMa;
    }
    vtc.push({
      vin: pt.vin,
      vout: pt.vout,
      crowbarMa: pt.crowbarCurrentMa,
      nmosRegion: pt.nmos.region,
      pmosRegion: pt.pmos.region,
    });
  }

  // Also check exact switching threshold V_M for peak crowbar accuracy
  const switchingThresholdV = computeSwitchingThreshold(params);
  const vmPoint = solveCmosOutputVoltage(switchingThresholdV, params);
  if (vmPoint.crowbarCurrentMa > peakCrowbarMa) {
    peakCrowbarMa = vmPoint.crowbarCurrentMa;
  }

  // Estimate V_IL and V_IH using unity-gain slope dVout/dVin <= -1
  let vil = 0;
  let vih = params.vdd;
  for (let i = 1; i < vtc.length; i++) {
    const dv = vtc[i].vin - vtc[i - 1].vin;
    const slope = dv > 0 ? (vtc[i].vout - vtc[i - 1].vout) / dv : 0;
    if (slope <= -1) {
      if (vil === 0) vil = vtc[i - 1].vin;
      vih = vtc[i].vin;
    }
  }

  const noiseMarginLowV = Math.max(0, vil);
  const noiseMarginHighV = Math.max(0, params.vdd - vih);

  // Dynamic power P = alpha * C * Vdd^2 * f
  // C in F = loadCapFf * 1e-15; f in Hz = frequencyGhz * 1e9
  // P in Watts = alpha * C_fF * f_GHz * Vdd^2 * 1e-6; in mW = * 1e-3
  const dynamicPowerMw =
    params.activityFactor *
    params.loadCapFf *
    params.frequencyGhz *
    params.vdd *
    params.vdd *
    1e-3;

  const operatingPoint = solveCmosOutputVoltage(vin, params);

  return {
    switchingThresholdV,
    noiseMarginHighV,
    noiseMarginLowV,
    peakCrowbarMa,
    dynamicPowerMw,
    vtc,
    operatingPoint,
  };
}
