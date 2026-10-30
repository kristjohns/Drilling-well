# The Drilling Rig: how Norway drills for oil and gas

This repo holds a 12½-minute narrated explainer video about a modern harsh-environment drilling rig on the
Norwegian Continental Shelf, plus everything needed to rebuild it. The facts are current to 2026.

Every frame is real-time 3D (Three.js), rendered deterministically in headless Chromium. Everything is generated
procedurally: the models, textures, ocean, sky, aurora, map, music and sound effects. The narration comes from a
neural text-to-speech voice.

## Chapters

| # | Chapter | What it covers |
|---|---------|----------------|
| 0 | Opening | North Sea storm, the Draupner rogue wave, title |
| 1 | The Norwegian Shelf | 3D map of the shelf; fields; 2025 well statistics; three rig types |
| 2 | Meet the Rig | Semi-submersible anatomy, why pontoons make it stable, deck tour, anchors vs dynamic positioning |
| 3 | Life Offshore | Helicopter crew change, 2-on/4-off rotation, 12-hour shifts, crew roles |
| 4 | The Derrick | Crown block, travelling block, top drive, drawworks; heave compensation with a live graph |
| 5 | The Drill Floor | Red zone, fingerboard, pipe racker, iron roughneck, power slips, offline stand building, driller's cabin, robots |
| 6 | Building the Well | Moonpool and riser dive to the seabed, the BOP stack, top hole, the casing telescope |
| 7 | Mud | Pits, pumps, nozzle jets, shale shakers; the mud column as primary barrier; zero discharge |
| 8 | Downhole | BHA, PDC bit, rotary steerable, MWD/LWD, mud-pulse vs wired pipe, geosteering, the 10,666 m record |
| 9 | Well Control | NORSOK D-010 two-barrier principle, kick detection, shut-in, shear rams, managed pressure drilling |
| 10 | The Digital Rig | Data to shore, onshore operations centres, the 2025 automated drilling first, digital twins |
| 11 | Cutting Emissions | Battery hybrids, power from shore (Askepott / Martin Linge), Johan Sverdrup, Hywind Tampen |
| 12 | The Finished Well | Completion and Christmas tree, the outlook to 2035 |

Research notes and source links for every fact are in [`docs/research-notes.md`](docs/research-notes.md).

## How it is built

```
video/
  script/script.json      narration script (text and pronunciation) — drives the whole timeline
  tools/tts.py            Kokoro TTS → per-line clips, build/timeline.json, narration.wav, subtitles.srt
  tools/render.mjs        headless Chromium (Mesa lavapipe WebGL) → stills or per-shot H.264 segments
  tools/audio.py          procedural score + timeline-keyed sound effects + ducked final mix
  tools/assemble.py       concat segments + audio + soft subtitles + chapters → final MP4s
  tools/map_data.py       Natural Earth coastlines → projected map data
  src/main.js             renderer, environments (ocean / underwater / studio), shot runner
  src/engine/             post-processing, overlay (callouts, cards), materials, textures, geometry builder
  src/world/              the sets: sky, ocean, rig, subsea + BOP, well schematic, BHA, mud module, map,
                          geosteering, vessels, control room, wind farm, etc.
  src/shots/ch*.js        one definition per shot: environment, camera move, animation and overlays
```

Each frame is a pure function of `(shot, time)`. That means shots can be rendered in any order, in parallel,
and re-rendered one at a time.

### Rebuild

```bash
cd video
npm install                                    # three.js
python3 -m venv .venv && .venv/bin/pip install kokoro-onnx soundfile scipy numpy
# Kokoro model files: kokoro-v1.0.onnx + voices-v1.0.bin (github.com/thewh1teagle/kokoro-onnx releases)
.venv/bin/python tools/tts.py . <model_dir>    # narration + timeline
node tools/render.mjs stills --shots all       # quick look at every shot
node tools/render.mjs video --shots all --workers 2
.venv/bin/python tools/audio.py .
python3 tools/assemble.py .                    # 1080p + 720p MP4s; --mib N sets the 1080p size budget
```

Software rendering uses Mesa's lavapipe. Install it with `apt install mesa-vulkan-drivers`.

The video render can be stopped and restarted at any time. Finished segments are skipped, and the frames of an
unfinished shot are cached in `out/frames/` until its segment is encoded. To re-render particular shots, pass
`--shots a,b --force`.

The rig, the vessel names and the operations-centre screens are fictional or generic.
