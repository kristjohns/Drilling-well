// Drill floor and derrick in side elevation, with animatable hoisting/rotating/pipe-handling equipment.
// World coordinates: 1196 x 940 (floor level y = 640). Use a camera to zoom.
'use strict';
const K = require('../engine/core');
const I = require('./icons');
const { C, rgba, fillRR, rr, circle, line, poly, text, lerp, clamp, darken, lighten } = K;

const FLOOR = 640, CROWN = 52, WC = 600;

function makeCam(cx, cy, z, W = 1196, H = 940) {
  return {
    cx, cy, z,
    apply(ctx) { ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy); },
    pt(p) { return [(p[0] - cx) * z + W / 2, (p[1] - cy) * z + H / 2]; },
  };
}

// st: { t, block (0 top .. 1 low), spin, slips, ironR, elevator, hl:Set, hlA, racker, catwalk, stands, gooseneck, ibop }
function drawFloor(ctx, st) {
  const t = st.t || 0;
  const A = {};
  const hl = st.hl || new Set();
  const hlA = st.hlA == null ? 1 : st.hlA;
  const glowPath = (name, fn, col = C.amber) => {
    if (!hl.has(name) || hlA <= 0) return;
    ctx.save(); ctx.globalAlpha *= hlA * (0.55 + 0.45 * K.pulse(t, 1.3));
    fn(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 18; ctx.stroke();
    ctx.restore();
  };
  // background structure
  const bgGrad = ctx.createLinearGradient(0, 0, 0, 940);
  bgGrad.addColorStop(0, '#0d2236'); bgGrad.addColorStop(1, '#0a1826');
  ctx.fillStyle = bgGrad; ctx.fillRect(-600, -600, 2400, 2200);
  // main deck + substructure
  fillRR(ctx, -200, 900, 1600, 80, 0, '#3a4a58');
  ctx.strokeStyle = '#4f6274'; ctx.lineWidth = 4;
  ctx.beginPath();
  for (let x = 400; x <= 800; x += 100) { ctx.moveTo(x, FLOOR + 20); ctx.lineTo(x, 900); }
  for (let x = 400; x < 800; x += 100) { ctx.moveTo(x, FLOOR + 20); ctx.lineTo(x + 100, 900); ctx.moveTo(x + 100, FLOOR + 20); ctx.lineTo(x, 900); }
  ctx.stroke();
  // ---- derrick
  const bl = 450, br = 750, tl = 548, tr = 652;
  ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(bl, FLOOR); ctx.lineTo(tl, CROWN); ctx.moveTo(br, FLOOR); ctx.lineTo(tr, CROWN); ctx.stroke();
  ctx.lineWidth = 2.5; ctx.strokeStyle = rgba('#c9d3dc', 0.75);
  ctx.beginPath();
  const n = 9;
  for (let i = 0; i <= n; i++) {
    const f = i / n, y = lerp(FLOOR, CROWN, f), xl = lerp(bl, tl, f), xr = lerp(br, tr, f);
    ctx.moveTo(xl, y); ctx.lineTo(xl + 14, y); ctx.moveTo(xr, y); ctx.lineTo(xr - 14, y);
    if (i < n) {
      const f2 = (i + 1) / n, y2 = lerp(FLOOR, CROWN, f2);
      ctx.moveTo(xl, y); ctx.lineTo(lerp(bl, tl, f2) + 14, y2);
      ctx.moveTo(xr, y); ctx.lineTo(lerp(br, tr, f2) - 14, y2);
    }
  }
  ctx.stroke();
  A.derrick = [lerp(br, tr, 0.55) + 4, lerp(FLOOR, CROWN, 0.55)];
  glowPath('derrick', () => { ctx.beginPath(); ctx.moveTo(bl, FLOOR); ctx.lineTo(tl, CROWN); ctx.lineTo(tr, CROWN); ctx.lineTo(br, FLOOR); });
  // ---- crown block
  fillRR(ctx, 520, CROWN - 22, 160, 22, 4, '#8fa1b3', '#56687a', 2);
  const crownSheaves = [556, 578, 600, 622, 644];
  const blockY = lerp(130, 470, clamp(st.block == null ? 0.5 : st.block));
  const sheaveRot = (blockY / 12);
  for (const x of crownSheaves) {
    circle(ctx, x, CROWN + 8, 11, '#b4c2cf', '#56687a', 2);
    line(ctx, x, CROWN + 8, x + Math.cos(sheaveRot) * 9, CROWN + 8 + Math.sin(sheaveRot) * 9, '#56687a', 2);
  }
  A.crown = [680, CROWN - 10];
  glowPath('crown', () => rr(ctx, 516, CROWN - 26, 168, 50, 6));
  // ---- drill line falls between crown and travelling block
  ctx.strokeStyle = '#d9dee3'; ctx.lineWidth = 2.2;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) { const x = 568 + i * 9.3; ctx.moveTo(x, CROWN + 12); ctx.lineTo(x, blockY + 6); }
  ctx.stroke();
  // fast line to drawworks drum
  const drumX = 300, drumY = 596;
  ctx.save(); ctx.setLineDash([14, 8]); ctx.lineDashOffset = -blockY * 8;
  line(ctx, 548, CROWN + 8, drumX + 4, drumY - 40, '#d9dee3', 3);
  ctx.restore();
  // dead line to anchor
  line(ctx, 652, CROWN + 8, 880, FLOOR - 26, '#d9dee3', 3);
  A.fastline = [lerp(548, drumX, 0.5), lerp(CROWN, drumY - 40, 0.5)];
  A.drillLine = [610, (CROWN + blockY) / 2];
  glowPath('drillline', () => { ctx.beginPath(); ctx.rect(562, CROWN + 12, 76, blockY - CROWN - 6); ctx.moveTo(548, CROWN + 8); ctx.lineTo(drumX + 4, drumY - 40); });
  // ---- travelling block
  fillRR(ctx, 562, blockY, 76, 56, 10, C.amber, darken(C.amber, 0.4), 2);
  for (let i = 0; i < 4; i++) circle(ctx, 576 + i * 16, blockY + 14, 6, darken(C.amber, 0.35));
  A.block = [638, blockY + 28];
  glowPath('block', () => rr(ctx, 556, blockY - 6, 88, 68, 12));
  // ---- guide rails
  line(ctx, 664, 110, 664, FLOOR - 10, '#6b7c8c', 5);
  // ---- top drive
  const tdY = blockY + 62;
  fillRR(ctx, 596, blockY + 54, 8, 10, 2, '#56687a');
  fillRR(ctx, 560, tdY, 80, 92, 8, '#d94b3c', darken('#d94b3c', 0.4), 2);
  fillRR(ctx, 640, tdY + 20, 26, 34, 4, '#8796a5');
  text(ctx, 'TD', 600, tdY + 54, { size: 22, weight: 900, align: 'center', color: '#fff' });
  // gooseneck + rotary hose to standpipe
  const sx = 476, sy = 330;
  line(ctx, sx, FLOOR, sx, sy, '#7d8a96', 7);
  A.standpipe = [sx, (FLOOR + sy) / 2];
  ctx.beginPath(); ctx.moveTo(sx, sy); ctx.bezierCurveTo(sx - 10, sy - 90, 560, tdY - 70, 590, tdY + 2);
  ctx.strokeStyle = '#2b3d4f'; ctx.lineWidth = 9; ctx.stroke();
  ctx.strokeStyle = '#4a6278'; ctx.lineWidth = 3; ctx.stroke();
  A.hose = [lerp(sx, 590, 0.4), lerp(sy - 60, tdY, 0.4)];
  A.td = [640, tdY + 46];
  glowPath('td', () => rr(ctx, 554, tdY - 6, 118, 104, 10));
  // IBOP + saver sub
  const ibY = tdY + 92;
  fillRR(ctx, 588, ibY, 24, 16, 3, '#9aa6b1', '#56687a', 1.5);
  fillRR(ctx, 588, ibY + 18, 24, 16, 3, '#9aa6b1', '#56687a', 1.5);
  if (st.ibop) { line(ctx, 590, ibY + 8, 610, ibY + 8, C.red, 4); }
  A.ibop = [612, ibY + 16];
  glowPath('ibop', () => rr(ctx, 584, ibY - 4, 32, 42, 4));
  // ---- the pipe from saver sub down through rotary
  const pipeTop = ibY + 34;
  const pipeCol = '#9fb0c1';
  ctx.fillStyle = pipeCol; ctx.fillRect(594, pipeTop, 12, 960 - pipeTop);
  // tool joints
  for (let y = pipeTop + 4; y < 960; y += 150) fillRR(ctx, 590, y, 20, 14, 3, '#b8c6d3');
  // spin lines when rotating
  if (st.spin) {
    const sp = (t * st.spin * 6) % 1;
    ctx.strokeStyle = rgba('#ffffff', 0.7); ctx.lineWidth = 2;
    for (let y = pipeTop + 20; y < FLOOR - 10; y += 34) {
      const off = ((sp * 34) + y) % 34;
      ctx.beginPath(); ctx.moveTo(594, y + off * 0.2); ctx.lineTo(606, y + off * 0.2 - 6); ctx.stroke();
    }
    // rotation arrow around pipe
    K.curvedArrow(ctx, Array.from({ length: 14 }, (_, i) => [600 + Math.cos(-0.3 + i * 0.32) * 34, FLOOR - 70 + Math.sin(-0.3 + i * 0.32) * 10]), { color: C.cyan, lw: 3, head: 10 });
  }
  A.pipe = [606, FLOOR - 140];
  // ---- bails + elevator
  const elY = Math.min(FLOOR - 30, tdY + 190);
  line(ctx, 572, tdY + 70, 584, elY, '#cfd8e3', 4);
  line(ctx, 628, tdY + 70, 616, elY, '#cfd8e3', 4);
  fillRR(ctx, 578, elY - 4, 44, 22, 5, st.elevator === false ? '#56687a' : '#f0c419', '#0b1520', 1.5);
  A.elevator = [622, elY + 7];
  glowPath('elevator', () => { ctx.beginPath(); ctx.moveTo(572, tdY + 70); ctx.lineTo(584, elY); ctx.lineTo(616, elY); ctx.lineTo(628, tdY + 70); ctx.rect(574, elY - 8, 52, 30); });
  // ---- drill floor deck
  fillRR(ctx, -40, FLOOR, 1240, 22, 0, '#5d6f80');
  ctx.fillStyle = '#c5a33a';
  for (let x = -40; x < 1200; x += 40) { ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillRect(x, FLOOR, 20, 4); ctx.restore(); }
  // rotary table
  fillRR(ctx, 548, FLOOR - 6, 104, 18, 3, '#3c4c5c', '#7d8a96', 2);
  A.rotary = [652, FLOOR + 2];
  glowPath('rotary', () => rr(ctx, 544, FLOOR - 10, 112, 26, 4));
  // slips
  const sl = clamp(st.slips || 0);
  if (sl > 0) {
    const yy = lerp(FLOOR - 60, FLOOR - 16, sl);
    ctx.fillStyle = '#e0a83a';
    poly(ctx, [[578, yy], [594, yy], [594, yy + 30], [584, yy + 30]]); ctx.fill();
    poly(ctx, [[606, yy], [622, yy], [616, yy + 30], [606, yy + 30]]); ctx.fill();
  }
  A.slips = [624, FLOOR - 4];
  glowPath('slips', () => rr(ctx, 572, FLOOR - 24, 56, 40, 4));
  // mousehole
  fillRR(ctx, 712, FLOOR - 2, 26, 26, 3, '#0b1520', '#7d8a96', 2);
  if (st.mousehole) { ctx.fillStyle = pipeCol; ctx.fillRect(719, FLOOR - 160, 12, 182); fillRR(ctx, 715, FLOOR - 40, 20, 12, 3, '#b8c6d3'); }
  A.mousehole = [738, FLOOR + 10];
  glowPath('mousehole', () => rr(ctx, 706, FLOOR - 8, 38, 38, 4));
  // ---- iron roughneck (on floor, right of well centre)
  const ir = clamp(st.ironR || 0);
  const irBase = 860;
  const jawX = lerp(irBase - 60, WC + 14, ir);
  fillRR(ctx, irBase - 20, FLOOR - 120, 70, 120, 8, '#e07a1f', darken('#e07a1f', 0.4), 2);
  fillRR(ctx, jawX, FLOOR - 96, irBase - 20 - jawX, 16, 4, '#8796a5');
  fillRR(ctx, jawX - 28, FLOOR - 112, 34, 66, 6, '#e07a1f', darken('#e07a1f', 0.4), 2);
  if (ir > 0.95 && st.ironSpin) {
    for (let k = 0; k < 3; k++) { const a = t * 10 + k * 2.1; circle(ctx, WC + Math.cos(a) * 16, FLOOR - 80 + Math.sin(a) * 4, 3, C.cyan); }
  }
  A.ironR = [irBase + 10, FLOOR - 120];
  glowPath('ironR', () => rr(ctx, jawX - 34, FLOOR - 126, irBase + 56 - jawX + 34, 130, 8));
  // ---- deadline anchor
  fillRR(ctx, 862, FLOOR - 30, 40, 30, 4, '#7d8a96', '#56687a', 2);
  circle(ctx, 882, FLOOR - 18, 8, '#3d8bfd');
  A.deadline = [902, FLOOR - 18];
  glowPath('deadline', () => rr(ctx, 856, FLOOR - 36, 52, 42, 5));
  // ---- drawworks
  fillRR(ctx, 220, 548, 170, 92, 8, '#3d5266', '#56687a', 2);
  const drumA = -(blockY / 10);
  circle(ctx, drumX, drumY, 40, '#8fa1b3', '#56687a', 3);
  ctx.strokeStyle = '#d9dee3'; ctx.lineWidth = 2;
  for (let r = 20; r < 38; r += 5) { ctx.beginPath(); ctx.arc(drumX, drumY, r, 0, Math.PI * 2); ctx.stroke(); }
  line(ctx, drumX, drumY, drumX + Math.cos(drumA) * 38, drumY + Math.sin(drumA) * 38, '#0b1520', 4);
  fillRR(ctx, 350, 570, 30, 50, 4, '#56687a');
  A.drawworks = [390, 560];
  glowPath('drawworks', () => rr(ctx, 214, 542, 182, 104, 10));
  // ---- driller's cabin
  fillRR(ctx, 30, 470, 170, 170, 10, '#2b3d4f', '#56687a', 2);
  fillRR(ctx, 46, 488, 138, 70, 6, '#5fb7e0');
  ctx.fillStyle = rgba('#ffffff', 0.25); ctx.fillRect(52, 492, 40, 20);
  // driller silhouette + screens
  fillRR(ctx, 120, 590, 50, 40, 6, '#1a2733');
  circle(ctx, 110, 572, 10, '#e9c7a3'); I.helmet(ctx, 110, 566, 22, '#ffffff');
  fillRR(ctx, 96, 582, 26, 30, 6, C.orange);
  fillRR(ctx, 50, 572, 32, 22, 3, '#3cc8f2');
  A.cabin = [200, 520];
  glowPath('cabin', () => rr(ctx, 24, 464, 182, 182, 12));
  // ---- setback, fingerboard, monkey board
  const stands = st.stands == null ? 9 : st.stands;
  for (let i = 0; i < stands; i++) {
    const x = 800 + i * 20;
    ctx.fillStyle = pipeCol; ctx.fillRect(x - 5, 140, 10, FLOOR - 140);
    fillRR(ctx, x - 7, 300, 14, 10, 2, '#b8c6d3'); fillRR(ctx, x - 7, 470, 14, 10, 2, '#b8c6d3');
  }
  // fingerboard
  fillRR(ctx, 780, 196, 200, 14, 3, '#7d8a96');
  for (let i = 0; i < 10; i++) fillRR(ctx, 788 + i * 20, 210, 6, 26, 2, '#7d8a96');
  // monkey board with derrickman
  fillRR(ctx, 690, 230, 80, 10, 2, '#9aa6b1');
  I.person(ctx, 728, 200, 46, { shirt: C.orange, helmetColor: '#ffffff' });
  A.setback = [960, FLOOR - 40];
  A.fingerboard = [980, 203];
  A.monkey = [690, 230];
  glowPath('setback', () => rr(ctx, 786, 130, 186, FLOOR - 126, 6));
  glowPath('fingerboard', () => rr(ctx, 774, 190, 212, 52, 6));
  glowPath('monkey', () => rr(ctx, 684, 170, 92, 76, 6));
  // ---- pipe racker column
  const rk = st.racker == null ? 0 : st.racker;
  fillRR(ctx, 1004, 120, 26, FLOOR - 120, 4, '#d9a036', darken('#d9a036', 0.4), 2);
  const armX = lerp(990, 640, clamp(rk));
  line(ctx, 1004, 300, armX, 300, '#d9a036', 8);
  line(ctx, 1004, 560, armX, 560, '#d9a036', 8);
  fillRR(ctx, armX - 14, 290, 20, 20, 4, '#f0c419'); fillRR(ctx, armX - 14, 550, 20, 20, 4, '#f0c419');
  if (st.rackerStand) { ctx.fillStyle = pipeCol; ctx.fillRect(armX - 9, 150, 10, FLOOR - 160); }
  A.racker = [1030, 380];
  glowPath('racker', () => rr(ctx, 996, 112, 42, FLOOR - 104, 6));
  // ---- catwalk machine
  poly(ctx, [[1040, FLOOR + 20], [1200, 880], [1230, 880], [1070, FLOOR + 20]]);
  ctx.fillStyle = '#5d6f80'; ctx.fill();
  const cw = st.catwalk == null ? -1 : st.catwalk;
  if (cw >= 0) {
    const px = lerp(1215, 1060, clamp(cw)), py = lerp(880, FLOOR + 10, clamp(cw));
    ctx.save(); ctx.translate(px, py); ctx.rotate(Math.atan2(FLOOR + 20 - 880, 1070 - 1230));
    fillRR(ctx, -10, -8, 190, 10, 3, pipeCol); ctx.restore();
  }
  A.catwalk = [1150, 780];
  glowPath('catwalk', () => poly(ctx, [[1036, FLOOR + 16], [1204, 884], [1234, 884], [1074, FLOOR + 16]]));
  return A;
}

module.exports = { drawFloor, makeCam, FLOOR, CROWN, WC };
