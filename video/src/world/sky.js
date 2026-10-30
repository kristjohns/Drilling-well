// Procedural sky dome: gradient + sun + fbm clouds + stars + aurora.
// The same GLSL `skyColor()` is shared with the ocean so reflections match the sky exactly.
import * as THREE from 'three';

export const skyUniforms = {
  uTime: { value: 0 },
  uSunDir: { value: new THREE.Vector3(0.3, 0.2, -1).normalize() },
  uSunColor: { value: new THREE.Color(1.0, 0.85, 0.6) },
  uSunIntensity: { value: 1 },
  uZenith: { value: new THREE.Color(0.12, 0.25, 0.48) },
  uHorizon: { value: new THREE.Color(0.75, 0.68, 0.62) },
  uGround: { value: new THREE.Color(0.08, 0.1, 0.12) },
  uCloudCover: { value: 0.45 },
  uCloudColor: { value: new THREE.Color(1, 0.95, 0.9) },
  uCloudShade: { value: new THREE.Color(0.35, 0.38, 0.45) },
  uCloudScale: { value: 1.0 },
  uCloudSpeed: { value: 0.01 },
  uStars: { value: 0 },
  uAurora: { value: 0 },
  uSkyExposure: { value: 1 },
};

export const SKY_GLSL = /* glsl */`
uniform float uTime, uSunIntensity, uCloudCover, uCloudScale, uCloudSpeed, uStars, uAurora, uSkyExposure;
uniform vec3 uSunDir, uSunColor, uZenith, uHorizon, uGround, uCloudColor, uCloudShade;

float sk_hash(vec2 p) { p = fract(p * vec2(443.897, 441.423)); p += dot(p, p.yx + 19.19); return fract((p.x + p.y) * p.x); }
float sk_hash3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float sk_noise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  float a = sk_hash(i), b = sk_hash(i + vec2(1, 0)), c = sk_hash(i + vec2(0, 1)), d = sk_hash(i + vec2(1, 1));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}
float sk_fbm(vec2 p) {
  float s = 0.0, a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) { s += a * sk_noise(p); p = m * p; a *= 0.5; }
  return s;
}

vec3 skyBase(vec3 d) {
  float y = d.y;
  float h = pow(1.0 - max(y, 0.0), 4.0);
  vec3 c = mix(uZenith, uHorizon, h);
  if (y < 0.0) c = mix(uHorizon, uGround, smoothstep(0.0, -0.25, y));
  // sun glow scattering near the horizon
  float sd = max(dot(d, uSunDir), 0.0);
  c += uSunColor * (pow(sd, 6.0) * 0.35 + pow(sd, 40.0) * 0.5) * uSunIntensity * (0.6 + 0.4 * h);
  return c;
}

vec3 skyClouds(vec3 d, vec3 c) {
  if (d.y <= 0.004 || uCloudCover <= 0.001) return c;
  vec2 uv = d.xz / (d.y + 0.08) * 0.9 * uCloudScale + vec2(uTime * uCloudSpeed, uTime * uCloudSpeed * 0.4);
  float n = sk_fbm(uv);
  float n2 = sk_fbm(uv * 2.7 + 13.1);
  float cov = 1.0 - uCloudCover;
  float dens = smoothstep(cov - 0.12, cov + 0.25, n * 0.8 + n2 * 0.3);
  float sd = max(dot(d, uSunDir), 0.0);
  // thicker parts are darker underneath, edges catch the sun
  float edge = 1.0 - smoothstep(0.0, 0.85, dens);
  vec3 lit = mix(uCloudShade, uCloudColor, clamp(0.35 + 0.65 * (1.0 - n2) + edge * 0.4, 0.0, 1.0));
  lit += uSunColor * (pow(sd, 10.0) * 1.2 * edge + pow(sd, 3.0) * 0.25) * uSunIntensity;
  float fade = smoothstep(0.0, 0.12, d.y);
  return mix(c, lit, dens * fade);
}

vec3 skyStars(vec3 d) {
  if (uStars <= 0.0 || d.y < 0.0) return vec3(0.0);
  vec3 p = d * 260.0;
  vec3 cell = floor(p);
  float h = sk_hash3(cell);
  if (h < 0.985) return vec3(0.0);
  vec3 f = fract(p) - 0.5;
  float s = smoothstep(0.22, 0.0, length(f)) * (h - 0.985) * 66.0;
  float tw = 0.75 + 0.25 * sin(uTime * 3.0 + h * 100.0);
  return vec3(0.85, 0.9, 1.0) * s * tw * uStars * smoothstep(0.0, 0.15, d.y);
}

vec3 skyAurora(vec3 d) {
  if (uAurora <= 0.0 || d.y < 0.01) return vec3(0.0);
  float az = atan(d.z, d.x);
  float el = asin(clamp(d.y, 0.0, 1.0));
  vec3 acc = vec3(0.0);
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float u = az * (1.6 + fk * 0.7) + fk * 2.3;
    // curtain base elevation wanders along the azimuth and slowly in time
    float e0 = 0.16 + 0.12 * fk + 0.07 * (sk_noise(vec2(u * 1.3 + uTime * 0.03, fk * 7.0)) - 0.5) + 0.04 * (sk_noise(vec2(u * 4.0 - uTime * 0.05, 3.0 + fk)) - 0.5);
    float h = el - e0;
    float base = smoothstep(-0.012, 0.01, h) * exp(-max(h, 0.0) / (0.07 + 0.05 * fk));
    float rays = 0.45 + 0.55 * sk_noise(vec2(u * 60.0 + uTime * 0.4, fk * 5.0));
    rays *= 0.6 + 0.4 * sk_noise(vec2(u * 9.0 - uTime * 0.12, 11.0 + fk));
    float fold = 0.55 + 0.45 * sin(u * 3.0 + sk_noise(vec2(u * 2.0, uTime * 0.02)) * 4.0);
    vec3 col = mix(vec3(0.12, 1.0, 0.42), vec3(0.62, 0.22, 0.92), smoothstep(0.0, 0.16, h));
    acc += col * base * rays * fold * (k == 0 ? 0.9 : 0.55);
  }
  return acc * uAurora * smoothstep(0.02, 0.18, d.y) * 0.9;
}

vec3 skyColor(vec3 d) {
  vec3 c = skyBase(d);
  c += skyStars(d);
  c += skyAurora(d);
  c = skyClouds(d, c);
  return c * uSkyExposure;
}
`;

export function createSky() {
  const mat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = normalize((modelMatrix * vec4(position, 1.0)).xyz - cameraPosition);
        vec4 p = projectionMatrix * viewMatrix * vec4((modelMatrix * vec4(position, 1.0)).xyz, 1.0);
        gl_Position = p.xyww;
      }`,
    fragmentShader: /* glsl */`
      ${SKY_GLSL}
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 c = skyColor(d);
        float sd = max(dot(d, uSunDir), 0.0);
        c += uSunColor * smoothstep(0.99955, 0.99985, sd) * 12.0 * uSunIntensity;   // sun disk
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: true,
    fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(9000, 48, 24), mat);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  mesh.onBeforeRender = (r, s, cam) => mesh.position.copy(cam.position);
  return mesh;
}

/** Named sky presets used by the shots. */
export const SKY_PRESETS = {
  sunset: {
    sun: [-0.62, 0.075, -0.78], sunColor: [1.0, 0.62, 0.32], sunI: 1.25,
    zenith: [0.07, 0.13, 0.28], horizon: [0.95, 0.56, 0.36], ground: [0.05, 0.06, 0.08],
    cover: 0.42, cloud: [1.0, 0.72, 0.55], shade: [0.26, 0.22, 0.3], scale: 1.0, stars: 0, aurora: 0, exp: 1.0,
  },
  day: {
    sun: [0.45, 0.52, -0.72], sunColor: [1.0, 0.93, 0.82], sunI: 1.0,
    zenith: [0.07, 0.2, 0.5], horizon: [0.5, 0.6, 0.72], ground: [0.12, 0.15, 0.18],
    cover: 0.36, cloud: [1.0, 1.0, 1.0], shade: [0.55, 0.6, 0.68], scale: 0.8, stars: 0, aurora: 0, exp: 1.0,
  },
  overcast: {
    sun: [0.3, 0.35, -0.9], sunColor: [0.9, 0.9, 0.95], sunI: 0.35,
    zenith: [0.28, 0.33, 0.4], horizon: [0.55, 0.6, 0.66], ground: [0.1, 0.12, 0.14],
    cover: 0.85, cloud: [0.72, 0.75, 0.8], shade: [0.3, 0.33, 0.38], scale: 0.9, stars: 0, aurora: 0, exp: 1.0,
  },
  storm: {
    sun: [-0.5, 0.06, -0.86], sunColor: [1.0, 0.55, 0.35], sunI: 0.55,
    zenith: [0.05, 0.065, 0.09], horizon: [0.32, 0.27, 0.27], ground: [0.03, 0.035, 0.045],
    cover: 0.86, cloud: [0.42, 0.38, 0.4], shade: [0.07, 0.08, 0.1], scale: 1.3, stars: 0, aurora: 0, exp: 1.0,
  },
  night: {
    sun: [0.2, -0.25, -0.95], sunColor: [0.3, 0.4, 0.6], sunI: 0.0,
    zenith: [0.005, 0.01, 0.025], horizon: [0.03, 0.05, 0.08], ground: [0.005, 0.008, 0.012],
    cover: 0.12, cloud: [0.08, 0.1, 0.14], shade: [0.02, 0.025, 0.035], scale: 1.0, stars: 1.0, aurora: 1.0, exp: 1.0,
  },
  dusk: {
    sun: [-0.7, 0.01, -0.7], sunColor: [1.0, 0.45, 0.25], sunI: 0.8,
    zenith: [0.03, 0.05, 0.12], horizon: [0.6, 0.32, 0.28], ground: [0.03, 0.035, 0.05],
    cover: 0.35, cloud: [0.9, 0.5, 0.42], shade: [0.12, 0.1, 0.16], scale: 1.1, stars: 0.3, aurora: 0, exp: 1.0,
  },
};

export function applySky(name, overrides = {}) {
  const p = { ...SKY_PRESETS[name], ...overrides };
  const u = skyUniforms;
  u.uSunDir.value.set(...p.sun).normalize();
  u.uSunColor.value.setRGB(...p.sunColor);
  u.uSunIntensity.value = p.sunI;
  u.uZenith.value.setRGB(...p.zenith);
  u.uHorizon.value.setRGB(...p.horizon);
  u.uGround.value.setRGB(...p.ground);
  u.uCloudCover.value = p.cover;
  u.uCloudColor.value.setRGB(...p.cloud);
  u.uCloudShade.value.setRGB(...p.shade);
  u.uCloudScale.value = p.scale;
  u.uStars.value = p.stars;
  u.uAurora.value = p.aurora;
  u.uSkyExposure.value = p.exp;
  return p;
}
