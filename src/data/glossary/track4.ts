import type { GlossaryTerm } from "@/types/curriculum";

export const TRACK_4_GLOSSARY: GlossaryTerm[] = [
  {
    id: "osi-encapsulation",
    term: "Protocol Encapsulation & PDU Layering",
    domainId: "computer-networking",
    shortDefinition:
      "Wrapping a higher-layer payload inside a lower-layer header (and optional trailer) as data descends the network stack.",
    detailedExplanation:
      "Each protocol layer treats the entire Protocol Data Unit (PDU) from the layer above as an opaque payload: application bytes become a TCP segment (L4), which becomes an IP packet (L3), which becomes an Ethernet frame (L2) transmitted as symbols on the physical wire (L1). Decapsulation strips each header in reverse order at intermediate switches/routers and the destination host.",
    formulaLatex:
      "\\text{Wire Efficiency} = \\frac{L_{\\text{payload}}}{L_{\\text{L2}} + L_{\\text{IP}} + L_{\\text{L4}} + L_{\\text{payload}}}",
    relatedLessonSlugs: [
      "physical-layer-ethernet-ip",
      "tcp-udp-congestion-control",
      "dns-http-tls-sockets",
    ],
  },
  {
    id: "arp-mac-switching",
    term: "ARP & L2 MAC Learning Switch",
    domainId: "computer-networking",
    shortDefinition:
      "Address Resolution Protocol maps a next-hop IPv4 address to a 48-bit Ethernet MAC address on the local broadcast domain, while L2 switches forward frames via learned MAC-to-port tables.",
    detailedExplanation:
      "When a host needs to send an IP packet to an on-link neighbor or default gateway whose link-layer address is unknown, it broadcasts an ARP Request (ff:ff:ff:ff:ff:ff) asking who owns the target IP. Ethernet switches inspect every incoming frame's source MAC to populate their CAM (Content Addressable Memory) forwarding table and unicast frames out only the destination port rather than flooding.",
    relatedLessonSlugs: ["physical-layer-ethernet-ip"],
  },
  {
    id: "cidr-longest-prefix-match",
    term: "CIDR & Longest Prefix Match (LPM)",
    domainId: "computer-networking",
    shortDefinition:
      "Classless Inter-Domain Routing represents IP subnets as prefix/length pairs (e.g., 192.0.2.0/24), and routers forward packets using the most specific matching route.",
    detailedExplanation:
      "Instead of rigid classful boundaries, CIDR splits 32-bit IPv4 (or 128-bit IPv6) addresses at arbitrary bit boundaries. When multiple routing table entries match a destination IP, hardware TCAMs or software radix/DXR tries select the entry with the largest prefix length n, enabling hierarchical route aggregation alongside specific host or subnet overrides.",
    formulaLatex:
      "\\text{prefix}(x, n) = x \\gg (32 - n), \\quad \\text{route} = \\arg\\max_{r:\\, \\text{match}(d, r)} r.\\text{len}",
    relatedLessonSlugs: ["physical-layer-ethernet-ip"],
  },
  {
    id: "tcp-three-way-handshake",
    term: "TCP Three-Way Handshake",
    domainId: "computer-networking",
    shortDefinition:
      "The SYN, SYN-ACK, ACK exchange that synchronizes initial sequence numbers (ISNs) and negotiates TCP options (MSS, window scale, SACK) before application data flows.",
    detailedExplanation:
      "Both endpoints pick randomized 32-bit Initial Sequence Numbers to prevent stale duplicate segments from an earlier incarnation of the 4-tuple from corrupting a new connection. The client sends SYN(seq=x), the server allocates state (or issues a stateless SYN cookie) and replies SYN-ACK(seq=y, ack=x+1), and the client confirms with ACK(ack=y+1)—requiring 1 RTT before the server receives the first HTTP/TLS payload unless TCP Fast Open is used.",
    relatedLessonSlugs: [
      "tcp-udp-congestion-control",
      "dns-http-tls-sockets",
    ],
  },
  {
    id: "congestion-window-aimd",
    term: "Congestion Window (cwnd) & AIMD",
    domainId: "computer-networking",
    shortDefinition:
      "A sender-side cap on unacknowledged in-flight bytes adjusted via Additive Increase, Multiplicative Decrease to probe link capacity fairly without collapsing queues.",
    detailedExplanation:
      "Whereas rwnd protects the receiver's buffer, cwnd protects bottleneck routers along the path. During Slow Start, cwnd grows by 1 MSS per ACK (doubling every RTT) until reaching ssthresh; in Congestion Avoidance, Reno increases cwnd by ~1 MSS per RTT and halves cwnd on triple duplicate ACK. Modern Linux defaults to CUBIC, which grows cwnd as a cubic function of time since the last loss event to saturate high-BDP links.",
    formulaLatex:
      "\\text{In-flight limit} = \\min(\\text{cwnd},\\, \\text{rwnd}), \\quad \\text{BDP} = B \\times \\text{RTT}_{\\min}",
    relatedLessonSlugs: ["tcp-udp-congestion-control"],
  },
  {
    id: "bbr-pacing",
    term: "BBR Congestion Control & Packet Pacing",
    domainId: "computer-networking",
    shortDefinition:
      "Model-based congestion control that estimates bottleneck bandwidth (BtlBw) and minimum propagation delay (RTprop) to pace packets at Kleinrock's optimal operating point without filling router buffers.",
    detailedExplanation:
      "Loss-based algorithms like Reno and CUBIC keep increasing cwnd until router queues overflow and drop packets, inducing bufferbloat. BBR periodically probes bandwidth and minimum RTT, pacing packet transmission at rate BtlBw and capping inflight data near a small multiple of BtlBw * RTprop so queues stay nearly empty while achieving near-full link utilization.",
    formulaLatex:
      "\\text{BDP}_{\\text{est}} = \\hat{B}_{\\text{btl}} \\times \\widehat{\\text{RTT}}_{\\min}",
    relatedLessonSlugs: ["tcp-udp-congestion-control"],
  },
  {
    id: "tls-13-handshake",
    term: "TLS 1.3 1-RTT Handshake",
    domainId: "computer-networking",
    shortDefinition:
      "Cryptographic protocol handshake that negotiates AEAD ciphers, performs ephemeral (EC)DHE key exchange, and authenticates the server via X.509 certificates in a single round trip.",
    detailedExplanation:
      "TLS 1.3 (RFC 8446) eliminated legacy RSA key transport, static Diffie-Hellman, and non-AEAD ciphers. The client sends supported cipher suites and key_share guesses in ClientHello; the server responds with ServerHello, encrypted extensions, Certificate, and CertificateVerify in one flight, enabling forward-secret application data immediately after 1 RTT (or 0-RTT with PSK resumption caveats).",
    relatedLessonSlugs: [
      "dns-http-tls-sockets",
      "cryptography-memory-hardware-security",
    ],
  },
  {
    id: "quic-http3",
    term: "QUIC & HTTP/3 Multiplexing",
    domainId: "computer-networking",
    shortDefinition:
      "A UDP-based, TLS-1.3-encrypted transport protocol (RFC 9000) providing independent multiplexed streams that eliminate transport-layer head-of-line blocking.",
    detailedExplanation:
      "Over TCP (used by HTTP/2), a single lost packet stalls delivery of every multiplexed HTTP stream in the kernel receive buffer until retransmitted. QUIC moves reliable delivery, congestion control, and TLS 1.3 into user-space streams over UDP with connection IDs that survive Wi-Fi-to-cellular IP migrations, isolating packet loss strictly to the affected stream.",
    relatedLessonSlugs: [
      "tcp-udp-congestion-control",
      "dns-http-tls-sockets",
    ],
  },
  {
    id: "b-plus-tree",
    term: "B+ Tree Slotted-Page Index",
    domainId: "databases",
    shortDefinition:
      "A high-fanout, self-balancing search tree storing routing keys in internal pages and all records (or record IDs) in doubly linked leaf pages sized to disk/OS blocks.",
    detailedExplanation:
      "By keeping values out of internal nodes, B+ trees maximize branching factor B (often 100-500 keys per 4-16 KiB page), bounding tree height to log_B(N) (typically 3-4 levels even for billions of rows). Linked leaf pages allow fast sequential range scans, while in-place page updates require random page writes and buffer-pool latch protocols.",
    formulaLatex:
      "h \\le \\left\\lceil \\log_{\\lceil B/2 \\rceil}(N) \\right\\rceil",
    relatedLessonSlugs: ["database-storage-btrees-lsm"],
  },
  {
    id: "lsm-tree-compaction",
    term: "LSM-Tree & Leveled Compaction",
    domainId: "databases",
    shortDefinition:
      "Log-Structured Merge-tree storage engine that buffers writes sequentially in an in-memory memtable and flushes immutable sorted runs (SSTables) that are merged asynchronously in background compaction.",
    detailedExplanation:
      "Instead of performing random in-place B+ tree page edits, LSM-trees append mutations to a WAL and an in-memory skiplist/tree (memtable). Full memtables flush sequentially to L0 SSTables. Because keys may span multiple SSTables, point lookups consult per-SSTable Bloom filters and sparse fence-pointer indexes, while leveled or size-tiered compaction merges overlapping runs to bound space and read amplification.",
    relatedLessonSlugs: ["database-storage-btrees-lsm"],
  },
  {
    id: "write-ahead-log",
    term: "Write-Ahead Log (WAL) & ARIES",
    domainId: "databases",
    shortDefinition:
      "An append-only sequential durability log flushed to stable storage via fsync before modified dirty data pages are overwritten, enabling crash recovery via Redo/Undo.",
    detailedExplanation:
      "Under the STEAL/NO-FORCE buffer pool policy, pages modified by uncommitted transactions may be evicted to disk (requiring Undo), while committed dirty pages need not be flushed immediately on commit (requiring Redo). ARIES recovery assigns monotonic Log Sequence Numbers (LSNs) to log records and page headers (pageLSN), replaying history deterministically after crashes.",
    relatedLessonSlugs: [
      "database-storage-btrees-lsm",
      "transactions-mvcc-query-execution",
    ],
  },
  {
    id: "write-amplification",
    term: "Write, Read & Space Amplification",
    domainId: "databases",
    shortDefinition:
      "The ratio of physical bytes written to (or read from, or stored on) SSD/disk relative to the logical bytes requested by the application.",
    detailedExplanation:
      "In-place B+ trees suffer high write amplification on random single-key updates because modifying 100 bytes forces writing an entire 4-16 KiB page (plus WAL and doublewrite buffer). Leveled LSM-trees trade lower initial write I/O for repeated compaction rewrites across L levels (WA proportional to L * size_ratio) and higher read amplification checked via Bloom filters.",
    formulaLatex:
      "\\text{WA} = \\frac{\\text{Bytes Written to Storage}}{\\text{Logical Bytes Written by User}}",
    relatedLessonSlugs: [
      "database-storage-btrees-lsm",
      "vector-databases-ann-search",
    ],
  },
  {
    id: "mvcc-snapshot-isolation",
    term: "Multi-Version Concurrency Control (MVCC)",
    domainId: "databases",
    shortDefinition:
      "Concurrency control technique that retains multiple timestamped tuple versions so readers observe a consistent point-in-time snapshot without blocking concurrent writers.",
    detailedExplanation:
      "Each tuple version stores creation and expiration transaction IDs (e.g., xmin/xmax in PostgreSQL, or undo-log rollbacks in InnoDB). A transaction running under Snapshot Isolation reads only versions committed before its snapshot timestamp and not deleted before that snapshot. While eliminating read-write blocking, Snapshot Isolation remains vulnerable to write skew unless upgraded to Serializable Snapshot Isolation (SSI).",
    relatedLessonSlugs: ["transactions-mvcc-query-execution"],
  },
  {
    id: "serializability",
    term: "Serializability & Write Skew",
    domainId: "databases",
    shortDefinition:
      "The strongest multi-object transaction isolation guarantee: the concurrent execution produces the same state and outputs as some serial (one-at-a-time) ordering of those transactions.",
    detailedExplanation:
      "Snapshot Isolation prevents dirty reads, non-repeatable reads, and lost updates on the same row, yet permits write skew when two concurrent transactions read an overlapping set and update disjoint rows (breaking a cross-row invariant). True Serializability—achieved via Strict 2PL with predicate locks or SSI dependency-cycle detection (rw-antidependencies)—forbids write skew.",
    relatedLessonSlugs: [
      "transactions-mvcc-query-execution",
      "distributed-consensus-raft",
    ],
  },
  {
    id: "hnsw-graph",
    term: "HNSW (Hierarchical Navigable Small World)",
    domainId: "databases",
    shortDefinition:
      "A multi-layer proximity graph index for Approximate Nearest Neighbor (ANN) vector search combining long-range skip-list-like upper layers with dense local neighborhood routing at layer 0.",
    detailedExplanation:
      "HNSW assigns each vector a maximum layer drawn from an exponentially decaying distribution. Queries greedily descend from the sparse top layer (routing rapidly across the vector space) down to layer 0, where a beam search of width efSearch explores candidate neighbors to achieve logarithmic-like latency with high recall.",
    formulaLatex:
      "l = \\lfloor -\\ln(\\text{uniform}(0, 1)) \\cdot m_L \\rfloor",
    relatedLessonSlugs: ["vector-databases-ann-search"],
  },
  {
    id: "product-quantization",
    term: "Product Quantization (PQ) & Asymmetric Distance",
    domainId: "databases",
    shortDefinition:
      "Lossy vector compression that splits a D-dimensional vector into M orthogonal subspaces and encodes each sub-vector by the ID of its nearest k-means centroid.",
    detailedExplanation:
      "A 1536-dimensional FP32 embedding (6,144 bytes) split into M=96 subspaces with 256 centroids (8-bit IDs) shrinks to just 96 bytes (64x compression). During query evaluation, Asymmetric Distance Computation (ADC) precomputes an M x 256 lookup table of distances between the unquantized query sub-vectors and all centroids, reducing distance computation to M table lookups and additions.",
    formulaLatex:
      "d(q, \\tilde{x})^2 = \\sum_{m=1}^{M} \\left\\| q^{(m)} - c^{(m)}_{i_m} \\right\\|_2^2",
    relatedLessonSlugs: ["vector-databases-ann-search"],
  },
  {
    id: "memory-ordering-acquire-release",
    term: "Acquire-Release Memory Ordering",
    domainId: "concurrent-distributed",
    shortDefinition:
      "Atomic synchronization semantics guaranteeing that writes performed before a release store become visible to any thread performing a matching acquire load that observes the stored value.",
    detailedExplanation:
      "Because compilers reorder instructions and CPUs buffer stores in store buffers (TSO on x86-64, weaker reordering on ARM64/RISC-V), plain memory accesses cannot synchronize threads. A store(Release) pairs with a load(Acquire) to form a happens-before edge, preventing earlier stores from sinking past the release and later loads/stores from hoisting before the acquire.",
    relatedLessonSlugs: ["threads-atomics-async-runtimes"],
  },
  {
    id: "compare-and-swap",
    term: "Compare-and-Swap (CAS) & ABA Problem",
    domainId: "concurrent-distributed",
    shortDefinition:
      "An atomic hardware read-modify-write primitive that updates a memory word to a new value if and only if its current contents equal an expected value.",
    detailedExplanation:
      "Implemented via instructions like x86 LOCK CMPXCHG or ARM64 LDXR/STXR (or LSE CASAL), CAS powers lock-free stacks, queues, and reference counters. In pointer-based lock-free structures, the ABA problem arises when a thread reads pointer A, gets preempted while another thread pops A, frees it, reallocates the same address A, and pushes it back—tricking CAS into succeeding erroneously unless version tags or hazard pointers/epoch reclamation are used.",
    relatedLessonSlugs: ["threads-atomics-async-runtimes"],
  },
  {
    id: "work-stealing-executor",
    term: "Work-Stealing Async Executor",
    domainId: "concurrent-distributed",
    shortDefinition:
      "A multi-threaded task scheduler where each worker thread runs a local LIFO deque of ready tasks and steals from the tail of peers' deques (FIFO) only when idle.",
    detailedExplanation:
      "Asynchronous runtimes (Tokio, Go netpoller/GMP) multiplex thousands of lightweight state-machine tasks over N OS worker threads backed by epoll/io_uring/kqueue readiness notifications. Pushing and popping locally in LIFO order exploits L1/L2 cache warmth, while stealing the oldest task from the opposite end of another worker's deque minimizes lock contention and moves coarse-grained subtrees of work.",
    relatedLessonSlugs: ["threads-atomics-async-runtimes"],
  },
  {
    id: "lamport-logical-clock",
    term: "Lamport Timestamps & Vector Clocks",
    domainId: "concurrent-distributed",
    shortDefinition:
      "Logical counters incremented on local events and propagated in messages to capture causal happens-before ordering without synchronized physical wall clocks.",
    detailedExplanation:
      "Physical clocks drift and leap seconds jump backwards, making wall-clock timestamps unsafe for ordering distributed events. Lamport timestamps guarantee that if event a causally precedes b (a -> b), then L(a) < L(b), though the converse does not hold. Vector clocks extend this to an N-element array so V(a) < V(b) if and only if a -> b, detecting true concurrency.",
    formulaLatex:
      "a \\to b \\implies L(a) < L(b); \\quad L_{\\text{recv}} = \\max(L_{\\text{local}}, L_{\\text{msg}}) + 1",
    relatedLessonSlugs: ["distributed-consensus-raft"],
  },
  {
    id: "linearizability",
    term: "Linearizability (External Consistency)",
    domainId: "concurrent-distributed",
    shortDefinition:
      "A single-object consistency guarantee where every operation appears to take effect atomically at a single point in real time between its invocation and its response.",
    detailedExplanation:
      "Once a write completes, every subsequent read across any node must return that value or a newer write—stale reads from lagging followers are forbidden. Unlike Serializability (which governs multi-object transactions without real-time ordering), Linearizability constrains real-time recency on replicated state machines and is impossible to maintain for writes/linearizable reads on the minority side of a network partition (CAP theorem).",
    relatedLessonSlugs: [
      "transactions-mvcc-query-execution",
      "distributed-consensus-raft",
    ],
  },
  {
    id: "raft-quorum-consensus",
    term: "Raft Quorum Consensus",
    domainId: "concurrent-distributed",
    shortDefinition:
      "A crash-fault-tolerant consensus algorithm decomposing replicated state machines into Leader Election, Log Replication, and Safety invariants using strict majority quorums.",
    detailedExplanation:
      "In an N-node cluster tolerating f crash failures (N = 2f + 1), any two majorities of size f + 1 intersect in at least one node. Raft enforces that at most one leader is elected per monotonic term, candidates must hold logs at least as up-to-date as a majority of voters, and a leader only commits entries from its own current term once replicated to a majority—preventing stale uncommitted entries from being overwritten silently.",
    formulaLatex:
      "Q = \\left\\lfloor \\frac{N}{2} \\right\\rfloor + 1, \\quad N = 2f + 1",
    relatedLessonSlugs: ["distributed-consensus-raft"],
  },
  {
    id: "linux-namespaces-cgroups",
    term: "Linux Namespaces & Control Groups (cgroups v2)",
    domainId: "operating-systems",
    shortDefinition:
      "Kernel primitives that power containers: namespaces virtualize what a process can see (PIDs, mounts, network, UIDs), while cgroups meter and cap what resources it can consume.",
    detailedExplanation:
      "Unlike virtual machines, containers share the host Linux kernel syscall boundary. Creating a container combines clone()/unshare() with PID, MNT (with pivot_root + OverlayFS), NET (veth pair into a host bridge), UTS, IPC, and USER namespaces alongside cgroups v2 hierarchies enforcing CPU bandwidth (cpu.max), memory limits (memory.max), and I/O weights.",
    relatedLessonSlugs: ["containers-virtualization"],
  },
  {
    id: "kvm-ept-virtualization",
    term: "Hardware-Assisted Virtualization (VMX & EPT)",
    domainId: "operating-systems",
    shortDefinition:
      "CPU extensions (Intel VT-x / AMD-V) providing guest/root privilege separation and two-dimensional page tables (EPT/NPT) to run unmodified guest OS kernels at near-native speed.",
    detailedExplanation:
      "Under KVM + QEMU/Firecracker, the host kernel runs in VMX root mode and guest vCPUs run in VMX non-root mode inside rings 0-3. Sensitive instructions trigger a VM-exit to the hypervisor, while Extended Page Tables (EPT) translate Guest Virtual -> Guest Physical -> Host Physical addresses directly in hardware MMU walks without hypervisor intervention on every guest TLB miss.",
    relatedLessonSlugs: ["containers-virtualization"],
  },
  {
    id: "aead-authenticated-encryption",
    term: "AEAD (Authenticated Encryption with Associated Data)",
    domainId: "computer-security",
    shortDefinition:
      "A symmetric cipher construction (such as AES-GCM or ChaCha20-Poly1305) providing confidentiality, integrity, and authenticity for ciphertext plus integrity for unencrypted header metadata.",
    detailedExplanation:
      "Unauthenticated encryption (e.g., raw CBC or CTR mode) allows attackers to flip ciphertext bits or exploit padding oracles. AEAD binds a secret key, a unique nonce (never reused under the same key!), plaintext, and Additional Authenticated Data (AAD) to produce ciphertext plus an authentication tag, rejecting any tampered message before decryption output is exposed.",
    formulaLatex:
      "(C, T) = \\text{AEAD}_{K}(N, P, \\text{AAD})",
    relatedLessonSlugs: [
      "dns-http-tls-sockets",
      "cryptography-memory-hardware-security",
    ],
  },
  {
    id: "aslr-nx-cfi",
    term: "ASLR, W^X (NX) & Control-Flow Integrity (CFI)",
    domainId: "computer-security",
    shortDefinition:
      "Layered runtime defenses against memory corruption exploits: randomizing address space layout, prohibiting writable+executable pages, and constraining indirect jumps/returns to valid targets.",
    detailedExplanation:
      "W^X (via the hardware NX/XD page-table bit) prevents injected stack/heap shellcode from executing. Attackers respond with Return-Oriented Programming (ROP) chaining existing code gadgets; ASLR randomizes base addresses to hinder gadget discovery, while forward-edge CFI and hardware shadow stacks (Intel CET / ARM PAC+BTI) enforce that indirect calls and returns cannot hijack control flow.",
    relatedLessonSlugs: ["cryptography-memory-hardware-security"],
  },
  {
    id: "spectre-transient-execution",
    term: "Transient Execution & Cache Side Channels (Spectre)",
    domainId: "computer-security",
    shortDefinition:
      "Microarchitectural attacks exploiting out-of-order and speculative execution to read unauthorized secrets transiently and leak them via shared L1/LLC cache timing (Flush+Reload).",
    detailedExplanation:
      "Even when a bounds check or permission check eventually faults and squashes architecturally unretired instructions in the Reorder Buffer (ROB), speculatively executed loads leave persistent footprints in CPU caches and branch predictors. Attackers train the Branch Target Buffer or Pattern History Table (Spectre v1/v2) and probe cache-line access latencies (~40 cycles hit vs ~200 cycles DRAM miss) to exfiltrate kernel or cross-sandbox memory.",
    relatedLessonSlugs: ["cryptography-memory-hardware-security"],
  },
];
