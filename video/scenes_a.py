"""Scenes 1-3: intro, well architecture, wellhead load path."""
from common import *  # noqa: F401,F403


def wh_stack(scale=1.0, center=ORIGIN):
    """Stylised subsea wellhead + XT (side view)."""
    s = scale
    g = VGroup()
    lp = RoundedRectangle(corner_radius=0.05 * s, width=1.9 * s, height=0.42 * s)
    lp.set_fill("#5F6B7C", 1).set_stroke("#AEB8C6", 1.5)
    lp_ring = Rectangle(width=2.2 * s, height=0.10 * s).set_fill("#7C8899", 1).set_stroke("#AEB8C6", 1)
    lp_ring.next_to(lp, UP, buff=0)
    hp = RoundedRectangle(corner_radius=0.05 * s, width=1.25 * s, height=0.75 * s)
    hp.set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5)
    hp.next_to(lp_ring, UP, buff=0)
    con = RoundedRectangle(corner_radius=0.05 * s, width=1.55 * s, height=0.35 * s)
    con.set_fill("#3D6E8F", 1).set_stroke("#9CC7E6", 1.5)
    con.next_to(hp, UP, buff=-0.15 * s)
    xt = RoundedRectangle(corner_radius=0.08 * s, width=1.75 * s, height=1.0 * s)
    xt.set_fill("#2C5878", 1).set_stroke("#9CC7E6", 1.5)
    xt.next_to(con, UP, buff=0)
    v1 = Circle(radius=0.12 * s).set_fill("#F2B134", 1).set_stroke("#1A2B3C", 2).move_to(xt.get_center() + LEFT * 0.4 * s)
    v2 = v1.copy().move_to(xt.get_center() + RIGHT * 0.4 * s + UP * 0.15 * s)
    wing = Rectangle(width=1.3 * s, height=0.16 * s).set_fill("#9CC7E6", 1).set_stroke(width=0)
    wing.next_to(xt, RIGHT, buff=0).shift(UP * 0.15 * s)
    cap = RoundedRectangle(corner_radius=0.05 * s, width=0.8 * s, height=0.22 * s).set_fill("#3D6E8F", 1).set_stroke("#9CC7E6", 1.2)
    cap.next_to(xt, UP, buff=0)
    g.add(lp, lp_ring, hp, con, xt, v1, v2, wing, cap)
    g.move_to(center, aligned_edge=DOWN)
    return g


class S01_Intro(VScene):
    def construct(self):
        y_sb = -1.05
        sea = Rectangle(width=config.frame_width, height=4.0 - y_sb).move_to([0, (4 + y_sb) / 2, 0])
        sea.set_fill(color=["#14507A", "#071827"], opacity=1).set_stroke(width=0).set_sheen_direction(DOWN)
        rock = Rectangle(width=config.frame_width, height=y_sb + 4).move_to([0, (y_sb - 4) / 2, 0])
        rock.set_fill(color=["#3A2C20", "#1A130D"], opacity=1).set_stroke(width=0).set_sheen_direction(DOWN)
        pts = [[x, y_sb + 0.05 * math.sin(1.7 * x) + 0.03 * math.sin(4.1 * x + 1), 0] for x in np.linspace(-7.3, 7.3, 60)]
        seabed = VMobject().set_points_smoothly(pts).set_stroke("#8C7A62", 3)
        rays = VGroup(*[Polygon([x, 4.1, 0], [x + 0.6, 4.1, 0], [x + 2.2, y_sb, 0], [x + 1.3, y_sb, 0],
                                fill_color="#7FC8F8", fill_opacity=0.035, stroke_width=0)
                        for x in (-6, -3.5, -0.8, 2.4, 4.8)])
        rng = np.random.default_rng(7)
        snow = VGroup(*[Dot([rng.uniform(-7, 7), rng.uniform(y_sb, 4), 0], radius=rng.uniform(0.008, 0.02),
                            color="#BFE3FF", fill_opacity=rng.uniform(0.25, 0.7)) for _ in range(90)])

        def drift(m, dt):
            for d in m:
                d.shift(DOWN * 0.08 * dt + RIGHT * 0.02 * dt)
                if d.get_y() < y_sb:
                    d.set_y(4.0)
        snow.add_updater(drift)
        # subsurface casing strings (faint)
        strings = VGroup()
        for hw, col, depth in [(0.95, C30, 1.2), (0.72, C20, 2.4), (0.52, C1338, 3.2), (0.36, C958, 3.0), (0.16, CTBG, 3.0)]:
            for sgn in (-1, 1):
                strings.add(Line([sgn * hw, y_sb, 0], [sgn * hw, y_sb - depth, 0], stroke_color=col,
                                 stroke_width=5, stroke_opacity=0.9))
        fade = Rectangle(width=4, height=1.6).move_to([0, -3.4, 0]).set_fill(color=[ROCK, "#1A130D"], opacity=1).set_stroke(width=0)
        fade.set_fill(opacity=0.0)
        stack = wh_stack(1.0, [0, y_sb + 0.01, 0])

        self.add(sea, rays, rock, seabed, snow, strings, stack)
        title = T("Restraining Wellhead Growth", 54, INK, weight=BOLD).move_to([0, 2.85, 0])
        sub = T("What happens to the casings of a subsea well when the wellhead cannot move?", 26, "#BFD3EA")
        sub.next_to(title, DOWN, buff=0.25)

        with self.voice("intro_1") as d:
            self.play(FadeIn(title, shift=UP * 0.2), FadeIn(sub, shift=UP * 0.2), run_time=1.8)
            # heat rising through strings
            glow = VGroup()
            for ln in strings:
                g2 = ln.copy().set_stroke(HOT, 9, opacity=0.0)
                glow.add(g2)
            self.add(glow)
            self.play(*[ln.animate.set_stroke(color=interpolate_color(ManimColor(ln.get_stroke_color()), ManimColor(HOT), 0.6), width=7)
                        for ln in strings], run_time=0.3 * d)
            heat_lbl = T("hot oil  ≈ 108 °C at the wellhead", 22, HOT).move_to([3.6, -2.2, 0])
            self.play(FadeIn(heat_lbl), run_time=0.8)
            up = 0.42
            dim0 = DashedLine([1.3, y_sb + 2.15, 0], [2.3, y_sb + 2.15, 0], stroke_color=MUTED)
            self.play(stack.animate.shift(UP * up), run_time=0.25 * d, rate_func=smooth)
            arr = DoubleArrow([1.95, y_sb + 1.62, 0], [1.95, y_sb + 1.62 + up, 0], buff=0, color=ACCENT,
                              stroke_width=3, tip_length=0.12)
            gl = T("wellhead growth\n≈ 6 cm (exaggerated)", 20, ACCENT).next_to(arr, RIGHT, buff=0.15)
            self.play(GrowFromCenter(arr), FadeIn(gl), run_time=1.0)
        with self.voice("intro_2") as d:
            # restraint frame
            post_l = Rectangle(width=0.32, height=3.0).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1.5).move_to([-1.85, y_sb + 1.25, 0])
            post_r = post_l.copy().move_to([1.85 + 1.25, y_sb + 1.25, 0])
            beam = Rectangle(width=5.4, height=0.34).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1.5)
            beam.move_to([0.62, y_sb + 2.95, 0])
            piles = VGroup(*[Rectangle(width=0.5, height=1.4).set_fill("#2D3748", 1).set_stroke("#718096", 1).move_to([x, y_sb - 0.7, 0])
                             for x in (-1.85, 3.1)])
            hatch = VGroup(*[Line([x - 0.2, y_sb - 0.1, 0], [x + 0.2, y_sb - 1.3, 0], stroke_color="#718096", stroke_width=1.5)
                             for x in np.linspace(-2.0, -1.7, 3)] + [Line([x - 0.2, y_sb - 0.1, 0], [x + 0.2, y_sb - 1.3, 0], stroke_color="#718096", stroke_width=1.5)
                                                                  for x in np.linspace(2.95, 3.25, 3)])
            frame = VGroup(piles, hatch, post_l, post_r, beam)
            frame.shift(UP * 4.5)
            self.play(FadeOut(arr), FadeOut(gl), FadeOut(heat_lbl), FadeOut(title), FadeOut(sub), run_time=0.8)
            self.play(frame.animate.shift(DOWN * 4.5), run_time=1.6, rate_func=rate_functions.ease_out_cubic)
            pad = Rectangle(width=1.6, height=0.18).set_fill("#A0AEC0", 1).set_stroke(width=0).move_to([0, beam.get_bottom()[1] - 0.09, 0])
            self.play(FadeIn(pad), stack.animate.shift(DOWN * up), run_time=1.2)
            down_arrows = VGroup(*[arrow([x, beam.get_top()[1] + 0.6, 0], [x, beam.get_top()[1] + 0.05, 0], COMP, 5)
                                   for x in (-0.6, 0.0, 0.6)])
            self.play(LaggedStart(*[GrowArrow(a) for a in down_arrows], lag_ratio=0.2), run_time=1.0)
            q1 = T("Where does the expansion go?", 32, INK, weight=BOLD).move_to([-3.6, 2.9, 0])
            q2 = T("Does the casing buckle?", 32, ACCENT, weight=BOLD).next_to(q1, DOWN, buff=0.3, aligned_edge=LEFT)
            qm = VGroup(*[T("?", 40, COMP, weight=BOLD).move_to([x, y, 0]) for x, y in [(-1.3, -2.0), (1.2, -2.6), (-0.4, -3.2)]])
            self.play(Write(q1), run_time=1.2)
            self.play(Write(q2), LaggedStart(*[FadeIn(q, scale=1.6) for q in qm], lag_ratio=0.3), run_time=1.5)
        with self.voice("intro_3") as d:
            steps = ["Build the well with standard API casing", "Apply the production temperature",
                     "Free vs. restrained wellhead mechanics", "Effective force and helical buckling"]
            cards = VGroup()
            for i, s in enumerate(steps):
                c = card(7.4, 0.66)
                n = T(f"{i + 1}", 26, ACCENT, weight=BOLD).move_to(c.get_left() + RIGHT * 0.45)
                t = T(s, 24, INK)
                t.next_to(n, RIGHT, buff=0.35)
                cards.add(VGroup(c, n, t))
            for c_ in cards:
                c_.remove(c_[0])
            boxes = VGroup(*[card(7.4, 0.66) for _ in cards]).arrange(DOWN, buff=0.18).move_to([0, 0.1, 0])
            for c_, bx_ in zip(cards, boxes):
                c_[0].move_to(bx_.get_left() + RIGHT * 0.45, aligned_edge=ORIGIN)
                c_[1].next_to(c_[0], RIGHT, buff=0.35)
                c_.add_to_back(bx_)
            dim = Rectangle(width=config.frame_width, height=config.frame_height).set_fill(BG, 0.72).set_stroke(width=0)
            self.play(FadeOut(qm), FadeOut(q1), FadeOut(q2), FadeIn(dim), run_time=0.8)
            self.play(LaggedStart(*[FadeIn(c, shift=RIGHT * 0.3) for c in cards], lag_ratio=0.35), run_time=0.6 * d)
        snow.clear_updaters()
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class S02_Architecture(VScene):
    def construct(self):
        P = build_well(xc=-3.75)
        y, xc = P["y"], P["xc"]
        hdr = self.header(1, "The well")
        env = P["env"]
        self.add(env)
        self.bring_to_front(hdr)
        st, cem, ann, holes = P["steel"], P["cement"], P["ann"], P["holes"]
        ticks_left = xc - 1.55

        # data card -------------------------------------------------------
        panel = card(6.9, 4.55).move_to([3.6, 0.55, 0])
        cols = [0.15, 2.0, 4.7, 5.85]
        hdrs = ["String", "Pipe (API 5CT)", "Shoe", "TOC"]
        x0 = panel.get_left()[0]
        ytop = panel.get_top()[1] - 0.38
        head = VGroup(*[T(h, 18, MUTED, weight=MEDIUM).move_to([x0 + c, ytop, 0], aligned_edge=LEFT) for h, c in zip(hdrs, cols)])
        rule = Line([x0 + 0.15, ytop - 0.22, 0], [x0 + 6.85, ytop - 0.22, 0], stroke_color=GRID, stroke_width=1.5)
        rows_data = [
            ("30", 'Conductor', '30" × 1" WT,  X-56', "80 m", "seabed"),
            ("20", 'Surface', '20" 133 ppf,  K-55', "700 m", "seabed"),
            ("13-3/8", 'Intermediate', '13⅜" 72 ppf,  L-80', "1,800 m", "1,300 m"),
            ("9-5/8", 'Production', '9⅝" 53.5 ppf,  P-110', "3,250 m", "2,550 m"),
            ("7", 'Liner', '7" 29 ppf,  P-110', "3,600 m", "full"),
            ("tubing", 'Tubing', '5½" 17 ppf,  13Cr-80', "3,100 m", "packer"),
        ]
        rows = []
        for i, (k, a, b, c_, d_) in enumerate(rows_data):
            yy = ytop - 0.62 - 0.5 * i
            dot = Dot([x0 + cols[0] + 0.08, yy, 0], radius=0.07, color=STR_COLORS[k])
            ta = T(a, 17, INK).move_to([x0 + cols[0] + 0.25, yy, 0], aligned_edge=LEFT)
            tb = T(b, 18, INK).move_to([x0 + cols[1], yy, 0], aligned_edge=LEFT)
            tc = T(c_, 18, INK).move_to([x0 + cols[2], yy, 0], aligned_edge=LEFT)
            td = T(d_, 18, INK).move_to([x0 + cols[3], yy, 0], aligned_edge=LEFT)
            rows.append(VGroup(dot, ta, tb, tc, td))
        note = T("depths: m below seabed  ·  water depth 350 m  ·  vertical well", 15, MUTED)
        note.next_to(panel, DOWN, buff=0.15)
        comp_note = T("depth axis compressed", 15, FAINT).move_to([ticks_left - 0.45, -3.85, 0])

        def tick(z):
            return depth_ticks(P["y"], ticks_left, [z], 15)

        with self.voice("arch_1") as d:
            self.play(FadeIn(panel), FadeIn(head), Create(rule), FadeIn(note), run_time=1.2)
            self.play(FadeIn(holes[0]), run_time=0.5)
            self.play(FadeIn(cem["30"]), DrawBorderThenFill(st["30"]), run_time=0.22 * d)
            self.play(FadeIn(P["wh_parts"]["lp"]), FadeIn(rows[0]), FadeIn(tick(0)), FadeIn(tick(80)), FadeIn(comp_note), run_time=0.15 * d)
            wd = T("350 m of seawater above", 18, "#9CC7E6").move_to([1.6, 3.25, 0])
            self.play(FadeIn(wd), run_time=0.8)
        with self.voice("arch_2") as d:
            self.play(FadeIn(holes[1]), run_time=0.4)
            self.play(FadeIn(cem["20"]), DrawBorderThenFill(st["20"]), run_time=0.25 * d)
            self.play(FadeIn(P["wh_parts"]["hp"]), FadeIn(rows[1]), FadeIn(tick(700)), run_time=0.15 * d)
            hl = T('18¾" HP housing', 15, INK).move_to([xc + 1.3, y(0) + 0.42, 0], aligned_edge=LEFT)
            ll = T('LP housing', 15, INK).move_to([xc + 1.3, y(0) + 0.1, 0], aligned_edge=LEFT)
            self.play(FadeIn(hl), FadeIn(ll), run_time=0.8)
        with self.voice("arch_3") as d:
            self.play(FadeIn(holes[2]), run_time=0.4)
            self.play(DrawBorderThenFill(st["13-3/8"]), run_time=0.22 * d)
            self.play(FadeIn(cem["13-3/8"]), FadeIn(rows[2]), FadeIn(tick(1300)), FadeIn(tick(1800)), run_time=0.15 * d)
            self.play(FadeIn(ann["C"]), run_time=0.15 * d)
        with self.voice("arch_4") as d:
            self.play(FadeIn(holes[3]), FadeIn(holes[4]), run_time=0.4)
            self.play(DrawBorderThenFill(st["9-5/8"]), run_time=0.15 * d)
            self.play(FadeIn(cem["9-5/8"]), FadeIn(rows[3]), FadeIn(tick(2550)), FadeIn(tick(3250)), FadeIn(ann["B"]), run_time=0.15 * d)
            self.play(DrawBorderThenFill(st["7"]), FadeIn(cem["7"]), FadeIn(rows[4]), FadeIn(P["res_lbl"]), run_time=0.12 * d)
            self.play(FadeIn(st["tubing"]), FadeIn(st["packer"]), FadeIn(ann["A"]), FadeIn(rows[5]), run_time=0.15 * d)
            self.play(FadeIn(P["wh_parts"]["xt"]), FadeIn(P["wh"][3]), FadeIn(P["wh"][4]), run_time=0.8)
        with self.voice("arch_5") as d:
            la = T("A", 22, "#7FC8F8", weight=BOLD).move_to([xc + 0.18, y(250), 0])
            lb = T("B", 22, "#E2B77E", weight=BOLD).move_to([xc + 0.365, y(1000), 0])
            lc = T("C", 22, "#D1A06A", weight=BOLD).move_to([xc + 0.575, y(450), 0])
            for l_ in (la, lb, lc):
                l_.set_z_index(10)
            leg = VGroup(
                VGroup(Square(0.22).set_fill(BRINE, 1).set_stroke(width=0), T("A annulus: packer fluid (brine)", 18)).arrange(RIGHT, buff=0.15),
                VGroup(Square(0.22).set_fill("#7A5A33", 1).set_stroke(width=0), T("B annulus: 1.40 SG mud", 18)).arrange(RIGHT, buff=0.15),
                VGroup(Square(0.22).set_fill(MUD, 1).set_stroke(width=0), T("C annulus: 1.25 SG mud", 18)).arrange(RIGHT, buff=0.15),
                VGroup(Square(0.22).set_fill(CEMENT, 1).set_stroke(width=0), T("cement", 18)).arrange(RIGHT, buff=0.15),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.12)
            leg.move_to([3.0, -2.95, 0])
            self.play(LaggedStart(FadeIn(la, scale=1.5), FadeIn(lb, scale=1.5), FadeIn(lc, scale=1.5), lag_ratio=0.3),
                      FadeIn(leg), run_time=0.3 * d)
            # open-to-formation markers
            oc = VGroup(*[arrow([xc + s * 0.50, y(1000), 0], [xc + s * 0.80, y(1000), 0], ACCENT, 3, 0.1) for s in (1,)])
            ob = VGroup(*[arrow([xc + s * 0.31, y(2200), 0], [xc + s * 0.60, y(2200), 0], ACCENT, 3, 0.1) for s in (1,)])
            olbl = T("open to formation\n(pressure can bleed off)", 16, ACCENT).move_to([xc + 1.95, y(1600), 0])
            self.play(GrowArrow(oc[0]), GrowArrow(ob[0]), FadeIn(olbl), run_time=0.25 * d)
            self.play(Indicate(rows[2][4], color=ACCENT), Indicate(rows[3][4], color=ACCENT), run_time=1.5)
        with self.voice("arch_6") as d:
            self.play(FadeOut(olbl), FadeOut(oc), FadeOut(ob), FadeOut(leg), run_time=0.6)
            braces = VGroup()
            for k, z1, xo, col, lab in [("13-3/8", 1300, SCH["hole17"] + 0.12, C1338, "13⅜\" free length\n1,300 m"),
                                        ("9-5/8", 2550, SCH["hole12"] + 0.12, C958, "9⅝\" free length\n2,550 m")]:
                x_b = xc + 1.65 + (0.95 if k == "9-5/8" else 0)
                ln = Line([x_b, y(0), 0], [x_b, y(z1), 0], stroke_color=col, stroke_width=6)
                cap1 = Line([x_b - 0.1, y(0), 0], [x_b + 0.1, y(0), 0], stroke_color=col, stroke_width=4)
                cap2 = Line([x_b - 0.1, y(z1), 0], [x_b + 0.1, y(z1), 0], stroke_color=col, stroke_width=4)
                tl = T(lab, 17, col).next_to(ln, RIGHT, buff=0.12).shift(UP * 0.3 if k == "13-3/8" else DOWN * 0.6)
                braces.add(VGroup(ln, cap1, cap2, tl))
            self.play(FadeOut(VGroup(panel, *rows, head, rule, note, hl, ll)), run_time=0.8)
            self.play(LaggedStart(*[Create(b[:3]) for b in braces], lag_ratio=0.4), run_time=0.25 * d)
            self.play(*[FadeIn(b[3]) for b in braces], run_time=0.8)
            top_lbl = T("hung from the wellhead", 18, INK).move_to([2.9, 2.75, 0])
            bot_lbl = T("fixed in cement", 18, INK).move_to([2.9, -2.3, 0])
            a1 = arrow(top_lbl.get_left() + LEFT * 0.1, [xc + 0.6, y(0) + 0.25, 0], INK, 2.5, 0.12)
            a2 = arrow(bot_lbl.get_left() + LEFT * 0.1, [xc + 0.52, y(1450), 0], INK, 2.5, 0.12)
            self.play(FadeIn(top_lbl), GrowArrow(a1), FadeIn(bot_lbl), GrowArrow(a2), run_time=0.2 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class S03_Wellhead(VScene):
    def construct(self):
        hdr = self.header(2, "The wellhead load path")
        cx = -2.3
        sb = -3.0

        def ring(ri, ro, y0, y1, color, op=1.0, sw=1.0, sc=None):
            a = band(cx - ro, cx - ri, y0, y1, color, op)
            b = band(cx + ri, cx + ro, y0, y1, color, op)
            g = VGroup(a, b)
            if sw:
                g.set_stroke(sc or interpolate_color(ManimColor(color), WHITE, 0.35), sw, opacity=0.9)
            return g

        sea = Rectangle(width=config.frame_width, height=7.0).move_to([0, sb + 3.5, 0])
        sea.set_fill(color=["#11405F", "#08192A"], opacity=1).set_stroke(width=0).set_sheen_direction(DOWN)
        soil = Rectangle(width=config.frame_width, height=2.0).move_to([0, sb - 1.0, 0]).set_fill("#2B2119", 1).set_stroke(width=0)
        sbl = Line([-7.2, sb, 0], [7.2, sb, 0], stroke_color="#8C7A62", stroke_width=3)
        self.add(sea, soil, sbl)
        self.bring_to_front(hdr)
        # conductor + LPWH
        conductor = ring(1.42, 1.52, -4.2, -2.3, C30)
        lpwh = ring(1.40, 1.82, -2.3, -0.9, "#6F7C8E")
        # 20" + HPWH
        c20 = ring(0.94, 1.0, -4.2, -2.8, C20)
        hpwh_low = ring(0.94, 1.35, -2.8, -0.9, "#97A3B4")
        hpwh_ring = ring(0.94, 1.72, -0.9, -0.6, "#A7B2C2")
        hpwh_up = ring(0.94, 1.35, -0.6, 1.35, "#97A3B4")
        grooves = VGroup(*[ring(1.30, 1.36, yy, yy + 0.07, "#5D6878", sw=0) for yy in (0.95, 1.1, 1.25)])
        shoulder = ring(0.84, 0.94, -2.62, -2.5, "#C7CFDA")
        cement = VGroup(ring(1.0, 1.42, -4.2, sb, CEMENT, 0.9, sw=0), ring(1.52, 1.85, -4.2, sb, CEMENT, 0.9, sw=0))
        # 13-3/8 hanger & casing
        h13_land = ring(0.62, 0.92, -2.5, -2.15, C1338)
        h13_body = ring(0.62, 0.80, -2.15, -1.5, C1338)
        c13 = ring(0.62, 0.67, -4.2, -2.5, C1338)
        seal13 = ring(0.80, 0.94, -2.05, -1.65, "#30343B", sw=1, sc="#9AA0A8")
        lock13 = ring(0.88, 0.97, -1.72, -1.62, "#E8EEF7", sw=0)
        # 9-5/8 hanger & casing
        h95_land = ring(0.43, 0.92, -1.5, -1.2, C958)
        h95_body = ring(0.43, 0.80, -1.2, -0.55, C958)
        c95 = ring(0.43, 0.48, -4.2, -1.5, C958)
        seal95 = ring(0.80, 0.94, -1.1, -0.7, "#30343B", sw=1, sc="#9AA0A8")
        lock95 = ring(0.88, 0.97, -0.77, -0.67, "#E8EEF7", sw=0)
        ldb = ring(0.80, 0.94, -0.55, -0.25, "#B9C2CE")
        # tubing hanger + tubing
        th = ring(0.25, 0.92, 0.25, 1.05, CTBG)
        tbg = ring(0.25, 0.28, -4.2, 0.25, CTBG)
        # XT
        xtcon = ring(1.36, 1.72, 0.85, 1.9, "#3D6E8F")
        xt = RoundedRectangle(corner_radius=0.1, width=3.0, height=1.3).move_to([cx, 2.55, 0])
        xt.set_fill("#2C5878", 1).set_stroke("#9CC7E6", 1.5)
        xtl = T("Christmas tree", 18, INK).move_to(xt)
        # annulus fluids (between strings below hangers)
        fl = VGroup(ring(0.67, 0.94, -4.2, -2.62, MUD, 0.6, sw=0), ring(0.48, 0.62, -4.2, -2.5, "#7A5A33", 0.6, sw=0),
                    ring(0.28, 0.43, -4.2, 0.25, BRINE, 0.7, sw=0))
        assembly = VGroup(fl, cement, conductor, lpwh, c20, hpwh_low, hpwh_ring, hpwh_up, grooves, shoulder,
                          c13, h13_land, h13_body, seal13, lock13, c95, h95_land, h95_body, seal95, lock95, ldb,
                          tbg, th, xtcon, xt, xtl)
        # labels
        lx = 1.15

        def lab(text, target, yy, col=INK):
            t_ = T(text, 18, col).move_to([lx, yy, 0], aligned_edge=LEFT)
            ln = Line(t_.get_left() + LEFT * 0.08, target, stroke_color=FAINT, stroke_width=1.5)
            d_ = Dot(target, radius=0.035, color=col)
            return VGroup(ln, d_, t_)

        labels = VGroup(
            lab("Christmas tree + connector", [cx + 1.6, 1.4, 0], 2.3),
            lab("tubing hanger", [cx + 0.9, 0.65, 0], 1.45, CTBG),
            lab('18¾" high-pressure housing', [cx + 1.35, 0.2, 0], 0.75),
            lab("lockdown + seal assemblies", [cx + 0.9, -0.72, 0], 0.15),
            lab('9⅝" casing hanger', [cx + 0.85, -1.35, 0], -0.45, C958),
            lab('13⅜" casing hanger', [cx + 0.85, -2.3, 0], -1.05, C1338),
            lab("low-pressure (conductor) housing", [cx + 1.8, -1.6, 0], -1.65, C30),
            lab("load shoulder", [cx + 0.89, -2.56, 0], -2.25),
            lab('cement  (20" × 30")', [cx + 1.25, -3.6, 0], -2.85, "#C9C6BC"),
        )
        with self.voice("wh_1") as d:
            self.play(LaggedStart(*[FadeIn(m) for m in [VGroup(cement, conductor, lpwh), VGroup(c20, hpwh_low, hpwh_ring, hpwh_up, grooves, shoulder),
                                                        VGroup(fl[0], c13, h13_land, h13_body), VGroup(seal13, lock13),
                                                        VGroup(fl[1], c95, h95_land, h95_body), VGroup(seal95, lock95, ldb),
                                                        VGroup(fl[2], tbg, th), VGroup(xtcon, xt, xtl)]], lag_ratio=0.45),
                      run_time=0.55 * d)
            self.play(LaggedStart(*[FadeIn(l_) for l_ in labels], lag_ratio=0.25), run_time=0.35 * d)
        with self.voice("wh_2") as d:
            self.play(labels.animate.set_opacity(0.25), run_time=0.6)
            wt = VGroup(*[arrow([cx + s * 1.15, -2.0, 0], [cx + s * 1.15, -2.75, 0], TENS, 6, 0.16) for s in (1, -1)],
                        *[arrow([cx + s * 0.97, -2.85, 0], [cx + s * 0.97, -3.7, 0], TENS, 6, 0.16) for s in (1, -1)],
                        *[arrow([cx + s * 1.6, -1.2, 0], [cx + s * 1.6, -2.2, 0], TENS, 6, 0.16) for s in (1, -1)],
                        *[arrow([cx + s * 1.47, -2.35, 0], [cx + s * 1.47, -3.4, 0], TENS, 6, 0.16) for s in (1, -1)])
            wt = VGroup(*wt)
            down = VGroup(*[arrow([cx + s * 0.8, -1.95, 0], [cx + s * 0.8, -2.45, 0], TENS, 6, 0.16) for s in (1, -1)])
            soil_arrows = VGroup(*[arrow([cx + s * 1.62, -3.5, 0], [cx + s * 2.2, -3.9, 0], TENS, 5, 0.14) for s in (1, -1)])
            wl = T("hanging weight ↓", 24, TENS, weight=BOLD).move_to([3.6, -3.45, 0])
            self.play(LaggedStart(*[GrowArrow(a) for a in down], lag_ratio=0.2), run_time=0.15 * d)
            self.play(LaggedStart(*[GrowArrow(w) for w in wt], lag_ratio=0.12), run_time=0.35 * d)
            self.play(LaggedStart(*[GrowArrow(a) for a in soil_arrows], lag_ratio=0.2), FadeIn(wl), run_time=0.2 * d)
        with self.voice("wh_3") as d:
            self.play(FadeOut(wt), FadeOut(down), FadeOut(soil_arrows), FadeOut(wl), run_time=0.5)
            c13h = VGroup(c13, h13_land, h13_body)
            self.play(c13.animate.set_fill(HOT), h13_land.animate.set_fill(HOT), h13_body.animate.set_fill(HOT), run_time=0.15 * d)
            ups = VGroup(*[arrow([cx + s * 0.645, -4.1, 0], [cx + s * 0.645, -2.9, 0], COMP, 7, 0.2) for s in (1, -1)])
            self.play(LaggedStart(*[GrowArrow(a) for a in ups], lag_ratio=0.2), run_time=0.15 * d)
            self.play(c13h.animate.shift(UP * 0.05), seal13.animate.shift(UP * 0.05), lock13.animate.set_fill(COMP).shift(UP * 0.05),
                      run_time=0.15 * d, rate_func=there_and_back_with_pause)
            glow = VGroup(*[Circle(radius=0.16).set_stroke(COMP, 4).move_to([cx + s * 0.93, -1.67, 0]) for s in (1, -1)])
            pl = T("thermal push ↑ on the lockdown", 24, COMP, weight=BOLD).move_to([3.6, -3.45, 0])
            hp_up = VGroup(*[arrow([cx + s * 1.15, -2.6, 0], [cx + s * 1.15, -1.9, 0], COMP, 5, 0.14) for s in (1, -1)])
            self.play(Create(glow), FadeIn(pl), LaggedStart(*[GrowArrow(a) for a in hp_up], lag_ratio=0.2), run_time=0.25 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
