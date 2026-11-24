// ============================================================================
// 1. B+ Tree Engine (configurable order, splits, leaf links, range scan)
// ============================================================================

export interface BPlusNode {
  id: string;
  isLeaf: boolean;
  keys: number[];
  values?: string[]; // only on leaf nodes
  children?: string[]; // child node IDs on internal nodes
  next?: string | null; // leaf linked-list pointer
}

export interface BPlusTreeState {
  order: number; // max children per internal node (>= 3)
  rootId: string;
  nodes: Record<string, BPlusNode>;
  nextNodeSeq: number;
  height: number;
  totalKeys: number;
  stats: {
    inserts: number;
    lookups: number;
    splits: number;
    pageReads: number;
    pageWrites: number;
  };
  lastLog: string;
}

export function createBPlusTree(order = 4): BPlusTreeState {
  const clampedOrder = Math.max(3, Math.min(8, Math.floor(order)));
  const rootId = "N0";
  return {
    order: clampedOrder,
    rootId,
    nodes: {
      [rootId]: {
        id: rootId,
        isLeaf: true,
        keys: [],
        values: [],
        next: null,
      },
    },
    nextNodeSeq: 1,
    height: 1,
    totalKeys: 0,
    stats: {
      inserts: 0,
      lookups: 0,
      splits: 0,
      pageReads: 0,
      pageWrites: 0,
    },
    lastLog: `Initialized B+ Tree (order=${clampedOrder}, maxKeys=${clampedOrder - 1})`,
  };
}

function cloneBPlus(state: BPlusTreeState): BPlusTreeState {
  const nodes: Record<string, BPlusNode> = {};
  for (const [id, n] of Object.entries(state.nodes)) {
    nodes[id] = {
      ...n,
      keys: [...n.keys],
      values: n.values ? [...n.values] : undefined,
      children: n.children ? [...n.children] : undefined,
    };
  }
  return {
    ...state,
    nodes,
    stats: { ...state.stats },
  };
}

export function bplusInsert(
  prev: BPlusTreeState,
  key: number,
  value = `val:${key}`
): BPlusTreeState {
  const s = cloneBPlus(prev);
  const maxKeys = s.order - 1;
  s.stats.inserts += 1;

  // Walk down to leaf recording path
  const path: BPlusNode[] = [];
  let curr = s.nodes[s.rootId];
  while (!curr.isLeaf) {
    s.stats.pageReads += 1;
    path.push(curr);
    let idx = 0;
    while (idx < curr.keys.length && key >= curr.keys[idx]) {
      idx += 1;
    }
    curr = s.nodes[curr.children![idx]];
  }
  s.stats.pageReads += 1;

  // Insert or update inside leaf
  const existingIdx = curr.keys.indexOf(key);
  if (existingIdx !== -1) {
    curr.values![existingIdx] = value;
    s.stats.pageWrites += 1;
    s.lastLog = `Updated existing key ${key} in leaf ${curr.id}`;
    return s;
  }

  let insIdx = 0;
  while (insIdx < curr.keys.length && curr.keys[insIdx] < key) insIdx += 1;
  curr.keys.splice(insIdx, 0, key);
  curr.values!.splice(insIdx, 0, value);
  s.totalKeys += 1;
  s.stats.pageWrites += 1;

  if (curr.keys.length <= maxKeys) {
    s.lastLog = `Inserted key ${key} into leaf ${curr.id}`;
    return s;
  }

  // Split leaf
  s.stats.splits += 1;
  const splitAt = Math.ceil(curr.keys.length / 2);
  const rightLeafId = `N${s.nextNodeSeq++}`;
  const rightLeaf: BPlusNode = {
    id: rightLeafId,
    isLeaf: true,
    keys: curr.keys.splice(splitAt),
    values: curr.values!.splice(splitAt),
    next: curr.next ?? null,
  };
  curr.next = rightLeafId;
  s.nodes[rightLeafId] = rightLeaf;
  s.stats.pageWrites += 2;

  let promotedKey = rightLeaf.keys[0];
  let rightChildId = rightLeafId;
  let leftChildId = curr.id;

  // Propagate splits upward
  while (path.length > 0) {
    const parent = path.pop()!;
    let pIdx = 0;
    while (pIdx < parent.keys.length && promotedKey >= parent.keys[pIdx]) {
      pIdx += 1;
    }
    parent.keys.splice(pIdx, 0, promotedKey);
    parent.children!.splice(pIdx + 1, 0, rightChildId);
    s.stats.pageWrites += 1;

    if (parent.keys.length <= maxKeys) {
      s.lastLog = `Inserted ${key}; split leaf -> promoted ${promotedKey} into ${parent.id}`;
      return s;
    }

    // Split internal node
    s.stats.splits += 1;
    const mid = Math.floor(parent.keys.length / 2);
    const pushUpKey = parent.keys[mid];
    const rightInternalId = `N${s.nextNodeSeq++}`;
    const rightInternal: BPlusNode = {
      id: rightInternalId,
      isLeaf: false,
      keys: parent.keys.splice(mid + 1),
      children: parent.children!.splice(mid + 1),
    };
    parent.keys.pop(); // remove pushUpKey from left internal node
    s.nodes[rightInternalId] = rightInternal;
    s.stats.pageWrites += 2;

    promotedKey = pushUpKey;
    leftChildId = parent.id;
    rightChildId = rightInternalId;
  }

  // Create new root
  const newRootId = `N${s.nextNodeSeq++}`;
  s.nodes[newRootId] = {
    id: newRootId,
    isLeaf: false,
    keys: [promotedKey],
    children: [leftChildId, rightChildId],
  };
  s.rootId = newRootId;
  s.height += 1;
  s.stats.pageWrites += 1;
  s.lastLog = `Inserted ${key}; split propagated to new root ${newRootId} (height=${s.height})`;
  return s;
}

export function bplusSearch(
  state: BPlusTreeState,
  key: number
): { found: boolean; value: string | null; visitedNodeIds: string[] } {
  const visitedNodeIds: string[] = [];
  let curr = state.nodes[state.rootId];
  while (!curr.isLeaf) {
    visitedNodeIds.push(curr.id);
    let idx = 0;
    while (idx < curr.keys.length && key >= curr.keys[idx]) idx += 1;
    curr = state.nodes[curr.children![idx]];
  }
  visitedNodeIds.push(curr.id);
  const idx = curr.keys.indexOf(key);
  return {
    found: idx !== -1,
    value: idx !== -1 ? curr.values![idx] : null,
    visitedNodeIds,
  };
}

export function bplusRangeScan(
  state: BPlusTreeState,
  startKey: number,
  endKey: number
): { entries: Array<{ key: number; value: string }>; visitedLeafIds: string[] } {
  const visitedLeafIds: string[] = [];
  const entries: Array<{ key: number; value: string }> = [];

  let curr = state.nodes[state.rootId];
  while (!curr.isLeaf) {
    let idx = 0;
    while (idx < curr.keys.length && startKey >= curr.keys[idx]) idx += 1;
    curr = state.nodes[curr.children![idx]];
  }

  let node: BPlusNode | undefined = curr;
  while (node) {
    visitedLeafIds.push(node.id);
    for (let i = 0; i < node.keys.length; i++) {
      const k = node.keys[i];
      if (k > endKey) return { entries, visitedLeafIds };
      if (k >= startKey) {
        entries.push({ key: k, value: node.values![i] });
      }
    }
    node = node.next ? state.nodes[node.next] : undefined;
  }

  return { entries, visitedLeafIds };
}

export function bplusAmplification(state: BPlusTreeState): {
  writeAmplification: number;
  readAmplification: number;
} {
  const wa =
    state.stats.inserts > 0 ? state.stats.pageWrites / state.stats.inserts : 0;
  const ra = state.height;
  return {
    writeAmplification: Math.round(wa * 100) / 100,
    readAmplification: ra,
  };
}

// ============================================================================
// 2. LSM-Tree Engine (Memtable, SSTables, Bloom Filters, Leveled Compaction)
// ============================================================================

export interface SstableRun {
  id: string;
  level: number;
  entries: Array<{ key: number; value: string }>;
  minKey: number;
  maxKey: number;
  bloomBits: number[]; // 32-bit bloom bitset (0 or 1)
}

export interface LsmTreeState {
  memtableCapacity: number;
  levelMaxRuns: number;
  memtable: Array<{ key: number; value: string }>;
  levels: SstableRun[][]; // levels[0] = L0, levels[1] = L1, levels[2] = L2
  nextRunSeq: number;
  stats: {
    logicalWrites: number;
    diskEntriesWritten: number; // WAL + SSTable flushes + compaction rewrites
    flushes: number;
    compactions: number;
    lookups: number;
    bloomSkippedSstables: number;
    sstableScans: number;
  };
  lastLog: string;
}

const BLOOM_BITS = 32;

function buildBloom(keys: number[]): number[] {
  const bits = new Array<number>(BLOOM_BITS).fill(0);
  for (const k of keys) {
    const h1 = Math.abs(Math.imul(k, 2654435761)) % BLOOM_BITS;
    const h2 = Math.abs(Math.imul(k ^ 0x9e3779b9, 2246822519)) % BLOOM_BITS;
    const h3 = Math.abs(Math.imul(k + 17, 3266489917)) % BLOOM_BITS;
    bits[h1] = 1;
    bits[h2] = 1;
    bits[h3] = 1;
  }
  return bits;
}

function bloomMightContain(bits: number[], key: number): boolean {
  const h1 = Math.abs(Math.imul(key, 2654435761)) % BLOOM_BITS;
  const h2 = Math.abs(Math.imul(key ^ 0x9e3779b9, 2246822519)) % BLOOM_BITS;
  const h3 = Math.abs(Math.imul(key + 17, 3266489917)) % BLOOM_BITS;
  return bits[h1] === 1 && bits[h2] === 1 && bits[h3] === 1;
}

export function createLsmTree(
  memtableCapacity = 4,
  levelMaxRuns = 2
): LsmTreeState {
  return {
    memtableCapacity: Math.max(2, memtableCapacity),
    levelMaxRuns: Math.max(2, levelMaxRuns),
    memtable: [],
    levels: [[], [], []],
    nextRunSeq: 1,
    stats: {
      logicalWrites: 0,
      diskEntriesWritten: 0,
      flushes: 0,
      compactions: 0,
      lookups: 0,
      bloomSkippedSstables: 0,
      sstableScans: 0,
    },
    lastLog: `Initialized LSM-Tree (memtableCap=${memtableCapacity})`,
  };
}

function cloneLsm(state: LsmTreeState): LsmTreeState {
  return {
    ...state,
    memtable: state.memtable.map((e) => ({ ...e })),
    levels: state.levels.map((lvl) =>
      lvl.map((r) => ({
        ...r,
        entries: r.entries.map((e) => ({ ...e })),
        bloomBits: [...r.bloomBits],
      }))
    ),
    stats: { ...state.stats },
  };
}

export function lsmCompactLevel(
  prev: LsmTreeState,
  levelIndex = 0
): LsmTreeState {
  const s = cloneLsm(prev);
  if (levelIndex >= s.levels.length - 1 || s.levels[levelIndex].length === 0) {
    return s;
  }

  const targetLevel = levelIndex + 1;
  // Merge newest-first so latest value wins on duplicate keys
  const mergedMap = new Map<number, string>();
  const sourceRuns = [...s.levels[levelIndex]].reverse();
  const targetRuns = [...s.levels[targetLevel]].reverse();

  for (const run of targetRuns) {
    for (const e of run.entries) {
      if (!mergedMap.has(e.key)) mergedMap.set(e.key, e.value);
    }
  }
  for (const run of sourceRuns) {
    for (const e of run.entries) {
      mergedMap.set(e.key, e.value);
    }
  }

  const sortedEntries = Array.from(mergedMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([key, value]) => ({ key, value }));

  const newRun: SstableRun = {
    id: `SST-${s.nextRunSeq++}`,
    level: targetLevel,
    entries: sortedEntries,
    minKey: sortedEntries[0]?.key ?? 0,
    maxKey: sortedEntries[sortedEntries.length - 1]?.key ?? 0,
    bloomBits: buildBloom(sortedEntries.map((e) => e.key)),
  };

  s.levels[levelIndex] = [];
  s.levels[targetLevel] = [newRun];
  s.stats.compactions += 1;
  s.stats.diskEntriesWritten += sortedEntries.length;
  s.lastLog = `Compacted L${levelIndex} -> L${targetLevel} (${sortedEntries.length} unique keys in ${newRun.id})`;
  return s;
}

export function lsmFlushMemtable(prev: LsmTreeState): LsmTreeState {
  if (prev.memtable.length === 0) return prev;
  let s = cloneLsm(prev);
  const sorted = [...s.memtable].sort((a, b) => a.key - b.key);
  const run: SstableRun = {
    id: `SST-${s.nextRunSeq++}`,
    level: 0,
    entries: sorted,
    minKey: sorted[0].key,
    maxKey: sorted[sorted.length - 1].key,
    bloomBits: buildBloom(sorted.map((e) => e.key)),
  };
  s.levels[0].push(run);
  s.memtable = [];
  s.stats.flushes += 1;
  s.stats.diskEntriesWritten += sorted.length;
  s.lastLog = `Flushed Memtable -> L0 (${run.id}, ${sorted.length} keys)`;

  if (s.levels[0].length > s.levelMaxRuns) {
    s = lsmCompactLevel(s, 0);
  }
  return s;
}

export function lsmPut(
  prev: LsmTreeState,
  key: number,
  value = `val:${key}`
): LsmTreeState {
  let s = cloneLsm(prev);
  s.stats.logicalWrites += 1;
  s.stats.diskEntriesWritten += 1; // Sequential WAL append

  const existingIdx = s.memtable.findIndex((e) => e.key === key);
  if (existingIdx !== -1) {
    s.memtable[existingIdx].value = value;
  } else {
    s.memtable.push({ key, value });
  }
  s.lastLog = `Appended (${key}=${value}) to WAL + Memtable`;

  if (s.memtable.length >= s.memtableCapacity) {
    s = lsmFlushMemtable(s);
  }
  return s;
}

export function lsmGet(
  prev: LsmTreeState,
  key: number
): {
  state: LsmTreeState;
  found: boolean;
  value: string | null;
  checkedLocations: string[];
} {
  const s = cloneLsm(prev);
  s.stats.lookups += 1;
  const checkedLocations: string[] = ["Memtable"];

  const memMatch = s.memtable.find((e) => e.key === key);
  if (memMatch) {
    s.lastLog = `GET ${key}: HIT in Memtable`;
    return { state: s, found: true, value: memMatch.value, checkedLocations };
  }

  for (let lvl = 0; lvl < s.levels.length; lvl++) {
    // Check newest SSTable first
    const runs = [...s.levels[lvl]].reverse();
    for (const run of runs) {
      if (key < run.minKey || key > run.maxKey) {
        continue;
      }
      if (!bloomMightContain(run.bloomBits, key)) {
        s.stats.bloomSkippedSstables += 1;
        checkedLocations.push(`${run.id} (Bloom: NEGATIVE, skipped)`);
        continue;
      }
      s.stats.sstableScans += 1;
      checkedLocations.push(`${run.id} (Bloom: positive, scanned)`);
      const match = run.entries.find((e) => e.key === key);
      if (match) {
        s.lastLog = `GET ${key}: HIT in ${run.id} (L${lvl})`;
        return { state: s, found: true, value: match.value, checkedLocations };
      }
    }
  }

  s.lastLog = `GET ${key}: MISS`;
  return { state: s, found: false, value: null, checkedLocations };
}

export function lsmAmplification(state: LsmTreeState): {
  writeAmplification: number;
  readAmplification: number;
} {
  const wa =
    state.stats.logicalWrites > 0
      ? state.stats.diskEntriesWritten / state.stats.logicalWrites
      : 0;
  const totalRuns = state.levels.reduce((sum, lvl) => sum + lvl.length, 0);
  const ra = Math.max(1, totalRuns);
  return {
    writeAmplification: Math.round(wa * 100) / 100,
    readAmplification: ra,
  };
}
