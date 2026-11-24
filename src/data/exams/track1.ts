import type { TrackExam } from "@/types/curriculum";

export const TRACK_1_EXAM: TrackExam = {
  id: "exam-track-1",
  trackId: "track-1",
  title: "Track 1 Mastery Exam: Physics, Silicon, Logic & Information",
  description:
    "Comprehensive 10-question assessment spanning electric fields and RC timing, doped silicon and CMOS transistors, lithography yield, Boolean algebra, combinational/sequential circuits, two's complement, IEEE-754 floating point, and information coding.",
  passingScore: 70,
  questions: [
    {
      id: "exam-t1-q1",
      type: "mcq",
      difficulty: "foundational",
      prompt:
        "A copper PCB trace carries 5 mA of signal current over 15 cm of FR-4 dielectric (eps_r ≈ 4). Which statement accurately compares electron motion and signal arrival?",
      options: [
        {
          id: "a",
          text: "Electrons drift at ~0.1 mm/s while the electromagnetic voltage step propagates at ~0.5c (~1 ns transit).",
          explanation:
            "Correct. Conduction electrons drift slowly due to constant lattice collisions, whereas the electric field wave travels at c / sqrt(eps_r) = 0.5c.",
        },
        {
          id: "b",
          text: "Both electrons and the electromagnetic field travel together at ~0.5c.",
          explanation:
            "Individual electrons scatter every ~25 fs and cannot drift anywhere near relativistic speeds.",
        },
        {
          id: "c",
          text: "The signal waits until electrons physically cross the 15 cm trace.",
          explanation:
            "If signals waited for physical electron transit, a 15 cm trace would take minutes instead of 1 nanosecond.",
        },
        {
          id: "d",
          text: "No electric field exists outside the copper trace.",
          explanation:
            "Energy propagates via Poynting flux E x B through the surrounding dielectric.",
        },
      ],
      correctAnswer: "a",
      hints: ["Separate carrier drift velocity v_d = I/(neA) from wave phase velocity c/sqrt(eps_r)."],
      explanation:
        "Circuits transmit signals at a fraction of light speed via electromagnetic fields while individual electrons drift at sub-millimeter-per-second speeds.",
      conceptTag: "physics-drift-vs-signal",
    },
    {
      id: "exam-t1-q2",
      type: "math",
      difficulty: "intermediate",
      prompt:
        "A CMOS output driver with equivalent pull-up resistance R = 400 Ω charges a metal interconnect + fan-out gate load of C = 250 fF (2.5e-13 F) from 0 V to 1.0 V. What is the approximate 10%–90% rise time (2.2 * R * C) in picoseconds?",
      latex: "t_{10\\%-90\\%} \\approx 2.2 \\times R \\times C",
      correctAnswer: 220,
      numericTolerance: 2,
      hints: ["First compute tau = R * C in picoseconds, then multiply by 2.2."],
      explanation:
        "tau = 400 Ω * 250 fF = 100 ps. Thus t_10-90 ≈ 2.2 * 100 ps = 220 ps.",
      conceptTag: "rc-rise-time",
    },
    {
      id: "exam-t1-q3",
      type: "multi-select",
      difficulty: "intermediate",
      prompt:
        "Which statements accurately describe a static CMOS logic gate (such as a 2-input NAND or inverter)?",
      options: [
        {
          id: "a",
          text: "Its pull-up network uses PMOS transistors and its pull-down network uses NMOS transistors.",
          explanation:
            "Correct. PMOS passes strong 1s (VDD) while NMOS passes strong 0s (GND).",
        },
        {
          id: "b",
          text: "In steady state with constant inputs, one network is OFF so ideal static DC current from VDD to GND is zero (aside from leakage).",
          explanation:
            "Correct. Complementary pull-up/pull-down duality prevents steady-state crowbar paths.",
        },
        {
          id: "c",
          text: "A 2-input CMOS NAND requires two PMOS in series and two NMOS in parallel.",
          explanation:
            "Incorrect. Series PMOS + parallel NMOS implements a 2-input NOR gate; NAND uses parallel PMOS + series NMOS.",
        },
        {
          id: "d",
          text: "Doubling VDD cuts dynamic switching power in half.",
          explanation:
            "Incorrect. Dynamic power scales with V_DD^2, so doubling VDD quadruples (4x) dynamic power.",
        },
      ],
      correctAnswer: ["a", "b"],
      hints: ["Check pull-up/pull-down transistor roles and steady-state current paths."],
      explanation:
        "Static CMOS pairs dual PMOS pull-up and NMOS pull-down networks so zero DC rail-to-rail path exists in steady state.",
      conceptTag: "cmos-fundamentals",
    },
    {
      id: "exam-t1-q4",
      type: "true-false",
      difficulty: "foundational",
      prompt:
        "True or False: Under Poisson defect statistics (Y = exp(-D0 * A)), splitting an 800 mm^2 monolithic processor into eight 100 mm^2 chiplets significantly increases the fraction of defect-free silicon dies recovered per wafer.",
      correctAnswer: true,
      hints: ["Compare exp(-D0 * 8) with exp(-D0 * 1)."],
      explanation:
        "True. Because yield drops exponentially with die area A, smaller chiplets achieve drastically higher yield per die and lose far less silicon area per random defect.",
      conceptTag: "semiconductor-yield",
    },
    {
      id: "exam-t1-q5",
      type: "predict-output",
      difficulty: "intermediate",
      prompt:
        "Evaluate the Boolean expression F(A, B, C) = NOT( (A OR ~B) AND C ) when A = 0, B = 0, and C = 1.",
      options: [
        {
          id: "a",
          text: "0",
          explanation:
            "Correct. ~B = 1, so (A OR ~B) = (0 OR 1) = 1. Then (1 AND C) = (1 AND 1) = 1. Finally NOT(1) = 0.",
        },
        {
          id: "b",
          text: "1",
          explanation:
            "Note that B = 0 makes ~B = 1, so the inner OR evaluates to 1, and C = 1 makes the AND output 1 before the final NOT.",
        },
        {
          id: "c",
          text: "Undefined / High-Z",
          explanation: "All inputs are valid logic levels, so a combinational Boolean gate outputs a definite 0 or 1.",
        },
      ],
      correctAnswer: "a",
      hints: ["Substitute inside-out: first ~B, then OR, then AND, then outer NOT."],
      explanation:
        "~0 = 1 -> (0 | 1) = 1 -> (1 & 1) = 1 -> ~1 = 0. Equivalently by De Morgan: (~A & B) | ~C = (1 & 0) | 0 = 0.",
      conceptTag: "boolean-evaluation",
    },
    {
      id: "exam-t1-q6",
      type: "debugging",
      difficulty: "rigorous",
      prompt:
        "A digital designer builds a fast register-to-register shift path with t_cq_min = 35 ps, t_comb_min = 10 ps, and t_h = 50 ps, while clock skew to the capture flip-flop is t_skew = +25 ps. Even at a slow 10 MHz clock, the chip fails. What is the hold slack and how should it be fixed?",
      options: [
        {
          id: "a",
          text: "Hold slack is -30 ps (violation); fix by inserting combinational delay buffers between the two flip-flops.",
          explanation:
            "Correct. Arrival time (35 + 10 = 45 ps) is 30 ps shorter than required hold + skew (50 + 25 = 75 ps). Only slowing the data path (buffers) or reducing skew fixes a hold violation.",
        },
        {
          id: "b",
          text: "Hold slack is -30 ps (violation); fix by lowering the clock frequency to 1 MHz.",
          explanation:
            "Hold timing depends on a single clock edge and is completely unaffected by clock frequency.",
        },
        {
          id: "c",
          text: "Hold slack is +20 ps (passing); the bug must be unrelated to timing.",
          explanation:
            "You must add t_skew (+25 ps) to t_h (50 ps), giving 75 ps required vs. 45 ps arrival.",
        },
        {
          id: "d",
          text: "Hold slack is -10 ps; fix by increasing VDD to speed up the path.",
          explanation:
            "Speeding up the path shrinks t_cq_min + t_comb_min further, making a hold violation worse!",
        },
      ],
      correctAnswer: "a",
      hints: ["Hold slack = (t_cq_min + t_comb_min) - (t_h + t_skew)."],
      explanation:
        "45 ps - 75 ps = -30 ps hold violation. Because data races through too fast before the skewed capture clock closes its latch, delay buffers must be added to the fast path.",
      conceptTag: "sequential-hold-timing",
    },
    {
      id: "exam-t1-q7",
      type: "ordering",
      difficulty: "intermediate",
      prompt:
        "Order the layers of abstraction in Track 1 from lowest physical foundation up to structured digital information:",
      orderingItems: [
        "Quantized electrons & electric fields",
        "Doped silicon PN junctions & CMOS MOSFET switches",
        "Boolean algebra, combinational adders & clocked flip-flops",
        "Two's complement integers, IEEE-754 floats, UTF-8 & ECC",
      ],
      correctAnswer: [
        "Quantized electrons & electric fields",
        "Doped silicon PN junctions & CMOS MOSFET switches",
        "Boolean algebra, combinational adders & clocked flip-flops",
        "Two's complement integers, IEEE-754 floats, UTF-8 & ECC",
      ],
      hints: ["Follow the module progression of Track 1 from Module 1 to Module 4."],
      explanation:
        "Computing stacks cleanly from electrostatics -> semiconductor switches -> clocked digital logic -> binary data and error-correcting representations.",
      conceptTag: "full-stack-abstraction",
    },
    {
      id: "exam-t1-q8",
      type: "fill-blank",
      difficulty: "intermediate",
      prompt:
        "In 8-bit two's complement, subtracting 25 from 10 (i.e., 10 + (-25)) yields decimal -15. What is the exact 2-digit hexadecimal representation of -15 in 8 bits (e.g., 0x..)?",
      correctAnswer: "0xF1",
      acceptableAnswers: ["0xF1", "0xf1", "F1", "f1"],
      hints: ["+15 is 0x0F (0000 1111). Invert all bits and add 1."],
      explanation:
        "~00001111 + 1 = 11110000 + 1 = 11110001 = 0xF1 (241 unsigned, -15 signed).",
      conceptTag: "twos-complement-hex",
    },
    {
      id: "exam-t1-q9",
      type: "matching",
      difficulty: "intermediate",
      prompt:
        "Match each IEEE-754 binary32 special bit configuration to its meaning:",
      matchingPairs: [
        { id: "m1", left: "E = 0, F = 0", right: "Signed Zero (+0.0 or -0.0)" },
        { id: "m2", left: "E = 0, F != 0", right: "Subnormal number (gradual underflow)" },
        { id: "m3", left: "E = 255, F = 0", right: "Positive or Negative Infinity" },
        { id: "m4", left: "E = 255, F != 0", right: "NaN (Not a Number)" },
      ],
      correctAnswer: {
        m1: "Signed Zero (+0.0 or -0.0)",
        m2: "Subnormal number (gradual underflow)",
        m3: "Positive or Negative Infinity",
        m4: "NaN (Not a Number)",
      },
      hints: ["E=0 handles zero/tiny numbers; E=255 handles overflow/invalid operations."],
      explanation:
        "IEEE-754 reserves the extreme exponents E=0 and E=255 so zero, subnormals, infinities, and NaN fit cleanly inside the 32-bit word.",
      conceptTag: "ieee754-special-values",
    },
    {
      id: "exam-t1-q10",
      type: "mcq",
      difficulty: "rigorous",
      prompt:
        "A 64-bit server memory channel stores 8 ECC check bits alongside every 64 data bits using a SECDED (Single-Error Correct, Double-Error Detect) extended Hamming code. What minimum Hamming distance d_min does this 72-bit code possess, and what happens if 2 bits flip simultaneously in a single word?",
      options: [
        {
          id: "a",
          text: "d_min = 4; the memory controller detects an uncorrectable 2-bit error and raises a Machine Check Exception instead of silently corrupting data.",
          explanation:
            "Correct. Extending Hamming (d_min=3) with one overall parity bit yields d_min = 4: 1-bit errors are corrected; 2-bit errors trigger nonzero syndrome + even overall parity and are flagged uncorrectable.",
        },
        {
          id: "b",
          text: "d_min = 4; the memory controller silently corrects both flipped bits automatically.",
          explanation:
            "Correcting 2 errors requires d_min >= 2(2) + 1 = 5.",
        },
        {
          id: "c",
          text: "d_min = 3; 2-bit errors are silently miscorrected into a 3rd bit flip.",
          explanation:
            "That happens in unextended Hamming (d_min=3), not SECDED (d_min=4).",
        },
        {
          id: "d",
          text: "d_min = 2; only single-bit errors can be detected without correction.",
          explanation: "Simple 1-bit parity has d_min = 2; 8 check bits provide full SECDED.",
        },
      ],
      correctAnswer: "a",
      hints: ["Recall d_min = 3 -> SEC; adding overall parity raises d_min by 1 -> SECDED."],
      explanation:
        "SECDED achieves d_min = 4, guaranteeing 1-bit automatic correction and reliable 2-bit error detection without silent miscorrection.",
      conceptTag: "secded-ecc",
    },
  ],
};
