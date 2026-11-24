export type SchedulerPolicy = "FCFS" | "SJF" | "RR" | "MLFQ";

export interface ProcessSpec {
  id: string;
  name: string;
  arrivalTime: number;
  cpuBurst: number;
  /** Run I/O after every `ioEvery` ms of CPU time (0 = pure CPU-bound) */
  ioEvery?: number;
  ioDuration?: number;
  color?: string;
}

export interface SchedulerConfig {
  policy: SchedulerPolicy;
  timeQuantum: number;
  contextSwitchOverhead: number;
  mlfqBoostInterval: number;
}

export interface GanttSegment {
  start: number;
  end: number;
  processId: string; // process id, 'IDLE', or 'CS'
  label: string;
  queueLevel?: number;
}

export interface ProcessMetrics {
  id: string;
  name: string;
  arrivalTime: number;
  cpuBurst: number;
  totalIoTime: number;
  firstRunTime: number;
  completionTime: number;
  responseTime: number;
  waitingTime: number;
  turnaroundTime: number;
}

export interface SchedulerResult {
  config: SchedulerConfig;
  timeline: GanttSegment[];
  processMetrics: ProcessMetrics[];
  avgResponseTime: number;
  avgWaitingTime: number;
  avgTurnaroundTime: number;
  contextSwitches: number;
  cpuUtilization: number;
  totalTime: number;
}

interface SimProc {
  spec: ProcessSpec;
  remainingCpu: number;
  cpuSinceIo: number;
  totalIoTime: number;
  firstRunTime: number | null;
  completionTime: number | null;
  queueLevel: number;
  quantumUsed: number;
  state: "unarrived" | "ready" | "running" | "io" | "done";
  ioWakeTime: number;
  readyOrder: number;
}

function pushSegment(
  timeline: GanttSegment[],
  start: number,
  end: number,
  processId: string,
  label: string,
  queueLevel?: number
) {
  if (end <= start) return;
  const last = timeline[timeline.length - 1];
  if (
    last &&
    last.end === start &&
    last.processId === processId &&
    last.queueLevel === queueLevel
  ) {
    last.end = end;
    return;
  }
  timeline.push({ start, end, processId, label, queueLevel });
}

export function runScheduler(
  processes: ProcessSpec[],
  partialConfig?: Partial<SchedulerConfig>
): SchedulerResult {
  const config: SchedulerConfig = {
    policy: partialConfig?.policy ?? "RR",
    timeQuantum: Math.max(1, partialConfig?.timeQuantum ?? 4),
    contextSwitchOverhead: Math.max(0, partialConfig?.contextSwitchOverhead ?? 0),
    mlfqBoostInterval: Math.max(5, partialConfig?.mlfqBoostInterval ?? 30),
  };

  if (processes.length === 0) {
    return {
      config,
      timeline: [],
      processMetrics: [],
      avgResponseTime: 0,
      avgWaitingTime: 0,
      avgTurnaroundTime: 0,
      contextSwitches: 0,
      cpuUtilization: 0,
      totalTime: 0,
    };
  }

  let seq = 0;
  const procs: SimProc[] = processes.map((spec) => ({
    spec: { ...spec },
    remainingCpu: Math.max(1, Math.round(spec.cpuBurst)),
    cpuSinceIo: 0,
    totalIoTime: 0,
    firstRunTime: null,
    completionTime: null,
    queueLevel: 0,
    quantumUsed: 0,
    state: "unarrived",
    ioWakeTime: -1,
    readyOrder: 0,
  }));

  const timeline: GanttSegment[] = [];
  let time = 0;
  let csRemaining = 0;
  let lastPid: string | null = null;
  let running: SimProc | null = null;
  let contextSwitches = 0;
  let busyCpuTime = 0;
  let lastBoostTime = 0;

  const mlfqQuantums = [
    config.timeQuantum,
    config.timeQuantum * 2,
    config.timeQuantum * 4,
  ];

  const maxSafetyTicks = 20000;

  const admitReady = (p: SimProc) => {
    p.state = "ready";
    p.readyOrder = ++seq;
  };

  const pickNextProcess = (): SimProc | null => {
    const ready = procs.filter((p) => p.state === "ready");
    if (ready.length === 0) return null;

    if (config.policy === "FCFS" || config.policy === "RR") {
      ready.sort((a, b) => a.readyOrder - b.readyOrder);
      return ready[0];
    }

    if (config.policy === "SJF") {
      ready.sort((a, b) => {
        if (a.remainingCpu !== b.remainingCpu) {
          return a.remainingCpu - b.remainingCpu;
        }
        if (a.spec.arrivalTime !== b.spec.arrivalTime) {
          return a.spec.arrivalTime - b.spec.arrivalTime;
        }
        return a.readyOrder - b.readyOrder;
      });
      return ready[0];
    }

    // MLFQ: lowest queueLevel first (0 is highest priority), then FIFO readyOrder
    ready.sort((a, b) => {
      if (a.queueLevel !== b.queueLevel) return a.queueLevel - b.queueLevel;
      return a.readyOrder - b.readyOrder;
    });
    return ready[0];
  };

  while (procs.some((p) => p.state !== "done") && time < maxSafetyTicks) {
    // 1. Complete I/O for processes whose I/O finished at `time`
    for (const p of procs) {
      if (p.state === "io" && p.ioWakeTime <= time) {
        p.quantumUsed = 0;
        admitReady(p);
      }
    }

    // 2. Admit newly arrived processes
    const arrivals = procs
      .filter((p) => p.state === "unarrived" && p.spec.arrivalTime <= time)
      .sort((a, b) => a.spec.arrivalTime - b.spec.arrivalTime);
    for (const p of arrivals) {
      p.queueLevel = 0;
      p.quantumUsed = 0;
      admitReady(p);
    }

    // 3. MLFQ periodic priority boost (Rule 5)
    if (
      config.policy === "MLFQ" &&
      time > 0 &&
      time - lastBoostTime >= config.mlfqBoostInterval
    ) {
      lastBoostTime = time;
      for (const p of procs) {
        if (p.state === "ready" || p.state === "running" || p.state === "io") {
          p.queueLevel = 0;
          p.quantumUsed = 0;
        }
      }
    }

    // 4. If MLFQ and a higher-priority process became ready while a lower one is running, preempt
    if (config.policy === "MLFQ" && running && csRemaining === 0) {
      const highestReady = pickNextProcess();
      if (highestReady && highestReady.queueLevel < running.queueLevel) {
        admitReady(running);
        running = null;
      }
    }

    // 5. Handle context switch overhead in progress
    if (csRemaining > 0) {
      pushSegment(timeline, time, time + 1, "CS", "CS");
      csRemaining -= 1;
      time += 1;
      continue;
    }

    // 6. Dispatch if CPU is idle
    if (!running) {
      const next = pickNextProcess();
      if (next) {
        if (lastPid !== null && lastPid !== next.spec.id) {
          contextSwitches += 1;
          if (config.contextSwitchOverhead > 0) {
            csRemaining = config.contextSwitchOverhead;
            lastPid = next.spec.id;
            running = next;
            running.state = "running";
            pushSegment(timeline, time, time + 1, "CS", "CS");
            csRemaining -= 1;
            time += 1;
            continue;
          }
        }
        lastPid = next.spec.id;
        running = next;
        running.state = "running";
      }
    }

    // 7. Execute 1 ms tick
    if (!running) {
      pushSegment(timeline, time, time + 1, "IDLE", "IDLE");
      time += 1;
      continue;
    }

    if (running.firstRunTime === null) {
      running.firstRunTime = time;
    }

    pushSegment(
      timeline,
      time,
      time + 1,
      running.spec.id,
      running.spec.name,
      config.policy === "MLFQ" ? running.queueLevel : undefined
    );

    running.remainingCpu -= 1;
    running.cpuSinceIo += 1;
    running.quantumUsed += 1;
    busyCpuTime += 1;
    time += 1;

    // 8. Check completion, I/O block, or quantum expiration
    if (running.remainingCpu === 0) {
      running.state = "done";
      running.completionTime = time;
      running = null;
    } else if (
      running.spec.ioEvery &&
      running.spec.ioEvery > 0 &&
      running.spec.ioDuration &&
      running.spec.ioDuration > 0 &&
      running.cpuSinceIo >= running.spec.ioEvery
    ) {
      running.cpuSinceIo = 0;
      running.quantumUsed = 0;
      running.state = "io";
      running.ioWakeTime = time + running.spec.ioDuration;
      running.totalIoTime += running.spec.ioDuration;
      running = null;
    } else if (
      config.policy === "RR" &&
      running.quantumUsed >= config.timeQuantum
    ) {
      running.quantumUsed = 0;
      admitReady(running);
      running = null;
    } else if (config.policy === "MLFQ") {
      const limit = mlfqQuantums[Math.min(running.queueLevel, mlfqQuantums.length - 1)];
      if (running.quantumUsed >= limit) {
        running.quantumUsed = 0;
        running.queueLevel = Math.min(2, running.queueLevel + 1);
        admitReady(running);
        running = null;
      }
    }
  }

  const processMetrics: ProcessMetrics[] = procs.map((p) => {
    const completionTime = p.completionTime ?? time;
    const firstRunTime = p.firstRunTime ?? completionTime;
    const turnaroundTime = completionTime - p.spec.arrivalTime;
    const responseTime = firstRunTime - p.spec.arrivalTime;
    const waitingTime = Math.max(
      0,
      turnaroundTime - p.spec.cpuBurst - p.totalIoTime
    );
    return {
      id: p.spec.id,
      name: p.spec.name,
      arrivalTime: p.spec.arrivalTime,
      cpuBurst: p.spec.cpuBurst,
      totalIoTime: p.totalIoTime,
      firstRunTime,
      completionTime,
      responseTime,
      waitingTime,
      turnaroundTime,
    };
  });

  const n = processMetrics.length;
  const avgResponseTime =
    processMetrics.reduce((s, m) => s + m.responseTime, 0) / n;
  const avgWaitingTime =
    processMetrics.reduce((s, m) => s + m.waitingTime, 0) / n;
  const avgTurnaroundTime =
    processMetrics.reduce((s, m) => s + m.turnaroundTime, 0) / n;
  const cpuUtilization = time > 0 ? busyCpuTime / time : 0;

  return {
    config,
    timeline,
    processMetrics,
    avgResponseTime,
    avgWaitingTime,
    avgTurnaroundTime,
    contextSwitches,
    cpuUtilization,
    totalTime: time,
  };
}

export const SCHEDULER_PRESETS: Array<{
  id: string;
  label: string;
  processes: ProcessSpec[];
}> = [
  {
    id: "mixed-io",
    label: "Interactive I/O + Batch CPU",
    processes: [
      { id: "P1", name: "Batch-Render", arrivalTime: 0, cpuBurst: 18, color: "#2563eb" },
      { id: "P2", name: "UI-Input", arrivalTime: 2, cpuBurst: 6, ioEvery: 2, ioDuration: 4, color: "#059669" },
      { id: "P3", name: "Audio-Mix", arrivalTime: 4, cpuBurst: 8, ioEvery: 2, ioDuration: 3, color: "#d97706" },
      { id: "P4", name: "Compile", arrivalTime: 6, cpuBurst: 10, color: "#dc2626" },
    ],
  },
  {
    id: "convoy",
    label: "FCFS Convoy Effect",
    processes: [
      { id: "P1", name: "Long-Job", arrivalTime: 0, cpuBurst: 20, color: "#2563eb" },
      { id: "P2", name: "Short-A", arrivalTime: 1, cpuBurst: 3, color: "#059669" },
      { id: "P3", name: "Short-B", arrivalTime: 2, cpuBurst: 2, color: "#d97706" },
    ],
  },
];
