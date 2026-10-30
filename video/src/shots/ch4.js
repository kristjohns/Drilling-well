// Chapter 4 — The derrick: hoisting system and heave compensation.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, easeInOut, smooth } from '../engine/util.js';
import { rigOnOcean, lineStart, lineEnd, fades } from './common.js';
import { RIG } from '../world/rig.js';

function floorLook(W, o = {}) {
  W.show(['sky', 'ocean', 'rig']);
  W.envOcean('sunset', { amp: 0.7, chop: 0.75, foam: 0.4, fog: 0.0001, exposure: 1.05, lamps: 0.2, skyOverrides: { sun: [0.55, 0.3, 0.78], cover: 0.35 }, ...o });
  W.shadowBox([0, 55, 0], 45, 400);
  W.crew.visible = false;
}

export const derrick_intro = {
  look: { bloom: 0.5, vignette: 0.42 },
  setup(W) { floorLook(W); },
  oceanT0: 800,
  update(W, t, info) {
    rigOnOcean(W, t + 800, 0.4);
    W.rig.setTopDrive(58);
    W.rig.setStringTop(58);
    camPath([
      [0, [6, 41.6, 15], [0, 66, 3], 62],
      [info.dur * 0.55, [11, 70, 20], [0, 82, 0], 58],
      [info.dur, [26, 106, 30], [0, 70, 0], 50],
    ])(t, W.camera);
    W.ov.chapter(4, 'The Derrick', t, 0.2, 2.3);
  },
  teardown(W) { W.crew.visible = true; },
};

export const hoist_system = {
  look: { bloom: 0.75, bloomThreshold: 1.0, vignette: 0.45 },
  setup(W) {
    floorLook(W, { lamps: 0.3 });
    const R = W.rig;
    R.xray([R.td, R.crownG, R.drawworksG, R.linesMain, R.fastLine, R.stringStub], 0.07);
  },
  oceanT0: 820,
  update(W, t, info) {
    rigOnOcean(W, t + 820, 0.3);
    const R = W.rig;
    const l1 = lineStart(info, 1), l2 = lineStart(info, 2);
    // reel in during the second line: block rises from 44 to 78
    const k = smooth(clamp((t - (l1 + 4.0)) / 5.0));
    const y = lerp(44, 78, k);
    R.setTopDrive(y);
    R.setStringTop(y);
    R.drawworksG.children.forEach(() => {});
    R.lineMat.emissiveIntensity = 0.6 + 2.2 * sstep(l1 + 0.5, l1 + 2.5, t) * (0.6 + 0.4 * Math.sin(t * 6));
    camPath([
      [0, [50, 62, 40], [2, 67, 4], 52],
      [info.dur, [44, 64, 50], [3, 67, 4], 52],
    ], (u) => u)(t, W.camera);
    const ov = W.ov, l0 = lineStart(info, 0);
    ov.label('crown', { at: R.local([0, 94.5, 6]), text: 'Crown block', side: 'left', dx: 90, dy: -30 }, t, l0 + 0.7, info.dur);
    ov.label('block', { at: () => R.local([0, R.td.position.y + 12, 6]), text: 'Travelling block', side: 'left', dx: 110, dy: -10 }, t, l0 + 2.6, info.dur);
    ov.label('td', { at: () => R.local([0, R.td.position.y + 6, 6]), text: 'Top drive', sub: 'grips and spins the pipe', side: 'left', dx: 110, dy: 50 }, t, l0 + 4.8, info.dur);
    ov.label('dw', { at: R.local([13, 43, 7.5]), text: 'Drawworks', sub: 'the giant winch', side: 'right', dx: 90, dy: 50 }, t, l1 + 2.2, info.dur);
    ov.label('line', { at: R.local([6.5, 70, 6.8]), text: 'Drill line', sub: 'steel wire rope', side: 'right', dx: 80, dy: -40 }, t, l1 + 1.0, info.dur);
    ov.stat('hl', { x: 120, y: 120, value: 700, unit: 't', label: 'Hook load rating', desc: 'about 680 tonnes on this rig class' }, t, l2 + 0.5, info.dur);
  },
  teardown(W) { W.rig.xray(null); W.rig.lineMat.emissiveIntensity = 0; W.crew.visible = true; },
};

/** Exaggerated swell for the demo: heave in metres at time t. */
const heaveAt = (t) => 2.6 * Math.sin((t / 9.5) * Math.PI * 2) + 0.5 * Math.sin((t / 4.1) * Math.PI * 2 + 1);

function graphSVG(t, comp) {
  // last 12 s of rig heave (white) and bit motion (red/green)
  const w = 460, h = 170, pts = [], bit = [];
  for (let i = 0; i <= 120; i++) {
    const tt = t - 12 + i * 0.1;
    const hv = heaveAt(Math.max(0, tt));
    const c = comp(tt);
    pts.push(`${(i / 120 * w).toFixed(1)},${(h / 2 - hv * 20).toFixed(1)}`);
    bit.push(`${(i / 120 * w).toFixed(1)},${(h / 2 - hv * 20 * (1 - c)).toFixed(1)}`);
  }
  const col = comp(t) > 0.5 ? '#6dff9a' : '#ff5a4e';
  return `<div class="note" style="opacity:1;margin-bottom:10px">Vertical motion · last 12 s</div>
  <svg width="${w}" height="${h}" style="overflow:visible"><line x1="0" y1="${h / 2}" x2="${w}" y2="${h / 2}" stroke="rgba(255,255,255,0.25)" stroke-dasharray="4 6"/>
  <polyline points="${pts.join(' ')}" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.85"/>
  <polyline points="${bit.join(' ')}" fill="none" stroke="${col}" stroke-width="4"/></svg>
  <div style="display:flex;gap:28px;margin-top:10px;font-size:20px;font-weight:600"><span>── rig</span><span style="color:${col}">── drill bit</span></div>`;
}

export const heave = {
  look: { bloom: 0.5, vignette: 0.45 },
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('overcast', { amp: 1.6, chop: 0.8, foam: 0.6, fog: 0.00014, exposure: 1.05, skyOverrides: { cover: 0.65 } });
    W.shadowBox([0, 40, 0], 70, 500);
  },
  oceanT0: 900,
  update(W, t, info) {
    const R = W.rig;
    const l1 = lineStart(info, 1);
    const hv = heaveAt(t);
    R.setMotion(hv, 0.004 * Math.sin(t * 0.6), 0.003 * Math.sin(t * 0.5));
    W.ocean.setColumns(R.worldColumns());
    const comp = (tt) => sstep(l1 + 2.5, l1 + 4.0, tt);
    const c = comp(t);
    // compensated: top drive moves opposite to the heave so the string stays still in world space
    const tdY = 60 - hv * c;
    R.setTopDrive(tdY);
    R.setStringTop(tdY);
    camPath([
      [0, [52, 50, 46], [0, 50, 4], 40],
      [info.dur, [46, 47, 52], [0, 52, 4], 40],
    ], (u) => u)(t, W.camera);
    const ov = W.ov;
    ov.html('g', { x: 1330, y: 120, cls: 'panel', html: graphSVG(t, comp) }, t, 1.0, info.dur);
    ov.html('cmp', { x: 1330, y: 470, cls: 'badge', html: c > 0.5 ? 'Heave compensation · ON' : 'Heave compensation · OFF', style: { borderColor: c > 0.5 ? '#6dff9a' : '#ff5a4e', color: c > 0.5 ? '#6dff9a' : '#ff5a4e' } }, t, 1.0, info.dur);
    ov.label('tdl', { at: () => R.local([0, R.td.position.y + 5, 6]), text: 'Top drive', sub: c > 0.5 ? 'moves against the waves' : 'moves with the rig', side: 'left', dx: 100, dy: -40 }, t, 2.0, info.dur);
  },
};
