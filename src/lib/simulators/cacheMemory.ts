export type CacheAssociativity = 1 | 2 | 4;

export interface CacheConfig {
  /** Total cache size in bytes (e.g. 64, 128, 256) */
  cacheSizeBytes: number;
  /** Cache block / line size in bytes (e.g. 16, 32) */
  blockSizeBytes: number;
  /** Associativity: 1 (direct-mapped), 2 (2-way), 4 (4-way) */
  associativity: CacheAssociativity;
  /** Address width in bits (e.g. 16 or 32) */
  addressBits?: number;
}

export interface AddressBreakdown {
  address: number;
  hex: string;
  tag: number;
  index: number;
  offset: number;
  tagBits: number;
  indexBits: number;
  offsetBits: number;
}

export type MissType = "compulsory" | "capacity" | "conflict";

export interface CacheWaySlot {
  valid: boolean;
  tag: number;
  blockAddress: number;
  lastUsedTick: number;
}

export interface CacheAccessRecord {
  tick: number;
  address: number;
  hex: string;
  breakdown: AddressBreakdown;
  hit: boolean;
  missType: MissType | null;
  evictedTag: number | null;
  wayUsed: number;
}

export interface CacheSimulationState {
  config: Required<CacheConfig>;
  numSets: number;
  sets: CacheWaySlot[][];
  tick: number;
  hits: number;
  misses: number;
  compulsoryMisses: number;
  capacityMisses: number;
  conflictMisses: number;
  seenBlocks: Set<number>;
  /** Parallel fully-associative LRU tracker for exact 3C conflict vs capacity classification */
  fullyAssocLru: number[];
  history: CacheAccessRecord[];
}

export type MesiState = "M" | "E" | "S" | "I";
export type MesiCoreOp = "PrRd" | "PrWr";
export type MesiBusTx = "None" | "BusRd" | "BusRdX" | "BusUpgr" | "Flush";

export interface MesiCoherenceState {
  cores: [
    { state: MesiState; value: number },
    { state: MesiState; value: number }
  ];
  memoryValue: number;
  lastEvent: {
    actor: 0 | 1;
    op: MesiCoreOp;
    busTx: MesiBusTx;
    prevStates: [MesiState, MesiState];
    nextStates: [MesiState, MesiState];
    summary: string;
  } | null;
  log: Array<{
    step: number;
    actor: 0 | 1;
    op: MesiCoreOp;
    busTx: MesiBusTx;
    core0: MesiState;
    core1: MesiState;
    summary: string;
  }>;
}

/**
 * Computes Tag, Index, and Offset bit widths and fields for an address.
 */
export function decomposeCacheAddress(
  address: number,
  config: CacheConfig
): AddressBreakdown {
  const addrBits = config.addressBits ?? 16;
  const numBlocks = Math.max(1, Math.floor(config.cacheSizeBytes / config.blockSizeBytes));
  const numSets = Math.max(1, Math.floor(numBlocks / config.associativity));

  const offsetBits = Math.round(Math.log2(config.blockSizeBytes));
  const indexBits = Math.round(Math.log2(numSets));
  const tagBits = Math.max(1, addrBits - offsetBits - indexBits);

  const uAddr = address >>> 0;
  const offsetMask = (1 << offsetBits) - 1;
  const indexMask = (1 << indexBits) - 1;

  const offset = uAddr & offsetMask;
  const index = indexBits > 0 ? (uAddr >>> offsetBits) & indexMask : 0;
  const tag = uAddr >>> (offsetBits + indexBits);

  return {
    address: uAddr,
    hex: `0x${uAddr.toString(16).toUpperCase().padStart(Math.ceil(addrBits / 4), "0")}`,
    tag,
    index,
    offset,
    tagBits,
    indexBits,
    offsetBits,
  };
}

/**
 * Initializes an empty cache simulator state.
 */
export function createCacheState(config: CacheConfig): CacheSimulationState {
  const fullConfig: Required<CacheConfig> = {
    cacheSizeBytes: config.cacheSizeBytes,
    blockSizeBytes: config.blockSizeBytes,
    associativity: config.associativity,
    addressBits: config.addressBits ?? 16,
  };
  const numBlocks = Math.max(1, Math.floor(fullConfig.cacheSizeBytes / fullConfig.blockSizeBytes));
  const numSets = Math.max(1, Math.floor(numBlocks / fullConfig.associativity));

  const sets: CacheWaySlot[][] = Array.from({ length: numSets }, () =>
    Array.from({ length: fullConfig.associativity }, () => ({
      valid: false,
      tag: 0,
      blockAddress: 0,
      lastUsedTick: -1,
    }))
  );

  return {
    config: fullConfig,
    numSets,
    sets,
    tick: 0,
    hits: 0,
    misses: 0,
    compulsoryMisses: 0,
    capacityMisses: 0,
    conflictMisses: 0,
    seenBlocks: new Set<number>(),
    fullyAssocLru: [],
    history: [],
  };
}

/**
 * Simulates a single cache memory access, updating LRU ways and 3C miss statistics.
 */
export function accessCache(
  state: CacheSimulationState,
  address: number
): { nextState: CacheSimulationState; record: CacheAccessRecord } {
  const tick = state.tick + 1;
  const breakdown = decomposeCacheAddress(address, state.config);
  const offsetBits = breakdown.offsetBits;
  const blockAddress = (address >>> 0) >>> offsetBits;
  const totalBlocks = Math.max(
    1,
    Math.floor(state.config.cacheSizeBytes / state.config.blockSizeBytes)
  );

  // Clone sets & tracking sets
  const nextSets = state.sets.map((set) => set.map((way) => ({ ...way })));
  const seenBlocks = new Set(state.seenBlocks);
  const fullyAssocLru = [...state.fullyAssocLru];

  const faIdx = fullyAssocLru.indexOf(blockAddress);
  const faHit = faIdx !== -1;
  if (faHit) {
    fullyAssocLru.splice(faIdx, 1);
    fullyAssocLru.push(blockAddress);
  } else {
    if (fullyAssocLru.length >= totalBlocks) {
      fullyAssocLru.shift();
    }
    fullyAssocLru.push(blockAddress);
  }

  const targetSet = nextSets[breakdown.index];
  const hitWay = targetSet.findIndex((w) => w.valid && w.tag === breakdown.tag);

  let hit = false;
  let missType: MissType | null = null;
  let evictedTag: number | null = null;
  let wayUsed = 0;

  if (hitWay !== -1) {
    hit = true;
    wayUsed = hitWay;
    targetSet[hitWay].lastUsedTick = tick;
  } else {
    const isFirstSeen = !seenBlocks.has(blockAddress);
    if (isFirstSeen) {
      missType = "compulsory";
    } else if (faHit) {
      missType = "conflict";
    } else {
      missType = "capacity";
    }

    // Find empty way or LRU way
    const emptyWay = targetSet.findIndex((w) => !w.valid);
    if (emptyWay !== -1) {
      wayUsed = emptyWay;
    } else {
      let lruWay = 0;
      for (let i = 1; i < targetSet.length; i++) {
        if (targetSet[i].lastUsedTick < targetSet[lruWay].lastUsedTick) {
          lruWay = i;
        }
      }
      wayUsed = lruWay;
      evictedTag = targetSet[lruWay].tag;
    }

    targetSet[wayUsed] = {
      valid: true,
      tag: breakdown.tag,
      blockAddress,
      lastUsedTick: tick,
    };
  }

  seenBlocks.add(blockAddress);

  const record: CacheAccessRecord = {
    tick,
    address: address >>> 0,
    hex: breakdown.hex,
    breakdown,
    hit,
    missType,
    evictedTag,
    wayUsed,
  };

  const nextState: CacheSimulationState = {
    ...state,
    sets: nextSets,
    tick,
    hits: state.hits + (hit ? 1 : 0),
    misses: state.misses + (hit ? 0 : 1),
    compulsoryMisses: state.compulsoryMisses + (missType === "compulsory" ? 1 : 0),
    capacityMisses: state.capacityMisses + (missType === "capacity" ? 1 : 0),
    conflictMisses: state.conflictMisses + (missType === "conflict" ? 1 : 0),
    seenBlocks,
    fullyAssocLru,
    history: [...state.history, record],
  };

  return { nextState, record };
}

/**
 * Replays an array of addresses from a fresh cache configuration.
 */
export function runCacheTrace(
  config: CacheConfig,
  addresses: number[]
): CacheSimulationState {
  let state = createCacheState(config);
  for (const addr of addresses) {
    state = accessCache(state, addr).nextState;
  }
  return state;
}

/**
 * Creates initial 2-core MESI coherence state (both Invalid, memory=0).
 */
export function createMesiState(initialMemory = 42): MesiCoherenceState {
  return {
    cores: [
      { state: "I", value: 0 },
      { state: "I", value: 0 },
    ],
    memoryValue: initialMemory,
    lastEvent: null,
    log: [],
  };
}

/**
 * Executes a PrRd or PrWr on Core 0 or Core 1 and computes exact MESI bus transactions & transitions.
 */
export function stepMesi(
  state: MesiCoherenceState,
  actor: 0 | 1,
  op: MesiCoreOp,
  writeValue?: number
): MesiCoherenceState {
  const peer: 0 | 1 = actor === 0 ? 1 : 0;
  const prevStates: [MesiState, MesiState] = [state.cores[0].state, state.cores[1].state];
  const actorCore = { ...state.cores[actor] };
  const peerCore = { ...state.cores[peer] };
  let memoryValue = state.memoryValue;
  let busTx: MesiBusTx = "None";
  let summary = "";

  if (op === "PrRd") {
    if (actorCore.state === "M" || actorCore.state === "E" || actorCore.state === "S") {
      busTx = "None";
      summary = `Core ${actor} Read Hit in state ${actorCore.state} (no bus traffic)`;
    } else {
      // Invalid -> issue BusRd
      busTx = "BusRd";
      if (peerCore.state === "M") {
        // Peer flushes dirty data to memory/bus and downgrades M -> S
        memoryValue = peerCore.value;
        actorCore.value = peerCore.value;
        actorCore.state = "S";
        peerCore.state = "S";
        busTx = "Flush";
        summary = `Core ${actor} PrRd miss -> BusRd; Core ${peer} flushes M->S, Core ${actor} loads S`;
      } else if (peerCore.state === "E" || peerCore.state === "S") {
        actorCore.value = memoryValue;
        actorCore.state = "S";
        peerCore.state = "S";
        summary = `Core ${actor} PrRd miss -> BusRd; shared copy exists, both cores S`;
      } else {
        actorCore.value = memoryValue;
        actorCore.state = "E";
        summary = `Core ${actor} PrRd miss -> BusRd; no other sharer, Core ${actor} loads E`;
      }
    }
  } else {
    // PrWr
    const newVal = writeValue ?? actorCore.value + 1;
    if (actorCore.state === "M") {
      actorCore.value = newVal;
      busTx = "None";
      summary = `Core ${actor} Write Hit in M (silent update to ${newVal})`;
    } else if (actorCore.state === "E") {
      actorCore.value = newVal;
      actorCore.state = "M";
      busTx = "None";
      summary = `Core ${actor} Write Hit E->M silently (no bus traffic needed)`;
    } else if (actorCore.state === "S") {
      actorCore.value = newVal;
      actorCore.state = "M";
      peerCore.state = "I";
      busTx = "BusUpgr";
      summary = `Core ${actor} PrWr on S -> BusUpgr invalidates Core ${peer} (S->I), Core ${actor} becomes M`;
    } else {
      // Invalid -> BusRdX
      busTx = "BusRdX";
      if (peerCore.state === "M") {
        memoryValue = peerCore.value;
      }
      peerCore.state = "I";
      actorCore.value = newVal;
      actorCore.state = "M";
      summary = `Core ${actor} PrWr miss -> BusRdX invalidates Core ${peer} (->I), Core ${actor} becomes M`;
    }
  }

  const cores: [{ state: MesiState; value: number }, { state: MesiState; value: number }] =
    actor === 0 ? [actorCore, peerCore] : [peerCore, actorCore];
  const nextStates: [MesiState, MesiState] = [cores[0].state, cores[1].state];
  const stepNum = state.log.length + 1;

  return {
    cores,
    memoryValue,
    lastEvent: {
      actor,
      op,
      busTx,
      prevStates,
      nextStates,
      summary,
    },
    log: [
      ...state.log.slice(-19),
      {
        step: stepNum,
        actor,
        op,
        busTx,
        core0: cores[0].state,
        core1: cores[1].state,
        summary,
      },
    ],
  };
}
