// Procedural canvas textures. No external image assets are used anywhere in the film.
import * as THREE from 'three';
import { rng } from './util.js';

function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function tex(c, { srgb = true, repeat = [1, 1], aniso = 8 } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = aniso;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

/** Tileable value-noise fbm field in [0,1], size x size. */
export function fbmField(size, { octaves = 5, base = 4, seed = 1, gain = 0.5 } = {}) {
  const r = rng(seed);
  const field = new Float32Array(size * size);
  let amp = 1, total = 0;
  for (let o = 0; o < octaves; o++) {
    const n = base << o;
    const grid = new Float32Array(n * n);
    for (let i = 0; i < n * n; i++) grid[i] = r();
    for (let y = 0; y < size; y++) {
      const gy = (y / size) * n, iy = Math.floor(gy), fy = gy - iy, sy = fy * fy * (3 - 2 * fy);
      const y0 = iy % n, y1 = (iy + 1) % n;
      for (let x = 0; x < size; x++) {
        const gx = (x / size) * n, ix = Math.floor(gx), fx = gx - ix, sx = fx * fx * (3 - 2 * fx);
        const x0 = ix % n, x1 = (ix + 1) % n;
        const a = grid[y0 * n + x0], b = grid[y0 * n + x1], c = grid[y1 * n + x0], d = grid[y1 * n + x1];
        field[y * size + x] += amp * ((a + (b - a) * sx) * (1 - sy) + (c + (d - c) * sx) * sy);
      }
    }
    total += amp;
    amp *= gain;
  }
  for (let i = 0; i < field.length; i++) field[i] /= total;
  return field;
}

function fieldToCanvas(field, size, mapFn) {
  const [c, g] = canvas(size);
  const img = g.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const [r, gg, b, a = 255] = mapFn(field[i], i % size, Math.floor(i / size));
    img.data[i * 4] = r; img.data[i * 4 + 1] = gg; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = a;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Grayscale grime/roughness map: mostly mid-grey with blotches and vertical rust streaks. */
export function grimeTex(seed = 3, repeat = [1, 1]) {
  const size = 512;
  const f = fbmField(size, { seed, base: 4, octaves: 6 });
  const streak = fbmField(size, { seed: seed + 7, base: 32, octaves: 2 });
  const c = fieldToCanvas(f, size, (v, x, y) => {
    const s = streak[(Math.floor(y / 6) % (size / 8)) * 8 * size + x] || 0;
    const k = Math.max(0, Math.min(255, 150 + (v - 0.5) * 160 + (s - 0.5) * 70));
    return [k, k, k];
  });
  return tex(c, { srgb: false, repeat });
}

/** Painted steel color variation: tints base color with dirt and subtle panel lines. */
export function paintTex(hex, { seed = 5, panels = 8, dirt = 0.25, repeat = [1, 1], rust = 0 } = {}) {
  const size = 512;
  const f = fbmField(size, { seed, base: 6, octaves: 6 });
  const col = new THREE.Color(hex);
  const base = [col.r * 255, col.g * 255, col.b * 255];
  const c = fieldToCanvas(f, size, (v, x, y) => {
    let k = 1 - dirt * Math.max(0, v - 0.45) * 2.2;
    const px = x % (size / panels), py = y % (size / panels);
    if (px < 2 || py < 2) k *= 0.82;
    let r = base[0] * k, g = base[1] * k, b = base[2] * k;
    if (rust > 0 && v > 0.62) {
      const a = Math.min(1, (v - 0.62) * 6) * rust;
      r = r * (1 - a) + 120 * a; g = g * (1 - a) + 62 * a; b = b * (1 - a) + 30 * a;
    }
    return [r, g, b];
  });
  return tex(c, { repeat });
}

/** Living quarters facade: rows of windows; emissive variant lights random windows. */
export function windowsTex(cols = 16, rows = 6, { emissive = false, seed = 9 } = {}) {
  const [c, g] = canvas(1024, 512);
  const r = rng(seed);
  g.fillStyle = emissive ? '#000' : '#e9ecee';
  g.fillRect(0, 0, 1024, 512);
  const cw = 1024 / cols, rh = 512 / rows;
  for (let j = 0; j < rows; j++) {
    if (!emissive) {
      g.fillStyle = '#c9ced2';
      g.fillRect(0, j * rh + rh * 0.92, 1024, rh * 0.08);
    }
    for (let i = 0; i < cols; i++) {
      const x = i * cw + cw * 0.18, y = j * rh + rh * 0.28, w = cw * 0.64, h = rh * 0.42;
      if (emissive) {
        const on = r() < 0.62;
        g.fillStyle = on ? `rgb(255,${200 + r() * 40},${130 + r() * 50})` : '#000';
      } else {
        g.fillStyle = '#28323a';
      }
      g.fillRect(x, y, w, h);
    }
  }
  return tex(c);
}

/** Helideck: dark green-grey deck, yellow touchdown circle, white H, perimeter markings. */
export function helideckTex() {
  const [c, g] = canvas(1024);
  g.fillStyle = '#2f3a36';
  g.fillRect(0, 0, 1024, 1024);
  // net mesh
  g.strokeStyle = 'rgba(20,24,22,0.55)';
  g.lineWidth = 3;
  for (let i = 0; i < 1024; i += 40) {
    g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 1024); g.stroke();
    g.beginPath(); g.moveTo(0, i); g.lineTo(1024, i); g.stroke();
  }
  // perimeter line
  g.strokeStyle = '#f2f2f2';
  g.lineWidth = 16;
  g.beginPath();
  for (let k = 0; k <= 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
    const x = 512 + Math.cos(a) * 478, y = 512 + Math.sin(a) * 478;
    k ? g.lineTo(x, y) : g.moveTo(x, y);
  }
  g.stroke();
  // touchdown circle
  g.strokeStyle = '#f2c230';
  g.lineWidth = 46;
  g.beginPath(); g.arc(512, 512, 250, 0, Math.PI * 2); g.stroke();
  // H
  g.fillStyle = '#f2f2f2';
  g.fillRect(420, 380, 44, 264);
  g.fillRect(560, 380, 44, 264);
  g.fillRect(420, 490, 184, 44);
  // max weight box
  g.font = 'bold 54px Inter, sans-serif';
  g.fillText('12.8t', 450, 840);
  return tex(c);
}

/** Yellow/black hazard stripes. */
export function hazardTex(repeat = [8, 1]) {
  const [c, g] = canvas(256, 64);
  g.fillStyle = '#e9b521';
  g.fillRect(0, 0, 256, 64);
  g.fillStyle = '#151515';
  for (let i = -64; i < 320; i += 64) {
    g.beginPath(); g.moveTo(i, 64); g.lineTo(i + 32, 64); g.lineTo(i + 64, 0); g.lineTo(i + 32, 0); g.fill();
  }
  return tex(c, { repeat });
}

/** Steel grating for walkways and the drill floor. */
export function gratingTex(repeat = [10, 10]) {
  const [c, g] = canvas(256);
  g.fillStyle = '#5b5f62';
  g.fillRect(0, 0, 256, 256);
  g.fillStyle = '#2a2d2f';
  for (let y = 4; y < 256; y += 16) for (let x = 2; x < 256; x += 8) g.fillRect(x, y, 5, 11);
  return tex(c, { repeat });
}

/** Red zone hatch decal for the drill floor. */
export function redZoneTex() {
  const [c, g] = canvas(512);
  g.clearRect(0, 0, 512, 512);
  g.strokeStyle = 'rgba(230,40,30,0.95)';
  g.lineWidth = 18;
  g.strokeRect(10, 10, 492, 492);
  g.lineWidth = 10;
  g.strokeStyle = 'rgba(230,40,30,0.55)';
  for (let i = -512; i < 1024; i += 46) { g.beginPath(); g.moveTo(i, 0); g.lineTo(i + 512, 512); g.stroke(); }
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Simple text texture (signage, labels inside the 3D world). */
export function textTex(text, { w = 1024, h = 256, color = '#fff', bg = null, font = '700 150px Inter, sans-serif', align = 'center' } = {}) {
  const [c, g] = canvas(w, h);
  if (bg) { g.fillStyle = bg; g.fillRect(0, 0, w, h); }
  g.fillStyle = color;
  g.font = font;
  g.textAlign = align;
  g.textBaseline = 'middle';
  g.fillText(text, align === 'center' ? w / 2 : 20, h / 2);
  const t = tex(c);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

/** Seabed sand with ripples (color) — the ripples also go into a bump map. */
export function sandTex(repeat = [40, 40]) {
  const size = 512;
  const f = fbmField(size, { seed: 21, base: 8, octaves: 5 });
  const c = fieldToCanvas(f, size, (v, x, y) => {
    const rip = Math.sin((x * 0.11 + Math.sin(y * 0.031) * 4 + v * 6)) * 0.5 + 0.5;
    const k = 0.75 + v * 0.35 + rip * 0.08;
    return [118 * k, 112 * k, 92 * k];
  });
  return tex(c, { repeat });
}

export function sandBump(repeat = [40, 40]) {
  const size = 512;
  const f = fbmField(size, { seed: 21, base: 8, octaves: 5 });
  const c = fieldToCanvas(f, size, (v, x, y) => {
    const rip = Math.sin((x * 0.11 + Math.sin(y * 0.031) * 4 + v * 6)) * 0.5 + 0.5;
    const k = (rip * 0.6 + v * 0.4) * 255;
    return [k, k, k];
  });
  return tex(c, { srgb: false, repeat });
}

/** Rock texture for cut faces of the earth and borehole wall. */
export function rockTex(c1, c2, { seed = 31, repeat = [1, 1], layered = 0.4, grain = 0.35 } = {}) {
  const size = 512;
  const f = fbmField(size, { seed, base: 6, octaves: 6 });
  const f2 = fbmField(size, { seed: seed + 3, base: 64, octaves: 2 });
  const a = new THREE.Color(c1), b = new THREE.Color(c2);
  const c = fieldToCanvas(f, size, (v, x, y) => {
    const lay = Math.sin(y * 0.09 + v * 9) * 0.5 + 0.5;
    const t = Math.min(1, Math.max(0, v * (1 - layered) + lay * layered + (f2[y * size + x] - 0.5) * grain));
    return [(a.r + (b.r - a.r) * t) * 255, (a.g + (b.g - a.g) * t) * 255, (a.b + (b.b - a.b) * t) * 255];
  });
  return tex(c, { repeat });
}

/** Generic tileable noise as a texture (for shaders: god rays, foam, clouds). */
export function noiseTex({ size = 256, seed = 11, base = 4, octaves = 5, repeat = [1, 1] } = {}) {
  const f = fbmField(size, { seed, base, octaves });
  const c = fieldToCanvas(f, size, (v) => [v * 255, v * 255, v * 255]);
  return tex(c, { srgb: false, repeat });
}

/** Chain link pattern for anchor chains (wrapped around a tube). */
export function chainTex(repeat = [1, 200]) {
  const [c, g] = canvas(64, 128);
  g.fillStyle = '#1b1c1c';
  g.fillRect(0, 0, 64, 128);
  g.strokeStyle = '#6d625a';
  g.lineWidth = 12;
  g.beginPath(); g.ellipse(32, 32, 20, 30, 0, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#4a433e';
  g.fillRect(4, 76, 56, 24);
  return tex(c, { repeat });
}
