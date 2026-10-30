// Cross-section diorama of the three rig types: jack-up, fixed platform, semi-submersible.
import * as THREE from 'three';
import { Builder, roundRectShape, extrudeUp } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { rockTex } from '../engine/textures.js';
import { lerp } from '../engine/util.js';

export function makePlatform(B, m, x0, seabed, topY = 22) {
  // 4-leg jacket from seabed to topY, topsides above
  const legs = [[-14, -14], [14, -14], [14, 14], [-14, 14]];
  const baseS = 1.9;
  const lv = 6;
  for (let i = 0; i < lv; i++) {
    const y0 = lerp(seabed, topY, i / lv), y1 = lerp(seabed, topY, (i + 1) / lv);
    const s0 = lerp(baseS, 1, i / lv), s1 = lerp(baseS, 1, (i + 1) / lv);
    for (let k = 0; k < 4; k++) {
      const a = legs[k], b = legs[(k + 1) % 4];
      B.pipe([x0 + a[0] * s0, y0, a[1] * s0], [x0 + a[0] * s1, y1, a[1] * s1], 1.1, m.yellow, 10);
      B.pipe([x0 + a[0] * s1, y1, a[1] * s1], [x0 + b[0] * s1, y1, b[1] * s1], 0.5, m.yellow, 8);
      B.pipe([x0 + a[0] * s0, y0, a[1] * s0], [x0 + b[0] * s1, y1, b[1] * s1], 0.4, m.yellow, 8);
    }
  }
  // topsides
  B.boxMM([x0 - 26, topY, -20], [x0 + 26, topY + 9, 20], m.grey);
  B.boxMM([x0 - 26, topY + 9, -20], [x0 + 6, topY + 18, 20], m.white);
  B.boxMM([x0 + 6, topY + 9, -20], [x0 + 26, topY + 26, 2], m.windows);
  B.cyl(11, 1, m.dark, [x0 + 16, topY + 26.5, -9], [0, 0, 0], 8);
  // derrick on top
  for (let i = 0; i < 6; i++) {
    const y0 = topY + 18 + i * 7, y1 = y0 + 7, s0 = lerp(6, 2.5, i / 6), s1 = lerp(6, 2.5, (i + 1) / 6);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.beam([x0 - 12 + sx * s0, y0, 6 + sz * s0], [x0 - 12 + sx * s1, y1, 6 + sz * s1], 0.4, m.white);
    for (const sz of [-1, 1]) B.beam([x0 - 12 - s1, y1, 6 + sz * s1], [x0 - 12 + s1, y1, 6 + sz * s1], 0.25, m.white);
  }
  // flare boom
  B.truss([x0 + 20, topY + 10, 18], [x0 + 55, topY + 34, 40], 1.6, 1.6, 2.4, m.whiteClean, 0.2, 0.08);
}

export function makeJackup(B, m, x0, seabed, hullY = 26) {
  // triangular hull with 3 lattice legs, cantilevered derrick
  const legPts = [[-26, -24], [-26, 24], [30, 0]];
  const sh = new THREE.Shape();
  sh.moveTo(-34, -32); sh.lineTo(-34, 32); sh.lineTo(28, 22); sh.lineTo(42, 0); sh.lineTo(28, -22); sh.lineTo(-34, -32);
  B.geo(extrudeUp(sh, 8, 0.4), m.grey, [x0, hullY, 0]);
  B.boxMM([x0 - 12, hullY + 8, -18], [x0 + 22, hullY + 20, 18], m.windows);
  B.cyl(10, 0.8, m.dark, [x0 + 30, hullY + 9, 0], [0, 0, 0], 8);
  const legTop = hullY + 70;
  for (const [lx, lz] of legPts) {
    const x = x0 + lx, z = lz;
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2;
      B.beam([x + Math.cos(a) * 3.5, seabed + 3, z + Math.sin(a) * 3.5], [x + Math.cos(a) * 3.5, legTop, z + Math.sin(a) * 3.5], 0.7, m.yellow);
    }
    for (let y = seabed + 3; y < legTop; y += 4) {
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2, b = ((k + 1) / 3) * Math.PI * 2;
        B.beam([x + Math.cos(a) * 3.5, y, z + Math.sin(a) * 3.5], [x + Math.cos(b) * 3.5, y + 4, z + Math.sin(b) * 3.5], 0.22, m.yellow);
      }
    }
    B.cyl(9, 3, m.dark, [x, seabed + 1.5, z], [0, 0, 0], 16, 5);   // spud can
  }
  // cantilever + derrick at the stern (-x)
  B.boxMM([x0 - 50, hullY + 8, -9], [x0 - 26, hullY + 13, 9], m.yellowClean);
  for (let i = 0; i < 6; i++) {
    const y0 = hullY + 13 + i * 7, y1 = y0 + 7, s0 = lerp(6, 2.4, i / 6), s1 = lerp(6, 2.4, (i + 1) / 6);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) B.beam([x0 - 44 + sx * s0, y0, sz * s0], [x0 - 44 + sx * s1, y1, sz * s1], 0.4, m.white);
    for (const sz of [-1, 1]) B.beam([x0 - 44 - s1, y1, sz * s1], [x0 - 44 + s1, y1, sz * s1], 0.25, m.white);
  }
}

export function createRigTypes(rigRoot) {
  const m = materials();
  const g = new THREE.Group();
  const B = new Builder();
  // seabed profile: shallow (left) to deep (right)
  const prof = (x) => {
    if (x < -250) return -85;
    if (x < 150) return lerp(-85, -140, (x + 250) / 400);
    return lerp(-140, -330, Math.min(1, (x - 150) / 260));
  };
  // ground block with strata front face (z = +60 cut)
  const xs = [];
  for (let x = -900; x <= 1400; x += 20) xs.push(x);
  const shape = new THREE.Shape();
  shape.moveTo(-900, -520);
  for (const x of xs) shape.lineTo(x, prof(x));
  shape.lineTo(1400, -520);
  const groundGeo = new THREE.ExtrudeGeometry(shape, { depth: 360, bevelEnabled: false, curveSegments: 1 });
  groundGeo.translate(0, 0, -300);
  const strata = rockTex('#9a8262', '#5a4834', { seed: 41, layered: 0.75, grain: 0.2 });
  strata.repeat.set(0.004, 0.012);
  const groundMat = new THREE.MeshStandardMaterial({ map: strata, roughness: 0.95 });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.receiveShadow = true;
  g.add(ground);
  // water volume front face (translucent gradient) and surface
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying vec3 vW; void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`varying vec3 vW; void main(){ float d = clamp(-vW.y / 340.0, 0.0, 1.0);
      vec3 c = mix(vec3(0.03, 0.2, 0.3), vec3(0.0, 0.03, 0.07), pow(d, 0.6));
      gl_FragColor = vec4(c, mix(0.5, 0.85, d));
      #include <colorspace_fragment>
    }`,
  });
  const wshape = new THREE.Shape();
  wshape.moveTo(-900, 0);
  for (const x of xs) wshape.lineTo(x, prof(x));
  wshape.lineTo(1400, 0);
  const front = new THREE.Mesh(new THREE.ShapeGeometry(wshape), waterMat);
  front.position.z = 60;
  front.renderOrder = 2;
  g.add(front);
  const back = new THREE.Mesh(new THREE.ShapeGeometry(wshape), waterMat);
  back.position.z = -300;
  g.add(back);
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(2300, 360), new THREE.MeshStandardMaterial({ color: '#06202c', roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.92 }));
  surf.rotation.x = -Math.PI / 2;
  surf.position.set(250, 0, -120);
  g.add(surf);
  // the three rigs
  makeJackup(B, m, -420, -85);
  makePlatform(B, m, -20, prof(-20));
  const built = B.build();
  g.add(built);
  // semi: a lightweight clone of the hero rig
  const semi = rigRoot.clone(true);
  semi.position.set(520, 0, -40);
  semi.rotation.y = Math.PI / 2;
  semi.scale.setScalar(1.0);
  g.add(semi);
  // mooring lines for the semi in this diorama
  const chainMat = new THREE.MeshStandardMaterial({ color: '#2a2724', roughness: 0.9 });
  for (const s of [-1, 1]) {
    const pts = [];
    for (let i = 0; i <= 30; i++) {
      const u = i / 30;
      const x = 520 + s * (40 + u * 330), y = -14 + (prof(x) + 14) * (1 - Math.pow(1 - u, 2.2));
      pts.push(new THREE.Vector3(x, Math.max(y, prof(x) + 1), 20));
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.8, 6), chainMat));
  }
  return { group: g, prof, semi };
}
