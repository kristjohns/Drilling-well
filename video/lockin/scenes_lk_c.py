"""Lock-in load video, scenes 7-9: model results, other effects, checks."""
import math as _m
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lk_common import *  # noqa: F401,F403,E402


def mini_axes(cx, cy, w, h, xr, yr, xticks, yticks, xlabel, ylabel, xfmt=None):
    X = lambda v: cx - w / 2 + (v - xr[0]) / (xr[1] - xr[0]) * w
    Y = lambda v: cy - h / 2 + (v - yr[0]) / (yr[1] - yr[0]) * h
    g = VGroup(Line([X(xr[0]), Y(yr[0]), 0], [X(xr[1]), Y(yr[0]), 0], stroke_color=MUTED, stroke_width=2))
    for v in yticks:
        g.add(Line([X(xr[0]), Y(v), 0], [X(xr[1]), Y(v), 0], stroke_color=GRID, stroke_width=1),
              T(f"{v:g}", 13, MUTED).next_to([X(xr[0]), Y(v), 0], LEFT, buff=0.08))
    for v in xticks:
        g.add(T(xfmt(v) if xfmt else f"{v:g}", 13, MUTED).next_to([X(v), Y(yr[0]), 0], DOWN, buff=0.08))
    g.add(T(xlabel, 15, INK).move_to([cx, cy - h / 2 - 0.62, 0]))
    g.add(T(ylabel, 15, INK).move_to([X(xr[0]), cy + h / 2 + 0.3, 0], aligned_edge=LEFT))
    return g, X, Y


class L07_Results(VScene):
    def construct(self):
        hdr = self.header(6, "Model results: 30\" vs. 36\"")
        sc, x0 = 0.3, -3.5
        rows = VGroup()
        for L, nm, col, yy in ((LA, NAME_A, A_C, 1.2), (LB, NAME_B, B_C, -1.0)):
            c = L["comp_top_MN"]
            inn = L["inner_MN"]
            parts = [(c["30"], col, 1.0), (c["20"], C20, 1.0), (c["cement30"] + c["cement20"], CEMENT, 0.8),
                     (inn["13-3/8"], C1338, 1.0), (inn["9-5/8"], C958, 1.0), (inn["tubing"], CTBG, 1.0)]
            bar, xe = stack_bar(x0, yy, sc, parts, h=0.6)
            xs = [x0]
            for v, *_ in parts:
                xs.append(xs[-1] + v * sc)
            name = T(nm, 22, col, weight=BOLD).next_to([x0, yy, 0], LEFT, buff=0.25)
            l1 = T(f"conductor steel {parts[0][0]:.1f}", 16, INK, weight=BOLD).move_to([(xs[0] + xs[1]) / 2, yy + 0.55, 0])
            l2 = T(f"20\" {parts[1][0]:.1f}", 16, INK).move_to([(xs[1] + xs[2]) / 2, yy + 0.55, 0])
            l3 = T(f"cement {parts[2][0]:.1f}", 15, MUTED).move_to([(xs[2] + xs[3]) / 2, yy - 0.55, 0])
            br = Line([xs[3] + 0.02, yy - 0.42, 0], [xs[6] - 0.02, yy - 0.42, 0], stroke_color=MUTED, stroke_width=1.5)
            l4 = T(f"inner strings {sum(inn.values()):.1f}", 15, MUTED).move_to([(xs[3] + xs[6]) / 2 + 0.5, yy - 0.75, 0])
            ub = L["upper_bound_MN"]
            ubl = DashedLine([x0 + ub * sc, yy - 0.45, 0], [x0 + ub * sc, yy + 0.45, 0], stroke_color=MUTED, dash_length=0.06)
            ubt = T(f"hand bound {ub:.1f}", 13, MUTED).next_to(ubl, UP, buff=0.05)
            tot = T(f"{L['R_MN']:.1f} MN", 26, INK, weight=BOLD).next_to([max(xe, x0 + ub * sc), yy, 0], RIGHT, buff=0.2)
            rows.add(VGroup(name, bar, l1, l2, l3, br, l4, ubl, ubt, tot))
        with self.voice("l_res_1") as d:
            ttl = T("lock-in load after 1 year, fully restrained (model)", 19, MUTED).move_to([0, 2.55, 0])
            self.play(FadeIn(ttl), run_time=0.05 * d)
            for r_ in rows:
                self.play(FadeIn(r_[0]), LaggedStart(*[GrowFromEdge(b, LEFT) for b in r_[1]], lag_ratio=0.15), run_time=0.18 * d)
                self.play(FadeIn(VGroup(*r_[2:7])), Create(r_[7]), FadeIn(r_[8]), FadeIn(r_[9], scale=1.2), run_time=0.14 * d)
            self.play(Indicate(rows[0][2], color=A_C), Indicate(rows[1][2], color=B_C), run_time=0.15 * d)
        with self.voice("l_res_2") as d:
            self.play(FadeOut(VGroup(rows, ttl)), run_time=0.6)
            g, X, Y = mini_axes(-3.2, 0.1, 5.4, 3.8, (0, 65), (0, 26), [0, 20, 40, 60], [0, 5, 10, 15, 20, 25],
                                "wellhead growth the restraint allows [mm]", "lock-in load [MN]")
            self.play(FadeIn(g), run_time=0.1 * d)
            curves = VGroup()
            for L, c in ((LA, A_C), (LB, B_C)):
                pts = sorted([(0.0, L["R_MN"]), (L["free_growth_mm"], 0.0)] + [(p["growth_mm"], p["R_MN"]) for p in L["partial"]])
                curves.add(VGroup(VMobject().set_points_smoothly([[X(u), Y(r), 0] for u, r in pts]).set_stroke(c, 4),
                                  *[Dot([X(u), Y(r), 0], radius=0.05, color=c) for u, r in pts]))
            self.play(Create(curves[0]), Create(curves[1]), run_time=0.3 * d)
            la_ = T("A", 16, A_C, weight=BOLD).next_to([X(0), Y(LA["R_MN"]), 0], RIGHT, buff=0.12)
            lb_ = T("B", 16, B_C, weight=BOLD).next_to([X(0), Y(LB["R_MN"]), 0], RIGHT, buff=0.12)
            n1 = T("every mm held back:\n≈ 0.32 MN (A) · 0.45 MN (B)", 15, INK).move_to([X(44), Y(19), 0])
            self.play(FadeIn(la_), FadeIn(lb_), FadeIn(n1), run_time=0.2 * d)
        with self.voice("l_res_3") as d:
            g2, X2, Y2 = mini_axes(3.7, 0.1, 5.0, 3.8, (0, 3.6), (0, 32), [0, _m.log10(30), _m.log10(365), _m.log10(3650)], [0, 10, 20, 30],
                                   "time since start-up", "lock-in load [MN]",
                                   xfmt=lambda v: {0: "1 day", round(_m.log10(30), 6): "1 month", round(_m.log10(365), 6): "1 year"}.get(round(v, 6), "10 years"))
            self.play(FadeIn(g2), run_time=0.1 * d)
            tc = VGroup()
            for L, c in ((LA, A_C), (LB, B_C)):
                pts = [[X2(_m.log10(t["days"])), Y2(t["R_MN"]), 0] for t in L["time"]]
                tc.add(VGroup(VMobject().set_points_smoothly(pts).set_stroke(c, 4), *[Dot(p, radius=0.05, color=c) for p in pts]))
            self.play(Create(tc[0]), Create(tc[1]), run_time=0.3 * d)
            eol = VGroup()
            for v, c in ((22.9, A_C), (30.9, B_C)):
                eol.add(DashedLine([X2(3.2), Y2(v), 0], [X2(3.6), Y2(v), 0], stroke_color=c, dash_length=0.05, stroke_width=3))
            el = T("end-of-life hand bounds\n22.9 / 30.9 MN", 14, INK, weight=BOLD).move_to([X2(1.9), Y2(29), 0])
            self.play(Create(eol), FadeIn(el), run_time=0.2 * d)
            dl = T("design for end-of-life temperatures", 19, ACCENT, weight=BOLD).move_to([0, -3.3, 0])
            self.play(FadeIn(dl), run_time=0.15 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class L08_Effects(VScene):
    def construct(self):
        hdr = self.header(7, "Other effects")
        with self.voice("l_eff_1") as d:
            c1 = note_card(["wellhead + tree weight", "hanging casing loads", "riser / BOP loads in workovers"], width=5.8,
                           title="comes on top of loads already there", tcol=INK)
            c1.move_to([-3.4, 1.85, 0])
            self.play(FadeIn(c1, shift=UP * 0.15), run_time=0.3 * d)
            box = RoundedRectangle(corner_radius=0.14, width=5.8, height=c1.height).set_fill(PANEL, 1).set_stroke(GRID, 1.5).move_to([3.4, 1.85, 0])
            tt = T("every shut-in / start-up cycles it: a fatigue load", 18, INK, weight=BOLD).move_to(box.get_top() + DOWN * 0.33)
            ts = np.linspace(0, 10, 300)
            vals = np.zeros_like(ts)
            for i in range(1, len(ts)):
                on = (ts[i] % 3.4) < 2.6
                vals[i] = vals[i - 1] + ((1.0 if on else 0.0) - vals[i - 1]) * (ts[i] - ts[i - 1]) / (0.5 if on else 0.15)
            cyc = VMobject().set_points_as_corners([[3.4 - 2.5 + t * 0.5, box.get_bottom()[1] + 0.25 + v * 0.75, 0] for t, v in zip(ts, vals)]).set_stroke(REST_C, 3)
            fl = VGroup()
            self.play(FadeIn(box), FadeIn(tt), run_time=0.15 * d)
            self.play(Create(cyc), FadeIn(fl), run_time=0.35 * d)
        with self.voice("l_eff_2") as d:
            g, X, Y = mini_axes(-3.9, -1.55, 4.4, 2.2, (0, 120), (0, 30), [0, 40, 80, 120], [0, 10, 20, 30],
                                "fluid temperature rise at the wellhead [°C]", "lock-in load [MN]")
            self.play(FadeIn(g), run_time=0.1 * d)
            lines = VGroup()
            for L, c, nm in ((LA, A_C, "A"), (LB, B_C, "B")):
                k = L["R_MN"] / 102.0
                lines.add(Line([X(0), Y(0), 0], [X(120), Y(k * 120), 0], stroke_color=c, stroke_width=4))
                lines.add(Dot([X(102), Y(L["R_MN"]), 0], radius=0.06, color=c))
                lines.add(T(f"{nm}: {k:.2f} MN/°C", 15, c, weight=BOLD).next_to([X(120), Y(k * 120), 0], RIGHT, buff=0.1))
            self.play(Create(lines), run_time=0.45 * d)
        with self.voice("l_eff_3") as d:
            ttl = T("peak stress: the 20\" just below the conductor shoe", 18, INK, weight=BOLD).move_to([3.5, -0.45, 0])
            self.play(FadeIn(ttl), run_time=0.1 * d)
            gs = VGroup()
            for i, (L, c, nm) in enumerate(((LA, A_C, '30" conductor'), (LB, B_C, '36" conductor'))):
                v = -L["s20_peak"]["MPa"]
                yy = -1.35 - 0.95 * i
                bg = Rectangle(width=5.2, height=0.42).set_fill(GRID, 1).set_stroke(width=0).move_to([3.6, yy, 0])
                fg = Rectangle(width=5.2 * v / 379, height=0.42).set_fill(c, 1).set_stroke(width=0)
                fg.align_to(bg, LEFT).set_y(yy)
                lb = T(f"{nm}: {v:.0f} MPa  ({100 * v / 379:.0f} % of K-55 yield)", 15, INK).next_to(bg, UP, buff=0.06).align_to(bg, LEFT)
                gs.add(VGroup(bg, fg, lb))
            self.play(LaggedStart(*[AnimationGroup(FadeIn(g_[0]), GrowFromEdge(g_[1], LEFT), FadeIn(g_[2])) for g_ in gs], lag_ratio=0.4), run_time=0.45 * d)
            yl = T("yield 379 MPa →", 13, ACCENT).next_to(gs[1][0], DOWN, buff=0.08).align_to(gs[1][0], RIGHT)
            self.play(FadeIn(yl), run_time=0.1 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class L09_Checks(VScene):
    def construct(self):
        hdr = self.header(8, "Checks, and how to reduce it")
        checks = ["restraint + its anchor in uplift", "every part the load passes through", "conductor + 20\" at the seabed",
                  "20\" just below the conductor shoe", "13⅜\" hanger lockdown (≈ 1.0 MN)", "fatigue: every start-up and shut-in"]
        ways = ["allow some movement", "engage the restraint after the first heat-up", "reduce ΔT (insulated tubing)",
                "choose the conductor with the load in mind", "cement the 20\" to the seabed"]
        with self.voice("l_chk_1") as d:
            ttl = T("design checks", 22, ACCENT, weight=BOLD).move_to([-6.5, 2.6, 0], aligned_edge=LEFT)
            items = VGroup()
            for i, c in enumerate(checks):
                yy = 1.85 - 0.62 * i
                bx = Square(0.32).set_stroke(MUTED, 2).set_fill(opacity=0).move_to([-6.3, yy, 0])
                tk = VMobject().set_points_as_corners([[-6.42, yy, 0], [-6.32, yy - 0.1, 0], [-6.14, yy + 0.14, 0]]).set_stroke(GOOD, 4)
                tx = T(c, 18, INK).next_to(bx, RIGHT, buff=0.25)
                items.add(VGroup(bx, tk, tx))
            self.play(FadeIn(ttl), *[FadeIn(VGroup(it[0], it[2])) for it in items], run_time=0.25 * d)
            self.play(LaggedStart(*[Create(it[1]) for it in items], lag_ratio=0.4), run_time=0.6 * d)
        with self.voice("l_chk_2") as d:
            t2 = T("ways to reduce it", 22, GOOD, weight=BOLD).move_to([0.9, 2.6, 0], aligned_edge=LEFT)
            wl = VGroup()
            for i, w in enumerate(ways):
                yy = 1.85 - 0.62 * i
                n = T(f"{i + 1}", 20, GOOD, weight=BOLD).move_to([1.1, yy, 0])
                tx = T(w, 18, INK).next_to(n, RIGHT, buff=0.25)
                wl.add(VGroup(n, tx))
            self.play(FadeIn(t2), run_time=0.08 * d)
            self.play(LaggedStart(*[FadeIn(w_, shift=RIGHT * 0.15) for w_ in wl], lag_ratio=0.4), run_time=0.75 * d)
        with self.voice("l_chk_3") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.6)
            eq = M(r"R_{lock} \approx \underbrace{\sum E\,A\,\alpha\,\Delta T}_{\text{bonded at the wellhead}} + \underbrace{\sum \Delta F_{inner}}_{\text{inner strings}}", 44, INK)
            eq.move_to([0, 1.3, 0])
            s1 = T("steel area × temperature sets it", 26, ACCENT, weight=BOLD).move_to([0, -0.5, 0])
            s2 = T("the soil does not hold it down — it sets the free growth and the anchor capacity", 21, INK).move_to([0, -1.4, 0])
            self.play(Write(eq), run_time=0.35 * d)
            self.play(FadeIn(s1, shift=UP * 0.1), run_time=0.2 * d)
            self.play(FadeIn(s2, shift=UP * 0.1), run_time=0.25 * d)
        cr = T("Worked example · 1-D thermal–mechanical model · details: the Conductor Lock-In Load document and analysis/lockin_conductor.py", 14, FAINT)
        cr.to_edge(DOWN, buff=0.3)
        self.play(FadeIn(cr), run_time=0.6)
        self.wait(2.0)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1.0)
