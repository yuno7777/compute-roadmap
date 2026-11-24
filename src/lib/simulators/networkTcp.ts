export type TcpPhase =
  | "HANDSHAKE"
  | "SLOW_START"
  | "CONGESTION_AVOIDANCE"
  | "FAST_RETRANSMIT"
  | "RTO_RECOVERY";

export type PacketLossKind = "none" | "3-dup-ack" | "rto";

export interface TcpConfig {
  initialCwnd: number; // in MSS
  initialSsthresh: number; // in MSS
  bottleneckMssPerRtt: number; // link BDP capacity in MSS
  baseRttMs: number;
  mssBytes: number;
  lossRate: number; // 0..0.25 probability per packet when auto-simulating
  recoveryMode: "reno" | "tahoe";
}

export interface TcpRttSnapshot {
  rttIndex: number;
  phase: TcpPhase;
  cwnd: number;
  ssthresh: number;
  packetsSent: number;
  packetsAcked: number;
  packetsLost: number;
  lossKind: PacketLossKind;
  srttMs: number;
  rtoMs: number;
  goodputKbps: number;
  linkUtilization: number;
  event: string;
}

export interface TcpSimulationState {
  config: TcpConfig;
  rttIndex: number;
  handshakeComplete: boolean;
  phase: TcpPhase;
  cwnd: number;
  ssthresh: number;
  srttMs: number;
  rttvarMs: number;
  rtoMs: number;
  totalPacketsAcked: number;
  totalPacketsLost: number;
  totalRtoEvents: number;
  totalFastRetransmits: number;
  timeline: TcpRttSnapshot[];
}

export function createTcpState(partial?: Partial<TcpConfig>): TcpSimulationState {
  const config: TcpConfig = {
    initialCwnd: Math.max(1, partial?.initialCwnd ?? 1),
    initialSsthresh: Math.max(2, partial?.initialSsthresh ?? 16),
    bottleneckMssPerRtt: Math.max(2, partial?.bottleneckMssPerRtt ?? 24),
    baseRttMs: Math.max(5, partial?.baseRttMs ?? 40),
    mssBytes: partial?.mssBytes ?? 1460,
    lossRate: Math.min(0.25, Math.max(0, partial?.lossRate ?? 0)),
    recoveryMode: partial?.recoveryMode ?? "reno",
  };

  return {
    config,
    rttIndex: 0,
    handshakeComplete: false,
    phase: "HANDSHAKE",
    cwnd: config.initialCwnd,
    ssthresh: config.initialSsthresh,
    srttMs: config.baseRttMs,
    rttvarMs: config.baseRttMs / 2,
    rtoMs: Math.max(200, config.baseRttMs * 3),
    totalPacketsAcked: 0,
    totalPacketsLost: 0,
    totalRtoEvents: 0,
    totalFastRetransmits: 0,
    timeline: [],
  };
}

function deterministicHash(rtt: number, salt: number): number {
  let x = (rtt * 2654435761 + salt * 1597334677) >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15;
  return x / 0xffffffff;
}

export function stepTcpRtt(
  prev: TcpSimulationState,
  forcedLoss: PacketLossKind = "none",
  rttJitterMs = 0
): TcpSimulationState {
  const s: TcpSimulationState = {
    ...prev,
    config: { ...prev.config },
    timeline: [...prev.timeline],
  };

  s.rttIndex += 1;
  const rtt = s.rttIndex;
  const cfg = s.config;

  // Update RFC 6298 RTT estimator
  const sampleRtt = Math.max(5, cfg.baseRttMs + rttJitterMs);
  if (rtt === 1) {
    s.srttMs = sampleRtt;
    s.rttvarMs = sampleRtt / 2;
  } else {
    s.rttvarMs = 0.75 * s.rttvarMs + 0.25 * Math.abs(s.srttMs - sampleRtt);
    s.srttMs = 0.875 * s.srttMs + 0.125 * sampleRtt;
  }
  s.rtoMs = Math.max(200, Math.round(s.srttMs + Math.max(10, 4 * s.rttvarMs)));

  // RTT 1: 3-Way Handshake (SYN -> SYN-ACK -> ACK)
  if (!s.handshakeComplete) {
    s.handshakeComplete = true;
    s.phase = "SLOW_START";
    s.timeline.push({
      rttIndex: rtt,
      phase: "HANDSHAKE",
      cwnd: s.cwnd,
      ssthresh: s.ssthresh,
      packetsSent: 1,
      packetsAcked: 1,
      packetsLost: 0,
      lossKind: "none",
      srttMs: Math.round(s.srttMs * 10) / 10,
      rtoMs: s.rtoMs,
      goodputKbps: 0,
      linkUtilization: 0,
      event: `3-way handshake complete (SYN -> SYN-ACK -> ACK); cwnd=${s.cwnd} MSS`,
    });
    return s;
  }

  const prevCwnd = s.cwnd;
  const inflight = Math.max(1, Math.floor(s.cwnd));
  const congestedOverflow = inflight > cfg.bottleneckMssPerRtt;

  // Determine loss for this RTT
  let lossKind: PacketLossKind = forcedLoss;
  let lostPackets = 0;

  if (lossKind === "none" && congestedOverflow) {
    lossKind = "3-dup-ack";
    lostPackets = Math.max(1, inflight - cfg.bottleneckMssPerRtt);
  } else if (lossKind === "none" && cfg.lossRate > 0) {
    const roll = deterministicHash(rtt, inflight);
    if (roll < 1 - Math.pow(1 - cfg.lossRate, Math.min(inflight, 16))) {
      lossKind = inflight >= 3 ? "3-dup-ack" : "rto";
      lostPackets = 1;
    }
  } else if (lossKind !== "none") {
    lostPackets = 1;
  }

  const delivered = Math.min(inflight, cfg.bottleneckMssPerRtt);
  const acked = Math.max(0, delivered - lostPackets);
  s.totalPacketsAcked += acked;
  s.totalPacketsLost += lostPackets;

  let phaseAfter: TcpPhase = s.phase;
  let event = "";

  if (lossKind === "3-dup-ack") {
    s.totalFastRetransmits += 1;
    s.ssthresh = Math.max(2, Math.floor(prevCwnd / 2));
    if (cfg.recoveryMode === "tahoe") {
      s.cwnd = 1;
      phaseAfter = "SLOW_START";
      event = `3-dup-ACK loss (Tahoe): ssthresh=${s.ssthresh}, cwnd reset to 1 MSS`;
    } else {
      s.cwnd = s.ssthresh;
      phaseAfter = "FAST_RETRANSMIT";
      event = `3-dup-ACK Fast Retransmit (Reno): ssthresh=${s.ssthresh}, cwnd halved ${prevCwnd} -> ${s.cwnd} MSS`;
    }
    s.phase =
      cfg.recoveryMode === "tahoe" ? "SLOW_START" : "CONGESTION_AVOIDANCE";
  } else if (lossKind === "rto") {
    s.totalRtoEvents += 1;
    s.ssthresh = Math.max(2, Math.floor(prevCwnd / 2));
    s.cwnd = 1;
    phaseAfter = "RTO_RECOVERY";
    s.phase = "SLOW_START";
    event = `RTO timeout (${s.rtoMs} ms): ssthresh=${s.ssthresh}, cwnd -> 1 MSS (Slow Start)`;
  } else {
    // Normal ACKed RTT: apply Slow Start or AIMD Congestion Avoidance
    if (prevCwnd < s.ssthresh) {
      phaseAfter = "SLOW_START";
      const grown = Math.min(s.ssthresh, prevCwnd * 2);
      s.cwnd = grown;
      s.phase = s.cwnd >= s.ssthresh ? "CONGESTION_AVOIDANCE" : "SLOW_START";
      event = `Slow Start: ${acked} ACKs, cwnd ${prevCwnd} -> ${s.cwnd} MSS`;
    } else {
      phaseAfter = "CONGESTION_AVOIDANCE";
      s.cwnd = prevCwnd + 1;
      s.phase = "CONGESTION_AVOIDANCE";
      event = `Congestion Avoidance (AIMD): cwnd ${prevCwnd} -> ${s.cwnd} MSS (+1/RTT)`;
    }
  }

  const rttSeconds = sampleRtt / 1000;
  const goodputKbps =
    Math.round(((acked * cfg.mssBytes * 8) / 1000 / rttSeconds) * 10) / 10;
  const linkUtilization = Math.min(
    1,
    acked / cfg.bottleneckMssPerRtt
  );

  s.timeline.push({
    rttIndex: rtt,
    phase: phaseAfter,
    cwnd: s.cwnd,
    ssthresh: s.ssthresh,
    packetsSent: inflight,
    packetsAcked: acked,
    packetsLost: lostPackets,
    lossKind,
    srttMs: Math.round(s.srttMs * 10) / 10,
    rtoMs: s.rtoMs,
    goodputKbps,
    linkUtilization,
    event,
  });

  return s;
}

export function simulateTcpSession(
  rtts: number,
  config?: Partial<TcpConfig>,
  lossSchedule?: Record<number, PacketLossKind>
): TcpSimulationState {
  let state = createTcpState(config);
  for (let i = 1; i <= rtts; i++) {
    const forced = lossSchedule?.[i] ?? "none";
    state = stepTcpRtt(state, forced);
  }
  return state;
}

export function computeTcpSummary(state: TcpSimulationState): {
  avgGoodputKbps: number;
  avgUtilization: number;
  effectiveLossRate: number;
  peakCwnd: number;
} {
  const dataRtts = state.timeline.filter((t) => t.phase !== "HANDSHAKE");
  if (dataRtts.length === 0) {
    return {
      avgGoodputKbps: 0,
      avgUtilization: 0,
      effectiveLossRate: 0,
      peakCwnd: state.cwnd,
    };
  }
  const avgGoodputKbps =
    dataRtts.reduce((acc, t) => acc + t.goodputKbps, 0) / dataRtts.length;
  const avgUtilization =
    dataRtts.reduce((acc, t) => acc + t.linkUtilization, 0) / dataRtts.length;
  const totalSent = dataRtts.reduce((acc, t) => acc + t.packetsSent, 0);
  const effectiveLossRate =
    totalSent > 0 ? state.totalPacketsLost / totalSent : 0;
  const peakCwnd = Math.max(...state.timeline.map((t) => t.cwnd));
  return {
    avgGoodputKbps: Math.round(avgGoodputKbps * 10) / 10,
    avgUtilization,
    effectiveLossRate,
    peakCwnd,
  };
}
