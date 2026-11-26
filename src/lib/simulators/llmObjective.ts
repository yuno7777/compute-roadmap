export interface LlmObjectiveConfig {
  /** Policy probability p_theta(A) in [0.01, 0.99]; p_theta(B) = 1 - p_theta(A) */
  pThetaA: number;
  /** Reference policy probability p_ref(A) in [0.01, 0.99] */
  pRefA: number;
  /** Scalar reward for candidate A in [-3, 3] */
  rewardA: number;
  /** Scalar reward for candidate B in [-3, 3] */
  rewardB: number;
  /** KL penalty coefficient beta in [0, 2] */
  beta: number;
}

export interface LlmObjectiveCurvePoint {
  p: number;
  expectedReward: number;
  rlhfObjective: number;
  nllBits: number;
}

export interface LlmObjectiveResult {
  pThetaA: number;
  pThetaB: number;
  pRefA: number;
  pRefB: number;
  nllBitsA: number;
  nllNatsA: number;
  policyEntropyBits: number;
  expectedReward: number;
  klDivergenceNats: number;
  klPenaltyNats: number;
  rlhfObjective: number;
  optimalPolicyProbA: number;
  chosenCandidate: "A" | "B" | "Tie";
  mostProbableCandidate: "A" | "B" | "Tie";
  policyRewardDisagreement: boolean;
  dpoImplicitRewardA: number;
  dpoImplicitRewardB: number;
  dpoPreferenceMargin: number;
  dpoLoss: number;
  curve: LlmObjectiveCurvePoint[];
}

export interface ChinchillaScalingConfig {
  /** Compute budget in log10(FLOPs), e.g. 23 -> 1e23 FLOPs */
  log10Flops: number;
  /** Parameter count in Billions */
  paramsBillions: number;
}

export interface ChinchillaScalingResult {
  flops: number;
  paramsN: number;
  tokensD: number;
  tokensPerParam: number;
  predictedLoss: number;
  optimalParamsBillions: number;
  optimalTokensBillions: number;
  optimalLoss: number;
  isNearOptimal: boolean;
}

function clampProb(p: number): number {
  return Math.max(0.01, Math.min(0.99, p));
}

export function computeKlDivergenceNats(
  pThetaA: number,
  pRefA: number
): number {
  const pA = clampProb(pThetaA);
  const pB = 1 - pA;
  const qA = clampProb(pRefA);
  const qB = 1 - qA;
  return pA * Math.log(pA / qA) + pB * Math.log(pB / qB);
}

export function evaluateLlmObjective(
  config: LlmObjectiveConfig
): LlmObjectiveResult {
  const pThetaA = clampProb(config.pThetaA);
  const pThetaB = 1 - pThetaA;
  const pRefA = clampProb(config.pRefA);
  const pRefB = 1 - pRefA;
  const beta = Math.max(0, Math.min(2, config.beta));

  const nllBitsA = -Math.log2(pThetaA);
  const nllNatsA = -Math.log(pThetaA);
  const policyEntropyBits = -(
    pThetaA * Math.log2(pThetaA) +
    pThetaB * Math.log2(pThetaB)
  );

  const expectedReward = pThetaA * config.rewardA + pThetaB * config.rewardB;
  const klDivergenceNats = computeKlDivergenceNats(pThetaA, pRefA);
  const klPenaltyNats = beta * klDivergenceNats;
  const rlhfObjective = expectedReward - klPenaltyNats;

  // Closed-form Gibbs optimal policy: p*(A) propto p_ref(A) * exp(r_A / beta)
  let optimalPolicyProbA: number;
  if (beta < 1e-4) {
    optimalPolicyProbA =
      config.rewardA > config.rewardB
        ? 0.99
        : config.rewardA < config.rewardB
        ? 0.01
        : pRefA;
  } else {
    const logOdds =
      Math.log(pRefA / pRefB) + (config.rewardA - config.rewardB) / beta;
    const rawOpt = 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, logOdds))));
    optimalPolicyProbA = clampProb(rawOpt);
  }

  const chosenCandidate: "A" | "B" | "Tie" =
    Math.abs(config.rewardA - config.rewardB) < 1e-9
      ? "Tie"
      : config.rewardA > config.rewardB
      ? "A"
      : "B";

  const mostProbableCandidate: "A" | "B" | "Tie" =
    Math.abs(pThetaA - 0.5) < 1e-9 ? "Tie" : pThetaA > 0.5 ? "A" : "B";

  const policyRewardDisagreement =
    chosenCandidate !== "Tie" &&
    mostProbableCandidate !== "Tie" &&
    chosenCandidate !== mostProbableCandidate;

  // DPO implicit reward: r_hat(y) = beta * ln(pi_theta(y) / pi_ref(y))
  const dpoImplicitRewardA = beta * Math.log(pThetaA / pRefA);
  const dpoImplicitRewardB = beta * Math.log(pThetaB / pRefB);
  const dpoPreferenceMargin =
    chosenCandidate === "B"
      ? dpoImplicitRewardB - dpoImplicitRewardA
      : dpoImplicitRewardA - dpoImplicitRewardB;
  const dpoLoss = -Math.log(1 / (1 + Math.exp(-dpoPreferenceMargin)));

  // Sample curve across p in [0.02, 0.98]
  const curve: LlmObjectiveCurvePoint[] = [];
  for (let i = 0; i <= 48; i++) {
    const p = 0.02 + (i / 48) * 0.96;
    const expR = p * config.rewardA + (1 - p) * config.rewardB;
    const kl = computeKlDivergenceNats(p, pRefA);
    curve.push({
      p,
      expectedReward: expR,
      rlhfObjective: expR - beta * kl,
      nllBits: -Math.log2(p),
    });
  }

  return {
    pThetaA,
    pThetaB,
    pRefA,
    pRefB,
    nllBitsA,
    nllNatsA,
    policyEntropyBits,
    expectedReward,
    klDivergenceNats,
    klPenaltyNats,
    rlhfObjective,
    optimalPolicyProbA,
    chosenCandidate,
    mostProbableCandidate,
    policyRewardDisagreement,
    dpoImplicitRewardA,
    dpoImplicitRewardB,
    dpoPreferenceMargin,
    dpoLoss,
    curve,
  };
}

/**
 * Hoffmann et al. (Chinchilla) parametric scaling law:
 * L(N, D) = 1.69 + 406.4 / N^0.34 + 410.7 / D^0.28, with C = 6 * N * D.
 */
export function computeChinchillaScaling(
  config: ChinchillaScalingConfig
): ChinchillaScalingResult {
  const flops = Math.pow(10, config.log10Flops);
  const paramsN = Math.max(1e6, config.paramsBillions * 1e9);
  const tokensD = flops / (6 * paramsN);
  const tokensPerParam = tokensD / paramsN;

  const evalLoss = (n: number, d: number) =>
    1.69 + 406.4 / Math.pow(n, 0.34) + 410.7 / Math.pow(d, 0.28);

  const predictedLoss = evalLoss(paramsN, Math.max(1e6, tokensD));

  // Compute-optimal ~20 tokens/param under C = 6 * N * D => N_opt = sqrt(C / 120)
  const optimalN = Math.sqrt(flops / 120);
  const optimalD = 20 * optimalN;
  const optimalLoss = evalLoss(optimalN, optimalD);

  const ratioDelta = Math.abs(Math.log2(tokensPerParam / 20));
  const isNearOptimal = ratioDelta <= 0.45; // roughly 14..27 tokens/param

  return {
    flops,
    paramsN,
    tokensD,
    tokensPerParam,
    predictedLoss,
    optimalParamsBillions: optimalN / 1e9,
    optimalTokensBillions: optimalD / 1e9,
    optimalLoss,
    isNearOptimal,
  };
}
