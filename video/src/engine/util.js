// Small math and animation helpers. Everything in the film is a pure function of time,
// so these never keep state.
import * as THREE from 'three';

export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const lerp = (a, b, t) => a + (b - a) * t;
export const remap = (x, a, b, c = 0, d = 1) => c + (d - c) * clamp((x - a) / (b - a));
export const smooth = (t) => t * t * (3 - 2 * t);
export const smoother = (t) => t * t * t * (t * (t * 6 - 15) + 10);
export const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t) => 1 - Math.pow(1 - t, 3);
export const easeIn = (t) => t * t * t;
export const sstep = (a, b, x) => smooth(clamp((x - a) / (b - a)));
/** Ease with a constant-velocity middle: accelerate over [0,r], cruise, decelerate over [1-r,1]. */
export const trap = (u, r = 0.2) => {
  const v = 1 / (1 - r);
  if (u < r) return (v * u * u) / (2 * r);
  if (u > 1 - r) return 1 - (v * (1 - u) * (1 - u)) / (2 * r);
  return v * (r / 2 + u - r);
};
/** 0 → 1 → 0 window: fades in over [a, a+f] and out over [b-f, b]. */
export const win = (x, a, b, f = 0.5) => Math.min(sstep(a, a + f, x), 1 - sstep(b - f, b, x));
export const deg = (d) => (d * Math.PI) / 180;

/** Deterministic PRNG (mulberry32). */
export function rng(seed = 1) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Cheap smooth 1D value noise, deterministic. */
export function noise1(x, seed = 0) {
  const h = (n) => {
    const s = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  const i = Math.floor(x), f = x - i;
  return lerp(h(i), h(i + 1), smooth(f)) * 2 - 1;
}

export const v3 = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
export const V = (a) => (a instanceof THREE.Vector3 ? a : new THREE.Vector3(a[0], a[1], a[2]));

/**
 * Keyframed camera move. keys: [[t, pos[3], target[3], fov?], ...] in shot-local seconds.
 * Positions are interpolated along Catmull-Rom splines with eased time between the first
 * and last key, so moves start and stop gently.
 */
export function camPath(keys, ease = (u) => trap(u, 0.22)) {
  const ts = keys.map((k) => k[0]);
  const pos = new THREE.CatmullRomCurve3(keys.map((k) => V(k[1])), false, 'centripetal');
  const tgt = new THREE.CatmullRomCurve3(keys.map((k) => V(k[2])), false, 'centripetal');
  const fovs = keys.map((k) => k[3] ?? null);
  const n = keys.length;
  return (t, cam) => {
    const t0 = ts[0], t1 = ts[n - 1];
    const u = ease(clamp((t - t0) / (t1 - t0 || 1)));
    // map eased global u to spline parameter, keeping per-key timing roughly proportional
    const tt = t0 + u * (t1 - t0);
    let i = 0;
    while (i < n - 2 && tt > ts[i + 1]) i++;
    const local = clamp((tt - ts[i]) / (ts[i + 1] - ts[i] || 1));
    const s = (i + local) / (n - 1);
    cam.position.copy(pos.getPoint(s));
    cam.lookAt(tgt.getPoint(s));
    const f0 = fovs[i], f1 = fovs[i + 1];
    if (f0 != null && f1 != null) cam.fov = lerp(f0, f1, local);
    else if (f0 != null) cam.fov = f0;
    cam.updateProjectionMatrix();
  };
}

/** Orbit helper: camera circles `center` at radius r and height h. */
export function orbit(cam, center, r, h, angle, fov) {
  const c = V(center);
  cam.position.set(c.x + Math.cos(angle) * r, c.y + h, c.z + Math.sin(angle) * r);
  cam.lookAt(c);
  if (fov) { cam.fov = fov; }
  cam.updateProjectionMatrix();
}

/** Merge a list of [geometry, matrix] into one BufferGeometry (non-indexed normals kept). */
export function mergeGeoms(list) {
  const geoms = list.map(([g, m]) => {
    let gg = g.index ? g.toNonIndexed() : g.clone();
    if (m) gg.applyMatrix4(m);
    // keep only position/normal/uv so differently built geometries merge
    for (const k of Object.keys(gg.attributes)) if (!['position', 'normal', 'uv'].includes(k)) gg.deleteAttribute(k);
    if (!gg.attributes.uv) gg.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(gg.attributes.position.count * 2), 2));
    return gg;
  });
  let count = 0;
  for (const g of geoms) count += g.attributes.position.count;
  const pos = new Float32Array(count * 3), nor = new Float32Array(count * 3), uv = new Float32Array(count * 2);
  let o = 0;
  for (const g of geoms) {
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    uv.set(g.attributes.uv.array, o * 2);
    o += g.attributes.position.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return out;
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
/** Matrix for a beam (unit box/cylinder along +Y, centered) spanning a→b with given thickness. */
export function beamMatrix(a, b, tx, tz = tx) {
  const A = V(a), B = V(b);
  const d = new THREE.Vector3().subVectors(B, A);
  const len = d.length();
  _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  _p.addVectors(A, B).multiplyScalar(0.5);
  _s.set(tx, len, tz);
  return new THREE.Matrix4().compose(_p.clone(), _q.clone(), _s.clone());
}

export function mat4(pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) {
  return _m.clone().compose(V(pos), new THREE.Quaternion().setFromEuler(new THREE.Euler(rot[0], rot[1], rot[2])), V(scl));
}

/** Instanced beams from a list of [a, b, thickness]. */
export function beams(list, material, round = false) {
  const geo = round ? new THREE.CylinderGeometry(0.5, 0.5, 1, 8, 1) : new THREE.BoxGeometry(1, 1, 1);
  const mesh = new THREE.InstancedMesh(geo, material, list.length);
  list.forEach(([a, b, t], i) => mesh.setMatrixAt(i, beamMatrix(a, b, t, t)));
  mesh.instanceMatrix.needsUpdate = true;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}
