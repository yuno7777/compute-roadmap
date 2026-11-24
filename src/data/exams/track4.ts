import type { TrackExam } from "@/types/curriculum";

export const TRACK_4_EXAM: TrackExam = {
  id: "exam-track-4",
  trackId: "track-4",
  title: "Track 4 Cumulative Exam: Networking, Databases, Distributed Systems & Security",
  description:
    "Verify mastery across physical/IP/TCP/TLS networking, B+ tree & LSM storage engines, MVCC isolation, HNSW vector search, lock-free atomics, Raft consensus, Linux containers/KVM, and applied cryptographic & hardware security.",
  passingScore: 70,
  questions: [
    {
      id: "exam-t4-q1",
      type: "mcq",
      difficulty: "intermediate",
      prompt:
        "Host A (10.0.1.5/24) sends an IP packet to Host B (198.51.100.42) via default gateway R1, which forwards it to router R2. Across the hop from Host A to R1, which header fields remain unchanged vs. rewritten?",
      options: [
        {
          id: "a",
          text: "Ethernet source/destination MACs are rewritten at every L3 hop, while IP source/destination remain Host A and Host B (barring NAT).",
          explanation:
            "Correct. L2 Ethernet frames only traverse a single broadcast link (A -> R1, then R1 -> R2), whereas L3 IP addresses identify end-to-end hosts (and TTL decrements by 1 at each hop).",
        },
        {
          id: "b",
          text: "IP source/destination change to R1's IP at the first hop while Ethernet MACs stay fixed end-to-end.",
          explanation:
            "Incorrect. End-to-end IP addresses stay Host A -> Host B across standard routers, while Ethernet MACs are strictly link-local.",
        },
        {
          id: "c",
          text: "Both Ethernet MACs and IP addresses remain untouched; only the TCP port numbers are rewritten by R1.",
          explanation:
            "Incorrect. Routers inspect and decrement IP TTL and rewrite L2 Ethernet headers per link; they do not touch TCP ports unless performing NAT/PAT.",
        },
        {
          id: "d",
          text: "ARP resolves Host B's remote MAC address across the internet so Host A puts Host B's MAC in the Ethernet frame.",
          explanation:
            "Incorrect. ARP broadcasts do not cross IP routers; Host A ARPs for its default gateway R1's MAC address.",
        },
      ],
      correctAnswer: "a",
      hints: [
        "Recall the scope of Layer 2 (link-local broadcast domain) versus Layer 3 (end-to-end routed internetwork).",
      ],
      explanation:
        "An Ethernet frame carries link-local L2 addresses (Host A MAC -> R1 ingress MAC). When R1 routes the packet out another interface toward R2, R1 strips the old Ethernet frame, decrements the IP TTL, and wraps the IP packet in a new Ethernet frame addressed from R1 egress MAC to R2 ingress MAC.",
      conceptTag: "l2-vs-l3-forwarding",
    },
    {
      id: "exam-t4-q2",
      type: "math",
      difficulty: "intermediate",
      prompt:
        "A bottleneck link has bandwidth $B = 100\\text{ Mbps}$ and minimum round-trip propagation delay $\\text{RTT}_{\\min} = 40\\text{ ms}$. How many kilobytes (in KB, where $1\\text{ KB} = 1000\\text{ bytes}$) is the Bandwidth-Delay Product (BDP)?",
      latex: "\\text{BDP} = \\frac{B \\times \\text{RTT}_{\\min}}{8 \\times 1000}",
      correctAnswer: 500,
      numericTolerance: 0.5,
      hints: [
        "Convert 100 Mbps to bits per second ($100 \\times 10^6$), multiply by 0.040 s, then divide by 8 to get bytes.",
      ],
      explanation:
        "$\\text{BDP} = 100\\times 10^6\\text{ bps} \\times 0.040\\text{ s} = 4\\times 10^6\\text{ bits} = 500{,}000\\text{ bytes} = 500\\text{ KB}$. To keep the pipe 100% utilized, the sender must keep at least 500 KB in flight.",
      conceptTag: "bandwidth-delay-product",
    },
    {
      id: "exam-t4-q3",
      type: "ordering",
      difficulty: "intermediate",
      prompt:
        "Order the steps of a fresh HTTPS request over HTTP/3 (QUIC + TLS 1.3) from first network packet sent by the client to application HTTP response receipt (assuming DNS is already cached).",
      orderingItems: [
        "Server replies with QUIC Initial/Handshake carrying ServerHello, Certificate, and CertificateVerify",
        "Client sends QUIC Initial packet containing ClientHello + TLS 1.3 key_share over UDP/443",
        "Client verifies server certificate chain, derives 1-RTT traffic keys, and sends HTTP/3 HEADERS frame on Stream 0",
        "Server processes request and returns HTTP/3 HEADERS + DATA frames on Stream 0",
      ],
      correctAnswer: [
        "Client sends QUIC Initial packet containing ClientHello + TLS 1.3 key_share over UDP/443",
        "Server replies with QUIC Initial/Handshake carrying ServerHello, Certificate, and CertificateVerify",
        "Client verifies server certificate chain, derives 1-RTT traffic keys, and sends HTTP/3 HEADERS frame on Stream 0",
        "Server processes request and returns HTTP/3 HEADERS + DATA frames on Stream 0",
      ],
      hints: [
        "QUIC combines transport establishment and the TLS 1.3 handshake into a single initial RTT.",
      ],
      explanation:
        "Because QUIC runs over UDP and embeds TLS 1.3 directly, the client's very first flight sends ClientHello + key_share, and the server responds with ServerHello + Certificate + CertificateVerify in 1 RTT, allowing encrypted HTTP/3 stream frames immediately after.",
      conceptTag: "quic-tls13-flow",
    },
    {
      id: "exam-t4-q4",
      type: "multi-select",
      difficulty: "rigorous",
      prompt:
        "Which statements accurately compare a B+ tree storage engine (e.g., PostgreSQL/InnoDB) against a leveled LSM-tree storage engine (e.g., RocksDB)? Select all that apply.",
      options: [
        {
          id: "a",
          text: "LSM-trees convert random logical key inserts into sequential WAL + SSTable flushes, lowering initial foreground write latency.",
          explanation:
            "True. LSM-trees buffer writes in a memtable and flush sorted runs sequentially, avoiding random in-place 4-16 KiB page reads/writes on insert.",
        },
        {
          id: "b",
          text: "B+ trees generally provide faster uncached point lookups and short range scans because a single leaf-page path holds the authoritative record without checking multiple SSTable levels.",
          explanation:
            "True. Even with Bloom filters, LSM reads may probe multiple levels (especially L0 overlapping files and range queries where Bloom filters for point keys do not apply).",
        },
        {
          id: "c",
          text: "LSM-trees have zero write amplification because immutable SSTables are never rewritten once flushed.",
          explanation:
            "False. Background compaction repeatedly merges and rewrites SSTables across levels, giving leveled LSM-trees non-trivial total write amplification.",
        },
        {
          id: "d",
          text: "A B+ tree stores full row payloads inside every internal routing node to avoid descending to leaf pages.",
          explanation:
            "False. B+ trees store payloads (or heap pointers) only at the leaf level to maximize fanout in internal nodes.",
        },
      ],
      correctAnswer: ["a", "b"],
      hints: [
        "Consider what background compaction does to write amplification and how B+ trees maximize internal node fanout.",
      ],
      explanation:
        "LSM-trees absorb random writes sequentially into memtables/L0 SSTables at the cost of background compaction write amplification and multi-level read probes, while B+ trees keep internal nodes lean (keys + child pointers only) and optimize point/range reads.",
      conceptTag: "btree-vs-lsm-tradeoffs",
    },
    {
      id: "exam-t4-q5",
      type: "debugging",
      difficulty: "rigorous",
      prompt:
        "Two concurrent transactions run under PostgreSQL REPEATABLE READ (Snapshot Isolation) to enforce an on-call invariant ('at least 1 doctor must remain on duty'). Both read `COUNT(*) = 2`, and each sets a different doctor's `on_call = false` and commits. Neither blocked, yet 0 doctors remain on call! What is this anomaly and how do you fix it without coarse table locks?",
      codeSnippet: `-- Initial state: Alice (on_call=true), Bob (on_call=true)
-- T1 (Repeatable Read):               -- T2 (Repeatable Read):
SELECT count(*) FROM doctors          SELECT count(*) FROM doctors
  WHERE on_call = true; -- sees 2       WHERE on_call = true; -- sees 2
UPDATE doctors SET on_call = false    UPDATE doctors SET on_call = false
  WHERE name = 'Alice';                 WHERE name = 'Bob';
COMMIT;                               COMMIT; -- succeeds! Now 0 on call`,
      codeLanguage: "sql",
      options: [
        {
          id: "a",
          text: "Dirty Read; switch from REPEATABLE READ to READ COMMITTED so both see the latest row versions.",
          explanation:
            "Incorrect. Snapshot Isolation already prevents dirty reads, and READ COMMITTED is even weaker and still allows this concurrency race.",
        },
        {
          id: "b",
          text: "Write Skew; upgrade isolation to SERIALIZABLE (SSI) so Postgres detects the rw-antidependency cycle and aborts one transaction.",
          explanation:
            "Correct. Because T1 and T2 read an overlapping predicate and modify disjoint rows, Snapshot Isolation permits Write Skew. Serializable Snapshot Isolation (SSI) tracks SIREAD locks and aborts one transaction with SQLSTATE 40001.",
        },
        {
          id: "c",
          text: "Lost Update; add an explicit PRIMARY KEY index on `name` so MVCC rejects concurrent inserts.",
          explanation:
            "Incorrect. Lost Update affects the same row; here Alice and Bob are distinct rows, so row-level write locks do not collide.",
        },
        {
          id: "d",
          text: "Phantom Write Lockout; disable WAL fsync so commits serialize faster.",
          explanation:
            "Incorrect. Disabling fsync breaks durability and has nothing to do with Snapshot Isolation write skew.",
        },
      ],
      correctAnswer: "b",
      hints: [
        "Notice T1 and T2 read the same predicate set (`on_call = true`) but update *disjoint* rows (`Alice` vs `Bob`).",
      ],
      explanation:
        "Write skew is the classic anomaly that distinguishes Snapshot Isolation from true Serializability. Because the two transactions modify disjoint rows, row-level write conflicts do not trigger; SERIALIZABLE (SSI) tracks predicate read dependencies and aborts the cycle.",
      conceptTag: "mvcc-write-skew-ssi",
    },
    {
      id: "exam-t4-q6",
      type: "fill-blank",
      difficulty: "intermediate",
      prompt:
        "In HNSW (Hierarchical Navigable Small World) vector search, increasing the query-time candidate beam width parameter (`______`) improves recall at the cost of visiting more nodes and higher latency.",
      correctAnswer: "efSearch",
      acceptableAnswers: ["efSearch", "ef_search", "ef"],
      hints: [
        "It is the query-time counterpart to build-time `efConstruction`.",
      ],
      explanation:
        "During search at layer 0, HNSW maintains a dynamic priority queue of size `efSearch` holding the closest candidates explored so far. Larger `efSearch` explores wider neighborhoods for higher recall at higher compute cost.",
      conceptTag: "hnsw-efsearch",
    },
    {
      id: "exam-t4-q7",
      type: "predict-output",
      difficulty: "rigorous",
      prompt:
        "Consider a lock-free producer-consumer handoff in C++20/Rust using relaxed vs. acquire-release atomics. Suppose Thread 1 executes `DATA = 42; READY.store(true, Relaxed);` and Thread 2 spins `while (!READY.load(Relaxed)) {} print(DATA);` on an ARM64 CPU. What can happen?",
      codeSnippet: `// Global: int DATA = 0; atomic<bool> READY{false};
// Thread 1 (ARM64):
DATA = 42;
READY.store(true, std::memory_order_relaxed);

// Thread 2 (ARM64):
while (!READY.load(std::memory_order_relaxed)) {}
printf("%d\n", DATA);`,
      codeLanguage: "cpp",
      options: [
        {
          id: "a",
          text: "It is guaranteed to print 42 because hardware cache coherence enforces sequential ordering across cores.",
          explanation:
            "Incorrect. Cache coherence ensures all cores agree on a single modification order per *single* memory location, NOT cross-variable ordering between `DATA` and `READY`.",
        },
        {
          id: "b",
          text: "Undefined behavior / stale read: Thread 2 may observe READY == true yet read DATA == 0 due to compiler or weak ARM64 store/load reordering.",
          explanation:
            "Correct. Without Release on the store and Acquire on the load, there is no happens-before relationship protecting non-atomic `DATA` (a data race in C++/Rust!).",
        },
        {
          id: "c",
          text: "Deadlock: `memory_order_relaxed` blocks forever unless a mutex is held.",
          explanation:
            "Incorrect. Relaxed atomics never block; they simply omit cross-variable ordering constraints.",
        },
        {
          id: "d",
          text: "It compiles only on x86-64 because ARM64 has no relaxed atomic instructions.",
          explanation:
            "Incorrect. Plain `LDR`/`STR` on aligned machine words are already relaxed atomic on ARM64; the issue is missing acquire/release barriers (`LDAR`/`STLR`).",
        },
      ],
      correctAnswer: "b",
      hints: [
        "What does `memory_order_relaxed` guarantee about *other* non-atomic variables written before the store?",
      ],
      explanation:
        "Relaxed atomics only guarantee atomicity and per-variable modification order—they establish zero happens-before synchronization for `DATA`. Fixing this requires `Release` on `READY.store` and `Acquire` on `READY.load`.",
      conceptTag: "acquire-release-ordering",
    },
    {
      id: "exam-t4-q8",
      type: "true-false",
      difficulty: "intermediate",
      prompt:
        "In Raft consensus, a newly elected leader in term 5 may immediately mark an uncommitted log entry from previous term 3 as committed as soon as it replicates that term-3 entry to a majority of nodes.",
      correctAnswer: false,
      hints: [
        "Recall Figure 8 of the Ongaro & Ousterhout Raft paper: what can happen if a leader commits an older term's entry directly by counting replicas?",
      ],
      explanation:
        "False! Directly committing an entry from an earlier term by counting replicas violates the Raft Log Matching/Leader Completeness safety invariant (Figure 8 scenario). A leader must only commit entries from its *own current term* by majority replication, which then indirectly commits prior entries.",
      conceptTag: "raft-figure8-commit-rule",
    },
    {
      id: "exam-t4-q9",
      type: "matching",
      difficulty: "intermediate",
      prompt:
        "Match each Linux isolation or virtualization primitive to the exact architectural boundary it enforces.",
      matchingPairs: [
        {
          id: "m1",
          left: "PID & Mount Namespaces",
          right: "Scoping process IDs and root filesystem visibility per container",
        },
        {
          id: "m2",
          left: "cgroups v2 (cpu.max, memory.max)",
          right: "Throttling CPU bandwidth and capping RAM allocation",
        },
        {
          id: "m3",
          left: "seccomp-bpf",
          right: "Filtering allowed Linux system calls per task",
        },
        {
          id: "m4",
          left: "Intel VT-x / EPT (KVM)",
          right: "Hardware-isolated guest kernel execution with 2D page tables",
        },
      ],
      correctAnswer: {
        m1: "Scoping process IDs and root filesystem visibility per container",
        m2: "Throttling CPU bandwidth and capping RAM allocation",
        m3: "Filtering allowed Linux system calls per task",
        m4: "Hardware-isolated guest kernel execution with 2D page tables",
      },
      hints: [
        "Separate container visibility (namespaces), resource quotas (cgroups), syscall surface (seccomp), and hypervisor hardware rings (KVM).",
      ],
      explanation:
        "Containers compose namespaces (visibility), cgroups v2 (resource metering), and seccomp-bpf/capabilities (syscall hardening) over a shared host kernel, whereas KVM/VMX + EPT gives each VM its own isolated guest kernel and two-dimensional address translation.",
      conceptTag: "containers-vs-kvm",
    },
    {
      id: "exam-t4-q10",
      type: "mcq",
      difficulty: "rigorous",
      prompt:
        "Why does reusing the same 96-bit nonce twice with the same key in AES-GCM catastrophically break both confidentiality and authenticity?",
      options: [
        {
          id: "a",
          text: "XORing two ciphertexts cancels the identical AES-CTR keystream to expose $P_1 \\oplus P_2$, AND solving the GHASH polynomial equation leaks the secret authentication key $H = E_K(0)$.",
          explanation:
            "Correct. Nonce reuse turns AES-GCM into a two-time pad ($C_1 \\oplus C_2 = P_1 \\oplus P_2$) and allows the 'Forbidden Attack' to recover the GHASH key $H$ and forge arbitrary tags.",
        },
        {
          id: "b",
          text: "AES-GCM falls back to ECB mode when a nonce repeats, leaking identical 16-byte plaintext blocks within a single message.",
          explanation:
            "Incorrect. AES-GCM uses CTR mode internally, not ECB; the keystream repeats across messages sharing the same (key, nonce), not between blocks of one message.",
        },
        {
          id: "c",
          text: "Nonce reuse causes the X.509 certificate signature to expire immediately in TLS 1.3.",
          explanation:
            "Incorrect. Certificate validity is unrelated to symmetric AEAD nonce reuse.",
        },
        {
          id: "d",
          text: "Nonce reuse exposes the RSA private key through timing variation in S-box lookups.",
          explanation:
            "Incorrect. AES-GCM is a symmetric AEAD cipher and does not contain RSA private keys.",
        },
      ],
      correctAnswer: "a",
      hints: [
        "Think about both the encryption component (CTR mode) and the polynomial MAC component (GHASH) of AES-GCM.",
      ],
      explanation:
        "In AES-GCM, encryption is CTR mode ($C = P \\oplus E_K(N \\parallel \\text{ctr})$) and authentication is GHASH over $GF(2^{128})$ using key $H = E_K(0)$. Reusing $N$ exposes $P_1 \\oplus P_2$ and lets an attacker subtract two GHASH equations to factor out $H$ and forge valid tags for arbitrary payloads.",
      conceptTag: "aead-nonce-reuse",
    },
  ],
};
