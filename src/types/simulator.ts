import type { DomainId } from "./curriculum";

export type SimulatorId =
  | "ohm-circuit"
  | "mosfet-cmos"
  | "logic-gates"
  | "binary-float"
  | "alu-register"
  | "cpu-fde"
  | "cache-memory"
  | "pipeline-hazard"
  | "virtual-memory"
  | "os-scheduler"
  | "compiler-pipeline"
  | "algorithms"
  | "network-tcp"
  | "database-storage"
  | "concurrency-raft"
  | "crypto-security"
  | "graphics-rasterizer"
  | "gpu-warp"
  | "neural-backprop"
  | "transformer-attention"
  | "quantization-kv";

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
}
