'use strict';
const K = require('../engine/core');
const WL = require('../art/well');
const R = require('../art/rig');
const I = require('../art/icons');
const SS = require('../art/subsea');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, dimLine, para, richLine } = K;

function formulaBox(ctx, x, y, w, h, lines, a = 1, col = C.amber) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, x, y, w, h, 16, 'rgba(7,17,28,0.92)', col, 2);
  lines.forEach((l, i) => richLine(ctx, l.s, x + 24, y + 50 + i * (l.gap || 44), { size: l.size || 26, color: l.color || C.text, hl: col }));
  ctx.restore();
}

// ------------------------------------------------------------ hydrostatics
const hydroScene = {
  id: 'hydro',
  title: 'Hydrostatic pressure, gradients and EMW',
  blurb: 'Fluid columns create pressure, and on the NCS we speak in bar and SG.',
  beats: [
    {
      term: 'Hydrostatic pressure', no: 'hydrostatisk trykk',
      def: 'The pressure from the weight of a fluid column: P = ρ·g·h. In NCS field units: P [bar] = 0.0981 × SG × TVD [m]. Only true vertical depth counts, not the length of the hole.',
      ex: '1.30 SG at 3,000 metres TVD gives about 383 bar.',
      say: 'Hydrostatic pressure is the pressure from the weight of a fluid column, rho g h. On the Norwegian shelf we use the field formula: pressure in bar equals zero point zero nine eight one, times the mud weight in SG, times the true vertical depth in metres. So one point three SG at three thousand metres gives about three hundred and eighty three bar.',
    },
    {
      term: 'Pressure gradient', no: 'trykkgradient',
      def: 'Pressure increase per metre of depth, in bar/m. Seawater ≈ 0.101 bar/m; a 1.30 SG mud ≈ 0.128 bar/m. On the NCS gradients are usually quoted directly in SG.',
      say: 'The pressure gradient is how fast pressure increases with depth, in bar per metre. Seawater gives about zero point one bar per metre. Heavier mud gives a steeper line. On the shelf, gradients are usually just quoted in SG.',
    },
    {
      term: 'Equivalent mud weight', abbr: 'EMW', no: 'ekvivalent slamvekt',
      def: 'Any pressure at a depth expressed as the mud density that would create it: EMW [SG] = P ÷ (0.0981 × TVD). Pore pressure, fracture pressure and ECD are all quoted as EMW.',
      ex: 'Pore pressure at the reservoir is 1.53 SG EMW.',
      say: 'Equivalent mud weight, EMW, expresses any pressure as the mud density that would create it at that depth. That is why you hear pore pressure of one point five three SG, even though it is a pressure, not a fluid.',
    },
    {
      term: 'Bottom hole pressure', abbr: 'BHP', no: 'bunnhullstrykk',
      def: 'The pressure at the bottom of the well: hydrostatic pressure of the mud, plus any surface pressure (e.g. on the choke), plus annular friction when circulating.',
      say: 'Bottom hole pressure, BHP, is what the formation actually feels: the hydrostatic pressure of the mud, plus any pressure applied at surface, plus friction in the annulus when you are circulating.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const x = 240, top = 110, bot = 860;
      fillRR(ctx, x - 70, top - 10, 140, bot - top + 20, 14, rgba('#cfe0ee', 0.06), '#cfe0ee', 3);
      const fill = S.p(0, 1.5, 0.3);
      ctx.fillStyle = C.mud; ctx.fillRect(x - 66, bot - (bot - top) * fill, 132, (bot - top) * fill);
      [0, 1000, 2000, 3000].forEach((d, i) => {
        const y = top + (d / 3000) * (bot - top);
        line(ctx, x + 70, y, x + 100, y, C.dim, 2);
        text(ctx, `${d.toLocaleString('en')} m`, x + 108, y + 7, { size: 20, weight: 700, color: C.dim, fam: K.MONO });
        if (i > 0) {
          const v = S.p(0, 0.6, 2 + i * 1.2, ease.outBack);
          if (v > 0) gauge(ctx, x + 300, y, 52 * clamp(v), 0.0981 * 1.3 * d * clamp(v), { min: 0, max: 500, unit: 'bar', color: C.amber });
        }
      });
      text(ctx, '1.30 SG mud', x, top - 30, { size: 22, weight: 800, align: 'center', color: C.mudLight });
      formulaBox(ctx, 640, 230, 520, 220, [
        { s: '**P** = ρ · g · h' },
        { s: 'P [bar] = ==0.0981== × SG × TVD [m]' },
        { s: '0.0981 × 1.30 × 3,000 = ==383 bar==' },
      ], S.p(0, 0.6, 4.5));
      formulaBox(ctx, 640, 520, 520, 120, [{ s: 'Only **true vertical depth** counts', size: 24 }], S.p(0, 0.6, 9), C.cyan);
    }
    if (bi === 1) {
      const ax = { X: (p) => 140 + p * 1.9, Y: (d) => 120 + d * 0.24 };
      fillRR(ctx, 60, 60, 1080, 840, 16, 'rgba(7,17,28,0.6)', C.panelEdge, 2);
      for (let p = 0; p <= 500; p += 100) { line(ctx, ax.X(p), 120, ax.X(p), 840, rgba('#fff', 0.06), 1); text(ctx, String(p), ax.X(p), 106, { size: 15, weight: 700, align: 'center', color: C.dim, fam: K.MONO }); }
      for (let d = 0; d <= 3000; d += 500) { line(ctx, 140, ax.Y(d), 1100, ax.Y(d), rgba('#fff', 0.06), 1); text(ctx, String(d), 130, ax.Y(d) + 5, { size: 14, weight: 600, align: 'right', color: C.dim, fam: K.MONO }); }
      text(ctx, 'pressure (bar) →', 620, 86, { size: 16, weight: 800, align: 'center', color: C.dim });
      [[1.03, 'seawater 1.03 SG · 0.101 bar/m', C.water], [1.30, 'mud 1.30 SG · 0.128 bar/m', C.mudLight], [1.60, 'mud 1.60 SG · 0.157 bar/m', C.amber]].forEach(([sg, n, col], i) => {
        const p = S.p(1, 1.4, 0.5 + i * 1.4);
        const pts = [[ax.X(0), ax.Y(0)], [ax.X(0.0981 * sg * 3000), ax.Y(3000)]];
        K.partialPolyline(ctx, pts, p, col, 5);
        const lv = S.p(1, 0.5, 1.4 + i * 1.4);
        if (lv > 0) { line(ctx, 700, 560 + i * 50, 750, 560 + i * 50, col, 5); text(ctx, n, 764, 567 + i * 50, { size: 22, weight: 700, color: C.text, alpha: lv }); }
      });
    }
    if (bi === 2) {
      const x = 260;
      fillRR(ctx, 120, 100, 280, 760, 16, 'rgba(7,17,28,0.6)', C.panelEdge, 2);
      K.lithoFill(ctx, 'sand', 140, 720, 240, 120, 4);
      text(ctx, '3,000 m TVD', x, 700, { size: 22, weight: 800, align: 'center', color: C.text });
      gauge(ctx, x, 470, 90, 450, { min: 0, max: 600, unit: 'bar', label: 'PORE PRESSURE', color: C.red });
      const a = S.p(2, 0.6, 1.5);
      formulaBox(ctx, 520, 250, 620, 250, [
        { s: 'EMW = P ÷ (0.0981 × TVD)' },
        { s: '= 450 ÷ (0.0981 × 3,000)' },
        { s: '= ==1.53 SG EMW==', size: 34, gap: 60 },
      ], a);
      tag(ctx, '“pore pressure is 1.53”', 830, 640, { size: 26, color: C.cyan, alpha: S.p(2, 0.6, 6) });
    }
    if (bi === 3) {
      const comps = [['Mud hydrostatic', 383, C.mudLight], ['Surface pressure', 15, C.cyan], ['Annular friction', 22, C.amber]];
      let acc = 0;
      const base = 820, k = 1.4;
      comps.forEach(([n, v, col], i) => {
        const a = S.p(3, 0.6, 0.6 + i * 1.6);
        if (a <= 0) return;
        const h = v * k * a;
        fillRR(ctx, 300, base - acc * k - h, 200, h, 6, col);
        text(ctx, `${n}  +${v} bar`, 530, base - acc * k - h / 2 + 8, { size: 24, weight: 800, color: C.text, alpha: a });
        acc += v * a;
      });
      text(ctx, `BHP = ${Math.round(acc)} bar`, 400, 220, { size: 40, weight: 900, align: 'center', color: C.amber, fam: K.MONO, alpha: S.p(3, 0.6, 5.5) });
      line(ctx, 280, base, 520, base, C.dim, 3);
    }
  },
};

// ------------------------------------------------------------ pore, fracture, overburden, window
const ppfgScene = {
  id: 'ppfg',
  title: 'Pore pressure, fracture pressure and the window',
  blurb: 'The two pressures every well is designed around.',
  beats: [
    {
      term: 'Pore pressure', abbr: 'PP', no: 'poretrykk',
      def: 'The pressure of the fluids in the rock’s pore space. “Normal” pore pressure equals a column of formation water, about 1.03 SG EMW.',
      say: 'Pore pressure is the pressure of the fluids in the pores of the rock. Normal pore pressure is just the weight of a column of formation water, about one point zero three SG.',
    },
    {
      term: 'Overpressure', no: 'overtrykk',
      def: 'Pore pressure above normal, when fluids could not escape as the rock was buried. The transition is called a pressure ramp. Common in deep Jurassic reservoirs, e.g. HPHT areas of the North Sea and Haltenbanken.',
      ex: 'We’re into the pressure ramp, gas readings are climbing.',
      say: 'Where fluids could not escape as the rocks were buried, the pore pressure is higher than normal. This is overpressure, and the transition is called a pressure ramp. Recognising the ramp while drilling is critical.',
    },
    {
      term: 'Fracture pressure', abbr: 'FG', no: 'oppsprekkingstrykk',
      def: 'The pressure at which the rock cracks open and starts taking mud (losses). The fracture gradient is the upper limit for mud weight and ECD at any depth; it is weakest just below each casing shoe.',
      say: 'Fracture pressure is the pressure at which the rock splits open and starts to swallow mud. The fracture gradient is the upper limit for your mud weight, and the weakest point is usually just below the last casing shoe.',
    },
    {
      term: 'Overburden pressure', abbr: 'OBG', no: 'overlagringstrykk',
      def: 'The pressure from the weight of all the rock and water above a depth, typically rising towards 2.0–2.3 SG EMW at depth. It caps both pore and fracture pressure.',
      say: 'Overburden pressure is the weight of all the rock and water above. It rises towards about two point two SG deep down, and caps both pore and fracture pressure.',
    },
    {
      term: 'Mud weight window & PPFG', abbr: 'PPFG', no: 'slamvektvindu',
      def: 'The safe range of mud weight between pore pressure (and wellbore collapse) and fracture pressure. The PPFG plot shows the predicted window with depth; casing shoes are set where the window gets too narrow.',
      ex: 'The window is only 0.08 SG here, so we need a liner before the reservoir.',
      say: 'Between pore pressure and fracture pressure lies the mud weight window. The PPFG plot, pore pressure and fracture gradient, shows it with depth. When the window gets too narrow, you set casing and start a new section.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const ax = WL.chart(ctx, 160, 130, 620, 740, { dMax: 4000 });
    const dMax = 4000;
    // window shading
    if (bi >= 4) {
      const a = S.p(4, 1, 0.3);
      ctx.save(); ctx.globalAlpha *= 0.28 * a;
      ctx.beginPath();
      for (let d = 0; d <= dMax; d += 25) ctx.lineTo(ax.X(WL.PPFG.pore(d)), ax.Y(d));
      for (let d = dMax; d >= 0; d -= 25) ctx.lineTo(ax.X(WL.PPFG.frac(d)), ax.Y(d));
      ctx.closePath(); ctx.fillStyle = C.green; ctx.fill();
      ctx.restore();
    }
    WL.curve(ctx, ax, WL.PPFG.hydro, dMax, 1, rgba(C.water, 0.8), 2, [8, 6]);
    WL.curve(ctx, ax, WL.PPFG.pore, dMax, S.p(0, 2, 0.5), C.red, 4);
    if (bi >= 1) {
      const a = S.hl(1);
      if (a > 0) { ctx.save(); ctx.globalAlpha *= 0.25 * a; ctx.fillStyle = C.red; ctx.fillRect(ax.X(0.9), ax.Y(1800), ax.X(2.3) - ax.X(0.9), ax.Y(2600) - ax.Y(1800)); ctx.restore(); text(ctx, 'PRESSURE RAMP', ax.X(1.55), ax.Y(2200), { size: 22, weight: 900, color: C.red, alpha: a }); }
    }
    WL.curve(ctx, ax, WL.PPFG.frac, dMax, S.p(2, 2, 0.5), C.green, 4);
    WL.curve(ctx, ax, WL.PPFG.ob, dMax, S.p(3, 2, 0.5), C.purple, 4);
    // mud weight steps and shoes
    if (bi >= 4) {
      const steps = [[0, 600, 1.05], [600, 1700, 1.25], [1700, 2650, 1.55], [2650, 4000, 1.62]];
      const p = S.p(4, 3, 2);
      const pts = [];
      steps.forEach(([a, b, sg], i) => { pts.push([ax.X(sg), ax.Y(a)]); pts.push([ax.X(sg), ax.Y(b)]); });
      K.partialPolyline(ctx, pts, p, C.amber, 4);
      [600, 1700, 2650].forEach((d, i) => {
        const v = S.p(4, 0.4, 3 + i * 0.8);
        if (v <= 0) return;
        poly(ctx, [[ax.X(2.25), ax.Y(d)], [ax.X(2.25) + 22, ax.Y(d)], [ax.X(2.25), ax.Y(d) - 22]]); ctx.fillStyle = rgba(C.steel, v); ctx.fill();
        text(ctx, 'shoe', ax.X(2.25) + 28, ax.Y(d) + 2, { size: 15, weight: 700, color: C.dim, alpha: v });
      });
    }
    // legend
    const items = [[0, 'pore pressure', C.red], [2, 'fracture gradient', C.green], [3, 'overburden', C.purple], [4, 'mud weight', C.amber]];
    let ly = 160;
    for (const [b, n, col] of items) {
      if (!S.on(b)) continue;
      line(ctx, 870, ly, 910, ly, col, 5);
      text(ctx, n, 924, ly + 7, { size: 22, weight: 700, color: C.text });
      ly += 44;
    }
    text(ctx, '- - normal (1.03)', 870, ly + 10, { size: 20, weight: 600, color: C.water });
    // insets
    if (bi === 0) {
      fillRR(ctx, 850, 420, 300, 300, 16, '#0d1f2f', C.panelEdge, 2);
      const Rr = K.rng(5);
      for (let i = 0; i < 26; i++) { const x = 880 + Rr() * 240, y = 450 + Rr() * 240; circle(ctx, x, y, 18 + Rr() * 6, '#c9a14f'); }
      for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + t; arrow(ctx, 1000 + Math.cos(a) * 30, 570 + Math.sin(a) * 30, 1000 + Math.cos(a) * 80, 570 + Math.sin(a) * 80, { color: C.red, lw: 3, head: 10 }); }
      text(ctx, 'fluid in the pores pushes out', 1000, 750, { size: 18, weight: 700, align: 'center', color: C.dim });
    }
    if (bi === 2) {
      fillRR(ctx, 850, 420, 300, 300, 16, '#0d1f2f', C.panelEdge, 2);
      K.lithoFill(ctx, 'rock3', 870, 440, 260, 260, 7);
      const crack = S.p(2, 2, 2);
      ctx.strokeStyle = C.mud; ctx.lineWidth = 6;
      K.partialPolyline(ctx, [[1000, 440], [990, 500], [1010, 560], [995, 620], [1005, 700]], crack, C.mudLight, 6);
      text(ctx, 'rock cracks → losses', 1000, 750, { size: 18, weight: 700, align: 'center', color: C.dim });
    }
    if (bi === 3) {
      fillRR(ctx, 850, 420, 300, 300, 16, '#0d1f2f', C.panelEdge, 2);
      for (let i = 0; i < 4; i++) { K.lithoFill(ctx, ['rock2', 'rock3', 'shale', 'rock4'][i], 880, 440 + i * 50, 240, 50, i); }
      for (let i = 0; i < 4; i++) arrow(ctx, 920 + i * 55, 450, 920 + i * 55, 680, { color: C.purple, lw: 4, head: 12 });
      text(ctx, 'weight of everything above', 1000, 750, { size: 18, weight: 700, align: 'center', color: C.dim });
    }
  },
};

// ------------------------------------------------------------ balance, ECD, surge/swab, riser margin
function simpleWell(ctx, t, opt = {}) {
  const W = {
    cx: opt.cx || 330, seaTop: opt.sea ? 80 : null, seabed: opt.sea ? 200 : 60, td: 900,
    layers: [{ to: 420, kind: 'clay' }, { to: 640, kind: 'rock2' }, { to: 760, kind: 'shale' }, { to: 860, kind: 'sand' }, { to: 940, kind: 'rock4' }],
    strings: [{ hw: 60, holeHw: 74, top: opt.sea ? 200 : 60, shoe: 360, toc: opt.sea ? 200 : 60 }, { hw: 44, holeHw: 56, top: opt.sea ? 200 : 60, shoe: 640, toc: 500 }],
    hole: { hw: 34, to: 900 },
  };
  if (!opt.sea) { ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, 1196, 60); }
  const A = WL.drawWell(ctx, W, { t, string: opt.string ? { to: opt.stringTo || 880, from: opt.sea ? 0 : 0 } : null, bop: opt.sea, mud: opt.mud });
  return { W, A };
}
const balanceScene = {
  id: 'balance',
  title: 'Overbalance, ECD, surge and swab',
  blurb: 'Keeping the well pressure inside the window, static and dynamic.',
  beats: [
    {
      term: 'Overbalance & underbalance', no: 'overbalanse / underbalanse',
      def: 'Overbalance: well pressure higher than pore pressure, which keeps formation fluids out. Underbalance: well pressure lower, so fluids can flow in (a kick). Normal drilling is overbalanced by a margin, e.g. 10–30 bar.',
      ex: 'We have about 25 bar overbalance at TD.',
      say: 'When the well pressure is higher than the pore pressure, the well is overbalanced, and formation fluids stay out. If the well pressure falls below the pore pressure, it is underbalanced, and fluids can flow in. That is a kick.',
    },
    {
      term: 'Equivalent circulating density', abbr: 'ECD', no: 'ekvivalent sirkulerende tetthet',
      def: 'The effective mud density at a depth while circulating: mud weight plus the annular friction pressure, expressed in SG. It must stay below the fracture gradient. Its static counterpart is ESD.',
      ex: 'ECD is 1.45 with 1.38 mud, close to the shoe limit, so slow the pumps.',
      say: 'When you circulate, friction in the annulus adds pressure. Expressed as a density, that is the ECD, equivalent circulating density. With one point three eight SG mud, the bottom of the well might feel one point four five while pumping. It must stay below the fracture gradient.',
    },
    {
      term: 'Surge & swab', no: 'stempeleffekt',
      def: 'Moving pipe changes bottom hole pressure. Running in pushes mud ahead (surge, pressure up, risk of losses); pulling out sucks like a piston (swab, pressure down, risk of a kick). Trip speeds are limited to control both.',
      ex: 'Keep it below 2,000 metres per hour, or we’ll swab the well in.',
      say: 'Moving pipe also changes the pressure. Running in pushes mud ahead of the pipe, which is surge, and can cause losses. Pulling out acts like a piston and sucks, which is swab, and can draw in a kick. That is why trip speeds are limited.',
    },
    {
      term: 'Riser margin', no: 'stigerørsmargin',
      def: 'On a floating rig, the extra mud weight that would keep the well overbalanced if the riser were disconnected and its mud column replaced by seawater. Often impossible in deeper water; then other barriers are planned.',
      say: 'On a floater there is one more case: if the riser is disconnected, the mud in the riser is replaced by seawater, and the bottom hole pressure drops. Riser margin is the extra mud weight that would still keep the well overbalanced. It often cannot be achieved, so it is assessed in the well design.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const { W } = simpleWell(ctx, t, { string: true });
      const under = Math.floor(S.since(0) / 5) % 2 === 1;
      const y = 810;
      // arrows: mud pressure into formation vs pore pressure into well
      for (let k = 0; k < 3; k++) {
        const yy = y - 30 + k * 30;
        arrow(ctx, W.cx + 40, yy, W.cx + (under ? 70 : 130), yy, { color: C.blue, lw: 5, head: 14 });
        arrow(ctx, W.cx + 220, yy, W.cx + (under ? 90 : 150), yy, { color: C.red, lw: 5, head: 14 });
      }
      if (under) for (let k = 0; k < 8; k++) { const ph = (t * 0.5 + k / 8) % 1; circle(ctx, W.cx + Math.sin(k * 5) * 18, lerp(860, 500, ph), 6, C.gas); }
      fillRR(ctx, 640, 200, 500, 300, 18, 'rgba(7,17,28,0.92)', under ? C.red : C.green, 3);
      text(ctx, under ? 'UNDERBALANCED' : 'OVERBALANCED', 890, 270, { size: 36, weight: 900, align: 'center', color: under ? C.red : C.green });
      text(ctx, under ? 'well pressure < pore pressure' : 'well pressure > pore pressure', 890, 320, { size: 24, weight: 700, align: 'center', color: C.text });
      text(ctx, under ? '→ influx (kick)!' : '→ formation fluids stay out', 890, 380, { size: 24, weight: 700, align: 'center', color: C.dim });
      tag(ctx, 'well (mud) pressure', 890, 600, { size: 22, color: C.blue });
      tag(ctx, 'pore pressure', 890, 660, { size: 22, color: C.red });
    }
    if (bi === 1) {
      simpleWell(ctx, t, { string: true });
      const on = Math.floor(S.since(1) / 5) % 2 === 1 || S.since(1) > 10;
      const ecd = on ? 1.45 : 1.38;
      fillRR(ctx, 620, 120, 540, 700, 18, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, on ? 'PUMPS ON' : 'PUMPS OFF', 890, 180, { size: 30, weight: 900, align: 'center', color: on ? C.amber : C.dim });
      // bar scale
      const X = (sg) => 680 + (sg - 1.2) / 0.5 * 420;
      fillRR(ctx, 680, 300, 420, 40, 10, '#13283a');
      fillRR(ctx, X(1.30), 300, X(1.52) - X(1.30), 40, 10, rgba(C.green, 0.3));
      line(ctx, X(1.30), 280, X(1.30), 360, C.red, 4); text(ctx, 'pore 1.30', X(1.30), 270, { size: 18, weight: 700, align: 'center', color: C.red });
      line(ctx, X(1.52), 280, X(1.52), 360, C.green, 4); text(ctx, 'frac 1.52', X(1.52), 270, { size: 18, weight: 700, align: 'center', color: C.green });
      circle(ctx, X(ecd), 320, 16, on ? C.amber : C.mudLight);
      text(ctx, (on ? 'ECD ' : 'MW ') + ecd.toFixed(2), X(ecd), 400, { size: 26, weight: 900, align: 'center', color: on ? C.amber : C.mudLight, fam: K.MONO });
      formulaBox(ctx, 660, 500, 460, 250, [
        { s: 'ECD = MW + ΔP_annulus ÷ (0.0981·TVD)', size: 20 },
        { s: '1.38 + 23 bar ÷ (0.0981 × 3,300)', size: 20 },
        { s: '≈ ==1.45 SG==', size: 32, gap: 56 },
      ], S.p(1, 0.6, 3));
    }
    if (bi === 2) {
      const ph = Math.floor(S.since(2) / 5) % 2;
      const surge = ph === 0;
      const move = (S.since(2) % 5) / 5;
      const to = surge ? lerp(760, 880, move) : lerp(880, 760, move);
      simpleWell(ctx, t, { string: true, stringTo: to });
      const col = surge ? C.amber : C.cyan;
      for (let k = 0; k < 3; k++) {
        const yy = 860 - k * 22;
        if (surge) arrow(ctx, 330 + 40, yy, 330 + 120, yy, { color: col, lw: 5, head: 14 });
        else arrow(ctx, 330 + 140, yy, 330 + 50, yy, { color: col, lw: 5, head: 14 });
      }
      arrow(ctx, 330, surge ? to - 140 : to - 60, 330, surge ? to - 60 : to - 140, { color: '#fff', lw: 6, head: 18 });
      fillRR(ctx, 640, 220, 500, 260, 18, 'rgba(7,17,28,0.92)', col, 3);
      text(ctx, surge ? 'SURGE (running in)' : 'SWAB (pulling out)', 890, 290, { size: 32, weight: 900, align: 'center', color: col });
      text(ctx, surge ? 'pressure goes UP' : 'pressure goes DOWN', 890, 345, { size: 26, weight: 700, align: 'center', color: C.text });
      text(ctx, surge ? 'risk: losses' : 'risk: kick', 890, 400, { size: 26, weight: 700, align: 'center', color: surge ? C.amber : C.red });
    }
    if (bi === 3) {
      const disc = S.since(3) > 5;
      const W = { cx: 330, seaTop: 80, seabed: 480, td: 900, layers: [{ to: 640, kind: 'clay' }, { to: 780, kind: 'shale' }, { to: 940, kind: 'sand' }], strings: [{ hw: 50, holeHw: 62, top: 480, shoe: 700, toc: 480 }], hole: { hw: 34, to: 900 } };
      WL.drawWell(ctx, W, { t, bop: true, riser: false });
      // riser
      const rTop = 40, rBot = 400;
      ctx.fillStyle = '#8796a5'; ctx.fillRect(316, rTop, 6, rBot - rTop); ctx.fillRect(338, rTop, 6, rBot - rTop);
      ctx.fillStyle = disc ? rgba(C.water, 0.85) : C.mud;
      const gap = disc ? 50 * S.p(3, 1, 5) : 0;
      ctx.fillRect(322, rTop, 16, rBot - rTop);
      if (disc) { ctx.fillStyle = '#0d2236'; }
      R.semi(ctx, 330, 80, 0.5, t, { heave: disc ? -gap : 0 });
      fillRR(ctx, 640, 200, 500, 360, 18, 'rgba(7,17,28,0.92)', disc ? C.red : C.panelEdge, 3);
      text(ctx, disc ? 'RISER DISCONNECTED' : 'RISER CONNECTED', 890, 260, { size: 28, weight: 900, align: 'center', color: disc ? C.red : C.green });
      text(ctx, disc ? 'riser mud → seawater' : 'mud column to the rig', 890, 310, { size: 24, weight: 700, align: 'center', color: C.text });
      gauge(ctx, 890, 440, 80, disc ? 362 : 388, { min: 300, max: 420, unit: 'bar', label: 'BHP', color: disc ? C.red : C.green });
      text(ctx, disc ? 'riser margin needed to stay overbalanced' : '', 890, 620, { size: 22, weight: 700, align: 'center', color: C.amber });
    }
  },
};

// ------------------------------------------------------------ LOT, FIT, XLOT, kick tolerance, MAASP
function ptChart(ctx, x, y, w, h, opt = {}) {
  fillRR(ctx, x - 60, y - 50, w + 90, h + 110, 16, 'rgba(7,17,28,0.8)', C.panelEdge, 2);
  line(ctx, x, y + h, x + w, y + h, C.dim, 3); line(ctx, x, y, x, y + h, C.dim, 3);
  text(ctx, opt.xl || 'volume pumped (L) →', x + w / 2, y + h + 44, { size: 18, weight: 700, align: 'center', color: C.dim });
  ctx.save(); ctx.translate(x - 30, y + h / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'surface pressure ↑', 0, 0, { size: 18, weight: 700, align: 'center', color: C.dim }); ctx.restore();
}
const testScene = {
  id: 'tests',
  title: 'Leak-off tests, kick tolerance and MAASP',
  blurb: 'Measuring how much pressure the weakest point can take.',
  beats: [
    {
      term: 'Leak-off test', abbr: 'LOT', no: 'lekkasjetest',
      def: 'After drilling out a new casing shoe and a few metres of new formation, the well is closed and mud is pumped slowly. Pressure rises linearly until the formation starts to take fluid: the leak-off point gives the fracture gradient at the shoe.',
      ex: 'LOT came in at 1.72 SG EMW.',
      say: 'After each new casing shoe, the crew drills a few metres of new formation, closes the well, and pumps slowly. The pressure rises in a straight line, until the rock starts to take fluid. That bend is the leak off point, and it gives the fracture gradient at the shoe.',
    },
    {
      term: 'Formation integrity test', abbr: 'FIT', no: 'formasjonsintegritetstest',
      def: 'Like a LOT, but the pressure is only taken to a planned limit, enough for the next section’s mud weight and ECD, without trying to break the rock.',
      say: 'A formation integrity test, FIT, is the same procedure, but you stop at a planned pressure, enough for the next section, without trying to break the rock.',
    },
    {
      term: 'Extended leak-off test', abbr: 'XLOT',
      def: 'A leak-off test continued past breakdown, through fracture propagation, then shut-in and flow-back, to find the fracture closure pressure, which approximates the minimum horizontal stress.',
      say: 'An extended leak off test, XLOT, keeps going past the leak off point, opens a real fracture, and then watches it close. It tells the geomechanics engineers the minimum horizontal stress.',
    },
    {
      term: 'Kick tolerance', no: 'sparktoleranse',
      def: 'The largest gas kick, at a given intensity, that can be shut in and circulated out without fracturing the weakest point, usually the last shoe. A key input to setting casing depths, e.g. “4 m³ at 0.10 SG intensity”.',
      ex: 'Kick tolerance is down to 3 cubic metres, below our minimum.',
      say: 'Kick tolerance is the largest gas kick that can be shut in and circulated out without breaking down the weakest point, usually the shoe. As gas rises it expands and pushes up the pressure at the shoe. Kick tolerance is a key input to where casing is set.',
    },
    {
      term: 'MAASP', abbr: 'MAASP',
      def: 'Maximum Allowable Annular Surface Pressure: the highest casing pressure at surface before the shoe would fracture. MAASP [bar] = (FG at shoe − MW) × 0.0981 × shoe TVD. It changes whenever the mud weight changes.',
      ex: 'With 1.45 mud, MAASP is 74 bar.',
      say: 'MAASP is the maximum allowable annular surface pressure: the highest pressure you can hold on the casing at surface before the shoe would break down. It depends on the shoe strength and the current mud weight, so it is recalculated whenever the mud weight changes.',
      tts: 'MAASP, is the maximum allowable annular surface pressure: the highest pressure you can hold on the casing at surface, before the shoe would break down. It depends on the shoe strength and the current mud weight, so it is recalculated whenever the mud weight changes.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 2) {
      const x = 180, y = 160, w = 880, h = 580;
      ptChart(ctx, x, y, w, h);
      const P = (v) => y + h - v * h;
      const lin = (u) => [x + u * w, P(u * 1.1)];
      if (bi === 0) {
        const p = S.p(0, 6, 0.8, ease.linear);
        const pts = [];
        for (let u = 0; u <= p * 0.75; u += 0.01) pts.push(u < 0.55 ? lin(u) : [x + u * w, P(0.605 + (u - 0.55) * 0.35)]);
        K.partialPolyline(ctx, pts, 1, C.amber, 5);
        if (p * 0.75 > 0.58) { circle(ctx, x + 0.55 * w, P(0.605), 12, null, C.red, 4); tag(ctx, 'LEAK-OFF POINT', x + 0.55 * w - 20, P(0.605) - 46, { size: 22, color: C.red, align: 'right' }); }
        line(ctx, x, P(0), x + 0.55 * w, P(0.605), rgba('#fff', 0.2), 2, [6, 6]);
      } else if (bi === 1) {
        const p = S.p(1, 4, 0.6, ease.linear);
        const pts = [];
        for (let u = 0; u <= Math.min(0.42, p * 0.6); u += 0.01) pts.push(lin(u));
        if (p * 0.6 > 0.42) pts.push([x + Math.min(0.6, p * 0.6) * w, P(0.42 * 1.1 - 0.01)]);
        K.partialPolyline(ctx, pts, 1, C.green, 5);
        line(ctx, x, P(0.462), x + w, P(0.462), C.green, 2, [10, 8]);
        tag(ctx, 'FIT limit (planned)', x + w - 20, P(0.462) - 30, { size: 20, color: C.green, align: 'right' });
        tag(ctx, 'hold & stop, no leak-off', x + 0.7 * w, P(0.3), { size: 20, color: C.text });
      } else {
        const p = S.p(2, 7, 0.6, ease.linear);
        const pts = [];
        const f = (u) => {
          if (u < 0.45) return P(u * 1.1);
          if (u < 0.5) return P(0.495 + (u - 0.45) * 1.2);
          if (u < 0.62) return P(0.555 - (u - 0.5) * 1.5);
          if (u < 0.75) return P(0.375 + (u - 0.62) * 0.1);
          return P(0.388 - (u - 0.75) * 1.2);
        };
        for (let u = 0; u <= p; u += 0.005) pts.push([x + u * w, f(u)]);
        K.partialPolyline(ctx, pts, 1, C.purple, 5);
        const marks = [[0.45, 'leak-off', 0.1], [0.5, 'breakdown', 0.25], [0.68, 'propagation', 0.45], [0.82, 'closure → σh min', 0.65]];
        for (const [u, n, d] of marks) if (p > u) tag(ctx, n, x + u * w, f(u) - 40, { size: 18, color: C.purple });
      }
    }
    if (bi === 3) {
      const { W } = simpleWell(ctx, t, { string: true });
      const ph = clamp(S.since(3) / 10);
      const y = lerp(860, 380, ph);
      const vol = 0.6 + ph * 2.2;
      ctx.save(); ctx.globalAlpha *= 0.9;
      ctx.beginPath(); ctx.ellipse(W.cx + 22, y, 10 + vol * 6, 18 + vol * 22, 0, 0, Math.PI * 2); ctx.fillStyle = C.gas; ctx.fill();
      ctx.beginPath(); ctx.ellipse(W.cx - 22, y, 10 + vol * 6, 18 + vol * 22, 0, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      tag(ctx, 'gas expands as it rises', W.cx - 90, y, { size: 20, color: C.gas, align: 'right', fill: 'rgba(7,17,28,0.9)' });
      const shoeP = 1.58 + ph * 0.12;
      fillRR(ctx, 640, 160, 520, 380, 18, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'PRESSURE AT THE SHOE', 900, 210, { size: 22, weight: 900, align: 'center', color: C.amber, spacing: 1 });
      const X = (sg) => 680 + (sg - 1.5) / 0.3 * 440;
      fillRR(ctx, 680, 260, 440, 40, 10, '#13283a');
      line(ctx, X(1.72), 240, X(1.72), 320, C.red, 4); text(ctx, 'FG at shoe 1.72', X(1.72), 232, { size: 18, weight: 700, align: 'center', color: C.red });
      circle(ctx, X(shoeP), 280, 15, shoeP > 1.69 ? C.red : C.amber);
      text(ctx, shoeP.toFixed(2) + ' SG', X(shoeP), 350, { size: 24, weight: 800, align: 'center', color: C.text, fam: K.MONO });
      text(ctx, 'max kick ≈ 4 m³ @ 0.10 SG', 900, 470, { size: 26, weight: 900, align: 'center', color: C.amber, alpha: S.p(3, 0.6, 6) });
    }
    if (bi === 4) {
      const { W } = simpleWell(ctx, t, { string: true });
      callout(ctx, W.cx + 60, 640, 430, 560, 'SHOE', { color: C.green, size: 20, t: S.p(4, 0.6, 0.5), sub: 'FG 1.72 SG @ 2,500 m' });
      gauge(ctx, 900, 230, 100, 30 + 20 * K.pulse(t, 3), { min: 0, max: 120, unit: 'bar', label: 'CASING PRESSURE', color: C.cyan, warn: 66 });
      formulaBox(ctx, 640, 420, 520, 270, [
        { s: 'MAASP = (FG − MW) × 0.0981 × TVD', size: 21 },
        { s: '(1.72 − 1.45) × 0.0981 × 2,500', size: 21 },
        { s: '≈ ==66 bar==', size: 34, gap: 60 },
      ], S.p(4, 0.6, 1.5));
      tag(ctx, 'red zone above MAASP', 900, 395, { size: 20, color: C.red, alpha: S.p(4, 0.6, 4), fill: 'rgba(7,17,28,0.9)' });
    }
  },
};

// ------------------------------------------------------------ HPHT, depletion, MPD
const specialScene = {
  id: 'special',
  title: 'HPHT, depletion and managed pressure drilling',
  blurb: 'When the window gets hot, high, or very narrow.',
  beats: [
    {
      term: 'HPHT', abbr: 'HPHT', no: 'høyt trykk, høy temperatur',
      def: 'High pressure, high temperature: per NORSOK D-010, wells with expected shut-in pressure above 690 bar (10,000 psi) or static bottom-hole temperature above 150 °C. Require special equipment, procedures and well control readiness.',
      ex: 'It’s an HPHT well, so every connection gets a flow check.',
      say: 'HPHT means high pressure, high temperature. By the NORSOK definition, that is an expected shut in pressure above six hundred and ninety bar, or a static bottom hole temperature above one hundred and fifty degrees Celsius. Several fields on the shelf are HPHT, and they need special equipment and procedures.',
    },
    {
      term: 'Depleted reservoir', no: 'trykkavlastet reservoar',
      def: 'A reservoir whose pressure has been lowered by production. Its fracture gradient drops too, narrowing the window: a common problem when drilling near or through producing fields.',
      say: 'A depleted reservoir has lost pressure through production. Its fracture gradient drops as well, so the window narrows, and drilling through it risks losses.',
    },
    {
      term: 'Managed pressure drilling', abbr: 'MPD', no: 'trykkstyrt boring',
      def: 'A closed-loop system with a rotating control device and an automated choke that applies surface back-pressure, holding bottom-hole pressure constant whether the pumps are on or off. Used on the NCS for very narrow windows.',
      ex: 'MPD will hold 1.50 equivalent at the bit during connections.',
      say: 'Managed pressure drilling, MPD, closes the top of the well with a rotating control device, and uses an automated choke to add back pressure at surface. That way bottom hole pressure stays constant, pumps on or off, inside a very narrow window.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tp = S.p(0, 3, 0.5);
      I.thermometer(ctx, 330, 470, 460, 0.3 + 0.55 * tp, C.red);
      const temp = Math.round(60 + 110 * tp);
      text(ctx, `${temp} °C`, 330, 800, { size: 44, weight: 900, align: 'center', color: temp > 150 ? C.red : C.text, fam: K.MONO });
      line(ctx, 280, 470 + 230 * 0.32 - 300 * 0.62, 400, 470 + 230 * 0.32 - 300 * 0.62, C.amber, 3, [8, 6]);
      text(ctx, '150 °C', 420, 470 + 230 * 0.32 - 300 * 0.62 + 6, { size: 22, weight: 800, color: C.amber });
      gauge(ctx, 850, 380, 170, 760 * tp, { min: 0, max: 1000, unit: 'bar', label: 'SHUT-IN PRESSURE', color: C.red, warn: 690 });
      text(ctx, 'HPHT if > 690 bar or > 150 °C', 850, 700, { size: 28, weight: 900, align: 'center', color: C.amber, alpha: S.p(0, 0.6, 4) });
    }
    if (bi === 1) {
      const ax = WL.chart(ctx, 200, 140, 620, 700, { dMax: 4000, sgMin: 0.8, sgMax: 2.2 });
      const dep = S.p(1, 2.5, 1.5);
      const pore = (d) => (d < 2800 || d > 3200 ? WL.PPFG.pore(d) : lerp(WL.PPFG.pore(d), 0.95, dep));
      const frac = (d) => (d < 2800 || d > 3200 ? WL.PPFG.frac(d) : lerp(WL.PPFG.frac(d), 1.45, dep));
      WL.curve(ctx, ax, pore, 4000, 1, C.red, 4);
      WL.curve(ctx, ax, frac, 4000, 1, C.green, 4);
      ctx.save(); ctx.globalAlpha *= 0.25; ctx.fillStyle = C.amber; ctx.fillRect(ax.X(0.8), ax.Y(2800), ax.X(2.2) - ax.X(0.8), ax.Y(3200) - ax.Y(2800)); ctx.restore();
      tag(ctx, 'depleted zone', ax.X(1.9), ax.Y(3000), { size: 20, color: C.amber });
      text(ctx, 'pore ↓  and  frac ↓', 1000, 400, { size: 28, weight: 900, align: 'center', color: C.text, alpha: S.p(1, 0.6, 3) });
      text(ctx, '→ narrow window, losses', 1000, 450, { size: 24, weight: 700, align: 'center', color: C.amber, alpha: S.p(1, 0.6, 4) });
    }
    if (bi === 2) {
      // closed loop schematic
      const W = { cx: 330, seabed: 260, td: 900, layers: [{ to: 500, kind: 'clay' }, { to: 700, kind: 'shale' }, { to: 940, kind: 'sand' }], strings: [{ hw: 50, holeHw: 62, top: 260, shoe: 620, toc: 400 }], hole: { hw: 34, to: 900 } };
      ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, 1196, 260);
      WL.drawWell(ctx, W, { t, string: { to: 880, from: 60 } });
      fillRR(ctx, 290, 200, 80, 50, 8, C.purple, '#56687a', 2);
      text(ctx, 'RCD', 330, 232, { size: 18, weight: 900, align: 'center', color: '#fff' });
      line(ctx, 370, 225, 560, 225, '#3d5266', 10);
      fillRR(ctx, 560, 195, 90, 60, 8, C.amber);
      text(ctx, 'choke', 605, 232, { size: 18, weight: 900, align: 'center', color: '#1a1206' });
      K.flow(ctx, [[370, 225], [560, 225]], t, { spacing: 24, speed: 60, color: C.mudLight, r: 4 });
      callout(ctx, 330, 200, 120, 110, 'rotating control device', { color: C.purple, size: 20, t: S.p(2, 0.6, 1), align: 'left' });
      callout(ctx, 605, 195, 700, 110, 'automated choke', { color: C.amber, size: 20, t: S.p(2, 0.6, 2) });
      // BHP chart: pumps on/off with/without MPD
      const gx = 700, gy = 360, gw = 440, gh = 380;
      fillRR(ctx, gx - 30, gy - 50, gw + 60, gh + 110, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'BHP during a connection', gx + gw / 2, gy - 16, { size: 20, weight: 800, align: 'center', color: C.dim });
      const Y = (sg) => gy + gh - (sg - 1.40) / 0.2 * gh;
      line(ctx, gx, Y(1.44), gx + gw, Y(1.44), C.red, 3, [8, 6]); text(ctx, 'pore', gx + gw, Y(1.44) + 22, { size: 16, weight: 700, color: C.red, align: 'right' });
      line(ctx, gx, Y(1.56), gx + gw, Y(1.56), C.green, 3, [8, 6]); text(ctx, 'frac', gx + gw, Y(1.56) - 8, { size: 16, weight: 700, color: C.green, align: 'right' });
      const pumps = (u) => (u > 0.35 && u < 0.65 ? 0 : 1);
      ctx.beginPath();
      for (let u = 0; u <= 1; u += 0.01) { const sg = pumps(u) ? 1.53 : 1.43; const y = Y(sg); u ? ctx.lineTo(gx + u * gw, y) : ctx.moveTo(gx, y); }
      ctx.strokeStyle = rgba('#ffffff', 0.4); ctx.lineWidth = 3; ctx.stroke();
      text(ctx, 'conventional', gx + gw * 0.5, Y(1.43) + 26, { size: 16, weight: 700, align: 'center', color: C.dim });
      const mp = S.p(2, 1.5, 4);
      K.partialPolyline(ctx, [[gx, Y(1.50)], [gx + gw, Y(1.50)]], mp, C.amber, 5);
      if (mp > 0.9) text(ctx, 'MPD: constant 1.50', gx + gw * 0.5, Y(1.50) - 14, { size: 18, weight: 800, align: 'center', color: C.amber });
      text(ctx, 'pumps off', gx + gw * 0.5, gy + gh + 30, { size: 16, weight: 700, align: 'center', color: C.dim });
    }
  },
};

module.exports = {
  id: 'ch07', num: 7, title: 'Pressure: The Basics',
  subtitle: 'Hydrostatics, pore and fracture pressure, ECD and the tests that define the limits',
  topics: ['Hydrostatic', 'Gradient', 'EMW', 'BHP', 'Pore pressure', 'Overpressure', 'Fracture', 'Overburden', 'PPFG window', 'Overbalance', 'ECD', 'Surge & swab', 'Riser margin', 'LOT', 'FIT', 'Kick tolerance', 'MAASP', 'HPHT', 'MPD'],
  intro: 'Chapter seven: pressure. If you remember one formula from this video, make it this one. Almost every decision in drilling comes back to keeping the well pressure inside a window.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0d1f2f'; ctx.fillRect(0, 0, 700, 900);
    const ax = { X: (sg) => 80 + (sg - 0.9) / 1.4 * 520, Y: (d) => 140 + d / 4000 * 560 };
    WL.curve(ctx, ax, WL.PPFG.pore, 4000, 1, C.red, 5);
    WL.curve(ctx, ax, WL.PPFG.frac, 4000, 1, C.green, 5);
    WL.curve(ctx, ax, WL.PPFG.ob, 4000, 1, C.purple, 5);
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [hydroScene, ppfgScene, balanceScene, testScene, specialScene],
};
