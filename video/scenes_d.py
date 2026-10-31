"""Scenes 8-9: effective force and helical buckling (2-D and 3-D)."""
from common import *  # noqa: F401,F403

P13R = prof("13-3/8", "base_restrained")
P13F = prof("13-3/8", "base_free")
P95R = prof("9-5/8", "base_restrained")
P95F = prof("9-5/8", "base_free")
S13 = S("13-3/8")
S95R = S("9-5/8")
S95F = S("9-5/8", "base_free")


def force_axes(z_max, center, xl=5.6, yl=5.6, x_rng=(-2.6, 2.0)):
    ax = Axes(x_range=[x_rng[0], x_rng[1], 0.5], y_range=[-z_max, 0, 250 if z_max < 2000 else 500],
              x_length=xl, y_length=yl, tips=False, axis_config=dict(color=MUTED, stroke_width=2))
    ax.move_to([center[0], center[1], 0])
    # move y axis to F=0 automatically (Axes puts it at x=0)
    grid = VGroup()
    step = 250 if z_max < 2000 else 500
    for z in range(0, int(z_max) + 1, step):
        grid.add(Line(ax.c2p(x_rng[0], -z), ax.c2p(x_rng[1], -z), stroke_color=GRID, stroke_width=1))
    xs = [v for v in np.arange(-2.5, 2.01, 0.5)]
    for x in xs:
        grid.add(Line(ax.c2p(x, 0), ax.c2p(x, -z_max), stroke_color=GRID, stroke_width=1))
    xl_ = VGroup(*[T(f"{x:+.1f}".replace("+0.0", "0").replace("-0.0", "0"), 14, MUTED).next_to(ax.c2p(x, 0), UP, buff=0.08)
                   for x in xs if abs(x * 2 - round(x * 2)) < 1e-6 and abs(x) % 1.0 < 1e-6 or abs(x) in (0.5, 1.5, 2.5)])
    yl_ = VGroup(*[T(f"{z:,}", 14, MUTED).next_to(ax.c2p(x_rng[0], -z), LEFT, buff=0.08) for z in range(0, int(z_max) + 1, step)])
    xt = T("effective force  F_eff  [MN]", 17, INK).next_to(xl_, UP, buff=0.1)
    tl = T("tension →", 15, TENS).next_to(ax.c2p(1.2, 0), UP, buff=0.42)
    cl = T("← compression", 15, COMP).next_to(ax.c2p(-1.6, 0), UP, buff=0.42)
    return ax, VGroup(grid, ax, xl_, yl_, xt)


def fcurve(ax, z, F, color, sw=5, dashed=False):
    pts = [ax.c2p(f / 1e6, -zz) for f, zz in zip(F, z)]
    m = VMobject().set_points_as_corners(pts).set_stroke(color, sw)
    return DashedVMobject(m, num_dashes=40) if dashed else m


class S08_EffectiveForce(VScene):
    def construct(self):
        hdr = self.header(7, "Effective force and buckling")
        # ---------------------------------------------------- definition
        with self.voice("eff_1") as d:
            px = -4.4
            body = Rectangle(width=1.1, height=2.6).set_fill(C1338, 0.35).set_stroke(C1338, 3).move_to([px, 0.2, 0])
            bore = Rectangle(width=0.7, height=2.6).set_fill(BRINE, 0.5).set_stroke(width=0).move_to([px, 0.2, 0])
            fa_t = arrow([px, 1.55, 0], [px, 2.35, 0], TENS, 6, 0.18)
            fa_b = arrow([px, -1.15, 0], [px, -1.95, 0], TENS, 6, 0.18)
            fat = M(r"F_a", 30, TENS).next_to(fa_t, RIGHT, buff=0.1)
            pin = VGroup(*[arrow([px + s * 0.08, yy, 0], [px + s * 0.33, yy, 0], "#7FC8F8", 3, 0.1) for s in (-1, 1) for yy in (-0.4, 0.2, 0.8)])
            pout = VGroup(*[arrow([px + s * 1.05, yy, 0], [px + s * 0.6, yy, 0], "#E2B77E", 3, 0.1) for s in (-1, 1) for yy in (-0.4, 0.2, 0.8)])
            pit = M(r"p_i", 28, "#7FC8F8").move_to([px, -0.1, 0])
            pot = M(r"p_o", 28, "#E2B77E").move_to([px + 1.3, 1.3, 0])
            self.play(FadeIn(body), FadeIn(bore), run_time=0.8)
            self.play(GrowArrow(fa_t), GrowArrow(fa_b), FadeIn(fat), run_time=0.06 * d)
            self.play(LaggedStart(*[GrowArrow(a) for a in pin], lag_ratio=0.05), FadeIn(pit), run_time=0.06 * d)
            self.play(LaggedStart(*[GrowArrow(a) for a in pout], lag_ratio=0.05), FadeIn(pot), run_time=0.06 * d)
            eq = MathTex(r"F_{\mathrm{eff}}", r"=", r"F_a", r"-", r"p_i A_i", r"+", r"p_o A_o", font_size=56)
            eq[0].set_color(ACCENT)
            eq[2].set_color(TENS)
            eq[4].set_color("#7FC8F8")
            eq[6].set_color("#E2B77E")
            eq.move_to([2.0, 1.4, 0])
            self.play(Write(eq), run_time=0.3 * d)
            n1 = T("true axial force in the steel", 17, TENS).next_to(eq[2], DOWN, buff=0.55).shift(LEFT * 0.5)
            n2 = T("internal pressure × inside area", 17, "#7FC8F8").next_to(eq[4], DOWN, buff=1.05)
            n3 = T("external pressure × outside area", 17, "#E2B77E").next_to(eq[6], DOWN, buff=0.55).shift(RIGHT * 0.3)
            l1 = Line(eq[2].get_bottom(), n1.get_top(), stroke_color=TENS, stroke_width=1.5)
            l2 = Line(eq[4].get_bottom(), n2.get_top(), stroke_color="#7FC8F8", stroke_width=1.5)
            l3 = Line(eq[6].get_bottom(), n3.get_top(), stroke_color="#E2B77E", stroke_width=1.5)
            self.play(FadeIn(VGroup(n1, l1)), FadeIn(VGroup(n2, l2)), FadeIn(VGroup(n3, l3)), run_time=0.15 * d)
            rule = T("buckling is governed by F_eff, not F_a   (Lubinski, 1962)", 20, ACCENT, weight=BOLD).move_to([2.0, -2.2, 0])
            self.play(FadeIn(rule, shift=UP * 0.1), run_time=0.1 * d)
        self.play(FadeOut(VGroup(body, bore, fa_t, fa_b, fat, pin, pout, pit, pot, n1, n2, n3, l1, l2, l3, rule)),
                  eq.animate.scale(0.55).move_to([4.6, 3.55, 0]), run_time=0.8)
        # ---------------------------------------------------- 13-3/8 profile
        ax, axg = force_axes(1300, (-2.6, -0.55))
        z = np.array(P13R["z"])
        Fpre = np.array(P13R["Fe_pre"])
        Fres = np.array(P13R["Fe"])
        dF = (Fres - Fpre).mean()
        title = T('13⅜" intermediate  ·  free length 0 – 1,300 m', 20, C1338, weight=BOLD).move_to([-2.6, 3.05, 0])
        zero = Line(ax.c2p(0, 0), ax.c2p(0, -1300), stroke_color=INK, stroke_width=2)
        pipe_x = 3.6
        y_top, y_bot = ax.c2p(0, 0)[1], ax.c2p(0, -1300)[1]
        HW, CL = 0.2, 0.17
        walls = VGroup(*[Line([pipe_x + s * (HW + CL + 0.03), y_top, 0], [pipe_x + s * (HW + CL + 0.03), y_bot, 0],
                              stroke_color=C20, stroke_width=5) for s in (-1, 1)])
        fillw = Rectangle(width=2 * (HW + CL), height=y_top - y_bot).set_fill(MUD, 0.35).set_stroke(width=0).move_to([pipe_x, (y_top + y_bot) / 2, 0])
        wl = T("outer casing /\nopen hole", 15, C20).next_to(walls, RIGHT, buff=0.15).shift(UP * 2.0)
        cem = VGroup(*[Rectangle(width=0.4, height=0.35).set_fill(CEMENT, 1).set_stroke(width=0).move_to([pipe_x + s * (HW + 0.2), y_bot - 0.17, 0]) for s in (-1, 1)])
        tocl = T("TOC", 15, MUTED).next_to(cem, RIGHT, buff=0.1)
        hanger = Rectangle(width=2 * (HW + CL + 0.1), height=0.18).set_fill("#8693A5", 1).set_stroke(width=0).move_to([pipe_x, y_top + 0.09, 0])
        amp = ValueTracker(0.0)
        hel = ValueTracker(0.0)
        Fc_max = -Fres.min()

        def amp_prof(s):
            return 1.0

        def pitch_prof(s):
            Fc = -np.interp(s * 1300, z, Fres)
            return math.sqrt(Fc_max / max(Fc, 0.3e6))

        def make_pipe():
            a = amp.get_value()
            h = hel.get_value()
            pitch = 2.6 - 0.9 * h
            return buckled_pipe(pipe_x, y_top, y_bot, HW, C1338, CL * a, pitch, mode="helix" if h > 0.5 else "sin",
                                n=220, amp_profile=amp_prof, pitch_profile=pitch_prof)
        pipe = always_redraw(make_pipe)
        with self.voice("eff_2") as d:
            self.play(FadeIn(axg), FadeIn(title), Create(zero), run_time=0.15 * d)
            self.play(FadeIn(fillw), Create(walls), FadeIn(cem), FadeIn(hanger), FadeIn(wl), FadeIn(tocl), run_time=0.1 * d)
            self.add(pipe)
            c_pre = fcurve(ax, z, Fpre, TENS, 5)
            self.play(Create(c_pre), run_time=0.25 * d)
            tsh = Polygon(*[ax.c2p(f / 1e6, -zz) for f, zz in zip(Fpre, z)], ax.c2p(0, -1300), ax.c2p(0, 0),
                          fill_color=TENS, fill_opacity=0.15, stroke_width=0)
            l_top = T(f"+{Fpre[0] / 1e6:.1f} MN at the wellhead", 16, TENS, weight=BOLD).next_to(ax.c2p(Fpre[0] / 1e6, 0), DOWN + RIGHT, buff=0.08)
            l_bot = T("≈ 0 at top of cement", 16, TENS).next_to(ax.c2p(Fpre[-1] / 1e6, -1300), RIGHT, buff=0.15).shift(UP * 0.2)
            lab_pre = T("before production\n(hanging weight)", 16, TENS).move_to(ax.c2p(1.3, -700))
            self.play(FadeIn(tsh), FadeIn(l_top), FadeIn(l_bot), FadeIn(lab_pre), run_time=0.25 * d)
        with self.voice("eff_3") as d:
            sh = ValueTracker(0.0)
            cur = always_redraw(lambda: fcurve(ax, z, Fpre + sh.get_value() * dF, COMP, 5))
            csh = always_redraw(lambda: Polygon(*[ax.c2p(min(f, 0) / 1e6, -zz) for f, zz in zip(Fpre + sh.get_value() * dF, z)],
                                                ax.c2p(0, -1300), ax.c2p(0, 0), fill_color=COMP, fill_opacity=0.22, stroke_width=0))
            self.add(csh, cur)
            self.play(c_pre.animate.set_stroke(opacity=0.45), FadeOut(tsh), FadeOut(l_top), FadeOut(l_bot), run_time=0.6)
            arrs = VGroup(*[arrow(ax.c2p(Fpre[i] / 1e6 - 0.05, -z[i]), ax.c2p((Fpre[i] + dF) / 1e6 + 0.05, -z[i]), COMP, 4, 0.14)
                            for i in (10, 60, 110)])
            self.play(sh.animate.set_value(1.0), LaggedStart(*[GrowArrow(a) for a in arrs], lag_ratio=0.2), run_time=0.35 * d)
            cur.clear_updaters()
            csh.clear_updaters()
            dl = T(f"heating:\nΔF ≈ {dF / 1e6:.1f} MN\n(uniform)".replace("-", "−"), 16, COMP, weight=BOLD).move_to(ax.c2p(-0.62, -560))
            v1 = T(f"{Fres[0] / 1e6:.1f} MN".replace("-", "−"), 16, COMP, weight=BOLD).next_to(ax.c2p(Fres[0] / 1e6, -60), LEFT, buff=0.12)
            v2 = T(f"{Fres[-1] / 1e6:.1f} MN".replace("-", "−"), 16, COMP, weight=BOLD).next_to(ax.c2p(Fres[-1] / 1e6, -1240), RIGHT, buff=0.15)
            self.play(FadeIn(dl), FadeIn(v1), FadeIn(v2), FadeOut(arrs), run_time=0.15 * d)
            allc = T("compressive over the\nwhole free length", 16, COMP).move_to(ax.c2p(-0.85, -960))
            self.play(FadeIn(allc), run_time=0.1 * d)
        with self.voice("eff_4") as d:
            Fh = P13R["Fh"] / 1e6
            thr = DashedLine(ax.c2p(-Fh, 0), ax.c2p(-Fh, -1300), stroke_color=ACCENT, dash_length=0.07)
            thl = T(f"helical buckling onset\n≈ {Fh * 1000:.0f} kN (vertical well)", 15, ACCENT).next_to(ax.c2p(-Fh, -1080), RIGHT, buff=0.12)
            self.play(Create(thr), FadeIn(thl), FadeOut(lab_pre), run_time=0.2 * d)
            snake = T("sinusoidal", 18, C1338, weight=BOLD).next_to(walls, UP, buff=0.12)
            self.play(amp.animate.set_value(1.0), FadeIn(snake), run_time=0.22 * d)
            helt = T("helical", 18, C1338, weight=BOLD).move_to(snake)
            self.play(hel.animate.set_value(1.0), Transform(snake, helt), run_time=0.2 * d)
            conf = T("confined by the\nouter casing", 15, INK).next_to(walls, RIGHT, buff=0.15).shift(DOWN * 0.6)
            self.play(FadeIn(conf), run_time=0.1 * d)
            note = T("helix pitch and lateral scale exaggerated", 13, FAINT).next_to(cem, DOWN, buff=0.08)
            self.play(FadeIn(note), run_time=0.5)
        pipe.clear_updaters()
        # ---------------------------------------------------- 9-5/8 profile
        with self.voice("eff_5") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in (hdr[0], hdr[1], eq)], run_time=0.8)
            ax2, axg2 = force_axes(2550, (-2.6, -0.55), x_rng=(-2.6, 2.0))
            z2 = np.array(P95R["z"])
            title2 = T('9⅝" production  ·  free length 0 – 2,550 m', 20, C958, weight=BOLD).move_to([-2.6, 3.05, 0])
            zero2 = Line(ax2.c2p(0, 0), ax2.c2p(0, -2550), stroke_color=INK, stroke_width=2)
            cpre = fcurve(ax2, z2, P95R["Fe_pre"], TENS, 4)
            cfree = fcurve(ax2, z2, P95F["Fe"], MUTED, 4)
            cres = fcurve(ax2, z2, P95R["Fe"], COMP, 5)
            self.play(FadeIn(axg2), FadeIn(title2), Create(zero2), run_time=0.1 * d)
            self.play(Create(cpre), run_time=0.1 * d)
            self.play(Create(cfree), Create(cres), run_time=0.15 * d)
            nf, nr = S95F["buckled_from_m"], S95R["buckled_from_m"]
            hf = DashedLine(ax2.c2p(-2.6, -nf), ax2.c2p(2.0, -nf), stroke_color=MUTED, dash_length=0.07)
            hr = DashedLine(ax2.c2p(-2.6, -nr), ax2.c2p(2.0, -nr), stroke_color=COMP, dash_length=0.07)
            lf = T(f"neutral point, free WH: {nf:.0f} m", 15, MUTED).next_to(ax2.c2p(2.0, -nf), RIGHT, buff=0.1).shift(DOWN * 0.12)
            lr = T(f"neutral point, restrained: {nr:.0f} m", 15, COMP, weight=BOLD).next_to(ax2.c2p(2.0, -nr), RIGHT, buff=0.1).shift(UP * 0.12)
            leg = VGroup(VGroup(Line(ORIGIN, RIGHT * 0.3, stroke_color=TENS, stroke_width=4), T("before production", 14, TENS)).arrange(RIGHT, buff=0.1),
                         VGroup(Line(ORIGIN, RIGHT * 0.3, stroke_color=MUTED, stroke_width=4), T("production, free WH", 14, MUTED)).arrange(RIGHT, buff=0.1),
                         VGroup(Line(ORIGIN, RIGHT * 0.3, stroke_color=COMP, stroke_width=4), T("production, restrained", 14, COMP)).arrange(RIGHT, buff=0.1)
                         ).arrange(DOWN, aligned_edge=LEFT, buff=0.08).move_to(ax2.c2p(1.05, -1750))
            self.play(FadeIn(leg), Create(hf), Create(hr), FadeIn(lf), FadeIn(lr), run_time=0.15 * d)
            # 9-5/8 pipe visual
            px = 4.9
            yt, yb = ax2.c2p(0, 0)[1], ax2.c2p(0, -2550)[1]
            HW2, CL2 = 0.15, 0.12
            w2 = VGroup(*[Line([px + s * (HW2 + CL2 + 0.03), yt, 0], [px + s * (HW2 + CL2 + 0.03), yb, 0], stroke_color=C1338, stroke_width=4) for s in (-1, 1)])
            Fe = np.array(P95R["Fe"])
            Fh2 = P95R["Fh"]

            def ap(s):
                Fc = -np.interp(s * 2550, z2, Fe)
                return float(np.clip((Fc - Fh2) / 0.25e6, 0, 1))

            def pp(s):
                Fc = -np.interp(s * 2550, z2, Fe)
                return math.sqrt(1.0e6 / max(Fc, 0.2e6))
            p95 = buckled_pipe(px, yt, yb, HW2, C958, CL2, 1.3, mode="helix", n=260, amp_profile=ap, pitch_profile=pp)
            straight = buckled_pipe(px, yt, yb, HW2, C958, 0.0, 1.3, mode="helix", n=260, amp_profile=ap, pitch_profile=pp)
            self.play(Create(w2), FadeIn(straight), run_time=0.1 * d)
            self.play(Transform(straight, p95), run_time=0.2 * d)
            up = arrow(ax2.c2p(-2.3, -nf), ax2.c2p(-2.3, -nr), ACCENT, 4, 0.14)
            upl = T("≈ 100 m higher", 15, ACCENT).next_to(up, RIGHT, buff=0.08)
            self.play(GrowArrow(up), FadeIn(upl), run_time=0.1 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class S09_Helix(V3Scene):
    def construct(self):
        self.set_camera_orientation(phi=78 * DEGREES, theta=-62 * DEGREES, zoom=0.82)
        hdr = VGroup(T("08", 22, ACCENT, weight=BOLD), T("INSIDE THE HELIX", 22, MUTED, weight=MEDIUM)).arrange(RIGHT, buff=0.25)
        hdr.to_corner(UL, buff=0.38)
        self.add_fixed_in_frame_mobjects(hdr)
        H = 7.4
        R_out = 1.0                      # 20" ID   (475.7 mm)
        r_p = 339.7 / 475.7 * R_out      # 13-3/8" OD
        A = R_out - r_p                  # radial clearance (68 mm) - true lateral ratio
        outer = Cylinder(radius=R_out + 0.03, height=H, direction=OUT, resolution=(1, 40), fill_opacity=0.10,
                         checkerboard_colors=False, fill_color=C20, stroke_width=0.0)
        outer.set_fill(C20, opacity=0.10)
        rings = VGroup(*[Circle(radius=R_out + 0.03, color=C20, stroke_width=2, stroke_opacity=0.55).shift(OUT * zz)
                         for zz in np.linspace(-H / 2, H / 2, 9)])
        lines = VGroup(*[Line([R_out * math.cos(a), R_out * math.sin(a), -H / 2], [R_out * math.cos(a), R_out * math.sin(a), H / 2],
                              stroke_color=C20, stroke_width=1.5, stroke_opacity=0.35) for a in np.linspace(0, TAU, 13)[:-1]])
        a_t = ValueTracker(0.0)
        m_t = ValueTracker(0.0)
        p_t = ValueTracker(4.2)

        def centre(u):
            a = A * a_t.get_value()
            ph = TAU * u / p_t.get_value()
            return np.array([a * math.sin(ph), m_t.get_value() * a * math.cos(ph), u])

        def tube():
            def f(u, v):
                c = centre(u)
                return c + np.array([r_p * math.cos(v), r_p * math.sin(v), 0])
            s = Surface(f, u_range=[-H / 2, H / 2], v_range=[0, TAU], resolution=(56, 12),
                        fill_opacity=1.0, checkerboard_colors=False, fill_color=C1338, stroke_width=0.6, stroke_color=C1338)
            return s
        pipe = tube()
        state = {"key": None}

        def upd(mob):
            key = (round(a_t.get_value(), 4), round(m_t.get_value(), 4), round(p_t.get_value(), 4))
            if key != state["key"]:
                state["key"] = key
                mob.become(tube())
        pipe.add_updater(upd)
        with self.voice("hel_1") as d:
            self.add(outer, lines, rings)
            self.play(FadeIn(outer), Create(rings), FadeIn(lines), run_time=0.25 * d)
            self.add(pipe)
            lab = VGroup(T('13⅜" casing inside 20" casing', 22, INK, weight=BOLD),
                         T("radial clearance  r_c = 68 mm", 20, ACCENT),
                         T("(lateral scale true · length compressed)", 15, FAINT)).arrange(DOWN, aligned_edge=LEFT, buff=0.1)
            lab.to_corner(UR, buff=0.45)
            self.add_fixed_in_frame_mobjects(lab)
            self.play(FadeIn(lab), run_time=0.25 * d)
            self.begin_ambient_camera_rotation(rate=0.08)
        with self.voice("hel_2") as d:
            fl2 = T("F_eff = −2.3 MN", 22, COMP, weight=BOLD)
            fl2.to_corner(DR, buff=0.5)
            self.add_fixed_in_frame_mobjects(fl2)
            fl2.set_opacity(0)
            self.play(a_t.animate.set_value(1.0), run_time=0.3 * d)
            self.play(m_t.animate.set_value(1.0), p_t.animate.set_value(3.6), run_time=0.3 * d)
            eq = M(r"p = \pi\sqrt{\frac{8\,E I}{F}} \;\approx\; 36\ \mathrm{m}", 38, INK)
            eq.to_corner(DL, buff=0.5)
            self.add_fixed_in_frame_mobjects(eq)
            self.play(Write(eq), fl2.animate.set_opacity(1), run_time=0.3 * d)
        with self.voice("hel_3") as d:
            contact = ParametricFunction(
                lambda u: np.array([R_out * math.sin(TAU * u / p_t.get_value()), R_out * math.cos(TAU * u / p_t.get_value()), u]),
                t_range=[-H / 2, H / 2], stroke_color=ACCENT, stroke_width=6)
            self.add(contact)
            e1 = M(r"\sigma_b = \frac{D\, r_c\, F}{4 I} \approx 57\ \mathrm{MPa}", 36, INK)
            e2 = M(r"w_c = \frac{r_c\, F^2}{4 E I} \approx 1.9\ \mathrm{kN/m}", 36, ACCENT)
            g = VGroup(e1, e2).arrange(DOWN, aligned_edge=LEFT, buff=0.3)
            g.next_to(eq, UP, buff=0.4, aligned_edge=LEFT)
            self.add_fixed_in_frame_mobjects(g)
            g.set_opacity(0)
            self.play(g[0].animate.set_opacity(1), run_time=0.3 * d)
            wl = T("contact line: wear on both strings", 18, ACCENT).next_to(fl2, UP, buff=0.25, aligned_edge=RIGHT)
            self.add_fixed_in_frame_mobjects(wl)
            wl.set_opacity(0)
            self.play(g[1].animate.set_opacity(1), wl.animate.set_opacity(1), run_time=0.3 * d)
        with self.voice("hel_4") as d:
            box = VGroup()
            b1 = Rectangle(width=5.0, height=0.3).set_fill(C1338, 0.35).set_stroke(C1338, 2)
            b2 = Rectangle(width=5.0 * 52 / 1140, height=0.3).set_fill(ACCENT, 1).set_stroke(width=0)
            t1 = T("thermal growth to absorb: 1,140 mm", 17, C1338)
            t2 = T("helix shortening ≈ 52 mm  (4.6 %)", 17, ACCENT, weight=BOLD)
            e3 = M(r"\Delta L_b = \frac{r_c^2\, F}{4 E I}\,L", 30, INK)
            box = VGroup(e3, t1, b1, t2, b2)
            b1.stretch_to_fit_width(3.8)
            b2.stretch_to_fit_width(3.8 * 52 / 1140)
            e3.move_to([4.7, 1.3, 0])
            t1.next_to(e3, DOWN, buff=0.3)
            b1.next_to(t1, DOWN, buff=0.1)
            b2.align_to(b1, LEFT).set_y(b1.get_y() - 0.75)
            t2.next_to(b2, UP, buff=0.1).align_to(b1, LEFT)
            self.add_fixed_in_frame_mobjects(box)
            box.set_opacity(0)
            self.play(FadeOut(lab), run_time=0.4)
            self.play(e3.animate.set_opacity(1), t1.animate.set_opacity(1), b1.animate.set_opacity(1), run_time=0.25 * d)
            self.play(t2.animate.set_opacity(1), b2.animate.set_opacity(1), run_time=0.25 * d)
        self.stop_ambient_camera_rotation()
        pipe.clear_updaters()
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
