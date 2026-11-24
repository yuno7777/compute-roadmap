"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Pause,
  Play,
  RotateCcw,
  StepForward,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import {
  computeTcpSummary,
  createTcpState,
  stepTcpRtt,
  type PacketLossKind,
  type TcpConfig,
  type TcpSimulationState,
} from "@/lib/simulators/networkTcp";

export function NetworkPacketSimulator({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const [bottleneck, setBottleneck] = useState(20);
  const [initialSsthresh, setInitialSsthresh] = useState(16);
  const [baseRtt, setBaseRtt] = useState(40);
  const [lossPct, setLossPct] = useState(2);
  const [recoveryMode, setRecoveryMode] =
    useState<TcpConfig["recoveryMode"]>("reno");
  const [isPlaying, setIsPlaying] = useState(false);

  const [tcp, setTcp] = useState<TcpSimulationState>(() =>
    createTcpState({
      bottleneckMssPerRtt: 20,
      initialSsthresh: 16,
      baseRttMs: 40,
      lossRate: 0.02,
      recoveryMode: "reno",
    })
  );

  const summary = useMemo(() => computeTcpSummary(tcp), [tcp]);

  const completedRef = useRef(false);
  const [challengeDone, setChallengeDone] = useState(false);

  useEffect(() => {
    if (
      !completedRef.current &&
      tcp.rttIndex >= 15 &&
      summary.avgUtilization >= 0.5 &&
      tcp.totalRtoEvents <= 1
    ) {
      completedRef.current = true;
      setChallengeDone(true);
      onChallengeComplete?.();
    }
  }, [tcp.rttIndex, tcp.totalRtoEvents, summary.avgUtilization, onChallengeComplete]);

  const resetSim = (
    nextBdp = bottleneck,
    nextSsthresh = initialSsthresh,
    nextRtt = baseRtt,
    nextLossPct = lossPct,
    nextMode = recoveryMode
  ) => {
    setIsPlaying(false);
    completedRef.current = false;
    setChallengeDone(false);
    setTcp(
      createTcpState({
        bottleneckMssPerRtt: nextBdp,
        initialSsthresh: nextSsthresh,
        baseRttMs: nextRtt,
        lossRate: nextLossPct / 100,
        recoveryMode: nextMode,
      })
    );
  };

  const stepOne = (forcedLoss: PacketLossKind = "none") => {
    setTcp((prev) => stepTcpRtt(prev, forcedLoss));
  };

  useEffect(() => {
    if (!isPlaying) return;
    if (tcp.rttIndex >= 40) {
      setIsPlaying(false);
      return;
    }
    const timer = setTimeout(() => stepOne("none"), 380);
    return () => clearTimeout(timer);
  }, [isPlaying, tcp.rttIndex]);

  const latest = tcp.timeline[tcp.timeline.length - 1];
  const maxChartCwnd = Math.max(
    bottleneck + 4,
    ...tcp.timeline.map((t) => Math.max(t.cwnd, t.ssthresh))
  );

  const chartWidth = 640;
  const chartHeight = 200;
  const padL = 36;
  const padR = 16;
  const padT = 14;
  const padB = 26;
  const plotW = chartWidth - padL - padR;
  const plotH = chartHeight - padT - padB;
  const xCount = Math.max(10, tcp.timeline.length);

  const cwndPoints = tcp.timeline
    .map((t, i) => {
      const x = padL + (i / Math.max(1, xCount - 1)) * plotW;
      const y = padT + plotH - (t.cwnd / maxChartCwnd) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const ssthreshPoints = tcp.timeline
    .map((t, i) => {
      const x = padL + (i / Math.max(1, xCount - 1)) * plotW;
      const y = padT + plotH - (t.ssthresh / maxChartCwnd) * plotH;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <div className="swiss-card p-5 space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)]">
            Systems · Computer Networking
          </p>
          <h3 className="mt-1 text-lg font-semibold text-[var(--text-primary)]">
            TCP Congestion Control (Slow Start &amp; AIMD)
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

      {/* Parameters */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span>Link BDP (MSS)</span>
            <span className="font-mono swiss-tabular">{bottleneck}</span>
          </div>
          <input
            type="range"
            min={8}
            max={36}
            value={bottleneck}
            onChange={(e) => {
              const v = Number(e.target.value);
              setBottleneck(v);
              resetSim(v, initialSsthresh, baseRtt, lossPct, recoveryMode);
            }}
            className="accent-[var(--accent-blue)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span>Init ssthresh</span>
            <span className="font-mono swiss-tabular">{initialSsthresh}</span>
          </div>
          <input
            type="range"
            min={4}
            max={24}
            value={initialSsthresh}
            onChange={(e) => {
              const v = Number(e.target.value);
              setInitialSsthresh(v);
              resetSim(bottleneck, v, baseRtt, lossPct, recoveryMode);
            }}
            className="accent-[var(--accent-blue)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span>Base RTT (ms)</span>
            <span className="font-mono swiss-tabular">{baseRtt}</span>
          </div>
          <input
            type="range"
            min={10}
            max={120}
            step={5}
            value={baseRtt}
            onChange={(e) => {
              const v = Number(e.target.value);
              setBaseRtt(v);
              resetSim(bottleneck, initialSsthresh, v, lossPct, recoveryMode);
            }}
            className="accent-[var(--accent-blue)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <div className="flex justify-between">
            <span>Loss Rate</span>
            <span className="font-mono swiss-tabular">{lossPct}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={8}
            step={1}
            value={lossPct}
            onChange={(e) => {
              const v = Number(e.target.value);
              setLossPct(v);
              resetSim(bottleneck, initialSsthresh, baseRtt, v, recoveryMode);
            }}
            className="accent-[var(--accent-blue)]"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs text-[var(--text-secondary)]">
          <span>TCP Variant</span>
          <select
            value={recoveryMode}
            onChange={(e) => {
              const m = e.target.value as TcpConfig["recoveryMode"];
              setRecoveryMode(m);
              resetSim(bottleneck, initialSsthresh, baseRtt, lossPct, m);
            }}
            className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2 py-1 font-mono text-xs text-[var(--text-primary)]"
          >
            <option value="reno">TCP Reno (Fast Recovery)</option>
            <option value="tahoe">TCP Tahoe (Reset cwnd=1)</option>
          </select>
        </label>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => stepOne("none")}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-primary)]"
          >
            <StepForward className="h-3.5 w-3.5" /> +1 RTT
          </button>
          <button
            type="button"
            onClick={() => setIsPlaying((p) => !p)}
            className="inline-flex items-center gap-1 rounded bg-[var(--accent-blue)] px-3 py-1.5 text-xs font-medium text-white"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3.5 w-3.5" /> Pause
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" /> Play
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => resetSim()}
            className="inline-flex items-center gap-1 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1.5 text-xs text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => stepOne("3-dup-ack")}
            className="inline-flex items-center gap-1 rounded border border-[var(--accent-amber)] bg-[var(--accent-amber-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent-amber)]"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Inject 3-Dup-ACK
          </button>
          <button
            type="button"
            onClick={() => stepOne("rto")}
            className="inline-flex items-center gap-1 rounded border border-[var(--accent-crimson)] bg-[var(--accent-crimson-soft)] px-2.5 py-1.5 text-xs font-medium text-[var(--accent-crimson)]"
          >
            <AlertTriangle className="h-3.5 w-3.5" /> Inject RTO Timeout
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            RTT / Phase
          </div>
          <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular">
            #{tcp.rttIndex} · {tcp.phase.replace("_", " ")}
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            cwnd / ssthresh
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular text-[var(--accent-blue)]">
            {tcp.cwnd} / {tcp.ssthresh} MSS
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            Avg Goodput
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular text-[var(--accent-emerald)]">
            {summary.avgGoodputKbps.toFixed(0)} kbps
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            Link Util
          </div>
          <div className="mt-0.5 font-mono text-base font-semibold swiss-tabular">
            {(summary.avgUtilization * 100).toFixed(1)}%
          </div>
        </div>
        <div className="rounded border border-[var(--border-subtle)] p-2.5">
          <div className="text-[11px] uppercase text-[var(--text-muted)]">
            SRTT / RTO
          </div>
          <div className="mt-0.5 font-mono text-sm font-semibold swiss-tabular text-[var(--accent-amber)]">
            {tcp.srttMs.toFixed(1)} / {tcp.rtoMs} ms
          </div>
        </div>
      </div>

      {/* Sawtooth cwnd/ssthresh SVG */}
      <div className="rounded border border-[var(--border-subtle)] p-3.5">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-semibold text-[var(--text-primary)]">
            Congestion Window (cwnd) &amp; ssthresh Sawtooth Timeline
          </span>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <span className="text-[var(--accent-blue)]">── cwnd</span>
            <span className="text-[var(--accent-amber)]">-- ssthresh</span>
            <span className="text-[var(--accent-crimson)]">● loss</span>
          </div>
        </div>

        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
        >
          {/* Bottleneck line */}
          <line
            x1={padL}
            x2={chartWidth - padR}
            y1={padT + plotH - (bottleneck / maxChartCwnd) * plotH}
            y2={padT + plotH - (bottleneck / maxChartCwnd) * plotH}
            stroke="var(--accent-emerald)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />
          <text
            x={padL + 4}
            y={padT + plotH - (bottleneck / maxChartCwnd) * plotH - 4}
            fontSize="9"
            fontFamily="var(--font-mono-stack)"
            fill="var(--accent-emerald)"
          >
            BDP={bottleneck} MSS
          </text>

          {tcp.timeline.length > 1 && (
            <>
              <polyline
                fill="none"
                stroke="var(--accent-amber)"
                strokeWidth={1.5}
                strokeDasharray="5 4"
                points={ssthreshPoints}
              />
              <polyline
                fill="none"
                stroke="var(--accent-blue)"
                strokeWidth={2.2}
                points={cwndPoints}
              />
            </>
          )}

          {tcp.timeline.map((t, i) => {
            const x = padL + (i / Math.max(1, xCount - 1)) * plotW;
            const y = padT + plotH - (t.cwnd / maxChartCwnd) * plotH;
            if (t.lossKind === "none") return null;
            return (
              <circle
                key={t.rttIndex}
                cx={x}
                cy={y}
                r={4}
                fill={
                  t.lossKind === "rto"
                    ? "var(--accent-crimson)"
                    : "var(--accent-amber)"
                }
              />
            );
          })}
        </svg>

        {latest && (
          <div className="mt-2 rounded bg-[var(--bg-subtle)] px-3 py-1.5 font-mono text-xs text-[var(--text-secondary)]">
            RTT {latest.rttIndex}: {latest.event}
          </div>
        )}
      </div>
    </div>
  );
}
