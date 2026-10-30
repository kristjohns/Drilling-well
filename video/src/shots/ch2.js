// Chapter 2 — Meet the rig.
import * as THREE from 'three';
import { camPath, orbit, win, sstep, easeInOut, lerp, clamp } from '../engine/util.js';
import { rigOnOcean, aboveWater, lineStart, lineEnd, fades, captureAbove, waterSwitch } from './common.js';
import { ensureSets } from './sets.js';
import { floaterMotion } from '../world/ocean.js';

export const rig_orbit = {
  look: { bloom: 0.5, vignette: 0.32 },
  build: ensureSets,
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('day', { amp: 0.9, chop: 0.8, foam: 0.5, fog: 0.00009, exposure: 1.0 });
    W.shadowBox([0, 30, 0], 95, 700);
  },
  oceanT0: 200,
  update(W, t, info) {
    const cam = W.camera;
    rigOnOcean(W, t + 200, 0.8);
    W.rig.setTopDrive(52);
    const a = lerp(0.1, -0.75, easeInOut(t / info.dur));
    orbit(cam, [0, 26, 0], lerp(250, 205, t / info.dur), lerp(78, 46, easeInOut(t / info.dur)), a, 38);
    aboveWater(cam, t + 200, 5);
    const ov = W.ov, R = W.rig;
    ov.chapter(2, 'Meet the Rig', t, 0.2, 2.3);
    ov.tag('type', { text: 'Semi-submersible drilling rig', sub: 'Harsh-environment class · built for Norwegian winters' }, t, lineStart(info, 0), lineEnd(info, 0) + 0.6);
    const l1 = lineStart(info, 1);
    ov.label('len', { at: R.local([31, -1, -56]), text: '≈ 120 m long', sub: 'pontoons 114 m', side: 'left', dx: 120, dy: 90 }, t, l1 + 0.2, info.dur);
    ov.stat('disp', { x: 1460, y: 150, value: 60000, unit: 't', label: 'Displacement', desc: 'the weight of the water it pushes aside' }, t, l1 + 2.6, info.dur);
    ov.label('derrick', { at: R.local([0, 80, 0]), text: 'Derrick', sub: '52 m tall', side: 'right', dx: 90, dy: 40 }, t, l1 + 0.8, info.dur);
  },
};

export const rig_underwater = {
  look: { bloom: 0.5, vignette: 0.45 },
  setup(W) {
    W.show(['sky', 'ocean', 'rig', 'psv', 'subsea']);
    W.envOcean('overcast', { amp: 1.7, chop: 0.85, foam: 0.75, fog: 0.00016, exposure: 1.05, skyOverrides: { cover: 0.7 } });
    captureAbove(W);
    W.shadowBox([0, 0, 0], 110, 700);
  },
  oceanT0: 300,
  update(W, t, info) {
    const tt = t + 300, cam = W.camera;
    rigOnOcean(W, tt, 1.0);
    W.rig.setTopDrive(50);
    W.psv.float(tt, 150, -40, 0.25, 1.15);
    const l1 = lineStart(info, 1);
    camPath([
      [0, [95, -21, 120], [31, -18, 37], 50],
      [l1 - 1.6, [118, -13, 95], [20, -10, 20], 52],
      [l1 + 0.6, [190, 6, 150], [60, 4, -10], 44],
      [info.dur, [265, 22, 175], [70, 2, -20], 42],
    ])(t, cam);
    const under = waterSwitch(W, tt, { color: [0.0, 0.1, 0.13], fog: 0.0038, exposure: 1.3, sunI: 3.4, hemi: 1.2 });
    if (under) {
      // key light from above and behind the camera so the hull sides read (no shadows needed underwater)
      W.lights.sun.position.copy(cam.position).add(new THREE.Vector3(0, 120, 0)).addScaledVector(cam.getWorldDirection(new THREE.Vector3()), -60);
      W.lights.sun.target.position.set(31, -18, 37);
      W.lights.sun.castShadow = false;
    } else W.lights.sun.castShadow = true;
    W.subsea.update(t, cam, { snowOn: under });
    W.sets.subsea.visible = under;
    const ov = W.ov, R = W.rig;
    ov.label('pont', { at: R.local([31, -20, 30]), text: 'Pontoons', sub: '20+ m below the surface', side: 'left', dx: 110, dy: 120 }, t, 2.6, l1 - 1.2);
    ov.label('col', { at: R.local([23.5, -4, 37]), text: 'Columns', sub: 'the only part crossing the waves', side: 'left', dx: 120, dy: -80 }, t, 6.0, l1 - 1.2);
    ov.label('psv', { at: () => W.psv.group.localToWorld(new THREE.Vector3(0, 16, 10)), text: 'Supply ship', sub: 'pitches and rolls', side: 'right', dx: 60, dy: -70 }, t, l1 + 1.0, info.dur);
    ov.label('semi', { at: R.local([0, 60, 0]), text: 'Semi-submersible', sub: 'barely moves', side: 'left', dx: 80, dy: -60 }, t, l1 + 1.8, info.dur);
  },
};

export const rig_deck = {
  look: { bloom: 0.5, vignette: 0.35 },
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('day', { amp: 0.8, chop: 0.8, foam: 0.45, fog: 0.00009, exposure: 1.0, skyOverrides: { sun: [0.62, 0.48, 0.62] } });
    W.shadowBox([0, 30, 0], 80, 600);
  },
  oceanT0: 400,
  update(W, t, info) {
    const cam = W.camera, R = W.rig;
    rigOnOcean(W, t + 400, 0.6);
    W.rig.setTopDrive(56);
    const l0 = lineStart(info, 0), l1 = lineStart(info, 1);
    camPath([
      [0, [60, 70, 120], [0, 50, 0], 42],
      [l0 + 3.6, [-55, 60, 95], [-20, 30, 25], 44],
      [l0 + 7.0, [-95, 70, -10], [-15, 40, -40], 44],
      [l1 + 0.5, [10, 75, -95], [20, 35, -20], 44],
      [info.dur, [95, 62, -70], [24, 36, -18], 42],
    ])(t, cam);
    const ov = W.ov;
    ov.label('d', { at: R.local([0, 80, 0]), text: 'Derrick', sub: '52 m', side: 'right', dx: 90, dy: -30 }, t, l0 + 0.6, l0 + 4.8);
    ov.label('p', { at: R.local([-24, 29, 25]), text: 'Pipe deck', sub: 'drill pipe & casing', side: 'left', dx: 90, dy: -60 }, t, l0 + 2.4, l0 + 6.0);
    ov.label('c', { at: R.local([-35.5, 37, -2]), text: 'Cranes', side: 'left', dx: 80, dy: -70 }, t, l0 + 4.4, l0 + 7.6);
    ov.label('h', { at: R.local([-20, 46, -50]), text: 'Helideck', side: 'right', dx: 90, dy: -60 }, t, l0 + 5.4, l1 + 0.6);
    ov.label('lq', { at: R.local([-5, 38, -46]), text: 'Living quarters', sub: '≈ 130 beds', side: 'left', dx: 100, dy: 60 }, t, l0 + 6.6, l1 + 0.6);
    ov.label('e', { at: R.local([26, 42, -19]), text: '6 diesel generators', sub: '≈ 38 MW total', side: 'right', dx: 90, dy: -60 }, t, l1 + 0.4, info.dur);
  },
};

export const rig_station = {
  look: { bloom: 0.6, bloomThreshold: 1.3, vignette: 0.4 },
  setup(W) {
    W.show(['sky', 'ocean', 'rig', 'holo', 'jets']);
    W.envOcean('day', { amp: 0.9, chop: 0.8, foam: 0.5, fog: 0.00006, exposure: 1.0, fogNear: 3000, fogFar: 12000 });
    W.shadowBox([0, 30, 0], 90, 700);
  },
  oceanT0: 500,
  update(W, t, info) {
    const cam = W.camera;
    rigOnOcean(W, t + 500, 0.8);
    W.rig.setTopDrive(52);
    const l0 = lineStart(info, 0), d = info.dur;
    camPath([
      [0, [500, 560, 160], [0, 0, 0], 50],
      [d * 0.38, [520, 1250, -700], [0, 0, 0], 55],
      [d * 0.62, [260, 300, -260], [0, 0, 0], 50],
      [d, [170, 150, -190], [0, 5, 0], 46],
    ])(t, cam);
    cam.far = 30000; cam.updateProjectionMatrix();
    // anchor lines grow outward, then fade; DP jets pulse in the second half
    const grow = sstep(l0 + 1.0, l0 + 4.5, t), fadeL = 1 - sstep(l0 + 6.0, l0 + 7.0, t);
    W.holo.children.forEach((c) => { c.scale.set(1, 1, 1); });
    W.holo.userData.mat.opacity = grow * fadeL;
    W.holo.scale.set(Math.max(0.001, grow), 1, Math.max(0.001, grow));
    const dp = sstep(l0 + 6.2, l0 + 7.2, t);
    W.jets.visible = dp > 0.01;
    W.jets.children.forEach((c, i) => {
      const p = 0.6 + 0.4 * Math.sin(t * 3 + i * 1.7);
      c.scale.set(1, p * dp + 0.001, 1);
    });
    W.jets.userData.mat.opacity = dp;
    const ov = W.ov;
    ov.label('anch', { at: new THREE.Vector3(560, 2, 420), text: '8+ anchor lines', sub: 'each ~1 km to the seabed', side: 'right', dx: 60, dy: -60 }, t, l0 + 3.0, l0 + 6.8);
    ov.label('dp', { at: W.rig.local([31, 0, 50]), text: 'Dynamic positioning', sub: 'satellite-guided thrusters', side: 'left', dx: 150, dy: 90, color: '#5fd3ff' }, t, l0 + 7.0, d);
    ov.html('sat', { x: 1480, y: 120, cls: 'badge', html: '◉ GNSS · DP CLASS 3', style: { borderColor: '#5fd3ff', color: '#5fd3ff', whiteSpace: 'nowrap' } }, t, l0 + 7.6, d);
  },
};
