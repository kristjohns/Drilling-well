"""Render (optional), concatenate the scenes, build subtitles and mux the final MP4.

Usage:
  python build_video.py --media /tmp/media --quality 1080p30 --out ../deliverables/video.mp4
Scenes must already be rendered by manim into  <media>/videos/<file>/<quality>/<Scene>.mp4
"""
import argparse
import json
import os
import re
import subprocess
import sys

sys.path.insert(0, os.path.dirname(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "compare"))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "lockin"))

HERE = os.path.dirname(os.path.abspath(__file__))
FILES_CMP = {
    "C01_Intro": "scenes_cmp_a", "C02_HeatUp": "scenes_cmp_a", "C03_Principle": "scenes_cmp_a",
    "C04_ForceBalance": "scenes_cmp_b", "C05_Foundation": "scenes_cmp_b",
    "C06_InnerStrings": "scenes_cmp_c", "C07_Scoreboard": "scenes_cmp_c",
    "C08_Partial": "scenes_cmp_d", "C09_Surface20": "scenes_cmp_d", "C10_Conclusion": "scenes_cmp_d",
}
FILES_LK = {
    "L01_Intro": "scenes_lk_a", "L02_Definition": "scenes_lk_a", "L03_Inputs": "scenes_lk_a",
    "L04_HandCalc": "scenes_lk_b", "L05_InnerPush": "scenes_lk_b", "L06_Soil": "scenes_lk_b",
    "L07_Results": "scenes_lk_c", "L08_Effects": "scenes_lk_c",
    "L09_Piles": "scenes_lk_d", "L10_PileGroup": "scenes_lk_d", "L11_Checks": "scenes_lk_c",
}
FILES = {
    "S01_Intro": "scenes_a", "S02_Architecture": "scenes_a", "S03_Wellhead": "scenes_a",
    "S04_Temperature": "scenes_b", "S05_ThermalStrain": "scenes_b",
    "S06_Springs": "scenes_c", "S07_Restrained": "scenes_c",
    "S08_EffectiveForce": "scenes_d", "S09_Helix": "scenes_d",
    "S10_Verdict": "scenes_e", "S11_Partial20": "scenes_e", "S12_Summary": "scenes_e",
}


def duration(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration",
                                   "-of", "csv=p=0", path]).decode().strip()
    return float(out)


def fmt(t):
    h = int(t // 3600)
    m = int(t % 3600 // 60)
    s = t % 60
    return f"{h:02d}:{m:02d}:{int(s):02d},{int(round((s - int(s)) * 1000)) % 1000:03d}"


def split_caption(text, max_len=84):
    # sentence split, then split long sentences at commas / spaces
    parts = re.split(r"(?<=[.?!])\s+", text.strip())
    out = []
    for p in parts:
        while len(p) > max_len:
            cut = p.rfind(", ", 0, max_len)
            if cut < max_len * 0.4:
                cut = p.rfind(" ", 0, max_len)
            out.append(p[:cut + 1].strip())
            p = p[cut + 1:].strip()
        if p:
            out.append(p)
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--media", required=True)
    ap.add_argument("--quality", default="1080p30")
    ap.add_argument("--out", required=True)
    ap.add_argument("--variant", default="main", choices=["main", "compare", "lockin"])
    a = ap.parse_args()
    global FILES
    if a.variant == "compare":
        from narration_cmp import SCRIPT, SCENE_ORDER
        FILES = FILES_CMP
        tdir = os.path.join(HERE, "compare", "timings")
        title = "Free vs Restrained Wellhead - subsea well comparison"
    elif a.variant == "lockin":
        from narration_lk import SCRIPT, SCENE_ORDER
        FILES = FILES_LK
        tdir = os.path.join(HERE, "lockin", "timings")
        title = "Conductor Lock-In Load - 30 in vs 36 in conductor"
    else:
        from narration import SCRIPT, SCENE_ORDER
        tdir = os.path.join(HERE, "timings")
        title = "Restraining Wellhead Growth in a Subsea Well"
    texts = {bid: t for sc in SCRIPT.values() for bid, t in sc}
    clips, srt, offset, n = [], [], 0.0, 1
    for sc in SCENE_ORDER:
        path = os.path.join(a.media, "videos", FILES[sc], a.quality, f"{sc}.mp4")
        if not os.path.exists(path):
            raise SystemExit(f"missing {path}")
        clips.append(path)
        tim = json.load(open(os.path.join(tdir, f"{sc}.json")))
        for b in tim["beats"]:
            chunks = split_caption(texts[b["id"]])
            total = sum(len(c) for c in chunks)
            t = offset + b["start"]
            for c in chunks:
                dt = b["dur"] * len(c) / total
                srt.append(f"{n}\n{fmt(t + 0.05)} --> {fmt(t + dt - 0.05)}\n{c}\n")
                n += 1
                t += dt
        offset += duration(path)
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    work = os.path.join(os.path.dirname(os.path.abspath(a.out)), "_work")
    os.makedirs(work, exist_ok=True)
    padded = []
    for c in clips:
        # pad each scene's audio with silence to exactly its video length (prevents A/V drift on concat)
        p = os.path.join(work, os.path.basename(c))
        subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", c, "-af", "apad,aresample=48000",
                               "-c:v", "copy", "-c:a", "pcm_s16le", "-t", f"{duration(c):.3f}", p.replace(".mp4", ".mov")])
        padded.append(p.replace(".mp4", ".mov"))
    lst = os.path.join(work, "concat.txt")
    with open(lst, "w") as fh:
        for c in padded:
            fh.write(f"file '{c}'\n")
    srt_path = os.path.splitext(a.out)[0] + ".srt"
    with open(srt_path, "w") as fh:
        fh.write("\n".join(srt))
    tmp = os.path.splitext(a.out)[0] + "_concat.mp4"
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                           "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-tune", "animation",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                           "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-movflags", "+faststart", tmp])
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", srt_path, "-map", "0", "-map", "1",
                           "-c", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
                           "-metadata", f"title={title}",
                           "-movflags", "+faststart", a.out])
    os.remove(tmp)
    import shutil
    shutil.rmtree(work)
    print("wrote", a.out, f"{duration(a.out) / 60:.2f} min", f"{os.path.getsize(a.out) / 1e6:.1f} MB")
    print("subtitles", srt_path)


if __name__ == "__main__":
    main()
