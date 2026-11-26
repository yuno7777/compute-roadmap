"use client";

import { useEffect, useMemo, useState } from "react";
import type { SimulatorProps } from "./registry";
import {
  createEventLoopTrace,
  simulatePythonCopy,
  simulateRustOwnership,
  type EventLoopScenario,
  type PythonCopyMode,
  type PythonMutationOp,
  type RustOwnershipOp,
} from "@/lib/simulators/runtimeMemoryEventLoop";

type RuntimeTab = "rust" | "python" | "eventloop";

export function RuntimeMemoryEventLoopLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [tab, setTab] = useState<RuntimeTab>("rust");

  // Mode A: Rust / C Ownership
  const [rustOp, setRustOp] = useState<RustOwnershipOp>("move");
  const [visitedRustOps, setVisitedRustOps] = useState<Set<RustOwnershipOp>>(
    () => new Set(["move"])
  );

  // Mode B: Python Object Identity
  const [pyMode, setPyMode] = useState<PythonCopyMode>("shallow");
  const [pyMutation, setPyMutation] = useState<PythonMutationOp>("mutate-inner");

  // Mode C: JS/TS Event Loop
  const [elScenario, setElScenario] =
    useState<EventLoopScenario>("promise-in-main");
  const [elStep, setElStep] = useState<number>(0);
  const [elPlaying, setElPlaying] = useState<boolean>(false);

  const [challengeDone, setChallengeDone] = useState(false);

  const rustState = useMemo(() => simulateRustOwnership(rustOp), [rustOp]);
  const pyState = useMemo(
    () => simulatePythonCopy(pyMode, pyMutation),
    [pyMode, pyMutation]
  );
  const elTrace = useMemo(() => createEventLoopTrace(elScenario), [elScenario]);
  const currentEl = elTrace[Math.min(elStep, elTrace.length - 1)];

  useEffect(() => {
    if (!elPlaying) return;
    if (elStep >= elTrace.length - 1) {
      setElPlaying(false);
      return;
    }
    const id = window.setInterval(() => {
      setElStep((s) => {
        if (s >= elTrace.length - 1) {
          setElPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, 900);
    return () => window.clearInterval(id);
  }, [elPlaying, elStep, elTrace.length]);

  useEffect(() => {
    if (challengeDone) return;
    const completed =
      (tab === "rust" && visitedRustOps.size >= 3) ||
      (tab === "python" && pyMode === "shallow" && pyMutation === "mutate-inner") ||
      (tab === "eventloop" && elStep === elTrace.length - 1);
    if (completed) {
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [
    tab,
    visitedRustOps.size,
    pyMode,
    pyMutation,
    elStep,
    elTrace.length,
    challengeDone,
    onChallengeComplete,
  ]);

  const selectRustOp = (op: RustOwnershipOp) => {
    setRustOp(op);
    setVisitedRustOps((prev) => new Set(prev).add(op));
  };

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Languages &amp; Runtimes Lab · runtime-memory-eventloop
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            Ownership, Object Identity &amp; Event Loop
          </h3>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              ["rust", "Rust / C Ownership"],
              ["python", "Python Copy & Identity"],
              ["eventloop", "JS / TS Event Loop"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => {
                setTab(id);
                setElPlaying(false);
              }}
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
      {/* TAB 1: RUST / C OWNERSHIP & LIFETIMES                             */}
      {/* ================================================================= */}
      {tab === "rust" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["move", "Move (let b = a)"],
                ["shared-borrow", "Shared Borrow (&a)"],
                ["mut-borrow", "Mutable Borrow (&mut a)"],
                ["clone", "Clone (a.clone())"],
              ] as const
            ).map(([op, label]) => (
              <button
                key={op}
                type="button"
                onClick={() => selectRustOp(op)}
                className={`rounded border px-3 py-1.5 font-mono text-xs ${
                  rustOp === op
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Heap Allocations
              </p>
              <p className="mt-1 font-mono text-lg font-semibold swiss-tabular">
                {rustState.heapAllocations}
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Read A Allowed?
              </p>
              <p
                className={`mt-1 font-mono text-sm font-semibold ${
                  rustState.useAAllowed
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-crimson)]"
                }`}
              >
                {rustState.useAAllowed ? "YES (Valid)" : "NO (Compile Error)"}
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Mutate A Allowed?
              </p>
              <p
                className={`mt-1 font-mono text-sm font-semibold ${
                  rustState.mutateAAllowed
                    ? "text-[var(--accent-emerald)]"
                    : "text-[var(--accent-amber)]"
                }`}
              >
                {rustState.mutateAAllowed ? "YES (Exclusive)" : "NO (Locked/Moved)"}
              </p>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
              <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                Active Borrows
              </p>
              <p className="mt-1 font-mono text-sm font-semibold swiss-tabular">
                &amp;T: {rustState.sharedBorrows} · &amp;mut T:{" "}
                {rustState.mutBorrows}
              </p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <pre className="!m-0 text-xs">{rustState.codeSnippet}</pre>
            <div className="space-y-2.5 text-xs">
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
                <p className="font-mono text-[10px] uppercase text-[var(--accent-blue)]">
                  Borrow Checker Verdict
                </p>
                <p className="mt-1 text-[var(--text-primary)]">
                  {rustState.compilerVerdict}
                </p>
              </div>
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
                <p className="font-mono text-[10px] uppercase text-[var(--text-muted)]">
                  Drop Timing
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {rustState.dropTiming}
                </p>
              </div>
              <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
                <p className="font-mono text-[10px] uppercase text-[var(--accent-amber)]">
                  C Pointer Contrast
                </p>
                <p className="mt-1 text-[var(--text-secondary)]">
                  {rustState.cComparisonNote}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 2: PYTHON OBJECT IDENTITY & COPYING                           */}
      {/* ================================================================= */}
      {tab === "python" && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase text-[var(--text-muted)]">
                1. Assignment Strategy (a = [[1]])
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["alias", "Alias (b = a)"],
                    ["shallow", "Shallow (b = a.copy())"],
                    ["deep", "Deep (deepcopy(a))"],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPyMode(m)}
                    className={`rounded border px-2.5 py-1 font-mono text-xs ${
                      pyMode === m
                        ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1.5 font-mono text-[11px] uppercase text-[var(--text-muted)]">
                2. Mutation Through B
              </p>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["none", "None"],
                    ["append-outer", "b.append(2)"],
                    ["mutate-inner", "b[0][0] = 7"],
                  ] as const
                ).map(([op, label]) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setPyMutation(op)}
                    className={`rounded border px-2.5 py-1 font-mono text-xs ${
                      pyMutation === op
                        ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SVG Reference Graph */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
            <svg
              viewBox="0 0 600 150"
              className="h-36 w-full"
              role="img"
              aria-label="Python object reference graph"
            >
              {/* Variable names */}
              <rect x="16" y="22" width="60" height="32" rx="6" fill="var(--bg-surface)" stroke="var(--accent-blue)" strokeWidth="1.5" />
              <text x="46" y="42" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontFamily="monospace">a</text>

              <rect x="16" y="94" width="60" height="32" rx="6" fill="var(--bg-surface)" stroke="var(--accent-emerald)" strokeWidth="1.5" />
              <text x="46" y="114" textAnchor="middle" fill="var(--text-primary)" fontSize="13" fontFamily="monospace">b</text>

              {/* Outer list(s) */}
              <rect x="170" y="16" width="160" height="44" rx="6" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
              <text x="250" y="34" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">
                outer list ({pyState.idA})
              </text>
              <text x="250" y="50" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontFamily="monospace">
                {JSON.stringify(pyState.a)}
              </text>

              {!pyState.outerShared && (
                <>
                  <rect x="170" y="88" width="160" height="44" rx="6" fill="var(--bg-surface)" stroke="var(--border-strong)" strokeWidth="1.5" />
                  <text x="250" y="106" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">
                    outer list ({pyState.idB})
                  </text>
                  <text x="250" y="122" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontFamily="monospace">
                    {JSON.stringify(pyState.b)}
                  </text>
                </>
              )}

              {/* Inner list(s) */}
              <rect x="420" y="16" width="160" height="44" rx="6" fill="var(--bg-surface)" stroke={pyState.innerShared ? "var(--accent-amber)" : "var(--border-strong)"} strokeWidth="1.5" />
              <text x="500" y="34" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">
                inner list ({pyState.idA0})
              </text>
              <text x="500" y="50" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontFamily="monospace">
                {JSON.stringify(pyState.a[0])}
              </text>

              {!pyState.innerShared && (
                <>
                  <rect x="420" y="88" width="160" height="44" rx="6" fill="var(--bg-surface)" stroke="var(--accent-emerald)" strokeWidth="1.5" />
                  <text x="500" y="106" textAnchor="middle" fill="var(--text-muted)" fontSize="10" fontFamily="monospace">
                    inner list ({pyState.idB0})
                  </text>
                  <text x="500" y="122" textAnchor="middle" fill="var(--text-primary)" fontSize="12" fontFamily="monospace">
                    {JSON.stringify(pyState.b[0])}
                  </text>
                </>
              )}

              {/* Reference arrows */}
              <line x1="76" y1="38" x2="170" y2="38" stroke="var(--accent-blue)" strokeWidth="1.5" />
              <line
                x1="76"
                y1="110"
                x2="170"
                y2={pyState.outerShared ? "44" : "110"}
                stroke="var(--accent-emerald)"
                strokeWidth="1.5"
              />
              <line x1="330" y1="38" x2="420" y2="38" stroke="var(--text-muted)" strokeWidth="1.5" />
              {!pyState.outerShared && (
                <line
                  x1="330"
                  y1="110"
                  x2="420"
                  y2={pyState.innerShared ? "46" : "110"}
                  stroke={pyState.innerShared ? "var(--accent-amber)" : "var(--accent-emerald)"}
                  strokeWidth="1.5"
                  strokeDasharray={pyState.innerShared ? "4 3" : undefined}
                />
              )}
            </svg>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 text-xs font-mono">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5">
              <span className="text-[var(--text-muted)]">a is b: </span>
              <span className="font-semibold">
                {pyState.outerShared ? "True" : "False"}
              </span>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5">
              <span className="text-[var(--text-muted)]">a[0] is b[0]: </span>
              <span
                className={`font-semibold ${
                  pyState.innerShared ? "text-[var(--accent-amber)]" : "text-[var(--accent-emerald)]"
                }`}
              >
                {pyState.innerShared ? "True (Shared)" : "False (Independent)"}
              </span>
            </div>
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5">
              <span className="text-[var(--text-muted)]">a = </span>
              <span className="font-semibold">{JSON.stringify(pyState.a)}</span>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            {pyState.explanation}
          </p>
        </div>
      )}

      {/* ================================================================= */}
      {/* TAB 3: JS / TS BROWSER EVENT LOOP STEPPER                         */}
      {/* ================================================================= */}
      {tab === "eventloop" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(
                [
                  ["promise-in-main", "Promise in Main Task"],
                  ["promise-in-timer", "Promise Inside Timer Callback"],
                ] as const
              ).map(([sc, label]) => (
                <button
                  key={sc}
                  type="button"
                  onClick={() => {
                    setElScenario(sc);
                    setElStep(0);
                    setElPlaying(false);
                  }}
                  className={`rounded border px-2.5 py-1 font-mono text-xs ${
                    elScenario === sc
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                      : "border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setElPlaying((p) => !p)}
                className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-3 py-1 font-mono text-xs text-[var(--accent-blue)]"
              >
                {elPlaying ? "Pause" : "Play"}
              </button>
              <button
                type="button"
                disabled={elStep >= elTrace.length - 1}
                onClick={() =>
                  setElStep((s) => Math.min(elTrace.length - 1, s + 1))
                }
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1 font-mono text-xs disabled:opacity-40"
              >
                Step ({elStep}/{elTrace.length - 1})
              </button>
              <button
                type="button"
                onClick={() => {
                  setElPlaying(false);
                  setElStep(0);
                }}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-2.5 py-1 font-mono text-xs"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-blue)]">
                Call Stack (LIFO)
              </p>
              <div className="mt-2 space-y-1.5 min-h-[64px]">
                {currentEl.callStack.length === 0 ? (
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    (empty)
                  </p>
                ) : (
                  [...currentEl.callStack].reverse().map((frame, i) => (
                    <div
                      key={`${frame}-${i}`}
                      className="rounded border border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] px-2 py-1 font-mono text-xs"
                    >
                      {frame}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-emerald)]">
                Microtask Queue (Promises)
              </p>
              <div className="mt-2 space-y-1.5 min-h-[64px]">
                {currentEl.microtaskQueue.length === 0 ? (
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    (empty)
                  </p>
                ) : (
                  currentEl.microtaskQueue.map((item, i) => (
                    <div
                      key={`${item}-${i}`}
                      className="rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2 py-1 font-mono text-xs"
                    >
                      {item}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-3">
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent-amber)]">
                Macrotask Queue (Timers)
              </p>
              <div className="mt-2 space-y-1.5 min-h-[64px]">
                {currentEl.macrotaskQueue.length === 0 ? (
                  <p className="font-mono text-xs text-[var(--text-muted)]">
                    (empty)
                  </p>
                ) : (
                  currentEl.macrotaskQueue.map((item, i) => (
                    <div
                      key={`${item}-${i}`}
                      className="rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] px-2 py-1 font-mono text-xs"
                    >
                      {item}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                Phase: {currentEl.phase}
              </span>
              <span className="font-mono text-[var(--accent-blue)]">
                Console:{" "}
                {currentEl.consoleOutput.length > 0
                  ? currentEl.consoleOutput.join(" → ")
                  : "—"}
              </span>
            </div>
            <p className="mt-1.5 text-[var(--text-secondary)]">
              {currentEl.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
