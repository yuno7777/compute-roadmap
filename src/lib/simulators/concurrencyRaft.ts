export type RaftRole = "follower" | "candidate" | "leader";

export interface RaftLogEntry {
  term: number;
  index: number; // 1-based Raft log index
  command: string;
}

export interface RaftNode {
  id: string;
  role: RaftRole;
  currentTerm: number;
  votedFor: string | null;
  log: RaftLogEntry[];
  commitIndex: number;
  alive: boolean;
  /** 0 = main network, 1 = minority partition */
  partitionGroup: 0 | 1;
  electionElapsed: number;
  electionTimeout: number;
  heartbeatElapsed: number;
  votesReceived: string[];
  matchIndex: Record<string, number>;
  nextIndex: Record<string, number>;
}

export interface RaftClusterState {
  tick: number;
  nodes: RaftNode[];
  heartbeatInterval: number;
  events: string[];
  rngSeed: number;
}

const NODE_IDS = ["N1", "N2", "N3", "N4", "N5"] as const;

function nextPrng(seed: number): { value: number; nextSeed: number } {
  const nextSeed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { value: nextSeed / 0x100000000, nextSeed };
}

export function createRaftCluster(seed = 42): RaftClusterState {
  let rng = seed;
  const nodes: RaftNode[] = NODE_IDS.map((id, idx) => {
    const r = nextPrng(rng);
    rng = r.nextSeed;
    // Distinct deterministic timeouts between 8 and 18 ticks
    const electionTimeout = 8 + idx * 2 + Math.floor(r.value * 3);
    return {
      id,
      role: "follower",
      currentTerm: 0,
      votedFor: null,
      log: [],
      commitIndex: 0,
      alive: true,
      partitionGroup: 0,
      electionElapsed: 0,
      electionTimeout,
      heartbeatElapsed: 0,
      votesReceived: [],
      matchIndex: {},
      nextIndex: {},
    };
  });

  return {
    tick: 0,
    nodes,
    heartbeatInterval: 3,
    events: ["Initialized 5-node Raft cluster (all followers, term 0)"],
    rngSeed: rng,
  };
}

function cloneCluster(state: RaftClusterState): RaftClusterState {
  return {
    ...state,
    nodes: state.nodes.map((n) => ({
      ...n,
      log: n.log.map((e) => ({ ...e })),
      votesReceived: [...n.votesReceived],
      matchIndex: { ...n.matchIndex },
      nextIndex: { ...n.nextIndex },
    })),
    events: [...state.events],
  };
}

function canReach(a: RaftNode, b: RaftNode): boolean {
  return a.alive && b.alive && a.partitionGroup === b.partitionGroup;
}

function isLogAtLeastAsUpToDate(
  candidateLog: RaftLogEntry[],
  voterLog: RaftLogEntry[]
): boolean {
  const cLastTerm =
    candidateLog.length > 0 ? candidateLog[candidateLog.length - 1].term : 0;
  const vLastTerm =
    voterLog.length > 0 ? voterLog[voterLog.length - 1].term : 0;
  if (cLastTerm !== vLastTerm) return cLastTerm > vLastTerm;
  return candidateLog.length >= voterLog.length;
}

function becomeFollower(node: RaftNode, term: number) {
  node.role = "follower";
  node.currentTerm = term;
  node.votedFor = null;
  node.votesReceived = [];
  node.electionElapsed = 0;
}

function replicateFromLeader(
  leader: RaftNode,
  cluster: RaftClusterState,
  events: string[]
) {
  const quorum = Math.floor(cluster.nodes.length / 2) + 1; // 3 for 5 nodes
  for (const peer of cluster.nodes) {
    if (peer.id === leader.id || !canReach(leader, peer)) continue;

    // Term check
    if (peer.currentTerm > leader.currentTerm) {
      becomeFollower(leader, peer.currentTerm);
      events.push(
        `t=${cluster.tick}: ${leader.id} stepped down (saw higher term ${peer.currentTerm} from ${peer.id})`
      );
      return;
    }

    if (peer.currentTerm < leader.currentTerm || peer.role !== "follower") {
      becomeFollower(peer, leader.currentTerm);
    }
    peer.electionElapsed = 0;

    // Reconcile logs from nextIndex
    let nextIdx = leader.nextIndex[peer.id] ?? leader.log.length + 1;
    if (nextIdx > leader.log.length + 1) nextIdx = leader.log.length + 1;
    const prevIdx = nextIdx - 1;
    const prevTerm = prevIdx > 0 ? leader.log[prevIdx - 1]?.term ?? 0 : 0;
    const peerPrevTerm = prevIdx > 0 ? peer.log[prevIdx - 1]?.term ?? -1 : 0;

    if (prevIdx > peer.log.length || peerPrevTerm !== prevTerm) {
      // Backtrack nextIndex on mismatch
      leader.nextIndex[peer.id] = Math.max(1, prevIdx);
    } else {
      // Append any missing/conflicting suffix
      const leaderSuffix = leader.log.slice(prevIdx);
      const conflict =
        peer.log.length > prevIdx &&
        (leaderSuffix.length === 0 ||
          peer.log[prevIdx].term !== leaderSuffix[0]?.term);
      if (conflict || peer.log.length !== leader.log.length) {
        peer.log = [
          ...peer.log.slice(0, prevIdx),
          ...leaderSuffix.map((e) => ({ ...e })),
        ];
      }
      leader.matchIndex[peer.id] = peer.log.length;
      leader.nextIndex[peer.id] = peer.log.length + 1;
    }

    // Advance follower commitIndex
    if (leader.commitIndex > peer.commitIndex) {
      peer.commitIndex = Math.min(leader.commitIndex, peer.log.length);
    }
  }

  // Leader advances commitIndex if a majority holds an entry from currentTerm
  for (let idx = leader.log.length; idx > leader.commitIndex; idx--) {
    const entry = leader.log[idx - 1];
    if (entry.term !== leader.currentTerm) continue;
    let count = 1; // leader itself
    for (const peer of cluster.nodes) {
      if (
        peer.id !== leader.id &&
        canReach(leader, peer) &&
        (leader.matchIndex[peer.id] ?? 0) >= idx
      ) {
        count += 1;
      }
    }
    if (count >= quorum) {
      leader.commitIndex = idx;
      events.push(
        `t=${cluster.tick}: ${leader.id} committed index #${idx} ("${entry.command}") with quorum ${count}/5`
      );
      // Immediately propagate commitIndex to reachable peers
      for (const peer of cluster.nodes) {
        if (peer.id !== leader.id && canReach(leader, peer)) {
          peer.commitIndex = Math.min(leader.commitIndex, peer.log.length);
        }
      }
      break;
    }
  }
}

export function stepRaftTick(prev: RaftClusterState): RaftClusterState {
  const s = cloneCluster(prev);
  s.tick += 1;
  const events: string[] = [];
  const quorum = Math.floor(s.nodes.length / 2) + 1;

  for (const node of s.nodes) {
    if (!node.alive) continue;

    if (node.role === "leader") {
      node.heartbeatElapsed += 1;
      if (node.heartbeatElapsed >= s.heartbeatInterval) {
        node.heartbeatElapsed = 0;
        replicateFromLeader(node, s, events);
      }
      continue;
    }

    node.electionElapsed += 1;
    if (node.electionElapsed >= node.electionTimeout) {
      // Start election
      node.role = "candidate";
      node.currentTerm += 1;
      node.votedFor = node.id;
      node.votesReceived = [node.id];
      node.electionElapsed = 0;
      const r = nextPrng(s.rngSeed);
      s.rngSeed = r.nextSeed;
      node.electionTimeout = 10 + Math.floor(r.value * 9);

      events.push(
        `t=${s.tick}: ${node.id} started election for term ${node.currentTerm}`
      );

      for (const peer of s.nodes) {
        if (peer.id === node.id || !canReach(node, peer)) continue;
        if (peer.currentTerm > node.currentTerm) {
          becomeFollower(node, peer.currentTerm);
          events.push(
            `t=${s.tick}: ${node.id} aborted election (peer ${peer.id} at term ${peer.currentTerm})`
          );
          break;
        }
        if (peer.currentTerm < node.currentTerm) {
          becomeFollower(peer, node.currentTerm);
        }
        const canVote =
          (peer.votedFor === null || peer.votedFor === node.id) &&
          isLogAtLeastAsUpToDate(node.log, peer.log);
        if (canVote) {
          peer.votedFor = node.id;
          peer.electionElapsed = 0;
          node.votesReceived.push(peer.id);
        }
      }

      if (node.role === "candidate" && node.votesReceived.length >= quorum) {
        node.role = "leader";
        node.heartbeatElapsed = 0;
        for (const p of s.nodes) {
          node.nextIndex[p.id] = node.log.length + 1;
          node.matchIndex[p.id] = 0;
        }
        events.push(
          `t=${s.tick}: ${node.id} ELECTED LEADER for term ${node.currentTerm} (${node.votesReceived.length}/5 votes)`
        );
        replicateFromLeader(node, s, events);
      }
    }
  }

  if (events.length > 0) {
    s.events = [...s.events, ...events].slice(-40);
  }
  return s;
}

export function stepRaftTicks(
  prev: RaftClusterState,
  ticks: number
): RaftClusterState {
  let curr = prev;
  for (let i = 0; i < ticks; i++) {
    curr = stepRaftTick(curr);
  }
  return curr;
}

export function appendClientCommand(
  prev: RaftClusterState,
  command: string,
  preferredLeaderId?: string
): { state: RaftClusterState; accepted: boolean; leaderId: string | null } {
  const s = cloneCluster(prev);
  const leaders = s.nodes.filter((n) => n.alive && n.role === "leader");
  const leader =
    (preferredLeaderId
      ? leaders.find((l) => l.id === preferredLeaderId)
      : undefined) ??
    leaders.find((l) => l.partitionGroup === 0) ??
    leaders[0];

  if (!leader) {
    s.events = [
      ...s.events,
      `t=${s.tick}: Client command "${command}" rejected (no active leader)`,
    ].slice(-40);
    return { state: s, accepted: false, leaderId: null };
  }

  const entry: RaftLogEntry = {
    term: leader.currentTerm,
    index: leader.log.length + 1,
    command,
  };
  leader.log.push(entry);
  const newEvents = [
    `t=${s.tick}: Client appended #${entry.index} "${command}" to leader ${leader.id} (term ${leader.currentTerm})`,
  ];
  replicateFromLeader(leader, s, newEvents);
  s.events = [...s.events, ...newEvents].slice(-40);
  return { state: s, accepted: true, leaderId: leader.id };
}

export function setNodeAlive(
  prev: RaftClusterState,
  nodeId: string,
  alive: boolean
): RaftClusterState {
  const s = cloneCluster(prev);
  const node = s.nodes.find((n) => n.id === nodeId);
  if (!node) return s;
  node.alive = alive;
  if (!alive) {
    node.role = "follower";
    s.events = [...s.events, `t=${s.tick}: ${nodeId} CRASHED`].slice(-40);
  } else {
    node.role = "follower";
    node.electionElapsed = 0;
    s.events = [...s.events, `t=${s.tick}: ${nodeId} RECOVERED`].slice(-40);
  }
  return s;
}

export function setNodePartitionGroup(
  prev: RaftClusterState,
  nodeId: string,
  group: 0 | 1
): RaftClusterState {
  const s = cloneCluster(prev);
  const node = s.nodes.find((n) => n.id === nodeId);
  if (!node) return s;
  node.partitionGroup = group;
  s.events = [
    ...s.events,
    `t=${s.tick}: ${nodeId} moved to network partition ${group === 0 ? "Majority/Main" : "Isolated Minority"}`,
  ].slice(-40);
  return s;
}

export function healAllPartitions(prev: RaftClusterState): RaftClusterState {
  const s = cloneCluster(prev);
  for (const n of s.nodes) {
    n.partitionGroup = 0;
  }
  s.events = [
    ...s.events,
    `t=${s.tick}: Network partition HEALED — all nodes in Group 0`,
  ].slice(-40);
  return s;
}
