'use strict';
const K = require('../engine/core');
const F = require('../art/floor');
const R = require('../art/rig');
const I = require('../art/icons');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge } = K;

// camera helper: per-beat presets [cx, cy, zoom]
function camFor(S, presets) {
  const kx = {}, ky = {}, kz = {};
  presets.forEach((p, i) => { kx[i] = p[0]; ky[i] = p[1]; kz[i] = p[2]; });
  return F.makeCam(S.step(kx, 1.2), S.step(ky, 1.2), S.step(kz, 1.2));
}
function floorView(ctx, S, presets, st) {
  const cam = camFor(S, presets);
  ctx.save(); cam.apply(ctx);
  const A = F.drawFloor(ctx, st);
  ctx.restore();
  const P = {};
  for (const k of Object.keys(A)) P[k] = cam.pt(A[k]);
  return P;
}

// ------------------------------------------------------------ hoisting
const hoistScene = {
  id: 'hoist',
  title: 'The hoisting system',
  blurb: 'How the rig lifts and lowers hundreds of tonnes of pipe.',
  beats: [
    {
      term: 'Derrick', no: 'boretårn',
      def: 'The steel tower over the well that carries the hoisting system. Tall enough (often 50–60 m) to handle stands of pipe. On many modern rigs called a mast or drilling tower.',
      say: 'The derrick is the steel tower over the well. It carries the whole hoisting system, and it is tall enough to pull pipe in stands of about twenty eight metres.',
    },
    {
      term: 'Crown block', no: 'kronblokk',
      def: 'The fixed set of sheaves (pulleys) at the very top of the derrick, over which the drill line runs.',
      say: 'At the top of the derrick sits the crown block: a fixed set of sheaves, or pulleys, that the drill line runs over.',
    },
    {
      term: 'Travelling block & drill line', no: 'løpeblokk / borewire',
      def: 'The travelling block hangs in the drill line and moves up and down. With 10–14 lines strung between crown and block, the drawworks pull is multiplied many times. The drill line is a thick steel wire rope.',
      ex: 'Watch the block, I’m picking up off bottom.',
      say: 'The travelling block hangs below it in the drill line, a thick steel wire rope. The line is strung back and forth many times between crown and block, like a giant block and tackle, multiplying the pull.',
    },
    {
      term: 'Drawworks', no: 'heiseverk',
      def: 'The rig’s main winch: a powerful drum that reels the drill line in or out to raise and lower the travelling block. Modern drawworks are AC-driven, often with active heave compensation.',
      say: 'The drawworks is the main winch: a huge drum that reels the fast line in and out to raise and lower the block. The other end, the dead line, is clamped to the deadline anchor.',
    },
    {
      term: 'Hook load & weight indicator', no: 'kroklast',
      def: 'Hook load is the total weight hanging below the travelling block: the buoyed string weight plus or minus drag. It is measured by a load cell (often on the deadline anchor) and watched constantly by the driller.',
      ex: 'Hook load 185 tonnes, that’s 15 over normal, we have overpull.',
      say: 'Hook load is the total weight hanging under the block: the drill string in the mud, plus or minus friction. It is measured by a load cell, often on the deadline anchor, and the driller watches it constantly.',
    },
    {
      term: 'Slip and cut', no: 'slippe og kutte borewire',
      def: 'Routine drill line maintenance: fresh line is slipped through from the storage reel to move the wear points, and the worn length is cut off at the drawworks. Scheduled by the work done, in tonne-kilometres or ton-miles.',
      ex: 'We’ll slip and cut while we’re pulling the BHA to surface.',
      say: 'Slip and cut is routine maintenance. Fresh line is slipped through from the storage reel to move the worn spots, and the worn length is cut off at the drum. It is scheduled by how much work the line has done, in tonne kilometres.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const presets = [[598, 470, 1], [600, 150, 2.3], [610, 300, 1.45], [420, 450, 1.35], [700, 470, 1.15], [520, 420, 1.1]];
    const hlSets = [['derrick'], ['crown'], ['block', 'drillline'], ['drawworks'], ['deadline'], []];
    const block = 0.5 + 0.45 * Math.sin(t * (bi >= 2 && bi <= 4 ? 0.7 : 0.3));
    const P = floorView(ctx, S, presets, { t, block, hl: new Set(hlSets[bi]), hlA: S.hl(bi), spin: 0, stands: 9 });
    if (bi === 0) callout(ctx, P.derrick[0], P.derrick[1], 980, 300, 'DERRICK', { color: C.amber, size: 26, t: S.p(0, 0.6, 1) });
    if (bi === 1) callout(ctx, P.crown[0], P.crown[1], 980, 160, 'CROWN BLOCK', { color: C.amber, size: 26, t: S.p(1, 0.6, 1) });
    if (bi === 2) {
      callout(ctx, P.block[0], P.block[1], 960, 520, 'TRAVELLING BLOCK', { color: C.amber, size: 24, t: S.p(2, 0.6, 1) });
      callout(ctx, P.drillLine[0] + 30, P.drillLine[1], 960, 240, 'DRILL LINE (10–14 lines)', { color: C.cyan, size: 22, t: S.p(2, 0.6, 3) });
    }
    if (bi === 3) {
      callout(ctx, P.drawworks[0], P.drawworks[1], 140, 220, 'DRAWWORKS', { color: C.amber, size: 26, t: S.p(3, 0.6, 0.8), align: 'left' });
      callout(ctx, P.fastline[0], P.fastline[1], 140, 360, 'fast line', { color: C.cyan, size: 22, t: S.p(3, 0.6, 3), align: 'left' });
      callout(ctx, P.deadline[0], P.deadline[1], 1000, 800, 'dead line anchor', { color: C.cyan, size: 22, t: S.p(3, 0.6, 5) });
    }
    if (bi === 4) {
      const hook = 165 + 20 * clamp(S.since(4) / 6) + 3 * Math.sin(t * 3);
      fillRR(ctx, 820, 60, 340, 360, 18, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      gauge(ctx, 990, 230, 120, hook, { min: 0, max: 300, unit: 't', label: 'HOOK LOAD', color: C.amber, decimals: 0 });
      callout(ctx, P.deadline[0], P.deadline[1], 900, 560, 'load cell on deadline anchor', { color: C.cyan, size: 22, t: S.p(4, 0.6, 2.5) });
    }
    if (bi === 5) {
      // slip & cut schematic overlay
      const a = S.p(5, 0.6, 0.3);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 60, 120, 1076, 700, 20, 'rgba(7,17,28,0.94)', C.panelEdge, 2);
      text(ctx, 'SLIP AND CUT', 598, 180, { size: 30, weight: 900, align: 'center', color: C.amber, spacing: 2 });
      // storage reel -> deadline anchor -> crown -> block -> drum
      const reel = [180, 650], dla = [430, 650], crown = [598, 280], drum = [900, 650];
      circle(ctx, reel[0], reel[1], 70, '#3c5368', C.steel, 4);
      text(ctx, 'storage reel', reel[0], reel[1] + 110, { size: 20, weight: 700, align: 'center', color: C.dim });
      fillRR(ctx, dla[0] - 30, dla[1] - 20, 60, 40, 6, '#7d8a96');
      text(ctx, 'deadline anchor', dla[0], dla[1] + 70, { size: 20, weight: 700, align: 'center', color: C.dim });
      fillRR(ctx, crown[0] - 60, crown[1] - 20, 120, 30, 6, '#8fa1b3');
      text(ctx, 'crown → block', crown[0], crown[1] - 36, { size: 20, weight: 700, align: 'center', color: C.dim });
      circle(ctx, drum[0], drum[1], 70, '#3c5368', C.steel, 4);
      text(ctx, 'drawworks drum', drum[0], drum[1] + 110, { size: 20, weight: 700, align: 'center', color: C.dim });
      const path = [[reel[0] + 60, reel[1] - 30], [dla[0], dla[1]], [crown[0] - 50, crown[1]], [crown[0] + 50, crown[1]], [drum[0] - 40, drum[1] - 50]];
      K.partialPolyline(ctx, path, 1, '#cfd8e3', 5);
      const slip = S.p(5, 3, 2.0);
      K.flow(ctx, path, slip * 6, { spacing: 40, speed: 60, color: C.amber, r: 5, shape: 'chevron' });
      // worn section marker moving along and cut at drum
      const cut = S.p(5, 0.6, 5.5);
      if (cut > 0) {
        I.xmark(ctx, drum[0] + 100, drum[1] - 80, 40, C.red);
        tag(ctx, 'worn length cut off', drum[0] + 100, drum[1] - 140, { size: 20, color: C.red });
      }
      tag(ctx, 'scheduled by tonne-km of work', 598, 780, { size: 22, color: C.cyan, alpha: S.p(5, 0.6, 7) });
      ctx.restore();
    }
  },
};

// ------------------------------------------------------------ rotating & floor tools
const rotateScene = {
  id: 'rotate',
  title: 'Rotating the string and handling connections',
  blurb: 'Top drive, slips, elevators and the iron roughneck.',
  beats: [
    {
      term: 'Top drive', abbr: 'TDS', no: 'toppdrevet boremaskin',
      def: 'A powerful motor hanging under the travelling block on guide rails. It rotates the drill string, pumps mud down through it via the rotary hose, and spins connections. Replaced the old kelly drive.',
      ex: 'Top drive torque is spiking, pick up and reduce RPM.',
      say: 'The top drive is a big motor that hangs under the travelling block and rides on guide rails. It rotates the drill string, and mud is pumped down through it from the rotary hose. It replaced the old kelly and rotary table drive.',
    },
    {
      term: 'IBOP & FOSV', abbr: 'IBOP | FOSV', no: 'innvendig BOP / sikkerhetsventil',
      def: 'The IBOP (internal blowout preventer) is a valve in the top drive that can shut off flow up the drill string. The FOSV (full-opening safety valve, or stabbing valve) is kept ready on the floor to stab into the pipe if the well flows while tripping.',
      ex: 'Make sure the FOSV is on the floor, in the open position, with the right crossover.',
      say: 'The IBOP, internal blowout preventer, is a valve in the top drive that can shut off flow up through the string. Its partner is the FOSV, a full opening safety valve kept ready on the floor, to stab into the pipe if the well starts flowing during a trip.',
    },
    {
      term: 'Rotary table & RKB', abbr: 'RKB', no: 'rotasjonsbord',
      def: 'The rotary table sits in the drill floor at well centre; on top-drive rigs it mainly holds the slips. RKB (rotary kelly bushing) is the reference point on the drill floor that all depths are measured from: e.g. 2,450 m MD RKB.',
      say: 'At well centre in the floor is the rotary table. On modern rigs it mostly holds the slips. Its old name gives us RKB, rotary kelly bushing: the point on the drill floor that all depths are measured from.',
    },
    {
      term: 'Slips', no: 'kiler',
      def: 'Tapered, toothed wedges that grip the pipe in the rotary table and hang the entire string, so connections can be made or broken. Usually power slips, operated from the driller’s chair.',
      ex: 'In slips… break out… out of slips.',
      say: 'Slips are tapered, toothed wedges. Set in the rotary table, they grip the pipe and hold the whole string, so the top can be unscrewed. You will hear: in slips, and out of slips, all day long.',
    },
    {
      term: 'Elevator & bails', no: 'elevator / løftebøyler',
      def: 'The elevator is a hinged clamp that latches under a tool joint to lift the pipe. It hangs from the top drive on two bails, also called links, which can tilt to reach the pipe.',
      say: 'To lift pipe, the top drive uses an elevator, a hinged clamp that latches under the tool joint. It hangs on two links, or bails, that can tilt out to fetch the next stand.',
    },
    {
      term: 'Iron roughneck', no: 'jernsjauer',
      def: 'A robotic wrench on the drill floor that spins connections in and torques them up (make-up) or breaks them loose (break-out). It replaced manual tongs and spinning chains, and keeps people out of the red zone.',
      ex: 'Bring in the iron roughneck and torque it up to 60 kNm.',
      say: 'The iron roughneck is a robotic wrench. It rolls in to well centre, spins the connection, and torques it up or breaks it out. It replaced manual tongs and keeps people out of harm’s way.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const presets = [[610, 300, 1.55], [610, 380, 2.2], [600, 600, 2.2], [600, 600, 2.4], [610, 520, 1.8], [700, 560, 1.7]];
    const hlSets = [['td'], ['ibop'], ['rotary'], ['slips'], ['elevator'], ['ironR']];
    let block = 0.45, slips = 0, ironR = 0, ironSpin = false, spin = 0, ibop = false;
    if (bi === 0) { spin = 1; block = 0.45 + 0.05 * Math.sin(t * 0.5); }
    if (bi === 1) { ibop = S.since(1) > 4; }
    if (bi === 2) { spin = 0.6; block = 0.9; }
    if (bi === 3) { block = 0.92; slips = S.p(3, 0.8, 1.2); }
    if (bi === 4) { block = lerp(0.3, 0.8, 0.5 + 0.5 * Math.sin(t * 0.6)); }
    if (bi === 5) { block = 0.92; slips = 1; ironR = S.p(5, 1.5, 0.6); ironSpin = S.since(5) > 2.4; }
    const P = floorView(ctx, S, presets, { t, block, slips, ironR, ironSpin, spin, ibop, hl: new Set(hlSets[bi]), hlA: S.hl(bi), stands: 9 });
    if (bi === 0) {
      callout(ctx, P.td[0], P.td[1], 960, 300, 'TOP DRIVE', { color: C.amber, size: 26, t: S.p(0, 0.6, 0.6) });
      callout(ctx, P.hose[0], P.hose[1], 220, 160, 'rotary hose (mud in)', { color: C.cyan, size: 22, t: S.p(0, 0.6, 4), align: 'left' });
    }
    if (bi === 1) {
      callout(ctx, P.ibop[0], P.ibop[1], 960, 420, 'IBOP', { color: C.amber, size: 26, t: S.p(1, 0.6, 0.6), sub: S.since(1) > 4 ? 'CLOSED' : 'open' });
      const a = S.p(1, 0.6, 6);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 70, 640, 330, 220, 16, 'rgba(7,17,28,0.92)', C.red, 2);
      // FOSV drawing
      fillRR(ctx, 200, 690, 70, 120, 10, '#c0392b');
      fillRR(ctx, 186, 680, 98, 20, 5, '#e05a4a'); fillRR(ctx, 186, 800, 98, 20, 5, '#e05a4a');
      line(ctx, 270, 750, 330, 750, '#cfd8e3', 6);
      text(ctx, 'FOSV', 235, 850, { size: 22, weight: 900, align: 'center', color: C.text });
      ctx.restore();
    }
    if (bi === 2) {
      callout(ctx, P.rotary[0], P.rotary[1], 980, 760, 'ROTARY TABLE', { color: C.amber, size: 24, t: S.p(2, 0.6, 0.6) });
      const a = S.p(2, 0.6, 4.5);
      ctx.save(); ctx.globalAlpha *= a;
      const ry = P.rotary[1] - 8;
      line(ctx, 80, ry, 1120, ry, C.cyan, 3, [14, 8]);
      tag(ctx, 'RKB = depth zero', 240, ry - 40, { size: 26, color: C.cyan, fill: 'rgba(7,17,28,0.9)' });
      ctx.restore();
    }
    if (bi === 3) callout(ctx, P.slips[0], P.slips[1], 960, 420, S.since(3) > 2 ? 'IN SLIPS' : 'SLIPS', { color: C.amber, size: 26, t: S.p(3, 0.6, 0.6) });
    if (bi === 4) {
      callout(ctx, P.elevator[0], P.elevator[1], 960, 700, 'ELEVATOR', { color: C.amber, size: 24, t: S.p(4, 0.6, 0.6) });
      callout(ctx, P.td[0] - 40, P.td[1] + 60, 960, 300, 'BAILS / LINKS', { color: C.cyan, size: 22, t: S.p(4, 0.6, 3) });
    }
    if (bi === 5) {
      callout(ctx, P.ironR[0], P.ironR[1], 980, 240, 'IRON ROUGHNECK', { color: C.amber, size: 24, t: S.p(5, 0.6, 0.6) });
      if (S.since(5) > 3) tag(ctx, S.since(5) > 6 ? 'TORQUE UP · 60 kNm' : 'SPIN IN', 598, 860, { size: 26, color: C.cyan, fill: 'rgba(7,17,28,0.9)' });
    }
  },
};

// ------------------------------------------------------------ pipe handling
const pipeScene = {
  id: 'pipehandling',
  title: 'Pipe handling and the driller’s cabin',
  blurb: 'Moving thousands of metres of pipe safely and fast.',
  beats: [
    {
      term: 'Joint, single & stand', no: 'rørlengde / stand',
      def: 'A joint (or single) is one length of pipe, about 9.5 m (Range 2). A stand is usually three joints screwed together, roughly 28–29 m, racked vertically in the derrick.',
      ex: 'We’re tripping at 20 stands an hour.',
      say: 'A joint, or single, is one length of pipe, about nine and a half metres. Three joints screwed together make a stand, about twenty eight metres, which is how pipe is stored upright in the derrick.',
    },
    {
      term: 'Setback & fingerboard', no: 'oppstillingsareal / fingerbrett',
      def: 'Stands are racked on the setback area of the drill floor, with their tops held between the fingers of the fingerboard. Traditionally the derrickman works up there on the monkey board.',
      say: 'Stands stand on the setback area of the floor, with their tops held in the fingerboard. Traditionally the derrickman works up there, on the monkey board.',
    },
    {
      term: 'Pipe handling machine', no: 'rørhåndteringsmaskin',
      def: 'A robot (pipe racker) that moves stands between the setback and well centre. Modern NCS rigs are largely hands-free, with pipe handling controlled from the driller’s cabin.',
      say: 'Today a pipe handling robot, the racker, moves the stands between the setback and well centre, controlled from the driller’s cabin. Hands free pipe handling keeps people out of the red zone.',
    },
    {
      term: 'Catwalk machine', no: 'catwalk',
      def: 'Brings single joints of pipe, casing and tools from the pipe deck up a ramp to the drill floor (and back down when laying out).',
      ex: 'Lay out the BHA on the catwalk.',
      say: 'The catwalk machine brings single joints of pipe, casing and tools up from the pipe deck to the drill floor, and lays them back down. You will hear, pick up, and lay out.',
    },
    {
      term: 'Mousehole & offline stand building', no: 'musehull',
      def: 'A hole in the drill floor beside well centre where joints are held to build stands offline, while drilling continues. Dual-activity rigs take this further with two well centres.',
      say: 'The mousehole is a hole in the floor next to well centre. Joints are made up into stands there, offline, while drilling goes on. Some rigs have two complete well centres, called dual activity.',
    },
    {
      term: 'Driller’s cabin', no: 'borerbu',
      def: 'The control room on the drill floor (the doghouse). The driller and assistant driller sit in “cyber chairs” with joysticks and screens, running hoisting, rotation, pumps and pipe handling, and watching hook load, torque, pressures and pit volumes.',
      ex: 'Call the driller’s cabin before you go onto the drill floor.',
      say: 'Everything is run from the driller’s cabin, sometimes called the doghouse. The driller and assistant driller sit in so called cyber chairs, with joysticks and screens showing hook load, torque, pressures and pit volumes.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const presets = [[860, 430, 1.05], [870, 330, 1.5], [820, 420, 1.15], [1040, 700, 1.5], [680, 540, 1.8], [150, 550, 2.6]];
    const hlSets = [[], ['setback', 'fingerboard', 'monkey'], ['racker'], ['catwalk'], ['mousehole'], ['cabin']];
    let racker = 0, rackerStand = false, catwalk = -1, mousehole = false, stands = 9;
    if (bi === 2) { const ph = (S.since(2) * 0.16) % 1; racker = ph < 0.5 ? ease.inOut(ph * 2) : ease.inOut(2 - ph * 2); rackerStand = ph < 0.5; }
    if (bi === 3) catwalk = (S.since(3) * 0.2) % 1;
    if (bi === 4) mousehole = true;
    const P = floorView(ctx, S, presets, { t, block: 0.1, hl: new Set(hlSets[bi]), hlA: S.hl(bi), racker, rackerStand, catwalk, mousehole, stands, slips: 1 });
    if (bi === 0) {
      // joints to stand diagram
      const a = S.p(0, 0.6, 0.3);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 40, 90, 420, 780, 18, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      const m = S.p(0, 1.5, 3.0);
      for (let i = 0; i < 3; i++) {
        const x = lerp(110 + i * 110, 250, m), y0 = lerp(560, 160 + i * 220, m);
        fillRR(ctx, x - 9, y0, 18, 210, 4, '#9fb0c1');
        fillRR(ctx, x - 12, y0, 24, 16, 3, '#cfd8e3');
        if (m < 0.2) text(ctx, 'joint', x, y0 + 250, { size: 18, weight: 700, align: 'center', color: C.dim });
      }
      if (m > 0.9) {
        K.dimLine(ctx, 320, 160, 320, 820, '≈ 28.5 m', { color: C.amber, size: 22 });
        K.dimLine(ctx, 190, 160, 190, 370, '9.5 m', { color: C.cyan, size: 20, side: 'left' });
        text(ctx, 'STAND = 3 joints', 250, 860, { size: 24, weight: 900, align: 'center', color: C.amber });
      } else text(ctx, '3 singles…', 250, 860, { size: 24, weight: 800, align: 'center', color: C.text });
      ctx.restore();
      callout(ctx, P.setback[0], P.setback[1] - 200, 1000, 120, 'racked stands', { color: C.amber, size: 22, t: S.p(0, 0.6, 6) });
    }
    if (bi === 1) {
      callout(ctx, P.fingerboard[0], P.fingerboard[1], 1000, 120, 'FINGERBOARD', { color: C.amber, size: 24, t: S.p(1, 0.6, 1.5) });
      callout(ctx, P.setback[0], P.setback[1], 1000, 860, 'SETBACK', { color: C.amber, size: 24, t: S.p(1, 0.6, 0.6) });
      callout(ctx, P.monkey[0], P.monkey[1], 220, 160, 'monkey board · derrickman', { color: C.cyan, size: 22, t: S.p(1, 0.6, 4), align: 'left' });
    }
    if (bi === 2) callout(ctx, P.racker[0], P.racker[1], 1000, 140, 'PIPE RACKER', { color: C.amber, size: 24, t: S.p(2, 0.6, 0.6) });
    if (bi === 3) callout(ctx, P.catwalk[0], P.catwalk[1], 760, 860, 'CATWALK MACHINE', { color: C.amber, size: 24, t: S.p(3, 0.6, 0.6), align: 'right' });
    if (bi === 4) {
      callout(ctx, P.mousehole[0], P.mousehole[1], 980, 820, 'MOUSEHOLE', { color: C.amber, size: 24, t: S.p(4, 0.6, 0.6) });
      tag(ctx, 'offline stand building', 900, 160, { size: 24, color: C.cyan, alpha: S.p(4, 0.6, 3), fill: 'rgba(7,17,28,0.9)' });
    }
    if (bi === 5) {
      const a = S.p(5, 0.6, 1.5);
      ctx.save(); ctx.globalAlpha *= a;
      fillRR(ctx, 660, 120, 500, 380, 18, 'rgba(7,17,28,0.94)', C.panelEdge, 2);
      text(ctx, 'DRILLER’S SCREENS', 910, 165, { size: 22, weight: 900, align: 'center', color: C.amber, spacing: 2 });
      const rows = [['Hook load', '182 t'], ['Torque', '24 kNm'], ['SPP', '210 bar'], ['Flow in', '3,600 lpm'], ['Pit volume', '64.2 m³'], ['ROP', '22 m/h']];
      rows.forEach(([k, v], i) => {
        text(ctx, k, 690, 215 + i * 46, { size: 22, weight: 600, color: C.dim });
        text(ctx, v, 1130, 215 + i * 46, { size: 24, weight: 800, align: 'right', color: C.text, fam: K.MONO });
      });
      ctx.restore();
      callout(ctx, P.cabin[0], P.cabin[1], 660, 600, 'DRILLER’S CABIN', { color: C.amber, size: 24, t: S.p(5, 0.6, 0.6) });
    }
  },
};

module.exports = {
  id: 'ch04', num: 4, title: 'The Drill Floor',
  subtitle: 'Derrick, hoisting, top drive and pipe handling',
  topics: ['Derrick', 'Crown block', 'Travelling block', 'Drawworks', 'Hook load', 'Slip & cut', 'Top drive', 'IBOP', 'RKB', 'Slips', 'Elevator', 'Iron roughneck', 'Stand', 'Fingerboard', 'Racker', 'Catwalk', 'Mousehole', 'Driller’s cabin'],
  intro: 'Chapter four: the drill floor. This is where the action is: the hoisting system, the top drive, and the machines that handle the pipe.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.translate(330, 420); ctx.scale(0.62, 0.62); ctx.translate(-600, -420);
    F.drawFloor(ctx, { t, block: 0.5 + 0.4 * Math.sin(t * 0.6), spin: 1, stands: 9 });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [hoistScene, rotateScene, pipeScene],
};
