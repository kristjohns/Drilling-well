"""Comparison video, scenes 4-5: force balance on the wellhead, conductor + surface casing."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cmp_common import *  # noqa: F401,F403,E402

KF = "#7FA8B8"      # foundation colour
KI = C1338          # inner strings colour


def vlabel(lines, color, size=17):
    return VGroup(*[T(t_, size, color, weight=BOLD if i == 0 else NORMAL) for i, t_ in enumerate(lines)]).arrange(DOWN, buff=0.05)


class C04_ForceBalance(VScene):
    def construct(self):
        hdr = self.header(3, "Forces on the wellhead")
        titles = split_titles()
        self.play(FadeIn(titles), run_time=0.6)
        sc = 0.15        # screen units per MN
        yb = -0.2
        hb = 0.55

        def block(cx):
            b = RoundedRectangle(corner_radius=0.08, width=2.4, height=hb).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5).move_to([cx, yb, 0])
            return VGroup(b, T("wellhead", 18, BG, weight=BOLD).move_to(b))
        # ---------------------------------------------------------- free
        inner_f = -sum(SF[k]["dFa_MN"] for k in ("13-3/8", "9-5/8", "tubing"))
        with self.voice("c_fbd_1") as d:
            bl = block(-3.55)
            self.play(FadeIn(bl), run_time=0.08 * d)
            ybot = yb - hb / 2
            a_in = arrow([-4.25, ybot - inner_f * sc - 0.05, 0], [-4.25, ybot, 0], KI, 8, 0.2)
            l_in = vlabel(["inner strings", f"push up {inner_f:.1f} MN"], KI).next_to(a_in, LEFT, buff=0.15)
            self.play(GrowArrow(a_in), FadeIn(l_in), run_time=0.2 * d)
            ghost = bl[0].copy().set_fill(opacity=0).set_stroke(MUTED, 1.5, opacity=0.8)
            ghost = DashedVMobject(ghost, num_dashes=40)
            self.add(ghost)
            up = 0.3
            self.play(bl.animate.shift(UP * up), a_in.animate.shift(UP * up), l_in.animate.shift(UP * up), run_time=0.15 * d)
            ybot2 = ybot + up
            a_f = arrow([-2.85, ybot2, 0], [-2.85, ybot2 - inner_f * sc - 0.05, 0], KF, 8, 0.2)
            l_f = vlabel(["conductor + 20\"", f"pull back {inner_f:.1f} MN", "(tension)"], KF).next_to(a_f, RIGHT, buff=0.15)
            self.play(GrowArrow(a_f), FadeIn(l_f), run_time=0.2 * d)
            res_l = VGroup(M(rf"\Sigma F = {inner_f:.1f} - {inner_f:.1f} = 0", 32, INK),
                           T(f"→ wellhead moves up {SF['u_wh_mm']:.0f} mm", 20, FREE_C, weight=BOLD)).arrange(DOWN, buff=0.15).move_to([-3.55, -2.75, 0])
            self.play(FadeIn(res_l), run_time=0.2 * d)
        # ---------------------------------------------------------- restrained
        inner_r = -sum(SR[k]["dFa_MN"] for k in ("13-3/8", "9-5/8", "tubing"))
        fnd_r = -SR["foundation"]["N_top_MN"]
        Rr = SR["R_MN"]
        with self.voice("c_fbd_2") as d:
            br = block(3.55)
            self.play(FadeIn(br), run_time=0.06 * d)
            ybot = yb - hb / 2
            ytop = yb + hb / 2
            a_in = arrow([2.85, ybot - inner_r * sc - 0.05, 0], [2.85, ybot, 0], KI, 8, 0.2)
            l_in = vlabel(["inner strings", f"push up {inner_r:.1f} MN"], KI).next_to(a_in, LEFT, buff=0.15)
            self.play(GrowArrow(a_in), FadeIn(l_in), run_time=0.15 * d)
            a_f = arrow([4.25, ybot - fnd_r * sc - 0.05, 0], [4.25, ybot, 0], KF, 10, 0.24)
            l_f = vlabel(["conductor + 20\"", f"push up {fnd_r:.1f} MN", "(blocked expansion)"], KF).next_to(a_f, RIGHT, buff=0.15)
            self.play(GrowArrow(a_f), FadeIn(l_f), run_time=0.25 * d)
            a_r = arrow([3.55, ytop + Rr * sc + 0.05, 0], [3.55, ytop, 0], REST_C, 12, 0.28)
            l_r = vlabel(["restraint", f"pushes down {Rr:.1f} MN"], REST_C, 18).next_to(a_r, RIGHT, buff=0.2).shift(UP * 0.6)
            self.play(GrowArrow(a_r), FadeIn(l_r), run_time=0.2 * d)
            res_r = VGroup(M(rf"{inner_r:.1f} + {fnd_r:.1f} = {Rr:.1f}\ \mathrm{{MN}}", 32, INK),
                           T("≈ the weight of 2,000 tonnes", 20, REST_C, weight=BOLD)).arrange(DOWN, buff=0.15).move_to([3.55, -3.2, 0])
            self.play(FadeIn(res_r), run_time=0.15 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


def depth_plot(center, xr, xstep, xl, title, unit, zmax=200, yl=5.0, labels=None):
    ax = Axes(x_range=[xr[0], xr[1], xstep], y_range=[-zmax, 0, 50], x_length=xl, y_length=yl, tips=False,
              axis_config=dict(color=MUTED, stroke_width=2, include_ticks=False))
    ax.move_to([center[0], center[1], 0])
    grid = VGroup()
    for z in range(0, zmax + 1, 50):
        grid.add(Line(ax.c2p(xr[0], -z), ax.c2p(xr[1], -z), stroke_color=GRID, stroke_width=1))
    xs = labels or list(range(int(xr[0]), int(xr[1]) + 1, xstep))
    for x in xs:
        grid.add(Line(ax.c2p(x, 0), ax.c2p(x, -zmax), stroke_color=GRID, stroke_width=1))
    zero = Line(ax.c2p(0, 0), ax.c2p(0, -zmax), stroke_color=INK, stroke_width=2)
    xl_ = VGroup(*[T(f"{x:+d}".replace("+0", "0"), 14, MUTED).next_to(ax.c2p(x, 0), UP, buff=0.08) for x in xs])
    yl_ = VGroup(*[T(f"{z} m", 14, MUTED).next_to(ax.c2p(xr[0], -z), LEFT, buff=0.08) for z in range(0, zmax + 1, 50)])
    tt = T(title, 18, INK).next_to(xl_, UP, buff=0.12)
    return ax, VGroup(grid, zero, xl_, yl_, tt)


def zcurve(ax, z, v, color, sw=5, dashed=False):
    pts = [ax.c2p(x, -zz) for x, zz in zip(v, z) if x is not None and zz <= 200]
    m = VMobject().set_points_as_corners(pts).set_stroke(color, sw)
    return DashedVMobject(m, num_dashes=30, dashed_ratio=0.6) if dashed else m


class C05_Foundation(VScene):
    def construct(self):
        hdr = self.header(4, "Conductor + surface casing")
        F, R_ = CMP["base_free"], CMP["base_restrained"]
        z = np.array(F["z"])
        leg = VGroup(VGroup(Line(ORIGIN, RIGHT * 0.4, stroke_color=FREE_C, stroke_width=5), T("free wellhead", 17, FREE_C, weight=BOLD)).arrange(RIGHT, buff=0.12),
                     VGroup(Line(ORIGIN, RIGHT * 0.4, stroke_color=REST_C, stroke_width=5), T("restrained wellhead", 17, REST_C, weight=BOLD)).arrange(RIGHT, buff=0.12)
                     ).arrange(RIGHT, buff=0.6).move_to([2.2, 3.55, 0])
        ax, axg = depth_plot((-3.3, -0.75), (-17, 6), 5, 5.8, "axial force, conductor + 20\" + cement  [MN]", "MN",
                             labels=[-15, -10, -5, 0, 5])
        tl = T("tension →", 14, MUTED).next_to(ax.c2p(3.0, -200), DOWN, buff=0.15)
        cl = T("← compression", 14, MUTED).next_to(ax.c2p(-9, -200), DOWN, buff=0.15)
        shoe = DashedLine(ax.c2p(-17, -80), ax.c2p(6, -80), stroke_color=ACCENT, dash_length=0.07, stroke_width=1.5)
        shoe_l = T("conductor shoe 80 m", 14, ACCENT).next_to(ax.c2p(6, -80), LEFT, buff=0.08).shift(DOWN * 0.15)
        with self.voice("c_fnd_1") as d:
            self.play(FadeIn(axg), FadeIn(leg), FadeIn(tl), FadeIn(cl), run_time=0.3 * d)
            self.play(Create(shoe), FadeIn(shoe_l), run_time=0.2 * d)
        cf = zcurve(ax, z, F["N_MN"], FREE_C, 5)
        cr = zcurve(ax, z, R_["N_MN"], REST_C, 5)
        with self.voice("c_fnd_2") as d:
            self.play(Create(cf), run_time=0.45 * d)
            lf = T(f"+{F['N_MN'][0]:.1f} MN (tension)", 16, FREE_C, weight=BOLD).next_to(ax.c2p(F["N_MN"][0], -2), RIGHT, buff=0.1).shift(DOWN * 0.12)
            fr = T("soil friction takes over,\nown expansion → compression", 15, FREE_C).move_to(ax.c2p(1.0, -52))
            self.play(FadeIn(lf), FadeIn(fr), run_time=0.25 * d)
        with self.voice("c_fnd_3") as d:
            self.play(Create(cr), run_time=0.45 * d)
            lr = T(f"{R_['N_MN'][0]:.1f} MN".replace("-", "−"), 16, REST_C, weight=BOLD).next_to(ax.c2p(R_["N_MN"][0], -2), RIGHT, buff=0.1).shift(DOWN * 0.12)
            self.play(FadeIn(lr), run_time=0.2 * d)
        with self.voice("c_fnd_4") as d:
            same = Polygon(ax.c2p(-17, -112), ax.c2p(6, -112), ax.c2p(6, -200), ax.c2p(-17, -200),
                           fill_color=GOOD, fill_opacity=0.10, stroke_width=0)
            sl = T("identical in both cases:\ncement + rock already\nhold the 20\" completely", 15, GOOD).move_to(ax.c2p(1.5, -158))
            top = Polygon(ax.c2p(-17, 0), ax.c2p(6, 0), ax.c2p(6, -100), ax.c2p(-17, -100),
                          fill_color=ACCENT, fill_opacity=0.06, stroke_width=0)
            brl = T("top ~100 m: soft soil lets the\nconductor slide - the whole difference", 14, ACCENT, weight=BOLD).move_to(ax.c2p(-7.6, -30))
            self.play(FadeIn(same), FadeIn(sl), run_time=0.35 * d)
            self.play(FadeIn(top), FadeIn(brl), run_time=0.3 * d)
        # ------------------------------------------------- steel stresses
        with self.voice("c_fnd_5") as d:
            ax2, axg2 = depth_plot((3.75, -0.75), (-400, 60), 100, 4.9, "steel stress  [MPa]", "MPa", labels=[-400, -300, -200, -100, 0])
            yl = DashedLine(ax2.c2p(-379, 0), ax2.c2p(-379, -200), stroke_color=ACCENT, dash_length=0.06)
            yll = T("K-55 / X-56\nyield", 13, ACCENT).next_to(ax2.c2p(-379, -200), UP + RIGHT, buff=0.05).shift(UP * 0.1)
            self.play(FadeIn(axg2), Create(yl), FadeIn(yll), run_time=0.1 * d)
            c30f = zcurve(ax2, z, F["s30_MPa"], FREE_C, 4, dashed=True)
            c30r = zcurve(ax2, z, R_["s30_MPa"], REST_C, 4, dashed=True)
            c20f = zcurve(ax2, z, F["s20_MPa"], FREE_C, 4)
            c20r = zcurve(ax2, z, R_["s20_MPa"], REST_C, 4)
            sleg = VGroup(VGroup(DashedLine(ORIGIN, RIGHT * 0.35, stroke_color=INK, dash_length=0.06), T('30"', 14, INK)).arrange(RIGHT, buff=0.08),
                          VGroup(Line(ORIGIN, RIGHT * 0.35, stroke_color=INK, stroke_width=3), T('20"', 14, INK)).arrange(RIGHT, buff=0.08)
                          ).arrange(RIGHT, buff=0.3).move_to(ax2.c2p(-90, -185))
            self.play(Create(c30f), Create(c30r), FadeIn(sleg), run_time=0.15 * d)
            t30 = VGroup(T("at the seabed:", 14, MUTED), T("30\":  +44 → −144", 15, INK), T("20\":  +8 → −180", 15, INK)
                         ).arrange(DOWN, aligned_edge=LEFT, buff=0.06).move_to(ax2.c2p(-292, -158))
            t30.add_background_rectangle(color=BG, opacity=0.8, buff=0.06)
            self.play(Create(c20f), Create(c20r), run_time=0.15 * d)
            self.play(FadeIn(t30), run_time=0.2 * d)
            pk = R_["s20_min"]
            pd = Dot(ax2.c2p(pk["MPa"], -pk["z"]), radius=0.08, color=REST_C)
            pl = T(f"≈ {pk['MPa']:.0f} MPa locally\nbelow the conductor shoe\n(≈ 80 % of yield)".replace("-", "−"), 14, REST_C, weight=BOLD)
            pl.next_to(pd, DOWN + RIGHT, buff=0.08).shift(DOWN * 0.15)
            self.play(FadeIn(pd, scale=2), FadeIn(pl), Flash(pd, color=REST_C), run_time=0.2 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
