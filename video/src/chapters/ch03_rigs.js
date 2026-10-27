'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const I = require('../art/icons');
const SS = require('../art/subsea');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, dimLine } = K;

function bg(ctx, t, seaY, seabedY, opt = {}) {
  R.sky(ctx, 1196, seaY, { top: '#0a1825', bot: '#173c5c' });
  R.sea(ctx, 1196, seaY, seabedY, t, { amp: opt.amp || 5 });
  if (seabedY < 940) R.seabed(ctx, 1196, seabedY, 940 - seabedY);
}
function depthBar(ctx, x, y1, y2, label, a = 1) {
  if (a <= 0) return;
  dimLine(ctx, x, y1, x, y2, label, { color: C.cyan, alpha: a, size: 22, side: 'left' });
}

// ------------------------------------------------------------ rig types
function drawType(ctx, k, t, S, local) {
  switch (k) {
    case 0: {
      bg(ctx, t, 420, 780);
      R.jackup(ctx, 220, 420, 780, 0.55, t, { hullY: 420 - 75 });
      R.semi(ctx, 610, 420, 0.62, t, { heave: Math.sin(t) * 2 });
      R.mooringLine(ctx, 610 - 93, 420 + 37, 380, 780, { color: '#8fa1b3' });
      R.mooringLine(ctx, 610 + 93, 420 + 37, 840, 780, { color: '#8fa1b3' });
      R.drillship(ctx, 1000, 420, 0.42, t);
      [['JACK-UP', 220], ['SEMI-SUB', 610], ['DRILLSHIP', 1000]].forEach(([n, x], i) => {
        const v = clamp((local - 1 - i * 0.8) / 0.6);
        tag(ctx, n, x, 110, { size: 22, color: C.amber, alpha: v });
        if (v > 0) { const dx = Math.sin(t * 2 + i) * 10; arrow(ctx, x - 40 + dx, 150, x + 40 + dx, 150, { color: rgba(C.cyan, v), lw: 3, head: 12 }); }
      });
      text(ctx, 'MODU = Mobile Offshore Drilling Unit', 598, 870, { size: 30, weight: 800, align: 'center', color: C.text, alpha: clamp((local - 3.5) / 0.6) });
      break;
    }
    case 1: {
      const seaY = 470, sb = 820;
      bg(ctx, t, seaY, sb);
      const p1 = clamp(local / 3), p2 = clamp((local - 3) / 3);
      const legBot = lerp(seaY + 60, sb, ease.inOut(p1));
      const hy = lerp(seaY + 10 - 40, seaY - 170, ease.inOut(p2));
      R.jackup(ctx, 560, seaY, legBot, 1.15, t, { hullY: hy });
      depthBar(ctx, 1100, seaY, sb, 'up to ~150 m', clamp((local - 6.5) / 0.6));
      callout(ctx, 560 + 1.15 * 190, hy - 30, 900, 140, 'cantilever + derrick', { color: C.amber, size: 22, t: clamp((local - 6.8) / 0.6) });
      callout(ctx, 560 - 1.15 * 140, (hy + sb) / 2, 230, 600, 'legs on the seabed', { color: C.amber, size: 22, t: clamp((local - 7.5) / 0.6) });
      break;
    }
    case 2: {
      const seaY = 360, sb = 880;
      bg(ctx, t, seaY, sb);
      R.mooringLine(ctx, 600 - 160, seaY + 70, 120, sb, { color: '#8fa1b3', lw: 2.5 });
      R.mooringLine(ctx, 600 + 160, seaY + 70, 1080, sb, { color: '#8fa1b3', lw: 2.5 });
      ctx.fillStyle = '#8796a5'; ctx.fillRect(595, seaY + 60, 10, sb - seaY - 110);
      SS.bopSimple(ctx, 600, sb - 4, 0.45, { riser: false });
      R.semi(ctx, 600, seaY, 1.05, t, { heave: Math.sin(t * 0.8) * 5 });
      depthBar(ctx, 1130, seaY, sb, '~100 – 1,500 m', clamp((local - 2) / 0.6));
      text(ctx, 'floats · moored or DP · workhorse of NCS exploration', 598, 920, { size: 22, weight: 700, align: 'center', color: C.amber, alpha: clamp((local - 3) / 0.6) });
      break;
    }
    case 3: {
      const seaY = 400, sb = 900;
      bg(ctx, t, seaY, sb);
      ctx.fillStyle = '#8796a5'; ctx.fillRect(595, seaY + 30, 10, sb - seaY - 110);
      SS.bopSimple(ctx, 600, sb - 4, 0.45, { riser: false });
      R.drillship(ctx, 600, seaY, 1.25, t, { thrusters: true });
      tag(ctx, 'DP thrusters, no anchors', 600, 560, { size: 22, color: C.cyan, alpha: clamp((local - 2) / 0.6) });
      text(ctx, 'deep water, fast transit · rare on the NCS', 598, 920, { size: 22, weight: 700, align: 'center', color: C.amber, alpha: clamp((local - 3) / 0.6) });
      break;
    }
    case 4: {
      const seaY = 430, sb = 860;
      bg(ctx, t, seaY, sb);
      R.platform(ctx, 600, seaY, sb, 1.2, t);
      for (let i = 0; i < 5; i++) line(ctx, 528 + i * 12, seaY - 60, 528 + i * 12, sb, rgba('#ffffff', 0.35), 2);
      callout(ctx, 528, sb - 40, 60, 760, 'conductors / well slots', { color: C.amber, size: 22, t: clamp((local - 2) / 0.6), align: 'left' });
      text(ctx, 'rig on a fixed installation · mostly development wells', 598, 920, { size: 22, weight: 700, align: 'center', color: C.amber, alpha: clamp((local - 3) / 0.6) });
      break;
    }
  }
}
const typesScene = {
  id: 'types',
  title: 'Rig types',
  blurb: 'Different rigs for different water depths and jobs.',
  beats: [
    {
      term: 'Mobile offshore drilling unit', abbr: 'MODU', no: 'flyttbar innretning',
      def: 'A rig that moves from well to well: jack-ups, semi-submersibles and drillships. Exploration wells on the NCS are drilled from MODUs, usually semi-subs.',
      say: 'Exploration wells are drilled from mobile rigs, called MODUs, mobile offshore drilling units. They move from well to well, and come in three main types.',
    },
    {
      term: 'Jack-up', no: 'oppjekkbar rigg',
      def: 'A rig with legs that are lowered to the seabed, then the hull is jacked up out of the water. Very stable; limited to shallower water (up to ~150 m). Drilling via a cantilever.',
      ex: 'The jack-up is preloading the legs now.',
      say: 'A jack up lowers its legs to the seabed and then jacks the hull up out of the water. It is very stable, but limited to shallower water, up to about one hundred and fifty metres. It drills through a cantilever that slides out over the well.',
    },
    {
      term: 'Semi-submersible', abbr: 'semi', no: 'halvt nedsenkbar rigg',
      def: 'A floating rig on submerged pontoons and columns, held in place by anchors or dynamic positioning. The workhorse for NCS exploration, from 100 m to well over 1,000 m water depth.',
      ex: 'We’re on a sixth-generation semi, moored with eight anchors.',
      say: 'A semi submersible floats on pontoons and columns under the water line, held in place by anchors or thrusters. It is the workhorse for exploration on the shelf. People just call it the semi.',
    },
    {
      term: 'Drillship', no: 'boreskip',
      def: 'A ship-shaped rig with the derrick midships, usually on dynamic positioning. Fast transit, large deck capacity, built for deep water. Uncommon on the NCS.',
      say: 'A drillship is a ship with a derrick in the middle, usually held on station by thrusters. It is built for deep water and is less common on the Norwegian shelf.',
    },
    {
      term: 'Platform rig', no: 'plattformrigg',
      def: 'A drilling package on a fixed installation, drilling through the platform’s conductor slots. Mostly used for development wells, but exploration targets near fields can be drilled from platforms too.',
      say: 'Finally, a platform rig sits on a fixed installation and drills through the platform’s well slots. It is mostly used for development wells.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const k = Math.max(0, S.bi);
    const xf = clamp(S.bt / 0.6);
    if (k > 0 && xf < 1) {
      ctx.save(); ctx.globalAlpha *= 1 - xf; drawType(ctx, k - 1, t, S, S.since(k - 1)); ctx.restore();
      ctx.save(); ctx.globalAlpha *= xf; drawType(ctx, k, t, S, S.since(k)); ctx.restore();
    } else drawType(ctx, k, t, S, S.since(k));
  },
};

// ------------------------------------------------------------ semi anatomy
const semiScene = {
  id: 'semi',
  title: 'Anatomy of a semi-submersible',
  blurb: 'The parts of the rig you will hear about every day.',
  beats: [
    {
      term: 'Pontoons & columns', no: 'pongtonger / søyler',
      def: 'The submerged pontoons give buoyancy; the columns connect them to the deck. A small water-plane area makes the semi move less in waves than a ship.',
      say: 'A semi floats on two big pontoons, deep below the waves, connected to the deck by columns. Because only the columns cut the water line, waves push it around much less than a ship.',
    },
    {
      term: 'Ballast & draft', no: 'ballast / dypgang',
      def: 'Seawater is pumped into tanks in the pontoons and columns to change the draft. Transit draft: floating high on the pontoons. Operating draft: ballasted down, roughly 20–25 m.',
      ex: 'We’re deballasting to transit draft for the rig move.',
      say: 'The semi changes its draft with ballast water. It floats high on its pontoons in transit, then pumps seawater into the tanks to sink to its operating draft. Ballast control is a job of its own on the rig.',
    },
    {
      term: 'Air gap', no: 'luftgap',
      def: 'The clearance between the sea surface and the underside of the deck. It must be big enough that storm waves do not hit the deck.',
      say: 'The air gap is the clearance between the sea surface and the underside of the deck. It must be large enough that storm waves never hit the deck.',
    },
    {
      term: 'Moonpool', no: 'moonpool / månebrønn',
      def: 'The opening through the middle of the hull where the riser, the BOP and other equipment go down to the seabed.',
      say: 'The moonpool is the opening through the middle of the rig. The riser, the BOP and everything else that goes down to the seabed passes through it.',
    },
    {
      term: 'Variable deck load', abbr: 'VDL', no: 'variabel dekkslast',
      def: 'How much weight the rig can carry on deck at a given draft: pipe, casing, mud, bulk and equipment. Planners keep a running tally so the rig stays within limits.',
      ex: 'We can’t take all the casing on board, we’re close to max VDL.',
      say: 'Variable deck load, or VDL, is how much weight the rig can carry: pipe, casing, mud and equipment. It limits how much you can store on board, so loads are planned carefully.',
    },
    {
      term: 'Living quarters & helideck', abbr: 'LQ', no: 'boligkvarter / helidekk',
      def: 'The accommodation block with cabins, galley, offices and the control rooms, usually topped by the helideck where crew-change helicopters land.',
      say: 'The living quarters, or LQ, hold the cabins, the galley, offices and the control rooms. The helideck on top is where the crew change helicopter lands.',
    },
    {
      term: 'Offshore crane', no: 'kran',
      def: 'Pedestal cranes lift cargo between supply vessels and the deck. Every lift is planned; the crane operator works with a signaller (banksman) on deck.',
      ex: 'Crane is busy offloading the boat, the casing lift is next.',
      say: 'Pedestal cranes lift cargo between the supply boats and the deck. The crane operator works with a signaller, sometimes called a banksman, and every lift is planned.',
    },
    {
      term: 'Lifeboats', no: 'livbåter',
      def: 'Enclosed lifeboats, today usually free-fall boats on the NCS, for evacuating everyone on board. Your muster station and lifeboat are on your POB card.',
      say: 'If the rig must be evacuated, everyone musters to the lifeboats. On the Norwegian shelf they are typically enclosed free fall lifeboats that drop from a ramp into the sea.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const seaY = 600;
    // ballast/draft animation
    let rise = 0, ballast = -1;
    if (bi === 1) {
      const p = S.p(1, 4, 1.5);
      rise = lerp(120, 0, p);
      ballast = lerp(0.15, 0.85, p);
    }
    R.sky(ctx, 1196, seaY, { top: '#0a1825', bot: '#173c5c' });
    R.sea(ctx, 1196, seaY, 940, t, { amp: bi === 2 ? 14 : 6 });
    const hlMap = { 0: ['pontoon', 'columns'], 3: ['moonpool'], 5: ['lq', 'helideck'], 6: ['crane'], 7: ['lifeboat'] };
    const hl = hlMap[bi] ? new Set(hlMap[bi]) : null;
    // crane lift
    let craneAng = 0, hookY = null;
    if (bi === 6) {
      const p = S.p(6, 4, 1.5);
      craneAng = lerp(0.35, -0.05, p);
    }
    // supply vessel for crane beat
    if (bi === 6) I.ship(ctx, 1080, seaY + 4, 190, { color: '#d8452f' });
    const A = R.semiParts(ctx, 560, seaY, 2.0, t, { rise, ballast, hl, hlA: S.hl(bi), craneAng, riser: bi === 3, seabedY: 940 });
    // callouts per beat
    if (bi === 0) {
      callout(ctx, A.pontoon[0], A.pontoon[1], 820, 880, 'PONTOON (submerged)', { color: C.amber, size: 22, t: S.p(0, 0.6, 1) });
      callout(ctx, A.column[0], A.column[1], 980, 700, 'COLUMN', { color: C.amber, size: 22, t: S.p(0, 0.6, 2) });
    }
    if (bi === 1) {
      const a = S.p(1, 0.6, 0.5);
      const label = rise > 60 ? 'TRANSIT DRAFT' : 'OPERATING DRAFT';
      tag(ctx, label, 200, 60, { size: 24, color: rise > 60 ? C.cyan : C.amber, alpha: a, fill: 'rgba(7,17,28,0.85)' });
      dimLine(ctx, 1080, seaY, 1080, seaY + 204 - rise, 'draft', { color: C.cyan, alpha: a, size: 22 });
      text(ctx, 'ballast water', A.pontoon[0] + 60, A.pontoon[1] + 70, { size: 20, weight: 700, color: C.water, alpha: a });
    }
    if (bi === 2) {
      const a = S.p(2, 0.6, 0.8);
      dimLine(ctx, A.deckUnder[0], seaY, A.deckUnder[0], A.deckUnder[1], 'AIR GAP', { color: C.amber, alpha: a, size: 24 });
    }
    if (bi === 3) callout(ctx, A.moonpool[0] + 30, A.moonpool[1], 900, 420, 'MOONPOOL', { color: C.amber, size: 24, t: S.p(3, 0.6, 0.8), sub: 'riser & BOP go through here' });
    if (bi === 4) {
      // deck loads stacking
      const items = [[-120, '#7d8a96', 'pipe'], [-60, C.mud, 'mud'], [0, '#9aa6b1', 'casing'], [80, C.cement, 'bulk']];
      items.forEach(([ox, col, n], i) => {
        const p = S.p(4, 0.5, 0.6 + i * 0.6, ease.outBack);
        if (p <= 0) return;
        const x = 560 + 2 * ox + 140, y = seaY - 2 * 92 - 22 * p;
        fillRR(ctx, x - 40, y - 26, 80, 26, 4, col, '#0b1520', 2);
      });
      const g = S.p(4, 2, 0.8);
      fillRR(ctx, 150, 850, 900, 50, 12, '#13283a', C.panelEdge, 2);
      fillRR(ctx, 150, 850, 900 * 0.85 * g, 50, 12, g > 0.8 ? C.amber : C.green);
      text(ctx, `VDL used: ${Math.round(6800 * g).toLocaleString('en')} t / 8,000 t`, 600, 885, { size: 24, weight: 800, align: 'center', color: '#0b1520' });
    }
    if (bi === 5) {
      callout(ctx, A.lq[0], A.lq[1] + 40, 60, 760, 'LIVING QUARTERS', { color: C.amber, size: 22, t: S.p(5, 0.6, 0.6), align: 'left' });
      const hp = S.p(5, 4, 1.5, ease.inOut);
      const hx = lerp(1100, A.helideck[0], hp), hy = lerp(120, A.helideck[1] - 28, hp);
      I.helicopter(ctx, hx, hy, 70, t);
      callout(ctx, A.helideck[0], A.helideck[1], 360, 140, 'HELIDECK', { color: C.amber, size: 22, t: S.p(5, 0.6, 2.0) });
    }
    if (bi === 6) {
      // container on hook
      const p = S.p(6, 4, 1.5);
      const cx2 = A.hook[0], cy2 = A.hook[1];
      const yLoad = lerp(seaY - 30, cy2 + 10, ease.inOut(clamp(p * 2)));
      line(ctx, A.craneTip[0], A.craneTip[1], cx2, yLoad, '#cfd8e3', 2);
      fillRR(ctx, cx2 - 26, yLoad, 52, 30, 3, C.cyan, '#0b1520', 2);
      callout(ctx, A.craneTip[0], A.craneTip[1], 820, 200, 'PEDESTAL CRANE', { color: C.amber, size: 22, t: S.p(6, 0.6, 0.6) });
    }
    if (bi === 7) {
      const p = S.p(7, 2.0, 2.0, ease.in);
      const x = lerp(A.lifeboat[0], A.lifeboat[0] - 120, p), y = lerp(A.lifeboat[1], seaY + 10, p * p);
      I.lifeboat(ctx, x, y, 70, -0.5 + p * 0.5);
      if (p >= 1) { for (let k = 0; k < 6; k++) circle(ctx, x - 50 + k * 20, seaY - 10 - Math.abs(Math.sin(t * 6 + k)) * 18, 5, rgba('#cfefff', 0.8)); }
      callout(ctx, A.lifeboat[0], A.lifeboat[1], 260, 320, 'FREE-FALL LIFEBOAT', { color: C.orange, size: 22, t: S.p(7, 0.6, 0.6) });
    }
  },
};

// ------------------------------------------------------------ station keeping & motion
const stationScene = {
  id: 'station',
  title: 'Station keeping and motion',
  blurb: 'A floating rig must stay above the well, and cope with the waves.',
  beats: [
    {
      term: 'Mooring', no: 'forankring',
      def: 'Holding a floating rig in position with anchors, typically 8 or more anchor lines of chain and wire in a spread pattern. Anchors may be pre-laid before the rig arrives.',
      ex: 'All eight anchors are tensioned, the rig is on location.',
      say: 'Most semis on the shelf are moored: eight or more anchor lines of chain and wire, spread out in a pattern around the rig. Sometimes the anchors are pre laid before the rig arrives.',
    },
    {
      term: 'Anchor handling vessel', abbr: 'AHTS', no: 'ankerhåndteringsfartøy',
      def: 'Anchor Handling Tug Supply vessel: a powerful boat that runs and recovers anchors and tows the rig between locations.',
      say: 'Anchors are run and recovered by anchor handling vessels, or AHTS, powerful tugs that also tow the rig between locations.',
    },
    {
      term: 'Dynamic positioning', abbr: 'DP', no: 'dynamisk posisjonering',
      def: 'Keeping position with computer-controlled thrusters, using satellite and acoustic position references. DP class 2 and 3 have redundancy so one failure cannot cause loss of position. Operated by DPOs.',
      ex: 'We’re on DP with a yellow watch circle of 30 metres.',
      say: 'The alternative is dynamic positioning, or DP. Computer controlled thrusters hold the rig in place, using satellite positioning and acoustic beacons on the seabed. DP operators watch it around the clock. Careful: DP also means drill pipe, so listen to the context.',
    },
    {
      term: 'Heave, roll & pitch', no: 'hiv, rull, stamp',
      def: 'Rig motions in waves: heave is up-and-down, roll is side-to-side rotation, pitch is fore-and-aft rotation. Heave matters most for drilling and landing equipment.',
      say: 'In waves, a floater moves. Heave is the up and down motion, roll is rotation side to side, and pitch is rotation fore and aft. Heave is what drillers care about most.',
    },
    {
      term: 'Heave compensation', abbr: 'AHC | CMC', no: 'hivkompensering',
      def: 'Systems that cancel heave so the drill string and bit stay still relative to the seabed: active heave compensated drawworks, crown-mounted compensators, and riser tensioners for the riser.',
      ex: 'Put the compensator in active before landing the BOP.',
      say: 'Heave compensation cancels that motion, so the drill string and bit stay steady relative to the seabed while the rig moves up and down. It is done with compensated drawworks, or a compensator at the crown, and tensioners hold the riser.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 1) {
      const seaY = 300, sb = 860;
      bg(ctx, t, seaY, sb);
      const ls = [[-1, 140], [1, 1060], [-1, 40], [1, 1160]];
      ls.forEach(([side, ax], i) => {
        const p = S.p(0, 1.5, 0.5 + i * 0.4);
        R.mooringLine(ctx, 600 + side * 135, seaY + 60, ax, sb, { color: '#9fb0c1', lw: 2.5, t: p, sag: 0.25 });
      });
      R.semi(ctx, 600, seaY, 0.9, t, { heave: Math.sin(t * 0.8) * 2 });
      // inset top view
      const ia = S.p(0, 0.6, 3);
      if (bi === 0 && ia > 0) {
        ctx.save(); ctx.globalAlpha *= ia;
        fillRR(ctx, 880, 560, 280, 280, 14, 'rgba(7,17,28,0.9)', C.panelEdge, 2);
        const cx = 1020, cy = 700;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2 + Math.PI / 8;
          line(ctx, cx + Math.cos(a) * 30, cy + Math.sin(a) * 30, cx + Math.cos(a) * 120, cy + Math.sin(a) * 120, '#9fb0c1', 2.5);
          K.circle(ctx, cx + Math.cos(a) * 120, cy + Math.sin(a) * 120, 6, '#5b6b7b');
        }
        fillRR(ctx, cx - 30, cy - 30, 60, 60, 8, '#c5ced6');
        text(ctx, 'TOP VIEW · 8-point mooring', cx, 830, { size: 16, weight: 700, align: 'center', color: C.dim });
        ctx.restore();
      }
      if (bi === 1) {
        const p = S.p(1, 5, 0.5, ease.inOut);
        const vx = lerp(760, 1060, clamp(p * 1.6));
        R.ahts(ctx, vx, seaY + 4, 1.3);
        const ay = lerp(seaY + 10, sb, clamp((p - 0.6) / 0.4));
        line(ctx, vx + 70, seaY + 2, vx + 75, ay, '#cfd8e3', 2);
        ctx.save(); ctx.translate(vx + 75, ay); poly(ctx, [[-12, 2], [12, 2], [5, -10], [-5, -10]]); ctx.fillStyle = '#5b6b7b'; ctx.fill(); ctx.restore();
        callout(ctx, vx, seaY - 30, 900, 140, 'AHTS', { color: C.amber, size: 24, t: S.p(1, 0.6, 0.8), sub: 'runs anchors, tows the rig' });
      }
    } else if (bi === 2) {
      const seaY = 360, sb = 880;
      bg(ctx, t, seaY, sb);
      const dx = Math.sin(t * 0.7) * 6;
      ctx.fillStyle = '#8796a5'; ctx.fillRect(595 + dx * 0.3, seaY + 40, 10, sb - seaY - 120);
      SS.bopSimple(ctx, 600, sb - 4, 0.45, { riser: false });
      R.drillship(ctx, 600 + dx, seaY, 1.1, t, { thrusters: true });
      // satellites
      for (const [x, y] of [[180, 90], [1000, 70]]) {
        ctx.save(); ctx.translate(x, y);
        fillRR(ctx, -12, -8, 24, 16, 3, '#cfd8e3'); ctx.fillStyle = '#3d8bfd'; ctx.fillRect(-44, -5, 28, 10); ctx.fillRect(16, -5, 28, 10);
        ctx.restore();
        line(ctx, x, y + 10, 600 + dx, seaY - 160, rgba(C.cyan, 0.5), 2, [6, 6]);
      }
      SS.transponder(ctx, 330, sb, t); SS.transponder(ctx, 880, sb, t + 0.4);
      const a = S.p(2, 0.6, 1.5);
      ctx.save(); ctx.globalAlpha *= a;
      ctx.setLineDash([8, 6]); circle(ctx, 600, seaY + 80, 70, null, C.green, 3); ctx.setLineDash([]);
      ctx.restore();
      tag(ctx, 'GNSS', 180, 140, { size: 18, color: C.cyan, alpha: a });
      tag(ctx, 'acoustic beacons', 600, 905, { size: 18, color: C.yellow, alpha: a });
      tag(ctx, 'DP = dynamic positioning … or drill pipe!', 598, 720, { size: 28, color: C.amber, alpha: S.p(2, 0.6, 9.5), fill: 'rgba(7,17,28,0.9)' });
    } else if (bi === 3) {
      const seaY = 470, sb = 940;
      bg(ctx, t, seaY, sb, { amp: 16 });
      const heave = Math.sin(t * 1.2) * 26, roll = Math.sin(t * 0.9) * 0.05;
      R.semiParts(ctx, 600, seaY, 1.25, t, { rise: -heave, roll });
      const a = S.p(3, 0.6, 0.8);
      ctx.save(); ctx.globalAlpha *= a;
      arrow(ctx, 1000, 420, 1000, 300, { color: C.amber, lw: 5 }); arrow(ctx, 1000, 420, 1000, 540, { color: C.amber, lw: 5 });
      text(ctx, 'HEAVE', 1030, 430, { size: 26, weight: 900, color: C.amber });
      ctx.restore();
      const b = S.p(3, 0.6, 3.0);
      ctx.save(); ctx.globalAlpha *= b;
      K.curvedArrow(ctx, Array.from({ length: 16 }, (_, i) => [600 + Math.cos(-2.2 + i * 0.09) * 380, 520 + Math.sin(-2.2 + i * 0.09) * 380]), { color: C.cyan, lw: 5 });
      text(ctx, 'ROLL', 330, 160, { size: 26, weight: 900, color: C.cyan });
      ctx.restore();
      text(ctx, 'PITCH = the same rotation, fore and aft', 598, 900, { size: 24, weight: 700, align: 'center', color: C.dim, alpha: S.p(3, 0.6, 5.0) });
    } else {
      // heave compensation schematic
      const heave = Math.sin(t * 1.3) * 45;
      const seaY = 420, sb = 900;
      bg(ctx, t, seaY, sb, { amp: 10 });
      // rig deck & derrick moving
      const dy = -heave;
      ctx.save(); ctx.translate(0, dy);
      fillRR(ctx, 250, seaY - 90, 400, 50, 6, '#c5ced6');
      fillRR(ctx, 300, seaY - 40, 60, 120, 8, '#d9a036'); fillRR(ctx, 540, seaY - 40, 60, 120, 8, '#d9a036');
      R.derrick(ctx, 450, seaY - 90, 300, 110, 30, { color: '#dfe6ec' });
      // compensator cylinder at crown
      fillRR(ctx, 425, seaY - 400, 50, 34, 4, C.cyan);
      ctx.restore();
      // compensated parts stay fixed: rod from cylinder down to block
      const fixedBlockY = seaY - 300;
      line(ctx, 450, seaY - 366 + dy, 450, fixedBlockY, C.cyan, 8);
      fillRR(ctx, 430, fixedBlockY, 40, 40, 6, C.amber);
      line(ctx, 450, fixedBlockY + 40, 450, sb - 80, '#cfd8e3', 5);
      fillRR(ctx, 438, sb - 80, 24, 40, 4, C.amber);
      text(ctx, 'bit stays on bottom', 480, sb - 50, { size: 20, weight: 700, color: C.amber });
      // graph
      const gx = 760, gy = 200, gw = 380, gh = 300;
      fillRR(ctx, gx - 20, gy - 60, gw + 40, gh + 120, 14, 'rgba(7,17,28,0.9)', C.panelEdge, 2);
      text(ctx, 'motion vs time', gx, gy - 24, { size: 18, weight: 800, color: C.dim });
      const N = 120;
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const tt = t - (N - i) * 0.05; const y = gy + gh * 0.3 - Math.sin(tt * 1.3) * 45; i ? ctx.lineTo(gx + (i / N) * gw, y) : ctx.moveTo(gx, y); }
      ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.stroke();
      line(ctx, gx, gy + gh * 0.8, gx + gw, gy + gh * 0.8, C.green, 3);
      text(ctx, 'rig heave', gx + 4, gy + gh * 0.3 - 60, { size: 18, weight: 700, color: C.red });
      text(ctx, 'bit (compensated)', gx + 4, gy + gh * 0.8 - 12, { size: 18, weight: 700, color: C.green });
      callout(ctx, 475, seaY - 383 + dy, 640, 120, 'COMPENSATOR', { color: C.cyan, size: 22, t: S.p(4, 0.6, 1) });
    }
  },
};

// ------------------------------------------------------------ marine support & weather
const marineScene = {
  id: 'marine',
  title: 'Boats, rig moves and weather',
  blurb: 'Offshore drilling runs on logistics, and on the weather forecast.',
  beats: [
    {
      term: 'Supply vessel', abbr: 'PSV', no: 'forsyningsfartøy',
      def: 'Platform Supply Vessel: brings deck cargo (pipe, containers, chemicals) and bulk (barite, cement, base oil, brine, fresh water, fuel) from the base. Return cargo is backload.',
      ex: 'The boat is alongside, we’re taking on barite and backloading empty tanks.',
      say: 'Supply vessels, or PSVs, bring everything from the base: deck cargo like pipe and containers, and bulk like barite, cement, base oil, brine, water and fuel, pumped aboard through hoses. What goes back to shore is called backload.',
    },
    {
      term: 'Standby vessel', abbr: 'ERRV', no: 'beredskapsfartøy',
      def: 'Emergency response and rescue vessel that stays near the rig, ready to pick people out of the sea and support emergencies. On parts of the NCS one vessel covers several installations (area preparedness).',
      say: 'A standby vessel stays close to the rig, ready to rescue people from the sea with its fast rescue craft. In some areas one vessel covers several installations. This is called area preparedness.',
    },
    {
      term: 'Rig move', no: 'riggflytting',
      def: 'Moving the rig to the next well: pull anchors, tow or transit, arrive on location, run anchors, ballast down. Exploration rigs move often, and each move is planned in detail.',
      ex: 'The rig move is planned for Thursday if the weather holds.',
      say: 'A rig move is the transfer to the next location: anchors are pulled, the rig is towed or sails over, then anchors are run again and the rig ballasts down. In exploration, rig moves happen often.',
    },
    {
      term: 'Significant wave height', abbr: 'Hs', no: 'signifikant bølgehøyde',
      def: 'The average height of the highest third of the waves; the standard way weather is reported offshore. The largest single waves can be nearly twice Hs.',
      say: 'Weather limits are given in significant wave height, Hs: the average of the highest third of the waves. Single waves can be almost twice that high.',
    },
    {
      term: 'Waiting on weather', abbr: 'WOW', no: 'venter på vær',
      def: 'Downtime because the weather exceeds operating limits, for example for crane lifts, running the BOP or landing helicopters. Planners look for a weather window.',
      ex: 'We’re WOW, Hs is five metres, the crane limit is four and a half.',
      say: 'When the weather is beyond the limits for an operation, you are waiting on weather, WOW. Crane lifts, running the BOP and helicopter flights all have limits, so planners hunt for a weather window.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      const seaY = 560;
      bg(ctx, t, seaY, 940);
      const A = R.semiParts(ctx, 420, seaY, 1.35, t, { craneAng: -0.05 + Math.sin(t * 0.5) * 0.08 });
      I.ship(ctx, 960, seaY + 4, 260, { color: '#d8452f' });
      // bulk hose
      const hose = [[880, seaY - 30], [800, seaY - 60], [700, seaY - 120], [640, seaY - 125]];
      K.partialPolyline(ctx, hose, S.p(0, 1, 2), '#2b3d4f', 8);
      if (S.since(0) > 3) K.flow(ctx, hose, t, { spacing: 24, speed: 60, color: C.cement, r: 4 });
      // container lift
      const ph = (S.since(0) * 0.18) % 1;
      const cx2 = A.hook[0], ly = lerp(seaY - 30, A.hook[1] + 10, ease.inOut(Math.min(1, ph * 1.6)));
      fillRR(ctx, cx2 - 22, ly, 44, 26, 3, C.cyan, '#0b1520', 2);
      callout(ctx, 960, seaY - 70, 960, 200, 'DECK CARGO', { color: C.amber, size: 20, t: S.p(0, 0.6, 1.0), sub: 'pipe · containers · chemicals' });
      callout(ctx, 760, seaY - 80, 640, 330, 'BULK', { color: C.cyan, size: 20, t: S.p(0, 0.6, 3.5), sub: 'barite · cement · base oil · brine · water · fuel' });
      tag(ctx, '↩ BACKLOAD to shore', 960, 860, { size: 22, color: C.green, alpha: S.p(0, 0.6, 9) });
    } else if (bi === 1) {
      const seaY = 460;
      bg(ctx, t, seaY, 940);
      R.semi(ctx, 330, seaY, 0.9, t);
      const a = t * 0.25;
      ctx.save(); ctx.globalAlpha *= S.p(1, 0.6);
      I.ship(ctx, 850 + Math.cos(a) * 40, seaY + 4, 200, { color: '#e07a1f' });
      ctx.restore();
      const fp = S.p(1, 3, 2.5);
      if (fp > 0) {
        const fx = lerp(800, 640, fp), fy = seaY + 6;
        fillRR(ctx, fx - 24, fy - 10, 48, 14, 6, C.orange);
        circle(ctx, 600, seaY + 4 + Math.sin(t * 3) * 3, 7, C.orange);
        text(ctx, 'fast rescue craft', fx, fy + 40, { size: 20, weight: 700, align: 'center', color: C.orange });
      }
      callout(ctx, 850, seaY - 60, 900, 200, 'STANDBY VESSEL', { color: C.amber, size: 22, t: S.p(1, 0.6, 0.6) });
    } else if (bi === 2) {
      const seaY = 480;
      bg(ctx, t, seaY, 940);
      const p = S.p(2, 8, 0.8, ease.inOut);
      const rx = lerp(220, 860, p);
      // tow line and AHTS
      R.ahts(ctx, rx + 260, seaY + 4, 1.1);
      line(ctx, rx + 120, seaY - 20, rx + 200, seaY - 4, '#cfd8e3', 2);
      R.semi(ctx, rx, seaY - (p < 0.98 ? 40 : 0), 0.7, t, { heave: Math.sin(t) * 2 });
      const steps = ['Pull anchors', 'Tow / transit', 'On location', 'Run anchors', 'Ballast down'];
      steps.forEach((st, i) => {
        const v = S.vis(2, 0.4, 0.5 + i * 1.6);
        const x = 130 + i * 235;
        fillRR(ctx, x - 100, 110, 200, 56, 12, v > 0 ? rgba(C.amber, 0.12 * v) : '#13283a', rgba(C.amber, 0.3 + 0.7 * v), 2);
        text(ctx, st, x, 145, { size: 20, weight: 800, align: 'center', color: v > 0.5 ? C.text : C.faint });
        if (i < 4) arrow(ctx, x + 104, 138, x + 130, 138, { color: C.dim, lw: 2, head: 10 });
      });
      if (p > 0.98) { circle(ctx, 860, seaY + 80, 10, C.green); text(ctx, 'new well location', 880, seaY + 90, { size: 20, weight: 700, color: C.green }); }
    } else if (bi === 3) {
      // waves and sorted heights
      const seaY = 300;
      ctx.fillStyle = '#0b2a40'; ctx.fillRect(0, 0, 1196, 940);
      const hs = [2.1, 3.8, 1.5, 4.9, 2.8, 3.2, 1.9, 5.6, 2.4, 4.1, 3.0, 2.2];
      ctx.beginPath(); ctx.moveTo(0, seaY);
      for (let x = 0; x <= 1196; x += 4) {
        const k = Math.floor(x / 100) % hs.length;
        const amp = hs[k] * 14;
        ctx.lineTo(x, seaY - Math.sin(((x % 100) / 100) * Math.PI * 2 + t * 2) * amp);
      }
      ctx.strokeStyle = '#8fd3ff'; ctx.lineWidth = 3; ctx.stroke();
      const sorted = [...hs].sort((a, b) => b - a);
      const p = S.p(3, 1, 1);
      sorted.forEach((h, i) => {
        const x = 150 + i * 75, y0 = 820;
        const isTop = i < 4;
        const v = clamp(p * 1.4 - i * 0.03);
        fillRR(ctx, x, y0 - h * 60 * v, 50, h * 60 * v, 6, isTop && S.since(3) > 3 ? C.amber : '#3d6f9a');
        text(ctx, h.toFixed(1), x + 25, y0 + 26, { size: 16, weight: 700, align: 'center', color: C.dim });
      });
      const a = S.p(3, 0.6, 3.2);
      ctx.save(); ctx.globalAlpha *= a;
      const avg = (5.6 + 4.9 + 4.1 + 3.8) / 4;
      line(ctx, 140, 820 - avg * 60, 450, 820 - avg * 60, '#fff', 3, [10, 6]);
      fillRR(ctx, 470, 820 - avg * 60 - 60, 330, 70, 12, 'rgba(7,17,28,0.9)', C.amber, 2);
      text(ctx, `Hs = ${avg.toFixed(1)} m`, 635, 820 - avg * 60 - 14, { size: 34, weight: 900, align: 'center', color: C.amber });
      ctx.restore();
      text(ctx, 'average of the highest third', 150, 900, { size: 22, weight: 600, color: C.dim, alpha: a });
    } else {
      // forecast chart with limit
      const gx = 120, gy = 140, gw = 960, gh = 560;
      fillRR(ctx, gx - 40, gy - 60, gw + 80, gh + 160, 16, 'rgba(7,17,28,0.6)', C.panelEdge, 2);
      text(ctx, 'Hs FORECAST (m)', gx, gy - 20, { size: 20, weight: 800, color: C.dim });
      const hsAt = (d) => 3.2 + 1.8 * Math.sin(d * 0.9) + 0.8 * Math.sin(d * 2.1 + 1);
      const ys = (v) => gy + gh - (v / 7) * gh;
      for (let v = 0; v <= 7; v++) { line(ctx, gx, ys(v), gx + gw, ys(v), rgba('#ffffff', 0.06), 1); text(ctx, String(v), gx - 12, ys(v) + 6, { size: 16, weight: 600, align: 'right', color: C.dim }); }
      const limit = 4.5;
      const p = S.p(4, 2, 0.5);
      // shading
      for (let i = 0; i < gw * p; i += 3) {
        const d = (i / gw) * 7, v = hsAt(d);
        ctx.fillStyle = v > limit ? rgba(C.red, 0.35) : rgba(C.green, 0.12);
        ctx.fillRect(gx + i, ys(v), 3, gy + gh - ys(v));
      }
      ctx.beginPath();
      for (let i = 0; i <= gw * p; i += 3) { const d = (i / gw) * 7; const y = ys(hsAt(d)); i ? ctx.lineTo(gx + i, y) : ctx.moveTo(gx, y); }
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 4; ctx.stroke();
      line(ctx, gx, ys(limit), gx + gw, ys(limit), C.amber, 3, [12, 8]);
      text(ctx, 'crane limit Hs 4.5 m', gx + gw - 10, ys(limit) - 12, { size: 20, weight: 800, align: 'right', color: C.amber });
      for (let d = 0; d < 7; d++) text(ctx, ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][d], gx + (d + 0.5) * (gw / 7), gy + gh + 30, { size: 18, weight: 700, align: 'center', color: C.dim });
      const a = S.p(4, 0.6, 3);
      tag(ctx, 'WOW', gx + gw * 0.2, ys(6.2), { size: 24, color: C.red, alpha: a });
      tag(ctx, 'weather window', gx + gw * 0.62, ys(1.2), { size: 22, color: C.green, alpha: S.p(4, 0.6, 5) });
    }
  },
};

// ------------------------------------------------------------ ROV
const rovScene = {
  id: 'rov',
  title: 'Eyes on the seabed: the ROV',
  blurb: 'Below the rig, the ROV does the looking and the touching.',
  beats: [
    {
      term: 'Remotely operated vehicle', abbr: 'ROV', no: 'fjernstyrt undervannsfartøy',
      def: 'An unmanned underwater vehicle, flown by ROV pilots from a control container on the rig. It watches the wellhead and BOP, guides equipment into place and does subsea tasks.',
      ex: 'Get the ROV down to look at the wellhead before we land the BOP.',
      say: 'The ROV, a remotely operated vehicle, is an unmanned submarine flown by pilots from a control room on the rig. It watches the wellhead and the BOP, guides equipment into place, and does jobs on the seabed.',
    },
    {
      term: 'Work-class ROV & TMS', abbr: 'TMS',
      def: 'A work-class ROV is large and powerful, with manipulator arms and tools. It is lowered in a cage called the tether management system (TMS), from which it flies out on its tether.',
      say: 'Drilling rigs use work class ROVs, with manipulator arms and tools. The ROV is lowered in a cage called the TMS, the tether management system, and flies out from it on a tether.',
    },
    {
      term: 'Seabed survey', no: 'havbunnskartlegging',
      def: 'Inspection of the seabed around the location before spud: boulders, debris, pipelines, and on the NCS also vulnerable habitats like coral reefs and sponges that must be protected.',
      say: 'Before spud, the seabed around the location is surveyed for boulders, debris and pipelines. On the Norwegian shelf, the survey also checks for coral reefs and sponge communities that must be protected.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const g = ctx.createLinearGradient(0, 0, 0, 940);
    g.addColorStop(0, '#0b3d5c'); g.addColorStop(1, '#041a29');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 1196, 940);
    // particles (marine snow)
    for (let i = 0; i < 60; i++) {
      const x = (i * 211) % 1196, y = ((i * 97 + t * 15) % 940);
      circle(ctx, x, y, 1.6, rgba('#cfefff', 0.25));
    }
    const sb = 800;
    R.seabed(ctx, 1196, sb, 140);
    if (bi <= 1) {
      SS.wellhead(ctx, 760, sb, 1.2);
      SS.bopSimple(ctx, 760, sb - 60, 1.3, { riser: true, topY: 0 });
      const tx = 260, ty = 220;
      SS.tms(ctx, tx, ty, 1.4);
      line(ctx, tx, 0, tx, ty - 72, '#e0e6ec', 3);
      // ROV path
      let rx, ry;
      if (bi === 0) { rx = 470 + Math.sin(t * 0.5) * 110; ry = 520 + Math.sin(t * 0.8) * 50; }
      else {
        const p = S.p(1, 3, 1.0, ease.inOut);
        rx = lerp(tx + 40, 590, p); ry = lerp(ty + 30, 620, p);
      }
      ctx.beginPath(); ctx.moveTo(tx + 20, ty + 40);
      ctx.quadraticCurveTo((tx + rx) / 2, ry + 120, rx - 40, ry);
      ctx.strokeStyle = C.yellow; ctx.lineWidth = 3; ctx.stroke();
      SS.rov(ctx, rx, ry, 1.5, t, { dir: 1, arm: bi === 1 ? t * 2 : 0 });
      callout(ctx, rx, ry - 50, 420, 120, 'ROV', { color: C.yellow, size: 24, t: S.p(0, 0.6, 0.6), sub: 'flown from the rig' });
      if (bi === 1) {
        callout(ctx, tx + 60, ty, 520, 300, 'TMS (garage)', { color: C.cyan, size: 22, t: S.p(1, 0.6, 0.6) });
        callout(ctx, rx + 90, ry + 40, 900, 880, 'manipulator arm', { color: C.amber, size: 20, t: S.p(1, 0.6, 3.2), align: 'center' });
      } else {
        callout(ctx, 760, sb - 120, 1000, 300, 'BOP & wellhead', { color: C.red, size: 22, t: S.p(0, 0.6, 3.0) });
      }
    } else {
      // survey pass
      const p = S.p(2, 9, 0.5, ease.linear);
      const rx = lerp(80, 1120, p), ry = 560;
      // sonar cone
      ctx.save(); ctx.globalAlpha *= 0.25;
      poly(ctx, [[rx, ry + 20], [rx - 140, sb], [rx + 140, sb]]); ctx.fillStyle = C.cyan; ctx.fill();
      ctx.restore();
      const objs = [[300, 'boulder', C.amber], [620, 'coral reef (protected)', C.pink], [900, 'debris', C.amber]];
      objs.forEach(([x, n, col], i) => {
        if (i === 0) { ctx.beginPath(); ctx.ellipse(x, sb - 14, 34, 22, 0, 0, Math.PI * 2); ctx.fillStyle = '#7a7d80'; ctx.fill(); }
        if (i === 1) { SS.coral(ctx, x, sb, 1.4); SS.coral(ctx, x + 40, sb, 1.0, '#ffb3c6'); }
        if (i === 2) { ctx.save(); ctx.translate(x, sb - 8); ctx.rotate(0.3); fillRR(ctx, -40, -6, 80, 12, 3, '#5b6b7b'); ctx.restore(); }
        if (rx > x - 60) tag(ctx, n, x, sb - 90, { size: 18, color: col, fill: 'rgba(7,17,28,0.85)' });
      });
      SS.rov(ctx, rx, ry, 1.2, t, { dir: 1 });
      if (p > 0.97) tag(ctx, '✓ location clear to spud', 598, 160, { size: 26, color: C.green, fill: 'rgba(7,17,28,0.85)' });
    }
  },
};

module.exports = {
  id: 'ch03', num: 3, title: 'Rigs & Marine Operations',
  subtitle: 'The floating factory: rig types, station keeping, boats and weather',
  topics: ['MODU', 'Jack-up', 'Semi-sub', 'Drillship', 'Ballast', 'Air gap', 'Moonpool', 'VDL', 'Mooring', 'AHTS', 'DP', 'Heave', 'PSV', 'Hs', 'WOW', 'ROV'],
  intro: 'Chapter three: rigs and marine operations. Before the drill bit turns, the rig has to get to location, stay there, and be supplied, whatever the North Sea weather does.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    R.sky(ctx, 700, 430, { top: '#0c2236', bot: '#24557c' });
    R.sea(ctx, 700, 430, 900, t, { amp: 8 });
    R.mooringLine(ctx, 330 - 120, 430 + 55, 0, 760, { color: '#9fb0c1', lw: 2.5 });
    R.mooringLine(ctx, 330 + 120, 430 + 55, 700, 760, { color: '#9fb0c1', lw: 2.5 });
    R.semi(ctx, 330, 430, 0.85, t, { heave: Math.sin(t) * 4 });
    R.ahts(ctx, 600, 434, 0.9);
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [typesScene, semiScene, stationScene, marineScene, rovScene],
};
