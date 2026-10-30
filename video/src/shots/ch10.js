// Chapter 10 — The digital rig: data streams, onshore operations centre, closed-loop automation, digital twin.
// Chapter 11 — Cutting emissions: batteries, power from shore, floating wind.
// Chapter 12 — The finished well, the future, the end.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, smooth, rng, orbit, easeInOut } from '../engine/util.js';
import { rigOnOcean, lineStart, lineEnd, fades, captureAbove, waterSwitch } from './common.js';
import { ensureSets } from './sets.js';
import { ensureWell, wellEnv } from './ch6.js';
import { createControlRoom, createWindFarm } from '../world/misc.js';
import { makePlatform, makeJackup } from '../world/rigtypes.js';
import { Builder } from '../engine/builder.js';
import { TD, sectionStates } from '../world/well.js';
import { SEABED_Y } from '../world/subsea.js';

// ------------------------------------------------------------------ data streams
let STREAMS = null;
function ensureStreams(W) {
  if (STREAMS) return STREAMS;
  const r = rng(77);
  const N = 900;
  const geo = new THREE.SphereGeometry(0.35, 6, 4);
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.85, 1.0).multiplyScalar(3), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.InstancedMesh(geo, mat, N);
  const seeds = Array.from({ length: N }, () => [r(), r(), r(), r()]);
  STREAMS = { mesh, seeds, mat };
  W.addSet('streams', mesh);
  return STREAMS;
}

let ARCS = null;
function ensureArcs(W) {
  if (ARCS) return ARCS;
  const M = W.map;
  const g = new THREE.Group();
  const sta = M.cityDots.Stavanger.position.clone();
  const src = ['Johan Sverdrup', 'Troll', 'Snorre', 'Gullfaks', 'Oseberg', 'Yggdrasil', 'Ekofisk', 'Heidrun', 'Aasta Hansteen', 'Johan Castberg'];
  const lineMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.85, 1.0).multiplyScalar(1.6), transparent: true, opacity: 0.55, depthWrite: false });
  const curves = src.map((n) => {
    const a = M.markers[n].position.clone().setY(12);
    const mid = a.clone().lerp(sta, 0.5); mid.y = 60 + a.distanceTo(sta) * 0.25;
    const c = new THREE.QuadraticBezierCurve3(a, mid, sta.clone().setY(12));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 60, 1.6, 6), lineMat));
    return c;
  });
  const dotMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.6, 0.95, 1.0).multiplyScalar(4) });
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(4, 8, 6), dotMat, curves.length * 6);
  g.add(dots);
  g.userData.overlay = true;
  M.group.add(g);
  ARCS = { g, curves, dots };
  return ARCS;
}

let ROOM = null;
function ensureRoom(W) {
  if (ROOM) return ROOM;
  ROOM = createControlRoom(W.rig.root);
  W.addSet('room', ROOM.group);
  return ROOM;
}

function roomEnv(W) {
  W.show(['room']);
  W.mats.lampWhite.emissiveIntensity = 1.2;
  W.envStudio({ sunDir: [0.2, 1, 0.3], sunI: 0.25, hemi: 0.35, exposure: 1.15, bg: new THREE.Color('#020304'), envI: 0.25, hemiSky: '#6f8fb0' });
}

export const data = {
  look: { bloom: 0.8, bloomThreshold: 1.0, vignette: 0.5 },
  build(W) { ensureSets(W); ensureStreams(W); ensureRoom(W); },
  setup(W) { this._seg = -1; },
  oceanT0: 1400,
  update(W, t, info) {
    const l1 = lineStart(info, 1);
    const cutA = l1 - 0.3, cutB = l1 + 5.6;
    const seg = t < cutA ? 0 : t < cutB ? 1 : 2;
    if (seg !== this._seg) {
      this._seg = seg;
      if (seg === 0) {
        W.show(['sky', 'ocean', 'rig', 'streams']);
        W.envOcean('dusk', { amp: 0.8, exposure: 1.05, lamps: 1.0, skyOverrides: { cover: 0.3 } });
        W.shadowBox([0, 30, 0], 90, 600);
      } else if (seg === 1) {
        W.show(['map']);
        W.envStudio({ bg: new THREE.Color('#03070c'), sunDir: [-0.4, 0.75, 0.5], sunI: 2.4, hemi: 0.5, exposure: 1.0, envI: 0.35 });
        W.shadowBox([0, 0, 0], 1800, 6000);
        W.lights.sun.position.set(-1500, 2600, 1800);
        for (const n of Object.keys(W.map.markers)) W.map.setMarker(n, 0);
        ensureArcs(W).g.visible = true;
        W.map.cityDots.Stavanger.visible = true;
      } else roomEnv(W);
    }
    const ov = W.ov;
    W.post.grade.uniforms.uFade.value = Math.max(0, 1 - Math.min(Math.abs(t - cutA), Math.abs(t - cutB)) / 0.3);
    if (seg === 0) {
      rigOnOcean(W, t + 1400, 0.5);
      W.rig.setTopDrive(54);
      const S = STREAMS, m4 = new THREE.Matrix4();
      S.seeds.forEach(([a, b, c, d], i) => {
        const life = (t * (0.25 + d * 0.3) + a) % 1;
        const x = (b - 0.5) * 70, z = (c - 0.5) * 80;
        const y = 30 + life * 260;
        const s = (1 - life) * 1.4 + 0.2;
        m4.makeScale(s, s * 3, s).setPosition(x + Math.sin(life * 8 + a * 10) * 4, y, z);
        S.mesh.setMatrixAt(i, m4);
      });
      S.mesh.instanceMatrix.needsUpdate = true;
      camPath([[0, [-170, 40, 210], [0, 60, 0], 42], [cutA, [-200, 30, 250], [0, 80, 0], 44]], (u) => u)(t, W.camera);
      ov.chapter(10, 'The Digital Rig', t, 0.2, 2.3);
      ov.stat('sens', { x: 1400, y: 160, value: 1000, unit: '+', label: 'Sensors on board', desc: 'streaming every second', from: 0 }, t, lineStart(info, 0) + 0.6, cutA);
    } else if (seg === 1) {
      const A = ARCS, m4 = new THREE.Matrix4();
      A.curves.forEach((c, i) => { for (let k = 0; k < 6; k++) { const p = c.getPoint(((t * 0.35 + k / 6 + i * 0.13) % 1)); A.dots.setMatrixAt(i * 6 + k, m4.makeTranslation(p.x, p.y, p.z)); } });
      A.dots.instanceMatrix.needsUpdate = true;
      camPath([[cutA, [-150, 1500, 1350], [-150, 0, 100], 40], [cutB, [-230, 1050, 1050], [-230, 0, 200], 40]], (u) => u)(t, W.camera);
      W.camera.near = 10; W.camera.far = 20000; W.camera.updateProjectionMatrix();
      ov.label('stv', { at: W.map.cityDots.Stavanger.position, text: 'Stavanger', sub: 'onshore operations centres', side: 'right', dx: 80, dy: 40 }, t, cutA + 1.0, cutB);
    } else {
      ROOM.update(t);
      camPath([[cutB, [9, 2.4, 10], [0, 2.6, -8], 50], [info.dur, [4, 2.0, 7.5], [-1, 2.8, -9], 50]], (u) => u)(t, W.camera);
      ov.tag('roc', { text: 'Onshore operations centre', sub: 'directional drillers, mud engineers, cementers — working from land' }, t, cutB + 0.6, info.dur);
    }
  },
  teardown() { if (ARCS) ARCS.g.visible = false; },
};

function loopSVG(t, t0) {
  const k = clamp((t - t0) / 1.2);
  const a = (t * 1.4) % (Math.PI * 2);
  const nodes = [['SENSE', 'downhole + rig sensors'], ['DECIDE', 'models & safeguards'], ['ACT', 'steer · pumps · rotation']];
  const R = 130, cx = 170, cy = 170;
  const items = nodes.map(([n, s], i) => {
    const an = -Math.PI / 2 + i * 2 * Math.PI / 3;
    const x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R;
    return `<circle cx="${x}" cy="${y}" r="40" fill="rgba(10,30,45,0.9)" stroke="#5fd3ff" stroke-width="3"/><text x="${x}" y="${y + 6}" text-anchor="middle" fill="#fff" font-family="Inter" font-size="17" font-weight="800">${n}</text>`;
  }).join('');
  const dot = `<circle cx="${cx + Math.cos(a) * R}" cy="${cy + Math.sin(a) * R}" r="8" fill="#ffb23f"/>`;
  return `<div class="note" style="opacity:1;margin-bottom:6px">Closed-loop automation</div><svg width="340" height="340" style="opacity:${k}"><circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="rgba(95,211,255,0.4)" stroke-width="3" stroke-dasharray="8 8"/>${dot}${items}</svg>`;
}

export const auto = {
  look: { bloom: 0.8, bloomThreshold: 1.0, vignette: 0.5 },
  build(W) { ensureRoom(W); },
  setup(W) { roomEnv(W); },
  update(W, t, info) {
    ROOM.update(t);
    const l1 = lineStart(info, 1), l2 = lineStart(info, 2);
    camPath([
      [0, [2, 2.2, 9], [0, 3.2, -10], 48],
      [l1, [-1.5, 2.6, 5], [0, 3.0, -10], 46],
      [l2, [3.0, 2.4, 1.2], [0, 1.4, -2.5], 44],
      [info.dur, [1.8, 2.0, 0.2], [0, 1.3, -2.5], 42],
    ])(t, W.camera);
    const ov = W.ov;
    ov.html('first', { x: 120, y: 120, cls: 'panel', html: '<div class="note" style="opacity:1">February 2025 · Equinor · North Sea</div><div style="font-size:38px;font-weight:800;margin-top:8px;line-height:1.15">World\'s first automated<br/>on-bottom drilling system</div><div style="font-size:21px;opacity:0.85;margin-top:10px">Halliburton LOGIX + Sekal Drilltronics</div>' }, t, 1.0, l1 + 0.5);
    ov.html('loop', { x: 1440, y: 140, cls: 'panel', html: loopSVG(t, l1 + 0.6) }, t, l1 + 0.4, l2 + 0.4);
    ov.label('twin', { at: new THREE.Vector3(0, 2.2, -2.5), text: 'Digital twin', sub: 'the well, modelled in real time', side: 'right', dx: 90, dy: -60, color: '#5fd3ff' }, t, l2 + 0.8, info.dur);
  },
};

// ------------------------------------------------------------------ Chapter 11
export const battery = {
  look: { bloom: 0.6, bloomThreshold: 1.2, vignette: 0.4 },
  build: ensureSets,
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('day', { amp: 0.6, exposure: 1.0, skyOverrides: { sun: [0.62, 0.45, -0.35] } });
    W.shadowBox([20, 30, 15], 60, 500);
    W.battery.group.visible = true;
  },
  oceanT0: 1500,
  update(W, t, info) {
    rigOnOcean(W, t + 1500, 0.5);
    W.rig.setTopDrive(54);
    const l1 = lineStart(info, 1);
    camPath([
      [0, [260, 90, 160], [0, 30, 0], 40],
      [l1 + 0.5, [80, 36, 34], [31, 28.5, 20], 44],
      [info.dur, [52, 31.5, 25], [31, 28.6, 20], 50],
    ])(t, W.camera);
    W.battery.ledMat.color.setRGB(0.3, 1.0, 0.6).multiplyScalar(2 + Math.sin(t * 3));
    const ov = W.ov;
    ov.chapter(11, 'Cutting Emissions', t, 0.2, 2.3);
    ov.label('ess', { at: W.rig.local([31.5, 30, 20]), text: 'Battery bank', sub: 'absorbs peaks · instant backup power', side: 'left', dx: 90, dy: -60, color: '#6dff9a' }, t, l1 + 1.4, info.dur);
    ov.stat('fuel', { x: 120, y: 140, value: -15, unit: '%', label: 'Fuel use · Transocean Spitsbergen', desc: '5.6 MW energy storage system', from: 0, panel: true }, t, l1 + 5.0, info.dur);
  },
  teardown(W) { W.battery.group.visible = false; },
};

let CABLE = null;
function ensureCable(W) {
  if (CABLE) return CABLE;
  const M = W.map;
  const a = M.markers.Kollsnes.position.clone().setY(10), b = M.markers['Martin Linge'].position.clone().setY(10);
  const mid = a.clone().lerp(b, 0.5); mid.z += 12;
  const c = new THREE.QuadraticBezierCurve3(a, mid, b);
  const g = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.85, 0.3).multiplyScalar(2.5) });
  const tube = new THREE.Mesh(new THREE.TubeGeometry(c, 80, 1.6, 8), mat);
  g.add(tube);
  const pulses = new THREE.InstancedMesh(new THREE.SphereGeometry(3.4, 10, 6), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.95, 0.6).multiplyScalar(5) }), 10);
  g.add(pulses);
  // miniature platform + jack-up at Martin Linge (schematic scale)
  const B = new Builder();
  makePlatform(B, W.mats, 0, -60, 22);
  makeJackup(B, W.mats, -110, -60);
  const models = B.build();
  models.scale.setScalar(0.12);
  models.position.copy(b).setY(7);
  g.add(models);
  g.userData.overlay = true;
  M.group.add(g);
  CABLE = { g, c, tube, pulses, models };
  return CABLE;
}

export const shore = {
  look: { bloom: 0.75, bloomThreshold: 1.1, vignette: 0.5 },
  build(W) { ensureSets(W); },
  setup(W) {
    W.show(['map']);
    W.envStudio({ bg: new THREE.Color('#03070c'), sunDir: [-0.4, 0.75, 0.5], sunI: 2.4, hemi: 0.5, exposure: 1.0, envI: 0.35 });
    W.shadowBox([0, 0, 0], 1800, 6000);
    W.lights.sun.position.set(-1500, 2600, 1800);
    for (const n of Object.keys(W.map.markers)) W.map.setMarker(n, 0);
    ensureCable(W).g.visible = true;
  },
  update(W, t, info) {
    const C = CABLE, m4 = new THREE.Matrix4();
    const grow = sstep(1.0, 4.0, t);
    C.tube.geometry.setDrawRange(0, Math.floor(C.tube.geometry.index.count * grow / 6) * 6);
    C.pulses.visible = grow > 0.98;
    for (let i = 0; i < 10; i++) { const p = C.c.getPoint(1 - ((t * 0.25 + i / 10) % 1)); C.pulses.setMatrixAt(i, m4.makeTranslation(p.x, p.y, p.z)); }
    C.pulses.instanceMatrix.needsUpdate = true;
    const b = W.map.markers['Martin Linge'].position;
    camPath([[0, [-260, 330, 80], [-360, 0, 360], 40], [info.dur, [-330, 230, 160], [-380, 0, 355], 40]], (u) => u)(t, W.camera);
    W.camera.near = 10; W.camera.far = 20000; W.camera.updateProjectionMatrix();
    const ov = W.ov;
    ov.label('ml', { at: b.clone().setY(14), text: 'Askepott at Martin Linge', sub: 'first rig in Equinor’s fleet on shore power', side: 'left', dx: 100, dy: -95 }, t, 2.0, info.dur);
    ov.label('kl', { at: W.map.markers.Kollsnes.position.clone().setY(12), text: 'Power from shore', sub: '≈ 162 km AC cable', side: 'right', dx: 60, dy: 80 }, t, 3.0, info.dur);
    ov.stat('co2', { x: 1400, y: 640, value: 20000, unit: 't', label: 'CO₂ cut per year (expected)', desc: 'compared with diesel generators' }, t, lineStart(info, 0) + 8.0, info.dur);
  },
  teardown() { if (CABLE) CABLE.g.visible = false; },
};

let WIND = null;
export const wind = {
  look: { bloom: 0.6, bloomThreshold: 1.2, vignette: 0.42 },
  build(W) {
    if (WIND) return;
    WIND = createWindFarm();
    const B = new Builder();
    makePlatform(B, W.mats, 0, -140, 24);
    const plat = B.build();
    plat.position.set(-900, 0, -2600);
    WIND.group.add(plat);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(4, 14, 12), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.55, 0.2).multiplyScalar(5) }));
    flame.position.set(-900 + 57, 66, -2600 + 42);
    WIND.group.add(flame);
    W.addSet('wind', WIND.group);
  },
  setup(W) {
    W.show(['sky', 'ocean', 'wind']);
    W.envOcean('sunset', { amp: 0.8, exposure: 1.0, skyOverrides: { sun: [0.55, 0.12, -0.83], cover: 0.35 }, lamps: 0.3 });
    W.shadowBox([0, 50, -400], 700, 3000);
  },
  oceanT0: 1600,
  update(W, t, info) {
    WIND.update(t);
    camPath([[0, [380, 40, 520], [0, 70, -300], 42], [info.dur, [200, 70, 640], [-100, 80, -300], 42]], (u) => u)(t, W.camera);
    const ov = W.ov;
    ov.stat('sv', { x: 120, y: 140, value: 0.67, decimals: 2, unit: 'kg CO₂', label: 'per barrel · Johan Sverdrup', desc: 'powered from shore' }, t, 1.2, info.dur);
    ov.stat('ht', { x: 1360, y: 140, value: 88, unit: 'MW', label: 'Hywind Tampen · 11 floating turbines', desc: '≈ 35% of the power for Snorre & Gullfaks' }, t, lineStart(info, 0) + 6.6, info.dur);
  },
};

// ------------------------------------------------------------------ Chapter 12
export const complete = {
  look: { bloom: 0.55, vignette: 0.45 },
  build(W) { ensureWell(W); ensureSets(W); },
  setup(W) { this._seg = -1; },
  update(W, t, info) {
    const cut = 9.2;
    const seg = t < cut ? 0 : 1;
    if (seg !== this._seg) {
      this._seg = seg;
      if (seg === 0) wellEnv(W);
      else {
        W.show(['subsea']);
        W.envOcean('overcast', { amp: 0.7 });
        W.envUnder({ color: [0.0, 0.08, 0.105], fog: 0.012, exposure: 1.55, sunI: 2.4, hemi: 1.3 });
        W.sets.sky.visible = false;
        W.shadowBox([0, SEABED_Y + 4, 6], 20, 200);
      }
    }
    W.post.grade.uniforms.uFade.value = Math.max(0, 1 - Math.abs(t - cut) / 0.3);
    const ov = W.ov;
    if (seg === 0) {
      const c = sstep(1.0, 7.5, t);
      W.well.set({ hole: TD, sections: sectionStates(5), string: -100, time: t, completion: c, showBop: c < 0.85, showRiser: c < 0.85, showPipe: false });
      W.well.tree.visible = c >= 0.85;
      camPath([[0, [14, -262, 70], [0, -270, 0], 46], [cut * 0.55, [12, -150, 140], [0, -170, 0], 48], [cut, [22, -8, 70], [0, -22, 0], 46]])(t, W.camera);
      ov.chapter(12, 'The Finished Well', t, 0.2, 2.3);
      ov.label('scr', { at: new THREE.Vector3(2.5, -275, 0.3), text: 'Sand screens', side: 'right', dx: 100, dy: -30 }, t, 4.0, cut);
      ov.label('tub', { at: new THREE.Vector3(1.0, -150, 0.3), text: 'Production tubing', side: 'right', dx: 110, dy: -30 }, t, 3.0, cut);
    } else {
      W.subsea.bop.group.visible = false;
      W.subsea.tree.visible = true;
      W.sets.rig.visible = false;
      W.subsea.update(t, W.camera, { snowOn: true, fishCenter: new THREE.Vector3(-10, SEABED_Y + 6, 0) });
      orbit(W.camera, [0, SEABED_Y + 3.5, 6], 13, 2.5, lerp(0.6, 1.4, (t - cut) / (info.dur - cut)), 50);
      ov.label('xt', { at: new THREE.Vector3(0, SEABED_Y + 5.5, 6), text: 'Christmas tree', sub: 'valves that control the flow', side: 'right', dx: 90, dy: -50 }, t, cut + 0.8, info.dur);
    }
  },
  teardown(W) { W.well.tree.visible = false; W.subsea.bop.group.visible = true; W.subsea.tree.visible = false; },
};

export const future = {
  look: { bloom: 0.85, bloomThreshold: 1.0, vignette: 0.5 },
  build: ensureSets,
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('night', { amp: 0.6, chop: 0.7, foam: 0.15, fog: 0.00006, exposure: 1.4, lamps: 1.0, hemi: 0.2, envI: 0.2, skyOverrides: { aurora: 1.0, stars: 1.0 },
      oceanLights: [[[0, 70, 0], [1.0, 0.8, 0.55]], [[-5, 38, -46], [1.0, 0.85, 0.6]], [[30, 33, 20], [0.9, 0.95, 1.0]]], glitter: [0.25, 800, 0.8, 1.2] });
    W.shadowBox([0, 40, 0], 80, 600);
  },
  oceanT0: 1700,
  update(W, t, info) {
    rigOnOcean(W, t + 1700, 0.4);
    W.rig.setTopDrive(48 + 10 * Math.sin(t * 0.2));
    camPath([[0, [-250, 22, 260], [0, 60, 0], 40], [info.dur, [-340, 30, 380], [0, 75, 0], 42]], (u) => u)(t, W.camera);
    const ov = W.ov, l1 = lineStart(info, 1);
    ov.list('fut', { x: 120, y: 150, head: 'Coming up', items: [['2027', 'Noble GreatWhite starts for Aker BP'], ['2027–28', 'three Cat D rigs renewed by Equinor'], ['→ 2035', 'rig contracts reaching into the 2030s']], stagger: 0.6, panel: true }, t, 1.0, l1);
  },
};

export const end = {
  look: { bloom: 0.9, bloomThreshold: 1.0, vignette: 0.55 },
  build: ensureSets,
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('night', { amp: 0.6, chop: 0.7, foam: 0.15, fog: 0.00006, exposure: 1.4, lamps: 1.0, hemi: 0.2, envI: 0.2, skyOverrides: { aurora: 1.0, stars: 1.0 },
      oceanLights: [[[0, 70, 0], [1.0, 0.8, 0.55]], [[-5, 38, -46], [1.0, 0.85, 0.6]], [[30, 33, 20], [0.9, 0.95, 1.0]]], glitter: [0.25, 800, 0.8, 1.2] });
    W.shadowBox([0, 40, 0], 80, 600);
  },
  oceanT0: 1720,
  update(W, t, info) {
    rigOnOcean(W, t + 1720, 0.4);
    camPath([[0, [-340, 30, 380], [0, 75, 0], 42], [info.dur, [-520, 70, 640], [0, 120, 0], 44]], (u) => u)(t, W.camera);
    const ov = W.ov;
    ov.title('end', { kicker: 'Norway · 2026', big: 'THE DRILLING RIG', sub: 'Narration: AI voice · Sources: Sodir, Havtil, Equinor, Aker BP, Odfjell, Transocean, Noble, Halliburton/Sekal' }, t, lineEnd(info, 0) + 0.4, info.dur + 1);
    fades(W, t, info, 0, 2.0);
  },
};
