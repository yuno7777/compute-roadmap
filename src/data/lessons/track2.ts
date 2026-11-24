import type { Lesson } from "@/types/curriculum";

export const TRACK_2_LESSONS: Lesson[] = [
  // =========================================================================
  // LESSON 13: The Arithmetic Logic Unit & Register Datapaths
  // =========================================================================
  {
    id: "alu-and-data-paths",
    slug: "alu-and-data-paths",
    number: 13,
    title: "The Arithmetic Logic Unit & Register Datapaths",
    subtitle:
      "Combining combinational logic, two's complement adders, status flags, and multi-ported register files into a clocked computation loop.",
    trackId: "track-2",
    domainId: "computer-architecture",
    moduleTitle: "Module 5: Building a Stored-Program Processor",
    chapterTitle: "Chapter 5: Datapath, Control & ISAs",
    estimatedMinutes: 35,
    difficulty: "beginner",
    status: "complete",
    prerequisites: ["sequential-logic-flip-flops", "binary-hex-signed-integers"],
    objectives: [
      "Trace how an N-bit ALU unifies addition, two's complement subtraction, bitwise logic, and comparisons behind a shared output multiplexer.",
      "Derive the exact hardware Boolean equations for status flags Z (Zero), N (Negative), C (Carry), and V (Signed Overflow).",
      "Explain how a 2-read, 1-write register file closes the synchronous loop between combinational ALU computation and clocked state retention.",
      "Compute the maximum clock frequency of a register-to-ALU-to-register datapath from gate propagation, setup, and clock-to-Q delays.",
    ],
    depthExplanations: {
      beginner:
        "Think of the Arithmetic Logic Unit (ALU) as a calculator wired directly to a tiny desk of ultra-fast scratchpads called the register file. On every tick of the system clock, the CPU picks two numbers from the registers, sends them into the ALU, tells the ALU which operation to perform (add, subtract, AND, XOR), and saves the answer back into a destination register.\n\nAlongside the numeric answer, the ALU flips four tiny indicator lights—Zero, Negative, Carry, and Overflow—so the processor knows whether the result was zero or rolled past its bit limit. Those lights are how the CPU later decides whether an `if` statement is true or false.",
      intermediate:
        "An N-bit ALU is a purely combinational network composed of three parallel functional blocks—an adder/subtractor, a bitwise logic array, and a shifter/comparator—feeding a wide output multiplexer selected by `ALUOp` control lines. Rather than building separate hardware for subtraction, the ALU computes $A - B$ by bitwise-inverting $B$ (`~B`) and driving the adder's carry-in $C_0 = 1$, implementing two's complement negation $A + \\overline{B} + 1$.\n\nThe ALU connects to a multi-ported register file (typically two asynchronous read ports `Rs1`, `Rs2` and one synchronous rising-edge write port `Rd`). Because the register file reads are combinational (muxed from flip-flop or SRAM outputs) and writes occur strictly on the rising clock edge when `RegWrite = 1`, data can safely read from `R1`, traverse the ALU, and write back to `R1` in the same cycle without racing against itself.",
      advanced:
        "High-speed ALUs replace $O(N)$ ripple-carry chains with $O(\\log N)$ parallel-prefix adders (such as Kogge-Stone or Brent-Kung trees) and logarithmic barrel shifters so 64-bit integer operations complete inside a single sub-nanosecond clock cycle. Signed overflow is detected structurally without inspecting sign-bit truth tables via $V = C_{N-1} \\oplus C_N$, and signed less-than (`SLT`) evaluates $N \\oplus V$ rather than $N$ alone so negative wrap-around never misorders operands.\n\nIn the register-to-register datapath, timing closure requires $T_{\\text{clk}} \\ge t_{\\text{clk-to-Q}} + t_{\\text{RF-read}} + t_{\\text{ALU}} + t_{\\text{mux}} + t_{\\text{setup}}$. Notice that unsigned subtraction sets the Carry flag $C = 1$ when no borrow occurred ($A \\ge B$) on architectures that do not invert carry-out (ARM, 6502), whereas x86 inverts carry-out into a borrow flag ($CF = \\neg C_{\\text{out}}$)—a critical distinction when reading hardware status registers.",
    },
    intuition:
      "If Track 1's gates and flip-flops are individual gears and springs, the ALU + Register File is the first complete engine cylinder: registers hold state, combinational wires transform it during the clock period, and the rising clock edge commits the new state cleanly without corrupting the inputs mid-flight.",
    technicalTheory:
      "A processor datapath alternates between **sequential state elements** (edge-triggered registers) and **combinational compute networks** (the ALU and steering multiplexers). During a single clock cycle, source indices `Rs1` and `Rs2` select two $N$-bit words $A$ and $B$ from the register file. An input multiplexer can optionally swap $B$ for a sign-extended immediate constant before entering the ALU.\n\nInside the ALU, arithmetic unification relies on the two's complement identity for $N$-bit integers:\n$$A - B \\equiv A + (-B) = A + \\overline{B} + 1 \\pmod{2^N}$$\nBy placing an $N$-bit array of XOR gates controlled by a single `Sub` bit in front of the $B$ input ($B' = B \\oplus \\text{Sub}$) and tying the adder's initial carry-in to $C_0 = \\text{Sub}$, one adder circuit performs both $A + B$ (`Sub = 0`) and $A - B$ (`Sub = 1`).\n\nEvery arithmetic result $R = R_{N-1}\\dots R_0$ drives four canonical status flags:\n- **Zero ($Z$):** $Z = 1 \\iff R = 0$, computed via an $N$-input NOR tree.\n- **Negative ($N$):** $N = R_{N-1}$ (the two's complement sign bit).\n- **Carry ($C$):** $C = C_N$, the carry-out bit from the most significant full adder. For unsigned addition, $C = 1$ signals unsigned overflow ($A + B \\ge 2^N$).\n- **Overflow ($V$):** $V = C_{N-1} \\oplus C_N$, which equals $1$ if and only if two same-sign operands produce an opposite-sign two's complement result.\n\nCrucially, signed comparison $A <_{\\text{signed}} B$ cannot simply test the sign bit $N$ of $A - B$: if $A = -128$ and $B = +1$ in 8-bit two's complement, $A - B = -129 \\equiv +127$ wraps positive ($N = 0$, $V = 1$). Evaluating $N \\oplus V = 0 \\oplus 1 = 1$ yields the mathematically exact signed comparison.",
    mechanisms: [
      {
        step: 1,
        title: "Register File Read Selection",
        detail:
          "Source addresses Rs1 and Rs2 drive combinational read multiplexers inside the register file, placing stored N-bit values onto Bus A and Bus B shortly after the previous clock edge.",
        stateNote: "A = RF[Rs1], B = RF[Rs2] (valid after t_clk-q + t_RF-read)",
      },
      {
        step: 2,
        title: "Operand Conditioning & Negation",
        detail:
          "If ALUSrc selects an immediate or if ALUOp specifies subtraction/comparison, B passes through a mux and conditional XOR inverter (B' = ~B, Cin = 1).",
        stateNote: "B' = B XOR Sub, C0 = Sub",
      },
      {
        step: 3,
        title: "Parallel Combinational Evaluation",
        detail:
          "The adder tree, bitwise AND/OR/XOR array, and barrel shifter all compute their outputs simultaneously while the ALU control mux selects which result drives the output bus Y.",
        stateNote: "Y = MUX(ALUOp, Sum, A&B, A|B, A^B, SLT)",
      },
      {
        step: 4,
        title: "Status Flag Generation",
        detail:
          "A wide NOR gate checks Y == 0 for Z, bit N-1 supplies N, the adder MSB yields C, and C_{N-1} XOR C_N yields signed overflow V.",
        stateNote: "Flags = {Z, N, C, V} settle within critical path",
      },
      {
        step: 5,
        title: "Clocked Writeback",
        detail:
          "Before the next rising clock edge (meeting t_setup), Y arrives at the register file write port. If RegWrite=1 and Rd != 0 (on RISC-V/ARM64), the clock edge latches Y into RF[Rd].",
        stateNote: "On rising clk edge: if (RegWrite) RF[Rd] <= Y",
      },
    ],
    mathNotes: [
      {
        title: "Signed Overflow Detection",
        latex: "V = C_{N-1} \\oplus C_N = (A_{N-1} \\land B'_{N-1} \\land \\overline{R_{N-1}}) \\lor (\\overline{A_{N-1}} \\land \\overline{B'_{N-1}} \\land R_{N-1})",
        explanation:
          "Signed two's complement overflow happens only when two positive numbers sum to a negative bit pattern or two negative numbers sum to a non-negative bit pattern—equivalently, when the carry into the sign bit differs from the carry out of it.",
      },
      {
        title: "Datapath Clock Period Constraint",
        latex: "f_{\\max} = \\frac{1}{T_{\\min}}, \\qquad T_{\\min} = t_{\\text{clk-to-Q}} + t_{\\text{RF-read}} + t_{\\text{ALU}} + t_{\\text{setup}}",
        explanation:
          "The clock frequency of the datapath is bounded by the worst-case propagation delay from a register output through the ALU back to a register input, plus flip-flop setup time.",
      },
    ],
    simulatorId: "alu-register",
    simulatorPrompt:
      "Open the ALU & Register File Datapath simulator. Load 0x7F (127) and 0x01 (1) into Rs1 and Rs2, execute ADD, and verify that V=1 while C=0. Then execute SUB on two equal values to observe Z=1 and C=1 (no borrow).",
    diagram: {
      title: "Register-to-ALU-to-Register Datapath",
      caption:
        "Two read ports feed the ALU combinational network; results and status flags flow back synchronously on the rising clock edge.",
      nodes: [
        {
          id: "rf",
          label: "Register File (R0..R7)",
          sublabel: "2R / 1W Ports",
          x: 40,
          y: 110,
          tone: "accent",
        },
        {
          id: "mux_b",
          label: "ALUSrc Mux",
          sublabel: "Rs2 vs Imm",
          x: 240,
          y: 185,
          tone: "neutral",
        },
        {
          id: "alu",
          label: "N-Bit ALU",
          sublabel: "Add/Sub, Logic, Shift",
          x: 420,
          y: 100,
          tone: "emerald",
        },
        {
          id: "flags",
          label: "Status Register",
          sublabel: "Z, N, C, V Flags",
          x: 620,
          y: 35,
          tone: "amber",
        },
        {
          id: "wb",
          label: "Writeback Bus",
          sublabel: "RegWrite @ Clk Edge",
          x: 620,
          y: 185,
          tone: "accent",
        },
      ],
      edges: [
        { from: "rf", to: "alu", label: "Bus A (Rs1)" },
        { from: "rf", to: "mux_b", label: "Bus B (Rs2)" },
        { from: "mux_b", to: "alu", label: "Operand B'" },
        { from: "alu", to: "flags", label: "Z, N, C, V" },
        { from: "alu", to: "wb", label: "Result Y" },
        { from: "wb", to: "rf", label: "Rd Writeback" },
      ],
    },
    codeExamples: [
      {
        title: "Parameterized 8-Bit ALU with Z/N/C/V Flags (Verilog)",
        language: "verilog",
        code: `module alu8 (
  input  logic [7:0] a, b,
  input  logic [2:0] alu_op, // 000:ADD 001:SUB 010:AND 011:OR 100:XOR 101:SLT
  output logic [7:0] y,
  output logic       z, n, c, v
);
  logic [7:0] b_eff;
  logic [8:0] sum_ext;
  logic       is_sub;

  assign is_sub  = (alu_op == 3'b001) || (alu_op == 3'b101);
  assign b_eff   = is_sub ? ~b : b;
  assign sum_ext = {1'b0, a} + {1'b0, b_eff} + {8'b0, is_sub};

  always_comb begin
    c = 1'b0;
    v = 1'b0;
    case (alu_op)
      3'b000, 3'b001: begin
        y = sum_ext[7:0];
        c = sum_ext[8];
        v = (a[7] == b_eff[7]) && (y[7] != a[7]);
      end
      3'b010: y = a & b;
      3'b011: y = a | b;
      3'b100: y = a ^ b;
      3'b101: begin
        logic slt_v;
        slt_v = (a[7] == b_eff[7]) && (sum_ext[7] != a[7]);
        y = {7'b0, (sum_ext[7] ^ slt_v)};
      end
      default: y = 8'h00;
    endcase
    z = (y == 8'h00);
    n = y[7];
  end
endmodule`,
        explanation:
          "Using 9-bit extended addition {1'b0, a} + {1'b0, b_eff} + is_sub captures the exact MSB carry-out in sum_ext[8]. Signed overflow v checks whether two same-sign effective operands yielded an inverted sign bit.",
        output: `ADD 0x7F, 0x01 -> y=0x80 (-128), Z=0, N=1, C=0, V=1
ADD 0xFF, 0x01 -> y=0x00 (   0), Z=1, N=0, C=1, V=0
SUB 0x05, 0x05 -> y=0x00 (   0), Z=1, N=0, C=1, V=0
SLT 0x80, 0x01 -> y=0x01 (true: -128 < 1 via N^V = 0^1 = 1)`,
      },
      {
        title: "C Simulation of Register File + ALU Flag Semantics",
        language: "c",
        code: `#include <stdint.h>
#include <stdio.h>

typedef struct { uint8_t y, z, n, c, v; } AluOut;

AluOut alu_add8(uint8_t a, uint8_t b, uint8_t sub) {
    uint8_t b_eff = sub ? (uint8_t)~b : b;
    uint16_t wide = (uint16_t)a + (uint16_t)b_eff + sub;
    uint8_t y = (uint8_t)(wide & 0xFF);
    return (AluOut){
        .y = y,
        .z = (y == 0),
        .n = (y >> 7) & 1,
        .c = (wide >> 8) & 1,
        .v = ((a ^ y) & (b_eff ^ y) & 0x80) != 0
    };
}

int main(void) {
    AluOut r1 = alu_add8(0x7F, 0x01, 0); // +127 + 1
    AluOut r2 = alu_add8(0x03, 0x05, 1); // 3 - 5
    printf("0x7F+0x01 => y=0x%02X Z=%u N=%u C=%u V=%u\\n", r1.y, r1.z, r1.n, r1.c, r1.v);
    printf("0x03-0x05 => y=0x%02X Z=%u N=%u C=%u V=%u\\n", r2.y, r2.z, r2.n, r2.c, r2.v);
    return 0;
}`,
        explanation:
          "Bit-level test ((a ^ y) & (b_eff ^ y) & 0x80) is an equivalent branchless formula for signed overflow V: the result bit 7 differs from both A[7] and B_eff[7].",
        output: `0x7F+0x01 => y=0x80 Z=0 N=1 C=0 V=1
0x03-0x05 => y=0xFE Z=0 N=1 C=0 V=0`,
      },
    ],
    connections: [
      {
        lessonSlug: "sequential-logic-flip-flops",
        relationship:
          "Builds directly on rising-edge D flip-flops to create the clocked register file and prevent combinational feedback races.",
      },
      {
        lessonSlug: "binary-hex-signed-integers",
        relationship:
          "Implements two's complement negation and signed vs. unsigned overflow detection directly in adder hardware.",
      },
      {
        lessonSlug: "control-unit-fetch-decode-execute",
        relationship:
          "The next lesson adds a Program Counter, memory, and Control Unit around this ALU + register file to execute stored programs.",
      },
    ],
    realWorldApplications: [
      {
        title: "Parallel-Prefix 64-Bit Adders vs. Ripple-Carry",
        simplifiedVsReal:
          "Textbook 8-bit ALUs often illustrate ripple-carry chains whose delay scales linearly as O(N). Real 64-bit CPUs cannot wait for 64 serial carry stages at 4+ GHz, so they build logarithmic Kogge-Stone or Han-Carlson prefix trees.",
        modernExample:
          "Modern x86-64 (Intel Raptor Cove / AMD Zen 5) and Apple Silicon M-series integer execution ports complete 64-bit add, sub, logic, and shift operations in a single ~200–250 ps clock cycle.",
      },
      {
        title: "Multi-Ported & Banked Physical Register Files",
        simplifiedVsReal:
          "A classroom datapath uses a simple 2-read, 1-write (2R1W) array for 8–32 registers. Wide out-of-order superscalar cores require 8–16 simultaneous reads and 4–6 writes per cycle across 200+ physical registers.",
        modernExample:
          "High-performance cores split the Physical Register File into multi-banked or replicated SRAM arrays paired with dedicated bypass networks to keep area and wire capacitance manageable.",
      },
    ],
    misconceptions: [
      {
        myth: "Carry (C) and Overflow (V) mean the same thing.",
        reality:
          "Carry (C) detects unsigned range overflow (0..255 in 8 bits), whereas Overflow (V) detects signed two's complement overflow (-128..127). Adding 0xFF + 0x01 gives C=1, V=0 (255+1 wraps unsigned, -1+1=0 is valid signed), whereas 0x7F + 0x01 gives C=0, V=1.",
      },
      {
        myth: "The ALU stores the result of an operation inside itself.",
        reality:
          "An ALU is purely combinational and stateless—it only holds an output while its inputs remain stable. Sequential registers (the register file and status flags register) hold state across clock cycles.",
      },
      {
        myth: "Comparing two signed numbers can be done by subtracting them and checking only the Negative flag (N).",
        reality:
          "If subtraction overflows in two's complement, the sign bit flips! Correct signed less-than requires N XOR V.",
      },
    ],
    deepDive: {
      title: "Why Subtraction Uses C=1 When There Is No Borrow",
      content:
        "In raw adder hardware executing $A + \\overline{B} + 1$, the mathematical sum is $A + (2^N - 1 - B) + 1 = A - B + 2^N$. Notice the $+2^N$ term! Whenever $A \\ge B$ (meaning no borrow is needed), $A - B \\ge 0$, so the $N$-bit adder produces a total $\\ge 2^N$ and generates carry-out $C_N = 1$. Conversely, when $A < B$ (a borrow is required), $A - B + 2^N < 2^N$, so $C_N = 0$.\n\nARM, RISC-V, and 6502 expose this raw non-inverted adder carry ($C = C_N$, meaning $C = 1$ = no borrow), whereas x86 and MIPS/Z80 invert $C_N$ on subtraction so that the Carry Flag acts as a Borrow Flag ($CF = \\overline{C_N} = 1$ when $A < B$). Knowing which convention an ISA uses is essential when inspecting flags after `CMP` or chaining multi-precision `ADC`/`SBB` arithmetic.",
    },
    revisionNotes: [
      "Two's complement subtraction reuses the adder via B' = ~B and Cin = 1 (A - B = A + ~B + 1).",
      "Status flags: Z=1 iff result is 0; N=MSB; C=adder carry-out; V = C_{N-1} XOR C_N.",
      "Signed comparison A < B evaluates N XOR V, not N alone, to handle signed overflow.",
      "A 2R1W register file reads asynchronously onto Bus A/B and writes synchronously on the rising clock edge.",
      "Minimum clock period T_min >= t_clk-to-Q + t_RF-read + t_ALU + t_setup.",
    ],
    glossaryTermIds: ["alu", "status-flags", "register-file"],
    references: [
      {
        title: "From Nand to Tetris: Project 2 & 3 (ALU & Sequential Chips)",
        author: "Noam Nisan & Shimon Schocken",
        url: "https://www.nand2tetris.org/course",
        type: "course",
        note: "Hands-on construction of the Hack ALU and register hierarchy from NAND gates.",
      },
      {
        title: "Computer Organization and Design RISC-V Edition (Chapter 4 & Appendix A)",
        author: "David A. Patterson & John L. Hennessy",
        url: "https://www.elsevier.com/books/computer-organization-and-design-risc-v-edition/patterson/978-0-12-820331-6",
        type: "book",
        note: "Standard textbook treatment of ALU construction, carry-lookahead, and datapath timing.",
      },
      {
        title: "UC Berkeley CS61C: Great Ideas in Computer Architecture",
        author: "Dan Garcia & Justin Yokota",
        url: "https://cs61c.org/",
        type: "course",
        note: "Lectures and labs covering single-cycle datapaths, register files, and RISC-V execution.",
      },
    ],
    assessments: [
      {
        id: "l13-q1",
        type: "predict-output",
        difficulty: "intermediate",
        prompt:
          "An 8-bit non-inverted-carry ALU computes `SUB A=0x03, B=0x05` (using `A + ~B + 1`). What are the resulting 8-bit value and status flags `(Z, N, C, V)`?",
        options: [
          {
            id: "a",
            text: "y = 0xFE, Z=0, N=1, C=0, V=0",
            explanation:
              "Correct! 3 + (~5) + 1 = 3 + 250 + 1 = 254 (0xFE = -2). Bit 7 is 1 (N=1), result is nonzero (Z=0), sum < 256 so raw carry-out C=0 (borrow occurred), and 3 - 5 = -2 fits in [-128, 127] so V=0.",
          },
          {
            id: "b",
            text: "y = 0xFE, Z=0, N=1, C=1, V=1",
            explanation:
              "Raw adder carry-out C=0 when A < B (borrow occurred), and -2 does not overflow signed 8-bit range.",
          },
          {
            id: "c",
            text: "y = 0x02, Z=0, N=0, C=1, V=0",
            explanation:
              "0x02 would be 5 - 3, not 3 - 5.",
          },
          {
            id: "d",
            text: "y = 0xFE, Z=0, N=1, C=0, V=1",
            explanation:
              "3 - 5 = -2 is well within [-128, 127], so signed overflow V is 0.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Compute ~0x05 = 0xFA (250), then add 0x03 + 0xFA + 1 in 9 bits.",
          "Check if -2 is representable in signed 8-bit two's complement [-128, 127].",
        ],
        explanation:
          "In 9-bit arithmetic, 3 + 250 + 1 = 254 (0x0FE). The 8-bit result is 0xFE (-2), N=1, Z=0, carry-out bit 8 is C=0 (indicating borrow because 3 < 5), and signed overflow V=0 because -2 fits in 8-bit two's complement.",
        conceptTag: "status-flags",
      },
      {
        id: "l13-q2",
        type: "mcq",
        difficulty: "rigorous",
        prompt:
          "When implementing `SLT` (Set Less Than for signed two's complement integers `A < B`) using `A - B`, why must the ALU compute `N XOR V` instead of checking `N` alone?",
        options: [
          {
            id: "a",
            text: "Because unsigned subtraction sets C=1, which shifts the sign bit.",
            explanation:
              "Carry C does not alter the sum bits or sign bit N.",
          },
          {
            id: "b",
            text: "Because signed overflow flips the sign bit of the difference, inverting N when A - B exceeds [-2^(N-1), 2^(N-1)-1].",
            explanation:
              "Correct! For example, in 8-bit signed math, -100 < +50 is true, yet -100 - 50 = -150 wraps to +106 (N=0, V=1), so N XOR V = 0 XOR 1 = 1.",
          },
          {
            id: "c",
            text: "Because the Zero flag Z overrides N whenever A and B have opposite signs.",
            explanation:
              "Z is only 1 when A equals B; opposite-sign operands cannot yield 0 on subtraction.",
          },
          {
            id: "d",
            text: "Because two's complement lacks a unique representation for -1.",
            explanation:
              "Two's complement has a unique representation for every integer in range, including -1 (all 1s).",
          },
        ],
        correctAnswer: "b",
        hints: [
          "Test A = -100 and B = +50 in 8-bit signed arithmetic.",
        ],
        explanation:
          "When subtracting two opposite-sign numbers overflows the N-bit two's complement range, the true mathematical sign of A - B is the opposite of bit N-1 of the wrapped result. XORing N with V recovers the true sign.",
        conceptTag: "twos-complement-comparison",
      },
      {
        id: "l13-q3",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A register-to-ALU-to-register datapath has $t_{\\text{clk-to-Q}} = 40\\text{ ps}$, $t_{\\text{RF-read}} = 90\\text{ ps}$, $t_{\\text{ALU}} = 220\\text{ ps}$, $t_{\\text{mux}} = 20\\text{ ps}$, and $t_{\\text{setup}} = 30\\text{ ps}$. What is the maximum clock frequency in GHz?",
        latex: "f_{\\max} = \\frac{1}{t_{\\text{clk-to-Q}} + t_{\\text{RF-read}} + t_{\\text{ALU}} + t_{\\text{mux}} + t_{\\text{setup}}}",
        correctAnswer: 2.5,
        numericTolerance: 0.05,
        hints: [
          "Sum all five delays in picoseconds to get T_min.",
          "Convert T_min in picoseconds to GHz using f = 1000 / T_min(ps).",
        ],
        explanation:
          "Total critical path delay is 40 + 90 + 220 + 20 + 30 = 400 ps = 0.4 ns. Thus f_max = 1 / (0.4 x 10^-9 s) = 2.5 GHz.",
        conceptTag: "datapath-timing",
      },
      {
        id: "l13-q4",
        type: "ordering",
        difficulty: "foundational",
        prompt:
          "Order the steps of a single `ADD R3, R1, R2` operation from earliest to latest within one clock cycle.",
        orderingItems: [
          "ALU computes R1 + R2 and stabilizes status flags",
          "Rising clock edge latches result into R3",
          "Register file read ports place R1 and R2 onto buses A and B",
          "Writeback bus routes ALU output Y to register file write data input",
        ],
        correctAnswer: [
          "Register file read ports place R1 and R2 onto buses A and B",
          "ALU computes R1 + R2 and stabilizes status flags",
          "Writeback bus routes ALU output Y to register file write data input",
          "Rising clock edge latches result into R3",
        ],
        hints: [
          "Combinational propagation starts from register reads and ends at the register write setup before the rising clock edge.",
        ],
        explanation:
          "First the register file outputs R1 and R2; the combinational ALU evaluates the sum and flags; the result travels over the writeback bus to satisfy t_setup; finally the next rising clock edge commits the value into R3.",
        conceptTag: "datapath-cycle",
      },
    ],
  },

  // =========================================================================
  // LESSON 14: Control Units & the Fetch-Decode-Execute Cycle
  // =========================================================================
  {
    id: "control-unit-fetch-decode-execute",
    slug: "control-unit-fetch-decode-execute",
    number: 14,
    title: "Control Units & the Fetch-Decode-Execute Cycle",
    subtitle:
      "How the Program Counter, Instruction Register, and Control Unit orchestrate stored programs across single-cycle and multi-cycle FSM datapaths.",
    trackId: "track-2",
    domainId: "computer-architecture",
    moduleTitle: "Module 5: Building a Stored-Program Processor",
    chapterTitle: "Chapter 5: Datapath, Control & ISAs",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["alu-and-data-paths"],
    objectives: [
      "Trace every register and bus transfer across Fetch, Decode, Execute, Memory, and Writeback phases.",
      "Distinguish single-cycle datapaths from multi-cycle FSM datapaths and compute their effective CPI and execution time.",
      "Compare hardwired combinational/FSM control decoders with microprogrammed ROM control stores.",
      "Show how conditional branches and jumps update the Program Counter (PC) via status flags and target adders.",
    ],
    depthExplanations: {
      beginner:
        "Having an ALU and registers is like having a kitchen with pans and ingredients—you still need a chef reading the recipe one line at a time. The Control Unit is that chef. It keeps a bookmark called the Program Counter (PC) pointing to the current instruction in memory, fetches that instruction into the Instruction Register (IR), figures out what the bits mean, flips the right switches (multiplexers and write enables) for the ALU and memory, and advances the bookmark to the next instruction.",
      intermediate:
        "The Fetch-Decode-Execute (FDE) cycle turns passive machine-code bytes into coordinated hardware action. During **Fetch**, the PC drives memory read to load the instruction word into the IR while a dedicated adder computes `PC + 4`. During **Decode**, the Control Unit inspects the `opcode` and `funct` fields to assert datapath signals (`RegWrite`, `ALUSrc`, `MemRead`, `MemWrite`, `MemToReg`, `Branch`) while the register file speculatively reads `Rs1` and `Rs2`.\n\nIn a **single-cycle** CPU, all phases complete in one long clock cycle whose period is dictated by the slowest instruction (`load`). In a **multi-cycle** CPU, a finite-state machine sequences Fetch, Decode, Execute, Memory, and Writeback across shorter clock ticks so fast instructions (like branches in 3 cycles or ALU ops in 4 cycles) finish early while reusing a single ALU and memory port.",
      advanced:
        "In multi-cycle designs, control generation bifurcates into **hardwired control** (synthesizing next-state logic and control outputs directly as minimized Boolean gates/PLAs) and **microprogrammed control** (storing wide microinstruction control words in an internal Control Store ROM addressed by a micro-PC sequencer). Hardwired control minimizes decode latency for regular RISC ISAs, whereas microprogramming enables arbitrarily complex CISC instructions, loop-based string moves, and field-updatable microcode patches.\n\nEvaluating architectures requires the classic Iron Law of Processor Performance: $T_{\\text{exec}} = N_{\\text{inst}} \\times \\text{CPI} \\times T_{\\text{clk}}$. A single-cycle machine achieves $\\text{CPI} = 1$ at a high $T_{\\text{clk}}$, whereas a non-pipelined multi-cycle machine lowers $T_{\\text{clk}}$ by ~4–5x at the cost of $\\text{CPI} \\approx 3.5\\text{–}4.5$, motivating pipelining in Lesson 21 to achieve both low $T_{\\text{clk}}$ and $\\text{CPI} \\approx 1$.",
    },
    intuition:
      "A machine-code instruction is not a script interpreted by software—its bits are literal electrical switch settings. The Control Unit simply translates each opcode bit pattern into the exact `0` and `1` control wires that steer multiplexers, select ALU operations, and enable register or memory writes.",
    technicalTheory:
      "To execute a stored program automatically, the processor augments the ALU and register file with a **Program Counter (`PC`)**, an **Instruction Register (`IR`)**, memory interface registers (or separate instruction/data ports), and a **Control Unit**.\n\nIn a canonical 5-phase multi-cycle execution model:\n1. **Instruction Fetch (IF):** The `PC` addresses memory (`MemRead = 1, IorD = 0`). The returned instruction word latches into `IR`, and the ALU computes `PC + 4` (`ALUSrcA = 0, ALUSrcB = 01, ALUOp = ADD`), storing it back into `PC`.\n2. **Instruction Decode & Register Fetch (ID):** The Control Unit decodes `IR[6:0]` (`opcode`). Concurrently, `Rs1` and `Rs2` read into temporary latches `A` and `B`, and the ALU precomputes the potential branch target `PC + sign_ext(imm) << 1` into `ALUOut`.\n3. **Execute / Address Calculation (EX):** For R-type/I-type arithmetic, the ALU operates on `A` and `B` (or immediate). For memory loads/stores, the ALU computes effective address `A + offset`. For conditional branches, the ALU subtracts `A - B` and checks the `Zero` flag (or comparison flag) to conditionally write `ALUOut` to `PC`.\n4. **Memory Access (MEM):** Loads read `Mem[ALUOut]` into the Memory Data Register (`MDR`); stores write `B` to `Mem[ALUOut]`.\n5. **Writeback (WB):** `RegWrite = 1` latches `ALUOut` (for ALU ops) or `MDR` (for loads) into `RF[Rd]`.\n\nPerformance comparison uses the Iron Law:\n$$T_{\\text{program}} = N_{\\text{instructions}} \\times \\text{CPI} \\times \\frac{1}{f_{\\text{clk}}}$$\nWith instruction mix frequencies $f_i$ and per-class cycle counts $c_i$, average CPI is $\\text{CPI} = \\sum_i f_i c_i$.",
    mechanisms: [
      {
        step: 1,
        title: "IF: Fetch Instruction & Increment PC",
        detail:
          "PC supplies the instruction address to memory; the instruction word latches into IR while PC advances to PC + 4 (or PC + word_size).",
        stateNote: "IR <= Mem[PC]; PC <= PC + 4",
      },
      {
        step: 2,
        title: "ID: Opcode Decode & Speculative Register Read",
        detail:
          "The Control Unit inspects IR's opcode bits to set control signals; simultaneously Rs1/Rs2 read into latches A/B and branch target is computed.",
        stateNote: "A <= RF[IR.rs1]; B <= RF[IR.rs2]; Target <= PC + imm",
      },
      {
        step: 3,
        title: "EX: ALU Operation or Address/Branch Resolution",
        detail:
          "The ALU executes the arithmetic op, computes base + offset for memory instructions, or tests branch condition flags to override PC.",
        stateNote: "ALUOut <= ALU(A, B_or_imm); if (Branch && Cond) PC <= Target",
      },
      {
        step: 4,
        title: "MEM: Data Memory Read or Write",
        detail:
          "Only load/store instructions enter this phase: loads fetch data into MDR; stores assert MemWrite to update memory at ALUOut.",
        stateNote: "Load: MDR <= Mem[ALUOut] | Store: Mem[ALUOut] <= B",
      },
      {
        step: 5,
        title: "WB: Commit Result to Destination Register",
        detail:
          "RegWrite asserts on the rising clock edge, storing ALUOut or MDR into RF[Rd], and the Control Unit FSM returns to IF.",
        stateNote: "RF[IR.rd] <= MemToReg ? MDR : ALUOut; State <= IF",
      },
    ],
    mathNotes: [
      {
        title: "The CPU Performance (Iron Law) Equation",
        latex: "T_{\\text{exec}} = N_{\\text{inst}} \\times \\left(\\sum_{k} f_k \\cdot \\text{CPI}_k\\right) \\times T_{\\text{clk}}",
        explanation:
          "Program execution time is the product of dynamic instruction count, weighted-average cycles per instruction (CPI), and clock cycle period. Lowering one factor often trades off against another.",
      },
      {
        title: "Single-Cycle vs. Multi-Cycle Critical Path",
        latex: "T_{\\text{single}} = t_{\\text{IF}} + t_{\\text{ID}} + t_{\\text{EX}} + t_{\\text{MEM}} + t_{\\text{WB}}, \\qquad T_{\\text{multi}} = \\max(t_{\\text{IF}}, t_{\\text{ID}}, t_{\\text{EX}}, t_{\\text{MEM}}, t_{\\text{WB}}) + t_{\\text{latch}}",
        explanation:
          "A single-cycle CPU must stretch its clock period to fit the longest instruction end-to-end, whereas a multi-cycle CPU only has to fit the single slowest stage plus latch overhead.",
      },
    ],
    simulatorId: "cpu-fde",
    simulatorPrompt:
      "Open the Fetch-Decode-Execute CPU Simulator and load the 'Sum 1..5' program. Step through each phase (FETCH -> DECODE -> EXECUTE -> WRITEBACK) and watch IR, PC, and the loop counter register update until the conditional branch exits.",
    diagram: {
      title: "Control Unit & Multi-Cycle FDE Datapath",
      caption:
        "The Control FSM reads the Instruction Register opcode and drives datapath multiplexers and write enables phase by phase.",
      nodes: [
        {
          id: "pc",
          label: "Program Counter (PC)",
          sublabel: "Next Inst Address",
          x: 40,
          y: 120,
          tone: "accent",
        },
        {
          id: "mem",
          label: "Unified Memory",
          sublabel: "Instructions + Data",
          x: 230,
          y: 120,
          tone: "neutral",
        },
        {
          id: "ir",
          label: "Instruction Register",
          sublabel: "Opcode + Operands",
          x: 420,
          y: 45,
          tone: "amber",
        },
        {
          id: "ctrl",
          label: "Control Unit FSM",
          sublabel: "IF -> ID -> EX -> MEM -> WB",
          x: 420,
          y: 205,
          tone: "amber",
        },
        {
          id: "dp",
          label: "RF + ALU Datapath",
          sublabel: "Execute & Writeback",
          x: 630,
          y: 120,
          tone: "emerald",
        },
      ],
      edges: [
        { from: "pc", to: "mem", label: "Addr (IF)" },
        { from: "mem", to: "ir", label: "Inst Word" },
        { from: "ir", to: "ctrl", label: "Opcode" },
        { from: "ctrl", to: "dp", label: "ALUOp, RegWrite" },
        { from: "ctrl", to: "pc", label: "PCWrite / PCSrc" },
        { from: "dp", to: "pc", label: "Branch Target" },
      ],
    },
    codeExamples: [
      {
        title: "Tracing Sum 1..5 in Miniature RISC Assembly",
        language: "asm",
        code: `; Compute R1 = 1 + 2 + 3 + 4 + 5 using R2 as counter
0x00: MOVI R1, 0       ; R1 = 0 (accumulator)
0x04: MOVI R2, 5       ; R2 = 5 (loop counter)
0x08: ADD  R1, R1, R2  ; loop: R1 += R2
0x0C: SUBI R2, R2, 1   ; R2 -= 1 (updates Z flag)
0x10: BNZ  0x08        ; if Z==0, PC = 0x08; else PC = 0x14
0x14: HALT             ; done`,
        explanation:
          "Each loop iteration executes ADD, SUBI, and BNZ. When R2 decrements from 1 to 0, SUBI sets Z=1, causing BNZ to fall through to 0x14 instead of jumping back to 0x08.",
        output: `Init: PC=0x00 R1=0 R2=5
Iter 1 (after 0x10): R1=5,  R2=4, Z=0 -> PC=0x08
Iter 2 (after 0x10): R1=9,  R2=3, Z=0 -> PC=0x08
Iter 3 (after 0x10): R1=12, R2=2, Z=0 -> PC=0x08
Iter 4 (after 0x10): R1=14, R2=1, Z=0 -> PC=0x08
Iter 5 (after 0x10): R1=15, R2=0, Z=1 -> PC=0x14 (HALT)`,
      },
      {
        title: "Hardwired Multi-Cycle Control FSM (Verilog)",
        language: "verilog",
        code: `typedef enum logic [2:0] {S_IF, S_ID, S_EX, S_MEM, S_WB} state_t;

always_ff @(posedge clk or posedge reset) begin
  if (reset) state <= S_IF;
  else case (state)
    S_IF:  state <= S_ID;
    S_ID:  state <= S_EX;
    S_EX:  state <= (is_branch) ? S_IF : ((is_load || is_store) ? S_MEM : S_WB);
    S_MEM: state <= (is_load) ? S_WB : S_IF; // stores finish at MEM
    S_WB:  state <= S_IF;
    default: state <= S_IF;
  endcase
end`,
        explanation:
          "Notice variable cycle counts per instruction class: branches finish in 3 cycles (IF, ID, EX), ALU and store instructions finish in 4 cycles, and loads require all 5 cycles.",
        output: `Branch: IF -> ID -> EX -> IF (3 cycles)
R-type: IF -> ID -> EX -> WB -> IF (4 cycles)
Store:  IF -> ID -> EX -> MEM -> IF (4 cycles)
Load:   IF -> ID -> EX -> MEM -> WB -> IF (5 cycles)`,
      },
    ],
    connections: [
      {
        lessonSlug: "alu-and-data-paths",
        relationship:
          "Uses the ALU and register file built in Lesson 13 and adds the PC, IR, and FSM Control Unit to drive them.",
      },
      {
        lessonSlug: "von-neumann-vs-harvard",
        relationship:
          "Examines the memory bottleneck revealed during IF and MEM when instructions and data share one port.",
      },
      {
        lessonSlug: "pipelining-hazards-branch-prediction",
        relationship:
          "Multi-cycle IF/ID/EX/MEM/WB phases become the 5 parallel hardware stages of a pipelined processor.",
      },
    ],
    realWorldApplications: [
      {
        title: "Single-Cycle Classroom Core vs. Multi-Cycle Embedded Cores",
        simplifiedVsReal:
          "Textbook single-cycle cores run at CPI=1 but waste energy and clock headroom because fast instructions wait for the slowest memory load path. Real low-power microcontrollers (like small Cortex-M0+ or RV32EC cores) use 2–3 stage pipelines or multi-cycle FSMs to save gates and power.",
        modernExample:
          "ARM Cortex-M0+ uses a compact 2-stage fetch/execute pipeline with hardwired Thumb-2 decoding, achieving minimal silicon area (<12k gates) for IoT sensors.",
      },
      {
        title: "Hardwired RISC Decoders vs. x86 Microcode ROM",
        simplifiedVsReal:
          "A textbook control unit is either purely hardwired or purely microcoded. Modern x86-64 CPUs combine both: 95% of common instructions decode via fast hardwired logic into 1–2 micro-ops, while rare/complex instructions trap to an on-die Microcode Sequencer ROM (MSROM).",
        modernExample:
          "Intel and AMD distribute signed microcode updates via BIOS/OS boot (`microcode.bin`) to patch CPU errata and speculative security bugs without replacing silicon.",
      },
    ],
    misconceptions: [
      {
        myth: "A multi-cycle CPU always executes a program slower than a single-cycle CPU because instructions take 3–5 cycles instead of 1.",
        reality:
          "Because each cycle in a multi-cycle CPU is roughly 4–5x shorter, a 3-cycle branch or 4-cycle ALU instruction often finishes in less wall-clock time than a single-cycle CPU stretched to accommodate a slow load-word instruction.",
      },
      {
        myth: "The Control Unit executes instructions itself in software-like firmware.",
        reality:
          "In RISC and most modern fast-path CISC decoders, the Control Unit is pure combinational hardware gates and flip-flops—zero software is involved in decoding ordinary instructions.",
      },
    ],
    deepDive: {
      title: "Truth-Table Synthesis of Main Control + ALUOp",
      content:
        "Processor designers split decoding into two levels to shrink PLA/gate complexity. First, the **Main Decoder** maps the 6–7 bit primary `opcode` to datapath steering signals (`RegWrite`, `ALUSrc`, `MemRead`, `MemWrite`, `Branch`) plus a compact 2-bit `ALUOp` hint (`00` = force add for load/store address calculation, `01` = force subtract for branch equality, `10` = inspect `funct3`/`funct7` for R/I-type arithmetic).\n\nSecond, the smaller **ALU Decoder** combines `ALUOp` with `funct3`/`funct7` to generate the 3–4 bit ALU control code. Because `funct` bits are ignored when `ALUOp != 10`, the Main Decoder never has to know all 40 ALU variants—keeping control fan-out shallow and synthesis timing clean.",
    },
    revisionNotes: [
      "FDE sequence: Fetch (IR <= Mem[PC], PC += 4) -> Decode (read Rs1/Rs2, decode opcode) -> Execute -> Memory -> Writeback.",
      "Single-cycle CPI = 1, but T_clk is bottlenecked by the slowest instruction (load).",
      "Multi-cycle FSM reuses the ALU and memory across steps, giving variable CPI (3–5) and a much shorter clock period.",
      "Hardwired control uses fast combinational gates (RISC); microprogrammed control uses a ROM control store (complex CISC / patchable).",
      "Iron Law: Execution Time = Instruction Count * CPI * Clock Period.",
    ],
    glossaryTermIds: [
      "program-counter",
      "instruction-register",
      "control-unit",
      "alu",
      "register-file",
    ],
    references: [
      {
        title: "Computer Organization and Design (Chapter 4: The Processor)",
        author: "David A. Patterson & John L. Hennessy",
        url: "https://www.elsevier.com/books/computer-organization-and-design-risc-v-edition/patterson/978-0-12-820331-6",
        type: "book",
        note: "Authoritative derivation of single-cycle and multi-cycle datapath control tables.",
      },
      {
        title: "Digital Design and Computer Architecture: RISC-V Edition (Chapter 7)",
        author: "Sarah L. Harris & David Money Harris",
        url: "https://www.elsevier.com/books/digital-design-and-computer-architecture-risc-v-edition/harris/978-0-12-820064-3",
        type: "book",
        note: "Clear Verilog implementations of single-cycle and multi-cycle FSM control units.",
      },
      {
        title: "From Nand to Tetris: Computer Architecture (Project 5)",
        author: "Noam Nisan & Shimon Schocken",
        url: "https://www.nand2tetris.org/project05",
        type: "course",
        note: "Step-by-step wiring of PC, A/D registers, ALU, and instruction decoder.",
      },
    ],
    assessments: [
      {
        id: "l14-q1",
        type: "ordering",
        difficulty: "foundational",
        prompt:
          "Arrange the 5 phases of a multi-cycle `LOAD` (`lw`) instruction in exact chronological execution order.",
        orderingItems: [
          "MEM: Read data word from Mem[ALUOut] into MDR",
          "EX: Compute effective memory address A + sign_ext(imm)",
          "IF: Fetch instruction from Mem[PC] into IR and compute PC + 4",
          "WB: Latch MDR into destination register Rd",
          "ID: Decode opcode and read base register Rs1 into A",
        ],
        correctAnswer: [
          "IF: Fetch instruction from Mem[PC] into IR and compute PC + 4",
          "ID: Decode opcode and read base register Rs1 into A",
          "EX: Compute effective memory address A + sign_ext(imm)",
          "MEM: Read data word from Mem[ALUOut] into MDR",
          "WB: Latch MDR into destination register Rd",
        ],
        hints: [
          "A load must compute its effective address in EX before accessing memory in MEM.",
        ],
        explanation:
          "A load instruction traverses all five phases: IF -> ID -> EX (address addition) -> MEM (read data) -> WB (write register Rd).",
        conceptTag: "fde-cycle",
      },
      {
        id: "l14-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A multi-cycle CPU runs at $2.0\\text{ GHz}$ ($T_{\\text{clk}} = 0.5\\text{ ns}$) with cycle counts: ALU = 4, Load = 5, Store = 4, Branch = 3. For a benchmark with 45% ALU, 25% Load, 10% Store, and 20% Branch instructions, what is the average CPI?",
        latex: "\\text{CPI} = \\sum_k f_k \\cdot c_k",
        correctAnswer: 4.05,
        numericTolerance: 0.01,
        hints: [
          "Multiply each instruction class percentage by its cycle count: 0.45*4 + 0.25*5 + 0.10*4 + 0.20*3.",
        ],
        explanation:
          "CPI = (0.45 * 4) + (0.25 * 5) + (0.10 * 4) + (0.20 * 3) = 1.80 + 1.25 + 0.40 + 0.60 = 4.05 cycles/instruction.",
        conceptTag: "iron-law-cpi",
      },
      {
        id: "l14-q3",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "Why does a single-cycle processor fail to speed up programs that contain mostly simple register-to-register `ADD` instructions?",
        options: [
          {
            id: "a",
            text: "Register-to-register instructions require two memory reads in a single cycle.",
            explanation:
              "R-type arithmetic does not access data memory at all.",
          },
          {
            id: "b",
            text: "Every clock cycle has a fixed duration set by the worst-case critical path (usually the `LOAD` instruction).",
            explanation:
              "Correct! Even when `ADD` finishes well before the clock edge, the next instruction cannot start until the fixed single-cycle clock ticks.",
          },
          {
            id: "c",
            text: "Hardwired control units cannot decode `ADD` in one cycle.",
            explanation:
              "Hardwired decoders decode `ADD` in combinational logic within picoseconds.",
          },
          {
            id: "d",
            text: "The Program Counter can only increment every two cycles.",
            explanation:
              "PC + 4 computes in parallel with instruction memory fetch every cycle.",
          },
        ],
        correctAnswer: "b",
        hints: [
          "Recall what determines T_clk in a synchronous digital circuit.",
        ],
        explanation:
          "In a synchronous single-cycle CPU, the clock period must be at least as long as the slowest instruction's end-to-end delay (IF + ID + EX + MEM + WB for a load), forcing fast instructions to idle until the clock edge.",
        conceptTag: "single-cycle-bottleneck",
      },
      {
        id: "l14-q4",
        type: "fill-blank",
        difficulty: "foundational",
        prompt:
          "In a multi-cycle CPU, what 2-letter abbreviation names the register that latches the fetched machine-code instruction word so it remains stable during Decode and Execute?",
        correctAnswer: "IR",
        acceptableAnswers: ["IR", "Instruction Register"],
        hints: [
          "It stands for Instruction Register.",
        ],
        explanation:
          "The Instruction Register (IR) captures the instruction word returned from memory during Fetch so that subsequent cycles can decode opcode and operand fields safely.",
        conceptTag: "instruction-register",
      },
    ],
  },

  // =========================================================================
  // LESSON 15: Von Neumann vs. Harvard Architectures & Buses
  // =========================================================================
  {
    id: "von-neumann-vs-harvard",
    slug: "von-neumann-vs-harvard",
    number: 15,
    title: "Von Neumann vs. Harvard Architectures & Buses",
    subtitle:
      "Stored-program flexibility, the Von Neumann memory bottleneck, Modified Harvard split L1 caches, system buses, DMA, and byte endianness.",
    trackId: "track-2",
    domainId: "computer-architecture",
    moduleTitle: "Module 5: Building a Stored-Program Processor",
    chapterTitle: "Chapter 5: Datapath, Control & ISAs",
    estimatedMinutes: 30,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["control-unit-fetch-decode-execute"],
    objectives: [
      "Contrast the unified memory bus of Von Neumann machines with the split instruction/data memories of pure Harvard machines.",
      "Explain why modern CPUs adopt a Modified Harvard architecture (split L1i/L1d caches over a unified L2/L3/DRAM address space).",
      "Analyze how system buses (address, data, control), bus arbitration, DMA, and endianness shape hardware-software transfers.",
      "Identify why self-modifying and JIT-compiled code must explicitly synchronize instruction and data caches on Modified Harvard cores.",
    ],
    depthExplanations: {
      beginner:
        "Early calculators stored numbers in memory while programs lived on physical punch cards or plugboards. John von Neumann's breakthrough idea was to store the program in the exact same memory as the data! That makes computers infinitely flexible—an operating system can download an app as data bytes and immediately run it as code—but it creates a traffic jam: if there is only one road between CPU and memory, fetching an instruction and loading data cannot happen at the exact same instant.",
      intermediate:
        "Pure **Von Neumann** architectures place instructions and data in a single linear address space served by one memory port, creating the **Von Neumann bottleneck**: bus bandwidth and latency cap processor throughput, and instruction fetches conflict structurally with data loads/stores. Pure **Harvard** architectures eliminate this structural conflict by providing physically separate instruction and data memories with independent buses—doubling peak memory bandwidth and allowing different word widths (e.g., 14-bit instructions vs. 8-bit data on PIC microcontrollers).\n\nModern general-purpose CPUs blend both worlds in a **Modified Harvard** hierarchy: inside the core, separate **L1 Instruction (L1i)** and **L1 Data (L1d)** caches supply simultaneous fetch and load/store bandwidth, while outside the core they converge onto a unified **Von Neumann L2/L3 cache and DRAM** address space.",
      advanced:
        "At the bus and interconnect level, processor cores communicate with DRAM controllers and peripherals over multiplexed or point-to-point packetized fabrics (PCIe, UPI, Infinity Fabric, AXI) using address, data, and control/coherence transactions. Direct Memory Access (**DMA**) controllers act as bus masters to transfer bulk blocks between NVMe/NIC devices and DRAM without burning CPU cycles.\n\nCrucially, Modified Harvard split L1 caches introduce **I-cache / D-cache incoherence** on architectures without hardware instruction-cache snooping (such as ARM64 and RISC-V). When a JIT compiler writes newly generated machine bytes through the D-cache (`STR`), L1i may still hold stale lines; software must issue data-cache clean (`DC CVAU`) and instruction-cache invalidate (`IC IVAU`) plus an instruction synchronization barrier (`ISB`) before branching to the new code.",
    },
    intuition:
      "Von Neumann says 'code is just bytes in memory'; Harvard says 'give code and data separate highways so they never collide.' Modern CPUs keep code as bytes in main memory so compilers and OS loaders work, then split the last-mile highway into private L1i and L1d lanes right next to the execution engine.",
    technicalTheory:
      "In a **Von Neumann** machine, a single $W$-bit data bus and $A$-bit address bus service both instruction fetch (`IF`) and data access (`MEM`). If a pipeline attempts to fetch one instruction every cycle while $30\\%$ of instructions perform a data load or store, a single-ported memory requires at least $1.30$ bus cycles per instruction—bounding ideal throughput below $\\text{IPC} = 1.0$.\n\nIn a **Modified Harvard** processor, L1i provides dedicated fetch bandwidth $B_{\\text{inst}}$ (e.g., 32–64 bytes/cycle on x86-64/ARM64) while L1d independently provides load/store bandwidth $B_{\\text{data}}$ (e.g., two 32-byte loads + one 32-byte store per cycle). Both L1 caches share the same physical address space backed by unified L2/L3/DRAM.\n\nTwo foundational byte-layout and protection properties arise from unified memory:\n1. **Endianness:** Multi-byte integers in byte-addressable memory must choose byte ordering. **Little-endian** (x86-64, ARM64 default, RISC-V) stores the least significant byte at the lowest address ($\\text{addr}+0$), whereas **Big-endian** (network byte order, legacy SPARC/PowerPC) stores the most significant byte at $\\text{addr}+0$.\n2. **Code vs. Data Protection (`NX` / `W^X`):** Because raw Von Neumann memory cannot inherently tell instructions from user data, attackers can exploit buffer overflows to inject shellcode bytes into data buffers and jump to them. Modern MMUs enforce page-table **Execute-Disable (`NX`/`XN`)** bits and **Write XOR Execute (`W^X`)** policies so writable memory is never executable simultaneously.",
    mechanisms: [
      {
        step: 1,
        title: "Unified Address Space Layout",
        detail:
          "The OS loader maps an executable's `.text` (code) and `.data`/stack regions into the same virtual/physical DRAM address space.",
        stateNote: "Code & Data live in shared physical DRAM",
      },
      {
        step: 2,
        title: "Parallel L1i Fetch & L1d Access",
        detail:
          "Inside the CPU core, the Fetch unit queries L1i using the PC while the Load/Store unit queries L1d in the exact same clock cycle—zero structural port conflict.",
        stateNote: "L1i (read-only fetch) || L1d (read/write data)",
      },
      {
        step: 3,
        title: "Unified L2 Miss Resolution",
        detail:
          "When either L1i or L1d misses, both requests arbitrate over the internal core bus to the unified L2/L3 hierarchy and DDR memory controller.",
        stateNote: "Misses converge into Von Neumann memory space",
      },
      {
        step: 4,
        title: "DMA Peripheral Offload",
        detail:
          "For bulk disk or network I/O, a DMA engine arbitrates for memory bus ownership and streams pages straight into DRAM, interrupting the CPU only at completion.",
        stateNote: "DMA Bus Master -> DRAM (CPU continues compute)",
      },
      {
        step: 5,
        title: "JIT I-Cache Synchronization",
        detail:
          "When a JIT writes machine code via L1d, software flushes D-cache lines to unified L2/PoU and invalidates stale L1i entries before executing the generated buffer.",
        stateNote: "D-cache clean -> unified PoU -> I-cache invalidate",
      },
    ],
    mathNotes: [
      {
        title: "Memory Bandwidth Ceiling (Von Neumann vs. Harvard)",
        latex: "\\text{BW}_{\\text{peak}} = W_{\\text{bus}} \\times f_{\\text{bus}} \\times \\text{Transfers/clk}, \\qquad \\text{CPI}_{\\text{struct}} \\ge 1 + f_{\\text{mem}}",
        explanation:
          "On a strictly single-port Von Neumann memory where fraction f_mem of instructions also access data memory, structural port contention forces at least 1 + f_mem memory cycles per instruction unless split caches or dual ports exist.",
      },
    ],
    diagram: {
      title: "Modified Harvard CPU Hierarchy",
      caption:
        "Split L1i and L1d caches give Harvard parallelism inside the core while sharing a unified Von Neumann L2/DRAM address space.",
      nodes: [
        {
          id: "core_fetch",
          label: "Fetch Unit",
          sublabel: "PC -> Inst Bytes",
          x: 40,
          y: 45,
          tone: "accent",
        },
        {
          id: "core_lsu",
          label: "Load/Store Unit",
          sublabel: "Data Read/Write",
          x: 40,
          y: 195,
          tone: "emerald",
        },
        {
          id: "l1i",
          label: "L1i Cache",
          sublabel: "Harvard Inst Port",
          x: 260,
          y: 45,
          tone: "accent",
        },
        {
          id: "l1d",
          label: "L1d Cache",
          sublabel: "Harvard Data Port",
          x: 260,
          y: 195,
          tone: "emerald",
        },
        {
          id: "l2",
          label: "Unified L2 / L3",
          sublabel: "Shared Code + Data",
          x: 490,
          y: 120,
          tone: "amber",
        },
        {
          id: "dram",
          label: "Main DRAM + DMA",
          sublabel: "Von Neumann Space",
          x: 680,
          y: 120,
          tone: "neutral",
        },
      ],
      edges: [
        { from: "core_fetch", to: "l1i", label: "IF Bus" },
        { from: "core_lsu", to: "l1d", label: "Data Bus" },
        { from: "l1i", to: "l2", label: "I-Miss" },
        { from: "l1d", to: "l2", label: "D-Miss" },
        { from: "l2", to: "dram", label: "Memory Bus" },
      ],
    },
    codeExamples: [
      {
        title: "Inspecting Little-Endian Memory Layout & Code-as-Data in C",
        language: "c",
        code: `#include <stdint.h>
#include <stdio.h>

int add_one(int x) { return x + 1; }

int main(void) {
    uint32_t val = 0x12345678;
    const uint8_t *bytes = (const uint8_t *)&val;
    printf("0x12345678 in memory (low->high addr): %02X %02X %02X %02X\\n",
           bytes[0], bytes[1], bytes[2], bytes[3]);

    // In Von Neumann / Modified Harvard space, function pointers also point to bytes!
    const uint8_t *fn_bytes = (const uint8_t *)&add_one;
    printf("First 4 machine-code bytes of add_one: %02X %02X %02X %02X\\n",
           fn_bytes[0], fn_bytes[1], fn_bytes[2], fn_bytes[3]);
    return 0;
}`,
        explanation:
          "On x86-64 (little-endian), the least significant byte 0x78 sits at bytes[0] (lowest address). Because functions live in the same virtual address space, a pointer can inspect raw machine opcodes directly if the page is readable.",
        output: `0x12345678 in memory (low->high addr): 78 56 34 12
First 4 machine-code bytes of add_one: 8D 47 01 C3   (x86-64: lea eax, [rdi+1]; ret)`,
      },
      {
        title: "JIT Cache Coherency Pattern on Modified Harvard CPUs (C / GCC Builtin)",
        language: "c",
        code: `#include <stddef.h>
#include <stdint.h>

void finalize_jit_buffer(uint8_t *code_buf, size_t len) {
    // 1. Write machine opcodes via D-cache (already done into code_buf)
    // 2. Clean D-cache & invalidate L1 I-cache over [code_buf, code_buf + len)
    //    No-op on x86-64 (hardware snoops I-cache), mandatory on ARM64 / RISC-V!
    __builtin___clear_cache((char *)code_buf, (char *)(code_buf + len));
}`,
        explanation:
          "Without __builtin___clear_cache on ARM64 or RISC-V, L1i may fetch stale zeros or old instructions from before the JIT wrote the new machine code into L1d.",
        output: `ARM64 expansion: DC CVAU loop -> DSB ISH -> IC IVAU loop -> DSB ISH -> ISB`,
      },
    ],
    connections: [
      {
        lessonSlug: "control-unit-fetch-decode-execute",
        relationship:
          "Resolves the structural conflict when a pipelined FDE engine performs IF and MEM simultaneously.",
      },
      {
        lessonSlug: "cache-hierarchies-coherence",
        relationship:
          "Explores how L1i, L1d, and unified L2/L3 caches actually store, index, and keep lines coherent.",
      },
      {
        lessonSlug: "linkers-interpreters-jit",
        relationship:
          "JIT compilers rely on Von Neumann code-as-data flexibility combined with Modified Harvard I-cache synchronization and W^X permissions.",
      },
    ],
    realWorldApplications: [
      {
        title: "Pure Harvard Microcontrollers vs. Modified Harvard Desktop CPUs",
        simplifiedVsReal:
          "An entry-level 8-bit AVR microcontroller (Arduino Uno ATmega328P) is genuinely Pure Harvard: 32 KiB of flash program memory lives in a totally separate address space from 2 KiB of data SRAM, requiring special `LPM` (`PROGMEM`) instructions to read constant tables from flash.",
        modernExample:
          "Every modern x86-64 (Intel/AMD) and ARM64 (Apple M-series/Snapdragon) processor is Modified Harvard: split 32–192 KiB L1i and 32–128 KiB L1d inside the core, unified L2/L3/DRAM outside.",
      },
      {
        title: "Simple Shared Bus vs. Packetized Point-to-Point Fabrics",
        simplifiedVsReal:
          "Textbooks draw three flat parallel wires labeled Address, Data, and Control connecting CPU and RAM. Real servers cannot run wide parallel shared buses at multi-GHz speeds due to skew and capacitive loading.",
        modernExample:
          "Modern chips use split-transaction, packetized interconnects—ARM AMBA AXI/CHI on-die, PCIe Gen5/Gen6 differential lanes to peripherals, and multi-channel DDR5 controllers.",
      },
    ],
    misconceptions: [
      {
        myth: "Modern x86 and ARM laptops are pure Von Neumann machines because they have one stick of RAM.",
        reality:
          "They are Modified Harvard! Inside each core, L1i and L1d are physically separate caches with separate ports so instruction fetch and data loads run in parallel every cycle.",
      },
      {
        myth: "Little-endian reverses the bits inside each byte.",
        reality:
          "Endianness only orders whole bytes within a multi-byte word (e.g., 32-bit or 64-bit integers). Bit order inside a single byte is unaffected.",
      },
    ],
    deepDive: {
      title: "Why x86-64 Hides I-Cache Incoherence While ARM64 Exposes It",
      content:
        "In the original 8086 through modern x86-64, backward compatibility forced Intel and AMD to keep self-modifying code working automatically without explicit cache-flush instructions. Consequently, x86-64 hardware snoops stores against the L1 Instruction Cache and $\\mu\\text{op}$ cache, automatically invalidating any matching instruction lines at significant hardware complexity.\n\nARM64 and RISC-V intentionally omit cross-cache store-to-I-cache snooping in hardware to save power and silicon area on ordinary workloads where code rarely mutates. Instead, V8, JVM HotSpot, and LLVM JIT engines emit explicit cache-maintenance instructions (`__clear_cache` / `fence.i`) whenever they finish compiling a hot function.",
    },
    revisionNotes: [
      "Von Neumann stores instructions and data in one memory space, enabling OS loaders and JITs but causing bus contention.",
      "Pure Harvard uses physically separate instruction and data memories (common in DSPs and small MCUs).",
      "Modern CPUs are Modified Harvard: split L1i and L1d caches inside the core, unified L2/L3/DRAM outside.",
      "Little-endian places the LSB at the lowest byte address; Big-endian places the MSB at the lowest address.",
      "ARM64 and RISC-V JITs must synchronize D-cache and I-cache after emitting new code.",
    ],
    glossaryTermIds: [
      "von-neumann-architecture",
      "harvard-architecture",
      "instruction-register",
    ],
    references: [
      {
        title: "First Draft of a Report on the EDVAC",
        author: "John von Neumann (1945)",
        url: "https://web.mit.edu/STS.035/www/PDFs/edvac.pdf",
        type: "paper",
        note: "The seminal 1945 memorandum defining the stored-program computer architecture.",
      },
      {
        title: "ARM Architecture Reference Manual (Caches and Self-Modifying Code)",
        author: "Arm Limited",
        url: "https://developer.arm.com/documentation",
        type: "spec",
        note: "Official specification of Modified Harvard D-cache/I-cache synchronization (DC CVAU, IC IVAU, ISB).",
      },
      {
        title: "Computer Systems: A Programmer's Perspective (Chapter 2 & 4)",
        author: "Randal E. Bryant & David R. O'Hallaron",
        url: "https://csapp.cs.cmu.edu/",
        type: "book",
        note: "Detailed byte-level treatment of endianness and unified virtual memory spaces.",
      },
    ],
    assessments: [
      {
        id: "l15-q1",
        type: "matching",
        difficulty: "foundational",
        prompt:
          "Match each processor memory organization or bus mechanism to its defining hardware characteristic.",
        matchingPairs: [
          {
            id: "m1",
            left: "Pure Von Neumann",
            right: "Single shared memory and bus for both instructions and data",
          },
          {
            id: "m2",
            left: "Pure Harvard",
            right: "Physically separate instruction and data address spaces",
          },
          {
            id: "m3",
            left: "Modified Harvard",
            right: "Split L1i/L1d caches backed by unified L2/L3 and DRAM",
          },
          {
            id: "m4",
            left: "DMA Controller",
            right: "Transfers peripheral blocks directly to/from DRAM without CPU copy loops",
          },
        ],
        correctAnswer: {
          m1: "Single shared memory and bus for both instructions and data",
          m2: "Physically separate instruction and data address spaces",
          m3: "Split L1i/L1d caches backed by unified L2/L3 and DRAM",
          m4: "Transfers peripheral blocks directly to/from DRAM without CPU copy loops",
        },
        hints: [
          "Desktop CPUs combine split L1 caches with unified outer memory.",
        ],
        explanation:
          "Pure Von Neumann shares one memory port; Pure Harvard completely isolates instruction/data memories; Modified Harvard splits only L1i/L1d; DMA offloads bulk transfers from the CPU.",
        conceptTag: "von-neumann-vs-harvard",
      },
      {
        id: "l15-q2",
        type: "true-false",
        difficulty: "intermediate",
        prompt:
          "True or False: Because an ARM64 Linux laptop has unified DRAM, a JIT compiler can write newly compiled machine code into a `malloc`'d/executable buffer and immediately jump to it without cleaning the D-cache or invalidating the I-cache.",
        correctAnswer: false,
        hints: [
          "Remember that ARM64 is Modified Harvard at L1 and does not snoop D-cache writes into L1i.",
        ],
        explanation:
          "False. ARM64 has split L1i and L1d caches and does not enforce hardware coherence between them. Written bytes sit in L1d while L1i may hold stale instructions, requiring DC CVAU + IC IVAU + ISB.",
        conceptTag: "modified-harvard-coherence",
      },
      {
        id: "l15-q3",
        type: "predict-output",
        difficulty: "foundational",
        prompt:
          "On a little-endian x86-64 CPU, `uint32_t x = 0xDEADBEEF;` is stored starting at address `0x1000`. What byte value resides at address `0x1001`?",
        options: [
          {
            id: "a",
            text: "0xDE",
            explanation: "0xDE is the MSB, placed at 0x1003 on little-endian.",
          },
          {
            id: "b",
            text: "0xAD",
            explanation: "0xAD sits at 0x1002.",
          },
          {
            id: "c",
            text: "0xBE",
            explanation:
              "Correct! Little-endian writes LSB first: 0x1000=EF, 0x1001=BE, 0x1002=AD, 0x1003=DE.",
          },
          {
            id: "d",
            text: "0xEF",
            explanation: "0xEF is the LSB, placed at 0x1000.",
          },
        ],
        correctAnswer: "c",
        hints: [
          "Write out the 4 bytes from least significant (0xEF) to most significant (0xDE) starting at 0x1000.",
        ],
        explanation:
          "Little-endian stores the least significant byte at the lowest address: [0x1000]=0xEF, [0x1001]=0xBE, [0x1002]=0xAD, [0x1003]=0xDE.",
        conceptTag: "endianness",
      },
      {
        id: "l15-q4",
        type: "multi-select",
        difficulty: "intermediate",
        prompt:
          "Which statements accurately describe consequences of a unified Von Neumann address space?",
        options: [
          {
            id: "a",
            text: "An OS kernel can load program binaries from disk as data bytes and then execute them.",
            explanation: "Correct—programs are just bytes in the unified address space.",
          },
          {
            id: "b",
            text: "Instruction fetch and data load/store contend for bandwidth unless split caches or dual ports exist.",
            explanation: "Correct—this structural contention is the Von Neumann bottleneck.",
          },
          {
            id: "c",
            text: "Hardware automatically prevents any writable buffer from ever being executed without MMU page permissions.",
            explanation:
              "Incorrect—preventing code injection requires explicit MMU NX/W^X page attributes; raw Von Neumann memory makes no distinction.",
          },
          {
            id: "d",
            text: "Compilers and linkers can emit machine code into memory buffers like ordinary data.",
            explanation: "Correct—this is fundamental to compilers, linkers, and JITs.",
          },
        ],
        correctAnswer: ["a", "b", "d"],
        hints: [
          "One option falsely assumes raw Von Neumann memory separates code from data automatically.",
        ],
        explanation:
          "Storing code as data enables OS loaders, compilers, and JITs, causes fetch/data bus contention, and requires explicit MMU NX/W^X enforcement to prevent data buffers from executing.",
        conceptTag: "von-neumann-tradeoffs",
      },
    ],
  },

  // =========================================================================
  // LESSON 16: Instruction Sets & Opcodes: x86-64, ARM64 & RISC-V
  // =========================================================================
  {
    id: "isa-opcodes-x86-arm-riscv",
    slug: "isa-opcodes-x86-arm-riscv",
    number: 16,
    title: "Instruction Sets & Opcodes: x86-64, ARM64 & RISC-V",
    subtitle:
      "The hardware-software contract: fixed vs. variable-length encodings, RISC-V/ARM64/x86-64 instruction formats, addressing modes, and CISC-to-micro-op convergence.",
    trackId: "track-2",
    domainId: "assembly-machine-code",
    moduleTitle: "Module 6: Assembly, Calling Conventions & ABI",
    chapterTitle: "Chapter 6: The Hardware-Software Contract",
    estimatedMinutes: 45,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["control-unit-fetch-decode-execute"],
    objectives: [
      "Define an Instruction Set Architecture (ISA) as the abstraction boundary separating software binaries from silicon microarchitecture.",
      "Encode and decode 32-bit RISC-V R-type and I-type instructions bit-for-bit, explaining why register fields stay fixed across formats.",
      "Contrast x86-64 variable-length CISC encoding (prefixes, REX, ModR/M, SIB) with ARM64 and RISC-V fixed-width load-store architectures.",
      "Apply register, immediate, base-displacement, scaled-index, and PC-relative addressing modes.",
    ],
    depthExplanations: {
      beginner:
        "Assembly language is just human-readable nicknames for binary numbers. An Instruction Set Architecture (ISA) is the rulebook that says which registers exist and which binary bit patterns mean 'add', 'load from memory', or 'jump'. Today, three ISAs dominate computing: **x86-64** (Intel/AMD laptops and servers), **ARM64** (smartphones, Apple Silicon, cloud ARM), and **RISC-V** (an open-standard ISA growing rapidly in embedded controllers and accelerators).",
      intermediate:
        "ISAs traditionally split into **CISC** (Complex Instruction Set Computer, like x86-64) and **RISC** (Reduced Instruction Set Computer, like ARM64 and RISC-V). RISC-V and ARM64 are **load-store** architectures: arithmetic operates exclusively on 32 general-purpose registers, while dedicated `LOAD`/`STORE` instructions touch memory, and every standard instruction fits in a fixed 32-bit word (`opcode`, `rd`, `rs1`, `rs2`, `funct`, `imm`). Keeping `rs1` and `rs2` in identical bit positions across formats lets hardware read the register file in parallel with opcode decoding.\n\nBy contrast, x86-64 uses **variable-length** instructions (1 to 15 bytes) with legacy prefixes, a `REX` byte extending registers to 64-bit / 16 GPRs, a 1–3 byte opcode, a `ModR/M` byte, optional `SIB` (Scale-Index-Base) byte, displacement, and immediate. It permits memory-register arithmetic (`add rax, [rdi + rsi*4 + 8]`) and packs dense code, at the cost of a far more complex decoder.",
      advanced:
        "At the microarchitectural frontier, the classic CISC vs. RISC performance divide has largely converged. Modern x86-64 frontends pre-decode variable-length instruction bytes, crack complex instructions into fixed-width RISC-like **micro-ops ($\mu\\text{ops}$)**, and cache them in a dedicated **Decoded $\\mu\\text{op}$ Cache** (DSB/Op Cache) so the backend executes uniform internal operations—though x86 still pays substantial power and silicon area in its parallel length-predecoder across 16-byte fetch windows.\n\nMeanwhile, RISC ISAs carefully optimize bit encoding for hardware simplicity: RISC-V's B-type and J-type branch/jump formats scramble immediate bits precisely so that sign bit `imm[12]` / `imm[20]` always stays at bit 31 (allowing single-wire sign extension) while overlapping most bits with S/U formats. Both ARM64 and RISC-V also support compact encodings (RISC-V `C` 16-bit compressed extension) to match x86 code density without variable 1–15 byte parsing.",
    },
    intuition:
      "Think of an ISA as the electrical plug standard between software and silicon: compilers emit machine bytes matching the plug, and CPU engineers are free to redesign everything behind the socket—pipelines, caches, branch predictors—as long as the ISA contract holds.",
    technicalTheory:
      "An **Instruction Set Architecture (ISA)** specifies four programmer-visible contracts: (1) register state and data widths, (2) byte-addressed memory model and alignment/atomicity rules, (3) instruction semantics and binary encodings, and (4) synchronous/asynchronous exception behavior.\n\nIn **RISC-V (RV32I/RV64I)**, every base instruction is 32 bits wide, aligned on 4-byte boundaries (or 2-byte with the Compressed `C` extension). Consider the two core arithmetic formats:\n- **R-type (`add rd, rs1, rs2`):** `funct7[31:25] | rs2[24:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]`\n- **I-type (`addi rd, rs1, imm12`):** `imm[31:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]`\nNotice that `opcode` (`6:0`), `rd` (`11:7`), `funct3` (`14:12`), and `rs1` (`19:15`) occupy the exact same bit slices in both formats.\n\nIn **x86-64**, instructions span **1 to 15 bytes**:\n`[Prefixes 0..4B] [REX 0..1B] [Opcode 1..3B] [ModR/M 0..1B] [SIB 0..1B] [Disp 0/1/2/4B] [Imm 0/1/2/4/8B]`\nThe `REX` byte (`0x40..0x4F`: `0100 W R X B`) unlocks 64-bit operand width (`W=1`) and the 4th bit of register indices (`R8`–`R15`). The `ModR/M` (`mod[7:6] | reg[5:3] | rm[2:0]`) and `SIB` (`scale[7:6] | index[5:3] | base[2:0]`) bytes encode complex effective addresses in a single instruction:\n$$\\text{EA} = \\text{Base} + \\text{Index} \\times 2^{\\text{scale}} + \\text{Disp}, \\qquad \\text{scale} \\in \\{0, 1, 2, 3\\}$$\nBy contrast, **ARM64 (AArch64)** uses fixed 32-bit instructions with 31 general-purpose 64-bit registers (`X0`–`X30`), zero register `XZR`, and explicit condition flags (`NZCV`) updated only by flag-setting variants like `ADDS`/`SUBS`, whereas RISC-V has no condition-code register at all—its branch instructions (`beq`, `blt`) compare two registers directly.",
    mechanisms: [
      {
        step: 1,
        title: "Instruction Byte Framing (Length Decode)",
        detail:
          "Fixed-width ISAs (ARM64, base RISC-V) slice 4 bytes immediately per instruction. Variable-width x86-64 must scan prefixes and ModR/M bytes to locate each instruction boundary.",
        stateNote: "RISC-V/ARM64: 4B stride | x86-64: 1..15B length decode",
      },
      {
        step: 2,
        title: "Parallel Opcode & Register Specifier Extraction",
        detail:
          "Decoder hardware extracts opcode/funct fields while simultaneously forwarding fixed-position rs1/rs2 indices to the register file read ports.",
        stateNote: "opcode = inst[6:0], rd = inst[11:7], rs1 = inst[19:15], rs2 = inst[24:20]",
      },
      {
        step: 3,
        title: "Sign-Extension of Immediate Fields",
        detail:
          "Immediate subfields are unpacked and sign-extended from bit 31 (e.g., 12-bit I/S/B immediates or 20-bit U/J immediates) to full 32/64-bit datapath width.",
        stateNote: "imm64 = {{52{inst[31]}}, inst[31:20]}",
      },
      {
        step: 4,
        title: "Effective Address Calculation",
        detail:
          "Memory and branch instructions evaluate Base + Offset, x86 SIB scaled index, or PC-relative target addresses for position-independent code.",
        stateNote: "EA = Base + Index * Scale + Disp (or PC + rel32)",
      },
      {
        step: 5,
        title: "CISC Micro-op Cracking (x86-64)",
        detail:
          "Complex instructions like `add [rdi], rax` crack internally into load -> add -> store micro-ops before entering the execution engine.",
        stateNote: "1 CISC inst -> 1..N internal fixed-width uops",
      },
    ],
    mathNotes: [
      {
        title: "x86-64 SIB Effective Address Formula",
        latex: "\\text{EA} = R_{\\text{base}} + R_{\\text{index}} \\cdot 2^{s} + \\text{Disp}_{8/32}, \\quad s \\in \\{0, 1, 2, 3\\}",
        explanation:
          "The 2-bit scale field encodes multipliers 1, 2, 4, or 8 bytes—matching char, int16, int32/float, and int64/pointer array element strides in a single addressing expression.",
      },
      {
        title: "RISC-V R-Type Bit Packing",
        latex: "\\text{word}_{32} = (\\text{funct7} \\ll 25) \\mid (r_{s2} \\ll 20) \\mid (r_{s1} \\ll 15) \\mid (\\text{funct3} \\ll 12) \\mid (r_d \\ll 7) \\mid \\text{opcode}",
        explanation:
          "All 32 bits pack cleanly with 5-bit register specifiers (selecting 2^5 = 32 registers x0..x31) and 10 bits of funct7+funct3 opcode extension.",
      },
    ],
    simulatorId: "cpu-fde",
    simulatorPrompt:
      "Launch the Fetch-Decode-Execute CPU Simulator and inspect how each assembly mnemonic maps to a binary opcode + register fields inside the Instruction Register (IR) during Decode.",
    diagram: {
      title: "RISC-V Fixed 32-Bit vs. x86-64 Variable Encoding",
      caption:
        "RISC-V aligns register indices across fixed 32-bit words; x86-64 layers optional prefixes, REX, ModR/M, SIB, and displacements.",
      nodes: [
        {
          id: "rv_r",
          label: "RISC-V R-Type (32 bits)",
          sublabel: "funct7 | rs2 | rs1 | funct3 | rd | op",
          x: 40,
          y: 45,
          tone: "emerald",
        },
        {
          id: "rv_i",
          label: "RISC-V I-Type (32 bits)",
          sublabel: "imm[11:0] | rs1 | funct3 | rd | op",
          x: 40,
          y: 175,
          tone: "emerald",
        },
        {
          id: "x86_enc",
          label: "x86-64 Stream (1..15 B)",
          sublabel: "[REX] [Opcode] [ModR/M] [SIB] [Disp] [Imm]",
          x: 370,
          y: 45,
          tone: "amber",
        },
        {
          id: "uop",
          label: "Internal Micro-Ops (uops)",
          sublabel: "Fixed-width internal ops",
          x: 370,
          y: 175,
          tone: "accent",
        },
        {
          id: "exec",
          label: "Execution Core",
          sublabel: "ALU / Load-Store / Branch",
          x: 650,
          y: 110,
          tone: "neutral",
        },
      ],
      edges: [
        { from: "rv_r", to: "exec", label: "Direct Decode" },
        { from: "rv_i", to: "exec", label: "Direct Decode" },
        { from: "x86_enc", to: "uop", label: "Length Decode + Crack" },
        { from: "uop", to: "exec", label: "uop Cache / Issue" },
      ],
    },
    codeExamples: [
      {
        title: "Exact Machine-Code Encodings: RISC-V vs. ARM64 vs. x86-64",
        language: "text",
        code: `Operation: r_dest = r_src1 + r_src2  (registers 5, 6, 7; or RAX += RBX)

1) RISC-V (RV64I): add x5, x6, x7
   funct7=0000000 | rs2=00111(x7) | rs1=00110(x6) | funct3=000 | rd=00101(x5) | op=0110011
   Binary: 0000 0000 0111 0011 0000 0010 1011 0011
   Hex:    0x007302B3  (4 bytes)

2) RISC-V (RV64I): addi x5, x6, -4
   imm=-4 (0xFFC) | rs1=00110(x6) | funct3=000 | rd=00101(x5) | op=0010011
   Binary: 1111 1111 1100 0011 0000 0010 1001 0011
   Hex:    0xFFC30293  (4 bytes)

3) ARM64 (AArch64): add x5, x6, x7
   sf=1 | op=0001011 | shift=00 | 0 | Rm=00111(x7) | imm6=000000 | Rn=00110(x6) | Rd=00101(x5)
   Binary: 1000 1011 0000 0111 0000 0000 1100 0101
   Hex:    0x8B0700C5  (4 bytes)

4) x86-64 (Intel syntax): add rax, rbx
   REX.W=0x48 | Opcode=0x01 (ADD r/m64, r64) | ModR/M=0xD8 (mod=11, reg=rbx(3), rm=rax(0))
   Bytes:  48 01 D8    (3 bytes — variable length!)`,
        explanation:
          "Notice that x86-64 achieves the same 64-bit register addition in 3 bytes using a 2-operand destructive destination (rax += rbx), whereas RISC-V and ARM64 spend 4 bytes for non-destructive 3-operand encoding (rd = rs1 + rs2).",
        output: `RISC-V add x5, x6, x7   => 0x007302B3 (4B)
RISC-V addi x5, x6, -4  => 0xFFC30293 (4B)
ARM64  add x5, x6, x7   => 0x8B0700C5 (4B)
x86-64 add rax, rbx     => 48 01 D8   (3B)`,
      },
      {
        title: "Array Sum Loop Across x86-64, ARM64, and RISC-V",
        language: "asm",
        code: `; int64_t sum(const int64_t *arr, size_t n) -> returns sum in arg0/ret reg

; --- x86-64 (Intel syntax, System V) ---
; rdi = arr, rsi = n, rax = acc
    xor  eax, eax          ; zero 64-bit rax in 2 bytes (31 C0)
    xor  ecx, ecx          ; i = 0
.L_x86:
    cmp  rcx, rsi
    jge  .L_x86_done
    add  rax, [rdi + rcx*8] ; scaled-index memory operand in 1 inst!
    inc  rcx
    jmp  .L_x86
.L_x86_done:
    ret

; --- RISC-V (RV64I) ---
; a0 = arr, a1 = n, t0 = acc, t1 = ptr_end
    li   t0, 0
    slli a1, a1, 3         ; n * 8 bytes
    add  t1, a0, a1        ; end pointer
.L_rv:
    bgeu a0, t1, .L_rv_done ; compare-and-branch (no flags register!)
    ld   t2, 0(a0)         ; explicit load (load-store architecture)
    add  t0, t0, t2
    addi a0, a0, 8
    j    .L_rv
.L_rv_done:
    mv   a0, t0
    ret`,
        explanation:
          "x86-64 folds the base + i*8 load and addition into one instruction `add rax, [rdi + rcx*8]`, and clears RAX with `xor eax, eax` (implicit zero-extension of 32-bit writes to 64-bit registers). RISC-V separates `ld` and `add` and uses direct register comparisons (`bgeu`) without status flags.",
        output: `For arr = [10, 20, 30], n = 3:
x86-64 returns RAX = 60
RISC-V returns a0  = 60`,
      },
    ],
    connections: [
      {
        lessonSlug: "control-unit-fetch-decode-execute",
        relationship:
          "Supplies the concrete binary opcode, funct, and register bitfields that the Control Unit decodes.",
      },
      {
        lessonSlug: "stacks-calling-conventions-abi",
        relationship:
          "Next lesson layers function call instructions, stack pointers, and register conventions atop the ISA.",
      },
      {
        lessonSlug: "out-of-order-superscalar-simd",
        relationship:
          "Shows how modern OoO cores decode 4–8 instructions/cycle and rename architectural ISA registers onto physical registers.",
      },
    ],
    realWorldApplications: [
      {
        title: "Textbook CISC-vs-RISC vs. Modern Micro-Op Cache Convergence",
        simplifiedVsReal:
          "Older textbooks framed CISC as microcoded and slow while RISC was hardwired and fast. Today, high-end x86-64 chips translate variable-length bytes into fixed RISC-like micro-ops and cache them in an L0 uOp Cache so hot loops bypass the complex x86 length decoder entirely.",
        modernExample:
          "Intel Raptor Cove and AMD Zen 4/5 store thousands of decoded uops in an Op Cache, streaming up to 6–8 uops/cycle—yet Apple M-series ARM64 cores still enjoy simpler 8-wide fixed-32-bit decode without a uop cache.",
      },
      {
        title: "Pure 32-Bit RISC vs. Compressed Instructions for Code Density",
        simplifiedVsReal:
          "Fixed 32-bit RISC instructions waste instruction-cache space on simple operations like `addi sp, sp, -16` or `mv a0, a1`. Real RISC ISAs add compact encodings.",
        modernExample:
          "RISC-V's RVC extension compresses frequent operations into 16-bit halfwords (yielding ~25–30% smaller binaries, matching x86-64 density), and ARM uses variable 16/32-bit Thumb-2 on Cortex-M.",
      },
    ],
    misconceptions: [
      {
        myth: "x86-64 has 'more powerful' instructions so one x86 instruction always runs faster than two RISC instructions.",
        reality:
          "Performance depends on micro-op count, cache footprint, and clock/IPC—not mnemonic count. Internally, `add rax, [rdi + rcx*8]` splits into a load uOp and an add uOp just like ARM64 or RISC-V.",
      },
      {
        myth: "In x86-64, `xor eax, eax` leaves the upper 32 bits of `RAX` untouched.",
        reality:
          "Writing to any 32-bit sub-register (`EAX`, `ECX`, etc.) on x86-64 ALWAYS zero-extends into the upper 32 bits of the 64-bit register (`RAX`). That's why `xor eax, eax` is 2 bytes instead of `xor rax, rax` (3 bytes with REX.W) and is even recognized as a zero-latency register-clearing idiom.",
      },
    ],
    deepDive: {
      title: "Why RISC-V Scrambles Branch & Jump Immediate Bits",
      content:
        "If you look at RISC-V's B-type (`beq`) immediate encoding—`inst[31]=imm[12]`, `inst[30:25]=imm[10:5]`, `inst[11:8]=imm[4:1]`, `inst[7]=imm[11]`—it looks bizarre at first glance. Why not keep bits `12:1` contiguous?\n\nTwo hardware optimizations drive this layout: (1) keeping `rs1` (`19:15`) and `rs2` (`24:20`) in the exact same positions as R-type and S-type lets the register file read ports activate before opcode decoding finishes; (2) keeping the MSB sign bit of EVERY immediate format at `inst[31]` cuts sign-extension multiplexer fan-out across the decoder by half, leaving `inst[7]` (which holds `rd[0]` in R/I-types and `imm[0]` in S-type) to hold `imm[11]` without shifting the rest of the bits.",
    },
    revisionNotes: [
      "An ISA is the hardware-software contract (registers, memory model, encodings, exceptions), independent of microarchitecture.",
      "RISC-V and ARM64 use fixed 32-bit load-store instructions; x86-64 uses 1–15 byte variable-length register-memory instructions.",
      "Keeping rs1/rs2 at fixed bit positions (19:15 and 24:20 in RISC-V) allows register reads in parallel with decoding.",
      "x86-64 SIB addressing computes EA = Base + Index * 2^scale + Disp in a single instruction.",
      "Modern x86-64 cores crack CISC instructions into RISC-like uOps and cache them in a decoded uOp cache.",
    ],
    glossaryTermIds: ["isa", "opcode", "addressing-mode", "control-unit"],
    references: [
      {
        title: "The RISC-V Instruction Set Manual, Volume I: Unprivileged ISA",
        author: "Andrew Waterman & Krste Asanovic",
        url: "https://riscv.org/technical/specifications/",
        type: "spec",
        note: "Official bit-level encoding tables and design rationale for RV32I/RV64I and RVC.",
      },
      {
        title: "Intel 64 and IA-32 Architectures Software Developer's Manual (Vol. 2: Instruction Set Reference)",
        author: "Intel Corporation",
        url: "https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html",
        type: "spec",
        note: "Authoritative specification of REX, ModR/M, SIB, and variable-length x86-64 instruction formats.",
      },
      {
        title: "Arm A64 Instruction Set Architecture Reference",
        author: "Arm Limited",
        url: "https://developer.arm.com/documentation/ddi0602/latest",
        type: "spec",
        note: "Complete AArch64 fixed 32-bit opcode encoding and addressing modes.",
      },
    ],
    assessments: [
      {
        id: "l16-q1",
        type: "predict-output",
        difficulty: "rigorous",
        prompt:
          "Decode the 32-bit RISC-V R-type machine instruction `0x40C58533` using `funct7[31:25] | rs2[24:20] | rs1[19:15] | funct3[14:12] | rd[11:7] | opcode[6:0]` (note: `opcode=0110011`, `funct3=000`, `funct7=0100000` is `SUB`). Which assembly instruction does it encode?",
        options: [
          {
            id: "a",
            text: "sub x10, x11, x12",
            explanation:
              "Correct! 0x40C58533 = 0100000_01100_01011_000_01010_0110011 -> funct7=0x20 (sub), rs2=12 (x12), rs1=11 (x11), funct3=0, rd=10 (x10), opcode=0x33.",
          },
          {
            id: "b",
            text: "add x10, x11, x12",
            explanation:
              "ADD has funct7 = 0000000 (top byte 0x00), whereas 0x40... sets bit 30 (funct7 = 0100000 = SUB).",
          },
          {
            id: "c",
            text: "sub x11, x10, x12",
            explanation:
              "Check bits [19:15] and [11:7]: rd is 01010 (x10) and rs1 is 01011 (x11).",
          },
          {
            id: "d",
            text: "sub x12, x11, x10",
            explanation:
              "rs2 (bits 24:20) is 01100 (x12) and rd (bits 11:7) is 01010 (x10).",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Convert 0x40C58533 to 32 binary bits and slice at [31:25], [24:20], [19:15], [14:12], [11:7], [6:0].",
        ],
        explanation:
          "Expanding 0x40C58533 gives 0100000 (funct7=0x20, SUB), 01100 (rs2=x12), 01011 (rs1=x11), 000 (funct3=0), 01010 (rd=x10), 0110011 (OP=0x33). Thus it encodes `sub x10, x11, x12`.",
        conceptTag: "riscv-encoding",
      },
      {
        id: "l16-q2",
        type: "fill-blank",
        difficulty: "foundational",
        prompt:
          "What is the architectural maximum length (in bytes) of a single valid x86-64 machine instruction?",
        correctAnswer: "15",
        acceptableAnswers: ["15", "15 bytes"],
        hints: [
          "It is strictly less than 16 bytes so an instruction fits within two 8-byte fetches.",
        ],
        explanation:
          "The x86-64 architecture enforces a hard limit of 15 bytes per instruction; exceeding 15 bytes via redundant prefixes raises an Invalid Opcode (#UD) fault.",
        conceptTag: "x86-encoding",
      },
      {
        id: "l16-q3",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "Why do RISC-V instruction formats keep `rs1` (bits 19:15) and `rs2` (bits 24:20) at the exact same bit positions across R, I, S, and B formats?",
        options: [
          {
            id: "a",
            text: "So the register file can begin reading source operands in parallel with opcode decoding.",
            explanation:
              "Correct! Hardware routes bits [19:15] and [24:20] straight to register file read muxes before the Control Unit finishes decoding the opcode.",
          },
          {
            id: "b",
            text: "Because RISC-V only has 8 registers and needs extra padding bits.",
            explanation:
              "RISC-V has 32 general-purpose registers, encoded in 5 bits each.",
          },
          {
            id: "c",
            text: "To make big-endian and little-endian encodings identical.",
            explanation:
              "Instruction fetch alignment does not eliminate byte endianness differences.",
          },
          {
            id: "d",
            text: "To support 15-byte variable-length prefixes.",
            explanation:
              "Base RISC-V instructions are fixed at 32 bits (4 bytes).",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Think about shortening the critical path of the Instruction Decode (ID) stage.",
        ],
        explanation:
          "Fixed register specifier positions allow the register file to read source values speculatively at the same moment the Control Unit decodes the instruction opcode, eliminating a serial dependency in ID.",
        conceptTag: "isa-decode-hardware",
      },
      {
        id: "l16-q4",
        type: "debugging",
        difficulty: "intermediate",
        prompt:
          "A student writes an x86-64 loop to sum an array of 64-bit integers (`int64_t *arr` in `RDI`, index `i` in `RCX`), but gets garbage results or segfaults. Identify the bug in the loop body.",
        codeSnippet: `sum_loop:
    cmp  rcx, rsi
    jge  done
    add  rax, [rdi + rcx]
    inc  rcx
    jmp  sum_loop`,
        codeLanguage: "asm",
        options: [
          {
            id: "a",
            text: "Memory is byte-addressed, so `[rdi + rcx]` indexes bytes instead of 8-byte elements; it must be `[rdi + rcx*8]`.",
            explanation:
              "Correct! Each `int64_t` occupies 8 bytes, so without `*8` scale factor the loop reads misaligned overlapping bytes shifted by 1 byte per iteration.",
          },
          {
            id: "b",
            text: "`cmp rcx, rsi` modifies `RAX` before `add`.",
            explanation: "`cmp` only updates RFLAGS and never alters RAX.",
          },
          {
            id: "c",
            text: "`jge` only works on unsigned pointers, not indices.",
            explanation:
              "`jge` performs signed comparison; while `jae` is better for `size_t`, for small positive `n` `jge` works—the fatal bug is the missing `*8` stride.",
          },
          {
            id: "d",
            text: "`inc rcx` cannot increment a 64-bit register.",
            explanation: "`inc rcx` is a valid 64-bit x86-64 instruction.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "How many bytes wide is one `int64_t` in byte-addressed memory?",
        ],
        explanation:
          "Memory addresses refer to individual bytes. Stepping through an array of 8-byte `int64_t` elements requires scaling the index by 8 (`[rdi + rcx*8]`).",
        conceptTag: "addressing-modes",
      },
    ],
  },

  // =========================================================================
  // LESSON 17: Call Stacks, Stack Frames & Calling Conventions (ABI)
  // =========================================================================
  {
    id: "stacks-calling-conventions-abi",
    slug: "stacks-calling-conventions-abi",
    number: 17,
    title: "Call Stacks, Stack Frames & Calling Conventions (ABI)",
    subtitle:
      "How compilers and CPUs coordinate function calls, downward-growing stack frames, System V/AAPCS64 ABIs, caller- vs. callee-saved registers, and tail-call optimization.",
    trackId: "track-2",
    domainId: "assembly-machine-code",
    moduleTitle: "Module 6: Assembly, Calling Conventions & ABI",
    chapterTitle: "Chapter 6: The Hardware-Software Contract",
    estimatedMinutes: 45,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["isa-opcodes-x86-arm-riscv"],
    objectives: [
      "Trace stack pointer (SP) and frame pointer (FP/RBP) movement across function prologue, body, nested call, and epilogue.",
      "Compare how x86-64 (`CALL`/`RET` pushing return address on stack) and ARM64/RISC-V (Link Register `LR`/`ra`) preserve return addresses.",
      "Apply System V AMD64 and AAPCS64 ABI rules for argument registers, return registers, 16-byte stack alignment, and caller- vs. callee-saved registers.",
      "Diagnose ABI violations (unaligned SSE/SIMD faults, clobbered callee-saved registers) and recognize tail-call optimization.",
    ],
    depthExplanations: {
      beginner:
        "When function `main()` calls `draw()`, which calls `pixel()`, the CPU needs a clean way to remember where to return after each function finishes—and where each function can store its own temporary local variables even if a function calls itself recursively. That workspace is the **Call Stack**: a stack of paper trays in memory growing downward. Calling a function puts a new tray (stack frame) on top; returning tosses that tray away and jumps right back to the caller.",
      intermediate:
        "Because an ISA only gives functions one shared register file, separately compiled object files (even written in C, Rust, or assembly) must agree on a strict **Application Binary Interface (ABI)**. An ABI defines: (1) which registers pass arguments and return values, (2) which registers a callee is free to overwrite (**caller-saved / volatile**) vs. which it must preserve (**callee-saved / non-volatile**), and (3) stack alignment rules.\n\nOn **x86-64 System V** (Linux/macOS), the first 6 integer/pointer arguments travel in `RDI, RSI, RDX, RCX, R8, R9` and `RAX` holds the return value; `CALL` pushes the 8-byte return address onto the stack, decrementing `RSP` by 8, and requires `RSP % 16 == 0` right before `CALL`. On **ARM64 (AAPCS64)** and **RISC-V**, `BL`/`JAL` writes the return address into a dedicated **Link Register** (`x30/LR` or `x1/ra`) instead of memory, avoiding a memory store completely for leaf functions.",
      advanced:
        "Modern ABIs optimize the common case—short leaf functions and register-heavy loops—while preserving stack-walkability and vector alignment. System V AMD64 mandates 16-byte `RSP` alignment at the call boundary so callees know `RSP % 16 == 8` upon entry; a single 8-byte `push rbp` (or `sub rsp, 8`) restores 16-byte alignment for aligned 128-bit SSE spills (`MOVAPS`). User-space System V also provides a 128-byte **Red Zone** below `RSP` for leaf functions, whereas kernel builds pass `-mno-red-zone` because asynchronous hardware interrupts push trap frames directly onto the active `RSP`.\n\nWhen a function's final action is calling another function and immediately returning its result, compilers perform **Tail-Call Optimization (TCO)**: tearing down the current stack frame and emitting an unconditional `JMP`/`B` instead of `CALL`/`BL`, turning $O(N)$ recursive stack depth into $O(1)$ space.",
    },
    intuition:
      "The Call Stack is an automated bookmark-and-scratchpad tower, and the ABI is the diplomatic treaty ensuring every function knows who cleans up which registers when crossing a call boundary.",
    technicalTheory:
      "On x86-64, ARM64, and RISC-V, the user stack grows **downward** from high virtual addresses toward lower addresses (`SP` decreases on allocation). A **stack frame** typically contains: (1) incoming stack arguments beyond register capacity, (2) the return address, (3) saved frame pointer (`RBP` / `x29` / `s0`) forming a linked list of frames, (4) saved callee-saved registers, and (5) local buffers or spilled temporaries.\n\n**System V AMD64 ABI (Linux / macOS / BSD) vs. AAPCS64 (ARM64):**\n- **Integer Arguments:** System V uses `RDI, RSI, RDX, RCX, R8, R9` (6 regs); AAPCS64 uses `X0..X7` (8 regs); RISC-V uses `a0..a7` (8 regs).\n- **Return Value:** System V uses `RAX` (and `RDX` for 128-bit); AAPCS64 uses `X0` (`X1`); RISC-V uses `a0` (`a1`).\n- **Callee-Saved (Non-Volatile):** System V requires callees to preserve `RBX, RBP, R12, R13, R14, R15` (and `RSP`). ARM64 preserves `X19..X28`, `FP (X29)`, and `SP` (`X30/LR` must be saved if making nested calls). RISC-V preserves `s0..s11` and `sp` (`ra` saved if non-leaf).\n- **Alignment:** Both x86-64 System V (before `CALL`) and ARM64 (`SP` at all public interfaces / memory accesses) require **16-byte alignment**.\n\nThe split between caller-saved and callee-saved registers minimizes memory traffic: a **leaf function** (calling nothing) places temporaries in caller-saved registers and exits with zero stack pushes, while a **non-leaf function** places live loop counters across calls into callee-saved registers so it doesn't have to spill them before every child call.",
    mechanisms: [
      {
        step: 1,
        title: "Argument Marshaling & Pre-Call Alignment",
        detail:
          "Caller places arguments into ABI registers (e.g., RDI..R9), saves any live caller-saved values it still needs after the call, and ensures RSP is 16-byte aligned.",
        stateNote: "RSP % 16 == 0 (System V before CALL)",
      },
      {
        step: 2,
        title: "Control Transfer & Return Address Capture",
        detail:
          "x86-64 `CALL` pushes RIP+len onto [RSP-8] and decrements RSP by 8. ARM64 `BL` / RISC-V `JAL` writes the return address into Link Register LR/ra without touching memory.",
        stateNote: "x86: RSP -= 8, [RSP]=ret | ARM64: X30 <= PC+4",
      },
      {
        step: 3,
        title: "Callee Prologue",
        detail:
          "If non-leaf or using locals, callee pushes saved frame pointer / LR / used callee-saved registers and subtracts frame size from SP.",
        stateNote: "x86: push rbp; mov rbp, rsp; sub rsp, N",
      },
      {
        step: 4,
        title: "Body Execution & Local Access",
        detail:
          "Function executes using volatile scratch registers freely, accessing locals via offsets from SP or FP while respecting any child call alignments.",
        stateNote: "Locals at [rbp - 8] or [sp + offset]",
      },
      {
        step: 5,
        title: "Epilogue & Return",
        detail:
          "Callee places return value in RAX/X0/a0, restores callee-saved registers and SP, and executes `RET` (popping RIP on x86-64 or branching to LR/ra on ARM64/RISC-V).",
        stateNote: "mov rsp, rbp; pop rbp; ret (RSP back to caller's value)",
      },
    ],
    mathNotes: [
      {
        title: "x86-64 System V Call-Boundary Stack Alignment",
        latex: "\\text{RSP}_{\\text{before CALL}} \\equiv 0 \\pmod{16} \\implies \\text{RSP}_{\\text{at callee entry}} \\equiv 8 \\pmod{16}",
        explanation:
          "Because the x86-64 CALL instruction pushes an 8-byte return address, RSP arrives inside the callee congruent to 8 mod 16. Pushing an 8-byte register (like RBP) or subtracting (16k + 8) bytes restores 16-byte alignment for child calls and 128-bit SIMD spills.",
      },
    ],
    diagram: {
      title: "Downward-Growing x86-64 Stack Frame Layout",
      caption:
        "High addresses sit at the top (caller frame); RSP decrements downward toward lower addresses as frames and locals are pushed.",
      nodes: [
        {
          id: "caller",
          label: "Caller Frame (High Addr)",
          sublabel: "Saved state + 7th+ stack args",
          x: 240,
          y: 30,
          tone: "neutral",
        },
        {
          id: "ret",
          label: "Return Address (8 B)",
          sublabel: "Pushed by CALL @ [RBP+8]",
          x: 240,
          y: 115,
          tone: "amber",
        },
        {
          id: "rbp",
          label: "Saved RBP (8 B)",
          sublabel: "Old Frame Pointer <- RBP",
          x: 240,
          y: 200,
          tone: "accent",
        },
        {
          id: "locals",
          label: "Callee-Saved + Locals",
          sublabel: "RBX/R12..R15 + [RBP - offset]",
          x: 240,
          y: 285,
          tone: "emerald",
        },
        {
          id: "sp",
          label: "Top of Stack <- RSP",
          sublabel: "16-byte aligned before next CALL",
          x: 530,
          y: 285,
          tone: "accent",
        },
      ],
      edges: [
        { from: "caller", to: "ret", label: "CALL pushes RIP" },
        { from: "ret", to: "rbp", label: "push rbp" },
        { from: "rbp", to: "locals", label: "sub rsp, N" },
        { from: "locals", to: "sp", label: "Grows Downward" },
      ],
    },
    codeExamples: [
      {
        title: "Recursive Factorial Stack Frame Trace (x86-64 System V)",
        language: "asm",
        code: `; uint64_t fact(uint64_t n)  // RDI = n, returns RAX
fact:
    cmp  rdi, 1
    ja   .recurse
    mov  eax, 1            ; base case: return 1 (leaf path, no stack frame needed!)
    ret
.recurse:
    push rbx               ; save callee-saved RBX (8B -> RSP now 16-byte aligned!)
    mov  rbx, rdi          ; keep n across recursive call in callee-saved RBX
    lea  rdi, [rdi - 1]    ; arg0 = n - 1
    call fact              ; RSP%16==0 before CALL; pushes 8B ret addr
    imul rax, rbx          ; rax = n * fact(n - 1)
    pop  rbx               ; restore caller's RBX
    ret`,
        explanation:
          "Notice the elegance of System V alignment: at `.recurse` entry, RSP % 16 == 8 (due to CALL's return address). Pushing the single 8-byte callee-saved RBX both preserves RBX and aligns RSP to 16 bytes for the recursive `call fact`!",
        output: `Call fact(3) with RSP = 0x7FFFFFFFE000:
  CALL pushes ret -> RSP = 0x7FFFFFFFDFF8 (mod 16 == 8)
  push rbx        -> RSP = 0x7FFFFFFFDFF0 (mod 16 == 0)
  call fact(2)    -> pushes ret -> RSP = 0x7FFFFFFFDFE8
  ...base case returns 1 -> unwinds -> returns RAX = 6, RSP = 0x7FFFFFFFE000`,
      },
      {
        title: "ARM64 Non-Leaf Prologue Saving Frame & Link Register (AAPCS64)",
        language: "asm",
        code: `// int64_t wrapper(int64_t a, int64_t b)
// X0 = a, X1 = b; calls helper(a + b)
wrapper:
    stp  x29, x30, [sp, #-16]!  // pre-decrement SP by 16B; save FP(x29) and LR(x30)
    mov  x29, sp                // establish frame pointer
    add  x0, x0, x1             // X0 = a + b
    bl   helper                 // BL overwrites X30 (LR) with return PC+4!
    ldp  x29, x30, [sp], #16    // restore FP & LR, post-increment SP by 16B
    ret                         // branch to restored X30`,
        explanation:
          "Because ARM64 `bl helper` overwrites X30 (LR), any non-leaf function must save X30 onto the stack before calling a child function. `stp` pairs X29 and X30 into one 16-byte aligned store.",
        output: `SP before wrapper: 0xFFFFFFFFF000
After stp:         0xFFFFFFFFEFE0 (16B aligned, stores X29 & X30)
After ldp + ret:   0xFFFFFFFFF000 (returns cleanly to wrapper's caller)`,
      },
    ],
    connections: [
      {
        lessonSlug: "isa-opcodes-x86-arm-riscv",
        relationship:
          "Applies the register sets and jump/branch instructions introduced in Lesson 16 to build multi-function programs.",
      },
      {
        lessonSlug: "processes-threads-scheduling",
        relationship:
          "OS threads each require their own isolated call stack and saved register state during context switches.",
      },
      {
        lessonSlug: "c-and-rust-memory-models",
        relationship:
          "Explains why C local variables become invalid dangling pointers once a function returns and pops its stack frame.",
      },
    ],
    realWorldApplications: [
      {
        title: "Textbook Frame-Pointer Chains vs. DWARF Stack Unwinding",
        simplifiedVsReal:
          "Textbooks always set `RBP`/`FP` in every function so debuggers can walk a simple linked list of frames. To free up `RBP` as an extra general-purpose register, optimizing compilers historically used `-fomit-frame-pointer` and emitted separate `.eh_frame` DWARF unwinding metadata.",
        modernExample:
          "Production Linux distributions (Fedora, Ubuntu) and macOS/ARM64 now increasingly compile with `-fno-omit-frame-pointer` so kernel eBPF/`perf` continuous profilers can unwind call stacks in nanoseconds without parsing heavy DWARF tables.",
      },
      {
        title: "User-Space Red Zone vs. Kernel Stack Constraints",
        simplifiedVsReal:
          "User-space System V AMD64 allows leaf functions to touch 128 bytes below `RSP` (`[rsp - 8]`) without subtracting `RSP`. Kernel code cannot use this optimization because hardware interrupts push CPU state onto the active kernel stack asynchronously.",
        modernExample:
          "Both the Linux kernel and Windows x64 ABI forbid the Red Zone (compiling kernel C with `-mno-red-zone`), whereas Windows x64 allocates a 32-byte 'shadow space' above the return address instead.",
      },
    ],
    misconceptions: [
      {
        myth: "Popping a stack frame zeros out all local variables in RAM.",
        reality:
          "Returning only increments `RSP` (or `SP`). The old bytes remain untouched in stack memory until overwritten by a future function call—which is why uninitialized locals often inherit garbage values and why dangling pointers to stack locals cause subtle corruption.",
      },
      {
        myth: "Windows and Linux on the exact same x86-64 CPU use the same calling convention.",
        reality:
          "Calling conventions are OS/ABI contracts, not hardware rules! Linux/macOS follow System V AMD64 (6 integer args: RDI, RSI, RDX, RCX, R8, R9), whereas Windows x64 uses RCX, RDX, R8, R9 (4 args) + 32-byte shadow space.",
      },
    ],
    deepDive: {
      title: "Why Stack Misalignment Crashes SSE/AVX Code",
      content:
        "You may wonder why System V AMD64 and AAPCS64 care so much about 16-byte stack alignment when integer `push` and `pop` only move 8 bytes at a time. The culprit is 128-bit SIMD memory instructions such as x86-64 `MOVAPS` (Move Aligned Packed Single-Precision). To guarantee a 16-byte load never straddles two cache lines or page boundaries, hardware requires the effective memory address of `MOVAPS` to be divisible by 16—raising a General Protection Fault (`#GP` / `SIGSEGV`) if `addr % 16 != 0`.\n\nWhen `printf()` or `memcpy()` inside `glibc` executes `MOVAPS [rsp + 0x10], xmm0`, it assumes the caller honored the ABI's 16-byte alignment rule prior to `CALL`. A handwritten assembly function that omits an 8-byte pad before `call printf` will mysteriously crash inside `libc`!",
    },
    revisionNotes: [
      "Stacks grow downward toward lower addresses; allocating frame space subtracts from SP/RSP.",
      "x86-64 CALL pushes RIP onto [RSP-8]; ARM64 BL and RISC-V JAL write the return address into Link Register LR/ra.",
      "System V AMD64 passes 6 int args in RDI, RSI, RDX, RCX, R8, R9; returns in RAX; requires RSP % 16 == 0 before CALL.",
      "Caller-saved (volatile) registers need no preservation by callee; callee-saved registers (RBX, RBP, R12–R15) must be saved/restored if modified.",
      "Tail-call optimization replaces a tail CALL+RET with a single JMP, reusing the current stack frame.",
    ],
    glossaryTermIds: ["call-stack", "abi", "caller-callee-saved", "addressing-mode"],
    references: [
      {
        title: "System V Application Binary Interface: AMD64 Architecture Processor Supplement",
        author: "H.J. Lu, Michael Matz, Jan Hubicka, Andreas Jaeger",
        url: "https://gitlab.com/x86-psABIs/x86-64-ABI",
        type: "spec",
        note: "Official Linux/BSD x86-64 ABI defining register assignment, alignment, and red zone.",
      },
      {
        title: "Procedure Call Standard for the Arm 64-bit Architecture (AAPCS64)",
        author: "Arm Limited",
        url: "https://github.com/ARM-software/abi-aa/blob/main/aapcs64/aapcs64.rst",
        type: "spec",
        note: "Authoritative ARM64 calling convention covering X0–X30, SP alignment, and stack frames.",
      },
      {
        title: "Computer Systems: A Programmer's Perspective (Section 3.7: Procedures)",
        author: "Randal E. Bryant & David R. O'Hallaron",
        url: "https://csapp.cs.cmu.edu/",
        type: "book",
        note: "Step-by-step diagrams of x86-64 stack frames, recursion, and register saving.",
      },
    ],
    assessments: [
      {
        id: "l17-q1",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "Under the x86-64 System V ABI, `RSP` inside `main` is `0x7FFFFFFFE000` (16-byte aligned) immediately before executing `call helper`. Inside `helper`, the prologue runs `push rbp`, `push rbx`, and `sub rsp, 32`. What is `RSP` (in hex, convert or enter the decimal offset subtracted from `0x7FFFFFFFE000` — specifically, how many total bytes was `RSP` decremented from `0x7FFFFFFFE000` by `call` + prologue)?",
        correctAnswer: 56,
        numericTolerance: 0,
        hints: [
          "Count bytes pushed by `call` (8), `push rbp` (8), `push rbx` (8), and `sub rsp, 32` (32).",
        ],
        explanation:
          "`call helper` pushes an 8-byte return address; `push rbp` pushes 8 bytes; `push rbx` pushes 8 bytes; `sub rsp, 32` reserves 32 bytes. Total decrement = 8 + 8 + 8 + 32 = 56 bytes (`0x38`), yielding `0x7FFFFFFFDFC8` (notice `...C8 % 16 == 8`, so another 8-byte push or `sub rsp, 8` would be needed before calling a child function).",
        conceptTag: "stack-frame-arithmetic",
      },
      {
        id: "l17-q2",
        type: "debugging",
        difficulty: "rigorous",
        prompt:
          "A handwritten x86-64 System V function `compute()` enters from `main`, immediately reserves 16 bytes with `sub rsp, 16`, writes a local variable, and calls `printf`. Inside `printf`, the program crashes with `SIGSEGV` on `movaps [rsp+0x10], xmm0`. Why?",
        codeSnippet: `compute:
    sub  rsp, 16
    lea  rdi, [rel fmt]
    mov  esi, 42
    xor  eax, eax
    call printf
    add  rsp, 16
    ret`,
        codeLanguage: "asm",
        options: [
          {
            id: "a",
            text: "`call compute` pushed 8 bytes making `RSP % 16 == 8`; subtracting 16 leaves `RSP % 16 == 8` before `call printf`, violating the 16-byte ABI alignment.",
            explanation:
              "Correct! Subtracting an even multiple of 16 (or nothing) keeps RSP misaligned by 8 bytes. `sub rsp, 8` or `sub rsp, 24` (or `push rbp`) is required to restore RSP % 16 == 0 before `call printf`.",
          },
          {
            id: "b",
            text: "`xor eax, eax` cleared the return address.",
            explanation:
              "`EAX` holds the count of vector registers for variadic `printf`, not the return address.",
          },
          {
            id: "c",
            text: "`printf` expects arguments in `RAX` and `RBX`, not `RDI` and `ESI`.",
            explanation:
              "System V AMD64 passes arguments 1 and 2 in `RDI` and `RSI`/`ESI`.",
          },
          {
            id: "d",
            text: "Local variables must be allocated with `add rsp, 16` instead of `sub`.",
            explanation:
              "The stack grows downward, so allocation always subtracts from `RSP`.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Check `RSP % 16` right after `call compute` enters `compute`, then after `sub rsp, 16`.",
        ],
        explanation:
          "Upon entering `compute`, `call` has pushed an 8-byte return address (`RSP % 16 == 8`). Subtracting 16 leaves `RSP % 16 == 8` when `call printf` runs, causing `printf`'s 16-byte aligned `MOVAPS` spill to fault.",
        conceptTag: "abi-alignment",
      },
      {
        id: "l17-q3",
        type: "multi-select",
        difficulty: "intermediate",
        prompt:
          "Which statements are TRUE under the x86-64 System V AMD64 ABI?",
        options: [
          {
            id: "a",
            text: "A callee that modifies `RBX` or `R12` must save and restore their original values before returning.",
            explanation:
              "Correct—`RBX`, `RBP`, and `R12`–`R15` are callee-saved (non-volatile).",
          },
          {
            id: "b",
            text: "The first four integer arguments are passed in `RCX, RDX, R8, R9`.",
            explanation:
              "Incorrect—that is the Windows x64 ABI. System V uses `RDI, RSI, RDX, RCX, R8, R9`.",
          },
          {
            id: "c",
            text: "A callee may freely overwrite `RDI`, `RSI`, and `R10` without saving them to the stack.",
            explanation:
              "Correct—argument and scratch registers (`RAX, RCX, RDX, RSI, RDI, R8–R11`) are caller-saved (volatile).",
          },
          {
            id: "d",
            text: "A 64-bit integer return value is returned in `RAX`.",
            explanation: "Correct—`RAX` (and `RDX` for 128-bit values) holds integer return values.",
          },
        ],
        correctAnswer: ["a", "c", "d"],
        hints: [
          "Watch out for the Windows x64 register list pretending to be System V!",
        ],
        explanation:
          "Under System V AMD64, `RDI..R9` pass integer args, `RAX` returns results, `RAX/RCX/RDX/RSI/RDI/R8-R11` are volatile (caller-saved), and `RBX/RBP/R12-R15` are callee-saved.",
        conceptTag: "system-v-abi",
      },
      {
        id: "l17-q4",
        type: "ordering",
        difficulty: "foundational",
        prompt:
          "Order the hardware and ABI steps when a caller invokes a non-leaf function on ARM64 (AAPCS64) and receives its result.",
        orderingItems: [
          "Callee runs `ldp x29, x30, [sp], #16` and `ret`",
          "Caller places arguments in X0..X7 and executes `bl callee` (setting LR/X30)",
          "Callee prologue saves X29 and X30 onto the stack with `stp x29, x30, [sp, #-16]!`",
          "Callee places return value into X0 after calling any child functions",
        ],
        correctAnswer: [
          "Caller places arguments in X0..X7 and executes `bl callee` (setting LR/X30)",
          "Callee prologue saves X29 and X30 onto the stack with `stp x29, x30, [sp, #-16]!`",
          "Callee places return value into X0 after calling any child functions",
          "Callee runs `ldp x29, x30, [sp], #16` and `ret`",
        ],
        hints: [
          "Remember that `bl` updates `X30` first, and a non-leaf callee must save `X30` before making nested calls.",
        ],
        explanation:
          "Caller sets X0..X7 and calls `bl`; non-leaf callee saves FP/LR (`x29/x30`), runs its body and places the return value in `X0`, then restores `x29/x30` in the epilogue and executes `ret`.",
        conceptTag: "arm64-call-sequence",
      },
    ],
  },

  // =========================================================================
  // LESSON 18: SRAM, DRAM Refresh & Memory Timing
  // =========================================================================
  {
    id: "sram-dram-memory-cells",
    slug: "sram-dram-memory-cells",
    number: 18,
    title: "SRAM, DRAM Refresh & Memory Timing",
    subtitle:
      "Inside 6T SRAM flip-flop arrays and 1T1C DRAM capacitor banks: destructive reads, sense amplifiers, refresh intervals, row-buffer timing, and DDR bandwidth.",
    trackId: "track-2",
    domainId: "memory-storage",
    moduleTitle: "Module 7: Memory Hierarchy & Storage Hardware",
    chapterTitle: "Chapter 7: SRAM, DRAM, Caches & Flash",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["sequential-logic-flip-flops", "von-neumann-vs-harvard"],
    objectives: [
      "Compare the transistor structure, density, speed, and energy characteristics of 6T SRAM cells vs. 1T1C DRAM cells.",
      "Trace a DRAM read/write cycle through row activation (tRCD), sense-amplifier restoration, column access (tCL), and precharge (tRP).",
      "Calculate DRAM refresh overhead and theoretical DDR5 peak memory bandwidth from bus width, data rate, and channels.",
      "Explain how row-buffer locality and bank parallelism dramatically change real-world DRAM latency and throughput.",
    ],
    depthExplanations: {
      beginner:
        "Why don't computers just build 64 gigabytes of CPU-speed memory? Because fast memory and dense memory use completely different physics! **SRAM** (used in CPU caches) holds every bit using six transistors locked together like a tiny tug-of-war latch—super fast, never forgets while powered, but bulky and expensive. **DRAM** (your main RAM sticks) stores each bit as a tiny puddle of electrons on a microscopic capacitor behind a single transistor—ten times denser and cheaper, but the electrons leak away in milliseconds so the memory controller has to constantly refresh every row.",
      intermediate:
        "A **6T SRAM** bitcell pairs two cross-coupled CMOS inverters (4 transistors) with two NMOS access transistors gated by a Wordline (`WL`) onto differential Bitlines (`BL`, `~BL`). Because active feedback holds the voltage indefinitely, SRAM needs no refresh and switches in sub-nanosecond time—ideal for CPU registers and L1/L2/L3 caches.\n\nA **1T1C DRAM** cell shrinks storage down to one access MOSFET and one femtofarad-scale trench or stacked capacitor ($C_{\\text{cell}} \\approx 20\\text{–}30\\text{ fF}$). Reading a DRAM row shares charge onto long bitlines ($C_{\\text{BL}} \\gg C_{\\text{cell}}$), creating a tiny $\\sim 50\\text{–}100\\text{ mV}$ swing that differential **sense amplifiers** amplify back to full rail—which makes DRAM reads **destructive** unless immediately restored! Because subthreshold leakage drains capacitors within tens of milliseconds, JEDEC mandates periodic auto-refresh (`tREFI` / `tRFC`).",
      advanced:
        "DRAM chips are organized hierarchically into **Channels -> Ranks -> Chips -> Bank Groups -> Banks -> Subarrays (Rows x Columns)**. Each bank holds a single active **Row Buffer** (the sense amplifiers holding e.g. 8 KiB). Accessing an address in an already-open row (**Row Hit**) only pays Column Access Strobe latency (`tCL`, $\\sim 14\\text{ ns}$). Accessing a different row in the same bank (**Row Conflict**) forces `PRECHARGE` (`tRP`) to close the current row, `ACTIVATE` (`tRCD`) to sense the new row, and then `READ` (`tCL`), tripling latency to $\\sim 40\\text{–}50\\text{ ns}$ on top of controller/fabric delays.\n\nHigh-density scaling also exposes **Rowhammer**: repeatedly toggling (`ACTIVATE`/`PRECHARGE`) an aggressor wordline hundreds of thousands of times inside a refresh window couples electromagnetic/charge leakage into neighboring victim rows, flipping bits—mitigated in DDR5 via Target Row Refresh (TRR), Refresh Management (RFM), and on-die ECC.",
    },
    intuition:
      "SRAM is a self-powered latching switch (instant, wide, expensive), whereas DRAM is a leaky bucket that requires a pump crew (the sense amplifiers) to top up every row before it dries out—and reading a bucket dumps it into the measuring cup so it must be poured right back.",
    technicalTheory:
      "In a **6T SRAM** cell, cross-coupled inverters store $Q$ and $\\overline{Q}$ statically. Raising Wordline `WL` connects both sides to precharged differential bitlines `BL` and `\\overline{BL}`; whichever side stores `0` pulls its bitline slightly downward, and a fast differential sense amplifier resolves the bit without disturbing the latch (when properly sized for read stability).\n\nIn a **1T1C DRAM** cell, stored charge $Q = C_{\\text{cell}} V_{DD}$ (for logic `1`) or $0$ (for logic `0`) decays exponentially via subthreshold and junction leakage. When `WL` rises during `ACTIVATE`, charge sharing between $C_{\\text{cell}}$ and bitline capacitance $C_{\\text{BL}}$ produces a small voltage perturbation:\n$$\\Delta V = \\pm \\frac{V_{DD}}{2} \\cdot \\frac{C_{\\text{cell}}}{C_{\\text{cell}} + C_{\\text{BL}}}$$\nBecause $C_{\\text{BL}}$ is roughly $5\\text{–}10\\times$ larger than $C_{\\text{cell}}$, $\\Delta V$ is only tens of millivolts. The sense amplifier latches this polarity to full $0$ or $V_{DD}$, simultaneously **writing back (restoring)** the full charge into the cell capacitors of that entire row.\n\n**DRAM Timing & Bandwidth:**\nMemory datasheets report cycle counts like `CL-tRCD-tRP-tRAS` (e.g., `32-39-39-76` at DDR5-6400, where I/O clock $f_{\\text{CK}} = 3.2\\text{ GHz}$ transfers data on both rising and falling edges for $6400\\text{ MT/s}$). Peak theoretical bandwidth per channel across an $8\\text{ B}$ (64-bit) data bus is:\n$$\\text{BW}_{\\text{peak}} = \\text{Data Rate (MT/s)} \\times \\text{Bus Width (Bytes)} \\times N_{\\text{channels}}$$\nTo guarantee data integrity across $N_{\\text{rows}}$ per bank within retention time $T_{\\text{ret}}$ (typically $64\\text{ ms}$, or $32\\text{ ms}$ above $85^\\circ\\text{C}$), the memory controller issues refresh commands every $t_{\\text{REFI}} = T_{\\text{ret}} / N_{\\text{rows}}$ (e.g., $64\\text{ ms} / 8192 = 7.8\\,\\mu\\text{s}$), stalling accesses for duration $t_{\\text{RFC}}$ (~295–410 ns in dense DDR5).",
    mechanisms: [
      {
        step: 1,
        title: "PRECHARGE (tRP): Equalize Bitlines",
        detail:
          "Before opening a new row in a bank, the previous row is written back and bitlines are precharged to V_DD / 2 so small charge-sharing deltas can be detected.",
        stateNote: "BL = ~BL = V_DD / 2 (takes tRP)",
      },
      {
        step: 2,
        title: "ACTIVATE (tRCD): Wordline & Sense-Amp Restoration",
        detail:
          "The Row Decoder raises the target Wordline. All cells in that row dump partial charge onto bitlines; sense amplifiers latch the entire row into the Row Buffer and restore cell charge.",
        stateNote: "Row Buffer <= DRAM Row[r] (takes tRCD)",
      },
      {
        step: 3,
        title: "READ / WRITE (tCL): Column Burst Selection",
        detail:
          "Column Decoder selects a 64-byte burst (e.g., BL16 on DDR5 x32 sub-channels) directly from the fast SRAM-like Row Buffer onto the I/O bus.",
        stateNote: "Row Hit skips Steps 1-2 and pays only tCL!",
      },
      {
        step: 4,
        title: "DDR Double-Edge Data Transfer",
        detail:
          "Data transfers on both rising and falling edges of the differential DQS strobe, delivering 6400 MT/s over a 3.2 GHz clock.",
        stateNote: "DDR5: 2 independent 32-bit(+ECC) sub-channels per DIMM",
      },
      {
        step: 5,
        title: "Periodic Auto-Refresh (tREFI / tRFC)",
        detail:
          "Every ~7.8 us (or 3.9 us at 2x refresh), the memory controller issues REF commands to cycle through internal row counters before capacitor voltage decays below noise margins.",
        stateNote: "Refresh Overhead = tRFC / tREFI (~3–6% capacity-dependent)",
      },
    ],
    mathNotes: [
      {
        title: "DRAM Charge-Sharing Signal Swing",
        latex: "\\Delta V_{\\text{BL}} = \\pm \\frac{V_{DD}}{2} \\cdot \\frac{C_{\\text{cell}}}{C_{\\text{cell}} + C_{\\text{BL}}}",
        explanation:
          "Larger bitline capacitance lowers voltage swing, forcing designers to keep DRAM subarrays short and limiting cell miniaturization below ~10 nm.",
      },
      {
        title: "Dual-Channel DDR5 Peak Bandwidth & Refresh Overhead",
        latex: "\\text{BW}_{\\text{peak}} = R_{\\text{MT/s}} \\times W_{\\text{bytes}} \\times N_{\\text{ch}}, \\qquad \\eta_{\\text{refresh}} = \\frac{t_{\\text{RFC}}}{t_{\\text{REFI}}}",
        explanation:
          "Dual-channel DDR5-6400 (two 64-bit data channels = 16 B total width) yields 6400 MT/s * 16 B = 102.4 GB/s peak theoretical bandwidth.",
      },
    ],
    diagram: {
      title: "6T SRAM Latch vs. 1T1C DRAM Bank & Row Buffer",
      caption:
        "SRAM regenerates state actively inside each bitcell; DRAM relies on destructive capacitor charge sharing into a shared per-bank Row Buffer.",
      nodes: [
        {
          id: "sram",
          label: "6T SRAM Cell",
          sublabel: "Cross-coupled CMOS + 2 access FETs",
          x: 40,
          y: 45,
          tone: "emerald",
        },
        {
          id: "dram_cell",
          label: "1T1C DRAM Cell",
          sublabel: "1 FET + Capacitor (leaky)",
          x: 40,
          y: 195,
          tone: "amber",
        },
        {
          id: "sense",
          label: "Sense Amp / Row Buffer",
          sublabel: "Amplifies ~80 mV & restores row",
          x: 340,
          y: 195,
          tone: "accent",
        },
        {
          id: "col",
          label: "Column Mux & DDR I/O",
          sublabel: "tCL burst on rising+falling edges",
          x: 640,
          y: 120,
          tone: "neutral",
        },
      ],
      edges: [
        { from: "sram", to: "col", label: "Direct Diff Bitlines (<1 ns)" },
        { from: "dram_cell", to: "sense", label: "ACTIVATE (tRCD)" },
        { from: "sense", to: "dram_cell", label: "Destructive Restore" },
        { from: "sense", to: "col", label: "CAS Burst (tCL)" },
      ],
    },
    codeExamples: [
      {
        title: "DRAM Timing, Bandwidth & Refresh Overhead Calculator (Python)",
        language: "python",
        code: `def dram_metrics(mt_per_s: float, channels: int, cl: int, trcd: int, trp: int,
                 t_refi_us: float, t_rfc_ns: float) -> None:
    # Each standard DDR channel is 64 bits = 8 bytes wide
    peak_gb_s = (mt_per_s * 1e6 * 8 * channels) / 1e9
    # DDR command clock is half the MT/s transfer rate
    f_cmd_ghz = (mt_per_s / 2.0) / 1000.0
    t_ck_ns = 1.0 / f_cmd_ghz

    row_hit_ns = cl * t_ck_ns
    row_miss_ns = (trp + trcd + cl) * t_ck_ns
    refresh_pct = (t_rfc_ns / (t_refi_us * 1000.0)) * 100.0

    print(f"DDR5-{int(mt_per_s)} ({channels}ch): Peak BW = {peak_gb_s:.1f} GB/s")
    print(f"Command Clock = {f_cmd_ghz:.2f} GHz (tCK = {t_ck_ns:.4f} ns)")
    print(f"Row-Buffer Hit CAS = {row_hit_ns:.2f} ns | Row-Conflict (tRP+tRCD+tCL) = {row_miss_ns:.2f} ns")
    print(f"Refresh Overhead = {refresh_pct:.2f}% (tRFC={t_rfc_ns} ns / tREFI={t_refi_us} us)")

dram_metrics(mt_per_s=6400, channels=2, cl=32, trcd=39, trp=39, t_refi_us=3.9, t_rfc_ns=295)`,
        explanation:
          "Even though DDR5-6400 transfers 6.4 billion times per second on the pins, the underlying DRAM array command clock runs at 3.2 GHz (tCK = 0.3125 ns), so CL=32 takes 10.0 ns and a row conflict takes 34.4 ns before memory-controller and CPU fabric delays.",
        output: `DDR5-6400 (2ch): Peak BW = 102.4 GB/s
Command Clock = 3.20 GHz (tCK = 0.3125 ns)
Row-Buffer Hit CAS = 10.00 ns | Row-Conflict (tRP+tRCD+tCL) = 34.38 ns
Refresh Overhead = 7.56% (tRFC=295 ns / tREFI=3.9 us)`,
      },
    ],
    connections: [
      {
        lessonSlug: "sequential-logic-flip-flops",
        relationship:
          "6T SRAM extends the bistable feedback concept of clocked latches down to an area-optimized 6-transistor bitcell.",
      },
      {
        lessonSlug: "cache-hierarchies-coherence",
        relationship:
          "Explains why CPUs buffer slow DRAM behind multi-level SRAM caches to hide 50–100 ns main memory latency.",
      },
      {
        lessonSlug: "flash-ssd-storage-controllers",
        relationship:
          "Contrasts volatile SRAM and capacitor DRAM with non-volatile charge-trap NAND flash storage.",
      },
    ],
    realWorldApplications: [
      {
        title: "Single-Bank Textbook RAM vs. Multi-Bank DDR5 & HBM3e",
        simplifiedVsReal:
          "Textbooks often model main memory as a uniform array with fixed 100-cycle latency. Real DDR5 splits a DIMM into two independent 32-bit (+8-bit ECC) sub-channels with 32 banks per chip so controllers reorder requests (FR-FCFS) to hit open row buffers and interleave banks.",
        modernExample:
          "AI accelerators replace wide off-package DIMMs with 3D-stacked HBM3e DRAM dies over a 1024-bit silicon interposer, exceeding 1.2 TB/s per stack while keeping refresh and bank scheduling active underneath.",
      },
      {
        title: "Ideal Isolation vs. Rowhammer & On-Die ECC",
        simplifiedVsReal:
          "Software treats RAM addresses as electrically isolated bits. In dense sub-15nm DRAM, rapid row activations leak charge across adjacent wordlines (Rowhammer), and single-event upsets require error correction.",
        modernExample:
          "DDR5 mandates on-die Hamming ECC on every DRAM chip internally (storing 136 bits per 128 data bits) plus Refresh Management (RFM) counters to defend against Rowhammer.",
      },
    ],
    misconceptions: [
      {
        myth: "DDR5-6400 runs its internal memory array at 6.4 GHz.",
        reality:
          "6400 MT/s (megatransfers/second) uses Double Data Rate on a 3.2 GHz I/O clock, while the internal DRAM array core operates far slower (~200–400 MHz), relying on wide 16n prefetch buffers to feed the fast pins.",
      },
      {
        myth: "SRAM also needs periodic refresh cycles like DRAM, just less often.",
        reality:
          "SRAM is static: its cross-coupled CMOS inverters actively replenish charge from VDD and GND continuously, requiring zero refresh cycles as long as power stays applied.",
      },
      {
        myth: "A DRAM read leaves the capacitor untouched.",
        reality:
          "Reading a 1T1C cell drains its capacitor charge onto the bitline; the sense amplifier must immediately restore (write back) the full voltage during the ACTIVATE phase.",
      },
    ],
    deepDive: {
      title: "Rowhammer Physics and Target Row Refresh (TRR)",
      content:
        "As DRAM pitch shrank below 20 nm, the physical spacing between parallel polysilicon wordlines narrowed to a few dozen silicon atoms. Each time a wordline switches from $0\\text{ V}$ to $V_{PP}$ (~2.5 V) during an `ACTIVATE` command, capacitive coupling and subthreshold trap-assisted tunneling inject stray electrons into neighboring rows' capacitors.\n\nIf an unprivileged process repeatedly reads two addresses mapping to the same bank but different rows (`clflush` + `mov` loop) at ~100k activations per 64 ms refresh window, adjacent victim rows can flip bits—allowing attackers to escalate kernel privileges by flipping page-table bits. Modern memory controllers and DDR5 DRAM track per-row activation counts and issue targeted neighbor refreshes (RFM/TRR) before flips accumulate.",
    },
    revisionNotes: [
      "6T SRAM uses 6 transistors (bistable inverter pair + 2 access FETs): fast (~1 ns), no refresh, low density -> CPU caches.",
      "1T1C DRAM uses 1 transistor + 1 capacitor: dense and cheap, leaky (needs periodic refresh every ~3.9–7.8 us), destructive reads.",
      "DRAM latency depends heavily on Row Buffer state: Row Hit pays only tCL; Row Conflict pays tRP + tRCD + tCL.",
      "Peak DDR bandwidth = Transfer Rate (MT/s) * Channel Width (8 B) * Channel Count.",
      "Rowhammer exploits rapid row activations to disturb charge in physically adjacent DRAM rows.",
    ],
    glossaryTermIds: ["sram-cell", "dram-refresh"],
    references: [
      {
        title: "What Every Programmer Should Know About Memory (Section 2: Commodity Hardware)",
        author: "Ulrich Drepper",
        url: "https://people.freebsd.org/~lstewart/articles/cpumemory.pdf",
        type: "paper",
        note: "Classic systems reference explaining 6T SRAM, 1T1C DRAM sensing, precharge, CAS, and refresh timing.",
      },
      {
        title: "Memory Systems: Cache, DRAM, Disk",
        author: "Bruce Jacob, Spencer Ng, & David Wang",
        url: "https://www.elsevier.com/books/memory-systems/jacob/978-0-12-379751-3",
        type: "book",
        note: "Deep engineering reference on DRAM banks, row buffers, DDR signaling, and refresh mechanics.",
      },
      {
        title: "JEDEC DDR5 SDRAM Standard (JESD79-5)",
        author: "JEDEC Solid State Technology Association",
        url: "https://www.jedec.org/standards-documents/docs/jesd79-5",
        type: "spec",
        note: "Official specification for DDR5 sub-channels, on-die ECC, tREFI/tRFC, and Refresh Management.",
      },
    ],
    assessments: [
      {
        id: "l18-q1",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "Why is reading a 1T1C DRAM cell physically destructive, and how does the DRAM chip prevent data loss?",
        options: [
          {
            id: "a",
            text: "Opening the access transistor drains the cell capacitor onto the bitline; the sense amplifier latches the voltage delta and writes full charge back into the row.",
            explanation:
              "Correct! Charge sharing flattens the cell voltage onto the much larger bitline capacitance, so the sense amplifier must restore VDD/0V back into the row.",
          },
          {
            id: "b",
            text: "Reading heats the silicon above 100 C, requiring an immediate ECC scrub from the SSD.",
            explanation: "DRAM reads are restored locally on-die by sense amplifiers.",
          },
          {
            id: "c",
            text: "DRAM cells use cross-coupled inverters that invert their value on every read.",
            explanation: "Cross-coupled inverters describe SRAM, not 1T1C DRAM.",
          },
          {
            id: "d",
            text: "The CPU L1 cache automatically mirrors all DRAM rows and rewrites them after every load.",
            explanation: "CPU caches are orders of magnitude smaller than DRAM and do not manage DRAM restoration.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Trace what happens to the tiny cell capacitor when the wordline turns on the access transistor.",
        ],
        explanation:
          "When `ACTIVATE` turns on the row's access transistors, cell charge shares with the high-capacitance bitline. The sense amplifier detects the +/-50-100 mV shift, amplifies it to full rail, and immediately restores the row's capacitors.",
        conceptTag: "dram-destructive-read",
      },
      {
        id: "l18-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A dual-channel (2 x 64-bit data bus) DDR5-5600 system runs at 5600 MT/s per channel. What is its theoretical peak memory bandwidth in GB/s?",
        latex: "\\text{BW} = 5600\\text{ MT/s} \\times 8\\text{ B/channel} \\times 2\\text{ channels}",
        correctAnswer: 89.6,
        numericTolerance: 0.2,
        hints: [
          "Each 64-bit channel is 8 bytes wide; multiply 5.6 GT/s * 8 B * 2.",
        ],
        explanation:
          "5600 MT/s = 5.6 x 10^9 transfers/sec. Across two 8-byte (64-bit) channels (16 bytes total), peak bandwidth = 5.6 * 16 = 89.6 GB/s.",
        conceptTag: "ddr-bandwidth",
      },
      {
        id: "l18-q3",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: 6T SRAM cells require periodic refresh commands from the memory controller every 64 ms to retain stored bits while powered.",
        correctAnswer: false,
        hints: [
          "Compare 'Static' RAM (cross-coupled inverters) vs. 'Dynamic' RAM (capacitors).",
        ],
        explanation:
          "False. SRAM uses cross-coupled CMOS inverters continuously connected to power and ground, retaining state indefinitely while powered without refresh.",
        conceptTag: "sram-vs-dram",
      },
      {
        id: "l18-q4",
        type: "matching",
        difficulty: "intermediate",
        prompt: "Match each JEDEC DRAM timing parameter to its physical operation.",
        matchingPairs: [
          {
            id: "m1",
            left: "tRCD",
            right: "Row-to-Column Delay: time from ACTIVATE until sense amps latch the row",
          },
          {
            id: "m2",
            left: "tCL (CAS)",
            right: "Column Latency: time from READ command to first data burst on pins",
          },
          {
            id: "m3",
            left: "tRP",
            right: "Row Precharge: time to close an active row and equalize bitlines",
          },
          {
            id: "m4",
            left: "tREFI",
            right: "Average interval between periodic refresh commands to avoid capacitor decay",
          },
        ],
        correctAnswer: {
          m1: "Row-to-Column Delay: time from ACTIVATE until sense amps latch the row",
          m2: "Column Latency: time from READ command to first data burst on pins",
          m3: "Row Precharge: time to close an active row and equalize bitlines",
          m4: "Average interval between periodic refresh commands to avoid capacitor decay",
        },
        hints: [
          "RCD = RAS to CAS Delay; RP = Row Precharge; REFI = Refresh Interval.",
        ],
        explanation:
          "tRP closes the previous row, tRCD activates the new row into sense amplifiers, tCL reads columns from the row buffer, and tREFI schedules periodic capacitor refreshes.",
        conceptTag: "dram-timing",
      },
    ],
  },

  // =========================================================================
  // LESSON 19: CPU Cache Hierarchies, Locality & MESI Coherence
  // =========================================================================
  {
    id: "cache-hierarchies-coherence",
    slug: "cache-hierarchies-coherence",
    number: 19,
    title: "CPU Cache Hierarchies, Locality & MESI Coherence",
    subtitle:
      "Closing the 100x processor-memory gap with temporal/spatial locality, Tag/Index/Offset geometry, AMAT, write policies, and multi-core MESI coherence.",
    trackId: "track-2",
    domainId: "memory-storage",
    moduleTitle: "Module 7: Memory Hierarchy & Storage Hardware",
    chapterTitle: "Chapter 7: SRAM, DRAM, Caches & Flash",
    estimatedMinutes: 50,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["sram-dram-memory-cells"],
    objectives: [
      "Decompose any memory address into Tag, Set Index, and Block Offset bits for direct-mapped and N-way set-associative caches.",
      "Classify cache misses into the 3Cs (Compulsory, Capacity, Conflict) and evaluate multi-level Average Memory Access Time (AMAT).",
      "Compare write-through vs. write-back (with dirty bit) and write-allocate policies.",
      "Trace MESI cache coherence transitions across multiple cores and diagnose false sharing in multi-threaded code.",
    ],
    depthExplanations: {
      beginner:
        "A modern CPU executes an addition in less than half a nanosecond, while fetching a number from main DRAM takes ~80–100 nanoseconds—roughly 200 wasted clock cycles waiting! CPU caches solve this by placing tiny, ultra-fast SRAM shelves (L1, L2, L3) right next to the execution units. Because programs tend to reuse the same variables (**temporal locality**) and step through neighboring array elements (**spatial locality**), keeping recently touched 64-byte chunks in cache gives you DRAM's huge capacity at nearly SRAM's speed.",
      intermediate:
        "Hardware organizes a cache of total data capacity $C$, block/line size $B$ (typically 64 bytes), and associativity $W$ ways into $S = C / (W \\cdot B)$ sets. Every physical address splits into three bitfields from LSB to MSB: **Block Offset** ($b = \\log_2 B$ bits selecting the byte inside a 64B line), **Set Index** ($s = \\log_2 S$ bits choosing which set to search), and **Tag** ($t = A - s - b$ bits stored alongside valid/dirty metadata and compared across all $W$ ways in parallel).\n\nWhen multiple CPU cores cache copies of the same DRAM line in private L1/L2 caches, **MESI coherence** ensures every core sees a consistent view of memory by tagging each cache line **Modified (M)**, **Exclusive (E)**, **Shared (S)**, or **Invalid (I)**. Before writing to a Shared line, a core broadcasts a Read-For-Ownership (`BusRdX`) to invalidate all other cores' copies.",
      advanced:
        "Real CPU hierarchies tune associativity, inclusion, and coherence aggressively. Most L1 caches are **Virtually Indexed, Physically Tagged (VIPT)** so the set index lookup begins in parallel with TLB virtual-to-physical translation—provided $S \\cdot B \\le \\text{PageSize}$ (e.g., 32 KiB 8-way with 64B lines has $64 \\times 64 = 4\\text{ KiB} = \\text{PageSize}$, avoiding virtual aliasing!). Replacement moves beyond strict LRU to tree-based Pseudo-LRU (PLRU) or scan-resistant RRIP.\n\nIn multi-core programming, **false sharing** degrades scaling catastrophically: if Core 0 increments `stats[0]` and Core 1 increments `stats[1]` in adjacent bytes of the same 64-byte cache line, MESI forces continuous `M -> I` cache-line ping-ponging over the interconnect even though the threads touch disjoint variables. Padding per-thread counters to 64-byte (`alignas(64)`) cache-line boundaries eliminates false sharing completely.",
    },
    intuition:
      "A cache is a desk next to a giant basement warehouse (DRAM): temporal locality keeps the book you're reading on your desk, spatial locality brings the entire 64-byte folder whenever you ask for one page, and MESI is the library rule forcing everyone else to cross out their sticky-note copy before you edit a shared page.",
    technicalTheory:
      "Given an $A$-bit byte-addressed memory system and a cache with capacity $C$ bytes, line size $B$ bytes, and $W$-way set associativity:\n$$S = \\frac{C}{W \\cdot B}, \\qquad b = \\log_2(B), \\qquad s = \\log_2(S), \\qquad t = A - s - b$$\nA **direct-mapped** cache has $W = 1$ ($S = C/B$ sets), maximizing speed but suffering **conflict misses** whenever two active addresses share the same index bits (`addr_1 % (C/B) == addr_2 % (C/B)`). Raising associativity to $W = 4$ or $W = 8$ virtually eliminates conflict misses at modest comparator/mux cost.\n\n**The Three Cs & AMAT:**\n- **Compulsory (Cold) Misses:** First-ever access to a cache line.\n- **Capacity Misses:** Working set exceeds total cache capacity $C$.\n- **Conflict Misses:** Working set fits in $C$, but too many active lines map to the same set.\n\nFor a 2-level hierarchy (L1 + L2 + DRAM), **Average Memory Access Time (AMAT)** composes recursively using local miss rates ($MR_1, MR_2$):\n$$\\text{AMAT} = T_{\\text{L1}} + \\text{MR}_1 \\times \\left(T_{\\text{L2}} + \\text{MR}_2 \\times T_{\\text{DRAM}}\\right)$$\n\n**MESI Coherence State Machine:**\n- **Invalid (I):** Line is not valid in this cache.\n- **Shared (S):** Clean copy matching memory; 1 or more peer caches may also hold S. Read hits silently; a write requires `BusRdX` (Read-For-Ownership) to transition peers to `I` and self to `M`.\n- **Exclusive (E):** Clean copy held ONLY by this cache. A write silently upgrades `E -> M` with zero bus traffic!\n- **Modified (M):** Dirty copy held ONLY by this cache (differs from DRAM). Must snoop-intervene on peer `BusRd` (supplying data and transitioning `M -> S`) or `BusRdX` (`M -> I`), and write back to DRAM/L3 upon eviction.",
    mechanisms: [
      {
        step: 1,
        title: "Address Bit-Slicing",
        detail:
          "Hardware extracts Block Offset [b-1:0], Set Index [b+s-1:b], and Tag [A-1:b+s] immediately from the memory address.",
        stateNote: "e.g., 48b addr, 32 KiB 8-way 64B: b=6, s=6, t=36",
      },
      {
        step: 2,
        title: "Parallel Way Tag Comparison",
        detail:
          "Set Index selects one row across all W ways; W tag comparators test Tag == way[i].tag && way[i].valid simultaneously.",
        stateNote: "Hit if any way matches; else Miss",
      },
      {
        step: 3,
        title: "Eviction & Dirty Writeback on Miss",
        detail:
          "On a miss, the replacement policy (LRU/PLRU/RRIP) picks a victim way. If the victim's Dirty bit is 1 (write-back cache), the 64B line flushes to L2/DRAM first.",
        stateNote: "if (victim.M || victim.dirty) flush_line_down()",
      },
      {
        step: 4,
        title: "MESI Read Miss (PrRd / BusRd)",
        detail:
          "Core broadcasts BusRd. If no peer holds the line, it enters Exclusive (E); if any peer holds S or M (M intervenes with fresh data), both end in Shared (S).",
        stateNote: "I -> E (no peer copy) or I -> S (peer copy exists)",
      },
      {
        step: 5,
        title: "MESI Write Hit / Miss (PrWr / BusRdX)",
        detail:
          "Writing to E or M hits silently (E -> M). Writing to S or I broadcasts BusRdX/Upgrade, invalidating all peer copies (-> I) before this core enters Modified (M).",
        stateNote: "Peers: S/M -> I | Writer: -> M",
      },
    ],
    mathNotes: [
      {
        title: "Cache Bit Geometry",
        latex: "b = \\log_2(\\text{LineBytes}), \\quad s = \\log_2\\!\\left(\\frac{\\text{CacheBytes}}{W \\cdot \\text{LineBytes}}\\right), \\quad t = A - s - b",
        explanation:
          "Tag array SRAM overhead equals S * W * (t + valid + dirty + MESI + LRU bits), which is separate from the data SRAM capacity C.",
      },
      {
        title: "Recursive Multi-Level AMAT",
        latex: "\\text{AMAT} = T_{\\text{hit,L1}} + \\text{MR}_{\\text{L1}} \\cdot \\left(T_{\\text{hit,L2}} + \\text{MR}_{\\text{L2}} \\cdot T_{\\text{miss,DRAM}}\\right)",
        explanation:
          "Even if DRAM takes 80 ns, a 5% L1 miss rate and 20% local L2 miss rate keep AMAT around ~2.05 ns.",
      },
    ],
    simulatorId: "cache-memory",
    simulatorPrompt:
      "Open the Set-Associative Cache & Coherence Lab. Configure a direct-mapped cache and run an address trace that collides on the same Set Index to observe conflict misses, then switch to 2-way set-associative to turn them into hits. Also test PrWr on a Shared line in the MESI view.",
    diagram: {
      title: "4-Way Set-Associative Lookup & MESI Coherence Bus",
      caption:
        "Addresses slice into Tag, Index, and Offset for parallel way comparison; private L1 caches coordinate ownership over the coherence interconnect.",
      nodes: [
        {
          id: "addr",
          label: "Address [Tag | Index | Offset]",
          sublabel: "48-bit Physical Addr",
          x: 40,
          y: 120,
          tone: "accent",
        },
        {
          id: "sets",
          label: "Set Array (S sets x W ways)",
          sublabel: "Index selects 1 set",
          x: 280,
          y: 45,
          tone: "neutral",
        },
        {
          id: "cmp",
          label: "W Tag Comparators",
          sublabel: "Check Valid + Tag + MESI",
          x: 280,
          y: 195,
          tone: "emerald",
        },
        {
          id: "hit",
          label: "Hit: Offset Mux -> Core",
          sublabel: "~1 ns (L1) | E->M silent",
          x: 560,
          y: 45,
          tone: "emerald",
        },
        {
          id: "mesi",
          label: "Coherence Bus / Directory",
          sublabel: "BusRd / BusRdX -> L2/L3",
          x: 560,
          y: 195,
          tone: "amber",
        },
      ],
      edges: [
        { from: "addr", to: "sets", label: "Index [b+s-1:b]" },
        { from: "addr", to: "cmp", label: "Tag [A-1:b+s]" },
        { from: "sets", to: "cmp", label: "W Tags + States" },
        { from: "cmp", to: "hit", label: "Match & Valid" },
        { from: "cmp", to: "mesi", label: "Miss or Write to S" },
      ],
    },
    codeExamples: [
      {
        title: "C Address Bit-Slicer & False Sharing Avoidance",
        language: "c",
        code: `#include <stdint.h>
#include <stdio.h>
#include <stdalign.h>

// Tag / Index / Offset decoder for 32 KiB, 8-way, 64B line, 48-bit address
void decode_addr(uint64_t addr) {
    uint64_t offset = addr & 0x3FULL;          // bits [5:0]  (6 bits: 64B)
    uint64_t index  = (addr >> 6) & 0x3FULL;   // bits [11:6] (6 bits: 64 sets)
    uint64_t tag    = (addr >> 12) & ((1ULL << 36) - 1); // bits [47:12]
    printf("0x%012llX -> Tag=0x%09llX, Set=%llu, Offset=%llu\\n",
           (unsigned long long)addr, (unsigned long long)tag,
           (unsigned long long)index, (unsigned long long)offset);
}

// BAD: False sharing (both fields share the same 64B cache line!)
struct BadCounters { uint64_t core0; uint64_t core1; };

// GOOD: Cache-line padded (each counter owns its own 64B MESI line)
struct GoodCounters {
    alignas(64) uint64_t core0;
    alignas(64) uint64_t core1;
};

int main(void) {
    decode_addr(0x00007FFEEA012348ULL);
    printf("sizeof(BadCounters)=%zu, sizeof(GoodCounters)=%zu\\n",
           sizeof(struct BadCounters), sizeof(struct GoodCounters));
    return 0;
}`,
        explanation:
          "In BadCounters, Core 0 writing core0 and Core 1 writing core1 bounce the single 64B cache line back and forth in MESI Modified/Invalid states. Adding alignas(64) places them in separate cache lines so both cores stay silently in Modified state.",
        output: `0x00007FFEEA012348 -> Tag=0x0007FFEEA012, Set=13, Offset=8
sizeof(BadCounters)=16, sizeof(GoodCounters)=128`,
      },
    ],
    connections: [
      {
        lessonSlug: "sram-dram-memory-cells",
        relationship:
          "Explains how 6T SRAM arrays are organized with tag comparators to shield the CPU from slow 1T1C DRAM latencies.",
      },
      {
        lessonSlug: "virtual-memory-paging-tlb",
        relationship:
          "Virtual-to-physical TLB translation interacts directly with VIPT L1 caches (Lesson 26).",
      },
      {
        lessonSlug: "threads-atomics-async-runtimes",
        relationship:
          "Multi-core atomic operations (`LOCK CMPXCHG`, `LDXR/STXR`) and memory barriers operate directly on MESI cache coherence states.",
      },
    ],
    realWorldApplications: [
      {
        title: "Single-Level Textbook Cache vs. Non-Inclusive & Victim L3 Hierarchies",
        simplifiedVsReal:
          "Textbooks often show a strict inclusive hierarchy where L3 mirrors everything in L1/L2. Modern CPUs use nuanced inclusion policies to maximize effective cache capacity and minimize snooping overhead.",
        modernExample:
          "Intel Skylake-SP/Sapphire Rapids moved to a **non-inclusive** large L2 (1–2 MiB) + shared mesh L3, while AMD Zen 4/5 treats L3 as a **victim cache** filled on L2 evictions and runs the 5-state **MOESI** protocol (adding an `Owned` state so dirty shared data can be served cache-to-cache without writing back to DRAM).",
      },
      {
        title: "Broadcast Bus Snooping vs. Directory Coherence",
        simplifiedVsReal:
          "Textbook MESI broadcasts every `BusRd` and `BusRdX` to all cores over a single shared bus. Broadcasting does not scale to 64–192 server cores.",
        modernExample:
          "Modern many-core servers (AMD EPYC, Intel Xeon, AWS Graviton4) use a **Coherence Directory** (or snoop filter) tracking which cores cache each line, sending point-to-point invalidations only to sharers over a 2D mesh/ring interconnect.",
      },
    ],
    misconceptions: [
      {
        myth: "Write-through caches are always faster than write-back caches because they don't need a dirty bit.",
        reality:
          "Write-through pushes every single store down to lower memory, saturating L2/DRAM write bandwidth. Almost all modern L1d/L2/L3 CPU caches are write-back + write-allocate so repeated writes to stack/loop variables hit locally in L1d.",
      },
      {
        myth: "Mutexes or locks prevent false sharing.",
        reality:
          "False sharing happens in hardware even with ZERO shared variables or locks! Two lock-free threads writing completely separate variables inside the same 64-byte line still suffer MESI ownership ping-ponging.",
      },
    ],
    deepDive: {
      title: "VIPT L1 Caches: Paralleling TLB Lookup with Cache Indexing",
      content:
        "In a virtual-memory CPU, programs generate **virtual addresses**, but cache tags ideally store **physical addresses** so context switches don't require flushing the cache and shared memory aliases cleanly. Waiting for the TLB to translate Virtual -> Physical *before* indexing L1d would add a full cycle to every load.\n\nInstead, L1 caches use **Virtually Indexed, Physically Tagged (VIPT)** lookup: the lower 12 bits of a 4 KiB page (`[11:0]`) are identical in both virtual and physical addresses! As long as $\\text{Offset} + \\text{Index} \\le 12$ bits (i.e. $\\text{Sets} \\times \\text{LineSize} = \\text{Capacity} / W \\le 4096\\text{ B}$), the set index comes exclusively from untranslated page-offset bits, allowing L1 set SRAM read and TLB lookup to finish in the same cycle. That exact math explains why classic x86/ARM L1 caches stayed 32 KiB 8-way ($32768 / 8 = 4096\\text{ B}$) for over a decade—and why Apple Silicon uses larger 16 KiB OS pages to scale L1d to 128 KiB without aliasing!",
    },
    revisionNotes: [
      "Cache geometry: b = log2(LineSize), s = log2(Capacity / (Ways * LineSize)), t = AddrBits - s - b.",
      "3Cs of misses: Compulsory (first access), Capacity (working set > C), Conflict (set collisions).",
      "AMAT = T_L1 + MR_L1 * (T_L2 + MR_L2 * T_DRAM).",
      "MESI states: Modified (dirty, sole copy), Exclusive (clean, sole copy), Shared (clean, multiple), Invalid.",
      "False sharing occurs when distinct threads modify independent variables within the same 64-byte cache line.",
    ],
    glossaryTermIds: [
      "spatial-temporal-locality",
      "set-associative-cache",
      "mesi-coherence",
      "sram-cell",
    ],
    references: [
      {
        title: "What Every Programmer Should Know About Memory (Section 3: CPU Caches)",
        author: "Ulrich Drepper",
        url: "https://people.freebsd.org/~lstewart/articles/cpumemory.pdf",
        type: "paper",
        note: "Essential guide to cache geometry, prefetching, MESI coherence, and false sharing.",
      },
      {
        title: "Computer Architecture: A Quantitative Approach (Chapter 2: Memory Hierarchy Design)",
        author: "John L. Hennessy & David A. Patterson",
        url: "https://www.elsevier.com/books/computer-architecture/hennessy/978-0-12-811905-1",
        type: "book",
        note: "Comprehensive mathematical analysis of AMAT, VIPT caches, and coherence protocols.",
      },
      {
        title: "A Primer on Memory Consistency and Cache Coherence (2nd Ed.)",
        author: "Vijay Nagarajan, Daniel J. Sorin, Mark D. Hill, & David A. Wood",
        url: "https://link.springer.com/book/10.1007/978-3-031-01764-3",
        type: "book",
        note: "Rigorous state-machine reference for snooping and directory MESI/MOESI protocols.",
      },
    ],
    assessments: [
      {
        id: "l19-q1",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A 48-bit physical address CPU has a 64 KiB, 4-way set-associative L1 cache with 64-byte cache lines. How many bits wide is the **Tag** field?",
        latex: "t = 48 - \\log_2\\!\\left(\\frac{65536}{4 \\times 64}\\right) - \\log_2(64)",
        correctAnswer: 34,
        numericTolerance: 0,
        hints: [
          "Offset b = log2(64) = 6 bits. Number of sets S = 65536 / (4 * 64) = 256, so Index s = log2(256).",
        ],
        explanation:
          "Block offset b = log2(64) = 6 bits. Number of sets S = 65,536 / (4 * 64) = 256, so set index s = log2(256) = 8 bits. Tag t = 48 - 8 - 6 = 34 bits.",
        conceptTag: "cache-address-bits",
      },
      {
        id: "l19-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "Compute the AMAT (in nanoseconds) for a 2-level cache hierarchy: L1 hit time = $1.0\\text{ ns}$, L1 miss rate = $4\\%$ ($0.04$), L2 hit time = $6.0\\text{ ns}$, local L2 miss rate = $25\\%$ ($0.25$), and DRAM miss penalty = $80\\text{ ns}$.",
        latex: "\\text{AMAT} = T_{\\text{L1}} + \\text{MR}_1 \\cdot (T_{\\text{L2}} + \\text{MR}_2 \\cdot T_{\\text{DRAM}})",
        correctAnswer: 2.04,
        numericTolerance: 0.02,
        hints: [
          "First compute L2 average penalty: 6 + 0.25 * 80 = 26 ns, then multiply by MR_1 = 0.04.",
        ],
        explanation:
          "AMAT = 1.0 + 0.04 * (6.0 + 0.25 * 80) = 1.0 + 0.04 * (6.0 + 20.0) = 1.0 + 0.04 * 26.0 = 1.0 + 1.04 = 2.04 ns.",
        conceptTag: "amat",
      },
      {
        id: "l19-q3",
        type: "mcq",
        difficulty: "rigorous",
        prompt:
          "Under the MESI protocol, Core 0 holds cache line X in the **Modified (M)** state, and Core 1 issues a read (`PrRd` -> `BusRd`) to X. What state do Core 0 and Core 1 end up in?",
        options: [
          {
            id: "a",
            text: "Core 0 transitions M -> S (supplying the dirty data), and Core 1 transitions I -> S.",
            explanation:
              "Correct! Core 0 snoops the BusRd, intervenes to supply the latest dirty line (and updates L3/memory), and both cores now hold clean Shared copies.",
          },
          {
            id: "b",
            text: "Core 0 transitions M -> I, and Core 1 transitions I -> E.",
            explanation:
              "M -> I happens on BusRdX (a write by Core 1), not a read (BusRd).",
          },
          {
            id: "c",
            text: "Core 0 stays in M, and Core 1 enters E.",
            explanation:
              "Two cores can never simultaneously be in M and E; E means sole clean copy.",
          },
          {
            id: "d",
            text: "Both cores enter Modified (M).",
            explanation:
              "At most one cache may hold a line in Modified state at any instant.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Core 1 only wants to read, so both cores can share a clean copy once Core 0 provides its updated data.",
        ],
        explanation:
          "On a peer BusRd for a Modified line, Core 0 intercepts the request, writes/forwards the updated 64B line, and downgrades M -> S while Core 1 loads the line into S.",
        conceptTag: "mesi-transitions",
      },
      {
        id: "l19-q4",
        type: "debugging",
        difficulty: "intermediate",
        prompt:
          "A parallel C++ benchmark spawns 4 threads, each incrementing its own `counters[tid].hits` 100 million times with zero locks. Strangely, running with 4 threads is 4x SLOWER than 1 thread! What is the cause and fix?",
        codeSnippet: `struct ThreadStat { uint64_t hits; };
ThreadStat counters[4]; // global array, 32 bytes total
void worker(int tid) {
    for (int i = 0; i < 100'000'000; ++i) counters[tid].hits++;
}`,
        codeLanguage: "cpp",
        options: [
          {
            id: "a",
            text: "False sharing: all 4 `uint64_t` values sit in one 64-byte cache line; fix by adding `alignas(64)` to `ThreadStat`.",
            explanation:
              "Correct! Each write invalidates the other 3 cores' copies via MESI BusRdX. Aligning ThreadStat to 64 bytes isolates each counter on its own cache line.",
          },
          {
            id: "b",
            text: "The 32-byte array overflows L1d capacity, causing capacity misses.",
            explanation: "L1d is 32–128 KiB, thousands of times larger than 32 bytes.",
          },
          {
            id: "c",
            text: "`uint64_t` increments are non-atomic, so the CPU stalls waiting for DRAM refresh.",
            explanation: "The slowdown comes from inter-core cache-line invalidation traffic, not DRAM refresh.",
          },
          {
            id: "d",
            text: "Global arrays live in read-only Harvard instruction cache.",
            explanation: "Global writable arrays reside in data memory (L1d).",
          },
        ],
        correctAnswer: "a",
        hints: [
          "4 * 8 bytes = 32 bytes, which is half of one 64-byte cache line.",
        ],
        explanation:
          "Because `counters[0..3]` share one 64B cache line, every store forces MESI ownership transfer (`BusRdX`), serializing all 4 cores. Adding `alignas(64)` puts each thread's counter on a distinct cache line.",
        conceptTag: "false-sharing",
      },
    ],
  },

  // =========================================================================
  // LESSON 20: NAND Flash, SSD Controllers & NVMe Queues
  // =========================================================================
  {
    id: "flash-ssd-storage-controllers",
    slug: "flash-ssd-storage-controllers",
    number: 20,
    title: "NAND Flash, SSD Controllers & NVMe Queues",
    subtitle:
      "Charge-trap non-volatile cells, TLC/QLC multi-bit thresholds, page-vs-block asymmetry, Flash Translation Layer (FTL) garbage collection, and NVMe PCIe ring queues.",
    trackId: "track-2",
    domainId: "memory-storage",
    moduleTitle: "Module 7: Memory Hierarchy & Storage Hardware",
    chapterTitle: "Chapter 7: SRAM, DRAM, Caches & Flash",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["sram-dram-memory-cells", "encoding-compression-ecc"],
    objectives: [
      "Explain how floating-gate and 3D charge-trap NAND cells store multiple bits per cell via quantized threshold voltage windows.",
      "Analyze why NAND's read/program-per-page vs. erase-per-block asymmetry requires out-of-place writes, an FTL, and garbage collection.",
      "Compute Write Amplification Factor (WAF) and explain how over-provisioning, TRIM, and wear leveling extend SSD endurance.",
      "Contrast legacy single-queue SATA/AHCI polling with NVMe's multi-core PCIe Submission/Completion Queue architecture.",
    ],
    depthExplanations: {
      beginner:
        "RAM loses everything the instant you unplug the power. Solid-State Drives (SSDs) keep terabytes of data permanently by trapping electrons inside microscopic insulated pockets (**NAND flash**). Weirdly, you can read or write a small 4–16 KiB **page** of flash, but you cannot overwrite a single page directly—you can only erase an entire multi-megabyte **block** of hundreds of pages at once! So inside every SSD sits a tiny embedded computer (the SSD controller) running firmware that secretly moves data around behind your OS's back.",
      intermediate:
        "A **NAND flash** cell acts like a MOSFET whose gate threshold voltage $V_{th}$ shifts depending on how many electrons are tunnel-injected into an insulated charge-trap nitride layer. Storing 1 bit (**SLC**) needs 2 voltage levels; **TLC** (3 bits/cell) resolves $2^3 = 8$ tightly spaced levels, and **QLC** (4 bits/cell) resolves 16 levels—boosting density at the expense of slower programming, narrower noise margins, and lower endurance (~1,000–3,000 P/E cycles for TLC vs. 100,000 for SLC).\n\nBecause flash can only transition `1 -> 0` during page programming and must reset an entire **Erase Block** (e.g., 4–16 MiB) back to all `1`s via high-voltage Fowler-Nordheim tunneling, the SSD controller's **Flash Translation Layer (FTL)** never overwrites in place. It maps OS **Logical Block Addresses (LBAs)** to fresh **Physical Block Addresses (PBAs)**, marks old pages invalid, and runs **Garbage Collection (GC)** to copy surviving valid pages out of dirty blocks before erasing them.",
      advanced:
        "Every GC copy inflates **Write Amplification Factor** ($\\text{WAF} = \\text{NAND Bytes Written} / \\text{Host Bytes Written}$). Reserving hidden **Over-Provisioning (OP)** space (7%–28%) and receiving OS `TRIM`/`Deallocate` hints sharply lower WAF by preventing GC from copying deleted file blocks. Because charge-trap oxide degrades per P/E cycle and retention decays over time, modern controllers replace older BCH codes with soft-decision **LDPC (Low-Density Parity-Check)** ECC and read-retry voltage shifting.\n\nTo eliminate legacy SATA/AHCI's 1-queue, 32-command bottleneck, **NVMe (Non-Volatile Memory Express)** speaks directly over PCIe lanes using up to **64K paired Submission/Completion Queues (SQ/CQ)** in host DRAM—one per CPU core with zero lock contention—each holding up to 64K 64-byte commands dispatched via MMIO doorbells, DMA scatter-gather lists (PRPs/SGLs), and per-core MSI-X interrupts.",
    },
    intuition:
      "NAND flash is like a chalkboard notebook where you can write individual lines on clean pages, but your eraser only wipes an entire 256-page chapter at once—so the SSD's FTL librarian keeps writing updates onto blank pages and periodically copies surviving notes out of messy chapters before wiping them clean.",
    technicalTheory:
      "Modern 3D NAND stacks 100–250+ vertical wordline layers of **Charge-Trap Flash (CTF)** cells. For $k$ bits per cell ($k \\in \\{1, 2, 3, 4\\}$ for SLC/MLC/TLC/QLC), the cell must distinguish $2^k$ threshold voltage bands:\n$$N_{\\text{levels}} = 2^k, \\qquad \\Delta V_{\\text{margin}} \\propto \\frac{V_{\\text{window}}}{2^k - 1}$$\nProgramming uses Incremental Step Pulse Programming (ISPP) to nudge electrons accurately into the target band without overshooting, and reading compares cell conduction against $2^k - 1$ reference wordline voltages.\n\n**Page vs. Block Asymmetry & FTL Mechanics:**\n- **Read / Program unit:** 1 Page (typically $4\\text{ KiB}$ to $16\\text{ KiB}$ + spare OOB metadata/LDPC parity bytes).\n- **Erase unit:** 1 Block (typically $256\\text{–}1024+$ pages, i.e., $4\\text{–}16\\text{ MiB}$).\n- **Out-of-place updates:** When the host overwrites `LBA 42`, the FTL writes the new 4 KiB into a fresh erased page `PBA 901`, updates its DRAM L2P (Logical-to-Physical) map `L2P[42] = 901`, and marks the old `PBA 17` invalid.\n- **Garbage Collection & WAF:** When free blocks run low, GC picks a victim block with valid-page utilization $u \\in [0, 1)$, copies its $u \\cdot P$ valid pages to a new block, and erases the victim:\n$$\\text{WAF} = \\frac{1}{1 - u}$$\nIf a victim block is $75\\%$ full of valid data ($u = 0.75$), writing 1 page requires copying 3 valid pages on average, yielding $\\text{WAF} = 4.0$!\n\n**NVMe Queue Protocol:**\nRather than polling one serialized AHCI command list behind a slow SATA bridge, NVMe places lockless ring buffers in host RAM: the host CPU writes a 64B Submission Queue Entry (SQE) and writes the new tail index to a PCIe **Doorbell Register**; the SSD fetches the command and data buffers via PCIe DMA, transfers pages across parallel NAND channels, posts a 16B Completion Queue Entry (CQE), and fires an MSI-X interrupt to the originating CPU core.",
    mechanisms: [
      {
        step: 1,
        title: "Host Submits NVMe Write to Core-Local SQ",
        detail:
          "The OS block driver writes a 64B NVMe Write command pointing to host DRAM pages (via PRP/SGL) into Submission Queue[core_id] and rings the PCIe Doorbell.",
        stateNote: "SQ[tail] <= Write(LBA=42, len=4K); Doorbell <= tail+1",
      },
      {
        step: 2,
        title: "SSD Controller DMA Fetch & SLC Buffering",
        detail:
          "The SSD's multi-core controller fetches the command and payload over PCIe DMA into internal SRAM/DRAM buffers, computing LDPC ECC parity.",
        stateNote: "PCIe DMA Read -> Controller Buffer + LDPC Parity",
      },
      {
        step: 3,
        title: "FTL Out-of-Place Allocation & L2P Update",
        detail:
          "The FTL assigns a fresh erased physical page (striping across NAND dies/channels), invalidates the old PBA for LBA 42, and updates L2P[42] -> new PBA.",
        stateNote: "Old PBA -> INVALID; L2P[42] <= New PBA",
      },
      {
        step: 4,
        title: "Background Garbage Collection & Wear Leveling",
        detail:
          "When free blocks drop below threshold, GC copies remaining valid pages out of a high-invalid-count block, erases the block, and balances P/E cycles across all blocks.",
        stateNote: "Copy valid pages -> Erase Block (P/E++) -> Free Pool",
      },
      {
        step: 5,
        title: "NVMe Completion & MSI-X Interrupt",
        detail:
          "Once written (or safely buffered in power-loss-protected DRAM/pSLC), the SSD writes a 16B CQE into Completion Queue[core_id] and triggers an MSI-X interrupt.",
        stateNote: "CQ[tail] <= Status(OK); MSI-X -> CPU Core",
      },
    ],
    mathNotes: [
      {
        title: "Write Amplification Factor (WAF) from Block Utilization",
        latex: "\\text{WAF} = \\frac{\\text{NAND Writes}}{\\text{Host Writes}} \\approx \\frac{1}{1 - u}",
        explanation:
          "When Garbage Collection selects a victim block with fraction u of still-valid pages, (1-u) of the block frees up per erase while u pages must be rewritten internally—so high fill levels without TRIM/OP spike WAF dramatically.",
      },
      {
        title: "Multi-Level Cell Voltage States",
        latex: "N_{\\text{states}} = 2^k \\quad (\\text{SLC: }2,\\; \\text{MLC: }4,\\; \\text{TLC: }8,\\; \\text{QLC: }16)",
        explanation:
          "Doubling states per additional bit halves the voltage gap between adjacent charge levels, increasing raw bit error rate (RBER) and requiring stronger LDPC ECC.",
      },
    ],
    diagram: {
      title: "NVMe Host Queues -> SSD Controller FTL -> 3D NAND Channels",
      caption:
        "Per-core lockless NVMe queues feed an FTL controller that remaps logical LBAs across parallel NAND dies and runs background garbage collection.",
      nodes: [
        {
          id: "host",
          label: "Host CPU & DRAM",
          sublabel: "Per-Core NVMe SQ / CQ Rings",
          x: 40,
          y: 115,
          tone: "accent",
        },
        {
          id: "pcie",
          label: "PCIe DMA & Doorbells",
          sublabel: "Up to 64K Queues x 64K Depth",
          x: 250,
          y: 115,
          tone: "neutral",
        },
        {
          id: "ftl",
          label: "SSD Controller & FTL",
          sublabel: "L2P Map + GC + Wear Level + LDPC",
          x: 470,
          y: 115,
          tone: "amber",
        },
        {
          id: "nand0",
          label: "NAND Channel 0..7",
          sublabel: "16 KiB Pages / Multi-MiB Blocks",
          x: 690,
          y: 50,
          tone: "emerald",
        },
        {
          id: "gc",
          label: "GC & Erase Pool",
          sublabel: "Copy Valid -> Block Erase",
          x: 690,
          y: 185,
          tone: "amber",
        },
      ],
      edges: [
        { from: "host", to: "pcie", label: "64B SQE + Doorbell" },
        { from: "pcie", to: "ftl", label: "DMA Payload" },
        { from: "ftl", to: "nand0", label: "Out-of-Place Page Write" },
        { from: "nand0", to: "gc", label: "Invalidated Pages" },
        { from: "gc", to: "ftl", label: "Erased Free Blocks" },
      ],
    },
    codeExamples: [
      {
        title: "Mini Flash Translation Layer (FTL) & WAF Simulator (Python)",
        language: "python",
        code: `class MiniFTL:
    def __init__(self, num_blocks=6, pages_per_block=4, logical_lbas=12):
        self.pages_per_block = pages_per_block
        self.l2p = {}  # LBA -> (block, page)
        self.blocks = [["FREE"] * pages_per_block for _ in range(num_blocks)]
        self.cur_blk, self.cur_pg = 0, 0
        self.host_writes = 0
        self.nand_writes = 0
        self.erases = 0

    def _next_free_page(self):
        while True:
            if self.cur_pg < self.pages_per_block and self.blocks[self.cur_blk][self.cur_pg] == "FREE":
                pos = (self.cur_blk, self.cur_pg)
                self.cur_pg += 1
                return pos
            # Advance to another free block or trigger greedy GC
            free_blks = [b for b, pgs in enumerate(self.blocks) if "FREE" in pgs]
            if free_blks:
                self.cur_blk = free_blks[0]
                self.cur_pg = self.blocks[self.cur_blk].index("FREE")
            else:
                self._garbage_collect()

    def _garbage_collect(self):
        # Pick block with maximum INVALID pages (lowest utilization u)
        victim = max(range(len(self.blocks)), key=lambda b: self.blocks[b].count("INVALID"))
        valid_lbas = [v for v in self.blocks[victim] if isinstance(v, int)]
        self.blocks[victim] = ["FREE"] * self.pages_per_block
        self.erases += 1
        self.cur_blk, self.cur_pg = victim, 0
        for lba in valid_lbas:
            b, p = self._next_free_page()
            self.blocks[b][p] = lba
            self.l2p[lba] = (b, p)
            self.nand_writes += 1

    def write(self, lba: int):
        self.host_writes += 1
        if lba in self.l2p:
            ob, op = self.l2p[lba]
            self.blocks[ob][op] = "INVALID"
        b, p = self._next_free_page()
        self.blocks[b][p] = lba
        self.l2p[lba] = (b, p)
        self.nand_writes += 1

ftl = MiniFTL()
# Fill 12 LBAs sequentially, then overwrite LBAs 0..11 repeatedly (random-like churn)
for step in range(48):
    ftl.write((step * 5) % 12)

waf = ftl.nand_writes / ftl.host_writes
print(f"Host writes={ftl.host_writes}, NAND writes={ftl.nand_writes}, Erases={ftl.erases}, WAF={waf:.2f}")`,
        explanation:
          "Because physical capacity (24 pages) exceeds logical capacity (12 LBAs = 50% over-provisioning), greedy garbage collection finds blocks with few valid pages, keeping WAF modest; lowering over-provisioning forces much higher GC copying.",
        output: `Host writes=48, NAND writes=72, Erases=12, WAF=1.50`,
      },
    ],
    connections: [
      {
        lessonSlug: "sram-dram-memory-cells",
        relationship:
          "Compares volatile 6T SRAM and 1T1C DRAM with non-volatile charge-trap NAND flash (and shows why SSDs still use onboard DRAM to cache the FTL L2P table!).",
      },
      {
        lessonSlug: "encoding-compression-ecc",
        relationship:
          "Applies Track 1 ECC theory via LDPC codes needed to correct high raw bit error rates in TLC/QLC NAND.",
      },
      {
        lessonSlug: "drivers-and-filesystems",
        relationship:
          "Next track explores how OS NVMe drivers, DMA, and filesystems issue `TRIM` and queue requests to these controllers.",
      },
    ],
    realWorldApplications: [
      {
        title: "Simple Block Disk vs. Pseudo-SLC Cache & Zoned Namespaces (ZNS)",
        simplifiedVsReal:
          "Operating systems historically treated disks as uniform fixed-sector arrays. Real consumer SSDs dynamically dedicate spare TLC/QLC blocks as a fast 1-bit-per-cell **pSLC write cache** (causing write speeds to cliff-drop once the pSLC buffer fills) and rely on multi-gigabyte DRAM FTL caches.",
        modernExample:
          "Enterprise **Zoned Namespaces (ZNS)** NVMe SSDs expose physical erase-block zones directly to append-only filesystems/RocksDB, eliminating FTL over-provisioning and dropping WAF near 1.0.",
      },
      {
        title: "SATA/AHCI Serial Queue vs. PCIe Gen5 NVMe",
        simplifiedVsReal:
          "Legacy SATA/AHCI maxed out at ~550 MB/s with a single 32-entry command queue guarded by OS locks. Modern PCIe Gen5 x4 NVMe SSDs push 14+ GB/s and >2 million IOPS.",
        modernExample:
          "Linux `io_uring` + NVMe polling pairs user-space submission rings directly with per-core NVMe Submission/Completion queues for sub-10-microsecond storage latency.",
      },
    ],
    misconceptions: [
      {
        myth: "Running an old hard-drive defragmenter on an SSD speeds it up.",
        reality:
          "SSDs have zero mechanical seek heads, and the FTL already scatters LBAs across parallel NAND channels for maximum bandwidth! Traditional defragmentation accomplishes nothing while burning finite P/E endurance cycles.",
      },
      {
        myth: "Deleting a file immediately erases its NAND flash blocks.",
        reality:
          "Deleting a file only updates filesystem metadata unless the OS issues an explicit `TRIM` (`Deallocate`) command telling the FTL those LBAs are dead so GC won't waste time copying them later.",
      },
    ],
    deepDive: {
      title: "Why DRAMless SSDs Use Host Memory Buffer (HMB)",
      content:
        "A 2 TB SSD with 4 KiB mapping granularity needs roughly $2\\text{ TB} / 4\\text{ KiB} = 512\\text{ million}$ L2P table entries ($\approx 2\\text{ GB}$ of fast metadata!). High-end SSDs mount 1–4 GB of dedicated LPDDR4/DDR4 DRAM on the drive PCB solely to cache that L2P table so reads take one NAND lookup instead of two.\n\nBudget M.2 NVMe SSDs omit onboard DRAM to cut cost and power, using **Host Memory Buffer (HMB)** instead: an NVMe feature where the OS grants the SSD controller exclusive DMA access to a small 32–64 MB slice of the PC's main system DRAM over PCIe to cache hot L2P entries.",
    },
    revisionNotes: [
      "NAND flash reads/programs at Page granularity (4–16 KiB) but must erase at Block granularity (multi-MiB).",
      "SLC/MLC/TLC/QLC store 1/2/3/4 bits per cell using 2, 4, 8, or 16 threshold voltage levels.",
      "The Flash Translation Layer (FTL) performs out-of-place writes, LBA->PBA mapping, Garbage Collection, Wear Leveling, and LDPC ECC.",
      "WAF = (NAND Bytes Written) / (Host Bytes Written); TRIM and Over-Provisioning lower WAF.",
      "NVMe uses up to 64K paired lockless Submission/Completion Queues over PCIe DMA + MSI-X.",
    ],
    glossaryTermIds: ["nand-flash-ftl", "nvme-queues"],
    references: [
      {
        title: "NVM Express Base Specification",
        author: "NVM Express, Inc.",
        url: "https://nvmexpress.org/specifications/",
        type: "spec",
        note: "Official specification for Submission/Completion Queues, Doorbells, PRPs/SGLs, and ZNS.",
      },
      {
        title: "Design Tradeoffs for SSD Performance (FAST '08)",
        author: "Nitin Agrawal, Vijayan Prabhakaran, Ted Wobber, John D. Davis, Mark Manasse, Rina Panigrahy",
        url: "https://www.usenix.org/legacy/events/fast08/tech/full_papers/agrawal/agrawal.pdf",
        type: "paper",
        note: "Foundational paper analyzing FTL mapping, garbage collection, wear leveling, and parallelism.",
      },
      {
        title: "Error Characterization, Mitigation, and Recovery in Flash-Memory-Based Solid-State Drives",
        author: "Yu Cai, Saugata Ghose, Erich F. Haratsch, Yixin Luo, & Onur Mutlu",
        url: "https://arxiv.org/abs/1706.08642",
        type: "paper",
        note: "Rigorous survey of 3D NAND cell physics, TLC/QLC noise margins, retention, and LDPC ECC.",
      },
    ],
    assessments: [
      {
        id: "l20-q1",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "Why does an SSD controller write updated data to a new physical page (out-of-place) instead of overwriting the existing NAND page in place?",
        options: [
          {
            id: "a",
            text: "NAND flash can only program `1 -> 0` per page and must reset `0 -> 1` across an entire multi-megabyte erase block, making in-place overwrites prohibitively destructive and slow.",
            explanation:
              "Correct! Overwriting a single 4 KiB page in place would require reading, erasing, and rewriting an entire multi-MiB block on every write.",
          },
          {
            id: "b",
            text: "PCIe DMA cannot transmit to the same physical flash address twice.",
            explanation: "PCIe addresses host DRAM, not raw NAND PBAs.",
          },
          {
            id: "c",
            text: "NAND cells behave like 1T1C DRAM and lose their bits on every read.",
            explanation: "NAND reads are non-destructive (though repeated read disturb exists over millions of reads).",
          },
          {
            id: "d",
            text: "NVMe forbids updating the same LBA twice without a reboot.",
            explanation: "Hosts overwrite LBAs constantly; the FTL redirects each write to a fresh PBA.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Compare NAND program granularity (page) with erase granularity (block).",
        ],
        explanation:
          "Because NAND erases only at multi-MiB block granularity while writing 4–16 KiB pages, the FTL writes updates out-of-place into fresh erased pages and updates its L2P map.",
        conceptTag: "nand-out-of-place",
      },
      {
        id: "l20-q2",
        type: "math",
        difficulty: "foundational",
        prompt:
          "A QLC (Quad-Level Cell) 3D NAND flash cell stores 4 bits per cell. How many distinct threshold-voltage ($V_{th}$) states must the controller distinguish per cell?",
        latex: "N_{\\text{states}} = 2^4",
        correctAnswer: 16,
        numericTolerance: 0,
        hints: [
          "Each bit doubles the number of distinct voltage levels.",
        ],
        explanation:
          "Storing k = 4 bits per cell requires 2^4 = 16 distinct charge/threshold-voltage levels.",
        conceptTag: "qlc-voltage-levels",
      },
      {
        id: "l20-q3",
        type: "multi-select",
        difficulty: "intermediate",
        prompt:
          "Which architectural features give NVMe dramatically higher throughput and lower latency than legacy SATA/AHCI?",
        options: [
          {
            id: "a",
            text: "Up to 64K paired Submission and Completion Queues, enabling lock-free per-CPU-core I/O.",
            explanation: "Correct—eliminates the single-queue AHCI lock contention bottleneck.",
          },
          {
            id: "b",
            text: "Direct attachment over high-bandwidth PCIe lanes rather than a SATA bridge.",
            explanation: "Correct—PCIe Gen4/Gen5 x4 scales to 7–14+ GB/s vs. SATA III's 600 MB/s ceiling.",
          },
          {
            id: "c",
            text: "Up to 64K outstanding commands per queue (vs. 32 in AHCI), saturating parallel NAND channels.",
            explanation: "Correct—deep queue depth feeds dozens of independent NAND dies concurrently.",
          },
          {
            id: "d",
            text: "Replacing NAND flash inside the SSD with 6T SRAM.",
            explanation: "Incorrect—NVMe SSDs still use non-volatile NAND flash.",
          },
        ],
        correctAnswer: ["a", "b", "c"],
        hints: [
          "Select the three protocol/bus traits of NVMe over PCIe.",
        ],
        explanation:
          "NVMe pairs PCIe bandwidth with up to 64K deep per-core queues (64K entries each) to keep parallel NAND channels busy with zero cross-core lock contention.",
        conceptTag: "nvme-architecture",
      },
      {
        id: "l20-q4",
        type: "fill-blank",
        difficulty: "foundational",
        prompt:
          "What 3-letter acronym names the SSD controller subsystem responsible for mapping Logical Block Addresses (LBAs) to Physical Block Addresses (PBAs), garbage collection, and wear leveling?",
        correctAnswer: "FTL",
        acceptableAnswers: ["FTL", "Flash Translation Layer"],
        hints: [
          "Stands for Flash Translation Layer.",
        ],
        explanation:
          "The Flash Translation Layer (FTL) hides NAND's erase-before-write constraints behind a standard block interface.",
        conceptTag: "ftl",
      },
    ],
  },

  // =========================================================================
  // LESSON 21: Instruction Pipelining, Hazards & Branch Prediction
  // =========================================================================
  {
    id: "pipelining-hazards-branch-prediction",
    slug: "pipelining-hazards-branch-prediction",
    number: 21,
    title: "Instruction Pipelining, Hazards & Branch Prediction",
    subtitle:
      "Overlapping IF/ID/EX/MEM/WB stages for ~1 instruction per cycle, resolving RAW/load-use hazards via forwarding, and defeating control stalls with dynamic branch prediction.",
    trackId: "track-2",
    domainId: "modern-cpu",
    moduleTitle: "Module 8: Modern Microarchitecture",
    chapterTitle: "Chapter 8: Pipelining, OoO & SIMD",
    estimatedMinutes: 50,
    difficulty: "advanced",
    status: "complete",
    prerequisites: ["control-unit-fetch-decode-execute", "cache-hierarchies-coherence"],
    objectives: [
      "Trace a 5-stage pipeline (IF, ID, EX, MEM, WB) with inter-stage registers and explain why pipelining improves throughput rather than single-instruction latency.",
      "Identify Structural, Data (RAW, WAR, WAW), and Control hazards in assembly instruction sequences.",
      "Eliminate ALU-to-ALU RAW stalls using EX-to-EX and MEM-to-EX data forwarding while accounting for the unavoidable 1-cycle load-use bubble.",
      "Analyze 1-bit vs. 2-bit saturating branch predictors, Branch Target Buffers (BTB), and misprediction flush penalties using the CPI equation.",
    ],
    depthExplanations: {
      beginner:
        "Imagine doing laundry: washing takes 30 minutes, drying takes 30, and folding takes 30. Doing one load from start to finish takes 90 minutes. If you start Load #2 in the washer the moment Load #1 moves to the dryer, you don't make any single shirt finish faster—but a finished basket pops out every 30 minutes instead of every 90! CPU **pipelining** does the exact same thing with Fetch, Decode, Execute, Memory, and Writeback so up to five instructions are in flight at once.",
      intermediate:
        "A classic 5-stage RISC pipeline places clocked **pipeline registers** (`IF/ID`, `ID/EX`, `EX/MEM`, `MEM/WB`) between phases so every stage advances concurrently, cutting clock period by ~5x while targeting steady-state $\\text{CPI} \\approx 1$. Real programs introduce three hazards that threaten this rhythm:\n1. **Structural Hazards:** Hardware resource conflicts (solved by split L1i/L1d caches and write-first/read-second register file timing).\n2. **Data Hazards (RAW):** An instruction reads a register before an older instruction finishes writing it. **Forwarding (Bypassing)** multiplexes results straight from `EX/MEM` or `MEM/WB` back into the ALU inputs, eliminating stalls for back-to-back ALU instructions—except a **load-use hazard**, where data only leaves `MEM` at the end of cycle $t$, forcing a 1-cycle `NOP` bubble.\n3. **Control Hazards:** Conditional branches are unresolved during `IF` of the following instruction. Rather than stalling, CPUs predict branch outcome/target dynamically via a **Branch Target Buffer (BTB)** and **Branch History Table (BHT)**, flushing speculative instructions only on misprediction.",
      advanced:
        "In a 2-bit saturating counter (`00=SNT`, `01=WNT`, `10=WT`, `11=ST`), two consecutive mispredictions are required to flip a strongly predicted state—halving loop-exit mispredictions on nested loops compared to a 1-bit predictor. Modern processors push accuracy past 99% using **TAGE (TAgged GEometric history length)** predictors that hash global branch history registers of geometrically increasing lengths (`4, 8, 16, ..., 640` branches) alongside a dedicated **Return Address Stack (RAS)** for `RET` targets.\n\nDeepening pipelines to 14–19 stages increases peak clock frequency $f_{\\text{clk}}$ at two severe costs: pipeline register skew/overhead ($t_{\\text{latch}}$) creates diminishing frequency returns, and misprediction penalty scales linearly with frontend depth: $\\text{CPI}_{\\text{branch}} = f_{\\text{br}} \\times p_{\\text{miss}} \\times P_{\\text{flush}}$. At $20\\%$ branches and $15$-cycle flush penalty, even $5\\%$ misprediction costs $+0.15$ CPI!",
    },
    intuition:
      "Pipelining turns a sequential assembly line into parallel concurrency: forwarding wires act as express chutes handing fresh ALU results backward before they even reach the register file, and branch prediction bets on the most likely path so the assembly line never pauses unless the bet turns out wrong.",
    technicalTheory:
      "In an unpipelined single-cycle processor with total delay $T_{\\text{seq}} = \\sum_{i=1}^k t_i$, ideal speedup of a $k$-stage balanced pipeline with per-stage latch overhead $t_{\\text{latch}}$ is:\n$$S_{\\text{pipe}} = \\frac{T_{\\text{seq}}}{\\max_i(t_i) + t_{\\text{latch}}} \\xrightarrow{t_{\\text{latch}} \\to 0,\\; \\text{balanced}} k$$\nNotice that individual instruction latency *increases* slightly from $T_{\\text{seq}}$ to $k \\cdot (\\max_i t_i + t_{\\text{latch}})$, while instruction **throughput** multiplies up to $k\\times$.\n\n**Data Hazard Classification:**\n- **RAW (Read-After-Write — True Dependence):** Instruction $j$ reads a register written by older instruction $i$. With EX-to-EX (`EX/MEM.rd == ID/EX.rs1`) and MEM-to-EX (`MEM/WB.rd == ID/EX.rs1`) forwarding muxes (prioritizing EX/MEM over MEM/WB when both match, and ignoring `rd == x0`), ALU-to-ALU RAW hazards incur **0 stall cycles**.\n- **Load-Use Hazard:** When $i$ is `lw rd, ...` and $j$ immediately uses `rd` in `EX`, `lw` does not produce its value until the end of its `MEM` stage—too late for $j$'s `EX` start. Hazard detection unit stalls `PC` and `IF/ID` for 1 cycle and injects a zeroed control bubble into `ID/EX`, allowing `MEM/WB -> EX` forwarding on the next cycle.\n- **WAR / WAW (Name Dependences):** Cannot occur in an in-order 5-stage pipeline because all reads occur in `ID` and all writes in `WB`, though they become central in Lesson 22 (Out-of-Order Execution).\n\n**Control Hazard & Effective CPI:**\nIf branches make up fraction $f_{\\text{br}}$ of dynamic instructions, mispredict with probability $p_{\\text{miss}}$, and flush $P_{\\text{flush}}$ pipeline cycles when wrong, plus load-use stalls occur at rate $f_{\\text{lu}}$:\n$$\\text{CPI}_{\\text{eff}} = 1 + f_{\\text{lu}} \\cdot 1 + f_{\\text{br}} \\cdot p_{\\text{miss}} \\cdot P_{\\text{flush}}$$",
    mechanisms: [
      {
        step: 1,
        title: "IF: Speculative Fetch via BTB & BHT",
        detail:
          "PC queries L1i, BTB (target cache), and Branch Predictor simultaneously. If predicted taken, PC jumps speculatively to BTB[PC] on the very next cycle.",
        stateNote: "IF/ID <= {Inst, PC+4, PredTaken}",
      },
      {
        step: 2,
        title: "ID: Decode, Hazard Check & Register Read",
        detail:
          "Control Unit decodes opcode; Hazard Detection checks `ID/EX.MemRead && (ID/EX.rd == IF/ID.rs1 || rs2)`. On match, PC & IF/ID freeze and ID/EX gets a NOP bubble.",
        stateNote: "Stall 1 cycle on Load-Use; else ID/EX <= operands + ctrl",
      },
      {
        step: 3,
        title: "EX: Forwarding Muxes, ALU & Branch Resolution",
        detail:
          "Forwarding unit checks EX/MEM and MEM/WB destinations, overriding stale ID/EX operands. Branch comparator verifies whether the IF prediction matched reality.",
        stateNote: "ForwardA/B in {ID/EX, EX/MEM, MEM/WB}; Mispredict -> Flush IF/ID & ID/EX",
      },
      {
        step: 4,
        title: "MEM: Data Cache Access (Bypassed for ALU Ops)",
        detail:
          "Loads/stores access L1d using the ALU-computed effective address; arithmetic instructions simply pass ALUOut forward into MEM/WB.",
        stateNote: "MEM/WB <= {L1d_data or ALUOut, rd, RegWrite}",
      },
      {
        step: 5,
        title: "WB: Register Writeback (First Half-Cycle)",
        detail:
          "RegWrite writes MEM/WB result into RF[rd]. Writing on falling edge (or internal RF bypass) ensures an instruction in ID reads the updated value in the same cycle.",
        stateNote: "RF[MEM/WB.rd] <= WB_data",
      },
    ],
    mathNotes: [
      {
        title: "Effective Pipelined CPI",
        latex: "\\text{CPI}_{\\text{eff}} = 1 + \\text{Stall}_{\\text{load-use}} + \\left(f_{\\text{branch}} \\times p_{\\text{mispredict}} \\times P_{\\text{flush}}\\right)",
        explanation:
          "Notice why compiler instruction scheduling (reordering independent instructions into load-use slots) and >98% branch prediction accuracy are essential to keep CPI near 1.0.",
      },
      {
        title: "2-Bit Saturating Predictor State Transitions",
        latex: "00\\,(\\text{SNT}) \\underset{\\text{NT}}{\overset{\\text{T}}{\\rightleftharpoons}} 01\\,(\\text{WNT}) \\underset{\\text{NT}}{\overset{\\text{T}}{\\rightleftharpoons}} 10\\,(\\text{WT}) \\underset{\\text{NT}}{\overset{\\text{T}}{\\rightleftharpoons}} 11\\,(\\text{ST})",
        explanation:
          "Increment on Taken (saturating at 11), decrement on Not-Taken (saturating at 00). Predict Taken when MSB == 1 (10 or 11).",
      },
    ],
    simulatorId: "pipeline-hazard",
    simulatorPrompt:
      "Open the 5-Stage Pipeline & Hazard Visualizer. Run a sequence containing a RAW dependency and load-use hazard with Forwarding OFF, record the stall cycles, then toggle Forwarding ON and switch from Always-Not-Taken to the 2-bit Saturating Predictor.",
    diagram: {
      title: "5-Stage Pipelined Processor with Forwarding & Branch Flush",
      caption:
        "Pipeline registers separate IF/ID/EX/MEM/WB; red/amber bypass paths feed fresh EX/MEM and MEM/WB values back to the ALU without waiting for WB.",
      nodes: [
        {
          id: "if",
          label: "IF + BHT/BTB",
          sublabel: "Fetch + Predict PC",
          x: 30,
          y: 120,
          tone: "accent",
        },
        {
          id: "id",
          label: "ID + Hazard Unit",
          sublabel: "Decode + Load-Use Stall",
          x: 195,
          y: 120,
          tone: "neutral",
        },
        {
          id: "ex",
          label: "EX + Fwd Muxes",
          sublabel: "ALU + Branch Resolve",
          x: 375,
          y: 120,
          tone: "emerald",
        },
        {
          id: "mem",
          label: "MEM (L1d)",
          sublabel: "Load / Store Access",
          x: 550,
          y: 120,
          tone: "amber",
        },
        {
          id: "wb",
          label: "WB -> RF",
          sublabel: "Commit Register",
          x: 710,
          y: 120,
          tone: "neutral",
        },
      ],
      edges: [
        { from: "if", to: "id", label: "IF/ID" },
        { from: "id", to: "ex", label: "ID/EX" },
        { from: "ex", to: "mem", label: "EX/MEM" },
        { from: "mem", to: "wb", label: "MEM/WB" },
        { from: "mem", to: "ex", label: "EX-to-EX Fwd" },
        { from: "wb", to: "ex", label: "MEM-to-EX Fwd" },
        { from: "ex", to: "if", label: "Mispredict Flush" },
      ],
    },
    codeExamples: [
      {
        title: "Forwarding & Load-Use Scheduling in RISC-V Assembly",
        language: "asm",
        code: `; Unscheduled: 1-cycle load-use stall between lw and add!
; Cycles:  1    2    3    4    5    6    7    8    9
lw   x1, 0(x10)   ; IF   ID   EX   MEM  WB
add  x2, x1, x3   ;      IF   ID  [BUB] EX   MEM  WB   <-- stalled 1 cycle!
sub  x4, x2, x5   ;           IF  [STAL] ID   EX   MEM  WB  (EX->EX fwd x2!)

; Scheduled by compiler: move independent instruction into load delay slot!
lw   x1, 0(x10)   ; IF   ID   EX   MEM  WB
sub  x6, x7, x8   ;      IF   ID   EX   MEM  WB         <-- 0 stalls!
add  x2, x1, x3   ;           IF   ID   EX   MEM  WB    (MEM->EX fwd x1!)
sub  x4, x2, x5   ;                IF   ID   EX   MEM  WB (EX->EX fwd x2!)`,
        explanation:
          "Before scheduling, `add x2, x1, x3` immediately follows `lw x1, 0(x10)`, forcing a 1-cycle bubble until `lw` finishes MEM. Placing an independent `sub x6, x7, x8` in between lets `x1` forward from MEM/WB directly into `add`'s EX stage with zero stalls.",
        output: `Unscheduled (3 insts): 8 cycles total (1 load-use stall)
Scheduled   (4 insts): 8 cycles total (0 stalls — 4th instruction executed for free!)`,
      },
      {
        title: "1-Bit vs. 2-Bit Saturating Branch Predictor on Nested Loops (Python)",
        language: "python",
        code: `def simulate_predictors(outcomes: str):
    # Nested inner loop of 4 iterations repeated 3 times: T T T N | T T T N | T T T N
    p1 = 1  # 1-bit starts Taken
    p2 = 3  # 2-bit starts Strongly Taken (0:SNT,1:WNT,2:WT,3:ST)
    miss1 = miss2 = 0
    for ch in outcomes:
        taken = (ch == 'T')
        if (p1 == 1) != taken: miss1 += 1
        p1 = 1 if taken else 0

        if (p2 >= 2) != taken: miss2 += 1
        p2 = min(3, p2 + 1) if taken else max(0, p2 - 1)
    return miss1, miss2

seq = "TTTN" * 3
m1, m2 = simulate_predictors(seq)
print(f"Sequence: {seq} ({len(seq)} branches)")
print(f"1-bit misses: {m1} (misses BOTH loop exit AND next loop re-entry!)")
print(f"2-bit misses: {m2} (misses ONLY loop exit!)")`,
        explanation:
          "On each inner loop exit ('N'), a 1-bit predictor immediately flips to Predict-Not-Taken, causing a SECOND misprediction on the first iteration of the next outer loop pass. A 2-bit counter drops from ST (3) to WT (2), keeping the next pass predicted Taken.",
        output: `Sequence: TTTNTTTNTTTN (12 branches)
1-bit misses: 5 (misses BOTH loop exit AND next loop re-entry!)
2-bit misses: 3 (misses ONLY loop exit!)`,
      },
    ],
    connections: [
      {
        lessonSlug: "control-unit-fetch-decode-execute",
        relationship:
          "Transforms the sequential multi-cycle IF/ID/EX/MEM/WB FSM into 5 concurrent hardware pipeline stages.",
      },
      {
        lessonSlug: "out-of-order-superscalar-simd",
        relationship:
          "Next lesson breaks past the single-issue in-order CPI=1 ceiling using superscalar width, register renaming, and out-of-order scheduling.",
      },
      {
        lessonSlug: "cryptography-memory-hardware-security",
        relationship:
          "Speculative execution past predicted branches later gives rise to Spectre transient side-channel vulnerabilities (Lesson 44).",
      },
    ],
    realWorldApplications: [
      {
        title: "5-Stage Textbook Pipeline vs. 14–19 Stage Commercial Pipelines",
        simplifiedVsReal:
          "A textbook 5-stage pipeline resolves branches in EX (2-cycle flush penalty) and fits L1 access in one cycle. High-frequency x86-64/ARM64 cores split Decode, Rename, Dispatch, Execute, and Retire into 14–19 stages.",
        modernExample:
          "Intel Golden Cove / Raptor Cove (~14–17 stages) and AMD Zen 4 (~13–19 stages) pay a ~13–18 cycle penalty on a branch misprediction—making branch prediction accuracy the single highest-leverage frontend bottleneck.",
      },
      {
        title: "2-Bit BHT vs. TAGE + Indirect Branch + Return Address Stack",
        simplifiedVsReal:
          "A simple PC-indexed 2-bit table cannot track multi-branch correlation (`if (a) ... if (b) ... if (a && b)`). Real predictors combine TAGE global-history tables, indirect branch predictors (ITTAGE), and a hardware Return Address Stack (RAS) for `ret`.",
        modernExample:
          "Modern TAGE-SC-L predictors (used in Samsung, AMD, Intel, and Apple cores) achieve >99% accuracy on SPEC benchmarks by correlating patterns across hundreds of prior branches.",
      },
    ],
    misconceptions: [
      {
        myth: "Pipelining makes each individual instruction execute in fewer nanoseconds.",
        reality:
          "Pipelining increases *throughput* (instructions finished per second), not individual instruction latency! Because of inter-stage pipeline register setup/clock-to-Q overhead, a single isolated instruction actually takes slightly longer end-to-end.",
      },
      {
        myth: "Data forwarding eliminates all data hazard stalls, including after `LOAD` instructions.",
        reality:
          "EX-to-EX and MEM-to-EX forwarding eliminate stalls for ALU-to-ALU dependencies, but a `load` followed immediately by an ALU consumer in a classic 5-stage pipeline still stalls 1 cycle because memory data only arrives at the end of `MEM`.",
      },
    ],
    deepDive: {
      title: "Forwarding Priority: What If Both EX/MEM and MEM/WB Match?",
      content:
        "Consider this three-instruction chain:\n```asm\nadd x1, x2, x3   # oldest\nadd x1, x1, x4   # middle (overwrites x1!)\nadd x5, x1, x6   # youngest (needs middle's x1!)\n```\nWhen `add x5, x1, x6` enters `EX`, the oldest instruction sits in `MEM/WB` (with stale `x1`) and the middle instruction sits in `EX/MEM` (with the newest `x1`). Both pipeline registers have `RegWrite == 1` and `rd == x1`! Therefore, the Forwarding Unit MUST prioritize `EX/MEM` over `MEM/WB` (`if (EX_MEM_match) forward EX/MEM else if (MEM_WB_match) forward MEM/WB`), and guard both with `rd != 0` so writes to hardwired zero register `x0` never forward nonzero junk.",
    },
    revisionNotes: [
      "Pipelining overlaps IF, ID, EX, MEM, WB via inter-stage registers to maximize throughput (ideal CPI = 1).",
      "Structural hazards are eliminated via split L1i/L1d caches and write-first/read-second register file timing.",
      "Forwarding (EX/MEM -> EX, MEM/WB -> EX) removes ALU-ALU RAW stalls; load-use still incurs a 1-cycle bubble.",
      "2-bit saturating counters tolerate a single anomalous branch (like inner loop exit) without thrashing.",
      "Effective CPI = 1 + load_use_stalls + f_branch * p_mispredict * flush_penalty.",
    ],
    glossaryTermIds: [
      "instruction-pipeline",
      "pipeline-hazard",
      "data-forwarding",
      "branch-prediction",
      "program-counter",
    ],
    references: [
      {
        title: "Computer Organization and Design (Chapter 4.5–4.8: Pipelining & Hazards)",
        author: "David A. Patterson & John L. Hennessy",
        url: "https://www.elsevier.com/books/computer-organization-and-design-risc-v-edition/patterson/978-0-12-820331-6",
        type: "book",
        note: "Classic derivation of forwarding equations, hazard detection, and branch flushes.",
      },
      {
        title: "A Case for (Partially) TAgged GEometric History Length Branch Prediction (TAGE)",
        author: "André Seznec & Pierre Michaud",
        url: "https://jilp.org/vol8/v8paper1.pdf",
        type: "paper",
        note: "The landmark paper behind modern >99%-accurate CPU branch predictors.",
      },
      {
        title: "Two-Level Adaptive Training Branch Prediction",
        author: "Tse-Yu Yeh & Yale N. Patt (MICRO 1991)",
        url: "https://dl.acm.org/doi/10.1145/123465.123475",
        type: "paper",
        note: "Introduced global/local branch history tables correlating across consecutive branches.",
      },
    ],
    assessments: [
      {
        id: "l21-q1",
        type: "predict-output",
        difficulty: "intermediate",
        prompt:
          "A classic 5-stage pipeline (IF, ID, EX, MEM, WB) with full EX-to-EX & MEM-to-EX forwarding and load-use hazard detection executes these 3 instructions starting at Cycle 1. In which cycle does the 3rd instruction (`sub`) finish `WB`?",
        codeSnippet: `lw  x1, 0(x2)
add x3, x1, x4
sub x5, x3, x6`,
        codeLanguage: "asm",
        options: [
          {
            id: "a",
            text: "Cycle 7",
            explanation:
              "Without a load-use stall, 3 instructions would finish at cycle 5+2 = 7; check the load-use dependency on x1.",
          },
          {
            id: "b",
            text: "Cycle 8",
            explanation:
              "Correct! `lw` finishes WB in Cycle 5. `add` stalls 1 cycle between ID and EX (finishing WB in Cycle 7), and `sub` follows 1 cycle behind `add` via EX->EX forwarding on x3, finishing WB in Cycle 8.",
          },
          {
            id: "c",
            text: "Cycle 9",
            explanation:
              "`sub` uses `x3` produced by `add`'s ALU, which forwards EX-to-EX with zero additional stall.",
          },
          {
            id: "d",
            text: "Cycle 15",
            explanation: "15 cycles would be completely unpipelined multi-cycle execution.",
          },
        ],
        correctAnswer: "b",
        hints: [
          "Count 5 cycles for `lw`, +1 cycle for `add`, +1 cycle for the load-use bubble, +1 cycle for `sub`.",
        ],
        explanation:
          "1st instruction (`lw`) completes WB in Cycle 5. `add` depends on `lw`'s `x1` (load-use), stalling 1 cycle to complete WB in Cycle 7. `sub` forwards `x3` EX-to-EX from `add` with 0 extra stalls, finishing WB in Cycle 8.",
        conceptTag: "load-use-forwarding",
      },
      {
        id: "l21-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A pipelined CPU has ideal $\\text{CPI} = 1.0$, zero data stalls, $20\\%$ ($0.20$) branch instructions, $95\\%$ branch prediction accuracy ($p_{\\text{miss}} = 0.05$), and a $14$-cycle misprediction flush penalty. What is its effective CPI?",
        latex: "\\text{CPI}_{\\text{eff}} = 1.0 + (0.20 \\times 0.05 \\times 14)",
        correctAnswer: 1.14,
        numericTolerance: 0.01,
        hints: [
          "Multiply branch frequency (0.20) * mispredict rate (0.05) * flush penalty (14) and add 1.0.",
        ],
        explanation:
          "Branch misprediction penalty per instruction = 0.20 * 0.05 * 14 = 0.14 cycles, yielding effective CPI = 1.14.",
        conceptTag: "branch-cpi",
      },
      {
        id: "l21-q3",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "Why does a 2-bit saturating branch predictor outperform a 1-bit predictor on a repeating inner loop (e.g., 10 Taken iterations followed by 1 Not-Taken exit)?",
        options: [
          {
            id: "a",
            text: "It stays in Strongly Taken -> Weakly Taken upon loop exit, so it mispredicts only once (on exit) instead of twice (exit + next loop entry).",
            explanation:
              "Correct! A 1-bit predictor flips immediately on loop exit and therefore mispredicts again when the loop re-enters on the next outer iteration.",
          },
          {
            id: "b",
            text: "It predicts both the Taken and Not-Taken paths in parallel using two ALUs.",
            explanation:
              "A 2-bit counter only stores 4 confidence states for a single branch prediction.",
          },
          {
            id: "c",
            text: "It eliminates the need for a Branch Target Buffer (BTB).",
            explanation:
              "BHT predicts direction (Taken/Not-Taken), whereas BTB supplies the target address.",
          },
          {
            id: "d",
            text: "It resolves branch conditions in the IF stage without needing EX.",
            explanation:
              "Branch conditions still resolve later in the pipeline; 2-bit counters only reduce misprediction frequency.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "Trace the 4 states (SNT, WNT, WT, ST) when a single Not-Taken exit occurs after many Taken iterations.",
        ],
        explanation:
          "Starting at Strongly Taken (11), a single Not-Taken loop exit moves the 2-bit counter to Weakly Taken (10)—still predicting Taken when the inner loop starts again—cutting mispredictions per inner loop pass from 2 down to 1.",
        conceptTag: "2bit-predictor",
      },
      {
        id: "l21-q4",
        type: "ordering",
        difficulty: "intermediate",
        prompt:
          "Order the steps when a 5-stage speculative pipeline encounters a mispredicted conditional branch resolved in `EX`.",
        orderingItems: [
          "Correct target instructions begin fetching cleanly from the updated PC",
          "IF stage predicts Not-Taken and fetches sequential PC+4, PC+8 instructions",
          "EX stage detects actual branch outcome != predicted outcome",
          "Hazard/flush logic clears IF/ID and ID/EX control signals and loads true target into PC",
        ],
        correctAnswer: [
          "IF stage predicts Not-Taken and fetches sequential PC+4, PC+8 instructions",
          "EX stage detects actual branch outcome != predicted outcome",
          "Hazard/flush logic clears IF/ID and ID/EX control signals and loads true target into PC",
          "Correct target instructions begin fetching cleanly from the updated PC",
        ],
        hints: [
          "Speculative instructions enter IF/ID before EX detects the mistake and flushes them.",
        ],
        explanation:
          "First IF speculatively fetches sequential instructions; when EX computes the real branch outcome and detects a mismatch, control flushes IF/ID and ID/EX and redirects PC to the correct target.",
        conceptTag: "branch-flush",
      },
    ],
  },

  // =========================================================================
  // LESSON 22: Out-of-Order Execution, Superscalar & SIMD Vectors
  // =========================================================================
  {
    id: "out-of-order-superscalar-simd",
    slug: "out-of-order-superscalar-simd",
    number: 22,
    title: "Out-of-Order Execution, Superscalar & SIMD Vectors",
    subtitle:
      "Breaking the CPI = 1 barrier with multi-issue superscalar execution, register renaming, Tomasulo/ROB out-of-order scheduling, and wide SIMD vector lanes.",
    trackId: "track-2",
    domainId: "modern-cpu",
    moduleTitle: "Module 8: Modern Microarchitecture",
    chapterTitle: "Chapter 8: Pipelining, OoO & SIMD",
    estimatedMinutes: 55,
    difficulty: "advanced",
    status: "complete",
    prerequisites: ["pipelining-hazards-branch-prediction"],
    objectives: [
      "Explain why scalar in-order execution hits an instruction-level parallelism (ILP) ceiling and stalls completely on L2/DRAM cache misses.",
      "Trace how Register Renaming via the Register Alias Table (RAT) and Physical Register File (PRF) eliminates false WAR and WAW dependencies.",
      "Explain how the Issue Queue, Execution Ports, Load-Store Queue (LSQ), and Reorder Buffer (ROB) achieve out-of-order execution with strict in-order commit.",
      "Calculate SIMD vector speedups and lane counts for AVX2, AVX-512, ARM NEON/SVE, and RISC-V RVV, recognizing memory-bandwidth limits.",
    ],
    depthExplanations: {
      beginner:
        "An in-order pipelined CPU is like a single-file grocery checkout line: if the customer at the front has to wait 80 cycles for a price check from DRAM, everyone behind them freezes—even customers holding a single item with cash ready! **Out-of-Order Superscalar** CPUs open multiple checkout lanes (superscalar), let ready instructions jump ahead of stalled ones (out-of-order), and still hand receipts back in the original order so the program never notices. Meanwhile, **SIMD** acts like a multi-slot cart scanner processing 8 or 16 array numbers in a single instruction.",
      intermediate:
        "A **superscalar** core widens every pipeline stage to fetch, decode, and execute $W = 4\\text{–}8$ instructions per cycle, pushing sustained IPC above 1. However, in-order superscalar execution still stalls on cache misses and false register conflicts (**WAR** and **WAW**) caused by having only 16–32 ISA register names.\n\nModern **Out-of-Order (OoO)** cores (evolved from Tomasulo's 1967 algorithm) separate **Rename/Dispatch**, **Out-of-Order Issue/Execute**, and **In-Order Retire**:\n1. **Register Renaming:** The **Register Alias Table (RAT)** maps each architectural destination (`rax`, `x1`) to a fresh slot in a huge **Physical Register File (PRF)** (e.g., 200–300+ registers), instantly eliminating all WAR and WAW hazards.\n2. **Issue Queue (Reservation Stations):** Dispatched micro-ops wait until their true RAW source physical registers are ready, then fire onto any free ALU/Load/Vector execution port—jumping past stalled cache-miss loads!\n3. **Reorder Buffer (ROB):** Tracks every in-flight instruction in program order and commits results only at the head of the ROB, guaranteeing **precise exceptions** and clean mispredicted-branch rollback.",
      advanced:
        "Scaling OoO windows to 300–600+ ROB entries exposes two subtle hardware subsystems: the **Load-Store Queue (LSQ)** and **Memory Disambiguation**. Because memory addresses aren't known at Rename time, loads speculatively execute ahead of older stores with unknown addresses, using store-to-load forwarding when addresses match and flushing if an older store later collides with a younger speculative load. Simultaneous Multithreading (**SMT / Hyper-Threading**) shares the wide OoO execution engine across two architectural thread contexts (separate RATs/PCs/ROBs) to fill idle execution ports during cache stalls.\n\nBeyond Instruction-Level Parallelism (ILP), **Data-Level Parallelism (SIMD)** packs $L = W_{\\text{vec}} / W_{\\text{elem}}$ lanes per instruction: 256-bit **AVX2** executes eight `fp32` FMA operations (16 FLOPs/cycle/port), while **ARM SVE2** and **RISC-V Vector (RVV)** introduce Vector-Length-Agnostic (VLA) predication so one compiled binary scales seamlessly across 128-bit, 256-bit, or 512+ bit hardware.",
    },
    intuition:
      "Register renaming gives every instruction its own private whiteboard (`p32`, `p33`, `p34`) instead of fighting over `x1`, the Issue Queue launches whoever has their ingredients ready, and the ROB acts as an airlock ensuring results become permanently visible in strict program order.",
    technicalTheory:
      "Consider two independent loop iterations reusing architectural register `x1`:\n- `I1: lw x1, 0(x10)` / `I2: add x2, x1, x3`\n- `I3: lw x1, 8(x10)` / `I4: add x4, x1, x5`\nWithout renaming, `I3` has a **WAW** (Write-After-Write) hazard with `I1` and a **WAR** (Write-After-Read) hazard with `I2`, forcing sequential execution. Using a **Register Alias Table (RAT)** and **Free List**, the Rename unit allocates fresh physical registers `p32, p33, p34, p35`:\n- `I1: lw p32, 0(p10)` / `I2: add p33, p32, p3` (only RAW `p32`)\n- `I3: lw p34, 8(p10)` / `I4: add p35, p34, p5` (only RAW `p34`)\nNow `I3` and `I4` execute completely in parallel with `I1` and `I2`! Only **true RAW** dependencies remain.\n\n**In-Order Commit via ROB:**\nIf `I3` triggers a page fault or `I2` follows a mispredicted branch, out-of-order writes must not corrupt architectural state. The circular **Reorder Buffer (ROB)** stores `(inst_pc, arch_rd, prev_phys_rd, new_phys_rd, ready, exception)` in fetch order. When `I1` reaches the ROB head without an exception, `prev_phys_rd` returns to the Free List and `I1` retires. On a branch misprediction or trap, the core flashes the RAT back to the committed checkpoint and reclaims younger physical registers.\n\n**SIMD Throughput & Roofline Bound:**\nA single SIMD vector register of width $W_{\\text{vec}}$ bits holds $L = W_{\\text{vec}} / W_{\\text{elem}}$ lanes. With dual FMA ports ($a \\times b + c = 2$ FLOPs/lane), peak core FLOPs/cycle is:\n$$\\text{FLOPs/cycle} = N_{\\text{ports}} \\times \\frac{W_{\\text{vec}}}{W_{\\text{elem}}} \\times 2_{\\text{FMA}}$$\nHowever, **Amdahl's Law** and **DRAM bandwidth** constrain real speedups: if scalar code or unvectorized branches take fraction $(1 - p)$ of runtime, overall speedup is capped by $S \\le \\frac{1}{(1 - p) + p/L}$.",
    mechanisms: [
      {
        step: 1,
        title: "Superscalar Fetch & Parallel Decode",
        detail:
          "Frontend fetches 16–32 instruction bytes per cycle (or streams from the uOp Cache) and decodes 4–8 instructions simultaneously into micro-ops.",
        stateNote: "Width W = 4..8 uOps/cycle",
      },
      {
        step: 2,
        title: "Register Renaming (RAT + Free List)",
        detail:
          "Each source architectural register reads its latest physical tag from the RAT; each destination pops a fresh physical register from the Free List and updates the RAT, removing all WAR/WAW hazards.",
        stateNote: "ArchReg -> PhysReg (p0..p255); ROB slot allocated",
      },
      {
        step: 3,
        title: "Out-of-Order Wakeup & Port Dispatch",
        detail:
          "Micro-ops enter the Issue Queue / Scheduler and wake up as soon as their source tags broadcast ready on the Common Data Bus / bypass, firing onto idle ALU, FMA/SIMD, Branch, or AGU ports.",
        stateNote: "Ready uOps execute out-of-order around stalled cache misses",
      },
      {
        step: 4,
        title: "Memory Disambiguation in the LSQ",
        detail:
          "Store Queue buffers speculative stores until commit (never polluting L1d prematurely!), forwarding data straight to matching younger loads via Store-to-Load Forwarding.",
        stateNote: "Speculative stores wait in SQ until ROB head commit",
      },
      {
        step: 5,
        title: "In-Order ROB Retirement (Precise Exceptions)",
        detail:
          "Completed instructions wait at the ROB head to retire strictly in original program order, freeing overwritten physical registers and draining committed stores into L1d.",
        stateNote: "ROB head retires -> architectural state + stores committed",
      },
    ],
    mathNotes: [
      {
        title: "Peak SIMD FMA Throughput",
        latex: "\\text{Peak FLOPs/cycle} = N_{\\text{FMA ports}} \\times \\left(\\frac{W_{\\text{vec}}}{W_{\\text{elem}}}\\right) \\times 2",
        explanation:
          "A single core with 2 x 256-bit AVX2 FMA units operating on 32-bit floats (8 lanes each) reaches 2 * 8 * 2 = 32 single-precision FLOPs per clock cycle.",
      },
      {
        title: "Amdahl's Law for Vectorization",
        latex: "S(L) = \\frac{1}{(1 - p) + \\frac{p}{L}}",
        explanation:
          "If only 80% (p = 0.80) of a program vectorizes onto L = 8 AVX2 lanes, speedup cannot exceed 1 / (0.20 + 0.80/8) = 3.33x, not 8x.",
      },
    ],
    simulatorId: "pipeline-hazard",
    simulatorPrompt:
      "Revisit the 5-Stage Pipeline & Hazard Visualizer to inspect how an in-order pipeline freezes behind a cache-miss load or RAW stall—then compare that stall cascade against how an out-of-order Issue Queue lets independent younger instructions execute immediately.",
    diagram: {
      title: "Modern Out-of-Order Superscalar Core Pipeline",
      caption:
        "In-order Fetch/Decode/Rename feeds an out-of-order Issue Queue + multi-port Execution Engine, which reconverges into strict in-order ROB Retirement.",
      nodes: [
        {
          id: "fe",
          label: "Wide Fetch & Decode",
          sublabel: "4–8 uOps/cycle",
          x: 30,
          y: 120,
          tone: "accent",
        },
        {
          id: "rename",
          label: "Rename (RAT) & Alloc",
          sublabel: "Eliminate WAR / WAW",
          x: 215,
          y: 120,
          tone: "amber",
        },
        {
          id: "iq",
          label: "OoO Issue Queue + LSQ",
          sublabel: "Wakeup on Ready Tags",
          x: 410,
          y: 45,
          tone: "emerald",
        },
        {
          id: "exec",
          label: "Multi-Port Exec + SIMD",
          sublabel: "ALU / FMA / AGU Ports",
          x: 640,
          y: 45,
          tone: "emerald",
        },
        {
          id: "rob",
          label: "Reorder Buffer (ROB)",
          sublabel: "In-Order Commit & Rollback",
          x: 410,
          y: 205,
          tone: "accent",
        },
        {
          id: "prf",
          label: "Physical Register File",
          sublabel: "200–300+ Registers",
          x: 640,
          y: 205,
          tone: "neutral",
        },
      ],
      edges: [
        { from: "fe", to: "rename", label: "In-Order" },
        { from: "rename", to: "iq", label: "Renamed uOps" },
        { from: "rename", to: "rob", label: "Allocate Tail" },
        { from: "iq", to: "exec", label: "OoO Issue" },
        { from: "exec", to: "prf", label: "Write Result" },
        { from: "exec", to: "rob", label: "Mark Complete" },
        { from: "rob", to: "rename", label: "In-Order Retire / Free" },
      ],
    },
    codeExamples: [
      {
        title: "How Register Renaming Eliminates False WAR/WAW Hazards",
        language: "asm",
        code: `; Architectural instructions reusing x1 across two independent computations:
I1: ld   x1, 0(x10)    ; slow cache miss (e.g. 200 cycles!)
I2: addi x2, x1, 1     ; true RAW on I1's x1
I3: ld   x1, 8(x10)    ; WAW with I1 & WAR with I2 in architectural ISA!
I4: addi x4, x1, 2     ; true RAW on I3's x1

; After Hardware Register Renaming (RAT + Free List p32..p35):
I1: ld   p32, 0(p10)   ; writes p32 (wait on DRAM miss)
I2: addi p33, p32, 1   ; waits ONLY for p32
I3: ld   p34, 8(p10)   ; writes p34 -> NO conflict with p32! Executes NOW!
I4: addi p35, p34, 2   ; executes as soon as p34 returns from L1d!`,
        explanation:
          "Because architectural register x1 is merely a logical name, mapping the second `ld x1` to physical register `p34` completely untangles I3/I4 from I1/I2. I3 and I4 can execute and complete hundreds of cycles before I1 returns from DRAM, waiting quietly in the ROB until I1/I2 retire first.",
        output: `In-Order CPU:   I3/I4 stall ~200 cycles behind I1's DRAM miss
Out-of-Order:   I3/I4 finish in ~5 cycles (hidden under I1's miss!), retire in order after I2`,
      },
      {
        title: "AVX2 8-Wide SIMD Vector FMA in C (Intrinsics)",
        language: "c",
        code: `#include <immintrin.h>
#include <stddef.h>

// Computes out[i] = a[i] * b[i] + c[i] for N floats (N multiple of 8)
void saxpy_fma_avx2(const float *a, const float *b, const float *c,
                    float *out, size_t n) {
    for (size_t i = 0; i < n; i += 8) {
        __m256 va = _mm256_loadu_ps(a + i);       // load 8 x 32-bit floats
        __m256 vb = _mm256_loadu_ps(b + i);
        __m256 vc = _mm256_loadu_ps(c + i);
        __m256 vr = _mm256_fmadd_ps(va, vb, vc);  // 8 FMAs (16 FLOPs) in 1 inst!
        _mm256_storeu_ps(out + i, vr);
    }
}`,
        explanation:
          "For n = 1024 floats, scalar code executes 1024 loop iterations (1024 muls + 1024 adds). AVX2 executes only 128 iterations, computing 8 parallel multiply-adds per `_mm256_fmadd_ps` instruction.",
        output: `n = 1024 fp32 elements:
Scalar loop: 1024 iterations (2048 scalar FP ops)
AVX2 loop:    128 iterations ( 128 VFMADD213PS insts -> 8x fewer insts)`,
      },
    ],
    connections: [
      {
        lessonSlug: "pipelining-hazards-branch-prediction",
        relationship:
          "Extends the single-issue in-order 5-stage pipeline into wide superscalar out-of-order execution with ROB speculation.",
      },
      {
        lessonSlug: "ir-llvm-optimization-codegen",
        relationship:
          "Optimizing compilers generate loop-unrolled, auto-vectorized SIMD code and schedule instructions to expose ILP to the OoO window.",
      },
      {
        lessonSlug: "gpu-simt-warps-memory",
        relationship:
          "Contrasts CPU latency-oriented OoO + SIMD cores with throughput-oriented GPU SIMT warps that trade away OoO ROBs for thousands of parallel threads.",
      },
    ],
    realWorldApplications: [
      {
        title: "Textbook 5-Stage MIPS vs. Intel Golden Cove & Apple M3/M4",
        simplifiedVsReal:
          "A textbook 5-stage core issues 1 instruction/cycle in strict order with 32 registers. Flagship CPUs are massive out-of-order dataflow engines with hundreds of speculative micro-ops in flight simultaneously.",
        modernExample:
          "Apple M3/M4 Firestorm/Avalanche cores decode 8–10 instructions wide with a 600+ entry ROB and giant physical register files; Intel Golden Cove decodes 6-wide with a 512-entry ROB and 2-way Hyper-Threading (SMT).",
      },
      {
        title: "Fixed-Width AVX vs. Vector-Length-Agnostic ARM SVE2 / RISC-V RVV",
        simplifiedVsReal:
          "x86 SIMD evolved through fixed-width instruction sets (128b SSE -> 256b AVX2 -> 512b AVX-512), forcing binaries to ship separate code paths and recompile for wider registers.",
        modernExample:
          "ARM SVE2 and RISC-V Vector (RVV) encode vector loops in a Vector-Length-Agnostic (VLA) style with hardware `vl` length registers and per-lane predicate masks—one binary automatically scales across 128-bit edge cores and 512-bit/1024-bit HPC servers.",
      },
    ],
    misconceptions: [
      {
        myth: "Register renaming eliminates ALL data dependencies, including RAW hazards.",
        reality:
          "Register renaming ONLY eliminates false name dependencies (WAR and WAW). True Read-After-Write (RAW) dataflow dependencies still require the consumer micro-op to wait in the Issue Queue until the producer broadcasts its physical register result.",
      },
      {
        myth: "Out-of-order CPUs allow instructions to become visible to software out of order on an exception.",
        reality:
          "Execution is out-of-order, but **retirement (commit)** at the ROB head is strictly in-order. If an instruction faults, all younger instructions are squashed cleanly so software sees exact sequential semantics.",
      },
      {
        myth: "512-bit SIMD always yields an 8x or 16x speedup on every loop.",
        reality:
          "Data-heavy loops are often bottlenecked by L2/DRAM memory bandwidth rather than ALU FLOPs (memory-bound on the Roofline model), and some CPUs reduce clock frequency slightly during heavy AVX-512 bursts.",
      },
    ],
    deepDive: {
      title: "Store-to-Load Forwarding & Speculative Memory Disambiguation",
      content:
        "Register renaming is easy because register indices (`rs1`, `rd`) are hardcoded inside instruction bits at Decode. **Memory** addresses (`[rbp - 16]` vs `[rdi + rcx*8]`) are NOT known until the Address Generation Units (AGUs) finish computing them during Execute!\n\nTo keep loads from stalling behind every older store whose address isn't ready yet, modern OoO cores maintain a **Load Queue (LQ)** and **Store Queue (SQ)** inside the LSQ. A **Memory Dependence Predictor** guesses whether a younger load aliases an older unresolved store. If predicted independent, the load reads L1d immediately; if an older store later resolves to the exact same address, hardware performs **Store-to-Load Forwarding** (reading the store's buffered bytes directly from the SQ without waiting for L1d) or, if the load already read stale L1d data, triggers a memory-order violation pipeline replay from the ROB.",
    },
    revisionNotes: [
      "Superscalar CPUs fetch/decode/issue W > 1 instructions per cycle, exceeding IPC = 1.",
      "Register renaming (RAT + Physical Register File) eliminates false WAR and WAW hazards; true RAW remains.",
      "Issue Queue wakes ready uOps out of order; Reorder Buffer (ROB) commits strictly in program order for precise exceptions.",
      "Load-Store Queue (LSQ) buffers speculative stores until commit and supports store-to-load forwarding.",
      "SIMD executes one instruction across L = VectorBits / ElementBits parallel lanes (AVX2, AVX-512, NEON, SVE2, RVV).",
    ],
    glossaryTermIds: [
      "tomasulo-ooo",
      "simd-vector",
      "register-file",
      "pipeline-hazard",
      "isa",
    ],
    references: [
      {
        title: "An Efficient Algorithm for Exploiting Multiple Arithmetic Units",
        author: "Robert M. Tomasulo (IBM Journal of R&D, 1967)",
        url: "https://ieeexplore.ieee.org/document/5392028",
        type: "paper",
        note: "The original paper introducing reservation stations, register renaming tags, and the Common Data Bus.",
      },
      {
        title: "Computer Architecture: A Quantitative Approach (Chapter 3 & 4: ILP & DLP)",
        author: "John L. Hennessy & David A. Patterson",
        url: "https://www.elsevier.com/books/computer-architecture/hennessy/978-0-12-811905-1",
        type: "book",
        note: "Rigorous coverage of Tomasulo + ROB, memory disambiguation, SMT, and SIMD vector architectures.",
      },
      {
        title: "Optimizing Software in C++ & Microarchitecture of Intel, AMD and VIA CPUs",
        author: "Agner Fog",
        url: "https://www.agner.org/optimize/",
        type: "docs",
        note: "Authoritative empirical measurements of uop caches, ROB sizes, execution ports, and SIMD latencies.",
      },
    ],
    assessments: [
      {
        id: "l22-q1",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "Why does an Out-of-Order processor maintain a Reorder Buffer (ROB) to commit instructions strictly in program order even though they execute out of order?",
        options: [
          {
            id: "a",
            text: "To guarantee precise exceptions, sequential architectural state, and clean rollback on branch mispredictions.",
            explanation:
              "Correct! Without in-order ROB commit, a younger instruction could overwrite registers or memory before an older faulting instruction or mispredicted branch is detected.",
          },
          {
            id: "b",
            text: "Because the ALU can only perform additions in program order.",
            explanation: "Execution units process any ready uOp out of order.",
          },
          {
            id: "c",
            text: "To increase the DRAM refresh interval from 64 ms to 128 ms.",
            explanation: "ROB is an intra-core execution structure unrelated to DRAM refresh.",
          },
          {
            id: "d",
            text: "To convert 256-bit SIMD instructions into 8-bit scalar instructions.",
            explanation: "SIMD vectors execute natively across vector execution ports.",
          },
        ],
        correctAnswer: "a",
        hints: [
          "What happens if instruction #20 finishes before instruction #15, and instruction #15 triggers a page fault or branch mispredict?",
        ],
        explanation:
          "In-order ROB retirement ensures that speculative or out-of-order results (and buffered stores in the SQ) only become permanent architectural state once all older instructions have succeeded without traps or mispredictions.",
        conceptTag: "rob-precise-exceptions",
      },
      {
        id: "l22-q2",
        type: "matching",
        difficulty: "rigorous",
        prompt:
          "Match each Out-of-Order microarchitecture structure to its exact responsibility.",
        matchingPairs: [
          {
            id: "m1",
            left: "Register Alias Table (RAT)",
            right: "Maps architectural registers to physical registers to eliminate WAR and WAW hazards",
          },
          {
            id: "m2",
            left: "Issue Queue / Reservation Stations",
            right: "Holds renamed uOps until true RAW operands broadcast ready, then dispatches to ports",
          },
          {
            id: "m3",
            left: "Reorder Buffer (ROB)",
            right: "Tracks all in-flight uOps in program order for precise commit and mispredict recovery",
          },
          {
            id: "m4",
            left: "Load-Store Queue (LSQ)",
            right: "Buffers speculative stores until commit and forwards matching bytes to younger loads",
          },
        ],
        correctAnswer: {
          m1: "Maps architectural registers to physical registers to eliminate WAR and WAW hazards",
          m2: "Holds renamed uOps until true RAW operands broadcast ready, then dispatches to ports",
          m3: "Tracks all in-flight uOps in program order for precise commit and mispredict recovery",
          m4: "Buffers speculative stores until commit and forwards matching bytes to younger loads",
        },
        hints: [
          "RAT handles renaming, Issue Queue handles wakeup/dispatch, ROB handles commit, LSQ handles memory ordering.",
        ],
        explanation:
          "Each OoO structure isolates one concern: RAT removes false register conflicts, Issue Queue finds ready work, LSQ enforces memory ordering/forwarding, and ROB restores sequential commit semantics.",
        conceptTag: "ooo-structures",
      },
      {
        id: "l22-q3",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A single CPU core has 2 execution ports capable of 256-bit AVX2 FMA (`a * b + c`, counting 2 FLOPs per element) on 32-bit single-precision floats (`fp32`). What is the theoretical peak FLOPs per clock cycle for this core?",
        latex: "\\text{FLOPs/clk} = 2\\text{ ports} \\times \\left(\\frac{256}{32}\\text{ lanes}\\right) \\times 2\\text{ FLOPs/FMA}",
        correctAnswer: 32,
        numericTolerance: 0,
        hints: [
          "256 bits / 32 bits per float = 8 lanes per vector. Each FMA performs 1 multiply + 1 add = 2 FLOPs.",
        ],
        explanation:
          "Each 256-bit register holds 256 / 32 = 8 fp32 lanes. One FMA performs 8 * 2 = 16 FLOPs, and 2 parallel FMA ports double that to 32 FLOPs/cycle.",
        conceptTag: "simd-throughput",
      },
      {
        id: "l22-q4",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: Hardware register renaming eliminates true Read-After-Write (RAW) data dependencies so a consumer instruction can execute before its producer computes the input value.",
        correctAnswer: false,
        hints: [
          "Can you add 5 to `x` before `x` has been computed?",
        ],
        explanation:
          "False. Register renaming eliminates false name dependencies (WAR and WAW), but a true RAW dependency reflects real dataflow—the consumer must still wait until the producer writes the physical register.",
        conceptTag: "register-renaming",
      },
    ],
  },
];

