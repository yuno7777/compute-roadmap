import { describe, expect, it } from "vitest";
import {
  accessVirtualAddress,
  createVirtualMemoryState,
  decodeVirtualAddress,
  runAddressSequence,
} from "../virtualMemory";
import { runScheduler, type ProcessSpec } from "../osScheduler";
import { runCompilerPipeline } from "../compilerPipeline";
import {
  DEFAULT_WEIGHTED_GRAPH,
  traceBinarySearch,
  traceBfs,
  traceDfs,
  traceDijkstra,
  traceMergesort,
  traceQuicksort,
} from "../algorithms";
import { createTcpState, simulateTcpSession, stepTcpRtt } from "../networkTcp";
import {
  bplusAmplification,
  bplusInsert,
  bplusRangeScan,
  bplusSearch,
  createBPlusTree,
  createLsmTree,
  lsmAmplification,
  lsmCompactLevel,
  lsmGet,
  lsmPut,
} from "../databaseStorage";
import {
  appendClientCommand,
  createRaftCluster,
  healAllPartitions,
  setNodePartitionGroup,
  stepRaftTicks,
} from "../concurrencyRaft";
import {
  analyzeSha256Avalanche,
  computeDiffieHellman,
  runAesSingleRoundDemo,
  sha256Hex,
  textToBlock16,
} from "../cryptoSecurity";

describe("1. Virtual Memory & 2-Level Page Table + TLB", () => {
  it("decodes 16-bit virtual addresses into VPN1, VPN2, and offset", () => {
    // pageSize = 256 -> 8 offset bits, 4 vpn1 bits, 4 vpn2 bits
    const b = decodeVirtualAddress(0xab34, 256);
    expect(b.vpn1).toBe(0xa);
    expect(b.vpn2).toBe(0xb);
    expect(b.offset).toBe(0x34);
    expect(b.vpn).toBe(0xab);
  });

  it("tracks TLB miss -> page fault -> TLB hit and LRU physical frame eviction", () => {
    let vm = createVirtualMemoryState({
      pageSize: 256,
      tlbCapacity: 2,
      tlbPolicy: "LRU",
      numFrames: 2,
    });

    // Access page 1 (miss + fault -> PFN 0)
    vm = accessVirtualAddress(vm, 0x0110);
    expect(vm.history[0].tlbHit).toBe(false);
    expect(vm.history[0].pageFault).toBe(true);
    expect(vm.history[0].pfn).toBe(0);

    // Same page, different offset -> TLB HIT!
    vm = accessVirtualAddress(vm, 0x0120);
    expect(vm.history[1].tlbHit).toBe(true);
    expect(vm.history[1].pageFault).toBe(false);
    expect(vm.history[1].physicalAddress).toBe(0x0020);

    // Access page 2 (miss + fault -> PFN 1)
    vm = accessVirtualAddress(vm, 0x0244);
    expect(vm.history[2].pageFault).toBe(true);
    expect(vm.history[2].pfn).toBe(1);

    // Access page 3 -> memory full (2 frames), LRU frame is PFN 0 (VPN 1 was tick 2, VPN 2 was tick 3)
    vm = accessVirtualAddress(vm, 0x0388);
    expect(vm.history[3].pageFault).toBe(true);
    expect(vm.history[3].evictedFrameVpn).toBe(1);
    expect(vm.history[3].pfn).toBe(0);

    // Re-accessing VPN 1 must fault again since it was evicted and invalidated from TLB
    vm = accessVirtualAddress(vm, 0x0100);
    expect(vm.history[4].tlbHit).toBe(false);
    expect(vm.history[4].pageFault).toBe(true);
  });

  it("achieves >= 80% TLB hit rate on a small working-set loop", () => {
    const vm0 = createVirtualMemoryState({
      pageSize: 256,
      tlbCapacity: 4,
      tlbPolicy: "LRU",
      numFrames: 4,
    });
    const addrs = [
      0x0104, 0x0204, 0x0304, 0x0108, 0x0208, 0x0308, 0x010c, 0x020c, 0x030c,
      0x0110, 0x0210, 0x0310, 0x0114, 0x0214, 0x0314,
    ].map((address) => ({ address }));

    const vmFinal = runAddressSequence(vm0, addrs);
    // 3 initial misses + 12 hits = 80%
    expect(vmFinal.metrics.tlbHits).toBe(12);
    expect(vmFinal.metrics.tlbHitRate).toBeCloseTo(0.8, 4);
  });
});

describe("2. OS CPU Process Scheduler", () => {
  const jobs: ProcessSpec[] = [
    { id: "P1", name: "Long", arrivalTime: 0, cpuBurst: 12 },
    { id: "P2", name: "ShortA", arrivalTime: 0, cpuBurst: 3 },
    { id: "P3", name: "ShortB", arrivalTime: 0, cpuBurst: 2 },
  ];

  it("SJF achieves lower average turnaround time than FCFS and RR on convoy workload", () => {
    const fcfs = runScheduler(jobs, { policy: "FCFS" });
    const sjf = runScheduler(jobs, { policy: "SJF" });
    const rr = runScheduler(jobs, { policy: "RR", timeQuantum: 2 });

    expect(sjf.avgTurnaroundTime).toBeLessThan(fcfs.avgTurnaroundTime);
    expect(sjf.avgTurnaroundTime).toBeLessThan(rr.avgTurnaroundTime);
    // SJF order: P3 (2) -> P2 (2+3=5) -> P1 (5+12=17) => avg = (2+5+17)/3 = 8
    expect(sjf.avgTurnaroundTime).toBeCloseTo(8, 5);
  });

  it("RR reduces response time for short/late interactive tasks compared to FCFS", () => {
    const rr = runScheduler(jobs, { policy: "RR", timeQuantum: 2 });
    const fcfs = runScheduler(jobs, { policy: "FCFS" });
    expect(rr.avgResponseTime).toBeLessThan(fcfs.avgResponseTime);
    expect(rr.contextSwitches).toBeGreaterThan(fcfs.contextSwitches);
  });

  it("MLFQ handles I/O bursts without starving interactive tasks", () => {
    const mixed: ProcessSpec[] = [
      { id: "CPU", name: "Batch", arrivalTime: 0, cpuBurst: 20 },
      {
        id: "IO",
        name: "Interactive",
        arrivalTime: 2,
        cpuBurst: 6,
        ioEvery: 2,
        ioDuration: 3,
      },
    ];
    const mlfq = runScheduler(mixed, {
      policy: "MLFQ",
      timeQuantum: 3,
      mlfqBoostInterval: 15,
    });
    const ioMetric = mlfq.processMetrics.find((m) => m.id === "IO")!;
    expect(ioMetric.responseTime).toBeLessThanOrEqual(3);
    expect(ioMetric.totalIoTime).toBe(6); // 2 I/O bursts of 3ms
  });
});

describe("3. Compiler Pipeline (Lexer -> Parser -> AST -> SSA IR -> Opt -> VM)", () => {
  it("evaluates `let x = 2 + 3 * 4; x + 5` to 19 and collapses constants", () => {
    const res = runCompilerPipeline("let x = 2 + 3 * 4; x + 5", {
      constantFolding: true,
      algebraicSimplification: true,
      deadCodeElimination: true,
    });

    expect(res.ok).toBe(true);
    expect(res.tokens.length).toBeGreaterThan(5);
    expect(res.ast?.statements.length).toBe(2);
    expect(res.vmResult).toBe(19);
    expect(res.stats.foldedConstants).toBeGreaterThanOrEqual(3);
    expect(res.stats.optimizedCount).toBeLessThan(res.stats.originalCount);
    expect(res.optimizedIr.length).toBe(1); // just `ret 19`!
  });

  it("eliminates dead code and simplifies algebraic identities", () => {
    const res = runCompilerPipeline(
      "let dead = 100 * 200; let a = 7; let b = (a * 1) + 0; b - 0",
      {
        constantFolding: false,
        algebraicSimplification: true,
        deadCodeElimination: true,
      }
    );
    expect(res.ok).toBe(true);
    expect(res.vmResult).toBe(7);
    expect(res.stats.algebraicSimplifications).toBeGreaterThanOrEqual(3);
    expect(res.stats.eliminatedDeadInstructions).toBeGreaterThan(0);
  });
});

describe("4. Algorithms (Quicksort, Mergesort, Binary Search, BFS, DFS, Dijkstra)", () => {
  it("Quicksort and Mergesort produce sorted arrays with step traces", () => {
    const input = [38, 27, 43, 3, 9, 82, 10];
    const qs = traceQuicksort(input);
    const ms = traceMergesort(input);

    expect(qs[qs.length - 1].array).toEqual([3, 9, 10, 27, 38, 43, 82]);
    expect(ms[ms.length - 1].array).toEqual([3, 9, 10, 27, 38, 43, 82]);
    expect(qs[qs.length - 1].comparisons).toBeGreaterThan(0);
  });

  it("Binary Search locates target in O(log n) comparisons", () => {
    const bs = traceBinarySearch([10, 20, 30, 40, 50, 60, 70], 50);
    const last = bs[bs.length - 1];
    expect(last.foundIndex).toBe(4);
    expect(last.comparisons).toBeLessThanOrEqual(3);
  });

  it("Dijkstra finds optimal weighted path while BFS picks expensive 1-hop path", () => {
    const bfs = traceBfs(DEFAULT_WEIGHTED_GRAPH, "A", "D");
    const dijkstra = traceDijkstra(DEFAULT_WEIGHTED_GRAPH, "A", "D");
    const dfs = traceDfs(DEFAULT_WEIGHTED_GRAPH, "A", "D");

    const bfsLast = bfs[bfs.length - 1];
    const dijkLast = dijkstra[dijkstra.length - 1];

    expect(bfsLast.path).toEqual(["A", "D"]);
    expect(bfsLast.totalCost).toBe(12);

    expect(dijkLast.path).toEqual(["A", "B", "C", "D"]);
    expect(dijkLast.totalCost).toBe(7);
    expect(dijkLast.totalCost!).toBeLessThan(bfsLast.totalCost!);
    expect(dfs[dfs.length - 1].path.length).toBeGreaterThanOrEqual(2);
  });
});

describe("5. Network TCP Congestion Control", () => {
  it("performs 3-way handshake, Slow Start exponential growth, AIMD, and cwnd halving on 3-dup-ACK", () => {
    let tcp = createTcpState({
      initialCwnd: 1,
      initialSsthresh: 8,
      bottleneckMssPerRtt: 32,
      lossRate: 0,
      recoveryMode: "reno",
    });

    // RTT 1: handshake
    tcp = stepTcpRtt(tcp);
    expect(tcp.timeline[0].phase).toBe("HANDSHAKE");

    // RTT 2..4: Slow Start 1 -> 2 -> 4 -> 8
    tcp = stepTcpRtt(tcp);
    expect(tcp.cwnd).toBe(2);
    tcp = stepTcpRtt(tcp);
    expect(tcp.cwnd).toBe(4);
    tcp = stepTcpRtt(tcp);
    expect(tcp.cwnd).toBe(8);

    // RTT 5: Congestion Avoidance (+1 MSS/RTT -> 9)
    tcp = stepTcpRtt(tcp);
    expect(tcp.cwnd).toBe(9);
    expect(tcp.timeline[tcp.timeline.length - 1].phase).toBe(
      "CONGESTION_AVOIDANCE"
    );

    // RTT 6: 3-dup-ACK loss -> ssthresh = floor(9/2) = 4, cwnd = 4
    tcp = stepTcpRtt(tcp, "3-dup-ack");
    expect(tcp.ssthresh).toBe(4);
    expect(tcp.cwnd).toBe(4);

    // RTT 7: RTO -> ssthresh = 2, cwnd = 1
    tcp = stepTcpRtt(tcp, "rto");
    expect(tcp.ssthresh).toBe(2);
    expect(tcp.cwnd).toBe(1);
  });

  it("simulates multi-RTT sessions under packet loss", () => {
    const sim = simulateTcpSession(20, { lossRate: 0.02, bottleneckMssPerRtt: 16 });
    expect(sim.timeline.length).toBe(20);
    expect(sim.totalPacketsAcked).toBeGreaterThan(20);
  });
});

describe("6. Database Storage Engines (B+ Tree & LSM-Tree)", () => {
  it("splits B+ Tree nodes on insert and performs linked leaf range scans", () => {
    let tree = createBPlusTree(3); // max 2 keys per node
    for (const k of [10, 20, 5, 15, 25, 30, 12]) {
      tree = bplusInsert(tree, k, `v${k}`);
    }

    expect(tree.height).toBeGreaterThanOrEqual(2);
    expect(tree.stats.splits).toBeGreaterThanOrEqual(2);

    const hit = bplusSearch(tree, 15);
    expect(hit.found).toBe(true);
    expect(hit.value).toBe("v15");

    const miss = bplusSearch(tree, 99);
    expect(miss.found).toBe(false);

    const scan = bplusRangeScan(tree, 10, 25);
    expect(scan.entries.map((e) => e.key)).toEqual([10, 12, 15, 20, 25]);
    expect(scan.visitedLeafIds.length).toBeGreaterThanOrEqual(2);
  });

  it("flushes LSM Memtable to SSTables, triggers leveled compaction, and filters misses via Bloom filters", () => {
    let lsm = createLsmTree(3, 2);
    for (let k = 1; k <= 12; k++) {
      lsm = lsmPut(lsm, k, `row-${k}`);
    }
    expect(lsm.stats.flushes).toBe(4);
    expect(lsm.stats.compactions).toBeGreaterThanOrEqual(1);

    // Update a key and compact
    lsm = lsmPut(lsm, 5, "updated-5");
    lsm = lsmCompactLevel(lsm, 0);

    const hit = lsmGet(lsm, 5);
    expect(hit.found).toBe(true);
    expect(hit.value).toBe("updated-5");

    const miss = lsmGet(hit.state, 9999);
    expect(miss.found).toBe(false);

    const lsmAmp = lsmAmplification(miss.state);
    const btree = Array.from({ length: 12 }, (_, i) => i + 1).reduce(
      (t, k) => bplusInsert(t, k),
      createBPlusTree(3)
    );
    const btreeAmp = bplusAmplification(btree);
    expect(lsmAmp.writeAmplification).toBeGreaterThan(0);
    expect(btreeAmp.writeAmplification).toBeGreaterThan(0);
  });
});

describe("7. Concurrency & Raft Consensus", () => {
  it("elects a single leader in a 5-node cluster and commits client commands", () => {
    let cluster = createRaftCluster(42);
    cluster = stepRaftTicks(cluster, 25);

    const leaders = cluster.nodes.filter((n) => n.role === "leader");
    expect(leaders.length).toBe(1);
    const leaderId = leaders[0].id;

    const res = appendClientCommand(cluster, "SET x=1");
    expect(res.accepted).toBe(true);
    expect(res.leaderId).toBe(leaderId);
    cluster = stepRaftTicks(res.state, 4);

    const committedOnMajority = cluster.nodes.filter(
      (n) => n.commitIndex >= 1 && n.log[0]?.command === "SET x=1"
    );
    expect(committedOnMajority.length).toBeGreaterThanOrEqual(3);
  });

  it("preserves committed log safety across minority partition and healing", () => {
    let cluster = createRaftCluster(42);
    cluster = stepRaftTicks(cluster, 25);
    const originalLeader = cluster.nodes.find((n) => n.role === "leader")!;

    // Commit entry #1 before partition
    cluster = appendClientCommand(cluster, "COMMIT_1").state;
    cluster = stepRaftTicks(cluster, 4);

    // Partition originalLeader + one other node into minority Group 1 (2 nodes vs 3 nodes in Group 0)
    const otherFollower = cluster.nodes.find((n) => n.id !== originalLeader.id)!;
    cluster = setNodePartitionGroup(cluster, originalLeader.id, 1);
    cluster = setNodePartitionGroup(cluster, otherFollower.id, 1);

    // Try appending to isolated old leader -> CANNOT commit because minority only has 2/5 nodes!
    const minorityAppend = appendClientCommand(
      cluster,
      "STALE_MINORITY_CMD",
      originalLeader.id
    );
    cluster = stepRaftTicks(minorityAppend.state, 35);

    const isolatedLeader = cluster.nodes.find((n) => n.id === originalLeader.id)!;
    expect(isolatedLeader.commitIndex).toBe(1); // Cannot commit index 2!

    // Majority group (3 nodes) elects a new leader and commits #2
    const majorityLeader = cluster.nodes.find(
      (n) => n.partitionGroup === 0 && n.role === "leader"
    );
    expect(majorityLeader).toBeDefined();
    cluster = appendClientCommand(cluster, "MAJORITY_COMMIT_2", majorityLeader!.id).state;
    cluster = stepRaftTicks(cluster, 6);

    // Heal partition: old isolated leader steps down and adopts majority committed log
    cluster = healAllPartitions(cluster);
    cluster = stepRaftTicks(cluster, 6);

    for (const n of cluster.nodes) {
      expect(n.commitIndex).toBeGreaterThanOrEqual(2);
      expect(n.log[0]?.command).toBe("COMMIT_1");
      expect(n.log[1]?.command).toBe("MAJORITY_COMMIT_2");
    }
  });
});

describe("8. Cryptography & Security (DH, AES State, Real SHA-256 Avalanche)", () => {
  it("computes identical Diffie-Hellman shared secrets for Alice and Bob", () => {
    const dh = computeDiffieHellman(7919, 7, 123, 456);
    expect(dh.isPrimeP).toBe(true);
    expect(dh.secretsMatch).toBe(true);
    expect(dh.aliceSharedSecret).toBe(dh.bobSharedSecret);
  });

  it("matches official FIPS 180-4 SHA-256 test vectors", () => {
    expect(sha256Hex("")).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
    expect(sha256Hex("abc")).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("demonstrates ~40-60% SHA-256 avalanche and breaks HMAC on a 1-bit flip", () => {
    const avalanche = analyzeSha256Avalanche("Transfer $100 to Alice", 7);
    expect(avalanche.totalBits).toBe(256);
    expect(avalanche.flipPercentage).toBeGreaterThanOrEqual(38);
    expect(avalanche.flipPercentage).toBeLessThanOrEqual(62);
    expect(avalanche.hmacVerified).toBe(false);
  });

  it("propagates 1-bit plaintext difference across AES SubBytes/ShiftRows/MixColumns", () => {
    const key = textToBlock16("secret-aes-key16");
    const ptA = textToBlock16("HelloWorld123456");
    const ptB = [...ptA];
    ptB[0] ^= 0x01; // flip 1 bit

    const snapA = runAesSingleRoundDemo(ptA, key, 2);
    const snapB = runAesSingleRoundDemo(ptB, key, 2);
    const finalA = snapA[snapA.length - 1].state;
    const finalB = snapB[snapB.length - 1].state;

    let diffBytes = 0;
    for (let i = 0; i < 16; i++) {
      if (finalA[i] !== finalB[i]) diffBytes += 1;
    }
    expect(diffBytes).toBeGreaterThanOrEqual(12);
  });
});
