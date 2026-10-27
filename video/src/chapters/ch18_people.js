'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const I = require('../art/icons');
const WG = require('../art/widgets');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, darken, richLine } = K;

// ------------------------------------------------------------ companies and the onshore team
function orgBox(ctx, x, y, w, h, title, sub, col, a = 1, hl = 0, t = 0) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, x, y, w, h, 12, hl > 0 ? rgba(col, 0.22) : 'rgba(7,17,28,0.92)', col, hl > 0 ? 3 : 2);
  text(ctx, title, x + w / 2, y + (sub ? h / 2 - 2 : h / 2 + 7), { size: 19, weight: 800, align: 'center', color: C.text });
  if (sub) text(ctx, sub, x + w / 2, y + h / 2 + 22, { size: 15, weight: 600, align: 'center', color: C.dim });
  ctx.restore();
  if (hl > 0) K.highlightRect(ctx, x - 5, y - 5, w + 10, h + 10, t, { alpha: hl, color: col });
}
const teamScene = {
  id: 'team',
  title: 'Who does what: companies and the onshore team',
  blurb: 'The names you will see on every org chart.',
  beats: [
    {
      term: 'Operator, drilling contractor & service companies', no: 'operatør / borekontraktør / serviceselskap',
      def: 'The operator (the oil company) designs the well, holds the licence and pays. The drilling contractor owns the rig and employs the rig crew, paid a day rate. Service companies deliver specialist services: mud, cement, directional drilling, MWD/LWD, logging, testing, ROV.',
      ex: 'That’s a contractor issue, take it up with the toolpusher.',
      say: 'Three kinds of companies work together on a well. The operator, the oil company, designs the well, holds the licence and pays. The drilling contractor owns the rig and employs the rig crew, paid by the day. And service companies provide the specialists: mud, cement, directional drilling, logging, testing and more.',
    },
    {
      term: 'Drilling & well engineer', no: 'bore- og brønningeniør',
      def: 'Designs the well and writes the programmes: casing, cement, mud, hydraulics, BHA and trajectory, barriers and risk assessments; then follows up the operation every day with the rig. Where most D&W graduates start.',
      ex: 'Ask the drilling engineer to rerun the torque and drag model.',
      say: 'The drilling engineer designs the well and writes the programmes: casing, cement, mud, hydraulics, the BHA and the trajectory, the barriers and the risk assessments. During the operation, the engineer follows up the rig every day. This is where most D&W graduates start.',
    },
    {
      term: 'Drilling superintendent & D&W manager',
      def: 'The drilling superintendent leads the operational well team for a rig or campaign and is the onshore link to the rig. The D&W manager has overall responsibility for wells, budgets and people. Titles vary between companies.',
      ex: 'The supe wants the lookahead updated before the morning call.',
      say: 'The drilling superintendent, often just called the supe, leads the operational team for a rig, and is the onshore link to the rig. Above them, the D&W manager has the overall responsibility for wells, budgets and people. The exact titles vary between companies.',
    },
    {
      term: 'Operations geologist & petrophysicist', no: 'operasjonsgeolog / petrofysiker',
      def: 'The operations geologist links the exploration team and D&W: prognosis, formation tops, sampling, coring and logging programmes, core points and TD decisions. The petrophysicist plans the logging and interprets it.',
      ex: 'Ops geo says we’re 12 m shallow to prognosis.',
      say: 'The operations geologist is the link between the exploration team and D&W. They own the prognosis of formation tops, plan sampling, coring and logging, and help decide core points and total depth. The petrophysicist plans the logging, and interprets the logs.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const cols = [['OPERATOR', C.blue, 'oil company', ['designs the well', 'holds the licence', 'pays the bills'], 'building'], ['DRILLING CONTRACTOR', C.orange, 'rig owner', ['owns and runs the rig', 'employs the rig crew', 'paid a day rate'], 'rig'], ['SERVICE COMPANIES', C.green, 'specialists', ['mud, cement, directional', 'MWD/LWD, logging, testing', 'ROV, catering, …'], 'gear']];
      cols.forEach(([n, col, sub, items, ic], i) => {
        const a = S.vis(0, 0.5, 0.6 + i * 2.5);
        const x = 30 + i * 385;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, 40, 365, 560, 16, 'rgba(7,17,28,0.92)', col, 3);
        const cx = x + 182;
        if (ic === 'building') { I.building(ctx, cx, 170, 120, '#cdd8e3'); I.drop(ctx, cx + 60, 130, 40, '#2a2a2a'); }
        if (ic === 'rig') R.semi(ctx, cx, 200, 0.5, t);
        if (ic === 'gear') { I.gear(ctx, cx - 30, 160, 90, t * 0.6, C.steel); I.gear(ctx, cx + 45, 205, 60, -t * 0.9, C.steelMid); }
        text(ctx, n, cx, 300, { size: 24, weight: 900, align: 'center', color: col, spacing: 1 });
        text(ctx, sub, cx, 332, { size: 19, weight: 600, align: 'center', color: C.dim });
        items.forEach((s, j) => { circle(ctx, x + 40, 392 + j * 52, 5, col); text(ctx, s, x + 56, 399 + j * 52, { size: 21, weight: 600, color: C.text }); });
        ctx.restore();
      });
      ctx.save(); ctx.globalAlpha *= S.vis(0, 0.5, 9);
      fillRR(ctx, 30, 640, 1135, 260, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'CONTRACTS', 598, 690, { size: 20, weight: 900, align: 'center', color: C.amber, spacing: 2 });
      arrow(ctx, 330, 760, 470, 760, { color: C.orange, lw: 4, head: 14 }); arrow(ctx, 470, 790, 330, 790, { color: C.blue, lw: 4, head: 14 });
      text(ctx, 'rig contract', 400, 830, { size: 19, weight: 700, align: 'center', color: C.dim });
      arrow(ctx, 720, 760, 860, 760, { color: C.green, lw: 4, head: 14 }); arrow(ctx, 860, 790, 720, 790, { color: C.blue, lw: 4, head: 14 });
      text(ctx, 'service contracts', 790, 830, { size: 19, weight: 700, align: 'center', color: C.dim });
      text(ctx, 'the operator is the customer of both', 598, 880, { size: 20, weight: 700, align: 'center', color: C.text });
      ctx.restore();
    }
    if (bi === 1) {
      const tt = S.since(1);
      // engineer at a desk with screens
      fillRR(ctx, 30, 40, 560, 520, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      for (let k = 0; k < 2; k++) {
        const x = 70 + k * 250;
        fillRR(ctx, x, 80, 230, 170, 10, '#0b1520', '#56687a', 2);
        if (k === 0) { for (let j = 0; j < 4; j++) { const hw = 70 - j * 15, d = 100 + j * 30; line(ctx, x + 115 - hw, 95, x + 115 - hw, 95 + d, C.steel, 3); line(ctx, x + 115 + hw, 95, x + 115 + hw, 95 + d, C.steel, 3); } text(ctx, 'casing design', x + 115, 240, { size: 15, weight: 700, align: 'center', color: C.dim }); }
        else { const pts = []; for (let j = 0; j <= 30; j++) { const u = j / 30; pts.push([x + 30 + (u > 0.3 ? Math.pow((u - 0.3) / 0.7, 1.6) * 150 : 0), 95 + u * 130]); } K.partialPolyline(ctx, pts, 1, C.amber, 3); text(ctx, 'trajectory', x + 115, 240, { size: 15, weight: 700, align: 'center', color: C.dim }); }
      }
      fillRR(ctx, 60, 330, 500, 18, 4, '#56687a');
      I.person(ctx, 310, 300, 120, { shirt: C.blue, helmetColor: '#ffffff' });
      text(ctx, 'that could be you', 310, 520, { size: 24, weight: 800, align: 'center', color: C.amber });
      const items = ['Drilling programme', 'Casing & cement design', 'Mud & hydraulics', 'BHA & trajectory', 'Barriers (WBS) & risk', 'Daily follow-up with the rig'];
      items.forEach((s, j) => {
        const a = S.vis(1, 0.4, 1 + j * 1.3);
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, 630, 40 + j * 102, 540, 84, 14, 'rgba(7,17,28,0.92)', j === 5 ? C.cyan : C.amber, 2);
        I.doc(ctx, 680, 82 + j * 102, 50, { accent: j === 5 ? C.cyan : C.amber });
        text(ctx, s, 720, 90 + j * 102, { size: 24, weight: 700, color: C.text });
        ctx.restore();
      });
      WG.infoBox(ctx, 30, 600, 560, 'TYPICAL GRADUATE TASKS', ['Calculations and checks for the programme', 'Torque & drag, hydraulics, casing loads', 'Daily reports and follow-up'], S.vis(1, 0.5, 9), { rv: (tt - 9) * 0.6, size: 20 });
    }
    if (bi === 2) {
      const hl = (k) => (k === Math.min(2, Math.floor(S.since(2) / 4)) ? 1 : 0);
      orgBox(ctx, 398, 40, 400, 100, 'D&W MANAGER', 'wells, budget, people', C.purple, S.vis(2, 0.5, 0.5), hl(2), t);
      line(ctx, 598, 140, 598, 200, C.faint, 3);
      orgBox(ctx, 348, 200, 500, 100, 'DRILLING SUPERINTENDENT', '“the supe”: leads the rig team', C.amber, S.vis(2, 0.5, 0.5), hl(0), t);
      line(ctx, 598, 300, 598, 350, C.faint, 3); line(ctx, 230, 350, 966, 350, C.faint, 3);
      const kids = [['Drilling engineers', 'onshore', C.cyan], ['Drilling supervisors', 'offshore, day & night', C.orange], ['Completion & intervention', 'engineers', C.cyan]];
      kids.forEach(([n, s2, col], i) => { line(ctx, 230 + i * 368, 350, 230 + i * 368, 390, C.faint, 3); orgBox(ctx, 80 + i * 368, 390, 300, 100, n, s2, col, S.vis(2, 0.5, 2 + i * 0.6), 0, t); });
      WG.infoBox(ctx, 80, 560, 1036, 'GOOD TO KNOW', ['The supe runs the daily morning call with the rig', 'Titles and structure vary between operators', 'Ask early who decides what: it saves a lot of time'], S.vis(2, 0.5, 6), { rv: (S.since(2) - 6) * 0.5 });
    }
    if (bi === 3) {
      const tt = S.since(3);
      // prognosis vs actual tops
      WG.panel(ctx, 30, 30, 560, 880, 'PROGNOSIS vs ACTUAL', C.amber);
      const tops = [['Seabed', 0, 0], ['Nordland Gp', 50, 52], ['Hordaland Gp', 260, 270], ['Rogaland Gp', 520, 533], ['Shetland Gp', 610, 622], ['Top reservoir', 760, 748], ['TD', 860, 860]];
      tops.forEach(([n, prog, act], i) => {
        const y = 100 + prog * 0.88;
        line(ctx, 60, y, 300, y, C.cyan, 2, [8, 6]);
        text(ctx, n, 70, y - 6, { size: 17, weight: 700, color: C.cyan });
        const a = S.vis(3, 0.3, 1 + i * 0.7);
        const ya = 100 + act * 0.88;
        line(ctx, 320, ya, 560, ya, rgba(C.amber, a), 3);
        if (a > 0 && i > 0 && i < 6) text(ctx, `${act - prog > 0 ? '+' : ''}${act - prog} m`, 560, ya - 6, { size: 16, weight: 800, align: 'right', color: C.amber, alpha: a });
      });
      text(ctx, 'prognosis', 180, 896, { size: 16, weight: 800, align: 'center', color: C.cyan });
      text(ctx, 'actual', 440, 896, { size: 16, weight: 800, align: 'center', color: C.amber });
      WG.infoBox(ctx, 620, 40, 550, 'OPERATIONS GEOLOGIST', ['Prognosis: formation tops and pressures', 'Sampling, coring and logging programme', 'Core points, casing points, TD decision', 'Link between exploration and D&W'], S.vis(3, 0.5, 1), { rv: tt * 0.4, color: C.green });
      WG.infoBox(ctx, 620, 450, 550, 'PETROPHYSICIST', ['Plans the logging programme', 'Interprets the logs: porosity, saturation, net pay'], S.vis(3, 0.5, 9), { rv: (tt - 9) * 0.6, color: C.cyan });
    }
  },
};

// ------------------------------------------------------------ the rig crew
const ROLES = [
  { k: 'oim', n: 'OIM', x: 448, y: 30, col: C.purple },
  { k: 'dsv', n: 'Drilling supervisor', x: 200, y: 150, col: C.blue },
  { k: 'geo', n: 'Wellsite geologist', x: 200, y: 230, col: C.blue },
  { k: 'tp', n: 'Toolpusher', x: 696, y: 150, col: C.orange },
  { k: 'dr', n: 'Driller · AD', x: 696, y: 230, col: C.orange },
  { k: 'dm', n: 'Derrickman · roughnecks', x: 696, y: 310, col: C.orange },
  { k: 'svc', n: 'Service hands', x: 200, y: 310, col: C.green },
  { k: 'deck', n: 'Crane op · roustabouts', x: 448, y: 390, col: C.amber },
];
function crewChart(ctx, S, active, t) {
  for (const r of ROLES) {
    const on = r.k === active;
    orgBox(ctx, r.x, r.y, 300, 62, r.n, null, r.col, 1, on ? S.hl(S.bi) : 0, t);
  }
  text(ctx, 'OPERATOR', 350, 140, { size: 15, weight: 900, align: 'center', color: C.blue, spacing: 2 });
  text(ctx, 'DRILLING CONTRACTOR', 846, 140, { size: 15, weight: 900, align: 'center', color: C.orange, spacing: 2 });
}
function roleCard(ctx, S, bi, shirt, helmet, name, items, col) {
  ctx.save(); ctx.globalAlpha *= S.vis(bi, 0.5, 0.3);
  fillRR(ctx, 30, 480, 1136, 430, 16, 'rgba(7,17,28,0.92)', col, 2);
  I.person(ctx, 190, 680, 220, { shirt, helmetColor: helmet });
  text(ctx, name, 190, 880, { size: 24, weight: 900, align: 'center', color: col });
  items.forEach((s, j) => {
    const a = S.vis(bi, 0.4, 1 + j * 1.2);
    circle(ctx, 384, 560 + j * 78, 6, rgba(col, a));
    K.para(ctx, s, 404, 568 + j * 78, 740, { size: 25, weight: 600, color: C.text, alpha: a });
  });
  ctx.restore();
}
const crewScene = {
  id: 'rigcrew',
  title: 'Who does what on the rig',
  blurb: 'From the OIM to the roustabouts.',
  beats: [
    {
      term: 'Offshore installation manager', abbr: 'OIM', no: 'plattformsjef',
      def: 'The highest authority on the installation, responsible for the safety of everyone on board and for emergency response. On a mobile drilling rig, the OIM is usually employed by the drilling contractor.',
      ex: 'The OIM has called a stand-down meeting at 13:00.',
      say: 'The OIM, the offshore installation manager, is the highest authority on board, responsible for everyone’s safety, and for leading any emergency. On a mobile drilling rig, the OIM usually works for the drilling contractor.',
    },
    {
      term: 'Drilling supervisor', abbr: 'company man', no: 'boreleder',
      def: 'The operator’s representative on the rig, often called the company man (or company rep). Runs the operator’s programme, makes the operational decisions with the toolpusher and reports to the drilling superintendent onshore. Day and night supervisors share the clock.',
      ex: 'Check with the company man before you change the plan.',
      say: 'The drilling supervisor is the operator’s representative on the rig, still often called the company man. They run the operator’s programme, make the daily decisions together with the toolpusher, and report to the superintendent onshore. There is one on days and one on nights.',
    },
    {
      term: 'Toolpusher', abbr: 'TP',
      def: 'The drilling contractor’s leader for the drilling operation and crew: plans the work on the drill floor, manages people and equipment, and works closely with the company man. The senior toolpusher leads the toolpushers.',
      ex: 'The toolpusher wants a toolbox talk before we start.',
      say: 'The toolpusher is the drilling contractor’s leader for the drilling crew and the equipment. They organise the work on the drill floor, and work closely with the company man. The senior toolpusher is in charge of the toolpushers.',
    },
    {
      term: 'Driller & assistant driller', abbr: 'AD', no: 'borer / assisterende borer',
      def: 'The driller runs the drilling machinery from the driller’s cabin and is the first line of well control: watching the well and shutting it in on a kick. The assistant driller (AD) supports and relieves the driller.',
      ex: 'The driller shut in within a minute of the alarm.',
      say: 'The driller operates the drilling machinery from the driller’s cabin, and is the first line of defence in well control, watching the well, and shutting it in if it kicks. The assistant driller, the AD, supports and relieves the driller.',
    },
    {
      term: 'Derrickman & roughnecks', no: 'tårnmann / boredekksarbeidere',
      def: 'The derrickman works with pipe handling in the derrick and looks after the mud pits and pumps. Roughnecks (drill floor workers) handle pipe and equipment on the drill floor. Most are now assisted by automated pipe handling.',
      ex: 'Roughnecks, clear the red zone.',
      say: 'The derrickman works with pipe handling high up in the derrick, and looks after the mud pits and pumps. The roughnecks are the drill floor workers, handling pipe and tools on the floor. Today much of their work is done by machines they control.',
    },
    {
      term: 'Service hands & deck crew', no: 'servicepersonell / dekksarbeidere',
      def: 'Specialists from the service companies: mud engineer, mudlogger, directional driller (DD), MWD engineer, cementer, wireline engineer. The deck crew of roustabouts and crane operators handles all cargo and lifting.',
      ex: 'Call the DD to the drill floor.',
      say: 'The service hands are specialists from the service companies: the mud engineer, the mudlogger, the directional driller, the MWD engineer, the cementer, and the wireline engineer. The deck crew, roustabouts and crane operators, handle all the cargo and lifting on board.',
    },
    {
      term: 'Wellsite geologist',
      def: 'The operator’s geologist on the rig: checks samples and shows, picks formation tops, calls core points and supports the TD decision, together with the operations geologist onshore.',
      ex: 'The wellsite geologist calls the core point.',
      say: 'The wellsite geologist is the operator’s geologist on the rig. They check the samples and shows, pick the formation tops, call the core points, and support the decision on total depth, together with the operations geologist onshore.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const keys = ['oim', 'dsv', 'tp', 'dr', 'dm', 'svc', 'geo'];
    crewChart(ctx, S, keys[bi], t);
    const cards = [
      [C.purple, '#ffffff', 'OIM', ['Highest authority on board', 'Responsible for everyone’s safety', 'Leads the emergency response', 'Mobile rig: usually from the drilling contractor'], C.purple],
      [C.blue, '#ffffff', 'COMPANY MAN', ['Operator’s representative on the rig', 'Runs the operator’s programme', 'Decides with the toolpusher', 'Reports to the superintendent onshore'], C.blue],
      [C.orange, '#ffffff', 'TOOLPUSHER', ['Contractor’s drilling leader', 'Plans the drill floor work', 'Manages crew and equipment'], C.orange],
      [C.orange, '#ffffff', 'DRILLER', ['Runs the drilling controls', 'Watches the well 24/7', 'Shuts in on a kick', 'AD supports and relieves'], C.orange],
      [C.orange, '#ffffff', 'ROUGHNECK', ['Derrickman: pipe in the derrick, mud pits & pumps', 'Roughnecks: the drill floor', 'Machines do most of the heavy work'], C.orange],
      [C.green, '#ffffff', 'SERVICE HAND', ['Mud engineer · mudlogger', 'Directional driller · MWD engineer', 'Cementer · wireline engineer', 'Deck crew: roustabouts & crane operators'], C.green],
      [C.blue, '#ffffff', 'WELLSITE GEO', ['Samples and shows', 'Formation tops', 'Calls core points', 'Supports the TD decision'], C.blue],
    ];
    const [shirt, helmet, name, items, col] = cards[bi];
    roleCard(ctx, S, bi, shirt, helmet, name, items, col);
  },
};

// ------------------------------------------------------------ planning
const planScene = {
  id: 'planning',
  title: 'Planning the well',
  blurb: 'Most of the work is done before the rig arrives.',
  beats: [
    {
      term: 'Drilling programme', no: 'boreprogram',
      def: 'The approved plan for the well: objectives, prognosis, well design, step-by-step operations, barriers and contingencies. It is the basis for the applications to the authorities and for the work on the rig.',
      ex: 'It’s in the drilling programme, section 7.3.',
      say: 'The drilling programme is the approved plan for the well. It contains the objectives, the prognosis, the well design, the operations step by step, the barriers, and the contingencies. It is the basis for the applications to the authorities, and for the work on the rig.',
    },
    {
      term: 'Offset wells', no: 'referansebrønner',
      def: 'Nearby wells drilled earlier, used to predict formation tops, pressures, hole problems and drilling times. Their data and reports are found on Sodir’s FactPages and in DISKOS.',
      ex: 'Both offset wells had losses at the Balder level.',
      say: 'Offset wells are wells drilled earlier nearby. Their data and experience are used to predict the formation tops, the pressures, the hole problems and the drilling time for the new well. You will find them on Sodir’s FactPages and in DISKOS.',
    },
    {
      term: 'Drill the well on paper', abbr: 'DWOP',
      def: 'A workshop before spud where the operator, rig contractor and service companies walk through the programme step by step, to agree the plan, find risks and improvements, and build one team.',
      ex: 'The DWOP is set for next Tuesday, all service companies invited.',
      say: 'Before the rig arrives, the team holds a DWOP: drill the well on paper. The operator, the rig contractor and the service companies walk through the programme, step by step, to agree the plan, find the risks, and get to know each other.',
    },
    {
      term: 'HAZID & risk register', no: 'risikoregister',
      def: 'Hazards are identified in workshops (HAZID) and logged in a risk register with likelihood, consequence, mitigation and owner. Risk matrices rank them; mitigations aim to bring the risk as low as reasonably practicable (ALARP).',
      ex: 'Add shallow gas to the risk register and assign an owner.',
      say: 'Risks are found in HAZID workshops, short for hazard identification. Each risk goes into the risk register, with its likelihood, its consequence, the mitigation, and an owner. The goal is to bring every risk down to as low as reasonably practicable, which you will hear as ALARP.',
    },
    {
      term: 'Management of change', abbr: 'MOC', no: 'endringsledelse',
      def: 'A formal process for changing the approved plan or a requirement: describe the change, assess the risk, get approval, then communicate it. Deviations from regulations or company requirements need formal approval.',
      ex: 'That’s a change to the programme, raise an MOC.',
      say: 'If the approved plan has to change, you use management of change, or MOC. The change is described, the risk is assessed, it is approved by the right people, and then it is communicated to everyone. Deviations from requirements need formal approval.',
    },
    {
      term: 'Contingency plan', no: 'beredskapsplan / plan B',
      def: 'Pre-planned responses for things that may go wrong: losses, stuck pipe, a kick, higher pressure, bad weather. Includes decision points and contingency equipment, like an extra casing string (contingency liner).',
      ex: 'If we see losses, we go to the contingency plan in section 9.',
      say: 'For everything that could go wrong, the programme has a contingency plan: losses, stuck pipe, a kick, higher pressure than expected, or bad weather. It sets the decision points, and the backup equipment, like a contingency liner, an extra casing string kept ready.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      fillRR(ctx, 60, 30, 560, 880, 10, '#f7f5ef', '#c9c2b0', 2);
      text(ctx, 'DRILLING PROGRAMME', 90, 90, { size: 30, weight: 900, color: '#222' });
      text(ctx, 'Exploration well · rev. 2', 90, 124, { size: 18, weight: 600, color: '#666' });
      const ch = ['1  Objectives & summary', '2  Prognosis: tops & pressures', '3  Well design & casing', '4  Drilling fluids & cementing', '5  Operations step by step', '6  Well barriers (WBS)', '7  Formation evaluation', '8  HSE & risk', '9  Contingencies'];
      ch.forEach((s, i) => { const a = S.vis(0, 0.3, 0.6 + i * 0.5); text(ctx, s, 100, 190 + i * 64, { size: 23, weight: 600, color: '#333', alpha: a }); line(ctx, 100, 206 + i * 64, 580, 206 + i * 64, rgba('#000', 0.08 * a), 1); });
      I.stamp(ctx, 470, 820, 150, 'APPROVED', C.green, -0.2, S.p(0, 0.3, 6.5));
      WG.infoBox(ctx, 660, 120, 510, 'USED FOR', ['Applications to the authorities', 'Contracts and service orders', 'The daily work on the rig'], S.vis(0, 0.5, 7), { rv: (tt - 7) * 0.6 });
    }
    if (bi === 1) {
      const tt = S.since(1);
      WG.panel(ctx, 30, 30, 700, 880, 'OFFSET WELLS', C.amber);
      ctx.save(); rr(ctx, 40, 80, 680, 820, 10); ctx.clip();
      ctx.fillStyle = '#0c3450'; ctx.fillRect(40, 80, 680, 820);
      for (let k = 0; k < 7; k++) { line(ctx, 40, 140 + k * 120, 720, 140 + k * 120, rgba('#fff', 0.05), 1); line(ctx, 100 + k * 100, 80, 100 + k * 100, 900, rgba('#fff', 0.05), 1); }
      ctx.restore();
      const wells = [[200, 260, 'losses at 1,850 m'], [560, 330, 'kick in the reservoir'], [260, 690, 'tight hole in clay'], [600, 720, '45 days, on plan']];
      const nx = 400, ny = 480;
      wells.forEach(([x, y, note], i) => {
        const a = S.vis(1, 0.4, 1 + i * 1.6);
        ctx.save(); ctx.globalAlpha *= a;
        line(ctx, nx, ny, x, y, rgba(C.amber, 0.4), 2, [6, 6]);
        circle(ctx, x, y, 10, C.dim, '#fff', 2);
        tag(ctx, note, x, y + 36, { size: 18, color: C.amber, fill: 'rgba(7,17,28,0.92)' });
        ctx.restore();
      });
      I.pin(ctx, nx, ny, 60, C.red);
      text(ctx, 'NEW WELL', nx, ny + 34, { size: 20, weight: 900, align: 'center', color: C.red });
      WG.infoBox(ctx, 760, 40, 410, 'FROM OFFSETS YOU GET', ['Formation tops', 'Pressures (PP/FG)', 'Hole problems', 'Drilling time'], S.vis(1, 0.5, 2), { rv: (tt - 2) * 0.5 });
      WG.infoBox(ctx, 760, 470, 410, 'WHERE', ['Sodir FactPages', 'DISKOS', 'Company reports & EOWRs'], S.vis(1, 0.5, 8), { rv: (tt - 8) * 0.6, color: C.cyan });
    }
    if (bi === 2) {
      const tt = S.since(2);
      // workshop
      fillRR(ctx, 360, 120, 480, 220, 12, '#f4f1ea', '#c9c2b0', 3);
      text(ctx, 'STEP 5.3: run 9⅝ in casing', 600, 170, { size: 22, weight: 800, align: 'center', color: '#222' });
      const notes = [['risk: tight hole', '#ffd6e0'], ['idea: pre-mix spacer', '#c9f2d1'], ['check: hook load', '#fff3a3']];
      notes.forEach(([s, col], i) => { const a = S.vis(2, 0.3, 3 + i * 1.2); ctx.save(); ctx.globalAlpha *= a; fillRR(ctx, 390 + i * 150, 210, 136, 100, 6, col); K.para(ctx, s, 400 + i * 150, 245, 116, { size: 17, weight: 700, color: '#222' }); ctx.restore(); });
      fillRR(ctx, 260, 500, 680, 180, 90, '#6b4f30', '#3a2a18', 3);
      const ppl = [[300, 440, C.blue, 'operator'], [470, 430, C.blue, 'operator'], [640, 430, C.orange, 'rig contractor'], [800, 440, C.orange, 'rig contractor'], [300, 760, C.green, 'mud'], [470, 770, C.green, 'cement'], [640, 770, C.green, 'directional'], [800, 760, C.green, 'logging']];
      ppl.forEach(([x, y, col, n], i) => I.person(ctx, x, y, 90, { shirt: col, label: n, alpha: S.vis(2, 0.3, 0.5 + i * 0.25) }));
      WG.infoBox(ctx, 30, 30, 300, 'DWOP', ['Whole team', 'Step by step', 'Risks & ideas'], S.vis(2, 0.5, 1), { rv: tt * 0.5, size: 20 });
    }
    if (bi === 3) {
      const tt = S.since(3);
      // risk matrix 5x5
      const x0 = 100, y0 = 90, cs = 110;
      for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) {
        const sc = (4 - r) + c;
        const col = sc >= 6 ? C.red : sc >= 4 ? C.amber : C.green;
        fillRR(ctx, x0 + c * cs, y0 + r * cs, cs - 6, cs - 6, 8, rgba(col, 0.35), rgba(col, 0.8), 2);
      }
      text(ctx, 'consequence →', x0 + 2.5 * cs, y0 + 5 * cs + 30, { size: 19, weight: 800, align: 'center', color: C.dim });
      ctx.save(); ctx.translate(x0 - 30, y0 + 2.5 * cs); ctx.rotate(-Math.PI / 2); text(ctx, 'likelihood →', 0, 0, { size: 19, weight: 800, align: 'center', color: C.dim }); ctx.restore();
      const mv = S.p(3, 2, 7);
      const rx = x0 + lerp(3.5, 3.5, mv) * cs, ry = y0 + lerp(0.5, 3.5, mv) * cs;
      circle(ctx, rx, ry, 22, C.text, '#000', 2);
      text(ctx, 'R7', rx, ry + 7, { size: 18, weight: 900, align: 'center', color: '#111' });
      if (mv > 0.5) tag(ctx, 'after mitigation', rx, ry + 52, { size: 18, color: C.green, fill: 'rgba(7,17,28,0.92)' });
      // register table
      WG.panel(ctx, 680, 40, 496, 560, 'RISK REGISTER', C.amber);
      const rows = [['R7', 'Shallow gas', 'pilot hole, survey'], ['R8', 'Losses', 'LCM ready, low ECD'], ['R9', 'Stuck pipe', 'good practices, jar']];
      text(ctx, 'ID    HAZARD          MITIGATION', 700, 110, { size: 15, weight: 900, color: C.dim, spacing: 1 });
      rows.forEach((r, i) => {
        const a = S.vis(3, 0.3, 2 + i * 1);
        const y = 160 + i * 90;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, 700, y - 34, 456, 70, 8, 'rgba(255,255,255,0.04)', C.panelEdge, 1);
        text(ctx, r[0], 716, y + 8, { size: 20, weight: 900, color: C.amber, fam: K.MONO });
        text(ctx, r[1], 780, y + 8, { size: 20, weight: 700, color: C.text });
        text(ctx, r[2], 956, y + 8, { size: 16, weight: 600, color: C.dim });
        ctx.restore();
      });
      WG.infoBox(ctx, 680, 630, 496, 'ALARP', ['As low as reasonably practicable'], S.vis(3, 0.5, 10), { rv: 9, color: C.green, size: 20 });
    }
    if (bi === 4) {
      const tt = S.since(4);
      const st = [['CHANGE', 'describe it', C.cyan], ['RISK', 'assess it', C.amber], ['APPROVE', 'right level', C.green], ['COMMUNICATE', 'everyone affected', C.purple]];
      st.forEach(([n, s, col], i) => {
        const a = S.vis(4, 0.4, 1 + i * 1.8);
        const x = 40 + i * 290;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, 200, 250, 220, 18, rgba(col, 0.14), col, 3);
        text(ctx, String(i + 1), x + 125, 270, { size: 44, weight: 900, align: 'center', color: col });
        text(ctx, n, x + 125, 330, { size: 24, weight: 900, align: 'center', color: C.text, spacing: 1 });
        text(ctx, s, x + 125, 370, { size: 19, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
        if (i < 3) arrow(ctx, x + 254, 310, x + 286, 310, { color: C.dim, lw: 3, head: 10, alpha: a });
      });
      text(ctx, 'MANAGEMENT OF CHANGE', 598, 120, { size: 30, weight: 900, align: 'center', color: C.text, spacing: 3 });
      WG.infoBox(ctx, 40, 500, 1120, 'WHY', ['Unplanned changes are a classic cause of accidents', 'Small change? Still an MOC, just a quick one', 'Deviations from requirements need formal approval'], S.vis(4, 0.5, 8), { rv: (tt - 8) * 0.5 });
    }
    if (bi === 5) {
      const tt = S.since(5);
      const node = (x, y, w, s, col, a) => { if (a <= 0) return; ctx.save(); ctx.globalAlpha *= a; fillRR(ctx, x - w / 2, y - 34, w, 68, 14, rgba(col, 0.16), col, 2); text(ctx, s, x, y + 8, { size: 21, weight: 800, align: 'center', color: C.text }); ctx.restore(); };
      node(598, 90, 360, 'Drilling 12¼ in section', C.cyan, S.vis(5, 0.4, 0.5));
      const br = [[300, 'Losses?', C.amber, ['pump LCM pill', 'cement plug', 'contingency liner']], [898, 'Kick?', C.red, ['shut in', 'kill the well', 'raise mud weight']]];
      br.forEach(([x, q, col, acts], i) => {
        const a = S.vis(5, 0.4, 2 + i * 3);
        line(ctx, 598, 124, x, 200, rgba(col, a), 3);
        node(x, 236, 260, q, col, a);
        acts.forEach((s, j) => { const aa = S.vis(5, 0.4, 2.8 + i * 3 + j * 0.6); line(ctx, x, 270 + j * 110, x, 316 + j * 110, rgba(col, aa * 0.6), 3); node(x, 350 + j * 110, 300, s, col, aa); });
      });
      tag(ctx, 'decision points agreed in advance', 598, 760, { size: 26, color: C.green, fill: 'rgba(7,17,28,0.94)', alpha: S.vis(5, 0.5, 10) });
      I.helmet(ctx, 598, 880, 60, C.yellow);
    }
  },
};

module.exports = {
  id: 'ch18', num: 18, title: 'People & Planning',
  subtitle: 'Who does what, and how a well is planned',
  topics: ['Operator', 'Contractor', 'Service companies', 'Drilling engineer', 'Supe', 'Ops geologist', 'OIM', 'Company man', 'Toolpusher', 'Driller', 'Roughnecks', 'Service hands', 'Wellsite geologist', 'Drilling programme', 'Offset wells', 'DWOP', 'HAZID', 'MOC', 'Contingency'],
  intro: 'Chapter eighteen: people and planning. Who you will work with, onshore and offshore, and how a well is planned before the rig arrives.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0b1a29'; ctx.fillRect(0, 0, 700, 900);
    const cols = [C.blue, C.orange, C.green, C.purple, C.orange, C.blue];
    cols.forEach((c, i) => I.person(ctx, 130 + (i % 3) * 200, 330 + Math.floor(i / 3) * 250 + Math.sin(t * 1.5 + i) * 6, 150, { shirt: c }));
    ctx.restore();
    ctx.strokeStyle = rgba(C.orange, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [teamScene, crewScene, planScene],
};
