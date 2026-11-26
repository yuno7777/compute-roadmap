import type { PlainEnglishGuide } from "./track12";

export const TRACK_5_6_PLAIN_GUIDES: Record<string, PlainEnglishGuide> = {
  "linear-algebra-calculus-for-computing": {
    bigPicture:
      "You don't need to love abstract proofs to use linear algebra and calculus in computing! A Vector is simply a list of numbers (a 3D point or a word's features). A Matrix is a machine that transforms vectors—rotating a 3D character or mixing features inside a neural network—in one grid of multiplications. And a Derivative / Gradient is just a compass telling you: 'If I nudge this weight slightly up, does the error go up or down, and by how much?'",
    howItInteracts:
      "These exact operations power 3D camera projection (Lesson 46), GPU Tensor Core matrix multiplication (Lesson 49), and backpropagation inside deep learning (Lesson 52). Even numerical slope estimation shows why IEEE-754 rounding (Lesson 11) limits how tiny a step `h` you can take.",
    symbolDecoder: [
      {
        symbol: "Vector (x) & Dot Product (a · b)",
        plainName: "Number List & Alignment Score",
        whatItMeans:
          "Multiply matching entries and sum them up. Big positive dot product = vectors point the same way (used in lighting & AI attention!).",
      },
      {
        symbol: "Matrix (W or M)",
        plainName: "Space-Warping Grid",
        whatItMeans:
          "Multiplying W × x rotates, scales, translates (in 4×4 homogeneous form), or projects a vector into a new space.",
      },
      {
        symbol: "Gradient (∇L)",
        plainName: "Slope Compass for Every Weight",
        whatItMeans:
          "Points uphill toward higher error—so subtracting a tiny multiple of the gradient steps downhill to lower error.",
      },
      {
        symbol: "SVD (U Σ Vᵀ)",
        plainName: "Main-Directions X-Ray",
        whatItMeans:
          "Breaks any matrix into its strongest stretch directions (singular values σ), powering compression, PCA, and LoRA adapters.",
      },
    ],
  },
  "pixels-rasterization-shaders": {
    bigPicture:
      "Every 3D video game scene is just a list of triangles floating in 3D coordinates. The graphics pipeline turns them into a flat 2D screen image in three clear steps: (1) Vertex Shaders multiply each triangle corner by the camera's MVP matrix to place it on screen, (2) the Rasterizer figures out which screen pixels fall inside each triangle and uses a Z-buffer (depth map) so closer objects hide farther ones, and (3) Fragment Shaders compute the final RGB color of every pixel using lighting and textures.",
    howItInteracts:
      "Because millions of pixels and vertices can be shaded completely independently, rasterization is the historical reason GPUs were invented with thousands of parallel cores (Lesson 48).",
    symbolDecoder: [
      {
        symbol: "MVP Matrix",
        plainName: "Model → View → Projection",
        whatItMeans:
          "Three 4×4 matrices multiplied together to move a 3D object into the world, place it in front of the camera, and add 3D perspective.",
      },
      {
        symbol: "Barycentric Weights",
        plainName: "3-Corner Blend Percentages",
        whatItMeans:
          "Three numbers summing to 1 that tell a pixel inside a triangle how to smoothly blend colors, depths, and textures from its 3 corners.",
      },
      {
        symbol: "Z-Buffer (Depth Buffer)",
        plainName: "Closest-Surface Scorecard",
        whatItMeans:
          "Stores the depth of the closest triangle drawn at each pixel so background triangles never overwrite foreground ones.",
      },
    ],
  },
  "ray-tracing-graphics-pipelines": {
    bigPicture:
      "Rasterization cheats shadows and reflections by projecting triangles onto a screen. Ray Tracing simulates real physics backwards: shoot virtual light rays out from each screen pixel into the 3D scene, bounce them off mirrors and glossy surfaces, and check whether they can see a light source! Checking every ray against millions of triangles would crawl, so GPUs wrap objects in nested bounding boxes (a BVH tree) to skip 99.9% of empty space in microseconds.",
    howItInteracts:
      "BVH trees apply balanced-tree partitioning (Lesson 34) to 3D geometry, while modern GPUs add dedicated RT Cores alongside SIMT shaders (Lesson 48) and AI denoisers to run ray tracing at 60+ fps.",
    symbolDecoder: [
      {
        symbol: "Ray (o + t·d)",
        plainName: "Virtual Light Line",
        whatItMeans:
          "Starts at origin `o` (the camera or hit point) and marches along direction `d` by distance `t` to find the nearest surface hit.",
      },
      {
        symbol: "BVH (Bounding Volume Hierarchy)",
        plainName: "Nested Box Shortcut Tree",
        whatItMeans:
          "Groups nearby triangles inside boxes—if a ray misses the outer box, it skips every triangle inside it in one test.",
      },
      {
        symbol: "Monte Carlo Path Tracing",
        plainName: "Random Bounce Averaging",
        whatItMeans:
          "Fires many randomly bounced rays per pixel and averages them to capture soft shadows and realistic global bounce lighting.",
      },
    ],
  },
  "gpu-simt-warps-memory": {
    bigPicture:
      "A CPU is like 8 PhD chefs who each cook complex, unpredictable dishes as fast as possible. A GPU is like 10,000 line cooks who all follow the exact same recipe step in lockstep! GPUs group 32 threads into a 'Warp' that executes one shared instruction together (SIMT). If an `if/else` makes half the warp take a different path ('Warp Divergence'), the warp has to run both halves sequentially—and if neighboring threads read scattered RAM addresses instead of side-by-side ('Coalesced') addresses, memory bandwidth collapses.",
    howItInteracts:
      "Understanding warps, coalescing, and on-chip Shared Memory explains why naive GPU code is slow, how tiled matrix multiplication works (Lesson 49), and why FlashAttention transforms LLM speed (Lesson 57).",
    symbolDecoder: [
      {
        symbol: "SIMT & Warp (32 Threads)",
        plainName: "Lockstep 32-Lane Squad",
        whatItMeans:
          "32 GPU threads share one instruction fetch and execute the same operation on 32 different data items simultaneously.",
      },
      {
        symbol: "Warp Divergence",
        plainName: "Split-Branch Slowdown",
        whatItMeans:
          "When threads inside the same 32-thread warp disagree on an `if/else`, inactive lanes are masked off and both branches run one after the other.",
      },
      {
        symbol: "Memory Coalescing",
        plainName: "Bundled Cache-Line Reads",
        whatItMeans:
          "When all 32 lanes read adjacent memory addresses, the GPU merges them into 1 single 128-byte DRAM transaction instead of 32 separate trips.",
      },
    ],
  },
  "cuda-kernels-tensor-cores": {
    bigPicture:
      "Multiplying huge matrices is the #1 workload in modern AI. Reading every number straight from slow GPU HBM memory for every multiply wastes 95% of the chip's speed waiting on memory. Fast CUDA kernels fix this with 'Tiling': a block of threads cooperatively loads small tiles into ultra-fast on-chip Shared SRAM, reuses every number dozens of times, and feeds dedicated Tensor Cores—specialized hardware units that multiply entire 4×4 or 16×16 matrix chunks in a single clock cycle!",
    howItInteracts:
      "Tiled GEMM and Tensor Cores are the physical engine underneath PyTorch, deep learning backprop (Lesson 52), and every frontier LLM (Lessons 54–57).",
    symbolDecoder: [
      {
        symbol: "CUDA Kernel / Grid / Block",
        plainName: "Parallel Launch Hierarchy",
        whatItMeans:
          "A Kernel is a function launched across a Grid of Thread Blocks; threads in the same Block can share fast on-chip SRAM and synchronize.",
      },
      {
        symbol: "Shared Memory Tiling",
        plainName: "On-Chip Scratchpad Reuse",
        whatItMeans:
          "Loads a small sub-matrix once from HBM into fast SRAM so every thread in the block reuses it without hitting slow memory again.",
      },
      {
        symbol: "Tensor Core",
        plainName: "Matrix-Multiply Hardware Unit",
        whatItMeans:
          "Dedicated silicon that computes D = A × B + C on small FP16/BF16/FP8 matrices in one instruction—delivering 10× more FLOPs than scalar CUDA cores.",
      },
    ],
  },
  "probability-statistics-info-theory": {
    bigPicture:
      "Probability is how computers reason under uncertainty—assigning scores between 0 and 1 to possible outcomes. Information Theory turns probability into bits: a surprising rare event carries LOTS of information (−log₂ p bits), while an obvious guaranteed event carries 0 bits! Entropy H(p) is the average surprise of a source, Cross-Entropy H(p, q) measures how many extra bits a model wastes when its guesses q don't match reality p, and KL Divergence is that exact wasted penalty—which is literally what AI training tries to drive to zero.",
    howItInteracts:
      "Cross-entropy is the loss function behind logistic regression (Lesson 51), image classifiers (Lesson 53), and next-token LLM pretraining (Lesson 56), while KL divergence keeps RLHF models from drifting too far from sensible language.",
    symbolDecoder: [
      {
        symbol: "Surprise (−log₂ p)",
        plainName: "Information in One Event",
        whatItMeans:
          "If an event has 50% chance (p=0.5), seeing it gives 1 bit; if it has 12.5% chance (p=0.125), seeing it gives 3 bits of surprise.",
      },
      {
        symbol: "Entropy H(p)",
        plainName: "Minimum Average Bits Needed",
        whatItMeans:
          "The average surprise of a distribution—highest (1 bit for a coin) when outcomes are 50/50 and completely unpredictable.",
      },
      {
        symbol: "Cross-Entropy & KL Divergence",
        plainName: "Model Mistake Cost",
        whatItMeans:
          "Cross-entropy H(p, q) = H(p) + D_KL(p ‖ q). Minimizing cross-entropy forces the model's predicted probabilities q to match true data p.",
      },
    ],
  },
  "classical-machine-learning": {
    bigPicture:
      "Instead of hand-coding `if` rules for every case, Machine Learning lets a program discover a mathematical rule from labeled examples by minimizing a Loss (mistake) score. The central balancing act is the Bias-Variance Tradeoff: a model too simple ('underfitting / high bias') misses real patterns; a model too complex ('overfitting / high variance') memorizes the training noise and fails on new data. Regularization and held-out test sets keep models honest.",
    howItInteracts:
      "Gradient descent, regularization, train/validation splits, and cross-entropy loss carry over 1-to-1 into deep neural networks (Lesson 52)—while Gradient Boosted Trees (XGBoost) remain the king of structured spreadsheet/tabular data.",
    symbolDecoder: [
      {
        symbol: "Loss Function",
        plainName: "Mistake Scoreboard",
        whatItMeans:
          "A single number measuring how wrong the model's predictions are (e.g., Mean Squared Error for numbers, Cross-Entropy for categories).",
      },
      {
        symbol: "Bias vs. Variance",
        plainName: "Too Simple vs. Memorized Noise",
        whatItMeans:
          "High bias = model is too rigid to fit the real pattern. High variance = model overfits training quirks and stumbles on unseen examples.",
      },
      {
        symbol: "Regularization (L1/L2)",
        plainName: "Complexity Penalty",
        whatItMeans:
          "Adds a small penalty for huge weights so the model prefers smoother, simpler solutions that generalize better.",
      },
    ],
  },
  "neural-networks-backpropagation": {
    bigPicture:
      "A neural network is a stack of simple layers: each neuron takes a weighted sum of its inputs and passes it through a tiny non-linear bend (an Activation Function like ReLU or Tanh—without that bend, 100 stacked layers would collapse into 1 boring straight line!). Training uses Backpropagation: first run data forward to measure the mistake, then walk backward layer by layer using the chain rule to assign exact credit or blame (gradients) to every single weight so the optimizer nudges them slightly closer to right.",
    howItInteracts:
      "Backpropagation is just the Vector-Jacobian Product from Lesson 45 automated over a computation graph, executed on GPU Tensor Cores (Lesson 49), and scaled up to become CNNs, Attention, and Transformers (Lessons 53–54).",
    symbolDecoder: [
      {
        symbol: "Activation (ReLU / GELU / Tanh)",
        plainName: "Non-Linear Curve Maker",
        whatItMeans:
          "Bends straight lines (e.g., ReLU sets negatives to 0) so stacked layers can carve curved, complex decision boundaries like XOR or spirals.",
      },
      {
        symbol: "Backpropagation",
        plainName: "Automatic Blame Assignment",
        whatItMeans:
          "Applies the calculus chain rule in reverse from the final loss back to every weight in one efficient pass.",
      },
      {
        symbol: "Learning Rate (η)",
        plainName: "Optimizer Step Size",
        whatItMeans:
          "How big a nudge each weight gets per step—too tiny trains forever; too huge overshoots and explodes.",
      },
    ],
  },
  "cnns-rnns-attention": {
    bigPicture:
      "Different data types have different built-in structure. Images look the same whether a cat sits on the left or right, so Convolutional Neural Networks (CNNs) slide small shared pattern detectors across pixels. Text and audio unfold over time, so RNNs carried a rolling summary forward word-by-word—but forgot distant words and couldn't train in parallel. Attention broke that bottleneck by letting every token look directly at *every* other token in one parallel step!",
    howItInteracts:
      "Residual 'skip connections' (adding a layer's input straight to its output) stopped gradients from vanishing in deep networks and—paired with Attention—became the exact architecture of modern Transformers (Lesson 54).",
    symbolDecoder: [
      {
        symbol: "Convolution Kernel",
        plainName: "Sliding Pattern Filter",
        whatItMeans:
          "A tiny weight grid (e.g., 3×3) slid over an image to detect edges, textures, or shapes anywhere in the frame.",
      },
      {
        symbol: "Residual Connection (x + F(x))",
        plainName: "Gradient Highway",
        whatItMeans:
          "Adds the layer's input straight to its output so gradients flow cleanly backward through 100+ layers without shrinking to zero.",
      },
      {
        symbol: "Attention",
        plainName: "Dynamic Relevance Lookup",
        whatItMeans:
          "Computes a relevance weight between every pair of tokens so distant context ('The cat... it sat') connects directly in 1 hop.",
      },
    ],
  },
  "transformers-tokenization-embeddings": {
    bigPicture:
      "How does an LLM turn text into an intelligent reply? First, a BPE Tokenizer slices text into frequent sub-word pieces ('tokens') and looks up each token's meaning vector ('embedding'). Then, inside each Transformer block, Self-Attention lets every token ask a Query ('what am I looking for?'), match it against every earlier token's Key ('what do I offer?'), and blend their Values using Softmax probabilities—while RoPE rotates vectors slightly by position so the model knows word order.",
    howItInteracts:
      "Transformers combine BPE compression (Lesson 12), dot-product similarity (Lesson 45), softmax probability (Lesson 50), and GPU matrix multiplications (Lesson 49) into one massively parallelizable architecture.",
    symbolDecoder: [
      {
        symbol: "BPE Token",
        plainName: "Common Sub-Word Piece",
        whatItMeans:
          "Frequent chunks of characters learned by iteratively merging the most common adjacent pairs—balancing small vocabulary with short sequences.",
      },
      {
        symbol: "Q, K, V (Query, Key, Value)",
        plainName: "Search Request · Label · Payload",
        whatItMeans:
          "Each token projects into Q (what it seeks), K (what it advertises), and V (the info it shares if matched).",
      },
      {
        symbol: "1 / √d_k Scaling & Causal Mask",
        plainName: "Softmax Stabilizer & No-Peeking Shield",
        whatItMeans:
          "Dividing by √d_k keeps dot products from saturating softmax; the causal mask sets future tokens to −∞ so the model can't cheat by peeking ahead.",
      },
    ],
  },
  "moe-ssm-multimodal-reasoning": {
    bigPicture:
      "Running a giant dense Transformer on every single word is expensive. Mixture of Experts (MoE) splits the feed-forward layer into many specialist sub-networks and uses a lightweight Router to wake up only 2 experts per token—giving you a huge brain at a fraction of the compute! Meanwhile, State-Space Models (like Mamba) compress history into a fixed-size state for linear $O(n)$ long-context speed, Multimodal models project image/audio patches into the same token stream, and Reasoning models spend extra test-time tokens thinking step-by-step.",
    howItInteracts:
      "MoE routing creates distributed all-to-all GPU communication challenges during training (Lesson 56), while linear-time SSMs directly attack the quadratic attention and KV-cache memory wall (Lesson 57).",
    symbolDecoder: [
      {
        symbol: "MoE (Mixture of Experts)",
        plainName: "Sparse Specialist Routing",
        whatItMeans:
          "Stores many expert FFN blocks in memory but activates only the top-k (e.g., 2 of 8) per token, decoupling parameter count from FLOPs.",
      },
      {
        symbol: "SSM (Mamba / S4)",
        plainName: "Selective Rolling-State Model",
        whatItMeans:
          "Updates a compact hidden state per token with input-dependent gates—giving fast $O(n)$ long-context inference without a growing KV cache.",
      },
      {
        symbol: "Test-Time Compute",
        plainName: "Thinking Longer Before Answering",
        whatItMeans:
          "Allocating extra reasoning/verification tokens (or looped transformer passes) at inference time to solve harder math and coding problems.",
      },
    ],
  },
  "llm-pretraining-posttraining-rl": {
    bigPicture:
      "Frontier AI models are built in three distinct stages. (1) Pretraining reads trillions of web/code tokens using pure next-token prediction (minimizing cross-entropy NLL)—teaching broad world knowledge and syntax. (2) Supervised Fine-Tuning (SFT) shows curated prompt-response examples so the model acts like a helpful assistant. (3) Reinforcement Learning (RLHF, DPO, or verifiable-reward RL/GRPO) scores full sampled answers and shifts the policy toward higher-reward behavior while a KL penalty stops it from forgetting coherent language.",
    howItInteracts:
      "Training trillion-token models spans thousands of GPUs using 3D Parallelism (Data, Tensor, Pipeline), connecting GPU kernels (Lesson 49), high-speed networking (Lesson 35), and information-theoretic loss/KL penalties (Lesson 50).",
    symbolDecoder: [
      {
        symbol: "NLL (Negative Log-Likelihood)",
        plainName: "Next-Token Surprise Penalty",
        whatItMeans:
          "−log₂ p(correct token): tiny loss when the model was confident and right; huge penalty when it assigned low probability to the true next token.",
      },
      {
        symbol: "SFT vs. RLHF / DPO",
        plainName: "Imitation vs. Reward Optimization",
        whatItMeans:
          "SFT imitates gold-standard answers; RLHF/DPO compares good vs. bad outputs and pushes probability toward higher-reward responses.",
      },
      {
        symbol: "Chinchilla Scaling (~20×)",
        plainName: "Compute-Optimal Data Ratio",
        whatItMeans:
          "For a fixed training compute budget, training roughly ~20 tokens per model parameter balances capacity and data cleanly.",
      },
    ],
  },
  "inference-kv-cache-quantization": {
    bigPicture:
      "Generating an LLM reply has two very different phases. Reading your prompt ('Prefill') processes all prompt tokens in parallel and is compute-bound. Writing the reply ('Decode') produces one token at a time—if we recomputed attention over every past token each time, it would crawl, so engines save past Key and Value vectors in a KV Cache. Because Decode must haul every model weight + KV cache from GPU HBM memory for every single output token, inference is memory-bandwidth bound—which is why Quantization (shrinking weights from 16-bit to 8-bit or 4-bit) and Grouped-Query Attention (GQA) deliver huge speedups!",
    howItInteracts:
      "LLM serving brings the entire computer architecture stack full circle: memory bandwidth walls (Lesson 18), virtual-memory-style PagedAttention (Lesson 26), FlashAttention SRAM tiling (Lesson 49), and IEEE-754/integer quantization (Lesson 11).",
    symbolDecoder: [
      {
        symbol: "KV Cache",
        plainName: "Saved Past Attention Notes",
        whatItMeans:
          "Stores computed Key & Value tensors for earlier tokens in GPU VRAM so generating the next token doesn't redo old work.",
      },
      {
        symbol: "GQA (Grouped-Query Attention)",
        plainName: "Shared KV Heads",
        whatItMeans:
          "Lets multiple Query heads share one Key/Value head, slashing KV-cache VRAM by 4×–8× with minimal quality loss.",
      },
      {
        symbol: "Quantization (FP8 / INT4)",
        plainName: "Compact Weight Compression",
        whatItMeans:
          "Maps 16-bit floats onto fewer bits using a scale factor—cutting VRAM usage and doubling or quadrupling decode tokens/sec.",
      },
    ],
  },
  "frontiers-euv-chiplets-tpu-quantum": {
    bigPicture:
      "As single monolithic chips hit physical limits of light wavelength, heat, and wafer defects, computing is advancing along four frontiers: High-NA EUV lithography & Gate-All-Around transistors squeeze more switches per mm²; Chiplets split huge processors into smaller high-yield tiles stitched together on silicon interposers; Domain-Specific Accelerators (like Google's systolic-array TPUs and NPUs) strip away general CPU overhead for raw matrix throughput; and Quantum Computers use Qubit superposition and phase interference (`H Z H |0⟩ = |1⟩`) to tackle specialized chemistry and factoring problems.",
    howItInteracts:
      "Every frontier technology directly attacks a physical bottleneck you learned earlier: defect yield (Lesson 6), RC wire energy (Lesson 3), Von Neumann memory walls (Lesson 15), and tensor throughput (Lesson 49)—completing the full journey from electrons to AI!",
    symbolDecoder: [
      {
        symbol: "Chiplets & UCIe",
        plainName: "Modular Stitched-Together Tiles",
        whatItMeans:
          "Building one big processor from smaller high-yield silicon dies connected by ultra-dense, low-energy interposer links.",
      },
      {
        symbol: "Systolic Array (TPU)",
        plainName: "Rhythmic Matrix Conveyor Belt",
        whatItMeans:
          "A 2D grid of multiply-accumulate units that pass numbers directly neighbor-to-neighbor without repeatedly hitting registers or RAM.",
      },
      {
        symbol: "Qubit & Interference",
        plainName: "Amplitude-Carrying Quantum Bit",
        whatItMeans:
          "Holds amplitudes α|0⟩ + β|1⟩ whose squared magnitudes give measurement odds, and whose +/- phase lets quantum gates cancel wrong answers and amplify right ones.",
      },
    ],
  },
};
