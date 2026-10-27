'use strict';
const K = require('../engine/core');
const WL = require('../art/well');
const ST = require('../art/string');
const I = require('../art/icons');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, dimLine, para, richLine } = K;

const BASE = {
  cx: 300, seaTop: 70, seabed: 190, td: 920,
  layers: [{ to: 280, kind: 'clay' }, { to: 420, kind: 'rock2' }, { to: 560, kind: 'clay' }, { to: 690, kind: 'rock3' }, { to: 790, kind: 'shale' }, { to: 870, kind: 'sand' }, { to: 940, kind: 'rock4' }],
};
const STRINGS = [
  { name: '30" conductor', hole: '36"', hw: 64, holeHw: 76, top: 190, shoe: 262, toc: 190 },
  { name: '20" surface casing', hole: '26"', hw: 52, holeHw: 62, top: 190, shoe: 400, toc: 190 },
  { name: '13⅜" intermediate', hole: '17½"', hw: 41, holeHw: 49, top: 190, shoe: 600, toc: 450 },
  { name: '9⅝" production', hole: '12¼"', hw: 31, holeHw: 38, top: 190, shoe: 790, toc: 650 },
];
function well(n, holeTo = 900, extra = []) {
  return { ...BASE, strings: [...STRINGS.slice(0, n), ...extra], hole: n >= 4 ? { hw: 24, to: holeTo } : { hw: (STRINGS[n] || STRINGS[3]).holeHw, to: holeTo } };
}
function sizeLabels(ctx, W, a, hl = -1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  W.strings.forEach((s, i) => {
    const y = s.shoe;
    const col = i === hl ? C.amber : C.text;
    line(ctx, W.cx + s.hw + 8, y - 4, 470, y - 4, rgba('#fff', 0.25), 1.5, [4, 4]);
    text(ctx, s.name, 480, y + 2, { size: 22, weight: 800, color: col });
    if (s.hole) text(ctx, `in ${s.hole} hole`, 480, y + 28, { size: 17, weight: 600, color: C.dim });
  });
  if (W.hole && W.strings.length >= 4) { text(ctx, '8½" open hole (reservoir)', 480, W.hole.to - 10, { size: 22, weight: 800, color: hl === 9 ? C.amber : C.sand }); }
  ctx.restore();
}

// ------------------------------------------------------------ casing programme
const progScene = {
  id: 'programme',
  title: 'The casing programme',
  blurb: 'A well is built like a telescope: each section smaller than the last.',
  beats: [
    {
      term: 'Well design & casing programme', no: 'brønndesign / foringsrørprogram',
      def: 'The plan for the well’s architecture: which hole sizes are drilled to which depths, and which casing strings are run and cemented in them. Summarised in the well schematic.',
      ex: 'Can you send me the latest well schematic?',
      say: 'The well design, or casing programme, lays out the architecture of the well: which hole sizes are drilled to which depths, and which steel casing strings are run and cemented. It is summarised in the well schematic.',
    },
    {
      term: 'Hole section', no: 'seksjon',
      def: 'One stage of the well: drill a hole size to the planned depth, then run and cement casing. Sections are named by hole size: “the 17½ section”, “the 12¼ section”, “the 8½ section”.',
      ex: 'We expect to be in the 12¼ section for about eight days.',
      say: 'The well is drilled in sections. Drill a hole to the planned depth, run casing, cement it, then drill out with a smaller bit. Sections are named by hole size, like the seventeen and a half section.',
    },
    {
      term: 'Conductor', no: 'lederør',
      def: 'The first and largest string, typically 30" (sometimes 36"), drilled and cemented or jetted into the top sediments. It supports the wellhead and BOP loads and carries the low-pressure wellhead housing.',
      say: 'The first string is the conductor, typically thirty inch. It is set just below the seabed and carries the weight of the wellhead and BOP.',
    },
    {
      term: 'Surface casing', no: 'overflatefôringsrør',
      def: 'Typically 20" (or 18⅝"), set a few hundred metres below the seabed. It carries the high-pressure wellhead housing, and it is the first string the BOP is installed on.',
      say: 'Next comes the surface casing, often twenty inch. It carries the high pressure wellhead housing, and once it is set, the BOP and riser can be installed.',
    },
    {
      term: 'Intermediate casing', no: 'mellomfôringsrør',
      def: 'One or more strings, e.g. 13⅜", that isolate unstable formations, losses or pressure ramps, so the next section can use a different mud weight.',
      say: 'Intermediate casing, for example thirteen and three eighths, isolates troublesome formations, like unstable shales or a pressure ramp, so the next section can use a different mud weight.',
    },
    {
      term: 'Production casing', no: 'produksjonsfôringsrør',
      def: 'The string set above or through the reservoir, often 9⅝" or 10¾". In an exploration well it is typically the last full string before drilling the reservoir section, and the one a well test would be run in.',
      say: 'The production casing, often nine and five eighths, is set just above or through the reservoir. In an exploration well it is usually the last full string before the reservoir is drilled.',
    },
    {
      term: 'Liner', no: 'forlengelsesrør (liner)',
      def: 'A casing string that does not go all the way to the wellhead: it is hung off inside the previous casing, near its shoe. Saves steel, weight and time. E.g. a 7" liner below 9⅝" casing.',
      ex: 'We’ll run a 7-inch liner if the pressure comes in high.',
      say: 'A liner is a casing string that does not reach back to the wellhead. It hangs inside the previous casing, near its shoe, which saves steel and rig time. For example, a seven inch liner below the nine and five eighths.',
    },
    {
      term: 'Liner hanger & tieback', no: 'linerhenger / tilbakekobling',
      def: 'The liner hanger grips the inside of the previous casing with slips and seals the liner top with a packer. A tieback string can later connect the liner top back up to the wellhead.',
      say: 'The liner is held by a liner hanger, with slips that bite into the casing above, and a packer that seals the top. Later, a tieback string can connect the liner back up to the wellhead.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const W = well(4, 900);
      WL.drawWell(ctx, W, { t });
      sizeLabels(ctx, W, S.p(0, 0.8, 1.0));
      tag(ctx, 'telescopic design', 830, 120, { size: 24, color: C.cyan, alpha: S.p(0, 0.6, 3), fill: 'rgba(7,17,28,0.9)' });
    } else if (bi === 1) {
      // animate drilling and casing sections one after another
      const u = clamp(S.since(1) / Math.max(4, S.bd - 1));
      const k = Math.min(3, Math.floor(u * 4));
      const f = (u * 4) % 1;
      const n = k;
      const s = STRINGS[k];
      const holeTo = lerp(k ? STRINGS[k - 1].shoe : 190, s.shoe + 6, clamp(f / 0.6));
      const runCasing = f > 0.6;
      const strings = STRINGS.slice(0, n);
      if (runCasing) strings.push({ ...s, shoe: lerp(190, s.shoe, clamp((f - 0.6) / 0.35)), toc: s.shoe });
      const W = { ...BASE, strings, hole: { hw: s.holeHw, to: holeTo } };
      WL.drawWell(ctx, W, { t, string: runCasing ? null : { to: holeTo, from: 0 } });
      fillRR(ctx, 620, 200, 520, 220, 18, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, `the ${s.hole} section`, 880, 270, { size: 40, weight: 900, align: 'center', color: C.amber });
      text(ctx, runCasing ? `running ${s.name}` : `drilling ${s.hole} hole…`, 880, 330, { size: 26, weight: 700, align: 'center', color: C.text });
      const steps = ['drill', 'run casing', 'cement', 'drill out'];
      steps.forEach((st, i) => text(ctx, `${i + 1}. ${st}`, 660 + i * 125, 390, { size: 18, weight: 700, color: (runCasing ? i <= 1 : i === 0) ? C.text : C.faint }));
    } else if (bi >= 2 && bi <= 5) {
      const idx = bi - 2;
      const W = well(4, 900);
      WL.drawWell(ctx, W, { t, hlString: idx, hlA: S.hl(bi) });
      sizeLabels(ctx, W, 1, idx);
      const notes = [
        ['carries wellhead & BOP loads', 'low-pressure housing (30")'],
        ['high-pressure wellhead housing', 'BOP installed after this string'],
        ['isolates problem zones', 'unstable shale · pressure ramp'],
        ['last string before the reservoir', 'well test would be run in it'],
      ][idx];
      fillRR(ctx, 640, 120, 520, 140, 16, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, notes[0], 900, 178, { size: 24, weight: 800, align: 'center', color: C.text, alpha: S.p(bi, 0.5, 0.8) });
      text(ctx, notes[1], 900, 220, { size: 20, weight: 600, align: 'center', color: C.dim, alpha: S.p(bi, 0.5, 1.4) });
    } else {
      const liner = { name: '7" liner', hole: '8½"', hw: 22, holeHw: 27, top: 742, shoe: 900, toc: 742 };
      const extra = [liner];
      const W = { ...BASE, strings: [...STRINGS, ...extra], hole: { hw: 17, to: 925 } };
      if (bi === 7) {
        const tb = S.p(7, 2, 3.5);
        if (tb > 0) W.strings = [...STRINGS, liner, { name: 'tieback', hw: 22, holeHw: 25, top: 190, shoe: lerp(190, 742, tb), toc: null }];
      }
      WL.drawWell(ctx, W, { t, hlString: 4, hlA: bi === 6 ? S.hl(6) : 0 });
      // liner hanger detail
      if (bi === 7) {
        callout(ctx, 300 + 30, 744, 520, 640, 'LINER HANGER', { color: C.amber, size: 22, t: S.p(7, 0.6, 0.6), sub: 'slips + liner top packer' });
        const tb = S.p(7, 2, 3.5);
        if (tb > 0.95) callout(ctx, 322, 400, 520, 330, 'TIEBACK string', { color: C.cyan, size: 22, t: S.p(7, 0.6, 5.5) });
        // zoom inset
        fillRR(ctx, 820, 520, 330, 330, 16, '#0d1f2f', C.panelEdge, 2);
        const zx = 985, zy = 690;
        ST.metal(ctx, zx - 110, 540, 22, 300, '#b8c4cf'); ST.metal(ctx, zx + 88, 540, 22, 300, '#b8c4cf');
        ST.metal(ctx, zx - 70, 650, 18, 190, '#c8d3dd'); ST.metal(ctx, zx + 52, 650, 18, 190, '#c8d3dd');
        ctx.fillStyle = '#e0a83a'; poly(ctx, [[zx - 88, 660], [zx - 72, 660], [zx - 72, 700], [zx - 88, 690]]); ctx.fill(); poly(ctx, [[zx + 88, 660], [zx + 70, 660], [zx + 70, 700], [zx + 88, 690]]); ctx.fill();
        fillRR(ctx, zx - 88, 620, 18, 30, 4, C.purple); fillRR(ctx, zx + 70, 620, 18, 30, 4, C.purple);
        text(ctx, 'slips', zx, 730, { size: 18, weight: 700, align: 'center', color: '#e0a83a' });
        text(ctx, 'packer', zx, 610, { size: 18, weight: 700, align: 'center', color: C.purple });
      } else {
        callout(ctx, 300 + 22, 820, 520, 720, '7" LINER', { color: C.amber, size: 24, t: S.p(6, 0.6, 0.6), sub: 'hung inside the 9⅝"' });
        tag(ctx, 'does not reach the wellhead', 800, 300, { size: 22, color: C.cyan, alpha: S.p(6, 0.6, 3), fill: 'rgba(7,17,28,0.9)' });
      }
    }
  },
};

// ------------------------------------------------------------ casing hardware & design
const detailScene = {
  id: 'casingdesign',
  title: 'Casing hardware and casing design',
  blurb: 'What sits at the bottom of the casing, and what the steel must withstand.',
  beats: [
    {
      term: 'Casing shoe & shoe track', no: 'foringsrørsko',
      def: 'The shoe is the rounded guide at the very bottom of the casing; the shoe track is the one to three joints between the shoe and the float collar. Cement is left inside the shoe track and drilled out later.',
      ex: 'Drill out the shoe track and three metres of new formation, then do the FIT.',
      say: 'At the bottom of every casing string sits the shoe, a rounded guide. Above it is the shoe track, a joint or two of casing ending at the float collar. Cement is left inside the shoe track, and drilled out before the next section.',
    },
    {
      term: 'Float collar & float shoe', no: 'flottørkrage / flottørsko',
      def: 'One-way valves in the shoe track. They let mud and cement be pumped down but stop the heavier cement from U-tubing back up inside the casing. The float collar is also where the cement plugs land.',
      say: 'The float collar and float shoe contain one way valves. Cement can be pumped down and out, but the heavier cement cannot flow back up inside the casing. The float collar is also where the cementing plugs land.',
    },
    {
      term: 'Centralisers', no: 'sentralisatorer',
      def: 'Bow-spring or rigid devices clamped on the casing to hold it in the middle of the hole (stand-off), so cement can surround it evenly. Poor centralisation leaves mud channels in the cement.',
      say: 'Centralisers are clamped onto the casing to keep it in the middle of the hole, so cement can flow all the way around it. Without them the casing lies against the wall, and the cement leaves channels of mud.',
    },
    {
      term: 'Casing grade, weight & connection', no: 'stålkvalitet / vekt / gjenger',
      def: 'Casing is specified by size, weight and grade, e.g. 9⅝" 53.5 ppf P110: weight in pounds per foot sets the wall thickness; grade gives the minimum yield strength (P110 = 110,000 psi). Premium connections are gas-tight; API buttress (BTC) is simpler.',
      ex: 'Run 13⅜ 72 ppf L80 with premium connections.',
      say: 'Casing is specified by size, weight and grade, like nine and five eighths, fifty three point five pound, P one ten. The weight in pounds per foot sets the wall thickness. The grade gives the steel’s minimum yield strength, here one hundred and ten thousand psi. Premium connections are gas tight.',
    },
    {
      term: 'Burst, collapse & tension', no: 'sprengning / kollaps / strekk',
      def: 'The three classic casing load cases: burst (internal pressure exceeds external), collapse (external exceeds internal) and tension (axial load from weight and pulling). Each is checked with a design factor, plus a combined triaxial (von Mises) check.',
      say: 'Casing design checks three load cases. Burst, when the pressure inside exceeds the pressure outside. Collapse, when the outside pressure wins. And tension, from the string’s own weight and overpull. Each gets a design factor, plus a combined triaxial check. Familiar ground for a mechanical engineer.',
    },
    {
      term: 'Casing setting depth', no: 'settedyp',
      def: 'Where each casing shoe is placed, chosen from the pore and fracture pressure window, kick tolerance, unstable or loss zones, shallow hazards and regulatory requirements. Often a trade-off between cost and risk.',
      ex: 'We may set the 13⅜ shallower if we see the ramp early.',
      say: 'Casing setting depths are chosen from the pressure window and kick tolerance, from unstable or loss zones, and from shallow hazards. Setting a shoe too shallow or too deep can cost a whole section.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 1) {
      // shoe track cross-section
      const x = 360;
      K.lithoFill(ctx, 'rock3', 0, 0, 760, 940, 4);
      ctx.fillStyle = '#5e4128'; ctx.fillRect(x - 170, 0, 340, 920);
      // cement annulus
      ctx.fillStyle = C.cement; ctx.fillRect(x - 170, 300, 50, 600); ctx.fillRect(x + 120, 300, 50, 600);
      K.speckle(ctx, x - 170, 300, 50, 600, 200, rgba('#000', 0.2), 3); K.speckle(ctx, x + 120, 300, 50, 600, 200, rgba('#000', 0.2), 4);
      ST.metal(ctx, x - 120, 0, 20, 880, '#b8c4cf'); ST.metal(ctx, x + 100, 0, 20, 880, '#b8c4cf');
      // inside: mud above float collar, cement in shoe track
      ctx.fillStyle = C.mud; ctx.fillRect(x - 100, 0, 200, 560);
      ctx.fillStyle = C.cement; ctx.fillRect(x - 100, 600, 200, 280);
      K.speckle(ctx, x - 100, 600, 200, 280, 150, rgba('#000', 0.2), 5);
      // float collar
      fillRR(ctx, x - 100, 560, 200, 40, 4, '#7d8a96', '#56687a', 2);
      // landed plugs
      fillRR(ctx, x - 90, 520, 180, 40, 10, C.red); fillRR(ctx, x - 90, 480, 180, 40, 10, '#1f2937');
      // shoe
      ctx.beginPath(); ctx.moveTo(x - 120, 880); ctx.lineTo(x + 120, 880); ctx.quadraticCurveTo(x + 120, 930, x, 935); ctx.quadraticCurveTo(x - 120, 930, x - 120, 880); ctx.closePath();
      ctx.fillStyle = '#c9cfd6'; ctx.fill();
      dimLine(ctx, x + 200, 600, x + 200, 880, 'shoe track', { color: C.cyan, size: 20 });
      if (bi === 0) {
        callout(ctx, x + 60, 910, 560, 900, 'SHOE', { color: C.amber, size: 24, t: S.p(0, 0.6, 0.6) });
        callout(ctx, x + 100, 580, 560, 470, 'FLOAT COLLAR', { color: C.amber, size: 22, t: S.p(0, 0.6, 3.5) });
        callout(ctx, x, 740, 560, 760, 'cement left inside', { color: C.cement, size: 20, t: S.p(0, 0.6, 5.5) });
      } else {
        // valves showing one-way action
        const ph = (S.since(1) * 0.25) % 1;
        const down = ph < 0.55;
        for (const vy of [580, 900]) {
          const open = down ? 1 : 0;
          fillRR(ctx, x - 30, vy - 12 + open * 14, 60, 18, 6, down ? '#cfd8e3' : C.green);
        }
        if (down) K.flow(ctx, [[x, 300], [x, 935]], t, { spacing: 40, speed: 120, color: '#d3d7db', r: 6 });
        else for (let k = 0; k < 5; k++) { const yy = 930 - ((t * 60 + k * 40) % 140); circle(ctx, x + Math.sin(k) * 40, yy, 6, C.cement); }
        tag(ctx, down ? 'pumping cement down: valves open' : 'pumps off: valves stop U-tubing', 380, 120, { size: 22, color: down ? C.text : C.green, fill: 'rgba(7,17,28,0.9)' });
        callout(ctx, x + 30, 580, 560, 480, 'float valve', { color: C.green, size: 22, t: S.p(1, 0.6, 0.6) });
        callout(ctx, x + 30, 900, 560, 800, 'float shoe', { color: C.green, size: 22, t: S.p(1, 0.6, 1.4) });
        callout(ctx, x + 80, 520, 560, 380, 'plugs land here', { color: C.red, size: 20, t: S.p(1, 0.6, 5) });
      }
      // right info
      fillRR(ctx, 800, 140, 360, 220, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'BOTTOM OF THE CASING', 980, 190, { size: 20, weight: 900, align: 'center', color: C.amber, spacing: 1 });
      ['float collar', 'shoe track (1–3 joints)', 'float / guide shoe'].forEach((s2, i) => text(ctx, `${i + 1}. ${s2}`, 830, 240 + i * 40, { size: 22, weight: 700, color: C.text }));
    }
    if (bi === 2) {
      const xs = [300, 850];
      xs.forEach((x, i) => {
        const cent = i === 1;
        K.lithoFill(ctx, 'rock3', x - 260, 120, 520, 720, 3 + i);
        ctx.fillStyle = '#5e4128'; ctx.fillRect(x - 150, 120, 300, 720);
        const off = cent ? 0 : 90;
        const cx = x + off;
        // cement fill: missing on narrow side when not centralised
        ctx.fillStyle = C.cement;
        if (cent) { ctx.fillRect(x - 150, 200, 300, 600); }
        else { ctx.fillRect(x - 150, 200, 150 + off - 60, 600); }
        ST.metal(ctx, cx - 60, 120, 120, 720, '#b8c4cf');
        if (cent) for (let y = 260; y < 800; y += 180) { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + sd * 60, y); ctx.quadraticCurveTo(cx + sd * 150, y + 45, cx + sd * 60, y + 90); ctx.strokeStyle = C.amber; ctx.lineWidth = 6; ctx.stroke(); } }
        text(ctx, cent ? 'centralised' : 'no centralisers', x, 100, { size: 26, weight: 900, align: 'center', color: cent ? C.green : C.red });
        if (!cent) tag(ctx, 'mud channel!', x + 120, 500, { size: 20, color: C.red, fill: 'rgba(7,17,28,0.9)' });
      });
      text(ctx, 'stand-off = how centred the casing is', 598, 890, { size: 24, weight: 700, align: 'center', color: C.dim, alpha: S.p(2, 0.6, 3) });
    }
    if (bi === 3) {
      const a = S.p(3, 0.6, 0.3);
      ctx.save(); ctx.globalAlpha *= a;
      // casing joint with stencil text
      ST.metal(ctx, 120, 200, 960, 120, '#b8c4cf');
      ST.metal(ctx, 1040, 186, 90, 148, '#cfd8e3');
      text(ctx, '9⅝"   53.5 ppf   P110   premium', 520, 275, { size: 40, weight: 900, align: 'center', color: '#2b3540' });
      ctx.restore();
      const rows = [['9⅝"', 'outside diameter', C.text], ['53.5 ppf', 'weight → wall thickness (≈ 0.545")', C.cyan], ['P110', 'grade → min. yield 110,000 psi', C.amber], ['premium', 'gas-tight connection (vs API BTC)', C.green]];
      rows.forEach(([k, v, col], i) => {
        const vv = S.p(3, 0.5, 1.5 + i * 1.2);
        fillRR(ctx, 160, 400 + i * 110, 880, 90, 14, rgba(col, 0.08 * vv), rgba(col, 0.5 * vv), 2);
        text(ctx, k, 190, 456 + i * 110, { size: 34, weight: 900, color: col, alpha: vv });
        text(ctx, v, 430, 456 + i * 110, { size: 26, weight: 700, color: C.text, alpha: vv });
      });
    }
    if (bi === 4) {
      const cases = [['BURST', 'P_in > P_out', C.red, 220], ['COLLAPSE', 'P_out > P_in', C.blue, 598], ['TENSION', 'axial pull', C.amber, 976]];
      cases.forEach(([n, d, col, x], i) => {
        const v = S.p(4, 0.6, 0.6 + i * 2.2);
        if (v <= 0) return;
        ctx.save(); ctx.globalAlpha *= v;
        const cy = 470;
        const pulse = 0.5 + 0.5 * Math.sin(t * 3);
        if (i < 2) {
          const r = 120 + (i === 0 ? 8 : -8) * pulse;
          circle(ctx, x, cy, r, '#3c5368', '#b8c4cf', 22);
          circle(ctx, x, cy, r - 30, i === 0 ? rgba(C.red, 0.35) : '#0d1f2f');
          for (let k = 0; k < 8; k++) {
            const a2 = (k / 8) * Math.PI * 2;
            if (i === 0) arrow(ctx, x + Math.cos(a2) * 40, cy + Math.sin(a2) * 40, x + Math.cos(a2) * 85, cy + Math.sin(a2) * 85, { color: C.red, lw: 4, head: 12 });
            else arrow(ctx, x + Math.cos(a2) * 200, cy + Math.sin(a2) * 200, x + Math.cos(a2) * 150, cy + Math.sin(a2) * 150, { color: C.blue, lw: 4, head: 12 });
          }
        } else {
          ST.metal(ctx, x - 50, cy - 180 - 10 * pulse, 100, 360 + 20 * pulse, '#b8c4cf');
          arrow(ctx, x, cy - 200, x, cy - 270, { color: C.amber, lw: 6, head: 18 });
          arrow(ctx, x, cy + 200, x, cy + 270, { color: C.amber, lw: 6, head: 18 });
        }
        text(ctx, n, x, 780, { size: 36, weight: 900, align: 'center', color: col });
        text(ctx, d, x, 820, { size: 22, weight: 700, align: 'center', color: C.dim, fam: K.MONO });
        ctx.restore();
      });
      tag(ctx, '+ triaxial (von Mises) check with design factors', 598, 890, { size: 22, color: C.text, alpha: S.p(4, 0.6, 8) });
    }
    if (bi === 5) {
      const ax = WL.chart(ctx, 180, 140, 560, 720, { dMax: 4000 });
      WL.curve(ctx, ax, WL.PPFG.pore, 4000, 1, C.red, 4);
      WL.curve(ctx, ax, WL.PPFG.frac, 4000, 1, C.green, 4);
      const shoes = [[600, '20"'], [1700, '13⅜"'], [2650, '9⅝"']];
      shoes.forEach(([d, n], i) => {
        const v = S.p(5, 0.5, 1 + i * 1.2, ease.outBack);
        if (v <= 0) return;
        ctx.save(); ctx.globalAlpha *= clamp(v);
        line(ctx, ax.X(0.9), ax.Y(d), ax.X(2.3), ax.Y(d), C.amber, 2, [8, 6]);
        poly(ctx, [[ax.X(2.3) + 6, ax.Y(d)], [ax.X(2.3) + 30, ax.Y(d)], [ax.X(2.3) + 6, ax.Y(d) - 24]]); ctx.fillStyle = C.steel; ctx.fill();
        text(ctx, n + ' shoe', ax.X(2.3) + 40, ax.Y(d) + 6, { size: 20, weight: 800, color: C.text });
        ctx.restore();
      });
      const why = ['pressure window', 'kick tolerance', 'unstable / loss zones', 'shallow hazards'];
      why.forEach((w2, i) => text(ctx, '•  ' + w2, 870, 560 + i * 44, { size: 22, weight: 700, color: C.text, alpha: S.p(5, 0.4, 5 + i * 0.5) }));
    }
  },
};

module.exports = {
  id: 'ch08', num: 8, title: 'Well Design & Casing',
  subtitle: 'The telescope of steel that makes a well',
  topics: ['Well schematic', 'Hole section', 'Conductor', 'Surface casing', 'Intermediate', 'Production casing', 'Liner', 'Liner hanger', 'Shoe track', 'Float collar', 'Centralisers', 'Grade & weight', 'Burst & collapse', 'Setting depth'],
  intro: 'Chapter eight: well design and casing. A well is built like a telescope of steel pipes, each one cemented in place. Here is how it fits together.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.translate(330, 420); ctx.scale(0.95, 0.95); ctx.translate(-300, -470);
    WL.drawWell(ctx, { ...BASE, w: 700, strings: STRINGS, hole: { hw: 24, to: 900 } }, { t });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [progScene, detailScene],
};
