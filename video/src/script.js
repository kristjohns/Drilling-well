// Loads all chapters in order and prepends a title-card scene to each.
'use strict';
const path = require('path');
const fs = require('fs');

function loadChapters() {
  const dir = path.join(__dirname, 'chapters');
  const files = fs.readdirSync(dir).filter((f) => /^ch\d+.*\.js$/.test(f)).sort();
  const chapters = [];
  for (const f of files) {
    const ch = require(path.join(dir, f));
    const scenes = [];
    if (ch.intro) {
      scenes.push({ id: 'title', layout: 'chapter', beats: [{ say: ch.intro, tts: ch.introTts }], draw: null, tail: 0.5 });
    }
    for (const sc of ch.scenes) scenes.push(sc);
    chapters.push({ ...ch, scenes });
  }
  return chapters;
}

module.exports = { loadChapters };
