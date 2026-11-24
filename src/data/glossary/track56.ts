import type { GlossaryTerm } from "@/types/curriculum";

export const TRACK_5_6_GLOSSARY: GlossaryTerm[] = [
  // Lesson 45: Linear Algebra & Vector Calculus
  {
    id: "homogeneous-coordinates",
    term: "Homogeneous Coordinates",
    domainId: "math-foundations",
    shortDefinition:
      "Representing 3D points and vectors with a fourth component w so translations, rotations, and perspective projections all become 4x4 matrix multiplications.",
    detailedExplanation:
      "In projective geometry for 3D graphics, a 3D position (x, y, z) is represented as a 4D column vector (x, y, z, 1)^T, while a pure direction vector uses w = 0. Because affine translation adds an offset proportional to w, a 4x4 matrix can compose scaling, rotation, and translation in one linear operation. After perspective projection sets w = -z_view, dividing x, y, and z by w (perspective divide) yields Normalized Device Coordinates.",
    formulaLatex: "\\begin{bmatrix} x' \\\\ y' \\\\ z' \\\\ w' \\end{bmatrix} = M_{4\\times 4} \\begin{bmatrix} x \\\\ y \\\\ z \\\\ 1 \\end{bmatrix}, \\quad \\mathbf{p}_{\\text{NDC}} = \\frac{1}{w'}\\begin{bmatrix} x' \\\\ y' \\\\ z' \\end{bmatrix}",
    relatedLessonSlugs: [
      "linear-algebra-calculus-for-computing",
      "pixels-rasterization-shaders",
    ],
  },
  {
    id: "jacobian-matrix",
    term: "Jacobian Matrix",
    domainId: "math-foundations",
    shortDefinition:
      "The matrix of all first-order partial derivatives of a vector-valued function, forming the linear local approximation used by the multivariable chain rule.",
    detailedExplanation:
      "For a differentiable map f: R^n -> R^m, the Jacobian J_f(x) is an m x n matrix whose (i, j) entry is df_i / dx_j. In deep learning, backpropagation rarely materializes full Jacobian matrices because intermediate layers can have millions of elements; instead, reverse-mode autodiff computes Vector-Jacobian Products (VJPs) v^T J_f directly in O(cost of forward pass) time.",
    formulaLatex: "J_f(\\mathbf{x})_{ij} = \\frac{\\partial f_i(\\mathbf{x})}{\\partial x_j}, \\qquad \\nabla_{\\mathbf{x}} \\mathcal{L} = J_f(\\mathbf{x})^\\top \\nabla_{\\mathbf{y}} \\mathcal{L}",
    relatedLessonSlugs: [
      "linear-algebra-calculus-for-computing",
      "neural-networks-backpropagation",
    ],
  },
  {
    id: "svd-eigendecomposition",
    term: "Singular Value Decomposition (SVD)",
    domainId: "math-foundations",
    shortDefinition:
      "Factorization of any m x n matrix A into orthogonal rotations U and V^T and a diagonal scaling matrix Sigma of non-negative singular values.",
    detailedExplanation:
      "Unlike eigendecomposition—which only exists for certain square matrices—SVD applies to every real or complex rectangular matrix A = U Sigma V^T. The leading singular values capture the principal directions of variance (used in PCA) and enable optimal low-rank matrix approximations (Eckart-Young theorem), which underpin LoRA adapters and weight compression.",
    formulaLatex: "A = U \\Sigma V^\\top = \\sum_{i=1}^{r} \\sigma_i \\mathbf{u}_i \\mathbf{v}_i^\\top",
    relatedLessonSlugs: [
      "linear-algebra-calculus-for-computing",
      "classical-machine-learning",
    ],
  },

  // Lesson 46: 3D Transforms, Rasterization & Fragment Shaders
  {
    id: "barycentric-coordinates",
    term: "Barycentric Coordinates",
    domainId: "computer-graphics",
    shortDefinition:
      "Normalized weights (alpha, beta, gamma) summing to 1 that express any point inside a triangle as a convex combination of its three vertices.",
    detailedExplanation:
      "Computed directly from signed 2D edge-function areas divided by twice the triangle's signed area, barycentric coordinates simultaneously determine whether a pixel sample lies inside a triangle (all weights >= 0) and interpolate vertex attributes such as normals, UV texture coordinates, and colors. For 3D perspective triangles, attributes must be divided by clip-space w before linear screen-space interpolation and multiplied back by interpolated 1/w.",
    formulaLatex: "\\mathbf{p} = \\alpha \\mathbf{v}_0 + \\beta \\mathbf{v}_1 + \\gamma \\mathbf{v}_2, \\quad \\alpha + \\beta + \\gamma = 1",
    relatedLessonSlugs: [
      "pixels-rasterization-shaders",
      "ray-tracing-graphics-pipelines",
    ],
  },
  {
    id: "z-buffer",
    term: "Z-Buffer (Depth Buffer)",
    domainId: "computer-graphics",
    shortDefinition:
      "A per-pixel memory buffer storing the closest fragment depth seen so far, resolving occlusion in O(1) per fragment without sorting triangles.",
    detailedExplanation:
      "During rasterization, each fragment's interpolated depth z_ndc is compared against the existing value in the depth buffer. If the fragment passes the depth test (commonly less-than, or greater-than with reversed-Z floating-point depth), both the color target and depth buffer are updated. Perspective projection compresses depth precision nonlinearly near the far plane, making near/far plane ratio critical to avoiding Z-fighting.",
    formulaLatex: "z_{\\text{ndc}} = \\frac{f + n}{f - n} + \\frac{2fn}{(f - n) z_{\\text{view}}} \\quad (\\text{OpenGL } [-1,1])",
    relatedLessonSlugs: ["pixels-rasterization-shaders"],
  },
  {
    id: "fragment-shader",
    term: "Fragment Shader",
    domainId: "computer-graphics",
    shortDefinition:
      "A programmable GPU stage executed in 2x2 pixel quads for every rasterized fragment to compute final surface color, lighting, and depth outputs.",
    detailedExplanation:
      "Fragment (or pixel) shaders run massively in parallel across GPU shader cores. Hardware groups adjacent 2x2 fragments into quads so finite differences (dFdx, dFdy) can estimate texture UV gradients for anisotropic mipmap selection—even if some pixels in the quad are outside the triangle (helper lanes).",
    relatedLessonSlugs: [
      "pixels-rasterization-shaders",
      "gpu-simt-warps-memory",
    ],
  },

  // Lesson 47: BVH Acceleration & Ray Tracing
  {
    id: "bounding-volume-hierarchy",
    term: "Bounding Volume Hierarchy (BVH)",
    domainId: "computer-graphics",
    shortDefinition:
      "A tree of nested axis-aligned bounding boxes (AABBs) that accelerates ray-scene intersection from O(N) triangles to O(log N).",
    detailedExplanation:
      "Built using heuristics such as the Surface Area Heuristic (SAH), a BVH partitions scene primitives so each internal node tightly wraps its children. During traversal, a ray tests intersection with a parent AABB using the slab method; if missed, the entire subtree is culled. Modern GPUs include dedicated hardware units (RT Cores) to traverse BVHs and test ray-triangle intersections.",
    formulaLatex: "C_{\\text{SAH}} = C_{\\text{trav}} + \\frac{SA(L)}{SA(P)} N_L C_{\\text{isect}} + \\frac{SA(R)}{SA(P)} N_R C_{\\text{isect}}",
    relatedLessonSlugs: [
      "ray-tracing-graphics-pipelines",
      "data-structures-sorting-hashing",
    ],
  },
  {
    id: "rendering-equation",
    term: "Rendering Equation",
    domainId: "computer-graphics",
    shortDefinition:
      "Kajiya's integral equation defining outgoing radiance at a surface point as emitted radiance plus the integral of reflected incoming light over the hemisphere.",
    detailedExplanation:
      "Physically based path tracers solve the rendering equation via Monte Carlo integration, shooting stochastic rays recursively across diffuse and specular bounces weighted by the Bidirectional Reflectance Distribution Function (BRDF) and cosine foreshortening term.",
    formulaLatex: "L_o(\\mathbf{x}, \\omega_o) = L_e(\\mathbf{x}, \\omega_o) + \\int_{\\Omega} f_r(\\mathbf{x}, \\omega_i, \\omega_o)\\, L_i(\\mathbf{x}, \\omega_i)\\, (\\omega_i \\cdot \\mathbf{n})\\, d\\omega_i",
    relatedLessonSlugs: ["ray-tracing-graphics-pipelines"],
  },
  {
    id: "tbdr-tile-binning",
    term: "Tile-Based Deferred Rendering (TBDR)",
    domainId: "computer-graphics",
    shortDefinition:
      "A mobile and Apple Silicon GPU architecture that bins geometry into screen tiles and keeps color/depth buffers in fast on-chip SRAM instead of DRAM.",
    detailedExplanation:
      "Immediate-mode desktop GPUs stream triangle fragments directly to L2/VRAM framebuffers. In contrast, TBDR GPUs execute vertex shading first, bin primitives into small screen-space tiles (e.g., 16x16 or 32x32 pixels), perform hidden-surface removal on-chip, and shade only visible pixels using fast tile memory, slashing DRAM bandwidth and power draw.",
    relatedLessonSlugs: [
      "ray-tracing-graphics-pipelines",
      "pixels-rasterization-shaders",
    ],
  },

  // Lesson 48: GPU SIMT, Warps & Memory Coalescing
  {
    id: "simt-warp",
    term: "SIMT Warp / Wavefront",
    domainId: "gpu-parallel",
    shortDefinition:
      "A group of 32 threads (NVIDIA warp) or 32/64 threads (AMD wavefront) scheduled together on a Streaming Multiprocessor under Single Instruction, Multiple Threads execution.",
    detailedExplanation:
      "Unlike CPU SIMD where one instruction operates on explicit vector registers, SIMT gives each thread its own registers and program counter state while hardware issues a common instruction across the warp. When latency hits (such as a global DRAM load), the SM warp scheduler switches to another resident warp in zero cycles, hiding memory latency through massive concurrency.",
    relatedLessonSlugs: ["gpu-simt-warps-memory", "cuda-kernels-tensor-cores"],
  },
  {
    id: "warp-divergence",
    term: "Warp Divergence",
    domainId: "gpu-parallel",
    shortDefinition:
      "Performance serialization that occurs when threads within the same warp take different conditional branches, forcing the SM to execute each path sequentially with an active thread mask.",
    detailedExplanation:
      "When threads 0-15 evaluate an if-branch and threads 16-31 evaluate the else-branch, the warp must execute both paths while masking off inactive lanes using the execution mask. Since Volta, Independent Thread Scheduling tracks per-thread PCs and reconvergence points, yet divergent execution still consumes combined cycle counts.",
    relatedLessonSlugs: ["gpu-simt-warps-memory"],
  },
  {
    id: "memory-coalescing",
    term: "Memory Coalescing",
    domainId: "gpu-parallel",
    shortDefinition:
      "Combining concurrent global memory accesses from threads in a warp into the minimum number of 32-byte cache sectors or 128-byte cache lines.",
    detailedExplanation:
      "If 32 threads in a warp read consecutive 4-byte floats (128 bytes total, aligned), the memory controller satisfies the entire warp in a single 128-byte L1 cache line (four 32-byte L2 sectors). Strided or scattered accesses (such as Array-of-Structures fields with large strides) amplify memory transactions up to 32x and waste DRAM bandwidth.",
    relatedLessonSlugs: ["gpu-simt-warps-memory", "cuda-kernels-tensor-cores"],
  },

  // Lesson 49: CUDA Kernels, Shared Memory & Tensor Cores
  {
    id: "shared-memory-bank-conflict",
    term: "Shared Memory Bank Conflict",
    domainId: "gpu-parallel",
    shortDefinition:
      "Serialization that occurs when multiple threads in a warp access different addresses mapping to the same 32-bank on-chip SRAM module simultaneously.",
    detailedExplanation:
      "GPU shared memory (on-chip scratchpad per SM) is divided into 32 banks of 4-byte width so successive 32-bit words map to banks 0..31. If 32 threads access 32 distinct banks—or broadcast the exact same 32-bit word—all accesses complete in one cycle. Accessing a stride-32 column causes a 32-way bank conflict, typically fixed by padding shared arrays by +1 column.",
    relatedLessonSlugs: ["cuda-kernels-tensor-cores", "gpu-simt-warps-memory"],
  },
  {
    id: "tensor-core",
    term: "Tensor Core",
    domainId: "gpu-parallel",
    shortDefinition:
      "Specialized matrix multiply-accumulate (MMA) hardware inside GPU SMs that computes small dense matrix products D = A * B + C in a single warp-level instruction.",
    detailedExplanation:
      "Instead of issuing scalar FMA instructions per thread, a warp cooperates on a Tensor Core MMA instruction (e.g., 16x8x16 in FP16/BF16 or FP8 with FP32 accumulation), delivering an order of magnitude higher FLOP/s than standard CUDA FP32 cores. Modern Hopper/Blackwell GPUs feed Tensor Cores asynchronously via Tensor Memory Accelerator (TMA) hardware.",
    formulaLatex: "D_{M\\times N} = A_{M\\times K} B_{K\\times N} + C_{M\\times N}",
    relatedLessonSlugs: [
      "cuda-kernels-tensor-cores",
      "inference-kv-cache-quantization",
    ],
  },
  {
    id: "arithmetic-intensity",
    term: "Arithmetic Intensity & Roofline Model",
    domainId: "gpu-parallel",
    shortDefinition:
      "The ratio of floating-point operations performed per byte transferred from off-chip memory (FLOPs/byte), determining whether a kernel is memory-bound or compute-bound.",
    detailedExplanation:
      "In the Roofline model, attainable performance is bounded by min(Peak Compute, Memory Bandwidth * Arithmetic Intensity). The ridge point occurs at Peak Compute / Bandwidth (often ~150-300 FLOP/byte on modern GPUs). Naive vector addition (~0.08 FLOP/byte) is severely memory-bound; tiled GEMM and FlashAttention raise arithmetic intensity by reusing data inside SRAM/registers.",
    formulaLatex: "I = \\frac{\\text{FLOPs}}{\\text{Bytes}_{\\text{DRAM}}}, \\qquad P_{\\text{attainable}} = \\min\\left(P_{\\text{peak}},\\; B_{\\text{mem}} \\cdot I\\right)",
    relatedLessonSlugs: [
      "cuda-kernels-tensor-cores",
      "inference-kv-cache-quantization",
    ],
  },

  // Lesson 50: Probability, Cross-Entropy & Info Theory
  {
    id: "bayes-theorem",
    term: "Bayes' Theorem",
    domainId: "math-foundations",
    shortDefinition:
      "The rule updating prior probability P(H) into posterior probability P(H|D) after observing data D via the likelihood P(D|H).",
    detailedExplanation:
      "Bayes' theorem connects generative likelihoods to discriminative posteriors. Maximizing the log-posterior with a Gaussian prior yields L2 (Ridge) weight decay, while a Laplace prior yields L1 (Lasso) sparsity, explaining why regularization corresponds to prior beliefs over model parameters.",
    formulaLatex: "P(\\theta \\mid D) = \\frac{P(D \\mid \\theta)\\, P(\\theta)}{P(D)}",
    relatedLessonSlugs: [
      "probability-statistics-info-theory",
      "classical-machine-learning",
    ],
  },
  {
    id: "cross-entropy-loss",
    term: "Cross-Entropy & KL Divergence",
    domainId: "math-foundations",
    shortDefinition:
      "Cross-entropy H(P, Q) measures the expected code length in nats or bits when coding samples from true distribution P using predicted distribution Q.",
    detailedExplanation:
      "Cross-entropy decomposes as H(P) + D_KL(P || Q), where H(P) is the constant Shannon entropy of the target distribution and D_KL >= 0 is the Kullback-Leibler divergence measuring excess surprise. Minimizing cross-entropy in classification or next-token LLM prediction is mathematically equivalent to Maximum Likelihood Estimation (MLE).",
    formulaLatex: "H(P, Q) = -\\sum_{x} P(x) \\log Q(x) = H(P) + D_{\\text{KL}}(P \\parallel Q)",
    relatedLessonSlugs: [
      "probability-statistics-info-theory",
      "llm-pretraining-posttraining-rl",
    ],
  },
  {
    id: "maximum-likelihood-estimation",
    term: "Maximum Likelihood Estimation (MLE)",
    domainId: "math-foundations",
    shortDefinition:
      "A parameter estimation principle choosing model weights theta that maximize the probability (or log-probability) of observing the training dataset.",
    detailedExplanation:
      "Assuming independent and identically distributed samples, maximizing the product of likelihoods equals minimizing the negative log-likelihood (NLL). Under Gaussian noise assumptions, MLE produces Mean Squared Error (MSE); under categorical distributions, it produces softmax cross-entropy loss.",
    formulaLatex: "\\hat{\\theta}_{\\text{MLE}} = \\arg\\max_{\\theta} \\sum_{i=1}^N \\log P(y_i \\mid \\mathbf{x}_i; \\theta)",
    relatedLessonSlugs: [
      "probability-statistics-info-theory",
      "classical-machine-learning",
    ],
  },

  // Lesson 51: Classical Machine Learning
  {
    id: "bias-variance-tradeoff",
    term: "Bias-Variance Tradeoff",
    domainId: "machine-learning",
    shortDefinition:
      "Decomposition of expected generalization error into squared bias (underfitting error), variance (sensitivity to training set sampling), and irreducible noise.",
    detailedExplanation:
      "Simple or heavily regularized models exhibit high bias and low variance, systematically missing nonlinear patterns. Overly flexible unregularized models fit training noise, creating high variance. Ensembling techniques tackle opposite sides: Bagging/Random Forests average high-variance trees to slash variance, while Gradient Boosting iteratively corrects residuals to slash bias.",
    formulaLatex: "\\mathbb{E}\\left[(y - \\hat{f}(x))^2\\right] = \\operatorname{Bias}(\\hat{f}(x))^2 + \\operatorname{Var}(\\hat{f}(x)) + \\sigma_\\epsilon^2",
    relatedLessonSlugs: ["classical-machine-learning"],
  },
  {
    id: "l1-l2-regularization",
    term: "L1 & L2 Regularization",
    domainId: "machine-learning",
    shortDefinition:
      "Penalty terms added to the empirical loss function to constrain parameter norms and prevent overfitting.",
    detailedExplanation:
      "L2 regularization (Ridge / weight decay) adds (lambda/2)||w||_2^2, shrinking weights proportionally toward zero and stabilizing ill-conditioned feature matrices. L1 regularization (Lasso) adds lambda||w||_1, whose diamond constraint geometry drives irrelevant feature weights exactly to zero for automatic feature selection.",
    formulaLatex: "\\mathcal{L}_{\\text{reg}}(\\mathbf{w}) = \\mathcal{L}(\\mathbf{w}) + \\lambda_1 \\|\\mathbf{w}\\|_1 + \\frac{\\lambda_2}{2} \\|\\mathbf{w}\\|_2^2",
    relatedLessonSlugs: [
      "classical-machine-learning",
      "neural-networks-backpropagation",
    ],
  },
  {
    id: "gradient-boosted-trees",
    term: "Gradient Boosted Decision Trees (GBDT)",
    domainId: "machine-learning",
    shortDefinition:
      "An additive ensemble that trains shallow decision trees sequentially, each fitting the negative gradient (pseudo-residuals) of the loss with respect to current predictions.",
    detailedExplanation:
      "Algorithms such as XGBoost and LightGBM use second-order Taylor approximations (gradients and Hessians) plus histogram binning to build regularized trees rapidly. On structured tabular data, GBDTs frequently match or outperform deep neural networks due to axis-aligned split invariance and resistance to uninformative features.",
    formulaLatex: "F_m(\\mathbf{x}) = F_{m-1}(\\mathbf{x}) + \\eta\\, h_m(\\mathbf{x}), \\quad h_m \\approx -\\frac{\\partial \\mathcal{L}(y, F_{m-1}(\\mathbf{x}))}{\\partial F_{m-1}(\\mathbf{x})}",
    relatedLessonSlugs: ["classical-machine-learning"],
  },

  // Lesson 52: Neural Networks, Autodiff & Backpropagation
  {
    id: "reverse-mode-autodiff",
    term: "Reverse-Mode Automatic Differentiation",
    domainId: "deep-learning",
    shortDefinition:
      "An exact differentiation algorithm that evaluates a computation graph forward while saving activations, then propagates scalar loss sensitivities backward via Vector-Jacobian Products.",
    detailedExplanation:
      "Unlike numerical finite differences (inaccurate and O(P) passes for P parameters) or symbolic differentiation (expression blowup), reverse-mode autodiff computes exact gradients for millions of weights in a single backward sweep proportional to the forward pass cost. Its memory bottleneck—storing intermediate activations—is mitigated via gradient checkpointing.",
    formulaLatex: "\\bar{v}_i = \\frac{\\partial \\mathcal{L}}{\\partial v_i} = \\sum_{j \\in \\text{users}(i)} \\bar{v}_j \\frac{\\partial v_j}{\\partial v_i}",
    relatedLessonSlugs: ["neural-networks-backpropagation"],
  },
  {
    id: "adamw-optimizer",
    term: "AdamW Optimizer",
    domainId: "deep-learning",
    shortDefinition:
      "Adaptive Moment Estimation with decoupled weight decay, tracking per-parameter exponential moving averages of first (momentum) and second (variance) gradient moments.",
    detailedExplanation:
      "Standard Adam coupled L2 regularization into the gradient before adaptive scaling, which weakened weight decay on parameters with large historical gradients. AdamW applies weight decay directly to the weights after the adaptive step. Because it stores m_t and v_t in FP32, AdamW adds 8 bytes per parameter (or 12 bytes with FP32 master weights) to training VRAM.",
    formulaLatex: "\\theta_{t+1} = (1 - \\eta \\lambda)\\theta_t - \\eta \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon}",
    relatedLessonSlugs: [
      "neural-networks-backpropagation",
      "llm-pretraining-posttraining-rl",
    ],
  },
  {
    id: "layer-normalization",
    term: "LayerNorm & RMSNorm",
    domainId: "deep-learning",
    shortDefinition:
      "Per-token feature normalization layers that stabilize activation scales across deep networks independent of batch size.",
    detailedExplanation:
      "BatchNorm normalizes across the mini-batch dimension, making it brittle for variable-length sequences and small per-GPU micro-batches. LayerNorm normalizes each token's hidden vector across its d_model features. RMSNorm (used in Llama, Gemma, and Qwen) drops mean-centering and normalizes solely by root-mean-square magnitude, saving ~10-15% norm overhead with equivalent quality.",
    formulaLatex: "\\operatorname{RMSNorm}(\\mathbf{x}) = \\frac{\\mathbf{x}}{\\sqrt{\\frac{1}{d}\\sum_{i=1}^d x_i^2 + \\epsilon}} \\odot \\boldsymbol{\\gamma}",
    relatedLessonSlugs: [
      "neural-networks-backpropagation",
      "transformers-tokenization-embeddings",
    ],
  },

  // Lesson 53: CNNs, ResNets, RNNs & Attention
  {
    id: "residual-connection",
    term: "Residual (Skip) Connection",
    domainId: "deep-learning",
    shortDefinition:
      "An identity shortcut y = x + F(x) that allows gradients to flow directly across dozens or hundreds of layers without vanishing.",
    detailedExplanation:
      "Introduced in ResNet, additive skip connections create an unimpeded gradient highway because d(x + F(x))/dx = I + dF/dx. Even if F(x) has small singular values, the identity matrix preserves gradient magnitude back to early layers. Every modern Transformer block wraps both attention and MLP sublayers in residual connections.",
    formulaLatex: "\\mathbf{x}_{l+1} = \\mathbf{x}_l + \\mathcal{F}(\\operatorname{Norm}(\\mathbf{x}_l))",
    relatedLessonSlugs: [
      "cnns-rnns-attention",
      "transformers-tokenization-embeddings",
    ],
  },
  {
    id: "spatial-convolution",
    term: "2D Spatial Convolution",
    domainId: "deep-learning",
    shortDefinition:
      "A weight-sharing sliding linear filter across spatial height and width that enforces translation equivariance with far fewer parameters than dense layers.",
    detailedExplanation:
      "A Conv2d kernel of shape (C_out, C_in, K_h, K_w) slides across an image feature map. In practice, GPU libraries like cuDNN lower convolutions into matrix multiplications via im2col, Winograd minimal filtering, or implicit GEMM to utilize Tensor Cores efficiently.",
    relatedLessonSlugs: ["cnns-rnns-attention"],
  },
  {
    id: "cross-attention-seq2seq",
    term: "Bahdanau / Cross-Attention",
    domainId: "deep-learning",
    shortDefinition:
      "A mechanism letting a decoder query an entire sequence of encoder hidden states dynamically at every step, eliminating fixed-size bottleneck vectors.",
    detailedExplanation:
      "Before Transformers, recurrent encoder-decoders compressed an entire source sentence into one final hidden state, causing long-sequence degradation. Cross-attention computes soft alignment weights over all source states at each decoding step, providing direct O(1) path length to relevant tokens.",
    relatedLessonSlugs: [
      "cnns-rnns-attention",
      "transformers-tokenization-embeddings",
    ],
  },

  // Lesson 54: Transformers, BPE & RoPE
  {
    id: "byte-pair-encoding",
    term: "Byte-Pair Encoding (BPE)",
    domainId: "modern-ai",
    shortDefinition:
      "A deterministic subword tokenization algorithm that iteratively merges the most frequent adjacent byte or symbol pairs to build a fixed-size vocabulary.",
    detailedExplanation:
      "Byte-level BPE (used in GPT, Llama, and Claude tokenizers) starts from the 256 raw UTF-8 bytes—guaranteeing zero unknown <UNK> tokens—and applies learned merge rules up to vocabularies of 32k to 128k+ tokens. Frequent words compress into single tokens while rare words split into meaningful subwords.",
    relatedLessonSlugs: ["transformers-tokenization-embeddings"],
  },
  {
    id: "scaled-dot-product-attention",
    term: "Scaled Dot-Product Attention",
    domainId: "modern-ai",
    shortDefinition:
      "The core Transformer mixing operation computing contextualized values as softmax(QK^T / sqrt(d_k))V.",
    detailedExplanation:
      "Each token projects into Query (Q), Key (K), and Value (V) vectors of dimension d_k. Dividing dot products by sqrt(d_k) keeps pre-softmax variance near 1 as d_k grows, preventing softmax saturation and vanishing gradients. Autoregressive decoders add a causal upper-triangular mask of -infinity so token t attends only to positions <= t.",
    formulaLatex: "\\operatorname{Attention}(Q, K, V) = \\operatorname{softmax}\\left(\\frac{QK^\\top}{\\sqrt{d_k}} + M_{\\text{causal}}\\right)V",
    relatedLessonSlugs: [
      "transformers-tokenization-embeddings",
      "inference-kv-cache-quantization",
    ],
  },
  {
    id: "rotary-position-embedding",
    term: "Rotary Position Embedding (RoPE)",
    domainId: "modern-ai",
    shortDefinition:
      "A relative positional encoding that rotates pairs of Query and Key coordinates by position-dependent angles so Q_m^T K_n depends purely on relative offset (m - n).",
    detailedExplanation:
      "Unlike additive absolute embeddings, RoPE multiplies 2D subspaces of Q and K by 2x2 rotation matrices R(m * theta_i) with geometrically spaced frequencies. Because R(m)^T R(n) = R(n - m), attention scores naturally encode relative distance, and base-frequency scaling (YaRN/NTK scaling) extends context windows past pretraining lengths.",
    formulaLatex: "R_{\\Theta, m}^{(i)} = \\begin{bmatrix} \\cos m\\theta_i & -\\sin m\\theta_i \\\\ \\sin m\\theta_i & \\cos m\\theta_i \\end{bmatrix}, \\quad (R_m \\mathbf{q})^\\top (R_n \\mathbf{k}) = \\mathbf{q}^\\top R_{n-m} \\mathbf{k}",
    relatedLessonSlugs: ["transformers-tokenization-embeddings"],
  },

  // Lesson 55: MoE, SSMs & Multimodal Reasoning
  {
    id: "mixture-of-experts",
    term: "Mixture of Experts (MoE)",
    domainId: "modern-ai",
    shortDefinition:
      "A sparse conditional architecture replacing each dense Transformer FFN with N expert FFNs and a learned router that activates only the top-k experts per token.",
    detailedExplanation:
      "MoE decouples total parameter capacity (which stores broad knowledge across 8-256 experts) from per-token FLOPs (typically activating k=2 to 8 experts). Training requires load-balancing auxiliary losses or bias-based routing (such as DeepSeek's auxiliary-loss-free balancing) to prevent router collapse onto a single expert.",
    formulaLatex: "\\mathbf{y} = \\sum_{i \\in \\operatorname{TopK}(G(\\mathbf{x}))} G(\\mathbf{x})_i\\, E_i(\\mathbf{x})",
    relatedLessonSlugs: ["moe-ssm-multimodal-reasoning"],
  },
  {
    id: "selective-state-space-model",
    term: "Selective State-Space Model (Mamba / SSM)",
    domainId: "modern-ai",
    shortDefinition:
      "A linear-time sequence architecture generalizing continuous linear time-invariant state equations by making transition and input matrices functions of the current token.",
    detailedExplanation:
      "While Transformers incur O(L^2) attention FLOPs and O(L) KV-cache growth, SSMs maintain a fixed-size recurrent hidden state h_t, giving O(1) memory per token during decoding while supporting hardware-aware parallel scan during training. Hybrid models interleave SSM blocks with sparse Transformer attention for exact in-context recall.",
    formulaLatex: "h_t = \\bar{A}(x_t)\\, h_{t-1} + \\bar{B}(x_t)\\, x_t, \\qquad y_t = C(x_t)\\, h_t",
    relatedLessonSlugs: ["moe-ssm-multimodal-reasoning"],
  },
  {
    id: "vision-patch-embedding",
    term: "Patch Embedding & Vision-Language Alignment",
    domainId: "modern-ai",
    shortDefinition:
      "Projecting non-overlapping image patches (e.g., 14x14 pixels) into token vectors in the same embedding space as text tokens for multimodal Transformer reasoning.",
    detailedExplanation:
      "Introduced by Vision Transformers (ViT) and extended by CLIP/SigLIP contrastive alignment, patch embeddings allow a single autoregressive Transformer to attend seamlessly across interleaved image patches, audio frames, and text subwords.",
    relatedLessonSlugs: ["moe-ssm-multimodal-reasoning"],
  },

  // Lesson 56: LLM Pretraining, Distributed Training & Post-Training
  {
    id: "chinchilla-scaling-laws",
    term: "Chinchilla Compute-Optimal Scaling",
    domainId: "ai-training-inference",
    shortDefinition:
      "Empirical power-law relationship showing that for a fixed training FLOP budget C ~ 6ND, parameters N and training tokens D should scale equally (~20 tokens per parameter).",
    detailedExplanation:
      "Hoffmann et al. (2022) demonstrated that earlier LLMs were severely undertrained relative to parameter count. While Chinchilla optimality minimizes pretraining loss for a fixed compute budget, production models like Llama-3 intentionally overtrain smaller N on 15T+ tokens to lower downstream inference cost.",
    formulaLatex: "C \\approx 6 N D, \\qquad N_{\\text{opt}} \\propto C^{0.5}, \\quad D_{\\text{opt}} \\propto C^{0.5}",
    relatedLessonSlugs: ["llm-pretraining-posttraining-rl"],
  },
  {
    id: "3d-parallelism-zero",
    term: "3D Parallelism & ZeRO Sharding",
    domainId: "ai-training-inference",
    shortDefinition:
      "Combining Tensor Parallelism (intra-layer matmul splitting), Pipeline Parallelism (inter-layer stage splitting), and Data Parallelism/ZeRO (sharding optimizer states and weights).",
    detailedExplanation:
      "No single GPU can fit a 70B+ model's weights, gradients, and AdamW states. Tensor Parallelism runs over high-bandwidth NVLink within a node (requiring all-reduce per layer), Pipeline Parallelism splits layers across nodes with micro-batch schedules (1F1B) to shrink pipeline bubbles, and ZeRO-3/FSDP shards parameters across data-parallel replicas.",
    relatedLessonSlugs: [
      "llm-pretraining-posttraining-rl",
      "distributed-consensus-raft",
    ],
  },
  {
    id: "dpo-rlhf",
    term: "RLHF & Direct Preference Optimization (DPO)",
    domainId: "ai-training-inference",
    shortDefinition:
      "Post-training alignment methods that steer pretrained models using human or verifier preference pairs (chosen y_w vs. rejected y_l) relative to a reference policy.",
    detailedExplanation:
      "Classic RLHF fits an explicit Bradley-Terry reward model and optimizes the policy with PPO plus a KL penalty against the SFT model. DPO derives the closed-form optimal policy-reward mapping to optimize preference margins directly via binary cross-entropy without a separate reward model, while GRPO/RLVR optimizes verifiable reasoning rewards.",
    formulaLatex: "\\mathcal{L}_{\\text{DPO}}(\\theta) = -\\mathbb{E}\\left[\\log \\sigma\\left(\\beta \\log \\frac{\\pi_\\theta(y_w|x)}{\\pi_{\\text{ref}}(y_w|x)} - \\beta \\log \\frac{\\pi_\\theta(y_l|x)}{\\pi_{\\text{ref}}(y_l|x)}\\right)\\right]",
    relatedLessonSlugs: ["llm-pretraining-posttraining-rl"],
  },

  // Lesson 57: Inference, KV Cache, FlashAttention & Quantization
  {
    id: "kv-cache-gqa",
    term: "KV Cache & Grouped-Query Attention (GQA)",
    domainId: "ai-training-inference",
    shortDefinition:
      "Caching past Key and Value tensors across autoregressive decode steps to avoid O(L^2) recomputation, shrunk by sharing KV heads across query groups in GQA.",
    detailedExplanation:
      "Each generated token only needs to compute q_t and attend to cached K_{<=t}, V_{<=t}. However, for batch size B, layers L, context length S, and KV heads H_kv, the KV cache consumes 2 * B * L * S * H_kv * d_head * bytes_per_elem—often exceeding model weights at long context. GQA shares each KV head across multiple query heads (e.g., 8 KV heads for 64 Q heads), cutting KV memory and bandwidth by 8x.",
    formulaLatex: "\\text{Bytes}_{\\text{KV}} = 2 \\cdot B \\cdot N_{\\text{layers}} \\cdot S \\cdot H_{\\text{kv}} \\cdot d_{\\text{head}} \\cdot b_{\\text{dtype}}",
    relatedLessonSlugs: ["inference-kv-cache-quantization"],
  },
  {
    id: "flash-attention",
    term: "FlashAttention (IO-Aware Online Softmax)",
    domainId: "ai-training-inference",
    shortDefinition:
      "A fused tiled GPU attention kernel that keeps the N x N attention matrix inside on-chip SRAM using online softmax rescaling, avoiding HBM reads/writes.",
    detailedExplanation:
      "Standard attention materializes the O(S^2) score and probability matrices in slow off-chip HBM, making attention memory-bandwidth bound. FlashAttention tiles Q, K, V blocks into SM shared memory, tracks running row maximum m(x) and normalizing sum l(x) across K/V tiles, and rescales partial outputs in one fused pass—reducing HBM I/O from O(S^2) to O(S) while remaining mathematically exact.",
    relatedLessonSlugs: [
      "inference-kv-cache-quantization",
      "cuda-kernels-tensor-cores",
    ],
  },
  {
    id: "paged-attention-speculative",
    term: "PagedAttention & Speculative Decoding",
    domainId: "ai-training-inference",
    shortDefinition:
      "Serving optimizations that eliminate KV-cache fragmentation via virtual memory paging and break decode memory bottlenecks by verifying draft tokens in parallel.",
    detailedExplanation:
      "PagedAttention (vLLM) manages KV caches in non-contiguous fixed-size blocks mapped by a block table, eliminating 60-80% internal/external memory waste and enabling copy-on-write prefix sharing. Speculative decoding pairs a small draft model (or multi-token head) proposing gamma tokens with a single batched verification pass on the target LLM, turning memory-bound 1-token steps into higher-arithmetic-intensity batched checks.",
    relatedLessonSlugs: ["inference-kv-cache-quantization"],
  },

  // Lesson 58: Frontiers — EUV, Chiplets, TPUs & Quantum
  {
    id: "high-na-euv",
    term: "High-NA EUV Lithography & GAAFET",
    domainId: "computing-frontiers",
    shortDefinition:
      "Extreme Ultraviolet lithography at 13.5 nm wavelength with 0.55 numerical aperture optics printing Gate-All-Around nanosheet transistors below 2 nm nodes.",
    detailedExplanation:
      "Resolution follows the Rayleigh criterion CD = k1 * lambda / NA. Stepping from 0.33 NA to 0.55 High-NA EUV enables single-exposure sub-10 nm half-pitch features with anamorphic 4x/8x magnification optics. Combined with Gate-All-Around (GAA) stacked silicon nanosheets and backside power delivery networks (BSPDN), chips continue scaling density and electrostatic gate control past FinFET limits.",
    formulaLatex: "\\text{CD} = k_1 \\frac{\\lambda}{\\text{NA}}, \\qquad \\lambda_{\\text{EUV}} = 13.5\\text{ nm}",
    relatedLessonSlugs: [
      "frontiers-euv-chiplets-tpu-quantum",
      "semiconductor-fabrication",
    ],
  },
  {
    id: "systolic-array-chiplets",
    term: "Systolic Array & UCIe Chiplet Packaging",
    domainId: "computing-frontiers",
    shortDefinition:
      "Grid-connected MAC arrays (used in Google TPUs) that rhythmically pass activations and weights between neighbors without register-file trips, paired with multi-die chiplet packaging.",
    detailedExplanation:
      "As monolithic dies approach the ~858 mm^2 reticle limit and suffer exponential defect-yield drops, modern accelerators split compute, I/O, and HBM into separate chiplets joined over silicon interposers (CoWoS) or Universal Chiplet Interconnect Express (UCIe) dies. Inside AI accelerators, 2D systolic arrays (e.g., 128x128 or 256x256 MACs) execute matrix multiplies with minimal control overhead.",
    relatedLessonSlugs: ["frontiers-euv-chiplets-tpu-quantum"],
  },
  {
    id: "quantum-error-correction",
    term: "Qubit Superposition & Surface-Code Error Correction",
    domainId: "computing-frontiers",
    shortDefinition:
      "Encoding fault-tolerant logical qubits across hundreds to thousands of noisy physical qubits arranged on a 2D stabilizer lattice.",
    detailedExplanation:
      "A physical qubit exists in coherent superposition alpha|0> + beta|1> and entangles via multi-qubit gates, but suffers decoherence and gate errors (10^-3 to 10^-4). By repeatedly measuring X and Z parity check (syndrome) ancillas without collapsing the encoded logical state, surface codes detect bit-flip and phase-flip errors provided physical error rates remain below the fault-tolerance threshold (~1%).",
    formulaLatex: "|\\psi\\rangle = \\alpha|0\\rangle + \\beta|1\\rangle, \\qquad |\\alpha|^2 + |\\beta|^2 = 1",
    relatedLessonSlugs: ["frontiers-euv-chiplets-tpu-quantum"],
  },
];
