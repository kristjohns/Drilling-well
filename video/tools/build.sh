#!/usr/bin/env bash
# Full pipeline: script dump -> narration (TTS) -> render scenes -> assemble final video.
# Requires KOKORO_MODEL and KOKORO_VOICES (paths to kokoro .onnx model and voices .npz) and a
# Python env with kokoro-onnx + soundfile (set PYTHON, default python3).
set -euo pipefail
cd "$(dirname "$0")/.."
PY=${PYTHON:-python3}
node tools/dump_script.js
$PY tools/tts.py --model "$KOKORO_MODEL" --voices "$KOKORO_VOICES" --voice "${VOICE:-af_heart}"
node tools/dump_script.js
node tools/render.js all --jobs "${JOBS:-4}" ${ONLY:+--only $ONLY}
node tools/assemble.js "$@"
