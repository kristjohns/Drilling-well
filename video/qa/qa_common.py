"""Shared helpers for the Q&A part of the combined video."""
import os
import sys

os.environ["VIDEO_VARIANT"] = "qa"
_QA = os.path.dirname(os.path.abspath(__file__))
_VID = os.path.dirname(_QA)
for p in (_VID, os.path.join(_VID, "compare")):
    if p not in sys.path:
        sys.path.insert(0, p)

from cmp_common import *  # noqa: F401,F403,E402

QUESTIONS = {
    1: "How much of the restraint force is in the surface casing vs. the conductor?\nAnd why do they create such high forces?",
    2: "Doesn't length matter? I would think that with a longer pipe\nyou need to restrain a longer section of pipe.",
    3: "What is the buckling limit and the yield limit\nfor the different casings?",
    4: "You said the inner casings are already mostly locked in.\nExplain that more deeply.",
}


def question_card(n):
    tag = T(f"YOUR QUESTION {n}", 22, ACCENT, weight=BOLD)
    quote = T("“", 120, ACCENT, weight=BOLD)
    q = T(QUESTIONS[n], 32, INK, weight=BOLD, line_spacing=1.1)
    body = VGroup(tag, q).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
    quote.next_to(body, LEFT, buff=0.3).align_to(body, UP).shift(UP * 0.25)
    g = VGroup(quote, body)
    box = RoundedRectangle(corner_radius=0.2, width=g.width + 1.0, height=g.height + 0.8)
    box.set_fill(PANEL, 0.95).set_stroke(ACCENT, 2)
    box.move_to(g)
    card = VGroup(box, g)
    if card.width > 13.4:
        card.scale_to_fit_width(13.4)
    return card.move_to(ORIGIN)


def banner(n):
    tag = T(f"Q{n}", 24, BG, weight=BOLD)
    pill = RoundedRectangle(corner_radius=0.12, width=0.75, height=0.48).set_fill(ACCENT, 1).set_stroke(width=0)
    tag.move_to(pill)
    q = T(QUESTIONS[n].replace("\n", " "), 19, INK)
    if q.width > 12.4:
        q.scale_to_fit_width(12.4)
    g = VGroup(VGroup(pill, tag), q).arrange(RIGHT, buff=0.25)
    g.to_corner(UL, buff=0.35)
    line = Line([-6.8, g.get_bottom()[1] - 0.12, 0], [6.8, g.get_bottom()[1] - 0.12, 0], stroke_color=GRID, stroke_width=2)
    return VGroup(g, line)


class QAScene(VScene):
    def ask(self, n, bid):
        card = question_card(n)
        with self.voice(bid) as d:
            self.play(FadeIn(card[0], scale=0.95), run_time=0.6)
            self.play(Write(card[1][1][1]), FadeIn(card[1][0]), FadeIn(card[1][1][0]), run_time=min(0.6 * d, 3.5))
        b = banner(n)
        self.play(FadeTransform(card, b), run_time=0.9)
        return b
