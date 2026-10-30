// Chapter 7 — Mud: pits, pumps, downhole jets, shakers; the primary barrier; zero discharge.
import * as THREE from 'three';
import { camPath, sstep, clamp, lerp, smooth, win } from '../engine/util.js';
import { rigOnOcean, lineStart, lineEnd } from './common.js';
import { ensureSets } from './sets.js';
import { ensureWell, wellEnv } from './ch6.js';
import { createMudSystem } from '../world/mudsys.js';
import { createBHA } from '../world/bha.js';
import { SECTIONS, TD, sectionStates } from '../world/well.js';

let MUD = null, BHA = null;
export function ensureMud(W) {
  if (MUD) return;
  MUD = createMudSystem();
  for (const x of [0, 18, 32, 47]) {
    const l = new THREE.PointLight(0xfff0dc, 70, 26, 1.6);
    l.position.set(x, 7, 0);
    MUD.group.add(l);
  }
  W.addSet('mud', MUD.group);
  W.mud = MUD;
}
export function ensureBHA(W) {
  if (BHA) return;
  BHA = createBHA();
  const l = new THREE.PointLight(0xffe6c8, 2.2, 5, 1.5);
  l.position.set(0.9, 0.9, 1.4);
  BHA.group.add(l);
  W.addSet('bha', BHA.group);
  W.bha = BHA;
}

function dip(W, t, cuts, w = 0.3) {
  let f = 0;
  for (const c of cuts) f = Math.max(f, 1 - Math.abs(t - c) / w);
  W.post.grade.uniforms.uFade.value = Math.max(0, f);
}

export const mud_loop = {
  look: { bloom: 0.6, bloomThreshold: 1.3, vignette: 0.45 },
  build(W) { ensureMud(W); ensureBHA(W); ensureWell(W); },
  setup(W) { this._seg = -1; },
  update(W, t, info) {
    const L = (i) => lineStart(info, i);
    const cuts = [L(1) - 0.3, L(2) - 0.3, L(3) - 0.3];
    const seg = t < cuts[0] ? 0 : t < cuts[1] ? 1 : t < cuts[2] ? 2 : 3;
    if (seg !== this._seg) {
      this._seg = seg;
      if (seg === 2) { W.show(['bha']); W.envStudio({ sunDir: [0.3, 0.5, 0.8], sunI: 2.6, hemi: 0.6, exposure: 1.05, bg: new THREE.Color('#040608') }); W.shadowBox([0, 1, 0], 3, 30); }
      else { W.show(['mud']); W.envStudio({ sunDir: [0.2, 0.9, 0.4], sunI: 0.6, hemi: 0.9, exposure: 1.15, bg: new THREE.Color('#05080b'), envI: 0.5 }); W.shadowBox([24, 4, 0], 40, 100); }
    }
    dip(W, t, cuts);
    const ov = W.ov;
    if (seg === 0) {
      W.mud.update(t, { chevrons: 0 });
      camPath([[0, [6.5, 6.4, 7.2], [2.5, 2.6, -2], 50], [cuts[0], [3.5, 5.6, 6.6], [3, 2.6, -2], 48]], (u) => u)(t, W.camera);
      ov.chapter(7, 'Mud', t, 0.2, 2.3);
      ov.label('pits', { at: new THREE.Vector3(2.5, 2.8, -1.8), text: 'Mud pits', sub: 'hundreds of cubic metres, constantly stirred', side: 'right', dx: 90, dy: -60 }, t, L(0) + 1.0, cuts[0]);
    } else if (seg === 1) {
      W.mud.update(t, { chevrons: 1 });
      camPath([[cuts[0], [16.5, 4.2, 7.5], [19.5, 1.8, -1], 46], [cuts[1], [33, 4.6, 7.8], [36, 2.0, -1], 46]], (u) => u)(t, W.camera);
      ov.stat('hp', { x: 120, y: 120, value: 2200, unit: 'hp', label: '× 4 mud pumps', desc: 'triplex piston pumps' }, t, L(1) + 0.8, cuts[1]);
      ov.stat('psi', { x: 120, y: 420, value: 7500, unit: 'psi', label: 'Discharge pressure', desc: '≈ 517 bar' }, t, L(1) + 3.2, cuts[1]);
    } else if (seg === 2) {
      W.bha.update(t, { rot: t * 1.1, flow: 1 });
      camPath([[cuts[1], [0.5, 0.35, 0.95], [0, 0.18, 0], 42], [cuts[2], [0.42, 0.75, 1.0], [0, 0.45, 0], 44]], (u) => u)(t, W.camera);
      ov.label('jet', { at: new THREE.Vector3(0.07, 0.0, 0.05), text: 'Nozzle jets', sub: 'cool the bit, clear the cuttings', side: 'right', dx: 90, dy: 40 }, t, L(2) + 0.6, cuts[2]);
      ov.label('ann', { at: new THREE.Vector3(0.13, 0.7, 0.03), text: 'Annulus', sub: 'mud + cuttings flow back up', side: 'left', dx: 90, dy: -40 }, t, L(2) + 4.2, cuts[2]);
    } else {
      W.mud.update(t, { chevrons: 1 });
      camPath([[cuts[2], [43.5, 5.2, 8.2], [45.5, 1.6, -1], 48], [info.dur, [40.5, 4.6, 6.4], [46.5, 1.6, -1.5], 50]], (u) => u)(t, W.camera);
      ov.label('sh', { at: new THREE.Vector3(45, 2.0, -0.2), text: 'Shale shakers', sub: 'vibrating screens remove cuttings', side: 'right', dx: 90, dy: -60 }, t, L(3) + 0.6, info.dur);
      ov.label('dg', { at: new THREE.Vector3(52.5, 4.2, 5.5), text: 'Degasser', side: 'left', dx: 80, dy: -40 }, t, L(3) + 3.2, info.dur);
      ov.label('cf', { at: new THREE.Vector3(51.5, 1.8, -5.6), text: 'Centrifuge', sub: 'removes the finest solids', side: 'left', dx: 90, dy: 40 }, t, L(3) + 4.0, info.dur);
    }
  },
};

// pressure arrows on the well face (instanced cones)
let ARROWS = null;
function arrows(W) {
  if (ARROWS) return ARROWS;
  const g = new THREE.Group();
  const blue = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.2, 0.5, 1.0).multiplyScalar(1.1) });
  const orange = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.5, 0.12).multiplyScalar(1.1) });
  const cone = new THREE.ConeGeometry(0.55, 1.6, 12);
  const mk = (mat, n) => new THREE.InstancedMesh(cone, mat, n);
  const out = mk(blue, 24), inn = mk(orange, 24);
  g.add(out, inn);
  W.well.group.add(g);
  ARROWS = { g, out, inn };
  return ARROWS;
}

export const mud_barrier = {
  look: { bloom: 0.5, vignette: 0.42 },
  build: ensureWell,
  setup(W) { wellEnv(W); arrows(W).g.visible = true; },
  update(W, t, info) {
    W.well.set({ hole: TD, sections: sectionStates(4, 4, 1, 0, 0), string: TD - 0.5, flow: 0.6, time: t, primary: sstep(3.5, 4.5, t) });
    camPath([[0, [12, -262, 46], [0, -268, 0], 42], [info.dur, [10, -258, 40], [0, -266, 0], 42]], (u) => u)(t, W.camera);
    const A = ARROWS, m4 = new THREE.Matrix4(), q = new THREE.Quaternion();
    const R = SECTIONS[4].hole;
    const pulse = 0.85 + 0.15 * Math.sin(t * 4);
    for (let i = 0; i < 12; i++) {
      for (const s of [-1, 1]) {
        const k = i * 2 + (s > 0 ? 1 : 0);
        const y = -256 - i * 3.2;
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -s * Math.PI / 2);
        m4.compose(new THREE.Vector3(s * (R + 1.2), y, 0.6), q, new THREE.Vector3(pulse, pulse, pulse));
        A.out.setMatrixAt(k, m4);
        q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), s * Math.PI / 2);
        m4.compose(new THREE.Vector3(s * (R + 3.4), y - 1.6, 0.6), q, new THREE.Vector3(pulse, pulse, pulse));
        A.inn.setMatrixAt(k, m4);
      }
    }
    A.out.instanceMatrix.needsUpdate = A.inn.instanceMatrix.needsUpdate = true;
    const ov = W.ov;
    ov.label('mp', { at: new THREE.Vector3(R + 1.2, -262, 0.6), text: 'Mud pressure', sub: 'pushes outward', side: 'right', dx: 120, dy: -50, color: '#5fb2ff' }, t, 0.6, info.dur);
    ov.label('fp', { at: new THREE.Vector3(-(R + 3.4), -270, 0.6), text: 'Formation pressure', sub: 'pushes inward', side: 'left', dx: 120, dy: 40 }, t, 1.6, info.dur);
    ov.html('pb', { x: 120, y: 120, cls: 'badge', html: 'Primary barrier · the mud column', style: { borderColor: '#5fb2ff', color: '#5fb2ff' } }, t, 4.2, info.dur);
  },
  teardown(W) { if (ARROWS) ARROWS.g.visible = false; },
};

export const cuttings = {
  look: { bloom: 0.45, vignette: 0.38 },
  build: ensureSets,
  setup(W) {
    W.show(['sky', 'ocean', 'rig', 'psv']);
    W.envOcean('day', { amp: 0.7, chop: 0.75, foam: 0.4, fog: 0.0001, exposure: 1.0, skyOverrides: { sun: [0.3, 0.55, 0.78] } });
    W.shadowBox([-50, 10, 0], 90, 600);
    if (!this._skip) {
      const skip = new THREE.Mesh(new THREE.BoxGeometry(3.6, 2.2, 4.2), new THREE.MeshStandardMaterial({ color: '#d8a21c', roughness: 0.55 }));
      const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1, 6), W.mats.darkSteel);
      this._skip = skip; this._wire = wire;
      W.rig.root.add(skip, wire);
    }
    this._skip.visible = this._wire.visible = true;
  },
  oceanT0: 1300,
  update(W, t, info) {
    rigOnOcean(W, t + 1300, 0.5);
    W.psv.float(t + 1300, -88, 2, 0, 0.7);
    // crane slews from the deck out over the supply ship while the skip is lowered
    const crane = W.rig.cranes[1];
    const k = smooth(clamp((t - 1.0) / (info.dur - 3.0)));
    crane.house.rotation.y = lerp(0.03 * Math.PI, Math.PI * 0.5, k);
    crane.house.updateMatrixWorld(true);
    const tip = new THREE.Vector3(0, 1.5 - Math.sin(0.06) * 48, 2.2 + Math.cos(0.06) * 48);
    crane.house.localToWorld(tip);
    W.rig.root.worldToLocal(tip);
    const hookY = lerp(31, 8, smooth(clamp((k - 0.55) / 0.45)));
    this._skip.position.set(tip.x, hookY, tip.z);
    this._wire.position.set(tip.x, (tip.y + hookY + 1.1) / 2, tip.z);
    this._wire.scale.y = Math.max(0.1, tip.y - hookY - 1.1);
    camPath([[0, [-128, 46, 82], [-62, 20, 2], 40], [info.dur, [-132, 34, 52], [-74, 15, 0], 40]], (u) => u)(t, W.camera);
    const ov = W.ov;
    ov.html('zd', { x: 120, y: 120, cls: 'panel', html: '<div class="note" style="opacity:1">Norway · since 1993</div><div style="font-size:40px;font-weight:800;margin-top:8px">No oily cuttings overboard</div><div style="font-size:22px;opacity:0.85;margin-top:8px">re-injected underground · or shipped to shore</div>' }, t, 1.0, info.dur);
    ov.label('sk', { at: () => W.rig.local([this._skip.position.x, this._skip.position.y + 1.5, this._skip.position.z]), text: 'Cuttings skip', sub: 'to the supply ship', side: 'left', dx: 80, dy: -50 }, t, 3.5, info.dur);
  },
  teardown() { if (this._skip) { this._skip.visible = false; this._wire.visible = false; } },
};
