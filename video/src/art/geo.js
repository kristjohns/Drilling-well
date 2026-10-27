// Geology art: folded strata, reservoir fluids, migration, seismic sections and well logs.
'use strict';
const { createCanvas } = require('@napi-rs/canvas');
const K = require('../engine/core');
const { C, rgba, text, line, circle, lerp, clamp, rng, lithoFill, fillRR } = K;

// spec: { x0, y0, w, layers: [{ t, kind, name, fold }], fold: { cx, A, sigma } }
function foldAt(spec, x) {
  const f = spec.fold;
  if (!f) return 0;
  let v = f.A * Math.exp(-Math.pow((x - f.cx) / f.sigma, 2));
  if (f.A2) v += f.A2 * Math.exp(-Math.pow((x - f.cx2) / f.sigma2, 2));
  return v;
}
function boundaryY(spec, i, x) {
  let y = spec.y0;
  for (let k = 0; k < i; k++) y += spec.layers[k].t;
  const fl = i < spec.layers.length ? (spec.layers[i].fold != null ? spec.layers[i].fold : 1) : (spec.layers[spec.layers.length - 1].fold != null ? spec.layers[spec.layers.length - 1].fold : 1);
  return y - fl * foldAt(spec, x);
}
function layerPath(ctx, spec, i, step = 8) {
  const { x0, w } = spec;
  ctx.beginPath();
  for (let x = x0; x <= x0 + w + 0.1; x += step) ctx.lineTo(x, boundaryY(spec, i, x));
  for (let x = x0 + w; x >= x0 - 0.1; x -= step) ctx.lineTo(x, boundaryY(spec, i + 1, x));
  ctx.closePath();
}
function drawStrata(ctx, spec, opt = {}) {
  const { highlight = -1, hlAlpha = 0, dimOthers = 0, labels = false, t = 0, outline = true } = opt;
  spec.layers.forEach((L, i) => {
    ctx.save();
    layerPath(ctx, spec, i);
    ctx.clip();
    const top = Math.min(boundaryY(spec, i, spec.x0), boundaryY(spec, i, spec.fold ? spec.fold.cx : spec.x0)) - 5;
    const bot = Math.max(boundaryY(spec, i + 1, spec.x0), boundaryY(spec, i + 1, spec.x0 + spec.w)) + 5;
    lithoFill(ctx, L.kind, spec.x0, top - 200, spec.w, bot - top + 400, 11 + i * 7);
    if (dimOthers > 0 && i !== highlight) { ctx.fillStyle = rgba('#000000', 0.5 * dimOthers); ctx.fillRect(spec.x0, top - 200, spec.w, bot - top + 400); }
    if (i === highlight && hlAlpha > 0) { ctx.fillStyle = rgba('#ffffff', 0.12 * hlAlpha * (0.6 + 0.4 * K.pulse(t))); ctx.fillRect(spec.x0, top - 200, spec.w, bot - top + 400); }
    ctx.restore();
    if (outline) {
      ctx.save();
      ctx.beginPath();
      for (let x = spec.x0; x <= spec.x0 + spec.w + 0.1; x += 8) ctx.lineTo(x, boundaryY(spec, i, x));
      ctx.strokeStyle = rgba('#000000', 0.35); ctx.lineWidth = 1.5; ctx.stroke();
      ctx.restore();
    }
  });
  if (highlight >= 0 && hlAlpha > 0) {
    ctx.save();
    layerPath(ctx, spec, highlight);
    ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.globalAlpha *= hlAlpha; ctx.shadowColor = C.amber; ctx.shadowBlur = 12; ctx.stroke();
    ctx.restore();
  }
}
// fill reservoir layer i with fluids above given contact depths (absolute y)
function fluids(ctx, spec, i, opt = {}) {
  const { goc = null, owc = null, alpha = 0.75, gasA = 1, oilA = 1, waterA = 0.6, contacts = false, t = 0 } = opt;
  ctx.save();
  layerPath(ctx, spec, i);
  ctx.clip();
  const top = spec.y0 - 400;
  if (owc != null) {
    ctx.fillStyle = rgba(C.water, alpha * waterA);
    ctx.fillRect(spec.x0, owc, spec.w, 600);
    ctx.fillStyle = rgba(C.oil, alpha * oilA);
    ctx.fillRect(spec.x0, goc != null ? goc : top, spec.w, owc - (goc != null ? goc : top));
  }
  if (goc != null) {
    ctx.fillStyle = rgba(C.gas, alpha * gasA);
    ctx.fillRect(spec.x0, top, spec.w, goc - top);
  }
  ctx.restore();
}
// x-range where a horizontal level y cuts the top of layer i (the closure at that level)
function closureX(spec, i, y) {
  let xs = null, xe = null;
  for (let x = spec.x0; x <= spec.x0 + spec.w; x += 2) {
    if (boundaryY(spec, i, x) < y) { if (xs == null) xs = x; xe = x; }
  }
  return [xs, xe];
}

// migration bubbles moving along a polyline path, coloured oil/gas
function migration(ctx, paths, t, opt = {}) {
  const { alpha = 1, speed = 40, count = 6 } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  paths.forEach((pts, j) => {
    const L = K.polylineLength(pts);
    for (let k = 0; k < count; k++) {
      const d = ((t * speed + (k * L) / count + j * 37) % L);
      const [x, y] = K.pointAt(pts, d);
      const col = (k + j) % 3 === 0 ? C.gas : C.oil;
      circle(ctx, x, y, 5.5, col, rgba('#000000', 0.4), 1.5);
    }
  });
  ctx.restore();
}

// ---------- seismic ----------
const seisCache = new Map();
function ricker(tau, f = 1) { const a = Math.PI * Math.PI * f * f * tau * tau; return (1 - 2 * a) * Math.exp(-a); }
// reflectors: [{ y: (x)=>y, rc, flat?: bool }]
function seismicImage(key, w, h, reflectors, opt = {}) {
  if (seisCache.has(key)) return seisCache.get(key);
  const { seed = 5, noise = 0.08, freq = 0.11 } = opt;
  const cv = createCanvas(w, h); const c = cv.getContext('2d');
  const img = c.createImageData(w, h);
  const R = rng(seed);
  const nz = new Float32Array(w * h);
  for (let i = 0; i < nz.length; i++) nz[i] = (R() - 0.5) * 2;
  for (let x = 0; x < w; x++) {
    for (let y = 0; y < h; y++) {
      let a = 0;
      for (const r of reflectors) {
        const ry = r.y(x);
        const dy = y - ry;
        if (Math.abs(dy) < 30) a += r.rc * ricker(dy, freq) * (r.amp ? r.amp(x) : 1);
      }
      a += noise * (nz[y * w + x] * 0.6 + nz[y * w + ((x + 1) % w)] * 0.4);
      const v = clamp(0.5 + a * 0.9, 0, 1);
      // blue-white-red seismic colormap
      let r8, g8, b8;
      if (v < 0.5) { const f = v / 0.5; r8 = lerp(25, 196, f); g8 = lerp(60, 200, f); b8 = lerp(170, 206, f); }
      else { const f = (v - 0.5) / 0.5; r8 = lerp(196, 185, f); g8 = lerp(200, 35, f); b8 = lerp(206, 35, f); }
      const o = (y * w + x) * 4;
      img.data[o] = r8; img.data[o + 1] = g8; img.data[o + 2] = b8; img.data[o + 3] = 255;
    }
  }
  c.putImageData(img, 0, 0);
  seisCache.set(key, cv);
  return cv;
}

// ---------- logs ----------
// zones: [{ top, bot, lith: 'sand'|'shale'|'lime', fluid: 'gas'|'oil'|'water'|null }]
function logValue(zones, d, kind, seed = 1) {
  const z = zones.find((q) => d >= q.top && d < q.bot) || zones[zones.length - 1];
  const n = Math.sin(d * 0.37 + seed) * 0.5 + Math.sin(d * 1.13 + seed * 2) * 0.3 + Math.sin(d * 2.9) * 0.2;
  switch (kind) {
    case 'gr': return z.lith === 'sand' ? 30 + n * 8 : z.lith === 'lime' ? 20 + n * 5 : 105 + n * 15;
    case 'res': {
      if (z.lith === 'shale') return 1.5 + n * 0.4;
      if (z.fluid === 'gas') return 80 + n * 20;
      if (z.fluid === 'oil') return 40 + n * 12;
      return 0.8 + n * 0.15;
    }
    case 'den': return z.lith === 'sand' ? (z.fluid === 'gas' ? 2.12 : 2.25) + n * 0.03 : z.lith === 'lime' ? 2.55 : 2.45 + n * 0.03;
    case 'neu': return z.lith === 'sand' ? (z.fluid === 'gas' ? 0.12 : 0.22) + n * 0.02 : z.lith === 'lime' ? 0.1 : 0.38 + n * 0.03;
    default: return 0;
  }
}
// draw log tracks; prog 0..1 is how much is logged (from the bottom up)
function logTracks(ctx, x, y, h, zones, dTop, dBot, prog, opt = {}) {
  const { tw = 170, showLith = true, labels = true, gap = 10 } = opt;
  const dy = (d) => y + ((d - dTop) / (dBot - dTop)) * h;
  const tracks = [
    { key: 'lith', w: 70, title: 'LITH' },
    { key: 'gr', w: tw, title: 'GAMMA RAY', unit: '0 – 150 API', col: C.green, min: 0, max: 150 },
    { key: 'depth', w: 70, title: 'DEPTH' },
    { key: 'res', w: tw, title: 'RESISTIVITY', unit: '0.2 – 200 Ωm', col: C.red, log: true, min: 0.2, max: 200 },
    { key: 'dn', w: tw, title: 'DENSITY / NEUTRON', unit: '1.95 – 2.95 g/cc', col: C.red, min: 1.95, max: 2.95 },
  ];
  let cx = x;
  const dCut = lerp(dBot, dTop, clamp(prog));
  for (const tr of tracks) {
    fillRR(ctx, cx, y, tr.w, h, 4, '#f3f0e8', '#8c8c8c', 1.5);
    if (labels) {
      text(ctx, tr.title, cx + tr.w / 2, y - 30, { size: 16, weight: 800, align: 'center', color: C.text });
      if (tr.unit) text(ctx, tr.unit, cx + tr.w / 2, y - 10, { size: 13, weight: 600, align: 'center', color: C.dim });
    }
    ctx.save(); ctx.beginPath(); ctx.rect(cx, y, tr.w, h); ctx.clip();
    // grid
    ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
    for (let d = Math.ceil(dTop / 10) * 10; d < dBot; d += 10) { ctx.beginPath(); ctx.moveTo(cx, dy(d)); ctx.lineTo(cx + tr.w, dy(d)); ctx.stroke(); }
    if (tr.key === 'lith') {
      for (const z of zones) {
        const k = z.lith === 'sand' ? 'sand' : z.lith === 'lime' ? 'lime' : 'shale';
        lithoFill(ctx, k, cx, dy(z.top), tr.w, dy(z.bot) - dy(z.top), 5);
      }
    } else if (tr.key === 'depth') {
      for (let d = Math.ceil(dTop / 20) * 20; d < dBot; d += 20) text(ctx, String(d), cx + tr.w / 2, dy(d) + 5, { size: 13, weight: 700, align: 'center', color: '#333', fam: K.MONO });
    } else if (dCut < dBot) {
      const curve = (kind, map, col, fillTo) => {
        ctx.beginPath();
        let first = true;
        for (let d = dBot; d >= dCut; d -= 0.5) {
          const v = logValue(zones, d, kind);
          const px = map(v);
          if (first) { ctx.moveTo(px, dy(d)); first = false; } else ctx.lineTo(px, dy(d));
        }
        ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.stroke();
        if (fillTo != null) {
          ctx.lineTo(fillTo, dy(dCut)); ctx.lineTo(fillTo, dy(dBot)); ctx.closePath();
          ctx.fillStyle = rgba(C.sand, 0.45); ctx.fill();
        }
      };
      if (tr.key === 'gr') {
        // sand fill between curve and a cutoff
        const map = (v) => cx + (v / 150) * tr.w;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(cx, dy(dBot));
        for (let d = dBot; d >= dCut; d -= 0.5) ctx.lineTo(Math.min(map(logValue(zones, d, 'gr')), cx + tr.w * 0.5), dy(d));
        ctx.lineTo(cx, dy(dCut)); ctx.closePath(); ctx.fillStyle = rgba(C.sand, 0.55); ctx.fill();
        ctx.restore();
        curve('gr', map, '#1d8a3a');
      }
      if (tr.key === 'res') {
        const map = (v) => cx + (Math.log10(v / 0.2) / Math.log10(1000)) * tr.w;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(cx, dy(dBot));
        for (let d = dBot; d >= dCut; d -= 0.5) { const v = logValue(zones, d, 'res'); ctx.lineTo(v > 10 ? map(v) : cx, dy(d)); }
        ctx.lineTo(cx, dy(dCut)); ctx.closePath(); ctx.fillStyle = rgba(C.oil, 0.35); ctx.fill();
        ctx.restore();
        curve('res', map, '#c0392b');
      }
      if (tr.key === 'dn') {
        const mapD = (v) => cx + ((v - 1.95) / 1.0) * tr.w;
        const mapN = (v) => cx + ((0.45 - v) / 0.6) * tr.w;
        // gas crossover shading
        ctx.save();
        for (let d = dBot; d >= dCut; d -= 0.5) {
          const a = mapD(logValue(zones, d, 'den')), b = mapN(logValue(zones, d, 'neu'));
          if (a < b) { ctx.fillStyle = rgba(C.gas, 0.45); ctx.fillRect(a, dy(d) - 0.5, b - a, 1.6); }
        }
        ctx.restore();
        curve('den', mapD, '#c0392b');
        ctx.setLineDash([6, 4]);
        curve('neu', mapN, '#2c62c9');
        ctx.setLineDash([]);
      }
    }
    ctx.restore();
    cx += tr.w + gap;
  }
  return { dy, width: cx - x };
}

module.exports = { foldAt, boundaryY, layerPath, drawStrata, fluids, closureX, migration, seismicImage, logTracks, logValue, ricker };
