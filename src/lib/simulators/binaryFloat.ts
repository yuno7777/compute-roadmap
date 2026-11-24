export type IntBitWidth = 8 | 16;

export interface TwosComplementInfo {
  bitWidth: IntBitWidth;
  bits: string;
  hex: string;
  unsigned: number;
  signed: number;
  unsignedMin: number;
  unsignedMax: number;
  signedMin: number;
  signedMax: number;
  signedOverflow: boolean;
  unsignedOverflow: boolean;
}

export type FloatClass = "normal" | "subnormal" | "zero" | "infinity" | "nan";

export interface Float32Inspection {
  value: number;
  bits: string; // 32 characters '0' | '1'
  hex: string; // e.g. 0xC0D00000
  uint32: number;
  sign: 0 | 1;
  exponentBits: string;
  biasedExponent: number;
  unbiasedExponent: number;
  mantissaBits: string;
  mantissaFraction: number;
  classification: FloatClass;
  ulp: number;
  exactFormula: string;
}

export interface FloatAdditionComparison {
  a: number;
  b: number;
  expected: number;
  f32A: Float32Inspection;
  f32B: Float32Inspection;
  f32Sum: Float32Inspection;
  f32Expected: Float32Inspection;
  f64Sum: number;
  f64EqualExpected: boolean;
  f32EqualExpected: boolean;
  f64Delta: number;
  ulpDifference: number;
}

export interface Hamming74Result {
  dataBits: string; // 4-bit d1 d2 d3 d4
  codewordBits: string; // 7-bit p1 p2 d1 p4 d2 d3 d4 (positions 1..7)
  syndrome: number; // 0..7 (1-indexed bit position of single-bit error)
  errorPosition: number | null; // 1..7 or null if 0
  correctedBits: string;
  correctedDataBits: string;
}

/**
 * Encodes a numeric integer into 8-bit or 16-bit binary/hex/two's-complement metadata.
 */
export function inspectInteger(
  inputValue: number,
  bitWidth: IntBitWidth
): TwosComplementInfo {
  const mask = (1 << bitWidth) - 1;
  const signBit = 1 << (bitWidth - 1);
  const rounded = Math.trunc(Number.isFinite(inputValue) ? inputValue : 0);

  const unsignedMax = mask;
  const signedMin = -(1 << (bitWidth - 1));
  const signedMax = (1 << (bitWidth - 1)) - 1;

  const rawMasked = rounded & mask;
  const unsigned = rawMasked >>> 0;
  const signed = (rawMasked & signBit) !== 0 ? rawMasked - (1 << bitWidth) : rawMasked;

  return {
    bitWidth,
    bits: unsigned.toString(2).padStart(bitWidth, "0"),
    hex: `0x${unsigned.toString(16).toUpperCase().padStart(bitWidth / 4, "0")}`,
    unsigned,
    signed,
    unsignedMin: 0,
    unsignedMax,
    signedMin,
    signedMax,
    signedOverflow: rounded < signedMin || rounded > signedMax,
    unsignedOverflow: rounded < 0 || rounded > unsignedMax,
  };
}

/**
 * Decodes an 8-bit or 16-bit binary string into full integer representation.
 */
export function decodeBinaryBits(
  bitsInput: string,
  bitWidth: IntBitWidth
): TwosComplementInfo {
  const clean = bitsInput.replace(/[^01]/g, "").slice(-bitWidth).padStart(bitWidth, "0");
  const unsigned = parseInt(clean, 2);
  const signBit = 1 << (bitWidth - 1);
  const signed = (unsigned & signBit) !== 0 ? unsigned - (1 << bitWidth) : unsigned;
  return {
    bitWidth,
    bits: clean,
    hex: `0x${unsigned.toString(16).toUpperCase().padStart(bitWidth / 4, "0")}`,
    unsigned,
    signed,
    unsignedMin: 0,
    unsignedMax: (1 << bitWidth) - 1,
    signedMin: -(1 << (bitWidth - 1)),
    signedMax: (1 << (bitWidth - 1)) - 1,
    signedOverflow: false,
    unsignedOverflow: false,
  };
}

/**
 * Inspects a 32-bit unsigned integer bit pattern as IEEE-754 single-precision float.
 */
export function decodeFloat32Uint(uint32: number): Float32Inspection {
  const u = uint32 >>> 0;
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setUint32(0, u, false);
  const value = view.getFloat32(0, false);

  const bits = u.toString(2).padStart(32, "0");
  const hex = `0x${u.toString(16).toUpperCase().padStart(8, "0")}`;
  const sign = ((u >>> 31) & 1) as 0 | 1;
  const biasedExponent = (u >>> 23) & 0xff;
  const mantissaInt = u & 0x7fffff;

  const exponentBits = bits.slice(1, 9);
  const mantissaBits = bits.slice(9, 32);
  const mantissaFraction = mantissaInt / 8388608; // 2^23

  let classification: FloatClass;
  let unbiasedExponent: number;
  let exactFormula: string;
  let ulp: number;

  if (biasedExponent === 0xff) {
    unbiasedExponent = 128;
    if (mantissaInt === 0) {
      classification = "infinity";
      exactFormula = sign ? "-Infinity" : "+Infinity";
    } else {
      classification = "nan";
      exactFormula = "NaN (exp=255, frac!=0)";
    }
    ulp = Number.NaN;
  } else if (biasedExponent === 0) {
    unbiasedExponent = -126;
    ulp = Math.pow(2, -149);
    if (mantissaInt === 0) {
      classification = "zero";
      exactFormula = sign ? "-0.0" : "+0.0";
    } else {
      classification = "subnormal";
      exactFormula = `${sign ? "-" : "+"}0.${mantissaBits.slice(0, 6)}... × 2^(-126)`;
    }
  } else {
    classification = "normal";
    unbiasedExponent = biasedExponent - 127;
    ulp = Math.pow(2, unbiasedExponent - 23);
    exactFormula = `${sign ? "-" : "+"}(1 + ${(mantissaInt / 8388608).toPrecision(6)}) × 2^(${unbiasedExponent})`;
  }

  return {
    value,
    bits,
    hex,
    uint32: u,
    sign,
    exponentBits,
    biasedExponent,
    unbiasedExponent,
    mantissaBits,
    mantissaFraction,
    classification,
    ulp,
    exactFormula,
  };
}

/**
 * Encodes a JavaScript number to IEEE-754 single precision and inspects all fields.
 */
export function encodeFloat32(value: number): Float32Inspection {
  const buf = new ArrayBuffer(4);
  const view = new DataView(buf);
  view.setFloat32(0, value, false);
  return decodeFloat32Uint(view.getUint32(0, false));
}

/**
 * Toggles a single bit (index 0 = MSB sign, 31 = LSB mantissa) of a float32 uint32 word.
 */
export function toggleFloat32Bit(uint32: number, bitIndexFromMsb: number): Float32Inspection {
  if (bitIndexFromMsb < 0 || bitIndexFromMsb > 31) {
    return decodeFloat32Uint(uint32);
  }
  const shift = 31 - bitIndexFromMsb;
  const next = (uint32 ^ (1 << shift)) >>> 0;
  return decodeFloat32Uint(next);
}

/**
 * Demonstrates IEEE-754 binary rounding error in both float64 and float32 (e.g. 0.1 + 0.2 !== 0.3).
 */
export function compareFloatAddition(
  a = 0.1,
  b = 0.2,
  expected = 0.3
): FloatAdditionComparison {
  const f32A = encodeFloat32(a);
  const f32B = encodeFloat32(b);
  const f32Sum = encodeFloat32(f32A.value + f32B.value);
  const f32Expected = encodeFloat32(expected);
  const f64Sum = a + b;
  const ulpDifference = Math.abs((f32Sum.uint32 >>> 0) - (f32Expected.uint32 >>> 0));

  return {
    a,
    b,
    expected,
    f32A,
    f32B,
    f32Sum,
    f32Expected,
    f64Sum,
    f64EqualExpected: f64Sum === expected,
    f32EqualExpected: f32Sum.value === f32Expected.value,
    f64Delta: f64Sum - expected,
    ulpDifference,
  };
}

/**
 * Encodes 4 data bits (d1 d2 d3 d4) into a 7-bit even-parity Hamming(7,4) codeword:
 * positions 1..7 = [p1, p2, d1, p4, d2, d3, d4].
 */
export function hamming74Encode(data4Bits: string): string {
  const clean = data4Bits.replace(/[^01]/g, "").slice(0, 4).padStart(4, "0");
  const d1 = Number(clean[0]);
  const d2 = Number(clean[1]);
  const d3 = Number(clean[2]);
  const d4 = Number(clean[3]);

  const p1 = d1 ^ d2 ^ d4;
  const p2 = d1 ^ d3 ^ d4;
  const p4 = d2 ^ d3 ^ d4;

  return `${p1}${p2}${d1}${p4}${d2}${d3}${d4}`;
}

/**
 * Flips a 1-indexed bit (1..7) in a 7-bit Hamming codeword to inject a single-bit error.
 */
export function hamming74FlipBit(codeword7: string, pos1To7: number): string {
  const clean = codeword7.replace(/[^01]/g, "").slice(0, 7).padStart(7, "0");
  if (pos1To7 < 1 || pos1To7 > 7) return clean;
  const arr = clean.split("");
  arr[pos1To7 - 1] = arr[pos1To7 - 1] === "1" ? "0" : "1";
  return arr.join("");
}

/**
 * Decodes a 7-bit Hamming(7,4) codeword, computes the syndrome, and corrects any single-bit error.
 */
export function hamming74Decode(received7: string): Hamming74Result {
  const clean = received7.replace(/[^01]/g, "").slice(0, 7).padStart(7, "0");
  const b = clean.split("").map(Number); // 0-indexed for positions 1..7

  // s1 checks positions 1,3,5,7 (0-indexed: 0,2,4,6)
  const s1 = b[0] ^ b[2] ^ b[4] ^ b[6];
  // s2 checks positions 2,3,6,7 (0-indexed: 1,2,5,6)
  const s2 = b[1] ^ b[2] ^ b[5] ^ b[6];
  // s4 checks positions 4,5,6,7 (0-indexed: 3,4,5,6)
  const s4 = b[3] ^ b[4] ^ b[5] ^ b[6];

  const syndrome = s1 + (s2 << 1) + (s4 << 2);
  const corrected = [...b];
  if (syndrome >= 1 && syndrome <= 7) {
    corrected[syndrome - 1] = corrected[syndrome - 1] ^ 1;
  }

  const correctedBits = corrected.join("");
  const correctedDataBits = `${corrected[2]}${corrected[4]}${corrected[5]}${corrected[6]}`;
  const dataBits = `${b[2]}${b[4]}${b[5]}${b[6]}`;

  return {
    dataBits,
    codewordBits: clean,
    syndrome,
    errorPosition: syndrome === 0 ? null : syndrome,
    correctedBits,
    correctedDataBits,
  };
}
