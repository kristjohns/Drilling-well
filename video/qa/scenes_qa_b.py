"""Combined video: Q3 (buckling / yield limits), Q4 (locked in), closing."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from qa_common import *  # noqa: F401,F403,E402
from scenes_c import SpringRig  # noqa: E402

# limits (from analysis/wellmodel.py, see report)
LIM = {
    "13-3/8": dict(name='13⅜" L-80', onset=0.183, load=2.29, byield=5.16, body=7.40),
    "9-5/8": dict(name='9⅝" P-110', onset=0.084, load=1.02, byield=5.77, body=7.60),
    "tubing": dict(name='5½" 13Cr-80', onset=0.021, load=0.38, byield=1.09, body=1.77),
}


class Q3_Limits(QAScene):
    def construct(self):
        b = self.ask(3, "q3_q")
        x0, x1 = -3.0, 5.0
        sc = x1 - x0

        def X(f):
            return x0 + f * sc
        ya = -2.2
        axis = Line([X(0), ya, 0], [X(1), ya, 0], stroke_color=MUTED, stroke_width=2)
        ticks = VGroup(*[VGroup(Line([X(v), ya, 0], [X(v), ya - 0.1, 0], stroke_color=MUTED), T(f"{int(v * 100)} %", 14, MUTED).move_to([X(v), ya - 0.3, 0]))
                         for v in (0, 0.25, 0.5, 0.75, 1.0)])
        at = T("compressive force as a fraction of pipe-body yield", 16, INK).move_to([X(0.5), ya - 0.65, 0])
        rows = {}
        for i, k in enumerate(("13-3/8", "9-5/8", "tubing")):
            L_ = LIM[k]
            B = L_["body"]
            yy = 1.75 - 1.35 * i
            nm = T(L_["name"], 18, STR_COLORS[k], weight=BOLD).move_to([x0 - 0.3, yy, 0], aligned_edge=RIGHT)
            track = Line([X(0), yy, 0], [X(1), yy, 0], stroke_color=GRID, stroke_width=10)
            load = Rectangle(width=L_["load"] / B * sc, height=0.3).set_fill(REST_C, 1).set_stroke(width=0).move_to([X(L_["load"] / B / 2), yy, 0])
            ll = T(f"thermal load {L_['load']:.2f} MN", 14, REST_C, weight=BOLD).next_to(load, UP, buff=0.06).align_to(load, LEFT)
            on = Triangle(fill_color=ACCENT, fill_opacity=1, stroke_width=0).scale(0.11).rotate(PI).move_to([X(L_["onset"] / B), yy - 0.3, 0])
            onl = T(f"buckling onset {L_['onset'] * 1000:.0f} kN", 13, ACCENT).next_to(on, DOWN, buff=0.04).align_to(on, LEFT).shift(LEFT * 0.1)
            xb = X(L_["byield"] / B)
            by = DashedLine([xb, yy - 0.32, 0], [xb, yy + 0.32, 0], stroke_color="#FF9F43", dash_length=0.05, stroke_width=4)
            byl = T(f"yields when buckled  {L_['byield']:.1f} MN", 13, "#FF9F43").next_to(by, UP, buff=0.04)
            bd = Line([X(1), yy - 0.22, 0], [X(1), yy + 0.22, 0], stroke_color=INK, stroke_width=4)
            bdl = T(f"pipe body\n{B:.2f} MN", 13, INK).next_to(bd, RIGHT, buff=0.1)
            rows[k] = dict(nm=nm, track=track, load=load, ll=ll, on=on, onl=onl, by=by, byl=byl, bd=bd, bdl=bdl)
        with self.voice("q3_a1") as d:
            self.play(Create(axis), FadeIn(ticks), FadeIn(at), *[FadeIn(r["nm"]) for r in rows.values()],
                      *[FadeIn(r["track"]) for r in rows.values()], run_time=0.12 * d)
            self.play(*[FadeIn(r["on"], scale=1.5) for r in rows.values()], *[FadeIn(r["onl"]) for r in rows.values()], run_time=0.2 * d)
            self.play(*[GrowFromEdge(r["load"], LEFT) for r in rows.values()], *[FadeIn(r["ll"]) for r in rows.values()], run_time=0.25 * d)
            inc = T("in a 30° deviated section the 13⅜\" onset rises to ≈ 1.5 MN", 16, MUTED).move_to([1.0, -3.45, 0])
            self.play(FadeIn(inc), run_time=0.15 * d)
        with self.voice("q3_a2") as d:
            stable = T("buckling ≠ failure: the outer casing confines it to a stable helix", 18, ACCENT, weight=BOLD).move_to([1.0, -3.45, 0])
            self.play(FadeOut(inc), FadeIn(stable), run_time=0.15 * d)
            self.play(*[Create(r["by"]) for r in rows.values()], *[FadeIn(r["byl"]) for r in rows.values()], run_time=0.3 * d)
            mult = T("yield when buckled ≈ 2–3 × the load", 18, "#FF9F43", weight=BOLD).move_to([1.0, 2.62, 0])
            self.play(FadeIn(mult, scale=1.2), run_time=0.15 * d)
            self.play(*[Create(r["bd"]) for r in rows.values()], *[FadeIn(r["bdl"]) for r in rows.values()], run_time=0.15 * d)
        # ------------------------------------------------ yield table
        with self.voice("q3_a3") as d:
            allm = VGroup(axis, ticks, at, stable, mult, *[m for r in rows.values() for m in r.values()])
            self.play(FadeOut(allm), run_time=0.6)
            hdr = ["string", "grade (min. yield)", "pipe-body yield", "ΔT to yield if fully blocked"]
            cx = [-6.0, -3.1, 0.6, 3.6]
            data = [('30" × 1" conductor', "X-56 (386 MPa)", "22.7 MN", "≈ 150 °C", C30),
                    ('20" 133 ppf', "K-55 (379 MPa)", "9.45 MN", "≈ 148 °C", C20),
                    ('13⅜" 72 ppf', "L-80 (552 MPa)", "7.40 MN", "≈ 215 °C", C1338),
                    ('9⅝" 53.5 ppf', "P-110 (758 MPa)", "7.60 MN", "≈ 295 °C", C958),
                    ('5½" 17 ppf', "13Cr-80 (552 MPa)", "1.77 MN", "≈ 215 °C", CTBG)]
            y0 = 2.35
            H = VGroup(*[T(h, 16, MUTED).move_to([c, y0, 0], aligned_edge=LEFT) for h, c in zip(hdr, cx)])
            rule = Line([-6.1, y0 - 0.27, 0], [6.9, y0 - 0.27, 0], stroke_color=GRID, stroke_width=2)
            R = VGroup()
            for i, (a, g, f, t_, col) in enumerate(data):
                yy = y0 - 0.75 - 0.6 * i
                R.add(VGroup(T(a, 18, col, weight=BOLD).move_to([cx[0], yy, 0], aligned_edge=LEFT),
                             T(g, 17, INK).move_to([cx[1], yy, 0], aligned_edge=LEFT),
                             T(f, 18, INK, weight=BOLD).move_to([cx[2], yy, 0], aligned_edge=LEFT),
                             T(t_, 18, REST_C, weight=BOLD).move_to([cx[3], yy, 0], aligned_edge=LEFT)))
            self.play(FadeIn(H), Create(rule), run_time=0.08 * d)
            self.play(LaggedStart(*[FadeIn(r_, shift=RIGHT * 0.1) for r_ in R], lag_ratio=0.3), run_time=0.45 * d)
            nt = T("ΔT to yield = σ_y / (E·α);  this well heats the casings by ≤ ~100 °C", 17, ACCENT).move_to([0.3, -1.75, 0])
            nt2 = T("what eats the margin: hanging weight, pressure, helical bending, load transfer at the conductor shoe", 15, MUTED).move_to([0.3, -2.2, 0])
            self.play(FadeIn(nt), run_time=0.15 * d)
            self.play(FadeIn(nt2), run_time=0.15 * d)
        with self.voice("q3_a4") as d:
            self.play(FadeOut(VGroup(H, rule, R, nt, nt2)), run_time=0.6)
            c1 = VGroup(T('30" conductor + cemented 20"', 22, INK, weight=BOLD),
                        T("held sideways by soil + cement  →  buckling load ≈ 60–280 MN", 19, INK),
                        T("thermal load ≈ 15 MN  →  no buckling; yield is the limit", 19, GOOD, weight=BOLD)).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
            box1 = RoundedRectangle(corner_radius=0.15, width=12.6, height=c1.height + 0.5).set_fill(PANEL, 1).set_stroke(GRID, 1.5)
            g1 = VGroup(box1, c1.move_to(box1)).move_to([0, 1.35, 0])
            c1.align_to(box1, LEFT).shift(RIGHT * 0.4)
            self.play(FadeIn(g1, shift=UP * 0.1), run_time=0.3 * d)
            ttl = T('closest to yield: 20" just below the conductor shoe (restrained)', 19, INK).move_to([0, -0.35, 0])
            bg = Rectangle(width=10, height=0.5).set_fill(GRID, 1).set_stroke(width=0).move_to([0, -1.2, 0])
            fg = Rectangle(width=10 * 308 / 379, height=0.5).set_fill(REST_C, 1).set_stroke(width=0)
            fg.align_to(bg, LEFT).set_y(-1.2)
            l_ = T("−308 MPa", 20, BG, weight=BOLD).move_to(fg)
            yl = T("K-55 yield 379 MPa", 16, ACCENT).next_to(bg, RIGHT, buff=0.1).shift(LEFT * 1.6 + DOWN * 0.45)
            pc = T("81 %", 30, REST_C, weight=BOLD).next_to(bg, DOWN, buff=0.35)
            self.play(FadeIn(ttl), FadeIn(bg), run_time=0.15 * d)
            self.play(GrowFromEdge(fg, LEFT), FadeIn(l_), FadeIn(yl), run_time=0.25 * d)
            self.play(FadeIn(pc, scale=1.3), run_time=0.12 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class Q4_LockedIn(QAScene):
    def construct(self):
        b = self.ask(4, "q4_q")
        x0 = -4.6
        ytop, ybot = 1.95, -3.0
        wh = RoundedRectangle(corner_radius=0.06, width=2.2, height=0.45).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5).move_to([x0, ytop + 0.22, 0])
        pipe = Rectangle(width=0.42, height=ytop - ybot).set_fill(color=[temp_color(88), temp_color(50)], opacity=1).set_stroke(width=0)
        pipe.set_sheen_direction(DOWN).move_to([x0, (ytop + ybot) / 2, 0])
        cem = VGroup(*[Rectangle(width=0.35, height=0.6).set_fill(CEMENT, 1).set_stroke(width=0).move_to([x0 + s * 0.39, ybot - 0.3, 0]) for s in (-1, 1)])
        plow = Rectangle(width=0.42, height=0.6).set_fill(C1338, 1).set_stroke(width=0).move_to([x0, ybot - 0.3, 0])
        lk1 = lock_icon(ACCENT, 1.0).move_to([x0 + 0.85, ytop + 0.05, 0])
        lk2 = lock_icon(ACCENT, 1.0).move_to([x0 + 0.85, ybot - 0.2, 0])
        t1 = T("hanger on load shoulder\n+ lockdown ring", 15, ACCENT).next_to(lk1, RIGHT, buff=0.12)
        t2 = T("bonded in cement\n(top of cement)", 15, ACCENT).next_to(lk2, RIGHT, buff=0.12)
        nm = T('13⅜"\nfree section\n1,300 m', 16, C1338, weight=BOLD).next_to(pipe, LEFT, buff=0.2)
        with self.voice("q4_a1") as d:
            self.play(FadeIn(VGroup(wh, pipe, cem, plow, nm)), run_time=0.2 * d)
            self.play(FadeIn(lk2, scale=1.4), FadeIn(t2), run_time=0.2 * d)
            self.play(FadeIn(lk1, scale=1.4), FadeIn(t1), run_time=0.2 * d)
            only = T("the top moves only if the wellhead moves", 18, INK, weight=BOLD).move_to([2.6, 0.9, 0])
            self.play(FadeIn(only), run_time=0.15 * d)
        with self.voice("q4_a2") as d:
            self.play(FadeOut(only), run_time=0.4)
            up = arrow([x0 - 1.3, ytop + 0.1, 0], [x0 - 1.3, ytop + 0.8, 0], FREE_C, 6, 0.16)
            upl = T("1  wellhead rises", 15, FREE_C, weight=BOLD).next_to(up, DOWN, buff=0.1)
            self.play(FadeOut(nm), GrowArrow(up), FadeIn(upl), run_time=0.15 * d)
            hel = buckled_pipe(x0, ytop - 0.2, ybot + 0.2, 0.21, C1338, 0.12, 1.1, mode="helix", n=160)
            hl = T("2  helix\n    shortening", 15, ACCENT, weight=BOLD).move_to([x0 + 0.55, -0.6, 0], aligned_edge=LEFT)
            self.play(FadeOut(pipe), FadeIn(hel), FadeIn(hl), run_time=0.2 * d)
            eq = M(r"F = \frac{EA}{L}\,\Big(\delta_{free} - \delta_{WH} - \delta_{helix}\Big)", 40, INK).move_to([2.5, 1.4, 0])
            self.play(Write(eq), run_time=0.25 * d)
            bl = T("whatever is left over is blocked → compression", 18, REST_C, weight=BOLD).next_to(eq, DOWN, buff=0.3)
            self.play(FadeIn(bl), run_time=0.12 * d)
        with self.voice("q4_a3") as d:
            self.play(FadeOut(VGroup(eq, bl)), run_time=0.5)
            data = [("13-3/8", 1138, 61, 48), ("9-5/8", 1938, 61, 19), ("tubing", 2154, 61, 91)]
            W = 6.6
            bx = -1.2
            ttl = T("growth budget with a FREE wellhead (each bar = 100 % of the growth it wants)", 16, MUTED).move_to([2.3, 2.4, 0])
            leg = VGroup(VGroup(Square(0.18).set_fill(FREE_C, 1).set_stroke(width=0), T("wellhead rise", 14, FREE_C)).arrange(RIGHT, buff=0.08),
                         VGroup(Square(0.18).set_fill(ACCENT, 1).set_stroke(width=0), T("helix", 14, ACCENT)).arrange(RIGHT, buff=0.08),
                         VGroup(Square(0.18).set_fill(REST_C, 1).set_stroke(width=0), T("blocked → force", 14, REST_C)).arrange(RIGHT, buff=0.08)
                         ).arrange(RIGHT, buff=0.35).move_to([2.3, 1.95, 0])
            self.play(FadeIn(ttl), FadeIn(leg), run_time=0.08 * d)
            rowsg = VGroup()
            for i, (k, want, wh_, hx) in enumerate(data):
                yy = 1.05 - 1.15 * i
                blocked = want - wh_ - hx
                segs = VGroup()
                x = bx
                for v, col in ((wh_, FREE_C), (hx, ACCENT), (blocked, REST_C)):
                    w = W * v / want
                    segs.add(Rectangle(width=w, height=0.42).set_fill(col, 1).set_stroke(BG, 1.5).move_to([x + w / 2, yy, 0]))
                    x += w
                nm_ = T(STR_NAMES[k].split(" ")[0], 17, STR_COLORS[k], weight=BOLD).next_to([bx, yy, 0], LEFT, buff=0.12)
                info = T(f"wants {want:,} mm  ·  wellhead {wh_} mm  ·  helix {hx} mm", 14, MUTED).next_to(segs, DOWN, buff=0.07).align_to(segs, LEFT)
                pc = T(f"{100 * blocked / want:.0f} %", 20, REST_C, weight=BOLD).next_to(segs, RIGHT, buff=0.12)
                rowsg.add(VGroup(nm_, segs, info, pc))
            for r_ in rowsg:
                self.play(FadeIn(r_[0]), LaggedStart(*[GrowFromEdge(s_, LEFT) for s_ in r_[1]], lag_ratio=0.3), FadeIn(r_[2]), FadeIn(r_[3]),
                          run_time=0.24 * d)
        self.play(*[FadeOut(m) for m in self.mobjects if m is not b], run_time=0.7)
        # ------------------------------------------------ tug of war
        rig = SpringRig(self)
        with self.voice("q4_a4") as d:
            self.play(FadeIn(rig.ground), FadeIn(rig.glbl), FadeIn(rig.plate), FadeIn(rig.plabel), run_time=0.08 * d)
            self.add(rig.springs)
            self.play(FadeIn(rig.springs), run_time=0.08 * d)
            kf = T("conductor + 20\":  ≈ 240 MN/m", 20, "#7FA8B8", weight=BOLD)
            ki = T("inner strings:  ≤ 2.1 MN/m each", 20, C1338, weight=BOLD)
            g = VGroup(kf, ki).arrange(DOWN, aligned_edge=LEFT, buff=0.2).move_to([3.6, 1.9, 0])
            self.play(FadeIn(g), run_time=0.15 * d)
            up1 = 0.12
            c1 = M(r"\frac{4.1\ \mathrm{MN}}{240\ \mathrm{MN/m}} \approx 17\ \mathrm{mm}", 34, INK).move_to([3.6, 0.55, 0])
            self.play(rig.plate.animate.shift(UP * up1), rig.plabel.animate.shift(UP * up1), Write(c1), run_time=0.2 * d)
            up2 = 0.3
            c2 = T("+ 44 mm from the conductor's own expansion\n= 61 mm", 19, INK).move_to([3.6, -0.6, 0])
            self.play(rig.plate.animate.shift(UP * up2), rig.plabel.animate.shift(UP * up2), FadeIn(c2), run_time=0.2 * d)
            tug = T("a tug of war the inner strings cannot win", 22, ACCENT, weight=BOLD).move_to([3.6, -1.8, 0])
            self.play(FadeIn(tug, scale=1.05), run_time=0.12 * d)
        rig.springs.clear_updaters()
        self.play(*[FadeOut(m) for m in self.mobjects if m is not b], run_time=0.7)
        # ------------------------------------------------ length decides
        with self.voice("q4_a5") as d:
            ttl = T("how much do the same 61 mm relieve?  (13⅜\", ΔT 71 °C)", 19, INK).move_to([0, 2.4, 0])
            self.play(FadeIn(ttl), run_time=0.08 * d)
            W = 8.0
            bx = -3.2
            rows = VGroup()
            for i, L_ in enumerate((50, 100, 300, 1300)):
                want = 1138.0 * L_ / 1300.0
                rel = min(1.0, 61 / want)
                yy = 1.45 - 0.95 * i
                a_ = Rectangle(width=max(W * rel, 0.02), height=0.42).set_fill(FREE_C, 1).set_stroke(BG, 1.5)
                a_.move_to([bx + a_.width / 2, yy, 0])
                rest = Rectangle(width=max(W * (1 - rel), 0.001), height=0.42).set_fill(REST_C, 1).set_stroke(BG, 1.5)
                rest.move_to([bx + W * rel + rest.width / 2, yy, 0])
                nm_ = T(f"{L_:,} m free length", 17, INK, weight=BOLD).next_to([bx, yy, 0], LEFT, buff=0.15)
                txt = f"relieved {100 * rel:.0f} %" if rel < 1 else "fully relieved"
                t_ = T(f"wants {want:,.0f} mm  ·  {txt}", 14, MUTED).next_to(VGroup(a_, rest), DOWN, buff=0.06).align_to(a_, LEFT)
                rows.add(VGroup(nm_, a_, rest if rel < 1 else VGroup(), t_))
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[2]), FadeIn(r_[3])) for r_ in rows],
                                  lag_ratio=0.35), run_time=0.55 * d)
            leg = VGroup(VGroup(Square(0.18).set_fill(FREE_C, 1).set_stroke(width=0), T("relieved by wellhead movement", 14, FREE_C)).arrange(RIGHT, buff=0.08),
                         VGroup(Square(0.18).set_fill(REST_C, 1).set_stroke(width=0), T("still blocked → force", 14, REST_C)).arrange(RIGHT, buff=0.08)
                         ).arrange(RIGHT, buff=0.4).move_to([0.8, -2.55, 0])
            locked = T("long free lengths are locked, whatever the wellhead does", 20, ACCENT, weight=BOLD).move_to([0, -3.2, 0])
            self.play(FadeIn(leg), FadeIn(locked), run_time=0.2 * d)
        with self.voice("q4_a6") as d:
            self.play(FadeOut(VGroup(ttl, rows, leg, locked)), run_time=0.6)
            items = [("They buckle either way", "free or restrained wellhead: the restraint adds only 3–5 %", C1338),
                     ("The only real unlock: the hanger sliding up", "= lockdown / seal failure, not a design option", REST_C),
                     ("What actually helps", "less heat (insulated tubing) · more hanging tension · stronger pipe + connections", GOOD)]
            cards = VGroup()
            for h, t_, col in items:
                hh = T(h, 22, col, weight=BOLD)
                tt = T(t_, 17, INK)
                g = VGroup(hh, tt).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
                box = RoundedRectangle(corner_radius=0.14, width=12.4, height=g.height + 0.45).set_fill(PANEL, 1).set_stroke(col, 1.5)
                g.move_to(box).align_to(box, LEFT).shift(RIGHT * 0.4)
                cards.add(VGroup(box, g))
            cards.arrange(DOWN, buff=0.25).move_to([0, -0.3, 0])
            self.play(LaggedStart(*[FadeIn(c_, shift=UP * 0.15) for c_ in cards], lag_ratio=0.55), run_time=0.75 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class Q5_Closing(VScene):
    def construct(self):
        l1 = T("Free or restrained, the expansion is the same.", 34, INK, weight=BOLD)
        l2 = VGroup(T("It shows up as", 34, INK, weight=BOLD), T("movement", 34, FREE_C, weight=BOLD),
                    T("— or as", 34, INK, weight=BOLD), T("force.", 34, REST_C, weight=BOLD)).arrange(RIGHT, buff=0.2)
        l3 = T("In a subsea well, most of that force ends up in the conductor,\nthe surface casing — and whatever holds them down.", 24, MUTED)
        g = VGroup(l1, l2, l3).arrange(DOWN, buff=0.45).move_to([0, 0.4, 0])
        with self.voice("qa_end") as d:
            self.play(FadeIn(l1, shift=UP * 0.15), run_time=0.25 * d)
            self.play(FadeIn(l2, shift=UP * 0.15), run_time=0.25 * d)
            self.play(FadeIn(l3), run_time=0.25 * d)
        credit = T("Worked example · 1-D multi-string thermal–mechanical model · API 5CT casing · details: report/REPORT.md", 15, FAINT)
        credit.to_edge(DOWN, buff=0.3)
        self.play(FadeIn(credit), run_time=0.8)
        self.wait(2.5)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1.2)
