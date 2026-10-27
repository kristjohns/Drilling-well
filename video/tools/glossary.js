#!/usr/bin/env node
// Writes a companion glossary of every term in the video (Markdown + CSV) to output/.
'use strict';
const fs = require('fs');
const path = require('path');
const { loadChapters } = require('../src/script');
const { buildTimeline } = require('../src/engine/timeline');

const OUT = path.join(__dirname, '..', 'output');
fs.mkdirSync(OUT, { recursive: true });
const chapters = loadChapters();
let durations = {};
const dpath = path.join(__dirname, '..', 'build', 'durations.json');
if (fs.existsSync(dpath)) durations = JSON.parse(fs.readFileSync(dpath, 'utf8'));
const TL = buildTimeline(chapters, durations);

const ts = (s) => { s = Math.round(s); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60; return (h ? `${h}:${String(m).padStart(2, '0')}` : `${m}`) + `:${String(r).padStart(2, '0')}`; };
const md = ['# D&W Exploration Drilling Lingo (NCS): glossary', '', `Companion to the video. ${TL.termTotal} terms in video order; the timestamp shows where each term is explained.`, ''];
const csv = [['#', 'chapter', 'term', 'abbreviation', 'norwegian', 'definition', 'you might hear', 'video time'].join(',')];
const q = (s) => `"${String(s || '').replace(/"/g, '""')}"`;
for (const ch of chapters) {
  const terms = [];
  for (const sc of ch.scenes) for (const b of sc.beats) if (b.term) terms.push({ b, sc });
  if (!terms.length) continue;
  md.push(`## ${ch.num === 0 ? 'Introduction' : `${ch.num}. ${ch.title}`}`, '');
  md.push('| # | Term | Abbr. | Norwegian | Definition | Time |', '|---|---|---|---|---|---|');
  for (const { b, sc } of terms) {
    const t = sc.start + b.start;
    const abbr = b.abbr ? String(b.abbr).split('|').map((s) => s.trim()).join(', ') : '';
    const cell = (s) => String(s || '').replace(/\|/g, '/').replace(/\n/g, ' ');
    md.push(`| ${b.termIndex} | **${cell(b.term)}** | ${cell(abbr)} | ${cell(b.no)} | ${cell(b.def)}${b.ex ? ` _“${cell(b.ex)}”_` : ''} | ${ts(t)} |`);
    csv.push([b.termIndex, q(ch.title), q(b.term), q(abbr), q(b.no), q(b.def), q(b.ex), ts(t)].join(','));
  }
  md.push('');
}
fs.writeFileSync(path.join(OUT, 'DW_Lingo_Glossary.md'), md.join('\n'));
fs.writeFileSync(path.join(OUT, 'DW_Lingo_Glossary.csv'), '﻿' + csv.join('\n') + '\n');
console.log(`glossary: ${TL.termTotal} terms -> output/DW_Lingo_Glossary.md, .csv`);
