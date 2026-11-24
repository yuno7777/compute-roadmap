export type LogicGateType =
  | "AND"
  | "OR"
  | "NOT"
  | "NAND"
  | "NOR"
  | "XOR"
  | "XNOR";

export interface TruthTableRow {
  a: boolean;
  b?: boolean;
  output: boolean;
}

export type NandInputRef =
  | { kind: "input"; name: "A" | "B" }
  | { kind: "gate"; id: string };

export interface NandGateNode {
  id: string;
  in1: NandInputRef;
  in2: NandInputRef;
}

export interface NandPuzzleResult {
  target: "NOT" | "AND" | "OR" | "XOR";
  passed: boolean;
  gateCount: number;
  rows: Array<{
    a: boolean;
    b?: boolean;
    actual: boolean | null;
    expected: boolean;
    match: boolean;
  }>;
  error?: string;
}

export interface AdderBitStage {
  bitIndex: number;
  a: boolean;
  b: boolean;
  cin: boolean;
  sum: boolean;
  cout: boolean;
  propagate: boolean;
  generate: boolean;
}

export interface RippleAdderResult {
  aValue: number;
  bValue: number;
  cin: boolean;
  sumValue: number;
  cout: boolean;
  stages: AdderBitStage[];
}

export interface DffTraceSample {
  tick: number;
  clk: boolean;
  d: number; // 4-bit value (0..15) or 1-bit (0..1)
  q: number;
  risingEdge: boolean;
}

/**
 * Evaluates a standard 1- or 2-input Boolean logic gate.
 */
export function evaluateGate(
  gate: LogicGateType,
  a: boolean,
  b = false
): boolean {
  switch (gate) {
    case "NOT":
      return !a;
    case "AND":
      return a && b;
    case "OR":
      return a || b;
    case "NAND":
      return !(a && b);
    case "NOR":
      return !(a || b);
    case "XOR":
      return a !== b;
    case "XNOR":
      return a === b;
  }
}

/**
 * Generates the complete truth table for a standard gate.
 */
export function generateTruthTable(gate: LogicGateType): TruthTableRow[] {
  if (gate === "NOT") {
    return [false, true].map((a) => ({
      a,
      output: evaluateGate("NOT", a),
    }));
  }
  const rows: TruthTableRow[] = [];
  for (const a of [false, true]) {
    for (const b of [false, true]) {
      rows.push({ a, b, output: evaluateGate(gate, a, b) });
    }
  }
  return rows;
}

/**
 * Canonical universal-NAND constructions for NOT, AND, OR, and XOR.
 */
export function getCanonicalNandCircuit(
  target: "NOT" | "AND" | "OR" | "XOR"
): { nodes: NandGateNode[]; outputGateId: string } {
  switch (target) {
    case "NOT":
      return {
        nodes: [{ id: "g1", in1: { kind: "input", name: "A" }, in2: { kind: "input", name: "A" } }],
        outputGateId: "g1",
      };
    case "AND":
      return {
        nodes: [
          { id: "g1", in1: { kind: "input", name: "A" }, in2: { kind: "input", name: "B" } },
          { id: "g2", in1: { kind: "gate", id: "g1" }, in2: { kind: "gate", id: "g1" } },
        ],
        outputGateId: "g2",
      };
    case "OR":
      return {
        nodes: [
          { id: "g1", in1: { kind: "input", name: "A" }, in2: { kind: "input", name: "A" } },
          { id: "g2", in1: { kind: "input", name: "B" }, in2: { kind: "input", name: "B" } },
          { id: "g3", in1: { kind: "gate", id: "g1" }, in2: { kind: "gate", id: "g2" } },
        ],
        outputGateId: "g3",
      };
    case "XOR":
      return {
        nodes: [
          { id: "g1", in1: { kind: "input", name: "A" }, in2: { kind: "input", name: "B" } },
          { id: "g2", in1: { kind: "input", name: "A" }, in2: { kind: "gate", id: "g1" } },
          { id: "g3", in1: { kind: "input", name: "B" }, in2: { kind: "gate", id: "g1" } },
          { id: "g4", in1: { kind: "gate", id: "g2" }, in2: { kind: "gate", id: "g3" } },
        ],
        outputGateId: "g4",
      };
  }
}

/**
 * Evaluates an acyclic NAND netlist against a target Boolean function.
 */
export function checkNandPuzzle(
  target: "NOT" | "AND" | "OR" | "XOR",
  nodes: NandGateNode[],
  outputGateId: string
): NandPuzzleResult {
  const nodeMap = new Map<string, NandGateNode>();
  for (const n of nodes) {
    nodeMap.set(n.id, n);
  }

  const evalCircuit = (a: boolean, b: boolean): { value: boolean | null; error?: string } => {
    const memo = new Map<string, boolean>();
    const visiting = new Set<string>();

    const evalRef = (ref: NandInputRef): boolean | null => {
      if (ref.kind === "input") {
        return ref.name === "A" ? a : b;
      }
      return evalGate(ref.id);
    };

    const evalGate = (id: string): boolean | null => {
      if (memo.has(id)) return memo.get(id)!;
      if (visiting.has(id)) return null;
      const node = nodeMap.get(id);
      if (!node) return null;
      visiting.add(id);
      const v1 = evalRef(node.in1);
      const v2 = evalRef(node.in2);
      visiting.delete(id);
      if (v1 === null || v2 === null) return null;
      const out = !(v1 && v2);
      memo.set(id, out);
      return out;
    };

    if (!nodeMap.has(outputGateId)) {
      return { value: null, error: `Output gate '${outputGateId}' not found.` };
    }
    const val = evalGate(outputGateId);
    if (val === null) {
      return { value: null, error: "Circuit contains a cycle or missing gate reference." };
    }
    return { value: val };
  };

  const expectedTable = generateTruthTable(target);
  const rows: NandPuzzleResult["rows"] = [];
  let error: string | undefined;

  for (const expectedRow of expectedTable) {
    const res = evalCircuit(expectedRow.a, expectedRow.b ?? false);
    if (res.error) error = res.error;
    const match = res.value !== null && res.value === expectedRow.output;
    rows.push({
      a: expectedRow.a,
      b: expectedRow.b,
      actual: res.value,
      expected: expectedRow.output,
      match,
    });
  }

  return {
    target,
    passed: !error && rows.length > 0 && rows.every((r) => r.match),
    gateCount: nodes.length,
    rows,
    error,
  };
}

/**
 * Evaluates a 4-bit ripple-carry adder stage by stage.
 */
export function simulateRippleAdder4(
  aValue: number,
  bValue: number,
  cin = false
): RippleAdderResult {
  const a4 = aValue & 0xf;
  const b4 = bValue & 0xf;
  const stages: AdderBitStage[] = [];
  let carry = cin;
  let sumValue = 0;

  for (let i = 0; i < 4; i++) {
    const aBit = Boolean((a4 >> i) & 1);
    const bBit = Boolean((b4 >> i) & 1);
    const propagate = aBit !== bBit;
    const generate = aBit && bBit;
    const sumBit = propagate !== carry;
    const cout = generate || (propagate && carry);
    if (sumBit) {
      sumValue |= 1 << i;
    }
    stages.push({
      bitIndex: i,
      a: aBit,
      b: bBit,
      cin: carry,
      sum: sumBit,
      cout,
      propagate,
      generate,
    });
    carry = cout;
  }

  return {
    aValue: a4,
    bValue: b4,
    cin,
    sumValue,
    cout: carry,
    stages,
  };
}

/**
 * Steps a positive-edge-triggered D flip-flop (supports 1-bit or 4-bit register D).
 */
export function stepDFlipFlop(
  prevClk: boolean,
  nextClk: boolean,
  d: number,
  prevQ: number,
  bitWidth: 1 | 4 = 4
): { q: number; risingEdge: boolean } {
  const mask = bitWidth === 1 ? 1 : 0xf;
  const risingEdge = !prevClk && nextClk;
  const q = risingEdge ? d & mask : prevQ & mask;
  return { q, risingEdge };
}
