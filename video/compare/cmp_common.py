"""Shared helpers for the free-vs-restrained comparison video."""
import json
import os
import sys

os.environ.setdefault("VIDEO_VARIANT", "compare")
_VID = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _VID not in sys.path:
    sys.path.insert(0, _VID)

from common import *  # noqa: F401,F403,E402
from common import ROOT  # noqa: E402

FREE_C = "#4DA8FF"
REST_C = "#FF6F61"
CMP = json.load(open(os.path.join(ROOT, "analysis", "results", "compare.json")))
SF = RES["base_free"]["summary"]
SR = RES["base_restrained"]["summary"]
PF = RES["partial20_free"]["summary"]
PR = RES["partial20_restrained"]["summary"]
HIST = RES["time_history"]
SWEEP = RES["restraint_sweep"]


def lock_icon(color=REST_C, s=1.0):
    body = RoundedRectangle(corner_radius=0.04 * s, width=0.32 * s, height=0.25 * s).set_fill(color, 1).set_stroke(width=0)
    arc = Arc(radius=0.105 * s, start_angle=0, angle=PI).set_stroke(color, 3.5 * s).next_to(body, UP, buff=-0.01)
    return VGroup(body, arc)


def up_icon(color=FREE_C, s=1.0):
    return Arrow(DOWN * 0.22 * s, UP * 0.22 * s, buff=0, color=color, stroke_width=5 * s, tip_length=0.14 * s,
                 max_tip_length_to_length_ratio=0.5)


def split_titles(y=3.08, x=3.55, size=22, divider=True, y_div=(2.8, -3.95)):
    lt = VGroup(up_icon(FREE_C, 0.9), T("FREE WELLHEAD", size, FREE_C, weight=BOLD)).arrange(RIGHT, buff=0.15).move_to([-x, y, 0])
    rt = VGroup(lock_icon(REST_C, 0.9), T("RESTRAINED WELLHEAD", size, REST_C, weight=BOLD)).arrange(RIGHT, buff=0.15).move_to([x, y, 0])
    g = VGroup(lt, rt)
    if divider:
        g.add(DashedLine([0, y_div[0], 0], [0, y_div[1], 0], stroke_color=GRID, stroke_width=2, dash_length=0.1))
    return g


def restraint_frame(cx, y_sb, half_w=1.45, top=1.6, color="#4A5568"):
    post_l = Rectangle(width=0.26, height=top - y_sb).set_fill(color, 1).set_stroke("#A0AEC0", 1.2)
    post_l.move_to([cx - half_w, (top + y_sb) / 2, 0])
    post_r = post_l.copy().move_to([cx + half_w, (top + y_sb) / 2, 0])
    beam = Rectangle(width=2 * half_w + 0.5, height=0.3).set_fill(color, 1).set_stroke("#A0AEC0", 1.2).move_to([cx, top + 0.15, 0])
    piles = VGroup(*[Rectangle(width=0.4, height=0.75).set_fill("#2D3748", 1).set_stroke("#718096", 1).move_to([cx + s * half_w, y_sb - 0.37, 0])
                     for s in (-1, 1)])
    return VGroup(piles, post_l, post_r, beam)


def interp_hist(key, t_h):
    import math as _m
    ts = [h["t_h"] for h in HIST]
    vs = [h[key] for h in HIST]
    lt = _m.log10(max(t_h, ts[0]))
    xs = [_m.log10(t) for t in ts]
    return float(np.interp(lt, xs, vs))
