import * as THREE from "three";
import type { Fn } from "./functions";

const SEG_U = 104; // samples along the x-axis
const SEG_V = 48; // samples around the revolution / across the extrusion
const EXTRUDE_DEPTH = 1.4; // half-width of the extruded ribbon along z

/**
 * A single transform (center + uniform scale) that fits a cloud of points into
 * a ~2-unit box centered at the origin. We derive it from the revolution pose
 * and reuse it for the extrusion pose so the morph stays put.
 */
function fitTransform(points: number[]) {
  const min = [Infinity, Infinity, Infinity];
  const max = [-Infinity, -Infinity, -Infinity];
  for (let i = 0; i < points.length; i += 3) {
    for (let k = 0; k < 3; k++) {
      const v = points[i + k];
      if (v < min[k]) min[k] = v;
      if (v > max[k]) max[k] = v;
    }
  }
  const center = min.map((m, k) => (m + max[k]) / 2);
  const size = Math.max(max[0] - min[0], max[1] - min[1], max[2] - min[2]) || 1;
  const scale = 2 / size;
  return { center, scale };
}

export type FitTransform = { center: number[]; scale: number };

function applyTransform(points: number[] | Float32Array, t: FitTransform) {
  for (let i = 0; i < points.length; i += 3) {
    points[i] = (points[i] - t.center[0]) * t.scale;
    points[i + 1] = (points[i + 1] - t.center[1]) * t.scale;
    points[i + 2] = (points[i + 2] - t.center[2]) * t.scale;
  }
}

/** Transform a single point in place with a fit transform. */
export function transformPoint(v: THREE.Vector3, t: FitTransform) {
  v.set((v.x - t.center[0]) * t.scale, (v.y - t.center[1]) * t.scale, (v.z - t.center[2]) * t.scale);
  return v;
}

/** Surface point in the *revolution* pose, before fitting. Exported for the particle. */
export function revolutionPoint(fn: Fn, u: number, v: number, out = new THREE.Vector3()) {
  const [a, b] = fn.domain;
  const x = a + (b - a) * u;
  const r = fn.f(x);
  const ang = v * Math.PI * 2;
  return out.set(x, r * Math.cos(ang), r * Math.sin(ang));
}

/** Surface point in the *extrusion* pose, before fitting. */
export function extrusionPoint(fn: Fn, u: number, v: number, out = new THREE.Vector3()) {
  const [a, b] = fn.domain;
  const x = a + (b - a) * u;
  const r = fn.f(x);
  const z = (v - 0.5) * 2 * EXTRUDE_DEPTH;
  return out.set(x, r, z);
}

/**
 * Builds a geometry whose base pose is the solid of revolution and whose single
 * morph target is the extruded ribbon. Both share the (SEG_U × SEG_V) grid so
 * `morphTargetInfluences[0]` blends smoothly between the two.
 */
export function buildSolid(fn: Fn): { geometry: THREE.BufferGeometry; transform: FitTransform } {
  const cols = SEG_U + 1;
  const rows = SEG_V + 1;
  const count = cols * rows;

  const rev = new Float32Array(count * 3);
  const ext = new Float32Array(count * 3);
  const uv = new Float32Array(count * 2);
  const tmp = new THREE.Vector3();

  let p = 0;
  let q = 0;
  for (let iu = 0; iu < cols; iu++) {
    const u = iu / SEG_U;
    for (let iv = 0; iv < rows; iv++) {
      const v = iv / SEG_V;
      revolutionPoint(fn, u, v, tmp);
      rev[p] = tmp.x; rev[p + 1] = tmp.y; rev[p + 2] = tmp.z;
      extrusionPoint(fn, u, v, tmp);
      ext[p] = tmp.x; ext[p + 1] = tmp.y; ext[p + 2] = tmp.z;
      uv[q] = u; uv[q + 1] = v;
      p += 3; q += 2;
    }
  }

  // Fit both poses with the revolution's transform so the morph is centered.
  const t = fitTransform(Array.from(rev));
  applyTransform(rev, t);
  applyTransform(ext, t);

  const indices: number[] = [];
  for (let iu = 0; iu < SEG_U; iu++) {
    for (let iv = 0; iv < SEG_V; iv++) {
      const aIdx = iu * rows + iv;
      const bIdx = aIdx + rows;
      const cIdx = aIdx + 1;
      const dIdx = bIdx + 1;
      indices.push(aIdx, bIdx, cIdx, cIdx, bIdx, dIdx);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(rev, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const baseNormals = (geo.getAttribute("normal") as THREE.BufferAttribute).clone();

  // Morph target = extrusion. Recompute its normals on a throwaway geometry.
  const extGeo = new THREE.BufferGeometry();
  extGeo.setAttribute("position", new THREE.BufferAttribute(ext, 3));
  extGeo.setIndex(indices);
  extGeo.computeVertexNormals();
  const extNormals = extGeo.getAttribute("normal") as THREE.BufferAttribute;

  geo.morphAttributes.position = [new THREE.BufferAttribute(ext, 3)];
  geo.morphAttributes.normal = [extNormals];
  // morphAttributes hold *absolute* positions here; tell three to treat them so.
  geo.morphTargetsRelative = false;
  void baseNormals;

  return { geometry: geo, transform: t };
}

const _rev = new THREE.Vector3();
const _ext = new THREE.Vector3();

/**
 * A point on the morphing surface in fitted (render) space, blending the
 * revolution and extrusion poses by `m` (0 = revolution, 1 = extrusion).
 * Used to make the spiral particle ride the same surface the mesh shows.
 */
export function surfacePoint(
  fn: Fn,
  t: FitTransform,
  u: number,
  v: number,
  m: number,
  out = new THREE.Vector3(),
) {
  transformPoint(revolutionPoint(fn, u, v, _rev), t);
  transformPoint(extrusionPoint(fn, u, v, _ext), t);
  return out.copy(_rev).lerp(_ext, m);
}

export { SEG_U, SEG_V };
