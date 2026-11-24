"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Pause, Play, RotateCcw, StepForward } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  COMPILER_PRESETS,
  formatIrInstruction,
  runCompilerPipeline,
  type ExprNode,
  type StmtNode,
} from "@/lib/simulators/compilerPipeline";

function AstExprView({ node, depth = 0 }: { node: ExprNode; depth?: number }) {
  const indent = depth * 12;
  if (node.kind === "NumberLiteral") {
    return (
      <div style={{ paddingLeft: indent }} className="text-[var(--accent-emerald)]">
        Num({node.value})
      </div>
    );
  }
  if (node.kind === "Identifier") {
    return (
      <div style={{ paddingLeft: indent }} className="text-[var(--accent-blue)]">
        Var({node.name})
      </div>
    );
  }
  if (node.kind === "UnaryExpr") {
    return (
      <div>
        <div style={{ paddingLeft: indent }}>Unary({node.op})</div>
        <AstExprView node={node.operand} depth={depth + 1} />
      </div>
    );
  }
  return (
    <div>
      <div style={{ paddingLeft: indent }} className="font-semibold">
        BinOp({node.op})
      </div>
      <AstExprView node={node.left} depth={depth + 1} />
      <AstExprView node={node.right} depth={depth + 1} />
    </div>
  );
}

function AstStmtView({ stmt }: { stmt: StmtNode }) {
  if (stmt.kind === "LetStmt") {
    return (
      <div className="mb-2 border-l-2 border-[var(--accent-blue)] pl-2">
        <div className="font-semibold text-[var(--accent-blue)]">
          LetStmt({stmt.name})
        </div>
        <AstExprView node={stmt.expr} depth={1} />
      </div>
    );
  }
  return (
    <div className="mb-2 border-l-2 border-[var(--border-strong)] pl-2">
      <div className="font-semibold">ExprStmt</div>
      <AstExprView node={stmt.expr} depth={1} />
    </div>
  );
}

export function CompilerPipelineLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [source, setSource] = useState(COMPILER_PRESETS[0].source);
  const [constantFolding, setConstantFolding] = useState(true);
  const [algebraicSimplification, setAlgebraicSimplification] = useState(true);
  const [deadCodeElimination, setDeadCodeElimination] = useState(true);
  const [vmPc, setVmPc] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const result = useMemo(
    () =>
      runCompilerPipeline(source, {
        constantFolding,
        algebraicSimplification,
        deadCodeElimination,
      }),
    [source, constantFolding, algebraicSimplification, deadCodeElimination]
  );

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  useEffect(() => {
    const collapsed =
      result.ok &&
      result.stats.foldedConstants >= 2 &&
      result.stats.eliminatedDeadInstructions >= 3 &&
      result.optimizedIr.length <= 2;
    if (!completedRef.current && collapsed) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [result, onChallengeComplete]);

  useEffect(() => {
    setVmPc(Math.max(0, result.vmTrace.length - 1));
    setIsPlaying(false);
  }, [source, constantFolding, algebraicSimplification, deadCodeElimination, result.vmTrace.length]);

  useEffect(() => {
    if (!isPlaying) return;
    if (vmPc >= result.vmTrace.length - 1) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => {
      setVmPc((p) => Math.min(result.vmTrace.length - 1, p + 1));
    }, 500);
    return () => clearTimeout(timer);
  }, [isPlaying, vmPc, result.vmTrace.length]);

  const currentVmStep = result.vmTrace[vmPc];

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · Compilers &amp; IR Lowering
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            Lexer, Parser, AST, SSA IR &amp; VM Pipeline
          </h3>
        </div>
        {challengeDone && (
          <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Challenge Passed
          </span>
        )}
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <strong className="font-semibold text-[var(--text-primary)]">
            Challenge:
          </strong>{" "}
          {challengeGoal}
        </div>
      )}

      {/* Source Editor & Pass Toggles */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-medium text-[var(--text-secondary)]">
              Mini-Language Source (`let` bindings + arithmetic expressions)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {COMPILER_PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSource(p.source)}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1 text-[11px] text-[var(--text-secondary)] hover:bg-[var(--bg-muted)]"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <textarea
            rows={4}
            value={source}
            onChange={(e) => setSource(e.target.value)}
            spellCheck={false}
            className="w-full rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] p-3 font-mono text-xs text-[var(--text-primary)]"
          />
          {!result.ok && (
            <p className="rounded border border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] px-3 py-2 font-mono text-xs text-[var(--accent-crimson)]">
              {result.error}
            </p>
          )}
        </div>

        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Optimization Passes
          </div>
          <label className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={constantFolding}
              onChange={(e) => setConstantFolding(e.target.checked)}
            />
            Constant Folding
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={algebraicSimplification}
              onChange={(e) => setAlgebraicSimplification(e.target.checked)}
            />
            Algebraic Simplification
          </label>
          <label className="flex items-center gap-2 text-xs text-[var(--text-primary)]">
            <input
              type="checkbox"
              checked={deadCodeElimination}
              onChange={(e) => setDeadCodeElimination(e.target.checked)}
            />
            Dead-Code Elimination (DCE)
          </label>

          <div className="border-t border-[var(--border-subtle)] pt-2 font-mono text-xs swiss-tabular space-y-1">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">IR Instructions:</span>
              <span>
                {result.stats.originalCount} -&gt; {result.stats.optimizedCount}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">Folded / Eliminated:</span>
              <span>
                {result.stats.foldedConstants} / {result.stats.eliminatedDeadInstructions}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-[var(--accent-emerald)]">
              <span>VM Result:</span>
              <span>{result.vmResult ?? "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 4-Stage Pipeline Grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {/* Stage 1: Tokens */}
        <div className="rounded border border-[var(--border-subtle)] p-3">
          <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            1. Lexer Tokens ({result.tokens.length})
          </h4>
          <div className="max-h-56 overflow-y-auto space-y-1 font-mono text-[11px]">
            {result.tokens
              .filter((t) => t.type !== "EOF")
              .map((t, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded bg-[var(--bg-subtle)] px-2 py-0.5"
                >
                  <span className="text-[var(--accent-blue)]">{t.type}</span>
                  <span>{t.value}</span>
                  <span className="text-[10px] text-[var(--text-muted)]">
                    {t.line}:{t.col}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* Stage 2: AST */}
        <div className="rounded border border-[var(--border-subtle)] p-3">
          <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            2. Parsed AST
          </h4>
          <div className="max-h-56 overflow-y-auto font-mono text-[11px]">
            {result.ast?.statements.map((stmt, idx) => (
              <AstStmtView key={idx} stmt={stmt} />
            ))}
          </div>
        </div>

        {/* Stage 3: Unoptimized vs Optimized SSA IR */}
        <div className="rounded border border-[var(--border-subtle)] p-3">
          <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            3. SSA IR (Opt vs Raw)
          </h4>
          <div className="max-h-56 overflow-y-auto space-y-2 font-mono text-[11px]">
            <div>
              <div className="mb-1 text-[10px] uppercase text-[var(--accent-emerald)]">
                Optimized ({result.optimizedIr.length} ops)
              </div>
              {result.optimizedIr.map((inst, i) => (
                <div
                  key={i}
                  className={`rounded px-1.5 py-0.5 ${
                    i === vmPc
                      ? "bg-[var(--accent-blue-soft)] font-semibold text-[var(--accent-blue)]"
                      : ""
                  }`}
                >
                  {i}: {formatIrInstruction(inst)}
                </div>
              ))}
            </div>
            <div className="border-t border-[var(--border-subtle)] pt-1.5 text-[var(--text-muted)]">
              <div className="mb-1 text-[10px] uppercase">
                Unoptimized ({result.unoptimizedIr.length} ops)
              </div>
              {result.unoptimizedIr.map((inst, i) => (
                <div key={i}>
                  {i}: {formatIrInstruction(inst)}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stage 4: Register VM Stepper */}
        <div className="rounded border border-[var(--border-subtle)] p-3 flex flex-col justify-between">
          <div>
            <h4 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              4. Register VM State
            </h4>
            <div className="mb-2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setVmPc((p) => Math.min(result.vmTrace.length - 1, p + 1));
                }}
                className="rounded border border-[var(--border-strong)] px-2 py-1 text-[11px]"
              >
                <StepForward className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isPlaying && vmPc >= result.vmTrace.length - 1) setVmPc(0);
                  setIsPlaying((p) => !p);
                }}
                className="rounded bg-[var(--accent-blue)] px-2 py-1 text-[11px] text-white"
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsPlaying(false);
                  setVmPc(0);
                }}
                className="rounded border border-[var(--border-strong)] px-2 py-1 text-[11px]"
              >
                <RotateCcw className="h-3 w-3" />
              </button>
            </div>

            {currentVmStep && (
              <div className="space-y-1 font-mono text-[11px]">
                <div className="rounded bg-[var(--bg-subtle)] px-2 py-1">
                  PC={currentVmStep.pc}: {currentVmStep.instructionText}
                </div>
                <div className="max-h-32 overflow-y-auto space-y-0.5 pt-1">
                  {Object.entries(currentVmStep.registers).map(([k, v]) => (
                    <div key={k} className="flex justify-between swiss-tabular">
                      <span className="text-[var(--text-muted)]">{k}</span>
                      <span>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mt-2 border-t border-[var(--border-subtle)] pt-2 font-mono text-xs font-semibold">
            Return Value:{" "}
            <span className="text-[var(--accent-emerald)]">
              {result.vmResult ?? "ERR"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
