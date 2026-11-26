"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import { getSimulatorById } from "@/data/simulators";
import {
  BPE_PRESETS,
  runBpeTokenizer,
  type BpeMode,
} from "@/lib/simulators/bpeTokenizer";

export function BpeTokenizerLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const meta = getSimulatorById("bpe-tokenizer");
  const goalText = challengeGoal ?? meta?.challengeDescription;

  const [text, setText] = useState("banana band");
  const [mode, setMode] = useState<BpeMode>("fixed");
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);

  const [challengeCompleted, setChallengeCompleted] = useState(false);
  const completedRef = useRef(false);

  const result = useMemo(
    () =>
      runBpeTokenizer({
        text,
        mode,
        step,
        maxDynamicSteps: 22,
      }),
    [text, mode, step]
  );

  // Clamp step when text/mode changes
  useEffect(() => {
    if (step > result.maxSteps) {
      setStep(result.maxSteps);
    }
  }, [step, result.maxSteps]);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setStep((s) => {
        if (s >= result.maxSteps) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 650);
    return () => window.clearInterval(timer);
  }, [playing, result.maxSteps]);

  // Challenge: execute merges until subwords compress an input below 0.5 tokens per char
  useEffect(() => {
    const solved =
      result.step > 0 &&
      result.charCount >= 8 &&
      result.tokensPerChar < 0.5;
    if (solved && !completedRef.current) {
      completedRef.current = true;
      setChallengeCompleted(true);
      onChallengeComplete?.();
    }
  }, [result, onChallengeComplete]);

  function handlePreset(presetText: string, recommendedMode: BpeMode) {
    setPlaying(false);
    setText(presetText);
    setMode(recommendedMode);
    setStep(0);
  }

  function handleReset() {
    setPlaying(false);
    setText("banana band");
    setMode("fixed");
    setStep(0);
  }

  // Unique token embeddings for 2D SVG scatter plot
  const uniqueEmbeddings = useMemo(() => {
    const seen = new Set<string>();
    return result.embeddings.filter((e) => {
      if (seen.has(e.token)) return false;
      seen.add(e.token);
      return true;
    });
  }, [result.embeddings]);

  return (
    <div className="swiss-card p-5 text-[var(--text-primary)] space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Subword Tokenization · Byte-Pair Encoding (BPE)
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            {meta?.title ?? "BPE Tokenizer & Subword Merge Lab"}
          </h3>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-subtle)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset
        </button>
      </div>

      {/* Challenge Banner */}
      {goalText && (
        <div
          className={`flex items-center justify-between gap-3 rounded border px-3 py-2 text-xs ${
            challengeCompleted
              ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
          }`}
        >
          <p className="text-[var(--text-secondary)]">
            <strong className="font-semibold text-[var(--text-primary)]">
              Challenge:
            </strong>{" "}
            {goalText}
          </p>
          {challengeCompleted && (
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Solved
            </span>
          )}
        </div>
      )}

      {/* Input & Merge Mode */}
      <div className="grid gap-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 lg:grid-cols-12">
        <div className="space-y-2 lg:col-span-7">
          <div className="text-xs font-semibold">Input Text Corpus (up to 96 chars)</div>
          <input
            type="text"
            value={text}
            onChange={(e) => {
              setPlaying(false);
              setText(e.target.value);
              setStep(0);
            }}
            placeholder="Enter text or code snippet..."
            className="w-full rounded border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1.5 font-mono text-xs"
          />
          <div className="flex flex-wrap gap-1.5">
            {BPE_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePreset(p.text, p.recommendedMode)}
                className={`rounded border px-2 py-0.5 font-mono text-[11px] ${
                  text === p.text
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2 lg:col-span-5">
          <div className="text-xs font-semibold">Merge Strategy &amp; Playback</div>
          <div className="flex gap-1.5">
            {(["fixed", "dynamic"] as BpeMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setMode(m);
                  setStep(0);
                }}
                className={`flex-1 rounded border px-2 py-1 font-mono text-xs ${
                  mode === m
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                {m === "fixed" ? "Fixed Table" : "Dynamic Greedy"}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              disabled={result.maxSteps === 0}
              className="inline-flex items-center gap-1 rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2.5 py-1 font-mono text-xs text-[var(--accent-blue)] disabled:opacity-50"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(result.maxSteps, s + 1))}
              disabled={step >= result.maxSteps}
              className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-muted)] disabled:opacity-50"
            >
              <StepForward className="h-3.5 w-3.5" />
              Step Merge
            </button>
            <span className="font-mono text-xs swiss-tabular text-[var(--text-muted)]">
              Merge {result.step} / {result.maxSteps}
            </span>
          </div>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="grid grid-cols-2 gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 font-mono text-xs swiss-tabular sm:grid-cols-4">
        <div>
          <div className="text-[10px] uppercase text-[var(--text-muted)]">
            Characters
          </div>
          <div className="text-sm font-semibold">{result.charCount}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-[var(--text-muted)]">
            Active Tokens
          </div>
          <div className="text-sm font-semibold text-[var(--accent-blue)]">
            {result.tokenCount}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-[var(--text-muted)]">
            Fertility (Tok/Char)
          </div>
          <div
            className={`text-sm font-semibold ${
              result.tokensPerChar < 0.5
                ? "text-[var(--accent-emerald)]"
                : "text-[var(--text-primary)]"
            }`}
          >
            {result.tokensPerChar.toFixed(3)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase text-[var(--text-muted)]">
            Compression Ratio
          </div>
          <div className="text-sm font-semibold">
            {result.compressionRatio.toFixed(2)}×
          </div>
        </div>
      </div>

      {/* Token Chips & Token IDs */}
      <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold">Tokenized Segments &amp; Vocabulary IDs</span>
          <span className="font-mono text-[11px] text-[var(--text-muted)]">
            Vocab size: {result.vocab.length}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {result.tokens.map((tok, idx) => {
            const isMerged = tok.length > 1;
            const display = tok === " " ? "␠" : tok.replace(/ /g, "␠");
            return (
              <div
                key={`${idx}-${tok}`}
                className={`flex flex-col items-center rounded border px-2 py-1 font-mono text-xs ${
                  isMerged
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                <span className="font-semibold">{display}</span>
                <span className="text-[10px] text-[var(--text-muted)] swiss-tabular">
                  id:{result.tokenIds[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Split: Active Pair Frequencies + Applied Merges + 2D Embedding Scatter */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 lg:col-span-4">
          <div className="mb-2 text-xs font-semibold">
            Top Adjacent Pair Frequencies
          </div>
          <div className="space-y-1 font-mono text-xs swiss-tabular">
            {result.activePairFrequencies.slice(0, 6).map((pf, i) => (
              <div
                key={`${pf.merged}-${i}`}
                className="flex items-center justify-between rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1"
              >
                <span>
                  ({JSON.stringify(pf.pair[0])}, {JSON.stringify(pf.pair[1])}) →{" "}
                  <strong className="text-[var(--accent-blue)]">
                    {JSON.stringify(pf.merged)}
                  </strong>
                </span>
                <span className="font-semibold">{pf.count}×</span>
              </div>
            ))}
            {result.activePairFrequencies.length === 0 && (
              <div className="text-xs text-[var(--text-muted)]">
                Single token — no adjacent pairs left.
              </div>
            )}
          </div>
        </div>

        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 lg:col-span-4">
          <div className="mb-2 text-xs font-semibold">Applied Merge History</div>
          <div className="max-h-44 space-y-1 overflow-y-auto font-mono text-xs swiss-tabular">
            {result.appliedMerges.map((m) => (
              <div
                key={m.step}
                className="flex items-center justify-between rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1"
              >
                <span>
                  #{m.step}: {JSON.stringify(m.left)} + {JSON.stringify(m.right)}
                </span>
                <span className="font-semibold text-[var(--accent-emerald)]">
                  → {JSON.stringify(m.merged)} ({m.occurrencesMerged}×)
                </span>
              </div>
            ))}
            {result.appliedMerges.length === 0 && (
              <div className="text-xs text-[var(--text-muted)]">
                Step forward to apply BPE merges.
              </div>
            )}
          </div>
        </div>

        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 lg:col-span-4">
          <div className="mb-2 text-xs font-semibold">
            2D Token Embedding Projection
          </div>
          <svg
            viewBox="0 0 220 150"
            className="h-36 w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
          >
            <line
              x1="110"
              y1="8"
              x2="110"
              y2="142"
              stroke="var(--border-strong)"
              strokeDasharray="3 3"
            />
            <line
              x1="12"
              y1="75"
              x2="208"
              y2="75"
              stroke="var(--border-strong)"
              strokeDasharray="3 3"
            />
            {uniqueEmbeddings.map((e) => {
              const cx = 20 + e.vec2d[0] * 180;
              const cy = 135 - e.vec2d[1] * 120;
              const label = e.token === " " ? "␠" : e.token;
              return (
                <g key={`${e.id}-${e.token}`}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={e.token.length > 1 ? 5 : 3.5}
                    fill={
                      e.token.length > 1
                        ? "var(--accent-blue)"
                        : "var(--accent-amber)"
                    }
                  />
                  <text
                    x={cx + 6}
                    y={cy + 3}
                    fontSize="9"
                    fontFamily="var(--font-mono-stack)"
                    fill="var(--text-primary)"
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
