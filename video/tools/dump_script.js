#!/usr/bin/env node
// Writes build/script.json: every narration beat with its id, subtitle text and TTS text.
'use strict';
const fs = require('fs');
const path = require('path');
const { loadChapters } = require('../src/script');
const { buildTimeline } = require('../src/engine/timeline');
const { toTTS } = require('../src/lexicon');

const chapters = loadChapters();
let durations = {};
const dpath = path.join(__dirname, '..', 'build', 'durations.json');
if (fs.existsSync(dpath)) durations = JSON.parse(fs.readFileSync(dpath, 'utf8'));
const TL = buildTimeline(chapters, durations);
const items = [];
let words = 0;
for (const sc of TL.scenes) for (const b of sc.beats) {
  const tts = toTTS(b.tts || b.say);
  words += String(b.say).split(/\s+/).length;
  items.push({ id: b.id, say: b.say, tts });
}
fs.mkdirSync(path.join(__dirname, '..', 'build'), { recursive: true });
fs.writeFileSync(path.join(__dirname, '..', 'build', 'script.json'), JSON.stringify(items, null, 1));
const mins = TL.total / 60;
console.log(`${chapters.length} chapters, ${TL.scenes.length} scenes, ${items.length} beats, ${TL.termTotal} terms, ${words} words, total ${mins.toFixed(1)} min`);
for (const ch of TL.chapters) console.log(`  ${String(ch.num).padStart(2)} ${ch.title.padEnd(40)} ${((ch.end - ch.start) / 60).toFixed(1)} min`);
if (process.argv.includes('--show')) for (const it of items) console.log(it.id, '|', it.tts);
