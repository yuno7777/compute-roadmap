"use client";

import { useEffect, useMemo, useState } from "react";
import type { SimulatorProps } from "./registry";
import {
  computeBinaryInfoMetrics,
  computeNumericalDerivative,
  generateBinaryEntropyCurve,
  generateStepSweep,
  type DiffFunctionId,
  type DiffMethod,
} from "@/lib/simulators/calculusEntropy";

type MathTab = "derivative" | "entropy";

function fmtSci(n: number): string {
  if (!Number.isFinite(n)) return "∞";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs < 1e-3 || abs >= 1e5) return n.toExponential(3);
  return Number(n.toPrecision(6)).toString();
}

export function CalculusEntropyLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [tab, setTab] = useState<MathTab>("derivative");

  // Mode A: Numerical Differentiation
  const [fn, setFn] = useState<DiffFunctionId>("x3");
  const [x, setX] = useState<number>(2);
  const [hExp, setHExp] = useState<number>(-2); // h = 10^hExp
  const [method, setMethod] = useState<DiffMethod>("central");

  // Mode B: Shannon Entropy & KL Divergence
  const [p, setP] = useState<number>(0.8);
  const [q, setQ] = useState<number>(0.5);

  const [challengeDone, setChallengeDone] = useState(false);

  const h = useMemo(() => Math.pow(10, hExp), [hExp]);
  const diffResult = useMemo(
    () => computeNumericalDerivative(fn, x, h, method),
    [fn, x, h, method]
  );
  const sweep = useMemo(() => generateStepSweep(fn, x), [fn, x]);

  const info = useMemo(() => computeBinaryInfoMetrics(p, q), [p, q]);
  const entropyCurve = useMemo(() => generateBinaryEntropyCurve(48), []);

  useEffect(() => {
    if (challengeDone) return;
    const completed =
      (tab === "derivative" &&
        method === "central" &&
        diffResult.absError < 1e-6) ||
      (tab === "entropy" && Math.abs(p - 0.5) < 0.03 && info.klDivergence < 0.02);
    if (completed) {
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [tab, method, diffResult.absError, p, info.klDivergence, challengeDone, onChallengeComplete]);

  // SVG Log-Log Sweep Plot helpers (exponents 0 down to -12)
  const sweepPath = (which: "forwardError" | "centralError") => {
    return sweep
      .map((pt, idx) => {
        const px = 44 + ((0 - pt.exponent) / 12) * 480;
        const logErr = Math.max(-16, Math.min(2, Math.log10(pt[which])));
        const py = 16 + ((2 - logErr) / 18) * 124;
        return `${idx === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
      })
      .join(" ");
  };

  // SVG Binary Entropy Curve helpers
  const entropyPath = useMemo(
    () =>
      entropyCurve
        .map((pt, idx) => {
          const px = 44 + pt.p * 480;
          const py = 140 - pt.entropy * 116;
          return `${idx === 0 ? "M" : "L"}${px.toFixed(1)},${py.toFixed(1)}`;
        })
        .join(" "),
    [entropyCurve]
  );

  const activePx = 44 + info.p * 480;
  const activePy = 140 - info.entropy * 116;

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Just-in-Time Math Lab · calculus-entropy
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            Numerical Differentiation &amp; Information Entropy
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["derivative", "Numerical Differentiation"],
              ["entropy", "Entropy & KL Divergence"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                tab === id
                  ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                  : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {challengeGoal && (
        <div
          className={`rounded border px-3.5 py-2.5 text-xs ${
            challengeDone
              ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--text-primary)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
          }`}
        >
          <span className="font-mono font-semibold uppercase tracking-wider">
            {challengeDone ? "Challenge Verified: " : "Challenge: "}
          </span>
          {challengeGoal}
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 1: NUMERICAL DIFFERENTIATION                                  */}
      {/* ================================================================= */}
      {tab === "derivative" && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block font-mono text-[11px] uppercase text-[var(--text-muted)]">
                Function f(x)
              </label>
              <div className="mt-1.5 flex gap-1.5">
                {(
                  [
                    ["x3", "x³"],
                    ["sin", "sin(x)"],
                    ["exp", "eˣ"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFn(id)}
                    className={`rounded border px-2.5 py-1 font-mono text-xs ${
                      fn === id
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[11px] uppercase text-[var(--text-muted)]">
                Method
              </label>
              <div className="mt-1.5 flex gap-1.5">
                {(["forward", "central"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`rounded border px-2.5 py-1 font-mono text-xs capitalize ${
                      method === m
                        ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="flex justify-between font-mono text-[11px] uppercase text-[var(--text-muted)]">
                <span>Point x</span>
                <span className="text-[var(--text-primary)]">{x.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min={-3}
                max={3}
                step={0.1}
                value={x}
                onChange={(e) => setX(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="flex justify-between font-mono text-[11px] uppercase text-[var(--text-muted)]">
                <span>Step h</span>
                <span className="text-[var(--text-primary)]">10^{hExp}</span>
              </label>
              <input
                type="range"
                min={-12}
                max={0}
                step={1}
                value={hExp}
                onChange={(e) => setHExp(Number(e.target.value))}
                className="mt-2 w-full accent-[var(--accent-blue)]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 font-mono">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Estimated f&apos;(x)
              </p>
              <p className="mt-1 text-sm font-semibold swiss-tabular">
                {fmtSci(diffResult.estimate)}
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Exact Analytical
              </p>
              <p className="mt-1 text-sm font-semibold swiss-tabular">
                {fmtSci(diffResult.exact)}
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Absolute Error
              </p>
              <p className="mt-1 text-sm font-semibold swiss-tabular text-[var(--accent-blue)]">
                {fmtSci(diffResult.absError)}
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Error Regime
              </p>
              <p
                className={`mt-1 text-xs font-semibold ${
                  diffResult.regime === "optimal-region"
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-amber)]"
                }`}
              >
                {diffResult.regime}
              </p>
            </div>
          </div>

          {/* Log-Log Error vs Step Size SVG */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
            <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-[var(--text-muted)]">
              <span>log₁₀(|Error|) vs Step Size h (10⁰ → 10⁻¹²)</span>
              <span>
                <span className="text-[var(--accent-amber)]">━ Forward O(h)</span>
                {" · "}
                <span className="text-[var(--accent-emerald)]">━ Central O(h²)</span>
              </span>
            </div>
            <svg
              viewBox="0 0 560 165"
              className="h-40 w-full"
              role="img"
              aria-label="Log-log numerical differentiation error curve"
            >
              <line x1="44" y1="16" x2="44" y2="140" stroke="var(--border-strong)" strokeWidth="1" />
              <line x1="44" y1="140" x2="528" y2="140" stroke="var(--border-strong)" strokeWidth="1" />
              <path d={sweepPath("forwardError")} fill="none" stroke="var(--accent-amber)" strokeWidth="2" />
              <path d={sweepPath("centralError")} fill="none" stroke="var(--accent-emerald)" strokeWidth="2" />
              {/* Current h marker */}
              <line
                x1={44 + ((0 - hExp) / 12) * 480}
                y1="16"
                x2={44 + ((0 - hExp) / 12) * 480}
                y2="140"
                stroke="var(--accent-blue)"
                strokeDasharray="4 3"
                strokeWidth="1.5"
              />
              <text x="44" y="156" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">h=10⁰</text>
              <text x="275" y="156" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">h=10⁻⁶</text>
              <text x="494" y="156" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">h=10⁻¹²</text>
              <text x="6" y="24" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">10²</text>
              <text x="6" y="140" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">10⁻¹⁶</text>
            </svg>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: SHANNON ENTROPY, CROSS-ENTROPY & KL DIVERGENCE             */}
      {/* ================================================================= */}
      {tab === "entropy" && (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="flex justify-between font-mono text-xs text-[var(--text-secondary)]">
                <span>Source Probability p = P(X=1)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {info.p.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={p}
                onChange={(e) => setP(Number(e.target.value))}
                className="mt-1.5 w-full accent-[var(--accent-blue)]"
              />
            </div>

            <div>
              <label className="flex justify-between font-mono text-xs text-[var(--text-secondary)]">
                <span>Model Probability q = Q(X=1)</span>
                <span className="font-semibold text-[var(--text-primary)]">
                  {info.q.toFixed(2)}
                </span>
              </label>
              <input
                type="range"
                min={0.01}
                max={0.99}
                step={0.01}
                value={q}
                onChange={(e) => setQ(Number(e.target.value))}
                className="mt-1.5 w-full accent-[var(--accent-emerald)]"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-4 font-mono">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Entropy H(p)
              </p>
              <p className="mt-1 text-base font-semibold swiss-tabular text-[var(--accent-blue)]">
                {info.entropy.toFixed(4)} bits
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Cross-Entropy H(p,q)
              </p>
              <p className="mt-1 text-base font-semibold swiss-tabular">
                {info.crossEntropy.toFixed(4)} bits
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                KL Divergence D_KL(p‖q)
              </p>
              <p className="mt-1 text-base font-semibold swiss-tabular text-[var(--accent-amber)]">
                {info.klDivergence.toFixed(4)} bits
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="text-[10px] uppercase text-[var(--text-muted)]">
                Surprise −log₂(p) / −log₂(1−p)
              </p>
              <p className="mt-1 text-xs font-semibold swiss-tabular">
                {fmtSci(info.surpriseP)} / {fmtSci(info.surpriseNotP)} bits
              </p>
            </div>
          </div>

          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
            <p className="mb-1 font-mono text-[10px] text-[var(--text-muted)]">
              Binary Shannon Entropy H(p) = −p log₂(p) − (1−p) log₂(1−p)
            </p>
            <svg
              viewBox="0 0 560 165"
              className="h-40 w-full"
              role="img"
              aria-label="Binary Shannon entropy curve"
            >
              <line x1="44" y1="20" x2="44" y2="140" stroke="var(--border-strong)" strokeWidth="1" />
              <line x1="44" y1="140" x2="528" y2="140" stroke="var(--border-strong)" strokeWidth="1" />
              <path d={entropyPath} fill="none" stroke="var(--accent-blue)" strokeWidth="2" />
              <circle cx={activePx} cy={activePy} r="5" fill="var(--accent-emerald)" />
              <text x="44" y="156" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">p=0</text>
              <text x="274" y="156" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">p=0.5 (max 1 bit)</text>
              <text x="506" y="156" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">p=1</text>
              <text x="8" y="26" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">1.0</text>
              <text x="8" y="140" fill="var(--text-muted)" fontSize="9" fontFamily="monospace">0.0</text>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
