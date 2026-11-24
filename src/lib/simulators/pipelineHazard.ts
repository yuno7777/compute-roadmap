export type PipelineStage = "IF" | "ID" | "EX" | "MEM" | "WB" | "STALL" | "FLUSH";
export type BranchPredictorMode = "always-not-taken" | "two-bit";

export interface PipelineInstructionSpec {
  id: string;
  text: string;
  op: "LOAD" | "STORE" | "ADD" | "SUB" | "ADDI" | "BNE";
  rd: number | null;
  rs1: number | null;
  rs2: number | null;
  isLoad?: boolean;
  isBranch?: boolean;
  /** Outcome for dynamic branch instance (true = taken, false = not taken) */
  branchTaken?: boolean;
}

export interface PipelineConfig {
  exToExForwarding: boolean;
  memToExForwarding: boolean;
  branchPredictor: BranchPredictorMode;
}

export interface PipelineHazardEvent {
  cycle: number;
  fromInstrIndex: number;
  toInstrIndex: number;
  kind: "EX->EX" | "MEM->EX" | "LOAD-USE-STALL" | "RAW-STALL" | "BRANCH-FLUSH";
  description: string;
}

export interface PipelineSimulationResult {
  instructions: PipelineInstructionSpec[];
  config: PipelineConfig;
  totalCycles: number;
  completedInstructions: number;
  stallCycles: number;
  flushCycles: number;
  branchMispredictions: number;
  cpi: number;
  /** timeline[instrIndex][cycleIndex] = PipelineStage | null */
  timeline: Array<Array<PipelineStage | null>>;
  hazards: PipelineHazardEvent[];
}

/**
 * Default instruction trace featuring a Load-Use dependency, RAW ALU hazards, and a 4-iteration loop branch.
 */
export function getDefaultPipelineSequence(): PipelineInstructionSpec[] {
  return [
    // Iteration 1
    { id: "i0", text: "LOAD R1, 0(R10)", op: "LOAD", rd: 1, rs1: 10, rs2: null, isLoad: true },
    { id: "i1", text: "ADD  R2, R1, R3", op: "ADD", rd: 2, rs1: 1, rs2: 3 },
    { id: "i2", text: "SUB  R4, R2, R5", op: "SUB", rd: 4, rs1: 2, rs2: 5 },
    { id: "i3", text: "BNE  R4, R0, loop", op: "BNE", rd: null, rs1: 4, rs2: 0, isBranch: true, branchTaken: true },
    // Iteration 2
    { id: "i4", text: "LOAD R1, 4(R10)", op: "LOAD", rd: 1, rs1: 10, rs2: null, isLoad: true },
    { id: "i5", text: "ADD  R2, R1, R3", op: "ADD", rd: 2, rs1: 1, rs2: 3 },
    { id: "i6", text: "SUB  R4, R2, R5", op: "SUB", rd: 4, rs1: 2, rs2: 5 },
    { id: "i7", text: "BNE  R4, R0, loop", op: "BNE", rd: null, rs1: 4, rs2: 0, isBranch: true, branchTaken: true },
    // Iteration 3
    { id: "i8", text: "LOAD R1, 8(R10)", op: "LOAD", rd: 1, rs1: 10, rs2: null, isLoad: true },
    { id: "i9", text: "ADD  R2, R1, R3", op: "ADD", rd: 2, rs1: 1, rs2: 3 },
    { id: "i10", text: "SUB  R4, R2, R5", op: "SUB", rd: 4, rs1: 2, rs2: 5 },
    { id: "i11", text: "BNE  R4, R0, loop", op: "BNE", rd: null, rs1: 4, rs2: 0, isBranch: true, branchTaken: true },
    // Iteration 4 (exit)
    { id: "i12", text: "LOAD R1, 12(R10)", op: "LOAD", rd: 1, rs1: 10, rs2: null, isLoad: true },
    { id: "i13", text: "ADD  R2, R1, R3", op: "ADD", rd: 2, rs1: 1, rs2: 3 },
    { id: "i14", text: "SUB  R4, R2, R5", op: "SUB", rd: 4, rs1: 2, rs2: 5 },
    { id: "i15", text: "BNE  R4, R0, loop", op: "BNE", rd: null, rs1: 4, rs2: 0, isBranch: true, branchTaken: false },
  ];
}

function readsReg(instr: PipelineInstructionSpec, reg: number | null): boolean {
  if (reg === null || reg === 0) return false;
  return instr.rs1 === reg || instr.rs2 === reg;
}

/**
 * Simulates a 5-stage RISC pipeline (IF, ID, EX, MEM, WB) cycle-by-cycle.
 * Branches resolve in EX (2-cycle flush on misprediction for IF and ID).
 */
export function simulatePipeline(
  instructions: PipelineInstructionSpec[],
  config: PipelineConfig
): PipelineSimulationResult {
  const n = instructions.length;
  const timeline: Array<Array<PipelineStage | null>> = Array.from({ length: n }, () => []);
  const hazards: PipelineHazardEvent[] = [];

  if (n === 0) {
    return {
      instructions,
      config,
      totalCycles: 0,
      completedInstructions: 0,
      stallCycles: 0,
      flushCycles: 0,
      branchMispredictions: 0,
      cpi: 0,
      timeline,
      hazards,
    };
  }

  let nextFetchIdx = 0;
  let ifSlot: number | null = null;
  let idSlot: number | null = null;
  let exSlot: number | null = null;
  let memSlot: number | null = null;
  let wbSlot: number | null = null;

  // 2-bit saturating predictor starts at Weakly Not Taken (1) -> learns taken after 1-2 iterations
  let bhtState = 1; // 0: SN, 1: WN, 2: WT, 3: ST

  let cycle = 0;
  let completed = 0;
  let stallCycles = 0;
  let flushCycles = 0;
  let branchMispredictions = 0;

  const maxCycles = n * 6 + 20;

  while (completed < n && cycle < maxCycles) {
    // Record stages occupied during this cycle
    if (wbSlot !== null) {
      timeline[wbSlot][cycle] = "WB";
      completed++;
    }
    if (memSlot !== null) timeline[memSlot][cycle] = "MEM";
    if (exSlot !== null) timeline[exSlot][cycle] = "EX";

    // Detect branch resolution in EX stage (resolved at end of EX cycle)
    let branchMispredicted = false;
    if (exSlot !== null) {
      const exInstr = instructions[exSlot];
      if (exInstr.isBranch) {
        const actualTaken = Boolean(exInstr.branchTaken);
        const predictedTaken =
          config.branchPredictor === "two-bit" ? bhtState >= 2 : false;
        if (actualTaken !== predictedTaken) {
          branchMispredicted = true;
          branchMispredictions++;
          hazards.push({
            cycle,
            fromInstrIndex: exSlot,
            toInstrIndex: exSlot,
            kind: "BRANCH-FLUSH",
            description: `Branch ${exInstr.text} mispredicted (pred=${predictedTaken ? "T" : "NT"}, actual=${actualTaken ? "T" : "NT"}) -> flush IF/ID`,
          });
        }
        if (config.branchPredictor === "two-bit") {
          bhtState = actualTaken ? Math.min(3, bhtState + 1) : Math.max(0, bhtState - 1);
        }
      }
    }

    // Check data hazard for instruction currently in ID stage
    let stallIdAndIf = false;
    if (idSlot !== null && !branchMispredicted) {
      const idInstr = instructions[idSlot];

      // Check EX stage producer
      if (exSlot !== null) {
        const exInstr = instructions[exSlot];
        if (readsReg(idInstr, exInstr.rd)) {
          if (exInstr.isLoad) {
            // Load-use always stalls 1 cycle if forwarding ON, or 2 cycles if forwarding OFF
            stallIdAndIf = true;
            hazards.push({
              cycle,
              fromInstrIndex: exSlot,
              toInstrIndex: idSlot,
              kind: "LOAD-USE-STALL",
              description: `Load-use hazard on R${exInstr.rd}: ${exInstr.text} -> ${idInstr.text}`,
            });
          } else if (!config.exToExForwarding) {
            stallIdAndIf = true;
            hazards.push({
              cycle,
              fromInstrIndex: exSlot,
              toInstrIndex: idSlot,
              kind: "RAW-STALL",
              description: `RAW hazard on R${exInstr.rd} (EX->EX forwarding OFF)`,
            });
          } else {
            hazards.push({
              cycle,
              fromInstrIndex: exSlot,
              toInstrIndex: idSlot,
              kind: "EX->EX",
              description: `EX->EX forward R${exInstr.rd}: ${exInstr.text} -> ${idInstr.text}`,
            });
          }
        }
      }

      // Check MEM stage producer
      if (!stallIdAndIf && memSlot !== null) {
        const memInstr = instructions[memSlot];
        if (readsReg(idInstr, memInstr.rd)) {
          if (!config.memToExForwarding) {
            stallIdAndIf = true;
            hazards.push({
              cycle,
              fromInstrIndex: memSlot,
              toInstrIndex: idSlot,
              kind: "RAW-STALL",
              description: `RAW hazard on R${memInstr.rd} (MEM->EX forwarding OFF)`,
            });
          } else {
            hazards.push({
              cycle,
              fromInstrIndex: memSlot,
              toInstrIndex: idSlot,
              kind: "MEM->EX",
              description: `MEM->EX forward R${memInstr.rd}: ${memInstr.text} -> ${idInstr.text}`,
            });
          }
        }
      }
    }

    if (idSlot !== null) {
      timeline[idSlot][cycle] = branchMispredicted
        ? "FLUSH"
        : stallIdAndIf
        ? "STALL"
        : "ID";
    }
    if (ifSlot !== null) {
      timeline[ifSlot][cycle] = branchMispredicted
        ? "FLUSH"
        : stallIdAndIf
        ? "STALL"
        : "IF";
    }

    // Advance pipeline registers for next cycle
    const nextWb = memSlot;
    const nextMem = exSlot;
    let nextEx: number | null;
    let nextId: number | null;
    let nextIf: number | null;

    if (branchMispredicted) {
      // Mispredicted branch in EX flushes speculative instructions in ID and IF;
      // in this trace model, flushed speculative slots are re-fetched cleanly from nextFetchIdx
      // (Wait: if idSlot/ifSlot were real subsequent trace instructions, rewind nextFetchIdx back to idSlot!)
      const rewindTo = idSlot ?? ifSlot ?? nextFetchIdx;
      nextFetchIdx = rewindTo;
      if (idSlot !== null) flushCycles++;
      if (ifSlot !== null) flushCycles++;
      nextEx = null;
      nextId = null;
      nextIf = nextFetchIdx < n ? nextFetchIdx++ : null;
    } else if (stallIdAndIf) {
      stallCycles++;
      nextEx = null; // bubble injected into EX
      nextId = idSlot;
      nextIf = ifSlot;
    } else {
      nextEx = idSlot;
      nextId = ifSlot;
      nextIf = nextFetchIdx < n ? nextFetchIdx++ : null;
    }

    wbSlot = nextWb;
    memSlot = nextMem;
    exSlot = nextEx;
    idSlot = nextId;
    ifSlot = nextIf;

    cycle++;
  }

  // Pad timeline rows to equal length
  const totalCycles = cycle;
  for (let i = 0; i < n; i++) {
    while (timeline[i].length < totalCycles) {
      timeline[i].push(null);
    }
  }

  return {
    instructions,
    config,
    totalCycles,
    completedInstructions: completed,
    stallCycles,
    flushCycles,
    branchMispredictions,
    cpi: completed > 0 ? totalCycles / completed : 0,
    timeline,
    hazards,
  };
}
