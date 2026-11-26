import { describe, expect, it } from "vitest";
import {
  ELEMENTARY_CHARGE_C,
  evaluateShockleyDiode,
  simulateChargeDrift,
} from "@/lib/simulators/pnDiodeCharge";
import {
  parseQuantumGateSequence,
  simulatePoissonDieYield,
  simulateQuantumInterference,
} from "@/lib/simulators/chipletYieldQubit";

describe("PN Junction, Charge Drift & Shockley Diode Engine", () => {
  it("computes exact current I = Q/t, carrier count N = Q/e, and drift directions", () => {
    const electronRes = simulateChargeDrift({
      chargeCoulombs: 6,
      timeSeconds: 2,
      carrierType: "electron",
    });
    expect(electronRes.currentAmps).toBeCloseTo(3, 8);
    expect(electronRes.carrierCount).toBeCloseTo(6 / ELEMENTARY_CHARGE_C, 5);
    expect(electronRes.driftDirection).toBe("left");
    expect(electronRes.conventionalDirection).toBe("right");

    const holeRes = simulateChargeDrift({
      chargeCoulombs: 4,
      timeSeconds: 0.5,
      carrierType: "hole",
    });
    expect(holeRes.currentAmps).toBeCloseTo(8, 8);
    expect(holeRes.driftDirection).toBe("right");
  });

  it("evaluates Shockley diode forward exponential current and reverse saturation", () => {
    const rev = evaluateShockleyDiode({ biasVoltage: -0.5 });
    expect(rev.regime).toBe("reverse");
    expect(rev.currentAmps).toBeLessThan(0);
    expect(rev.currentAmps).toBeCloseTo(-1e-12, 16);

    const eq = evaluateShockleyDiode({ biasVoltage: 0 });
    expect(eq.regime).toBe("equilibrium");
    expect(eq.currentAmps).toBeCloseTo(0, 16);

    const fwd = evaluateShockleyDiode({ biasVoltage: 0.65 });
    expect(fwd.regime).toBe("forward");
    expect(fwd.currentAmps).toBeGreaterThan(0.01);
    expect(fwd.depletionWidthUm).toBeLessThan(rev.depletionWidthUm);
  });
});

describe("Poisson Die Yield & Single-Qubit Quantum Interference Engine", () => {
  it("shows strict Poisson tile yield monotonicity with chiplet partitioning", () => {
    const mono = simulatePoissonDieYield({
      totalAreaCm2: 8,
      defectDensityPerCm2: 0.5,
      tileCount: 1,
    });
    const quad = simulatePoissonDieYield({
      totalAreaCm2: 8,
      defectDensityPerCm2: 0.5,
      tileCount: 4,
    });
    const sixteen = simulatePoissonDieYield({
      totalAreaCm2: 8,
      defectDensityPerCm2: 0.5,
      tileCount: 16,
    });

    expect(mono.monolithicYield).toBeCloseTo(Math.exp(-4), 6);
    expect(mono.tileYield).toBeCloseTo(mono.monolithicYield, 6);
    expect(quad.tileYield).toBeGreaterThan(mono.tileYield);
    expect(sixteen.tileYield).toBeGreaterThan(quad.tileYield);
    expect(sixteen.tileYield).toBeGreaterThan(0.75);
  });

  it("proves H Z H |0> = |1> (P(1)=1) and H H |0> = |0> (P(0)=1)", () => {
    const hzh = simulateQuantumInterference(parseQuantumGateSequence("H Z H"));
    expect(hzh.finalState.prob0).toBeCloseTo(0, 8);
    expect(hzh.finalState.prob1).toBeCloseTo(1, 8);

    const hh = simulateQuantumInterference(parseQuantumGateSequence("H H"));
    expect(hh.finalState.prob0).toBeCloseTo(1, 8);
    expect(hh.finalState.prob1).toBeCloseTo(0, 8);
  });
});
