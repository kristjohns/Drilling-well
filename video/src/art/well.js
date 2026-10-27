// Parametric wellbore cross-section (casings, cement, mud, string, BOP) and a PP/FG chart.
'use strict';
const K = require('../engine/core');
const R = require('./rig');
const SS = require('./subsea');
const { C, rgba, fillRR, rr, circle, line, poly, text, lerp, clamp, darken, lighten } = K;

const STEEL = '#b8c4cf';

// W = { cx, seaTop, seabed, td, layers:[{to, kind}], strings:[{name, hw, holeHw, top, shoe, toc}], hole:{hw, to} }
// st = { t, mud, cement, showCement, hlString, hlA, string:{to, rot}, bop, riser, labels, shoeTri, plugs:[{top,bot}], fluid fills ... }
function drawWell(ctx, W, st = {}) {
  const t = st.t || 0;
  const mud = st.mud || '#6a4628';
  const cementCol = st.cement || '#9aa1a8';
  const A = { shoes: [] };
  // formation
  let y0 = W.seabed;
  for (const L of W.layers) {
    K.lithoFill(ctx, L.kind, W.x0 || 0, y0, W.w || 1196, L.to - y0, 3 + Math.round(L.to));
    y0 = L.to;
  }
  // sea above seabed
  if (W.seaTop != null) {
    if (W.sky !== false) R.sky(ctx, W.w || 1196, W.seaTop, { top: '#0a1825', bot: '#173c5c' });
    R.sea(ctx, W.w || 1196, W.seaTop, W.seabed, t, { amp: 3 });
    line(ctx, 0, W.seabed, W.w || 1196, W.seabed, '#8a7457', 3);
  }
  const strings = W.strings || [];
  // hole profile
  const sections = [];
  let top = W.seabed;
  strings.forEach((s) => { sections.push({ from: top, to: s.shoe + (s.rathole || 6), hw: s.holeHw || s.hw + 12 }); top = s.shoe; });
  if (W.hole && W.hole.to > top) sections.push({ from: top, to: W.hole.to, hw: W.hole.hw });
  for (const sec of sections) { ctx.fillStyle = st.holeFill || mud; ctx.fillRect(W.cx - sec.hw, sec.from, sec.hw * 2, sec.to - sec.from); }
  A.sections = sections;
  // cement between casing and outer boundary
  strings.forEach((s, i) => {
    if (st.showCement === false || s.toc == null || s.toc >= s.shoe) return;
    const prev = strings[i - 1];
    const holeHw = s.holeHw || s.hw + 12;
    for (let y = s.toc; y < s.shoe; y += 4) {
      const outer = prev && y < prev.shoe ? prev.hw - 5 : holeHw;
      ctx.fillStyle = cementCol;
      ctx.fillRect(W.cx - outer, y, outer - s.hw, 4.5);
      ctx.fillRect(W.cx + s.hw, y, outer - s.hw, 4.5);
    }
    K.speckle(ctx, W.cx - holeHw, s.toc, holeHw - s.hw, s.shoe - s.toc, Math.floor((s.shoe - s.toc) / 3), rgba('#000', 0.18), 7 + i, 1.2);
    K.speckle(ctx, W.cx + s.hw, s.toc, holeHw - s.hw, s.shoe - s.toc, Math.floor((s.shoe - s.toc) / 3), rgba('#000', 0.18), 9 + i, 1.2);
  });
  // casing walls
  strings.forEach((s, i) => {
    const col = st.hlString === i ? K.mix(STEEL, C.amber, 0.5 + 0.5 * K.pulse(t)) : STEEL;
    const g = (x) => { const gr = ctx.createLinearGradient(x, 0, x + 6, 0); gr.addColorStop(0, darken(col, 0.25)); gr.addColorStop(0.5, lighten(col, 0.2)); gr.addColorStop(1, darken(col, 0.3)); return gr; };
    ctx.fillStyle = g(W.cx - s.hw - 5); ctx.fillRect(W.cx - s.hw - 5, s.top, 6, s.shoe - s.top);
    ctx.fillStyle = g(W.cx + s.hw - 1); ctx.fillRect(W.cx + s.hw - 1, s.top, 6, s.shoe - s.top);
    // shoe
    poly(ctx, [[W.cx - s.hw - 6, s.shoe], [W.cx - s.hw + 3, s.shoe], [W.cx - s.hw - 6, s.shoe - 10]]); ctx.fillStyle = darken(col, 0.3); ctx.fill();
    poly(ctx, [[W.cx + s.hw + 6, s.shoe], [W.cx + s.hw - 3, s.shoe], [W.cx + s.hw + 6, s.shoe - 10]]); ctx.fill();
    A.shoes.push([W.cx + s.hw + 6, s.shoe]);
    if (st.hlString === i && st.hlA > 0) K.highlightRect(ctx, W.cx - s.hw - 12, s.top - 6, s.hw * 2 + 24, s.shoe - s.top + 12, t, { alpha: st.hlA });
  });
  // plugs (cement plugs inside casing/hole)
  for (const p of st.plugs || []) {
    const hw = p.hw || innerHw(W, (p.top + p.bot) / 2);
    ctx.fillStyle = p.color || cementCol; ctx.fillRect(W.cx - hw, p.top, hw * 2, p.bot - p.top);
    K.speckle(ctx, W.cx - hw, p.top, hw * 2, p.bot - p.top, Math.floor((p.bot - p.top) * hw / 30), rgba('#000', 0.2), 3, 1.3);
  }
  // drill string
  if (st.string) {
    const sx = W.cx, to = st.string.to;
    const g = ctx.createLinearGradient(sx - 6, 0, sx + 6, 0); g.addColorStop(0, '#7d8a96'); g.addColorStop(0.5, '#d0dae3'); g.addColorStop(1, '#6b7885');
    ctx.fillStyle = g; ctx.fillRect(sx - 6, st.string.from != null ? st.string.from : (W.seaTop != null ? 0 : W.seabed), 12, to - 40 - (st.string.from != null ? st.string.from : (W.seaTop != null ? 0 : W.seabed)));
    // BHA
    ctx.fillStyle = '#97a8b8'; ctx.fillRect(sx - 10, to - 60, 20, 44);
    poly(ctx, [[sx - 14, to - 16], [sx + 14, to - 16], [sx + 9, to], [sx - 9, to]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
    A.bit = [sx, to];
  }
  // BOP + riser
  if (st.bop) {
    const top = SS.bopSimple(ctx, W.cx, W.seabed - 2, st.bopScale || 0.42, { riser: false, hl: st.bopHl || 0, t });
    A.bopTop = top;
    if (st.riser !== false && W.seaTop != null) { ctx.fillStyle = '#8796a5'; ctx.fillRect(W.cx - 7, W.seaTop - 30, 14, top - W.seaTop + 30); }
  }
  return A;
}
// inner half-width (inside innermost casing or open hole) at depth y
function innerHw(W, y) {
  let hw = W.hole ? W.hole.hw : 30;
  for (const s of W.strings || []) if (y <= s.shoe && y >= s.top) hw = Math.min(hw, s.hw - 1);
  if (W.hole && y > Math.max(...(W.strings || []).map((s) => s.shoe))) hw = W.hole.hw;
  return hw;
}

// ---------- PP/FG chart ----------
// curves in SG vs TVD (m): functions d -> sg
const PPFG = {
  hydro: () => 1.03,
  pore: (d) => (d < 1800 ? 1.03 : d < 2600 ? 1.03 + (d - 1800) / 800 * 0.42 : 1.45 + (d - 2600) / 1400 * 0.10),
  frac: (d) => 1.20 + 0.56 * (1 - Math.exp(-d / 1500)) + (d > 1800 ? (d - 1800) / 2200 * 0.12 : 0),
  ob: (d) => 1.45 + 0.75 * (1 - Math.exp(-d / 1800)),
};
function chart(ctx, x, y, w, h, opt = {}) {
  const { sgMin = 0.9, sgMax = 2.3, dMax = 4000, t = 0, grid = true, alpha = 1 } = opt;
  const X = (sg) => x + ((sg - sgMin) / (sgMax - sgMin)) * w;
  const Y = (d) => y + (d / dMax) * h;
  ctx.save(); ctx.globalAlpha *= alpha;
  fillRR(ctx, x - 70, y - 60, w + 100, h + 110, 14, 'rgba(7,17,28,0.75)', C.panelEdge, 2);
  if (grid) {
    for (let sg = Math.ceil(sgMin * 10) / 10; sg <= sgMax + 1e-6; sg += 0.1) {
      const major = Math.abs(sg * 10 - Math.round(sg * 10)) < 1e-6 && Math.round(sg * 10) % 2 === 0;
      line(ctx, X(sg), y, X(sg), y + h, rgba('#ffffff', major ? 0.12 : 0.05), 1);
      if (major) text(ctx, sg.toFixed(1), X(sg), y - 12, { size: 15, weight: 700, align: 'center', color: C.dim, fam: K.MONO });
    }
    for (let d = 0; d <= dMax; d += 500) {
      line(ctx, x, Y(d), x + w, Y(d), rgba('#ffffff', 0.06), 1);
      text(ctx, String(d), x - 10, Y(d) + 5, { size: 14, weight: 600, align: 'right', color: C.dim, fam: K.MONO });
    }
  }
  text(ctx, 'pressure gradient (SG EMW) →', x + w / 2, y - 36, { size: 16, weight: 800, align: 'center', color: C.dim });
  ctx.save(); ctx.translate(x - 56, y + h / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'depth (m TVD) ↓', 0, 0, { size: 16, weight: 800, align: 'center', color: C.dim }); ctx.restore();
  ctx.restore();
  return { X, Y };
}
function curve(ctx, ax, fn, dMax, prog, color, lw = 4, dash) {
  if (prog <= 0) return;
  const pts = [];
  for (let d = 0; d <= dMax * prog; d += 25) pts.push([ax.X(fn(d)), ax.Y(d)]);
  K.partialPolyline(ctx, pts, 1, color, lw, dash);
  return pts;
}

module.exports = { drawWell, innerHw, PPFG, chart, curve };
