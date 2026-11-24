export function lesson(id, title, lab, source, objective, intro, mechanics, example, misconception, recap, question) {
  const [prompt, options, answer, explanation, hint] = question;
  return {id, title, lab, sources:[source], objective, intro, mechanics, example, misconception, recap,
    minutes: Math.max(8, Math.ceil((intro.length + mechanics.join(' ').length + example.length) / 750) + 5),
    questions:[{type:'choice', prompt, options, answer, explanation, hint, difficulty:'Core'}]};
}
export const sources = {
  charge:['OpenStax · Electric Charge','https://openstax.org/books/university-physics-volume-2/pages/5-1-electric-charge'],
  ohm:['OpenStax · Ohm’s law','https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law'],
  mit:['MIT OCW · Microelectronic Devices and Circuits','https://ocw.mit.edu/courses/6-012-microelectronic-devices-and-circuits-fall-2009/'],
  nand:['Nand2Tetris · Course projects','https://www.nand2tetris.org/course'],
  berkeley:['UC Berkeley · CS61C','https://cs61c.org/'],
  risc:['RISC-V · Unprivileged ISA specification','https://docs.riscv.org/reference/isa/unpriv/unpriv-index.html'],
  os:['Operating Systems: Three Easy Pieces','https://pages.cs.wisc.edu/~remzi/OSTEP/'],
  rust:['The Rust Programming Language · Ownership','https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html'],
  llvm:['LLVM · Kaleidoscope tutorial','https://llvm.org/docs/tutorial/'],
  alg:['MIT OCW · Introduction to Algorithms','https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/'],
  ip:['IETF · Internet Protocol','https://www.rfc-editor.org/rfc/rfc791.html'],
  sql:['PostgreSQL · Indexes','https://www.postgresql.org/docs/current/indexes.html'],
  threads:['The Rust Programming Language · Concurrency','https://doc.rust-lang.org/book/ch16-00-concurrency.html'],
  nist:['NIST · SSDF','https://csrc.nist.gov/pubs/sp/800/218/final'],
  linear:['MIT OCW · Linear Algebra','https://ocw.mit.edu/courses/18-06-linear-algebra-spring-2010/'],
  graphics:['Scratchapixel · Rasterization','https://www.scratchapixel.com/lessons/3d-basic-rendering/rasterization-practical-implementation/overview-rasterization-algorithm.html'],
  cuda:['NVIDIA · CUDA Programming Guide','https://docs.nvidia.com/cuda/cuda-programming-guide/'],
  ml:['Google · Machine Learning Crash Course','https://developers.google.com/machine-learning/crash-course'],
  grad:['PyTorch · Autograd mechanics','https://docs.pytorch.org/docs/stable/notes/autograd.html'],
  stanford:['Stanford · CS231n','https://cs231n.stanford.edu/'],
  attention:['Vaswani et al. · Attention Is All You Need','https://arxiv.org/abs/1706.03762'],
  tokens:['Hugging Face · The LLM Course','https://huggingface.co/learn/llm-course'],
  kv:['Hugging Face · Caching','https://huggingface.co/docs/transformers/main/cache_explanation'],
  quant:['Hugging Face · Quantization','https://huggingface.co/docs/transformers/main/quantization/overview'],
  chip:['UCIe Consortium','https://www.uciexpress.org/'],
  quantum:['IBM Quantum Learning · Basics of quantum information','https://quantum.cloud.ibm.com/learning/en/courses/basics-of-quantum-information']
};
