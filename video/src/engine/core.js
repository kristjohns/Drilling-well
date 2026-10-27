// Core constants, colours, easing, math and drawing primitives shared by all scenes.
'use strict';

const W = 1920, H = 1080, FPS = 30;

// Frame layout. The stage is where scene art is drawn; the panel holds the term card.
const LAYOUT = {
  top: { h: 84 },
  stage: { x: 40, y: 100, w: 1196, h: 940 },
  stageFull: { x: 40, y: 100, w: 1840, h: 940 },
  panel: { x: 1264, y: 100, w: 616, h: 940 },
};

const C = {
  bg: '#07111c',
  bg2: '#0b1a29',
  stage: '#0a1825',
  panel: '#0e2030',
  panelEdge: '#1d3a52',
  text: '#eaf1f8',
  dim: '#a3b6c9',
  faint: '#5f7790',
  line: '#24435d',
  amber: '#ffb224',
  amberDim: '#a8741a',
  cyan: '#3cc8f2',
  green: '#3ddc84',
  red: '#ff5252',
  blue: '#3d8bfd',
  purple: '#b18cff',
  pink: '#ff7eb6',
  white: '#ffffff',
  steel: '#b4c2cf',
  steelMid: '#8496a7',
  steelDark: '#56687a',
  yellow: '#ffd23f',
  orange: '#ff8a2a',
  mud: '#a8733f',
  mudDark: '#7a5129',
  mudLight: '#c99662',
  cement: '#9aa1a8',
  seaTop: '#0f557f',
  seaBot: '#062337',
  skyTop: '#0b1f33',
  skyBot: '#1a4568',
  gas: '#ff6464',
  oil: '#46c35a',
  water: '#4a94e0',
  sand: '#d2ad62',
  sandDark: '#a9893f',
  shale: '#6d6a66',
  shaleDark: '#55524e',
  clay: '#8c7c66',
  chalk: '#d6d0bd',
  lime: '#b8b09a',
  salt: '#d8d2ea',
  source: '#3b3430',
  rock1: '#5b4d3e', rock2: '#6a5a47', rock3: '#77654f', rock4: '#4e4235', rock5: '#83705a',
};

const FONT = 'Inter';
const MONO = 'JetBrains Mono';

// ---------- math ----------
const clamp = (x, a = 0, b = 1) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, t) => a + (b - a) * t;
const invLerp = (a, b, x) => clamp((x - a) / (b - a));
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };
const ease = {
  linear: (t) => clamp(t),
  inOut: (t) => { t = clamp(t); return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; },
  out: (t) => { t = clamp(t); return 1 - Math.pow(1 - t, 3); },
  in: (t) => { t = clamp(t); return t * t * t; },
  outBack: (t) => { t = clamp(t); const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
  outElastic: (t) => { t = clamp(t); if (t === 0 || t === 1) return t; return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI / 3)) + 1; },
};
// pulse 0..1 with period p seconds
const pulse = (t, p = 1.2) => 0.5 - 0.5 * Math.cos((t / p) * Math.PI * 2);
// deterministic pseudo random
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; };
}

// ---------- colour ----------
function hexToRgb(h) {
  h = h.replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgba(hex, a = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function mix(h1, h2, t) {
  const a = hexToRgb(h1), b = hexToRgb(h2);
  const c = a.map((v, i) => Math.round(lerp(v, b[i], clamp(t))));
  return '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
}
const lighten = (h, t) => mix(h, '#ffffff', t);
const darken = (h, t) => mix(h, '#000000', t);

// ---------- paths ----------
function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, Math.abs(w) / 2, Math.abs(h) / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
function fillRR(ctx, x, y, w, h, r, fill, stroke, lw = 2) {
  rr(ctx, x, y, w, h, r);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
function poly(ctx, pts, close = true) {
  ctx.beginPath();
  pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
  if (close) ctx.closePath();
}
function line(ctx, x1, y1, x2, y2, color, lw = 2, dash) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x1, y1); ctx.lineTo(x2, y2);
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}
function circle(ctx, x, y, r, fill, stroke, lw = 2) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
}
// partial polyline drawing (t: 0..1 of total length)
function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}
function pointAt(pts, d) {
  // point at distance d along polyline, returns [x,y,angle]
  for (let i = 1; i < pts.length; i++) {
    const [x1, y1] = pts[i - 1], [x2, y2] = pts[i];
    const seg = Math.hypot(x2 - x1, y2 - y1);
    if (d <= seg || i === pts.length - 1) {
      const t = seg ? clamp(d / seg) : 0;
      return [lerp(x1, x2, t), lerp(y1, y2, t), Math.atan2(y2 - y1, x2 - x1)];
    }
    d -= seg;
  }
  const p = pts[pts.length - 1];
  return [p[0], p[1], 0];
}
function partialPolyline(ctx, pts, t, color, lw = 3, dash) {
  t = clamp(t);
  if (t <= 0) return;
  const L = polylineLength(pts) * t;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  let acc = 0;
  for (let i = 1; i < pts.length; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    if (acc + seg >= L) {
      const f = seg ? (L - acc) / seg : 0;
      ctx.lineTo(lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f));
      break;
    }
    ctx.lineTo(pts[i][0], pts[i][1]);
    acc += seg;
  }
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.stroke();
  ctx.restore();
}
// particles moving along a polyline (flow visualisation)
function flow(ctx, pts, t, opt = {}) {
  const { spacing = 26, speed = 90, color = C.cyan, r = 4, alpha = 1, glow = 0, shape = 'dot' } = opt;
  const L = polylineLength(pts);
  if (L <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  if (glow) { ctx.shadowColor = color; ctx.shadowBlur = glow; }
  ctx.fillStyle = color;
  const off = (t * speed) % spacing;
  for (let d = off; d < L; d += spacing) {
    const [x, y, a] = pointAt(pts, d);
    if (shape === 'dot') { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); }
    else if (shape === 'chevron') {
      ctx.save(); ctx.translate(x, y); ctx.rotate(a);
      ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(r, 0); ctx.lineTo(-r, r);
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(2, r * 0.6); ctx.stroke(); ctx.restore();
    }
  }
  ctx.restore();
}
function arrow(ctx, x1, y1, x2, y2, opt = {}) {
  const { color = C.amber, lw = 4, head = 16, dash, alpha = 1, t = 1 } = opt;
  if (t <= 0) return;
  const xe = lerp(x1, x2, clamp(t)), ye = lerp(y1, y2, clamp(t));
  const a = Math.atan2(y2 - y1, x2 - x1);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(xe - Math.cos(a) * head * 0.6, ye - Math.sin(a) * head * 0.6); ctx.stroke();
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(xe, ye);
  ctx.lineTo(xe - Math.cos(a - 0.45) * head, ye - Math.sin(a - 0.45) * head);
  ctx.lineTo(xe - Math.cos(a + 0.45) * head, ye - Math.sin(a + 0.45) * head);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function curvedArrow(ctx, pts, opt = {}) {
  // arrow along polyline with head at the end; supports partial t
  const { color = C.amber, lw = 4, head = 16, t = 1, alpha = 1, dash } = opt;
  if (t <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  partialPolyline(ctx, pts, t, color, lw, dash);
  const L = polylineLength(pts) * clamp(t);
  const [x, y, a] = pointAt(pts, L);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(a) * head * 0.3, y + Math.sin(a) * head * 0.3);
  ctx.lineTo(x - Math.cos(a - 0.45) * head, y - Math.sin(a - 0.45) * head);
  ctx.lineTo(x - Math.cos(a + 0.45) * head, y - Math.sin(a + 0.45) * head);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
function dimLine(ctx, x1, y1, x2, y2, text, opt = {}) {
  // engineering dimension line with arrows at both ends and a label
  const { color = C.cyan, lw = 2, size = 22, alpha = 1, side = 'right', bg = null } = opt;
  ctx.save();
  ctx.globalAlpha *= alpha;
  arrow(ctx, (x1 + x2) / 2, (y1 + y2) / 2, x1, y1, { color, lw, head: 12 });
  arrow(ctx, (x1 + x2) / 2, (y1 + y2) / 2, x2, y2, { color, lw, head: 12 });
  if (text) {
    ctx.font = `600 ${size}px ${FONT}`;
    const tw = ctx.measureText(text).width;
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    let tx = mx, ty = my;
    const vertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);
    if (vertical) tx = side === 'right' ? mx + 12 : mx - 12 - tw;
    else { ty = my - 14; tx = mx - tw / 2; }
    if (bg) fillRR(ctx, tx - 6, ty - size * 0.8, tw + 12, size * 1.3, 6, bg);
    ctx.fillStyle = color; ctx.textBaseline = 'middle';
    ctx.fillText(text, tx, vertical ? my : ty);
  }
  ctx.restore();
}

// ---------- text ----------
function font(size, weight = 400, fam = FONT) { return `${weight} ${size}px ${fam}`; }
function text(ctx, s, x, y, opt = {}) {
  const { size = 24, color = C.text, align = 'left', base = 'alphabetic', fam = FONT, alpha = 1, maxW, spacing = 0, shadow } = opt;
  let { weight = 400 } = opt;
  if (fam === MONO && weight > 800) weight = 800;
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.font = font(size, weight, fam);
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  if (shadow) { ctx.shadowColor = shadow; ctx.shadowBlur = 8; }
  if (spacing) {
    // manual letter spacing
    const chars = [...s];
    let total = chars.reduce((w, ch) => w + ctx.measureText(ch).width + spacing, -spacing);
    let cx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x;
    ctx.textAlign = 'left';
    for (const ch of chars) { ctx.fillText(ch, cx, y); cx += ctx.measureText(ch).width + spacing; }
  } else if (maxW) ctx.fillText(s, x, y, maxW);
  else ctx.fillText(s, x, y);
  ctx.restore();
}
function measure(ctx, s, size = 24, weight = 400, fam = FONT) {
  ctx.save(); ctx.font = font(size, weight, fam); const w = ctx.measureText(s).width; ctx.restore(); return w;
}
// word wrap; returns array of lines
function wrap(ctx, s, maxW, size = 24, weight = 400, fam = FONT) {
  ctx.save(); ctx.font = font(size, weight, fam);
  const out = [];
  for (const para of String(s).split('\n')) {
    const words = para.split(/\s+/).filter(Boolean);
    let cur = '';
    for (const w of words) {
      const test = cur ? cur + ' ' + w : w;
      if (ctx.measureText(test).width > maxW && cur) { out.push(cur); cur = w; }
      else cur = test;
    }
    out.push(cur);
  }
  ctx.restore();
  return out;
}
function para(ctx, s, x, y, maxW, opt = {}) {
  const { size = 24, weight = 400, color = C.text, lh = 1.35, align = 'left', fam = FONT, alpha = 1, maxLines } = opt;
  let lines = wrap(ctx, s, maxW, size, weight, fam);
  if (maxLines && lines.length > maxLines) lines = lines.slice(0, maxLines);
  lines.forEach((l, i) => text(ctx, l, x, y + i * size * lh, { size, weight, color, align, fam, alpha }));
  return lines.length * size * lh;
}
// rich text with **bold** / ==highlight== spans on a single line; returns width
function richLine(ctx, s, x, y, opt = {}) {
  const { size = 24, color = C.text, hl = C.amber, weight = 400, boldWeight = 700, alpha = 1 } = opt;
  const parts = s.split(/(\*\*[^*]+\*\*|==[^=]+==)/).filter(Boolean);
  let cx = x;
  ctx.save(); ctx.globalAlpha *= alpha;
  for (const p of parts) {
    let w = weight, col = color, str = p;
    if (p.startsWith('**')) { str = p.slice(2, -2); w = boldWeight; }
    else if (p.startsWith('==')) { str = p.slice(2, -2); w = boldWeight; col = hl; }
    ctx.font = font(size, w); ctx.fillStyle = col; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
    ctx.fillText(str, cx, y);
    cx += ctx.measureText(str).width;
  }
  ctx.restore();
  return cx - x;
}

// ---------- labels / callouts ----------
// Callout from a target point (x,y) to a text label at (lx,ly).
function callout(ctx, x, y, lx, ly, s, opt = {}) {
  const { color = C.amber, size = 24, weight = 600, alpha = 1, t = 1, dot = true, bg = 'rgba(7,17,28,0.82)', textColor = C.text, align, sub, subSize } = opt;
  if (alpha <= 0 || t <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha;
  const p = ease.out(t);
  const ex = lerp(x, lx, p), ey = lerp(y, ly, p);
  ctx.strokeStyle = color; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  if (dot) { circle(ctx, x, y, 6, color); circle(ctx, x, y, 11, null, rgba(color, 0.5), 2); }
  if (p > 0.6) {
    const ta = invLerp(0.6, 1, p);
    ctx.globalAlpha *= ta;
    ctx.font = font(size, weight);
    const tw = ctx.measureText(s).width;
    let sw = 0; const ss = subSize || Math.round(size * 0.72);
    if (sub) { ctx.font = font(ss, 400); sw = ctx.measureText(sub).width; }
    const bw = Math.max(tw, sw) + 22, bh = size * 1.45 + (sub ? ss * 1.3 : 0);
    const al = align || (lx >= x ? 'left' : 'right');
    let bx = al === 'left' ? lx : al === 'right' ? lx - bw : lx - bw / 2;
    const maxX = opt.maxX || 1186, minX = opt.minX || 10;
    if (bx + bw > maxX) bx = maxX - bw;
    if (bx < minX) bx = minX;
    const by = ly - bh / 2;
    fillRR(ctx, bx, by, bw, bh, 8, bg, rgba(color, 0.9), 2);
    ctx.font = font(size, weight); ctx.fillStyle = textColor; ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
    ctx.fillText(s, bx + 11, by + size * 0.75);
    if (sub) { ctx.font = font(ss, 400); ctx.fillStyle = C.dim; ctx.fillText(sub, bx + 11, by + size * 1.45 + ss * 0.45); }
  }
  ctx.restore();
}
// simple pill tag at x,y (centered)
function tag(ctx, s, x, y, opt = {}) {
  const { color = C.amber, size = 22, weight = 700, fill = null, textColor, alpha = 1, fam = FONT, pad = 12, align = 'center' } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.font = font(size, weight, fam);
  const w = ctx.measureText(s).width + pad * 2, h = size * 1.5;
  const bx = align === 'center' ? x - w / 2 : align === 'left' ? x : x - w;
  fillRR(ctx, bx, y - h / 2, w, h, h / 2, fill || rgba(color, 0.16), color, 2);
  ctx.fillStyle = textColor || color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(s, bx + pad, y + 1);
  ctx.restore();
  return w;
}
// glowing highlight ring around a rect
function highlightRect(ctx, x, y, w, h, t, opt = {}) {
  const { color = C.amber, r = 10, lw = 3, alpha = 1 } = opt;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha * (0.65 + 0.35 * pulse(t, 1.4));
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  rr(ctx, x, y, w, h, r);
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.stroke();
  ctx.restore();
}
function highlightCircle(ctx, x, y, r, t, opt = {}) {
  const { color = C.amber, lw = 3, alpha = 1 } = opt;
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha *= alpha * (0.65 + 0.35 * pulse(t, 1.4));
  ctx.shadowColor = color; ctx.shadowBlur = 18;
  circle(ctx, x, y, r, null, color, lw);
  ctx.restore();
}
function fmtNum(v, d = 0) {
  const s = Math.abs(v).toFixed(d);
  const [i, f] = s.split('.');
  return (v < 0 ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? '.' + f : '');
}
// pressure gauge dial
function gauge(ctx, x, y, r, value, opt = {}) {
  const { min = 0, max = 100, label = '', unit = '', color = C.amber, alpha = 1, decimals = 0, warn } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  circle(ctx, x, y, r + 6, '#0d1b28', C.steelDark, 3);
  circle(ctx, x, y, r, '#13283a');
  const a0 = Math.PI * 0.75, a1 = Math.PI * 2.25;
  ctx.lineWidth = 3; ctx.strokeStyle = C.faint;
  ctx.beginPath(); ctx.arc(x, y, r - 8, a0, a1); ctx.stroke();
  if (warn != null) {
    ctx.strokeStyle = C.red; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.arc(x, y, r - 8, lerp(a0, a1, invLerp(min, max, warn)), a1); ctx.stroke();
  }
  for (let i = 0; i <= 10; i++) {
    const a = lerp(a0, a1, i / 10);
    line(ctx, x + Math.cos(a) * (r - 14), y + Math.sin(a) * (r - 14), x + Math.cos(a) * (r - 4), y + Math.sin(a) * (r - 4), C.dim, i % 5 ? 1.5 : 3);
  }
  const a = lerp(a0, a1, invLerp(min, max, value));
  ctx.strokeStyle = color; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * (r - 12), y + Math.sin(a) * (r - 12)); ctx.stroke();
  circle(ctx, x, y, 6, color);
  text(ctx, fmtNum(value, decimals) + (unit ? ' ' + unit : ''), x, y + r * 0.55, { size: Math.max(14, r * 0.26), weight: 700, align: 'center', color: C.text });
  if (label) text(ctx, label, x, y + r + 34, { size: Math.max(16, r * 0.26), weight: 700, align: 'center', color: color });
  ctx.restore();
}
// level indicator (tank) - value 0..1
function tank(ctx, x, y, w, h, level, opt = {}) {
  const { color = C.mud, label = '', alpha = 1, edge = C.steelMid } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  fillRR(ctx, x, y, w, h, 6, '#0f2232', edge, 3);
  const lh = (h - 6) * clamp(level);
  ctx.save(); rr(ctx, x + 3, y + 3, w - 6, h - 6, 4); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(x + 3, y + h - 3 - lh, w - 6, lh);
  ctx.fillStyle = rgba('#ffffff', 0.12); ctx.fillRect(x + 3, y + h - 3 - lh, w - 6, 3);
  ctx.restore();
  if (label) text(ctx, label, x + w / 2, y + h + 28, { size: 20, weight: 600, align: 'center', color: C.dim });
  ctx.restore();
}
// Norwegian flag (small)
function flagNO(ctx, x, y, w = 36) {
  const h = w * 16 / 22;
  ctx.save();
  ctx.fillStyle = '#ba0c2f'; ctx.fillRect(x, y, w, h);
  const u = w / 22;
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x + 6 * u, y, 4 * u, h); ctx.fillRect(x, y + 6 * u, w, 4 * u);
  ctx.fillStyle = '#00205b'; ctx.fillRect(x + 7 * u, y, 2 * u, h); ctx.fillRect(x, y + 7 * u, w, 2 * u);
  ctx.restore();
}

// hatch fill inside current path (call after defining path & clip)
function hatch(ctx, x, y, w, h, gap = 10, color = 'rgba(255,255,255,0.12)', lw = 1.5, angle = 1) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  ctx.beginPath();
  for (let i = -h; i < w + h; i += gap) {
    ctx.moveTo(x + i, y); ctx.lineTo(x + i + h * angle, y + h);
  }
  ctx.stroke();
  ctx.restore();
}
// speckle texture (deterministic) inside rect
function speckle(ctx, x, y, w, h, n, color, seed = 7, rmax = 2.2) {
  const R = rng(seed);
  ctx.save(); ctx.fillStyle = color;
  for (let i = 0; i < n; i++) {
    const px = x + R() * w, py = y + R() * h, r = 0.6 + R() * rmax;
    ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
// rock texture fill for lithologies
function lithoFill(ctx, kind, x, y, w, h, seed = 3) {
  const R = rng(seed);
  ctx.save();
  ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
  const base = { sand: C.sand, shale: C.shale, clay: C.clay, chalk: C.chalk, lime: C.lime, salt: C.salt, source: C.source, rock1: C.rock1, rock2: C.rock2, rock3: C.rock3, rock4: C.rock4, rock5: C.rock5 }[kind] || kind;
  ctx.fillStyle = base; ctx.fillRect(x, y, w, h);
  if (kind === 'sand') {
    ctx.fillStyle = rgba('#5a4520', 0.35);
    for (let i = 0; i < (w * h) / 140; i++) { ctx.beginPath(); ctx.arc(x + R() * w, y + R() * h, 1.2 + R() * 1.2, 0, 7); ctx.fill(); }
  } else if (kind === 'shale' || kind === 'source' || kind === 'clay') {
    ctx.strokeStyle = rgba('#000000', 0.22); ctx.lineWidth = 1.5;
    for (let yy = y + 6; yy < y + h; yy += 9) {
      ctx.beginPath();
      for (let xx = x; xx < x + w; xx += 28 + R() * 30) { ctx.moveTo(xx, yy + R() * 2); ctx.lineTo(xx + 14 + R() * 16, yy + R() * 2); }
      ctx.stroke();
    }
  } else if (kind === 'chalk' || kind === 'lime') {
    ctx.strokeStyle = rgba('#000000', 0.18); ctx.lineWidth = 1.5;
    let row = 0;
    for (let yy = y; yy < y + h; yy += 16, row++) {
      ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); ctx.stroke();
      for (let xx = x + (row % 2) * 20; xx < x + w; xx += 40) { ctx.beginPath(); ctx.moveTo(xx, yy); ctx.lineTo(xx, yy + 16); ctx.stroke(); }
    }
  } else if (kind === 'salt') {
    ctx.strokeStyle = rgba('#6b5f8a', 0.35); ctx.lineWidth = 1.2;
    for (let i = 0; i < (w * h) / 900; i++) { const px = x + R() * w, py = y + R() * h; ctx.strokeRect(px, py, 8, 8); }
  } else {
    ctx.fillStyle = rgba('#000000', 0.12);
    for (let i = 0; i < (w * h) / 300; i++) { ctx.beginPath(); ctx.arc(x + R() * w, y + R() * h, 1 + R() * 1.6, 0, 7); ctx.fill(); }
  }
  ctx.restore();
}

module.exports = {
  W, H, FPS, LAYOUT, C, FONT, MONO,
  clamp, lerp, invLerp, smooth, ease, pulse, rng,
  hexToRgb, rgba, mix, lighten, darken,
  rr, fillRR, poly, line, circle, polylineLength, pointAt, partialPolyline, flow, arrow, curvedArrow, dimLine,
  fmtNum, font, text, measure, wrap, para, richLine, callout, tag, highlightRect, highlightCircle, gauge, tank, flagNO,
  hatch, speckle, lithoFill,
};
