// Helpers shared by shot definitions.
import * as THREE from 'three';
import { floaterMotion, waterHeight } from '../world/ocean.js';

/** Standard per-frame rig update on the ocean: gentle floater motion + column foam. */
export function rigOnOcean(W, t, scale = 1) {
  const { heave, pitch, roll } = floaterMotion(t, scale);
  W.rig.setMotion(heave, pitch, roll);
  W.ocean.setColumns(W.rig.worldColumns());
}

/** Keep the camera above the waves at its xz position. */
export function aboveWater(cam, t, clearance = 3) {
  const h = waterHeight(cam.position.x, cam.position.z, t);
  if (cam.position.y < h + clearance) cam.position.y = h + clearance;
}

/** Narration line timing helpers (shot-local). */
export const L = (info, i) => info.lines[Math.min(i, info.lines.length - 1)];
export const lineStart = (info, i) => L(info, i).start;
export const lineEnd = (info, i) => L(info, i).start + L(info, i).dur;

/** Fade from/to black at the very start/end of a shot. */
export function fades(W, t, info, fin = 0, fout = 0) {
  let f = 0;
  if (fin > 0) f = Math.max(f, 1 - Math.min(1, t / fin));
  if (fout > 0) f = Math.max(f, 1 - Math.min(1, (info.dur - t) / fout));
  W.post.grade.uniforms.uFade.value = f;
}

export const v = (x, y, z) => new THREE.Vector3(x, y, z);

/** Remember the above-water lighting set by envOcean so shots can flip under/over water per frame. */
export function captureAbove(W) {
  W._above = {
    fog: W.scene.fog, bg: W.scene.background, exp: W.renderer.toneMappingExposure, envI: W.scene.environmentIntensity,
    sunI: W.lights.sun.intensity, sunC: W.lights.sun.color.clone(),
    hemiI: W.lights.hemi.intensity, hemiC: W.lights.hemi.color.clone(), hemiG: W.lights.hemi.groundColor.clone(),
  };
}

/** Switch lighting/fog depending on whether the camera is below the surface. Returns true if underwater. */
export function waterSwitch(W, t, opts = {}) {
  const c = W.camera.position;
  const under = c.y < waterHeight(c.x, c.z, t) - 0.3;
  if (W.sets.sky) W.sets.sky.visible = !under;
  if (under) W.envUnder(opts);
  else if (W._above) {
    const a = W._above;
    W.scene.fog = a.fog; W.scene.background = a.bg; W.renderer.toneMappingExposure = a.exp; W.scene.environmentIntensity = a.envI;
    W.lights.sun.intensity = a.sunI; W.lights.sun.color.copy(a.sunC);
    W.lights.hemi.intensity = a.hemiI; W.lights.hemi.color.copy(a.hemiC); W.lights.hemi.groundColor.copy(a.hemiG);
  }
  return under;
}
