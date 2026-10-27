'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const SS = require('../art/subsea');
const ST = require('../art/string');
const I = require('../art/icons');
const WL = require('../art/well');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, dimLine, darken } = K;

function tophole(ctx, t, opt = {}) {
  const seaY = 140, sb = opt.sb || 470;
  R.sky(ctx, 1196, seaY, { top: '#0a1825', bot: '#173c5c' });
  R.sea(ctx, 1196, seaY, sb, t, { amp: 4 });
  // shallow geology
  K.lithoFill(ctx, 'clay', 0, sb, 1196, 140, 3);
  K.lithoFill(ctx, 'rock2', 0, sb + 140, 1196, 120, 5);
  K.lithoFill(ctx, 'clay', 0, sb + 260, 1196, 300, 7);
  line(ctx, 0, sb, 1196, sb, '#8a7457', 3);
  R.semi(ctx, opt.rigX || 450, seaY, 0.55, t, { heave: Math.sin(t) * 2 });
  return { seaY, sb };
}

// ------------------------------------------------------------ top hole & shallow gas
const topScene = {
  id: 'tophole',
  title: 'Spud, top hole and shallow gas',
  blurb: 'The first metres of a well are drilled with no riser and no BOP.',
  beats: [
    {
      term: 'Spud', no: 'spudde',
      def: 'To start drilling a new well: the moment the bit first enters the seabed. The spud date is a milestone in reports, in Sodir’s records and in the well cost curve.',
      ex: 'We spudded 7220/8-1 at 03:15 this morning.',
      say: 'To spud a well is to start drilling it, the moment the bit first enters the seabed. The spud date is a milestone that goes into every report.',
    },
    {
      term: 'Top hole & riserless drilling', no: 'topphull',
      def: 'The first sections (e.g. 36" and 26") are drilled before any BOP or riser is installed. Returns, usually seawater with hi-vis sweeps, flow out at the seabed, watched by the ROV.',
      ex: 'Top hole is drilled riserless, returns to seabed.',
      say: 'The top hole sections are drilled before the BOP and riser are installed. The drill string hangs through open water, and the returns, usually seawater and viscous sweeps, simply flow out onto the seabed, watched by the ROV.',
    },
    {
      term: 'Shallow gas', no: 'grunn gass',
      def: 'Gas trapped in shallow sands, above the depth where a BOP is installed. A major hazard on the NCS: if released it can blow out at the seabed and reduce the buoyancy and stability of a floating rig.',
      ex: 'The site survey shows a possible shallow gas anomaly at 480 metres.',
      say: 'Shallow gas is gas trapped in shallow sands, above the depth where the BOP is installed. It is a classic hazard on the Norwegian shelf. If it is released, gas can erupt at the seabed and reduce the buoyancy of a floating rig.',
    },
    {
      term: 'Pilot hole', no: 'pilothull',
      def: 'A small-diameter hole (e.g. 9⅞") drilled first through the top hole to check for shallow gas. A small hole is easier to control or kill. If clear, it is opened up to full size.',
      say: 'Where shallow gas cannot be ruled out, a small pilot hole is drilled first. A small hole is much easier to control. If it is clear, the hole is opened up to full size.',
    },
    {
      term: 'Site survey', no: 'grunnundersøkelse',
      def: 'Investigation of the location before drilling: high-resolution seismic, seabed mapping and soil sampling, used to assess shallow gas, boulders, soil strength for anchors and conductor, and seabed habitats.',
      say: 'Before a rig arrives, a site survey maps the location with high resolution seismic and seabed sampling. It is used to assess shallow gas, boulders, and whether the soil can hold the anchors and the conductor.',
    },
    {
      term: 'Riserless mud recovery', abbr: 'RMR',
      def: 'A subsea pump at the wellhead that sends top hole returns back to the rig through a return line. It allows weighted mud in the top hole and avoids discharging mud at the seabed. Developed in Norway.',
      say: 'Riserless mud recovery, RMR, uses a subsea pump at the wellhead to send the top hole returns back to the rig through a hose. That allows a proper mud in the top hole, without discharging it on the seabed.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const { seaY, sb } = tophole(ctx, t, { rigX: 450 });
    const x = 450;
    if (bi === 0) {
      const p = S.p(0, 3, 0.5);
      const bit = lerp(sb - 150, sb + 30, p);
      line(ctx, x, seaY - 20, x, bit - 40, '#cfd8e3', 5);
      ST.pdcSide(ctx, x, bit, 0.6, t * 5);
      if (p >= 1) {
        tag(ctx, 'SPUD!', x + 120, sb - 60, { size: 30, color: C.amber, fill: 'rgba(7,17,28,0.9)' });
        I.clock(ctx, 900, 300, 120, t * 0.2);
        text(ctx, '03:15', 900, 420, { size: 40, weight: 900, align: 'center', color: C.text, fam: K.MONO });
      }
    }
    if (bi === 1 || bi === 2 || bi === 3) {
      const holeD = bi === 1 ? lerp(sb + 20, sb + 230, S.p(1, 5, 0.5)) : sb + 230;
      ctx.fillStyle = '#5e4128'; ctx.fillRect(x - 46, sb, 92, holeD - sb);
      // conductor
      ST.metal(ctx, x - 52, sb - 20, 10, 110, '#b8c4cf'); ST.metal(ctx, x + 42, sb - 20, 10, 110, '#b8c4cf');
      fillRR(ctx, x - 70, sb - 26, 140, 14, 3, '#7d8a96');
      if (bi === 1) {
        line(ctx, x, seaY - 20, x, holeD - 30, '#cfd8e3', 5);
        ST.pdcSide(ctx, x, holeD, 0.55, t * 5);
        // returns cloud at seabed
        for (let k = 0; k < 26; k++) {
          const ph = (t * 0.5 + k / 26) % 1;
          const dir = k % 2 ? 1 : -1;
          circle(ctx, x + dir * (40 + ph * 160), sb - 10 - Math.sin(ph * Math.PI) * 40, 4 + ph * 4, rgba('#c8b79a', 0.7 * (1 - ph)));
        }
        SS.rov(ctx, 760, sb - 80, 0.9, t, { dir: -1 });
        callout(ctx, x + 130, sb - 30, 860, 250, 'returns to seabed', { color: C.amber, size: 22, t: S.p(1, 0.6, 2) });
        tag(ctx, 'no riser · no BOP', 860, 330, { size: 22, color: C.cyan, alpha: S.p(1, 0.6, 4), fill: 'rgba(7,17,28,0.9)' });
      }
      if (bi >= 2) {
        // shallow gas sand lens
        const gy = sb + 330;
        ctx.save();
        ctx.beginPath(); ctx.ellipse(x + 40, gy, 380, 50, 0, 0, Math.PI * 2); ctx.clip();
        K.lithoFill(ctx, 'sand', x - 360, gy - 60, 800, 120, 9);
        ctx.fillStyle = rgba(C.gas, 0.55 + 0.15 * K.pulse(t)); ctx.fillRect(x - 360, gy - 60, 800, 120);
        ctx.restore();
        callout(ctx, x + 300, gy, 860, gy - 120, 'SHALLOW GAS', { color: C.red, size: 24, t: S.p(2, 0.6, 0.6), sub: 'in a shallow sand lens' });
        if (bi === 2) {
          // hypothetical blowout
          const b = S.p(2, 0.6, 4);
          if (b > 0) {
            for (let k = 0; k < 40; k++) {
              const ph = (t * 0.6 + k / 40) % 1;
              const xx = x + Math.sin(k * 3.7) * 70 * (1 + ph);
              circle(ctx, xx, lerp(sb, seaY, ph), 4 + ph * 8, rgba('#e9f6ff', 0.6 * (1 - ph) * b));
            }
            tag(ctx, 'gas in the water → less buoyancy!', 860, 200, { size: 22, color: C.red, alpha: b, fill: 'rgba(7,17,28,0.9)' });
          }
        }
        if (bi === 3) {
          const p = S.p(3, 4, 0.5);
          const pd = lerp(sb + 230, sb + 480, p);
          ctx.fillStyle = '#5e4128'; ctx.fillRect(x - 12, sb + 230, 24, pd - sb - 230);
          line(ctx, x, seaY - 20, x, pd - 20, '#cfd8e3', 4);
          ST.pdcSide(ctx, x, pd, 0.3, t * 5);
          callout(ctx, x + 14, sb + 420, 860, sb + 300, 'PILOT HOLE (9⅞")', { color: C.amber, size: 22, t: S.p(3, 0.6, 1.5) });
          tag(ctx, 'small hole = easier to control', 860, 230, { size: 22, color: C.cyan, alpha: S.p(3, 0.6, 3.5), fill: 'rgba(7,17,28,0.9)' });
        }
      }
    }
    if (bi === 4) {
      const vx = lerp(200, 900, (S.since(4) * 0.06) % 1);
      I.ship(ctx, vx, seaY + 4, 150, { color: '#2f6fb3' });
      for (let k = 0; k < 4; k++) {
        const ph = (t * 0.8 + k / 4) % 1;
        ctx.save(); ctx.globalAlpha *= 1 - ph;
        ctx.beginPath(); ctx.arc(vx, seaY + 10, 20 + ph * 380, 0.15, Math.PI - 0.15); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.restore();
      }
      const items = ['shallow gas anomalies', 'boulders & seabed features', 'soil strength (anchors, conductor)', 'pipelines, wrecks, habitats'];
      fillRR(ctx, 640, 520, 520, 260, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      items.forEach((s2, i) => text(ctx, '•  ' + s2, 670, 575 + i * 48, { size: 22, weight: 700, color: C.text, alpha: S.p(4, 0.4, 1.5 + i * 0.6) }));
    }
    if (bi === 5) {
      ctx.fillStyle = '#5e4128'; ctx.fillRect(x - 46, sb, 92, 230);
      line(ctx, x, seaY - 20, x, sb + 200, '#cfd8e3', 5);
      SS.wellhead(ctx, x, sb, 1.0);
      fillRR(ctx, x + 70, sb - 70, 80, 60, 8, C.yellow, '#8a6d1a', 2);
      text(ctx, 'pump', x + 110, sb - 33, { size: 16, weight: 900, align: 'center', color: '#1a1206' });
      const hose = [[x + 150, sb - 40], [x + 250, sb - 160], [x + 200, seaY + 60], [x + 120, seaY - 30]];
      K.partialPolyline(ctx, hose, 1, '#2b3d4f', 10);
      K.flow(ctx, hose, t, { spacing: 26, speed: 70, color: C.mudLight, r: 4.5 });
      callout(ctx, x + 110, sb - 70, 860, 360, 'subsea pump (RMR)', { color: C.yellow, size: 22, t: S.p(5, 0.6, 0.8) });
      callout(ctx, x + 240, sb - 150, 860, 250, 'return line to the rig', { color: C.amber, size: 22, t: S.p(5, 0.6, 2.5) });
    }
  },
};

// ------------------------------------------------------------ wellhead
function wellheadCut(ctx, t, opt = {}) {
  const x = 420, sb = 560;
  K.lithoFill(ctx, 'clay', 0, sb, 1196, 380, 4);
  const g = ctx.createLinearGradient(0, 0, 0, sb); g.addColorStop(0, '#0b3d5c'); g.addColorStop(1, '#062337');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 1196, sb);
  line(ctx, 0, sb, 1196, sb, '#8a7457', 3);
  // conductor 30" + LP housing
  ctx.fillStyle = C.cement; ctx.fillRect(x - 200, sb, 50, 380); ctx.fillRect(x + 150, sb, 50, 380);
  ST.metal(ctx, x - 160, sb - 20, 16, 400, '#b8c4cf'); ST.metal(ctx, x + 144, sb - 20, 16, 400, '#b8c4cf');
  fillRR(ctx, x - 190, sb - 110, 380, 100, 8, '#8796a5', '#56687a', 2);
  ctx.fillStyle = '#0b1622'; ctx.fillRect(x - 140, sb - 110, 280, 100);
  // guide base
  fillRR(ctx, x - 260, sb - 30, 520, 26, 4, '#5b6b7b', '#3c4c5c', 2);
  // HP housing + 20" casing
  ctx.fillStyle = C.cement; ctx.fillRect(x - 144, sb - 10, 34, 390); ctx.fillRect(x + 110, sb - 10, 34, 390);
  ST.metal(ctx, x - 128, sb - 230, 22, 230, '#c8d3dd'); ST.metal(ctx, x + 106, sb - 230, 22, 230, '#c8d3dd');
  ST.metal(ctx, x - 112, sb, 12, 380, '#b8c4cf'); ST.metal(ctx, x + 100, sb, 12, 380, '#b8c4cf');
  ctx.fillStyle = C.mud; ctx.fillRect(x - 106, sb - 230, 212, 610);
  // hangers
  const hangers = opt.hangers == null ? 2 : opt.hangers;
  if (hangers >= 1) {
    ST.metal(ctx, x - 78, sb - 40, 10, 420, '#b8c4cf'); ST.metal(ctx, x + 68, sb - 40, 10, 420, '#b8c4cf');
    fillRR(ctx, x - 106, sb - 60, 40, 30, 4, '#9fb0c1'); fillRR(ctx, x + 66, sb - 60, 40, 30, 4, '#9fb0c1');
    fillRR(ctx, x - 106, sb - 78, 30, 16, 3, C.purple); fillRR(ctx, x + 76, sb - 78, 30, 16, 3, C.purple);
  }
  if (hangers >= 2) {
    ST.metal(ctx, x - 52, sb - 100, 8, 480, '#b8c4cf'); ST.metal(ctx, x + 44, sb - 100, 8, 480, '#b8c4cf');
    fillRR(ctx, x - 78, sb - 120, 34, 26, 4, '#9fb0c1'); fillRR(ctx, x + 44, sb - 120, 34, 26, 4, '#9fb0c1');
    fillRR(ctx, x - 78, sb - 136, 26, 14, 3, C.purple); fillRR(ctx, x + 52, sb - 136, 26, 14, 3, C.purple);
  }
  if (opt.wearBushing) { fillRR(ctx, x - 104, sb - 210, 16, 70, 3, C.cyan); fillRR(ctx, x + 88, sb - 210, 16, 70, 3, C.cyan); }
  // BOP connector
  fillRR(ctx, x - 150, sb - 330, 300, 100, 10, C.red, darken(C.red, 0.4), 2);
  text(ctx, 'BOP wellhead connector', x, sb - 272, { size: 18, weight: 800, align: 'center', color: '#fff' });
  return { x, sb };
}
const whScene = {
  id: 'wellhead',
  title: 'The subsea wellhead',
  blurb: 'Where all the casing strings hang, and where the BOP latches on.',
  beats: [
    {
      term: 'Wellhead', no: 'brønnhode',
      def: 'The steel housings at the seabed: the low-pressure housing on the conductor and the high-pressure housing (18¾") on the surface casing, typically rated 10,000–15,000 psi. Casing hangs from it and the BOP latches onto it, sitting on a guide base.',
      ex: 'Wellhead is 18¾-inch, 15k.',
      say: 'The subsea wellhead is a set of steel housings at the seabed. The low pressure housing sits on the conductor. Inside it, the high pressure housing, eighteen and three quarter inch, sits on the surface casing. All later casing strings hang from it, and the BOP latches on top.',
    },
    {
      term: 'Casing hanger & seal assembly', no: 'rørhenger / tetningsenhet',
      def: 'Each later casing string is landed in the high-pressure housing on a casing hanger. A seal assembly (pack-off) is then set to seal the annulus between the hanger and the housing, and pressure tested.',
      say: 'Each casing string lands in the wellhead on a casing hanger. Then a seal assembly, or pack off, is set and tested, sealing the annulus between the hanger and the housing.',
    },
    {
      term: 'Wear bushing', no: 'slitebøssing',
      def: 'A protective sleeve run into the wellhead while drilling, so the rotating drill string cannot damage the seal areas. It is pulled before running the next casing.',
      ex: 'Pull the wear bushing, then run the 9⅝ hanger.',
      say: 'While drilling, a wear bushing sits inside the wellhead to protect the seal areas from the rotating pipe. It is pulled out before the next casing is run.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const { x, sb } = wellheadCut(ctx, t, { hangers: bi === 0 ? 0 : 2, wearBushing: bi === 2 });
    if (bi === 0) {
      callout(ctx, x + 190, sb - 60, 960, 470, 'LOW-PRESSURE HOUSING', { color: C.amber, size: 20, t: S.p(0, 0.6, 1), sub: 'on the 30" conductor' });
      callout(ctx, x + 128, sb - 160, 960, 330, 'HIGH-PRESSURE HOUSING', { color: C.amber, size: 20, t: S.p(0, 0.6, 3), sub: '18¾", on the 20" casing' });
      callout(ctx, x + 260, sb - 18, 960, 610, 'guide base', { color: C.cyan, size: 20, t: S.p(0, 0.6, 5) });
      callout(ctx, x + 150, sb - 300, 960, 180, 'BOP latches on here', { color: C.red, size: 20, t: S.p(0, 0.6, 7) });
    }
    if (bi === 1) {
      callout(ctx, x + 90, sb - 45, 960, 470, 'CASING HANGERS', { color: C.amber, size: 22, t: S.p(1, 0.6, 0.6), sub: '13⅜" and 9⅝"' });
      callout(ctx, x + 90, sb - 130, 960, 300, 'SEAL ASSEMBLY (pack-off)', { color: C.purple, size: 20, t: S.p(1, 0.6, 3) });
    }
    if (bi === 2) {
      callout(ctx, x + 100, sb - 175, 960, 300, 'WEAR BUSHING', { color: C.cyan, size: 24, t: S.p(2, 0.6, 0.6) });
      // rotating pipe inside
      ST.metal(ctx, x - 14, 0, 28, sb + 300, '#9fb0c1');
      for (let k = 0; k < 6; k++) { const yy = 80 + k * 70 + (t * 40) % 70; line(ctx, x - 14, yy, x + 14, yy - 8, rgba('#fff', 0.6), 2); }
    }
  },
};

// ------------------------------------------------------------ riser system
function riserView(ctx, t, S) {
  const cx = 360;
  const seaY = 200, sb = 900;
  R.sky(ctx, 760, seaY, { top: '#0a1825', bot: '#173c5c' });
  R.sea(ctx, 760, seaY, sb, t, { amp: 5 });
  R.seabed(ctx, 760, sb, 40);
  const heave = Math.sin(t * 0.9) * 14;
  // rig structure (simplified) moving with heave
  ctx.save(); ctx.translate(0, -heave);
  fillRR(ctx, 120, 40, 480, 60, 6, '#c5ced6');
  fillRR(ctx, 150, 100, 70, 140, 8, '#d9a036'); fillRR(ctx, 500, 100, 70, 140, 8, '#d9a036');
  R.derrick(ctx, cx, 40, 160, 120, 40, { color: '#dfe6ec' });
  // diverter below floor
  fillRR(ctx, cx - 40, 100, 80, 34, 6, C.orange, darken(C.orange, 0.4), 2);
  // outer barrel of slip joint attached to rig
  ST.metal(ctx, cx - 26, 134, 52, 130, '#8796a5');
  // tensioner ring and wires
  fillRR(ctx, cx - 70, 250, 140, 16, 4, C.amber);
  ctx.restore();
  // tensioner wires to deck (deck moves)
  line(ctx, cx - 70, 258, 170, 110 - heave, '#cfd8e3', 2); line(ctx, cx + 70, 258, 550, 110 - heave, '#cfd8e3', 2);
  // inner barrel fixed to riser
  ST.metal(ctx, cx - 18, 200, 36, 120, '#b8c4cf');
  // riser joints with buoyancy
  for (let y = 320; y < 790; y += 60) {
    ST.metal(ctx, cx - 16, y, 32, 60, '#a9b8c6');
    if (y > 360 && y < 700) fillRR(ctx, cx - 34, y + 6, 68, 48, 8, '#e0a83a', '#8a6d1a', 1.5);
  }
  // lower flex joint + LMRP + BOP
  circle(ctx, cx, 800, 18, '#7d8a96', '#56687a', 2);
  SS.bopSimple(ctx, cx, sb - 2, 0.55, { riser: false });
  return { cx, seaY, sb, heave };
}
const riserScene = {
  id: 'riser',
  title: 'The marine riser',
  blurb: 'The pipe that connects the floating rig to the well on the seabed.',
  beats: [
    {
      term: 'Marine riser', no: 'stigerør',
      def: 'The large-diameter pipe (about 21" OD) from the BOP up to the rig. It guides the drill string into the well and carries the mud returns back to surface. Built from riser joints, many with buoyancy modules.',
      ex: 'We’re running riser, about 15 joints to go.',
      say: 'Once the BOP is installed, the marine riser connects it to the rig. It is a large pipe, about twenty one inch, that guides the drill string down and brings the mud returns back up. Many joints carry yellow buoyancy modules to reduce their weight.',
    },
    {
      term: 'Slip joint & riser tensioners', no: 'teleskopledd / stigerørsstrekkere',
      def: 'The slip (telescopic) joint at the top of the riser lets the rig heave up and down without breaking the riser. Tensioners on the rig keep the riser in tension so it does not buckle.',
      say: 'At the top, a slip joint, or telescopic joint, lets the rig heave while the riser stays still. Riser tensioners on the rig hold the riser in tension, so it never buckles under its own weight.',
    },
    {
      term: 'Flex joint & riser angle', no: 'fleksledd',
      def: 'Flexible ball-type joints at the bottom (above the LMRP) and top of the riser allow angular movement as the rig drifts or the current pushes. The riser angle is monitored and kept small.',
      ex: 'Lower flex joint angle is 1.5 degrees, ask the DPO to move us back over the well.',
      say: 'Flex joints at the bottom and top of the riser allow some angle as the rig drifts or currents push the riser. The lower flex joint angle is watched closely and kept small.',
    },
    {
      term: 'Diverter', no: 'diverter',
      def: 'A low-pressure annular-type device at the top of the riser under the drill floor that can close and send flow overboard through large lines, used for shallow gas or gas that has entered the riser above the BOP.',
      say: 'At the very top, under the drill floor, sits the diverter. If gas gets into the riser above the BOP, the diverter closes and sends the flow overboard, away from the rig.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const v = riserView(ctx, t, S);
    fillRR(ctx, 780, 100, 380, 760, 16, '#0d1f2f', C.panelEdge, 2);
    if (bi === 0) {
      callout(ctx, v.cx + 34, 520, 640, 520, 'riser joint', { color: C.amber, size: 20, t: S.p(0, 0.6, 1) });
      text(ctx, 'RISER', 970, 160, { size: 26, weight: 900, align: 'center', color: C.amber });
      ['≈ 21" OD, 23 m joints', 'guides the drill string', 'returns mud to surface', 'buoyancy reduces weight'].forEach((s2, i) => text(ctx, '•  ' + s2, 810, 230 + i * 50, { size: 22, weight: 700, color: C.text, alpha: S.p(0, 0.4, 1.5 + i * 0.6) }));
      // returns flowing up
      K.flow(ctx, [[v.cx + 8, 790], [v.cx + 8, 330]], t, { spacing: 30, speed: 60, color: C.mudLight, r: 4 });
    }
    if (bi === 1) {
      callout(ctx, v.cx + 26, 200 - v.heave, 640, 200, 'SLIP JOINT', { color: C.amber, size: 20, t: S.p(1, 0.6, 0.6) });
      callout(ctx, v.cx + 70, 258, 640, 330, 'TENSIONERS', { color: C.cyan, size: 20, t: S.p(1, 0.6, 2.5) });
      const gx = 820, gy = 220, gw = 300, gh = 200;
      text(ctx, 'rig heave vs riser', 970, 170, { size: 20, weight: 800, align: 'center', color: C.dim });
      ctx.beginPath();
      for (let i = 0; i <= 100; i++) { const tt = t - (100 - i) * 0.05; const y = gy + gh / 2 - Math.sin(tt * 0.9) * 50; i ? ctx.lineTo(gx + i * 3, y) : ctx.moveTo(gx, y); }
      ctx.strokeStyle = C.red; ctx.lineWidth = 3; ctx.stroke();
      line(ctx, gx, gy + gh - 10, gx + gw, gy + gh - 10, C.green, 3);
      text(ctx, 'rig', gx, gy + 20, { size: 18, weight: 700, color: C.red });
      text(ctx, 'riser (still)', gx, gy + gh + 20, { size: 18, weight: 700, color: C.green });
    }
    if (bi === 2) {
      callout(ctx, v.cx + 18, 800, 640, 700, 'LOWER FLEX JOINT', { color: C.amber, size: 20, t: S.p(2, 0.6, 0.6) });
      // angle gauge
      const ang = 1.5 + Math.sin(t * 0.5) * 0.4;
      text(ctx, 'riser angle', 970, 200, { size: 22, weight: 800, align: 'center', color: C.dim });
      ctx.save(); ctx.translate(970, 480);
      line(ctx, 0, 0, 0, -220, rgba('#fff', 0.3), 3, [8, 6]);
      ctx.rotate(ang * 0.08); line(ctx, 0, 0, 0, -220, C.amber, 6); ctx.restore();
      text(ctx, ang.toFixed(1) + '°', 970, 540, { size: 44, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
      text(ctx, 'keep it small', 970, 590, { size: 22, weight: 700, align: 'center', color: C.dim });
    }
    if (bi === 3) {
      callout(ctx, v.cx + 40, 117 - v.heave, 640, 300, 'DIVERTER', { color: C.orange, size: 22, t: S.p(3, 0.6, 0.6) });
      // overboard lines
      const dv = S.p(3, 0.6, 3);
      ctx.save(); ctx.globalAlpha *= dv;
      line(ctx, v.cx - 40, 117 - v.heave, 60, 140 - v.heave, '#5b6b7b', 10);
      for (let k = 0; k < 12; k++) { const ph = (t * 1.2 + k / 12) % 1; circle(ctx, 60 - ph * 60, 140 - v.heave + ph * 30, 6 + ph * 10, rgba('#e9f6ff', 0.7 * (1 - ph))); }
      ctx.restore();
      text(ctx, 'gas in riser → overboard', 970, 200, { size: 22, weight: 800, align: 'center', color: C.text, alpha: dv });
    }
  },
};

module.exports = {
  id: 'ch09', num: 9, title: 'Top Hole, Wellhead & Riser',
  subtitle: 'Spud to BOP: the first, riserless sections and the subsea connection to the rig',
  topics: ['Spud', 'Top hole', 'Shallow gas', 'Pilot hole', 'Site survey', 'RMR', 'Wellhead', 'Casing hanger', 'Seal assembly', 'Wear bushing', 'Riser', 'Slip joint', 'Tensioners', 'Flex joint', 'Diverter'],
  intro: 'Chapter nine: top hole, wellhead and riser. These are the first days of every well: spud, the riserless top hole, and then connecting the well to the rig.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.translate(-30, 0);
    riserView(ctx, t, { since: () => 0 });
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [topScene, whScene, riserScene],
};
