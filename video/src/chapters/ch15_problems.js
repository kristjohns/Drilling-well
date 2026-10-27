'use strict';
const K = require('../engine/core');
const WL = require('../art/well');
const ST = require('../art/string');
const I = require('../art/icons');
const WG = require('../art/widgets');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, darken, richLine } = K;

const PW = {
  cx: 300, seabed: 0, td: 900,
  layers: [{ to: 230, kind: 'clay' }, { to: 470, kind: 'shale' }, { to: 640, kind: 'sand' }, { to: 800, kind: 'shale' }, { to: 940, kind: 'rock4' }],
  strings: [{ hw: 50, holeHw: 62, top: 0, shoe: 220, toc: 0 }, { hw: 38, holeHw: 50, top: 0, shoe: 430, toc: 300 }],
  hole: { hw: 28, to: 890 },
};
const CX = PW.cx;
function pipe(ctx, x, y1, y2, w = 12) {
  if (y2 <= y1) return;
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  g.addColorStop(0, '#7d8a96'); g.addColorStop(0.5, '#d0dae3'); g.addColorStop(1, '#6b7885');
  ctx.fillStyle = g; ctx.fillRect(x - w / 2, y1, w, y2 - y1);
}
function bha(ctx, x, to, opt = {}) {
  const { len = 150 } = opt;
  ST.metal(ctx, x - 11, to - len, 22, len - 16, '#97a8b8');
  ST.metal(ctx, x - 18, to - len + 30, 36, 18, '#c5ced6');
  poly(ctx, [[x - 15, to - 16], [x + 15, to - 16], [x + 9, to], [x - 9, to]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
}
function stageFrame(ctx, x, y, w, h, title, color = C.dim) { WG.panel(ctx, x, y, w, h, title, color); }

// ------------------------------------------------------------ stuck pipe and fishing
function miniSketch(ctx, x, y, w, h, kind, t) {
  stageFrame(ctx, x, y, w, h, kind.toUpperCase(), C.amber);
  ctx.save(); rr(ctx, x + 6, y + 50, w - 12, h - 56, 10); ctx.clip();
  const cx = x + w / 2;
  if (kind === 'key seat') {
    K.lithoFill(ctx, 'shale', x, y + 50, w, h - 50, 3);
    const path = [[cx - 30, y + 50], [cx - 20, y + 130], [cx + 30, y + 220], [cx + 40, y + h]];
    K.partialPolyline(ctx, path, 1, C.mud, 54);
    K.partialPolyline(ctx, [[cx - 6, y + 50], [cx + 2, y + 130], [cx + 2, y + 175]], 1, '#3b2614', 12);
    ST.metal(ctx, cx - 17, y + 170, 34, 70, '#97a8b8');
    line(ctx, cx - 4, y + 50, cx - 4, y + 170, '#c5ced6', 6);
    I.xmark(ctx, cx + 42, y + 160, 26, C.red);
  } else if (kind === 'ledge') {
    for (let k = 0; k < 5; k++) K.lithoFill(ctx, k % 2 ? 'sand' : 'shale', x, y + 50 + k * 48, w, 48, 4 + k);
    ctx.fillStyle = C.mud;
    for (let k = 0; k < 5; k++) { const hw = k === 2 ? 14 : 32; ctx.fillRect(cx - hw, y + 50 + k * 48, hw * 2, 48); }
    line(ctx, cx, y + 50, cx, y + 140, '#c5ced6', 8);
    ST.metal(ctx, cx - 26, y + 190, 52, 20, '#c5ced6');
    ST.metal(ctx, cx - 12, y + 140, 24, 120, '#97a8b8');
    I.xmark(ctx, cx + 48, y + 185, 26, C.red);
  } else {
    K.lithoFill(ctx, 'rock3', x, y + 50, w, h - 50, 6);
    ctx.fillStyle = C.mud;
    poly(ctx, [[cx - 34, y + 50], [cx + 34, y + 50], [cx + 34, y + 150], [cx + 24, y + 200], [cx + 24, y + h], [cx - 24, y + h], [cx - 24, y + 200], [cx - 34, y + 150]]); ctx.fill();
    line(ctx, cx, y + 50, cx, y + 150, '#c5ced6', 8);
    poly(ctx, [[cx - 32, y + 150], [cx + 32, y + 150], [cx + 24, y + 186], [cx - 24, y + 186]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
    I.xmark(ctx, cx + 52, y + 180, 26, C.red);
  }
  ctx.restore();
}
const stuckScene = {
  id: 'stuck',
  title: 'Stuck pipe and fishing',
  blurb: 'The most expensive words on a rig: “we’re stuck”.',
  beats: [
    {
      term: 'Stuck pipe', no: 'fastkjørt borestreng',
      def: 'The drill string can no longer be pulled out, run in or rotated, even with normal overpull. One of the biggest causes of non-productive time; the first minutes of response matter most.',
      ex: 'We’re stuck at 3,250 metres with the bit on bottom.',
      say: 'Stuck pipe means the drill string can no longer be pulled up, run down or rotated, even with extra pull. It is one of the biggest causes of lost time and cost in drilling. There are three main causes: differential sticking, pack off, and mechanical sticking.',
    },
    {
      term: 'Differential sticking', no: 'differensialfastkjøring',
      def: 'The mud pressure in the hole is higher than the pore pressure in a permeable zone, so the pipe is pushed into the filter cake and held there. The longer the pipe stays still, the larger the contact area and the harder it is to free.',
      ex: 'Keep the pipe moving across the sands.',
      say: 'In differential sticking, the overbalance pushes the pipe sideways into the filter cake on a permeable sand. The force is the pressure difference times the contact area, and the contact area grows the longer the pipe stands still. That is why you keep the pipe moving.',
    },
    {
      term: 'Pack-off & mechanical sticking', no: 'pakking',
      def: 'Pack-off: cuttings or cavings collect around the BHA and seal the annulus, so circulation is lost and the pipe sticks. Mechanical sticking: the hole geometry traps the string: key seats in doglegs, ledges, or undergauge hole.',
      ex: 'Pressure spiking, we’re packing off.',
      say: 'Pack off happens when cuttings or cavings pile up around the BHA and seal the annulus. The pump pressure spikes and the pipe sticks. Mechanical sticking is caused by the shape of the hole: a key seat worn into a dogleg, a ledge between hard and soft layers, or an undergauge hole.',
    },
    {
      term: 'Jarring & spotting fluid', no: 'jarring',
      def: 'The jar in the BHA is a hydraulic or mechanical hammer: the driller pulls (or slacks off) to cock it and it fires a heavy blow up or down. Spotting fluid (a pipe-freeing pill) is pumped around the stuck zone and left to soak to break down the filter cake.',
      ex: 'Jar up with 40 tonnes overpull, then spot the pill.',
      say: 'To free stuck pipe, the crew uses the jar, a hammer built into the BHA. Pulling or slacking off cocks it, and it fires a heavy blow up or down, again and again. For differential sticking, a spotting fluid is pumped around the stuck zone, and left to soak to break down the filter cake.',
    },
    {
      term: 'Free point & back-off', no: 'frittpunkt / skru løs',
      def: 'If the pipe cannot be freed, a wireline tool finds the deepest point where the string is still free (the free point). The string is then unscrewed (backed off) or cut above the stuck point, and the free part is pulled.',
      ex: 'Free point is at 2,980 metres, prepare for back-off.',
      say: 'If the pipe cannot be freed, a wireline tool is run inside the string to find the free point, the deepest point where the pipe still moves. The string is then unscrewed, called backing off, or cut, just above the stuck point, and the free part is pulled out.',
    },
    {
      term: 'Fishing & the fish', no: 'fisking',
      def: 'Retrieving anything left in the hole (the fish) with special tools: an overshot grabs the outside, a spear grabs the inside, junk baskets and magnets catch small pieces, and mills grind junk away. If fishing fails: plug back and sidetrack.',
      ex: 'Top of fish at 2,975 m; running in with an overshot.',
      say: 'Anything left in the hole is called the fish, and getting it out is fishing. An overshot grabs the fish from the outside, a spear grabs it from the inside, and magnets, junk baskets and mills deal with small pieces. If fishing takes too long, the hole is plugged back and sidetracked.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      WL.drawWell(ctx, PW, { t, string: { to: 860, from: 0 } });
      const pull = S.p(0, 3.5, 1.5);
      const hook = 120 + 55 * pull + (pull > 0 && pull < 1 ? Math.sin(t * 20) * 1.5 : 0);
      K.highlightRect(ctx, CX - 42, 700, 84, 196, t, { color: C.red, alpha: S.vis(0, 0.5, 4.5) });
      for (let k = 0; k < 3; k++) arrow(ctx, CX + 70 + k * 26, 220, CX + 70 + k * 26, 140, { color: C.amber, lw: 4, head: 12, alpha: pull > 0 && pull < 1 ? 0.9 : 0.25 });
      gauge(ctx, 760, 250, 110, hook, { min: 0, max: 250, unit: 't', color: hook > 150 ? C.red : C.amber, warn: 160 });
      text(ctx, 'HOOK LOAD', 760, 410, { size: 20, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      if (pull > 0.5) tag(ctx, `overpull +${Math.round(55 * pull)} t`, 760, 460, { size: 20, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      stageFrame(ctx, 940, 110, 220, 380, 'BLOCK HEIGHT');
      fillRR(ctx, 1020, 170, 60, 260, 8, '#0b1a29', C.steelDark, 2);
      const jit = pull > 0 && pull < 1 ? Math.sin(t * 25) * 1.2 : 0;
      fillRR(ctx, 1010, 290 + jit, 80, 16, 4, C.amber);
      if (pull > 0.6) text(ctx, 'not moving', 1050, 466, { size: 19, weight: 800, align: 'center', color: C.red });
      I.stamp(ctx, CX, 560, 170, 'STUCK', C.red, -0.2, S.p(0, 0.3, 4.5));
      WG.infoBox(ctx, 620, 540, 540, 'THREE MAIN CAUSES', ['Differential sticking', 'Pack-off and bridging', 'Mechanical: key seats, ledges, undergauge hole'], S.vis(0, 0.5, 6), { rv: (S.since(0) - 6) * 0.8 });
    }
    if (bi === 1) {
      const cx = 330, cy = 450, R0 = 250;
      K.lithoFill(ctx, 'sand', 0, 0, 1196, 940, 9);
      circle(ctx, cx, cy, R0, '#4a3420');
      circle(ctx, cx, cy, R0 - 20, C.mud);
      const tt = S.since(1);
      const m = ease.inOut(clamp((tt - 1.5) / 2));
      const pr = 80;
      const px = lerp(cx, cx - (R0 - 20 - pr) - 10, m);
      circle(ctx, px, cy, pr, '#a9b8c6', '#56687a', 3);
      circle(ctx, px, cy, pr * 0.6, '#4a5866');
      const span = m >= 1 ? lerp(0.3, 1.3, clamp((tt - 4) / 8)) : 0;
      if (span > 0) {
        ctx.save(); ctx.shadowColor = C.red; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.arc(px, cy, pr + 4, Math.PI - span / 2, Math.PI + span / 2); ctx.strokeStyle = C.red; ctx.lineWidth = 9; ctx.stroke();
        ctx.restore();
        callout(ctx, px - pr - 4, cy, 120, 120, 'contact area', { color: C.red, size: 22, t: S.p(1, 0.6, 4.5) });
      }
      for (let k = 0; k < 3; k++) arrow(ctx, px + pr + 150, cy - 50 + k * 50, px + pr + 22, cy - 50 + k * 50, { color: C.amber, lw: 5, head: 16, alpha: S.vis(1, 0.5, 2) });
      text(ctx, 'mud pressure', px + pr + 86, cy - 84, { size: 20, weight: 800, align: 'center', color: C.amber, alpha: S.vis(1, 0.5, 2) });
      tag(ctx, 'filter cake', cx + 140, cy + R0 - 4, { size: 18, color: '#e3c49a', fill: 'rgba(7,17,28,0.9)' });
      text(ctx, 'permeable sand · lower pore pressure', cx, cy + R0 + 56, { size: 21, weight: 800, align: 'center', color: '#3a2a10' });
      const mins = Math.max(0, Math.floor((tt - 3.5) * 1.6));
      if (tt > 3.5) tag(ctx, `pipe still for ${mins} min`, 330, 60, { size: 22, color: C.cyan, fill: 'rgba(7,17,28,0.92)' });
      ctx.save(); ctx.globalAlpha *= S.vis(1, 0.5, 6);
      fillRR(ctx, 650, 60, 520, 120, 14, 'rgba(7,17,28,0.92)', C.amber, 2);
      richLine(ctx, 'force = **ΔP** × **contact area**', 680, 112, { size: 26, color: C.text });
      text(ctx, '× friction factor', 680, 150, { size: 20, weight: 600, color: C.dim });
      ctx.restore();
      WG.infoBox(ctx, 650, 210, 520, 'DIFFERENTIAL STICKING', ['Overbalance pushes the pipe into the filter cake', 'Needs a permeable zone, like a sand', 'Worse the longer the pipe is still', 'Prevent: keep moving, limit overbalance'], S.vis(1, 0.5, 8), { rv: (S.since(1) - 8) * 0.7 });
    }
    if (bi === 2) {
      const cx = 300;
      K.lithoFill(ctx, 'shale', 0, 0, 600, 940, 5);
      ctx.fillStyle = C.mud; ctx.fillRect(cx - 140, 0, 280, 940);
      ST.metal(ctx, cx - 50, 0, 100, 860, '#9fb0c1');
      for (const y0 of [250, 560]) for (let k = -1; k <= 1; k += 2) ST.metal(ctx, cx + k * 50 - (k < 0 ? 75 : 0), y0, 75, 80, '#c5ced6');
      poly(ctx, [[cx - 60, 860], [cx + 60, 860], [cx + 40, 900], [cx - 40, 900]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
      const pile = S.p(2, 7, 1, ease.linear);
      const Rn = K.rng(21);
      const n = Math.floor(260 * pile);
      for (let k = 0; k < 260; k++) {
        const side = Rn() < 0.5 ? -1 : 1, fx = Rn(), fy = Rn(), r = 3 + Rn() * 5;
        if (k >= n) continue;
        const x = cx + side * (52 + fx * 84);
        const y = 248 - fy * 220 * pile;
        circle(ctx, x, y, r, k % 3 ? '#8a7a66' : '#6e604f');
      }
      if (pile < 0.8) for (const sd of [-1, 1]) K.flow(ctx, [[cx + sd * 95, 880], [cx + sd * 95, 0]], t, { spacing: 60, speed: 120 * (1 - pile), color: rgba('#fff', 0.7 * (1 - pile)), r: 4, shape: 'chevron' });
      const spp = 210 + 95 * pile;
      gauge(ctx, 760, 210, 100, spp, { min: 0, max: 350, unit: 'bar', color: spp > 280 ? C.red : C.amber, warn: 280 });
      text(ctx, 'PUMP PRESSURE (SPP)', 760, 356, { size: 19, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      if (pile > 0.7) tag(ctx, 'PACKING OFF', cx, 120, { size: 26, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      WG.infoBox(ctx, 890, 110, 280, 'PACK-OFF', ['Cuttings or cavings seal the annulus', 'Pressure spikes, returns drop'], S.vis(2, 0.5, 1), { rv: 9, size: 19 });
      const ms = ['key seat', 'ledge', 'undergauge'];
      ms.forEach((k, i) => { ctx.save(); ctx.globalAlpha *= S.vis(2, 0.5, 9 + i * 1.5); miniSketch(ctx, 620 + i * 186, 560, 176, 340, k, t); ctx.restore(); });
      text(ctx, 'MECHANICAL STICKING', 900, 538, { size: 19, weight: 900, align: 'center', color: C.amber, spacing: 2, alpha: S.vis(2, 0.5, 9) });
    }
    if (bi === 3) {
      WL.drawWell(ctx, PW, { t, string: { to: 860, from: 0 } });
      const p = S.p(3, Math.max(6, S.bd - 2), 0.8, ease.linear);
      const f = (p * 5) % 1;
      const firing = p > 0 && p < 1 && f > 0.85;
      const jy = 640;
      const cock = f < 0.85 ? f / 0.85 : 1 - (f - 0.85) / 0.15;
      ST.metal(ctx, CX - 12, jy, 24, 70, '#d9a036');
      ST.metal(ctx, CX - 8, jy - 18 - cock * 14, 16, 22, '#e8c46a');
      text(ctx, 'JAR', CX + 40, jy + 44, { size: 20, weight: 900, color: '#d9a036' });
      if (firing) {
        for (let k = 0; k < 3; k++) { const rr2 = 30 + k * 26 + (f - 0.85) / 0.15 * 40; circle(ctx, CX, jy + 30, rr2, null, rgba(C.amber, 0.8 - k * 0.25), 4); }
        tag(ctx, 'BANG!', CX + 120, jy - 30, { size: 26, color: C.amber, fill: 'rgba(7,17,28,0.92)' });
      }
      const spot = S.vis(3, 1.5, Math.max(7, S.bd * 0.55));
      if (spot > 0) {
        ctx.fillStyle = rgba('#58d68d', 0.45 * spot);
        ctx.fillRect(CX - 28, 720, 22, 170); ctx.fillRect(CX + 6, 720, 22, 170);
        callout(ctx, CX + 22, 800, 560, 840, 'spotting fluid soaking', { color: '#58d68d', size: 22, t: spot });
      }
      const saw = (u) => { const g = (u * 5) % 1; return g < 0.85 ? 130 + 70 * (g / 0.85) : 200 - ((g - 0.85) / 0.15) * 70; };
      WG.lineChart(ctx, 620, 40, 550, 330, [{ fn: saw, color: C.amber, lw: 3, n: 500 }], p, { min: 100, max: 220, title: 'HOOK LOAD WHILE JARRING (t)', xlabel: 'time →', grid: 4 });
      WG.infoBox(ctx, 620, 400, 550, 'JARRING & SPOTTING', ['The jar is a hammer built into the BHA', 'Pull or slack off to cock it; it fires a heavy blow', 'Jar up or down, many times', 'Spotting fluid: soak the stuck zone to free it'], S.vis(3, 0.5, 1), { rv: S.since(3) * 0.35 });
    }
    if (bi === 4) {
      WL.drawWell(ctx, PW, { t, string: null });
      const wl = S.p(4, 4, 1);
      const bo = S.p(4, 2, 7);
      const lift = 70 * bo;
      K.highlightRect(ctx, CX - 40, 690, 80, 204, t, { color: C.red, alpha: S.vis(4, 0.5, 0.5) });
      pipe(ctx, CX, 676, 840); bha(ctx, CX, 860);
      pipe(ctx, CX, -10, 672 - lift);
      fillRR(ctx, CX - 9, 664 - lift, 18, 12, 2, '#c5ced6');
      fillRR(ctx, CX - 9, 676, 18, 12, 2, '#c5ced6');
      text(ctx, 'stuck', CX + 60, 800, { size: 22, weight: 900, color: C.red, alpha: S.vis(4, 0.5, 0.5) });
      text(ctx, 'free', CX + 60, 340, { size: 22, weight: 900, color: C.green, alpha: S.vis(4, 0.5, 0.5) });
      const ty = lerp(0, 650, wl) - lift;
      if (bo < 1) {
        line(ctx, CX, 0, CX, ty, '#e8eef5', 2);
        fillRR(ctx, CX - 5, ty, 10, 36, 3, C.yellow);
      }
      if (wl >= 1) {
        line(ctx, CX - 80, 690, CX + 260, 690, C.cyan, 3, [10, 8]);
        tag(ctx, 'FREE POINT', CX + 200, 690, { size: 20, color: C.cyan, fill: 'rgba(7,17,28,0.92)' });
      }
      if (bo > 0.5) callout(ctx, CX + 10, 682, 560, 590, 'top of fish', { color: C.red, size: 22, t: clamp((bo - 0.5) * 2) });
      WG.steps(ctx, 650, 120, ['Run a wireline tool inside the string', 'Measure stretch and torque: find the free point', 'Back off (unscrew) or cut just above it', 'Pull the free pipe: the rest is the fish'], wl * 2 + bo * 2, { w: 520, gap: 96 });
    }
    if (bi === 5) {
      WL.drawWell(ctx, PW, { t, string: null });
      const down = S.p(5, 3, 1), grab = S.vis(5, 0.4, 4.2), up = S.p(5, 3, 7);
      const lift = 220 * up;
      pipe(ctx, CX, 560 - lift, 840 - lift); bha(ctx, CX, 860 - lift);
      fillRR(ctx, CX - 9, 556 - lift, 18, 14, 2, '#c5ced6');
      const oy = lerp(-140, 520, down) - lift;
      pipe(ctx, CX, -10, oy - 20, 12);
      ST.metal(ctx, CX - 24, oy - 24, 48, 96, '#d9a036');
      if (grab > 0) for (let k = 0; k < 4; k++) line(ctx, CX - 20, oy + 40 + k * 8, CX + 20, oy + 40 + k * 8, rgba('#3a2a10', grab), 2);
      tag(ctx, 'overshot', CX + 40, oy + 24, { size: 18, color: '#d9a036', align: 'left', fill: 'rgba(7,17,28,0.9)' });
      if (down < 0.95) callout(ctx, CX + 10, 600, 520, 720, 'the fish', { color: C.red, size: 22, t: S.p(5, 0.6, 0.6) });
      if (grab > 0) tag(ctx, up > 0 ? 'pulling the fish' : 'grapple engaged', CX + 200, 420, { size: 20, color: C.green, fill: 'rgba(7,17,28,0.92)' });
      WG.infoBox(ctx, 640, 60, 530, 'FISHING TOOLS', ['Overshot: grabs the fish on the outside', 'Spear: grabs it from the inside', 'Magnet & junk basket: small pieces', 'Mill: grinds junk away', 'Fishing too long? Plug back & sidetrack'], S.vis(5, 0.5, 0.5), { rv: S.since(5) * 0.4 + 0.3 });
    }
  },
};

// ------------------------------------------------------------ losses and hole problems
const LW = {
  cx: 300, seabed: 0, td: 900,
  layers: [{ to: 230, kind: 'clay' }, { to: 470, kind: 'shale' }, { to: 560, kind: 'sand' }, { to: 720, kind: 'lime' }, { to: 940, kind: 'shale' }],
  strings: [{ hw: 50, holeHw: 62, top: 0, shoe: 220, toc: 0 }, { hw: 38, holeHw: 50, top: 0, shoe: 430, toc: 300 }],
  hole: { hw: 28, to: 890 },
};
const FRACS = (() => {
  const Rn = K.rng(31); const out = [];
  for (let k = 0; k < 8; k++) {
    const side = k % 2 ? 1 : -1, y = 580 + Rn() * 120;
    const pts = [[LW.cx + side * 28, y]];
    let x = LW.cx + side * 28, yy = y;
    for (let j = 0; j < 4; j++) { x += side * (40 + Rn() * 50); yy += (Rn() - 0.5) * 50; pts.push([x, yy]); }
    out.push(pts);
  }
  return out;
})();
function fractures(ctx, t, flowA, plugged = 0) {
  for (const f of FRACS) {
    K.partialPolyline(ctx, f, 1, '#2a2018', 6);
    if (flowA > 0) K.flow(ctx, f, t, { spacing: 22, speed: 70, color: rgba(C.mudLight, flowA), r: 3.5 });
    if (plugged > 0) for (let j = 0; j < 4; j++) circle(ctx, f[0][0] + (f[1][0] - f[0][0]) * j * 0.12, f[0][1] + (f[1][1] - f[0][1]) * j * 0.12, 4 * plugged, j % 2 ? '#58d68d' : '#e8d25a');
  }
}
function breakoutHole(ctx, cx, cy, R, bo, t) {
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = (i / 120) * Math.PI * 2;
    const lobe = Math.pow(Math.max(0, Math.cos(2 * (a - Math.PI / 2))), 6);
    const rr2 = R + bo * 70 * lobe * (0.9 + 0.1 * Math.sin(a * 23));
    const x = cx + Math.cos(a) * rr2, y = cy + Math.sin(a) * rr2;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.fillStyle = C.mud; ctx.fill();
}
const lossScene = {
  id: 'losses',
  title: 'Losses and an unstable hole',
  blurb: 'When the formation takes your mud, or falls into the hole.',
  beats: [
    {
      term: 'Lost circulation', abbr: 'losses', no: 'tapt sirkulasjon',
      def: 'Mud flows into the formation instead of returning to surface, through natural fractures, vugs, very permeable zones or fractures induced by too high pressure. Ranges from seepage losses to total losses (no returns at all), which also reduces the hydrostatic barrier.',
      ex: 'We have partial losses, about 10 m³ per hour.',
      say: 'Lost circulation, or simply losses, means mud flowing into the formation instead of coming back up. It can go into natural fractures, caves, or fractures you create with too much pressure. It ranges from small seepage losses to total losses, with no returns at all. Losses are expensive, and they can lower the mud column, so they are also a well control concern.',
    },
    {
      term: 'Lost circulation material', abbr: 'LCM', no: 'tapt-sirkulasjonsmateriale',
      def: 'Particles mixed into the mud or pumped as a pill to plug the loss zone: graded granules (e.g. calcium carbonate), fibres and flakes that bridge across fractures and pores. For severe losses: cement or special plugs.',
      ex: 'Pump a 10 m³ LCM pill and let it sit.',
      say: 'To cure losses, the crew pumps LCM, lost circulation material. It is a mix of granules, fibres and flakes, sized to bridge across the fractures and seal them. It is often pumped as a pill. Severe losses may need cement, or other special plugs.',
    },
    {
      term: 'Wellbore instability', no: 'ustabil brønnvegg',
      def: 'The hole wall fails or deforms: with too low mud weight, shale breaks out (breakouts) and falls in as cavings; in other formations it can creep or squeeze. Leads to tight hole, pack-off and stuck pipe.',
      ex: 'Big angular cavings over the shakers, consider raising the mud weight.',
      say: 'Wellbore instability means the hole wall breaks down. If the mud weight is too low for the rock stresses, the shale breaks out and falls into the hole as cavings: large, angular pieces that show up on the shakers. Instability leads to tight hole, pack off and stuck pipe.',
    },
    {
      term: 'Swelling clays & bit balling', no: 'svellende leire',
      def: 'Reactive clays and shales absorb water from water-based mud and swell, giving tight hole and high torque and drag. Sticky clay can pack onto the bit and BHA (bit balling), so ROP drops. Fix: inhibitive mud (KCl, glycol) or oil-based mud.',
      ex: 'ROP dropped to nothing, the bit’s probably balled up.',
      say: 'Some clays soak up water from water based mud and swell, making the hole tight. Sticky clay can also pack onto the bit, called bit balling, and the rate of penetration falls to almost nothing. The fix is an inhibitive mud, with potassium chloride or glycol, or switching to oil based mud.',
    },
    {
      term: 'Washout', no: 'utvasking',
      def: 'Two meanings: (1) an enlarged hole where soft rock has been eroded, seen on the caliper log; (2) a hole worn or cut through the drill string, which leaks mud and shows as a slow drop in pump pressure. A string washout can lead to a twist-off.',
      ex: 'SPP has dropped 15 bar at the same rate, could be a washout.',
      say: 'Washout has two meanings. A washed out hole is wider than the bit, because soft rock has been eroded, and it shows on the caliper log. A washout in the drill string is a leak through the pipe wall. It shows as a slow fall in pump pressure at the same pump rate, and if ignored, it can end in a twist off.',
    },
    {
      term: 'Ballooning', abbr: 'breathing', no: 'ballongeffekt',
      def: 'Small fractures open and take mud when the pumps are on (high ECD), then close and push the mud back when the pumps are off. The flowback looks like a kick: compare it with earlier flowback fingerprints, and if in doubt, shut in.',
      ex: 'Is it ballooning or a kick? Check the fingerprint.',
      say: 'Ballooning, or wellbore breathing, is tricky. With the pumps on, the higher ECD opens small fractures that take mud. With the pumps off, they close and push the mud back. That flowback looks just like a kick! Crews compare it with earlier flowback fingerprints. If in doubt, shut in the well.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0 || bi === 1) {
      WL.drawWell(ctx, LW, { t, string: { to: 860, from: 0 } });
      if (bi === 0) {
        const q = S.q(0);
        const sev = clamp(q * 1.6);
        fractures(ctx, t, 0.4 + 0.6 * sev);
        const fout = Math.round(3600 * (1 - 0.95 * sev));
        gauge(ctx, 760, 220, 100, fout, { min: 0, max: 4000, unit: 'lpm', color: fout < 2000 ? C.red : C.amber });
        text(ctx, 'FLOW OUT', 760, 364, { size: 19, weight: 900, align: 'center', color: C.dim, spacing: 1 });
        K.tank(ctx, 960, 120, 160, 220, 0.75 - 0.4 * sev, { color: C.mud, label: 'active pit' });
        const lv = ['SEEPAGE', 'PARTIAL', 'TOTAL · no returns'];
        lv.forEach((l, i) => tag(ctx, l, 690, 420 + i * 62, { size: 22, color: [C.amber, C.orange, C.red][i], align: 'left', fill: i === Math.min(2, Math.floor(sev * 2.99)) ? 'rgba(7,17,28,0.95)' : 'rgba(7,17,28,0.6)', alpha: i <= Math.floor(sev * 2.99) ? 1 : 0.35 }));
        tag(ctx, 'LOSS ZONE: fractures', 150, 515, { size: 20, color: C.mudLight, fill: 'rgba(7,17,28,0.9)', alpha: S.vis(0, 0.5, 2) });
        WG.infoBox(ctx, 690, 640, 480, 'WHY IT MATTERS', ['Costly mud and time', 'Mud level falls: less hydrostatic pressure'], S.vis(0, 0.5, 14), { rv: (S.since(0) - 14) * 0.6, color: C.red });
      } else {
        const p = S.p(1, 7, 0.8, ease.linear);
        const plug = clamp((p - 0.55) / 0.3);
        fractures(ctx, t, 1 - plug, plug);
        // pill travelling down the string and up the annulus
        const Rn = K.rng(4);
        for (let k = 0; k < 40; k++) {
          const ph = clamp(p * 1.8 - k / 40 * 0.6);
          if (ph <= 0 || ph >= 1) continue;
          const down = ph < 0.6;
          const y = down ? lerp(0, 860, ph / 0.6) : lerp(860, 640, (ph - 0.6) / 0.4);
          const x = down ? CX + (Rn() - 0.5) * 6 : CX + (k % 2 ? 1 : -1) * (16 + Rn() * 8);
          circle(ctx, x, y, 4, k % 3 === 0 ? '#58d68d' : k % 3 === 1 ? '#e8d25a' : '#ff9f43');
        }
        if (plug > 0.9) tag(ctx, 'fractures bridged · returns back', CX + 200, 520, { size: 20, color: C.green, fill: 'rgba(7,17,28,0.92)' });
        WG.panel(ctx, 640, 60, 530, 360, 'WHAT’S IN AN LCM PILL', C.amber);
        const items = [['granules', 760], ['fibres', 905], ['flakes', 1050]];
        items.forEach(([n, x], i) => {
          const R2 = K.rng(10 + i);
          for (let k = 0; k < 14; k++) {
            const px = x - 50 + R2() * 100, py = 140 + R2() * 160;
            if (i === 0) circle(ctx, px, py, 4 + R2() * 6, '#e8d25a');
            if (i === 1) { ctx.save(); ctx.strokeStyle = '#58d68d'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, py); ctx.quadraticCurveTo(px + 10, py - 14, px + 24, py - 4); ctx.stroke(); ctx.restore(); }
            if (i === 2) { ctx.save(); ctx.translate(px, py); ctx.rotate(R2() * 3); ctx.fillStyle = '#ff9f43'; ctx.fillRect(-10, -3, 20, 6); ctx.restore(); }
          }
          text(ctx, n, x, 360, { size: 20, weight: 800, align: 'center', color: C.text });
        });
        WG.infoBox(ctx, 640, 450, 530, 'LCM', ['Sized to bridge the fractures or pores', 'Mixed in the mud or pumped as a pill', 'Severe losses: cement or special plugs'], S.vis(1, 0.5, 2), { rv: (S.since(1) - 2) * 0.5 });
      }
    }
    if (bi === 2) {
      K.lithoFill(ctx, 'shale', 0, 0, 1196, 940, 7);
      const tt = S.since(2);
      const bo = S.p(2, 5, 1.5);
      const cx = 300, cy = 400;
      breakoutHole(ctx, cx, cy, 150, bo, t);
      circle(ctx, cx, cy, 52, '#a9b8c6', '#56687a', 3); circle(ctx, cx, cy, 30, '#4a5866');
      for (const sd of [-1, 1]) {
        arrow(ctx, cx + sd * 290, cy, cx + sd * 190, cy, { color: C.amber, lw: 8, head: 22 });
        arrow(ctx, cx, cy + sd * 330, cx, cy + sd * 270, { color: C.cyan, lw: 4, head: 14 });
      }
      text(ctx, 'σH (max)', cx + 240, cy - 26, { size: 20, weight: 800, align: 'center', color: C.amber });
      text(ctx, 'σh (min)', cx + 74, cy - 300, { size: 20, weight: 800, color: C.cyan });
      if (bo > 0.4) { callout(ctx, cx, cy - 205, 470, 150, 'breakout', { color: C.red, size: 22, t: clamp((bo - 0.4) * 2) }); }
      text(ctx, 'TOP VIEW OF THE HOLE', cx, 900, { size: 18, weight: 900, align: 'center', color: '#1b1612', spacing: 2 });
      // shaker with cavings
      WG.panel(ctx, 640, 40, 530, 400, 'ON THE SHAKERS', C.amber);
      ctx.save(); ctx.translate(905, 250); ctx.rotate(-0.12);
      fillRR(ctx, -230, -20, 460, 40, 6, '#2b3d4f', '#56687a', 2);
      ctx.strokeStyle = rgba('#fff', 0.18); ctx.lineWidth = 1; for (let x = -226; x < 226; x += 8) { ctx.beginPath(); ctx.moveTo(x, -18); ctx.lineTo(x, 18); ctx.stroke(); }
      const Rn = K.rng(77);
      for (let k = 0; k < 26; k++) {
        const big = k % 4 === 0 && tt > 6;
        const ph = (t * 0.12 + Rn()) % 1;
        const x = -220 + ph * 440, y = -26 - Rn() * 8;
        if (big) { poly(ctx, [[x - 18, y], [x + 22, y - 6], [x + 6, y - 22]]); ctx.fillStyle = '#5a554f'; ctx.fill(); }
        else circle(ctx, x, y, 3 + Rn() * 2, '#8a7a66');
      }
      ctx.restore();
      if (tt > 6) { tag(ctx, 'cavings: big & angular', 905, 360, { size: 21, color: C.red, fill: 'rgba(7,17,28,0.92)' }); text(ctx, 'normal cuttings: small', 905, 410, { size: 18, weight: 700, align: 'center', color: C.dim }); }
      WG.infoBox(ctx, 640, 470, 530, 'WELLBORE INSTABILITY', ['Mud weight too low for the rock stresses', 'Shale breaks out and falls in as cavings', 'Leads to tight hole, pack-off, stuck pipe'], S.vis(2, 0.5, 1), { rv: S.since(2) * 0.3 });
    }
    if (bi === 3) {
      const tt = S.since(3);
      K.lithoFill(ctx, 'clay', 0, 0, 600, 940, 8);
      const sw = S.p(3, 6, 1);
      const cx = 300;
      ctx.beginPath(); ctx.moveTo(cx - 120, 0);
      for (let y = 0; y <= 940; y += 10) { const b = sw * 46 * Math.exp(-Math.pow((y - 380) / 170, 2)); ctx.lineTo(cx - 120 + b, y); }
      for (let y = 940; y >= 0; y -= 10) { const b = sw * 46 * Math.exp(-Math.pow((y - 380) / 170, 2)); ctx.lineTo(cx + 120 - b, y); }
      ctx.closePath(); ctx.fillStyle = '#8a6a48'; ctx.fill();
      ST.metal(ctx, cx - 40, 0, 80, 730, '#9fb0c1');
      poly(ctx, [[cx - 75, 730], [cx + 75, 730], [cx + 55, 780], [cx - 55, 780]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
      const ball = S.p(3, 6, 6);
      const Rn = K.rng(12);
      for (let k = 0; k < 40 * ball; k++) {
        const a = Rn() * Math.PI, d = 60 + Rn() * 30;
        circle(ctx, cx + Math.cos(a + Math.PI) * d * 1.1, 755 - Math.sin(a) * 30 + Rn() * 20, 9 + Rn() * 8, k % 2 ? '#7a6248' : '#94785a');
      }
      if (sw > 0.5) callout(ctx, cx - 120 + 40, 380, 470, 260, 'swelling: tight hole', { color: C.amber, size: 22, t: clamp((sw - 0.5) * 2) });
      if (ball > 0.5) callout(ctx, cx + 70, 750, 480, 860, 'balled bit', { color: C.red, size: 22, t: clamp((ball - 0.5) * 2) });
      const rop = Math.max(2, 30 - 28 * ball);
      gauge(ctx, 760, 210, 100, rop, { min: 0, max: 40, unit: 'm/h', color: rop < 10 ? C.red : C.green });
      text(ctx, 'ROP', 760, 356, { size: 19, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      WG.infoBox(ctx, 640, 420, 530, 'REACTIVE CLAY', ['Soaks up water from water-based mud', 'Swells: tight hole, torque & drag', 'Sticks to the bit: bit balling, ROP falls', 'Fix: inhibitive mud or oil-based mud'], S.vis(3, 0.5, 1), { rv: tt * 0.3 });
    }
    if (bi === 4) {
      const tt = S.since(4);
      // left: caliper log and hole profile
      WG.panel(ctx, 20, 20, 560, 900, 'CALIPER LOG', C.amber);
      const Y = (d) => 90 + (d / 400) * 790;
      const cal = (d) => 12.25 + 4.5 * Math.exp(-Math.pow((d - 170) / 40, 2)) + 1.2 * Math.exp(-Math.pow((d - 300) / 15, 2)) + 0.15 * Math.sin(d * 0.3);
      const X = (in_) => 90 + (in_ - 8) / 12 * 220;
      line(ctx, X(12.25), Y(0), X(12.25), Y(400), C.dim, 2, [6, 6]);
      text(ctx, 'bit size 12¼ in', X(12.25) - 6, Y(0) - 8, { size: 15, weight: 700, color: C.dim, align: 'center' });
      const pp = S.p(4, 4, 0.5, ease.linear);
      const pts = []; for (let d = 0; d <= 400 * pp; d += 4) pts.push([X(cal(d)), Y(d)]);
      if (pts.length > 1) K.partialPolyline(ctx, pts, 1, C.amber, 3);
      // hole profile
      ctx.save(); rr(ctx, 380, 90, 180, 790, 8); ctx.clip();
      K.lithoFill(ctx, 'shale', 380, 90, 180, 790, 2);
      K.lithoFill(ctx, 'sand', 380, Y(130), 180, Y(210) - Y(130), 3);
      ctx.beginPath(); ctx.moveTo(470 - 30, Y(0));
      for (let d = 0; d <= 400; d += 4) ctx.lineTo(470 - cal(d) * 2.4, Y(d));
      for (let d = 400; d >= 0; d -= 4) ctx.lineTo(470 + cal(d) * 2.4, Y(d));
      ctx.closePath(); ctx.fillStyle = C.mud; ctx.fill();
      ctx.restore();
      if (pp > 0.6) callout(ctx, X(cal(170)), Y(170), 240, Y(240), 'washed-out hole', { color: C.amber, size: 21, t: clamp((pp - 0.6) * 3), minX: 30, maxX: 570 });
      // right: string washout
      WG.panel(ctx, 620, 20, 556, 420, 'WASHOUT IN THE STRING', C.red);
      ST.metal(ctx, 680, 120, 60, 280, '#9fb0c1');
      const jet = 0.5 + 0.5 * Math.sin(t * 9);
      for (let k = 0; k < 7; k++) { const ph = (t * 1.6 + k / 7) % 1; circle(ctx, 740 + ph * 120, 260 + Math.sin(k * 3) * 6 * ph, 4 + ph * 5, rgba(C.mudLight, 1 - ph)); }
      fillRR(ctx, 732, 252, 10, 16, 3, '#1b1b1b');
      text(ctx, 'leak', 760, 236, { size: 18, weight: 800, color: C.mudLight, alpha: 0.7 + 0.3 * jet });
      const decl = (u) => 210 - (u > 0.25 ? (u - 0.25) * 40 : 0);
      WG.lineChart(ctx, 880, 90, 280, 320, [{ fn: decl, color: C.red, lw: 3 }, { fn: () => 45, color: C.cyan, lw: 3, dash: [6, 5] }], S.p(4, 5, 2, ease.linear), { min: 0, max: 250, grid: 5, xlabel: 'time →', yTicks: false });
      text(ctx, 'SPP ↓', 1030, 150, { size: 18, weight: 900, color: C.red });
      text(ctx, 'pump rate ─ same', 1030, 345, { size: 16, weight: 800, align: 'center', color: C.cyan });
      WG.infoBox(ctx, 620, 470, 556, 'TWO KINDS OF WASHOUT', ['Hole: soft rock eroded, wider than the bit', 'String: a leak through the pipe wall', 'Slow pressure drop at constant rate = suspect a washout'], S.vis(4, 0.5, 1), { rv: tt * 0.25 });
    }
    if (bi === 5) {
      const tt = S.since(5);
      const p = S.p(5, Math.max(8, S.bd - 2), 0.5, ease.linear);
      const per = (u) => Math.floor(u * 4) % 2 === 0;
      const vol = (u) => { let v = 50; for (let i = 0; i < 400 * u; i++) { const uu = i / 400; v += per(uu) ? -0.035 : 0.03; } return v; };
      const bands = [0, 1, 2, 3].map((i) => ({ u0: i / 4, u1: (i + 1) / 4, color: i % 2 ? rgba(C.cyan, 0.08) : rgba(C.amber, 0.08), label: i % 2 ? 'PUMPS OFF' : 'PUMPS ON', textColor: i % 2 ? C.cyan : C.amber }));
      const ch = WG.lineChart(ctx, 40, 40, 700, 460, [{ fn: vol, color: C.mudLight, lw: 4, n: 160 }], p, { min: 44, max: 52, title: 'ACTIVE PIT VOLUME (m³)', xlabel: 'time →', bands, decimals: 0, grid: 4 });
      if (p > 0.4) callout(ctx, ch.X(0.38), ch.Y(vol(0.38)), 520, 170, 'mud lost to fractures', { color: C.amber, size: 20, t: clamp((p - 0.4) * 4), maxX: 730 });
      if (p > 0.62) callout(ctx, ch.X(0.62), ch.Y(vol(0.62)), 600, 320, 'flowback: looks like a kick!', { color: C.red, size: 20, t: clamp((p - 0.62) * 4), maxX: 730 });
      // well with breathing fractures
      WG.panel(ctx, 780, 40, 390, 460, 'THE WELL BREATHES', C.dim);
      const on = per(clamp(p));
      ctx.save(); rr(ctx, 790, 90, 370, 400, 10); ctx.clip();
      K.lithoFill(ctx, 'shale', 790, 90, 370, 400, 3);
      ctx.fillStyle = C.mud; ctx.fillRect(950, 90, 50, 400);
      for (let k = 0; k < 5; k++) {
        const y = 200 + k * 60, open = on ? 1 : 0.2;
        for (const sd of [-1, 1]) {
          line(ctx, 975 + sd * 25, y, 975 + sd * (25 + 110 * open), y + 10, '#2a2018', 3 + 3 * open);
          arrow(ctx, 975 + sd * (on ? 30 : 110), y - 12, 975 + sd * (on ? 110 : 30), y - 12, { color: on ? C.amber : C.cyan, lw: 3, head: 10, alpha: 0.85 });
        }
      }
      ctx.restore();
      WG.infoBox(ctx, 40, 540, 1130, 'BALLOONING (WELLBORE BREATHING)', ['Pumps on: high ECD opens fractures that take mud', 'Pumps off: they close and give it back, which looks like a kick', 'Compare with earlier flowback fingerprints. If in doubt, shut in!'], S.vis(5, 0.5, 1), { rv: tt * 0.25 });
    }
  },
};

// ------------------------------------------------------------ gas, H2S, hydrates and string dynamics
const hazScene = {
  id: 'hazards',
  title: 'Gas, H₂S, hydrates and vibrations',
  blurb: 'Signals and dangers that come up from the hole.',
  beats: [
    {
      term: 'Background, connection & trip gas', abbr: 'BG | CG | TG',
      def: 'Gas readings from the mud logger’s gas trap. Background gas is the steady level while drilling; connection gas is a peak after each connection (less pressure on bottom with pumps off); trip gas is a peak after a trip. Rising connection gas can warn of rising pore pressure.',
      ex: 'Connection gases are increasing, tell the company man.',
      say: 'The mud logger measures gas coming out of the mud. Background gas is the steady level while drilling. Connection gas is a peak that arrives after each connection, because the pressure on bottom drops when the pumps stop. Trip gas is a peak after a trip. Rising connection gas can be an early warning of rising pore pressure.',
    },
    {
      term: 'Hydrogen sulphide', abbr: 'H₂S', no: 'hydrogensulfid',
      def: 'A toxic, heavier-than-air gas present in some reservoirs. It smells of rotten eggs at low levels, but higher levels knock out the sense of smell, so never trust your nose. Rigs have fixed and personal detectors, alarms and breathing apparatus.',
      ex: 'H₂S alarm, muster upwind!',
      tts: 'H2S, hydrogen sulphide, is a toxic gas found in some reservoirs, and it is heavier than air. It smells of rotten eggs at low levels, but higher levels knock out your sense of smell, so never trust your nose. Rigs have gas detectors, alarms and breathing apparatus, and you escape upwind.',
      say: 'H2S, hydrogen sulphide, is a toxic gas found in some reservoirs, and it is heavier than air. It smells of rotten eggs at low levels, but higher levels knock out your sense of smell, so never trust your nose. Rigs have gas detectors, alarms and breathing apparatus, and you escape upwind.',
    },
    {
      term: 'Gas hydrates', no: 'hydrater',
      def: 'Ice-like solids of gas and water that form at high pressure and low temperature, e.g. in the cold water near the seabed. They can plug the BOP, choke and kill lines and subsea equipment. Prevented with glycol or MEG injection and inhibited fluids.',
      ex: 'Inject glycol on the choke line before we circulate.',
      say: 'Gas hydrates are ice-like solids of gas and water. They form at high pressure and low temperature, like the cold water near the seabed in deep water. Hydrates can plug the BOP and the choke and kill lines. They are prevented by injecting glycol, and by using inhibited fluids.',
    },
    {
      term: 'Drill string vibrations', no: 'vibrasjoner',
      def: 'Axial vibration (bit bounce), lateral vibration (whirl) and torsional vibration (stick-slip, where the bit stops and then spins far faster than the surface RPM). They damage bits and downhole tools; the driller changes WOB and RPM to get out of them.',
      ex: 'Severe stick-slip, drop the WOB and bring up the RPM.',
      say: 'The drill string can vibrate in three ways. Axial vibration makes the bit bounce. Lateral vibration, or whirl, swings the BHA around the hole. Torsional vibration, called stick slip, makes the bit stop, then spin much faster than the top drive. Vibrations destroy bits and tools, so the driller changes the weight on bit and the RPM to get out of them.',
    },
    {
      term: 'Twist-off', no: 'rørbrudd',
      def: 'The drill string parts downhole, usually at a connection or a washout, from fatigue or too much torque. Seen as a sudden drop in hook load, torque and pump pressure. Now it is a fishing job.',
      ex: 'Lost 25 tonnes of hook load, looks like a twist-off.',
      say: 'A twist off is when the drill string breaks downhole, often at a connection or a washout, because of fatigue or too much torque. The driller sees a sudden drop in hook load, torque and pump pressure. And now it is a fishing job.',
    },
    {
      term: 'Junk in hole', no: 'skrap i hullet',
      def: 'Loose metal in the well: broken bit parts, lost hand tools, slip dies, pieces of equipment. Junk damages the next bit, so it is removed with junk baskets, magnets or mills. Prevention: hole covers, secured tools and good housekeeping on the drill floor.',
      ex: 'Run a junk basket before we go in with the new bit.',
      say: 'Junk is loose metal in the hole: broken bit parts, a lost tool, or a slip die. It destroys the next bit, so it is fished out with a magnet or a junk basket, or ground up with a mill. On the drill floor, the hole is always covered, and tools are secured, so nothing falls in.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      WG.panel(ctx, 20, 20, 640, 900, 'MUD LOG · TOTAL GAS', C.amber);
      const X = (g) => 110 + (g / 5) * 520, Y = (d) => 90 + ((d - 2000) / 600) * 800;
      for (let g = 0; g <= 5; g++) { line(ctx, X(g), Y(2000), X(g), Y(2600), rgba('#fff', 0.07), 1); text(ctx, `${g}%`, X(g), 914, { size: 14, weight: 600, align: 'center', color: C.dim, fam: K.MONO }); }
      for (let d = 2000; d <= 2600; d += 100) { line(ctx, X(0), Y(d), X(5), Y(d), rgba('#fff', 0.07), 1); text(ctx, String(d), X(0) - 10, Y(d) + 5, { size: 14, weight: 600, align: 'right', color: C.dim, fam: K.MONO }); }
      const bg = (d) => 0.45 + 0.12 * Math.sin(d * 0.21) + 0.08 * Math.sin(d * 0.53) + (d > 2400 ? (d - 2400) / 200 * 0.5 : 0);
      const gas = (d) => {
        let v = bg(d);
        for (let c = 2030; c < 2600; c += 30) v += (0.9 + (c > 2400 ? 1.2 : 0)) * Math.exp(-Math.pow((d - c) / 2.2, 2));
        v += 3.6 * Math.exp(-Math.pow((d - 2255) / 4, 2));
        return v;
      };
      const pd = 2000 + 600 * S.p(0, Math.max(8, S.bd - 4), 0.5, ease.linear);
      const pts = []; for (let d = 2000; d <= pd; d += 0.5) pts.push([X(gas(d)), Y(d)]);
      if (pts.length > 1) K.partialPolyline(ctx, pts, 1, C.red, 2.5);
      ctx.save(); ctx.fillStyle = rgba(C.red, 0.12); ctx.beginPath(); ctx.moveTo(X(0), Y(2000)); pts.forEach(([x, y]) => ctx.lineTo(x, y)); ctx.lineTo(X(0), Y(pd)); ctx.closePath(); ctx.fill(); ctx.restore();
      if (pd > 2100) callout(ctx, X(bg(2090)), Y(2090), 420, Y(2120), 'BG · background gas', { color: C.amber, size: 20, maxX: 650, minX: 30 });
      if (pd > 2160) callout(ctx, X(gas(2150)), Y(2150), 420, Y(2180), 'CG · connection gas', { color: C.cyan, size: 20, maxX: 650, minX: 30 });
      if (pd > 2270) callout(ctx, X(gas(2255)), Y(2255), 380, Y(2320), 'TG · trip gas', { color: C.red, size: 20, maxX: 650, minX: 30 });
      if (pd > 2480) callout(ctx, X(gas(2490)), Y(2490), 330, Y(2550), 'rising CG: pore pressure up?', { color: C.amber, size: 20, maxX: 650, minX: 30 });
      text(ctx, 'depth (m)', 46, 70, { size: 15, weight: 700, color: C.dim });
      WG.infoBox(ctx, 690, 40, 486, 'GAS READINGS', ['Measured from a gas trap at the shakers', 'Background: steady level while drilling', 'Connection gas: peak after each connection', 'Trip gas: peak after a round trip', 'Watch the trend, not just the number'], S.vis(0, 0.5, 0.5), { rv: S.since(0) * 0.3 + 0.3 });
    }
    if (bi === 1) {
      const tt = S.since(1);
      const ppm = Math.min(28, Math.max(0, (tt - 2) * 4));
      const alarm = ppm > 8;
      WG.panel(ctx, 40, 40, 520, 420, 'GAS DETECTOR', alarm ? C.red : C.dim);
      fillRR(ctx, 100, 110, 400, 170, 14, '#0b2316', alarm ? C.red : '#2f6f4a', 3);
      text(ctx, ppm.toFixed(0), 330, 240, { size: 110, weight: 800, align: 'right', color: alarm ? C.red : '#7ee0a0', fam: K.MONO });
      text(ctx, 'ppm H₂S', 350, 238, { size: 28, weight: 800, color: alarm ? C.red : '#7ee0a0' });
      if (alarm) {
        const fl = K.pulse(t, 0.6) > 0.5;
        circle(ctx, 180, 360, 34, fl ? C.red : darken(C.red, 0.5));
        text(ctx, 'ALARM', 300, 372, { size: 34, weight: 900, color: fl ? C.red : darken(C.red, 0.3) });
      }
      // warning sign
      ctx.save(); ctx.translate(820, 230);
      poly(ctx, [[0, -150], [170, 140], [-170, 140]]); ctx.fillStyle = C.yellow; ctx.fill(); ctx.lineJoin = 'round'; ctx.lineWidth = 12; ctx.strokeStyle = '#1a1206'; ctx.stroke();
      text(ctx, 'H₂S', 0, 90, { size: 84, weight: 900, align: 'center', color: '#1a1206' });
      ctx.restore();
      text(ctx, 'TOXIC GAS', 820, 420, { size: 28, weight: 900, align: 'center', color: C.yellow, spacing: 3 });
      // wind sock + escape upwind
      if (tt > 9) {
        const wx = 860, wy = 520;
        line(ctx, wx, wy, wx, wy + 140, '#cfd8e3', 6);
        for (let k = 0; k < 4; k++) { poly(ctx, [[wx + k * 42, wy + 4 + k * 2], [wx + (k + 1) * 42, wy + 6 + (k + 1) * 2], [wx + (k + 1) * 42, wy + 46 - (k + 1) * 2], [wx + k * 42, wy + 48 - k * 2]]); ctx.fillStyle = k % 2 ? '#fff' : C.orange; ctx.fill(); }
        arrow(ctx, 1100, 760, 760, 760, { color: C.green, lw: 6, head: 20 });
        text(ctx, 'wind →', 1060, 540, { size: 20, weight: 800, color: C.dim });
        text(ctx, 'escape upwind', 930, 820, { size: 24, weight: 900, align: 'center', color: C.green });
      }
      WG.infoBox(ctx, 40, 500, 520, 'H₂S', ['Toxic, heavier than air', 'Smells of rotten eggs at low levels…', '…but high levels kill your sense of smell', 'Detectors, alarms, breathing apparatus'], S.vis(1, 0.5, 1), { rv: tt * 0.3, color: C.red });
    }
    if (bi === 2) {
      const tt = S.since(2);
      const ch = WG.lineChart(ctx, 40, 40, 640, 560, [], 1, { min: 0, max: 300, title: 'WHEN DO HYDRATES FORM?', xlabel: 'temperature (°C) →', ylabel: 'pressure (bar)', grid: 6 });
      const Tx = (T) => ch.px + (T / 30) * ch.pw;
      const Ph = (T) => Math.min(300, 10 * Math.exp(0.113 * T));
      ctx.save(); ctx.beginPath(); ctx.moveTo(Tx(0), ch.Y(Ph(0)));
      for (let T = 0; T <= 30; T += 0.5) ctx.lineTo(Tx(T), ch.Y(Ph(T)));
      ctx.lineTo(Tx(0), ch.Y(300)); ctx.closePath(); ctx.fillStyle = rgba('#9fd8ff', 0.18); ctx.fill(); ctx.restore();
      const pts = []; for (let T = 0; T <= 30; T += 0.5) pts.push([Tx(T), ch.Y(Ph(T))]);
      K.partialPolyline(ctx, pts, 1, '#9fd8ff', 4);
      text(ctx, 'HYDRATE ZONE', Tx(5), ch.Y(230), { size: 22, weight: 900, color: '#bfe6ff' });
      text(ctx, 'no hydrates', Tx(22), ch.Y(40), { size: 20, weight: 800, color: C.dim });
      const cool = S.p(2, 5, 1.5);
      const T = lerp(28, 4, cool), P = 150;
      circle(ctx, Tx(T), ch.Y(P), 12, P > Ph(T) ? '#9fd8ff' : C.amber, '#fff', 3);
      if (cool > 0) tag(ctx, P > Ph(T) ? 'cold seabed: HYDRATES!' : 'warm well', Tx(T) + 20, ch.Y(P) - 40, { size: 18, color: P > Ph(T) ? '#9fd8ff' : C.amber, align: 'left', fill: 'rgba(7,17,28,0.92)' });
      // choke line plugging
      WG.panel(ctx, 720, 40, 450, 300, 'CHOKE LINE', C.dim);
      fillRR(ctx, 750, 150, 390, 90, 10, '#56687a');
      ctx.fillStyle = '#1c3d58'; ctx.fillRect(758, 160, 374, 70);
      const grow = clamp((tt - 5) / 6);
      const Rn = K.rng(3);
      for (let k = 0; k < 120 * grow; k++) {
        const x = 760 + Rn() * 370, y = 162 + Rn() * 66;
        const dx = Math.abs(x - 945) / 185;
        if (Rn() > 1 - dx * 0.7) continue;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Rn());
        poly(ctx, [[0, -6], [5, -3], [5, 3], [0, 6], [-5, 3], [-5, -3]]); ctx.fillStyle = rgba('#e8f6ff', 0.9); ctx.fill();
        ctx.restore();
      }
      if (grow > 0.6) tag(ctx, 'plugged with hydrate', 945, 290, { size: 20, color: '#9fd8ff', fill: 'rgba(7,17,28,0.92)' });
      WG.infoBox(ctx, 720, 370, 450, 'GAS HYDRATES', ['Ice-like solid of gas and water', 'High pressure + low temperature', 'Plugs BOP, choke & kill lines', 'Prevent: glycol / MEG, inhibited mud'], S.vis(2, 0.5, 1), { rv: tt * 0.3 });
    }
    if (bi === 3) {
      const tt = S.since(3);
      const pnl = [['AXIAL · bit bounce', C.amber], ['LATERAL · whirl', C.cyan], ['TORSIONAL · stick-slip', C.red]];
      pnl.forEach(([n, col], i) => { const a = S.vis(3, 0.5, 0.5 + i * 3); ctx.save(); ctx.globalAlpha *= a; WG.panel(ctx, 20 + i * 392, 20, 372, 560, n, col); ctx.restore(); });
      // axial
      ctx.save(); ctx.globalAlpha *= S.vis(3, 0.5, 0.5);
      ctx.save(); rr(ctx, 30, 70, 352, 500, 10); ctx.clip();
      K.lithoFill(ctx, 'rock3', 30, 70, 352, 500, 5);
      ctx.fillStyle = C.mud; ctx.fillRect(156, 70, 100, 440);
      const bounce = Math.abs(Math.sin(t * 9)) * 26;
      ST.metal(ctx, 186, 60 - bounce, 40, 380, '#9fb0c1');
      poly(ctx, [[176, 440 - bounce], [236, 440 - bounce], [226, 476 - bounce], [186, 476 - bounce]]); ctx.fillStyle = '#5b6b7b'; ctx.fill();
      if (bounce < 4) for (let k = 0; k < 5; k++) line(ctx, 206, 482, 206 + Math.cos(k * 1.2 + 0.4) * 40, 482 + Math.sin(k * 0.6) * 6 - 10, C.amber, 3);
      arrow(ctx, 300, 300, 300, 230, { color: C.amber, lw: 4, head: 12 }); arrow(ctx, 300, 300, 300, 370, { color: C.amber, lw: 4, head: 12 });
      ctx.restore(); ctx.restore();
      // lateral whirl (top view)
      ctx.save(); ctx.globalAlpha *= S.vis(3, 0.5, 3.5);
      const wx = 598, wy = 300;
      K.lithoFill(ctx, 'rock3', 422, 70, 352, 500, 6);
      circle(ctx, wx, wy, 150, C.mud);
      const ang = -t * 4;
      for (let k = 0; k < 12; k++) { const a2 = ang + k * 0.12; circle(ctx, wx + Math.cos(a2) * 90, wy + Math.sin(a2) * 90, 58 - k * 3, rgba(C.cyan, 0.06)); }
      circle(ctx, wx + Math.cos(ang) * 90, wy + Math.sin(ang) * 90, 58, '#a9b8c6', '#56687a', 3);
      circle(ctx, wx + Math.cos(ang) * 90, wy + Math.sin(ang) * 90, 22, '#4a5866');
      text(ctx, 'top view', wx, 540, { size: 18, weight: 800, align: 'center', color: '#1b1612' });
      ctx.restore();
      // torsional: rpm traces
      ctx.save(); ctx.globalAlpha *= S.vis(3, 0.5, 6.5);
      const bitRpm = (u) => { const ph = (u * 4 + t * 0.5) % 1; return ph < 0.45 ? 0 : ph < 0.75 ? 340 * Math.sin((ph - 0.45) / 0.3 * Math.PI) : 120 * (1 - (ph - 0.75) / 0.25) * 0.3; };
      WG.lineChart(ctx, 804, 70, 362, 460, [{ fn: bitRpm, color: C.red, lw: 3, n: 300 }, { fn: () => 120, color: C.green, lw: 3, dash: [8, 6] }], 1, { min: 0, max: 360, grid: 3, xlabel: 'time →', bg: 'rgba(0,0,0,0)', edge: 'rgba(0,0,0,0)' });
      text(ctx, 'bit RPM', 1060, 130, { size: 18, weight: 800, color: C.red });
      text(ctx, 'top drive RPM', 900, 360, { size: 18, weight: 800, color: C.green });
      ctx.restore();
      WG.infoBox(ctx, 20, 610, 1156, 'WHY IT MATTERS', ['Vibrations break bits, MWD/LWD tools and connections', 'Downhole sensors measure them in real time', 'The driller changes WOB and RPM to get out of them'], S.vis(3, 0.5, 10), { rv: (tt - 10) * 0.6 });
    }
    if (bi === 4) {
      WL.drawWell(ctx, PW, { t, string: null });
      const brk = S.since(4) > 3.5;
      const drop = brk ? Math.min(40, (S.since(4) - 3.5) * 120) : 0;
      const jump = brk ? 8 * Math.exp(-(S.since(4) - 3.5) * 3) : 0;
      pipe(ctx, CX, -10, 600 - jump);
      pipe(ctx, CX, 606 + drop, 840 + drop); bha(ctx, CX, 860 + Math.min(drop, 30));
      if (!brk) for (let k = 0; k < 6; k++) { const yy = 60 + ((t * 120 + k * 90) % 540); line(ctx, CX - 6, yy, CX + 6, yy + 6, rgba('#fff', 0.35), 2); }
      if (brk && S.since(4) < 4.4) { const Rn = K.rng(Math.floor(t * 30)); for (let k = 0; k < 16; k++) { const a = Rn() * Math.PI * 2; line(ctx, CX, 603, CX + Math.cos(a) * 40, 603 + Math.sin(a) * 30, C.amber, 2.5); } }
      if (brk) tag(ctx, 'TWIST-OFF', CX + 150, 603, { size: 26, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      const hl = brk ? 150 - Math.min(25, (S.since(4) - 3.5) * 60) : 150;
      const tq = brk ? 18 - Math.min(14, (S.since(4) - 3.5) * 40) : 18 + Math.sin(t * 5);
      const sp = brk ? 220 - Math.min(40, (S.since(4) - 3.5) * 90) : 220;
      gauge(ctx, 720, 180, 90, hl, { min: 0, max: 250, unit: 't', color: brk ? C.red : C.amber }); text(ctx, 'HOOK LOAD', 720, 312, { size: 18, weight: 900, align: 'center', color: C.dim });
      gauge(ctx, 940, 180, 90, tq, { min: 0, max: 40, unit: 'kNm', color: brk ? C.red : C.amber }); text(ctx, 'TORQUE', 940, 312, { size: 18, weight: 900, align: 'center', color: C.dim });
      gauge(ctx, 830, 430, 90, sp, { min: 0, max: 300, unit: 'bar', color: brk ? C.red : C.amber }); text(ctx, 'SPP', 830, 562, { size: 18, weight: 900, align: 'center', color: C.dim });
      if (brk) WG.infoBox(ctx, 620, 620, 550, 'SUDDEN DROP IN…', ['hook load (lost the weight below the break)', 'torque and pump pressure', '→ a fishing job'], S.vis(4, 0.5, 4.5), { rv: (S.since(4) - 4.5) * 0.8, color: C.red });
    }
    if (bi === 5) {
      const tt = S.since(5);
      K.lithoFill(ctx, 'rock4', 0, 0, 640, 940, 3);
      ctx.fillStyle = C.mud; ctx.fillRect(170, 0, 300, 880);
      ctx.fillStyle = '#3a2a18'; ctx.fillRect(170, 860, 300, 20);
      const down = S.p(5, 3, 1.5), up = S.p(5, 3, 7.5);
      const my = lerp(-60, 700, down) - 640 * up;
      const pieces = [['cone', 230, 840], ['wrench', 320, 850], ['die', 410, 845]];
      pieces.forEach(([k, x, y], i) => {
        const caught = down >= 1 && tt > 5 + i * 0.4;
        const px = caught ? 270 + i * 50 : x, py = caught ? my + 140 : y;
        ctx.save(); ctx.translate(px, py);
        if (k === 'cone') { poly(ctx, [[-22, 12], [22, 12], [0, -24]]); ctx.fillStyle = '#7d8a96'; ctx.fill(); for (let j = 0; j < 4; j++) circle(ctx, -10 + j * 7, 4 - j * 6, 3, '#cfd8e3'); }
        if (k === 'wrench') { ctx.rotate(0.3); fillRR(ctx, -32, -5, 64, 10, 4, '#b8c4cf'); circle(ctx, -32, 0, 10, '#b8c4cf'); }
        if (k === 'die') { fillRR(ctx, -14, -10, 28, 20, 3, '#9aa6b1'); for (let j = 0; j < 4; j++) line(ctx, -12, -8 + j * 5, 12, -8 + j * 5, '#56687a', 1.5); }
        ctx.restore();
      });
      ST.metal(ctx, 296, my - 700, 48, 700, '#9fb0c1');
      fillRR(ctx, 250, my, 140, 130, 10, '#c0392b', '#7a1f17', 3);
      text(ctx, 'MAGNET', 320, my + 74, { size: 20, weight: 900, align: 'center', color: '#fff' });
      if (down > 0.9 && up < 0.2) for (let k = 0; k < 3; k++) { ctx.save(); ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.arc(320, my + 130, 30 + k * 26 + (t * 40) % 26, 0.2, Math.PI - 0.2); ctx.strokeStyle = C.red; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
      text(ctx, 'junk on bottom', 320, 920, { size: 18, weight: 800, align: 'center', color: '#e8dcc8', alpha: 1 - down });
      WG.infoBox(ctx, 680, 60, 490, 'JUNK IN HOLE', ['Broken bit parts, lost tools, slip dies', 'Ruins the next bit', 'Removed with magnets, junk baskets or mills'], S.vis(5, 0.5, 0.5), { rv: tt * 0.4 + 0.3 });
      WG.infoBox(ctx, 680, 430, 490, 'PREVENTION', ['Keep the hole covered', 'Tie off and check your tools', 'Good housekeeping on the drill floor'], S.vis(5, 0.5, 9), { rv: (tt - 9) * 0.6, color: C.green });
    }
  },
};

module.exports = {
  id: 'ch15', num: 15, title: 'Drilling Problems',
  subtitle: 'Stuck pipe, losses, unstable hole and other bad days',
  topics: ['Stuck pipe', 'Differential sticking', 'Pack-off', 'Jarring', 'Free point', 'Fishing', 'Losses', 'LCM', 'Instability', 'Bit balling', 'Washout', 'Ballooning', 'Connection gas', 'H₂S', 'Hydrates', 'Stick-slip', 'Twist-off', 'Junk'],
  intro: 'Chapter fifteen: drilling problems. Every well has bad days. These are the words you will hear when things go wrong downhole, and they cost the most time and money.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    K.lithoFill(ctx, 'sand', 0, 0, 700, 900, 9);
    circle(ctx, 330, 420, 230, '#4a3420'); circle(ctx, 330, 420, 212, C.mud);
    const m = 0.5 + 0.5 * Math.sin(t * 0.7);
    const px = lerp(330, 330 - 132, m);
    circle(ctx, px, 420, 80, '#a9b8c6', '#56687a', 3); circle(ctx, px, 420, 48, '#4a5866');
    ctx.restore();
    ctx.strokeStyle = rgba(C.red, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [stuckScene, lossScene, hazScene],
};
