'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const I = require('../art/icons');
const { C, rgba, text, fillRR, clamp, ease, tag, circle, line } = K;

// grid of acronym tiles; each beat lights up a group of five
function tileGrid(ctx, S, tiles, color) {
  const cols = 5, w = 344, h = 176, gx = 22, gy = 22, x0 = 26, y0 = 34;
  tiles.forEach(([ab, ex], i) => {
    const b = Math.floor(i / 5), k = i % 5;
    const x = x0 + k * (w + gx), y = y0 + b * (h + gy);
    const on = S.bi === b;
    const done = S.bi > b;
    const appear = clamp((S.since(b) - 0.3 - k * 0.9) / 0.4);
    const a = done ? 1 : on ? 0.25 + 0.75 * appear : 0.22;
    ctx.save(); ctx.globalAlpha *= a;
    const sc = on ? 1 + 0.04 * ease.outBack(appear) * (1 - clamp((S.since(b) - 1.5 - k * 0.9) / 0.6)) : 1;
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc);
    fillRR(ctx, -w / 2, -h / 2, w, h, 16, on && appear > 0 ? rgba(color, 0.14) : 'rgba(7,17,28,0.92)', on && appear > 0 ? color : C.panelEdge, on ? 3 : 2);
    text(ctx, ab, 0, -10, { size: ab.length > 5 ? 44 : 54, weight: 800, align: 'center', color: on || done ? color : C.dim, fam: ab.includes('&') || ab.length > 6 ? K.FONT : K.MONO });
    K.para(ctx, ex, -w / 2 + 18, 44, w - 36, { size: 20, weight: 600, color: C.text, align: 'left', maxLines: 2 });
    ctx.restore();
  });
}
function recapScene(id, title, color, tiles, says) {
  return {
    id, title, layout: 'full',
    blurb: 'Say it before the narrator does.',
    beats: says.map((say) => ({ say })),
    draw(ctx, S) { tileGrid(ctx, S, tiles, color); },
  };
}
const R1 = [
  ['RKB', 'rotary kelly bushing: the depth reference'], ['MD', 'measured depth, along the hole'], ['TVD', 'true vertical depth'], ['KOP', 'kick-off point'], ['DLS', 'dogleg severity'],
  ['BHA', 'bottom hole assembly'], ['MWD', 'measurement while drilling'], ['LWD', 'logging while drilling'], ['RSS', 'rotary steerable system'], ['PDC', 'polycrystalline diamond compact bit'],
  ['WOB', 'weight on bit'], ['RPM', 'revolutions per minute'], ['ROP', 'rate of penetration'], ['SPP', 'standpipe pressure'], ['ECD', 'equivalent circulating density'],
  ['RIH', 'run in hole'], ['POOH', 'pull out of hole'], ['TD', 'total depth'], ['NPT', 'non-productive time'], ['DDR', 'daily drilling report'],
];
const R2 = [
  ['SG', 'specific gravity'], ['EMW', 'equivalent mud weight'], ['PP', 'pore pressure'], ['FG', 'fracture gradient'], ['LOT', 'leak-off test'],
  ['FIT', 'formation integrity test'], ['MAASP', 'max. allowable annular surface pressure'], ['HPHT', 'high pressure, high temperature'], ['MPD', 'managed pressure drilling'], ['BOP', 'blowout preventer'],
  ['LMRP', 'lower marine riser package'], ['BSR', 'blind shear ram'], ['EDS', 'emergency disconnect sequence'], ['SIDPP', 'shut-in drill pipe pressure'], ['SICP', 'shut-in casing pressure'],
  ['KMW', 'kill mud weight'], ['WBS', 'well barrier schematic'], ['WBE', 'well barrier element'], ['TOC', 'top of cement'], ['P&A', 'plug and abandonment'],
];
const R3 = [
  ['TWT', 'two-way time'], ['DHI', 'direct hydrocarbon indicator'], ['POS', 'probability of success'], ['STOIIP', 'stock tank oil initially in place'], ['GIIP', 'gas initially in place'],
  ['GOC', 'gas-oil contact'], ['OWC', 'oil-water contact'], ['FWL', 'free water level'], ['BCU', 'Base Cretaceous Unconformity'], ['GR', 'gamma ray'],
  ['CPI', 'computer-processed interpretation'], ['VSP', 'vertical seismic profile'], ['PVT', 'pressure-volume-temperature (fluid lab)'], ['GOR', 'gas-oil ratio'], ['SWC', 'sidewall core'],
  ['DST', 'drill stem test'], ['PI', 'productivity index'], ['RCA', 'routine core analysis'], ['SCAL', 'special core analysis'], ['LAS', 'log file format'],
];
const R4 = [
  ['NCS', 'Norwegian Continental Shelf'], ['PL', 'production licence'], ['APA', 'awards in predefined areas'], ['AoC', 'acknowledgement of compliance'], ['MODU', 'mobile offshore drilling unit'],
  ['DP', 'dynamic positioning (or drill pipe!)'], ['PSV', 'platform supply vessel'], ['ERRV', 'emergency response & rescue vessel'], ['ROV', 'remotely operated vehicle'], ['OIM', 'offshore installation manager'],
  ['POB', 'persons on board'], ['GSK', 'basic offshore safety course'], ['HUET', 'helicopter underwater escape training'], ['SJA', 'safe job analysis'], ['AT', 'work permit (arbeidstillatelse)'],
  ['RUH', 'report of unwanted incident'], ['DFU', 'defined hazard & accident situations'], ['PPE', 'personal protective equipment'], ['DWOP', 'drill the well on paper'], ['MOC', 'management of change'],
];
const s1 = recapScene('recap1', 'Drilling and the rig', C.amber, R1, [
  'Ready? RKB: rotary kelly bushing, the depth reference. MD: measured depth. TVD: true vertical depth. KOP: kick off point. DLS: dogleg severity.',
  'BHA: bottom hole assembly. MWD: measurement while drilling. LWD: logging while drilling. RSS: rotary steerable system. PDC: polycrystalline diamond compact, the bit.',
  'WOB: weight on bit. RPM: revolutions per minute. ROP: rate of penetration. SPP: standpipe pressure. ECD: equivalent circulating density.',
  'RIH: run in hole. POOH: pull out of hole. TD: total depth. NPT: non productive time. DDR: the daily drilling report.',
]);
const s2 = recapScene('recap2', 'Pressure, well control and barriers', C.red, R2, [
  'SG: specific gravity. EMW: equivalent mud weight. PP: pore pressure. FG: fracture gradient. LOT: leak off test.',
  'FIT: formation integrity test. MAASP: maximum allowable annular surface pressure. HPHT: high pressure, high temperature. MPD: managed pressure drilling. BOP: blowout preventer.',
  'LMRP: lower marine riser package. BSR: blind shear ram. EDS: emergency disconnect sequence. SIDPP: shut in drill pipe pressure. SICP: shut in casing pressure.',
  'KMW: kill mud weight. WBS: well barrier schematic. WBE: well barrier element. TOC: top of cement. And P&A: plug and abandonment.',
]);
const s3 = recapScene('recap3', 'Geology and formation evaluation', C.green, R3, [
  'TWT: two way time. DHI: direct hydrocarbon indicator. POS: probability of success. STOIIP: stock tank oil initially in place. GIIP: gas initially in place.',
  'GOC: gas oil contact. OWC: oil water contact. FWL: free water level. BCU: the Base Cretaceous Unconformity. GR: gamma ray.',
  'CPI: computer processed interpretation. VSP: vertical seismic profile. PVT: pressure, volume, temperature, the fluid lab. GOR: gas oil ratio. SWC: sidewall core.',
  'DST: drill stem test. PI: productivity index. RCA: routine core analysis. SCAL: special core analysis. And LAS: the standard log file format.',
]);
const s4 = recapScene('recap4', 'The NCS, people and safety', C.cyan, R4, [
  'NCS: Norwegian Continental Shelf. PL: production licence. APA: awards in predefined areas. AoC: acknowledgement of compliance. MODU: mobile offshore drilling unit.',
  'DP: dynamic positioning, or drill pipe! PSV: platform supply vessel. ERRV: emergency response and rescue vessel. ROV: remotely operated vehicle. OIM: offshore installation manager.',
  'POB: persons on board. GSK: the basic safety course. HUET: helicopter underwater escape training. SJA: safe job analysis. AT: work permit.',
  'RUH: report of unwanted incident. DFU: defined hazard and accident situations. PPE: personal protective equipment. DWOP: drill the well on paper. MOC: management of change.',
]);

// ------------------------------------------------------------ outro
const TIPS = [
  ['Ask questions', 'Nobody expects a graduate to know it all. Everyone was new once.', C.amber],
  ['Read the programme', 'Drilling programme and well barrier schematics: the best textbook.', C.cyan],
  ['Get offshore early', 'Seeing the drill floor makes every word stick.', C.orange],
  ['Study offset wells', 'Sodir FactPages, DISKOS and old end of well reports.', C.green],
  ['Keep a lingo notebook', 'Write down every new word, and ask what it means.', C.purple],
];
const outro = {
  id: 'outro', title: 'Good luck on your rotation', layout: 'full',
  blurb: 'Five tips to finish.',
  beats: [
    { say: 'That is it. More than three hundred and fifty terms, from the licence to the plug. You now know the language of exploration drilling on the Norwegian Continental Shelf.' },
    { say: 'Five tips for your rotation. Ask questions: nobody expects you to know everything, and everyone was new once. Read the drilling programme and the well barrier schematics. Get offshore early. Study the offset wells on the FactPages. And keep your own lingo notebook.' },
    { say: 'Good luck on your rotation, and stay safe out there.', min: 6 },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const n = Math.round(350 * ease.out(clamp(S.since(0) / 4)));
      text(ctx, `${n}+`, 920, 470, { size: 260, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
      text(ctx, 'TERMS, FROM THE LICENCE TO THE PLUG', 920, 580, { size: 34, weight: 900, align: 'center', color: C.text, spacing: 3 });
      text(ctx, 'you now speak D&W', 920, 680, { size: 40, weight: 700, align: 'center', color: C.dim, alpha: S.vis(0, 0.5, 4) });
    }
    if (bi === 1) {
      text(ctx, 'FIVE TIPS FOR YOUR ROTATION', 920, 90, { size: 36, weight: 900, align: 'center', color: C.text, spacing: 3 });
      TIPS.forEach(([h, b, col], i) => {
        const a = S.vis(1, 0.5, 1 + i * 3);
        const y = 140 + i * 150;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, 200, y, 1440, 130, 18, 'rgba(7,17,28,0.92)', col, 3);
        circle(ctx, 280, y + 65, 42, rgba(col, 0.2), col, 3);
        text(ctx, String(i + 1), 280, y + 82, { size: 44, weight: 900, align: 'center', color: col });
        text(ctx, h, 360, y + 58, { size: 36, weight: 900, color: C.text });
        text(ctx, b, 360, y + 102, { size: 26, weight: 500, color: C.dim });
        ctx.restore();
      });
    }
    if (bi === 2) {
      R.sky(ctx, 1840, 600, { top: '#0b1f33', bot: '#3b5b7a' });
      // sunrise
      const g = ctx.createRadialGradient(1400, 600, 10, 1400, 600, 500); g.addColorStop(0, 'rgba(255,190,90,0.7)'); g.addColorStop(1, 'rgba(255,190,90,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, 1840, 600);
      R.sea(ctx, 1840, 600, 940, t, { amp: 5 });
      R.semi(ctx, 1460, 600, 1.8, t, { heave: Math.sin(t * 0.8) * 3 });
      I.helicopter(ctx, 200 + S.since(2) * 70, 150 - Math.sin(t * 0.6) * 10, 120, t);
      ctx.save(); ctx.globalAlpha *= S.vis(2, 0.8, 0.5);
      text(ctx, 'GOOD LUCK', 520, 420, { size: 120, weight: 900, align: 'center', color: C.white });
      text(ctx, 'ON YOUR ROTATION', 520, 510, { size: 54, weight: 800, align: 'center', color: C.amber, spacing: 4 });
      text(ctx, 'and stay safe out there', 520, 600, { size: 36, weight: 600, align: 'center', color: C.text });
      ctx.restore();
    }
  },
};

module.exports = {
  id: 'ch20', num: 20, title: 'Rapid-Fire Recap',
  subtitle: 'The acronyms you will hear every day. Say them before I do!',
  topics: ['80 acronyms', 'Drilling', 'Pressure & barriers', 'Geology & evaluation', 'NCS & safety'],
  intro: 'Final chapter: a rapid-fire recap of eighty acronyms you will hear every day. Try to say what each one means before I do.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0b1a29'; ctx.fillRect(0, 0, 700, 900);
    const ab = ['BOP', 'ROP', 'ECD', 'TVD', 'WBS', 'POB', 'DST', 'MWD', 'LOT', 'SJA', 'GR', 'P&A'];
    ab.forEach((s, i) => {
      const x = 160 + (i % 3) * 170, y = 230 + Math.floor(i / 3) * 130 + Math.sin(t * 1.2 + i) * 8;
      tag(ctx, s, x, y, { size: 40, color: [C.amber, C.cyan, C.green, C.red][i % 4], fam: K.MONO, fill: 'rgba(7,17,28,0.9)' });
    });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [s1, s2, s3, s4, outro],
};
