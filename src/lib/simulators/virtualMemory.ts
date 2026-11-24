export type TlbPolicy = "LRU" | "FIFO";

export interface VirtualMemoryConfig {
  addressBits: 16;
  pageSize: 64 | 256 | 1024 | 4096;
  tlbCapacity: number;
  tlbPolicy: TlbPolicy;
  numFrames: number;
}

export interface TlbEntry {
  vpn: number;
  pfn: number;
  insertedAt: number;
  lastUsedAt: number;
}

export interface PageTableEntry {
  present: boolean;
  pfn: number | null;
  dirty: boolean;
  referenced: boolean;
}

export interface PhysicalFrame {
  frameIndex: number;
  vpn: number | null;
  lastUsedAt: number;
  loadedAt: number;
  dirty: boolean;
}

export interface AddressBreakdown {
  virtualAddress: number;
  vpn: number;
  vpn1: number;
  vpn2: number;
  offset: number;
  offsetBits: number;
  vpn1Bits: number;
  vpn2Bits: number;
}

export interface TranslationStep {
  stepIndex: number;
  virtualAddress: number;
  isWrite: boolean;
  breakdown: AddressBreakdown;
  tlbHit: boolean;
  pageTableHit: boolean;
  pageFault: boolean;
  evictedFrameVpn: number | null;
  evictedTlbVpn: number | null;
  pfn: number;
  physicalAddress: number;
  walkDetails: string[];
}

export interface VirtualMemoryState {
  config: VirtualMemoryConfig;
  tick: number;
  tlb: TlbEntry[];
  /** Outer page directory: vpn1 -> inner page table (sparse map of vpn2 -> PTE) */
  pageDirectory: Record<number, Record<number, PageTableEntry>>;
  frames: PhysicalFrame[];
  history: TranslationStep[];
  metrics: {
    totalAccesses: number;
    tlbHits: number;
    tlbMisses: number;
    pageFaults: number;
    tlbHitRate: number;
    pageFaultRate: number;
  };
}

export function getBitLayout(pageSize: VirtualMemoryConfig["pageSize"]): {
  offsetBits: number;
  vpn1Bits: number;
  vpn2Bits: number;
} {
  const offsetBits = Math.log2(pageSize);
  const remaining = 16 - offsetBits;
  const vpn1Bits = Math.ceil(remaining / 2);
  const vpn2Bits = remaining - vpn1Bits;
  return { offsetBits, vpn1Bits, vpn2Bits };
}

export function decodeVirtualAddress(
  virtualAddress: number,
  pageSize: VirtualMemoryConfig["pageSize"]
): AddressBreakdown {
  const masked = virtualAddress & 0xffff;
  const { offsetBits, vpn1Bits, vpn2Bits } = getBitLayout(pageSize);
  const offsetMask = (1 << offsetBits) - 1;
  const vpn2Mask = (1 << vpn2Bits) - 1;

  const offset = masked & offsetMask;
  const vpn = masked >>> offsetBits;
  const vpn2 = vpn & vpn2Mask;
  const vpn1 = vpn >>> vpn2Bits;

  return {
    virtualAddress: masked,
    vpn,
    vpn1,
    vpn2,
    offset,
    offsetBits,
    vpn1Bits,
    vpn2Bits,
  };
}

export function createVirtualMemoryState(
  partialConfig?: Partial<VirtualMemoryConfig>
): VirtualMemoryState {
  const config: VirtualMemoryConfig = {
    addressBits: 16,
    pageSize: partialConfig?.pageSize ?? 256,
    tlbCapacity: Math.max(1, partialConfig?.tlbCapacity ?? 4),
    tlbPolicy: partialConfig?.tlbPolicy ?? "LRU",
    numFrames: Math.max(1, partialConfig?.numFrames ?? 4),
  };

  const frames: PhysicalFrame[] = Array.from(
    { length: config.numFrames },
    (_, i) => ({
      frameIndex: i,
      vpn: null,
      lastUsedAt: -1,
      loadedAt: -1,
      dirty: false,
    })
  );

  return {
    config,
    tick: 0,
    tlb: [],
    pageDirectory: {},
    frames,
    history: [],
    metrics: {
      totalAccesses: 0,
      tlbHits: 0,
      tlbMisses: 0,
      pageFaults: 0,
      tlbHitRate: 0,
      pageFaultRate: 0,
    },
  };
}

function cloneState(state: VirtualMemoryState): VirtualMemoryState {
  const pageDirectory: VirtualMemoryState["pageDirectory"] = {};
  for (const [k1, inner] of Object.entries(state.pageDirectory)) {
    const innerCopy: Record<number, PageTableEntry> = {};
    for (const [k2, pte] of Object.entries(inner)) {
      innerCopy[Number(k2)] = { ...pte };
    }
    pageDirectory[Number(k1)] = innerCopy;
  }
  return {
    config: { ...state.config },
    tick: state.tick,
    tlb: state.tlb.map((e) => ({ ...e })),
    pageDirectory,
    frames: state.frames.map((f) => ({ ...f })),
    history: [...state.history],
    metrics: { ...state.metrics },
  };
}

function insertIntoTlb(
  tlb: TlbEntry[],
  vpn: number,
  pfn: number,
  tick: number,
  capacity: number,
  policy: TlbPolicy
): number | null {
  const existingIdx = tlb.findIndex((e) => e.vpn === vpn);
  if (existingIdx !== -1) {
    tlb[existingIdx].pfn = pfn;
    tlb[existingIdx].lastUsedAt = tick;
    return null;
  }

  let evictedVpn: number | null = null;
  if (tlb.length >= capacity) {
    let victimIdx = 0;
    for (let i = 1; i < tlb.length; i++) {
      const a = policy === "LRU" ? tlb[i].lastUsedAt : tlb[i].insertedAt;
      const b =
        policy === "LRU" ? tlb[victimIdx].lastUsedAt : tlb[victimIdx].insertedAt;
      if (a < b) {
        victimIdx = i;
      }
    }
    evictedVpn = tlb[victimIdx].vpn;
    tlb.splice(victimIdx, 1);
  }

  tlb.push({
    vpn,
    pfn,
    insertedAt: tick,
    lastUsedAt: tick,
  });

  return evictedVpn;
}

export function accessVirtualAddress(
  prevState: VirtualMemoryState,
  virtualAddress: number,
  isWrite = false
): VirtualMemoryState {
  const state = cloneState(prevState);
  state.tick += 1;
  const tick = state.tick;

  const breakdown = decodeVirtualAddress(virtualAddress, state.config.pageSize);
  const { vpn, vpn1, vpn2, offset, offsetBits } = breakdown;
  const walkDetails: string[] = [];

  let tlbHit = false;
  let pageTableHit = false;
  let pageFault = false;
  let evictedFrameVpn: number | null = null;
  let evictedTlbVpn: number | null = null;
  let pfn = 0;

  // 1. Check TLB
  const tlbEntry = state.tlb.find((e) => e.vpn === vpn);
  if (tlbEntry) {
    tlbHit = true;
    pfn = tlbEntry.pfn;
    tlbEntry.lastUsedAt = tick;
    const frame = state.frames[pfn];
    if (frame) {
      frame.lastUsedAt = tick;
      if (isWrite) frame.dirty = true;
    }
    const pte = state.pageDirectory[vpn1]?.[vpn2];
    if (pte) {
      pte.referenced = true;
      if (isWrite) pte.dirty = true;
    }
    walkDetails.push(
      `TLB HIT for VPN 0x${vpn.toString(16).toUpperCase()} -> PFN ${pfn}`
    );
  } else {
    walkDetails.push(
      `TLB MISS for VPN 0x${vpn.toString(16).toUpperCase()}; walking 2-level page table`
    );
    // 2. Walk 2-level page table
    if (!state.pageDirectory[vpn1]) {
      state.pageDirectory[vpn1] = {};
      walkDetails.push(`PD[${vpn1}] empty -> allocated inner page table`);
    } else {
      walkDetails.push(`PD[${vpn1}] -> located inner page table`);
    }

    let pte = state.pageDirectory[vpn1][vpn2];
    if (!pte) {
      pte = { present: false, pfn: null, dirty: false, referenced: false };
      state.pageDirectory[vpn1][vpn2] = pte;
    }

    if (pte.present && pte.pfn !== null) {
      pageTableHit = true;
      pfn = pte.pfn;
      pte.referenced = true;
      if (isWrite) pte.dirty = true;
      state.frames[pfn].lastUsedAt = tick;
      if (isWrite) state.frames[pfn].dirty = true;
      walkDetails.push(`PT[${vpn2}] PRESENT -> PFN ${pfn}`);
      evictedTlbVpn = insertIntoTlb(
        state.tlb,
        vpn,
        pfn,
        tick,
        state.config.tlbCapacity,
        state.config.tlbPolicy
      );
    } else {
      // 3. Page Fault -> allocate free frame or LRU evict
      pageFault = true;
      walkDetails.push(`PT[${vpn2}] NOT PRESENT -> PAGE FAULT`);

      let targetFrame = state.frames.find((f) => f.vpn === null);
      if (!targetFrame) {
        // LRU physical frame eviction
        targetFrame = state.frames.reduce((oldest, curr) =>
          curr.lastUsedAt < oldest.lastUsedAt ? curr : oldest
        );
        evictedFrameVpn = targetFrame.vpn;
        if (evictedFrameVpn !== null) {
          const { vpn2Bits } = getBitLayout(state.config.pageSize);
          const oldVpn1 = evictedFrameVpn >>> vpn2Bits;
          const oldVpn2 = evictedFrameVpn & ((1 << vpn2Bits) - 1);
          const oldPte = state.pageDirectory[oldVpn1]?.[oldVpn2];
          if (oldPte) {
            oldPte.present = false;
            oldPte.pfn = null;
          }
          // Invalidate evicted page from TLB if present
          const oldTlbIdx = state.tlb.findIndex((e) => e.vpn === evictedFrameVpn);
          if (oldTlbIdx !== -1) {
            state.tlb.splice(oldTlbIdx, 1);
          }
          walkDetails.push(
            `LRU evicted VPN 0x${evictedFrameVpn.toString(16).toUpperCase()} from PFN ${targetFrame.frameIndex}`
          );
        }
      } else {
        walkDetails.push(`Allocated free PFN ${targetFrame.frameIndex}`);
      }

      pfn = targetFrame.frameIndex;
      targetFrame.vpn = vpn;
      targetFrame.loadedAt = tick;
      targetFrame.lastUsedAt = tick;
      targetFrame.dirty = isWrite;

      pte.present = true;
      pte.pfn = pfn;
      pte.referenced = true;
      pte.dirty = isWrite;

      evictedTlbVpn = insertIntoTlb(
        state.tlb,
        vpn,
        pfn,
        tick,
        state.config.tlbCapacity,
        state.config.tlbPolicy
      );
    }
  }

  const physicalAddress = (pfn << offsetBits) | offset;

  state.metrics.totalAccesses += 1;
  if (tlbHit) state.metrics.tlbHits += 1;
  else state.metrics.tlbMisses += 1;
  if (pageFault) state.metrics.pageFaults += 1;
  state.metrics.tlbHitRate =
    state.metrics.tlbHits / state.metrics.totalAccesses;
  state.metrics.pageFaultRate =
    state.metrics.pageFaults / state.metrics.totalAccesses;

  const step: TranslationStep = {
    stepIndex: state.metrics.totalAccesses,
    virtualAddress: breakdown.virtualAddress,
    isWrite,
    breakdown,
    tlbHit,
    pageTableHit,
    pageFault,
    evictedFrameVpn,
    evictedTlbVpn,
    pfn,
    physicalAddress,
    walkDetails,
  };
  state.history.push(step);

  return state;
}

export function runAddressSequence(
  initialState: VirtualMemoryState,
  addresses: Array<{ address: number; isWrite?: boolean }>
): VirtualMemoryState {
  let current = initialState;
  for (const item of addresses) {
    current = accessVirtualAddress(current, item.address, item.isWrite ?? false);
  }
  return current;
}

export const VM_WORKLOAD_PRESETS: Array<{
  id: string;
  label: string;
  description: string;
  addresses: number[];
}> = [
  {
    id: "locality-loop",
    label: "Working-Set Loop (High Locality)",
    description: "Repeated accesses across 3 pages — ideal for >80% TLB hit rate.",
    addresses: [
      0x0104, 0x0108, 0x0204, 0x0308, 0x010c, 0x020c, 0x030c, 0x0110, 0x0210,
      0x0310, 0x0114, 0x0214, 0x0314, 0x0118, 0x0218,
    ],
  },
  {
    id: "strided-miss",
    label: "Strided Scan (Page Thrash)",
    description: "Strides by 256B across 8 distinct pages exceeding a 4-frame memory.",
    addresses: [
      0x0010, 0x0110, 0x0210, 0x0310, 0x0410, 0x0510, 0x0610, 0x0710, 0x0020,
      0x0120, 0x0220, 0x0320,
    ],
  },
  {
    id: "array-seq",
    label: "Sequential Array Walk",
    description: "Tight spatial locality inside a single 1024B page then crossing boundary.",
    addresses: [
      0x0400, 0x0404, 0x0408, 0x040c, 0x0410, 0x0414, 0x0418, 0x0500, 0x0504,
      0x0508,
    ],
  },
];
