// Geometry builder: collects primitives per material and merges them into a few meshes.
import * as THREE from 'three';
import { mergeGeoms, mat4, beamMatrix, V } from './util.js';

const _box = new THREE.BoxGeometry(1, 1, 1);
const _cyl = {};
function cylGeo(seg) { return (_cyl[seg] ||= new THREE.CylinderGeometry(0.5, 0.5, 1, seg, 1)); }

export function roundRectShape(w, d, r) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Extrude a shape (in XZ plane) upward along +Y by h. */
export function extrudeUp(shape, h, bevel = 0.3, curveSegments = 8) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: h, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments,
  });
  g.rotateX(-Math.PI / 2);
  return g;
}

export class Builder {
  constructor() { this.parts = new Map(); }

  add(geo, mat, matrix) {
    if (!this.parts.has(mat)) this.parts.set(mat, []);
    this.parts.get(mat).push([geo, matrix || null]);
    return this;
  }

  box(w, h, d, mat, pos = [0, 0, 0], rot = [0, 0, 0]) {
    return this.add(_box, mat, mat4(pos, rot, [w, h, d]));
  }

  /** Box spanning min..max corners. */
  boxMM(min, max, mat) {
    const w = max[0] - min[0], h = max[1] - min[1], d = max[2] - min[2];
    return this.box(w, h, d, mat, [min[0] + w / 2, min[1] + h / 2, min[2] + d / 2]);
  }

  cyl(r, h, mat, pos = [0, 0, 0], rot = [0, 0, 0], seg = 16, rTop) {
    if (rTop !== undefined) {
      const g = new THREE.CylinderGeometry(rTop, r, h, seg, 1);
      return this.add(g, mat, mat4(pos, rot));
    }
    return this.add(cylGeo(seg), mat, mat4(pos, rot, [r * 2, h, r * 2]));
  }

  /** Square beam from a to b. */
  beam(a, b, t, mat) { return this.add(_box, mat, beamMatrix(a, b, t, t)); }

  /** Round pipe from a to b. */
  pipe(a, b, r, mat, seg = 10) { return this.add(cylGeo(seg), mat, beamMatrix(a, b, r * 2, r * 2)); }

  sphere(r, mat, pos, seg = 12) {
    return this.add(new THREE.SphereGeometry(1, seg, Math.max(6, seg / 2)), mat, mat4(pos, [0, 0, 0], [r, r, r]));
  }

  geo(g, mat, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) { return this.add(g, mat, mat4(pos, rot, scl)); }

  /** Box truss between a and b with rectangular section (w across, h up), panel length p. */
  truss(a, b, w, h, p, mat, chord = 0.3, web = 0.14, upHint = [0, 1, 0]) {
    const A = V(a), B = V(b);
    const dir = new THREE.Vector3().subVectors(B, A);
    const len = dir.length(); dir.normalize();
    let up = V(upHint).clone();
    if (Math.abs(up.dot(dir)) > 0.95) up = new THREE.Vector3(1, 0, 0);
    const side = new THREE.Vector3().crossVectors(dir, up).normalize();
    up = new THREE.Vector3().crossVectors(side, dir).normalize();
    const corner = (s, u, along) => A.clone().addScaledVector(dir, along).addScaledVector(side, s * w / 2).addScaledVector(up, u * h / 2);
    const cs = [[-1, -1], [1, -1], [1, 1], [-1, 1]];
    for (const [s, u] of cs) this.beam(corner(s, u, 0), corner(s, u, len), chord, mat);
    const n = Math.max(1, Math.round(len / p));
    for (let i = 0; i <= n; i++) {
      const t0 = (i / n) * len;
      for (let k = 0; k < 4; k++) this.beam(corner(...cs[k], t0), corner(...cs[(k + 1) % 4], t0), web, mat);
      if (i < n) {
        const t1 = ((i + 1) / n) * len;
        for (let k = 0; k < 4; k++) {
          const c0 = cs[k], c1 = cs[(k + 1) % 4];
          if (i % 2 === 0) this.beam(corner(...c0, t0), corner(...c1, t1), web, mat);
          else this.beam(corner(...c1, t0), corner(...c0, t1), web, mat);
        }
      }
    }
    return this;
  }

  /** Merge everything into meshes under `group`. */
  build(group = new THREE.Group(), { cast = true, receive = true } = {}) {
    for (const [mat, list] of this.parts) {
      const geo = mergeGeoms(list);
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = cast;
      mesh.receiveShadow = receive;
      group.add(mesh);
    }
    this.parts.clear();
    return group;
  }
}
