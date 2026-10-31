"""Scenes 4-5: temperature and thermal strain."""
from common import *  # noqa: F401,F403

TH = RES["base_free"]["profiles"]["thermal"]
SNAP = RES["thermal_snapshots"]
SHOES = {"tubing": 3100, "9-5/8": 3250, "13-3/8": 1800, "20": 700, "30": 80}


def depth_axes(x_max=130, z_max=3400, xl=5.0, yl=6.0, xstep=20, center=(-3.55, -0.45), xlabel="Temperature  [°C]"):
    ax = Axes(x_range=[0, x_max, xstep], y_range=[-z_max, 0, 500], x_length=xl, y_length=yl,
              tips=False, axis_config=dict(color=MUTED, stroke_width=2))
    ax.move_to([center[0], center[1], 0])
    grid = VGroup()
    for x in range(0, x_max + 1, xstep):
        grid.add(Line(ax.c2p(x, 0), ax.c2p(x, -z_max), stroke_color=GRID, stroke_width=1))
    for z in range(0, z_max + 1, 500):
        grid.add(Line(ax.c2p(0, -z), ax.c2p(x_max, -z), stroke_color=GRID, stroke_width=1))
    xl_ = VGroup(*[T(f"{x}", 16, MUTED).next_to(ax.c2p(x, 0), UP, buff=0.1) for x in range(0, x_max + 1, xstep)])
    yl_ = VGroup(*[T(f"{z:,}", 16, MUTED).next_to(ax.c2p(0, -z), LEFT, buff=0.1) for z in range(0, z_max + 1, 500)])
    xt = T(xlabel, 18, INK).next_to(xl_, UP, buff=0.12)
    yt = T("depth below seabed  [m]", 18, INK).rotate(PI / 2).next_to(yl_, LEFT, buff=0.15)
    return ax, VGroup(grid, ax, xl_, yl_, xt, yt), xt


def curve(ax, xs, zs, color, sw=4):
    pts = [ax.c2p(x, -z) for x, z in zip(xs, zs)]
    return VMobject().set_points_as_corners(pts).set_stroke(color, sw)


class S04_Temperature(VScene):
    def construct(self):
        hdr = self.header(3, "Temperature")
        z = np.array(TH["z"])
        Tg = np.array(TH["Tg"])
        Tf = np.array(TH["Tf"])
        ax, axg, xt = depth_axes()
        geo = curve(ax, Tg, z, COLD, 5)
        geo_lbl = T("geotherm\n6 °C + 3.3 °C / 100 m", 18, COLD).move_to(ax.c2p(40, -2300))
        res_dot = Dot(ax.c2p(Tg[-1], -z[-1]), color=COLD, radius=0.07)
        res_lbl = T("reservoir ≈ 118 °C", 18, COLD).next_to(res_dot, LEFT, buff=0.15).shift(UP * 0.15)
        with self.voice("temp_1") as d:
            self.play(FadeIn(axg), run_time=1.5)
            self.play(Create(geo), run_time=0.4 * d)
            self.play(FadeIn(geo_lbl), FadeIn(res_dot, scale=2), FadeIn(res_lbl), run_time=1.2)
        with self.voice("temp_2") as d:
            c = card(6.2, 2.5).move_to([3.6, 1.2, 0])
            t1 = T("Reference (stress-free) state", 24, ACCENT, weight=BOLD)
            t2 = T("cement set at the geothermal temperature", 20, INK)
            eq = M(r"\Delta T(z) \;=\; T_{\mathrm{prod}}(z)\; -\; T_{\mathrm{ref}}(z)", 34, INK)
            t3 = T("every load comes from this change", 20, MUTED)
            g = VGroup(t1, t2, eq, t3).arrange(DOWN, buff=0.22).move_to(c)
            self.play(FadeIn(c), FadeIn(t1, shift=UP * 0.1), run_time=1.0)
            self.play(FadeIn(t2), Write(eq), run_time=0.35 * d)
            self.play(FadeIn(t3), Indicate(geo, color=ACCENT, scale_factor=1.0), run_time=1.5)
        self.play(FadeOut(VGroup(c, g)), run_time=0.6)
        with self.voice("temp_3") as d:
            zf = ValueTracker(z[-1])

            def flow_curve():
                m = z >= zf.get_value()
                if m.sum() < 2:
                    return VMobject()
                return curve(ax, Tf[m], z[m], HOT, 5)
            fc = always_redraw(flow_curve)
            oil = always_redraw(lambda: Dot(ax.c2p(np.interp(zf.get_value(), z, Tf), -zf.get_value()),
                                            radius=0.09, color=ACCENT).set_glow_factor(0.5) if hasattr(Dot, "set_glow_factor") else
                                Dot(ax.c2p(np.interp(zf.get_value(), z, Tf), -zf.get_value()), radius=0.09, color=ACCENT))
            rate = T("≈ 3,000 m³/d liquid\nflowing up the tubing", 20, HOT).move_to([3.4, -1.0, 0])
            self.add(fc, oil)
            self.play(FadeIn(rate), zf.animate.set_value(0), run_time=0.45 * d, rate_func=linear)
            fc.clear_updaters()
            oil.clear_updaters()
            whft = T("108 °C at the wellhead", 20, HOT, weight=BOLD)
            whft.move_to(ax.c2p(104, -470), aligned_edge=RIGHT)
            shade_pts = [ax.c2p(x, -zz) for x, zz in zip(Tf, z)] + [ax.c2p(x, -zz) for x, zz in zip(Tg[::-1], z[::-1])]
            shade = Polygon(*shade_pts, fill_color=HOT, fill_opacity=0.22, stroke_width=0)
            dt_arrow = DoubleArrow(ax.c2p(Tg[8], -80), ax.c2p(Tf[8], -80), buff=0, color=ACCENT, stroke_width=3, tip_length=0.14)
            dt_lbl = T("ΔT ≈ 100 °C", 22, ACCENT, weight=BOLD).move_to(ax.c2p(58, -230))
            dt_lbl2 = T("ΔT → 0 at the reservoir", 18, ACCENT).next_to(ax.c2p(120, -3250), RIGHT, buff=0.2)
            self.play(FadeIn(whft), FadeIn(shade), FadeOut(oil), run_time=1.2)
            self.play(GrowFromCenter(dt_arrow), FadeIn(dt_lbl), FadeIn(dt_lbl2), FadeOut(rate), run_time=1.5)
        # ---------------------------------------------------------- rings
        with self.voice("temp_4") as d:
            cx, cy = 3.85, 1.05
            sc = 4.3  # screen units per metre of radius
            T_at = {}
            snap = SNAP[-1]
            i1 = 1
            tg0 = snap["Tg"][i1]
            for k in ("tubing", "9-5/8", "13-3/8", "20", "30"):
                T_at[k] = snap[k][i1] - tg0
            T_at["fluid"] = snap["Tf"][i1] - tg0
            layers = [  # (r_in, r_out, dT, kind)
                (0.0, 0.0621, T_at["fluid"], "fluid"), (0.0621, 0.0699, T_at["tubing"], "steel"),
                (0.0699, 0.1084, (T_at["tubing"] + T_at["9-5/8"]) / 2, "brine"), (0.1084, 0.1222, T_at["9-5/8"], "steel"),
                (0.1222, 0.1568, (T_at["9-5/8"] + T_at["13-3/8"]) / 2, "mud"), (0.1568, 0.1699, T_at["13-3/8"], "steel"),
                (0.1699, 0.2379, (T_at["13-3/8"] + T_at["20"]) / 2, "mud"), (0.2379, 0.2540, T_at["20"], "steel"),
                (0.2540, 0.3556, (T_at["20"] + T_at["30"]) / 2, "cement"), (0.3556, 0.3810, T_at["30"], "steel"),
                (0.3810, 0.4572, T_at["30"] - 5, "cement"),
            ]
            rings = VGroup()
            form = VGroup()
            r0f = 0.4572 * sc
            for jf in range(7):
                a_ = Annulus(inner_radius=r0f + 0.08 * jf, outer_radius=r0f + 0.08 * (jf + 1), fill_opacity=1, stroke_width=0)
                a_.set_fill(interpolate_color(temp_color(52 - 7 * jf), ManimColor(ROCK), 0.25 + 0.08 * jf), 1)
                form.add(a_.move_to([cx, cy, 0]))
            for ri, ro, dT, kind in layers:
                col = temp_color(dT)
                if kind == "fluid":
                    m = Circle(radius=ro * sc).set_fill(col, 1).set_stroke(width=0)
                else:
                    m = Annulus(inner_radius=ri * sc, outer_radius=ro * sc, fill_color=col, fill_opacity=1,
                                stroke_width=1.6 if kind == "steel" else 0, stroke_color=WHITE)
                    if kind != "steel":
                        m.set_fill(interpolate_color(col, ManimColor(BG), 0.25), 1)
                m.move_to([cx, cy, 0])
                rings.add(m)
            ttl = T("cross-section just below the seabed", 18, MUTED).move_to([cx, cy + 2.62, 0])
            self.play(FadeIn(ttl), LaggedStart(*[GrowFromCenter(r_) for r_ in rings], lag_ratio=0.08),
                      FadeIn(form), run_time=0.22 * d)
            rays = VGroup(*[arrow([cx + 0.33 * math.cos(a), cy + 0.33 * math.sin(a), 0],
                                  [cx + 2.35 * math.cos(a), cy + 2.35 * math.sin(a), 0], HOT, 4, 0.16)
                            for a in np.linspace(0, TAU, 9)[:-1] + 0.2])
            self.play(LaggedStart(*[GrowArrow(r_) for r_ in rays], lag_ratio=0.06), run_time=0.15 * d)
            # resistance budget
            Rs = [("tubing + A", 0.0204, "#5FA8D3"), ("B annulus", 0.0399, "#B0894F"), ("C annulus", 0.0539, "#8E6A43"),
                  ("cement + 30\"", 0.0921, CEMENT), ("formation", 0.2256, "#6E5641")]
            tot = sum(r[1] for r in Rs)
            L = 6.0
            x = 0.85
            ybar = -2.35
            bars = VGroup()
            lbls = VGroup()
            for i, (nm, r_, col) in enumerate(Rs):
                w = L * r_ / tot
                b = Rectangle(width=w, height=0.42).set_fill(col, 1).set_stroke(BG, 2).move_to([x + w / 2, ybar, 0])
                bars.add(b)
                pct = f"{100 * r_ / tot:.0f}%"
                if nm == "formation":
                    lb = T(f"formation  {pct}", 18, INK, weight=BOLD).move_to(b)
                else:
                    lb = T(nm, 14, MUTED).next_to(b, DOWN if i % 2 == 0 else UP, buff=0.08)
                lbls.add(lb)
                x += w
            btitle = T("thermal resistances in series (per metre of well)", 18, INK).move_to([3.85, -1.65, 0])
            self.play(FadeIn(btitle), LaggedStart(*[GrowFromEdge(b, LEFT) for b in bars], lag_ratio=0.15), run_time=0.25 * d)
            self.play(FadeIn(lbls), Circumscribe(bars[-1], color=ACCENT), run_time=0.2 * d)
        with self.voice("temp_5") as d:
            self.play(FadeOut(rays), run_time=0.5)
            items = [("tubing", 0.066, "+101 °C"), ("9-5/8", 0.115, "+97 °C"), ("13-3/8", 0.163, "+87 °C"),
                     ("20", 0.246, "+75 °C"), ("30", 0.368, "+61 °C")]
            tags = VGroup()
            for j, (k, r_, txt) in enumerate(items):
                ang = math.radians(150 + 16 * j) if j % 2 == 0 else math.radians(30 - 16 * j)
                ang = [math.radians(a) for a in (128, 52, 155, 25, 205)][j]
                p0 = np.array([cx + r_ * sc * math.cos(ang), cy + r_ * sc * math.sin(ang), 0])
                p1 = np.array([cx + 2.55 * math.cos(ang), cy + 2.45 * math.sin(ang), 0])
                ln = Line(p0, p1, stroke_color=STR_COLORS[k], stroke_width=2)
                dt_ = Dot(p0, radius=0.04, color=STR_COLORS[k])
                lab = VGroup(T(STR_NAMES[k].split(" ")[0], 16, STR_COLORS[k], weight=BOLD), T(txt, 20, INK, weight=BOLD)).arrange(DOWN, buff=0.04)
                lab.next_to(p1, RIGHT if math.cos(ang) > 0 else LEFT, buff=0.08)
                tags.add(VGroup(ln, dt_, lab))
            self.play(LaggedStart(*[FadeIn(t_) for t_ in tags], lag_ratio=0.35), run_time=0.7 * d)
        with self.voice("temp_6") as d:
            # switch plot to dT profiles per string
            self.play(FadeOut(VGroup(geo, geo_lbl, res_dot, res_lbl, fc, whft, shade, dt_arrow, dt_lbl, dt_lbl2)),
                      FadeOut(VGroup(rings, form, tags, ttl, bars, lbls, btitle)), run_time=0.8)
            xt2 = T("temperature rise  ΔT  [°C]", 18, INK).move_to(xt)
            self.play(Transform(xt, xt2), run_time=0.6)
            dts = VGroup()
            for k in ("30", "20", "13-3/8", "9-5/8", "tubing"):
                zz = np.array(TH[k]["z"])
                TT = np.array(TH[k]["T"]) - np.interp(zz, z, Tg)
                m = zz <= SHOES[k]
                dts.add(curve(ax, TT[m], zz[m], STR_COLORS[k], 4))
            self.play(LaggedStart(*[Create(c_) for c_ in dts], lag_ratio=0.2), run_time=0.3 * d)
            # heat-up inset (log time)
            ins = Axes(x_range=[0, 4, 1], y_range=[0, 110, 20], x_length=5.0, y_length=3.4, tips=False,
                       axis_config=dict(color=MUTED, stroke_width=2)).move_to([3.7, 0.2, 0])
            tvals = [s["t_h"] for s in SNAP]
            xlab = VGroup(*[T(t_, 15, MUTED).next_to(ins.c2p(math.log10(v), 0), DOWN, buff=0.1)
                            for t_, v in [("1 h", 1), ("1 day", 24), ("1 week", 168), ("1 month", 720), ("1 year", 8760)]])
            ylab = VGroup(*[T(f"{v}", 15, MUTED).next_to(ins.c2p(0, v), LEFT, buff=0.08) for v in range(0, 101, 20)])
            ittl = T("ΔT just below the seabed vs. time", 18, INK).next_to(ins, UP, buff=0.25)
            lines = VGroup()
            for k in ("tubing", "9-5/8", "13-3/8", "20", "30"):
                pts = [ins.c2p(math.log10(s_["t_h"]), s_[k][1] - s_["Tg"][1]) for s_ in SNAP]
                lines.add(VMobject().set_points_smoothly(pts).set_stroke(STR_COLORS[k], 4))
            legend = VGroup(*[VGroup(Line(ORIGIN, RIGHT * 0.3, stroke_color=STR_COLORS[k], stroke_width=4),
                                     T(STR_NAMES[k], 15, INK)).arrange(RIGHT, buff=0.1)
                              for k in ("tubing", "9-5/8", "13-3/8", "20", "30")]).arrange(DOWN, aligned_edge=LEFT, buff=0.06)
            legend.next_to(ins, DOWN, buff=0.55).align_to(ins, LEFT)
            legend.arrange_in_grid(rows=2, buff=(0.3, 0.08), col_alignments="lll")
            legend.next_to(ins, DOWN, buff=0.55)
            self.play(FadeIn(VGroup(ins, xlab, ylab, ittl)), run_time=0.8)
            self.play(LaggedStart(*[Create(l_) for l_ in lines], lag_ratio=0.15), FadeIn(legend), run_time=0.3 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)


class S05_ThermalStrain(VScene):
    def construct(self):
        hdr = self.header(4, "Thermal strain → stress")
        s1338 = S("13-3/8", "base_free")
        # vertical casing column
        x0 = -4.7
        ytop, ybot = 1.9, -3.2
        wh = RoundedRectangle(corner_radius=0.06, width=2.2, height=0.45).set_fill("#8693A5", 1).set_stroke("#D0D8E2", 1.5)
        wh.move_to([x0, ytop + 0.22, 0])
        whl = T("wellhead", 16, INK).next_to(wh, LEFT, buff=0.15)
        pipe = Rectangle(width=0.42, height=ytop - ybot).set_fill(C1338, 1).set_stroke(WHITE, 1, opacity=0.5)
        pipe.move_to([x0, (ytop + ybot) / 2, 0])
        cem = VGroup(*[Rectangle(width=0.35, height=1.0).set_fill(CEMENT, 1).set_stroke(width=0).move_to([x0 + s * 0.39, ybot - 0.5, 0])
                       for s in (-1, 1)])
        cem_l = T("top of cement", 16, MUTED).next_to(cem, RIGHT, buff=0.12).shift(UP * 0.4)
        pipe_low = Rectangle(width=0.42, height=1.0).set_fill(C1338, 1).set_stroke(width=0).move_to([x0, ybot - 0.5, 0])
        len_lbl = T("1,300 m\nfree length", 18, C1338).next_to(pipe, LEFT, buff=0.35)
        self.add(pipe, pipe_low, cem, wh)
        self.play(FadeIn(whl), FadeIn(cem_l), FadeIn(len_lbl), run_time=0.8)

        eqs_x = 1.6
        with self.voice("strain_1") as d:
            e1 = M(r"\varepsilon_{th} = \alpha\,\Delta T", 44, INK)
            e1b = M(r"\alpha = 12.4\times10^{-6}\ /^{\circ}\mathrm{C}", 30, MUTED)
            g1 = VGroup(e1, e1b).arrange(DOWN, buff=0.18).move_to([eqs_x, 2.45, 0])
            self.play(Write(e1), FadeIn(e1b), run_time=0.15 * d)
            # heat the pipe (gradient: hotter at top)
            self.play(pipe.animate.set_fill(color=[temp_color(88), temp_color(50)]).set_sheen_direction(DOWN), run_time=0.12 * d)
            e2 = M(r"\delta_{free} = \alpha \int_0^{L} \Delta T\, dz = 12.4\times10^{-6}\times 71\,^{\circ}\mathrm{C}\times 1300\ \mathrm{m}", 30, INK)
            e2r = M(r"= 1.14\ \mathrm{m}", 40, ACCENT)
            g2 = VGroup(e2, e2r).arrange(DOWN, buff=0.15).move_to([eqs_x, 1.0, 0])
            ghost = pipe.copy().set_fill(opacity=0.25).set_stroke(C1338, 2, opacity=0.8)
            self.add(ghost)
            self.play(ghost.animate.shift(UP * 1.2), Write(e2), run_time=0.25 * d)
            grow = DoubleArrow([x0 + 0.65, ytop + 0.45, 0], [x0 + 0.65, ytop + 1.2 + 0.45, 0], buff=0, color=ACCENT, stroke_width=3, tip_length=0.12)
            gl = T("+1.14 m if free", 18, ACCENT, weight=BOLD).next_to(grow, RIGHT, buff=0.1)
            self.play(FadeIn(e2r), GrowFromCenter(grow), FadeIn(gl), run_time=0.12 * d)
            # bar chart free growth
            bars = VGroup()
            data = [("tubing", 2.15, '5½" tubing (3,100 m)'), ("9-5/8", 1.94, '9⅝" (2,550 m)'), ("13-3/8", 1.14, '13⅜" (1,300 m)')]
            for i, (k, v, nm) in enumerate(data):
                b = Rectangle(width=v * 1.6, height=0.3).set_fill(STR_COLORS[k], 1).set_stroke(width=0)
                b.move_to([0.3 + v * 0.8, -0.55 - 0.5 * i, 0])
                lb = T(nm, 16, INK).next_to(b, LEFT, buff=0.12)
                lb.align_to([0.15, 0, 0], RIGHT)
                vl = T(f"{v:.2f} m", 16, INK, weight=BOLD).next_to(b, RIGHT, buff=0.1)
                bars.add(VGroup(b, lb, vl))
            bt = T("free thermal growth of each free length", 18, MUTED).move_to([1.6, -0.05, 0])
            self.play(FadeIn(bt), LaggedStart(*[GrowFromEdge(b[0], LEFT) for b in bars], lag_ratio=0.2),
                      LaggedStart(*[FadeIn(VGroup(b[1], b[2])) for b in bars], lag_ratio=0.2), run_time=0.2 * d)
        with self.voice("strain_2") as d:
            locks = VGroup()
            for yy, txt in ((ytop + 0.05, "locked in the wellhead"), (ybot - 0.05, "locked in cement")):
                ic = VGroup(RoundedRectangle(corner_radius=0.05, width=0.36, height=0.28).set_fill(ACCENT, 1).set_stroke(width=0),
                            Arc(radius=0.12, start_angle=0, angle=PI).set_stroke(ACCENT, 4).shift(UP * 0.16))
                ic.move_to([x0 + 0.85, yy, 0])
                tl = T(txt, 16, ACCENT).next_to(ic, RIGHT, buff=0.12)
                locks.add(VGroup(ic, tl))
            self.play(FadeOut(VGroup(bars, bt)), FadeOut(gl), FadeOut(grow), run_time=0.6)
            self.play(LaggedStart(*[FadeIn(l_, scale=1.3) for l_ in locks], lag_ratio=0.3), run_time=0.15 * d)
            self.play(ghost.animate.shift(DOWN * 1.2).set_stroke(opacity=0).set_fill(opacity=0), FadeOut(cem_l), run_time=0.12 * d)
            self.remove(ghost)
            comp = VGroup(*[arrow([x0, ytop - 0.15 - 0.95 * i, 0], [x0, ytop - 0.15 - 0.95 * i - 0.5, 0], COMP, 6, 0.16) for i in range(5)],
                          *[arrow([x0, ybot + 0.15 + 0.95 * i, 0], [x0, ybot + 0.15 + 0.95 * i + 0.5, 0], COMP, 6, 0.16) for i in range(0)])
            pairs = VGroup()
            for yy in np.linspace(ytop - 0.55, ybot + 0.55, 5):
                pairs.add(arrow([x0, yy + 0.5, 0], [x0, yy + 0.04, 0], COMP, 7, 0.17),
                          arrow([x0, yy - 0.5, 0], [x0, yy - 0.04, 0], COMP, 7, 0.17))
            pairs.set_z_index(5)
            clbl = T("compression", 18, COMP, weight=BOLD).next_to(pipe, LEFT, buff=0.25)
            self.play(FadeOut(len_lbl), LaggedStart(*[GrowArrow(a) for a in pairs], lag_ratio=0.05), FadeIn(clbl), run_time=0.15 * d)
            e3 = M(r"\varepsilon_{total} = \frac{\sigma}{E} + \alpha\,\Delta T = 0", 40, INK)
            e4 = M(r"\Rightarrow\quad \sigma = -\,E\,\alpha\,\Delta T", 48, COMP)
            g3 = VGroup(e3, e4).arrange(DOWN, buff=0.3).move_to([eqs_x, -1.0, 0])
            self.play(Write(e3), run_time=0.15 * d)
            self.play(Write(e4), run_time=0.15 * d)
        with self.voice("strain_3") as d:
            self.play(FadeOut(VGroup(g1, g2)), g3.animate.scale(0.75).move_to([eqs_x, 2.4, 0]), run_time=0.8)
            e5 = M(r"E\,\alpha = 207\ \mathrm{GPa}\times 12.4\times10^{-6} \approx 2.57\ \mathrm{MPa}/^{\circ}\mathrm{C}", 32, INK)
            e5.move_to([eqs_x, 1.1, 0])
            self.play(Write(e5), run_time=0.2 * d)
            # table
            hdrs = ["", "steel area", "per °C", "fully restrained"]
            rows = [('13⅜" 72 ppf', "134 cm²", "34.4 kN", "2.43 MN", C1338),
                    ('9⅝" 53.5 ppf', "100 cm²", "25.7 kN", "1.58 MN", C958)]
            cx = [-1.0, 1.0, 2.6, 4.4]
            tab = VGroup()
            yy = 0.15
            tab.add(*[T(h, 17, MUTED).move_to([cx[i], yy, 0]) for i, h in enumerate(hdrs)])
            for j, r_ in enumerate(rows):
                y_ = yy - 0.6 - 0.55 * j
                tab.add(T(r_[0], 19, r_[4], weight=BOLD).move_to([cx[0], y_, 0]))
                for i in (1, 2, 3):
                    tab.add(T(r_[i], 19, INK, weight=BOLD if i == 3 else NORMAL).move_to([cx[i], y_, 0]))
            line = Line([-2.2, yy - 0.28, 0], [5.5, yy - 0.28, 0], stroke_color=GRID)
            self.play(FadeIn(tab[:4]), Create(line), run_time=0.8)
            self.play(LaggedStart(*[FadeIn(m) for m in tab[4:]], lag_ratio=0.08), run_time=0.35 * d)
            note = T("F = E · A · α · ΔT_avg   (ΔT_avg: 71 °C and 61 °C over the free lengths)", 16, MUTED).move_to([1.6, -1.9, 0])
            self.play(FadeIn(note), Circumscribe(tab[-1], color=COMP), Circumscribe(tab[-5], color=COMP), run_time=0.2 * d)
        self.play(*[FadeOut(m) for m in self.mobjects], run_time=0.8)
