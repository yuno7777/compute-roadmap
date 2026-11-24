export const WARP_SIZE = 32;
export const CACHE_LINE_BYTES = 128;
export const SHARED_MEM_BANKS = 32;

// ============================================================================
// 1. SIMT Warp Execution & Nested Branch Divergence
// ============================================================================

export type WarpPredicateId =
  | "even-lanes"
  | "first-half"
  | "mod4-lt2"
  | "all-true"
  | "lane-lt24"
  | "mod2-inner";

export type WarpStatement =
  | { kind: "op"; label: string; cycles?: number }
  | {
      kind: "if";
      label: string;
      predicate: WarpPredicateId;
      thenBranch: WarpStatement[];
      elseBranch?: WarpStatement[];
    };

export interface WarpCycleStep {
  cycleIndex: number;
  instructionLabel: string;
  branchPath: string;
  depth: number;
  activeMask: boolean[];
  activeCount: number;
  diverged: boolean;
}

export interface WarpExecutionResult {
  programName: string;
  cycles: WarpCycleStep[];
  totalCycles: number;
  idealNonDivergentCycles: number;
  serializationPenaltyCycles: number;
  warpEfficiency: number;
  divergentBranchCount: number;
}

export interface WarpProgramPreset {
  id: string;
  title: string;
  description: string;
  statements: WarpStatement[];
}

export function evaluatePredicate(
  predicate: WarpPredicateId,
  lane: number
): boolean {
  switch (predicate) {
    case "even-lanes":
      return lane % 2 === 0;
    case "first-half":
      return lane < 16;
    case "mod4-lt2":
      return lane % 4 < 2;
    case "all-true":
      return true;
    case "lane-lt24":
      return lane < 24;
    case "mod2-inner":
      return lane % 4 === 0 || lane % 4 === 3;
  }
}

export const WARP_PROGRAM_PRESETS: WarpProgramPreset[] = [
  {
    id: "nested-if-else",
    title: "Nested if / else Divergence",
    description:
      "Lanes < 16 take outer then-branch and diverge again on even lanes; lanes >= 16 take else-branch.",
    statements: [
      { kind: "op", label: "LDG r0, [tid]" },
      {
        kind: "if",
        label: "if (tid < 16)",
        predicate: "first-half",
        thenBranch: [
          { kind: "op", label: "MUL r1, r0, 2.0" },
          {
            kind: "if",
            label: "if (tid % 2 == 0)",
            predicate: "even-lanes",
            thenBranch: [{ kind: "op", label: "FMA r2, r1, c0" }],
            elseBranch: [{ kind: "op", label: "ADD r2, r1, c1" }],
          },
        ],
        elseBranch: [{ kind: "op", label: "SUB r2, r0, c2" }],
      },
      { kind: "op", label: "STG [out + tid], r2" },
    ],
  },
  {
    id: "even-odd-branch",
    title: "Checkerboard Even/Odd Branch",
    description:
      "50% of lanes satisfy (tid % 2 == 0), serializing then and else paths across the warp.",
    statements: [
      { kind: "op", label: "LDG r0, [tid]" },
      {
        kind: "if",
        label: "if (tid % 2 == 0)",
        predicate: "even-lanes",
        thenBranch: [
          { kind: "op", label: "FMA r1, r0, 1.5" },
          { kind: "op", label: "SQRT r1, r1" },
        ],
        elseBranch: [
          { kind: "op", label: "ADD r1, r0, 4.0" },
          { kind: "op", label: "MUL r1, r1, 0.5" },
        ],
      },
      { kind: "op", label: "STG [out + tid], r1" },
    ],
  },
  {
    id: "uniform-warp",
    title: "Warp-Uniform Execution (No Divergence)",
    description:
      "All 32 lanes evaluate the same branch direction, executing in lockstep at 100% lane efficiency.",
    statements: [
      { kind: "op", label: "LDG r0, [tid]" },
      {
        kind: "if",
        label: "if (block_flag == true)",
        predicate: "all-true",
        thenBranch: [
          { kind: "op", label: "FMA r1, r0, 1.5" },
          { kind: "op", label: "SQRT r1, r1" },
        ],
        elseBranch: [{ kind: "op", label: "MOV r1, 0" }],
      },
      { kind: "op", label: "STG [out + tid], r1" },
    ],
  },
];

function countMaxBranchCycles(stmts: WarpStatement[]): number {
  let total = 0;
  for (const s of stmts) {
    if (s.kind === "op") {
      total += s.cycles ?? 1;
    } else {
      const thenCost = countMaxBranchCycles(s.thenBranch);
      const elseCost = s.elseBranch ? countMaxBranchCycles(s.elseBranch) : 0;
      total += Math.max(thenCost, elseCost);
    }
  }
  return total;
}

export function simulateWarpExecution(
  statements: WarpStatement[],
  programName = "Warp Kernel",
  initialMask?: boolean[]
): WarpExecutionResult {
  const startMask =
    initialMask && initialMask.length === WARP_SIZE
      ? [...initialMask]
      : new Array<boolean>(WARP_SIZE).fill(true);

  const cycles: WarpCycleStep[] = [];
  let divergentBranchCount = 0;

  function execBlock(
    block: WarpStatement[],
    mask: boolean[],
    branchPath: string,
    depth: number,
    inDivergedPath: boolean
  ): void {
    const activeCount = mask.filter(Boolean).length;
    if (activeCount === 0) return;

    for (const stmt of block) {
      if (stmt.kind === "op") {
        const opCycles = stmt.cycles ?? 1;
        for (let c = 0; c < opCycles; c++) {
          cycles.push({
            cycleIndex: cycles.length,
            instructionLabel: stmt.label,
            branchPath,
            depth,
            activeMask: [...mask],
            activeCount,
            diverged: inDivergedPath || activeCount < WARP_SIZE,
          });
        }
      } else {
        const thenMask = mask.map(
          (active, lane) => active && evaluatePredicate(stmt.predicate, lane)
        );
        const elseMask = mask.map(
          (active, lane) => active && !evaluatePredicate(stmt.predicate, lane)
        );

        const thenActive = thenMask.some(Boolean);
        const elseActive =
          Boolean(stmt.elseBranch?.length) && elseMask.some(Boolean);
        const divergedHere = thenActive && elseActive;

        if (divergedHere) {
          divergentBranchCount++;
        }

        if (thenActive) {
          execBlock(
            stmt.thenBranch,
            thenMask,
            `${branchPath} -> ${stmt.label} [T]`,
            depth + 1,
            inDivergedPath || divergedHere
          );
        }
        if (elseActive && stmt.elseBranch) {
          execBlock(
            stmt.elseBranch,
            elseMask,
            `${branchPath} -> ${stmt.label} [F]`,
            depth + 1,
            inDivergedPath || divergedHere
          );
        }
      }
    }
  }

  execBlock(statements, startMask, "root", 0, false);

  const totalCycles = cycles.length;
  const idealNonDivergentCycles = countMaxBranchCycles(statements);
  const serializationPenaltyCycles = Math.max(
    0,
    totalCycles - idealNonDivergentCycles
  );
  const totalActiveLaneSlots = cycles.reduce((sum, c) => sum + c.activeCount, 0);
  const warpEfficiency =
    totalCycles === 0 ? 1 : totalActiveLaneSlots / (totalCycles * WARP_SIZE);

  return {
    programName,
    cycles,
    totalCycles,
    idealNonDivergentCycles,
    serializationPenaltyCycles,
    warpEfficiency,
    divergentBranchCount,
  };
}

// ============================================================================
// 2. Global Memory Coalescing Calculator (AoS vs SoA, 128B Cache Lines)
// ============================================================================

export type MemoryLayout = "SoA" | "AoS";

export interface LaneMemoryAccess {
  lane: number;
  address: number;
  cacheLineIndex: number;
  offsetInLine: number;
}

export interface GlobalMemoryResult {
  layout: MemoryLayout;
  strideBytes: number;
  elementBytes: number;
  laneAccesses: LaneMemoryAccess[];
  cacheLinesAccessed: number[];
  transactions128B: number;
  bytesTransferred: number;
  usefulBytes: number;
  busUtilization: number;
}

export function simulateGlobalMemoryCoalescing(params: {
  layout: MemoryLayout;
  strideBytes: number;
  elementBytes?: number;
  baseAddress?: number;
  activeLanes?: boolean[];
}): GlobalMemoryResult {
  const elementBytes = Math.max(1, params.elementBytes ?? 4);
  const effectiveStride =
    params.layout === "SoA"
      ? elementBytes
      : Math.max(elementBytes, params.strideBytes);
  const baseAddress = params.baseAddress ?? 0;

  const laneAccesses: LaneMemoryAccess[] = [];
  const lineSet = new Set<number>();
  let activeCount = 0;

  for (let lane = 0; lane < WARP_SIZE; lane++) {
    const isActive = params.activeLanes ? Boolean(params.activeLanes[lane]) : true;
    const address = baseAddress + lane * effectiveStride;
    const cacheLineIndex = Math.floor(address / CACHE_LINE_BYTES);
    const offsetInLine = address % CACHE_LINE_BYTES;

    if (isActive) {
      activeCount++;
      lineSet.add(cacheLineIndex);
      // Handle rare element straddling two cache lines
      const endLine = Math.floor((address + elementBytes - 1) / CACHE_LINE_BYTES);
      lineSet.add(endLine);
    }

    laneAccesses.push({
      lane,
      address,
      cacheLineIndex,
      offsetInLine,
    });
  }

  const cacheLinesAccessed = Array.from(lineSet).sort((a, b) => a - b);
  const transactions128B = cacheLinesAccessed.length;
  const bytesTransferred = transactions128B * CACHE_LINE_BYTES;
  const usefulBytes = activeCount * elementBytes;
  const busUtilization =
    bytesTransferred === 0 ? 0 : Math.min(1, usefulBytes / bytesTransferred);

  return {
    layout: params.layout,
    strideBytes: effectiveStride,
    elementBytes,
    laneAccesses,
    cacheLinesAccessed,
    transactions128B,
    bytesTransferred,
    usefulBytes,
    busUtilization,
  };
}

// ============================================================================
// 3. 32-Bank Shared-Memory Bank Conflict Analyzer
// ============================================================================

export interface BankStatus {
  bank: number;
  lanes: number[];
  distinctWordAddresses: number;
  hasConflict: boolean;
}

export interface SharedMemoryBankResult {
  strideWords: number;
  paddingWords: number;
  conflictWay: number;
  serialTransactions: number;
  banks: BankStatus[];
  laneToBank: Array<{ lane: number; wordIndex: number; bank: number }>;
}

export function analyzeSharedMemoryBanks(params: {
  strideWords: number;
  paddingWords?: number;
  offsetWords?: number;
  activeLanes?: boolean[];
}): SharedMemoryBankResult {
  const paddingWords = Math.max(0, Math.floor(params.paddingWords ?? 0));
  const offsetWords = Math.floor(params.offsetWords ?? 0);
  const effectiveStride = Math.max(0, Math.floor(params.strideWords)) + paddingWords;

  const bankLaneMap: number[][] = Array.from(
    { length: SHARED_MEM_BANKS },
    () => []
  );
  const bankAddressSets: Array<Set<number>> = Array.from(
    { length: SHARED_MEM_BANKS },
    () => new Set<number>()
  );
  const laneToBank: Array<{ lane: number; wordIndex: number; bank: number }> = [];

  for (let lane = 0; lane < WARP_SIZE; lane++) {
    const isActive = params.activeLanes ? Boolean(params.activeLanes[lane]) : true;
    const wordIndex = offsetWords + lane * effectiveStride;
    const bank = ((wordIndex % SHARED_MEM_BANKS) + SHARED_MEM_BANKS) % SHARED_MEM_BANKS;
    laneToBank.push({ lane, wordIndex, bank });

    if (isActive) {
      bankLaneMap[bank].push(lane);
      bankAddressSets[bank].add(wordIndex);
    }
  }

  let maxDistinct = 0;
  const banks: BankStatus[] = bankLaneMap.map((lanes, bank) => {
    const distinctWordAddresses = bankAddressSets[bank].size;
    if (distinctWordAddresses > maxDistinct) {
      maxDistinct = distinctWordAddresses;
    }
    return {
      bank,
      lanes,
      distinctWordAddresses,
      hasConflict: distinctWordAddresses > 1,
    };
  });

  const conflictWay = Math.max(1, maxDistinct);

  return {
    strideWords: params.strideWords,
    paddingWords,
    conflictWay,
    serialTransactions: conflictWay,
    banks,
    laneToBank,
  };
}
