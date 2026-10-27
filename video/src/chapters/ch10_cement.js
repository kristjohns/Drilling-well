'use strict';
const K = require('../engine/core');
const ST = require('../art/string');
const I = require('../art/icons');
const G = require('../art/geo');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, dimLine } = K;

// geometry of the cementing schematic
const X = 330, TOP = 150, PREV_SHOE = 420, SHOE = 870, FC = 810;
const IN_HW = 46, OUT_HW = 56, HOLE_HW = 92, PREV_HW = 100;
const LIN = SHOE - TOP; // path length inside casing
const VSP = 100, VL = 360, VT = 200;
const S_FC = FC - TOP;
const P_END = S_FC + VSP + VL + VT;
const COL = { mud: '#6a4628', spacer: '#5fb7d8', lead: '#b9bec4', tail: '#868d95', disp: '#7a5129' };

// draw a fluid segment [s0, s1] along the path (inside down, then annulus up)
function seg(ctx, s0, s1, col) {
  if (s1 <= s0) return;
  // inside part
  const a0 = clamp(s0, 0, LIN), a1 = clamp(s1, 0, LIN);
  if (a1 > a0) { ctx.fillStyle = col; ctx.fillRect(X - IN_HW, TOP + a0, IN_HW * 2, a1 - a0); }
  // annulus part (from shoe upwards)
  const b0 = clamp(s0 - LIN, 0, LIN), b1 = clamp(s1 - LIN, 0, LIN);
  if (b1 > b0) {
    const y0 = SHOE - b1, y1 = SHOE - b0;
    for (let y = y0; y < y1; y += 3) {
      const outer = y < PREV_SHOE ? PREV_HW - 6 : HOLE_HW;
      ctx.fillStyle = col;
      ctx.fillRect(X - outer, y, outer - OUT_HW, 3.5);
      ctx.fillRect(X + OUT_HW, y, outer - OUT_HW, 3.5);
    }
  }
  // around the shoe (bottom gap)
  if (s0 < LIN + 4 && s1 > LIN - 4) { ctx.fillStyle = col; ctx.fillRect(X - HOLE_HW, SHOE, HOLE_HW * 2, 18); }
}
function cementWell(ctx, t, P, opt = {}) {
  // formation
  K.lithoFill(ctx, 'clay', 0, 60, 760, 360, 3);
  K.lithoFill(ctx, 'rock3', 0, 420, 760, 260, 5);
  K.lithoFill(ctx, 'shale', 0, 680, 760, 260, 7);
  ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, 760, 60);
  // hole: previous casing ID above PREV_SHOE, open hole below
  ctx.fillStyle = COL.mud; ctx.fillRect(X - PREV_HW + 6, 60, (PREV_HW - 6) * 2, PREV_SHOE - 60); ctx.fillRect(X - HOLE_HW, PREV_SHOE, HOLE_HW * 2, SHOE + 18 - PREV_SHOE);
  // previous casing (already cemented)
  ctx.fillStyle = C.cement; ctx.fillRect(X - PREV_HW - 40, 60, 34, PREV_SHOE - 60); ctx.fillRect(X + PREV_HW + 6, 60, 34, PREV_SHOE - 60);
  ST.metal(ctx, X - PREV_HW - 6, 60, 10, PREV_SHOE - 60, '#b8c4cf'); ST.metal(ctx, X + PREV_HW - 4, 60, 10, PREV_SHOE - 60, '#b8c4cf');
  // fluids
  const sTop = P - VSP - VL - VT; // position of top plug
  seg(ctx, 0, LIN * 2, COL.mud);
  seg(ctx, Math.max(0, P - VSP), P, COL.spacer);
  seg(ctx, Math.max(0, P - VSP - VL), Math.max(0, P - VSP), opt.setting ? K.mix(COL.lead, '#d8dde2', opt.setting) : COL.lead);
  seg(ctx, Math.max(0, sTop), Math.max(0, P - VSP - VL), opt.setting ? K.mix(COL.tail, '#a5abb2', opt.setting) : COL.tail);
  if (sTop > 0) seg(ctx, 0, Math.min(sTop, S_FC), COL.disp);
  // casing being cemented
  ST.metal(ctx, X - OUT_HW, TOP - 90, OUT_HW - IN_HW, SHOE - TOP + 90, '#c8d3dd');
  ST.metal(ctx, X + IN_HW, TOP - 90, OUT_HW - IN_HW, SHOE - TOP + 90, '#c8d3dd');
  // float collar & shoe
  fillRR(ctx, X - IN_HW, FC - 6, IN_HW * 2, 12, 3, '#56687a');
  ctx.beginPath(); ctx.moveTo(X - OUT_HW, SHOE); ctx.lineTo(X + OUT_HW, SHOE); ctx.quadraticCurveTo(X + OUT_HW, SHOE + 20, X, SHOE + 22); ctx.quadraticCurveTo(X - OUT_HW, SHOE + 20, X - OUT_HW, SHOE); ctx.closePath();
  ctx.fillStyle = '#c9cfd6'; ctx.fill();
  // plugs
  const bp = Math.min(P - VSP, S_FC - 14);
  if (P - VSP > 0 && opt.plugs !== false) fillRR(ctx, X - IN_HW + 3, TOP + bp, IN_HW * 2 - 6, 14, 5, '#e05a4a');
  const tp = Math.min(sTop, S_FC - 28);
  if (sTop > 0 && opt.plugs !== false) fillRR(ctx, X - IN_HW + 3, TOP + tp, IN_HW * 2 - 6, 14, 5, '#1f2937', '#56687a', 1.5);
  // cement head on top
  fillRR(ctx, X - 40, TOP - 130, 80, 40, 6, '#7d8a96', '#56687a', 2);
  line(ctx, X + 40, TOP - 110, 560, TOP - 110, '#3d5266', 10);
  if (opt.pumping) K.flow(ctx, [[560, TOP - 110], [X + 40, TOP - 110]], t, { spacing: 26, speed: 70, color: '#d3d7db', r: 4 });
  fillRR(ctx, 560, TOP - 150, 160, 80, 8, '#2b3d4f', '#56687a', 2);
  text(ctx, 'cement unit', 640, TOP - 104, { size: 18, weight: 800, align: 'center', color: C.text });
  return { sTop };
}
function legend(ctx, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  const items = [['mud', COL.mud], ['spacer', COL.spacer], ['lead slurry', COL.lead], ['tail slurry', COL.tail], ['displacement mud', COL.disp]];
  items.forEach(([n, col], i) => { fillRR(ctx, 800, 640 + i * 46, 34, 30, 6, col, '#0b1520', 1.5); text(ctx, n, 848, 664 + i * 46, { size: 22, weight: 700, color: C.text }); });
  ctx.restore();
}
const PSCHED = [[0, 120], [120, 320], [320, 760], [760, 940], [940, P_END]];

const jobScene = {
  id: 'job',
  title: 'The primary cement job',
  blurb: 'Pumping cement down the casing and up into the annulus.',
  beats: [
    {
      term: 'Cement job', no: 'sementering',
      def: 'Primary cementing: pumping cement slurry down inside the casing and out into the annulus, where it sets to bond the casing to the formation and seal the annulus. The cement is a well barrier element.',
      ex: 'Cement job is planned for tonight once the casing is on bottom.',
      say: 'After each casing is run, it is cemented. Cement slurry is pumped down inside the casing, out through the shoe, and up into the annulus. When it sets, it holds the casing in place and seals the annulus. That cement is a well barrier element.',
    },
    {
      term: 'Spacer', no: 'spacer / vaskevæske',
      def: 'A fluid pumped ahead of the cement to separate it from the mud, which would contaminate it, and to clean the mud and filter cake off the hole wall for a good bond.',
      say: 'First a spacer is pumped. It separates the cement from the mud, which would contaminate it, and it scrubs the hole wall clean so the cement can bond.',
    },
    {
      term: 'Lead & tail slurry', no: 'lead / tail',
      def: 'Usually two slurries: a lighter lead slurry that fills the upper annulus, followed by a denser, stronger tail slurry placed around the shoe, where strength matters most.',
      say: 'Then the cement, usually two slurries. A lighter lead slurry fills the upper part of the annulus, followed by a heavier, stronger tail slurry that ends up around the shoe.',
    },
    {
      term: 'Plugs & bumping the plug', no: 'sementplugger',
      def: 'Rubber wiper plugs separate the fluids inside the casing: the bottom plug runs ahead of the cement and ruptures at the float collar; the top plug follows the cement. When it lands, a pressure rise, “bumping the plug”, marks the end of the job.',
      ex: 'Plug bumped at 2,840 strokes, 20 bar over, floats holding.',
      say: 'Rubber plugs keep the fluids apart inside the casing. The bottom plug runs ahead of the cement and ruptures when it lands on the float collar. The top plug follows the cement. When it lands, the pressure jumps: bumping the plug, the end of the job.',
    },
    {
      term: 'Displacement', no: 'fortrengning',
      def: 'Pumping mud behind the top plug to push the cement out of the casing and into the annulus. The volume is calculated precisely from the casing capacity and counted in strokes.',
      say: 'Pumping mud behind the top plug is called displacement. The volume is calculated exactly from the casing capacity, and counted in pump strokes until the plug bumps.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const [p0, p1] = PSCHED[bi];
    const fr = clamp(S.bt / Math.max(1, S.bd - 0.6));
    const P = lerp(p0, p1, ease.inOut(fr));
    cementWell(ctx, t, P, { pumping: P < P_END - 1 });
    legend(ctx, 1);
    fillRR(ctx, 800, 120, 360, 480, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
    const steps = ['spacer', 'bottom plug', 'lead slurry', 'tail slurry', 'top plug', 'displace', 'bump!'];
    const done = P >= P_END - 2 ? 7 : P > 940 ? 6 : P > 760 ? 5 : P > 600 ? 4 : P > 320 ? 3 : P > 120 ? 2 : P > 20 ? 1 : 0;
    text(ctx, 'SEQUENCE', 980, 165, { size: 22, weight: 900, align: 'center', color: C.amber, spacing: 2 });
    steps.forEach((s2, i) => {
      const on = i < done;
      circle(ctx, 840, 210 + i * 54, 14, on ? C.green : 'transparent', on ? C.green : C.faint, 2);
      text(ctx, s2, 870, 218 + i * 54, { size: 24, weight: on ? 800 : 500, color: on ? C.text : C.faint });
    });
    if (bi === 3 && P > 900) callout(ctx, X + IN_HW, FC - 20, 560, 640, 'plugs at float collar', { color: C.red, size: 20, t: 1 });
    if (P >= P_END - 1) {
      gauge(ctx, 640, 300, 70, 80 + 30 * K.pulse(t, 0.6), { min: 0, max: 200, unit: 'bar', label: 'BUMP', color: C.red });
    }
    if (bi === 0) callout(ctx, X + 80, 600, 560, 520, 'annulus to be cemented', { color: C.amber, size: 20, t: S.p(0, 0.6, 2) });
  },
};

const afterScene = {
  id: 'aftercement',
  title: 'After the job: WOC, TOC and evaluation',
  blurb: 'Waiting, checking and repairing the cement.',
  beats: [
    {
      term: 'Wait on cement', abbr: 'WOC', no: 'venter på sement',
      def: 'Time spent waiting for the cement to set and build compressive strength before drilling out, pressure testing or putting load on it. Lab tests on the slurry tell how long.',
      ex: 'We’re WOC for 12 hours, then drill out.',
      say: 'Next you wait on cement, WOC, while it sets and builds strength. Lab tests on the slurry tell you how long, and you will see WOC hours in the daily report.',
    },
    {
      term: 'Top of cement', abbr: 'TOC', no: 'sementtopp',
      def: 'The highest point of the cement in the annulus. It is planned so the cement covers zones that must be isolated and the required barrier length, and verified by job data, logs or both.',
      ex: 'Planned TOC is 200 metres inside the previous shoe.',
      say: 'The top of cement, TOC, is the highest point the cement reaches in the annulus. It is planned to cover the zones that must be isolated, often extending up inside the previous casing, and it must be verified.',
    },
    {
      term: 'Cement bond log', abbr: 'CBL', no: 'sementbindingslogg',
      def: 'An acoustic or ultrasonic log run inside the casing to evaluate the cement: how well it bonds to casing and formation, where the top of cement is, and whether there are channels.',
      say: 'A cement bond log, CBL, is an acoustic log run inside the casing. Well bonded cement damps the sound, free pipe rings. It shows the top of cement and any channels.',
    },
    {
      term: 'Squeeze cementing', abbr: 'squeeze', no: 'klemsementering',
      def: 'A remedial job: cement is forced under pressure into channels, a poor cement sheath or perforations, to repair zonal isolation.',
      say: 'If the primary cement is poor, a squeeze job forces cement under pressure into the channels or through perforations, to repair the seal.',
    },
    {
      term: 'Cement plug', no: 'sementplugg',
      def: 'A column of cement set inside the hole or casing, often with the balanced-plug method through a stinger. Used to kick off a sidetrack, cure losses, or as a barrier when plugging the well.',
      ex: 'Set a balanced plug from 2,450 to 2,300 metres, then dress it off.',
      say: 'A cement plug is a column of cement set inside the hole or casing. It is used to kick off a sidetrack, to stop losses, or as a permanent barrier when the well is plugged and abandoned.',
    },
    {
      term: 'Casing pressure test', no: 'trykktest',
      def: 'Pressuring up inside the casing to a specified test pressure and holding it, typically 10 minutes stable with low decline, to verify the casing and float/shoe integrity. Recorded on a chart as barrier verification.',
      ex: 'Casing test to 300 bar for 10 minutes, good test.',
      say: 'Finally the casing is pressure tested: pumped up to a test pressure and held, often for ten minutes, with only a small allowed drop. The chart is kept as proof that this barrier element works.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 1) {
      const setting = bi === 0 ? S.p(0, 6, 1) : 1;
      cementWell(ctx, t, P_END, { setting, plugs: true });
      if (bi === 1) legend(ctx, 0.9);
      if (bi === 0) {
        I.clock(ctx, 980, 260, 160, t * 1.5);
        text(ctx, 'WOC', 980, 400, { size: 40, weight: 900, align: 'center', color: C.amber });
        gauge(ctx, 980, 540, 70, 500 * setting, { min: 0, max: 800, unit: 'psi', label: 'compressive strength', color: C.green });
      } else {
        const tocY = SHOE - (P_END - VSP - LIN);
        line(ctx, X - 140, tocY, X + 140, tocY, C.amber, 3, [10, 6]);
        callout(ctx, X + 100, tocY, 560, 250, 'TOP OF CEMENT', { color: C.amber, size: 24, t: S.p(1, 0.6, 0.6), sub: 'inside the previous casing' });
        dimLine(ctx, 620, tocY, 620, PREV_SHOE, '', { color: C.cyan, alpha: S.p(1, 0.6, 3) });
        text(ctx, 'overlap', 640, (tocY + PREV_SHOE) / 2 + 8, { size: 20, weight: 700, color: C.cyan, alpha: S.p(1, 0.6, 3) });
      }
    }
    if (bi === 2) {
      cementWell(ctx, t, P_END, { setting: 1 });
      // tool moving up with acoustic rings
      const ty = lerp(820, 200, (S.since(2) * 0.1) % 1);
      ST.metal(ctx, X - 10, 0, 20, ty, '#9fb0c1');
      fillRR(ctx, X - 18, ty, 36, 70, 6, C.cyan);
      for (let k = 0; k < 3; k++) { const ph = (t * 1.5 + k / 3) % 1; ctx.save(); ctx.globalAlpha *= 1 - ph; circle(ctx, X, ty + 35, 20 + ph * 60, null, C.cyan, 2); ctx.restore(); }
      // log track
      const lx = 820, ly = 120, lh = 760;
      fillRR(ctx, lx, ly, 320, lh, 8, '#f3f0e8', '#8c8c8c', 2);
      text(ctx, 'CBL amplitude', lx + 160, ly - 14, { size: 18, weight: 800, align: 'center', color: C.text });
      ctx.beginPath();
      const tocY = SHOE - (P_END - VSP - LIN);
      for (let y = 150; y <= 880; y += 4) {
        const free = y < tocY;
        const amp = free ? 0.85 + Math.sin(y * 0.3) * 0.05 : 0.15 + Math.sin(y * 0.2) * 0.04 + (y > 560 && y < 600 ? 0.4 : 0);
        const px = lx + 20 + amp * 280;
        const yy = ly + ((y - 150) / 730) * lh;
        y === 150 ? ctx.moveTo(px, yy) : ctx.lineTo(px, yy);
      }
      ctx.strokeStyle = '#c0392b'; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, 'free pipe (rings)', lx + 300, ly + 60, { size: 16, weight: 800, align: 'right', color: '#333' });
      text(ctx, 'good bond (quiet)', lx + 30, ly + lh - 40, { size: 16, weight: 800, color: '#333' });
      text(ctx, '← channel?', lx + 200, ly + ((580 - 150) / 730) * lh, { size: 16, weight: 800, color: '#c0392b' });
    }
    if (bi === 3) {
      cementWell(ctx, t, P_END, { setting: 1 });
      // channel of mud in annulus
      ctx.fillStyle = COL.mud; ctx.fillRect(X + OUT_HW, 560, HOLE_HW - OUT_HW, 120);
      const sq = S.p(3, 3, 3);
      for (let k = 0; k < 4; k++) { ctx.fillStyle = '#ffd23f'; ctx.fillRect(X + IN_HW, 580 + k * 26, OUT_HW - IN_HW + 2, 6); }
      if (sq > 0) { ctx.fillStyle = rgba(C.cement, sq); ctx.fillRect(X + OUT_HW, 560, HOLE_HW - OUT_HW, 120); for (let k = 0; k < 4; k++) arrow(ctx, X, 590 + k * 26, X + OUT_HW + 20, 590 + k * 26, { color: C.cement, lw: 3, head: 10, alpha: 1 - sq * 0.5 }); }
      callout(ctx, X + 80, 620, 560, 520, sq > 0.9 ? 'channel squeezed' : 'mud channel', { color: sq > 0.9 ? C.green : C.red, size: 22, t: S.p(3, 0.6, 0.6) });
      tag(ctx, 'perforations', 560, 720, { size: 20, color: C.yellow, alpha: S.p(3, 0.6, 1.5) });
    }
    if (bi === 4) {
      K.lithoFill(ctx, 'rock3', 0, 0, 760, 940, 4);
      ctx.fillStyle = COL.mud; ctx.fillRect(X - 70, 0, 140, 940);
      const p = S.p(4, 6, 1);
      // stinger
      const stTop = lerp(0, -200, clamp((p - 0.6) / 0.4));
      const plugTop = 520, plugBot = 760;
      const fill = clamp(p / 0.6);
      ctx.fillStyle = COL.tail; ctx.fillRect(X - 70, plugBot - (plugBot - plugTop) * fill, 140, (plugBot - plugTop) * fill);
      K.speckle(ctx, X - 70, plugBot - (plugBot - plugTop) * fill, 140, (plugBot - plugTop) * fill, 80, rgba('#000', 0.2), 3);
      ST.metal(ctx, X - 10, stTop, 20, plugBot - stTop + (p < 0.6 ? 0 : -260 * clamp((p - 0.6) / 0.4)), '#9fb0c1');
      text(ctx, p < 0.6 ? 'pump cement through the stinger…' : '…pull out slowly: balanced plug', 560, 300, { size: 24, weight: 800, color: C.text });
      dimLine(ctx, X + 110, plugTop, X + 110, plugBot, 'cement plug', { color: C.amber, size: 22, alpha: S.p(4, 0.6, 4) });
      ['kick off a sidetrack', 'cure losses', 'P&A barrier'].forEach((u, i) => text(ctx, '•  ' + u, 820, 520 + i * 44, { size: 22, weight: 700, color: C.text, alpha: S.p(4, 0.4, 6 + i * 0.5) }));
    }
    if (bi === 5) {
      const gx = 140, gy = 160, gw = 900, gh = 560;
      fillRR(ctx, gx - 70, gy - 60, gw + 110, gh + 130, 16, 'rgba(7,17,28,0.8)', C.panelEdge, 2);
      line(ctx, gx, gy + gh, gx + gw, gy + gh, C.dim, 3); line(ctx, gx, gy, gx, gy + gh, C.dim, 3);
      text(ctx, 'time (min) →', gx + gw / 2, gy + gh + 44, { size: 18, weight: 700, align: 'center', color: C.dim });
      text(ctx, 'pressure (bar)', gx - 50, gy - 20, { size: 18, weight: 700, color: C.dim });
      const p = S.p(5, 7, 0.5, ease.linear);
      const f = (u) => (u < 0.25 ? u / 0.25 * 0.85 : u < 0.85 ? 0.85 - (u - 0.25) * 0.03 : 0.85 - 0.018 - (u - 0.85) * 5.5);
      const pts = [];
      for (let u = 0; u <= p; u += 0.004) pts.push([gx + u * gw, gy + gh - Math.max(0, f(u)) * gh]);
      K.partialPolyline(ctx, pts, 1, C.green, 5);
      line(ctx, gx, gy + gh - 0.85 * gh, gx + gw, gy + gh - 0.85 * gh, rgba(C.amber, 0.6), 2, [10, 8]);
      text(ctx, 'test pressure 300 bar', gx + gw - 10, gy + gh - 0.85 * gh - 14, { size: 18, weight: 800, align: 'right', color: C.amber });
      if (p > 0.3) { dimLine(ctx, gx + 0.25 * gw, gy + 60, gx + 0.85 * gw, gy + 60, '10 min hold', { color: C.cyan, size: 20 }); }
      if (p > 0.86) tag(ctx, '✓ GOOD TEST', gx + gw * 0.55, gy + gh * 0.5, { size: 28, color: C.green, fill: 'rgba(7,17,28,0.9)' });
    }
  },
};

module.exports = {
  id: 'ch10', num: 10, title: 'Cementing',
  subtitle: 'Bonding the casing in place, and proving it worked',
  topics: ['Cement job', 'Spacer', 'Lead & tail', 'Plugs', 'Bump the plug', 'Displacement', 'WOC', 'TOC', 'CBL', 'Squeeze', 'Cement plug', 'Casing test'],
  intro: 'Chapter ten: cementing. Every casing string is cemented in place, and the cement becomes part of the well’s barriers, so the cement job gets a lot of attention.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.translate(0, -40);
    cementWell(ctx, t, 300 + (t * 60) % 1000, { pumping: true });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [jobScene, afterScene],
};
