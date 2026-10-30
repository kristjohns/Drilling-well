// Downhole macro set (real scale, metres): a cut-away borehole in rock with the
// bottom-hole assembly — PDC bit, rotary steerable system, MWD/LWD collars, drill pipe —
// plus mud jets, cuttings, telemetry pulses and wired-pipe data packets.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { rockTex, noiseTex } from '../engine/textures.js';
import { rng, mat4 } from '../engine/util.js';

export const HOLE_R = 0.1556;          // 12 1/4" hole
const COLLAR_R = 0.0857;              // 6 3/4" collars

function makeBit(m) {
  // PDC bit, crown facing -y, origin at the bit face centre.
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: '#6c7379', roughness: 0.38, metalness: 0.8 });
  const pdc = new THREE.MeshStandardMaterial({ color: '#d9dde2', roughness: 0.08, metalness: 1.0, envMapIntensity: 2 });
  const carbide = new THREE.MeshStandardMaterial({ color: '#555a5e', roughness: 0.3, metalness: 0.9 });
  // body: lathe profile (radius, y)
  const prof = [[0.0, 0.0], [0.05, 0.006], [0.11, 0.025], [0.145, 0.06], [0.152, 0.11], [0.15, 0.2], [0.09, 0.26], [0.085, 0.42], [0.0, 0.42]].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyMesh = new THREE.Mesh(new THREE.LatheGeometry(prof, 48), body);
  g.add(bodyMesh);
  const B = new Builder();
  const blades = 6;
  for (let b = 0; b < blades; b++) {
    const a0 = (b / blades) * Math.PI * 2;
    // blade: a curved ridge from centre to gauge, then up the gauge
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const r = 0.02 + (i / 10) * 0.135;
      const a = a0 + (i / 10) * 0.55;
      const y = 0.006 + Math.pow(i / 10, 2.2) * 0.07;
      pts.push([r, a, y]);
    }
    pts.forEach(([r, a, y], i) => {
      if (i === 0) return;
      const [r0, a00, y0] = pts[i - 1];
      B.beam([Math.cos(a00) * r0, y0 - 0.006, Math.sin(a00) * r0], [Math.cos(a) * r, y - 0.006, Math.sin(a) * r], 0.022, body);
      // cutter: cylinder facing the direction of rotation (tangential)
      const cx = Math.cos(a) * r, cz = Math.sin(a) * r;
      const tang = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
      const m4 = new THREE.Matrix4().compose(new THREE.Vector3(cx, y - 0.012, cz).addScaledVector(tang, 0.006),
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tang), new THREE.Vector3(1, 1, 1));
      B.add(new THREE.CylinderGeometry(0.0067, 0.0067, 0.012, 14), carbide, m4);
      const m5 = new THREE.Matrix4().compose(new THREE.Vector3(cx, y - 0.012, cz).addScaledVector(tang, 0.0125),
        new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), tang), new THREE.Vector3(1, 1, 1));
      B.add(new THREE.CylinderGeometry(0.0067, 0.0067, 0.002, 14), pdc, m5);
    });
    // gauge pad
    const ag = a0 + 0.55;
    B.box(0.03, 0.12, 0.05, body, [Math.cos(ag) * 0.148, 0.14, Math.sin(ag) * 0.148], [0, -ag, 0]);
    // nozzle between blades
    const an = a0 + Math.PI / blades;
    B.cyl(0.009, 0.01, m.black, [Math.cos(an) * 0.07, 0.02, Math.sin(an) * 0.07], [0, 0, 0], 10);
  }
  g.add(B.build());
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

function collar(B, m, y0, y1, r, mat) { B.cyl(r, y1 - y0, mat, [0, (y0 + y1) / 2, 0], [0, 0, 0], 40); }

export function createBHA() {
  const m = materials();
  const group = new THREE.Group();
  // rock: back half of the borehole + surrounding block faces
  const rockMap = rockTex('#a08a6c', '#5d4d3c', { seed: 44, layered: 0.6, grain: 0.4 });
  rockMap.repeat.set(2, 20);
  const rockMat = new THREE.MeshStandardMaterial({ map: rockMap, roughness: 0.95, metalness: 0.0, side: THREE.BackSide });
  const wall = new THREE.Mesh(new THREE.CylinderGeometry(HOLE_R, HOLE_R, 48, 64, 1, true, Math.PI / 2, Math.PI), rockMat);
  wall.position.y = 21.0;
  wall.receiveShadow = true;
  group.add(wall);
  // front cut face with the hole slot removed (two slabs left and right of the hole)
  const faceMat = new THREE.MeshStandardMaterial({ map: rockMap.clone(), roughness: 0.95 });
  faceMat.map.repeat.set(4, 16);
  for (const s of [-1, 1]) {
    const slab = new THREE.Mesh(new THREE.PlaneGeometry(14, 48), faceMat);
    slab.position.set(s * (HOLE_R + 7), 21, 0);
    slab.receiveShadow = true;
    group.add(slab);
  }
  const below = new THREE.Mesh(new THREE.PlaneGeometry(2 * HOLE_R + 28, 6), faceMat);
  below.position.set(0, -3, 0);
  group.add(below);
  // hole bottom with concentric grooves cut by the bit
  const grooves = (() => {
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d');
    g.fillStyle = '#6b5a46'; g.fillRect(0, 0, 256, 256);
    for (let r = 4; r < 128; r += 7) { g.strokeStyle = r % 14 ? '#4f4234' : '#8a7660'; g.lineWidth = 3; g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.stroke(); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const bottom = new THREE.Mesh(new THREE.CircleGeometry(HOLE_R, 48, 0, Math.PI), new THREE.MeshStandardMaterial({ map: grooves, roughness: 1 }));
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.y = 0.0;
  group.add(bottom);

  // rotating string (everything above the bit face) — local y up from the bit face
  const string = new THREE.Group();
  const bit = makeBit(m);
  string.add(bit);
  const B = new Builder();
  const steel = new THREE.MeshStandardMaterial({ color: '#7d858b', roughness: 0.3, metalness: 0.9 });
  const dark = new THREE.MeshStandardMaterial({ color: '#2f3438', roughness: 0.4, metalness: 0.8 });
  const blue = new THREE.MeshStandardMaterial({ color: '#2d5f9a', roughness: 0.35, metalness: 0.6 });
  const orange = new THREE.MeshStandardMaterial({ color: '#e07a1f', roughness: 0.4, metalness: 0.5 });
  // RSS (0.42–4.2 m)
  collar(B, m, 0.42, 4.2, COLLAR_R, orange);
  // MWD/LWD collars (4.2–18 m) with sensor windows and stabilisers
  collar(B, m, 4.2, 9.5, COLLAR_R, blue);
  collar(B, m, 9.5, 14.5, COLLAR_R, steel);
  collar(B, m, 14.5, 18.0, COLLAR_R, blue);
  for (const y of [5.5, 7.4, 11.2, 12.8, 16.2]) for (let k = 0; k < 4; k++) {
    const a = (k / 4) * Math.PI * 2;
    B.box(0.012, 0.32, 0.05, dark, [Math.cos(a) * COLLAR_R, y, Math.sin(a) * COLLAR_R], [0, -a, 0]);
  }
  for (const y of [4.35, 9.6, 18.1]) for (let k = 0; k < 3; k++) {     // spiral stabiliser blades
    const a = (k / 3) * Math.PI * 2;
    for (let i = 0; i < 6; i++) {
      const aa = a + i * 0.09, yy = y + i * 0.07;
      B.box(0.06, 0.08, 0.035, steel, [Math.cos(aa) * (COLLAR_R + 0.035), yy, Math.sin(aa) * (COLLAR_R + 0.035)], [0, -aa, 0]);
    }
  }
  // drill pipe above with tool joints (18–40 m)
  B.cyl(0.0635, 22, steel, [0, 29, 0], [0, 0, 0], 28);
  for (let y = 18; y < 40; y += 9.4) B.cyl(0.084, 0.45, steel, [0, y + 0.2, 0], [0, 0, 0], 28);
  const bhaG = B.build();
  string.add(bhaG);
  // RSS pads (3) — extended per frame
  const pads = [];
  for (let k = 0; k < 3; k++) {
    const pb = new Builder();
    pb.box(0.03, 0.3, 0.07, dark, [0, 0, 0]);
    const pad = pb.build();
    const holder = new THREE.Group();
    holder.rotation.y = -(k / 3) * Math.PI * 2;
    pad.position.set(COLLAR_R + 0.005, 2.6, 0);
    holder.add(pad);
    string.add(holder);
    pads.push(pad);
  }
  group.add(string);

  // cuttings + mud jets (instanced particles)
  const r = rng(12);
  const cutGeo = new THREE.DodecahedronGeometry(0.006, 0);
  const cuttings = new THREE.InstancedMesh(cutGeo, new THREE.MeshStandardMaterial({ color: '#7a6650', roughness: 1 }), 900);
  const cseeds = Array.from({ length: 900 }, () => [r(), r(), r(), r()]);
  group.add(cuttings);
  const jetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.75, 0.55, 0.3), transparent: true, opacity: 0.55, depthWrite: false });
  const jets = new THREE.InstancedMesh(new THREE.SphereGeometry(0.004, 6, 4), jetMat, 600);
  const jseeds = Array.from({ length: 600 }, () => [r(), r(), r()]);
  group.add(jets);

  // telemetry: pressure-pulse rings inside the pipe, and wired-pipe data packets
  const ringMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.7, 0.3).multiplyScalar(3), transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending });
  const rings = new THREE.Group();
  for (let i = 0; i < 6; i++) { const ri = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.008, 8, 40), ringMat); ri.rotation.x = Math.PI / 2; rings.add(ri); }
  group.add(rings);
  const pktMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.85, 1.0).multiplyScalar(4), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const packets = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, 0.08, 0.012), pktMat, 200);
  group.add(packets);
  const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 40, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.7, 1.0) }));
  wire.position.set(0.07, 20, 0.0);
  group.add(wire);

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), sv = new THREE.Vector3(1, 1, 1), pv = new THREE.Vector3();
  const api = {
    group, string, bit, pads, cuttings, jets, rings, packets, wire, wall,
    /**
     * rot: string rotation angle (rad); flow 0..1; padDir: steering direction (rad) or null;
     * pulse: 0..1 visibility of mud-pulse rings; wired: 0..1 visibility of data packets.
     */
    update(t, { rot = 0, flow = 1, padDir = null, padAmt = 0, pulse = 0, wired = 0 } = {}) {
      string.rotation.y = rot;
      // pads push opposite to the steering direction when they rotate past it
      pads.forEach((p, k) => {
        const world = rot - (k / 3) * Math.PI * 2;
        let ext = 0;
        if (padDir !== null) ext = Math.max(0, Math.cos(world - padDir - Math.PI)) ** 3 * padAmt;
        p.position.x = COLLAR_R + 0.005 + ext * 0.06;
      });
      // cuttings spiral up the annulus
      cuttings.visible = flow > 0;
      cseeds.forEach(([a, b, c, d], i) => {
        const life = (t * (0.35 + d * 0.3) + a) % 1;
        const y = 0.02 + life * 3.2;
        const ang = b * Math.PI * 2 + t * (1.5 + c) + life * 6;
        const rad = COLLAR_R + 0.012 + (HOLE_R - COLLAR_R - 0.02) * c;
        const rr = y < 0.42 ? 0.04 + (HOLE_R - 0.05) * Math.min(1, life * 8) * c : rad;
        pv.set(Math.cos(ang) * rr, y, Math.sin(ang) * rr);
        q.setFromEuler(e.set(a * 6, b * 6 + t, c * 6));
        const s = flow * (0.6 + d);
        m4.compose(pv, q, sv.set(s, s, s));
        cuttings.setMatrixAt(i, m4);
      });
      cuttings.instanceMatrix.needsUpdate = true;
      // jets from nozzles: short streaks below the bit face, then turning outward
      jets.visible = flow > 0;
      jseeds.forEach(([a, b, c], i) => {
        const k = (t * 2.2 + a) % 1;
        const n = Math.floor(b * 6);
        const an = (n / 6) * Math.PI * 2 + Math.PI / 6 + rot;
        const rr = 0.07 + k * 0.08 * (0.5 + c);
        const y = 0.015 - Math.min(k, 0.25) * 0.05 + Math.max(0, k - 0.5) * 0.25;
        pv.set(Math.cos(an) * rr, y, Math.sin(an) * rr);
        m4.makeScale(flow, flow * 2.5, flow).setPosition(pv);
        jets.setMatrixAt(i, m4);
      });
      jets.instanceMatrix.needsUpdate = true;
      // pulse rings travel up the pipe bore (~1,300 m/s in reality; slowed for display)
      rings.visible = pulse > 0;
      ringMat.opacity = pulse;
      rings.children.forEach((ri, i) => { ri.position.set(0, 2 + ((t * 2.0 + i / 6) % 1) * 30, 0); });
      packets.visible = wired > 0; wire.visible = wired > 0;
      pktMat.opacity = wired;
      for (let i = 0; i < 200; i++) {
        const y = 2 + ((t * 9.0 + i / 200 * 3) % 3) / 3 * 36;
        m4.makeTranslation(0.07, y, 0);
        packets.setMatrixAt(i, m4);
      }
      packets.instanceMatrix.needsUpdate = true;
    },
  };
  return api;
}
