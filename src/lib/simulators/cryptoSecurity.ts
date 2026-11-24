// ============================================================================
// 1. Diffie-Hellman Key Exchange (BigInt modular exponentiation)
// ============================================================================

export interface DiffieHellmanResult {
  p: bigint;
  g: bigint;
  aliceSecret: bigint;
  bobSecret: bigint;
  alicePublic: bigint;
  bobPublic: bigint;
  aliceSharedSecret: bigint;
  bobSharedSecret: bigint;
  secretsMatch: boolean;
  isPrimeP: boolean;
}

export function modPow(base: bigint, exp: bigint, mod: bigint): bigint {
  if (mod <= 0n) throw new Error("Modulus must be positive");
  if (mod === 1n) return 0n;
  let result = 1n;
  let b = ((base % mod) + mod) % mod;
  let e = exp < 0n ? 0n : exp;
  while (e > 0n) {
    if ((e & 1n) === 1n) {
      result = (result * b) % mod;
    }
    e >>= 1n;
    b = (b * b) % mod;
  }
  return result;
}

export function isPrimeNumber(n: number): boolean {
  if (!Number.isInteger(n) || n < 2) return false;
  if (n === 2 || n === 3) return true;
  if (n % 2 === 0 || n % 3 === 0) return false;
  for (let i = 5; i * i <= n; i += 6) {
    if (n % i === 0 || n % (i + 2) === 0) return false;
  }
  return true;
}

export function computeDiffieHellman(
  pNum: number,
  gNum: number,
  aNum: number,
  bNum: number
): DiffieHellmanResult {
  const p = BigInt(Math.max(3, Math.floor(pNum)));
  const g = BigInt(Math.max(2, Math.floor(gNum)));
  const aliceSecret = BigInt(Math.max(1, Math.floor(aNum)));
  const bobSecret = BigInt(Math.max(1, Math.floor(bNum)));

  const alicePublic = modPow(g, aliceSecret, p);
  const bobPublic = modPow(g, bobSecret, p);
  const aliceSharedSecret = modPow(bobPublic, aliceSecret, p);
  const bobSharedSecret = modPow(alicePublic, bobSecret, p);

  return {
    p,
    g,
    aliceSecret,
    bobSecret,
    alicePublic,
    bobPublic,
    aliceSharedSecret,
    bobSharedSecret,
    secretsMatch: aliceSharedSecret === bobSharedSecret,
    isPrimeP: isPrimeNumber(Math.floor(pNum)),
  };
}

// ============================================================================
// 2. Educational AES-128 Round State Visualizer (SubBytes/ShiftRows/MixColumns/AddRoundKey)
// ============================================================================

// Standard FIPS-197 AES S-Box
const AES_SBOX = new Uint8Array([
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16,
]);

function gfMul2(x: number): number {
  return ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff;
}

function gfMul3(x: number): number {
  return gfMul2(x) ^ x;
}

export interface AesRoundSnapshot {
  stage: string;
  state: number[]; // 16 bytes in column-major order
}

export function textToBlock16(text: string): number[] {
  const encoder = new TextEncoder();
  const raw = encoder.encode(text);
  const block = new Array<number>(16).fill(0);
  for (let i = 0; i < Math.min(16, raw.length); i++) {
    block[i] = raw[i];
  }
  return block;
}

export function runAesSingleRoundDemo(
  plaintextBytes: number[],
  keyBytes: number[],
  rounds = 2
): AesRoundSnapshot[] {
  const state = [...plaintextBytes.slice(0, 16)];
  while (state.length < 16) state.push(0);
  const key = [...keyBytes.slice(0, 16)];
  while (key.length < 16) key.push(0);

  const snapshots: AesRoundSnapshot[] = [];
  const snap = (stage: string) =>
    snapshots.push({ stage, state: [...state] });

  snap("Initial State");

  // Initial AddRoundKey
  for (let i = 0; i < 16; i++) state[i] ^= key[i];
  snap("Round 0: AddRoundKey");

  for (let r = 1; r <= rounds; r++) {
    // SubBytes
    for (let i = 0; i < 16; i++) state[i] = AES_SBOX[state[i]];
    snap(`Round ${r}: SubBytes`);

    // ShiftRows (column-major: index = col * 4 + row)
    const copy = [...state];
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        state[col * 4 + row] = copy[((col + row) % 4) * 4 + row];
      }
    }
    snap(`Round ${r}: ShiftRows`);

    // MixColumns
    for (let col = 0; col < 4; col++) {
      const c = col * 4;
      const a0 = state[c];
      const a1 = state[c + 1];
      const a2 = state[c + 2];
      const a3 = state[c + 3];
      state[c] = gfMul2(a0) ^ gfMul3(a1) ^ a2 ^ a3;
      state[c + 1] = a0 ^ gfMul2(a1) ^ gfMul3(a2) ^ a3;
      state[c + 2] = a0 ^ a1 ^ gfMul2(a2) ^ gfMul3(a3);
      state[c + 3] = gfMul3(a0) ^ a1 ^ a2 ^ gfMul2(a3);
    }
    snap(`Round ${r}: MixColumns`);

    // AddRoundKey (derive simple round key variation for demo)
    for (let i = 0; i < 16; i++) {
      state[i] ^= (key[i] + r * 0x11) & 0xff;
    }
    snap(`Round ${r}: AddRoundKey`);
  }

  return snapshots;
}

// ============================================================================
// 3. Real FIPS 180-4 SHA-256 & Bit-Level Avalanche + HMAC-SHA256
// ============================================================================

const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

function rotr(x: number, n: number): number {
  return (x >>> n) | (x << (32 - n));
}

export function sha256Bytes(input: Uint8Array): Uint8Array {
  const bitLen = input.length * 8;
  // Pad: 0x80, zeros, 64-bit big-endian length -> multiple of 64 bytes
  const paddedLen = Math.ceil((input.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLen);
  padded.set(input, 0);
  padded[input.length] = 0x80;

  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLen - 8, highBits, false);
  view.setUint32(paddedLen - 4, lowBits, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);

  for (let offset = 0; offset < paddedLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sha256Hex(message: string): string {
  const bytes = new TextEncoder().encode(message);
  return bytesToHex(sha256Bytes(bytes));
}

function hmacSha256FromBytes(keyInput: Uint8Array, msgBytes: Uint8Array): string {
  const keyBytes: Uint8Array =
    keyInput.length > 64 ? sha256Bytes(keyInput) : keyInput;
  const blockKey = new Uint8Array(64);
  blockKey.set(keyBytes, 0);

  const ipad = new Uint8Array(64);
  const opad = new Uint8Array(64);
  for (let i = 0; i < 64; i++) {
    ipad[i] = blockKey[i] ^ 0x36;
    opad[i] = blockKey[i] ^ 0x5c;
  }

  const innerInput = new Uint8Array(64 + msgBytes.length);
  innerInput.set(ipad, 0);
  innerInput.set(msgBytes, 64);
  const innerHash = sha256Bytes(innerInput);

  const outerInput = new Uint8Array(64 + 32);
  outerInput.set(opad, 0);
  outerInput.set(innerHash, 64);
  return bytesToHex(sha256Bytes(outerInput));
}

export function hmacSha256Hex(key: string, message: string): string {
  const enc = new TextEncoder();
  return hmacSha256FromBytes(enc.encode(key), enc.encode(message));
}

export interface AvalancheResult {
  originalHex: string;
  flippedHex: string;
  originalBytes: Uint8Array;
  flippedBytes: Uint8Array;
  flippedBitIndex: number;
  hammingDistance: number;
  totalBits: number;
  flipPercentage: number;
  bitDiffMask: boolean[]; // length 256: true if bit differs
  hmacOriginal: string;
  hmacFlipped: string;
  hmacVerified: boolean;
}

export function analyzeSha256Avalanche(
  message: string,
  flipBitIndex = 0,
  hmacKey = "comp-roadmap-secret"
): AvalancheResult {
  const enc = new TextEncoder();
  const origBytes = enc.encode(message.length > 0 ? message : "A");
  const modBytes = new Uint8Array(origBytes);

  const totalInputBits = modBytes.length * 8;
  const clampedBit =
    ((flipBitIndex % totalInputBits) + totalInputBits) % totalInputBits;
  const byteIdx = Math.floor(clampedBit / 8);
  const bitInByte = 7 - (clampedBit % 8);
  modBytes[byteIdx] ^= 1 << bitInByte;

  const digestA = sha256Bytes(origBytes);
  const digestB = sha256Bytes(modBytes);

  const bitDiffMask: boolean[] = [];
  let hammingDistance = 0;

  for (let i = 0; i < 32; i++) {
    const xor = digestA[i] ^ digestB[i];
    for (let b = 7; b >= 0; b--) {
      const diff = ((xor >>> b) & 1) === 1;
      bitDiffMask.push(diff);
      if (diff) hammingDistance += 1;
    }
  }

  const hmacOriginal = hmacSha256FromBytes(enc.encode(hmacKey), origBytes);
  const hmacFlippedBytes = hmacSha256FromBytes(enc.encode(hmacKey), modBytes);

  return {
    originalHex: bytesToHex(digestA),
    flippedHex: bytesToHex(digestB),
    originalBytes: origBytes,
    flippedBytes: modBytes,
    flippedBitIndex: clampedBit,
    hammingDistance,
    totalBits: 256,
    flipPercentage: Math.round((hammingDistance / 256) * 1000) / 10,
    bitDiffMask,
    hmacOriginal,
    hmacFlipped: hmacFlippedBytes,
    hmacVerified: hmacOriginal === hmacFlippedBytes,
  };
}
