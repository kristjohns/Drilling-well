'use strict';
const K = require('../engine/core');
const M = require('../art/mud');
const F = require('../art/floor');
const I = require('../art/icons');
const ST = require('../art/string');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, dimLine, para, darken } = K;

function loopView(ctx, S, presets, st) {
  const kx = {}, ky = {}, kz = {};
  presets.forEach((p, i) => { kx[i] = p[0]; ky[i] = p[1]; kz[i] = p[2]; });
  const cam = F.makeCam(S.step(kx, 1.2), S.step(ky, 1.2), S.step(kz, 1.2));
  ctx.save(); cam.apply(ctx);
  const A = M.drawLoop(ctx, st);
  ctx.restore();
  const P = {};
  for (const k of Object.keys(A)) P[k] = cam.pt(A[k]);
  return P;
}
function info(ctx, title, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, 800, 40, 370, 860, 18, '#0d1f2f', C.panelEdge, 2);
  if (title) text(ctx, title, 985, 88, { size: 22, weight: 900, align: 'center', color: C.amber, spacing: 2 });
  ctx.restore();
}

// ------------------------------------------------------------ circulation loop
const loopScene = {
  id: 'loop',
  title: 'The circulation system',
  blurb: 'Mud goes round and round: down the pipe, up the annulus, cleaned, and pumped again.',
  beats: [
    {
      term: 'Circulation', no: 'sirkulasjon',
      def: 'Mud is pumped down the drill string, out through the bit, up the annulus carrying the cuttings, cleaned at surface and pumped down again. “Breaking circulation” means starting the pumps.',
      ex: 'Circulate the hole clean before we pull out.',
      say: 'The heart of drilling is circulation. Mud is pumped down the drill string, out through the bit, and back up the annulus, carrying the cuttings. At surface it is cleaned and pumped down again.',
    },
    {
      term: 'Mud pumps', no: 'slampumper',
      def: 'Large triplex piston pumps, typically two to four per rig, rated around 7,500 psi (≈ 520 bar). Output = strokes per minute × litres per stroke, set by liner size.',
      ex: 'Pump 2 is down for a liner change, we’re drilling on two pumps.',
      say: 'Big triplex piston pumps drive it: two to four per rig, each with three pistons. Their output is strokes per minute times litres per stroke, which depends on the liner size.',
    },
    {
      term: 'Standpipe pressure', abbr: 'SPP', no: 'pumpetrykk',
      def: 'The pressure at the standpipe: the sum of all friction losses in surface lines, string, BHA tools, bit nozzles and annulus. Sudden changes warn of washouts, plugged nozzles or pack-offs.',
      ex: 'SPP dropped 15 bar, check for a washout.',
      say: 'Standpipe pressure, SPP, is the pressure needed to push the mud round the loop. It is the sum of all friction losses, and the driller watches it closely: a sudden drop can mean a washout, and a rise can mean a plugged nozzle or a pack off.',
    },
    {
      term: 'Annulus', no: 'ringrom',
      def: 'The ring-shaped space between the drill string and the hole or casing wall, where mud and cuttings return to surface. Annular velocity = flow rate ÷ annular area.',
      say: 'The annulus is the ring shaped space between the drill string and the hole wall, or casing. The returning mud and cuttings travel up there, and the annular velocity must be high enough to lift them.',
    },
    {
      term: 'Bottoms up & lag time', no: 'bunn opp',
      def: 'Bottoms up is the time, or pump strokes, for mud at the bit to reach surface. Lag time lets the mud logger match cuttings and gas readings to the depth they came from.',
      ex: 'Circulate two bottoms up before the flow check.',
      say: 'Bottoms up is the time, or number of strokes, for mud at the bit to reach surface. The mud logger uses this lag time to know which depth a cuttings sample or a gas peak came from.',
    },
    {
      term: 'Flowline & flow-out', no: 'returledning',
      def: 'The flowline carries returning mud from the bell nipple at the top of the riser to the shakers. A flow-out sensor (paddle or Coriolis meter) compares returns with pump rate, which is a key kick and loss indicator.',
      say: 'At the top, returns leave through the flowline to the shakers. A flow out sensor measures the returns. If flow out is higher than flow in, the well may be kicking. If it is lower, you may be losing mud.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const hl = [[], ['pumps'], ['standpipe'], ['annulus'], ['annulus'], ['flowline']][bi];
    const presets = [[598, 470, 1], [598, 470, 1], [598, 470, 1], [598, 470, 1], [598, 470, 1], [598, 470, 1]];
    const P = loopView(ctx, S, presets, { t, flow: 1, cuttings: true, hl: new Set(hl), hlA: S.hl(bi), pumpSpm: 100 });
    if (bi === 0) {
      info(ctx, 'THE LOOP', S.p(0, 0.6));
      const steps = ['Mud pumps', 'Standpipe & hose', 'Top drive', 'Down the drill string', 'Out through the bit', 'Up the annulus', 'Flowline', 'Shakers & cleaning', 'Mud pits', '…and again'];
      steps.forEach((s2, i) => {
        const v = S.p(0, 0.4, 0.8 + i * 0.7);
        circle(ctx, 840, 140 + i * 74, 18, rgba(C.amber, 0.2 * v), rgba(C.amber, v), 2);
        text(ctx, String(i + 1), 840, 147 + i * 74, { size: 18, weight: 800, align: 'center', color: C.text, alpha: v });
        text(ctx, s2, 872, 148 + i * 74, { size: 24, weight: 700, color: C.text, alpha: v });
      });
    }
    if (bi === 1) {
      callout(ctx, P.pumps[0], P.pumps[1], 500, 760, 'MUD PUMPS', { color: C.amber, size: 22, t: S.p(1, 0.6, 0.5) });
      info(ctx, 'TRIPLEX PUMP', S.p(1, 0.6, 0.5));
      const a = S.p(1, 0.6, 1);
      ctx.save(); ctx.globalAlpha *= a;
      const ang = t * 2 * Math.PI * 100 / 60;
      for (let i = 0; i < 3; i++) {
        const off = Math.sin(ang + (i * Math.PI * 2) / 3) * 30;
        fillRR(ctx, 850 + i * 100, 200, 70, 200, 8, '#22384b', '#56687a', 2);
        fillRR(ctx, 858 + i * 100, 280 + off, 54, 40, 6, C.steel);
        fillRR(ctx, 878 + i * 100, 320 + off, 14, 90, 4, C.steelMid);
      }
      text(ctx, '100 spm × 36 L/stroke', 985, 520, { size: 24, weight: 800, align: 'center', color: C.text });
      text(ctx, '= 3,600 L/min', 985, 570, { size: 34, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
      text(ctx, 'rated ≈ 7,500 psi (520 bar)', 985, 650, { size: 22, weight: 600, align: 'center', color: C.dim });
      ctx.restore();
    }
    if (bi === 2) {
      callout(ctx, P.standpipe[0], P.standpipe[1], 300, 200, 'STANDPIPE', { color: C.amber, size: 22, t: S.p(2, 0.6, 0.5) });
      info(ctx, 'PRESSURE LOSSES', S.p(2, 0.6, 0.5));
      gauge(ctx, 985, 250, 110, 210 + Math.sin(t * 2) * 2, { min: 0, max: 400, unit: 'bar', label: 'SPP', color: C.amber });
      const parts = [['Surface lines', 0.04, C.steel], ['Drill string', 0.38, C.cyan], ['BHA tools', 0.12, C.purple], ['Bit nozzles', 0.36, C.amber], ['Annulus', 0.10, C.mudLight]];
      let y = 450;
      parts.forEach(([n, f, col], i) => {
        const v = S.p(2, 0.5, 2 + i * 0.6);
        text(ctx, n, 830, y + 26, { size: 21, weight: 700, color: C.text, alpha: v });
        fillRR(ctx, 990, y + 6, 115 * f / 0.38 * v, 28, 6, col);
        text(ctx, Math.round(f * 100) + '%', 1158, y + 28, { size: 18, weight: 700, color: C.dim, align: 'right', alpha: v });
        y += 64;
      });
    }
    if (bi === 3) {
      callout(ctx, P.annulus[0], P.annulus[1], 720, 820, 'ANNULUS', { color: C.amber, size: 22, t: S.p(3, 0.6, 0.5) });
      info(ctx, 'CROSS-SECTION', S.p(3, 0.6, 0.5));
      const a = S.p(3, 0.6, 1);
      ctx.save(); ctx.globalAlpha *= a;
      const cx = 985, cy = 330;
      circle(ctx, cx, cy, 150, C.rock3);
      circle(ctx, cx, cy, 125, rgba(C.mud, 1));
      ctx.save(); ctx.globalAlpha *= 0.6 + 0.4 * K.pulse(t);
      circle(ctx, cx, cy, 125, null, C.amber, 5); ctx.restore();
      circle(ctx, cx, cy, 45, '#9fb0c1', '#56687a', 3);
      circle(ctx, cx, cy, 30, '#f0c891');
      text(ctx, 'annulus', cx, cy - 75, { size: 22, weight: 800, align: 'center', color: '#fff' });
      text(ctx, 'v = Q ÷ A', 985, 580, { size: 36, weight: 900, align: 'center', color: C.text, fam: K.MONO });
      text(ctx, 'annular velocity', 985, 620, { size: 20, weight: 600, align: 'center', color: C.dim });
      text(ctx, 'too low → cuttings settle', 985, 700, { size: 22, weight: 700, align: 'center', color: C.amber });
      ctx.restore();
    }
    if (bi === 4) {
      info(ctx, 'LAG TIME', S.p(4, 0.6, 0.3));
      // travelling packet in annulus
      const ph = clamp(S.since(4) / 9);
      const y = lerp(885, 460, ph);
      ctx.save(); ctx.globalAlpha *= 0.9;
      fillRR(ctx, 612, y - 14, 56, 28, 6, C.amber); ctx.restore();
      const mins = Math.round(ph * 33);
      text(ctx, `${mins} min`, 985, 260, { size: 70, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
      text(ctx, `${(mins * 100).toLocaleString('en')} strokes`, 985, 320, { size: 26, weight: 700, align: 'center', color: C.text, fam: K.MONO });
      const b = S.p(4, 0.6, 2.5);
      ctx.save(); ctx.globalAlpha *= b;
      text(ctx, 'annulus volume ≈ 120 m³', 985, 450, { size: 22, weight: 700, align: 'center', color: C.text });
      text(ctx, '÷ 3.6 m³/min', 985, 490, { size: 22, weight: 700, align: 'center', color: C.text });
      text(ctx, '≈ 33 min bottoms up', 985, 540, { size: 26, weight: 900, align: 'center', color: C.amber });
      ctx.restore();
    }
    if (bi === 5) {
      callout(ctx, P.flowline[0], P.flowline[1], 420, 300, 'FLOWLINE', { color: C.amber, size: 22, t: S.p(5, 0.6, 0.5) });
      info(ctx, 'FLOW IN vs FLOW OUT', S.p(5, 0.6, 0.5));
      const phase = Math.floor(S.since(5) / 4.5) % 3;
      const fin = 3600, fout = [3600, 3950, 3100][phase];
      const labels = ['balanced: OK', 'more out → possible KICK', 'less out → LOSSES'];
      const cols = [C.green, C.red, C.amber];
      gauge(ctx, 985, 260, 100, fin, { min: 0, max: 5000, unit: 'lpm', label: 'FLOW IN', color: C.cyan });
      gauge(ctx, 985, 540, 100, fout, { min: 0, max: 5000, unit: 'lpm', label: 'FLOW OUT', color: cols[phase] });
      tag(ctx, labels[phase], 985, 800, { size: 22, color: cols[phase] });
    }
  },
};

// ------------------------------------------------------------ surface mud treatment
const solidsScene = {
  id: 'solids',
  title: 'Cleaning the mud at surface',
  blurb: 'Removing cuttings and gas so the mud can be reused.',
  beats: [
    {
      term: 'Shale shakers', no: 'vibrasjonssikter (shakere)',
      def: 'Vibrating screens that the returning mud flows over first. Mud and fine solids drop through; cuttings are conveyed off the end. The most important solids-control equipment.',
      ex: 'Shakers are blinding, change to coarser screens.',
      say: 'Returns first hit the shale shakers: vibrating screens. The mud falls through, and the cuttings bounce off the end. They are the most important part of solids control.',
    },
    {
      term: 'Cuttings', no: 'borekaks',
      def: 'The rock chips made by the bit. The mud logger and wellsite geologist collect samples at the shakers to describe the lithology and look for hydrocarbon shows.',
      ex: 'Cuttings are mostly claystone with traces of sand.',
      say: 'Cuttings are the rock chips made by the bit. Samples are caught at the shakers, so the geologists can see what rock is being drilled and look for signs of oil and gas.',
    },
    {
      term: 'Hydrocyclones & centrifuge', no: 'hydrosykloner / sentrifuge',
      def: 'Desanders and desilters (hydrocyclones) spin out sand and silt; decanting centrifuges remove the finest solids and can recover barite. Together: the solids control system.',
      say: 'Finer solids are removed by hydrocyclones, called desanders and desilters, and by centrifuges, which spin out the finest particles and can recover the expensive barite.',
    },
    {
      term: 'Degasser & mud gas separator', abbr: 'MGS', no: 'avgasser',
      def: 'A degasser removes entrained gas from the mud. The mud gas separator (poor boy degasser) handles larger volumes of gas during well control, venting it safely up the derrick.',
      say: 'Gas in the mud is removed by a degasser. During well control, a larger mud gas separator, nicknamed the poor boy, takes the gas out and vents it safely high up the derrick.',
    },
    {
      term: 'Mud pits & trip tank', abbr: 'PVT', no: 'slamtanker / triptank',
      def: 'Mud is stored in pits; the active system is the volume in circulation, monitored by the pit volume totaliser (PVT). The trip tank is a small, accurate tank used to measure hole fill and returns when tripping.',
      ex: 'Pit gain of one cubic metre, flow check!',
      say: 'The mud lives in pits. The active pits are monitored continuously, so any gain or loss is seen at once. The trip tank is a small, accurate tank used to check that the hole takes the right volume during trips.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const hl = [['shakers'], ['shakers'], ['cyclones', 'centrifuge'], ['degasser'], ['pits', 'triptank']][bi];
    const presets = [[450, 490, 2.2], [460, 510, 2.6], [190, 480, 2.3], [300, 470, 2.3], [400, 480, 1.4]];
    const P = loopView(ctx, S, presets, { t, flow: 1, cuttings: true, bubbles: bi === 3, hl: new Set(hl), hlA: S.hl(bi), pitLevel: bi === 4 ? 0.62 + 0.04 * Math.sin(t) : 0.7 });
    const box = (title) => { fillRR(ctx, 40, 700, 1116, 200, 18, 'rgba(7,17,28,0.92)', C.panelEdge, 2); text(ctx, title, 70, 745, { size: 24, weight: 900, color: C.amber }); };
    if (bi === 0) callout(ctx, P.shakers[0], P.shakers[1], 850, 200, 'SHALE SHAKERS', { color: C.amber, size: 26, t: S.p(0, 0.6, 0.6) });
    if (bi === 1) {
      box('CUTTINGS SAMPLE');
      const R = K.rng(9);
      for (let i = 0; i < 60; i++) {
        const x = 420 + R() * 700, y = 770 + R() * 110;
        const kind = R();
        ctx.fillStyle = kind < 0.6 ? '#8c7c66' : kind < 0.85 ? '#d2ad62' : '#55524e';
        ctx.beginPath(); ctx.ellipse(x, y, 6 + R() * 7, 4 + R() * 4, R() * 3, 0, Math.PI * 2); ctx.fill();
      }
      para(ctx, 'claystone, grey · trace sandstone, fine · no shows', 70, 800, 330, { size: 22, color: C.text });
      callout(ctx, P.skip[0], P.skip[1], 900, 200, 'CUTTINGS', { color: C.amber, size: 26, t: S.p(1, 0.6, 0.6) });
    }
    if (bi === 2) {
      callout(ctx, P.cyclones[0], P.cyclones[1], 760, 200, 'DESANDER / DESILTER', { color: C.amber, size: 24, t: S.p(2, 0.6, 0.6) });
      callout(ctx, P.centrifuge[0], P.centrifuge[1], 300, 160, 'CENTRIFUGE', { color: C.cyan, size: 24, t: S.p(2, 0.6, 2.5), align: 'left' });
    }
    if (bi === 3) {
      callout(ctx, P.degasser[0], P.degasser[1], 800, 200, 'DEGASSER', { color: C.amber, size: 26, t: S.p(3, 0.6, 0.6) });
      tag(ctx, 'MGS (“poor boy”) for well control', 598, 880, { size: 24, color: C.red, alpha: S.p(3, 0.6, 4), fill: 'rgba(7,17,28,0.9)' });
    }
    if (bi === 4) {
      callout(ctx, P.pits[0], P.pits[1], 300, 850, 'ACTIVE PITS', { color: C.amber, size: 24, t: S.p(4, 0.6, 0.6), align: 'left' });
      callout(ctx, P.tripTank[0], P.tripTank[1], 1000, 300, 'TRIP TANK', { color: C.cyan, size: 24, t: S.p(4, 0.6, 3.5) });
      const v = 64.2 + 0.6 * Math.sin(t);
      tag(ctx, `PVT: ${v.toFixed(1)} m³`, 900, 820, { size: 26, color: C.amber, fam: K.MONO, fill: 'rgba(7,17,28,0.9)', alpha: S.p(4, 0.6, 2) });
    }
  },
};

// ------------------------------------------------------------ the mud itself
const fluidScene = {
  id: 'fluids',
  title: 'Drilling fluid: types and properties',
  blurb: 'Mud is engineered: density, viscosity and chemistry are all designed.',
  beats: [
    {
      term: 'Drilling fluid', no: 'borevæske / boreslam',
      def: '“Mud”. Its jobs: control formation pressure (primary well barrier), carry cuttings, cool and lubricate the bit, stabilise the hole wall, and transmit MWD signals.',
      say: 'Drilling fluid, or mud, has many jobs. It controls formation pressure, which makes it the primary well barrier. It carries the cuttings, cools the bit, supports the hole wall, and even carries the MWD signals.',
    },
    {
      term: 'Water-based & oil-based mud', abbr: 'WBM | OBM', no: 'vannbasert / oljebasert slam',
      def: 'WBM uses water (often with KCl and glycol) as the base; OBM is an emulsion of brine in base oil, better for reactive shales, HPHT and long sections. On the NCS, OBM and OBM-coated cuttings must not be discharged to sea.',
      ex: 'Top hole on seawater and sweeps, then we displace to OBM for the 12¼.',
      say: 'Water based mud, WBM, uses water as the base. Oil based mud, OBM, is an emulsion of brine in base oil, and is preferred in reactive shales and hot, deep sections. On the Norwegian shelf, oil based mud and its cuttings must never be discharged to sea.',
    },
    {
      term: 'Mud weight', no: 'slamvekt',
      def: 'The density of the mud, given in SG on the NCS and measured with a mud balance. It sets the hydrostatic pressure in the well. Weighting up = increasing it, usually by adding barite.',
      ex: 'Weight up from 1.30 to 1.38 SG.',
      say: 'Mud weight is the density of the mud, in SG, measured with a mud balance. It sets the hydrostatic pressure in the well. Increasing it is called weighting up.',
    },
    {
      term: 'Rheology: PV, YP & gels', abbr: 'PV | YP', no: 'reologi',
      def: 'How the mud flows. Plastic viscosity (PV) reflects solids friction; yield point (YP) is the stress needed to start flow and helps carry cuttings; gel strength holds cuttings in suspension when circulation stops.',
      say: 'Rheology describes how the mud flows. Plastic viscosity, PV, comes from friction between solids. Yield point, YP, is the push needed to start flow, and helps lift cuttings. Gel strength lets the mud hold cuttings in suspension when the pumps stop.',
    },
    {
      term: 'Filter cake & fluid loss', no: 'filterkake / væsketap',
      def: 'Against permeable rock, liquid (filtrate) leaks into the formation and the solids build a thin filter cake on the wall. A thin, tough cake limits fluid loss; a thick one raises the risk of differential sticking.',
      say: 'Against permeable rock, some liquid, the filtrate, leaks into the formation, and the solids plaster a thin filter cake on the wall. A thin, tough cake is good. A thick one can trap the pipe.',
    },
    {
      term: 'Barite & bentonite', no: 'barytt / bentonitt',
      def: 'Barite (barium sulphate, SG ≈ 4.2) is the standard weighting material. Bentonite is a clay that gives viscosity and filter cake in water-based mud.',
      say: 'Barite is a heavy mineral, more than four times denser than water, used to weight up the mud. Bentonite is a clay that gives water based mud its viscosity and filter cake.',
    },
    {
      term: 'Pills, sweeps & slugs', no: 'piller',
      def: 'Small special volumes pumped for a purpose: a hi-vis sweep to clean the hole, an LCM pill to cure losses, a heavy slug before pulling out so the pipe comes out dry.',
      ex: 'Pump a hi-vis sweep, then a slug before we POOH.',
      say: 'A pill is a small special volume pumped for a purpose. A high viscosity sweep cleans the hole, a lost circulation pill plugs losses, and a heavy slug is pumped before pulling out, so the pipe comes out of the hole dry.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const cx = 598, cy = 470;
      const a = S.p(0, 0.8);
      I.drop(ctx, cx, cy, 300 * a, C.mud);
      text(ctx, 'MUD', cx, cy + 70, { size: 48, weight: 900, align: 'center', color: '#fff', alpha: a });
      const jobs = [['controls pressure', C.blue, -2.4], ['carries cuttings', C.sand, -1.4], ['cools the bit', C.cyan, -0.4], ['supports the wall', C.steel, 0.6], ['sends MWD signals', C.green, 1.6], ['lubricates', C.amber, 2.6]];
      jobs.forEach(([s2, col, ang], i) => {
        const v = S.p(0, 0.5, 1 + i * 0.9, ease.outBack);
        if (v <= 0) return;
        const x = cx + Math.cos(ang) * 340, y = cy + Math.sin(ang) * 300;
        ctx.save(); ctx.globalAlpha *= clamp(v);
        line(ctx, cx + Math.cos(ang) * 150, cy + Math.sin(ang) * 140, x - Math.cos(ang) * 40, y - Math.sin(ang) * 30, rgba(col, 0.6), 3);
        tag(ctx, s2, x, y, { size: 24, color: col, fill: 'rgba(7,17,28,0.9)' });
        ctx.restore();
      });
    }
    if (bi === 1) {
      const jars = [['WBM', 'water-based', '#b89366', 'water + clay + polymers (KCl, glycol)', 350], ['OBM', 'oil-based', '#6b4a2e', 'brine droplets in base oil', 850]];
      jars.forEach(([n, d, col, desc, x], i) => {
        const v = S.p(1, 0.6, 0.4 + i * 1.5);
        ctx.save(); ctx.globalAlpha *= v;
        fillRR(ctx, x - 140, 200, 280, 380, 24, rgba('#cfe0ee', 0.1), '#cfe0ee', 4);
        fillRR(ctx, x - 136, 290, 272, 286, 20, col);
        if (n === 'OBM') { for (let k = 0; k < 40; k++) circle(ctx, x - 120 + ((k * 53) % 240), 310 + ((k * 37) % 250), 6, rgba('#d6b892', 0.8)); }
        text(ctx, n, x, 650, { size: 46, weight: 900, align: 'center', color: C.text });
        text(ctx, d, x, 690, { size: 24, weight: 700, align: 'center', color: C.dim });
        text(ctx, desc, x, 730, { size: 20, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
      });
      tag(ctx, 'NCS: no discharge of OBM or OBM cuttings', 598, 850, { size: 24, color: C.red, alpha: S.p(1, 0.6, 9) });
    }
    if (bi === 2) {
      // mud balance
      const a = S.p(2, 0.6, 0.3);
      ctx.save(); ctx.globalAlpha *= a;
      const px = 520, py = 420;
      poly(ctx, [[px - 30, py + 200], [px + 30, py + 200], [px + 6, py], [px - 6, py]]); ctx.fillStyle = '#56687a'; ctx.fill();
      const tilt = Math.sin(t * 1.5) * 0.04 * (1 - clamp(S.since(2) / 6));
      ctx.save(); ctx.translate(px, py); ctx.rotate(tilt);
      fillRR(ctx, -360, -10, 720, 20, 8, '#cfd8e3');
      fillRR(ctx, -380, -50, 90, 70, 12, C.mud, '#56687a', 3);
      fillRR(ctx, 120, -24, 30, 48, 6, C.amber);
      for (let i = 0; i < 12; i++) line(ctx, -200 + i * 40, -10, -200 + i * 40, 4, '#56687a', 2);
      ctx.restore();
      text(ctx, 'MUD BALANCE', px, py + 260, { size: 22, weight: 800, align: 'center', color: C.dim });
      ctx.restore();
      fillRR(ctx, 860, 160, 280, 120, 16, rgba(C.amber, 0.12), C.amber, 2);
      text(ctx, '1.38 SG', 1000, 240, { size: 52, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
      const b = S.p(2, 0.6, 5);
      ctx.save(); ctx.globalAlpha *= b;
      for (let i = 0; i < 4; i++) { fillRR(ctx, 860 + i * 70, 720, 60, 80, 8, '#d9d2c5', '#8a8170', 2); text(ctx, 'BaSO₄', 890 + i * 70, 768, { size: 13, weight: 800, align: 'center', color: '#333' }); }
      text(ctx, 'weighting up with barite', 1000, 840, { size: 22, weight: 700, align: 'center', color: C.text });
      ctx.restore();
    }
    if (bi === 3) {
      const ox = 140, oy = 760, w = 560, h = 520;
      line(ctx, ox, oy, ox + w, oy, C.dim, 3); line(ctx, ox, oy, ox, oy - h, C.dim, 3);
      text(ctx, 'shear rate', ox + w / 2, oy + 44, { size: 22, weight: 700, align: 'center', color: C.dim });
      ctx.save(); ctx.translate(ox - 40, oy - h / 2); ctx.rotate(-Math.PI / 2); text(ctx, 'shear stress', 0, 0, { size: 22, weight: 700, align: 'center', color: C.dim }); ctx.restore();
      const p = S.p(3, 1.5, 0.5);
      const yp = 140, slope = 0.62;
      K.partialPolyline(ctx, [[ox, oy - yp], [ox + w, oy - yp - w * slope]], p, C.amber, 5);
      ctx.save(); ctx.globalAlpha *= S.p(3, 0.6, 2);
      line(ctx, ox, oy - yp, ox + 80, oy - yp, C.cyan, 3, [8, 6]);
      tag(ctx, 'YP (intercept)', ox + 150, oy - yp + 40, { size: 20, color: C.cyan });
      tag(ctx, 'PV (slope)', ox + 380, oy - yp - 380 * slope - 40, { size: 20, color: C.amber });
      ctx.restore();
      // gel: suspended cuttings
      const g = S.p(3, 0.6, 7);
      ctx.save(); ctx.globalAlpha *= g;
      fillRR(ctx, 820, 240, 300, 460, 20, C.mud, '#56687a', 3);
      for (let k = 0; k < 14; k++) circle(ctx, 850 + ((k * 61) % 240), 290 + ((k * 89) % 360) + Math.sin(t + k) * 2, 6, '#e8dcc0');
      text(ctx, 'GELS: pumps off,', 970, 750, { size: 22, weight: 800, align: 'center', color: C.text });
      text(ctx, 'cuttings stay suspended', 970, 782, { size: 22, weight: 600, align: 'center', color: C.dim });
      ctx.restore();
    }
    if (bi === 4) {
      // permeable wall with filter cake building
      K.lithoFill(ctx, 'sand', 0, 0, 520, 940, 6);
      ctx.fillStyle = C.mud; ctx.fillRect(560, 0, 636, 940);
      const cake = 40 * S.p(4, 6, 0.5);
      ctx.fillStyle = '#3e2a18'; ctx.fillRect(520, 0, cake + 4, 940);
      // filtrate arrows into sand
      for (let k = 0; k < 8; k++) {
        const y = 100 + k * 100;
        const ph = (t * 0.6 + k * 0.13) % 1;
        ctx.save(); ctx.globalAlpha *= (1 - ph) * (1 - S.p(4, 6, 0.5) * 0.7);
        arrow(ctx, 560 - ph * 30, y, 440 - ph * 120, y, { color: C.cyan, lw: 3, head: 10 });
        ctx.restore();
      }
      text(ctx, 'permeable sandstone', 260, 60, { size: 24, weight: 800, align: 'center', color: '#3b2a10' });
      text(ctx, 'mud', 900, 60, { size: 26, weight: 800, align: 'center', color: '#fff' });
      callout(ctx, 520 + cake / 2, 470, 760, 420, 'FILTER CAKE', { color: C.amber, size: 26, t: S.p(4, 0.6, 2.5) });
      callout(ctx, 400, 300, 760, 240, 'filtrate (fluid loss)', { color: C.cyan, size: 22, t: S.p(4, 0.6, 1.0) });
    }
    if (bi === 5) {
      const items = [['BARITE', 'BaSO₄ · SG ≈ 4.2', 'weighting material', '#d9d2c5', 330], ['BENTONITE', 'clay platelets', 'viscosity & cake in WBM', '#b8a27a', 860]];
      items.forEach(([n, a2, b2, col, x], i) => {
        const v = S.p(5, 0.6, 0.4 + i * 2);
        ctx.save(); ctx.globalAlpha *= v;
        fillRR(ctx, x - 150, 220, 300, 360, 30, col, darken(col, 0.4), 4);
        text(ctx, n, x, 360, { size: 40, weight: 900, align: 'center', color: '#2b2b2b' });
        text(ctx, '1 t big bag', x, 420, { size: 20, weight: 700, align: 'center', color: '#444' });
        text(ctx, a2, x, 650, { size: 26, weight: 800, align: 'center', color: C.text });
        text(ctx, b2, x, 690, { size: 22, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
      });
    }
    if (bi === 6) {
      // string with slug and sweep in annulus
      K.lithoFill(ctx, 'rock3', 0, 0, 1196, 940, 2);
      ctx.fillStyle = '#5e4128'; ctx.fillRect(420, 0, 360, 940);
      ST.metal(ctx, 570, 0, 60, 940);
      ctx.fillStyle = '#7a5129'; ctx.fillRect(578, 0, 44, 940);
      // heavy slug at top of string
      const sl = S.p(6, 0.6, 7);
      ctx.save(); ctx.globalAlpha *= sl; ctx.fillStyle = '#2e1d0e'; ctx.fillRect(578, 60, 44, 200); ctx.restore();
      if (sl > 0) tag(ctx, 'heavy SLUG', 760, 160, { size: 22, color: C.amber, alpha: sl });
      // sweep moving up annulus
      const ph = clamp(S.since(6) / 7);
      const y = lerp(880, 320, ph);
      ctx.fillStyle = rgba('#e9d7a3', 0.75); ctx.fillRect(420, y - 40, 150, 80); ctx.fillRect(630, y - 40, 150, 80);
      for (let k = 0; k < 16; k++) circle(ctx, 430 + ((k * 37) % 130) + (k % 2) * 210, y - 30 + ((k * 23) % 60), 4, '#e8dcc0');
      tag(ctx, 'hi-vis SWEEP', 300, y, { size: 22, color: C.cyan });
      tag(ctx, 'LCM pill → see losses', 300, 860, { size: 20, color: C.dim, alpha: S.p(6, 0.6, 4) });
    }
  },
};

// ------------------------------------------------------------ environment & mud people
const envScene = {
  id: 'environment',
  title: 'Mud, cuttings and the environment',
  blurb: 'What may go to sea, what must go to shore, and who looks after the mud.',
  beats: [
    {
      term: 'Chemical colour categories', no: 'grønn / gul / rød / svart',
      def: 'The Norwegian Environment Agency classifies offshore chemicals: green (PLONOR, little or no risk), yellow (acceptable), red (to be substituted) and black (generally prohibited). Usage and discharges are reported per category.',
      ex: 'That additive is red, we need the substitute before we can use it.',
      say: 'Every chemical used offshore is classified by colour. Green chemicals pose little or no risk. Yellow are acceptable. Red should be replaced by better alternatives, and black are generally banned. The discharge permit is written around these categories.',
    },
    {
      term: 'Cuttings handling', no: 'kakshåndtering',
      def: 'What happens to cuttings: water-based cuttings can be discharged at the seabed or from the rig under the permit; OBM cuttings are skipped and shipped to shore, injected into a disposal well, or cleaned offshore in a thermal unit.',
      ex: 'We’re on skip and ship for the 12¼ section, so expect lots of crane lifts.',
      say: 'Water based cuttings can usually be discharged under the permit. Oil based cuttings are collected in skips and shipped to shore, injected into a disposal well, or cleaned offshore in a thermal unit. Skip and ship means a lot of crane lifts.',
    },
    {
      term: 'Mud engineer & mud check', no: 'slamingeniør',
      def: 'The mud company’s engineer on the rig tests the mud every few hours: density, rheology, fluid loss, solids, chemistry. They write the mud report and recommend treatments.',
      ex: 'Ask the mud engineer for the latest mud check before you change the flow rate.',
      say: 'The mud engineer looks after the mud. Every few hours they run a mud check, testing density, viscosity, fluid loss and chemistry, and they write the daily mud report.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const cats = [['GREEN', 'PLONOR · little or no risk', C.green], ['YELLOW', 'acceptable, monitored', C.yellow], ['RED', 'to be substituted', C.red], ['BLACK', 'generally prohibited', '#1b1b1b']];
      cats.forEach(([n, d, col], i) => {
        const v = S.p(0, 0.5, 0.6 + i * 1.2, ease.outBack);
        if (v <= 0) return;
        const y = 150 + i * 180;
        ctx.save(); ctx.globalAlpha *= clamp(v);
        fillRR(ctx, 150, y, 220, 140, 18, col, '#e8eef5', n === 'BLACK' ? 3 : 0);
        text(ctx, n, 260, y + 82, { size: 34, weight: 900, align: 'center', color: n === 'YELLOW' ? '#1a1206' : '#fff' });
        text(ctx, d, 420, y + 82, { size: 30, weight: 700, color: C.text });
        ctx.restore();
      });
    }
    if (bi === 1) {
      const routes = [['Discharge', 'WBM cuttings, per permit', C.green, 180], ['Skip & ship', 'to shore for treatment', C.amber, 420], ['Injection', 'into a disposal well', C.cyan, 660], ['Thermal unit', 'cleaned offshore', C.purple, 900]];
      fillRR(ctx, 480, 80, 236, 90, 16, '#3d5266', '#56687a', 2);
      text(ctx, 'CUTTINGS', 598, 136, { size: 28, weight: 900, align: 'center', color: C.text });
      routes.forEach(([n, d, col, x], i) => {
        const v = S.p(1, 0.6, 0.6 + i * 1.3);
        ctx.save(); ctx.globalAlpha *= v;
        K.curvedArrow(ctx, [[598, 175], [598, 230], [x + 60, 280], [x + 60, 340]], { color: col, lw: 4, t: v });
        fillRR(ctx, x - 45, 350, 210, 170, 16, rgba(col, 0.12), col, 2);
        text(ctx, n, x + 60, 410, { size: 22, weight: 800, align: 'center', color: C.text });
        text(ctx, d, x + 60, 450, { size: 18, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
      });
      // skip lifted
      const sp = S.p(1, 3, 3);
      const sx = 480, sy = lerp(760, 600, sp);
      line(ctx, sx, 540, sx, sy, '#cfd8e3', 2);
      fillRR(ctx, sx - 40, sy, 80, 50, 4, '#6b7c8c', '#56687a', 2);
      text(ctx, 'skip', sx, sy + 32, { size: 18, weight: 800, align: 'center', color: '#0b1520' });
      text(ctx, 'OBM cuttings never go to sea on the NCS', 598, 860, { size: 24, weight: 800, align: 'center', color: C.red, alpha: S.p(1, 0.6, 7) });
    }
    if (bi === 2) {
      I.person(ctx, 360, 520, 300, { shirt: C.blue, helmetColor: '#ffffff', label: 'MUD ENGINEER', labelColor: C.amber });
      const a = S.p(2, 0.6, 1);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 640, 150, 480, 560, 18, '#f4f1ea', '#c9c2b0', 2);
      text(ctx, 'MUD REPORT  06:00', 880, 205, { size: 24, weight: 900, align: 'center', color: '#222' });
      const rows = [['Density', '1.38 SG'], ['PV / YP', '24 / 18'], ['Gels 10s/10m', '6 / 11'], ['Fluid loss (HPHT)', '3.2 ml'], ['Oil / water', '78 / 22'], ['Low-gravity solids', '5.1 %']];
      rows.forEach(([k, v], i) => {
        const vv = S.p(2, 0.4, 1.8 + i * 0.6);
        text(ctx, k, 670, 270 + i * 66, { size: 22, weight: 600, color: '#333', alpha: vv });
        text(ctx, v, 1090, 270 + i * 66, { size: 24, weight: 800, align: 'right', color: '#111', fam: K.MONO, alpha: vv });
        line(ctx, 670, 285 + i * 66, 1090, 285 + i * 66, rgba('#000', 0.12), 1);
      });
      ctx.restore();
    }
  },
};

module.exports = {
  id: 'ch06', num: 6, title: 'Drilling Fluids & Circulation',
  subtitle: 'The mud: what it does, how it circulates, and how it is cleaned',
  topics: ['Circulation', 'Mud pumps', 'SPP', 'Annulus', 'Bottoms up', 'Flow out', 'Shakers', 'Cuttings', 'Centrifuge', 'Degasser', 'Pits & trip tank', 'WBM / OBM', 'Mud weight', 'PV / YP', 'Filter cake', 'Barite', 'Pills', 'Zero discharge'],
  intro: 'Chapter six: drilling fluids and circulation. People call it mud, but it is a carefully engineered fluid, and it is your first line of defence against the well.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.translate(330, 420); ctx.scale(0.8, 0.8); ctx.translate(-420, -470);
    M.drawLoop(ctx, { t, flow: 1, cuttings: true });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [loopScene, solidsScene, fluidScene, envScene],
};
