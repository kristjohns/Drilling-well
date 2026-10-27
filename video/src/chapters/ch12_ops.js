'use strict';
const K = require('../engine/core');
const F = require('../art/floor');
const ST = require('../art/string');
const I = require('../art/icons');
const WL = require('../art/well');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, dimLine } = K;

// scrolling strip chart
function strip(ctx, x, y, w, h, fn, t, opt = {}) {
  const { col = C.cyan, label = '', unit = '', min = 0, max = 1, hl = 0, value } = opt;
  fillRR(ctx, x, y, w, h, 10, '#0b1a28', hl > 0 ? rgba(C.amber, 0.4 + 0.6 * hl) : C.panelEdge, hl > 0 ? 3 : 1.5);
  ctx.save(); ctx.beginPath(); ctx.rect(x + 2, y + 2, w - 4, h - 4); ctx.clip();
  ctx.beginPath();
  for (let i = 0; i <= w; i += 3) {
    const tt = t - (w - i) * 0.02;
    const v = fn(tt);
    const yy = y + h - 8 - ((v - min) / (max - min)) * (h - 16);
    i ? ctx.lineTo(x + i, yy) : ctx.moveTo(x, yy);
  }
  ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
  text(ctx, label, x + 12, y + 24, { size: 18, weight: 800, color: col });
  const v = value != null ? value : fn(t);
  text(ctx, `${v.toFixed(v < 10 ? 1 : 0)} ${unit}`, x + w - 12, y + 24, { size: 18, weight: 800, align: 'right', color: C.text, fam: K.MONO });
}
function rockBit(ctx, t, x, y, opt = {}) {
  // bit drilling into rock (side view), with cuttings
  K.lithoFill(ctx, 'rock3', x - 200, y, 400, 520, 3);
  ctx.fillStyle = '#5e4128'; ctx.fillRect(x - 70, y, 140, opt.depth || 300);
  ST.metal(ctx, x - 20, y - 400, 40, (opt.depth || 300) + 400 - 90, '#97a8b8');
  ST.pdcSide(ctx, x, y + (opt.depth || 300) - 46, 1.3, t * (opt.rpm || 6));
  for (let k = 0; k < 16; k++) { const ph = (t * 0.6 + k / 16) % 1; circle(ctx, x + (k % 2 ? 50 : -50) + Math.sin(k) * 6, y + (opt.depth || 300) - 40 - ph * 320, 3, '#e8dcc0'); }
}

// ------------------------------------------------------------ drilling parameters
const paramScene = {
  id: 'params',
  title: 'Drilling parameters',
  blurb: 'The numbers the driller juggles every minute.',
  beats: [
    {
      term: 'Weight on bit', abbr: 'WOB', no: 'vekt på borekronen',
      def: 'The downward force on the bit, applied by slacking off part of the BHA weight. Read as the drop in hook load from the off-bottom weight. Given in tonnes, kN or klbs.',
      ex: 'Run 12 tonnes WOB and 140 RPM.',
      say: 'Weight on bit, WOB, is the downward force on the bit. The driller lowers the string so part of the BHA weight rests on the bit, and reads it as the drop in hook load.',
    },
    {
      term: 'RPM & torque', abbr: 'RPM | kNm', no: 'omdreininger / dreiemoment',
      def: 'Rotary speed of the string (e.g. 120–180 RPM) and the torque the top drive needs to turn it, in kNm. Erratic torque can signal stick-slip, a damaged bit or tight hole.',
      say: 'RPM is how fast the string turns, and torque is how hard the top drive must twist to turn it. Erratic torque can warn of vibration, a damaged bit or tight hole.',
    },
    {
      term: 'Rate of penetration', abbr: 'ROP', no: 'borehastighet',
      def: 'How fast the hole is deepened, in metres per hour. A key performance measure, limited by the rock, the bit, hole cleaning and the parameters.',
      ex: 'Averaging 35 metres an hour in the claystone.',
      say: 'Rate of penetration, ROP, is how fast the hole gets deeper, in metres per hour. It depends on the rock, the bit, the parameters and how well the hole is cleaned.',
    },
    {
      term: 'Drilling break', no: 'borebrudd',
      def: 'A sudden increase in ROP. It can mean a softer or more porous formation, or higher pore pressure, so it is often followed by a flow check.',
      ex: 'Drilling break at 2,456, flow check, well static.',
      say: 'A drilling break is a sudden jump in ROP. It can mean a softer, porous formation, or an increase in pore pressure, so the driller often stops and does a flow check.',
    },
    {
      term: 'Mechanical specific energy', abbr: 'MSE',
      def: 'The energy used to remove a unit volume of rock, calculated from WOB, torque, RPM, ROP and hole size. A rising MSE shows that energy is being wasted, e.g. in vibration or a dull bit.',
      say: 'Mechanical specific energy, MSE, is the energy used to drill away a unit of rock. If it climbs while the rock stays the same, energy is being wasted in vibration or a worn bit.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    rockBit(ctx, t, 230, 380, { depth: 360 + (S.t * 3) % 40, rpm: 6 });
    const wob = (tt) => 12 + Math.sin(tt * 1.3) * 0.8;
    const rpm = (tt) => 140 + Math.sin(tt * 0.9) * 3;
    const tq = (tt) => 22 + Math.sin(tt * 2.1) * 1.5 + Math.sin(tt * 5) * 0.7;
    const brk = bi === 3 ? S.since(3) : -1;
    const rop = (tt) => 30 + Math.sin(tt * 0.7) * 3 + (bi === 3 && tt > S.t - (S.since(3) - 2) && brk > 2 ? 35 : 0);
    const mse = (tt) => 90 + Math.sin(tt * 0.5) * 6 + (bi === 4 ? Math.max(0, (tt - (S.t - S.since(4)) - 2) * 18) : 0);
    const rows = [['WOB', wob, 't', 0, 25, C.amber, [0]], ['RPM', rpm, 'rpm', 0, 200, C.cyan, [1]], ['TORQUE', tq, 'kNm', 0, 40, C.cyan, [1]], ['ROP', rop, 'm/h', 0, 80, C.green, [2, 3]], ['MSE', mse, 'MPa', 0, 250, C.purple, [4]]];
    rows.forEach(([n, fn, u, mn, mx, col, hlb], i) => strip(ctx, 500, 70 + i * 165, 660, 145, fn, t, { col, label: n, unit: u, min: mn, max: mx, hl: hlb.includes(bi) ? S.hl(bi) : 0 }));
    if (bi === 0) {
      arrow(ctx, 230, 120, 230, 220, { color: C.amber, lw: 8, head: 22 });
      text(ctx, 'slack off', 250, 170, { size: 22, weight: 800, color: C.amber });
    }
    if (bi === 3 && S.since(3) > 3) tag(ctx, 'DRILLING BREAK → flow check', 830, 640, { size: 22, color: C.red, fill: 'rgba(7,17,28,0.9)' });
    if (bi === 4 && S.since(4) > 4) tag(ctx, 'MSE rising: wasted energy', 830, 860, { size: 22, color: C.purple, fill: 'rgba(7,17,28,0.9)' });
  },
};

// ------------------------------------------------------------ connections & trips
function floorCam(ctx, cx, cy, z, st) {
  const cam = F.makeCam(cx, cy, z);
  ctx.save(); cam.apply(ctx); const A = F.drawFloor(ctx, st); ctx.restore();
  const P = {}; for (const k of Object.keys(A)) P[k] = cam.pt(A[k]); return P;
}
const tripScene = {
  id: 'trips',
  title: 'Connections and tripping',
  blurb: 'Adding pipe, pulling pipe, and watching the well while you do it.',
  beats: [
    {
      term: 'Making a connection', no: 'skjøte / koble',
      def: 'Adding a stand to the string when the top drive reaches the floor: pick up off bottom, set slips, break out, pick up a new stand, make up, pull slips, resume drilling. Connection time is a key performance measure.',
      ex: 'Connections are averaging four minutes slip to slip.',
      say: 'When the top drive reaches the floor, the crew makes a connection: pick up off bottom, set the slips, break out, pick up a new stand, make it up, pull the slips, and drill on. Connection time is measured, slip to slip.',
    },
    {
      term: 'Tripping: RIH & POOH', abbr: 'RIH | POOH', no: 'trippe inn / trippe ut',
      def: 'Running the string into the hole (RIH) or pulling it out (POOH), stand by stand, e.g. to change the bit or BHA. In and out again is a round trip. Speed is limited by surge and swab.',
      ex: 'We’re POOH to change the BHA, then RIH to bottom.',
      say: 'Tripping means running the string into the hole, RIH, or pulling out of the hole, POOH, stand by stand. Out and back in again is a round trip, for example to change the bit.',
      tts: 'Tripping means running the string into the hole, RIH, or pulling out of the hole, POOH, stand by stand. Out and back in again is a round trip, for example to change the bit.',
    },
    {
      term: 'Flow check', no: 'strømningssjekk',
      def: 'Stopping the pumps and watching the well, usually via the trip tank, for 10–30 minutes to confirm it is not flowing. Done before tripping, after drilling breaks, and whenever in doubt.',
      ex: 'Flow check before pulling into the shoe: well static.',
      say: 'A flow check means stopping the pumps and watching the well, usually on the trip tank, for a set time, to confirm it is not flowing. If in doubt, flow check.',
    },
    {
      term: 'Hole fill & trip sheet', no: 'hullfylling / trippskjema',
      def: 'When pipe is pulled, mud must replace the steel volume removed. The trip sheet compares the expected fill with the actual volume taken from the trip tank. Taking too little can mean an influx.',
      say: 'When pipe comes out, mud must replace the volume of steel removed. The trip sheet compares the expected hole fill with what the trip tank actually delivers. If the hole takes too little, the well may be swabbing in fluid.',
    },
    {
      term: 'Pumping out & backreaming', no: 'pumpe ut / rømme bakover',
      def: 'Pulling out with the pumps on (pumping out) or with pumps and rotation (backreaming), used where the hole is tight or poorly cleaned, or to avoid swabbing.',
      say: 'Pumping out means pulling out with the pumps running. Backreaming adds rotation as well. Both are used where the hole is tight or not clean.',
    },
    {
      term: 'Wiper trip & reaming', no: 'wipertur / rømming',
      def: 'A wiper (short) trip pulls up a few stands and runs back down to clean and condition the hole. Reaming is rotating and pumping down through a tight section.',
      ex: 'Do a wiper trip to the shoe before running casing.',
      say: 'A wiper trip, or short trip, pulls a few stands and runs back down, to clean the hole and check for tight spots. Reaming is rotating and pumping down through a tight section.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const steps = ['pick up off bottom', 'set slips', 'break out', 'pick up new stand', 'make up', 'pull slips', 'drill on'];
      const u = (S.since(0) / Math.max(6, S.bd - 1)) * 7;
      const k = Math.min(6, Math.floor(u));
      const f = u - k;
      const block = [lerp(0.92, 0.82, f), 0.82, 0.82, lerp(0.82, 0.05, f), 0.05, 0.05, lerp(0.05, 0.4, f)][k];
      const slips = [0, f, 1, 1, 1, 1 - f, 0][k];
      const ironR = [0, 0, 1, 0, 1, 0, 0][k];
      floorCam(ctx, 700, 400, 1.15, { t, block, slips, ironR, ironSpin: k === 2 || k === 4, stands: 8, spin: k === 6 ? 1 : 0 });
      fillRR(ctx, 40, 600, 380, 300, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      steps.forEach((s2, i) => text(ctx, `${i + 1}. ${s2}`, 60, 640 + i * 38, { size: 22, weight: i === k ? 900 : 600, color: i === k ? C.amber : i < k ? C.dim : C.faint }));
    }
    if (bi === 1) {
      const ph = (S.since(1) * 0.25) % 1;
      const out = Math.floor(S.since(1) / 8) % 2 === 0;
      const block = out ? lerp(0.9, 0.05, ph) : lerp(0.05, 0.9, ph);
      floorCam(ctx, 700, 400, 1.15, { t, block, slips: 0, stands: 8 + Math.floor((S.since(1) * 0.25)) % 5 });
      tag(ctx, out ? 'POOH ↑ pulling out of hole' : 'RIH ↓ running in hole', 300, 140, { size: 28, color: out ? C.cyan : C.amber, fill: 'rgba(7,17,28,0.92)' });
      text(ctx, '~20 stands per hour', 300, 200, { size: 22, weight: 700, align: 'center', color: C.dim });
    }
    if (bi === 2 || bi === 3) {
      const W = { cx: 300, seabed: 120, td: 900, layers: [{ to: 400, kind: 'clay' }, { to: 650, kind: 'rock2' }, { to: 940, kind: 'shale' }], strings: [{ hw: 50, holeHw: 62, top: 120, shoe: 500, toc: 300 }], hole: { hw: 34, to: 900 } };
      ctx.fillStyle = '#0d2236'; ctx.fillRect(0, 0, 1196, 120);
      const pulled = bi === 3 ? S.p(3, 8, 0.5, ease.linear) : 0;
      WL.drawWell(ctx, W, { t, string: { to: lerp(880, 400, pulled), from: 0 } });
      // trip tank
      fillRR(ctx, 640, 160, 120, 420, 10, '#22384b', '#56687a', 3);
      const lvl = bi === 2 ? 0.6 + 0.004 * Math.sin(t * 3) : 0.8 - 0.5 * pulled;
      ctx.fillStyle = C.mud; ctx.fillRect(644, 576 - 412 * lvl, 112, 412 * lvl);
      text(ctx, 'TRIP TANK', 700, 610, { size: 20, weight: 800, align: 'center', color: C.dim });
      if (bi === 2) {
        I.clock(ctx, 950, 300, 140, S.since(2) * 0.6);
        text(ctx, 'pumps OFF · watch the well', 950, 430, { size: 24, weight: 800, align: 'center', color: C.text });
        tag(ctx, S.since(2) > 5 ? '✓ WELL STATIC' : 'observing…', 950, 500, { size: 26, color: S.since(2) > 5 ? C.green : C.amber, fill: 'rgba(7,17,28,0.9)' });
      } else {
        fillRR(ctx, 810, 160, 360, 420, 14, '#f4f1ea', '#c9c2b0', 2);
        text(ctx, 'TRIP SHEET', 990, 205, { size: 24, weight: 900, align: 'center', color: '#222' });
        text(ctx, 'stands  calc  actual', 830, 250, { size: 18, weight: 800, color: '#555', fam: K.MONO });
        const n = Math.floor(pulled * 8);
        for (let i = 0; i < n; i++) {
          const calc = (0.24 * (i + 1)).toFixed(2), act = (0.24 * (i + 1) - (i > 5 ? 0.15 : 0.01)).toFixed(2);
          text(ctx, `${String((i + 1) * 5).padStart(4)}   ${calc}   ${act}`, 830, 290 + i * 34, { size: 18, weight: 700, color: i > 5 ? C.red : '#222', fam: K.MONO });
        }
        if (n > 6) tag(ctx, 'hole taking too little → flow check!', 990, 640, { size: 20, color: C.red, fill: 'rgba(7,17,28,0.9)' });
      }
    }
    if (bi === 4 || bi === 5) {
      K.lithoFill(ctx, 'rock3', 0, 0, 1196, 940, 2);
      ctx.fillStyle = '#5e4128'; ctx.fillRect(500, 0, 200, 940);
      // tight spot
      ctx.fillStyle = K.mix(C.rock3, '#5e4128', 0.3); ctx.fillRect(500, 420, 30, 120); ctx.fillRect(670, 420, 30, 120);
      let y;
      if (bi === 4) y = lerp(880, 200, (S.since(4) * 0.08) % 1);
      else { const ph = (S.since(5) * 0.1) % 1; y = ph < 0.5 ? lerp(880, 300, ph * 2) : lerp(300, 880, (ph - 0.5) * 2); }
      ST.metal(ctx, 585, 0, 30, y - 40, '#97a8b8');
      ST.pdcSide(ctx, 600, y, 1.1, t * 6);
      if (bi === 4) {
        K.flow(ctx, [[600, 0], [600, y - 40]], t, { spacing: 30, speed: 80, color: '#f0c891', r: 4 });
        K.flow(ctx, [[530, y], [530, 0]], t, { spacing: 30, speed: 80, color: C.mudLight, r: 4 });
        K.flow(ctx, [[670, y], [670, 0]], t, { spacing: 30, speed: 80, color: C.mudLight, r: 4 });
        const back = Math.floor(S.since(4) / 5) % 2 === 1;
        tag(ctx, back ? 'BACKREAMING: pump + rotate + pull' : 'PUMPING OUT: pump + pull', 880, 160, { size: 22, color: C.amber, fill: 'rgba(7,17,28,0.92)' });
        arrow(ctx, 760, 520, 760, 380, { color: C.cyan, lw: 6 });
      } else {
        tag(ctx, 'WIPER TRIP: up a few stands, back to bottom', 880, 160, { size: 20, color: C.amber, fill: 'rgba(7,17,28,0.92)' });
        tag(ctx, 'tight spot', 300, 480, { size: 20, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      }
    }
  },
};

// ------------------------------------------------------------ hook loads, T&D, hole cleaning
const tdScene = {
  id: 'hookloads',
  title: 'Hook loads, torque and drag, and hole cleaning',
  blurb: 'Reading the hole through the weight indicator.',
  beats: [
    {
      term: 'Pick-up, slack-off & rotating weights', abbr: 'PU | SO | ROT', no: 'løftevekt / slakkvekt',
      def: 'String weight measured while moving up (pick-up, highest, as friction adds), moving down (slack-off, lowest) and rotating off bottom (in between). Trended at every connection to monitor hole condition.',
      ex: 'PU 185, SO 150, ROT 166 tonnes.',
      say: 'At every connection the driller records three weights: pick up, moving up, the highest because friction adds to the weight; slack off, moving down, the lowest; and rotating off bottom, in between. The trend tells you how the hole is behaving.',
    },
    {
      term: 'Overpull & drag', no: 'overtrekk / friksjon',
      def: 'Drag is the friction between string and hole. Overpull is pull above the normal pick-up weight, a sign of tight hole, cuttings beds, swelling shale or the start of stuck pipe.',
      ex: '25 tonnes overpull at 2,150, work the pipe, don’t pull harder.',
      say: 'Drag is friction between the string and the hole. Overpull is any pull above the normal pick up weight. It is a warning: tight hole, cuttings, or the first sign of stuck pipe.',
    },
    {
      term: 'Torque & drag model', abbr: 'T&D',
      def: 'Software predictions of hook loads and torque along the well for different friction factors, plotted against depth (the broomstick plot). Actual readings are compared with the model to spot problems early.',
      say: 'A torque and drag model predicts the hook loads and torque for different friction factors. Plotted against depth it looks like a broomstick, and actual readings are compared with it to spot problems early.',
    },
    {
      term: 'Hole cleaning & cuttings beds', no: 'hullrensk / kaksbed',
      def: 'Getting the cuttings out of the hole. In deviated wells cuttings settle on the low side as beds, so flow rate, string rotation, sweeps and circulating before trips are used to clean the hole.',
      ex: 'Circulate three bottoms up at full rate with 120 RPM to clean the hole.',
      say: 'Hole cleaning is about getting cuttings out. In a deviated well, cuttings settle on the low side and form beds. High flow rate, string rotation and sweeps keep them moving.',
    },
    {
      term: 'Tight hole', no: 'trangt hull',
      def: 'A section where the string drags or hangs up because the hole is undergauge: swelling clay, cuttings, ledges or doglegs. Usually worked through with reaming, and watched carefully.',
      say: 'Tight hole is where the string drags or hangs up, because the hole has become narrower: swelling clay, cuttings, ledges or doglegs. It is reamed through carefully.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 2) {
      const gx = 130, gy = 120, gw = 640, gh = 720;
      fillRR(ctx, gx - 80, gy - 60, gw + 120, gh + 120, 16, 'rgba(7,17,28,0.8)', C.panelEdge, 2);
      text(ctx, 'hook load (t) →', gx + gw / 2, gy - 24, { size: 18, weight: 700, align: 'center', color: C.dim });
      text(ctx, 'depth ↓', gx - 40, gy + 10, { size: 18, weight: 700, align: 'right', color: C.dim });
      const X = (v) => gx + ((v - 80) / 140) * gw, Y = (d) => gy + (d / 3000) * gh;
      for (let v = 80; v <= 220; v += 20) text(ctx, String(v), X(v), gy + gh + 28, { size: 15, weight: 600, align: 'center', color: C.dim, fam: K.MONO });
      const pu = (d, ff) => 100 + d * 0.028 * (1 + ff), so = (d, ff) => 100 + d * 0.028 * (1 - ff), rot = (d) => 100 + d * 0.028;
      const curves = bi === 2 ? [0.15, 0.25, 0.35] : [0.25];
      curves.forEach((ff, i) => {
        const a = bi === 2 ? S.p(2, 0.8, 0.5 + i * 0.6) : S.p(0, 1.5, 0.5);
        const cc = (fn, col) => { const pts = []; for (let d = 0; d <= 3000 * a; d += 50) pts.push([X(fn(d, ff)), Y(d)]); K.partialPolyline(ctx, pts, 1, col, bi === 2 ? 2.5 : 4); };
        cc(pu, C.amber); cc(so, C.cyan);
      });
      const r = []; for (let d = 0; d <= 3000 * S.p(0, 1.5, 0.5); d += 50) r.push([X(rot(d)), Y(d)]); K.partialPolyline(ctx, r, 1, C.green, 4);
      // actual points
      const n = Math.floor(S.p(bi, 4, 1) * 14);
      for (let i = 0; i < n; i++) {
        const d = 600 + i * 170;
        const over = bi === 1 && d > 2000 ? (d - 2000) * 0.025 : 0;
        circle(ctx, X(pu(d, 0.25) + over), Y(d), 6, bi === 1 && over > 5 ? C.red : C.amber);
        circle(ctx, X(so(d, 0.25)), Y(d), 6, C.cyan);
      }
      [['PU (pick-up)', C.amber], ['ROT (rotating)', C.green], ['SO (slack-off)', C.cyan]].forEach(([n2, col], i) => { line(ctx, 830, 200 + i * 44, 870, 200 + i * 44, col, 5); text(ctx, n2, 884, 207 + i * 44, { size: 22, weight: 700, color: C.text }); });
      if (bi === 1 && n > 9) tag(ctx, 'OVERPULL', X(pu(2700, 0.25) + 18) + 60, Y(2700), { size: 24, color: C.red, fill: 'rgba(7,17,28,0.9)' });
      if (bi === 2) tag(ctx, 'friction factors 0.15 · 0.25 · 0.35', 980, 420, { size: 20, color: C.text, alpha: S.p(2, 0.6, 2.5) });
    }
    if (bi === 3) {
      // deviated hole cross-section with cuttings bed
      K.lithoFill(ctx, 'rock3', 0, 0, 1196, 940, 4);
      ctx.save(); ctx.translate(598, 470); ctx.rotate(-0.35);
      ctx.fillStyle = '#5e4128'; ctx.fillRect(-700, -110, 1400, 220);
      ctx.fillStyle = '#c8b79a';
      const rot = S.since(3) > 5;
      const bedH = rot ? Math.max(10, 60 - (S.since(3) - 5) * 12) : 60;
      ctx.fillRect(-700, 110 - bedH, 1400, bedH);
      ST.metal(ctx, -700, 30, 1400, 40, '#97a8b8');
      for (let k = 0; k < 30; k++) { const ph = (t * (rot ? 0.5 : 0.15) + k / 30) % 1; circle(ctx, -700 + ph * 1400, rot ? -60 + Math.sin(k) * 40 : 100 - (k % 3) * 8, 4, '#e8dcc0'); }
      K.flow(ctx, [[-700, -60], [700, -60]], t, { spacing: 50, speed: 100, color: C.mudLight, r: 4 });
      ctx.restore();
      tag(ctx, rot ? 'rotation + flow stir up the bed' : 'cuttings bed on the low side', 598, 140, { size: 26, color: rot ? C.green : C.red, fill: 'rgba(7,17,28,0.9)' });
    }
    if (bi === 4) {
      K.lithoFill(ctx, 'rock3', 0, 0, 1196, 940, 4);
      ctx.fillStyle = '#5e4128'; ctx.fillRect(480, 0, 240, 940);
      // swelling clay zone
      const sw = 40 + 10 * Math.sin(t);
      K.lithoFill(ctx, 'clay', 480, 380, sw, 180, 2); K.lithoFill(ctx, 'clay', 720 - sw, 380, sw, 180, 3);
      const y = lerp(800, 330, clamp((S.since(4) * 0.12) % 1));
      ST.metal(ctx, 580, 0, 40, y - 60, '#97a8b8');
      fillRR(ctx, 560, y - 60, 80, 60, 8, '#97a8b8');
      ST.pdcSide(ctx, 600, y, 1.2, 0);
      tag(ctx, 'swelling clay: undergauge hole', 900, 470, { size: 22, color: C.amber, fill: 'rgba(7,17,28,0.9)' });
      const hang = y < 600 && y > 360;
      gauge(ctx, 220, 300, 100, hang ? 215 : 182, { min: 100, max: 260, unit: 't', label: 'HOOK LOAD', color: hang ? C.red : C.amber });
    }
  },
};

// ------------------------------------------------------------ milestones
const milestoneScene = {
  id: 'milestones',
  title: 'Section milestones',
  blurb: 'Drilling out, tagging, and calling TD.',
  beats: [
    {
      term: 'Drill out & rat hole', no: 'bore ut / rottehull',
      def: 'Drilling through the float collar, shoe track cement and shoe, then a few metres of new formation for the FIT or LOT. The rat hole is the short open hole left below a casing shoe (or below the logged interval).',
      ex: 'Drilled out the shoe and 3 m of new formation, performing FIT.',
      say: 'Each new section starts by drilling out: through the float collar, the cement and the shoe, and a few metres of new formation for the leak off test. The short open hole left below a shoe is called the rat hole.',
    },
    {
      term: 'Tag', no: 'tagge',
      def: 'To touch something with the bit or string to confirm its depth, seen as weight taken on the hook load: tag cement, tag bottom, tag the top of a fish.',
      ex: 'Tagged firm cement at 1,893 metres with 5 tonnes.',
      say: 'To tag something is to touch it with the string and see the weight drop on the hook load, confirming its depth. You tag cement, tag bottom, or tag the top of a fish.',
    },
    {
      term: 'Total depth & TD criteria', abbr: 'TD', no: 'totalt dyp',
      def: 'TD is the final depth of a section or the well. The TD criteria in the well programme say when to stop, e.g. a set distance into a formation or below the deepest target. The geologists help “call TD”.',
      ex: 'We called TD at 3,412 m MD, 50 m into the Dunlin.',
      say: 'TD, total depth, is the final depth of a section or the whole well. The well programme sets TD criteria, for example fifty metres into a certain formation, and the geologists help decide when to call TD.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 1) {
      K.lithoFill(ctx, 'clay', 0, 0, 1196, 600, 3); K.lithoFill(ctx, 'rock3', 0, 600, 1196, 340, 5);
      ctx.fillStyle = '#5e4128'; ctx.fillRect(500, 0, 200, 940);
      ctx.fillStyle = C.cement; ctx.fillRect(470, 0, 30, 600); ctx.fillRect(700, 0, 30, 600);
      ST.metal(ctx, 500, 0, 16, 600, '#b8c4cf'); ST.metal(ctx, 684, 0, 16, 600, '#b8c4cf');
      const p = bi === 0 ? S.p(0, 9, 0.5, ease.linear) : 0;
      const bitY = bi === 0 ? lerp(380, 690, p) : lerp(250, 418, S.p(1, 2.5, 0.5));
      // shoe track contents below bit
      const cementTop = 440;
      if (bitY < 600) { ctx.fillStyle = C.cement; ctx.fillRect(516, Math.max(cementTop, bitY), 168, 600 - Math.max(cementTop, bitY)); }
      if (bitY < 460) fillRR(ctx, 516, 440, 168, 20, 3, '#56687a');
      if (bitY < 600) { ctx.beginPath(); ctx.moveTo(500, 600); ctx.lineTo(700, 600); ctx.quadraticCurveTo(700, 620, 600, 624); ctx.quadraticCurveTo(500, 620, 500, 600); ctx.fillStyle = '#c9cfd6'; ctx.fill(); }
      ctx.fillStyle = '#5e4128'; ctx.fillRect(540, 600, 120, Math.max(0, bitY - 600));
      ST.metal(ctx, 585, 0, 30, bitY - 50, '#97a8b8');
      ST.pdcSide(ctx, 600, bitY, 0.95, bi === 0 ? t * 6 : 0);
      if (bi === 0) {
        const lab = bitY < 460 ? 'float collar' : bitY < 600 ? 'shoe track cement' : bitY < 630 ? 'shoe' : 'new formation: rat hole';
        tag(ctx, lab, 900, 300, { size: 26, color: C.amber, fill: 'rgba(7,17,28,0.9)' });
        if (bitY > 640) dimLine(ctx, 760, 624, 760, bitY, '≈ 3 m', { color: C.cyan, size: 22 });
      } else {
        const tagged = S.since(1) > 3;
        gauge(ctx, 950, 360, 110, tagged ? 170 : 175, { min: 100, max: 220, unit: 't', label: 'HOOK LOAD', color: tagged ? C.green : C.amber });
        tag(ctx, tagged ? 'TAGGED cement top: 5 t set down' : 'lowering…', 950, 560, { size: 22, color: tagged ? C.green : C.text, fill: 'rgba(7,17,28,0.9)' });
      }
    }
    if (bi === 2) {
      const d = Math.round(lerp(3290, 3412, S.p(2, 4, 0.5)));
      fillRR(ctx, 200, 200, 800, 300, 24, 'rgba(7,17,28,0.92)', d >= 3412 ? C.green : C.amber, 4);
      text(ctx, `${d.toLocaleString('en')} m MD`, 600, 380, { size: 96, weight: 900, align: 'center', color: d >= 3412 ? C.green : C.text, fam: K.MONO });
      if (d >= 3412) tag(ctx, 'TD! 50 m into the Dunlin Gp', 600, 580, { size: 32, color: C.green, fill: 'rgba(7,17,28,0.9)' });
      text(ctx, 'TD criteria from the well programme', 600, 700, { size: 24, weight: 700, align: 'center', color: C.dim, alpha: S.p(2, 0.6, 5) });
    }
  },
};

// ------------------------------------------------------------ reporting & performance
const reportScene = {
  id: 'reporting',
  title: 'Reports, time and money',
  blurb: 'How progress and cost are tracked.',
  beats: [
    {
      term: 'Daily drilling report', abbr: 'DDR', no: 'daglig borerapport',
      def: 'The official 24-hour report (00:00–24:00) of operations, depths, mud, BHA, HSE, personnel and costs, with a time breakdown. On the NCS, daily drilling data is also reported to the authorities.',
      ex: 'Check the DDR for how much time we lost on the top drive.',
      say: 'The daily drilling report, DDR, covers midnight to midnight: operations, depths, mud, BHA, safety, people and cost. It is the official record of the well, and the data is also reported to the authorities.',
    },
    {
      term: 'Morning meeting', no: 'morgenmøte',
      def: 'The daily call between the rig and the onshore team (drilling, geology, logistics, HSE) to review the last 24 hours and agree the plan for the next. The morning report summarises status at 06:00.',
      say: 'Every morning the rig and the onshore team meet on a video call: what happened in the last twenty four hours, what is planned for the next, and what support is needed.',
    },
    {
      term: 'Time-depth curve', no: 'tid-dybde-kurve',
      def: 'A plot of depth against days for the planned and actual well. Steep parts are drilling; flat parts are casing, cementing, logging, testing and any lost time.',
      ex: 'We’re two days ahead of the P50 curve.',
      say: 'The time depth curve plots depth against days, plan versus actual. Steep parts are drilling, flat parts are casing, logging and any lost time. Being ahead of the curve is good news.',
    },
    {
      term: 'NPT & ILT', abbr: 'NPT | ILT', no: 'ikke-produktiv tid',
      def: 'Non-productive time (NPT): time lost to unplanned events such as equipment failure, stuck pipe or losses (waiting on weather is often tracked separately). Invisible lost time (ILT): productive operations done slower than achievable.',
      say: 'Non productive time, NPT, is time lost to unplanned events, like equipment failures or stuck pipe. Invisible lost time, ILT, is when normal operations are simply slower than they could be.',
    },
    {
      term: 'AFE, day rate & spread rate', abbr: 'AFE', no: 'budsjett / dagrate',
      def: 'The AFE (authorisation for expenditure) is the approved well budget. The rig day rate is the contractor’s daily price; the spread rate is the total daily cost including services, boats, helicopters and people. Exploration wells on the NCS typically cost hundreds of millions of NOK.',
      ex: 'At this spread rate every hour of NPT costs about 350,000 kroner.',
      say: 'The AFE, authorisation for expenditure, is the approved budget for the well. The rig day rate is the price of the rig per day, and the spread rate is the total daily cost of the whole operation. That is why every hour counts.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      fillRR(ctx, 220, 80, 760, 800, 16, '#f4f1ea', '#c9c2b0', 2);
      text(ctx, 'DAILY DRILLING REPORT', 600, 140, { size: 32, weight: 900, align: 'center', color: '#222' });
      text(ctx, 'Well 7220/8-1  ·  Report #23  ·  00:00–24:00', 600, 180, { size: 20, weight: 700, align: 'center', color: '#555' });
      const rows = [['Depth', '2,456 → 2,780 m MD'], ['Hole size', '12¼"'], ['Mud weight', '1.38 SG OBM'], ['Operations', 'drilled 12¼ to 2,780 m'], ['HSE', '0 incidents · 2 SJAs'], ['POB', '112'], ['Daily cost', 'NOK 8.4 million']];
      rows.forEach(([k, v], i) => {
        const vv = S.p(0, 0.4, 0.8 + i * 0.6);
        text(ctx, k, 260, 260 + i * 70, { size: 26, weight: 700, color: '#444', alpha: vv });
        text(ctx, v, 940, 260 + i * 70, { size: 26, weight: 800, align: 'right', color: '#111', alpha: vv });
        line(ctx, 260, 280 + i * 70, 940, 280 + i * 70, rgba('#000', 0.1), 1);
      });
    }
    if (bi === 1) {
      const tiles = [['Rig', 'drilling supervisor', C.amber], ['Onshore D&W', 'drilling engineer', C.cyan], ['Geology', 'ops geologist', C.sand], ['Logistics', 'boats & cargo', C.green]];
      tiles.forEach(([n, r, col], i) => {
        const x = 150 + (i % 2) * 460, y = 140 + Math.floor(i / 2) * 360;
        const v = S.p(1, 0.5, 0.5 + i * 0.6, ease.outBack);
        if (v <= 0) return;
        ctx.save(); ctx.globalAlpha *= clamp(v);
        fillRR(ctx, x, y, 420, 300, 18, '#13283a', col, 3);
        I.person(ctx, x + 210, y + 140, 130, { shirt: col, helmetColor: '#fff' });
        text(ctx, n, x + 210, y + 260, { size: 26, weight: 900, align: 'center', color: C.text });
        text(ctx, r, x + 210, y + 290, { size: 18, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
      });
      I.clock(ctx, 1080, 120, 90, t * 0.1);
    }
    if (bi === 2) {
      const gx = 120, gy = 120, gw = 980, gh = 700;
      fillRR(ctx, gx - 70, gy - 50, gw + 110, gh + 110, 16, 'rgba(7,17,28,0.8)', C.panelEdge, 2);
      const X = (d) => gx + (d / 40) * gw, Y = (m) => gy + (m / 3500) * gh;
      for (let d = 0; d <= 40; d += 5) text(ctx, String(d), X(d), gy + gh + 30, { size: 15, weight: 600, align: 'center', color: C.dim });
      for (let m = 0; m <= 3500; m += 500) text(ctx, String(m), gx - 10, Y(m) + 5, { size: 15, weight: 600, align: 'right', color: C.dim, fam: K.MONO });
      text(ctx, 'days →', gx + gw - 20, gy + gh + 60, { size: 18, weight: 700, align: 'right', color: C.dim });
      const plan = [[0, 0], [1, 0], [2, 450], [4, 450], [7, 1300], [10, 1300], [15, 2500], [19, 2500], [24, 3400], [30, 3400], [36, 3400]];
      const act = [[0, 0], [1.5, 0], [2.5, 450], [4.2, 450], [7.5, 1300], [11, 1300], [13, 1900], [15.5, 1900], [18, 2500], [21, 2500], [25, 3400]];
      K.partialPolyline(ctx, plan.map(([d, m]) => [X(d), Y(m)]), S.p(2, 1.5, 0.3), rgba(C.cyan, 0.8), 4, [10, 8]);
      K.partialPolyline(ctx, act.map(([d, m]) => [X(d), Y(m)]), S.p(2, 3, 1.5), C.amber, 5);
      tag(ctx, 'plan (P50)', X(30), Y(3000), { size: 20, color: C.cyan });
      tag(ctx, 'actual', X(21), Y(2200), { size: 20, color: C.amber, alpha: S.p(2, 0.6, 3) });
      tag(ctx, 'flat = casing / logging / NPT', X(13.5), Y(1750), { size: 18, color: C.text, alpha: S.p(2, 0.6, 5), fill: 'rgba(7,17,28,0.9)' });
    }
    if (bi === 3) {
      const cx = 380, cy = 480, r = 230;
      const parts = [['productive', 0.80, C.green], ['NPT: equipment', 0.08, C.red], ['NPT: hole problems', 0.05, C.orange], ['WOW', 0.07, C.cyan]];
      let a0 = -Math.PI / 2;
      const g = S.p(3, 1.5, 0.3);
      parts.forEach(([n, f, col], i) => {
        const a1 = a0 + Math.PI * 2 * f * g;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, a0, a1); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = '#0a1825'; ctx.lineWidth = 3; ctx.stroke();
        a0 = a1;
        line(ctx, 700, 300 + i * 70, 740, 300 + i * 70, col, 10);
        text(ctx, `${n}  ${Math.round(f * 100)} %`, 760, 308 + i * 70, { size: 24, weight: 700, color: C.text, alpha: g });
      });
      fillRR(ctx, 680, 620, 470, 180, 16, 'rgba(7,17,28,0.92)', C.purple, 2);
      text(ctx, 'ILT: hidden inside “productive”', 915, 680, { size: 22, weight: 800, align: 'center', color: C.purple });
      text(ctx, 'slow connections, slow trips', 915, 720, { size: 20, weight: 600, align: 'center', color: C.dim });
    }
    if (bi === 4) {
      const g = S.p(4, 2, 0.5);
      fillRR(ctx, 120, 200, 960, 90, 14, '#13283a', C.panelEdge, 2);
      fillRR(ctx, 120, 200, 960 * 0.72 * g, 90, 14, C.green);
      text(ctx, `spent ${(310 * 0.72 * g).toFixed(0)} of 310 MNOK AFE`, 600, 258, { size: 30, weight: 900, align: 'center', color: '#0b1520' });
      const rows = [['Rig day rate', '≈ 4–5 MNOK / day'], ['Spread rate (all-in)', '≈ 7–10 MNOK / day'], ['1 hour of NPT', '≈ 0.3–0.4 MNOK']];
      rows.forEach(([k, v], i) => {
        const vv = S.p(4, 0.5, 2.5 + i * 1.2);
        fillRR(ctx, 160, 380 + i * 130, 880, 100, 14, rgba(C.amber, 0.08 * vv), rgba(C.amber, 0.5 * vv), 2);
        text(ctx, k, 200, 442 + i * 130, { size: 28, weight: 800, color: C.text, alpha: vv });
        text(ctx, v, 1000, 442 + i * 130, { size: 28, weight: 900, align: 'right', color: C.amber, alpha: vv });
      });
      text(ctx, 'illustrative orders of magnitude', 600, 860, { size: 18, weight: 600, align: 'center', color: C.faint });
    }
  },
};

module.exports = {
  id: 'ch12', num: 12, title: 'Daily Drilling Operations',
  subtitle: 'Parameters, connections, trips and the numbers in the morning report',
  topics: ['WOB', 'RPM', 'Torque', 'ROP', 'Drilling break', 'MSE', 'Connection', 'RIH / POOH', 'Flow check', 'Trip sheet', 'Backreaming', 'Wiper trip', 'PU / SO', 'Overpull', 'T&D', 'Hole cleaning', 'Tag', 'TD', 'DDR', 'NPT', 'AFE'],
  intro: 'Chapter twelve: daily drilling operations. This is the vocabulary of the morning meeting and the daily report, the words you will hear every single day.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0d1f2f'; ctx.fillRect(0, 0, 700, 900);
    strip(ctx, 40, 160, 580, 140, (tt) => 30 + Math.sin(tt) * 8, t, { col: C.green, label: 'ROP', unit: 'm/h', min: 0, max: 60 });
    strip(ctx, 40, 330, 580, 140, (tt) => 22 + Math.sin(tt * 2) * 3, t, { col: C.cyan, label: 'TORQUE', unit: 'kNm', min: 0, max: 40 });
    strip(ctx, 40, 500, 580, 140, (tt) => 12 + Math.sin(tt * 1.3), t, { col: C.amber, label: 'WOB', unit: 't', min: 0, max: 25 });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [paramScene, tripScene, tdScene, milestoneScene, reportScene],
};
