'use strict';
const K = require('../engine/core');
const WL = require('../art/well');
const SS = require('../art/subsea');
const R = require('../art/rig');
const ST = require('../art/string');
const I = require('../art/icons');
const WG = require('../art/widgets');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, darken, richLine } = K;

const AW = {
  cx: 300, seaTop: 40, seabed: 150, td: 900,
  layers: [{ to: 330, kind: 'clay' }, { to: 560, kind: 'shale' }, { to: 640, kind: 'rock2' }, { to: 770, kind: 'sand' }, { to: 940, kind: 'shale' }],
  strings: [{ hw: 52, holeHw: 64, top: 150, shoe: 290, toc: 150 }, { hw: 40, holeHw: 52, top: 150, shoe: 470, toc: 150 }, { hw: 30, holeHw: 40, top: 150, shoe: 620, toc: 450 }],
  hole: { hw: 24, to: 880 },
};
const CX = AW.cx;
const PLUGS = [{ top: 590, bot: 720, label: 'primary barrier', col: C.blue }, { top: 470, bot: 560, label: 'secondary barrier', col: C.red }, { top: 190, bot: 260, label: 'surface plug', col: C.amber }];

function wellPA(ctx, S, st = {}) {
  const { plugs = [], wellhead = true, lift = 0 } = st;
  WL.drawWell(ctx, AW, { t: S.t, plugs: plugs.map((p) => ({ top: p.top, bot: p.bot })) });
  if (wellhead) {
    ctx.save(); ctx.translate(0, -lift);
    SS.wellhead(ctx, CX, AW.seabed + 4, 1.4);
    ctx.restore();
  }
  // sand = reservoir with hydrocarbons
  ctx.fillStyle = rgba(C.oil, 0.22); ctx.fillRect(0, 640, CX - 24, 130); ctx.fillRect(CX + 24, 640, 1196 - CX - 24, 130);
}
// ------------------------------------------------------------ P&A
const paScene = {
  id: 'pa',
  title: 'Plug and abandonment',
  blurb: 'Sealing the well for ever.',
  beats: [
    {
      term: 'Plug and abandonment', abbr: 'P&A', no: 'plugging og permanent forlating',
      def: 'Permanently sealing a well with tested barrier plugs so that no fluids can ever flow, then removing the wellhead. Most NCS exploration wells are plugged and abandoned straight after drilling, logging and testing.',
      ex: 'The well will be plugged and abandoned as a dry well.',
      say: 'Plug and abandonment, or P&A, means permanently sealing the well with tested barrier plugs, so that nothing can ever flow, and then removing the wellhead. Most exploration wells on the NCS are plugged and abandoned straight after drilling, logging and testing.',
    },
    {
      term: 'Permanent well barrier', no: 'permanent brønnbarriere',
      def: 'A barrier meant to last for ever: an “eternal perspective” (NORSOK D-010). It must seal the whole cross-section, inside and outside the casing (“rock to rock”), where the formation is strong enough for the pressure below. Each flowing zone needs a primary and a secondary barrier, plus a surface plug.',
      ex: 'We need good cement behind the casing to get rock to rock.',
      say: 'Permanent barriers are designed with an eternal perspective: they must work for ever. A plug must seal the whole cross section of the well, inside and outside the casing. This is called rock to rock. It must also sit where the rock is strong enough to hold the pressure below. Each zone that can flow needs a primary and a secondary barrier, and there is a final plug near the surface.',
    },
    {
      term: 'Plug setting, tag & test',
      def: 'Cement plugs are usually set as balanced plugs through open-ended pipe, typically 50–100 m long. Once set, they are verified by tagging the top (setting down weight on it) and by a pressure test.',
      ex: 'Tagged top of cement at 2,310 m with 10 tonnes, tested to 70 bar.',
      say: 'Cement plugs are usually set as balanced plugs, pumped through open ended pipe, and are typically fifty to a hundred metres long. When the cement has set, the plug is verified: the pipe is run in to tag the top with some weight, and the plug is pressure tested.',
    },
    {
      term: 'Temporary abandonment', abbr: 'TA', no: 'midlertidig plugging',
      def: 'Securing a well with tested barriers but planning to re-enter it later, for example for a sidetrack, an appraisal or a future development. The wellhead stays on the seabed under a protective cap. Specific requirements and time limits apply.',
      ex: 'We’ll suspend the well and come back for the sidetrack next year.',
      say: 'Temporary abandonment means securing the well with tested barriers, but planning to come back, for example to sidetrack, or to use the well in a future development. The wellhead stays on the seabed, protected by a cap.',
    },
    {
      term: 'Cut & pull and seabed clearance', abbr: 'mudline',
      def: 'The last step of P&A: the casings are cut a few metres below the seabed (the mudline), typically about 5 m, and the wellhead is pulled to the rig. An ROV survey confirms the seabed is clear, so trawlers can fish there safely.',
      ex: 'Wellhead cut at 5 m below mudline and recovered to deck.',
      say: 'The last step of P&A is cut and pull. The casings are cut a few metres below the seabed, also called the mudline, and the wellhead is pulled up to the rig. Finally, an ROV survey confirms that the seabed is clear, so fishing boats can trawl there safely.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      const n = Math.min(3, Math.floor(clamp((tt - 1.5) / 7.5) * 3.999));
      const plugs = PLUGS.slice(0, n);
      const lift = 260 * S.p(0, 2.5, 10.5);
      wellPA(ctx, S, { plugs, lift });
      PLUGS.forEach((p, i) => { if (i < n) callout(ctx, CX + 30, (p.top + p.bot) / 2, 560, (p.top + p.bot) / 2 - 20, p.label, { color: p.col, size: 22, t: S.p(0, 0.6, 1.5 + i * 2.5) }); });
      callout(ctx, CX + 40, 690, 560, 800, 'reservoir', { color: C.oil, size: 22, t: S.p(0, 0.6, 0.5) });
      if (lift > 10) tag(ctx, 'wellhead removed', CX + 220, 90, { size: 20, color: C.green, fill: 'rgba(7,17,28,0.92)' });
      WG.steps(ctx, 760, 260, ['Plug the reservoir: primary barrier', 'Second plug: secondary barrier', 'Surface plug', 'Cut and pull the wellhead'], clamp((tt - 1.5) / 11) * 4, { w: 420, gap: 90 });
    }
    if (bi === 1) {
      const tt = S.since(1);
      const half = (x0, good) => {
        ctx.save(); rr(ctx, x0, 20, 560, 660, 14); ctx.clip();
        K.lithoFill(ctx, 'shale', x0, 20, 560, 660, 4);
        const cx = x0 + 280;
        ctx.fillStyle = C.mud; ctx.fillRect(cx - 120, 20, 240, 660);
        // casing
        ctx.fillStyle = '#9aa6b1'; ctx.fillRect(cx - 82, 20, 14, 660); ctx.fillRect(cx + 68, 20, 14, 660);
        // cement behind casing (only in the good case)
        if (good) { ctx.fillStyle = C.cement; ctx.fillRect(cx - 120, 220, 38, 300); ctx.fillRect(cx + 82, 220, 38, 300); K.speckle(ctx, cx - 120, 220, 240, 300, 200, rgba('#000', 0.15), 5, 1.2); }
        // plug inside
        ctx.fillStyle = C.cement; ctx.fillRect(cx - 68, 260, 136, 220);
        K.speckle(ctx, cx - 68, 260, 136, 220, 120, rgba('#000', 0.2), 3, 1.3);
        // gas from below
        for (let k = 0; k < 10; k++) {
          const ph = (t * 0.35 + k / 10) % 1;
          const side = k % 2 ? 1 : -1;
          let y = lerp(670, good ? 530 : 30, ph);
          if (!good || y > 530) circle(ctx, cx + side * 101, y, 6, C.gas);
        }
        ctx.restore();
        fillRR(ctx, x0, 20, 560, 660, 14, null, good ? C.green : C.red, 3);
        if (good) I.check(ctx, x0 + 500, 80, 60, C.green); else I.xmark(ctx, x0 + 500, 80, 50, C.red);
        text(ctx, good ? 'ROCK TO ROCK' : 'LEAK PATH BEHIND CASING', x0 + 280, 640, { size: 22, weight: 900, align: 'center', color: good ? C.green : C.red, spacing: 1 });
      };
      ctx.save(); ctx.globalAlpha *= S.vis(1, 0.5, 0.5); half(20, false); ctx.restore();
      ctx.save(); ctx.globalAlpha *= S.vis(1, 0.5, 4); half(616, true); ctx.restore();
      ctx.save(); ctx.globalAlpha *= S.vis(1, 0.5, 9);
      fillRR(ctx, 20, 710, 1156, 200, 16, 'rgba(7,17,28,0.92)', C.amber, 2);
      text(ctx, '∞', 100, 840, { size: 120, weight: 800, align: 'center', color: C.amber });
      text(ctx, 'ETERNAL PERSPECTIVE', 190, 770, { size: 22, weight: 900, color: C.amber, spacing: 2 });
      K.para(ctx, 'Full cross-section · strong rock above the zone · primary + secondary for each flowing zone · surface plug', 190, 816, 940, { size: 22, color: C.text, lh: 1.35 });
      ctx.restore();
    }
    if (bi === 2) {
      const tt = S.since(2);
      // balanced plug placement in casing
      ctx.save(); rr(ctx, 20, 20, 560, 900, 14); ctx.clip();
      K.lithoFill(ctx, 'shale', 20, 20, 560, 900, 3);
      const cx = 300;
      ctx.fillStyle = C.cement; ctx.fillRect(cx - 150, 20, 300, 900);
      ctx.fillStyle = '#9aa6b1'; ctx.fillRect(cx - 112, 20, 16, 900); ctx.fillRect(cx + 96, 20, 16, 900);
      ctx.fillStyle = C.mud; ctx.fillRect(cx - 96, 20, 192, 900);
      // mechanical base (bridge plug)
      fillRR(ctx, cx - 96, 760, 192, 30, 4, '#56687a'); text(ctx, 'mechanical plug (base)', cx, 820, { size: 17, weight: 800, align: 'center', color: C.text });
      const fillP = clamp((tt - 1) / 3), pull = clamp((tt - 4.5) / 2), tag2 = clamp((tt - 8) / 1.5);
      const ptop = 760 - 300 * fillP;
      ctx.fillStyle = C.cement; ctx.fillRect(cx - 96, ptop, 192, 760 - ptop);
      K.speckle(ctx, cx - 96, ptop, 192, 760 - ptop, Math.floor((760 - ptop) * 1.2), rgba('#000', 0.2), 6, 1.3);
      let pipeBot = tt < 4.5 ? 750 : lerp(750, 300, pull);
      if (tt > 8) pipeBot = lerp(300, 460, tag2);
      ST.metal(ctx, cx - 14, 20, 28, pipeBot - 20, '#c5ced6');
      if (fillP > 0 && fillP < 1) K.flow(ctx, [[cx, 30], [cx, pipeBot]], t, { color: '#e8eef5', r: 4, spacing: 22, speed: 140 });
      ctx.restore();
      fillRR(ctx, 20, 20, 560, 900, 14, null, C.panelEdge, 2);
      K.dimLine(ctx, cx + 140, 460, cx + 140, 760, '50–100 m', { color: C.amber, size: 20, side: 'right' });
      if (tt > 9.5) tag(ctx, 'TAG ✓', cx, 420, { size: 24, color: C.green, fill: 'rgba(7,17,28,0.92)' });
      // weight indicator + pressure test
      const wob = tt > 9.4 ? 10 : 0;
      gauge(ctx, 760, 210, 100, wob, { min: 0, max: 20, unit: 't', color: wob ? C.green : C.amber });
      text(ctx, 'SET-DOWN WEIGHT', 760, 356, { size: 18, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      const pt = clamp((tt - 11) / 2);
      gauge(ctx, 1010, 210, 100, 70 * pt, { min: 0, max: 100, unit: 'bar', color: pt > 0.99 ? C.green : C.amber });
      text(ctx, 'PRESSURE TEST', 1010, 356, { size: 18, weight: 900, align: 'center', color: C.dim, spacing: 1 });
      WG.steps(ctx, 640, 470, ['Pump cement through open-ended pipe', 'Pull the pipe out slowly: a balanced plug', 'Wait on cement, then tag the top', 'Pressure test the plug'], clamp(tt / 14) * 4, { w: 530, gap: 90 });
    }
    if (bi === 3) {
      const tt = S.since(3);
      wellPA(ctx, S, { plugs: [{ top: 590, bot: 720 }, { top: 470, bot: 560 }] });
      fillRR(ctx, CX - 40, AW.seabed - 92, 80, 30, 8, C.amber, darken(C.amber, 0.4), 2);
      callout(ctx, CX + 40, AW.seabed - 77, 560, 70, 'protective cap', { color: C.amber, size: 22, t: S.p(3, 0.6, 1.5) });
      callout(ctx, CX + 30, 515, 560, 480, 'tested barriers', { color: C.green, size: 22, t: S.p(3, 0.6, 0.5) });
      WG.infoBox(ctx, 680, 140, 490, 'COME BACK LATER FOR…', ['A sidetrack', 'An appraisal well', 'A future development'], S.vis(3, 0.5, 4), { rv: (tt - 4) * 0.6, color: C.cyan });
      I.calendar(ctx, 925, 640, 140, 'LATER');
    }
    if (bi === 4) {
      const tt = S.since(4);
      R.sea(ctx, 1196, 0, 520, t, { amp: 0, top: '#0d3a57', bot: '#061c2c' });
      K.lithoFill(ctx, 'clay', 0, 520, 1196, 420, 4);
      line(ctx, 0, 520, 1196, 520, '#8a7457', 3);
      const cx = 420;
      const cut = clamp((tt - 1.5) / 3), lift = S.p(4, 3, 5);
      const ly = 400 * lift;
      // casings below the cut stay
      for (const [hw, col] of [[90, '#8a96a3'], [66, '#9aa6b1'], [46, '#a9b8c6']]) { ctx.fillStyle = col; ctx.fillRect(cx - hw, 640, 12, 300); ctx.fillRect(cx + hw - 12, 640, 12, 300); }
      // part above the cut lifts with the wellhead
      ctx.save(); ctx.translate(0, -ly);
      for (const [hw, col] of [[90, '#8a96a3'], [66, '#9aa6b1'], [46, '#a9b8c6']]) { ctx.fillStyle = col; ctx.fillRect(cx - hw, 470, 12, 168); ctx.fillRect(cx + hw - 12, 470, 12, 168); }
      SS.wellhead(ctx, cx, 520, 2.4);
      ctx.restore();
      if (lift < 0.05) {
        ST.metal(ctx, cx - 12, 0, 24, 620, '#c5ced6');
        ST.metal(ctx, cx - 30, 620, 60, 30, '#d9a036');
        for (let k = 0; k < 2; k++) line(ctx, cx + (k ? 30 : -30), 635, cx + (k ? 30 + 60 * cut : -30 - 60 * cut), 635, C.amber, 6);
        if (cut > 0 && cut < 1) { const Rn = K.rng(Math.floor(t * 20)); for (let k = 0; k < 10; k++) line(ctx, cx + 92, 638, cx + 92 + Rn() * 40, 638 - Rn() * 30, '#fff3b0', 2); }
      }
      K.dimLine(ctx, cx + 170, 520, cx + 170, 638, '≈ 5 m', { color: C.cyan, size: 20, side: 'right' });
      text(ctx, 'mudline', 40, 510, { size: 20, weight: 800, color: '#e8dcc8' });
      if (lift > 0.98) {
        SS.rov(ctx, 760 - 80 * Math.sin(t * 0.4), 460, 1.3, t, { dir: -1 });
        tag(ctx, 'ROV survey: seabed clear ✓', 820, 360, { size: 22, color: C.green, fill: 'rgba(7,17,28,0.92)' });
      }
      WG.infoBox(ctx, 640, 600, 536, 'CUT AND PULL', ['Cut all casings below the seabed', 'Pull the wellhead to the rig', 'ROV survey: no debris left'], S.vis(4, 0.5, 1), { rv: (tt - 1) * 0.4 });
    }
  },
};

// ------------------------------------------------------------ end of well
function docCard(ctx, x, y, w, h, title) {
  fillRR(ctx, x, y, w, h, 10, '#f7f5ef', '#c9c2b0', 2);
  text(ctx, title, x + 24, y + 46, { size: 24, weight: 900, color: '#222' });
}
const eowScene = {
  id: 'endofwell',
  title: 'End of well and well data',
  blurb: 'Reporting, learning, and making the data available.',
  beats: [
    {
      term: 'End of well report', abbr: 'EOWR', no: 'sluttrapport',
      def: 'The summary of a well after it is finished: operations, time and cost against plan, problems and non-productive time, and lessons learned. Separate geological and data reports are sent to Sodir.',
      ex: 'Who is writing the EOWR for this one?',
      say: 'After the well, the team writes the end of well report, the EOWR. It compares the time and cost with the plan, describes the problems and the non productive time, and collects the lessons learned. Separate geological reports and all the data are sent to Sodir.',
    },
    {
      term: 'Lessons learned & after action review', abbr: 'AAR',
      def: 'A short, structured look back: what went well, what did not, and why. The lessons become actions for the next well. Often held after each section or key operation, not only at the end.',
      ex: 'Let’s do a quick AAR after the casing run.',
      say: 'Lessons learned are collected in an after action review: a short, structured meeting about what went well, what did not, and why. The lessons become actions for the next well. They are often captured after each section, not just at the end.',
    },
    {
      term: 'Well data & DISKOS', abbr: 'DISKOS',
      def: 'All well data (logs, reports, samples and cores) is reported to Sodir. DISKOS is the national data repository for NCS well and seismic data, shared by the companies and the authorities. Exploration well data is normally confidential for two years, then released.',
      ex: 'Download the offset logs from DISKOS.',
      say: 'All well data, the logs, reports, samples and cores, are reported to Sodir. DISKOS is the national database for well and seismic data on the NCS, shared by the companies and the authorities. Data from an exploration well is normally confidential for two years, and is then released to the public.',
    },
    {
      term: 'Sodir FactPages', no: 'Faktasider',
      def: 'Sodir’s public website with facts about every NCS wellbore, licence, field and discovery: location, dates, operator, purpose, content, total depth, formation tops, cores and documents. The first stop for offset wells.',
      ex: 'Check the FactPages for 7220/8-1 before the meeting.',
      say: 'Sodir’s FactPages are a public website with facts about every wellbore, licence, field and discovery on the NCS: where it is, who drilled it and when, what it found, and its formation tops and cores. It is the first place to look up an offset well.',
    },
    {
      term: 'Well result announcement', no: 'brønnresultat',
      def: 'When an exploration well is finished, Sodir publishes a short news item on the result: a dry well, or a discovery with a first size estimate in million Sm³ oil equivalents. Listed licensees may also announce it to the stock market.',
      ex: 'Sodir has published the result: a small gas discovery.',
      say: 'When an exploration well is finished, Sodir publishes a short news item about the result: a dry well, or a discovery, with a first estimate of its size, in million standard cubic metres of oil equivalents. Listed companies may announce it to the stock market too. One day, it will be your well in the news.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      docCard(ctx, 30, 30, 1140, 880, 'END OF WELL REPORT');
      text(ctx, 'Example exploration well', 30 + 24, 100, { size: 18, weight: 600, color: '#666' });
      // time-depth plan vs actual
      const X = (d) => 90 + (d / 50) * 480, Y = (m) => 170 + (m / 3000) * 380;
      line(ctx, X(0), Y(0), X(0), Y(3000), '#888', 2); line(ctx, X(0), Y(0), X(50), Y(0), '#888', 2);
      text(ctx, 'days →', X(50), Y(0) - 10, { size: 15, weight: 700, align: 'right', color: '#666' });
      text(ctx, 'depth ↓', X(0) + 8, Y(3000) - 6, { size: 15, weight: 700, color: '#666' });
      const plan = [[0, 0], [3, 400], [6, 400], [10, 1200], [14, 1200], [20, 2200], [25, 2200], [31, 3000], [38, 3000]];
      const act = [[0, 0], [3, 420], [7, 420], [11, 1200], [17, 1200], [24, 2200], [30, 2200], [37, 3000], [45, 3000]];
      const pp = S.p(0, 5, 1, ease.linear);
      K.partialPolyline(ctx, plan.map(([d, m]) => [X(d), Y(m)]), pp, '#2c62c9', 3, [8, 6]);
      K.partialPolyline(ctx, act.map(([d, m]) => [X(d), Y(m)]), pp, '#c0392b', 4);
      if (pp > 0.95) { text(ctx, 'plan', X(31) + 6, Y(3000) - 12, { size: 17, weight: 800, color: '#2c62c9' }); text(ctx, 'actual', X(45) - 50, Y(3000) + 26, { size: 17, weight: 800, color: '#c0392b' }); callout(ctx, X(14), Y(1200), X(20), Y(700), 'stuck pipe: 3 days NPT', { color: '#c0392b', size: 18, bg: 'rgba(255,255,255,0.95)', textColor: '#222', maxX: 600 }); }
      // cost
      const cp = S.vis(0, 0.6, 6);
      ctx.save(); ctx.globalAlpha *= cp;
      text(ctx, 'COST (MNOK)', 700, 190, { size: 18, weight: 900, color: '#444', spacing: 1 });
      fillRR(ctx, 700, 220, 380 * 0.82, 50, 4, '#2c62c9'); text(ctx, 'AFE  410', 712, 254, { size: 20, weight: 800, color: '#fff' });
      fillRR(ctx, 700, 290, 380 * 0.93, 50, 4, '#c0392b'); text(ctx, 'actual  465', 712, 324, { size: 20, weight: 800, color: '#fff' });
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= S.vis(0, 0.6, 9);
      text(ctx, 'CONTENTS', 700, 420, { size: 18, weight: 900, color: '#444', spacing: 1 });
      ['Summary & objectives', 'Operations by section', 'Time & cost vs plan', 'NPT & problems', 'Lessons learned'].forEach((s, i) => { circle(ctx, 712, 452 + i * 40, 5, '#b45309'); text(ctx, s, 728, 459 + i * 40, { size: 20, weight: 600, color: '#333' }); });
      ctx.restore();
      text(ctx, '(illustrative numbers)', 1150, 890, { size: 15, weight: 600, align: 'right', color: '#888' });
    }
    if (bi === 1) {
      const tt = S.since(1);
      const cols = [['WHAT WENT WELL', C.green, ['Fast top hole', 'Good cement jobs', 'Zero injuries']], ['WHAT DIDN’T', C.red, ['Stuck pipe in 12¼ in', 'Waiting on weather', 'Late MWD spares']], ['ACTIONS', C.amber, ['Change mud for the shales', 'Pre-order critical spares', 'Update the risk register']]];
      cols.forEach(([n, col, notes], i) => {
        const x = 30 + i * 385;
        ctx.save(); ctx.globalAlpha *= S.vis(1, 0.4, 0.5 + i * 2.5);
        WG.panel(ctx, x, 30, 365, 620, n, col);
        notes.forEach((s, j) => {
          const a = S.vis(1, 0.3, 1 + i * 2.5 + j * 0.6);
          ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + 182, 150 + j * 160); ctx.rotate((j % 2 ? 1 : -1) * 0.03);
          fillRR(ctx, -150, -55, 300, 120, 6, ['#fff3a3', '#ffd6e0', '#c9f2d1'][i]);
          K.para(ctx, s, -130, -10, 260, { size: 22, weight: 700, color: '#222' });
          ctx.restore();
        });
        ctx.restore();
      });
      ['Driller', 'Engineer', 'Supervisor', 'Geologist', 'Toolpusher'].forEach((n, i) => I.person(ctx, 160 + i * 220, 760, 100, { shirt: [C.orange, C.blue, C.blue, C.green, C.orange][i], label: n, alpha: S.vis(1, 0.4, 8 + i * 0.3) }));
    }
    if (bi === 2) {
      const tt = S.since(2);
      const src = [['logs', 'wave'], ['reports', 'doc'], ['samples', 'bag'], ['cores', 'core']];
      src.forEach(([n, k], i) => {
        const a = S.vis(2, 0.4, 0.5 + i * 0.6);
        const y = 90 + i * 140;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, 40, y, 260, 110, 14, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
        if (k === 'doc') I.doc(ctx, 100, y + 55, 70);
        if (k === 'wave') { const pts = []; for (let j = 0; j < 30; j++) pts.push([70 + j * 2.4, y + 55 + Math.sin(j * 0.9) * 22 * Math.sin(j * 0.2)]); K.partialPolyline(ctx, pts, 1, C.green, 3); }
        if (k === 'bag') fillRR(ctx, 76, y + 22, 50, 66, 8, '#efe8d8', '#b8ad94', 2);
        if (k === 'core') { K.lithoFill(ctx, 'sand', 66, y + 40, 70, 30, 3); fillRR(ctx, 66, y + 40, 70, 30, 4, null, '#6b4f30', 2); }
        text(ctx, n, 230, y + 64, { size: 22, weight: 800, align: 'center', color: C.text });
        ctx.restore();
        K.curvedArrow(ctx, [[300, y + 55], [420, y + 55], [500, 380]], { color: C.amber, lw: 3, head: 12, t: S.p(2, 0.8, 1.5 + i * 0.4) });
      });
      // Sodir + DISKOS
      ctx.save(); ctx.globalAlpha *= S.vis(2, 0.5, 3);
      fillRR(ctx, 520, 250, 300, 260, 18, 'rgba(7,17,28,0.92)', C.cyan, 2);
      I.building(ctx, 670, 340, 110, '#cdd8e3');
      text(ctx, 'SODIR', 670, 470, { size: 30, weight: 900, align: 'center', color: C.cyan, spacing: 3 });
      // database cylinder
      const dx = 1000, dy = 280;
      ctx.fillStyle = '#2b4a63'; ctx.fillRect(dx - 110, dy, 220, 180);
      ctx.beginPath(); ctx.ellipse(dx, dy + 180, 110, 30, 0, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.ellipse(dx, dy, 110, 30, 0, 0, Math.PI * 2); ctx.fillStyle = '#3d6a8f'; ctx.fill();
      for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.ellipse(dx, dy + k * 60, 110, 30, 0, 0, Math.PI); ctx.strokeStyle = '#3d6a8f'; ctx.lineWidth = 3; ctx.stroke(); }
      text(ctx, 'DISKOS', dx, dy + 110, { size: 30, weight: 900, align: 'center', color: '#fff', spacing: 2 });
      arrow(ctx, 825, 380, 880, 380, { color: C.cyan, lw: 4, head: 14 });
      ctx.restore();
      // confidentiality timeline
      ctx.save(); ctx.globalAlpha *= S.vis(2, 0.5, 9);
      fillRR(ctx, 360, 640, 800, 200, 16, 'rgba(7,17,28,0.92)', C.amber, 2);
      const tl = clamp((tt - 9.5) / 3);
      fillRR(ctx, 400, 740, 720, 20, 10, '#1d3a52');
      fillRR(ctx, 400, 740, 720 * tl, 20, 10, tl < 1 ? C.red : C.green);
      text(ctx, 'well finished', 400, 720, { size: 18, weight: 700, color: C.dim });
      text(ctx, '2 years', 760, 800, { size: 22, weight: 900, align: 'center', color: C.text });
      text(ctx, tl < 1 ? 'CONFIDENTIAL' : 'PUBLIC ✓', 1120, 720, { size: 20, weight: 900, align: 'right', color: tl < 1 ? C.red : C.green });
      ctx.restore();
    }
    if (bi === 3) {
      // browser mock-up
      fillRR(ctx, 30, 30, 1140, 880, 14, '#f7f9fb', '#9aa6b1', 2);
      fillRR(ctx, 30, 30, 1140, 64, 14, '#dfe5ea');
      for (let k = 0; k < 3; k++) circle(ctx, 66 + k * 26, 62, 8, ['#ff5f57', '#febc2e', '#28c840'][k]);
      fillRR(ctx, 170, 44, 700, 36, 18, '#ffffff', '#c3ccd5', 1.5);
      text(ctx, 'factpages.sodir.no  ›  Wellbore  ›  Exploration', 194, 69, { size: 18, weight: 600, color: '#555' });
      text(ctx, 'Wellbore 7220/8-1', 70, 160, { size: 40, weight: 900, color: '#1b2a38' });
      const rows = [['Purpose', 'WILDCAT'], ['Content', 'OIL / GAS'], ['Production licence', '532'], ['Discovery', '7220/8-1 Johan Castberg (Skrugard)'], ['Main area', 'BARENTS SEA'], ['Completion year', '2011']];
      rows.forEach(([k, v], i) => {
        const a = S.vis(3, 0.3, 1 + i * 0.7);
        const y = 230 + i * 70;
        ctx.save(); ctx.globalAlpha *= a;
        if (i % 2 === 0) { ctx.fillStyle = '#eef2f6'; ctx.fillRect(60, y - 42, 1080, 64); }
        text(ctx, k, 80, y, { size: 24, weight: 600, color: '#555' });
        text(ctx, v, 460, y, { size: 26, weight: 800, color: '#1b2a38' });
        ctx.restore();
      });
      ctx.save(); ctx.globalAlpha *= S.vis(3, 0.5, 6);
      text(ctx, 'Also: formation tops · cores · logs · documents · drilling history', 80, 700, { size: 22, weight: 700, color: '#2c62c9' });
      ctx.restore();
      tag(ctx, 'tip: look up offset wells here', 600, 820, { size: 24, color: '#b45309', fill: '#fff4e0', alpha: S.vis(3, 0.5, 8) });
    }
    if (bi === 4) {
      const cards = [['DRY WELL IN THE NORTH SEA', 'The well did not find petroleum. It has been permanently plugged and abandoned.', '#555'], ['GAS DISCOVERY IN THE NORWEGIAN SEA', 'Preliminary estimate: between 1 and 3 million Sm³ of recoverable oil equivalents.', '#15803d']];
      cards.forEach(([h, b, col], i) => {
        const a = S.vis(4, 0.5, 0.6 + i * 4);
        ctx.save(); ctx.globalAlpha *= a;
        const y = 50 + i * 330;
        fillRR(ctx, 60, y, 1076, 290, 14, '#ffffff', '#c9d1d9', 2);
        fillRR(ctx, 60, y, 14, 290, 4, col);
        text(ctx, 'NEWS · WELL RESULT', 104, y + 50, { size: 18, weight: 900, color: '#888', spacing: 2 });
        text(ctx, h, 104, y + 104, { size: 36, weight: 900, color: '#1b2a38' });
        K.para(ctx, b, 104, y + 160, 980, { size: 26, color: '#333', lh: 1.4 });
        I.stamp(ctx, 1010, y + 60, 90, 'EXAMPLE', C.amber, 0.15, 0.85);
        ctx.restore();
      });
      tag(ctx, 'one day it will be your well', 598, 760, { size: 28, color: C.amber, fill: 'rgba(7,17,28,0.94)', alpha: S.vis(4, 0.5, 12) });
    }
  },
};

module.exports = {
  id: 'ch17', num: 17, title: 'P&A and End of Well',
  subtitle: 'Sealing the well for ever, and passing on what we learned',
  topics: ['P&A', 'Eternal perspective', 'Rock to rock', 'Tag & test', 'TA', 'Cut & pull', 'Mudline', 'EOWR', 'AAR', 'DISKOS', 'FactPages', 'Well result'],
  intro: 'Chapter seventeen: plug and abandonment, and the end of the well. An exploration well is usually sealed for ever once the data is collected. Then the learning and the reporting begin.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0b1a29'; ctx.fillRect(0, 0, 700, 900);
    ctx.save(); ctx.translate(30, -40);
    const fake = { t, since: () => 99, vis: () => 1, p: () => 1 };
    WL.drawWell(ctx, AW, { t, plugs: PLUGS.map((p) => ({ top: p.top, bot: p.bot })) });
    ctx.restore();
    ctx.restore();
    ctx.strokeStyle = rgba(C.purple, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [paScene, eowScene],
};
