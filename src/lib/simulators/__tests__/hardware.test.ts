import { describe, expect, it } from "vitest";
import {
  LN_9,
  capacitorVoltageAtTime,
  equivalentResistance,
  simulateOhmCircuit,
} from "@/lib/simulators/ohmCircuit";
import {
  computeSwitchingThreshold,
  evaluateNmos,
  evaluatePmos,
  simulateCmosInverter,
} from "@/lib/simulators/mosfetCmos";
import {
  checkNandPuzzle,
  evaluateGate,
  generateTruthTable,
  getCanonicalNandCircuit,
  simulateRippleAdder4,
  stepDFlipFlop,
} from "@/lib/simulators/logicGates";
import {
  compareFloatAddition,
  decodeBinaryBits,
  encodeFloat32,
  hamming74Decode,
  hamming74Encode,
  hamming74FlipBit,
  inspectInteger,
} from "@/lib/simulators/binaryFloat";
import {
  createRegisterFile,
  executeAlu,
  pulseAluWriteback,
} from "@/lib/simulators/aluRegister";
import {
  CPU_PROGRAM_PRESETS,
  assembleCpuProgram,
  createCpuState,
  runCpuToHalt,
  stepCpuPhase,
} from "@/lib/simulators/cpuFde";
import {
  createMesiState,
  decomposeCacheAddress,
  runCacheTrace,
  stepMesi,
} from "@/lib/simulators/cacheMemory";
import {
  getDefaultPipelineSequence,
  simulatePipeline,
} from "@/lib/simulators/pipelineHazard";

describe("1. Ohm's Law & RC Timing Engine", () => {
  it("computes exact Ohm's law current, power, tau, and 10%-90% rise time", () => {
    const res = simulateOhmCircuit({
      voltage: 5,
      resistance: 1000,
      capacitancePf: 1,
    });
    expect(res.currentA).toBeCloseTo(0.005, 6);
    expect(res.currentMa).toBeCloseTo(5, 6);
    expect(res.powerMw).toBeCloseTo(25, 6);
    expect(res.tauNs).toBeCloseTo(1, 6);
    expect(res.riseTimeNs).toBeCloseTo(LN_9 * 1, 4);
    expect(res.riseTimeNs).toBeCloseTo(2.1972, 4);
    expect(res.meetsChallenge).toBe(true);
  });

  it("computes series and parallel equivalent resistances and RC charging curve", () => {
    expect(equivalentResistance([100, 200, 300], "series")).toBe(600);
    expect(equivalentResistance([100, 100], "parallel")).toBeCloseTo(50, 6);
    const vcAtTau = capacitorVoltageAtTime(10, 1000, 1, 1);
    expect(vcAtTau).toBeCloseTo(10 * (1 - Math.exp(-1)), 5);
  });
});

describe("2. MOSFET & CMOS Inverter Engine", () => {
  it("models NMOS cutoff, triode, and saturation regions accurately", () => {
    expect(evaluateNmos(0.3, 1.0, 0.5, 2).region).toBe("cutoff");
    expect(evaluateNmos(0.3, 1.0, 0.5, 2).drainCurrentMa).toBe(0);

    const triode = evaluateNmos(1.5, 0.4, 0.5, 2);
    expect(triode.region).toBe("triode");
    // kn * ((1.5-0.5)*0.4 - 0.5*0.4^2) = 2 * (0.4 - 0.08) = 0.64 mA
    expect(triode.drainCurrentMa).toBeCloseTo(0.64, 5);

    const sat = evaluateNmos(1.5, 1.5, 0.5, 2);
    expect(sat.region).toBe("saturation");
    // 0.5 * 2 * (1.0)^2 = 1.0 mA
    expect(sat.drainCurrentMa).toBeCloseTo(1.0, 5);

    expect(evaluatePmos(0.2, 1.0, 0.5, 2).region).toBe("cutoff");
  });

  it("produces CMOS VTC inversion, switching threshold near VDD/2, crowbar peak, and dynamic power", () => {
    const params = {
      vdd: 1.8,
      vthN: 0.4,
      vthP: 0.4,
      knMaV2: 4,
      kpMaV2: 4,
      loadCapFf: 100,
      frequencyGhz: 2,
      activityFactor: 0.5,
    };
    const vm = computeSwitchingThreshold(params);
    expect(vm).toBeCloseTo(0.9, 4);

    const simLow = simulateCmosInverter(params, 0.1);
    const simMid = simulateCmosInverter(params, 0.9);
    const simHigh = simulateCmosInverter(params, 1.7);

    expect(simLow.operatingPoint.vout).toBeCloseTo(1.8, 3);
    expect(simMid.operatingPoint.vout).toBeCloseTo(0.9, 2);
    expect(simHigh.operatingPoint.vout).toBeCloseTo(0, 3);
    expect(simMid.operatingPoint.crowbarCurrentMa).toBeGreaterThan(
      simLow.operatingPoint.crowbarCurrentMa
    );
    expect(simMid.peakCrowbarMa).toBeGreaterThan(0.4);
    // P = 0.5 * 100fF * (1.8)^2 * 2GHz = 0.324 mW
    expect(simMid.dynamicPowerMw).toBeCloseTo(0.324, 5);
  });
});

describe("3. Digital Logic Gates, Adder & D-Flip-Flop Engine", () => {
  it("evaluates gates and builds XOR truth table purely from NAND gates", () => {
    expect(evaluateGate("XOR", true, false)).toBe(true);
    expect(evaluateGate("XNOR", true, true)).toBe(true);
    expect(generateTruthTable("NAND")).toHaveLength(4);

    const canonicalXor = getCanonicalNandCircuit("XOR");
    const puzzleRes = checkNandPuzzle("XOR", canonicalXor.nodes, canonicalXor.outputGateId);
    expect(puzzleRes.passed).toBe(true);
    expect(puzzleRes.gateCount).toBe(4);
    expect(puzzleRes.rows.every((r) => r.match)).toBe(true);
  });

  it("simulates 4-bit ripple-carry adder propagation and rising-edge D-flip-flop capture", () => {
    const add = simulateRippleAdder4(0b1111, 0b0001, false);
    expect(add.sumValue).toBe(0);
    expect(add.cout).toBe(true);
    expect(add.stages.every((s) => s.cout)).toBe(true);

    // Falling edge or steady high does NOT latch
    const noLatch = stepDFlipFlop(true, true, 0b1010, 0b0000, 4);
    expect(noLatch.risingEdge).toBe(false);
    expect(noLatch.q).toBe(0b0000);

    // Rising edge latches D
    const latch = stepDFlipFlop(false, true, 0b1010, 0b0000, 4);
    expect(latch.risingEdge).toBe(true);
    expect(latch.q).toBe(0b1010);
  });
});

describe("4. Binary, Two's Complement, IEEE-754 & Hamming(7,4) Engine", () => {
  it("encodes IEEE-754 -6.5 as 0xC0D00000 and -13.625 as 0xC15A0000", () => {
    const f1 = encodeFloat32(-6.5);
    expect(f1.hex).toBe("0xC0D00000");
    expect(f1.sign).toBe(1);
    expect(f1.biasedExponent).toBe(129);
    expect(f1.unbiasedExponent).toBe(2);
    expect(f1.classification).toBe("normal");

    const f2 = encodeFloat32(-13.625);
    expect(f2.hex).toBe("0xC15A0000");

    expect(encodeFloat32(Number.POSITIVE_INFINITY).classification).toBe("infinity");
    expect(encodeFloat32(Number.NaN).classification).toBe("nan");
    expect(encodeFloat32(1e-42).classification).toBe("subnormal");
  });

  it("demonstrates 0.1 + 0.2 !== 0.3 rounding and two's complement overflow", () => {
    const cmp = compareFloatAddition(0.1, 0.2, 0.3);
    expect(cmp.f64EqualExpected).toBe(false);
    expect(cmp.f64Delta).not.toBe(0);

    const ovf = inspectInteger(130, 8);
    expect(ovf.signedOverflow).toBe(true);
    expect(decodeBinaryBits("11111111", 8).signed).toBe(-1);
  });

  it("encodes and single-bit corrects Hamming(7,4) codewords", () => {
    const codeword = hamming74Encode("1011");
    for (let pos = 1; pos <= 7; pos++) {
      const corrupted = hamming74FlipBit(codeword, pos);
      const decoded = hamming74Decode(corrupted);
      expect(decoded.syndrome).toBe(pos);
      expect(decoded.errorPosition).toBe(pos);
      expect(decoded.correctedBits).toBe(codeword);
      expect(decoded.correctedDataBits).toBe("1011");
    }
  });
});

describe("5. ALU & Register File Engine", () => {
  it("triggers signed overflow V=1 without unsigned carry C=0 on 0x7F + 0x01", () => {
    const res = executeAlu("ADD", 0x7f, 0x01, 8);
    expect(res.result).toBe(0x80);
    expect(res.signedResult).toBe(-128);
    expect(res.flags.V).toBe(true);
    expect(res.flags.C).toBe(false);
    expect(res.flags.N).toBe(true);
    expect(res.flags.Z).toBe(false);
  });

  it("handles SUB, SLT, shifts, and register writeback pulse", () => {
    const rf = createRegisterFile(8);
    const { nextState, aluResult } = pulseAluWriteback(rf, "ADD", 1, 2, 0, true);
    expect(aluResult.flags.V).toBe(true);
    expect(aluResult.flags.C).toBe(false);
    expect(nextState.registers[0]).toBe(0x80);
    expect(nextState.lastWrittenReg).toBe(0);

    expect(executeAlu("SUB", 5, 5, 8).flags.Z).toBe(true);
    expect(executeAlu("SLT", 0xff, 0x01, 8).result).toBe(1); // -1 < 1
  });
});

describe("6. Fetch-Decode-Execute CPU Simulator Engine", () => {
  it("executes Sum 1..5 loop to R1 = 15 and writes mem[0] = 15", () => {
    const preset = CPU_PROGRAM_PRESETS.find((p) => p.id === "sum-1-to-5")!;
    const { instructions, errors } = assembleCpuProgram(preset.source);
    expect(errors).toEqual([]);

    // Step micro-phases for first instruction
    let cpu = createCpuState(instructions);
    expect(cpu.phase).toBe("FETCH");
    cpu = stepCpuPhase(cpu);
    expect(cpu.phase).toBe("DECODE");
    cpu = stepCpuPhase(cpu);
    expect(cpu.phase).toBe("EXECUTE");
    cpu = stepCpuPhase(cpu);
    expect(cpu.phase).toBe("WRITEBACK");

    cpu = runCpuToHalt(cpu);
    expect(cpu.halted).toBe(true);
    expect(cpu.registers[1]).toBe(15);
    expect(cpu.memory[0]).toBe(15);
    expect(cpu.branchesTaken).toBeGreaterThanOrEqual(4);
  });

  it("executes Fibonacci preset into memory", () => {
    const preset = CPU_PROGRAM_PRESETS.find((p) => p.id === "fibonacci")!;
    const { instructions, errors } = assembleCpuProgram(preset.source);
    expect(errors).toEqual([]);
    const finalCpu = runCpuToHalt(createCpuState(instructions));
    expect(finalCpu.halted).toBe(true);
    expect(finalCpu.memory.slice(0, 8)).toEqual([1, 1, 2, 3, 5, 8, 13, 21]);
  });
});

describe("7. Cache Memory & MESI Coherence Engine", () => {
  it("eliminates conflict misses on strided traversal when switching from direct-mapped to 2-way", () => {
    const breakdown = decomposeCacheAddress(0x0044, {
      cacheSizeBytes: 64,
      blockSizeBytes: 16,
      associativity: 1,
      addressBits: 16,
    });
    expect(breakdown.offsetBits).toBe(4);
    expect(breakdown.indexBits).toBe(2);
    expect(breakdown.tagBits).toBe(10);
    expect(breakdown.offset).toBe(4);
    expect(breakdown.index).toBe(0);

    // 0x0000 and 0x0040 both map to Set 0 in a 64B direct-mapped 16B-block cache
    const stridedTrace = [0x00, 0x40, 0x00, 0x40, 0x00, 0x40, 0x00, 0x40];

    const dm = runCacheTrace(
      { cacheSizeBytes: 64, blockSizeBytes: 16, associativity: 1 },
      stridedTrace
    );
    expect(dm.hits).toBe(0);
    expect(dm.compulsoryMisses).toBe(2);
    expect(dm.conflictMisses).toBe(6);

    const twoWay = runCacheTrace(
      { cacheSizeBytes: 64, blockSizeBytes: 16, associativity: 2 },
      stridedTrace
    );
    expect(twoWay.conflictMisses).toBe(0);
    expect(twoWay.misses).toBe(2);
    expect(twoWay.hits).toBe(6);
  });

  it("simulates 2-core MESI coherence transitions on PrRd and PrWr", () => {
    let mesi = createMesiState(100);
    // Core 0 PrRd -> Exclusive
    mesi = stepMesi(mesi, 0, "PrRd");
    expect(mesi.cores[0].state).toBe("E");
    expect(mesi.lastEvent?.busTx).toBe("BusRd");

    // Core 1 PrRd -> both Shared
    mesi = stepMesi(mesi, 1, "PrRd");
    expect(mesi.cores[0].state).toBe("S");
    expect(mesi.cores[1].state).toBe("S");

    // Core 0 PrWr -> Modified, Core 1 Invalidated via BusUpgr
    mesi = stepMesi(mesi, 0, "PrWr", 250);
    expect(mesi.cores[0].state).toBe("M");
    expect(mesi.cores[0].value).toBe(250);
    expect(mesi.cores[1].state).toBe("I");
    expect(mesi.lastEvent?.busTx).toBe("BusUpgr");

    // Core 1 PrRd -> Core 0 flushes 250 to memory and both become Shared
    mesi = stepMesi(mesi, 1, "PrRd");
    expect(mesi.cores[0].state).toBe("S");
    expect(mesi.cores[1].state).toBe("S");
    expect(mesi.memoryValue).toBe(250);
  });
});

describe("8. 5-Stage Pipeline & Hazard Engine", () => {
  it("reduces cycles and mispredictions when enabling forwarding and 2-bit predictor", () => {
    const seq = getDefaultPipelineSequence();

    const baseline = simulatePipeline(seq, {
      exToExForwarding: false,
      memToExForwarding: false,
      branchPredictor: "always-not-taken",
    });

    const forwardingOnly = simulatePipeline(seq, {
      exToExForwarding: true,
      memToExForwarding: true,
      branchPredictor: "always-not-taken",
    });

    const optimized = simulatePipeline(seq, {
      exToExForwarding: true,
      memToExForwarding: true,
      branchPredictor: "two-bit",
    });

    expect(baseline.completedInstructions).toBe(seq.length);
    expect(optimized.completedInstructions).toBe(seq.length);

    expect(forwardingOnly.stallCycles).toBeLessThan(baseline.stallCycles);
    expect(forwardingOnly.totalCycles).toBeLessThan(baseline.totalCycles);

    expect(optimized.branchMispredictions).toBeLessThan(
      forwardingOnly.branchMispredictions
    );
    expect(optimized.totalCycles).toBeLessThan(forwardingOnly.totalCycles);
    expect(optimized.cpi).toBeLessThan(baseline.cpi);
  });
});
