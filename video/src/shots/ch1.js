// Chapter 1 — the Norwegian shelf (map) and rig types.
import * as THREE from 'three';
import { camPath, win, sstep, clamp, easeOut, rng, lerp } from '../engine/util.js';
import { lineStart, lineEnd, fades } from './common.js';
import { createMap } from '../world/map.js';
import { createRigTypes } from '../world/rigtypes.js';

let MAP = null, WELLS = null, TYPES = null;

async function buildMap(W) {
  if (MAP) return;
  MAP = await createMap();
  W.addSet('map', MAP.group);
  W.map = MAP;
  // 175 development wells around producing fields + 40 wildcats scattered over the shelf
  const r = rng(17);
  const dev = ['Johan Sverdrup', 'Troll', 'Snorre', 'Gullfaks', 'Oseberg', 'Ekofisk', 'Valhall', 'Heidrun', 'Aasta Hansteen', 'Johan Castberg', 'Yggdrasil', 'Martin Linge'];
  const pts = [];
  for (let i = 0; i < 175; i++) {
    const f = MAP.markers[dev[Math.floor(r() * dev.length)]].position;
    pts.push([f.x + (r() - 0.5) * 70, f.z + (r() - 0.5) * 70, 0]);
  }
  for (let i = 0; i < 40; i++) {
    const zone = r();
    const x = zone < 0.65 ? -480 + r() * 260 : zone < 0.85 ? -260 + r() * 260 : 300 + r() * 380;
    const z = zone < 0.65 ? 250 - r() * 1050 : zone < 0.85 ? -100 - r() * 450 : -850 - r() * 300;
    pts.push([x, z, 1]);
  }
  const geo = new THREE.SphereGeometry(3.2, 10, 6);
  const matDev = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.72, 0.3).multiplyScalar(2.4) });
  const matExp = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.85, 1.0).multiplyScalar(2.6) });
  const dv = new THREE.InstancedMesh(geo, matDev, 175), ex = new THREE.InstancedMesh(geo, matExp, 40);
  WELLS = { pts, dv, ex };
  MAP.group.add(dv, ex);
  W.mapReset = () => {
    for (const n of Object.keys(MAP.markers)) MAP.setMarker(n, 0);
    for (const d of Object.values(MAP.cityDots)) d.visible = false;
    setWells(0);
    MAP.group.children.forEach((c) => { if (c.userData.overlay) c.visible = false; });
  };
}

function setWells(k) {
  // k in 0..1 reveals wells progressively (dev first, then exploration)
  const m4 = new THREE.Matrix4();
  let di = 0, ei = 0;
  WELLS.pts.forEach(([x, z, type], i) => {
    const order = type === 0 ? di / 175 * 0.6 : 0.55 + ei / 40 * 0.45;
    const s = clamp((k - order) * 20);
    m4.makeScale(s + 1e-4, s + 1e-4, s + 1e-4).setPosition(x, 11, z);
    if (type === 0) WELLS.dv.setMatrixAt(di++, m4); else WELLS.ex.setMatrixAt(ei++, m4);
  });
  WELLS.dv.instanceMatrix.needsUpdate = WELLS.ex.instanceMatrix.needsUpdate = true;
}

function mapEnv(W) {
  W.show(['map']);
  W.envStudio({ bg: new THREE.Color('#03070c'), sunDir: [-0.4, 0.75, 0.5], sunI: 2.4, hemi: 0.5, exposure: 1.0, envI: 0.35 });
  W.shadowBox([0, 0, 0], 1800, 6000);
  W.lights.sun.position.set(-1500, 2600, 1800);
  for (const n of Object.keys(MAP.markers)) MAP.setMarker(n, 0);
  for (const d of Object.values(MAP.cityDots)) d.visible = false;
  setWells(0);
}

const seaLbl = (ov, key, name, at, t, t0, t1) => ov.html(key, { at, x: 0, y: 0, cls: 'note', html: name, style: { transform: 'translate(-50%,-50%)', fontSize: '30px', letterSpacing: '0.45em' } }, t, t0, t1, 0.8);

export const map_intro = {
  look: { bloom: 0.55, bloomThreshold: 1.2, vignette: 0.5 },
  build: buildMap,
  setup(W) { mapEnv(W); },
  update(W, t, info) {
    const d = info.dur;
    // hold over the North Sea while it is named, then sweep north to end on map_fields' first frame
    camPath([
      [0, [-520, 380, 1250], [-380, 0, 380], 40],
      [5.6, [-560, 560, 1180], [-360, 0, 300], 40],
      [d, [-300, 2300, 1350], [60, 0, -230], 40],
    ])(t, W.camera);
    W.camera.near = 10; W.camera.far = 20000; W.camera.updateProjectionMatrix();
    const ov = W.ov, s = MAP.data.seas, P = MAP.P;
    ov.chapter(1, 'The Norwegian Shelf', t, 0.2, 2.3);
    const l0 = lineStart(info, 0);
    seaLbl(ov, 'ns', 'NORTH SEA', P(s['North Sea'], 0), t, l0 + 2.4, d);
    seaLbl(ov, 'nws', 'NORWEGIAN SEA', P(s['Norwegian Sea'], 0), t, l0 + 4.0, d);
    seaLbl(ov, 'bs', 'BARENTS SEA', P(s['Barents Sea'], 0), t, l0 + 6.0, d);
    ov.html('no', { at: P([-60, -300], 30), cls: 'note', html: 'NORWAY', style: { transform: 'translate(-50%,-50%)', fontSize: '22px', letterSpacing: '0.6em', color: '#fff' } }, t, 1.5, d, 0.8);
  },
};

const FIELD_TIMES = [['Johan Sverdrup', 1.6], ['Troll', 2.7], ['Snorre', 3.3], ['Oseberg', 4.0], ['Johan Castberg', 6.3]];

export const map_fields = {
  look: { bloom: 0.6, bloomThreshold: 1.2, vignette: 0.5 },
  setup(W) { mapEnv(W); },
  update(W, t, info) {
    const d = info.dur, l0 = lineStart(info, 0);
    camPath([
      [0, [-300, 2300, 1350], [60, 0, -230], 40],
      [l0 + 1.4, [-330, 620, 1010], [-390, 0, 400], 40],
      [l0 + 4.8, [-320, 560, 900], [-370, 0, 330], 40],
      [d, [430, 950, -330], [346, 0, -972], 40],
    ])(t, W.camera);
    W.camera.near = 10; W.camera.far = 20000; W.camera.updateProjectionMatrix();
    const ov = W.ov, P = MAP.P;
    for (const [name, ts] of FIELD_TIMES) {
      const k = sstep(l0 + ts - 0.2, l0 + ts + 0.6, t);
      MAP.setMarker(name, k, t);
      const pos = MAP.markers[name].position.clone().setY(18);
      const side = name === 'Troll' || name === 'Oseberg' ? 'right' : 'left';
      ov.label('f' + name, { at: pos, text: name, side, dx: 70, dy: name === 'Snorre' ? -60 : name === 'Oseberg' ? 40 : -30, sub: name === 'Johan Castberg' ? 'Barents Sea · first oil March 2025' : '' }, t, l0 + ts, d + 1);
    }
    for (const c of ['Stavanger', 'Bergen', 'Hammerfest']) MAP.cityDots[c].visible = true;
    ov.html('cs', { at: MAP.cityDots.Stavanger.position, x: 14, y: -10, cls: 'note', html: 'Stavanger', style: { textTransform: 'none', fontSize: '20px', letterSpacing: '0.04em' } }, t, 0.5, d + 1);
    ov.html('cb', { at: MAP.cityDots.Bergen.position, x: 14, y: -10, cls: 'note', html: 'Bergen', style: { textTransform: 'none', fontSize: '20px', letterSpacing: '0.04em' } }, t, 0.5, d + 1);
  },
};

export const map_stats = {
  look: { bloom: 0.7, bloomThreshold: 1.1, vignette: 0.5 },
  setup(W) { mapEnv(W); },
  update(W, t, info) {
    const d = info.dur, l0 = lineStart(info, 0);
    camPath([
      [0, [430, 950, -330], [346, 0, -972], 40],
      [d * 0.45, [250, 1900, 900], [40, 0, -300], 40],
      [d, [80, 2150, 1250], [-40, 0, -200], 40],
    ])(t, W.camera);
    W.camera.near = 10; W.camera.far = 20000; W.camera.updateProjectionMatrix();
    for (const [name] of FIELD_TIMES) MAP.setMarker(name, 1 - sstep(1.0, 2.5, t), t);
    setWells(sstep(l0 + 2.0, l0 + 10.5, t));
    const ov = W.ov;
    ov.stat('dev', { x: 1500, y: 170, value: 175, label: 'Development wells', desc: 'started in 2025', align: 'left' }, t, l0 + 3.6, d);
    ov.stat('exp', { x: 1500, y: 430, value: 40, label: 'Wildcat wells', desc: 'exploration wells completed', align: 'left' }, t, l0 + 6.9, d);
    ov.stat('disc', { x: 1500, y: 690, value: 21, label: 'Discoveries', desc: 'Source: Norwegian Offshore Directorate', align: 'left' }, t, l0 + 9.6, d);
  },
};

export const rigtypes = {
  look: { bloom: 0.45, vignette: 0.42 },
  build(W) {
    if (TYPES) return;
    TYPES = createRigTypes(W.rig.root);
    W.addSet('rigtypes', TYPES.group);
  },
  setup(W) {
    W.show(['rigtypes', 'sky']);
    W.envOcean('day', { amp: 0.0, exposure: 1.0, fog: 0.0, skyOverrides: { sun: [-0.35, 0.55, 0.76] }, hemi: 0.6 });
    W.scene.fog = null;
    W.shadowBox([0, -100, 0], 800, 3000);
  },
  update(W, t, info) {
    const L = (i) => lineStart(info, i);
    camPath([
      [0, [-300, 120, 900], [-120, -60, 0], 40],
      [L(1) + 0.3, [-120, 40, 560], [-20, -30, 0], 40],
      [L(2) + 0.3, [-480, 30, 520], [-420, -20, 0], 40],
      [L(3) + 0.8, [380, -40, 560], [520, -60, 0], 40],
      [info.dur, [470, 10, 300], [520, 10, 0], 40],
    ])(t, W.camera);
    W.camera.far = 20000; W.camera.updateProjectionMatrix();
    const ov = W.ov;
    ov.label('plat', { at: new THREE.Vector3(-20, 70, 0), text: 'Fixed platform', sub: 'its own drilling rig · dozens of wells', side: 'right', dx: 80, dy: -70 }, t, L(1), L(2) + 0.3);
    ov.label('jack', { at: new THREE.Vector3(-420, 75, 0), text: 'Jack-up', sub: 'legs stand on the seabed · shallower water', side: 'right', dx: 90, dy: -70 }, t, L(2), L(3) + 0.3);
    ov.label('semi', { at: new THREE.Vector3(520, 60, -40), text: 'Semi-submersible', sub: 'floats · anchored or dynamically positioned', side: 'left', dx: 90, dy: -80 }, t, L(3) + 0.4, info.dur);
    fades(W, t, info, 0, 0.6);
  },
};
