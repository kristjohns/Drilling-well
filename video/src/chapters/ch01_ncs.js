'use strict';
const K = require('../engine/core');
const M = require('../art/map');
const R = require('../art/rig');
const I = require('../art/icons');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, para, poly, callout } = K;

// ---------------------------------------------------------------- map of the shelf
const P = M.makeProj(600, 470, 44, 15, 65.5);
function rigMarker(ctx, x, y, t, color = C.amber) {
  circle(ctx, x, y, 10 + 6 * K.pulse(t, 1.5), rgba(color, 0.25));
  ctx.save(); ctx.translate(x, y);
  poly(ctx, [[-7, 6], [7, 6], [2, -10], [-2, -10]]); ctx.fillStyle = color; ctx.fill();
  ctx.restore();
}
const mapScene = {
  id: 'map',
  title: 'The Norwegian Continental Shelf',
  blurb: 'Three sea areas, each with its own character.',
  beats: [
    {
      term: 'Norwegian Continental Shelf', abbr: 'NCS', no: 'norsk sokkel',
      def: 'The seabed and subsoil off Norway where all Norwegian petroleum activity takes place, from the North Sea to the Barents Sea. Often just called “the shelf”.',
      ex: 'This is my first rotation on the shelf.',
      say: 'The Norwegian Continental Shelf, or NCS, is the seabed and subsoil off the coast of Norway. All the petroleum activity you will work with happens here, and people simply call it the shelf, or in Norwegian, sokkelen.',
    },
    {
      term: 'North Sea', no: 'Nordsjøen',
      def: 'The southern, most mature part of the NCS. Water depths mostly 70–350 m, dense infrastructure, many near-field exploration wells. Fields like Ekofisk, Troll and Johan Sverdrup.',
      say: 'The North Sea is the most mature part of the shelf. Water depths are typically seventy to three hundred and fifty metres, and there is a dense network of fields and pipelines, so many exploration wells here are near field wells, close to existing infrastructure.',
    },
    {
      term: 'Norwegian Sea', no: 'Norskehavet',
      def: 'Off mid-Norway, roughly 62°N to 69°N. Deeper water, from a few hundred to over 1,000 m, and high-pressure, high-temperature wells on Haltenbanken. Fields like Åsgard, Heidrun and Aasta Hansteen.',
      say: 'The Norwegian Sea lies off mid Norway. The water is often deeper, from a few hundred to over a thousand metres, and some areas, like Haltenbanken, are known for high pressure, high temperature wells.',
    },
    {
      term: 'Barents Sea', no: 'Barentshavet',
      def: 'The northern frontier. Cold climate, winter darkness, long distances to shore and strict environmental requirements. Producing fields: Snøhvit, Goliat and Johan Castberg.',
      say: 'The Barents Sea is the frontier in the far north. Expect cold, winter darkness, long helicopter flights, and strict environmental requirements. Snøhvit, Goliat and Johan Castberg are the producing fields here.',
    },
    {
      term: 'Supply base & heliport', no: 'forsyningsbase / helibase',
      def: 'Onshore hubs that keep the rig running. Supply bases send pipe, mud and equipment out by boat; heliports fly crews offshore. E.g. Stavanger (Sola), Bergen (Flesland), Ågotnes, Mongstad, Kristiansund, Sandnessjøen, Hammerfest.',
      ex: 'The casing is on the boat from Ågotnes tomorrow.',
      say: 'Rigs are supported from shore. Supply bases ship out pipe, mud and equipment by boat, and heliports fly the crews out. You will hear names like Sola, Flesland, Ågotnes, Mongstad, Kristiansund, Sandnessjøen and Hammerfest.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const intro = S.p(0, 1.2, 0, ease.out);
    ctx.save();
    ctx.translate(600, 470); ctx.scale(lerp(0.9, 1, intro), lerp(0.9, 1, intro)); ctx.translate(-600, -470);
    M.drawMap(ctx, P, { w: 1196, h: 940, alpha: 1 });
    // NCS overview outline
    const a0 = S.hl(0);
    for (const k of ['north', 'norwegian', 'barents']) M.drawArea(ctx, P, k, '#ffffff', 0.12 * a0, t);
    if (a0 > 0) {
      text(ctx, 'NCS', 300, 210, { size: 64, weight: 900, color: rgba('#ffffff', 0.85), alpha: a0, spacing: 6 });
    }
    // sea areas
    const areas = [['north', C.amber, 1, 'NORTH SEA', [-1.2, 59.6]], ['norwegian', C.cyan, 2, 'NORWEGIAN SEA', [-1.5, 66.4]], ['barents', C.purple, 3, 'BARENTS SEA', [24.5, 73.6]]];
    for (const [k, col, i, label, ll] of areas) {
      const v = S.vis(i, 0.8);
      if (v <= 0) continue;
      const strong = S.bi === i ? 1 : 0.45;
      M.drawArea(ctx, P, k, col, 0.33 * v * strong, t);
      const [x, y] = P(ll[0], ll[1]);
      text(ctx, label, x, y, { size: 28, weight: 800, color: col, alpha: v, spacing: 2, shadow: '#000' });
    }
    const fieldSets = [[1, ['Ekofisk', 'Johan Sverdrup', 'Troll', 'Gullfaks'], C.amber], [2, ['Åsgard', 'Heidrun', 'Aasta Hansteen'], C.cyan], [3, ['Snøhvit', 'Goliat', 'Johan Castberg'], C.purple]];
    for (const [i, names, col] of fieldSets) {
      names.forEach((nm, j) => {
        const v = S.vis(i, 0.4, 1.2 + j * 0.5);
        if (v <= 0) return;
        const left = nm === 'Johan Sverdrup' || nm === 'Ekofisk' || nm === 'Aasta Hansteen' || nm === 'Gullfaks' || nm === 'Åsgard';
        M.place(ctx, P, nm, { color: col, size: 17, alpha: v * (S.bi === i || S.bi > 3 ? 1 : 0.6), align: left ? 'right' : 'left', r: 5 });
      });
    }
    if (S.on(2)) {
      const v = S.vis(2, 0.5, 3.2);
      const [x, y] = P(5.2, 64.6);
      tag(ctx, 'HPHT · Haltenbanken', x - 40, y, { size: 17, color: C.red, alpha: v });
    }
    if (S.on(3)) {
      const v = S.vis(3, 0.6, 2.0);
      ctx.save(); ctx.globalAlpha *= v;
      const [x, y] = P(34, 71.0);
      I.snowflake(ctx, x + 10, y + 40, 44);
      I.moon(ctx, x + 80, y + 40, 48);
      ctx.restore();
    }
    // bases & heliports
    if (S.on(4)) {
      const v = S.vis(4, 0.5);
      const places = ['Stavanger', 'Bergen', 'Kristiansund', 'Brønnøysund', 'Sandnessjøen', 'Hammerfest', 'Florø'];
      places.forEach((nm, j) => {
        const vj = S.vis(4, 0.4, 0.3 + j * 0.35);
        const right = ['Stavanger', 'Bergen', 'Florø', 'Kristiansund', 'Brønnøysund', 'Sandnessjøen'].includes(nm);
        M.place(ctx, P, nm, { color: '#ffffff', size: 18, alpha: vj, align: right ? 'left' : 'left', dx: 12, r: 6, weight: 700 });
      });
      // helicopter / boat trips to rigs
      const trips = [['Stavanger', [2.6, 58.6]], ['Bergen', [2.9, 61.0]], ['Kristiansund', [6.9, 65.0]], ['Hammerfest', [21.0, 72.2]]];
      trips.forEach(([from, to], j) => {
        const [x1, y1] = P(...M.PLACES[from]); const [x2, y2] = P(...to);
        const ph = ((S.since(4) - 1.5 - j * 0.6) / 4) % 1;
        if (S.since(4) < 1.5 + j * 0.6) return;
        line(ctx, x1, y1, x2, y2, rgba('#ffffff', 0.25 * v), 1.5, [6, 6]);
        const f = ease.inOut(ph);
        ctx.save(); ctx.globalAlpha *= v;
        I.helicopter(ctx, lerp(x1, x2, f), lerp(y1, y2, f) - 10, 26, t, '#ffffff');
        ctx.restore();
      });
    }
    ctx.restore();
    // rigs
    const rigs = [[2.6, 58.6, 1], [2.9, 61.0, 1], [6.9, 65.0, 2], [21.0, 72.2, 3]];
    for (const [lo, la, i] of rigs) {
      const v = S.vis(i, 0.5, 0.6);
      if (v <= 0) continue;
      const [x, y] = P(lo, la);
      ctx.save(); ctx.globalAlpha *= v; rigMarker(ctx, x, y, t); ctx.restore();
    }
    // legend
    text(ctx, 'Schematic map · not to scale', 1170, 920, { size: 15, weight: 500, color: rgba('#ffffff', 0.4), align: 'right' });
  },
};

// ---------------------------------------------------------------- quadrants, blocks, well names
const blocksScene = {
  id: 'blocks',
  title: 'Quadrants, blocks and well names',
  blurb: 'Every well on the NCS has a name that tells you where it is.',
  beats: [
    {
      term: 'Quadrant', no: 'kvadrant',
      def: 'A 1° × 1° grid square. South of 62°N quadrants are numbered 1–36. Further north they get a four-digit name from the latitude and longitude of the south-west corner: 7220 = 72°N, 20°E.',
      say: 'The shelf is divided into a grid. A quadrant is one degree by one degree. In the North Sea, south of sixty two degrees north, quadrants are just numbered one to thirty six. Further north they get a four digit name from the latitude and longitude of the south west corner. So seventy two twenty means seventy two degrees north, twenty degrees east.',
    },
    {
      term: 'Block', no: 'blokk',
      def: 'Each quadrant is split into 12 blocks of 15′ latitude × 20′ longitude, numbered 1–12 from the north-west corner. Written quadrant/block: 7220/8, or 34/10 in the North Sea.',
      ex: 'The prospect sits in the south-east corner of 34/10.',
      say: 'Each quadrant is split into twelve blocks, numbered one to twelve, starting in the north west corner. A block is written quadrant, slash, block. So seventy two twenty slash eight, or thirty four slash ten in the North Sea, which is the Gullfaks block.',
    },
    {
      term: 'Wellbore name', no: 'brønnbane',
      def: 'Quadrant/block-serial number: 7220/8-1 is the first well drilled in block 7220/8. Names follow the Norwegian Offshore Directorate’s designation guidelines.',
      ex: 'We spud 7220/8-1 on Monday.',
      say: 'Wells are named quadrant, slash, block, dash, serial number. So seventy two twenty slash eight dash one is the first well drilled in that block. That one was the Skrugard discovery, today the Johan Castberg field.',
      tts: 'Wells are named quadrant, slash, block, dash, serial number. So, seventy-two twenty, slash eight, dash one, is the first well drilled in that block. That one was the Skrugard discovery, today the Johan Castberg field.',
    },
    {
      term: 'Wellbore suffixes', abbr: 'S | A, B | T2 | R | Y', no: 'sidesteg = sidetrack',
      def: 'Letters after the number tell the wellbore’s story: S = planned deviated, A, B… = sidetracks to new targets, T2, T3 = technical sidetracks (re-drilled after a problem), R = re-entry, Y = planned multilateral.',
      say: 'Suffixes tell the story of the wellbore. S means a planned deviated well. A, B and so on are sidetracks to new geological targets. T two, T three are technical sidetracks, redrilled after a problem like stuck pipe. R is a re entry, and Y a planned multilateral.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    // mini map of the Barents with grid
    const mP = M.makeProj(230, 470, 92, 23, 72);
    const showMap = S.bi < 3;
    const mapA = showMap ? 1 : 1 - S.p(3, 0.6);
    if (mapA > 0) {
      ctx.save(); ctx.globalAlpha *= mapA;
      ctx.save(); rr(ctx, 30, 150, 400, 640, 14); ctx.clip();
      M.drawMap(ctx, mP, { w: 470, h: 940, graticule: false });
      ctx.strokeStyle = rgba('#9fd3ff', 0.25); ctx.lineWidth = 1;
      for (let la = 68; la <= 76; la++) { ctx.beginPath(); for (let lo = 10; lo <= 36; lo += 0.5) { const [x, y] = mP(lo, la); lo === 10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      for (let lo = 10; lo <= 36; lo++) { ctx.beginPath(); for (let la = 68; la <= 76; la += 0.5) { const [x, y] = mP(lo, la); la === 68 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); } ctx.stroke(); }
      // highlighted quadrant
      const q = [mP(20, 72), mP(21, 72), mP(21, 73), mP(20, 73)];
      poly(ctx, q); ctx.fillStyle = rgba(C.amber, 0.35 + 0.2 * K.pulse(t)); ctx.fill();
      ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke();
      M.place(ctx, mP, 'Hammerfest', { size: 16, color: '#fff', r: 4 });
      ctx.restore();
      fillRR(ctx, 30, 150, 400, 640, 14, null, C.panelEdge, 2);
      text(ctx, 'BARENTS SEA · 1° GRID', 230, 135, { size: 18, weight: 800, align: 'center', color: C.dim, spacing: 2 });
      // zoom lines
      const z = S.p(0, 1.0, 0.8);
      const qx0 = 540, qy0 = 120, cw = 190, chh = 170;
      if (z > 0) {
        const q2 = [mP(20, 73), mP(21, 73), mP(21, 72), mP(20, 72)];
        const corners = [[qx0, qy0], [qx0 + 3 * cw, qy0], [qx0 + 3 * cw, qy0 + 4 * chh], [qx0, qy0 + 4 * chh]];
        for (let i = 0; i < 4; i++) line(ctx, q2[i][0], q2[i][1], lerp(q2[i][0], corners[i][0], z), lerp(q2[i][1], corners[i][1], z), rgba(C.amber, 0.35), 1.5, [6, 6]);
      }
      ctx.restore();
    }
    // big quadrant
    const qx0 = 540, qy0 = 120, cw = 190, chh = 170;
    const qa = S.p(0, 0.8, 1.2) * mapA;
    if (qa > 0) {
      ctx.save(); ctx.globalAlpha *= qa;
      fillRR(ctx, qx0, qy0, 3 * cw, 4 * chh, 6, rgba('#0f3a57', 0.9), C.amber, 3);
      text(ctx, '73°N', qx0 - 14, qy0 + 8, { size: 20, weight: 700, align: 'right', color: C.dim });
      text(ctx, '72°N', qx0 - 14, qy0 + 4 * chh + 8, { size: 20, weight: 700, align: 'right', color: C.dim });
      text(ctx, '20°E', qx0, qy0 + 4 * chh + 34, { size: 20, weight: 700, align: 'center', color: C.dim });
      text(ctx, '21°E', qx0 + 3 * cw, qy0 + 4 * chh + 34, { size: 20, weight: 700, align: 'center', color: C.dim });
      const sw = S.p(0, 0.6, 3.5) * (1 - S.p(1, 0.5));
      circle(ctx, qx0, qy0 + 4 * chh, 9 * sw, C.amber);
      if (sw > 0) callout(ctx, qx0, qy0 + 4 * chh, qx0 + 70, qy0 + 4 * chh + 80, 'SW corner 72°N 20°E → 7220', { color: C.amber, size: 22, t: sw });
      if (S.bi < 1) text(ctx, 'QUADRANT 7220', qx0 + 1.5 * cw, qy0 + 2 * chh + 14, { size: 44, weight: 900, align: 'center', color: C.text, alpha: S.p(0, 0.6, 2.2) });
      ctx.restore();
      // blocks
      if (S.on(1)) {
        ctx.save(); ctx.globalAlpha *= qa;
        const g = S.p(1, 0.8);
        ctx.strokeStyle = rgba('#9fd3ff', 0.7); ctx.lineWidth = 2;
        for (let c = 1; c < 3; c++) line(ctx, qx0 + c * cw, qy0, qx0 + c * cw, qy0 + 4 * chh * g, rgba('#9fd3ff', 0.7), 2);
        for (let r = 1; r < 4; r++) line(ctx, qx0, qy0 + r * chh, qx0 + 3 * cw * g, qy0 + r * chh, rgba('#9fd3ff', 0.7), 2);
        for (let k = 0; k < 12; k++) {
          const v = S.vis(1, 0.3, 0.8 + k * 0.28);
          if (v <= 0) continue;
          const c = k % 3, r = Math.floor(k / 3);
          const isB8 = k === 7;
          if (isB8 && S.since(1) > 4.6) {
            ctx.fillStyle = rgba(C.amber, 0.25 + 0.15 * K.pulse(t)); ctx.fillRect(qx0 + c * cw + 2, qy0 + r * chh + 2, cw - 4, chh - 4);
          }
          const dimN = isB8 ? 1 : 1 - 0.6 * S.p(2, 0.5);
          text(ctx, String(k + 1), qx0 + c * cw + cw / 2, qy0 + r * chh + chh / 2 + 18, { size: 54, weight: 800, align: 'center', color: isB8 && S.since(1) > 4.6 ? C.amber : rgba('#ffffff', 0.75), alpha: v * dimN });
        }
        const bl = S.p(1, 0.5, 5.0);
        tag(ctx, '7220/8', qx0 + 1.5 * cw, qy0 + 4 * chh + 80, { size: 30, color: C.amber, alpha: bl, fam: K.MONO });
        text(ctx, 'each block 15′ lat × 20′ long', qx0 + 1.5 * cw, qy0 + 4 * chh + 34, { size: 20, weight: 600, align: 'center', color: C.dim, alpha: S.p(1, 0.5, 3.6) });
        ctx.restore();
      }
      // wells
      if (S.on(2)) {
        ctx.save(); ctx.globalAlpha *= qa;
        const wx = qx0 + cw + 70, wy = qy0 + 2 * chh + 70;
        const w1 = S.p(2, 0.5, 0.5, ease.outBack);
        circle(ctx, wx, wy, 12 * w1, C.white, C.amber, 4);
        if (w1 > 0) callout(ctx, wx, wy, 470, wy + 180, '7220/8-1', { color: C.white, size: 30, t: S.p(2, 0.6, 0.8), sub: 'Skrugard discovery, 2011', align: 'right' });
        const w2 = S.p(2, 0.5, 6.0, ease.outBack);
        circle(ctx, wx + 80, wy - 50, 9 * w2, rgba('#ffffff', 0.6), C.dim, 3);
        if (w2 > 0) text(ctx, '7220/8-2 …', wx + 96, wy - 60, { size: 20, weight: 700, color: C.dim, alpha: w2 });
        ctx.restore();
      }
    }
    // suffixes: cross-section
    if (S.on(3)) {
      const a = S.p(3, 0.6, 0.3);
      ctx.save(); ctx.globalAlpha *= a;
      const sb = 180;
      R.sky(ctx, 1196, 120, { top: '#0a1825', bot: '#143450' });
      R.sea(ctx, 1196, 120, sb, t, { amp: 3 });
      ctx.fillStyle = '#3a2f24'; ctx.fillRect(0, sb, 1196, 760);
      for (let i = 0; i < 6; i++) { ctx.fillStyle = i % 2 ? rgba('#000000', 0.08) : rgba('#ffffff', 0.03); ctx.fillRect(0, sb + 40 + i * 110, 1196, 60); }
      line(ctx, 0, sb, 1196, sb, '#8a7457', 3);
      const wells = [
        { x: 150, label: '7220/8-1', sub: 'vertical well', col: '#ffffff', pts: [[150, sb], [150, 820]], d: 0.3 },
        { x: 380, label: '7220/8-2 S', sub: 'S: planned deviated', col: C.cyan, pts: [[380, sb], [380, 360], [420, 480], [520, 640], [600, 800]], d: 1.4 },
        { x: 760, label: '7220/8-1 A', sub: 'A: sidetrack, new target', col: C.amber, pts: [[760, sb], [760, 820]], branch: [[760, 450], [790, 560], [880, 700], [960, 820]], d: 3.0 },
        { x: 1040, label: '7220/8-1 T2', sub: 'T2: technical sidetrack', col: C.red, pts: [[1040, sb], [1040, 600]], branch: [[1040, 470], [1060, 560], [1075, 700], [1080, 820]], fish: [1040, 640], d: 5.0 },
      ];
      for (const w of wells) {
        const p = S.p(3, 1.4, w.d, ease.inOut);
        if (p <= 0) continue;
        K.partialPolyline(ctx, w.pts, p, w.col, 7);
        if (w.branch) K.partialPolyline(ctx, w.branch, S.p(3, 1.2, w.d + 1.0), w.col, 7, [12, 8]);
        if (w.fish) {
          const fp = S.p(3, 0.4, w.d + 0.6);
          if (fp > 0) { I.xmark(ctx, w.fish[0], w.fish[1], 34 * fp, C.red); text(ctx, 'stuck pipe', w.fish[0] - 24, w.fish[1] + 6, { size: 18, weight: 700, color: C.red, align: 'right', alpha: fp }); }
        }
        text(ctx, w.label, w.x, 90, { size: 26, weight: 800, align: 'center', color: w.col, fam: K.MONO, alpha: p });
        text(ctx, w.sub, w.x, 860, { size: 20, weight: 600, align: 'center', color: C.dim, alpha: p });
      }
      const rp = S.p(3, 0.6, 8.5);
      tag(ctx, 'R = re-entry   ·   Y = planned multilateral', 598, 902, { size: 22, color: C.purple, alpha: rp });
      ctx.restore();
    }
  },
};

// ---------------------------------------------------------------- licences
function licenceGrid(ctx, x0, y0, cw, ch, t, alpha = 1) {
  ctx.save(); ctx.globalAlpha *= alpha;
  fillRR(ctx, x0, y0, cw * 6, ch * 4, 6, rgba('#0f3a57', 0.9), C.panelEdge, 2);
  for (let c = 1; c < 6; c++) line(ctx, x0 + c * cw, y0, x0 + c * cw, y0 + ch * 4, rgba('#9fd3ff', c === 3 ? 0.6 : 0.25), c === 3 ? 2.5 : 1.5);
  for (let r = 1; r < 4; r++) line(ctx, x0, y0 + r * ch, x0 + cw * 6, y0 + r * ch, rgba('#9fd3ff', 0.25), 1.5);
  for (let k = 0; k < 12; k++) {
    const c = k % 3, r = Math.floor(k / 3);
    text(ctx, String(k + 1), x0 + c * cw + 12, y0 + r * ch + 24, { size: 16, weight: 700, color: rgba('#ffffff', 0.45) });
    text(ctx, String(k + 1), x0 + (c + 3) * cw + 12, y0 + r * ch + 24, { size: 16, weight: 700, color: rgba('#ffffff', 0.45) });
  }
  text(ctx, 'Quadrant 7219', x0 + 1.5 * cw, y0 - 14, { size: 18, weight: 700, color: C.dim, align: 'center' });
  text(ctx, 'Quadrant 7220', x0 + 4.5 * cw, y0 - 14, { size: 18, weight: 700, color: C.dim, align: 'center' });
  ctx.restore();
}
const licenceScene = {
  id: 'licence',
  title: 'Licences and licensing rounds',
  blurb: 'Companies explore under licences awarded by the state.',
  beats: [
    {
      term: 'Production licence', abbr: 'PL', no: 'utvinningstillatelse',
      def: 'The licence that gives a group of companies the exclusive right to explore for and produce petroleum in a defined area. Numbered: e.g. PL 532, where Skrugard was found.',
      ex: 'The well is in PL 532, operated by us.',
      say: 'A production licence, written PL and a number, gives a group of companies the exclusive right to explore for and produce petroleum in a defined area. Skrugard, for example, was found in PL five three two.',
      tts: 'A production licence, written PL and a number, gives a group of companies the exclusive right to explore for, and produce petroleum in a defined area. Skrugard, for example, was found in PL, five, three, two.',
    },
    {
      term: 'Licensing rounds & APA', abbr: 'APA', no: 'konsesjonsrunder / TFO',
      def: 'Licences are awarded in numbered licensing rounds for frontier areas, and in the yearly APA round (Awards in Predefined Areas, TFO in Norwegian) for mature areas.',
      say: 'Licences are awarded in two ways: numbered licensing rounds for frontier acreage, and the yearly APA round, Awards in Predefined Areas, for the mature parts of the shelf.',
    },
    {
      term: 'Work programme & drill-or-drop', no: 'arbeidsprogram / bore-eller-slipp',
      def: 'Each licence comes with commitments, such as acquiring seismic or drilling a well by a deadline. “Drill or drop”: the partners either commit to a well or give the licence back.',
      ex: 'Drill-or-drop decision is due in February.',
      say: 'Each licence comes with a work programme: commitments like shooting seismic, or drilling a well before a deadline. You will hear, drill or drop: the partners either commit to a well, or hand the acreage back.',
    },
    {
      term: 'Relinquishment', no: 'tilbakelevering',
      def: 'Handing a licence, or part of its area, back to the state, for example after a dry well or when the commitments are not met.',
      say: 'Handing acreage back to the state is called relinquishment. It often follows a dry well.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const x0 = 148, y0 = 90, cw = 150, ch = 95;
    licenceGrid(ctx, x0, y0, cw, ch, t, S.p(0, 0.6));
    // licence polygon
    const poly1 = [[x0 + 2.2 * cw, y0 + 1.1 * ch], [x0 + 4.6 * cw, y0 + 0.6 * ch], [x0 + 4.9 * cw, y0 + 2.9 * ch], [x0 + 3.1 * cw, y0 + 3.6 * ch], [x0 + 1.9 * cw, y0 + 2.6 * ch]];
    const dp = S.p(0, 1.6, 0.8);
    const relq = S.p(3, 1.5, 1.0);
    const col = K.mix(C.amber, '#6b7785', relq);
    if (dp > 0) {
      K.partialPolyline(ctx, [...poly1, poly1[0]], dp, col, 4);
      if (dp >= 1) { poly(ctx, poly1); ctx.fillStyle = rgba(col, 0.25 + 0.1 * K.pulse(t) * (1 - relq)); ctx.fill(); }
      text(ctx, 'PL 532', x0 + 3.4 * cw, y0 + 2.2 * ch, { size: 40, weight: 900, align: 'center', color: col, alpha: S.p(0, 0.6, 2.2), fam: K.MONO });
      const w = S.p(0, 0.5, 3.2, ease.outBack);
      if (w > 0) { circle(ctx, x0 + 4.1 * cw, y0 + 1.5 * ch, 9 * w, '#fff', C.amber, 3); }
    }
    text(ctx, 'exclusive right to explore and produce', x0 + 3 * cw, y0 + 4 * ch + 40, { size: 24, weight: 600, align: 'center', color: C.dim, alpha: S.p(0, 0.6, 4) * (1 - S.p(1, 0.4)) });
    // rounds & APA
    if (S.on(1)) {
      const a = S.vis(1, 0.6) * (1 - S.p(3, 0.5));
      const by = 540;
      ctx.save(); ctx.globalAlpha *= a;
      text(ctx, 'HOW LICENCES ARE AWARDED', 80, by, { size: 20, weight: 800, color: C.dim, spacing: 2 });
      line(ctx, 100, by + 110, 1100, by + 110, C.line, 3);
      const years = [2021, 2022, 2023, 2024, 2025, 2026];
      years.forEach((y, i) => {
        const x = 160 + i * 180;
        const v = S.vis(1, 0.4, 0.6 + i * 0.4);
        circle(ctx, x, by + 110, 8, C.steel);
        text(ctx, String(y), x, by + 150, { size: 20, weight: 700, align: 'center', color: C.dim });
        ctx.save(); ctx.globalAlpha *= v;
        fillRR(ctx, x - 50, by + 40, 100, 44, 10, rgba(C.cyan, 0.15), C.cyan, 2);
        text(ctx, 'APA', x, by + 70, { size: 22, weight: 800, align: 'center', color: C.cyan });
        ctx.restore();
      });
      const rv = S.vis(1, 0.5, 2.5);
      ctx.save(); ctx.globalAlpha *= rv;
      fillRR(ctx, 160 + 1.5 * 180 - 85, by + 175, 170, 44, 10, rgba(C.purple, 0.15), C.purple, 2);
      text(ctx, '25th round', 160 + 1.5 * 180, by + 205, { size: 20, weight: 800, align: 'center', color: C.purple });
      fillRR(ctx, 160 + 4.5 * 180 - 85, by + 175, 170, 44, 10, rgba(C.purple, 0.15), C.purple, 2);
      text(ctx, '26th round', 160 + 4.5 * 180, by + 205, { size: 20, weight: 800, align: 'center', color: C.purple });
      ctx.restore();
      text(ctx, 'APA = mature areas, every year', 160, by + 270, { size: 22, weight: 600, color: C.cyan, alpha: S.vis(1, 0.5, 3.5) });
      text(ctx, 'Numbered rounds = frontier areas', 700, by + 270, { size: 22, weight: 600, color: C.purple, alpha: S.vis(1, 0.5, 4.5) });
      ctx.restore();
    }
    // work programme, overlay on right
    if (S.on(2)) {
      const a = S.vis(2, 0.6) * (1 - S.p(3, 0.5));
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 40, 480, 1116, 420, 18, '#0b1d2c', C.panelEdge, 2);
      const steps = [['Award', 'licence granted'], ['Seismic', '2D / 3D survey'], ['Studies', 'map the prospect'], ['Decision', 'drill or drop?']];
      steps.forEach(([a1, b1], i) => {
        const x = 150 + i * 240, y = 600;
        const v = S.vis(2, 0.4, 0.4 + i * 0.7, ease.outBack);
        ctx.save(); ctx.globalAlpha *= clamp(v);
        if (i < 3) fillRR(ctx, x - 90, y - 40, 180, 80, 12, rgba(C.cyan, 0.12), C.cyan, 2);
        else { poly(ctx, [[x, y - 60], [x + 75, y], [x, y + 60], [x - 75, y]]); ctx.fillStyle = rgba(C.amber, 0.18); ctx.fill(); ctx.strokeStyle = C.amber; ctx.lineWidth = 2.5; ctx.stroke(); }
        text(ctx, a1, x, y + 8, { size: 24, weight: 800, align: 'center', color: C.text });
        text(ctx, b1, x, y + 86, { size: 18, weight: 500, align: 'center', color: C.dim });
        if (i < 3) arrow(ctx, x + 95, y, x + 140, y, { color: C.dim, lw: 3, head: 12 });
        ctx.restore();
      });
      const f = S.vis(2, 0.6, 3.8);
      const dx = 870;
      ctx.save(); ctx.globalAlpha *= f;
      arrow(ctx, dx + 60, 570, 1020, 520, { color: C.green, lw: 4, head: 14 });
      arrow(ctx, dx + 60, 630, 1020, 690, { color: C.red, lw: 4, head: 14 });
      text(ctx, 'DRILL', 1030, 525, { size: 28, weight: 900, color: C.green });
      text(ctx, 'DROP', 1030, 715, { size: 28, weight: 900, color: C.red });
      R.semi(ctx, 1090, 600, 0.22, t);
      ctx.restore();
      ctx.restore();
    }
    // relinquishment
    if (S.on(3)) {
      const a = S.vis(3, 0.6, 0.5);
      ctx.save(); ctx.globalAlpha *= a;
      I.building(ctx, 900, 720, 170);
      text(ctx, 'THE STATE', 900, 840, { size: 26, weight: 800, align: 'center', color: C.text });
      K.curvedArrow(ctx, [[x0 + 4.9 * cw, y0 + 2.9 * ch], [760, 560], [840, 640]], { color: C.dim, lw: 4, t: S.p(3, 1.2, 1.2), dash: [10, 8] });
      text(ctx, 'area handed back', 560, 640, { size: 24, weight: 600, color: C.dim, alpha: S.p(3, 0.5, 2.2) });
      ctx.restore();
    }
  },
};

// ---------------------------------------------------------------- partners
const partnerScene = {
  id: 'partners',
  title: 'Licensees and the operator',
  blurb: 'A licence is shared between several companies. One of them runs the show.',
  beats: [
    {
      term: 'Licensees & operator', no: 'rettighetshavere / operatør',
      def: 'The companies holding shares of a licence are the licensees, or partners. One is appointed operator and does the day-to-day work, including planning and drilling the wells, for the whole licence group.',
      ex: 'Partners need the drilling programme two weeks before spud.',
      say: 'The companies that share a licence are the licensees, or partners. One of them is appointed operator. The operator does the day to day work, including planning and drilling the wells, on behalf of the whole licence group.',
    },
    {
      term: 'Farm-in / farm-out',
      def: 'Buying into a licence (farm-in), often by paying part of the cost of a well, or selling part of your share (farm-out). A common way to share exploration risk.',
      ex: 'They farmed in by carrying part of the well cost.',
      say: 'A farm in is when a company buys into a licence, often by paying part of a well’s cost. The seller is farming out. It is a common way to share the risk of an exploration well.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const cx = 420, cy = 470, r = 250;
    const slices = [['Operator', 0.40, C.amber], ['Partner A', 0.30, C.cyan], ['Partner B', 0.20, C.purple], ['Partner C', 0.10, C.green]];
    const farm = S.p(1, 1.6, 1.5);
    let a0 = -Math.PI / 2;
    const grow = S.p(0, 1.2, 0.3);
    slices.forEach(([name, frac, col], i) => {
      let f = frac;
      if (i === 0) f = frac - 0.15 * farm;
      const a1 = a0 + Math.PI * 2 * f * grow;
      const mid = (a0 + a1) / 2;
      const pop = i === 0 ? 24 * S.p(0, 0.6, 3.5, ease.outBack) : 0;
      const ox = Math.cos(mid) * pop, oy = Math.sin(mid) * pop;
      ctx.beginPath(); ctx.moveTo(cx + ox, cy + oy); ctx.arc(cx + ox, cy + oy, r, a0, a1); ctx.closePath();
      ctx.fillStyle = K.mix(col, '#0a1825', 0.25); ctx.fill(); ctx.strokeStyle = '#0a1825'; ctx.lineWidth = 4; ctx.stroke();
      if (grow > 0.9) {
        const lx = cx + ox + Math.cos(mid) * r * 0.62, ly = cy + oy + Math.sin(mid) * r * 0.62;
        text(ctx, name, lx, ly - 4, { size: 24, weight: 800, align: 'center', color: '#0b1520' });
        text(ctx, Math.round(f * 100) + ' %', lx, ly + 26, { size: 24, weight: 700, align: 'center', color: '#0b1520' });
      }
      a0 = a1;
    });
    // new partner slice from farm-in
    if (farm > 0) {
      const f = 0.15 * farm;
      const a1 = a0 + Math.PI * 2 * f;
      const mid = (a0 + a1) / 2;
      const ox = Math.cos(mid) * 30 * (1 - farm), oy = Math.sin(mid) * 30 * (1 - farm);
      ctx.beginPath(); ctx.moveTo(cx + ox, cy + oy); ctx.arc(cx + ox, cy + oy, r, a0, a1); ctx.closePath();
      ctx.fillStyle = K.mix(C.pink, '#0a1825', 0.2); ctx.fill(); ctx.strokeStyle = '#0a1825'; ctx.lineWidth = 4; ctx.stroke();
      if (farm > 0.8) text(ctx, 'New 15 %', cx + Math.cos(mid) * r * 0.66, cy + Math.sin(mid) * r * 0.66 + 8, { size: 22, weight: 800, align: 'center', color: '#0b1520' });
    }
    text(ctx, 'LICENCE GROUP · PL 532', cx, 150, { size: 24, weight: 800, align: 'center', color: C.dim, spacing: 2, alpha: grow });
    // operator badge
    const ob = S.p(0, 0.6, 3.8);
    if (ob > 0 && S.bi === 0) {
      ctx.save(); ctx.globalAlpha *= ob;
      I.helmet(ctx, cx + 120, cy - 300 + 40, 60, C.white);
      callout(ctx, cx + 120, cy - 170, 820, 250, 'OPERATOR', { color: C.amber, size: 30, sub: 'plans & drills the wells', t: ob });
      // duties list
      const duties = ['Well planning & design', 'Rig contract & logistics', 'Permits & consents', 'Daily operations', 'Reporting to partners'];
      duties.forEach((d, i) => {
        const v = S.vis(0, 0.4, 5 + i * 0.6);
        text(ctx, '•  ' + d, 790, 360 + i * 52, { size: 26, weight: 600, color: C.text, alpha: v });
      });
      ctx.restore();
    }
    if (S.bi === 1) {
      const a = S.vis(1, 0.5);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 760, 260, 340, 130, 14, rgba(C.pink, 0.12), C.pink, 2);
      text(ctx, 'FARM-IN', 930, 312, { size: 30, weight: 900, align: 'center', color: C.pink });
      text(ctx, 'new company buys in', 930, 350, { size: 20, weight: 500, align: 'center', color: C.dim });
      fillRR(ctx, 760, 560, 340, 130, 14, rgba(C.amber, 0.12), C.amber, 2);
      text(ctx, 'FARM-OUT', 930, 612, { size: 30, weight: 900, align: 'center', color: C.amber });
      text(ctx, 'operator sells 15 %', 930, 650, { size: 20, weight: 500, align: 'center', color: C.dim });
      // coins moving from farm-in to farm-out
      for (let i = 0; i < 4; i++) {
        const ph = ((S.since(1) * 0.5 + i * 0.25) % 1);
        I.coin(ctx, 930 + Math.sin(ph * Math.PI) * 60, lerp(400, 550, ph), 40);
      }
      text(ctx, 'pays part of', 1000, 470, { size: 20, weight: 600, color: C.dim });
      text(ctx, 'the well cost', 1000, 496, { size: 20, weight: 600, color: C.dim });
      ctx.restore();
    }
  },
};

// ---------------------------------------------------------------- regulators
const regScene = {
  id: 'regulators',
  title: 'Who regulates what',
  blurb: 'Three agencies under the ministries keep an eye on the operator.',
  beats: [
    {
      term: 'Ministry of Energy', no: 'Energidepartementet',
      def: 'Sets petroleum policy and formally awards production licences on behalf of the state. Called the Ministry of Petroleum and Energy until 2024.',
      say: 'At the top sits the Ministry of Energy. It sets the policy and formally awards the licences.',
    },
    {
      term: 'Norwegian Offshore Directorate', abbr: 'Sodir', no: 'Sokkeldirektoratet',
      def: 'Manages the resources: issues drilling permits, receives all well data and publishes well results. Known as the NPD (Oljedirektoratet) until 2024.',
      ex: 'Sodir has the drilling permit application.',
      say: 'The Norwegian Offshore Directorate, Sokkeldirektoratet, or Sodir for short, manages the resources. It issues drilling permits, collects all the well data, and publishes well results. Until 2024 it was called the NPD, the Norwegian Petroleum Directorate.',
    },
    {
      term: 'Norwegian Ocean Industry Authority', abbr: 'Havtil', no: 'Havindustritilsynet',
      def: 'The safety regulator: supervises health, safety and environment, gives consent for drilling, issues AoCs and investigates incidents. Called the PSA (Ptil) until 2024.',
      ex: 'Havtil is coming out for an audit of our well control.',
      say: 'The safety regulator is Havtil, the Norwegian Ocean Industry Authority. It supervises health, safety and the working environment, gives consent to drill, and investigates incidents. You will still hear its old name, the PSA, or Ptil.',
    },
    {
      term: 'Norwegian Environment Agency', no: 'Miljødirektoratet',
      def: 'Regulates emissions and discharges to sea, including drilling fluids, chemicals and cuttings, through discharge permits.',
      say: 'And the Norwegian Environment Agency, Miljødirektoratet, regulates discharges to sea, including mud, chemicals and cuttings, through permits.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    // ministry
    const m = S.vis(0, 0.6);
    ctx.save(); ctx.globalAlpha *= m;
    fillRR(ctx, 398, 60, 400, 150, 16, '#12283b', S.bi === 0 ? C.amber : C.panelEdge, 3);
    I.building(ctx, 480, 135, 90);
    text(ctx, 'Ministry of Energy', 540, 125, { size: 28, weight: 800, color: C.text });
    text(ctx, 'policy · licence awards', 540, 162, { size: 20, weight: 500, color: C.dim });
    ctx.restore();
    const boxes = [
      { i: 1, x: 40, title: 'Sodir', sub: 'Offshore Directorate', col: C.cyan, icon: (x, y) => I.barChart(ctx, x, y, 64, C.cyan), duties: ['drilling permits', 'well data', 'resource management'] },
      { i: 2, x: 418, title: 'Havtil', sub: 'Ocean Industry Authority', col: C.blue, icon: (x, y) => I.shield(ctx, x, y, 70, C.blue, 'helmet'), duties: ['consents', 'HSE supervision', 'incident investigation'] },
      { i: 3, x: 796, title: 'Miljødirektoratet', sub: 'Environment Agency', col: C.green, icon: (x, y) => { I.leaf(ctx, x - 12, y, 52, C.green); I.drop(ctx, x + 22, y + 8, 36, C.water); }, duties: ['discharge permits', 'chemicals', 'emissions'] },
    ];
    for (const b of boxes) {
      const v = S.vis(b.i, 0.6, 0, ease.outBack);
      if (v <= 0) continue;
      ctx.save(); ctx.globalAlpha *= clamp(v);
      line(ctx, 598, 210, b.x + 180, 300, C.line, 3);
      fillRR(ctx, b.x, 300, 360, 300, 16, '#12283b', S.bi === b.i ? b.col : C.panelEdge, 3);
      b.icon(b.x + 64, 370);
      text(ctx, b.title, b.x + 116, 368, { size: b.title.length > 10 ? 26 : 32, weight: 800, color: C.text });
      text(ctx, b.sub, b.x + 116, 398, { size: 18, weight: 500, color: C.dim });
      b.duties.forEach((d, j) => {
        const vv = S.vis(b.i, 0.4, 1 + j * 0.5);
        text(ctx, '•  ' + d, b.x + 30, 470 + j * 40, { size: 22, weight: 600, color: C.text, alpha: vv });
      });
      ctx.restore();
    }
    // operator and rig at bottom
    const op = S.vis(1, 0.6, 1.5);
    ctx.save(); ctx.globalAlpha *= op;
    fillRR(ctx, 360, 700, 476, 110, 16, rgba(C.amber, 0.1), C.amber, 2);
    text(ctx, 'OPERATOR + LICENSEES', 598, 745, { size: 26, weight: 800, align: 'center', color: C.amber });
    text(ctx, 'apply, report, comply', 598, 780, { size: 20, weight: 500, align: 'center', color: C.dim });
    for (const b of boxes) {
      if (!S.on(b.i)) continue;
      const pts = [[b.x + 180, 600], [lerp(b.x + 180, 598, 0.5), 650], [598, 700]];
      K.partialPolyline(ctx, pts, 1, rgba(b.col, 0.5), 3, [8, 6]);
      K.flow(ctx, [[598, 700], [lerp(b.x + 180, 598, 0.5), 650], [b.x + 180, 600]], t, { spacing: 40, speed: 50, color: b.col, r: 4 });
    }
    ctx.restore();
    text(ctx, 'NPD → Sodir   ·   PSA (Ptil) → Havtil   since 1 Jan 2024', 598, 880, { size: 22, weight: 600, align: 'center', color: C.dim, alpha: S.vis(2, 0.6, 6) });
  },
};

// ---------------------------------------------------------------- permits
const permitScene = {
  id: 'permits',
  title: 'Permits before you drill',
  blurb: 'No well is spudded before the paperwork is in place.',
  beats: [
    {
      term: 'Drilling permit', no: 'boretillatelse',
      def: 'Permission from Sodir to drill a specific well. Granted once the licensees have the other permits and consents they need.',
      say: 'Before a single metre is drilled, the operator needs a drilling permit for that specific well from the Offshore Directorate.',
    },
    {
      term: 'Consent', no: 'samtykke',
      def: 'Havtil’s approval of a specific activity, for example drilling an exploration well with a named rig in a named block.',
      ex: 'We got consent from Havtil on Friday, so we can move the rig.',
      say: 'Havtil gives consent, samtykke, for the activity itself: for example drilling an exploration well, with a named rig, in a named block.',
    },
    {
      term: 'Discharge permit', no: 'utslippstillatelse',
      def: 'The Environment Agency’s permit stating which chemicals may be used and what may be discharged to sea, for example water-based mud and cuttings, and what must be shipped to shore.',
      say: 'The discharge permit sets out which chemicals may be used, how much mud and cuttings may go to sea, and what must be shipped to shore.',
    },
    {
      term: 'Acknowledgement of Compliance', abbr: 'AoC', no: 'samsvarsuttalelse (SUT)',
      def: 'Havtil’s confirmation that a mobile rig’s technical condition and management system meet Norwegian regulations. Required before the rig can work on the NCS.',
      ex: 'That rig has a valid AoC, it has worked in Norway before.',
      say: 'A mobile rig needs an A o C, an Acknowledgement of Compliance, from Havtil before it can operate on the shelf. In Norwegian it is an SUT, a samsvarsuttalelse.',
    },
    {
      term: 'Safety zone', no: 'sikkerhetssone',
      def: 'A 500 m zone around every installation, including a drilling rig. Vessels may not enter without permission.',
      ex: 'The supply boat is waiting at the 500-metre zone.',
      say: 'Every installation has a five hundred metre safety zone. Vessels need permission from the rig to enter it.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    if (S.bi < 4) {
      R.sky(ctx, 1196, 560, { top: '#0a1825', bot: '#173c5c' });
      R.sea(ctx, 1196, 560, 940, t);
      R.semi(ctx, 598, 560, 1.15, t, { heave: Math.sin(t) * 3 });
      const docs = [
        { i: 0, x: 170, y: 220, title: 'Drilling permit', from: 'Sodir', col: C.cyan, stampL: 'GRANTED' },
        { i: 1, x: 1020, y: 220, title: 'Consent', from: 'Havtil', col: C.blue, stampL: 'SAMTYKKE' },
        { i: 2, x: 170, y: 690, title: 'Discharge permit', from: 'Miljødirektoratet', col: C.green, stampL: 'APPROVED' },
      ];
      for (const d of docs) {
        const v = S.vis(d.i, 0.7, 0, ease.outBack);
        if (v <= 0) continue;
        ctx.save(); ctx.globalAlpha *= clamp(v);
        ctx.translate(d.x, d.y); ctx.scale(clamp(v, 0, 1.1), clamp(v, 0, 1.1));
        fillRR(ctx, -120, -110, 240, 220, 14, '#12283b', S.bi === d.i ? d.col : C.panelEdge, 3);
        I.doc(ctx, -55, -20, 90, { accent: d.col });
        text(ctx, d.title, 0, 82, { size: 22, weight: 800, align: 'center', color: C.text });
        text(ctx, d.from, 40, -60, { size: 18, weight: 700, align: 'center', color: d.col });
        const st = S.p(d.i, 0.3, 2.0, ease.outBack);
        if (st > 0) I.stamp(ctx, 40, 0, 60 * (2 - st), d.stampL, C.green, -0.25, clamp(st));
        ctx.restore();
      }
      if (S.on(3)) {
        const v = S.vis(3, 0.6, 0.5, ease.outBack);
        ctx.save(); ctx.globalAlpha *= clamp(v);
        const bx = 900, by = 700;
        fillRR(ctx, bx - 110, by - 70, 220, 140, 16, '#12283b', C.amber, 3);
        I.shield(ctx, bx - 55, by, 70, C.amber, 'check');
        text(ctx, 'AoC', bx + 30, by + 12, { size: 40, weight: 900, color: C.amber, fam: K.MONO });
        K.curvedArrow(ctx, [[bx - 110, by - 30], [760, 560], [700, 470]], { color: C.amber, lw: 3, t: S.p(3, 0.8, 1.2), dash: [8, 6] });
        text(ctx, 'for the RIG itself', bx, by + 105, { size: 20, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
      }
    } else {
      // top view: safety zone
      ctx.fillStyle = '#0b3550'; ctx.fillRect(0, 0, 1196, 940);
      // waves texture
      ctx.strokeStyle = rgba('#7cc4ef', 0.08); ctx.lineWidth = 2;
      for (let y = 20; y < 940; y += 40) { ctx.beginPath(); for (let x = 0; x <= 1196; x += 20) ctx.lineTo(x, y + Math.sin(x / 60 + t + y) * 4); ctx.stroke(); }
      const cx = 560, cy = 470, rz = 330;
      const zp = S.p(4, 1.0);
      ctx.save();
      ctx.setLineDash([16, 12]); ctx.lineDashOffset = -t * 20;
      circle(ctx, cx, cy, rz * zp, rgba(C.red, 0.08), C.red, 4);
      ctx.restore();
      dimLineSimple(ctx, cx, cy, cx + rz * zp, cy, '500 m', zp);
      // rig top view
      fillRR(ctx, cx - 50, cy - 40, 100, 80, 8, '#c5ced6', '#56687a', 3);
      fillRR(ctx, cx - 60, cy - 55, 30, 110, 6, '#d9a036'); fillRR(ctx, cx + 30, cy - 55, 30, 110, 6, '#d9a036');
      fillRR(ctx, cx - 50, cy - 40, 100, 80, 8, '#c5ced6');
      circle(ctx, cx, cy, 14, '#8496a7');
      // ship approaching and stopping at the line
      const sp = S.p(4, 4, 0.8, ease.out);
      const sx = lerp(1180, cx + rz + 60, sp), sy = cy - 120;
      boatTop(ctx, sx, sy, 0, '#d8452f');
      if (sp > 0.95) tag(ctx, 'waiting for permission', sx + 10, sy - 50, { size: 18, color: C.amber });
      // standby vessel inside
      const ang = t * 0.15;
      boatTop(ctx, cx + Math.cos(ang) * 200, cy + Math.sin(ang) * 200, ang + Math.PI / 2, '#2f6fb3');
      text(ctx, 'SAFETY ZONE', cx, cy - rz - 20, { size: 28, weight: 900, align: 'center', color: C.red, alpha: zp, spacing: 3 });
    }
  },
};
function boatTop(ctx, x, y, a, col) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(a);
  ctx.beginPath(); ctx.moveTo(-40, -14); ctx.lineTo(30, -14); ctx.quadraticCurveTo(52, 0, 30, 14); ctx.lineTo(-40, 14); ctx.closePath();
  ctx.fillStyle = col; ctx.fill();
  fillRR(ctx, 4, -10, 18, 20, 3, '#eef2f5');
  ctx.restore();
}
function dimLineSimple(ctx, x1, y1, x2, y2, label, a) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  arrow(ctx, x1 + 20, y1, x2 - 4, y2, { color: '#fff', lw: 3, head: 14 });
  text(ctx, label, (x1 + x2) / 2 + 10, y1 - 14, { size: 30, weight: 800, align: 'center', color: '#fff' });
  ctx.restore();
}

// ---------------------------------------------------------------- regulations & standards
function miniBarrierSchematic(ctx, x, y, s, t, a) {
  // tiny well barrier schematic for the D-010 page
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  const S = (v) => v * s;
  ctx.fillStyle = '#e9e4d8'; ctx.fillRect(S(-150), S(-30), S(300), S(420));
  // casing strings
  ctx.fillStyle = '#9aa1a8';
  ctx.fillRect(S(-70), S(40), S(12), S(260)); ctx.fillRect(S(58), S(40), S(12), S(260));
  ctx.fillRect(S(-50), S(40), S(10), S(340)); ctx.fillRect(S(40), S(40), S(10), S(340));
  // BOP
  fillRR(ctx, S(-60), S(-10), S(120), S(50), S(4), '#7d8a96');
  // mud
  ctx.fillStyle = rgba(C.mud, 0.5); ctx.fillRect(S(-40), S(40), S(80), S(340));
  // primary (blue) envelope: mud column
  ctx.strokeStyle = C.blue; ctx.lineWidth = S(5);
  ctx.strokeRect(S(-36), S(44), S(72), S(334));
  // secondary (red): casing, wellhead, BOP
  ctx.strokeStyle = C.red; ctx.lineWidth = S(5);
  ctx.beginPath(); ctx.moveTo(S(-50), S(380)); ctx.lineTo(S(-50), S(30)); ctx.lineTo(S(-62), S(30)); ctx.lineTo(S(-62), S(-12)); ctx.lineTo(S(62), S(-12)); ctx.lineTo(S(62), S(30)); ctx.lineTo(S(50), S(30)); ctx.lineTo(S(50), S(380)); ctx.stroke();
  text(ctx, 'primary', S(-140), S(250), { size: S(20), weight: 800, color: C.blue });
  text(ctx, 'secondary', S(70), S(16), { size: S(20), weight: 800, color: C.red });
  ctx.restore();
}
const standardsScene = {
  id: 'standards',
  title: 'Regulations and standards',
  blurb: 'The rulebook: regulations, NORSOK standards and industry guidelines.',
  beats: [
    {
      term: 'HSE regulations', no: 'HMS-forskriftene',
      def: 'The Framework, Management, Facilities and Activities Regulations (plus one for onshore plants). Drilling people mostly quote the Activities and Facilities Regulations: well barriers, well control, BOP testing.',
      say: 'Safety offshore is governed by the HSE regulations: the Framework, Management, Facilities and Activities Regulations. Drilling people mostly quote the Activities and the Facilities Regulations, for example the sections on well barriers and well control.',
    },
    {
      term: 'NORSOK standards', abbr: 'NORSOK',
      def: 'Norwegian industry standards that the regulations refer to. The D-series covers drilling and wells: D-001 drilling facilities, D-010 well integrity.',
      say: 'The regulations point to industry standards, above all NORSOK. The D series covers drilling and wells: D zero zero one for drilling facilities, and D zero ten for well integrity.',
    },
    {
      term: 'NORSOK D-010', abbr: 'D-010', no: 'brønnintegritet',
      def: 'The well integrity standard: two independent well barriers, barrier elements and their acceptance criteria, testing, and plug & abandonment requirements. The daily reference for D&W on the NCS.',
      ex: 'That plug won’t meet D-010, we need a second barrier.',
      say: 'NORSOK D zero ten, often just called D ten, is the well integrity standard. It defines well barriers, how to verify them, and how to plug a well. In its schematics the primary barrier is drawn in blue and the secondary in red. Expect to hear it quoted every day.',
      tts: 'NORSOK D zero ten, often just called D ten, is the well integrity standard. It defines well barriers, how to verify them, and how to plug a well. In its schematics the primary barrier is drawn in blue, and the secondary in red. Expect to hear it quoted every day.',
    },
    {
      term: 'Offshore Norge',
      def: 'The industry association, formerly Norwegian Oil and Gas (Norsk olje og gass). Its numbered guidelines, for example on well integrity and competence requirements, are used across the shelf.',
      say: 'Offshore Norge, formerly Norwegian Oil and Gas, is the industry association. Its numbered guidelines, for example on well integrity and training, are used by operators and contractors across the shelf.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    // shelves
    const shelf = (y) => { fillRR(ctx, 70, y, 1056, 16, 4, '#6b4f33'); ctx.fillStyle = rgba('#000000', 0.25); ctx.fillRect(70, y + 16, 1056, 8); };
    const open = S.p(2, 1.0, 0.3) * (1 - S.p(3, 0.5));
    const shelfA = 1 - 0.75 * open;
    ctx.save(); ctx.globalAlpha *= shelfA;
    shelf(400); shelf(800);
    const regs = [['Framework', '#4c6f8f'], ['Management', '#56708a'], ['Facilities', '#3d7cc9'], ['Activities', '#3d7cc9'], ['Tech. & Oper.', '#4c6f8f']];
    regs.forEach(([nm, col], i) => {
      const v = S.vis(0, 0.5, 0.3 + i * 0.35, ease.outBack);
      if (v <= 0) return;
      const x = 160 + i * 150, hl = (nm === 'Facilities' || nm === 'Activities') && S.since(0) > 4;
      ctx.save(); ctx.globalAlpha *= clamp(v);
      ctx.translate(x, 400 - 130 - (hl ? 16 : 0)); ctx.scale(1, 1);
      fillRR(ctx, -55, -130, 110, 260, 8, hl ? col : K.mix(col, '#0a1825', 0.3), hl ? C.amber : null, 3);
      ctx.save(); ctx.rotate(-Math.PI / 2);
      text(ctx, nm, 0, 8, { size: 24, weight: 800, align: 'center', color: '#fff' });
      ctx.restore();
      ctx.restore();
    });
    text(ctx, 'HSE REGULATIONS', 160 + 2 * 150, 110, { size: 22, weight: 800, align: 'center', color: C.dim, spacing: 2, alpha: S.vis(0, 0.5) });
    // NORSOK
    if (S.on(1)) {
      const books = [['D-001', 'drilling facilities', '#2f8f6f'], ['D-010', 'well integrity', '#c0392b'], ['D-007', 'well testing', '#2f8f6f'], ['Z-013', 'risk analysis', '#3c5a7a'], ['S-001', 'technical safety', '#3c5a7a']];
      books.forEach(([nm, sub, col], i) => {
        const v = S.vis(1, 0.5, 0.3 + i * 0.3, ease.outBack);
        if (v <= 0) return;
        const x = 160 + i * 150, hl = nm.startsWith('D');
        ctx.save(); ctx.globalAlpha *= clamp(v);
        ctx.translate(x, 800 - 130 - (hl && S.since(1) > 3 ? 16 : 0));
        fillRR(ctx, -55, -130, 110, 260, 8, col, hl && S.since(1) > 3 ? C.amber : null, 3);
        text(ctx, 'NORSOK', 0, -90, { size: 16, weight: 800, align: 'center', color: rgba('#ffffff', 0.8) });
        text(ctx, nm, 0, -50, { size: 28, weight: 900, align: 'center', color: '#fff' });
        ctx.save(); ctx.rotate(-Math.PI / 2); text(ctx, sub, -40, 8, { size: 17, weight: 600, align: 'center', color: rgba('#ffffff', 0.85) }); ctx.restore();
        ctx.restore();
      });
    }
    ctx.restore();
    // D-010 opened
    if (open > 0) {
      ctx.save(); ctx.globalAlpha *= open;
      const bx = 598, by = 470;
      const w = 900 * open;
      fillRR(ctx, bx - w / 2, by - 380, w, 760, 14, '#f4f1ea', '#c0392b', 6);
      line(ctx, bx, by - 370, bx, by + 370, rgba('#000000', 0.2), 3);
      if (open > 0.6) {
        text(ctx, 'NORSOK D-010', bx - 220, by - 300, { size: 40, weight: 900, align: 'center', color: '#c0392b' });
        text(ctx, 'Well integrity in drilling', bx - 220, by - 255, { size: 22, weight: 700, align: 'center', color: '#333' });
        text(ctx, 'and well operations', bx - 220, by - 225, { size: 22, weight: 700, align: 'center', color: '#333' });
        const items = ['Two independent barriers', 'Well barrier elements', 'Acceptance criteria', 'Testing & verification', 'Plug & abandonment'];
        items.forEach((it, i) => text(ctx, '■ ' + it, bx - 400, by - 140 + i * 56, { size: 24, weight: 600, color: '#333', alpha: S.vis(2, 0.4, 1.2 + i * 0.4) }));
        miniBarrierSchematic(ctx, bx + 220, by - 200, 1.2, t, S.vis(2, 0.6, 3.5));
      }
      ctx.restore();
    }
    if (S.on(3)) {
      const v = S.vis(3, 0.6);
      ctx.save(); ctx.globalAlpha *= v;
      fillRR(ctx, 150, 200, 896, 540, 18, '#0b1d2c', C.panelEdge, 2);
      text(ctx, 'Offshore Norge', 598, 290, { size: 56, weight: 900, align: 'center', color: C.text });
      text(ctx, 'industry association  ·  formerly Norsk olje og gass', 598, 335, { size: 22, weight: 500, align: 'center', color: C.dim });
      const gl = ['Well integrity', 'Competence & training', 'Well control incidents'];
      gl.forEach((g, i) => {
        const vv = S.vis(3, 0.5, 1.2 + i * 0.5, ease.outBack);
        if (vv <= 0) return;
        ctx.save(); ctx.globalAlpha *= clamp(vv);
        I.doc(ctx, 330 + i * 270, 500, 110, { accent: C.amber });
        text(ctx, 'Guideline', 330 + i * 270, 600, { size: 18, weight: 700, align: 'center', color: C.amber });
        text(ctx, g, 330 + i * 270, 630, { size: 21, weight: 700, align: 'center', color: C.text });
        ctx.restore();
      });
      ctx.restore();
    }
  },
};

module.exports = {
  id: 'ch01', num: 1, title: 'The NCS, Licences & Regulators',
  subtitle: 'Where we drill, who owns the licence, and who checks our work',
  topics: ['NCS', 'North Sea', 'Norwegian Sea', 'Barents Sea', 'Quadrant & block', 'Well names', 'PL', 'APA', 'Operator', 'Sodir', 'Havtil', 'Permits', 'NORSOK D-010'],
  intro: 'Chapter one. Before any drilling starts, you need to know where we are, who owns the licence, and who checks our work. Let us start with the map.',
  art: (ctx, t) => {
    const P2 = M.makeProj(300, 420, 28, 15, 66);
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    M.drawMap(ctx, P2, { w: 700, h: 900 });
    for (const [k, c] of [['north', C.amber], ['norwegian', C.cyan], ['barents', C.purple]]) M.drawArea(ctx, P2, k, c, 0.35, t);
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [mapScene, blocksScene, licenceScene, partnerScene, regScene, permitScene, standardsScene],
};
