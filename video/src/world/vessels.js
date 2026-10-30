// Platform supply vessel and crew-change helicopter.
import * as THREE from 'three';
import { Builder, extrudeUp } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { waterHeight } from './ocean.js';
import { textTex } from '../engine/textures.js';

export function createPSV() {
  const m = materials();
  const hullMat = new THREE.MeshStandardMaterial({ color: '#173a63', roughness: 0.5, metalness: 0.2 });
  const redMat = new THREE.MeshStandardMaterial({ color: '#8c2a22', roughness: 0.6 });
  const B = new Builder();
  // hull plan: 86 m long (along +z = bow), 19 m beam
  const s = new THREE.Shape();
  s.moveTo(-9.5, -43); s.lineTo(9.5, -43); s.lineTo(9.5, 18); s.quadraticCurveTo(9.2, 36, 0, 43); s.quadraticCurveTo(-9.2, 36, -9.5, 18); s.lineTo(-9.5, -43);
  B.geo(extrudeUp(s, 6, 0.3), redMat, [0, -6, 0]);
  B.geo(extrudeUp(s, 3.2, 0.3), hullMat, [0, 0, 0]);
  B.geo(extrudeUp(s, 0.15, 0), m.deck, [0, 3.2, 0]);
  // bulwarks along aft deck
  B.boxMM([-9.5, 3.2, -43], [-9.0, 5.0, 12], hullMat);
  B.boxMM([9.0, 3.2, -43], [9.5, 5.0, 12], hullMat);
  // superstructure forward
  B.boxMM([-8.5, 3.2, 12], [8.5, 8.5, 32], m.whiteClean);
  B.boxMM([-7.5, 8.5, 16], [7.5, 12, 30], m.whiteClean);
  B.boxMM([-7.8, 12, 20], [7.8, 15.2, 30], m.whiteClean);
  B.boxMM([-7.6, 13.0, 29.9], [7.6, 14.6, 30.1], m.glass);
  B.boxMM([-7.9, 13.0, 20], [-7.7, 14.6, 29], m.glass);
  B.boxMM([7.7, 13.0, 20], [7.9, 14.6, 29], m.glass);
  B.boxMM([-7.6, 13.0, 19.9], [7.6, 14.6, 20.1], m.glass);
  B.pipe([0, 15.2, 25], [0, 24, 25], 0.25, m.whiteClean);
  B.box(4, 0.2, 0.3, m.whiteClean, [0, 21.5, 25]);
  B.cyl(1.0, 4, hullMat, [6, 10, 14], [0, 0, 0], 16);
  // cargo: skips (cuttings containers) and containers
  const skipMat = new THREE.MeshStandardMaterial({ color: '#d8a21c', roughness: 0.55 });
  const skips = [];
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const p = [-5 + j * 5, 4.4, -38 + i * 6];
    B.box(3.6, 2.2, 4.2, skipMat, p);
    skips.push(p);
  }
  B.box(6, 2.6, 2.4, new THREE.MeshStandardMaterial({ color: '#2e6db4', roughness: 0.6 }), [0, 4.5, -8]);
  const g = B.build();
  const group = new THREE.Group();
  group.add(g);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(16, 2), new THREE.MeshStandardMaterial({ map: textTex('NORDSJØ SUPPLY', { w: 2048, h: 256, color: '#ffffff', font: '800 150px Inter, sans-serif' }), transparent: true }));
  name.position.set(9.55, 1.6, 22); name.rotation.y = Math.PI / 2;
  group.add(name);
  return {
    group, skips,
    /** Float on the waves at (x, z) heading yaw. */
    float(t, x, z, yaw, scale = 1) {
      const fx = Math.sin(yaw) * 36, fz = Math.cos(yaw) * 36, sx = Math.cos(yaw) * 8, sz = -Math.sin(yaw) * 8;
      const hb = waterHeight(x + fx, z + fz, t, scale), hs = waterHeight(x - fx, z - fz, t, scale);
      const hp = waterHeight(x - sx, z - sz, t, scale), hst = waterHeight(x + sx, z + sz, t, scale);
      const hc = waterHeight(x, z, t, scale);
      group.position.set(x, (hb + hs) * 0.3 + hc * 0.4 - 0.5, z);
      group.rotation.set(0, 0, 0);
      group.rotateY(yaw);
      group.rotateX(-Math.atan2(hb - hs, 72) * 0.9);
      group.rotateZ(Math.atan2(hst - hp, 16) * 0.8);
    },
  };
}

export function createHelicopter() {
  const m = materials();
  const body = new THREE.MeshStandardMaterial({ color: '#e8e9ea', roughness: 0.35, metalness: 0.3 });
  const red = new THREE.MeshStandardMaterial({ color: '#c41e24', roughness: 0.4, metalness: 0.2 });
  const B = new Builder();
  // fuselage: capsule-like (nose +z)
  B.geo(new THREE.CapsuleGeometry(1.45, 9.5, 8, 18), body, [0, 1.9, 0.5], [Math.PI / 2, 0, 0], [1, 1, 1.0]);
  B.geo(new THREE.SphereGeometry(1.42, 18, 12), body, [0, 1.95, 6.0], [0, 0, 0], [1, 0.95, 1.25]);
  B.box(2.8, 0.5, 9.5, red, [0, 0.75, 0.0]);
  B.geo(new THREE.CylinderGeometry(0.35, 0.95, 9.5, 12), body, [0, 2.6, -9.6], [Math.PI / 2 - 0.08, 0, 0]);
  B.box(0.25, 2.8, 1.9, red, [0, 3.9, -14.0], [0.3, 0, 0]);
  B.box(3.0, 0.15, 1.0, body, [0, 3.0, -13.6]);
  // cockpit glass, windows
  B.geo(new THREE.SphereGeometry(1.25, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2.2), m.glass, [0, 2.15, 6.35], [Math.PI / 2.6, 0, 0], [1, 0.9, 1]);
  for (let i = 0; i < 5; i++) for (const s of [-1, 1]) B.box(0.05, 0.6, 0.75, m.glass, [s * 1.44, 2.3, 3.4 - i * 1.25]);
  // sponsons + gear
  for (const s of [-1, 1]) {
    B.geo(new THREE.CapsuleGeometry(0.55, 2.5, 6, 10), body, [s * 1.7, 0.95, -0.5], [Math.PI / 2, 0, 0]);
    B.cyl(0.32, 0.25, m.rubber, [s * 1.7, 0.15, -0.5], [0, 0, Math.PI / 2], 14);
  }
  B.cyl(0.25, 0.22, m.rubber, [0, 0.15, 5.4], [0, 0, Math.PI / 2], 12);
  // engine housing + mast
  B.box(2.2, 0.9, 4.5, body, [0, 3.65, 0.5]);
  B.cyl(0.25, 1.0, m.darkSteel, [0, 4.5, 0.8], [0, 0, 0], 12);
  const g = B.build();
  // rotors
  const rotor = new THREE.Group();
  const bladeGeo = new THREE.BoxGeometry(0.55, 0.06, 8.4);
  bladeGeo.translate(0, 0, 4.4);
  for (let i = 0; i < 4; i++) {
    const bl = new THREE.Mesh(bladeGeo, m.dark);
    bl.rotation.y = (i / 4) * Math.PI * 2;
    rotor.add(bl);
  }
  rotor.position.set(0, 5.0, 0.8);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(8.8, 48), new THREE.MeshBasicMaterial({ color: '#202020', transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide }));
  disc.rotation.x = -Math.PI / 2;
  disc.position.copy(rotor.position);
  const tail = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.5, 0.2), m.dark);
    b.position.y = 0.75;
    const p = new THREE.Group(); p.add(b); p.rotation.x = (i / 4) * Math.PI * 2;
    tail.add(p);
  }
  tail.position.set(0.25, 4.0, -14.1);
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), m.lampRed);
  beacon.position.set(0, 3.0, -3);
  const group = new THREE.Group();
  group.add(g, rotor, disc, tail, beacon);
  group.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return {
    group,
    spin(t, rpm = 290) {
      rotor.rotation.y = t * rpm / 60 * Math.PI * 2 * 0.137;   // under-sampled for a natural look at 25 fps
      tail.rotation.x = t * 9.3;
    },
  };
}
