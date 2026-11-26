import { describe, expect, it } from "vitest";
import {
  createEventLoopTrace,
  simulatePythonCopy,
  simulateRustOwnership,
} from "../runtimeMemoryEventLoop";
import {
  computeBinaryInfoMetrics,
  computeNumericalDerivative,
  generateStepSweep,
} from "../calculusEntropy";

describe("runtimeMemoryEventLoop engine", () => {
  it("enforces Rust move, shared borrow, mut borrow, and clone invariants", () => {
    const moved = simulateRustOwnership("move");
    expect(moved.aValid).toBe(false);
    expect(moved.useAAllowed).toBe(false);
    expect(moved.heapAllocations).toBe(1);

    const shared = simulateRustOwnership("shared-borrow");
    expect(shared.aValid).toBe(true);
    expect(shared.useAAllowed).toBe(true);
    expect(shared.mutateAAllowed).toBe(false);
    expect(shared.sharedBorrows).toBe(1);

    const mutBorrow = simulateRustOwnership("mut-borrow");
    expect(mutBorrow.mutBorrows).toBe(1);
    expect(mutBorrow.useAAllowed).toBe(false);
    expect(mutBorrow.mutateAAllowed).toBe(false);

    const cloned = simulateRustOwnership("clone");
    expect(cloned.heapAllocations).toBe(2);
    expect(cloned.useAAllowed).toBe(true);
    expect(cloned.mutateAAllowed).toBe(true);
  });

  it("distinguishes Python alias, shallow copy, and deep copy under nested mutation", () => {
    const aliasInner = simulatePythonCopy("alias", "mutate-inner");
    expect(aliasInner.outerShared).toBe(true);
    expect(aliasInner.innerShared).toBe(true);
    expect(aliasInner.a).toEqual([[7]]);
    expect(aliasInner.b).toEqual([[7]]);

    const shallowOuter = simulatePythonCopy("shallow", "append-outer");
    expect(shallowOuter.idA).not.toBe(shallowOuter.idB);
    expect(shallowOuter.a).toEqual([[1]]);
    expect(shallowOuter.b).toEqual([[1], 2]);

    const shallowInner = simulatePythonCopy("shallow", "mutate-inner");
    expect(shallowInner.idA0).toBe(shallowInner.idB0);
    expect(shallowInner.a).toEqual([[7]]);

    const deepInner = simulatePythonCopy("deep", "mutate-inner");
    expect(deepInner.idA0).not.toBe(deepInner.idB0);
    expect(deepInner.a).toEqual([[1]]);
    expect(deepInner.b).toEqual([[7]]);
  });

  it("orders JS/TS microtasks before macrotasks in main script vs inside timer", () => {
    const mainTrace = createEventLoopTrace("promise-in-main");
    expect(mainTrace[mainTrace.length - 1].consoleOutput).toEqual([
      "A",
      "B",
      "promise",
      "timer",
    ]);

    const timerTrace = createEventLoopTrace("promise-in-timer");
    expect(timerTrace[timerTrace.length - 1].consoleOutput).toEqual([
      "A",
      "B",
      "timer",
      "promise",
    ]);
  });
});

describe("calculusEntropy engine", () => {
  it("demonstrates O(h^2) central difference accuracy vs O(h) forward difference and cancellation at tiny h", () => {
    const fwd = computeNumericalDerivative("x3", 2, 1e-3, "forward");
    const cen = computeNumericalDerivative("x3", 2, 1e-3, "central");
    expect(cen.exact).toBeCloseTo(12, 10);
    expect(cen.absError).toBeLessThan(fwd.absError);
    expect(cen.absError).toBeLessThan(1e-5);

    const sweep = generateStepSweep("sin", 1.0);
    const at1e4 = sweep.find((p) => p.exponent === -4)!;
    const at1e12 = sweep.find((p) => p.exponent === -12)!;
    // IEEE-754 cancellation makes error worse at h=1e-12 than at h=1e-4 for central diff
    expect(at1e12.centralError).toBeGreaterThan(at1e4.centralError);
  });

  it("computes H(0.5) = 1 bit, boundary entropies = 0, and D_KL(p || p) = 0", () => {
    const fair = computeBinaryInfoMetrics(0.5, 0.5);
    expect(fair.entropy).toBeCloseTo(1, 10);
    expect(fair.crossEntropy).toBeCloseTo(1, 10);
    expect(fair.klDivergence).toBeCloseTo(0, 10);

    const zero = computeBinaryInfoMetrics(0, 0.25);
    expect(zero.entropy).toBe(0);

    const one = computeBinaryInfoMetrics(1, 0.8);
    expect(one.entropy).toBe(0);

    const mismatch = computeBinaryInfoMetrics(0.2, 0.8);
    expect(mismatch.crossEntropy).toBeGreaterThan(mismatch.entropy);
    expect(mismatch.klDivergence).toBeCloseTo(
      mismatch.crossEntropy - mismatch.entropy,
      10
    );
  });
});
