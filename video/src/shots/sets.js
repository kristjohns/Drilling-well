// Lazily-built shared sets used by several chapters.
import * as THREE from 'three';
import { createSubsea } from '../world/subsea.js';
import { createPSV, createHelicopter } from '../world/vessels.js';
import { makeWorker } from '../world/people.js';
import { RIG } from '../world/rig.js';
import { createBattery } from '../world/misc.js';

let built = false;
export function ensureSets(W) {
  if (built) return;
  built = true;
  W.subsea = createSubsea();
  W.addSet('subsea', W.subsea.group);
  W.psv = createPSV();
  W.addSet('psv', W.psv.group);
  W.heli = createHelicopter();
  W.addSet('heli', W.heli.group);
  // a few crew members on deck (rig-local positions), parented to the rig so they move with it
  const crew = new THREE.Group();
  const spots = [[8, 40, -11, 0.5], [9.2, 40, -12.5, 2.2], [16, 27, 20, -1.0], [-20, 27, 10, 1.2], [26, 27, 0, 3.0], [-6, 27, 30, 0.2], [14, 40.1, 12.5, -2.0]];
  for (const [x, y, z, r] of spots) {
    const wk = makeWorker();
    wk.position.set(x, y, z);
    wk.rotation.y = r;
    crew.add(wk);
  }
  W.rig.root.add(crew);
  W.crew = crew;
  // holographic anchor-line overlay on the sea surface (for the station-keeping shot)
  const holo = new THREE.Group();
  const holoMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.65, 0.2).multiplyScalar(2.5), transparent: true, opacity: 1, depthWrite: false });
  W.rig.anchorPts.forEach((pts) => {
    const flat = pts.map((p) => new THREE.Vector3(p.x, 1.2, p.z));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(flat), 80, 1.6, 6), holoMat);
    holo.add(mesh);
    const end = flat[flat.length - 1];
    const ring = new THREE.Mesh(new THREE.RingGeometry(9, 13, 32), holoMat);
    ring.rotation.x = -Math.PI / 2; ring.position.copy(end);
    holo.add(ring);
  });
  holo.userData.mat = holoMat;
  W.addSet('holo', holo);
  W.holo = holo;
  // DP thruster jets (cones on the surface pointing outward from pontoon ends)
  const jets = new THREE.Group();
  const jetMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.3, 0.85, 1.0).multiplyScalar(2.5), transparent: true, opacity: 0.9, depthWrite: false });
  for (const sx of [-1, 1]) for (const z of [-50, -38, 38, 50]) {
    const c = new THREE.Mesh(new THREE.ConeGeometry(4, 22, 16), jetMat);
    c.position.set(sx * RIG.pontoonX, 1.5, z);
    c.rotation.z = -sx * Math.PI / 2;
    jets.add(c);
  }
  jets.userData.mat = jetMat;
  W.addSet('jets', jets);
  W.jets = jets;
  // battery energy-storage container on the main deck (open side facing +x)
  const bat = createBattery();
  bat.group.position.set(30, 27, 26);
  bat.group.rotation.y = Math.PI / 2;
  bat.group.visible = false;
  W.rig.root.add(bat.group);
  W.battery = bat;
}
