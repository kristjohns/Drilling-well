// Drill string, BHA components, bits and close-up mechanisms.
'use strict';
const K = require('../engine/core');
const { C, rgba, fillRR, rr, circle, line, poly, text, lerp, clamp, darken, lighten } = K;

const STEEL = '#a9b8c6', STEEL_D = '#7d8a96', STEEL_L = '#d0dae3';

function metal(ctx, x, y, w, h, base = STEEL) {
  const g = ctx.createLinearGradient(x, 0, x + w, 0);
  g.addColorStop(0, darken(base, 0.35)); g.addColorStop(0.35, lighten(base, 0.25)); g.addColorStop(0.6, base); g.addColorStop(1, darken(base, 0.45));
  ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
}

// comps: [{ type, h, label }] drawn top to bottom from yTop, centred at x. Returns positions.
function drawString(ctx, x, yTop, comps, opt = {}) {
  const { hl = -1, hlA = 0, t = 0, spin = 0, scale = 1 } = opt;
  const out = [];
  let y = yTop;
  comps.forEach((c, i) => {
    const h = c.h;
    const s = scale;
    switch (c.type) {
      case 'dp': {
        metal(ctx, x - 8 * s, y, 16 * s, h);
        for (let yy = y + 30; yy < y + h - 10; yy += 70) { metal(ctx, x - 12 * s, yy, 24 * s, 12, STEEL_L); }
        break;
      }
      case 'hwdp': {
        metal(ctx, x - 10 * s, y, 20 * s, h);
        for (let yy = y + 10; yy < y + h - 10; yy += 60) { metal(ctx, x - 14 * s, yy, 28 * s, 12, STEEL_L); metal(ctx, x - 13 * s, yy + 26, 26 * s, 9, STEEL_L); }
        break;
      }
      case 'jar': {
        metal(ctx, x - 15 * s, y, 30 * s, h, '#8fa6bb');
        ctx.fillStyle = rgba('#000', 0.3); ctx.fillRect(x - 15 * s, y + h * 0.45, 30 * s, 4);
        ctx.fillStyle = C.red; ctx.fillRect(x - 15 * s, y + h * 0.2, 30 * s, 4);
        break;
      }
      case 'dc': {
        metal(ctx, x - 17 * s, y, 34 * s, h, '#97a8b8');
        ctx.strokeStyle = rgba('#000', 0.18); ctx.lineWidth = 2;
        for (let yy = y; yy < y + h; yy += 18) { ctx.beginPath(); ctx.moveTo(x - 17 * s, yy); ctx.lineTo(x + 17 * s, yy + 9); ctx.stroke(); }
        break;
      }
      case 'stab': {
        metal(ctx, x - 17 * s, y, 34 * s, h, '#97a8b8');
        ctx.fillStyle = '#c8a24a';
        for (let k = 0; k < 3; k++) {
          const ph = ((t * spin * 0.6) + k / 3) % 1;
          const bx = x + Math.sin(ph * Math.PI * 2) * 22 * s;
          const vis = Math.cos(ph * Math.PI * 2) > -0.2;
          if (!vis) continue;
          poly(ctx, [[bx - 6 * s, y + h * 0.15], [bx + 6 * s, y + h * 0.1], [bx + 6 * s, y + h * 0.85], [bx - 6 * s, y + h * 0.9]]); ctx.fill();
        }
        break;
      }
      case 'xo': {
        metal(ctx, x - 13 * s, y, 26 * s, h, '#b0bcc7');
        ctx.fillStyle = rgba(C.amber, 0.7); ctx.fillRect(x - 13 * s, y + h / 2 - 2, 26 * s, 4);
        break;
      }
      case 'float': {
        metal(ctx, x - 15 * s, y, 30 * s, h, '#b0bcc7');
        poly(ctx, [[x - 8 * s, y + h * 0.7], [x + 8 * s, y + h * 0.7], [x, y + h * 0.3]]); ctx.fillStyle = C.green; ctx.fill();
        break;
      }
      case 'mwd': case 'lwd': {
        metal(ctx, x - 18 * s, y, 36 * s, h, '#8796a5');
        const col = c.type === 'mwd' ? C.cyan : C.green;
        ctx.fillStyle = col; ctx.fillRect(x - 18 * s, y + h * 0.3, 36 * s, 5); ctx.fillRect(x - 18 * s, y + h * 0.62, 36 * s, 5);
        text(ctx, c.type.toUpperCase(), x, y + h * 0.52, { size: 14 * s, weight: 900, align: 'center', color: '#0b1520' });
        break;
      }
      case 'rss': {
        metal(ctx, x - 20 * s, y, 40 * s, h, '#7f93a6');
        const push = 0.5 + 0.5 * Math.sin(t * 3);
        fillRR(ctx, x - 20 * s - 8 * push, y + h * 0.35, 8, h * 0.3, 2, C.amber);
        break;
      }
      case 'motor': {
        metal(ctx, x - 20 * s, y, 40 * s, h * 0.7, '#7f93a6');
        ctx.save(); ctx.translate(x, y + h * 0.7); ctx.rotate(0.06);
        metal(ctx, -18 * s, 0, 36 * s, h * 0.3, '#7f93a6');
        ctx.restore();
        break;
      }
      case 'bit': {
        ctx.save(); ctx.translate(x, y);
        metal(ctx, -16 * s, 0, 32 * s, h * 0.35, '#b0bcc7');
        ctx.beginPath(); ctx.moveTo(-30 * s, h * 0.35); ctx.lineTo(30 * s, h * 0.35); ctx.quadraticCurveTo(32 * s, h, 0, h); ctx.quadraticCurveTo(-32 * s, h, -30 * s, h * 0.35); ctx.closePath();
        ctx.fillStyle = '#5b6b7b'; ctx.fill();
        for (let k = -2; k <= 2; k++) circle(ctx, k * 11 * s, h * 0.62 + Math.abs(k) * 2, 4 * s, '#e8eef5');
        ctx.restore();
        break;
      }
    }
    out.push({ y0: y, y1: y + h, mid: y + h / 2, type: c.type, label: c.label });
    if (i === hl && hlA > 0) {
      const w = { dp: 30, hwdp: 34, jar: 40, dc: 44, stab: 64, xo: 36, float: 40, mwd: 46, lwd: 46, rss: 54, motor: 54, bit: 70 }[c.type] * s;
      K.highlightRect(ctx, x - w / 2 - 6, y - 6, w + 12, h + 12, t, { alpha: hlA });
    }
    y += h;
  });
  return out;
}

// close-up of a tool joint: pin entering box; p 0..1 = screwed in
function pinBox(ctx, x, y, s, p, t = 0) {
  const S = (v) => v * s;
  ctx.save(); ctx.translate(x, y);
  // box (top part, female) - drawn as a cut-away
  metal(ctx, -S(70), -S(220), S(140), S(160), STEEL);
  ctx.fillStyle = '#0d1d2c'; poly(ctx, [[-S(46), -S(60)], [S(46), -S(60)], [S(30), -S(170)], [-S(30), -S(170)]]); ctx.fill();
  // box threads
  ctx.strokeStyle = STEEL_D; ctx.lineWidth = 3;
  for (let i = 0; i < 9; i++) { const yy = -S(70) - i * S(11); const hw = lerp(S(46), S(30), i / 8); ctx.beginPath(); ctx.moveTo(-hw, yy); ctx.lineTo(-hw + S(8), yy - S(5)); ctx.moveTo(hw, yy); ctx.lineTo(hw - S(8), yy - S(5)); ctx.stroke(); }
  // pin (bottom part, male) rising
  const off = lerp(S(130), 0, ease(p));
  ctx.save(); ctx.translate(0, off);
  poly(ctx, [[-S(44), -S(62)], [S(44), -S(62)], [S(28), -S(168)], [-S(28), -S(168)]]);
  const g = ctx.createLinearGradient(-S(44), 0, S(44), 0); g.addColorStop(0, darken(STEEL, 0.3)); g.addColorStop(0.4, lighten(STEEL, 0.3)); g.addColorStop(1, darken(STEEL, 0.4));
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = STEEL_D; ctx.lineWidth = 3;
  const rot = t * 4;
  for (let i = 0; i < 9; i++) { const yy = -S(70) - i * S(11) + ((rot * S(4)) % S(11)) * (p < 1 ? 1 : 0); const hw = lerp(S(44), S(28), i / 8); if (yy < -S(168) || yy > -S(62)) continue; ctx.beginPath(); ctx.moveTo(-hw, yy); ctx.lineTo(hw, yy - S(4)); ctx.stroke(); }
  metal(ctx, -S(70), -S(62), S(140), S(140), STEEL);
  ctx.restore();
  ctx.restore();
  function ease(v) { return K.ease.inOut(v); }
}

function pdcFace(ctx, x, y, r, rot = 0, opt = {}) {
  const { nozzles = true, blades = 6 } = opt;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  circle(ctx, 0, 0, r, '#4b5a68', '#2c3a47', 4);
  for (let b = 0; b < blades; b++) {
    const a = (b / blades) * Math.PI * 2;
    ctx.save(); ctx.rotate(a);
    ctx.beginPath(); ctx.moveTo(-r * 0.08, -r * 0.12); ctx.quadraticCurveTo(r * 0.5, -r * 0.2, r * 0.97, -r * 0.05); ctx.lineTo(r * 0.97, r * 0.12); ctx.quadraticCurveTo(r * 0.5, r * 0.02, r * 0.08, r * 0.1); ctx.closePath();
    ctx.fillStyle = '#7d8a96'; ctx.fill();
    for (let k = 0; k < 5; k++) { const rr2 = r * (0.22 + k * 0.17); circle(ctx, rr2, -r * 0.02 + Math.sin(k) * 2, r * 0.065, '#f1f5f9', '#94a3b8', 1.5); }
    ctx.restore();
  }
  if (nozzles) for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.5; circle(ctx, Math.cos(a) * r * 0.42, Math.sin(a) * r * 0.42, r * 0.07, '#0b1520', C.cyan, 2); }
  ctx.restore();
}
function tricone(ctx, x, y, r, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  circle(ctx, 0, 0, r, '#4b5a68', '#2c3a47', 4);
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2;
    ctx.save(); ctx.rotate(a); ctx.translate(r * 0.42, 0);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.48, r * 0.36, 0, 0, Math.PI * 2); ctx.fillStyle = '#8796a5'; ctx.fill();
    const cr = rot * 3;
    for (let ring = 0; ring < 3; ring++) for (let j = 0; j < 8; j++) {
      const aa = (j / 8) * Math.PI * 2 + cr * (ring % 2 ? 1 : -1);
      circle(ctx, Math.cos(aa) * r * (0.12 + ring * 0.12), Math.sin(aa) * r * (0.1 + ring * 0.09), r * 0.035, '#e8eef5');
    }
    ctx.restore();
  }
  ctx.restore();
}
// side view of a PDC bit (for drilling animation)
function pdcSide(ctx, x, y, s = 1, rot = 0) {
  const S = (v) => v * s;
  ctx.save(); ctx.translate(x, y);
  metal(ctx, -S(22), -S(60), S(44), S(40), '#b0bcc7');
  ctx.beginPath(); ctx.moveTo(-S(50), -S(20)); ctx.lineTo(S(50), -S(20)); ctx.quadraticCurveTo(S(54), S(40), 0, S(46)); ctx.quadraticCurveTo(-S(54), S(40), -S(50), -S(20)); ctx.closePath();
  ctx.fillStyle = '#5b6b7b'; ctx.fill();
  for (let b = 0; b < 4; b++) {
    const ph = ((rot / (Math.PI * 2)) + b / 4) % 1;
    const bx = Math.sin(ph * Math.PI * 2) * S(44);
    if (Math.cos(ph * Math.PI * 2) < 0) continue;
    for (let k = 0; k < 4; k++) circle(ctx, bx * (1 - k * 0.2), S(-6 + k * 12), S(5), '#e8eef5', '#94a3b8', 1);
  }
  ctx.restore();
}

module.exports = { drawString, pinBox, pdcFace, tricone, pdcSide, metal };
