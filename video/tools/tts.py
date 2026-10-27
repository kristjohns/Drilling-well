#!/usr/bin/env python3
"""Generate narration clips with Kokoro-82M (ONNX) for every beat in build/script.json.

Clips are cached by their TTS text, so only changed lines are re-synthesised.
Writes build/audio/<beat id>.wav and build/durations.json.

usage: tts.py --model kokoro.onnx --voices voices.npz [--voice af_heart] [--speed 1.0] [--only prefix]
"""
import argparse
import hashlib
import json
import os
import sys
import time

import numpy as np
import soundfile as sf
from kokoro_onnx import Kokoro

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
BUILD = os.path.join(ROOT, 'build')
AUDIO = os.path.join(BUILD, 'audio')
SR = 24000


def trim(audio, thresh=0.006, pad=0.04):
    """Cut leading/trailing near-silence, keep a small pad, apply short fades."""
    if len(audio) == 0:
        return audio
    env = np.abs(audio)
    idx = np.where(env > thresh)[0]
    if len(idx) == 0:
        return audio
    a = max(0, idx[0] - int(pad * SR))
    b = min(len(audio), idx[-1] + int(pad * 2 * SR))
    out = audio[a:b].copy()
    f = int(0.012 * SR)
    if len(out) > 2 * f:
        out[:f] *= np.linspace(0, 1, f)
        out[-f:] *= np.linspace(1, 0, f)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--model', required=True)
    ap.add_argument('--voices', required=True)
    ap.add_argument('--voice', default='af_heart')
    ap.add_argument('--speed', type=float, default=1.0)
    ap.add_argument('--only', default=None)
    ap.add_argument('--threads', type=int, default=0, help='onnxruntime intra-op threads (0 = default)')
    ap.add_argument('--shard', default=None, help='i/n: only synthesise every n-th clip starting at i')
    args = ap.parse_args()
    shard = tuple(int(v) for v in args.shard.split('/')) if args.shard else None

    os.makedirs(AUDIO, exist_ok=True)
    items = json.load(open(os.path.join(BUILD, 'script.json')))
    dpath = os.path.join(BUILD, f'durations.shard{shard[0]}.json' if shard else 'durations.json')
    durations = json.load(open(dpath)) if os.path.exists(dpath) else {}

    if args.threads:
        import onnxruntime as rt
        so = rt.SessionOptions()
        so.intra_op_num_threads = args.threads
        so.inter_op_num_threads = 1
        kok = Kokoro.from_session(rt.InferenceSession(args.model, so, providers=['CPUExecutionProvider']), args.voices)
    else:
        kok = Kokoro(args.model, args.voices)
    done = 0
    t0 = time.time()
    for n, it in enumerate(items):
        bid, text = it['id'], it['tts']
        if args.only and not bid.startswith(args.only):
            continue
        if shard and n % shard[1] != shard[0]:
            continue
        key = hashlib.sha1(f"{args.voice}|{args.speed}|{text}".encode()).hexdigest()[:16]
        wav = os.path.join(AUDIO, f'{bid}.wav')
        meta = os.path.join(AUDIO, f'{bid}.key')
        if os.path.exists(wav) and os.path.exists(meta) and open(meta).read() == key:
            durations[bid] = sf.info(wav).frames / SR
            continue
        audio, sr = kok.create(text, voice=args.voice, speed=args.speed, lang='en-us')
        assert sr == SR
        audio = trim(np.asarray(audio, dtype=np.float32))
        sf.write(wav, audio, SR, subtype='PCM_16')
        open(meta, 'w').write(key)
        durations[bid] = len(audio) / SR
        done += 1
        if done % 10 == 0:
            print(f'  {done} clips, {time.time() - t0:.0f}s', flush=True)
            json.dump(durations, open(dpath, 'w'), indent=1)
    # drop durations for beats that no longer exist (only meaningful for a full, unsharded run)
    if not shard and not args.only:
        ids = {it['id'] for it in items}
        durations = {k: v for k, v in durations.items() if k in ids}
    json.dump(durations, open(dpath, 'w'), indent=1)
    total = sum(durations.values())
    print(f'synthesised {done} clips in {time.time() - t0:.0f}s; narration total {total / 60:.1f} min')


if __name__ == '__main__':
    sys.exit(main())
