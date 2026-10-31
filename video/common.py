"""Shared helpers for the explainer video (Manim Community)."""
from __future__ import annotations

import json
import math
import os
from contextlib import contextmanager

import numpy as np
from manim import *  # noqa: F401,F403

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
VARIANT = os.environ.get("VIDEO_VARIANT", "main")      # "main" or "compare"
_VDIR = os.path.join(HERE, "compare") if VARIANT == "compare" else HERE
AUDIO = os.path.join(_VDIR, "audio")
DUR = json.load(open(os.path.join(AUDIO, "durations.json")))
RES = json.load(open(os.path.join(ROOT, "analysis", "results", "results.json")))
TIMING_DIR = os.path.join(_VDIR, "timings")
os.makedirs(TIMING_DIR, exist_ok=True)

# ------------------------------------------------------------------ palette
BG = "#0B1220"
PANEL = "#111B2E"
GRID = "#22324D"
INK = "#E8EEF7"
MUTED = "#8FA3BF"
FAINT = "#4C5D78"
ACCENT = "#FFD166"
HOT = "#FF6B4A"
COLD = "#4CC9F0"
COMP = "#FF5E5B"      # compression
TENS = "#3DD6D0"      # tension
GOOD = "#7BD389"

C30 = "#AEB8C6"       # conductor
C20 = "#4FB3BF"       # surface casing
C1338 = "#F2B134"     # intermediate
C958 = "#EF7A5A"      # production casing
C7 = "#9AA7C7"        # liner
CTBG = "#B79CFF"      # tubing
CEMENT = "#8D8B83"
MUD = "#6B5236"
BRINE = "#1F5F86"
SEA_TOP = "#0F3B5F"
SEA_BOT = "#0A2236"
ROCK = "#2A2018"
ROCK2 = "#33271D"

FONT = "Inter"
MONO = "DejaVu Sans Mono"

config.background_color = BG

STR_COLORS = {"30": C30, "20": C20, "13-3/8": C1338, "9-5/8": C958, "7": C7, "tubing": CTBG}
STR_NAMES = {"30": '30" conductor', "20": '20" surface', "13-3/8": '13⅜" intermediate',
             "9-5/8": '9⅝" production', "7": '7" liner', "tubing": '5½" tubing'}


def T(text, size=26, color=INK, weight=NORMAL, **kw):
    return Text(text, font=FONT, font_size=size, color=color, weight=weight, **kw)


def M(tex, size=36, color=INK, **kw):
    return MathTex(tex, font_size=size, color=color, **kw)


def temp_color(dT, vmax=105.0):
    """Cold -> hot colour map for temperature rise."""
    stops = [(0.0, "#2E5BFF"), (0.25, "#2EC4D6"), (0.5, "#F5E663"), (0.75, "#FF8A3D"), (1.0, "#E8283C")]
    x = float(np.clip(dT / vmax, 0, 1))
    for (a, ca), (b, cb) in zip(stops[:-1], stops[1:]):
        if x <= b:
            return interpolate_color(ManimColor(ca), ManimColor(cb), (x - a) / (b - a))
    return ManimColor(stops[-1][1])


# ------------------------------------------------------------------ base scene
class VoiceMixin:
    """Adds narration clips and logs their start times for subtitles."""

    def setup_voice(self):
        self._timings = []

    @contextmanager
    def voice(self, bid, gap=0.45):
        dur = DUR[bid]
        t0 = self.renderer.time
        self.add_sound(os.path.join(AUDIO, f"{bid}.wav"))
        self._timings.append(dict(id=bid, start=t0, dur=dur))
        yield dur
        el = self.renderer.time - t0
        if el < dur + gap:
            self.wait(dur + gap - el)

    def save_timings(self):
        with open(os.path.join(TIMING_DIR, f"{type(self).__name__}.json"), "w") as fh:
            json.dump(dict(scene=type(self).__name__, total=self.renderer.time,
                           beats=self._timings), fh, indent=1)


class VScene(VoiceMixin, Scene):
    def setup(self):
        self.setup_voice()

    def header(self, num, title):
        n = T(f"{num:02d}", 22, ACCENT, weight=BOLD)
        t = T(title.upper(), 22, MUTED, weight=MEDIUM)
        g = VGroup(n, t).arrange(RIGHT, buff=0.25)
        g.to_corner(UL, buff=0.38)
        line = Line(g.get_left() + DOWN * 0.28, g.get_left() + DOWN * 0.28 + RIGHT * 1.2,
                    stroke_color=ACCENT, stroke_width=2)
        self.add(g, line)
        return VGroup(g, line)

    def tear_down(self):
        self.save_timings()
        super().tear_down()


class V3Scene(VoiceMixin, ThreeDScene):
    def setup(self):
        self.setup_voice()

    def tear_down(self):
        self.save_timings()
        super().tear_down()


# ------------------------------------------------------------------ well schematic
class DepthMap:
    """Non-linear (power-law) depth axis for the schematic: expands the top."""

    def __init__(self, y_seabed=2.3, y_bottom=-3.65, z_max=3600.0, p=0.6):
        self.ys, self.yb, self.zm, self.p = y_seabed, y_bottom, z_max, p

    def __call__(self, z):
        return self.ys - (self.ys - self.yb) * (max(z, 0.0) / self.zm) ** self.p


_S = 1.2
SCH = {k: v * _S for k, v in dict(  # half-widths in screen units
    hole36=1.00, c30o=0.86, c30i=0.80,
    hole26=0.70, c20o=0.60, c20i=0.555,
    hole17=0.48, c1338o=0.40, c1338i=0.365,
    hole12=0.31, c958o=0.245, c958i=0.212,
    hole8=0.20, c7o=0.16, c7i=0.135,
    tbgo=0.085, tbgi=0.064,
).items()}

WELL = dict(shoe30=80, shoe20=700, toc20=0, shoe1338=1800, toc1338=1300,
            shoe958=3250, toc958=2550, liner_top=3150, shoe7=3600, packer=3100, z_res=3400)


def band(x0, x1, y0, y1, color, opacity=1.0, stroke=0.0):
    r = Polygon([x0, y0, 0], [x1, y0, 0], [x1, y1, 0], [x0, y1, 0],
                fill_color=color, fill_opacity=opacity, stroke_width=stroke, stroke_color=color)
    return r


def build_well(xc=-3.4, dm: DepthMap | None = None, z_cut=3600.0):
    """Return dict of VGroups for the full well schematic."""
    dm = dm or DepthMap()
    W = SCH
    y = dm
    parts = {}
    # ocean + seabed + formation
    sea = Rectangle(width=config.frame_width, height=4.2 - y(0)).move_to([0, (4.0 + y(0)) / 2, 0])
    sea.set_fill(color=[SEA_TOP, SEA_BOT], opacity=1).set_stroke(width=0)
    sea.set_sheen_direction(DOWN)
    rock = Rectangle(width=config.frame_width, height=y(0) + 4.0).move_to([0, (y(0) - 4.0) / 2, 0])
    rock.set_fill(ROCK, 1).set_stroke(width=0)
    strata = VGroup()
    rng = np.random.default_rng(3)
    for zz in [150, 420, 900, 1250, 1600, 2100, 2400, 2900, 3300]:
        yy = y(zz)
        pts = [[x, yy + 0.04 * math.sin(1.3 * x + zz), 0] for x in np.linspace(-7.2, 7.2, 30)]
        strata.add(VMobject().set_points_smoothly(pts).set_stroke(ROCK2, 2.5, opacity=0.9))
    res = band(-7.2, 7.2, y(3330), y(3480), "#5B3A1E", 0.55)
    res_lbl = T("reservoir", 18, "#C99A6B").move_to([xc + 2.0, y(3405), 0])
    seabed = Line([-7.2, y(0), 0], [7.2, y(0), 0], stroke_color="#7A6A55", stroke_width=3)
    parts["env"] = VGroup(sea, rock, strata, res, seabed)
    parts["res_lbl"] = res_lbl

    def pair(xo, xi, z0, z1, color, opacity=1.0):
        a = band(xc - xo, xc - xi, y(z0), y(z1), color, opacity)
        b = band(xc + xi, xc + xo, y(z0), y(z1), color, opacity)
        return VGroup(a, b)

    def shoe(xo, z, color):
        yy = y(z)
        a = Polygon([xc - xo - 0.06, yy, 0], [xc - xo + 0.02, yy, 0], [xc - xo + 0.02, yy + 0.09, 0],
                    fill_color=color, fill_opacity=1, stroke_width=0)
        b = a.copy().flip(UP, about_point=[xc, 0, 0])
        return VGroup(a, b)

    # open hole (dark gaps) ------------------------------------------------
    holes = VGroup(
        pair(W["hole36"], 0, 0, WELL["shoe30"], "#120D09"),
        pair(W["hole26"], 0, WELL["shoe30"], WELL["shoe20"], "#120D09"),
        pair(W["hole17"], 0, WELL["shoe20"], WELL["shoe1338"], "#120D09"),
        pair(W["hole12"], 0, WELL["shoe1338"], WELL["shoe958"], "#120D09"),
        pair(W["hole8"], 0, WELL["shoe958"], WELL["shoe7"], "#120D09"),
    )
    parts["holes"] = holes
    # cement ---------------------------------------------------------------
    cem = {}
    cem["30"] = pair(W["hole36"], W["c30o"], 0, WELL["shoe30"], CEMENT, 0.85)
    cem["20"] = VGroup(pair(W["c30i"], W["c20o"], 0, WELL["shoe30"], CEMENT, 0.85),
                       pair(W["hole26"], W["c20o"], WELL["shoe30"], WELL["shoe20"], CEMENT, 0.85))
    cem["13-3/8"] = pair(W["hole17"], W["c1338o"], WELL["toc1338"], WELL["shoe1338"], CEMENT, 0.85)
    cem["9-5/8"] = pair(W["hole12"], W["c958o"], WELL["toc958"], WELL["shoe958"], CEMENT, 0.85)
    cem["7"] = pair(W["hole8"], W["c7o"], WELL["liner_top"], WELL["shoe7"], CEMENT, 0.85)
    parts["cement"] = cem
    # annulus fluids -------------------------------------------------------
    ann = {}
    ann["C"] = VGroup(pair(W["c20i"], W["c1338o"], 0, WELL["shoe20"], MUD, 0.75),
                      pair(W["hole17"], W["c1338o"], WELL["shoe20"], WELL["toc1338"], MUD, 0.75))
    ann["B"] = VGroup(pair(W["c1338i"], W["c958o"], 0, WELL["shoe1338"], "#7A5A33", 0.75),
                      pair(W["hole12"], W["c958o"], WELL["shoe1338"], WELL["toc958"], "#7A5A33", 0.75))
    ann["A"] = pair(W["c958i"], W["tbgo"], 0, WELL["packer"], BRINE, 0.85)
    parts["ann"] = ann
    # steel ----------------------------------------------------------------
    st = {}
    st["30"] = VGroup(pair(W["c30o"], W["c30i"], -0.0, WELL["shoe30"], C30), shoe(W["c30o"], WELL["shoe30"], C30))
    st["20"] = VGroup(pair(W["c20o"], W["c20i"], 0, WELL["shoe20"], C20), shoe(W["c20o"], WELL["shoe20"], C20))
    st["13-3/8"] = VGroup(pair(W["c1338o"], W["c1338i"], 0, WELL["shoe1338"], C1338),
                          shoe(W["c1338o"], WELL["shoe1338"], C1338))
    st["9-5/8"] = VGroup(pair(W["c958o"], W["c958i"], 0, WELL["shoe958"], C958),
                         shoe(W["c958o"], WELL["shoe958"], C958))
    st["7"] = VGroup(pair(W["c7o"], W["c7i"], WELL["liner_top"], WELL["shoe7"], C7),
                     shoe(W["c7o"], WELL["shoe7"], C7))
    st["tubing"] = pair(W["tbgo"], W["tbgi"], 0, WELL["packer"] + 30, CTBG)
    pk = VGroup(band(xc - W["c958i"], xc - W["tbgo"], y(WELL["packer"]) + 0.03, y(WELL["packer"]) - 0.03, "#D9D9D9"),
                band(xc + W["tbgo"], xc + W["c958i"], y(WELL["packer"]) + 0.03, y(WELL["packer"]) - 0.03, "#D9D9D9"))
    st["packer"] = pk
    parts["steel"] = st
    # wellhead stack (schematic) ------------------------------------------
    y0 = y(0)
    lp = RoundedRectangle(corner_radius=0.04, width=2 * 1.05, height=0.28).move_to([xc, y0 + 0.10, 0])
    lp.set_fill("#6F7C8E", 1).set_stroke("#AEB8C6", 1.2)
    hp = RoundedRectangle(corner_radius=0.04, width=2 * 0.74, height=0.42).move_to([xc, y0 + 0.40, 0])
    hp.set_fill("#8C99AB", 1).set_stroke("#D0D8E2", 1.2)
    xt = RoundedRectangle(corner_radius=0.06, width=1.9, height=0.62).move_to([xc, y0 + 0.92, 0])
    xt.set_fill("#2F5D7C", 1).set_stroke("#9CC7E6", 1.4)
    xt_lbl = T("XT", 18, INK, weight=BOLD).move_to(xt)
    spool = band(xc + 0.95, xc + 1.9, y0 + 0.86, y0 + 0.98, "#9CC7E6", 0.9)
    parts["wh"] = VGroup(lp, hp, xt, xt_lbl, spool)
    parts["wh_parts"] = dict(lp=lp, hp=hp, xt=xt)
    parts["y"] = y
    parts["xc"] = xc
    return parts


def depth_ticks(dm, x, depths, size=16, side=LEFT):
    g = VGroup()
    for z in depths:
        yy = dm(z)
        tick = Line([x - 0.08, yy, 0], [x + 0.08, yy, 0], stroke_color=MUTED, stroke_width=1.5)
        lbl = T(f"{z:,.0f} m", size, MUTED).next_to(tick, side, buff=0.08)
        g.add(VGroup(tick, lbl))
    return g


# ------------------------------------------------------------------ buckled pipe (2-D projection)
def buckled_pipe(xc, y_top, y_bot, half_w, color, amp, pitch, mode="helix", n=360,
                 phase=0.0, depth_shade=0.55, amp_profile=None, pitch_profile=None,
                 z_index_front=3, z_index_back=1):
    """Pipe drawn as many quads; for helix, back half dimmer.

    amp, pitch in screen units.  amp_profile(s) in [0,1] modulates amplitude
    along the normalised length s (0 top .. 1 bottom); pitch_profile(s) the pitch.
    """
    s = np.linspace(0, 1, n + 1)
    L = y_top - y_bot
    a = amp * (np.array([amp_profile(v) for v in s]) if amp_profile else np.ones_like(s))
    if pitch_profile:
        p = np.array([pitch_profile(v) for v in s]) * pitch
    else:
        p = np.full_like(s, pitch)
    ph = phase + np.concatenate([[0], np.cumsum(2 * np.pi * np.diff(s) * L / np.maximum(p[1:], 1e-6))])
    yv = y_top - s * L
    if mode == "helix":
        xv = xc + a * np.sin(ph)
        dv = np.cos(ph)              # +1 front, -1 back
    else:
        xv = xc + a * np.sin(ph)
        dv = np.ones_like(ph)
    g = VGroup()
    base = ManimColor(color)
    dark = interpolate_color(base, ManimColor(BG), depth_shade)
    for i in range(n):
        x0, y0, x1, y1 = xv[i], yv[i], xv[i + 1], yv[i + 1]
        # horizontal slicing: correct for a near-vertical pipe whose axis wanders sideways
        nx, ny = half_w, 0.0
        d = 0.5 * (dv[i] + dv[i + 1])
        col = interpolate_color(dark, base, 0.5 * (d + 1)) if mode == "helix" else base
        q = Polygon([x0 - nx, y0 - ny, 0], [x1 - nx, y1 - ny, 0], [x1 + nx, y1 + ny, 0],
                    [x0 + nx, y0 + ny, 0], fill_color=col, fill_opacity=1, stroke_width=1.6, stroke_color=col)
        q.set_z_index(z_index_front if d >= 0 else z_index_back)
        g.add(q)
    # highlight stripe for a tubular look
    return g


def arrow(a, b, color=INK, sw=4, tip=0.18, **kw):
    return Arrow(a, b, buff=0, stroke_width=sw, color=color, max_tip_length_to_length_ratio=0.35,
                 tip_length=tip, **kw)


def card(width, height, color=PANEL, opacity=0.92, stroke=GRID):
    r = RoundedRectangle(corner_radius=0.14, width=width, height=height)
    r.set_fill(color, opacity).set_stroke(stroke, 1.2)
    return r


def bar_pair(label, v1, v2, vmax, length=4.0, c1=MUTED, c2=COMP, unit="", fmt="{:.2f}", size=20):
    """Two horizontal bars (free vs restrained)."""
    lbl = T(label, size, INK)
    b1 = Rectangle(width=max(length * abs(v1) / vmax, 0.01), height=0.22).set_fill(c1, 0.9).set_stroke(width=0)
    b2 = Rectangle(width=max(length * abs(v2) / vmax, 0.01), height=0.22).set_fill(c2, 0.95).set_stroke(width=0)
    return lbl, b1, b2


def S(key, case="base_restrained"):
    return RES[case]["summary"][key]


def prof(key, case="base_restrained"):
    return RES[case]["profiles"][key]
