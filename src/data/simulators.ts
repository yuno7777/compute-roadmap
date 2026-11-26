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
    modelBoundaries:
      "Uses lumped-element first-order RC exponential equations; omits transmission-line inductance, skin effect, and temperature-dependent resistance.",
  },
  {
    id: "pn-diode-charge",
    title: "PN Junction, Carrier Drift & Diode Lab",
    subtitle: "Electron/hole drift, doping concentration, depletion width, and Shockley diode I-V curves",
    domainId: "semiconductors",
    lessonSlugs: ["what-is-an-electron", "silicon-doping-pn-junction"],
    category: "hardware",
    controlsSummary:
      "Sweep donor/acceptor doping densities and applied bias voltage across forward and reverse bias to inspect depletion width and current.",
    challengeDescription:
      "Tune doping and forward bias to narrow the depletion barrier below 0.35 um while keeping current below breakdown.",
    modelBoundaries:
      "Applies an abrupt-junction depletion approximation and ideal Shockley diode equation; omits Zener/avalanche tunneling and series contact resistance.",
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
    modelBoundaries:
      "Models long-channel square-law MOSFET behavior with lumped load capacitance; omits FinFET/GAAFET short-channel velocity saturation and DIBL.",
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
    modelBoundaries:
      "Evaluates discrete 0/1 Boolean states on ideal unit-step clock edges; omits continuous voltage metastability windows and gate-level RC propagation skew.",
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
    modelBoundaries:
      "Implements exact IEEE-754 binary32 round-to-nearest-even bit layout via DataView; omits binary16/bfloat16/FP8 formats and x87 80-bit extended intermediates.",
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
    modelBoundaries:
      "Simulates an 8-bit educational ALU and 8-entry register file; production 64-bit CPUs use Kogge-Stone parallel-prefix adders and multi-ported physical register files.",
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
    modelBoundaries:
      "Executes a clean non-pipelined miniature RISC instruction subset; real x86/ARM cores decode variable-length/uOp streams into out-of-order execution engines.",
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
    modelBoundaries:
      "Models a single-level configurable cache with true LRU and idealized snooping MESI; real CPUs use multi-level pseudo-LRU, directory coherence, and MOESI/MESIF.",
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
    modelBoundaries:
      "Visualizes an in-order 5-stage RISC pipeline; modern Intel/Apple/AMD cores use 14-19 stages, TAGE branch predictors, register renaming, and 300+ entry ROBs.",
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
    modelBoundaries:
      "Simulates a simplified 1- or 2-level page table and small fully-associative TLB; x86-64/ARM64 hardware uses 4- or 5-level radix trees, ASIDs/PCIDs, and split L1/L2 TLBs.",
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
    modelBoundaries:
      "Simulates single-core discrete-tick Round-Robin, SJF, and MLFQ; Linux uses EEVDF/CFS red-black virtual-runtime trees across NUMA-aware multi-core runqueues.",
  },
  {
    id: "runtime-memory-eventloop",
    title: "Memory Ownership, GC & Event-Loop Lab",
    subtitle: "Stack/heap lifetimes, Rust borrow checks, tracing GC sweeps, and JS/Python event loops",
    domainId: "programming-languages",
    lessonSlugs: ["c-and-rust-memory-models", "python-js-ts-runtimes"],
    category: "systems",
    controlsSummary:
      "Step through stack/heap allocations, inspect borrow exclusivity or mark-and-sweep reachability, and drain microtask vs. macrotask queues.",
    challengeDescription:
      "Prevent a simulated use-after-free in C/Rust mode and trace why Promise microtasks starve macrotask timers.",
    modelBoundaries:
      "Models a teaching heap with deterministic mark-sweep and single-threaded FIFO task queues; production V8/CPython use generational/incremental GC and epoll/kqueue I/O.",
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
    modelBoundaries:
      "Compiles single-block arithmetic assignments into three-address SSA; full compilers like LLVM/GCC add CFG dominance frontiers, phi nodes, alias analysis, and graph-coloring register allocation.",
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
    modelBoundaries:
      "Measures abstract comparisons, swaps, and visited vertices on small inputs; real-world latency also depends heavily on L1/L2 cache locality and branch misprediction rates.",
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
    modelBoundaries:
      "Models deterministic AIMD Reno-style cwnd over a single bottleneck queue; modern stacks deploy CUBIC or BBR pacing, SACK blocks, ECN, and QUIC loss recovery.",
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
    modelBoundaries:
      "Uses small in-memory page fanout and simplified leveled compaction counts; production InnoDB/RocksDB engines add buffer-pool dirty flushing, Bloom filters, and group-commit WALs.",
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
    modelBoundaries:
      "Steps a deterministic 5-node Raft state machine with controllable partitions; production etcd/CockroachDB add Pre-Vote, ReadIndex/lease reads, log snapshots, and joint-consensus membership changes.",
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
    modelBoundaries:
      "Uses small primes for visible modular exponentiation alongside real WebCrypto/pure-TS SHA-256 HMACs; real TLS 1.3 requires 256-bit ECDHE curves (X25519) and constant-time AEAD (AES-GCM/ChaCha20-Poly1305).",
  },
  {
    id: "calculus-entropy",
    title: "Jacobian Gradients & Shannon Entropy Lab",
    subtitle: "2D gradient descent contours, Jacobian vector fields, KL divergence, and cross-entropy",
    domainId: "math-foundations",
    lessonSlugs: [
      "linear-algebra-calculus-for-computing",
      "probability-statistics-info-theory",
    ],
    category: "graphics-ai",
    controlsSummary:
      "Adjust step size, Hessian conditioning, and target vs. predicted probability distributions to inspect gradient steps and bits of surprise.",
    challengeDescription:
      "Minimize KL(P || Q) below 0.05 bits and tune learning rate to converge cleanly on an ill-conditioned quadratic bowl.",
    modelBoundaries:
      "Evaluates analytical 2D surfaces and discrete 4-outcome distributions; deep networks optimize millions of parameters over non-convex empirical loss landscapes.",
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
    modelBoundaries:
      "Runs a software CPU rasterizer at low grid resolution for pixel-level inspection; hardware GPUs execute tiled/hierarchical-Z rasterization with 2x2 quad derivatives and mipmapping.",
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
    modelBoundaries:
      "Simulates a single 32-lane warp issuing idealized 128B global transactions and 32-bank shared memory; real SMs schedule dozens of warps concurrently with L1/L2 caches and async TMA copies.",
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
    modelBoundaries:
      "Trains a small 2D MLP with vanilla SGD in pure TypeScript; production deep learning uses AdamW, residual normalization, mixed precision, and fused GPU GEMM kernels.",
  },
  {
    id: "bpe-tokenizer",
    title: "BPE Tokenizer & Subword Merge Lab",
    subtitle: "Byte-pair frequency counting, iterative merge rules, and token fertility across text types",
    domainId: "modern-ai",
    lessonSlugs: ["transformers-tokenization-embeddings"],
    category: "graphics-ai",
    controlsSummary:
      "Edit input corpora, step through byte-pair merges, and compare token counts across prose, code, and numbers.",
    challengeDescription:
      "Execute merges until multi-character subwords compress an input code snippet below 0.5 tokens per character.",
    modelBoundaries:
      "Runs educational byte-level BPE on small custom vocabularies; frontier tokenizers (cl100k_base, o200k_base, SentencePiece) pre-tokenize via regex over 50k-200k merges.",
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
    modelBoundaries:
      "Computes exact dense attention matrices on short sequences; production serving uses FlashAttention tiled SRAM reductions, RoPE rotations, and grouped-query attention (GQA).",
  },
  {
    id: "llm-training-objective",
    title: "LLM Pretraining, Scaling Laws & DPO Lab",
    subtitle: "Next-token cross-entropy loss, Chinchilla compute-optimal N/D splits, and DPO preference shifts",
    domainId: "ai-training-inference",
    lessonSlugs: ["llm-pretraining-posttraining-rl"],
    category: "graphics-ai",
    controlsSummary:
      "Allocate FLOP budget between parameters (N) and tokens (D), adjust beta KL penalty, and observe chosen vs. rejected log-odds.",
    challengeDescription:
      "Hit the Chinchilla compute-optimal iso-loss frontier (~20 tokens per parameter) and raise DPO win margin without KL collapse.",
    modelBoundaries:
      "Evaluates parametric Kaplan/Chinchilla power-law curves and closed-form binary DPO logits; real frontier runs involve data-mixture curricula, 3D parallelism, and multi-turn RLVR rollouts.",
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
    modelBoundaries:
      "Uses analytical parameter, KV-cache, and uniform quantization SNR formulas; actual serving throughput also depends on PagedAttention block fragmentation, tensor-parallel all-reduce latency, and speculative acceptance rates.",
  },
  {
    id: "chiplet-yield-qubit",
    title: "Lithography Yield, Chiplets & Qubit Error Lab",
    subtitle: "Murphy/Poisson die yield vs. area, monolithic vs. UCIe chiplet cost, and surface-code qubit overhead",
    domainId: "computing-frontiers",
    lessonSlugs: [
      "semiconductor-fabrication",
      "frontiers-euv-chiplets-tpu-quantum",
    ],
    category: "hardware",
    controlsSummary:
      "Adjust defect density D0, die area, chiplet partition count, physical qubit error rate p, and surface-code distance d.",
    challengeDescription:
      "Partition an 800 mm^2 reticle-limit die into chiplets to raise good-die yield above 75% and reach logical qubit error < 1e-6.",
    modelBoundaries:
      "Applies Bose-Einstein/Poisson yield models and threshold surface-code scaling p_L ~ (p/p_th)^((d+1)/2); real fabs model clustered defect spatial maps and interposer packaging yield loss.",
  },
];

export function getSimulatorById(id: SimulatorId): SimulatorMeta | undefined {
  return SIMULATOR_CATALOG.find((sim) => sim.id === id);
}
