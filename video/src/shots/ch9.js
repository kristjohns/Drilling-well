// Chapter 9 — Well control: barriers, kick, shut-in, shear rams, managed pressure drilling.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, smooth, win } from '../engine/util.js';
import { lineStart, lineEnd } from './common.js';
import { ensureWell, wellEnv } from './ch6.js';
import { TD, SECTIONS, sectionStates } from '../world/well.js';
import { createShear } from '../world/misc.js';

const drilled = () => sectionStates(4, 4, 1, 0, 0);

export const barriers = {
  look: { bloom: 0.55, vignette: 0.42 },
  build: ensureWell,
  setup(W) { wellEnv(W); },
  update(W, t, info) {
    const l2 = lineStart(info, 2);
    const p = sstep(l2 + 1.6, l2 + 2.4, t), s = sstep(l2 + 4.0, l2 + 4.8, t);
    W.well.set({ hole: TD, sections: drilled(), string: TD - 0.5, flow: 0.4, time: t, primary: p, secondary: s });
    // BOP glows red with the secondary envelope
    W.well.bop.traverse((o) => { if (o.isMesh) { o.material = o.userData.m0 || (o.userData.m0 = o.material); } });
    camPath([
      [0, [40, -18, 120], [0, -40, 0], 48],
      [info.dur, [30, -26, 112], [0, -46, 0], 48],
    ], (u) => u)(t, W.camera);
    const ov = W.ov;
    ov.chapter(9, 'Well Control', t, 0.2, 2.3);
    ov.html('ns', { x: 120, y: 120, cls: 'panel', html: '<div class="note" style="opacity:1">NORSOK D-010</div><div style="font-size:36px;font-weight:800;margin-top:6px">Two independent barriers</div><div style="font-size:21px;opacity:0.85;margin-top:6px">between the reservoir and the surface, at all times</div>' }, t, lineStart(info, 1) + 1.0, info.dur);
    ov.label('pb', { at: new THREE.Vector3(0, -62, 0.2), text: 'Primary barrier', sub: 'the mud column', side: 'left', dx: 120, dy: -40, color: '#5fb2ff' }, t, l2 + 1.8, info.dur);
    ov.label('sb', { at: new THREE.Vector3(SECTIONS[1].od, -30, 0.2), text: 'Secondary barrier', sub: 'casing · cement · wellhead · BOP', side: 'right', dx: 130, dy: -40, color: '#ff5a4e' }, t, l2 + 4.2, info.dur);
  },
};

function gauge(name, v, unit, alarm) {
  return `<div class="h">${name}</div><div class="val">${v}${unit}</div><div class="track"><div class="fill" style="width:${Math.min(100, 30 + parseFloat(v) * 6)}%"></div></div>`;
}

export const kick = {
  look: { bloom: 0.55, vignette: 0.45 },
  build: ensureWell,
  setup(W) { wellEnv(W); },
  update(W, t, info) {
    const l1 = lineStart(info, 1);
    const k = sstep(2.0, 6.0, t);
    W.well.set({ hole: TD, sections: drilled(), string: TD - 0.5, flow: 1, time: t, kick: k, kickH: lerp(2, 26, sstep(2, 15, t)), formP: 0.45 * sstep(0.5, 2.5, t) });
    camPath([[0, [9, -270, 34], [0, -278, 0], 44], [info.dur, [7, -265, 30], [0, -272, 0], 44]], (u) => u)(t, W.camera);
    const gain = Math.max(0, (t - (l1 + 1.0)) * 0.9);
    const alarm = gain > 1.6;
    W.post.grade.uniforms.uRed.value = alarm ? 0.35 + 0.25 * Math.sin(t * 10) : 0;
    const ov = W.ov;
    ov.label('gas', { at: new THREE.Vector3(3.0, -288, 0.3), text: 'Kick', sub: 'gas pushes into the well', side: 'right', dx: 100, dy: -50, color: '#ffb23f' }, t, 3.0, info.dur);
    const e = ov.html('pit', { x: 1460, y: 140, cls: 'gauge panel' + (alarm ? ' alarm' : ''), html: gauge('Pit volume gain', gain.toFixed(1), ' m³') + `<div class="h" style="margin-top:22px">Flow out</div><div class="val">${(100 + gain * 9).toFixed(0)}%</div>` }, t, l1 + 0.4, info.dur);
    if (alarm) ov.html('al', { x: 760, y: 120, cls: 'alarmbox', html: '⚠ KICK ALARM' }, t, l1 + 0.4, info.dur, 0.1);
  },
  teardown(W) { W.post.grade.uniforms.uRed.value = 0; },
};

let SHEAR = null;
export const shutin = {
  look: { bloom: 0.65, bloomThreshold: 1.2, vignette: 0.45 },
  build(W) {
    ensureWell(W);
    if (!SHEAR) { SHEAR = createShear(); W.addSet('shear', SHEAR.group); }
  },
  setup(W) { this._seg = -1; },
  update(W, t, info) {
    const l1 = lineStart(info, 1);
    const seg = t < l1 - 0.3 ? 0 : 1;
    if (seg !== this._seg) {
      this._seg = seg;
      if (seg === 0) wellEnv(W);
      else {
        W.show(['shear']);
        W.envStudio({ sunDir: [0.25, 0.18, 1.0], sunI: 3.0, hemi: 0.9, exposure: 1.15, bg: new THREE.Color('#05070a') });
        W.shadowBox([0, 0, 0], 6, 40);
      }
    }
    W.post.grade.uniforms.uFade.value = Math.max(0, 1 - Math.abs(t - (l1 - 0.3)) / 0.3);
    const ov = W.ov;
    if (seg === 0) {
      // shut in, then circulate the gas up and out while heavy mud fills the well
      const circ = sstep(3.5, l1 - 0.6, t);
      W.well.set({ hole: TD, sections: drilled(), string: TD - 0.5, flow: 0.8, time: t, kick: 1 - circ * 0.9, kickH: lerp(26, 290, circ), heavy: circ, formP: 0.6 * (1 - circ) });
      camPath([[0, [30, -6, 120], [0, -30, 0], 48], [l1 - 0.3, [26, -12, 110], [0, -36, 0], 48]], (u) => u)(t, W.camera);
      ov.label('bopc', { at: new THREE.Vector3(1.3, 5.6, -1.6), text: 'BOP closed', sub: 'well shut in', side: 'right', dx: 90, dy: -40, color: '#ff5a4e' }, t, 0.8, l1 - 0.4);
      ov.html('ch', { x: 120, y: 120, cls: 'panel', html: '<div class="note" style="opacity:1">Circulating out the kick</div><div style="font-size:24px;margin-top:8px">gas leaves through the <b>choke</b><br/>heavier <b>kill mud</b> restores the balance</div>' }, t, 3.0, l1 - 0.4);
    } else {
      const k = clamp((t - l1 - 0.3) / (info.dur - l1 - 1.4));
      SHEAR.set(k, t);
      camPath([[l1 - 0.3, [1.2, 1.0, 3.6], [0, 0, -0.45], 40], [info.dur, [0.9, 0.7, 2.9], [0, 0, -0.45], 40]], (u) => u)(t, W.camera);
      ov.label('sr', { at: new THREE.Vector3(-0.8, 0.12, -0.2), text: 'Shear ram', sub: 'cuts the drill pipe and seals the well', side: 'left', dx: 90, dy: -60, color: '#ff5a4e' }, t, l1 + 0.8, info.dur);
    }
  },
};

function mpdChart(t, t0) {
  const w = 640, h = 330;
  const k = clamp((t - t0) / 6);
  const pts = [];
  for (let i = 0; i <= 160 * k; i++) {
    const x = i / 160 * w;
    const y = h * 0.5 + Math.sin(i * 0.31) * 6 + Math.sin(i * 0.07) * 9;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return `<div class="note" style="opacity:1;margin-bottom:12px">Bottom-hole pressure · managed</div>
  <svg width="${w}" height="${h}">
    <rect x="0" y="0" width="${w}" height="${h * 0.24}" fill="rgba(255,80,60,0.18)"/>
    <rect x="0" y="${h * 0.76}" width="${w}" height="${h * 0.24}" fill="rgba(80,140,255,0.18)"/>
    <line x1="0" y1="${h * 0.24}" x2="${w}" y2="${h * 0.24}" stroke="#ff5a4e" stroke-width="2"/>
    <line x1="0" y1="${h * 0.76}" x2="${w}" y2="${h * 0.76}" stroke="#5fb2ff" stroke-width="2"/>
    <text x="10" y="${h * 0.24 - 10}" fill="#ff8a7e" font-size="18" font-family="Inter" font-weight="600">FRACTURE PRESSURE · rock breaks, mud lost</text>
    <text x="10" y="${h * 0.76 + 26}" fill="#8cc4ff" font-size="18" font-family="Inter" font-weight="600">PORE PRESSURE · fluids flow in</text>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#ffb23f" stroke-width="4"/>
  </svg>`;
}

export const mpd = {
  look: { bloom: 0.5, vignette: 0.5 },
  build: ensureWell,
  setup(W) { wellEnv(W, { exposure: 0.7 }); },
  update(W, t, info) {
    W.well.set({ hole: TD, sections: drilled(), string: TD - 0.5, flow: 1, time: t });
    camPath([[0, [16, -250, 60], [0, -262, 0], 44], [info.dur, [12, -246, 54], [0, -258, 0], 44]], (u) => u)(t, W.camera);
    W.ov.html('mpd', { x: 1140, y: 200, cls: 'panel', html: mpdChart(t, 1.0) }, t, 0.6, info.dur);
    W.ov.tag('mt', { text: 'Managed pressure drilling', sub: 'automated choke + pumps hold the pressure in the window' }, t, 1.5, info.dur);
  },
};
