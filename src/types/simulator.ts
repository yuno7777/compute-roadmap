import type { DomainId } from "./curriculum";

export type SimulatorId =
  | "ohm-circuit"
  | "pn-diode-charge"
  | "mosfet-cmos"
  | "logic-gates"
  | "binary-float"
  | "alu-register"
  | "cpu-fde"
  | "cache-memory"
  | "pipeline-hazard"
  | "virtual-memory"
  | "os-scheduler"
  | "runtime-memory-eventloop"
  | "compiler-pipeline"
  | "algorithms"
  | "network-tcp"
  | "database-storage"
  | "concurrency-raft"
  | "crypto-security"
  | "calculus-entropy"
  | "graphics-rasterizer"
  | "gpu-warp"
  | "neural-backprop"
  | "bpe-tokenizer"
  | "transformer-attention"
  | "llm-training-objective"
  | "quantization-kv"
  | "chiplet-yield-qubit";

export type SimulatorCategory = "hardware" | "systems" | "graphics-ai";

export interface SimulatorMeta {
  id: SimulatorId;
  title: string;
  subtitle: string;
  domainId: DomainId;
  lessonSlugs: string[];
  category: SimulatorCategory;
  controlsSummary: string;
  challengeDescription: string;
  modelBoundaries?: string;
}
