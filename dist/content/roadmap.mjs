export const roadmap = [
  ['electricity','Physics & electricity',[], 'Trace energy and charge through a circuit.', ['Electrons and charge','Voltage, current and resistance','Fields, signals and capacitance']],
  ['semiconductors','Semiconductors',['electricity'], 'Explain how an electric field controls current.', ['Silicon, doping and junctions','MOSFETs and CMOS','Diodes, BJTs and fabrication']],
  ['digital','Digital electronics',['semiconductors'], 'Build combinational and sequential logic.', ['Logic gates and Boolean algebra','Adders and multiplexers','Flip-flops, registers and clocks']],
  ['representation','Information representation',['digital'], 'Interpret identical bits under different encodings.', ['Binary, hex and signed integers','Floating-point representation','Text, compression and error correction']],
  ['architecture','Computer architecture',['digital','representation'], 'Follow an instruction through a processor.', ['The instruction cycle','ALU, buses and control','Memory architectures and I/O']],
  ['assembly','Assembly & machine code',['architecture'], 'Relate instructions, registers, memory and calls.', ['Instructions and addressing','Stack, calls and ABI','x86-64, Arm and RISC-V']],
  ['memory','Memory & storage',['architecture'], 'Predict locality and compare memory technologies.', ['Cache and locality','SRAM, DRAM and ROM','Flash, disks and storage interfaces']],
  ['modern-cpu','Modern CPU architecture',['assembly','memory'], 'Explain how modern CPUs overlap and reorder work.', ['Pipelines and branch prediction','Superscalar and out-of-order execution','SIMD, multicore and coherence']],
  ['os','Operating systems',['assembly','memory'], 'Trace how an OS runs and isolates programs.', ['Processes and scheduling','Virtual memory and page tables','Boot, drivers and filesystems']],
  ['languages','Programming languages',['assembly','os'], 'Compare execution and memory models.', ['C, Rust and ownership','Python execution and objects','JavaScript and TypeScript runtimes']],
  ['compilers','Compilers & interpreters',['languages'], 'Follow code from characters to execution.', ['Tokens, parsing and syntax trees','IR, LLVM and optimization','Linking, interpretation and JIT']],
  ['algorithms','Data structures & algorithms',['languages'], 'Choose data structures based on cost and access patterns.', ['Complexity, search and sorting','Arrays, lists and hash tables','Trees, graphs and shortest paths']],
  ['networking','Computer networking',['os'], 'Follow data across machines and protocol layers.', ['Packets, Ethernet and routing','TCP, UDP and sockets','DNS, HTTP and TLS']],
  ['databases','Databases',['algorithms','memory'], 'Trace indexing, query execution and durable writes.', ['B-trees and indexing','Transactions, logs and isolation','LSM engines, query plans and vector search']],
  ['distributed','Concurrent & distributed systems',['os','networking'], 'Reason about ordering, replication and isolation.', ['Threads, atomics and async','Replication and consensus','Containers, VMs and distributed storage']],
  ['security','Computer security',['languages','os','networking'], 'Use boundaries and verification to protect systems.', ['Protection and memory safety','Cryptography and authentication','Hardware trust and isolation']],
  ['math','Mathematical foundations',['representation'], 'Use the mathematics needed for algorithms, graphics and learning.', ['Vectors and linear algebra','Calculus and numerical methods','Probability, statistics and information']],
  ['graphics','Computer graphics',['math','algorithms'], 'Connect camera geometry to pixels.', ['Pixels and rasterization','Shaders and graphics pipelines','Ray tracing and displays']],
  ['gpu','GPU architecture & parallel computing',['memory','graphics'], 'Reason about GPU lane execution and data movement.', ['SIMT, warps and divergence','GPU memory and CUDA kernels','Tensor cores and accelerators']],
  ['ml','Machine learning',['math','algorithms'], 'Train a model and measure generalization.', ['Regression and gradient descent','Classification and feature engineering','Evaluation and statistical learning']],
  ['dl','Deep learning',['ml','gpu'], 'Trace a neural network’s forward and backward passes.', ['Neurons and backpropagation','CNNs, RNNs and optimization','Attention and learned representations']],
  ['ai','Modern AI architectures',['dl'], 'Explain how modern models represent and mix tokens.', ['Tokenization and embeddings','Transformer attention','MoE, multimodal and recurrent models']],
  ['inference','AI training & inference systems',['ai','distributed'], 'Explain the tradeoffs in training and serving models.', ['Pretraining, fine-tuning and RL','Inference and KV caches','Quantization and model compression']],
  ['frontiers','Modern computing frontiers',['modern-cpu','gpu','inference'], 'Compare future computing technologies by what they accelerate.', ['Chiplets and advanced fabrication','NPUs, TPUs and neuromorphic hardware','Quantum computing and emerging architectures']]
].map(([id,title,requires,outcome,topics]) => ({
  id,title,requires,outcome,
  chapters:topics.map((title,i)=>({id:id+'-'+(i+1),title,lessons:[id+'-'+(i+1)]}))
}));
