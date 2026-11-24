"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Crosshair,
  Pause,
  Play,
  RotateCcw,
} from "lucide-react";
import type { SimulatorProps } from "./registry";
import { getSimulatorById } from "@/data/simulators";
import {
  inspectPixel,
  rasterizeScene,
  type RasterizerSceneId,
} from "@/lib/simulators/graphicsRasterizer";

const RASTER_W = 240;
const RASTER_H = 180;

export function GraphicsRasterizerLab({
  challengeGoal,
  onChallengeComplete,
}: SimulatorProps) {
  const meta = getSimulatorById("graphics-rasterizer");
  const goalText = challengeGoal ?? meta?.challengeDescription;

  const [sceneId, setSceneId] = useState<RasterizerSceneId>("z-fighting");
  const [yawDeg, setYawDeg] = useState(18);
  const [pitchDeg, setPitchDeg] = useState(12);
  const [fovDeg, setFovDeg] = useState(50);
  const [near, setNear] = useState(0.002);
  const [far, setFar] = useState(2500);
  const [depthTest, setDepthTest] = useState(true);
  const [wireframe, setWireframe] = useState(false);
  const [phongShading, setPhongShading] = useState(true);
  const [depthPrecisionBits, setDepthPrecisionBits] = useState<16 | 24>(16);
  const [autoOrbit, setAutoOrbit] = useState(false);
  const [inspectCoords, setInspectCoords] = useState<{ x: number; y: number }>({
    x: 120,
    y: 90,
  });
  const [challengeCompleted, setChallengeCompleted] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!autoOrbit) return;
    const timer = window.setInterval(() => {
      setYawDeg((prev) => ((prev + 2 + 180) % 360) - 180);
    }, 60);
    return () => window.clearInterval(timer);
  }, [autoOrbit]);

  const result = useMemo(
    () =>
      rasterizeScene({
        width: RASTER_W,
        height: RASTER_H,
        camera: {
          yawDeg,
          pitchDeg,
          distance: 4.2,
          fovDeg,
          near,
          far,
        },
        depthTest,
        wireframe,
        phongShading,
        depthPrecisionBits,
        sceneId,
        zOffset: 0.0022,
      }),
    [
      yawDeg,
      pitchDeg,
      fovDeg,
      near,
      far,
      depthTest,
      wireframe,
      phongShading,
      depthPrecisionBits,
      sceneId,
    ]
  );

  // Draw framebuffer + pixel inspector crosshair onto Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = new ImageData(
      new Uint8ClampedArray(result.colorBuffer),
      RASTER_W,
      RASTER_H
    );
    ctx.putImageData(imageData, 0, 0);

    // Subtle inspector crosshair
    ctx.strokeStyle = "#f59e0b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(inspectCoords.x - 6, inspectCoords.y + 0.5);
    ctx.lineTo(inspectCoords.x + 6, inspectCoords.y + 0.5);
    ctx.moveTo(inspectCoords.x + 0.5, inspectCoords.y - 6);
    ctx.lineTo(inspectCoords.x + 0.5, inspectCoords.y + 6);
    ctx.stroke();
  }, [result, inspectCoords]);

  const pixelInfo = useMemo(
    () => inspectPixel(result, inspectCoords.x, inspectCoords.y),
    [result, inspectCoords]
  );

  // Challenge check: Z-fighting eliminated via near/far plane tuning with depth test on
  useEffect(() => {
    const solved =
      sceneId === "z-fighting" &&
      depthTest &&
      near >= 0.25 &&
      result.zFightingOverlapPixels === 0 &&
      result.coveredPixels > 100;

    if (solved && !completedRef.current) {
      completedRef.current = true;
      setChallengeCompleted(true);
      onChallengeComplete?.();
    }
  }, [sceneId, depthTest, near, result, onChallengeComplete]);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * RASTER_W);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * RASTER_H);
    setInspectCoords({
      x: Math.max(0, Math.min(RASTER_W - 1, x)),
      y: Math.max(0, Math.min(RASTER_H - 1, y)),
    });
  }

  function handleReset() {
    setSceneId("z-fighting");
    setYawDeg(18);
    setPitchDeg(12);
    setFovDeg(50);
    setNear(0.002);
    setFar(2500);
    setDepthTest(true);
    setWireframe(false);
    setPhongShading(true);
    setDepthPrecisionBits(16);
    setAutoOrbit(false);
    setInspectCoords({ x: 120, y: 90 });
  }

  const farNearRatio = far / Math.max(1e-5, near);

  return (
    <div className="swiss-card p-5 text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[var(--border-subtle)] pb-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--text-muted)]">
            3D Pipeline &amp; Barycentric Rasterizer · {RASTER_W}×{RASTER_H}
          </p>
          <h3 className="mt-0.5 text-base font-semibold">
            {meta?.title ?? "2D/3D Triangle Rasterizer & Shader Bench"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoOrbit((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-subtle)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-muted)]"
          >
            {autoOrbit ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {autoOrbit ? "Pause Orbit" : "Auto Orbit"}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 rounded border border-[var(--border-strong)] bg-[var(--bg-surface)] px-2.5 py-1 font-mono text-xs hover:bg-[var(--bg-subtle)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>
      </div>

      {/* Challenge Banner */}
      {goalText && (
        <div
          className={`mt-3 flex items-center justify-between gap-3 rounded border px-3 py-2 text-xs ${
            challengeCompleted
              ? "border-[var(--accent-emerald)] bg-[var(--accent-emerald-soft)]"
              : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
          }`}
        >
          <p className="text-[var(--text-secondary)]">
            <strong className="font-semibold text-[var(--text-primary)]">
              Challenge:
            </strong>{" "}
            {goalText}
          </p>
          {challengeCompleted && (
            <span className="inline-flex shrink-0 items-center gap-1 font-mono text-[11px] font-semibold text-[var(--accent-emerald)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Solved
            </span>
          )}
        </div>
      )}

      {/* Main Split */}
      <div className="mt-4 grid gap-4 lg:grid-cols-12">
        {/* Left: Software Framebuffer Canvas */}
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded border border-[var(--border-strong)] bg-[#0f141c]">
            <canvas
              ref={canvasRef}
              width={RASTER_W}
              height={RASTER_H}
              onClick={handleCanvasClick}
              style={{ imageRendering: "pixelated" }}
              className="aspect-[4/3] w-full cursor-crosshair block"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-muted)]">
            <span className="inline-flex items-center gap-1 font-mono">
              <Crosshair className="h-3.5 w-3.5 text-[var(--accent-amber)]" />
              Click framebuffer to inspect pixel barycentrics &amp; Z-depth
            </span>
            <span className="font-mono swiss-tabular">
              Covered: {result.coveredPixels.toLocaleString()} px
            </span>
          </div>

          {/* Pixel Inspector Card */}
          <div className="mt-3 rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-1.5">
              <span className="font-mono text-xs font-semibold">
                Pixel Inspector ({pixelInfo.x}, {pixelInfo.y})
              </span>
              <span className="font-mono text-xs text-[var(--text-muted)]">
                {pixelInfo.covered ? pixelInfo.triangleLabel : "Background"}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 font-mono text-xs swiss-tabular sm:grid-cols-4">
              <div>
                <div className="text-[10px] uppercase text-[var(--text-muted)]">
                  Barycentric (w0,w1,w2)
                </div>
                <div>
                  {pixelInfo.barycentric
                    ? pixelInfo.barycentric.map((w) => w.toFixed(2)).join(", ")
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[var(--text-muted)]">
                  Depth (NDC 0..1)
                </div>
                <div>{pixelInfo.covered ? pixelInfo.depth.toFixed(6) : "1.000000"}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[var(--text-muted)]">
                  Normal (N)
                </div>
                <div>
                  {pixelInfo.normal
                    ? `${pixelInfo.normal.x.toFixed(2)}, ${pixelInfo.normal.y.toFixed(2)}, ${pixelInfo.normal.z.toFixed(2)}`
                    : "—"}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase text-[var(--text-muted)]">
                  RGB Output
                </div>
                <div>{pixelInfo.color.join(", ")}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Controls & Depth Precision Diagnostics */}
        <div className="space-y-3 lg:col-span-5">
          {/* Scene & Toggles */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3">
            <div className="text-xs font-semibold">Scene &amp; Pipeline Stages</div>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => setSceneId("z-fighting")}
                className={`rounded border px-2 py-1.5 font-mono text-xs ${
                  sceneId === "z-fighting"
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                Z-Fighting Planes
              </button>
              <button
                type="button"
                onClick={() => setSceneId("pyramid-occlusion")}
                className={`rounded border px-2 py-1.5 font-mono text-xs ${
                  sceneId === "pyramid-occlusion"
                    ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)] text-[var(--accent-blue)]"
                    : "border-[var(--border-subtle)] bg-[var(--bg-subtle)]"
                }`}
              >
                3D Pyramid Occluder
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={depthTest}
                  onChange={(e) => setDepthTest(e.target.checked)}
                />
                <span>Z-Buffer Test</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wireframe}
                  onChange={(e) => setWireframe(e.target.checked)}
                />
                <span>Wireframe</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={phongShading}
                  onChange={(e) => setPhongShading(e.target.checked)}
                />
                <span>Phong Shading</span>
              </label>
              <div className="flex items-center gap-1.5 font-mono">
                <span>Depth:</span>
                <button
                  type="button"
                  onClick={() => setDepthPrecisionBits(16)}
                  className={`rounded border px-1.5 py-0.5 text-[11px] ${
                    depthPrecisionBits === 16
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  16-bit
                </button>
                <button
                  type="button"
                  onClick={() => setDepthPrecisionBits(24)}
                  className={`rounded border px-1.5 py-0.5 text-[11px] ${
                    depthPrecisionBits === 24
                      ? "border-[var(--accent-blue)] bg-[var(--accent-blue-soft)]"
                      : "border-[var(--border-subtle)]"
                  }`}
                >
                  24-bit
                </button>
              </div>
            </div>
          </div>

          {/* Camera & Frustum Sliders */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 space-y-2.5">
            <div className="text-xs font-semibold">Camera &amp; Clip Frustum</div>

            <SliderRow
              label="Yaw"
              valueDisplay={`${yawDeg}°`}
              min={-180}
              max={180}
              step={1}
              value={yawDeg}
              onChange={setYawDeg}
            />
            <SliderRow
              label="Pitch"
              valueDisplay={`${pitchDeg}°`}
              min={-60}
              max={60}
              step={1}
              value={pitchDeg}
              onChange={setPitchDeg}
            />
            <SliderRow
              label="FOV"
              valueDisplay={`${fovDeg}°`}
              min={25}
              max={95}
              step={1}
              value={fovDeg}
              onChange={setFovDeg}
            />
            <SliderRow
              label="Near Plane (z_near)"
              valueDisplay={near.toFixed(3)}
              min={0.001}
              max={1.5}
              step={0.005}
              value={near}
              onChange={setNear}
            />
            <SliderRow
              label="Far Plane (z_far)"
              valueDisplay={`${far}`}
              min={10}
              max={5000}
              step={10}
              value={far}
              onChange={setFar}
            />
          </div>

          {/* Depth Precision Readout */}
          <div className="rounded border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3 font-mono text-xs swiss-tabular space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">far / near ratio:</span>
              <span>{farNearRatio.toFixed(0)} : 1</span>
            </div>
            {sceneId === "z-fighting" && (
              <>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Overlap ΔZ steps:</span>
                  <span>
                    {result.minDepthSeparationSteps !== null
                      ? `${result.minDepthSeparationSteps} ULPs`
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-muted)]">Z-fighting pixels:</span>
                  <span
                    className={
                      result.zFightingOverlapPixels > 0
                        ? "font-semibold text-[var(--accent-crimson)]"
                        : "font-semibold text-[var(--accent-emerald)]"
                    }
                  >
                    {result.zFightingOverlapPixels} px
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderRow({
  label,
  valueDisplay,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  valueDisplay: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span className="text-[var(--text-secondary)]">{label}</span>
        <span className="font-mono swiss-tabular">{valueDisplay}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[var(--accent-blue)]"
      />
    </div>
  );
}
