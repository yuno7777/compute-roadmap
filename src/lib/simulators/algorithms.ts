export type ArrayAlgorithmKind = "quicksort" | "mergesort" | "binary-search";
export type GraphAlgorithmKind = "bfs" | "dfs" | "dijkstra";
export type AlgorithmKind = ArrayAlgorithmKind | GraphAlgorithmKind;

export interface ArrayStep {
  step: number;
  array: number[];
  activeIndices: number[];
  sortedIndices: number[];
  pivotIndex: number | null;
  low?: number;
  mid?: number;
  high?: number;
  foundIndex?: number | null;
  comparisons: number;
  swaps: number;
  description: string;
}

export interface GraphNode {
  id: string;
  label: string;
  x: number;
  y: number;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
}

export interface GraphInput {
  nodes: GraphNode[];
  edges: GraphEdge[];
  directed?: boolean;
}

export interface GraphStep {
  step: number;
  currentNodeId: string | null;
  frontier: string[];
  visited: string[];
  distances: Record<string, number>;
  parents: Record<string, string | null>;
  relaxedEdge: { from: string; to: string } | null;
  path: string[];
  totalCost: number | null;
  comparisons: number;
  description: string;
}

export function traceQuicksort(initialArray: number[]): ArrayStep[] {
  const arr = [...initialArray];
  const steps: ArrayStep[] = [];
  const sorted = new Set<number>();
  let comparisons = 0;
  let swaps = 0;

  const snap = (
    activeIndices: number[],
    pivotIndex: number | null,
    description: string
  ) => {
    steps.push({
      step: steps.length,
      array: [...arr],
      activeIndices,
      sortedIndices: Array.from(sorted).sort((a, b) => a - b),
      pivotIndex,
      comparisons,
      swaps,
      description,
    });
  };

  snap([], null, `Initial array [${arr.join(", ")}]`);

  const swap = (i: number, j: number) => {
    if (i !== j) {
      const tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
      swaps += 1;
    }
  };

  const partition = (lo: number, hi: number): number => {
    const pivot = arr[hi];
    let i = lo;
    snap([hi], hi, `Choose pivot arr[${hi}] = ${pivot} for range [${lo}..${hi}]`);

    for (let j = lo; j < hi; j++) {
      comparisons += 1;
      snap([j, hi], hi, `Compare arr[${j}]=${arr[j]} <= pivot ${pivot}`);
      if (arr[j] <= pivot) {
        if (i !== j) {
          swap(i, j);
          snap([i, j], hi, `Swap arr[${i}] and arr[${j}]`);
        }
        i += 1;
      }
    }
    swap(i, hi);
    sorted.add(i);
    snap([i], i, `Place pivot ${pivot} at final index ${i}`);
    return i;
  };

  const sort = (lo: number, hi: number) => {
    if (lo > hi) return;
    if (lo === hi) {
      sorted.add(lo);
      snap([lo], null, `Single element at index ${lo} (${arr[lo]}) is sorted`);
      return;
    }
    const p = partition(lo, hi);
    sort(lo, p - 1);
    sort(p + 1, hi);
  };

  if (arr.length > 0) {
    sort(0, arr.length - 1);
  }
  for (let i = 0; i < arr.length; i++) sorted.add(i);
  snap([], null, `Quicksort complete: [${arr.join(", ")}]`);
  return steps;
}

export function traceMergesort(initialArray: number[]): ArrayStep[] {
  const arr = [...initialArray];
  const steps: ArrayStep[] = [];
  let comparisons = 0;
  let swaps = 0;

  const snap = (
    activeIndices: number[],
    sortedIndices: number[],
    description: string
  ) => {
    steps.push({
      step: steps.length,
      array: [...arr],
      activeIndices,
      sortedIndices,
      pivotIndex: null,
      comparisons,
      swaps,
      description,
    });
  };

  snap([], [], `Initial array [${arr.join(", ")}]`);

  const merge = (lo: number, mid: number, hi: number, isFinal: boolean) => {
    const left = arr.slice(lo, mid + 1);
    const right = arr.slice(mid + 1, hi + 1);
    let i = 0;
    let j = 0;
    let k = lo;

    while (i < left.length && j < right.length) {
      comparisons += 1;
      if (left[i] <= right[j]) {
        arr[k] = left[i++];
      } else {
        arr[k] = right[j++];
        swaps += 1;
      }
      snap(
        [k],
        isFinal ? Array.from({ length: k - lo + 1 }, (_, x) => lo + x) : [],
        `Merge [${lo}..${mid}] & [${mid + 1}..${hi}]: write ${arr[k]} at index ${k}`
      );
      k += 1;
    }
    while (i < left.length) {
      arr[k] = left[i++];
      snap(
        [k],
        isFinal ? Array.from({ length: k - lo + 1 }, (_, x) => lo + x) : [],
        `Copy remaining left value ${arr[k]} to index ${k}`
      );
      k += 1;
    }
    while (j < right.length) {
      arr[k] = right[j++];
      snap(
        [k],
        isFinal ? Array.from({ length: k - lo + 1 }, (_, x) => lo + x) : [],
        `Copy remaining right value ${arr[k]} to index ${k}`
      );
      k += 1;
    }
  };

  const sort = (lo: number, hi: number) => {
    if (lo >= hi) return;
    const mid = Math.floor((lo + hi) / 2);
    sort(lo, mid);
    sort(mid + 1, hi);
    merge(lo, mid, hi, lo === 0 && hi === arr.length - 1);
  };

  if (arr.length > 0) sort(0, arr.length - 1);
  snap(
    [],
    arr.map((_, i) => i),
    `Mergesort complete: [${arr.join(", ")}]`
  );
  return steps;
}

export function traceBinarySearch(
  initialArray: number[],
  target: number
): ArrayStep[] {
  const arr = [...initialArray].sort((a, b) => a - b);
  const steps: ArrayStep[] = [];
  let comparisons = 0;
  let lo = 0;
  let hi = arr.length - 1;
  let foundIndex: number | null = null;

  steps.push({
    step: 0,
    array: [...arr],
    activeIndices: [],
    sortedIndices: arr.map((_, i) => i),
    pivotIndex: null,
    low: lo,
    high: hi,
    foundIndex: null,
    comparisons: 0,
    swaps: 0,
    description: `Sorted array ready; searching for target ${target}`,
  });

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    comparisons += 1;
    steps.push({
      step: steps.length,
      array: [...arr],
      activeIndices: [mid],
      sortedIndices: [],
      pivotIndex: mid,
      low: lo,
      mid,
      high: hi,
      foundIndex: null,
      comparisons,
      swaps: 0,
      description: `Check mid=${mid} (arr[${mid}]=${arr[mid]}) vs target ${target}`,
    });

    if (arr[mid] === target) {
      foundIndex = mid;
      steps.push({
        step: steps.length,
        array: [...arr],
        activeIndices: [mid],
        sortedIndices: [mid],
        pivotIndex: mid,
        low: lo,
        mid,
        high: hi,
        foundIndex,
        comparisons,
        swaps: 0,
        description: `Found target ${target} at index ${mid} in ${comparisons} comparisons`,
      });
      return steps;
    }

    if (arr[mid] < target) {
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  steps.push({
    step: steps.length,
    array: [...arr],
    activeIndices: [],
    sortedIndices: [],
    pivotIndex: null,
    low: lo,
    high: hi,
    foundIndex: null,
    comparisons,
    swaps: 0,
    description: `Target ${target} not found after ${comparisons} comparisons`,
  });

  return steps;
}

function buildAdjacency(
  graph: GraphInput
): Record<string, Array<{ to: string; weight: number }>> {
  const adj: Record<string, Array<{ to: string; weight: number }>> = {};
  for (const n of graph.nodes) adj[n.id] = [];
  for (const e of graph.edges) {
    if (!adj[e.from]) adj[e.from] = [];
    adj[e.from].push({ to: e.to, weight: e.weight });
    if (!graph.directed) {
      if (!adj[e.to]) adj[e.to] = [];
      adj[e.to].push({ to: e.from, weight: e.weight });
    }
  }
  return adj;
}

function reconstructPath(
  parents: Record<string, string | null>,
  edges: GraphEdge[],
  directed: boolean,
  startId: string,
  targetId: string
): { path: string[]; totalCost: number | null } {
  if (startId === targetId) return { path: [startId], totalCost: 0 };
  if (!(targetId in parents) || parents[targetId] === undefined) {
    return { path: [], totalCost: null };
  }
  const path: string[] = [];
  let curr: string | null = targetId;
  const guard = new Set<string>();
  while (curr !== null && !guard.has(curr)) {
    guard.add(curr);
    path.push(curr);
    if (curr === startId) break;
    curr = parents[curr] ?? null;
  }
  path.reverse();
  if (path[0] !== startId) return { path: [], totalCost: null };

  let totalCost = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const match = edges.filter(
      (e) =>
        (e.from === u && e.to === v) ||
        (!directed && e.from === v && e.to === u)
    );
    if (match.length === 0) return { path: [], totalCost: null };
    totalCost += Math.min(...match.map((e) => e.weight));
  }
  return { path, totalCost };
}

export function traceBfs(
  graph: GraphInput,
  startId: string,
  targetId: string
): GraphStep[] {
  const adj = buildAdjacency(graph);
  const steps: GraphStep[] = [];
  const queue: string[] = [startId];
  const visited = new Set<string>([startId]);
  const distances: Record<string, number> = {};
  const parents: Record<string, string | null> = { [startId]: null };
  for (const n of graph.nodes) distances[n.id] = n.id === startId ? 0 : Infinity;

  let comparisons = 0;
  steps.push({
    step: 0,
    currentNodeId: startId,
    frontier: [...queue],
    visited: Array.from(visited),
    distances: { ...distances },
    parents: { ...parents },
    relaxedEdge: null,
    path: [],
    totalCost: null,
    comparisons,
    description: `BFS start at ${startId} (minimizes hop count, ignores edge weights)`,
  });

  while (queue.length > 0) {
    const u = queue.shift()!;
    if (u === targetId) {
      const { path, totalCost } = reconstructPath(
        parents,
        graph.edges,
        !!graph.directed,
        startId,
        targetId
      );
      steps.push({
        step: steps.length,
        currentNodeId: u,
        frontier: [...queue],
        visited: Array.from(visited),
        distances: { ...distances },
        parents: { ...parents },
        relaxedEdge: null,
        path,
        totalCost,
        comparisons,
        description: `BFS reached ${targetId} via ${path.join(" -> ")} (hops=${path.length - 1}, path weight=${totalCost})`,
      });
      return steps;
    }

    for (const edge of adj[u] ?? []) {
      comparisons += 1;
      if (!visited.has(edge.to)) {
        visited.add(edge.to);
        parents[edge.to] = u;
        distances[edge.to] = distances[u] + 1;
        queue.push(edge.to);
        steps.push({
          step: steps.length,
          currentNodeId: u,
          frontier: [...queue],
          visited: Array.from(visited),
          distances: { ...distances },
          parents: { ...parents },
          relaxedEdge: { from: u, to: edge.to },
          path: [],
          totalCost: null,
          comparisons,
          description: `BFS discover ${edge.to} from ${u} (hop ${distances[edge.to]})`,
        });
      }
    }
  }

  return steps;
}

export function traceDfs(
  graph: GraphInput,
  startId: string,
  targetId: string
): GraphStep[] {
  const adj = buildAdjacency(graph);
  const steps: GraphStep[] = [];
  const stack: string[] = [startId];
  const visited = new Set<string>();
  const distances: Record<string, number> = {};
  const parents: Record<string, string | null> = { [startId]: null };
  for (const n of graph.nodes) distances[n.id] = n.id === startId ? 0 : Infinity;

  let comparisons = 0;

  while (stack.length > 0) {
    const u = stack.pop()!;
    if (visited.has(u)) continue;
    visited.add(u);

    steps.push({
      step: steps.length,
      currentNodeId: u,
      frontier: [...stack],
      visited: Array.from(visited),
      distances: { ...distances },
      parents: { ...parents },
      relaxedEdge: null,
      path: [],
      totalCost: null,
      comparisons,
      description: `DFS visit ${u}`,
    });

    if (u === targetId) {
      const { path, totalCost } = reconstructPath(
        parents,
        graph.edges,
        !!graph.directed,
        startId,
        targetId
      );
      steps.push({
        step: steps.length,
        currentNodeId: u,
        frontier: [...stack],
        visited: Array.from(visited),
        distances: { ...distances },
        parents: { ...parents },
        relaxedEdge: null,
        path,
        totalCost,
        comparisons,
        description: `DFS reached ${targetId} via ${path.join(" -> ")} (weight=${totalCost})`,
      });
      return steps;
    }

    const neighbors = [...(adj[u] ?? [])].reverse();
    for (const edge of neighbors) {
      comparisons += 1;
      if (!visited.has(edge.to)) {
        if (!(edge.to in parents)) {
          parents[edge.to] = u;
          distances[edge.to] = distances[u] + 1;
        }
        stack.push(edge.to);
      }
    }
  }

  return steps;
}

export function traceDijkstra(
  graph: GraphInput,
  startId: string,
  targetId: string
): GraphStep[] {
  const adj = buildAdjacency(graph);
  const steps: GraphStep[] = [];
  const dist: Record<string, number> = {};
  const parents: Record<string, string | null> = { [startId]: null };
  const settled = new Set<string>();
  const frontier = new Set<string>([startId]);

  for (const n of graph.nodes) {
    dist[n.id] = n.id === startId ? 0 : Infinity;
  }

  let comparisons = 0;
  steps.push({
    step: 0,
    currentNodeId: startId,
    frontier: [startId],
    visited: [],
    distances: { ...dist },
    parents: { ...parents },
    relaxedEdge: null,
    path: [],
    totalCost: null,
    comparisons,
    description: `Dijkstra init: dist[${startId}] = 0, others = ∞`,
  });

  while (frontier.size > 0) {
    let u: string | null = null;
    for (const candidate of frontier) {
      if (u === null || dist[candidate] < dist[u]) {
        u = candidate;
      }
    }
    if (u === null || dist[u] === Infinity) break;

    frontier.delete(u);
    settled.add(u);

    steps.push({
      step: steps.length,
      currentNodeId: u,
      frontier: Array.from(frontier),
      visited: Array.from(settled),
      distances: { ...dist },
      parents: { ...parents },
      relaxedEdge: null,
      path: [],
      totalCost: null,
      comparisons,
      description: `Settle minimum-distance node ${u} (dist = ${dist[u]})`,
    });

    if (u === targetId) break;

    for (const edge of adj[u] ?? []) {
      if (settled.has(edge.to)) continue;
      comparisons += 1;
      const alt = dist[u] + edge.weight;
      if (alt < dist[edge.to]) {
        dist[edge.to] = alt;
        parents[edge.to] = u;
        frontier.add(edge.to);
        steps.push({
          step: steps.length,
          currentNodeId: u,
          frontier: Array.from(frontier),
          visited: Array.from(settled),
          distances: { ...dist },
          parents: { ...parents },
          relaxedEdge: { from: u, to: edge.to },
          path: [],
          totalCost: null,
          comparisons,
          description: `Relax (${u} -> ${edge.to}, w=${edge.weight}): dist[${edge.to}] = ${alt}`,
        });
      }
    }
  }

  const { path, totalCost } = reconstructPath(
    parents,
    graph.edges,
    !!graph.directed,
    startId,
    targetId
  );

  steps.push({
    step: steps.length,
    currentNodeId: targetId,
    frontier: [],
    visited: Array.from(settled),
    distances: { ...dist },
    parents: { ...parents },
    relaxedEdge: null,
    path,
    totalCost,
    comparisons,
    description:
      path.length > 0
        ? `Dijkstra optimal path: ${path.join(" -> ")} (total weight = ${totalCost})`
        : `No path from ${startId} to ${targetId}`,
  });

  return steps;
}

export const DEFAULT_WEIGHTED_GRAPH: GraphInput = {
  directed: false,
  nodes: [
    { id: "A", label: "A", x: 70, y: 130 },
    { id: "B", label: "B", x: 200, y: 50 },
    { id: "C", label: "C", x: 360, y: 50 },
    { id: "D", label: "D", x: 490, y: 130 },
    { id: "E", label: "E", x: 280, y: 210 },
  ],
  edges: [
    { from: "A", to: "D", weight: 12 }, // 1-hop trap for BFS!
    { from: "A", to: "B", weight: 2 },
    { from: "B", to: "C", weight: 3 },
    { from: "C", to: "D", weight: 2 }, // A->B->C->D total = 7 < 12
    { from: "A", to: "E", weight: 5 },
    { from: "E", to: "D", weight: 4 }, // A->E->D total = 9
  ],
};
