export type TokenType =
  | "LET"
  | "IDENT"
  | "NUMBER"
  | "PLUS"
  | "MINUS"
  | "STAR"
  | "SLASH"
  | "PERCENT"
  | "EQ"
  | "LPAREN"
  | "RPAREN"
  | "SEMI"
  | "EOF";

export interface Token {
  type: TokenType;
  value: string;
  line: number;
  col: number;
}

export type ExprNode =
  | { kind: "NumberLiteral"; value: number }
  | { kind: "Identifier"; name: string }
  | { kind: "UnaryExpr"; op: "-"; operand: ExprNode }
  | {
      kind: "BinaryExpr";
      op: "+" | "-" | "*" | "/" | "%";
      left: ExprNode;
      right: ExprNode;
    };

export type StmtNode =
  | { kind: "LetStmt"; name: string; expr: ExprNode }
  | { kind: "ExprStmt"; expr: ExprNode };

export interface ProgramAst {
  statements: StmtNode[];
}

export type IROp = "add" | "sub" | "mul" | "div" | "mod";

export type Operand =
  | { kind: "const"; value: number }
  | { kind: "var"; name: string };

export type IRInstruction =
  | { op: "const"; dest: string; value: number }
  | { op: "copy"; dest: string; src: Operand }
  | { op: "unary"; dest: string; operator: "-"; src: Operand }
  | { op: "binop"; dest: string; operator: IROp; left: Operand; right: Operand }
  | { op: "ret"; src: Operand };

export interface OptimizationOptions {
  constantFolding: boolean;
  algebraicSimplification: boolean;
  deadCodeElimination: boolean;
}

export interface OptimizationStats {
  originalCount: number;
  optimizedCount: number;
  foldedConstants: number;
  algebraicSimplifications: number;
  eliminatedDeadInstructions: number;
}

export interface VmStep {
  pc: number;
  instructionText: string;
  registers: Record<string, number>;
}

export interface CompilerPipelineResult {
  ok: boolean;
  error?: string;
  tokens: Token[];
  ast: ProgramAst | null;
  unoptimizedIr: IRInstruction[];
  optimizedIr: IRInstruction[];
  stats: OptimizationStats;
  vmResult: number | null;
  vmTrace: VmStep[];
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  let line = 1;
  let col = 1;

  while (i < source.length) {
    const ch = source[i];

    if (ch === "\n") {
      i += 1;
      line += 1;
      col = 1;
      continue;
    }

    if (ch === " " || ch === "\t" || ch === "\r") {
      i += 1;
      col += 1;
      continue;
    }

    // Line comment
    if (ch === "/" && source[i + 1] === "/") {
      while (i < source.length && source[i] !== "\n") {
        i += 1;
        col += 1;
      }
      continue;
    }

    const startCol = col;

    if (/[0-9]/.test(ch)) {
      let numStr = "";
      let seenDot = false;
      while (
        i < source.length &&
        (/[0-9]/.test(source[i]) || (source[i] === "." && !seenDot))
      ) {
        if (source[i] === ".") seenDot = true;
        numStr += source[i];
        i += 1;
        col += 1;
      }
      tokens.push({ type: "NUMBER", value: numStr, line, col: startCol });
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      let ident = "";
      while (i < source.length && /[a-zA-Z0-9_]/.test(source[i])) {
        ident += source[i];
        i += 1;
        col += 1;
      }
      tokens.push({
        type: ident === "let" ? "LET" : "IDENT",
        value: ident,
        line,
        col: startCol,
      });
      continue;
    }

    const singleCharMap: Record<string, TokenType> = {
      "+": "PLUS",
      "-": "MINUS",
      "*": "STAR",
      "/": "SLASH",
      "%": "PERCENT",
      "=": "EQ",
      "(": "LPAREN",
      ")": "RPAREN",
      ";": "SEMI",
    };

    const mapped = singleCharMap[ch];
    if (!mapped) {
      throw new Error(`Lexical error at ${line}:${col}: unexpected character '${ch}'`);
    }
    tokens.push({ type: mapped, value: ch, line, col: startCol });
    i += 1;
    col += 1;
  }

  tokens.push({ type: "EOF", value: "", line, col });
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    this.pos += 1;
    return t;
  }

  private match(type: TokenType): boolean {
    if (this.peek().type === type) {
      this.advance();
      return true;
    }
    return false;
  }

  private expect(type: TokenType, message: string): Token {
    const t = this.peek();
    if (t.type !== type) {
      throw new Error(
        `Parse error at ${t.line}:${t.col}: ${message} (got '${t.value || t.type}')`
      );
    }
    return this.advance();
  }

  parseProgram(): ProgramAst {
    const statements: StmtNode[] = [];
    while (this.peek().type !== "EOF") {
      if (this.peek().type === "SEMI") {
        this.advance();
        continue;
      }
      statements.push(this.parseStatement());
      while (this.match("SEMI")) {
        // consume optional trailing semicolons
      }
    }
    if (statements.length === 0) {
      throw new Error("Parse error: program is empty");
    }
    return { statements };
  }

  private parseStatement(): StmtNode {
    if (this.match("LET")) {
      const ident = this.expect("IDENT", "expected variable name after 'let'");
      this.expect("EQ", "expected '=' after variable name");
      const expr = this.parseAdditive();
      return { kind: "LetStmt", name: ident.value, expr };
    }
    // Support bare assignment `x = expr`
    if (
      this.peek().type === "IDENT" &&
      this.tokens[this.pos + 1]?.type === "EQ"
    ) {
      const ident = this.advance();
      this.advance(); // '='
      const expr = this.parseAdditive();
      return { kind: "LetStmt", name: ident.value, expr };
    }
    return { kind: "ExprStmt", expr: this.parseAdditive() };
  }

  private parseAdditive(): ExprNode {
    let expr = this.parseMultiplicative();
    while (this.peek().type === "PLUS" || this.peek().type === "MINUS") {
      const op = this.advance().value as "+" | "-";
      const right = this.parseMultiplicative();
      expr = { kind: "BinaryExpr", op, left: expr, right };
    }
    return expr;
  }

  private parseMultiplicative(): ExprNode {
    let expr = this.parseUnary();
    while (
      this.peek().type === "STAR" ||
      this.peek().type === "SLASH" ||
      this.peek().type === "PERCENT"
    ) {
      const op = this.advance().value as "*" | "/" | "%";
      const right = this.parseUnary();
      expr = { kind: "BinaryExpr", op, left: expr, right };
    }
    return expr;
  }

  private parseUnary(): ExprNode {
    if (this.match("MINUS")) {
      return { kind: "UnaryExpr", op: "-", operand: this.parseUnary() };
    }
    return this.parsePrimary();
  }

  private parsePrimary(): ExprNode {
    const t = this.peek();
    if (t.type === "NUMBER") {
      this.advance();
      return { kind: "NumberLiteral", value: Number(t.value) };
    }
    if (t.type === "IDENT") {
      this.advance();
      return { kind: "Identifier", name: t.value };
    }
    if (this.match("LPAREN")) {
      const inner = this.parseAdditive();
      this.expect("RPAREN", "expected ')' after expression");
      return inner;
    }
    throw new Error(
      `Parse error at ${t.line}:${t.col}: unexpected token '${t.value || t.type}'`
    );
  }
}

export function parseTokens(tokens: Token[]): ProgramAst {
  return new Parser(tokens).parseProgram();
}

export function generateSsaIr(ast: ProgramAst): IRInstruction[] {
  const ir: IRInstruction[] = [];
  let tempIdx = 0;
  const ssaEnv: Record<string, string> = {};
  const varVersions: Record<string, number> = {};

  const freshTemp = () => `t${tempIdx++}`;
  const freshVar = (name: string) => {
    const v = varVersions[name] ?? 0;
    varVersions[name] = v + 1;
    const ssaName = `${name}_${v}`;
    ssaEnv[name] = ssaName;
    return ssaName;
  };

  const opMap: Record<"+" | "-" | "*" | "/" | "%", IROp> = {
    "+": "add",
    "-": "sub",
    "*": "mul",
    "/": "div",
    "%": "mod",
  };

  const lowerExpr = (node: ExprNode): Operand => {
    switch (node.kind) {
      case "NumberLiteral": {
        const dest = freshTemp();
        ir.push({ op: "const", dest, value: node.value });
        return { kind: "var", name: dest };
      }
      case "Identifier": {
        const bound = ssaEnv[node.name];
        if (!bound) {
          throw new Error(`Semantic error: undefined variable '${node.name}'`);
        }
        return { kind: "var", name: bound };
      }
      case "UnaryExpr": {
        const operand = lowerExpr(node.operand);
        const dest = freshTemp();
        ir.push({ op: "unary", dest, operator: "-", src: operand });
        return { kind: "var", name: dest };
      }
      case "BinaryExpr": {
        const left = lowerExpr(node.left);
        const right = lowerExpr(node.right);
        const dest = freshTemp();
        ir.push({ op: "binop", dest, operator: opMap[node.op], left, right });
        return { kind: "var", name: dest };
      }
    }
  };

  let lastResult: Operand = { kind: "const", value: 0 };
  for (const stmt of ast.statements) {
    if (stmt.kind === "LetStmt") {
      const rhs = lowerExpr(stmt.expr);
      const ssaName = freshVar(stmt.name);
      ir.push({ op: "copy", dest: ssaName, src: rhs });
      lastResult = { kind: "var", name: ssaName };
    } else {
      lastResult = lowerExpr(stmt.expr);
    }
  }

  ir.push({ op: "ret", src: lastResult });
  return ir;
}

function resolveConst(
  op: Operand,
  consts: Record<string, number>
): number | null {
  if (op.kind === "const") return op.value;
  return op.name in consts ? consts[op.name] : null;
}

function resolveCopy(op: Operand, copies: Record<string, Operand>): Operand {
  let curr = op;
  const seen = new Set<string>();
  while (curr.kind === "var" && curr.name in copies && !seen.has(curr.name)) {
    seen.add(curr.name);
    curr = copies[curr.name];
  }
  return curr;
}

function evalBinop(op: IROp, a: number, b: number): number {
  switch (op) {
    case "add":
      return a + b;
    case "sub":
      return a - b;
    case "mul":
      return a * b;
    case "div":
      if (b === 0) throw new Error("Runtime error: division by zero");
      return Math.trunc(a / b);
    case "mod":
      if (b === 0) throw new Error("Runtime error: modulo by zero");
      return a % b;
  }
}

export function optimizeIr(
  inputIr: IRInstruction[],
  options: OptimizationOptions
): { ir: IRInstruction[]; stats: OptimizationStats } {
  let ir = inputIr.map((inst) => ({ ...inst }));
  let foldedConstants = 0;
  let algebraicSimplifications = 0;

  if (options.constantFolding || options.algebraicSimplification) {
    const consts: Record<string, number> = {};
    const copies: Record<string, Operand> = {};
    const nextIr: IRInstruction[] = [];

    for (const inst of ir) {
      if (inst.op === "const") {
        consts[inst.dest] = inst.value;
        nextIr.push(inst);
      } else if (inst.op === "copy") {
        const src = resolveCopy(inst.src, copies);
        const c = resolveConst(src, consts);
        if (options.constantFolding && c !== null) {
          consts[inst.dest] = c;
          copies[inst.dest] = { kind: "const", value: c };
          nextIr.push({ op: "const", dest: inst.dest, value: c });
        } else {
          copies[inst.dest] = src;
          nextIr.push({ op: "copy", dest: inst.dest, src });
        }
      } else if (inst.op === "unary") {
        const src = resolveCopy(inst.src, copies);
        const c = resolveConst(src, consts);
        if (options.constantFolding && c !== null) {
          const val = -c;
          consts[inst.dest] = val;
          foldedConstants += 1;
          nextIr.push({ op: "const", dest: inst.dest, value: val });
        } else {
          nextIr.push({ op: "unary", dest: inst.dest, operator: "-", src });
        }
      } else if (inst.op === "binop") {
        const left = resolveCopy(inst.left, copies);
        const right = resolveCopy(inst.right, copies);
        const lc = resolveConst(left, consts);
        const rc = resolveConst(right, consts);

        if (options.constantFolding && lc !== null && rc !== null) {
          const val = evalBinop(inst.operator, lc, rc);
          consts[inst.dest] = val;
          foldedConstants += 1;
          nextIr.push({ op: "const", dest: inst.dest, value: val });
          continue;
        }

        if (options.algebraicSimplification) {
          if (inst.operator === "add" && rc === 0) {
            algebraicSimplifications += 1;
            copies[inst.dest] = left;
            nextIr.push({ op: "copy", dest: inst.dest, src: left });
            continue;
          }
          if (inst.operator === "add" && lc === 0) {
            algebraicSimplifications += 1;
            copies[inst.dest] = right;
            nextIr.push({ op: "copy", dest: inst.dest, src: right });
            continue;
          }
          if (inst.operator === "sub" && rc === 0) {
            algebraicSimplifications += 1;
            copies[inst.dest] = left;
            nextIr.push({ op: "copy", dest: inst.dest, src: left });
            continue;
          }
          if (
            inst.operator === "sub" &&
            left.kind === "var" &&
            right.kind === "var" &&
            left.name === right.name
          ) {
            algebraicSimplifications += 1;
            consts[inst.dest] = 0;
            nextIr.push({ op: "const", dest: inst.dest, value: 0 });
            continue;
          }
          if (inst.operator === "mul" && rc === 1) {
            algebraicSimplifications += 1;
            copies[inst.dest] = left;
            nextIr.push({ op: "copy", dest: inst.dest, src: left });
            continue;
          }
          if (inst.operator === "mul" && lc === 1) {
            algebraicSimplifications += 1;
            copies[inst.dest] = right;
            nextIr.push({ op: "copy", dest: inst.dest, src: right });
            continue;
          }
          if (inst.operator === "mul" && (lc === 0 || rc === 0)) {
            algebraicSimplifications += 1;
            consts[inst.dest] = 0;
            nextIr.push({ op: "const", dest: inst.dest, value: 0 });
            continue;
          }
          if (inst.operator === "div" && rc === 1) {
            algebraicSimplifications += 1;
            copies[inst.dest] = left;
            nextIr.push({ op: "copy", dest: inst.dest, src: left });
            continue;
          }
        }

        nextIr.push({
          op: "binop",
          dest: inst.dest,
          operator: inst.operator,
          left,
          right,
        });
      } else if (inst.op === "ret") {
        const src = resolveCopy(inst.src, copies);
        const c = resolveConst(src, consts);
        if (options.constantFolding && c !== null) {
          nextIr.push({ op: "ret", src: { kind: "const", value: c } });
        } else {
          nextIr.push({ op: "ret", src });
        }
      }
    }

    ir = nextIr;
  }

  let eliminatedDeadInstructions = 0;
  if (options.deadCodeElimination) {
    const used = new Set<string>();
    const keptReversed: IRInstruction[] = [];
    for (let i = ir.length - 1; i >= 0; i--) {
      const inst = ir[i];
      if (inst.op === "ret") {
        if (inst.src.kind === "var") used.add(inst.src.name);
        keptReversed.push(inst);
      } else if (used.has(inst.dest)) {
        if (inst.op === "copy" || inst.op === "unary") {
          if (inst.src.kind === "var") used.add(inst.src.name);
        } else if (inst.op === "binop") {
          if (inst.left.kind === "var") used.add(inst.left.name);
          if (inst.right.kind === "var") used.add(inst.right.name);
        }
        keptReversed.push(inst);
      } else {
        eliminatedDeadInstructions += 1;
      }
    }
    ir = keptReversed.reverse();
  }

  return {
    ir,
    stats: {
      originalCount: inputIr.length,
      optimizedCount: ir.length,
      foldedConstants,
      algebraicSimplifications,
      eliminatedDeadInstructions,
    },
  };
}

export function formatOperand(op: Operand): string {
  return op.kind === "const" ? String(op.value) : op.name;
}

export function formatIrInstruction(inst: IRInstruction): string {
  switch (inst.op) {
    case "const":
      return `${inst.dest} = const ${inst.value}`;
    case "copy":
      return `${inst.dest} = ${formatOperand(inst.src)}`;
    case "unary":
      return `${inst.dest} = -${formatOperand(inst.src)}`;
    case "binop":
      return `${inst.dest} = ${inst.operator} ${formatOperand(inst.left)}, ${formatOperand(inst.right)}`;
    case "ret":
      return `ret ${formatOperand(inst.src)}`;
  }
}

export function evaluateIr(ir: IRInstruction[]): {
  result: number;
  trace: VmStep[];
} {
  const registers: Record<string, number> = {};
  const trace: VmStep[] = [];
  let result = 0;

  const readOp = (op: Operand): number =>
    op.kind === "const" ? op.value : (registers[op.name] ?? 0);

  for (let pc = 0; pc < ir.length; pc++) {
    const inst = ir[pc];
    switch (inst.op) {
      case "const":
        registers[inst.dest] = inst.value;
        break;
      case "copy":
        registers[inst.dest] = readOp(inst.src);
        break;
      case "unary":
        registers[inst.dest] = -readOp(inst.src);
        break;
      case "binop":
        registers[inst.dest] = evalBinop(
          inst.operator,
          readOp(inst.left),
          readOp(inst.right)
        );
        break;
      case "ret":
        result = readOp(inst.src);
        break;
    }
    trace.push({
      pc,
      instructionText: formatIrInstruction(inst),
      registers: { ...registers },
    });
  }

  return { result, trace };
}

export function runCompilerPipeline(
  source: string,
  options: OptimizationOptions = {
    constantFolding: true,
    algebraicSimplification: true,
    deadCodeElimination: true,
  }
): CompilerPipelineResult {
  try {
    const tokens = tokenize(source);
    const ast = parseTokens(tokens);
    const unoptimizedIr = generateSsaIr(ast);
    const { ir: optimizedIr, stats } = optimizeIr(unoptimizedIr, options);
    const { result, trace } = evaluateIr(optimizedIr);

    return {
      ok: true,
      tokens,
      ast,
      unoptimizedIr,
      optimizedIr,
      stats,
      vmResult: result,
      vmTrace: trace,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      tokens: [],
      ast: null,
      unoptimizedIr: [],
      optimizedIr: [],
      stats: {
        originalCount: 0,
        optimizedCount: 0,
        foldedConstants: 0,
        algebraicSimplifications: 0,
        eliminatedDeadInstructions: 0,
      },
      vmResult: null,
      vmTrace: [],
    };
  }
}

export const COMPILER_PRESETS: Array<{
  id: string;
  label: string;
  source: string;
}> = [
  {
    id: "fold-dce",
    label: "Constant Fold + DCE",
    source: "let x = 2 + 3 * 4;\nlet unused = 99 * 10;\nx + 5",
  },
  {
    id: "algebraic",
    label: "Algebraic Identities",
    source: "let a = 7;\nlet b = (a * 1) + 0;\nb - 0",
  },
  {
    id: "chain",
    label: "Multi-Temp Collapse",
    source: "let a = 4 * 5;\nlet b = a + 10;\nlet c = b / 3;\nc * 2",
  },
];
