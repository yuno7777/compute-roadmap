"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  StepForward,
  FastForward,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  CPU_PROGRAM_PRESETS,
  assembleCpuProgram,
  createCpuState,
  stepCpuInstruction,
  stepCpuPhase,
  type CpuPhase,
  type CpuState,
} from "@/lib/simulators/cpuFde";

const PHASES: CpuPhase[] = ["FETCH", "DECODE", "EXECUTE", "WRITEBACK"];

export function CpuFetchDecodeExecute({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const defaultPreset = CPU_PROGRAM_PRESETS[0];
  const [presetId, setPresetId] = useState(defaultPreset.id);
  const [sourceText, setSourceText] = useState(defaultPreset.source);
  const [compileErrors, setCompileErrors] = useState<string[]>([]);
  const [cpu, setCpu] = useState<CpuState>(() => {
    const { instructions } = assembleCpuProgram(defaultPreset.source);
    return createCpuState(instructions, defaultPreset.initialMemory);
  });
  const [playing, setPlaying] = useState(false);
  const completedRef = useRef(false);

  const challengeMet =
    cpu.halted && cpu.registers[1] === 15 && cpu.branchesTaken >= 4;

  useEffect(() => {
    if (challengeMet && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [challengeMet, onChallengeComplete]);

  useEffect(() => {
    if (!playing) return;
    if (cpu.halted) {
      setPlaying(false);
      return;
    }
    const id = window.setInterval(() => {
      setCpu((prev) => {
        if (prev.halted) return prev;
        return stepCpuPhase(prev);
      });
    }, 260);
    return () => window.clearInterval(id);
  }, [playing, cpu.halted]);

  const loadProgram = (src: string, initMem?: Record<number, number>) => {
    setPlaying(false);
    const { instructions, errors } = assembleCpuProgram(src);
    setCompileErrors(errors);
    if (errors.length === 0) {
      setCpu(createCpuState(instructions, initMem));
    }
  };

  const handlePresetChange = (id: (typeof CPU_PROGRAM_PRESETS)[number]["id"]) => {
    const preset = CPU_PROGRAM_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    setPresetId(id);
    setSourceText(preset.source);
    loadProgram(preset.source, preset.initialMemory);
  };

  const activePreset = CPU_PROGRAM_PRESETS.find((p) => p.id === presetId);

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 06 · Control Unit &amp; ISA
          </p>
          <h3 className="text-lg font-semibold">Fetch-Decode-Execute CPU Simulator</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {challengeMet && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setCpu((s) => stepCpuPhase(s));
            }}
            disabled={cpu.halted}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium disabled:opacity-40"
          >
            <StepForward className="h-3.5 w-3.5" /> Step Phase
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setCpu((s) => stepCpuInstruction(s));
            }}
            disabled={cpu.halted}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs font-medium disabled:opacity-40"
          >
            <FastForward className="h-3.5 w-3.5" /> Step Instr
          </button>
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            disabled={cpu.halted}
            className="inline-flex items-center gap-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 text-xs font-medium text-[var(--accent-blue)] disabled:opacity-40"
          >
            {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {playing ? "Pause" : "Run"}
          </button>
          <button
            type="button"
            onClick={() => loadProgram(sourceText, activePreset?.initialMemory)}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)]">
          <strong className="text-[var(--text-primary)]">Goal: </strong>
          {challengeGoal}
        </div>
      )}

      {/* Phase Strip + PC / IR / Flags */}
      <div className="grid gap-3 lg:grid-cols-12">
        <div className="lg:col-span-6 flex items-center gap-1.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
          {PHASES.map((ph) => (
            <div
              key={ph}
              className={`flex-1 rounded py-1.5 text-center font-mono text-[11px] font-semibold ${
                cpu.phase === ph
                  ? "bg-[var(--accent-blue)] text-white"
                  : "bg-[var(--bg-surface)] text-[var(--text-muted)]"
              }`}
            >
              {ph}
            </div>
          ))}
        </div>

        <div className="lg:col-span-6 grid grid-cols-4 gap-2 font-mono text-xs swiss-tabular">
          <div className="rounded border border-[var(--border-subtle)] px-2.5 py-1.5">
            <span className="text-[10px] text-[var(--text-muted)] block">PC</span>
            <span className="font-bold text-[var(--accent-blue)]">{cpu.pc}</span>
          </div>
          <div className="rounded border border-[var(--border-subtle)] px-2.5 py-1.5">
            <span className="text-[10px] text-[var(--text-muted)] block">Retired</span>
            <span className="font-bold">{cpu.instructionsRetired}</span>
          </div>
          <div className="rounded border border-[var(--border-subtle)] px-2.5 py-1.5">
            <span className="text-[10px] text-[var(--text-muted)] block">Branches</span>
            <span className="font-bold text-[var(--accent-amber)]">{cpu.branchesTaken}</span>
          </div>
          <div className="rounded border border-[var(--border-subtle)] px-2.5 py-1.5">
            <span className="text-[10px] text-[var(--text-muted)] block">Flags</span>
            <span className="font-bold">
              Z{Number(cpu.flags.Z)} N{Number(cpu.flags.N)}
            </span>
          </div>
        </div>
      </div>

      <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-2 font-mono text-xs text-[var(--text-primary)]">
        <span className="text-[var(--text-muted)]">Control Unit: </span>
        {cpu.decodedInfo}
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        {/* Program Presets + Editable Assembly */}
        <div className="lg:col-span-5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            {CPU_PROGRAM_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePresetChange(p.id)}
                className={`rounded border px-2 py-1 text-xs font-medium ${
                  presetId === p.id
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                {p.name}
              </button>
            ))}
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            rows={10}
            spellCheck={false}
            className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2.5 font-mono text-xs leading-relaxed"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => loadProgram(sourceText, activePreset?.initialMemory)}
              className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue)] px-3 py-1 text-xs font-medium text-white"
            >
              Assemble &amp; Load
            </button>
            {compileErrors.length > 0 && (
              <span className="text-xs font-mono text-[var(--accent-crimson)]">
                {compileErrors[0]}
              </span>
            )}
          </div>
        </div>

        {/* Instruction Memory & Registers */}
        <div className="lg:col-span-7 space-y-3">
          {/* Instruction list with PC cursor */}
          <div className="rounded border border-[var(--border-subtle)] p-3 max-h-48 overflow-y-auto">
            <div className="text-xs font-semibold mb-1.5">Instruction Memory (PC Cursor)</div>
            <div className="space-y-0.5 font-mono text-[11px] swiss-tabular">
              {cpu.program.map((ins) => {
                const isCurrent = ins.address === cpu.pc && !cpu.halted;
                return (
                  <div
                    key={ins.address}
                    className={`flex items-center gap-2 rounded px-2 py-0.5 ${
                      isCurrent
                        ? "bg-[var(--accent-blue-soft)] font-semibold text-[var(--accent-blue)]"
                        : "text-[var(--text-secondary)]"
                    }`}
                  >
                    <span className="w-4">{isCurrent ? "▶" : ""}</span>
                    <span className="w-6 text-[var(--text-muted)]">
                      {ins.address.toString().padStart(2, "0")}
                    </span>
                    <span className="w-16 text-[var(--text-muted)]">
                      0x{ins.machineWord.toString(16).toUpperCase().padStart(4, "0")}
                    </span>
                    <span>{ins.rawText}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Registers R0..R7 */}
          <div className="grid grid-cols-4 gap-2 font-mono text-xs swiss-tabular">
            {cpu.registers.map((val, idx) => (
              <div
                key={idx}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2.5 py-1.5 flex items-center justify-between"
              >
                <span className="text-[var(--text-muted)] font-semibold">R{idx}</span>
                <span className="font-bold">{val}</span>
              </div>
            ))}
          </div>

          {/* 32-word Data Memory Grid */}
          <div className="rounded border border-[var(--border-subtle)] p-3">
            <div className="text-xs font-semibold mb-1.5">32-Word Data Memory</div>
            <div className="grid grid-cols-8 gap-1 font-mono text-[10.5] swiss-tabular">
              {cpu.memory.map((val, addr) => (
                <div
                  key={addr}
                  className={`rounded border px-1.5 py-1 text-center ${
                    val !== 0
                      ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)] font-semibold"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  <div className="text-[9px] opacity-70">[{addr}]</div>
                  <div>{val}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Trace */}
      {cpu.trace.length > 0 && (
        <div className="rounded border border-[var(--border-subtle)] p-3 max-h-32 overflow-y-auto font-mono text-[11px] space-y-0.5">
          <div className="font-sans text-xs font-semibold mb-1">Execution Trace</div>
          {cpu.trace.slice(-8).map((entry) => (
            <div key={entry.cycle} className="flex items-center gap-3 text-[var(--text-secondary)]">
              <span className="text-[var(--text-muted)] w-12">#{entry.cycle}</span>
              <span className="w-12">PC={entry.pc}</span>
              <span className="flex-1">{entry.irText}</span>
              {entry.branchTaken !== undefined && (
                <span className="text-[var(--accent-amber)]">
                  {entry.branchTaken ? "TAKEN" : "NOT-TAKEN"}
                </span>
              )}
              {entry.writtenReg !== undefined && (
                <span className="text-[var(--accent-emerald)]">
                  R{entry.writtenReg}={entry.writtenValue}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CpuFetchDecodeExecute;
