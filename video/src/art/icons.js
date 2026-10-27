// Small vector icons used across scenes. Each draws centred at (x, y) with nominal size s.
'use strict';
const K = require('../engine/core');
const { C, rgba, fillRR, rr, circle, line, poly, text, lighten, darken } = K;

function doc(ctx, x, y, s, o = {}) {
  const { color = '#e8eef5', accent = C.amber, title } = o;
  const w = s * 0.78, h = s;
  ctx.save();
  ctx.translate(x - w / 2, y - h / 2);
  poly(ctx, [[0, 0], [w - s * 0.2, 0], [w, s * 0.2], [w, h], [0, h]]);
  ctx.fillStyle = color; ctx.fill();
  poly(ctx, [[w - s * 0.2, 0], [w - s * 0.2, s * 0.2], [w, s * 0.2]]);
  ctx.fillStyle = darken(color, 0.25); ctx.fill();
  ctx.fillStyle = accent; ctx.fillRect(s * 0.1, s * 0.12, w * 0.45, s * 0.07);
  ctx.fillStyle = rgba('#000000', 0.25);
  for (let i = 0; i < 5; i++) ctx.fillRect(s * 0.1, s * 0.32 + i * s * 0.12, w * (i === 4 ? 0.5 : 0.78), s * 0.045);
  ctx.restore();
  if (title) text(ctx, title, x, y + h / 2 + s * 0.28, { size: Math.max(14, s * 0.2), weight: 700, align: 'center', color: C.text });
}
function stamp(ctx, x, y, s, label = 'APPROVED', color = C.green, rot = -0.2, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = K.font(s * 0.32, 800);
  const w = ctx.measureText(label).width + s * 0.4;
  rr(ctx, -w / 2, -s * 0.3, w, s * 0.6, s * 0.08);
  ctx.strokeStyle = color; ctx.lineWidth = s * 0.06; ctx.stroke();
  ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(label, 0, s * 0.02);
  ctx.restore();
}
function shield(ctx, x, y, s, color = C.blue, inner) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.bezierCurveTo(s * 0.25, -s * 0.38, s * 0.42, -s * 0.38, s * 0.45, -s * 0.36);
  ctx.bezierCurveTo(s * 0.45, s * 0.1, s * 0.3, s * 0.35, 0, s * 0.52);
  ctx.bezierCurveTo(-s * 0.3, s * 0.35, -s * 0.45, s * 0.1, -s * 0.45, -s * 0.36);
  ctx.bezierCurveTo(-s * 0.42, -s * 0.38, -s * 0.25, -s * 0.38, 0, -s * 0.5);
  ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.strokeStyle = lighten(color, 0.4); ctx.lineWidth = s * 0.04; ctx.stroke();
  if (inner === 'check') {
    ctx.strokeStyle = '#fff'; ctx.lineWidth = s * 0.09; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(-s * 0.18, 0); ctx.lineTo(-s * 0.04, s * 0.14); ctx.lineTo(s * 0.2, -s * 0.14); ctx.stroke();
  } else if (inner === 'helmet') {
    helmet(ctx, 0, s * 0.05, s * 0.5, '#ffffff');
  }
  ctx.restore();
}
function helmet(ctx, x, y, s, color = C.yellow) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath(); ctx.arc(0, s * 0.1, s * 0.42, Math.PI, 0); ctx.closePath();
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = darken(color, 0.2);
  fillRR(ctx, -s * 0.55, s * 0.06, s * 1.1, s * 0.13, s * 0.06, darken(color, 0.15));
  ctx.fillStyle = darken(color, 0.25); ctx.fillRect(-s * 0.05, -s * 0.32, s * 0.1, s * 0.4);
  ctx.restore();
}
function leaf(ctx, x, y, s, color = C.green) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.6);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.quadraticCurveTo(s * 0.45, 0, 0, s * 0.5);
  ctx.quadraticCurveTo(-s * 0.45, 0, 0, -s * 0.5);
  ctx.fillStyle = color; ctx.fill();
  line(ctx, 0, -s * 0.4, 0, s * 0.6, darken(color, 0.4), s * 0.05);
  ctx.restore();
}
function drop(ctx, x, y, s, color = C.water) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.5);
  ctx.bezierCurveTo(s * 0.1, -s * 0.3, s * 0.38, -s * 0.05, s * 0.38, s * 0.18);
  ctx.arc(0, s * 0.18, s * 0.38, 0, Math.PI);
  ctx.bezierCurveTo(-s * 0.38, -s * 0.05, -s * 0.1, -s * 0.3, 0, -s * 0.5);
  ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}
function building(ctx, x, y, s, color = '#cdd8e3') {
  ctx.save(); ctx.translate(x, y);
  poly(ctx, [[-s * 0.55, -s * 0.18], [0, -s * 0.5], [s * 0.55, -s * 0.18]]);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillRect(-s * 0.5, -s * 0.16, s, s * 0.08);
  for (let i = 0; i < 4; i++) ctx.fillRect(-s * 0.42 + i * s * 0.26, -s * 0.06, s * 0.1, s * 0.42);
  ctx.fillRect(-s * 0.55, s * 0.38, s * 1.1, s * 0.12);
  ctx.restore();
}
function barChart(ctx, x, y, s, color = C.cyan) {
  ctx.save(); ctx.translate(x - s / 2, y - s / 2);
  const hs = [0.4, 0.65, 0.5, 0.9];
  hs.forEach((h, i) => { ctx.fillStyle = i === 3 ? C.amber : color; ctx.fillRect(s * 0.08 + i * s * 0.23, s * (1 - h), s * 0.16, s * h); });
  line(ctx, 0, s, s, s, C.dim, s * 0.04);
  ctx.restore();
}
function coin(ctx, x, y, s, label = 'kr') {
  circle(ctx, x, y, s / 2, '#f5c542', '#b8892a', s * 0.07);
  text(ctx, label, x, y + s * 0.13, { size: s * 0.38, weight: 800, align: 'center', color: '#7a5a10' });
}
function person(ctx, x, y, s, o = {}) {
  const { shirt = C.orange, helmetColor = '#ffffff', skin = '#e9c7a3', alpha = 1, label, labelColor = C.text, sub } = o;
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y);
  // body
  ctx.beginPath();
  ctx.moveTo(-s * 0.32, s * 0.5);
  ctx.lineTo(-s * 0.32, s * 0.08);
  ctx.quadraticCurveTo(-s * 0.3, -s * 0.06, -s * 0.12, -s * 0.08);
  ctx.lineTo(s * 0.12, -s * 0.08);
  ctx.quadraticCurveTo(s * 0.3, -s * 0.06, s * 0.32, s * 0.08);
  ctx.lineTo(s * 0.32, s * 0.5);
  ctx.closePath();
  ctx.fillStyle = shirt; ctx.fill();
  // reflective stripes
  ctx.fillStyle = rgba('#ffffff', 0.7);
  ctx.fillRect(-s * 0.32, s * 0.22, s * 0.64, s * 0.05);
  ctx.fillRect(-s * 0.32, s * 0.34, s * 0.64, s * 0.05);
  // head
  circle(ctx, 0, -s * 0.26, s * 0.16, skin);
  helmet(ctx, 0, -s * 0.33, s * 0.42, helmetColor);
  ctx.restore();
  const ls = Math.min(30, Math.max(15, s * 0.2)), ss = Math.min(22, Math.max(13, s * 0.16));
  if (label) text(ctx, label, x, y + s * 0.5 + ls + 8, { size: ls, weight: 700, align: 'center', color: labelColor, alpha });
  if (sub) text(ctx, sub, x, y + s * 0.5 + ls + 8 + ls * 1.15, { size: ss, weight: 500, align: 'center', color: C.dim, alpha });
}
function helicopter(ctx, x, y, s, t = 0, color = '#e8eef5') {
  ctx.save(); ctx.translate(x, y);
  // body
  ctx.beginPath();
  ctx.ellipse(0, 0, s * 0.42, s * 0.2, 0, 0, Math.PI * 2);
  ctx.fillStyle = color; ctx.fill();
  ctx.fillStyle = color;
  poly(ctx, [[s * 0.3, -s * 0.06], [s * 0.95, -s * 0.04], [s * 0.95, s * 0.02], [s * 0.3, s * 0.08]]); ctx.fill();
  poly(ctx, [[s * 0.88, -s * 0.04], [s * 0.98, -s * 0.2], [s * 1.02, -s * 0.2], [s * 0.96, s * 0.02]]); ctx.fill();
  // window
  ctx.beginPath(); ctx.ellipse(-s * 0.22, -s * 0.04, s * 0.14, s * 0.1, 0, 0, Math.PI * 2); ctx.fillStyle = '#5fb7e0'; ctx.fill();
  // stripe
  ctx.fillStyle = C.orange; ctx.fillRect(-s * 0.1, s * 0.02, s * 0.42, s * 0.05);
  // skids
  line(ctx, -s * 0.35, s * 0.3, s * 0.3, s * 0.3, C.steelMid, s * 0.04);
  line(ctx, -s * 0.2, s * 0.18, -s * 0.22, s * 0.3, C.steelMid, s * 0.03);
  line(ctx, s * 0.15, s * 0.18, s * 0.17, s * 0.3, C.steelMid, s * 0.03);
  // rotor
  line(ctx, 0, -s * 0.2, 0, -s * 0.28, C.steelMid, s * 0.05);
  const rl = s * 0.75 * Math.abs(Math.cos(t * 25));
  line(ctx, -rl, -s * 0.28, rl, -s * 0.28, rgba('#cfd8e3', 0.9), s * 0.035);
  ctx.restore();
}
function ship(ctx, x, y, s, o = {}) {
  // offshore supply vessel, bow to the left, sitting on waterline y
  const { color = '#d8452f', deck = '#e8eef5', label } = o;
  ctx.save(); ctx.translate(x, y);
  poly(ctx, [[-s * 0.5, -s * 0.12], [s * 0.5, -s * 0.12], [s * 0.48, s * 0.08], [-s * 0.42, s * 0.08], [-s * 0.56, -s * 0.16]]);
  ctx.fillStyle = color; ctx.fill();
  // bridge at bow
  fillRR(ctx, -s * 0.46, -s * 0.36, s * 0.24, s * 0.24, s * 0.02, deck);
  ctx.fillStyle = '#4aa3d6'; ctx.fillRect(-s * 0.44, -s * 0.32, s * 0.2, s * 0.05);
  // open deck with cargo
  ctx.fillStyle = '#42566a'; ctx.fillRect(-s * 0.2, -s * 0.17, s * 0.66, s * 0.05);
  ctx.fillStyle = C.yellow; ctx.fillRect(-s * 0.1, -s * 0.27, s * 0.14, s * 0.1);
  ctx.fillStyle = C.cyan; ctx.fillRect(s * 0.08, -s * 0.25, s * 0.18, s * 0.08);
  ctx.restore();
  if (label) text(ctx, label, x, y + s * 0.38, { size: Math.max(14, s * 0.15), weight: 700, align: 'center', color: C.text });
}
function lifeboat(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.beginPath();
  ctx.moveTo(-s * 0.5, 0);
  ctx.quadraticCurveTo(-s * 0.5, -s * 0.22, -s * 0.2, -s * 0.24);
  ctx.lineTo(s * 0.3, -s * 0.24);
  ctx.quadraticCurveTo(s * 0.55, -s * 0.2, s * 0.5, 0);
  ctx.quadraticCurveTo(s * 0.4, s * 0.16, 0, s * 0.16);
  ctx.quadraticCurveTo(-s * 0.4, s * 0.16, -s * 0.5, 0);
  ctx.fillStyle = C.orange; ctx.fill();
  fillRR(ctx, -s * 0.05, -s * 0.36, s * 0.22, s * 0.14, s * 0.04, '#ffb46b');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(-s * 0.4, -s * 0.06, s * 0.8, s * 0.04);
  ctx.restore();
}
function book(ctx, x, y, s, color = C.blue, title = '', sub = '') {
  ctx.save(); ctx.translate(x, y);
  fillRR(ctx, -s * 0.36, -s * 0.5, s * 0.72, s, s * 0.04, color);
  ctx.fillStyle = darken(color, 0.3); ctx.fillRect(-s * 0.36, -s * 0.5, s * 0.08, s);
  ctx.fillStyle = '#f2f2f2'; ctx.fillRect(-s * 0.36, s * 0.42, s * 0.72, s * 0.06);
  if (title) text(ctx, title, s * 0.04, -s * 0.12, { size: s * 0.17, weight: 800, align: 'center', color: '#fff' });
  if (sub) text(ctx, sub, s * 0.04, s * 0.1, { size: s * 0.1, weight: 600, align: 'center', color: rgba('#ffffff', 0.85) });
  ctx.restore();
}
function clipboard(ctx, x, y, s, checks = 3, progress = 1) {
  ctx.save(); ctx.translate(x, y);
  fillRR(ctx, -s * 0.38, -s * 0.46, s * 0.76, s * 0.96, s * 0.06, '#9b6a3c');
  fillRR(ctx, -s * 0.32, -s * 0.38, s * 0.64, s * 0.82, s * 0.03, '#f4f1ea');
  fillRR(ctx, -s * 0.14, -s * 0.52, s * 0.28, s * 0.12, s * 0.03, C.steelMid);
  for (let i = 0; i < checks; i++) {
    const yy = -s * 0.22 + i * s * 0.2;
    ctx.strokeStyle = '#7d8a96'; ctx.lineWidth = s * 0.025; ctx.strokeRect(-s * 0.24, yy - s * 0.06, s * 0.1, s * 0.1);
    ctx.fillStyle = rgba('#000000', 0.25); ctx.fillRect(-s * 0.08, yy - s * 0.02, s * 0.32, s * 0.03);
    if (progress * checks > i + 0.5) {
      ctx.strokeStyle = C.green; ctx.lineWidth = s * 0.04; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-s * 0.23, yy - s * 0.01); ctx.lineTo(-s * 0.19, yy + s * 0.03); ctx.lineTo(-s * 0.12, yy - s * 0.07); ctx.stroke();
    }
  }
  ctx.restore();
}
function warn(ctx, x, y, s, color = C.amber) {
  ctx.save(); ctx.translate(x, y);
  poly(ctx, [[0, -s * 0.48], [s * 0.52, s * 0.42], [-s * 0.52, s * 0.42]]);
  ctx.fillStyle = color; ctx.fill();
  ctx.lineJoin = 'round'; ctx.strokeStyle = darken(color, 0.3); ctx.lineWidth = s * 0.04; ctx.stroke();
  text(ctx, '!', 0, s * 0.32, { size: s * 0.6, weight: 900, align: 'center', color: '#1a1206' });
  ctx.restore();
}
function flame(ctx, x, y, s, t = 0) {
  ctx.save(); ctx.translate(x, y);
  const f = 1 + 0.08 * Math.sin(t * 17) + 0.05 * Math.sin(t * 29);
  ctx.scale(1, f);
  const g = ctx.createRadialGradient(0, 0, s * 0.05, 0, -s * 0.1, s * 0.6);
  g.addColorStop(0, '#fff6b0'); g.addColorStop(0.4, '#ffb224'); g.addColorStop(1, 'rgba(255,80,20,0)');
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.6);
  ctx.bezierCurveTo(s * 0.45, -s * 0.1, s * 0.35, s * 0.35, 0, s * 0.4);
  ctx.bezierCurveTo(-s * 0.35, s * 0.35, -s * 0.45, -s * 0.1, 0, -s * 0.6);
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
}
function calendar(ctx, x, y, s, label = '') {
  ctx.save(); ctx.translate(x, y);
  fillRR(ctx, -s * 0.45, -s * 0.4, s * 0.9, s * 0.85, s * 0.06, '#f4f1ea');
  fillRR(ctx, -s * 0.45, -s * 0.4, s * 0.9, s * 0.22, s * 0.06, C.red);
  ctx.fillRect(-s * 0.45, -s * 0.24, s * 0.9, s * 0.06);
  ctx.fillStyle = rgba('#000000', 0.25);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) ctx.fillRect(-s * 0.36 + c * s * 0.15, -s * 0.08 + r * s * 0.15, s * 0.1, s * 0.09);
  if (label) text(ctx, label, 0, -s * 0.24, { size: s * 0.14, weight: 800, align: 'center', color: '#fff' });
  ctx.restore();
}
function clock(ctx, x, y, s, t = 0) {
  circle(ctx, x, y, s * 0.45, '#f4f1ea', C.steelMid, s * 0.06);
  const a1 = t * 0.5 - Math.PI / 2, a2 = t * 6 - Math.PI / 2;
  line(ctx, x, y, x + Math.cos(a1) * s * 0.22, y + Math.sin(a1) * s * 0.22, '#222', s * 0.06);
  line(ctx, x, y, x + Math.cos(a2) * s * 0.34, y + Math.sin(a2) * s * 0.34, C.red, s * 0.035);
}
function gear(ctx, x, y, s, t = 0, color = C.steel) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(t);
  ctx.beginPath();
  const n = 8;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? s * 0.36 : s * 0.48;
    ctx.lineTo(Math.cos(a - 0.15) * r, Math.sin(a - 0.15) * r);
    ctx.lineTo(Math.cos(a + 0.15) * r, Math.sin(a + 0.15) * r);
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill();
  circle(ctx, 0, 0, s * 0.15, C.bg);
  ctx.restore();
}
function magnifier(ctx, x, y, s, color = C.cyan) {
  circle(ctx, x - s * 0.1, y - s * 0.1, s * 0.3, rgba(color, 0.15), color, s * 0.07);
  line(ctx, x + s * 0.12, y + s * 0.12, x + s * 0.42, y + s * 0.42, color, s * 0.11);
}
function snowflake(ctx, x, y, s, color = '#cfe8ff') {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = s * 0.06; ctx.lineCap = 'round';
  for (let i = 0; i < 6; i++) {
    ctx.rotate(Math.PI / 3);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 0.45);
    ctx.moveTo(0, -s * 0.28); ctx.lineTo(-s * 0.1, -s * 0.38); ctx.moveTo(0, -s * 0.28); ctx.lineTo(s * 0.1, -s * 0.38);
    ctx.stroke();
  }
  ctx.restore();
}
function moon(ctx, x, y, s, color = '#f2e7b5') {
  ctx.save();
  circle(ctx, x, y, s * 0.4, color);
  ctx.globalCompositeOperation = 'destination-out';
  circle(ctx, x + s * 0.18, y - s * 0.1, s * 0.34, '#000');
  ctx.restore();
}
function anchorIcon(ctx, x, y, s, color = C.steel) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = color; ctx.lineWidth = s * 0.08; ctx.lineCap = 'round';
  circle(ctx, 0, -s * 0.36, s * 0.09, null, color, s * 0.06);
  ctx.beginPath(); ctx.moveTo(0, -s * 0.27); ctx.lineTo(0, s * 0.42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.12); ctx.lineTo(s * 0.2, -s * 0.12); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, s * 0.05, s * 0.36, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.restore();
}
function pin(ctx, x, y, s, color = C.red) {
  ctx.save(); ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-s * 0.1, -s * 0.25, -s * 0.32, -s * 0.38, -s * 0.32, -s * 0.62);
  ctx.arc(0, -s * 0.62, s * 0.32, Math.PI, 0);
  ctx.bezierCurveTo(s * 0.32, -s * 0.38, s * 0.1, -s * 0.25, 0, 0);
  ctx.fillStyle = color; ctx.fill();
  circle(ctx, 0, -s * 0.62, s * 0.12, '#fff');
  ctx.restore();
}
function thermometer(ctx, x, y, s, level = 0.7, color = C.red) {
  fillRR(ctx, x - s * 0.1, y - s * 0.48, s * 0.2, s * 0.75, s * 0.1, '#e8eef5');
  circle(ctx, x, y + s * 0.32, s * 0.17, color);
  ctx.fillStyle = color; ctx.fillRect(x - s * 0.05, y + s * 0.3 - s * 0.7 * level, s * 0.1, s * 0.7 * level);
}
function radio(ctx, x, y, s) {
  fillRR(ctx, x - s * 0.2, y - s * 0.3, s * 0.4, s * 0.7, s * 0.06, '#2b3d4f', C.steelMid, 2);
  line(ctx, x + s * 0.12, y - s * 0.3, x + s * 0.12, y - s * 0.55, C.steelMid, s * 0.06);
  fillRR(ctx, x - s * 0.13, y - s * 0.22, s * 0.26, s * 0.16, s * 0.03, '#7ee0a0');
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) circle(ctx, x - s * 0.1 + j * s * 0.1, y + s * 0.04 + i * s * 0.09, s * 0.025, C.steel);
}
function cross(ctx, x, y, s, color = C.red) {
  ctx.fillStyle = color;
  ctx.fillRect(x - s * 0.12, y - s * 0.4, s * 0.24, s * 0.8);
  ctx.fillRect(x - s * 0.4, y - s * 0.12, s * 0.8, s * 0.24);
}
function check(ctx, x, y, s, color = C.green, t = 1) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = s * 0.14; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  K.partialPolyline(ctx, [[x - s * 0.35, y], [x - s * 0.1, y + s * 0.25], [x + s * 0.38, y - s * 0.28]], t, color, s * 0.14);
  ctx.restore();
}
function xmark(ctx, x, y, s, color = C.red) {
  line(ctx, x - s * 0.3, y - s * 0.3, x + s * 0.3, y + s * 0.3, color, s * 0.14);
  line(ctx, x + s * 0.3, y - s * 0.3, x - s * 0.3, y + s * 0.3, color, s * 0.14);
}
function suit(ctx, x, y, s) {
  // survival suit figure
  ctx.save(); ctx.translate(x, y);
  ctx.fillStyle = C.orange;
  fillRR(ctx, -s * 0.22, -s * 0.28, s * 0.44, s * 0.5, s * 0.1, C.orange);
  fillRR(ctx, -s * 0.36, -s * 0.24, s * 0.14, s * 0.42, s * 0.07, C.orange);
  fillRR(ctx, s * 0.22, -s * 0.24, s * 0.14, s * 0.42, s * 0.07, C.orange);
  fillRR(ctx, -s * 0.2, s * 0.18, s * 0.17, s * 0.34, s * 0.07, C.orange);
  fillRR(ctx, s * 0.03, s * 0.18, s * 0.17, s * 0.34, s * 0.07, C.orange);
  circle(ctx, 0, -s * 0.4, s * 0.16, C.orange);
  circle(ctx, 0, -s * 0.4, s * 0.09, '#e9c7a3');
  ctx.fillStyle = '#e8e8e8'; ctx.fillRect(-s * 0.22, -s * 0.06, s * 0.44, s * 0.05);
  ctx.restore();
}

module.exports = {
  doc, stamp, shield, helmet, leaf, drop, building, barChart, coin, person, helicopter, ship, lifeboat, book, clipboard, warn,
  flame, calendar, clock, gear, magnifier, snowflake, moon, anchorIcon, pin, thermometer, radio, cross, check, xmark, suit,
};
