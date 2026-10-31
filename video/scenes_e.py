"""Scenes 10-12: verdict, partially cemented 20", summary."""
from common import *  # noqa: F401,F403

SF = RES["base_free"]["summary"]
SR = RES["base_restrained"]["summary"]
PF = RES["partial20_free"]["summary"]
PR = RES["partial20_restrained"]["summary"]


class S10_Verdict(VScene):
    def construct(self):
        hdr = self.header(9, "Is it a failure?")
        ttl = T("combined (von Mises) stress ÷ yield strength", 22, INK).move_to([-2.1, 2.75, 0])
        leg = VGroup(VGroup(Square(0.2).set_fill(MUTED, 1).set_stroke(width=0), T("free wellhead", 15, MUTED)).arrange(RIGHT, buff=0.1),
                     VGroup(Square(0.2).set_fill(COMP, 1).set_stroke(width=0), T("restrained", 15, COMP)).arrange(RIGHT, buff=0.1)).arrange(RIGHT, buff=0.4)
        leg.next_to(ttl, DOWN, buff=0.15)
        L = 7.0
        x0 = -4.8
        items = [
            ("13-3/8", '13⅜" L-80', SF["13-3/8"]["max_vm_MPa"], SR["13-3/8"]["max_vm_MPa"], 552, "helically buckled, 0–1,300 m"),
            ("9-5/8", '9⅝" P-110', SF["9-5/8"]["max_vm_MPa"], SR["9-5/8"]["max_vm_MPa"], 758, "helically buckled below ~600 m"),
            ("tubing", '5½" 13Cr-80', SF["tubing"]["max_vm_MPa"], SR["tubing"]["max_vm_MPa"], 552, "helically buckled below ~1,150 m"),
            ("20", '20" K-55 *', abs(SF["foundation"]["comp_top_MPa"]["20"]), abs(SR["foundation"]["comp_top_MPa"]["20"]), 379, "cemented: no buckling"),
            ("30", '30" X-56 *', abs(SF["foundation"]["comp_top_MPa"]["30"]), abs(SR["foundation"]["comp_top_MPa"]["30"]), 386, "cemented: no buckling"),
        ]
        rows = VGroup()
        frame = VGroup()
        for x_ in (0, 0.25, 0.5, 0.75, 1.0):
            frame.add(Line([x0 + L * x_, 1.95, 0], [x0 + L * x_, -2.75, 0], stroke_color=GRID if x_ < 1 else ACCENT, stroke_width=1.5 if x_ < 1 else 3))
            frame.add(T(f"{int(100 * x_)} %", 14, MUTED if x_ < 1 else ACCENT).move_to([x0 + L * x_, -2.95, 0]))
        frame.add(T("yield", 15, ACCENT, weight=BOLD).move_to([x0 + L, 2.12, 0]))
        for i, (k, nm, vf, vr, fy, note) in enumerate(items):
            yy = 1.55 - 0.9 * i
            b1 = Rectangle(width=L * vf / fy, height=0.22).set_fill(MUTED, 1).set_stroke(width=0)
            b1.move_to([x0 + L * vf / fy / 2, yy + 0.13, 0])
            b2 = Rectangle(width=L * vr / fy, height=0.22).set_fill(COMP, 1).set_stroke(width=0)
            b2.move_to([x0 + L * vr / fy / 2, yy - 0.13, 0])
            lab = T(nm, 17, STR_COLORS[k], weight=BOLD).next_to([x0, yy, 0], LEFT, buff=0.15)
            v1 = T(f"{vf:.0f} MPa", 13, MUTED).next_to(b1, RIGHT, buff=0.08)
            v2 = T(f"{vr:.0f} MPa ({100 * vr / fy:.0f} %)", 14, COMP, weight=BOLD).next_to(b2, RIGHT, buff=0.08)
            nt = T(note, 14, FAINT).move_to([x0 + L + 0.2, yy, 0], aligned_edge=LEFT)
            rows.add(VGroup(lab, b1, b2, v1, v2, nt))
        foot = T("* conductor and surface casing: thermal axial stress change at the seabed only", 13, FAINT).move_to([-1.2, -3.35, 0])
        with self.voice("ver_1") as d:
            self.play(FadeIn(ttl), FadeIn(leg), FadeIn(frame), run_time=0.1 * d)
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[3])) for r_ in rows[:3]], lag_ratio=0.3),
                      run_time=0.3 * d)
            self.play(LaggedStart(*[AnimationGroup(GrowFromEdge(r_[2], LEFT), FadeIn(r_[4]), FadeIn(r_[5])) for r_ in rows[:3]], lag_ratio=0.3),
                      run_time=0.3 * d)
        with self.voice("ver_2") as d:
            self.play(LaggedStart(*[AnimationGroup(FadeIn(r_[0]), GrowFromEdge(r_[1], LEFT), FadeIn(r_[3]), GrowFromEdge(r_[2], LEFT),
                                                   FadeIn(r_[4]), FadeIn(r_[5])) for r_ in rows[3:]], lag_ratio=0.3),
                      FadeIn(foot), run_time=0.3 * d)
            verdict = VGroup(T("YES — it buckles.", 34, ACCENT, weight=BOLD),
                             T("helically · elastically · with or without restraint", 22, INK)).arrange(DOWN, buff=0.12)
            bx = card(verdict.width + 0.6, verdict.height + 0.4, PANEL, 0.96, ACCENT).move_to(verdict)
            vg = VGroup(bx, verdict).move_to([0, 0.0, 0])
            self.play(FadeIn(vg, scale=1.08), run_time=0.3 * d)
        with self.voice("ver_3") as d:
            self.play(FadeOut(VGroup(ttl, leg, frame, rows, foot)), vg.animate.scale(0.8).move_to([0, 2.55, 0]), run_time=0.8)
            checks = [
                ("Connections", "rated for compression + bending (premium vs. API)", C1338),
                ("Hanger lockdown", f"13⅜\" pushes up ≈ {abs(SR['13-3/8']['Fa_top_MN']):.1f} MN at the hanger", COMP),
                ("Wear", f"helix contact force ≈ {SR['13-3/8']['max_contact_kN_m']:.1f} kN/m on the outer string", ACCENT),
                ("Foundation + restraint", f"−144 / −180 MPa at the seabed, R ≈ {SR['R_MN']:.1f} MN", COMP),
            ]
            cg = VGroup()
            for i, (h, t_, col) in enumerate(checks):
                c = card(11.0, 0.8)
                ic = Circle(radius=0.16).set_stroke(col, 3).move_to(c.get_left() + RIGHT * 0.45)
                tick = T("!", 20, col, weight=BOLD).move_to(ic)
                hh = T(h, 21, col, weight=BOLD).next_to(ic, RIGHT, buff=0.3)
                tt = T(t_, 19, INK).move_to(c.get_left() + RIGHT * 4.3, aligned_edge=LEFT)
                cg.add(VGroup(c, ic, tick, hh, tt))
            cg.arrange(DOWN, buff=0.18).move_to([0, -0.75, 0])
            self.play(LaggedStart(*[FadeIn(c_, shift=RIGHT * 0.2) for c_ in cg], lag_ratio=0.5), run_time=0.75 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class S11_Partial20(VScene):
    def construct(self):
        hdr = self.header(10, "When the 20\" is not cemented to the seabed")
        # schematic of top 260 m, linear depth
        xc = -3.45
        y0, y1 = 2.2, -3.4
        zmax = 260.0

        def yy(z):
            return y0 - (y0 - y1) * z / zmax
        sea = Rectangle(width=config.frame_width, height=4.2 - y0).move_to([0, (4 + y0) / 2, 0]).set_fill(SEA_BOT, 1).set_stroke(width=0)
        rock = Rectangle(width=6.6, height=y0 - y1 + 0.6).move_to([xc, (y0 + y1 - 0.6) / 2, 0]).set_fill(ROCK, 1).set_stroke(width=0)
        self.add(sea, rock)
        self.bring_to_front(hdr)
        R30o, R30i, H36 = 1.55, 1.45, 1.8
        R20o, R20i, H26 = 0.95, 0.88, 1.2
        R13o = 0.62
        g = VGroup()
        g.add(band(xc - H36, xc - R30o, yy(0), yy(80), CEMENT, 0.9), band(xc + R30o, xc + H36, yy(0), yy(80), CEMENT, 0.9))
        g.add(band(xc - R30o, xc - R30i, yy(0), yy(80), C30), band(xc + R30i, xc + R30o, yy(0), yy(80), C30))
        g.add(band(xc - H26, xc - R20o, yy(80), yy(zmax), "#120D09", 1), band(xc + R20o, xc + H26, yy(80), yy(zmax), "#120D09", 1))
        g.add(band(xc - R30i, xc - R20o, yy(0), yy(80), SEA_BOT, 0.9), band(xc + R20o, xc + R30i, yy(0), yy(80), SEA_BOT, 0.9))
        g.add(band(xc - H26, xc - R20o, yy(200), yy(zmax), CEMENT, 0.9), band(xc + R20o, xc + H26, yy(200), yy(zmax), CEMENT, 0.9))
        inner = VGroup(band(xc - R20i, xc + R20i, yy(0), yy(zmax), MUD, 0.5),
                       band(xc - R13o, xc - R13o + 0.06, yy(0), yy(zmax), C1338), band(xc + R13o - 0.06, xc + R13o, yy(0), yy(zmax), C1338),
                       band(xc - 0.42, xc - 0.37, yy(0), yy(zmax), C958), band(xc + 0.37, xc + 0.42, yy(0), yy(zmax), C958))
        inner.set_opacity(0.45)
        s20_straight = VGroup(band(xc - R20o, xc - R20i, yy(0), yy(zmax), C20), band(xc + R20i, xc + R20o, yy(0), yy(zmax), C20))
        wh = RoundedRectangle(corner_radius=0.05, width=3.8, height=0.35).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5).move_to([xc, y0 + 0.17, 0])
        seabed = Line([xc - 3.3, y0, 0], [xc + 3.3, y0, 0], stroke_color="#8C7A62", stroke_width=3)
        dl = VGroup(*[VGroup(Line([xc + 2.0, yy(z), 0], [xc + 2.15, yy(z), 0], stroke_color=MUTED), T(f"{z} m", 15, MUTED).next_to([xc + 2.15, yy(z), 0], RIGHT, buff=0.06))
                      for z in (0, 80, 200)])
        lbls = VGroup(T('30" conductor', 15, C30).move_to([xc - 2.5, yy(40), 0]),
                      T('20" free\n(no cement)', 15, C20).move_to([xc - 2.4, yy(140), 0]),
                      T("20\" TOC", 15, MUTED).move_to([xc - 2.4, yy(225), 0]))
        with self.voice("p20_1") as d:
            self.play(FadeIn(g), FadeIn(inner), FadeIn(seabed), FadeIn(wh), FadeIn(dl), run_time=0.2 * d)
            self.play(FadeIn(s20_straight), FadeIn(lbls), run_time=0.2 * d)
            br = Line([xc + 1.3, yy(0), 0], [xc + 1.3, yy(200), 0], stroke_color=C20, stroke_width=6)
            brl = T("200 m free", 18, C20, weight=BOLD).rotate(PI / 2).next_to(br, LEFT, buff=0.08)
            self.play(Create(br), FadeIn(brl), run_time=0.25 * d)
        with self.voice("p20_2") as d:
            # bars
            ttl = T('20" added compression  [MN]', 20, INK).move_to([3.6, 2.6, 0])
            L = 3.8
            vmax = 4.8
            full = -PR["20"]["full_restraint_force_MN"]
            vf, vr = -PF["20"]["dFa_MN"], -PR["20"]["dFa_MN"]
            bars = VGroup()
            for i, (v, col, nm) in enumerate([(vf, MUTED, "free wellhead"), (vr, COMP, "restrained"), (full, FAINT, "fully restrained limit")]):
                b = Rectangle(width=L * v / vmax, height=0.38).set_fill(col, 1 if i < 2 else 0.4).set_stroke(width=0)
                b.move_to([1.5 + L * v / vmax / 2, 1.8 - 0.62 * i, 0])
                t1 = T(nm, 15, col).next_to(b, UP, buff=0.04).align_to(b, LEFT)
                t2 = T(f"{v:.1f}", 18, INK if i < 2 else MUTED, weight=BOLD).next_to(b, RIGHT, buff=0.1)
                bars.add(VGroup(b, t1, t2))
            self.play(FadeIn(ttl), GrowFromEdge(bars[0][0], LEFT), FadeIn(bars[0][1:]), run_time=0.35 * d)
            self.play(GrowFromEdge(bars[1][0], LEFT), FadeIn(bars[1][1:]), FadeIn(bars[2]), run_time=0.35 * d)
            jump = T(f"+{100 * (vr / vf - 1):.0f} %", 24, COMP, weight=BOLD).next_to(bars[1], RIGHT, buff=0.3)
            self.play(FadeIn(jump, scale=1.3), run_time=0.15 * d)
        with self.voice("p20_3") as d:
            yt, yb = yy(0), yy(200)
            half_w = (R20o - R20i) / 2 + 0.06
            amp = (R30i - R20o) * 0.95
            buck = buckled_pipe(xc, yt, yb, R20o, C20, amp, 2.9, mode="helix", n=240,
                                amp_profile=lambda s: min(1.0, s / 0.06, (1 - s) / 0.06) * (1.0 if s < 0.4 else 0.5))
            self.play(FadeOut(s20_straight), FadeOut(inner), FadeOut(br), FadeOut(brl), FadeIn(buck), run_time=0.3 * d)
            res = VGroup(
                T("helix pitch ≈ 53 m  (drawing not to scale)", 20, INK),
                T(f"bending stress ≈ {PR['20']['max_sig_b_MPa']:.0f} MPa", 20, INK),
                T(f"von Mises ≈ {PR['20']['max_vm_MPa']:.0f} MPa = {100 * PR['20']['max_vm_MPa'] / 379:.0f} % of K-55 yield", 20, ACCENT, weight=BOLD),
            ).arrange(DOWN, aligned_edge=LEFT, buff=0.18).move_to([3.4, -1.6, 0])
            self.play(LaggedStart(*[FadeIn(r_, shift=RIGHT * 0.2) for r_ in res], lag_ratio=0.35), run_time=0.5 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class S12_Summary(VScene):
    def construct(self):
        hdr = self.header(11, "Summary")
        pts = [
            ("sum_1", "Heat makes every casing want to grow", "Fixed at both ends → compression of ≈ 2.5 MPa per °C", HOT),
            ("sum_2", "Inner strings: already ~90–96 % restrained", "They buckle helically in their free sections either way; restraint adds only a few %", C1338),
            ("sum_3", "Restraint loads the foundation", "Conductor, surface casing, housing and restraint: tens of MN.  Mitigate with insulated tubing,\nsurface casing cemented to seabed, and design for the full restrained load", COMP),
        ]
        cards = VGroup()
        for i, (bid, h, t_, col) in enumerate(pts):
            c = card(12.4, 1.25)
            num = T(f"{i + 1}", 34, col, weight=BOLD).move_to(c.get_left() + RIGHT * 0.5)
            hh = T(h, 25, col, weight=BOLD)
            tt = T(t_, 18, INK)
            VGroup(hh, tt).arrange(DOWN, aligned_edge=LEFT, buff=0.1).next_to(num, RIGHT, buff=0.45)
            cards.add(VGroup(c, num, hh, tt))
        cards.arrange(DOWN, buff=0.22).move_to([0, 0.45, 0])
        for i, (bid, *_r) in enumerate(pts):
            with self.voice(bid) as d:
                self.play(FadeIn(cards[i], shift=UP * 0.2), run_time=0.15 * d)
        with self.voice("sum_4") as d:
            fin = VGroup(T("Thermal expansion is not optional.", 34, INK, weight=BOLD),
                         T("Stop the movement — and you get the force.", 34, ACCENT, weight=BOLD)).arrange(DOWN, buff=0.25)
            fin.move_to([0, -2.85, 0])
            self.play(cards.animate.shift(UP * 0.35), FadeIn(fin, shift=UP * 0.2), run_time=0.5 * d)
        self.wait(1.5)
        credit = T("Worked example: 1-D multi-string thermal–mechanical model · API 5CT casing · details in the accompanying report", 15, FAINT)
        credit.to_edge(DOWN, buff=0.2)
        self.play(FadeIn(credit), run_time=0.8)
        self.wait(2.0)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=1.0)
