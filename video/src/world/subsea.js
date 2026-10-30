// Subsea set: seabed, wellhead, BOP stack, ROV, marine snow, light shafts, fish.
// The BOP sits under the rig's main well centre at the seabed (y = -320).
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { sandTex, sandBump, noiseTex, fbmField } from '../engine/textures.js';
import { rng, mat4 } from '../engine/util.js';

export const SEABED_Y = -320;

function makeBOP(m) {
  // Local origin: wellhead datum at the seabed. Height ~13.5 m.
  const B = new Builder();
  const frameY = (y) => y;
  // guide base and conductor/wellhead
  B.boxMM([-2.8, -0.2, -2.8], [2.8, 0.4, 2.8], m.dark);
  B.cyl(0.55, 1.6, m.darkSteel, [0, 0.8, 0], [0, 0, 0], 24);
  B.cyl(0.42, 0.8, m.steel, [0, 1.9, 0], [0, 0, 0], 24);
  // wellhead connector
  B.cyl(1.05, 1.3, m.dark, [0, 2.75, 0], [0, 0, 0], 28);
  // ram cavities: 4 bodies with hydraulic bonnets left/right
  const rams = [];
  for (let i = 0; i < 4; i++) {
    const y = 3.9 + i * 1.25;
    B.box(2.0, 1.1, 1.9, m.darkSteel, [0, y, 0]);
    for (const sx of [-1, 1]) {
      B.box(0.35, 1.0, 1.6, m.grey, [sx * 1.15, y, 0]);
      B.cyl(0.48, 1.1, m.red, [sx * 1.85, y, 0], [0, 0, Math.PI / 2], 20);
      B.cyl(0.3, 0.25, m.dark, [sx * 2.5, y, 0], [0, 0, Math.PI / 2], 16);
    }
    rams.push(y);
  }
  // choke & kill side outlets + valves
  for (const y of [4.5, 6.9]) {
    for (const s of [-1, 1]) {
      B.pipe([0, y, s * 0.85], [0, y, s * 1.9], 0.12, m.steel);
      B.box(0.55, 0.55, 0.5, m.red, [0, y, s * 1.9]);
    }
  }
  // C&K lines running up
  B.pipe([0.2, 4.5, 2.1], [0.2, 13.6, 2.1], 0.08, m.steel);
  B.pipe([-0.2, 6.9, -2.1], [-0.2, 13.6, -2.1], 0.08, m.steel);
  // LMRP connector, annulars, flex joint
  B.cyl(1.0, 1.0, m.dark, [0, 9.35, 0], [0, 0, 0], 28);
  B.cyl(1.15, 1.1, m.grey, [0, 10.45, 0], [0, 0, 0], 28);
  B.sphere(1.15, m.grey, [0, 11.0, 0], 20);
  B.cyl(1.0, 0.9, m.grey, [0, 11.9, 0], [0, 0, 0], 28);
  B.sphere(1.0, m.grey, [0, 12.35, 0], 20);
  B.cyl(0.55, 0.8, m.dark, [0, 13.3, 0], [0, 0, 0], 20);
  B.sphere(0.6, m.darkSteel, [0, 13.9, 0], 16);
  // frame
  const fc = [[-2.6, -2.6], [2.6, -2.6], [2.6, 2.6], [-2.6, 2.6]];
  for (const [x, z] of fc) B.box(0.28, 13, 0.28, m.yellow, [x, 6.9, z]);
  for (const y of [0.6, 3.2, 8.8, 13.3]) for (let k = 0; k < 4; k++) {
    const a = fc[k], b = fc[(k + 1) % 4];
    B.beam([a[0], y, a[1]], [b[0], y, b[1]], 0.22, m.yellow);
  }
  for (let k = 0; k < 4; k++) {
    const a = fc[k], b = fc[(k + 1) % 4];
    B.beam([a[0], 3.2, a[1]], [b[0], 8.8, b[1]], 0.14, m.yellow);
  }
  // guide funnels on corners
  for (const [x, z] of fc) B.cyl(0.45, 1.0, m.yellow, [x, 13.9, z], [0, 0, 0], 12, 0.2);
  // accumulator bottles (two racks)
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) B.cyl(0.2, 2.3, m.white, [s * 2.25, 5.0, -1.7 + i * 0.66], [0, 0, 0], 12);
  // control pods (yellow + blue)
  B.boxMM([1.7, 9.3, -1.3], [2.5, 11.8, -0.1], m.yellowClean);
  B.boxMM([1.7, 9.3, 0.1], [2.5, 11.8, 1.3], m.blue);
  B.boxMM([-2.5, 9.3, -0.6], [-1.7, 11.4, 0.6], m.yellowClean);
  // ROV intervention panel (front, +z)
  B.boxMM([-1.2, 2.2, 2.55], [1.2, 3.4, 2.75], m.orange);
  for (let i = 0; i < 4; i++) B.cyl(0.08, 0.25, m.dark, [-0.75 + i * 0.5, 2.8, 2.82], [Math.PI / 2, 0, 0], 8);
  // markings
  const g = B.build();
  return { group: g, rams };
}

function makeROV(m) {
  const B = new Builder();
  B.boxMM([-1.3, 0.9, -1.0], [1.3, 1.7, 1.0], m.yellowClean);        // buoyancy foam
  B.boxMM([-1.25, 0.0, -0.95], [1.25, 0.9, 0.95], m.dark);           // frame block
  for (const [x, z] of [[-1.3, -1], [1.3, -1], [1.3, 1], [-1.3, 1]]) B.box(0.12, 1.7, 0.12, m.black, [x, 0.85, z]);
  // thrusters
  for (const [x, z, r] of [[-1.35, 0.7, 0.6], [1.35, 0.7, -0.6], [-1.35, -0.7, -0.6], [1.35, -0.7, 0.6]]) {
    B.cyl(0.28, 0.5, m.black, [x, 0.45, z], [Math.PI / 2, r, 0], 14);
  }
  B.cyl(0.25, 0.4, m.black, [0.5, 1.75, 0], [0, 0, 0], 12);
  B.cyl(0.25, 0.4, m.black, [-0.5, 1.75, 0], [0, 0, 0], 12);
  // camera + lights at the front (+z)
  B.cyl(0.14, 0.3, m.darkSteel, [0, 0.6, 1.05], [Math.PI / 2, 0, 0], 12);
  for (const x of [-0.9, 0.9]) B.cyl(0.11, 0.2, m.lampWhite, [x, 1.2, 1.02], [Math.PI / 2, 0, 0], 10);
  const body = B.build();
  // manipulator arm (two segments)
  const arm = new THREE.Group();
  const a1 = new Builder();
  a1.box(0.16, 0.16, 0.9, m.steel, [0, 0, 0.45]);
  const seg1 = a1.build();
  const a2 = new Builder();
  a2.box(0.13, 0.13, 0.8, m.steel, [0, 0, 0.4]);
  a2.box(0.08, 0.2, 0.18, m.dark, [0.05, 0, 0.85]);
  a2.box(0.08, 0.2, 0.18, m.dark, [-0.05, 0, 0.85]);
  const seg2 = a2.build();
  seg2.position.z = 0.9;
  seg1.add(seg2);
  arm.add(seg1);
  arm.position.set(0.6, 0.3, 1.0);
  const g = new THREE.Group();
  g.add(body, arm);
  // light beams (additive cones)
  const beamMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.55, 0.8, 0.85), transparent: true, opacity: 0.11, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  for (const x of [-0.9, 0.9]) {
    const cone = new THREE.Mesh(new THREE.ConeGeometry(2.4, 9, 24, 1, true), beamMat);
    cone.position.set(x, 1.2, 1.0 + 4.5);
    cone.rotation.x = -Math.PI / 2;
    g.add(cone);
  }
  g.userData = { seg1, seg2 };
  return g;
}

export function createSubsea() {
  const m = materials();
  const group = new THREE.Group();

  // seabed terrain
  const size = 3000, segs = 160;
  const geo = new THREE.PlaneGeometry(size, size, segs, segs);
  geo.rotateX(-Math.PI / 2);
  const f = fbmField(128, { seed: 61, base: 4, octaves: 5 });
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const u = ((x / size + 0.5) * 127) | 0, v = ((z / size + 0.5) * 127) | 0;
    let h = (f[v * 128 + u] - 0.5) * 14;
    const d = Math.hypot(x, z - 6);
    h *= Math.min(1, d / 60);                                     // flat around the well
    h += Math.max(0, 1.6 - d / 6) * 1.2;                          // cuttings mound
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
  const sand = new THREE.MeshStandardMaterial({ map: sandTex([120, 120]), bumpMap: sandBump([120, 120]), bumpScale: 0.6, roughness: 0.95, metalness: 0 });
  const seabed = new THREE.Mesh(geo, sand);
  seabed.position.y = SEABED_Y;
  seabed.receiveShadow = true;
  group.add(seabed);

  // cuttings pile (grey) around wellhead from the riserless top hole
  const pile = new THREE.Mesh(new THREE.SphereGeometry(9, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: '#5d5a55', roughness: 1 }));
  pile.scale.set(1, 0.16, 1);
  pile.position.set(0, SEABED_Y - 0.2, 6);
  group.add(pile);

  // rocks
  const r = rng(8);
  const rockGeo = new THREE.DodecahedronGeometry(1, 0);
  const rocks = new THREE.InstancedMesh(rockGeo, new THREE.MeshStandardMaterial({ color: '#4f4b44', roughness: 1 }), 220);
  for (let i = 0; i < 220; i++) {
    const a = r() * Math.PI * 2, d = 25 + r() * 400, s = 0.3 + r() * 1.4;
    rocks.setMatrixAt(i, mat4([Math.cos(a) * d, SEABED_Y + s * 0.2, 6 + Math.sin(a) * d], [r(), r(), r()], [s, s * 0.6, s * 1.2]));
  }
  rocks.receiveShadow = rocks.castShadow = true;
  group.add(rocks);

  // BOP stack on the wellhead under the main well centre (rig-local x=0, z=6)
  const bop = makeBOP(m);
  bop.group.position.set(0, SEABED_Y + 0.6, 6);
  group.add(bop.group);

  // subsea Christmas tree (hidden until completion)
  const treeB = new Builder();
  treeB.boxMM([-1.8, 0, -1.8], [1.8, 0.4, 1.8], m.dark);
  treeB.cyl(0.5, 1.4, m.darkSteel, [0, 0.9, 0], [0, 0, 0], 20);
  treeB.boxMM([-0.9, 1.6, -0.9], [0.9, 3.4, 0.9], m.yellowClean);
  treeB.box(0.6, 0.6, 2.6, m.dark, [0, 2.5, 0]);
  for (const s of [-1, 1]) treeB.cyl(0.35, 0.35, m.red, [0, 2.5, s * 1.5], [Math.PI / 2, 0, 0], 16);
  treeB.cyl(0.32, 0.8, m.steel, [0, 3.8, 0], [0, 0, 0], 16);
  for (const [x, z] of [[-1.6, -1.6], [1.6, -1.6], [1.6, 1.6], [-1.6, 1.6]]) treeB.box(0.18, 3.8, 0.18, m.yellow, [x, 1.9, z]);
  treeB.pipe([1.6, 0.8, 0], [24, 0.4, 0], 0.15, m.dark);
  const tree = treeB.build();
  tree.position.set(0, SEABED_Y + 2.5, 6);
  tree.visible = false;
  group.add(tree);

  // ROV
  const rov = makeROV(m);
  rov.position.set(-1, SEABED_Y + 2.6, 13.5);
  rov.rotation.y = Math.PI;
  group.add(rov);
  const tether = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.7, 0), new THREE.Vector3(0.5, 6, -1), new THREE.Vector3(3, 30, -4), new THREE.Vector3(10, 120, -8)]), 40, 0.035, 5), m.yellowClean);
  rov.add(tether);

  // marine snow: points in a box around the camera
  const N = 5000;
  const pts = new Float32Array(N * 3);
  const seeds = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { seeds[i * 3] = r(); seeds[i * 3 + 1] = r(); seeds[i * 3 + 2] = r(); }
  const snowGeo = new THREE.BufferGeometry();
  snowGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const snowMat = new THREE.PointsMaterial({ color: new THREE.Color(0.75, 0.88, 0.85), size: 0.09, sizeAttenuation: true, transparent: true, opacity: 0.7, depthWrite: false });
  const snow = new THREE.Points(snowGeo, snowMat);
  snow.frustumCulled = false;
  group.add(snow);

  // light shafts from the surface (additive planes)
  const shaftTex = noiseTex({ size: 256, seed: 5, base: 6, octaves: 3, repeat: [3, 1] });
  const shaftMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uTex: { value: shaftTex }, uTime: { value: 0 }, uI: { value: 0.12 } },
    vertexShader: /* glsl */`varying vec2 vUv; varying vec3 vW; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`uniform sampler2D uTex; uniform float uTime, uI; varying vec2 vUv; varying vec3 vW;
      void main(){ float n = texture2D(uTex, vec2(vUv.x * 3.0 + uTime * 0.02, 0.5)).r; float rays = smoothstep(0.45, 0.8, n);
        float fade = smoothstep(0.0, 0.25, vUv.y) * smoothstep(0.0, 0.2, vUv.x) * smoothstep(1.0, 0.8, vUv.x);
        gl_FragColor = vec4(vec3(0.45, 0.75, 0.75) * rays * fade * uI, 1.0); }`,
  });
  const shafts = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(140, 180), shaftMat);
    p.position.set(-120 + i * 50, -95, 40 - i * 25);
    p.rotation.set(0.15, i * 0.9, 0.12);
    shafts.add(p);
  }
  group.add(shafts);

  // fish school
  const fishGeo = new THREE.ConeGeometry(0.12, 0.6, 5);
  fishGeo.rotateX(Math.PI / 2);
  const fish = new THREE.InstancedMesh(fishGeo, new THREE.MeshStandardMaterial({ color: '#9fb0b8', roughness: 0.3, metalness: 0.7 }), 160);
  fish.userData.seeds = Array.from({ length: 160 }, () => [r(), r(), r()]);
  group.add(fish);

  const api = {
    group, seabed, bop, rov, tree, snow, shafts, fish, shaftMat,
    update(t, cam, { snowOn = true, fishCenter = null } = {}) {
      // marine snow drifts slowly; wrapped in a 40 m box around camera
      if (snowOn) {
        const c = cam.position, B = 40;
        for (let i = 0; i < N; i++) {
          const sx = seeds[i * 3], sy = seeds[i * 3 + 1], sz = seeds[i * 3 + 2];
          const wx = ((sx * B + t * 0.15 - c.x) % B + B) % B - B / 2;
          const wy = ((sy * B - t * 0.25 - c.y) % B + B) % B - B / 2;
          const wz = ((sz * B + t * 0.05 - c.z) % B + B) % B - B / 2;
          pts[i * 3] = c.x + wx; pts[i * 3 + 1] = c.y + wy; pts[i * 3 + 2] = c.z + wz;
        }
        snowGeo.attributes.position.needsUpdate = true;
      }
      snow.visible = snowOn;
      shaftMat.uniforms.uTime.value = t;
      // ROV hover
      rov.position.y = SEABED_Y + 2.6 + Math.sin(t * 0.7) * 0.12;
      rov.rotation.z = Math.sin(t * 0.5) * 0.02;
      rov.userData.seg1.rotation.x = -0.3 + Math.sin(t * 0.6) * 0.15;
      rov.userData.seg2.rotation.x = 0.6 + Math.sin(t * 0.8 + 1) * 0.2;
      // fish circle
      if (fishCenter) {
        const m4 = new THREE.Matrix4();
        fish.visible = true;
        fish.userData.seeds.forEach(([a, b, c], i) => {
          const ang = t * 0.25 + a * Math.PI * 2;
          const rad = 6 + b * 5;
          const x = fishCenter.x + Math.cos(ang) * rad, z = fishCenter.z + Math.sin(ang) * rad, y = fishCenter.y + (c - 0.5) * 4 + Math.sin(t + a * 10) * 0.3;
          m4.makeRotationY(-ang).setPosition(x, y, z);
          fish.setMatrixAt(i, m4);
        });
        fish.instanceMatrix.needsUpdate = true;
      } else fish.visible = false;
    },
  };
  return api;
}
