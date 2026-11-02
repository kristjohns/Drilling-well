"""Lock-in load video, scenes 1-3: intro, definition / load path, inputs."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lk_common import *  # noqa: F401,F403,E402
from scenes_a import wh_stack  # noqa: E402
from scenes_cmp_a import sea_and_rock, casing_lines  # noqa: E402

STR_DT = {"30": 61, "20": 75, "13-3/8": 87, "9-5/8": 97, "tubing": 101}


class L01_Intro(VScene):
    def construct(self):
        y_sb = -1.35
        self.add(sea_and_rock(y_sb))
        wl = casing_lines(0, y_sb, -3.9)
        st = wh_stack(0.9, [0, y_sb + 0.01, 0])
        frame = restraint_frame(0, y_sb, 1.65, st.get_top()[1] + 0.02)
        self.add(wl, st, frame)
        title = T("Conductor Lock-In Load", 52, INK, weight=BOLD).move_to([0, 3.15, 0])
        sub = T("the force it takes to stop a subsea wellhead from growing", 25, "#BFD3EA").next_to(title, DOWN, buff=0.18)
        beam_top = frame[3].get_top()[1]
        with self.voice("l_intro_1") as d:
            self.play(FadeIn(title, shift=UP * 0.2), FadeIn(sub), run_time=1.5)
            self.play(*[ln.animate.set_stroke(color=temp_color(STR_DT[ln.key]), width=7) for ln in wl], run_time=0.3 * d)
            arrs = VGroup(*[arrow([x, beam_top + 0.75, 0], [x, beam_top + 0.03, 0], REST_C, 7, 0.2) for x in (-0.9, 0, 0.9)])
            lbl = T("blocked expansion → force", 22, REST_C, weight=BOLD).next_to(arrs, RIGHT, buff=0.35)
            self.play(LaggedStart(*[GrowArrow(a) for a in arrs], lag_ratio=0.2), FadeIn(lbl), run_time=0.3 * d)
        with self.voice("l_intro_2") as d:
            dim = Rectangle(width=config.frame_width, height=config.frame_height).set_fill(BG, 0.78).set_stroke(width=0)
            self.play(FadeIn(dim), FadeOut(lbl), run_time=0.6)
            cards = VGroup()
            for name, R, t_, col in ((NAME_A + " conductor", LA["R_MN"], "≈ 1,990 tonnes", A_C), (NAME_B + " conductor", LB["R_MN"], "≈ 2,460 tonnes", B_C)):
                g = VGroup(T(name, 24, col, weight=BOLD), T(f"{R:.1f} MN", 60, INK, weight=BOLD), T(t_, 22, MUTED)).arrange(DOWN, buff=0.18)
                box = RoundedRectangle(corner_radius=0.2, width=5.2, height=g.height + 0.7).set_fill(PANEL, 1).set_stroke(col, 2)
                g.move_to(box)
                cards.add(VGroup(box, g))
            cards.arrange(RIGHT, buff=0.6).move_to([0, 0.0, 0])
            cap = T("lock-in load after 1 year of production  ·  wellhead flowing temperature 108 °C", 18, MUTED).next_to(cards, DOWN, buff=0.35)
            self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.2) for c in cards], lag_ratio=0.5), run_time=0.45 * d)
            self.play(FadeIn(cap), run_time=0.15 * d)
        with self.voice("l_intro_3") as d:
            chips = VGroup(*[pill(t_) for t_ in ("definition", "hand calculation", "inner strings", "the soil", "model results", "checks")])
            chips.arrange(RIGHT, buff=0.18).move_to([0, -2.85, 0])
            if chips.width > 13.6:
                chips.scale_to_fit_width(13.6)
            self.play(LaggedStart(*[FadeIn(c, shift=UP * 0.15) for c in chips], lag_ratio=0.3), run_time=0.7 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class L02_Definition(VScene):
    def construct(self):
        hdr = self.header(1, "What the lock-in load is")
        x0, y_sb = -3.3, -0.85
        sea = Rectangle(width=7.6, height=4.2 - y_sb).set_fill(color=["#10405F", "#08192A"], opacity=1).set_stroke(width=0).set_sheen_direction(DOWN)
        sea.move_to([x0, (3.3 + y_sb) / 2 - 0.0, 0]).stretch_to_fit_height(3.3 - y_sb).move_to([x0, (3.3 + y_sb) / 2, 0])
        soil = Rectangle(width=7.6, height=y_sb + 4.0).set_fill(ROCK, 1).set_stroke(width=0).move_to([x0, (y_sb - 4.0) / 2, 0])
        sb = Line([x0 - 3.8, y_sb, 0], [x0 + 3.8, y_sb, 0], stroke_color="#8C7A62", stroke_width=3)
        y_shoe = -2.95
        cem = VGroup(band(x0 - 1.15, x0 - 1.0, y_sb, y_shoe, CEMENT, 0.9), band(x0 + 1.0, x0 + 1.15, y_sb, y_shoe, CEMENT, 0.9),
                     band(x0 - 0.92, x0 - 0.72, y_sb, y_shoe, CEMENT, 0.9), band(x0 + 0.72, x0 + 0.92, y_sb, y_shoe, CEMENT, 0.9),
                     band(x0 - 0.9, x0 - 0.72, y_shoe, -4.0, CEMENT, 0.9), band(x0 + 0.72, x0 + 0.9, y_shoe, -4.0, CEMENT, 0.9))
        cond = VGroup(band(x0 - 1.0, x0 - 0.92, y_sb, y_shoe, C30), band(x0 + 0.92, x0 + 1.0, y_sb, y_shoe, C30))
        s20 = VGroup(band(x0 - 0.72, x0 - 0.66, y_sb, -4.0, C20), band(x0 + 0.66, x0 + 0.72, y_sb, -4.0, C20))
        inner = VGroup(*[band(x0 + s * r - 0.025, x0 + s * r + 0.025, y_sb, -4.0, c) for r, c in ((0.46, C1338), (0.3, C958), (0.12, CTBG)) for s in (-1, 1)])
        wh = RoundedRectangle(corner_radius=0.06, width=2.4, height=1.05).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5).move_to([x0, y_sb + 0.53, 0])
        whl = T("wellhead", 16, BG, weight=BOLD).move_to(wh)
        xt = RoundedRectangle(corner_radius=0.08, width=1.7, height=0.6).set_fill("#2C5878", 1).set_stroke("#9CC7E6", 1.5).next_to(wh, UP, buff=0)
        xtl = T("tree", 15, INK).move_to(xt)
        y_beam = xt.get_top()[1] + 0.3
        beam = Rectangle(width=5.4, height=0.3).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1.2).move_to([x0, y_beam, 0])
        pad = Rectangle(width=1.0, height=0.15).set_fill("#A0AEC0", 1).set_stroke(width=0).move_to([x0, (y_beam + xt.get_top()[1]) / 2 - 0.02, 0])
        posts = VGroup(*[Rectangle(width=0.24, height=y_beam - y_sb).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1).move_to([x0 + s * 2.45, (y_beam + y_sb) / 2, 0]) for s in (-1, 1)])
        piles = VGroup(*[Rectangle(width=0.5, height=1.3).set_fill("#2D3748", 1).set_stroke("#718096", 1).move_to([x0 + s * 2.45, y_sb - 0.65, 0]) for s in (-1, 1)])
        shoe_l = T("conductor shoe", 14, MUTED).next_to([x0 + 1.15, y_shoe, 0], RIGHT, buff=0.1)
        self.add(sea, soil, sb)
        self.bring_to_front(hdr)
        self.add(cem, cond, s20, inner, wh, whl, xt, xtl, posts, piles, beam, pad, shoe_l)
        lx = 1.1
        with self.voice("l_def_1") as d:
            ai = VGroup(*[arrow([x0 + s * 0.38, y_sb - 0.75, 0], [x0 + s * 0.38, y_sb + 0.02, 0], C1338, 7, 0.18) for s in (-1, 1)])
            ai.set_z_index(5)
            li = VGroup(T("1  inner casings + tubing", 21, C1338, weight=BOLD), T("push up through their hangers", 18, INK)).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
            li.move_to([lx, 1.85, 0], aligned_edge=LEFT)
            self.play(LaggedStart(*[GrowArrow(a) for a in ai], lag_ratio=0.2), FadeIn(li), run_time=0.5 * d)
        with self.voice("l_def_2") as d:
            ac = VGroup(*[arrow([x0 + s * 0.84, y_sb - 0.95, 0], [x0 + s * 0.84, y_sb + 0.02, 0], C20, 8, 0.2) for s in (-1, 1)])
            ac.set_z_index(5)
            self.play(cond.animate.set_fill(temp_color(61)), s20.animate.set_fill(temp_color(75)), run_time=0.2 * d)
            lc = VGroup(T("2  conductor + 20\" + cement", 21, C20, weight=BOLD), T("one bonded column, heats near the seabed,", 18, INK),
                        T("pushes up on the wellhead housings", 18, INK)).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
            lc.move_to([lx, 0.75, 0], aligned_edge=LEFT)
            self.play(LaggedStart(*[GrowArrow(a) for a in ac], lag_ratio=0.2), FadeIn(lc), run_time=0.4 * d)
        with self.voice("l_def_3") as d:
            ar = arrow([x0, y_beam + 1.0, 0], [x0, y_beam + 0.17, 0], REST_C, 10, 0.26)
            lr = VGroup(T("3  restraint", 21, REST_C, weight=BOLD), T("pushes down with the sum = lock-in load", 18, INK)).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
            lr.move_to([lx, -0.35, 0], aligned_edge=LEFT)
            self.play(GrowArrow(ar), FadeIn(lr), run_time=0.3 * d)
            eq = M(r"R_{lock} = N_{found}(0) + \sum_{inner}\Delta F_i", 38, INK).move_to([lx + 2.6, -1.35, 0])
            self.play(Write(eq), run_time=0.4 * d)
        with self.voice("l_def_4") as d:
            up = VGroup(*[arrow([x0 + s * 2.45, y_sb - 1.25, 0], [x0 + s * 2.45, y_sb - 0.25, 0], REST_C, 6, 0.16) for s in (-1, 1)])
            up.set_z_index(6)
            la = T("anchor uplift", 16, REST_C, weight=BOLD).next_to(piles[1], RIGHT, buff=0.1).shift(DOWN * 0.2)
            self.play(LaggedStart(*[GrowArrow(a) for a in up], lag_ratio=0.2), FadeIn(la), run_time=0.25 * d)
            fr = VGroup(*[arrow([x0 + s * 1.17, y, 0], [x0 + s * 1.55, y - 0.3, 0], ACCENT, 4, 0.1) for s in (-1, 1) for y in (-1.4, -1.95, -2.5)])
            lf = T("friction into the soil", 16, ACCENT).move_to([x0 - 2.0, -3.45, 0])
            self.play(LaggedStart(*[GrowArrow(a) for a in fr], lag_ratio=0.08), FadeIn(lf), run_time=0.3 * d)
            ho = VGroup(*[arrow([x0 + s * 0.96, y_shoe + 0.05, 0], [x0 + s * 0.74, y_shoe - 0.35, 0], REST_C, 5, 0.12) for s in (-1, 1)])
            lh = T("handover into the 20\" + rock", 16, REST_C).next_to([x0 + 1.15, y_shoe - 0.35, 0], RIGHT, buff=0.1)
            self.play(LaggedStart(*[GrowArrow(a) for a in ho], lag_ratio=0.2), FadeIn(lh), run_time=0.25 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class L03_Inputs(VScene):
    def construct(self):
        hdr = self.header(2, "Inputs")
        with self.voice("l_in_1") as d:
            facts = [("350 m water depth", "vertical oil producer"), ('20" 133 ppf K-55', "cemented to the seabed"),
                     ('13⅜" · 9⅝" · 5½"', "inner strings, as before"), ("WHFT 108 °C", "1 year of production")]
            cards = VGroup()
            for a, b in facts:
                g = VGroup(T(a, 22, INK, weight=BOLD), T(b, 17, MUTED)).arrange(DOWN, buff=0.08)
                box = RoundedRectangle(corner_radius=0.14, width=5.6, height=1.15).set_fill(PANEL, 1).set_stroke(GRID, 1.5)
                g.move_to(box)
                cards.add(VGroup(box, g))
            cards.arrange_in_grid(rows=2, buff=(0.35, 0.3)).move_to([0, 0.2, 0])
            ttl = T("same well for both conductor options", 20, MUTED).next_to(cards, UP, buff=0.4)
            self.play(FadeIn(ttl), LaggedStart(*[FadeIn(c, shift=UP * 0.15) for c in cards], lag_ratio=0.3), run_time=0.7 * d)
        self.play(FadeOut(VGroup(cards, ttl)), run_time=0.6)
        sc = 3.6

        def section(cx, cy, ro, ri, hole, col):
            g = VGroup()
            g.add(Circle(radius=hole * sc).set_fill(ROCK, 1).set_stroke("#8C7A62", 2).move_to([cx, cy, 0]))
            g.add(Annulus(inner_radius=ro * sc, outer_radius=hole * sc, fill_color=CEMENT, fill_opacity=0.9, stroke_width=0).move_to([cx, cy, 0]))
            g.add(Annulus(inner_radius=ri * sc, outer_radius=ro * sc, fill_color=col, fill_opacity=1, stroke_width=0).move_to([cx, cy, 0]))
            g.add(Annulus(inner_radius=0.254 * sc, outer_radius=ri * sc, fill_color=CEMENT, fill_opacity=0.75, stroke_width=0).move_to([cx, cy, 0]))
            g.add(Annulus(inner_radius=0.2379 * sc, outer_radius=0.254 * sc, fill_color=C20, fill_opacity=1, stroke_width=0).move_to([cx, cy, 0]))
            g.add(Circle(radius=0.2379 * sc).set_fill(BG, 1).set_stroke(width=0).move_to([cx, cy, 0]))
            return g
        sa = section(-3.4, 0.55, 0.381, 0.3556, 0.4572, A_C)
        sbx = section(3.2, 0.55, 0.4572, 0.4191, 0.5334, B_C)
        la = VGroup(T("A  ·  30\" × 1\"  in 36\" hole", 21, A_C, weight=BOLD), T("588 cm² of steel", 19, INK)).arrange(DOWN, buff=0.08).next_to(sa, DOWN, buff=0.25)
        lb = VGroup(T("B  ·  36\" × 1.5\"  in 42\" hole", 21, B_C, weight=BOLD), T("1,049 cm² of steel  (1.8 ×)", 19, INK)).arrange(DOWN, buff=0.08).next_to(sbx, DOWN, buff=0.25)
        key = VGroup(VGroup(Square(0.2).set_fill(C20, 1).set_stroke(width=0), T('20"', 15, MUTED)).arrange(RIGHT, buff=0.08),
                     VGroup(Square(0.2).set_fill(CEMENT, 1).set_stroke(width=0), T("cement", 15, MUTED)).arrange(RIGHT, buff=0.08),
                     VGroup(Square(0.2).set_fill(ROCK, 1).set_stroke("#8C7A62", 1), T("hole wall", 15, MUTED)).arrange(RIGHT, buff=0.08)
                     ).arrange(RIGHT, buff=0.35).move_to([0, 3.05, 0])
        with self.voice("l_in_2") as d:
            self.play(FadeIn(key), GrowFromCenter(sa), run_time=0.2 * d)
            self.play(FadeIn(la), run_time=0.2 * d)
            self.play(GrowFromCenter(sbx), run_time=0.2 * d)
            self.play(FadeIn(lb), run_time=0.2 * d)
        with self.voice("l_in_3") as d:
            self.play(VGroup(sa, la).animate.scale(0.72).move_to([-5.0, 0.9, 0]), VGroup(sbx, lb).animate.scale(0.72).move_to([-1.35, 0.9, 0]),
                      FadeOut(key), run_time=0.8)
            rows = [("fluid at the wellhead", 102, None, INK), ('20" surface casing', 75, "0.74 ×", C20), ('30" conductor (A)', 61, "0.60 ×", A_C),
                    ('36" conductor (B)', 55, "0.54 ×", B_C)]
            g = VGroup()
            for i, (nm, dT, fr, col) in enumerate(rows):
                yy = 2.2 - 0.85 * i
                n_ = T(nm, 18, col, weight=BOLD).move_to([1.3, yy, 0], aligned_edge=LEFT)
                bar = Rectangle(width=dT / 102 * 3.2, height=0.32).set_fill(temp_color(dT), 1).set_stroke(width=0)
                bar.move_to([1.3 + bar.width / 2, yy - 0.36, 0])
                v_ = T(f"ΔT {dT} °C" + (f"   {fr} fluid" if fr else ""), 16, INK).next_to(bar, RIGHT, buff=0.12)
                g.add(VGroup(n_, bar, v_))
            ttl = T("temperature rise just below the seabed (1 year)", 18, MUTED).move_to([3.5, 2.95, 0])
            self.play(FadeIn(ttl), run_time=0.05 * d)
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[2])) for r_ in g], lag_ratio=0.4), run_time=0.55 * d)
            nt = T("the bigger conductor sits further out from the heat, so it is slightly cooler", 17, ACCENT).move_to([0, -2.6, 0])
            self.play(FadeIn(nt), run_time=0.15 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
