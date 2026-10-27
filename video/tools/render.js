#!/usr/bin/env node
// Renders scenes to MP4 segments (raw RGBA frames piped into ffmpeg), stills and contact sheets.
//   node tools/render.js still <sceneKey> <time|bN+offset> [out.png]
//   node tools/render.js contact <sceneKey|chapterId> [out.png]
//   node tools/render.js scenes <key,key,...>
//   node tools/render.js all [--jobs 4] [--force] [--only chId,chId]
'use strict';
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const { createCanvas } = require('@napi-rs/canvas');
const K = require('../src/engine/core');
const { composeFrame } = require('../src/engine/ui');
const { buildTimeline, makeS } = require('../src/engine/timeline');
const { loadChapters } = require('../src/script');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SEG = path.join(BUILD, 'segments');
fs.mkdirSync(SEG, { recursive: true });

function loadAll() {
  const chapters = loadChapters();
  let durations = {};
  const dpath = path.join(BUILD, 'durations.json');
  if (fs.existsSync(dpath)) durations = JSON.parse(fs.readFileSync(dpath, 'utf8'));
  const TL = buildTimeline(chapters, durations);
  const byKey = {};
  for (const ch of chapters) for (const sc of ch.scenes) byKey[sc.key] = { sc, ch };
  return { chapters, TL, byKey };
}

function G(TL, gt) { return { gt, total: TL.total, chapters: TL.chapters, termTotal: TL.termTotal }; }

function renderAt(ctx, entry, TL, t) {
  const { sc, ch } = entry;
  const S = makeS(sc, t, sc.start + t);
  ctx.save();
  composeFrame(ctx, sc, ch, S, G(TL, sc.start + t));
  ctx.restore();
}

function parseTime(entry, spec) {
  const m = /^b(\d+)([+-][\d.]+)?$/.exec(spec);
  if (m) {
    const b = entry.sc.beats[+m[1]];
    return b.start + (m[2] ? parseFloat(m[2]) : Math.min(2.5, b.dur * 0.6));
  }
  if (spec === 'end') return entry.sc.dur - 0.7;
  return parseFloat(spec);
}

async function still(key, spec, out) {
  const { TL, byKey } = loadAll();
  const entry = byKey[key];
  if (!entry) throw new Error('no scene ' + key + '. Have: ' + Object.keys(byKey).join(' '));
  const c = createCanvas(K.W, K.H); const ctx = c.getContext('2d');
  renderAt(ctx, entry, TL, parseTime(entry, spec));
  out = out || path.join(BUILD, 'stills', `${key}_${spec}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await c.encode('png'));
  console.log(out);
}

// grid of frames: one per beat (at 60% of the beat or 2.5 s in), downscaled
async function contact(target, out, cols = 3) {
  const { TL, byKey } = loadAll();
  const keys = Object.keys(byKey).filter((k) => k === target || k.startsWith(target + '.'));
  const shots = [];
  for (const k of keys) {
    const e = byKey[k];
    if (e.sc.layout === 'chapter') { shots.push([e, Math.min(e.sc.dur - 0.6, 4)]); continue; }
    e.sc.beats.forEach((b, i) => shots.push([e, b.start + Math.min(b.dur * 0.75, Math.max(1.2, b.dur - 0.8))]));
  }
  const sw = 640, sh = 360;
  const rows = Math.ceil(shots.length / cols);
  const sheet = createCanvas(sw * cols, sh * rows); const sctx = sheet.getContext('2d');
  const c = createCanvas(K.W, K.H); const ctx = c.getContext('2d');
  for (let i = 0; i < shots.length; i++) {
    const [e, t] = shots[i];
    renderAt(ctx, e, TL, t);
    sctx.drawImage(c, (i % cols) * sw, Math.floor(i / cols) * sh, sw, sh);
  }
  out = out || path.join(BUILD, 'stills', `contact_${target}.png`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, await sheet.encode('png'));
  console.log(out, shots.length, 'frames');
}

function ffArgs(out) {
  return ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${K.W}x${K.H}`, '-r', String(K.FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-tune', 'animation', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
    '-g', '120', '-threads', '3', '-movflags', '+faststart', out];
}

async function renderScene(entry, TL) {
  const { sc } = entry;
  const out = path.join(SEG, `${sc.key}.mp4`);
  const tmp = out + '.part.mp4';
  const c = createCanvas(K.W, K.H); const ctx = c.getContext('2d');
  const ff = spawn('ffmpeg', ffArgs(tmp), { stdio: ['pipe', 'inherit', 'inherit'] });
  const nf = sc.f1 - sc.f0;
  const t0 = Date.now();
  for (let f = 0; f < nf; f++) {
    const gt = (sc.f0 + f) / K.FPS;
    renderAt(ctx, entry, TL, gt - sc.start);
    const buf = c.data();
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', (code) => (code === 0 ? res() : rej(new Error('ffmpeg exit ' + code)))));
  fs.renameSync(tmp, out);
  fs.writeFileSync(out.replace(/\.mp4$/, '.stamp'), stampOf(sc, TL));
  const s = (Date.now() - t0) / 1000;
  console.log(`[render] ${sc.key}  ${nf} frames  ${s.toFixed(1)}s  (${(nf / s).toFixed(1)} fps)`);
}

async function scenes(keys) {
  const { TL, byKey } = loadAll();
  for (const k of keys) {
    if (!byKey[k]) throw new Error('no scene ' + k);
    await renderScene(byKey[k], TL);
  }
}

// a segment is up to date if it was rendered for the same frame range and the same total length
// (the top bar shows the global progress and total time)
function stampOf(sc, TL) { return `${sc.f0}-${sc.f1}|${Math.round(TL.total * 1000)}`; }
async function all(opts) {
  const { TL, byKey } = loadAll();
  let keys = TL.scenes.map((s) => s.key);
  if (opts.only) keys = keys.filter((k) => opts.only.some((o) => k === o || k.startsWith(o + '.')));
  const todo = keys.filter((k) => {
    if (opts.force) return true;
    const f = path.join(SEG, `${k}.mp4`), st = path.join(SEG, `${k}.stamp`);
    return !fs.existsSync(f) || !fs.existsSync(st) || fs.readFileSync(st, 'utf8') !== stampOf(byKey[k].sc, TL);
  });
  console.log(`[render] ${todo.length} of ${keys.length} scenes to render with ${opts.jobs} jobs`);
  // longest first for load balancing
  todo.sort((a, b) => (byKey[b].sc.f1 - byKey[b].sc.f0) - (byKey[a].sc.f1 - byKey[a].sc.f0));
  const queues = Array.from({ length: opts.jobs }, () => []);
  const load = new Array(opts.jobs).fill(0);
  for (const k of todo) {
    const i = load.indexOf(Math.min(...load));
    queues[i].push(k); load[i] += byKey[k].sc.f1 - byKey[k].sc.f0;
  }
  // one worker per queue; a failing worker does not stop the others
  const res = await Promise.allSettled(queues.filter((q) => q.length).map((q) => new Promise((ok, fail) => {
    const p = spawn(process.execPath, [__filename, 'scenes', q.join(',')], { stdio: 'inherit' });
    p.on('close', (code) => (code === 0 ? ok() : fail(new Error('worker failed: ' + q[0]))));
  })));
  const bad = res.filter((r) => r.status === 'rejected');
  if (bad.length) throw new Error(`${bad.length} render worker(s) failed; rerun to retry the missing scenes`);
}

(async () => {
  const [cmd, ...args] = process.argv.slice(2);
  try {
    if (cmd === 'still') await still(args[0], args[1] || '2', args[2]);
    else if (cmd === 'contact') await contact(args[0], args[1], args[2] ? +args[2] : 3);
    else if (cmd === 'scenes') await scenes(args[0].split(','));
    else if (cmd === 'all') {
      const jobs = args.includes('--jobs') ? +args[args.indexOf('--jobs') + 1] : 4;
      const only = args.includes('--only') ? args[args.indexOf('--only') + 1].split(',') : null;
      await all({ jobs, force: args.includes('--force'), only });
    } else {
      console.log('usage: render.js still|contact|scenes|all');
    }
  } catch (e) { console.error(e); process.exit(1); }
})();
