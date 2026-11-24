export type AluOp = "ADD" | "SUB" | "AND" | "OR" | "XOR" | "SHL" | "SHR" | "SLT";
export type AluBitWidth = 8 | 16;

export interface AluFlags {
  /** Zero flag: result == 0 */
  Z: boolean;
  /** Negative flag: MSB of result == 1 */
  N: boolean;
  /** Carry flag: unsigned carry-out (ADD) or no-borrow (SUB) or last shifted-out bit */
  C: boolean;
  /** Signed two's complement Overflow flag */
  V: boolean;
}

export interface AluResult {
  op: AluOp;
  width: AluBitWidth;
  operandA: number;
  operandB: number;
  result: number;
  signedA: number;
  signedB: number;
  signedResult: number;
  flags: AluFlags;
}

export interface RegisterFileState {
  width: AluBitWidth;
  registers: number[]; // length 8: R0..R7
  lastWrittenReg: number | null;
  writePulseCount: number;
  lastFlags: AluFlags;
}

function toSigned(val: number, width: AluBitWidth): number {
  const mask = (1 << width) - 1;
  const signBit = 1 << (width - 1);
  const masked = val & mask;
  return (masked & signBit) !== 0 ? masked - (1 << width) : masked;
}

/**
 * Executes an 8-bit or 16-bit ALU operation with exact Z, N, C, and V status flags.
 */
export function executeAlu(
  op: AluOp,
  rawA: number,
  rawB: number,
  width: AluBitWidth = 8
): AluResult {
  const mask = (1 << width) - 1;
  const signBit = 1 << (width - 1);
  const a = rawA & mask;
  const b = rawB & mask;
  const signedA = toSigned(a, width);
  const signedB = toSigned(b, width);

  let result = 0;
  let C = false;
  let V = false;

  switch (op) {
    case "ADD": {
      const fullSum = a + b;
      result = fullSum & mask;
      C = fullSum > mask;
      const signA = (a & signBit) !== 0;
      const signB = (b & signBit) !== 0;
      const signR = (result & signBit) !== 0;
      V = signA === signB && signR !== signA;
      break;
    }
    case "SUB": {
      const invB = (~b) & mask;
      const fullDiff = a + invB + 1;
      result = fullDiff & mask;
      // Unsigned carry-out of (a + ~b + 1): 1 if a >= b (no borrow), 0 if borrow
      C = fullDiff > mask;
      const signA = (a & signBit) !== 0;
      const signB = (b & signBit) !== 0;
      const signR = (result & signBit) !== 0;
      V = signA !== signB && signR !== signA;
      break;
    }
    case "AND":
      result = a & b;
      break;
    case "OR":
      result = a | b;
      break;
    case "XOR":
      result = a ^ b;
      break;
    case "SHL": {
      const shift = b & (width - 1);
      if (shift === 0) {
        result = a;
      } else {
        const shifted = a << shift;
        C = ((a >> (width - shift)) & 1) === 1;
        result = shifted & mask;
      }
      break;
    }
    case "SHR": {
      const shift = b & (width - 1);
      if (shift === 0) {
        result = a;
      } else {
        C = ((a >> (shift - 1)) & 1) === 1;
        result = (a >>> shift) & mask;
      }
      break;
    }
    case "SLT": {
      result = signedA < signedB ? 1 : 0;
      break;
    }
  }

  const Z = result === 0;
  const N = (result & signBit) !== 0;

  return {
    op,
    width,
    operandA: a,
    operandB: b,
    result,
    signedA,
    signedB,
    signedResult: toSigned(result, width),
    flags: { Z, N, C, V },
  };
}

/**
 * Creates an initial 8-register file (R0..R7) with illustrative defaults.
 */
export function createRegisterFile(width: AluBitWidth = 8): RegisterFileState {
  const mask = (1 << width) - 1;
  return {
    width,
    registers: [0x00, 0x7f, 0x01, 0x0a, 0x05, 0xff, 0x10, 0x03].map(
      (v) => v & mask
    ),
    lastWrittenReg: null,
    writePulseCount: 0,
    lastFlags: { Z: false, N: false, C: false, V: false },
  };
}

/**
 * Executes ALU on Rs1/Rs2 and optionally writes back to Rd on a clock pulse.
 */
export function pulseAluWriteback(
  state: RegisterFileState,
  op: AluOp,
  rs1: number,
  rs2: number,
  rd: number,
  writeEnable: boolean
): { nextState: RegisterFileState; aluResult: AluResult } {
  const a = state.registers[rs1] ?? 0;
  const b = state.registers[rs2] ?? 0;
  const aluResult = executeAlu(op, a, b, state.width);
  const nextRegs = [...state.registers];
  if (writeEnable && rd >= 0 && rd < nextRegs.length) {
    nextRegs[rd] = aluResult.result;
  }
  return {
    aluResult,
    nextState: {
      width: state.width,
      registers: nextRegs,
      lastWrittenReg: writeEnable ? rd : null,
      writePulseCount: state.writePulseCount + 1,
      lastFlags: aluResult.flags,
    },
  };
}
