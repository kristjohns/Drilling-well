"""Comparison video, scenes 8-10: partial restraint & cycling, uncemented 20", conclusion."""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cmp_common import *  # noqa: F401,F403,E402


class C08_Partial(VScene):
    def construct(self):
        hdr = self.header(7, "Partial restraint and load cycles")
        ax = Axes(x_range=[0, 65, 10], y_range=[0, 22, 5], x_length=5.6, y_length=4.4, tips=False,
                  axis_config=dict(color=MUTED, stroke_width=2)).move_to([-3.3, -0.2, 0])
        xl = VGroup(*[T(f"{v}", 14, MUTED).next_to(ax.c2p(v, 0), DOWN, buff=0.08) for v in range(0, 61, 10)])
        yl = VGroup(*[T(f"{v}", 14, MUTED).next_to(ax.c2p(0, v), LEFT, buff=0.08) for v in range(0, 21, 5)])
        grid = VGroup(*[Line(ax.c2p(0, v), ax.c2p(65, v), stroke_color=GRID, stroke_width=1) for v in range(5, 21, 5)],
                      *[Line(ax.c2p(v, 0), ax.c2p(v, 22), stroke_color=GRID, stroke_width=1) for v in range(10, 61, 10)])
        xt = T("wellhead growth allowed  [mm]", 17, INK).next_to(xl, DOWN, buff=0.15)
        yt = T("restraint force  [MN]", 17, INK).next_to(ax, UP, buff=0.15).align_to(ax, LEFT)
        pts = sorted([(s_["u_wh_mm"], s_["R_MN"]) for s_ in SWEEP])
        cv = VMobject().set_points_smoothly([ax.c2p(u, r) for u, r in pts]).set_stroke(color=[REST_C, FREE_C], width=6)
        cv.set_sheen_direction(RIGHT)
        pf = Dot(ax.c2p(pts[-1][0], pts[-1][1]), radius=0.11, color=FREE_C)
        pr = Dot(ax.c2p(pts[0][0], pts[0][1]), radius=0.11, color=REST_C)
        lf = T("FREE\n61 mm, 0 MN", 16, FREE_C, weight=BOLD).next_to(pf, UP, buff=0.35).shift(LEFT * 0.35)
        lr = T("RESTRAINED\n0 mm, 19.5 MN", 16, REST_C, weight=BOLD).next_to(pr, RIGHT, buff=0.15).shift(UP * 0.15)
        with self.voice("c_part_1") as d:
            self.play(FadeIn(VGroup(grid, ax, xl, yl, xt, yt)), run_time=0.1 * d)
            self.play(FadeIn(pf, scale=2), FadeIn(lf), FadeIn(pr, scale=2), FadeIn(lr), run_time=0.15 * d)
            self.play(Create(cv), run_time=0.2 * d)
            half = [s_ for s_ in SWEEP if abs(s_["k_restraint"] - 3e8) < 1][0]
            hp = ax.c2p(half["u_wh_mm"], half["R_MN"])
            hl = VGroup(DashedLine(ax.c2p(half["u_wh_mm"], 0), hp, stroke_color=ACCENT, dash_length=0.06),
                        DashedLine(ax.c2p(0, half["R_MN"]), hp, stroke_color=ACCENT, dash_length=0.06), Dot(hp, radius=0.09, color=ACCENT))
            ht = T(f"half the growth ({half['u_wh_mm']:.0f} mm)\nstill costs {half['R_MN']:.1f} MN", 16, ACCENT, weight=BOLD).next_to(hp, UR, buff=0.12)
            self.play(Create(hl), FadeIn(ht), run_time=0.2 * d)
            slope = T("≈ 0.32 MN per mm taken away", 19, INK, weight=BOLD).move_to([-3.3, -3.3, 0])
            self.play(FadeIn(slope), run_time=0.15 * d)
        # --------------------------------------------- cycles (schematic)
        with self.voice("c_part_2") as d:
            tgrid = np.linspace(0, 14, 1401)
            vals = np.zeros_like(tgrid)
            for i_ in range(1, len(tgrid)):
                t_ = tgrid[i_]
                on = (t_ <= 4.0) or (5.0 <= t_ <= 9.0) or (t_ >= 10.0)
                tau = 0.9 if on else 0.25
                tgt = 1.0 if on else 0.0
                vals[i_] = vals[i_ - 1] + (tgt - vals[i_ - 1]) * (tgrid[i_] - tgrid[i_ - 1]) / tau

            def cyc(t):
                return float(np.interp(t, tgrid, vals))

            def panel(cy, color, lab, vmax, unit):
                a = Axes(x_range=[0, 14, 1], y_range=[0, vmax * 1.15, vmax], x_length=5.6, y_length=1.55, tips=False,
                         axis_config=dict(color=MUTED, stroke_width=2, include_ticks=False)).move_to([3.75, cy, 0])
                ts = np.linspace(0, 14, 400)
                c = VMobject().set_points_as_corners([a.c2p(t, vmax * cyc(t)) for t in ts]).set_stroke(color, 4)
                ttl = T(lab, 16, color, weight=BOLD).next_to(a, UP, buff=0.06).align_to(a, LEFT)
                vm = T(f"{vmax:g} {unit}", 13, MUTED).next_to(a.c2p(0, vmax), LEFT, buff=0.08)
                shut = VGroup(*[Rectangle(width=a.c2p(1, 0)[0] - a.c2p(0, 0)[0], height=1.55).set_fill(GRID, 0.5).set_stroke(width=0)
                                .move_to([a.c2p(x + 0.5, 0)[0], cy, 0]) for x in (4, 9)])
                return VGroup(shut, a, ttl, vm), c
            g1, c1 = panel(1.35, FREE_C, "free: the wellhead moves up and down", 61, "mm")
            g2, c2 = panel(-1.2, REST_C, "restrained: the force cycles on and off", 19.5, "MN")
            sl = VGroup(*[T("shut-in", 13, MUTED).move_to([g1[1].c2p(x + 0.5, 0)[0], -2.35, 0]) for x in (4, 9)])
            note = T("schematic: start-up / shut-in cycles", 14, FAINT).move_to([3.75, -2.75, 0])
            self.play(FadeIn(g1), FadeIn(g2), FadeIn(sl), FadeIn(note), run_time=0.15 * d)
            self.play(Create(c1), Create(c2), run_time=0.45 * d, rate_func=linear)
            life = T("… for the life of the well", 19, REST_C, weight=BOLD).move_to([3.75, -3.3, 0])
            self.play(FadeIn(life), run_time=0.15 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


def partial_schematic(xc, buck, pitch, label_side=LEFT):
    s = 0.62
    y0, y1 = 1.9, -2.35
    zmax = 260.0

    def yy(z):
        return y0 - (y0 - y1) * z / zmax
    R30o, R30i, H36 = 1.55 * s, 1.45 * s, 1.8 * s
    R20o, R20i, H26 = 0.95 * s, 0.88 * s, 1.2 * s
    g = VGroup()
    g.add(band(xc - 3.0, xc + 3.0, y0, y1 - 0.3, ROCK, 1))
    g.add(band(xc - H36, xc - R30o, yy(0), yy(80), CEMENT, 0.9), band(xc + R30o, xc + H36, yy(0), yy(80), CEMENT, 0.9))
    g.add(band(xc - R30o, xc - R30i, yy(0), yy(80), C30), band(xc + R30i, xc + R30o, yy(0), yy(80), C30))
    g.add(band(xc - H26, xc - R20o, yy(80), yy(zmax), "#120D09", 1), band(xc + R20o, xc + H26, yy(80), yy(zmax), "#120D09", 1))
    g.add(band(xc - R30i, xc - R20o, yy(0), yy(80), SEA_BOT, 0.9), band(xc + R20o, xc + R30i, yy(0), yy(80), SEA_BOT, 0.9))
    g.add(band(xc - H26, xc - R20o, yy(200), yy(zmax), CEMENT, 0.9), band(xc + R20o, xc + H26, yy(200), yy(zmax), CEMENT, 0.9))
    g.add(band(xc - R20o, xc - R20i, yy(200), yy(zmax), C20), band(xc + R20i, xc + R20o, yy(200), yy(zmax), C20))
    sb = Line([xc - 3.0, y0, 0], [xc + 3.0, y0, 0], stroke_color="#8C7A62", stroke_width=3)
    wh = RoundedRectangle(corner_radius=0.05, width=2.3, height=0.25).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.2).move_to([xc, y0 + 0.13, 0])
    g.add(sb, wh)
    straight = VGroup(band(xc - R20o, xc - R20i, yy(0), yy(200), C20), band(xc + R20i, xc + R20o, yy(0), yy(200), C20))
    amp = (R30i - R20o) * 0.95
    bk = buckled_pipe(xc, yy(0), yy(200), R20o, C20, amp, pitch, mode="helix", n=200,
                      amp_profile=lambda s_: min(1.0, s_ / 0.06, (1 - s_) / 0.06) * (1.0 if s_ < 0.4 else 0.5))
    ticks = VGroup(*[VGroup(Line([xc + 1.55, yy(z), 0], [xc + 1.7, yy(z), 0], stroke_color=MUTED),
                            T(f"{z} m", 13, MUTED).next_to([xc + 1.7, yy(z), 0], RIGHT, buff=0.05)) for z in (0, 80, 200)])
    return g, straight, bk, ticks, yy


class C09_Surface20(VScene):
    def construct(self):
        hdr = self.header(8, "When the 20\" is not cemented to the seabed")
        titles = split_titles(y=3.08)
        self.play(FadeIn(titles), run_time=0.6)
        gl, stl, bkl, tkl, yy = partial_schematic(-3.55, True, PF["20"]["min_pitch_m"] / 53 * 2.7)
        gr, str_, bkr, tkr, _ = partial_schematic(3.55, True, 2.7)
        frame = restraint_frame(3.55, yy(0), 1.3, yy(0) + 0.55)
        with self.voice("c_20_1") as d:
            self.play(FadeIn(gl), FadeIn(gr), FadeIn(tkl), FadeIn(tkr), run_time=0.25 * d)
            self.play(FadeIn(stl), FadeIn(str_), FadeIn(frame), run_time=0.2 * d)
            lab = VGroup(*[T('20" free length\n200 m (no cement)', 15, C20).move_to([x - 2.35, yy(140), 0]) for x in (-3.55, 3.55)])
            self.play(FadeIn(lab), run_time=0.2 * d)
        with self.voice("c_20_2") as d:
            self.play(FadeOut(stl), FadeIn(bkl), run_time=0.15 * d)
            nl = VGroup(T(f"growth {PF['u_wh_mm']:.0f} mm", 18, FREE_C, weight=BOLD),
                        T(f"20\" compression +{-PF['20']['dFa_MN']:.1f} MN", 18, INK),
                        T(f"σ_vM {PF['20']['max_vm_MPa']:.0f} MPa ({100 * PF['20']['max_vm_MPa'] / 379:.0f} % of yield)", 16, MUTED)
                        ).arrange(DOWN, buff=0.06).move_to([-3.55, -3.05, 0])
            self.play(FadeIn(nl), run_time=0.2 * d)
            self.play(FadeOut(str_), FadeIn(bkr), run_time=0.15 * d)
            nr = VGroup(T("growth 0 mm", 18, REST_C, weight=BOLD),
                        T(f"20\" compression +{-PR['20']['dFa_MN']:.1f} MN", 18, INK),
                        T(f"σ_vM {PR['20']['max_vm_MPa']:.0f} MPa ({100 * PR['20']['max_vm_MPa'] / 379:.0f} % of yield)", 16, REST_C)
                        ).arrange(DOWN, buff=0.06).move_to([3.55, -3.05, 0])
            jump = T(f"+{100 * (PR['20']['dFa_MN'] / PF['20']['dFa_MN'] - 1):.0f} %", 30, REST_C, weight=BOLD).move_to([0, -2.2, 0])
            jump.add_background_rectangle(color=BG, opacity=0.9, buff=0.1)
            self.play(FadeIn(nr), FadeIn(jump, scale=1.3), run_time=0.25 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class C10_Conclusion(VScene):
    def construct(self):
        hdr = self.header(9, "The real difference")
        titles = split_titles(y=2.75, divider=False)
        titles.shift(RIGHT * 1.05)
        self.play(FadeIn(titles), run_time=0.6)
        rows = [
            ("Inner casings", "buckle helically", "buckle helically,  +3–5 %", False),
            ("Conductor +\nsurface casing", "+44 / +8 MPa at seabed", "−144 / −180 MPa,\n≈ −300 locally", True),
            ("Wellhead /\nrestraint", "moves 61 mm", "19.5 MN, cycling\nwith every start-up", True),
        ]
        cards = VGroup()
        for i, (h, a, b, big) in enumerate(rows):
            yy = 1.65 - 1.25 * i
            c = card(13.4, 1.08).move_to([0.05, yy, 0])
            hh = T(h, 20, INK, weight=BOLD).move_to([-5.35, yy, 0])
            aa = T(a, 19, FREE_C, weight=BOLD).move_to([-0.95 + 0.45, yy, 0])
            bb = T(b, 19, REST_C, weight=BOLD).move_to([4.6, yy, 0])
            col = REST_C if big else GOOD
            tag = T("big difference" if big else "small difference", 13, col).next_to(c.get_corner(UR), DL, buff=0.08)
            cards.add(VGroup(c, hh, aa, bb, tag))
        for i, bid in enumerate(("c_con_1", "c_con_2")):
            with self.voice(bid) as d:
                grp = cards[:1] if i == 0 else cards[1:]
                self.play(LaggedStart(*[FadeIn(c_, shift=UP * 0.15) for c_ in grp], lag_ratio=0.4), run_time=0.5 * d)
        with self.voice("c_con_3") as d:
            fin = VGroup(T("Free or restrained, the thermal expansion is the same.", 28, INK, weight=BOLD),
                         VGroup(T("It shows up as", 28, INK, weight=BOLD), T("movement", 28, FREE_C, weight=BOLD),
                                T("— or as", 28, INK, weight=BOLD), T("force.", 28, REST_C, weight=BOLD)).arrange(RIGHT, buff=0.18)
                         ).arrange(DOWN, buff=0.2).move_to([0, -2.6, 0])
            self.play(FadeIn(fin[0], shift=UP * 0.15), run_time=0.35 * d)
            self.play(FadeIn(fin[1], shift=UP * 0.15), run_time=0.35 * d)
        self.wait(1.5)
        credit = T("Base well: 30\" / 20\" / 13⅜\" / 9⅝\" / 5½\", WHFT ≈ 108 °C, 1 year of production · details: report/REPORT.md", 14, FAINT)
        credit.to_edge(DOWN, buff=0.18)
        self.play(FadeIn(credit), run_time=0.6)
        self.wait(1.5)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1.0)
