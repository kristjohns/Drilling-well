// Subsea equipment: ROV, TMS, wellhead, simple BOP stack, transponders, coral.
'use strict';
const K = require('../engine/core');
const { C, rgba, fillRR, rr, circle, line, poly, text, lerp, clamp, darken } = K;

function rov(ctx, x, y, s = 1, t = 0, opt = {}) {
  const { dir = 1, arm = 0, lights = true } = opt;
  const S = (v) => v * s;
  ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
  if (lights) {
    const g = ctx.createRadialGradient(S(55), S(8), 2, S(55), S(8), S(160));
    g.addColorStop(0, 'rgba(255,250,220,0.35)'); g.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(S(50), S(8)); ctx.lineTo(S(220), S(-60)); ctx.lineTo(S(220), S(90)); ctx.closePath(); ctx.fill();
  }
  fillRR(ctx, -S(50), -S(32), S(100), S(28), S(4), C.yellow, darken(C.yellow, 0.4), 2);
  fillRR(ctx, -S(46), -S(4), S(92), S(34), S(4), '#2c3e50', '#56687a', 2);
  ctx.fillStyle = '#ffd23f'; ctx.fillRect(-S(46), -S(4), S(92), S(5));
  // thrusters
  for (const ox of [-38, 38]) { fillRR(ctx, S(ox) - S(8), -S(42), S(16), S(12), S(3), '#56687a'); }
  // camera & lights
  circle(ctx, S(46), S(10), S(6), '#111', C.steel, 2);
  circle(ctx, S(48), -S(20), S(4), '#fffbe0');
  // manipulator arm
  const a1 = 0.4 + Math.sin(arm) * 0.5;
  const ex = S(46) + Math.cos(a1) * S(30), ey = S(26) + Math.sin(a1) * S(30);
  line(ctx, S(40), S(24), ex, ey, C.steel, S(5));
  line(ctx, ex, ey, ex + S(18), ey - S(4), C.steel, S(4));
  ctx.restore();
}
function tms(ctx, x, y, s = 1) {
  const S = (v) => v * s;
  fillRR(ctx, x - S(45), y - S(40), S(90), S(80), S(6), '#3c5368', C.steelMid, 3);
  ctx.strokeStyle = C.steelMid; ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - S(45) + i * S(22.5), y - S(40)); ctx.lineTo(x - S(45) + i * S(22.5), y + S(40)); ctx.stroke(); }
  fillRR(ctx, x - S(20), y - S(52), S(40), S(14), S(3), C.yellow);
  text(ctx, 'TMS', x, y + S(6), { size: S(18), weight: 900, align: 'center', color: '#fff' });
}
// wellhead + guide base at seabed (x centre, y seabed)
function wellhead(ctx, x, y, s = 1, opt = {}) {
  const S = (v) => v * s;
  fillRR(ctx, x - S(60), y - S(14), S(120), S(14), S(3), '#7d8a96', '#56687a', 2);
  fillRR(ctx, x - S(18), y - S(48), S(36), S(36), S(4), '#a9b8c6', '#56687a', 2);
  fillRR(ctx, x - S(22), y - S(56), S(44), S(10), S(3), '#c5ced6', '#56687a', 2);
  return { top: y - S(56) };
}
// simplified BOP stack standing on wellhead; returns top y
function bopSimple(ctx, x, y, s = 1, opt = {}) {
  const { color = C.red, riser = true, topY = 0, hl = 0, t = 0 } = opt;
  const S = (v) => v * s;
  const frameW = S(110), h = S(170);
  ctx.save();
  // frame
  ctx.strokeStyle = '#9aa6b1'; ctx.lineWidth = Math.max(2, S(3));
  ctx.strokeRect(x - frameW / 2, y - h, frameW, h);
  // stack body
  fillRR(ctx, x - S(30), y - S(60), S(60), S(56), S(4), color, darken(color, 0.4), 2);
  fillRR(ctx, x - S(38), y - S(52), S(76), S(10), S(2), darken(color, 0.25));
  fillRR(ctx, x - S(38), y - S(30), S(76), S(10), S(2), darken(color, 0.25));
  fillRR(ctx, x - S(26), y - S(120), S(52), S(56), S(14), '#d9534f', darken(color, 0.4), 2);
  fillRR(ctx, x - S(20), y - S(160), S(40), S(36), S(6), '#c0c8d0', '#56687a', 2);
  // pods
  fillRR(ctx, x - S(52), y - S(110), S(16), S(34), S(3), C.blue);
  fillRR(ctx, x + S(36), y - S(110), S(16), S(34), S(3), C.yellow);
  if (riser) { ctx.fillStyle = '#8796a5'; ctx.fillRect(x - S(8), topY, S(16), y - h - topY); }
  if (hl > 0) { K.highlightRect(ctx, x - frameW / 2 - 8, y - h - 8, frameW + 16, h + 16, t, { alpha: hl }); }
  ctx.restore();
  return y - h;
}
function transponder(ctx, x, y, t = 0, ping = true) {
  fillRR(ctx, x - 6, y - 26, 12, 26, 3, C.yellow, '#8a6d1a', 1.5);
  if (ping) {
    const ph = (t * 0.8) % 1;
    ctx.save(); ctx.globalAlpha *= 1 - ph;
    ctx.beginPath(); ctx.arc(x, y - 26, 10 + ph * 60, Math.PI * 1.1, Math.PI * 1.9); ctx.strokeStyle = C.yellow; ctx.lineWidth = 2; ctx.stroke();
    ctx.restore();
  }
}
function coral(ctx, x, y, s = 1, color = '#ff8fab') {
  ctx.save(); ctx.strokeStyle = color; ctx.lineCap = 'round';
  const branch = (bx, by, len, ang, w, d) => {
    if (d === 0) return;
    const ex = bx + Math.cos(ang) * len, ey = by + Math.sin(ang) * len;
    ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ex, ey); ctx.stroke();
    branch(ex, ey, len * 0.72, ang - 0.45, w * 0.7, d - 1);
    branch(ex, ey, len * 0.72, ang + 0.4, w * 0.7, d - 1);
  };
  branch(x, y, 26 * s, -Math.PI / 2, 6 * s, 5);
  branch(x - 14 * s, y, 18 * s, -Math.PI / 2 - 0.3, 4 * s, 4);
  ctx.restore();
}
module.exports = { rov, tms, wellhead, bopSimple, transponder, coral };

// Detailed BOP stack front view (cut-away: the bore and pipe are visible through the stack).
// baseY = top of wellhead. st: { t, annular, upperAnnular, pipeRam, vbr, bsr, csr, lift, hl:Set, hlA, pipe, labels }
function bopStack(ctx, cx, baseY, s = 1, st = {}) {
  const t = st.t || 0;
  const S = (v) => v * s;
  const hl = st.hl || new Set();
  const hlA = st.hlA == null ? 1 : st.hlA;
  const A = {};
  const glow = (name, x, y, w, h) => { if (hl.has(name) && hlA > 0) K.highlightRect(ctx, x, y, w, h, t, { alpha: hlA }); };
  const y = (v) => baseY - S(900 - v);
  const lift = S(140) * (st.lift || 0);
  const pipeOn = st.pipe !== false;
  const cut = (st.bsr || 0) >= 0.98;
  const cutY = y(564);
  const pipe = (y1, y2) => {
    if (!pipeOn || y2 <= y1) return;
    ctx.fillStyle = '#9fb0c1'; ctx.fillRect(cx - S(11), y1, S(22), y2 - y1);
    ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(cx - S(6), y1, S(4), y2 - y1);
  };
  const body = '#c0392b', bodyEdge = '#7a1f17', bore = '#3a0f0b';
  // wellhead + connector
  pipe(baseY, baseY + S(40));
  fillRR(ctx, cx - S(70), baseY, S(140), S(40), S(4), '#a9b8c6', '#56687a', 2);
  pipe(baseY + S(4), baseY + S(40));
  fillRR(ctx, cx - S(110), y(840), S(220), S(60), S(8), '#7d8a96', '#56687a', 2);
  text(ctx, 'wellhead connector', cx, y(878), { size: S(16), weight: 800, align: 'center', color: '#0b1520' });
  A.connector = [cx + S(110), y(870)];
  glow('connector', cx - S(116), y(834), S(232), S(72));
  // frame
  ctx.strokeStyle = '#8796a5'; ctx.lineWidth = Math.max(2, S(5));
  ctx.strokeRect(cx - S(230), y(530), S(460), S(310));
  // lower stack spool body with bore
  fillRR(ctx, cx - S(60), y(530), S(120), S(310), S(4), darken(body, 0.15), bodyEdge, 2);
  ctx.fillStyle = bore; ctx.fillRect(cx - S(26), y(530), S(52), S(310));
  if (cut) { pipe(cutY + S(3), y(840)); } else pipe(y(530), y(840));
  // choke & kill lines leave the stack between the rams
  for (const [yy, sd] of [[714, 1], [774, 1], [714, -1], [774, -1]]) {
    line(ctx, cx + sd * S(60), y(yy), cx + sd * S(262), y(yy), '#56687a', Math.max(2, S(8)));
    fillRR(ctx, cx + sd * S(215) - S(14), y(yy) - S(14), S(28), S(28), S(4), sd > 0 ? C.amber : C.cyan);
  }
  A.choke = [cx + S(262), y(714)]; A.kill = [cx - S(262), y(714)];
  const labels = st.labels !== false;
  const ram = (yy, label, close, kind) => {
    const by = y(yy);
    fillRR(ctx, cx - S(170), by, S(340), S(48), S(6), body, bodyEdge, 2);
    ctx.fillStyle = bore; ctx.fillRect(cx - S(152), by + S(9), S(304), S(30));
    if (!(yy === 540 && cut)) pipe(by + S(9), by + S(39));
    const c = clamp(close || 0);
    const shut = kind === 'shear' ? 0 : S(11);
    const inner = lerp(S(150), shut, c);
    const col = kind === 'shear' ? '#e0a83a' : '#cfd8e3';
    const w = S(150) - inner;
    if (w > 0.5) {
      fillRR(ctx, cx - S(150), by + S(12), w, S(24), S(3), col);
      fillRR(ctx, cx + inner, by + S(12), w, S(24), S(3), col);
      if (kind === 'shear') {
        // offset blades: upper blade on the left ram, lower blade on the right ram
        ctx.fillStyle = darken(col, 0.35);
        ctx.fillRect(cx - inner - S(4), by + S(12), S(4), S(12));
        ctx.fillRect(cx + inner, by + S(24), S(4), S(12));
      } else {
        ctx.fillStyle = '#2b2b2b';
        ctx.fillRect(cx - inner - S(5), by + S(12), S(5), S(24));
        ctx.fillRect(cx + inner, by + S(12), S(5), S(24));
      }
    }
    if (labels) text(ctx, label, cx - S(245), by + S(31), { size: S(17), weight: 800, align: 'right', color: C.text });
    return [cx + S(170), by + S(24)];
  };
  A.bsr = ram(540, 'BSR', st.bsr, 'shear');
  glow('bsr', cx - S(176), y(534), S(352), S(60));
  A.csr = ram(600, 'CSR', st.csr, 'shear');
  glow('csr', cx - S(176), y(594), S(352), S(60));
  A.vbr = ram(660, 'VBR', st.vbr, 'pipe');
  A.pipeRam = ram(720, 'pipe ram', st.pipeRam, 'pipe');
  A.lowerRam = ram(780, 'pipe ram', st.pipeRam, 'pipe');
  glow('pipe', cx - S(176), y(654), S(352), S(180));
  // sparks while the shear rams cut
  const b = st.bsr || 0;
  if (b > 0.8 && b < 1 && pipeOn) {
    const R = K.rng(Math.floor(t * 30));
    for (let k = 0; k < 14; k++) {
      const a = R() * Math.PI * 2, d = S(10 + R() * 50);
      line(ctx, cx, cutY, cx + Math.cos(a) * d, cutY + Math.sin(a) * d * 0.5, k % 2 ? '#fff3b0' : C.amber, Math.max(1.5, S(2.5)));
    }
  }
  // LMRP (lifts on disconnect)
  ctx.save(); ctx.translate(0, -lift);
  fillRR(ctx, cx - S(60), y(330), S(120), S(200), S(4), darken(body, 0.15), bodyEdge, 2);
  ctx.fillStyle = bore; ctx.fillRect(cx - S(26), y(330), S(52), S(200));
  if (cut) pipe(y(280), Math.min(y(530), cutY - S(3) + lift)); else pipe(y(280), y(530));
  fillRR(ctx, cx - S(120), y(500), S(240), S(30), S(6), '#7d8a96', '#56687a', 2);
  if (cut) pipe(y(500), Math.min(y(530), cutY - S(3) + lift)); else pipe(y(500), y(530));
  text(ctx, 'LMRP connector', cx, y(521), { size: S(15), weight: 800, align: 'center', color: '#0b1520' });
  const annular = (yy, close) => {
    const by = y(yy);
    fillRR(ctx, cx - S(140), by, S(280), S(72), S(26), body, bodyEdge, 2);
    ctx.fillStyle = bore; ctx.fillRect(cx - S(122), by + S(8), S(244), S(56));
    pipe(by + S(8), by + S(64));
    const c = clamp(close || 0);
    const gap = lerp(S(96), S(11), c);
    ctx.fillStyle = '#262626';
    for (const sd of [-1, 1]) {
      poly(ctx, [[cx + sd * S(122), by + S(8)], [cx + sd * (gap + S(20)), by + S(14)], [cx + sd * gap, by + S(28)], [cx + sd * gap, by + S(44)], [cx + sd * (gap + S(20)), by + S(58)], [cx + sd * S(122), by + S(64)]]);
      ctx.fill();
      // steel inserts in the rubber
      ctx.fillStyle = '#6b7885';
      ctx.fillRect(cx + sd * (gap + S(4)) - (sd > 0 ? 0 : S(6)), by + S(28), S(6), S(16));
      ctx.fillStyle = '#262626';
    }
    return [cx + S(140), by + S(36)];
  };
  A.lowerAnnular = annular(420, st.annular);
  A.upperAnnular = annular(340, st.upperAnnular);
  glow('annular', cx - S(146), y(334), S(292), S(164));
  // pods
  fillRR(ctx, cx - S(220), y(350), S(60), S(120), S(6), C.blue, '#1e3a8a', 2);
  fillRR(ctx, cx + S(160), y(350), S(60), S(120), S(6), C.yellow, '#8a6d1a', 2);
  text(ctx, 'BLUE', cx - S(190), y(418), { size: S(14), weight: 900, align: 'center', color: '#fff' });
  text(ctx, 'YELLOW', cx + S(190), y(418), { size: S(13), weight: 900, align: 'center', color: '#1a1206' });
  A.pods = [cx + S(220), y(400)]; A.podsL = [cx - S(220), y(400)];
  glow('pods', cx - S(226), y(344), S(452), S(132));
  // flex joint + riser
  ctx.fillStyle = '#8796a5'; ctx.fillRect(cx - S(26), -600, S(52), y(290) + 600);
  circle(ctx, cx, y(305), S(30), '#8796a5', '#56687a', 2);
  if (pipeOn) {
    ctx.fillStyle = bore; ctx.fillRect(cx - S(16), -600, S(32), y(280) + 600);
    if (cut) pipe(-600, Math.min(y(330), cutY - S(3) + lift)); else pipe(-600, y(330));
  }
  A.lmrp = [cx + S(140), y(460)];
  glow('lmrp', cx - S(236), y(274), S(472), S(262));
  ctx.restore();
  return A;
}

// Top view of a BOP element closing on the pipe. kind: 'annular' | 'pipe' | 'vbr' | 'shear'. c = 0 open .. 1 closed
function bopTop(ctx, x, y, r, kind, c, opt = {}) {
  const { pipeR = r * 0.16, t = 0, label = true } = opt;
  c = clamp(c);
  const body = '#a8322a', bore = '#1b0b08', pipeCol = '#a9b8c6';
  const pipeDisc = (rx = pipeR, ry = pipeR) => {
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(1, rx), ry, 0, 0, Math.PI * 2); ctx.fillStyle = pipeCol; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#56687a'; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.5, rx * 0.6), ry * 0.6, 0, 0, Math.PI * 2); ctx.fillStyle = '#4a5866'; ctx.fill();
  };
  if (kind === 'annular') {
    circle(ctx, x, y, r, body, darken(body, 0.4), 3);
    circle(ctx, x, y, r * 0.72, bore);
    const ri = lerp(r * 0.66, pipeR + 1, c);
    // rubber packing element
    ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, Math.PI * 2); ctx.arc(x, y, ri, 0, Math.PI * 2, true);
    ctx.fillStyle = '#2b2b2b'; ctx.fill('evenodd');
    // steel finger inserts
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2;
      line(ctx, x + Math.cos(a) * (ri + 4), y + Math.sin(a) * (ri + 4), x + Math.cos(a) * r * 0.68, y + Math.sin(a) * r * 0.68, '#7d8a96', 4);
    }
    pipeDisc();
    return;
  }
  // ram-type: long bonnet body with the bore in the middle
  fillRR(ctx, x - r * 1.15, y - r * 0.5, r * 2.3, r, r * 0.12, body, darken(body, 0.4), 3);
  circle(ctx, x, y, r * 0.5, darken(body, 0.1));
  ctx.fillStyle = bore; ctx.fillRect(x - r * 1.08, y - r * 0.3, r * 2.16, r * 0.6);
  circle(ctx, x, y, r * 0.42, bore);
  const h = r * 0.5;
  const off = lerp(r * 0.95, 0, c);
  if (kind === 'shear') {
    const sq = Math.min(pipeR, off);
    if (c < 0.98) pipeDisc(sq, pipeR * (1 + (1 - sq / pipeR) * 0.5));
    const col = '#e0a83a';
    // left ram with angled upper blade, right ram with lower blade
    poly(ctx, [[x - r * 1.05, y - h / 2], [x - off + r * 0.08, y - h / 2], [x - off - r * 0.02, y], [x - off - r * 0.12, y + h / 2], [x - r * 1.05, y + h / 2]]);
    ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = darken(col, 0.4); ctx.lineWidth = 2; ctx.stroke();
    poly(ctx, [[x + r * 1.05, y - h / 2], [x + off + r * 0.12, y - h / 2], [x + off + r * 0.02, y], [x + off - r * 0.08, y + h / 2], [x + r * 1.05, y + h / 2]]);
    ctx.fillStyle = darken(col, 0.12); ctx.fill(); ctx.stroke();
    if (c > 0.97) { ctx.fillStyle = '#2b2b2b'; ctx.fillRect(x - r * 0.02, y - h / 2, r * 0.04, h); }
    return;
  }
  const pr = kind === 'vbr' ? (opt.vbrR || pipeR) : pipeR;
  pipeDisc(pr, pr);
  for (const sd of [-1, 1]) {
    const xf = x + sd * (off + 0);
    ctx.beginPath();
    ctx.moveTo(x + sd * r * 1.05, y - h / 2);
    ctx.lineTo(xf, y - h / 2);
    ctx.lineTo(xf, y - pr - 2);
    ctx.arc(xf, y, pr + 2, -Math.PI / 2, Math.PI / 2, sd < 0);
    ctx.lineTo(xf, y + h / 2);
    ctx.lineTo(x + sd * r * 1.05, y + h / 2);
    ctx.closePath();
    ctx.fillStyle = '#cfd8e3'; ctx.fill(); ctx.strokeStyle = '#7d8a96'; ctx.lineWidth = 2; ctx.stroke();
    // rubber packer along the face
    ctx.beginPath(); ctx.arc(xf, y, pr + 4, -Math.PI / 2, Math.PI / 2, sd < 0);
    ctx.strokeStyle = '#262626'; ctx.lineWidth = 5; ctx.stroke();
    if (kind === 'vbr') {
      // segmented steel inserts that adapt to the pipe size
      for (let k = 1; k <= 3; k++) {
        ctx.beginPath(); ctx.arc(xf, y, pr + 4 + k * 7, -Math.PI / 2 + 0.25, Math.PI / 2 - 0.25, sd < 0);
        ctx.strokeStyle = '#7d8a96'; ctx.lineWidth = 2; ctx.stroke();
      }
    }
  }
}
module.exports.bopStack = bopStack;
module.exports.bopTop = bopTop;
