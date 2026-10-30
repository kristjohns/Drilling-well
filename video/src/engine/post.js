// Post-processing chain: MSAA scene render -> bloom -> ACES tone map -> film grade.
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uRes: { value: new THREE.Vector2(1920, 1080) },
    uVignette: { value: 0.35 },
    uGrain: { value: 0.035 },
    uCA: { value: 0.0015 },
    uFade: { value: 0 },          // 0 = picture, 1 = black
    uWhite: { value: 0 },         // flash to white
    uSat: { value: 1.05 },
    uContrast: { value: 1.06 },
    uTint: { value: new THREE.Color(1, 1, 1) },
    uLift: { value: new THREE.Color(0, 0, 0) },
    uRed: { value: 0 },           // red alarm wash
  },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uTime, uVignette, uGrain, uCA, uFade, uWhite, uSat, uContrast, uRed;
    uniform vec2 uRes; uniform vec3 uTint, uLift;
    varying vec2 vUv;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    void main() {
      vec2 d = vUv - 0.5;
      float r2 = dot(d, d);
      vec2 off = d * r2 * uCA * 8.0;
      vec3 c;
      c.r = texture2D(tDiffuse, vUv + off).r;
      c.g = texture2D(tDiffuse, vUv).g;
      c.b = texture2D(tDiffuse, vUv - off).b;
      c = c * uTint + uLift * (1.0 - c);
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, uSat);
      c = (c - 0.5) * uContrast + 0.5;
      c *= 1.0 - uVignette * smoothstep(0.12, 0.62, r2 * 1.6);
      c = mix(c, c * vec3(1.0, 0.25, 0.2) + vec3(0.18, 0.0, 0.0), uRed * (0.35 + 0.65 * smoothstep(0.05, 0.5, r2 * 2.0)));
      float g = hash(vUv * uRes + fract(uTime * 7.13) * 100.0) - 0.5;
      c += g * uGrain * (1.0 - l * 0.5);
      c = mix(c, vec3(1.0), uWhite);
      c *= 1.0 - uFade;
      gl_FragColor = vec4(clamp(c, 0.0, 1.0), 1.0);
    }`,
};

// Removes NaN/Inf pixels (which bloom would smear over the frame) and clamps extreme HDR.
const SanitizeShader = {
  uniforms: { tDiffuse: { value: null }, uMax: { value: 48.0 } },
  vertexShader: /* glsl */`varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse; uniform float uMax; varying vec2 vUv;
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      if (any(isnan(c)) || any(isinf(c))) c = vec4(0.0, 0.0, 0.0, 1.0);
      gl_FragColor = vec4(min(c.rgb, vec3(uMax)), 1.0);
    }`,
};

export function createPost(renderer, scene, camera, W, H, samples = 4) {
  const rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, samples });
  const composer = new EffectComposer(renderer, rt);
  composer.setPixelRatio(1);
  composer.setSize(W, H);
  const renderPass = new RenderPass(scene, camera);
  const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.6, 0.55, 0.92);
  const output = new OutputPass();
  const grade = new ShaderPass(GradeShader);
  grade.uniforms.uRes.value.set(W, H);
  const sanitize = new ShaderPass(SanitizeShader);
  composer.addPass(renderPass);
  composer.addPass(sanitize);
  composer.addPass(bloom);
  composer.addPass(output);
  composer.addPass(grade);

  const defaults = { bloom: 0.45, bloomRadius: 0.5, bloomThreshold: 1.6, vignette: 0.38, grain: 0.035, ca: 0.0015, sat: 1.18, contrast: 1.14 };
  return {
    composer, bloom, grade, renderPass,
    /** Apply look settings; unspecified keys fall back to defaults. */
    look(o = {}) {
      const s = { ...defaults, ...o };
      bloom.strength = s.bloom; bloom.radius = s.bloomRadius; bloom.threshold = s.bloomThreshold;
      const u = grade.uniforms;
      u.uVignette.value = s.vignette; u.uGrain.value = s.grain; u.uCA.value = s.ca;
      u.uSat.value = s.sat; u.uContrast.value = s.contrast;
      u.uTint.value.set(s.tint ?? 0xffffff); u.uLift.value.set(s.lift ?? 0x000000);
      u.uFade.value = 0; u.uWhite.value = 0; u.uRed.value = 0;
    },
    render(t) { grade.uniforms.uTime.value = t; composer.render(); },
  };
}
