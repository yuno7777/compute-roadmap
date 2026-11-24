import { describe, expect, it } from "vitest";
import {
  buildMvpMatrix,
  computeBarycentric,
  mat4TransformVec4,
  rasterizeScene,
  vec3,
  type Triangle3D,
} from "../graphicsRasterizer";
import {
  analyzeSharedMemoryBanks,
  simulateGlobalMemoryCoalescing,
  simulateWarpExecution,
  WARP_PROGRAM_PRESETS,
} from "../gpuWarp";
import {
  computeNumericalGradients,
  createMlpState,
  evaluateBatch,
  stepMlpEpoch,
} from "../neuralBackprop";
import { runScaledDotProductAttention } from "../transformerAttention";
import {
  computeKvCacheBytes,
  computeLlmCapacityAndRoofline,
  generateSampleWeights,
  quantizeWeights,
} from "../quantizationKvCache";

describe("1. graphicsRasterizer", () => {
  it("transforms 3D points through the 4x4 MVP matrix with positive perspective w", () => {
    const mvp = buildMvpMatrix(
      { yawDeg: 0, pitchDeg: 0, distance: 4, fovDeg: 60, near: 0.1, far: 100 },
      1.5
    );
    const center = mat4TransformVec4(mvp, { x: 0, y: 0, z: 0, w: 1 });
    expect(center.w).toBeCloseTo(4, 5);
    expect(center.x / center.w).toBeCloseTo(0, 5);
    expect(center.y / center.w).toBeCloseTo(0, 5);

    const closer = mat4TransformVec4(mvp, { x: 0, y: 0, z: 1, w: 1 });
    const farther = mat4TransformVec4(mvp, { x: 0, y: 0, z: -1, w: 1 });
    expect(closer.z / closer.w).toBeLessThan(farther.z / farther.w);
  });

  it("correctly classifies inside/outside points with barycentric edge functions", () => {
    // Triangle (0,0), (10,0), (0,10)
    const inside = computeBarycentric(0, 0, 10, 0, 0, 10, 2, 2);
    expect(inside.inside).toBe(true);
    expect(inside.w0 + inside.w1 + inside.w2).toBeCloseTo(1, 6);
    expect(inside.w0).toBeCloseTo(0.6, 5);
    expect(inside.w1).toBeCloseTo(0.2, 5);
    expect(inside.w2).toBeCloseTo(0.2, 5);

    const outside = computeBarycentric(0, 0, 10, 0, 0, 10, 8, 8);
    expect(outside.inside).toBe(false);
    expect(outside.w0).toBeLessThan(0);
  });

  it("enforces Z-buffer depth occlusion regardless of triangle submission order", () => {
    const farTri: Triangle3D = {
      id: "far",
      label: "Far",
      v0: { position: vec3(-1, -1, -0.5), normal: vec3(0, 0, 1), color: vec3(1, 0, 0) },
      v1: { position: vec3(1, -1, -0.5), normal: vec3(0, 0, 1), color: vec3(1, 0, 0) },
      v2: { position: vec3(0, 1, -0.5), normal: vec3(0, 0, 1), color: vec3(1, 0, 0) },
    };
    const nearTri: Triangle3D = {
      id: "near",
      label: "Near",
      v0: { position: vec3(-1, -1, 0.5), normal: vec3(0, 0, 1), color: vec3(0, 1, 0) },
      v1: { position: vec3(1, -1, 0.5), normal: vec3(0, 0, 1), color: vec3(0, 1, 0) },
      v2: { position: vec3(0, 1, 0.5), normal: vec3(0, 0, 1), color: vec3(0, 1, 0) },
    };

    const res = rasterizeScene(
      {
        width: 80,
        height: 80,
        camera: { yawDeg: 0, pitchDeg: 0, distance: 3.5, fovDeg: 50, near: 0.2, far: 50 },
        depthTest: true,
        wireframe: false,
        phongShading: false,
        depthPrecisionBits: 24,
        sceneId: "pyramid-occlusion",
      },
      // Submit near first, then far second -> far MUST NOT overwrite near
      [nearTri, farTri]
    );

    const centerIdx = 40 * 80 + 40;
    expect(res.triangleIdBuffer[centerIdx]).toBe(0); // nearTri index
  });

  it("demonstrates Z-fighting with tiny near plane and resolves it when near increases", () => {
    const baseConfig = {
      width: 120,
      height: 90,
      depthTest: true,
      wireframe: false,
      phongShading: true,
      depthPrecisionBits: 16 as const,
      sceneId: "z-fighting" as const,
      zOffset: 0.002,
    };

    const broken = rasterizeScene({
      ...baseConfig,
      camera: { yawDeg: 18, pitchDeg: 10, distance: 4.5, fovDeg: 50, near: 0.001, far: 5000 },
    });
    const fixed = rasterizeScene({
      ...baseConfig,
      camera: { yawDeg: 18, pitchDeg: 10, distance: 4.5, fovDeg: 50, near: 0.8, far: 40 },
    });

    expect(broken.zFightingOverlapPixels).toBeGreaterThan(0);
    expect(fixed.zFightingOverlapPixels).toBe(0);
  });
});

describe("2. gpuWarp", () => {
  it("serializes nested if/else divergent branches across 32 SIMT lanes", () => {
    const nested = WARP_PROGRAM_PRESETS.find((p) => p.id === "nested-if-else")!;
    const uniform = WARP_PROGRAM_PRESETS.find((p) => p.id === "uniform-warp")!;

    const nestedRes = simulateWarpExecution(nested.statements, nested.title);
    const uniformRes = simulateWarpExecution(uniform.statements, uniform.title);

    // Nested has: LDG (1) + MUL (1) + FMA (1, 8 lanes) + ADD (1, 8 lanes) + SUB (1, 16 lanes) + STG (1) = 6 cycles
    // Ideal longest uniform path = LDG (1) + MUL (1) + FMA (1) + STG (1) = 4 cycles -> +2 penalty cycles
    expect(nestedRes.totalCycles).toBe(6);
    expect(nestedRes.idealNonDivergentCycles).toBe(4);
    expect(nestedRes.serializationPenaltyCycles).toBe(2);
    expect(nestedRes.divergentBranchCount).toBe(2);
    expect(nestedRes.warpEfficiency).toBeLessThan(1);

    expect(uniformRes.serializationPenaltyCycles).toBe(0);
    expect(uniformRes.divergentBranchCount).toBe(0);
    expect(uniformRes.warpEfficiency).toBeCloseTo(1, 6);
  });

  it("shows 4x+ global memory transaction reduction from AoS strided to SoA coalesced", () => {
    const soa = simulateGlobalMemoryCoalescing({
      layout: "SoA",
      strideBytes: 4,
      elementBytes: 4,
    });
    const aos = simulateGlobalMemoryCoalescing({
      layout: "AoS",
      strideBytes: 16,
      elementBytes: 4,
    });

    // 32 lanes * 4B = 128B -> 1 transaction at 100% bus utilization
    expect(soa.transactions128B).toBe(1);
    expect(soa.busUtilization).toBeCloseTo(1, 6);

    // 32 lanes * 16B stride = 512B -> 4 transactions at 25% bus utilization
    expect(aos.transactions128B).toBe(4);
    expect(aos.busUtilization).toBeCloseTo(0.25, 6);
    expect(aos.transactions128B / soa.transactions128B).toBe(4);
  });

  it("detects 32-way shared-memory bank conflicts and resolves them with +1 padding", () => {
    const conflicted = analyzeSharedMemoryBanks({ strideWords: 32, paddingWords: 0 });
    expect(conflicted.conflictWay).toBe(32);
    expect(conflicted.serialTransactions).toBe(32);

    const padded = analyzeSharedMemoryBanks({ strideWords: 32, paddingWords: 1 });
    expect(padded.conflictWay).toBe(1);
    expect(padded.serialTransactions).toBe(1);
  });
});

describe("3. neuralBackprop", () => {
  it("decreases XOR training loss monotonically and solves XOR classification", () => {
    let state = createMlpState({
      dataset: "xor",
      hiddenWidth: 6,
      activation: "tanh",
      learningRate: 0.5,
      l2Reg: 0.0001,
      seed: 42,
    });

    const initialLoss = state.lastBatchLoss;
    let prevLoss = initialLoss;
    let nonIncreasingSteps = 0;

    for (let i = 0; i < 160; i++) {
      state = stepMlpEpoch(state, 1);
      if (state.lastBatchLoss <= prevLoss + 1e-6) {
        nonIncreasingSteps++;
      }
      prevLoss = state.lastBatchLoss;
    }

    expect(nonIncreasingSteps).toBe(160);
    expect(state.lastBatchLoss).toBeLessThan(initialLoss * 0.25);
    expect(state.lastAccuracy).toBeGreaterThanOrEqual(0.95);
  });

  it("matches analytical backpropagation gradients with numerical finite-difference within 1e-4", () => {
    const state = createMlpState({
      dataset: "xor",
      hiddenWidth: 4,
      activation: "tanh",
      learningRate: 0.2,
      l2Reg: 0.01,
      seed: 99,
    });

    const analytical = evaluateBatch(
      state.weights,
      state.dataset,
      state.config.activation,
      state.config.l2Reg
    ).gradients;

    const numerical = computeNumericalGradients(
      state.weights,
      state.dataset,
      state.config.activation,
      state.config.l2Reg,
      1e-5
    );

    expect(Math.abs(analytical.db2 - numerical.db2)).toBeLessThan(1e-4);
    for (let h = 0; h < state.config.hiddenWidth; h++) {
      expect(Math.abs(analytical.dW2[h] - numerical.dW2[h])).toBeLessThan(1e-4);
      expect(Math.abs(analytical.db1[h] - numerical.db1[h])).toBeLessThan(1e-4);
      expect(Math.abs(analytical.dW1[h][0] - numerical.dW1[h][0])).toBeLessThan(1e-4);
      expect(Math.abs(analytical.dW1[h][1] - numerical.dW1[h][1])).toBeLessThan(1e-4);
    }
  });
});

describe("4. transformerAttention", () => {
  it("produces softmax attention rows summing to 1.0 and zeroes strictly future tokens when causalMask is enabled", () => {
    const res = runScaledDotProductAttention({
      prompt: "The quick cat sat on the mat",
      dk: 32,
      numHeads: 4,
      selectedHead: 0,
      useScaling: true,
      temperature: 1.0,
      causalMask: true,
      posEncoding: "sinusoidal",
    });

    const weights = res.activeHead.attentionWeights;
    const n = res.tokens.length;
    expect(weights.length).toBe(n);

    for (let i = 0; i < n; i++) {
      const rowSum = weights[i].reduce((a, b) => a + b, 0);
      expect(rowSum).toBeCloseTo(1.0, 6);
      for (let j = i + 1; j < n; j++) {
        expect(weights[i][j]).toBe(0);
      }
    }
  });

  it("shows lower entropy (softmax saturation) when 1/sqrt(dk) scaling is disabled at large dk", () => {
    const scaled = runScaledDotProductAttention({
      prompt: "The river bank flooded near the money bank",
      dk: 64,
      numHeads: 4,
      selectedHead: 0,
      useScaling: true,
      temperature: 1.0,
      causalMask: false,
      posEncoding: "rope",
    });

    const unscaled = runScaledDotProductAttention({
      prompt: "The river bank flooded near the money bank",
      dk: 64,
      numHeads: 4,
      selectedHead: 0,
      useScaling: false,
      temperature: 1.0,
      causalMask: false,
      posEncoding: "rope",
    });

    expect(unscaled.activeHead.meanEntropyBits).toBeLessThan(
      scaled.activeHead.meanEntropyBits
    );
    expect(unscaled.activeHead.meanMaxWeight).toBeGreaterThan(
      scaled.activeHead.meanMaxWeight
    );
  });
});

describe("5. quantizationKvCache", () => {
  it("quantizes weights across FP16/INT8/INT4 with strictly increasing quantization error and accurate SQNR", () => {
    const weights = generateSampleWeights(256, true, 2025);
    const fp32 = quantizeWeights(weights, "FP32");
    const fp16 = quantizeWeights(weights, "FP16");
    const int8 = quantizeWeights(weights, "INT8_SYM");
    const int4 = quantizeWeights(weights, "INT4_GROUP", 32);

    expect(fp32.mse).toBe(0);
    expect(fp16.mse).toBeGreaterThan(0);
    expect(fp16.mse).toBeLessThan(int8.mse);
    expect(int8.mse).toBeLessThan(int4.mse);

    expect(fp16.sqnrDb).toBeGreaterThan(int8.sqnrDb);
    expect(int8.sqnrDb).toBeGreaterThan(int4.sqnrDb);
    expect(int4.compressionRatioVsFp32).toBe(8);
  });

  it("computes exact KV-cache bytes (2 * L * n_kv * d_head * S * B * bytes) and fits 70B @ 32k inside 80GB via GQA + INT4", () => {
    // Llama-3 70B: L=80, n_q=64, n_kv=8, d_head=128, S=32768, B=1, FP16 (2 bytes)
    const expectedBytes = 2 * 80 * 8 * 128 * 32768 * 1 * 2; // 10,737,418,240 bytes (10 GiB)
    const exactBytes = computeKvCacheBytes({
      numLayers: 80,
      numKvHeads: 8,
      headDim: 128,
      seqLen: 32768,
      batchSize: 1,
      kvBytesPerElement: 2,
    });
    expect(exactBytes).toBe(expectedBytes);

    const fp16Result = computeLlmCapacityAndRoofline({
      paramsBillions: 70,
      numLayers: 80,
      numQueryHeads: 64,
      numKvHeads: 8,
      headDim: 128,
      seqLen: 32768,
      batchSize: 1,
      weightFormat: "FP16",
      kvFormat: "FP16",
      hbmLimitGb: 80,
      gpuTflopsFp16: 989,
      gpuBandwidthGbs: 3350,
    });
    expect(fp16Result.fitsInHbm).toBe(false);
    expect(fp16Result.gqaCompressionRatio).toBe(8);

    const int4Result = computeLlmCapacityAndRoofline({
      paramsBillions: 70,
      numLayers: 80,
      numQueryHeads: 64,
      numKvHeads: 8,
      headDim: 128,
      seqLen: 32768,
      batchSize: 1,
      weightFormat: "INT4_GROUP",
      kvFormat: "FP8",
      hbmLimitGb: 80,
      gpuTflopsFp16: 989,
      gpuBandwidthGbs: 3350,
    });
    expect(int4Result.fitsInHbm).toBe(true);
    expect(int4Result.decodeIsMemoryBound).toBe(true);
    expect(int4Result.prefillTokensPerSec).toBeGreaterThan(
      int4Result.decodeTokensPerSec
    );
  });
});
