"""Procedural score, timeline-keyed sound effects and the final mix.

Usage: python -I tools/audio.py <video_dir>
Reads build/timeline.json and build/narration.wav. Writes build/music.wav,
build/sfx.wav and build/mix.wav (48 kHz stereo).
"""
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import butter, sosfilt, oaconvolve, resample_poly

SR = 48000
RNG = np.random.default_rng(7)


def lp(x, f, order=2, sr=SR):
    return sosfilt(butter(order, f, 'low', fs=sr, output='sos'), x, axis=0)


def hp(x, f, order=2, sr=SR):
    return sosfilt(butter(order, f, 'high', fs=sr, output='sos'), x, axis=0)


def bp(x, lo, hi, order=2, sr=SR):
    return sosfilt(butter(order, [lo, hi], 'band', fs=sr, output='sos'), x, axis=0)


def white(n):
    return RNG.standard_normal(n).astype(np.float32)


def brown(n):
    b = np.cumsum(white(n)) * 0.02
    b = hp(b, 20)
    return (b / (np.max(np.abs(b)) + 1e-9)).astype(np.float32)


def fade(x, a=0.05, r=0.05):
    n = len(x)
    na, nr = int(a * SR), int(r * SR)
    env = np.ones(n, np.float32)
    if na > 0:
        env[:min(na, n)] = np.linspace(0, 1, min(na, n))
    if nr > 0:
        env[max(0, n - nr):] *= np.linspace(1, 0, n - max(0, n - nr))
    return x * (env[:, None] if x.ndim == 2 else env)


def stereo(x, pan=0.0, width=0.0):
    """mono -> stereo; width decorrelates by a few ms."""
    l = x * np.sqrt(0.5 * (1 - pan))
    r = x * np.sqrt(0.5 * (1 + pan))
    if width > 0:
        d = int(width * 0.012 * SR)
        r = np.concatenate([np.zeros(d, np.float32), r[:-d]]) if d > 0 else r
    return np.stack([l, r], axis=1).astype(np.float32)


def place(buf, x, t, gain=1.0):
    a = int(t * SR)
    if a >= len(buf):
        return
    if a < 0:
        x = x[-a:]
        a = 0
    b = min(len(buf), a + len(x))
    buf[a:b] += x[:b - a] * gain


def midi(n):
    return 440.0 * 2 ** ((n - 69) / 12)


# ------------------------------------------------------------------ music
CHORDS = [
    [50, 57, 62, 64, 65],   # Dm(add9)
    [46, 53, 57, 62, 65],   # Bbmaj7
    [41, 48, 57, 60, 64],   # Fmaj7
    [43, 50, 55, 62, 65],   # Gm7 (open)
    [50, 57, 62, 64, 65],
    [46, 53, 58, 62, 65],
    [48, 55, 60, 64, 67],   # C(add9)
    [45, 52, 57, 61, 64],   # A
]
CHORD_LEN = 8.0


def pad_chord(notes, dur, sr=12000):
    n = int((dur + 4.0) * sr)
    t = np.arange(n) / sr
    out = np.zeros((n, 2), np.float32)
    for k, note in enumerate(notes):
        f0 = midi(note)
        for d, pan in ((-3.5, -0.5), (3.5, 0.5)):
            f = f0 * 2 ** (d / 1200)
            lfo = 1 + 0.002 * np.sin(2 * np.pi * (0.13 + 0.05 * k) * t + k)
            ph = 2 * np.pi * f * np.cumsum(lfo) / sr
            sig = np.sin(ph) + 0.35 * np.sin(2 * ph + 0.3) + 0.14 * np.sin(3 * ph + 1.1)
            amp = (0.9 if note > 48 else 0.6) * (0.85 + 0.15 * np.sin(2 * np.pi * 0.07 * t + k * 1.3))
            out += stereo((sig * amp).astype(np.float32), pan)
    env = np.minimum(1, t / 2.8) * np.clip((dur + 3.2 - t) / 3.2, 0, 1)
    out *= env[:, None] / len(notes)
    return out


def make_music(T, energy):
    sr_l = 12000
    buf_l = np.zeros((int((T + 6) * sr_l), 2), np.float32)
    nchords = int(T / CHORD_LEN) + 1
    for i in range(nchords):
        ch = CHORDS[i % len(CHORDS)]
        seg = pad_chord(ch, CHORD_LEN, sr_l)
        a = int(i * CHORD_LEN * sr_l)
        b = min(len(buf_l), a + len(seg))
        buf_l[a:b] += seg[:b - a]
    pad = resample_poly(buf_l, 4, 1, axis=0).astype(np.float32)
    pad = lp(pad, 2600)
    n = len(pad)
    t = np.arange(n) / SR
    # bass: chord roots one octave down, soft
    bass = np.zeros(n, np.float32)
    for i in range(nchords):
        f = midi(CHORDS[i % len(CHORDS)][0] - 12)
        a, b = int(i * CHORD_LEN * SR), min(n, int((i + 1) * CHORD_LEN * SR + 1.5 * SR))
        tt = np.arange(b - a) / SR
        env = np.minimum(1, tt / 1.5) * np.clip(((b - a) / SR - tt) / 1.5, 0, 1)
        bass[a:b] += (np.sin(2 * np.pi * f * tt) * 0.7 + 0.2 * np.sin(4 * np.pi * f * tt)) * env
    # arpeggio plucks (eighths at 96 bpm), level follows the energy curve
    arp = np.zeros(n, np.float32)
    step = 60 / 96 / 2
    pattern = [0, 2, 3, 4, 3, 2, 1, 2]
    k = 0
    tt0 = np.arange(int(1.2 * SR)) / SR
    pl_env = np.exp(-tt0 / 0.28)
    while k * step < T:
        tk = k * step
        e = energy(tk)
        if e > 0.05:
            ch = CHORDS[int(tk / CHORD_LEN) % len(CHORDS)]
            note = ch[pattern[k % 8] % len(ch)] + 12
            f = midi(note)
            s = (np.sin(2 * np.pi * f * tt0) + 0.25 * np.sin(4 * np.pi * f * tt0)) * pl_env * (0.6 + 0.4 * ((k % 4) == 0))
            a = int(tk * SR)
            b = min(n, a + len(s))
            arp[a:b] += s[:b - a] * e
        k += 1
    arp = lp(arp, 4500)
    music = pad * 0.9 + stereo(bass * 0.55) + stereo(arp * 0.22, 0.0, 1.0)
    # overall section dynamics
    dyn = np.array([0.55 + 0.45 * energy(x) for x in np.arange(0, T + 6, 0.05)], np.float32)
    dyn = np.interp(t, np.arange(len(dyn)) * 0.05, dyn).astype(np.float32)
    music *= dyn[:, None]
    # reverb: exponentially decaying stereo noise IR
    ir_n = int(3.6 * SR)
    tir = np.arange(ir_n) / SR
    ir = np.stack([white(ir_n) * np.exp(-tir / 0.9), white(ir_n) * np.exp(-tir / 0.95)], axis=1)
    ir = lp(ir, 6000) * 0.035
    wet = np.stack([oaconvolve(music[:, c], ir[:, c])[:n] for c in range(2)], axis=1)
    out = music * 0.75 + wet.astype(np.float32) * 0.6
    return out[:int(T * SR)]


# ------------------------------------------------------------------ sound effects
def ocean_bed(dur, level=0.5, storm=False):
    n = int(dur * SR)
    t = np.arange(n) / SR
    b = brown(n)
    surf = lp(b, 700 if storm else 450)
    swell = 0.55 + 0.45 * np.sin(2 * np.pi * t / (7.5 if storm else 10.0)) ** 2
    hiss = hp(white(n), 2500) * 0.12 * (swell ** 3)
    crash = np.zeros(n, np.float32)
    for c in np.arange(RNG.uniform(1, 4), dur, RNG.uniform(5, 9) if storm else 12):
        m = int(min(3.0, dur - c) * SR)
        if m <= 0:
            continue
        tt = np.arange(m) / SR
        crash[int(c * SR):int(c * SR) + m] += bp(white(m), 300, 3000)[:m] * np.exp(-tt / 0.9) * np.minimum(1, tt / 0.15) * 0.5
    x = (surf * 1.6 + hiss + crash * (1.0 if storm else 0.4)) * swell
    return fade(stereo(x.astype(np.float32), 0, 1.0), 1.0, 1.0) * level


def rain(dur, level=0.5):
    n = int(dur * SR)
    x = bp(white(n), 1500, 9000) * 0.25
    drops = np.zeros(n, np.float32)
    idx = RNG.integers(0, n, int(dur * 400))
    drops[idx] = RNG.uniform(0.2, 1.0, len(idx))
    drops = hp(drops, 2000) * 0.6
    return fade(stereo((x + drops).astype(np.float32), 0, 1.0), 1.0, 1.0) * level


def wind(dur, level=0.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    g = 0.5 + 0.5 * np.sin(2 * np.pi * t / 6.3 + 1) * np.sin(2 * np.pi * t / 2.7)
    x = bp(white(n), 250, 1400) * (0.35 + 0.65 * g)
    return fade(stereo(x.astype(np.float32), 0.2, 1.0), 1.0, 1.0) * level


def underwater(dur, level=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = lp(brown(n), 220) * 2.0
    bub = np.zeros(n, np.float32)
    for c in RNG.uniform(0, dur, int(dur * 1.5)):
        m = int(0.08 * SR)
        tt = np.arange(m) / SR
        f = RNG.uniform(300, 900)
        s = np.sin(2 * np.pi * (f + 3000 * tt) * tt) * np.exp(-tt / 0.02)
        a = int(c * SR)
        bub[a:a + m] += s[:max(0, min(m, n - a))] * 0.15
    x = x * (0.8 + 0.2 * np.sin(2 * np.pi * t / 9))
    return fade(stereo((x + bub).astype(np.float32), 0, 1.0), 1.0, 1.0) * level


def heli(dur, land_at, level=0.8):
    n = int(dur * SR)
    t = np.arange(n) / SR
    bpf = 4.6
    slap = np.zeros(n, np.float32)
    k = 0
    while k / bpf < dur:
        m = int(0.07 * SR)
        a = int(k / bpf * SR)
        tt = np.arange(m) / SR
        slap[a:a + m] += (lp(white(m), 500) * np.exp(-tt / 0.02))[:max(0, min(m, n - a))]
        k += 1
    whine = 0.08 * np.sin(2 * np.pi * 1150 * t) + 0.05 * np.sin(2 * np.pi * 2300 * t)
    approach = np.clip(t / land_at, 0, 1) ** 2
    vol = 0.15 + 0.85 * approach
    vol = np.where(t > land_at + 1.5, vol * np.clip(1 - (t - land_at - 1.5) / 3, 0.5, 1), vol)
    x = (slap * 2.2 + whine) * vol
    return fade(stereo(lp(x, 4000).astype(np.float32), -0.2, 0.5), 0.5, 1.0) * level


def machinery(dur, level=0.4, clanks=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    hum = 0.35 * np.sin(2 * np.pi * 50 * t) + 0.2 * np.sin(2 * np.pi * 100 * t) + 0.1 * np.sin(2 * np.pi * 150 * t)
    rumble = lp(brown(n), 160) * 0.9
    x = hum + rumble
    for c in RNG.uniform(0.5, dur, int(dur * clanks)):
        x += clank_buf(n, c, 0.35)
    return fade(stereo(x.astype(np.float32), 0, 0.8), 0.8, 0.8) * level


def clank_buf(n, at, g=0.5):
    out = np.zeros(n, np.float32)
    m = int(0.9 * SR)
    tt = np.arange(m) / SR
    s = sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, d in ((420, 0.25), (1130, 0.12), (2380, 0.06), (3610, 0.04)))
    s = s + white(m) * np.exp(-tt / 0.01) * 0.6
    a = int(at * SR)
    if a < n:
        out[a:a + m] += (s * g)[:max(0, min(m, n - a))]
    return out


def whir(dur, f0=180, f1=420, level=0.3):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = f0 + (f1 - f0) * np.sin(np.pi * t / dur)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.4 * np.sin(2 * ph)) * 0.25 + bp(white(n), 400, 2000) * 0.08
    return fade(stereo(x.astype(np.float32), 0.1, 0.4), 0.15, 0.25) * level


def pumps(dur, level=0.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = np.zeros(n, np.float32)
    for k, rate in enumerate((2.05, 2.11, 1.98, 2.07)):
        ph = 2 * np.pi * rate * t + k
        x += (np.maximum(0, np.sin(ph)) ** 8) * lp(white(n), 120) * 3
    x += lp(brown(n), 300) * 0.6 + 0.2 * np.sin(2 * np.pi * 60 * t)
    return fade(stereo(x.astype(np.float32), 0, 0.8), 0.4, 0.4) * level


def shakers(dur, level=0.5):
    n = int(dur * SR)
    t = np.arange(n) / SR
    x = bp(white(n), 120, 900) * (0.6 + 0.4 * np.sin(2 * np.pi * 30 * t)) + 0.25 * np.sin(2 * np.pi * 30 * t)
    x += bp(white(n), 2000, 6000) * 0.15
    return fade(stereo(x.astype(np.float32), 0.15, 0.8), 0.4, 0.4) * level


def alarm(dur, level=0.35):
    n = int(dur * SR)
    t = np.arange(n) / SR
    on = (np.floor(t / 0.3) % 2 == 0)
    x = np.sign(np.sin(2 * np.pi * 880 * t)) * on * 0.3
    return fade(stereo(lp(x, 3000).astype(np.float32)), 0.02, 0.1) * level


def crunch(level=0.8):
    m = int(2.0 * SR)
    tt = np.arange(m) / SR
    s = white(m) * np.exp(-tt / 0.15) * 0.8
    s += sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt / d) for f, d in ((180, 0.6), (530, 0.4), (1270, 0.2), (2960, 0.1)))
    s = lp(s, 6000)
    return stereo(s.astype(np.float32), 0, 0.6) * level


def whoosh(level=0.35):
    m = int(1.6 * SR)
    tt = np.arange(m) / SR
    env = np.sin(np.pi * np.clip(tt / 1.6, 0, 1)) ** 2
    x = np.zeros(m, np.float32)
    nz = white(m)
    for i in range(8):
        a, b = i * m // 8, (i + 1) * m // 8
        f = 300 + 3000 * (i / 8)
        x[a:b] = bp(nz, f * 0.7, f * 1.3)[a:b]
    return stereo(lp(x * env, 7000).astype(np.float32), 0, 1.0) * level


def impact(level=0.9):
    m = int(4.0 * SR)
    tt = np.arange(m) / SR
    f = 55 * np.exp(-tt * 0.6) + 28
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph) * np.exp(-tt / 1.4) + lp(white(m), 300) * np.exp(-tt / 0.25) * 0.8
    return stereo(s.astype(np.float32), 0, 0.5) * level


def blips(dur, level=0.15, rate=3.0):
    n = int(dur * SR)
    x = np.zeros(n, np.float32)
    for c in RNG.uniform(0, dur, int(dur * rate)):
        m = int(0.06 * SR)
        tt = np.arange(m) / SR
        f = RNG.choice([1320, 1760, 2093, 2637])
        s = np.sin(2 * np.pi * f * tt) * np.exp(-tt / 0.015)
        a = int(c * SR)
        x[a:a + m] += s[:max(0, min(m, n - a))]
    return stereo(x, RNG.uniform(-0.5, 0.5), 0.3) * level


def thumps(dur, rate=1.2, level=0.4):
    n = int(dur * SR)
    x = np.zeros(n, np.float32)
    m = int(0.4 * SR)
    tt = np.arange(m) / SR
    s = np.sin(2 * np.pi * 70 * tt) * np.exp(-tt / 0.08)
    k = 0
    while k / rate < dur:
        a = int(k / rate * SR)
        x[a:a + m] += s[:max(0, min(m, n - a))]
        k += 1
    return stereo(x) * level


def hiss(dur, level=0.3):
    n = int(dur * SR)
    return fade(stereo(bp(white(n), 1500, 8000).astype(np.float32) * 0.4, 0.3, 0.5), 0.3, 0.6) * level


# ------------------------------------------------------------------ cue sheet
def cues(tl):
    S = {s['id']: s for s in tl['shots']}
    ev = []   # (start_time, buffer, gain)

    def at(sid, off, buf, g=1.0):
        ev.append((S[sid]['start'] + off, buf, g))

    def whole(sid, fn, *a, g=1.0, a0=0.0, a1=None):
        d = S[sid]['dur']
        a1 = d if a1 is None else a1
        if a1 - a0 > 0.1:
            at(sid, a0, fn(a1 - a0, *a), g)

    L = lambda sid, i: S[sid]['lines'][i]['start']
    # chapter whooshes
    for s in tl['shots']:
        if s['chapter'] > 0 and s is next(x for x in tl['shots'] if x['chapter'] == s['chapter']):
            at(s['id'], 0.1, whoosh())
    whole('open_storm', ocean_bed, 0.7, True); whole('open_storm', rain, 0.4); whole('open_storm', wind, 0.4)
    whole('open_rig', ocean_bed, 0.65, True); whole('open_rig', rain, 0.35); whole('open_rig', wind, 0.35); whole('open_rig', machinery, 0.12, 0.1)
    whole('title', ocean_bed, 0.45); whole('title', wind, 0.2)
    at('title', S['title']['lines'][0]['start'] + S['title']['lines'][0]['dur'] - 0.45, impact())
    whole('rigtypes', ocean_bed, 0.25)
    whole('rig_orbit', ocean_bed, 0.45); whole('rig_orbit', wind, 0.2)
    cross = L('rig_underwater', 1) - 0.2
    whole('rig_underwater', underwater, 0.65, a1=cross); whole('rig_underwater', ocean_bed, 0.6, True, a0=cross)
    whole('rig_deck', ocean_bed, 0.35); whole('rig_deck', wind, 0.2); whole('rig_deck', machinery, 0.15, 0.1)
    whole('rig_station', ocean_bed, 0.3); whole('rig_station', wind, 0.3)
    whole('heli', ocean_bed, 0.35); whole('heli', wind, 0.25); whole('heli', heli, 11.0, 0.75)
    whole('crew', ocean_bed, 0.25); whole('crew', machinery, 0.3, 0.25)
    whole('derrick_intro', wind, 0.35); whole('derrick_intro', machinery, 0.25, 0.1)
    whole('hoist_system', machinery, 0.3, 0.1); at('hoist_system', L('hoist_system', 1) + 4.0, whir(5.0, 120, 300, 0.45))
    whole('heave', ocean_bed, 0.55); whole('heave', machinery, 0.25, 0.1)
    for sid in ('floor_intro', 'fingerboard', 'roughneck', 'offline', 'robot'):
        whole(sid, machinery, 0.4, 0.35)
    at('fingerboard', L('fingerboard', 1) + 0.3, whir(S['fingerboard']['dur'] - L('fingerboard', 1) - 0.8, 160, 360, 0.35))
    at('roughneck', 0.6, whir(1.6, 140, 260, 0.35)); at('roughneck', 2.2, clank_buf(int(SR), 0, 0.8)[:, None].repeat(2, 1) * 0.6)
    at('roughneck', 2.6, whir(2.4, 300, 900, 0.4)); at('roughneck', 5.3, clank_buf(int(SR), 0, 1.0)[:, None].repeat(2, 1) * 0.7)
    at('roughneck', L('roughneck', 1) + 2.6, clank_buf(int(SR), 0, 0.9)[:, None].repeat(2, 1) * 0.6)
    at('roughneck', L('roughneck', 1) + 3.6, whir(S['roughneck']['dur'] - L('roughneck', 1) - 4.0, 100, 220, 0.35))
    whole('cabin', machinery, 0.2, 0.1); whole('cabin', blips, 0.08, 1.5)
    for k in range(3):
        at('robot', 0.5 + k * 5.5, whir(2.6, 400, 1100, 0.25))
    whole('dive', machinery, 0.3, 0.2, a1=2.5); at('dive', 4.6, whoosh(0.5))
    whole('dive', underwater, 0.75, a0=4.9)
    whole('bop', underwater, 0.75); whole('bop', machinery, 0.06, 0.0)
    whole('tophole', machinery, 0.15, 0.0); whole('casing', machinery, 0.15, 0.0)
    m = S['mud_loop']; c = [L('mud_loop', 1) - 0.3, L('mud_loop', 2) - 0.3, L('mud_loop', 3) - 0.3]
    at('mud_loop', 0, machinery(c[0], 0.35, 0.05)); at('mud_loop', c[0], pumps(c[1] - c[0], 0.75))
    at('mud_loop', c[1], machinery(c[2] - c[1], 0.45, 0.0)); at('mud_loop', c[2], shakers(m['dur'] - c[2], 0.6))
    whole('mud_barrier', machinery, 0.12, 0.0)
    whole('cuttings', ocean_bed, 0.4); whole('cuttings', wind, 0.2); at('cuttings', 1.0, whir(S['cuttings']['dur'] - 3, 90, 160, 0.25))
    for sid in ('bha', 'rss'):
        whole(sid, machinery, 0.35, 0.0)
    w0 = L('mwd', 1)
    whole('mwd', machinery, 0.25, 0.0); at('mwd', w0 + 0.5, thumps(4.6, 1.6, 0.35)); at('mwd', w0 + 5.2, blips(S['mwd']['dur'] - w0 - 5.2, 0.2, 14))
    whole('geosteer', blips, 0.1, 2.0)
    k0 = L('kick', 1) + 2.8
    whole('kick', machinery, 0.2, 0.0); at('kick', k0, alarm(S['kick']['dur'] - k0))
    l1 = L('shutin', 1)
    at('shutin', 3.5, hiss(l1 - 4.0, 0.3))
    tc = l1 + 0.3 + 0.55 * (S['shutin']['dur'] - l1 - 1.4)
    at('shutin', l1 + 0.3, whir(tc - l1 - 0.3, 100, 260, 0.4)); at('shutin', tc, crunch())
    whole('data', blips, 0.12, 4.0)
    whole('auto', machinery, 0.08, 0.0); whole('auto', blips, 0.06, 1.0)
    whole('battery', ocean_bed, 0.3); whole('battery', machinery, 0.12, 0.0)
    whole('wind', ocean_bed, 0.45); whole('wind', wind, 0.45)
    whole('complete', underwater, 0.6, a0=9.2)
    whole('future', ocean_bed, 0.3); whole('future', wind, 0.18)
    whole('end', ocean_bed, 0.3); whole('end', wind, 0.15)
    return ev


def energy_curve(tl):
    """Music energy 0..1 over time, from chapters."""
    lev = {0: 0.35, 1: 0.55, 2: 0.6, 3: 0.45, 4: 0.6, 5: 0.65, 6: 0.55, 7: 0.6, 8: 0.65, 9: 0.4, 10: 0.6, 11: 0.5, 12: 0.75}
    pts = []
    for s in tl['shots']:
        pts.append((s['start'], lev[s['chapter']]))
        pts.append((s['start'] + s['dur'], lev[s['chapter']]))
    ts = np.array([p[0] for p in pts]); vs = np.array([p[1] for p in pts])
    end = tl['duration']
    def e(t):
        v = float(np.interp(t, ts, vs))
        if t < 31.0:
            v = 0.15 + 0.5 * (t / 31.0) ** 2           # cold open builds toward the title
        if t > end - 9:
            v = min(1.0, v + 0.25)
        return v
    return e


def main():
    video = sys.argv[1]
    tl = json.load(open(os.path.join(video, 'build', 'timeline.json')))
    T = tl['duration']
    n = int(T * SR)
    print('music...')
    music = make_music(T, energy_curve(tl))
    print('sfx...')
    sfx = np.zeros((n, 2), np.float32)
    for st, buf, g in cues(tl):
        place(sfx, buf, st, g)
    narr, sr = sf.read(os.path.join(video, 'build', 'narration.wav'), dtype='float32')
    assert sr == SR
    narr = narr[:n] if len(narr) >= n else np.concatenate([narr, np.zeros(n - len(narr), np.float32)])
    # sidechain: narration envelope (attack 40 ms, release 450 ms)
    env = np.abs(narr)
    win = int(0.04 * SR)
    env = np.convolve(env, np.ones(win) / win, mode='same')
    rel = np.exp(-1 / (0.45 * SR / 64))
    e2 = env[::64].copy()
    for i in range(1, len(e2)):
        e2[i] = max(e2[i], e2[i - 1] * rel)
    env = np.interp(np.arange(n), np.arange(len(e2)) * 64, e2)
    env = np.clip(env / (np.percentile(env[env > 1e-4], 90) + 1e-9), 0, 1).astype(np.float32)
    duck_m = (1 - 0.5 * env)[:, None]
    duck_s = (1 - 0.35 * env)[:, None]
    sf.write(os.path.join(video, 'build', 'music.wav'), music, SR)
    sf.write(os.path.join(video, 'build', 'sfx.wav'), sfx, SR)
    mix = stereo(narr) * 1.45 + music[:n] * 0.095 * duck_m + sfx * 0.36 * duck_s
    np.save(os.path.join(video, 'build', 'duck.npy'), env[::480])
    peak = np.max(np.abs(mix))
    mix = mix / peak * 0.93
    sf.write(os.path.join(video, 'build', 'mix.wav'), mix.astype(np.float32), SR)
    print(f'mix written: {T:.1f}s, peak before norm {peak:.2f}')


if __name__ == '__main__':
    main()
