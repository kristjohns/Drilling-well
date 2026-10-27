'use strict';
const K = require('../engine/core');
const R = require('../art/rig');
const I = require('../art/icons');
const ST = require('../art/string');
const { C, rgba, text, fillRR, rr, arrow, circle, line, clamp, lerp, ease, tag, poly, callout, dimLine } = K;

// well path in a vertical section: vertical to KOP, build, hold
function pathPts(x0, y0, kop, R0, incDeg, holdLen) {
  const pts = [[x0, y0], [x0, kop]];
  const inc = (incDeg * Math.PI) / 180;
  for (let a = 0; a <= inc + 1e-6; a += inc / 30) pts.push([x0 + R0 * (1 - Math.cos(a)), kop + R0 * Math.sin(a)]);
  const [ex, ey] = pts[pts.length - 1];
  pts.push([ex + Math.sin(inc) * holdLen, ey + Math.cos(inc) * holdLen]);
  return pts;
}

// ------------------------------------------------------------ depth references
const datumScene = {
  id: 'datums',
  title: 'Depth references: RKB, MSL, MD and TVD',
  blurb: 'Every depth needs a reference. Mixing them up is a classic mistake.',
  beats: [
    {
      term: 'Depth reference & RKB elevation', abbr: 'RKB', no: 'referansepunkt',
      def: 'Well depths are measured from a datum, usually RKB on the drill floor. The RKB elevation (height above mean sea level) differs from rig to rig, e.g. about 25 m on a semi, so depths must be converted when data from different rigs are compared.',
      ex: 'RKB is 25.5 metres above MSL on this rig.',
      say: 'Depths are measured from a reference point, usually RKB on the drill floor. The RKB elevation above sea level is different on every rig, so depths from different rigs must be converted before they are compared.',
    },
    {
      term: 'MSL & LAT', abbr: 'MSL | LAT', no: 'middelvann / laveste astronomiske tidevann',
      def: 'Mean sea level (MSL) is the usual vertical reference for maps, seismic and water depth. Lowest astronomical tide (LAT) is used for some marine and structural references.',
      say: 'Mean sea level, MSL, is the reference for maps and seismic. Lowest astronomical tide, LAT, is used for some marine work. You will see both in rig and site documents.',
    },
    {
      term: 'Water depth', no: 'havdyp',
      def: 'The vertical distance from sea level (usually MSL) to the seabed. It drives the riser length, the rig choice and the mooring design.',
      say: 'Water depth is the vertical distance from sea level down to the seabed. It decides how much riser you need, and which rigs can drill the well.',
    },
    {
      term: 'Measured depth', abbr: 'MD', no: 'målt dybde',
      def: 'The length along the wellbore from RKB, the same as the length of drill pipe needed to reach the bit. Written e.g. 3,250 m MD RKB.',
      say: 'Measured depth, MD, is the length along the well path from RKB. It is the length of pipe in the hole.',
    },
    {
      term: 'True vertical depth', abbr: 'TVD', no: 'sann vertikal dybde',
      def: 'The vertical distance from RKB down to a point in the well. Pressure calculations always use TVD. In a vertical well MD equals TVD; in a deviated well MD is longer.',
      ex: 'Top reservoir at 2,980 m MD, 2,710 m TVD.',
      say: 'True vertical depth, TVD, is the straight vertical distance below RKB. Pressure always depends on TVD. In a deviated well, measured depth is longer than TVD.',
    },
    {
      term: 'True vertical depth sub-sea', abbr: 'TVDSS',
      def: 'TVD measured from mean sea level instead of RKB: TVDSS = TVD RKB − RKB elevation. Geologists and maps use TVDSS, so it is rig-independent.',
      ex: 'Prognosed top Brent: 2,440 m TVDSS, that’s 2,465.5 m TVD RKB on this rig.',
      say: 'TVDSS, true vertical depth sub sea, is measured from mean sea level instead. Geologists and maps use it, because it does not depend on the rig. Just subtract the RKB elevation from the TVD.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    const rkb = 120, msl = 200, sb = 380;
    R.sky(ctx, 1196, msl, { top: '#0a1825', bot: '#173c5c' });
    R.sea(ctx, 1196, msl, sb, t, { amp: 3 });
    K.lithoFill(ctx, 'clay', 0, sb, 1196, 160, 3); K.lithoFill(ctx, 'rock2', 0, sb + 160, 1196, 200, 5); K.lithoFill(ctx, 'shale', 0, sb + 360, 1196, 200, 7);
    line(ctx, 0, sb, 1196, sb, '#8a7457', 3);
    R.semi(ctx, 330, msl, 0.75, t);
    // reference lines
    const ref = (y, label, col, b, tx = 1100, ty = -18) => {
      const a = S.on(b) ? (S.bi === b ? 1 : 0.55) : 0;
      if (a <= 0) return;
      line(ctx, 0, y, 1196, y, rgba(col, 0.8 * a), 2.5, [12, 8]);
      tag(ctx, label, tx, y + ty, { size: 18, color: col, alpha: a, fill: 'rgba(7,17,28,0.85)' });
    };
    ref(rkb, 'RKB (drill floor)', C.amber, 0);
    ref(msl, 'MSL', C.cyan, 1);
    ref(msl + 8, 'LAT', C.purple, 1, 1100, 26);
    if (S.on(0)) dimLine(ctx, 560, rkb, 560, msl, 'RKB elevation ≈ 25 m', { color: C.amber, size: 20, alpha: S.vis(0, 0.6, 1.5) });
    if (S.on(2)) dimLine(ctx, 760, msl, 760, sb, 'water depth 350 m', { color: C.cyan, size: 20, alpha: S.vis(2, 0.6, 0.5) });
    // deviated well
    const pts = pathPts(330, sb, sb + 60, 300, 45, 330);
    const wellA = S.vis(3, 0.6) || (bi >= 3 ? 1 : 0);
    if (bi >= 3) {
      line(ctx, 330, rkb, 330, sb, '#8796a5', 6);
      K.partialPolyline(ctx, pts, 1, '#5e4128', 14);
      K.partialPolyline(ctx, pts, S.p(3, 2, 0.3), C.amber, 6);
      const end = pts[pts.length - 1];
      circle(ctx, end[0], end[1], 9, C.amber);
      if (bi === 3) tag(ctx, 'MD = length along the hole', end[0] - 40, end[1] + 40, { size: 22, color: C.amber, fill: 'rgba(7,17,28,0.9)', align: 'right' });
      if (bi >= 4) {
        line(ctx, end[0], rkb, end[0], end[1], C.green, 3, [10, 6]);
        dimLine(ctx, end[0] + 30, rkb, end[0] + 30, end[1], 'TVD (from RKB)', { color: C.green, size: 20 });
        line(ctx, 330, end[1], end[0], end[1], rgba(C.green, 0.5), 2, [6, 6]);
      }
      if (bi >= 5) dimLine(ctx, end[0] + 150, msl, end[0] + 150, end[1], 'TVDSS (from MSL)', { color: C.cyan, size: 20 });
      if (bi >= 4) {
        fillRR(ctx, 40, 560, 420, 140, 14, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
        text(ctx, '3,250 m MD RKB', 60, 610, { size: 26, weight: 900, color: C.amber, fam: K.MONO });
        text(ctx, '2,710 m TVD RKB', 60, 646, { size: 26, weight: 900, color: C.green, fam: K.MONO });
        if (bi >= 5) text(ctx, '2,685 m TVDSS', 60, 682, { size: 26, weight: 900, color: C.cyan, fam: K.MONO });
      }
    }
  },
};

// ------------------------------------------------------------ trajectory
const trajScene = {
  id: 'trajectory',
  title: 'The well path',
  blurb: 'Inclination, azimuth and the shape of a directional well.',
  beats: [
    {
      term: 'Well path / trajectory', no: 'brønnbane',
      def: 'The planned (and actual) 3D path of the well, shown in a vertical section and a plan view. Most NCS exploration wells are vertical or slightly deviated, but appraisal and development wells can be strongly deviated.',
      say: 'The well path, or trajectory, is the route of the well in three dimensions, shown in a vertical section and a plan view. Exploration wells are often vertical, but many wells are deviated to reach targets far from the rig.',
    },
    {
      term: 'Kick-off point', abbr: 'KOP', no: 'avviksstartpunkt',
      def: 'The depth where the well starts to deviate from vertical, or where a sidetrack leaves the original hole.',
      say: 'The kick off point, KOP, is the depth where the well starts to turn away from vertical.',
    },
    {
      term: 'Inclination', abbr: 'inc', no: 'inklinasjon',
      def: 'The angle of the wellbore from vertical: 0° is vertical, 90° is horizontal.',
      ex: 'We’re holding 32 degrees inclination.',
      say: 'Inclination is the angle of the hole from vertical. Zero degrees is vertical, ninety degrees is horizontal.',
    },
    {
      term: 'Azimuth', abbr: 'azi', no: 'asimut',
      def: 'The compass direction of the wellbore in the horizontal plane, 0–360° from north (grid or true north must be stated).',
      ex: 'Azimuth 118 degrees grid.',
      say: 'Azimuth is the compass direction the hole is heading, from zero to three sixty degrees, measured from north. Always check whether it is grid or true north.',
    },
    {
      term: 'Build, hold & drop', no: 'bygge / holde / slippe',
      def: 'Build: increasing inclination; hold (tangent): constant angle; drop: decreasing inclination. A J-shaped well builds and holds; an S-shaped well builds, holds and drops back.',
      say: 'Directional wells are made of build sections, where inclination increases, hold or tangent sections at constant angle, and drop sections. Build and hold makes a J shape; build, hold and drop makes an S shape.',
    },
    {
      term: 'Dogleg severity', abbr: 'DLS', no: 'krumning',
      def: 'The rate of change of hole direction, in degrees per 30 m. High DLS adds torque and drag, wears casing and pipe, and can cause key seats or fatigue.',
      ex: 'DLS is 4.5 degrees per 30, above plan, so stop sliding.',
      say: 'Dogleg severity, DLS, is how sharply the hole bends, in degrees per thirty metres. Too much dogleg means extra torque, wear, and fatigue on the pipe.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    // vertical section panel
    fillRR(ctx, 40, 60, 640, 820, 16, '#0d1f2f', C.panelEdge, 2);
    text(ctx, 'VERTICAL SECTION', 360, 100, { size: 20, weight: 900, align: 'center', color: C.dim, spacing: 2 });
    for (let y = 140; y < 860; y += 60) line(ctx, 60, y, 660, y, rgba('#fff', 0.05), 1);
    const shapeS = bi === 4 && S.since(4) > 6;
    let pts = pathPts(140, 130, 330, 260, 40, 300);
    if (shapeS) { const last = pts[pts.length - 1]; const inc = (40 * Math.PI) / 180; const drop = []; for (let a = inc; a >= 0; a -= inc / 30) drop.push([last[0] + 260 * (Math.cos(a) - Math.cos(inc)) * -1 + 0, last[1] + 260 * (Math.sin(inc) - Math.sin(a))]); pts = pts.concat(drop.slice(1)).concat([[drop[drop.length - 1][0], 860]]); }
    K.partialPolyline(ctx, pts, S.p(0, 2.5, 0.3), C.amber, 6);
    // KOP
    if (bi >= 1) { circle(ctx, 140, 330, 10, C.red); callout(ctx, 140, 330, 260, 250, 'KOP', { color: C.red, size: 24, t: S.p(1, 0.6, 0.6) }); }
    // inclination arc
    if (bi === 2) {
      const p = pts[45] || pts[pts.length - 2];
      const p2 = pts[46] || pts[pts.length - 1];
      const ang = Math.atan2(p2[0] - p[0], p2[1] - p[1]);
      line(ctx, p[0], p[1], p[0], p[1] + 140, rgba('#fff', 0.6), 2, [8, 6]);
      line(ctx, p[0], p[1], p[0] + Math.sin(ang) * 140, p[1] + Math.cos(ang) * 140, C.cyan, 4);
      ctx.beginPath(); ctx.arc(p[0], p[1], 90, Math.PI / 2 - ang, Math.PI / 2); ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, `${Math.round((ang * 180) / Math.PI)}°`, p[0] + 40, p[1] + 120, { size: 30, weight: 900, color: C.cyan });
    }
    if (bi === 4) {
      const segs = [['VERTICAL', 140, 230], ['BUILD', 230, 430], ['HOLD (tangent)', 520, 650]];
      tag(ctx, 'BUILD', 300, 470, { size: 22, color: C.amber, fill: 'rgba(7,17,28,0.9)' });
      tag(ctx, 'HOLD', 470, 700, { size: 22, color: C.green, fill: 'rgba(7,17,28,0.9)' });
      if (shapeS) tag(ctx, 'DROP → S-shape', 520, 820, { size: 22, color: C.purple, fill: 'rgba(7,17,28,0.9)' });
      else tag(ctx, 'J-shape', 560, 820, { size: 22, color: C.text, fill: 'rgba(7,17,28,0.9)' });
    }
    if (bi === 5) {
      const c1 = [140 + 260, 330];
      ctx.save(); ctx.setLineDash([6, 6]); circle(ctx, c1[0], c1[1], 260, null, rgba(C.cyan, 0.5), 2); ctx.restore();
      tag(ctx, 'radius ↔ DLS', 420, 240, { size: 20, color: C.cyan });
      fillRR(ctx, 720, 520, 440, 300, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'DLS = Δangle per 30 m', 940, 580, { size: 26, weight: 900, align: 'center', color: C.text });
      text(ctx, 'R = 1,719 ÷ DLS  (m, °/30 m)', 940, 630, { size: 22, weight: 700, align: 'center', color: C.dim, fam: K.MONO });
      text(ctx, '3°/30 m → R ≈ 573 m', 940, 690, { size: 26, weight: 900, align: 'center', color: C.amber, fam: K.MONO });
    }
    // plan view / compass
    fillRR(ctx, 720, 60, 440, 420, 16, '#0d1f2f', C.panelEdge, 2);
    text(ctx, bi === 3 ? 'PLAN VIEW · AZIMUTH' : 'PLAN VIEW', 940, 100, { size: 20, weight: 900, align: 'center', color: C.dim, spacing: 2 });
    const cx = 940, cy = 290;
    circle(ctx, cx, cy, 150, null, rgba('#fff', 0.15), 2);
    ['N', 'E', 'S', 'W'].forEach((d, i) => { const a = (i * Math.PI) / 2 - Math.PI / 2; text(ctx, d, cx + Math.cos(a) * 172, cy + Math.sin(a) * 172 + 8, { size: 22, weight: 900, align: 'center', color: d === 'N' ? C.red : C.dim }); });
    const az = (118 * Math.PI) / 180;
    const pl = S.p(0, 2.5, 0.3);
    line(ctx, cx, cy, cx + Math.sin(az) * 140 * pl, cy - Math.cos(az) * 140 * pl, C.amber, 6);
    circle(ctx, cx, cy, 8, C.amber);
    if (bi === 3) {
      ctx.beginPath(); ctx.arc(cx, cy, 70, -Math.PI / 2, -Math.PI / 2 + az); ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, '118°', cx + 70, cy - 40, { size: 30, weight: 900, color: C.cyan });
    }
  },
};

// ------------------------------------------------------------ surveying
const surveyScene = {
  id: 'surveying',
  title: 'Surveys, toolface and anti-collision',
  blurb: 'Knowing where the bit really is, and where it is pointing.',
  beats: [
    {
      term: 'Survey', no: 'retningsmåling',
      def: 'A measurement of inclination and azimuth at a known depth, usually taken by the MWD at each connection (every ~30 m). Surveys are combined, e.g. with the minimum curvature method, to calculate the well’s position.',
      ex: 'Survey at 2,345 metres: inc 31.8, azi 117.4.',
      say: 'A survey is a measurement of inclination and azimuth at a known depth, usually taken by the MWD at every connection. Joining the survey stations together gives the position of the well.',
    },
    {
      term: 'Gyro survey', no: 'gyromåling',
      def: 'A survey made with a gyroscope instead of magnetometers, used close to casing and other wells where magnetic interference makes MWD azimuth unreliable, or for definitive surveys.',
      say: 'Near casing and other steel, magnetic surveys become unreliable, so a gyro survey, using a gyroscope, is used instead.',
    },
    {
      term: 'Toolface', abbr: 'TF', no: 'verktøyorientering',
      def: 'The direction the steering tool (bent motor or RSS) is set to push or point, relative to the high side of the hole (gravity toolface) or to north (magnetic toolface). E.g. “30 right”.',
      ex: 'Set toolface 30 right of high side.',
      say: 'Toolface is the direction the steering tool is pointing around the hole, measured from the high side, like a clock face. Thirty right means turning right while building angle.',
    },
    {
      term: 'Anti-collision & separation factor', abbr: 'SF', no: 'antikollisjon',
      def: 'Planning and monitoring to make sure the well never hits another wellbore. Each survey position has an ellipse of uncertainty; the separation factor compares the distance between wells with their combined uncertainty.',
      ex: 'Separation factor drops below 1.5 at 900 metres, so we need a gyro there.',
      say: 'Anti collision makes sure the well never hits another wellbore. Every survey position has an ellipse of uncertainty that grows with depth. The separation factor compares the distance between two wells with their combined uncertainty.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi <= 1) {
      fillRR(ctx, 40, 60, 700, 820, 16, '#0d1f2f', C.panelEdge, 2);
      const pts = pathPts(160, 100, 260, 360, 50, 420);
      K.partialPolyline(ctx, pts, 1, rgba(C.amber, 0.5), 4);
      const L = K.polylineLength(pts);
      const n = Math.floor(S.p(0, 6, 0.5) * 16) + (bi === 1 ? 16 : 0);
      for (let k = 1; k <= Math.min(16, n); k++) {
        const [x, y] = K.pointAt(pts, (k / 16) * L);
        circle(ctx, x, y, 7, C.cyan, '#0b1520', 2);
        if (bi === 1 && k <= 3) circle(ctx, x, y, 14, null, C.purple, 3);
      }
      fillRR(ctx, 780, 140, 380, 320, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      text(ctx, 'SURVEY STATION', 970, 190, { size: 20, weight: 900, align: 'center', color: C.amber, spacing: 1 });
      [['MD', '2,345 m'], ['Inc', '31.8°'], ['Azi', '117.4°']].forEach(([k, v], i) => { text(ctx, k, 810, 250 + i * 60, { size: 26, weight: 700, color: C.dim }); text(ctx, v, 1130, 250 + i * 60, { size: 30, weight: 900, align: 'right', color: C.text, fam: K.MONO }); });
      if (bi === 1) {
        fillRR(ctx, 780, 520, 380, 300, 16, 'rgba(7,17,28,0.92)', C.purple, 2);
        // gyro icon
        const gx = 970, gy = 650;
        circle(ctx, gx, gy, 70, null, C.purple, 4);
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(t * 3);
        ctx.beginPath(); ctx.ellipse(0, 0, 70, 22, 0, 0, Math.PI * 2); ctx.strokeStyle = C.cyan; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
        circle(ctx, gx, gy, 12, C.amber);
        text(ctx, 'GYRO near casing / other wells', 970, 790, { size: 20, weight: 800, align: 'center', color: C.text });
      }
    }
    if (bi === 2) {
      const cx = 400, cy = 470;
      circle(ctx, cx, cy, 300, '#5e4128', C.rock3, 16);
      circle(ctx, cx, cy, 120, '#97a8b8', '#56687a', 4);
      text(ctx, 'HIGH SIDE', cx, cy - 330, { size: 22, weight: 900, align: 'center', color: C.amber });
      for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2 - Math.PI / 2; line(ctx, cx + Math.cos(a) * 250, cy + Math.sin(a) * 250, cx + Math.cos(a) * 285, cy + Math.sin(a) * 285, C.dim, 3); }
      const tf = (30 * Math.PI) / 180 + Math.sin(t * 0.6) * 0.05;
      const a = -Math.PI / 2 + tf;
      arrow(ctx, cx, cy, cx + Math.cos(a) * 240, cy + Math.sin(a) * 240, { color: C.cyan, lw: 8, head: 26 });
      ctx.beginPath(); ctx.arc(cx, cy, 160, -Math.PI / 2, a); ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.stroke();
      text(ctx, 'TF 30R', cx + 90, cy - 190, { size: 30, weight: 900, color: C.cyan });
      fillRR(ctx, 780, 300, 380, 300, 16, 'rgba(7,17,28,0.92)', C.panelEdge, 2);
      ['0 = high side → build', '90R → turn right', '180 → drop', '90L → turn left'].forEach((s2, i) => text(ctx, s2, 810, 360 + i * 56, { size: 24, weight: 700, color: C.text, alpha: S.p(2, 0.4, 1 + i * 0.6) }));
    }
    if (bi === 3) {
      fillRR(ctx, 40, 60, 1120, 820, 16, '#0d1f2f', C.panelEdge, 2);
      const A = pathPts(380, 100, 300, 500, 30, 400);
      const B = pathPts(620, 100, 200, 420, 25, 450).map(([x, y]) => [x - (y - 100) * 0.35, y]);
      const drawEll = (pts, col, grow) => {
        const L = K.polylineLength(pts);
        for (let k = 1; k <= 12; k++) { const [x, y] = K.pointAt(pts, (k / 12) * L); ctx.beginPath(); ctx.ellipse(x, y, 6 + k * grow, 4 + k * grow * 0.6, 0, 0, Math.PI * 2); ctx.strokeStyle = rgba(col, 0.6); ctx.lineWidth = 2; ctx.stroke(); }
        K.partialPolyline(ctx, pts, 1, col, 5);
      };
      drawEll(B, C.steel, 2.6);
      drawEll(A, C.amber, 3.0);
      text(ctx, 'new well', 520, 860, { size: 22, weight: 800, color: C.amber });
      text(ctx, 'existing well', 90, 860, { size: 22, weight: 800, color: C.steel });
      tag(ctx, 'ellipses of uncertainty grow with depth', 820, 140, { size: 22, color: C.text, alpha: S.p(3, 0.6, 2) });
      const sf = 2.4 - S.p(3, 6, 3) * 1.1;
      fillRR(ctx, 800, 600, 320, 200, 16, 'rgba(7,17,28,0.92)', sf < 1.5 ? C.red : C.green, 3);
      text(ctx, 'SF = ' + sf.toFixed(2), 960, 690, { size: 44, weight: 900, align: 'center', color: sf < 1.5 ? C.red : C.green, fam: K.MONO });
      text(ctx, sf < 1.5 ? 'too close! act' : 'OK', 960, 740, { size: 22, weight: 800, align: 'center', color: C.text });
    }
  },
};

// ------------------------------------------------------------ steering to the target
const steerScene = {
  id: 'targets',
  title: 'Targets, geosteering and sidetracks',
  blurb: 'Hitting the target, staying in the reservoir, and drilling around trouble.',
  beats: [
    {
      term: 'Target & tolerance', no: 'mål / toleranse',
      def: 'The geological target the well must hit, defined by coordinates and depth, with a tolerance (e.g. a 50 m radius circle or a box). Exploration targets are set by the geologists to test the prospect where it is best.',
      ex: 'We’re 12 metres inside the target circle.',
      say: 'Every well has a target: a point at depth, with a tolerance, for example a fifty metre circle. The geologists place it where the prospect can be tested best.',
    },
    {
      term: 'Geosteering', no: 'geostyring',
      def: 'Adjusting the well path in real time, using LWD measurements (gamma, resistivity, imaging) to keep the bit in the best part of the reservoir, mostly in horizontal development wells.',
      say: 'Geosteering means adjusting the well path in real time, using the LWD logs, to keep the bit inside the best part of the reservoir. It is mostly used in horizontal wells.',
    },
    {
      term: 'Horizontal & extended reach', abbr: 'ERD', no: 'horisontal / langtrekkende',
      def: 'Horizontal wells run along the reservoir at ~90° inclination. Extended reach drilling (ERD) reaches far from the rig horizontally, many kilometres on some NCS fields, challenging torque, drag and hole cleaning.',
      say: 'A horizontal well runs along the reservoir at about ninety degrees. Extended reach drilling, ERD, reaches many kilometres away from the rig, which pushes torque, drag and hole cleaning to the limit.',
    },
    {
      term: 'Sidetrack & whipstock', no: 'sidesteg / whipstock',
      def: 'A new hole drilled out of the existing well: from a cement plug in open hole, or through a window milled in the casing using a whipstock (a steel wedge). Used to reach a new target (A, B) or bypass a problem like stuck pipe (T2).',
      ex: 'We’ll set a whipstock and mill a window in the 9⅝.',
      say: 'A sidetrack is a new hole drilled out of the existing well. In open hole it kicks off from a cement plug. In casing, a steel wedge called a whipstock guides a mill to cut a window. Remember the well names: A for a new target, T two for a technical sidetrack.',
    },
  ],
  draw(ctx, S) {
    const t = S.t;
    const bi = Math.max(0, S.bi);
    if (bi === 0) {
      fillRR(ctx, 40, 60, 1120, 820, 16, '#0d1f2f', C.panelEdge, 2);
      const tx = 820, ty = 680;
      for (let k = 3; k >= 1; k--) circle(ctx, tx, ty, k * 40, null, rgba(C.green, 0.25 + 0.2 * (k === 1)), 3);
      circle(ctx, tx, ty, 120, rgba(C.green, 0.08), C.green, 3);
      text(ctx, 'target circle (r = 50 m)', tx, ty + 160, { size: 22, weight: 800, align: 'center', color: C.green });
      const pts = pathPts(260, 100, 260, 520, 45, 250).map(([x, y]) => [x, y]);
      K.partialPolyline(ctx, pts, S.p(0, 4, 0.5), C.amber, 6);
      const end = K.pointAt(pts, K.polylineLength(pts) * S.p(0, 4, 0.5));
      ST.pdcSide(ctx, end[0], end[1], 0.35, t * 5);
    }
    if (bi === 1) {
      fillRR(ctx, 40, 60, 1120, 820, 16, '#0d1f2f', C.panelEdge, 2);
      // undulating reservoir band
      const top = (x) => 420 + Math.sin(x / 140) * 50 + (x - 600) * 0.05;
      const bot = (x) => top(x) + 110;
      ctx.beginPath(); for (let x = 60; x <= 1140; x += 10) ctx.lineTo(x, top(x)); for (let x = 1140; x >= 60; x -= 10) ctx.lineTo(x, bot(x)); ctx.closePath();
      ctx.save(); ctx.clip(); K.lithoFill(ctx, 'sand', 60, 200, 1080, 500, 4); ctx.fillStyle = rgba(C.oil, 0.35); ctx.fillRect(60, 200, 1080, 500); ctx.restore();
      const p = S.p(1, 8, 0.5, ease.linear);
      const pts = [];
      for (let x = 80; x <= 80 + 1040 * p; x += 10) pts.push([x, (top(x) + bot(x)) / 2 + Math.sin(x / 60) * 6]);
      K.partialPolyline(ctx, pts, 1, C.amber, 6);
      if (pts.length) { const e = pts[pts.length - 1]; circle(ctx, e[0], e[1], 10, C.amber); }
      text(ctx, 'reservoir', 110, 420, { size: 22, weight: 800, color: C.sand });
      tag(ctx, 'LWD: resistivity & gamma keep the bit in the sweet spot', 600, 780, { size: 22, color: C.cyan, alpha: S.p(1, 0.6, 2) });
    }
    if (bi === 2) {
      fillRR(ctx, 40, 60, 1120, 820, 16, '#0d1f2f', C.panelEdge, 2);
      R.platform(ctx, 160, 180, 880, 0.45, t);
      const pts = pathPts(160, 200, 280, 380, 85, 760);
      K.partialPolyline(ctx, pts, S.p(2, 4, 0.5), C.amber, 6);
      dimLine(ctx, 160, 820, 1100, 820, 'horizontal reach: many km', { color: C.cyan, size: 22, alpha: S.p(2, 0.6, 4) });
      tag(ctx, 'torque · drag · hole cleaning', 760, 340, { size: 22, color: C.red, alpha: S.p(2, 0.6, 6) });
    }
    if (bi === 3) {
      K.lithoFill(ctx, 'rock3', 0, 0, 1196, 940, 6);
      // main bore with casing, cement plug, and window
      ctx.fillStyle = '#5e4128'; ctx.fillRect(560, 0, 80, 900);
      ST.metal(ctx, 548, 0, 12, 600, '#b8c4cf'); ST.metal(ctx, 640, 0, 12, 600, '#b8c4cf');
      // stuck fish below
      ST.metal(ctx, 590, 700, 20, 200, '#7d8a96');
      I.xmark(ctx, 600, 690, 40, C.red);
      // whipstock
      poly(ctx, [[560, 600], [640, 520], [640, 640], [560, 640]]); ctx.fillStyle = '#c9a14f'; ctx.fill();
      // sidetrack bore
      const p = S.p(3, 5, 1.5);
      const st = [[640, 540], [700, 600], [760, 700], [800, 820], [820, 900]];
      K.partialPolyline(ctx, st, p, '#5e4128', 70);
      if (p > 0.05) { const e = K.pointAt(st, K.polylineLength(st) * p); ST.pdcSide(ctx, e[0], e[1], 0.4, t * 5); }
      callout(ctx, 600, 590, 260, 520, 'WHIPSTOCK', { color: C.amber, size: 24, t: S.p(3, 0.6, 0.8) });
      callout(ctx, 640, 545, 900, 420, 'casing window', { color: C.cyan, size: 22, t: S.p(3, 0.6, 2) });
      callout(ctx, 600, 690, 260, 760, 'fish left behind', { color: C.red, size: 22, t: S.p(3, 0.6, 3) });
      tag(ctx, 'T2 = technical sidetrack', 900, 840, { size: 22, color: C.red, alpha: S.p(3, 0.6, 6), fill: 'rgba(7,17,28,0.9)' });
    }
  },
};

module.exports = {
  id: 'ch11', num: 11, title: 'Depths & Directional Drilling',
  subtitle: 'MD, TVD and steering the well to its target',
  topics: ['RKB', 'MSL / LAT', 'Water depth', 'MD', 'TVD', 'TVDSS', 'Trajectory', 'KOP', 'Inclination', 'Azimuth', 'Build & hold', 'DLS', 'Survey', 'Gyro', 'Toolface', 'Anti-collision', 'Geosteering', 'Sidetrack'],
  intro: 'Chapter eleven: depths and directional drilling. Every number you read in a report has a depth reference, and many wells are steered to their targets.',
  art: (ctx, t) => {
    ctx.save(); ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = '#0d1f2f'; ctx.fillRect(0, 0, 700, 900);
    const pts = pathPts(200, 120, 300, 300, 55, 400);
    K.partialPolyline(ctx, pts, 0.3 + 0.7 * ((t * 0.15) % 1), C.amber, 8);
    ctx.restore();
    ctx.strokeStyle = rgba(C.amber, 0.8); ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(330, 420, 330, 0, Math.PI * 2); ctx.stroke();
  },
  scenes: [datumScene, trajScene, surveyScene, steerScene],
};
