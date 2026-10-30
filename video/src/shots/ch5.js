// Chapter 5 — The drill floor: red zone, fingerboard, racker, iron roughneck, slips, cabin, robots.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, easeInOut, smooth, win } from '../engine/util.js';
import { rigOnOcean, lineStart, lineEnd } from './common.js';
import { RIG } from '../world/rig.js';

const SLOT = 9 * 16 + 12;               // stand slot picked by the racker (x=-3.04, z=2.7)
const SLOT_AUX = 9 * 16 + 3;            // slot used offline at the auxiliary side (z=-2.7)

function floorEnv(W, o = {}) {
  W.show(['sky', 'ocean', 'rig']);
  W.envOcean('sunset', { amp: 0.6, chop: 0.75, foam: 0.4, fog: 0.0001, exposure: 1.05, lamps: 0.35, skyOverrides: { sun: [0.5, 0.33, 0.8], cover: 0.35 }, ...o });
  W.shadowBox([0, 45, 4], 30, 300);
  W.crew.visible = false;
  // reset machines to parked
  const R = W.rig;
  R.racker.position.set(-2.2, RIG.floorY, 2);
  R.racker.rotation.y = 0;
  R.roughneck.position.set(4.8, RIG.floorY, RIG.wcMain.z + 2.4);
  R.slips.position.copy(RIG.wcMain);
  R.freeStand.visible = false;
  R.freeStand.rotation.set(0, 0, 0);
}

/** Racker carrying a stand from a setback slot to a well centre. p in 0..1 */
function rackerMove(R, racker, slotIdx, wc, p, stand = R.freeStand) {
  const slot = R.standSlots[slotIdx];
  const reachSlot = racker.position.x - slot.x;          // positive reach toward -x
  const ph1 = smooth(clamp(p / 0.25));                   // extend arms to the stand
  const ph2 = smooth(clamp((p - 0.25) / 0.15));          // grip + lift
  const ph3 = smooth(clamp((p - 0.4) / 0.45));           // travel + rotate to well centre
  const ph4 = smooth(clamp((p - 0.85) / 0.15));          // set down over stump
  const reachWC = Math.abs(wc.x - racker.position.x);
  const yaw = lerp(0, Math.PI, ph3);
  const reach = ph3 > 0 ? lerp(reachSlot, reachWC, ph3) : lerp(0.3, reachSlot, ph1);
  const z = lerp(slot.z, wc.z, ph3);
  racker.position.z = ph1 < 1 && ph3 === 0 ? lerp(racker.userData.z0 ?? racker.position.z, slot.z, ph1) : z;
  racker.rotation.y = yaw;
  for (const a of [racker.userData.lower, racker.userData.upper]) a.scale.x = Math.max(0.1, reach / 3.55);
  if (ph2 > 0) {
    R.hideStand(slotIdx);
    stand.visible = true;
    const sx = racker.position.x - Math.cos(yaw) * reach;
    const sz = racker.position.z + Math.sin(yaw) * reach;
    stand.position.set(sx, 40.25 + ph2 * 0.6 - ph4 * 0.45 + (ph4 > 0 ? 0.6 : 0), sz);
  }
  return { ph1, ph2, ph3, ph4 };
}

export const floor_intro = {
  look: { bloom: 0.55, vignette: 0.42 },
  setup(W) { floorEnv(W); },
  oceanT0: 1000,
  update(W, t, info) {
    rigOnOcean(W, t + 1000, 0.3);
    const R = W.rig;
    R.setTopDrive(66); R.setStringTop(41.2);
    camPath([
      [0, [7, 46.5, 27], [0, 41.5, 3], 50],
      [info.dur, [-4, 44.5, 24], [0, 41.2, 2], 48],
    ], (u) => u)(t, W.camera);
    const l1 = lineStart(info, 1);
    const pulse = sstep(l1 + 2.5, l1 + 3.5, t);
    R.redZones.children.forEach((z) => { z.material.opacity = 0.55 + 0.45 * pulse * (0.6 + 0.4 * Math.sin(t * 5)); });
    const ov = W.ov;
    ov.chapter(5, 'The Drill Floor', t, 0.2, 2.3);
    ov.label('rz', { at: R.local([0, 40.2, 9.2]), text: 'Red zone', sub: 'no people while machines move', side: 'right', dx: 80, dy: 40, color: '#ff5a4e' }, t, l1 + 2.6, info.dur);
    ov.label('wc', { at: R.local([0, 41.0, 6]), text: 'Well centre', side: 'left', dx: 90, dy: -60 }, t, l1 + 1.2, info.dur);
  },
  teardown(W) { W.crew.visible = true; W.rig.redZones.children.forEach((z) => { z.material.opacity = 0.85; }); },
};

export const fingerboard = {
  look: { bloom: 0.55, vignette: 0.42 },
  setup(W) { floorEnv(W); W.rig.racker.userData.z0 = 2; },
  oceanT0: 1030,
  update(W, t, info) {
    rigOnOcean(W, t + 1030, 0.3);
    const R = W.rig;
    R.setTopDrive(70); R.setStringTop(41.2);
    const l1 = lineStart(info, 1);
    const p = clamp((t - l1 - 0.3) / (info.dur - l1 - 0.8));
    rackerMove(R, R.racker, SLOT, RIG.wcMain, p);
    camPath([
      [0, [1.2, 42.6, 11.8], [-5.2, 60, -1.0], 62],
      [l1 - 0.3, [2.4, 43.2, 12.8], [-3.5, 52, 0.5], 60],
      [info.dur, [6.5, 45.5, 14.5], [-0.8, 46, 3.5], 56],
    ])(t, W.camera);
    const ov = W.ov;
    ov.label('fb', { at: R.local([-5.2, 67.8, -3]), text: 'Fingerboard', sub: 'stands racked upright', side: 'right', dx: 80, dy: -50 }, t, 1.0, l1 - 0.2);
    ov.label('st', { at: R.local([-3.5, 55, 4.5]), text: 'Stand · 3 joints', sub: '≈ 28 m long', side: 'right', dx: 90, dy: 30 }, t, 3.4, l1 - 0.2);
    ov.label('rk', { at: () => R.local([R.racker.position.x, 52, R.racker.position.z]), text: 'Pipe racker', sub: 'pipe-handling machine', side: 'right', dx: 90, dy: -30 }, t, l1 + 0.6, info.dur);
  },
  teardown(W) { W.crew.visible = true; },
};

export const roughneck = {
  look: { bloom: 0.55, vignette: 0.42 },
  setup(W) { floorEnv(W); },
  oceanT0: 1060,
  update(W, t, info) {
    rigOnOcean(W, t + 1060, 0.3);
    const R = W.rig, wc = RIG.wcMain;
    const l1 = lineStart(info, 1);
    // stand stabbed on the stump, held by the elevator
    const stumpTop = 41.2;
    const move = smooth(clamp((t - 0.6) / 1.6)) * (1 - smooth(clamp((t - (l1 - 1.2)) / 1.4)));
    R.roughneck.position.set(lerp(4.8, 1.05, move), RIG.floorY, lerp(wc.z + 2.4, wc.z, move));
    const spin = clamp((t - 2.6) / 2.4);
    const torque = sstep(5.3, 6.0, t) * (1 - sstep(l1 - 1.4, l1 - 1.0, t));
    R.roughneck.userData.tool.children.forEach(() => {});
    // lower after slips release
    const release = sstep(l1 + 2.6, l1 + 3.4, t);
    const lower = smooth(clamp((t - (l1 + 3.6)) / (info.dur - l1 - 4.0)));
    const standBottom = stumpTop + 0.15 - lower * 24;
    R.freeStand.visible = true;
    R.freeStand.position.set(wc.x, standBottom, wc.z);
    R.freeStand.rotation.y = spin * Math.PI * 6 + torque * 0.15;
    R.setTopDrive(standBottom + RIG.standLen - 0.2);
    R.setStringTop(stumpTop - lower * 24);
    R.slips.position.set(wc.x, wc.y + release * 0.55, wc.z);
    camPath([
      [0, [4.2, 42.9, 10.2], [0, 42.1, 6], 48],
      [l1, [3.6, 42.7, 10.6], [0, 42.2, 6], 46],
      [info.dur, [8.5, 47, 15], [0, 46, 5.5], 50],
    ])(t, W.camera);
    const ov = W.ov;
    ov.label('ir', { at: () => R.local([R.roughneck.position.x - 0.6, 42.6, R.roughneck.position.z]), text: 'Iron roughneck', sub: 'spins & torques the threads', side: 'right', dx: 90, dy: -60 }, t, 1.2, l1 - 0.4);
    ov.html('tq', { x: 1330, y: 160, cls: 'panel', html: `<div class="note" style="opacity:1">Make-up torque</div><div style="font-size:64px;font-weight:800;margin-top:6px">${Math.round(lerp(0, 52, sstep(5.3, 6.0, t)) * 1000).toLocaleString('en-US')}<small style="font-size:26px;margin-left:8px">N·m</small></div>` }, t, 5.0, l1 - 0.6);
    ov.label('sl', { at: R.local([0.4, 40.5, 6.6]), text: 'Power slips', sub: release > 0.5 ? 'released' : 'gripping the string', side: 'right', dx: 90, dy: 50 }, t, l1 + 0.4, l1 + 4.2);
  },
  teardown(W) { W.crew.visible = true; W.rig.freeStand.visible = false; W.rig.slips.position.copy(RIG.wcMain); },
};

export const offline = {
  look: { bloom: 0.55, vignette: 0.42 },
  setup(W) { floorEnv(W); W.rig.rackerAux.userData.z0 = -2.5; },
  oceanT0: 1090,
  update(W, t, info) {
    rigOnOcean(W, t + 1090, 0.3);
    const R = W.rig;
    // main: string going down slowly (drilling)
    const y = lerp(66, 48, clamp(t / info.dur));
    R.setTopDrive(y, 62);
    R.setStringTop(y);
    // aux: racker brings a stand to the auxiliary well centre (z = -6)
    if (!R.auxStand) {
      R.auxStand = R.freeStand.clone(true);
      R.root.add(R.auxStand);
    }
    R.auxStand.visible = true;
    rackerMove(R, R.rackerAux, SLOT_AUX, RIG.wcAux, clamp((t - 0.8) / (info.dur - 1.6)), R.auxStand);
    camPath([
      [0, [6.5, 50, 2.5], [-0.8, 40.8, 0.5], 62],
      [info.dur, [6.5, 50, -2.5], [-0.8, 40.8, -0.5], 62],
    ], (u) => u)(t, W.camera);
    const ov = W.ov;
    ov.label('m', { at: R.local([0, 44, 6]), text: 'Main well centre', sub: 'drilling', side: 'right', dx: 80, dy: 50 }, t, 1.0, info.dur);
    ov.label('a', { at: R.local([0, 44, -6]), text: 'Auxiliary well centre', sub: 'building stands offline', side: 'left', dx: 70, dy: -80, color: '#5fd3ff' }, t, 2.2, info.dur);
  },
  teardown(W) { W.crew.visible = true; if (W.rig.auxStand) W.rig.auxStand.visible = false; },
};

export const cabin = {
  look: { bloom: 0.8, bloomThreshold: 0.9, vignette: 0.5 },
  setup(W) {
    floorEnv(W, { lamps: 0.6, exposure: 1.1 });
    W.rig.cabinGlass.material.opacity = 0.1;
    W.rig.cabinGlass.material.depthWrite = false;
  },
  oceanT0: 1110,
  update(W, t, info) {
    rigOnOcean(W, t + 1110, 0.3);
    const R = W.rig;
    const y = lerp(64, 56, clamp(t / info.dur));
    R.setTopDrive(y); R.setStringTop(y);
    R.cabin.userData.screens.forEach((s) => s.draw(t));
    camPath([
      [0, [15.4, 42.9, 0.9], [9, 43.2, 2.2], 60],
      [info.dur, [14.9, 43.0, 0.4], [0, 46, 4.5], 58],
    ], (u) => u)(t, W.camera);
    W.ov.tag('dc', { text: "Driller's cabin", sub: 'every machine on the floor, controlled from here' }, t, 0.6, info.dur);
  },
  teardown(W) { W.crew.visible = true; W.rig.cabinGlass.material.opacity = 1; W.rig.cabinGlass.material.depthWrite = true; },
};

export const robot = {
  look: { bloom: 0.55, vignette: 0.45 },
  setup(W) { floorEnv(W); },
  oceanT0: 1130,
  update(W, t, info) {
    rigOnOcean(W, t + 1130, 0.3);
    const R = W.rig;
    R.setTopDrive(68); R.setStringTop(41.2);
    // arm works on the pipe at the well centre: reach, dwell, retract, reach again
    R.robot.group.visible = true;
    const cyc = (t % 5.5) / 5.5;
    const reach = Math.sin(cyc * Math.PI) ** 2;
    R.robot.pose(0.12 * Math.sin(t * 0.9), lerp(0.2, 1.0, reach), lerp(1.25, 0.55, reach), lerp(0.4, 0.9, reach), 0);
    camPath([
      [0, [-6.8, 43.4, 13.6], [-1.1, 41.7, 7.4], 44],
      [info.dur, [-5.6, 42.6, 14.2], [-0.8, 41.9, 7.2], 42],
    ], (u) => u)(t, W.camera);
    const ov = W.ov;
    // pin the callout to the moving upper arm
    R.robot.upper.updateWorldMatrix(true, false);
    const armPt = R.robot.upper.localToWorld(new THREE.Vector3(0, 1.3, 0));
    ov.label('rb', { at: armPt, text: 'Drill-floor robot', sub: 'being tested offshore', side: 'left', dx: 90, dy: -70, color: '#5fd3ff' }, t, 1.2, info.dur);
    ov.tag('st', { text: 'Made in Stavanger', sub: 'Robotic Drilling Systems — now part of Nabors / Canrig' }, t, 4.5, info.dur);
  },
  teardown(W) { W.crew.visible = true; },
};
