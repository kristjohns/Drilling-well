'use strict';
const K = require('../engine/core');
const WL = require('../art/well');
const SS = require('../art/subsea');
const ST = require('../art/string');
const I = require('../art/icons');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, dimLine, richLine } = K;

const KW = {
  cx: 300, seabed: 110, td: 900,
  layers: [{ to: 380, kind: 'clay' }, { to: 600, kind: 'rock2' }, { to: 760, kind: 'shale' }, { to: 880, kind: 'sand' }, { to: 940, kind: 'rock4' }],
  strings: [{ hw: 58, holeHw: 70, top: 110, shoe: 320, toc: 110 }, { hw: 44, holeHw: 56, top: 110, shoe: 640, toc: 480 }],
  hole: { hw: 34, to: 880 },
};
// gas bubbles in annulus from bottom up to level `top`, expanding upwards
function influx(ctx, cx, bottom, top, t, opt = {}) {
  const { n = 18, col = C.gas, alpha = 1, speed = 0.25 } = opt;
  ctx.save(); ctx.globalAlpha *= alpha;
  for (let k = 0; k < n; k++) {
    const ph = (t * speed + k / n) % 1;
    const y = lerp(bottom, top, ph);
    if (y < top) continue;
    const side = k % 2 ? 1 : -1;
    const r = 4 + (1 - (y - top) / Math.max(1, bottom - top)) * 6;
    circle(ctx, cx + side * (16 + (k % 3) * 4), y, r, col);
  }
  ctx.restore();
}
function rigPanel(ctx, x, y, st) {
  fillRR(ctx, x, y, 470, 330, 16, 'rgba(7,17,28,0.92)', st.alarm ? C.red : C.panelEdge, st.alarm ? 3 : 2);
  text(ctx, 'DRILLER’S SCREEN', x + 235, y + 40, { size: 20, weight: 900, align: 'center', color: C.dim, spacing: 2 });
  tankDraw(ctx, x + 40, y + 70, 110, 200, st.pit, st.alarm);
  text(ctx, `${(60 + st.pit * 10).toFixed(1)} m³`, x + 95, y + 300, { size: 20, weight: 800, align: 'center', color: st.alarm ? C.red : C.text, fam: K.MONO });
  text(ctx, 'flow in', x + 200, y + 110, { size: 20, weight: 700, color: C.dim });
  text(ctx, `${st.fin} lpm`, x + 440, y + 110, { size: 22, weight: 800, align: 'right', color: C.text, fam: K.MONO });
  text(ctx, 'flow out', x + 200, y + 160, { size: 20, weight: 700, color: C.dim });
  text(ctx, `${st.fout} lpm`, x + 440, y + 160, { size: 22, weight: 800, align: 'right', color: st.fout > st.fin + 50 ? C.red : C.text, fam: K.MONO });
  text(ctx, 'SPP', x + 200, y + 210, { size: 20, weight: 700, color: C.dim });
  text(ctx, `${st.spp} bar`, x + 440, y + 210, { size: 22, weight: 800, align: 'right', color: C.text, fam: K.MONO });
  if (st.alarm) tag(ctx, '⚠ PIT GAIN ALARM', x + 320, y + 280, { size: 20, color: C.red });
}
function tankDraw(ctx, x, y, w, h, lvl, alarm) {
  fillRR(ctx, x, y, w, h, 6, '#22384b', '#56687a', 2);
  const l = clamp(0.55 + lvl * 0.4);
  ctx.fillStyle = C.mud; ctx.fillRect(x + 3, y + h - 3 - (h - 6) * l, w - 6, (h - 6) * l);
  line(ctx, x - 6, y + h - 3 - (h - 6) * 0.68, x + w + 6, y + h - 3 - (h - 6) * 0.68, C.red, 2, [6, 4]);
}

// ------------------------------------------------------------ kick
const kickScene = {
  id: 'kick',
  title: 'Kicks and blowouts',
  blurb: 'When the formation wins the pressure battle.',
  beats: [
    {
      term: 'Kick', no: 'brønnspark',
      def: 'An unplanned influx of formation fluid (gas, oil or water) into the wellbore, because the pressure in the well has dropped below the pore pressure. Detected early and shut in, it is routine; missed, it can escalate.',
      ex: 'We took a 2 m³ kick, the well is shut in.',
      say: 'A kick is an unplanned influx of formation fluid, gas, oil or water, into the well, because the well pressure has dropped below the pore pressure. Detected early and shut in quickly, a kick is manageable.',
    },
    {
      term: 'Blowout', no: 'utblåsning',
      def: 'An uncontrolled flow of formation fluids to surface or the seabed, or into another formation (an underground blowout). The worst-case event that all well control and barrier thinking is designed to prevent.',
      say: 'A blowout is an uncontrolled flow from the well, to the rig, to the seabed, or even into another formation underground. Everything in well control exists to prevent it.',
    },
    {
      term: 'Kick warning signs', no: 'varseltegn',
      def: 'Pit gain; flow-out increase; well flowing with pumps off; drilling break; SPP decrease with SPM increase; gas-cut mud; hole not taking the right fill on trips. Any sign means flow check or shut in.',
      ex: 'Flow out increased 8 percent, pick up and flow check.',
      say: 'Know the warning signs: a pit gain, more flow coming out than going in, flow with the pumps off, a drilling break, falling pump pressure, gas cut mud, or the hole not taking the right fill on a trip. Any of them means: flow check, or shut in.',
    },
    {
      term: 'Pit gain', no: 'volumøkning i tank',
      def: 'An increase in the active pit volume that is not explained by planned operations: the most direct indicator of a kick. Alarms are set at small volumes, e.g. 0.5–1 m³.',
      say: 'A pit gain is an unexplained increase in the active pit volume. Every cubic metre that comes in from the formation pushes out a cubic metre of mud, so it is the most direct kick indicator. Alarms are set at small volumes.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, 1196, 110);
    WL.drawWell(ctx, KW, { t, string: { to: 870, from: 0 } });
    const prog = bi === 0 ? S.p(0, 8, 1) : bi === 3 ? S.p(3, 8, 0.5) : 0.6;
    if (bi !== 1) {
      influx(ctx, 300, 870, lerp(860, 520, prog), t, { n: 20 });
      // gas entering from sand
      for (let k = 0; k < 6; k++) { const ph = (t * 0.6 + k / 6) % 1; circle(ctx, lerp(150, 262, ph), 850 + (k % 3) * 10, 5, C.gas); }
      if (bi === 0) callout(ctx, 262, 830, 520, 760, 'INFLUX from the sand', { color: C.red, size: 22, t: S.p(0, 0.6, 1.5) });
      rigPanel(ctx, 680, 140, { pit: prog * 0.6, alarm: prog > 0.35, fin: 3600, fout: Math.round(3600 + prog * 420), spp: Math.round(210 - prog * 12) });
    }
    if (bi === 1) {
      influx(ctx, 300, 870, 120, t, { n: 40, speed: 0.9 });
      for (let k = 0; k < 40; k++) { const ph = (t * 0.8 + k / 40) % 1; circle(ctx, 300 + Math.sin(k * 7) * 120 * ph, lerp(110, 0, ph), 6 + ph * 14, rgba('#e9f6ff', 0.6 * (1 - ph))); }
      tag(ctx, 'UNCONTROLLED FLOW', 800, 260, { size: 34, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      text(ctx, 'to rig · to seabed · or underground', 800, 330, { size: 24, weight: 700, align: 'center', color: C.text });
      I.warn(ctx, 800, 470, 120, C.red);
    }
    if (bi === 2) {
      const signs = ['pit gain', 'flow out ↑', 'flow with pumps off', 'drilling break', 'SPP ↓ / SPM ↑', 'gas-cut mud', 'wrong hole fill on trip'];
      fillRR(ctx, 680, 500, 470, 400, 16, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, 'WARNING SIGNS', 915, 545, { size: 22, weight: 900, align: 'center', color: C.amber, spacing: 2 });
      signs.forEach((s2, i) => {
        const v = S.p(2, 0.4, 1 + i * 1.1);
        I.warn(ctx, 715, 585 + i * 44, 28 * v, C.amber);
        text(ctx, s2, 745, 594 + i * 44, { size: 22, weight: 700, color: C.text, alpha: v });
      });
    }
    if (bi === 3) callout(ctx, 680 + 95, 140 + 140, 900, 580, 'PIT GAIN', { color: C.red, size: 26, t: S.p(3, 0.6, 3) });
  },
};

// ------------------------------------------------------------ shut-in and pressures
function uTube(ctx, x, y, t, st) {
  // left leg: drill string, right leg: annulus with influx
  const h = 560;
  fillRR(ctx, x, y, 80, h, 8, C.mud, '#56687a', 3);
  fillRR(ctx, x + 140, y, 120, h, 8, C.mud, '#56687a', 3);
  ctx.fillStyle = C.mud; ctx.fillRect(x, y + h - 60, 260, 60);
  // influx in annulus
  const ih = st.influxH || 120, iy = st.influxY != null ? st.influxY : y + h - 70 - ih;
  ctx.fillStyle = rgba(C.gas, 0.85); ctx.fillRect(x + 143, iy, 114, ih);
  text(ctx, 'gas', x + 200, iy + ih / 2 + 7, { size: 18, weight: 800, align: 'center', color: '#fff' });
  if (st.kill) { ctx.fillStyle = '#3a2412'; ctx.fillRect(x + 3, y + 3, 74, (h - 6) * st.kill); }
  if (st.gauges !== false) {
    gauge(ctx, x + 40, y - 150, 64, st.dp, { min: 0, max: 80, unit: 'bar', label: 'SIDPP', color: C.cyan });
    gauge(ctx, x + 200, y - 150, 64, st.csg, { min: 0, max: 80, unit: 'bar', label: 'SICP', color: C.amber });
  }
  text(ctx, 'drill pipe', x + 40, y + h + 34, { size: 18, weight: 700, align: 'center', color: C.dim });
  text(ctx, 'annulus', x + 200, y + h + 34, { size: 18, weight: 700, align: 'center', color: C.dim });
}
const shutScene = {
  id: 'shutin',
  title: 'Shut in and read the pressures',
  blurb: 'Close the well, then let the gauges tell you what the formation is doing.',
  beats: [
    {
      term: 'Shut in', no: 'stenge inn brønnen',
      def: 'Closing the well in on a kick: space out, stop the pumps, close the BOP (annular or pipe rams) with the choke line closed. A fast shut-in keeps the kick small.',
      ex: 'Space out, pumps off, close the annular, the well is shut in.',
      say: 'When a kick is detected, the driller shuts in the well: picks up off bottom, stops the pumps, and closes the BOP, usually the annular or the pipe rams. The faster the shut in, the smaller the kick.',
    },
    {
      term: 'Shut-in drill pipe pressure', abbr: 'SIDPP',
      def: 'The stabilised pressure on the drill pipe after shut-in. Because the string is full of mud of known weight, it directly gives the formation pressure: P formation = SIDPP + mud hydrostatic.',
      ex: 'SIDPP stabilised at 25 bar.',
      say: 'SIDPP, the shut in drill pipe pressure, is read on the drill pipe gauge. The string is full of known mud, so the formation pressure is simply SIDPP plus the hydrostatic pressure of the mud.',
    },
    {
      term: 'Shut-in casing pressure', abbr: 'SICP',
      def: 'The pressure on the annulus side (choke/casing gauge) after shut-in. Usually higher than SIDPP, because the light influx in the annulus gives less hydrostatic. Must stay below MAASP.',
      say: 'SICP, the shut in casing pressure, is read on the annulus side. It is usually higher than SIDPP, because the light gas in the annulus weighs less than mud. It must stay below the MAASP.',
      tts: 'SICP, the shut in casing pressure, is read on the annulus side. It is usually higher than SIDPP, because the light gas in the annulus weighs less than mud. It must stay below the MAASP.',
    },
    {
      term: 'Kill mud weight', abbr: 'KMW', no: 'drepeslamvekt',
      def: 'The mud weight needed to balance the formation pressure: KMW = MW + SIDPP ÷ (0.0981 × TVD). Example: 1.40 + 25 ÷ (0.0981 × 3,000) ≈ 1.49 SG.',
      say: 'From SIDPP you calculate the kill mud weight: the current mud weight plus SIDPP divided by zero point zero nine eight one times the TVD. Here, one point four zero becomes about one point four nine SG.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      // BOP closing around pipe
      const cx = 380, cy = 470;
      fillRR(ctx, cx - 220, cy - 260, 440, 520, 20, '#3b1f22', '#7a3b3b', 4);
      ST.metal(ctx, cx - 18, 60, 36, 820, '#9fb0c1');
      const close = S.p(0, 2, 2.5);
      // annular element squeezing
      const gap = lerp(110, 22, close);
      ctx.fillStyle = '#2b2b2b';
      ctx.beginPath(); ctx.moveTo(cx - 200, cy - 100); ctx.quadraticCurveTo(cx - gap - 30, cy, cx - 200, cy + 100); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + 200, cy - 100); ctx.quadraticCurveTo(cx + gap + 30, cy, cx + 200, cy + 100); ctx.closePath(); ctx.fill();
      tag(ctx, close > 0.95 ? 'ANNULAR CLOSED' : 'closing…', cx, cy + 320, { size: 28, color: close > 0.95 ? C.green : C.amber, fill: 'rgba(7,17,28,0.9)' });
      const steps = ['space out (pick up)', 'stop the pumps', 'close the BOP', 'confirm closed, record pressures'];
      fillRR(ctx, 720, 260, 440, 300, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      steps.forEach((s2, i) => text(ctx, `${i + 1}. ${s2}`, 750, 320 + i * 60, { size: 24, weight: 700, color: S.since(0) > 1 + i * 1.6 ? C.text : C.faint }));
    }
    if (bi >= 1) {
      const settle = S.p(1, 4, 0.5);
      uTube(ctx, 150, 260, t, { dp: 25 * (bi === 1 ? settle : 1), csg: 38 * (bi === 1 ? settle : 1), influxH: 120, kill: 0 });
      if (bi === 1) {
        formula(ctx, 520, 280, ['P_formation = **SIDPP** + mud hydrostatic', '= 25 + 0.0981 × 1.40 × 3,000', '= ==437 bar=='], S.p(1, 0.6, 3));
      }
      if (bi === 2) {
        formula(ctx, 520, 280, ['SICP > SIDPP', 'gas in annulus weighs less than mud', 'keep SICP **below MAASP**'], S.p(2, 0.6, 1));
      }
      if (bi === 3) {
        formula(ctx, 520, 280, ['KMW = MW + SIDPP ÷ (0.0981 × TVD)', '= 1.40 + 25 ÷ (0.0981 × 3,000)', '= ==1.49 SG=='], S.p(3, 0.6, 1));
      }
    }
  },
};
function formula(ctx, x, y, lines, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, x, y, 640, 60 + lines.length * 56, 16, 'rgba(7,17,28,0.92)', C.amber, 2);
  lines.forEach((l, i) => richLine(ctx, l, x + 26, y + 62 + i * 56, { size: 26, color: C.text }));
  ctx.restore();
}

// ------------------------------------------------------------ killing the well
function pressureChart(ctx, x, y, w, h, method, p, t) {
  fillRR(ctx, x - 50, y - 50, w + 80, h + 100, 14, 'rgba(7,17,28,0.85)', C.panelEdge, 2);
  line(ctx, x, y + h, x + w, y + h, C.dim, 2); line(ctx, x, y, x, y + h, C.dim, 2);
  text(ctx, 'strokes / time →', x + w / 2, y + h + 34, { size: 16, weight: 700, align: 'center', color: C.dim });
  const Y = (v) => y + h - (v / 100) * h;
  const dp = (u) => method === 'drillers' ? (u < 0.5 ? 60 : u < 0.62 ? lerp(60, 35, (u - 0.5) / 0.12) : 35) : (u < 0.35 ? lerp(60, 35, u / 0.35) : 35);
  const cp = (u) => method === 'drillers'
    ? (u < 0.15 ? 38 : u < 0.38 ? 38 + (u - 0.15) * 160 : u < 0.5 ? lerp(75, 10, (u - 0.38) / 0.12) : u < 0.62 ? lerp(10, 2, (u - 0.5) / 0.12) : 0)
    : (u < 0.2 ? 38 : u < 0.4 ? 38 + (u - 0.2) * 120 : u < 0.55 ? lerp(62, 5, (u - 0.4) / 0.15) : 0);
  const pts1 = [], pts2 = [];
  for (let u = 0; u <= p; u += 0.005) { pts1.push([x + u * w, Y(dp(u))]); pts2.push([x + u * w, Y(cp(u))]); }
  K.partialPolyline(ctx, pts1, 1, C.cyan, 4); K.partialPolyline(ctx, pts2, 1, C.amber, 4);
  text(ctx, 'drill pipe pressure', x + 10, y + 20, { size: 16, weight: 800, color: C.cyan });
  text(ctx, 'casing pressure', x + 10, y + 44, { size: 16, weight: 800, color: C.amber });
  if (method === 'drillers') { line(ctx, x + w * 0.5, y, x + w * 0.5, y + h, rgba('#fff', 0.3), 2, [6, 6]); text(ctx, '1st circ.', x + w * 0.25, y + h - 10, { size: 15, weight: 700, align: 'center', color: C.dim }); text(ctx, '2nd circ.', x + w * 0.75, y + h - 10, { size: 15, weight: 700, align: 'center', color: C.dim }); }
}
const killScene = {
  id: 'kill',
  title: 'Killing the well',
  blurb: 'Circulating the influx out and getting heavier mud in.',
  beats: [
    {
      term: 'Driller’s method', no: 'borerens metode',
      def: 'Two circulations: first the influx is circulated out with the original mud, holding drill pipe pressure constant with the choke; then kill mud is circulated in. Simple, can start immediately.',
      say: 'The driller’s method uses two circulations. First the influx is circulated out with the original mud, adjusting the choke to keep the drill pipe pressure constant. Then the kill mud is pumped around. It is simple, and can start at once.',
    },
    {
      term: 'Wait and weight method', no: 'vent-og-vekt-metoden',
      def: 'The mud is weighted up to kill mud weight first, then pumped in a single circulation while the influx is circulated out, following a drill pipe pressure schedule from the kill sheet. Usually gives lower casing pressures.',
      say: 'The wait and weight method weights up the mud to kill weight first, then circulates the influx out and the kill mud in, in one go, following a pressure schedule. It usually gives lower pressures at the shoe.',
    },
    {
      term: 'Choke & kill lines and choke manifold', no: 'strupe- og drepelinje / strupemanifold',
      def: 'High-pressure lines from the BOP side outlets up to the rig. Returns go through the choke line to the choke manifold, where adjustable chokes hold back-pressure; the kill line lets you pump into the well below the closed BOP.',
      say: 'High pressure choke and kill lines run from the BOP up to the rig. During a kill, returns flow through the choke line to the choke manifold, where an adjustable choke holds back pressure. The kill line lets you pump into the well below the closed BOP.',
    },
    {
      term: 'Kill sheet & slow circulating rates', abbr: 'SCR', no: 'drepeskjema',
      def: 'The kill sheet is a pre-calculated worksheet of volumes, strokes and pressures for a kill. It uses slow circulating rates (SCR): pump pressures measured at low pump rates (e.g. 30 and 40 spm) every shift and after mud changes.',
      ex: 'Take SCRs on both pumps after the mud change.',
      say: 'The kill sheet is a worksheet with the volumes, strokes and pressures for a kill. It is built on slow circulating rates, SCRs: the pump pressures at low rates, measured every shift and after each mud change.',
    },
    {
      term: 'Bullheading', no: 'bullheading',
      def: 'Pumping down the well against the closed BOP to push the influx back into the formation. Used when circulating out is not possible or not desirable, e.g. with H₂S or no pipe in the hole.',
      say: 'Bullheading means pumping down the well with everything closed, forcing the influx back into the formation. It is used when circulating it out is not possible or too risky.',
    },
    {
      term: 'Volumetric method & stripping', no: 'volumetrisk metode / stripping',
      def: 'When you cannot circulate (e.g. pipe off bottom), migrating gas is controlled by bleeding off calculated mud volumes to keep bottom-hole pressure in a safe band (volumetric method). Stripping moves pipe through the closed annular to get back to bottom.',
      say: 'If you cannot circulate, for example with the pipe off bottom, the volumetric method lets the gas migrate while bleeding off small, calculated volumes of mud. Stripping means moving pipe through the closed annular, to get the bit back to bottom.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 1) {
      const p = S.p(bi, Math.max(4, S.bd - 1.5), 0.5, ease.linear);
      const method = bi === 0 ? 'drillers' : 'ww';
      pressureChart(ctx, 620, 160, 500, 400, method, p, t);
      // U-tube with circulation progress
      const iy = lerp(700, 120, clamp(p / (bi === 0 ? 0.5 : 0.55)));
      const kill = bi === 0 ? clamp((p - 0.5) / 0.5) : clamp(p / 0.35);
      uTube(ctx, 150, 260, t, { gauges: false, influxH: iy > 260 ? 110 : Math.max(0, 110 - (260 - iy)), influxY: Math.max(263, iy), kill: Math.min(1, kill * 1.3) });
      ctx.save(); ctx.globalAlpha *= 0.85; fillRR(ctx, 120, 60, 320, 120, 10, '#0b1520'); ctx.restore();
      text(ctx, bi === 0 ? 'DRILLER’S METHOD' : 'WAIT & WEIGHT', 280, 110, { size: 26, weight: 900, align: 'center', color: C.amber });
      text(ctx, bi === 0 ? '2 circulations' : 'weight up, 1 circulation', 280, 150, { size: 20, weight: 700, align: 'center', color: C.dim });
      tag(ctx, 'kill mud', 800, 660, { size: 20, color: '#c08a52', alpha: kill > 0.05 ? 1 : 0 });
    }
    if (bi === 2) {
      // BOP with choke & kill lines to manifold
      const bx = 300, by = 760;
      K.lithoFill(ctx, 'clay', 0, by + 20, 1196, 160, 3);
      const g = ctx.createLinearGradient(0, 0, 0, by + 20); g.addColorStop(0, '#0b3d5c'); g.addColorStop(1, '#062337'); ctx.fillStyle = g; ctx.fillRect(0, 0, 1196, by + 20);
      SS.bopSimple(ctx, bx, by + 20, 1.2, { riser: true, topY: 0 });
      // lines
      const choke = [[bx + 60, by - 60], [bx + 120, by - 60], [bx + 120, 120], [700, 120], [700, 200]];
      const kill = [[bx - 60, by - 60], [bx - 120, by - 60], [bx - 120, 90], [560, 90], [560, 200]];
      K.partialPolyline(ctx, choke, 1, C.amber, 8); K.partialPolyline(ctx, kill, 1, C.cyan, 8);
      K.flow(ctx, choke, t, { spacing: 30, speed: 80, color: C.gas, r: 4 });
      // manifold
      fillRR(ctx, 520, 200, 560, 260, 16, '#13283a', C.panelEdge, 2);
      text(ctx, 'CHOKE MANIFOLD', 800, 240, { size: 22, weight: 900, align: 'center', color: C.amber });
      for (let i = 0; i < 3; i++) { fillRR(ctx, 600 + i * 160, 290, 70, 70, 10, i === 1 ? C.amber : '#56687a'); text(ctx, i === 1 ? 'choke' : 'valve', 635 + i * 160, 390, { size: 18, weight: 700, align: 'center', color: C.dim }); }
      line(ctx, 1080, 330, 1150, 330, '#56687a', 8);
      fillRR(ctx, 1100, 360, 70, 140, 10, '#3d5266', '#56687a', 2);
      text(ctx, 'MGS', 1135, 440, { size: 18, weight: 900, align: 'center', color: C.text });
      tag(ctx, 'CHOKE LINE', bx + 260, 420, { size: 20, color: C.amber });
      tag(ctx, 'KILL LINE', bx - 120, 560, { size: 20, color: C.cyan, fill: 'rgba(7,17,28,0.9)' });
    }
    if (bi === 3) {
      fillRR(ctx, 120, 80, 960, 780, 16, '#f4f1ea', '#c9c2b0', 2);
      text(ctx, 'KILL SHEET', 600, 140, { size: 36, weight: 900, align: 'center', color: '#222' });
      const rows = [['TVD / MD', '3,000 m / 3,250 m'], ['Mud weight', '1.40 SG'], ['SCR pump 1 @ 30 spm', '28 bar'], ['SCR pump 1 @ 40 spm', '45 bar'], ['String volume', '27.6 m³ = 2,300 stk'], ['Annulus volume', '96 m³ = 8,000 stk'], ['SIDPP / SICP', '25 / 38 bar'], ['Kill mud weight', '1.49 SG'], ['Initial circ. pressure', '53 bar']];
      rows.forEach(([k, v], i) => {
        const vv = S.p(3, 0.3, 0.6 + i * 0.6);
        const hl = k.startsWith('SCR');
        text(ctx, k, 170, 210 + i * 66, { size: 26, weight: 700, color: hl ? '#b45309' : '#444', alpha: vv });
        text(ctx, v, 1030, 210 + i * 66, { size: 28, weight: 800, align: 'right', color: hl ? '#b45309' : '#111', alpha: vv, fam: K.MONO });
        line(ctx, 170, 228 + i * 66, 1030, 228 + i * 66, rgba('#000', 0.1), 1);
      });
    }
    if (bi === 4) {
      ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, 1196, 110);
      WL.drawWell(ctx, KW, { t, string: null });
      const p = S.p(4, 6, 0.5);
      influx(ctx, 300, 870, lerp(500, 870, p), t, { n: 14, speed: -0.2 });
      for (let k = 0; k < 4; k++) arrow(ctx, 300 + (k - 1.5) * 18, 140, 300 + (k - 1.5) * 18, 280, { color: C.cyan, lw: 4, head: 12, alpha: 0.8 });
      for (let k = 0; k < 5; k++) { const ph = (t * 0.5 + k / 5) % 1; circle(ctx, lerp(262, 150, ph), 850 + (k % 3) * 10, 5, C.gas); }
      tag(ctx, 'pump down: influx pushed back into formation', 800, 300, { size: 22, color: C.cyan, fill: 'rgba(7,17,28,0.92)' });
    }
    if (bi === 5) {
      ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, 1196, 110);
      WL.drawWell(ctx, KW, { t, string: { to: 500, from: 0 } });
      const ph = clamp(S.since(5) / 10);
      const gy = lerp(860, 300, ph);
      ctx.beginPath(); ctx.ellipse(300, gy, 30, 40 + ph * 20, 0, 0, Math.PI * 2); ctx.fillStyle = C.gas; ctx.fill();
      tag(ctx, 'gas migrates up', 480, gy, { size: 20, color: C.gas, fill: 'rgba(7,17,28,0.9)', align: 'left' });
      const steps = Math.floor(ph * 6);
      gauge(ctx, 900, 260, 100, 30 + ph * 40 - steps * 5, { min: 0, max: 100, unit: 'bar', label: 'CASING PRESSURE', color: C.amber });
      fillRR(ctx, 760, 460, 380, 220, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, `bleed steps: ${steps}`, 950, 520, { size: 26, weight: 900, align: 'center', color: C.text });
      text(ctx, 'bleed mud to keep BHP', 950, 570, { size: 22, weight: 700, align: 'center', color: C.dim });
      text(ctx, 'within a safe band', 950, 604, { size: 22, weight: 700, align: 'center', color: C.dim });
    }
  },
};

// ------------------------------------------------------------ drills and certification
const drillScene = {
  id: 'drills',
  title: 'Being ready: drills and certificates',
  blurb: 'Well control is trained until it is automatic.',
  beats: [
    {
      term: 'Well control drills', no: 'brønnkontrolløvelser',
      def: 'Regular, often unannounced exercises: pit drill (simulated gain while drilling), trip drill (kick while tripping), choke drill, and others. Response time to a secure shut-in is timed and logged.',
      ex: 'Trip drill: well secured in 58 seconds.',
      say: 'Crews practise with drills, often unannounced. In a pit drill, a gain is simulated while drilling. In a trip drill, it happens during a trip. The time to a secure shut in is recorded every time.',
    },
    {
      term: 'Well control certificate', abbr: 'IWCF | IADC', no: 'brønnkontrollsertifikat',
      def: 'Drilling crews, supervisors and engineers working on the NCS hold well control certification from IWCF (International Well Control Forum) or IADC WellSharp, at a level matching their role, renewed every two years.',
      ex: 'Is your IWCF level 4 still valid?',
      say: 'People who work in drilling must hold a well control certificate, from IWCF, the International Well Control Forum, or IADC. The level depends on your role, and it is renewed every two years.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const el = Math.min(58, S.since(0) * 6);
      fillRR(ctx, 200, 140, 800, 300, 24, 'rgba(7,17,28,0.92)', el >= 58 ? C.green : C.red, 4);
      text(ctx, el >= 58 ? 'WELL SECURED' : '⚠ TRIP DRILL', 600, 230, { size: 40, weight: 900, align: 'center', color: el >= 58 ? C.green : C.red });
      text(ctx, `00:${String(Math.floor(el)).padStart(2, '0')}`, 600, 360, { size: 96, weight: 900, align: 'center', color: C.text, fam: K.MONO });
      const crew = [['Driller', C.orange], ['AD', C.orange], ['Derrickman', C.orange], ['Roughneck', C.orange]];
      crew.forEach(([n, col], i) => I.person(ctx, 270 + i * 220, 620, 120, { shirt: col, label: n }));
    }
    if (bi === 1) {
      fillRR(ctx, 220, 160, 760, 520, 20, '#f4f1ea', '#b8860b', 8);
      text(ctx, 'WELL CONTROL CERTIFICATE', 600, 250, { size: 34, weight: 900, align: 'center', color: '#222' });
      text(ctx, 'Drilling Well Control · Level 4 (Supervisor)', 600, 310, { size: 24, weight: 700, align: 'center', color: '#444' });
      text(ctx, 'valid 2 years', 600, 380, { size: 26, weight: 800, align: 'center', color: '#b45309' });
      I.stamp(ctx, 760, 560, 110, 'IWCF', C.blue, -0.2, S.p(1, 0.4, 1.5));
      const levels = ['Level 2: introductory', 'Level 3: driller', 'Level 4: supervisor'];
      levels.forEach((l, i) => text(ctx, l, 280, 470 + i * 50, { size: 24, weight: 700, color: '#333', alpha: S.p(1, 0.4, 2.5 + i * 0.6) }));
    }
  },
};

module.exports = {
  id: 'ch13', num: 13, title: 'Well Control',
  subtitle: 'Kicks, shut-in and the kill',
  topics: ['Kick', 'Blowout', 'Warning signs', 'Pit gain', 'Shut in', 'SIDPP', 'SICP', 'Kill mud weight', 'Driller’s method', 'Wait & weight', 'Choke manifold', 'Kill sheet', 'SCR', 'Bullheading', 'Volumetric', 'Drills', 'IWCF'],
  intro: 'Chapter thirteen: well control. This is the most important safety topic in drilling. Learn these words well. You will be drilled on them, literally.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0d1f2f'; ctx.fillRect(0, 0, 700, 900);
    uTube(ctx, 200, 280, t, { dp: 25, csg: 38, influxH: 120 });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [kickScene, shutScene, killScene, drillScene],
};
