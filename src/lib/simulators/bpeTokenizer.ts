export type BpeMode = "fixed" | "dynamic";

export interface BpeMergeRule {
  step: number;
  left: string;
  right: string;
  merged: string;
  occurrencesMerged: number;
}

export interface BpePairFrequency {
  pair: [string, string];
  merged: string;
  count: number;
}

export interface BpeTokenEmbedding {
  token: string;
  id: number;
  vec2d: [number, number];
}

export interface BpeStepResult {
  mode: BpeMode;
  inputText: string;
  step: number;
  maxSteps: number;
  tokens: string[];
  tokenIds: number[];
  vocab: string[];
  appliedMerges: BpeMergeRule[];
  activePairFrequencies: BpePairFrequency[];
  charCount: number;
  tokenCount: number;
  tokensPerChar: number;
  compressionRatio: number;
  embeddings: BpeTokenEmbedding[];
}

export interface BpePreset {
  id: string;
  label: string;
  text: string;
  recommendedMode: BpeMode;
}

export const BPE_PRESETS: BpePreset[] = [
  {
    id: "banana-band",
    label: "banana band",
    text: "banana band",
    recommendedMode: "fixed",
  },
  {
    id: "low-lower-lowest",
    label: "low lower lowest",
    text: "low lower lowest low lower",
    recommendedMode: "dynamic",
  },
  {
    id: "transformer-attention",
    label: "transformer attention",
    text: "transformer attention attends to transformed tokens",
    recommendedMode: "dynamic",
  },
  {
    id: "code-snippet",
    label: "TypeScript code",
    text: "return return function(val) { return val + val; }",
    recommendedMode: "dynamic",
  },
];

export const EDUCATIONAL_FIXED_MERGES: Array<[string, string]> = [
  ["b", "a"],
  ["n", "a"],
  ["ba", "n"],
  ["na", "na"],
];

export const EDUCATIONAL_FIXED_VOCAB: string[] = [
  "<unk>",
  "a",
  "b",
  "n",
  "d",
  " ",
  "ba",
  "na",
  "ban",
  "nana",
];

function fnv1a(str: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export function computePairFrequencies(tokens: string[]): BpePairFrequency[] {
  const counts = new Map<string, BpePairFrequency>();
  for (let i = 0; i + 1 < tokens.length; i++) {
    const left = tokens[i];
    const right = tokens[i + 1];
    const key = `${left}\u0000${right}`;
    const existing = counts.get(key);
    if (existing) {
      existing.count++;
    } else {
      counts.set(key, {
        pair: [left, right],
        merged: left + right,
        count: 1,
      });
    }
  }
  return Array.from(counts.values()).sort((a, b) => b.count - a.count);
}

function applySingleMerge(
  tokens: string[],
  left: string,
  right: string
): { nextTokens: string[]; occurrencesMerged: number } {
  const nextTokens: string[] = [];
  let occurrencesMerged = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (i + 1 < tokens.length && tokens[i] === left && tokens[i + 1] === right) {
      nextTokens.push(left + right);
      occurrencesMerged++;
      i++;
    } else {
      nextTokens.push(tokens[i]);
    }
  }
  return { nextTokens, occurrencesMerged };
}

function computeTokenVec2d(
  token: string,
  id: number,
  vocabSize: number
): [number, number] {
  if (vocabSize <= 10 && EDUCATIONAL_FIXED_VOCAB.includes(token)) {
    const x = Number((id / 10).toFixed(3));
    const y = Number(((10 - id) / 10).toFixed(3));
    return [x, y];
  }
  const hash = fnv1a(token);
  const angle = ((hash % 360) * Math.PI) / 180;
  const radius = 0.35 + ((hash >>> 10) % 55) / 100;
  return [
    Number((0.5 + radius * 0.45 * Math.cos(angle)).toFixed(3)),
    Number((0.5 + radius * 0.45 * Math.sin(angle)).toFixed(3)),
  ];
}

export function runBpeTokenizer(params: {
  text: string;
  mode: BpeMode;
  step: number;
  maxDynamicSteps?: number;
}): BpeStepResult {
  const rawChars = Array.from(params.text).slice(0, 96);
  const charCount = rawChars.length;
  let tokens = [...rawChars];
  const appliedMerges: BpeMergeRule[] = [];

  if (params.mode === "fixed") {
    const maxSteps = EDUCATIONAL_FIXED_MERGES.length;
    const targetStep = Math.max(0, Math.min(maxSteps, Math.floor(params.step)));

    for (let s = 0; s < targetStep; s++) {
      const [left, right] = EDUCATIONAL_FIXED_MERGES[s];
      const { nextTokens, occurrencesMerged } = applySingleMerge(
        tokens,
        left,
        right
      );
      tokens = nextTokens;
      appliedMerges.push({
        step: s + 1,
        left,
        right,
        merged: left + right,
        occurrencesMerged,
      });
    }

    const activePairFrequencies = computePairFrequencies(tokens);
    const tokenIds = tokens.map((t) =>
      Math.max(0, EDUCATIONAL_FIXED_VOCAB.indexOf(t))
    );
    const embeddings: BpeTokenEmbedding[] = tokens.map((token, idx) => ({
      token,
      id: tokenIds[idx],
      vec2d: computeTokenVec2d(
        token,
        tokenIds[idx],
        EDUCATIONAL_FIXED_VOCAB.length
      ),
    }));

    const tokenCount = tokens.length;
    return {
      mode: "fixed",
      inputText: rawChars.join(""),
      step: targetStep,
      maxSteps,
      tokens,
      tokenIds,
      vocab: EDUCATIONAL_FIXED_VOCAB,
      appliedMerges,
      activePairFrequencies,
      charCount,
      tokenCount,
      tokensPerChar: charCount > 0 ? tokenCount / charCount : 0,
      compressionRatio: tokenCount > 0 ? charCount / tokenCount : 1,
      embeddings,
    };
  }

  // Dynamic greedy pair-frequency BPE
  const dynamicCap = Math.max(1, Math.min(30, params.maxDynamicSteps ?? 20));
  const baseVocab = Array.from(new Set(rawChars));
  const vocab = ["<unk>", ...baseVocab];
  const allDynamicMerges: BpeMergeRule[] = [];
  let simTokens = [...rawChars];

  for (let s = 0; s < dynamicCap; s++) {
    const freqs = computePairFrequencies(simTokens);
    if (freqs.length === 0 || freqs[0].count < 2) {
      break;
    }
    const [left, right] = freqs[0].pair;
    const { nextTokens, occurrencesMerged } = applySingleMerge(
      simTokens,
      left,
      right
    );
    simTokens = nextTokens;
    const merged = left + right;
    if (!vocab.includes(merged)) vocab.push(merged);
    allDynamicMerges.push({
      step: s + 1,
      left,
      right,
      merged,
      occurrencesMerged,
    });
  }

  const maxSteps = allDynamicMerges.length;
  const targetStep = Math.max(0, Math.min(maxSteps, Math.floor(params.step)));
  tokens = [...rawChars];
  for (let s = 0; s < targetStep; s++) {
    const rule = allDynamicMerges[s];
    const { nextTokens } = applySingleMerge(tokens, rule.left, rule.right);
    tokens = nextTokens;
    appliedMerges.push(rule);
  }

  const activeVocab = ["<unk>", ...baseVocab, ...appliedMerges.map((m) => m.merged)];
  const activePairFrequencies = computePairFrequencies(tokens);
  const tokenIds = tokens.map((t) => Math.max(0, activeVocab.indexOf(t)));
  const embeddings: BpeTokenEmbedding[] = tokens.map((token, idx) => ({
    token,
    id: tokenIds[idx],
    vec2d: computeTokenVec2d(token, tokenIds[idx], activeVocab.length),
  }));

  const tokenCount = tokens.length;
  return {
    mode: "dynamic",
    inputText: rawChars.join(""),
    step: targetStep,
    maxSteps,
    tokens,
    tokenIds,
    vocab: activeVocab,
    appliedMerges,
    activePairFrequencies,
    charCount,
    tokenCount,
    tokensPerChar: charCount > 0 ? tokenCount / charCount : 0,
    compressionRatio: tokenCount > 0 ? charCount / tokenCount : 1,
    embeddings,
  };
}
