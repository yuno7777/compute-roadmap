import type { PlainEnglishGuide } from "./track12";

export const TRACK_3_4_PLAIN_GUIDES: Record<string, PlainEnglishGuide> = {
  "boot-bios-uefi-kernels": {
    bigPicture:
      "When you press the power button, RAM is completely empty and the CPU knows nothing about your files or OS. Hardwired silicon forces the CPU to jump to a fixed 'reset vector' address inside permanent motherboard firmware (UEFI). UEFI wakes up RAM, checks hardware, verifies signatures, loads a small bootloader from disk, and hands control to the OS Kernel—which then takes over managing every program, memory page, and device.",
    howItInteracts:
      "Booting is the exact bridge between hardware architecture (Track 2) and software systems (Track 3): once the kernel switches the CPU into protected virtual-memory mode, user applications can safely run side by side (Lessons 24–26).",
    symbolDecoder: [
      {
        symbol: "Reset Vector",
        plainName: "First Hardwired Address",
        whatItMeans:
          "The fixed memory address the CPU always fetches its very first instruction from right after power-on.",
      },
      {
        symbol: "UEFI / Bootloader",
        plainName: "Hardware Wake-Up & OS Launcher",
        whatItMeans:
          "Firmware that initializes RAM/PCIe devices and loads the OS kernel image from your SSD's EFI partition.",
      },
      {
        symbol: "Kernel",
        plainName: "Master Resource Manager",
        whatItMeans:
          "The privileged core of the operating system that owns CPU scheduling, virtual memory, drivers, and security boundaries.",
      },
    ],
  },
  "processes-threads-scheduling": {
    bigPicture:
      "Even a single CPU core makes it look like Spotify, your browser, and your code editor are all running at once. It does this by rapidly switching between Programs ('Processes') every few milliseconds—freezing one process's registers onto memory and loading another's ('Context Switch'). Threads are lightweight workers inside the *same* process that share memory so they can cooperate faster, while the OS Scheduler decides who gets the CPU next so interactive apps stay snappy.",
    howItInteracts:
      "Scheduling tradeoffs (fast response vs. high throughput) show up again in async runtimes (Lesson 41) and container CPU quotas (Lesson 43), while shared-memory threads create the synchronization hazards solved by atomics and locks.",
    symbolDecoder: [
      {
        symbol: "Process vs. Thread",
        plainName: "Isolated House vs. Roommates",
        whatItMeans:
          "Each Process has its own private virtual memory; Threads live inside one process, sharing memory while each keeping its own stack and registers.",
      },
      {
        symbol: "Context Switch",
        plainName: "Swapping Active Workers",
        whatItMeans:
          "Saving the current thread's CPU registers and loading the next thread's registers—fast (~microseconds) but flushes hot caches if overdone.",
      },
      {
        symbol: "Time Quantum (Round-Robin / MLFQ)",
        plainName: "CPU Turn Length",
        whatItMeans:
          "How long a thread runs before the timer interrupt lets the scheduler give another waiting thread a turn.",
      },
    ],
  },
  "interrupts-syscalls-privilege": {
    bigPicture:
      "You wouldn't let a random webpage directly erase your SSD or read another app's passwords. CPUs enforce hardware 'Privilege Rings': ordinary apps run in restricted User Mode (Ring 3), while only the OS Kernel runs in unrestricted Kernel Mode (Ring 0). Whenever an app needs a file or network socket, it rings a controlled doorbell called a System Call (`syscall`); whenever a keyboard key or timer fires, hardware rings an Interrupt to pause user code and wake the kernel.",
    howItInteracts:
      "Privilege boundaries are the foundation of OS isolation, virtual memory protection (Lesson 26), container sandboxing (Lesson 43), and hardware security (Lesson 44).",
    symbolDecoder: [
      {
        symbol: "User Mode vs. Kernel Mode",
        plainName: "Guest Access vs. Admin Hardware Access",
        whatItMeans:
          "CPU hardware flag preventing normal programs from touching raw devices, page tables, or other processes' RAM.",
      },
      {
        symbol: "System Call (syscall)",
        plainName: "Controlled Request to the OS",
        whatItMeans:
          "Special CPU instruction that safely transitions into Kernel Mode to ask the OS to read a file, allocate memory, or send a packet.",
      },
      {
        symbol: "Interrupt (IRQ)",
        plainName: "Hardware Tap on the Shoulder",
        whatItMeans:
          "Electrical signal from a timer, SSD, or network card telling the CPU to pause what it's doing and run a kernel handler.",
      },
    ],
  },
  "virtual-memory-paging-tlb": {
    bigPicture:
      "Virtual Memory is one of the cleverest illusions in computing: the OS convinces every single program that it owns a clean, giant, private block of RAM starting at address 0. Behind the scenes, a hardware translator inside the CPU (the MMU) chops memory into 4 KB 'Pages' and looks up where each virtual page actually lives in physical RAM using a Page Table. Because walking Page Tables in RAM is slow, the CPU keeps a tiny ultra-fast cheat sheet of recent translations called the TLB.",
    howItInteracts:
      "Virtual memory stops buggy apps from crashing each other, lets the OS map files directly into memory, powers copy-on-write `fork()`, and forms the bedrock of virtual machines (Lesson 43) and PagedAttention KV-cache management in LLMs (Lesson 57).",
    symbolDecoder: [
      {
        symbol: "Virtual vs. Physical Address",
        plainName: "Program's Private Address vs. Real RAM Slot",
        whatItMeans:
          "Programs only ever see Virtual Addresses; the CPU's MMU silently translates them into real Physical RAM addresses on every memory access.",
      },
      {
        symbol: "Page Table & Page Fault",
        plainName: "Address Map & Missing-Page Alarm",
        whatItMeans:
          "The OS-maintained map from virtual pages to physical frames. Touching an unmapped page triggers a Page Fault so the OS loads it (or crashes on segfault).",
      },
      {
        symbol: "TLB (Translation Lookaside Buffer)",
        plainName: "Address Translation Cache",
        whatItMeans:
          "Tiny SRAM cache inside the CPU storing recent virtual→physical mappings so translation takes ~1 cycle instead of 4 RAM lookups.",
      },
    ],
  },
  "drivers-and-filesystems": {
    bigPicture:
      "Raw storage drives only understand numbered blocks of bytes—they have no idea what a 'folder' or 'resume.pdf' is. A Filesystem is the filing-cabinet index stored on disk that maps human filenames to metadata records ('inodes') and lists of data blocks, using a Write-Ahead Journal so a sudden power cut doesn't corrupt your folder tree. Device Drivers translate generic OS read/write calls into each hardware vendor's exact register commands, using DMA so devices transfer megabytes directly to RAM without babysitting from the CPU.",
    howItInteracts:
      "Filesystems bridge raw SSD hardware (Lesson 20) to everyday user apps and database storage engines (Lesson 38), where WAL journals and page-cache buffering reappear directly.",
    symbolDecoder: [
      {
        symbol: "Inode",
        plainName: "File Identity Card",
        whatItMeans:
          "On-disk record holding a file's size, permissions, timestamps, and pointers to its actual data blocks (separate from its filename).",
      },
      {
        symbol: "Journaling (WAL)",
        plainName: "Crash-Safe Checklist",
        whatItMeans:
          "Writing intended metadata changes to a sequential log *before* modifying the filesystem tree so power loss can cleanly replay or undo.",
      },
      {
        symbol: "DMA (Direct Memory Access)",
        plainName: "CPU-Free Bulk Copy",
        whatItMeans:
          "Lets SSDs, GPUs, and network cards copy large buffers straight into/out of RAM and fire one interrupt when finished.",
      },
    ],
  },
  "c-and-rust-memory-models": {
    bigPicture:
      "Programs store data in two places: the fast automatic Stack (for short-lived local variables) and the flexible Heap (for data whose size or lifetime isn't known upfront). C gives you raw memory pointers and total freedom—blazingly fast, but forgetting to `free()` leaks memory and using freed memory causes crashes or security holes. Rust achieves the exact same zero-overhead speed by enforcing 'Ownership & Borrowing' at compile time: every heap value has one owner, and you can have many readers OR one exclusive writer—never both at once.",
    howItInteracts:
      "Understanding stack vs. heap allocation explains why systems languages power OS kernels, compilers, databases, and game engines, and why Rust's compile-time borrow checker eliminates entire classes of memory-safety CVEs (Lesson 44).",
    symbolDecoder: [
      {
        symbol: "Stack vs. Heap",
        plainName: "Auto-Cleaned Desk vs. Rented Warehouse",
        whatItMeans:
          "Stack memory is freed automatically when a function returns; Heap memory persists until explicitly freed (or dropped by its owner).",
      },
      {
        symbol: "Ownership & Move",
        plainName: "Single-Owner Responsibility",
        whatItMeans:
          "In Rust, assigning `let b = a` transfers ownership to `b` and invalidates `a`, guaranteeing the memory is freed once and never double-freed.",
      },
      {
        symbol: "Borrowing (&T vs. &mut T)",
        plainName: "Read-Only Pass vs. Exclusive Edit Pass",
        whatItMeans:
          "Shared borrows (`&T`) allow unlimited simultaneous readers; a mutable borrow (`&mut T`) requires exclusive access to prevent data races.",
      },
    ],
  },
  "python-js-ts-runtimes": {
    bigPicture:
      "Languages like Python and JavaScript trade manual memory control for developer speed by running inside a managed Runtime. Instead of making you free memory, Python counts references to every object (and runs a cycle collector), while JavaScript's V8 engine uses a generational Garbage Collector and JIT compiler to turn hot JS functions into fast machine code. In JavaScript, a single-threaded Event Loop keeps UIs responsive by draining fast Promise Microtasks immediately after synchronous code, before moving to Timers and I/O.",
    howItInteracts:
      "Knowing how Python aliases mutable objects, how V8 optimizes consistent object shapes, and how JS microtasks outrun timers prevents subtle bugs and connects directly to bytecode VMs/JITs (Lesson 32) and async executors (Lesson 41).",
    symbolDecoder: [
      {
        symbol: "Alias vs. Shallow vs. Deep Copy",
        plainName: "Same Object vs. Shared Insides vs. Full Clone",
        whatItMeans:
          "Alias (`b = a`) points to the exact same object; shallow copy clones only the outer container; deep copy duplicates nested items too.",
      },
      {
        symbol: "Garbage Collection (GC)",
        plainName: "Automatic Memory Sweeper",
        whatItMeans:
          "Runtime system that periodically finds unreachable heap objects and reclaims their RAM automatically.",
      },
      {
        symbol: "Microtask vs. Macrotask",
        plainName: "VIP Queue vs. Standard Queue",
        whatItMeans:
          "In JS, resolved `Promise.then` callbacks (microtasks) ALWAYS run completely before the next `setTimeout` or UI event (macrotask).",
      },
    ],
  },
  "lexing-parsing-ast": {
    bigPicture:
      "A compiler doesn't magically 'understand' code—it reads source text in clean stages. First, the Lexer groups raw characters into meaningful words called Tokens (`let`, `x`, `=`, `2`, `+`, `3`, `*`, `4`). Next, the Parser checks grammar rules and operator precedence (`*` binds tighter than `+`) to build an Abstract Syntax Tree (AST)—a tree diagram showing exactly which sub-expressions belong together.",
    howItInteracts:
      "Every language tool you use—compilers, linters, Prettier formatters, TypeScript type checkers, and SQL query planners (Lesson 39)—starts by turning flat text into tokens and an AST before doing any optimization (Lesson 31).",
    symbolDecoder: [
      {
        symbol: "Lexer (Tokenizer)",
        plainName: "Character-to-Word Grouper",
        whatItMeans:
          "Scans raw text character by character, skipping whitespace and emitting tagged tokens like NUMBER, IDENTIFIER, or OPERATOR.",
      },
      {
        symbol: "Parser & Grammar",
        plainName: "Structure Builder",
        whatItMeans:
          "Applies language rules (like multiplication before addition) to verify syntax and nest tokens into a tree.",
      },
      {
        symbol: "AST (Abstract Syntax Tree)",
        plainName: "Program Blueprint Tree",
        whatItMeans:
          "Tree representation of code where punctuation noise is stripped away and parent nodes represent operations on their child expressions.",
      },
    ],
  },
  "ir-llvm-optimization-codegen": {
    bigPicture:
      "Rather than writing separate optimizers for every language × CPU combo (C, Rust, Swift × x86, ARM, RISC-V), modern compilers like LLVM translate every language's AST into one clean middle language called Intermediate Representation (IR). In SSA form ('Static Single Assignment'), every variable is assigned only once—making it easy for the optimizer to fold constants (`2 + 3 * 4 → 14`), delete dead code, and inline functions before lowering to final CPU machine code.",
    howItInteracts:
      "Compiler optimizations are why readable high-level C/Rust code can match hand-tuned assembly, and why modern ML compilers (Triton, XLA, TVM) reuse the exact same IR/pass architecture to generate fast GPU kernels (Lesson 49).",
    symbolDecoder: [
      {
        symbol: "IR (Intermediate Representation)",
        plainName: "Universal Middle Language",
        whatItMeans:
          "A clean, machine-independent instruction format sitting between high-level source code and target-specific assembly.",
      },
      {
        symbol: "SSA Form",
        plainName: "Assign-Once Variables",
        whatItMeans:
          "Every temporary register (`%t1`, `%t2`) is written exactly once, making data dependencies crystal clear for optimization passes.",
      },
      {
        symbol: "Constant Folding & DCE",
        plainName: "Compile-Time Shortcuts",
        whatItMeans:
          "Constant Folding precomputes fixed math at compile time; Dead-Code Elimination (DCE) deletes calculations whose results are never used.",
      },
    ],
  },
  "linkers-interpreters-jit": {
    bigPicture:
      "Once a compiler turns each source file into object code, a Linker stitches all those object files and external libraries together into one runnable program, filling in final memory addresses. Interpreters skip ahead-of-time machine code and execute bytecode step-by-step directly, while a Just-In-Time (JIT) compiler watches which loops run most often ('hot paths') and compiles just those hot spots into native CPU instructions while the program is running!",
    howItInteracts:
      "Static vs. dynamic linking explains `.dll`/`.so` shared libraries and startup time, while JIT compilation explains how JavaScript (V8) and Java (HotSpot) reach near-C speed despite starting as dynamic languages (Lesson 29).",
    symbolDecoder: [
      {
        symbol: "Linker & Symbol Table",
        plainName: "Cross-File Stitcher",
        whatItMeans:
          "Matches function calls in one file to their definitions in another file or library and resolves their memory offsets.",
      },
      {
        symbol: "Bytecode VM",
        plainName: "Portable Virtual CPU",
        whatItMeans:
          "Executes compact platform-independent instructions (like Python `.pyc` or JVM bytecode) inside a software loop.",
      },
      {
        symbol: "JIT Compiler",
        plainName: "On-the-Fly Turbocharger",
        whatItMeans:
          "Profiles running code and dynamically compiles frequently executed functions into native machine code.",
      },
    ],
  },
  "asymptotics-recurrences-graphs": {
    bigPicture:
      "Big-O notation isn't about measuring exact milliseconds—it asks: 'When my input grows 10× bigger, does my algorithm take 10× longer, 100× longer, or barely budge?' Binary search ($O(\\log n)$) finds a name in 1 billion sorted entries in just 30 steps, whereas scanning one by one ($O(n)$) takes a billion! Graphs model any network of connected things (roads, social links, lesson prerequisites), letting algorithms like BFS and Dijkstra find shortest paths systematically.",
    howItInteracts:
      "Big-O complexity guides every real system choice: why databases use $O(\\log n)$ B+ trees (Lesson 38), why routers run Dijkstra/shortest-path routing (Lesson 35), and why vanilla Transformer attention's $O(n^2)$ scaling drives modern AI systems research (Lesson 54).",
    symbolDecoder: [
      {
        symbol: "O(1), O(log n), O(n), O(n²)",
        plainName: "Growth-Rate Speed Classes",
        whatItMeans:
          "O(1): instant regardless of size; O(log n): halves the problem each step; O(n): checks each item once; O(n²): compares every pair.",
      },
      {
        symbol: "BFS vs. Dijkstra",
        plainName: "Fewest Hops vs. Lowest Total Cost",
        whatItMeans:
          "BFS finds the shortest path when every edge costs 1; Dijkstra uses a priority queue to find the cheapest path when edges have different weights.",
      },
      {
        symbol: "DAG (Directed Acyclic Graph)",
        plainName: "One-Way Dependency Map",
        whatItMeans:
          "A graph with directed arrows and no cycles—used for build systems, neural computation graphs, and this curriculum's prerequisite map!",
      },
    ],
  },
  "data-structures-sorting-hashing": {
    bigPicture:
      "Choosing a data structure is choosing which operations are cheap and which are expensive. Contiguous Arrays let the CPU leap to any index instantly and love CPU caches (Lesson 19). Hash Tables turn keys into array slots in $O(1)$ average time for instant lookups. Balanced Trees keep data sorted dynamically in $O(\\log n)$ time, while fast sorting algorithms (Quicksort, Mergesort) divide-and-conquer large lists in $O(n \\log n)$ time.",
    howItInteracts:
      "In real hardware, cache locality often beats pure Big-O: a contiguous array scan can crush a pointer-chasing linked list. Balanced trees evolve directly into disk-friendly B+ trees inside SQL databases (Lesson 38).",
    symbolDecoder: [
      {
        symbol: "Hash Function & Collision",
        plainName: "Key-to-Slot Scrambler",
        whatItMeans:
          "Converts any key (like a string) into an array index. When two keys land on the same slot, probing or chaining resolves the collision.",
      },
      {
        symbol: "Cache Locality",
        plainName: "Hardware-Friendly Memory Layout",
        whatItMeans:
          "Storing elements side-by-side in RAM so one 64-byte cache-line fetch brings in multiple items at once.",
      },
      {
        symbol: "O(n log n) Sorting",
        plainName: "Divide-and-Conquer Ordering",
        whatItMeans:
          "Splitting a list into halves recursively (log n levels) and merging/partitioning linearly (n work per level).",
      },
    ],
  },
  "physical-layer-ethernet-ip": {
    bigPicture:
      "Sending a message across the Internet works like mailing a nested envelope. At the bottom, the Physical Layer turns bits into light pulses, radio waves, or electrical voltages. Ethernet wraps your message for a single local hop (using MAC hardware addresses), while IP wraps it for the whole global journey (using IP addresses and routers that forward packets hop-by-hop using routing tables and a TTL countdown so lost packets don't loop forever).",
    howItInteracts:
      "IP only promises 'best-effort' delivery—packets can arrive out of order or vanish completely. That's why TCP (Lesson 36) sits on top of IP to add reliability, and why distributed systems (Lesson 42) must survive sudden network partitions.",
    symbolDecoder: [
      {
        symbol: "MAC vs. IP Address",
        plainName: "Local Hardware ID vs. Global Mailing Address",
        whatItMeans:
          "MAC addresses identify a device on one local Wi-Fi/Ethernet link; IP addresses route packets across networks worldwide.",
      },
      {
        symbol: "TTL (Time To Live)",
        plainName: "Hop Countdown",
        whatItMeans:
          "Decremented by 1 at every router. If it hits 0, the packet is dropped so routing bugs can't flood the Internet forever.",
      },
      {
        symbol: "CIDR Subnet (e.g., /24)",
        plainName: "Network Prefix Grouping",
        whatItMeans:
          "Tells routers how many leading bits identify the network neighborhood so routing tables stay compact.",
      },
    ],
  },
  "tcp-udp-congestion-control": {
    bigPicture:
      "UDP simply fires packets off with zero promises—ideal for live voice or gaming where a late packet is useless. TCP turns unreliable IP packets into a rock-solid, ordered byte stream: both sides shake hands (SYN, SYN-ACK, ACK), number every byte, retransmit anything lost, and politely throttle their sending speed ('Congestion Control') so millions of users don't gridlock shared Internet links.",
    howItInteracts:
      "TCP's handshake and congestion window (`cwnd`) directly govern web page load latency, motivating HTTP/3 over QUIC (Lesson 37) and explaining why network stalls happen in cloud databases and distributed training clusters (Lesson 56).",
    symbolDecoder: [
      {
        symbol: "3-Way Handshake",
        plainName: "Connection Setup Greeting",
        whatItMeans:
          "SYN → SYN-ACK → ACK synchronizes starting sequence numbers on both sides before application data flows.",
      },
      {
        symbol: "cwnd (Congestion Window)",
        plainName: "In-Flight Speed Limit",
        whatItMeans:
          "How many packets a sender allows on the wire at once without waiting for ACKs—grows gently when healthy, cuts sharply on packet loss.",
      },
      {
        symbol: "RTT (Round-Trip Time)",
        plainName: "There-and-Back Delay",
        whatItMeans:
          "Time for a packet to reach the server and its acknowledgment to return—determines how fast TCP ramps up speed.",
      },
    ],
  },
  "dns-http-tls-sockets": {
    bigPicture:
      "When you type a URL in your browser, four layers collaborate seamlessly: DNS acts like the Internet's phonebook (turning `compute-roadmap.vercel.app` into an IP address), OS Sockets open a TCP/QUIC channel, TLS encrypts the pipe and proves the server's identity with a certificate so nobody on your Wi-Fi can spy or tamper, and HTTP exchanges structured requests and responses (`GET /labs`, `200 OK`).",
    howItInteracts:
      "TLS relies directly on public-key key exchange and symmetric encryption (Lesson 44), while POSIX sockets tie back to OS file descriptors and system calls (Lesson 25).",
    symbolDecoder: [
      {
        symbol: "DNS",
        plainName: "Internet Phonebook",
        whatItMeans:
          "Hierarchical cached lookup system translating human domain names into numeric IP addresses.",
      },
      {
        symbol: "TLS 1.3",
        plainName: "Encrypted Tamper-Proof Tunnel",
        whatItMeans:
          "Establishes a shared secret key in 1 round-trip and authenticates the server via X.509 certificates.",
      },
      {
        symbol: "Socket",
        plainName: "Program's Network Plug",
        whatItMeans:
          "An OS handle (like a file descriptor) that lets application code `send()` and `recv()` bytes over TCP or UDP.",
      },
    ],
  },
  "database-storage-btrees-lsm": {
    bigPicture:
      "Databases have to store terabytes safely on SSDs while answering lookups in milliseconds. They rely on two classic disk data structures: B+ Trees (wide, shallow sorted trees where every leaf sits at the same depth—fantastic for fast reads and range scans) and LSM-Trees (Log-Structured Merge trees that buffer writes in RAM and flush big sorted files sequentially—fantastic for massive write throughput). Both write changes to an append-only Write-Ahead Log (WAL) first so crashes never lose committed data.",
    howItInteracts:
      "Storage engines are a direct response to SSD/disk physics (Lesson 20) and cache hierarchies (Lesson 19): minimizing random disk seeks and write amplification is the entire game.",
    symbolDecoder: [
      {
        symbol: "B+ Tree",
        plainName: "Disk-Friendly Sorted Index",
        whatItMeans:
          "A balanced tree where each node fills a 4–16 KB disk page and all values live in linked leaf nodes—finding 1 row in a billion takes ~4 page reads.",
      },
      {
        symbol: "LSM-Tree & Compaction",
        plainName: "Append-Fast, Merge-Later Engine",
        whatItMeans:
          "Writes go fast into a RAM MemTable + WAL, flush into immutable SSTables, and get merged in the background (compaction).",
      },
      {
        symbol: "Bloom Filter",
        plainName: "Fast 'Definitely Not Here' Check",
        whatItMeans:
          "Tiny bit array that quickly skips SSTable files that cannot possibly contain the key you're searching for.",
      },
    ],
  },
  "transactions-mvcc-query-execution": {
    bigPicture:
      "If two people transfer money at the exact same millisecond—or the power fails halfway through—a database must never leave half-finished garbage behind. ACID Transactions bundle multiple reads and writes into an all-or-nothing unit. Modern databases like PostgreSQL use MVCC ('Multi-Version Concurrency Control'): instead of making readers wait for writers, each row keeps timestamped versions so readers see a clean frozen snapshot while writers keep working.",
    howItInteracts:
      "MVCC builds on WAL durability (Lesson 38) and mirrors lock-free concurrency ideas (Lesson 41), while query planners apply algorithmic join tradeoffs (Hash Join vs. Merge Join, Lesson 34) to execute SQL orders of magnitude faster.",
    symbolDecoder: [
      {
        symbol: "ACID",
        plainName: "All-or-Nothing Safety Guarantees",
        whatItMeans:
          "Atomicity (all or none), Consistency (valid rules), Isolation (concurrent users don't corrupt each other), Durability (survives crashes).",
      },
      {
        symbol: "MVCC",
        plainName: "Snapshot Versioning",
        whatItMeans:
          "Stores multiple versions of updated rows tagged with transaction IDs so readers never block writers and writers never block readers.",
      },
      {
        symbol: "Query Planner",
        plainName: "SQL Route Optimizer",
        whatItMeans:
          "Estimates table sizes and index costs to pick the fastest physical execution plan (index scan vs. hash join) for a declarative SQL query.",
      },
    ],
  },
  "vector-databases-ann-search": {
    bigPicture:
      "Traditional databases look for exact matches (`price = 20`). AI systems represent sentences, images, and code as long lists of numbers called Embeddings, where *similar meanings sit close together in space*. Checking every single vector among 100 million entries is too slow, so Vector Databases use Approximate Nearest Neighbor (ANN) indexes—like HNSW, a multi-layer expressway graph that hops quickly across coarse highways before zooming in on the exact neighborhood.",
    howItInteracts:
      "Vector search connects linear algebra dot products (Lesson 45), graph traversal (Lesson 33), and Transformer embeddings (Lesson 54) to power semantic search and Retrieval-Augmented Generation (RAG).",
    symbolDecoder: [
      {
        symbol: "Embedding Vector",
        plainName: "Meaning as Coordinates",
        whatItMeans:
          "A list of hundreds/thousands of numbers produced by a neural network where semantically similar items point in similar directions.",
      },
      {
        symbol: "Cosine Similarity",
        plainName: "Angle Alignment Score",
        whatItMeans:
          "Measures how closely two vectors point in the same direction (1 = identical direction, 0 = unrelated, −1 = opposite).",
      },
      {
        symbol: "HNSW",
        plainName: "Multi-Layer Expressway Graph",
        whatItMeans:
          "Hierarchical Navigable Small World graph: sparse top layers make big leaps; dense bottom layers refine the closest matches in milliseconds.",
      },
    ],
  },
  "threads-atomics-async-runtimes": {
    bigPicture:
      "When two CPU cores increment the same shared counter (`count = count + 1`) at the same time, both might read `5`, add `1`, and write `6`—losing an update! This is a Data Race. Hardware solves it with Atomic instructions (indivisible read-modify-write operations like Compare-And-Swap) and Memory Fences, which OS locks (Mutexes) build upon. For handling 100,000 idle network connections without 100,000 heavy OS threads, Async Runtimes multiplex tiny tasks over a small thread pool using OS event notifications (`epoll`/`io_uring`).",
    howItInteracts:
      "Hardware atomics rely directly on CPU cache coherence (Lesson 19), while async executors combine OS scheduling (Lesson 24) with non-blocking sockets (Lesson 37) to power modern high-concurrency web servers.",
    symbolDecoder: [
      {
        symbol: "Data Race",
        plainName: "Unsynchronized Concurrent Collision",
        whatItMeans:
          "Two threads access the same memory simultaneously and at least one writes, causing unpredictable corrupted results.",
      },
      {
        symbol: "CAS (Compare-And-Swap)",
        plainName: "Indivisible Conditional Update",
        whatItMeans:
          "Hardware instruction that says: 'Only replace memory value X with Y if it still equals expected E'—all in one uninterruptible step.",
      },
      {
        symbol: "Mutex vs. Async Task",
        plainName: "Room Key vs. Cooperative Multiplexing",
        whatItMeans:
          "A Mutex lets only one thread enter a critical section at a time; Async tasks yield cleanly while waiting for I/O so one thread handles thousands of requests.",
      },
    ],
  },
  "distributed-consensus-raft": {
    bigPicture:
      "When your data is replicated across 5 servers in different racks, any server can crash and any network cable can be unplugged. How do the surviving servers agree on the exact order of writes without two servers both thinking they are the boss ('Split Brain')? Consensus algorithms like Raft require a strict Majority Quorum (at least 3 of 5) to elect one Leader per numbered Term and to commit every log entry—mathematically guaranteeing that two disconnected sides can never commit conflicting histories.",
    howItInteracts:
      "Raft powers the coordination backbone of Kubernetes (`etcd`), CockroachDB, and distributed storage systems—extending single-machine WAL logs (Lesson 38) across unreliable IP networks (Lesson 35).",
    symbolDecoder: [
      {
        symbol: "Quorum (Majority)",
        plainName: "More Than Half of Nodes",
        whatItMeans:
          "Any two majorities in a cluster MUST overlap by at least one server—guaranteeing every new leader knows all previously committed writes.",
      },
      {
        symbol: "Term",
        plainName: "Logical Leadership Era",
        whatItMeans:
          "An ever-increasing election number that acts like a logical clock so stale leaders immediately step down when they hear a higher term.",
      },
      {
        symbol: "Network Partition",
        plainName: "Broken Communication Link",
        whatItMeans:
          "When healthy servers can't talk to each other. In Raft, the majority side keeps working safely while the minority side pauses writes.",
      },
    ],
  },
  "containers-virtualization": {
    bigPicture:
      "Cloud servers run dozens of different customers' apps on one physical machine safely using two levels of isolation. Containers (like Docker) are actually ordinary Linux processes wearing blinders: Kernel Namespaces give each container its own private view of files, PIDs, and network, while cgroups cap its CPU and RAM—all sharing one host kernel with near-zero overhead. Virtual Machines (VMs) go deeper, using CPU hardware virtualization (VT-x/KVM) to run an entire separate guest OS kernel.",
    howItInteracts:
      "Containers directly reuse OS process tables, virtual memory, and filesystems (Track 3), while cloud platforms like AWS Firecracker combine lightweight microVMs with container images for strong multi-tenant security (Lesson 44).",
    symbolDecoder: [
      {
        symbol: "Namespaces",
        plainName: "What a Process Can See",
        whatItMeans:
          "Linux kernel feature isolating a container's process IDs, filesystem mounts, hostname, and network interfaces from the host.",
      },
      {
        symbol: "cgroups",
        plainName: "How Much a Process Can Use",
        whatItMeans:
          "Kernel accounting rules enforcing hard limits on a container's CPU share, RAM cap, and disk I/O.",
      },
      {
        symbol: "Hypervisor (KVM)",
        plainName: "Virtual Machine Manager",
        whatItMeans:
          "Software + CPU hardware extensions that let multiple independent guest operating systems share one physical machine securely.",
      },
    ],
  },
  "cryptography-memory-hardware-security": {
    bigPicture:
      "Computer security protects secrets and integrity across both math and silicon. Cryptography lets two strangers agree on a shared secret key over a public wire (Diffie-Hellman), scramble data fast (AES), and verify nothing was tampered with using a 1-way fingerprint (SHA-256) where flipping 1 single input bit scrambles ~50% of the output! Meanwhile, OS and CPU defenses (ASLR, non-executable stacks, Rust memory safety, and speculative-execution mitigations) stop attackers from hijacking program control flow.",
    howItInteracts:
      "Security unifies the entire stack: modular math powers TLS (Lesson 37), stack layouts explain buffer overflows (Lesson 17), and CPU branch prediction + caches explain why Spectre could leak secrets across privilege rings (Lessons 19, 21, 25).",
    symbolDecoder: [
      {
        symbol: "Symmetric vs. Asymmetric Crypto",
        plainName: "Same Key vs. Public/Private Pair",
        whatItMeans:
          "Symmetric (AES) is ultra-fast with one shared key; Asymmetric (DH/RSA/ECC) lets strangers safely establish that shared key over public networks.",
      },
      {
        symbol: "Avalanche Effect (SHA-256)",
        plainName: "Unpredictable Fingerprint",
        whatItMeans:
          "Changing even 1 bit of a gigabyte file flips roughly half of the 256 hash output bits—making forgery or silent tampering detectable.",
      },
      {
        symbol: "ASLR & NX/DEP",
        plainName: "Anti-Exploit Guardrails",
        whatItMeans:
          "ASLR randomizes memory addresses so attackers can't guess jump targets; NX marks data/stack memory non-executable.",
      },
    ],
  },
};
