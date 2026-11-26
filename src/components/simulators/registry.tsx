"use client";

import type { ComponentType } from "react";
import type { SimulatorId } from "@/types/simulator";
import { AlgorithmVisualizer } from "./AlgorithmVisualizer";
import { AluRegisterLab } from "./AluRegisterLab";
import { BinaryFloatPlayground } from "./BinaryFloatPlayground";
import { BpeTokenizerLab } from "./BpeTokenizerLab";
import { CacheMemorySimulator } from "./CacheMemorySimulator";
import { CalculusEntropyLab } from "./CalculusEntropyLab";
import { ChipletYieldQubitLab } from "./ChipletYieldQubitLab";
import { CompilerPipelineLab } from "./CompilerPipelineLab";
import { ConcurrencyRaftLab } from "./ConcurrencyRaftLab";
import { CpuFetchDecodeExecute } from "./CpuFetchDecodeExecute";
import { CryptoSecurityLab } from "./CryptoSecurityLab";
import { DatabaseBTreeLsmLab } from "./DatabaseBTreeLsmLab";
import { GpuWarpSimulator } from "./GpuWarpSimulator";
import { GraphicsRasterizerLab } from "./GraphicsRasterizerLab";
import { LlmObjectiveLab } from "./LlmObjectiveLab";
import { LogicGateLab } from "./LogicGateLab";
import { MosfetCmosSimulator } from "./MosfetCmosSimulator";
import { NetworkPacketSimulator } from "./NetworkPacketSimulator";
import { NeuralNetBackpropLab } from "./NeuralNetBackpropLab";
import { OhmCircuitSimulator } from "./OhmCircuitSimulator";
import { OsSchedulerSimulator } from "./OsSchedulerSimulator";
import { PipelineHazardSimulator } from "./PipelineHazardSimulator";
import { PnDiodeChargeLab } from "./PnDiodeChargeLab";
import { QuantizationKvCacheLab } from "./QuantizationKvCacheLab";
import { RuntimeMemoryEventLoopLab } from "./RuntimeMemoryEventLoopLab";
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
  "pn-diode-charge": PnDiodeChargeLab,
  "mosfet-cmos": MosfetCmosSimulator,
  "logic-gates": LogicGateLab,
  "binary-float": BinaryFloatPlayground,
  "alu-register": AluRegisterLab,
  "cpu-fde": CpuFetchDecodeExecute,
  "cache-memory": CacheMemorySimulator,
  "pipeline-hazard": PipelineHazardSimulator,
  "virtual-memory": VirtualMemoryPageTableSim,
  "os-scheduler": OsSchedulerSimulator,
  "runtime-memory-eventloop": RuntimeMemoryEventLoopLab,
  "compiler-pipeline": CompilerPipelineLab,
  algorithms: AlgorithmVisualizer,
  "network-tcp": NetworkPacketSimulator,
  "database-storage": DatabaseBTreeLsmLab,
  "concurrency-raft": ConcurrencyRaftLab,
  "crypto-security": CryptoSecurityLab,
  "calculus-entropy": CalculusEntropyLab,
  "graphics-rasterizer": GraphicsRasterizerLab,
  "gpu-warp": GpuWarpSimulator,
  "neural-backprop": NeuralNetBackpropLab,
  "bpe-tokenizer": BpeTokenizerLab,
  "transformer-attention": TransformerAttentionLab,
  "llm-training-objective": LlmObjectiveLab,
  "quantization-kv": QuantizationKvCacheLab,
  "chiplet-yield-qubit": ChipletYieldQubitLab,
};

export function getSimulatorComponent(
  id: SimulatorId
): ComponentType<SimulatorProps> {
  return SIMULATOR_REGISTRY[id];
}
