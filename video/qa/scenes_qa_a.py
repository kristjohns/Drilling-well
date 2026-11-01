"""Combined video: part cards, Q1 (restraint split), Q2 (length)."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa_common import *  # noqa: F401,F403,E402


def part_chip(num, title, active):
    col = ACCENT if active else FAINT
    n = T(str(num), 30, col, weight=BOLD)
    t = T(title, 24, INK if active else MUTED, weight=BOLD if active else NORMAL)
    g = VGroup(n, t).arrange(RIGHT, buff=0.3)
    box = RoundedRectangle(corner_radius=0.16, width=4.1, height=0.95).set_fill(PANEL, 1).set_stroke(col, 2 if active else 1)
    g.move_to(box)
    return VGroup(box, g)


PARTS = [(1, "The physics"), (2, "Free vs. restrained"), (3, "Your questions")]


def part_row(active):
    return VGroup(*[part_chip(n, t, n == active) for n, t in PARTS]).arrange(RIGHT, buff=0.3)


class P1_Card(VScene):
    def construct(self):
        title = T("Restrained Wellhead Growth", 54, INK, weight=BOLD)
        sub = T("in a subsea well  ·  standard API casing  ·  worked example", 26, "#BFD3EA")
        g = VGroup(title, sub).arrange(DOWN, buff=0.25).move_to([0, 1.5, 0])
        line = Line([-3.5, 0.55, 0], [3.5, 0.55, 0], stroke_color=ACCENT, stroke_width=3)
        row0 = part_row(0).move_to([0, -1.0, 0])
        row1 = part_row(1).move_to([0, -1.0, 0])
        with self.voice("part_1") as d:
            self.play(FadeIn(g, shift=UP * 0.2), Create(line), run_time=1.5)
            self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.15) for c in row0], lag_ratio=0.5), run_time=0.45 * d)
            self.wait(0.25 * d)
            self.play(Transform(row0, row1), run_time=0.8)
        self.wait(0.6)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class P2_Card(VScene):
    def construct(self):
        big = T("Part 2", 64, ACCENT, weight=BOLD)
        sub = VGroup(T("Free", 40, FREE_C, weight=BOLD), T("vs.", 40, MUTED), T("restrained", 40, REST_C, weight=BOLD),
                     T("— side by side", 40, INK)).arrange(RIGHT, buff=0.25)
        g = VGroup(big, sub).arrange(DOWN, buff=0.35).move_to([0, 0.8, 0])
        row = part_row(2).move_to([0, -1.9, 0])
        with self.voice("part_2"):
            self.play(FadeIn(big, scale=1.1), FadeIn(sub, shift=UP * 0.15), FadeIn(row), run_time=1.6)
        self.wait(1.2)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class P3_Card(VScene):
    def construct(self):
        big = T("Part 3", 64, ACCENT, weight=BOLD)
        sub = T("Your questions", 40, INK, weight=BOLD)
        g = VGroup(big, sub).arrange(DOWN, buff=0.3).move_to([0, 2.0, 0])
        qs = VGroup()
        for n in (1, 2, 3, 4):
            pill = RoundedRectangle(corner_radius=0.1, width=0.65, height=0.42).set_fill(ACCENT, 1).set_stroke(width=0)
            tg = T(f"Q{n}", 20, BG, weight=BOLD).move_to(pill)
            q = T(QUESTIONS[n].replace("\n", " "), 18, INK)
            if q.width > 11.5:
                q.scale_to_fit_width(11.5)
            qs.add(VGroup(VGroup(pill, tg), q).arrange(RIGHT, buff=0.25))
        qs.arrange(DOWN, aligned_edge=LEFT, buff=0.3).move_to([0, -1.0, 0])
        with self.voice("part_3"):
            self.play(FadeIn(big, scale=1.1), FadeIn(sub, shift=UP * 0.15), run_time=1.2)
        self.play(LaggedStart(*[FadeIn(q_, shift=RIGHT * 0.2) for q_ in qs], lag_ratio=0.4), run_time=2.2)
        self.wait(2.0)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class Q1_RestraintSplit(QAScene):
    def construct(self):
        b = self.ask(1, "q1_q")
        comp = SR["foundation"]["comp_top_MN"]
        parts = [('30" conductor', -comp["30"], C30), ('20" surface', -comp["20"], C20),
                 ("cement", -(comp["cement30"] + comp["cement20"]), CEMENT),
                 ('13⅜"', -SR["13-3/8"]["dFa_MN"], C1338), ('9⅝"', -SR["9-5/8"]["dFa_MN"], C958),
                 ('5½"', -SR["tubing"]["dFa_MN"], CTBG)]
        tot = sum(p[1] for p in parts)
        W = 12.6
        x = -6.3
        yb = 1.75
        segs, labs = VGroup(), VGroup()
        for i, (nm, v, col) in enumerate(parts):
            w = W * v / tot
            r = Rectangle(width=w, height=0.55).set_fill(col, 1).set_stroke(BG, 2).move_to([x + w / 2, yb, 0])
            segs.add(r)
            lab = VGroup(T(nm, 15, INK, weight=BOLD), T(f"{v:.1f} MN · {100 * v / tot:.0f} %", 14, MUTED)).arrange(DOWN, buff=0.03)
            if w < 1.6:
                lab.scale(0.85)
            lab.next_to(r, UP if i == len(parts) - 1 else DOWN, buff=0.1)
            if i == len(parts) - 1:
                lab.shift(LEFT * 0.35)
            labs.add(lab)
            x += w
        ttl = T(f"restraint force {tot:.1f} MN — where it comes from (seabed level)", 18, MUTED).move_to([0, 2.55, 0])
        with self.voice("q1_a1") as d:
            self.play(FadeIn(ttl), run_time=0.6)
            self.play(LaggedStart(*[GrowFromEdge(s, LEFT) for s in segs], lag_ratio=0.25), run_time=0.35 * d)
            self.play(LaggedStart(*[FadeIn(l_) for l_ in labs], lag_ratio=0.2), run_time=0.25 * d)
            f_total = sum(p[1] for p in parts[:3])
            br1 = Brace(VGroup(*segs[:3]), DOWN, color=REST_C).shift(DOWN * 0.75)
            bl1 = T(f"conductor + surface casing + cement: {f_total:.1f} MN ({100 * f_total / tot:.0f} %)", 17, REST_C, weight=BOLD).next_to(br1, DOWN, buff=0.08)
            br2 = Brace(VGroup(*segs[3:]), DOWN, color=C1338).shift(DOWN * 0.75)
            bl2 = T(f"inner strings: {tot - f_total:.1f} MN", 17, C1338, weight=BOLD).next_to(br2, DOWN, buff=0.08)
            self.play(GrowFromCenter(br1), FadeIn(bl1), GrowFromCenter(br2), FadeIn(bl2), run_time=0.2 * d)
        # ------------------------------------------------ stress per degree
        with self.voice("q1_a2") as d:
            self.play(FadeOut(VGroup(br1, bl1, br2, bl2)), run_time=0.5)
            eq = M(r"\sigma = E\,\alpha\,\Delta T \approx 2.57\ \mathrm{MPa}/^{\circ}\mathrm{C} \times \Delta T", 32, INK).move_to([-3.4, -0.05, 0])
            self.play(Write(eq), run_time=0.25 * d)
            rows = VGroup()
            for i, (nm, dT, col) in enumerate([('30" conductor', 60.7, C30), ('20" surface', 74.8, C20)]):
                yy = -1.0 - 0.95 * i
                nm_ = T(nm, 18, col, weight=BOLD).move_to([-6.0, yy, 0], aligned_edge=LEFT)
                th = Rectangle(width=dT / 100 * 2.0, height=0.32).set_fill(temp_color(dT), 1).set_stroke(width=0)
                th.move_to([-3.75 + th.width / 2, yy, 0])
                tl = T(f"ΔT {dT:.0f} °C", 16, INK).next_to(th, RIGHT, buff=0.1)
                ar = T("→", 22, MUTED).move_to([-0.75, yy, 0])
                st = T(f"{2.567 * dT:.0f} MPa", 22, REST_C, weight=BOLD).move_to([-0.45, yy, 0], aligned_edge=LEFT)
                rows.add(VGroup(nm_, th, tl, ar, st))
            for r_ in rows:
                self.play(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[2]), run_time=0.12 * d)
                self.play(FadeIn(r_[3]), FadeIn(r_[4], shift=RIGHT * 0.1), run_time=0.12 * d)
            note = T("if fully blocked, just below the seabed", 15, MUTED).move_to([-3.4, -2.95, 0])
            self.play(FadeIn(note), run_time=0.3)
        # ------------------------------------------------ area
        with self.voice("q1_a3") as d:
            ft = M(r"F = \sigma \times A_{steel}", 34, INK).move_to([3.4, 0.0, 0])
            self.play(Write(ft), run_time=0.12 * d)
            rings = VGroup()
            specs = [(762.0 / 2, 711.2 / 2, C30, '30" × 1"', "588 cm²", "151 kN/°C"),
                     (508.0 / 2, 475.7 / 2, C20, '20" 133 ppf', "249 cm²", "64 kN/°C"),
                     (339.7 / 2, 313.6 / 2, C1338, '13⅜" 72 ppf', "134 cm²", "34 kN/°C")]
            sc = 0.85 / 381.0
            xs = [1.9, 4.2, 6.15]
            for (ro, ri, col, nm, ar, kc), x_ in zip(specs, xs):
                a_ = Annulus(inner_radius=ri * sc, outer_radius=ro * sc, fill_color=col, fill_opacity=1, stroke_width=0).move_to([x_, -1.65, 0])
                l1 = T(nm, 15, col, weight=BOLD).next_to(a_, UP, buff=0.12)
                l2 = VGroup(T(ar, 16, INK), T(kc, 17, REST_C, weight=BOLD)).arrange(DOWN, buff=0.04).next_to([x_, -2.6, 0], DOWN, buff=0.0)
                rings.add(VGroup(a_, l1, l2))
            self.play(LaggedStart(*[GrowFromCenter(r_[0]) for r_ in rings], lag_ratio=0.3), *[FadeIn(r_[1]) for r_ in rings], run_time=0.3 * d)
            self.play(LaggedStart(*[FadeIn(r_[2], shift=UP * 0.1) for r_ in rings], lag_ratio=0.3), run_time=0.3 * d)
            x44 = T("30\" = 4.4 × the\nsteel of 13⅜\"", 15, ACCENT, weight=BOLD).move_to([6.25, 0.0, 0])
            self.play(FadeIn(x44, scale=1.3), run_time=0.15 * d)
        with self.voice("q1_a4") as d:
            cards = VGroup()
            for txt, col in (("held sideways by cement + soil → cannot buckle to shed load", INK),
                             ("very stiff → every mm of growth prevented costs ≈ 0.32 MN", REST_C)):
                t_ = T(txt, 19, col, weight=BOLD)
                c_ = RoundedRectangle(corner_radius=0.12, width=t_.width + 0.5, height=0.55).set_fill(PANEL, 1).set_stroke(col, 1.5)
                t_.move_to(c_)
                cards.add(VGroup(c_, t_))
            cards.arrange(RIGHT, buff=0.3).move_to([0, -3.55, 0])
            if cards.width > 13.6:
                cards.scale_to_fit_width(13.6)
            self.play(FadeOut(note), LaggedStart(*[FadeIn(c_, shift=UP * 0.15) for c_ in cards], lag_ratio=0.5), run_time=0.5 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class Q2_Length(QAScene):
    def construct(self):
        b = self.ask(2, "q2_q")
        with self.voice("q2_a1") as d:
            l1 = VGroup(M(r"\delta_{free} = \alpha\,L\,\Delta T", 40, INK), T("grows with L", 20, FREE_C)).arrange(RIGHT, buff=0.5)
            l2 = VGroup(M(r"k = \frac{E\,A}{L}", 40, INK), T("falls with L", 20, REST_C)).arrange(RIGHT, buff=0.5)
            l3 = MathTex(r"F = k\,\delta = \frac{E\,A}{", r"L", r"}\cdot \alpha\,", r"L", r"\,\Delta T = ", r"E\,A\,\alpha\,\Delta T",
                         font_size=46, color=INK)
            l3[5].set_color(ACCENT)
            grp = VGroup(l1, l2, l3).arrange(DOWN, buff=0.45).move_to([0, 0.3, 0])
            l1.align_to(l3, LEFT)
            l2.align_to(l3, LEFT)
            self.play(FadeIn(l1, shift=UP * 0.1), run_time=0.2 * d)
            self.play(FadeIn(l2, shift=UP * 0.1), run_time=0.2 * d)
            self.play(Write(l3), run_time=0.2 * d)
            x1 = Line(l3[1].get_corner(DL), l3[1].get_corner(UR), stroke_color=REST_C, stroke_width=5)
            x2 = Line(l3[3].get_corner(DL), l3[3].get_corner(UR), stroke_color=REST_C, stroke_width=5)
            cancel = T("the length cancels", 24, ACCENT, weight=BOLD).next_to(l3, DOWN, buff=0.45)
            self.play(Create(x1), Create(x2), FadeIn(cancel), Circumscribe(l3[5], color=ACCENT), run_time=0.25 * d)
        with self.voice("q2_a2") as d:
            self.play(FadeOut(VGroup(l1, l2, cancel, x1, x2)), l3.animate.scale(0.6).move_to([3.6, 2.45, 0]), run_time=0.8)
            data = [(1300, 9.6, "1,300 m", "wants 1.14 m", "k = 2.1 MN/m"),
                    (650, 4.8, "650 m", "wants 0.57 m", "k = 4.3 MN/m"),
                    (10, 0.35, "10 m", "wants 9 mm", "k = 277 MN/m")]
            rows = VGroup()
            for i, (L_, w, lab, want, kk) in enumerate(data):
                yy = 1.15 - 1.25 * i
                x0 = -5.0
                wl = Rectangle(width=0.18, height=0.75).set_fill(FAINT, 1).set_stroke(width=0).move_to([x0 - 0.09, yy, 0])
                bar = Rectangle(width=w, height=0.32).set_fill(temp_color(75), 1).set_stroke(width=0).move_to([x0 + w / 2, yy, 0])
                wr = wl.copy().move_to([x0 + w + 0.09, yy, 0])
                arrs = VGroup(arrow([x0 + 0.05 + min(0.9, w * 0.4), yy + 0.36, 0], [x0 + 0.05, yy + 0.36, 0], REST_C, 4, 0.12),
                              arrow([x0 + w - 0.05 - min(0.9, w * 0.4), yy + 0.36, 0], [x0 + w - 0.05, yy + 0.36, 0], REST_C, 4, 0.12)) if w > 1 else VGroup()
                nm = T(lab, 18, INK, weight=BOLD).next_to(wl, LEFT, buff=0.15)
                info = T(f"{want}  ·  {kk}", 15, MUTED).next_to(bar, DOWN, buff=0.12).align_to(bar, LEFT)
                fz = T("2.43 MN", 20, REST_C, weight=BOLD).move_to([5.95, yy, 0])
                rows.add(VGroup(wl, bar, wr, arrs, nm, info, fz))
            hdr2 = T("force to hold it", 15, MUTED).move_to([5.95, 1.75, 0])
            self.play(FadeIn(hdr2), LaggedStart(*[AnimationGroup(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[2]), FadeIn(r_[4]))
                                                   for r_ in rows], lag_ratio=0.3), run_time=0.3 * d)
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[3]), FadeIn(r_[5]), FadeIn(r_[6], scale=1.2)) for r_ in rows], lag_ratio=0.3),
                      run_time=0.3 * d)
            same = T("same 13⅜\" pipe, same ΔT (71 °C): same force at every length", 18, ACCENT, weight=BOLD).move_to([0, -2.65, 0])
            self.play(FadeIn(same), run_time=0.15 * d)
        with self.voice("q2_a3") as d:
            self.play(FadeOut(VGroup(rows, hdr2, same)), run_time=0.6)
            # conductor in soil schematic
            cx = -3.6
            y0, y1 = 1.9, -3.4

            def yy(z):
                return y0 - (y0 - y1) * z / 220
            soil = Rectangle(width=4.6, height=y0 - y1).set_fill(ROCK, 1).set_stroke(width=0).move_to([cx, (y0 + y1) / 2, 0])
            sb = Line([cx - 2.3, y0, 0], [cx + 2.3, y0, 0], stroke_color="#8C7A62", stroke_width=3)
            cond = VGroup(band(cx - 0.75, cx - 0.62, yy(0), yy(80), C30), band(cx + 0.62, cx + 0.75, yy(0), yy(80), C30))
            s20 = VGroup(band(cx - 0.5, cx - 0.42, yy(0), yy(220), C20), band(cx + 0.42, cx + 0.5, yy(0), yy(220), C20))
            cem = VGroup(band(cx - 0.62, cx - 0.5, yy(0), yy(80), CEMENT, 0.9), band(cx + 0.5, cx + 0.62, yy(0), yy(80), CEMENT, 0.9),
                         band(cx - 0.85, cx - 0.75, yy(0), yy(80), CEMENT, 0.9), band(cx + 0.75, cx + 0.85, yy(0), yy(80), CEMENT, 0.9),
                         band(cx - 0.68, cx - 0.5, yy(80), yy(220), CEMENT, 0.9), band(cx + 0.5, cx + 0.68, yy(80), yy(220), CEMENT, 0.9))
            wh = RoundedRectangle(corner_radius=0.05, width=1.9, height=0.25).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1).move_to([cx, y0 + 0.13, 0])
            self.play(FadeIn(VGroup(soil, sb, cem, cond, s20, wh)), run_time=0.15 * d)
            zone = Rectangle(width=4.6, height=yy(0) - yy(100)).set_fill(ACCENT, 0.12).set_stroke(ACCENT, 1.5).move_to([cx, (yy(0) + yy(100)) / 2, 0])
            fr = VGroup(*[arrow([cx + s * 1.0, yy(z) + 0.18, 0], [cx + s * 1.0, yy(z) - 0.18, 0], ACCENT, 4, 0.1) for s in (-1, 1) for z in (20, 45, 70, 90)])
            zl = T("anchorage zone\n0 – ~100 m:\nsoil friction must\nhold the force", 16, ACCENT, weight=BOLD).next_to(zone, RIGHT, buff=0.2)
            low = T("below ~110 m:\ncement + rock lock\nevery metre locally", 16, GOOD, weight=BOLD).move_to([cx + 3.25, yy(170), 0])
            self.play(FadeIn(zone), LaggedStart(*[GrowArrow(a) for a in fr], lag_ratio=0.05), FadeIn(zl), run_time=0.25 * d)
            self.play(FadeIn(low), run_time=0.15 * d)
            yes = VGroup(T("length DOES matter for:", 18, INK, weight=BOLD), T("·  how much movement must be prevented", 17, INK),
                         T("·  how much soil is needed to anchor the force", 17, INK)).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
            no = VGroup(T("length does NOT change:", 18, INK, weight=BOLD), T("·  the force at the wellhead  (E·A·α·ΔT)", 17, REST_C)
                        ).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
            VGroup(yes, no).arrange(DOWN, aligned_edge=LEFT, buff=0.35).move_to([3.95, 0.3, 0])
            self.play(FadeIn(yes, shift=LEFT * 0.1), run_time=0.15 * d)
            self.play(FadeIn(no, shift=LEFT * 0.1), run_time=0.12 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
