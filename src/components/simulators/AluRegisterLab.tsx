"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, Cpu, RotateCcw, Zap } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  createRegisterFile,
  executeAlu,
  pulseAluWriteback,
  type AluBitWidth,
  type AluOp,
} from "@/lib/simulators/aluRegister";

const ALU_OPS: AluOp[] = ["ADD", "SUB", "AND", "OR", "XOR", "SHL", "SHR", "SLT"];

export function AluRegisterLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [regFile, setRegFile] = useState(() => createRegisterFile(8));
  const [op, setOp] = useState<AluOp>("ADD");
  const [rs1, setRs1] = useState(3); // R3 = 0x0A initially
  const [rs2, setRs2] = useState(4); // R4 = 0x05 initially
  const [rd, setRd] = useState(0);
  const [writeEnable, setWriteEnable] = useState(true);

  const completedRef = useRef(false);

  const aVal = regFile.registers[rs1] ?? 0;
  const bVal = regFile.registers[rs2] ?? 0;

  const aluPreview = useMemo(
    () => executeAlu(op, aVal, bVal, regFile.width),
    [op, aVal, bVal, regFile.width]
  );

  const challengeMet =
    regFile.width === 8 &&
    ((aluPreview.flags.V && !aluPreview.flags.C) ||
      (regFile.lastFlags.V && !regFile.lastFlags.C));

  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  const fmtHex = (v: number, w: AluBitWidth = regFile.width) =>
    `0x${(v & ((1 << w) - 1)).toString(16).toUpperCase().padStart(w / 4, "0")}`;

  const handleWidthSwitch = (width: AluBitWidth) => {
    setRegFile(createRegisterFile(width));
  };

  const handleRegEdit = (idx: number, raw: string) => {
    const parsed = raw.trim().toLowerCase().startsWith("0x")
      ? parseInt(raw.trim(), 16)
      : Number(raw.trim());
    if (!Number.isFinite(parsed)) return;
    const mask = (1 << regFile.width) - 1;
    setRegFile((prev) => {
      const next = [...prev.registers];
      next[idx] = parsed & mask;
      return { ...prev, registers: next };
    });
  };

  const handleClockPulse = () => {
    const { nextState } = pulseAluWriteback(regFile, op, rs1, rs2, rd, writeEnable);
    setRegFile(nextState);
  };

  const handleReset = () => {
    setRegFile(createRegisterFile(8));
    setOp("ADD");
    setRs1(3);
    setRs2(4);
    setRd(0);
    setWriteEnable(true);
  };

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 05 · Datapath &amp; Arithmetic
          </p>
          <h3 className="text-lg font-semibold">ALU &amp; Register File Datapath</h3>
        </div>
        <div className="flex items-center gap-2">
          {challengeMet && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <div className="inline-flex rounded border border-[var(--border-subtle)] overflow-hidden text-xs font-mono">
            {([8, 16] as const).map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => handleWidthSwitch(w)}
                className={`px-2.5 py-1 ${
                  regFile.width === w
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                {w}-bit
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Goal: </strong>
          {challengeGoal}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Controls & Datapath SVG */}
        <div className="lg:col-span-7 space-y-3">
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 space-y-3">
            <div className="flex flex-wrap gap-1.5">
              {ALU_OPS.map((candidate) => (
                <button
                  key={candidate}
                  type="button"
                  onClick={() => setOp(candidate)}
                  className={`rounded border px-2.5 py-1 font-mono text-xs font-semibold ${
                    op === candidate
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                      : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-secondary)]"
                  }`}
                >
                  {candidate}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <label className="space-y-1">
                <span className="text-[var(--text-muted)] block">Source Rs1</span>
                <select
                  value={rs1}
                  onChange={(e) => setRs1(Number(e.target.value))}
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1"
                >
                  {regFile.registers.map((val, i) => (
                    <option key={i} value={i}>
                      R{i} ({fmtHex(val)})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[var(--text-muted)] block">Source Rs2</span>
                <select
                  value={rs2}
                  onChange={(e) => setRs2(Number(e.target.value))}
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1"
                >
                  {regFile.registers.map((val, i) => (
                    <option key={i} value={i}>
                      R{i} ({fmtHex(val)})
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-[var(--text-muted)] block">Dest Rd</span>
                <select
                  value={rd}
                  onChange={(e) => setRd(Number(e.target.value))}
                  className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2 py-1"
                >
                  {regFile.registers.map((_, i) => (
                    <option key={i} value={i}>
                      R{i}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-col justify-end gap-1">
                <label className="inline-flex items-center gap-1.5 text-[11px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={writeEnable}
                    onChange={(e) => setWriteEnable(e.target.checked)}
                  />
                  Write-Enable (WE)
                </label>
                <button
                  type="button"
                  onClick={handleClockPulse}
                  className="inline-flex items-center justify-center gap-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2 py-1 font-semibold text-[var(--accent-blue)] hover:opacity-90"
                >
                  <Zap className="h-3 w-3" /> Pulse Clock
                </button>
              </div>
            </div>
          </div>

          {/* ALU Datapath SVG */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
            <svg viewBox="0 0 480 156" className="w-full h-auto">
              {/* Register File Box */}
              <rect
                x="14"
                y="24"
                width="104"
                height="104"
                rx="6"
                fill="var(--bg-surface)"
                stroke="var(--border-strong)"
                strokeWidth="1.8"
              />
              <text x="66" y="45" textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--text-primary)">
                Register File
              </text>
              <text x="66" y="64" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono-stack)" fill="var(--accent-blue)">
                Rs1=R{rs1}: {fmtHex(aVal)}
              </text>
              <text x="66" y="84" textAnchor="middle" fontSize="10" fontFamily="var(--font-mono-stack)" fill="var(--accent-blue)">
                Rs2=R{rs2}: {fmtHex(bVal)}
              </text>
              <text x="66" y="106" textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                Rd=R{rd} {writeEnable ? "(WE=1)" : "(WE=0)"}
              </text>

              {/* Operand Buses */}
              <line x1="118" y1="56" x2="210" y2="56" stroke="var(--accent-blue)" strokeWidth="2" />
              <line x1="118" y1="96" x2="210" y2="96" stroke="var(--accent-blue)" strokeWidth="2" />
              <text x="164" y="49" textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-secondary)">
                A={aluPreview.signedA}
              </text>
              <text x="164" y="110" textAnchor="middle" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-secondary)">
                B={aluPreview.signedB}
              </text>

              {/* Classic Trapezoid ALU */}
              <polygon
                points="210,30 286,52 286,100 210,122 210,84 226,76 210,68"
                fill="var(--bg-surface)"
                stroke="var(--accent-blue)"
                strokeWidth="2.2"
              />
              <text x="252" y="74" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="var(--font-mono-stack)" fill="var(--text-primary)">
                ALU
              </text>
              <text x="252" y="90" textAnchor="middle" fontSize="10.5" fontFamily="var(--font-mono-stack)" fill="var(--accent-blue)">
                {op}
              </text>

              {/* Result Bus + Writeback loop */}
              <line x1="286" y1="76" x2="365" y2="76" stroke="var(--accent-emerald)" strokeWidth="2.2" />
              <path
                d="M 332 76 L 332 142 L 66 142 L 66 128"
                fill="none"
                stroke={writeEnable ? "var(--accent-emerald)" : "var(--border-strong)"}
                strokeWidth="1.6"
                strokeDasharray={writeEnable ? undefined : "4 3"}
              />
              <text x="372" y="71" fontSize="11" fontWeight="700" fontFamily="var(--font-mono-stack)" fill="var(--accent-emerald)">
                {fmtHex(aluPreview.result)}
              </text>
              <text x="372" y="86" fontSize="9.5" fontFamily="var(--font-mono-stack)" fill="var(--text-muted)">
                signed={aluPreview.signedResult}
              </text>
            </svg>
          </div>

          {/* Status Flags Z N C V */}
          <div className="grid grid-cols-4 gap-2 font-mono text-xs swiss-tabular">
            {(
              [
                { key: "Z", label: "Zero", val: aluPreview.flags.Z },
                { key: "N", label: "Negative", val: aluPreview.flags.N },
                { key: "C", label: "Carry", val: aluPreview.flags.C },
                { key: "V", label: "Overflow", val: aluPreview.flags.V },
              ] as const
            ).map((f) => (
              <div
                key={f.key}
                className={`rounded border p-2.5 text-center ${
                  f.val
                    ? f.key === "V"
                      ? "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]"
                      : "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--text-muted)]"
                }`}
              >
                <div className="text-[11px]">{f.label}</div>
                <div className="text-base font-bold mt-0.5">
                  {f.key} = {f.val ? 1 : 0}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Register File Table */}
        <div className="lg:col-span-5 rounded border border-[var(--border-subtle)] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
              Registers R0..R7 (editable)
            </span>
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              Pulses: {regFile.writePulseCount}
            </span>
          </div>

          <div className="space-y-1.5">
            {regFile.registers.map((val, idx) => {
              const mask = (1 << regFile.width) - 1;
              const signBit = 1 << (regFile.width - 1);
              const signed = (val & signBit) !== 0 ? val - (1 << regFile.width) : val;
              const isWritten = regFile.lastWrittenReg === idx;
              return (
                <div
                  key={idx}
                  className={`flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 font-mono text-xs swiss-tabular ${
                    isWritten
                      ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                  }`}
                >
                  <span className="font-bold w-8">R{idx}</span>
                  <input
                    type="text"
                    value={fmtHex(val)}
                    onChange={(e) => handleRegEdit(idx, e.target.value)}
                    className="w-20 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-1.5 py-0.5 text-xs"
                    aria-label={`Register R${idx}`}
                  />
                  <span className="text-[var(--text-muted)] text-[11px] w-24 text-right">
                    u:{val & mask} / s:{signed}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AluRegisterLab;
