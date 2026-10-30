// Chapter 3 — Life offshore: helicopter, rotation, crew.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, easeInOut, easeOut } from '../engine/util.js';
import { rigOnOcean, aboveWater, lineStart, lineEnd } from './common.js';

const HELI_PATH = new THREE.CatmullRomCurve3([
  new THREE.Vector3(-900, 160, -1100), new THREE.Vector3(-420, 110, -520), new THREE.Vector3(-150, 75, -190),
  new THREE.Vector3(-45, 56, -80), new THREE.Vector3(-21, 49, -54), new THREE.Vector3(-20, 46.0, -50),
]);

export const heli = {
  look: { bloom: 0.5, vignette: 0.38 },
  setup(W) {
    W.show(['sky', 'ocean', 'rig', 'heli']);
    W.envOcean('sunset', { amp: 0.9, chop: 0.8, foam: 0.5, fog: 0.00012, exposure: 1.0, lamps: 0.25, skyOverrides: { sun: [0.62, 0.17, 0.77], cover: 0.4 } });
    W.shadowBox([-20, 40, -40], 90, 700);
  },
  oceanT0: 600,
  update(W, t, info) {
    const cam = W.camera, R = W.rig;
    rigOnOcean(W, t + 600, 0.5);
    W.rig.setTopDrive(48);
    const land = 11.0;
    const u = easeOut(clamp(t / land));
    const p = HELI_PATH.getPoint(Math.min(0.999, u));
    const ahead = HELI_PATH.getPoint(Math.min(1, u + 0.01));
    const hp = R.local([p.x, p.y, p.z]);
    W.heli.group.position.copy(hp);
    const yaw = Math.atan2(ahead.x - p.x, ahead.z - p.z);
    W.heli.group.rotation.set(-0.08 * (1 - u) + (u > 0.85 ? 0.06 * Math.sin((u - 0.85) * 20) : 0), u > 0.97 ? 0.9 : yaw, 0.04 * Math.sin(t * 0.8) * (1 - u));
    W.heli.spin(t, t > land + 1.5 ? 200 : 290);
    camPath([
      [0, [35, 54, -2], [-160, 80, -260], 34],
      [6, [25, 52, -10], [-90, 62, -120], 38],
      [land, [8, 52, -22], [-20, 47, -50], 42],
      [info.dur, [4, 54, -18], [-21, 47, -51], 40],
    ])(t, cam);
    const ov = W.ov, l1 = lineStart(info, 1);
    ov.chapter(3, 'Life Offshore', t, 0.2, 2.3);
    // rotation calendar
    const weeks = [1, 1, 0, 0, 0, 0].map((w, i) => {
      const k = clamp((t - l1 - 0.6 - i * 0.18) / 0.4);
      return `<div style="width:118px;height:84px;border-radius:10px;margin-right:12px;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:18px;letter-spacing:0.08em;opacity:${k};transform:translateY(${(1 - k) * 14}px);background:${w ? 'rgba(255,140,40,0.9)' : 'rgba(80,150,220,0.55)'}">${w ? 'OFFSHORE' : 'HOME'}</div>`;
    }).join('');
    ov.html('rot', { x: 140, y: 760, cls: 'panel', html: `<div class="note" style="opacity:1;margin-bottom:16px">A typical rotation · weeks</div><div>${weeks}</div><div style="margin-top:18px;font-size:24px;font-weight:600">12-hour shifts · 07–19 or 19–07 · every day</div>` }, t, l1 + 0.3, info.dur);
  },
};

export const crew = {
  look: { bloom: 0.75, bloomThreshold: 1.05, vignette: 0.45 },
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('night', { amp: 0.7, chop: 0.7, foam: 0.35, fog: 0.00008, exposure: 1.35, lamps: 1.0, hemi: 0.25, envI: 0.25, skyOverrides: { aurora: 0.25 },
      oceanLights: [[[0, 70, 0], [1.0, 0.8, 0.55]], [[-5, 38, -46], [1.0, 0.85, 0.6]], [[30, 33, 20], [0.9, 0.95, 1.0]]] });
    W.shadowBox([0, 40, 0], 70, 600);
    // night: floodlit drill floor from a spot light
    if (!W.lights.flood) {
      const s = new THREE.SpotLight(0xffe2b0, 4000, 160, 0.75, 0.6, 1.6);
      s.position.set(20, 80, 30); s.target.position.set(0, 40, 0);
      W.scene.add(s, s.target);
      W.lights.flood = s;
    }
    W.lights.flood.visible = true;
  },
  oceanT0: 700,
  update(W, t, info) {
    const cam = W.camera, R = W.rig;
    rigOnOcean(W, t + 700, 0.5);
    W.rig.setTopDrive(40 + 20 * (0.5 + 0.5 * Math.sin(t * 0.25)));
    const fl = W.lights.flood;
    fl.position.copy(R.local([22, 85, 28])); fl.target.position.copy(R.local([0, 40, 0]));
    camPath([
      [0, [70, 58, 70], [0, 50, 0], 40],
      [info.dur, [42, 48, -78], [0, 52, 0], 42],
    ], (u) => u)(t, cam);
    const ov = W.ov;
    ov.list('roles', { x: 120, y: 200, head: 'Who works out here', items: [
      ['Driller', 'runs the drilling'], ['Assistant driller'], ['Derrick operator'], ['Roughnecks'], ['Crane operators'], ['Mechanics & electricians'],
      ['Mud engineer'], ['Directional driller'], ['Drilling supervisor', 'the oil company'],
    ], stagger: 0.75, panel: true }, t, lineStart(info, 0) + 0.3, lineEnd(info, 0) + 0.8);
    ov.stat('247', { x: 1460, y: 380, value: 24, unit: '/ 7', label: 'The rig never sleeps', desc: 'drilling continues around the clock' }, t, lineStart(info, 1), info.dur);
  },
  teardown(W) { if (W.lights.flood) W.lights.flood.visible = false; },
};
