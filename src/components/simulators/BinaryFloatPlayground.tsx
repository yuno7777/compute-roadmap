"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, ShieldAlert, ShieldCheck } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  compareFloatAddition,
  decodeBinaryBits,
  decodeFloat32Uint,
  encodeFloat32,
  hamming74Decode,
  hamming74Encode,
  hamming74FlipBit,
  inspectInteger,
  toggleFloat32Bit,
  type IntBitWidth,
} from "@/lib/simulators/binaryFloat";

type BinaryTab = "ieee754" | "twos" | "hamming";

export function BinaryFloatPlayground({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [tab, setTab] = useState<BinaryTab>("ieee754");

  // IEEE-754 state
  const [floatInputText, setFloatInputText] = useState("-6.5");
  const [floatUint32, setFloatUint32] = useState(() => encodeFloat32(-6.5).uint32);
  const [encodedTargetOnce, setEncodedTargetOnce] = useState(false);
  const [demonstratedRounding, setDemonstratedRounding] = useState(false);
  const [showRoundingLab, setShowRoundingLab] = useState(false);

  // Two's complement state
  const [intWidth, setIntWidth] = useState<IntBitWidth>(8);
  const [intInputText, setIntInputText] = useState("-13");
  const [intBits, setIntBits] = useState(() => inspectInteger(-13, 8).bits);

  // Hamming(7,4) state
  const [hammingData, setHammingData] = useState("1011");
  const [flippedPos, setFlippedPos] = useState<number | null>(5);

  const completedRef = useRef(false);

  const f32 = useMemo(() => decodeFloat32Uint(floatUint32), [floatUint32]);
  const roundingCmp = useMemo(() => compareFloatAddition(0.1, 0.2, 0.3), []);
  const intInfo = useMemo(() => decodeBinaryBits(intBits, intWidth), [intBits, intWidth]);
  const intRawInput = Number(intInputText);
  const intRangeOverflow = useMemo(() => {
    if (!Number.isFinite(intRawInput)) return false;
    return inspectInteger(intRawInput, intWidth).signedOverflow;
  }, [intRawInput, intWidth]);

  const encodedHamming = useMemo(() => hamming74Encode(hammingData), [hammingData]);
  const receivedHamming = useMemo(
    () =>
      flippedPos === null ? encodedHamming : hamming74FlipBit(encodedHamming, flippedPos),
    [encodedHamming, flippedPos]
  );
  const decodedHamming = useMemo(
    () => hamming74Decode(receivedHamming),
    [receivedHamming]
  );

  // Challenge: encode -13.625 (0xC15A0000) and inspect 0.1 + 0.2 !== 0.3
  useEffect(() => {
    if (f32.hex === "0xC15A0000") {
      setEncodedTargetOnce(true);
    }
  }, [f32.hex]);

  useEffect(() => {
    if (encodedTargetOnce && demonstratedRounding && !completedRef.current) {
      completedRef.current = true;
      onChallengeComplete?.();
    }
  }, [encodedTargetOnce, demonstratedRounding, onChallengeComplete]);

  const applyFloatDecimal = (raw: string) => {
    setFloatInputText(raw);
    const trimmed = raw.trim().toLowerCase();
    if (trimmed === "nan") {
      setFloatUint32(encodeFloat32(Number.NaN).uint32);
      return;
    }
    if (trimmed === "inf" || trimmed === "+inf" || trimmed === "infinity") {
      setFloatUint32(encodeFloat32(Number.POSITIVE_INFINITY).uint32);
      return;
    }
    if (trimmed === "-inf" || trimmed === "-infinity") {
      setFloatUint32(encodeFloat32(Number.NEGATIVE_INFINITY).uint32);
      return;
    }
    const num = Number(raw);
    if (Number.isFinite(num)) {
      setFloatUint32(encodeFloat32(num).uint32);
    }
  };

  const applyIntValue = (raw: string, width: IntBitWidth) => {
    setIntInputText(raw);
    const n = Number(raw);
    if (Number.isFinite(n)) {
      setIntBits(inspectInteger(n, width).bits);
    }
  };

  const toggleIntBit = (bitIdxFromMsb: number) => {
    const arr = intBits.split("");
    arr[bitIdxFromMsb] = arr[bitIdxFromMsb] === "1" ? "0" : "1";
    const nextBits = arr.join("");
    setIntBits(nextBits);
    setIntInputText(String(decodeBinaryBits(nextBits, intWidth).signed));
  };

  const hammingLabels = ["p1", "p2", "d1", "p4", "d2", "d3", "d4"];

  return (
    <div className="swiss-card p-5 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            Hardware Lab 04 · Information Representation
          </p>
          <h3 className="text-lg font-semibold">
            Two&apos;s Complement, IEEE-754 &amp; Hamming(7,4) Lab
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {encodedTargetOnce && demonstratedRounding && (
            <span className="inline-flex items-center gap-1.5 rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Challenge Met
            </span>
          )}
          <div className="inline-flex rounded border border-[var(--border-subtle)] overflow-hidden text-xs font-medium">
            {[
              { id: "ieee754", label: "IEEE-754 Float32" },
              { id: "twos", label: "2's Complement" },
              { id: "hamming", label: "Hamming(7,4)" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id as BinaryTab)}
                className={`px-3 py-1 ${
                  tab === t.id
                    ? "bg-[var(--accent-blue)] text-white"
                    : "bg-[var(--bg-subtle)] text-[var(--text-secondary)]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {challengeGoal && (
        <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3.5 py-2.5 text-xs text-[var(--text-secondary)] flex flex-wrap items-center justify-between gap-2">
          <span>
            <strong className="text-[var(--text-primary)]">Goal: </strong>
            {challengeGoal}
          </span>
          <span className="font-mono text-[11px] flex items-center gap-3">
            <span className={encodedTargetOnce ? "text-[var(--accent-emerald)]" : "text-[var(--text-muted)]"}>
              [{encodedTargetOnce ? "✓" : " "}] -13.625 (0xC15A0000)
            </span>
            <span className={demonstratedRounding ? "text-[var(--accent-emerald)]" : "text-[var(--text-muted)]"}>
              [{demonstratedRounding ? "✓" : " "}] 0.1 + 0.2 !== 0.3
            </span>
          </span>
        </div>
      )}

      {/* TAB 1: IEEE-754 */}
      {tab === "ieee754" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="space-y-1 text-xs">
              <span className="text-[var(--text-muted)] block">Decimal / Special Input</span>
              <input
                type="text"
                value={floatInputText}
                onChange={(e) => applyFloatDecimal(e.target.value)}
                className="w-44 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-sm"
                placeholder="-13.625"
              />
            </label>
            <div className="flex flex-wrap gap-1.5">
              {["-13.625", "-6.5", "0.1", "0.3", "1e-42", "Infinity", "NaN"].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyFloatDecimal(preset)}
                  className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-1 font-mono text-xs hover:border-[var(--accent-blue)]"
                >
                  {preset}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setShowRoundingLab((v) => !v);
                  setDemonstratedRounding(true);
                }}
                className="rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--accent-amber)]"
              >
                Inspect 0.1 + 0.2 ≠ 0.3
              </button>
            </div>
          </div>

          {/* Interactive 32-bit toggle grid */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
              <div className="flex items-center gap-3">
                <span className="text-[var(--accent-crimson)]">■ Sign (1b)</span>
                <span className="text-[var(--accent-blue)]">■ Exponent (8b)</span>
                <span className="text-[var(--accent-emerald)]">■ Mantissa (23b)</span>
              </div>
              <span className="swiss-tabular font-semibold">{f32.hex}</span>
            </div>

            <div className="flex flex-wrap gap-1">
              {f32.bits.split("").map((bit, idx) => {
                const isSign = idx === 0;
                const isExp = idx >= 1 && idx <= 8;
                const colorClass = isSign
                  ? "border-[var(--accent-crimson)] text-[var(--accent-crimson)]"
                  : isExp
                  ? "border-[var(--accent-blue)] text-[var(--accent-blue)]"
                  : "border-[var(--accent-emerald)] text-[var(--accent-emerald)]";
                const bgActive = isSign
                  ? "bg-[var(--accent-crimson-soft)]"
                  : isExp
                  ? "bg-[var(--accent-blue-soft)]"
                  : "bg-[var(--accent-emerald-soft)]";
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      const next = toggleFloat32Bit(f32.uint32, idx);
                      setFloatUint32(next.uint32);
                      setFloatInputText(String(next.value));
                    }}
                    title={`Bit ${31 - idx}`}
                    className={`h-7 w-6 rounded border font-mono text-xs font-bold ${colorClass} ${
                      bit === "1" ? bgActive : "bg-[var(--bg-surface)]"
                    }`}
                  >
                    {bit}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Decoded fields */}
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4 font-mono text-xs swiss-tabular">
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Decoded Value</div>
              <div className="mt-0.5 text-sm font-semibold break-all">
                {Number.isNaN(f32.value) ? "NaN" : f32.value.toPrecision(8)}
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Class &amp; Sign</div>
              <div className="mt-0.5 text-sm font-semibold capitalize">
                {f32.classification} ({f32.sign ? "−" : "+"})
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">Exponent (Biased → Unbiased)</div>
              <div className="mt-0.5 text-sm font-semibold text-[var(--accent-blue)]">
                {f32.biasedExponent} → {f32.unbiasedExponent}
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-2.5">
              <div className="text-[11px] text-[var(--text-muted)]">1 ULP Step</div>
              <div className="mt-0.5 text-sm font-semibold text-[var(--accent-emerald)]">
                {Number.isNaN(f32.ulp) ? "N/A" : f32.ulp.toExponential(3)}
              </div>
            </div>
          </div>

          <div className="rounded border border-[var(--border-subtle)] px-3 py-2 font-mono text-xs text-[var(--text-secondary)]">
            Formula: <strong className="text-[var(--text-primary)]">{f32.exactFormula}</strong>
          </div>

          {showRoundingLab && (
            <div className="rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] p-3.5 space-y-2 text-xs">
              <div className="font-semibold text-[var(--text-primary)]">
                Why 0.1 + 0.2 !== 0.3 in IEEE-754 Binary Floating Point
              </div>
              <div className="grid gap-2 sm:grid-cols-2 font-mono swiss-tabular text-[11px]">
                <div className="rounded bg-[var(--bg-surface)] p-2 border border-[var(--border-subtle)]">
                  <div>float32(0.1) = {roundingCmp.f32A.value.toPrecision(10)} ({roundingCmp.f32A.hex})</div>
                  <div>float32(0.2) = {roundingCmp.f32B.value.toPrecision(10)} ({roundingCmp.f32B.hex})</div>
                  <div>float32(0.1+0.2) = {roundingCmp.f32Sum.value.toPrecision(10)} ({roundingCmp.f32Sum.hex})</div>
                  <div>float32(0.3) = {roundingCmp.f32Expected.value.toPrecision(10)} ({roundingCmp.f32Expected.hex})</div>
                </div>
                <div className="rounded bg-[var(--bg-surface)] p-2 border border-[var(--border-subtle)]">
                  <div>float64(0.1 + 0.2) = {roundingCmp.f64Sum.toPrecision(17)}</div>
                  <div>float64(0.3)       = {(0.3).toPrecision(17)}</div>
                  <div className="text-[var(--accent-crimson)] font-semibold mt-1">
                    f64 delta = {roundingCmp.f64Delta.toExponential(3)} (0.1 + 0.2 === 0.3 is{" "}
                    {String(roundingCmp.f64EqualExpected)})
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Two's Complement */}
      {tab === "twos" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded border border-[var(--border-subtle)] overflow-hidden text-xs font-mono">
              {([8, 16] as const).map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => {
                    setIntWidth(w);
                    applyIntValue(intInputText, w);
                  }}
                  className={`px-3 py-1 ${
                    intWidth === w
                      ? "bg-[var(--accent-blue)] text-white"
                      : "bg-[var(--bg-subtle)]"
                  }`}
                >
                  {w}-bit
                </button>
              ))}
            </div>

            <input
              type="number"
              value={intInputText}
              onChange={(e) => applyIntValue(e.target.value, intWidth)}
              className="w-36 rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-sm"
            />

            {intRangeOverflow && (
              <span className="rounded border border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] px-2.5 py-1 font-mono text-xs text-[var(--accent-crimson)]">
                Signed Overflow! Range [{intInfo.signedMin}, {intInfo.signedMax}]
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {intBits.split("").map((b, i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleIntBit(i)}
                className={`h-9 w-8 rounded border font-mono text-sm font-bold ${
                  i === 0
                    ? "border-[var(--accent-crimson)]"
                    : "border-[var(--border-subtle)]"
                } ${
                  b === "1"
                    ? "bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "bg-[var(--bg-subtle)]"
                }`}
                title={i === 0 ? "Sign bit (-2^(n-1))" : `Bit ${intWidth - 1 - i}`}
              >
                {b}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-3 font-mono text-xs swiss-tabular">
            <div className="rounded border border-[var(--border-subtle)] p-3">
              <div className="text-[var(--text-muted)]">Signed (2&apos;s Complement)</div>
              <div className="text-base font-semibold mt-0.5">{intInfo.signed}</div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-3">
              <div className="text-[var(--text-muted)]">Unsigned</div>
              <div className="text-base font-semibold mt-0.5">{intInfo.unsigned}</div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-3">
              <div className="text-[var(--text-muted)]">Hexadecimal</div>
              <div className="text-base font-semibold mt-0.5 text-[var(--accent-blue)]">
                {intInfo.hex}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Hamming(7,4) */}
      {tab === "hamming" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="font-medium text-[var(--text-secondary)]">4-Bit Data:</span>
            <div className="flex gap-1.5">
              {hammingData.split("").map((b, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const arr = hammingData.split("");
                    arr[idx] = arr[idx] === "1" ? "0" : "1";
                    setHammingData(arr.join(""));
                  }}
                  className={`h-8 w-8 rounded border font-mono font-bold ${
                    b === "1"
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue)] text-white"
                      : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            <span className="font-mono text-[var(--text-muted)]">
              Encoded = {encodedHamming}
            </span>
          </div>

          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">
                Click any bit below to inject / clear a single-bit transmission error:
              </span>
              <button
                type="button"
                onClick={() => setFlippedPos(null)}
                className="font-mono text-[11px] text-[var(--accent-blue)] underline"
              >
                Clear Error
              </button>
            </div>
            <div className="grid grid-cols-7 gap-2">
              {receivedHamming.split("").map((b, idx) => {
                const pos = idx + 1;
                const isCorrupted = flippedPos === pos;
                const isParity = pos === 1 || pos === 2 || pos === 4;
                return (
                  <button
                    key={pos}
                    type="button"
                    onClick={() => setFlippedPos((p) => (p === pos ? null : pos))}
                    className={`rounded border p-2 text-center font-mono ${
                      isCorrupted
                        ? "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]"
                        : isParity
                        ? "border-[var(--accent-amber)] bg-[var(--bg-surface)]"
                        : "border-[var(--accent-blue)] bg-[var(--bg-surface)]"
                    }`}
                  >
                    <div className="text-[10px] text-[var(--text-muted)]">
                      #{pos} ({hammingLabels[idx]})
                    </div>
                    <div className="text-base font-bold mt-0.5">{b}</div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 font-mono text-xs swiss-tabular">
            <div className="rounded border border-[var(--border-subtle)] p-3 flex items-center gap-2">
              {decodedHamming.errorPosition ? (
                <ShieldAlert className="h-4 w-4 text-[var(--accent-crimson)] shrink-0" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-[var(--accent-emerald)] shrink-0" />
              )}
              <div>
                <div className="text-[var(--text-muted)]">Syndrome (s4 s2 s1)</div>
                <div className="font-semibold">
                  {decodedHamming.syndrome.toString(2).padStart(3, "0")} →{" "}
                  {decodedHamming.errorPosition
                    ? `Bit #${decodedHamming.errorPosition} flipped`
                    : "No error"}
                </div>
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-3">
              <div className="text-[var(--text-muted)]">Corrected Codeword</div>
              <div className="font-semibold text-[var(--accent-emerald)] mt-0.5">
                {decodedHamming.correctedBits}
              </div>
            </div>
            <div className="rounded border border-[var(--border-subtle)] p-3">
              <div className="text-[var(--text-muted)]">Recovered 4-Bit Data</div>
              <div className="font-semibold text-[var(--accent-blue)] mt-0.5">
                {decodedHamming.correctedDataBits}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BinaryFloatPlayground;
