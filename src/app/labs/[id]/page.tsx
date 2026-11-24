import { notFound } from "next/navigation";
import { SIMULATOR_CATALOG, getSimulatorById } from "@/data/simulators";
import type { SimulatorId } from "@/types/simulator";
import { LabRunnerClient } from "./LabRunnerClient";

export function generateStaticParams() {
  return SIMULATOR_CATALOG.map((sim) => ({
    id: sim.id,
  }));
}

export default async function LabRunnerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const meta = getSimulatorById(id as SimulatorId);
  if (!meta) {
    notFound();
  }

  return <LabRunnerClient simulatorId={meta.id} />;
}
