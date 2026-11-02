"""Shared helpers for the conductor lock-in load video."""
import json
import os
import sys

os.environ["VIDEO_VARIANT"] = "lockin"
_LK = os.path.dirname(os.path.abspath(__file__))
_VID = os.path.dirname(_LK)
for p in (_VID, os.path.join(_VID, "compare")):
    if p not in sys.path:
        sys.path.insert(0, p)

from cmp_common import *  # noqa: F401,F403,E402
from common import ROOT  # noqa: E402

LK = json.load(open(os.path.join(ROOT, "analysis", "results", "lockin.json")))
LA, LB = LK["30x1"], LK["36x1.5"]
A_C = "#4DA8FF"     # 30" x 1" option
B_C = "#E879A6"     # 36" x 1.5" option
NAME_A = '30" × 1"'
NAME_B = '36" × 1.5"'


def stack_bar(x0, y, sc, parts, h=0.55, gap=0.03):
    """parts: list of (value, color, opacity). Returns VGroup of rects and the end x."""
    g = VGroup()
    x = x0
    for v, col, op in parts:
        w = max(v * sc - gap, 0.01)
        g.add(Rectangle(width=w, height=h).set_fill(col, op).set_stroke(width=0).move_to([x + w / 2, y, 0]))
        x += v * sc
    return g, x


def pill(text, color=ACCENT, size=18):
    t = T(text, size, INK)
    c = RoundedRectangle(corner_radius=0.16, width=t.width + 0.45, height=0.5).set_fill(PANEL, 1).set_stroke(color, 1.3)
    t.move_to(c)
    return VGroup(c, t)


def note_card(lines, width=6.2, color=GRID, title=None, tcol=INK):
    items = []
    if title:
        items.append(T(title, 20, tcol, weight=BOLD))
    items += [T(l, 17, INK) for l in lines]
    g = VGroup(*items).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
    box = RoundedRectangle(corner_radius=0.14, width=max(width, g.width + 0.6), height=g.height + 0.45).set_fill(PANEL, 1).set_stroke(color, 1.5)
    g.move_to(box).align_to(box, LEFT).shift(RIGHT * 0.3)
    return VGroup(box, g)
