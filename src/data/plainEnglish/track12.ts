export interface DecodedConcept {
  symbol: string;
  plainName: string;
  whatItMeans: string;
}

export interface PlainEnglishGuide {
  bigPicture: string;
  howItInteracts: string;
  symbolDecoder: DecodedConcept[];
}

export const TRACK_1_2_PLAIN_GUIDES: Record<string, PlainEnglishGuide> = {
  "what-is-an-electron": {
    bigPicture:
      "Every 0 and 1 inside your computer is physically just a tiny cluster of electrons—either parked on a microscopic metal plate or drained away. You do not need quantum physics to follow this: think of electrons as negatively charged marbles already filling every copper wire from end to end. Pushing one marble at the battery immediately nudges the whole line forward, which is why electricity feels instant even though individual electrons drift slower than a snail.",
    howItInteracts:
      "This physical push-and-pull is the foundation of everything that follows: voltage measures how hard we push electrons (Lesson 2), silicon lets us build electrically controlled valves to stop or allow that push (Lessons 4–5), and those valves become the logic gates that add numbers and run software (Lessons 7–8).",
    symbolDecoder: [
      {
        symbol: "Q (Coulomb, C)",
        plainName: "Total Electric Charge",
        whatItMeans:
          "How many electrons' worth of charge you have gathered. One Coulomb is a huge bucket of about 6.24 quintillion electrons.",
      },
      {
        symbol: "e (Elementary Charge)",
        plainName: "Charge of One Electron",
        whatItMeans:
          "The smallest indivisible packet of charge in everyday electronics. Turning a modern transistor on takes only a few thousand of these.",
      },
      {
        symbol: "E (Electric Field)",
        plainName: "Invisible Push Zone",
        whatItMeans:
          "The region around a charge that pushes like charges away and pulls opposite charges in—it is the 'push wave' that races down wires near light speed.",
      },
      {
        symbol: "v_d vs v_p",
        plainName: "Drift Speed vs. Signal Speed",
        whatItMeans:
          "Drift speed (mm/s) is how fast a single electron crawls; signal speed (~half the speed of light) is how fast the 'push' reaches the far end of the wire.",
      },
    ],
  },
  "voltage-current-circuits": {
    bigPicture:
      "Think of a circuit like water pipes: Voltage is water pressure (how hard charge is pushed), Current is flow rate (how much charge passes a point each second), and Resistance is a narrow pipe that slows the flow and turns extra energy into heat. Ohm's Law (V = I × R) simply says: double the pressure and you get double the flow; make the pipe twice as narrow and flow cuts in half.",
    howItInteracts:
      "Because power lost as heat equals Voltage × Current (P = V × I), chip designers lower supply voltage from 5 V down to ~0.8 V to stop CPUs from melting. Every circuit you build later—from CMOS inverters to gigahertz CPUs—obeys these exact pressure, flow, and heat rules.",
    symbolDecoder: [
      {
        symbol: "V (Volts)",
        plainName: "Electrical Pressure (Voltage)",
        whatItMeans:
          "Energy given to each unit of charge. Always measured *between* two points (usually a wire and Ground, 0 V).",
      },
      {
        symbol: "I (Amperes, A)",
        plainName: "Flow Rate (Current)",
        whatItMeans:
          "How much charge flows past a spot every second (1 A = 1 Coulomb/second). More current means thicker wires and more heat.",
      },
      {
        symbol: "R (Ohms, Ω)",
        plainName: "Flow Friction (Resistance)",
        whatItMeans:
          "How strongly a material opposes current. Copper has tiny R; rubber has huge R; resistors have carefully chosen R to control current.",
      },
      {
        symbol: "P = V · I (Watts)",
        plainName: "Heat / Energy per Second",
        whatItMeans:
          "How fast electrical energy turns into heat or work. Your laptop fan spins up when P gets high.",
      },
    ],
  },
  "electromagnetism-rc-timing": {
    bigPicture:
      "In an ideal world, a wire would snap from 0 V (logic 0) to 1 V (logic 1) instantaneously. In the real world, every wire acts like a tiny rechargeable bucket (capacitance) fed through a narrow pipe (resistance). Filling that bucket takes time—and that fill time is literally what sets the maximum clock speed (GHz) of every processor on Earth.",
    howItInteracts:
      "RC charging delay directly controls how fast CMOS gates can switch (Lesson 5), how long signals must settle before a flip-flop captures them (Lesson 9), and why DRAM memory cells slowly leak and need refreshing (Lesson 18).",
    symbolDecoder: [
      {
        symbol: "C (Farads, F)",
        plainName: "Charge Bucket Size (Capacitance)",
        whatItMeans:
          "How much charge a wire or transistor gate must absorb to raise its voltage by 1 V. Smaller C means faster switching and less energy.",
      },
      {
        symbol: "τ = R · C",
        plainName: "Time Constant (Tau)",
        whatItMeans:
          "The natural 'heartbeat' of a wire: after 1 τ of time, the voltage reaches 63.2% of its target; after ~2.2 τ it goes from 10% to 90%.",
      },
      {
        symbol: "L (Henries, H)",
        plainName: "Flow Inertia (Inductance)",
        whatItMeans:
          "A wire's magnetic resistance to sudden changes in current—like a heavy flywheel that resists speeding up or stopping instantly.",
      },
    ],
  },
  "silicon-doping-pn-junction": {
    bigPicture:
      "Pure silicon is a boring crystal where every electron is locked in place, so it barely conducts electricity. By sprinkling in a tiny pinch of impurity atoms ('doping'), engineers create either extra free electrons (N-type, negative) or missing-electron 'parking spots' called holes (P-type, positive). Press a P-type and N-type region together and you get a PN junction—a one-way electrical check-valve (diode) that lets current flow easily in one direction and blocks it in the other.",
    howItInteracts:
      "PN junctions are the physical building blocks inside every MOSFET transistor (Lesson 5). Understanding how voltage widens or shrinks the insulating 'depletion zone' explains how a tiny voltage on a transistor gate turns a piece of silicon from an insulator into a conductor.",
    symbolDecoder: [
      {
        symbol: "N-type / P-type",
        plainName: "Electron-Rich / Hole-Rich Silicon",
        whatItMeans:
          "N-type has extra free electrons (from Phosphorus); P-type has empty electron 'holes' (from Boron) that behave like mobile positive charges.",
      },
      {
        symbol: "Depletion Region",
        plainName: "The Insulating Gap",
        whatItMeans:
          "The thin neutral zone where P and N meet and free charges cancel out, creating a built-in wall (~0.7 V in silicon) that blocks current until pushed open.",
      },
      {
        symbol: "Forward vs. Reverse Bias",
        plainName: "Opening vs. Locking the Valve",
        whatItMeans:
          "Forward bias pushes charges together and shrinks the wall so current flows exponentially; reverse bias pulls them apart and widens the wall.",
      },
    ],
  },
  "mosfets-and-cmos-logic": {
    bigPicture:
      "A MOSFET is an electrically controlled light switch with no moving parts. Put a small voltage on its insulated 'Gate' terminal and an invisible electric field pulls electrons into the silicon below, opening a bridge between 'Source' and 'Drain'. CMOS pairs two opposite switches (an NMOS that turns ON for 1 and a PMOS that turns ON for 0) so that when a gate sits steady, one switch is always OFF—meaning almost zero wasted battery power until the bit actually flips.",
    howItInteracts:
      "CMOS switches are how computers turn messy analog voltages into crisp digital 0s and 1s. Combine 4 transistors and you get a NAND gate (Lesson 7); combine billions of them on a fingernail-sized chip (Lesson 6) and you get an entire CPU or GPU.",
    symbolDecoder: [
      {
        symbol: "Gate / Source / Drain",
        plainName: "Control Handle / Entry / Exit",
        whatItMeans:
          "The Gate is the switch lever (controlled by voltage); Source and Drain are the two ends of the conductive bridge.",
      },
      {
        symbol: "V_th (Threshold Voltage)",
        plainName: "Switch-On Voltage",
        whatItMeans:
          "The minimum Gate voltage needed to create a conductive channel. Below V_th the switch is OFF; above V_th it turns ON.",
      },
      {
        symbol: "CMOS (PMOS + NMOS)",
        plainName: "Complementary Switch Pair",
        whatItMeans:
          "PMOS pulls the output UP to 1 (V_DD); NMOS pulls the output DOWN to 0 (Ground). Because they take turns, steady logic burns almost zero power.",
      },
      {
        symbol: "P = α C V² f",
        plainName: "Dynamic Switching Power",
        whatItMeans:
          "Heat generated by flipping bits: proportional to activity (α), wire capacitance (C), clock frequency (f), and voltage SQUARED (V²).",
      },
    ],
  },
  "semiconductor-fabrication": {
    bigPicture:
      "Making a microchip is like screen-printing a 3D city with billion-building density onto a mirror-smooth slice of purified sand (silicon wafer). Instead of ink, factories shine ultra-short-wavelength ultraviolet light through precision stencils (photomasks) to carve patterns smaller than a virus, repeating hundreds of deposition, etching, and doping layers. Because a single speck of dust can ruin a huge chip, smaller chips ('chiplets') have much higher manufacturing survival rates ('yield').",
    howItInteracts:
      "Fabrication physics explains why transistor shrinking slowed down (Moore's Law), why modern Apple/AMD/NVIDIA processors split giant dies into stitched-together chiplets (Lesson 58), and why GPU/CPU prices depend directly on wafer yield.",
    symbolDecoder: [
      {
        symbol: "Photolithography",
        plainName: "Light-Stencil Printing",
        whatItMeans:
          "Shining light through a mask onto light-sensitive coating (photoresist) so chemicals can etch microscopic transistor shapes into silicon.",
      },
      {
        symbol: "Yield (Y = e^{-AD})",
        plainName: "Surviving Good Chips %",
        whatItMeans:
          "Fraction of chips on a wafer with zero fatal defects. Bigger chip area (A) or more dust/defects per cm² (D) drops yield exponentially.",
      },
      {
        symbol: "Node (e.g., 3 nm)",
        plainName: "Process Generation Name",
        whatItMeans:
          "Modern marketing label for transistor density and power efficiency—no longer a single literal physical wire width.",
      },
    ],
  },
  "boolean-algebra-logic": {
    bigPicture:
      "Boolean algebra is simply math where every number can only be 0 (FALSE / Low voltage) or 1 (TRUE / High voltage). Instead of addition and multiplication, we combine bits with simple rules: AND (both must be 1), OR (at least one is 1), and NOT (flip it). Amazingly, a single gate—NAND ('NOT-AND')—is universal: by wiring copies of just NAND together, you can build every logic operation in any computer.",
    howItInteracts:
      "Boolean algebra lets engineers simplify messy word rules into minimal transistor networks before laying down silicon. In Lesson 8, you combine these exact gates into circuits that add binary numbers and route data; in Lesson 13, they become the CPU's ALU.",
    symbolDecoder: [
      {
        symbol: "AND / OR / NOT / XOR",
        plainName: "Basic Bit Combiners",
        whatItMeans:
          "AND: 1 only if both inputs are 1. OR: 1 if either input is 1. NOT: flips 0↔1. XOR: 1 only if the two inputs are DIFFERENT.",
      },
      {
        symbol: "NAND",
        plainName: "Universal Building Block",
        whatItMeans:
          "AND followed by NOT. Takes only 4 CMOS transistors and can recreate AND, OR, NOT, XOR—and an entire CPU—all by itself.",
      },
      {
        symbol: "De Morgan's Laws",
        plainName: "Gate-Swapping Shortcuts",
        whatItMeans:
          "Rules showing that NOT(A AND B) equals (NOT A) OR (NOT B), letting engineers replace expensive gates with cheaper NAND/NOR equivalents.",
      },
    ],
  },
  "combinational-circuits-adders": {
    bigPicture:
      "A combinational circuit has no memory—its output depends purely on its current inputs, like a pocket calculator button press. By wiring just an XOR gate (for the sum bit) and an AND gate (for the carry bit), we get a Half Adder. Chain 64 Full Adders together and silicon can add two 64-bit numbers; wire a Multiplexer (MUX) and silicon can choose *which* wire's signal to pass forward like a railroad track switch.",
    howItInteracts:
      "Adders and multiplexers are the core muscle inside an ALU (Lesson 13). Meanwhile, waiting for a carry bit to ripple across 64 adders is slow—showing how RC wire delay (Lesson 3) forces clever parallel 'carry-lookahead' circuits.",
    symbolDecoder: [
      {
        symbol: "Half / Full Adder",
        plainName: "1-Bit Binary Adding Circuit",
        whatItMeans:
          "Adds two bits (plus an incoming carry bit in a Full Adder) to produce a Sum bit and a Carry-Out bit—just like grade-school column addition.",
      },
      {
        symbol: "MUX (Multiplexer)",
        plainName: "Digital Railroad Switch",
        whatItMeans:
          "Takes several input wires and uses 'select' bits to route exactly one of them to the output.",
      },
      {
        symbol: "Decoder",
        plainName: "Address Selector",
        whatItMeans:
          "Turns a compact binary number (like 3 bits) into a single active wire out of 8—used to pick which register or memory row to read.",
      },
    ],
  },
  "sequential-logic-flip-flops": {
    bigPicture:
      "Combinational circuits forget everything the instant their inputs change. To remember a score, a variable, or which instruction comes next, computers feed a gate's output back into its own input to form a 'latch'. Adding a rhythmic ticking 'Clock' turns that into a D Flip-Flop—a camera shutter that snapshots the input bit ONLY on the exact rising edge of the clock tick and holds it rock-steady until the next tick.",
    howItInteracts:
      "Group 64 flip-flops side by side and you have a CPU Register (Lesson 13). The time between clock ticks must be long enough for signals to travel through combinational logic and arrive before the next 'camera shutter' closes—directly connecting RC delay (Lesson 3) to CPU GHz.",
    symbolDecoder: [
      {
        symbol: "D Flip-Flop",
        plainName: "1-Bit Clocked Memory Cell",
        whatItMeans:
          "Copies input D to output Q at the exact instant the clock rises from 0→1, then ignores D until the next rising edge.",
      },
      {
        symbol: "Clock (CLK)",
        plainName: "System Metronome",
        whatItMeans:
          "A square wave oscillating billions of times per second (GHz) so every register in the chip updates in lockstep.",
      },
      {
        symbol: "Setup & Hold Time",
        plainName: "Don't Move During the Photo!",
        whatItMeans:
          "The tiny window right before and after a clock edge when input D must stay still so the flip-flop doesn't capture a blurry/corrupt bit.",
      },
    ],
  },
  "binary-hex-signed-integers": {
    bigPicture:
      "Computers only store 0s and 1s, so humans invent conventions to interpret those bits. Binary counts in powers of 2 (1, 2, 4, 8, 16...) instead of 10; Hexadecimal (0–9, A–F) is just shorthand that packs 4 binary bits into 1 tidy character. For negative numbers, computers use 'Two's Complement'—where the leftmost bit has negative weight—so the exact same adder circuit handles both positive and negative math without extra hardware!",
    howItInteracts:
      "Every memory address, RGB color (`#2563EB`), machine opcode (Lesson 16), and C/Rust integer type (`i32`, `u64`, Lesson 28) is just raw binary interpreted through these rules. Integer overflow bugs are a major source of real-world security exploits (Lesson 44).",
    symbolDecoder: [
      {
        symbol: "Bit & Byte",
        plainName: "1 Switch / Group of 8 Switches",
        whatItMeans:
          "1 bit holds 2 states (0/1); 1 byte (8 bits) holds 256 patterns (0–255 unsigned, or −128 to +127 signed).",
      },
      {
        symbol: "Hex (0x...)",
        plainName: "4-Bit Shorthand",
        whatItMeans:
          "Base-16 notation (0–9, A–F). Each hex digit maps cleanly to 4 bits, so 0xFF is 11111111 (255).",
      },
      {
        symbol: "Two's Complement",
        plainName: "Clever Negative-Number Encoding",
        whatItMeans:
          "To negate a number: flip all bits and add 1. Guarantees only one zero and lets normal binary addition handle subtraction automatically.",
      },
    ],
  },
  "ieee-754-floating-point": {
    bigPicture:
      "How do you store both tiny numbers (0.0000001) and huge numbers (300,000,000) in just 32 bits? Computers use binary scientific notation—just like writing 6.02 × 10²³, except in base 2! A 32-bit float splits its bits into 1 Sign bit (+/-), 8 Exponent bits (how big or small), and 23 Mantissa bits (the precise digits). Because fractions like 0.1 repeat forever in base 2 (just like 1/3 = 0.333... in base 10), floats round slightly—which is why 0.1 + 0.2 !== 0.3!",
    howItInteracts:
      "Floating-point precision directly shapes 3D graphics depth buffers (Lesson 46), numerical differentiation error (Lesson 45), and modern AI quantization (Lesson 57), where LLMs shrink from 32-bit floats to BF16, FP8, or INT4 to run 4–8× faster.",
    symbolDecoder: [
      {
        symbol: "Sign / Exponent / Mantissa",
        plainName: "+/- · Scale · Precision Digits",
        whatItMeans:
          "Sign picks positive/negative; Exponent slides the binary point left/right; Mantissa stores the actual significant digits.",
      },
      {
        symbol: "Bias (127 in FP32)",
        plainName: "Zero-Shift for Exponents",
        whatItMeans:
          "Stored exponent = true exponent + 127, so exponents stay unsigned (0–255) and floats can be compared quickly.",
      },
      {
        symbol: "NaN & ±Inf",
        plainName: "Special Error / Overflow Codes",
        whatItMeans:
          "All-1s exponent reserves bit patterns for Infinity (1/0) and Not-a-Number (0/0) so math pipelines don't silently wrap around.",
      },
    ],
  },
  "encoding-compression-ecc": {
    bigPicture:
      "Text, images, and network packets are all just bits with agreed-upon rulebooks. UTF-8 cleverly encodes English in 1 byte while seamlessly expanding to 2–4 bytes for every emoji and world language. Compression shrinks files by giving frequent symbols shorter bit codes (Huffman) or pointing back to repeated phrases (LZ77). Error-Correcting Codes (like Hamming) add a few smart parity bits so memory or Wi-Fi can automatically spot and repair a flipped bit.",
    howItInteracts:
      "UTF-8 powers every web page and LLM tokenizer (Lesson 54), ECC protects DRAM and NAND SSDs from cosmic rays and wear (Lesson 20), and Shannon's entropy limit reappears directly as the cross-entropy loss function that trains AI models (Lesson 50).",
    symbolDecoder: [
      {
        symbol: "UTF-8",
        plainName: "Universal Variable-Length Text Code",
        whatItMeans:
          "Maps every Unicode character to 1–4 bytes while staying 100% backward-compatible with classic 7-bit ASCII.",
      },
      {
        symbol: "Parity / Hamming ECC",
        plainName: "Self-Healing Check Bits",
        whatItMeans:
          "Extra check bits computed via XOR over overlapping groups of data bits—pinpointing the exact bit that flipped so hardware fixes it on the fly.",
      },
      {
        symbol: "CRC",
        plainName: "Fast Corruption Fingerprint",
        whatItMeans:
          "A short checksum tacked onto Ethernet frames and ZIP files to catch burst transmission errors before corrupted data is trusted.",
      },
    ],
  },
  "alu-and-data-paths": {
    bigPicture:
      "The Arithmetic Logic Unit (ALU) is the calculator heart of a CPU. You hand it two numbers from fast scratchpad slots called Registers plus a tiny 'opcode' telling it what to do (ADD, SUB, AND, XOR, compare), and combinational logic computes the answer in a single clock tick. Alongside the numeric result, the ALU raises 4 tiny status flags (Zero, Negative, Carry, Overflow) so the CPU knows whether two numbers were equal or if a calculation overflowed.",
    howItInteracts:
      "Connecting the ALU to a Register File and a Control Unit creates a complete programmable processor (Lesson 14). Those 4 status flags are literally how every `if` statement and `while` loop in your code decides whether to jump or keep going!",
    symbolDecoder: [
      {
        symbol: "ALU",
        plainName: "Arithmetic Logic Unit",
        whatItMeans:
          "The combinational circuit that performs math (ADD/SUB) and bitwise logic (AND/OR/XOR/shifts) on register values.",
      },
      {
        symbol: "Register File",
        plainName: "Ultra-Fast CPU Scratchpad",
        whatItMeans:
          "A small bank (typically 16–32 slots) of flip-flop registers sitting right next to the ALU, readable in less than 1 nanosecond.",
      },
      {
        symbol: "Flags (Z, N, C, V)",
        plainName: "Result Signposts",
        whatItMeans:
          "Z=result is 0; N=result is negative; C=unsigned carry-out; V=signed arithmetic overflow (e.g., positive + positive wrapped negative).",
      },
    ],
  },
  "control-unit-fetch-decode-execute": {
    bigPicture:
      "A CPU is surprisingly simple at its core—it runs one endless loop billions of times a second: (1) FETCH the next instruction from memory using the Program Counter (PC), (2) DECODE its bits to see which operation and registers it asks for, (3) EXECUTE it in the ALU or access memory, and (4) WRITE BACK the result and advance PC. The Control Unit is the orchestra conductor that turns those decoded instruction bits into the exact ON/OFF control wires for every MUX and register.",
    howItInteracts:
      "This 4-step heartbeat explains how stored programs work (Lesson 15), how assembly instructions map directly to hardware actions (Lesson 16), and how modern CPUs overlap multiple instructions simultaneously in a pipeline (Lesson 21).",
    symbolDecoder: [
      {
        symbol: "PC (Program Counter)",
        plainName: "Current Line Bookmark",
        whatItMeans:
          "A special register holding the memory address of the next instruction to fetch. Jumps/loops simply overwrite PC with a new address.",
      },
      {
        symbol: "IR (Instruction Register)",
        plainName: "Active Instruction Holder",
        whatItMeans:
          "Holds the raw binary instruction bits currently being decoded and executed.",
      },
      {
        symbol: "Control Unit",
        plainName: "Hardware Conductor",
        whatItMeans:
          "Translates the opcode bits in IR into control signals (like ALU op, Register Write Enable, Memory Read/Write).",
      },
    ],
  },
  "von-neumann-vs-harvard": {
    bigPicture:
      "In a Von Neumann computer, instructions (your program) and data (your variables) live together in the exact same memory—which is why a compiler can write a program to disk and the OS can immediately run it as code! The downside is the 'Von Neumann bottleneck': one shared highway between CPU and RAM means fetching code and reading data take turns. Modern CPUs use a clever hybrid: separate fast L1 caches for code and data (Harvard inside) backed by one unified main RAM (Von Neumann outside).",
    howItInteracts:
      "This memory-highway bottleneck motivates the entire cache hierarchy (Lesson 19), explains why memory bandwidth limits LLM token generation (Lesson 57), and explains why executable data buffers can be exploited if the OS doesn't enforce W^X security (Lesson 44).",
    symbolDecoder: [
      {
        symbol: "Von Neumann Architecture",
        plainName: "Shared Code + Data Memory",
        whatItMeans:
          "Programs and data sit in one unified address space—flexible and self-hosting, but shares one memory bus.",
      },
      {
        symbol: "Harvard Architecture",
        plainName: "Separate Code & Data Highways",
        whatItMeans:
          "Dedicated buses let the CPU fetch the next instruction at the exact same instant it reads/writes data.",
      },
      {
        symbol: "Bus",
        plainName: "Shared Multi-Wire Highway",
        whatItMeans:
          "Bundles of parallel wires carrying Addresses (where), Data (what), and Control signals (read/write).",
      },
    ],
  },
  "isa-opcodes-x86-arm-riscv": {
    bigPicture:
      "An Instruction Set Architecture (ISA) is the official dictionary of commands a CPU understands—like `ADD`, `LOAD`, `STORE`, and `BRANCH`. Assembly language is just the human-readable spelling of those binary opcodes. x86-64 (CISC) has rich, variable-length instructions built over 45 years; ARM64 and RISC-V (RISC) use clean, fixed-size 32-bit instructions where only explicit LOAD/STORE commands touch RAM, making the decoder simpler and more power-efficient.",
    howItInteracts:
      "Every programming language compiler (Lessons 30–32) ultimately translates your Python, Rust, C, or JS down into one of these ISAs. Understanding load/store vs. register operands also clarifies why registers are so much faster than memory.",
    symbolDecoder: [
      {
        symbol: "ISA",
        plainName: "Hardware-Software Contract",
        whatItMeans:
          "The official list of registers, instructions, and memory rules a CPU promises to support—allowing different chips to run the same software.",
      },
      {
        symbol: "Opcode",
        plainName: "Operation Code Bits",
        whatItMeans:
          "The specific bits inside an instruction that identify *which* action (ADD, SUB, LOAD, JMP) to execute.",
      },
      {
        symbol: "RISC vs. CISC",
        plainName: "Simple Fixed vs. Rich Variable Instructions",
        whatItMeans:
          "RISC (ARM/RISC-V) favors simple fixed-width instructions; CISC (x86-64) packs complex operations into variable-length bytes (translated internally into simple micro-ops).",
      },
    ],
  },
  "stacks-calling-conventions-abi": {
    bigPicture:
      "When function A calls function B, how does B know where to find its arguments, where to put its local variables, and how to return back to the exact line in A without clobbering A's registers? They follow a strict playbook called a Calling Convention (part of the ABI) and use a Stack—a stack of plates in RAM where each function call pushes a 'frame' on top and pops it off when it returns.",
    howItInteracts:
      "The call stack explains recursion, why infinite recursion causes a 'Stack Overflow', how OS threads each need their own stack during context switches (Lesson 24), and how classic buffer-overflow security attacks overwrite the saved return address (Lesson 44).",
    symbolDecoder: [
      {
        symbol: "Stack Pointer (SP)",
        plainName: "Top-of-Stack Bookmark",
        whatItMeans:
          "A CPU register pointing to the current top of the call stack (which usually grows downward toward lower memory addresses).",
      },
      {
        symbol: "Stack Frame",
        plainName: "Function's Temporary Workspace",
        whatItMeans:
          "The slice of stack memory holding one function call's return address, saved registers, and local variables.",
      },
      {
        symbol: "ABI (Calling Convention)",
        plainName: "Binary Handshake Rules",
        whatItMeans:
          "Agreement on which registers pass arguments, which register holds the return value, and who must preserve which registers—letting C, Rust, and OS libraries call each other.",
      },
    ],
  },
  "sram-dram-memory-cells": {
    bigPicture:
      "Why do computers have both tiny, blazing-fast CPU caches AND huge, cheaper RAM? Because they use two different physical memory cells! SRAM locks a bit inside a 6-transistor tug-of-war loop—it's lightning fast and never forgets while powered, but takes lots of chip area. DRAM stores a bit as tiny electric charge on a single microscopic capacitor + 1 transistor—it packs 10× denser and cheaper, but leaks charge in milliseconds and must be constantly refreshed.",
    howItInteracts:
      "The 100× speed gap between SRAM registers/caches (~1 ns) and DRAM main memory (~60–100 ns) is why caches exist (Lesson 19) and why reading data sequentially in memory beats jumping randomly through pointers (Lesson 34).",
    symbolDecoder: [
      {
        symbol: "SRAM (6T Cell)",
        plainName: "Fast Static Cache Memory",
        whatItMeans:
          "Uses 6 transistors per bit in a cross-coupled latch. Expensive and bulky, so used for L1/L2/L3 caches right on the CPU die.",
      },
      {
        symbol: "DRAM (1T1C Cell)",
        plainName: "Dense Main RAM",
        whatItMeans:
          "Uses 1 transistor + 1 tiny capacitor per bit. Reading destroys the charge so it must write back and refresh every ~64 ms.",
      },
      {
        symbol: "Latency vs. Bandwidth",
        plainName: "Wait Time vs. Pipe Width",
        whatItMeans:
          "Latency is how long until the *first* byte arrives (ns); bandwidth is how many GB/s flow once the pipe is full.",
      },
    ],
  },
  "cache-hierarchies-coherence": {
    bigPicture:
      "Fetching a number from main RAM is like walking to a warehouse across town while your CPU sits twiddling its thumbs for 200+ clock cycles. Caches fix this by keeping small, ultra-fast desks (L1, L2, L3 SRAM) right next to the CPU. They work because real programs show Locality: if you used an item recently (temporal) or read index `i` of an array (spatial), you'll likely need it or index `i+1` next—so caches fetch whole 64-byte chunks ('cache lines') at once.",
    howItInteracts:
      "Cache behavior explains why arrays beat linked lists in real benchmarks (Lesson 34), why multi-core CPUs need MESI coherence protocols to avoid stale copies (Lesson 41), and why GPU shared memory tiling accelerates AI matrix math (Lesson 49).",
    symbolDecoder: [
      {
        symbol: "Cache Line (64 B)",
        plainName: "Minimum Fetch Chunk",
        whatItMeans:
          "Caches never fetch a single byte from RAM—they grab a 64-byte aligned block so neighboring array elements come along for free.",
      },
      {
        symbol: "Tag / Index / Offset",
        plainName: "Shelf / Row / Byte Address",
        whatItMeans:
          "Every memory address is sliced into three bitfields: Index picks the cache set, Tag checks if it's the right address, Offset picks the byte inside the 64 B line.",
      },
      {
        symbol: "MESI Coherence",
        plainName: "Multi-Core Cache Agreement",
        whatItMeans:
          "Tracks whether a cache line is Modified, Exclusive, Shared, or Invalid across CPU cores so two cores never see conflicting values.",
      },
    ],
  },
  "flash-ssd-storage-controllers": {
    bigPicture:
      "Unlike RAM, which forgets everything when power is cut, NAND Flash SSDs trap electrons inside an insulated 'floating gate' or charge-trap layer where they stay stuck for years. The catch is that Flash can write small pages (4–16 KB) but can only erase giant blocks (megabytes) at once, and cells wear out after thousands of erases. Inside every SSD sits a tiny hidden computer (the Flash Translation Layer) that silently remaps logical addresses, spreads wear evenly, and runs garbage collection.",
    howItInteracts:
      "Understanding SSD block erasures and sequential vs. random I/O explains why operating system filesystems use journaling/copy-on-write (Lesson 27) and why modern databases like RocksDB use append-only LSM-trees (Lesson 38).",
    symbolDecoder: [
      {
        symbol: "NAND Flash Cell (SLC/TLC/QLC)",
        plainName: "Electron-Trap Storage Bit",
        whatItMeans:
          "Stores 1 to 4 bits per transistor by trapping precise voltage levels of charge that remain even without power.",
      },
      {
        symbol: "FTL (Flash Translation Layer)",
        plainName: "SSD's Hidden Manager",
        whatItMeans:
          "Firmware inside the SSD that maps OS block numbers to physical flash pages, handling wear leveling, bad blocks, and TRIM.",
      },
      {
        symbol: "NVMe over PCIe",
        plainName: "High-Speed Direct Storage Lane",
        whatItMeans:
          "Modern SSD protocol supporting up to 64,000 parallel I/O queues directly over PCIe lanes instead of one slow SATA queue.",
      },
    ],
  },
  "pipelining-hazards-branch-prediction": {
    bigPicture:
      "Imagine doing laundry: instead of waiting for Load 1 to finish washing, drying, and folding before starting Load 2, you start washing Load 2 as soon as Load 1 moves to the dryer. CPU Pipelining does the exact same assembly-line trick across Fetch, Decode, Execute, Memory, and Writeback—completing ~1 instruction per clock cycle! The two snags are Data Hazards (instruction 2 needs a result instruction 1 hasn't written yet—solved by 'forwarding') and Branches (`if` statements—solved by guessing which way the branch goes with a Branch Predictor).",
    howItInteracts:
      "Branch mispredictions flush ~15–20 cycles of work on modern CPUs—which is why sorted data can run 3× faster than unsorted data in branchy loops, and why speculative guessing opened the door to Spectre side-channel attacks (Lesson 44).",
    symbolDecoder: [
      {
        symbol: "5-Stage Pipeline (IF/ID/EX/MEM/WB)",
        plainName: "CPU Assembly Line",
        whatItMeans:
          "Splits instruction execution into 5 concurrent stations so 5 instructions are in flight at once.",
      },
      {
        symbol: "Data Forwarding (Bypassing)",
        plainName: "Express Shortcut Wire",
        whatItMeans:
          "Sends an ALU result directly into the next instruction's ALU input without waiting two cycles for it to be written to the register file.",
      },
      {
        symbol: "Branch Predictor",
        plainName: "Pattern-Learning Guesser",
        whatItMeans:
          "Hardware history table that predicts whether an `if`/loop branch will be taken so the pipeline stays full without stalling.",
      },
    ],
  },
  "out-of-order-superscalar-simd": {
    bigPicture:
      "A single assembly line stalls whenever one instruction waits on slow RAM. Modern CPUs act like a smart kitchen with multiple chefs ('Superscalar') who look ahead at the next 300+ orders and cook independent dishes out of order while waiting for slow ingredients—then serve the finished plates in the exact original program order ('Reorder Buffer') so your program never notices! Add SIMD ('Single Instruction, Multiple Data') and one instruction crunches 8 or 16 numbers simultaneously.",
    howItInteracts:
      "Out-of-order execution hides DRAM latency on CPUs, whereas GPUs drop all that complex reordering hardware to pack thousands of simpler SIMD-like lanes on one chip (Lesson 48). SIMD vectorization also powers fast video codecs, physics, and CPU ML inference.",
    symbolDecoder: [
      {
        symbol: "Superscalar",
        plainName: "Multi-Lane Parallel Issue",
        whatItMeans:
          "Fetching, decoding, and executing 4–8 instructions in parallel every single clock cycle.",
      },
      {
        symbol: "Out-of-Order (OoO) + ROB",
        plainName: "Smart Scheduling, In-Order Commit",
        whatItMeans:
          "Executes ready instructions early whenever operands arrive, while the Reorder Buffer (ROB) commits results strictly in program order.",
      },
      {
        symbol: "SIMD (AVX / NEON)",
        plainName: "Wide Vector Math",
        whatItMeans:
          "One instruction performs the exact same math (e.g., 8 float additions) across a wide 256-bit or 512-bit vector register in parallel.",
      },
    ],
  },
};
