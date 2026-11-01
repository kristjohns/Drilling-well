"""Assemble the combined video: Part 1 (explainer) + Part 2 (free vs restrained) + Part 3 (Q&A).

Scenes must already be rendered (1080p30).  Each scene clip is located by searching the
media roots given with --media.  Produces one MP4 with narration, soft English subtitles
and chapter markers, plus a sidecar .srt.

  python build_combined.py --media /tmp/hq /tmp/cmphq /tmp/qahq1 ... --out ../deliverables/x.mp4
"""
import argparse
import glob
import json
import os
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
for p in (HERE, os.path.join(HERE, "compare"), os.path.join(HERE, "qa")):
    sys.path.insert(0, p)
from build_video import duration, fmt, split_caption  # noqa: E402
import narration  # noqa: E402
import narration_cmp  # noqa: E402
import narration_qa  # noqa: E402

TIMINGS = {"main": os.path.join(HERE, "timings"), "compare": os.path.join(HERE, "compare", "timings"),
           "qa": os.path.join(HERE, "qa", "timings")}
TEXTS = {}
for mod in (narration, narration_cmp, narration_qa):
    for sc in mod.SCRIPT.values():
        for bid, t in sc:
            TEXTS[bid] = t

CH = {
    "P1_Card": "Part 1 - The physics",
    "S01_Intro": "1.1 The question", "S02_Architecture": "1.2 The well", "S03_Wellhead": "1.3 Wellhead load path",
    "S04_Temperature": "1.4 Temperature", "S05_ThermalStrain": "1.5 Thermal strain to stress",
    "S06_Springs": "1.6 How much does the wellhead move?", "S07_Restrained": "1.7 Restrain the wellhead",
    "S08_EffectiveForce": "1.8 Effective force and buckling", "S09_Helix": "1.9 Inside the helix",
    "S10_Verdict": "1.10 Is it a failure?", "S11_Partial20": "1.11 Uncemented 20 in", "S12_Summary": "1.12 Summary",
    "P2_Card": "Part 2 - Free vs. restrained",
    "C01_Intro": "2.1 Same well, one boundary condition", "C02_HeatUp": "2.2 Heat-up", "C03_Principle": "2.3 The principle",
    "C04_ForceBalance": "2.4 Forces on the wellhead", "C05_Foundation": "2.5 Conductor + surface casing",
    "C06_InnerStrings": "2.6 Inner casings and buckling", "C07_Scoreboard": "2.7 Scoreboard",
    "C08_Partial": "2.8 Partial restraint and load cycles", "C09_Surface20": "2.9 Uncemented 20 in",
    "C10_Conclusion": "2.10 The real difference",
    "P3_Card": "Part 3 - Your questions",
    "Q1_RestraintSplit": "Q1 Restraint force: conductor vs. surface casing", "Q2_Length": "Q2 Does length matter?",
    "Q3_Limits": "Q3 Buckling and yield limits", "Q4_LockedIn": "Q4 Why the inner casings are locked in",
    "Q5_Closing": "Closing",
}

SEGMENTS = ([("qa", "P1_Card")] + [("main", s) for s in narration.SCENE_ORDER] + [("qa", "P2_Card")]
            + [("compare", s) for s in narration_cmp.SCENE_ORDER] + [("qa", "P3_Card")]
            + [("qa", s) for s in ("Q1_RestraintSplit", "Q2_Length", "Q3_Limits", "Q4_LockedIn", "Q5_Closing")])


def find_clip(roots, scene):
    hits = []
    for r in roots:
        hits += glob.glob(os.path.join(r, "videos", "*", "1080p30", f"{scene}.mp4"))
    if not hits:
        raise SystemExit(f"clip not found for {scene}")
    return max(hits, key=os.path.getmtime)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--media", nargs="+", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--crf", default="21")
    a = ap.parse_args()
    out_dir = os.path.dirname(os.path.abspath(a.out))
    work = os.path.join(out_dir, "_work_combined")
    os.makedirs(work, exist_ok=True)
    srt, chapters, padded = [], [], []
    offset, n = 0.0, 1
    for variant, sc in SEGMENTS:
        clip = find_clip(a.media, sc)
        dur = duration(clip)
        tim = json.load(open(os.path.join(TIMINGS[variant], f"{sc}.json")))
        for b in tim["beats"]:
            chunks = split_caption(TEXTS[b["id"]])
            tot = sum(len(c) for c in chunks)
            t = offset + b["start"]
            for c in chunks:
                dt = b["dur"] * len(c) / tot
                srt.append(f"{n}\n{fmt(t + 0.05)} --> {fmt(t + dt - 0.05)}\n{c}\n")
                n += 1
                t += dt
        chapters.append((offset, offset + dur, CH.get(sc, sc)))
        p = os.path.join(work, f"{len(padded):02d}_{sc}.mov")
        subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", clip, "-af", "apad,aresample=48000",
                               "-c:v", "copy", "-c:a", "pcm_s16le", "-t", f"{dur:.3f}", p])
        padded.append(p)
        print(f"{sc:20s} {offset / 60:6.2f} min  +{dur:6.1f}s")
        offset += dur
    lst = os.path.join(work, "concat.txt")
    with open(lst, "w") as fh:
        fh.writelines(f"file '{p}'\n" for p in padded)
    srt_path = os.path.splitext(a.out)[0] + ".srt"
    open(srt_path, "w").write("\n".join(srt))
    meta = os.path.join(work, "chapters.txt")
    with open(meta, "w") as fh:
        fh.write(";FFMETADATA1\ntitle=Restrained Wellhead Growth in a Subsea Well - complete\n")
        for s0, s1, title in chapters:
            fh.write(f"\n[CHAPTER]\nTIMEBASE=1/1000\nSTART={int(s0 * 1000)}\nEND={int(s1 * 1000)}\ntitle={title}\n")
    tmp = os.path.join(work, "concat.mp4")
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", lst,
                           "-c:v", "libx264", "-preset", "medium", "-crf", a.crf, "-tune", "animation",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-ar", "48000",
                           "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-movflags", "+faststart", tmp])
    subprocess.check_call(["ffmpeg", "-v", "error", "-y", "-i", tmp, "-i", srt_path, "-i", meta,
                           "-map", "0", "-map", "1", "-map_metadata", "2", "-map_chapters", "2",
                           "-c", "copy", "-c:s", "mov_text", "-metadata:s:s:0", "language=eng",
                           "-movflags", "+faststart", a.out])
    shutil.rmtree(work)
    print("wrote", a.out, f"{duration(a.out) / 60:.2f} min", f"{os.path.getsize(a.out) / 1e6:.1f} MB")


if __name__ == "__main__":
    main()
