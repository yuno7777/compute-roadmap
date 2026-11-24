export type CpuPhase = "FETCH" | "DECODE" | "EXECUTE" | "WRITEBACK" | "HALTED";

export type CpuOpcode =
  | "NOP"
  | "LOADI"
  | "MOV"
  | "ADD"
  | "SUB"
  | "ADDI"
  | "AND"
  | "OR"
  | "CMP"
  | "LOAD"
  | "STORE"
  | "JMP"
  | "BNE"
  | "BEQ"
  | "BLT"
  | "HALT";

export interface CpuInstruction {
  address: number;
  rawText: string;
  opcode: CpuOpcode;
  rd?: number;
  rs1?: number;
  rs2?: number;
  imm?: number;
  target?: number;
  machineWord: number;
}

export interface CpuFlags {
  Z: boolean;
  N: boolean;
  C: boolean;
  V: boolean;
}

export interface CpuTraceEntry {
  cycle: number;
  pc: number;
  irText: string;
  branchTaken?: boolean;
  writtenReg?: number;
  writtenValue?: number;
}

export interface CpuState {
  pc: number;
  ir: CpuInstruction | null;
  phase: CpuPhase;
  registers: number[]; // R0..R7 (16-bit)
  memory: number[]; // 32 words (16-bit)
  flags: CpuFlags;
  cycleCount: number;
  instructionsRetired: number;
  branchesTaken: number;
  halted: boolean;
  program: CpuInstruction[];
  decodedInfo: string;
  aluScratch: number;
  branchTargetPending: number | null;
  shouldWriteReg: boolean;
  pendingWriteReg: number | null;
  pendingMemWriteAddr: number | null;
  trace: CpuTraceEntry[];
  error?: string;
}

export interface CpuProgramPreset {
  id: "sum-1-to-5" | "fibonacci" | "memcpy";
  name: string;
  description: string;
  source: string;
  initialMemory?: Record<number, number>;
}

export const CPU_PROGRAM_PRESETS: CpuProgramPreset[] = [
  {
    id: "sum-1-to-5",
    name: "Sum 1..5 Loop",
    description: "Computes 1 + 2 + 3 + 4 + 5 = 15 in R1 using a conditional BNE loop.",
    source: [
      "LOADI R1, 0      ; R1 = running sum",
      "LOADI R2, 5      ; R2 = loop counter N=5",
      "LOADI R3, 0      ; R3 = zero reference",
      "loop:",
      "ADD R1, R1, R2   ; sum += counter",
      "ADDI R2, R2, -1  ; counter--",
      "CMP R2, R3       ; compare counter to 0",
      "BNE loop         ; jump if counter != 0",
      "STORE R1, [R3+0] ; save result to mem[0]",
      "HALT",
    ].join("\n"),
  },
  {
    id: "fibonacci",
    name: "Fibonacci Sequence (7 terms)",
    description: "Generates Fibonacci numbers into mem[0..6] and ends with F(6)=13 in R2.",
    source: [
      "LOADI R0, 0      ; index = 0",
      "LOADI R1, 1      ; prev = 1",
      "LOADI R2, 1      ; curr = 1",
      "LOADI R5, 7      ; limit = 7",
      "STORE R1, [R0+0] ; mem[0] = 1",
      "fib_loop:",
      "ADDI R0, R0, 1   ; index++",
      "STORE R2, [R0+0] ; mem[index] = curr",
      "ADD R3, R1, R2   ; next = prev + curr",
      "MOV R1, R2       ; prev = curr",
      "MOV R2, R3       ; curr = next",
      "CMP R0, R5       ; index == 7?",
      "BNE fib_loop",
      "HALT",
    ].join("\n"),
  },
  {
    id: "memcpy",
    name: "Memory Copy (4 words)",
    description: "Copies 4 words from mem[0..3] to mem[16..19].",
    initialMemory: { 0: 0x101, 1: 0x202, 2: 0x303, 3: 0x404 },
    source: [
      "LOADI R0, 0      ; src pointer",
      "LOADI R1, 16     ; dst base",
      "LOADI R2, 4      ; count",
      "LOADI R3, 0      ; zero",
      "copy_loop:",
      "LOAD R4, [R0+0]  ; read mem[src]",
      "ADD R5, R1, R0   ; dst addr = 16 + src",
      "STORE R4, [R5+0] ; write mem[dst]",
      "ADDI R0, R0, 1   ; src++",
      "CMP R0, R2       ; src == 4?",
      "BNE copy_loop",
      "HALT",
    ].join("\n"),
  },
];

const OPCODE_NUM: Record<CpuOpcode, number> = {
  NOP: 0,
  LOADI: 1,
  MOV: 2,
  ADD: 3,
  SUB: 4,
  ADDI: 5,
  AND: 6,
  OR: 7,
  CMP: 8,
  LOAD: 9,
  STORE: 10,
  JMP: 11,
  BNE: 12,
  BEQ: 13,
  BLT: 14,
  HALT: 15,
};

function parseReg(token: string): number {
  const m = /^R([0-7])$/i.exec(token.trim());
  if (!m) {
    throw new Error(`Invalid register '${token}'. Expected R0..R7.`);
  }
  return Number(m[1]);
}

function parseMemOperand(token: string): { rs1: number; imm: number } {
  const cleaned = token.replace(/[\[\]]/g, "").trim();
  if (/^\d+$/.test(cleaned) || /^0x[0-9a-f]+$/i.test(cleaned)) {
    return { rs1: 0, imm: Number(cleaned) };
  }
  const m = /^R([0-7])\s*([+-]\s*\d+)?$/i.exec(cleaned);
  if (!m) {
    throw new Error(`Invalid memory operand '${token}'. Use [R0+0] or [addr].`);
  }
  const rs1 = Number(m[1]);
  const imm = m[2] ? Number(m[2].replace(/\s+/g, "")) : 0;
  return { rs1, imm };
}

function encodeWord(opcode: CpuOpcode, rd = 0, rs1 = 0, rs2OrImm = 0): number {
  const op = (OPCODE_NUM[opcode] & 0xf) << 12;
  const r = (rd & 0x7) << 9;
  const s1 = (rs1 & 0x7) << 6;
  const tail = rs2OrImm & 0x3f;
  return (op | r | s1 | tail) & 0xffff;
}

/**
 * Assembles miniature RISC assembly source into executable CpuInstruction[] (max 32 instructions).
 */
export function assembleCpuProgram(source: string): {
  instructions: CpuInstruction[];
  errors: string[];
} {
  const lines = source.split(/\r?\n/);
  const labels = new Map<string, number>();
  const cleanedLines: Array<{ lineNum: number; text: string }> = [];

  // Pass 1: collect labels
  let pc = 0;
  for (let i = 0; i < lines.length; i++) {
    const noComment = lines[i].split(";")[0].trim();
    if (!noComment) continue;
    if (noComment.endsWith(":")) {
      const label = noComment.slice(0, -1).trim();
      labels.set(label, pc);
      continue;
    }
    const colonIdx = noComment.indexOf(":");
    if (colonIdx !== -1) {
      const label = noComment.slice(0, colonIdx).trim();
      const rest = noComment.slice(colonIdx + 1).trim();
      labels.set(label, pc);
      if (rest) {
        cleanedLines.push({ lineNum: i + 1, text: rest });
        pc++;
      }
      continue;
    }
    cleanedLines.push({ lineNum: i + 1, text: noComment });
    pc++;
  }

  // Pass 2: parse instructions
  const instructions: CpuInstruction[] = [];
  const errors: string[] = [];

  for (let addr = 0; addr < cleanedLines.length && addr < 32; addr++) {
    const { lineNum, text } = cleanedLines[addr];
    const parts = text.split(/[\s,]+/).filter(Boolean);
    const mnemonic = parts[0].toUpperCase() as CpuOpcode;
    if (!(mnemonic in OPCODE_NUM)) {
      errors.push(`Line ${lineNum}: Unknown opcode '${parts[0]}'.`);
      continue;
    }

    try {
      let rd = 0;
      let rs1 = 0;
      let rs2 = 0;
      let imm = 0;
      let target = 0;

      switch (mnemonic) {
        case "NOP":
        case "HALT":
          break;
        case "LOADI":
          rd = parseReg(parts[1]);
          imm = Number(parts[2]);
          if (!Number.isFinite(imm)) throw new Error("Invalid immediate");
          break;
        case "MOV":
          rd = parseReg(parts[1]);
          rs1 = parseReg(parts[2]);
          break;
        case "ADD":
        case "SUB":
        case "AND":
        case "OR":
          rd = parseReg(parts[1]);
          rs1 = parseReg(parts[2]);
          rs2 = parseReg(parts[3]);
          break;
        case "ADDI":
          rd = parseReg(parts[1]);
          rs1 = parseReg(parts[2]);
          imm = Number(parts[3]);
          if (!Number.isFinite(imm)) throw new Error("Invalid immediate");
          break;
        case "CMP":
          rs1 = parseReg(parts[1]);
          rs2 = parseReg(parts[2]);
          break;
        case "LOAD": {
          rd = parseReg(parts[1]);
          const mem = parseMemOperand(parts.slice(2).join(" "));
          rs1 = mem.rs1;
          imm = mem.imm;
          break;
        }
        case "STORE": {
          rs2 = parseReg(parts[1]);
          const mem = parseMemOperand(parts.slice(2).join(" "));
          rs1 = mem.rs1;
          imm = mem.imm;
          break;
        }
        case "JMP":
        case "BNE":
        case "BEQ":
        case "BLT": {
          const tok = parts[1];
          if (labels.has(tok)) {
            target = labels.get(tok)!;
          } else {
            const num = Number(tok);
            if (!Number.isFinite(num)) {
              throw new Error(`Unknown label or address '${tok}'`);
            }
            target = num;
          }
          break;
        }
      }

      const machineWord = encodeWord(
        mnemonic,
        rd,
        rs1,
        mnemonic === "JMP" || mnemonic === "BNE" || mnemonic === "BEQ" || mnemonic === "BLT"
          ? target
          : mnemonic === "LOADI" || mnemonic === "ADDI" || mnemonic === "LOAD" || mnemonic === "STORE"
          ? imm
          : rs2
      );

      instructions.push({
        address: addr,
        rawText: text,
        opcode: mnemonic,
        rd,
        rs1,
        rs2,
        imm,
        target,
        machineWord,
      });
    } catch (err) {
      errors.push(`Line ${lineNum}: ${(err as Error).message}`);
    }
  }

  return { instructions, errors };
}

/**
 * Creates a fresh CPU state initialized with a program and optional initial memory.
 */
export function createCpuState(
  program: CpuInstruction[],
  initialMemory?: Record<number, number>
): CpuState {
  const memory = new Array<number>(32).fill(0);
  if (initialMemory) {
    for (const [k, v] of Object.entries(initialMemory)) {
      const idx = Number(k);
      if (idx >= 0 && idx < 32) {
        memory[idx] = v & 0xffff;
      }
    }
  }
  return {
    pc: 0,
    ir: null,
    phase: program.length === 0 ? "HALTED" : "FETCH",
    registers: new Array<number>(8).fill(0),
    memory,
    flags: { Z: false, N: false, C: false, V: false },
    cycleCount: 0,
    instructionsRetired: 0,
    branchesTaken: 0,
    halted: program.length === 0,
    program,
    decodedInfo: "Ready to fetch instruction at PC=0",
    aluScratch: 0,
    branchTargetPending: null,
    shouldWriteReg: false,
    pendingWriteReg: null,
    pendingMemWriteAddr: null,
    trace: [],
  };
}

/**
 * Advances the CPU by one micro-phase: FETCH -> DECODE -> EXECUTE -> WRITEBACK.
 */
export function stepCpuPhase(state: CpuState): CpuState {
  if (state.halted || state.phase === "HALTED") {
    return state;
  }

  const next: CpuState = {
    ...state,
    registers: [...state.registers],
    memory: [...state.memory],
    flags: { ...state.flags },
    trace: [...state.trace],
  };

  if (next.phase === "FETCH") {
    const instr = next.program[next.pc] ?? null;
    if (!instr) {
      next.halted = true;
      next.phase = "HALTED";
      next.decodedInfo = `PC=${next.pc} out of bounds — halting`;
      return next;
    }
    next.ir = instr;
    next.decodedInfo = `Fetched [0x${instr.machineWord.toString(16).toUpperCase().padStart(4, "0")}] ${instr.rawText}`;
    next.phase = "DECODE";
    return next;
  }

  if (next.phase === "DECODE") {
    const instr = next.ir;
    if (!instr) {
      next.halted = true;
      next.phase = "HALTED";
      return next;
    }
    const r1 = instr.rs1 ?? 0;
    const r2 = instr.rs2 ?? 0;
    next.decodedInfo = `Decoded ${instr.opcode} (Rs1=R${r1}:${next.registers[r1]}, Rs2=R${r2}:${next.registers[r2]}, imm=${instr.imm ?? 0})`;
    next.phase = "EXECUTE";
    return next;
  }

  if (next.phase === "EXECUTE") {
    const instr = next.ir!;
    next.aluScratch = 0;
    next.branchTargetPending = null;
    next.shouldWriteReg = false;
    next.pendingWriteReg = null;
    next.pendingMemWriteAddr = null;

    const r1Val = next.registers[instr.rs1 ?? 0] ?? 0;
    const r2Val = next.registers[instr.rs2 ?? 0] ?? 0;
    const imm = instr.imm ?? 0;

    switch (instr.opcode) {
      case "NOP":
        next.decodedInfo = "Execute NOP";
        break;
      case "HALT":
        next.decodedInfo = "Execute HALT";
        break;
      case "LOADI":
        next.aluScratch = imm & 0xffff;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `Prepare immediate ${next.aluScratch} -> R${next.pendingWriteReg}`;
        break;
      case "MOV":
        next.aluScratch = r1Val;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `Pass R${instr.rs1} (${r1Val}) -> R${next.pendingWriteReg}`;
        break;
      case "ADD": {
        const sum = r1Val + r2Val;
        next.aluScratch = sum & 0xffff;
        next.flags.Z = next.aluScratch === 0;
        next.flags.N = (next.aluScratch & 0x8000) !== 0;
        next.flags.C = sum > 0xffff;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `ALU ADD: ${r1Val} + ${r2Val} = ${next.aluScratch}`;
        break;
      }
      case "SUB": {
        const diff = (r1Val - r2Val) & 0xffff;
        next.aluScratch = diff;
        next.flags.Z = diff === 0;
        next.flags.N = (diff & 0x8000) !== 0;
        next.flags.C = r1Val >= r2Val;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `ALU SUB: ${r1Val} - ${r2Val} = ${diff}`;
        break;
      }
      case "ADDI": {
        const sum = (r1Val + imm) & 0xffff;
        next.aluScratch = sum;
        next.flags.Z = sum === 0;
        next.flags.N = (sum & 0x8000) !== 0;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `ALU ADDI: ${r1Val} + (${imm}) = ${sum}`;
        break;
      }
      case "AND":
        next.aluScratch = r1Val & r2Val;
        next.flags.Z = next.aluScratch === 0;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `ALU AND: ${r1Val} & ${r2Val} = ${next.aluScratch}`;
        break;
      case "OR":
        next.aluScratch = r1Val | r2Val;
        next.flags.Z = next.aluScratch === 0;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `ALU OR: ${r1Val} | ${r2Val} = ${next.aluScratch}`;
        break;
      case "CMP": {
        const diff = (r1Val - r2Val) & 0xffff;
        const s1 = (r1Val & 0x8000) !== 0 ? r1Val - 65536 : r1Val;
        const s2 = (r2Val & 0x8000) !== 0 ? r2Val - 65536 : r2Val;
        const sr = (diff & 0x8000) !== 0 ? diff - 65536 : diff;
        next.flags.Z = diff === 0;
        next.flags.N = (diff & 0x8000) !== 0;
        next.flags.C = r1Val >= r2Val;
        next.flags.V = (s1 < 0) !== (s2 < 0) && (sr < 0) !== (s1 < 0);
        next.decodedInfo = `CMP R${instr.rs1}(${r1Val}) vs R${instr.rs2}(${r2Val}) -> Z=${Number(next.flags.Z)}, N=${Number(next.flags.N)}`;
        break;
      }
      case "LOAD": {
        const addr = (r1Val + imm) & 0x1f;
        next.aluScratch = next.memory[addr] ?? 0;
        next.shouldWriteReg = true;
        next.pendingWriteReg = instr.rd ?? 0;
        next.decodedInfo = `Read mem[${addr}] = ${next.aluScratch} -> R${next.pendingWriteReg}`;
        break;
      }
      case "STORE": {
        const addr = (r1Val + imm) & 0x1f;
        next.aluScratch = r2Val;
        next.pendingMemWriteAddr = addr;
        next.decodedInfo = `Prepare write R${instr.rs2}(${r2Val}) -> mem[${addr}]`;
        break;
      }
      case "JMP":
        next.branchTargetPending = instr.target ?? 0;
        next.decodedInfo = `Unconditional jump -> PC=${next.branchTargetPending}`;
        break;
      case "BNE":
        if (!next.flags.Z) {
          next.branchTargetPending = instr.target ?? 0;
          next.decodedInfo = `BNE taken (Z=0) -> PC=${next.branchTargetPending}`;
        } else {
          next.decodedInfo = `BNE not taken (Z=1)`;
        }
        break;
      case "BEQ":
        if (next.flags.Z) {
          next.branchTargetPending = instr.target ?? 0;
          next.decodedInfo = `BEQ taken (Z=1) -> PC=${next.branchTargetPending}`;
        } else {
          next.decodedInfo = `BEQ not taken (Z=0)`;
        }
        break;
      case "BLT":
        if (next.flags.N !== next.flags.V) {
          next.branchTargetPending = instr.target ?? 0;
          next.decodedInfo = `BLT taken (N!=V) -> PC=${next.branchTargetPending}`;
        } else {
          next.decodedInfo = `BLT not taken`;
        }
        break;
    }

    next.phase = "WRITEBACK";
    return next;
  }

  // WRITEBACK phase
  const instr = next.ir!;
  const executedPc = next.pc;
  let writtenReg: number | undefined;
  let writtenValue: number | undefined;
  let branchTaken: boolean | undefined;

  if (next.shouldWriteReg && next.pendingWriteReg !== null) {
    next.registers[next.pendingWriteReg] = next.aluScratch & 0xffff;
    writtenReg = next.pendingWriteReg;
    writtenValue = next.registers[next.pendingWriteReg];
  }

  if (next.pendingMemWriteAddr !== null) {
    next.memory[next.pendingMemWriteAddr] = next.aluScratch & 0xffff;
  }

  next.cycleCount += 1;
  next.instructionsRetired += 1;

  if (instr.opcode === "HALT") {
    next.halted = true;
    next.phase = "HALTED";
    next.decodedInfo = `Halted after ${next.instructionsRetired} instructions.`;
  } else if (next.branchTargetPending !== null) {
    branchTaken = true;
    next.branchesTaken += 1;
    next.pc = next.branchTargetPending;
    next.phase = "FETCH";
    next.decodedInfo = `Writeback complete; PC jumped to ${next.pc}`;
  } else {
    if (instr.opcode === "BNE" || instr.opcode === "BEQ" || instr.opcode === "BLT") {
      branchTaken = false;
    }
    next.pc = executedPc + 1;
    next.phase = "FETCH";
    next.decodedInfo = `Writeback complete; PC advanced to ${next.pc}`;
  }

  next.trace.push({
    cycle: next.cycleCount,
    pc: executedPc,
    irText: instr.rawText,
    branchTaken,
    writtenReg,
    writtenValue,
  });

  if (next.trace.length > 64) {
    next.trace = next.trace.slice(-64);
  }

  return next;
}

/**
 * Advances the CPU by one complete instruction (up to 4 phases).
 */
export function stepCpuInstruction(state: CpuState): CpuState {
  if (state.halted) return state;
  let cur = state;
  for (let i = 0; i < 4; i++) {
    cur = stepCpuPhase(cur);
    if (cur.halted || cur.phase === "FETCH") break;
  }
  return cur;
}

/**
 * Runs the CPU until HALT or maxInstructions limit.
 */
export function runCpuToHalt(state: CpuState, maxInstructions = 256): CpuState {
  let cur = state;
  let steps = 0;
  while (!cur.halted && steps < maxInstructions) {
    cur = stepCpuInstruction(cur);
    steps++;
  }
  return cur;
}
