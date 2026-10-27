'use strict';
const K = require('../engine/core');
const ST = require('../art/string');
const I = require('../art/icons');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, gauge, dimLine } = K;

const COMPS = [
  { type: 'dp', h: 200, label: 'Drill pipe' },
  { type: 'hwdp', h: 80, label: 'HWDP' },
  { type: 'jar', h: 46, label: 'Jar' },
  { type: 'hwdp', h: 50, label: 'HWDP' },
  { type: 'xo', h: 14, label: 'Crossover' },
  { type: 'dc', h: 90, label: 'Drill collars' },
  { type: 'stab', h: 36, label: 'Stabiliser' },
  { type: 'dc', h: 50, label: 'Drill collar' },
  { type: 'float', h: 22, label: 'Float sub' },
  { type: 'mwd', h: 56, label: 'MWD' },
  { type: 'lwd', h: 56, label: 'LWD' },
  { type: 'stab', h: 34, label: 'Stabiliser' },
  { type: 'rss', h: 56, label: 'RSS' },
  { type: 'bit', h: 50, label: 'Bit' },
];
const SX = 230, SY = 50;

function wellbg(ctx, t) {
  // formation on both sides and mud-filled hole
  K.lithoFill(ctx, 'rock3', 0, 0, 160, 940, 3);
  K.lithoFill(ctx, 'rock3', 300, 0, 160, 940, 5);
  ctx.fillStyle = '#5e4128'; ctx.fillRect(160, 0, 140, 940);
  ctx.fillStyle = rgba('#000', 0.25); ctx.fillRect(160, 0, 4, 940); ctx.fillRect(296, 0, 4, 940);
  // cuttings rising in annulus
  for (let i = 0; i < 24; i++) {
    const x = 170 + ((i * 37) % 120);
    if (Math.abs(x - SX) < 26) continue;
    const y = 940 - ((t * 40 + i * 47) % 940);
    circle(ctx, x, y, 2.4, rgba('#d8c7a8', 0.7));
  }
}
function stringWithHl(ctx, S, hlIdx, t, spin = 1) {
  wellbg(ctx, t);
  const pos = ST.drawString(ctx, SX, SY, COMPS, { hl: -1, t, spin });
  const hlA = S.hl(S.bi);
  for (const i of hlIdx) {
    const p = pos[i];
    const w = { dp: 30, hwdp: 34, jar: 40, dc: 44, stab: 64, xo: 36, float: 40, mwd: 46, lwd: 46, rss: 54, motor: 54, bit: 70 }[p.type];
    K.highlightRect(ctx, SX - w / 2 - 6, p.y0 - 5, w + 12, p.y1 - p.y0 + 10, t, { alpha: hlA });
  }
  return pos;
}
function panel(ctx, title, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  fillRR(ctx, 470, 40, 700, 860, 18, '#0d1f2f', C.panelEdge, 2);
  if (title) text(ctx, title, 820, 90, { size: 24, weight: 900, align: 'center', color: C.amber, spacing: 2 });
  ctx.restore();
}

// ------------------------------------------------------------ drill pipe and connections
const pipeScene = {
  id: 'pipe',
  title: 'Drill pipe and connections',
  blurb: 'The long, thin part of the string, and how it is screwed together.',
  beats: [
    {
      term: 'Drill string', no: 'borestreng',
      def: 'Everything from the top drive down to the bit: thousands of metres of drill pipe on top, and the heavy, tool-filled bottom hole assembly (BHA) at the bottom. It transmits rotation, weight and mud.',
      say: 'The drill string is everything from the top drive down to the bit. It turns the bit, puts weight on it, and carries the mud down. On top are thousands of metres of drill pipe, and at the bottom, the heavy bottom hole assembly.',
    },
    {
      term: 'Drill pipe', abbr: 'DP', no: 'borerør',
      def: 'Seamless steel pipe in ~9.5 m joints with thick tool joints at each end. Common sizes on NCS rigs: 5" and 5½" (also 5⅞" and 6⅝"). Grade e.g. S-135 (135 ksi minimum yield).',
      ex: 'We’re running 5½-inch drill pipe, S-135.',
      say: 'Drill pipe is seamless steel pipe in joints of about nine and a half metres, typically five or five and a half inch on Norwegian rigs. It is the long, flexible part of the string, and you will hear its grade, like S one thirty five.',
      tts: 'Drill pipe is seamless steel pipe, in joints of about nine and a half metres, typically five, or five and a half inch, on Norwegian rigs. It is the long, flexible part of the string, and you will hear its grade, like S one-thirty-five.',
    },
    {
      term: 'Tool joint: pin & box', no: 'gjengeforbindelse (pin / box)',
      def: 'The thick threaded connection at each end of a joint. The male end is the pin, the female end the box. Threads are coated with pipe dope before make-up.',
      say: 'Each joint ends in a tool joint, a thick threaded connection. The male end is the pin, and the female end is the box. Before make up, the threads are coated with grease called pipe dope.',
    },
    {
      term: 'Make-up & break-out', no: 'skru sammen / skru fra hverandre',
      def: 'Make-up: screwing a connection together to its specified make-up torque. Break-out: unscrewing it. Wrong torque leads to leaks, washouts or damaged threads.',
      ex: 'Make up to 60 kNm, then break out the saver sub.',
      say: 'Make up means screwing a connection together to its specified torque. Break out means unscrewing it. Too little torque and the connection can leak and wash out. Too much, and you damage the threads.',
    },
    {
      term: 'Heavyweight drill pipe', abbr: 'HWDP', no: 'tungvektsborerør',
      def: 'Thick-walled pipe with a central wear pad, run between the stiff drill collars and the flexible drill pipe as a transition. Also adds weight.',
      say: 'Heavyweight drill pipe, HWDP, is thick walled pipe with a wear pad in the middle. It sits between the stiff collars and the flexible drill pipe, as a transition, and adds weight.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const hlSets = [[], [0], [0], [0], [1, 3]];
    const pos = stringWithHl(ctx, S, hlSets[bi], t, bi === 0 ? 1 : 0.3);
    if (bi === 0) {
      const a = S.p(0, 0.8, 0.5) * (1 - S.p(0, 0.6, 3.2));
      ctx.save(); ctx.globalAlpha *= a;
      // brackets
      const b1 = [pos[0].y0, pos[3].y1], b2 = [pos[4].y0, pos[13].y1];
      line(ctx, 330, b1[0], 345, b1[0], C.cyan, 3); line(ctx, 345, b1[0], 345, b1[1], C.cyan, 3); line(ctx, 330, b1[1], 345, b1[1], C.cyan, 3);
      line(ctx, 330, b2[0], 345, b2[0], C.amber, 3); line(ctx, 345, b2[0], 345, b2[1], C.amber, 3); line(ctx, 330, b2[1], 345, b2[1], C.amber, 3);
      text(ctx, 'DRILL PIPE', 360, (b1[0] + b1[1]) / 2 - 6, { size: 24, weight: 900, color: C.cyan });
      text(ctx, 'thousands of metres', 360, (b1[0] + b1[1]) / 2 + 22, { size: 18, weight: 600, color: C.dim });
      text(ctx, 'BHA', 360, (b2[0] + b2[1]) / 2 - 6, { size: 24, weight: 900, color: C.amber });
      text(ctx, 'bottom hole assembly', 360, (b2[0] + b2[1]) / 2 + 22, { size: 18, weight: 600, color: C.dim });
      ctx.restore();
      const b = S.p(0, 0.8, 3.5);
      ctx.save(); ctx.globalAlpha *= b;
      panel(ctx, 'THE STRING DOES THREE JOBS');
      const jobs = [['↻', 'transmits rotation', C.cyan], ['⬇', 'puts weight on the bit', C.amber], ['≋', 'carries mud to the bit', C.mudLight]];
      jobs.forEach(([ic, s, col], i) => {
        const v = S.p(0, 0.5, 4 + i * 1.2);
        circle(ctx, 620, 230 + i * 190, 56 * v, rgba(col, 0.2), col, 3);
        text(ctx, ic, 620, 250 + i * 190, { size: 50, weight: 900, align: 'center', color: col, alpha: v });
        text(ctx, s, 700, 244 + i * 190, { size: 30, weight: 800, color: C.text, alpha: v });
      });
      ctx.restore();
    }
    if (bi === 1) {
      panel(ctx, 'DRILL PIPE JOINT', S.p(1, 0.6));
      const a = S.p(1, 0.8, 0.6);
      ctx.save(); ctx.globalAlpha *= a;
      // horizontal joint
      ST.metal(ctx, 560, 300, 520, 36);
      ST.metal(ctx, 520, 290, 70, 56, '#cfd8e3'); ST.metal(ctx, 1050, 290, 70, 56, '#cfd8e3');
      dimLine(ctx, 520, 400, 1120, 400, '≈ 9.5 m (Range 2)', { color: C.cyan, size: 24 });
      text(ctx, 'box end', 555, 270, { size: 20, weight: 700, align: 'center', color: C.dim });
      text(ctx, 'pin end', 1085, 270, { size: 20, weight: 700, align: 'center', color: C.dim });
      ctx.restore();
      const specs = [['OD', '5" · 5½" · 5⅞"'], ['Grade', 'S-135 (135,000 psi yield)'], ['Weight', '≈ 30–40 kg/m incl. joints']];
      specs.forEach(([k, v], i) => {
        const vv = S.p(1, 0.5, 3 + i * 1);
        fillRR(ctx, 540, 500 + i * 110, 580, 86, 12, rgba(C.cyan, 0.08 * vv), rgba(C.cyan, 0.5 * vv), 2);
        text(ctx, k, 570, 552 + i * 110, { size: 24, weight: 800, color: C.cyan, alpha: vv });
        text(ctx, v, 700, 552 + i * 110, { size: 26, weight: 700, color: C.text, alpha: vv });
      });
    }
    if (bi === 2 || bi === 3) {
      panel(ctx, bi === 2 ? 'TOOL JOINT: PIN & BOX' : 'MAKE-UP & BREAK-OUT');
      const p = bi === 2 ? S.p(2, 3, 1) : (S.since(3) < 6 ? S.p(3, 2.5, 0.5) : 1 - S.p(3, 2.5, 6.5));
      ST.pinBox(ctx, 760, 560, 1.6, p, t);
      if (bi === 2) {
        callout(ctx, 860, 300, 1000, 200, 'BOX (female)', { color: C.amber, size: 22, t: S.p(2, 0.6, 1.5) });
        callout(ctx, 860, 640, 1000, 760, 'PIN (male)', { color: C.cyan, size: 22, t: S.p(2, 0.6, 2.5) });
        tag(ctx, 'threads doped before make-up', 820, 860, { size: 20, color: C.dim, alpha: S.p(2, 0.6, 5) });
      } else {
        const making = S.since(3) < 6;
        const tq = making ? 60 * S.p(3, 2.5, 0.5) : 60 * (1 - S.p(3, 0.8, 6.5));
        gauge(ctx, 1040, 240, 90, tq, { min: 0, max: 80, unit: 'kNm', label: 'TORQUE', color: C.amber });
        tag(ctx, making ? 'MAKE-UP ↻' : 'BREAK-OUT ↺', 640, 860, { size: 26, color: making ? C.green : C.red });
      }
    }
    if (bi === 4) {
      panel(ctx, 'HEAVYWEIGHT DRILL PIPE', S.p(4, 0.6));
      const a = S.p(4, 0.8, 0.5);
      ctx.save(); ctx.globalAlpha *= a;
      const rows = [['drill pipe', 16, 300, C.cyan], ['HWDP', 22, 470, C.amber], ['drill collar', 34, 640, C.steel]];
      rows.forEach(([n, w, y, col]) => {
        ST.metal(ctx, 560, y - w, 520, w * 2, n === 'drill collar' ? '#97a8b8' : '#a9b8c6');
        if (n === 'HWDP') ST.metal(ctx, 790, y - w - 6, 60, w * 2 + 12, '#cfd8e3');
        text(ctx, n, 560, y - w - 20, { size: 22, weight: 800, color: col });
      });
      text(ctx, 'wear pad', 820, 470 + 60, { size: 18, weight: 700, align: 'center', color: C.amber });
      tag(ctx, 'flexible  →  transition  →  stiff', 820, 800, { size: 24, color: C.text });
      ctx.restore();
    }
  },
};

// ------------------------------------------------------------ BHA components
const bhaScene = {
  id: 'bha',
  title: 'The bottom hole assembly (BHA)',
  blurb: 'The heavy, tool-filled bottom of the string.',
  beats: [
    {
      term: 'Bottom hole assembly', abbr: 'BHA', no: 'bunnhullsstreng',
      def: 'The lower part of the string, typically 100–300 m: bit, steering tool, MWD/LWD, stabilisers, collars, jar and HWDP. Designed for each hole section and drawn up in the BHA diagram.',
      ex: 'We’ll trip out to change the BHA for the 8½-inch section.',
      say: 'The bottom hole assembly, or BHA, is the bottom one or two hundred metres of the string: the bit, steering tools, measurement tools, stabilisers, collars and jars. Each hole section gets its own BHA design.',
    },
    {
      term: 'Drill collars', abbr: 'DC', no: 'vektrør',
      def: 'Very thick-walled, heavy pipe just above the bit. They provide the weight on bit and keep the bottom of the string stiff and in compression, while the drill pipe above stays in tension.',
      say: 'Drill collars are very thick walled, heavy pipe just above the bit. They supply the weight on bit, so the drill pipe above can stay in tension.',
    },
    {
      term: 'Stabiliser', no: 'stabilisator',
      def: 'A short sub with blades near full hole size that centralise the BHA. Their positions control whether the BHA builds, drops or holds angle, and they reduce vibration. Near-bit stab, string stab.',
      say: 'Stabilisers have blades almost as wide as the hole. They centre the BHA, help control the direction, and reduce vibration. You will hear near bit stab and string stab.',
    },
    {
      term: 'Drilling jar', no: 'borejar',
      def: 'A tool in the string that stores energy when the driller pulls or slacks off, then releases it in a sharp hammer blow up or down to free stuck pipe.',
      ex: 'We’re stuck, cock the jar and jar up.',
      say: 'The jar is a hammer built into the string. When the pipe is stuck, the driller pulls to store energy in the string, and the jar releases it as a sharp blow, up or down, to shake it free.',
    },
    {
      term: 'Crossover', abbr: 'XO', no: 'overgang',
      def: 'A short sub that connects two different thread types or sizes, for example between the drill pipe and the BHA, or to a specialist tool.',
      ex: 'Do we have the crossover for the FOSV?',
      say: 'A crossover, written XO, is a short sub that joins two different thread types or sizes. A missing crossover can stop a job, so people double check them.',
    },
    {
      term: 'Float valve', no: 'tilbakeslagsventil (float)',
      def: 'A one-way valve near the bit (in a float sub) that lets mud flow down but stops fluid and well influx flowing back up the string.',
      say: 'A float valve, a one way check valve near the bit, lets mud flow down but stops fluid from flowing back up the string.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const hlSets = [[], [5, 7], [6, 11], [2], [4], [8]];
    const pos = stringWithHl(ctx, S, hlSets[bi], t, 0.6);
    if (bi === 0) {
      const a = S.p(0, 0.6, 0.5);
      ctx.save(); ctx.globalAlpha *= a;
      panel(ctx, 'TYPICAL BHA, TOP TO BOTTOM');
      const items = COMPS.slice(1).map((c) => c.label);
      items.forEach((n, i) => {
        const v = S.p(0, 0.3, 1 + i * 0.35);
        const y = 150 + i * 56;
        text(ctx, n, 560, y, { size: 26, weight: 700, color: C.text, alpha: v });
        line(ctx, 530, y - 8, 480, pos[i + 1].mid, rgba(C.amber, 0.25 * v), 1.5);
      });
      ctx.restore();
    }
    const labelAt = (idx, lbl, col = C.amber) => callout(ctx, SX + 40, pos[idx].mid, 470, pos[idx].mid, lbl, { color: col, size: 22, t: S.p(bi, 0.6, 0.6) });
    if (bi === 1) {
      labelAt(5, 'DRILL COLLARS');
      panel(ctx, 'WEIGHT ON BIT', S.p(1, 0.6, 1.5));
      const a = S.p(1, 0.6, 2);
      ctx.save(); ctx.globalAlpha *= a;
      // neutral point diagram
      const x = 820;
      ST.metal(ctx, x - 10, 150, 20, 300); ST.metal(ctx, x - 20, 450, 40, 330, '#97a8b8');
      line(ctx, x - 140, 520, x + 140, 520, C.green, 3, [10, 6]);
      text(ctx, 'neutral point', x + 150, 528, { size: 20, weight: 800, color: C.green });
      text(ctx, 'TENSION', x - 40, 300, { size: 24, weight: 900, align: 'right', color: C.cyan });
      text(ctx, 'COMPRESSION', x - 40, 700, { size: 24, weight: 900, align: 'right', color: C.amber });
      arrow(ctx, x, 140, x, 90, { color: C.cyan, lw: 5 }); arrow(ctx, x, 800, x, 860, { color: C.amber, lw: 5 });
      ctx.restore();
    }
    if (bi === 2) {
      labelAt(6, 'STRING STAB'); labelAt(11, 'NEAR-BIT STAB');
      panel(ctx, 'CROSS-SECTION OF THE HOLE', S.p(2, 0.6, 1.2));
      const a = S.p(2, 0.6, 1.5);
      ctx.save(); ctx.globalAlpha *= a;
      const cx = 820, cy = 470;
      circle(ctx, cx, cy, 230, '#5e4128', C.rock3, 10);
      circle(ctx, cx, cy, 90, '#97a8b8', '#56687a', 3);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 1.5);
      for (let k = 0; k < 3; k++) { ctx.save(); ctx.rotate((k / 3) * Math.PI * 2); fillRR(ctx, 80, -24, 145, 48, 10, '#c8a24a', '#8a6d1a', 2); ctx.restore(); }
      ctx.restore();
      text(ctx, 'blades almost touch the wall', cx, 760, { size: 22, weight: 700, align: 'center', color: C.dim });
      ctx.restore();
    }
    if (bi === 3) {
      labelAt(2, 'JAR');
      panel(ctx, 'JARRING', S.p(3, 0.6, 1.0));
      const ph = (S.since(3) * 0.35) % 1;
      const x = 820, y = 280;
      // jar body and mandrel
      ST.metal(ctx, x - 40, y, 80, 420, '#8fa6bb');
      const slide = ph < 0.7 ? ease.in(ph / 0.7) * 120 : 120;
      ST.metal(ctx, x - 22, y - 120 + slide, 44, 260, '#cfd8e3');
      fillRR(ctx, x - 40, y + 130, 80, 16, 3, C.red);
      if (ph > 0.7 && ph < 0.9) {
        const f = (ph - 0.7) / 0.2;
        for (let k = 0; k < 10; k++) { const a = (k / 10) * Math.PI * 2; line(ctx, x + Math.cos(a) * (50 + f * 40), y + 140 + Math.sin(a) * (30 + f * 20), x + Math.cos(a) * (80 + f * 70), y + 140 + Math.sin(a) * (50 + f * 40), C.amber, 4); }
        text(ctx, 'BANG!', x + 150, y + 150, { size: 40, weight: 900, color: C.amber });
      }
      text(ctx, ph < 0.7 ? 'pull: store energy…' : 'release: impact', x, y + 520, { size: 26, weight: 800, align: 'center', color: C.text });
    }
    if (bi === 4) {
      labelAt(4, 'CROSSOVER');
      panel(ctx, 'CROSSOVER SUB', S.p(4, 0.6, 1.0));
      const a = S.p(4, 0.6, 1.4);
      ctx.save(); ctx.globalAlpha *= a;
      ST.metal(ctx, 790, 180, 60, 220, '#a9b8c6');
      ST.metal(ctx, 770, 400, 100, 100, '#c8d3dd');
      ST.metal(ctx, 760, 500, 120, 240, '#97a8b8');
      text(ctx, 'thread A', 900, 300, { size: 22, weight: 800, color: C.cyan });
      text(ctx, 'XO', 820, 462, { size: 28, weight: 900, align: 'center', color: '#0b1520' });
      text(ctx, 'thread B', 900, 640, { size: 22, weight: 800, color: C.amber });
      ctx.restore();
    }
    if (bi === 5) {
      labelAt(8, 'FLOAT SUB');
      panel(ctx, 'FLOAT VALVE', S.p(5, 0.6, 1.0));
      const ph = (S.since(5) * 0.25) % 1;
      const down = ph < 0.5;
      const x = 820, y = 470;
      ST.metal(ctx, x - 120, y - 300, 30, 600, '#97a8b8'); ST.metal(ctx, x + 90, y - 300, 30, 600, '#97a8b8');
      ctx.fillStyle = rgba(C.mud, 0.5); ctx.fillRect(x - 90, y - 300, 180, 600);
      // flapper/plunger
      const open = down ? 1 : 0;
      fillRR(ctx, x - 70, y - 20 + open * 50, 140, 30, 8, down ? '#7d8a96' : C.green);
      if (down) K.flow(ctx, [[x - 40, y - 290], [x - 40, y + 290]], t, { spacing: 40, speed: 120, color: C.mudLight, r: 6 });
      else { for (let k = 0; k < 4; k++) { const yy = y + 280 - ((t * 60 + k * 40) % 200); circle(ctx, x + Math.sin(k) * 40, yy, 7, C.red); } }
      text(ctx, down ? 'pumping: valve open ↓' : 'flow back: valve closed ×', x, y + 360, { size: 26, weight: 800, align: 'center', color: down ? C.mudLight : C.green });
    }
  },
};

// ------------------------------------------------------------ MWD, LWD, steering
const steerScene = {
  id: 'steer',
  title: 'Measuring and steering downhole',
  blurb: 'The electronics and steering tools in the BHA.',
  beats: [
    {
      term: 'Measurement while drilling', abbr: 'MWD',
      def: 'A BHA tool with accelerometers and magnetometers that measures inclination, azimuth (surveys) and toolface, plus vibration, downhole pressure and temperature, and sends it to surface in real time.',
      ex: 'Take a survey at the connection; MWD shows 32 degrees inclination.',
      say: 'The MWD tool, measurement while drilling, measures where the bit is heading: inclination and azimuth for the survey, and toolface for steering. It also measures vibration, pressure and temperature, and sends it all to surface while drilling.',
    },
    {
      term: 'Mud pulse telemetry', no: 'slampulstelemetri',
      def: 'How MWD data gets to surface: a pulser in the tool creates pressure pulses in the mud column that are detected and decoded at surface. Only a few bits per second; wired drill pipe is much faster.',
      say: 'The data travels to surface as pressure pulses in the mud. A valve in the tool briefly restricts the flow, and sensors on the standpipe decode the pulses. It is slow, only a few bits per second.',
    },
    {
      term: 'Logging while drilling', abbr: 'LWD',
      def: 'Formation evaluation sensors in the BHA, such as gamma ray, resistivity, density, neutron and sonic, that log the rock as it is drilled, giving real-time logs for geosteering and picking formation tops.',
      say: 'LWD, logging while drilling, puts formation sensors in the BHA: gamma ray, resistivity, density and more. The geologists see the rock in real time, minutes after it is drilled.',
    },
    {
      term: 'Rotary steerable system', abbr: 'RSS', no: 'roterende styrbart system',
      def: 'A steering tool that changes the well direction while the whole string keeps rotating, using pads that push against the hole wall (push-the-bit) or by tilting the bit shaft (point-the-bit).',
      ex: 'Set the RSS to 60 percent steering, toolface 30 right.',
      say: 'A rotary steerable system, RSS, steers the well while the whole string keeps rotating. Pads push against the hole wall, or the bit shaft is tilted, to curve the hole in the chosen direction.',
    },
    {
      term: 'Mud motor', abbr: 'PDM', no: 'slammotor',
      def: 'A positive displacement motor: mud flow turns a helical rotor inside a rubber stator, which turns the bit. With a bent housing, the driller steers by sliding (string not rotating) and holds direction by rotating.',
      ex: 'We’re sliding with the motor, toolface 20 left.',
      say: 'The older steering method is a mud motor, a positive displacement motor. Mud flow turns a rotor that turns the bit. With a bent housing, the driller steers by sliding, with the string not rotating, and drills straight by rotating.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const hlSets = [[9], [9], [10], [12], []];
    const pos = stringWithHl(ctx, S, hlSets[bi], t, bi === 4 ? 0 : 0.6);
    if (bi === 0) {
      callout(ctx, SX + 40, pos[9].mid, 470, pos[9].mid, 'MWD', { color: C.cyan, size: 24, t: S.p(0, 0.6, 0.6) });
      panel(ctx, 'WHAT MWD MEASURES', S.p(0, 0.6, 1));
      const items = [['Inclination', 'angle from vertical'], ['Azimuth', 'compass direction'], ['Toolface', 'where the steering points'], ['Vibration & shocks', 'protect the BHA'], ['Downhole pressure', 'real-time ECD']];
      items.forEach(([a, b], i) => {
        const v = S.p(0, 0.4, 1.5 + i * 0.8);
        text(ctx, a, 540, 180 + i * 130, { size: 30, weight: 800, color: C.text, alpha: v });
        text(ctx, b, 540, 216 + i * 130, { size: 22, weight: 500, color: C.dim, alpha: v });
      });
    }
    if (bi === 1) {
      // pulses travelling up the string
      for (let k = 0; k < 6; k++) {
        const y = pos[9].y0 - ((t * 160 + k * 120) % (pos[9].y0 - 20));
        ctx.save(); ctx.globalAlpha *= 0.8;
        fillRR(ctx, SX - 7, y - 6, 14, 12, 3, C.cyan); ctx.restore();
      }
      panel(ctx, 'STANDPIPE PRESSURE AT SURFACE', S.p(1, 0.6, 0.5));
      const gx = 520, gy = 300, gw = 600, gh = 240;
      ctx.beginPath();
      const bits = [1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1];
      for (let i = 0; i <= gw; i += 2) {
        const tt = (i / gw) * 12 - (t * 2) % 1;
        const b = bits[Math.floor(((i / gw) * 12 + t * 2)) % bits.length];
        const y = gy + gh / 2 - (b ? 60 : 0) + Math.sin(i * 0.3) * 3;
        i ? ctx.lineTo(gx + i, y) : ctx.moveTo(gx, y);
      }
      ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, 'decoded: inc 32.4°  az 118.6°  TF 30R', 820, gy + gh + 80, { size: 26, weight: 800, align: 'center', color: C.text, fam: K.MONO, alpha: S.p(1, 0.6, 3) });
      text(ctx, '≈ 1–10 bits per second', 820, gy + gh + 130, { size: 22, weight: 600, align: 'center', color: C.dim, alpha: S.p(1, 0.6, 4) });
    }
    if (bi === 2) {
      callout(ctx, SX + 40, pos[10].mid, 470, pos[10].mid, 'LWD', { color: C.green, size: 24, t: S.p(2, 0.6, 0.6) });
      // sensing arcs into formation
      for (let k = 0; k < 3; k++) {
        const ph = (t * 0.7 + k / 3) % 1;
        ctx.save(); ctx.globalAlpha *= 1 - ph;
        ctx.beginPath(); ctx.arc(SX, pos[10].mid, 30 + ph * 110, -0.6, 0.6); ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.stroke();
        ctx.beginPath(); ctx.arc(SX, pos[10].mid, 30 + ph * 110, Math.PI - 0.6, Math.PI + 0.6); ctx.stroke();
        ctx.restore();
      }
      panel(ctx, 'REAL-TIME LOGS', S.p(2, 0.6, 1));
      const G = require('../art/geo');
      const zones = [{ top: 0, bot: 30, lith: 'shale' }, { top: 30, bot: 70, lith: 'sand', fluid: 'oil' }, { top: 70, bot: 100, lith: 'shale' }, { top: 100, bot: 140, lith: 'sand', fluid: 'water' }];
      G.logTracks(ctx, 500, 180, 660, zones, 0, 140, S.p(2, 5, 1.5, ease.linear), { tw: 150, gap: 8 });
    }
    if (bi === 3) {
      callout(ctx, SX + 40, pos[12].mid, 470, pos[12].mid, 'RSS', { color: C.amber, size: 24, t: S.p(3, 0.6, 0.6) });
      panel(ctx, 'PUSH-THE-BIT STEERING', S.p(3, 0.6, 1));
      const cx = 820, cy = 600;
      // curving hole
      const p = S.p(3, 6, 1.2, ease.linear);
      ctx.save(); ctx.globalAlpha *= S.p(3, 0.6, 1.2);
      ctx.strokeStyle = '#5e4128'; ctx.lineWidth = 90; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(cx - 200, 160); ctx.lineTo(cx - 200, 380); ctx.quadraticCurveTo(cx - 200, 560, cx + 20 * p, 600 + 120 * p); ctx.stroke();
      // tool in hole
      ST.metal(ctx, cx - 220, 160, 40, 260, '#7f93a6');
      const push = 0.5 + 0.5 * Math.sin(t * 4);
      fillRR(ctx, cx - 232 - 18 * push, 300, 14, 80, 4, C.amber);
      arrow(ctx, cx - 300, 340, cx - 250, 340, { color: C.amber, lw: 4 });
      text(ctx, 'pad pushes off the low side…', cx - 140, 250, { size: 22, weight: 700, color: C.amber });
      text(ctx, '…so the hole curves the other way', cx - 140, 820, { size: 22, weight: 700, color: C.text });
      ctx.restore();
    }
    if (bi === 4) {
      panel(ctx, 'MUD MOTOR (PDM)', S.p(4, 0.6, 0.3));
      const x = 820, y = 160;
      ctx.save(); ctx.globalAlpha *= S.p(4, 0.6, 0.5);
      // stator
      fillRR(ctx, x - 70, y, 140, 420, 12, '#2b3d4f', '#56687a', 3);
      // helical rotor
      ctx.beginPath();
      for (let yy = 0; yy <= 400; yy += 4) { const xx = Math.sin(yy / 30 + t * 6) * 26; yy ? ctx.lineTo(x + xx, y + 10 + yy) : ctx.moveTo(x + xx, y + 10); }
      ctx.strokeStyle = '#c8d3dd'; ctx.lineWidth = 34; ctx.stroke();
      K.flow(ctx, [[x - 50, y + 10], [x - 50, y + 410]], t, { spacing: 36, speed: 120, color: C.mudLight, r: 5 });
      // bent housing + bit
      ctx.save(); ctx.translate(x, y + 430); ctx.rotate(0.12);
      ST.metal(ctx, -40, 0, 80, 120, '#7f93a6');
      ST.pdcSide(ctx, 0, 160, 1.1, t * 6);
      ctx.restore();
      text(ctx, 'bent housing', x + 120, y + 500, { size: 22, weight: 700, color: C.amber });
      const slide = Math.floor(S.since(4) / 4) % 2 === 0;
      tag(ctx, slide ? 'SLIDING: string still, bit turned by motor → steers' : 'ROTATING: whole string turns → drills straight', x, 860, { size: 20, color: slide ? C.amber : C.cyan });
      ctx.restore();
    }
  },
};

// ------------------------------------------------------------ bits
const bitScene = {
  id: 'bits',
  title: 'Bits and hole openers',
  blurb: 'Where the rock actually gets drilled.',
  beats: [
    {
      term: 'PDC bit', no: 'PDC-krone',
      def: 'A fixed-blade bit with polycrystalline diamond compact (PDC) cutters that shear the rock like a plane. The most common bit type today, from soft to medium-hard rock.',
      ex: 'Pull the PDC and run a new one for the next section.',
      say: 'Most sections today are drilled with a PDC bit. Fixed blades carry polycrystalline diamond cutters that shear the rock, a bit like a carpenter’s plane.',
    },
    {
      term: 'Roller cone bit', no: 'rullekrone',
      def: 'Three rotating cones with teeth or tungsten-carbide inserts that crush and gouge the rock. Also called a tricone; still used in top holes, hard or very variable formations.',
      say: 'A roller cone bit, or tricone, has three rotating cones with teeth or inserts that crush the rock. It is still used in top hole sections and in hard, mixed formations.',
    },
    {
      term: 'Nozzles & TFA', abbr: 'TFA', no: 'dyser',
      def: 'Jets in the bit that accelerate the mud to clean the cutters and the hole bottom. Their total flow area (TFA) sets the pressure drop across the bit and the hydraulic power at the bit.',
      ex: 'We’ll dress the bit with six 13s.',
      say: 'Nozzles, or jets, accelerate the mud through the bit to clean the cutters and sweep cuttings off bottom. Their total flow area, TFA, sets the pressure drop across the bit.',
    },
    {
      term: 'Underreamer & hole opener', no: 'hullutvider',
      def: 'Tools that enlarge the hole. A hole opener follows a pilot hole; an underreamer has cutter arms that expand downhole to make the hole bigger than the casing it passed through.',
      say: 'Hole openers and underreamers make the hole bigger. An underreamer has cutter arms that expand once it is downhole, so it can open a hole wider than the casing it passed through.',
    },
    {
      term: 'Bit grading', no: 'kronegradering',
      def: 'The IADC dull grading code recorded when a bit is pulled, e.g. 1-2-WT-A-X-I-CT-TD: inner and outer cutter wear (0–8), main dull characteristic, location, bearings, gauge, other dull, and reason pulled.',
      ex: 'Bit came out 1-1, in gauge, pulled at TD.',
      say: 'When a bit comes out of the hole it is graded with the IADC dull code, eight characters that describe the wear and why it was pulled. One one, in gauge, pulled at TD, is a happy driller.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0 || bi === 2) {
      ST.pdcFace(ctx, 360, 460, 260, t * (bi === 2 ? 0.4 : 1.2));
      if (bi === 0) {
        callout(ctx, 360 + 150, 460 - 30, 800, 220, 'PDC cutters', { color: C.amber, size: 24, t: S.p(0, 0.6, 1) });
        callout(ctx, 360 + 200, 460 + 80, 800, 360, 'fixed blades', { color: C.cyan, size: 24, t: S.p(0, 0.6, 2) });
        // shearing animation
        const a = S.p(0, 0.6, 3.5);
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, 720, 480, 440, 380, 16, '#0d1f2f', C.panelEdge, 2);
        K.lithoFill(ctx, 'rock3', 740, 700, 400, 140, 5);
        const cxp = 740 + ((S.since(0) * 80) % 360);
        circle(ctx, cxp, 680, 26, '#f1f5f9', '#94a3b8', 3);
        for (let k = 0; k < 6; k++) circle(ctx, cxp - 30 - k * 14, 690 - k * 9 - Math.sin(t * 8 + k) * 4, 4, '#d8c7a8');
        ctx.fillStyle = '#0d1f2f'; ctx.fillRect(740, 700, cxp - 740, 14);
        text(ctx, 'shearing the rock', 940, 540, { size: 24, weight: 800, align: 'center', color: C.text });
        ctx.restore();
      } else {
        // jets
        for (let k = 0; k < 3; k++) {
          const a = (k / 3) * Math.PI * 2 + 0.5 + t * 0.4;
          const nx = 360 + Math.cos(a) * 260 * 0.42, ny = 460 + Math.sin(a) * 260 * 0.42;
          for (let j = 0; j < 6; j++) {
            const ph = (t * 2 + j / 6) % 1;
            circle(ctx, nx + Math.cos(a) * ph * 60, ny + Math.sin(a) * ph * 60, 8 * (1 - ph), rgba(C.cyan, 0.8 * (1 - ph)));
          }
        }
        callout(ctx, 360 + 109, 460 + 109 * 0.3, 760, 300, 'NOZZLES (jets)', { color: C.cyan, size: 24, t: S.p(2, 0.6, 0.8) });
        const a = S.p(2, 0.6, 3.5);
        ctx.save(); ctx.globalAlpha *= a;
        fillRR(ctx, 720, 480, 440, 300, 16, '#0d1f2f', C.panelEdge, 2);
        text(ctx, '6 × 13/32" nozzles', 940, 560, { size: 28, weight: 800, align: 'center', color: C.text });
        text(ctx, 'TFA ≈ 0.78 in²', 940, 620, { size: 34, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
        text(ctx, 'smaller TFA → higher bit ΔP', 940, 690, { size: 22, weight: 600, align: 'center', color: C.dim });
        ctx.restore();
      }
    }
    if (bi === 1) {
      ST.tricone(ctx, 360, 460, 260, t * 0.8);
      callout(ctx, 360 + 110, 460, 800, 250, 'three rotating cones', { color: C.amber, size: 24, t: S.p(1, 0.6, 1) });
      callout(ctx, 360 + 60, 460 + 120, 800, 400, 'teeth / carbide inserts', { color: C.cyan, size: 24, t: S.p(1, 0.6, 2.5) });
      text(ctx, 'crushes & gouges the rock', 940, 700, { size: 26, weight: 800, align: 'center', color: C.text, alpha: S.p(1, 0.6, 4) });
    }
    if (bi === 3) {
      // underreamer opening below casing
      const x = 600;
      K.lithoFill(ctx, 'rock3', 0, 0, 1196, 940, 7);
      ctx.fillStyle = '#5e4128';
      ctx.fillRect(x - 110, 0, 220, 360); // casing ID region
      const op = S.p(3, 1.2, 2.0);
      const depth = 360 + 380 * S.p(3, 5, 3.0, ease.linear);
      ctx.fillRect(x - 90, 360, 180, 560);
      ctx.fillRect(x - 90 - 60 * op, 360, 180 + 120 * op, depth - 360);
      // casing
      ST.metal(ctx, x - 130, 0, 20, 360, '#b8c4cf'); ST.metal(ctx, x + 110, 0, 20, 360, '#b8c4cf');
      text(ctx, 'casing', x - 150, 200, { size: 22, weight: 700, align: 'right', color: C.text });
      // tool
      ST.metal(ctx, x - 40, 0, 80, depth - 40, '#8796a5');
      for (const sd of [-1, 1]) {
        ctx.save(); ctx.translate(x + sd * 40, depth - 90); ctx.rotate(-sd * (0.1 + 0.95 * op));
        fillRR(ctx, -8, -10, 16, 90 * (0.4 + 0.6 * op), 4, C.amber); ctx.restore();
      }
      ST.metal(ctx, x - 22, depth - 40, 44, 840 - depth + 40, '#97a8b8');
      ST.pdcSide(ctx, x, 880, 1.2, t * 6);
      tag(ctx, op < 0.5 ? 'arms closed while passing the casing' : 'arms open: hole enlarged below the shoe', x, 120, { size: 22, color: C.amber, fill: 'rgba(7,17,28,0.9)' });
    }
    if (bi === 4) {
      // dull bit and code
      ST.pdcFace(ctx, 300, 460, 200, 0.4, { nozzles: true });
      ctx.save(); ctx.globalAlpha *= 0.55; circle(ctx, 300 + 150, 460 - 60, 30, rgba('#000', 0.6)); circle(ctx, 300 - 120, 460 + 110, 24, rgba('#000', 0.6)); ctx.restore();
      const code = ['1', '2', 'WT', 'A', 'X', 'I', 'CT', 'TD'];
      const lbl = ['inner', 'outer', 'dull', 'location', 'bearings', 'gauge', 'other', 'reason'];
      code.forEach((c, i) => {
        const v = S.p(4, 0.4, 0.8 + i * 0.6, ease.outBack);
        if (v <= 0) return;
        const x = 580 + (i % 4) * 150, y = 260 + Math.floor(i / 4) * 230;
        ctx.save(); ctx.globalAlpha *= clamp(v);
        fillRR(ctx, x - 60, y - 60, 120, 100, 12, rgba(C.amber, 0.12), C.amber, 2);
        text(ctx, c, x, y + 8, { size: 40, weight: 900, align: 'center', color: C.text, fam: K.MONO });
        text(ctx, lbl[i], x, y + 74, { size: 18, weight: 700, align: 'center', color: C.dim });
        ctx.restore();
      });
      text(ctx, 'WT = worn teeth · CT = chipped cutters · TD = pulled at total depth', 820, 820, { size: 20, weight: 600, align: 'center', color: C.dim, alpha: S.p(4, 0.6, 6) });
    }
  },
};

module.exports = {
  id: 'ch05', num: 5, title: 'Drill String & BHA',
  subtitle: 'From drill pipe to the bit, and the tools in between',
  topics: ['Drill pipe', 'Pin & box', 'Make-up', 'HWDP', 'BHA', 'Drill collars', 'Stabiliser', 'Jar', 'Crossover', 'Float', 'MWD', 'LWD', 'RSS', 'Mud motor', 'PDC', 'Tricone', 'Nozzles', 'Underreamer'],
  intro: 'Chapter five: the drill string and the bottom hole assembly. This is the part of the rig that actually goes in the hole, so expect to hear these words in every meeting.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0d1f2f'; ctx.fillRect(0, 0, 700, 900);
    ST.pdcFace(ctx, 330, 420, 250, t * 0.8);
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [pipeScene, bhaScene, steerScene, bitScene],
};
