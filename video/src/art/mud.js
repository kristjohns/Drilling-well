// Mud circulation system schematic (left part of the stage), with flows and highlights.
'use strict';
const K = require('../engine/core');
const R = require('./rig');
const { C, rgba, fillRR, rr, circle, line, poly, text, lerp, clamp, darken } = K;

const PATHS = {
  suction: [[100, 566], [100, 612]],
  discharge: [[262, 650], [545, 650], [545, 432], [548, 110]],
  hose: [[548, 110], [560, 70], [600, 75], [618, 140]],
  string: [[640, 205], [640, 885]],
  annL: [[624, 885], [624, 458]],
  annR: [[656, 885], [656, 458]],
  flowline: [[612, 458], [522, 482]],
  pits: [[370, 535], [60, 535]],
};

// st: { t, flow (0..1), cuttings (bool), hl:Set, hlA, pumpSpm, bubbles, pitLevel, tripTank }
function drawLoop(ctx, st) {
  const t = st.t || 0;
  const hl = st.hl || new Set();
  const hlA = st.hlA == null ? 1 : st.hlA;
  const A = {};
  const glow = (name, fn, col = C.amber) => {
    if (!hl.has(name) || hlA <= 0) return;
    ctx.save(); ctx.globalAlpha *= hlA * (0.55 + 0.45 * K.pulse(t, 1.3));
    fn(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.shadowColor = col; ctx.shadowBlur = 16; ctx.stroke();
    ctx.restore();
  };
  // backgrounds
  ctx.fillStyle = '#0d2236'; ctx.fillRect(-400, -400, 1600, 1800);
  // formation around well
  K.lithoFill(ctx, 'rock3', 560, 600, 40, 330, 3); K.lithoFill(ctx, 'rock3', 680, 600, 40, 330, 4);
  K.lithoFill(ctx, 'rock2', 560, 600, 160, 0, 4);
  // decks
  fillRR(ctx, 20, 565, 520, 10, 0, '#4f6274');
  fillRR(ctx, 20, 700, 520, 10, 0, '#4f6274');
  fillRR(ctx, 520, 430, 260, 12, 0, '#5d6f80');
  // derrick
  ctx.strokeStyle = '#c9d3dc'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(560, 430); ctx.lineTo(616, 50); ctx.moveTo(720, 430); ctx.lineTo(664, 50); ctx.stroke();
  ctx.lineWidth = 1.5; ctx.strokeStyle = rgba('#c9d3dc', 0.6); ctx.beginPath();
  for (let i = 0; i < 7; i++) { const f = i / 7, f2 = (i + 1) / 7; ctx.moveTo(lerp(560, 616, f), lerp(430, 50, f)); ctx.lineTo(lerp(720, 664, f2), lerp(430, 50, f2)); ctx.moveTo(lerp(720, 664, f), lerp(430, 50, f)); ctx.lineTo(lerp(560, 616, f2), lerp(430, 50, f2)); }
  ctx.stroke();
  fillRR(ctx, 600, 40, 80, 14, 3, '#8fa1b3');
  // top drive
  fillRR(ctx, 604, 130, 72, 76, 8, '#d94b3c', darken('#d94b3c', 0.4), 2);
  text(ctx, 'TD', 640, 178, { size: 20, weight: 900, align: 'center', color: '#fff' });
  A.td = [676, 168];
  // riser below floor
  fillRR(ctx, 606, 442, 8, 160, 0, '#7d8a96'); fillRR(ctx, 666, 442, 8, 160, 0, '#7d8a96');
  // well: hole
  ctx.fillStyle = '#5e4128'; ctx.fillRect(614, 442, 52, 470);
  ctx.fillRect(600, 600, 80, 312);
  // casing in well
  fillRR(ctx, 604, 600, 6, 170, 0, '#b8c4cf'); fillRR(ctx, 670, 600, 6, 170, 0, '#b8c4cf');
  // annulus highlight
  glow('annulus', () => { ctx.beginPath(); ctx.rect(612, 450, 56, 440); });
  A.annulus = [668, 760];
  // drill string
  ctx.fillStyle = '#9fb0c1'; ctx.fillRect(634, 206, 12, 680);
  // bit
  poly(ctx, [[624, 884], [656, 884], [650, 900], [630, 900]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
  A.bit = [656, 892];
  A.string = [646, 360];
  // bell nipple + flowline
  fillRR(ctx, 600, 448, 80, 16, 3, '#7d8a96');
  A.bell = [600, 456];
  ctx.strokeStyle = '#3d5266'; ctx.lineWidth = 12; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(PATHS.flowline[0][0], PATHS.flowline[0][1]); ctx.lineTo(PATHS.flowline[1][0], PATHS.flowline[1][1]); ctx.stroke();
  A.flowline = [566, 470];
  glow('flowline', () => { ctx.beginPath(); ctx.moveTo(612, 458); ctx.lineTo(522, 482); });
  // shakers
  fillRR(ctx, 392, 470, 130, 36, 4, '#3d5266', '#56687a', 2);
  const vib = Math.sin(t * 40) * 1.5;
  ctx.strokeStyle = '#cfd8e3'; ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(400 + i * 20, 478 + vib); ctx.lineTo(412 + i * 20, 498 + vib); ctx.stroke(); }
  A.shakers = [456, 470];
  glow('shakers', () => rr(ctx, 386, 464, 142, 48, 6));
  // cuttings skip
  fillRR(ctx, 430, 520, 90, 40, 4, '#6b7c8c', '#56687a', 2);
  text(ctx, 'cuttings', 475, 546, { size: 14, weight: 700, align: 'center', color: '#0b1520' });
  A.skip = [520, 540];
  // pits
  const lvl = st.pitLevel == null ? 0.7 : st.pitLevel;
  fillRR(ctx, 40, 505, 340, 60, 4, '#22384b', '#56687a', 2);
  ctx.fillStyle = C.mud; ctx.fillRect(43, 562 - 54 * lvl, 334, 54 * lvl);
  for (let i = 1; i < 4; i++) line(ctx, 40 + i * 85, 505, 40 + i * 85, 565, '#56687a', 2);
  A.pits = [210, 565];
  glow('pits', () => rr(ctx, 34, 499, 352, 72, 6));
  // solids units on pits
  const unit = (x, w, col, name) => { fillRR(ctx, x, 455, w, 46, 6, col, darken(col, 0.4), 2); text(ctx, name, x + w / 2, 484, { size: 13, weight: 800, align: 'center', color: '#0b1520' }); };
  unit(270, 90, '#8fa6bb', 'DEGASSER');
  // hydrocyclones as cones
  fillRR(ctx, 175, 455, 86, 46, 6, '#9fb8c9', darken('#9fb8c9', 0.4), 2);
  for (let i = 0; i < 4; i++) poly(ctx, [[182 + i * 20, 460], [196 + i * 20, 460], [190 + i * 20, 494]]), ctx.fillStyle = '#56687a', ctx.fill();
  unit(60, 105, '#b0bcc7', 'CENTRIFUGE');
  A.degasser = [315, 455]; A.cyclones = [218, 455]; A.centrifuge = [112, 455];
  glow('degasser', () => rr(ctx, 264, 449, 102, 58, 6));
  glow('cyclones', () => rr(ctx, 169, 449, 98, 58, 6));
  glow('centrifuge', () => rr(ctx, 54, 449, 117, 58, 6));
  // trip tank next to the well on the floor
  const tt = st.tripTank == null ? 0.55 : st.tripTank;
  fillRR(ctx, 740, 330, 30, 100, 4, '#22384b', '#56687a', 2);
  ctx.fillStyle = C.mud; ctx.fillRect(743, 427 - 94 * tt, 24, 94 * tt);
  A.tripTank = [770, 360];
  glow('triptank', () => rr(ctx, 734, 324, 42, 112, 6));
  // mud pumps
  fillRR(ctx, 40, 612, 222, 80, 8, '#2b3d4f', '#56687a', 2);
  const spm = st.pumpSpm == null ? 100 : st.pumpSpm;
  const ang = t * (spm / 60) * Math.PI * 2;
  for (let i = 0; i < 3; i++) {
    const off = Math.sin(ang + (i * Math.PI * 2) / 3) * 10;
    fillRR(ctx, 62 + i * 64, 626 + off, 44, 30, 4, C.steel);
    fillRR(ctx, 78 + i * 64, 654 + off, 12, 30, 3, C.steelMid);
  }
  A.pumps = [262, 640];
  glow('pumps', () => rr(ctx, 34, 606, 234, 92, 10));
  // pipes: suction, discharge, standpipe, hose
  ctx.strokeStyle = '#3d5266'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(100, 566); ctx.lineTo(100, 612); ctx.stroke();
  ctx.beginPath(); PATHS.discharge.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  A.standpipe = [545, 300];
  glow('standpipe', () => { ctx.beginPath(); ctx.moveTo(545, 432); ctx.lineTo(548, 110); });
  ctx.strokeStyle = '#2b3d4f'; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(548, 110); ctx.bezierCurveTo(552, 50, 610, 60, 618, 136); ctx.stroke();
  A.hose = [585, 66];
  // flows
  const f = st.flow == null ? 1 : st.flow;
  if (f > 0) {
    const opt = { spacing: 26, speed: 70 * f, color: C.mudLight, r: 4.5 };
    K.flow(ctx, PATHS.suction, t, opt);
    K.flow(ctx, PATHS.discharge, t, opt);
    K.flow(ctx, PATHS.hose, t, opt);
    K.flow(ctx, PATHS.string, t, { ...opt, color: '#f0c891' });
    K.flow(ctx, PATHS.annL, t, opt); K.flow(ctx, PATHS.annR, t, opt);
    K.flow(ctx, PATHS.flowline, t, opt);
    K.flow(ctx, PATHS.pits, t, { ...opt, speed: 40 * f });
  }
  if (st.cuttings) {
    for (let k = 0; k < 14; k++) {
      const ph = (t * 0.12 + k / 14) % 1;
      const y = lerp(885, 460, ph);
      const x = (k % 2 ? 624 : 656) + Math.sin(k * 7 + t) * 3;
      circle(ctx, x, y, 3, '#e8dcc0');
    }
    for (let k = 0; k < 4; k++) { const ph = (t * 0.8 + k / 4) % 1; circle(ctx, 512 + ph * 8, 500 + ph * 30, 3, '#e8dcc0'); }
  }
  if (st.bubbles) {
    for (let k = 0; k < 10; k++) {
      const ph = (t * 0.4 + k / 10) % 1;
      circle(ctx, 290 + (k % 4) * 18, 500 - ph * 120, 4 * (1 - ph * 0.5), rgba(C.gas, 0.9 * (1 - ph)));
    }
  }
  return A;
}

module.exports = { drawLoop, PATHS };
