// Well log tracks for formation evaluation scenes: one track per curve type, drawn on "paper".
'use strict';
const K = require('../engine/core');
const { C, rgba, text, fillRR, line, clamp, lerp } = K;

// zones: [{ top, bot, lith: 'sand'|'shale'|'lime', fluid: 'gas'|'oil'|'water'|null }]
function zoneAt(zones, d) { return zones.find((q) => d >= q.top && d < q.bot) || zones[zones.length - 1]; }
function noise(d, seed = 1) { return Math.sin(d * 0.37 + seed) * 0.5 + Math.sin(d * 1.13 + seed * 2) * 0.3 + Math.sin(d * 2.9 + seed) * 0.2; }
function val(zones, d, kind) {
  const z = zoneAt(zones, d), n = noise(d), sand = z.lith === 'sand', lime = z.lith === 'lime';
  switch (kind) {
    case 'gr': return sand ? 32 + n * 8 : lime ? 20 + n * 5 : 105 + n * 14;
    case 'res': return z.lith === 'shale' ? 1.6 + n * 0.4 : z.fluid === 'gas' ? 120 + n * 30 : z.fluid === 'oil' ? 45 + n * 12 : lime ? 30 : 0.7 + n * 0.12;
    case 'resS': return z.lith === 'shale' ? 1.6 + n * 0.4 : z.fluid ? (z.fluid === 'water' ? 1.2 : 6 + n) : 1;
    case 'den': return sand ? (z.fluid === 'gas' ? 2.13 : 2.25) + n * 0.03 : lime ? 2.6 : 2.45 + n * 0.03;
    case 'neu': return sand ? (z.fluid === 'gas' ? 0.12 : 0.23) + n * 0.02 : lime ? 0.08 : 0.38 + n * 0.03;
    case 'dt': return sand ? (z.fluid === 'gas' ? 104 : 92) + n * 4 : lime ? 55 : 118 + n * 5;
    case 'cal': return z.lith === 'shale' ? 9.4 + Math.max(0, n) * 1.6 : 8.6 + n * 0.1;
    case 'phi': return sand ? 0.26 + n * 0.02 : lime ? 0.08 : 0.05 + n * 0.01;
    case 'sw': return z.lith === 'shale' ? 1 : z.fluid === 'gas' ? 0.14 + n * 0.03 : z.fluid === 'oil' ? 0.24 + n * 0.04 : 0.97;
    case 'rop': return sand ? 38 + n * 6 : lime ? 9 + n * 2 : 14 + n * 3;
    case 'gas': return z.fluid === 'gas' ? 4.5 + n * 1.2 : z.fluid === 'oil' ? 1.8 + n * 0.4 : z.lith === 'shale' ? 0.5 + n * 0.12 : 0.3 + n * 0.05;
    default: return 0;
  }
}
const DEF = {
  lith: { title: 'LITHOLOGY', w: 70 },
  depth: { title: 'DEPTH', unit: 'm MD', w: 70 },
  fluid: { title: 'FLUID', w: 64 },
  gr: { title: 'GAMMA RAY', unit: '0 – 150 API', min: 0, max: 150, col: '#1d8a3a' },
  res: { title: 'RESISTIVITY', unit: '0.2 – 2000 Ωm', log: true, min: 0.2, max: 2000, col: '#c0392b' },
  dn: { title: 'DENSITY · NEUTRON', unit: '1.95 – 2.95 g/cc', col: '#c0392b' },
  dt: { title: 'SONIC', unit: '140 – 40 µs/ft', min: 140, max: 40, col: '#7b3fb5' },
  cal: { title: 'CALIPER', unit: '6 – 16 in', min: 6, max: 16, col: '#444' },
  phi: { title: 'POROSITY', unit: '0.5 – 0', min: 0.5, max: 0, col: '#2c62c9' },
  sw: { title: 'WATER SATURATION', unit: '1 – 0', min: 1, max: 0, col: '#1f6fd1' },
  image: { title: 'IMAGE', unit: 'borehole wall, unrolled' },
  pay: { title: 'PAY', w: 60 },
  rop: { title: 'ROP', unit: '0 – 60 m/h', min: 0, max: 60, col: '#333' },
  gas: { title: 'TOTAL GAS', unit: '0.1 – 10 %', log: true, min: 0.1, max: 10, col: '#c0392b' },
  shows: { title: 'SHOWS', w: 70 },
};
// one track; prog 0..1 = logged fraction from the bottom up
function track(ctx, x, y, w, h, zones, dTop, dBot, prog, kind, opt = {}) {
  const D = DEF[kind] || {};
  const dy = (d) => y + ((d - dTop) / (dBot - dTop)) * h;
  const down = !!opt.down;
  const dCut = down ? lerp(dTop, dBot, clamp(prog)) : lerp(dBot, dTop, clamp(prog));
  const dA = down ? dTop : dCut, dB = down ? dCut : dBot;
  fillRR(ctx, x, y, w, h, 4, '#f3f0e8', '#8c8c8c', 1.5);
  if (opt.labels !== false) {
    text(ctx, D.title || kind, x + w / 2, y - (D.unit ? 30 : 12), { size: w < 110 ? 13 : 15, weight: 800, align: 'center', color: opt.hl ? C.amber : C.text });
    if (D.unit) text(ctx, D.unit, x + w / 2, y - 10, { size: 12, weight: 600, align: 'center', color: C.dim });
  }
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1;
  for (let d = Math.ceil(dTop / 10) * 10; d < dBot; d += 10) { ctx.beginPath(); ctx.moveTo(x, dy(d)); ctx.lineTo(x + w, dy(d)); ctx.stroke(); }
  const map = (v) => (D.log ? x + (Math.log10(v / D.min) / Math.log10(D.max / D.min)) * w : x + ((v - D.min) / (D.max - D.min)) * w);
  const curve = (k, mp, col, dash, lw = 2.2) => {
    ctx.beginPath();
    let first = true;
    for (let d = dB; d >= dA; d -= 0.5) { const px = mp(val(zones, d, k)); if (first) { ctx.moveTo(px, dy(d)); first = false; } else ctx.lineTo(px, dy(d)); }
    ctx.strokeStyle = col; ctx.lineWidth = lw; if (dash) ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
  };
  const fillBetween = (fa, fb, col) => {
    for (let d = dB; d >= dA; d -= 0.5) { const a = fa(d), b = fb(d); if (b > a) { ctx.fillStyle = col; ctx.fillRect(a, dy(d) - 0.5, b - a, 1.6); } }
  };
  const logged = dB > dA;
  if (kind === 'lith') {
    for (const z of zones) { const a = Math.max(z.top, down ? dTop : dTop), b = Math.min(z.bot, down ? dCut : dBot); if (b > a) K.lithoFill(ctx, z.lith === 'sand' ? 'sand' : z.lith === 'lime' ? 'lime' : 'shale', x, dy(a), w, dy(b) - dy(a), 5); }
  } else if (kind === 'shows') {
    for (let d = dA; d < dB; d += 3) { const z = zoneAt(zones, d); if (z.fluid === 'gas' || z.fluid === 'oil') { K.circle(ctx, x + w / 2 + (noise(d, 4) * 14), dy(d), 4.5, z.fluid === 'gas' ? C.gas : '#1f9d55'); } }
  } else if (kind === 'depth') {
    for (let d = Math.ceil(dTop / 20) * 20; d < dBot; d += 20) text(ctx, String(d), x + w / 2, dy(d) + 5, { size: 13, weight: 700, align: 'center', color: '#333', fam: K.MONO });
  } else if (kind === 'fluid') {
    for (const z of zones) if (z.fluid) { ctx.fillStyle = z.fluid === 'gas' ? C.gas : z.fluid === 'oil' ? C.oil : C.water; ctx.fillRect(x, dy(z.top), w, dy(z.bot) - dy(z.top)); text(ctx, z.fluid, x + w / 2, (dy(z.top) + dy(z.bot)) / 2 + 5, { size: 13, weight: 800, align: 'center', color: '#fff' }); }
  } else if (kind === 'image') {
    // unrolled borehole wall: dark = conductive shale, light = resistive sand; sinusoids for beds and fractures
    for (let d = dBot; d >= dCut; d -= 1) {
      const z = zoneAt(zones, d);
      const base = z.lith === 'shale' ? 70 : z.fluid && z.fluid !== 'water' ? 225 : 175;
      for (let i = 0; i < w; i += 6) { const v = base + 18 * noise(d * 2 + i * 0.3, 3); ctx.fillStyle = `rgb(${v},${Math.round(v * 0.75)},${Math.round(v * 0.35)})`; ctx.fillRect(x + i, dy(d), 6, Math.max(1.5, h / (dBot - dTop) + 0.5)); }
    }
    ctx.strokeStyle = 'rgba(30,20,10,0.75)'; ctx.lineWidth = 2;
    const sins = [...zones.map((z) => [z.top, 6]), [2455, 3], [2462, 3], [2491, 4], [2528, 3]];
    for (const [d0, amp] of sins) { if (d0 < dCut) continue; ctx.beginPath(); for (let i = 0; i <= w; i += 4) { const yy = dy(d0) + Math.sin((i / w) * Math.PI * 2) * amp * 3; i ? ctx.lineTo(x + i, yy) : ctx.moveTo(x + i, yy); } ctx.stroke(); }
    if (2575 >= dCut) { ctx.strokeStyle = 'rgba(20,10,5,0.95)'; ctx.lineWidth = 3; ctx.beginPath(); for (let i = 0; i <= w; i += 4) { const yy = dy(2575) + Math.sin((i / w) * Math.PI * 2 + 1) * 34; i ? ctx.lineTo(x + i, yy) : ctx.moveTo(x + i, yy); } ctx.stroke(); }
  } else if (kind === 'pay') {
    for (let d = dBot; d >= dCut; d -= 0.5) {
      const ok = val(zones, d, 'phi') > 0.15 && val(zones, d, 'sw') < 0.5;
      if (ok) { ctx.fillStyle = zoneAt(zones, d).fluid === 'gas' ? C.gas : C.oil; ctx.fillRect(x + 10, dy(d) - 0.5, w - 20, 1.6); }
    }
  } else if (logged) {
    if (kind === 'gr') { fillBetween(() => x, (d) => Math.min(map(val(zones, d, 'gr')), x + w * 0.5), rgba(C.sand, 0.55)); curve('gr', map, D.col); }
    if (kind === 'res') {
      fillBetween(() => x, (d) => { const v = val(zones, d, 'res'); return v > 10 ? map(v) : x; }, rgba(C.oil, 0.3));
      curve('resS', map, '#e67e22', [5, 4], 1.8); curve('res', map, D.col);
    }
    if (kind === 'dn') {
      const mapD = (v) => x + ((v - 1.95) / 1.0) * w, mapN = (v) => x + ((0.45 - v) / 0.6) * w;
      fillBetween((d) => mapD(val(zones, d, 'den')), (d) => mapN(val(zones, d, 'neu')), rgba(C.gas, 0.5));
      curve('den', mapD, '#c0392b'); curve('neu', mapN, '#2c62c9', [6, 4]);
    }
    if (kind === 'dt') curve('dt', map, D.col);
    if (kind === 'rop') { fillBetween(() => x, (d) => map(val(zones, d, 'rop')), rgba('#333', 0.12)); curve('rop', map, D.col); }
    if (kind === 'gas') { fillBetween(() => x, (d) => map(val(zones, d, 'gas')), rgba(C.gas, 0.25)); curve('gas', map, D.col); }
    if (kind === 'cal') { line(ctx, map(8.5), dy(dTop), map(8.5), dy(dBot), 'rgba(0,0,0,0.35)', 1.5, [5, 4]); curve('cal', map, D.col); }
    if (kind === 'phi') { fillBetween(() => x, (d) => map(val(zones, d, 'phi')), rgba('#2c62c9', 0.0)); fillBetween((d) => map(val(zones, d, 'phi')), () => x + w, rgba('#2c62c9', 0.25)); curve('phi', map, D.col); }
    if (kind === 'sw') { fillBetween(() => x, (d) => map(val(zones, d, 'sw')), rgba(C.oil, 0.45)); fillBetween((d) => map(val(zones, d, 'sw')), () => x + w, rgba(C.water, 0.25)); curve('sw', map, D.col); }
  }
  ctx.restore();
  if (opt.hl) K.highlightRect(ctx, x - 6, y - 52, w + 12, h + 58, opt.t || 0, { alpha: opt.hlA == null ? 1 : opt.hlA });
  return dy;
}
// lays out several tracks left to right; kinds: ['lith','gr','depth',...]; widths optional map
function tracks(ctx, x, y, h, zones, dTop, dBot, prog, kinds, opt = {}) {
  const { tw = 160, gap = 8, widths = {}, hl, t, hlA, progs = {} } = opt;
  let cx = x; let dy;
  for (const k of kinds) {
    const w = widths[k] || (DEF[k] && DEF[k].w) || tw;
    dy = track(ctx, cx, y, w, h, zones, dTop, dBot, progs[k] != null ? progs[k] : prog, k, { hl: hl === k, t, hlA, down: opt.down });
    cx += w + gap;
  }
  return { dy, right: cx - gap };
}
module.exports = { val, track, tracks, zoneAt, DEF };
