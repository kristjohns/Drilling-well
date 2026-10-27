// Reusable on-stage widgets: bullet boxes, text cards, line charts, step lists.
'use strict';
const K = require('../engine/core');
const { C, rgba, text, fillRR, circle, line, clamp } = K;

// bullet box; items wrap; rv = number of items revealed (fractional fades in). Returns height.
function infoBox(ctx, x, y, w, title, items, a = 1, opt = {}) {
  const { color = C.amber, rv = 99, size = 21 } = opt;
  if (a <= 0) return 0;
  ctx.save(); ctx.globalAlpha *= a;
  const lh = Math.round(size * 1.33);
  const wrapped = items.map((s) => K.wrap(ctx, s, w - 62, size, 500));
  const h = 66 + wrapped.reduce((n, l) => n + l.length * lh + 14, 0);
  fillRR(ctx, x, y, w, h, 14, 'rgba(7,17,28,0.92)', color, 2);
  text(ctx, title, x + 22, y + 40, { size: 19, weight: 900, color, spacing: 1.5 });
  let yy = y + 78;
  wrapped.forEach((ls, i) => {
    const ia = clamp(rv - i);
    if (ia > 0) {
      circle(ctx, x + 30, yy - size * 0.33, 4.5, rgba(color, ia));
      ls.forEach((l, j) => text(ctx, l, x + 46, yy + j * lh, { size, weight: 500, color: C.text, alpha: ia }));
    }
    yy += ls.length * lh + 14;
  });
  ctx.restore();
  return h;
}
// titled text card with a wrapped body
function card(ctx, x, y, w, h, title, body, a = 1, color = C.amber, opt = {}) {
  if (a <= 0) return;
  const { size = 20 } = opt;
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, x, y, w, h, 14, 'rgba(7,17,28,0.94)', color, 2);
  text(ctx, title, x + 20, y + 36, { size: 21, weight: 900, color, spacing: 1 });
  K.para(ctx, body, x + 20, y + 70, w - 40, { size, color: C.text, lh: 1.32 });
  ctx.restore();
}
// line chart; series: [{ fn(u)->value, color, lw, dash, label }], u in 0..1; prog 0..1 draws left to right
function lineChart(ctx, x, y, w, h, series, prog, opt = {}) {
  const { min = 0, max = 100, title, xlabel, ylabel, grid = 4, bg = 'rgba(7,17,28,0.92)', edge = C.panelEdge, titleColor = C.dim, bands } = opt;
  fillRR(ctx, x, y, w, h, 14, bg, edge, 2);
  const top = title ? 58 : 26;
  const px = x + 64, py = y + top, pw = w - 88, ph = h - top - 46;
  const X = (u) => px + u * pw, Y = (v) => py + ph - ((v - min) / (max - min)) * ph;
  if (title) text(ctx, title, x + 20, y + 38, { size: 19, weight: 900, color: titleColor, spacing: 1.5 });
  if (bands) for (const b of bands) {
    ctx.fillStyle = b.color; ctx.fillRect(X(b.u0), py, X(b.u1) - X(b.u0), ph);
    if (b.label) text(ctx, b.label, (X(b.u0) + X(b.u1)) / 2, py + 22, { size: 15, weight: 800, align: 'center', color: b.textColor || C.dim });
  }
  for (let i = 0; i <= grid; i++) {
    const v = min + (max - min) * i / grid;
    line(ctx, px, Y(v), px + pw, Y(v), rgba('#ffffff', 0.07), 1);
    if (opt.yTicks !== false) text(ctx, K.fmtNum(v, opt.decimals || 0), px - 10, Y(v) + 5, { size: 14, weight: 600, align: 'right', color: C.dim, fam: K.MONO });
  }
  line(ctx, px, py + ph, px + pw, py + ph, C.dim, 2);
  line(ctx, px, py, px, py + ph, C.dim, 2);
  if (xlabel) text(ctx, xlabel, px + pw, py + ph + 32, { size: 16, weight: 700, align: 'right', color: C.dim });
  if (ylabel) text(ctx, ylabel, px + 10, py + 20, { size: 15, weight: 700, color: C.dim });
  const ends = [];
  for (const s of series) {
    const n = s.n || 240;
    const pts = [];
    for (let i = 0; i <= n * clamp(prog); i++) { const u = i / n; pts.push([X(u), Y(s.fn(u))]); }
    if (pts.length > 1) K.partialPolyline(ctx, pts, 1, s.color, s.lw || 4, s.dash);
    ends.push(pts[pts.length - 1]);
    if (s.label && pts.length > 1) text(ctx, s.label, X(s.labelU != null ? s.labelU : 0.02), Y(s.labelV != null ? s.labelV : s.fn(0)) - 10, { size: 16, weight: 800, color: s.color });
  }
  return { X, Y, px, py, pw, ph, ends };
}
// numbered list with checkmarks; prog = number of completed steps (fractional = active)
function steps(ctx, x, y, items, prog, opt = {}) {
  const { gap = 58, size = 21, color = C.amber, w = 420 } = opt;
  items.forEach((s, i) => {
    const yy = y + i * gap;
    const done = prog >= i + 1, act = prog > i && !done;
    if (done) { circle(ctx, x + 14, yy - 7, 14, rgba(C.green, 0.2), C.green, 2); require('./icons').check(ctx, x + 14, yy - 7, 16, C.green); }
    else { circle(ctx, x + 14, yy - 7, 14, act ? rgba(color, 0.25) : null, act ? color : C.faint, 2); text(ctx, String(i + 1), x + 14, yy, { size: 16, weight: 800, align: 'center', color: act ? color : C.faint }); }
    K.para(ctx, s, x + 40, yy, w - 40, { size, weight: done || act ? 700 : 500, color: done ? C.text : act ? color : C.faint });
  });
}
// a dark rounded panel with a title strip
function panel(ctx, x, y, w, h, title, color = C.dim) {
  fillRR(ctx, x, y, w, h, 14, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
  if (title) text(ctx, title, x + w / 2, y + 34, { size: 18, weight: 900, align: 'center', color, spacing: 1.5 });
}

module.exports = { infoBox, card, lineChart, steps, panel };
