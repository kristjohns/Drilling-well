# D&W Exploration Drilling Lingo (NCS): video

A narrated, animated field guide (about 105 minutes, 1080p) to the terms a graduate meets in exploration drilling on the Norwegian Continental Shelf: 21 chapters and 367 terms. Every term gets its own animation and a term card showing the English term, the abbreviation, the Norwegian word, a definition, and an example of how you might hear it used.

Everything is generated from code:

- `src/chapters/chNN_*.js` hold the script (term, definition, narration) and the per-scene animation code.
- `src/engine/` holds the frame layout, timeline and drawing primitives; `src/art/` holds reusable drawings (rig, BOP, well, logs …).
- `src/lexicon.js` turns on-screen text into text the voice pronounces well (acronyms, Norwegian names, fractions).

## Build

Requirements: Node 18+, ffmpeg, and a Python environment with `kokoro-onnx` and `soundfile`, plus the Kokoro-82M ONNX model and voices file.

```bash
npm install
node tools/dump_script.js                       # script.json and timing estimate
python tools/tts.py --model kokoro.onnx --voices voices.npz   # narration clips (cached)
node tools/render.js all --jobs 4               # render scene segments
node tools/assemble.js --chapters               # full MP4 + per-chapter MP4s + SRT
node tools/glossary.js                          # glossary .md / .csv
```

Quality checks: `node tools/render.js contact ch14.bop` writes a contact sheet with one frame per term; `node tools/render.js still ch14.bop b2+3` renders a single frame (3 s into the third beat).
