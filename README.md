# COMPUTE — From Electrons to Artificial Intelligence

An interactive, first-principles computing curriculum and systems textbook that builds a unified mental model of modern computers—from charge carriers and CMOS transistors up through CPU pipelines, operating systems, compilers, distributed databases, GPU warps, and transformer inference.

---

## Project Goals

- **Zero black boxes:** Every layer connects mechanically to the layer below it—voltage thresholds explain logic gates, cache lines explain data-structure performance, virtual memory explains container isolation, and GPU warps explain LLM inference bottlenecks.
- **Just-in-time mathematics:** Boolean algebra launches right before digital circuits (Track 1); linear algebra, vector calculus, probability, and information theory launch right before 3D graphics and machine learning (Track 5).
- **Swiss-textbook clarity:** Distraction-free light (`#FAFAFA`) and dark (`#0A0B0D`) reading modes, KaTeX mathematical typesetting, deterministic `@xyflow/react` dependency graphs, and explicit *Simplified Educational Model vs. Real Hardware/Software* comparisons in every lesson.
- **Active mastery:** 21 deterministic interactive simulators, 10 assessment question types (including interactive simulation challenges), SM-2 spaced repetition, mistake logging, and 6 comprehensive track exams.

---

## Curriculum Overview

The platform ships with **58 complete lessons** across **6 tracks** and **24 domains**, supported by **154 glossary terms**, **6 track mastery exams**, and **292 total assessment questions** (`232` lesson questions + `60` track exam questions).

| Track | Title | Lessons | Domains Covered |
| --- | --- | --- | --- |
| **Track 1** | Physics, Silicon, Logic & Information | 12 (`#1`–`#12`) | `physics-electricity`, `semiconductors`, `math-foundations`, `digital-electronics`, `information-representation` |
| **Track 2** | Computer Architecture, Memory & Modern CPUs | 10 (`#13`–`#22`) | `computer-architecture`, `assembly-machine-code`, `memory-storage`, `modern-cpu` |
| **Track 3** | OS, Languages, Compilers & Algorithms | 12 (`#23`–`#34`) | `operating-systems`, `programming-languages`, `compilers-interpreters`, `data-structures-algorithms` |
| **Track 4** | Networking, Databases, Distributed Systems & Security | 10 (`#35`–`#44`) | `computer-networking`, `databases`, `concurrent-distributed`, `computer-security` |
| **Track 5** | Graphics, GPUs & Foundations of Machine Learning | 7 (`#45`–`#51`) | `math-foundations`, `computer-graphics`, `gpu-parallel`, `machine-learning` |
| **Track 6** | Deep Learning, Modern AI & Computing Frontiers | 7 (`#52`–`#58`) | `deep-learning`, `modern-ai`, `ai-training-inference`, `computing-frontiers` |

The full canonical inventory is generated in [`CURRICULUM_MANIFEST.json`](./CURRICULUM_MANIFEST.json) and viewable in-app at `/manifest`.

---

## 21 Interactive Simulators

All simulation math lives in pure, deterministic TypeScript modules under `src/lib/simulators/` and is rendered by React components in `src/components/simulators/`:

### Hardware & Architecture (8 Labs)
1. **Ohm's Law & RC Timing Lab** (`ohm-circuit`) — Voltage, resistance, power dissipation, and RC charge waveforms
2. **MOSFET & CMOS Inverter Sandbox** (`mosfet-cmos`) — $V_{GS}$ thresholds, VTC curves, and static vs. dynamic power
3. **Digital Logic & Flip-Flop Bench** (`logic-gates`) — Universal NAND/NOR/XOR gates, 4-bit ripple adder, and clocked D flip-flops
4. **Two's Complement & IEEE-754 Bit Inspector** (`binary-float`) — Sign/exponent/mantissa bit editing, subnormals, NaN, and rounding error
5. **ALU & Register File Datapath** (`alu-register`) — Opcode execution, status flags (`Z`, `N`, `C`, `V`), and register writeback
6. **Fetch-Decode-Execute CPU Simulator** (`cpu-fde`) — Cycle-by-cycle PC, IR, and register file tracing on RISC assembly
7. **Set-Associative Cache & Coherence Lab** (`cache-memory`) — Tag/index/offset breakdown, LRU eviction, and MESI coherence states
8. **5-Stage Pipeline & Hazard Visualizer** (`pipeline-hazard`) — `IF/ID/EX/MEM/WB` stalls, EX-to-EX forwarding, and branch flushes

### Systems, Networking & Security (8 Labs)
9. **MMU, Page Table & TLB Translator** (`virtual-memory`) — VPN/offset splits, TLB hits/misses, page walks, and LRU replacement
10. **OS Process Scheduler & Syscall Tracer** (`os-scheduler`) — Round-Robin, SJF, and MLFQ timelines with I/O bursts
11. **Lexer, Parser, AST & SSA IR Explorer** (`compiler-pipeline`) — Tokenization, ASTs, constant folding, and dead-code elimination
12. **Graph & Sorting Algorithm Animator** (`algorithms`) — Step-by-step Dijkstra, BFS/DFS, Quicksort, and Mergesort
13. **TCP Sliding Window & Congestion Lab** (`network-tcp`) — Handshakes, packet drops, AIMD `cwnd` dynamics, and RTT estimation
14. **B+ Tree & LSM-Tree Storage Engine Lab** (`database-storage`) — Page splits, memtables, SSTable compaction, and read/write amplification
15. **Raft Consensus & Atomics Simulator** (`concurrency-raft`) — Leader elections, network partitions, terms, and log replication quorums
16. **Diffie-Hellman, AES & Signature Inspector** (`crypto-security`) — Modular key exchange, avalanche diffusion, and HMAC verification

### Graphics, GPUs & Modern AI (5 Labs)
17. **2D/3D Triangle Rasterizer & Shader Bench** (`graphics-rasterizer`) — MVP transforms, barycentric interpolation, and Z-buffering
18. **GPU SIMT Warp & Memory Coalescing Lab** (`gpu-warp`) — 32-thread warp active masks, branch divergence, and shared-memory banks
19. **Computation Graph & Backprop Playground** (`neural-backprop`) — Forward activations, chain-rule gradients, and 2D decision boundaries
20. **Scaled Dot-Product Attention Visualizer** (`transformer-attention`) — $Q, K, V$ projections, causal masking, and $1/\sqrt{d_k}$ softmax heatmaps
21. **KV-Cache & Quantization Memory Calculator** (`quantization-kv`) — FP16/BF16/INT8/INT4 memory footprints, GQA ratios, and roofline metrics

---

## Architecture

```text
src/
├── app/                      # Next.js App Router pages (/, /curriculum, /graph, /learn/[slug], /labs, /glossary, /review, /progress, /manifest)
├── components/
│   ├── assessment/           # AssessmentEngine supporting all 10 question types
│   ├── graph/                # Deterministic @xyflow/react 58-node DAG visualizer
│   ├── layout/               # AppShell, Sidebar, TopBar, SearchModal (Cmd/Ctrl+K)
│   ├── lesson/               # LessonView, InteractiveDiagram, CodeExampleCard, LessonNotesDrawer
│   ├── math/                 # KaTeX MathText & MathBlock components
│   └── simulators/           # 21 interactive lab components + SIMULATOR_REGISTRY
├── data/
│   ├── curriculumPlan.ts     # Canonical 58-lesson DAG registry (slugs, prerequisites, domains, simulators)
│   ├── domains.ts            # TRACKS (6) and DOMAINS (24) metadata
│   ├── simulators.ts         # SIMULATOR_CATALOG (21) metadata
│   ├── lessons/              # Track lesson modules + ALL_LESSONS barrel
│   ├── glossary/             # Track glossary modules + ALL_GLOSSARY_TERMS barrel
│   └── exams/                # Track exam modules + ALL_TRACK_EXAMS barrel
├── lib/
│   ├── curriculumGraph.ts    # Topological sort, prerequisite/dependent queries, mastery helpers
│   ├── spacedRepetition.ts   # SM-2 scheduler
│   └── simulators/           # Pure TypeScript simulation engines + Vitest suites
├── store/
│   └── learningStore.tsx     # Client-side localStorage persistence, theme sync, export/import JSON
└── types/                    # Shared TypeScript contracts (curriculum, assessment, simulator, progress)
```

### Tech Stack
- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (`strict: true`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`) + CSS custom properties (`[data-theme="dark"]` / `.dark`)
- **Diagrams & Math:** `@xyflow/react` v13, `katex`, `lucide-react`
- **Testing:** Vitest + `jsdom`

---

## Local Setup

Requires **Node.js 20+** (tested on Node 24) and **pnpm**.

```bash
# 1. Install dependencies
pnpm install

# 2. Start the development server
pnpm dev

# 3. Type-check the entire repository
pnpm tsc --noEmit

# 4. Run all unit tests
pnpm test

# 5. Build for production
pnpm build
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Deployment on Vercel

The repository includes [`vercel.json`](./vercel.json) configured for Next.js.

1. Import the repository in the Vercel dashboard (or run `vercel` from the project root).
2. Vercel automatically detects **Next.js** and `pnpm-lock.yaml`, running `pnpm install` and `pnpm build`.
3. No server-side database or secret environment variables are required—learner progress, notes, bookmarks, and SM-2 review schedules persist locally in the browser (`compute_learning_state_v1`) with JSON export/import support.

---

## Contributing

1. **Curriculum integrity:** Every lesson slug, track assignment, domain assignment, and prerequisite edge is governed by `src/data/curriculumPlan.ts`. Ensure prerequisites remain strictly acyclic (`prereq.number < lesson.number`) and all 24 `DomainId`s remain covered.
2. **Pure simulator engines:** Keep mathematical models and state transitions in `src/lib/simulators/*.ts` free of React/DOM imports so every engine stays deterministically testable with Vitest.
3. **Verification before PR:** Run `pnpm tsc --noEmit` and `pnpm test` and confirm zero TypeScript errors and 100% passing unit tests.
