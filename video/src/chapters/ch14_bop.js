'use strict';
const K = require('../engine/core');
const WL = require('../art/well');
const SS = require('../art/subsea');
const R = require('../art/rig');
const I = require('../art/icons');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, darken, richLine } = K;

// sea background with drifting particles and a seabed
function seaBg(ctx, t, seabed = 870, top = 0) {
  const g = ctx.createLinearGradient(0, top, 0, seabed);
  g.addColorStop(0, '#0d3a57'); g.addColorStop(1, '#061c2c');
  ctx.fillStyle = g; ctx.fillRect(0, top, 1196, seabed - top);
  const Rn = K.rng(5);
  for (let k = 0; k < 40; k++) {
    const x = Rn() * 1196, y0 = Rn() * (seabed - top), sp = 6 + Rn() * 10, r = 1.4 + Rn() * 1.2;
    const yy = top + ((y0 + t * sp) % (seabed - top));
    circle(ctx, x + Math.sin(t * 0.5 + k) * 6, yy, r, rgba('#bfe6ff', 0.16));
  }
  if (seabed < 940) { K.lithoFill(ctx, 'clay', 0, seabed, 1196, 940 - seabed, 4); line(ctx, 0, seabed, 1196, seabed, '#8a7457', 3); }
}
// bullet box; items wrap; rv = number of items revealed (fractional fades in)
function infoBox(ctx, x, y, w, title, items, a = 1, opt = {}) {
  const { color = C.amber, rv = 99, size = 21 } = opt;
  if (a <= 0) return 0;
  ctx.save(); ctx.globalAlpha *= a;
  const lh = Math.round(size * 1.33);
  const wrapped = items.map((s) => K.wrap(ctx, s, w - 62, size, 500));
  const h = 66 + wrapped.reduce((n, l) => n + l.length * lh + 14, 0);
  fillRR(ctx, x, y, w, h, 14, 'rgba(7,17,28,0.92)', color, 2);
  text(ctx, title, x + 22, y + 40, { size: 19, weight: 900, color, spacing: 1.5 });
  let yy = y + 78;
  wrapped.forEach((ls, i) => {
    const ia = clamp(rv - i);
    if (ia > 0) {
      circle(ctx, x + 30, yy - size * 0.33, 4.5, rgba(color, ia));
      ls.forEach((l, j) => text(ctx, l, x + 46, yy + j * lh, { size, weight: 500, color: C.text, alpha: ia }));
    }
    yy += ls.length * lh + 14;
  });
  ctx.restore();
  return h;
}
function sideBracket(ctx, x, y1, y2, label, color, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  line(ctx, x, y1, x, y2, color, 3);
  line(ctx, x - 12, y1, x, y1, color, 3); line(ctx, x - 12, y2, x, y2, color, 3);
  ctx.translate(x + 12, (y1 + y2) / 2); ctx.rotate(Math.PI / 2);
  text(ctx, label, 0, 0, { size: 20, weight: 900, align: 'center', color, spacing: 2 });
  ctx.restore();
}
// small rig + riser + BOP inside a box; lift 0..1 disconnects the LMRP and moves the rig off
function miniRig(ctx, x, y, w, h, t, lift = 0) {
  ctx.save(); rr(ctx, x, y, w, h, 16); ctx.clip();
  const seaY = y + 150, sb = y + h - 50, cx = x + w / 2;
  ctx.fillStyle = '#0a1d2e'; ctx.fillRect(x, y, w, seaY - y);
  const g = ctx.createLinearGradient(0, seaY, 0, sb); g.addColorStop(0, '#0f4f75'); g.addColorStop(1, '#062337');
  ctx.fillStyle = g; ctx.fillRect(x, seaY, w, sb - seaY);
  K.lithoFill(ctx, 'clay', x, sb, w, y + h - sb, 2);
  const dx = 70 * ease.inOut(clamp((lift - 0.35) / 0.65));
  const lmrpY = sb - 64 - 50 * clamp(lift / 0.4);
  line(ctx, cx + dx, seaY + 30, cx + dx * 0.85, lmrpY, '#9fb0c1', 5);
  R.semi(ctx, cx + dx, seaY, 0.38, t, { heave: Math.sin(t * 0.8) * 1.5 });
  fillRR(ctx, cx - 21, sb - 40, 42, 38, 4, '#c0392b', '#7a1f17', 2);
  fillRR(ctx, cx + dx * 0.85 - 17, lmrpY, 34, 24, 4, '#d9534f', '#7a1f17', 2);
  ctx.fillStyle = C.blue; ctx.fillRect(cx + dx * 0.85 - 25, lmrpY + 4, 7, 16);
  ctx.fillStyle = C.yellow; ctx.fillRect(cx + dx * 0.85 + 18, lmrpY + 4, 7, 16);
  K.dimLine(ctx, x + 40, seaY + 6, x + 40, sb - 6, 'water depth', { color: C.cyan, size: 16, lw: 2 });
  ctx.restore();
}

// ------------------------------------------------------------ the BOP stack
const BOPX = 380, BOPY = 830, BOPS = 1.18;
const by = (v) => BOPY - BOPS * (900 - v);
const bopInfo = [
  ['BLOWOUT PREVENTER', ['Closes and seals the well in an emergency', 'Subsea on semis & drillships; surface BOP on jack-ups & platforms', '18¾ in bore · 10,000–15,000 psi', 'Two parts: LMRP + lower stack']],
  ['ANNULAR PREVENTER', ['Rubber element squeezed by a piston', 'Seals on almost any shape', 'Usually closed first on a kick', 'Pipe can be stripped through it']],
  ['PIPE RAMS & VBRs', ['Steel rams with half-moon cut-outs', 'Pipe ram: one pipe size', 'VBR: a range of sizes', 'Can hang off the drill string']],
  ['SHEAR RAMS', ['BSR: cuts the pipe and seals the well', 'CSR: cuts casing, does not seal', 'The last line of defence', 'Tool joints & collars: non-shearable']],
  ['LMRP', ['Annulars + control pods + riser connector', 'Unlatches and leaves with the riser', 'The rams stay on the well, sealed', 'Can be pulled alone for repairs']],
];
const bopScene = {
  id: 'bop',
  title: 'The BOP stack',
  blurb: 'The big emergency valve on top of the well.',
  beats: [
    {
      term: 'Blowout preventer', abbr: 'BOP', no: 'utblåsningssikring',
      def: 'A stack of large hydraulic valves on top of the wellhead that can close and seal the well in an emergency. On semis and drillships it sits on the seabed (subsea BOP); on jack-ups and platforms it sits under the drill floor (surface BOP).',
      ex: 'BOP is landed and latched, line up for the pressure test.',
      say: 'The BOP, the blowout preventer, is a stack of large hydraulic valves on top of the wellhead. It can close and seal the well in an emergency. On a semi or a drillship it sits on the seabed. On jack-ups and platforms it sits under the drill floor. A typical NCS stack has an eighteen and three quarter inch bore, is rated to ten or fifteen thousand psi, and weighs several hundred tonnes.',
    },
    {
      term: 'Annular preventer', no: 'ringromsventil («annularen»)',
      def: 'A large doughnut-shaped rubber packing element, reinforced with steel inserts, that a hydraulic piston squeezes inwards. It seals around almost any shape in the hole (drill pipe, casing, even a tool joint) and allows pipe to be stripped through it.',
      ex: 'Close the upper annular and record the pressures.',
      say: 'The annular preventer is a large rubber doughnut, reinforced with steel inserts. A hydraulic piston squeezes it inwards until it seals around whatever is in the hole: drill pipe, casing, even a tool joint. Because it is so flexible, it is usually the first thing closed on a kick, and pipe can be stripped through it. Most subsea stacks have two.',
    },
    {
      term: 'Pipe rams & variable bore rams', abbr: 'VBR',
      def: 'Pairs of steel rams that close from each side, with rubber-faced half-moon cut-outs that seal around the pipe body. A fixed pipe ram fits one pipe size; a variable bore ram (VBR) seals on a range of sizes. Rams can also carry the weight of the string (hang-off).',
      ex: 'Space out so the tool joint is clear of the rams.',
      say: 'Pipe rams are pairs of steel blocks that close in from each side. Their rubber faced, half moon cut outs seal around the body of the pipe. A fixed pipe ram fits one pipe size, while variable bore rams, VBRs, seal on a range of sizes. The rams can even carry the weight of the drill string, which is called hanging off. Spacing out makes sure a tool joint is not in the way.',
    },
    {
      term: 'Blind shear rams & casing shear rams', abbr: 'BSR | CSR',
      def: 'Rams with hardened blades. The blind shear ram (BSR) cuts the drill pipe and then seals the well: the last line of defence. The casing shear ram (CSR) cuts heavier tubulars like casing, but does not seal. Tool joints and drill collars cannot be sheared (“non-shearables”).',
      ex: 'Non-shearable across the BOP for the next 20 minutes.',
      say: 'Shear rams have hardened blades. The blind shear ram, the BSR, cuts through the drill pipe and then seals the well completely. It is the last line of defence. The casing shear ram cuts heavier pipe, like casing, but it does not seal. Tool joints, drill collars and some tools are too strong to cut. They are called non shearables, and the crew keeps track of when one is across the BOP.',
    },
    {
      term: 'Lower marine riser package', abbr: 'LMRP',
      def: 'The upper part of a subsea BOP: annulars, control pods, flex joint and riser connector. It can be unlatched from the lower stack so the rig can leave with the riser, while the rams stay on the well and keep it sealed. It can also be pulled on its own for repairs.',
      ex: 'We’ll pull the LMRP to change out the yellow pod.',
      say: 'The upper part of a subsea stack is the LMRP, the lower marine riser package. It holds the annulars, the control pods and the riser connector. It can be unlatched from the lower stack, so the rig can move away with the riser, while the rams stay on the well and keep it sealed. It can also be pulled on its own for repairs.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    seaBg(ctx, t, 870);
    const ann = bi === 1 ? S.p(1, 2.2, 1.6) : bi === 2 ? 1 - S.p(2, 0.8) : 0;
    const pr = bi === 2 ? S.p(2, 1.8, 2.2) : bi === 3 ? 1 - S.p(3, 0.8) : 0;
    const vbr = bi === 2 ? S.p(2, 1.8, 6.5) : bi === 3 ? 1 - S.p(3, 0.8) : 0;
    const bsr = bi === 3 ? S.p(3, 2.4, 2.5, ease.in) : bi === 4 ? 1 : 0;
    const lift = bi === 4 ? S.p(4, 3, 3) : 0;
    const hlName = ['', 'annular', 'pipe', 'bsr', 'lmrp'][bi];
    SS.bopStack(ctx, BOPX, BOPY, BOPS, { t, annular: ann, pipeRam: pr, vbr, bsr, lift, hl: new Set(hlName ? [hlName] : []), hlA: S.hl(bi) });
    if (bi === 0) K.highlightRect(ctx, 62, 80, 638, 808, t, { alpha: S.hl(0) * S.vis(0, 0.5, 0.8) });
    if (bi === 0 || bi === 4) {
      const lp = BOPS * 140 * lift;
      sideBracket(ctx, 718, by(274) - lp, by(530) - lp, 'LMRP', C.amber, bi === 0 ? S.vis(0, 0.5, 6) : S.vis(4, 0.5, 0.5));
      sideBracket(ctx, 718, by(530) + 4, BOPY + 46, 'LOWER STACK', C.cyan, bi === 0 ? S.vis(0, 0.5, 7) : S.vis(4, 0.5, 0.5));
    }
    // inset
    const ix = 770, iy = 24, iw = 406, ih = 400;
    fillRR(ctx, ix, iy, iw, ih, 16, 'rgba(7,17,28,0.94)', C.panelEdge, 2);
    let label = '', lcol = C.dim;
    if (bi === 0 || bi === 4) {
      miniRig(ctx, ix, iy, iw, ih, t, bi === 4 ? lift : 0);
      label = bi === 0 ? 'WHERE IT SITS' : lift > 0.4 ? 'RIG MOVES OFF WITH THE RISER' : 'LMRP UNLATCHES';
      if (bi === 0) callout(ctx, ix + iw / 2 + 21, iy + ih - 72, ix + iw - 20, iy + ih - 130, 'BOP', { color: C.amber, size: 20, t: S.p(0, 0.6, 2.5), maxX: ix + iw - 10 });
    } else {
      const cx = ix + iw / 2, cy = iy + 200;
      if (bi === 1) { SS.bopTop(ctx, cx, cy, 140, 'annular', ann); label = 'TOP VIEW · ANNULAR'; }
      if (bi === 2) {
        const v = S.since(2) > 6.2;
        SS.bopTop(ctx, cx, cy, 128, v ? 'vbr' : 'pipe', v ? vbr : pr, { vbrR: 26 });
        label = v ? 'TOP VIEW · VARIABLE BORE RAM' : 'TOP VIEW · PIPE RAM';
      }
      if (bi === 3) {
        SS.bopTop(ctx, cx, cy, 128, 'shear', bsr);
        label = bsr > 0.98 ? 'PIPE CUT · WELL SEALED' : 'TOP VIEW · BLIND SHEAR RAM';
        if (bsr > 0.98) lcol = C.green;
      }
    }
    text(ctx, label, ix + iw / 2, iy + ih - 18, { size: 18, weight: 800, align: 'center', color: lcol, spacing: 1 });
    const [title, items] = bopInfo[bi];
    infoBox(ctx, ix, 444, iw, title, items, S.vis(bi, 0.4, 0.2), { rv: S.since(bi) * 0.5 + 0.3 });
  },
};

// ------------------------------------------------------------ control and emergency systems
function panelBox(ctx, x, y, w, h, title, lit, t) {
  fillRR(ctx, x, y, w, h, 10, '#0b1a29', C.panelEdge, 2);
  text(ctx, title, x + w / 2, y + 28, { size: 16, weight: 900, align: 'center', color: C.dim, spacing: 1 });
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) {
    const on = lit && r === 0 && c === 1;
    fillRR(ctx, x + 20 + c * ((w - 40) / 4), y + 46 + r * 34, (w - 40) / 4 - 10, 24, 5, on ? (K.pulse(t, 0.5) > 0.5 ? C.amber : darken(C.amber, 0.3)) : r ? '#23394d' : '#2d4a63');
  }
}
function accBottle(ctx, x, y, w, h, fluid, t) {
  // cut-away bottle: nitrogen on top, hydraulic fluid below, bladder between
  const r = w / 2;
  ctx.save();
  rr(ctx, x, y, w, h, r); ctx.clip();
  const lv = y + h - (h - 10) * clamp(fluid);
  const g = ctx.createLinearGradient(0, y, 0, lv); g.addColorStop(0, '#2b6ea3'); g.addColorStop(1, '#4f9fd6');
  ctx.fillStyle = g; ctx.fillRect(x, y, w, lv - y);
  ctx.fillStyle = '#c9b037'; ctx.fillRect(x, lv, w, y + h - lv);
  ctx.fillStyle = rgba('#ffffff', 0.12); ctx.fillRect(x + w * 0.12, y, w * 0.1, h);
  ctx.restore();
  // bladder
  ctx.save(); ctx.strokeStyle = '#1b1b1b'; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(x + 6, lv); for (let xx = x + 6; xx <= x + w - 6; xx += 8) ctx.lineTo(xx, lv + Math.sin(xx * 0.08 + t * 3) * 3); ctx.stroke(); ctx.restore();
  fillRR(ctx, x, y, w, h, r, null, '#cfd8e3', 6);
  fillRR(ctx, x + w / 2 - 16, y + h - 4, 32, 22, 4, '#7d8a96');
  return lv;
}
function rigTop(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  fillRR(ctx, -60, -60, 120, 120, 10, '#c5ced6', '#56687a', 3);
  for (const [cx, cy] of [[-46, -46], [46, -46], [-46, 46], [46, 46]]) circle(ctx, cx, cy, 15, '#d9a036', '#8a6d1a', 2);
  ctx.strokeStyle = '#56687a'; ctx.lineWidth = 3; ctx.strokeRect(-14, -14, 28, 28);
  line(ctx, -14, -14, 14, 14, '#56687a', 2); line(ctx, 14, -14, -14, 14, '#56687a', 2);
  poly(ctx, [[-60, 22], [-38, 22], [-26, 34], [-26, 60], [-60, 60]]); ctx.fillStyle = '#4a5866'; ctx.fill();
  text(ctx, 'H', -44, 50, { size: 18, weight: 900, align: 'center', color: C.yellow });
  ctx.restore();
}
function chainBox(ctx, x, y, w, steps, prog) {
  steps.forEach((s, i) => {
    const a = clamp(prog - i);
    if (a <= 0) return;
    const yy = y + i * 92;
    fillRR(ctx, x, yy, w, 64, 12, 'rgba(7,17,28,0.92)', i === steps.length - 1 ? C.green : C.panelEdge, 2);
    ctx.save(); ctx.globalAlpha *= a;
    circle(ctx, x + 34, yy + 32, 18, C.amber);
    text(ctx, String(i + 1), x + 34, yy + 40, { size: 20, weight: 900, align: 'center', color: '#1a1206' });
    text(ctx, s, x + 64, yy + 40, { size: 21, weight: 700, color: C.text });
    ctx.restore();
    if (i < steps.length - 1 && prog > i + 1) arrow(ctx, x + 34, yy + 66, x + 34, yy + 90, { color: C.amber, lw: 3, head: 10 });
  });
}
function card(ctx, x, y, w, h, title, body, a, color) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, x, y, w, h, 14, 'rgba(7,17,28,0.94)', color, 2);
  text(ctx, title, x + 20, y + 36, { size: 21, weight: 900, color, spacing: 1 });
  K.para(ctx, body, x + 20, y + 70, w - 40, { size: 20, color: C.text, lh: 1.32 });
  ctx.restore();
}
const ctrlScene = {
  id: 'controls',
  title: 'BOP control and emergency systems',
  blurb: 'How a button on the rig closes a valve on the seabed, even when things go wrong.',
  beats: [
    {
      term: 'BOP control system & pods', abbr: 'MUX', no: 'kontrollpoder (blå og gul)',
      def: 'The driller’s and toolpusher’s panels send commands down multiplex (MUX) cables to two fully redundant control pods on the LMRP: the blue pod and the yellow pod. The pod opens a valve that sends hydraulic fluid to the function, e.g. “close upper annular”.',
      ex: 'We are on the blue pod, yellow is in standby.',
      say: 'The BOP is operated from panels in the driller’s cabin and the toolpusher’s office. Commands go down multiplex cables, called mux cables, to two control pods on the LMRP: the blue pod and the yellow pod. The pod then fires a valve that sends hydraulic fluid to the function. Each pod can operate every function on its own, so one is active, and the other is the backup.',
    },
    {
      term: 'Accumulators', no: 'akkumulatorer',
      def: 'Steel bottles that store hydraulic fluid under nitrogen pressure, typically 5,000 psi (345 bar), on the rig and on the BOP itself. They give the energy to close the BOP fast, even if the pumps or power fail. The surface unit is often called the Koomey unit.',
      ex: 'Accumulator pressure is back up to 5,000 psi.',
      say: 'Accumulators are steel bottles that store hydraulic fluid under nitrogen pressure, typically five thousand psi, or three hundred and forty five bar. Some are on the rig, and some sit on the BOP itself. They deliver the energy to close the BOP fast, even if the pumps or the power fail. The surface unit is often called the Koomey unit, after a manufacturer.',
    },
    {
      term: 'Emergency disconnect sequence & watch circles', abbr: 'EDS', no: 'nødfrakobling',
      def: 'A pre-programmed sequence that secures the well and unlatches the LMRP, so a floating rig can leave fast. Used if the rig moves too far off location, e.g. a DP drive-off. Green, yellow and red watch circles around the well tell the crew when to prepare and when to disconnect.',
      ex: 'We’re in the yellow: prepare to hang off.',
      say: 'If a floating rig loses position, for example in a DP drive off, the riser and the well are at risk. Watch circles around the well tell the crew what to do: green is normal, yellow means prepare, and red means disconnect. The EDS, the emergency disconnect sequence, then closes the rams, shears the pipe, seals the well and unlatches the LMRP, automatically and in a fixed order.',
    },
    {
      term: 'Deadman, autoshear & ROV intervention', abbr: 'AMF',
      def: 'Automatic backups if control is lost. The deadman (AMF) closes the shear rams if both hydraulic and electrical connection to the rig are lost; the autoshear fires if the LMRP separates unexpectedly. An ROV can operate key functions through a hot stab on the intervention panel, and some rigs have an acoustic backup.',
      ex: 'ROV is on the intervention panel, ready to hot stab.',
      say: 'Backups protect against losing control. The deadman closes the shear rams automatically if the stack loses both hydraulic and electric connection to the rig. The autoshear fires if the LMRP comes off unexpectedly. And an ROV can operate key functions directly, by plugging a hot stab into the intervention panel on the stack. Some rigs also have an acoustic backup system.',
    },
    {
      term: 'BOP testing', no: 'funksjonstest og trykktest',
      def: 'Function test: every BOP function is operated from both pods and panels, weekly. Pressure test: each element is tested against a test plug, with a low test (15–20 bar) then a high test, after installation and at least every 14 days (NORSOK D-010).',
      ex: 'BOP test is due tomorrow, that’s half a day on the plan.',
      say: 'The BOP is tested regularly. A function test operates every function, from both pods, every week. In a pressure test, a test plug seals off the well below, and each element is tested, first to a low pressure, then to a high pressure, holding each one steady on a chart. That happens after installation, and at least every fourteen days, as required by NORSOK D-010.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      seaBg(ctx, t, 870, 210);
      const press = S.since(0) > 2.2;
      const arrive = S.since(0) > 4.2;
      const A = SS.bopStack(ctx, 600, 840, 0.55, { t, labels: false, annular: S.p(0, 1.5, 4.6), hl: new Set(arrive ? ['pods'] : []), hlA: S.hl(0) });
      ctx.fillStyle = C.stage; ctx.fillRect(0, 0, 1196, 20);
      fillRR(ctx, 16, 16, 1164, 196, 16, '#13283a', C.panelEdge, 2);
      text(ctx, 'ON THE RIG', 36, 46, { size: 16, weight: 900, color: C.faint, spacing: 2 });
      panelBox(ctx, 36, 64, 250, 130, 'DRILLER’S PANEL', press, t);
      panelBox(ctx, 304, 64, 250, 130, 'TOOLPUSHER’S PANEL', false, t);
      fillRR(ctx, 640, 64, 230, 130, 10, '#0b1a29', C.panelEdge, 2);
      text(ctx, 'HYDRAULIC UNIT', 755, 92, { size: 16, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      for (let k = 0; k < 6; k++) fillRR(ctx, 660 + k * 34, 108, 24, 70, 12, '#56687a', '#8796a5', 1.5);
      // mux reels
      for (const [x, col] of [[960, C.blue], [1090, C.yellow]]) {
        circle(ctx, x, 120, 52, darken(col, 0.45), col, 4);
        ctx.save(); ctx.translate(x, 120); ctx.rotate(t * 0.3);
        for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); line(ctx, 0, 0, 0, 44, col, 3); }
        ctx.restore();
        circle(ctx, x, 120, 12, col);
      }
      text(ctx, 'MUX CABLE REELS', 1025, 56, { size: 15, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      const blue = [[960, 172], [960, 250], [560, 250], [560, 505], [505, 535]];
      const yel = [[1090, 172], [1090, 270], [640, 270], [640, 505], [705, 535]];
      K.partialPolyline(ctx, blue, 1, C.blue, 5); K.partialPolyline(ctx, yel, 1, C.yellow, 5);
      if (press) {
        const sig = { spacing: 40, speed: 160, color: '#ffffff', r: 5, glow: 12 };
        K.flow(ctx, blue, t, sig); K.flow(ctx, yel, t, sig);
      }
      if (press) callout(ctx, 128, 122, 140, 330, '“ANNULAR CLOSE”', { color: C.amber, size: 22, t: S.p(0, 0.5, 2.2) });
      if (arrive) callout(ctx, A.lowerAnnular[0] - 0.55 * 280, A.lowerAnnular[1], 340, 770, 'annular closes', { color: C.green, size: 22, t: S.p(0, 0.6, 4.6) });
      chainBox(ctx, 790, 300, 380, ['Panel command', 'MUX cable', 'Control pod', 'Hydraulic valve fires', 'BOP function closes'], S.since(0) * 0.9 - 0.5);
      if (S.since(0) > 7) tag(ctx, 'blue + yellow pods: either can do everything', 600, 900, { size: 21, color: C.cyan, fill: 'rgba(7,17,28,0.92)', alpha: S.vis(0, 0.5, 7) });
    }
    if (bi === 1) {
      const tt = S.since(1);
      const fire = clamp((tt - 3) / 1.6), refill = clamp((tt - 6.5) / 3);
      const fluid = 0.62 - 0.3 * ease.inOut(fire) + 0.3 * ease.inOut(refill);
      const lv = accBottle(ctx, 120, 110, 200, 640, fluid, t);
      text(ctx, 'N₂', 220, Math.min(lv - 40, 300), { size: 54, weight: 900, align: 'center', color: '#e3f2ff' });
      text(ctx, 'nitrogen precharge', 220, Math.min(lv - 40, 300) + 34, { size: 18, weight: 700, align: 'center', color: '#e3f2ff' });
      text(ctx, 'hydraulic fluid', 220, Math.max(lv + 50, 640), { size: 18, weight: 800, align: 'center', color: '#2a2306' });
      const out = [[220, 772], [220, 830], [560, 830]];
      line(ctx, 220, 772, 220, 830, '#7d8a96', 10); line(ctx, 220, 830, 560, 830, '#7d8a96', 10);
      if (fire > 0 && fire < 1) K.flow(ctx, out, t, { color: '#e8d25a', r: 5, spacing: 22, speed: 160 });
      tag(ctx, 'to the BOP functions →', 560, 830, { size: 20, color: '#e8d25a', align: 'left', fill: 'rgba(7,17,28,0.92)' });
      if (refill > 0 && refill < 1) {
        I.gear(ctx, 420, 700, 70, t * 3, C.steel);
        tag(ctx, 'pumps recharge', 420, 770, { size: 18, color: C.green });
      }
      const p = 345 - 105 * ease.inOut(fire) + 105 * ease.inOut(refill);
      gauge(ctx, 560, 360, 120, p, { min: 0, max: 400, unit: 'bar', color: p < 300 ? C.red : C.green });
      text(ctx, 'ACCUMULATOR PRESSURE', 560, 530, { size: 20, weight: 900, align: 'center', color: p < 300 ? C.red : C.green, spacing: 1 });
      text(ctx, `${K.fmtNum(Math.round(p * 14.5 / 10) * 10)} psi`, 560, 570, { size: 24, weight: 800, align: 'center', color: C.dim, fam: K.MONO });
      // banks
      fillRR(ctx, 760, 70, 410, 300, 14, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'ON THE RIG: ACCUMULATOR UNIT', 965, 104, { size: 16, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      for (let r = 0; r < 2; r++) for (let c = 0; c < 8; c++) fillRR(ctx, 786 + c * 47, 124 + r * 116, 34, 104, 17, '#2b6ea3', '#cfd8e3', 2);
      fillRR(ctx, 760, 400, 410, 300, 14, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'ON THE BOP: SUBSEA BOTTLES', 965, 434, { size: 16, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      SS.bopSimple(ctx, 965, 680, 1.25, { riser: false });
      for (const sd of [-1, 1]) for (let k = 0; k < 3; k++) fillRR(ctx, 965 + sd * (110 + k * 26) - 11, 530, 22, 80, 11, '#2b6ea3', '#cfd8e3', 2);
      if (fire > 0 && fire < 1) tag(ctx, 'FUNCTION FIRED', 560, 140, { size: 22, color: C.amber, fill: 'rgba(7,17,28,0.92)' });
    }
    if (bi === 2) {
      const tt = S.since(2);
      // top view of the sea around the well
      ctx.fillStyle = '#0c3450'; ctx.fillRect(0, 0, 760, 940);
      for (let k = 0; k < 14; k++) { const yy = (k * 70 + t * 12) % 940; line(ctx, 0, yy, 760, yy + 30, rgba('#ffffff', 0.04), 2); }
      const wx = 370, wy = 500;
      circle(ctx, wx, wy, 330, rgba(C.red, 0.12));
      circle(ctx, wx, wy, 250, '#0c3450'); circle(ctx, wx, wy, 250, rgba(C.yellow, 0.14));
      circle(ctx, wx, wy, 150, '#0c3450'); circle(ctx, wx, wy, 150, rgba(C.green, 0.16));
      ctx.save(); ctx.setLineDash([10, 8]);
      circle(ctx, wx, wy, 150, null, C.green, 3); circle(ctx, wx, wy, 250, null, C.yellow, 3); ctx.restore();
      text(ctx, 'GREEN', wx, wy - 118, { size: 18, weight: 900, align: 'center', color: C.green, spacing: 2 });
      text(ctx, 'YELLOW', wx, wy - 214, { size: 18, weight: 900, align: 'center', color: C.yellow, spacing: 2 });
      text(ctx, 'RED', wx, wy - 290, { size: 18, weight: 900, align: 'center', color: C.red, spacing: 2 });
      circle(ctx, wx, wy, 10, C.amber, '#1a1206', 2);
      text(ctx, 'well', wx, wy + 34, { size: 18, weight: 800, align: 'center', color: C.amber });
      const d = 345 * ease.in(clamp((tt - 2.5) / 9));
      const dir = -0.55;
      const rx = wx + Math.cos(dir) * d, ry = wy + Math.sin(dir) * d;
      const zone = d < 150 ? 0 : d < 250 ? 1 : 2;
      // EDS sequence clock: starts when the red circle is crossed
      const tRed = 2.5 + 9 * Math.pow(250 / 345, 1 / 2);
      const e = tt - tRed;
      const steps = e > 0 ? clamp(e / 1.1, 0, 4) : 0;
      if (steps < 3) line(ctx, wx, wy, rx, ry, '#9fb0c1', 6);
      rigTop(ctx, rx, ry, 0.8, 0.15);
      if (tt > 2.5 && zone === 0) tag(ctx, 'drive-off!', rx + 60, ry - 70, { size: 20, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      // side view
      fillRR(ctx, 790, 24, 386, 500, 16, 'rgba(7,17,28,0.94)', C.panelEdge, 2);
      ctx.save(); rr(ctx, 790, 24, 386, 500, 16); ctx.clip();
      ctx.fillStyle = '#082338'; ctx.fillRect(790, 100, 386, 380);
      K.lithoFill(ctx, 'clay', 790, 480, 386, 44, 2);
      SS.bopStack(ctx, 983, 470, 0.42, { t, labels: false, pipeRam: clamp(steps), bsr: clamp(steps - 1), lift: clamp(steps - 2) });
      ctx.restore();
      const zc = [C.green, C.yellow, C.red][zone];
      tag(ctx, ['STATUS: GREEN', 'STATUS: YELLOW · PREPARE', 'STATUS: RED · DISCONNECT'][zone], 983, 64, { size: 20, color: zc, fill: 'rgba(7,17,28,0.96)' });
      const seq = ['Close pipe rams (hang off)', 'Shear the pipe with the BSR', 'Unlatch the LMRP', 'Rig moves off with the riser'];
      fillRR(ctx, 790, 544, 386, 360, 16, 'rgba(7,17,28,0.94)', steps > 0 ? C.red : C.panelEdge, 2);
      text(ctx, 'EDS SEQUENCE', 816, 584, { size: 20, weight: 900, color: steps > 0 ? C.red : C.dim, spacing: 2 });
      seq.forEach((s, i) => {
        const done = steps >= i + 1, act = steps > i && !done;
        const yy = 640 + i * 66;
        if (done) I.check(ctx, 830, yy - 8, 30, C.green);
        else circle(ctx, 830, yy - 8, 11, act ? C.amber : null, C.faint, 2);
        text(ctx, s, 856, yy, { size: 20, weight: done || act ? 700 : 500, color: done ? C.text : act ? C.amber : C.faint });
      });
    }
    if (bi === 3) {
      const q = S.q(3);
      seaBg(ctx, t, 860);
      // phase A: deadman, phase B: autoshear, phase C: ROV, phase D: acoustic
      const ph = q < 0.3 ? 0 : q < 0.5 ? 1 : q < 0.8 ? 2 : 3;
      const bsr = ph === 0 ? clamp((q - 0.15) / 0.07) : ph === 1 ? clamp((q - 0.4) / 0.04) : 0;
      const lift = ph === 1 ? 0.5 * clamp((q - 0.33) / 0.05) : 0;
      const rovIn = clamp((q - 0.5) / 0.1);
      const pr = ph === 2 ? clamp((q - 0.66) / 0.06) : 0;
      const ann = ph === 3 ? clamp((q - 0.86) / 0.06) : 0;
      SS.bopStack(ctx, 330, 820, 0.62, { t, labels: false, bsr, lift, pipeRam: pr, annular: ann });
      // cut lines to the rig in the deadman phase
      if (ph === 0 && q > 0.06) {
        for (const [x, col] of [[290, C.blue], [370, C.yellow]]) {
          line(ctx, x, 0, x, 420, rgba(col, 0.5), 4, [10, 8]);
          I.xmark(ctx, x, 200, 34, C.red);
        }
        tag(ctx, 'hydraulics + signals LOST', 330, 140, { size: 20, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      }
      if (ph === 1 && q > 0.34) tag(ctx, 'LMRP off unexpectedly!', 330, 140, { size: 20, color: C.red, fill: 'rgba(7,17,28,0.92)' });
      // intervention panel + ROV
      fillRR(ctx, 466, 650, 44, 70, 6, C.yellow, '#8a6d1a', 2);
      for (let k = 0; k < 3; k++) circle(ctx, 488, 666 + k * 20, 6, '#1a1206');
      if (ph === 2) {
        const rx = lerp(900, 640, ease.out(rovIn));
        SS.rov(ctx, rx, 622, 1.5, t, { dir: -1, arm: q > 0.6 ? 2.4 : 0 });
        if (q > 0.62) tag(ctx, 'hot stab', 600, 520, { size: 20, color: C.yellow, fill: 'rgba(7,17,28,0.92)' });
      }
      if (ph === 3) {
        for (let k = 0; k < 4; k++) {
          const pp = (t * 0.5 + k / 4) % 1;
          ctx.save(); ctx.globalAlpha *= 1 - pp;
          ctx.beginPath(); ctx.arc(600, -40, 80 + pp * 560, Math.PI * 0.55, Math.PI * 0.85); ctx.strokeStyle = C.cyan; ctx.lineWidth = 4; ctx.stroke();
          ctx.restore();
        }
        tag(ctx, 'acoustic signal from the rig', 640, 120, { size: 20, color: C.cyan, fill: 'rgba(7,17,28,0.92)' });
      }
      const cards = [
        ['DEADMAN (AMF)', 'Lose hydraulics AND signals from the rig: shear rams close by themselves.', C.red],
        ['AUTOSHEAR', 'LMRP separates unexpectedly: shear rams close at once.', C.amber],
        ['ROV HOT STAB', 'ROV plugs into the intervention panel and operates the BOP directly.', C.yellow],
        ['ACOUSTIC BACKUP', 'Coded sound signals from the rig to the stack.', C.cyan],
      ];
      const starts = [0.02, 0.3, 0.5, 0.8];
      cards.forEach(([tl, body, col], i) => card(ctx, 760, 24 + i * 226, 416, 206, tl, body, clamp((q - starts[i]) / 0.03) * (ph === i ? 1 : 0.55), col));
    }
    if (bi === 4) {
      const p = S.p(4, 9, 0.6, ease.linear);
      fillRR(ctx, 40, 40, 680, 560, 12, '#f4f1ea', '#c9c2b0', 2);
      const X = (m) => 120 + (m / 22) * 560, Y = (b) => 540 - (b / 400) * 440;
      for (let b = 0; b <= 400; b += 50) { line(ctx, X(0), Y(b), X(22), Y(b), rgba('#000', b % 100 ? 0.06 : 0.14), 1); text(ctx, String(b), X(0) - 10, Y(b) + 5, { size: 15, weight: 600, align: 'right', color: '#555', fam: K.MONO }); }
      for (let m = 0; m <= 22; m += 2) line(ctx, X(m), Y(0), X(m), Y(400), rgba('#000', 0.06), 1);
      text(ctx, 'bar', X(0) - 10, Y(400) - 18, { size: 15, weight: 700, align: 'right', color: '#555' });
      text(ctx, 'minutes →', X(22), Y(0) + 34, { size: 16, weight: 700, align: 'right', color: '#555' });
      const curve = (m) => (m < 1 ? 20 * m : m < 6 ? 20 : m < 7 ? 20 * (7 - m) : m < 9 ? 0 : m < 11.5 ? 345 * (m - 9) / 2.5 : m < 21.5 ? 345 - (m - 11.5) * 0.4 : Math.max(0, 341 * (22 - m) * 2));
      const pts = [];
      for (let m = 0; m <= 22 * p; m += 0.05) pts.push([X(m), Y(curve(m))]);
      if (pts.length > 1) K.partialPolyline(ctx, pts, 1, '#c0392b', 4);
      if (p > 6 / 22) { tag(ctx, 'LOW TEST · 20 bar · 5 min ✓', X(3.5), Y(20) - 40, { size: 18, color: '#15803d', fill: 'rgba(255,255,255,0.9)' }); }
      if (p > 21.4 / 22) { tag(ctx, 'HIGH TEST · 345 bar · 10 min ✓', X(16.2), Y(345) - 34, { size: 18, color: '#15803d', fill: 'rgba(255,255,255,0.9)' }); }
      text(ctx, 'PRESSURE TEST CHART', 380, 86, { size: 22, weight: 900, align: 'center', color: '#333', spacing: 1 });
      // test plug illustration
      fillRR(ctx, 40, 630, 680, 270, 12, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      const cx = 200;
      ctx.fillStyle = '#7d8a96'; ctx.fillRect(cx - 70, 690, 18, 190); ctx.fillRect(cx + 52, 690, 18, 190);
      ctx.fillStyle = rgba('#3cc8f2', 0.35); ctx.fillRect(cx - 52, 690, 104, 120);
      fillRR(ctx, cx - 60, 810, 120, 34, 6, C.amber, darken(C.amber, 0.4), 2);
      line(ctx, cx, 650, cx, 810, '#9fb0c1', 10);
      for (let k = 0; k < 3; k++) arrow(ctx, cx - 30 + k * 30, 700, cx - 30 + k * 30, 790, { color: C.cyan, lw: 3, head: 10, alpha: 0.4 + 0.6 * K.pulse(t + k * 0.2, 1) });
      text(ctx, 'test plug', cx + 82, 834, { size: 18, weight: 700, color: C.amber });
      K.para(ctx, 'Test plug lands in the wellhead; the BOP element closes; pressure is applied between them.', 340, 700, 350, { size: 20, color: C.text, lh: 1.35 });
      card(ctx, 760, 40, 416, 250, 'FUNCTION TEST', 'Every function, from both pods and both panels: once a week.', S.vis(4, 0.5, 2), C.cyan);
      I.calendar(ctx, 1100, 220, 80, '7 d');
      card(ctx, 760, 320, 416, 250, 'PRESSURE TEST', 'Each element, low then high pressure: at installation and at least every 14 days.', S.vis(4, 0.5, 5), C.amber);
      I.calendar(ctx, 1100, 500, 80, '14 d');
      ctx.save(); ctx.globalAlpha *= S.vis(4, 0.5, 8);
      I.book(ctx, 968, 760, 170, C.blue, 'NORSOK', 'D-010');
      ctx.restore();
    }
  },
};

// ------------------------------------------------------------ well barriers
const BW = {
  cx: 300, seaTop: 60, seabed: 190, td: 900,
  layers: [{ to: 330, kind: 'clay' }, { to: 520, kind: 'rock2' }, { to: 690, kind: 'shale' }, { to: 790, kind: 'sand' }, { to: 940, kind: 'rock4' }],
  strings: [{ hw: 50, holeHw: 60, top: 190, shoe: 300, toc: 190 }, { hw: 40, holeHw: 50, top: 190, shoe: 470, toc: 190 }, { hw: 30, holeHw: 40, top: 190, shoe: 670, toc: 520 }],
  hole: { hw: 22, to: 880 },
};
const cxB = BW.cx;
// primary envelope: open-hole walls + bottom; secondary: in-situ formation, cement, casing, wellhead, BOP
const PRIM = [[cxB - 22, 676], [cxB - 22, 880], [cxB + 22, 880], [cxB + 22, 676]];
const SEC_L = [[cxB - 22, 712], [cxB - 40, 676], [cxB - 40, 520], [cxB - 36, 520], [cxB - 36, 190], [cxB - 30, 150], [cxB, 150]];
const SEC = [...SEC_L, ...SEC_L.slice().reverse().map(([x, y]) => [2 * cxB - x, y])];
function fluidColumn(ctx, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = rgba(C.blue, 0.38);
  ctx.fillRect(cxB - 22, 670, 44, 210);
  ctx.fillRect(cxB - 29, 150, 58, 520);
  ctx.restore();
}
function drawEnvelopes(ctx, S, st) {
  const { prim = 1, sec = 1, primFail = 0, secA = 1, primA = 1 } = st;
  if (prim > 0) {
    fluidColumn(ctx, primA * prim * (1 - primFail * 0.7));
    const col = primFail > 0.5 ? rgba(C.blue, 0.4) : C.blue;
    K.partialPolyline(ctx, PRIM, prim, col, 7, primFail > 0.5 ? [10, 10] : undefined);
    K.partialPolyline(ctx, [[cxB - 22, 676], [cxB - 26, 640], [cxB - 26, 150]], prim, rgba(col, 0.9), 4, [6, 6]);
    K.partialPolyline(ctx, [[cxB + 22, 676], [cxB + 26, 640], [cxB + 26, 150]], prim, rgba(col, 0.9), 4, [6, 6]);
  }
  if (sec > 0) {
    ctx.save(); ctx.globalAlpha *= secA;
    K.partialPolyline(ctx, SEC, sec, C.red, 7);
    if (sec >= 1) line(ctx, cxB - 22, 712, cxB + 22, 712, C.red, 4, [8, 6]);
    ctx.restore();
  }
}
function wellBase(ctx, S, st = {}) {
  WL.drawWell(ctx, BW, { t: S.t, bop: true, bopScale: 0.55, string: st.string === false ? null : { to: 860 } });
  text(ctx, '↑ to the rig', cxB + 40, 30, { size: 18, weight: 700, color: C.dim });
}
function influx(ctx, t, n, inside, ybot = 780, ytop = 700) {
  for (let k = 0; k < n; k++) {
    const ph = (t * 0.5 + k / n) % 1;
    const side = k % 2 ? 1 : -1;
    if (!inside) {
      // pushes against the wall and bounces
      const x = cxB + side * (120 - 90 * Math.sin(ph * Math.PI));
      circle(ctx, x, 720 + (k % 4) * 18, 5, C.gas);
    } else {
      const y = lerp(ybot, ytop, ph);
      circle(ctx, cxB + side * (8 + (k % 3) * 4), y, 5, C.gas);
    }
  }
}
const barrierScene = {
  id: 'barriers',
  title: 'Well barriers',
  blurb: 'NORSOK D-010: always two tested barriers between the reservoir and the world.',
  beats: [
    {
      term: 'Well barrier', no: 'brønnbarriere',
      def: 'An envelope of one or more well barrier elements that prevents formation fluids from flowing unintentionally into another formation or to the surroundings (NORSOK D-010). Not one valve, but a complete, closed container.',
      ex: 'What are your barriers for this operation?',
      say: 'A well barrier is an envelope, made of one or several elements, that stops formation fluids from flowing unintentionally, into another formation or out to the surroundings. Think of it as a complete, sealed container, not just one valve.',
    },
    {
      term: 'Two-barrier principle', no: 'tobarriereprinsippet',
      def: 'There shall always be at least two independent, tested well barriers when there is a pressure difference that could cause uncontrolled flow. If one fails, the well is secured and the only work allowed is restoring it.',
      ex: 'We’ve lost a barrier: stop and secure the well.',
      say: 'On the NCS, the two barrier principle is fundamental. There must always be two independent, tested well barriers between the reservoir and the surroundings. If one fails, you still have the other one, but all other work stops until the failed barrier is restored.',
    },
    {
      term: 'Primary & secondary well barrier', no: 'primær og sekundær brønnbarriere',
      def: 'The primary barrier is the first one against flow; while drilling, it is the fluid column (mud overbalance). The secondary barrier backs it up: the formation at the casing shoe, casing cement, casing, wellhead and the BOP.',
      say: 'While drilling, the primary barrier is the fluid column: mud heavy enough to hold back the pore pressure. The secondary barrier is the formation at the last casing shoe, the casing cement, the casing, the wellhead and the BOP. If the mud fails and the well kicks, closing the BOP activates the secondary barrier.',
    },
    {
      term: 'Well barrier element', abbr: 'WBE', no: 'brønnbarriereelement',
      def: 'One physical part of a barrier, such as the fluid column, casing, cement, wellhead or BOP. On its own it does not stop flow; together the elements form the envelope. NORSOK D-010 has an acceptance table for each element type.',
      ex: 'Casing cement is a WBE, check its acceptance criteria.',
      say: 'Each barrier is built from well barrier elements, WBEs, such as the fluid column, the casing, the cement, the wellhead and the BOP. On its own, an element does not stop flow. Together, they form the envelope. NORSOK D-010 has a table for each element type, with its acceptance criteria.',
    },
    {
      term: 'Well barrier schematic', abbr: 'WBS', no: 'brønnbarriereskjema',
      def: 'A drawing of the well for each phase of an operation, showing the primary barrier in blue and the secondary barrier in red, with a table of the elements and how each one is verified. Part of every drilling programme.',
      ex: 'Update the WBS before we pull the BOP.',
      say: 'A well barrier schematic, the WBS, is a drawing of the well for each phase of an operation. The primary barrier is drawn in blue and the secondary barrier in red, with a table of the elements, and how each one is verified. You will find them in every drilling programme.',
    },
    {
      term: 'Barrier verification: pressure & inflow test', no: 'trykktest / innstrømningstest',
      def: 'An element is not accepted until it is verified. Pressure test: apply pressure from above and check that it holds. Inflow (negative) test: reduce the pressure above the barrier and confirm no flow and no pressure build-up from below.',
      ex: 'Inflow test on the liner top: no flow for 30 minutes.',
      say: 'A barrier must be verified before you rely on it. In a pressure test, you pump pressure on top of it, and check that it holds steady. In an inflow test, also called a negative test, you reduce the pressure above it, and confirm that nothing flows in from below. The inflow test is the more realistic one, because it tests in the direction of flow.',
    },
    {
      term: 'Well integrity', no: 'brønnintegritet',
      def: 'Technical, operational and organisational solutions that reduce the risk of uncontrolled release of formation fluids throughout the life cycle of a well (NORSOK D-010): from design, through drilling and production, to plug and abandonment.',
      ex: 'Any well integrity issues to report?',
      say: 'Together, this is called well integrity: the technical, operational and organisational solutions that keep the risk of an uncontrolled release low, through the whole life of a well. From design and drilling, to production, and finally to plug and abandonment.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 3) {
      wellBase(ctx, S);
      if (bi === 0) {
        drawEnvelopes(ctx, S, { prim: S.p(0, 2.5, 1), sec: 0 });
        influx(ctx, t, 10, false);
        callout(ctx, cxB + 22, 800, 560, 760, 'formation fluids held back', { color: C.gas, size: 22, t: S.p(0, 0.6, 3.5) });
        infoBox(ctx, 640, 60, 520, 'WELL BARRIER (NORSOK D-010)', ['An envelope of one or more elements', 'Stops formation fluids flowing unintentionally', '…into another formation or to the surroundings'], S.vis(0, 0.5, 1), { color: C.blue, rv: S.since(0) * 0.4 });
      }
      if (bi === 1) {
        const q = S.q(1);
        const fail = clamp((q - 0.45) / 0.08);
        drawEnvelopes(ctx, S, { prim: 1, sec: S.p(1, 2, 0.5), primFail: fail });
        if (fail > 0) {
          influx(ctx, t, 14, true, 800, 230);
          tag(ctx, '✗ PRIMARY LOST', 420, 780, { size: 22, color: C.blue, fill: 'rgba(7,17,28,0.92)', align: 'left', alpha: fail });
          tag(ctx, '✓ SECONDARY HOLDS (BOP closed)', 420, 150, { size: 22, color: C.red, fill: 'rgba(7,17,28,0.92)', align: 'left', alpha: clamp((q - 0.55) / 0.05) });
        }
        ctx.save(); ctx.globalAlpha *= S.vis(1, 0.5, 0.8);
        fillRR(ctx, 700, 260, 460, 300, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
        I.shield(ctx, 820, 380, 120, C.blue, 'check'); I.shield(ctx, 1040, 380, 120, C.red, 'check');
        text(ctx, '1', 820, 486, { size: 26, weight: 900, align: 'center', color: C.blue });
        text(ctx, '2', 1040, 486, { size: 26, weight: 900, align: 'center', color: C.red });
        text(ctx, 'two independent, tested barriers', 930, 530, { size: 21, weight: 700, align: 'center', color: C.text });
        if (fail > 0.5) I.xmark(ctx, 820, 380, 90, C.red);
        ctx.restore();
        if (q > 0.7) tag(ctx, 'STOP · secure · restore the barrier', 930, 620, { size: 24, color: C.amber, fill: 'rgba(7,17,28,0.94)', alpha: clamp((q - 0.7) / 0.05) });
      }
      if (bi === 2) {
        drawEnvelopes(ctx, S, { prim: 1, sec: 1 });
        infoBox(ctx, 640, 60, 520, 'PRIMARY · BLUE', ['Fluid column: mud weight above pore pressure'], S.vis(2, 0.5, 0.6), { color: C.blue, rv: 9 });
        infoBox(ctx, 640, 260, 520, 'SECONDARY · RED', ['In-situ formation at the shoe', 'Casing cement', 'Casing', 'Wellhead', 'BOP'], S.vis(2, 0.5, 5), { color: C.red, rv: (S.since(2) - 5) * 1.2 });
      }
      if (bi === 3) {
        drawEnvelopes(ctx, S, { prim: 1, sec: 1, primA: 0.6, secA: 0.6 });
        const els = [
          ['fluid column', cxB, 800, C.blue], ['in-situ formation', cxB + 22, 712, C.red], ['casing cement', cxB + 37, 600, C.red],
          ['casing', cxB + 32, 400, C.red], ['wellhead', cxB + 20, 186, C.red], ['BOP', cxB + 30, 140, C.red],
        ];
        const k = Math.min(els.length - 1, Math.floor(S.since(3) / 2.2));
        els.forEach(([n, x, y, col], i) => {
          if (i > k) return;
          const ly = 860 - i * 130;
          callout(ctx, x, y, 600, ly, n, { color: col, size: 22, t: S.p(3, 0.6, i * 2.2), alpha: i === k ? 1 : 0.55 });
        });
        fillRR(ctx, 880, 120, 290, 76, 14, 'rgba(7,17,28,0.92)', C.amber, 2);
        text(ctx, 'WBE', 1025, 172, { size: 40, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
      }
    }
    if (bi === 4) {
      // paper well barrier schematic
      fillRR(ctx, 40, 30, 1116, 880, 10, '#f7f5ef', '#c9c2b0', 2);
      text(ctx, 'WELL BARRIER SCHEMATIC', 70, 80, { size: 30, weight: 900, color: '#222' });
      text(ctx, 'Example well · drilling the 12¼ in section', 70, 114, { size: 20, weight: 600, color: '#555' });
      const x0 = 250;
      // simple black-line well
      const L = (a, b, c, d, w = 3, col = '#333') => line(ctx, a, b, c, d, col, w);
      L(60, 200, 470, 200, 2, '#8a7457');
      text(ctx, 'seabed', 66, 192, { size: 15, weight: 600, color: '#8a7457' });
      for (const [hw, shoe] of [[60, 300], [46, 470], [34, 660]]) { L(x0 - hw, 200, x0 - hw, shoe); L(x0 + hw, 200, x0 + hw, shoe); }
      ctx.fillStyle = 'rgba(0,0,0,0.14)'; ctx.fillRect(x0 - 44, 520, 10, 140); ctx.fillRect(x0 + 34, 520, 10, 140);
      L(x0 - 24, 660, x0 - 24, 860, 2, '#777'); L(x0 + 24, 660, x0 + 24, 860, 2, '#777');
      fillRR(ctx, x0 - 46, 120, 92, 78, 6, '#ddd', '#333', 2);
      text(ctx, 'BOP', x0, 168, { size: 18, weight: 800, align: 'center', color: '#333' });
      const pr = S.p(4, 1.5, 0.8), sc = S.p(4, 2, 2.2);
      ctx.fillStyle = rgba(C.blue, 0.18 * pr); ctx.fillRect(x0 - 24, 660, 48, 200);
      K.partialPolyline(ctx, [[x0 - 24, 660], [x0 - 24, 860], [x0 + 24, 860], [x0 + 24, 660]], pr, '#1d4ed8', 6);
      const secL = [[x0 - 24, 700], [x0 - 44, 660], [x0 - 44, 520], [x0 - 38, 520], [x0 - 38, 200], [x0 - 38, 150], [x0, 150]];
      K.partialPolyline(ctx, [...secL, ...secL.slice().reverse().map(([x, y]) => [2 * x0 - x, y])], sc, '#dc2626', 6);
      // legend table
      const tx = 520;
      const rows = [
        ['PRIMARY WELL BARRIER', '', '#1d4ed8'], ['Fluid column', 'mud weight & well monitoring', '#222'],
        ['SECONDARY WELL BARRIER', '', '#dc2626'], ['In-situ formation', 'leak-off / formation integrity test', '#222'],
        ['Casing cement', 'job records, cement evaluation', '#222'], ['Casing', 'pressure test', '#222'],
        ['Wellhead', 'pressure test', '#222'], ['BOP', 'pressure & function tests', '#222'],
      ];
      text(ctx, 'ELEMENT', tx, 190, { size: 15, weight: 900, color: '#777', spacing: 1 });
      text(ctx, 'VERIFIED BY', tx + 260, 190, { size: 15, weight: 900, color: '#777', spacing: 1 });
      rows.forEach(([a, b, col], i) => {
        const v = S.p(4, 0.4, 3 + i * 0.5);
        const yy = 240 + i * 74;
        if (!b) { ctx.save(); ctx.globalAlpha *= v; ctx.fillStyle = rgba(col, 0.1); ctx.fillRect(tx - 10, yy - 32, 620, 46); ctx.restore(); }
        text(ctx, a, tx, yy, { size: b ? 22 : 20, weight: b ? 700 : 900, color: col, alpha: v });
        if (b) text(ctx, b, tx + 260, yy, { size: 20, weight: 500, color: '#444', alpha: v });
        line(ctx, tx - 10, yy + 18, tx + 610, yy + 18, rgba('#000', 0.08 * v), 1);
      });
    }
    if (bi === 5) {
      const tt = S.since(5);
      const half = (x, title, col) => {
        fillRR(ctx, x, 30, 560, 880, 16, 'rgba(7,17,28,0.92)', col, 2);
        text(ctx, title, x + 280, 76, { size: 24, weight: 900, align: 'center', color: col, spacing: 2 });
      };
      half(20, 'PRESSURE TEST', C.amber);
      half(616, 'INFLOW TEST', C.cyan);
      for (const [x0, mode] of [[300, 'p'], [896, 'i']]) {
        // casing with a cement plug
        ctx.fillStyle = '#7d8a96'; ctx.fillRect(x0 - 80, 120, 16, 600); ctx.fillRect(x0 + 64, 120, 16, 600);
        ctx.fillStyle = mode === 'p' ? rgba(C.mud, 0.7) : rgba('#a7d3f2', 0.5); ctx.fillRect(x0 - 64, 120, 128, 400);
        ctx.fillStyle = C.cement; ctx.fillRect(x0 - 64, 520, 128, 90);
        K.speckle(ctx, x0 - 64, 520, 128, 90, 120, rgba('#000', 0.2), 4, 1.3);
        ctx.fillStyle = rgba(C.gas, 0.35); ctx.fillRect(x0 - 64, 610, 128, 110);
        text(ctx, 'plug / barrier', x0, 572, { size: 18, weight: 800, align: 'center', color: '#222' });
        text(ctx, 'below: formation pressure', x0, 760, { size: 18, weight: 700, align: 'center', color: C.dim });
      }
      // pressure test: arrows down, gauge holding
      const pp = clamp((tt - 1) / 2.5);
      for (let k = 0; k < 3; k++) arrow(ctx, 260 + k * 40, 160, 260 + k * 40, 480, { color: C.amber, lw: 4, head: 14, t: pp, alpha: 0.9 });
      gauge(ctx, 300, 840, 52, 200 * pp, { min: 0, max: 300, unit: 'bar', color: C.amber });
      if (tt > 5) tag(ctx, 'holds steady ✓', 450, 840, { size: 20, color: C.green, fill: 'rgba(7,17,28,0.9)' });
      // inflow test: pressure reduced, no flow
      const ip = clamp((tt - 8) / 2.5);
      for (let k = 0; k < 3; k++) arrow(ctx, 856 + k * 40, 470, 856 + k * 40, 170, { color: C.cyan, lw: 4, head: 14, t: ip, alpha: 0.9 });
      tag(ctx, 'pressure above reduced', 896, 300, { size: 18, color: C.cyan, fill: 'rgba(7,17,28,0.9)', alpha: ip });
      if (tt > 8) {
        K.tank(ctx, 1060, 140, 70, 160, 0.5, { color: C.mud, label: 'trip tank' });
        if (tt > 11) tag(ctx, 'no flow, no build-up ✓', 1000, 840, { size: 20, color: C.green, fill: 'rgba(7,17,28,0.9)' });
      }
    }
    if (bi === 6) {
      const phases = [['DESIGN', C.dim], ['DRILL', C.amber], ['TEST', C.cyan], ['PRODUCE', C.green], ['P&A', C.purple]];
      text(ctx, 'THE LIFE OF A WELL', 598, 110, { size: 28, weight: 900, align: 'center', color: C.text, spacing: 3 });
      phases.forEach(([n, col], i) => {
        const a = S.p(6, 0.5, 0.5 + i * 0.7);
        const x = 90 + i * 210;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, 200, 180, 110, 16, rgba(col, 0.15), col, 3);
        text(ctx, n, x + 90, 266, { size: 26, weight: 900, align: 'center', color: col });
        ctx.restore();
        if (i < 4) arrow(ctx, x + 184, 255, x + 206, 255, { color: C.dim, lw: 3, head: 10, alpha: a });
      });
      const rp = S.p(6, 4, 3.5, ease.linear);
      fillRR(ctx, 90, 360, 1020 * rp, 34, 17, rgba(C.blue, 0.85));
      fillRR(ctx, 90, 410, 1020 * rp, 34, 17, rgba(C.red, 0.85));
      if (rp > 0.3) { text(ctx, 'primary barrier', 110, 384, { size: 20, weight: 800, color: '#fff' }); text(ctx, 'secondary barrier', 110, 434, { size: 20, weight: 800, color: '#fff' }); }
      ctx.save(); ctx.globalAlpha *= S.vis(6, 0.5, 7);
      fillRR(ctx, 90, 500, 1020, 140, 16, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, 'An exploration well usually goes', 600, 556, { size: 24, weight: 600, align: 'center', color: C.text });
      text(ctx, 'DESIGN → DRILL → (TEST) → P&A', 600, 604, { size: 28, weight: 900, align: 'center', color: C.amber });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= S.vis(6, 0.5, 9);
      const items = [['technical', 'equipment & design'], ['operational', 'procedures & monitoring'], ['organisational', 'people, roles & competence']];
      items.forEach(([a2, b2], i) => {
        const x = 90 + i * 350;
        fillRR(ctx, x, 690, 320, 150, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
        text(ctx, a2.toUpperCase(), x + 160, 750, { size: 22, weight: 900, align: 'center', color: C.cyan, spacing: 1 });
        text(ctx, b2, x + 160, 796, { size: 20, weight: 600, align: 'center', color: C.text });
      });
      ctx.restore();
    }
  },
};

module.exports = {
  id: 'ch14', num: 14, title: 'The BOP & Well Barriers',
  subtitle: 'The equipment and the thinking that keep the well under control',
  topics: ['BOP', 'Annular', 'Pipe rams', 'VBR', 'BSR', 'CSR', 'LMRP', 'Pods', 'Accumulators', 'EDS', 'Deadman', 'BOP test', 'Well barrier', 'Two barriers', 'WBE', 'WBS', 'Inflow test', 'Well integrity'],
  intro: 'Chapter fourteen: the BOP and well barriers. This is the equipment, and the way of thinking, that keeps a well under control, even when something fails.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0b2d45'; ctx.fillRect(0, 0, 700, 900);
    SS.bopStack(ctx, 330, 650, 0.78, { t, labels: false, annular: 0.5 + 0.5 * Math.sin(t * 0.8) });
    ctx.restore();
    ctx.strokeStyle = rgba(C.red, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [bopScene, ctrlScene, barrierScene],
};
