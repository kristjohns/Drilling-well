// Smaller sets: shear-ram cutaway, onshore operations centre, battery container, floating wind.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { rng, mat4, lerp, clamp, smooth } from '../engine/util.js';
import { textTex } from '../engine/textures.js';

// ---------------------------------------------------------------- shear ram cutaway
export function createShear() {
  const m = materials();
  const g = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: '#4a5056', roughness: 0.45, metalness: 0.8 });
  const cut = new THREE.MeshStandardMaterial({ color: '#8e979e', roughness: 0.35, metalness: 0.9 });
  const B = new Builder();
  // ram body cut away at z = 0: a horizontal ram cavity with top/bottom slabs and a back wall
  B.boxMM([-2.4, 0.5, -1.0], [2.4, 0.95, 0], body);
  B.boxMM([-2.4, -0.95, -1.0], [2.4, -0.5, 0], body);
  B.boxMM([-2.4, -0.5, -1.0], [2.4, 0.5, -0.92], body);
  B.boxMM([-2.4, 0.93, -0.02], [2.4, 0.95, 0.0], cut);
  B.boxMM([-2.4, -0.95, -0.02], [2.4, -0.93, 0.0], cut);
  B.cyl(0.6, 1.4, m.red, [-3.1, 0, -0.5], [0, 0, Math.PI / 2], 24);
  B.cyl(0.6, 1.4, m.red, [3.1, 0, -0.5], [0, 0, Math.PI / 2], 24);
  B.boxMM([-0.5, 0.95, -1.0], [0.5, 1.8, -0.1], body);
  B.boxMM([-0.5, -1.8, -1.0], [0.5, -0.95, -0.1], body);
  g.add(B.build());
  // rams with blades (upper blade on the left ram, lower blade on the right ram)
  const ramMat = new THREE.MeshStandardMaterial({ color: '#b7bec4', roughness: 0.25, metalness: 0.95 });
  const mk = (sx) => {
    const rb = new Builder();
    rb.boxMM([0.06, -0.48, -0.9], [1.9, 0.48, -0.05], ramMat);
    const bladeY = sx < 0 ? 0.12 : -0.12;
    const sh = new THREE.Shape();
    sh.moveTo(0, -0.12); sh.lineTo(-0.5, -0.12); sh.lineTo(-0.85, 0.0); sh.lineTo(-0.5, 0.12); sh.lineTo(0, 0.12);
    const bg = new THREE.ExtrudeGeometry(sh, { depth: 0.85, bevelEnabled: false });
    bg.translate(0, 0, -0.88);
    rb.add(bg, ramMat, mat4([0, bladeY, 0]));
    rb.boxMM([0.05, -0.5, -0.9], [0.25, 0.5, -0.02], new THREE.MeshStandardMaterial({ color: '#111', roughness: 0.9 }));
    const r = rb.build();
    if (sx > 0) { r.scale.x = -1; }
    const holder = new THREE.Group(); holder.add(r);
    g.add(holder);
    return holder;
  };
  const ramL = mk(-1), ramR = mk(1);
  // pipe (two halves so it can separate)
  const pipeMat = new THREE.MeshStandardMaterial({ color: '#c3cace', roughness: 0.35, metalness: 0.6 });
  const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.064, 0.064, 4, 28, 1, false), pipeMat);
  const lower = upper.clone();
  upper.geometry = upper.geometry.clone(); upper.geometry.translate(0, 2, -0.46);
  lower.geometry = lower.geometry.clone(); lower.geometry.translate(0, -2, -0.46);
  g.add(upper, lower);
  const inner = new THREE.MeshStandardMaterial({ color: '#2b2f33', roughness: 0.6, side: THREE.BackSide });
  // sparks
  const sparkMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.7, 0.3).multiplyScalar(6), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sparks = new THREE.InstancedMesh(new THREE.BoxGeometry(0.006, 0.006, 0.06), sparkMat, 120);
  const r = rng(3);
  const sseeds = Array.from({ length: 120 }, () => [r() * Math.PI * 2, r() * 0.8 + 0.2, r()]);
  g.add(sparks);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
  return {
    group: g,
    /** k: 0 open → 1 closed (cut at 0.55). */
    set(k, t) {
      const close = smooth(clamp(k));
      const gap = lerp(1.2, -0.02, close);
      ramL.position.x = -gap - 0.0;
      ramR.position.x = gap + 0.0;
      const cutK = clamp((k - 0.55) / 0.2);
      upper.position.y = cutK * 0.25; upper.scale.x = 1 - cutK * 0.25;
      lower.position.y = -cutK * 0.1; lower.scale.x = 1 - cutK * 0.25;
      const sp = clamp((k - 0.5) / 0.35);
      sparks.visible = sp > 0 && sp < 1;
      sparkMat.opacity = 1 - sp;
      sseeds.forEach(([a, s, c], i) => {
        const d = sp * s * 0.9;
        const v = new THREE.Vector3(Math.cos(a) * d, (c - 0.5) * 0.3 * sp, -0.46 + Math.abs(Math.sin(a)) * d * 0.6 + 0.05);
        q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), v.clone().normalize());
        m4.compose(v, q, new THREE.Vector3(1, 1, 1 + sp * 2));
        sparks.setMatrixAt(i, m4);
      });
      sparks.instanceMatrix.needsUpdate = true;
    },
  };
}

// ---------------------------------------------------------------- onshore operations centre
function wallTexture() {
  const c = document.createElement('canvas'); c.width = 2048; c.height = 512;
  const g = c.getContext('2d');
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const draw = (t) => {
    g.fillStyle = '#04080c'; g.fillRect(0, 0, 2048, 512);
    const panel = (x, y, w, h, title) => {
      g.fillStyle = '#0b1620'; g.fillRect(x, y, w, h);
      g.fillStyle = '#12304a'; g.fillRect(x, y, w, 26);
      g.fillStyle = '#9fd8ff'; g.font = '600 17px Inter, sans-serif'; g.fillText(title, x + 10, y + 18);
    };
    panel(10, 10, 480, 492, 'RIG STATUS · 6 RIGS ONLINE');
    ['NORDLYS', 'RIG B', 'RIG C', 'RIG D', 'RIG E', 'RIG F'].forEach((n, i) => {
      const y = 60 + i * 72;
      g.fillStyle = '#16283a'; g.fillRect(24, y, 452, 60);
      g.fillStyle = '#e8f2fa'; g.font = '700 22px Inter, sans-serif'; g.fillText(n, 40, y + 38);
      g.fillStyle = i === 0 ? '#ffb23f' : '#6dff9a'; g.beginPath(); g.arc(440, y + 30, 9, 0, 7); g.fill();
      g.fillStyle = '#7aa3c0'; g.font = '500 17px Inter, sans-serif'; g.fillText(i === 0 ? 'DRILLING 12¼″ · AUTO' : ['TRIPPING', 'DRILLING 8½″', 'CEMENTING', 'RUNNING CASING', 'DRILLING 17½″'][i - 1], 210, y + 37);
    });
    panel(500, 10, 1000, 300, 'DRILLING PARAMETERS · NORDLYS · LIVE');
    const cols = ['#ffb23f', '#5fd3ff', '#7dff9b', '#ff7b7b'];
    ['ROP', 'WOB', 'RPM', 'TORQUE'].forEach((lab, k) => {
      g.strokeStyle = cols[k]; g.lineWidth = 2.5; g.beginPath();
      for (let x = 0; x < 960; x += 4) {
        const v = Math.sin((x + t * 60) * 0.02 * (k + 1)) * 0.5 + Math.sin((x + t * 35) * 0.07 + k * 2) * 0.3;
        const y = 70 + k * 60 + v * 18;
        x ? g.lineTo(520 + x, y) : g.moveTo(520 + x, y);
      }
      g.stroke();
      g.fillStyle = cols[k]; g.font = '700 16px Inter, sans-serif'; g.fillText(lab, 1450, 70 + k * 60);
    });
    panel(500, 320, 490, 182, 'WELL TRAJECTORY');
    g.strokeStyle = '#ffb23f'; g.lineWidth = 4; g.beginPath(); g.moveTo(560, 350);
    g.bezierCurveTo(560, 450, 640, 470, 960, 470); g.stroke();
    g.fillStyle = '#ffffff'; g.beginPath(); g.arc(960, 470, 6, 0, 7); g.fill();
    panel(1000, 320, 500, 182, 'AUTOMATION · CLOSED LOOP');
    g.fillStyle = '#6dff9a'; g.font = '800 34px Inter, sans-serif'; g.fillText('● AUTO DRILLING ON', 1030, 400);
    g.fillStyle = '#9fb6c8'; g.font = '500 18px Inter, sans-serif'; g.fillText('steering · vibration · hole cleaning · safeguards', 1030, 440);
    panel(1510, 10, 528, 492, 'DIGITAL TWIN · PRESSURE MODEL');
    g.strokeStyle = '#2a4a66'; g.lineWidth = 1;
    for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(1530, 60 + i * 50); g.lineTo(2020, 60 + i * 50); g.stroke(); }
    g.strokeStyle = '#ff7b7b'; g.lineWidth = 3; g.beginPath(); g.moveTo(1620, 60); g.lineTo(1700, 480); g.stroke();
    g.strokeStyle = '#5fd3ff'; g.beginPath(); g.moveTo(1880, 60); g.lineTo(1990, 480); g.stroke();
    g.strokeStyle = '#ffb23f'; g.lineWidth = 4; g.beginPath(); g.moveTo(1750, 60);
    for (let i = 0; i <= 42; i++) g.lineTo(1750 + i * 2.2 + Math.sin(i * 0.6 + t * 2) * 6, 60 + i * 10);
    g.stroke();
    tex.needsUpdate = true;
  };
  draw(0);
  return { tex, draw };
}

export function createControlRoom(rigRoot) {
  const m = materials();
  const g = new THREE.Group();
  const B = new Builder();
  const wallM = new THREE.MeshStandardMaterial({ color: '#10161c', roughness: 0.8 });
  const floorM = new THREE.MeshStandardMaterial({ color: '#0e1216', roughness: 0.35, metalness: 0.3 });
  const deskM = new THREE.MeshStandardMaterial({ color: '#1d242b', roughness: 0.5, metalness: 0.3 });
  B.boxMM([-16, -0.1, -12], [16, 0, 12], floorM);
  B.boxMM([-16, 6, -12], [16, 6.2, 12], wallM);
  B.boxMM([-16, 0, 12], [16, 6, 12.2], wallM);
  B.boxMM([-16.2, 0, -12], [-16, 6, 12], wallM);
  B.boxMM([16, 0, -12], [16.2, 6, 12], wallM);
  for (let x = -12; x <= 12; x += 6) B.box(4, 0.06, 0.25, m.lampWhite, [x, 5.95, 0]);
  // desks (3 curved rows) with monitors
  const monitors = [];
  for (let row = 0; row < 3; row++) {
    const rad = 7 + row * 3.2;
    for (let k = -3; k <= 3; k++) {
      const a = k * 0.16;
      const x = Math.sin(a) * rad, z = -9 + Math.cos(a) * rad;
      B.box(1.9, 0.08, 0.9, deskM, [x, 0.76, z], [0, a, 0]);
      B.box(1.8, 0.7, 0.1, deskM, [x - Math.sin(a) * 0.4, 0.38, z + Math.cos(a) * 0.4], [0, a, 0]);
      monitors.push([x - Math.sin(a) * 0.25, z - Math.cos(a) * 0.25, a]);
    }
  }
  g.add(B.build());
  const monTexs = [0, 1, 2].map((i) => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 160;
    const gg = c.getContext('2d');
    gg.fillStyle = '#071018'; gg.fillRect(0, 0, 256, 160);
    gg.strokeStyle = ['#ffb23f', '#5fd3ff', '#7dff9b'][i]; gg.lineWidth = 3; gg.beginPath();
    for (let x = 0; x < 256; x += 6) { const y = 80 + Math.sin(x * 0.05 + i) * 30; x ? gg.lineTo(x, y) : gg.moveTo(x, y); }
    gg.stroke();
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  monitors.forEach(([x, z, a], i) => {
    for (const dx of [-0.42, 0.42]) {
      const mon = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.46), new THREE.MeshBasicMaterial({ map: monTexs[(i + (dx > 0 ? 1 : 0)) % 3], toneMapped: false }));
      mon.position.set(x + Math.cos(a) * dx, 1.15, z - Math.sin(a) * dx);
      mon.rotation.y = a + Math.PI;
      g.add(mon);
    }
  });
  // seated operators (simple silhouettes)
  const suit = new THREE.MeshStandardMaterial({ color: '#2a3442', roughness: 0.8 });
  const skin = new THREE.MeshStandardMaterial({ color: '#b98d70', roughness: 0.8 });
  [[0, 0], [2, 1], [-2, 2], [4, 1]].forEach(([k, row]) => {
    const rad = 7 + row * 3.2, a = k * 0.16;
    const x = Math.sin(a) * rad, z = -9 + Math.cos(a) * rad + 0.9;
    const pb = new Builder();
    pb.geo(new THREE.CapsuleGeometry(0.2, 0.45, 4, 10), suit, [0, 0.95, 0]);
    pb.sphere(0.12, skin, [0, 1.48, -0.02], 10);
    pb.box(0.55, 0.45, 0.5, deskM, [0, 0.5, 0.15]);
    pb.geo(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), suit, [-0.24, 1.0, -0.22], [1.2, 0, 0]);
    pb.geo(new THREE.CapsuleGeometry(0.06, 0.4, 4, 8), suit, [0.24, 1.0, -0.22], [1.2, 0, 0]);
    const p = pb.build();
    p.position.set(x, 0, z); p.rotation.y = a;
    g.add(p);
  });
  // curved video wall
  const wall = wallTexture();
  const vw = new THREE.Mesh(new THREE.CylinderGeometry(15, 15, 4.2, 64, 1, true, Math.PI * 0.72, Math.PI * 0.56), new THREE.MeshBasicMaterial({ map: wall.tex, side: THREE.BackSide, toneMapped: false }));
  vw.position.set(0, 3.4, 1.5);
  vw.rotation.y = 0;
  g.add(vw);
  wall.tex.wrapS = THREE.ClampToEdgeWrapping;
  wall.tex.repeat.set(-1, 1); wall.tex.offset.set(1, 0);
  // digital twin hologram: wireframe miniature rig over a glowing disc
  const holo = new THREE.Group();
  const twin = new THREE.Group();
  const lineMat = new THREE.LineBasicMaterial({ color: new THREE.Color(0.3, 0.8, 1.0).multiplyScalar(1.6), transparent: true, opacity: 0.85 });
  const edgeBox = (w, h, d, x, y, z) => {
    const e = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(w, h, d)), lineMat);
    e.position.set(x, y, z); twin.add(e);
  };
  for (const sx of [-1, 1]) { edgeBox(17, 9, 114, sx * 31, -20.5, 0); for (const sz of [-1, 1]) edgeBox(15, 33, 15, sx * 31, 0.5, sz * 37); }
  edgeBox(80, 10, 92, 0, 22, 0);
  edgeBox(30, 1.4, 31, 4, 39.3, 0);
  edgeBox(62, 15.5, 15, -5, 34.7, -38.5);
  // derrick: tapered tower outline
  const dpts = [];
  const lv = 6;
  for (let i = 0; i < lv; i++) {
    const y0 = 40 + i * 52 / lv, y1 = 40 + (i + 1) * 52 / lv, a0 = 9 - i * 5.5 / lv, a1 = 9 - (i + 1) * 5.5 / lv, b0 = 13 - i * 6 / lv, b1 = 13 - (i + 1) * 6 / lv;
    const c0 = [[-a0, y0, -b0], [a0, y0, -b0], [a0, y0, b0], [-a0, y0, b0]], c1 = [[-a1, y1, -b1], [a1, y1, -b1], [a1, y1, b1], [-a1, y1, b1]];
    for (let k = 0; k < 4; k++) { dpts.push(...c0[k], ...c1[k], ...c1[k], ...c1[(k + 1) % 4], ...c0[k], ...c1[(k + 1) % 4]); }
  }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.Float32BufferAttribute(dpts, 3));
  twin.add(new THREE.LineSegments(dg, lineMat));
  twin.scale.setScalar(0.022);
  twin.position.y = 1.6;
  holo.add(twin);
  const wellLine = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.6, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.7, 0.3).multiplyScalar(3) }));
  wellLine.position.set(0, 0.85, 0.13);
  holo.add(wellLine);
  const disc = new THREE.Mesh(new THREE.RingGeometry(1.2, 1.35, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(0.25, 0.75, 1.0).multiplyScalar(2), side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2; disc.position.y = 0.05;
  holo.add(disc);
  holo.position.set(0, 0, -2.5);
  g.add(holo);
  const fill = new THREE.PointLight(0x5fa8ff, 8, 20, 1.5);
  fill.position.set(0, 3.5, -6);
  g.add(fill);
  return { group: g, wall, holo, twin, update(t) { wall.draw(t); holo.rotation.y = t * 0.25; } };
}

// ---------------------------------------------------------------- battery container (on the rig deck)
export function createBattery() {
  const m = materials();
  const g = new THREE.Group();
  const B = new Builder();
  const shell = new THREE.MeshStandardMaterial({ color: '#2d4b63', roughness: 0.55, metalness: 0.4 });
  // 12 m container, front (+z) side open to show the racks
  B.boxMM([0, 0, 0], [12, 0.15, 2.45], m.dark);
  B.boxMM([0, 2.6, 0], [12, 2.75, 2.45], shell);
  B.boxMM([0, 0, 0], [12, 2.75, 0.1], shell);
  B.boxMM([0, 0, 0], [0.1, 2.75, 2.45], shell);
  B.boxMM([11.9, 0, 0], [12, 2.75, 2.45], shell);
  for (let x = 0.4; x < 11.6; x += 0.75) B.boxMM([x, 0.15, 0.3], [x + 0.62, 2.4, 1.0], m.dark);
  const leds = [];
  for (let x = 0.4; x < 11.6; x += 0.75) for (let k = 0; k < 9; k++) {
    B.boxMM([x + 0.04, 0.3 + k * 0.23, 1.0], [x + 0.58, 0.48 + k * 0.23, 1.04], m.grey);
    leds.push([x + 0.5, 0.39 + k * 0.23, 1.05]);
  }
  B.boxMM([0.2, 2.3, 1.2], [11.8, 2.45, 1.5], m.yellowClean);   // cable tray
  g.add(B.build());
  const ledMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 1.0, 0.6).multiplyScalar(3) });
  const ledMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), ledMat, leds.length);
  leds.forEach((p, i) => ledMesh.setMatrixAt(i, mat4(p)));
  g.add(ledMesh);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(5, 0.6), new THREE.MeshBasicMaterial({ map: textTex('ENERGY STORAGE', { w: 1024, h: 128, font: '800 90px Inter, sans-serif', color: '#ffffff' }), transparent: true }));
  label.position.set(6, 2.3, -0.02); label.rotation.y = Math.PI;
  g.add(label);
  return { group: g, ledMat };
}

// ---------------------------------------------------------------- floating wind (Hywind-style spar turbines)
export function createWindFarm() {
  const m = materials();
  const g = new THREE.Group();
  const white = new THREE.MeshStandardMaterial({ color: '#e9ecee', roughness: 0.45, metalness: 0.1 });
  const spar = new THREE.MeshStandardMaterial({ color: '#d9b02a', roughness: 0.5 });
  const rotors = [];
  const pos = [[0, 0], [260, -120], [-260, -140], [520, -260], [-520, -280], [130, -420], [-130, -440], [390, -560], [-390, -580], [260, -760], [-260, -780]];
  pos.forEach(([x, z], i) => {
    const B = new Builder();
    B.cyl(7.5, 70, spar, [0, -45, 0], [0, 0, 0], 28, 7.5);
    B.cyl(4.5, 20, spar, [0, 0, 0], [0, 0, 0], 24, 7.5);
    B.cyl(3.2, 92, white, [0, 56, 0], [0, 0, 0], 24, 4.4);
    B.box(4.5, 4.5, 14, white, [0, 103, -2]);
    const t = B.build();
    t.position.set(x, 0, z);
    g.add(t);
    const rotor = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.SphereGeometry(2.2, 16, 10), white);
    rotor.add(hub);
    for (let k = 0; k < 3; k++) {
      const bl = new THREE.Mesh(new THREE.BoxGeometry(3.2, 78, 0.8), white);
      bl.geometry.translate(0, 41, 0);
      const pivot = new THREE.Group();
      pivot.rotation.z = (k / 3) * Math.PI * 2;
      pivot.add(bl);
      rotor.add(pivot);
    }
    rotor.position.set(x, 103, z + 6);
    rotor.userData.ph = i * 0.7;
    g.add(rotor);
    rotors.push(rotor);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.6, 8, 6), m.lampRed);
    lamp.position.set(x, 106, z - 2);
    g.add(lamp);
  });
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return { group: g, update(t) { rotors.forEach((r) => { r.rotation.z = -(t * 0.95 + r.userData.ph); }); } };
}
