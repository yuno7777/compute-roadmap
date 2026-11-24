import type { TrackExam } from "@/types/curriculum";

export const TRACK_3_EXAM: TrackExam = {
  id: "exam-track-3",
  trackId: "track-3",
  title: "Track 3 Cumulative Examination: OS, Languages, Compilers & Algorithms",
  description:
    "Comprehensive assessment spanning UEFI boot, kernel scheduling & virtual memory, VFS journaling, C/Rust/managed runtimes, parsing/SSA/linking/JITs, and cache-conscious algorithms.",
  passingScore: 70,
  questions: [
    {
      id: "exam-t3-q1",
      type: "mcq",
      difficulty: "intermediate",
      prompt:
        "During UEFI boot, why must firmware configure CPU Cache-as-RAM (CAR) before running PEI C code, and what marks the final handoff of physical memory ownership to the OS kernel?",
      options: [
        {
          id: "a",
          text: "DRAM timings are untrained until PEI calibrates them, so CAR supplies a temporary stack; `ExitBootServices(ImageHandle, MapKey)` transfers memory ownership to the kernel",
          explanation:
            "Correct! CAR emulates writable SRAM until DRAM training completes, and `ExitBootServices()` locks the memory map and surrenders control to the kernel.",
        },
        {
          id: "b",
          text: "CAR stores the OS root filesystem in L1 cache; `BIOS INT 13h` transfers ownership to the kernel",
          explanation:
            "CAR holds only a tiny temporary stack/heap for firmware initialization, and UEFI replaces legacy INT 13h.",
        },
        {
          id: "c",
          text: "CAR disables virtual memory permanently; `swapgs` transfers firmware memory to the kernel",
          explanation:
            "`swapgs` swaps per-CPU kernel state during syscalls/IRQs, not firmware handoff.",
        },
        {
          id: "d",
          text: "CAR trains NVMe SSD controllers; `fork()` transfers UEFI memory to PID 1",
          explanation:
            "CAR is for CPU stack before DRAM is ready, and `fork()` is a POSIX process creation syscall.",
        },
      ],
      correctAnswer: "a",
      hints: [
        "Think about what C code needs before DRAM sticks work.",
        "Recall the UEFI Boot Services teardown call.",
      ],
      explanation:
        "At power-on reset DRAM is uncalibrated, so SEC configures Cache-as-RAM for PEI's stack while training DDR timings; once the kernel is loaded, `ExitBootServices()` ends Boot Services and hands the memory map to the kernel.",
      conceptTag: "boot-uefi-handoff",
    },
    {
      id: "exam-t3-q2",
      type: "true-false",
      difficulty: "intermediate",
      prompt:
        "True or False: Context switching between two threads of the same process avoids reloading the hardware page-table root register (`CR3` on x86-64), thereby preserving warm TLB entries.",
      correctAnswer: true,
      hints: ["Do sibling threads in the same process share one virtual address space?"],
      explanation:
        "True. Threads of the same process share `mm_struct` (the same page tables), so switching between them swaps registers and kernel stacks without changing `CR3` or flushing the TLB.",
      conceptTag: "threads-context-switch",
    },
    {
      id: "exam-t3-q3",
      type: "math",
      difficulty: "rigorous",
      prompt:
        "A 4-level paging system has a 1 ns TLB lookup, 100 ns main memory latency per access (including each page-table level), and a 95% (0.95) TLB hit rate. What is the Effective Memory Access Time (EMAT) in nanoseconds?",
      correctAnswer: 121,
      numericTolerance: 0.5,
      hints: [
        "TLB hit (0.95): $1 + 100 = 101$ ns.",
        "TLB miss (0.05): $1 + 4 \\times 100 + 100 = 501$ ns.",
      ],
      explanation:
        "EMAT = $0.95 \\times 101 + 0.05 \\times 501 = 95.95 + 25.05 = 121$ ns.",
      conceptTag: "vm-emat",
    },
    {
      id: "exam-t3-q4",
      type: "ordering",
      difficulty: "intermediate",
      prompt:
        "Order the steps a storage-backed application and Linux kernel execute to make an atomic file update crash-safe across sudden power loss:",
      orderingItems: [
        "Write full new file contents into a temporary file in the target directory",
        "Call `fsync()` on the temporary file so data blocks and metadata commit to non-volatile media",
        "Call `rename(tmp_path, target_path)` to update the directory entry atomically",
        "Call `fsync()` on the parent directory file descriptor so the new directory entry is durable",
      ],
      correctAnswer: [
        "Write full new file contents into a temporary file in the target directory",
        "Call `fsync()` on the temporary file so data blocks and metadata commit to non-volatile media",
        "Call `rename(tmp_path, target_path)` to update the directory entry atomically",
        "Call `fsync()` on the parent directory file descriptor so the new directory entry is durable",
      ],
      hints: [
        "Payload durability must precede the atomic directory pointer swap.",
        "The directory entry update itself also needs durability.",
      ],
      explanation:
        "Syncing the temp file before `rename()` prevents pointing `target_path` at empty/stale blocks on crash, and syncing the parent directory guarantees the `rename` survives power loss.",
      conceptTag: "filesystem-crash-safety",
    },
    {
      id: "exam-t3-q5",
      type: "debugging",
      difficulty: "intermediate",
      prompt:
        "Why does Rust's borrow checker reject this snippet, and what real memory bug would C++ face in the equivalent pattern?",
      codeSnippet: `let mut buf = vec![1, 2, 3];
let ptr: &i32 = &buf[0];
buf.push(4);
println!("{}", *ptr);`,
      codeLanguage: "rust",
      options: [
        {
          id: "a",
          text: "`buf.push(4)` takes `&mut buf` while the immutable borrow `ptr` is still alive at `println!`; in C++, `push_back` can reallocate the backing array, leaving `ptr` as a dangling use-after-free pointer",
          explanation:
            "Correct! Aliasing XOR Mutability prevents iterator/reference invalidation statically at compile time.",
        },
        {
          id: "b",
          text: "Because `Vec` elements are stored on the stack and cannot be referenced",
          explanation:
            "`Vec` elements live on the heap and can be borrowed via `&buf[0]` whenever borrowing rules hold.",
        },
        {
          id: "c",
          text: "Because `println!` moves ownership of `buf` out of scope",
          explanation: "`println!` only borrows arguments immutably.",
        },
        {
          id: "d",
          text: "Because `buf` is not declared `static`",
          explanation: "Local variables can be borrowed safely as long as lifetimes do not outlive the owner.",
        },
      ],
      correctAnswer: "a",
      hints: ["What can `Vec::push` do to its internal heap allocation when capacity is full?"],
      explanation:
        "Growing a dynamic array reallocates and frees its old buffer; Rust forbids holding a live `&T` borrow across an `&mut self` call (`push`), eliminating use-after-free at compile time.",
      conceptTag: "rust-aliasing-xor-mutability",
    },
    {
      id: "exam-t3-q6",
      type: "predict-output",
      difficulty: "intermediate",
      prompt: "What exact sequence of numbers does this JavaScript code print?",
      codeSnippet: `console.log(1);
setTimeout(() => console.log(2), 0);
Promise.resolve()
  .then(() => console.log(3))
  .then(() => console.log(4));
console.log(5);`,
      codeLanguage: "javascript",
      options: [
        {
          id: "a",
          text: "1, 5, 3, 4, 2",
          explanation:
            "Correct! Synchronous logs (`1`, `5`) execute first, then the entire microtask queue drains (`3`, `4`), and finally the `setTimeout` macrotask (`2`) executes.",
        },
        {
          id: "b",
          text: "1, 5, 2, 3, 4",
          explanation: "Microtasks always drain before the next macrotask (`setTimeout`).",
        },
        {
          id: "c",
          text: "1, 3, 4, 5, 2",
          explanation: "Synchronous execution (`1`, `5`) completes before microtasks begin.",
        },
        {
          id: "d",
          text: "1, 5, 3, 2, 4",
          explanation: "Chained microtasks created during microtask draining (`4`) still run before returning to macrotasks (`2`).",
        },
      ],
      correctAnswer: "a",
      hints: ["Remember: synchronous stack -> drain ALL microtasks -> next macrotask."],
      explanation:
        "Synchronous calls log `1` and `5`. Next, the microtask checkpoint drains both `3` and the chained `4` before the event loop dequeues the macrotask `2`.",
      conceptTag: "js-event-loop",
    },
    {
      id: "exam-t3-q7",
      type: "matching",
      difficulty: "foundational",
      prompt: "Match each compiler or runtime stage to its core responsibility:",
      matchingPairs: [
        { id: "c1", left: "Pratt Expression Parser", right: "Resolves operator precedence and associativity into an AST without left-recursion" },
        { id: "c2", left: "LLVM `mem2reg` + Phi Nodes", right: "Promotes stack slots to SSA registers with explicit def-use chains across merges" },
        { id: "c3", left: "PIC GOT / PLT Tables", right: "Allows ASLR-relocated shared libraries to keep `.text` pages shared and read-only" },
        { id: "c4", left: "JIT Deoptimization Bailout", right: "Reconstructs interpreter frames safely when speculative runtime type guards fail" },
      ],
      correctAnswer: {
        c1: "Resolves operator precedence and associativity into an AST without left-recursion",
        c2: "Promotes stack slots to SSA registers with explicit def-use chains across merges",
        c3: "Allows ASLR-relocated shared libraries to keep `.text` pages shared and read-only",
        c4: "Reconstructs interpreter frames safely when speculative runtime type guards fail",
      },
      hints: [
        "Connect frontend parsing, middle-end SSA, dynamic linking, and speculative execution.",
      ],
      explanation:
        "Pratt parsing builds precedence-correct ASTs, `mem2reg` constructs SSA with phi nodes, GOT/PLT decouples ASLR linking from immutable `.text`, and deoptimization preserves soundness under speculative JIT guards.",
      conceptTag: "compiler-runtime-pipeline",
    },
    {
      id: "exam-t3-q8",
      type: "math",
      difficulty: "intermediate",
      prompt:
        "An optimizing JIT compiler takes $C = 2400\\,\\mu\\text{s}$ once to compile a hot function, reducing per-call runtime from $t_{\\text{interp}} = 14\\,\\mu\\text{s}$ to $t_{\\text{jit}} = 2\\,\\mu\\text{s}$. How many invocations $N^*$ are required to break even?",
      correctAnswer: 200,
      numericTolerance: 0,
      hints: [
        "Set $14 N = 2400 + 2 N$ and solve for $N$.",
      ],
      explanation:
        "Each call saves $14 - 2 = 12\\,\\mu\\text{s}$, so $N^* = 2400 / 12 = 200$ calls.",
      conceptTag: "jit-cost-model",
    },
    {
      id: "exam-t3-q9",
      type: "mcq",
      difficulty: "intermediate",
      prompt:
        "In an open-addressed linear-probing hash table, what happens if `delete(key)` resets the removed entry's slot straight to `EMPTY` instead of placing a `TOMBSTONE` (or backward-shifting)?",
      options: [
        {
          id: "a",
          text: "Subsequent lookups for colliding keys placed further down the probe cluster terminate early at `EMPTY` and falsely report missing keys",
          explanation:
            "Correct! Probe sequences stop on `EMPTY`, so breaking a cluster with `EMPTY` hides downstream keys.",
        },
        {
          id: "b",
          text: "The hash function switches automatically to $O(n)$ separate chaining",
          explanation: "Open-addressed tables do not use chaining lists.",
        },
        {
          id: "c",
          text: "Amortized insertion becomes $O(n^2)$ even at load factor 0.1",
          explanation: "The immediate failure is correctness (false-negative lookups), not asymptotic resizing.",
        },
        {
          id: "d",
          text: "The CPU raises a hardware `#PF` page fault",
          explanation: "Reading `EMPTY` is a normal memory read.",
        },
      ],
      correctAnswer: "a",
      hints: ["Trace inserting two keys that hash to the same slot, deleting the first, and looking up the second."],
      explanation:
        "Open-addressing probes stop as soon as `EMPTY` is encountered; marking deleted slots as `TOMBSTONE` (or backward-shifting subsequent elements) preserves probe chain correctness.",
      conceptTag: "open-addressing-deletion",
    },
    {
      id: "exam-t3-q10",
      type: "multi-select",
      difficulty: "rigorous",
      prompt:
        "Which two statements correctly connect algorithmic theory to real CPU hardware behavior?",
      options: [
        {
          id: "a",
          text: "An in-memory B-tree reduces dependent cache-line misses from $\\Theta(\\log_2 N)$ to $\\Theta(\\log_B N)$ compared to a pointer-based Red-Black tree",
          explanation:
            "Correct! Packing $B$ sorted keys per cache-line node drastically cuts DRAM pointer chasing.",
        },
        {
          id: "b",
          text: "LSD Radix Sort beats the $\\Omega(n \\log n)$ comparison-sorting lower bound on fixed-width integers by bucketing bit slices directly without pairwise comparisons",
          explanation:
            "Correct! The $\\Omega(n \\log n)$ lower bound applies strictly to comparison-based decision trees.",
        },
        {
          id: "c",
          text: "Dijkstra's algorithm handles arbitrary negative edge weights (without negative cycles) in $O((V+E)\\log V)$ time",
          explanation:
            "Negative edge weights break Dijkstra's greedy finalization invariant and require Bellman-Ford.",
        },
        {
          id: "d",
          text: "Marking BFS nodes `visited` on queue *pop* instead of *push* has identical worst-case runtime on dense DAGs",
          explanation:
            "Marking on pop permits duplicate enqueues across shared predecessors, blowing up queue size on dense graphs/DAGs.",
        },
      ],
      correctAnswer: ["a", "b"],
      hints: [
        "Recall cache-aware B-trees and non-comparison sorting bounds.",
        "Remember why negative edges break Dijkstra and late-visited marking hurts BFS.",
      ],
      explanation:
        "Cache-aligned B-trees slash DRAM misses by $\\log_2 B$ over Red-Black trees, and Radix Sort sorts fixed-width keys in $O(n)$ by avoiding comparison decision trees.",
      conceptTag: "hardware-aware-dsa",
    },
  ],
};
