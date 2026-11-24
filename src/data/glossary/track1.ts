import type { GlossaryTerm } from "@/types/curriculum";

export const TRACK_1_GLOSSARY: GlossaryTerm[] = [
  {
    id: "elementary-charge",
    term: "Elementary Charge (e)",
    domainId: "physics-electricity",
    shortDefinition:
      "The fundamental quantum of electric charge carried by a single proton (+e) or electron (-e), equal to 1.602176634 × 10^-19 coulombs.",
    detailedExplanation:
      "In the SI system, the elementary charge e is an exact defining constant. Free electrons in metals and semiconductors carry -e, while holes (vacant valence states) behave as effective +e charge carriers. Every digital logic transition moves thousands to millions of elementary charges onto or off a node capacitance.",
    formulaLatex: "e = 1.602176634 \\times 10^{-19}\\text{ C}",
    relatedLessonSlugs: ["what-is-an-electron", "voltage-current-circuits"],
  },
  {
    id: "electric-field",
    term: "Electric Field (E)",
    domainId: "physics-electricity",
    shortDefinition:
      "A vector field surrounding electric charges that exerts force F = qE on any test charge q placed within it.",
    detailedExplanation:
      "Measured in volts per meter (V/m) or newtons per coulomb (N/C), the electric field is the negative spatial gradient of electric potential. Inside conductors and MOSFET channels, electric fields accelerate charge carriers against lattice scattering to establish drift current, while electromagnetic waves propagate field changes near the speed of light in the dielectric.",
    formulaLatex: "\\mathbf{E} = -\\nabla V, \\quad \\mathbf{F} = q\\mathbf{E}",
    relatedLessonSlugs: [
      "what-is-an-electron",
      "voltage-current-circuits",
      "silicon-doping-pn-junction",
    ],
  },
  {
    id: "voltage",
    term: "Voltage (Electric Potential Difference)",
    domainId: "physics-electricity",
    shortDefinition:
      "The work required per unit charge to move a positive test charge between two points in an electric field, measured in volts (J/C).",
    detailedExplanation:
      "Voltage is always a relative difference between two nodes (often referenced to ground, 0 V). In digital circuits, voltage bands encode binary symbols—for example, 0 V for logic 0 and VDD (such as 0.8 V to 1.8 V) for logic 1—with forbidden intermediate zones to ensure noise immunity.",
    formulaLatex: "V_{AB} = \\frac{W_{AB}}{q} = -\\int_A^B \\mathbf{E} \\cdot d\\mathbf{l}",
    relatedLessonSlugs: [
      "voltage-current-circuits",
      "electromagnetism-rc-timing",
      "mosfets-and-cmos-logic",
    ],
  },
  {
    id: "electric-current",
    term: "Electric Current (I)",
    domainId: "physics-electricity",
    shortDefinition:
      "The net rate of electric charge flowing past a cross-sectional surface per unit time, measured in amperes (C/s).",
    detailedExplanation:
      "Conventional current points in the direction positive charge would flow; in metallic wires, electrons drift in the opposite direction at millimeters per second while the electromagnetic signal propagates at a significant fraction of c. By Kirchhoff's Current Law (KCL), total current entering any circuit node equals total current leaving it.",
    formulaLatex: "I = \\frac{dQ}{dt} = n q A v_d",
    relatedLessonSlugs: [
      "what-is-an-electron",
      "voltage-current-circuits",
      "silicon-doping-pn-junction",
    ],
  },
  {
    id: "ohms-law",
    term: "Ohm's Law & Electrical Resistance",
    domainId: "physics-electricity",
    shortDefinition:
      "The linear proportionality V = IR between voltage drop and current in an ohmic conductor, where resistance R opposes carrier flow.",
    detailedExplanation:
      "Resistance depends on material resistivity, wire length, and cross-sectional area (R = rho * L / A). On modern microchips, nanometer-wide copper or cobalt interconnects have substantial resistance that converts electrical energy into Joule heat (P = I^2 R) and slows signal edges.",
    formulaLatex: "V = I R, \\quad P = V I = I^2 R = \\frac{V^2}{R}",
    relatedLessonSlugs: ["voltage-current-circuits", "electromagnetism-rc-timing"],
  },
  {
    id: "capacitance",
    term: "Capacitance (C)",
    domainId: "physics-electricity",
    shortDefinition:
      "The ability of two conductors separated by an insulator to store electric charge per unit voltage, measured in farads (C/V).",
    detailedExplanation:
      "Every transistor gate oxide, DRAM storage cell, and metal interconnect trace forms a capacitor with adjacent conductors and the silicon substrate. Charging and discharging these parasitic capacitances accounts for nearly all dynamic power dissipation in CMOS processors.",
    formulaLatex: "C = \\frac{Q}{V}, \\quad E_{\\text{cap}} = \\frac{1}{2} C V^2",
    relatedLessonSlugs: [
      "electromagnetism-rc-timing",
      "mosfets-and-cmos-logic",
    ],
  },
  {
    id: "rc-time-constant",
    term: "RC Time Constant (tau)",
    domainId: "physics-electricity",
    shortDefinition:
      "The characteristic time tau = R * C required for a first-order RC circuit to charge or discharge through 63.2% of a step change.",
    detailedExplanation:
      "Because voltage across a capacitor cannot change instantaneously, driving a capacitive interconnect through driver and wire resistance produces an exponential transition. The 10%-to-90% rise time is approximately 2.2 * tau, directly bounding maximum clock frequency.",
    formulaLatex: "\\tau = R C, \\quad V(t) = V_{DD}\\left(1 - e^{-t/\\tau}\\right)",
    relatedLessonSlugs: [
      "electromagnetism-rc-timing",
      "sequential-logic-flip-flops",
    ],
  },
  {
    id: "band-gap",
    term: "Energy Band Gap (Eg)",
    domainId: "semiconductors",
    shortDefinition:
      "The forbidden energy range between the valence band and conduction band in a solid; ~1.12 eV in crystalline silicon at 300 K.",
    detailedExplanation:
      "Conductors have overlapping bands, insulators have wide gaps (>4 eV), and semiconductors have a moderate gap that thermal energy, photons, or electric fields can bridge. Silicon's 1.12 eV band gap keeps intrinsic leakage low at room temperature while allowing controlled conduction via doping.",
    formulaLatex: "E_g = E_c - E_v \\approx 1.12\\text{ eV (Si at 300 K)}",
    relatedLessonSlugs: ["silicon-doping-pn-junction"],
  },
  {
    id: "doping",
    term: "Semiconductor Doping",
    domainId: "semiconductors",
    shortDefinition:
      "Deliberate introduction of trace impurity atoms into pure silicon to create excess electrons (n-type) or electron holes (p-type).",
    detailedExplanation:
      "Adding Group V donors such as phosphorus or arsenic (5 valence electrons) yields n-type silicon where electrons are majority carriers. Adding Group III acceptors such as boron (3 valence electrons) yields p-type silicon where mobile holes are majority carriers, shifting conductivity by many orders of magnitude.",
    formulaLatex: "n \\cdot p = n_i^2 \\approx (1.0 \\times 10^{10}\\text{ cm}^{-3})^2",
    relatedLessonSlugs: [
      "silicon-doping-pn-junction",
      "mosfets-and-cmos-logic",
      "semiconductor-fabrication",
    ],
  },
  {
    id: "depletion-region",
    term: "Depletion Region",
    domainId: "semiconductors",
    shortDefinition:
      "An insulating zone near a PN junction swept free of mobile carriers by diffusion and recombination, leaving fixed ionized dopants.",
    detailedExplanation:
      "The exposed donor and acceptor ions create a built-in electric field that halts further carrier diffusion at equilibrium (~0.7 V barrier in silicon). Forward bias narrows the depletion region to allow exponential current flow, whereas reverse bias widens it and blocks conduction.",
    formulaLatex: "V_{bi} = \\frac{k_B T}{q} \\ln\\left(\\frac{N_A N_D}{n_i^2}\\right)",
    relatedLessonSlugs: ["silicon-doping-pn-junction", "mosfets-and-cmos-logic"],
  },
  {
    id: "mosfet",
    term: "MOSFET",
    domainId: "semiconductors",
    shortDefinition:
      "Metal-Oxide-Semiconductor Field-Effect Transistor: a four-terminal voltage-controlled switch modulated by an insulated gate.",
    detailedExplanation:
      "Applying voltage to the gate electrode creates an electric field across a nanometer-thin dielectric (SiO2 or high-k HfO2) that attracts minority carriers to form a conductive inversion channel between source and drain. Because the gate is insulated, steady-state gate DC current is ideally zero.",
    formulaLatex:
      "I_{D,\\text{sat}} \\approx \\frac{1}{2} \\mu C_{ox} \\frac{W}{L} (V_{GS} - V_{th})^2",
    relatedLessonSlugs: [
      "mosfets-and-cmos-logic",
      "semiconductor-fabrication",
      "boolean-algebra-logic",
    ],
  },
  {
    id: "threshold-voltage",
    term: "Threshold Voltage (Vth)",
    domainId: "semiconductors",
    shortDefinition:
      "The minimum gate-to-source voltage required to form a strong inversion channel between source and drain in a MOSFET.",
    detailedExplanation:
      "When |VGS| < |Vth|, the transistor is in cutoff (passing only tiny subthreshold leakage current). Lowering Vth enables faster switching at lower supply voltages VDD, but subthreshold leakage increases exponentially—a central trade-off in modern low-power chip design.",
    formulaLatex: "I_{\\text{sub}} \\propto \\exp\\left(\\frac{V_{GS} - V_{th}}{n V_T}\\right)",
    relatedLessonSlugs: ["mosfets-and-cmos-logic", "semiconductor-fabrication"],
  },
  {
    id: "cmos",
    term: "CMOS (Complementary MOS)",
    domainId: "semiconductors",
    shortDefinition:
      "A digital logic family pairing p-type pull-up networks (PMOS to VDD) with n-type pull-down networks (NMOS to GND).",
    detailedExplanation:
      "In every static CMOS gate, the pull-up and pull-down networks are logical duals: for any steady input combination, one network conducts while the other is off, eliminating static DC current paths between VDD and GND except for leakage. Power is consumed primarily during switching transitions.",
    formulaLatex: "P_{\\text{dyn}} = \\alpha C_L V_{DD}^2 f_{\\text{clk}}",
    relatedLessonSlugs: [
      "mosfets-and-cmos-logic",
      "boolean-algebra-logic",
      "electromagnetism-rc-timing",
    ],
  },
  {
    id: "photolithography",
    term: "Photolithography & EUV",
    domainId: "semiconductors",
    shortDefinition:
      "An optical patterning process that projects ultraviolet light through a photomask onto light-sensitive photoresist on a silicon wafer.",
    detailedExplanation:
      "By Rayleigh's criterion, minimum printable feature size scales with wavelength divided by numerical aperture (CD = k1 * lambda / NA). Leading-edge fabs use 13.5 nm Extreme Ultraviolet (EUV) light in vacuum with multi-layer Bragg mirrors to pattern features below 15 nm.",
    formulaLatex: "\\text{CD} = k_1 \\frac{\\lambda}{\\text{NA}}",
    relatedLessonSlugs: ["semiconductor-fabrication"],
  },
  {
    id: "die-yield",
    term: "Die Yield",
    domainId: "semiconductors",
    shortDefinition:
      "The fraction of manufactured integrated circuit dies on a silicon wafer that pass functional and parametric testing.",
    detailedExplanation:
      "Random particulate defects kill chips with probability increasing exponentially with die area and defect density. Models such as Murphy's and Poisson yield laws explain why giant monolithic dies are vastly more expensive per square millimeter than smaller chiplets.",
    formulaLatex: "Y \\approx e^{-D_0 A}",
    relatedLessonSlugs: ["semiconductor-fabrication"],
  },
  {
    id: "boolean-algebra",
    term: "Boolean Algebra",
    domainId: "math-foundations",
    shortDefinition:
      "The algebraic system over two truth values {0, 1} equipped with NOT, AND, and OR operations, formalized by George Boole and Claude Shannon.",
    detailedExplanation:
      "Boolean axioms (commutativity, associativity, distributivity, identity, complement) allow engineers to transform and minimize logic expressions before synthesizing physical CMOS gates. Any Boolean function can be represented canonically as a sum of minterms or built solely from universal NAND or NOR gates.",
    formulaLatex: "A \\cdot (B + C) = A\\cdot B + A\\cdot C, \\quad A + \\overline{A} = 1",
    relatedLessonSlugs: [
      "boolean-algebra-logic",
      "combinational-circuits-adders",
    ],
  },
  {
    id: "de-morgans-laws",
    term: "De Morgan's Laws",
    domainId: "math-foundations",
    shortDefinition:
      "Dual identities relating negation, conjunction, and disjunction: NOT(A AND B) = (NOT A) OR (NOT B), and NOT(A OR B) = (NOT A) AND (NOT B).",
    detailedExplanation:
      "In CMOS digital design, De Morgan's Laws explain why inverting gates (NAND, NOR) are naturally faster and smaller than non-inverting AND/OR gates, and allow bubble-pushing transformations across multi-level logic schematics without changing behavior.",
    formulaLatex:
      "\\overline{A \\cdot B} = \\overline{A} + \\overline{B}, \\quad \\overline{A + B} = \\overline{A} \\cdot \\overline{B}",
    relatedLessonSlugs: ["boolean-algebra-logic", "mosfets-and-cmos-logic"],
  },
  {
    id: "combinational-logic",
    term: "Combinational Logic",
    domainId: "digital-electronics",
    shortDefinition:
      "Stateless digital circuits whose outputs depend purely on the current input values after propagation delay settles.",
    detailedExplanation:
      "Multiplexers, decoders, comparators, and binary adders are combinational blocks built from acyclic networks of logic gates. Their speed is governed by the critical path—the longest chain of gate and interconnect delays from any input to any output.",
    relatedLessonSlugs: [
      "combinational-circuits-adders",
      "boolean-algebra-logic",
      "sequential-logic-flip-flops",
    ],
  },
  {
    id: "full-adder",
    term: "Full Adder",
    domainId: "digital-electronics",
    shortDefinition:
      "A 3-input, 2-output combinational circuit that sums two operand bits A, B and a carry-in Cin to produce Sum and Carry-out Cout.",
    detailedExplanation:
      "Chaining N full adders produces an N-bit ripple-carry adder, whose worst-case latency grows linearly O(N) with bit width. High-speed CPUs replace simple ripple chains with carry-lookahead or parallel-prefix adders (such as Kogge-Stone) to reduce delay to O(log N).",
    formulaLatex:
      "S = A \\oplus B \\oplus C_{\\text{in}}, \\quad C_{\\text{out}} = (A \\cdot B) + (C_{\\text{in}} \\cdot (A \\oplus B))",
    relatedLessonSlugs: [
      "combinational-circuits-adders",
      "binary-hex-signed-integers",
    ],
  },
  {
    id: "d-flip-flop",
    term: "D Flip-Flop",
    domainId: "digital-electronics",
    shortDefinition:
      "An edge-triggered sequential storage element that captures input D on an active clock edge and holds Q constant for the rest of the cycle.",
    detailedExplanation:
      "Constructed from two cascaded D latches driven by complementary clock phases (leader-follower / master-slave), a D flip-flop breaks combinational feedback loops and synchronizes state updates across an entire processor datapath.",
    formulaLatex: "Q_{\\text{next}} = D \\text{ at } \\uparrow\\text{CLK}",
    relatedLessonSlugs: ["sequential-logic-flip-flops"],
  },
  {
    id: "setup-hold-time",
    term: "Setup and Hold Time (tsu, th)",
    domainId: "digital-electronics",
    shortDefinition:
      "The timing window around a clock edge during which a flip-flop's D input must remain stable: tsu before the edge and th after it.",
    detailedExplanation:
      "Violating setup or hold constraints can trap the flip-flop's cross-coupled inverters in metastability—an indeterminate intermediate voltage that takes unbounded time to resolve. Maximum clock frequency is bounded by Tclk >= t_clk_q + t_comb_max + t_su - t_skew.",
    formulaLatex: "T_{\\text{clk}} \\ge t_{c\\text{-}q} + t_{\\text{comb,max}} + t_{su}",
    relatedLessonSlugs: [
      "sequential-logic-flip-flops",
      "electromagnetism-rc-timing",
    ],
  },
  {
    id: "twos-complement",
    term: "Two's Complement",
    domainId: "information-representation",
    shortDefinition:
      "The universal N-bit signed integer encoding where the most significant bit carries negative weight -2^(N-1).",
    detailedExplanation:
      "An N-bit two's complement integer spans [-2^(N-1), 2^(N-1) - 1], has a single representation of zero, and allows addition and subtraction to use the exact same binary adder hardware as unsigned integers. Negating any value equals bitwise inversion plus 1 (~x + 1).",
    formulaLatex:
      "\\text{Value}(b_{N-1}\\dots b_0) = -b_{N-1}2^{N-1} + \\sum_{i=0}^{N-2} b_i 2^i",
    relatedLessonSlugs: [
      "binary-hex-signed-integers",
      "combinational-circuits-adders",
    ],
  },
  {
    id: "arithmetic-overflow",
    term: "Arithmetic Overflow vs. Carry",
    domainId: "information-representation",
    shortDefinition:
      "Signed overflow occurs when a signed operation's true result falls outside [-2^(N-1), 2^(N-1)-1]; unsigned carry indicates exceeding 2^N - 1.",
    detailedExplanation:
      "For addition, unsigned wraparound sets the Carry-out flag (C), whereas signed overflow sets the Overflow flag (V) when two same-signed numbers produce a result of the opposite sign (equivalently V = Cin_MSB XOR Cout_MSB).",
    formulaLatex: "V = C_{N-1} \\oplus C_N",
    relatedLessonSlugs: ["binary-hex-signed-integers"],
  },
  {
    id: "ieee-754",
    term: "IEEE-754 Floating-Point",
    domainId: "information-representation",
    shortDefinition:
      "The standard binary representation of real numbers using Sign (S), biased Exponent (E), and normalized Mantissa/Fraction (F) fields.",
    detailedExplanation:
      "Single precision (binary32) allocates 1 sign bit, 8 exponent bits (bias 127), and 23 explicit fraction bits (with an implicit leading 1 for normals). Reserved exponent patterns encode signed zeros, subnormal numbers for gradual underflow, +/-Infinity, and NaN.",
    formulaLatex: "x = (-1)^S \\times (1 + F) \\times 2^{E - \\text{bias}}",
    relatedLessonSlugs: ["ieee-754-floating-point"],
  },
  {
    id: "machine-epsilon",
    term: "Machine Epsilon",
    domainId: "information-representation",
    shortDefinition:
      "The gap between 1.0 and the next representable floating-point number: 2^-23 (~1.19e-7) for binary32 and 2^-52 (~2.22e-16) for binary64.",
    detailedExplanation:
      "Floating-point spacing scales proportionally with magnitude: between 2^k and 2^(k+1), adjacent floats are separated by 2^(k - p + 1). Consequently, adding a tiny number to a huge number can lose the tiny number completely (absorption), and 0.1 + 0.2 != 0.3 in binary.",
    formulaLatex: "\\varepsilon_{\\text{mach}} = 2^{-(p-1)}",
    relatedLessonSlugs: ["ieee-754-floating-point"],
  },
  {
    id: "utf-8",
    term: "UTF-8 Encoding",
    domainId: "information-representation",
    shortDefinition:
      "A backwards-compatible, variable-length (1 to 4 bytes) byte encoding capable of representing all 1,112,064 valid Unicode code points.",
    detailedExplanation:
      "ASCII code points (U+0000..U+007F) encode identically as 1 byte (0xxxxxxx). Multi-byte sequences use self-synchronizing leading bit prefixes (110xxxxx, 1110xxxx, 11110xxx) followed by continuation bytes (10xxxxxx), preventing mid-stream corruption and preserving byte-order independence.",
    relatedLessonSlugs: ["encoding-compression-ecc"],
  },
  {
    id: "shannon-entropy",
    term: "Shannon Entropy (H)",
    domainId: "information-representation",
    shortDefinition:
      "The fundamental lower bound on average bits per symbol needed for lossless compression of a discrete random source.",
    detailedExplanation:
      "Introduced by Claude Shannon in 1948, entropy measures average surprise: rare symbols carry -log2(p) bits of information while frequent symbols carry less. Prefix-free codes such as Huffman coding approach H(X) bits/symbol, and arithmetic/ANS coding can match H(X) even closer.",
    formulaLatex: "H(X) = -\\sum_{i} p(x_i) \\log_2 p(x_i)",
    relatedLessonSlugs: ["encoding-compression-ecc"],
  },
  {
    id: "hamming-distance",
    term: "Hamming Distance & ECC",
    domainId: "information-representation",
    shortDefinition:
      "The number of bit positions at which two equal-length binary codewords differ; determines error detection and correction capability.",
    detailedExplanation:
      "A code with minimum Hamming distance d_min between valid codewords can detect up to d_min - 1 bit flips and correct up to floor((d_min - 1) / 2) bit flips. Classic SECDED ECC memory uses d_min = 4 (extended Hamming code) to correct 1-bit errors and detect 2-bit errors.",
    formulaLatex:
      "d_{\\min} \\ge 2t + 1 \\implies \\text{corrects } t \\text{ errors}",
    relatedLessonSlugs: ["encoding-compression-ecc"],
  },
];
