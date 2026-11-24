import type { GlossaryTerm } from "@/types/curriculum";

export const TRACK_3_GLOSSARY: GlossaryTerm[] = [
  {
    id: "reset-vector",
    term: "Reset Vector",
    domainId: "operating-systems",
    shortDefinition:
      "The fixed physical memory address from which a CPU fetches its very first instruction upon power-on or hardware reset.",
    detailedExplanation:
      "When power rails stabilize and the RESET# pin deasserts, hardware initializes the instruction pointer and segment registers to a deterministic location mapped to non-volatile SPI NOR flash. On x86-64, execution begins in 16-bit Real Mode at physical address 0xFFFFFFF0 (CS selector 0xF000, base 0xFFFF0000, IP 0xFFF0), 16 bytes below 4 GiB, holding a jump into the firmware SEC phase. On ARM64/RISC-V SoCs, an immutable on-die Mask ROM at 0x00000000 or an implementation-defined reset address validates and loads early SRAM stages before DRAM training.",
    relatedLessonSlugs: ["boot-bios-uefi-kernels"],
  },
  {
    id: "uefi-firmware",
    term: "UEFI Firmware",
    domainId: "operating-systems",
    shortDefinition:
      "The Unified Extensible Firmware Interface standardizing platform initialization, GPT partitioning, and 64-bit handoff to OS bootloaders.",
    detailedExplanation:
      "Replacing legacy 16-bit BIOS real-mode interrupts, UEFI structures boot into seven ordered phases: SEC (Security), PEI (Pre-EFI Initialization, which trains DRAM controllers), DXE (Driver Execution Environment in 64-bit long mode with flat identity-mapped paging), BDS (Boot Device Selection parsing the EFI System Partition), TSL (Transient System Load where EFI Boot Services allocate memory and load the OS loader), RT (Runtime Services preserved after ExitBootServices()), and AL (After Life). UEFI reads FAT32 EFI System Partitions directly via GPT without relying on a 440-byte MBR boot sector.",
    relatedLessonSlugs: ["boot-bios-uefi-kernels"],
  },
  {
    id: "privilege-ring",
    term: "CPU Privilege Ring / Exception Level",
    domainId: "operating-systems",
    shortDefinition:
      "Hardware-enforced execution modes that restrict sensitive instructions, control registers, and page-table modifications to trusted kernel code.",
    detailedExplanation:
      "Modern ISAs enforce isolation in silicon rather than relying on compiler checks. x86-64 uses Current Privilege Level (CPL) stored in the low 2 bits of CS: Ring 0 for kernel mode and Ring 3 for unprivileged user processes (Rings 1 and 2 are unused in flat 64-bit OSes). ARMv8-A defines Exception Levels EL0 (user applications), EL1 (OS kernel), EL2 (hypervisor), and EL3 (Secure Monitor), while RISC-V provides U-mode, S-mode, and M-mode. Attempting privileged operations like modifying CR3/TTBR0_EL1 or halting the CPU in user mode triggers a synchronous General Protection or Illegal Instruction trap into the kernel.",
    relatedLessonSlugs: ["boot-bios-uefi-kernels", "interrupts-syscalls-privilege"],
  },
  {
    id: "process-control-block",
    term: "Process Control Block (PCB)",
    domainId: "operating-systems",
    shortDefinition:
      "The kernel data structure (e.g., Linux task_struct) storing a task's scheduling state, saved register context, address-space pointer, and open file descriptors.",
    detailedExplanation:
      "To multiplex hundreds of runnable tasks onto a handful of physical CPU cores, the OS kernel maintains a PCB per schedulable entity. It tracks task state (Running, Ready/Runnable, Blocked/Interruptible), kernel-stack pointer, saved callee-saved registers, virtual-memory descriptor (mm_struct / page table root), signal masks, accounting metrics (vruntime, CPU time), and credential/file-descriptor tables. In Linux, both processes and kernel threads are represented by task_struct instances distinguished by whether they share an mm_struct and file table.",
    relatedLessonSlugs: ["processes-threads-scheduling"],
  },
  {
    id: "context-switch",
    term: "Context Switch",
    domainId: "operating-systems",
    shortDefinition:
      "The act of saving the CPU register state and stack pointer of the currently running thread/process and restoring those of the next scheduled task.",
    detailedExplanation:
      "A thread context switch within the same process swaps callee-saved general-purpose registers, FPU/SIMD state (lazily or eagerly via XSAVE), and the kernel stack pointer, typically costing a few hundred nanoseconds directly. Switching between different processes also swaps the hardware page-table base register (CR3 on x86-64 or TTBR0_EL1 on ARM64). The indirect cost—cold L1/L2 caches, branch predictor aliasing, and TLB misses when PCID/ASID tagging is unavailable—often dominates the direct register save/restore overhead, stretching total impact into microseconds.",
    formulaLatex:
      "T_{\\text{effective}} = T_{\\text{save/restore}} + T_{\\text{TLB/cache refill}}",
    relatedLessonSlugs: ["processes-threads-scheduling", "interrupts-syscalls-privilege"],
  },
  {
    id: "mlfq-scheduler",
    term: "Multi-Level Feedback Queue (MLFQ)",
    domainId: "operating-systems",
    shortDefinition:
      "A preemptive scheduling discipline using prioritized queues with decreasing priority and increasing time quanta to balance interactive latency and batch throughput.",
    detailedExplanation:
      "MLFQ learns a process's behavior from recent history without requiring prior knowledge of job length. New jobs enter the highest-priority queue with a short quantum. If a task yields for I/O before its quantum expires, it stays at high priority (preserving low response time for interactive/I/O-bound workloads); if it consumes its full slice, it is demoted to a lower-priority queue with a longer quantum. Periodic priority boosts prevent starvation of CPU-bound tasks when interactive jobs dominate.",
    relatedLessonSlugs: ["processes-threads-scheduling"],
  },
  {
    id: "interrupt-descriptor-table",
    term: "Interrupt Descriptor Table (IDT) / Vector Table",
    domainId: "operating-systems",
    shortDefinition:
      "A kernel-owned hardware lookup table mapping interrupt, exception, and trap numbers to privileged handler entry points.",
    detailedExplanation:
      "When an external device asserts an IRQ via the APIC/GIC, a timer expires, or user code faults (e.g., page fault #PF vector 14 or divide error #DE vector 0), the CPU indexes the IDT (pointed to by IDTR on x86-64, or VBAR_EL1 on ARM64). Hardware automatically switches from the user stack to the kernel's Interrupt Stack Table or TSS.RSP0 stack, pushes user RIP/CS/RFLAGS/RSP/SS, clears IF if configured as an interrupt gate, and jumps to the registered Ring-0 handler without trusting any user-controlled pointer.",
    relatedLessonSlugs: ["interrupts-syscalls-privilege"],
  },
  {
    id: "system-call",
    term: "System Call (Syscall)",
    domainId: "operating-systems",
    shortDefinition:
      "A controlled synchronous trap allowing unprivileged user-space code to request privileged kernel services such as I/O, memory mapping, or process creation.",
    detailedExplanation:
      "User programs cannot write directly to disk controllers or modify page tables. Instead, libc wrappers place a syscall number (e.g., in RAX on x86-64 or X8 on ARM64) and arguments in ABI registers and execute a dedicated transition instruction (`syscall`, `svc #0`, or `ecall`). The CPU raises privilege to kernel mode, saves the return address (into RCX/R11 on x86-64), swaps to the kernel stack via `swapgs`, validates user pointers (`copy_from_user`), executes the kernel service, and returns via `sysretq`/`eret`. Modern KPTI mitigates Meltdown by mapping minimal kernel trampolines in user page tables.",
    relatedLessonSlugs: ["interrupts-syscalls-privilege"],
  },
  {
    id: "page-table-walk",
    term: "Multi-Level Page Table Walk",
    domainId: "operating-systems",
    shortDefinition:
      "Hardware or software traversal of hierarchical page-table radix nodes (e.g., PML4 -> PDPT -> PD -> PT) to translate a virtual address to a physical frame.",
    detailedExplanation:
      "A flat page table for a 48-bit virtual address space with 4 KiB pages would require $2^{36}$ entries (~512 GiB per process). Multi-level radix trees avoid allocating entries for unmapped regions: x86-64 4-level paging splits the 48-bit canonical virtual address into four 9-bit indices (512 entries per 4 KiB table) plus a 12-bit page offset. On a TLB miss, the hardware Page Miss Handler (PMH) performs up to four sequential dependent memory reads starting from CR3 (or five under 5-level LA57 paging), checking Present, Read/Write, User/Supervisor, and NX bits at each level.",
    formulaLatex:
      "\\text{VA}_{48} = \\underbrace{\\text{PML4}}_{9\\text{b}} \\mid \\underbrace{\\text{PDPT}}_{9\\text{b}} \\mid \\underbrace{\\text{PD}}_{9\\text{b}} \\mid \\underbrace{\\text{PT}}_{9\\text{b}} \\mid \\underbrace{\\text{Offset}}_{12\\text{b}}",
    relatedLessonSlugs: ["virtual-memory-paging-tlb"],
  },
  {
    id: "tlb-shootdown",
    term: "TLB & TLB Shootdown",
    domainId: "operating-systems",
    shortDefinition:
      "An on-core Translation Lookaside Buffer caching recent virtual-to-physical mappings, and the inter-processor interrupt protocol required to invalidate stale entries across cores.",
    detailedExplanation:
      "Because a 4-level page walk costs hundreds of cycles if table entries miss CPU caches, each core maintains a fast associative L1/L2 TLB tagged with Address Space Identifiers (PCID on x86-64, ASID on ARM64). When the kernel unmaps or downgrades permissions on a shared page (such as `munmap` or Copy-on-Write protection), hardware does not automatically cohere TLBs across cores. The modifying core must issue Inter-Processor Interrupts (IPIs) to all cores running that `mm_struct`, forcing each to execute `invlpg` / `tlbi` and acknowledge completion before freeing the physical frame.",
    formulaLatex:
      "\\text{EMAT} = h_{\\text{TLB}} (T_{\\text{TLB}} + T_{\\text{mem}}) + (1 - h_{\\text{TLB}}) (T_{\\text{TLB}} + k \\cdot T_{\\text{walk}} + T_{\\text{mem}})",
    relatedLessonSlugs: ["virtual-memory-paging-tlb"],
  },
  {
    id: "virtual-file-system",
    term: "Virtual File System (VFS)",
    domainId: "operating-systems",
    shortDefinition:
      "The kernel abstraction layer defining uniform object interfaces (superblock, inode, dentry, file) across heterogeneous filesystems and pseudo-filesystems.",
    detailedExplanation:
      "VFS decouples POSIX system calls (`open`, `read`, `write`, `stat`) from concrete on-disk layouts like ext4, XFS, Btrfs, FAT32, or virtual trees like `procfs`. A `superblock` represents a mounted filesystem, an `inode` stores file metadata and block pointers independent of path names, a `dentry` caches directory-name-to-inode lookups (dcache) to avoid repeated disk reads during path traversal, and a `file` struct tracks an open file description's current byte offset and flags per `open()` call.",
    relatedLessonSlugs: ["drivers-and-filesystems"],
  },
  {
    id: "write-ahead-journal",
    term: "Write-Ahead Journaling (Metadata / Data)",
    domainId: "operating-systems",
    shortDefinition:
      "A crash-consistency mechanism that records intended filesystem updates to a sequential journal with commit records before modifying in-place on-disk structures.",
    detailedExplanation:
      "Updating a file often mutates multiple structures: data blocks, inode size/extents, and free-space bitmaps. A power loss mid-update leaves dangling pointers or leaked blocks. Journaling filesystems (ext4, XFS, NTFS) write a transaction descriptor and updated blocks into a circular log, issue a disk cache flush (`FUA`/barrier), write a commit block, and only then checkpoint changes to their final home locations. In ext4 `ordered` mode (the default), data blocks are flushed to disk before metadata is committed to the journal, preventing stale data exposure without double-writing file payloads.",
    relatedLessonSlugs: ["drivers-and-filesystems"],
  },
  {
    id: "dma-ring-buffer",
    term: "DMA & Descriptor Ring Buffer",
    domainId: "operating-systems",
    shortDefinition:
      "Direct Memory Access hardware transfers coordinated through lockless circular queues of physical-address descriptors shared between a driver and device.",
    detailedExplanation:
      "High-speed NVMe SSDs and NICs cannot afford CPU programmed I/O (`in`/`out` or MMIO word copies) for every byte. Instead, the OS allocates physically contiguous or IOMMU-mapped DMA buffers and populates a circular descriptor ring (Submission Queue / Completion Queue) in DRAM. The driver updates a single MMIO doorbell register; the PCIe device masters the bus, reads descriptors, transfers payload blocks directly to/from RAM, writes a completion entry, and signals an MSI-X interrupt (or lets the driver poll in NAPI/io_uring modes).",
    relatedLessonSlugs: ["drivers-and-filesystems"],
  },
  {
    id: "raii-ownership",
    term: "RAII & Affine Ownership",
    domainId: "programming-languages",
    shortDefinition:
      "Resource Acquisition Is Initialization paired with single-owner move semantics so resources are deterministically released exactly once when their owner leaves scope.",
    detailedExplanation:
      "Popularized in C++ and made memory-safe by construction in Rust, RAII binds the lifetime of heap allocations, file descriptors, and mutex guards to lexical stack scopes. With affine ownership (`Drop` in Rust), assigning or passing a non-`Copy` value moves ownership rather than shallow-copying a raw pointer, statically preventing double-free and use-after-free bugs without runtime garbage collection pauses.",
    relatedLessonSlugs: ["c-and-rust-memory-models"],
  },
  {
    id: "borrow-checker",
    term: "Borrow Checker (Aliasing XOR Mutability)",
    domainId: "programming-languages",
    shortDefinition:
      "Rust's compile-time static analyzer enforcing that every reference outlives neither its referent nor violates shared-immutable vs. exclusive-mutable rules.",
    detailedExplanation:
      "Data races and iterator invalidation stem from simultaneously holding an aliasing pointer and mutating through another. Rust's borrow checker enforces two invariants across lifetimes: (1) any reference `&'a T` or `&'a mut T` is strictly bounded within the scope where the underlying owner remains valid and unmoved, and (2) at any program point, a value may have either any number of shared immutable references (`&T`) OR at most one exclusive mutable reference (`&mut T`), never both.",
    relatedLessonSlugs: ["c-and-rust-memory-models"],
  },
  {
    id: "arena-allocator",
    term: "Arena / Bump Allocator",
    domainId: "programming-languages",
    shortDefinition:
      "A region-based memory allocator that serves allocations by advancing a pointer within a contiguous slab and frees all objects simultaneously in O(1).",
    detailedExplanation:
      "General-purpose allocators (`jemalloc`, `mimalloc`, `ptmalloc`) maintain size-classed free lists and thread-local caches to handle arbitrary lifetimes, incurring metadata and synchronization overhead. When objects share a phase lifetime—such as AST nodes during compilation or per-request HTTP state—an arena allocator reserves large contiguous chunks via `mmap`/`VirtualAlloc`, aligns and bumps a cursor pointer in a few CPU instructions, improves spatial cache locality, and reclaims the entire region by resetting the cursor without per-object `free()` calls.",
    relatedLessonSlugs: ["c-and-rust-memory-models"],
  },
  {
    id: "generational-gc",
    term: "Generational Garbage Collection",
    domainId: "programming-languages",
    shortDefinition:
      "A tracing memory-management strategy partitioning the heap by object age to exploit the weak generational hypothesis that most objects die young.",
    detailedExplanation:
      "Because short-lived temporaries dominate functional, JS, and Python workloads, scanning the entire heap on every collection wastes bandwidth. A generational GC (such as V8's Scavenger/MinorMC and Major Mark-Sweep-Compact) allocates new objects via bump-pointer in a small nursery/young generation. Minor collections trace only roots plus cross-generational pointers tracked by write barriers and remembered sets, copying survivors into an old generation and compacting fragmentation in $O(\\text{live young bytes})$ rather than $O(\\text{heap size})$.",
    relatedLessonSlugs: ["python-js-ts-runtimes"],
  },
  {
    id: "hidden-class-inline-cache",
    term: "Hidden Class (Shape) & Inline Cache (IC)",
    domainId: "programming-languages",
    shortDefinition:
      "Runtime metadata descriptors (Shapes/Maps) and call-site caches that convert dynamic dictionary property lookups into fixed-offset memory loads.",
    detailedExplanation:
      "In JavaScript and Python, objects conceptually act as dynamic maps from string keys to values. Repeatedly hashing property names would cripple throughput. Engines like V8 and SpiderMonkey attach hidden classes (Maps/Shapes) that record property names and byte offsets along transition trees. Inline Caches at property-access bytecodes cache the expected hidden class and offset: if subsequent calls see the same monomorphic Shape, the lookup reduces to a single pointer comparison plus fixed-offset load.",
    relatedLessonSlugs: ["python-js-ts-runtimes", "linkers-interpreters-jit"],
  },
  {
    id: "event-loop-microtask",
    term: "Event Loop & Microtask Queue",
    domainId: "programming-languages",
    shortDefinition:
      "A single-threaded asynchronous concurrency coordinator that runs each task to completion and drains all microtasks before yielding to I/O or macrotasks.",
    detailedExplanation:
      "JavaScript runtimes (browsers, Node.js/libuv) and Python `asyncio` multiplex thousands of concurrent I/O operations on one thread using OS readiness notification (`epoll`/`kqueue`/`IOCP`). After the synchronous call stack empties, the runtime drains the entire microtask queue (resolved `Promise` callbacks and `queueMicrotask`)—including newly enqueued microtasks—before polling OS I/O events, timers, or rendering frames in the next macrotask turn.",
    relatedLessonSlugs: ["python-js-ts-runtimes"],
  },
  {
    id: "recursive-descent-parser",
    term: "Recursive-Descent & Pratt Parsing",
    domainId: "compilers-interpreters",
    shortDefinition:
      "A top-down parsing technique where grammar non-terminals map to mutually recursive functions, often paired with Pratt precedence climbing for expressions.",
    detailedExplanation:
      "Hand-written compilers (Clang, GCC, rustc, V8) favor predictive LL(k) recursive-descent parsers over generated LR tables because they provide full control over error recovery, diagnostics, and contextual keywords. Left-recursive binary expressions (`E -> E + E`), which would infinitely recurse in naive top-down code, are handled cleanly with Vaughn Pratt's Top-Down Operator Precedence (binding powers) or precedence climbing, producing clean ASTs in linear $O(n)$ time.",
    relatedLessonSlugs: ["lexing-parsing-ast"],
  },
  {
    id: "abstract-syntax-tree",
    term: "Abstract Syntax Tree (AST)",
    domainId: "compilers-interpreters",
    shortDefinition:
      "A hierarchical tree representation of program structure that discards syntactic punctuation while preserving operator precedence, scopes, and source spans.",
    detailedExplanation:
      "Unlike a Concrete Syntax Tree (parse tree) that retains every parenthesis, semicolon, and grammar helper node, an AST encodes semantic constructs directly: declarations, control-flow statements, calls, and typed expressions. Semantic analysis passes decorate AST nodes with resolved symbol bindings and inferred types before lowering into a linear control-flow IR.",
    relatedLessonSlugs: ["lexing-parsing-ast", "ir-llvm-optimization-codegen"],
  },
  {
    id: "static-single-assignment",
    term: "Static Single Assignment (SSA) Form",
    domainId: "compilers-interpreters",
    shortDefinition:
      "An intermediate representation property where every virtual register (value) is assigned exactly once and every use is dominated by its unique definition.",
    detailedExplanation:
      "By banning destructive reassignment of IR variables, SSA turns implicit data-flow edges into explicit def-use chains. Optimizations such as Sparse Conditional Constant Propagation, Global Value Numbering, Dead Code Elimination, and Loop-Invariant Code Motion run without expensive iterative bit-vector reaching-definitions analyses. Production IRs like LLVM IR, Cranelift, and V8 TurboFan Sea-of-Nodes all rely on SSA.",
    relatedLessonSlugs: ["ir-llvm-optimization-codegen"],
  },
  {
    id: "phi-node",
    term: "Phi ($\phi$) Node",
    domainId: "compilers-interpreters",
    shortDefinition:
      "A pseudo-instruction at the top of an SSA basic block that selects a value based on which predecessor basic block transferred control.",
    detailedExplanation:
      "When two control-flow branches merge (such as `if/else` or a loop header), a variable assigned differently along each path cannot obey single-assignment directly. A $\\phi$ instruction `x_3 = phi [x_1, bb_then], [x_2, bb_else]` reconciles the incoming versions simultaneously before any subsequent instruction in the join block executes. During register allocation and instruction selection, $\\phi$ nodes are eliminated via coalescing or edge-split copy insertion.",
    formulaLatex:
      "x_3 = \\phi(x_1 : B_{\\text{then}},\\; x_2 : B_{\\text{else}})",
    relatedLessonSlugs: ["ir-llvm-optimization-codegen"],
  },
  {
    id: "elf-relocation",
    term: "ELF Relocation & GOT/PLT",
    domainId: "compilers-interpreters",
    shortDefinition:
      "Linker metadata records and indirection tables enabling object files and position-independent shared libraries to resolve external symbols at link or load time.",
    detailedExplanation:
      "Object files (`.o`) compiled separately leave external function and global addresses blank, emitting relocation entries (`.rela.text`) that instruct the static linker (`ld`/`lld`) how to patch machine-code offsets once sections are merged. For position-independent shared libraries (`.so`), read-only `.text` pages cannot be patched per process without losing page sharing; instead, code accesses globals through the Global Offset Table (GOT) and external calls through the Procedure Linkage Table (PLT) resolved by `ld-linux.so`.",
    relatedLessonSlugs: ["linkers-interpreters-jit"],
  },
  {
    id: "tiered-jit-compilation",
    term: "Tiered JIT Compilation & Deoptimization",
    domainId: "compilers-interpreters",
    shortDefinition:
      "Adaptive runtime compilation that profiles hot bytecode in an interpreter or baseline JIT before emitting speculative machine code with bailout guards.",
    detailedExplanation:
      "Compiling every function upfront with an optimizing compiler slows startup and wastes memory on cold initialization code. Tiered engines (V8 Ignition -> Sparkplug -> Maglev -> TurboFan; JVM HotSpot C1 -> C2; CPython 3.11+ specializing adaptive interpreter) collect type and branch-frequency feedback in early tiers. The optimizing JIT compiles hot functions using speculative assumptions (e.g., `x` is always an integer); if an assumption later fails at a guard, On-Stack Replacement / deoptimization reconstructs the exact interpreter frame state and resumes safely.",
    relatedLessonSlugs: ["python-js-ts-runtimes", "linkers-interpreters-jit"],
  },
  {
    id: "asymptotic-notation",
    term: "Asymptotic Notation ($O, \\Omega, \\Theta$)",
    domainId: "data-structures-algorithms",
    shortDefinition:
      "Formal mathematical bounds classifying how an algorithm's time or space resource usage scales as input size $n \\to \\infty$.",
    detailedExplanation:
      "$f(n) = O(g(n))$ means there exist constants $c > 0, n_0$ such that $0 \\le f(n) \\le c \\cdot g(n)$ for all $n \\ge n_0$ (asymptotic upper bound). $\\Omega(g(n))$ provides a lower bound ($f(n) \\ge c \\cdot g(n)$), and $\\Theta(g(n))$ indicates a tight bound ($O$ and $\\Omega$ simultaneously). Rigorous algorithm analysis distinguishes worst-case, average-case, and amortized bounds while remembering that hidden constant factors—such as L1 cache hits vs. DRAM pointer chasing—often decide real-world winners at practical $n$.",
    formulaLatex:
      "f(n) = \\Theta(g(n)) \\iff \\exists c_1, c_2 > 0,\\; n_0 : c_1 g(n) \\le f(n) \\le c_2 g(n) \\;\\forall n \\ge n_0",
    relatedLessonSlugs: ["asymptotics-recurrences-graphs"],
  },
  {
    id: "master-theorem",
    term: "Master Theorem",
    domainId: "data-structures-algorithms",
    shortDefinition:
      "A closed-form characterization solving divide-and-conquer recurrences $T(n) = a T(n/b) + f(n)$ by comparing leaf work $n^{\\log_b a}$ against combine work $f(n)$.",
    detailedExplanation:
      "For $a \\ge 1$, $b > 1$, the recursion tree has depth $\\log_b n$ and $n^{\\log_b a}$ leaves. Case 1: if $f(n) = O(n^{\\log_b a - \\epsilon})$, leaf cost dominates so $T(n) = \\Theta(n^{\\log_b a})$. Case 2: if $f(n) = \\Theta(n^{\\log_b a} \\log^k n)$, work is balanced across levels so $T(n) = \\Theta(n^{\\log_b a} \\log^{k+1} n)$ (e.g., Mergesort with $a=2, b=2, f(n)=\\Theta(n) \\implies \\Theta(n \\log n)$). Case 3: if $f(n) = \\Omega(n^{\\log_b a + \\epsilon})$ and $a f(n/b) \\le c f(n)$ for $c<1$, root work dominates so $T(n) = \\Theta(f(n))$.",
    formulaLatex:
      "T(n) = a T\\!\\left(\\frac{n}{b}\\right) + f(n), \\quad c_{\\text{crit}} = \\log_b a",
    relatedLessonSlugs: ["asymptotics-recurrences-graphs"],
  },
  {
    id: "amortized-analysis",
    term: "Amortized Analysis (Aggregate & Potential)",
    domainId: "data-structures-algorithms",
    shortDefinition:
      "Worst-case analysis of the average cost per operation over any sequence of operations, proving occasional expensive steps cannot raise long-run per-op cost.",
    detailedExplanation:
      "Unlike probabilistic average-case analysis (which assumes random inputs), amortized analysis gives a deterministic worst-case guarantee over an entire sequence. Using the potential method, each operation's amortized cost is $\\hat{c}_i = c_i + \\Phi(D_i) - \\Phi(D_{i-1})$ where $\\Phi(D_0)=0$ and $\\Phi(D_i) \\ge 0$. For a dynamic array doubling capacity at powers of 2, setting $\\Phi = 2n - m$ pays for the $O(n)$ reallocation copy ahead of time, yielding $\\hat{c}_i = O(1)$ per `push`.",
    formulaLatex:
      "\\sum_{i=1}^n c_i = \\sum_{i=1}^n \\hat{c}_i - \\big(\\Phi(D_n) - \\Phi(D_0)\\big) \\le \\sum_{i=1}^n \\hat{c}_i",
    relatedLessonSlugs: ["asymptotics-recurrences-graphs", "data-structures-sorting-hashing"],
  },
  {
    id: "open-addressing-probe",
    term: "Open Addressing & Robin Hood Hashing",
    domainId: "data-structures-algorithms",
    shortDefinition:
      "A hash-table collision strategy storing all entries inline in a contiguous array and resolving collisions via deterministic probe sequences rather than linked lists.",
    detailedExplanation:
      "Separate chaining allocates per-node heap blocks, causing pointer chasing and cache misses. Open addressing (linear probing, quadratic probing, SwissTable SIMD group probing) packs slots contiguously so probes stay inside a single 64-byte cache line. Robin Hood hashing tracks each key's probe distance (PSL) and swaps an incoming key with a resident key that has a smaller PSL, bounding probe variance and enabling fast early termination on lookup misses.",
    relatedLessonSlugs: ["data-structures-sorting-hashing"],
  },
  {
    id: "cache-oblivious-layout",
    term: "Cache-Aware & Cache-Oblivious Data Layout",
    domainId: "data-structures-algorithms",
    shortDefinition:
      "Structuring memory layouts (B-trees, flat arrays, van Emde Boas layouts) to minimize cache-line and page transfers without hardcoding cache parameters.",
    detailedExplanation:
      "Two algorithms with identical $\\Theta(n \\log n)$ operation counts can differ by 10x in wall-clock time due to spatial locality. Cache-aware B-trees choose branching factor $B$ to match a 4 KiB page or 64 B cache line, cutting tree height from $\\log_2 N$ to $\\log_B N$. Cache-oblivious layouts such as recursive van Emde Boas tree layouts or Z-order matrices achieve optimal $O(\\log_B N)$ cache transfers simultaneously at every level of the memory hierarchy (L1, L2, L3, TLB) without knowing $B$ or $M$.",
    formulaLatex:
      "Q_{\\text{B-tree}}(N) = \\Theta\\!\\left(\\log_B N\\right) = \\Theta\\!\\left(\\frac{\\log_2 N}{\\log_2 B}\\right)",
    relatedLessonSlugs: ["data-structures-sorting-hashing"],
  },
];
