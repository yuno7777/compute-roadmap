import type { TrackExam } from "@/types/curriculum";

export const TRACK_5_EXAM: TrackExam = {
  id: "exam-track-5",
  trackId: "track-5",
  title: "Track 5 Mastery Exam: Graphics, GPUs & Foundations of ML",
  description:
    "Comprehensive 10-question assessment spanning 4x4 homogeneous transforms, Vector-Jacobian Products, perspective-correct rasterization, BVH path tracing, GPU SIMT warps, CUDA shared-memory Tensor Core GEMMs, information theory, and classical machine learning.",
  passingScore: 70,
  questions: [
    {
      id: "exam5-q1",
      type: "mcq",
      difficulty: "intermediate",
      prompt:
        "In 3D homogeneous coordinates, why do position vectors use w = 1 while direction/normal vectors use w = 0?",
      options: [
        {
          id: "a",
          text: "w = 1 enables the 4th column of a 4x4 matrix to apply affine translation, whereas w = 0 cancels translation",
          explanation:
            "Multiplying a 4x4 affine matrix by [x, y, z, 0]^T zeroes out the translation column [tx, ty, tz].",
        },
        {
          id: "b",
          text: "w = 0 automatically divides the vector to unit length",
          explanation: "w = 0 does not normalize vector magnitude.",
        },
        {
          id: "c",
          text: "w = 1 triggers early-Z culling in the fragment shader",
          explanation: "Early-Z happens after rasterization, unrelated to w=1 vs w=0 semantics.",
        },
        {
          id: "d",
          text: "w = 0 prevents singular value decomposition from failing",
          explanation: "SVD applies to any matrix regardless of homogeneous coordinate flags.",
        },
      ],
      correctAnswer: "a",
      hints: ["Multiply the top 3 rows of [R t; 0 1] by [x, y, z, w]^T."],
      explanation:
        "Setting w=1 adds the translation vector t, whereas w=0 makes directions and normals translation-invariant.",
      conceptTag: "homogeneous-coordinates",
    },
    {
      id: "exam5-q2",
      type: "math",
      difficulty: "intermediate",
      prompt:
        "A 2D triangle has vertices v0=(0,0), v1=(6,0), v2=(0,6). What is the barycentric weight alpha associated with v0 at pixel P=(2, 1)? (Round to 2 decimal places.)",
      latex: "\\alpha = 1 - \\beta - \\gamma",
      correctAnswer: 0.5,
      numericTolerance: 0.01,
      hints: [
        "Since v0 is at the origin and v1=(6,0), v2=(0,6), beta = x/6 and gamma = y/6.",
        "Evaluate alpha = 1 - 2/6 - 1/6.",
      ],
      explanation:
        "For this right triangle, P = (2, 1) = 0.5*(0,0) + (2/6)*(6,0) + (1/6)*(0,6), so beta = 1/3, gamma = 1/6, and alpha = 1 - 1/2 = 0.50.",
      conceptTag: "barycentric-coordinates",
    },
    {
      id: "exam5-q3",
      type: "mcq",
      difficulty: "rigorous",
      prompt:
        "Which combination best resolves Z-fighting on distant terrain in a 3D Vulkan/D3D12 engine?",
      options: [
        {
          id: "a",
          text: "Move the near clip plane from 0.2 m to 0.0001 m and use an 8-bit depth buffer",
          explanation: "Shrinks near plane and precision, making Z-fighting orders of magnitude worse.",
        },
        {
          id: "b",
          text: "Use Reversed-Z (near=1.0, far=0.0) with an FP32 depth buffer and keep the near plane as far out as practical",
          explanation:
            "FP32 exponent density near 0 cancels hyperbolic 1/z compression, yielding uniform depth precision across kilometers.",
        },
        {
          id: "c",
          text: "Disable fragment quad execution",
          explanation: "Quads compute UV derivatives, not depth-buffer precision.",
        },
        {
          id: "d",
          text: "Interpolate texture UVs linearly without dividing by clip-space w",
          explanation: "Causes texture warping and does not affect depth precision.",
        },
      ],
      correctAnswer: "b",
      hints: ["Remember where IEEE-754 floating-point exponent precision is densest."],
      explanation:
        "Reversed-Z maps distant geometry toward 0.0 where FP32 exponents pack billions of representable values, cancelling 1/z nonlinear compression.",
      conceptTag: "reversed-z-depth",
    },
    {
      id: "exam5-q4",
      type: "true-false",
      difficulty: "intermediate",
      prompt:
        "Using the Surface Area Heuristic (SAH) during BVH construction accounts for the fact that random rays intersect larger-surface-area child bounding boxes more frequently than smaller ones.",
      correctAnswer: true,
      hints: ["Look at the SA(L)/SA(P) probability ratio in C_SAH."],
      explanation:
        "True. For convex volumes nested inside a parent volume, geometric hit probability under uniform rays scales directly with surface area ratio SA(child) / SA(parent).",
      conceptTag: "bvh-sah",
    },
    {
      id: "exam5-q5",
      type: "predict-output",
      difficulty: "rigorous",
      prompt:
        "Suppose a 32-thread warp executes `float v = a[lane * 8];` where `a` is 128-byte aligned. How many unique 32-byte L2 cache sectors are fetched by this warp?",
      codeLanguage: "cuda",
      codeSnippet: `// 32 lanes, sizeof(float) = 4 bytes, base_addr = 0
int addr = lane * 8 * 4; // 32 bytes apart per thread`,
      options: [
        { id: "a", text: "4 sectors (128 bytes)", explanation: "That is stride-1 coalesced access." },
        { id: "b", text: "8 sectors (256 bytes)", explanation: "Each thread jumps a full 32-byte sector." },
        { id: "c", text: "16 sectors (512 bytes)", explanation: "Only stride-4 uses 16 sectors." },
        {
          id: "d",
          text: "32 sectors (1024 bytes)",
          explanation:
            "Every lane lands in its own distinct 32-byte sector (0, 32, 64, ..., 992), fetching 32 sectors at 12.5% efficiency.",
        },
      ],
      correctAnswer: "d",
      hints: ["Divide byte step (8 * 4 = 32 bytes) by sector size (32 bytes)."],
      explanation:
        "Each thread skips 32 bytes—precisely one full L2 sector—causing 32 separate sector transactions for 128 bytes of useful float data.",
      conceptTag: "memory-coalescing",
    },
    {
      id: "exam5-q6",
      type: "fill-blank",
      difficulty: "intermediate",
      prompt:
        "Declaring `__shared__ float tile[32][33];` instead of `[32][32]` adds one padding column to eliminate 32-way shared-memory ______ when warps read down a column.",
      correctAnswer: "bank conflicts",
      acceptableAnswers: ["bank conflicts", "bank conflict", "SRAM bank conflicts"],
      hints: ["Shared memory has 32 4-byte modules that collide on stride-32 accesses."],
      explanation:
        "Padding each row by +1 shifts consecutive rows by 1 bank modulo 32, eliminating shared-memory bank conflicts.",
      conceptTag: "bank-conflicts",
    },
    {
      id: "exam5-q7",
      type: "math",
      difficulty: "rigorous",
      prompt:
        "An accelerator has 600 TFLOP/s peak Tensor Core compute and 3.0 TB/s HBM bandwidth. If a custom kernel has an arithmetic intensity of 50 FLOP/byte, what is its Roofline attainable throughput in TFLOP/s?",
      latex: "P_{\\text{attainable}} = \\min\\left(P_{\\text{peak}},\\; B_{\\text{HBM}} \\cdot I\\right)",
      correctAnswer: 150,
      numericTolerance: 0.1,
      hints: ["Compare Peak (600) against Bandwidth * Intensity (3.0 * 50)."],
      explanation:
        "Ridge point is 600 / 3.0 = 200 FLOP/byte. At I = 50 FLOP/byte, the kernel is memory-bound at 3.0 TB/s * 50 FLOP/B = 150 TFLOP/s.",
      conceptTag: "roofline-model",
    },
    {
      id: "exam5-q8",
      type: "mcq",
      difficulty: "intermediate",
      prompt:
        "If a language model achieves a cross-entropy loss of H(P, Q) = 2.0 bits/token while the true entropy of the text source is H(P) = 1.2 bits/token, what is the KL divergence D_KL(P || Q) in bits/token?",
      options: [
        {
          id: "a",
          text: "0.8 bits/token",
          explanation: "Since H(P, Q) = H(P) + D_KL(P || Q), D_KL = 2.0 - 1.2 = 0.8 bits/token.",
        },
        { id: "b", text: "3.2 bits/token", explanation: "Cross-entropy is the sum, not the difference." },
        { id: "c", text: "1.67 bits/token", explanation: "KL divergence subtracts entropy rather than dividing." },
        { id: "d", text: "0.0 bits/token", explanation: "D_KL is zero only when Q equals P everywhere." },
      ],
      correctAnswer: "a",
      hints: ["Recall H(P, Q) = H(P) + D_KL(P || Q)."],
      explanation:
        "Cross-entropy equals true entropy plus excess KL divergence: 2.0 - 1.2 = 0.8 bits/token.",
      conceptTag: "kl-divergence",
    },
    {
      id: "exam5-q9",
      type: "matching",
      difficulty: "foundational",
      prompt: "Match each ML concept to its defining property or effect.",
      matchingPairs: [
        { id: "m1", left: "Maximum Likelihood (Gaussian)", right: "Produces Mean Squared Error loss" },
        { id: "m2", left: "Maximum Likelihood (Categorical)", right: "Produces Softmax Cross-Entropy loss" },
        { id: "m3", left: "Random Forest (Bagging)", right: "Reduces variance by averaging deep trees" },
        { id: "m4", left: "XGBoost (Boosting)", right: "Reduces bias via sequential gradient/Hessian trees" },
      ],
      correctAnswer: {
        m1: "Produces Mean Squared Error loss",
        m2: "Produces Softmax Cross-Entropy loss",
        m3: "Reduces variance by averaging deep trees",
        m4: "Reduces bias via sequential gradient/Hessian trees",
      },
      hints: ["Connect likelihood noise models to losses and ensemble directions to bias vs. variance."],
      explanation:
        "Gaussian NLL yields MSE, Categorical NLL yields cross-entropy, Bagging slashes variance, and Boosting slashes bias.",
      conceptTag: "mle-and-ensembles",
    },
    {
      id: "exam5-q10",
      type: "multi-select",
      difficulty: "intermediate",
      prompt:
        "Which statements accurately contrast Tile-Based Deferred Rendering (TBDR) against traditional immediate-mode desktop rasterization?",
      options: [
        {
          id: "a",
          text: "TBDR bins transformed primitives into screen tiles before fragment shading",
          explanation: "Correct—vertex outputs are binned per tile first.",
        },
        {
          id: "b",
          text: "TBDR performs hidden-surface removal and blending inside on-chip SRAM tile memory to slash DRAM traffic",
          explanation: "Correct—only final resolved tile colors write out to DRAM.",
        },
        {
          id: "c",
          text: "TBDR cannot run programmable fragment shaders",
          explanation: "Incorrect—TBDR runs full Vulkan/Metal fragment shaders on visible fragments.",
        },
        {
          id: "d",
          text: "TBDR requires replacing triangles with ray-traced BVHs",
          explanation: "Incorrect—TBDR is a tile-based rasterization architecture.",
        },
      ],
      correctAnswer: ["a", "b"],
      hints: ["Focus on tile binning and on-chip SRAM bandwidth savings."],
      explanation:
        "TBDR bins geometry into screen tiles and keeps depth/color attachments in fast on-chip SRAM, drastically lowering mobile memory bandwidth and energy.",
      conceptTag: "tbdr-pipeline",
    },
  ],
};

export const TRACK_6_EXAM: TrackExam = {
  id: "exam-track-6",
  trackId: "track-6",
  title: "Track 6 Mastery Exam: Deep Learning, Modern AI & Frontiers",
  description:
    "Comprehensive 10-question assessment spanning reverse-mode autodiff, ResNets & attention, BPE/RoPE Transformers, MoE & Mamba SSMs, Chinchilla scaling, 3D parallelism, DPO/RLVR, FlashAttention, KV-cache quantization, High-NA EUV, chiplets, TPUs, and surface-code qubits.",
  passingScore: 70,
  questions: [
    {
      id: "exam6-q1",
      type: "debugging",
      difficulty: "intermediate",
      prompt:
        "A PyTorch training loop suffers exploding NaN loss on step 1 when training a deep 50-layer ReLU network without normalization. Inspect the initialization snippet and pick the bug.",
      codeLanguage: "python",
      codeSnippet: `for layer in model.linears:
    # Weights initialized with std = 1.0 regardless of fan_in=512!
    nn.init.normal_(layer.weight, mean=0.0, std=1.0)`,
      options: [
        {
          id: "a",
          text: "std=1.0 multiplies activation variance by fan_in/2 = 256 per layer, overflowing FP32 across 50 layers; Kaiming init sqrt(2/512)=0.0625 is needed",
          explanation:
            "Without 1/sqrt(fan_in) scaling, variance grows exponentially by 256^50 and overflows immediately.",
        },
        {
          id: "b",
          text: "mean should be initialized to 1.0 instead of 0.0",
          explanation: "Nonzero mean accelerates exponential blowup.",
        },
        {
          id: "c",
          text: "ReLU requires AdamW beta2 = 0.0 to stabilize",
          explanation: "The blowup happens in the forward pass before the optimizer even steps.",
        },
        {
          id: "d",
          text: "Kaiming init is only valid for Sigmoid, not ReLU",
          explanation: "Kaiming init was specifically derived for ReLU/PReLU.",
        },
      ],
      correctAnswer: "a",
      hints: ["Compute Var(z) = fan_in * Var(W) * 0.5 * Var(a)."],
      explanation:
        "Kaiming initialization sets std = sqrt(2 / fan_in) = 0.0625 so forward activation variance stays ~1.0 across depth.",
      conceptTag: "kaiming-initialization",
    },
    {
      id: "exam6-q2",
      type: "math",
      difficulty: "foundational",
      prompt:
        "An image tensor passes through `Conv2d(in_channels=16, out_channels=32, kernel_size=3, stride=1, padding=1, bias=False)`. How many trainable scalar parameters are in this layer?",
      correctAnswer: 4608,
      numericTolerance: 0,
      hints: ["Compute C_out * C_in * K_h * K_w."],
      explanation: "32 * 16 * 3 * 3 = 4,608 parameters (independent of image height/width).",
      conceptTag: "conv-params",
    },
    {
      id: "exam6-q3",
      type: "mcq",
      difficulty: "intermediate",
      prompt:
        "Why does Rotary Position Embedding (RoPE) preserve relative token distance (n - m) inside Transformer attention scores?",
      options: [
        {
          id: "a",
          text: "Because rotating Query by m*theta and Key by n*theta satisfies (R_m q)^T (R_n k) = q^T R_{n-m} k",
          explanation:
            "Orthogonal 2D rotation matrices satisfy R_m^T R_n = R_{n-m}, making dot products depend strictly on relative offset.",
        },
        {
          id: "b",
          text: "Because RoPE adds a learned absolute table to the Value tensor V",
          explanation: "RoPE rotates Q and K and never touches V.",
        },
        {
          id: "c",
          text: "Because RoPE replaces softmax with a 1D convolution",
          explanation: "Attention still uses standard scaled dot-product softmax.",
        },
        {
          id: "d",
          text: "Because RoPE zeroes out weights beyond position 512",
          explanation: "RoPE uses periodic sin/cos rotations defined for arbitrary positions.",
        },
      ],
      correctAnswer: "a",
      hints: ["Use the transpose identity R(theta)^T = R(-theta) for rotation matrices."],
      explanation:
        "Since 2D rotation matrices are orthogonal and additive in angle, R_m^T R_n = R_{n-m}, injecting relative displacement directly into QK^T.",
      conceptTag: "rope-math",
    },
    {
      id: "exam6-q4",
      type: "multi-select",
      difficulty: "rigorous",
      prompt:
        "Which architectural tradeoffs apply to a sparse Mixture-of-Experts (MoE) LLM compared to a dense LLM with the same active parameters per token?",
      options: [
        {
          id: "a",
          text: "Higher total HBM memory capacity is required because all N experts must remain loaded",
          explanation: "Correct—active FLOPs shrink, but total parameter VRAM remains N-fold larger.",
        },
        {
          id: "b",
          text: "Distributed serving/training requires All-to-All communication when experts sit across GPUs",
          explanation: "Correct—tokens route dynamically to experts on other ranks.",
        },
        {
          id: "c",
          text: "Greater knowledge capacity per unit of inference FLOPs",
          explanation: "Correct—MoE decouples parameter capacity from per-token compute.",
        },
        {
          id: "d",
          text: "KV cache size per token shrinks by N/k automatically",
          explanation: "Incorrect—MoE replaces FFNs, not attention KV caches.",
        },
      ],
      correctAnswer: ["a", "b", "c"],
      hints: ["Separate FFN expert capacity/VRAM/comms from attention KV caching."],
      explanation:
        "MoE boosts capacity per FLOP at the cost of storing all N experts in HBM and running All-to-All dispatch; KV-cache size depends on attention GQA/layers, not MoE experts.",
      conceptTag: "moe-tradeoffs",
    },
    {
      id: "exam6-q5",
      type: "ordering",
      difficulty: "foundational",
      prompt:
        "Order the four stages of building a frontier reasoning LLM from raw text corpora to deployment.",
      orderingItems: [
        "Quantization & PagedAttention Inference Serving",
        "Supervised Fine-Tuning (SFT) on Instruction Dialogues",
        "Autoregressive Pretraining (C ~ 6ND)",
        "RLHF / DPO / Verifiable-Reward RL (RLVR)",
      ],
      correctAnswer: [
        "Autoregressive Pretraining (C ~ 6ND)",
        "Supervised Fine-Tuning (SFT) on Instruction Dialogues",
        "RLHF / DPO / Verifiable-Reward RL (RLVR)",
        "Quantization & PagedAttention Inference Serving",
      ],
      hints: ["Base knowledge first, then instruction formatting, alignment/RL, and serving optimization."],
      explanation:
        "LLMs progress from Pretraining -> SFT -> RLHF/DPO/RLVR -> Quantized Serving.",
      conceptTag: "llm-lifecycle",
    },
    {
      id: "exam6-q6",
      type: "math",
      difficulty: "rigorous",
      prompt:
        "A 70B parameter model is served in INT4 weights (0.5 bytes/param) on a GPU with 3.5 TB/s HBM bandwidth. Ignoring KV cache overhead, approximately what is the minimum theoretical time in milliseconds to stream all weights once for 1 decode step? (35 GB / 3500 GB/s in ms, rounded to 1 decimal place.)",
      correctAnswer: 10,
      numericTolerance: 0.5,
      hints: [
        "Compute weight bytes = 70e9 * 0.5 = 35e9 bytes = 35 GB.",
        "Time = 35 GB / 3500 GB/s = 0.01 s = 10 ms.",
      ],
      explanation:
        "35 * 10^9 bytes / (3.5 * 10^12 bytes/s) = 0.010 seconds = 10.0 ms per decode step.",
      conceptTag: "decode-roofline",
    },
    {
      id: "exam6-q7",
      type: "true-false",
      difficulty: "intermediate",
      prompt:
        "FlashAttention achieves its speedup by dropping low-magnitude attention weights with an approximate sparsity threshold, producing slightly different outputs than standard softmax attention.",
      correctAnswer: false,
      hints: ["Recall online softmax rescaling across K/V tiles."],
      explanation:
        "False. FlashAttention is mathematically exact (to floating-point associativity), deriving its speedup from IO-aware SM SRAM tiling rather than approximation.",
      conceptTag: "flash-attention-exactness",
    },
    {
      id: "exam6-q8",
      type: "fill-blank",
      difficulty: "intermediate",
      prompt:
        "Replacing separate Key/Value heads per Query head with shared KV heads across groups of Query heads—cutting KV-cache memory and decode bandwidth proportionally—is called ______.",
      correctAnswer: "Grouped-Query Attention",
      acceptableAnswers: ["Grouped-Query Attention", "GQA", "Grouped Query Attention"],
      hints: ["Three words (or acronym GQA), sitting between MHA and MQA."],
      explanation:
        "Grouped-Query Attention (GQA) shares each K/V head across a group of query heads, preserving quality near MHA while slashing KV-cache size.",
      conceptTag: "gqa",
    },
    {
      id: "exam6-q9",
      type: "mcq",
      difficulty: "intermediate",
      prompt:
        "How does speculative decoding accelerate autoregressive LLM inference without degrading output quality?",
      options: [
        {
          id: "a",
          text: "A small draft model proposes gamma tokens and the target LLM verifies all gamma+1 positions in one parallel forward pass using lossless rejection sampling",
          explanation:
            "Batching verification across gamma+1 tokens turns memory-bound 1-token steps into higher-arithmetic-intensity batched forward passes while preserving the target distribution.",
        },
        {
          id: "b",
          text: "It skips every second Transformer layer during decoding",
          explanation: "Layer skipping changes model output; speculative decoding is mathematically lossless.",
        },
        {
          id: "c",
          text: "It replaces BPE tokenization with character-level ASCII",
          explanation: "Both draft and target models share the exact same vocabulary.",
        },
        {
          id: "d",
          text: "It eliminates the KV cache completely",
          explanation: "KV caching is still maintained for accepted tokens.",
        },
      ],
      correctAnswer: "a",
      hints: ["Why is scoring 5 tokens at once on a GPU almost as fast as scoring 1 token?"],
      explanation:
        "Because single-request decode is HBM-bandwidth-bound, verifying gamma draft tokens in one forward pass costs almost the same memory traffic as 1 token while emitting multiple accepted tokens.",
      conceptTag: "speculative-decoding",
    },
    {
      id: "exam6-q10",
      type: "mcq",
      difficulty: "rigorous",
      prompt:
        "Which frontier hardware statement accurately connects 0.55 High-NA EUV, chiplets, systolic arrays, and surface-code quantum computers?",
      options: [
        {
          id: "a",
          text: "High-NA EUV prints sub-2nm GAAFET dies, CoWoS/UCIe chiplets bypass the ~858 mm^2 reticle limit, systolic TPUs minimize register-file energy on dense matmuls, and surface codes use many physical qubits per logical qubit",
          explanation:
            "Every physical, packaging, architectural, and quantum scaling principle matches real-world frontier engineering.",
        },
        {
          id: "b",
          text: "High-NA EUV uses 193 nm DUV lasers to print single-chip 5,000 mm^2 systolic TPUs with built-in room-temperature logical qubits",
          explanation: "EUV uses 13.5 nm light, reticle limits cap dies at ~858 mm^2, and superconducting qubits operate near millikelvin temperatures.",
        },
        {
          id: "c",
          text: "Quantum surface codes eliminate all physical noise with 1 physical qubit per logical qubit",
          explanation: "Surface codes require dozens to ~1,000+ physical qubits per fault-tolerant logical qubit.",
        },
        {
          id: "d",
          text: "Systolic arrays execute divergent C++ pointer chasing faster than CPUs via out-of-order execution",
          explanation: "Systolic arrays lack OoO branch hardware and are specialized for regular tensor operations.",
        },
      ],
      correctAnswer: "a",
      hints: ["Verify EUV wavelength/NA, reticle limits, systolic dataflow, and QEC overhead."],
      explanation:
        "0.55-NA 13.5 nm EUV shrinks transistor pitch, chiplets overcome reticle and yield walls, systolic arrays stream neighbor-to-neighbor MACs, and surface codes encode fault-tolerant logical qubits across 2D physical lattices.",
      conceptTag: "computing-frontiers-synthesis",
    },
  ],
};
