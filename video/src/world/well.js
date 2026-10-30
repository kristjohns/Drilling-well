// Well schematic: a cut-away block of the earth under the seabed (1 unit = 10 m vertically,
// radii exaggerated so casing strings are readable). The front face is drawn by one
// parametric shader (strata, hole sections, casing, cement, drill string, mud flow,
// cuttings, gas kick, barrier envelopes, completion). A BOP, riser and rig sit on top.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { noiseTex } from '../engine/textures.js';

// radius (units) from diameter in inches
export const rIn = (d) => (d / 2) * 0.38;

// Sections: hole size, casing OD/ID, bottom depth (units below seabed), cement top depth
export const SECTIONS = [
  { name: '36″ hole · 30″ conductor', hole: rIn(36), od: rIn(30), id: rIn(28), bottom: 9, cemTop: 0 },
  { name: '26″ hole · 20″ casing', hole: rIn(26), od: rIn(20), id: rIn(18.7), bottom: 55, cemTop: 0 },
  { name: '17½″ hole · 13⅜″ casing', hole: rIn(17.5), od: rIn(13.375), id: rIn(12.4), bottom: 150, cemTop: 95 },
  { name: '12¼″ hole · 9⅝″ casing', hole: rIn(12.25), od: rIn(9.625), id: rIn(8.7), bottom: 252, cemTop: 200 },
  { name: '8½″ hole · 7″ liner', hole: rIn(8.5), od: rIn(7.0), id: rIn(6.1), bottom: 298, cemTop: 240, liner: 242 },
];
export const TD = 298;

const FRAG = /* glsl */`
uniform float uTime, uHoleDepth, uStringDepth, uFlow, uKick, uKickH, uPrimary, uSecondary, uMudHeavy, uCompletion, uCuttings, uShowPipe, uFormP;
uniform vec4 uSecA[5];   // hole radius, bottom depth, casing OD, casing ID
uniform vec4 uSecB[5];   // shoe depth (animated run), casing top depth, cement top, cement progress
uniform float uSecOn[5]; // section drilled? (0/1)
uniform sampler2D uNoise;
varying vec3 vP;

float hash(vec2 p) { p = fract(p * vec2(234.34, 435.345)); p += dot(p, p + 34.23); return fract(p.x * p.y); }

vec3 strata(float d, float x) {
  float n = texture2D(uNoise, vec2(x * 0.013, d * 0.02)).r;
  float n2 = texture2D(uNoise, vec2(x * 0.09, d * 0.15)).r;
  float w = sin(x * 0.045) * 2.5 + n * 5.0;
  float dd = d + w;
  vec3 c;
  if (dd < 6.0) c = vec3(0.55, 0.48, 0.37);
  else if (dd < 45.0) c = vec3(0.43, 0.41, 0.35);
  else if (dd < 90.0) c = mix(vec3(0.63, 0.55, 0.40), vec3(0.5, 0.47, 0.4), step(0.5, fract(dd * 0.08)));
  else if (dd < 150.0) c = vec3(0.37, 0.38, 0.36);
  else if (dd < 200.0) c = vec3(0.28, 0.27, 0.26);
  else if (dd < 235.0) c = vec3(0.80, 0.78, 0.70);
  else if (dd < 252.0) c = vec3(0.2, 0.19, 0.18);
  else if (dd < 292.0) { c = vec3(0.66, 0.52, 0.29); c = mix(c, vec3(0.42, 0.3, 0.16), smoothstep(0.5, 0.8, n2) * 0.6); }
  else c = vec3(0.42, 0.47, 0.52);
  c *= 0.82 + 0.3 * n2;
  // thin bedding lines
  c *= 1.0 - 0.12 * smoothstep(0.9, 1.0, sin(dd * 1.7) * 0.5 + 0.5);
  return c;
}

void main() {
  float x = vP.x, d = -vP.y;            // d = depth below seabed (units)
  float ax = abs(x);
  vec3 col = strata(d, x);
  // which hole section contains this depth?
  float holeR = 0.0;
  float prev = 0.0;
  for (int i = 0; i < 5; i++) {
    if (uSecOn[i] > 0.5 && d >= prev && d <= uSecA[i].y) holeR = uSecA[i].x;
    prev = uSecA[i].y;
  }
  if (d > uHoleDepth) holeR = 0.0;
  bool inHole = ax < holeR && d >= 0.0;
  float edge = 0.0;
  vec3 mud = mix(vec3(0.45, 0.29, 0.15), vec3(0.3, 0.2, 0.26), uMudHeavy);
  if (inHole) {
    col = mud;
    // primary barrier: the mud column
    bool isMud = true;
    float outer = holeR;
    bool steel = false, cement = false;
    for (int i = 0; i < 5; i++) {
      vec4 A = uSecA[i]; vec4 Bv = uSecB[i];
      float od = A.z, id = A.w, shoe = Bv.x, top = Bv.y;
      if (shoe <= top) continue;
      if (d >= top && d <= shoe) {
        if (ax >= id && ax <= od) { col = vec3(0.78, 0.81, 0.84) * (0.55 + 0.45 * smoothstep(0.0, 0.07, min(ax - id, od - ax))); steel = true; isMud = false; }
        // cement between this casing and the next outer boundary
        float cTop = mix(shoe, Bv.z, Bv.w);
        if (ax > od && ax < outer && d >= cTop && d <= shoe && Bv.w > 0.0) {
          float g = texture2D(uNoise, vec2(x * 0.3, d * 0.3)).r;
          col = vec3(0.9, 0.9, 0.86) * (0.82 + 0.2 * g); cement = true; isMud = false;
        }
        if (ax < od) outer = id;
      }
    }
    // drill string / BHA / bit
    if (uShowPipe > 0.5 && d <= uStringDepth && d >= -40.0) {
      float pod = ${rIn(5.5).toFixed(3)}, pid = ${rIn(4.3).toFixed(3)};
      float bha = uStringDepth - 18.0;
      if (d > bha) { pod = holeR * 0.62; pid = ${rIn(3).toFixed(3)}; }
      if (d > uStringDepth - 1.2) { pod = holeR * 0.97; pid = 0.0; }
      if (ax >= pid && ax <= pod) {
        col = vec3(0.7, 0.73, 0.76) * (0.55 + 0.45 * smoothstep(0.0, 0.08, min(ax - pid, pod - ax)));
        if (d > uStringDepth - 1.2) col = mix(vec3(0.3, 0.3, 0.32), vec3(0.95, 0.95, 1.0), step(0.6, fract(x * 3.0 + d * 2.0)));
        isMud = false; steel = false;
      }
      // flow streaks: down inside the pipe, up in the annulus
      if (isMud) {
        float dir = ax < pid ? 1.0 : -1.0;
        float s = fract((d - dir * uTime * 6.0 * uFlow) * 0.35 + hash(vec2(floor(x * 3.0), 1.0)));
        col += vec3(0.08, 0.05, 0.02) * smoothstep(0.0, 0.2, s) * smoothstep(0.6, 0.2, s) * uFlow;
        // cuttings in the annulus
        if (ax > pod && uCuttings > 0.0) {
          vec2 cell = vec2(floor(x * 4.0), floor((d + uTime * 7.0 * uFlow) * 1.5));
          float h = hash(cell);
          vec2 f = fract(vec2(x * 4.0, (d + uTime * 7.0 * uFlow) * 1.5)) - 0.5;
          if (h > 0.72 && length(f) < 0.22) col = mix(col, vec3(0.16, 0.15, 0.14), uCuttings);
        }
      }
    }
    // completion: production tubing + packer + sand screens
    if (uCompletion > 0.0 && d >= 0.0) {
      float tOD = ${rIn(5.5).toFixed(3)}, tID = ${rIn(4.6).toFixed(3)};
      if (d <= 246.0 && ax >= tID && ax <= tOD && d <= 300.0 * uCompletion) { col = vec3(0.7, 0.72, 0.75); isMud = false; }
      if (d > 243.0 && d < 246.0 && ax > tOD && ax < ${rIn(8.7).toFixed(3)} && uCompletion > 0.8) { col = vec3(0.08, 0.08, 0.09); isMud = false; }
      if (d >= 252.0 && d <= 296.0 && ax >= ${rIn(5.5).toFixed(3)} && ax <= ${rIn(6.6).toFixed(3)} && uCompletion > 0.9) {
        col = vec3(0.65, 0.68, 0.7) * (0.7 + 0.3 * step(0.5, fract(d * 4.0))); isMud = false;
      }
      if (isMud && d > 250.0 && ax < tID) col = mix(col, vec3(0.15, 0.1, 0.05), 0.6 * uCompletion);   // oil in tubing
      if (d < 2.5 && ax < 0.45 && uCompletion > 0.0) col = vec3(0.92, 0.75, 0.2);                      // safety valve marker
    }
    // kick: gas bubbles rising in the annulus from the bottom
    if (uKick > 0.0 && isMud) {
      float bottom = uHoleDepth;
      float top = bottom - uKickH;
      if (d > top && d < bottom) {
        vec2 q = vec2(x * 3.2, (d + uTime * 3.0) * 2.0);
        vec2 cell = floor(q);
        vec2 f = fract(q) - 0.5;
        float h = hash(cell);
        float rr = 0.18 + 0.2 * (bottom - d) / max(uKickH, 1.0);
        if (h > 0.45 && length(f) < rr) col = mix(col, vec3(0.95, 0.92, 0.8), uKick);
        col = mix(col, vec3(0.9, 0.55, 0.2), 0.15 * uKick * smoothstep(top, top + 4.0, d));
      }
    }
    // barrier tints
    if (isMud) col = mix(col, vec3(0.15, 0.5, 1.0), 0.6 * uPrimary);
    if (steel || cement) col = mix(col, vec3(1.0, 0.18, 0.12), 0.6 * uSecondary);
    // outline at the hole wall
    edge = smoothstep(holeR - 0.12, holeR, ax);
    col *= 1.0 - 0.45 * edge;
  } else {
    // formation pressure glow (reservoir) for the kick shots
    if (d > 252.0 && d < 292.0) col += vec3(0.25, 0.12, 0.02) * uFormP * (0.6 + 0.4 * sin(uTime * 3.0 + x * 0.2));
  }
  // seabed line
  col *= 1.0 - 0.6 * smoothstep(0.4, 0.0, abs(d));
  gl_FragColor = vec4(pow(max(col, vec3(0.0)), vec3(2.2)), 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export function createWell(rigRoot) {
  const m = materials();
  const group = new THREE.Group();
  const W0 = 900, D = 345, Z = 60;
  const uniforms = {
    uTime: { value: 0 }, uHoleDepth: { value: 0 }, uStringDepth: { value: -100 }, uFlow: { value: 0 }, uKick: { value: 0 }, uKickH: { value: 0 },
    uPrimary: { value: 0 }, uSecondary: { value: 0 }, uMudHeavy: { value: 0 }, uCompletion: { value: 0 }, uCuttings: { value: 1 }, uShowPipe: { value: 1 }, uFormP: { value: 0 },
    uSecA: { value: SECTIONS.map((s) => new THREE.Vector4(s.hole, s.bottom, s.od, s.id)) },
    uSecB: { value: SECTIONS.map(() => new THREE.Vector4(0, 0, 0, 0)) },
    uSecOn: { value: SECTIONS.map(() => 0) },
    uNoise: { value: noiseTex({ size: 256, seed: 91, base: 8, octaves: 5 }) },
  };
  uniforms.uNoise.value.wrapS = uniforms.uNoise.value.wrapT = THREE.RepeatWrapping;
  const faceMat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: FRAG,
  });
  // front face (z = 0): a plane in local coordinates so vP.x / vP.y map to x / depth
  const faceGeo = new THREE.PlaneGeometry(W0, D, 1, 1);
  faceGeo.translate(0, -D / 2, 0);
  const face = new THREE.Mesh(faceGeo, faceMat);
  group.add(face);
  // other faces of the block: strata without the well
  const sideMat = faceMat.clone();
  sideMat.uniforms = THREE.UniformsUtils.clone(uniforms);
  sideMat.uniforms.uNoise.value = uniforms.uNoise.value;
  const side = new THREE.Mesh(new THREE.PlaneGeometry(Z, D).translate(0, -D / 2, 0), sideMat);
  side.rotation.y = Math.PI / 2;
  side.position.set(W0 / 2, 0, -Z / 2);
  group.add(side);
  const side2 = side.clone(); side2.rotation.y = -Math.PI / 2; side2.position.set(-W0 / 2, 0, -Z / 2);
  group.add(side2);
  // seabed top
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(W0, Z), new THREE.MeshStandardMaterial({ color: '#8a7b60', roughness: 1 }));
  sea.rotation.x = -Math.PI / 2; sea.position.set(0, 0.01, -Z / 2);
  sea.receiveShadow = true;
  group.add(sea);
  // water column above (translucent front + back)
  const waterMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: /* glsl */`varying float vY; void main(){ vY = position.y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`varying float vY; void main(){ float k = clamp(vY / 32.0, 0.0, 1.0); vec3 c = mix(vec3(0.0,0.05,0.09), vec3(0.05,0.25,0.33), k); gl_FragColor = vec4(c, 0.55 - 0.25 * k);
      #include <colorspace_fragment>
    }`,
  });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(W0, 32).translate(0, 16, 0), waterMat);
  water.renderOrder = 3;
  group.add(water);
  const waterBack = water.clone(); waterBack.position.z = -Z; group.add(waterBack);
  const surf = new THREE.Mesh(new THREE.PlaneGeometry(W0, Z), new THREE.MeshStandardMaterial({ color: '#0b3a4b', roughness: 0.2, transparent: true, opacity: 0.75 }));
  surf.rotation.x = -Math.PI / 2; surf.position.set(0, 32, -Z / 2);
  group.add(surf);

  // schematic BOP stack on the wellhead + riser to a miniature rig
  const bopB = new Builder();
  bopB.cyl(1.2, 1.2, m.dark, [0, 0.6, 0], [0, 0, 0], 24);
  for (let i = 0; i < 4; i++) {
    bopB.box(2.2, 0.75, 1.8, m.darkSteel, [0, 1.6 + i * 0.85, 0]);
    bopB.cyl(0.42, 3.8, m.yellowClean, [0, 1.6 + i * 0.85, 0], [0, 0, Math.PI / 2], 16);
  }
  bopB.sphere(1.25, m.grey, [0, 5.6, 0], 18);
  bopB.sphere(1.1, m.grey, [0, 6.8, 0], 18);
  bopB.cyl(0.6, 1.0, m.dark, [0, 7.9, 0], [0, 0, 0], 16);
  for (const [x, z] of [[-1.8, -1.4], [1.8, -1.4], [1.8, 1.4], [-1.8, 1.4]]) bopB.box(0.18, 8.2, 0.18, m.yellow, [x, 4.1, z]);
  const bop = bopB.build();
  bop.position.set(0, 0, -1.6);
  group.add(bop);
  const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1, 20), m.yellowClean);
  riser.position.set(0, 0, -1.6);
  group.add(riser);
  const string = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 1, 12), m.pipe);
  string.position.set(0, 0, -1.6);
  group.add(string);
  const miniRig = rigRoot.clone(true);
  miniRig.scale.setScalar(0.12);
  miniRig.position.set(0, 32, -1.6 - 6 * 0.12);
  group.add(miniRig);
  // subsea tree (completion) on the wellhead
  const treeB = new Builder();
  treeB.box(2.6, 2.2, 2.2, m.yellowClean, [0, 1.1, 0]);
  treeB.box(3.4, 0.6, 0.6, m.dark, [0, 1.4, 0]);
  treeB.cyl(0.4, 1.0, m.red, [0, 2.7, 0], [0, 0, 0], 12);
  const tree = treeB.build();
  tree.position.set(0, 0, -1.6);
  tree.visible = false;
  group.add(tree);

  const api = {
    group, uniforms, bop, riser, string, miniRig, tree, face,
    /** Set every element of the schematic for a frame. */
    set({ hole = 0, sections = [], string: strDepth = -100, flow = 0, cuttings = 1, kick = 0, kickH = 0, primary = 0, secondary = 0, heavy = 0, completion = 0,
      bopY = 0, showBop = true, showRiser = true, showPipe = true, formP = 0, time = 0 } = {}) {
      const u = uniforms;
      u.uTime.value = time; u.uHoleDepth.value = hole; u.uStringDepth.value = strDepth; u.uFlow.value = flow; u.uCuttings.value = cuttings;
      u.uKick.value = kick; u.uKickH.value = kickH; u.uPrimary.value = primary; u.uSecondary.value = secondary; u.uMudHeavy.value = heavy;
      u.uCompletion.value = completion; u.uShowPipe.value = showPipe ? 1 : 0; u.uFormP.value = formP;
      SECTIONS.forEach((s, i) => {
        const st = sections[i] || { drilled: 0, run: 0, cement: 0 };
        u.uSecOn.value[i] = st.drilled ? 1 : 0;
        const top = s.liner || 0;
        const shoe = top + (s.bottom - 1.0 - top) * (st.run ?? 0) + (st.run > 0 ? 0 : -1);
        u.uSecB.value[i].set(st.run > 0 ? Math.max(shoe, top + 0.5) : 0, st.run > 0 ? top : 1, s.cemTop, st.cement ?? 0);
      });
      bop.visible = showBop;
      bop.position.y = bopY;
      riser.visible = showRiser && showBop;
      const rTop = 32, rBot = bopY + 8.4;
      riser.scale.y = Math.max(0.01, rTop - rBot); riser.position.y = (rTop + rBot) / 2;
      // drill string above the seabed (riser or open water)
      string.visible = showPipe && strDepth > -50;
      const sTop = 32, sBot = 0;
      string.scale.y = sTop - sBot; string.position.y = (sTop + sBot) / 2;
    },
  };
  return api;
}

/** Well state at "time" k of a scripted construction sequence (0..1 per section). */
export function sectionStates(done, current = -1, drill = 0, run = 0, cement = 0) {
  return SECTIONS.map((s, i) => {
    if (i < done) return { drilled: 1, run: 1, cement: 1 };
    if (i === current) return { drilled: drill > 0 ? 1 : 0, run, cement };
    return { drilled: 0, run: 0, cement: 0 };
  });
}
