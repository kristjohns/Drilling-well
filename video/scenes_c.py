"""Scenes 6-7: spring model (free wellhead) and restrained wellhead."""
from common import *  # noqa: F401,F403

SF = RES["base_free"]["summary"]
SR = RES["base_restrained"]["summary"]
SWEEP = RES["restraint_sweep"]

PLATE_Y = 1.75
GROUND_Y = -2.55
XS = {"found": -5.55, "13-3/8": -3.95, "9-5/8": -2.75, "tubing": -1.55}


def zigzag(x, y_top, y_bot, coils, width, color, sw):
    n = coils * 2
    ys = np.linspace(y_top, y_bot, n + 3)
    pts = [[x, ys[0], 0], [x, ys[1], 0]]
    for i in range(n):
        pts.append([x + (width / 2) * (1 if i % 2 == 0 else -1), ys[i + 1] + (ys[i + 2] - ys[i + 1]) / 2, 0])
    pts += [[x, ys[-2], 0], [x, ys[-1], 0]]
    return VMobject().set_points_as_corners(pts).set_stroke(color, sw)


class SpringRig:
    """Wellhead plate on springs; springs follow the plate."""

    def __init__(self, scene, colors=None):
        self.plate = RoundedRectangle(corner_radius=0.06, width=5.7, height=0.36).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5)
        self.plate.move_to([-3.55, PLATE_Y + 0.18, 0])
        self.plabel = T("wellhead", 18, BG, weight=BOLD).move_to(self.plate)
        self.colors = dict(colors or {"found": "#7FA8B8", "13-3/8": C1338, "9-5/8": C958, "tubing": CTBG})
        self.ground = VGroup(Line([-6.6, GROUND_Y, 0], [-0.6, GROUND_Y, 0], stroke_color=MUTED, stroke_width=3))
        for x in np.arange(-6.5, -0.6, 0.25):
            self.ground.add(Line([x, GROUND_Y, 0], [x - 0.18, GROUND_Y - 0.22, 0], stroke_color=FAINT, stroke_width=2))
        self.springs = always_redraw(self._springs)
        self.glbl = VGroup(
            T("soil + cement", 15, MUTED).move_to([XS["found"], GROUND_Y - 0.45, 0]),
            T("TOC", 15, MUTED).move_to([XS["13-3/8"], GROUND_Y - 0.45, 0]),
            T("TOC", 15, MUTED).move_to([XS["9-5/8"], GROUND_Y - 0.45, 0]),
            T("packer", 15, MUTED).move_to([XS["tubing"], GROUND_Y - 0.45, 0]))

    def _springs(self):
        yb = self.plate.get_bottom()[1]
        g = VGroup()
        g.add(zigzag(XS["found"], yb, GROUND_Y, 3, 0.95, self.colors["found"], 14))
        g.add(zigzag(XS["13-3/8"], yb, GROUND_Y, 9, 0.5, self.colors["13-3/8"], 4))
        g.add(zigzag(XS["9-5/8"], yb, GROUND_Y, 12, 0.5, self.colors["9-5/8"], 3.5))
        g.add(zigzag(XS["tubing"], yb, GROUND_Y, 16, 0.42, self.colors["tubing"], 3))
        return g

    def group(self):
        return VGroup(self.ground, self.springs, self.plate, self.plabel, self.glbl)


class S06_Springs(VScene):
    def construct(self):
        hdr = self.header(5, "How much does the wellhead move?")
        rig = SpringRig(self)
        k_lbls = VGroup(
            T("foundation\n≈ 240 MN/m", 16, "#7FA8B8", weight=BOLD).next_to([XS["found"], 0.0, 0], LEFT, buff=0.55),
        )
        names = VGroup(*[T(STR_NAMES[k].split(" ")[0], 16, STR_COLORS[k], weight=BOLD).move_to([XS[k], PLATE_Y - 0.35 - 0.0, 0])
                         for k in ("13-3/8", "9-5/8", "tubing")])
        kv = {"13-3/8": SF["13-3/8"]["k_MN_per_m"], "9-5/8": SF["9-5/8"]["k_MN_per_m"], "tubing": SF["tubing"]["k_MN_per_m"]}
        kt = VGroup(*[T(f"k = {kv[k]:.2f}\nMN/m", 15, INK).move_to([XS[k], -0.35, 0]).set_z_index(5) for k in kv])
        for t_ in kt:
            t_.add_background_rectangle(color=BG, opacity=0.85, buff=0.05)
        with self.voice("spring_1") as d:
            self.play(FadeIn(rig.ground), FadeIn(rig.glbl), FadeIn(rig.plate), FadeIn(rig.plabel), run_time=1.0)
            self.add(rig.springs)
            self.play(FadeIn(rig.springs), run_time=0.8)
            eq = M(r"k = \frac{E\,A}{L}", 44, INK).move_to([3.4, 2.4, 0])
            self.play(Write(eq), run_time=0.1 * d)
            self.play(LaggedStart(*[FadeIn(t_) for t_ in kt], lag_ratio=0.25), run_time=0.25 * d)
            fl = T("conductor + 20\"\n+ cement + soil", 16, "#7FA8B8").move_to([XS["found"], -0.35, 0])
            fl.add_background_rectangle(color=BG, opacity=0.85, buff=0.05)
            ratio = T("> 100 × stiffer than the 13⅜\"", 20, ACCENT, weight=BOLD).move_to([3.4, 1.3, 0])
            fk = T("foundation (secant): ≈ 240 MN/m", 20, "#7FA8B8").next_to(ratio, UP, buff=0.18)
            self.play(FadeIn(fl), FadeIn(fk), run_time=0.15 * d)
            self.play(FadeIn(ratio, shift=UP * 0.1), run_time=0.8)
        with self.voice("spring_2") as d:
            self.play(FadeOut(kt), run_time=0.4)
            rig.colors.update({"13-3/8": HOT, "9-5/8": HOT, "tubing": HOT})
            self.play(rig.plate.animate.set_stroke(HOT, 2), run_time=0.12 * d)
            ups = VGroup(*[arrow([XS[k], PLATE_Y - 1.1, 0], [XS[k], PLATE_Y - 0.25, 0], COMP, 7, 0.2) for k in ("13-3/8", "9-5/8", "tubing")])
            ups.set_z_index(6)
            push = T("inner strings push up ≈ 4.1 MN", 22, COMP, weight=BOLD).move_to([3.4, 0.2, 0])
            self.play(LaggedStart(*[GrowArrow(a) for a in ups], lag_ratio=0.2), FadeIn(push), run_time=0.3 * d)
            rig.colors["found"] = "#E8A45A"
            fexp = T("foundation expands too\n(slides in soft soil near the seabed)", 18, "#E8A45A").move_to([3.4, -0.75, 0])
            self.play(FadeIn(fexp), run_time=0.25 * d)
        with self.voice("spring_3") as d:
            up = 0.42
            self.play(rig.plate.animate.shift(UP * up), rig.plabel.animate.shift(UP * up), ups.animate.shift(UP * up), run_time=0.25 * d)
            ref = DashedLine([-6.6, PLATE_Y + 0.36, 0], [-0.4, PLATE_Y + 0.36, 0], stroke_color=MUTED, dash_length=0.08)
            dim = DoubleArrow([-0.35, PLATE_Y + 0.36, 0], [-0.35, PLATE_Y + 0.36 + up, 0], buff=0, color=ACCENT, stroke_width=3, tip_length=0.1)
            dl = T("61 mm", 20, ACCENT, weight=BOLD).next_to(dim, RIGHT, buff=0.1)
            self.play(Create(ref), GrowFromCenter(dim), FadeIn(dl), run_time=0.15 * d)
            eq2 = M(r"\delta_{WH} = \frac{\sum k_i\,\delta_i}{\sum k_i}", 38, INK).move_to([3.4, 2.4, 0])
            self.play(FadeOut(VGroup(push, fexp, ratio, fk)), Transform(eq, eq2), run_time=0.15 * d)
            # decomposition bar
            L = 5.0
            b1 = Rectangle(width=L * 44 / 61, height=0.45).set_fill("#E8A45A", 1).set_stroke(BG, 2)
            b2 = Rectangle(width=L * 17 / 61, height=0.45).set_fill(COMP, 1).set_stroke(BG, 2)
            VGroup(b1, b2).arrange(RIGHT, buff=0).move_to([3.4, 0.6, 0])
            t1 = T("44 mm\nfoundation's own expansion", 16, "#E8A45A").next_to(b1, DOWN, buff=0.12)
            t2 = T("17 mm\npush of\ninner strings", 16, COMP).next_to(b2, DOWN, buff=0.12)
            tt = T("free wellhead growth = 61 mm", 22, ACCENT, weight=BOLD).next_to(VGroup(b1, b2), UP, buff=0.2)
            self.play(FadeIn(tt), GrowFromEdge(b1, LEFT), run_time=0.15 * d)
            self.play(GrowFromEdge(b2, LEFT), FadeIn(t1), FadeIn(t2), run_time=0.15 * d)
        with self.voice("spring_4") as d:
            self.play(FadeOut(VGroup(b1, b2, t1, t2, tt)), run_time=0.5)
            # wanted vs got
            sc = 4.8 / 1140
            w1 = Rectangle(width=1140 * sc, height=0.36).set_fill(C1338, 0.35).set_stroke(C1338, 2)
            w2 = Rectangle(width=max(61 * sc, 0.03), height=0.36).set_fill(ACCENT, 1).set_stroke(width=0)
            w1.move_to([1.1 + 2.4, 1.15, 0])
            w2.align_to(w1, LEFT).align_to(w1, UP)
            wt = T("13⅜\" wants to grow 1,140 mm", 18, C1338).next_to(w1, UP, buff=0.1).align_to(w1, LEFT)
            gt = T("wellhead lets it grow 61 mm", 18, ACCENT).next_to(w1, DOWN, buff=0.1).align_to(w1, LEFT)
            self.play(GrowFromEdge(w1, LEFT), FadeIn(wt), run_time=0.15 * d)
            self.play(GrowFromEdge(w2, LEFT), FadeIn(gt), run_time=0.12 * d)
            # restraint fraction gauges
            frac = [("13-3/8", SF["13-3/8"]["dFa_MN"] / SF["13-3/8"]["full_restraint_force_MN"]),
                    ("9-5/8", SF["9-5/8"]["dFa_MN"] / SF["9-5/8"]["full_restraint_force_MN"]),
                    ("tubing", SF["tubing"]["dFa_MN"] / SF["tubing"]["full_restraint_force_MN"])]
            gtitle = T("share of the fully-restrained compression\nalready carried with a FREE wellhead", 18, INK).move_to([3.5, -0.3, 0])
            gauges = VGroup()
            for i, (k, f) in enumerate(frac):
                yy = -1.25 - 0.55 * i
                bg = Rectangle(width=3.6, height=0.3).set_fill(GRID, 1).set_stroke(width=0).move_to([3.9, yy, 0])
                fg = Rectangle(width=3.6 * f, height=0.3).set_fill(STR_COLORS[k], 1).set_stroke(width=0)
                fg.align_to(bg, LEFT).set_y(yy)
                nm = T(STR_NAMES[k].split(" ")[0], 17, STR_COLORS[k], weight=BOLD).next_to(bg, LEFT, buff=0.15)
                pc = T(f"{100 * f:.0f} %", 18, INK, weight=BOLD).next_to(bg, RIGHT, buff=0.12)
                gauges.add(VGroup(bg, fg, nm, pc))
            self.play(FadeIn(gtitle), *[FadeIn(g_[0]) for g_ in gauges], *[FadeIn(g_[2]) for g_ in gauges], run_time=0.12 * d)
            self.play(LaggedStart(*[GrowFromEdge(g_[1], LEFT) for g_ in gauges], lag_ratio=0.2),
                      LaggedStart(*[FadeIn(g_[3]) for g_ in gauges], lag_ratio=0.2), run_time=0.25 * d)
        rig.springs.clear_updaters()
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class S07_Restrained(VScene):
    def construct(self):
        hdr = self.header(6, "Restrain the wellhead")
        rig = SpringRig(self, {"found": "#E8A45A", "13-3/8": HOT, "9-5/8": HOT, "tubing": HOT})
        up = 0.42
        rig.plate.shift(UP * up)
        rig.plabel.shift(UP * up)
        self.add(rig.ground, rig.glbl, rig.springs, rig.plate, rig.plabel)
        # clamp
        post_l = Rectangle(width=0.3, height=4.6).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1.5).move_to([-6.85 + 0.15, 0.1, 0])
        post_r = post_l.copy().move_to([-0.25, 0.1, 0])
        beam = Rectangle(width=6.9, height=0.36).set_fill("#4A5568", 1).set_stroke("#A0AEC0", 1.5).move_to([-3.55, 2.6, 0])
        clamp = VGroup(post_l, post_r, beam)
        clamp.shift(UP * 2.0)
        clamp.set_opacity(0)
        with self.voice("res_1") as d:
            self.play(clamp.animate.shift(DOWN * 2.0).set_opacity(1), run_time=0.4 * d)
            self.play(rig.plate.animate.shift(DOWN * up), rig.plabel.animate.shift(DOWN * up), run_time=0.35 * d)
            z0 = T("δ_WH = 0", 24, ACCENT, weight=BOLD).move_to([-1.15, 3.1, 0])
            self.play(FadeIn(z0), run_time=0.5)
        with self.voice("res_2") as d:
            ttl = T("added compression in the inner strings  [MN]", 19, INK).move_to([3.55, 2.85, 0])
            leg = VGroup(VGroup(Square(0.2).set_fill(MUTED, 1).set_stroke(width=0), T("free wellhead", 15, MUTED)).arrange(RIGHT, buff=0.1),
                         VGroup(Square(0.2).set_fill(COMP, 1).set_stroke(width=0), T("restrained", 15, COMP)).arrange(RIGHT, buff=0.1)).arrange(RIGHT, buff=0.4)
            leg.next_to(ttl, DOWN, buff=0.15)
            vmax = 2.5
            L = 4.2
            rows = VGroup()
            for i, k in enumerate(("13-3/8", "9-5/8", "tubing")):
                vf, vr = -SF[k]["dFa_MN"], -SR[k]["dFa_MN"]
                yy = 1.65 - 0.75 * i
                x0 = 1.9
                b1 = Rectangle(width=L * vf / vmax, height=0.22).set_fill(MUTED, 1).set_stroke(width=0)
                b1.move_to([x0 + L * vf / vmax / 2, yy + 0.13, 0])
                b2 = Rectangle(width=L * vr / vmax, height=0.22).set_fill(COMP, 1).set_stroke(width=0)
                b2.move_to([x0 + L * vr / vmax / 2, yy - 0.13, 0])
                nm = T(STR_NAMES[k].split(" ")[0], 17, STR_COLORS[k], weight=BOLD).next_to([x0, yy, 0], LEFT, buff=0.15)
                v1 = T(f"{vf:.2f}", 15, MUTED).next_to(b1, RIGHT, buff=0.08)
                v2 = T(f"{vr:.2f}  (+{100 * (vr / vf - 1):.0f} %)", 15, COMP, weight=BOLD).next_to(b2, RIGHT, buff=0.08)
                rows.add(VGroup(nm, b1, b2, v1, v2))
            self.play(FadeIn(ttl), FadeIn(leg), run_time=0.8)
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[3])) for r_ in rows], lag_ratio=0.25), run_time=0.3 * d)
            self.play(LaggedStart(*[AnimationGroup(GrowFromEdge(r_[2], LEFT), FadeIn(r_[4])) for r_ in rows], lag_ratio=0.25), run_time=0.3 * d)
        with self.voice("res_3") as d:
            ttl2 = T("axial stress change at the seabed  [MPa]", 19, INK).move_to([3.55, -0.75, 0])
            axl = Line([3.55, -1.05, 0], [3.55, -2.95, 0], stroke_color=MUTED, stroke_width=2)
            sc = 2.6 / 380
            items = [("30", SF["foundation"]["comp_top_MPa"]["30"], SR["foundation"]["comp_top_MPa"]["30"], 386, '30" X-56'),
                     ("20", SF["foundation"]["comp_top_MPa"]["20"], SR["foundation"]["comp_top_MPa"]["20"], 379, '20" K-55')]
            fr = VGroup()
            for i, (k, vf, vr, fy, nm) in enumerate(items):
                yy = -1.45 - 0.8 * i
                bf = Rectangle(width=max(abs(vf) * sc, 0.02), height=0.22).set_fill(TENS, 1).set_stroke(width=0)
                bf.move_to([3.55 + vf * sc / 2, yy + 0.13, 0])
                br = Rectangle(width=abs(vr) * sc, height=0.22).set_fill(COMP, 1).set_stroke(width=0)
                br.move_to([3.55 + vr * sc / 2, yy - 0.13, 0])
                lab = T(nm, 16, STR_COLORS[k], weight=BOLD).move_to([6.55, yy, 0])
                tv = T(f"+{vf:.0f}", 15, TENS).next_to(bf, RIGHT, buff=0.08)
                rv = T(f"{vr:.0f}", 15, COMP, weight=BOLD).next_to(br, LEFT, buff=0.08)
                yl = DashedLine([3.55 - fy * sc, yy + 0.32, 0], [3.55 - fy * sc, yy - 0.32, 0], stroke_color=ACCENT, dash_length=0.05)
                fr.add(VGroup(bf, br, lab, tv, rv, yl))
            ylt = T("−yield", 14, ACCENT).move_to([3.55 - 382 * sc, -3.15, 0])
            tl = T("tension →", 14, TENS).move_to([4.3, -3.15, 0])
            cl = T("← compression", 14, COMP).move_to([2.6, -3.15, 0])
            self.play(FadeIn(ttl2), Create(axl), FadeIn(tl), FadeIn(cl), run_time=0.1 * d)
            self.play(LaggedStart(*[AnimationGroup(GrowFromEdge(f_[0], LEFT), FadeIn(f_[2]), FadeIn(f_[3])) for f_ in fr], lag_ratio=0.2), run_time=0.15 * d)
            self.play(LaggedStart(*[AnimationGroup(GrowFromEdge(f_[1], RIGHT), FadeIn(f_[4])) for f_ in fr], lag_ratio=0.25),
                      run_time=0.25 * d)
            rig.colors["found"] = COMP
            fcomp = VGroup(arrow([XS["found"] + 0.8, 1.2, 0], [XS["found"] + 0.8, 0.5, 0], COMP, 6, 0.16),
                           arrow([XS["found"] + 0.8, -1.8, 0], [XS["found"] + 0.8, -1.1, 0], COMP, 6, 0.16))
            self.play(FadeIn(fr[0][5]), FadeIn(fr[1][5]), FadeIn(ylt), LaggedStart(*[GrowArrow(a) for a in fcomp], lag_ratio=0.2), run_time=0.2 * d)
        with self.voice("res_4") as d:
            self.play(FadeOut(VGroup(ttl, leg, rows, ttl2, axl, fr, ylt, tl, cl)), run_time=0.6)
            Rv = SR["R_MN"]
            big = T(f"R ≈ {Rv:.1f} MN", 48, COMP, weight=BOLD).move_to([3.55, 2.55, 0])
            sub = T("≈ the weight of 2,000 tonnes", 24, INK).next_to(big, DOWN, buff=0.15)
            rarrows = VGroup(*[arrow([x, 3.22, 0], [x, 2.82, 0], COMP, 6, 0.14) for x in (-5.6, -4.2, -2.9)])
            self.play(FadeIn(big, scale=1.2), LaggedStart(*[GrowArrow(a) for a in rarrows], lag_ratio=0.15), run_time=0.15 * d)
            self.play(FadeIn(sub), run_time=0.1 * d)
            # sweep plot
            ax = Axes(x_range=[0, 65, 10], y_range=[0, 20, 5], x_length=4.8, y_length=2.6, tips=False,
                      axis_config=dict(color=MUTED, stroke_width=2)).move_to([3.75, -0.9, 0])
            xl = VGroup(*[T(f"{v}", 14, MUTED).next_to(ax.c2p(v, 0), DOWN, buff=0.08) for v in range(0, 61, 20)])
            yl = VGroup(*[T(f"{v}", 14, MUTED).next_to(ax.c2p(0, v), LEFT, buff=0.08) for v in range(0, 21, 5)])
            xt = T("wellhead growth allowed  [mm]", 16, INK).next_to(ax, DOWN, buff=0.38)
            yt = T("restraint force [MN]", 16, INK).next_to(ax, UP, buff=0.1).align_to(ax, LEFT)
            pts = sorted([(s_["u_wh_mm"], s_["R_MN"]) for s_ in SWEEP])
            cv = VMobject().set_points_smoothly([ax.c2p(u, r) for u, r in pts]).set_stroke(COMP, 5)
            dots = VGroup(*[Dot(ax.c2p(u, r), radius=0.045, color=COMP) for u, r in pts])
            self.play(FadeIn(VGroup(ax, xl, yl, xt, yt)), run_time=0.1 * d)
            self.play(Create(cv), FadeIn(dots), run_time=0.2 * d)
            half = [s_ for s_ in SWEEP if abs(s_["k_restraint"] - 3e8) < 1][0]
            hp = ax.c2p(half["u_wh_mm"], half["R_MN"])
            hl = VGroup(DashedLine(ax.c2p(half["u_wh_mm"], 0), hp, stroke_color=ACCENT, dash_length=0.06),
                        DashedLine(ax.c2p(0, half["R_MN"]), hp, stroke_color=ACCENT, dash_length=0.06),
                        Dot(hp, radius=0.08, color=ACCENT))
            ht = T(f"half the growth\n→ {half['R_MN']:.1f} MN", 16, ACCENT, weight=BOLD).next_to(hp, UR, buff=0.1)
            self.play(Create(hl), FadeIn(ht), run_time=0.2 * d)
        with self.voice("res_5") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m is not hdr[0] and m is not hdr[1] and m not in hdr], run_time=0.8)
            q = VGroup(T("Restricting growth does not remove the expansion.", 32, INK, weight=BOLD),
                       T("It converts displacement into force.", 32, ACCENT, weight=BOLD)).arrange(DOWN, buff=0.35)
            self.play(FadeIn(q[0], shift=UP * 0.15), run_time=0.3 * d)
            self.play(FadeIn(q[1], shift=UP * 0.15), run_time=0.3 * d)
        rig.springs.clear_updaters()
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
