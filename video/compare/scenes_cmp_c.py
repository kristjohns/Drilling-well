"""Comparison video, scenes 6-7: inner strings and scoreboard."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cmp_common import *  # noqa: F401,F403,E402
from scenes_d import force_axes, fcurve  # noqa: E402


def pipe_pair(z, Fe_f, Fe_r, Fh, zmax, y_top, y_bot, xs, HW, CL, color, outer_color, base_pitch, amp_t):
    """Two buckled pipes (free, restrained) whose buckled zones follow their F_eff profiles."""
    def make(xc, Fe):
        Fe = np.array(Fe)
        Fcmax = max(-Fe.min(), 1.0)

        def ap(s):
            Fc = -np.interp(s * zmax, z, Fe)
            return float(np.clip((Fc - Fh) / 0.2e6, 0, 1))

        def pp(s):
            Fc = -np.interp(s * zmax, z, Fe)
            return math.sqrt(Fcmax / max(Fc, 0.25e6))
        return buckled_pipe(xc, y_top, y_bot, HW, color, CL * amp_t.get_value(), base_pitch, mode="helix", n=200,
                            amp_profile=ap, pitch_profile=pp)
    walls = VGroup()
    for xc in xs:
        for s_ in (-1, 1):
            walls.add(Line([xc + s_ * (HW + CL + 0.03), y_top, 0], [xc + s_ * (HW + CL + 0.03), y_bot, 0], stroke_color=outer_color, stroke_width=4))
    pf = always_redraw(lambda: make(xs[0], Fe_f))
    pr = always_redraw(lambda: make(xs[1], Fe_r))
    return walls, pf, pr


class C06_InnerStrings(VScene):
    def construct(self):
        hdr = self.header(5, "Inner casings and buckling")
        # ---------------------------------------------------------------- 13-3/8
        P0 = RES["base_free"]["profiles"]["13-3/8"]
        P1 = RES["base_restrained"]["profiles"]["13-3/8"]
        z = np.array(P1["z"])
        ax, axg = force_axes(1300, (-3.35, -0.75), xl=5.4, yl=5.3)
        ttl = T('13⅜" intermediate  ·  free length 0 – 1,300 m', 19, C1338, weight=BOLD).move_to([-3.35, 3.05, 0])
        zero = Line(ax.c2p(0, 0), ax.c2p(0, -1300), stroke_color=INK, stroke_width=2)
        y_top, y_bot = ax.c2p(0, 0)[1], ax.c2p(0, -1300)[1]
        xs = (2.35, 5.35)
        amp = ValueTracker(0.0)
        walls, pf, pr = pipe_pair(z, P0["Fe"], P1["Fe"], P1["Fh"], 1300, y_top, y_bot, xs, 0.2, 0.16, C1338, C20, 1.7, amp)
        heads = VGroup(T("FREE", 18, FREE_C, weight=BOLD).move_to([xs[0], y_top + 0.3, 0]),
                       T("RESTRAINED", 18, REST_C, weight=BOLD).move_to([xs[1], y_top + 0.3, 0]))
        with self.voice("c_inn_1") as d:
            self.play(FadeIn(axg), FadeIn(ttl), Create(zero), run_time=0.15 * d)
            c_pre = fcurve(ax, z, P1["Fe_pre"], MUTED, 4)
            lpre = T("before\nproduction", 14, MUTED).next_to(ax.c2p(P1["Fe_pre"][40] / 1e6, -400), RIGHT, buff=0.1)
            self.play(Create(c_pre), FadeIn(lpre), run_time=0.15 * d)
            cf = fcurve(ax, z, P0["Fe"], FREE_C, 5)
            cr = fcurve(ax, z, P1["Fe"], REST_C, 5)
            self.play(TransformFromCopy(c_pre, cf), run_time=0.2 * d)
            self.play(TransformFromCopy(c_pre, cr), run_time=0.2 * d)
            vf = T(f"free:  +{-SF['13-3/8']['dFa_MN']:.2f} MN", 17, FREE_C, weight=BOLD)
            vr = T(f"restrained:  +{-SR['13-3/8']['dFa_MN']:.2f} MN  (+5 %)", 17, REST_C, weight=BOLD)
            vv = VGroup(T("added compression", 15, MUTED), vf, vr).arrange(DOWN, aligned_edge=LEFT, buff=0.08)
            vv.move_to(ax.c2p(-2.45, -1060), aligned_edge=LEFT)
            vv.add_background_rectangle(color=BG, opacity=0.8, buff=0.08)
            self.play(FadeIn(vv), run_time=0.15 * d)
        with self.voice("c_inn_2") as d:
            sh = Polygon(*[ax.c2p(min(f, 0) / 1e6, -zz) for f, zz in zip(P1["Fe"], z)], ax.c2p(0, -1300), ax.c2p(0, 0),
                         fill_color=REST_C, fill_opacity=0.12, stroke_width=0)
            self.play(FadeIn(sh), FadeIn(walls), FadeIn(heads), run_time=0.15 * d)
            self.add(pf, pr)
            self.play(amp.animate.set_value(1.0), run_time=0.35 * d)
            pf.clear_updaters()
            pr.clear_updaters()
            def ro(S_, x_):
                return VGroup(T(f"pitch {S_['13-3/8']['min_pitch_m']:.0f} m  ·  σ_b {S_['13-3/8']['max_sig_b_MPa']:.0f} MPa", 13, INK),
                              T(f"contact {S_['13-3/8']['max_contact_kN_m']:.1f} kN/m", 13, INK)).arrange(DOWN, buff=0.03).move_to([x_, y_top + 0.72, 0])
            rf, rr = ro(SF, xs[0]), ro(SR, xs[1])
            both = T("helically buckled in BOTH cases", 20, ACCENT, weight=BOLD).move_to([3.85, 3.2, 0])
            self.play(FadeIn(rf), FadeIn(rr), FadeIn(both), run_time=0.25 * d)
        # ---------------------------------------------------------------- 9-5/8
        with self.voice("c_inn_3") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.8)
            Q0 = RES["base_free"]["profiles"]["9-5/8"]
            Q1 = RES["base_restrained"]["profiles"]["9-5/8"]
            z2 = np.array(Q1["z"])
            ax2, axg2 = force_axes(2550, (-3.35, -0.75), xl=5.4, yl=5.3)
            ttl2 = T('9⅝" production  ·  free length 0 – 2,550 m', 19, C958, weight=BOLD).move_to([-3.35, 3.05, 0])
            zero2 = Line(ax2.c2p(0, 0), ax2.c2p(0, -2550), stroke_color=INK, stroke_width=2)
            self.play(FadeIn(axg2), FadeIn(ttl2), Create(zero2), run_time=0.1 * d)
            cpre = fcurve(ax2, z2, Q1["Fe_pre"], MUTED, 4)
            cf2 = fcurve(ax2, z2, Q0["Fe"], FREE_C, 5)
            cr2 = fcurve(ax2, z2, Q1["Fe"], REST_C, 5)
            self.play(Create(cpre), Create(cf2), Create(cr2), run_time=0.15 * d)
            nf, nr = SF["9-5/8"]["buckled_from_m"], SR["9-5/8"]["buckled_from_m"]
            hf = DashedLine(ax2.c2p(-2.6, -nf), ax2.c2p(2.0, -nf), stroke_color=FREE_C, dash_length=0.07)
            hr = DashedLine(ax2.c2p(-2.6, -nr), ax2.c2p(2.0, -nr), stroke_color=REST_C, dash_length=0.07)
            lf = T(f"buckled below {nf:.0f} m", 14, FREE_C, weight=BOLD).next_to(ax2.c2p(-2.6, -nf), RIGHT, buff=0.08).shift(DOWN * 0.15)
            lr = T(f"buckled below {nr:.0f} m", 14, REST_C, weight=BOLD).next_to(ax2.c2p(-2.6, -nr), RIGHT, buff=0.08).shift(UP * 0.15)
            self.play(Create(hf), Create(hr), FadeIn(lf), FadeIn(lr), run_time=0.15 * d)
            y_top2, y_bot2 = ax2.c2p(0, 0)[1], ax2.c2p(0, -2550)[1]
            amp2 = ValueTracker(0.0)
            walls2, pf2, pr2 = pipe_pair(z2, Q0["Fe"], Q1["Fe"], Q1["Fh"], 2550, y_top2, y_bot2, xs, 0.15, 0.12, C958, C1338, 1.25, amp2)
            heads2 = VGroup(T("FREE", 18, FREE_C, weight=BOLD).move_to([xs[0], y_top2 + 0.3, 0]),
                            T("RESTRAINED", 18, REST_C, weight=BOLD).move_to([xs[1], y_top2 + 0.3, 0]))
            self.play(FadeIn(walls2), FadeIn(heads2), run_time=0.08 * d)
            self.add(pf2, pr2)
            self.play(amp2.animate.set_value(1.0), run_time=0.25 * d)
            pf2.clear_updaters()
            pr2.clear_updaters()
            mk = VGroup(*[DashedLine([x - 0.5, ax2.c2p(0, -n)[1], 0], [x + 0.5, ax2.c2p(0, -n)[1], 0], stroke_color=c, dash_length=0.05)
                          for x, n, c in ((xs[0], nf, FREE_C), (xs[1], nr, REST_C))])
            more = T(f"≈ {nf - nr:.0f} m more buckled pipe  ·  +3 % compression", 17, ACCENT, weight=BOLD).move_to([3.85, 3.05, 0])
            self.play(Create(mk), FadeIn(more), run_time=0.12 * d)
        # ---------------------------------------------------------------- why
        with self.voice("c_inn_4") as d:
            self.play(*[FadeOut(m) for m in self.mobjects if m not in hdr], run_time=0.8)
            sc = 9.0 / 1940
            rows = [("13-3/8", SF["13-3/8"]["free_thermal_elong_m"] * 1000), ("9-5/8", SF["9-5/8"]["free_thermal_elong_m"] * 1000),
                    ("tubing", SF["tubing"]["free_thermal_elong_m"] * 1000)]
            ttl3 = T("growth the inner strings want  vs.  what a free wellhead allows", 22, INK).move_to([0, 2.5, 0])
            self.play(FadeIn(ttl3), run_time=0.08 * d)
            grp = VGroup()
            x0 = -4.3
            for i, (k, v) in enumerate(rows):
                yy = 1.3 - 0.95 * i
                w = Rectangle(width=min(v, 2000) * sc * 0.85, height=0.36).set_fill(STR_COLORS[k], 0.3).set_stroke(STR_COLORS[k], 2)
                w.move_to([x0 + w.width / 2, yy, 0])
                g_ = Rectangle(width=61 * sc * 0.85, height=0.36).set_fill(FREE_C, 1).set_stroke(width=0)
                g_.move_to([x0 + g_.width / 2, yy, 0])
                nm = T(STR_NAMES[k].split(" ")[0], 17, STR_COLORS[k], weight=BOLD).next_to([x0, yy, 0], LEFT, buff=0.15)
                vl = T(f"wants ≈ {round(v, -1):,.0f} mm", 16, INK).next_to(w, RIGHT, buff=0.12)
                grp.add(VGroup(w, g_, nm, vl))
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[2]), GrowFromEdge(r_[0], LEFT), FadeIn(r_[3])) for r_ in grp], lag_ratio=0.2),
                      run_time=0.3 * d)
            lab = T("free wellhead: 61 mm", 17, FREE_C, weight=BOLD).next_to(grp[-1][1], DOWN, buff=0.2).align_to(grp[-1][1], LEFT)
            self.play(*[GrowFromEdge(r_[1], LEFT) for r_ in grp], FadeIn(lab), run_time=0.2 * d)
            concl = T("restraining it removes a relief they hardly had", 24, ACCENT, weight=BOLD).move_to([0, -2.6, 0])
            self.play(FadeIn(concl, shift=UP * 0.1), run_time=0.2 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class C07_Scoreboard(VScene):
    def construct(self):
        hdr = self.header(6, "Scoreboard")
        pk_f = CMP["base_free"]["s20_min"]["MPa"]
        pk_r = CMP["base_restrained"]["s20_min"]["MPa"]
        rows = [
            ("Wellhead growth", f"{SF['u_wh_mm']:.0f} mm", "0", "—", False),
            ('13⅜" added compression', f"{-SF['13-3/8']['dFa_MN']:.2f} MN", f"{-SR['13-3/8']['dFa_MN']:.2f} MN", "+5 %", False),
            ('9⅝" added compression', f"{-SF['9-5/8']['dFa_MN']:.2f} MN", f"{-SR['9-5/8']['dFa_MN']:.2f} MN", "+3 %", False),
            ('9⅝" buckled below', f"{SF['9-5/8']['buckled_from_m']:.0f} m", f"{SR['9-5/8']['buckled_from_m']:.0f} m", "+96 m of buckled pipe", False),
            ('13⅜" max von Mises', f"{SF['13-3/8']['max_vm_MPa']:.0f} MPa", f"{SR['13-3/8']['max_vm_MPa']:.0f} MPa", "39 % → 42 % of yield", False),
            ('13⅜" hanger uplift', f"{-SF['13-3/8']['Fa_top_MN']:.2f} MN", f"{-SR['13-3/8']['Fa_top_MN']:.2f} MN", "+13 %", False),
            ('30" stress at seabed', "+44 MPa", "−144 MPa", "−188 MPa", True),
            ('20" stress at seabed', "+8 MPa", "−180 MPa", "−188 MPa", True),
            ('20" peak, below conductor shoe', f"{pk_f:.0f} MPa".replace("-", "−"), f"≈ {pk_r:.0f} MPa".replace("-", "−"), "≈ 50 % → 81 % of yield", True),
            ("Restraint force", "0", f"{SR['R_MN']:.1f} MN", "≈ 2,000 tonnes", True),
        ]
        cx = [-6.6, -0.05, 2.25, 4.4]
        y0 = 2.55
        rh = 0.53
        head = VGroup(T("quantity", 17, MUTED).move_to([cx[0], y0, 0], aligned_edge=LEFT),
                      VGroup(up_icon(FREE_C, 0.6), T("free", 18, FREE_C, weight=BOLD)).arrange(RIGHT, buff=0.08).move_to([cx[1] + 0.5, y0, 0]),
                      VGroup(lock_icon(REST_C, 0.6), T("restrained", 18, REST_C, weight=BOLD)).arrange(RIGHT, buff=0.08).move_to([cx[2] + 0.75, y0, 0]),
                      T("change", 17, MUTED).move_to([cx[3], y0, 0], aligned_edge=LEFT))
        rule = Line([-6.7, y0 - 0.28, 0], [6.9, y0 - 0.28, 0], stroke_color=GRID, stroke_width=2)
        R = []
        for i, (q, a, b, c, big) in enumerate(rows):
            yy = y0 - 0.62 - rh * i
            band_ = Rectangle(width=13.6, height=rh - 0.06).set_fill(REST_C if big else PANEL, 0.10 if big else 0.55).set_stroke(width=0).move_to([0.1, yy, 0])
            r_ = VGroup(band_, T(q, 18, INK).move_to([cx[0], yy, 0], aligned_edge=LEFT),
                        T(a, 18, FREE_C, weight=BOLD).move_to([cx[1] + 0.5, yy, 0]),
                        T(b, 18, REST_C, weight=BOLD).move_to([cx[2] + 0.75, yy, 0]),
                        T(c, 16, INK if big else MUTED, weight=BOLD if big else NORMAL).move_to([cx[3], yy, 0], aligned_edge=LEFT))
            R.append(r_)
        with self.voice("c_sc_1") as d:
            self.play(FadeIn(head), Create(rule), run_time=0.8 * d)
        with self.voice("c_sc_2") as d:
            gi = T("inner casings", 15, MUTED).rotate(PI / 2).move_to([-7.0, (R[0].get_y() + R[5].get_y()) / 2, 0])
            self.play(LaggedStart(*[FadeIn(r_, shift=RIGHT * 0.15) for r_ in R[:6]], lag_ratio=0.45), FadeIn(gi), run_time=0.75 * d)
            ok = T("barely moves", 22, GOOD, weight=BOLD).next_to(R[5], DOWN, buff=0.05).align_to(R[5][4], LEFT).shift(UP * 0.0)
        with self.voice("c_sc_3") as d:
            gf = T("foundation + restraint", 15, REST_C).rotate(PI / 2).move_to([-7.0, (R[6].get_y() + R[9].get_y()) / 2, 0])
            self.play(LaggedStart(*[FadeIn(r_, shift=RIGHT * 0.15) for r_ in R[6:]], lag_ratio=0.4), FadeIn(gf), run_time=0.6 * d)
            box = SurroundingRectangle(VGroup(*R[6:]), color=REST_C, buff=0.06, corner_radius=0.08, stroke_width=3)
            self.play(Create(box), run_time=0.25 * d)
        self.wait(1.0)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
