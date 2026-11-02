"""Lock-in load video, scenes 4-6: hand calculation, inner strings, soil."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lk_common import *  # noqa: F401,F403,E402


def comp_parts(L, ccol):
    h = {r["name"]: r["F_MN"] for r in L["hand"]}
    return [(h["conductor steel"], ccol, 1.0, "conductor"), (h['20" steel'], C20, 1.0, '20"'),
            (h['cement 20"/conductor'], CEMENT, 0.85, "cement"), (h["cement conductor/hole"], CEMENT, 0.55, "cement")]


class L04_HandCalc(VScene):
    def construct(self):
        hdr = self.header(3, "Hand calculation: the conductor system")
        f1 = M(r"F_i = E_i\,A_i\,\alpha_i\,\Delta T_i", 54, INK)
        f2 = M(r"N_{found,max} = \sum_i F_i", 44, INK)
        g = VGroup(f1, f2).arrange(DOWN, buff=0.4).move_to([0, 1.2, 0])
        leg = T("E stiffness  ·  A area  ·  α expansion per °C  ·  ΔT temperature rise  ·  i = each bonded component", 18, MUTED).next_to(g, DOWN, buff=0.45)
        with self.voice("l_hc_1") as d:
            self.play(Write(f1), run_time=0.35 * d)
            self.play(FadeIn(f2, shift=UP * 0.1), FadeIn(leg), run_time=0.35 * d)
        with self.voice("l_hc_2") as d:
            self.play(FadeOut(leg), g.animate.scale(0.55).move_to([4.6, 2.85, 0]), run_time=0.8)
            lab = T('worked line: 30" × 1" conductor steel', 20, A_C, weight=BOLD).move_to([-6.6, 1.95, 0], aligned_edge=LEFT)
            w1 = M(r"A = \tfrac{\pi}{4}\,(0.762^2 - 0.7112^2) = 0.0588\ \mathrm{m^2}", 36, INK)
            w2 = M(r"E\,A\,\alpha = 207\ \mathrm{GPa}\times 0.0588\ \mathrm{m^2}\times 12.4\times10^{-6}/^{\circ}\mathrm{C} = 151\ \mathrm{kN}/^{\circ}\mathrm{C}", 34, INK)
            w3 = M(r"F = 151\ \mathrm{kN}/^{\circ}\mathrm{C}\times 61\ ^{\circ}\mathrm{C} = 9.2\ \mathrm{MN}", 40, ACCENT)
            w4 = T("stress = 2.57 MPa per °C × 61 °C ≈ 156 MPa", 18, MUTED)
            ws = VGroup(w1, w2, w3, w4).arrange(DOWN, aligned_edge=LEFT, buff=0.32).next_to(lab, DOWN, buff=0.35, aligned_edge=LEFT)
            self.play(FadeIn(lab), run_time=0.05 * d)
            for w_, f in ((w1, 0.22), (w2, 0.3), (w3, 0.25)):
                self.play(Write(w_), run_time=f * d)
            self.play(FadeIn(w4), run_time=0.08 * d)
        with self.voice("l_hc_3") as d:
            self.play(FadeOut(VGroup(lab, ws)), run_time=0.6)
            sc, x0 = 0.36, -3.3
            rows = []
            for L, nm, col, yy in ((LA, NAME_A, A_C, 1.05), (LB, NAME_B, B_C, -0.75)):
                parts = comp_parts(L, col)
                bar, xe = stack_bar(x0, yy, sc, [(v, c, o) for v, c, o, _ in parts], h=0.6)
                name = T(nm, 22, col, weight=BOLD).next_to([x0, yy, 0], LEFT, buff=0.25)
                xs = [x0]
                for v, *_ in parts:
                    xs.append(xs[-1] + v * sc)
                l1 = T(f"conductor steel {parts[0][0]:.1f}", 16, INK, weight=BOLD).move_to([(xs[0] + xs[1]) / 2, yy + 0.55, 0])
                l2 = T(f"20\" {parts[1][0]:.1f}", 16, INK).move_to([(xs[1] + xs[2]) / 2, yy + 0.55, 0])
                l3 = T(f"cement {parts[2][0] + parts[3][0]:.1f}", 16, MUTED).move_to([(xs[2] + xs[4]) / 2, yy - 0.55, 0])
                tot = T(f"{sum(p[0] for p in parts):.1f} MN", 26, INK, weight=BOLD).next_to([xe, yy, 0], RIGHT, buff=0.2)
                rows.append(VGroup(name, bar, l1, l2, l3, tot))
            ttl = T("blocked force of each bonded component at the seabed", 19, MUTED).move_to([0, 2.15, 0])
            self.play(FadeIn(ttl), run_time=0.05 * d)
            for r_ in rows:
                self.play(FadeIn(r_[0]), LaggedStart(*[GrowFromEdge(b, LEFT) for b in r_[1]], lag_ratio=0.25), run_time=0.22 * d)
                self.play(FadeIn(r_[2]), FadeIn(r_[3]), FadeIn(r_[4]), FadeIn(r_[5], scale=1.2), run_time=0.15 * d)
        with self.voice("l_hc_4") as d:
            st = T("steel ≈ 85 % of it", 20, ACCENT, weight=BOLD).move_to([1.0, -1.85, 0])
            self.play(FadeIn(st), run_time=0.15 * d)
            e1 = M(r"\delta = \alpha\,L\,\Delta T", 34, INK)
            e2 = M(r"k = \frac{E A}{L}", 34, INK)
            e3 = M(r"F = k\,\delta = E\,A\,\alpha\,\Delta T", 38, ACCENT)
            eg = VGroup(e1, T("·", 30, MUTED), e2, T("→", 30, MUTED), e3).arrange(RIGHT, buff=0.35).move_to([0, -2.85, 0])
            lc = T("length cancels", 18, MUTED).next_to(eg, DOWN, buff=0.15)
            self.play(FadeIn(eg, shift=UP * 0.1), FadeIn(lc), run_time=0.45 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class L05_InnerPush(VScene):
    def construct(self):
        hdr = self.header(4, "Hand calculation: the inner strings")
        P = RES["base_restrained"]["profiles"]["13-3/8"]
        z = np.array(P["z"])
        dT = np.array(P["dT"])
        px, y_top, y_bot = -5.4, 2.1, -2.7
        Y = lambda zz: y_top - (y_top - y_bot) * zz / 1300.0
        pipe = Rectangle(width=0.4, height=y_top - y_bot).set_fill(color=[temp_color(87), temp_color(55)], opacity=1).set_stroke(width=0)
        pipe.set_sheen_direction(DOWN).move_to([px, (y_top + y_bot) / 2, 0])
        hg = Rectangle(width=0.9, height=0.18).set_fill("#8693A5", 1).set_stroke(width=0).move_to([px, y_top + 0.09, 0])
        cm = VGroup(*[Rectangle(width=0.3, height=0.45).set_fill(CEMENT, 1).set_stroke(width=0).move_to([px + s * 0.35, y_bot - 0.22, 0]) for s in (-1, 1)])
        X = lambda v: -4.4 + v / 100.0 * 2.6
        axis = Line([X(0), y_top, 0], [X(100), y_top, 0], stroke_color=MUTED, stroke_width=2)
        ticks = VGroup(*[T(f"{v}", 13, MUTED).next_to([X(v), y_top, 0], UP, buff=0.06) for v in (0, 50, 100)])
        cv = VMobject().set_points_as_corners([[X(t), Y(zz), 0] for t, zz in zip(dT, z)]).set_stroke(C1338, 4)
        avg = float(np.mean(dT))
        av = DashedLine([X(avg), y_top, 0], [X(avg), y_bot, 0], stroke_color=ACCENT, dash_length=0.08)
        avl = T(f"average {avg:.0f} °C", 16, ACCENT, weight=BOLD).next_to([X(avg), y_bot, 0], DOWN, buff=0.1)
        al = T("ΔT [°C]", 14, MUTED).next_to(ticks, UP, buff=0.05)
        lbl = VGroup(T("hanger", 14, MUTED).next_to(hg, LEFT, buff=0.08), T("top of cement 1,300 m", 14, MUTED).next_to(cm, DOWN, buff=0.08))
        with self.voice("l_ip_1") as d:
            self.play(FadeIn(VGroup(pipe, hg, cm, lbl)), run_time=0.2 * d)
            self.play(Create(axis), FadeIn(ticks), FadeIn(al), Create(cv), run_time=0.35 * d)
            self.play(Create(av), FadeIn(avl), run_time=0.2 * d)
            f = M(r"\Delta F_i \approx E\,A_i\,\alpha\,\overline{\Delta T}_i", 40, INK).move_to([3.3, 2.4, 0])
            fn = T("over the free length, minus a little helix shortening", 16, MUTED).next_to(f, DOWN, buff=0.15)
            self.play(Write(f), FadeIn(fn), run_time=0.2 * d)
        with self.voice("l_ip_2") as d:
            data = [("13-3/8", 2.43, 71), ("9-5/8", 1.58, 61), ("tubing", 0.46, 56)]
            sc, x0 = 1.15, 0.9
            rows = VGroup()
            for i, (k, v, t_) in enumerate(data):
                yy = 1.0 - 0.75 * i
                b = Rectangle(width=v * sc, height=0.36).set_fill(STR_COLORS[k], 1).set_stroke(width=0).move_to([x0 + v * sc / 2, yy, 0])
                nm = T(STR_NAMES[k].split(" ")[0], 17, STR_COLORS[k], weight=BOLD).next_to([x0, yy, 0], LEFT, buff=0.12)
                vl = T(f"{v:.2f} MN  (ΔT avg {t_} °C)", 16, INK).next_to(b, RIGHT, buff=0.12)
                rows.add(VGroup(nm, b, vl))
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[2])) for r_ in rows], lag_ratio=0.35), run_time=0.45 * d)
            tot = VGroup(T("total push: 4.47 MN", 22, INK, weight=BOLD), T("4.32 MN after helix relief  ·  same for both conductors", 17, MUTED)
                         ).arrange(DOWN, aligned_edge=LEFT, buff=0.08).move_to([0.2, -1.4, 0], aligned_edge=LEFT)
            self.play(FadeIn(tot, shift=UP * 0.1), run_time=0.2 * d)
        with self.voice("l_ip_3") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.7)
            sc, x0 = 0.3, -3.4
            ttl = T("hand-calculation upper bound (every component fully blocked)", 19, MUTED).move_to([0, 2.4, 0])
            eq = M(r"R_{lock} \le N_{found,max} + \sum_{inner}\Delta F_i", 38, INK).move_to([0, 1.65, 0])
            self.play(FadeIn(ttl), Write(eq), run_time=0.25 * d)
            for L, nm, col, yy in ((LA, NAME_A, A_C, 0.35), (LB, NAME_B, B_C, -1.25)):
                fnd = L["hand_found_MN"]
                inn = sum(L["inner_full_MN"].values())
                bar, xe = stack_bar(x0, yy, sc, [(fnd, col, 1.0), (inn, C1338, 1.0)], h=0.6)
                name = T(nm, 22, col, weight=BOLD).next_to([x0, yy, 0], LEFT, buff=0.25)
                l1 = T(f"conductor system {fnd:.1f}", 16, INK, weight=BOLD).move_to([x0 + fnd * sc / 2, yy + 0.55, 0])
                l2 = T(f"inner {inn:.1f}", 16, INK).move_to([x0 + fnd * sc + inn * sc / 2, yy + 0.55, 0])
                tot = T(f"{fnd + inn:.1f} MN", 28, INK, weight=BOLD).next_to([xe, yy, 0], RIGHT, buff=0.2)
                self.play(FadeIn(name), LaggedStart(*[GrowFromEdge(b_, LEFT) for b_ in bar], lag_ratio=0.3), FadeIn(l1), FadeIn(l2), run_time=0.2 * d)
                self.play(FadeIn(tot, scale=1.2), run_time=0.1 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class L06_Soil(VScene):
    def construct(self):
        hdr = self.header(5, "Does the soil hold it down?")
        cx, y_sb, y_end = -4.5, 2.0, -3.6
        Y = lambda zz: y_sb - (y_sb - y_end) * zz / 200.0
        soil = Rectangle(width=3.6, height=y_sb - y_end).set_fill(ROCK, 1).set_stroke(width=0).move_to([cx, (y_sb + y_end) / 2, 0])
        sea = Rectangle(width=3.6, height=1.0).set_fill(SEA_BOT, 1).set_stroke(width=0).move_to([cx, y_sb + 0.5, 0])
        sbl = Line([cx - 1.8, y_sb, 0], [cx + 1.8, y_sb, 0], stroke_color="#8C7A62", stroke_width=3)
        col = VGroup(band(cx - 0.72, cx - 0.6, y_sb, y_end, C30), band(cx + 0.6, cx + 0.72, y_sb, y_end, C30),
                     band(cx - 0.6, cx + 0.6, y_sb, y_end, CEMENT, 0.35))
        wh = RoundedRectangle(corner_radius=0.05, width=1.9, height=0.35).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1).move_to([cx, y_sb + 0.18, 0])
        beam = Rectangle(width=3.2, height=0.22).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1).move_to([cx, y_sb + 0.48, 0])
        lk = lock_icon(REST_C, 0.9).next_to(beam, RIGHT, buff=0.1)
        springs = VGroup()
        for zz in range(15, 200, 22):
            for s in (-1, 1):
                x1, x2, yy = cx + s * 0.72, cx + s * 1.05, Y(zz)
                pts = [[x1, yy, 0]] + [[x1 + (x2 - x1) * f, yy + (0.06 if j % 2 else -0.06), 0] for j, f in enumerate(np.linspace(0.15, 0.85, 6))] + [[x2, yy, 0]]
                springs.add(VMobject().set_points_as_corners(pts).set_stroke(ACCENT, 2))
        wall = VGroup(*[Line([cx + s * 1.08, y_sb, 0], [cx + s * 1.08, y_end, 0], stroke_color="#8C7A62", stroke_width=2) for s in (-1, 1)])
        with self.voice("l_soil_1") as d:
            self.play(FadeIn(VGroup(soil, sea, sbl, wall, col, wh, beam, lk)), run_time=0.25 * d)
            self.play(LaggedStart(*[Create(s_) for s_ in springs], lag_ratio=0.03), run_time=0.3 * d)
            sl = T("t–z soil springs: skin friction\non the hole wall", 16, ACCENT).move_to([cx + 3.0, Y(60), 0])
            self.play(FadeIn(sl), run_time=0.2 * d)
        with self.voice("l_soil_2") as d:
            self.play(FadeOut(sl), run_time=0.4)
            z1 = Rectangle(width=3.6, height=Y(0) - Y(110)).set_fill(ACCENT, 0.12).set_stroke(ACCENT, 1.2).move_to([cx, (Y(0) + Y(110)) / 2, 0])
            z2 = Rectangle(width=3.6, height=Y(110) - y_end).set_fill(GOOD, 0.1).set_stroke(GOOD, 1.2).move_to([cx, (Y(110) + y_end) / 2, 0])
            t1 = T("0 – 110 m: moves\nonly 2–5 mm", 16, ACCENT, weight=BOLD).move_to([cx + 3.0, Y(55), 0])
            t2 = T("below: locked by\ncement + rock", 16, GOOD, weight=BOLD).move_to([cx + 3.0, Y(160), 0])
            t0 = T("held by the restraint", 16, REST_C, weight=BOLD).move_to([cx + 3.3, y_sb + 0.48, 0])
            self.play(FadeIn(t0), run_time=0.15 * d)
            self.play(FadeIn(z1), FadeIn(t1), run_time=0.2 * d)
            self.play(FadeIn(z2), FadeIn(t2), run_time=0.2 * d)
            nofr = T("no sliding → little friction → no relief for the restraint", 19, INK, weight=BOLD).move_to([2.2, -3.35, 0])
            self.play(FadeIn(nofr), run_time=0.15 * d)
        with self.voice("l_soil_3") as d:
            self.play(FadeOut(nofr), run_time=0.3)
            self.play(col.animate.shift(DOWN * 0.12), run_time=0.15 * d, rate_func=there_and_back_with_pause)
            ups = VGroup(*[arrow([cx + s * 0.9, Y(zz) - 0.2, 0], [cx + s * 0.9, Y(zz) + 0.2, 0], ACCENT, 4, 0.1) for s in (-1, 1) for zz in (30, 65, 100)])
            self.play(LaggedStart(*[GrowArrow(a) for a in ups], lag_ratio=0.05), run_time=0.15 * d)
            tt = VGroup(T("the column can only push DOWN into the soil", 19, INK, weight=BOLD),
                        T("soft soil → more give → lower lock-in load", 18, A_C),
                        T("stiff soil → no give → load → hand-calc bound", 18, REST_C)).arrange(DOWN, aligned_edge=LEFT, buff=0.12).move_to([2.2, 0.0, 0])
            self.play(FadeOut(VGroup(t0, t1, t2)), FadeIn(tt, shift=LEFT * 0.1), run_time=0.4 * d)
        # ------------------------------------------------ sensitivity chart
        with self.voice("l_soil_4") as d:
            self.play(FadeOut(tt), FadeOut(ups), run_time=0.5)
            facs = [s_["factor"] for s_ in LA["soil"]]
            xs = {f: -0.6 + i * 2.15 for i, f in enumerate(facs)}
            labs = {0.1: "× 0.1", 0.25: "× 0.25", 1.0: "× 1 (base)", 4.0: "× 4"}

            def panel(y0, y1, vmax, step, unit, key):
                Yp = lambda v: y1 + (y0 - y1) * v / vmax
                g = VGroup(Line([-1.1, y1, 0], [6.4, y1, 0], stroke_color=MUTED, stroke_width=2))
                for v in range(0, int(vmax) + 1, step):
                    g.add(Line([-1.1, Yp(v), 0], [6.4, Yp(v), 0], stroke_color=GRID, stroke_width=1), T(f"{v}", 13, MUTED).next_to([-1.1, Yp(v), 0], LEFT, buff=0.08))
                g.add(T(unit, 16, INK).move_to([-1.1, y0 + 0.3, 0], aligned_edge=LEFT))
                series = VGroup()
                for L, c in ((LA, A_C), (LB, B_C)):
                    pts = [[xs[s_["factor"]], Yp(s_[key]), 0] for s_ in L["soil"]]
                    series.add(VMobject().set_points_as_corners(pts).set_stroke(c, 4), *[Dot(p, radius=0.06, color=c) for p in pts])
                return g, series, Yp
            g1, s1, Y1 = panel(2.6, 0.55, 30, 10, "lock-in load [MN]", "R_MN")
            g2, s2, Y2 = panel(-0.55, -2.6, 200, 100, "free wellhead growth [mm]", "free_mm")
            xl = VGroup(*[T(labs[f], 14, MUTED).move_to([xs[f], -2.9, 0]) for f in facs])
            xt = T("soil strength vs. base case", 15, INK).move_to([2.6, -3.3, 0])
            b1 = DashedLine([-1.1, Y1(LA["upper_bound_MN"]), 0], [6.4, Y1(LA["upper_bound_MN"]), 0], stroke_color=A_C, dash_length=0.08, stroke_opacity=0.7)
            b2 = DashedLine([-1.1, Y1(LB["upper_bound_MN"]), 0], [6.4, Y1(LB["upper_bound_MN"]), 0], stroke_color=B_C, dash_length=0.08, stroke_opacity=0.7)
            bl = T("dashed: hand-calc bounds", 13, MUTED).move_to([5.3, 2.85, 0])
            leg = VGroup(VGroup(Line(ORIGIN, RIGHT * 0.3, stroke_color=A_C, stroke_width=4), T(NAME_A, 14, A_C)).arrange(RIGHT, buff=0.08),
                         VGroup(Line(ORIGIN, RIGHT * 0.3, stroke_color=B_C, stroke_width=4), T(NAME_B, 14, B_C)).arrange(RIGHT, buff=0.08)).arrange(RIGHT, buff=0.3).move_to([2.6, 3.2, 0])
            self.play(FadeIn(VGroup(g1, g2, xl, xt, leg)), run_time=0.12 * d)
            self.play(Create(s1), Create(b1), Create(b2), FadeIn(bl), run_time=0.3 * d)
            a1 = T(f"{LA['soil'][0]['R_MN']:.0f}", 14, A_C, weight=BOLD).next_to(s1[1], DOWN, buff=0.06)
            a2 = T(f"{LA['soil'][-1]['R_MN']:.1f}", 14, A_C, weight=BOLD).next_to(s1[4], DOWN, buff=0.06)
            self.play(FadeIn(a1), FadeIn(a2), run_time=0.1 * d)
            self.play(Create(s2), run_time=0.25 * d)
            a3 = T(f"{LA['soil'][0]['free_mm']:.0f} mm", 14, A_C, weight=BOLD).next_to(s2[1], RIGHT, buff=0.08)
            a4 = T(f"{LA['soil'][-1]['free_mm']:.0f} mm", 14, A_C, weight=BOLD).next_to(s2[4], UP, buff=0.06)
            self.play(FadeIn(a3), FadeIn(a4), run_time=0.1 * d)
        with self.voice("l_soil_5") as d:
            self.play(FadeOut(VGroup(g1, g2, s1, s2, xl, xt, b1, b2, bl, leg, a1, a2, a3, a4)), run_time=0.6)
            c1 = note_card(["friction capacity over the 80 m conductor:", "12.4 MN (A), 14.5 MN (B)  <  blocked 16.4 / 23.2 MN",
                            "→ the top slides and grows ≈ 44 / 41 mm on its own"], width=7.0, title="1  How far a free wellhead grows", tcol=ACCENT)
            c2 = note_card(["the lock-in load leaves through the restraint's anchor:", "19.5 MN (A), 24.1 MN (B) of uplift, in the same soil",
                            "a dead-weight restraint would need ≈ 2,000–2,500 t"], width=7.0, title="2  The restraint's own anchor", tcol=REST_C)
            VGroup(c1, c2).arrange(DOWN, buff=0.35).move_to([2.55, 0.0, 0])
            self.play(FadeIn(c1, shift=UP * 0.15), run_time=0.35 * d)
            self.play(FadeIn(c2, shift=UP * 0.15), run_time=0.35 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
