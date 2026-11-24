import type { TrackExam } from "@/types/curriculum";

export const TRACK_2_EXAM: TrackExam = {
  id: "exam-track-2",
  trackId: "track-2",
  title: "Track 2 Mastery Exam: Computer Architecture, Memory & Modern CPUs",
  description:
    "Cumulative assessment spanning ALU datapaths, control units, Von Neumann vs. Modified Harvard memory, x86-64/ARM64/RISC-V ISAs & ABIs, SRAM/DRAM timing, cache hierarchies & MESI, NAND/NVMe storage, pipelining, and out-of-order superscalar SIMD cores.",
  passingScore: 70,
  questions: [
    {
      id: "e2-q1",
      type: "predict-output",
      difficulty: "intermediate",
      prompt:
        "An 8-bit ALU adds two two's complement operands `A = 0x80` (-128) and `B = 0x80` (-128). What are the resulting 8-bit sum and `(Z, N, C, V)` status flags?",
      options: [
        {
          id: "a",
          text: "y = 0x00, Z=1, N=0, C=1, V=1",
          explanation:
            "Correct! 0x80 + 0x80 = 0x100: the low 8 bits are 0x00 (Z=1, N=0), carry-out bit 8 is C=1, and carry into the MSB (C7=0) XOR carry out of the MSB (C8=1) yields V=1 since (-128)+(-128)=-256 overflows signed 8-bit range.",
        },
        {
          id: "b",
          text: "y = 0x00, Z=1, N=0, C=1, V=0",
          explanation:
            "-128 + (-128) = -256 cannot fit in [-128, 127], so signed overflow V must be 1.",
        },
        {
          id: "c",
          text: "y = 0xFF, Z=0, N=1, C=0, V=1",
          explanation: "0x80 + 0x80 = 0x100, so the low 8 bits are 0x00, not 0xFF.",
        },
        {
          id: "d",
          text: "y = 0x80, Z=0, N=1, C=0, V=0",
          explanation: "0x80 + 0x80 equals 256 (0x100), not 128.",
        },
      ],
      correctAnswer: "a",
      hints: [
        "Compute 128 + 128 = 256 in 9 bits, then check whether -128 + (-128) = -256 overflows signed 8-bit range.",
      ],
      explanation:
        "In 9 bits, 0x80 + 0x80 = 0x100. The 8-bit sum is 0x00 (Z=1, N=0), carry-out is C=1, and carry into bit 7 (0) XOR carry out of bit 7 (1) sets V=1 because (-128)+(-128) = -256 overflows [-128, 127].",
      conceptTag: "alu-status-flags",
    },
    {
      id: "e2-q2",
      type: "math",
      difficulty: "intermediate",
      prompt:
        "Using the CPU Iron Law, a program executes $1.0 \\times 10^9$ instructions on a $2.0\\text{ GHz}$ multi-cycle processor with weighted average $\\text{CPI} = 3.6$. How many seconds does the program take to execute?",
      latex: "T_{\\text{exec}} = \\frac{N_{\\text{inst}} \\times \\text{CPI}}{f_{\\text{clk}}}",
      correctAnswer: 1.8,
      numericTolerance: 0.02,
      hints: [
        "Divide (1.0 x 10^9 * 3.6) cycles by 2.0 x 10^9 cycles/second.",
      ],
      explanation:
        "Total cycles = 1.0 x 10^9 * 3.6 = 3.6 x 10^9 cycles. At 2.0 x 10^9 Hz, execution time = 3.6 / 2.0 = 1.8 seconds.",
      conceptTag: "iron-law",
    },
    {
      id: "e2-q3",
      type: "true-false",
      difficulty: "intermediate",
      prompt:
        "True or False: A Modified Harvard processor eliminates the Von Neumann structural fetch-vs-data port conflict at L1 by using separate L1i and L1d caches while still allowing code and data to share unified outer L2/L3 caches and DRAM.",
      correctAnswer: true,
      hints: [
        "Recall how modern x86-64 and ARM64 CPUs bridge Harvard L1 ports and unified virtual/physical memory.",
      ],
      explanation:
        "True. Split L1i and L1d caches deliver simultaneous instruction fetch and data load/store bandwidth inside the core, while converging on a unified Von Neumann L2/L3/DRAM address space.",
      conceptTag: "modified-harvard",
    },
    {
      id: "e2-q4",
      type: "predict-output",
      difficulty: "rigorous",
      prompt:
        "Decode the 32-bit RISC-V I-type machine instruction `0x02A00513` (`imm[11:0] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]`, where `opcode=0010011` and `funct3=000` is `ADDI`). What assembly instruction is this?",
      options: [
        {
          id: "a",
          text: "addi x10, x0, 42",
          explanation:
            "Correct! 0x02A = 42, rs1 = 00000 (x0), funct3 = 000, rd = 01010 (x10), opcode = 0010011 (ADDI) — the canonical RISC-V `li a0, 42` pseudo-instruction!",
        },
        {
          id: "b",
          text: "addi x0, x10, 42",
          explanation:
            "Check bits [19:15] (rs1=0) and [11:7] (rd=10).",
        },
        {
          id: "c",
          text: "addi x10, x0, 21",
          explanation:
            "0x02A in hexadecimal equals 2*16 + 10 = 42, not 21.",
        },
        {
          id: "d",
          text: "add x10, x0, x42",
          explanation:
            "RISC-V only has 32 registers (x0..x31), and opcode 0010011 (0x13) is I-type ADDI.",
        },
      ],
      correctAnswer: "a",
      hints: [
        "Bits [31:20] are 0x02A = 42; bits [11:7] are 01010 = 10.",
      ],
      explanation:
        "Splitting 0x02A00513: imm[11:0] = 0x02A = 42, rs1 = x0, funct3 = 000, rd = x10, opcode = 0x13 (OP-IMM -> addi). That encodes `addi x10, x0, 42`.",
      conceptTag: "isa-encoding",
    },
    {
      id: "e2-q5",
      type: "debugging",
      difficulty: "rigorous",
      prompt:
        "An ARM64 assembly function `outer` receives an argument in `X0`, calls `inner`, and returns `inner(X0) + 1`, but hangs in an infinite loop upon `ret`. What is the bug?",
      codeSnippet: `outer:
    bl   inner
    add  x0, x0, #1
    ret`,
      codeLanguage: "asm",
      options: [
        {
          id: "a",
          text: "`bl inner` overwrote `X30` (Link Register) with `outer`'s next PC, so `ret` jumps back to `add x0, x0, #1` forever; `outer` must save and restore `X30` on the stack.",
          explanation:
            "Correct! Because `outer` is a non-leaf function, executing `bl inner` clobbers `X30` (LR). Saving `stp x29, x30, [sp, #-16]!` before `bl` and `ldp` before `ret` fixes the infinite loop.",
        },
        {
          id: "b",
          text: "`add x0, x0, #1` corrupts the stack pointer `SP`.",
          explanation: "`X0` is the return/argument register, not the stack pointer.",
        },
        {
          id: "c",
          text: "ARM64 requires `X0` to be saved as a callee-saved register.",
          explanation: "`X0` is caller-saved (argument and return register).",
        },
        {
          id: "d",
          text: "ARM64 `ret` pops the return address from `[sp]` automatically like x86-64.",
          explanation: "ARM64 `ret` branches to register `X30` (LR), not `[sp]`.",
        },
      ],
      correctAnswer: "a",
      hints: [
        "Which register does `bl` overwrite, and which register does `ret` jump to on ARM64?",
      ],
      explanation:
        "ARM64 `bl inner` writes `PC + 4` (`add x0, x0, #1`) into `X30`, erasing `outer`'s original caller return address. When `outer` executes `ret`, it jumps right back to `add x0, x0, #1` endlessly unless `X30` was preserved on the stack.",
      conceptTag: "abi-link-register",
    },
    {
      id: "e2-q6",
      type: "matching",
      difficulty: "intermediate",
      prompt:
        "Match each memory or cache hardware mechanism to its exact role.",
      matchingPairs: [
        {
          id: "m1",
          left: "1T1C DRAM Sense Amplifier",
          right: "Detects millivolt bitline swings and restores destructive capacitor reads",
        },
        {
          id: "m2",
          left: "6T SRAM Bitcell",
          right: "Cross-coupled inverter latch retaining bits without refresh cycles",
        },
        {
          id: "m3",
          left: "MESI Modified State",
          right: "Sole dirty cached copy; must intervene on peer BusRd and write back on eviction",
        },
        {
          id: "m4",
          left: "VIPT L1 Indexing",
          right: "Indexes cache sets using page-offset bits in parallel with TLB translation",
        },
      ],
      correctAnswer: {
        m1: "Detects millivolt bitline swings and restores destructive capacitor reads",
        m2: "Cross-coupled inverter latch retaining bits without refresh cycles",
        m3: "Sole dirty cached copy; must intervene on peer BusRd and write back on eviction",
        m4: "Indexes cache sets using page-offset bits in parallel with TLB translation",
      },
      hints: [
        "Distinguish DRAM destructive capacitor sensing from SRAM static latches, MESI dirty ownership, and VIPT parallel TLB lookup.",
      ],
      explanation:
        "1T1C DRAM relies on sense amplifiers to restore destructive reads; 6T SRAM holds bits statically; MESI Modified marks sole dirty ownership; VIPT keeps index bits within the untranslated page offset.",
      conceptTag: "memory-cache-synthesis",
    },
    {
      id: "e2-q7",
      type: "math",
      difficulty: "intermediate",
      prompt:
        "A 128 KiB, 8-way set-associative cache uses 64-byte cache lines on a 48-bit physical address space. How many bits wide is the **Set Index** field?",
      latex: "s = \\log_2\\!\\left(\\frac{128 \\times 1024}{8 \\times 64}\\right)",
      correctAnswer: 8,
      numericTolerance: 0,
      hints: [
        "Compute number of sets S = 131,072 / (8 * 64) = 256, then take log2(S).",
      ],
      explanation:
        "Total lines = 131,072 / 64 = 2048 lines. With 8 ways per set, S = 2048 / 8 = 256 sets. Therefore Set Index width s = log2(256) = 8 bits (with b = 6 offset bits and t = 34 tag bits).",
      conceptTag: "cache-geometry",
    },
    {
      id: "e2-q8",
      type: "multi-select",
      difficulty: "intermediate",
      prompt:
        "Which statements accurately describe NAND flash SSDs and NVMe storage controllers?",
      options: [
        {
          id: "a",
          text: "NAND flash programs at page granularity (4–16 KiB) but must erase at much larger block granularity (multi-MiB).",
          explanation: "Correct—this asymmetry forces out-of-place writes and Garbage Collection.",
        },
        {
          id: "b",
          text: "Issuing OS `TRIM`/`Deallocate` commands reduces Write Amplification Factor (WAF) by letting GC skip deleted blocks.",
          explanation: "Correct—knowing which pages are dead avoids useless valid-page copying.",
        },
        {
          id: "c",
          text: "NVMe limits hosts to a single 32-entry global command queue guarded by an OS mutex.",
          explanation: "Incorrect—that describes legacy SATA/AHCI; NVMe supports up to 64K queues with 64K depth each.",
        },
        {
          id: "d",
          text: "TLC (3 bits/cell) NAND requires distinguishing 8 distinct threshold-voltage levels using LDPC error correction.",
          explanation: "Correct—2^3 = 8 threshold windows with tight noise margins.",
        },
      ],
      correctAnswer: ["a", "b", "d"],
      hints: [
        "One option describes legacy SATA/AHCI instead of NVMe.",
      ],
      explanation:
        "NAND's page-program / block-erase asymmetry drives FTL out-of-place writes and GC, TRIM lowers WAF, TLC packs 2^3=8 states protected by LDPC ECC, and NVMe scales to 64K lockless per-core PCIe queues.",
      conceptTag: "nand-ftl-nvme",
    },
    {
      id: "e2-q9",
      type: "ordering",
      difficulty: "rigorous",
      prompt:
        "Arrange the lifecycle stages of an instruction inside a modern Out-of-Order Superscalar processor from earliest to latest.",
      orderingItems: [
        "Issue Queue wakes the uOp when physical source tags are ready and dispatches it to an execution port",
        "ROB retires the completed instruction strictly in original program order and frees the old physical register",
        "Frontend fetches instruction bytes, predicts branches, and decodes into uOps",
        "Rename unit maps architectural registers via RAT, allocates a PRF destination, and reserves a ROB tail slot",
      ],
      correctAnswer: [
        "Frontend fetches instruction bytes, predicts branches, and decodes into uOps",
        "Rename unit maps architectural registers via RAT, allocates a PRF destination, and reserves a ROB tail slot",
        "Issue Queue wakes the uOp when physical source tags are ready and dispatches it to an execution port",
        "ROB retires the completed instruction strictly in original program order and frees the old physical register",
      ],
      hints: [
        "Rename happens in-order right after Decode, Issue/Execute happens out-of-order, and ROB retirement happens in-order last.",
      ],
      explanation:
        "Instructions flow in-order through Fetch/Decode -> Rename/RAT/ROB allocation -> out-of-order Issue/Execute -> strict in-order ROB retirement.",
      conceptTag: "ooo-lifecycle",
    },
    {
      id: "e2-q10",
      type: "fill-blank",
      difficulty: "foundational",
      prompt:
        "What 3-letter acronym identifies the circular hardware queue in an Out-of-Order CPU that commits completed instructions strictly in program order to guarantee precise exceptions and clean speculative rollback?",
      correctAnswer: "ROB",
      acceptableAnswers: ["ROB", "Reorder Buffer"],
      hints: [
        "Stands for Reorder Buffer.",
      ],
      explanation:
        "The Reorder Buffer (ROB) tracks all in-flight micro-ops in original program order, decoupling out-of-order execution from precise, sequential retirement.",
      conceptTag: "reorder-buffer",
    },
  ],
};
