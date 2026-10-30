// Chapter 0 — cold open: storm, the rig, title.
import * as THREE from 'three';
import { camPath, noise1, clamp, sstep, win, easeInOut, lerp } from '../engine/util.js';
import { rigOnOcean, aboveWater, lineStart, lineEnd, fades } from './common.js';
import { createRain } from '../world/rain.js';
import { waterHeight } from '../world/ocean.js';

let rain = null;

function shake(cam, t, amt = 0.25) {
  cam.position.x += noise1(t * 0.7, 1) * amt;
  cam.position.y += noise1(t * 0.9, 2) * amt;
  cam.rotation.z += noise1(t * 0.5, 3) * 0.004;
}

export const open_storm = {
  look: { bloom: 0.6, bloomThreshold: 1.25, vignette: 0.5, grain: 0.05, sat: 0.9, contrast: 1.12, tint: 0xdde6ee },
  build(W) {
    rain = createRain();
    W.addSet('rain', rain.mesh);
  },
  setup(W) {
    W.show(['sky', 'ocean', 'rig', 'rain']);
    W.envOcean('storm', { amp: 2.5, chop: 0.9, foam: 1.0, fog: 0.00042, fogMul: 0.6, exposure: 1.25, lamps: 0.9, hemi: 0.5, sunI: 2.6, fogNear: 300, fogFar: 4500, oceanLights: [[[0, 60, 0], [1.0, 0.7, 0.4]], [[-20, 40, -40], [0.8, 0.8, 0.9]]] });
    W.shadowBox([0, 30, 0], 90, 600);
    
  },
  oceanT0: 100,
  update(W, t, info) {
    const cam = W.camera;
    rigOnOcean(W, t + 100, 1.6);
    W.rig.setTopDrive(48);
    camPath([
      [0, [-1250, 9, 1450], [0, 40, 0], 30],
      [info.dur, [-700, 13, 840], [0, 38, 0], 26],
    ], (u) => u)(t, cam);
    aboveWater(cam, t + 100, 6);
    shake(cam, t, 0.35);
    rain.update(t, cam, 1);
    fades(W, t, info, 2.0, 0);
    const ov = W.ov;
    ov.tag('loc', { text: 'The North Sea', sub: '200 km off the coast of Norway' }, t, 2.6, lineStart(info, 1) - 0.3);
    ov.stat('wave', { x: 1320, y: 330, value: 25.6, decimals: 1, unit: 'm', label: 'Draupner wave · 1 Jan 1995', desc: 'First rogue wave ever measured by instrument' }, t, lineStart(info, 1) + 5.0, info.dur - 0.3);
  },
};

export const open_rig = {
  look: { bloom: 0.6, bloomThreshold: 1.25, vignette: 0.5, grain: 0.05, sat: 0.9, contrast: 1.12, tint: 0xdde6ee },
  setup(W) {
    W.show(['sky', 'ocean', 'rig', 'rain']);
    W.envOcean('storm', { amp: 2.3, chop: 0.9, foam: 1.0, fog: 0.00042, fogMul: 0.6, exposure: 1.25, lamps: 0.9, hemi: 0.5, sunI: 2.6, fogNear: 300, fogFar: 4500, oceanLights: [[[0, 60, 0], [1.0, 0.7, 0.4]], [[-20, 40, -40], [0.8, 0.8, 0.9]]] });
    W.shadowBox([0, 30, 0], 90, 600);
  },
  oceanT0: 140,
  update(W, t, info) {
    const cam = W.camera;
    rigOnOcean(W, t + 140, 1.5);
    W.rig.setTopDrive(48);
    camPath([
      [0, [118, 5, 132], [31, 4, 37], 38],
      [info.dur * 0.5, [96, 28, 126], [10, 30, 20], 40],
      [info.dur, [70, 70, 120], [0, 60, 0], 42],
    ])(t, cam);
    aboveWater(cam, t + 140, 4);
    shake(cam, t, 0.25);
    rain.update(t, cam, 0.9);
  },
};

export const title = {
  look: { bloom: 0.7, bloomThreshold: 1.1, vignette: 0.5, grain: 0.04, sat: 1.08, contrast: 1.1 },
  setup(W) {
    W.show(['sky', 'ocean', 'rig']);
    W.envOcean('dusk', { amp: 1.1, chop: 0.8, foam: 0.5, fog: 0.00012, exposure: 0.95, lamps: 1.0, skyOverrides: { cover: 0.5 }, oceanLights: [[[0, 60, 0], [1.0, 0.7, 0.4]]] });
    W.shadowBox([0, 30, 0], 90, 600);
  },
  oceanT0: 50,
  update(W, t, info) {
    const cam = W.camera;
    rigOnOcean(W, t + 50, 1);
    W.rig.setTopDrive(48);
    camPath([
      [0, [-150, 22, 205], [0, 45, 0], 36],
      [info.dur, [-235, 36, 320], [0, 42, 0], 36],
    ], (u) => u)(t, cam);
    aboveWater(cam, t + 50, 4);
    W.ov.title('title', { kicker: 'How Norway drills for oil and gas', big: 'THE DRILLING RIG', sub: 'Inside a modern semi-submersible on the Norwegian Continental Shelf' }, t, lineEnd(info, 0) - 0.4, info.dur + 1);
    fades(W, t, info, 0, 1.4);
  },
};
