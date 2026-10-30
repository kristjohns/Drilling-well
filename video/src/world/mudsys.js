// Mud module interior: pits with agitators, four triplex mud pumps, shale shakers,
// degasser and centrifuge, with animated mud and flow chevrons. Units: metres.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { rng, mat4 } from '../engine/util.js';

function mudMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uFlow: { value: new THREE.Vector2(0, 0) }, uCut: { value: 0 } },
    vertexShader: /* glsl */`varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uCut; uniform vec2 uFlow; varying vec3 vW; varying vec2 vUv;
      float h(vec2 p){ p = fract(p*vec2(123.4,456.7)); p += dot(p,p+45.6); return fract(p.x*p.y); }
      float n(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),f.x), mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x), f.y); }
      void main(){
        vec2 p = vW.xz * 1.6 + uFlow * uTime;
        float s = n(p) * 0.6 + n(p * 2.7 + uTime * 0.3) * 0.4;
        vec3 c = mix(vec3(0.16, 0.09, 0.04), vec3(0.42, 0.27, 0.13), s);
        c += vec3(0.25, 0.2, 0.15) * pow(s, 6.0);
        // cuttings specks
        vec2 q = vW.xz * 18.0 + uFlow * uTime * 11.0;
        if (uCut > 0.0 && h(floor(q)) > 0.93) c = mix(c, vec3(0.32, 0.31, 0.3), uCut);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

export function createMudSystem() {
  const m = materials();
  const g = new THREE.Group();
  const B = new Builder();
  const blueGrey = new THREE.MeshStandardMaterial({ color: '#35576e', roughness: 0.5, metalness: 0.4 });
  const pumpRed = new THREE.MeshStandardMaterial({ color: '#9b2a20', roughness: 0.5, metalness: 0.4 });
  // room: floor x -6..54, z -8..8, height 8
  B.boxMM([-6, -0.2, -8], [54, 0, 8], m.grating);
  B.boxMM([-6, 0, -8.2], [54, 8, -8], m.grey);
  B.boxMM([-6, 8, -8], [54, 8.2, 8], m.dark);
  for (let x = -4; x < 54; x += 6) B.boxMM([x, 7.6, -8], [x + 0.3, 8, 8], m.dark);
  for (let x = -2; x < 54; x += 6) B.box(2.4, 0.08, 0.3, m.lampWhite, [x + 1, 7.55, 0]);
  B.pipe([-6, 6.8, -7.4], [54, 6.8, -7.4], 0.25, m.red);
  B.pipe([-6, 6.2, -7.4], [54, 6.2, -7.4], 0.18, m.yellowClean);
  B.pipe([-6, 7.1, -6.6], [54, 7.1, -6.6], 0.14, m.grey);

  // --- PITS (x -4..12): three tanks with agitators
  const mudMat = mudMaterial();
  const mudSurfaces = [];
  for (let i = 0; i < 3; i++) {
    const x0 = -4 + i * 5.3;
    B.boxMM([x0, 0, -6], [x0 + 5, 3.2, -5.8], m.grey);
    B.boxMM([x0, 0, 2], [x0 + 5, 3.2, 2.2], m.grey);
    B.boxMM([x0, 0, -6], [x0 + 0.2, 3.2, 2.2], m.grey);
    B.boxMM([x0 + 4.8, 0, -6], [x0 + 5, 3.2, 2.2], m.grey);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(4.6, 7.8), mudMat);
    s.rotation.x = -Math.PI / 2; s.position.set(x0 + 2.5, 2.7, -1.9);
    g.add(s); mudSurfaces.push(s);
    // agitator motor + gearbox on top beam
    B.boxMM([x0, 3.2, -2.3], [x0 + 5, 3.5, -1.5], m.yellowClean);
    B.cyl(0.45, 0.9, blueGrey, [x0 + 2.5, 4.0, -1.9], [0, 0, 0], 20);
    B.box(0.9, 0.6, 0.9, m.dark, [x0 + 2.5, 3.65, -1.9]);
  }
  B.boxMM([-4, 3.5, 2.2], [12, 3.6, 3.4], m.grating);
  for (let x = -4; x <= 12; x += 2) B.beam([x, 3.6, 3.35], [x, 4.6, 3.35], 0.05, m.yellowClean);
  B.beam([-4, 4.6, 3.35], [12, 4.6, 3.35], 0.05, m.yellowClean);

  // --- PUMPS (x 15..40): four triplex pumps
  const pistons = [];
  for (let i = 0; i < 4; i++) {
    const x0 = 15 + i * 6.3;
    B.boxMM([x0, 0, -5.5], [x0 + 4.2, 2.6, -1.5], blueGrey);            // power end
    B.cyl(1.1, 0.5, m.dark, [x0 + 4.45, 1.4, -4.4], [0, 0, Math.PI / 2], 30);   // flywheel / pulley
    for (const z of [-4.8, -2.4]) B.cyl(0.6, 1.6, m.whiteClean, [x0 + 2.1, 3.4, z], [0, 0, Math.PI / 2], 24); // AC motors
    B.boxMM([x0 + 0.3, 0, 1.0], [x0 + 3.9, 2.2, 2.6], m.darkSteel);     // fluid end
    for (let k = 0; k < 3; k++) {
      B.cyl(0.32, 0.5, m.steel, [x0 + 0.9 + k * 1.2, 2.45, 1.8], [0, 0, 0], 16);    // valve caps
      B.cyl(0.36, 0.35, m.steel, [x0 + 0.9 + k * 1.2, 1.1, 2.75], [Math.PI / 2, 0, 0], 16);
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 2.6, 12), m.steel);
      p.rotation.x = Math.PI / 2;
      p.userData = { x: x0 + 0.9 + k * 1.2, ph: k * 2.094 + i };
      g.add(p); pistons.push(p);
    }
    B.pipe([x0 + 2.1, 2.2, 2.0], [x0 + 2.1, 5.2, 2.0], 0.14, pumpRed);   // discharge
    B.cyl(0.35, 1.0, pumpRed, [x0 + 2.1, 4.3, 2.0], [0, 0, 0], 16);       // pulsation dampener
    B.sphere(0.45, pumpRed, [x0 + 2.1, 5.0, 2.0], 16);
  }
  B.pipe([15, 5.4, 2.0], [40, 5.4, 2.0], 0.18, pumpRed);                 // discharge manifold
  B.pipe([40, 5.4, 2.0], [40, 8.2, 2.0], 0.18, pumpRed);                 // to standpipe

  // --- SHAKERS (x 42..54) + degasser + centrifuge
  const baskets = [];
  for (let i = 0; i < 4; i++) {
    const z0 = -6 + i * 3.2;
    B.boxMM([42, 0, z0], [48, 1.0, z0 + 2.6], m.dark);                   // skid
    B.boxMM([47.2, 1.0, z0], [49.2, 2.6, z0 + 2.6], m.grey);             // possum belly / feeder
    const bb = new Builder();
    bb.boxMM([-2.6, -0.05, -1.25], [2.6, 0.05, 1.25], m.grating);        // screen deck
    bb.boxMM([-2.6, 0.05, -1.3], [2.6, 0.6, -1.2], m.yellowClean);
    bb.boxMM([-2.6, 0.05, 1.2], [2.6, 0.6, 1.3], m.yellowClean);
    bb.box(0.4, 0.7, 0.4, m.dark, [0, 0.55, -1.45]);                      // vibrator motors
    bb.box(0.4, 0.7, 0.4, m.dark, [0, 0.55, 1.45]);
    const bg = bb.build();
    const mudOnScreen = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 2.3), mudMat);
    mudOnScreen.rotation.x = -Math.PI / 2; mudOnScreen.position.set(0.5, 0.07, 0);
    mudOnScreen.scale.set(1, 1, 1);
    bg.add(mudOnScreen);
    bg.position.set(45, 1.7, z0 + 1.3);
    bg.rotation.z = -0.06;
    g.add(bg); baskets.push(bg);
    for (const dx of [-2.2, 2.2]) for (const dz of [-1.1, 1.1]) B.cyl(0.12, 0.6, m.steel, [45 + dx, 1.3, z0 + 1.3 + dz], [0, 0, 0], 8);
  }
  B.boxMM([41.2, 0, -6.5], [42, 0.8, 6.5], m.darkSteel);                  // cuttings trough
  B.cyl(0.9, 5.5, m.white, [52.5, 2.75, 5.5], [0, 0, 0], 24);              // degasser
  B.cyl(0.55, 4.5, m.whiteClean, [51.5, 1.4, -5.6], [0, 0, Math.PI / 2], 24); // centrifuge
  B.box(1.4, 1.4, 1.4, blueGrey, [54.2, 1.4, -5.6]);
  B.pipe([49.2, 2.6, 0], [49.2, 6.0, 0], 0.25, m.dark);                    // flowline from the well

  const built = B.build();
  g.add(built);
  // flow chevrons (glowing arrows that slide along pipes)
  const chevMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.65, 0.2).multiplyScalar(3), transparent: true, depthWrite: false });
  const chev = new THREE.InstancedMesh(new THREE.ConeGeometry(0.22, 0.5, 3), chevMat, 60);
  g.add(chev);
  const routes = [
    [[12, 1.0, 0.5], [15, 1.0, 1.0]],           // pits -> pump suction
    [[15, 5.4, 2.0], [40, 5.4, 2.0]],           // discharge manifold
    [[40, 5.4, 2.0], [40, 8.0, 2.0]],
    [[49.2, 6.0, 0], [49.2, 2.6, 0]],           // flowline down to shakers
    [[44, 2.0, 0], [41.6, 0.8, 0]],             // cuttings off the screens
  ];
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
  return {
    group: g, mudMat, pistons, baskets,
    update(t, { chevrons = 1 } = {}) {
      mudMat.uniforms.uTime.value = t;
      mudMat.uniforms.uFlow.value.set(0.35, 0.12);
      mudMat.uniforms.uCut.value = 1;
      pistons.forEach((p) => { const s = Math.sin(t * 6.5 + p.userData.ph); p.position.set(p.userData.x, 1.1, -0.2 + s * 0.35); });
      baskets.forEach((b, i) => { b.position.y = 1.7 + Math.sin(t * 38 + i) * 0.012; b.position.x = 45 + Math.cos(t * 38 + i) * 0.012; });
      let k = 0;
      chev.visible = chevrons > 0;
      chevMat.opacity = chevrons;
      routes.forEach(([a, b]) => {
        const A = new THREE.Vector3(...a), Bv = new THREE.Vector3(...b), d = new THREE.Vector3().subVectors(Bv, A);
        const n = Math.max(2, Math.round(d.length() / 1.6));
        q.setFromUnitVectors(up, d.clone().normalize());
        for (let i = 0; i < n && k < 60; i++, k++) {
          const u = ((i + t * 1.2) % n) / n;
          m4.compose(A.clone().addScaledVector(d, u).add(new THREE.Vector3(0, 0.35, 0)), q, new THREE.Vector3(1, 1, 1));
          chev.setMatrixAt(k, m4);
        }
      });
      for (; k < 60; k++) chev.setMatrixAt(k, m4.makeScale(0, 0, 0));
      chev.instanceMatrix.needsUpdate = true;
    },
  };
}
