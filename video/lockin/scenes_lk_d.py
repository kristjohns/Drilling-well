"""Lock-in load video, scenes 9-10: hold-down piles (size, and how fully they hold)."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lk_common import *  # noqa: F401,F403,E402
from lk_common import ROOT  # noqa: E402
from scenes_a import wh_stack  # noqa: E402
from scenes_cmp_a import casing_lines  # noqa: E402
from scenes_lk_c import mini_axes  # noqa: E402

PL = json.load(open(os.path.join(ROOT, "analysis", "results", "piles.json")))
PA, PB = PL["cases"]["30x1"], PL["cases"]["36x1.5"]
PILE_C = "#8FA0B8"
PILE_S = "#C9D3E0"
FRIC = "#3DD6D0"


def row_for(P, D):
    return [r for r in P["piles"] if abs(r["D_m"] - D) < 1e-6][0]


def coupled(P, D, frame):
    return [c for c in P["coupled"] if abs(c["D_m"] - D) < 1e-6 and c["frame"] == frame][0]


def free10(key):
    return [t for t in LK[key]["time"] if t["days"] == 3650][0]["free_mm"]


def pile_rect(x, y_top, h, w, color=PILE_C):
    return Rectangle(width=w, height=h).set_fill(color, 1).set_stroke(PILE_S, 1.2).move_to([x, y_top - h / 2, 0])


class L09_Piles(VScene):
    def construct(self):
        hdr = self.header(8, "Holding it down: four piles")
        cx, y_sb, y_bot = -3.6, 0.2, -3.85
        sea = Rectangle(width=7.0, height=3.2 - y_sb).set_fill(color=["#14507A", "#071827"], opacity=1).set_stroke(width=0)
        sea.set_sheen_direction(DOWN).move_to([cx, (3.2 + y_sb) / 2, 0])
        rock = Rectangle(width=7.0, height=y_sb - y_bot).set_fill(color=["#3A2C20", BG], opacity=1).set_stroke(width=0)
        rock.set_sheen_direction(DOWN).move_to([cx, (y_sb + y_bot) / 2, 0])
        seabed = Line([cx - 3.5, y_sb, 0], [cx + 3.5, y_sb, 0], stroke_color="#8C7A62", stroke_width=3)
        wl = casing_lines(cx, y_sb, y_bot + 0.05, scale=0.62)
        st = wh_stack(0.6, [cx, y_sb + 0.01, 0])
        top = st.get_top()[1] + 0.02
        hw = 2.45
        posts = VGroup(*[Rectangle(width=0.24, height=top - y_sb).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1.2)
                         .move_to([cx + s * hw, (top + y_sb) / 2, 0]) for s in (-1, 1)])
        beam = Rectangle(width=2 * hw + 0.5, height=0.28).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1.2).move_to([cx, top + 0.14, 0])
        L_draw = 3.7
        piles = VGroup(*[pile_rect(cx + s * hw, y_sb, L_draw, 0.3) for s in (-1, 1)])
        with self.voice("p_1") as d:
            self.play(FadeIn(VGroup(sea, rock, seabed)), FadeIn(wl), FadeIn(st), run_time=0.1 * d)
            self.play(LaggedStart(*[GrowFromEdge(p, UP) for p in piles], lag_ratio=0.25), run_time=0.15 * d)
            self.play(FadeIn(posts), FadeIn(beam, shift=DOWN * 0.15), run_time=0.1 * d)
            aR = arrow([cx, top + 1.05, 0], [cx, top + 0.3, 0], REST_C, 7, 0.2)
            tR = T("R  pushes the wellhead down", 17, REST_C, weight=BOLD).next_to(aR, RIGHT, buff=0.12).shift(UP * 0.15)
            ups = VGroup(*[arrow([cx + s * hw + s * 0.42, y_sb - 1.15, 0], [cx + s * hw + s * 0.42, y_sb - 0.25, 0], ACCENT, 5, 0.16)
                           for s in (-1, 1)])
            tU = T("R/4 uplift\non each pile", 14, ACCENT, weight=BOLD).next_to(ups[1], RIGHT, buff=0.06)
            self.play(GrowArrow(aR), FadeIn(tR), run_time=0.12 * d)
            self.play(*[GrowArrow(a) for a in ups], FadeIn(tU), run_time=0.12 * d)
            # plan view
            pc = np.array([3.7, 0.55, 0])
            s_ = 1.55
            corners = [pc + np.array([a * s_, b * s_, 0]) for a, b in ((-1, -1), (-1, 1), (1, 1), (1, -1))]
            frame_pl = VGroup(*[Line(corners[i], corners[(i + 1) % 4], stroke_color="#A0AEC0", stroke_width=5) for i in range(4)],
                              *[Line(pc, c, stroke_color="#A0AEC0", stroke_width=5) for c in corners])
            pls = VGroup(*[Circle(radius=0.27).set_fill(PILE_C, 1).set_stroke(PILE_S, 1.5).move_to(c) for c in corners])
            whp = Circle(radius=0.38).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5).move_to(pc)
            pt = T("plan view", 18, MUTED).move_to(pc + UP * (s_ + 0.65))
            pll = T("4 piles", 16, ACCENT, weight=BOLD).next_to(pls[2], RIGHT, buff=0.15)
            whl = T("wellhead", 14, INK).next_to(whp, DOWN, buff=0.12)
            self.play(FadeIn(pt), Create(frame_pl), FadeIn(whp), FadeIn(whl), run_time=0.15 * d)
            self.play(LaggedStart(*[FadeIn(p, scale=0.6) for p in pls], lag_ratio=0.2), FadeIn(pll), run_time=0.15 * d)
        plan = VGroup(frame_pl, pls, whp, pt, pll, whl)
        with self.voice("p_2") as d:
            self.play(FadeOut(plan), run_time=0.5)
            xl, xa, xb = 0.85, 4.85, 6.3
            dA, dB = PA["loads_MN"]["bound_10yr"], PB["loads_MN"]["bound_10yr"]
            pA, pB = PA["P_design_pile_MN"], PB["P_design_pile_MN"]
            rows = [("design load (10-yr hand bound)", f"{dA:.1f} MN", f"{dB:.1f} MN"),
                    ("÷ 4 piles", f"{pA:.1f} MN", f"{pB:.1f} MN"),
                    ("≈ weight equivalent per pile", f"{round(pA * 1e3 / 9.81, -1):.0f} t", f"{round(pB * 1e3 / 9.81, -1):.0f} t"),
                    ("× safety factor 2 → capacity", f"{2 * pA:.1f} MN", f"{2 * pB:.1f} MN")]
            head = VGroup(T(NAME_A, 19, A_C, weight=BOLD).move_to([xa, 2.35, 0]), T(NAME_B, 19, B_C, weight=BOLD).move_to([xb, 2.35, 0]))
            sub = T("conductor", 14, MUTED).move_to([(xa + xb) / 2, 2.0, 0])
            tab = VGroup()
            for i, (lab, va, vb) in enumerate(rows):
                yy = 1.35 - 0.72 * i
                bold = i in (1, 3)
                r_ = VGroup(T(lab, 16, INK if bold else MUTED).move_to([xl, yy, 0], aligned_edge=LEFT),
                            T(va, 21 if bold else 19, INK, weight=BOLD if bold else NORMAL).move_to([xa, yy, 0]),
                            T(vb, 21 if bold else 19, INK, weight=BOLD if bold else NORMAL).move_to([xb, yy, 0]))
                if i == 3:
                    r_.add(Line([xl, yy + 0.38, 0], [6.9, yy + 0.38, 0], stroke_color=GRID, stroke_width=1.5))
                tab.add(r_)
            self.play(FadeIn(head), FadeIn(sub), run_time=0.06 * d)
            for i, r_ in enumerate(tab):
                self.play(FadeIn(r_, shift=LEFT * 0.1), run_time=0.07 * d)
                if i < 3:
                    self.wait((0.16, 0.16, 0.12)[i] * d)
            hl = SurroundingRectangle(tab[3][:3], color=ACCENT, buff=0.1, corner_radius=0.1)
            self.play(Create(hl), run_time=0.08 * d)
        with self.voice("p_3") as d:
            self.play(FadeOut(VGroup(head, sub, tab, hl)), run_time=0.5)
            e1 = M(r"Q_{up} = \alpha\,\pi D \int_0^L s_u\,dz \;+\; W'", 38, INK).move_to([3.65, 2.15, 0])
            e1n = T("skin friction only — no end bearing in uplift", 16, MUTED).next_to(e1, DOWN, buff=0.2)
            e2 = M(r"s_u = 10 + 2z\ \mathrm{kPa},\qquad \alpha = 0.6", 30, INK).move_to([3.65, 0.55, 0])
            e3 = M(r"Q_{shaft} = 0.6\,\pi D\,(10L + L^2)\ \mathrm{kN}", 32, ACCENT).move_to([3.65, -0.45, 0])
            e4 = M(r"\text{need:}\quad Q_{shaft} \ge 2\,(P - W')", 30, INK).move_to([3.65, -1.5, 0])
            e4n = T("D, L in metres · W' = submerged pile weight", 14, MUTED).next_to(e4, DOWN, buff=0.2)
            self.play(Write(e1), run_time=0.18 * d)
            self.play(FadeIn(e1n), run_time=0.06 * d)
            # friction arrows along the right pile, growing with depth (s_u grows with z)
            xp = cx + hw
            fr = VGroup()
            for k in range(7):
                yy = y_sb - 0.35 - k * 0.52
                ln = 0.14 + 0.06 * k
                for s in (-1, 1):
                    fr.add(arrow([xp + s * 0.27, yy + ln / 2, 0], [xp + s * 0.27, yy - ln / 2, 0], FRIC, 3, 0.09))
            tip = VGroup(Line([xp - 0.17, y_sb - L_draw - 0.05, 0], [xp + 0.17, y_sb - L_draw - 0.35, 0], stroke_color=REST_C, stroke_width=4),
                         Line([xp + 0.17, y_sb - L_draw - 0.05, 0], [xp - 0.17, y_sb - L_draw - 0.35, 0], stroke_color=REST_C, stroke_width=4))
            frl = T("friction\ngrows\nwith depth", 14, FRIC, weight=BOLD).next_to([xp + 0.4, y_sb - 2.2, 0], RIGHT, buff=0.05)
            self.play(LaggedStart(*[GrowArrow(a) for a in fr], lag_ratio=0.05), FadeIn(frl), Create(tip), run_time=0.2 * d)
            self.play(FadeIn(e2), run_time=0.1 * d)
            self.play(Write(e3), run_time=0.15 * d)
            self.play(FadeIn(e4), FadeIn(e4n), run_time=0.1 * d)
        with self.voice("p_4") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.6)
            yt, vs = 2.2, 5.6 / 90.0
            hx = 5 * vs
            x0, x1 = -6.45, 0.55
            soil = Rectangle(width=x1 - x0, height=yt + 3.7).set_fill(color=["#3A2C20", BG], opacity=1).set_stroke(width=0)
            soil.set_sheen_direction(DOWN).move_to([(x0 + x1) / 2, (yt - 3.7) / 2, 0])
            sbl = Line([x0, yt, 0], [x1, yt, 0], stroke_color="#8C7A62", stroke_width=3)
            ticks = VGroup()
            for z in (20, 40, 60, 80):
                ticks.add(Line([x0 + 0.05, yt - z * vs, 0], [x0 + 0.2, yt - z * vs, 0], stroke_color=MUTED, stroke_width=2),
                          T(f"{z} m", 13, MUTED).next_to([x0 + 0.2, yt - z * vs, 0], RIGHT, buff=0.06))
            cond_ = pile_rect(-5.2, yt, 80 * vs, 0.762 * hx, C30)
            cond_l = T("30\" conductor\n(80 m)", 13, C30).next_to(cond_, UP, buff=0.12)
            spec = [(PA, 1.5, -3.85, A_C), (PA, 2.0, -2.75, A_C), (PB, 1.5, -1.25, B_C), (PB, 2.0, -0.15, B_C)]
            prs, pls = VGroup(), VGroup()
            for P, D, x, c in spec:
                r = row_for(P, D)
                pr = pile_rect(x, yt, r["L_round"] * vs, D * hx, PILE_C).set_stroke(c, 2)
                prs.add(pr)
                pls.add(T(f"Ø{D:.1f} m\n{r['L_round']} m", 14, c, weight=BOLD).next_to(pr, DOWN, buff=0.1))
            ga = T(NAME_A + " conductor", 15, A_C, weight=BOLD).move_to([-3.3, yt + 0.35, 0])
            gb = T(NAME_B + " conductor", 15, B_C, weight=BOLD).move_to([-0.7, yt + 0.35, 0])
            ex = T("widths × 5", 13, FAINT).move_to([-6.0, -3.75, 0])
            self.play(FadeIn(soil), Create(sbl), FadeIn(ticks), FadeIn(ex), run_time=0.08 * d)
            self.play(GrowFromEdge(cond_, UP), FadeIn(cond_l), run_time=0.1 * d)
            self.play(FadeIn(ga), FadeIn(gb), run_time=0.05 * d)
            self.play(LaggedStart(*[AnimationGroup(GrowFromEdge(p, UP), FadeIn(l)) for p, l in zip(prs[:2], pls[:2])], lag_ratio=0.4), run_time=0.22 * d)
            # table on the right
            tt = T("4 piles per well", 21, INK, weight=BOLD).move_to([1.3, 2.4, 0], aligned_edge=LEFT)
            lines = VGroup()
            yy = 1.6
            for P, nm, c in ((PA, NAME_A, A_C), (PB, NAME_B, B_C)):
                h_ = T(f"{nm} conductor · {P['P_design_pile_MN']:.1f} MN per pile", 17, c, weight=BOLD).move_to([1.3, yy, 0], aligned_edge=LEFT)
                lines.add(h_)
                yy -= 0.55
                for D in (1.5, 2.0):
                    r = row_for(P, D)
                    lines.add(T(f"Ø {D:.1f} m × {r['t_mm']:.0f} mm wall · {r['L_round']} m · {r['mass_round_t']:.0f} t", 17, INK)
                              .move_to([1.55, yy, 0], aligned_edge=LEFT))
                    yy -= 0.5
                yy -= 0.35
            self.play(FadeIn(tt), FadeIn(lines[:3]), run_time=0.1 * d)
            self.play(LaggedStart(*[AnimationGroup(GrowFromEdge(p, UP), FadeIn(l)) for p, l in zip(prs[2:], pls[2:])], lag_ratio=0.4),
                      FadeIn(lines[3:]), run_time=0.2 * d)
        with self.voice("p_5") as d:
            self.play(FadeOut(VGroup(tt, lines)), run_time=0.5)
            g, X, Y = mini_axes(4.35, 0.15, 4.6, 3.5, (0.9, 2.6), (0, 90), [1.0, 1.5, 2.0, 2.5], [0, 30, 60, 90],
                                "pile diameter [m]", "required length [m]")
            self.play(FadeIn(g), run_time=0.08 * d)
            cv = VGroup()
            for P, c in ((PA, A_C), (PB, B_C)):
                pts = [[X(r["D_m"]), Y(r["L_m"]), 0] for r in P["piles"]]
                cv.add(VGroup(VMobject().set_points_smoothly(pts).set_stroke(c, 4), *[Dot(p, radius=0.05, color=c) for p in pts]))
            la = T("A", 15, A_C, weight=BOLD).next_to(cv[0][1], LEFT, buff=0.1)
            lb = T("B", 15, B_C, weight=BOLD).next_to(cv[1][1], LEFT, buff=0.1)
            self.play(Create(cv[0]), Create(cv[1]), FadeIn(la), FadeIn(lb), run_time=0.2 * d)
            sA = row_for(PA, 1.0)["L_m"] - row_for(PA, 2.0)["L_m"]
            sB = row_for(PB, 1.0)["L_m"] - row_for(PB, 2.0)["L_m"]
            n1 = T(f"Ø 1 → 2 m saves only {sA:.0f}–{sB:.0f} m", 17, INK, weight=BOLD).move_to([4.35, -2.95, 0])
            mA = (row_for(PA, 1.0)["mass_round_t"], row_for(PA, 2.5)["mass_round_t"])
            n2 = T(f"…and the steel mass grows: {mA[0]:.0f} t → {mA[1]:.0f} t per pile (A)", 15, MUTED).next_to(n1, DOWN, buff=0.14)
            self.play(FadeIn(n1), run_time=0.12 * d)
            self.play(FadeIn(n2), run_time=0.1 * d)
            As = 3.14159 * (1.5 ** 2 - (1.5 - 0.08) ** 2) / 4
            n3 = note_card([f"steel stress only ≈ {PA['P_design_pile_MN'] / As:.0f}–{PB['P_design_pile_MN'] / As:.0f} MPa",
                            "wall set by driving + handling, not the pull"], width=4.8, color=GOOD)
            n3.move_to([4.35, 2.95, 0]).scale(0.9)
            self.play(FadeIn(n3, shift=DOWN * 0.1), run_time=0.15 * d)
        with self.voice("p_6") as d:
            self.play(FadeOut(VGroup(g, cv, la, lb, n1, n2, n3)), run_time=0.5)
            ttl = T("Ø 1.5 m pile: required length", 20, INK, weight=BOLD).move_to([4.0, 2.45, 0])
            self.play(FadeIn(ttl), run_time=0.05 * d)
            order = [(1, "base: α 0.6, FS 2"), (3, "cyclic: α 0.45"), (2, "FS 1.5"), (4, "API α ≈ 0.85")]
            bx0, bs = 3.25, 0.04
            bars = VGroup()
            for j, (i, lab) in enumerate(order):
                yy = 1.55 - 1.05 * j
                sa, sb = PA["sens"][i]["L_1p5"], PB["sens"][i]["L_1p5"]
                grp = VGroup(T(lab, 16, INK if j == 0 else MUTED, weight=BOLD if j == 0 else NORMAL).move_to([bx0 - 0.15, yy, 0], aligned_edge=RIGHT))
                for v, c, dy in ((sa, A_C, 0.17), (sb, B_C, -0.17)):
                    r_ = Rectangle(width=v * bs, height=0.26).set_fill(c, 1).set_stroke(width=0).move_to([bx0 + v * bs / 2, yy + dy, 0])
                    grp.add(r_, T(f"{v:.0f} m", 14, INK).next_to(r_, RIGHT, buff=0.08))
                bars.add(grp)
            self.play(LaggedStart(*[FadeIn(b, shift=RIGHT * 0.15) for b in bars], lag_ratio=0.5), run_time=0.7 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class L10_PileGroup(VScene):
    def construct(self):
        hdr = self.header(9, "Do four piles hold it fully?")
        cA, cB = PA["curves"], PB["curves"]
        with self.voice("g_1") as d:
            g, X, Y = mini_axes(-3.2, 0.1, 5.6, 3.8, (0, 30), (0, 15), [0, 10, 20, 30], [0, 5, 10, 15],
                                "pile head rise [mm]", "pull on one pile [MN]")
            self.play(FadeIn(g), run_time=0.08 * d)
            cv, marks = VGroup(), VGroup()
            for P, cu, c, nm in ((PA, cA, A_C, "A"), (PB, cB, B_C, "B")):
                pc = cu["pile_1p5"]
                pts = [[X(u), Y(p), 0] for u, p in zip(pc["head_mm"], pc["P_MN"]) if u <= 30]
                cv.add(VMobject().set_points_smoothly(pts).set_stroke(c, 4))
                Pd = P["P_design_pile_MN"]
                ud = float(np.interp(Pd, pc["P_MN"], pc["head_mm"]))
                marks.add(VGroup(DashedLine([X(0), Y(Pd), 0], [X(ud), Y(Pd), 0], stroke_color=c, dash_length=0.06),
                                 DashedLine([X(ud), Y(0), 0], [X(ud), Y(Pd), 0], stroke_color=c, dash_length=0.06),
                                 Dot([X(ud), Y(Pd), 0], radius=0.07, color=c),
                                 T(f"{nm}: {Pd:.1f} MN → {ud:.0f} mm", 15, c, weight=BOLD)
                                 .move_to([X(12.8 if nm == "A" else 17.2), Y(Pd), 0], aligned_edge=LEFT)))
            leg = VGroup(T(f"A: Ø 1.5 m × {cA['L_1p5']} m (30\")", 15, A_C), T(f"B: Ø 1.5 m × {cB['L_1p5']} m (36\")", 15, B_C))
            leg.arrange(DOWN, aligned_edge=LEFT, buff=0.1).move_to([X(17), Y(3.2), 0], aligned_edge=LEFT)
            self.play(Create(cv[0]), Create(cv[1]), FadeIn(leg), run_time=0.3 * d)
            self.play(LaggedStart(*[FadeIn(m) for m in marks], lag_ratio=0.4), run_time=0.25 * d)
            stA = float(np.interp(PA["P_design_pile_MN"], cA["pile_1p5"]["P_MN"], cA["pile_1p5"]["stretch_mm"]))
            stB = float(np.interp(PB["P_design_pile_MN"], cB["pile_1p5"]["P_MN"], cB["pile_1p5"]["stretch_mm"]))
            card = note_card([f"steel stretch:  {stA:.0f} mm (A) · {stB:.0f} mm (B)",
                              "soil slip to build friction:  ≈ 4–5 mm",
                              "full friction needs ≈ 1 % of D of slip"], width=5.3, title="where the rise comes from")
            card.move_to([4.0, 0.6, 0])
            self.play(FadeIn(card, shift=LEFT * 0.1), run_time=0.15 * d)
        with self.voice("g_2") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.6)
            g, X, Y = mini_axes(-2.75, 0.05, 7.2, 4.6, (0, 70), (0, 30), [0, 10, 20, 30, 40, 50, 60, 70], [0, 10, 20, 30],
                                "wellhead rise the restraint allows [mm]", "restraint force after 10 years [MN]")
            self.play(FadeIn(g), run_time=0.06 * d)
            wcv = VGroup()
            for cu, c in ((cA, A_C), (cB, B_C)):
                u, R = np.array(cu["well"]["u_mm"]), np.array(cu["well"]["R_MN"])
                i0 = int(np.argmax(R < 0))
                uz = u[i0 - 1] + (u[i0] - u[i0 - 1]) * R[i0 - 1] / (R[i0 - 1] - R[i0])
                pts = [[X(a), Y(b), 0] for a, b in zip(u[:i0], R[:i0])] + [[X(uz), Y(0), 0]]
                wcv.add(VMobject().set_points_smoothly(pts).set_stroke(c, 5))
            wl = VGroup(T("the well: A", 15, A_C, weight=BOLD).move_to([X(33), Y(12.5), 0]),
                        T("the well: B", 15, B_C, weight=BOLD).move_to([X(40), Y(12.5), 0]))
            wl[0].move_to([X(21), Y(7.6), 0], aligned_edge=LEFT)
            wl[1].move_to([X(25), Y(17.6), 0], aligned_edge=LEFT)
            self.play(Create(wcv[0]), Create(wcv[1]), FadeIn(wl), run_time=0.3 * d)
            n1 = T("more rise allowed → less force", 16, MUTED).move_to([X(46), Y(25), 0])
            self.play(FadeIn(n1), run_time=0.1 * d)
            rA, rB = coupled(PA, 1.5, "rigid frame"), coupled(PB, 1.5, "rigid frame")
            pcv = VGroup()
            for rr, c in ((rA, A_C), (rB, B_C)):
                k = rr["k_group_MN_per_m"] / 1000.0
                um = 29.5 / k
                pcv.add(Line([X(0), Y(0), 0], [X(um), Y(k * um), 0], stroke_color=c, stroke_width=3).set_opacity(0.85))
            pl = T(f"4 piles: ≈ {rA['k_group_MN_per_m'] / 1000:.1f}–{rB['k_group_MN_per_m'] / 1000:.1f} MN/mm", 16, ACCENT, weight=BOLD)
            pl.move_to([X(13.5), Y(28.3), 0], aligned_edge=LEFT)
            self.play(Create(pcv[0]), Create(pcv[1]), FadeIn(pl), run_time=0.25 * d)
        with self.voice("g_3") as d:
            fA, fB = coupled(PA, 1.5, "frame 5 GN/m"), coupled(PB, 1.5, "frame 5 GN/m")
            dots = VGroup(*[Dot([X(r["growth_mm"]), Y(r["R_MN"]), 0], radius=0.08, color=INK).set_stroke(c, 3)
                            for r, c in ((rA, A_C), (rB, B_C))])
            self.play(LaggedStart(*[FadeIn(dd, scale=1.6) for dd in dots], lag_ratio=0.3), run_time=0.1 * d)
            # table on the right
            xl, xa, xb = 1.35, 4.55, 6.2
            hd = VGroup(T("A · 30\"", 16, A_C, weight=BOLD).move_to([xa, 2.35, 0]), T("B · 36\"", 16, B_C, weight=BOLD).move_to([xb, 2.35, 0]))
            rowsd = [("fully locked", (0.0, LA["time"][-1]["R_MN"]), (0.0, LB["time"][-1]["R_MN"])),
                     ("4 piles, rigid frame", (rA["growth_mm"], rA["R_MN"]), (rB["growth_mm"], rB["R_MN"])),
                     ("+ frame 5 MN/mm", (fA["growth_mm"], fA["R_MN"]), (fB["growth_mm"], fB["R_MN"])),
                     ("free wellhead", (free10("30x1"), 0.0), (free10("36x1.5"), 0.0))]
            tb = VGroup()
            for i, (lab, a, b) in enumerate(rowsd):
                yy = 1.65 - 0.62 * i
                hi = i == 1
                tb.add(VGroup(T(lab, 15, INK if hi else MUTED, weight=BOLD if hi else NORMAL).move_to([xl, yy, 0], aligned_edge=LEFT),
                              T(f"{a[0]:.0f} mm · {a[1]:.1f}" if a[1] else f"{a[0]:.0f} mm · 0", 15, INK, weight=BOLD if hi else NORMAL).move_to([xa, yy, 0]),
                              T(f"{b[0]:.0f} mm · {b[1]:.1f}" if b[1] else f"{b[0]:.0f} mm · 0", 15, INK, weight=BOLD if hi else NORMAL).move_to([xb, yy, 0])))
            unit = T("wellhead rise · restraint force [MN], after 10 years", 13, FAINT).move_to([(xl + 6.9) / 2, -0.95, 0])
            self.play(FadeIn(hd), FadeIn(tb[0]), FadeIn(tb[1]), run_time=0.12 * d)
            self.play(FadeIn(tb[3]), FadeIn(unit), run_time=0.1 * d)
            self.wait(0.25 * d)
            fcv = VGroup()
            for rr, c in ((fA, A_C), (fB, B_C)):
                k = rr["k_group_MN_per_m"] / 1000.0
                um = 26.0 / k
                fcv.add(DashedLine([X(0), Y(0), 0], [X(um), Y(k * um), 0], stroke_color=c, stroke_width=3, dash_length=0.07))
            fd = VGroup(*[Dot([X(r["growth_mm"]), Y(r["R_MN"]), 0], radius=0.065, color=BG).set_stroke(c, 3) for r, c in ((fA, A_C), (fB, B_C))])
            fl = T("with a flexing frame", 14, MUTED).move_to([X(17), Y(22.5), 0], aligned_edge=LEFT)
            self.play(Create(fcv), FadeIn(fd), FadeIn(tb[2]), FadeIn(fl), run_time=0.2 * d)
        with self.voice("g_4") as d:
            self.play(FadeOut(VGroup(hd, tb, unit)), run_time=0.5)
            hb = (1 - rA["growth_mm"] / free10("30x1"), 1 - rB["growth_mm"] / free10("36x1.5"))
            ld = (rA["R_MN"] / LA["time"][-1]["R_MN"], rB["R_MN"] / LB["time"][-1]["R_MN"])
            s1 = VGroup(T(f"{100 * min(hb):.0f}–{100 * max(hb):.0f} %", 34, GOOD, weight=BOLD), T("of the growth held back", 17, INK)).arrange(DOWN, buff=0.08)
            s2 = VGroup(T(f"{100 * min(ld):.0f}–{100 * max(ld):.0f} %", 34, ACCENT, weight=BOLD), T("of the fully locked load", 17, INK)).arrange(DOWN, buff=0.08)
            s12 = VGroup(s1, s2).arrange(RIGHT, buff=0.5).move_to([4.05, 1.75, 0])
            self.play(FadeIn(s1, shift=UP * 0.1), run_time=0.12 * d)
            self.play(FadeIn(s2, shift=UP * 0.1), run_time=0.12 * d)
            ks = [r for r in PA["piles"] if r["D_m"] in (1.25, 1.5, 1.83, 2.0)]
            kt = VGroup(T("stiffness per pile, 30\" case [MN/m]", 15, MUTED),
                        VGroup(*[VGroup(T(f"Ø {r['D_m']:g} m", 14, MUTED), T(f"{r['k_pile_MN_per_m']:.0f}", 19, INK, weight=BOLD)).arrange(DOWN, buff=0.06)
                                 for r in ks]).arrange(RIGHT, buff=0.42)).arrange(DOWN, buff=0.18)
            kt.move_to([4.05, 0.0, 0])
            kn = T("slimmer + longer stretches more · fatter needs more slip", 14, MUTED).next_to(kt, DOWN, buff=0.15)
            self.play(FadeIn(kt), FadeIn(kn), run_time=0.15 * d)
            self.wait(0.2 * d)
            fin = note_card(["size the piles for the full lock-in load", "— the small rise is margin"], width=5.2, color=ACCENT)
            fin.move_to([4.05, -1.85, 0])
            self.play(FadeIn(fin, shift=UP * 0.1), run_time=0.12 * d)
        with self.voice("g_5") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.6)
            cards = [note_card(["≥ 3–5 D between piles", "and away from the conductor"], width=4.4, title="spacing"),
                     note_card(["20–30 MN in bending", "heavy, template-sized, stiff"], width=4.4, title="frame"),
                     note_card(["creep + cyclic degradation", "use real site soil data"], width=4.4, title="sustained pull"),
                     note_card(["4 × Ø ≈ 6 m, 19–24 m deep", "sustained pull: suction bleeds", "away → count on friction only"], width=4.4,
                               title="alternative: suction anchors", color=B_C)]
            pos = [(-4.55, 1.55), (0.15, 1.55), (-4.55, -1.15), (0.15, -1.15)]
            for c, p in zip(cards, pos):
                c.move_to([p[0], p[1], 0])
            # to-scale sketch: pile vs suction anchor for the 30" case
            ys, vs = 1.9, 0.05
            hx = 3 * vs
            sbl = Line([3.0, ys, 0], [6.95, ys, 0], stroke_color="#8C7A62", stroke_width=3)
            soil = Rectangle(width=3.95, height=ys + 3.6).set_fill(color=["#3A2C20", BG], opacity=1).set_stroke(width=0)
            soil.set_sheen_direction(DOWN).move_to([4.975, (ys - 3.6) / 2, 0])
            r15 = row_for(PA, 1.5)
            pr = pile_rect(3.85, ys, r15["L_round"] * vs, 1.5 * hx).set_stroke(A_C, 2)
            sA = PA["suction"][1]
            an = Rectangle(width=sA["D_m"] * hx, height=sA["L_m"] * vs).set_fill(PILE_C, 0.35).set_stroke(B_C, 2.5)
            an.move_to([5.7, ys - sA["L_m"] * vs / 2, 0])
            lid = Rectangle(width=sA["D_m"] * hx + 0.08, height=0.08).set_fill(PILE_C, 1).set_stroke(width=0).move_to([5.7, ys + 0.02, 0])
            pl_ = T(f"pile\nØ 1.5 × {r15['L_round']} m", 14, A_C, weight=BOLD).next_to(pr, RIGHT, buff=0.12).shift(DOWN * 0.6)
            al_ = T(f"suction anchor\nØ {sA['D_m']:.0f} × {sA['L_m']:.0f} m", 14, B_C, weight=BOLD).next_to(an, DOWN, buff=0.12)
            st_ = T("30\" case, to scale (widths × 3)", 14, MUTED).move_to([4.975, ys + 0.4, 0])
            self.play(FadeIn(cards[0], shift=UP * 0.1), run_time=0.08 * d)
            self.wait(0.12 * d)
            self.play(FadeIn(cards[1], shift=UP * 0.1), run_time=0.08 * d)
            self.wait(0.14 * d)
            self.play(FadeIn(cards[2], shift=UP * 0.1), run_time=0.08 * d)
            self.wait(0.1 * d)
            self.play(FadeIn(cards[3], shift=UP * 0.1), FadeIn(VGroup(soil, sbl, st_)), run_time=0.1 * d)
            self.play(GrowFromEdge(pr, UP), FadeIn(pl_), GrowFromEdge(an, UP), FadeIn(lid), FadeIn(al_), run_time=0.15 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
