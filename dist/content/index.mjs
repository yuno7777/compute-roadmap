import {foundations} from './foundations.mjs';
import {systems} from './systems.mjs';
import {intelligence} from './intelligence.mjs';
import {extended} from './extended.mjs';
export {roadmap} from './roadmap.mjs';

export const lessons = Object.fromEntries(
  [...foundations, ...systems, ...intelligence, ...extended].map(lesson => [lesson.id,lesson])
);
const challenge = (type,prompt,options,answer,explanation,hint) => ({
  type,prompt,options,answer,explanation,hint,difficulty:'Applied'
});
const exercises = {
  'electricity-1':challenge('number','In the charge lab, set 3 C and 2 s. Enter the current magnitude in amperes.',[],1.5,'Divide charge by elapsed time. 3 C ÷ 2 s = 1.5 A.','Use I = ΔQ/Δt.'),
  'electricity-2':challenge('multi','Two resistors in series have which properties? Choose all that apply.',['They carry equal current','Their voltage drops add','Their resistances must be equal'],[0,1],'The same current flows through both. Their voltage drops sum to the source voltage. Resistance can differ.','Imagine one continuous path.'),
  'digital-1':challenge('match','Match each output condition to the gate.',['AND','OR','XOR'],['Both high','At least one high','Exactly one high'],'AND needs both, OR needs at least one, and XOR needs the inputs to differ.','Use the output for inputs 11 to distinguish OR and XOR.'),
  'representation-1':challenge('fill','Write hexadecimal A5 as eight binary digits.',[],'10100101','A represents 1010 and 5 represents 0101. Concatenate the nibbles.','Convert each digit independently.'),
  'architecture-1':challenge('order','Place the instruction stages in execution order.',['Execute','Fetch','Decode'],['Fetch','Decode','Execute'],'Read the instruction, interpret its fields and then perform the selected operation.','The processor needs a bit pattern before it can interpret it.'),
  'assembly-1':challenge('fill','Debug the toy program MOV R0, 7; STORE R0, 0. Replace only the second instruction so it stores 7 in cell 2.',[],'STORE R0, 2','The source register already contains 7. The STORE address must be the new cell index.','Adjust the literal after the comma.'),
  'memory-1':challenge('true','For a four-line, four-byte direct-mapped cache, addresses 0 and 3 can hit the same cached line.',['True','False'],0,'They both belong to aligned block zero.','Compute floor(address / 4).'),
  'os-2':challenge('number','Set page size to 4096. If virtual address 8199 is translated using the teaching table, enter its physical address in decimal.',[],28679,'8199 = 2×4096+7. Page 2 maps to frame 7, so physical address is 7×4096+7.','Preserve the offset.'),
  'compilers-1':challenge('number','Predict the output of 9−3−2 with ordinary left-associative subtraction.',[],4,'Group the expression as (9−3)−2.','Operators at the same precedence are grouped from the left in this expression language.'),
  'distributed-1':challenge('order','Order these events to demonstrate a lost update while Worker A reads and writes before Worker B does the same respective operations.',['A writes 1','B writes 1','B reads 0','A reads 0'],['A reads 0','B reads 0','A writes 1','B writes 1'],'Both reads precede the writes and observe the original 0.','Put both reads before either write.'),
  'ai-2':challenge('multi','Which operations are part of a basic causal attention head?',['Scale query–key dot products','Mask future keys before softmax','Mix value vectors using normalized weights','Apply dropout at every inference step'],[0,1,2],'A head computes and scales scores, masks future positions and forms a weighted value sum. Dropout is typically disabled for inference.','Trace from Q and K to the resulting context vector.'),
  'inference-2':challenge('number','Calculate the cache size in MiB for 16 layers, 8 KV heads, dimension 128, 2048 tokens and two-byte elements.',[],128,'Use 2 × 16 × 8 × 128 × 2048 × 2 bytes, then divide by 2²⁰.','Count both K and V.'),
};
for (const [id,question] of Object.entries(exercises)) lessons[id].questions.push(question);

export const glossary = [
  ['ABI','Agreement between compiled components about calls, registers, stack layout and data representation.','assembly-1'],
  ['Activation','Intermediate output produced by a neural network operation.','dl-1'],
  ['Attention','Operation that forms weighted combinations of values using matching scores.','ai-2'],
  ['Atom','Ordinary matter building block containing a nucleus and electrons.','electricity-1'],
  ['AST','Abstract syntax tree. Hierarchical structure representing the meaningfully grouped parts of source code.','compilers-1'],
  ['Cache line','Aligned block that a cache transfers and tracks together.','memory-1'],
  ['CMOS','Complementary metal–oxide–semiconductor logic using pMOS and nMOS devices.','semiconductors-2'],
  ['Coulomb','SI unit of electric charge.','electricity-1'],
  ['Depletion region','Junction region with relatively few mobile carriers and fixed ionized dopants.','semiconductors-1'],
  ['Embedding','Vector representation looked up for a discrete input such as a token.','ai-1'],
  ['Gradient','Vector of partial derivatives of a scalar objective.','ml-1'],
  ['Index','Auxiliary structure that supports efficient data lookup.','databases-1'],
  ['ISA','Instruction set architecture. Interface that specifies machine instructions and architectural state.','assembly-1'],
  ['KV cache','Stored key and value tensors reused across autoregressive token generation steps.','inference-2'],
  ['Page fault','Exception caused by a missing or disallowed memory page translation.','os-2'],
  ['Pipeline','Arrangement that overlaps independent stages of different instructions.','modern-cpu-1'],
  ['Quantization','Mapping to a smaller set of representable values.','inference-3'],
  ['Rasterization','Process of determining sample coverage for projected geometric primitives.','graphics-1'],
  ['SIMT','Single instruction, multiple threads. Grouped execution model with per-thread data and state.','gpu-1'],
  ['Two’s complement','Fixed-width signed integer encoding whose most significant bit has negative weight.','representation-1'],
  ['Warp','Group of 32 CUDA threads on NVIDIA GPUs.','gpu-1']
];
