import { describe, expect, it } from "vitest";
import { runBpeTokenizer } from "../bpeTokenizer";
import {
  computeChinchillaScaling,
  evaluateLlmObjective,
} from "../llmObjective";

describe("bpeTokenizer", () => {
  it('executes the exact educational merge sequence and token reduction on "banana band"', () => {
    const s0 = runBpeTokenizer({ text: "banana band", mode: "fixed", step: 0 });
    expect(s0.tokenCount).toBe(11);
    expect(s0.tokens).toEqual([
      "b",
      "a",
      "n",
      "a",
      "n",
      "a",
      " ",
      "b",
      "a",
      "n",
      "d",
    ]);

    const s1 = runBpeTokenizer({ text: "banana band", mode: "fixed", step: 1 });
    expect(s1.tokens).toEqual(["ba", "n", "a", "n", "a", " ", "ba", "n", "d"]);
    expect(s1.tokenCount).toBe(9);

    const s2 = runBpeTokenizer({ text: "banana band", mode: "fixed", step: 2 });
    expect(s2.tokens).toEqual(["ba", "na", "na", " ", "ba", "n", "d"]);
    expect(s2.tokenCount).toBe(7);

    const s4 = runBpeTokenizer({ text: "banana band", mode: "fixed", step: 4 });
    expect(s4.tokens).toEqual(["ba", "nana", " ", "ban", "d"]);
    expect(s4.tokenCount).toBe(5);
    expect(s4.compressionRatio).toBeCloseTo(11 / 5, 6);
  });

  it("greedily merges frequent pairs in dynamic BPE mode to compress repetitive code below 0.5 tokens/char", () => {
    const snippet = "return return function(val) { return val + val; }";
    const s0 = runBpeTokenizer({ text: snippet, mode: "dynamic", step: 0 });
    const sMax = runBpeTokenizer({
      text: snippet,
      mode: "dynamic",
      step: s0.maxSteps,
    });

    expect(s0.maxSteps).toBeGreaterThan(3);
    expect(sMax.tokenCount).toBeLessThan(s0.tokenCount);
    expect(sMax.tokensPerChar).toBeLessThan(0.55);

    const low = "low lower lowest low lower";
    const l0 = runBpeTokenizer({ text: low, mode: "dynamic", step: 0 });
    const lMax = runBpeTokenizer({ text: low, mode: "dynamic", step: l0.maxSteps });
    expect(lMax.tokensPerChar).toBeLessThan(0.45);
  });
});

describe("llmObjective", () => {
  it("computes exact NLL bits (1 bit at p=0.5, 3 bits at p=0.125)", () => {
    const half = evaluateLlmObjective({
      pThetaA: 0.5,
      pRefA: 0.5,
      rewardA: 1,
      rewardB: 1,
      beta: 0.1,
    });
    expect(half.nllBitsA).toBeCloseTo(1.0, 6);

    const eighth = evaluateLlmObjective({
      pThetaA: 0.125,
      pRefA: 0.5,
      rewardA: 1,
      rewardB: 2,
      beta: 0.1,
    });
    expect(eighth.nllBitsA).toBeCloseTo(3.0, 6);
  });

  it("computes linear expected reward and zero KL penalty when pTheta === pRef", () => {
    const r02 = evaluateLlmObjective({
      pThetaA: 0.2,
      pRefA: 0.2,
      rewardA: 2.5,
      rewardB: -0.5,
      beta: 0.5,
    });
    const r08 = evaluateLlmObjective({
      pThetaA: 0.8,
      pRefA: 0.8,
      rewardA: 2.5,
      rewardB: -0.5,
      beta: 0.5,
    });

    expect(r02.expectedReward).toBeCloseTo(0.2 * 2.5 + 0.8 * -0.5, 6);
    expect(r08.expectedReward).toBeCloseTo(0.8 * 2.5 + 0.2 * -0.5, 6);
    // Midpoint check for linearity
    const r05 = evaluateLlmObjective({
      pThetaA: 0.5,
      pRefA: 0.5,
      rewardA: 2.5,
      rewardB: -0.5,
      beta: 0.5,
    });
    expect(r05.expectedReward).toBeCloseTo(
      0.5 * (r02.expectedReward + r08.expectedReward),
      6
    );

    expect(r02.klDivergenceNats).toBeCloseTo(0, 8);
    expect(r02.klPenaltyNats).toBeCloseTo(0, 8);
    expect(r02.rlhfObjective).toBeCloseTo(r02.expectedReward, 8);
  });

  it("flags policy-reward disagreement and computes Chinchilla ~20 tokens/param optimum", () => {
    const res = evaluateLlmObjective({
      pThetaA: 0.75,
      pRefA: 0.5,
      rewardA: -1,
      rewardB: 2,
      beta: 0.2,
    });
    expect(res.mostProbableCandidate).toBe("A");
    expect(res.chosenCandidate).toBe("B");
    expect(res.policyRewardDisagreement).toBe(true);

    const opt = computeChinchillaScaling({
      log10Flops: 23,
      paramsBillions: Math.sqrt(1e23 / 120) / 1e9,
    });
    expect(opt.tokensPerParam).toBeCloseTo(20, 3);
    expect(opt.isNearOptimal).toBe(true);
  });
});
