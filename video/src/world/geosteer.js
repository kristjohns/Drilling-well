// Geosteering cross-section (with an ultra-deep resistivity "look-around" view) and the
// multilateral exploration well (8 branches) used for the NCS-record shot.
import * as THREE from 'three';
import { Builder } from '../engine/builder.js';
import { materials } from '../engine/materials.js';
import { noiseTex } from '../engine/textures.js';
import { lerp, clamp } from '../engine/util.js';

// reservoir sand top (m) along x, with a small fault at x = 520
export const sandTop = (x) => 6 * Math.sin(x / 140) + 4 * Math.sin(x / 53 + 1) + (x > 520 ? 7 : 0) + (x > 520 && x < 535 ? -(535 - x) * 7 / 15 : 0);
export const SAND_T = 7;
export const pathY = (x) => (x < 70 ? lerp(40, sandTop(70) - SAND_T / 2, Math.sin((x / 70) * Math.PI / 2)) : sandTop(x) - SAND_T / 2 + 1.2 * Math.sin(x / 37));

export function createGeosteer() {
  const g = new THREE.Group();
  const uniforms = { uBit: { value: new THREE.Vector2(0, 0) }, uScan: { value: 0 }, uTime: { value: 0 }, uNoise: { value: noiseTex({ size: 256, seed: 7, base: 8, octaves: 4 }) } };
  const face = new THREE.Mesh(new THREE.PlaneGeometry(1000, 90, 1, 1), new THREE.ShaderMaterial({
    uniforms,
    vertexShader: /* glsl */`varying vec2 vP; void main(){ vP = (modelMatrix * vec4(position,1.0)).xy; gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position,1.0); }`,
    fragmentShader: /* glsl */`
      uniform vec2 uBit; uniform float uScan, uTime; uniform sampler2D uNoise; varying vec2 vP;
      float top(float x){ float f = x > 520.0 ? 7.0 : 0.0; if (x > 520.0 && x < 535.0) f -= (535.0 - x) * 7.0 / 15.0; return 6.0*sin(x/140.0) + 4.0*sin(x/53.0 + 1.0) + f; }
      void main(){
        float x = vP.x, y = vP.y;
        float tp = top(x), bt = tp - ${SAND_T.toFixed(1)};
        float n = texture2D(uNoise, vec2(x * 0.004, y * 0.03)).r;
        float lam = sin((y - tp * 0.6) * 2.2 + n * 3.0) * 0.5 + 0.5;
        vec3 shale = mix(vec3(0.17, 0.19, 0.22), vec3(0.24, 0.26, 0.29), lam);
        vec3 sand = mix(vec3(0.72, 0.56, 0.3), vec3(0.42, 0.3, 0.16), smoothstep(0.45, 0.8, n));
        bool inSand = y < tp && y > bt;
        vec3 c = inSand ? sand : shale;
        if (y < bt - 14.0) c = mix(vec3(0.3, 0.36, 0.42), shale, 0.4);
        // ultra-deep resistivity view around the bit
        float d = length((vP - uBit) * vec2(0.45, 1.0));
        float k = uScan * smoothstep(34.0, 26.0, d);
        if (k > 0.0) {
          float res = inSand ? 0.85 + 0.15 * n : 0.15 + 0.2 * n;
          float near = 1.0 - smoothstep(0.0, 2.5, min(abs(y - tp), abs(y - bt)));
          vec3 heat = mix(vec3(0.1, 0.3, 0.95), vec3(1.0, 0.35, 0.08), res);
          heat = mix(heat, vec3(1.0, 0.95, 0.6), near * 0.6);
          float grid = max(step(0.94, fract(x * 0.2)), step(0.94, fract(y * 0.5))) * 0.25;
          float ring = smoothstep(1.2, 0.0, abs(d - mod(uTime * 18.0, 34.0))) * 0.5;
          c = mix(c, heat + grid + ring, k * 0.85);
        }
        gl_FragColor = vec4(pow(c, vec3(2.2)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  }));
  face.position.set(400, 0, 0);
  g.add(face);
  // the well path tube (grown with drawRange)
  const pts = [];
  for (let x = 0; x <= 860; x += 5) pts.push(new THREE.Vector3(x, pathY(x), 0.8));
  const curve = new THREE.CatmullRomCurve3(pts);
  const tubeGeo = new THREE.TubeGeometry(curve, 400, 0.9, 10, false);
  const tubeMat = new THREE.MeshStandardMaterial({ color: '#d9e6ee', emissive: new THREE.Color(0.25, 0.5, 0.7), emissiveIntensity: 0.6, roughness: 0.3, metalness: 0.4 });
  const tube = new THREE.Mesh(tubeGeo, tubeMat);
  g.add(tube);
  const bit = new THREE.Mesh(new THREE.SphereGeometry(1.6, 16, 10), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.8, 0.4).multiplyScalar(4) }));
  g.add(bit);
  const total = tubeGeo.index.count;

  // ---- multilateral fan (1 unit = 10 m) ----
  const multi = new THREE.Group();
  const slabMat = new THREE.MeshStandardMaterial({ color: '#c8a15c', roughness: 0.8, transparent: true, opacity: 0.55, side: THREE.DoubleSide, depthWrite: false });
  const slabGeo = new THREE.PlaneGeometry(1600, 1200, 60, 40);
  slabGeo.rotateX(-Math.PI / 2);
  const sp = slabGeo.attributes.position;
  for (let i = 0; i < sp.count; i++) sp.setY(i, 8 * Math.sin(sp.getX(i) / 160) + 6 * Math.cos(sp.getZ(i) / 120));
  slabGeo.computeVertexNormals();
  multi.add(new THREE.Mesh(slabGeo, slabMat));
  const grid = new THREE.GridHelper(1600, 32, 0x3a5a70, 0x22384a);
  grid.position.y = -40;
  multi.add(grid);
  const branchMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.0, 0.75, 0.35).multiplyScalar(2.2) });
  const recordMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.4, 0.9, 1.0).multiplyScalar(3) });
  const mother = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 200, 0), new THREE.Vector3(0, 120, 0), new THREE.Vector3(10, 30, 5), new THREE.Vector3(30, 5, 10)]), 40, 3, 8), branchMat);
  multi.add(mother);
  // 8 branches (lengths in units ≈ 10 m); one is the 10,666 m record branch
  const specs = [[0.15, 720, 0], [0.75, 560, 1], [1.4, 640, 0], [2.0, 500, 0], [2.6, 600, 0], [3.3, 460, 0], [4.0, 690, 0], [4.9, 540, 0]];
  const branches = specs.map(([ang, len, rec], i) => {
    const p = [];
    for (let k = 0; k <= 30; k++) {
      const u = k / 30, r = 30 + u * len;
      const a = ang + 0.25 * Math.sin(u * 3 + i);
      const x = Math.cos(a) * r, z = Math.sin(a) * r;
      p.push(new THREE.Vector3(x, 8 * Math.sin(x / 160) + 6 * Math.cos(z / 120) - 1.5, z));
    }
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(p), 120, i === 0 ? 3.2 : 2.4, 8);
    const mesh = new THREE.Mesh(geo, i === 0 ? recordMat : branchMat);
    multi.add(mesh);
    return { mesh, count: geo.index.count, tip: p[p.length - 1], rec: i === 0 };
  });
  g.add(multi);

  return {
    group: g, uniforms, tube, bit, curve, multi, branches,
    /** Advance the bit to x (m) along the section. */
    setBit(x, scan, t) {
      const u = clamp(x / 860);
      tube.geometry.setDrawRange(0, Math.floor(total * u / 6) * 6);
      const p = curve.getPoint(u);
      bit.position.copy(p);
      uniforms.uBit.value.set(p.x, p.y);
      uniforms.uScan.value = scan;
      uniforms.uTime.value = t;
    },
    /** Grow branches: k in 0..8 (fractional). */
    setBranches(k) {
      branches.forEach((b, i) => {
        const f = clamp(k - i);
        b.mesh.visible = f > 0;
        b.mesh.geometry.setDrawRange(0, Math.floor(b.count * f / 6) * 6);
      });
    },
  };
}
