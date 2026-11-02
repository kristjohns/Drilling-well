"""Generate narration audio (Kokoro-82M ONNX, voice af_heart) for each beat.

Usage:  python make_tts.py  [--model-dir DIR]
Writes  video/audio/<beat>.wav  and  video/audio/durations.json
"""
import argparse
import json
import os
import sys

import numpy as np
import soundfile as sf

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "compare"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "qa"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lockin"))

HERE = os.path.dirname(os.path.abspath(__file__))

# spoken-form substitutions (subtitles keep the written form)
TTS_REPLACEMENTS = {"von Mises": "von Meezes"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--model-dir", default="/tmp/claude-0/tts")
    ap.add_argument("--voice", default="af_heart")
    ap.add_argument("--speed", type=float, default=1.0)
    ap.add_argument("--only", nargs="*")
    ap.add_argument("--variant", default="main", choices=["main", "compare", "qa", "lockin"])
    a = ap.parse_args()
    if a.variant == "compare":
        from narration_cmp import SCRIPT
    elif a.variant == "qa":
        from narration_qa import SCRIPT
    elif a.variant == "lockin":
        from narration_lk import SCRIPT
    else:
        from narration import SCRIPT
    from kokoro_onnx import Kokoro
    k = Kokoro(os.path.join(a.model_dir, "kokoro-v1.0.onnx"),
               os.path.join(a.model_dir, "voices-v1.0.bin"))
    out = os.path.join(HERE, "audio") if a.variant == "main" else os.path.join(HERE, a.variant, "audio")
    os.makedirs(out, exist_ok=True)
    dpath = os.path.join(out, "durations.json")
    durs = json.load(open(dpath)) if os.path.exists(dpath) else {}
    for scene, beats in SCRIPT.items():
        for bid, text in beats:
            if a.only and bid not in a.only:
                continue
            spoken = text
            for a_, b_ in TTS_REPLACEMENTS.items():
                spoken = spoken.replace(a_, b_)
            samples, sr = k.create(spoken, voice=a.voice, speed=a.speed, lang="en-us")
            # trim leading/trailing near-silence, then add 80 ms pad
            thr = 0.01 * np.max(np.abs(samples))
            idx = np.where(np.abs(samples) > thr)[0]
            samples = samples[max(0, idx[0] - int(0.02 * sr)): idx[-1] + int(0.05 * sr)]
            pad = np.zeros(int(0.08 * sr), dtype=samples.dtype)
            samples = np.concatenate([pad, samples, pad])
            fn = os.path.join(out, f"{bid}.wav")
            sf.write(fn, samples, sr)
            durs[bid] = len(samples) / sr
            print(f"{bid:10s} {durs[bid]:6.2f}s  {text[:60]}")
    json.dump(durs, open(dpath, "w"), indent=1)
    tot = sum(durs.values())
    print(f"total narration {tot/60:.1f} min")


if __name__ == "__main__":
    main()
