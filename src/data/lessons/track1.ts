import type { Lesson } from "@/types/curriculum";

export const TRACK_1_LESSONS: Lesson[] = [
  // =========================================================================
  // LESSON 1: what-is-an-electron
  // =========================================================================
  {
    id: "what-is-an-electron",
    slug: "what-is-an-electron",
    number: 1,
    title: "Charge, Fields & What an Electron Actually Is",
    subtitle:
      "From quantum orbitals and Coulomb forces to drift velocity vs. near-light-speed electric signals",
    trackId: "track-1",
    domainId: "physics-electricity",
    moduleTitle: "Module 1: Physical Foundations of Electricity",
    chapterTitle: "Chapter 1: Matter, Charge & Signals",
    estimatedMinutes: 30,
    difficulty: "beginner",
    status: "complete",
    prerequisites: [],
    simulatorId: "pn-diode-charge",
    simulatorPrompt:
      "In the PN Junction, Carrier Drift & Diode Lab, switch to Charge & Electron Drift mode, vary total charge Q, transit time t, and carrier polarity, and compare slow electron drift velocity against conventional current direction.",
    objectives: [
      "Distinguish quantized electric charge from continuous fluid analogies and compute net charge in coulombs.",
      "Explain how Coulomb's law and electric fields transmit forces across space without physical contact.",
      "Contrast electron drift velocity (~mm/s) with electromagnetic signal propagation speed (~0.5c–0.9c) in wires.",
      "Connect atomic valence band structure in copper vs. silicon to why computers use both conductors and semiconductors.",
    ],
    depthExplanations: {
      beginner:
        "Everything inside a computer—every bit stored in RAM, every pixel on a screen, every addition inside a CPU—is physically represented by electric charge and electric fields. Electrons are tiny negatively charged particles surrounding atomic nuclei. In insulating materials like glass or silicon dioxide, electrons stay tightly bound to their atoms. In metals like copper, the outermost electrons detach from individual atoms and form a shared 'sea' of mobile charge.\n\nWhen you flip a switch or a transistor opens a path, electrons do not race from the power supply to your CPU like water shooting out of an empty hose. Instead, the wire is already packed wall-to-wall with mobile electrons. Pushing electrons at one end creates a ripple in the electric field that travels down the wire at roughly two-thirds the speed of light, nudging electrons everywhere along the wire almost immediately.",
      intermediate:
        "Electric charge is quantized in integer multiples of the elementary charge $e = 1.602 \\times 10^{-19}\\text{ C}$. Because $1\\text{ C}$ equals roughly $6.24 \\times 10^{18}$ elementary charges, macroscopic currents look continuous, yet nanoscale 3 nm transistors switch with only a few hundred to a few thousand electrons on their gate capacitance. Surrounding every charge is an electric field $\\mathbf{E}$ that stores energy and exerts $\\mathbf{F} = q\\mathbf{E}$ on nearby charges.\n\nIn a copper interconnect carrying $1\\text{ mA}$ of current, individual conduction electrons bounce off thermal lattice vibrations roughly every $10^{-14}\\text{ s}$ (scattering time $\\tau_s$). Their thermal speed is $\\sim 10^6\\text{ m/s}$ in random directions, while their net drift velocity along the wire is less than $1\\text{ mm/s}$. Signal propagation is governed instead by the electromagnetic wave velocity $v = c / \\sqrt{\\varepsilon_r}$ in the surrounding dielectric.",
      advanced:
        "At the quantum level, an electron in a crystalline solid is not a miniature billiard ball orbiting a nucleus; it is a spin-$1/2$ fermion described by a Bloch wavefunction delocalized across the periodic lattice potential. The Pauli exclusion principle forces electrons to occupy discrete energy bands. In metals, the Fermi level $E_F$ lies inside a partially filled conduction band, yielding a free-carrier density $n \\approx 8.5 \\times 10^{28}\\text{ m}^{-3}$ in copper.\n\nUnder a weak electric field $\\mathbf{E}$, the Drude-Sommerfeld model relates steady-state drift velocity to mobility $\\mu = e\\tau_s / m^*$ via $\\mathbf{v}_d = -\\mu\\mathbf{E}$, giving current density $\\mathbf{J} = \\sigma\\mathbf{E}$ with conductivity $\\sigma = n e \\mu$. Meanwhile, the energy and information in a circuit propagate not inside the metal core via electron kinetic energy, but via the Poynting vector $\\mathbf{S} = \\frac{1}{\\mu_0}(\\mathbf{E} \\times \\mathbf{B})$ guided through the surrounding dielectric.",
    },
    intuition:
      "Imagine a steel pipe completely filled end-to-end with marbles. If you push one marble into the left end, a marble pops out the right end almost instantly—even though each individual marble barely moved an inch. Electrons in a copper wire behave like those marbles, and the electric field is the compression wave racing down the pipe.",
    technicalTheory:
      "Electric charge $Q$ is conserved and quantized: $Q = N(\\pm e)$, where $e = 1.602176634 \\times 10^{-19}\\text{ C}$. Two point charges $q_1, q_2$ separated by distance $r$ in a medium of relative permittivity $\\varepsilon_r$ interact via Coulomb's Law:\n\n$$\\mathbf{F} = \\frac{1}{4\\pi\\varepsilon_0\\varepsilon_r}\\frac{q_1 q_2}{r^2}\\hat{\\mathbf{r}}$$\n\nDividing out the test charge $q_2$ defines the electric field $\\mathbf{E} = \\mathbf{F}/q_2$ (in $\\text{V/m}$). Inside a conductor of cross-sectional area $A$ and carrier density $n$, an applied field drives carriers at average drift velocity $v_d = \\mu E$, yielding macroscopic current:\n\n$$I = \\frac{dQ}{dt} = n e A v_d$$\n\nBy contrast, a voltage step travels as a transverse electromagnetic (TEM) wave at phase velocity $v_p = \\frac{c}{\\sqrt{\\varepsilon_r}}$ (roughly $1.5 \\times 10^8\\text{ m/s}$ in FR-4 PCB fiberglass where $\\varepsilon_r \\approx 4$).",
    mechanisms: [
      {
        step: 1,
        title: "Atomic Valence & Delocalization",
        detail:
          "Copper's outer 4s electron detaches into a shared conduction band across the crystal lattice, leaving positively charged Cu+ ions fixed in place.",
        stateNote: "Zero net current: thermal velocities (~10^6 m/s) cancel in all directions.",
      },
      {
        step: 2,
        title: "Electric Field Establishment",
        detail:
          "Connecting a battery or transistor driver establishes an electric field gradient along the conductor at ~0.5c–0.9c through the surrounding insulator.",
        stateNote: "Field reaches the load nanoseconds before individual electrons arrive.",
      },
      {
        step: 3,
        title: "Drift & Lattice Scattering",
        detail:
          "Conduction electrons accelerate opposite to E, collide with lattice phonons every ~25 fs, and settle into a slow steady drift velocity v_d.",
        stateNote: "Kinetic energy lost in collisions heats the lattice (Joule heating).",
      },
      {
        step: 4,
        title: "Charge Accumulation on Nodes",
        detail:
          "Current arriving at an open transistor gate deposits or removes discrete electrons, shifting the local electric potential representing a logic 0 or 1.",
        stateNote: "A 1 fF node at 1 V stores Q = CV = 1 fC ≈ 6,240 electrons.",
      },
    ],
    mathNotes: [
      {
        title: "Coulomb Force & Electric Field",
        latex: "E = \\frac{F}{q} = \\frac{1}{4\\pi\\varepsilon_0\\varepsilon_r}\\frac{|Q|}{r^2}",
        explanation:
          "Field strength decays with the square of distance and weakens in higher-permittivity dielectrics such as silicon dioxide (eps_r = 3.9) or hafnium dioxide (eps_r ≈ 25).",
      },
      {
        title: "Microscopic Current & Drift Velocity",
        latex: "v_d = \\frac{I}{n e A}",
        explanation:
          "Because copper's free-electron density n is enormous (~8.5e28 m^-3), even high current densities require tiny drift speeds.",
      },
      {
        title: "Wave Propagation Speed in Dielectric",
        latex: "v_p = \\frac{c}{\\sqrt{\\varepsilon_r}}",
        explanation:
          "Determines interconnect time-of-flight: roughly 6.7 ps per millimeter in standard PCB fiberglass (eps_r ≈ 4).",
      },
    ],
    diagram: {
      title: "Drift Velocity vs. Electromagnetic Signal Propagation",
      caption:
        "A voltage change propagates through the field at ~0.5c while individual electrons drift slowly and scatter off lattice ions.",
      nodes: [
        {
          id: "source",
          label: "Driver / Battery",
          sublabel: "Applies potential V",
          x: 80,
          y: 140,
          tone: "accent",
        },
        {
          id: "field",
          label: "E-Field Wave",
          sublabel: "v_p ≈ 1.5e8 m/s",
          x: 270,
          y: 70,
          tone: "emerald",
        },
        {
          id: "drift",
          label: "Electron Drift",
          sublabel: "v_d ≈ 0.1 mm/s",
          x: 270,
          y: 210,
          tone: "amber",
        },
        {
          id: "lattice",
          label: "Lattice Scattering",
          sublabel: "Phonon heat loss",
          x: 455,
          y: 210,
          tone: "neutral",
        },
        {
          id: "load",
          label: "Receiver Gate",
          sublabel: "~6,240 e- / 1 fC",
          x: 585,
          y: 140,
          tone: "accent",
        },
      ],
      edges: [
        { from: "source", to: "field", label: "EM wave" },
        { from: "field", to: "load", label: "ps/mm" },
        { from: "source", to: "drift", label: "F = -eE" },
        { from: "drift", to: "lattice", label: "collisions" },
        { from: "lattice", to: "load", label: "net I" },
      ],
    },
    codeExamples: [
      {
        title: "Drift Velocity vs. Signal Time-of-Flight in Copper",
        language: "python",
        code: `e = 1.602176634e-19       # C
n_cu = 8.49e28            # free electrons / m^3 in copper
c = 2.99792458e8          # m/s
eps_r = 4.0               # FR-4 PCB dielectric

I = 0.010                 # 10 mA signal current
width = 100e-6            # 100 um trace width
thickness = 35e-6         # 35 um (1 oz copper)
area = width * thickness
length = 0.10             # 10 cm PCB trace

v_drift = I / (n_cu * e * area)
v_signal = c / (eps_r ** 0.5)

print(f"Drift velocity:   {v_drift * 1e3:.4f} mm/s")
print(f"Signal velocity:  {v_signal / 1e8:.3f} x 10^8 m/s")
print(f"Signal transit:   {(length / v_signal) * 1e12:.1f} ps")
print(f"Electron transit: {length / v_drift:.1f} s")`,
        explanation:
          "Computes both the microscopic electron drift velocity and the electromagnetic propagation delay across a 10 cm PCB trace.",
        output: `Drift velocity:   0.2100 mm/s
Signal velocity:  1.499 x 10^8 m/s
Signal transit:   667.1 ps
Electron transit: 476.1 s`,
      },
    ],
    connections: [
      {
        lessonSlug: "voltage-current-circuits",
        relationship: "Turns electric fields and charge flow into lumped circuit laws (V = IR).",
      },
      {
        lessonSlug: "silicon-doping-pn-junction",
        relationship: "Applies valence electron bonding to pure and doped silicon crystals.",
      },
    ],
    realWorldApplications: [
      {
        title: "High-Speed SerDes PCB Trace Matching",
        simplifiedVsReal:
          "Beginner schematics treat wires as instantaneous equipotentials; at GHz PCIe/DDR speeds, every millimeter of trace adds ~6.7 ps of EM flight delay.",
        modernExample:
          "Motherboards snake differential pairs in serpentine patterns so all lanes of a DDR5 bus arrive within picoseconds of each other.",
      },
      {
        title: "Shot Noise in Nanoscale Logic",
        simplifiedVsReal:
          "Macroscopic circuits assume smooth continuous current; at 3 nm FinFET nodes, switching a gate moves only a few hundred electrons.",
        modernExample:
          "SRAM cell stability and CMOS image sensor pixels are physically bounded by discrete electron counting statistics (shot noise).",
      },
    ],
    misconceptions: [
      {
        myth: "Electrons travel through wires at the speed of light when you turn on a switch.",
        reality:
          "Individual electrons drift slower than a snail (fractions of a millimeter per second). The electromagnetic field wave travels near light speed.",
      },
      {
        myth: "Batteries and power supplies 'create' electrons and pump them into empty wires.",
        reality:
          "Conductors are already full of mobile electrons. A power supply acts as an electron pump that maintains a potential difference, circulating existing charge.",
      },
    ],
    deepDive: {
      title: "Why Conventional Current Points Opposite to Electron Flow",
      content:
        "Benjamin Franklin assigned 'positive' and 'negative' labels in the 1740s before J. J. Thomson discovered the electron in 1897. Because electrons carry $-e$, when electrons move left-to-right, positive charge effectively transfers right-to-left. In circuit analysis, keeping conventional current $I$ flowing from higher to lower potential preserves consistent signs for $P = VI$ and semiconductor diode arrows, while device physics tracks both negatively charged electrons and positively charged valence holes.",
    },
    revisionNotes: [
      "Elementary charge is quantized: e = 1.602e-19 C (~6.24e18 electrons per coulomb).",
      "Electric field E = F/q exerts force on charges and carries energy through dielectrics.",
      "Drift velocity v_d = I/(neA) is typically < 1 mm/s; EM wave velocity v_p = c/sqrt(eps_r) is ~1.5e8 m/s.",
      "Metals have overlapping valence/conduction bands; insulators have wide gaps; semiconductors sit in between.",
    ],
    glossaryTermIds: ["elementary-charge", "electric-field", "electric-current"],
    references: [
      {
        title: "The Feynman Lectures on Physics, Vol. II: Electromagnetism and Matter",
        author: "Richard P. Feynman",
        url: "https://www.feynmanlectures.caltech.edu/II_toc.html",
        type: "book",
        note: "Chapters 1–4 develop electrostatics, fields, and conductors from first principles.",
      },
      {
        title: "MIT OCW 6.002: Circuits and Electronics",
        author: "Anant Agarwal",
        url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
        type: "course",
        note: "Lumped circuit abstraction derived from Maxwell's equations.",
      },
    ],
    assessments: [
      {
        id: "t1-l1-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "When a CPU driver switches a 10 cm PCB copper trace from 0 V to 1.2 V, what reaches the far end in under 1 nanosecond?",
        options: [
          {
            id: "a",
            text: "The exact electrons ejected from the driver transistor",
            explanation:
              "Individual electrons drift at fractions of a millimeter per second and take minutes to travel 10 cm.",
          },
          {
            id: "b",
            text: "The electromagnetic field disturbance propagating through the dielectric",
            explanation:
              "Correct. The voltage step propagates as an EM wave at v = c / sqrt(eps_r), arriving in ~667 ps.",
          },
          {
            id: "c",
            text: "Copper nuclei vibrating down the lattice",
            explanation:
              "Atomic nuclei remain fixed in the crystal lattice; sound waves travel far slower (~km/s) than EM waves.",
          },
          {
            id: "d",
            text: "Protons flowing from ground to VDD",
            explanation:
              "Protons are locked inside atomic nuclei in solid conductors and do not flow.",
          },
        ],
        correctAnswer: "b",
        hints: [
          "Compare drift velocity (~0.2 mm/s) with wave phase velocity (~1.5e8 m/s).",
        ],
        explanation:
          "Signal propagation in circuits is an electromagnetic wave phenomenon traveling at c/sqrt(eps_r), whereas physical charge carriers drift slowly.",
        conceptTag: "signal-vs-drift",
      },
      {
        id: "t1-l1-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A tiny CMOS gate node has capacitance C = 2 fF (2e-15 F) charged to V = 0.8 V, storing Q = 1.6e-15 C. Approximately how many excess elementary charges (electrons) are on that node?",
        latex: "N = \\frac{Q}{e} = \\frac{1.6 \\times 10^{-15}\\text{ C}}{1.602 \\times 10^{-19}\\text{ C}}",
        correctAnswer: 9988,
        numericTolerance: 25,
        hints: [
          "Divide total charge Q by the elementary charge e = 1.602e-19 C.",
        ],
        explanation:
          "1.6e-15 / 1.602e-19 ≈ 9,988 electrons (~10,000 electrons). Modern nanoscale gates switch with remarkably few charge carriers.",
        conceptTag: "charge-quantization",
      },
      {
        id: "t1-l1-q3",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: Increasing the free-carrier density n of a wire while keeping current I and cross-sectional area A constant decreases the average electron drift velocity v_d.",
        correctAnswer: true,
        hints: ["Inspect the relation I = n * e * A * v_d."],
        explanation:
          "True. Since v_d = I / (n * e * A), having more mobile carriers per unit volume means each individual carrier needs to drift slower to transport the same charge per second.",
        conceptTag: "drift-velocity",
      },
      {
        id: "t1-l1-q4",
        type: "fill-blank",
        difficulty: "intermediate",
        prompt:
          "In a PCB dielectric with relative permittivity eps_r = 4, an electromagnetic wave travels at approximately _____ percent of the vacuum speed of light c (enter a number).",
        correctAnswer: "50",
        acceptableAnswers: ["50", "50%"],
        hints: ["Use v_p = c / sqrt(eps_r)."],
        explanation:
          "Because sqrt(4) = 2, the propagation velocity is c / 2, or 50% of the speed of light in vacuum.",
        conceptTag: "wave-propagation",
      },
    ],
  },

  // =========================================================================
  // LESSON 2: voltage-current-circuits
  // =========================================================================
  {
    id: "voltage-current-circuits",
    slug: "voltage-current-circuits",
    number: 2,
    title: "Voltage, Current, Resistance & Ohm's Law",
    subtitle:
      "Lumped circuit abstraction, Kirchhoff's laws, voltage dividers, and Joule heat dissipation",
    trackId: "track-1",
    domainId: "physics-electricity",
    moduleTitle: "Module 1: Physical Foundations of Electricity",
    chapterTitle: "Chapter 1: Matter, Charge & Signals",
    estimatedMinutes: 35,
    difficulty: "beginner",
    status: "complete",
    prerequisites: ["what-is-an-electron"],
    simulatorId: "ohm-circuit",
    simulatorPrompt:
      "In the Ohm's Law & RC Timing Lab, set V = 3.3 V and sweep R from 100 Ω to 10 kΩ. Observe how current I drops inversely while dissipated power P = V^2/R shrinks by 100x.",
    objectives: [
      "Define voltage as energy per unit charge (J/C) and current as charge flow rate (C/s).",
      "Apply Ohm's law (V = IR) and wire geometry (R = rho L / A) to compute circuit drops and interconnect resistance.",
      "Analyze series and parallel networks using Kirchhoff's Current Law (KCL) and Voltage Law (KVL).",
      "Calculate electrical power dissipation (P = VI = I^2 R) and explain thermal limits in processors.",
    ],
    depthExplanations: {
      beginner:
        "Solving Maxwell's field equations for every wire inside a computer would be impossible. Instead, engineers use the lumped circuit abstraction: wires become ideal connections, and physical behavior is collapsed into components like voltage sources and resistors. Voltage is electrical 'pressure' (energy per coulomb) measured between two points, current is the flow rate of charge in amperes, and resistance measures how strongly a material impedes that flow.\n\nOhm's law ($V = IR$) tells us that doubling voltage across a fixed resistor doubles the current, while doubling resistance cuts the current in half. Every time current flows through resistance, electrical energy converts directly into heat ($P = VI = I^2 R$), which is why CPUs require heat sinks and fans.",
      intermediate:
        "Kirchhoff's two conservation laws govern all lumped circuits. KCL states that algebraic current entering any node sums to zero (charge conservation), while KVL states that voltage drops around any closed loop sum to zero (energy conservation in conservative fields). Together with $V = IR$, they let us solve voltage dividers, current-limiting resistors, and pull-up/pull-down networks.\n\nNotice the quadratic penalty of power: $P = I^2 R = V^2 / R$. On a processor power delivery network (PDN), delivering $100\\text{ W}$ at $1.0\\text{ V}$ requires $100\\text{ A}$ of current! Even a $2\\text{ m}\\Omega$ motherboard trace drops $0.2\\text{ V}$ (IR drop) and wastes $I^2 R = 20\\text{ W}$ as pure heat.",
      advanced:
        "The lumped-element model holds only when circuit dimensions are much smaller than the minimum signal wavelength ($L \\ll \\lambda / 10$). At $5\\text{ GHz}$ on silicon ($\\varepsilon_{r,\\text{eff}} \\approx 4$), $\\lambda \\approx 3\\text{ cm}$, so global on-chip buses and PCB traces cross into distributed transmission-line territory.\n\nAt nanometer metal pitches (e.g., M0/M1 layers under 20 nm wide), copper resistivity $\\rho$ rises sharply above its bulk value ($1.68 \\times 10^{-8}\\,\\Omega\\cdot\\text{m}$) due to surface and grain-boundary scattering (Fuchs-Sondheimer and Mayadas-Shatzkes effects), causing wire resistance to scale worse than $1/A$ and driving the industry toward cobalt, ruthenium, and backside power delivery.",
    },
    intuition:
      "Think of voltage as the height difference of a waterfall, current as the gallons of water plunging over the edge per second, and resistance as rocks and narrowing in the riverbed. Power is the total mechanical energy slamming into the rocks every second—turning directly into heat.",
    technicalTheory:
      "For an ohmic conductor of length $L$, cross-sectional area $A$, and bulk resistivity $\\rho$, resistance is:\n\n$$R = \\rho\\frac{L}{A}, \\qquad V = I R$$\n\nFor resistors in series, the same current passes through each, so resistances add: $R_{\\text{eq}} = \\sum R_k$. For resistors in parallel, the same voltage appears across each, so conductances $G = 1/R$ add: $\\frac{1}{R_{\\text{eq}}} = \\sum \\frac{1}{R_k}$.\n\nA two-resistor voltage divider from $V_{\\text{in}}$ across $R_1$ (top) and $R_2$ (to ground) yields:\n\n$$V_{\\text{out}} = V_{\\text{in}}\\frac{R_2}{R_1 + R_2}$$\n\nInstantaneous power absorbed by any two-terminal element is $P = V I$, which for a resistor becomes $P = I^2 R = V^2 / R$.",
    mechanisms: [
      {
        step: 1,
        title: "Potential Source Establishes Loop Gradient",
        detail:
          "A regulated supply maintains a fixed potential difference V_DD between its positive rail and ground reference (0 V).",
        stateNote: "Voltage is always measured between two points; ground is an arbitrary 0 V reference.",
      },
      {
        step: 2,
        title: "KVL Partitions Voltage Drops",
        detail:
          "Around any closed path, the sum of voltage rises equals the sum of IR drops across wires, transistors, and loads.",
        stateNote: "Sum(V_loop) = 0.",
      },
      {
        step: 3,
        title: "KCL Splits Current Across Branches",
        detail:
          "At any junction, current divides inversely proportional to each branch's resistance, keeping net node charge constant.",
        stateNote: "Sum(I_in) = Sum(I_out).",
      },
      {
        step: 4,
        title: "Inelastic Scattering Dissipates Joule Heat",
        detail:
          "Electrons accelerated by the local E-field transfer energy V*dQ = I^2*R*dt into crystal lattice vibrations (heat).",
        stateNote: "Power scales quadratically with current (I^2*R) and supply voltage (V^2/R).",
      },
    ],
    mathNotes: [
      {
        title: "Ohm's Law & Resistivity",
        latex: "V = I R, \\qquad R = \\rho\\frac{L}{A}",
        explanation:
          "Doubling a wire's length doubles R; halving its cross-sectional area doubles R.",
      },
      {
        title: "Voltage Divider Equation",
        latex: "V_{\\text{out}} = V_{\\text{in}}\\frac{R_2}{R_1 + R_2}",
        explanation:
          "Valid only when the load drawing current from V_out has much higher resistance than R2.",
      },
      {
        title: "Joule Heating Power",
        latex: "P = V I = I^2 R = \\frac{V^2}{R}",
        explanation:
          "Explains why power distribution uses high voltage upstream and steps down right next to the CPU socket.",
      },
    ],
    diagram: {
      title: "Series Voltage Divider & Parasitic Wire Drop",
      caption:
        "Supply voltage V_DD splits across interconnect/pull-up resistance R1 and load resistance R2 according to KVL and Ohm's law.",
      nodes: [
        { id: "vdd", label: "Supply V_DD", sublabel: "3.3 V", x: 90, y: 80, tone: "accent" },
        { id: "r1", label: "Resistor R1", sublabel: "1.0 kΩ", x: 250, y: 80, tone: "amber" },
        { id: "vout", label: "Node V_out", sublabel: "2.2 V (KCL)", x: 420, y: 140, tone: "emerald" },
        { id: "r2", label: "Resistor R2", sublabel: "2.0 kΩ", x: 250, y: 210, tone: "amber" },
        { id: "gnd", label: "Ground (GND)", sublabel: "0.0 V ref", x: 90, y: 210, tone: "neutral" },
      ],
      edges: [
        { from: "vdd", to: "r1", label: "I = 1.1 mA" },
        { from: "r1", to: "vout", label: "-1.1 V" },
        { from: "vout", to: "r2", label: "I = 1.1 mA" },
        { from: "r2", to: "gnd", label: "-2.2 V" },
      ],
    },
    codeExamples: [
      {
        title: "Voltage Divider & CPU Power Delivery IR Drop Analyzer",
        language: "python",
        code: `def analyze_pdn(v_in: float, r_wire: float, i_cpu: float):
    v_drop = i_cpu * r_wire
    v_die = v_in - v_drop
    p_wire = (i_cpu ** 2) * r_wire
    p_die = v_die * i_cpu
    efficiency = (p_die / (p_die + p_wire)) * 100
    print(f"IR Drop: {v_drop*1e3:.1f} mV | Die V: {v_die:.3f} V")
    print(f"Wire Heat: {p_wire:.2f} W | Die Power: {p_die:.2f} W | Eff: {efficiency:.1f}%")

# 80 A CPU load across 1.5 mOhm package/board resistance at 1.0 V
analyze_pdn(v_in=1.0, r_wire=0.0015, i_cpu=80.0)`,
        explanation:
          "Models why modern CPUs use thick copper planes and multi-phase VRMs inches from the socket: at 80 A, even 1.5 milliohms wastes nearly 10 W.",
        output: `IR Drop: 120.0 mV | Die V: 0.880 V
Wire Heat: 9.60 W | Die Power: 70.40 W | Eff: 88.0%`,
      },
    ],
    connections: [
      {
        lessonSlug: "what-is-an-electron",
        relationship: "Grounds R = rho L / A and V = IR in lattice scattering and electric fields.",
      },
      {
        lessonSlug: "electromagnetism-rc-timing",
        relationship: "Adds time-dependent capacitance and inductance to resistive circuits.",
      },
      {
        lessonSlug: "silicon-doping-pn-junction",
        relationship: "Contrasts linear ohmic resistors with non-linear semiconductor diodes.",
      },
    ],
    realWorldApplications: [
      {
        title: "CPU Voltage Regulator Modules (VRMs) & IR Drop",
        simplifiedVsReal:
          "Textbook circuits assume 0 Ω wires; real CPU sockets draw >100 A at ~1 V, so milliohms of resistance cause severe voltage droop.",
        modernExample:
          "Modern server motherboards place 16+ VRM phases millimeters from the CPU and use backside power delivery (PowerVia/BSPDN) to cut on-die IR drop.",
      },
      {
        title: "Pull-Up / Pull-Down Resistors on GPIO & I2C Buses",
        simplifiedVsReal:
          "A disconnected digital input pin does not read 0 V—it floats unpredictably due to stray electric fields.",
        modernExample:
          "Microcontrollers and I2C buses use 4.7 kΩ–10 kΩ pull-up resistors to bias open-drain lines cleanly to VDD when undriven.",
      },
    ],
    misconceptions: [
      {
        myth: "Current gets 'used up' as it passes through a resistor.",
        reality:
          "By KCL, the exact same number of coulombs per second leave a resistor as enter it. Energy (voltage potential), not charge, is consumed.",
      },
      {
        myth: "A 10 A power supply forces 10 A through whatever circuit you connect to it.",
        reality:
          "A constant-voltage supply fixes V; the load's resistance determines how much current I = V / R actually flows (10 A is only its maximum rating).",
      },
    ],
    revisionNotes: [
      "V = IR relates voltage drop (V), current (A), and resistance (Ohms).",
      "KCL (node current sum = 0) expresses conservation of charge; KVL (loop voltage sum = 0) expresses conservation of energy.",
      "Series resistors sum directly (R1 + R2); parallel resistors sum by reciprocal (1/R1 + 1/R2)^-1.",
      "Power P = VI = I^2 R = V^2 / R converts electrical energy into heat.",
    ],
    glossaryTermIds: ["voltage", "electric-current", "ohms-law"],
    references: [
      {
        title: "The Art of Electronics (3rd Edition)",
        author: "Paul Horowitz & Winfield Hill",
        url: "https://artofelectronics.net/",
        type: "book",
        note: "Chapter 1 covers Ohm's law, voltage dividers, Thevenin equivalents, and practical circuit intuition.",
      },
      {
        title: "MIT OCW 6.002: Circuits and Electronics",
        author: "Anant Agarwal",
        url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
        type: "course",
        note: "Lectures 1–3 on lumped abstraction, KVL/KCL, and resistive networks.",
      },
    ],
    assessments: [
      {
        id: "t1-l2-q1",
        type: "math",
        difficulty: "foundational",
        prompt:
          "A voltage divider connects V_in = 5.0 V through R1 = 3 kΩ to V_out, and R2 = 2 kΩ from V_out to ground (with no external load). What is V_out in volts?",
        latex: "V_{\\text{out}} = 5.0 \\times \\frac{2\\text{ k}\\Omega}{3\\text{ k}\\Omega + 2\\text{ k}\\Omega}",
        correctAnswer: 2.0,
        numericTolerance: 0.01,
        hints: ["Use V_out = V_in * R2 / (R1 + R2)."],
        explanation:
          "Total series resistance is 5 kΩ, so current is 5 V / 5 kΩ = 1 mA. Across R2 = 2 kΩ, V_out = 1 mA * 2 kΩ = 2.0 V.",
        conceptTag: "voltage-divider",
      },
      {
        id: "t1-l2-q2",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "A processor core draws 60 W at 1.2 V. If the architecture is redesigned to deliver the same 60 W at 0.6 V across the same power-plane resistance R_wire, how does the I^2 R heat wasted in the wires change?",
        options: [
          {
            id: "a",
            text: "It stays the same because total power is still 60 W",
            explanation:
              "Total delivered power is 60 W, but halving voltage doubles the required current I = P/V.",
          },
          {
            id: "b",
            text: "It doubles (2x)",
            explanation:
              "Current doubles, and wire loss scales with the square of current (I^2 R), not linearly.",
          },
          {
            id: "c",
            text: "It quadruples (4x)",
            explanation:
              "Correct. At 0.6 V, current doubles from 50 A to 100 A, so I^2 R increases by 2^2 = 4x.",
          },
          {
            id: "d",
            text: "It drops to one-fourth (0.25x)",
            explanation:
              "Power loss drops by 4x only if voltage is doubled while keeping delivered power constant.",
          },
        ],
        correctAnswer: "c",
        hints: ["First compute the current I = P / V in both cases, then plug into I^2 R."],
        explanation:
          "Halving supply voltage at fixed power doubles current (50 A -> 100 A). Because wire Joule heating is I^2 R, losses quadruple.",
        conceptTag: "power-delivery-i2r",
      },
      {
        id: "t1-l2-q3",
        type: "multi-select",
        difficulty: "intermediate",
        prompt:
          "Which physical changes strictly decrease the electrical resistance R of a rectangular on-chip metal wire?",
        options: [
          {
            id: "a",
            text: "Doubling the wire width (cross-sectional area A)",
            explanation: "Correct. R = rho * L / A, so increasing A lowers resistance.",
          },
          {
            id: "b",
            text: "Halving the wire length L",
            explanation: "Correct. Shorter paths scatter electrons fewer times, halving R.",
          },
          {
            id: "c",
            text: "Switching to a material with higher resistivity rho",
            explanation: "Incorrect. Higher resistivity increases R proportionally.",
          },
          {
            id: "d",
            text: "Doubling the applied voltage across the wire",
            explanation:
              "Incorrect. For an ohmic resistor, R is a geometric/material property; doubling V doubles I, keeping R = V/I constant.",
          },
        ],
        correctAnswer: ["a", "b"],
        hints: ["Check every variable in R = rho * L / A."],
        explanation:
          "Resistance scales directly with resistivity rho and length L, and inversely with cross-sectional area A.",
        conceptTag: "wire-resistance",
      },
      {
        id: "t1-l2-q4",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: Adding a second resistor in parallel with an existing resistor always decreases the total equivalent resistance seen by the source.",
        correctAnswer: true,
        hints: ["Parallel branches open an additional path for current to flow."],
        explanation:
          "True. Adding a parallel branch adds positive conductance G_new = 1/R_new > 0, so G_total increases and R_eq = 1/G_total strictly decreases.",
        conceptTag: "parallel-resistance",
      },
    ],
  },

  // =========================================================================
  // LESSON 3: electromagnetism-rc-timing
  // =========================================================================
  {
    id: "electromagnetism-rc-timing",
    slug: "electromagnetism-rc-timing",
    number: 3,
    title: "Capacitance, Inductance & RC Signal Timing",
    subtitle:
      "Why digital signals take finite rise time, how RC delays bound clock speeds, and why switching costs energy",
    trackId: "track-1",
    domainId: "physics-electricity",
    moduleTitle: "Module 1: Physical Foundations of Electricity",
    chapterTitle: "Chapter 1: Matter, Charge & Signals",
    estimatedMinutes: 35,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["voltage-current-circuits"],
    simulatorId: "ohm-circuit",
    simulatorPrompt:
      "In the Ohm's Law & RC Timing Lab, tune R and C so the 10%–90% rise time (2.2 * R * C) stays below 2.2 ns while keeping peak current power below 25 mW.",
    objectives: [
      "Derive capacitance from parallel-plate geometry (C = eps A / d) and explain why voltage cannot jump instantaneously.",
      "Solve first-order RC charging and discharging curves using the time constant tau = RC.",
      "Explain why charging a capacitor through a resistor dissipates (1/2)CV^2 regardless of R.",
      "Describe inductance (V = L dI/dt) and how simultaneous switching causes L dI/dt ground bounce.",
    ],
    depthExplanations: {
      beginner:
        "Ideal digital waveforms are drawn as crisp vertical square edges: instant 0 to instant 1. Real chips never switch instantaneously because every transistor gate and metal wire acts as a tiny capacitor—two conductive surfaces separated by an insulator. Before a wire's voltage can rise from 0 V to 1 V, electrons must physically flow through resistive transistors and wires to charge that capacitance.\n\nThis combination of resistance ($R$) and capacitance ($C$) creates an exponential curve governed by the RC time constant $\\tau = R \\cdot C$. Larger resistance or larger capacitance makes signals sluggish, directly limiting how fast a CPU clock can tick.",
      intermediate:
        "A capacitor stores energy in an electric field ($E = \\frac{1}{2}CV^2$) with $I = C\\frac{dV}{dt}$. Driving an uncharged capacitor $C$ from a step source $V_{DD}$ through resistance $R$ produces $V_C(t) = V_{DD}(1 - e^{-t/RC})$. After $1\\tau$, voltage reaches $63.2\\%$; rising from $10\\%$ to $90\\%$ takes $t_{10-90} = \\ln(9)\\tau \\approx 2.2\\,RC$.\n\nRemarkably, charging $C$ from $0$ to $V_{DD}$ pulls $Q = C V_{DD}$ from the supply (total energy $C V_{DD}^2$), stores $\\frac{1}{2}C V_{DD}^2$ on the capacitor, and burns the other $\\frac{1}{2}C V_{DD}^2$ as heat in the resistor—no matter how small $R$ is! Meanwhile, changing currents create magnetic fields ($V = L\\frac{dI}{dt}$), causing inductive ringing and supply droop during fast clock edges.",
      advanced:
        "Distributed on-chip interconnects are not single lumped RC elements—they behave as distributed RC ladders (and at multi-GHz speeds, lossy RLC transmission lines). By the Elmore delay approximation, the delay of a uniform wire of total resistance $R_w$ and total capacitance $C_w$ scales quadratically with wire length $L$: $t_d \\approx 0.38\\,R_w C_w \\propto L^2$!\n\nBecause global wires spanning a $20\\text{ mm}$ die would suffer devastating $L^2$ RC delays, chip architects insert CMOS repeater buffers every few hundred micrometers, converting quadratic $L^2$ delay into linear $O(L)$ delay at the cost of extra silicon area and switching power.",
    },
    intuition:
      "Charging a capacitor through a resistor is like filling a bucket (capacitance) through a narrow garden hose (resistance). A wider bucket or a narrower hose takes longer to reach the top—and because water pressure drops as the bucket fills up, the last 10% trickles in exponentially slower.",
    technicalTheory:
      "For a parallel-plate capacitor of area $A$, plate separation $d$, and dielectric permittivity $\\varepsilon = \\varepsilon_0\\varepsilon_r$:\n\n$$C = \\frac{\\varepsilon_0\\varepsilon_r A}{d}, \\qquad I_C = C\\frac{dV_C}{dt}$$\n\nApplying KVL to a series RC circuit driven by a step $V_{DD}$ at $t=0$ ($V_C(0)=0$) yields the first-order ODE $RC\\frac{dV_C}{dt} + V_C = V_{DD}$, whose solution is:\n\n$$V_C(t) = V_{DD}\\left(1 - e^{-t/\\tau}\\right), \\qquad \\tau = R C$$\n\nDischarging from $V_{DD}$ to $0$ follows $V_C(t) = V_{DD} e^{-t/\\tau}$. Over one full charge-discharge cycle, total energy drawn from $V_{DD}$ is $C V_{DD}^2$, giving dynamic switching power at frequency $f$ and activity factor $\\alpha$:\n\n$$P_{\\text{dyn}} = \\alpha C V_{DD}^2 f$$\n\nInductance $L$ resists changes in current via Faraday's law: $V_L = L\\frac{dI}{dt}$, storing magnetic energy $\\frac{1}{2}LI^2$.",
    mechanisms: [
      {
        step: 1,
        title: "Step Input Creates Maximum Initial Current",
        detail:
          "At t = 0+, capacitor voltage is still 0 V (cannot jump instantly), so full V_DD drops across R and initial current is I_0 = V_DD / R.",
        stateNote: "t = 0+: V_C = 0 V, I = V_DD / R.",
      },
      {
        step: 2,
        title: "Charge Accumulates & Back-Pressure Builds",
        detail:
          "Current deposits charge on the capacitor plates, raising V_C and shrinking the voltage across R to (V_DD - V_C).",
        stateNote: "As V_C rises, charging current decays exponentially.",
      },
      {
        step: 3,
        title: "Threshold & Rise-Time Crossing",
        detail:
          "At t = 1*tau, V_C reaches 63.2% of V_DD; the 10%-to-90% logic transition completes at t_r ≈ 2.2 * RC.",
        stateNote: "Downstream logic gates switch once V_C crosses ~0.5 * V_DD (t ≈ 0.69 * RC).",
      },
      {
        step: 4,
        title: "Discharge Dumps Stored Energy as Heat",
        detail:
          "When the circuit switches back to 0 V, the (1/2)CV^2 energy stored in the electric field dissipates through the pull-down resistance to ground.",
        stateNote: "One full 0 -> 1 -> 0 cycle consumes C * V_DD^2 joules total.",
      },
    ],
    mathNotes: [
      {
        title: "RC Time Constant & 10%–90% Rise Time",
        latex: "\\tau = RC, \\qquad t_{10\\%-90\\%} = \\tau\\ln(9) \\approx 2.197\\,RC",
        explanation:
          "Halving wire resistance or load capacitance directly halves signal rise time.",
      },
      {
        title: "50% Propagation Delay",
        latex: "t_{pd} = \\tau\\ln(2) \\approx 0.693\\,RC",
        explanation:
          "The time required for a step response to cross the 50% switching midpoint V_DD/2.",
      },
      {
        title: "Inductive Voltage Kick (Ground Bounce)",
        latex: "\\Delta V = L_{\\text{pkg}}\\frac{dI}{dt}",
        explanation:
          "If a chip package has 1 nH inductance and current surges by 10 A in 0.5 ns, supply voltage drops by 20 V unless local decoupling capacitors supply the burst.",
      },
    ],
    diagram: {
      title: "First-Order RC Charging & Inductive Power Integrity",
      caption:
        "Driver resistance R and load capacitance C shape the exponential signal edge, while decoupling caps isolate package inductance L_pkg.",
      nodes: [
        { id: "vstep", label: "Step Driver", sublabel: "0 -> V_DD", x: 80, y: 140, tone: "accent" },
        { id: "res", label: "Resistance R", sublabel: "Driver + Wire", x: 245, y: 140, tone: "amber" },
        { id: "cap", label: "Load Cap C", sublabel: "Gate + Interconnect", x: 425, y: 140, tone: "emerald" },
        { id: "tau", label: "Rise Time", sublabel: "t_r ≈ 2.2 RC", x: 590, y: 80, tone: "neutral" },
        { id: "heat", label: "Cycle Energy", sublabel: "C * V_DD^2", x: 590, y: 205, tone: "amber" },
      ],
      edges: [
        { from: "vstep", to: "res", label: "I(t)" },
        { from: "res", to: "cap", label: "tau = RC" },
        { from: "cap", to: "tau", label: "V_C(t)" },
        { from: "res", to: "heat", label: "1/2 CV^2" },
        { from: "cap", to: "heat", label: "1/2 CV^2" },
      ],
    },
    codeExamples: [
      {
        title: "Numerical RC Step Response & Switching Energy Verification",
        language: "python",
        code: `import math

V_dd = 1.0          # Volts
R = 500.0           # Ohms
C = 200e-15         # 200 fF
tau = R * C

t_50 = tau * math.log(2)
t_10_90 = tau * math.log(9)
e_cycle = C * (V_dd ** 2)

print(f"tau = {tau*1e12:.1f} ps")
print(f"50% delay = {t_50*1e12:.2f} ps")
print(f"10%-90% rise time = {t_10_90*1e12:.2f} ps")
print(f"V(1*tau) = {V_dd * (1 - math.exp(-1)):.4f} V")
print(f"Energy per 0->1->0 cycle = {e_cycle*1e15:.1f} fJ")`,
        explanation:
          "Computes exact timing milestones and energy per switching cycle for a realistic on-chip interconnect driven through 500 Ω.",
        output: `tau = 100.0 ps
50% delay = 69.31 ps
10%-90% rise time = 219.72 ps
V(1*tau) = 0.6321 V
Energy per 0->1->0 cycle = 200.0 fJ`,
      },
    ],
    connections: [
      {
        lessonSlug: "voltage-current-circuits",
        relationship: "Extends static Ohm's law circuits with time-varying C and L elements.",
      },
      {
        lessonSlug: "mosfets-and-cmos-logic",
        relationship: "Uses RC delay and CV^2 energy to derive CMOS gate delay and dynamic power.",
      },
      {
        lessonSlug: "sequential-logic-flip-flops",
        relationship: "Sets the combinational RC critical path bound that determines maximum clock frequency.",
      },
    ],
    realWorldApplications: [
      {
        title: "Decoupling Capacitors Around Every CPU Die",
        simplifiedVsReal:
          "Power rails are drawn as rock-solid constants; in reality, package pin inductance L causes massive voltage droop during sudden clock wakeups.",
        modernExample:
          "Modern CPU packages pack dozens of tiny MLCC decoupling capacitors right beneath the silicon die to supply nanosecond current bursts locally.",
      },
      {
        title: "Repeater Insertion in Long On-Chip Wires",
        simplifiedVsReal:
          "Single lumped RC gives linear delay; distributed on-chip wires have RC delay proportional to length squared (L^2).",
        modernExample:
          "SoCs break millimeter-long buses into short segments with CMOS inverter repeaters so global signals cross the chip within one clock cycle.",
      },
    ],
    misconceptions: [
      {
        myth: "Lowering resistor R reduces the total energy lost as heat when charging a capacitor from a constant voltage source.",
        reality:
          "Smaller R charges faster with higher peak current, but the integral of I^2 R dt always equals exactly (1/2)CV^2—independent of R!",
      },
      {
        myth: "Capacitors store net electric charge like a battery.",
        reality:
          "A capacitor holds +Q on one plate and -Q on the other, so its net charge is zero; it stores energy in the electric field between plates.",
      },
    ],
    deepDive: {
      title: "Why Charging a Capacitor Always Wastes Exactly Half the Energy",
      content:
        "During charging from a fixed supply $V_{DD}$, the battery pushes total charge $Q = C V_{DD}$ across a constant potential $V_{DD}$, expending $E_{\\text{supply}} = Q V_{DD} = C V_{DD}^2$. Yet the capacitor only stores $E_{\\text{cap}} = \\int_0^{V_{DD}} C V\\,dV = \\frac{1}{2} C V_{DD}^2$. Integrating $P_R(t) = I(t)^2 R = \\frac{V_{DD}^2}{R}e^{-2t/RC}$ from $0$ to $\\infty$ yields $\\frac{1}{2} C V_{DD}^2$ regardless of $R$. Only adiabatic (slowly ramped) charging can beat this $\\frac{1}{2}CV^2$ tax.",
    },
    revisionNotes: [
      "Capacitor current is I = C dV/dt; voltage across a capacitor cannot change instantaneously.",
      "tau = RC sets the exponential timescale: 63.2% at 1*tau, 50% at 0.69*tau, 10%–90% at 2.2*tau.",
      "One full 0->1->0 CMOS transition dissipates C * V_DD^2 joules regardless of R.",
      "Inductors oppose rapid current changes via V = L dI/dt, causing ringing and ground bounce.",
    ],
    glossaryTermIds: ["capacitance", "rc-time-constant", "voltage", "ohms-law"],
    references: [
      {
        title: "MIT OCW 6.002: Circuits and Electronics (First-Order RC Networks)",
        author: "Anant Agarwal",
        url: "https://ocw.mit.edu/courses/6-002-circuits-and-electronics-spring-2007/",
        type: "course",
        note: "Differential equation derivation of RC/RL transients and energy storage.",
      },
      {
        title: "Digital Integrated Circuits: A Design Perspective",
        author: "Jan M. Rabaey, Anantha Chandrakasan, Borivoje Nikolic",
        url: "https://bwrcs.eecs.berkeley.edu/Classes/icbook/",
        type: "book",
        note: "Chapter 4 & 5 analyze Elmore wire delay, repeaters, and dynamic switching energy.",
      },
    ],
    assessments: [
      {
        id: "t1-l3-q1",
        type: "math",
        difficulty: "foundational",
        prompt:
          "A driver with R = 250 Ω drives a wire+gate capacitance of C = 400 fF (4e-13 F). What is the RC time constant tau in picoseconds?",
        latex: "\\tau = R \\cdot C = 250\\,\\Omega \\times 400\\text{ fF}",
        correctAnswer: 100,
        numericTolerance: 0.5,
        hints: ["1 fF = 1e-15 F, and 1 ps = 1e-12 s."],
        explanation:
          "tau = 250 * 400e-15 s = 100,000e-15 s = 100e-12 s = 100 ps.",
        conceptTag: "rc-time-constant",
      },
      {
        id: "t1-l3-q2",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "A chip designer halves the supply voltage V_DD from 1.2 V to 0.6 V while keeping clock frequency f and capacitance C unchanged. By what factor does dynamic switching power P_dyn = alpha * C * V_DD^2 * f drop?",
        options: [
          {
            id: "a",
            text: "2x reduction",
            explanation: "Power depends on V_DD squared, not linearly on V_DD.",
          },
          {
            id: "b",
            text: "4x reduction",
            explanation:
              "Correct. Because (0.6 / 1.2)^2 = (1/2)^2 = 1/4, dynamic power drops by 4x.",
          },
          {
            id: "c",
            text: "8x reduction",
            explanation:
              "An 8x reduction only happens if you halve both V_DD (4x) and clock frequency f (2x) together.",
          },
          {
            id: "d",
            text: "No change unless resistance changes",
            explanation:
              "Dynamic switching energy C*V_DD^2 is independent of resistance R.",
          },
        ],
        correctAnswer: "b",
        hints: ["Substitute (V_DD / 2) into P = alpha * C * V_DD^2 * f."],
        explanation:
          "Dynamic power scales quadratically with supply voltage, which is why DVFS (Dynamic Voltage and Frequency Scaling) cuts voltage whenever lower clock speeds allow.",
        conceptTag: "dynamic-power-scaling",
      },
      {
        id: "t1-l3-q3",
        type: "predict-output",
        difficulty: "intermediate",
        prompt:
          "An uncharged capacitor C is connected through R to a 2.0 V supply at t = 0. What is the capacitor voltage V_C at t = 1 * tau?",
        options: [
          {
            id: "a",
            text: "1.00 V",
            explanation: "50% (1.00 V) occurs earlier, at t ≈ 0.693 * tau.",
          },
          {
            id: "b",
            text: "1.26 V",
            explanation:
              "Correct. 2.0 * (1 - e^-1) = 2.0 * 0.6321 ≈ 1.264 V.",
          },
          {
            id: "c",
            text: "1.80 V",
            explanation: "90% (1.80 V) takes roughly 2.30 * tau.",
          },
          {
            id: "d",
            text: "2.00 V",
            explanation: "A first-order RC circuit approaches 2.00 V asymptotically.",
          },
        ],
        correctAnswer: "b",
        hints: ["Evaluate V_DD * (1 - e^-1), where 1 - e^-1 ≈ 0.632."],
        explanation:
          "At one time constant t = tau, any charging RC network reaches 63.2% of its final step value: 0.632 * 2.0 V ≈ 1.26 V.",
        conceptTag: "rc-step-response",
      },
      {
        id: "t1-l3-q4",
        type: "ordering",
        difficulty: "rigorous",
        prompt:
          "Order the steps of what happens physically when a 100-million-transistor functional block wakes up in a single clock edge and draws a sudden current spike dI/dt:",
        orderingItems: [
          "Package bondwire/pin inductance L resists the sudden dI/dt from the motherboard VRM.",
          "Local on-die decoupling capacitors supply immediate charge for the first fraction of a nanosecond.",
          "On-chip supply voltage VDD droops momentarily by deltaV = L * (dI/dt) if decoupling is insufficient.",
          "Transistor drive strength weakens during the droop, slowing logic RC transitions.",
        ],
        correctAnswer: [
          "Package bondwire/pin inductance L resists the sudden dI/dt from the motherboard VRM.",
          "Local on-die decoupling capacitors supply immediate charge for the first fraction of a nanosecond.",
          "On-chip supply voltage VDD droops momentarily by deltaV = L * (dI/dt) if decoupling is insufficient.",
          "Transistor drive strength weakens during the droop, slowing logic RC transitions.",
        ],
        hints: [
          "Start with the inductive barrier at the package boundary, then local charge storage, then voltage droop, then timing impact.",
        ],
        explanation:
          "Package inductance delays external current ramp-up, forcing local decoupling capacitors to carry the transient; any shortfall produces an L*dI/dt voltage droop that slows RC gate switching.",
        conceptTag: "inductive-droop",
      },
    ],
  },

  // =========================================================================
  // LESSON 4: silicon-doping-pn-junction
  // =========================================================================
  {
    id: "silicon-doping-pn-junction",
    slug: "silicon-doping-pn-junction",
    number: 4,
    title: "Silicon Crystals, Doping & the PN Junction",
    subtitle:
      "Covalent diamond lattices, electrons vs. holes, and how a junction creates one-way conduction",
    trackId: "track-1",
    domainId: "semiconductors",
    moduleTitle: "Module 2: Semiconductors & Transistor Switches",
    chapterTitle: "Chapter 2: From Silicon to CMOS",
    estimatedMinutes: 35,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["what-is-an-electron", "voltage-current-circuits"],
    simulatorId: "pn-diode-charge",
    simulatorPrompt:
      "In the PN Junction, Carrier Drift & Diode Lab, select PN Junction & Shockley Diode mode, sweep donor/acceptor doping densities and applied bias from reverse to forward voltage, and observe depletion-barrier narrowing and exponential I-V turn-on.",
    objectives: [
      "Explain why pure crystalline silicon (4 valence electrons, 1.12 eV band gap) is a poor conductor at room temperature.",
      "Compare n-type donor doping (phosphorus/arsenic) and p-type acceptor doping (boron) in terms of majority carriers.",
      "Trace how diffusion and drift balance to form the depletion region and built-in potential (~0.7 V) at a PN junction.",
      "Predict diode current behavior under forward bias vs. reverse bias using the Shockley diode equation.",
    ],
    depthExplanations: {
      beginner:
        "Why is Silicon Valley named after sand? Pure silicon atoms each have 4 outer electrons, which lock neatly into 4 covalent bonds with neighboring silicon atoms in a rigid crystal lattice. Because every outer electron is tied down in a bond, pure silicon barely conducts electricity.\n\nEngineers turn silicon into a controllable switch by 'doping' it—swapping roughly one silicon atom in a million with an impurity atom. Phosphorus (5 outer electrons) brings a spare mobile electron (n-type silicon), while boron (3 outer electrons) leaves an empty bond called a 'hole' that acts like a positive charge (p-type silicon). Pushing p-type and n-type silicon together creates a PN junction diode: a one-way valve for electric current.",
      intermediate:
        "In intrinsic silicon at $300\\text{ K}$, thermal energy breaks only enough covalent bonds to sustain $n_i \\approx 1.0 \\times 10^{10}\\text{ carriers/cm}^3$ across the $1.12\\text{ eV}$ band gap—tiny compared to silicon's $5 \\times 10^{22}\\text{ atoms/cm}^3$. Doping with $N_D = 10^{17}\\text{ cm}^{-3}$ donors boosts electron concentration by seven orders of magnitude while depressing hole concentration via the mass-action law $n \\cdot p = n_i^2$.\n\nWhen p-type and n-type regions meet, electrons diffuse into the p-side and holes diffuse into the n-side, recombining and leaving behind immobile ionized dopants ($\\text{B}^-$ and $\\text{P}^+$). This carrier-free depletion region builds an internal electric field that halts further diffusion at a built-in barrier $V_{bi} \\approx 0.7\\text{ V}$.",
      advanced:
        "At thermal equilibrium, the Fermi level $E_F$ must be spatially constant across the junction, bending the conduction and valence bands by $q V_{bi} = k_B T \\ln(N_A N_D / n_i^2)$. Current across a PN junction arises from the balance of carrier drift (field-driven) and carrier diffusion (gradient-driven).\n\nApplying forward bias $V_A > 0$ lowers the electrostatic barrier to $V_{bi} - V_A$, exponentially increasing minority-carrier injection across the depletion edge and yielding the Shockley equation $I = I_S (e^{V_A / n V_T} - 1)$, where $V_T = k_B T / q \\approx 25.85\\text{ mV}$ at $300\\text{ K}$. Reverse bias widens the depletion width $W \\propto \\sqrt{V_{bi} + V_R}$, blocking DC current while creating a voltage-dependent junction capacitance.",
    },
    intuition:
      "Imagine a crowded theater where every seat (covalent bond) is filled—nobody can move. A 'hole' is a single empty seat: when someone slides left into the empty seat, the empty seat effectively moves right! That is how p-type holes conduct current through valence bonds.",
    technicalTheory:
      "In thermal equilibrium, the product of electron concentration $n$ and hole concentration $p$ obeys the mass-action law:\n\n$$n \\cdot p = n_i^2 \\approx 1.0 \\times 10^{20}\\text{ cm}^{-6} \\text{ (Si at } 300\\text{ K)}$$\n\nFor n-type doping ($N_D \\gg n_i$), $n \\approx N_D$ and $p \\approx n_i^2 / N_D$. At an abrupt PN junction, the equilibrium built-in potential is:\n\n$$V_{bi} = V_T \\ln\\left(\\frac{N_A N_D}{n_i^2}\\right), \\qquad V_T = \\frac{k_B T}{q} \\approx 25.85\\text{ mV}$$\n\nUnder external bias $V_D$, the ideal diode current grows exponentially in forward bias and saturates at $-I_S$ in reverse bias:\n\n$$I_D = I_S\\left(e^{V_D / (n V_T)} - 1\\right)$$",
    mechanisms: [
      {
        step: 1,
        title: "Covalent Lattice & Impurity Substitution",
        detail:
          "Group V donors (P, As) donate a weakly bound 5th electron (~45 meV below conduction band); Group III acceptors (B) accept a valence electron, creating a mobile hole.",
        stateNote: "Both doped sides remain electrically neutral overall prior to contact.",
      },
      {
        step: 2,
        title: "Carrier Diffusion Across Boundary",
        detail:
          "Steep concentration gradients drive electrons from n -> p and holes from p -> n across the metallurgical junction.",
        stateNote: "Diffusing carriers recombine near the boundary.",
      },
      {
        step: 3,
        title: "Depletion Zone & Built-In Field",
        detail:
          "Exposed fixed ions (- on p-side, + on n-side) establish an internal E-field pointing n -> p that opposes further diffusion.",
        stateNote: "Equilibrium settles when drift current equals diffusion current (V_bi ≈ 0.7 V).",
      },
      {
        step: 4,
        title: "Asymmetric Bias Response",
        detail:
          "Forward bias (+ on p, - on n) shrinks the depletion barrier for exponential conduction; reverse bias widens the barrier and blocks flow.",
        stateNote: "Every MOSFET relies on reverse-biased PN junctions to isolate source/drain from the body.",
      },
    ],
    mathNotes: [
      {
        title: "Mass-Action Law",
        latex: "n \\cdot p = n_i^2",
        explanation:
          "Adding donor electrons suppresses minority holes proportionally through increased recombination.",
      },
      {
        title: "Built-In Junction Potential",
        latex: "V_{bi} = \\frac{k_B T}{q} \\ln\\left(\\frac{N_A N_D}{n_i^2}\\right)",
        explanation:
          "Typical silicon PN junctions with N_A = 10^17 and N_D = 10^16 cm^-3 yield V_bi ≈ 0.75 V.",
      },
      {
        title: "Shockley Diode Current",
        latex: "I_D = I_S\\left(e^{V_D / (n V_T)} - 1\\right)",
        explanation:
          "At room temperature (V_T ≈ 25.85 mV, ideality n=1), each +60 mV of forward bias multiplies diode current by ~10x.",
      },
    ],
    diagram: {
      title: "PN Junction Equilibrium & Depletion Region",
      caption:
        "Exposed negative acceptor ions (p-side) and positive donor ions (n-side) create an internal E-field that blocks net carrier flow at zero bias.",
      nodes: [
        { id: "ptype", label: "P-Type Neutral", sublabel: "Mobile holes (+)", x: 85, y: 140, tone: "accent" },
        { id: "pions", label: "Depletion (P-side)", sublabel: "Fixed B- ions", x: 245, y: 140, tone: "amber" },
        { id: "efield", label: "Built-In Barrier", sublabel: "V_bi ≈ 0.7 V", x: 340, y: 65, tone: "neutral" },
        { id: "nions", label: "Depletion (N-side)", sublabel: "Fixed P+ ions", x: 435, y: 140, tone: "amber" },
        { id: "ntype", label: "N-Type Neutral", sublabel: "Mobile e- (-)", x: 595, y: 140, tone: "emerald" },
      ],
      edges: [
        { from: "ptype", to: "pions", label: "holes diffuse ->" },
        { from: "ntype", to: "nions", label: "<- e- diffuse" },
        { from: "nions", to: "efield", label: "E-field" },
        { from: "efield", to: "pions", label: "opposes drift" },
      ],
    },
    codeExamples: [
      {
        title: "Silicon Built-In Potential & Shockley Diode Curve",
        language: "python",
        code: `import math

k_B = 1.380649e-23
q = 1.602176634e-19
T = 300.0
V_T = (k_B * T) / q       # ~25.85 mV
n_i = 1.0e10              # cm^-3 for Si at 300 K

N_A = 1e17                # p-side boron doping (cm^-3)
N_D = 1e16                # n-side phosphorus doping (cm^-3)
V_bi = V_T * math.log((N_A * N_D) / (n_i ** 2))

I_S = 1e-12               # 1 pA saturation current
print(f"Thermal voltage V_T = {V_T*1e3:.2f} mV")
print(f"Built-in potential V_bi = {V_bi:.3f} V")
for v_d in [-1.0, 0.0, 0.5, 0.65, 0.70]:
    i_d = I_S * (math.exp(v_d / V_T) - 1.0)
    print(f"V_D = {v_d:+5.2f} V -> I_D = {i_d:.3e} A")`,
        explanation:
          "Demonstrates why a silicon diode conducts negligible current at 0.5 V or -1.0 V, then turns on sharply around 0.65–0.70 V.",
        output: `Thermal voltage V_T = 25.85 mV
Built-in potential V_bi = 0.774 V
V_D = -1.00 V -> I_D = -1.000e-12 A
V_D = +0.00 V -> I_D = 0.000e+00 A
V_D = +0.50 V -> I_D = 2.510e-04 A
V_D = +0.65 V -> I_D = 8.308e-02 A
V_D = +0.70 V -> I_D = 5.748e-01 A`,
      },
    ],
    connections: [
      {
        lessonSlug: "what-is-an-electron",
        relationship: "Applies atomic valence shell physics to crystalline silicon lattices.",
      },
      {
        lessonSlug: "mosfets-and-cmos-logic",
        relationship: "Places two back-to-back PN junctions under a MOS gate to build a transistor switch.",
      },
    ],
    realWorldApplications: [
      {
        title: "Body Isolation & ESD Protection Diodes in CPUs",
        simplifiedVsReal:
          "Students learn PN junctions as discrete rectifier diodes; inside every CPU, billions of reverse-biased PN junctions keep transistors electrically isolated from the silicon substrate.",
        modernExample:
          "Every I/O pad on a modern SoC integrates dual PN clamping diodes to VDD and GND to shunt thousand-volt electrostatic discharge (ESD) zaps safely.",
      },
      {
        title: "Silicon Solar Cells & LEDs",
        simplifiedVsReal:
          "In silicon, band-gap recombination releases heat (indirect band gap); compound semiconductors like GaN release photons efficiently.",
        modernExample:
          "Blue/white LEDs use GaN PN junctions, while silicon PV panels use large-area PN depletion fields to separate sunlight-generated electron-hole pairs.",
      },
    ],
    misconceptions: [
      {
        myth: "N-type silicon is negatively charged overall and p-type silicon is positively charged overall.",
        reality:
          "Both are electrically neutral! Every extra electron from a phosphorus atom is balanced by an extra proton in the phosphorus nucleus.",
      },
      {
        myth: "Current stops completely at 0 V bias inside a PN junction.",
        reality:
          "Dynamic equilibrium means large opposing drift and diffusion currents cancel out to zero net current.",
      },
    ],
    revisionNotes: [
      "Pure Si has 4 valence electrons and a 1.12 eV band gap; mass-action law n*p = n_i^2 holds at equilibrium.",
      "Group V donors create n-type silicon (majority electrons); Group III acceptors create p-type silicon (majority holes).",
      "Diffusion leaves fixed ionized dopants at the junction, forming a depletion region with V_bi ≈ 0.7 V.",
      "Forward bias narrows the depletion zone for exponential conduction; reverse bias widens it.",
    ],
    glossaryTermIds: ["band-gap", "doping", "depletion-region", "electric-field"],
    references: [
      {
        title: "MIT OCW 6.012: Microelectronic Devices and Circuits",
        author: "Clifton Fonstad",
        url: "https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2009/",
        type: "course",
        note: "Lectures 1–8 cover semiconductor carrier statistics, doping, and PN junction electrostatics.",
      },
      {
        title: "Microelectronic Circuits (Sedra & Smith)",
        author: "Adel S. Sedra & Kenneth C. Smith",
        url: "https://global.oup.com/academic/product/microelectronic-circuits-9780190853464",
        type: "book",
        note: "Standard undergraduate reference for diode and semiconductor device models.",
      },
    ],
    assessments: [
      {
        id: "t1-l4-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "Which dopant element turns pure silicon into p-type semiconductor where holes are the majority charge carriers?",
        options: [
          {
            id: "a",
            text: "Phosphorus (Group V, 5 valence electrons)",
            explanation:
              "Phosphorus has 5 valence electrons and donates a free electron, creating n-type silicon.",
          },
          {
            id: "b",
            text: "Boron (Group III, 3 valence electrons)",
            explanation:
              "Correct. Boron has 3 valence electrons, leaving an electron vacancy (hole) in one of the four Si covalent bonds.",
          },
          {
            id: "c",
            text: "Arsenic (Group V, 5 valence electrons)",
            explanation:
              "Arsenic is a donor impurity used heavily in n-type source/drain implants.",
          },
          {
            id: "d",
            text: "Germanium (Group IV, 4 valence electrons)",
            explanation:
              "Germanium has 4 valence electrons like silicon and alters lattice strain/band gap rather than doping polarity.",
          },
        ],
        correctAnswer: "b",
        hints: ["Silicon has 4 valence electrons; p-type needs an electron-deficient (Group III) atom."],
        explanation:
          "Group III elements such as boron accept an electron from the valence band, leaving mobile holes as majority carriers.",
        conceptTag: "doping-polarity",
      },
      {
        id: "t1-l4-q2",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: A piece of n-type silicon sitting alone on a lab bench carries a strong negative net electrical charge because of its excess conduction electrons.",
        correctAnswer: false,
        hints: ["Count the protons in the phosphorus donor nuclei."],
        explanation:
          "False. Each phosphorus atom contributes one extra proton in its nucleus alongside its extra valence electron, keeping the crystal electrically neutral.",
        conceptTag: "charge-neutrality",
      },
      {
        id: "t1-l4-q3",
        type: "math",
        difficulty: "rigorous",
        prompt:
          "Pure silicon has n_i = 1.0e10 cm^-3 at 300 K. If a wafer is doped with N_D = 2.5e16 cm^-3 phosphorus atoms, what is the minority hole concentration p (in cm^-3)?",
        latex: "p = \\frac{n_i^2}{N_D} = \\frac{(1.0 \\times 10^{10})^2}{2.5 \\times 10^{16}}",
        correctAnswer: 4000,
        numericTolerance: 10,
        hints: ["Apply the mass-action law n * p = n_i^2 with n ≈ N_D."],
        explanation:
          "n_i^2 = 1e20 cm^-6. Dividing by 2.5e16 cm^-3 yields p = 4,000 holes/cm^3—over 12 orders of magnitude fewer holes than electrons!",
        conceptTag: "mass-action-law",
      },
      {
        id: "t1-l4-q4",
        type: "matching",
        difficulty: "intermediate",
        prompt:
          "Match each PN junction condition to its physical effect on the depletion region:",
        matchingPairs: [
          { id: "m1", left: "Zero external bias", right: "Drift equals diffusion; ~0.7 V built-in barrier" },
          { id: "m2", left: "Forward bias (+ on P, - on N)", right: "Depletion region narrows; exponential current flows" },
          { id: "m3", left: "Reverse bias (- on P, + on N)", right: "Depletion region widens; DC current blocked" },
        ],
        correctAnswer: {
          m1: "Drift equals diffusion; ~0.7 V built-in barrier",
          m2: "Depletion region narrows; exponential current flows",
          m3: "Depletion region widens; DC current blocked",
        },
        hints: ["Consider whether the applied voltage opposes or reinforces the built-in field."],
        explanation:
          "Forward bias opposes the built-in barrier and narrows the depletion zone; reverse bias reinforces it and widens the insulating gap.",
        conceptTag: "junction-bias",
      },
    ],
  },

  // =========================================================================
  // LESSON 5: mosfets-and-cmos-logic
  // =========================================================================
  {
    id: "mosfets-and-cmos-logic",
    slug: "mosfets-and-cmos-logic",
    number: 5,
    title: "MOSFET Physics & CMOS Logic Gates",
    subtitle:
      "Field-effect inversion channels, complementary pull-up/pull-down networks, and noise-immune digital switching",
    trackId: "track-1",
    domainId: "semiconductors",
    moduleTitle: "Module 2: Semiconductors & Transistor Switches",
    chapterTitle: "Chapter 2: From Silicon to CMOS",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["silicon-doping-pn-junction", "electromagnetism-rc-timing"],
    simulatorId: "mosfet-cmos",
    simulatorPrompt:
      "In the MOSFET & CMOS Inverter Sandbox, sweep V_in from 0 V to V_DD to inspect the Voltage Transfer Characteristic (VTC), locate the threshold midpoint, and observe the crowbar current spike during switching.",
    objectives: [
      "Explain how gate voltage forms a conductive inversion channel across an insulated dielectric in NMOS and PMOS transistors.",
      "Compare cutoff, triode (linear), and saturation operating regimes using V_GS, V_DS, and V_th.",
      "Construct a CMOS inverter, NAND, and NOR gate using complementary PMOS pull-up and NMOS pull-down networks.",
      "Analyze static leakage, dynamic CV^2f power, and short-circuit crowbar current in CMOS switching.",
    ],
    depthExplanations: {
      beginner:
        "A MOSFET is an electrically controlled switch with no moving parts. Take a p-type silicon body, implant two n-type pockets (Source and Drain), and place a tiny metal gate separated by an ultra-thin glass insulator (oxide) right between them. Normally, two back-to-back PN junctions block current from flowing between Source and Drain. When you apply positive voltage to the gate, its electric field attracts electrons under the oxide, creating a thin conductive bridge (channel) that turns the switch ON.\n\nModern chips pair two opposite transistor types—NMOS (turns ON with a 1, pulls output down to 0 V) and PMOS (turns ON with a 0, pulls output up to VDD)—into CMOS logic. Because one transistor is always OFF when the circuit sits still, CMOS consumes almost zero power when idle!",
      intermediate:
        "In an enhancement-mode NMOS device, once $V_{GS} > V_{th}$, surface inversion creates an n-channel connecting Source and Drain. For small $V_{DS} < V_{GS} - V_{th}$, the channel acts like a voltage-controlled resistor (triode region). For $V_{DS} \\ge V_{GS} - V_{th}$, the channel pinches off near the drain and current saturates: $I_D \\approx \\frac{1}{2}\\mu_n C_{ox}\\frac{W}{L}(V_{GS} - V_{th})^2$.\n\nIn a CMOS inverter (PMOS above, NMOS below), steady-state input $0\\text{ V}$ turns PMOS ON and NMOS OFF ($V_{\\text{out}} = V_{DD}$); input $V_{DD}$ turns PMOS OFF and NMOS ON ($V_{\\text{out}} = 0\\text{ V}$). Its steep Voltage Transfer Characteristic (VTC) regenerates noisy inputs back to clean voltage rails, giving high noise margins.",
      advanced:
        "At sub-20 nm FinFET and Gate-All-Around (GAAFET) nodes, simple square-law MOSFET equations break down due to velocity saturation ($I_D \\propto (V_{GS} - V_{th})$ rather than squared), Drain-Induced Barrier Lowering (DIBL), and quantum tunneling through sub-1 nm equivalent oxide thickness (EOT) high-k $\\text{HfO}_2$ gate stacks.\n\nTotal chip power splits into dynamic switching ($\\alpha C_L V_{DD}^2 f$), short-circuit crowbar current while both PMOS and NMOS briefly conduct ($V_{th,n} < V_{\\text{in}} < V_{DD} - |V_{th,p}|$), and exponential subthreshold leakage $I_{\\text{sub}} \\propto e^{(V_{GS}-V_{th})/(n V_T)}$. Because $V_{th}$ cannot shrink without exploding leakage, $V_{DD}$ stalled near $0.7\\text{–}1.0\\text{ V}$, ending classical Dennard scaling.",
    },
    intuition:
      "Think of a CMOS gate as a tug-of-war where PMOS pulls the output up to VDD and NMOS pulls it down to GND, controlled by the exact same input signal—except PMOS pulls when the input is LOW and NMOS pulls when the input is HIGH. Because they take turns rather than fighting each other in steady state, almost no current wastes away to ground.",
    technicalTheory:
      "An NMOS transistor conducts when $V_{GS} > V_{th}$ ($V_{th} > 0$), while a PMOS transistor conducts when $V_{SG} > |V_{th,p}|$ (equivalently $V_{GS} < V_{th,p} < 0$). In the long-channel square-law model with oxide capacitance per unit area $C_{ox} = \\varepsilon_{ox}/t_{ox}$ and aspect ratio $W/L$:\n\n$$I_D = \\begin{cases} 0, & V_{GS} < V_{th} \\text{ (cutoff)} \\\\ \\mu_n C_{ox}\\frac{W}{L}\\left[(V_{GS}-V_{th})V_{DS} - \\frac{1}{2}V_{DS}^2\\right], & V_{DS} < V_{GS}-V_{th} \\text{ (triode)} \\\\ \\frac{1}{2}\\mu_n C_{ox}\\frac{W}{L}(V_{GS}-V_{th})^2, & V_{DS} \\ge V_{GS}-V_{th} \\text{ (saturation)} \\end{cases}$$\n\nFor general CMOS logic gates, pull-up (PMOS) and pull-down (NMOS) networks are topological duals: series NMOS pull-down corresponds to parallel PMOS pull-up (forming a 2-input NAND gate), while parallel NMOS pull-down corresponds to series PMOS pull-up (forming a 2-input NOR gate).",
    mechanisms: [
      {
        step: 1,
        title: "Gate Capacitance Induces Inversion Channel",
        detail:
          "Raising V_GS above V_th repels p-body holes under the gate oxide and attracts minority electrons to form a continuous n-type inversion channel.",
        stateNote: "Gate oxide blocks DC gate current: input impedance is purely capacitive.",
      },
      {
        step: 2,
        title: "Complementary Pull-Up / Pull-Down Duality",
        detail:
          "Every static CMOS gate wires PMOS devices to VDD and NMOS devices to GND in dual series/parallel graphs so exactly one path conducts in steady state.",
        stateNote: "All static CMOS gates are naturally inverting (NOT, NAND, NOR).",
      },
      {
        step: 3,
        title: "Transient Crowbar & Capacitive Charging",
        detail:
          "During a finite input rise time, both transistors conduct briefly near VDD/2 while charging or discharging downstream gate capacitance C_L.",
        stateNote: "Fast input edges minimize short-circuit crowbar energy.",
      },
      {
        step: 4,
        title: "Regenerative Noise Margins",
        detail:
          "The inverter's high voltage gain (>10x) around the switching threshold snaps degraded inputs (e.g., 0.15 V or 0.85 V) back to full 0 V or VDD rails.",
        stateNote: "Prevents analog noise from accumulating across millions of cascaded gates.",
      },
    ],
    mathNotes: [
      {
        title: "NMOS Saturation Drain Current",
        latex: "I_{D,\\text{sat}} = \\frac{1}{2}\\mu_n C_{ox}\\frac{W}{L}(V_{GS}-V_{th})^2",
        explanation:
          "Shows why widening a transistor (W/L) increases drive current to charge load capacitances faster, at the cost of larger input gate capacitance.",
      },
      {
        title: "Subthreshold Leakage Scaling",
        latex: "I_{\\text{leak}} \\propto e^{(V_{GS}-V_{th})/(n V_T)}",
        explanation:
          "At room temperature, reducing V_th by ~80 mV increases off-state leakage current by roughly 10x.",
      },
      {
        title: "Total CMOS Power Equation",
        latex: "P_{\\text{total}} = \\alpha C_L V_{DD}^2 f + I_{\\text{sc}}V_{DD} + I_{\\text{leak}}V_{DD}",
        explanation:
          "Combines dynamic switching power, transient crowbar power, and static leakage.",
      },
    ],
    diagram: {
      title: "CMOS Inverter Pull-Up / Pull-Down Structure",
      caption:
        "A single input voltage V_in drives both an upper PMOS pull-up switch and a lower NMOS pull-down switch onto shared output node V_out.",
      nodes: [
        { id: "vdd", label: "Rail V_DD", sublabel: "Logic 1 (1.0 V)", x: 340, y: 45, tone: "accent" },
        { id: "vin", label: "Input V_in", sublabel: "Insulated Gates", x: 110, y: 140, tone: "neutral" },
        { id: "pmos", label: "PMOS Pull-Up", sublabel: "ON when V_in = 0", x: 340, y: 105, tone: "emerald" },
        { id: "nmos", label: "NMOS Pull-Down", sublabel: "ON when V_in = 1", x: 340, y: 190, tone: "amber" },
        { id: "vout", label: "Output V_out", sublabel: "Drives Load C_L", x: 560, y: 145, tone: "accent" },
        { id: "gnd", label: "Ground (GND)", sublabel: "Logic 0 (0.0 V)", x: 340, y: 248, tone: "neutral" },
      ],
      edges: [
        { from: "vdd", to: "pmos" },
        { from: "vin", to: "pmos", label: "Gate" },
        { from: "vin", to: "nmos", label: "Gate" },
        { from: "pmos", to: "vout", label: "Pull UP" },
        { from: "nmos", to: "vout", label: "Pull DN" },
        { from: "nmos", to: "gnd" },
      ],
    },
    codeExamples: [
      {
        title: "CMOS Inverter Power & Delay Trade-Off Explorer",
        language: "python",
        code: `def cmos_metrics(v_dd: float, v_th: float, c_load: float, freq: float, alpha: float = 0.2):
    # First-order gate delay ~ C * V / I_drive, with velocity-saturated I_drive ~ k*(V_dd - V_th)
    delay_rel = v_dd / (v_dd - v_th) ** 1.3
    p_dyn = alpha * c_load * (v_dd ** 2) * freq
    # Subthreshold leakage rises ~10x per 85 mV reduction in V_th
    i_leak_rel = 10 ** ((0.35 - v_th) / 0.085)
    print(f"V_DD={v_dd:.2f}V, V_th={v_th:.2f}V -> P_dyn={p_dyn*1e6:.2f} uW, RelDelay={delay_rel:.2f}, RelLeak={i_leak_rel:.2f}x")

cmos_metrics(1.2, 0.35, 10e-15, 3e9)
cmos_metrics(0.8, 0.35, 10e-15, 3e9)
cmos_metrics(0.8, 0.20, 10e-15, 3e9)`,
        explanation:
          "Illustrates the fundamental CMOS design triangle: lowering V_DD saves quadratic dynamic power but slows switching unless V_th also drops—which explodes leakage.",
        output: `V_DD=1.20V, V_th=0.35V -> P_dyn=8.64 uW, RelDelay=1.48, RelLeak=1.00x
V_DD=0.80V, V_th=0.35V -> P_dyn=3.84 uW, RelDelay=2.26, RelLeak=1.00x
V_DD=0.80V, V_th=0.20V -> P_dyn=3.84 uW, RelDelay=1.55, RelLeak=58.17x`,
      },
    ],
    connections: [
      {
        lessonSlug: "silicon-doping-pn-junction",
        relationship: "Uses doped n+/p+ source/drain wells isolated from the silicon substrate.",
      },
      {
        lessonSlug: "semiconductor-fabrication",
        relationship: "Explains how billions of these 3D FinFET/GAAFET structures are patterned onto wafers.",
      },
      {
        lessonSlug: "boolean-algebra-logic",
        relationship: "Abstracts CMOS voltage rails and pull-up/pull-down networks into formal Boolean gates.",
      },
    ],
    realWorldApplications: [
      {
        title: "End of Dennard Scaling & Multicore CPUs",
        simplifiedVsReal:
          "From 1974 to 2005, shrinking transistors allowed proportional V_DD reduction at constant power density; once V_th hit thermal leakage walls (~0.2–0.3 V), V_DD could no longer fall.",
        modernExample:
          "Instead of pushing single cores to 10 GHz (which would melt the silicon), modern CPUs integrate many cores, dark silicon power gating, and specialized accelerators.",
      },
      {
        title: "Why NAND Beats NOR in CMOS Silicon",
        simplifiedVsReal:
          "Logic diagrams treat NAND and NOR as symmetric; in real silicon, electrons have ~2–2.5x higher mobility than holes.",
        modernExample:
          "2-input CMOS NAND puts slower PMOS devices in parallel and faster NMOS devices in series, making NAND gates smaller and faster than NOR gates.",
      },
    ],
    misconceptions: [
      {
        myth: "CMOS transistors pass logic currents through the gate terminal to the output.",
        reality:
          "The MOSFET gate is insulated by silicon dioxide or hafnium dioxide; it acts purely via electric field capacitance and draws negligible DC current.",
      },
      {
        myth: "A non-inverting CMOS AND gate uses fewer transistors than a CMOS NAND gate.",
        reality:
          "CMOS networks naturally invert (NAND = 4 transistors, NOR = 4 transistors). Building a static CMOS AND requires a 4-transistor NAND followed by a 2-transistor inverter (6 transistors total).",
      },
    ],
    deepDive: {
      title: "Why You Cannot Build a Reliable Buffer from NMOS Pull-Up Alone",
      content:
        "Suppose you try passing a logic 1 (`VDD`) through an NMOS transistor whose gate is at `VDD`. As the source node rises toward `VDD - Vth`, `VGS = V_gate - V_source` shrinks until `VGS = Vth` and the NMOS cuts off! Thus NMOS passes a strong `0` (`0 V`) but a degraded `1` (`VDD - Vth`). Conversely, PMOS passes a strong `1` (`VDD`) but a degraded `0` (`|Vth,p|`). Pairing PMOS on top and NMOS on the bottom guarantees full rail-to-rail `0 V` and `VDD` outputs.",
    },
    revisionNotes: [
      "NMOS turns ON with high gate voltage (pulls output strongly to 0 V); PMOS turns ON with low gate voltage (pulls output strongly to VDD).",
      "Static CMOS gates pair dual PMOS pull-up and NMOS pull-down networks so zero steady-state DC path exists.",
      "Every static CMOS stage inverts: NAND and NOR take 4 transistors; AND and OR take 6.",
      "Subthreshold leakage scales exponentially when V_th shrinks, halting voltage scaling near ~0.7–1.0 V.",
    ],
    glossaryTermIds: ["mosfet", "threshold-voltage", "cmos", "capacitance"],
    references: [
      {
        title: "Digital Integrated Circuits: A Design Perspective (Chapter 3 & 5)",
        author: "Jan M. Rabaey et al.",
        url: "https://bwrcs.eecs.berkeley.edu/Classes/icbook/",
        type: "book",
        note: "Authoritative coverage of MOSFET I-V equations, CMOS VTC, and power/delay metrics.",
      },
      {
        title: "MIT OCW 6.004: Computation Structures (The Digital Abstraction)",
        author: "Chris Terman & Silvina Hanono Wachman",
        url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
        type: "course",
        note: "Explains noise margins, regenerative VTC curves, and CMOS switch networks.",
      },
    ],
    assessments: [
      {
        id: "t1-l5-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "How is a static 2-input CMOS NAND gate physically wired?",
        options: [
          {
            id: "a",
            text: "Two PMOS in parallel to VDD; two NMOS in series to GND",
            explanation:
              "Correct. Output pulls LOW only when BOTH inputs are 1 (both series NMOS ON); if either input is 0, at least one parallel PMOS pulls output HIGH.",
          },
          {
            id: "b",
            text: "Two PMOS in series to VDD; two NMOS in parallel to GND",
            explanation:
              "That topology pulls output LOW whenever EITHER input is 1—which implements a 2-input NOR gate.",
          },
          {
            id: "c",
            text: "Two NMOS in parallel to VDD; two PMOS in series to GND",
            explanation:
              "Putting NMOS on the pull-up side and PMOS on the pull-down side degrades both logic levels by V_th.",
          },
          {
            id: "d",
            text: "One NMOS and one resistor to VDD",
            explanation:
              "That is pseudo-NMOS / resistor-pull-up logic, which burns static DC current whenever the output is 0.",
          },
        ],
        correctAnswer: "a",
        hints: ["NAND outputs 0 ONLY when A=1 AND B=1."],
        explanation:
          "Series NMOS enforces AND in the pull-down path (output 0 iff A AND B), while parallel PMOS provides the dual OR pull-up path.",
        conceptTag: "cmos-gate-topology",
      },
      {
        id: "t1-l5-q2",
        type: "debugging",
        difficulty: "intermediate",
        prompt:
          "An engineer accidentally swaps a PMOS and NMOS transistor in an inverter, putting NMOS on top (connected to VDD) and PMOS on the bottom (connected to GND), with V_DD = 1.0 V and |V_th| = 0.3 V. What output voltages does this broken buffer produce for V_in = 1.0 V and V_in = 0.0 V?",
        options: [
          {
            id: "a",
            text: "A working non-inverting buffer with full 1.0 V and 0.0 V rails",
            explanation:
              "While it becomes non-inverting, NMOS cannot pull higher than VDD - V_th and PMOS cannot pull lower than |V_th|.",
          },
          {
            id: "b",
            text: "A degraded non-inverting buffer outputting ~0.7 V for HIGH and ~0.3 V for LOW",
            explanation:
              "Correct. Source-follower cut-off leaves the output stuck V_th away from both rails, shrinking noise margins.",
          },
          {
            id: "c",
            text: "A dead short between VDD and GND regardless of input",
            explanation:
              "Only one transistor is ON at 0 V or 1.0 V, so there is no steady-state short.",
          },
          {
            id: "d",
            text: "Output stays permanently at 0.5 V",
            explanation:
              "Each input voltage still turns on one device while turning off the other.",
          },
        ],
        correctAnswer: "b",
        hints: [
          "Recall that an NMOS turns off once its source rises to V_gate - V_th.",
        ],
        explanation:
          "NMOS passes weak 1s (max VDD - V_th = 0.7 V) and PMOS passes weak 0s (min |V_th| = 0.3 V). That is why CMOS always places PMOS on top and NMOS on the bottom.",
        conceptTag: "threshold-drop",
      },
      {
        id: "t1-l5-q3",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: In a static CMOS gate holding a steady logic output (0 or 1), the dominant source of power consumption is dynamic CV^2f charging current.",
        correctAnswer: false,
        hints: ["Dynamic power requires switching transitions (f > 0, alpha > 0)."],
        explanation:
          "False. When inputs are steady, no capacitances charge or discharge, so dynamic power is zero; only static leakage current (subthreshold + gate tunneling) flows.",
        conceptTag: "static-vs-dynamic-power",
      },
      {
        id: "t1-l5-q4",
        type: "fill-blank",
        difficulty: "intermediate",
        prompt:
          "In a standard static CMOS library, a 2-input AND gate requires _____ transistors (enter an integer).",
        correctAnswer: "6",
        acceptableAnswers: ["6", "six"],
        hints: ["Build a 2-input NAND gate followed by a CMOS inverter."],
        explanation:
          "Static CMOS gates invert naturally, so a 2-input AND is built from a 4-transistor NAND gate followed by a 2-transistor inverter (6 transistors total).",
        conceptTag: "transistor-count",
      },
    ],
  },

  // =========================================================================
  // LESSON 6: semiconductor-fabrication
  // =========================================================================
  {
    id: "semiconductor-fabrication",
    slug: "semiconductor-fabrication",
    number: 6,
    title: "Wafer Fabrication, Lithography & Yield",
    subtitle:
      "Czochralski monocrystalline ingots, EUV photolithography, 3D FinFET/GAAFET patterning, and defect economics",
    trackId: "track-1",
    domainId: "semiconductors",
    moduleTitle: "Module 2: Semiconductors & Transistor Switches",
    chapterTitle: "Chapter 2: From Silicon to CMOS",
    estimatedMinutes: 35,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["mosfets-and-cmos-logic"],
    simulatorId: "chiplet-yield-qubit",
    simulatorPrompt:
      "In the Lithography Yield, Chiplets & Qubit Error Lab, open Poisson Die Yield & Chiplets mode and compare an 800 mm^2 monolithic die against multi-tile chiplets as defect density D0 increases.",
    objectives: [
      "Trace the silicon manufacturing pipeline from Czochralski ingot growth to FEOL transistors and BEOL copper interconnect stacks.",
      "Apply Rayleigh's resolution equation (CD = k1 * lambda / NA) to explain the shift from 193 nm DUV to 13.5 nm EUV lithography.",
      "Contrast planar MOSFETs, 3D FinFETs, and Gate-All-Around (GAAFET) nanosheets in controlling short-channel leakage.",
      "Compute die yield from defect density and die area using Poisson/Murphy yield models to motivate chiplets.",
    ],
    depthExplanations: {
      beginner:
        "How do foundries cram 100 billion transistors onto a fingernail-sized chip? Rather than soldering parts one by one, fabs print all 100 billion transistors simultaneously onto dinner-plate-sized (300 mm) circles of ultra-pure crystalline silicon using light—a photographic stenciling process called photolithography.\n\nEach layer is coated in light-sensitive photoresist, exposed through a patterned quartz mask, etched with reactive plasma, doped with ion beams, and stacked under 10 to 18 crisscrossing layers of microscopic copper wiring. Because a single dust mote can ruin a chip, fab cleanrooms are thousands of times cleaner than hospital operating rooms, and faulty dies are binned or discarded.",
      intermediate:
        "Semiconductor manufacturing divides into Front-End-of-Line (FEOL), which builds transistors directly in the crystalline silicon surface, and Back-End-of-Line (BEOL), which deposits alternating dielectric insulators and copper/cobalt metal interconnect layers via dual-damascene plating.\n\nFeature resolution is physically bounded by optical diffraction: $\\text{CD} = k_1 \\frac{\\lambda}{\\text{NA}}$. After pushing $193\\text{ nm}$ ArF immersion lithography ($n_{\\text{water}}=1.44$) with complex multi-patterning, leading-edge fabs transitioned to $13.5\\text{ nm}$ Extreme Ultraviolet (EUV) lithography. Even tiny random defects (density $D_0$) devastate large dies exponentially: $Y \\approx e^{-D_0 A}$, making huge monolithic processors prohibitively expensive.",
      advanced:
        "As gate lengths scaled below $20\\text{ nm}$, planar gates lost electrostatic grip over the channel against Drain-Induced Barrier Lowering (DIBL). Intel/TSMC adopted 3D FinFETs (gate wrapping 3 sides of a vertical silicon fin) at 22/16 nm, and 2–3 nm nodes now move to Gate-All-Around (GAAFET) stacked horizontal nanosheets surrounded on all 4 sides by the high-k metal gate.\n\nBecause $13.5\\text{ nm}$ EUV photons are absorbed by virtually every material—including air and glass lenses—EUV scanners operate in vacuum using multi-layer Mo/Si Bragg reflective mirrors and stochastic-aware chemically amplified photoresists. Meanwhile, die yield follows Murphy's or negative-binomial clustering models ($Y = (1 + D_0 A / \\alpha)^{-\\alpha}$), directly explaining why AMD, Apple, and NVIDIA split massive SoCs into smaller chiplets.",
    },
    intuition:
      "Think of a modern CPU not as a flat circuit board, but as a 15-story microscopic skyscraper built top-to-bottom in reverse: first the tiny silicon switches are carved into the bedrock foundation (FEOL), and then progressively wider highway interchanges of metal wiring (BEOL) are built on top to connect neighborhoods across the city.",
    technicalTheory:
      "Optical lithography's minimum printable half-pitch (Critical Dimension, CD) obeys the Rayleigh criterion:\n\n$$\\text{CD} = k_1 \\frac{\\lambda}{\\text{NA}}$$\n\nwhere $\\lambda$ is illumination wavelength ($193\\text{ nm}$ DUV or $13.5\\text{ nm}$ EUV), $\\text{NA} = n\\sin\\theta$ is numerical aperture ($0.33$ for standard EUV, $0.55$ for High-NA EUV), and $k_1 \\ge 0.25$ is a process factor.\n\nOn a $300\\text{ mm}$ circular wafer ($R = 150\\text{ mm}$) containing rectangular dies of area $A = W \\times H$, geometric dies-per-wafer is approximated by:\n\n$$N_{\\text{die}} \\approx \\frac{\\pi R^2}{A} - \\frac{2\\pi R}{\\sqrt{2A}}$$\n\nUnder Poisson defect statistics with average defect density $D_0$ (defects/cm$^2$), functional die yield is:\n\n$$Y = e^{-D_0 A}$$",
    mechanisms: [
      {
        step: 1,
        title: "Ingot Pulling & Wafer Polishing",
        detail:
          "99.9999999% (9N) electronic-grade molten silicon is pulled via the Czochralski method into a single defect-free crystal ingot and sliced into 300 mm wafers.",
        stateNote: "Crystal orientation (<100>) optimizes carrier mobility and oxide quality.",
      },
      {
        step: 2,
        title: "FEOL Lithography, Etch & Ion Implantation",
        detail:
          "EUV/DUV light projects mask patterns onto photoresist; plasma etches fins/nanosheets, ion implanters shoot P/B dopants, and rapid thermal annealing heals lattice damage.",
        stateNote: "Creates billions of FinFET/GAAFET switches in the bottom ~100 nm.",
      },
      {
        step: 3,
        title: "BEOL Dual-Damascene Interconnects",
        detail:
          "Low-k dielectric layers are etched with trenches and vias, electroplated with copper (or cobalt/ruthenium at M0/M1), and planarized via CMP.",
        stateNote: "Lower metal layers are ultra-dense for local gates; top layers are thick for clock & power.",
      },
      {
        step: 4,
        title: "Wafer Probe, Binning & Packaging",
        detail:
          "Automated probe cards test every die; partially defective chips have faulty cores fused off ('binning'), then good dies are diced and packaged.",
        stateNote: "Binning turns imperfect silicon yield into tiered product SKUs.",
      },
    ],
    mathNotes: [
      {
        title: "Rayleigh Lithography Limit",
        latex: "\\text{CD} = k_1 \\frac{\\lambda}{\\text{NA}}",
        explanation:
          "Decreasing wavelength lambda (193 nm -> 13.5 nm) or increasing numerical aperture NA (0.33 -> 0.55) shrinks printable feature size.",
      },
      {
        title: "Poisson Die Yield",
        latex: "Y = e^{-D_0 A}",
        explanation:
          "A 600 mm^2 monolithic GPU at D_0 = 0.10 defects/cm^2 yields e^-0.6 ≈ 54.9%, whereas a 150 mm^2 chiplet yields e^-0.15 ≈ 86.1%.",
      },
    ],
    diagram: {
      title: "Semiconductor Wafer Fabrication & Yield Pipeline",
      caption:
        "From ultra-pure monocrystalline ingots through iterative FEOL/BEOL patterning to wafer probe and chiplet packaging.",
      nodes: [
        { id: "cz", label: "Czochralski Ingot", sublabel: "9N Si -> 300mm wafer", x: 75, y: 140, tone: "neutral" },
        { id: "litho", label: "DUV/EUV Litho", sublabel: "CD = k1 * lambda/NA", x: 220, y: 80, tone: "accent" },
        { id: "feol", label: "FEOL Transistors", sublabel: "Etch + Implant + Gate", x: 375, y: 80, tone: "emerald" },
        { id: "beol", label: "BEOL Metal Stack", sublabel: "12–18 Cu/Co layers", x: 375, y: 205, tone: "amber" },
        { id: "test", label: "Test, Bin & Pack", sublabel: "Yield = exp(-D0*A)", x: 565, y: 140, tone: "accent" },
      ],
      edges: [
        { from: "cz", to: "litho", label: "coat resist" },
        { from: "litho", to: "feol", label: "pattern" },
        { from: "feol", to: "beol", label: "contacts" },
        { from: "beol", to: "litho", label: "repeat x100" },
        { from: "beol", to: "test", label: "probe" },
      ],
    },
    codeExamples: [
      {
        title: "Monolithic Die vs. Chiplet Wafer Economics Simulator",
        language: "python",
        code: `import math

def wafer_economics(wafer_diam_mm: float, die_area_mm2: float, d0_per_cm2: float):
    r = wafer_diam_mm / 2.0
    gross_dies = int((math.pi * r**2) / die_area_mm2 - (2 * math.pi * r) / math.sqrt(2 * die_area_mm2))
    area_cm2 = die_area_mm2 / 100.0
    yield_frac = math.exp(-d0_per_cm2 * area_cm2)
    good_dies = gross_dies * yield_frac
    print(f"Die {die_area_mm2:4.0f} mm^2 -> Gross: {gross_dies:3d}, Yield: {yield_frac*100:5.1f}%, Good/wafer: {good_dies:5.1f}")

wafer_economics(300, 800, 0.12)   # Giant reticle-limit monolithic die
wafer_economics(300, 100, 0.12)   # 8x smaller chiplet`,
        explanation:
          "Shows why splitting an 800 mm^2 monolithic processor into 100 mm^2 chiplets dramatically raises usable silicon yield per 300 mm wafer.",
        output: `Die  800 mm^2 -> Gross:  64, Yield:  38.3%, Good/wafer:  24.5
Die  100 mm^2 -> Gross: 640, Yield:  88.7%, Good/wafer: 567.6`,
      },
    ],
    connections: [
      {
        lessonSlug: "mosfets-and-cmos-logic",
        relationship: "Turns schematic CMOS transistors into physical 3D FinFET/GAAFET structures.",
      },
      {
        lessonSlug: "frontiers-euv-chiplets-tpu-quantum",
        relationship: "Leads directly to High-NA EUV, UCIe chiplets, and atomic-scale fabrication limits.",
      },
    ],
    realWorldApplications: [
      {
        title: "Node Names Are Marketing Labels, Not Physical Gate Lengths",
        simplifiedVsReal:
          "Historically '28 nm' meant physical gate length; today '3 nm' or '2 nm' denotes an equivalent generation metric, while actual gate lengths sit around 12–16 nm.",
        modernExample:
          "A '3 nm' smartphone SoC relies on FinFET or GAAFET density, metal pitch (~21–24 nm), and EUV multi-patterning rather than a literal 3 nm transistor.",
      },
      {
        title: "Product Binning Across CPU & GPU Lineups",
        simplifiedVsReal:
          "A defective core does not always send a chip to the trash.",
        modernExample:
          "Mid-range 6-core CPUs and RTX x070 GPUs are frequently the exact same silicon die as flagship parts, with defect-hit cores or L3 slices permanently disabled via e-fuses.",
      },
    ],
    misconceptions: [
      {
        myth: "Foundries build chips one transistor at a time like a 3D printer.",
        reality:
          "Photolithography patterns all ~100 billion transistors in a layer simultaneously in milliseconds per die exposure step.",
      },
      {
        myth: "Chiplet designs are used purely to mix different CPU/GPU architectures.",
        reality:
          "The overriding driver is exponential defect yield economics (exp(-D0*A)) plus hitting the ~858 mm^2 optical reticle field limit.",
      },
    ],
    revisionNotes: [
      "Rayleigh limit CD = k1 * lambda / NA drove the move from 193 nm DUV to 13.5 nm EUV.",
      "FEOL fabricates transistors in the Si wafer; BEOL builds 10–18 layers of metal wiring overhead.",
      "Planar -> FinFET -> GAAFET nanosheets progressively wrap the gate around the channel to stop DIBL leakage.",
      "Poisson yield Y = exp(-D0 * A) makes large monolithic dies vastly costlier than chiplets.",
    ],
    glossaryTermIds: ["photolithography", "die-yield", "mosfet", "doping"],
    references: [
      {
        title: "Lithography Principles & EUV Technology",
        author: "ASML",
        url: "https://www.asml.com/en/technology/lithography-principles",
        type: "docs",
        note: "Technical overview of Rayleigh's equation, immersion DUV, and 13.5 nm EUV mirror optics.",
      },
      {
        title: "MIT OCW 6.152J: Micro/Nano Processing Technology",
        author: "Martin Schmidt & Vladimir Bulovic",
        url: "https://ocw.mit.edu/courses/6-152j-micro-nano-processing-technology-fall-2005/",
        type: "course",
        note: "Covers Czochralski wafers, oxidation, photolithography, plasma etching, and ion implantation.",
      },
    ],
    assessments: [
      {
        id: "t1-l6-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "According to Rayleigh's lithography equation CD = k1 * lambda / NA, why did leading-edge foundries transition from 193 nm DUV to 13.5 nm EUV scanners?",
        options: [
          {
            id: "a",
            text: "13.5 nm light passes effortlessly through standard glass lenses and air",
            explanation:
              "False—13.5 nm EUV is absorbed by air and glass, forcing expensive vacuum chambers and Bragg mirrors.",
          },
          {
            id: "b",
            text: "The ~14x shorter wavelength directly shrinks the minimum printable feature size CD without extreme multi-patterning",
            explanation:
              "Correct. Reducing lambda from 193 nm to 13.5 nm dramatically reduces diffraction blurring.",
          },
          {
            id: "c",
            text: "EUV eliminates the need for photoresist and etching",
            explanation:
              "EUV still exposes photoresist followed by plasma etching—just at finer pitch.",
          },
          {
            id: "d",
            text: "EUV allows copper wires to be printed directly without electroplating",
            explanation:
              "EUV patterns masks in resist; BEOL copper is still deposited by electroplating and CMP.",
          },
        ],
        correctAnswer: "b",
        hints: ["Look at lambda in the numerator of CD = k1 * lambda / NA."],
        explanation:
          "Shorter wavelength lambda directly reduces diffraction-limited minimum feature size, replacing complex 4x–8x DUV multi-patterning masks.",
        conceptTag: "rayleigh-lithography",
      },
      {
        id: "t1-l6-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "Using the Poisson yield model Y = exp(-D0 * A), what is the percentage yield (0–100) of a 2.0 cm^2 (200 mm^2) die on a wafer with defect density D0 = 0.25 defects/cm^2? (Round to 1 decimal place.)",
        latex: "Y = e^{-0.25 \\times 2.0} = e^{-0.50}",
        correctAnswer: 60.7,
        numericTolerance: 0.5,
        hints: ["Compute e^-0.5 ≈ 0.6065, then multiply by 100 for percentage."],
        explanation:
          "Y = exp(-0.5) ≈ 0.6065, which corresponds to 60.7% functional dies.",
        conceptTag: "poisson-yield",
      },
      {
        id: "t1-l6-q3",
        type: "ordering",
        difficulty: "intermediate",
        prompt:
          "Place the transistor geometries in chronological order of increasing electrostatic gate control over the channel:",
        orderingItems: [
          "Planar MOSFET (gate sits only on top of the channel)",
          "3D FinFET (gate wraps 3 sides of a vertical silicon fin)",
          "GAAFET Nanosheet (gate completely surrounds stacked horizontal channels on all 4 sides)",
        ],
        correctAnswer: [
          "Planar MOSFET (gate sits only on top of the channel)",
          "3D FinFET (gate wraps 3 sides of a vertical silicon fin)",
          "GAAFET Nanosheet (gate completely surrounds stacked horizontal channels on all 4 sides)",
        ],
        hints: ["Count how many sides of the silicon channel the gate touches: 1 -> 3 -> 4."],
        explanation:
          "Moving from 1-sided planar gates to 3-sided FinFETs and 4-sided GAAFET nanosheets suppresses short-channel leakage as gate length shrinks.",
        conceptTag: "transistor-evolution",
      },
      {
        id: "t1-l6-q4",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: Back-End-of-Line (BEOL) processing creates the transistors inside the silicon crystal, while Front-End-of-Line (FEOL) deposits the upper copper wiring stack.",
        correctAnswer: false,
        hints: ["Think of building from the ground up: transistors come first (front-end), wiring comes second (back-end)."],
        explanation:
          "False—it is the opposite. FEOL fabricates the transistors in the silicon wafer first, and BEOL builds the multi-layer metal interconnect stack on top.",
        conceptTag: "feol-vs-beol",
      },
    ],
  },

  // =========================================================================
  // LESSON 7: boolean-algebra-logic
  // =========================================================================
  {
    id: "boolean-algebra-logic",
    slug: "boolean-algebra-logic",
    number: 7,
    title: "Boolean Algebra, Truth Tables & De Morgan's Laws",
    subtitle:
      "Formalizing CMOS switches into algebraic axioms, canonical SOP/POS forms, and universal NAND synthesis",
    trackId: "track-1",
    domainId: "math-foundations",
    moduleTitle: "Module 3: Digital Logic & Sequential Circuits",
    chapterTitle: "Chapter 3: Logic Gates & State",
    estimatedMinutes: 35,
    difficulty: "beginner",
    status: "complete",
    prerequisites: ["mosfets-and-cmos-logic"],
    simulatorId: "logic-gates",
    simulatorPrompt:
      "In the Digital Logic & Flip-Flop Bench, build XOR using only universal NAND gates and verify every row of its truth table by toggling inputs A and B.",
    objectives: [
      "Translate truth tables into canonical Sum-of-Products (minterms) and Product-of-Sums (maxterms) expressions.",
      "Simplify multi-variable Boolean expressions using distributive, absorption, and consensus identities.",
      "Apply De Morgan's Laws to convert AND/OR logic into CMOS-friendly NAND/NOR gate networks.",
      "Prove functional completeness of NAND and NOR gates by constructing NOT, AND, OR, and XOR from NAND alone.",
    ],
    depthExplanations: {
      beginner:
        "Once CMOS transistors give us reliable voltage switches for 0 and 1, we no longer need calculus or differential equations to design computer circuits. Instead, we step up into Boolean algebra—an algebra invented by George Boole in 1854 and connected to switching circuits by Claude Shannon in 1937.\n\nIn Boolean algebra, every wire carries either 0 (False) or 1 (True), and three basic operations—NOT, AND, and OR—let us express any possible decision rule. By writing down a truth table of desired outputs and applying algebraic simplification rules like De Morgan's Laws, engineers shrink sprawling expressions into the fewest, fastest silicon gates.",
      intermediate:
        "Any $n$-variable Boolean function $f: \\{0,1\\}^n \\to \\{0,1\\}$ is uniquely specified by its $2^n$-row truth table and can be written mechanically in canonical Sum-of-Products (SOP) form by ORing the minterms where $f = 1$. Algebraic laws—especially $X(Y+Z)=XY+XZ$, $X + \\overline{X}Y = X + Y$, and $X + XY = X$—eliminate redundant literals and gates.\n\nDe Morgan's Laws ($\\overline{A\\cdot B} = \\overline{A} + \\overline{B}$ and $\\overline{A+B} = \\overline{A}\\cdot\\overline{B}$) bridge abstract algebra directly to CMOS silicon: because static CMOS gates naturally invert, converting SOP AND-OR trees into two-level NAND-NAND trees preserves logic while cutting transistor counts and propagation delay.",
      advanced:
        "A gate set is functionally complete if it can express all $2^{2^n}$ Boolean functions of $n$ variables. By Post's functional completeness theorem, a set of gates is complete iff it is not wholly contained inside any of the five maximal clones (truth-preserving, falsity-preserving, monotonic, self-dual, or affine). Both $\\{\\text{NAND}\\}$ and $\\{\\text{NOR}\\}$ violate all five, making each a single-gate universal basis.\n\nIn EDA logic synthesis (such as ABC / Yosys), multi-level Boolean networks are represented as And-Inverter Graphs (AIGs)—directed acyclic graphs of 2-input AND nodes and inverter edges—which are optimized via structural hashing, Karnaugh/Quine-McCluskey minimization, and technology mapping onto standard cell libraries.",
    },
    intuition:
      "De Morgan's Law is like saying 'It is NOT true that both the lock is engaged AND the alarm is armed' means the exact same thing as 'Either the lock is NOT engaged OR the alarm is NOT armed.' Flipping AND to OR while pushing the NOT bubble inward never changes the truth—and in silicon, it turns awkward gates into fast NANDs.",
    technicalTheory:
      "Boolean algebra $(B, +, \\cdot, \\overline{\\phantom{x}}, 0, 1)$ satisfies commutativity, associativity, distributivity of both $+$ over $\\cdot$ and $\\cdot$ over $+$, identity ($X+0=X$, $X\\cdot 1=X$), and complement ($X+\\overline{X}=1$, $X\\cdot\\overline{X}=0$).\n\nDe Morgan's dualities state:\n\n$$\\overline{A \\cdot B} = \\overline{A} + \\overline{B}, \\qquad \\overline{A + B} = \\overline{A} \\cdot \\overline{B}$$\n\nExclusive-OR (XOR) plays a central role in binary addition and parity:\n\n$$A \\oplus B = A\\overline{B} + \\overline{A}B = (A + B)\\overline{(A \\cdot B)}$$\n\nEvery Boolean operator can be built from NAND ($A \\uparrow B = \\overline{A \\cdot B}$) alone: $\\overline{A} = A \\uparrow A$, $A \\cdot B = (A \\uparrow B) \\uparrow (A \\uparrow B)$, and $A + B = (A \\uparrow A) \\uparrow (B \\uparrow B)$.",
    mechanisms: [
      {
        step: 1,
        title: "Specify Behavior via Truth Table",
        detail:
          "Enumerate all 2^n input combinations and assign the desired output bit (0 or 1, or X 'don't care') to each row.",
        stateNote: "Guarantees complete, unambiguous specification.",
      },
      {
        step: 2,
        title: "Extract Canonical Sum-of-Products (SOP)",
        detail:
          "Form one AND product term (minterm) for every row whose output is 1, then OR those minterms together.",
        stateNote: "Two-level logic: NOT -> AND -> OR.",
      },
      {
        step: 3,
        title: "Minimize Using Boolean Identities or K-Maps",
        detail:
          "Group adjacent minterms differing in one variable (XY + X~Y = X) to remove unnecessary literals and reduce gate fan-in.",
        stateNote: "Fewer literals mean fewer transistors and smaller parasitic capacitance.",
      },
      {
        step: 4,
        title: "Push Bubbles to Universal NAND/NOR Form",
        detail:
          "Apply double negation and De Morgan's Laws so AND-OR trees transform into inverting CMOS NAND-NAND networks.",
        stateNote: "4 NAND gates implement XOR without needing any other gate type.",
      },
    ],
    mathNotes: [
      {
        title: "Distributivity of OR over AND (Unique to Boolean Algebra)",
        latex: "A + (B \\cdot C) = (A + B) \\cdot (A + C)",
        explanation:
          "Unlike ordinary arithmetic over real numbers, OR distributes over AND just as AND distributes over OR.",
      },
      {
        title: "De Morgan's Bubble-Pushing Rules",
        latex: "\\overline{A \\cdot B} = \\overline{A} + \\overline{B}, \\qquad \\overline{A + B} = \\overline{A} \\cdot \\overline{B}",
        explanation:
          "Inverting the output of an AND gate is logically identical to inverting both inputs of an OR gate.",
      },
      {
        title: "4-NAND Realization of XOR",
        latex: "A \\oplus B = \\big(A \\uparrow (A \\uparrow B)\\big) \\uparrow \\big(B \\uparrow (A \\uparrow B)\\big)",
        explanation:
          "Only 4 two-input NAND gates (16 transistors in static CMOS) suffice to compute exact XOR.",
      },
    ],
    diagram: {
      title: "Building XOR Using Only Four Universal NAND Gates",
      caption:
        "A 4-NAND DAG computes A XOR B with a critical path of 3 gate delays.",
      nodes: [
        { id: "inA", label: "Input A", sublabel: "0 or 1", x: 75, y: 80, tone: "neutral" },
        { id: "inB", label: "Input B", sublabel: "0 or 1", x: 75, y: 200, tone: "neutral" },
        { id: "n1", label: "NAND 1", sublabel: "t1 = ~(A & B)", x: 225, y: 140, tone: "accent" },
        { id: "n2", label: "NAND 2", sublabel: "t2 = ~(A & t1)", x: 390, y: 75, tone: "emerald" },
        { id: "n3", label: "NAND 3", sublabel: "t3 = ~(t1 & B)", x: 390, y: 205, tone: "emerald" },
        { id: "n4", label: "NAND 4", sublabel: "~(t2 & t3) = A ^ B", x: 575, y: 140, tone: "amber" },
      ],
      edges: [
        { from: "inA", to: "n1" },
        { from: "inB", to: "n1" },
        { from: "inA", to: "n2" },
        { from: "n1", to: "n2" },
        { from: "n1", to: "n3" },
        { from: "inB", to: "n3" },
        { from: "n2", to: "n4" },
        { from: "n3", to: "n4" },
      ],
    },
    codeExamples: [
      {
        title: "Verify 4-NAND XOR & De Morgan Equivalence Exhaustively",
        language: "python",
        code: `def nand(a: int, b: int) -> int:
    return int(not (a and b))

def xor_from_nand(a: int, b: int) -> int:
    t1 = nand(a, b)
    t2 = nand(a, t1)
    t3 = nand(b, t1)
    return nand(t2, t3)

print("A B | A^B | 4-NAND | DeMorgan ~(A|B)==(~A&~B)")
for a in (0, 1):
    for b in (0, 1):
        dm_lhs = int(not (a or b))
        dm_rhs = int((not a) and (not b))
        print(f"{a} {b} |  {a ^ b}  |   {xor_from_nand(a, b)}    | {dm_lhs} == {dm_rhs}")`,
        explanation:
          "Exhaustively tests all 4 input combinations to prove that the 4-NAND network matches built-in XOR and verifies De Morgan's second law.",
        output: `A B | A^B | 4-NAND | DeMorgan ~(A|B)==(~A&~B)
0 0 |  0  |   0    | 1 == 1
0 1 |  1  |   1    | 0 == 0
1 0 |  1  |   1    | 0 == 0
1 1 |  0  |   0    | 0 == 0`,
      },
    ],
    connections: [
      {
        lessonSlug: "mosfets-and-cmos-logic",
        relationship: "Abstracts PMOS/NMOS switch networks into formal Boolean operators.",
      },
      {
        lessonSlug: "combinational-circuits-adders",
        relationship: "Composes Boolean gates into multiplexers, decoders, and multi-bit binary adders.",
      },
    ],
    realWorldApplications: [
      {
        title: "RTL Synthesis & Standard-Cell Technology Mapping",
        simplifiedVsReal:
          "Hardware engineers write readable Boolean expressions like `(a & b) | c`; synthesis tools never map them 1-to-1 to raw AND/OR gates.",
        modernExample:
          "EDA tools (Synopsys Design Compiler, Yosys) convert RTL into And-Inverter Graphs, minimize terms, and map onto multi-input CMOS AOI21/OAI21/NAND standard cells.",
      },
      {
        title: "Bitwise Masking & Branchless Code in C/Rust",
        simplifiedVsReal:
          "Boolean algebra applies identically to 64-bit CPU registers via bitwise `&`, `|`, `^`, and `~`.",
        modernExample:
          "De Morgan's identities and XOR swap/parity tricks appear inside high-speed parsers, Bloom filters, and SIMD kernels.",
      },
    ],
    misconceptions: [
      {
        myth: "NOT(A AND B) is equal to (NOT A) AND (NOT B).",
        reality:
          "Negating an AND flips it to an OR: NOT(A AND B) = (NOT A) OR (NOT B). For example, when A=1 and B=0, NOT(1 & 0) = 1, whereas (~1 & ~0) = 0.",
      },
      {
        myth: "Real CPUs are wired predominantly from discrete AND, OR, and NOT gates.",
        reality:
          "Because CMOS naturally inverts, static CMOS standard-cell libraries rely heavily on NAND, NOR, and compound AOI (AND-OR-INVERT) cells.",
      },
    ],
    revisionNotes: [
      "Any truth table can be written canonically as Sum-of-Products (SOP) or Product-of-Sums (POS).",
      "De Morgan's Laws: ~(A & B) = ~A | ~B and ~(A | B) = ~A & ~B.",
      "NAND alone (and NOR alone) is functionally complete—every digital logic circuit can be built from NAND gates.",
      "Absorption (A + A&B = A) and complementation (A&B + A&~B = A) eliminate redundant gates.",
    ],
    glossaryTermIds: ["boolean-algebra", "de-morgans-laws", "cmos"],
    references: [
      {
        title: "From Nand to Tetris: Building a Modern Computer from First Principles",
        author: "Noam Nisan & Shimon Schocken",
        url: "https://www.nand2tetris.org/",
        type: "course",
        note: "Project 1 constructs NOT, AND, OR, XOR, Mux, and Demux purely from NAND gates.",
      },
      {
        title: "MIT OCW 6.004: Computation Structures (Synthesis of Combinational Logic)",
        author: "Chris Terman & Silvina Hanono Wachman",
        url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
        type: "course",
        note: "Covers Boolean identities, SOP synthesis, K-maps, and universal gate sets.",
      },
    ],
    assessments: [
      {
        id: "t1-l7-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "Which expression is logically equivalent to NOT( (A AND B) OR C ) by De Morgan's Laws?",
        options: [
          {
            id: "a",
            text: "(NOT A OR NOT B) AND NOT C",
            explanation:
              "Correct. Pushing the outer NOT inward turns OR into AND: NOT(A AND B) AND NOT C, and pushing NOT into (A AND B) gives (NOT A OR NOT B).",
          },
          {
            id: "b",
            text: "(NOT A AND NOT B) OR NOT C",
            explanation: "Both the inner AND and outer OR must flip operators when negated.",
          },
          {
            id: "c",
            text: "(NOT A AND NOT B) AND NOT C",
            explanation:
              "NOT(A AND B) becomes (NOT A OR NOT B), not (NOT A AND NOT B).",
          },
          {
            id: "d",
            text: "(A OR B) AND NOT C",
            explanation: "A and B must also be inverted when breaking the inner AND.",
          },
        ],
        correctAnswer: "a",
        hints: ["Apply De Morgan's Law first to the outer OR, then to the inner AND."],
        explanation:
          "~((A & B) | C) = ~(A & B) & ~C = (~A | ~B) & ~C.",
        conceptTag: "de-morgans-laws",
      },
      {
        id: "t1-l7-q2",
        type: "predict-output",
        difficulty: "intermediate",
        prompt:
          "Simplify the Boolean expression F = A*B + A*(~B) + (~A)*B completely. Which expression matches F for all inputs A, B?",
        options: [
          {
            id: "a",
            text: "A AND B",
            explanation: "When A=1, B=0, F = 0 + 1 + 0 = 1, whereas A AND B = 0.",
          },
          {
            id: "b",
            text: "A XOR B",
            explanation: "When A=1, B=1, F = 1 + 0 + 0 = 1, whereas A XOR B = 0.",
          },
          {
            id: "c",
            text: "A OR B",
            explanation:
              "Correct. First A*B + A*(~B) = A*(B + ~B) = A. Then A + (~A)*B = A + B.",
          },
          {
            id: "d",
            text: "1 (always True)",
            explanation: "When A=0, B=0, F = 0 + 0 + 0 = 0.",
          },
        ],
        correctAnswer: "c",
        hints: ["Factor A out of the first two terms, then apply X + (~X)Y = X + Y."],
        explanation:
          "The three minterms (11, 10, 01) cover every row except (00), which is exactly the truth table of A OR B.",
        conceptTag: "boolean-minimization",
      },
      {
        id: "t1-l7-q3",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: The 2-input NOR gate alone is functionally complete—every Boolean function can be constructed using only NOR gates.",
        correctAnswer: true,
        hints: ["Check if you can build NOT from NOR(A, A), and then OR and AND via De Morgan."],
        explanation:
          "True. NOR(A, A) = ~A; NOR(~A, ~A) = A; ~NOR(A, B) = A | B; and NOR(~A, ~B) = A & B.",
        conceptTag: "functional-completeness",
      },
      {
        id: "t1-l7-q4",
        type: "fill-blank",
        difficulty: "intermediate",
        prompt:
          "For a Boolean function of n = 4 input variables, there are _____ distinct rows in its truth table (enter an integer).",
        correctAnswer: "16",
        acceptableAnswers: ["16", "sixteen"],
        hints: ["Compute 2^n."],
        explanation:
          "Each of the 4 binary variables takes 2 values, giving 2^4 = 16 input combinations.",
        conceptTag: "truth-tables",
      },
    ],
  },

  // =========================================================================
  // LESSON 8: combinational-circuits-adders
  // =========================================================================
  {
    id: "combinational-circuits-adders",
    slug: "combinational-circuits-adders",
    number: 8,
    title: "Combinational Circuits: Muxes, Decoders & Adders",
    subtitle:
      "Building data selectors, address decoders, ripple-carry adders, and logarithmic carry-lookahead arithmetic",
    trackId: "track-1",
    domainId: "digital-electronics",
    moduleTitle: "Module 3: Digital Logic & Sequential Circuits",
    chapterTitle: "Chapter 3: Logic Gates & State",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["boolean-algebra-logic"],
    simulatorId: "logic-gates",
    simulatorPrompt:
      "In the Digital Logic & Flip-Flop Bench, switch to the 4-bit ripple adder mode and add 0b0111 (7) + 0b0001 (1). Watch the carry bit ripple across every full-adder stage from bit 0 to bit 3.",
    objectives: [
      "Design multiplexers (Mux), demultiplexers (Demux), and N-to-2^N decoders from basic logic gates.",
      "Construct a Half Adder and Full Adder, and chain N Full Adders into a ripple-carry adder.",
      "Analyze worst-case propagation delay along a combinational critical path and spot combinational glitches.",
      "Explain how Carry-Lookahead (Generate/Propagate) reduces N-bit addition latency from O(N) to O(log N).",
    ],
    depthExplanations: {
      beginner:
        "Individual logic gates are like individual bricks; combinational building blocks are the rooms of a processor. A Multiplexer (Mux) acts like a railroad track switch—using a selector bit $S$ to choose which input wire gets routed to the output. A Decoder does the reverse routing job for memory addresses, turning a 3-bit binary code into 1 active wire out of 8.\n\nMost importantly, combining XOR and AND gates creates a Half Adder and Full Adder, which add two binary bits plus an incoming carry bit. Stringing 64 Full Adders side-by-side creates a 64-bit adder—the mathematical heart of every CPU.",
      intermediate:
        "A 2:1 multiplexer computes $Y = \\overline{S}D_0 + S D_1$, and any $n$-variable Boolean function can be implemented directly as a $2^n:1$ lookup table (which is literally how FPGA LUTs work!). An $n$-to-$2^n$ decoder activates exactly one minterm output line $Y_k = 1$ when its $n$-bit input equals $k$.\n\nA Full Adder accepts $A, B, C_{\\text{in}}$ and outputs $S = A \\oplus B \\oplus C_{\\text{in}}$ and $C_{\\text{out}} = AB + C_{\\text{in}}(A \\oplus B)$. In an $N$-bit ripple-carry adder, $C_{\\text{out}}$ of bit $i$ feeds $C_{\\text{in}}$ of bit $i+1$, so worst-case addition (e.g., `0xFFFF + 0x0001`) forces the carry to ripple through all $N$ stages—taking $O(N)$ gate delays.",
      advanced:
        "At $64$ bits and $5\\text{ GHz}$ ($200\\text{ ps}$ clock period), a linear $O(N)$ ripple-carry adder is far too slow. Carry-Lookahead Adders (CLA) and parallel-prefix adders (Kogge-Stone, Brent-Kung) compute carries in parallel using bit-level Generate ($G_i = A_i B_i$) and Propagate ($P_i = A_i \\oplus B_i$ or $A_i + B_i$) signals.\n\nBecause the carry recurrence $C_{i+1} = G_i + P_i C_i$ is associative under the prefix operator $(G, P) \\circ (G', P') = (G + P G', P P')$, a balanced binary tree computes all 64 carries simultaneously in $\\log_2(64) = 6$ prefix levels ($O(\\log N)$ delay), trading extra silicon area and wiring energy for GHz arithmetic speed.",
    },
    intuition:
      "A ripple-carry adder is like a line of dominoes: adding `9999 + 1` in decimal forces the carry from the ones digit to knock over the tens, then hundreds, then thousands one by one. A carry-lookahead adder inspects all digits in advance ('Which columns are 9s that will propagate a carry?') and flips all carries simultaneously.",
    technicalTheory:
      "For a 2:1 multiplexer with select $S$ and data inputs $D_0, D_1$:\n\n$$Y = \\overline{S}\\cdot D_0 + S\\cdot D_1$$\n\nFor a 1-bit Full Adder with operand bits $A_i, B_i$ and carry-in $C_i$:\n\n$$S_i = A_i \\oplus B_i \\oplus C_i, \\qquad C_{i+1} = (A_i \\cdot B_i) + C_i\\cdot(A_i \\oplus B_i)$$\n\nDefining Generate $G_i = A_i B_i$ (creates a carry unconditionally) and Propagate $P_i = A_i \\oplus B_i$ (passes $C_i$ forward), the carry recurrence becomes:\n\n$$C_{i+1} = G_i + P_i C_i$$\n\nExpanding four bits gives $C_4 = G_3 + P_3 G_2 + P_3 P_2 G_1 + P_3 P_2 P_1 G_0 + P_3 P_2 P_1 P_0 C_0$, allowing a 4-bit block carry in constant 2-level SOP delay instead of 4 ripple stages.",
    mechanisms: [
      {
        step: 1,
        title: "Multiplexer Selection & FPGA Lookup",
        detail:
          "A decoder activates one AND gate per select code, passing the chosen data input D_k through a shared OR tree to output Y.",
        stateNote: "Critical path depends only on select/data fan-in, not sequential state.",
      },
      {
        step: 2,
        title: "Bitwise Generate & Propagate Computation",
        detail:
          "Each bit slice i simultaneously computes P_i = A_i ^ B_i (partial sum) and G_i = A_i & B_i (local carry generation) in 1 gate delay.",
        stateNote: "All N bit slices run in parallel before any carry arrives.",
      },
      {
        step: 3,
        title: "Carry Chain or Parallel-Prefix Tree",
        detail:
          "In a ripple adder, C_i walks sequentially from bit 0 to bit N-1; in a carry-lookahead/prefix tree, group (G, P) pairs merge in log2(N) levels.",
        stateNote: "Worst-case ripple happens when P_i = 1 across all bits (e.g., 1111 + 0001).",
      },
      {
        step: 4,
        title: "Final Sum & Flag Resolution",
        detail:
          "Once C_i settles at bit i, S_i = P_i ^ C_i completes the sum bit, while final C_N and C_{N-1} determine carry and overflow flags.",
        stateNote: "Output glitches can occur momentarily before the slowest carry arrives.",
      },
    ],
    mathNotes: [
      {
        title: "Full Adder Equations",
        latex: "S_i = P_i \\oplus C_i, \\quad C_{i+1} = G_i + P_i C_i \\quad (P_i = A_i \\oplus B_i,\\; G_i = A_i B_i)",
        explanation:
          "Separating local P_i and G_i makes both ripple and lookahead carry logic transparent.",
      },
      {
        title: "Ripple-Carry vs. Prefix Adder Delay",
        latex: "t_{\\text{RCA}} = O(N), \\qquad t_{\\text{Prefix}} = O(\\log_2 N)",
        explanation:
          "For 64-bit operands, 64 ripple stages shrink to 6 parallel-prefix levels (~10x speedup).",
      },
    ],
    diagram: {
      title: "4-Bit Ripple-Carry Adder Critical Path",
      caption:
        "Carry signals chain sequentially from FA0 to FA3, creating an O(N) critical path whenever every stage propagates.",
      nodes: [
        { id: "fa0", label: "Full Adder 0", sublabel: "A0, B0, Cin -> S0", x: 100, y: 140, tone: "accent" },
        { id: "fa1", label: "Full Adder 1", sublabel: "A1, B1 -> S1", x: 260, y: 140, tone: "emerald" },
        { id: "fa2", label: "Full Adder 2", sublabel: "A2, B2 -> S2", x: 420, y: 140, tone: "emerald" },
        { id: "fa3", label: "Full Adder 3", sublabel: "A3, B3 -> S3, Cout", x: 580, y: 140, tone: "amber" },
      ],
      edges: [
        { from: "fa0", to: "fa1", label: "C1" },
        { from: "fa1", to: "fa2", label: "C2" },
        { from: "fa2", to: "fa3", label: "C3" },
      ],
    },
    codeExamples: [
      {
        title: "4-Bit Ripple-Carry vs. Carry-Lookahead Adder in Python",
        language: "python",
        code: `def full_adder(a: int, b: int, cin: int) -> tuple[int, int]:
    p = a ^ b
    g = a & b
    s = p ^ cin
    cout = g | (p & cin)
    return s, cout

def ripple_add_4bit(a: int, b: int, cin: int = 0) -> tuple[int, int]:
    total = 0
    c = cin
    for i in range(4):
        s, c = full_adder((a >> i) & 1, (b >> i) & 1, c)
        total |= (s << i)
    return total, c

for x, y in [(7, 1), (9, 6), (15, 1)]:
    s, cout = ripple_add_4bit(x, y)
    print(f"{x:2d} ({x:04b}) + {y:2d} ({y:04b}) -> sum={s:2d} ({s:04b}), Cout={cout}")`,
        explanation:
          "Simulates a 4-bit ripple-carry adder bit-by-bit using exact Full Adder gate equations.",
        output: ` 7 (0111) +  1 (0001) -> sum= 8 (1000), Cout=0
 9 (1001) +  6 (0110) -> sum=15 (1111), Cout=0
15 (1111) +  1 (0001) -> sum= 0 (0000), Cout=1`,
      },
    ],
    connections: [
      {
        lessonSlug: "boolean-algebra-logic",
        relationship: "Composes XOR, AND, and OR gates into arithmetic and routing datapath blocks.",
      },
      {
        lessonSlug: "sequential-logic-flip-flops",
        relationship: "Places combinational adders and muxes between clocked flip-flops to build state machines.",
      },
      {
        lessonSlug: "binary-hex-signed-integers",
        relationship: "Shows how the exact same adder hardware handles two's complement subtraction via B_inv + Cin=1.",
      },
      {
        lessonSlug: "alu-and-data-paths",
        relationship: "Combines adders, shifters, and muxes into the CPU's Arithmetic Logic Unit.",
      },
    ],
    realWorldApplications: [
      {
        title: "FPGA Lookup Tables (LUTs) Are Just Multiplexers",
        simplifiedVsReal:
          "We draw logic as discrete gates; inside an FPGA, there are no fixed AND/XOR gates in the programmable fabric.",
        modernExample:
          "A 6-input FPGA LUT is a 64-bit SRAM cell feeding a 64:1 multiplexer tree—reprogramming the 64 SRAM bits lets one circuit implement any 6-input Boolean function.",
      },
      {
        title: "Hybrid Kogge-Stone / Ling Adders in 64-Bit CPUs",
        simplifiedVsReal:
          "64-bit ripple adders are simple but take 64 carry hops; full Kogge-Stone trees are fast but wire-heavy.",
        modernExample:
          "Modern x86/ARM 64-bit ALUs use sparse parallel-prefix carry trees combined with short 4-bit carry-select blocks to balance ~150 ps latency and power.",
      },
    ],
    misconceptions: [
      {
        myth: "Combinational circuits update all output bits cleanly in one instant step with zero intermediate flickers.",
        reality:
          "Because different paths through gates have unequal delays, outputs can briefly glitch (e.g., 0 -> 1 -> 0) until the slowest critical path settles.",
      },
      {
        myth: "Subtraction requires building a completely separate subtractor circuit alongside the adder.",
        reality:
          "By inverting B and setting Cin = 1 (A + ~B + 1), the exact same Full Adder chain performs two's complement subtraction.",
      },
    ],
    revisionNotes: [
      "A 2^k:1 Mux selects 1 of 2^k inputs using k select bits; an n-to-2^n decoder activates 1 unique output line.",
      "Full Adder: S = A ^ B ^ Cin; Cout = (A & B) | (Cin & (A ^ B)).",
      "Ripple-carry delay scales linearly O(N); carry-lookahead / parallel-prefix adders scale logarithmically O(log N).",
      "Combinational logic has zero memory: outputs depend strictly on present inputs after propagation delay.",
    ],
    glossaryTermIds: ["combinational-logic", "full-adder", "boolean-algebra"],
    references: [
      {
        title: "From Nand to Tetris: Project 2 (Boolean Arithmetic)",
        author: "Noam Nisan & Shimon Schocken",
        url: "https://www.nand2tetris.org/",
        type: "course",
        note: "Walks step-by-step from Half Adder and Full Adder to a 16-bit ALU.",
      },
      {
        title: "Digital Design and Computer Architecture (Chapter 2 & 5)",
        author: "David Money Harris & Sarah L. Harris",
        url: "https://www.elsevier.com/books/digital-design-and-computer-architecture/harris/978-0-12-820064-3",
        type: "book",
        note: "Clear exposition of muxes, decoders, ripple adders, and carry-lookahead logic.",
      },
    ],
    assessments: [
      {
        id: "t1-l8-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "What is the minimal difference between a Half Adder and a Full Adder?",
        options: [
          {
            id: "a",
            text: "A Half Adder adds 4 bits; a Full Adder adds 8 bits",
            explanation: "Both operate on a single bit position (1-bit slice).",
          },
          {
            id: "b",
            text: "A Full Adder accepts a third Carry-In (Cin) input bit; a Half Adder only takes A and B",
            explanation:
              "Correct. Without Cin, a Half Adder cannot receive the carry generated by a less-significant bit.",
          },
          {
            id: "c",
            text: "A Full Adder includes a D flip-flop to store the sum",
            explanation: "Both Half Adders and Full Adders are purely combinational circuits.",
          },
          {
            id: "d",
            text: "A Half Adder has no Carry-Out output",
            explanation: "A Half Adder outputs both Sum (A ^ B) and Carry-Out (A & B).",
          },
        ],
        correctAnswer: "b",
        hints: ["Think about what bit column 1 needs from bit column 0 during addition."],
        explanation:
          "A Half Adder sums A + B (2 inputs), whereas a Full Adder sums A + B + Cin (3 inputs) so adders can be chained across bit positions.",
        conceptTag: "full-adder",
      },
      {
        id: "t1-l8-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A 32-bit ripple-carry adder has a carry-propagation delay of 120 ps per Full Adder stage from Cin to Cout (and 80 ps for initial P/G setup and final sum). What is the worst-case total addition time in picoseconds when adding 0xFFFFFFFF + 0x00000001?",
        latex: "t_{\\text{worst}} = t_{\\text{setup/sum}} + 31 \\times t_{\\text{carry}} \\text{ or } 32 \\times 120 + 80",
        correctAnswer: 3920,
        numericTolerance: 130,
        hints: [
          "In 0xFFFFFFFF + 1, the carry ripples sequentially across all 32 stages.",
        ],
        explanation:
          "With 32 stages * 120 ps = 3,840 ps plus 80 ps setup/sum = 3,920 ps (~3.92 ns, limiting the clock below ~255 MHz!). That is why CPUs use carry-lookahead trees.",
        conceptTag: "ripple-carry-delay",
      },
      {
        id: "t1-l8-q3",
        type: "predict-output",
        difficulty: "intermediate",
        prompt:
          "In a 4-bit adder computing A = 0b1011 (11) and B = 0b0110 (6) with Cin = 0, which bit positions have Generate G_i = 1 (carry created regardless of incoming carry)?",
        options: [
          {
            id: "a",
            text: "Bit 1 only",
            explanation:
              "Correct. Checking A_i & B_i: bit 0 (1&0=0), bit 1 (1&1=1), bit 2 (0&1=0), bit 3 (1&0=0).",
          },
          {
            id: "b",
            text: "Bits 0, 2, and 3",
            explanation:
              "Those are the positions where A_i ^ B_i = 1 (Propagate P_i = 1), not Generate G_i = 1.",
          },
          {
            id: "c",
            text: "Bits 1 and 3",
            explanation: "At bit 3, A3=1 and B3=0, so A3 & B3 = 0 (it propagates, not generates).",
          },
          {
            id: "d",
            text: "None of the bits",
            explanation: "Bit 1 has both A1=1 and B1=1, so G1 = 1.",
          },
        ],
        correctAnswer: "a",
        hints: ["Compute bitwise AND: A & B = 1011 & 0110."],
        explanation:
          "G_i = A_i AND B_i. Only bit 1 has both operand bits equal to 1 (1011 & 0110 = 0010).",
        conceptTag: "generate-propagate",
      },
      {
        id: "t1-l8-q4",
        type: "fill-blank",
        difficulty: "foundational",
        prompt:
          "A 3-to-8 binary decoder takes 3 input address bits and activates _____ output line(s) HIGH at a time for any valid input combination (enter an integer).",
        correctAnswer: "1",
        acceptableAnswers: ["1", "one"],
        hints: ["Each output line corresponds to one unique minterm of the 3-bit code."],
        explanation:
          "A decoder is a one-hot minterm generator: for any 3-bit input 000..111, exactly 1 of the 8 output lines goes HIGH.",
        conceptTag: "decoders",
      },
    ],
  },

  // =========================================================================
  // LESSON 9: sequential-logic-flip-flops
  // =========================================================================
  {
    id: "sequential-logic-flip-flops",
    slug: "sequential-logic-flip-flops",
    number: 9,
    title: "Sequential Logic: Latches, Flip-Flops & Clocks",
    subtitle:
      "Feedback bistability, edge-triggered D flip-flops, setup/hold timing windows, metastability, and FSMs",
    trackId: "track-1",
    domainId: "digital-electronics",
    moduleTitle: "Module 3: Digital Logic & Sequential Circuits",
    chapterTitle: "Chapter 3: Logic Gates & State",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["combinational-circuits-adders", "electromagnetism-rc-timing"],
    simulatorId: "logic-gates",
    simulatorPrompt:
      "In the Digital Logic & Flip-Flop Bench, toggle the D input while CLK is LOW vs. HIGH, then trigger a rising clock edge to observe how the edge-triggered D flip-flop samples D only at the rising edge.",
    objectives: [
      "Explain how cross-coupled NOR/NAND feedback creates two stable memory states (SR latch).",
      "Contrast level-sensitive D latches with edge-triggered master-slave D flip-flops.",
      "Derive the maximum clock frequency constraint T_clk >= t_cq + t_comb_max + t_su from setup and hold timing.",
      "Explain metastability when asynchronous external inputs violate setup/hold windows and how 2-FF synchronizers mitigate it.",
    ],
    depthExplanations: {
      beginner:
        "Combinational circuits like adders forget everything the moment their inputs change. To build a computer—with registers, counters, and RAM—circuits must remember past values. How can logic gates remember? By looping a gate's output back into its own input! Two cross-coupled inverters or NAND gates reinforce each other into one of two stable states: 0 or 1.\n\nIf circuits updated whenever they felt like it, fast signals would race ahead of slow signals in chaos. Instead, computers use a rhythmic metronome called a Clock, plus edge-triggered D Flip-Flops that snap a snapshot of data only at the crisp rising edge of the clock tick, giving combinational logic the entire rest of the cycle to finish calculating.",
      intermediate:
        "An SR latch built from cross-coupled NOR gates holds state when $S=R=0$, sets $Q=1$ when $S=1$, resets $Q=0$ when $R=1$, and forbids $S=R=1$. Gating it with an inverter yields a level-sensitive D latch (transparent whenever $\\text{CLK}=1$). Chaining two opposite-phase D latches (leader active when $\\text{CLK}=0$, follower active when $\\text{CLK}=1$) creates a rising-edge-triggered D flip-flop.\n\nFor reliable synchronous operation between two flip-flops separated by combinational delay $t_{\\text{comb}}$, two laws govern every clock period $T_{\\text{clk}}$: (1) Max-delay (setup): $T_{\\text{clk}} \\ge t_{c\\text{-}q} + t_{\\text{comb,max}} + t_{su}$, which caps clock frequency $f_{\\text{max}} = 1/T_{\\text{clk}}$; (2) Min-delay (hold): $t_{c\\text{-}q,\\text{min}} + t_{\\text{comb,min}} \\ge t_h$, ensuring new data never overwrites the next flip-flop before it finishes latching.",
      advanced:
        "Notice the deep asymmetry between setup and hold violations: a setup violation can always be fixed after manufacturing by lowering clock frequency (increasing $T_{\\text{clk}}$). A hold violation ($t_{c\\text{-}q} + t_{\\text{comb,min}} < t_h + t_{\\text{skew}}$) is independent of clock frequency and permanently bricks the silicon at any speed!\n\nWhen an external button or cross-clock signal changes inside the $(t_{su}, t_h)$ aperture, the latch's regenerative feedback settles near the unstable equilibrium $V_M \\approx V_{DD}/2$. Resolution time is probabilistic: Mean Time Between Failures grows exponentially with extra settling window $t_r$ as $\\text{MTBF} \\propto e^{t_r / \\tau_{\\text{meta}}}$, which is why asynchronous interfaces pass through a 2- or 3-stage flip-flop synchronizer chain.",
    },
    intuition:
      "Think of a D flip-flop pipeline like a relay race with a strict starting whistle (the clock edge). During the lap (clock cycle), runners sprint through combinational logic gates at different speeds. Everyone must arrive at the next baton handoff zone BEFORE the whistle (`setup time`), and nobody can sprint off too early before the previous runner drops the baton (`hold time`).",
    technicalTheory:
      "Cross-coupled inverters form a bistable system with two stable fixed points ($0, V_{DD}$) and one unstable metastable saddle point ($V_M$). Cascading two complementary D latches yields a positive-edge-triggered D flip-flop implementing:\n\n$$Q(t^+) = D(t_{\\uparrow\\text{CLK}})$$\n\nBetween launch flip-flop FF1 and capture flip-flop FF2 with combinational logic delay $[t_{\\text{comb,min}}, t_{\\text{comb,max}}]$ and clock skew $t_{\\text{skew}} = t_{\\text{clk2}} - t_{\\text{clk1}}$:\n\n$$T_{\\text{clk}} \\ge t_{c\\text{-}q,\\text{max}} + t_{\\text{comb,max}} + t_{su} - t_{\\text{skew}}$$\n\n$$t_{c\\text{-}q,\\text{min}} + t_{\\text{comb,min}} \\ge t_h + t_{\\text{skew}}$$\n\nCombining flip-flops (state $S_t$) with combinational next-state logic $\\delta(S_t, X_t)$ and output logic $\\lambda(S_t, X_t)$ realizes any Finite-State Machine (Moore or Mealy).",
    mechanisms: [
      {
        step: 1,
        title: "Clock-to-Q Launch (t_cq)",
        detail:
          "Upon a rising clock edge, the launch flip-flop's follower latch disconnects from the leader and drives its new Q output onto the combinational network after delay t_cq.",
        stateNote: "Leader latch is simultaneously isolated when CLK=1.",
      },
      {
        step: 2,
        title: "Combinational Evaluation Window",
        detail:
          "Signals ripple through adders, muxes, and gates during the clock period. Glitches may appear mid-cycle as faster paths arrive before slower ones.",
        stateNote: "Glitches are harmless as long as they settle before t_su.",
      },
      {
        step: 3,
        title: "Setup Aperture Before Next Edge (t_su)",
        detail:
          "The new result must arrive and remain stable at the capture flip-flop's D input at least t_su before the next rising clock edge so the leader latch captures it cleanly.",
        stateNote: "Longest combinational path sets maximum clock frequency f_max.",
      },
      {
        step: 4,
        title: "Hold Window After Clock Edge (t_h)",
        detail:
          "The old D value must persist for t_h after the clock edge while the transmission gate closes, preventing race-through corruption.",
        stateNote: "Shortest path must be >= t_h; independent of clock period T_clk.",
      },
    ],
    mathNotes: [
      {
        title: "Maximum Synchronous Clock Frequency",
        latex: "f_{\\max} = \\frac{1}{T_{\\text{clk,min}}} = \\frac{1}{t_{c\\text{-}q} + t_{\\text{comb,max}} + t_{su}}",
        explanation:
          "Neglecting skew, adding one extra gate to the critical path directly reduces f_max—motivating CPU pipelining.",
      },
      {
        title: "Hold Time Constraint",
        latex: "t_{c\\text{-}q,\\text{min}} + t_{\\text{comb,min}} \\ge t_h + t_{\\text{skew}}",
        explanation:
          "If a fast shift-register wire is shorter than clock skew + hold time, tools insert delay buffers to fix the hold violation.",
      },
    ],
    diagram: {
      title: "Synchronous Register-to-Register Timing Path",
      caption:
        "Launch FF1 releases data on a rising edge; signals cross combinational logic within T_clk and must arrive t_su before Capture FF2's next edge.",
      nodes: [
        { id: "clk", label: "Clock Tree", sublabel: "Rising Edge CLK", x: 95, y: 215, tone: "neutral" },
        { id: "ff1", label: "Launch D-FF", sublabel: "Delay t_cq", x: 145, y: 110, tone: "accent" },
        { id: "comb", label: "Combinational Logic", sublabel: "t_comb (glitches OK)", x: 345, y: 110, tone: "emerald" },
        { id: "ff2", label: "Capture D-FF", sublabel: "Requires t_su & t_h", x: 555, y: 110, tone: "amber" },
      ],
      edges: [
        { from: "clk", to: "ff1", label: "edge t=0" },
        { from: "ff1", to: "comb", label: "Q1" },
        { from: "comb", to: "ff2", label: "D2" },
        { from: "clk", to: "ff2", label: "edge t=T_clk" },
      ],
    },
    codeExamples: [
      {
        title: "Static Timing Analysis (STA) Setup & Hold Checker",
        language: "python",
        code: `def check_timing(t_cq_max, t_cq_min, t_comb_max, t_comb_min, t_su, t_h, t_skew, t_clk):
    t_req_period = t_cq_max + t_comb_max + t_su - t_skew
    setup_slack = t_clk - t_req_period
    hold_slack = (t_cq_min + t_comb_min) - (t_h + t_skew)
    f_max_ghz = 1.0 / t_req_period   # periods in ns -> GHz

    print(f"Min T_clk = {t_req_period:.3f} ns (f_max = {f_max_ghz:.2f} GHz)")
    print(f"Setup slack @ {t_clk} ns: {setup_slack:+.3f} ns ({'PASS' if setup_slack >= 0 else 'FAIL'})")
    print(f"Hold slack:               {hold_slack:+.3f} ns ({'PASS' if hold_slack >= 0 else 'FAIL'})")

# Times in nanoseconds: fast shift-register path vs skewed clock
check_timing(0.08, 0.04, 0.25, 0.01, 0.05, 0.04, t_skew=0.03, t_clk=0.40)`,
        explanation:
          "Performs the exact Static Timing Analysis (STA) setup and hold checks that EDA tools run across billions of paths in a modern CPU.",
        output: `Min T_clk = 0.350 ns (f_max = 2.86 GHz)
Setup slack @ 0.4 ns: +0.050 ns (PASS)
Hold slack:               -0.020 ns (FAIL)`,
      },
    ],
    connections: [
      {
        lessonSlug: "combinational-circuits-adders",
        relationship: "Wraps combinational adders and muxes with registers to retain state across cycles.",
      },
      {
        lessonSlug: "electromagnetism-rc-timing",
        relationship: "Uses RC wire/gate delays to determine t_comb_max and clock skew.",
      },
      {
        lessonSlug: "alu-and-data-paths",
        relationship: "Builds registers, program counters, and register files directly out of D flip-flop arrays.",
      },
      {
        lessonSlug: "sram-dram-memory-cells",
        relationship: "Contrasts edge-triggered flip-flops with dense 6T SRAM cross-coupled inverters.",
      },
    ],
    realWorldApplications: [
      {
        title: "Overclocking & Dynamic Voltage-Frequency Scaling (DVFS)",
        simplifiedVsReal:
          "Raising CPU clock speed fails cleanly once T_clk < t_cq + t_comb + t_su.",
        modernExample:
          "Overclockers raise V_DD so transistors drive stronger current, shrinking RC delays t_comb until heat—not timing—becomes the limit.",
      },
      {
        title: "Clock Domain Crossing (CDC) Synchronizers",
        simplifiedVsReal:
          "A single chip rarely runs on one global clock; PCIe, DDR, USB, and CPU cores run at unrelated frequencies.",
        modernExample:
          "Signals crossing clock domains pass through 2-flip-flop synchronizers or Gray-coded async FIFOs so metastability resolves before reaching logic.",
      },
    ],
    misconceptions: [
      {
        myth: "Lowering the clock frequency fixes all timing bugs in a digital chip.",
        reality:
          "Slowing the clock fixes setup violations, but hold violations depend only on race-through delay vs. clock skew—they still fail even at 1 Hz!",
      },
      {
        myth: "A D latch and a D flip-flop behave identically.",
        reality:
          "A D latch is transparent during an entire clock level (allowing signals to race through multiple latches); a D flip-flop samples strictly on a clock edge.",
      },
    ],
    revisionNotes: [
      "Cross-coupled inverters/gates create bistable feedback that stores 1 bit of state.",
      "D latches are level-sensitive; master-slave D flip-flops are edge-triggered.",
      "Setup constraint (T_clk >= t_cq + t_comb_max + t_su) bounds maximum clock frequency.",
      "Hold constraint (t_cq_min + t_comb_min >= t_h + t_skew) is frequency-independent and fatal if violated.",
      "Metastability occurs when inputs change inside (t_su, t_h); 2-FF synchronizers reduce failure rates exponentially.",
    ],
    glossaryTermIds: ["d-flip-flop", "setup-hold-time", "combinational-logic", "rc-time-constant"],
    references: [
      {
        title: "MIT OCW 6.004: Computation Structures (Sequential Logic & Synchronization)",
        author: "Chris Terman & Silvina Hanono Wachman",
        url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
        type: "course",
        note: "Detailed derivation of dynamic discipline, setup/hold apertures, and metastability.",
      },
      {
        title: "Ben Eater: Latches, Flip-Flops & Clock Modules",
        author: "Ben Eater",
        url: "https://eater.net/",
        type: "video",
        note: "Hands-on breadboard construction of SR latches, D flip-flops, and registers.",
      },
    ],
    assessments: [
      {
        id: "t1-l9-q1",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A synchronous path has t_cq = 60 ps, t_comb_max = 380 ps, t_su = 60 ps, and zero clock skew. What is the maximum clock frequency f_max in GHz?",
        latex: "T_{\\text{min}} = 60 + 380 + 60 = 500\\text{ ps}, \\quad f_{\\max} = \\frac{1}{T_{\\text{min}}}",
        correctAnswer: 2.0,
        numericTolerance: 0.05,
        hints: ["Add t_cq + t_comb_max + t_su in picoseconds, convert to seconds (1e-12), and invert."],
        explanation:
          "T_min = 500 ps = 0.5 ns, so f_max = 1 / 0.5e-9 s = 2.0 GHz.",
        conceptTag: "setup-timing-fmax",
      },
      {
        id: "t1-l9-q2",
        type: "debugging",
        difficulty: "rigorous",
        prompt:
          "A newly fabricated ASIC fails at 1 GHz. The test engineer lowers the clock all the way down to 1 MHz (1,000x slower), yet the exact same two registers still corrupt data every cycle. Which bug is the most likely culprit?",
        options: [
          {
            id: "a",
            text: "A setup time violation in a slow 32-bit multiplier",
            explanation:
              "Slowing the clock by 1,000x gives 1,000,000 ps of setup margin, which completely eliminates setup violations.",
          },
          {
            id: "b",
            text: "A hold time violation (t_cq_min + t_comb_min < t_h + t_skew) between adjacent flip-flops",
            explanation:
              "Correct. Hold checks compare launch-to-capture race time against the same clock edge and do not depend on T_clk at all.",
          },
          {
            id: "c",
            text: "Dynamic switching power exceeding the package TDP",
            explanation:
              "Dynamic power drops by 1,000x at 1 MHz, eliminating thermal issues.",
          },
          {
            id: "d",
            text: "Too large of a decoupling capacitor on VDD",
            explanation: "Extra decoupling stabilizes power rails rather than corrupting data.",
          },
        ],
        correctAnswer: "b",
        hints: ["Which timing equation does NOT contain T_clk?"],
        explanation:
          "Hold violations happen around a single clock edge regardless of how long you wait until the next clock edge, making them fatal at any frequency.",
        conceptTag: "hold-violation",
      },
      {
        id: "t1-l9-q3",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: A two-flip-flop synchronizer reduces the probability of metastability propagating into downstream logic to zero.",
        correctAnswer: false,
        hints: ["Metastability decay is exponential, so failure probability becomes tiny—not strictly zero."],
        explanation:
          "False. Metastability resolution is probabilistic; a 2-FF synchronizer makes failure astronomically rare (e.g., MTBF of billions of years) rather than mathematically impossible.",
        conceptTag: "metastability",
      },
      {
        id: "t1-l9-q4",
        type: "matching",
        difficulty: "intermediate",
        prompt: "Match each sequential timing term to its physical definition:",
        matchingPairs: [
          { id: "m1", left: "Setup time (t_su)", right: "Minimum time D must stay stable BEFORE the clock edge" },
          { id: "m2", left: "Hold time (t_h)", right: "Minimum time D must stay stable AFTER the clock edge" },
          { id: "m3", left: "Clock-to-Q (t_cq)", right: "Propagation delay from clock edge until Q updates" },
        ],
        correctAnswer: {
          m1: "Minimum time D must stay stable BEFORE the clock edge",
          m2: "Minimum time D must stay stable AFTER the clock edge",
          m3: "Propagation delay from clock edge until Q updates",
        },
        hints: ["Think of setup as 'arriving early', hold as 'staying put briefly', and t_cq as 'output reaction'."],
        explanation:
          "Setup and hold define the quiet window around the active clock edge, while t_cq measures how fast the flip-flop launches the captured bit.",
        conceptTag: "timing-parameters",
      },
    ],
  },

  // =========================================================================
  // LESSON 10: binary-hex-signed-integers
  // =========================================================================
  {
    id: "binary-hex-signed-integers",
    slug: "binary-hex-signed-integers",
    number: 10,
    title: "Binary, Hexadecimal & Two's Complement Arithmetic",
    subtitle:
      "Base-2/16 positional systems, why two's complement unifies addition/subtraction, and Carry vs. Overflow",
    trackId: "track-1",
    domainId: "information-representation",
    moduleTitle: "Module 4: Information Representation & Coding",
    chapterTitle: "Chapter 4: Numbers, Text & Error Correction",
    estimatedMinutes: 35,
    difficulty: "beginner",
    status: "complete",
    prerequisites: ["combinational-circuits-adders"],
    simulatorId: "binary-float",
    simulatorPrompt:
      "In the Two's Complement & IEEE-754 Bit Inspector, switch to 8-bit integer mode, toggle bits to inspect -1 (0xFF), -128 (0x80), and +127 (0x7F), and observe what happens when adding 127 + 1.",
    objectives: [
      "Convert seamlessly between binary, hexadecimal (4 bits per hex digit), and decimal integers.",
      "Compare sign-magnitude, one's complement, and two's complement encodings and compute -x = ~x + 1.",
      "Perform N-bit modular addition/subtraction and distinguish unsigned Carry (C) from signed Overflow (V).",
      "Apply arithmetic vs. logical right shifts and sign-extension when widening signed integers.",
    ],
    depthExplanations: {
      beginner:
        "Because CMOS voltages represent only 0 and 1, computers count in base-2 (binary), where each column is a power of 2 ($1, 2, 4, 8, 16, \\dots$). Binary strings get long fast, so programmers group every 4 bits into a single hexadecimal digit (`0–9, A–F`), making a 32-bit value fit into 8 crisp hex characters like `0xDEADBEEF`.\n\nTo store negative numbers without inventing a third voltage level, CPUs use two's complement: the leftmost bit (MSB) simply has a negative weight ($-2^{N-1}$). With that one twist, `-1` is `11111111`, there is only one zero (`00000000`), and the exact same binary adder circuit adds positive and negative numbers without knowing which is which!",
      intermediate:
        "In an $N$-bit two's complement system, bit pattern $b_{N-1}\\dots b_0$ represents $-b_{N-1}2^{N-1} + \\sum_{i=0}^{N-2} b_i 2^i$, spanning $[-2^{N-1}, 2^{N-1}-1]$. Negation satisfies $-x \\equiv (2^N - x) \\pmod{2^N} = \\overline{x} + 1$, because $x + \\overline{x} = 2^N - 1 = \\text{0xFF...F}$. Note the asymmetric boundary: $-(-2^{N-1})$ overflows back to $-2^{N-1}$ (e.g., `-(-128) == -128` in 8-bit signed arithmetic).\n\nHardware adders produce identical bit sums for unsigned and two's complement inputs, setting two distinct status flags: Carry-Out $C = C_N$ detects unsigned wraparound, whereas Overflow $V = C_{N-1} \\oplus C_N$ detects signed wraparound (when two same-signed inputs produce an opposite-signed output).",
      advanced:
        "Two's complement is isomorphic to the ring $\\mathbb{Z}/2^N\\mathbb{Z}$ shifted so half the residue classes map to negative integers. This algebraic congruence means modular addition, subtraction, and the lower $N$ bits of $N\\times N \\to N$ multiplication are bit-for-bit identical for unsigned and signed operands! Only full $2N$-bit products, division/modulo, comparisons (`<` vs. unsigned `<`), right-shifts (`SAR` arithmetic sign-propagating vs. `SHR` logical zero-filling), and sign-extension (`MOVSX` vs. `MOVZX`) distinguish signedness.\n\nIn C and C++, unsigned integer overflow is strictly defined as modulo-$2^N$ wraparound, whereas signed integer overflow is Undefined Behavior (UB)—letting compilers optimize `x + 1 > x` to `true`, a notorious source of subtle security bugs.",
    },
    intuition:
      "Think of two's complement like an old car odometer that rolls backward from `00000000` to `11111111`. Driving 1 mile backward from zero lands on `11111111` (`-1`), and driving 1 mile forward from `11111111` rolls cleanly back to `00000000` (`0`)—so addition wraps around the circle effortlessly.",
    technicalTheory:
      "Let $B = (b_{N-1}b_{N-2}\\dots b_0)_2$. Unsigned and two's complement interpretations map the same $N$-bit string to:\n\n$$U(B) = \\sum_{i=0}^{N-1} b_i 2^i \\in [0, 2^N - 1], \\qquad S(B) = -b_{N-1}2^{N-1} + \\sum_{i=0}^{N-2} b_i 2^i \\in [-2^{N-1}, 2^{N-1}-1]$$\n\nSubtraction $A - B$ is executed on a standard adder via $A + \\overline{B} + 1$. When adding two $N$-bit words, let $C_{N-1}$ be the carry into the MSB and $C_N$ be the carry out of the MSB:\n\n$$C = C_N \\text{ (unsigned overflow)}, \\qquad V = C_{N-1} \\oplus C_N \\text{ (signed overflow)}$$\n\nWidening an $N$-bit signed value to $M > N$ bits replicates the sign bit $b_{N-1}$ into all upper $M - N$ positions (sign extension), preserving exact numerical value.",
    mechanisms: [
      {
        step: 1,
        title: "Negation via Bitwise Complement + 1",
        detail:
          "Invert every bit (~B) so B + ~B = 111...1 (-1), then add 1 so B + (~B + 1) = 0 mod 2^N.",
        stateNote: "Executed in hardware by XORing B with Sub=1 and setting Cin=1.",
      },
      {
        step: 2,
        title: "Sign-Agnostic Modular Addition",
        detail:
          "Feed A, B (or ~B), and Cin into the N-bit adder; bit outputs S[N-1:0] are identical whether operands are interpreted as signed or unsigned.",
        stateNote: "Zero extra adder hardware needed for negative numbers.",
      },
      {
        step: 3,
        title: "Flag Separation (C vs. V)",
        detail:
          "Check Cout (C) for unsigned overflow, and XOR(Cin_MSB, Cout_MSB) (V) to catch signed wraparound like (+127) + (+1) = -128.",
        stateNote: "Unsigned C=1 can happen safely in valid signed math (e.g., 5 + (-2) = 3 sets C=1, V=0).",
      },
      {
        step: 4,
        title: "Sign Extension & Arithmetic Shift",
        detail:
          "When widening from 8-bit to 32-bit or dividing by 2 via right-shift, copy bit N-1 into vacant left bits to keep negative numbers negative.",
        stateNote: "Note: arithmetic right shift rounds toward -infinity (-3 >> 1 = -2), unlike C division (-3 / 2 = -1).",
      },
    ],
    mathNotes: [
      {
        title: "Two's Complement Value Formula",
        latex: "x = -b_{N-1}2^{N-1} + \\sum_{i=0}^{N-2} b_i 2^i",
        explanation:
          "Only the sign bit weight flips from +2^(N-1) to -2^(N-1); all lower bit weights remain positive powers of 2.",
      },
      {
        title: "Signed Overflow Detection",
        latex: "V = C_{N-1} \\oplus C_N",
        explanation:
          "Equivalent to: overflow occurs iff both operands share the same sign bit and the sum has the opposite sign bit.",
      },
    ],
    diagram: {
      title: "4-Bit Two's Complement Number Circle (Mod 16)",
      caption:
        "Unsigned 0..15 and signed -8..+7 share the exact same 16 bit patterns; signed overflow crosses the 0111 (+7) <-> 1000 (-8) boundary.",
      nodes: [
        { id: "zero", label: "0000 (0)", sublabel: "Unsigned 0", x: 340, y: 45, tone: "emerald" },
        { id: "maxpos", label: "0111 (+7)", sublabel: "Max Signed", x: 560, y: 140, tone: "accent" },
        { id: "minneg", label: "1000 (-8)", sublabel: "Unsigned 8", x: 340, y: 235, tone: "amber" },
        { id: "neg1", label: "1111 (-1)", sublabel: "Unsigned 15", x: 120, y: 140, tone: "neutral" },
      ],
      edges: [
        { from: "zero", to: "maxpos", label: "+1..+7" },
        { from: "maxpos", to: "minneg", label: "V=1 (Signed wrap)" },
        { from: "minneg", to: "neg1", label: "-7..-1" },
        { from: "neg1", to: "zero", label: "C=1 (Unsigned wrap)" },
      ],
    },
    codeExamples: [
      {
        title: "8-Bit Two's Complement Adder with C and V Flag Inspector",
        language: "python",
        code: `def add_8bit(a_signed: int, b_signed: int):
    a = a_signed & 0xFF
    b = b_signed & 0xFF
    # Compute 7-bit carry-in to MSB (bit 7) and 8-bit carry-out
    c_in_msb = ((a & 0x7F) + (b & 0x7F)) >> 7
    full_sum = a + b
    c_out = full_sum >> 8
    res = full_sum & 0xFF
    signed_res = res - 256 if (res & 0x80) else res
    v_flag = c_in_msb ^ c_out
    print(f"{a_signed:+4d} (0x{a:02X}) + {b_signed:+4d} (0x{b:02X}) = {signed_res:+4d} (0x{res:02X}) | C={c_out} V={v_flag}")

add_8bit(5, -2)       # Valid signed addition; C=1, V=0
add_8bit(127, 1)      # Signed overflow (+127 + 1 = -128); C=0, V=1
add_8bit(-100, -50)   # Signed underflow (-100 - 50 = +106); C=1, V=1`,
        explanation:
          "Shows how identical 8-bit hardware sets Carry (C) and Overflow (V) independently across signed and unsigned boundary cases.",
        output: `  +5 (0x05) +   -2 (0xFE) =   +3 (0x03) | C=1 V=0
+127 (0x7F) +   +1 (0x01) = -128 (0x80) | C=0 V=1
-100 (0x9C) +  -50 (0xCE) = +106 (0x6A) | C=1 V=1`,
      },
    ],
    connections: [
      {
        lessonSlug: "combinational-circuits-adders",
        relationship: "Uses Full Adder chains to execute two's complement addition and subtraction.",
      },
      {
        lessonSlug: "ieee-754-floating-point",
        relationship: "Contrasts fixed-range integer encodings with exponential floating-point representations.",
      },
      {
        lessonSlug: "encoding-compression-ecc",
        relationship: "Extends binary bit patterns to text encoding, compression, and error correction.",
      },
      {
        lessonSlug: "alu-and-data-paths",
        relationship: "Feeds directly into the CPU ALU's Z, N, C, and V condition flags.",
      },
    ],
    realWorldApplications: [
      {
        title: "INT_MIN Abs() Bug & Ariane/Game Overflow Glitches",
        simplifiedVsReal:
          "Negation in math always flips sign; in N-bit two's complement, `abs(-2^(N-1))` wraps right back to `-2^(N-1)`.",
        modernExample:
          "In Java/C, `Math.abs(Integer.MIN_VALUE)` returns `-2147483648` (negative!), and 32-bit signed counters overflowing caused historic timer and game bugs.",
      },
      {
        title: "Hexadecimal Memory Dumps & Bitmasks",
        simplifiedVsReal:
          "Human programmers rarely read raw 64-bit binary.",
        modernExample:
          "Because 1 hex digit = exactly 4 bits, `0xFF00` immediately reveals top byte all-1s and bottom byte all-0s—vital for debugging pointers, permissions (`0x755` octal / `0x1ED` hex), and network headers.",
      },
    ],
    misconceptions: [
      {
        myth: "Two's complement has both +0 and -0, just like sign-magnitude.",
        reality:
          "Sign-magnitude and one's complement suffer from two zeros, whereas two's complement has a single unique zero (000...0) and one extra negative value (-2^(N-1)).",
      },
      {
        myth: "Carry flag C=1 always means an addition overflowed and gave the wrong answer.",
        reality:
          "C=1 only means unsigned overflow. When adding +5 + (-2) in 8 bits (0x05 + 0xFE = 0x103), C=1 is expected and the signed answer +3 (0x03) is completely correct (V=0).",
      },
    ],
    revisionNotes: [
      "1 hex digit = 4 bits (nibble); 2 hex digits = 1 byte (8 bits).",
      "N-bit two's complement spans [-2^(N-1), 2^(N-1) - 1], with negation -x = ~x + 1.",
      "Unsigned Carry is C = C_N; Signed Overflow is V = C_{N-1} ^ C_N.",
      "Sign-extending an N-bit signed integer copies the MSB into all new upper bits.",
    ],
    glossaryTermIds: ["twos-complement", "arithmetic-overflow", "full-adder"],
    references: [
      {
        title: "Computer Systems: A Programmer's Perspective (CS:APP, Chapter 2)",
        author: "Randal E. Bryant & David R. O'Hallaron",
        url: "https://csapp.cs.cmu.edu/",
        type: "book",
        note: "Rigorous treatment of two's complement ring arithmetic, TMin asymmetry, and C casting pitfalls.",
      },
      {
        title: "MIT OCW 6.004: Computation Structures (Basics of Information)",
        author: "Chris Terman & Silvina Hanono Wachman",
        url: "https://ocw.mit.edu/courses/6-004-computation-structures-spring-2017/",
        type: "course",
        note: "Binary/hex representations and two's complement arithmetic hardware.",
      },
    ],
    assessments: [
      {
        id: "t1-l10-q1",
        type: "fill-blank",
        difficulty: "foundational",
        prompt:
          "Convert the 8-bit two's complement binary value 1110 1011 (0xEB) to a signed decimal integer:",
        correctAnswer: "-21",
        acceptableAnswers: ["-21"],
        hints: ["Invert all bits (0001 0100 = 20) and add 1 to find the magnitude."],
        explanation:
          "Invert 11101011 -> 00010100 (20), add 1 -> 21, attach minus sign -> -21. Equivalently: -128 + 64 + 32 + 8 + 2 + 1 = -21.",
        conceptTag: "twos-complement-decode",
      },
      {
        id: "t1-l10-q2",
        type: "predict-output",
        difficulty: "intermediate",
        prompt:
          "In 8-bit two's complement arithmetic, you compute (-80) + (-70). What signed 8-bit decimal value and flags (C, V) are produced?",
        options: [
          {
            id: "a",
            text: "-150, with C=0, V=0",
            explanation: "-150 does not fit in [-128, +127].",
          },
          {
            id: "b",
            text: "+106, with C=1, V=1",
            explanation:
              "Correct. -80 is 0xB0, -70 is 0xBA. 0xB0 + 0xBA = 0x16A -> 8-bit result 0x6A = +106, with C=1 and V=1 (two negatives summed to a positive!).",
          },
          {
            id: "c",
            text: "+106, with C=0, V=1",
            explanation: "0xB0 + 0xBA = 0x16A exceeds 255, so unsigned carry C=1 is also set.",
          },
          {
            id: "d",
            text: "-22, with C=1, V=0",
            explanation: "Check the low nibble: 0x0 + 0xA = 0xA, and 0xB + 0xB = 0x16.",
          },
        ],
        correctAnswer: "b",
        hints: ["Compute -80 - 70 + 256 to find the wrapped 8-bit signed result."],
        explanation:
          "True sum -150 wraps modulo 256 to -150 + 256 = +106 (0x6A). Adding two negative numbers produced a positive result, flagging signed overflow V=1 (and unsigned carry C=1).",
        conceptTag: "overflow-vs-carry",
      },
      {
        id: "t1-l10-q3",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "What is the 16-bit hexadecimal result of sign-extending the 8-bit two's complement byte 0x85 to 16 bits?",
        options: [
          {
            id: "a",
            text: "0x0085",
            explanation: "0x0085 is zero-extension (correct for unsigned 133, wrong for signed -123).",
          },
          {
            id: "b",
            text: "0xFF85",
            explanation:
              "Correct. Because the MSB of 0x85 (1000 0101) is 1, sign extension fills the upper byte with 1s (0xFF), preserving -123.",
          },
          {
            id: "c",
            text: "0x8005",
            explanation: "The lower 7 bits must stay in bits 6..0 rather than shifting.",
          },
          {
            id: "d",
            text: "0x8500",
            explanation: "Shifting left by 8 multiplies by 256 instead of preserving value.",
          },
        ],
        correctAnswer: "b",
        hints: ["Check whether the sign bit (bit 7) of 0x85 is 0 or 1."],
        explanation:
          "0x85 = 1000 0101 has MSB = 1 (-123). Replicating bit 7 across bits 15..8 gives 0xFF85, which still equals -123 in 16-bit two's complement.",
        conceptTag: "sign-extension",
      },
      {
        id: "t1-l10-q4",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: In 8-bit two's complement, every negative number has a corresponding positive negation that fits inside 8-bit two's complement.",
        correctAnswer: false,
        hints: ["Compare the minimum negative value (-128) with the maximum positive value (+127)."],
        explanation:
          "False. -128 (0x80) has no positive counterpart because +128 exceeds the maximum signed 8-bit value (+127). Negating 0x80 wraps back to 0x80.",
        conceptTag: "asymmetric-range",
      },
    ],
  },

  // =========================================================================
  // LESSON 11: ieee-754-floating-point
  // =========================================================================
  {
    id: "ieee-754-floating-point",
    slug: "ieee-754-floating-point",
    number: 11,
    title: "IEEE-754 Floating-Point & Rounding Error",
    subtitle:
      "Sign-exponent-mantissa bit layouts, biased exponents, subnormals, NaN/Inf, and why 0.1 + 0.2 !== 0.3",
    trackId: "track-1",
    domainId: "information-representation",
    moduleTitle: "Module 4: Information Representation & Coding",
    chapterTitle: "Chapter 4: Numbers, Text & Error Correction",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["binary-hex-signed-integers"],
    simulatorId: "binary-float",
    simulatorPrompt:
      "In the Two's Complement & IEEE-754 Bit Inspector, encode -13.625 in 32-bit float (verify 0xC15A0000), then inspect 0.1 + 0.2 to see the exact 1-ULP rounding difference vs. 0.3.",
    objectives: [
      "Encode and decode 32-bit IEEE-754 binary32 floats across Sign (1b), Biased Exponent (8b), and Fraction (23b).",
      "Explain why binary floating point cannot represent 0.1 or 0.2 exactly and predict ULP spacing across powers of 2.",
      "Identify special encodings: +/-0, subnormal numbers (gradual underflow), +/-Infinity, and NaN.",
      "Diagnose catastrophic cancellation, absorption, and non-associativity in floating-point algorithms.",
    ],
    depthExplanations: {
      beginner:
        "Two's complement handles whole numbers cleanly, but physics, 3D graphics, and AI need numbers like `0.000125`, `3.14159`, and `6.02e23`. Instead of locking the binary point in one fixed spot, IEEE-754 floating-point uses binary scientific notation: $\\pm 1.\\text{fraction} \\times 2^{\\text{exponent}}$.\n\nA 32-bit `float` devotes 1 bit to the sign, 8 bits to the exponent (so numbers can range from $10^{-38}$ to $10^{+38}$), and 23 bits to precision. Because computers use powers of $2$ rather than powers of $10$, harmless decimal fractions like `0.1` repeat forever in binary (`0.0001100110011...`), which is why `0.1 + 0.2` differs slightly from `0.3` in nearly every programming language.",
      intermediate:
        "In IEEE-754 `binary32`, normal numbers ($1 \\le E \\le 254$) decode as $(-1)^S \\times (1 + F \\cdot 2^{-23}) \\times 2^{E - 127}$. Adding a bias of $127$ makes all stored exponents unsigned integers `1..254`, so positive floats sort identically to unsigned integers!\n\nTwo reserved exponent codes complete the algebra: $E = 255$ encodes $\\pm\\infty$ (when $F = 0$) and Quiet/Signaling `NaN` (when $F \\ne 0$). $E = 0$ encodes signed zero ($\\pm 0$ when $F = 0$) and subnormal numbers $(-1)^S \\times (0 + F \\cdot 2^{-23}) \\times 2^{-126}$ (when $F \\ne 0$), which fill the gap smoothly down to zero (gradual underflow) instead of snapping abruptly to zero below $2^{-126}$.",
      advanced:
        "Between $2^k$ and $2^{k+1}$, `binary32` spaces $2^{23}$ values uniformly with Unit in the Last Place $\\text{ULP}(x) = 2^{k - 23}$ (for `binary64`, $2^{k - 52}$). Round-to-nearest-ties-to-even guarantees every single operation $+, -, \\times, /, \\sqrt{\\phantom{x}}$ produces the exact result rounded to nearest representable float (relative error $\\le \\frac{1}{2}\\varepsilon_{\\text{mach}} = 2^{-24}$ for `fp32`).\n\nHowever, floating-point addition is NOT associative: `(1e16 + 1.0) - 1e16` evaluates to `0.0` (absorption of `1.0` below `ULP(1e16)`), whereas `1e16 - 1e16 + 1.0` equals `1.0`. Subtracting nearly equal floats causes catastrophic cancellation, magnifying prior rounding noise across remaining bits. Modern AI formats (`fp16`, `bf16`, `fp8`) trade mantissa bits directly for silicon throughput.",
    },
    intuition:
      "Floating point is like a ruler whose tick marks stretch as you walk away from zero: near `1.0`, ticks sit roughly `0.0000001` apart; near `16,777,216` ($2^{24}$), ticks are `1.0` apart—meaning `16777216.0f + 1.0f` lands right back on `16777216.0f`!",
    technicalTheory:
      "An IEEE-754 binary floating-point format with $w$ exponent bits (bias $B = 2^{w-1}-1$) and $t$ explicit trailing significand bits (`binary32`: $w=8, B=127, t=23$; `binary64`: $w=11, B=1023, t=52$) decodes $(S, E, F)$ as:\n\n$$x = \\begin{cases} (-1)^S \\times (0 + F\\cdot 2^{-t}) \\times 2^{1 - B}, & E = 0 \\text{ (zero if } F=0\\text{, else subnormal)} \\\\ (-1)^S \\times (1 + F\\cdot 2^{-t}) \\times 2^{E - B}, & 1 \\le E \\le 2^w - 2 \\text{ (normal)} \\\\ \\pm\\infty \\text{ (if } F=0\\text{) or NaN (if } F\\ne 0\\text{)}, & E = 2^w - 1 \\end{cases}$$\n\nMachine epsilon is $\\varepsilon_{\\text{mach}} = 2^{-t}$ ($2^{-23} \\approx 1.192 \\times 10^{-7}$ for `fp32`, $2^{-52} \\approx 2.220 \\times 10^{-16}$ for `fp64`).",
    mechanisms: [
      {
        step: 1,
        title: "Normalize to Binary Scientific Notation",
        detail:
          "Shift the binary point until exactly one non-zero bit sits to its left: e.g., 13.625 = 1101.101_2 = 1.101101_2 * 2^3.",
        stateNote: "The leading '1.' is implicit and omitted from storage to gain 1 free bit of precision.",
      },
      {
        step: 2,
        title: "Bias the Exponent",
        detail:
          "Add bias 127 (for binary32) to the true exponent: 3 + 127 = 130 = 10000010_2.",
        stateNote: "Keeping E unsigned lets hardware compare positive floats using integer comparators.",
      },
      {
        step: 3,
        title: "Pack & Round Fraction to Nearest-Even",
        detail:
          "Store fractional bits after the binary point (101101000...) and round any remaining tail bits using Guard, Round, and Sticky bits.",
        stateNote: "Round-to-nearest-ties-to-even prevents systematic upward or downward drift.",
      },
      {
        step: 4,
        title: "Handle Special & Subnormal Exponents",
        detail:
          "If E=0, drop the implicit 1 and lock exponent to 2^-126 for gradual underflow; if E=255, emit Infinity or propagate NaN.",
        stateNote: "Any comparison with NaN (even NaN == NaN) evaluates to false.",
      },
    ],
    mathNotes: [
      {
        title: "IEEE-754 Normal Decoding (binary32)",
        latex: "x = (-1)^S \\times \\left(1 + \\sum_{i=1}^{23} b_{23-i} 2^{-i}\\right) \\times 2^{E - 127}",
        explanation:
          "The hidden leading 1 gives 24 bits of total significand precision inside a 23-bit field.",
      },
      {
        title: "BFloat16 vs. FP16 AI Trade-Off",
        latex: "\\text{FP32: } (1,8,23), \\quad \\text{BF16: } (1,8,7), \\quad \\text{FP16: } (1,5,10)",
        explanation:
          "BF16 keeps FP32's full 8-bit exponent range (avoiding gradient underflow/overflow) while trimming mantissa to 7 bits.",
      },
    ],
    diagram: {
      title: "IEEE-754 Single-Precision (binary32) Layout for -13.625",
      caption:
        "-13.625 encodes as 0xC15A0000: S=1 (-), E=130 (2^3), and F=0.703125 (1.703125 * 8 = 13.625).",
      nodes: [
        { id: "sign", label: "Sign (1 bit)", sublabel: "S = 1 (Negative)", x: 105, y: 120, tone: "amber" },
        { id: "exp", label: "Biased Exp (8 bits)", sublabel: "E = 10000010 (130 -> 2^3)", x: 300, y: 120, tone: "accent" },
        { id: "frac", label: "Fraction (23 bits)", sublabel: "1011010... (implicit 1.)", x: 525, y: 120, tone: "emerald" },
        { id: "val", label: "Decoded Value", sublabel: "-1 * 1.703125 * 8 = -13.625", x: 340, y: 225, tone: "neutral" },
      ],
      edges: [
        { from: "sign", to: "val", label: "(-1)^1" },
        { from: "exp", to: "val", label: "2^(130-127)" },
        { from: "frac", to: "val", label: "1 + 0.703125" },
      ],
    },
    codeExamples: [
      {
        title: "Inspect Exact IEEE-754 Bits, 0.1+0.2, and Non-Associativity",
        language: "python",
        code: `import struct

def fp32_hex(val: float) -> str:
    bits = struct.unpack(">I", struct.pack(">f", val))[0]
    s = (bits >> 31) & 1
    e = (bits >> 23) & 0xFF
    f = bits & 0x7FFFFF
    return f"0x{bits:08X} (S={s}, E={e}, F=0x{f:06X})"

print("-13.625 ->", fp32_hex(-13.625))
print("0.1 + 0.2 ->", repr(0.1 + 0.2), "| == 0.3?", (0.1 + 0.2) == 0.3)

a, b, c = 1e16, -1e16, 1.0
print("(1e16 + -1e16) + 1.0 =", (a + b) + c)
print("1e16 + (-1e16 + 1.0) =", a + (b + c))`,
        explanation:
          "Uses Python's struct module to inspect raw IEEE-754 binary32 bits and demonstrates floating-point absorption breaking associativity.",
        output: `-13.625 -> 0xC15A0000 (S=1, E=130, F=0x5A0000)
0.1 + 0.2 -> 0.30000000000000004 | == 0.3? False
(1e16 + -1e16) + 1.0 = 1.0
1e16 + (-1e16 + 1.0) = 0.0`,
      },
    ],
    connections: [
      {
        lessonSlug: "binary-hex-signed-integers",
        relationship: "Extends binary positional weights to negative powers of 2 and biased exponents.",
      },
      {
        lessonSlug: "linear-algebra-calculus-for-computing",
        relationship: "Governs numerical stability in matrix transforms, gradients, and shaders.",
      },
      {
        lessonSlug: "inference-kv-cache-quantization",
        relationship: "Connects FP32/BF16/FP8 mantissa-exponent trade-offs to modern LLM quantization.",
      },
    ],
    realWorldApplications: [
      {
        title: "Patriot Missile Time Drift & Financial Decimal Rounding",
        simplifiedVsReal:
          "In math, 1/10 is exact; in binary floating point, 0.1 is a slightly rounded repeating fraction.",
        modernExample:
          "Financial ledgers use integer cents or binary-coded decimal (`Decimal`), never `float`/`double`, and AI trainers use BF16/FP8 with FP32 master accumulators.",
      },
      {
        title: "Kahan Summation & PyTorch Mixed-Precision Reductions",
        simplifiedVsReal:
          "Summing 10 million small gradients into a large accumulator loses the small terms via absorption.",
        modernExample:
          "Deep learning kernels accumulate dot products in FP32 and use pairwise tree reductions or Kahan compensation to preserve accuracy.",
      },
    ],
    misconceptions: [
      {
        myth: "Floating-point arithmetic has random inaccuracies or 'bugs' when 0.1 + 0.2 != 0.3.",
        reality:
          "IEEE-754 is 100% deterministic and exact up to the nearest representable base-2 float; the discrepancy arises because 1/10 has no finite expansion in base 2.",
      },
      {
        myth: "The smallest positive float32 is the smallest normal number (~1.175e-38).",
        reality:
          "Subnormal numbers (E=0, F != 0) extend smoothly down to 2^-149 (~1.40e-45), providing gradual underflow.",
      },
    ],
    revisionNotes: [
      "binary32 uses 1 sign bit, 8 biased exponent bits (bias 127), and 23 fraction bits (24 bits effective precision).",
      "0.1 + 0.2 != 0.3 because 1/5 is an infinite repeating fraction in binary.",
      "Reserved E=255 encodes Infinity (F=0) and NaN (F!=0); E=0 encodes +/-0 and subnormals.",
      "Floating-point addition is NOT associative: large-plus-small causes absorption; subtracting near-equals causes cancellation.",
    ],
    glossaryTermIds: ["ieee-754", "machine-epsilon", "twos-complement"],
    references: [
      {
        title: "What Every Computer Scientist Should Know About Floating-Point Arithmetic",
        author: "David Goldberg",
        url: "https://docs.oracle.com/cd/E19957-01/806-3568/ncg_goldberg.html",
        type: "paper",
        note: "The classic reference on ULPs, rounding error, guard digits, and cancellation.",
      },
      {
        title: "IEEE Standard for Floating-Point Arithmetic (IEEE 754-2019)",
        author: "IEEE Computer Society",
        url: "https://standards.ieee.org/ieee/754/6210/",
        type: "spec",
        note: "Official specification for binary32, binary64, subnormals, rounding modes, and NaNs.",
      },
    ],
    assessments: [
      {
        id: "t1-l11-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "What is the exact IEEE-754 single-precision (binary32) encoding of +6.5?",
        options: [
          {
            id: "a",
            text: "S=0, E=129 (0x81), F=101000... (0x40D00000)",
            explanation:
              "Correct. 6.5 = 110.1_2 = 1.101_2 * 2^2 -> S=0, E=127+2=129 (10000001), F=.1010... -> 0x40D00000.",
          },
          {
            id: "b",
            text: "S=0, E=128 (0x80), F=101000... (0x40500000)",
            explanation: "E=128 corresponds to 2^1, giving 1.625 * 2 = 3.25.",
          },
          {
            id: "c",
            text: "S=0, E=129 (0x81), F=110100... (0x40E80000)",
            explanation: "The leading '1.' before the binary point is implicit and must not be stored in F.",
          },
          {
            id: "d",
            text: "S=1, E=129 (0x81), F=101000... (0xC0D00000)",
            explanation: "S=1 encodes -6.5, not +6.5.",
          },
        ],
        correctAnswer: "a",
        hints: ["Write 6.5 in binary (110.1_2), normalize to 1.xxx * 2^k, then add bias 127."],
        explanation:
          "6.5 = 1.101_2 * 2^2 gives S=0, E = 127 + 2 = 129 (10000001_2), and explicit fraction 101000..._2, forming 0x40D00000.",
        conceptTag: "ieee754-encoding",
      },
      {
        id: "t1-l11-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "In IEEE-754 single precision (23 explicit fraction bits), what is the spacing (ULP) between consecutive representable floats in the interval [8.0, 16.0)? (Express as an exact decimal fraction, e.g., 2^-20.)",
        latex: "\\text{ULP}([2^3, 2^4)) = 2^{3 - 23} = 2^{-20}",
        correctAnswer: 9.5367e-7,
        numericTolerance: 1e-8,
        hints: ["On [2^k, 2^(k+1)), ULP = 2^(k - 23). Here 8.0 = 2^3."],
        explanation:
          "Between 2^3 and 2^4, the exponent is 3 and the LSB of the 23-bit fraction carries weight 2^(3-23) = 2^-20 = 1/1,048,576 ≈ 9.5367e-7.",
        conceptTag: "ulp-spacing",
      },
      {
        id: "t1-l11-q3",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: In IEEE-754 arithmetic, checking `if (x == NaN)` returns `true` whenever `x` holds a NaN bit pattern.",
        correctAnswer: false,
        hints: ["IEEE-754 defines NaN as unordered—even with itself."],
        explanation:
          "False! By IEEE-754 specification, EVERY comparison (`==`, `<`, `>`) involving NaN returns false (and `x != x` is true only for NaN!).",
        conceptTag: "nan-semantics",
      },
      {
        id: "t1-l11-q4",
        type: "mcq",
        difficulty: "rigorous",
        prompt:
          "Why does evaluating `(1e16 + 1.0) - 1e16` in IEEE-754 binary64 produce `0.0` instead of `1.0`?",
        options: [
          {
            id: "a",
            text: "1e16 overflows the 64-bit exponent field",
            explanation: "binary64 supports numbers up to ~1.8e308, far beyond 1e16.",
          },
          {
            id: "b",
            text: "At 1e16 (~2^53.15), ULP is 2.0, so 1.0 is smaller than half a ULP and gets rounded away during addition (absorption)",
            explanation:
              "Correct. Because binary64 has only 53 bits of significand, ULP(1e16) = 2.0, so 1e16 + 1.0 rounds straight back to 1e16.",
          },
          {
            id: "c",
            text: "Subnormal underflow forces 1.0 to zero",
            explanation: "1.0 is a normal float with exponent 0, nowhere near subnormal range (~1e-308).",
          },
          {
            id: "d",
            text: "Floating-point subtraction always discards the smaller operand",
            explanation: "Subtraction works normally when operands are within 2^53 of each other.",
          },
        ],
        correctAnswer: "b",
        hints: ["Compare 1e16 against 2^53 ≈ 9.007e15."],
        explanation:
          "Above 2^53 ≈ 9.007e15, consecutive binary64 integers skip odd numbers (ULP = 2), so adding 1.0 rounds right back to 1e16 via ties-to-even.",
        conceptTag: "absorption-nonassociativity",
      },
    ],
  },

  // =========================================================================
  // LESSON 12: encoding-compression-ecc
  // =========================================================================
  {
    id: "encoding-compression-ecc",
    slug: "encoding-compression-ecc",
    number: 12,
    title: "UTF-8, Entropy Compression & Error-Correcting Codes",
    subtitle:
      "Self-synchronizing Unicode encoding, Shannon's entropy limit, Huffman trees, Hamming ECC, and CRCs",
    trackId: "track-1",
    domainId: "information-representation",
    moduleTitle: "Module 4: Information Representation & Coding",
    chapterTitle: "Chapter 4: Numbers, Text & Error Correction",
    estimatedMinutes: 40,
    difficulty: "intermediate",
    status: "complete",
    prerequisites: ["binary-hex-signed-integers"],
    objectives: [
      "Encode and decode Unicode code points into UTF-8 variable-length byte sequences and explain self-synchronization.",
      "Compute Shannon entropy H(X) for a discrete probability distribution and compare it to fixed-width vs. Huffman code lengths.",
      "Construct a Hamming(7,4) or SECDED code and locate single-bit errors via parity-check syndrome XORs.",
      "Explain why networks pair polynomial CRC error detection with ECC physical-layer protection.",
    ],
    depthExplanations: {
      beginner:
        "Numbers are only half the story—computers also store human text, compress huge files, and survive cosmic rays flipping bits in RAM or static noise corrupting Wi-Fi packets. Early computers used 7-bit ASCII, which covered English letters but broke on accented characters, Chinese, Arabic, and emoji. UTF-8 solved this brilliantly: ASCII stays 1 byte long, while all other 1.1 million Unicode characters smoothly expand into 2, 3, or 4 bytes.\n\nMeanwhile, Claude Shannon proved two astonishing theorems in 1948: first, every data source has a hard compression floor called Entropy $H$; second, by adding carefully structured redundant parity bits (like Hamming codes), a noisy wire or memory stick can detect and even automatically repair bit flips!",
      intermediate:
        "UTF-8 uses unmistakable leading bit prefixes: `0xxxxxxx` (1-byte ASCII), `110xxxxx` (2-byte lead), `1110xxxx` (3-byte lead), `11110xxx` (4-byte lead), and `10xxxxxx` for all continuation bytes. Because continuation bytes never overlap lead bytes or ASCII, a parser jumping into the middle of a stream immediately resynchronizes at the next valid character.\n\nFor lossless compression, Shannon's Source Coding Theorem bounds average bits per symbol $\\bar{L} \\ge H(X) = -\\sum p_i \\log_2 p_i$. Huffman coding builds an optimal prefix-free binary tree satisfying $H(X) \\le \\bar{L} < H(X) + 1$. For reliability, a code with minimum Hamming distance $d_{\\min}$ detects $d_{\\min}-1$ errors and corrects $\\lfloor(d_{\\min}-1)/2\\rfloor$ errors: Hamming(7,4) has $d_{\\min}=3$ (corrects 1 bit); adding an overall parity bit makes SECDED ($d_{\\min}=4$, corrects 1 bit, detects 2).",
      advanced:
        "Huffman coding loses fractional efficiency when symbol probabilities are skewed (e.g., $p = 0.9$ has $H \\approx 0.47$ bits, yet Huffman forces $\\ge 1$ bit/symbol) unless symbols are blocked or replaced by Arithmetic / Asymmetric Numeral Systems (ANS, used in Zstandard and JPEG XL) which hit $H(X)$ within thousandths of a bit.\n\nIn hardware ECC, Hamming codes generalize via linear block codes $H \\cdot \\mathbf{c}^T = \\mathbf{0}$ over $\\mathbb{F}_2$: multiplying a received word $\\mathbf{r} = \\mathbf{c} + \\mathbf{e}$ by the parity-check matrix $H$ yields syndrome $\\mathbf{s} = H\\mathbf{e}^T$. For single-bit error $\\mathbf{e}_j$, $\\mathbf{s}$ equals column $j$ of $H$, pinpointing the corrupted bit in one combinational XOR tree. For burst errors on disks and Ethernet frames, cyclic redundancy checks (CRCs) compute polynomial remainder over $\\mathbb{F}_2[x]$ and Reed-Solomon / LDPC codes recover multi-bit erasures.",
    },
    intuition:
      "Error correction works like a cross-footing grid in an accounting ledger: if every row and every column must sum to an even number, flipping any single cell breaks ONE row sum and ONE column sum—their intersection points directly to the exact corrupted cell so you can flip it right back!",
    technicalTheory:
      "Shannon entropy of a discrete source $X$ with probabilities $\\{p_1, \\dots, p_m\\}$ is:\n\n$$H(X) = -\\sum_{i=1}^{m} p_i \\log_2 p_i \\quad \\text{(bits/symbol)}$$\n\nAny uniquely decodable prefix code satisfies Kraft's inequality $\\sum 2^{-\\ell_i} \\le 1$ and $\\bar{L} \\ge H(X)$.\n\nFor linear error-correcting codes of length $n$, message length $k$, and minimum Hamming distance $d_{\\min} = \\min_{x\\ne y} d_H(x, y)$:\n\n$$\\text{Detectable errors} = d_{\\min} - 1, \\qquad \\text{Correctable errors} = \\left\\lfloor \\frac{d_{\\min} - 1}{2} \\right\\rfloor$$\n\nIn a $(7,4)$ Hamming code with parity positions $1, 2, 4$ and data positions $3, 5, 6, 7$, the 3-bit XOR syndrome $s = (p_4', p_2', p_1')_2$ directly equals the 1-based index of any single flipped bit ($0$ if valid).",
    mechanisms: [
      {
        step: 1,
        title: "UTF-8 Prefix Framing",
        detail:
          "Inspect the top bits of a code point and split its payload bits across 1–4 bytes with non-overlapping lead (110/1110/11110) and continuation (10) tags.",
        stateNote: "Endian-independent byte stream; 100% backward compatible with 7-bit ASCII.",
      },
      {
        step: 2,
        title: "Entropy & Prefix-Free Tree Building",
        detail:
          "Count symbol frequencies, repeatedly merge the two lowest-probability nodes into a binary tree (Huffman), and assign shorter codes to frequent symbols.",
        stateNote: "No codeword is a prefix of another, enabling instant unambiguous decoding.",
      },
      {
        step: 3,
        title: "ECC Parity Encoding (Hamming)",
        detail:
          "Place parity bits at powers-of-2 indices (1, 2, 4, ...), each XORing all bit indices whose binary index shares that power-of-2 bit.",
        stateNote: "64-bit DDR5/server ECC uses 8 check bits (72,64 SECDED) for 12.5% overhead.",
      },
      {
        step: 4,
        title: "Syndrome Decoding & Bit Repair",
        detail:
          "On read, recompute parity XORs to form syndrome S. If S != 0, flip bit S (for single-bit errors) or raise an uncorrectable error exception (if double-bit detected).",
        stateNote: "Executed purely with fast combinational XOR gates in a single memory read.",
      },
    ],
    mathNotes: [
      {
        title: "Shannon Information & Entropy",
        latex: "I(x_i) = -\\log_2 p(x_i), \\qquad H(X) = -\\sum_{i} p(x_i)\\log_2 p(x_i)",
        explanation:
          "A fair coin (p=0.5, 0.5) has H = 1.0 bit; a biased coin (p=0.9, 0.1) has H ≈ 0.469 bits.",
      },
      {
        title: "Hamming Bound (Minimum Parity Bits r)",
        latex: "2^r \\ge k + r + 1",
        explanation:
          "For k = 64 data bits, r = 7 parity bits satisfy 128 >= 72 for single-error correction; adding 1 overall parity bit (r=8) achieves SECDED.",
      },
    ],
    diagram: {
      title: "Hamming(7,4) Parity Coverage & Syndrome Repair",
      caption:
        "Each parity bit (1, 2, 4) checks positions sharing its binary bit; a single flip triggers a unique syndrome pointing straight to the corrupted index.",
      nodes: [
        { id: "p1", label: "Parity p1 (idx 1)", sublabel: "Checks 1,3,5,7", x: 115, y: 65, tone: "accent" },
        { id: "p2", label: "Parity p2 (idx 2)", sublabel: "Checks 2,3,6,7", x: 340, y: 65, tone: "accent" },
        { id: "p4", label: "Parity p4 (idx 4)", sublabel: "Checks 4,5,6,7", x: 565, y: 65, tone: "accent" },
        { id: "data", label: "Data d1..d4", sublabel: "Indices 3,5,6,7", x: 225, y: 205, tone: "emerald" },
        { id: "syn", label: "3-bit Syndrome S", sublabel: "S = (s4,s2,s1)_2 -> Flip bit S!", x: 475, y: 205, tone: "amber" },
      ],
      edges: [
        { from: "data", to: "p1", label: "XOR" },
        { from: "data", to: "p2", label: "XOR" },
        { from: "data", to: "p4", label: "XOR" },
        { from: "p1", to: "syn", label: "s1" },
        { from: "p2", to: "syn", label: "s2" },
        { from: "p4", to: "syn", label: "s4" },
      ],
    },
    codeExamples: [
      {
        title: "UTF-8 Byte Inspection, Shannon Entropy & Hamming(7,4) Repair",
        language: "python",
        code: `import math

# 1. UTF-8 byte lengths: ASCII (1B), accented (2B), CJK (3B), emoji (4B)
for ch in ["A", "é", "中", "🚀"]:
    b = ch.encode("utf-8")
    print(f"'{ch}' U+{ord(ch):05X} -> {len(b)}B: {' '.join(f'{x:08b}' for x in b)}")

# 2. Shannon entropy of biased source
probs = [0.5, 0.25, 0.125, 0.125]
H = -sum(p * math.log2(p) for p in probs)
print(f"Entropy H = {H:.3f} bits/symbol")

# 3. Hamming(7,4) encode 4 bits [d1,d2,d3,d4] -> flip index 6 -> syndrome locates 6
d1, d2, d3, d4 = 1, 0, 1, 1
p1 = d1 ^ d2 ^ d4
p2 = d1 ^ d3 ^ d4
p4 = d2 ^ d3 ^ d4
cw = [0, p1, p2, d1, p4, d2, d3, d4]   # 1-indexed [1..7]
cw[6] ^= 1                             # Inject single-bit cosmic-ray flip at bit 6
s1 = cw[1] ^ cw[3] ^ cw[5] ^ cw[7]
s2 = cw[2] ^ cw[3] ^ cw[6] ^ cw[7]
s4 = cw[4] ^ cw[5] ^ cw[6] ^ cw[7]
err_pos = (s4 << 2) | (s2 << 1) | s1
print(f"Detected & repaired bit index: {err_pos}")`,
        explanation:
          "Demonstrates all three pillars of information coding: UTF-8 prefix bytes, Shannon's entropy bound, and Hamming(7,4) single-error localization.",
        output: `'A' U+00041 -> 1B: 01000001
'é' U+000E9 -> 2B: 11000011 10101001
'中' U+04E2D -> 3B: 11100100 10111000 10101101
'🚀' U+1F680 -> 4B: 11110000 10011111 10011010 10000000
Entropy H = 1.750 bits/symbol
Detected & repaired bit index: 6`,
      },
    ],
    connections: [
      {
        lessonSlug: "binary-hex-signed-integers",
        relationship: "Builds on raw bytes and XOR bitwise logic to encode text, compress streams, and correct faults.",
      },
      {
        lessonSlug: "flash-ssd-storage-controllers",
        relationship: "Applies LDPC/BCH error-correcting codes inside SSD controllers to overcome NAND flash wear.",
      },
      {
        lessonSlug: "physical-layer-ethernet-ip",
        relationship: "Uses CRCs and channel coding to protect frames across noisy copper, fiber, and wireless links.",
      },
      {
        lessonSlug: "probability-statistics-info-theory",
        relationship: "Generalizes Shannon entropy to cross-entropy loss and KL divergence in machine learning.",
      },
    ],
    realWorldApplications: [
      {
        title: "ECC Server RAM, HBM3 & NAND Flash LDPC",
        simplifiedVsReal:
          "Consumer RAM assumes bits never flip; at datacenter scale, cosmic rays and Rowhammer cause silent bit flips daily.",
        modernExample:
          "Server DIMMs add 8 ECC bits per 64 data bits (SECDED), while modern TLC/QLC NAND SSDs rely on heavy LDPC soft-decision ECC just to read stored pages reliably.",
      },
      {
        title: "Why UTF-8 Conquered the Web (>98% of Websites)",
        simplifiedVsReal:
          "UTF-16 looked fixed-width at 2 bytes until Unicode grew past 65,536 characters, forcing surrogate pairs anyway.",
        modernExample:
          "UTF-8 avoids byte-order (BOM) ambiguity, keeps ASCII 1 byte, and never embeds accidental `0x00` null bytes inside multi-byte text.",
      },
    ],
    misconceptions: [
      {
        myth: "Lossless compression algorithms like ZIP or Zstandard can compress any random file smaller if you run them twice.",
        reality:
          "By the Pigeonhole Principle and Shannon's theorem, no lossless algorithm can shrink all inputs—incompressible high-entropy files (or already-compressed files) stay the same size or grow slightly due to headers.",
      },
      {
        myth: "UTF-8 uses 1 byte for every character, or 'char' in C/Java equals one user-visible character.",
        reality:
          "UTF-8 uses 1 to 4 bytes per Unicode code point, and user-perceived grapheme clusters (like family emojis or accented combinations) can span multiple code points.",
      },
    ],
    revisionNotes: [
      "UTF-8 encodes Unicode in 1–4 self-synchronizing bytes (`0...`, `110...`, `1110...`, `11110...` + `10...`).",
      "Shannon Entropy H(X) = -sum(p_i log2 p_i) is the exact theoretical floor for lossless compression.",
      "Minimum Hamming distance d_min detects d_min - 1 errors and corrects floor((d_min - 1)/2) errors.",
      "Hamming(7,4) has d_min = 3 (1-bit correction); SECDED adds an overall parity bit for d_min = 4 (1-bit correct, 2-bit detect).",
    ],
    glossaryTermIds: ["utf-8", "shannon-entropy", "hamming-distance"],
    references: [
      {
        title: "A Mathematical Theory of Communication",
        author: "Claude E. Shannon",
        url: "https://people.math.harvard.edu/~ctm/home/text/others/shannon/entropy/entropy.pdf",
        type: "paper",
        note: "Foundational 1948 paper defining entropy, source coding, and noisy-channel error correction.",
      },
      {
        title: "RFC 3629: UTF-8, a transformation format of ISO 10646",
        author: "Francois Yergeau (IETF)",
        url: "https://datatracker.ietf.org/doc/html/rfc3629",
        type: "spec",
        note: "Official IETF specification of UTF-8 bit prefixes and validity rules.",
      },
    ],
    assessments: [
      {
        id: "t1-l12-q1",
        type: "mcq",
        difficulty: "foundational",
        prompt:
          "You encounter the byte `0xA3` (`1010 0011` in binary) inside a valid UTF-8 byte stream. What role does this byte play?",
        options: [
          {
            id: "a",
            text: "A 1-byte ASCII character",
            explanation: "ASCII bytes always begin with `0xxxxxxx` (0x00–0x7F).",
          },
          {
            id: "b",
            text: "A continuation byte inside a multi-byte sequence",
            explanation:
              "Correct. Every byte starting with `10xxxxxx` (0x80–0xBF) is strictly a continuation byte.",
          },
          {
            id: "c",
            text: "The start of a 2-byte character",
            explanation: "2-byte leading bytes start with `110xxxxx` (0xC2–0xDF).",
          },
          {
            id: "d",
            text: "The start of a 3-byte character",
            explanation: "3-byte leading bytes start with `1110xxxx` (0xE0–0xEF).",
          },
        ],
        correctAnswer: "b",
        hints: ["Look at the top two bits of 0xA3 = 1010 0011."],
        explanation:
          "UTF-8 reserves the prefix `10xxxxxx` exclusively for continuation bytes, making stream resynchronization unambiguous.",
        conceptTag: "utf8-framing",
      },
      {
        id: "t1-l12-q2",
        type: "math",
        difficulty: "intermediate",
        prompt:
          "A stream emits symbols A, B, C, D with probabilities P(A) = 0.5, P(B) = 0.25, P(C) = 0.125, P(D) = 0.125. What is the Shannon entropy H(X) in bits per symbol?",
        latex: "H(X) = -\\left(0.5\\log_2 0.5 + 0.25\\log_2 0.25 + 2 \\cdot 0.125\\log_2 0.125\\right)",
        correctAnswer: 1.75,
        numericTolerance: 0.01,
        hints: ["-log2(0.5)=1, -log2(0.25)=2, -log2(0.125)=3."],
        explanation:
          "H = 0.5(1) + 0.25(2) + 0.125(3) + 0.125(3) = 0.5 + 0.5 + 0.375 + 0.375 = 1.75 bits/symbol. A Huffman code (`0`, `10`, `110`, `111`) hits this bound exactly!",
        conceptTag: "shannon-entropy",
      },
      {
        id: "t1-l12-q3",
        type: "mcq",
        difficulty: "intermediate",
        prompt:
          "An error-correcting code guarantees minimum Hamming distance d_min = 5 between any two valid codewords. What are its exact error detection and correction guarantees?",
        options: [
          {
            id: "a",
            text: "Detects up to 4 bit errors OR corrects up to 2 bit errors",
            explanation:
              "Correct. Detect = d_min - 1 = 4; Correct = floor((5 - 1) / 2) = 2.",
          },
          {
            id: "b",
            text: "Detects up to 5 bit errors OR corrects up to 2 bit errors",
            explanation: "5 bit flips can jump directly from one valid codeword to another 5 bits away, escaping detection.",
          },
          {
            id: "c",
            text: "Detects up to 4 bit errors OR corrects up to 3 bit errors",
            explanation: "3 bit flips are closer to the wrong valid codeword (distance 2) than the original codeword (distance 3).",
          },
          {
            id: "d",
            text: "Detects up to 2 bit errors OR corrects up to 1 bit error",
            explanation: "That corresponds to d_min = 3.",
          },
        ],
        correctAnswer: "a",
        hints: ["Apply detect <= d_min - 1 and correct <= floor((d_min - 1)/2)."],
        explanation:
          "With distance 5 separating valid codewords, up to 4 flips cannot reach another valid codeword (detection), and any 1- or 2-bit error remains strictly closer to its original codeword (correction).",
        conceptTag: "hamming-distance",
      },
      {
        id: "t1-l12-q4",
        type: "true-false",
        difficulty: "foundational",
        prompt:
          "True or False: Extending a Hamming code with one extra overall parity bit (SECDED) allows the hardware to both correct single-bit errors and detect double-bit errors.",
        correctAnswer: true,
        hints: ["Adding an overall parity bit increases minimum Hamming distance from 3 to 4."],
        explanation:
          "True. With d_min = 4, a 1-bit error gives odd overall parity + nonzero Hamming syndrome (correctable), while a 2-bit error gives even overall parity + nonzero Hamming syndrome (detected as uncorrectable).",
        conceptTag: "secded-ecc",
      },
    ],
  },
];
