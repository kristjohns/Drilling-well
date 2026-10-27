// Frame chrome: top bar, term panel, chapter title cards and the per-frame composer.
'use strict';
const K = require('./core');
const { C, LAYOUT, W, H, FONT, MONO, clamp, lerp, ease, rgba, fillRR, rr, text, wrap, para, flagNO, tag, line } = K;

const FADE = 0.45;

function drawBackground(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#081422');
  g.addColorStop(1, '#050d16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

function drawTopBar(ctx, G, scene, chapter) {
  // progress bar across the top
  const p = clamp(G.gt / G.total);
  ctx.fillStyle = '#10243a';
  ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = C.amber;
  ctx.fillRect(0, 0, W * p, 6);
  for (const ch of G.chapters) {
    const x = (ch.start / G.total) * W;
    ctx.fillStyle = C.bg; ctx.fillRect(x - 1, 0, 3, 6);
  }
  // chapter badge
  const num = String(chapter.num).padStart(2, '0');
  fillRR(ctx, 40, 22, 56, 50, 10, C.amber);
  text(ctx, num, 68, 57, { size: 28, weight: 800, align: 'center', color: '#1a1206', fam: FONT });
  text(ctx, chapter.title.toUpperCase(), 114, 44, { size: 25, weight: 800, color: C.text, spacing: 1.2 });
  if (scene.title) text(ctx, scene.title, 114, 72, { size: 20, weight: 500, color: C.dim });
  text(ctx, 'D&W LINGO  ·  NCS EXPLORATION DRILLING', W - 40, 44, { size: 17, weight: 700, color: C.faint, align: 'right', spacing: 1.5 });
  const mm = Math.floor(G.gt / 60), ss = Math.floor(G.gt % 60);
  const tm = Math.floor(G.total / 60), ts = Math.floor(G.total % 60);
  text(ctx, `${mm}:${String(ss).padStart(2, '0')} / ${tm}:${String(ts).padStart(2, '0')}`, W - 40, 72, { size: 17, weight: 600, color: C.faint, align: 'right', fam: MONO });
}

// ---------- term card ----------
function layoutCard(ctx, beat, P) {
  // returns list of draw ops with heights so we can measure before drawing
  const x0 = P.x + 34, w = P.w - 68;
  const ops = [];
  let y = P.y + 50;
  ops.push({ k: 'kicker', y });
  y += 30;
  const titleSize = beat.term.length > 26 ? 42 : 48;
  const tl = wrap(ctx, beat.term, w, titleSize, 800);
  ops.push({ k: 'title', y: y + titleSize * 0.95, lines: tl, size: titleSize });
  y += tl.length * titleSize * 1.12 + 10;
  if (beat.abbr) { ops.push({ k: 'abbr', y: y + 22 }); y += 56; }
  if (beat.no) { ops.push({ k: 'no', y: y + 18 }); y += 48; }
  y += 8;
  ops.push({ k: 'div', y }); y += 26;
  const defSize = beat.def && beat.def.length > 210 ? 26 : 28;
  const dl = wrap(ctx, beat.def || '', w, defSize, 400);
  ops.push({ k: 'def', y: y + defSize, lines: dl, size: defSize });
  y += dl.length * defSize * 1.4 + 6;
  if (beat.ex) {
    y += 16;
    ops.push({ k: 'exlabel', y: y + 14 }); y += 30;
    const el = wrap(ctx, '“' + beat.ex + '”', w - 22, 24, 500);
    ops.push({ k: 'ex', y: y + 24, lines: el });
    y += el.length * 24 * 1.38 + 6;
  }
  return { ops, bottom: y, x0, w };
}

function drawCard(ctx, beat, P, alpha, dy, G) {
  if (!beat || !beat.term || alpha <= 0) return 0;
  const L = layoutCard(ctx, beat, P);
  ctx.save();
  ctx.globalAlpha *= alpha;
  ctx.translate(0, dy);
  const { x0, w } = L;
  for (const op of L.ops) {
    switch (op.k) {
      case 'kicker': {
        const label = beat.termIndex ? `TERM ${beat.termIndex} / ${G.termTotal}` : 'TERM';
        text(ctx, label, x0, op.y, { size: 17, weight: 800, color: C.amber, spacing: 2 });
        break;
      }
      case 'title':
        op.lines.forEach((l, i) => text(ctx, l, x0, op.y + i * op.size * 1.12, { size: op.size, weight: 800, color: C.white }));
        break;
      case 'abbr': {
        let ax = x0;
        for (const a of String(beat.abbr).split('|')) {
          ax += tag(ctx, a.trim(), ax, op.y, { size: 24, weight: 700, fam: MONO, align: 'left', color: C.amber }) + 10;
        }
        break;
      }
      case 'no': {
        flagNO(ctx, x0, op.y - 13, 34);
        let ns = 26;
        while (ns > 17 && K.measure(ctx, beat.no, ns, 600) > w - 50) ns -= 1;
        text(ctx, beat.no, x0 + 48, op.y + 8, { size: ns, weight: 600, color: '#9cc9ff' });
        break;
      }
      case 'div':
        line(ctx, x0, op.y, x0 + w, op.y, C.line, 2);
        break;
      case 'def':
        op.lines.forEach((l, i) => text(ctx, l, x0, op.y + i * op.size * 1.4, { size: op.size, weight: 400, color: '#dce6f0' }));
        break;
      case 'exlabel':
        text(ctx, 'YOU MIGHT HEAR', x0, op.y, { size: 15, weight: 800, color: C.cyan, spacing: 2 });
        break;
      case 'ex':
        ctx.fillStyle = rgba(C.cyan, 0.7);
        ctx.fillRect(x0, op.y - 22, 4, op.lines.length * 24 * 1.38);
        op.lines.forEach((l, i) => text(ctx, l, x0 + 18, op.y + i * 24 * 1.38, { size: 24, weight: 500, color: '#bfeaff' }));
        break;
    }
  }
  ctx.restore();
  return L.bottom;
}

function drawSceneCard(ctx, scene, P, alpha) {
  // shown in the panel when a beat has no term
  if (alpha <= 0) return 0;
  const x0 = P.x + 34, w = P.w - 68;
  ctx.save(); ctx.globalAlpha *= alpha;
  text(ctx, 'OVERVIEW', x0, P.y + 50, { size: 17, weight: 800, color: C.amber, spacing: 2 });
  const tl = wrap(ctx, scene.title || '', w, 46, 800);
  tl.forEach((l, i) => text(ctx, l, x0, P.y + 124 + i * 52, { size: 46, weight: 800, color: C.white }));
  let y = P.y + 124 + tl.length * 52;
  if (scene.blurb) {
    line(ctx, x0, y, x0 + w, y, C.line, 2);
    y += 48;
    y += para(ctx, scene.blurb, x0, y, w, { size: 28, color: '#dce6f0', lh: 1.4 });
  }
  ctx.restore();
  return y;
}

function drawSceneList(ctx, scene, S, P, minY) {
  const items = scene.beats.map((b, i) => ({ b, i })).filter((o) => o.b.term);
  if (items.length < 2) return;
  const rowH = 34;
  let n = items.length;
  const avail = P.y + P.h - 30 - (minY + 40);
  const maxRows = Math.floor((avail - 40) / rowH);
  if (maxRows < 3) return;
  // window the list around the current item if it doesn't fit
  let startIdx = 0;
  if (n > maxRows) {
    const curPos = Math.max(0, items.findIndex((o) => o.i >= S.bi));
    startIdx = clamp(curPos - Math.floor(maxRows / 2), 0, n - maxRows);
    n = maxRows;
  }
  const x0 = P.x + 34;
  let y = P.y + P.h - 30 - n * rowH;
  line(ctx, x0, y - 26, P.x + P.w - 34, y - 26, C.line, 1.5);
  text(ctx, 'IN THIS SCENE', x0, y - 2, { size: 14, weight: 800, color: C.faint, spacing: 2 });
  y += 14;
  for (let k = 0; k < n; k++) {
    const { b, i } = items[startIdx + k];
    const done = i < S.bi, cur = i === S.bi;
    const cy = y + k * rowH + 10;
    if (cur) {
      K.circle(ctx, x0 + 8, cy - 7, 7, C.amber);
    } else if (done) {
      ctx.save(); ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0 + 2, cy - 7); ctx.lineTo(x0 + 7, cy - 2); ctx.lineTo(x0 + 15, cy - 12); ctx.stroke(); ctx.restore();
    } else K.circle(ctx, x0 + 8, cy - 7, 6, null, C.faint, 2);
    const ab = b.abbr ? String(b.abbr).split('|')[0].trim() : '';
    const label = b.listLabel || (ab && !b.term.includes(ab) ? `${b.term} (${ab})` : b.term);
    text(ctx, label, x0 + 30, cy, { size: 21, weight: cur ? 700 : 500, color: cur ? C.text : done ? C.dim : C.faint, maxW: P.w - 100 });
  }
}

function drawPanel(ctx, scene, S, G, alpha) {
  const P = LAYOUT.panel;
  fillRR(ctx, P.x, P.y, P.w, P.h, 18, C.panel, C.panelEdge, 2);
  ctx.save();
  ctx.globalAlpha *= alpha;
  rr(ctx, P.x, P.y, P.w, P.h, 18); ctx.clip();
  const bi = S.bi;
  const beat = bi >= 0 ? scene.beats[bi] : null;
  const cardBeat = (b) => (b && b.term ? b : null);
  // find the beat whose card is shown (last beat with a term up to bi, unless this beat explicitly has none)
  let curCard = cardBeat(beat);
  const xf = clamp(S.bt / 0.35);
  let prev = null;
  if (bi > 0) prev = cardBeat(scene.beats[bi - 1]);
  let bottom = 0;
  if (curCard) {
    if (prev && xf < 1) drawCard(ctx, prev, P, 1 - ease.out(xf), -8 * xf, G);
    bottom = drawCard(ctx, curCard, P, ease.out(xf), 14 * (1 - ease.out(xf)), G);
  } else {
    if (prev && xf < 1) drawCard(ctx, prev, P, 1 - ease.out(xf), 0, G);
    bottom = drawSceneCard(ctx, scene, P, prev ? ease.out(xf) : 1);
  }
  drawSceneList(ctx, scene, S, P, Math.max(bottom, P.y + 420));
  ctx.restore();
}

// ---------- chapter card ----------
function drawChapterCard(ctx, chapter, S, G) {
  const t = S.t;
  // animated background grid
  ctx.save();
  ctx.strokeStyle = rgba(C.cyan, 0.06); ctx.lineWidth = 1;
  const off = (t * 12) % 60;
  for (let x = -60 + off; x < W; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = -60 + off; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.restore();
  const a = ease.out(clamp(t / 0.8));
  const fadeOut = 1 - clamp((t - (S.dur - FADE)) / FADE);
  ctx.save(); ctx.globalAlpha *= Math.min(a, fadeOut);
  // right side art
  if (chapter.art) {
    ctx.save();
    ctx.translate(1180, 120);
    ctx.globalAlpha *= 0.9;
    chapter.art(ctx, t, S);
    ctx.restore();
  }
  const x = 120;
  const num = String(chapter.num).padStart(2, '0');
  text(ctx, chapter.num === 0 ? 'INTRODUCTION' : `CHAPTER ${num}`, x, 300, { size: 30, weight: 800, color: C.amber, spacing: 4, alpha: a });
  const tl = wrap(ctx, chapter.title, 980, 92, 800);
  tl.forEach((l, i) => text(ctx, l, x - (1 - a) * 30, 400 + i * 100, { size: 92, weight: 800, color: C.white }));
  let y = 400 + tl.length * 100 - 30;
  if (chapter.subtitle) { y += 40; y += para(ctx, chapter.subtitle, x, y, 940, { size: 32, color: C.dim, weight: 500, lh: 1.35 }); }
  // topic pills
  if (chapter.topics) {
    y += 40;
    let px = x, py = y;
    chapter.topics.forEach((tp, i) => {
      const ap = ease.outBack(clamp((t - 0.9 - i * 0.18) / 0.5));
      if (ap <= 0) return;
      ctx.save(); ctx.font = K.font(24, 700);
      const w = ctx.measureText(tp).width + 32;
      ctx.restore();
      if (px + w > x + 1000) { px = x; py += 58; }
      ctx.save(); ctx.globalAlpha *= clamp(ap);
      ctx.translate(px + w / 2, py); ctx.scale(0.8 + 0.2 * ap, 0.8 + 0.2 * ap);
      tag(ctx, tp, 0, 0, { size: 24, color: i % 2 ? C.cyan : C.amber });
      ctx.restore();
      px += w + 14;
    });
  }
  ctx.restore();
  // progress bar at top (keep consistent)
  const p = clamp(G.gt / G.total);
  ctx.fillStyle = '#10243a'; ctx.fillRect(0, 0, W, 6);
  ctx.fillStyle = C.amber; ctx.fillRect(0, 0, W * p, 6);
}

// ---------- compose one frame ----------
function composeFrame(ctx, scene, chapter, S, G) {
  drawBackground(ctx);
  if (scene.layout === 'chapter') { drawChapterCard(ctx, chapter, S, G); return; }
  const fadeIn = ease.out(clamp(S.t / FADE));
  const fadeOut = 1 - ease.in(clamp((S.t - (S.dur - FADE)) / FADE));
  const fa = Math.min(fadeIn, fadeOut);
  drawTopBar(ctx, G, scene, chapter);
  const full = scene.layout === 'full';
  const R = full ? LAYOUT.stageFull : LAYOUT.stage;
  // stage
  fillRR(ctx, R.x, R.y, R.w, R.h, 18, scene.stageBg || C.stage, null);
  ctx.save();
  rr(ctx, R.x, R.y, R.w, R.h, 18); ctx.clip();
  ctx.translate(R.x, R.y);
  ctx.globalAlpha = fa;
  scene.draw(ctx, S);
  ctx.restore();
  fillRR(ctx, R.x, R.y, R.w, R.h, 18, null, C.panelEdge, 2);
  if (!full) drawPanel(ctx, scene, S, G, fa);
}

module.exports = { composeFrame, drawBackground, drawTopBar, drawPanel, drawChapterCard, layoutCard, FADE };
