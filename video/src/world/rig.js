// Harsh-environment semi-submersible drilling rig ("NORDLYS", fictional), modelled after
// 6th-generation Norwegian rigs: ring pontoon, 4 columns, box deck, dual-activity derrick.
// Units: metres. Origin: rig centre at the still-water line.
import * as THREE from 'three';
import { Builder, roundRectShape, extrudeUp } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { helideckTex, textTex, redZoneTex } from '../engine/textures.js';
import { rng, mat4, V, lerp } from '../engine/util.js';

export const RIG = {
  draft: 25, pontoonX: 31, columnZ: 37, deckY0: 17, deckY: 27, floorY: 40, crownY: 92,
  wcMain: new THREE.Vector3(0, 40, 6), wcAux: new THREE.Vector3(0, 40, -6),
  standLen: 28.2,
};

function makeTopDrive(m) {
  // Travelling block + top drive + elevator assembly. Local origin = elevator (bottom).
  const b = new Builder();
  // elevator & links
  b.cyl(0.42, 0.45, m.darkSteel, [0, 0.2, 0], [0, 0, 0], 20);
  b.beam([-0.36, 0.4, 0], [-0.36, 3.6, 0], 0.12, m.steel);
  b.beam([0.36, 0.4, 0], [0.36, 3.6, 0], 0.12, m.steel);
  // pipe handler / saver sub
  b.cyl(0.14, 1.2, m.steel, [0, 3.9, 0], [0, 0, 0], 12);
  b.cyl(0.55, 0.5, m.dark, [0, 4.3, 0], [0, 0, 0], 20);
  // main body
  b.box(2.0, 2.6, 1.7, m.yellowClean, [0, 5.8, 0]);
  b.box(2.2, 0.3, 1.9, m.dark, [0, 4.6, 0]);
  // motors (twin AC motors with fans)
  b.cyl(0.55, 1.6, m.whiteClean, [-0.55, 7.9, 0], [0, 0, 0], 20);
  b.cyl(0.55, 1.6, m.whiteClean, [0.55, 7.9, 0], [0, 0, 0], 20);
  b.cyl(0.58, 0.25, m.dark, [-0.55, 8.8, 0], [0, 0, 0], 20);
  b.cyl(0.58, 0.25, m.dark, [0.55, 8.8, 0], [0, 0, 0], 20);
  // gooseneck
  b.pipe([0, 7.1, -0.6], [0, 8.4, -1.2], 0.11, m.steel);
  b.pipe([0, 8.4, -1.2], [0, 9.3, -0.9], 0.11, m.steel);
  // dolly arms toward rails (+x)
  b.box(2.2, 0.35, 0.5, m.dark, [1.8, 5.2, 0]);
  b.box(2.2, 0.35, 0.5, m.dark, [1.8, 6.9, 0]);
  b.box(0.5, 3.4, 1.2, m.yellowClean, [2.6, 6.0, 0]);
  // hook / bail
  b.cyl(0.25, 0.8, m.darkSteel, [0, 9.6, 0], [0, 0, 0], 12);
  const g = b.build();
  // travelling block (separate so it can be shown/hidden for integrated designs)
  const bb = new Builder();
  bb.box(1.6, 2.2, 1.4, m.yellowClean, [0, 11.3, 0]);
  for (let i = 0; i < 6; i++) bb.cyl(0.85, 0.12, m.steel, [-0.6 + i * 0.24, 12.0, 0], [0, 0, Math.PI / 2], 24);
  bb.box(1.7, 0.4, 1.5, m.dark, [0, 12.8, 0]);
  const block = bb.build();
  const grp = new THREE.Group();
  grp.add(g, block);
  return grp;
}

function makeRacker(m) {
  // Column pipe racker: vertical column with lower and upper gripper arms. Origin at floor.
  const b = new Builder();
  b.box(1.1, 27.6, 1.1, m.yellowClean, [0, 14.0, 0]);
  b.box(1.8, 0.6, 1.8, m.dark, [0, 0.3, 0]);
  b.box(1.8, 0.6, 1.8, m.dark, [0, 27.6, 0]);
  const col = b.build();
  const arm = (y) => {
    const a = new Builder();
    a.box(0.7, 0.7, 0.9, m.dark, [0, 0, 0]);
    a.box(3.2, 0.32, 0.4, m.yellowClean, [-1.6, 0, 0]);   // telescopic arm toward -x
    a.box(0.5, 0.5, 0.7, m.darkSteel, [-3.25, 0, 0]);     // gripper head
    a.box(0.18, 0.4, 0.15, m.darkSteel, [-3.55, 0, 0.32]);
    a.box(0.18, 0.4, 0.15, m.darkSteel, [-3.55, 0, -0.32]);
    const g = a.build();
    g.position.y = y;
    return g;
  };
  const lower = arm(2.2), upper = arm(25.8);
  const grp = new THREE.Group();
  grp.add(col, lower, upper);
  grp.userData = { lower, upper };
  return grp;
}

function makeRoughneck(m) {
  // Iron roughneck: floor carriage + parallel arm carrying a C-frame wrench assembly
  // (spinner rollers on top, torque wrench + backup wrench below). Tools face -x.
  const b = new Builder();
  b.box(2.4, 0.45, 1.8, m.dark, [0.6, 0.22, 0]);
  b.box(0.9, 1.6, 0.9, m.yellowClean, [1.2, 1.2, 0]);
  b.beam([1.2, 1.9, 0.35], [-0.2, 1.6, 0.35], 0.22, m.yellowClean);
  b.beam([1.2, 1.9, -0.35], [-0.2, 1.6, -0.35], 0.22, m.yellowClean);
  b.cyl(0.12, 1.4, m.steel, [0.6, 1.3, 0.62], [0, 0, 1.2], 10);
  const base = b.build();
  const t = new Builder();
  const cShape = (rOut, rIn) => {
    const sh = new THREE.Shape();
    sh.absarc(0, 0, rOut, Math.PI * 0.28, Math.PI * 1.72, false);
    sh.absarc(0, 0, rIn, Math.PI * 1.72, Math.PI * 0.28, true);
    return sh;
  };
  const plate = (y, h, rOut, mat) => {
    const g = new THREE.ExtrudeGeometry(cShape(rOut, 0.24), { depth: h, bevelEnabled: false, curveSegments: 20 });
    g.rotateX(-Math.PI / 2);
    g.rotateY(Math.PI);           // opening toward -x
    t.add(g, mat, mat4([-1.0, y, 0]));
  };
  plate(0.55, 0.45, 0.78, m.dark);            // backup wrench (lower jaws)
  plate(1.1, 0.5, 0.8, m.yellowClean);        // torque wrench
  plate(1.95, 0.35, 0.72, m.whiteClean);      // spinner housing
  // spine at the back of the C-frame
  t.box(0.35, 2.2, 1.1, m.yellowClean, [-0.15, 1.3, 0]);
  // spinner rollers and motors
  for (const s of [-1, 1]) {
    t.cyl(0.16, 0.42, m.rubber, [-1.25, 2.12, s * 0.3], [0, 0, 0], 14);
    t.cyl(0.13, 0.5, m.steel, [-1.25, 2.62, s * 0.3], [0, 0, 0], 12);
    t.box(0.36, 0.12, 0.1, m.black, [-1.25, 2.2, s * 0.42]);
  }
  // torque cylinders
  for (const s of [-1, 1]) t.cyl(0.09, 0.9, m.steel, [-0.6, 1.35, s * 0.62], [0, 0, Math.PI / 2], 10);
  const tool = t.build();
  const grp = new THREE.Group();
  grp.add(base, tool);
  grp.userData = { tool };
  return grp;
}

function screenTex(kind, seed = 1) {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 320;
  const g = c.getContext('2d');
  const draw = (t = 0) => {
    g.fillStyle = '#060b10'; g.fillRect(0, 0, 512, 320);
    g.fillStyle = '#0f1c26'; g.fillRect(0, 0, 512, 28);
    g.fillStyle = '#7fd0ff'; g.font = '600 16px Inter, sans-serif';
    g.fillText(kind === 0 ? 'DRILLING — WELL 25/1-A' : kind === 1 ? 'HOOKLOAD · ROP · TORQUE' : 'WELL SCHEMATIC', 12, 19);
    const cols = ['#ffb23f', '#5fd3ff', '#7dff9b', '#ff6b6b'];
    for (let k = 0; k < (kind === 2 ? 0 : 3); k++) {
      g.strokeStyle = cols[k]; g.lineWidth = 2; g.beginPath();
      for (let x = 0; x < 500; x += 4) {
        const v = Math.sin((x + t * 40) * 0.03 * (k + 1) + seed + k) * 0.5 + Math.sin((x + t * 25) * 0.11 + k * 3) * 0.25;
        const y = 60 + k * 85 + v * 28;
        x ? g.lineTo(x + 6, y) : g.moveTo(x + 6, y);
      }
      g.stroke();
    }
    if (kind === 2) {
      g.fillStyle = '#26323c'; g.fillRect(150, 40, 212, 270);
      for (const [w, d] of [[90, 60], [70, 140], [52, 210], [36, 262]]) { g.fillStyle = '#9aa4ab'; g.fillRect(256 - w / 2, 40, 6, d); g.fillRect(256 + w / 2 - 6, 40, 6, d); }
      g.fillStyle = '#ffb23f'; g.fillRect(253, 40, 6, 250);
    }
  };
  draw();
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, draw: (t) => { draw(t); tex.needsUpdate = true; } };
}

function makeCabinInterior(m) {
  // Driller's chair facing -x toward the well centres, with consoles and screens.
  const g = new THREE.Group();
  const B = new Builder();
  const seat = new THREE.MeshStandardMaterial({ color: '#1b1f24', roughness: 0.6 });
  B.cyl(0.35, 0.5, m.darkSteel, [0, 0.25, 0], [0, 0, 0], 16);
  B.box(0.75, 0.2, 0.7, seat, [0, 0.6, 0]);
  B.box(0.18, 1.0, 0.7, seat, [0.38, 1.15, 0], [0, 0, 0.12]);
  for (const s of [-1, 1]) {
    B.box(0.7, 0.18, 0.22, seat, [-0.05, 0.85, s * 0.48]);
    B.cyl(0.04, 0.22, m.black, [-0.25, 1.05, s * 0.48], [0, 0, 0.1], 8);
    B.sphere(0.06, m.black, [-0.27, 1.17, s * 0.48], 8);
  }
  B.box(0.6, 0.9, 3.8, m.dark, [-1.5, 0.45, 0]);
  g.add(B.build());
  const screens = [];
  const lay = [[-1.55, 1.35, -1.05, 0], [-1.55, 1.35, 0, 1], [-1.55, 1.35, 1.05, 2], [-1.3, 2.35, -0.9, 1], [-1.3, 2.35, 0.9, 0]];
  lay.forEach(([x, y, z, kind], i) => {
    const st = screenTex(kind, i);
    const mat = new THREE.MeshBasicMaterial({ map: st.tex, toneMapped: false });
    mat.color.setScalar(0.9);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.62), mat);
    sc.position.set(x, y, z);
    sc.rotation.y = Math.PI / 2;
    sc.rotation.x = 0;
    sc.rotateX(y > 2 ? 0.25 : -0.35);
    g.add(sc);
    const bezel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.68, 1.06), m.black);
    bezel.position.set(x - 0.04, y, z);
    bezel.rotation.z = y > 2 ? -0.25 : 0.35;
    g.add(bezel);
    screens.push(st);
  });
  g.userData.screens = screens;
  return g;
}

function makeRobotArm(m) {
  // 6-axis industrial robot: base → turret(yaw) → shoulder(pitch) → elbow(pitch) → wrist(roll/pitch) → tool
  const paint = new THREE.MeshStandardMaterial({ color: '#f08a12', roughness: 0.4, metalness: 0.2 });
  const mk = (fn) => { const b = new Builder(); fn(b); return b.build(); };
  const base = mk((b) => { b.box(2.4, 0.3, 1.2, m.darkSteel, [0, 0.15, 0]); b.cyl(0.55, 0.6, m.dark, [0, 0.6, 0], [0, 0, 0], 24); });
  const turret = mk((b) => { b.cyl(0.5, 0.7, paint, [0, 0.35, 0], [0, 0, 0], 24); b.box(0.7, 0.6, 0.9, paint, [0, 0.9, 0]); });
  turret.position.y = 0.9;
  const upper = mk((b) => { b.box(0.38, 1.9, 0.42, paint, [0, 0.95, 0]); b.cyl(0.3, 0.55, m.dark, [0, 0, 0], [Math.PI / 2, 0, 0], 20); });
  upper.position.y = 1.0;
  const fore = mk((b) => { b.cyl(0.26, 0.5, m.dark, [0, 0, 0], [Math.PI / 2, 0, 0], 18); b.box(0.32, 0.32, 1.6, paint, [0, 0, 0.8]); });
  fore.position.y = 1.9;
  const wrist = mk((b) => { b.cyl(0.16, 0.3, m.dark, [0, 0, 0.15], [Math.PI / 2, 0, 0], 16); b.box(0.22, 0.4, 0.2, m.darkSteel, [0, 0, 0.42]); b.box(0.06, 0.16, 0.22, m.steel, [0.08, 0, 0.62]); b.box(0.06, 0.16, 0.22, m.steel, [-0.08, 0, 0.62]); });
  wrist.position.z = 1.6;
  base.add(turret); turret.add(upper); upper.add(fore); fore.add(wrist);
  const group = new THREE.Group();
  group.add(base);
  return {
    group,
    upper,
    pose(yaw, shoulder, elbow, wristP, slide = 0) {
      base.position.x = slide;
      turret.rotation.y = yaw;
      upper.rotation.x = shoulder;
      fore.rotation.x = elbow;
      wrist.rotation.x = wristP;
    },
  };
}

function catenaryPoints(from, dirXZ, span, depthBelow, seabedRun = 300, n = 60) {
  // Chain from fairlead `from` to touchdown `span` metres away horizontally, `depthBelow` down,
  // then lying on the seabed for `seabedRun` metres.
  let lo = 1, hi = 1e5;
  for (let i = 0; i < 80; i++) {
    const a = (lo + hi) / 2;
    const y = a * Math.cosh(span / a) - a;
    if (y > depthBelow) lo = a; else hi = a;
  }
  const a = (lo + hi) / 2;
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const s = i / n;
    const x = span * (1 - s);            // distance from touchdown
    const y = a * Math.cosh(x / a) - a;  // height above seabed
    pts.push(new THREE.Vector3(from.x + dirXZ.x * span * s, from.y - depthBelow + y, from.z + dirXZ.y * span * s));
  }
  const end = pts[pts.length - 1];
  pts.push(new THREE.Vector3(end.x + dirXZ.x * seabedRun, end.y, end.z + dirXZ.y * seabedRun));
  return pts;
}

export function createRig({ waterDepth = 320 } = {}) {
  const m = materials();
  const root = new THREE.Group();          // moves with heave/pitch/roll
  const B = new Builder();
  const R = RIG;

  // ---------------- HULL ----------------
  const ponShape = roundRectShape(17, 114, 6.5);
  for (const sx of [-1, 1]) {
    B.geo(extrudeUp(ponShape, 9, 0.6), m.antifoul, [sx * R.pontoonX, -25, 0]);
  }
  for (const sz of [-1, 1]) {
    B.geo(extrudeUp(roundRectShape(46, 9, 3), 6.5, 0.5), m.antifoul, [0, -25, sz * R.columnZ]);
  }
  const colShape = roundRectShape(15, 15, 3.6);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * R.pontoonX, z = sz * R.columnZ;
    B.geo(extrudeUp(colShape, 14.6, 0.2), m.antifoul, [x, -16, z]);
    B.geo(extrudeUp(colShape, 4.2, 0.05), m.black, [x, -1.4, z]);
    B.geo(extrudeUp(colShape, 14.2, 0.2), m.yellow, [x, 2.8, z]);
    // fairleads + chain stoppers on the outer faces
    for (const a of [0.35, -0.35]) {
      const ang = Math.atan2(sz, sx) + a;
      const fx = x + Math.cos(ang) * 8.4, fz = z + Math.sin(ang) * 8.4;
      B.box(1.6, 2.2, 1.6, m.dark, [fx, -13, fz], [0, -ang, 0]);
      B.pipe([fx, -12, fz], [x + Math.cos(ang) * 7.6, 16, z + Math.sin(ang) * 7.6], 0.35, m.dark);
    }
    // draft marks (small white bars)
    for (let i = -10; i <= 10; i += 2) B.box(0.08, 0.15, 1.2, m.whiteClean, [x + sx * 7.55, i, z]);
  }
  // thrusters (8 azimuth thrusters)
  const thrusterPos = [];
  for (const sx of [-1, 1]) for (const z of [-50, -38, 38, 50]) thrusterPos.push([sx * R.pontoonX + (z === -38 || z === 38 ? sx * 3 : 0), z]);
  for (const [x, z] of thrusterPos.slice(0, 8)) {
    B.cyl(0.8, 2.4, m.darkSteel, [x, -26.4, z], [0, 0, 0], 14);
    B.cyl(1.25, 3.4, m.darkSteel, [x, -28.4, z], [Math.PI / 2, 0, 0], 18);
    B.cyl(1.6, 1.4, m.dark, [x, -28.4, z + 1.2], [Math.PI / 2, 0, 0], 22);
  }

  // ---------------- DECK BOX ----------------
  const deckShape = roundRectShape(80, 92, 1.5);
  const mp = new THREE.Path();
  mp.moveTo(-5, -13); mp.lineTo(5, -13); mp.lineTo(5, 13); mp.lineTo(-5, 13); mp.lineTo(-5, -13);
  deckShape.holes.push(mp);
  B.geo(extrudeUp(deckShape, 10, 0.4), m.white, [0, R.deckY0, 0]);
  B.boxMM([-40.3, 21.6, -46.3], [40.3, 22.4, 46.3], m.yellow);           // coloured band
  B.boxMM([-38, 26.9, -44], [38, 27.15, 44], m.deck);                     // deck surface
  // moonpool walls (dark inside)
  B.boxMM([-5.2, 17.2, -13], [-5, 27, 13], m.grey);
  B.boxMM([5, 17.2, -13], [5.2, 27, 13], m.grey);
  B.boxMM([-5, 17.2, -13.2], [5, 27, -13], m.grey);
  B.boxMM([-5, 17.2, 13], [5, 27, 13.2], m.grey);
  for (const z of [-10, -3, 4, 11]) for (const x of [-4.9, 4.9]) B.box(0.2, 0.4, 0.8, m.lampWhite, [x, 25.5, z]);
  // hazard edge around deck
  B.boxMM([-40.2, 27.15, 45.6], [40.2, 27.25, 46.2], m.hazard);

  // railings around main deck
  const rail = (a, b2, n) => {
    for (let i = 0; i <= n; i++) {
      const p = V(a).lerp(V(b2), i / n);
      B.beam([p.x, 27.2, p.z], [p.x, 28.3, p.z], 0.06, m.yellowClean);
    }
    B.beam([a[0], 28.3, a[2]], [b2[0], 28.3, b2[2]], 0.06, m.yellowClean);
    B.beam([a[0], 27.75, a[2]], [b2[0], 27.75, b2[2]], 0.05, m.yellowClean);
  };
  rail([-39.6, 0, -45.6], [39.6, 0, -45.6], 40);
  rail([-39.6, 0, 45.6], [39.6, 0, 45.6], 40);
  rail([-39.6, 0, -45.6], [-39.6, 0, 45.6], 46);
  rail([39.6, 0, -45.6], [39.6, 0, 45.6], 46);

  // ---------------- SUBSTRUCTURE & DRILL FLOOR ----------------
  for (const x of [-10, 10]) for (const z of [-14, 14]) B.box(1.4, 13, 1.4, m.white, [x, 33.5, z]);
  B.boxMM([-10.7, 27, -14.7], [10.7, 33, -13.3], m.white);
  B.boxMM([10, 27, -14.7], [19.5, 33, 14.7], m.white);
  B.boxMM([-10.7, 27, -14.7], [-9.3, 33, 14.7], m.white);
  for (const z of [-14, 14]) { B.beam([-10, 27.5, z], [10, 39, z], 0.5, m.white); B.beam([10, 27.5, z], [-10, 39, z], 0.5, m.white); }
  B.boxMM([-11, 38.6, -15.5], [19.5, 40, 15.5], m.grey);
  B.boxMM([-11, 39.9, -15.5], [19.5, 40.05, 15.5], m.grating);
  B.boxMM([-11.3, 38.5, -15.8], [19.8, 38.7, 15.8], m.hazard);
  // drill floor railings
  rail; // (keep floor edge open toward V-door)
  for (const [a, b2] of [[[-11, 0, -15.4], [19.4, 0, -15.4]], [[19.4, 0, -15.4], [19.4, 0, 15.4]], [[-11, 0, -15.4], [-11, 0, 15.4]]]) {
    const n = Math.round(V(a).distanceTo(V(b2)) / 1.6);
    for (let i = 0; i <= n; i++) {
      const p = V(a).lerp(V(b2), i / n);
      B.beam([p.x, 40, p.z], [p.x, 41.1, p.z], 0.06, m.yellowClean);
    }
    B.beam([a[0], 41.1, a[2]], [b2[0], 41.1, b2[2]], 0.06, m.yellowClean);
  }
  // rotary tables / well centres
  for (const wc of [R.wcMain, R.wcAux]) {
    B.cyl(1.6, 0.5, m.darkSteel, [wc.x, 40.1, wc.z], [0, 0, 0], 32);
    B.cyl(0.75, 0.52, m.black, [wc.x, 40.12, wc.z], [0, 0, 0], 24);
  }
  // red zone decals
  const rz = new THREE.MeshBasicMaterial({ map: redZoneTex(), transparent: true, depthWrite: false, toneMapped: false, opacity: 0.85 });
  const redZones = new THREE.Group();
  for (const wc of [R.wcMain, R.wcAux]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(8.5, 8.5), rz);
    p.rotation.x = -Math.PI / 2;
    p.position.set(wc.x - 0.8, 40.08, wc.z);
    redZones.add(p);
  }
  root.add(redZones);

  // drawworks (2), driller's cabin, mud standpipe manifold
  const DB = new Builder();
  for (const z of [7.5, -7.5]) {
    DB.box(6.5, 3.6, 4.2, m.white, [15.2, 41.8, z]);
    DB.cyl(1.3, 4.6, m.dark, [12.2, 42.0, z], [Math.PI / 2, 0, 0], 28);
    DB.cyl(1.35, 0.25, m.yellowClean, [12.2, 42.0, z + 2.3], [Math.PI / 2, 0, 0], 28);
    DB.cyl(1.35, 0.25, m.yellowClean, [12.2, 42.0, z - 2.3], [Math.PI / 2, 0, 0], 28);
    DB.box(1.2, 1.2, 1.2, m.dark, [18.6, 41.5, z + 1.5]);
    for (let k = 0; k < 9; k++) DB.cyl(1.36, 0.06, m.darkSteel, [12.2, 42.0, z - 2.0 + k * 0.5], [Math.PI / 2, 0, 0], 28);
  }
  const drawworksG = DB.build();
  root.add(drawworksG);
  // driller's cabin (glass front facing -x)
  B.boxMM([10.2, 40, -2.6], [16, 41.0, 2.6], m.grey);
  B.boxMM([11.0, 41.0, -2.6], [16, 44.6, 2.6], m.white);
  B.boxMM([10.6, 44.6, -2.8], [16.2, 44.9, 2.8], m.dark);
  const cabinGlassMat = new THREE.MeshStandardMaterial({ color: '#0d1820', roughness: 0.05, metalness: 0.9, transparent: true, opacity: 1 });
  const cabinGlass = new THREE.Mesh(new THREE.BoxGeometry(0.3, 3.0, 4.8), cabinGlassMat);
  cabinGlass.position.set(10.9, 42.8, 0);
  root.add(cabinGlass);
  const cabin = makeCabinInterior(m);
  cabin.position.set(13.3, 41.0, 0);
  root.add(cabin);

  // ---------------- DERRICK ----------------
  const base = { x0: -9, x1: 9, z0: -13, z1: 13 }, top = { x0: -3.5, x1: 3.5, z0: -7, z1: 7 };
  const levels = 12, y0 = R.floorY, y1 = R.crownY;
  const corners = (lv) => {
    const s = lv / levels, y = lerp(y0, y1, s);
    const x0 = lerp(base.x0, top.x0, s), x1 = lerp(base.x1, top.x1, s), z0 = lerp(base.z0, top.z0, s), z1 = lerp(base.z1, top.z1, s);
    return [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]];
  };
  for (let lv = 0; lv < levels; lv++) {
    const c0 = corners(lv), c1 = corners(lv + 1);
    for (let k = 0; k < 4; k++) B.beam(c0[k], c1[k], 0.75, m.white);   // legs
    for (let k = 0; k < 4; k++) {
      const vdoor = k === 2 && lv < 2;                                  // +z face open at bottom (V-door)
      if (!vdoor) B.beam(c1[k], c1[(k + 1) % 4], 0.32, m.white);
      if (!vdoor) {
        B.beam(c0[k], c1[(k + 1) % 4], 0.22, m.white);
        B.beam(c0[(k + 1) % 4], c1[k], 0.22, m.white);
      }
    }
  }
  // crown platform & sheave clusters
  B.boxMM([-4.6, 92, -8.2], [4.6, 93.2, 8.2], m.white);
  const CB = new Builder();
  for (const z of [R.wcMain.z, R.wcAux.z]) {
    for (let i = 0; i < 7; i++) CB.cyl(1.0, 0.16, m.steel, [-0.7 + i * 0.24, 94.2, z], [0, 0, Math.PI / 2], 24);
    CB.box(2.2, 0.5, 2.6, m.yellowClean, [0, 93.5, z]);
  }
  const crownG = CB.build();
  root.add(crownG);
  B.beam([-4, 93.2, -8], [0, 99.5, 0], 0.3, m.white);
  B.beam([4, 93.2, -8], [0, 99.5, 0], 0.3, m.white);
  B.beam([0, 93.2, 8], [0, 99.5, 0], 0.3, m.white);
  // top drive guide rails
  for (const z of [R.wcMain.z, R.wcAux.z]) {
    B.boxMM([2.2, 40.5, z - 0.75], [2.6, 89, z - 0.45], m.steel);
    B.boxMM([2.2, 40.5, z + 0.45], [2.6, 89, z + 0.75], m.steel);
    for (let y = 44; y < 89; y += 6) B.beam([2.6, y, z], [lerp(9, 3.5, (y - 40) / 52), y, z], 0.25, m.white);
  }
  // fingerboard (setback rack) at ~ y=67.6 on the -x side, between the two well centres
  const fbY = R.floorY + 27.6;
  B.boxMM([-7.6, fbY, -5.2], [-2.8, fbY + 0.4, -4.8], m.yellowClean);
  B.boxMM([-7.6, fbY, 4.8], [-2.8, fbY + 0.4, 5.2], m.yellowClean);
  for (let i = 0; i <= 10; i++) {
    const x = -7.6 + i * 0.48;
    B.boxMM([x - 0.05, fbY + 0.05, -4.8], [x + 0.05, fbY + 0.3, 4.8], m.yellowClean);
  }
  B.boxMM([-7.9, fbY - 0.3, -5.6], [-7.5, fbY + 0.6, 5.6], m.yellowClean);
  // monkey board walkway
  B.boxMM([-8.2, fbY - 0.1, -6], [-7.5, fbY + 0.05, 6], m.grating);
  // setback floor pads
  B.boxMM([-7.8, 40.05, -4.9], [-2.7, 40.25, 4.9], m.darkSteel);
  // mud standpipe up the derrick to the rotary hose connection
  B.pipe([8.4, 40, 12.2], [5.4, 70, 9.4], 0.16, m.red);
  B.pipe([8.4, 40, -12.2], [5.4, 70, -9.4], 0.16, m.red);
  // lights on derrick
  const lampSpots = [];
  for (let lv = 1; lv <= levels; lv += 2) for (const c of corners(lv)) lampSpots.push(c);
  for (const p of lampSpots) B.box(0.5, 0.35, 0.35, m.lampWarm, [p[0], p[1] - 0.4, p[2]]);
  B.sphere(0.45, m.lampRed, [0, 100, 0], 10);
  for (const c of corners(levels)) B.sphere(0.3, m.lampRed, [c[0], c[1] + 0.8, c[2]], 8);

  // ---------------- PIPE DECK, CATWALK, V-DOOR ----------------
  B.boxMM([-1.6, 27.2, 14], [1.6, 28.2, 44], m.grey);
  B.beam([0, 28.4, 42], [0, 40.2, 15], 1.5, m.yellowClean);         // catwalk machine ramp
  const r = rng(5);
  const pipeGeo = new THREE.CylinderGeometry(0.09, 0.09, 1, 8, 1);
  const pipeStacks = [];
  const stack = (x0, z0, cols, rows, len, rad, matl) => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = x0 + i * rad * 2.1 + (j % 2) * rad, y = 27.35 + rad + j * rad * 1.8;
      pipeStacks.push([new THREE.Vector3(x, y, z0 + len / 2), len, rad, matl]);
    }
    for (const z of [z0 + 1, z0 + len / 2, z0 + len - 1]) {
      B.box(cols * rad * 2.2 + 0.4, 0.25, 0.3, m.dark, [x0 + cols * rad + 0.0, 27.3, z]);
      B.box(0.2, rows * rad * 1.9 + 0.6, 0.2, m.yellowClean, [x0 - 0.4, 27.3 + rows * rad, z]);
      B.box(0.2, rows * rad * 1.9 + 0.6, 0.2, m.yellowClean, [x0 + cols * rad * 2.15 + 0.2, 27.3 + rows * rad, z]);
    }
  };
  stack(-36, 16, 22, 5, 12, 0.09, m.pipe);
  stack(-31, 30.5, 18, 5, 12, 0.09, m.pipe);
  stack(-14, 17, 12, 4, 12.5, 0.17, m.casing);
  stack(5, 18, 9, 4, 12.5, 0.25, m.casing);
  stack(16, 18, 9, 3, 12.5, 0.25, m.green);
  for (const [p, len, rad, matl] of pipeStacks) B.add(pipeGeo, matl, mat4([p.x, p.y, p.z], [Math.PI / 2, 0, 0], [rad / 0.09, len, rad / 0.09]));

  // ---------------- MODULES ----------------
  // living quarters (aft, -z)
  B.boxMM([-36, 27, -46], [26, 42.5, -31], m.windows);
  B.boxMM([-36.3, 42.5, -46.3], [26.3, 43.0, -30.7], m.grey);
  B.boxMM([-30, 43, -44], [-6, 46.5, -34], m.white);                 // bridge / radio room
  B.boxMM([-29.9, 44.2, -44.1], [-6.1, 45.8, -43.9], m.glass);
  B.pipe([-8, 46.5, -40], [-8, 54, -40], 0.15, m.white);             // mast
  B.box(2.6, 0.2, 0.3, m.white, [-8, 52, -40]);
  B.cyl(1.0, 0.8, m.whiteClean, [-12, 47.3, -38], [0, 0, 0], 20);    // radome
  B.sphere(0.25, m.lampRed, [-8, 54.3, -40], 8);
  // name board on LQ +x end and -z face
  const nameMat = new THREE.MeshStandardMaterial({ map: textTex('NORDLYS', { w: 2048, h: 256, color: '#1f3b63', font: '800 210px Inter, sans-serif' }), transparent: true, roughness: 0.6 });
  const nameBoard = new THREE.Mesh(new THREE.PlaneGeometry(30, 3.75), nameMat);
  nameBoard.position.set(-5, 39.6, -46.08); nameBoard.rotation.y = Math.PI;
  root.add(nameBoard);
  // helideck (octagon, cantilevered aft over the LQ)
  const hd = new THREE.Group();
  const hdGeo = new THREE.CylinderGeometry(13, 13, 0.5, 8, 1);
  hdGeo.rotateY(Math.PI / 8);
  const hdMat = new THREE.MeshStandardMaterial({ roughness: 0.75, metalness: 0.1 });
  const hdTop = new THREE.MeshStandardMaterial({ map: helideckTex(), roughness: 0.8 });
  const hdMesh = new THREE.Mesh(hdGeo, [hdMat, hdTop, hdMat]);
  hdMat.color.set('#4b5257');
  hdMesh.position.set(-20, 45.6, -50);
  hdMesh.receiveShadow = true; hdMesh.castShadow = true;
  // fix top-face UVs of cylinder cap: CylinderGeometry cap UVs are already radial 0..1
  hd.add(hdMesh);
  root.add(hd);
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const px = -20 + Math.cos(a) * 12.8, pz = -50 + Math.sin(a) * 12.8;
    B.sphere(0.18, m.lampGreen, [px, 46.0, pz], 6);
    if (pz < -40) B.beam([px, 45.3, pz], [-20 + Math.cos(a) * 6, 33, -43.5], 0.45, m.white);
  }
  B.beam([-26, 45.3, -38], [-26, 42.6, -36], 0.5, m.white);
  B.beam([-14, 45.3, -38], [-14, 42.6, -36], 0.5, m.white);
  // windsock
  B.pipe([-33.5, 45.8, -55], [-33.5, 49.5, -55], 0.06, m.whiteClean);
  B.cyl(0.35, 2.0, m.orange, [-33.5, 49.4, -56], [Math.PI / 2.4, 0, 0], 10, 0.15);
  // free-fall lifeboats on ramps at the aft edge
  const lifeboats = [];
  for (const x of [6, 15]) {
    B.beam([x, 30, -44], [x, 26.2, -50.5], 0.4, m.white);
    const lb = new Builder();
    lb.cyl(1.6, 9.5, m.orange, [0, 0, 0], [Math.PI / 2, 0, 0], 16, 1.6);
    lb.cyl(1.6, 1.8, m.orange, [0, 0, -5.5], [Math.PI / 2, 0, 0], 16, 0.5);
    lb.box(2.4, 1.2, 4.5, m.orange, [0, 1.5, 1.0]);
    lb.box(2.0, 0.6, 2.5, m.glass, [0, 2.0, 0.6]);
    const g = lb.build();
    g.position.set(x, 30.8, -47.2);
    g.rotation.x = 0.55;
    root.add(g);
    lifeboats.push(g);
  }
  // engine / power module (+x, mid-aft) with exhaust funnels
  B.boxMM([16, 27, -29], [38, 36, -8], m.white);
  for (let i = 0; i < 6; i++) {
    const x = 19 + (i % 3) * 7, z = -24 + Math.floor(i / 3) * 9;
    B.cyl(0.8, 6, m.grey, [x, 39, z], [0, 0, 0], 16);
    B.cyl(0.82, 0.6, m.black, [x, 42.1, z], [0, 0, 0], 16);
  }
  for (let i = 0; i < 18; i++) B.box(0.1, 1.4, 1.0, m.dark, [38.05, 31, -27 + i * 1.1]);
  // mud module (-x, mid-aft)
  B.boxMM([-38, 27, -29], [-16, 35, -8], m.grey);
  for (let i = 0; i < 4; i++) B.cyl(1.4, 3, m.whiteClean, [-34 + i * 5, 36.5, -18], [0, 0, 0], 18);
  B.boxMM([-38, 35, -29], [-30, 37.5, -22], m.white);
  // misc containers
  const cont = [['#2e6db4', [24, 27, 4], 0], ['#c7372f', [24, 27, 8], 0], ['#2f8a57', [31, 27, 4], 0], ['#e7a923', [-26, 27, 4], 0],
    ['#e9e9e9', [-26, 27, 8.5], 0], ['#2e6db4', [-33, 27, 0], Math.PI / 2], ['#d35e1f', [31, 27, 12], 0], ['#3c4b5e', [24, 27, 12], 0]];
  for (const [c, p, ry] of cont) {
    const cm = new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0.3 });
    B.box(6.0, 2.6, 2.4, cm, [p[0], p[1] + 1.3, p[2]], [0, ry, 0]);
  }

  // ---------------- CRANES ----------------
  const cranes = [];
  const makeCrane = (pos, yaw, boomLen = 48, rest = -0.06) => {
    const cb = new Builder();
    cb.cyl(1.9, 9, m.yellow, [0, 4.5, 0], [0, 0, 0], 24);
    const ped = cb.build();
    const house = new Builder();
    house.box(5.5, 3.6, 4.2, m.yellowClean, [0, 1.8, -0.6]);
    house.box(2.0, 2.2, 1.9, m.glass, [1.8, 2.6, 1.3]);
    house.box(3.0, 5.0, 1.0, m.yellowClean, [0, 2.5, 1.6]);
    house.truss([0, 1.5, 2.2], [0, 1.5 + Math.sin(rest) * boomLen, 2.2 + Math.cos(rest) * boomLen], 1.6, 1.6, 2.2, m.yellowClean, 0.22, 0.09);
    const hg = house.build();
    hg.position.y = 9;
    const g = new THREE.Group();
    g.add(ped, hg);
    g.position.set(...pos);
    hg.rotation.y = yaw;
    root.add(g);
    cranes.push({ group: g, house: hg });
  };
  makeCrane([35.5, 27, 39], Math.PI * 1.02);
  makeCrane([-35.5, 27, -2], Math.PI * 0.03);

  // ---------------- BURNER BOOMS ----------------
  B.truss([36, 25, 40], [62, 31, 66], 2.2, 2.2, 2.6, m.whiteClean, 0.22, 0.09);
  B.truss([-36, 25, 40], [-62, 31, 66], 2.2, 2.2, 2.6, m.whiteClean, 0.22, 0.09);
  B.cyl(0.9, 2.2, m.dark, [62.5, 32, 66.5], [0, 0, 0], 12);
  B.cyl(0.9, 2.2, m.dark, [-62.5, 32, 66.5], [0, 0, 0], 12);

  // deck flood lights (bulbs) for night scenes
  for (const [x, z] of [[-38, -10], [-38, 20], [38, 20], [38, -5], [0, 44], [-20, -30], [20, -30], [-20, 44], [20, 44]]) {
    B.pipe([x, 27, z], [x, 33, z], 0.1, m.grey);
    B.box(0.8, 0.5, 0.5, m.lampWhite, [x, 33.2, z]);
  }

  const hull = B.build();
  root.add(hull);

  // ---------------- MOVING EQUIPMENT ----------------
  const td = makeTopDrive(m);
  td.position.set(R.wcMain.x, R.floorY + 6, R.wcMain.z);
  root.add(td);
  const tdAux = makeTopDrive(m);
  tdAux.position.set(R.wcAux.x, R.floorY + 18, R.wcAux.z);
  root.add(tdAux);

  // drill lines between crown and block (12 falls rendered as 6 visible strands per side)
  const lineMat = new THREE.MeshStandardMaterial({ color: '#3b4045', roughness: 0.45, metalness: 0.8, emissive: new THREE.Color('#ffb23f'), emissiveIntensity: 0 });
  const lineGeo = new THREE.CylinderGeometry(0.03, 0.03, 1, 6, 1);
  const makeLines = (z) => {
    const g = new THREE.InstancedMesh(lineGeo, lineMat, 12);
    g.userData.z = z;
    root.add(g);
    return g;
  };
  const linesMain = makeLines(R.wcMain.z), linesAux = makeLines(R.wcAux.z);
  const fastLine = new THREE.Mesh(lineGeo, lineMat); root.add(fastLine);
  const fastLineAux = new THREE.Mesh(lineGeo, lineMat); root.add(fastLineAux);
  const _m4 = new THREE.Matrix4();
  const setLines = (inst, z, blockTop) => {
    for (let i = 0; i < 12; i++) {
      const x = -0.66 + (i % 6) * 0.24 + (i >= 6 ? 0.06 : 0);
      const zz = z + (i >= 6 ? 0.35 : -0.35);
      const a = new THREE.Vector3(x, blockTop, zz), b = new THREE.Vector3(x, 94.2, zz);
      const len = b.y - a.y;
      _m4.compose(new THREE.Vector3(x, (a.y + b.y) / 2, zz), new THREE.Quaternion(), new THREE.Vector3(1, len, 1));
      inst.setMatrixAt(i, _m4);
    }
    inst.instanceMatrix.needsUpdate = true;
  };
  const setFast = (mesh, z) => {
    const a = new THREE.Vector3(0.6, 94.2, z), b = new THREE.Vector3(12.2, 43.2, z + (z > 0 ? 1.5 : -1.5));
    const d = new THREE.Vector3().subVectors(b, a);
    mesh.position.copy(a).add(b).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize());
    mesh.scale.set(1, d.length(), 1);
  };
  setFast(fastLine, R.wcMain.z); setFast(fastLineAux, R.wcAux.z);

  const racker = makeRacker(m);
  racker.position.set(-2.2, R.floorY, 2);
  root.add(racker);
  const rackerAux = makeRacker(m);
  rackerAux.position.set(-2.2, R.floorY, -2.5);
  rackerAux.rotation.y = 0;
  root.add(rackerAux);
  const roughneck = makeRoughneck(m);
  roughneck.position.set(4.8, R.floorY, R.wcMain.z + 2.4);
  root.add(roughneck);
  const roughneckAux = makeRoughneck(m);
  roughneckAux.position.set(4.8, R.floorY, R.wcAux.z - 2.4);
  root.add(roughneckAux);

  // stands in the setback (instanced) — rows along x, columns along z
  const standGeo = new THREE.CylinderGeometry(0.084, 0.084, 1, 8, 1);
  const tjGeo = new THREE.CylinderGeometry(0.11, 0.11, 1, 8, 1);
  const standSlots = [];
  for (let i = 0; i < 10; i++) for (let j = 0; j < 16; j++) standSlots.push(new THREE.Vector3(-7.36 + i * 0.48, 40.25, -4.5 + j * 0.6));
  const stands = new THREE.InstancedMesh(standGeo, m.pipe, standSlots.length);
  const joints = new THREE.InstancedMesh(tjGeo, m.steel, standSlots.length * 3);
  standSlots.forEach((p, i) => {
    stands.setMatrixAt(i, mat4([p.x, p.y + R.standLen / 2, p.z], [0, 0, 0], [1, R.standLen, 1]));
    for (let k = 0; k < 3; k++) joints.setMatrixAt(i * 3 + k, mat4([p.x, p.y + 0.4 + k * 9.4, p.z], [0, 0, 0], [1, 0.6, 1]));
  });
  stands.castShadow = joints.castShadow = true;
  root.add(stands, joints);
  const hideStand = (idx) => {
    stands.setMatrixAt(idx, mat4([0, -500, 0], [0, 0, 0], [0.001, 0.001, 0.001]));
    for (let k = 0; k < 3; k++) joints.setMatrixAt(idx * 3 + k, mat4([0, -500, 0], [0, 0, 0], [0.001, 0.001, 0.001]));
    stands.instanceMatrix.needsUpdate = joints.instanceMatrix.needsUpdate = true;
  };

  // a free stand that can be animated (moved by racker / hanging from elevator)
  const freeStand = new THREE.Group();
  {
    const fb = new Builder();
    fb.cyl(0.084, R.standLen, m.pipe, [0, R.standLen / 2, 0], [0, 0, 0], 10);
    for (let k = 0; k < 3; k++) fb.cyl(0.11, 0.6, m.steel, [0, 0.4 + k * 9.4, 0], [0, 0, 0], 10);
    fb.cyl(0.11, 0.5, m.steel, [0, R.standLen - 0.2, 0], [0, 0, 0], 10);
    fb.build(freeStand);
  }
  freeStand.visible = false;
  root.add(freeStand);

  // drill string stub in the main WC (from floor down through moonpool)
  const stringStub = new THREE.Mesh(new THREE.CylinderGeometry(0.084, 0.084, 1, 10, 1), m.pipe);
  root.add(stringStub);
  const setStringTop = (y) => {
    const bottom = -5;
    stringStub.position.set(R.wcMain.x, (y + bottom) / 2, R.wcMain.z);
    stringStub.scale.set(1, y - bottom, 1);
  };
  setStringTop(R.floorY + 1.0);

  // power slips (wedges) in main rotary
  const slips = new Builder();
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    slips.box(0.32, 0.5, 0.22, m.darkSteel, [Math.cos(a) * 0.32, 0.3, Math.sin(a) * 0.32], [0, -a, 0]);
  }
  const slipsG = slips.build();
  slipsG.position.copy(R.wcMain);
  root.add(slipsG);

  // riser tensioners + telescopic joint + diverter under the drill floor (main WC)
  const tens = new Builder();
  for (let k = 0; k < 6; k++) {
    const a = (k / 6) * Math.PI * 2;
    const x = R.wcMain.x + Math.cos(a) * 3.2, z = R.wcMain.z + Math.sin(a) * 3.2;
    tens.cyl(0.32, 8, m.steel, [x, 32, z], [0, 0, 0], 12);
    tens.cyl(0.42, 5, m.yellowClean, [x, 35.5, z], [0, 0, 0], 12);
    tens.pipe([x, 28, z], [R.wcMain.x + Math.cos(a) * 0.9, 22.5, R.wcMain.z + Math.sin(a) * 0.9], 0.12, m.steel);
  }
  tens.cyl(1.05, 1.0, m.dark, [R.wcMain.x, 22.5, R.wcMain.z], [0, 0, 0], 24);   // tension ring
  tens.cyl(0.55, 16, m.steel, [R.wcMain.x, 30.5, R.wcMain.z], [0, 0, 0], 20);    // inner barrel
  tens.cyl(0.62, 8, m.yellowClean, [R.wcMain.x, 18.5, R.wcMain.z], [0, 0, 0], 20); // outer barrel
  tens.cyl(0.9, 1.6, m.dark, [R.wcMain.x, 38.2, R.wcMain.z], [0, 0, 0], 24);     // diverter
  const tensG = tens.build();
  root.add(tensG);

  // riser below the rig down to the seabed (marine riser, 21" OD with C&K lines)
  const riser = new THREE.Group();
  {
    const rb = new Builder();
    const top = 14, bot = -waterDepth + 15;
    rb.cyl(0.27, top - bot, m.yellowClean, [R.wcMain.x, (top + bot) / 2, R.wcMain.z], [0, 0, 0], 20);
    rb.pipe([R.wcMain.x + 0.45, bot, R.wcMain.z], [R.wcMain.x + 0.45, top, R.wcMain.z], 0.065, m.steel);
    rb.pipe([R.wcMain.x - 0.45, bot, R.wcMain.z], [R.wcMain.x - 0.45, top, R.wcMain.z], 0.065, m.steel);
    for (let y = bot; y < top; y += 22.86) rb.cyl(0.5, 0.5, m.darkSteel, [R.wcMain.x, y, R.wcMain.z], [0, 0, 0], 20);
    for (let y = bot + 6; y < top; y += 7.6) rb.box(1.25, 0.25, 0.3, m.darkSteel, [R.wcMain.x, y, R.wcMain.z]);
    rb.build(riser);
  }
  root.add(riser);

  // ---------------- ANCHOR LINES (outside root: chains are fixed to the seabed) ----------------
  const anchors = new THREE.Group();
  const chainMat = new THREE.MeshStandardMaterial({ color: '#3d3a37', roughness: 0.85, metalness: 0.4 });
  const anchorPts = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const a of [0.35, -0.35]) {
    const ang = Math.atan2(sz * 1.0, sx * 0.84) + a;
    const x = sx * R.pontoonX + Math.cos(Math.atan2(sz, sx) + a) * 8.4, z = sz * R.columnZ + Math.sin(Math.atan2(sz, sx) + a) * 8.4;
    const from = new THREE.Vector3(x, -13, z);
    const dir = new THREE.Vector2(Math.cos(ang), Math.sin(ang));
    const pts = catenaryPoints(from, dir, 900, waterDepth - 13, 400);
    anchorPts.push(pts);
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 160, 0.22, 6, false), chainMat);
    tube.castShadow = false;
    anchors.add(tube);
    // anchor at the end
    const e = pts[pts.length - 1];
    const ab = new Builder();
    ab.box(4, 1.2, 6, m.dark, [0, 0.6, 0]);
    ab.box(1.2, 3.5, 0.6, m.dark, [0, 1.6, 2.4], [0.6, 0, 0]);
    const ag = ab.build();
    ag.position.set(e.x, e.y, e.z);
    ag.rotation.y = -ang + Math.PI / 2;
    anchors.add(ag);
  }

  // robot arm (trial installation) on a floor rail next to the main well centre
  const robot = makeRobotArm(m);
  robot.group.position.set(-1.9, R.floorY, 8.9);
  robot.group.rotation.y = 2.55;
  robot.group.visible = false;
  root.add(robot.group);

  // X-ray mode: ghost every mesh except the kept groups
  const ghost = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.6, 0.85), transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending });
  const xrayKeep = new Set();
  const isKept = (o) => { for (let p = o; p; p = p.parent) if (xrayKeep.has(p)) return true; return false; };

  // ---------------- PUBLIC API ----------------
  const columns = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) columns.push([sx * R.pontoonX, sz * R.columnZ, 7.5, 3.6]);
  const state = { tdY: R.floorY + 6, tdAuxY: R.floorY + 18 };
  const api = {
    root, anchors, riser, td, tdAux, racker, rackerAux, roughneck, roughneckAux, slips: slipsG, freeStand, stands, hideStand, standSlots,
    cranes, lifeboats, redZones, hull, tensioners: tensG, stringStub, setStringTop, anchorPts,
    crownG, drawworksG, linesMain, linesAux, fastLine, fastLineAux, lineMat, cabin, cabinGlass, robot,
    /** Restore every animated part to its default pose (called before each shot). */
    resetPose() {
      standSlots.forEach((p, i) => {
        stands.setMatrixAt(i, mat4([p.x, p.y + R.standLen / 2, p.z], [0, 0, 0], [1, R.standLen, 1]));
        for (let k = 0; k < 3; k++) joints.setMatrixAt(i * 3 + k, mat4([p.x, p.y + 0.4 + k * 9.4, p.z], [0, 0, 0], [1, 0.6, 1]));
      });
      stands.instanceMatrix.needsUpdate = joints.instanceMatrix.needsUpdate = true;
      racker.position.set(-2.2, R.floorY, 2); racker.rotation.set(0, 0, 0);
      rackerAux.position.set(-2.2, R.floorY, -2.5); rackerAux.rotation.set(0, 0, 0);
      for (const rk of [racker, rackerAux]) for (const a of [rk.userData.lower, rk.userData.upper]) a.scale.x = 1;
      roughneck.position.set(4.8, R.floorY, R.wcMain.z + 2.4);
      roughneckAux.position.set(4.8, R.floorY, R.wcAux.z - 2.4);
      slipsG.position.copy(R.wcMain);
      freeStand.visible = false; freeStand.rotation.set(0, 0, 0);
      if (api.auxStand) api.auxStand.visible = false;
      robot.pose(0, 0.25, 1.2, 0.5, 0);
      robot.group.visible = false;
      cabinGlassMat.opacity = 1; cabinGlassMat.depthWrite = true;
      redZones.children.forEach((z) => { z.material.opacity = 0.85; });
      lineMat.emissiveIntensity = 0;
      api.xray(null);
      setStringTop(R.floorY + 1.0);
    },
    /** Ghost the rig except `keep` objects; opacity controls ghost strength. Call with null to restore. */
    xray(keep, opacity = 0.1) {
      xrayKeep.clear();
      if (keep) keep.forEach((k) => xrayKeep.add(k));
      ghost.opacity = opacity;
      root.traverse((o) => {
        if (!o.isMesh) return;
        if (o.userData.origMat === undefined) o.userData.origMat = o.material;
        o.material = keep && !isKept(o) ? ghost : o.userData.origMat;
        o.castShadow = !(keep && !isKept(o));
      });
    },
    columns,
    /** Elevator height (rig-local y) of main / aux top drive. */
    setTopDrive(y, yAux = state.tdAuxY) {
      state.tdY = y; state.tdAuxY = yAux;
      td.position.y = y; tdAux.position.y = yAux;
      setLines(linesMain, R.wcMain.z, y + 12.9);
      setLines(linesAux, R.wcAux.z, yAux + 12.9);
    },
    setMotion(heave = 0, pitch = 0, roll = 0, x = 0, z = 0, yaw = 0) {
      root.position.set(x, heave, z);
      root.rotation.set(pitch, yaw, roll);
    },
    worldColumns() {
      root.updateMatrixWorld();
      return columns.map(([x, z, h, r]) => {
        const p = new THREE.Vector3(x, 0, z).applyMatrix4(root.matrixWorld);
        return [p.x, p.z, h, r];
      });
    },
    local(v) { root.updateMatrixWorld(); return V(v).clone().applyMatrix4(root.matrixWorld); },
  };
  api.setTopDrive(state.tdY, state.tdAuxY);
  return api;
}
