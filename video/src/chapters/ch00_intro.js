'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const I = require('../art/icons');
const { C, rgba, text, fillRR, arrow, circle, line, clamp, lerp, ease, tag, para, gauge } = K;

function titleArt(ctx, t) {
  // semi-sub at sea, framed in a circle
  ctx.save();
  ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
  R.sky(ctx, 700, 470, { top: '#0c2236', bot: '#24557c' });
  // stars/moon
  I.moon(ctx, 470, 190, 60);
  R.sea(ctx, 700, 470, 760, t, { amp: 7 });
  R.semi(ctx, 330, 470, 1.15, t, { heave: Math.sin(t * 0.9) * 4 });
  ctx.restore();
  ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
}

const howto = {
  id: 'howto',
  title: 'How this video works',
  blurb: 'Each term gets an animation and a term card. Chapters follow the life of an exploration well, from licence to plug and abandonment.',
  beats: [
    {
      term: 'Drilling & Wells', abbr: 'D&W', no: 'Boring og brønn',
      def: 'The discipline that plans and delivers wells: drilling, completion, intervention and plug & abandonment. Its lingo mixes English oilfield slang, Norwegian, acronyms and two unit systems.',
      ex: 'Welcome to D&W. Grab a coffee, the morning meeting starts at half seven.',
      say: 'Every term gets an animation on the left, and a term card on the right: the English term, any abbreviation, the Norwegian word you will meet offshore and in documents, a short definition, and an example of how you might hear it used.',
      min: 14,
    },
    {
      say: 'The chapters follow the life of an exploration well: the licence and the geology, the rig and the drilling, well control, evaluation, and finally plugging the well. We finish with the people and safety culture offshore, and a rapid-fire acronym recap.',
      min: 13,
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    if (S.bi <= 0) {
      // annotated pointers to the term card, aligned with the real card layout
      const { layoutCard } = require('../engine/ui');
      const L = layoutCard(ctx, S.beats[0], K.LAYOUT.panel);
      const ys = {};
      for (const op of L.ops) ys[op.k] = op.y - K.LAYOUT.stage.y;
      const items = [
        ['1', 'Term', 'the word itself', ys.title - 14],
        ['2', 'Abbreviation', 'as written on the rig', ys.abbr],
        ['3', 'Norwegian', 'what you hear offshore', ys.no + 64],
        ['4', 'Definition', 'in plain words', ys.def + 40],
        ['5', 'Example', 'how it is used', ys.ex],
      ];
      const tys = [items[0][3], items[1][3], items[2][3] - 64, items[3][3] - 40, items[4][3]];
      text(ctx, 'THE TERM CARD', 70, 70, { size: 22, weight: 800, color: C.amber, spacing: 3 });
      items.forEach(([n, a, b, y], i) => {
        const p = S.p(0, 0.6, 0.8 + i * 1.6, ease.out);
        if (p <= 0) return;
        const ly = [130, 230, 330, 430, 530][i];
        ctx.save(); ctx.globalAlpha *= p;
        circle(ctx, 100, ly - 8, 26, C.amber);
        text(ctx, n, 100, ly + 2, { size: 28, weight: 800, align: 'center', color: '#1a1206' });
        text(ctx, a, 145, ly - 4, { size: 34, weight: 800, color: C.text });
        text(ctx, b, 145, ly + 28, { size: 22, weight: 500, color: C.dim });
        K.curvedArrow(ctx, [[560, ly - 8], [900, ly - 8], [1060, tys[i]], [1176, tys[i]]], { color: C.amber, lw: 3, head: 16, t: p, dash: [10, 8] });
        ctx.restore();
      });
      const cy = 800;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 660, 1196, 280); ctx.clip();
      R.sky(ctx, 1196, cy, { top: '#0a1825', bot: '#163a5a' });
      R.sea(ctx, 1196, cy, 940, t, { amp: 5 });
      R.semi(ctx, 600, cy, 0.62, t, { heave: Math.sin(t) * 3 });
      ctx.restore();
    } else {
      // roadmap: life of a well
      const steps = [
        ['Licence', C.amber], ['Geology', C.sand], ['Rig', C.steel], ['Drilling', C.cyan], ['Mud & pressure', C.mudLight],
        ['Casing & cement', C.cement], ['Well control', C.red], ['Evaluation', C.green], ['P&A', C.blue], ['People & safety', C.orange],
      ];
      const pts = [];
      for (let i = 0; i < steps.length; i++) {
        const row = Math.floor(i / 5), col = i % 5;
        const x = row === 0 ? 140 + col * 230 : 140 + (4 - col) * 230;
        const y = 300 + row * 330;
        pts.push([x, y]);
      }
      const path = [];
      pts.forEach((p, i) => { path.push(p); if (i === 4) { path.push([1090, 420]); } });
      const pr = S.p(1, 7, 0.3, ease.linear);
      K.partialPolyline(ctx, [pts[0], pts[1], pts[2], pts[3], pts[4], pts[5], pts[6], pts[7], pts[8], pts[9]], pr, rgba(C.amber, 0.6), 6, [14, 10]);
      steps.forEach(([name, col], i) => {
        const a = clamp((pr * 11.2 - i * 1.05) / 0.7);
        if (a <= 0) return;
        const [x, y] = pts[i];
        ctx.save(); ctx.globalAlpha *= a;
        circle(ctx, x, y, 44 * ease.outBack(a), K.mix(col, '#0a1825', 0.7), col, 4);
        text(ctx, String(i + 1), x, y + 12, { size: 34, weight: 800, align: 'center', color: C.text });
        text(ctx, name, x, i < 5 ? y - 66 : y + 86, { size: 26, weight: 700, align: 'center', color: C.text });
        ctx.restore();
      });
      const a2 = S.p(1, 0.8, 8.5);
      tag(ctx, '+ rapid-fire acronym recap', 598, 860, { size: 26, color: C.cyan, alpha: a2 });
    }
  },
};

const units = {
  id: 'units',
  title: 'Units you will hear',
  blurb: 'The NCS mixes metric and oilfield units. Know both and convert quickly.',
  beats: [
    {
      term: 'Metric & oilfield units', listLabel: 'Metric & oilfield units',
      def: 'The NCS works mainly in metric: metres, bar, tonnes, litres. But pipe and hole sizes, thread data and many tool ratings stay in oilfield units like inches, psi and pounds per foot.',
      say: 'On the shelf you will juggle two unit systems. Depths are in metres, pressure in bar, loads in tonnes and flow in litres per minute. But pipe and hole sizes, thread data and many tool ratings stay in oilfield units, like inches, psi and pounds per foot.',
    },
    {
      term: 'Specific gravity', abbr: 'SG', no: 'egenvekt',
      def: 'Fluid density relative to water (g/cm³). Mud weights and pressure gradients on the NCS are given in SG. Seawater ≈ 1.03 SG. 1 SG = 8.33 ppg.',
      ex: 'Weight up to 1.45 SG before drilling into the reservoir.',
      say: 'Mud weight, and pressure gradients in general, are given in SG, specific gravity, which is simply grams per cubic centimetre. Seawater is about one point zero three. In American units, one SG is eight point three three pounds per gallon.',
    },
    {
      term: 'bar & psi', abbr: 'bar | psi',
      def: 'Pressure. 1 bar = 14.5 psi = 100 kPa. Daily pressures are in bar, but equipment ratings often stay in psi: a 10,000 psi BOP ≈ 690 bar.',
      ex: 'Test the casing to 345 bar, that’s five thousand psi.',
      say: 'Pressure is in bar. One bar is about fourteen and a half psi. But equipment ratings often stay in psi, so a ten thousand psi BOP is rated to about six hundred and ninety bar.',
    },
    {
      term: 'Inch sizes', abbr: 'in | "',
      def: 'Hole, casing and pipe sizes are in inches, with fractions. Holes: 36", 26", 17½", 12¼", 8½". Casing: 30", 20", 13⅜", 9⅝", 7".',
      ex: 'We’re drilling the twelve-and-a-quarter section.',
      say: 'Hole and pipe sizes are always in inches, often with fractions. You will hear, the twelve and a quarter section, or, running nine and five eighths. People usually drop the word inch.',
      tts: 'Hole and pipe sizes are always in inches, often with fractions. You will hear, the twelve and a quarter section, or, running nine and five eighths. People usually drop the word inch.',
    },
    {
      term: 'Flow rate & strokes', abbr: 'lpm | spm',
      def: 'Pump rate in litres per minute (lpm) or pump strokes per minute (spm). A 12¼" section is typically drilled with 3,000–4,000 lpm.',
      ex: 'Stage the pumps up to 3,500 litres a minute.',
      say: 'Pump rate is given in litres per minute, or in strokes per minute on the mud pumps. Three to four thousand litres per minute is typical in a twelve and a quarter inch section.',
    },
    {
      term: 'Weight & torque', abbr: 't | kN | kNm',
      def: 'Hook load in tonnes or kN (1 t ≈ 9.81 kN), sometimes kilo-pounds (klbs). Torque in kNm (or ft·lbs). Casing weight in pounds per foot (ppf), e.g. 9⅝" 53.5 ppf.',
      say: 'Loads are in tonnes or kilonewtons, where one tonne is about ten kilonewtons, and you will still hear kilo pounds. Torque is in kilonewton metres, and casing is specified in pounds per foot.',
    },
  ],
  draw(ctx, S) {
    const t = S.t, Wd = S.W;
    const bi = Math.max(0, S.bi);
    // 0: two columns
    if (bi === 0) {
      const a = S.p(0, 0.6);
      const colL = 300, colR = 900;
      text(ctx, 'METRIC', colL, 130, { size: 40, weight: 800, align: 'center', color: C.cyan, alpha: a });
      text(ctx, 'OILFIELD', colR, 130, { size: 40, weight: 800, align: 'center', color: C.amber, alpha: a });
      line(ctx, 600, 90, 600, 860, C.line, 2);
      const L = [['m', 'depth, length'], ['bar', 'pressure'], ['t / kN', 'hook load'], ['L/min', 'flow rate'], ['m³', 'volumes'], ['°C', 'temperature']];
      const Rr = [['in', 'hole & pipe sizes'], ['psi', 'equipment ratings'], ['ppf', 'casing weight'], ['ft·lbs', 'thread torque'], ['bbl', 'volumes (some)'], ['ppg', 'mud weight (rare)']];
      L.forEach(([u, d], i) => {
        const p = S.p(0, 0.5, 0.6 + i * 0.5, ease.outBack);
        if (p <= 0) return;
        ctx.save(); ctx.globalAlpha *= clamp(p);
        fillRR(ctx, colL - 230, 190 + i * 108, 460, 86, 14, rgba(C.cyan, 0.1), rgba(C.cyan, 0.6), 2);
        text(ctx, u, colL - 200, 245 + i * 108, { size: 38, weight: 800, color: C.text, fam: K.MONO });
        text(ctx, d, colL + 200, 243 + i * 108, { size: 24, weight: 500, color: C.dim, align: 'right' });
        ctx.restore();
      });
      Rr.forEach(([u, d], i) => {
        const p = S.p(0, 0.5, 4.5 + i * 0.5, ease.outBack);
        if (p <= 0) return;
        ctx.save(); ctx.globalAlpha *= clamp(p);
        fillRR(ctx, colR - 230, 190 + i * 108, 460, 86, 14, rgba(C.amber, 0.1), rgba(C.amber, 0.6), 2);
        text(ctx, u, colR - 200, 245 + i * 108, { size: 38, weight: 800, color: C.text, fam: K.MONO });
        text(ctx, d, colR + 200, 243 + i * 108, { size: 24, weight: 500, color: C.dim, align: 'right' });
        ctx.restore();
      });
    }
    if (bi === 1) {
      // beakers with densities
      const fl = [['Fresh water', 1.0, '#5fa8e8'], ['Seawater', 1.03, '#2f7fc0'], ['Typical mud', 1.3, C.mud], ['Heavy mud', 2.0, C.mudDark]];
      fl.forEach(([name, sg, col], i) => {
        const x = 170 + i * 285, y = 330;
        const p = S.p(1, 0.8, 0.3 + i * 0.6);
        // beaker
        ctx.save();
        ctx.strokeStyle = '#cfe0ee'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(x - 80, y - 150); ctx.lineTo(x - 80, y + 120); ctx.quadraticCurveTo(x - 80, y + 140, x - 60, y + 140); ctx.lineTo(x + 60, y + 140); ctx.quadraticCurveTo(x + 80, y + 140, x + 80, y + 120); ctx.lineTo(x + 80, y - 150); ctx.stroke();
        const lvl = 230 * p;
        ctx.fillStyle = col; ctx.fillRect(x - 76, y + 136 - lvl, 152, lvl);
        ctx.restore();
        text(ctx, sg.toFixed(2) + ' SG', x, y + 210, { size: 38, weight: 800, align: 'center', color: C.text, alpha: p });
        text(ctx, name, x, y + 252, { size: 24, weight: 600, align: 'center', color: C.dim, alpha: p });
        text(ctx, (sg * 8.33).toFixed(1) + ' ppg', x, y + 290, { size: 22, weight: 600, align: 'center', color: C.amber, alpha: S.p(1, 0.6, 6.5) });
      });
      const a = S.p(1, 0.6, 3.2);
      fillRR(ctx, 250, 720, 700, 110, 16, rgba(C.amber, 0.12), C.amber, 2);
      ctx.save(); ctx.globalAlpha *= a;
      K.richLine(ctx, '1 SG = 1 g/cm³ = 1,000 kg/m³ = ==8.33 ppg==', 290, 790, { size: 34, color: C.text });
      ctx.restore();
    }
    if (bi === 2) {
      const p = S.p(2, 3.5, 0.5, ease.inOut);
      const bar = 689.5 * p;
      gauge(ctx, 330, 400, 190, bar, { min: 0, max: 1000, unit: 'bar', label: 'PRESSURE (bar)', color: C.cyan, decimals: 0 });
      gauge(ctx, 870, 400, 190, bar * 14.5038, { min: 0, max: 15000, unit: 'psi', label: 'SAME PRESSURE (psi)', color: C.amber, decimals: 0 });
      const a = S.p(2, 0.6, 1.0);
      fillRR(ctx, 250, 720, 700, 110, 16, rgba(C.cyan, 0.12), C.cyan, 2);
      ctx.save(); ctx.globalAlpha *= a;
      K.richLine(ctx, '1 bar = ==14.5 psi==  ·  10,000 psi ≈ ==690 bar==', 285, 790, { size: 34, color: C.text });
      ctx.restore();
    }
    if (bi === 3) {
      const holes = [['36"', 36, C.steelDark], ['26"', 26, C.rock3], ['17½"', 17.5, C.sandDark], ['12¼"', 12.25, C.mud], ['8½"', 8.5, C.amber]];
      const cx = 420, cy = 470, k = 11.5;
      holes.forEach(([lab, d, col], i) => {
        const p = S.p(3, 0.7, 0.4 + i * 0.9, ease.outBack);
        if (p <= 0) return;
        circle(ctx, cx, cy, (d * k) / 2 * clamp(p, 0, 1.2), rgba(col, 0.35), col, 4);
        const lx = 820, ly = 210 + i * 120;
        ctx.save(); ctx.globalAlpha *= clamp(p);
        line(ctx, cx + (d * k) / 2 * 0.7, cy - (d * k) / 2 * 0.7, lx - 20, ly - 10, rgba(col, 0.8), 2);
        text(ctx, lab, lx, ly, { size: 44, weight: 800, color: C.text });
        text(ctx, (d * 25.4).toFixed(0) + ' mm', lx + 175, ly, { size: 26, weight: 500, color: C.dim });
        ctx.restore();
      });
      text(ctx, 'Typical hole sizes, largest drilled first', 420, 880, { size: 24, weight: 600, align: 'center', color: C.dim, alpha: S.p(3, 0.6, 5) });
    }
    if (bi === 4) {
      // mud pump strokes and flow
      const spm = 80 + 30 * S.p(4, 4, 0.5);
      const ang = t * (spm / 60) * Math.PI * 2;
      const px = 260, py = 420;
      fillRR(ctx, px - 170, py - 110, 340, 220, 18, '#25415a', C.steelMid, 3);
      text(ctx, 'MUD PUMP', px, py - 130, { size: 24, weight: 800, align: 'center', color: C.dim });
      for (let i = 0; i < 3; i++) {
        const off = Math.sin(ang + (i * Math.PI * 2) / 3) * 34;
        fillRR(ctx, px - 120 + i * 90, py - 60 + off, 60, 80, 6, C.steel);
        fillRR(ctx, px - 98 + i * 90, py + 20 + off, 16, 70, 4, C.steelMid);
      }
      const path = [[px + 170, py], [560, py], [560, 300], [1100, 300]];
      K.partialPolyline(ctx, path, 1, '#2d4b63', 30);
      K.flow(ctx, path, t, { spacing: 30, speed: 40 + spm * 2, color: C.mudLight, r: 7 });
      fillRR(ctx, 640, 470, 460, 200, 16, rgba(C.amber, 0.1), C.amber, 2);
      text(ctx, Math.round(spm) + ' spm', 870, 550, { size: 54, weight: 800, align: 'center', color: C.text, fam: K.MONO });
      text(ctx, '≈ ' + Math.round(spm * 38) + ' lpm', 870, 625, { size: 40, weight: 700, align: 'center', color: C.amber, fam: K.MONO });
      text(ctx, 'flow = strokes × litres per stroke', 640, 730, { size: 24, weight: 500, color: C.dim });
    }
    if (bi === 5) {
      // hook with load, torque wrench
      const p = S.p(5, 2.5, 0.3);
      const hx = 300, hy = 150;
      line(ctx, hx - 20, 60, hx - 20, hy + 140 * p, C.steel, 4);
      line(ctx, hx + 20, 60, hx + 20, hy + 140 * p, C.steel, 4);
      fillRR(ctx, hx - 60, hy + 130 * p, 120, 70, 10, C.amber);
      text(ctx, 'HOOK', hx, hy + 175 * p, { size: 22, weight: 800, align: 'center', color: '#1a1206' });
      fillRR(ctx, hx - 110, hy + 230 + 140 * p - 140, 220, 160, 12, '#3c5368', C.steelMid, 3);
      const tonnes = Math.round(180 * p);
      text(ctx, tonnes + ' t', hx, hy + 330 + 140 * p - 140, { size: 50, weight: 800, align: 'center', color: C.text, fam: K.MONO });
      text(ctx, '= ' + Math.round(tonnes * 9.81) + ' kN', hx, hy + 470, { size: 34, weight: 700, align: 'center', color: C.cyan, alpha: S.p(5, 0.6, 2.4), fam: K.MONO });
      text(ctx, '≈ ' + Math.round(tonnes * 2.2046) + ' klbs', hx, hy + 520, { size: 30, weight: 600, align: 'center', color: C.dim, alpha: S.p(5, 0.6, 3.4), fam: K.MONO });
      // torque
      const ang = -0.6 + Math.sin(t * 1.2) * 0.4;
      const tx = 850, ty = 380;
      circle(ctx, tx, ty, 70, '#2a4258', C.steel, 5);
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang);
      fillRR(ctx, 0, -18, 260, 36, 14, C.steel);
      ctx.restore();
      K.curvedArrow(ctx, Array.from({ length: 20 }, (_, i) => [tx + Math.cos(-2.4 + i * 0.12) * 120, ty + Math.sin(-2.4 + i * 0.12) * 120]), { color: C.amber, lw: 5, t: S.p(5, 1, 4.5) });
      text(ctx, '40 kNm', tx, ty + 190, { size: 44, weight: 800, align: 'center', color: C.text, fam: K.MONO, alpha: S.p(5, 0.6, 4.8) });
      text(ctx, '≈ 29,500 ft·lbs', tx, ty + 240, { size: 30, weight: 600, align: 'center', color: C.dim, fam: K.MONO, alpha: S.p(5, 0.6, 5.5) });
      text(ctx, '9⅝" 53.5 ppf casing = 79.6 kg per metre', 600, 860, { size: 28, weight: 600, align: 'center', color: C.amber, alpha: S.p(5, 0.6, 8.5) });
    }
  },
};

module.exports = {
  id: 'ch00', num: 0, title: 'Exploration Drilling Lingo',
  subtitle: 'A Drilling & Wells field guide to the Norwegian Continental Shelf',
  topics: ['Licences', 'Geology', 'Rigs', 'Drill floor', 'Drill string', 'Mud', 'Pressure', 'Casing', 'Cement', 'Directional', 'Daily ops', 'Well control', 'BOP & barriers', 'Problems', 'Evaluation', 'P&A', 'People', 'Safety'],
  intro: 'Welcome to Drilling and Wells! This video is your field guide to the language of exploration drilling on the Norwegian Continental Shelf. It is made for engineers who know their mechanics, but not yet the lingo.',
  art: titleArt,
  scenes: [howto, units],
};
