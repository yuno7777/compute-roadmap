"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, KeyRound, ShieldAlert, ShieldCheck } from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  analyzeSha256Avalanche,
  computeDiffieHellman,
  runAesSingleRoundDemo,
  textToBlock16,
} from "@/lib/simulators/cryptoSecurity";

const DH_PRESETS = [
  { label: "p=23, g=5 (textbook)", p: 23, g: 5 },
  { label: "p=467, g=2", p: 467, g: 2 },
  { label: "p=7919, g=7", p: 7919, g: 7 },
];

export function CryptoSecurityLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  // Diffie-Hellman state
  const [p, setP] = useState(7919);
  const [g, setG] = useState(7);
  const [aliceSecret, setAliceSecret] = useState(123);
  const [bobSecret, setBobSecret] = useState(456);

  // SHA-256 Avalanche & HMAC state
  const [message, setMessage] = useState("Transfer $100 to Alice");
  const [hmacKey, setHmacKey] = useState("comp-roadmap-secret");
  const [flipBitIndex, setFlipBitIndex] = useState(7);

  // AES Round Visualizer state
  const [aesPlaintext, setAesPlaintext] = useState("HelloWorld123456");
  const [aesFlipBit0, setAesFlipBit0] = useState(false);
  const [aesRoundStep, setAesRoundStep] = useState(4);

  const dh = useMemo(
    () => computeDiffieHellman(p, g, aliceSecret, bobSecret),
    [p, g, aliceSecret, bobSecret]
  );

  const avalanche = useMemo(
    () => analyzeSha256Avalanche(message, flipBitIndex, hmacKey),
    [message, flipBitIndex, hmacKey]
  );

  const aesSnapshotsOrig = useMemo(() => {
    const pt = textToBlock16(aesPlaintext);
    const key = textToBlock16("secret-aes-key16");
    return runAesSingleRoundDemo(pt, key, 2);
  }, [aesPlaintext]);

  const aesSnapshotsMod = useMemo(() => {
    const pt = textToBlock16(aesPlaintext);
    if (aesFlipBit0) pt[0] ^= 0x01;
    const key = textToBlock16("secret-aes-key16");
    return runAesSingleRoundDemo(pt, key, 2);
  }, [aesPlaintext, aesFlipBit0]);

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  useEffect(() => {
    if (
      !completedRef.current &&
      avalanche.flipPercentage >= 35 &&
      avalanche.flipPercentage <= 65 &&
      !avalanche.hmacVerified &&
      dh.secretsMatch
    ) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [avalanche.flipPercentage, avalanche.hmacVerified, dh.secretsMatch, onChallengeComplete]);

  const maxMessageBits = Math.max(8, new TextEncoder().encode(message || "A").length * 8);
  const currentAesOrig =
    aesSnapshotsOrig[Math.min(aesRoundStep, aesSnapshotsOrig.length - 1)];
  const currentAesMod =
    aesSnapshotsMod[Math.min(aesRoundStep, aesSnapshotsMod.length - 1)];

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · Applied Cryptography
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            Diffie-Hellman, AES Round Diffusion &amp; SHA-256 Avalanche Lab
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

      {/* 1. Diffie-Hellman Key Exchange */}
      <div className="rounded border border-[var(--border-subtle)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            <KeyRound className="h-3.5 w-3.5 text-[var(--accent-blue)]" />
            1. Diffie-Hellman Modular Key Exchange
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {DH_PRESETS.map((preset) => (
              <button
                key={preset.p}
                type="button"
                onClick={() => {
                  setP(preset.p);
                  setG(preset.g);
                }}
                className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-2 py-0.5 font-mono text-[11px]"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 font-mono text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)]">
              Prime p {!dh.isPrimeP && "(not prime!)"}
            </span>
            <input
              type="number"
              min={5}
              value={p}
              onChange={(e) => setP(Math.max(5, Number(e.target.value)))}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)]">Generator g</span>
            <input
              type="number"
              min={2}
              value={g}
              onChange={(e) => setG(Math.max(2, Number(e.target.value)))}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)]">Alice Secret (a)</span>
            <input
              type="number"
              min={1}
              value={aliceSecret}
              onChange={(e) => setAliceSecret(Math.max(1, Number(e.target.value)))}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--text-muted)]">Bob Secret (b)</span>
            <input
              type="number"
              min={1}
              value={bobSecret}
              onChange={(e) => setBobSecret(Math.max(1, Number(e.target.value)))}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 font-mono text-xs swiss-tabular">
          <div className="rounded bg-[var(--bg-subtle)] p-2.5">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Alice Public A = g^a mod p
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--accent-blue)]">
              {dh.alicePublic.toString()}
            </div>
          </div>
          <div className="rounded bg-[var(--bg-subtle)] p-2.5">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Bob Public B = g^b mod p
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--accent-blue)]">
              {dh.bobPublic.toString()}
            </div>
          </div>
          <div className="rounded border border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)] p-2.5">
            <div className="text-[10px] uppercase text-[var(--text-muted)]">
              Shared Secret g^(ab) mod p
            </div>
            <div className="mt-0.5 text-sm font-semibold text-[var(--accent-emerald)]">
              Alice: {dh.aliceSharedSecret.toString()} | Bob:{" "}
              {dh.bobSharedSecret.toString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real SHA-256 Avalanche & HMAC */}
      <div className="rounded border border-[var(--border-subtle)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            2. Real SHA-256 Bit-Flip Avalanche &amp; HMAC Integrity
          </h4>
          <span
            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 font-mono text-[11px] font-semibold ${
              avalanche.hmacVerified
                ? "bg-[var(--accent-emerald-soft)] text-[var(--accent-emerald)]"
                : "bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]"
            }`}
          >
            {avalanche.hmacVerified ? (
              <>
                <ShieldCheck className="h-3.5 w-3.5" /> HMAC MATCH
              </>
            ) : (
              <>
                <ShieldAlert className="h-3.5 w-3.5" /> HMAC VERIFICATION FAILED
              </>
            )}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-[var(--text-secondary)]">Message</span>
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[var(--text-secondary)]">HMAC Secret Key</span>
            <input
              type="text"
              value={hmacKey}
              onChange={(e) => setHmacKey(e.target.value)}
              className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 font-mono text-xs"
            />
          </label>
          <label className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Flip Bit Index</span>
              <span className="font-mono swiss-tabular">
                bit #{avalanche.flippedBitIndex} / {maxMessageBits - 1}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={maxMessageBits - 1}
              value={Math.min(flipBitIndex, maxMessageBits - 1)}
              onChange={(e) => setFlipBitIndex(Number(e.target.value))}
              className="accent-[var(--accent-crimson)]"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 gap-2 font-mono text-[11px]">
          <div className="rounded bg-[var(--bg-subtle)] p-2 break-all">
            <span className="text-[var(--text-muted)]">Original SHA-256: </span>
            <span>{avalanche.originalHex}</span>
          </div>
          <div className="rounded bg-[var(--bg-subtle)] p-2 break-all">
            <span className="text-[var(--text-muted)]">1-Bit Flip SHA-256: </span>
            <span className="text-[var(--accent-crimson)]">
              {avalanche.flippedHex}
            </span>
          </div>
        </div>

        {/* 256-bit Diff Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between font-mono text-xs swiss-tabular">
            <span className="text-[var(--text-muted)]">
              256-Bit Digest XOR Diff Map (colored = bit flipped)
            </span>
            <span className="font-semibold text-[var(--accent-amber)]">
              {avalanche.hammingDistance} / 256 bits flipped ({avalanche.flipPercentage}%)
            </span>
          </div>
          <div className="grid grid-cols-[repeat(32,minmax(0,1fr))] gap-0.5 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2">
            {avalanche.bitDiffMask.map((diff, idx) => (
              <div
                key={idx}
                className={`h-2 w-full rounded-xs ${
                  diff ? "bg-[var(--accent-crimson)]" : "bg-[var(--bg-muted)]"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 3. AES-128 Round Diffusion Matrix */}
      <div className="rounded border border-[var(--border-subtle)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            3. AES-128 4x4 State Matrix Diffusion (SubBytes / ShiftRows / MixColumns)
          </h4>
          <div className="flex items-center gap-3 text-xs">
            <label className="inline-flex items-center gap-1.5">
              <input
                type="checkbox"
                checked={aesFlipBit0}
                onChange={(e) => setAesFlipBit0(e.target.checked)}
              />
              Flip 1 bit in byte[0]
            </label>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs">
          <input
            type="text"
            value={aesPlaintext}
            maxLength={16}
            onChange={(e) => setAesPlaintext(e.target.value)}
            className="w-44 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono"
            aria-label="AES 16-byte plaintext"
          />
          <input
            type="range"
            min={0}
            max={aesSnapshotsOrig.length - 1}
            value={aesRoundStep}
            onChange={(e) => setAesRoundStep(Number(e.target.value))}
            className="flex-1 accent-[var(--accent-blue)]"
          />
          <span className="font-mono font-semibold text-[var(--accent-blue)]">
            {currentAesOrig?.stage}
          </span>
        </div>

        {currentAesOrig && currentAesMod && (
          <div className="grid grid-cols-4 gap-1.5 max-w-xs font-mono text-xs swiss-tabular">
            {[0, 1, 2, 3].flatMap((row) =>
              [0, 1, 2, 3].map((col) => {
                const idx = col * 4 + row;
                const val = currentAesMod.state[idx];
                const changed = val !== currentAesOrig.state[idx];
                return (
                  <div
                    key={`${row}-${col}`}
                    className={`rounded border px-2 py-1.5 text-center font-semibold ${
                      changed
                        ? "border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] text-[var(--accent-crimson)]"
                        : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                    }`}
                  >
                    {val.toString(16).toUpperCase().padStart(2, "0")}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
