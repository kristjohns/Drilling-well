// Stylised map of Norway and the Norwegian Continental Shelf (approximate coastlines).
'use strict';
const K = require('../engine/core');
const { C, rgba, text, circle, poly, lerp } = K;

// [lon, lat] outlines (simplified, for illustration only)
const NORWAY = [
  [11.43, 59.10], [11.0, 59.15], [10.75, 59.45], [10.72, 59.88], [10.45, 59.55], [10.25, 59.05], [9.75, 58.98], [9.2, 58.72],
  [8.75, 58.45], [8.0, 58.13], [7.05, 57.98], [6.6, 58.08], [6.0, 58.3], [5.6, 58.62], [5.55, 58.9], [5.85, 59.05], [5.2, 59.25],
  [5.25, 59.6], [5.05, 59.9], [5.15, 60.2], [4.95, 60.55], [4.95, 60.9], [4.95, 61.2], [5.0, 61.6], [5.15, 61.95], [5.1, 62.2],
  [5.75, 62.35], [6.15, 62.47], [6.7, 62.75], [7.2, 62.92], [7.73, 63.11], [8.3, 63.42], [8.7, 63.62], [9.6, 63.82], [10.2, 64.15],
  [10.8, 64.55], [11.24, 64.86], [11.8, 65.15], [12.21, 65.47], [12.6, 66.0], [13.1, 66.5], [13.7, 67.0], [14.4, 67.28],
  [14.9, 67.62], [14.2, 67.72], [13.6, 67.75], [12.95, 67.85], [13.6, 68.05], [14.6, 68.3], [15.3, 68.55], [15.8, 68.95],
  [16.1, 69.3], [17.0, 69.55], [17.9, 69.75], [18.96, 69.68], [19.8, 70.05], [21.0, 70.25], [22.0, 70.45], [23.68, 70.66],
  [24.5, 71.0], [25.78, 71.17], [26.8, 70.98], [27.65, 71.12], [28.5, 70.88], [29.7, 70.62], [31.1, 70.37], [30.4, 70.1],
  [29.4, 70.05], [29.0, 69.85], [30.05, 69.73], [30.85, 69.78],
  // land border east -> south
  [29.2, 69.4], [28.93, 69.05], [27.9, 70.05], [27.0, 69.92], [25.8, 69.55], [24.8, 68.95], [23.3, 68.75], [21.6, 69.25],
  [20.55, 69.06], [19.6, 68.6], [18.1, 68.45], [17.9, 67.95], [16.5, 67.45], [15.5, 66.5], [14.6, 66.05], [14.0, 65.0],
  [13.7, 64.5], [14.1, 64.0], [12.6, 63.6], [12.15, 63.0], [12.25, 62.3], [12.6, 61.5], [12.85, 61.0], [12.5, 60.3],
  [11.8, 59.8], [11.43, 59.10],
];
const EAST_LAND = [
  [11.43, 59.10], [11.2, 58.4], [11.9, 57.7], [12.6, 56.6], [12.9, 55.6], [14.3, 55.35], [40, 54.5], [40, 69.0], [36.0, 69.1],
  [33.0, 69.4], [31.5, 69.75], [30.85, 69.78],
];
const BALTIC = [
  [14.3, 55.35], [16.4, 56.2], [16.6, 57.5], [18.0, 59.3], [17.2, 60.7], [17.5, 61.7], [17.7, 62.5], [19.5, 63.6], [21.0, 64.6],
  [22.2, 65.6], [24.2, 65.8], [25.4, 65.0], [23.0, 63.8], [21.5, 63.0], [21.4, 61.5], [22.5, 60.4], [25.0, 60.2], [28.5, 60.6],
  [30.3, 59.95], [28.0, 59.4], [24.0, 59.3], [23.4, 58.5], [21.6, 57.6], [21.0, 56.5], [21.1, 55.7], [19.5, 54.3], [14.0, 54.0],
];
const WHITE_SEA_KOLA = [ // carve the Kola peninsula north coast area as sea above it
  [31.5, 69.75], [33.0, 69.4], [36.0, 69.1], [40, 68.6], [40, 75], [31.5, 75],
];
const DENMARK = [
  [8.1, 55.5], [8.15, 56.6], [8.6, 57.1], [9.9, 57.6], [10.6, 57.75], [10.5, 57.2], [10.3, 56.7], [10.9, 56.4], [10.2, 55.8],
  [9.6, 55.5], [9.5, 54.8], [8.6, 54.8],
];
const ZEALAND = [[11.0, 55.4], [11.0, 56.0], [11.9, 56.1], [12.6, 56.0], [12.5, 55.3], [11.8, 55.1]];
const SCOTLAND = [
  [-5.0, 58.62], [-3.0, 58.65], [-3.1, 58.3], [-4.0, 57.9], [-3.6, 57.65], [-1.8, 57.6], [-2.1, 57.15], [-2.5, 56.55],
  [-3.0, 56.05], [-2.0, 55.85], [-1.6, 55.4], [-1.4, 54.8], [-6.5, 54.8], [-5.6, 55.4], [-5.8, 56.5], [-5.7, 57.5],
];
const SHETLAND = [[-1.35, 59.85], [-1.1, 60.2], [-1.05, 60.5], [-0.8, 60.8], [-1.0, 60.85], [-1.45, 60.5], [-1.6, 60.2]];
const ORKNEY = [[-3.35, 58.85], [-2.75, 58.85], [-2.7, 59.2], [-3.2, 59.25]];
const BEAR_ISLAND = [[18.8, 74.35], [19.3, 74.35], [19.3, 74.52], [18.8, 74.5]];
const SVALBARD = [[10.5, 76.6], [16.5, 76.4], [22.0, 77.5], [28.0, 78.9], [27.0, 80.2], [18.0, 80.4], [11.0, 79.8]];

// approximate sea areas for highlighting (NCS portions)
const AREAS = {
  north: [[2.0, 56.1], [3.3, 56.1], [5.0, 57.2], [7.0, 57.8], [7.0, 57.98], [5.5, 58.6], [4.9, 60.5], [4.9, 62.0], [1.0, 62.0], [1.6, 60.5], [1.8, 58.0], [2.3, 57.2]],
  norwegian: [[1.0, 62.0], [5.0, 62.0], [6.5, 62.9], [8.5, 63.6], [11.0, 64.8], [13.0, 66.6], [14.8, 67.7], [15.8, 69.0], [16.5, 69.6], [14.0, 70.2], [8.0, 70.0], [2.0, 69.0], [-1.5, 67.0], [-0.5, 64.0]],
  barents: [[16.5, 69.6], [18.96, 69.85], [23.68, 70.85], [27.6, 71.3], [31.1, 70.5], [32.0, 70.5], [37.5, 73.5], [33.0, 74.6], [25.0, 74.6], [18.0, 74.4], [14.0, 72.0]],
};

const PLACES = {
  Stavanger: [5.73, 58.97], Bergen: [5.32, 60.39], Kristiansund: [7.73, 63.11], 'Brønnøysund': [12.21, 65.47],
  'Sandnessjøen': [12.63, 66.02], Hammerfest: [23.68, 70.66], Oslo: [10.75, 59.91], Trondheim: [10.4, 63.43], 'Tromsø': [18.96, 69.65],
  Florø: [5.03, 61.6],
};
const FIELDS = {
  Ekofisk: [3.21, 56.54], Troll: [3.72, 60.64], 'Johan Sverdrup': [2.6, 58.8], Gullfaks: [2.27, 61.2], 'Åsgard': [7.0, 65.06],
  Heidrun: [7.32, 65.32], 'Aasta Hansteen': [6.8, 67.07], 'Snøhvit': [21.3, 71.6], Goliat: [22.25, 71.3], 'Johan Castberg': [20.35, 72.49],
};

function makeProj(cx, cy, ky, lon0 = 15, lat0 = 65.5) {
  return (lon, lat) => {
    const x = cx + (lon - lon0) * Math.cos((lat * Math.PI) / 180) * ky;
    const y = cy - (lat - lat0) * ky;
    return [x, y];
  };
}

function path(ctx, P, pts) {
  ctx.beginPath();
  pts.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
  ctx.closePath();
}

function drawMap(ctx, P, opt = {}) {
  const { w = 1200, h = 940, graticule = true, norwayColor = '#3f6b4c', landColor = '#34424d', seaColor = '#0c3352', alpha = 1, t = 0 } = opt;
  ctx.save();
  ctx.globalAlpha *= alpha;
  // sea
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#0b2b45'); g.addColorStop(1, seaColor);
  ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  if (graticule) {
    ctx.strokeStyle = rgba('#7fb3d5', 0.10); ctx.lineWidth = 1;
    for (let la = 54; la <= 80; la += 2) {
      ctx.beginPath();
      for (let lo = -10; lo <= 42; lo += 1) { const [x, y] = P(lo, la); lo === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
    for (let lo = -10; lo <= 42; lo += 4) {
      ctx.beginPath();
      for (let la = 54; la <= 80; la += 0.5) { const [x, y] = P(lo, la); la === 54 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
      ctx.stroke();
    }
  }
  // land
  ctx.fillStyle = landColor;
  for (const L of [EAST_LAND, DENMARK, ZEALAND, SCOTLAND, SHETLAND, ORKNEY, BEAR_ISLAND, SVALBARD]) { path(ctx, P, L); ctx.fill(); }
  // carve seas
  ctx.fillStyle = seaColor;
  for (const L of [BALTIC]) { path(ctx, P, L); ctx.fill(); }
  // Norway
  path(ctx, P, NORWAY);
  ctx.fillStyle = norwayColor; ctx.fill();
  ctx.strokeStyle = rgba('#9fd3a8', 0.55); ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

function drawArea(ctx, P, key, color, alpha = 0.35, t = 0) {
  if (alpha <= 0) return;
  ctx.save();
  path(ctx, P, AREAS[key]);
  ctx.globalAlpha *= alpha;
  ctx.fillStyle = color; ctx.fill();
  ctx.globalAlpha = Math.min(1, ctx.globalAlpha * 2.2);
  ctx.setLineDash([10, 8]); ctx.lineDashOffset = -t * 20;
  ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
}

function place(ctx, P, name, opt = {}) {
  const { color = '#ffffff', size = 18, dx = 10, dy = name === 'Goliat' ? 18 : name === 'Snøhvit' ? -2 : 6, align = 'left', alpha = 1, r = 5, label = name, weight = 600 } = opt;
  const ll = PLACES[name] || FIELDS[name] || opt.ll;
  const [x, y] = P(ll[0], ll[1]);
  ctx.save(); ctx.globalAlpha *= alpha;
  circle(ctx, x, y, r, color, '#0a1622', 2);
  text(ctx, label, x + (align === 'left' ? dx : -dx), y + dy, { size, weight, color, align, shadow: '#000000' });
  ctx.restore();
  return [x, y];
}

module.exports = { makeProj, drawMap, drawArea, place, path, PLACES, FIELDS, NORWAY, AREAS };
