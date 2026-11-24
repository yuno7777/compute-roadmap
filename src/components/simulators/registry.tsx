"use client";

import type { ComponentType } from "react";
import type { SimulatorId } from "@/types/simulator";
import { AlgorithmVisualizer } from "./AlgorithmVisualizer";
import { AluRegisterLab } from "./AluRegisterLab";
import { BinaryFloatPlayground } from "./BinaryFloatPlayground";
import { CacheMemorySimulator } from "./CacheMemorySimulator";
import { CompilerPipelineLab } from "./CompilerPipelineLab";
import { ConcurrencyRaftLab } from "./ConcurrencyRaftLab";
import { CpuFetchDecodeExecute } from "./CpuFetchDecodeExecute";
import { CryptoSecurityLab } from "./CryptoSecurityLab";
import { DatabaseBTreeLsmLab } from "./DatabaseBTreeLsmLab";
import { GpuWarpSimulator } from "./GpuWarpSimulator";
import { GraphicsRasterizerLab } from "./GraphicsRasterizerLab";
import { LogicGateLab } from "./LogicGateLab";
import { MosfetCmosSimulator } from "./MosfetCmosSimulator";
import { NetworkPacketSimulator } from "./NetworkPacketSimulator";
import { NeuralNetBackpropLab } from "./NeuralNetBackpropLab";
import { OhmCircuitSimulator } from "./OhmCircuitSimulator";
import { OsSchedulerSimulator } from "./OsSchedulerSimulator";
import { PipelineHazardSimulator } from "./PipelineHazardSimulator";
import { QuantizationKvCacheLab } from "./QuantizationKvCacheLab";
import { TransformerAttentionLab } from "./TransformerAttentionLab";
import { VirtualMemoryPageTableSim } from "./VirtualMemoryPageTableSim";

export interface SimulatorProps {
  challengeGoal?: string;
  onChallengeComplete?: () => void;
}

export const SIMULATOR_REGISTRY: Record<
  SimulatorId,
  ComponentType<SimulatorProps>
> = {
  "ohm-circuit": OhmCircuitSimulator,
  "mosfet-cmos": MosfetCmosSimulator,
  "logic-gates": LogicGateLab,
  "binary-float": BinaryFloatPlayground,
  "alu-register": AluRegisterLab,
  "cpu-fde": CpuFetchDecodeExecute,
  "cache-memory": CacheMemorySimulator,
  "pipeline-hazard": PipelineHazardSimulator,
  "virtual-memory": VirtualMemoryPageTableSim,
  "os-scheduler": OsSchedulerSimulator,
  "compiler-pipeline": CompilerPipelineLab,
  algorithms: AlgorithmVisualizer,
  "network-tcp": NetworkPacketSimulator,
  "database-storage": DatabaseBTreeLsmLab,
  "concurrency-raft": ConcurrencyRaftLab,
  "crypto-security": CryptoSecurityLab,
  "graphics-rasterizer": GraphicsRasterizerLab,
  "gpu-warp": GpuWarpSimulator,
  "neural-backprop": NeuralNetBackpropLab,
  "transformer-attention": TransformerAttentionLab,
  "quantization-kv": QuantizationKvCacheLab,
};

export function getSimulatorComponent(
  id: SimulatorId
): ComponentType<SimulatorProps> {
  return SIMULATOR_REGISTRY[id];
}
