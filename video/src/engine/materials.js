// Shared PBR materials. Created once; shots may tweak emissive intensities for night scenes.
import * as THREE from 'three';
import { paintTex, grimeTex, gratingTex, hazardTex, windowsTex } from './textures.js';

let M = null;

/**
 * Patch a standard material so `map` and `roughnessMap` are sampled triplanar in object
 * space (1 tile per `scale` metres). Keeps texel density constant on merged geometry.
 */
export function triplanar(mat, scale = 8) {
  mat.onBeforeCompile = (sh) => {
    sh.uniforms.uTpScale = { value: 1 / scale };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vTpPos; varying vec3 vTpNrm;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 tpP = vec4(transformed, 1.0); vec3 tpN = objectNormal;
        #ifdef USE_INSTANCING
          tpP = instanceMatrix * tpP; tpN = mat3(instanceMatrix) * tpN;
        #endif
        vTpPos = tpP.xyz; vTpNrm = normalize(tpN);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vTpPos; varying vec3 vTpNrm; uniform float uTpScale;
        vec4 tpSample(sampler2D t) {
          vec3 a = abs(vTpNrm);
          vec3 p = vTpPos * uTpScale;
          vec2 uv = a.x > a.y && a.x > a.z ? p.zy : (a.y > a.z ? p.xz : p.xy);
          return texture2D(t, uv);
        }`)
      .replace('#include <map_fragment>', `#ifdef USE_MAP
          vec4 sampledDiffuseColor = tpSample(map);
          diffuseColor *= sampledDiffuseColor;
        #endif`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness;
        #ifdef USE_ROUGHNESSMAP
          roughnessFactor *= tpSample(roughnessMap).g * 1.6;
        #endif`);
  };
  mat.customProgramCacheKey = () => 'tp' + scale;
  return mat;
}

export function materials() {
  if (M) return M;
  const grime = grimeTex(3, [1, 1]);
  const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.6, metalness: 0.15, ...o });
  M = {
    grime,
    yellow: triplanar(std({ map: paintTex('#d8a21c', { seed: 2, dirt: 0.3, rust: 0.25 }), roughness: 0.55, roughnessMap: grime }), 9),
    yellowClean: std({ color: '#e0ae2a', roughness: 0.45 }),
    white: triplanar(std({ map: paintTex('#e4e7e7', { seed: 4, dirt: 0.22 }), roughness: 0.5, roughnessMap: grime }), 7),
    whiteClean: std({ color: '#eceeee', roughness: 0.45 }),
    grey: triplanar(std({ map: paintTex('#8b9296', { seed: 6, dirt: 0.25 }), roughness: 0.6, roughnessMap: grime }), 7),
    deck: triplanar(std({ map: paintTex('#5d6a66', { seed: 8, dirt: 0.35, panels: 6 }), roughness: 0.8 }), 10),
    dark: std({ color: '#2f3438', roughness: 0.55, metalness: 0.4 }),
    black: std({ color: '#121314', roughness: 0.7, metalness: 0.2 }),
    antifoul: triplanar(std({ map: paintTex('#6f2a22', { seed: 10, dirt: 0.35, rust: 0.4 }), roughness: 0.7 }), 9),
    orange: std({ color: '#ff5d10', roughness: 0.45 }),
    red: std({ color: '#b3261e', roughness: 0.5 }),
    blue: std({ color: '#1f5d9e', roughness: 0.5 }),
    green: std({ color: '#2f7a4a', roughness: 0.55 }),
    steel: std({ color: '#9ba2a7', roughness: 0.32, metalness: 0.85 }),
    darkSteel: std({ color: '#3b4045', roughness: 0.45, metalness: 0.8 }),
    pipe: std({ color: '#6e7479', roughness: 0.38, metalness: 0.85 }),
    casing: std({ color: '#7d4a2e', roughness: 0.55, metalness: 0.6 }),
    rust: std({ color: '#6a3a22', roughness: 0.85, metalness: 0.3 }),
    rubber: std({ color: '#151515', roughness: 0.9, metalness: 0.0 }),
    glass: std({ color: '#0d1820', roughness: 0.06, metalness: 0.9, envMapIntensity: 1.4 }),
    grating: std({ map: gratingTex([12, 12]), roughness: 0.65, metalness: 0.6 }),
    hazard: std({ map: hazardTex([10, 1]), roughness: 0.55 }),
    windows: std({ map: windowsTex(18, 6), roughness: 0.4, metalness: 0.1, emissiveMap: windowsTex(18, 6, { emissive: true }), emissive: new THREE.Color(0xffffff), emissiveIntensity: 0 }),
    // emissive "bulbs" — intensity raised for dusk/night shots
    lampWarm: new THREE.MeshStandardMaterial({ color: '#000', emissive: new THREE.Color('#ffd49a'), emissiveIntensity: 0, roughness: 1 }),
    lampWhite: new THREE.MeshStandardMaterial({ color: '#222', emissive: new THREE.Color('#e8f0ff'), emissiveIntensity: 0, roughness: 1 }),
    lampRed: new THREE.MeshStandardMaterial({ color: '#300', emissive: new THREE.Color('#ff2010'), emissiveIntensity: 3, roughness: 1 }),
    lampGreen: new THREE.MeshStandardMaterial({ color: '#030', emissive: new THREE.Color('#27ff6a'), emissiveIntensity: 0, roughness: 1 }),
    lampYellow: new THREE.MeshStandardMaterial({ color: '#330', emissive: new THREE.Color('#ffd23a'), emissiveIntensity: 0, roughness: 1 }),
  };
  return M;
}

/** Set rig lighting level: 0 = daylight (lamps off), 1 = full night. */
export function setLamps(level) {
  const m = materials();
  m.lampWarm.emissiveIntensity = 6 * level;
  m.lampWhite.emissiveIntensity = 7 * level;
  m.lampGreen.emissiveIntensity = 4 * level;
  m.lampYellow.emissiveIntensity = 4 * level;
  m.lampRed.emissiveIntensity = 2 + 4 * level;
  m.windows.emissiveIntensity = 1.6 * level;
}
