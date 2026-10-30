// Ocean surface: Gerstner waves on a camera-following polar grid, shaded with the shared
// procedural sky for reflections, sun glint, subsurface tint, whitecaps and foam around
// the rig columns. Also renders correctly from below (Snell's window).
import * as THREE from 'three';
import { SKY_GLSL, skyUniforms } from './sky.js';
import { fbmField } from '../engine/textures.js';

// Wave set: direction (deg, relative to wind), wavelength (m), amplitude (m at amp=1)
const WAVES = [
  [0, 140, 1.25], [24, 96, 0.92], [-31, 68, 0.66], [55, 47, 0.42],
  [-12, 33, 0.28], [80, 23, 0.17], [-60, 15, 0.1], [35, 9.5, 0.055],
];

export const oceanUniforms = {
  uTimeW: { value: 0 },
  uAmp: { value: 1 },
  uChop: { value: 0.75 },
  uWindAngle: { value: 0 },
  uWaves: { value: WAVES.map(() => new THREE.Vector4()) },
  uDeep: { value: new THREE.Color(0.004, 0.03, 0.05) },
  uScatter: { value: new THREE.Color(0.02, 0.14, 0.15) },
  uFoamAmt: { value: 0.5 },
  uFoamCol: { value: new THREE.Color(0.85, 0.9, 0.92) },
  uColumns: { value: Array.from({ length: 8 }, () => new THREE.Vector4(1e6, 1e6, 0, 0)) },
  uColCount: { value: 0 },
  uNormalTex: { value: null },
  uDetail: { value: 1 },
  uFogNear: { value: 1500 },
  uFogFar: { value: 9000 },
  uUnderCol: { value: new THREE.Color(0.0, 0.09, 0.12) },
  uSpec: { value: 1 },
  uLightsPos: { value: Array.from({ length: 4 }, () => new THREE.Vector3(0, -1e6, 0)) },
  uLightsCol: { value: Array.from({ length: 4 }, () => new THREE.Color(0, 0, 0)) },
  uGlitter: { value: new THREE.Vector4(1, 260, 1, 0) },
  uSkyCube: { value: null },
};

function updateWaveVectors() {
  const wa = oceanUniforms.uWindAngle.value;
  WAVES.forEach(([d, L, A], i) => {
    const a = wa + (d * Math.PI) / 180;
    oceanUniforms.uWaves.value[i].set(Math.cos(a), Math.sin(a), L, A);
  });
}

/** Height of the water surface at (x, z) at time t (ignores horizontal displacement). */
export function waterHeight(x, z, t, ampScale = 1) {
  const amp = oceanUniforms.uAmp.value * ampScale;
  const wa = oceanUniforms.uWindAngle.value;
  let h = 0;
  for (const [d, L, A] of WAVES) {
    const a = wa + (d * Math.PI) / 180;
    const k = (2 * Math.PI) / L, c = Math.sqrt(9.81 / k);
    h += A * amp * Math.sin(k * (Math.cos(a) * x + Math.sin(a) * z - c * t));
  }
  return h;
}

/** Low-pass "response" of a large floater: heave/pitch/roll as small fractions of long waves. */
export function floaterMotion(t, scale = 1) {
  const amp = oceanUniforms.uAmp.value * scale;
  let heave = 0, pitch = 0, roll = 0;
  WAVES.slice(0, 3).forEach(([d, L, A], i) => {
    const k = (2 * Math.PI) / L, c = Math.sqrt(9.81 / k);
    const ph = -k * c * t + i * 1.3;
    heave += A * amp * 0.16 * Math.sin(ph);
    pitch += A * amp * 0.0028 * Math.cos(ph + 0.4);
    roll += A * amp * 0.0022 * Math.sin(ph * 0.9 + 1.1);
  });
  return { heave, pitch, roll };
}

function polarGrid(seg = 300, rings = 210, rMin = 0.6, rMax = 9500) {
  const pos = [0, 0, 0];
  for (let i = 0; i < rings; i++) {
    const r = rMin * Math.pow(rMax / rMin, i / (rings - 1));
    for (let j = 0; j < seg; j++) {
      const a = (j / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    }
  }
  const idx = [];
  for (let j = 0; j < seg; j++) idx.push(0, 1 + ((j + 1) % seg), 1 + j);
  for (let i = 0; i < rings - 1; i++) {
    for (let j = 0; j < seg; j++) {
      const a = 1 + i * seg + j, b = 1 + i * seg + ((j + 1) % seg);
      const c = a + seg, d = b + seg;
      idx.push(a, b, c, b, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
  return g;
}

function makeNormalTex() {
  const size = 256;
  const f = fbmField(size, { seed: 77, base: 8, octaves: 4, gain: 0.55 });
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d');
  const img = g.createImageData(size, size);
  const H = (x, y) => f[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (H(x + 1, y) - H(x - 1, y)) * 6, dy = (H(x, y + 1) - H(x, y - 1)) * 6;
    const n = new THREE.Vector3(-dx, -dy, 1).normalize();
    const i = (y * size + x) * 4;
    img.data[i] = (n.x * 0.5 + 0.5) * 255; img.data[i + 1] = (n.y * 0.5 + 0.5) * 255; img.data[i + 2] = (n.z * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 8;
  return t;
}

export function createOcean() {
  oceanUniforms.uNormalTex.value = makeNormalTex();
  updateWaveVectors();
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...skyUniforms, ...oceanUniforms },
    side: THREE.DoubleSide,
    vertexShader: /* glsl */`
      uniform float uTimeW, uAmp, uChop;
      uniform vec4 uWaves[8];
      varying vec3 vWorld; varying vec3 vNrm; varying float vJac; varying float vH;
      void main() {
        vec3 p = (modelMatrix * vec4(position, 1.0)).xyz;
        float dist = length(p.xz - cameraPosition.xz);
        float att = 1.0 - smoothstep(1800.0, 6000.0, dist);
        vec3 disp = vec3(0.0);
        vec3 T = vec3(1.0, 0.0, 0.0), B = vec3(0.0, 0.0, 1.0);
        float jac = 1.0;
        for (int i = 0; i < 8; i++) {
          vec2 d = uWaves[i].xy; float L = uWaves[i].z; float A = uWaves[i].w * uAmp * att;
          float k = 6.2831853 / L; float c = sqrt(9.81 / k);
          float Q = min(uChop, 0.95 / (0.41 * max(uAmp, 0.01)));   // horizontal ∝ amplitude, never loops
          float f = k * (dot(d, p.xz) - c * uTimeW);
          float cf = cos(f), sf = sin(f);
          disp += vec3(Q * A * d.x * cf, A * sf, Q * A * d.y * cf);
          float WA = k * A;
          T += vec3(-Q * d.x * d.x * WA * sf, d.x * WA * cf, -Q * d.x * d.y * WA * sf);
          B += vec3(-Q * d.x * d.y * WA * sf, d.y * WA * cf, -Q * d.y * d.y * WA * sf);
          jac -= Q * WA * sf;
        }
        p += disp;
        vNrm = normalize(cross(B, T));
        vJac = jac; vWorld = p; vH = disp.y;
        gl_Position = projectionMatrix * viewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uSunDir, uSunColor; uniform float uSunIntensity;
      uniform samplerCube uSkyCube;
      vec3 skyColor(vec3 d) { return textureCube(uSkyCube, vec3(-d.x, d.y, d.z)).rgb; }
      uniform float uTimeW, uAmp, uFoamAmt, uDetail, uFogNear, uFogFar, uSpec, uColCount;
      uniform vec3 uDeep, uScatter, uFoamCol, uUnderCol;
      uniform vec4 uColumns[8];
      uniform sampler2D uNormalTex;
      uniform vec3 uLightsPos[4]; uniform vec3 uLightsCol[4];
      uniform vec4 uGlitter;
      varying vec3 vWorld; varying vec3 vNrm; varying float vJac; varying float vH;

      float sdRoundBox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }

      void main() {
        float dist = length(vWorld - cameraPosition);
        vec3 n = normalize(vNrm);
        // detail ripples: two scrolling normal-map octaves, fading with distance
        float df = uDetail * (1.0 - smoothstep(80.0, 900.0, dist));
        vec3 d1 = texture2D(uNormalTex, vWorld.xz * 0.045 + vec2(uTimeW * 0.021, uTimeW * 0.013)).xyz * 2.0 - 1.0;
        vec3 d2 = texture2D(uNormalTex, vWorld.xz * 0.13 + vec2(-uTimeW * 0.034, uTimeW * 0.027)).xyz * 2.0 - 1.0;
        n = normalize(n + vec3(d1.x + d2.x * 0.6, 0.0, d1.y + d2.y * 0.6) * 0.22 * df);
        vec3 v = normalize(cameraPosition - vWorld);

        // foam: whitecaps where the surface compresses, plus around rig columns
        float foamN = texture2D(uNormalTex, vWorld.xz * 0.08 + uTimeW * 0.01).z;
        float foamN2 = texture2D(uNormalTex, vWorld.xz * 0.021 - uTimeW * 0.006).x;
        float foam = smoothstep(0.62, 0.22, vJac) * uFoamAmt * smoothstep(0.35, 0.8, foamN2);
        float rigD = uColCount > 0.0 ? length(vWorld.xz - (uColumns[0].xy + uColumns[3].xy) * 0.5) : 1e9;
        if (rigD < 140.0) for (int i = 0; i < 4; i++) {
          vec4 c = uColumns[i];
          float sd = sdRoundBox(vWorld.xz - c.xy, vec2(c.z), c.w);
          float ring = exp(-max(sd, 0.0) / (2.2 + uAmp * 1.2));
          float streak = smoothstep(0.45, 0.75, texture2D(uNormalTex, (vWorld.xz - c.xy) * 0.05 + vec2(uTimeW * 0.05, 0.0)).y);
          foam += ring * (0.55 + 0.45 * streak) * (0.5 + 0.5 * uAmp);
        }
        foam = clamp(foam * (0.55 + 0.6 * foamN), 0.0, 1.0);

        vec3 col;
        if (gl_FrontFacing) {
          float ndv = max(dot(n, v), 0.0);
          float fres = 0.02 + 0.98 * pow(1.0 - ndv, 5.0);
          vec3 r = reflect(-v, n);
          r.y = abs(r.y) + 0.02;
          vec3 refl = skyColor(normalize(r)) * 0.78;
          // body color with subsurface glow through wave crests (toward sun)
          float sunBack = pow(max(dot(-v, uSunDir) * 0.5 + 0.5, 0.0), 3.0);
          float crest = clamp(vH / (1.0 + uAmp * 1.5) * 0.5 + 0.5, 0.0, 1.0);
          vec3 body = uDeep + uScatter * (0.25 + crest * crest * 1.4 * (0.4 + sunBack)) * (0.4 + 0.6 * uSunIntensity);
          body *= 0.5 + 0.5 * max(uSunDir.y + 0.3, 0.0);
          col = mix(body, refl, fres);
          // sun glint
          float sh = max(dot(r, uSunDir), 0.0);
          col += uSunColor * uSunIntensity * uSpec * (pow(sh, 1400.0) * 5.0 + pow(sh, 160.0) * 0.3) * (1.0 - foam);
          // reflections of rig lights. uGlitter: x = share of the ripples in the reflecting normal,
          // y = highlight exponent, z = gain, w = extra sparkle off the full ripples
          if (uLightsCol[0].r + uLightsCol[0].g > 0.0) {
            vec3 rs = reflect(-v, normalize(vNrm));
            rs.y = abs(rs.y) + 0.02;
            vec3 rl = uGlitter.x < 1.0 ? normalize(mix(rs, r, uGlitter.x)) : r;
            vec3 rn = normalize(r);
            for (int i = 0; i < 4; i++) {
              vec3 L = uLightsPos[i] - vWorld;
              float ld = length(L);
              vec3 Ld = L / ld;
              float s = min(pow(max(dot(rl, Ld), 0.0), uGlitter.y) * 0.22, 0.3) * uGlitter.z;
              if (uGlitter.w > 0.0) s += pow(max(dot(rn, Ld), 0.0), 3000.0) * uGlitter.w;
              col += uLightsCol[i] * s / (1.0 + ld * 0.004);
            }
          }
          vec3 amb = skyColor(vec3(0.0, 1.0, 0.0)) * 0.8 + uSunColor * uSunIntensity * max(uSunDir.y, 0.0) * 0.6;
          col = mix(col, uFoamCol * amb * 0.75, foam);
          // aerial perspective toward the horizon
          vec3 hz = skyColor(normalize(vec3(-v.x, 0.03, -v.z)));
          col = mix(col, hz, smoothstep(uFogNear, uFogFar, dist));
        } else {
          // seen from below: Snell's window shows the sky, outside it total internal reflection
          vec3 up = -v;
          float cosT = dot(-n, -up);
          float window = smoothstep(0.62, 0.72, abs(dot(up, vec3(0.0, 1.0, 0.0))));
          vec3 sky = skyColor(normalize(vec3(up.x * 0.6, 1.0, up.z * 0.6))) * 1.6;
          col = mix(uUnderCol * 1.3, sky * vec3(0.55, 0.85, 0.85), window);
          col += uSunColor * uSunIntensity * pow(max(dot(up, uSunDir), 0.0), 60.0) * 3.0 * window;
          col = mix(col, uFoamCol * 0.5, foam * 0.6);
          col = mix(col, uUnderCol, 1.0 - exp(-dist * 0.012));
        }
        gl_FragColor = vec4(min(col, vec3(4.0)), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(polarGrid(), mat);
  mesh.frustumCulled = false;
  mesh.onBeforeRender = (r, s, cam) => {
    // follow the camera horizontally; snap to reduce swimming
    mesh.position.set(Math.round(cam.position.x / 2) * 2, 0, Math.round(cam.position.z / 2) * 2);
  };
  return {
    mesh,
    uniforms: oceanUniforms,
    set({ amp = 1, chop = 0.75, wind = 0, foam = 0.5, deep, scatter, detail = 1, fogNear = 1500, fogFar = 9000, under, glitter = [1, 260, 1, 0] } = {}) {
      oceanUniforms.uAmp.value = amp;
      oceanUniforms.uChop.value = chop;
      oceanUniforms.uWindAngle.value = wind;
      oceanUniforms.uFoamAmt.value = foam;
      oceanUniforms.uDetail.value = detail;
      oceanUniforms.uFogNear.value = fogNear;
      oceanUniforms.uFogFar.value = fogFar;
      oceanUniforms.uGlitter.value.set(...glitter);
      if (deep) oceanUniforms.uDeep.value.setRGB(...deep);
      if (scatter) oceanUniforms.uScatter.value.setRGB(...scatter);
      if (under) oceanUniforms.uUnderCol.value.setRGB(...under);
      updateWaveVectors();
    },
    setColumns(list) {
      list.forEach((c, i) => oceanUniforms.uColumns.value[i].set(c[0], c[1], c[2], c[3]));
      for (let i = list.length; i < 8; i++) oceanUniforms.uColumns.value[i].set(1e6, 1e6, 0, 0);
      oceanUniforms.uColCount.value = list.length;
    },
    setLights(list) {
      for (let i = 0; i < 4; i++) {
        const l = list[i];
        if (l) { oceanUniforms.uLightsPos.value[i].set(...l[0]); oceanUniforms.uLightsCol.value[i].setRGB(...l[1]); }
        else { oceanUniforms.uLightsPos.value[i].set(0, -1e6, 0); oceanUniforms.uLightsCol.value[i].setRGB(0, 0, 0); }
      }
    },
    update(t) { oceanUniforms.uTimeW.value = t; },
  };
}
