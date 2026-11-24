import type { GlossaryTerm } from "@/types/curriculum";

export const TRACK_2_GLOSSARY: GlossaryTerm[] = [
  {
    id: "alu",
    term: "Arithmetic Logic Unit (ALU)",
    domainId: "computer-architecture",
    shortDefinition:
      "A combinational digital circuit that performs integer arithmetic, bitwise logic, and shift/comparison operations on N-bit operands selected by control opcode lines.",
    detailedExplanation:
      "An ALU combines an N-bit adder/subtractor (using two's complement negation via inverted B plus carry-in 1), bitwise logic gates (AND, OR, XOR, NOT), and a multiplexer controlled by ALUOp signals. Because it is purely combinational, its outputs settle within one critical-path propagation delay before being latched into destination registers on the rising clock edge.",
    formulaLatex: "Y = \\text{MUX}_{\\text{op}}(A + B,\\; A + \\overline{B} + 1,\\; A \\land B,\\; A \\lor B,\\; A \\oplus B)",
    relatedLessonSlugs: ["alu-and-data-paths", "control-unit-fetch-decode-execute"],
  },
  {
    id: "status-flags",
    term: "Processor Status Flags (Z, N, C, V)",
    domainId: "computer-architecture",
    shortDefinition:
      "Single-bit condition codes output by the ALU indicating whether a result is Zero (Z), Negative (N), produced an unsigned Carry/Borrow (C), or suffered signed Overflow (V).",
    detailedExplanation:
      "Status flags decouple arithmetic computation from conditional branching. For an N-bit operation, Z=1 when all result bits are 0; N equals the MSB (sign bit); C captures the carry-out from the MSB (unsigned overflow on addition); and V detects two's complement signed overflow when the carry into the MSB differs from the carry out of the MSB.",
    formulaLatex: "V = C_{N-1} \\oplus C_N, \\qquad Z = \\bigwedge_{i=0}^{N-1} \\overline{R_i}",
    relatedLessonSlugs: ["alu-and-data-paths", "isa-opcodes-x86-arm-riscv"],
  },
  {
    id: "register-file",
    term: "Register File",
    domainId: "computer-architecture",
    shortDefinition:
      "A small, ultra-fast array of multi-ported SRAM or flip-flop storage slots directly inside the CPU core, typically supporting two simultaneous reads and one write per cycle.",
    detailedExplanation:
      "Unlike main DRAM, an architectural register file (e.g., 32 x 64-bit registers in RISC-V or ARM64) uses dedicated read decoders/muxes so two source operands (Rs1, Rs2) can feed the ALU in parallel while a clocked write port (Rd, WriteEnable) updates the target register at the clock edge. Register 0 (x0 in RISC-V, XZR in ARM64) is often hardwired to zero.",
    formulaLatex: "\\text{Access Time} \\approx 1\\text{ cycle } (< 0.5\\text{ ns at } 3\\text{ GHz})",
    relatedLessonSlugs: ["alu-and-data-paths", "out-of-order-superscalar-simd"],
  },
  {
    id: "program-counter",
    term: "Program Counter (PC)",
    domainId: "computer-architecture",
    shortDefinition:
      "A dedicated CPU register holding the memory address of the instruction currently being fetched (or next to be executed).",
    detailedExplanation:
      "During sequential execution of fixed-width 4-byte instructions, the datapath computes PC + 4 in parallel with instruction fetch. On taken branches, jumps, function calls, or interrupts, a multiplexer overwrites the PC with the branch target address, redirecting control flow.",
    formulaLatex: "\\text{PC}_{\\text{next}} = \\text{BranchTaken} \\;?\\; (\\text{PC} + \\text{imm}) : (\\text{PC} + 4)",
    relatedLessonSlugs: [
      "control-unit-fetch-decode-execute",
      "pipelining-hazards-branch-prediction",
    ],
  },
  {
    id: "instruction-register",
    term: "Instruction Register (IR)",
    domainId: "computer-architecture",
    shortDefinition:
      "A sequential latch in multi-cycle and pipelined CPUs that holds the fetched machine-code instruction word while it is decoded and executed.",
    detailedExplanation:
      "In a multi-cycle CPU, memory is read during the Fetch phase and the returned instruction bits are stored in the IR so that subsequent Decode and Execute cycles can inspect opcode and operand fields even if the memory bus is later used for data loads or stores.",
    relatedLessonSlugs: ["control-unit-fetch-decode-execute", "von-neumann-vs-harvard"],
  },
  {
    id: "control-unit",
    term: "Control Unit (Hardwired vs. Microprogrammed)",
    domainId: "computer-architecture",
    shortDefinition:
      "The FSM and combinational decoder logic that translates an instruction's opcode bits into datapath control signals (ALUOp, RegWrite, MemRead, MemWrite, PCSrc).",
    detailedExplanation:
      "Hardwired control units implement decoding directly as fast combinational logic gates and state flip-flops—ideal for fixed-format RISC ISAs. Microprogrammed control units index a control store (ROM/SRAM) of microinstructions to sequence complex multi-step CISC instructions such as x86 string operations or legacy vector instructions.",
    relatedLessonSlugs: ["control-unit-fetch-decode-execute", "isa-opcodes-x86-arm-riscv"],
  },
  {
    id: "von-neumann-architecture",
    term: "Von Neumann Architecture & Bottleneck",
    domainId: "computer-architecture",
    shortDefinition:
      "A stored-program computer model in which both executable instructions and data reside in a single unified address space accessed over one shared memory bus.",
    detailedExplanation:
      "Storing code as data enables compilers, OS loaders, and self-modifying/JIT code, but creates the Von Neumann bottleneck: instruction fetches and data loads/stores contend for the same memory channel and bandwidth ceiling.",
    formulaLatex: "\\text{Effective Bandwidth} = \\frac{\\text{Bus Width} \\times f_{\\text{bus}}}{\\text{Instruction + Data Contention Factor}}",
    relatedLessonSlugs: ["von-neumann-vs-harvard", "cache-hierarchies-coherence"],
  },
  {
    id: "harvard-architecture",
    term: "Harvard & Modified Harvard Architecture",
    domainId: "computer-architecture",
    shortDefinition:
      "A processor organization with physically separate memories and buses for instructions and data, permitting simultaneous instruction fetch and data access.",
    detailedExplanation:
      "Pure Harvard architectures (common in DSPs and microcontrollers) prevent code and data from sharing physical memory. Modern desktop and server CPUs use a Modified Harvard design: split L1 Instruction (L1i) and L1 Data (L1d) caches provide Harvard parallelism inside the core, backed by a unified Von Neumann L2/L3/DRAM address space.",
    relatedLessonSlugs: ["von-neumann-vs-harvard", "cache-hierarchies-coherence"],
  },
  {
    id: "isa",
    term: "Instruction Set Architecture (ISA)",
    domainId: "assembly-machine-code",
    shortDefinition:
      "The formal hardware-software contract specifying programmer-visible registers, memory model, data types, instruction encodings, and exception semantics.",
    detailedExplanation:
      "An ISA (such as x86-64, AArch64, or RV64GC) abstracts away microarchitectural details like pipeline depth or cache size. Multiple radically different implementations—an in-order embedded core and a wide out-of-order server chip—can execute the exact same binary if they implement the same ISA.",
    relatedLessonSlugs: ["isa-opcodes-x86-arm-riscv", "out-of-order-superscalar-simd"],
  },
  {
    id: "opcode",
    term: "Opcode & Instruction Encoding",
    domainId: "assembly-machine-code",
    shortDefinition:
      "The bitfield inside a machine instruction that identifies the operation to perform, accompanied by register specifiers, function codes, and immediate constants.",
    detailedExplanation:
      "Fixed-length ISAs like RISC-V (32-bit R/I/S/B/U/J formats) keep opcode and source register bit positions aligned across formats to simplify parallel decoding. Variable-length ISAs like x86-64 pack prefixes, REX bytes, 1–3 byte opcodes, ModR/M, SIB, displacement, and immediates into 1 to 15 bytes for high code density.",
    relatedLessonSlugs: ["isa-opcodes-x86-arm-riscv", "control-unit-fetch-decode-execute"],
  },
  {
    id: "addressing-mode",
    term: "Addressing Mode",
    domainId: "assembly-machine-code",
    shortDefinition:
      "The rule by which an instruction computes an operand's effective location from registers, immediate offsets, or PC-relative displacements.",
    detailedExplanation:
      "Common modes include register direct (add x1, x2, x3), immediate (addi x1, x2, 16), base-plus-displacement (lw x1, 24(sp)), scaled-index x86 addressing ([rdi + rsi*4 + 8]), and PC-relative addressing for position-independent code (PIC) and branches.",
    formulaLatex: "\\text{EA}_{\\text{x86}} = \\text{Base} + \\text{Index} \\times \\text{Scale} + \\text{Disp}",
    relatedLessonSlugs: ["isa-opcodes-x86-arm-riscv", "stacks-calling-conventions-abi"],
  },
  {
    id: "call-stack",
    term: "Call Stack & Stack Frame",
    domainId: "assembly-machine-code",
    shortDefinition:
      "A LIFO region of virtual memory managed by the stack pointer (SP/RSP) that allocates per-call frames holding return addresses, saved registers, and local variables.",
    detailedExplanation:
      "On most architectures (x86-64, ARM64, RISC-V), the stack grows downward toward lower addresses. Calling a function decrements SP to reserve a stack frame and saves the return address (either pushed onto the stack by x86 CALL or placed in a link register LR/ra on ARM64/RISC-V). Returning restores SP and jumps back to the caller.",
    relatedLessonSlugs: ["stacks-calling-conventions-abi", "processes-threads-scheduling"],
  },
  {
    id: "abi",
    term: "Application Binary Interface (ABI)",
    domainId: "assembly-machine-code",
    shortDefinition:
      "The low-level binary convention governing argument passing, return registers, stack alignment, struct layout, and system-call interfaces across compiled object files.",
    detailedExplanation:
      "While an ISA defines instructions, an ABI (such as System V AMD64 ABI on Linux or AAPCS64 on ARM64) ensures object files compiled separately in C, Rust, or assembly interoperate cleanly. For example, System V AMD64 passes the first 6 integer arguments in RDI, RSI, RDX, RCX, R8, R9 and enforces 16-byte RSP alignment prior to CALL.",
    relatedLessonSlugs: ["stacks-calling-conventions-abi", "linkers-interpreters-jit"],
  },
  {
    id: "caller-callee-saved",
    term: "Caller-Saved vs. Callee-Saved Registers",
    domainId: "assembly-machine-code",
    shortDefinition:
      "An ABI register-preservation split: caller-saved (volatile) registers may be freely clobbered by a callee, whereas callee-saved (non-volatile) registers must be restored before returning.",
    detailedExplanation:
      "This contract avoids saving the entire register file on every call. Short leaf functions use volatile registers without touching the stack, while functions holding values across nested calls keep them in callee-saved registers (such as RBX, RBP, R12–R15 on System V x86-64) and preserve those only in the prologue/epilogue if used.",
    relatedLessonSlugs: ["stacks-calling-conventions-abi", "c-and-rust-memory-models"],
  },
  {
    id: "sram-cell",
    term: "6T SRAM Cell",
    domainId: "memory-storage",
    shortDefinition:
      "A static RAM bitcell built from six MOSFETs—two cross-coupled CMOS inverters plus two access pass transistors—that holds its bit indefinitely while powered.",
    detailedExplanation:
      "Because cross-coupled inverters actively regenerate logic 0 and 1, SRAM requires no periodic refresh and switches in sub-nanosecond latency, making it ideal for CPU registers and L1/L2/L3 caches. Its 6-transistor footprint makes SRAM roughly 6–10x less dense and far costlier per bit than DRAM.",
    relatedLessonSlugs: ["sram-dram-memory-cells", "cache-hierarchies-coherence"],
  },
  {
    id: "dram-refresh",
    term: "1T1C DRAM Cell & Refresh Cycle",
    domainId: "memory-storage",
    shortDefinition:
      "A dynamic RAM cell storing one bit as electrical charge on a microscopic trench/stacked capacitor accessed via one transistor, requiring periodic sensing and rewriting every few milliseconds.",
    detailedExplanation:
      "Because charge leaks through subthreshold transistor currents, DRAM cells must be refreshed (typically every 64 ms at standard temp, or 32 ms at high temp) by activating each row into the sense-amplifier row buffer. Reads are destructive and immediately write back the sensed charge; DRAM also incurs row-activation (tRCD), CAS (tCL), and precharge (tRP) timing delays.",
    formulaLatex: "Q = C_{\\text{cell}} V, \\qquad \\text{Refresh Overhead} = \\frac{N_{\\text{rows}} \\cdot t_{\\text{RFC}}}{t_{\\text{REFI}}}",
    relatedLessonSlugs: ["sram-dram-memory-cells", "cache-hierarchies-coherence"],
  },
  {
    id: "spatial-temporal-locality",
    term: "Spatial & Temporal Locality",
    domainId: "memory-storage",
    shortDefinition:
      "Empirical program access patterns: temporal locality means recently accessed addresses are likely to be reused soon; spatial locality means nearby addresses are likely to be accessed soon.",
    detailedExplanation:
      "Caches exploit temporal locality by retaining recently fetched blocks and exploit spatial locality by fetching entire cache lines (typically 64 bytes) on a miss rather than a single word. Contiguous arrays exhibit strong spatial locality, whereas linked-list pointer chasing defeats spatial prefetching.",
    relatedLessonSlugs: ["cache-hierarchies-coherence", "data-structures-sorting-hashing"],
  },
  {
    id: "set-associative-cache",
    term: "Set-Associative Cache (Tag, Index, Offset)",
    domainId: "memory-storage",
    shortDefinition:
      "A cache organization that partitions a memory address into a byte Offset within a cache line, a Set Index selecting one of S sets, and a Tag compared across W ways in parallel.",
    detailedExplanation:
      "An N-way set-associative cache balances direct-mapped speed against fully-associative flexibility: each address maps to one deterministic set, but up to W blocks can coexist in that set (evicted via pseudo-LRU or RRIP), sharply reducing conflict misses.",
    formulaLatex: "b = \\log_2(\\text{LineSize}), \\quad s = \\log_2\\!\\left(\\frac{\\text{Capacity}}{W \\cdot \\text{LineSize}}\\right), \\quad t = A_{\\text{bits}} - s - b",
    relatedLessonSlugs: ["cache-hierarchies-coherence", "virtual-memory-paging-tlb"],
  },
  {
    id: "mesi-coherence",
    term: "MESI Cache Coherence Protocol",
    domainId: "memory-storage",
    shortDefinition:
      "A write-invalidate snooping/directory protocol tracking each cache line in one of four states—Modified, Exclusive, Shared, or Invalid—so all cores observe a coherent memory view.",
    detailedExplanation:
      "Under MESI, a core may silently write to a line in Modified or Exclusive state, whereas writing to a Shared line first broadcasts a Read-For-Ownership (BusRdX) to invalidate peer copies. False sharing occurs when two cores modify independent variables residing in the same 64B cache line, bouncing ownership between cores.",
    relatedLessonSlugs: ["cache-hierarchies-coherence", "threads-atomics-async-runtimes"],
  },
  {
    id: "nand-flash-ftl",
    term: "NAND Flash & Flash Translation Layer (FTL)",
    domainId: "memory-storage",
    shortDefinition:
      "Non-volatile floating-gate or charge-trap memory arrays that read/program at page granularity (4–16 KiB) but must erase at much larger block granularity (MiBs), managed by an FTL.",
    detailedExplanation:
      "Because NAND flash cannot overwrite a page in place without first erasing an entire multi-megabyte block (and cells wear out after finite P/E cycles), the SSD controller's Flash Translation Layer (FTL) maintains an LBA-to-PBA mapping table, writes out-of-place, runs garbage collection, spreads wear evenly, and applies LDPC ECC.",
    formulaLatex: "\\text{Write Amplification Factor (WAF)} = \\frac{\\text{Bytes Written to NAND}}{\\text{Bytes Written by Host}}",
    relatedLessonSlugs: ["flash-ssd-storage-controllers", "drivers-and-filesystems"],
  },
  {
    id: "nvme-queues",
    term: "NVMe Submission & Completion Queues",
    domainId: "memory-storage",
    shortDefinition:
      "Lockless, host-memory circular ring buffers paired over PCIe that allow up to 64K queues with 64K commands each for massively parallel SSD I/O.",
    detailedExplanation:
      "Replacing legacy single-queue SATA/AHCI serial polling, NVMe allocates per-CPU-core Submission Queues (SQ) and Completion Queues (CQ) in host DRAM. The CPU writes 64-byte descriptors, rings a PCIe MMIO doorbell, and the SSD controller fetches commands via DMA and raises an MSI-X interrupt upon completion.",
    relatedLessonSlugs: ["flash-ssd-storage-controllers", "drivers-and-filesystems"],
  },
  {
    id: "instruction-pipeline",
    term: "Instruction Pipeline & CPI",
    domainId: "modern-cpu",
    shortDefinition:
      "Hardware assembly-line overlapping of instruction phases (IF, ID, EX, MEM, WB) so multiple instructions execute concurrently at different stages, ideally achieving CPI = 1.",
    detailedExplanation:
      "Pipelining does not shorten an individual instruction's latency—in fact, pipeline register setup/hold overhead slightly increases it—but multiplies instruction throughput by allowing clock period to shrink to the slowest single stage rather than the sum of all five stages.",
    formulaLatex: "\\text{CPI}_{\\text{effective}} = \\text{CPI}_{\\text{ideal}} + \\text{Stall Cycles per Instruction}",
    relatedLessonSlugs: ["pipelining-hazards-branch-prediction", "out-of-order-superscalar-simd"],
  },
  {
    id: "pipeline-hazard",
    term: "Pipeline Hazards (Structural, Data, Control)",
    domainId: "modern-cpu",
    shortDefinition:
      "Conditions preventing the next instruction in a pipeline from executing in its designated clock cycle due to resource conflicts, operand dependencies, or unresolved branches.",
    detailedExplanation:
      "Structural hazards arise from shared hardware (e.g., single memory port); data hazards (RAW, WAR, WAW) occur when instructions read/write the same register before an earlier instruction finishes; and control hazards occur while branch outcomes/targets are unresolved, requiring stalls or pipeline flushes.",
    relatedLessonSlugs: ["pipelining-hazards-branch-prediction", "out-of-order-superscalar-simd"],
  },
  {
    id: "data-forwarding",
    term: "Data Forwarding (Bypassing)",
    domainId: "modern-cpu",
    shortDefinition:
      "Muxed datapath wires routing an ALU or MEM stage result directly back into the EX stage inputs of a dependent younger instruction without waiting for register writeback.",
    detailedExplanation:
      "EX-to-EX and MEM-to-EX forwarding eliminate stalls for back-to-back ALU RAW dependencies. However, a true load-use hazard (a load followed immediately by an ALU instruction consuming the loaded word) still incurs a 1-cycle bubble in a classic 5-stage pipeline because the data only arrives at the end of MEM.",
    relatedLessonSlugs: ["pipelining-hazards-branch-prediction"],
  },
  {
    id: "branch-prediction",
    term: "Dynamic Branch Prediction (BHT & BTB)",
    domainId: "modern-cpu",
    shortDefinition:
      "Speculative hardware structures—such as 2-bit saturating counters, TAGE history tables, and Branch Target Buffers—that predict branch direction and target address during Fetch.",
    detailedExplanation:
      "A 2-bit saturating counter resists flipping on a single anomalous loop exit, while modern correlating/TAGE predictors exploit global branch history across multiple path lengths to exceed 99% accuracy. Mispredictions flush younger speculative instructions in the pipeline, costing 12–20+ cycles on deep cores.",
    formulaLatex: "\\text{Branch Penalty CPI} = f_{\\text{branch}} \\times p_{\\text{mispredict}} \\times \\text{Penalty}_{\\text{flush}}",
    relatedLessonSlugs: [
      "pipelining-hazards-branch-prediction",
      "cryptography-memory-hardware-security",
    ],
  },
  {
    id: "tomasulo-ooo",
    term: "Out-of-Order Execution, Register Renaming & ROB",
    domainId: "modern-cpu",
    shortDefinition:
      "A superscalar microarchitecture that eliminates false WAR/WAW dependencies via physical register renaming, issues ready instructions dynamically via Reservation Stations, and commits in program order using a Reorder Buffer (ROB).",
    detailedExplanation:
      "Modern cores fetch and rename multiple instructions per cycle (mapping architectural registers to a much larger Physical Register File via the RAT). Instructions wait in the Issue Queue until operands are ready on the Common Data Bus, execute out-of-order across multiple ports, and retire strictly in-order from the ROB to guarantee precise exceptions.",
    relatedLessonSlugs: [
      "out-of-order-superscalar-simd",
      "cryptography-memory-hardware-security",
    ],
  },
  {
    id: "simd-vector",
    term: "SIMD (Single Instruction, Multiple Data)",
    domainId: "modern-cpu",
    shortDefinition:
      "Data-level parallel CPU execution where one instruction operates simultaneously on packed lanes inside wide vector registers (e.g., 128-bit NEON, 256-bit AVX2, 512-bit AVX-512, or scalable SVE/RVV).",
    detailedExplanation:
      "Instead of looping scalar-by-scalar, a single 256-bit AVX2 VADDPS instruction computes eight 32-bit floating-point additions in parallel using one instruction fetch and decode. Predication masks handle lane-level conditionals without branching.",
    formulaLatex: "\\text{Vector Lanes} = \\frac{\\text{Vector Register Width (bits)}}{\\text{Element Width (bits)}}",
    relatedLessonSlugs: ["out-of-order-superscalar-simd", "gpu-simt-warps-memory"],
  },
];
