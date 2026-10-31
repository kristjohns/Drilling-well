"""Comparison video, scenes 1-3: intro, heat-up race, principle."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cmp_common import *  # noqa: F401,F403,E402
from scenes_a import wh_stack  # noqa: E402
from scenes_c import SpringRig, XS  # noqa: E402

STR_DT = {"30": 61, "20": 75, "13-3/8": 87, "9-5/8": 97, "tubing": 101}


def casing_lines(cx, y_top, y_bot, scale=1.0):
    g = VGroup()
    for k, hw, depth in [("30", 0.95, 0.35), ("20", 0.72, 0.75), ("13-3/8", 0.52, 1.0), ("9-5/8", 0.36, 1.0), ("tubing", 0.16, 1.0)]:
        for sgn in (-1, 1):
            ln = Line([cx + sgn * hw * scale, y_top, 0], [cx + sgn * hw * scale, y_top - (y_top - y_bot) * depth, 0],
                      stroke_color=STR_COLORS[k], stroke_width=5)
            ln.key = k
            g.add(ln)
    return g


def sea_and_rock(y_sb, rock_bottom=-4.0):
    sea = Rectangle(width=config.frame_width, height=4.0 - y_sb).move_to([0, (4 + y_sb) / 2, 0])
    sea.set_fill(color=["#14507A", "#071827"], opacity=1).set_stroke(width=0).set_sheen_direction(DOWN)
    rock = Rectangle(width=config.frame_width, height=y_sb - rock_bottom).move_to([0, (y_sb + rock_bottom) / 2, 0])
    rock.set_fill(color=["#3A2C20", BG], opacity=1).set_stroke(width=0).set_sheen_direction(DOWN)
    pts = [[x, y_sb + 0.04 * math.sin(1.7 * x), 0] for x in np.linspace(-7.3, 7.3, 60)]
    seabed = VMobject().set_points_smoothly(pts).set_stroke("#8C7A62", 3)
    return VGroup(sea, rock, seabed)


class C01_Intro(VScene):
    def construct(self):
        y_sb = -1.25
        bg = sea_and_rock(y_sb)
        self.add(bg)
        wl = casing_lines(-3.55, y_sb, -3.9)
        wr = casing_lines(3.55, y_sb, -3.9)
        sl = wh_stack(0.85, [-3.55, y_sb + 0.01, 0])
        sr = wh_stack(0.85, [3.55, y_sb + 0.01, 0])
        title = T("Free vs. Restrained Wellhead", 50, INK, weight=BOLD).move_to([0, 3.05, 0])
        sub = T("same well  ·  same heat  ·  one boundary condition", 26, "#BFD3EA").next_to(title, DOWN, buff=0.2)
        div = DashedLine([0, 1.9, 0], [0, -3.95, 0], stroke_color="#5C6E8A", stroke_width=2, dash_length=0.1)
        frame = restraint_frame(3.55, y_sb, 1.55, 1.25)
        with self.voice("c_intro_1") as d:
            self.play(FadeIn(title, shift=UP * 0.2), FadeIn(sub), run_time=1.4)
            self.play(FadeIn(VGroup(wl, wr)), FadeIn(sl), FadeIn(sr), Create(div), run_time=0.15 * d)
            lt = VGroup(up_icon(FREE_C), T("FREE: can grow upward", 24, FREE_C, weight=BOLD)).arrange(RIGHT, buff=0.15).move_to([-3.55, 1.55, 0])
            self.play(FadeIn(lt), sl.animate.shift(UP * 0.32), run_time=0.15 * d)
            frame.shift(UP * 3.5).set_opacity(0)
            rt = VGroup(lock_icon(REST_C), T("RESTRAINED: held in place", 24, REST_C, weight=BOLD)).arrange(RIGHT, buff=0.15).move_to([3.55, 1.95, 0])
            self.play(frame.animate.shift(DOWN * 3.5).set_opacity(1), run_time=0.15 * d, rate_func=rate_functions.ease_out_cubic)
            self.play(FadeIn(rt), run_time=0.8)
        with self.voice("c_intro_2") as d:
            band_ = Rectangle(width=config.frame_width, height=1.25).set_fill(BG, 0.85).set_stroke(width=0).move_to([0, -3.25, 0])
            chips = VGroup()
            for txt in ["heat-up", "forces on the wellhead", "conductor + surface casing", "inner casings + buckling", "scoreboard"]:
                t_ = T(txt, 18, INK)
                c_ = RoundedRectangle(corner_radius=0.16, width=t_.width + 0.45, height=0.5).set_fill(PANEL, 1).set_stroke(ACCENT, 1.3)
                t_.move_to(c_)
                chips.add(VGroup(c_, t_))
            chips.arrange(RIGHT, buff=0.18).move_to([0, -3.2, 0])
            if chips.width > 13.6:
                chips.scale_to_fit_width(13.6)
            self.play(FadeIn(band_), run_time=0.5)
            self.play(LaggedStart(*[FadeIn(c_, shift=UP * 0.15) for c_ in chips], lag_ratio=0.3), run_time=0.6 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class C02_HeatUp(VScene):
    def construct(self):
        hdr = self.header(1, "Heat-up")
        y_sb = -0.2
        bg = sea_and_rock(y_sb, -1.35)
        self.add(bg)
        self.bring_to_front(hdr)
        titles = split_titles(y=3.1, divider=False)
        div = DashedLine([0, 2.8, 0], [0, -3.95, 0], stroke_color="#5C6E8A", stroke_width=2, dash_length=0.1)
        self.add(titles, div)
        wl = casing_lines(-3.55, y_sb, -1.3, 0.8)
        wr = casing_lines(3.55, y_sb, -1.3, 0.8)
        sl = wh_stack(0.72, [-3.55, y_sb + 0.01, 0])
        sr = wh_stack(0.72, [3.55, y_sb + 0.01, 0])
        frame = restraint_frame(3.55, y_sb, 1.3, sr.get_top()[1] + 0.02)
        self.add(wl, wr, sl, sr, frame)
        # charts ---------------------------------------------------------
        import math as m_

        def chart(cx, ymax, ystep, ylabel, color):
            ax = Axes(x_range=[0, m_.log10(365), 1], y_range=[0, ymax, ystep], x_length=5.0, y_length=1.75, tips=False,
                      axis_config=dict(color=MUTED, stroke_width=2, include_ticks=False)).move_to([cx + 0.2, -2.65, 0])
            xl = VGroup(*[T(t_, 13, MUTED).next_to(ax.c2p(m_.log10(v), 0), DOWN, buff=0.08)
                          for t_, v in [("1 day", 1), ("1 week", 7), ("1 month", 30), ("1 year", 365)]])
            yl = VGroup(*[T(f"{v}", 13, MUTED).next_to(ax.c2p(0, v), LEFT, buff=0.08) for v in range(0, ymax + 1, ystep)])
            yt = T(ylabel, 15, color).next_to(ax, UP, buff=0.08).align_to(ax, LEFT)
            grid = VGroup(*[Line(ax.c2p(0, v), ax.c2p(m_.log10(365), v), stroke_color=GRID, stroke_width=1) for v in range(ystep, ymax + 1, ystep)])
            return ax, VGroup(grid, ax, xl, yl, yt)
        axl, gl = chart(-3.55, 70, 20, "wellhead growth  [mm]", FREE_C)
        axr, gr = chart(3.55, 20, 5, "restraint force  [MN]", REST_C)
        s = ValueTracker(0.0)

        def t_hours(v):
            return 24.0 * v / 0.25 if v <= 0.25 else 24.0 * 10 ** ((v - 0.25) / 0.75 * m_.log10(8760 / 24))

        def val(key, v):
            if v <= 0.25:
                return interp_hist(key, 24.0) * (v / 0.25)
            return interp_hist(key, t_hours(v))

        def tlabel(v):
            th = t_hours(v)
            if th < 24:
                return f"{th:4.1f} h"
            dd = th / 24
            return f"{dd:5.0f} days" if dd < 360 else "1 year"

        clock = always_redraw(lambda: VGroup(T("time since start-up", 14, MUTED), T(tlabel(s.get_value()), 26, INK, weight=BOLD))
                              .arrange(DOWN, buff=0.04).move_to([0, 2.35, 0]).add_background_rectangle(color=BG, opacity=0.8, buff=0.1))
        y0 = sl.get_y()
        scale_mm = 0.5 / 61.0

        def upd_stack(mob):
            mob.set_y(y0 + val("u_wh_mm", s.get_value()) * scale_mm)
        rd_l = always_redraw(lambda: VGroup(T("growth", 18, FREE_C), T(f"{val('u_wh_mm', s.get_value()):4.0f} mm", 22, FREE_C, weight=BOLD))
                             .arrange(DOWN, buff=0.04).move_to([-1.3, 1.05, 0]))
        rd_r = always_redraw(lambda: VGroup(T("force", 18, REST_C), T(f"{val('R_MN', s.get_value()):4.1f} MN", 22, REST_C, weight=BOLD))
                             .arrange(DOWN, buff=0.04).move_to([6.2, 1.05, 0]))
        beam_top = frame[3].get_top()[1]

        def r_arrows():
            Lr = 0.08 + 0.55 * val("R_MN", s.get_value()) / 19.5
            return VGroup(*[arrow([x, beam_top + Lr, 0], [x, beam_top + 0.02, 0], REST_C, 5, min(0.14, Lr * 0.6))
                            for x in (2.95, 3.55, 4.15)])
        rarr = always_redraw(r_arrows)

        def curve_l():
            v = s.get_value()
            if v <= 0.26:
                return VMobject()
            ts = np.linspace(0, (v - 0.25) / 0.75 * m_.log10(365), 40)
            return VMobject().set_points_as_corners([axl.c2p(x, interp_hist("u_wh_mm", 24 * 10 ** x)) for x in ts]).set_stroke(FREE_C, 4)

        def curve_r():
            v = s.get_value()
            if v <= 0.26:
                return VMobject()
            ts = np.linspace(0, (v - 0.25) / 0.75 * m_.log10(365), 40)
            return VMobject().set_points_as_corners([axr.c2p(x, interp_hist("R_MN", 24 * 10 ** x)) for x in ts]).set_stroke(REST_C, 4)
        cl, cr = always_redraw(curve_l), always_redraw(curve_r)
        with self.voice("c_heat_1") as d:
            banner = T("every string wants to get longer  ·  inner casings by 1–2 m", 20, ACCENT).move_to([0, -1.55, 0])
            banner.add_background_rectangle(color=BG, opacity=0.85, buff=0.12)
            anims = []
            for g in (wl, wr):
                for ln in g:
                    anims.append(ln.animate.set_stroke(color=temp_color(STR_DT[ln.key]), width=7))
            self.play(*anims, run_time=0.4 * d)
            self.play(FadeIn(banner, shift=UP * 0.1), run_time=0.15 * d)
            self.play(FadeIn(gl), FadeIn(gr), run_time=0.15 * d)
        with self.voice("c_heat_2") as d:
            self.play(FadeOut(banner), run_time=0.4)
            sl.add_updater(upd_stack)
            self.add(clock, rd_l, rd_r, rarr, cl, cr)
            self.play(s.animate.set_value(1.0), run_time=0.85 * d, rate_func=linear)
            sl.clear_updaters()
            for mob in (clock, rd_l, rd_r, rarr, cl, cr):
                mob.clear_updaters()
            note = T("(movement exaggerated)", 13, FAINT).move_to([-1.3, 0.55, 0])
            self.play(FadeIn(note), run_time=0.5)
        with self.voice("c_heat_3") as d:
            self.play(Circumscribe(gr, color=REST_C, buff=0.12), Indicate(rd_r, color=REST_C), run_time=0.3 * d)
            msg = VGroup(T("same thermal expansion", 22, INK, weight=BOLD),
                         VGroup(T("movement", 22, FREE_C, weight=BOLD), T("vs.", 22, MUTED), T("force", 22, REST_C, weight=BOLD)).arrange(RIGHT, buff=0.18)
                         ).arrange(DOWN, buff=0.1).move_to([0, -0.55, 0])
            msg.add_background_rectangle(color=BG, opacity=0.9, buff=0.18)
            self.play(FadeIn(msg, scale=1.05), run_time=0.3 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class C03_Principle(VScene):
    def construct(self):
        hdr = self.header(2, "The principle")
        titles = split_titles()
        self.play(FadeIn(titles), run_time=0.6)
        with self.voice("c_prin_1") as d:
            yb = 0.9
            wall_l = VGroup(Rectangle(width=0.25, height=1.6).set_fill(FAINT, 1).set_stroke(width=0).move_to([-6.45, yb, 0]))
            bar_l = Rectangle(width=4.2, height=0.45).set_fill("#9AA7B8", 1).set_stroke(WHITE, 1, 0.5)
            bar_l.move_to([-6.33 + 2.1, yb, 0])
            walls_r = VGroup(*[Rectangle(width=0.25, height=1.6).set_fill(FAINT, 1).set_stroke(width=0).move_to([x, yb, 0]) for x in (0.65, 5.1)])
            bar_r = Rectangle(width=5.1 - 0.65 - 0.25, height=0.45).set_fill("#9AA7B8", 1).set_stroke(WHITE, 1, 0.5).move_to([2.875, yb, 0])
            self.play(FadeIn(wall_l), FadeIn(bar_l), FadeIn(walls_r), FadeIn(bar_r), run_time=0.1 * d)
            hot = temp_color(85)
            ext = 0.75
            self.play(bar_l.animate.set_fill(hot).stretch_to_fit_width(4.2 + ext).align_to(bar_l, LEFT),
                      bar_r.animate.set_fill(hot), run_time=0.25 * d)
            dim = DoubleArrow([-2.13, yb + 0.5, 0], [-2.13 + ext, yb + 0.5, 0], buff=0, color=FREE_C, stroke_width=3, tip_length=0.1)
            el = VGroup(M(r"\Delta L = \alpha\, L\, \Delta T", 34, FREE_C), M(r"\sigma = 0", 34, INK)).arrange(DOWN, buff=0.18).move_to([-3.55, -0.6, 0])
            comp = VGroup(arrow([1.4, yb + 0.55, 0], [2.0, yb + 0.55, 0], REST_C, 5, 0.14),
                          arrow([4.35, yb + 0.55, 0], [3.75, yb + 0.55, 0], REST_C, 5, 0.14))
            er = VGroup(M(r"\Delta L = 0", 34, INK), M(r"\sigma = -E\,\alpha\,\Delta T", 34, REST_C)).arrange(DOWN, buff=0.18).move_to([3.55, -0.6, 0])
            self.play(GrowFromCenter(dim), FadeIn(el), run_time=0.2 * d)
            self.play(LaggedStart(*[GrowArrow(a) for a in comp], lag_ratio=0.2), FadeIn(er), run_time=0.2 * d)
            per = T("≈ 2.5 MPa of compression per °C in steel", 20, REST_C).next_to(er, DOWN, buff=0.3)
            coin = T("movement  ⇄  force", 26, ACCENT, weight=BOLD).move_to([0, -2.6, 0])
            self.play(FadeIn(per), FadeIn(coin, scale=1.1), run_time=0.15 * d)
        self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.7)
        # springs ----------------------------------------------------------
        rig = SpringRig(self)
        with self.voice("c_prin_2") as d:
            self.play(FadeIn(rig.ground), FadeIn(rig.glbl), FadeIn(rig.plate), FadeIn(rig.plabel), run_time=0.1 * d)
            self.add(rig.springs)
            self.play(FadeIn(rig.springs), run_time=0.1 * d)
            # stiffness bars
            ks = [("13-3/8", SF["13-3/8"]["k_MN_per_m"]), ("9-5/8", SF["9-5/8"]["k_MN_per_m"]), ("tubing", SF["tubing"]["k_MN_per_m"])]
            ttl = T("axial stiffness  k = EA / L   [MN/m]", 19, INK).move_to([3.6, 2.5, 0])
            sc = 0.9
            bars = VGroup()
            for i, (k, v) in enumerate(ks):
                yy = 1.75 - 0.55 * i
                b = Rectangle(width=max(v * sc, 0.04), height=0.3).set_fill(STR_COLORS[k], 1).set_stroke(width=0)
                b.move_to([1.6 + v * sc / 2, yy, 0])
                nm = T(STR_NAMES[k].split(" ")[0], 16, STR_COLORS[k], weight=BOLD).next_to([1.6, yy, 0], LEFT, buff=0.12)
                vl = T(f"{v:.2f}", 16, INK).next_to(b, RIGHT, buff=0.1)
                bars.add(VGroup(b, nm, vl))
            fb = Rectangle(width=5.0, height=0.42).set_fill("#7FA8B8", 1).set_stroke(width=0).move_to([1.6 + 2.5, 0.05, 0])
            brk = VGroup(*[Line([x - 0.08, -0.2, 0], [x + 0.08, 0.3, 0], stroke_color=BG, stroke_width=6) for x in (5.0, 5.15)])
            fn = T("foundation", 16, "#7FA8B8", weight=BOLD).next_to([1.6, 0.05, 0], LEFT, buff=0.12)
            fv = T("≈ 240  (off the scale)", 16, INK, weight=BOLD).next_to(fb, DOWN, buff=0.1).align_to(fb, RIGHT)
            self.play(FadeIn(ttl), LaggedStart(*[AnimationGroup(GrowFromEdge(b_[0], LEFT), FadeIn(b_[1]), FadeIn(b_[2])) for b_ in bars], lag_ratio=0.25),
                      run_time=0.35 * d)
            self.play(GrowFromEdge(fb, LEFT), FadeIn(brk), FadeIn(fn), FadeIn(fv), run_time=0.25 * d)
            ratio = T("> 100 × stiffer", 24, ACCENT, weight=BOLD).move_to([3.6, -0.9, 0])
            self.play(FadeIn(ratio, scale=1.1), run_time=0.1 * d)
        with self.voice("c_prin_3") as d:
            self.play(FadeOut(VGroup(bars, fb, brk, fn, fv, ttl)), ratio.animate.move_to([3.6, 2.45, 0]), run_time=0.6)
            gtitle = T("share of the fully restrained load the inner strings\nalready carry with a FREE wellhead", 18, INK).move_to([3.6, 1.4, 0])
            gauges = VGroup()
            for i, k in enumerate(("13-3/8", "9-5/8", "tubing")):
                f = SF[k]["dFa_MN"] / SF[k]["full_restraint_force_MN"]
                yy = 0.35 - 0.6 * i
                bg_ = Rectangle(width=3.6, height=0.32).set_fill(GRID, 1).set_stroke(width=0).move_to([4.0, yy, 0])
                fg = Rectangle(width=3.6 * f, height=0.32).set_fill(STR_COLORS[k], 1).set_stroke(width=0)
                fg.align_to(bg_, LEFT).set_y(yy)
                nm = T(STR_NAMES[k].split(" ")[0], 17, STR_COLORS[k], weight=BOLD).next_to(bg_, LEFT, buff=0.15)
                pc = T(f"{100 * f:.0f} %", 18, INK, weight=BOLD).next_to(bg_, RIGHT, buff=0.12)
                gauges.add(VGroup(bg_, fg, nm, pc))
            self.play(FadeIn(gtitle), *[FadeIn(g_[0]) for g_ in gauges], *[FadeIn(g_[2]) for g_ in gauges], run_time=0.15 * d)
            self.play(LaggedStart(*[GrowFromEdge(g_[1], LEFT) for g_ in gauges], lag_ratio=0.2),
                      LaggedStart(*[FadeIn(g_[3]) for g_ in gauges], lag_ratio=0.2), run_time=0.35 * d)
            held = T("already held back", 22, ACCENT, weight=BOLD).move_to([3.6, -1.85, 0])
            self.play(FadeIn(held), run_time=0.1 * d)
        rig.springs.clear_updaters()
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
