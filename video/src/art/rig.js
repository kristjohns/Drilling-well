// Offshore scenery and rig types: sea, semi-submersible, jack-up, drillship, platform, vessels.
'use strict';
const K = require('../engine/core');
const { C, rgba, fillRR, rr, circle, line, poly, text, lerp, clamp, darken, lighten } = K;

function sky(ctx, w, seaY, opt = {}) {
  const { top = C.skyTop, bot = C.skyBot } = opt;
  const g = ctx.createLinearGradient(0, 0, 0, seaY);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, seaY);
}
function sea(ctx, w, seaY, bottomY, t = 0, opt = {}) {
  const { amp = 5, top = C.seaTop, bot = C.seaBot, alpha = 1 } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  const g = ctx.createLinearGradient(0, seaY, 0, bottomY);
  g.addColorStop(0, top); g.addColorStop(1, bot);
  ctx.beginPath();
  ctx.moveTo(0, bottomY);
  for (let x = 0; x <= w + 10; x += 10) ctx.lineTo(x, seaY + Math.sin(x / 55 + t * 1.6) * amp * 0.6 + Math.sin(x / 23 - t * 2.3) * amp * 0.4);
  ctx.lineTo(w, bottomY);
  ctx.closePath();
  ctx.fillStyle = g; ctx.fill();
  // surface highlight
  ctx.beginPath();
  for (let x = 0; x <= w + 10; x += 10) {
    const y = seaY + Math.sin(x / 55 + t * 1.6) * amp * 0.6 + Math.sin(x / 23 - t * 2.3) * amp * 0.4;
    x ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.strokeStyle = rgba('#8fd3ff', 0.55); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
function waveY(x, seaY, t, amp = 5) {
  return seaY + Math.sin(x / 55 + t * 1.6) * amp * 0.6 + Math.sin(x / 23 - t * 2.3) * amp * 0.4;
}
function seabed(ctx, w, y, h, opt = {}) {
  const { color = '#5d4c39', seed = 3 } = opt;
  const g = ctx.createLinearGradient(0, y, 0, y + h);
  g.addColorStop(0, '#6b5843'); g.addColorStop(1, '#3d3226');
  ctx.fillStyle = g; ctx.fillRect(0, y, w, h);
  K.speckle(ctx, 0, y, w, h, Math.floor((w * h) / 400), rgba('#000000', 0.18), seed, 1.6);
  line(ctx, 0, y, w, y, '#8a7457', 3);
}

// Lattice derrick / mast. (x,y) = centre of base.
function derrick(ctx, x, y, h, bw, tw, opt = {}) {
  const { color = '#c9d3dc', lw = 2.2, crown = true } = opt;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lw;
  const L = (f) => lerp(x - bw / 2, x - tw / 2, f), R = (f) => lerp(x + bw / 2, x + tw / 2, f);
  ctx.beginPath();
  ctx.moveTo(x - bw / 2, y); ctx.lineTo(x - tw / 2, y - h);
  ctx.moveTo(x + bw / 2, y); ctx.lineTo(x + tw / 2, y - h);
  ctx.stroke();
  ctx.lineWidth = lw * 0.6;
  const n = Math.max(4, Math.round(h / (bw * 0.55)));
  ctx.beginPath();
  for (let i = 0; i <= n; i++) {
    const f = i / n, yy = y - h * f;
    ctx.moveTo(L(f), yy); ctx.lineTo(R(f), yy);
    if (i < n) {
      const f2 = (i + 1) / n, y2 = y - h * f2;
      ctx.moveTo(L(f), yy); ctx.lineTo(R(f2), y2);
      ctx.moveTo(R(f), yy); ctx.lineTo(L(f2), y2);
    }
  }
  ctx.stroke();
  if (crown) fillRR(ctx, x - tw / 2 - 6, y - h - 10, tw + 12, 12, 3, color);
  ctx.restore();
}

// Semi-submersible. cx = centre, seaY = mean sea level line, s = scale (1 => ~420 px wide)
function semi(ctx, cx, seaY, s = 1, t = 0, opt = {}) {
  const { heave = 0, hull = '#d9a036', deck = '#c5ced6', alpha = 1, showRiserHole = false, highlight = null, labels = false } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  const dy = heave;
  ctx.translate(0, dy);
  const S = (v) => v * s;
  // pontoon (underwater)
  fillRR(ctx, cx - S(210), seaY + S(70), S(420), S(32), S(14), darken(hull, 0.25));
  // braces
  ctx.fillStyle = darken(hull, 0.35);
  ctx.fillRect(cx - S(140), seaY + S(30), S(280), S(7));
  // columns
  for (const ox of [-150, 150]) {
    fillRR(ctx, cx + S(ox) - S(24), seaY - S(48), S(48), S(122), S(8), hull);
    ctx.fillStyle = rgba('#000000', 0.15); ctx.fillRect(cx + S(ox) + S(10), seaY - S(48), S(14), S(122));
  }
  // deck box
  fillRR(ctx, cx - S(200), seaY - S(92), S(400), S(46), S(4), deck);
  ctx.fillStyle = rgba('#000000', 0.12); ctx.fillRect(cx - S(200), seaY - S(56), S(400), S(10));
  // substructure + drill floor
  fillRR(ctx, cx - S(38), seaY - S(112), S(76), S(22), S(2), '#9aa6b1');
  // derrick
  derrick(ctx, cx, seaY - S(112), S(175), S(62), S(18), { color: '#dfe6ec', lw: Math.max(1.2, S(2.2)) });
  // living quarters
  fillRR(ctx, cx - S(196), seaY - S(150), S(78), S(58), S(3), '#eef2f5');
  ctx.fillStyle = '#5c8fb5';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) ctx.fillRect(cx - S(190) + c * S(14), seaY - S(142) + r * S(16), S(9), S(8));
  // helideck
  poly(ctx, [[cx - S(232), seaY - S(156)], [cx - S(118), seaY - S(156)], [cx - S(124), seaY - S(150)], [cx - S(226), seaY - S(150)]]);
  ctx.fillStyle = '#4a5866'; ctx.fill();
  text(ctx, 'H', cx - S(175), seaY - S(158), { size: S(14), weight: 900, align: 'center', color: C.yellow });
  // crane
  fillRR(ctx, cx + S(130), seaY - S(128), S(14), S(36), S(2), '#d94b3c');
  line(ctx, cx + S(137), seaY - S(124), cx + S(205), seaY - S(190), '#f0c419', Math.max(1.5, S(4)));
  line(ctx, cx + S(205), seaY - S(190), cx + S(205), seaY - S(150), '#8796a5', Math.max(1, S(1.2)));
  // second crane
  fillRR(ctx, cx - S(110), seaY - S(122), S(12), S(30), S(2), '#d94b3c');
  line(ctx, cx - S(104), seaY - S(118), cx - S(60), seaY - S(170), '#f0c419', Math.max(1.5, S(3.5)));
  // lifeboats
  for (const ox of [-198, -178]) {
    ctx.save(); ctx.translate(cx + S(ox), seaY - S(84)); ctx.rotate(-0.5);
    fillRR(ctx, -S(8), -S(5), S(18), S(9), S(4), C.orange); ctx.restore();
  }
  // pipe deck racks
  ctx.fillStyle = '#7d8a96';
  for (let i = 0; i < 4; i++) ctx.fillRect(cx + S(50) + i * S(16), seaY - S(98), S(12), S(6));
  ctx.restore();
}

// Jack-up: legs to seabed, hull elevated above the sea.
function jackup(ctx, cx, seaY, seabedY, s = 1, t = 0, opt = {}) {
  const { alpha = 1, hullY = null, legColor = '#d9a036' } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  const S = (v) => v * s;
  const hy = hullY != null ? hullY : seaY - S(70);
  // legs (lattice)
  for (const ox of [-140, 60]) {
    const x = cx + S(ox);
    const top = hy - S(120);
    ctx.strokeStyle = legColor; ctx.lineWidth = Math.max(1.5, S(3));
    ctx.strokeRect(x - S(14), top, S(28), seabedY - top);
    ctx.lineWidth = Math.max(1, S(1.4));
    ctx.beginPath();
    for (let y = top; y < seabedY; y += S(22)) { ctx.moveTo(x - S(14), y); ctx.lineTo(x + S(14), y + S(22)); ctx.moveTo(x + S(14), y); ctx.lineTo(x - S(14), y + S(22)); }
    ctx.stroke();
    // spudcan
    poly(ctx, [[x - S(30), seabedY + S(6)], [x + S(30), seabedY + S(6)], [x + S(16), seabedY - S(12)], [x - S(16), seabedY - S(12)]]);
    ctx.fillStyle = darken(legColor, 0.3); ctx.fill();
  }
  // hull
  fillRR(ctx, cx - S(190), hy, S(330), S(40), S(6), '#c5ced6');
  ctx.fillStyle = rgba('#000000', 0.15); ctx.fillRect(cx - S(190), hy + S(28), S(330), S(12));
  // LQ
  fillRR(ctx, cx - S(186), hy - S(52), S(70), S(52), S(3), '#eef2f5');
  ctx.fillStyle = '#5c8fb5';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) ctx.fillRect(cx - S(180) + c * S(16), hy - S(45) + r * S(15), S(10), S(8));
  poly(ctx, [[cx - S(206), hy - S(58)], [cx - S(110), hy - S(58)], [cx - S(116), hy - S(52)], [cx - S(200), hy - S(52)]]);
  ctx.fillStyle = '#4a5866'; ctx.fill();
  // cantilever with derrick extending over the stern (to the right)
  fillRR(ctx, cx + S(100), hy - S(18), S(130), S(20), S(2), '#9aa6b1');
  derrick(ctx, cx + S(190), hy - S(18), S(150), S(52), S(16), { color: '#dfe6ec', lw: Math.max(1.2, S(2)) });
  ctx.restore();
}

function drillship(ctx, cx, seaY, s = 1, t = 0, opt = {}) {
  const { alpha = 1, thrusters = false } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  const S = (v) => v * s;
  // hull
  ctx.beginPath();
  ctx.moveTo(cx - S(260), seaY - S(34));
  ctx.lineTo(cx + S(230), seaY - S(34));
  ctx.quadraticCurveTo(cx + S(275), seaY - S(32), cx + S(262), seaY + S(10));
  ctx.lineTo(cx + S(240), seaY + S(30));
  ctx.lineTo(cx - S(250), seaY + S(30));
  ctx.lineTo(cx - S(266), seaY - S(10));
  ctx.closePath();
  ctx.fillStyle = '#2d4a63'; ctx.fill();
  ctx.fillStyle = '#c8402e'; ctx.fillRect(cx - S(250), seaY + S(14), S(490), S(16));
  // deck house at bow (right)
  fillRR(ctx, cx + S(150), seaY - S(96), S(80), S(62), S(4), '#eef2f5');
  ctx.fillStyle = '#5c8fb5';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) ctx.fillRect(cx + S(158) + c * S(18), seaY - S(88) + r * S(16), S(11), S(8));
  poly(ctx, [[cx + S(140), seaY - S(104)], [cx + S(240), seaY - S(104)], [cx + S(234), seaY - S(96)], [cx + S(146), seaY - S(96)]]);
  ctx.fillStyle = '#4a5866'; ctx.fill();
  // derrick midships
  fillRR(ctx, cx - S(40), seaY - S(56), S(80), S(22), S(2), '#9aa6b1');
  derrick(ctx, cx, seaY - S(56), S(170), S(60), S(18), { color: '#dfe6ec', lw: Math.max(1.2, S(2.2)) });
  // pipe racks aft
  ctx.fillStyle = '#7d8a96';
  for (let i = 0; i < 6; i++) ctx.fillRect(cx - S(220) + i * S(26), seaY - S(44), S(20), S(10));
  if (thrusters) {
    for (const ox of [-200, -120, 120, 200]) {
      const x = cx + S(ox), y = seaY + S(38);
      fillRR(ctx, x - S(9), y - S(6), S(18), S(14), S(4), '#7d8a96');
      const a = t * 3 + ox;
      for (let k = 0; k < 4; k++) {
        const ph = ((t * 1.5 + k * 0.25) % 1);
        circle(ctx, x + Math.cos(a) * S(10) * (1 + ph * 3), y + S(10) + ph * S(16), S(2.5) * (1 - ph), rgba('#cfefff', 0.8 * (1 - ph)));
      }
    }
  }
  ctx.restore();
}

// Fixed platform with jacket and platform drilling rig
function platform(ctx, cx, seaY, seabedY, s = 1, t = 0, opt = {}) {
  const { alpha = 1 } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  const S = (v) => v * s;
  const topY = seaY - S(60);
  // jacket
  ctx.strokeStyle = '#d9a036'; ctx.lineWidth = Math.max(2, S(4));
  const legs = [[-130, -170], [-45, -60], [45, 60], [130, 170]];
  ctx.beginPath();
  for (const [a, b] of legs) { ctx.moveTo(cx + S(a), topY); ctx.lineTo(cx + S(b), seabedY); }
  ctx.stroke();
  ctx.lineWidth = Math.max(1, S(2));
  ctx.beginPath();
  const nb = 6;
  for (let i = 0; i <= nb; i++) {
    const f = i / nb, y = lerp(topY, seabedY, f);
    const xl = cx + S(lerp(-130, -170, f)), xr = cx + S(lerp(130, 170, f));
    ctx.moveTo(xl, y); ctx.lineTo(xr, y);
    if (i < nb) {
      const f2 = (i + 1) / nb, y2 = lerp(topY, seabedY, f2);
      ctx.moveTo(xl, y); ctx.lineTo(cx + S(lerp(-45, -60, f2)), y2);
      ctx.moveTo(xr, y); ctx.lineTo(cx + S(lerp(45, 60, f2)), y2);
    }
  }
  ctx.stroke();
  // topsides
  fillRR(ctx, cx - S(170), topY - S(60), S(340), S(60), S(4), '#c5ced6');
  ctx.fillStyle = '#7d8a96';
  for (let i = 0; i < 6; i++) ctx.fillRect(cx - S(160) + i * S(28), topY - S(50), S(22), S(40));
  fillRR(ctx, cx + S(70), topY - S(110), S(90), S(50), S(3), '#eef2f5');
  ctx.fillStyle = '#5c8fb5';
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) ctx.fillRect(cx + S(78) + c * S(20), topY - S(100) + r * S(18), S(12), S(9));
  derrick(ctx, cx - S(60), topY - S(60), S(150), S(52), S(16), { color: '#dfe6ec', lw: Math.max(1.2, S(2)) });
  // flare boom
  line(ctx, cx - S(170), topY - S(40), cx - S(250), topY - S(130), '#9aa6b1', Math.max(1.5, S(3)));
  ctx.restore();
}

// Anchor line from fairlead (x1,y1) to anchor on seabed (x2,y2): catenary-ish curve
function mooringLine(ctx, x1, y1, x2, y2, opt = {}) {
  const { color = '#8fa1b3', lw = 2, t = 1, sag = 0.35 } = opt;
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const f = i / 30;
    const x = lerp(x1, x2, f);
    const yLin = lerp(y1, y2, f);
    // chain hangs then lies on seabed
    const y = Math.min(y2, yLin + Math.sin(f * Math.PI) * (y2 - y1) * sag);
    pts.push([x, y]);
  }
  K.partialPolyline(ctx, pts, t, color, lw);
  if (t >= 1) {
    // anchor
    ctx.save(); ctx.translate(x2, y2);
    poly(ctx, [[-10, 2], [10, 2], [4, -8], [-4, -8]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
    ctx.restore();
  }
  return pts;
}

function ahts(ctx, x, y, s = 1, opt = {}) {
  // anchor handling tug, stern roller to the right
  const { color = '#2f6fb3' } = opt;
  ctx.save(); ctx.translate(x, y);
  const S = (v) => v * s;
  poly(ctx, [[-S(60), -S(10)], [S(60), -S(10)], [S(58), S(8)], [-S(52), S(8)], [-S(66), -S(14)]]);
  ctx.fillStyle = color; ctx.fill();
  fillRR(ctx, -S(55), -S(34), S(34), S(24), S(2), '#eef2f5');
  ctx.fillStyle = '#4aa3d6'; ctx.fillRect(-S(52), -S(30), S(28), S(5));
  ctx.fillStyle = '#42566a'; ctx.fillRect(-S(20), -S(16), S(78), S(6));
  circle(ctx, S(55), -S(10), S(5), '#cfd8e3');
  ctx.restore();
}

module.exports = { sky, sea, waveY, seabed, derrick, semi, jackup, drillship, platform, mooringLine, ahts };

// Detailed semi-submersible with highlightable parts. Returns anchor points for callouts.
// opt: { rise (px up, e.g. transit), ballast 0..1, hl: Set of part names, hlA, moonpoolCut, craneAng, hook, heave, roll }
function semiParts(ctx, cx, seaY, s = 1, t = 0, opt = {}) {
  const { rise = 0, ballast = -1, hl = null, hlA = 1, craneAng = 0, hookLoad = null, roll = 0, alpha = 1, riser = false, seabedY = null } = opt;
  const S = (v) => v * s;
  const by = seaY - rise;
  const A = {};
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.translate(cx, by); ctx.rotate(roll); ctx.translate(-cx, -by);
  const glow = (name, drawPath) => {
    if (!hl || !hl.has(name) || hlA <= 0) return;
    ctx.save(); ctx.globalAlpha *= hlA * (0.6 + 0.4 * K.pulse(t, 1.3));
    drawPath(); ctx.strokeStyle = C.amber; ctx.lineWidth = Math.max(3, S(3)); ctx.shadowColor = C.amber; ctx.shadowBlur = 16; ctx.stroke();
    ctx.restore();
  };
  const hull = '#d9a036';
  // riser through moonpool
  if (riser && seabedY != null) {
    ctx.fillStyle = '#8796a5'; ctx.fillRect(cx - S(5), by - S(100), S(10), seabedY - by + S(100));
  }
  // pontoon (cutaway if ballast >= 0)
  fillRR(ctx, cx - S(210), by + S(70), S(420), S(32), S(14), darken(hull, 0.25));
  if (ballast >= 0) {
    fillRR(ctx, cx - S(196), by + S(75), S(392), S(22), S(8), '#1d2b36');
    ctx.fillStyle = rgba(C.water, 0.9);
    const lv = S(22) * clamp(ballast);
    ctx.fillRect(cx - S(196), by + S(97) - lv, S(392), lv);
  }
  A.pontoon = [cx + S(120), by + S(86)];
  glow('pontoon', () => rr(ctx, cx - S(210), by + S(70), S(420), S(32), S(14)));
  ctx.fillStyle = darken(hull, 0.35);
  ctx.fillRect(cx - S(140), by + S(30), S(280), S(7));
  for (const ox of [-150, 150]) {
    fillRR(ctx, cx + S(ox) - S(24), by - S(48), S(48), S(122), S(8), hull);
    ctx.fillStyle = rgba('#000000', 0.15); ctx.fillRect(cx + S(ox) + S(10), by - S(48), S(14), S(122));
    glow('columns', () => rr(ctx, cx + S(ox) - S(24), by - S(48), S(48), S(122), S(8)));
  }
  A.column = [cx + S(150), by + S(10)];
  // deck box
  fillRR(ctx, cx - S(200), by - S(92), S(400), S(46), S(4), '#c5ced6');
  ctx.fillStyle = rgba('#000000', 0.12); ctx.fillRect(cx - S(200), by - S(56), S(400), S(10));
  A.deckUnder = [cx + S(60), by - S(46)];
  glow('deck', () => rr(ctx, cx - S(200), by - S(92), S(400), S(46), S(4)));
  // moonpool opening
  ctx.fillStyle = '#0b1622'; ctx.fillRect(cx - S(16), by - S(92), S(32), S(46));
  if (riser) { ctx.fillStyle = '#8796a5'; ctx.fillRect(cx - S(5), by - S(92), S(10), S(46)); }
  A.moonpool = [cx, by - S(69)];
  glow('moonpool', () => { ctx.beginPath(); ctx.rect(cx - S(16), by - S(92), S(32), S(46)); });
  // drill floor + derrick
  fillRR(ctx, cx - S(38), by - S(112), S(76), S(22), S(2), '#9aa6b1');
  derrick(ctx, cx, by - S(112), S(175), S(62), S(18), { color: '#dfe6ec', lw: Math.max(1.2, S(2.2)) });
  A.derrick = [cx + S(12), by - S(200)];
  A.floor = [cx + S(38), by - S(101)];
  glow('derrick', () => { ctx.beginPath(); ctx.moveTo(cx - S(31), by - S(112)); ctx.lineTo(cx - S(9), by - S(287)); ctx.lineTo(cx + S(9), by - S(287)); ctx.lineTo(cx + S(31), by - S(112)); ctx.closePath(); });
  // LQ
  fillRR(ctx, cx - S(196), by - S(150), S(78), S(58), S(3), '#eef2f5');
  ctx.fillStyle = '#5c8fb5';
  for (let r = 0; r < 3; r++) for (let c = 0; c < 5; c++) ctx.fillRect(cx - S(190) + c * S(14), by - S(142) + r * S(16), S(9), S(8));
  A.lq = [cx - S(157), by - S(121)];
  glow('lq', () => rr(ctx, cx - S(196), by - S(150), S(78), S(58), S(3)));
  // helideck
  poly(ctx, [[cx - S(232), by - S(156)], [cx - S(118), by - S(156)], [cx - S(124), by - S(150)], [cx - S(226), by - S(150)]]);
  ctx.fillStyle = '#4a5866'; ctx.fill();
  text(ctx, 'H', cx - S(175), by - S(158), { size: S(14), weight: 900, align: 'center', color: C.yellow });
  A.helideck = [cx - S(175), by - S(156)];
  glow('helideck', () => poly(ctx, [[cx - S(232), by - S(156)], [cx - S(118), by - S(156)], [cx - S(124), by - S(150)], [cx - S(226), by - S(150)]]));
  // crane with variable boom angle
  fillRR(ctx, cx + S(130), by - S(128), S(14), S(36), S(2), '#d94b3c');
  const ba = -0.75 + craneAng;
  const bx2 = cx + S(137) + Math.cos(ba) * S(95), by2 = by - S(124) + Math.sin(ba) * S(95);
  line(ctx, cx + S(137), by - S(124), bx2, by2, '#f0c419', Math.max(1.5, S(4)));
  const hookY = hookLoad != null ? hookLoad : by2 + S(40);
  line(ctx, bx2, by2, bx2, hookY, '#8796a5', Math.max(1, S(1.2)));
  A.craneTip = [bx2, by2]; A.hook = [bx2, hookY];
  glow('crane', () => { ctx.beginPath(); ctx.moveTo(cx + S(137), by - S(124)); ctx.lineTo(bx2, by2); });
  fillRR(ctx, cx - S(110), by - S(122), S(12), S(30), S(2), '#d94b3c');
  line(ctx, cx - S(104), by - S(118), cx - S(60), by - S(170), '#f0c419', Math.max(1.5, S(3.5)));
  // lifeboats
  for (const ox of [-198, -178]) {
    ctx.save(); ctx.translate(cx + S(ox), by - S(84)); ctx.rotate(-0.5);
    fillRR(ctx, -S(8), -S(5), S(18), S(9), S(4), C.orange); ctx.restore();
  }
  A.lifeboat = [cx - S(190), by - S(84)];
  glow('lifeboat', () => { ctx.beginPath(); ctx.arc(cx - S(188), by - S(84), S(16), 0, Math.PI * 2); });
  // pipe deck
  ctx.fillStyle = '#7d8a96';
  for (let i = 0; i < 4; i++) ctx.fillRect(cx + S(50) + i * S(16), by - S(98), S(12), S(6));
  ctx.restore();
  return A;
}
module.exports.semiParts = semiParts;
