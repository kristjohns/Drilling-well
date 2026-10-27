'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const I = require('../art/icons');
const WG = require('../art/widgets');
const M = require('../art/map');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, darken, richLine } = K;

function certCard(ctx, x, y, w, h, title, lines, stamp, a = 1) {
  if (a <= 0) return;
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, x, y, w, h, 16, '#f4f1ea', '#b8860b', 6);
  K.flagNO(ctx, x + 30, y + 30, 44);
  text(ctx, title, x + 90, y + 62, { size: 28, weight: 900, color: '#222' });
  lines.forEach((l, i) => text(ctx, l, x + 34, y + 130 + i * 44, { size: 22, weight: 600, color: '#444' }));
  if (stamp) I.stamp(ctx, x + w - 140, y + h - 70, 120, stamp, C.green, -0.2, 0.9);
  ctx.restore();
}
// ------------------------------------------------------------ getting offshore
const offScene = {
  id: 'offshore',
  title: 'Getting offshore',
  blurb: 'Courses, papers, the helicopter, and life on rotation.',
  beats: [
    {
      term: 'Basic safety course & HUET', abbr: 'GSK | HUET', no: 'grunnleggende sikkerhets- og beredskapskurs',
      def: 'GSK is the basic offshore safety and emergency preparedness training required on the NCS: helicopter underwater escape training (HUET), sea survival, fire fighting and first aid. It must be refreshed every four years.',
      ex: 'Is your GSK still valid for the trip next week?',
      say: 'To work offshore on the NCS you need the basic safety course, called GSK, from Norwegian: grunnleggende sikkerhets og beredskapskurs. It includes HUET, helicopter underwater escape training, where you practise getting out of a capsized helicopter in a pool, plus sea survival, fire fighting and first aid. It is refreshed every four years.',
      tts: 'To work offshore on the NCS you need the basic safety course, called GSK, from the Norwegian words for basic safety and emergency preparedness training. It includes HUET, helicopter underwater escape training, where you practise getting out of a capsized helicopter in a pool, plus sea survival, fire fighting and first aid. It is refreshed every four years.',
    },
    {
      term: 'Offshore health certificate', no: 'helseattest',
      def: 'A medical certificate from an approved doctor, required for everyone working on offshore installations. It is valid for up to two years.',
      ex: 'Bring your helseattest and GSK certificate to check-in.',
      say: 'You also need an offshore health certificate, in Norwegian a helseattest, issued by an approved doctor. It is valid for up to two years.',
      tts: 'You also need an offshore health certificate, in Norwegian a hel-se-a-test, issued by an approved doctor. It is valid for up to two years.',
    },
    {
      term: 'Helicopter transport & survival suit', abbr: 'EBS', no: 'helikopter / overlevelsesdrakt',
      def: 'Crew changes are by helicopter from heliports such as Bergen (Flesland), Stavanger (Sola), Kristiansund, Brønnøysund and Hammerfest. Passengers check in, watch a safety briefing and fly in a survival suit with an emergency breathing system (EBS).',
      ex: 'Check-in at Flesland is 06:30, flight at 07:30.',
      say: 'You fly offshore by helicopter, from heliports like Bergen Flesland, Stavanger Sola, Kristiansund, Brønnøysund and Hammerfest. After check in and a safety briefing, you fly wearing a survival suit, with an emergency breathing system, the EBS.',
    },
    {
      term: 'Rotation & shifts', abbr: '2-4', no: 'turnus / skift',
      def: 'The usual NCS offshore rotation is two weeks on and four weeks off (“2-4”), working 12-hour shifts, days or nights, sometimes with a swing shift. Onshore engineers mostly visit the rig on shorter trips.',
      ex: 'I’m on nights this hitch, then four weeks off.',
      say: 'Offshore crews on the NCS usually work two weeks on and four weeks off, called two four rotation, with twelve hour shifts, on days or nights. As an onshore engineer, you will mostly visit the rig on shorter trips.',
    },
    {
      term: 'Persons on board & bed space', abbr: 'POB',
      def: 'POB is the number of people on the installation. It is limited by lifeboat capacity and beds, so every trip offshore needs an allocated bed. POB is tracked in real time for emergency mustering.',
      ex: 'We’re full on POB, the logging crew has to wait a day.',
      say: 'POB means persons on board. The number is limited by the lifeboat capacity and the beds, so every trip offshore needs a bed allocated, which is called bed space. The POB is tracked all the time, so everyone can be accounted for in an emergency.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      // HUET pool
      ctx.save(); rr(ctx, 30, 30, 640, 560, 16); ctx.clip();
      ctx.fillStyle = '#0b2236'; ctx.fillRect(30, 30, 640, 560);
      const g = ctx.createLinearGradient(0, 220, 0, 590); g.addColorStop(0, '#1f7fb3'); g.addColorStop(1, '#0b3d5c');
      ctx.fillStyle = g; ctx.fillRect(30, 220, 640, 370);
      for (let k = 0; k < 10; k++) line(ctx, 30 + k * 70, 220 + Math.sin(t * 2 + k) * 3, 80 + k * 70, 220 + Math.sin(t * 2 + k + 1) * 3, rgba('#fff', 0.3), 2);
      const rot = Math.PI * ease.inOut(clamp((tt - 1) / 2));
      const sink = 160 * ease.inOut(clamp((tt - 0.5) / 1.5));
      ctx.save(); ctx.translate(350, 180 + sink); ctx.rotate(rot);
      fillRR(ctx, -170, -60, 340, 120, 50, '#e8eef5', '#9aa6b1', 3);
      for (let k = 0; k < 3; k++) fillRR(ctx, -110 + k * 80, -30, 56, 40, 8, '#5fb7e0');
      ctx.restore();
      if (tt > 3.5) {
        const esc = clamp((tt - 3.5) / 2.5);
        I.person(ctx, lerp(430, 560, esc), lerp(420, 240, esc), 70, { shirt: C.orange });
        for (let k = 0; k < 6; k++) circle(ctx, 470 + Math.sin(k * 2 + t) * 20, 400 - ((t * 60 + k * 30) % 160), 4, rgba('#fff', 0.6));
      }
      ctx.restore();
      fillRR(ctx, 30, 30, 640, 560, 16, null, C.panelEdge, 2);
      text(ctx, 'HUET: escape from a capsized helicopter', 350, 570, { size: 21, weight: 800, align: 'center', color: C.text });
      certCard(ctx, 700, 60, 470, 380, 'GSK', ['Basic safety & emergency', 'preparedness training', 'HUET · sea survival · fire · first aid'], 'VALID 4 YRS', S.vis(0, 0.5, 6));
      WG.infoBox(ctx, 30, 630, 1140, 'BEFORE YOUR FIRST TRIP', ['GSK course (refresh every 4 years)', 'Offshore health certificate', 'Company induction & rig-specific safety introduction on arrival'], S.vis(0, 0.5, 9), { rv: (tt - 9) * 0.6 });
    }
    if (bi === 1) {
      certCard(ctx, 250, 140, 700, 440, 'HELSEATTEST', ['Offshore health certificate', 'Issued by an approved doctor', 'Required for work on offshore installations'], 'VALID 2 YRS', S.vis(1, 0.5, 0.5));
      I.cross(ctx, 820, 250, 90, C.red);
      I.calendar(ctx, 600, 760, 150, '2 YEARS');
    }
    if (bi === 2) {
      const tt = S.since(2);
      // map with heliports
      const P = M.makeProj(520, 470, 52);
      ctx.save(); rr(ctx, 30, 30, 700, 880, 16); ctx.clip();
      ctx.fillStyle = '#0c3450'; ctx.fillRect(30, 30, 700, 880);
      M.drawMap(ctx, P, { t });
      const ports = [['Hammerfest', 23.68, 70.66], ['Brønnøysund', 12.21, 65.47], ['Kristiansund', 7.73, 63.11], ['Bergen (Flesland)', 5.22, 60.29], ['Stavanger (Sola)', 5.63, 58.88]];
      ports.forEach(([n, lon, lat], i) => {
        const [x, y] = P(lon, lat);
        const a = S.vis(2, 0.4, 0.8 + i * 0.9);
        circle(ctx, x, y, 9 * a, C.amber, '#fff', 2);
        if (a > 0) tag(ctx, n, x - 14, y, { size: 17, color: C.amber, fill: 'rgba(7,17,28,0.9)', align: 'right', alpha: a });
      });
      ctx.restore();
      fillRR(ctx, 30, 30, 700, 880, 16, null, C.panelEdge, 2);
      text(ctx, 'HELIPORTS', 60, 76, { size: 20, weight: 900, color: C.amber, spacing: 2 });
      // helicopter + suit
      const hx = 760 + ((t * 60) % 520);
      I.helicopter(ctx, Math.min(hx, 1120), 120, 110, t);
      ctx.save(); ctx.globalAlpha *= S.vis(2, 0.5, 6);
      I.suit(ctx, 880, 470, 260);
      text(ctx, 'survival suit', 880, 650, { size: 22, weight: 800, align: 'center', color: C.orange });
      fillRR(ctx, 1010, 400, 120, 160, 14, '#2b3d4f', C.steelMid, 2);
      text(ctx, 'EBS', 1070, 490, { size: 30, weight: 900, align: 'center', color: C.text });
      text(ctx, 'breathing', 1070, 590, { size: 18, weight: 700, align: 'center', color: C.dim });
      ctx.restore();
      WG.infoBox(ctx, 760, 680, 410, 'CHECK-IN', ['ID, certificates, bags weighed', 'Safety briefing video', 'Suit up, then board'], S.vis(2, 0.5, 9), { rv: (tt - 9) * 0.6, size: 20 });
    }
    if (bi === 3) {
      const tt = S.since(3);
      text(ctx, 'A 2-4 ROTATION', 598, 80, { size: 30, weight: 900, align: 'center', color: C.text, spacing: 3 });
      for (let w = 0; w < 6; w++) for (let d = 0; d < 7; d++) {
        const i = w * 7 + d;
        const a = clamp((tt * 8 - i) / 2);
        const on = w < 2;
        const x = 100 + d * 140, y = 130 + w * 80;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, y, 128, 66, 8, on ? rgba(C.orange, 0.35) : rgba(C.green, 0.18), on ? C.orange : C.green, 2);
        text(ctx, String(i + 1), x + 16, y + 26, { size: 15, weight: 800, color: C.dim });
        if (on) { d % 2 ? I.moon(ctx, x + 96, y + 40, 34) : circle(ctx, x + 96, y + 36, 12, C.yellow); }
        ctx.restore();
      }
      tag(ctx, '2 weeks offshore · 12-hour shifts', 400, 640, { size: 24, color: C.orange, fill: 'rgba(7,17,28,0.92)', alpha: S.vis(3, 0.5, 4) });
      tag(ctx, '4 weeks off', 860, 640, { size: 24, color: C.green, fill: 'rgba(7,17,28,0.92)', alpha: S.vis(3, 0.5, 5) });
      WG.infoBox(ctx, 100, 700, 990, 'ONSHORE ENGINEERS', ['Office job, with shorter visits to the rig: ask to go out early in your rotation!'], S.vis(3, 0.5, 8), { rv: 9, color: C.cyan, size: 21 });
    }
    if (bi === 4) {
      const tt = S.since(4);
      R.sky(ctx, 1196, 520); R.sea(ctx, 1196, 520, 940, t, { amp: 4 });
      R.semi(ctx, 420, 520, 1.6, t);
      fillRR(ctx, 760, 80, 400, 230, 18, 'rgba(7,17,28,0.94)', C.amber, 3);
      text(ctx, 'POB', 960, 150, { size: 30, weight: 900, align: 'center', color: C.amber, spacing: 3 });
      const pob = Math.min(118, Math.floor(80 + tt * 6));
      text(ctx, `${pob} / 120`, 960, 250, { size: 64, weight: 800, align: 'center', color: pob >= 118 ? C.red : C.text, fam: K.MONO });
      for (let k = 0; k < 4; k++) I.lifeboat(ctx, 860 + k * 70, 400, 60, 0);
      text(ctx, 'lifeboat capacity + beds = the limit', 960, 470, { size: 20, weight: 700, align: 'center', color: C.dim });
      if (pob >= 118) tag(ctx, 'full: no bed space', 960, 340, { size: 22, color: C.red, fill: 'rgba(7,17,28,0.92)' });
    }
  },
};

// ------------------------------------------------------------ safe work
const workScene = {
  id: 'safework',
  title: 'Safe work every day',
  blurb: 'The tools and words that keep people safe on the rig.',
  beats: [
    {
      term: 'Work permit', abbr: 'AT', no: 'arbeidstillatelse',
      def: 'Written permission needed before hazardous work: hot work (welding, grinding), work at height, entry into tanks, or isolating equipment. It states the job, the hazards, the safety measures and who is responsible, and is signed off by the area authority.',
      ex: 'You can’t start grinding without an AT.',
      say: 'Hazardous work needs a work permit, in Norwegian an arbeidstillatelse, usually just called an AT. Hot work like welding, work at height, entering tanks, or isolating equipment all need one. It lists the job, the hazards, the safety measures, and who is responsible.',
      tts: 'Hazardous work needs a work permit, in Norwegian an arbeids-tillatelse, usually just called an AT. Hot work like welding, work at height, entering tanks, or isolating equipment all need one. It lists the job, the hazards, the safety measures, and who is responsible.',
    },
    {
      term: 'Safe job analysis', abbr: 'SJA', no: 'sikker jobbanalyse',
      def: 'A team risk review before non-routine or high-risk work: the job is broken into steps, and for each step the hazards and the barriers are agreed. Known elsewhere as a JSA (job safety analysis).',
      ex: 'New lifting arrangement, so we need an SJA first.',
      say: 'Before non routine or risky work, the team does an SJA, a safe job analysis. The job is split into steps, and for each step, the team agrees what can go wrong and which barriers are needed. Outside Norway it is called a JSA.',
    },
    {
      term: 'Toolbox talk', no: 'verktøykassemøte',
      def: 'A short meeting at the work site just before a job: the task, the roles, the hazards, and when to stop. Held before every shift handover and every new task.',
      ex: 'Toolbox talk at the drill floor in five minutes.',
      say: 'A toolbox talk is a short meeting at the work site, just before a job starts. Everyone hears the task, the roles, the hazards, and when to stop. It is held before every new task.',
    },
    {
      term: 'Stop work authority', abbr: 'time out', no: 'stoppe arbeidet',
      def: 'Everyone, including a new graduate, has the right and the duty to stop any work they think is unsafe, without blame. Often called a “time out”.',
      ex: 'Time out! Somebody is in the red zone.',
      say: 'Everyone on the rig, including you as a new graduate, has the right and the duty to stop any work they believe is unsafe, with no blame. It is often called a time out. Use it.',
    },
    {
      term: 'Incident reporting', abbr: 'RUH', no: 'rapport om uønsket hendelse',
      def: 'Reporting unwanted incidents, near misses and hazardous conditions so that the whole organisation learns. In Norway called RUH; many companies register them in a system like Synergi. Learning, not blame.',
      ex: 'Write a RUH on that dropped bolt, even though nobody was hurt.',
      say: 'Unwanted incidents, near misses and unsafe conditions are always reported, so everyone can learn. In Norwegian this is an RUH, a report of an unwanted incident, and many companies register them in a system called Synergi. The aim is learning, not blame.',
    },
    {
      term: 'Red zone & dropped objects', no: 'rød sone / fallende gjenstander',
      def: 'The red zone is the area of the drill floor where machines move pipe: no entry while it is active. Dropped objects are one of the biggest hazards offshore, so everything at height is secured and tools are tied off.',
      ex: 'All tools at height must be tethered.',
      say: 'On the drill floor, the red zone is where the machines move pipe, and no one may enter while they are running. Dropped objects are one of the biggest risks offshore, so everything at height is secured, and every tool is tied off.',
    },
    {
      term: 'Personal protective equipment', abbr: 'PPE', no: 'personlig verneutstyr',
      def: 'Hard hat, coverall, gloves, safety glasses, safety boots and hearing protection as a minimum on deck; extra PPE such as harnesses and gas detectors for specific jobs.',
      ex: 'Glasses on, gloves on, before you step onto the drill floor.',
      say: 'Personal protective equipment, PPE, is the last barrier between you and a hazard: hard hat, coverall, gloves, safety glasses, safety boots and hearing protection, plus extra equipment like a harness for special jobs.',
    },
    {
      term: 'Safety delegate & working environment committee', abbr: 'AMU', no: 'verneombud / arbeidsmiljøutvalg',
      def: 'The verneombud is an elected safety delegate who represents the workers on health, safety and environment and can stop dangerous work. The AMU (working environment committee) brings management and employees together on HSE.',
      ex: 'Bring it up with the verneombud.',
      say: 'Norwegian law gives workers a strong voice in safety. The verneombud is an elected safety delegate, who represents the workers, and can even stop dangerous work. The AMU, the working environment committee, brings management and employees together on HSE.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      fillRR(ctx, 60, 40, 640, 860, 10, '#f7f5ef', '#c9c2b0', 2);
      text(ctx, 'WORK PERMIT (AT)', 90, 100, { size: 32, weight: 900, color: '#222' });
      const f = [['Job', 'Grinding on pipe deck rail'], ['Area', 'Pipe deck, port side'], ['Hazards', 'sparks, gas, noise'], ['Measures', 'gas test, fire watch, screens'], ['Valid', 'today 07:00–19:00']];
      f.forEach(([k, v], i) => { const a = S.vis(0, 0.3, 0.8 + i * 0.7); text(ctx, k, 90, 180 + i * 76, { size: 20, weight: 800, color: '#777', alpha: a }); text(ctx, v, 250, 180 + i * 76, { size: 24, weight: 600, color: '#222', alpha: a }); line(ctx, 90, 200 + i * 76, 670, 200 + i * 76, rgba('#000', 0.1 * a), 1); });
      ['issued', 'accepted', 'area authority'].forEach((n, i) => { const a = S.vis(0, 0.3, 5 + i * 0.6); line(ctx, 90 + i * 200, 720, 250 + i * 200, 720, rgba('#333', a), 2); text(ctx, n, 90 + i * 200, 750, { size: 17, weight: 700, color: '#666', alpha: a }); if (a > 0.5) text(ctx, '✓ signed', 100 + i * 200, 705, { size: 18, weight: 700, color: '#15803d' }); });
      I.flame(ctx, 600, 840, 70, t);
      WG.infoBox(ctx, 740, 60, 430, 'NEEDS A PERMIT', ['Hot work', 'Work at height', 'Entry into tanks', 'Isolation of equipment'], S.vis(0, 0.5, 2), { rv: (tt - 2) * 0.6 });
    }
    if (bi === 1) {
      const tt = S.since(1);
      fillRR(ctx, 30, 30, 1140, 600, 14, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'SJA · lifting a new BOP handling tool', 60, 80, { size: 24, weight: 900, color: C.amber });
      const hdr = ['STEP', 'WHAT CAN GO WRONG', 'BARRIER'];
      hdr.forEach((h, i) => text(ctx, h, [60, 380, 780][i], 130, { size: 16, weight: 900, color: C.dim, spacing: 2 }));
      const rows = [['1 Rig up slings', 'wrong sling rating', 'check certificates'], ['2 Lift', 'load swings into people', 'barriers, tag lines, banksman'], ['3 Land the tool', 'pinched hands', 'hands-off, push sticks']];
      rows.forEach((r, i) => {
        const a = S.vis(1, 0.4, 1.5 + i * 2.2);
        ctx.save(); ctx.globalAlpha *= a;
        line(ctx, 60, 150 + i * 140, 1140, 150 + i * 140, C.line, 1);
        text(ctx, r[0], 60, 210 + i * 140, { size: 24, weight: 700, color: C.text });
        text(ctx, r[1], 380, 210 + i * 140, { size: 24, weight: 600, color: C.red });
        text(ctx, r[2], 780, 210 + i * 140, { size: 24, weight: 600, color: C.green });
        ctx.restore();
      });
      ['Crane op', 'Banksman', 'Roughneck', 'Toolpusher', 'Supervisor'].forEach((n, i) => I.person(ctx, 180 + i * 210, 740, 90, { shirt: [C.orange, C.yellow, C.orange, C.orange, C.blue][i], label: n, alpha: S.vis(1, 0.4, 0.5 + i * 0.2) }));
    }
    if (bi === 2) {
      R.sky(ctx, 1196, 940, { top: '#1a2f45', bot: '#0b1a29' });
      fillRR(ctx, 0, 700, 1196, 240, 0, '#3a4a5a');
      const n = 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + Math.PI / 2;
        I.person(ctx, 598 + Math.cos(a) * 300, 560 + Math.sin(a) * 90, 120, { shirt: i === 0 ? C.blue : C.orange });
      }
      ctx.save(); ctx.globalAlpha *= S.vis(2, 0.5, 1);
      fillRR(ctx, 330, 80, 540, 260, 30, '#ffffff');
      poly(ctx, [[560, 340], [620, 340], [598, 400]]); ctx.fillStyle = '#ffffff'; ctx.fill();
      ['Today: change the saver sub', 'Roles: who does what', 'Hazards: pinch points, dropped objects', 'Stop if anything changes'].forEach((s, i) => text(ctx, s, 370, 140 + i * 52, { size: 23, weight: 700, color: '#222', alpha: S.vis(2, 0.3, 1.5 + i * 1.2) }));
      ctx.restore();
    }
    if (bi === 3) {
      const pul = 1 + 0.04 * Math.sin(t * 4);
      ctx.save(); ctx.translate(598, 400); ctx.scale(pul, pul);
      poly(ctx, Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 + Math.PI / 8; return [Math.cos(a) * 260, Math.sin(a) * 260]; }));
      ctx.fillStyle = '#c0392b'; ctx.fill(); ctx.lineWidth = 14; ctx.strokeStyle = '#fff'; ctx.stroke();
      text(ctx, 'STOP', 0, 50, { size: 150, weight: 900, align: 'center', color: '#fff' });
      ctx.restore();
      tag(ctx, '“Time out!”', 598, 760, { size: 40, color: C.amber, fill: 'rgba(7,17,28,0.94)', alpha: S.vis(3, 0.5, 2) });
      text(ctx, 'anyone · any time · no blame', 598, 860, { size: 30, weight: 800, align: 'center', color: C.text, alpha: S.vis(3, 0.5, 4) });
    }
    if (bi === 4) {
      const tt = S.since(4);
      fillRR(ctx, 60, 40, 620, 860, 10, '#f7f5ef', '#c9c2b0', 2);
      text(ctx, 'RUH · unwanted incident', 90, 100, { size: 30, weight: 900, color: '#222' });
      const f = [['Type', 'near miss'], ['What', 'bolt dropped from monkey board'], ['Where', 'drill floor, red zone'], ['Injury', 'none'], ['Potential', 'serious']];
      f.forEach(([k, v], i) => { const a = S.vis(4, 0.3, 0.8 + i * 0.7); text(ctx, k, 90, 180 + i * 80, { size: 20, weight: 800, color: '#777', alpha: a }); text(ctx, v, 250, 180 + i * 80, { size: 24, weight: 600, color: i === 4 ? '#c0392b' : '#222', alpha: a }); });
      I.stamp(ctx, 500, 700, 140, 'REPORTED', C.blue, -0.15, S.p(4, 0.3, 5));
      const st = [['REPORT', C.blue], ['INVESTIGATE', C.amber], ['LEARN', C.green], ['SHARE', C.purple]];
      st.forEach(([n, col], i) => {
        const a = S.vis(4, 0.4, 6 + i * 1.2);
        const y = 120 + i * 160;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, 760, y, 380, 110, 16, rgba(col, 0.16), col, 3);
        text(ctx, n, 950, y + 68, { size: 30, weight: 900, align: 'center', color: col, spacing: 2 });
        ctx.restore();
        if (i < 3) arrow(ctx, 950, y + 114, 950, y + 154, { color: C.dim, lw: 3, head: 10, alpha: a });
      });
      text(ctx, 'e.g. in Synergi', 950, 790, { size: 22, weight: 700, align: 'center', color: C.dim, alpha: S.vis(4, 0.5, 9) });
    }
    if (bi === 5) {
      const tt = S.since(5);
      // drill floor top view
      fillRR(ctx, 40, 40, 700, 860, 16, '#3a4a5a', '#56687a', 2);
      ctx.save(); ctx.globalAlpha *= 0.5 + 0.2 * K.pulse(t, 1.6);
      fillRR(ctx, 160, 200, 460, 420, 20, rgba(C.red, 0.35), C.red, 4);
      ctx.restore();
      K.hatch(ctx, 160, 200, 460, 420, 26, rgba(C.red, 0.25), 3);
      text(ctx, 'RED ZONE', 390, 430, { size: 48, weight: 900, align: 'center', color: '#fff' });
      circle(ctx, 390, 330, 30, '#1b1b1b', '#9aa6b1', 4);
      fillRR(ctx, 420, 520, 140, 60, 10, C.orange); text(ctx, 'iron roughneck', 490, 600, { size: 16, weight: 700, align: 'center', color: C.text });
      fillRR(ctx, 60, 700, 220, 160, 12, '#2b3d4f', C.steelMid, 2); text(ctx, 'driller’s cabin', 170, 790, { size: 18, weight: 800, align: 'center', color: C.text });
      I.person(ctx, 680, 790, 70, { shirt: C.orange });
      // dropped object from above
      const fall = (tt * 0.45) % 1;
      const by = lerp(40, 640, ease.in(fall));
      fillRR(ctx, 840, by, 24, 40, 4, '#b8c4cf');
      text(ctx, 'falling bolt', 880, by + 26, { size: 18, weight: 800, color: C.red });
      line(ctx, 780, 660, 1160, 660, C.dim, 3);
      if (fall > 0.9) for (let k = 0; k < 6; k++) line(ctx, 852, 660, 852 + Math.cos(k) * 30, 660 - Math.abs(Math.sin(k)) * 26, C.amber, 2);
      WG.infoBox(ctx, 780, 700, 390, 'DROPPED OBJECTS', ['Secure everything at height', 'Tie off your tools'], S.vis(5, 0.5, 4), { rv: (tt - 4) * 0.6, color: C.red, size: 20 });
    }
    if (bi === 6) {
      const tt = S.since(6);
      I.person(ctx, 420, 520, 420, { shirt: C.orange, helmetColor: '#ffffff' });
      const items = [['hard hat', 420, 320, 700, 140], ['safety glasses', 450, 410, 760, 260], ['hearing protection', 390, 410, 120, 260], ['gloves', 290, 640, 110, 600], ['coverall', 480, 560, 760, 480], ['safety boots', 420, 760, 760, 760]];
      items.forEach(([n, x, y, lx, ly], i) => callout(ctx, x, y, lx, ly, n, { color: C.amber, size: 24, t: S.p(6, 0.6, 0.6 + i * 1.1), minX: 20, maxX: 1180 }));
    }
    if (bi === 7) {
      const tt = S.since(7);
      I.person(ctx, 300, 420, 300, { shirt: C.orange, helmetColor: '#ffffff' });
      fillRR(ctx, 220, 420, 160, 50, 8, C.yellow, '#8a6d1a', 2);
      text(ctx, 'VERNEOMBUD', 300, 454, { size: 20, weight: 900, align: 'center', color: '#1a1206' });
      WG.infoBox(ctx, 30, 680, 540, 'VERNEOMBUD', ['Elected safety delegate', 'Speaks for the workers on HSE', 'Can stop dangerous work'], S.vis(7, 0.5, 1), { rv: tt * 0.4, size: 20 });
      ctx.save(); ctx.globalAlpha *= S.vis(7, 0.5, 7);
      fillRR(ctx, 640, 260, 500, 200, 100, '#6b4f30', '#3a2a18', 3);
      [[700, 220, C.blue], [890, 210, C.blue], [1080, 220, C.orange], [700, 560, C.orange], [890, 570, C.orange], [1080, 560, C.blue]].forEach(([x, y, col]) => I.person(ctx, x, y, 90, { shirt: col }));
      ctx.restore();
      WG.infoBox(ctx, 620, 680, 550, 'AMU', ['Working environment committee', 'Management + employees + verneombud'], S.vis(7, 0.5, 8), { rv: (tt - 8) * 0.6, color: C.cyan, size: 20 });
    }
  },
};

// ------------------------------------------------------------ emergencies and major accidents
const emScene = {
  id: 'emergency',
  title: 'Emergencies and major accidents',
  blurb: 'When the alarm goes, you already know what to do.',
  beats: [
    {
      term: 'Alarms & mustering', no: 'alarm og mønstring',
      def: 'On the general alarm, everyone goes to their muster station and is counted, using the POB system. On the abandon alarm, people prepare to leave by lifeboat. Learn your station and the alarm signals in the safety introduction on day one.',
      ex: 'General alarm: muster at lifeboat station 2.',
      say: 'When the general alarm sounds, everyone goes to their muster station and is counted, so the OIM knows that everyone is safe. If the abandon alarm sounds, people prepare to leave by lifeboat. You learn your muster station and the alarm signals in the safety introduction, on your first day.',
    },
    {
      term: 'Emergency response team & drills', no: 'beredskapslag / øvelser',
      def: 'Trained teams handle emergencies on board: fire and rescue, first aid, the MOB (man overboard) boat crew and lifeboat leaders. Emergency drills are held every week, so the response is automatic.',
      ex: 'Weekly drill today at 14:00, it’s a fire scenario.',
      say: 'Every rig has trained emergency teams: fire and rescue, first aid, the man overboard boat crew, and the lifeboat leaders. Emergency drills are held every week, so everyone knows exactly what to do.',
    },
    {
      term: 'Defined hazard & accident situations', abbr: 'DFU', no: 'definerte fare- og ulykkessituasjoner',
      def: 'The scenarios that the emergency preparedness on an installation is designed and drilled for, such as a well control incident, fire or explosion, a gas leak, a person overboard, a helicopter accident, or a ship on collision course.',
      ex: 'Which DFU does today’s drill cover?',
      say: 'On the NCS, emergency preparedness is built around DFUs, defined hazard and accident situations: for example a well control incident, a fire or explosion, a gas leak, a person overboard, a helicopter accident, or a ship on collision course. Each one has a plan, and is drilled.',
    },
    {
      term: 'Major accident & barrier management', no: 'storulykke / barrierestyring',
      def: 'A major accident is an event that can cause many deaths or huge damage, such as a blowout, explosion or capsize. Havtil’s regulations require barrier management: technical, operational and organisational barriers that are known, in place and working.',
      ex: 'That’s a major accident risk, which barriers do we have?',
      say: 'A major accident is an event that can kill many people, or cause huge damage: a blowout, an explosion, or a rig capsizing. Havtil requires barrier management: technical, operational and organisational barriers that are known, in place, and working. When one barrier has a hole, the others must hold.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const tt = S.since(0);
      const fl = K.pulse(t, 0.8) > 0.5;
      circle(ctx, 200, 200, 90, fl ? C.amber : darken(C.amber, 0.6), '#fff', 4);
      text(ctx, 'GENERAL ALARM', 200, 340, { size: 24, weight: 900, align: 'center', color: C.amber, spacing: 2 });
      // people walking to muster station
      fillRR(ctx, 760, 120, 400, 520, 18, 'rgba(7,17,28,0.92)', C.green, 3);
      text(ctx, 'MUSTER STATION 2', 960, 170, { size: 24, weight: 900, align: 'center', color: C.green, spacing: 1 });
      I.lifeboat(ctx, 960, 290, 230, 0);
      const n = 8;
      for (let k = 0; k < n; k++) {
        const ph = clamp(tt / 6 - k * 0.08);
        const x = lerp(100 + (k % 4) * 60, 820 + (k % 4) * 80, ease.inOut(ph)), y = lerp(520 + Math.floor(k / 4) * 120, 450 + Math.floor(k / 4) * 110, ease.inOut(ph));
        I.person(ctx, x, y, 70, { shirt: k % 3 ? C.orange : C.blue });
      }
      const counted = Math.min(n, Math.floor(clamp((tt - 4) / 4) * n));
      tag(ctx, `counted: ${counted} / ${n}`, 960, 690, { size: 26, color: counted === n ? C.green : C.amber, fill: 'rgba(7,17,28,0.94)' });
      WG.infoBox(ctx, 40, 760, 620, 'KNOW FROM DAY ONE', ['Your muster station', 'The alarm signals on this rig'], S.vis(0, 0.5, 9), { rv: (tt - 9) * 0.6, size: 20 });
    }
    if (bi === 1) {
      const teams = [['FIRE & RESCUE', C.red, 'flame'], ['FIRST AID', C.green, 'cross'], ['MOB BOAT', C.orange, 'boat'], ['LIFEBOAT LEADERS', C.amber, 'lifeboat']];
      teams.forEach(([n, col, ic], i) => {
        const a = S.vis(1, 0.4, 0.6 + i * 1.6);
        const x = 40 + (i % 2) * 570, y = 40 + Math.floor(i / 2) * 330;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, y, 540, 300, 18, rgba(col, 0.12), col, 3);
        if (ic === 'flame') I.flame(ctx, x + 120, y + 150, 140, t);
        if (ic === 'cross') { circle(ctx, x + 120, y + 150, 70, '#fff'); I.cross(ctx, x + 120, y + 150, 100, C.red); }
        if (ic === 'boat') I.ship(ctx, x + 120, y + 170, 170, { color: C.orange });
        if (ic === 'lifeboat') I.lifeboat(ctx, x + 120, y + 160, 170, 0);
        text(ctx, n, x + 360, y + 160, { size: 28, weight: 900, align: 'center', color: col, spacing: 1 });
        ctx.restore();
      });
      I.calendar(ctx, 598, 820, 120, 'WEEKLY');
      text(ctx, 'drills every week', 760, 830, { size: 26, weight: 800, color: C.text, alpha: S.vis(1, 0.5, 8) });
    }
    if (bi === 2) {
      const sc = [['Well control incident', C.red], ['Fire or explosion', C.orange], ['Gas leak', C.amber], ['Person overboard', C.cyan], ['Helicopter accident', C.purple], ['Ship on collision course', C.blue]];
      text(ctx, 'DFU · DEFINED HAZARD AND ACCIDENT SITUATIONS', 598, 70, { size: 24, weight: 900, align: 'center', color: C.text, spacing: 1 });
      sc.forEach(([n, col], i) => {
        const a = S.vis(2, 0.4, 1 + i * 1.3);
        const x = 40 + (i % 2) * 570, y = 110 + Math.floor(i / 2) * 260;
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, x, y, 540, 230, 18, 'rgba(7,17,28,0.92)', col, 3);
        I.warn(ctx, x + 90, y + 115, 110, col);
        K.para(ctx, n, x + 170, y + 110, 340, { size: 30, weight: 800, color: C.text });
        text(ctx, 'plan · team · drill', x + 170, y + 190, { size: 20, weight: 700, color: C.dim });
        ctx.restore();
      });
    }
    if (bi === 3) {
      const tt = S.since(3);
      // swiss cheese model
      const slices = [['TECHNICAL', C.cyan, [[0.3, 0.6], [0.7, 0.25]]], ['OPERATIONAL', C.amber, [[0.5, 0.4], [0.25, 0.75]]], ['ORGANISATIONAL', C.green, [[0.6, 0.65], [0.35, 0.3]]]];
      slices.forEach(([n, col, holes], i) => {
        const a = S.vis(3, 0.4, 1 + i * 1.5);
        const x = 300 + i * 230;
        ctx.save(); ctx.globalAlpha *= a;
        ctx.save(); ctx.translate(x, 420); ctx.transform(1, -0.25, 0, 1, 0, 0);
        fillRR(ctx, -60, -260, 120, 520, 20, rgba(col, 0.75), darken(col, 0.4), 3);
        for (const [hx, hy] of holes) { ctx.beginPath(); ctx.ellipse(-60 + hx * 120, -260 + hy * 520, 22, 32, 0, 0, Math.PI * 2); ctx.fillStyle = '#0a1825'; ctx.fill(); }
        ctx.restore();
        text(ctx, n, x, 760 - i * 58, { size: 20, weight: 900, align: 'center', color: col, spacing: 1 });
        ctx.restore();
      });
      const ap = S.p(3, 3, 6, ease.linear);
      const ax = lerp(60, 880, ap);
      I.warn(ctx, 90, 380, 90, C.red);
      text(ctx, 'hazard', 90, 450, { size: 20, weight: 800, align: 'center', color: C.red });
      if (ap > 0) arrow(ctx, 150, 400, Math.min(ax, 560), 400 - (Math.min(ax, 560) - 150) * 0.05, { color: C.red, lw: 6, head: 18 });
      if (ap > 0.55) { tag(ctx, 'STOPPED by a barrier', 760, 200, { size: 24, color: C.green, fill: 'rgba(7,17,28,0.94)' }); }
      I.warn(ctx, 1060, 380, 110, C.red);
      text(ctx, 'major accident', 1060, 470, { size: 22, weight: 800, align: 'center', color: C.red });
      WG.infoBox(ctx, 40, 800, 1120, 'BARRIER MANAGEMENT (HAVTIL)', ['Know your barriers · keep them in place · check they work'], S.vis(3, 0.5, 10), { rv: 9, size: 20 });
    }
  },
};

module.exports = {
  id: 'ch19', num: 19, title: 'Safety & Life Offshore',
  subtitle: 'Getting offshore, working safely and the NCS safety words',
  topics: ['GSK', 'HUET', 'Helseattest', 'Helicopter', 'EBS', '2-4 rotation', 'POB', 'AT', 'SJA', 'Toolbox talk', 'Time out', 'RUH', 'Red zone', 'PPE', 'Verneombud', 'AMU', 'Mustering', 'Drills', 'DFU', 'Major accident'],
  intro: 'Chapter nineteen: safety and life offshore. The courses and papers you need, how to get there, and the safety words you will hear every single day on a Norwegian rig.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    R.sky(ctx, 700, 520); R.sea(ctx, 700, 520, 900, t, { amp: 4 });
    R.semi(ctx, 330, 520, 1.1, t);
    I.helicopter(ctx, 200 + Math.sin(t * 0.5) * 40, 220, 120, t);
    ctx.restore();
    ctx.strokeStyle = rgba(C.green, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [offScene, workScene, emScene],
};
