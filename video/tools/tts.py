"""Generate narration with Kokoro TTS and build the master timeline.

Usage: python -I tools/tts.py <video_dir> <kokoro_model_dir>

Outputs (in <video_dir>/build):
  tts/<hash>.wav      one clip per narration line (cached)
  timeline.json       shot and line timings used by the renderer and mixer
  narration.wav       full-length narration track (48 kHz mono)
  subtitles.srt       subtitles matching the narration
"""
import hashlib
import json
import os
import sys

import numpy as np
import soundfile as sf
from scipy.signal import resample_poly

LINE_GAP = 0.42      # silence between lines inside a shot (s)
OUT_SR = 48000


def trim_silence(x, sr, thresh=0.004, keep=0.04):
    """Trim leading/trailing near-silence but keep a short tail."""
    idx = np.where(np.abs(x) > thresh)[0]
    if len(idx) == 0:
        return x
    a = max(0, idx[0] - int(keep * sr))
    b = min(len(x), idx[-1] + int(keep * 2 * sr))
    return x[a:b]


def srt_time(t):
    ms = int(round(t * 1000))
    h, ms = divmod(ms, 3600000)
    m, ms = divmod(ms, 60000)
    s, ms = divmod(ms, 1000)
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"


def main():
    video_dir, model_dir = sys.argv[1], sys.argv[2]
    script = json.load(open(os.path.join(video_dir, "script", "script.json")))
    build = os.path.join(video_dir, "build")
    tts_dir = os.path.join(build, "tts")
    os.makedirs(tts_dir, exist_ok=True)

    voice, speed, fps = script["voice"], script["speed"], script["fps"]
    kokoro = None

    clips = {}
    for shot in script["shots"]:
        for line in shot["lines"]:
            say = line.get("say", line["text"])
            key = hashlib.sha1(f"{voice}|{speed}|{say}".encode()).hexdigest()[:16]
            path = os.path.join(tts_dir, f"{key}.wav")
            if not os.path.exists(path):
                if kokoro is None:
                    from kokoro_onnx import Kokoro
                    kokoro = Kokoro(os.path.join(model_dir, "kokoro-v1.0.onnx"),
                                    os.path.join(model_dir, "voices-v1.0.bin"))
                samples, sr = kokoro.create(say, voice=voice, speed=speed, lang="en-us")
                samples = trim_silence(np.asarray(samples, dtype=np.float32), sr)
                samples = resample_poly(samples, OUT_SR, sr).astype(np.float32)
                fade = int(0.012 * OUT_SR)
                samples[:fade] *= np.linspace(0, 1, fade, dtype=np.float32)
                samples[-fade * 3:] *= np.linspace(1, 0, fade * 3, dtype=np.float32)
                sf.write(path, samples, OUT_SR)
                print("tts", key, round(len(samples) / OUT_SR, 2), "s:", say[:60])
            data, _ = sf.read(path, dtype="float32")
            clips[id(line)] = (path, data)

    # Timeline: shots back to back, durations snapped to whole frames.
    t = 0.0
    shots_out = []
    for shot in script["shots"]:
        local = shot["pad"][0]
        lines_out = []
        for i, line in enumerate(shot["lines"]):
            dur = len(clips[id(line)][1]) / OUT_SR
            lines_out.append({"text": line["text"], "start": round(local, 3), "dur": round(dur, 3),
                              "audio": os.path.relpath(clips[id(line)][0], video_dir)})
            local += dur + (LINE_GAP if i < len(shot["lines"]) - 1 else 0)
        dur = local + shot["pad"][1]
        dur = max(dur, shot.get("minDur", 0))
        frames = int(round(dur * fps))
        dur = frames / fps
        shots_out.append({"id": shot["id"], "chapter": shot["chapter"], "start": round(t, 4),
                          "dur": round(dur, 4), "frames": frames, "lines": lines_out})
        t += dur

    timeline = {"fps": fps, "duration": round(t, 4), "frames": sum(s["frames"] for s in shots_out),
                "chapters": script["chapters"], "title": script["title"], "shots": shots_out}
    json.dump(timeline, open(os.path.join(build, "timeline.json"), "w"), indent=1)

    # Narration track and subtitles.
    total = np.zeros(int(t * OUT_SR) + OUT_SR, dtype=np.float32)
    srt = []
    n = 1
    for shot in shots_out:
        for line in shot["lines"]:
            data, _ = sf.read(os.path.join(video_dir, line["audio"]), dtype="float32")
            a = int((shot["start"] + line["start"]) * OUT_SR)
            total[a:a + len(data)] += data
            st = shot["start"] + line["start"]
            srt.append(f"{n}\n{srt_time(st)} --> {srt_time(st + line['dur'])}\n{line['text']}\n")
            n += 1
    peak = np.max(np.abs(total)) or 1.0
    total = total / peak * 0.89
    sf.write(os.path.join(build, "narration.wav"), total, OUT_SR)
    open(os.path.join(build, "subtitles.srt"), "w").write("\n".join(srt))

    print(f"total {t:.1f}s = {t/60:.2f} min, {timeline['frames']} frames, {len(shots_out)} shots")
    for s in shots_out:
        print(f"  {s['id']:<15} {s['start']:7.2f}  {s['dur']:6.2f}s")


if __name__ == "__main__":
    main()
