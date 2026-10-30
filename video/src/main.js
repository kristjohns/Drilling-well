// Film runtime: builds the world once, then renders any frame of any shot on request.
// Every frame is a pure function of (shot, time), so frames can be rendered in any order
// and in parallel by several browser instances.
import * as THREE from 'three';
import { createPost } from './engine/post.js';
import { Overlay } from './engine/overlay.js';
import { materials, setLamps } from './engine/materials.js';
import { createSky, applySky, skyUniforms } from './world/sky.js';
import { createOcean } from './world/ocean.js';
import { createRig } from './world/rig.js';
import { SHOTS } from './shots/index.js';

const params = new URLSearchParams(location.search);
const W = +(params.get('w') || 1920), H = +(params.get('h') || 1080);
const stage = document.getElementById('stage');
stage.style.transform = `scale(${W / 1920})`;

const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.AgXToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
const glEl = document.getElementById('gl');
glEl.appendChild(renderer.domElement);
glEl.style.transform = `scale(${1920 / W})`;
glEl.style.transformOrigin = '0 0';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 30000);
const post = createPost(renderer, scene, camera, W, H, +(params.get('msaa') ?? 4));
const ov = new Overlay(document.getElementById('overlay'));
const pmrem = new THREE.PMREMGenerator(renderer);

// ---------- world ----------
const world = {
  THREE, scene, camera, renderer, post, ov, W, H,
  sets: {},
  lights: {},
  mats: materials(),
  timeline: null,
};

function addSet(name, obj) {
  world.sets[name] = obj;
  scene.add(obj);
  return obj;
}

/** Show only the named sets. */
world.show = (names) => {
  for (const [k, v] of Object.entries(world.sets)) v.visible = names.includes(k);
};

// lights
const sun = new THREE.DirectionalLight(0xffffff, 3);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.04;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xbfd8ff, 0x203040, 0.6);
scene.add(hemi);
world.lights = { sun, hemi };

/** Configure shadow frustum around a centre. */
world.shadowBox = (center, half = 80, depth = 500) => {
  const c = new THREE.Vector3(...center);
  const d = skyUniforms.uSunDir.value.clone();
  if (d.y < 0.08) d.y = 0.08;
  d.normalize();
  sun.position.copy(c).addScaledVector(d, depth / 2);
  sun.target.position.copy(c);
  const cam = sun.shadow.camera;
  cam.left = -half; cam.right = half; cam.top = half; cam.bottom = -half;
  cam.near = 1; cam.far = depth;
  cam.updateProjectionMatrix();
};

// environment map from the procedural sky (PMREM for PBR + a plain cube for ocean reflections)
const envScene = new THREE.Scene();
let envRT = null;
const skyCubeRT = new THREE.WebGLCubeRenderTarget(256, { type: THREE.HalfFloatType });
const skyCubeCam = new THREE.CubeCamera(1, 20000, skyCubeRT);
world.updateEnv = (extra) => {
  if (envRT) envRT.dispose();
  envScene.clear();
  envScene.add(skyMeshEnv);
  if (extra) envScene.add(extra);
  envRT = pmrem.fromScene(envScene, 0, 0.1, 20000);
  scene.environment = envRT.texture;
  const tm = renderer.toneMapping; renderer.toneMapping = THREE.NoToneMapping;
  skyCubeCam.update(renderer, envScene);
  renderer.toneMapping = tm;
  ocean.uniforms.uSkyCube.value = skyCubeRT.texture;
};

const skyMesh = createSky();
const skyMeshEnv = createSky();
addSet('sky', skyMesh);
const ocean = createOcean();
addSet('ocean', ocean.mesh);
world.ocean = ocean;

/**
 * Ocean environment preset: sky + sun + matching fog/hemisphere + PMREM env.
 * opts: { sky:'sunset', amp, chop, foam, exposure, fog, wind, sun:[...] }
 */
world.envOcean = (preset, o = {}) => {
  const p = applySky(preset, o.skyOverrides || {});
  ocean.set({ amp: o.amp ?? 1, chop: o.chop ?? 0.8, wind: o.wind ?? 0.3, foam: o.foam ?? 0.6, deep: o.deep, scatter: o.scatter, fogNear: o.fogNear ?? 1500, fogFar: o.fogFar ?? 9000, glitter: o.glitter });
  const sd = skyUniforms.uSunDir.value;
  sun.color.setRGB(...p.sunColor);
  sun.intensity = (o.sunI ?? 4.2) * p.sunI * Math.min(1, Math.max(0, sd.y * 6 + 0.25));
  hemi.color.copy(skyUniforms.uZenith.value).lerp(new THREE.Color(1, 1, 1), 0.35);
  hemi.groundColor.setRGB(0.05, 0.07, 0.09);
  hemi.intensity = o.hemi ?? 0.35;
  scene.environmentIntensity = o.envI ?? 0.55;
  ocean.setLights(o.oceanLights || []);
  const hz = new THREE.Color().setRGB(...p.horizon);
  scene.fog = new THREE.FogExp2(hz.multiplyScalar(o.fogMul ?? 0.9), o.fog ?? 0.00011);
  scene.background = null;
  renderer.toneMappingExposure = o.exposure ?? 1.0;
  world.updateEnv();
  setLamps(o.lamps ?? 0);
};

/** Underwater environment: dense blue-green fog, light from above. */
world.envUnder = (o = {}) => {
  const col = new THREE.Color(...(o.color || [0.0, 0.085, 0.11]));
  scene.fog = new THREE.FogExp2(col, o.fog ?? 0.0065);
  scene.background = col.clone();
  sun.intensity = o.sunI ?? 2.0;
  sun.color.setRGB(0.55, 0.85, 0.9);
  hemi.color.setRGB(0.25, 0.55, 0.6);
  hemi.groundColor.setRGB(0.02, 0.05, 0.06);
  hemi.intensity = o.hemi ?? 1.2;
  renderer.toneMappingExposure = o.exposure ?? 1.2;
  scene.environmentIntensity = o.envI ?? 0.4;
  ocean.uniforms.uUnderCol.value.copy(col);
};

/** Studio environment for cutaways/diagrams: dark gradient backdrop, soft key + fill. */
const studioBg = (() => {
  const c = document.createElement('canvas'); c.width = 16; c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#1a2a3a'); gr.addColorStop(0.55, '#0b131c'); gr.addColorStop(1, '#05080c');
  g.fillStyle = gr; g.fillRect(0, 0, 16, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
})();
const studioEnvScene = (() => {
  const s = new THREE.Scene();
  s.background = new THREE.Color('#2a3a4a');
  const l1 = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), new THREE.MeshBasicMaterial({ color: new THREE.Color(4, 4, 4.2), side: THREE.DoubleSide }));
  l1.position.set(0, 40, 30); l1.lookAt(0, 0, 0); s.add(l1);
  const l2 = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.MeshBasicMaterial({ color: new THREE.Color(1.2, 1.6, 2.2), side: THREE.DoubleSide }));
  l2.position.set(-40, 10, -20); l2.lookAt(0, 0, 0); s.add(l2);
  return s;
})();
let studioRT = null;
world.envStudio = (o = {}) => {
  scene.background = o.bg === undefined ? studioBg : o.bg;
  scene.fog = o.fog ? new THREE.FogExp2(new THREE.Color(o.fogColor || '#0b131c'), o.fog) : null;
  if (!studioRT) studioRT = pmrem.fromScene(studioEnvScene, 0.02);
  scene.environment = studioRT.texture;
  scene.environmentIntensity = o.envI ?? 1.0;
  const sd = new THREE.Vector3(...(o.sunDir || [0.5, 0.8, 0.45])).normalize();
  skyUniforms.uSunDir.value.copy(sd);
  sun.color.set(o.sunColor || '#fff4e8');
  sun.intensity = o.sunI ?? 2.6;
  hemi.color.set(o.hemiSky || '#9fb8d8');
  hemi.groundColor.set(o.hemiGround || '#1a1410');
  hemi.intensity = o.hemi ?? 0.8;
  renderer.toneMappingExposure = o.exposure ?? 1.0;
};

// ---------- sets ----------
const rig = createRig({ waterDepth: 320 });
world.rig = rig;
addSet('rig', rig.root);
addSet('anchors', rig.anchors);

// Remaining sets register themselves via shots/index.js (lazy builders).
world.addSet = addSet;
world.pmrem = pmrem;

// ---------- frame rendering ----------
let current = null;
let timeline = null;

async function loadTimeline() {
  const r = await fetch('build/timeline.json');
  timeline = await r.json();
  world.timeline = timeline;
}

function shotInfo(id) {
  return timeline.shots.find((s) => s.id === id);
}

function prepareShot(id) {
  if (current === id) return;
  const def = SHOTS[id];
  if (!def) throw new Error('No shot ' + id);
  if (current && SHOTS[current].teardown) SHOTS[current].teardown(world);
  ov.reset();
  post.look(def.look || {});
  camera.fov = 40; camera.near = 0.1; camera.far = 30000; camera.updateProjectionMatrix();
  rig.resetPose();
  rig.setMotion(0, 0, 0);
  if (world.crew) world.crew.visible = true;
  if (world.lights.flood) world.lights.flood.visible = false;
  if (world.battery) world.battery.group.visible = false;
  sun.castShadow = true;
  setLamps(0);
  if (world.mapReset) world.mapReset();
  scene.environmentIntensity = 1;
  for (const s of Object.values(world.sets)) s.scale.setScalar(1);
  def.setup(world, shotInfo(id));
  current = id;
}

/** Render shot `id` at shot-local time t (seconds). */
function renderShot(id, t) {
  prepareShot(id);
  const def = SHOTS[id];
  const info = shotInfo(id);
  ocean.update(t + (def.oceanT0 || 0));
  skyUniforms.uTime.value = t + 30;
  ov.begin(camera);
  def.update(world, t, info);
  ov.end();
  post.render(info.start + t);
}

/** Render global film time T. */
function renderGlobal(T) {
  let s = timeline.shots[0];
  for (const sh of timeline.shots) if (T >= sh.start) s = sh;
  renderShot(s.id, T - s.start);
  return s.id;
}

window.renderShot = renderShot;
window.renderGlobal = renderGlobal;
window.world = world;

await loadTimeline();
for (const def of Object.values(SHOTS)) if (def.build) await def.build(world);
window.__ready = true;
