// Simple stylised offshore workers (orange coveralls, white helmets) for distant shots.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';

export function makeWorker(color = '#ff6a13') {
  const suit = new THREE.MeshStandardMaterial({ color, roughness: 0.7 });
  const skin = new THREE.MeshStandardMaterial({ color: '#c99a7a', roughness: 0.8 });
  const helmet = new THREE.MeshStandardMaterial({ color: '#f2f2f2', roughness: 0.4 });
  const refl = new THREE.MeshStandardMaterial({ color: '#d8d8d0', emissive: '#555', roughness: 0.3 });
  const B = new Builder();
  B.geo(new THREE.CapsuleGeometry(0.11, 0.75, 4, 8), suit, [-0.12, 0.48, 0]);
  B.geo(new THREE.CapsuleGeometry(0.11, 0.75, 4, 8), suit, [0.12, 0.48, 0]);
  B.geo(new THREE.CapsuleGeometry(0.2, 0.5, 4, 10), suit, [0, 1.22, 0]);
  B.box(0.42, 0.06, 0.3, refl, [0, 1.15, 0]);
  B.geo(new THREE.CapsuleGeometry(0.07, 0.55, 4, 8), suit, [-0.3, 1.2, 0.05], [0.2, 0, 0.15]);
  B.geo(new THREE.CapsuleGeometry(0.07, 0.55, 4, 8), suit, [0.3, 1.2, 0.05], [0.2, 0, -0.15]);
  B.sphere(0.12, skin, [0, 1.68, 0], 10);
  B.geo(new THREE.SphereGeometry(0.15, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), helmet, [0, 1.72, 0]);
  return B.build();
}
