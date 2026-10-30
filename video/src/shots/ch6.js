// Chapter 6 — Building the well: dive down the riser, the BOP, top hole, casing programme.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, smooth, easeInOut, orbit } from '../engine/util.js';
import { rigOnOcean, lineStart, lineEnd, fades, captureAbove, waterSwitch } from './common.js';
import { ensureSets } from './sets.js';
import { createWell, SECTIONS, TD, sectionStates } from '../world/well.js';
import { SEABED_Y } from '../world/subsea.js';

let WELL = null;
export function ensureWell(W) {
  ensureSets(W);
  if (WELL) return WELL;
  WELL = createWell(W.rig.root);
  W.addSet('well', WELL.group);
  W.well = WELL;
  return WELL;
}

export function wellEnv(W, o = {}) {
  W.show(['well']);
  W.envStudio({ sunDir: [0.35, 0.6, 0.72], sunI: 2.2, hemi: 0.7, exposure: 1.0, ...o });
  W.shadowBox([0, 0, 0], 120, 600);
}

export const dive = {
  look: { bloom: 0.6, bloomThreshold: 1.2, vignette: 0.5 },
  build: ensureWell,
  setup(W) {
    W.show(['sky', 'ocean', 'rig', 'subsea']);
    W.envOcean('overcast', { amp: 0.7, chop: 0.75, foam: 0.4, fog: 0.00012, exposure: 1.05, lamps: 0.7, skyOverrides: { cover: 0.6 } });
    captureAbove(W);
    W.shadowBox([0, 20, 6], 40, 300);
  },
  oceanT0: 1200,
  update(W, t, info) {
    const tt = t + 1200, cam = W.camera;
    rigOnOcean(W, tt, 0.2);
    W.rig.setTopDrive(60);
    W.rig.setStringTop(60);
    if (t < 2.5) {
      // above the drill floor, looking down the pipe into the rotary table
      camPath([[0, [2.6, 49, 10.5], [0, 40.5, 6], 50], [2.5, [1.2, 44.5, 8.2], [0, 40.2, 6], 46]], (u) => u)(t, cam);
    } else {
      camPath([
        [2.5, [2.6, 13.5, 9.5], [0, 2, 6.5], 64],
        [4.6, [2.3, 6, 9.5], [0, -20, 6.5], 60],
        [6.2, [2.6, -14, 10], [0.5, -70, 6.5], 58],
        [12.6, [4.5, -262, 14], [0, -300, 6], 55],
        [info.dur, [7, -297, 20], [0, -311, 6], 52],
      ])(t, cam);
    }
    W.post.grade.uniforms.uFade.value = Math.max(0, 1 - Math.abs(t - 2.5) / 0.35);
    const under = waterSwitch(W, tt, { color: [0.0, 0.085, 0.11], fog: 0.0065, exposure: 1.4, sunI: 2.0, hemi: 1.1 });
    W.subsea.update(t, cam, { snowOn: under, fishCenter: new THREE.Vector3(-8, -60, 20) });
    W.subsea.shaftMat.uniforms.uI.value = 0.07;
    const depth = Math.max(0, -cam.position.y);
    const ov = W.ov;
    ov.chapter(6, 'Building the Well', t, 0.2, 2.3);
    ov.label('mp', { at: W.rig.local([4.5, 17.5, 6]), text: 'Moonpool', sub: 'opening through the hull', side: 'right', dx: 90, dy: -40 }, t, 2.9, 5.0);
    ov.html('depth', { x: 1640, y: 470, cls: 'gauge', html: `<div class="h">Water depth</div><div class="val">${Math.round(depth)} m</div><div class="track"><div class="fill" style="width:${clamp(depth / 320) * 100}%"></div></div>` }, t, 5.6, info.dur);
    ov.label('riser', { at: new THREE.Vector3(0, cam.position.y - 25, 6), text: 'Marine riser', sub: '≈ 0.5 m wide steel pipe', side: 'right', dx: 90, dy: 30 }, t, 7.2, 11.5);
  },
};

export const bop = {
  look: { bloom: 0.7, bloomThreshold: 1.1, vignette: 0.5 },
  setup(W) {
    W.show(['rig', 'subsea']);
    W.envOcean('overcast', { amp: 0.7, exposure: 1.0 });
    W.envUnder({ color: [0.0, 0.08, 0.105], fog: 0.012, exposure: 1.55, sunI: 2.4, hemi: 1.3 });
    W.sets.sky.visible = false;
    W.shadowBox([0, SEABED_Y + 7, 6], 20, 200);
  },
  update(W, t, info) {
    const cam = W.camera;
    W.subsea.update(t, cam, { snowOn: true, fishCenter: new THREE.Vector3(-14, SEABED_Y + 9, 2) });
    const a = lerp(0.9, 2.1, easeInOut(t / info.dur));
    orbit(cam, [0, SEABED_Y + 7.2, 6], lerp(19, 16, t / info.dur), lerp(1.5, 3.0, t / info.dur), a, 50);
    const B = (y) => new THREE.Vector3(0, SEABED_Y + 0.6 + y, 6);
    const ov = W.ov, l0 = lineStart(info, 0);
    ov.label('ann', { at: B(11.5), text: 'Annular preventers', sub: 'rubber seal around any pipe', side: 'right', dx: 110, dy: -40 }, t, l0 + 1.4, info.dur);
    ov.label('shear', { at: B(7.65), text: 'Shear rams', sub: 'cut the pipe & seal', side: 'right', dx: 120, dy: 10, color: '#ff5a4e' }, t, l0 + 2.6, info.dur);
    ov.label('pipe', { at: B(4.5), text: 'Pipe rams', sub: 'close around the drill pipe', side: 'right', dx: 120, dy: 50 }, t, l0 + 3.4, info.dur);
    ov.label('pods', { at: new THREE.Vector3(2.1, SEABED_Y + 11, 6.6), text: 'Control pods', sub: 'duplicated, with ROV backup', side: 'left', dx: 110, dy: -50 }, t, l0 + 4.4, info.dur);
    ov.label('wh', { at: B(1.9), text: 'Wellhead', side: 'left', dx: 100, dy: 50 }, t, l0 + 5.2, info.dur);
    ov.stat('psi', { x: 120, y: 120, value: 15000, unit: 'psi', label: 'Pressure rating', desc: '≈ 1,000 bar · stack ~14 m tall' }, t, l0 + 7.6, info.dur);
  },
};

export const tophole = {
  look: { bloom: 0.45, vignette: 0.42 },
  build: ensureWell,
  setup(W) { wellEnv(W); },
  update(W, t, info) {
    const l1 = lineStart(info, 1), d = info.dur;
    const k = clamp((t - l1) / (d - l1 - 0.4));
    let st, hole, string, bopVis = false;
    if (t < l1 - 0.2) {
      // the finished telescope, for "a well is built like a telescope"
      st = sectionStates(5); hole = TD; string = -100; bopVis = true;
    } else {
      // 36" hole + conductor, then 26" hole + 20" casing
      const a = smooth(clamp(k / 0.22)), b = smooth(clamp((k - 0.22) / 0.16)), c = smooth(clamp((k - 0.38) / 0.3)), e = smooth(clamp((k - 0.68) / 0.22)), f = smooth(clamp((k - 0.9) / 0.1));
      const s0 = { drilled: 1, run: b, cement: b >= 1 ? 1 : 0 };
      const s1 = { drilled: c > 0 ? 1 : 0, run: e, cement: f };
      st = [s0, s1, {}, {}, {}];
      hole = c > 0 ? lerp(SECTIONS[0].bottom, SECTIONS[1].bottom, c) : lerp(0, SECTIONS[0].bottom, a);
      string = (b > 0 && b < 1) || (e > 0) ? -100 : hole;
    }
    W.well.set({ hole, sections: st, string, flow: string > 0 ? 1 : 0, cuttings: 1, time: t, showBop: bopVis, showRiser: bopVis, bopY: 0 });
    W.post.grade.uniforms.uFade.value = Math.max(0, 1 - Math.abs(t - (l1 - 0.2)) / 0.35);
    camPath([
      [0, [60, -150, 330], [0, -150, 0], 52],
      [l1 - 0.25, [55, -140, 300], [0, -140, 0], 52],
      [l1 - 0.15, [14, -5, 70], [0, -18, 0], 42],
      [d, [18, -12, 82], [0, -28, 0], 44],
    ], (u) => u)(t, W.camera);
    const ov = W.ov;
    if (t < l1 - 0.2) {
      SECTIONS.forEach((s, i) => ov.label('tel' + i, { at: new THREE.Vector3(s.od, -(s.bottom - 3), 0), text: ['30″', '20″', '13⅜″', '9⅝″', '7″'][i], side: 'right', dx: 60 + i * 10, dy: -10 }, t, 0.3 + i * 0.25, l1 - 0.3));
      ov.html('nts', { x: 120, y: 980, cls: 'note', html: 'Schematic · widths exaggerated' }, t, 0.3, l1 - 0.3);
    } else {
      ov.label('cond', { at: new THREE.Vector3(SECTIONS[0].od, -6, 0), text: '30″ conductor', sub: 'anchors the well', side: 'right', dx: 120, dy: -30 }, t, l1 + 2.0, d);
      ov.label('surf', { at: new THREE.Vector3(SECTIONS[1].od, -40, 0), text: '20″ surface casing', sub: 'carries the wellhead', side: 'right', dx: 110, dy: 20 }, t, l1 + 6.2, d);
      ov.html('nb', { x: 120, y: 120, cls: 'badge', html: 'No BOP yet · returns to the seabed' }, t, l1 + 0.6, d);
    }
  },
};

export const casing = {
  look: { bloom: 0.45, vignette: 0.42 },
  build: ensureWell,
  setup(W) { wellEnv(W); },
  update(W, t, info) {
    const d = info.dur, l1 = lineStart(info, 1);
    const bopIn = smooth(clamp((t - 0.6) / 2.4));
    // timeline: 13 3/8 (drill, run, cement), 9 5/8 (drill, run, cement), 8 1/2 into reservoir
    const T0 = 3.2, span = (d - T0 - 1.0);
    const k = clamp((t - T0) / span);
    const seg = (a, b) => smooth(clamp((k - a) / (b - a)));
    const d2 = seg(0.0, 0.2), r2 = seg(0.2, 0.3), c2 = seg(0.3, 0.38);
    const d3 = seg(0.38, 0.6), r3 = seg(0.6, 0.7), c3 = seg(0.7, 0.78);
    const d4 = seg(0.78, 1.0);
    const st = [{ drilled: 1, run: 1, cement: 1 }, { drilled: 1, run: 1, cement: 1 },
      { drilled: d2 > 0 ? 1 : 0, run: r2, cement: c2 }, { drilled: d3 > 0 ? 1 : 0, run: r3, cement: c3 }, { drilled: d4 > 0 ? 1 : 0, run: 0, cement: 0 }];
    let hole = SECTIONS[1].bottom;
    if (d2 > 0) hole = lerp(SECTIONS[1].bottom, SECTIONS[2].bottom, d2);
    if (d3 > 0) hole = lerp(SECTIONS[2].bottom, SECTIONS[3].bottom, d3);
    if (d4 > 0) hole = lerp(SECTIONS[3].bottom, SECTIONS[4].bottom, d4);
    const running = (r2 > 0 && c2 < 1) || (r3 > 0 && c3 < 1);
    const string = bopIn < 1 || running ? -100 : hole;
    W.well.set({ hole, sections: st, string, flow: string > 0 ? 1 : 0, time: t, showBop: true, bopY: lerp(26, 0, bopIn) });
    const camY = -Math.min(hole, 262) * 0.9 + 12;
    const wide = sstep(d - 3.2, d - 0.6, t);
    W.camera.position.set(lerp(16, 70, wide), lerp(camY, -150, wide), lerp(62, 330, wide));
    W.camera.lookAt(0, lerp(camY - 12, -150, wide), 0);
    W.camera.fov = 44; W.camera.updateProjectionMatrix();
    const ov = W.ov;
    ov.label('bopl', { at: new THREE.Vector3(1.2, 6, -1.6), text: 'BOP + riser latched on', side: 'right', dx: 90, dy: -40 }, t, 1.0, T0 + 2.0);
    ov.label('c13', { at: new THREE.Vector3(SECTIONS[2].od, -130, 0), text: '13⅜″ casing', side: 'right', dx: 110, dy: -20 }, t, T0 + span * 0.27, d);
    ov.label('c9', { at: new THREE.Vector3(SECTIONS[3].od, -235, 0), text: '9⅝″ casing', side: 'right', dx: 110, dy: -20 }, t, T0 + span * 0.66, d);
    ov.label('cem', { at: new THREE.Vector3((SECTIONS[3].od + SECTIONS[3].hole) / 2, -245, 0), text: 'Cement', sub: 'seals behind the casing', side: 'left', dx: 110, dy: 30 }, t, T0 + span * 0.72, d - 3.3);
    ov.label('res', { at: new THREE.Vector3(30, -272, 0), text: 'Reservoir', sub: 'oil-bearing sandstone', side: 'right', dx: 80, dy: -30 }, t, T0 + span * 0.86, d);
    ov.html('dep', { x: 1580, y: 900, cls: 'gauge', html: `<div class="h">Depth below seabed</div><div class="val">${Math.round(hole * 10).toLocaleString('en-US')} m</div>` }, t, 0.6, d);
  },
};
