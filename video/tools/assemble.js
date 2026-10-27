#!/usr/bin/env node
// Builds the narration track, subtitles and chapter markers, then concatenates the rendered
// scene segments and muxes everything into the final MP4(s).
//   node tools/assemble.js [--chapters] [--out output/name.mp4]
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { loadChapters } = require('../src/script');
const { buildTimeline } = require('../src/engine/timeline');
const { FPS } = require('../src/engine/core');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const SEG = path.join(BUILD, 'segments');
const OUT = path.join(ROOT, 'output');
const SR = 24000;

function readWav(file) {
  const b = fs.readFileSync(file);
  let off = 12, fmt = null, data = null;
  while (off < b.length) {
    const id = b.toString('ascii', off, off + 4), size = b.readUInt32LE(off + 4);
    if (id === 'fmt ') fmt = { ch: b.readUInt16LE(off + 10), sr: b.readUInt32LE(off + 12), bits: b.readUInt16LE(off + 22) };
    if (id === 'data') data = b.subarray(off + 8, off + 8 + size);
    off += 8 + size + (size % 2);
  }
  if (!fmt || fmt.bits !== 16 || fmt.ch !== 1 || fmt.sr !== SR) throw new Error('unexpected wav format ' + file);
  return new Int16Array(data.buffer.slice(data.byteOffset, data.byteOffset + data.length));
}
function writeWav(file, samples) {
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + samples.length * 2, 4); h.write('WAVE', 8);
  h.write('fmt ', 12); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(SR, 24); h.writeUInt32LE(SR * 2, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(samples.length * 2, 40);
  fs.writeFileSync(file, Buffer.concat([h, Buffer.from(samples.buffer, samples.byteOffset, samples.length * 2)]));
}

function srtTime(s) {
  const ms = Math.max(0, Math.round(s * 1000));
  const h = Math.floor(ms / 3600000), m = Math.floor((ms % 3600000) / 60000), sec = Math.floor((ms % 60000) / 1000), r = ms % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')},${String(r).padStart(3, '0')}`;
}
// split narration into subtitle chunks of <= ~84 chars at sentence/clause boundaries
function chunks(textIn) {
  const sentences = textIn.replace(/\s+/g, ' ').trim().match(/[^.!?]+[.!?]*["”’]?\s*/g) || [textIn];
  const out = [];
  for (let s of sentences) {
    s = s.trim();
    while (s.length > 84) {
      let cut = s.lastIndexOf(', ', 84);
      if (cut < 30) cut = s.lastIndexOf(' ', 84);
      out.push(s.slice(0, cut + 1).trim());
      s = s.slice(cut + 1).trim();
    }
    if (s) out.push(s);
  }
  return out;
}
function wrap2(s) {
  if (s.length <= 42) return s;
  const mid = Math.floor(s.length / 2);
  let a = s.lastIndexOf(' ', mid), b = s.indexOf(' ', mid);
  const cut = (b !== -1 && (a === -1 || b - mid < mid - a)) ? b : a;
  return cut > 0 ? s.slice(0, cut) + '\n' + s.slice(cut + 1) : s;
}

function main() {
  const args = process.argv.slice(2);
  const perChapter = args.includes('--chapters');
  const outName = args.includes('--out') ? args[args.indexOf('--out') + 1] : path.join(OUT, 'DW_Exploration_Drilling_Lingo_NCS.mp4');
  fs.mkdirSync(OUT, { recursive: true });
  const chapters = loadChapters();
  const durations = JSON.parse(fs.readFileSync(path.join(BUILD, 'durations.json'), 'utf8'));
  const TL = buildTimeline(chapters, durations);
  const lastFrame = TL.scenes[TL.scenes.length - 1].f1;
  const total = lastFrame / FPS;

  // ---- narration track
  const track = new Int16Array(Math.ceil(total * SR) + SR);
  const srt = [];
  let n = 1;
  for (const sc of TL.scenes) {
    for (const b of sc.beats) {
      const wav = path.join(BUILD, 'audio', `${b.id}.wav`);
      if (!fs.existsSync(wav)) throw new Error('missing audio ' + wav + ' (run tts)');
      const s = readWav(wav);
      const o = Math.round(b.audioStart * SR);
      for (let i = 0; i < s.length && o + i < track.length; i++) track[o + i] = s[i];
      // subtitles proportional to characters
      const parts = chunks(b.say);
      const totalChars = parts.reduce((a, p) => a + p.length, 0);
      let t = b.audioStart;
      for (const p of parts) {
        const d = (p.length / totalChars) * b.audioDur;
        srt.push(`${n++}\n${srtTime(t)} --> ${srtTime(t + d - 0.04)}\n${wrap2(p)}\n`);
        t += d;
      }
    }
  }
  const narr = path.join(BUILD, 'narration.wav');
  writeWav(narr, track.subarray(0, Math.ceil(total * SR)));
  const srtPath = path.join(BUILD, 'subtitles.srt');
  fs.writeFileSync(srtPath, srt.join('\n'));

  // ---- chapter metadata
  const meta = [';FFMETADATA1', 'title=D&W Exploration Drilling Lingo (NCS)', 'artist=D&W graduate guide', ''];
  for (const ch of TL.chapters) {
    const label = ch.num === 0 ? 'Introduction' : `${String(ch.num).padStart(2, '0')} ${ch.title}`;
    meta.push('[CHAPTER]', 'TIMEBASE=1/1000', `START=${Math.round(ch.start * 1000)}`, `END=${Math.round(ch.end * 1000)}`, `title=${label}`, '');
  }
  const metaPath = path.join(BUILD, 'chapters.txt');
  fs.writeFileSync(metaPath, meta.join('\n'));
  // YouTube-style chapter list
  const yt = TL.chapters.map((ch) => {
    const s = Math.round(ch.start), m = Math.floor(s / 60), h = Math.floor(m / 60);
    const ts = h ? `${h}:${String(m % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}` : `${m}:${String(s % 60).padStart(2, '0')}`;
    return `${ts} ${ch.num === 0 ? 'Introduction' : ch.title}`;
  });
  fs.writeFileSync(path.join(OUT, 'chapters.txt'), yt.join('\n') + '\n');

  // ---- concat video segments
  const list = TL.scenes.map((sc) => {
    const f = path.join(SEG, `${sc.key}.mp4`);
    if (!fs.existsSync(f)) throw new Error('missing segment ' + f);
    return `file '${f}'`;
  });
  const listPath = path.join(BUILD, 'concat.txt');
  fs.writeFileSync(listPath, list.join('\n'));
  const videoOnly = path.join(BUILD, 'video_only.mp4');
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', listPath, '-c', 'copy', videoOnly], { stdio: 'inherit' });

  // ---- mux
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', videoOnly, '-i', narr, '-i', srtPath, '-i', metaPath,
    '-map', '0:v', '-map', '1:a', '-map', '2:s', '-map_metadata', '3', '-map_chapters', '3',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-c:s', 'mov_text',
    '-metadata:s:a:0', 'language=eng', '-metadata:s:s:0', 'language=eng', '-movflags', '+faststart', '-t', String(total), outName], { stdio: 'inherit' });
  fs.copyFileSync(srtPath, outName.replace(/\.mp4$/, '.srt'));
  console.log(`wrote ${outName}  (${(total / 60).toFixed(1)} min, ${(fs.statSync(outName).size / 1e6).toFixed(0)} MB)`);

  // ---- optional per-chapter files
  if (perChapter) {
    const dir = path.join(OUT, 'chapters');
    fs.mkdirSync(dir, { recursive: true });
    for (const ch of TL.chapters) {
      const scenes = TL.scenes.filter((s) => s.chapterId === ch.id);
      const t0 = scenes[0].f0 / FPS, t1 = scenes[scenes.length - 1].f1 / FPS;
      const lp = path.join(BUILD, `concat_${ch.id}.txt`);
      fs.writeFileSync(lp, scenes.map((sc) => `file '${path.join(SEG, sc.key + '.mp4')}'`).join('\n'));
      const name = `${String(ch.num).padStart(2, '0')}_${ch.title.replace(/[^A-Za-z0-9]+/g, '_').replace(/_+$/, '')}.mp4`;
      const out = path.join(dir, name);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', lp, '-ss', String(t0), '-t', String(t1 - t0), '-i', narr,
        '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
      console.log('  chapter', name, (fs.statSync(out).size / 1e6).toFixed(1), 'MB');
    }
  }
}

main();
