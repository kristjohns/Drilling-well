// Rain streaks in a box that follows the camera. Deterministic in time.
import * as THREE from 'three';
import { rng } from '../engine/util.js';

export function createRain(count = 7000, box = [70, 40, 70]) {
  const r = rng(99);
  const seeds = Array.from({ length: count }, () => [r(), r(), r(), 0.7 + r() * 0.6]);
  const pos = new Float32Array(count * 6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.LineBasicMaterial({ color: 0xb8c4cc, transparent: true, opacity: 0.32, fog: true });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  const wind = new THREE.Vector3(-7, -26, 4);
  return {
    mesh: lines,
    update(t, cam, intensity = 1) {
      const c = cam.position;
      const [bx, by, bz] = box;
      for (let i = 0; i < count; i++) {
        const [sx, sy, sz, sp] = seeds[i];
        const fall = (t * sp * 1.0 + sy) % 1;
        const x = c.x + (sx - 0.5) * bx + wind.x * fall * 1.2;
        const y = c.y + by / 2 - fall * by;
        const z = c.z + (sz - 0.5) * bz + wind.z * fall * 1.2;
        const k = i * 6;
        pos[k] = x; pos[k + 1] = y; pos[k + 2] = z;
        pos[k + 3] = x + wind.x * 0.035; pos[k + 4] = y + wind.y * 0.035; pos[k + 5] = z + wind.z * 0.035;
      }
      geo.attributes.position.needsUpdate = true;
      mat.opacity = 0.32 * intensity;
    },
  };
}
