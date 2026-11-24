export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Vec4 {
  x: number;
  y: number;
  z: number;
  w: number;
}

/** Column-major 4x4 transformation matrix (16 elements). */
export type Mat4 = readonly number[];

export interface Vertex3D {
  position: Vec3;
  normal: Vec3;
  color: Vec3; // RGB in [0, 1]
}

export interface Triangle3D {
  id: string;
  label: string;
  v0: Vertex3D;
  v1: Vertex3D;
  v2: Vertex3D;
}

export interface CameraParams {
  yawDeg: number;
  pitchDeg: number;
  distance: number;
  fovDeg: number;
  near: number;
  far: number;
}

export type RasterizerSceneId = "z-fighting" | "pyramid-occlusion";

export interface RasterizerConfig {
  width: number;
  height: number;
  camera: CameraParams;
  depthTest: boolean;
  wireframe: boolean;
  phongShading: boolean;
  depthPrecisionBits: 16 | 24;
  sceneId: RasterizerSceneId;
  zOffset?: number;
  lightDir?: Vec3;
  ambient?: number;
}

export interface ProjectedVertex {
  clip: Vec4;
  ndc: Vec3;
  screenX: number;
  screenY: number;
  invW: number;
  normal: Vec3;
  color: Vec3;
  worldPos: Vec3;
}

export interface ProjectedTriangle {
  id: string;
  label: string;
  v0: ProjectedVertex;
  v1: ProjectedVertex;
  v2: ProjectedVertex;
  culled: boolean;
}

export interface PixelInspection {
  x: number;
  y: number;
  covered: boolean;
  triangleId: string | null;
  triangleLabel: string | null;
  barycentric: [number, number, number] | null;
  depth: number;
  quantizedDepth: number;
  color: [number, number, number];
  normal: Vec3 | null;
}

export interface RasterizerResult {
  width: number;
  height: number;
  /** RGBA byte buffer of length width * height * 4 */
  colorBuffer: Uint8ClampedArray;
  /** Normalized depth buffer [0, 1] (1 = far) */
  depthBuffer: Float64Array;
  /** Quantized depth buffer used for depth comparison */
  quantizedDepthBuffer: Float64Array;
  triangleIdBuffer: Int32Array;
  barycentricBuffer: Float32Array;
  normalBuffer: Float32Array;
  projectedTriangles: ProjectedTriangle[];
  mvpMatrix: number[];
  coveredPixels: number;
  /** Count of overlapping pixels where two surfaces share the same quantized depth bucket */
  zFightingOverlapPixels: number;
  /** Minimum quantized depth separation (in ULPs) between overlapping surfaces in z-fighting scene */
  minDepthSeparationSteps: number | null;
}

// ============================================================================
// Vector & 4x4 Matrix Math
// ============================================================================

export function vec3(x: number, y: number, z: number): Vec3 {
  return { x, y, z };
}

export function vec3Add(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

export function vec3Sub(a: Vec3, b: Vec3): Vec3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

export function vec3Scale(v: Vec3, s: number): Vec3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

export function vec3Dot(a: Vec3, b: Vec3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vec3Cross(a: Vec3, b: Vec3): Vec3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

export function vec3Length(v: Vec3): number {
  return Math.hypot(v.x, v.y, v.z);
}

export function vec3Normalize(v: Vec3): Vec3 {
  const len = vec3Length(v);
  if (len < 1e-12) return { x: 0, y: 0, z: 1 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

export function mat4Identity(): number[] {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

/** Column-major 4x4 multiplication: out = a * b */
export function mat4Multiply(a: Mat4, b: Mat4): number[] {
  const out = new Array<number>(16).fill(0);
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 4; row++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[k * 4 + row] * b[col * 4 + k];
      }
      out[col * 4 + row] = sum;
    }
  }
  return out;
}

export function mat4TransformVec4(m: Mat4, v: Vec4): Vec4 {
  return {
    x: m[0] * v.x + m[4] * v.y + m[8] * v.z + m[12] * v.w,
    y: m[1] * v.x + m[5] * v.y + m[9] * v.z + m[13] * v.w,
    z: m[2] * v.x + m[6] * v.y + m[10] * v.z + m[14] * v.w,
    w: m[3] * v.x + m[7] * v.y + m[11] * v.z + m[15] * v.w,
  };
}

export function mat4LookAt(eye: Vec3, target: Vec3, up: Vec3): number[] {
  const f = vec3Normalize(vec3Sub(target, eye));
  const s = vec3Normalize(vec3Cross(f, up));
  const u = vec3Cross(s, f);

  return [
    s.x,
    u.x,
    -f.x,
    0,
    s.y,
    u.y,
    -f.y,
    0,
    s.z,
    u.z,
    -f.z,
    0,
    -vec3Dot(s, eye),
    -vec3Dot(u, eye),
    vec3Dot(f, eye),
    1,
  ];
}

export function mat4Perspective(
  fovDeg: number,
  aspect: number,
  near: number,
  far: number
): number[] {
  const safeNear = Math.max(1e-5, near);
  const safeFar = Math.max(safeNear + 0.1, far);
  const fovRad = (fovDeg * Math.PI) / 180;
  const f = 1 / Math.tan(fovRad / 2);
  const nf = 1 / (safeNear - safeFar);

  return [
    f / Math.max(1e-5, aspect),
    0,
    0,
    0,
    0,
    f,
    0,
    0,
    0,
    0,
    (safeFar + safeNear) * nf,
    -1,
    0,
    0,
    2 * safeFar * safeNear * nf,
    0,
  ];
}

export function computeCameraEye(camera: CameraParams): Vec3 {
  const yaw = (camera.yawDeg * Math.PI) / 180;
  const pitch = (Math.max(-85, Math.min(85, camera.pitchDeg)) * Math.PI) / 180;
  const r = Math.max(0.5, camera.distance);
  return {
    x: r * Math.cos(pitch) * Math.sin(yaw),
    y: r * Math.sin(pitch),
    z: r * Math.cos(pitch) * Math.cos(yaw),
  };
}

export function buildMvpMatrix(
  camera: CameraParams,
  aspect: number,
  modelMatrix: Mat4 = mat4Identity()
): number[] {
  const eye = computeCameraEye(camera);
  const view = mat4LookAt(eye, vec3(0, 0, 0), vec3(0, 1, 0));
  const proj = mat4Perspective(camera.fovDeg, aspect, camera.near, camera.far);
  return mat4Multiply(proj, mat4Multiply(view, modelMatrix));
}

// ============================================================================
// Barycentric & Edge Functions
// ============================================================================

/**
 * 2D signed edge function: positive when p is to the left of (b - a) in standard
 * coordinates, or proportional to 2x signed area of triangle (a, b, p).
 */
export function edgeFunction(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  px: number,
  py: number
): number {
  return (px - ax) * (by - ay) - (py - ay) * (bx - ax);
}

export interface BarycentricResult {
  inside: boolean;
  w0: number;
  w1: number;
  w2: number;
  signedArea2: number;
}

export function computeBarycentric(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  cx: number,
  cy: number,
  px: number,
  py: number
): BarycentricResult {
  const signedArea2 = edgeFunction(ax, ay, bx, by, cx, cy);
  if (Math.abs(signedArea2) < 1e-6) {
    return { inside: false, w0: 0, w1: 0, w2: 0, signedArea2: 0 };
  }

  const e0 = edgeFunction(bx, by, cx, cy, px, py);
  const e1 = edgeFunction(cx, cy, ax, ay, px, py);
  const e2 = edgeFunction(ax, ay, bx, by, px, py);

  const w0 = e0 / signedArea2;
  const w1 = e1 / signedArea2;
  const w2 = e2 / signedArea2;

  const eps = -1e-5;
  const inside = w0 >= eps && w1 >= eps && w2 >= eps;
  return { inside, w0, w1, w2, signedArea2 };
}

// ============================================================================
// Built-in 3D Scenes
// ============================================================================

function makeTri(
  id: string,
  label: string,
  p0: Vec3,
  p1: Vec3,
  p2: Vec3,
  color: Vec3,
  smoothNormals?: [Vec3, Vec3, Vec3]
): Triangle3D {
  const flatNormal = vec3Normalize(vec3Cross(vec3Sub(p1, p0), vec3Sub(p2, p0)));
  return {
    id,
    label,
    v0: { position: p0, normal: smoothNormals ? smoothNormals[0] : flatNormal, color },
    v1: { position: p1, normal: smoothNormals ? smoothNormals[1] : flatNormal, color },
    v2: { position: p2, normal: smoothNormals ? smoothNormals[2] : flatNormal, color },
  };
}

export function getSceneTriangles(
  sceneId: RasterizerSceneId,
  zOffset = 0.0025
): Triangle3D[] {
  if (sceneId === "z-fighting") {
    const cobalt = vec3(0.15, 0.39, 0.92);
    const amber = vec3(0.92, 0.55, 0.08);
    const slate = vec3(0.32, 0.38, 0.46);

    // Back reference floor/backdrop triangle
    const backdrop = makeTri(
      "backdrop",
      "Backdrop Plane",
      vec3(-1.35, -0.95, -0.8),
      vec3(1.35, -0.95, -0.8),
      vec3(0.0, 1.15, -0.8),
      slate
    );

    // Rear overlapping plane
    const rearLeft = makeTri(
      "rear-a",
      "Rear Surface (Amber)",
      vec3(-0.95, -0.65, 0.0),
      vec3(0.95, -0.65, 0.0),
      vec3(0.95, 0.85, 0.0),
      amber
    );
    const rearRight = makeTri(
      "rear-b",
      "Rear Surface (Amber)",
      vec3(-0.95, -0.65, 0.0),
      vec3(0.95, 0.85, 0.0),
      vec3(-0.95, 0.85, 0.0),
      amber
    );

    // Front overlapping plane displaced by tiny zOffset along +Z
    const front = makeTri(
      "front-cobalt",
      "Front Surface (Cobalt)",
      vec3(-0.65, -0.75, zOffset),
      vec3(0.75, -0.55, zOffset),
      vec3(-0.1, 0.95, zOffset),
      cobalt
    );

    return [backdrop, rearLeft, rearRight, front];
  }

  // "pyramid-occlusion": Shaded 3D tetrahedron + intersecting foreground shield triangle
  const apex = vec3(0, 0.95, 0);
  const fLeft = vec3(-0.85, -0.65, 0.65);
  const fRight = vec3(0.85, -0.65, 0.65);
  const back = vec3(0, -0.65, -0.85);

  const nApex = vec3Normalize(vec3(0, 1, 0.1));
  const nLeft = vec3Normalize(vec3(-0.8, -0.2, 0.6));
  const nRight = vec3Normalize(vec3(0.8, -0.2, 0.6));
  const nBack = vec3Normalize(vec3(0, -0.2, -1));

  return [
    makeTri("pyr-front", "Pyramid Front Face", fLeft, fRight, apex, vec3(0.16, 0.42, 0.92), [
      nLeft,
      nRight,
      nApex,
    ]),
    makeTri("pyr-right", "Pyramid Right Face", fRight, back, apex, vec3(0.06, 0.62, 0.45), [
      nRight,
      nBack,
      nApex,
    ]),
    makeTri("pyr-left", "Pyramid Left Face", back, fLeft, apex, vec3(0.86, 0.5, 0.08), [
      nBack,
      nLeft,
      nApex,
    ]),
    makeTri("pyr-base", "Pyramid Base", fRight, fLeft, back, vec3(0.35, 0.4, 0.48)),
    makeTri(
      "occluder",
      "Foreground Wing",
      vec3(-1.05, -0.35, 0.95),
      vec3(0.25, -0.8, 0.95),
      vec3(-0.35, 0.55, 0.95),
      vec3(0.84, 0.2, 0.24)
    ),
  ];
}

// ============================================================================
// Rasterization Pipeline
// ============================================================================

export function quantizeDepth(z01: number, bits: 16 | 24): number {
  const clamped = Math.max(0, Math.min(1, z01));
  const levels = bits === 16 ? 65535 : 16777215;
  return Math.round(clamped * levels) / levels;
}

function projectVertex(
  v: Vertex3D,
  mvp: Mat4,
  width: number,
  height: number
): ProjectedVertex {
  const clip = mat4TransformVec4(mvp, {
    x: v.position.x,
    y: v.position.y,
    z: v.position.z,
    w: 1,
  });
  const safeW = Math.abs(clip.w) < 1e-6 ? 1e-6 : clip.w;
  const invW = 1 / safeW;
  const ndcX = clip.x * invW;
  const ndcY = clip.y * invW;
  const ndcZ = clip.z * invW;

  return {
    clip,
    ndc: { x: ndcX, y: ndcY, z: ndcZ },
    screenX: (ndcX * 0.5 + 0.5) * width,
    screenY: (1 - (ndcY * 0.5 + 0.5)) * height,
    invW,
    normal: vec3Normalize(v.normal),
    color: v.color,
    worldPos: v.position,
  };
}

function computePhongColor(
  baseColor: Vec3,
  normal: Vec3,
  worldPos: Vec3,
  eyePos: Vec3,
  lightDir: Vec3,
  ambient: number
): Vec3 {
  const n = vec3Normalize(normal);
  const l = vec3Normalize(lightDir);
  // Flip normal if facing away from viewer for double-sided shading
  const v = vec3Normalize(vec3Sub(eyePos, worldPos));
  const orientedN = vec3Dot(n, v) >= 0 ? n : vec3Scale(n, -1);

  const diff = Math.max(0, vec3Dot(orientedN, l));
  const h = vec3Normalize(vec3Add(l, v));
  const spec = Math.pow(Math.max(0, vec3Dot(orientedN, h)), 28) * 0.35;

  const shade = ambient + (1 - ambient) * diff;
  return {
    x: Math.min(1, baseColor.x * shade + spec),
    y: Math.min(1, baseColor.y * shade + spec),
    z: Math.min(1, baseColor.z * shade + spec),
  };
}

export function rasterizeScene(
  config: RasterizerConfig,
  customTriangles?: Triangle3D[]
): RasterizerResult {
  const width = Math.max(16, Math.floor(config.width));
  const height = Math.max(16, Math.floor(config.height));
  const totalPixels = width * height;

  const colorBuffer = new Uint8ClampedArray(totalPixels * 4);
  const depthBuffer = new Float64Array(totalPixels).fill(1.0);
  const quantizedDepthBuffer = new Float64Array(totalPixels).fill(1.0);
  const triangleIdBuffer = new Int32Array(totalPixels).fill(-1);
  const barycentricBuffer = new Float32Array(totalPixels * 3);
  const normalBuffer = new Float32Array(totalPixels * 3);

  // Neutral dark-slate / Swiss technical canvas background (#0f141c)
  for (let i = 0; i < totalPixels; i++) {
    const o = i * 4;
    colorBuffer[o] = 15;
    colorBuffer[o + 1] = 20;
    colorBuffer[o + 2] = 28;
    colorBuffer[o + 3] = 255;
  }

  const triangles =
    customTriangles ?? getSceneTriangles(config.sceneId, config.zOffset ?? 0.0025);
  const aspect = width / height;
  const mvpMatrix = buildMvpMatrix(config.camera, aspect);
  const eyePos = computeCameraEye(config.camera);
  const lightDir = vec3Normalize(config.lightDir ?? vec3(0.6, 0.85, 0.75));
  const ambient = config.ambient ?? 0.25;

  const projectedTriangles: ProjectedTriangle[] = triangles.map((tri) => {
    const pv0 = projectVertex(tri.v0, mvpMatrix, width, height);
    const pv1 = projectVertex(tri.v1, mvpMatrix, width, height);
    const pv2 = projectVertex(tri.v2, mvpMatrix, width, height);

    const culled =
      pv0.clip.w <= 0.0001 || pv1.clip.w <= 0.0001 || pv2.clip.w <= 0.0001;

    return {
      id: tri.id,
      label: tri.label,
      v0: pv0,
      v1: pv1,
      v2: pv2,
      culled,
    };
  });

  // Track depth buckets per triangle for Z-fighting analysis
  const levels = config.depthPrecisionBits === 16 ? 65535 : 16777215;
  const perPixelFrontAndRear = new Map<number, { frontQ: number; rearQ: number }>();

  let coveredPixels = 0;

  for (let triIdx = 0; triIdx < projectedTriangles.length; triIdx++) {
    const tri = projectedTriangles[triIdx];
    if (tri.culled) continue;

    const minX = Math.max(
      0,
      Math.floor(Math.min(tri.v0.screenX, tri.v1.screenX, tri.v2.screenX))
    );
    const maxX = Math.min(
      width - 1,
      Math.ceil(Math.max(tri.v0.screenX, tri.v1.screenX, tri.v2.screenX))
    );
    const minY = Math.max(
      0,
      Math.floor(Math.min(tri.v0.screenY, tri.v1.screenY, tri.v2.screenY))
    );
    const maxY = Math.min(
      height - 1,
      Math.ceil(Math.max(tri.v0.screenY, tri.v1.screenY, tri.v2.screenY))
    );

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const px = x + 0.5;
        const py = y + 0.5;
        const bary = computeBarycentric(
          tri.v0.screenX,
          tri.v0.screenY,
          tri.v1.screenX,
          tri.v1.screenY,
          tri.v2.screenX,
          tri.v2.screenY,
          px,
          py
        );
        if (!bary.inside) continue;

        const { w0, w1, w2 } = bary;
        // Perspective-correct interpolation factor
        const denomInvW =
          w0 * tri.v0.invW + w1 * tri.v1.invW + w2 * tri.v2.invW;
        const p0 = (w0 * tri.v0.invW) / denomInvW;
        const p1 = (w1 * tri.v1.invW) / denomInvW;
        const p2 = (w2 * tri.v2.invW) / denomInvW;

        const zNdc =
          w0 * tri.v0.ndc.z + w1 * tri.v1.ndc.z + w2 * tri.v2.ndc.z;
        const z01 = zNdc * 0.5 + 0.5;
        if (z01 < 0 || z01 > 1) continue;

        const qDepth = quantizeDepth(z01, config.depthPrecisionBits);
        const idx = y * width + x;

        if (config.sceneId === "z-fighting") {
          if (tri.id === "rear-a" || tri.id === "rear-b") {
            const entry = perPixelFrontAndRear.get(idx) ?? {
              frontQ: Number.NaN,
              rearQ: Number.NaN,
            };
            entry.rearQ = qDepth;
            perPixelFrontAndRear.set(idx, entry);
          } else if (tri.id === "front-cobalt") {
            const entry = perPixelFrontAndRear.get(idx) ?? {
              frontQ: Number.NaN,
              rearQ: Number.NaN,
            };
            entry.frontQ = qDepth;
            perPixelFrontAndRear.set(idx, entry);
          }
        }

        // Introduce realistic sub-pixel Z-fighting hash tie-break when two triangles
        // quantize to the exact same depth bucket
        const tieNoise = ((x * 73856093) ^ (y * 19349663) ^ (triIdx * 83492791)) & 1;
        const passesDepth = !config.depthTest
          ? true
          : qDepth < quantizedDepthBuffer[idx] ||
            (qDepth === quantizedDepthBuffer[idx] &&
              triangleIdBuffer[idx] !== -1 &&
              tieNoise === 1);

        if (!passesDepth) continue;

        const isEdge =
          Math.min(w0, w1, w2) < Math.max(0.015, 1.5 / Math.sqrt(Math.abs(bary.signedArea2)));

        if (config.wireframe && !isEdge) {
          continue;
        }

        if (triangleIdBuffer[idx] === -1) {
          coveredPixels++;
        }

        depthBuffer[idx] = z01;
        quantizedDepthBuffer[idx] = qDepth;
        triangleIdBuffer[idx] = triIdx;

        barycentricBuffer[idx * 3] = w0;
        barycentricBuffer[idx * 3 + 1] = w1;
        barycentricBuffer[idx * 3 + 2] = w2;

        const interpNormal = vec3Normalize({
          x:
            p0 * tri.v0.normal.x +
            p1 * tri.v1.normal.x +
            p2 * tri.v2.normal.x,
          y:
            p0 * tri.v0.normal.y +
            p1 * tri.v1.normal.y +
            p2 * tri.v2.normal.y,
          z:
            p0 * tri.v0.normal.z +
            p1 * tri.v1.normal.z +
            p2 * tri.v2.normal.z,
        });

        normalBuffer[idx * 3] = interpNormal.x;
        normalBuffer[idx * 3 + 1] = interpNormal.y;
        normalBuffer[idx * 3 + 2] = interpNormal.z;

        const baseColor: Vec3 = {
          x: p0 * tri.v0.color.x + p1 * tri.v1.color.x + p2 * tri.v2.color.x,
          y: p0 * tri.v0.color.y + p1 * tri.v1.color.y + p2 * tri.v2.color.y,
          z: p0 * tri.v0.color.z + p1 * tri.v1.color.z + p2 * tri.v2.color.z,
        };

        const worldPos: Vec3 = {
          x:
            p0 * tri.v0.worldPos.x +
            p1 * tri.v1.worldPos.x +
            p2 * tri.v2.worldPos.x,
          y:
            p0 * tri.v0.worldPos.y +
            p1 * tri.v1.worldPos.y +
            p2 * tri.v2.worldPos.y,
          z:
            p0 * tri.v0.worldPos.z +
            p1 * tri.v1.worldPos.z +
            p2 * tri.v2.worldPos.z,
        };

        let shaded = config.phongShading
          ? computePhongColor(
              baseColor,
              interpNormal,
              worldPos,
              eyePos,
              lightDir,
              ambient
            )
          : baseColor;

        if (config.wireframe) {
          shaded = {
            x: Math.min(1, shaded.x * 1.25 + 0.12),
            y: Math.min(1, shaded.y * 1.25 + 0.12),
            z: Math.min(1, shaded.z * 1.25 + 0.12),
          };
        }

        const cOff = idx * 4;
        colorBuffer[cOff] = Math.round(shaded.x * 255);
        colorBuffer[cOff + 1] = Math.round(shaded.y * 255);
        colorBuffer[cOff + 2] = Math.round(shaded.z * 255);
        colorBuffer[cOff + 3] = 255;
      }
    }
  }

  let zFightingOverlapPixels = 0;
  let minDepthSeparationSteps: number | null = null;

  for (const entry of perPixelFrontAndRear.values()) {
    if (!Number.isNaN(entry.frontQ) && !Number.isNaN(entry.rearQ)) {
      const steps = Math.round(Math.abs(entry.rearQ - entry.frontQ) * levels);
      if (minDepthSeparationSteps === null || steps < minDepthSeparationSteps) {
        minDepthSeparationSteps = steps;
      }
      if (steps <= 1) {
        zFightingOverlapPixels++;
      }
    }
  }

  return {
    width,
    height,
    colorBuffer,
    depthBuffer,
    quantizedDepthBuffer,
    triangleIdBuffer,
    barycentricBuffer,
    normalBuffer,
    projectedTriangles,
    mvpMatrix,
    coveredPixels,
    zFightingOverlapPixels,
    minDepthSeparationSteps,
  };
}

export function inspectPixel(
  result: RasterizerResult,
  x: number,
  y: number
): PixelInspection {
  const cx = Math.max(0, Math.min(result.width - 1, Math.floor(x)));
  const cy = Math.max(0, Math.min(result.height - 1, Math.floor(y)));
  const idx = cy * result.width + cx;
  const triIdx = result.triangleIdBuffer[idx];
  const cOff = idx * 4;
  const color: [number, number, number] = [
    result.colorBuffer[cOff],
    result.colorBuffer[cOff + 1],
    result.colorBuffer[cOff + 2],
  ];

  if (triIdx < 0) {
    return {
      x: cx,
      y: cy,
      covered: false,
      triangleId: null,
      triangleLabel: null,
      barycentric: null,
      depth: 1,
      quantizedDepth: 1,
      color,
      normal: null,
    };
  }

  const tri = result.projectedTriangles[triIdx];
  return {
    x: cx,
    y: cy,
    covered: true,
    triangleId: tri.id,
    triangleLabel: tri.label,
    barycentric: [
      result.barycentricBuffer[idx * 3],
      result.barycentricBuffer[idx * 3 + 1],
      result.barycentricBuffer[idx * 3 + 2],
    ],
    depth: result.depthBuffer[idx],
    quantizedDepth: result.quantizedDepthBuffer[idx],
    color,
    normal: {
      x: result.normalBuffer[idx * 3],
      y: result.normalBuffer[idx * 3 + 1],
      z: result.normalBuffer[idx * 3 + 2],
    },
  };
}
