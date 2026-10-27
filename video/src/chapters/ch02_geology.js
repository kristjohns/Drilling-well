'use strict';
const K = require('../engine/core');
const G = require('../art/geo');
const R = require('../art/rig');
const I = require('../art/icons');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, dimLine } = K;

// ------------------------------------------------------------ petroleum system
const sys = {
  x0: 0, y0: 170, w: 1196,
  fold: { cx: 520, A: 115, sigma: 240 },
  layers: [
    { t: 110, kind: 'clay', fold: 0.12, name: 'Overburden' },
    { t: 90, kind: 'rock2', fold: 0.3 },
    { t: 70, kind: 'chalk', fold: 0.55 },
    { t: 70, kind: 'shale', fold: 0.9, name: 'Cap rock' },
    { t: 80, kind: 'sand', fold: 1, name: 'Reservoir' },
    { t: 60, kind: 'rock4', fold: 1 },
    { t: 70, kind: 'source', fold: 1, name: 'Source rock' },
    { t: 200, kind: 'rock5', fold: 1 },
  ],
};
function trapIcons(ctx, x, y, a, t) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, x, y, 470, 200, 14, 'rgba(7,17,28,0.88)', C.panelEdge, 2);
  const kinds = ['Anticline', 'Fault trap', 'Stratigraphic'];
  kinds.forEach((k, i) => {
    const cx = x + 80 + i * 155, cy = y + 95;
    ctx.save(); ctx.beginPath(); ctx.rect(cx - 65, cy - 55, 130, 100); ctx.clip();
    ctx.fillStyle = C.shale; ctx.fillRect(cx - 65, cy - 55, 130, 100);
    if (i === 0) {
      ctx.beginPath(); ctx.moveTo(cx - 65, cy + 30); ctx.quadraticCurveTo(cx, cy - 60, cx + 65, cy + 30); ctx.lineTo(cx + 65, cy + 50); ctx.quadraticCurveTo(cx, cy - 30, cx - 65, cy + 50); ctx.closePath();
      ctx.fillStyle = C.sand; ctx.fill();
      ctx.save(); ctx.clip(); ctx.fillStyle = rgba(C.oil, 0.85); ctx.fillRect(cx - 40, cy - 40, 80, 40); ctx.restore();
    } else if (i === 1) {
      ctx.fillStyle = C.sand;
      poly(ctx, [[cx - 65, cy + 10], [cx + 5, cy - 25], [cx + 5, cy + 5], [cx - 65, cy + 40]]); ctx.fill();
      poly(ctx, [[cx + 5, cy + 25], [cx + 65, cy - 5], [cx + 65, cy + 25], [cx + 5, cy + 55]]); ctx.fill();
      ctx.fillStyle = rgba(C.oil, 0.85); poly(ctx, [[cx - 25, cy - 5], [cx + 5, cy - 25], [cx + 5, cy + 5], [cx - 25, cy + 20]]); ctx.fill();
      line(ctx, cx + 5, cy - 55, cx + 5, cy + 50, C.red, 3);
    } else {
      ctx.fillStyle = C.sand;
      poly(ctx, [[cx - 65, cy + 20], [cx + 30, cy - 20], [cx - 65, cy + 50]]); ctx.fill();
      ctx.fillStyle = rgba(C.oil, 0.85); poly(ctx, [[cx - 5, cy - 8], [cx + 30, cy - 20], [cx - 5, cy + 8]]); ctx.fill();
    }
    ctx.restore();
    ctx.strokeStyle = C.steelDark; ctx.lineWidth = 2; ctx.strokeRect(cx - 65, cy - 55, 130, 100);
    text(ctx, k, cx, cy + 78, { size: 18, weight: 700, align: 'center', color: C.text });
  });
  ctx.restore();
}
const systemScene = {
  id: 'system',
  title: 'The petroleum system',
  blurb: 'Five ingredients must all be present for a discovery.',
  beats: [
    {
      term: 'Source rock', no: 'kildebergart',
      def: 'An organic-rich shale that generates oil and gas when buried deep and hot enough. On the NCS the classic source rock is the Upper Jurassic Draupne Formation (Spekk in the Norwegian Sea).',
      say: 'It starts with a source rock: an organic rich shale that generates oil and gas when it is buried deep and hot enough. On the shelf the classic source rock is the Upper Jurassic Draupne Formation.',
    },
    {
      term: 'Migration', no: 'migrasjon',
      def: 'Oil and gas are lighter than water, so they move upwards out of the source rock and along permeable carrier beds and faults, until something stops them.',
      say: 'Oil and gas are lighter than the water in the rocks, so they migrate upwards, along permeable layers and faults, until something stops them.',
    },
    {
      term: 'Reservoir rock', no: 'reservoarbergart',
      def: 'A porous, permeable rock that can store and deliver hydrocarbons: usually sandstone (e.g. the Brent Group), sometimes chalk or limestone.',
      ex: 'Top reservoir came in at 2,465 metres.',
      say: 'The reservoir is a porous, permeable rock that can store and deliver the hydrocarbons, usually sandstone, sometimes chalk or limestone.',
    },
    {
      term: 'Seal / cap rock', no: 'takbergart',
      def: 'A tight rock above the reservoir, typically shale or salt, that stops hydrocarbons from escaping further up.',
      say: 'Above it there must be a seal, or cap rock, typically shale or salt, that stops the hydrocarbons escaping further up.',
    },
    {
      term: 'Trap', no: 'felle',
      def: 'The geometry that holds hydrocarbons in place: structural traps (anticlines, fault blocks) or stratigraphic traps (pinch-outs, unconformities). The spill point is the lowest point that can hold fluids.',
      say: 'And there must be a trap: a geometry that holds the hydrocarbons in place. It can be structural, like a dome or a tilted fault block, or stratigraphic, like a sand body that pinches out. Gas collects at the top, oil below it, and water underneath.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    R.sky(ctx, 1196, 80, { top: '#0a1825', bot: '#163a5a' });
    R.sea(ctx, 1196, 80, 170, t, { amp: 3 });
    R.semi(ctx, 900, 80, 0.32, t, { heave: Math.sin(t) * 1.5 });
    const hlMap = { 0: 6, 2: 4, 3: 3 };
    const hl = hlMap[S.bi] != null ? hlMap[S.bi] : -1;
    G.drawStrata(ctx, sys, { highlight: hl, hlAlpha: hl >= 0 ? S.hl(S.bi) : 0, dimOthers: hl >= 0 ? 0.5 * S.hl(S.bi) : 0, t });
    // heat in the kitchen
    if (S.bi === 0) {
      const a = S.hl(0);
      for (let i = 0; i < 8; i++) {
        const x = 120 + i * 140, y0 = G.boundaryY(sys, 7, x) + 40;
        const ph = (t * 0.6 + i * 0.13) % 1;
        ctx.save(); ctx.globalAlpha *= a * (1 - ph);
        arrow(ctx, x, y0 + 40 - ph * 30, x, y0 - ph * 30, { color: C.orange, lw: 3, head: 10 });
        ctx.restore();
      }
      text(ctx, 'heat + time → oil & gas', 120, 900, { size: 26, weight: 700, color: C.orange, alpha: S.p(0, 0.6, 2.5) });
      // bubbles forming in source rock
      for (let i = 0; i < 26; i++) {
        const x = 40 + ((i * 97) % 1120);
        const y = (G.boundaryY(sys, 6, x) + G.boundaryY(sys, 7, x)) / 2 + Math.sin(i * 3.1) * 18;
        const v = S.vis(0, 0.4, 2 + (i % 9) * 0.25);
        circle(ctx, x, y, 4.5 * v, i % 3 ? C.oil : C.gas);
      }
    }
    // migration paths
    const pathL = [], pathR = [];
    for (let x = 60; x <= 500; x += 20) pathL.push([x, G.boundaryY(sys, 5, x) - 8]);
    for (let x = 1140; x >= 540; x -= 20) pathR.push([x, G.boundaryY(sys, 5, x) - 8]);
    const up = (x) => [[x, (G.boundaryY(sys, 6, x) + G.boundaryY(sys, 7, x)) / 2], [x, G.boundaryY(sys, 5, x) - 8]];
    const migA = S.bi === 1 ? S.hl(1) : S.bi >= 2 && S.bi <= 3 ? 0.5 : 0;
    if (migA > 0) {
      G.migration(ctx, [[...up(60), ...pathL.slice(1)], [...up(1140), ...pathR.slice(1)], [...up(300), ...pathL.slice(12)], [...up(900), ...pathR.slice(12)]], t, { alpha: migA, speed: 70, count: 8 });
    }
    // fluids in trap
    const fillA = S.bi >= 3 ? S.p(3, 2.5, 1.0) : 0;
    if (fillA > 0) {
      const crest = G.boundaryY(sys, 4, 520);
      G.fluids(ctx, sys, 4, { goc: crest + 28, owc: crest + 28 + 50 * fillA, alpha: 0.8, waterA: 0.0 });
    }
    if (S.bi >= 4) {
      const crest = G.boundaryY(sys, 4, 520);
      const owc = crest + 78;
      G.fluids(ctx, sys, 4, { goc: crest + 28, owc, alpha: 0.85, waterA: 0.9 * S.p(4, 0.8) });
      const sp = S.p(4, 0.6, 2.0);
      const [xs, xe] = G.closureX(sys, 4, owc);
      if (sp > 0) {
        line(ctx, xs - 60, owc, xe + 60, owc, rgba('#ffffff', 0.8 * sp), 2, [8, 6]);
        text(ctx, 'gas', 520, crest + 22, { size: 18, weight: 800, align: 'center', color: '#fff', alpha: sp });
        text(ctx, 'oil', 520, crest + 62, { size: 18, weight: 800, align: 'center', color: '#fff', alpha: sp });
      }
      trapIcons(ctx, 710, 715, S.p(4, 0.6, 6.0), t);
    }
    // layer labels
    const labels = [[0, 6, 'SOURCE ROCK', C.orange], [2, 4, 'RESERVOIR', C.sand], [3, 3, 'SEAL / CAP ROCK', C.steel]];
    for (const [bi, li, s, col] of labels) {
      if (!S.on(bi)) continue;
      const x = 1000;
      const y = (G.boundaryY(sys, li, x) + G.boundaryY(sys, li + 1, x)) / 2;
      callout(ctx, 820, y, 930, y - 40, s, { color: col, size: 22, t: S.p(bi, 0.6, 0.6), alpha: S.bi === bi ? 1 : 0.7 });
    }
    if (S.on(1)) {
      const a = S.bi === 1 ? S.p(1, 0.6, 1) : 0;
      if (a > 0) text(ctx, 'MIGRATION ↑', 140, 560, { size: 26, weight: 800, color: C.oil, alpha: a });
    }
    if (S.bi === 4) callout(ctx, 520, G.boundaryY(sys, 4, 520) + 4, 360, 300, 'TRAP (anticline)', { color: C.amber, size: 22, t: S.p(4, 0.6, 0.8) });
  },
};

// ------------------------------------------------------------ rock properties
function grains(ctx, cx, cy, r, t, opt = {}) {
  const { poreColor = rgba(C.oil, 0.75), flow = 0, seed = 4 } = opt;
  ctx.save();
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = poreColor; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r);
  const Rr = K.rng(seed);
  const pts = [];
  for (let gy = -r; gy < r; gy += 46) for (let gx = -r; gx < r; gx += 46) {
    const x = cx + gx + (Rr() - 0.5) * 16 + ((gy / 46) % 2 ? 23 : 0), y = cy + gy + (Rr() - 0.5) * 16;
    const gr = 19 + Rr() * 6;
    pts.push([x, y, gr]);
  }
  for (const [x, y, gr] of pts) {
    const g = ctx.createRadialGradient(x - gr * 0.3, y - gr * 0.3, 2, x, y, gr);
    g.addColorStop(0, '#f1d9a0'); g.addColorStop(1, '#b98f4a');
    ctx.beginPath(); ctx.ellipse(x, y, gr, gr * 0.86, (x + y) % 3, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
  }
  if (flow > 0) {
    for (let k = 0; k < 7; k++) {
      const yy = cy - r + 40 + k * ((2 * r - 80) / 6);
      const pts2 = [];
      for (let x = cx - r; x <= cx + r; x += 12) pts2.push([x, yy + Math.sin(x / 23 + k) * 14]);
      K.flow(ctx, pts2, t + k * 0.3, { spacing: 60, speed: 80, color: '#ffffff', r: 4, alpha: flow * 0.9 });
    }
  }
  ctx.restore();
  circle(ctx, cx, cy, r, null, C.steel, 6);
}
const propsScene = {
  id: 'props',
  title: 'Reservoir properties',
  blurb: 'How much a rock can hold, and how easily it lets go.',
  beats: [
    {
      term: 'Porosity', abbr: 'φ', no: 'porøsitet',
      def: 'The fraction of the rock volume that is pore space, available to hold fluids. Good sandstones: 20–30 %.',
      say: 'Porosity is the fraction of the rock that is empty pore space, available to hold fluids. A good sandstone has twenty to thirty percent.',
    },
    {
      term: 'Permeability', abbr: 'k | mD', no: 'permeabilitet',
      def: 'How easily fluids flow through the rock, measured in millidarcy (mD). Good reservoir: hundreds of mD or more; shale: far below 1 mD.',
      ex: 'Nice sand, but the perm is poor, we’re seeing tight streaks.',
      say: 'Permeability is how easily fluids flow through the pores, measured in millidarcy. A good reservoir has hundreds of millidarcy. A shale is so tight it acts as a seal. People just say perm.',
    },
    {
      term: 'Lithology', no: 'litologi',
      def: 'The rock type: sandstone (reservoir), shale/claystone (seal or source), limestone and chalk (reservoir in places, e.g. Ekofisk chalk), plus salt, coal and others.',
      say: 'Lithology simply means rock type. Sandstone is the typical reservoir. Shale, or claystone, is a seal or a source. Limestone and chalk can be reservoirs too, like the chalk fields in the southern North Sea.',
    },
    {
      term: 'Fluid contacts', abbr: 'GOC | OWC | FWL', no: 'væskekontakter',
      def: 'Horizontal boundaries between fluids in the reservoir: gas–oil contact (GOC), oil–water contact (OWC), or gas–water (GWC). The free water level (FWL) is the base of the capillary transition zone.',
      ex: 'We didn’t see the OWC, it’s oil down to.',
      say: 'Fluids stack by density, so the reservoir has contacts: the gas oil contact, GOC, and the oil water contact, OWC. Finding the contacts is a key goal of an exploration well. If you never see water, the log shows oil down to the base of the reservoir.',
    },
    {
      term: 'Hydrocarbon column & net pay', abbr: 'N/G', no: 'hydrokarbonkolonne',
      def: 'Column = vertical height from the top of the trap to the contact. Net pay = the reservoir intervals that actually contain producible hydrocarbons. Net-to-gross (N/G) = net sand ÷ gross interval.',
      say: 'The hydrocarbon column is the vertical height from the top of the trap down to the contact. Not all of it is good rock, so we talk about net pay, the part that can produce, and net to gross, the fraction of good sand.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 1) {
      grains(ctx, 360, 470, 300, t, { poreColor: rgba(C.water, 0.85), flow: bi === 1 ? S.p(1, 1, 0.5) : 0 });
      text(ctx, 'SANDSTONE UNDER THE MICROSCOPE', 360, 130, { size: 22, weight: 800, align: 'center', color: C.dim, spacing: 2 });
      const a = S.p(0, 0.8, 1.5);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 730, 260, 400, 150, 18, rgba(C.water, 0.15), C.water, 2);
      text(ctx, 'φ = 25 %', 930, 345, { size: 60, weight: 900, align: 'center', color: C.text });
      text(ctx, 'blue = pore space', 930, 388, { size: 20, weight: 600, align: 'center', color: C.dim });
      ctx.restore();
      if (bi === 1) {
        const b = S.p(1, 0.8, 1.2);
        ctx.save(); ctx.globalAlpha *= b;
        fillRR(ctx, 730, 470, 400, 120, 18, rgba(C.green, 0.12), C.green, 2);
        text(ctx, 'k = 500 mD', 930, 530, { size: 44, weight: 900, align: 'center', color: C.green });
        text(ctx, 'good sand: connected pores', 930, 568, { size: 19, weight: 600, align: 'center', color: C.dim });
        fillRR(ctx, 730, 620, 400, 120, 18, rgba(C.red, 0.12), C.red, 2);
        text(ctx, 'k < 0.01 mD', 930, 680, { size: 44, weight: 900, align: 'center', color: C.red });
        text(ctx, 'shale: a seal', 930, 718, { size: 19, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
      }
    } else if (bi === 2) {
      const cols = [['sand', 'Sandstone', 'reservoir'], ['shale', 'Shale / claystone', 'seal · source'], ['chalk', 'Chalk / limestone', 'reservoir (some areas)'], ['salt', 'Salt', 'excellent seal']];
      cols.forEach(([k, n, role], i) => {
        const x = 90 + i * 270, v = S.vis(2, 0.5, 0.3 + i * 0.6, ease.outBack);
        if (v <= 0) return;
        ctx.save(); ctx.globalAlpha *= clamp(v);
        ctx.save(); rr(ctx, x, 180, 200, 480, 100); ctx.clip();
        K.lithoFill(ctx, k, x, 180, 200, 480, 3 + i);
        ctx.restore();
        rr(ctx, x, 180, 200, 480, 100); ctx.strokeStyle = C.steelDark; ctx.lineWidth = 3; ctx.stroke();
        text(ctx, n, x + 100, 720, { size: 24, weight: 800, align: 'center', color: C.text });
        text(ctx, role, x + 100, 754, { size: 20, weight: 600, align: 'center', color: C.amber });
        ctx.restore();
      });
      text(ctx, 'CORE-STYLE SAMPLES', 598, 130, { size: 22, weight: 800, align: 'center', color: C.dim, spacing: 2 });
    } else {
      // zoomed anticline reservoir with contacts
      const sp = { x0: 40, y0: 160, w: 1116, fold: { cx: 560, A: 210, sigma: 330 }, layers: [{ t: 230, kind: 'shale', fold: 0.9 }, { t: 170, kind: 'sand', fold: 1 }, { t: 400, kind: 'rock4', fold: 1 }] };
      ctx.save(); rr(ctx, 40, 80, 1116, 820, 14); ctx.clip();
      G.drawStrata(ctx, sp, { t });
      const crest = G.boundaryY(sp, 1, 560);
      const goc = crest + 60, owc = crest + 150;
      G.fluids(ctx, sp, 1, { goc, owc, alpha: 0.85, waterA: 0.85 });
      ctx.restore();
      const lines = [[goc, 'GOC', 'gas–oil contact', C.gas], [owc, 'OWC', 'oil–water contact', C.water]];
      lines.forEach(([y, a, b, col], i) => {
        const v = S.p(3, 0.6, 1 + i * 1.2);
        if (v <= 0) return;
        line(ctx, 60, y, lerp(60, 1140, v), y, '#ffffff', 3, [14, 8]);
        ctx.save(); ctx.globalAlpha *= v;
        fillRR(ctx, 70, y - 50, 250, 40, 8, 'rgba(7,17,28,0.85)', col, 2);
        text(ctx, a + '  ' + b, 84, y - 22, { size: 20, weight: 800, color: '#fff' });
        ctx.restore();
      });
      const fw = S.p(3, 0.6, 3.6);
      if (fw > 0) { line(ctx, 700, owc + 22, lerp(700, 1140, fw), owc + 22, rgba(C.cyan, 0.9), 2, [4, 6]); text(ctx, 'FWL', 1140, owc + 48, { size: 18, weight: 800, align: 'right', color: C.cyan, alpha: fw }); }
      text(ctx, 'GAS', 560, crest + 40, { size: 26, weight: 900, align: 'center', color: '#fff', alpha: S.p(3, 0.5, 0.5) });
      text(ctx, 'OIL', 560, crest + 115, { size: 26, weight: 900, align: 'center', color: '#fff', alpha: S.p(3, 0.5, 0.8) });
      text(ctx, 'WATER', 560, crest + 200, { size: 26, weight: 900, align: 'center', color: '#fff', alpha: S.p(3, 0.5, 1.1) });
      if (bi === 4) {
        const v = S.p(4, 0.8, 0.5);
        dimLine(ctx, 860, crest + 4, 860, owc, '', { color: C.amber, alpha: v });
        ctx.save(); ctx.globalAlpha *= v;
        fillRR(ctx, 880, crest + 40, 250, 80, 10, 'rgba(7,17,28,0.88)', C.amber, 2);
        text(ctx, 'HC column', 900, crest + 72, { size: 22, weight: 800, color: C.amber });
        text(ctx, 'top trap → OWC', 900, crest + 102, { size: 18, weight: 600, color: C.dim });
        ctx.restore();
        // net/gross strip
        const n = S.p(4, 0.8, 4.0);
        if (n > 0) {
          ctx.save(); ctx.globalAlpha *= n;
          const sx = 1060, sy = 560, sh = 300;
          fillRR(ctx, sx - 160, sy - 50, 250, sh + 110, 12, 'rgba(7,17,28,0.9)', C.panelEdge, 2);
          const bands = [0, 0.18, 0.26, 0.5, 0.58, 0.8, 0.86, 1];
          for (let i = 0; i < bands.length - 1; i++) {
            const isSand = i % 2 === 0;
            K.lithoFill(ctx, isSand ? 'sand' : 'shale', sx - 130, sy + bands[i] * sh, 70, (bands[i + 1] - bands[i]) * sh, i);
            if (isSand) { ctx.fillStyle = rgba(C.oil, 0.5); ctx.fillRect(sx - 130, sy + bands[i] * sh, 70, (bands[i + 1] - bands[i]) * sh); }
          }
          text(ctx, 'gross', sx - 40, sy + 20, { size: 18, weight: 700, color: C.dim });
          text(ctx, 'net pay', sx - 40, sy + 60, { size: 18, weight: 700, color: C.oil });
          text(ctx, 'N/G = 0.74', sx - 35, sy + sh + 40, { size: 26, weight: 900, align: 'center', color: C.text });
          ctx.restore();
        }
      }
    }
  },
};

// ------------------------------------------------------------ seismic
const gg = (x, c = 500, s = 220) => Math.exp(-Math.pow((x - c) / s, 2));
const reflectors = [
  { y: (x) => 90 + Math.sin(x / 90) * 3, rc: 0.9 },
  { y: (x) => 200 - 15 * gg(x), rc: 0.35 },
  { y: (x) => 270 - 30 * gg(x), rc: -0.3 },
  { y: (x) => 350 - 70 * gg(x), rc: 0.45 },
  { y: (x) => 410 - 95 * gg(x), rc: -0.55, amp: (x) => 1 + 1.6 * gg(x, 500, 120) },
  { y: (x) => 470 - 95 * gg(x), rc: 0.4 },
  { y: (x) => 550 - 85 * gg(x), rc: 0.35 },
  { y: (x) => 620 - 70 * gg(x), rc: -0.3 },
  { y: () => 400, rc: 0.7, amp: (x) => (x > 380 && x < 620 ? Math.min(1, Math.min(x - 380, 620 - x) / 30) : 0) },
];
const seismicScene = {
  id: 'seismic',
  title: 'Seismic: seeing below the seabed',
  blurb: 'Sound waves are used to map the rock layers before anyone drills.',
  beats: [
    {
      term: 'Seismic survey', abbr: '2D | 3D', no: 'seismikk',
      def: 'A vessel fires air guns; sound reflects off rock layers and is recorded by hydrophones on long streamers. 2D = single lines; 3D = a dense grid giving a full cube of data.',
      say: 'Before anyone drills, the area is mapped with seismic. A vessel fires air guns, the sound reflects off the rock layers, and hydrophones on long streamers record the echoes. Two D means single lines. Three D is a dense grid that gives a full cube of data.',
    },
    {
      term: 'Reflector & horizon', no: 'reflektor / horisont',
      def: 'A reflector is a strong seismic event where rock properties change. Interpreters pick reflectors across the data as horizons, such as top reservoir or the base Cretaceous unconformity.',
      ex: 'The top reservoir pick is uncertain on the flank.',
      say: 'Wherever rock properties change, you get a reflector. Geophysicists trace reflectors across the data as horizons, for example top reservoir, and map them.',
    },
    {
      term: 'Two-way time & depth conversion', abbr: 'TWT', no: 'toveis gangtid',
      def: 'Seismic is recorded in time: milliseconds for the sound to go down and back (TWT). A velocity model converts time to depth, and its uncertainty drives the depth prognosis.',
      say: 'Seismic is recorded in time, not depth: the two way time, in milliseconds, for the sound to go down and back up. A velocity model converts it to depth. That conversion is one of the biggest uncertainties in the well prognosis.',
    },
    {
      term: 'Direct hydrocarbon indicator', abbr: 'DHI', no: 'direkte hydrokarbonindikator',
      def: 'A seismic sign that hydrocarbons may be present: a bright spot (strong amplitude from gas sand) or a flat spot (a flat reflector at a fluid contact cutting across dipping layers). AVO analysis tests these.',
      ex: 'There’s a nice flat spot conforming to structure.',
      say: 'Sometimes the seismic gives a direct hydrocarbon indicator, or DHI. A bright spot is an unusually strong reflection, often from a gas sand. A flat spot is a flat reflector at a fluid contact, cutting across the dipping layers.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    if (S.bi <= 0) {
      R.sky(ctx, 1196, 150, { top: '#0a1825', bot: '#163a5a' });
      R.sea(ctx, 1196, 150, 330, t, { amp: 4 });
      // simple layers
      const spec = { x0: 0, y0: 330, w: 1196, fold: { cx: 600, A: 60, sigma: 260 }, layers: [{ t: 140, kind: 'clay', fold: 0.3 }, { t: 120, kind: 'rock2', fold: 0.6 }, { t: 90, kind: 'sand', fold: 1 }, { t: 400, kind: 'rock4', fold: 1 }] };
      G.drawStrata(ctx, spec, { t });
      line(ctx, 0, 330, 1196, 330, '#8a7457', 3);
      // vessel moving
      const vx = 300 + (S.since(0) * 22) % 300;
      I.ship(ctx, vx + 160, 146, 110, { color: '#2f6fb3' });
      // streamer
      line(ctx, vx + 100, 152, vx - 260, 162, '#f0c419', 3);
      for (let i = 0; i < 9; i++) circle(ctx, vx + 80 - i * 40, 153 + i * 1.1, 4, '#f0c419');
      // source and wavefronts
      const sx = vx + 110, sy = 160;
      for (let k = 0; k < 4; k++) {
        const ph = ((t * 0.5 + k * 0.25) % 1);
        ctx.save(); ctx.globalAlpha *= (1 - ph) * 0.8;
        ctx.beginPath(); ctx.arc(sx, sy, 20 + ph * 700, 0.1, Math.PI - 0.1); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      // reflection rays
      const rp = S.p(0, 1, 3);
      if (rp > 0) {
        for (const [bi2, hx] of [[1, 0.7], [2, 0.5], [3, 0.35]]) {
          const yb = G.boundaryY(spec, bi2, sx - 100 * hx);
          const rx = sx - 220 * hx;
          K.curvedArrow(ctx, [[sx, sy], [sx - 110 * hx, yb]], { color: rgba(C.amber, 0.9), lw: 2.5, head: 10, t: rp });
          K.curvedArrow(ctx, [[sx - 110 * hx, yb], [rx, 158]], { color: rgba(C.cyan, 0.9), lw: 2.5, head: 10, t: clamp(rp * 2 - 1) });
        }
      }
      // 2D vs 3D inset
      const ia = S.p(0, 0.6, 9);
      if (ia > 0) {
        ctx.save(); ctx.globalAlpha *= ia;
        fillRR(ctx, 760, 640, 400, 260, 14, 'rgba(7,17,28,0.9)', C.panelEdge, 2);
        text(ctx, '2D', 860, 690, { size: 26, weight: 900, align: 'center', color: C.amber });
        text(ctx, '3D', 1060, 690, { size: 26, weight: 900, align: 'center', color: C.cyan });
        for (let i = 0; i < 4; i++) line(ctx, 790, 720 + i * 45, 930, 720 + i * 45 + 20, C.amber, 2);
        line(ctx, 830, 715, 870, 870, C.amber, 2);
        for (let i = 0; i < 16; i++) line(ctx, 990, 715 + i * 10, 1130, 715 + i * 10, C.cyan, 1.5);
        ctx.restore();
      }
      return;
    }
    // seismic section
    const sx = 100, sy = 110, sw = 1000, sh = 700;
    const img = G.seismicImage('main', sw, sh, reflectors);
    ctx.drawImage(img, sx, sy);
    ctx.strokeStyle = C.steelDark; ctx.lineWidth = 2; ctx.strokeRect(sx, sy, sw, sh);
    // horizon picks
    const pick = (fn, col, name, d) => {
      const p = S.p(1, 2.0, d);
      if (p <= 0) return;
      const pts = []; for (let x = 0; x <= sw; x += 8) pts.push([sx + x, sy + fn(x)]);
      K.partialPolyline(ctx, pts, p, col, 4);
      if (p > 0.9) tag(ctx, name, sx + sw - 10, sy + fn(sw) - 22, { size: 18, color: col, align: 'right' });
    };
    pick(reflectors[4].y, C.amber, 'Top reservoir', 0.8);
    pick(reflectors[3].y, C.green, 'BCU', 2.5);
    pick(reflectors[0].y, C.cyan, 'Seabed', 4.0);
    // time axis
    for (let i = 0; i <= 7; i++) {
      const y = sy + i * 100;
      line(ctx, sx - 12, y, sx, y, C.dim, 2);
      text(ctx, String(1000 + i * 250), sx - 18, y + 6, { size: 16, weight: 600, align: 'right', color: C.dim, fam: K.MONO });
    }
    text(ctx, 'TWT (ms)', sx - 70, sy - 20, { size: 18, weight: 800, color: C.dim });
    if (S.bi === 2) {
      const a = S.p(2, 0.8, 0.5);
      // ray down and back
      const rx = sx + 500, ry = sy + reflectors[4].y(500);
      K.curvedArrow(ctx, [[rx - 40, sy + 10], [rx - 40, ry]], { color: C.amber, lw: 4, t: S.p(2, 1, 0.8) });
      K.curvedArrow(ctx, [[rx + 40, ry], [rx + 40, sy + 10]], { color: C.cyan, lw: 4, t: S.p(2, 1, 1.8) });
      text(ctx, 'down…', rx - 52, sy + 160, { size: 20, weight: 700, color: C.amber, align: 'right', alpha: a });
      text(ctx, '…and back', rx + 52, sy + 160, { size: 20, weight: 700, color: C.cyan, alpha: a });
      const b = S.p(2, 0.8, 4.5);
      ctx.save(); ctx.globalAlpha *= b;
      fillRR(ctx, 640, 600, 440, 190, 14, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, 'depth = velocity × TWT ÷ 2', 860, 650, { size: 24, weight: 800, align: 'center', color: C.text });
      text(ctx, '1,900 ms × 2,500 m/s ÷ 2', 860, 695, { size: 22, weight: 600, align: 'center', color: C.dim, fam: K.MONO });
      text(ctx, '≈ 2,375 m  ± 40 m', 860, 745, { size: 30, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
      ctx.restore();
    }
    if (S.bi === 3) {
      const a = S.p(3, 0.6, 0.8);
      const fx = sx + 500, fy = sy + 400;
      ctx.save(); ctx.globalAlpha *= a;
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 4; ctx.setLineDash([10, 6]);
      ctx.beginPath(); ctx.ellipse(fx, sy + reflectors[4].y(500) + 4, 150, 34, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      callout(ctx, fx + 140, sy + reflectors[4].y(500) - 10, fx + 300, sy + 200, 'BRIGHT SPOT', { color: C.yellow, size: 24, t: a });
      const b = S.p(3, 0.6, 3.5);
      ctx.save(); ctx.globalAlpha *= b;
      ctx.strokeStyle = C.green; ctx.lineWidth = 4; ctx.setLineDash([10, 6]);
      ctx.strokeRect(fx - 130, fy - 18, 260, 36);
      ctx.restore();
      callout(ctx, fx + 120, fy + 10, fx + 200, fy + 170, 'FLAT SPOT (fluid contact)', { color: C.green, size: 24, t: b });
    }
  },
};

// ------------------------------------------------------------ prospect & volumes
function blob(ctx, cx, cy, r, k, seed = 1) {
  ctx.beginPath();
  for (let a = 0; a <= Math.PI * 2 + 0.01; a += 0.1) {
    const rr2 = r * (1 + 0.18 * Math.sin(a * 2 + seed) + 0.1 * Math.sin(a * 3 + seed * 2)) * k;
    const x = cx + Math.cos(a) * rr2 * 1.35, y = cy + Math.sin(a) * rr2 * 0.85;
    a ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath();
}
const prospectScene = {
  id: 'prospect',
  title: 'Play, lead, prospect and volumes',
  blurb: 'From a regional idea to a drillable target with a price tag on the risk.',
  beats: [
    {
      term: 'Play', no: 'lete­modell (play)',
      def: 'A regional concept: a family of possible accumulations sharing the same reservoir, seal and charge, e.g. “the Upper Jurassic sandstone play”.',
      say: 'A play is a regional idea: a family of possible accumulations that share the same reservoir, seal and source, for example, the Upper Jurassic sandstone play.',
    },
    {
      term: 'Lead', no: 'lead',
      def: 'A possible trap that is not yet mapped well enough to drill: maybe poor seismic coverage, or unclear closure.',
      say: 'A lead is a possible trap that is not yet well enough defined to drill. Maybe the seismic is poor, or the closure is unclear.',
    },
    {
      term: 'Prospect', no: 'prospekt',
      def: 'A mapped, drillable trap with estimated volumes and risk. Prospects get names, and the exploration well is designed to test one (or more).',
      ex: 'The well will test the prospect’s Middle Jurassic reservoir.',
      say: 'When the trap is mapped and drillable, with estimated volumes and risk, it becomes a prospect. Prospects get names, and the exploration well is designed to test one.',
    },
    {
      term: 'Chance of success', abbr: 'POS | COS', no: 'funnsannsynlighet',
      def: 'The geological probability of finding moving hydrocarbons, the product of the chances for reservoir, trap, seal and charge. Typical exploration POS: 15–40 %.',
      ex: 'It’s a 30 percent chance well, so plan the P&A properly.',
      say: 'The chance of success, POS, is the probability of finding hydrocarbons. It is the product of the chances that each element works: reservoir, trap, seal and charge. Exploration wells often have fifteen to forty percent.',
    },
    {
      term: 'P90 / P50 / P10', abbr: 'P90 | P50 | P10',
      def: 'Volume estimates from a probability distribution. P90 = low case (90 % chance of at least this much), P50 = median, P10 = high case (only 10 % chance of more).',
      say: 'Volumes are given as a range. P ninety is the low case, with a ninety percent chance of at least that much. P fifty is the median, and P ten is the high case, with only a ten percent chance of more.',
    },
    {
      term: 'In-place vs recoverable', abbr: 'STOIIP | GIIP | Sm³ o.e.', no: 'tilstede / utvinnbart',
      def: 'In-place volumes (STOIIP for oil, GIIP for gas) are what is in the rock; recoverable resources are what can be produced. The NCS reports in standard cubic metres (Sm³), often million Sm³ oil equivalents (MSm³ o.e.). 1 Sm³ ≈ 6.29 barrels.',
      ex: 'Preliminary estimate: 4 to 9 million standard cubic metres of recoverable oil equivalents.',
      say: 'In place volumes, called STOIIP for oil and GIIP for gas, are what is in the rock. Only part of it is recoverable. On the shelf, volumes are reported in standard cubic metres, often millions of standard cubic metres of oil equivalents. One standard cubic metre is about six point three barrels.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 2) {
      // map view
      ctx.fillStyle = '#0d2a40'; ctx.fillRect(0, 0, 1196, 940);
      ctx.strokeStyle = rgba('#7fb3d5', 0.08); ctx.lineWidth = 1;
      for (let x = 0; x < 1196; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 940); ctx.stroke(); }
      for (let y = 0; y < 940; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1196, y); ctx.stroke(); }
      // play fairway
      const fa = S.vis(0, 0.8);
      ctx.save(); ctx.globalAlpha *= fa;
      ctx.beginPath(); ctx.moveTo(100, 900); ctx.bezierCurveTo(250, 600, 300, 400, 520, 250); ctx.bezierCurveTo(700, 130, 900, 120, 1150, 60);
      ctx.lineTo(1150, 400); ctx.bezierCurveTo(900, 420, 760, 480, 640, 620); ctx.bezierCurveTo(520, 760, 460, 860, 420, 940); ctx.lineTo(100, 940); ctx.closePath();
      ctx.fillStyle = rgba(C.sand, 0.22); ctx.fill(); ctx.strokeStyle = rgba(C.sand, 0.8); ctx.lineWidth = 3; ctx.setLineDash([12, 8]); ctx.stroke(); ctx.setLineDash([]);
      text(ctx, 'PLAY FAIRWAY', 170, 840, { size: 26, weight: 900, color: C.sand, spacing: 2 });
      text(ctx, 'Upper Jurassic sandstone', 170, 872, { size: 20, weight: 600, color: C.dim });
      ctx.restore();
      // structures
      const st = [[300, 700, 50, 2], [420, 430, 40, 5], [900, 230, 45, 3], [620, 500, 80, 1]];
      st.forEach(([x, y, r, s], i) => {
        const v = S.vis(0, 0.5, 1.5 + i * 0.4);
        if (v <= 0) return;
        ctx.save(); ctx.globalAlpha *= v * (i === 3 ? 1 : 0.7);
        if (i === 3 && bi >= 1) {
          // the lead/prospect
          if (bi === 1) {
            blob(ctx, x, y, r, 1, s); ctx.setLineDash([10, 8]); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
            text(ctx, '?', x, y + 22, { size: 64, weight: 900, align: 'center', color: C.amber });
            text(ctx, 'LEAD', x, y - r - 20, { size: 26, weight: 900, align: 'center', color: C.amber });
          } else {
            const cp = S.p(2, 1.5, 0.3);
            for (let k = 5; k >= 1; k--) {
              const kk = k / 5;
              if (cp < 1 - kk + 0.2) continue;
              blob(ctx, x, y, r * 1.5, kk, s);
              ctx.fillStyle = K.mix('#1c4b6e', C.amber, 1 - kk + 0.1); ctx.fill();
              ctx.strokeStyle = rgba('#000', 0.35); ctx.lineWidth = 1.5; ctx.stroke();
            }
            text(ctx, '2,400', x, y + 6, { size: 16, weight: 700, align: 'center', color: '#1a1206' });
            text(ctx, '2,500 m', x + r * 1.9, y + 12, { size: 16, weight: 700, color: C.dim });
            text(ctx, 'PROSPECT “ALPHA”', x, y - r * 1.5 - 20, { size: 26, weight: 900, align: 'center', color: C.amber, alpha: cp });
            const pp = S.p(2, 0.5, 2.5, ease.outBack);
            if (pp > 0) I.pin(ctx, x - 6, y - 8, 50 * pp, C.red);
            if (pp > 0) text(ctx, 'well location', x + 30, y - 40, { size: 18, weight: 700, color: C.red, alpha: clamp(pp) });
          }
        } else {
          blob(ctx, x, y, r, 1, s); ctx.fillStyle = rgba('#2a5a80', 0.6); ctx.fill(); ctx.strokeStyle = rgba('#8fc1e3', 0.6); ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
      });
      text(ctx, 'MAP VIEW', 40, 50, { size: 20, weight: 800, color: C.dim, spacing: 2 });
    } else if (bi === 3) {
      const f = [['Reservoir', 0.8, C.sand], ['Trap', 0.7, C.amber], ['Seal', 0.8, C.steel], ['Charge', 0.6, C.oil]];
      let prod = 1;
      f.forEach(([n, v, col], i) => {
        const a = S.p(3, 0.6, 0.6 + i * 0.9);
        const y = 160 + i * 140;
        text(ctx, n, 120, y + 40, { size: 30, weight: 800, color: C.text, alpha: a });
        fillRR(ctx, 330, y, 600, 60, 10, '#13283a', C.panelEdge, 2);
        fillRR(ctx, 330, y, 600 * v * a, 60, 10, rgba(col, 0.8));
        text(ctx, v.toFixed(1), 960, y + 42, { size: 30, weight: 800, color: C.text, alpha: a, fam: K.MONO });
        if (i < 3) text(ctx, '×', 1060, y + 110, { size: 40, weight: 800, color: C.dim, alpha: a });
        if (a > 0.99) prod *= v;
      });
      const r = S.p(3, 0.8, 4.6);
      ctx.save(); ctx.globalAlpha *= r;
      fillRR(ctx, 300, 730, 600, 130, 18, rgba(C.amber, 0.15), C.amber, 3);
      text(ctx, 'POS ≈ 27 %', 600, 815, { size: 56, weight: 900, align: 'center', color: C.amber });
      ctx.restore();
    } else if (bi === 4) {
      // lognormal distribution
      const ox = 120, oy = 760, w = 960, h = 520;
      line(ctx, ox, oy, ox + w, oy, C.dim, 3); line(ctx, ox, oy, ox, oy - h, C.dim, 3);
      text(ctx, 'Recoverable volume (MSm³ o.e.)', ox + w / 2, oy + 60, { size: 22, weight: 700, align: 'center', color: C.dim });
      text(ctx, 'probability', ox - 20, oy - h - 20, { size: 20, weight: 700, color: C.dim });
      const mu = Math.log(8), sg = 0.6;
      const xs = (v) => ox + (v / 30) * w;
      const pdf = (v) => (v <= 0 ? 0 : Math.exp(-Math.pow(Math.log(v) - mu, 2) / (2 * sg * sg)) / (v * sg * Math.sqrt(2 * Math.PI)));
      const maxp = pdf(Math.exp(mu - sg * sg));
      const dp = S.p(4, 1.5, 0.3);
      ctx.beginPath(); ctx.moveTo(ox, oy);
      for (let v = 0.1; v <= 30 * dp; v += 0.1) ctx.lineTo(xs(v), oy - (pdf(v) / maxp) * h * 0.9);
      ctx.lineTo(xs(30 * dp), oy); ctx.closePath();
      ctx.fillStyle = rgba(C.cyan, 0.2); ctx.fill();
      ctx.beginPath();
      for (let v = 0.1; v <= 30 * dp; v += 0.1) { const y = oy - (pdf(v) / maxp) * h * 0.9; v < 0.15 ? ctx.moveTo(xs(v), y) : ctx.lineTo(xs(v), y); }
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 4; ctx.stroke();
      for (let v = 0; v <= 30; v += 5) text(ctx, String(v), xs(v), oy + 28, { size: 18, weight: 600, align: 'center', color: C.dim });
      const P90 = Math.exp(mu - 1.2816 * sg), P50 = Math.exp(mu), P10 = Math.exp(mu + 1.2816 * sg);
      [[P90, 'P90', 'low', C.red, 1.6], [P50, 'P50', 'median', C.amber, 3.2], [P10, 'P10', 'high', C.green, 4.8]].forEach(([v, n, d, col, dl]) => {
        const a = S.p(4, 0.6, dl);
        if (a <= 0) return;
        const x = xs(v), y = oy - (pdf(v) / maxp) * h * 0.9;
        line(ctx, x, oy, x, lerp(oy, y - 30, a), col, 4);
        ctx.save(); ctx.globalAlpha *= a;
        const lx = n === 'P90' ? x - 16 : x + 16;
        const ly = n === 'P50' ? y - 60 : y - 40;
        const al = n === 'P90' ? 'right' : 'left';
        text(ctx, n, lx, ly, { size: 30, weight: 900, align: al, color: col });
        text(ctx, `${v.toFixed(1)} · ${d}`, lx, ly + 30, { size: 20, weight: 700, align: al, color: C.text });
        ctx.restore();
      });
    } else {
      // in place vs recoverable
      const a = S.p(5, 0.8, 0.3);
      const tx = 150, ty = 180, tw2 = 380, th = 560;
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, tx, ty, tw2, th, 20, '#13283a', C.steel, 4);
      ctx.save(); rr(ctx, tx + 4, ty + 4, tw2 - 8, th - 8, 16); ctx.clip();
      ctx.fillStyle = rgba(C.oil, 0.35); ctx.fillRect(tx, ty + 60, tw2, th);
      const rf = 0.45 * S.p(5, 1.5, 2.5);
      ctx.fillStyle = rgba(C.oil, 0.95); ctx.fillRect(tx, ty + th - (th - 60) * rf, tw2, (th - 60) * rf);
      ctx.restore();
      text(ctx, 'IN PLACE', tx + tw2 / 2, ty + 120, { size: 30, weight: 900, align: 'center', color: C.text });
      text(ctx, 'STOIIP / GIIP', tx + tw2 / 2, ty + 160, { size: 22, weight: 700, align: 'center', color: C.dim, fam: K.MONO });
      if (rf > 0.05) text(ctx, 'RECOVERABLE', tx + tw2 / 2, ty + th - 60, { size: 28, weight: 900, align: 'center', color: '#0b1520' });
      ctx.restore();
      const u = [['1 Sm³', '= 1 m³ at 15 °C, 1 atm'], ['1 Sm³ oil', '≈ 6.29 barrels'], ['1,000 Sm³ gas', '≈ 1 Sm³ o.e.'], ['MSm³ o.e.', 'million Sm³ oil equivalents']];
      u.forEach(([k, v], i) => {
        const b = S.p(5, 0.5, 4 + i * 1.1);
        if (b <= 0) return;
        ctx.save(); ctx.globalAlpha *= b;
        fillRR(ctx, 620, 200 + i * 140, 500, 110, 14, rgba(C.cyan, 0.1), C.cyan, 2);
        text(ctx, k, 650, 248 + i * 140, { size: 32, weight: 900, color: C.text, fam: K.MONO });
        text(ctx, v, 650, 286 + i * 140, { size: 22, weight: 600, color: C.dim });
        ctx.restore();
      });
    }
  },
};

// ------------------------------------------------------------ well types
const wellsScene = {
  id: 'welltypes',
  title: 'Exploration and development wells',
  blurb: 'Different wells for different questions.',
  beats: [
    {
      term: 'Wildcat well', no: 'undersøkelsesbrønn',
      def: 'An exploration well drilled to prove whether petroleum exists in a prospect. The first well on a new structure.',
      ex: 'It’s a pure wildcat, no well within 20 kilometres.',
      say: 'A wildcat is an exploration well drilled to find out whether there is petroleum in a prospect at all. It is the first well on a new structure.',
    },
    {
      term: 'Discovery', no: 'funn',
      def: 'Hydrocarbons proven by a well. A discovery can be technical (hydrocarbons proven) without being commercial (worth developing). Sodir publishes each result.',
      ex: 'Sodir announced it as a small oil discovery.',
      say: 'If the well proves hydrocarbons, it is a discovery. It may be technical, meaning hydrocarbons are proven, without being commercial, meaning big enough to develop. Sodir publishes every result.',
    },
    {
      term: 'Dry well', no: 'tørr brønn',
      def: 'A well that finds no producible hydrocarbons, often just water-bearing reservoir, perhaps with traces. It is plugged and abandoned, but the data still has value.',
      say: 'A dry well finds no producible hydrocarbons, maybe a water filled reservoir. It is plugged and abandoned, but the data still teaches us about the area.',
    },
    {
      term: 'Appraisal well', no: 'avgrensningsbrønn',
      def: 'An exploration well drilled after a discovery to establish its extent and size: find the contacts, test the reservoir quality, reduce volume uncertainty.',
      say: 'After a discovery come appraisal wells. They are still exploration wells, drilled to find the extent and size of the discovery: where the contacts are, and how good the reservoir is.',
    },
    {
      term: 'Development well', no: 'utvinningsbrønn',
      def: 'A production or injection well drilled after the field is approved, typically from a platform or a subsea template. Not an exploration well.',
      say: 'Once a field is developed, development wells are drilled to produce or inject, usually from a platform or a subsea template. Your rotation focuses on exploration, but you will hear about both.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const spec = { x0: 0, y0: 220, w: 1196, fold: { cx: 330, A: 120, sigma: 170, cx2: 900, A2: 100, sigma2: 150 }, layers: [{ t: 260, kind: 'clay', fold: 0.3 }, { t: 110, kind: 'shale', fold: 0.85 }, { t: 90, kind: 'sand', fold: 1 }, { t: 400, kind: 'rock4', fold: 1 }] };
    R.sky(ctx, 1196, 120, { top: '#0a1825', bot: '#163a5a' });
    R.sea(ctx, 1196, 120, 220, t, { amp: 3 });
    G.drawStrata(ctx, spec, { t });
    line(ctx, 0, 220, 1196, 220, '#8a7457', 3);
    const crestA = G.boundaryY(spec, 2, 330), crestB = G.boundaryY(spec, 2, 900);
    // fluids revealed in A after discovery
    const disc = S.vis(1, 0.8, 0.5);
    if (disc > 0) G.fluids(ctx, spec, 2, { goc: crestA + 30, owc: crestA + 85, alpha: 0.85 * disc, waterA: 0 });
    const dry = S.vis(2, 0.8, 2.0);
    if (dry > 0) {
      ctx.save(); G.layerPath(ctx, spec, 2); ctx.clip();
      ctx.fillStyle = rgba(C.water, 0.7 * dry); ctx.fillRect(700, 0, 496, 940);
      ctx.restore();
    }
    // wildcat on A
    const wA = S.p(0, 3, 0.8, ease.inOut);
    const rigX = S.bi >= 2 && S.bi < 3 ? lerp(330, 900, S.p(2, 1.5)) : S.bi >= 3 ? lerp(900, 330, S.p(3, 1.2)) : 330;
    if (S.bi < 4) R.semi(ctx, rigX, 120, 0.3, t, { heave: Math.sin(t) * 1.5 });
    const dA = crestA + 120;
    if (wA > 0) {
      line(ctx, 330, 220, 330, lerp(220, dA, wA), '#ffffff', 5);
      if (wA >= 1 && S.bi >= 1 && S.bi < 4) {
        const p = S.p(1, 0.5, 0.2, ease.outBack);
        tag(ctx, 'DISCOVERY', 330, 175 - 10 * p + 10, { size: 22, color: C.green, alpha: clamp(p), fill: 'rgba(7,17,28,0.85)' });
      }
      text(ctx, 'wildcat', 342, dA + 30, { size: 20, weight: 700, color: '#fff' });
    }
    // dry well on B
    if (S.on(2)) {
      const p = S.p(2, 2, 1.0);
      line(ctx, 900, 220, 900, lerp(220, crestB + 120, p), '#ffffff', 5);
      if (p >= 1) { if (S.bi < 4) tag(ctx, 'DRY', 900, 175, { size: 22, color: C.red, fill: 'rgba(7,17,28,0.85)' }); text(ctx, 'water-bearing', 912, crestB + 150, { size: 20, weight: 700, color: '#fff' }); }
    }
    // appraisal wells
    if (S.on(3)) {
      [[190, 0.8], [470, 2.2]].forEach(([x, d], i) => {
        const p = S.p(3, 1.6, d);
        const bot = G.boundaryY(spec, 3, x) + 30;
        line(ctx, x, 220, x, lerp(220, bot, p), C.cyan, 5);
        if (p >= 1) text(ctx, 'appraisal', x + 10, bot + 26, { size: 20, weight: 700, color: C.cyan });
      });
      const c = S.p(3, 0.6, 4.2);
      if (c > 0) { line(ctx, 120, crestA + 85, 560, crestA + 85, rgba('#ffffff', c), 3, [10, 6]); text(ctx, 'OWC found', 570, crestA + 92, { size: 20, weight: 800, color: '#fff', alpha: c }); }
    }
    // development wells
    if (S.on(4)) {
      const a = S.vis(4, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 290, 205, 80, 18, 3, '#9aa6b1', '#56687a', 2);
      text(ctx, 'subsea template', 330, 196, { size: 18, weight: 700, align: 'center', color: C.text });
      const targets = [[200, crestA + 60], [280, crestA + 40], [380, crestA + 40], [470, crestA + 70]];
      targets.forEach(([tx, ty], i) => {
        const p = S.p(4, 1.5, 0.6 + i * 0.5);
        const pts = []; for (let k = 0; k <= 20; k++) { const f = k / 20; pts.push([lerp(330, tx, f * f), lerp(222, ty, f)]); }
        K.partialPolyline(ctx, pts, p, C.amber, 4);
      });
      text(ctx, 'development wells (producers & injectors)', 600, 880, { size: 22, weight: 700, align: 'center', color: C.amber });
      ctx.restore();
    }
  },
};

// ------------------------------------------------------------ stratigraphy & prognosis
const strat = [
  ['Nordland Gp', 'Neogene – Quaternary · clays, Utsira sand', '#8c7c66', 0, 900],
  ['Hordaland Gp', 'Eocene – Miocene · claystones', '#77654f', 900, 1550],
  ['Rogaland Gp', 'Paleocene · tuffs, mudstones', '#6a5a47', 1550, 1800],
  ['Shetland Gp', 'Upper Cretaceous · chalk, marl', '#b8b09a', 1800, 2150],
  ['Cromer Knoll Gp', 'Lower Cretaceous · marls', '#9a8f78', 2150, 2280],
  ['Viking Gp', 'Upper Jurassic · Draupne shale (source)', '#3b3430', 2280, 2440],
  ['Brent Gp', 'Middle Jurassic · sandstone RESERVOIR', '#d2ad62', 2440, 2620],
  ['Dunlin Gp', 'Lower Jurassic · shales', '#5b4d3e', 2620, 2800],
  ['Statfjord Gp', 'L. Jurassic – Triassic · sandstone', '#c9a14f', 2800, 2950],
];
const stratScene = {
  id: 'strat',
  title: 'Formations, tops and the prognosis',
  blurb: 'The names on the well programme’s stratigraphic column.',
  beats: [
    {
      term: 'Lithostratigraphy & formation tops', no: 'litostratigrafi / formasjonstopper',
      def: 'Rock units are named groups and formations (e.g. Nordland, Hordaland, Rogaland, Shetland, Viking, Brent in the northern North Sea). A formation top is the depth where the well enters a unit.',
      ex: 'We’re in the Hordaland, expect top Rogaland in about 80 metres.',
      say: 'The rock layers have names, organised as groups and formations. In the northern North Sea you will drill through Nordland, Hordaland, Rogaland, Shetland and Viking, down to the Brent reservoir. A formation top is the depth where the well enters a new unit.',
    },
    {
      term: 'Base Cretaceous Unconformity', abbr: 'BCU',
      def: 'A major erosion surface separating Cretaceous and Jurassic rocks across much of the NCS. A strong, easily mapped seismic reflector, often just above the Jurassic reservoirs.',
      say: 'You will often hear BCU, the Base Cretaceous Unconformity. It is a regional erosion surface, a strong seismic reflector, and it often sits just above the Jurassic reservoirs.',
    },
    {
      term: 'Prognosis', no: 'prognose',
      def: 'The predicted depths of formation tops, pressures and fluids, given in the well programme with an uncertainty range. While drilling you compare actual vs prognosed tops.',
      ex: 'Top Brent came in 15 metres deep to prognosis.',
      say: 'The prognosis is the predicted depth of each formation top, with an uncertainty range. While drilling, the wellsite geologist compares actual tops with the prognosis, and you will hear things like, top Brent came in fifteen metres deep.',
    },
    {
      term: 'Overburden', no: 'overliggende lag',
      def: 'All the rock above the reservoir. It is drilled first and carries its own risks: shallow gas, unstable clays, pressure ramps and losses.',
      say: 'Everything above the reservoir is the overburden. It is drilled first, and it has its own hazards: shallow gas, swelling clays, pressure ramps and losses.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const x0 = 80, cw = 300, y0 = 70, hh = 820;
    const dTop = 0, dBot = 2950;
    const dy = (d) => y0 + ((d - dTop) / (dBot - dTop)) * hh;
    strat.forEach(([n, d, col, a, b], i) => {
      const v = S.vis(0, 0.4, 0.3 + i * 0.35);
      if (v <= 0) return;
      ctx.save(); ctx.globalAlpha *= v;
      ctx.fillStyle = col; ctx.fillRect(x0, dy(a), cw * v, dy(b) - dy(a));
      ctx.strokeStyle = rgba('#000', 0.4); ctx.lineWidth = 1.5; ctx.strokeRect(x0, dy(a), cw, dy(b) - dy(a));
      const light = ['#b8b09a', '#d2ad62', '#c9a14f', '#9a8f78'].includes(col);
      text(ctx, n, x0 + 14, (dy(a) + dy(b)) / 2 + 8, { size: 22, weight: 800, color: light ? '#1a1206' : '#fff' });
      text(ctx, d, x0 + cw + 20, (dy(a) + dy(b)) / 2 + 7, { size: 18, weight: 600, color: n.startsWith('Brent') ? C.amber : C.dim, alpha: S.bi <= 0 ? 1 : 0.5 });
      ctx.restore();
    });
    // depth ticks
    for (let d = 0; d <= 2900; d += 500) { line(ctx, x0 - 10, dy(d), x0, dy(d), C.dim, 2); text(ctx, String(d), x0 - 14, dy(d) + 6, { size: 15, weight: 600, align: 'right', color: C.dim, fam: K.MONO }); }
    text(ctx, 'm TVD', x0 - 14, y0 - 14, { size: 15, weight: 700, align: 'right', color: C.dim });
    // BCU
    if (S.on(1)) {
      const a = S.vis(1, 0.6);
      const y = dy(2280);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.beginPath(); for (let x = x0 - 20; x <= x0 + cw + 380; x += 6) ctx.lineTo(x, y + Math.sin(x / 9) * 3);
      ctx.strokeStyle = C.red; ctx.lineWidth = 4; ctx.stroke();
      fillRR(ctx, x0 + cw + 400, y - 26, 240, 52, 10, 'rgba(7,17,28,0.9)', C.red, 2);
      text(ctx, 'BCU', x0 + cw + 420, y + 9, { size: 26, weight: 900, color: C.red });
      text(ctx, 'unconformity', x0 + cw + 495, y + 8, { size: 18, weight: 600, color: C.dim });
      ctx.restore();
    }
    // prognosis
    if (S.on(2)) {
      const a = S.vis(2, 0.6) * (1 - S.p(3, 0.5));
      const yp = dy(2440), ya = dy(2455);
      ctx.save(); ctx.globalAlpha *= a;
      const bx = 780;
      fillRR(ctx, bx, yp - 160, 360, 120, 12, 'rgba(7,17,28,0.92)', C.cyan, 2);
      text(ctx, 'Prognosed top Brent', bx + 20, yp - 120, { size: 20, weight: 700, color: C.cyan });
      text(ctx, '2,440 m TVD ± 25 m', bx + 20, yp - 82, { size: 26, weight: 900, color: C.text, fam: K.MONO });
      line(ctx, x0 + cw, yp, bx, yp, C.cyan, 2, [8, 6]);
      ctx.fillStyle = rgba(C.cyan, 0.15); ctx.fillRect(x0, dy(2415), cw, dy(2465) - dy(2415));
      const b = S.p(2, 0.6, 4.0);
      ctx.globalAlpha *= b;
      line(ctx, x0 + cw, ya + 4, bx, ya + 60, C.amber, 3);
      fillRR(ctx, bx, ya + 30, 360, 100, 12, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, 'Actual: 2,455 m', bx + 20, ya + 70, { size: 26, weight: 900, color: C.amber, fam: K.MONO });
      text(ctx, '“came in 15 m deep”', bx + 20, ya + 106, { size: 20, weight: 600, color: C.dim });
      ctx.restore();
    }
    // overburden
    if (S.on(3)) {
      const a = S.vis(3, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.fillStyle = rgba(C.amber, 0.12 + 0.06 * K.pulse(t)); ctx.fillRect(x0 - 4, y0, cw + 8, dy(2440) - y0);
      ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.strokeRect(x0 - 4, y0, cw + 8, dy(2440) - y0);
      fillRR(ctx, 780, 160, 360, 220, 14, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, 'OVERBURDEN', 800, 205, { size: 28, weight: 900, color: C.amber });
      ['shallow gas', 'swelling clays', 'pressure ramps', 'losses'].forEach((h, i) => text(ctx, '•  ' + h, 800, 250 + i * 32, { size: 22, weight: 600, color: C.text, alpha: S.vis(3, 0.4, 1 + i * 0.5) }));
      ctx.restore();
    }
  },
};

module.exports = {
  id: 'ch02', num: 2, title: 'Geology & the Prospect',
  subtitle: 'What the geologists are looking for, and why the well is drilled',
  topics: ['Source rock', 'Reservoir', 'Seal', 'Trap', 'Porosity', 'Permeability', 'Contacts', 'Seismic', 'DHI', 'Prospect', 'POS', 'P90/P50/P10', 'Wildcat', 'Appraisal', 'BCU', 'Prognosis'],
  intro: 'Chapter two: geology and the prospect. You do not need to be a geologist, but you need to understand what they are looking for, and why the well is drilled where it is.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    const spec = { x0: 0, y0: 200, w: 700, fold: { cx: 330, A: 120, sigma: 160 }, layers: [{ t: 150, kind: 'clay', fold: 0.3 }, { t: 90, kind: 'shale', fold: 0.85 }, { t: 80, kind: 'sand', fold: 1 }, { t: 90, kind: 'rock4', fold: 1 }, { t: 70, kind: 'source', fold: 1 }, { t: 300, kind: 'rock5', fold: 1 }] };
    ctx.fillStyle = '#163a5a'; ctx.fillRect(0, 0, 700, 200);
    G.drawStrata(ctx, spec, { t });
    const crest = G.boundaryY(spec, 2, 330);
    G.fluids(ctx, spec, 2, { goc: crest + 25, owc: crest + 70, alpha: 0.85 });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [systemScene, propsScene, seismicScene, prospectScene, wellsScene, stratScene],
};
