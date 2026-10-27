'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const ST = require('../art/string');
const I = require('../art/icons');
const WG = require('../art/widgets');
const LG = require('../art/logs');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, darken, richLine } = K;

// example reservoir: gas cap, oil leg, water leg under a shale seal
const ZN = [
  { top: 2300, bot: 2440, lith: 'shale' },
  { top: 2440, bot: 2475, lith: 'sand', fluid: 'gas' },
  { top: 2475, bot: 2510, lith: 'sand', fluid: 'oil' },
  { top: 2510, bot: 2548, lith: 'sand', fluid: 'water' },
  { top: 2548, bot: 2700, lith: 'shale' },
];
const DT = 2400, DB = 2600;
const TY = 100, TH = 600;
const dyW = (d) => TY + ((d - DT) / (DB - DT)) * TH;

// borehole section on the left, aligned with the log tracks
function wellSection(ctx, x0, x1, t, opt = {}) {
  const { xc = (x0 + x1) / 2, hw = 28 } = opt;
  const d0 = DT + ((0 - TY) / TH) * (DB - DT), d1 = DT + ((940 - TY) / TH) * (DB - DT);
  for (const z of ZN) {
    const a = Math.max(z.top, d0), b = Math.min(z.bot, d1);
    if (b <= a) continue;
    K.lithoFill(ctx, z.lith === 'sand' ? 'sand' : 'shale', x0, dyW(a), x1 - x0, dyW(b) - dyW(a), 3);
    if (z.fluid) { ctx.fillStyle = rgba(z.fluid === 'gas' ? C.gas : z.fluid === 'oil' ? C.oil : C.water, 0.28); ctx.fillRect(x0, dyW(a), x1 - x0, dyW(b) - dyW(a)); }
  }
  ctx.fillStyle = C.mud; ctx.fillRect(xc - hw, 0, hw * 2, 940);
  return { xc, hw };
}
function wlTool(ctx, xc, yb, opt = {}) {
  const { len = 230, cable = true, pad = 0, colors = ['#56687a', '#9fb0c1', '#d9a036', '#9fb0c1', '#e8c46a'] } = opt;
  if (cable) line(ctx, xc, -10, xc, yb - len, '#e8eef5', 2);
  const seg = len / colors.length;
  colors.forEach((c, i) => fillRR(ctx, xc - 11, yb - len + i * seg, 22, seg - 3, 4, c, darken(c, 0.4), 1.5));
  if (pad > 0) { line(ctx, xc + 11, yb - 60, xc + 11 + 14 * pad, yb - 50, '#cfd8e3', 4); fillRR(ctx, xc + 8 + 14 * pad, yb - 80, 8, 50, 3, '#cfd8e3'); }
}
function bottomBox(ctx, S, bi, title, items, opt = {}) {
  WG.infoBox(ctx, 360, 724, 816, title, items, S.vis(bi, 0.5, opt.delay || 0.6), { rv: (S.since(bi) - (opt.delay || 0.6)) * (opt.rate || 0.35) + 0.3, color: opt.color || C.amber, size: 20 });
}

// ------------------------------------------------------------ mud logging
const MT = 2380, MB = 2600;
const mudScene = {
  id: 'mudlog',
  title: 'Mud logging, samples and shows',
  blurb: 'The first look at the rocks comes up with the mud.',
  beats: [
    {
      term: 'Mud logging & the mud log', no: 'mudlogging',
      def: 'A service crew (mudloggers or data engineers) monitors the well 24/7 from the logging unit: drilling parameters, pit volumes, gas and cuttings. Their main product is the mud log (master log): ROP, lithology, gas and shows against depth.',
      ex: 'Mudlogger reports a drilling break and a gas increase at 2,441 m.',
      say: 'Mud logging is a service that watches the well around the clock from the logging unit. The mud loggers follow the drilling parameters, the pit volumes, the gas and the cuttings. Their main product is the mud log, also called the master log: rate of penetration, lithology, gas and shows, all plotted against depth.',
    },
    {
      term: 'Cuttings samples', no: 'borekaksprøver',
      def: 'Cuttings are caught at the shakers at set intervals (e.g. every 10 m, every 3 m in the reservoir), lag-corrected to the depth they were drilled, washed, described under the microscope and bagged as wet and dry sample sets. Official sample sets go to Sodir.',
      ex: 'Ten-metre samples down to the reservoir, then every three metres.',
      say: 'Cuttings samples are caught at the shakers at fixed depth intervals, for example every ten metres, or every three metres in the reservoir. Each one is labelled with the depth it was drilled at, using the lag time. They are washed, described under the microscope, and bagged. Official sample sets are sent to Sodir.',
    },
    {
      term: 'Gas chromatograph', abbr: 'C1–C5',
      def: 'Instrument in the logging unit that splits the gas from the mud into its components: methane (C1), ethane (C2), propane (C3), butanes (C4) and pentanes (C5). Dry gas is mostly C1; more of the heavier components points to wet gas or oil.',
      ex: 'Heavies are coming up, C3 to C5 all increasing.',
      say: 'The gas chromatograph splits the gas from the mud into its components: methane, C one; ethane, C two; propane, C three; then the butanes and pentanes, C four and C five. Dry gas is mostly methane. More of the heavier components points to wet gas, or oil.',
    },
    {
      term: 'Shows', no: 'oljespor / gasspor',
      def: 'Signs of hydrocarbons while drilling. Oil shows in cuttings or core: stain, odour, fluorescence under UV light, and a “cut” when solvent is added. Gas shows come from the gas readings. Rated e.g. good, fair or poor.',
      ex: 'Good oil shows from 2,476 m: bright yellow fluorescence and a fast cut.',
      say: 'Shows are signs of hydrocarbons while drilling. The wellsite geologist looks for oil stain and odour in the cuttings, fluorescence under ultraviolet light, and a cut, where a solvent dissolves the oil and it streams out, glowing. Shows are rated as good, fair or poor. A good show gets everyone’s attention.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const p = S.p(0, Math.max(8, S.bd - 3), 0.5, ease.linear);
      text(ctx, 'MASTER LOG', 300, 40, { size: 22, weight: 900, align: 'center', color: C.amber, spacing: 2 });
      LG.tracks(ctx, 30, 120, 780, ZN, MT, MB, p, ['rop', 'depth', 'lith', 'gas', 'shows'], { widths: { rop: 130, gas: 150 }, down: true });
      // logging unit
      WG.panel(ctx, 620, 40, 556, 330, 'MUDLOGGING UNIT', C.dim);
      for (let k = 0; k < 3; k++) {
        const x = 650 + k * 170;
        fillRR(ctx, x, 90, 150, 100, 8, '#0b1520', '#56687a', 2);
        const pts = []; for (let i = 0; i <= 30; i++) pts.push([x + 8 + i * 4.5, 140 + Math.sin(i * 0.6 + t * 2 + k) * (12 + k * 4) * Math.sin(i * 0.2 + k)]);
        K.partialPolyline(ctx, pts, 1, [C.green, C.red, C.cyan][k], 2);
      }
      fillRR(ctx, 640, 270, 516, 16, 4, '#56687a');
      I.person(ctx, 900, 248, 90, { shirt: C.blue });
      WG.infoBox(ctx, 620, 400, 556, 'THE MUDLOGGER WATCHES', ['Drilling data: ROP, WOB, RPM, SPP, torque', 'Pit volumes and flow: kick detection', 'Gas coming out of the mud', 'Cuttings: samples and lithology'], S.vis(0, 0.5, 1), { rv: S.since(0) * 0.3 });
    }
    if (bi === 1) {
      const tt = S.since(1);
      const st = [['SHAKER', 'catch'], ['SIEVE', 'wash'], ['DRY', 'oven'], ['MICROSCOPE', 'describe'], ['BAGS', 'label & store']];
      st.forEach(([n, sub], i) => {
        const a = S.vis(1, 0.4, 0.5 + i * 1.2);
        const x = 40 + i * 230;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, 40, 200, 170, 14, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
        const cx = x + 100, cy = 110;
        if (i === 0) { ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.15); fillRR(ctx, -70, -10, 140, 20, 4, '#2b3d4f', '#56687a', 2); ctx.restore(); for (let k = 0; k < 8; k++) circle(ctx, cx - 60 + k * 16 + (t * 20) % 16, cy - 18 + k * 2.2, 4, '#8a7a66'); }
        if (i === 1) { fillRR(ctx, cx - 50, cy - 30, 100, 60, 6, '#cfd8e3', '#7d8a96', 2); for (let k = 0; k < 6; k++) line(ctx, cx - 46, cy - 24 + k * 10, cx + 46, cy - 24 + k * 10, '#7d8a96', 1); I.drop(ctx, cx + 30, cy - 50, 26, C.water); }
        if (i === 2) { fillRR(ctx, cx - 50, cy - 36, 100, 72, 8, '#56687a', '#8796a5', 2); fillRR(ctx, cx - 38, cy - 24, 76, 48, 4, rgba(C.orange, 0.5 + 0.3 * K.pulse(t, 1.4))); }
        if (i === 3) { circle(ctx, cx, cy - 6, 34, '#2b3d4f', C.steel, 4); line(ctx, cx + 20, cy + 20, cx + 40, cy + 48, C.steel, 8); circle(ctx, cx, cy - 6, 18, '#a7d3f2'); }
        if (i === 4) for (let k = 0; k < 3; k++) { fillRR(ctx, cx - 60 + k * 42, cy - 34, 36, 64, 6, '#efe8d8', '#b8ad94', 2); text(ctx, `${2450 + k * 5}`, cx - 42 + k * 42, cy + 4, { size: 11, weight: 800, align: 'center', color: '#333', fam: K.MONO }); }
        text(ctx, n, cx, 184, { size: 17, weight: 900, align: 'center', color: C.text, spacing: 1 });
        text(ctx, sub, cx, 204, { size: 15, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
        if (i < 4) arrow(ctx, x + 204, 125, x + 226, 125, { color: C.amber, lw: 3, head: 10, alpha: a });
      });
      // microscope view
      ctx.save(); ctx.globalAlpha *= S.vis(1, 0.6, 5.5);
      circle(ctx, 260, 560, 230, '#0b0f14', '#56687a', 6);
      ctx.save(); ctx.beginPath(); ctx.arc(260, 560, 222, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#e9e2d0'; ctx.fillRect(30, 330, 460, 460);
      const Rn = K.rng(8);
      for (let k = 0; k < 70; k++) {
        const x = 50 + Rn() * 420, y = 350 + Rn() * 420, r = 6 + Rn() * 12;
        if (k % 3 === 0) { ctx.save(); ctx.translate(x, y); ctx.rotate(Rn() * 3); fillRR(ctx, -r * 1.6, -r * 0.6, r * 3.2, r * 1.2, 2, '#6d6a66'); ctx.restore(); }
        else { circle(ctx, x, y, r * 0.7, k % 2 ? '#d2ad62' : '#c9a35a', '#a9893f', 1.5); }
      }
      ctx.restore();
      text(ctx, 'sand grains + shale chips', 260, 830, { size: 20, weight: 800, align: 'center', color: C.text });
      ctx.restore();
      WG.infoBox(ctx, 560, 280, 610, 'EVERY SAMPLE', ['Depth: when it was drilled (lag-corrected)', 'Lithology, colour, grain size, hardness', 'Wet and dry sets in labelled bags', 'Official sets are sent to Sodir'], S.vis(1, 0.5, 7), { rv: (tt - 7) * 0.5 });
    }
    if (bi === 2) {
      const tt = S.since(2);
      WG.panel(ctx, 30, 30, 400, 390, 'GAS CHROMATOGRAPH', C.dim);
      fillRR(ctx, 80, 90, 300, 300, 14, '#13283a', '#56687a', 2);
      ctx.save(); ctx.strokeStyle = '#9fb0c1'; ctx.lineWidth = 5; ctx.beginPath();
      for (let a = 0; a < Math.PI * 8; a += 0.1) { const r = 20 + a * 4.5; ctx.lineTo(230 + Math.cos(a) * r, 240 + Math.sin(a) * r * 0.6); } ctx.stroke(); ctx.restore();
      K.flow(ctx, [[40, 240], [100, 240]], t, { color: C.gas, r: 4, spacing: 18, speed: 60 });
      text(ctx, 'gas from the mud →', 60, 420 - 14, { size: 16, weight: 700, color: C.gas });
      const peaks = [['C1', 0.08, 1.0], ['C2', 0.22, 0.42], ['C3', 0.36, 0.3], ['iC4', 0.5, 0.12], ['nC4', 0.6, 0.16], ['iC5', 0.74, 0.07], ['nC5', 0.84, 0.08]];
      const p = S.p(2, 8, 1, ease.linear);
      const fn = (u) => peaks.reduce((v, [, c, h]) => v + h * 100 * Math.exp(-Math.pow((u - c) / 0.012, 2)), 0) + 1;
      const ch = WG.lineChart(ctx, 460, 30, 710, 390, [{ fn, color: C.red, lw: 3, n: 600 }], p, { min: 0, max: 110, title: 'CHROMATOGRAM', xlabel: 'time →', yTicks: false, grid: 4 });
      peaks.forEach(([n, c, h]) => { if (p > c + 0.01) text(ctx, n, ch.X(c), ch.Y(h * 100 + 1) - 10, { size: 17, weight: 900, align: 'center', color: C.amber }); });
      // molecules
      const mol = [['methane', 1], ['ethane', 2], ['propane', 3], ['butane', 4], ['pentane', 5]];
      mol.forEach(([n, k], i) => {
        const a = S.vis(2, 0.4, 1 + i * 1.3);
        const x0 = 60 + i * 225, y0 = 520;
        ctx.save(); ctx.globalAlpha *= a;
        for (let j = 0; j < k; j++) { const x = x0 + j * 26 + 20; circle(ctx, x, y0 + (j % 2) * 12, 11, '#3a3a3a', '#888', 2); }
        text(ctx, `C${k}`, x0 + 70, y0 + 60, { size: 22, weight: 900, align: 'center', color: C.amber });
        text(ctx, n, x0 + 70, y0 + 88, { size: 18, weight: 700, align: 'center', color: C.text });
        ctx.restore();
      });
      WG.infoBox(ctx, 30, 640, 1140, 'WHAT IT TELLS YOU', ['Dry gas: almost all C1', 'More C2–C5 (“heavies”): wet gas or oil nearby', 'Ratios between them help tell gas, oil and water zones apart'], S.vis(2, 0.5, 8), { rv: (tt - 8) * 0.5 });
    }
    if (bi === 3) {
      const tt = S.since(3);
      const pnl = [['STAIN & ODOUR', 'white light'], ['FLUORESCENCE', 'UV light'], ['CUT', 'solvent added']];
      pnl.forEach(([n, sub], i) => {
        const a = S.vis(3, 0.5, 0.8 + i * 3.5);
        const x = 30 + i * 385;
        ctx.save(); ctx.globalAlpha *= a;
        WG.panel(ctx, x, 30, 365, 470, n, C.amber);
        const cx = x + 182, cy = 270;
        circle(ctx, cx, cy, 150, i === 0 ? '#e9e2d0' : '#06070c', '#56687a', 5);
        ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, 145, 0, Math.PI * 2); ctx.clip();
        const Rn = K.rng(30 + i);
        for (let k = 0; k < 26; k++) {
          const x2 = cx - 120 + Rn() * 240, y2 = cy - 120 + Rn() * 240, r = 10 + Rn() * 12;
          const oily = k % 3 !== 0;
          let col = i === 0 ? (oily ? '#8a6a3a' : '#d2ad62') : oily ? `rgba(230,255,120,${0.65 + 0.3 * K.pulse(t + k * 0.1, 2)})` : '#202428';
          circle(ctx, x2, y2, r, col);
        }
        if (i === 2) {
          const cp = clamp((tt - 9) / 3);
          for (let k = 0; k < 7; k++) { const ph = (t * 0.4 + k / 7) % 1; ctx.save(); ctx.globalAlpha *= cp * (1 - ph); ctx.beginPath(); ctx.ellipse(cx - 60 + k * 20, cy + 40 - ph * 140, 10 + ph * 20, 18 + ph * 30, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(220,255,140,0.5)'; ctx.fill(); ctx.restore(); }
        }
        ctx.restore();
        text(ctx, sub, cx, 470, { size: 18, weight: 700, align: 'center', color: C.dim });
        ctx.restore();
      });
      WG.infoBox(ctx, 30, 540, 1140, 'SHOWS', ['Oil shows: stain, odour, fluorescence and cut in cuttings or core', 'Gas shows: peaks in the gas readings', 'Rated good, fair or poor, and reported at once'], S.vis(3, 0.5, 11), { rv: (tt - 11) * 0.5 });
    }
  },
};

// ------------------------------------------------------------ wireline logs
const wlScene = {
  id: 'wireline',
  title: 'Wireline logging',
  blurb: 'Measuring the rock through the borehole wall.',
  beats: [
    {
      term: 'Wireline logging', no: 'kabellogging',
      def: 'Measuring rock and fluid properties with tools lowered on an armoured electrical cable, usually after a section is drilled. Tools are combined in a toolstring and logged on the way up; each trip is a “run”. The basic combination is the “triple combo”: gamma ray, resistivity, density-neutron.',
      ex: 'Logging run two: triple combo plus sonic, then the formation tester.',
      say: 'Wireline logging means lowering measurement tools into the open hole on an armoured electric cable, usually after a section is drilled. The tools are combined into a toolstring, and data is recorded while pulling up. The standard combination is the triple combo: gamma ray, resistivity, and density neutron.',
    },
    {
      term: 'Gamma ray log', abbr: 'GR',
      def: 'Measures the natural radioactivity of the rock. Shales (clay minerals containing potassium, thorium, uranium) read high; clean sandstones and limestones read low. Used to tell sand from shale and to correlate between wells.',
      ex: 'Top reservoir on the GR at 2,440 metres.',
      say: 'The gamma ray log measures the natural radioactivity of the rock. Shale reads high, because clay minerals contain potassium, thorium and uranium. Clean sand reads low. It is the basic log for telling sand from shale, and for correlating between wells.',
    },
    {
      term: 'Resistivity log', no: 'resistivitetslogg',
      def: 'Measures how strongly the rock resists electric current. Salty formation water conducts (low resistivity); oil and gas are insulators (high resistivity). A porous zone with high resistivity is a hydrocarbon candidate. Deep and shallow readings show mud filtrate invasion.',
      ex: 'Resistivity jumps to over 100 ohm-metres at the top of the sand.',
      say: 'The resistivity log measures how strongly the rock resists electric current. Salty formation water conducts well, so it reads low. Oil and gas are insulators, so they read high. A porous sand with high resistivity is the classic sign of hydrocarbons.',
    },
    {
      term: 'Density & neutron logs', no: 'tetthet- og nøytronlogg',
      def: 'The porosity logs. The density tool sends gamma rays into the rock to measure its bulk density; the neutron tool measures its hydrogen content. In gas zones both read low porosity in opposite directions on the plot, so the curves cross over: the classic gas indicator.',
      ex: 'Clear density-neutron crossover from 2,441 to 2,475.',
      say: 'Density and neutron are the porosity logs. The density tool measures the bulk density of the rock, and the neutron tool measures its hydrogen content. In a gas zone, the two curves move apart in opposite directions and cross over. That crossover is the classic gas indicator.',
    },
    {
      term: 'Sonic & image logs',
      def: 'The sonic log measures how fast sound travels through the rock (slowness): used for porosity, rock strength and tying the well to the seismic. Image logs give a picture of the borehole wall, showing layering, fractures and breakouts. A caliper measures the hole size.',
      ex: 'The image log shows open fractures at 2,575.',
      say: 'The sonic log measures how fast sound travels through the rock. It is used for porosity, rock strength, and for tying the well to the seismic. Image logs give a picture of the borehole wall, showing layering, fractures and breakouts. A caliper measures the size of the hole.',
    },
    {
      term: 'Petrophysics & CPI', abbr: 'CPI', no: 'petrofysikk',
      def: 'The petrophysicist turns logs into reservoir properties: shale volume, porosity, water saturation (Sw, e.g. from Archie’s equation) and net pay. The result is the CPI plot (computer-processed interpretation). Log data is exchanged as LAS or DLIS files.',
      ex: 'The CPI gives 70 metres of net pay at 26 percent porosity.',
      say: 'Petrophysicists turn the logs into reservoir properties: porosity, water saturation and net pay. The hydrocarbon saturation is simply one minus the water saturation. The result is shown on the CPI plot, the computer processed interpretation. Log files are exchanged as LAS or DLIS files.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const { xc } = wellSection(ctx, 20, 330, t);
    const opt = { t, hlA: S.hl(bi), widths: { depth: 64 } };
    if (bi === 0) {
      const p = S.p(0, Math.max(6, S.bd - 4), 1, ease.linear);
      const d = lerp(DB, DT, p);
      wlTool(ctx, xc, dyW(d) + 20);
      LG.tracks(ctx, 360, TY, TH, ZN, DT, DB, p, ['gr', 'depth', 'res', 'dn'], { ...opt, tw: 180 });
      tag(ctx, 'logging up ↑', xc + 90, dyW(d) - 60, { size: 18, color: C.amber, fill: 'rgba(7,17,28,0.92)' });
      bottomBox(ctx, S, 0, 'WIRELINE', ['Tools on an armoured electric cable', 'Run after a section is drilled; logged on the way up', 'Triple combo: gamma ray + resistivity + density-neutron']);
    } else if (bi <= 3) {
      const kind = ['', 'gr', 'res', 'dn'][bi];
      const ty = dyW([0, 2430, 2470, 2458][bi]);
      wlTool(ctx, xc, ty + 120, { pad: bi === 3 ? 1 : 0 });
      const L = LG.tracks(ctx, 360, TY, TH, ZN, DT, DB, 1, ['gr', 'depth', 'res', 'dn'], { ...opt, tw: 180, hl: kind });
      if (bi === 1) {
        const Rn = K.rng(Math.floor(t * 10));
        for (let k = 0; k < 18; k++) { const ph = (t * 1.2 + k / 18) % 1; const sy = dyW(2400 + (k * 37) % 40); const sx = k % 2 ? 40 + (k * 13) % 80 : 300 - (k * 11) % 60; circle(ctx, lerp(sx, xc, ph), lerp(sy, ty + 40, ph), 3.5, rgba('#7dff8a', 1 - ph)); }
        callout(ctx, 360 + 150, dyW(2420), 740, dyW(2412), 'shale: HIGH', { color: '#1d8a3a', size: 20, t: S.p(1, 0.6, 2), maxX: 1180 });
        callout(ctx, 360 + 50, dyW(2492), 740, dyW(2492), 'clean sand: LOW', { color: C.sand, size: 20, t: S.p(1, 0.6, 4), maxX: 1180 });
        bottomBox(ctx, S, 1, 'GAMMA RAY', ['Natural radioactivity of the rock', 'Shale reads high, clean sand reads low', 'Used for lithology and correlation between wells'], { color: C.green });
      }
      if (bi === 2) {
        for (let k = 0; k < 5; k++) { ctx.save(); ctx.globalAlpha *= 0.5; ctx.beginPath(); ctx.ellipse(xc, ty + 40, 40 + k * 26 + (t * 30) % 26, 22 + k * 10, 0, 0, Math.PI * 2); ctx.strokeStyle = C.cyan; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }
        const rx = 360 + 180 + 64 + 16;
        callout(ctx, rx + 160, dyW(2455), 1010, dyW(2440), 'gas & oil: HIGH', { color: C.red, size: 20, t: S.p(2, 0.6, 2.5), maxX: 1180 });
        callout(ctx, rx + 30, dyW(2530), 1010, dyW(2540), 'salt water: LOW', { color: C.water, size: 20, t: S.p(2, 0.6, 5), maxX: 1180 });
        bottomBox(ctx, S, 2, 'RESISTIVITY', ['Water conducts: low · oil and gas insulate: high', 'Porous + high resistivity = hydrocarbon candidate', 'Deep vs shallow curves show mud invasion'], { color: C.red });
      }
      if (bi === 3) {
        for (let k = 0; k < 10; k++) { const ph = (t * 1.5 + k / 10) % 1; circle(ctx, xc + 24 + ph * 70, ty + 40 + Math.sin(k * 2) * 30 * ph, 3, rgba('#ffe27a', 1 - ph)); }
        const dx = 360 + 2 * (180 + 8) + 64 + 8;
        callout(ctx, dx + 90, dyW(2458), 1000, dyW(2420), 'crossover = GAS', { color: C.gas, size: 21, t: S.p(3, 0.6, 3), maxX: 1180 });
        bottomBox(ctx, S, 3, 'DENSITY · NEUTRON', ['Density: bulk density of the rock → porosity', 'Neutron: hydrogen content → porosity', 'Gas makes the curves cross over'], { color: C.gas });
      }
    } else if (bi === 4) {
      const ty = dyW(2520);
      wlTool(ctx, xc, ty + 120);
      for (let k = 0; k < 4; k++) { const ph = (t * 0.9 + k / 4) % 1; ctx.save(); ctx.globalAlpha *= 1 - ph; ctx.beginPath(); ctx.ellipse(xc, ty - 30 + ph * 120, 30 + ph * 60, 12, 0, 0, Math.PI * 2); ctx.strokeStyle = C.purple; ctx.lineWidth = 3; ctx.stroke(); ctx.restore(); }
      const showImg = S.since(4) > 6;
      LG.tracks(ctx, 360, TY, TH, ZN, DT, DB, 1, ['gr', 'depth', 'cal', 'dt', 'image'], { ...opt, tw: 150, widths: { depth: 64, image: 200 }, hl: showImg ? 'image' : 'dt' });
      if (showImg) callout(ctx, 360 + 150 + 64 + 150 + 150 + 32 + 100, dyW(2575), 1000, dyW(2595) - 10, 'fracture', { color: C.amber, size: 20, t: S.p(4, 0.6, 7.5), maxX: 1180 });
      bottomBox(ctx, S, 4, 'SONIC · IMAGE · CALIPER', ['Sonic: speed of sound → porosity, rock strength, seismic tie', 'Image: picture of the borehole wall (beds, fractures)', 'Caliper: the hole size']);
    } else if (bi === 5) {
      wlTool(ctx, xc, -40, { cable: false });
      const p = S.p(5, 4, 1, ease.linear);
      const L = LG.tracks(ctx, 360, TY, TH, ZN, DT, DB, 1, ['gr', 'depth', 'phi', 'sw', 'pay', 'fluid'], { ...opt, tw: 160, progs: { phi: p, sw: p, pay: clamp(p * 1.2 - 0.2) } });
      ctx.save(); ctx.globalAlpha *= S.vis(5, 0.5, 6);
      fillRR(ctx, 360, 724, 816, 196, 14, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, 'CPI SUMMARY', 384, 764, { size: 19, weight: 900, color: C.amber, spacing: 1.5 });
      richLine(ctx, 'net pay **70 m** · porosity **26 %** · water saturation **19 %**', 384, 812, { size: 24, color: C.text });
      richLine(ctx, 'hydrocarbon saturation = 1 − Sw = **81 %**', 384, 856, { size: 22, color: C.text });
      text(ctx, 'Archie: Sw = (a·Rw / φᵐ·Rt)^(1/n)', 384, 896, { size: 19, weight: 600, color: C.dim, fam: K.FONT });
      ctx.restore();
    }
  },
};

// ------------------------------------------------------------ formation testing and VSP
const FW = { goc: 2475, fwl: 2510 };
const pres = (d) => {
  const pf = 0.0981 * 1.03 * FW.fwl;
  if (d >= FW.fwl) return pf + 0.0981 * 1.03 * (d - FW.fwl);
  const pg = pf - 0.0981 * 0.75 * (FW.fwl - FW.goc);
  if (d >= FW.goc) return pf - 0.0981 * 0.75 * (FW.fwl - d);
  return pg - 0.0981 * 0.2 * (FW.goc - d);
};
const PTS = [2444, 2452, 2461, 2470, 2479, 2487, 2495, 2503, 2514, 2522, 2531, 2540];
const testScene = {
  id: 'pressure',
  title: 'Pressure points, fluid samples and VSP',
  blurb: 'Measuring the formation directly.',
  beats: [
    {
      term: 'Formation pressure test', abbr: 'pretest',
      def: 'A wireline formation tester (e.g. MDT, RCI) pushes a probe against the borehole wall, draws a few cm³ of fluid and measures the formation pressure and mobility. Many points give pressure gradients: the slope shows the fluid (gas, oil, water), and where the lines cross gives the contacts.',
      ex: '25 pretests, 22 valid, a clear oil gradient.',
      say: 'A formation tester presses a probe against the borehole wall, draws out a tiny volume of fluid, and measures the formation pressure. Dozens of points are taken. Plotted against depth, they form gradients: the slope tells you whether it is gas, oil or water, and where the lines cross, you find the contacts.',
    },
    {
      term: 'Fluid sampling', abbr: 'PVT',
      def: 'The formation tester pumps fluid out of the formation until the mud filtrate contamination is low, then fills sample bottles at reservoir pressure. The PVT lab measures composition, gas-oil ratio (GOR), bubble point and density.',
      ex: 'Pumped 90 minutes, contamination below 5 percent, filling two bottles.',
      say: 'The same tool can take fluid samples. It pumps fluid from the formation until the mud filtrate is cleaned out, then fills sample bottles at reservoir pressure. In the PVT lab they measure the composition, the gas oil ratio, and how the fluid behaves with pressure and temperature.',
    },
    {
      term: 'Vertical seismic profile & checkshot', abbr: 'VSP',
      def: 'Geophones are clamped in the well at several depths while a seismic source fires near the rig. First-arrival times give a time-depth relationship (checkshots) that ties the well to the seismic; a full VSP also images the rock around the well.',
      ex: 'Checkshots put top reservoir 15 metres shallower than the prognosis.',
      say: 'In a VSP, a vertical seismic profile, geophones are clamped in the well while a seismic source fires near the rig. The travel times give a time depth relationship, which ties the well to the seismic. Simple checkshots measure just the first arrivals at a few depths.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      // probe close-up
      ctx.save(); rr(ctx, 20, 20, 520, 500, 14); ctx.clip();
      K.lithoFill(ctx, 'sand', 300, 20, 240, 500, 4);
      ctx.fillStyle = rgba(C.oil, 0.25); ctx.fillRect(300, 20, 240, 500);
      ctx.fillStyle = C.mud; ctx.fillRect(20, 20, 280, 500);
      ctx.fillStyle = '#4a3420'; ctx.fillRect(292, 20, 10, 500);
      ST.metal(ctx, 120, 20, 80, 500, '#9fb0c1');
      const ext = clamp((tt - 1) / 1.2);
      ST.metal(ctx, 200, 255, 92 * ext, 30, '#c5ced6');
      fillRR(ctx, 196 + 92 * ext, 236, 14, 68, 5, '#262626');
      ST.metal(ctx, 30, 240, 90, 60, '#7d8a96');
      if (tt > 3) K.flow(ctx, [[420, 270], [300, 270], [210, 270]], t, { color: C.oil, r: 4, spacing: 16, speed: 50 });
      ctx.restore();
      fillRR(ctx, 20, 20, 520, 500, 14, null, C.panelEdge, 2);
      text(ctx, 'probe', 250, 330, { size: 18, weight: 800, align: 'center', color: C.text });
      text(ctx, 'formation', 420, 60, { size: 18, weight: 800, align: 'center', color: '#2a2306' });
      // pretest curve
      const pp = S.p(0, 3, 2.5, ease.linear);
      const pre = (u) => (u < 0.15 ? 290 : u < 0.35 ? lerp(290, 235, (u - 0.15) / 0.2) : 252.5 - 17.5 * Math.exp(-(u - 0.35) * 9));
      WG.lineChart(ctx, 20, 540, 520, 380, [{ fn: pre, color: C.amber, lw: 3 }], pp, { min: 220, max: 300, title: 'PRETEST', xlabel: 'time →', grid: 4 });
      if (pp > 0.95) { text(ctx, 'mud pressure', 110, 640, { size: 15, weight: 700, color: C.dim }); text(ctx, 'formation pressure', 360, 795, { size: 15, weight: 800, color: C.green }); }
      // pressure-depth plot
      WG.panel(ctx, 570, 20, 606, 900, 'PRESSURE vs DEPTH', C.amber);
      const X = (p) => 650 + ((p - 249.5) / 8.5) * 480, Y = (d) => 90 + ((d - 2430) / 120) * 780;
      for (let p = 250; p <= 258; p += 2) { line(ctx, X(p), Y(2430), X(p), Y(2550), rgba('#fff', 0.07), 1); text(ctx, String(p), X(p), 902, { size: 14, weight: 600, align: 'center', color: C.dim, fam: K.MONO }); }
      for (let d = 2440; d <= 2550; d += 20) { line(ctx, X(249.5), Y(d), X(258), Y(d), rgba('#fff', 0.07), 1); text(ctx, String(d), 640, Y(d) + 5, { size: 14, weight: 600, align: 'right', color: C.dim, fam: K.MONO }); }
      const shown = Math.floor(clamp((tt - 4) / 8) * PTS.length);
      PTS.slice(0, shown).forEach((d) => circle(ctx, X(pres(d)), Y(d), 7, d < FW.goc ? C.gas : d < FW.fwl ? C.oil : C.water, '#fff', 2));
      const lp = S.p(0, 2, 13);
      if (lp > 0) {
        const seg = (d1, d2, col) => K.partialPolyline(ctx, [[X(pres(d1)), Y(d1)], [X(pres(d2)), Y(d2)]], lp, col, 3);
        seg(2432, FW.goc, C.gas); seg(FW.goc, FW.fwl, C.oil); seg(FW.fwl, 2548, C.water);
        if (lp > 0.9) {
          callout(ctx, X(pres(FW.goc)), Y(FW.goc), 760, Y(FW.goc) + 60, 'GOC 2,475 m', { color: C.amber, size: 20, maxX: 1170 });
          callout(ctx, X(pres(FW.fwl)), Y(FW.fwl), 760, Y(FW.fwl) + 70, 'FWL 2,510 m', { color: C.cyan, size: 20, maxX: 1170 });
          text(ctx, 'gas', X(pres(2440)) + 30, Y(2445), { size: 18, weight: 800, color: C.gas });
          text(ctx, 'oil', X(pres(2490)) + 30, Y(2490), { size: 18, weight: 800, color: C.oil });
          text(ctx, 'water', X(pres(2535)) + 30, Y(2535), { size: 18, weight: 800, color: C.water });
        }
      }
      text(ctx, 'pressure (bar) →', 1150, 880, { size: 15, weight: 700, align: 'right', color: C.dim });
    }
    if (bi === 1) {
      const tt = S.since(1);
      const cont = Math.max(3, 60 * Math.exp(-tt * 0.32));
      // tool schematic
      WG.panel(ctx, 20, 20, 520, 900, 'FORMATION TESTER', C.dim);
      ST.metal(ctx, 230, 70, 90, 800, '#9fb0c1');
      const mods = [['probe', 160, '#c5ced6'], ['pump-out', 330, '#d9a036'], ['fluid analyser', 480, '#5fb7e0'], ['sample bottles', 640, '#e8eef5']];
      mods.forEach(([n, y, col]) => { fillRR(ctx, 226, y, 98, 110, 8, col, darken(col, 0.4), 2); text(ctx, n, 344, y + 62, { size: 18, weight: 800, color: C.text }); });
      const mix = clamp(1 - cont / 60);
      const fcol = `rgb(${Math.round(lerp(168, 70, mix))},${Math.round(lerp(115, 195, mix))},${Math.round(lerp(63, 90, mix))})`;
      K.flow(ctx, [[190, 215], [275, 215], [275, 380], [275, 530], [275, 700]], t, { color: fcol, r: 6, spacing: 20, speed: 70 });
      line(ctx, 120, 215, 226, 215, '#cfd8e3', 8);
      const fill = clamp((tt - 9) / 3);
      fillRR(ctx, 246, 680 + 70 * (1 - fill), 56, 70 * fill, 4, fcol);
      if (fill > 0.95) tag(ctx, 'sample taken ✓', 275, 820, { size: 20, color: C.green, fill: 'rgba(7,17,28,0.92)' });
      text(ctx, 'mud filtrate → reservoir fluid', 275, 900, { size: 16, weight: 700, align: 'center', color: C.dim });
      const ch = WG.lineChart(ctx, 570, 20, 606, 420, [{ fn: (u) => Math.max(3, 60 * Math.exp(-u * 12 * 0.32)), color: C.amber, lw: 3 }], clamp(tt / 12), { min: 0, max: 60, title: 'CONTAMINATION (%)', xlabel: 'pumping time →', grid: 4 });
      line(ctx, ch.X(0), ch.Y(5), ch.X(1), ch.Y(5), C.green, 2, [8, 6]);
      text(ctx, 'target < 5 %', ch.X(1) - 4, ch.Y(5) - 10, { size: 16, weight: 800, align: 'right', color: C.green });
      WG.infoBox(ctx, 570, 470, 606, 'PVT LAB', ['Composition (C1 … C7+)', 'Gas-oil ratio (GOR)', 'Bubble point, density, viscosity'], S.vis(1, 0.5, 9), { rv: (tt - 9) * 0.6, color: C.cyan });
    }
    if (bi === 2) {
      const tt = S.since(2);
      R.sky(ctx, 760, 120, { top: '#0a1825', bot: '#173c5c' });
      R.sea(ctx, 760, 120, 250, t, { amp: 3 });
      K.lithoFill(ctx, 'clay', 0, 250, 760, 690, 3);
      K.lithoFill(ctx, 'shale', 0, 520, 760, 160, 4);
      K.lithoFill(ctx, 'sand', 0, 680, 760, 120, 5);
      R.semi(ctx, 300, 120, 0.7, t);
      ctx.fillStyle = C.mud; ctx.fillRect(292, 250, 16, 690);
      const levels = [380, 480, 580, 680, 780, 880];
      const k = Math.min(levels.length - 1, Math.floor(clamp((tt - 1) / 9) * levels.length));
      const gy = levels[k];
      wlTool(ctx, 300, gy + 30, { len: 70, cable: true, colors: ['#56687a', '#e8c46a'] });
      // source near the rig
      const sx = 470, sy = 150;
      line(ctx, 430, 40, sx, sy, '#cfd8e3', 2);
      fillRR(ctx, sx - 12, sy - 8, 24, 16, 4, C.amber);
      const ph = (t * 0.7) % 1;
      ctx.save(); ctx.globalAlpha *= 1 - ph; ctx.beginPath(); ctx.arc(sx, sy, 20 + ph * 700, 0, Math.PI); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
      for (let j = 0; j <= k; j++) line(ctx, sx, sy, 300, levels[j], rgba(C.amber, j === k ? 0.9 : 0.3), 2, [6, 5]);
      text(ctx, 'source', sx + 20, sy - 14, { size: 18, weight: 800, color: C.amber });
      text(ctx, 'geophones', 330, gy + 10, { size: 18, weight: 800, color: '#e8c46a' });
      const ch = WG.lineChart(ctx, 790, 20, 386, 520, [], 1, { min: 0, max: 1, title: 'TIME vs DEPTH', xlabel: 'two-way time →', yTicks: false });
      for (let j = 0; j <= k; j++) {
        const d = (levels[j] - 250) / 690, tw = Math.sqrt(0.02 + d * d) * 0.85 + d * 0.1;
        circle(ctx, ch.X(tw), ch.Y(1 - d), 7, C.amber, '#fff', 2);
      }
      WG.infoBox(ctx, 790, 570, 386, 'WHY', ['Exact time-depth link', 'Ties the well to the seismic', 'VSP images near the well'], S.vis(2, 0.5, 6), { rv: (tt - 6) * 0.5, size: 20 });
    }
  },
};

// ------------------------------------------------------------ coring
const coreScene = {
  id: 'coring',
  title: 'Coring',
  blurb: 'Bringing the reservoir rock itself to surface.',
  beats: [
    {
      term: 'Coring & core barrel', no: 'kjerneboring / kjerne',
      def: 'Cutting a continuous cylinder of rock with a ring-shaped core bit. The core slides into a non-rotating inner barrel inside the rotating outer barrel. Typical runs are 9–27 m or more. The core point is picked from drilling breaks and shows.',
      ex: 'We’ll pick the core point on the drilling break.',
      say: 'Coring cuts a continuous cylinder of rock, using a ring shaped core bit. The core slides up into an inner barrel that does not rotate, inside the rotating outer barrel. A core run is often nine to twenty seven metres, or more. The core point, where coring starts, is picked from drilling breaks and shows.',
    },
    {
      term: 'Core handling & analysis', abbr: 'RCA | SCAL',
      def: 'At surface the core is cut into 1 m sections, marked with depth and orientation lines and boxed. Recovery = percentage of the cut core that came up. The lab takes core gamma and photos (white and UV light) and plugs: routine core analysis (RCA) for porosity and permeability; special core analysis (SCAL) for flow properties.',
      ex: 'Core recovery 98 percent; plugs every 25 centimetres.',
      say: 'At surface, the core is cut into one metre sections, marked and boxed. Recovery is the percentage of core that came up. In the lab it is photographed in white and ultraviolet light, and small plugs are drilled. Routine core analysis measures porosity and permeability. Special core analysis, SCAL, measures how fluids flow through the rock.',
    },
    {
      term: 'Sidewall cores', abbr: 'SWC',
      def: 'Small rock plugs taken from the borehole wall at chosen depths by a wireline tool. Rotary sidewall cores are drilled out sideways; percussion cores are shot in with hollow bullets. Quick and cheap compared with a full core, but small.',
      ex: 'Thirty rotary sidewall cores requested in the shaly sands.',
      say: 'Sidewall cores are small plugs taken from the borehole wall by a wireline tool, at depths you choose. Rotary sidewall cores are drilled out sideways. Percussion cores are shot into the wall with hollow bullets. They are quick and cheap compared with a full core, but small.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      const adv = 300 * S.p(0, 10, 1.5, ease.linear);
      // formation (static), barrel moves down
      ctx.save(); rr(ctx, 20, 20, 620, 900, 14); ctx.clip();
      K.lithoFill(ctx, 'shale', 20, 20, 620, 360, 3);
      K.lithoFill(ctx, 'sand', 20, 380, 620, 380, 4);
      ctx.fillStyle = rgba(C.oil, 0.25); ctx.fillRect(20, 380, 620, 380);
      K.lithoFill(ctx, 'shale', 20, 760, 620, 160, 5);
      const bot = 360 + adv;
      ctx.fillStyle = C.mud; ctx.fillRect(330 - 130, 20, 260, bot - 20);
      // outer barrel (rotating stripes)
      ST.metal(ctx, 330 - 120, 20, 240, bot - 40, '#8796a5');
      ctx.save(); ctx.beginPath(); ctx.rect(330 - 120, 20, 240, bot - 40); ctx.clip();
      for (let y = -40 + (t * 120) % 40; y < bot; y += 40) line(ctx, 330 - 120, y, 330 + 120, y + 20, rgba('#ffffff', 0.15), 4);
      ctx.restore();
      // inner barrel with core
      fillRR(ctx, 330 - 92, 40, 184, bot - 70, 6, '#56687a');
      ctx.save(); ctx.beginPath(); ctx.rect(330 - 84, bot - 360 < 50 ? 50 : 50, 168, bot - 90); ctx.clip();
      const top = 360;
      K.lithoFill(ctx, 'sand', 330 - 84, Math.max(top, 50), 168, bot - Math.max(top, 50), 4);
      ctx.fillStyle = rgba(C.oil, 0.25); ctx.fillRect(330 - 84, Math.max(top, 50), 168, bot - Math.max(top, 50));
      ctx.restore();
      // core bit ring
      poly(ctx, [[330 - 128, bot - 20], [330 - 86, bot - 20], [330 - 92, bot + 6], [330 - 122, bot + 6]]); ctx.fillStyle = '#2b2b2b'; ctx.fill();
      poly(ctx, [[330 + 128, bot - 20], [330 + 86, bot - 20], [330 + 92, bot + 6], [330 + 122, bot + 6]]); ctx.fill();
      for (let k = 0; k < 4; k++) { circle(ctx, 330 - 120 + k * 8, bot + 2, 3, '#e8eef5'); circle(ctx, 330 + 96 + k * 8, bot + 2, 3, '#e8eef5'); }
      ctx.restore();
      fillRR(ctx, 20, 20, 620, 900, 14, null, C.panelEdge, 2);
      tag(ctx, 'outer barrel (rotates)', 120, 120, { size: 18, color: C.steel, fill: 'rgba(7,17,28,0.9)', align: 'left' });
      tag(ctx, 'inner barrel', 330 + 100, 200, { size: 18, color: C.steel, fill: 'rgba(7,17,28,0.9)', align: 'left' });
      if (adv > 60) callout(ctx, 330, bot - 120, 520, 560, 'the core', { color: C.amber, size: 22, t: clamp((adv - 60) / 60), minX: 30, maxX: 630 });
      callout(ctx, 330 - 110, bot, 120, bot + 90, 'core bit', { color: C.cyan, size: 20, t: S.p(0, 0.6, 2), minX: 30 });
      const m = (adv / 300) * 27;
      WG.panel(ctx, 680, 20, 496, 200, 'CORE CUT', C.amber);
      text(ctx, `${m.toFixed(1)} m`, 928, 160, { size: 72, weight: 800, align: 'center', color: C.text, fam: K.MONO });
      WG.infoBox(ctx, 680, 250, 496, 'CORING', ['Ring-shaped bit cuts a rock cylinder', 'Inner barrel holds it; outer barrel rotates', 'A run: often 9–27 m or more', 'Core point: picked on a drilling break or shows'], S.vis(0, 0.5, 1), { rv: tt * 0.35 });
    }
    if (bi === 1) {
      const tt = S.since(1);
      // core boxes
      WG.panel(ctx, 20, 20, 700, 560, 'CORE BOXES', C.amber);
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const i = r * 3 + c;
        const a = S.vis(1, 0.3, 0.5 + i * 0.25);
        if (a <= 0) continue;
        const x = 50 + c * 222, y = 80 + r * 120;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, y, 200, 90, 6, '#6b4f30', '#3a2a18', 2);
        const kind = i < 3 ? 'shale' : 'sand';
        K.lithoFill(ctx, kind, x + 10, y + 26, 180, 38, 3 + i);
        if (kind === 'sand') { ctx.fillStyle = rgba(C.oil, 0.25); ctx.fillRect(x + 10, y + 26, 180, 38); }
        line(ctx, x + 10, y + 30, x + 190, y + 30, C.red, 2); line(ctx, x + 10, y + 60, x + 190, y + 60, '#111', 2);
        text(ctx, `${(2470 + i).toFixed(0)}–${2471 + i} m`, x + 100, y + 18, { size: 13, weight: 800, align: 'center', color: '#f4f1ea', fam: K.MONO });
        ctx.restore();
      }
      // plug + lab
      WG.panel(ctx, 20, 600, 700, 320, 'PLUGS → LAB', C.cyan);
      const pp = clamp((tt - 4) / 2);
      ST.metal(ctx, 110, 650 + 40 * pp, 40, 120, '#c5ced6');
      K.lithoFill(ctx, 'sand', 70, 790, 120, 100, 6);
      if (pp > 0.9) { ctx.save(); ctx.translate(290, 760); K.lithoFill(ctx, 'sand', -30, -50, 60, 100, 6); ctx.restore(); fillRR(ctx, 260, 710, 60, 100, 8, null, C.amber, 2); }
      if (tt > 6.5) {
        richLine(ctx, 'porosity **25.8 %**', 380, 730, { size: 26, color: C.text });
        richLine(ctx, 'permeability **640 mD**', 380, 780, { size: 26, color: C.text });
        text(ctx, 'routine core analysis (RCA)', 380, 830, { size: 19, weight: 700, color: C.dim });
      }
      WG.infoBox(ctx, 750, 20, 426, 'AT SURFACE', ['Cut into 1 m sections and boxed', 'Depth and orientation lines', 'Recovery: % of cut core recovered'], S.vis(1, 0.5, 1), { rv: tt * 0.4, size: 20 });
      WG.infoBox(ctx, 750, 400, 426, 'IN THE LAB', ['Core gamma and photos (white & UV light)', 'RCA: porosity and permeability', 'SCAL: how fluids flow (relative permeability, capillary pressure)'], S.vis(1, 0.5, 8), { rv: (tt - 8) * 0.5, color: C.cyan, size: 20 });
    }
    if (bi === 2) {
      const tt = S.since(2);
      ctx.save(); rr(ctx, 20, 20, 640, 900, 14); ctx.clip();
      K.lithoFill(ctx, 'shale', 20, 20, 640, 900, 3);
      K.lithoFill(ctx, 'sand', 20, 360, 640, 260, 4);
      ctx.fillStyle = C.mud; ctx.fillRect(200, 20, 180, 900);
      ST.metal(ctx, 250, 20, 80, 900, '#9fb0c1');
      const cyc = (tt % 4) / 4;
      const ext = cyc < 0.4 ? cyc / 0.4 : cyc < 0.6 ? 1 : 1 - (cyc - 0.6) / 0.4;
      const yb = 470;
      ST.metal(ctx, 330, yb - 14, 60 + 70 * ext, 28, '#c5ced6');
      if (cyc < 0.5) for (let k = 0; k < 6; k++) { const a = t * 30 + k; circle(ctx, 390 + 70 * ext + Math.cos(a) * 8, yb + Math.sin(a) * 8, 2.5, '#e8d25a'); }
      ctx.restore();
      fillRR(ctx, 20, 20, 640, 900, 14, null, C.panelEdge, 2);
      tag(ctx, 'rotary coring bit', 470, yb - 70, { size: 18, color: C.amber, fill: 'rgba(7,17,28,0.9)' });
      const n = Math.min(30, Math.floor(tt / 4) + 1);
      tag(ctx, `plugs cut: ${n} / 30`, 340, 860, { size: 22, color: C.cyan, fill: 'rgba(7,17,28,0.92)' });
      // plug sizes
      WG.panel(ctx, 690, 20, 486, 380, 'A SIDEWALL CORE', C.amber);
      ctx.save(); ctx.translate(930, 220); K.lithoFill(ctx, 'sand', -40, -90, 80, 180, 7); ctx.restore();
      fillRR(ctx, 890, 130, 80, 180, 10, null, C.amber, 3);
      text(ctx, '≈ 2.5 cm × 5 cm', 930, 360, { size: 20, weight: 800, align: 'center', color: C.text });
      WG.infoBox(ctx, 690, 430, 486, 'TWO KINDS', ['Rotary: drilled out sideways', 'Percussion: hollow bullets shot into the wall', 'Cheap and quick, but small'], S.vis(2, 0.5, 2), { rv: (tt - 2) * 0.5 });
    }
  },
};

// ------------------------------------------------------------ well testing
const dstScene = {
  id: 'dst',
  title: 'Well testing',
  blurb: 'Letting the reservoir flow, and listening to the pressure.',
  beats: [
    {
      term: 'Drill stem test', abbr: 'DST', no: 'brønntest',
      def: 'Flowing the reservoir to surface through a temporary test string, sealed with a packer and controlled by a downhole tester valve, to measure rates, pressures and fluids. At surface: flowhead, choke manifold, separator, and burner boom. Proves whether the reservoir can produce.',
      ex: 'DST 1: perforate 2,480 to 2,500 and flow on a 32/64 inch choke.',
      say: 'A drill stem test, or DST, flows the reservoir to surface through a temporary test string, sealed off with a packer and controlled by a valve downhole. At surface, the flow goes through a choke manifold and a separator, where oil, gas and water are measured, and is then burned at the burner boom. It proves whether the reservoir can produce.',
    },
    {
      term: 'Drawdown & build-up',
      def: 'In flow periods the bottom-hole pressure falls (drawdown); in shut-in periods it recovers (build-up). Pressure transient analysis of these curves gives permeability-thickness (kh), skin, reservoir boundaries and connected volume.',
      ex: 'Main flow 24 hours, then a 48-hour build-up.',
      say: 'A test alternates flow periods and shut ins. When the well flows, the bottom hole pressure falls. That is the drawdown. When it is shut in, the pressure builds back up. Analysing these pressure curves tells the reservoir engineers the permeability, the damage near the well, and even how far away the reservoir boundaries are.',
    },
    {
      term: 'Skin & productivity index', abbr: 'PI',
      def: 'Skin is an extra pressure drop close to the wellbore: positive from formation damage (e.g. mud invasion), negative after stimulation. The productivity index is the rate per bar of drawdown, e.g. 1,000 Sm³/d ÷ 20 bar = 50 Sm³/d/bar.',
      ex: 'Skin of plus five, the zone is damaged.',
      say: 'Skin is an extra pressure drop right around the well. A positive skin means damage, for example from mud invasion. A negative skin means the well has been stimulated. The productivity index, PI, is the flow rate per bar of drawdown. It is the number that tells you how good the well is.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      // downhole schematic
      ctx.save(); rr(ctx, 20, 20, 460, 900, 14); ctx.clip();
      K.lithoFill(ctx, 'shale', 20, 20, 460, 900, 3);
      K.lithoFill(ctx, 'sand', 20, 700, 460, 160, 4); ctx.fillStyle = rgba(C.oil, 0.3); ctx.fillRect(20, 700, 460, 160);
      ctx.fillStyle = '#7d8a96'; ctx.fillRect(170, 20, 10, 880); ctx.fillRect(320, 20, 10, 880);
      ctx.fillStyle = rgba('#a7d3f2', 0.25); ctx.fillRect(180, 20, 140, 880);
      ST.metal(ctx, 238, 20, 24, 690, '#c5ced6');
      fillRR(ctx, 182, 620, 136, 40, 6, '#262626');
      ST.metal(ctx, 232, 560, 36, 50, '#d9a036');
      const perf = S.vis(0, 0.4, 1.5);
      for (let k = 0; k < 7; k++) { const y = 720 + k * 20; line(ctx, 170, y, 170 - 50 * perf, y, '#1b1b1b', 5); line(ctx, 330, y, 330 + 50 * perf, y, '#1b1b1b', 5); }
      if (tt > 3) { K.flow(ctx, [[110, 760], [250, 760], [250, 700], [250, 20]], t, { color: C.oil, r: 5, spacing: 26, speed: 120 }); K.flow(ctx, [[390, 800], [250, 800], [250, 700]], t, { color: C.oil, r: 5, spacing: 26, speed: 120 }); }
      ctx.restore();
      fillRR(ctx, 20, 20, 460, 900, 14, null, C.panelEdge, 2);
      tag(ctx, 'tester valve', 340, 585, { size: 17, color: '#d9a036', fill: 'rgba(7,17,28,0.9)', align: 'left' });
      tag(ctx, 'packer', 340, 640, { size: 17, color: C.text, fill: 'rgba(7,17,28,0.9)', align: 'left' });
      tag(ctx, 'perforations', 340, 870, { size: 17, color: C.amber, fill: 'rgba(7,17,28,0.9)', align: 'left' });
      // surface
      WG.panel(ctx, 510, 20, 666, 560, 'AT SURFACE', C.amber);
      const blocks = [['flowhead', 560, 120], ['choke manifold', 560, 290], ['separator', 820, 290]];
      blocks.forEach(([n, x, y], i) => { fillRR(ctx, x, y, 200, 100, 12, '#13283a', i === 2 ? C.cyan : C.panelEdge, 2); text(ctx, n, x + 100, y + 58, { size: 20, weight: 800, align: 'center', color: C.text }); });
      if (tt > 3) {
        K.flow(ctx, [[660, 220], [660, 290]], t, { color: C.oil, r: 4, spacing: 20, speed: 80 });
        K.flow(ctx, [[760, 340], [820, 340]], t, { color: C.oil, r: 4, spacing: 20, speed: 80 });
        K.flow(ctx, [[1020, 320], [1110, 320], [1110, 170]], t, { color: C.gas, r: 4, spacing: 20, speed: 80 });
        K.flow(ctx, [[1020, 360], [1110, 360], [1110, 450]], t, { color: C.oil, r: 4, spacing: 20, speed: 80 });
      }
      // burner boom
      line(ctx, 1110, 170, 1150, 90, '#9fb0c1', 6);
      if (tt > 4) I.flame(ctx, 1150, 70, 90, t);
      text(ctx, 'burner boom', 1040, 130, { size: 17, weight: 800, align: 'right', color: C.orange });
      text(ctx, 'gas', 1124, 250, { size: 15, weight: 800, color: C.gas });
      text(ctx, 'oil · water', 1124, 470, { size: 15, weight: 800, color: C.oil });
      text(ctx, 'rates · pressures · samples', 843, 540, { size: 19, weight: 800, align: 'center', color: C.cyan });
      WG.infoBox(ctx, 510, 610, 666, 'DST', ['Packer + downhole tester valve', 'Flow to surface: measure rates and pressures', 'Burn or handle the produced fluids'], S.vis(0, 0.5, 2), { rv: (tt - 2) * 0.4 });
    }
    if (bi === 1) {
      const tt = S.since(1);
      const p = S.p(1, Math.max(8, S.bd - 3), 0.6, ease.linear);
      const flow = (u) => (u > 0.05 && u < 0.15) || (u > 0.35 && u < 0.65);
      const rate = (u) => (u > 0.05 && u < 0.15 ? 600 : u > 0.35 && u < 0.65 ? 1000 : 0);
      const bhp = (u) => {
        let pr = 250;
        if (u > 0.05) pr -= 10 * (1 - Math.exp(-(Math.min(u, 0.15) - 0.05) * 60));
        if (u > 0.15) { const d = 250 - (pr); pr = 250 - d * Math.exp(-(Math.min(u, 0.35) - 0.15) * 40); }
        if (u > 0.35) pr -= 22 * (1 - Math.exp(-(Math.min(u, 0.65) - 0.35) * 40)) + (Math.min(u, 0.65) - 0.35) * 6;
        if (u > 0.65) { const d = 250 - pr; pr = 250 - d * Math.exp(-(u - 0.65) * 25) - 0.6; }
        return pr;
      };
      const bands = [[0.05, 0.15, 'clean-up'], [0.15, 0.35, 'shut in'], [0.35, 0.65, 'MAIN FLOW · drawdown'], [0.65, 1, 'BUILD-UP']].map(([u0, u1, l], i) => ({ u0, u1, label: l, color: i % 2 ? rgba(C.cyan, 0.07) : rgba(C.amber, 0.07), textColor: i % 2 ? C.cyan : C.amber }));
      WG.lineChart(ctx, 20, 20, 1156, 300, [{ fn: rate, color: C.green, lw: 3, n: 800 }], p, { min: 0, max: 1200, title: 'RATE (Sm³/d)', xlabel: '', grid: 3, bands });
      WG.lineChart(ctx, 20, 340, 1156, 420, [{ fn: bhp, color: C.red, lw: 4, n: 800 }], p, { min: 215, max: 255, title: 'BOTTOM-HOLE PRESSURE (bar)', xlabel: 'time →', grid: 4, bands });
      WG.infoBox(ctx, 20, 780, 1156, 'PRESSURE TRANSIENT ANALYSIS', ['Gives permeability, skin, boundaries and connected volume'], S.vis(1, 0.5, 10), { rv: 9, size: 20 });
    }
    if (bi === 2) {
      const tt = S.since(2);
      // top view: damaged zone
      WG.panel(ctx, 20, 20, 420, 420, 'AROUND THE WELL', C.dim);
      ctx.save(); rr(ctx, 30, 60, 400, 370, 10); ctx.clip();
      K.lithoFill(ctx, 'sand', 30, 60, 400, 370, 4); ctx.fillStyle = rgba(C.oil, 0.25); ctx.fillRect(30, 60, 400, 370);
      circle(ctx, 230, 250, 90, rgba('#5a3a1a', 0.55));
      circle(ctx, 230, 250, 28, C.mud, '#7d8a96', 4);
      ctx.restore();
      text(ctx, 'damaged zone', 230, 372, { size: 18, weight: 800, align: 'center', color: '#2a1a08' });
      const ch = WG.lineChart(ctx, 460, 20, 716, 420, [], 1, { min: 205, max: 250, title: 'PRESSURE vs DISTANCE FROM WELL', xlabel: 'distance (log scale) →', grid: 3 });
      const prof = (u, skin) => { const r = Math.pow(10, -1 + u * 4); let pr = 250 - 9 * Math.log10(10000 / Math.max(r, 0.1)) * 0.6; if (skin) pr -= 12 * clamp(1 - Math.log10(r / 0.1) / Math.log10(20)); return pr; };
      const pp = S.p(2, 3, 1, ease.linear);
      const ptsA = [], ptsB = [];
      for (let u = 1; u >= 1 - pp; u -= 0.01) { ptsA.push([ch.X(u), ch.Y(prof(u, false))]); ptsB.push([ch.X(u), ch.Y(prof(u, true))]); }
      if (ptsA.length > 1) { K.partialPolyline(ctx, ptsA, 1, C.cyan, 3, [8, 6]); K.partialPolyline(ctx, ptsB, 1, C.red, 4); }
      if (pp > 0.95) {
        text(ctx, 'no damage', ch.X(0.15), ch.Y(prof(0.15, false)) - 14, { size: 17, weight: 800, color: C.cyan });
        text(ctx, 'positive skin', ch.X(0.02), ch.Y(prof(0.0, true)) + 30, { size: 17, weight: 800, color: C.red });
        callout(ctx, ch.X(0.1), ch.Y((prof(0.1, true) + prof(0.1, false)) / 2), ch.X(0.5), ch.Y(214), 'extra drop = skin', { color: C.red, size: 20, maxX: 1170 });
      }
      ctx.save(); ctx.globalAlpha *= S.vis(2, 0.5, 9);
      fillRR(ctx, 20, 470, 1156, 220, 16, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, 'PRODUCTIVITY INDEX', 50, 516, { size: 20, weight: 900, color: C.amber, spacing: 1.5 });
      richLine(ctx, 'PI = rate ÷ drawdown = 1,000 Sm³/d ÷ 20 bar = ==50 Sm³/d/bar==', 50, 580, { size: 30, color: C.text });
      text(ctx, 'higher PI = more production for the same pressure drop', 50, 640, { size: 22, weight: 600, color: C.dim });
      ctx.restore();
      WG.infoBox(ctx, 20, 720, 1156, 'SKIN', ['Positive: damage (e.g. mud invasion) · negative: stimulated'], S.vis(2, 0.5, 4), { rv: 9, color: C.red, size: 20 });
    }
  },
};

module.exports = {
  id: 'ch16', num: 16, title: 'Formation Evaluation',
  subtitle: 'Logs, samples, cores and tests: what the well tells us',
  topics: ['Mud log', 'Cuttings', 'Chromatograph', 'Shows', 'Wireline', 'Gamma ray', 'Resistivity', 'Density-neutron', 'Sonic', 'Image log', 'CPI', 'Pressure test', 'PVT', 'VSP', 'Core', 'SWC', 'DST', 'Build-up', 'Skin', 'PI'],
  intro: 'Chapter sixteen: formation evaluation. An exploration well is drilled to collect information. This is how the rocks and fluids are measured, sampled and tested.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0b1a29'; ctx.fillRect(0, 0, 700, 900);
    LG.tracks(ctx, 60, 140, 560, ZN, DT, DB, 0.5 + 0.5 * Math.sin(t * 0.5), ['gr', 'res', 'dn'], { tw: 170, labels: false });
    ctx.restore();
    ctx.strokeStyle = rgba(C.green, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [mudScene, wlScene, testScene, coreScene, dstScene],
};
