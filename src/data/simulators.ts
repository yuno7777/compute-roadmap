import type { SimulatorId, SimulatorMeta } from "@/types/simulator";

export const SIMULATOR_CATALOG: SimulatorMeta[] = [
  {
    id: "ohm-circuit",
    title: "Ohm's Law & RC Timing Lab",
    subtitle: "Voltage, resistance, power dissipation, and RC charge curves",
    domainId: "physics-electricity",
    lessonSlugs: ["voltage-current-circuits", "electromagnetism-rc-timing"],
    category: "hardware",
    controlsSummary:
      "Adjust supply voltage (V), resistance (R), and capacitance (C) to observe live current, wattage, and rise-time waveforms.",
    challengeDescription:
      "Tune R and C to achieve a 10%-90% rise time under 2.2 ns without exceeding 25 mW peak power.",
  },
  {
    id: "mosfet-cmos",
    title: "MOSFET & CMOS Inverter Sandbox",
    subtitle: "Gate voltage thresholds, channel formation, and static vs. dynamic power",
    domainId: "semiconductors",
    lessonSlugs: ["mosfets-and-cmos-logic"],
    category: "hardware",
    controlsSummary:
      "Sweep Vgs and input voltage Vin across PMOS/NMOS pull-up/pull-down networks and toggle switching frequency.",
    challengeDescription:
      "Identify the VTC switching threshold and minimize crowbar short-circuit current during transitions.",
  },
  {
    id: "logic-gates",
    title: "Digital Logic & Flip-Flop Bench",
    subtitle: "Interactive NAND/NOR/XOR gates, 4-bit ripple adder, and clocked D-flip-flop",
    domainId: "digital-electronics",
    lessonSlugs: [
      "boolean-algebra-logic",
      "combinational-circuits-adders",
      "sequential-logic-flip-flops",
    ],
    category: "hardware",
    controlsSummary:
      "Toggle input bits, pulse the clock edge, and switch between combinational adder and sequential state modes.",
    challengeDescription:
      "Construct an XOR truth table from universal NAND gates and latch a 4-bit value across clock edges.",
  },
  {
    id: "binary-float",
    title: "Two's Complement & IEEE-754 Bit Inspector",
    subtitle: "Bit-level inspection of signed integers and 32-bit float fields",
    domainId: "information-representation",
    lessonSlugs: ["binary-hex-signed-integers", "ieee-754-floating-point"],
    category: "hardware",
    controlsSummary:
      "Flip individual sign, exponent, and mantissa bits or enter decimal values to inspect subnormals, NaN, and overflow.",
    challengeDescription:
      "Encode -13.625 in IEEE-754 single precision and demonstrate why 0.1 + 0.2 !== 0.3.",
  },
  {
    id: "alu-register",
    title: "ALU & Register File Datapath",
    subtitle: "Opcode selection, status flags (Z, N, C, V), and register writeback",
    domainId: "computer-architecture",
    lessonSlugs: ["alu-and-data-paths"],
    category: "hardware",
    controlsSummary:
      "Select source registers Rs1/Rs2, choose an ALU operation (ADD, SUB, AND, XOR, SLT), and pulse write-enable.",
    challengeDescription:
      "Trigger signed overflow (V=1) without unsigned carry (C=0) using two 8-bit two's complement operands.",
  },
  {
    id: "cpu-fde",
    title: "Fetch-Decode-Execute CPU Simulator",
    subtitle: "Single-cycle / multi-step instruction execution with PC, IR, and registers",
    domainId: "computer-architecture",
    lessonSlugs: ["control-unit-fetch-decode-execute", "isa-opcodes-x86-arm-riscv"],
    category: "hardware",
    controlsSummary:
      "Step through Fetch, Decode, Execute, Memory, and Writeback phases on a miniature RISC assembly program.",
    challengeDescription:
      "Trace a conditional loop to compute the sum 1..5 and observe every PC jump and register update.",
  },
  {
    id: "cache-memory",
    title: "Set-Associative Cache & Coherence Lab",
    subtitle: "Tag/index/offset breakdown, LRU eviction, and MESI state transitions",
    domainId: "memory-storage",
    lessonSlugs: ["cache-hierarchies-coherence"],
    category: "hardware",
    controlsSummary:
      "Configure cache size, block size, and associativity; replay address traces and inspect hit/miss rates and MESI states.",
    challengeDescription:
      "Eliminate conflict misses on a strided array traversal by switching from direct-mapped to 2-way set-associative.",
  },
  {
    id: "pipeline-hazard",
    title: "5-Stage Pipeline & Hazard Visualizer",
    subtitle: "IF/ID/EX/MEM/WB stalls, forwarding paths, and branch flushes",
    domainId: "modern-cpu",
    lessonSlugs: [
      "pipelining-hazards-branch-prediction",
      "out-of-order-superscalar-simd",
    ],
    category: "hardware",
    controlsSummary:
      "Toggle data forwarding and 2-bit branch prediction while stepping through instruction sequences with RAW dependencies.",
    challengeDescription:
      "Reduce total cycles on a load-use + branch sequence by enabling EX-to-EX forwarding and dynamic prediction.",
  },
  {
    id: "virtual-memory",
    title: "MMU, Page Table & TLB Translator",
    subtitle: "Virtual-to-physical address translation, TLB hits/misses, and page faults",
    domainId: "operating-systems",
    lessonSlugs: ["virtual-memory-paging-tlb"],
    category: "systems",
    controlsSummary:
      "Submit virtual addresses, inspect VPN/offset split, watch TLB lookups, multi-level page walks, and LRU page replacement.",
    challengeDescription:
      "Achieve at least an 80% TLB hit rate on a working set by tuning page size and access locality.",
  },
  {
    id: "os-scheduler",
    title: "OS Process Scheduler & Syscall Tracer",
    subtitle: "Round-Robin, SJF, and MLFQ scheduling timelines with context-switch overhead",
    domainId: "operating-systems",
    lessonSlugs: ["processes-threads-scheduling", "interrupts-syscalls-privilege"],
    category: "systems",
    controlsSummary:
      "Adjust time quantum, toggle scheduler policy, add I/O bursts, and compare turnaround vs. response latency.",
    challengeDescription:
      "Keep interactive task response time under 15 ms without starving CPU-bound batch jobs.",
  },
  {
    id: "compiler-pipeline",
    title: "Lexer, Parser, AST & SSA IR Explorer",
    subtitle: "Step-by-step lowering from source expression to tokens, AST, and optimized SSA IR",
    domainId: "compilers-interpreters",
    lessonSlugs: ["lexing-parsing-ast", "ir-llvm-optimization-codegen"],
    category: "systems",
    controlsSummary:
      "Edit expressions, inspect token streams and AST nodes, and toggle constant folding and dead-code elimination.",
    challengeDescription:
      "Write an expression where constant folding plus DCE collapses three intermediate SSA temporaries into one constant.",
  },
  {
    id: "algorithms",
    title: "Graph & Sorting Algorithm Animator",
    subtitle: "Step-by-step Dijkstra, BFS/DFS, Quicksort, and Mergesort comparisons",
    domainId: "data-structures-algorithms",
    lessonSlugs: ["asymptotics-recurrences-graphs", "data-structures-sorting-hashing"],
    category: "systems",
    controlsSummary:
      "Choose an algorithm, edit weights or input distributions, and inspect comparisons, swaps, and frontier states.",
    challengeDescription:
      "Demonstrate a weighted graph where BFS fails to find the minimum-cost path while Dijkstra succeeds.",
  },
  {
    id: "network-tcp",
    title: "TCP Sliding Window & Congestion Lab",
    subtitle: "Three-way handshake, packet loss, AIMD cwnd growth, and RTT estimation",
    domainId: "computer-networking",
    lessonSlugs: ["physical-layer-ethernet-ip", "tcp-udp-congestion-control"],
    category: "systems",
    controlsSummary:
      "Inject packet drops, adjust bottleneck bandwidth and RTT, and watch cwnd slow-start vs. congestion avoidance.",
    challengeDescription:
      "Maximize link utilization under 2% random loss while avoiding repeated retransmission timeouts.",
  },
  {
    id: "database-storage",
    title: "B+ Tree & LSM-Tree Storage Engine Lab",
    subtitle: "Page splits, memtable flushes, SSTable compaction, and MVCC snapshots",
    domainId: "databases",
    lessonSlugs: ["database-storage-btrees-lsm", "transactions-mvcc-query-execution"],
    category: "systems",
    controlsSummary:
      "Insert/query keys across B+ tree and LSM views, trigger compaction, and measure read vs. write amplification.",
    challengeDescription:
      "Observe write amplification drop on sequential bulk inserts when switching from B+ tree to leveled LSM.",
  },
  {
    id: "concurrency-raft",
    title: "Raft Consensus & Atomics Simulator",
    subtitle: "Leader election, heartbeat terms, split votes, and log replication quorums",
    domainId: "concurrent-distributed",
    lessonSlugs: ["threads-atomics-async-runtimes", "distributed-consensus-raft"],
    category: "systems",
    controlsSummary:
      "Partition nodes, kill the leader, append client commands, and step through term elections and commit indices.",
    challengeDescription:
      "Recover a 5-node cluster from a minority partition without violating committed log safety.",
  },
  {
    id: "crypto-security",
    title: "Diffie-Hellman, AES & Signature Inspector",
    subtitle: "Modular key exchange, avalanche diffusion, and SHA-256 integrity checks",
    domainId: "computer-security",
    lessonSlugs: ["cryptography-memory-hardware-security"],
    category: "systems",
    controlsSummary:
      "Pick prime modulus and secret exponents, flip a single plaintext bit, and inspect hash/ciphertext avalanche.",
    challengeDescription:
      "Verify why changing 1 bit in a message flips ~50% of digest bits and breaks an HMAC verification.",
  },
  {
    id: "graphics-rasterizer",
    title: "2D/3D Triangle Rasterizer & Shader Bench",
    subtitle: "MVP matrix transforms, barycentric coordinates, Z-buffer, and Phong shading",
    domainId: "computer-graphics",
    lessonSlugs: ["pixels-rasterization-shaders", "ray-tracing-graphics-pipelines"],
    category: "graphics-ai",
    controlsSummary:
      "Rotate camera/FOV, toggle depth testing and wireframe mode, and inspect per-pixel barycentric weights.",
    challengeDescription:
      "Eliminate Z-fighting between overlapping triangles by tuning near/far clip planes.",
  },
  {
    id: "gpu-warp",
    title: "GPU SIMT Warp & Memory Coalescing Lab",
    subtitle: "32-thread lockstep masks, branch divergence penalties, and shared-memory tiling",
    domainId: "gpu-parallel",
    lessonSlugs: ["gpu-simt-warps-memory", "cuda-kernels-tensor-cores"],
    category: "graphics-ai",
    controlsSummary:
      "Compare AoS vs. SoA strides, introduce warp-divergent if/else branches, and watch active thread masks and DRAM transactions.",
    challengeDescription:
      "Reduce global memory transactions by 4x by coalescing warp lane accesses and eliminating bank conflicts.",
  },
  {
    id: "neural-backprop",
    title: "Computation Graph & Backprop Playground",
    subtitle: "Forward activations, chain-rule gradients, and live 2D decision boundary",
    domainId: "deep-learning",
    lessonSlugs: ["neural-networks-backpropagation", "cnns-rnns-attention"],
    category: "graphics-ai",
    controlsSummary:
      "Adjust learning rate, activation (ReLU/Tanh/Sigmoid), and hidden width; step through forward/backward passes.",
    challengeDescription:
      "Solve the non-linear XOR/spiral dataset without triggering vanishing gradients or exploding loss.",
  },
  {
    id: "transformer-attention",
    title: "Scaled Dot-Product Attention Visualizer",
    subtitle: "Q, K, V projections, causal masking, and token-to-token softmax heatmaps",
    domainId: "modern-ai",
    lessonSlugs: [
      "transformers-tokenization-embeddings",
      "moe-ssm-multimodal-reasoning",
    ],
    category: "graphics-ai",
    controlsSummary:
      "Select input prompts, toggle causal mask, adjust temperature/head dimension dk, and inspect attention weights.",
    challengeDescription:
      "Observe how removing 1/sqrt(dk) scaling saturates softmax into near-one-hot distributions.",
  },
  {
    id: "quantization-kv",
    title: "KV-Cache & Quantization Memory Calculator",
    subtitle: "FP16/BF16/INT8/INT4 quantization error and prefill vs. decode roof-line metrics",
    domainId: "ai-training-inference",
    lessonSlugs: ["inference-kv-cache-quantization"],
    category: "graphics-ai",
    controlsSummary:
      "Tune model parameters, context length, batch size, GQA ratio, and weight/KV bit-width.",
    challengeDescription:
      "Fit a 70B-class model at 32k context within an 80 GB HBM budget using GQA and INT4/FP8 quantization.",
  },
];

export function getSimulatorById(id: SimulatorId): SimulatorMeta | undefined {
  return SIMULATOR_CATALOG.find((sim) => sim.id === id);
}
