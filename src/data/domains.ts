import type { DomainId, DomainMeta, TrackId, TrackMeta } from "@/types/curriculum";

export const TRACKS: TrackMeta[] = [
  {
    id: "track-1",
    number: 1,
    title: "Physics, Silicon, Logic & Information",
    subtitle: "Electrons to Binary Representation",
    description:
      "Follow computing down to charge carriers, electric fields, doped silicon junctions, CMOS transistors, Boolean algebra, digital circuits, and binary/IEEE-754 data representation.",
    domainIds: [
      "physics-electricity",
      "semiconductors",
      "math-foundations",
      "digital-electronics",
      "information-representation",
    ],
  },
  {
    id: "track-2",
    number: 2,
    title: "Computer Architecture, Memory & Modern CPUs",
    subtitle: "Gates to Out-of-Order Execution",
    description:
      "Assemble arithmetic logic units, control units, instruction set architectures, ABIs, SRAM/DRAM/flash memory hierarchies, cache coherence, pipelining, and superscalar execution.",
    domainIds: [
      "computer-architecture",
      "assembly-machine-code",
      "memory-storage",
      "modern-cpu",
    ],
  },
  {
    id: "track-3",
    number: 3,
    title: "OS, Languages, Compilers & Algorithms",
    subtitle: "Boot Firmware to Asymptotic Complexity",
    description:
      "Trace firmware boot, kernel scheduling, virtual memory, filesystems, systems & managed runtimes, compiler frontends/IR/codegen, and core algorithms & data structures.",
    domainIds: [
      "operating-systems",
      "programming-languages",
      "compilers-interpreters",
      "data-structures-algorithms",
    ],
  },
  {
    id: "track-4",
    number: 4,
    title: "Networking, Databases, Distributed Systems & Security",
    subtitle: "Packets, Storage Engines & Consensus",
    description:
      "Master Ethernet/IP, TCP congestion control, TLS/HTTP, B-trees & LSM storage engines, MVCC transactions, vector search, Raft consensus, containers, and cryptographic hardware security.",
    domainIds: [
      "computer-networking",
      "databases",
      "concurrent-distributed",
      "computer-security",
    ],
  },
  {
    id: "track-5",
    number: 5,
    title: "Graphics, GPUs & Foundations of Machine Learning",
    subtitle: "Linear Algebra, Rasterization & Parallel Compute",
    description:
      "Learn linear algebra and calculus just in time for 3D rasterization, ray tracing, SIMT GPU warps, CUDA tensor cores, probability/information theory, and classical machine learning.",
    domainIds: ["computer-graphics", "gpu-parallel", "machine-learning"],
  },
  {
    id: "track-6",
    number: 6,
    title: "Deep Learning, Modern AI & Computing Frontiers",
    subtitle: "Backpropagation to Transformers & Chiplets",
    description:
      "Build neural networks from gradients up through CNNs/attention, Transformers, MoE/SSM architectures, LLM pre/post-training, KV-cache quantization, and EUV/chiplet/TPU/quantum frontiers.",
    domainIds: [
      "deep-learning",
      "modern-ai",
      "ai-training-inference",
      "computing-frontiers",
    ],
  },
];

export const DOMAINS: DomainMeta[] = [
  {
    id: "physics-electricity",
    order: 1,
    title: "Physics & Electricity",
    description:
      "Charge, electric fields, Ohm's law, power dissipation, capacitance, inductance, and RC signal propagation delays.",
    trackId: "track-1",
    justInTimeRationale:
      "Establishes physical limits (switching energy, RC delay, heat) before introducing transistors or clock frequencies.",
  },
  {
    id: "semiconductors",
    order: 2,
    title: "Semiconductors & Fabrication",
    description:
      "Silicon crystal lattices, n/p-type doping, PN junctions, MOSFET channel physics, CMOS inverters, and photolithography.",
    trackId: "track-1",
    justInTimeRationale:
      "Explains how physical voltage switches implement noise-immune digital 0s and 1s at nanometer scale.",
  },
  {
    id: "math-foundations",
    order: 3,
    title: "Just-in-Time Math Foundations",
    description:
      "Boolean algebra, linear algebra, multivariable calculus, probability, and Shannon information theory taught directly where needed.",
    trackId: "track-1",
    justInTimeRationale:
      "Instead of front-loading isolated math, Boolean logic launches before gates (Track 1) and vectors/probability launch right before graphics and ML (Track 5).",
  },
  {
    id: "digital-electronics",
    order: 4,
    title: "Digital Electronics",
    description:
      "Combinational logic networks, adders, multiplexers, SR/D flip-flops, registers, timing constraints, and finite-state machines.",
    trackId: "track-1",
    justInTimeRationale:
      "Bridges individual CMOS transistors to clocked datapaths and memory elements.",
  },
  {
    id: "information-representation",
    order: 5,
    title: "Information Representation",
    description:
      "Unsigned/two's complement integers, hexadecimal, IEEE-754 floating-point, UTF-8, entropy coding, and Hamming/CRC error correction.",
    trackId: "track-1",
    justInTimeRationale:
      "Demonstrates how voltage levels encode numbers, text, and fault-tolerant packets before building an ALU.",
  },
  {
    id: "computer-architecture",
    order: 6,
    title: "Computer Architecture",
    description:
      "ALU design, register files, fetch-decode-execute control units, microcode, and Von Neumann vs. Harvard memory architectures.",
    trackId: "track-2",
    justInTimeRationale:
      "Combines digital logic and binary representation into a programmable stored-program processor.",
  },
  {
    id: "assembly-machine-code",
    order: 7,
    title: "Assembly & Machine Code",
    description:
      "Instruction encodings across x86-64, ARM64, and RISC-V, addressing modes, call stacks, stack frames, and System V/AAPCS ABIs.",
    trackId: "track-2",
    justInTimeRationale:
      "Reveals the exact hardware-software contract that every compiler targets and every CPU executes.",
  },
  {
    id: "memory-storage",
    order: 8,
    title: "Memory & Storage Systems",
    description:
      "6T SRAM cells, capacitor DRAM refresh, set-associative caches, MESI coherence, and NAND flash FTL controllers.",
    trackId: "track-2",
    justInTimeRationale:
      "Explains why memory latency dominates CPU performance and motivates locality-aware software design.",
  },
  {
    id: "modern-cpu",
    order: 9,
    title: "Modern Microarchitecture",
    description:
      "5-stage pipelining, RAW/control hazards, forwarding, dynamic branch prediction, Tomasulo out-of-order execution, and SIMD.",
    trackId: "track-2",
    justInTimeRationale:
      "Shows how modern processors extract instruction-level and data-level parallelism while preserving sequential semantics.",
  },
  {
    id: "operating-systems",
    order: 10,
    title: "Operating Systems & Virtualization",
    description:
      "UEFI boot, kernel privilege rings, interrupts/syscalls, preemptive schedulers, virtual paging/TLBs, filesystems, and containers/VMs.",
    trackId: "track-3",
    justInTimeRationale:
      "Turns raw CPU privilege modes and MMU hardware into isolated processes, virtual memory, and persistent files.",
  },
  {
    id: "programming-languages",
    order: 11,
    title: "Programming Languages & Runtimes",
    description:
      "Manual memory & RAII/ownership models in C/Rust vs. tracing garbage collection, event loops, and dynamic runtimes in Python/JS/TS.",
    trackId: "track-3",
    justInTimeRationale:
      "Connects language abstractions directly to stack/heap layouts, OS allocations, and runtime trade-offs.",
  },
  {
    id: "compilers-interpreters",
    order: 12,
    title: "Compilers, Linkers & JITs",
    description:
      "Lexing, recursive-descent parsing, ASTs, SSA intermediate representation, LLVM optimization passes, ELF/Mach-O linking, and JITs.",
    trackId: "track-3",
    justInTimeRationale:
      "Demystifies how high-level source code lowers into machine instructions and dynamic native code.",
  },
  {
    id: "data-structures-algorithms",
    order: 13,
    title: "Data Structures & Algorithms",
    description:
      "Asymptotic complexity, recurrences, graph traversals, shortest paths, balanced trees, sorting, and cache-conscious hashing.",
    trackId: "track-3",
    justInTimeRationale:
      "Pairs algorithmic bounds with real hardware realities such as cache lines, branch mispredictions, and pointer chasing.",
  },
  {
    id: "computer-networking",
    order: 14,
    title: "Computer Networking",
    description:
      "Physical signaling, Ethernet switching, IP routing, TCP reliability & congestion control, DNS, HTTP/2/3, and TLS sockets.",
    trackId: "track-4",
    justInTimeRationale:
      "Follows bytes across wires and wireless links from physical modulation up to encrypted application protocols.",
  },
  {
    id: "databases",
    order: 15,
    title: "Database Internals",
    description:
      "Slotted pages, B+ trees, LSM-trees, WAL durability, MVCC snapshot isolation, query planners, and HNSW/IVF vector search.",
    trackId: "track-4",
    justInTimeRationale:
      "Applies storage hierarchy, hashing, and concurrency control to durable, high-throughput data engines.",
  },
  {
    id: "concurrent-distributed",
    order: 16,
    title: "Concurrent & Distributed Systems",
    description:
      "Memory models, atomics, lock-free queues, async executors, logical clocks, linearizability, and Raft consensus.",
    trackId: "track-4",
    justInTimeRationale:
      "Tackles multi-core synchronization and partial network failures using formal state machines and quorums.",
  },
  {
    id: "computer-security",
    order: 17,
    title: "Security & Cryptography",
    description:
      "Symmetric/asymmetric cryptography, signatures, memory corruption mitigations (ASLR/NX/CFI), and speculative/hardware side channels.",
    trackId: "track-4",
    justInTimeRationale:
      "Unifies mathematical cryptography with CPU microarchitecture, OS isolation, and network protocol security.",
  },
  {
    id: "computer-graphics",
    order: 18,
    title: "Computer Graphics",
    description:
      "Homogeneous transforms, projection matrices, triangle rasterization, Z-buffering, fragment shaders, and BVH-accelerated ray tracing.",
    trackId: "track-5",
    justInTimeRationale:
      "Applies linear algebra immediately to transform 3D geometry into real-time shaded framebuffers.",
  },
  {
    id: "gpu-parallel",
    order: 19,
    title: "GPU & Parallel Computing",
    description:
      "SIMT execution, 32-thread warps, divergence, coalesced global/shared memory, CUDA kernel tiling, and Tensor Core matrix units.",
    trackId: "track-5",
    justInTimeRationale:
      "Explains why throughput-oriented GPUs power both real-time rendering and modern matrix-heavy AI workloads.",
  },
  {
    id: "machine-learning",
    order: 20,
    title: "Classical Machine Learning",
    description:
      "Empirical risk minimization, linear/logistic regression, bias-variance trade-off, regularization, trees, and gradient boosting.",
    trackId: "track-5",
    justInTimeRationale:
      "Grounds statistical learning in probability and optimization before scaling to deep neural architectures.",
  },
  {
    id: "deep-learning",
    order: 21,
    title: "Deep Learning",
    description:
      "Computation graphs, reverse-mode autodiff, backpropagation, optimizers, convolutions, residual connections, and sequence attention.",
    trackId: "track-6",
    justInTimeRationale:
      "Connects multivariable chain rule and GPU matrix kernels to differentiable multi-layer representations.",
  },
  {
    id: "modern-ai",
    order: 22,
    title: "Modern AI Architectures",
    description:
      "BPE tokenization, RoPE positional encoding, multi-head self-attention, Mixture-of-Experts, state-space models, and multimodal fusion.",
    trackId: "track-6",
    justInTimeRationale:
      "Dissects the exact tensor shapes and architectural blocks inside frontier foundation models.",
  },
  {
    id: "ai-training-inference",
    order: 23,
    title: "AI Training & Inference Systems",
    description:
      "Distributed 3D parallelism, scaling laws, SFT/RLHF/DPO post-training, KV caching, PagedAttention, speculative decoding, and INT4/FP8 quantization.",
    trackId: "track-6",
    justInTimeRationale:
      "Bridges ML theory with systems engineering—memory bandwidth, arithmetic intensity, and cluster networking.",
  },
  {
    id: "computing-frontiers",
    order: 24,
    title: "Computing Frontiers",
    description:
      "High-NA EUV lithography, GAAFET transistors, UCIe chiplet packaging, systolic TPUs/NPUs, photonics, and quantum computing fundamentals.",
    trackId: "track-6",
    justInTimeRationale:
      "Synthesizes the full stack by examining where physics, packaging, and specialized accelerators are heading next.",
  },
];

export function getTrackById(id: TrackId): TrackMeta | undefined {
  return TRACKS.find((track) => track.id === id);
}

export function getDomainById(id: DomainId): DomainMeta | undefined {
  return DOMAINS.find((domain) => domain.id === id);
}

export function getDomainsByTrack(trackId: TrackId): DomainMeta[] {
  return DOMAINS.filter((domain) => domain.trackId === trackId).sort(
    (a, b) => a.order - b.order
  );
}
