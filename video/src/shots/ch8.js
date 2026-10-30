// Chapter 8 — Downhole: BHA, PDC bit, rotary steerable, MWD/LWD + telemetry, geosteering, record well.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, smooth, easeInOut } from '../engine/util.js';
import { lineStart, lineEnd } from './common.js';
import { ensureBHA } from './ch7.js';
import { createGeosteer, pathY } from '../world/geosteer.js';

function bhaEnv(W) {
  W.show(['bha']);
  W.envStudio({ sunDir: [0.3, 0.5, 0.8], sunI: 2.6, hemi: 0.6, exposure: 1.05, bg: new THREE.Color('#040608') });
  W.shadowBox([0, 6, 0], 10, 60);
}

export const bha = {
  look: { bloom: 0.55, bloomThreshold: 1.3, vignette: 0.48 },
  build: ensureBHA,
  setup(W) { bhaEnv(W); },
  update(W, t, info) {
    const l1 = lineStart(info, 1);
    W.bha.update(t, { rot: t * 0.9, flow: sstep(l1, l1 + 1, t) });
    camPath([
      [0, [0.7, 16.5, 2.4], [0, 15.5, 0], 40],
      [l1 - 0.3, [0.55, 2.2, 1.6], [0, 1.6, 0], 42],
      [info.dur, [0.45, 0.32, 0.8], [0, 0.12, 0], 40],
    ])(t, W.camera);
    const ov = W.ov;
    ov.chapter(8, 'Downhole', t, 0.2, 2.3);
    ov.label('dp', { at: new THREE.Vector3(0.07, 17, 0.05), text: 'Drill pipe', side: 'right', dx: 80, dy: -30 }, t, 2.4, 4.0);
    ov.label('mwd', { at: new THREE.Vector3(0.09, 10, 0.05), text: 'MWD / LWD sensors', side: 'right', dx: 80, dy: -30 }, t, 3.4, 6.2);
    ov.label('rss', { at: new THREE.Vector3(0.09, 3.2, 0.05), text: 'Rotary steerable', side: 'right', dx: 80, dy: -30 }, t, 4.8, l1 + 0.5);
    ov.label('bit', { at: new THREE.Vector3(0.12, 0.12, 0.08), text: 'PDC bit', sub: 'synthetic-diamond cutters', side: 'left', dx: 90, dy: -60 }, t, l1 + 0.5, info.dur);
    ov.html('sm', { x: 1700, y: 980, cls: 'note', html: 'slow motion' }, t, l1 + 1, info.dur);
  },
};

export const rss = {
  look: { bloom: 0.55, bloomThreshold: 1.3, vignette: 0.48 },
  setup(W) { bhaEnv(W); },
  update(W, t, info) {
    W.bha.update(t, { rot: t * 0.8, flow: 1, padDir: 0, padAmt: sstep(1.0, 2.0, t) });
    camPath([[0, [0.55, 3.1, 0.75], [0, 2.6, 0], 44], [info.dur, [0.6, 2.4, 0.7], [0, 2.4, 0], 44]], (u) => u)(t, W.camera);
    const ov = W.ov;
    ov.label('pad', { at: new THREE.Vector3(0.12, 2.6, 0.05), text: 'Steering pads', sub: 'push against the hole wall', side: 'right', dx: 90, dy: -40 }, t, 1.2, info.dur);
    ov.html('dir', { x: 120, y: 120, cls: 'panel', html: '<div class="note" style="opacity:1">Push-the-bit steering</div><div style="font-size:26px;margin-top:10px;font-weight:600">Pads push one way → the bit turns the other<br/>while the whole string keeps rotating</div>' }, t, 2.6, info.dur);
  },
};

function rateBars(t, t0) {
  const k = clamp((t - t0) / 2.5);
  const mud = 5, wired = 57600;
  const w1 = 6 + 4 * k, w2 = Math.max(6, 640 * clamp((t - t0 - 0.8) / 2.0));
  return `<div class="note" style="opacity:1;margin-bottom:14px">Telemetry speed</div>
  <div style="font-size:22px;font-weight:600">Mud pulse <span style="opacity:0.7">≈ ${Math.round(mud * k)} bit/s</span></div>
  <div style="height:16px;width:${w1}px;background:#ffb23f;border-radius:8px;margin:8px 0 18px"></div>
  <div style="font-size:22px;font-weight:600">Wired drill pipe <span style="opacity:0.7">up to ${Math.round(wired * clamp((t - t0 - 0.8) / 2.0)).toLocaleString('en-US')} bit/s</span></div>
  <div style="height:16px;width:${w2}px;background:#5fd3ff;border-radius:8px;margin-top:8px;box-shadow:0 0 18px #5fd3ff"></div>`;
}

export const mwd = {
  look: { bloom: 0.65, bloomThreshold: 1.2, vignette: 0.48 },
  setup(W) { bhaEnv(W); },
  update(W, t, info) {
    const l1 = lineStart(info, 1);
    const wiredT = l1 + 5.2;
    W.bha.update(t, { rot: t * 0.6, flow: 1, pulse: sstep(l1 + 0.5, l1 + 1.2, t) * (1 - sstep(wiredT - 0.6, wiredT, t)), wired: sstep(wiredT, wiredT + 0.8, t) });
    camPath([
      [0, [0.75, 5.0, 1.7], [0, 6.0, 0], 42],
      [l1 - 0.5, [0.8, 14.5, 1.9], [0, 13.0, 0], 42],
      [l1 + 4.5, [1.6, 13, 4.2], [0, 18, 0], 50],
      [info.dur, [1.9, 16, 4.8], [0, 22, 0], 52],
    ])(t, W.camera);
    const ov = W.ov;
    const sensors = [['g', 5.5, 'Gamma ray', 'natural radioactivity of the rock'], ['r', 7.4, 'Resistivity', 'oil vs water'], ['d', 11.2, 'Density · neutron', 'porosity'], ['p', 12.8, 'Pressure while drilling', 'downhole pressure']];
    sensors.forEach(([k, y, a, b], i) => ov.label('s' + k, { at: new THREE.Vector3(0.09, y, 0.05), text: a, sub: b, side: i % 2 ? 'left' : 'right', dx: 90, dy: -20 }, t, 1.2 + i * 1.6, l1 - 0.2));
    ov.html('rate', { x: 1180, y: 160, cls: 'panel', html: rateBars(t, l1 + 0.8), style: { width: '640px' } }, t, l1 + 0.6, info.dur);
    ov.label('pl', { at: new THREE.Vector3(0, 20, 0), text: 'Pressure pulses in the mud', side: 'left', dx: 90, dy: -40 }, t, l1 + 1.0, wiredT - 0.3);
    ov.label('wp', { at: new THREE.Vector3(0.07, 22, 0), text: 'Wired drill pipe', sub: '≈ 10,000× faster', side: 'left', dx: 90, dy: -40, color: '#5fd3ff' }, t, wiredT + 0.4, info.dur);
  },
};

let GEO = null;
function ensureGeo(W) {
  if (GEO) return;
  GEO = createGeosteer();
  GEO.multi.position.set(0, -3000, 0);
  W.addSet('geo', GEO.group);
  W.geo = GEO;
}

export const geosteer = {
  look: { bloom: 0.6, bloomThreshold: 1.2, vignette: 0.45 },
  build: ensureGeo,
  setup(W) {
    W.show(['geo']);
    W.envStudio({ sunDir: [0.3, 0.6, 0.75], sunI: 2.0, hemi: 0.8, exposure: 1.0, bg: new THREE.Color('#05080c') });
    W.geo.multi.visible = false;
  },
  update(W, t, info) {
    const x = lerp(140, 700, clamp(t / info.dur));
    W.geo.setBit(x, sstep(2.5, 3.5, t), t);
    const y = pathY(x);
    W.camera.position.set(x - 28, y + 6, 78);
    W.camera.lookAt(x + 12, y - 1, 0);
    W.camera.fov = 40; W.camera.updateProjectionMatrix();
    const ov = W.ov;
    ov.label('sand', { at: new THREE.Vector3(x + 30, pathY(x + 30) + 2, 0), text: 'Reservoir sand', sub: 'only a few metres thick', side: 'right', dx: 70, dy: -70 }, t, 1.0, info.dur);
    ov.label('udar', { at: new THREE.Vector3(x + 18, y + 22, 0), text: 'Deep resistivity "look-around"', sub: 'maps layer boundaries tens of metres away', side: 'right', dx: 60, dy: -40, color: '#5fd3ff' }, t, 4.0, info.dur);
  },
};

export const record = {
  look: { bloom: 0.75, bloomThreshold: 1.1, vignette: 0.5 },
  build: ensureGeo,
  setup(W) {
    W.show(['geo']);
    W.envStudio({ sunDir: [0.4, 0.8, 0.5], sunI: 1.6, hemi: 0.8, exposure: 1.0, bg: new THREE.Color('#05080c') });
    W.geo.multi.visible = true;
    if (!this._mini) {
      this._mini = W.rig.root.clone(true);
      this._mini.scale.setScalar(0.3);
      this._mini.position.set(0, -3000 + 205, 0);
      W.geo.group.add(this._mini);
    }
    this._mini.visible = true;
  },
  update(W, t, info) {
    const l0 = lineStart(info, 0), d = info.dur;
    // branches grow one after another; total meters counts up to 45,000
    const k = clamp((t - (l0 + 3.0)) / 9.0) * 8;
    W.geo.setBranches(k);
    W.geo.tube.visible = false; W.geo.bit.visible = false;
    const base = new THREE.Vector3(0, -3000, 0);
    camPath([
      [0, [700, -3000 + 520, 900], [0, -3000 + 40, 0], 45],
      [d, [-300, -3000 + 760, 1050], [80, -3000 + 0, -80], 45],
    ], (u) => u)(t, W.camera);
    W.camera.far = 30000; W.camera.updateProjectionMatrix();
    const ov = W.ov;
    ov.tag('wh', { text: 'Omega Alfa · Yggdrasil area · 2025', sub: 'Aker BP · drilled from Deepsea Stavanger' }, t, 0.6, d);
    ov.stat('tot', { x: 1400, y: 140, value: Math.round(45000 * clamp(k / 8)), from: Math.round(45000 * clamp(k / 8)), unit: 'm', label: 'Total drilled', desc: '8 wellbores · ~3 months' }, t, l0 + 2.6, d);
    const rec = W.geo.branches[0].tip.clone().add(base);
    ov.label('rec', { at: rec, text: '10,666 m', sub: 'longest wellbore ever on the Norwegian shelf', side: 'left', dx: 110, dy: -110, color: '#5fd3ff' }, t, l0 + 14.5, d);
  },
  teardown() { if (this._mini) this._mini.visible = false; },
};
