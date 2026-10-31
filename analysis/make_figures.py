"""Static figures for the report (matplotlib).  Reads results/results.json."""
import json
import math
import os

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
R = json.load(open(os.path.join(HERE, "results", "results.json")))
OUT = os.path.join(os.path.dirname(HERE), "report", "figures")
os.makedirs(OUT, exist_ok=True)

# reference categorical palette, fixed order (validated light-mode slots 1-5)
SURF, INK, INK2, GRIDC = "#fcfcfb", "#0b0b0b", "#52514e", "#e4e3df"
SER = {"30": "#2a78d6", "9-5/8": "#eb6834", "20": "#1baf7a", "13-3/8": "#eda100", "tubing": "#e87ba4"}
NAME = {"30": '30" conductor', "20": '20" surface', "13-3/8": '13-3/8" intermediate',
        "9-5/8": '9-5/8" production', "tubing": '5-1/2" tubing'}
FREE, RESTR, PRE = "#2a78d6", "#eb6834", "#8a8984"

plt.rcParams.update({
    "figure.facecolor": SURF, "axes.facecolor": SURF, "savefig.facecolor": SURF,
    "axes.edgecolor": INK2, "axes.labelcolor": INK, "xtick.color": INK2, "ytick.color": INK2,
    "axes.grid": True, "grid.color": GRIDC, "grid.linewidth": 0.8, "axes.spines.top": False,
    "axes.spines.right": False, "font.size": 10.5, "axes.titlesize": 12, "axes.titleweight": "bold",
    "lines.linewidth": 2.0, "legend.frameon": False,
})


def depth_ax(ax, zmax, xlabel):
    ax.set_ylim(zmax, 0)
    ax.set_ylabel("depth below seabed [m]")
    ax.set_xlabel(xlabel)
    ax.xaxis.set_label_position("top")
    ax.xaxis.tick_top()


def fig_temperature():
    th = R["base_free"]["profiles"]["thermal"]
    z, Tg, Tf = map(np.array, (th["z"], th["Tg"], th["Tf"]))
    fig, (a, b) = plt.subplots(1, 2, figsize=(10, 6.2), sharey=True)
    a.plot(Tg, z, color=FREE, label="geotherm (reference state)")
    a.plot(Tf, z, color=RESTR, label="flowing fluid, 1 yr")
    a.fill_betweenx(z, Tg, Tf, color=RESTR, alpha=0.12, lw=0)
    a.annotate(f"WHFT {Tf[0]:.0f} °C", (Tf[0], 0), (Tf[0] - 48, 330), color=INK,
               arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    a.annotate(f"reservoir {Tg[-1]:.0f} °C", (Tg[-1], z[-1]), (80, 2700), color=INK,
               arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    a.legend(loc="lower left")
    depth_ax(a, 3400, "temperature [°C]")
    a.set_title("Temperature vs depth", pad=34)
    shoes = {"tubing": 3100, "9-5/8": 3250, "13-3/8": 1800, "20": 700, "30": 80}
    for k in ("tubing", "9-5/8", "13-3/8", "20", "30"):
        zz = np.array(th[k]["z"])
        T = np.array(th[k]["T"]) - np.interp(zz, z, Tg)
        m = zz <= shoes[k]
        b.plot(T[m], zz[m], color=SER[k], label=NAME[k])
    b.legend(loc="lower right")
    depth_ax(b, 3400, "temperature rise ΔT of each string [°C]")
    b.set_xlim(0, 110)
    b.set_title("Temperature rise per string (1 yr)", pad=34)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "fig2_temperature.png"), dpi=160)
    plt.close(fig)


def fig_effective_force():
    fig, axs = plt.subplots(1, 2, figsize=(10, 6.2))
    for ax, k, zmax in ((axs[0], "13-3/8", 1300), (axs[1], "9-5/8", 2550)):
        pf = R["base_free"]["profiles"][k]
        pr = R["base_restrained"]["profiles"][k]
        z = np.array(pr["z"])
        ax.plot(np.array(pr["Fe_pre"]) / 1e6, z, color=PRE, label="before production")
        ax.plot(np.array(pf["Fe"]) / 1e6, z, color=FREE, label="production, free wellhead")
        ax.plot(np.array(pr["Fe"]) / 1e6, z, color=RESTR, label="production, restrained")
        ax.axvline(0, color=INK, lw=1.0)
        Fh = pr["Fh"] / 1e6
        ax.axvline(-Fh, color=INK2, lw=1.0, ls=(0, (4, 3)))
        ax.text(-Fh - 0.05, zmax * 0.97, f"helical onset\n{Fh * 1000:.0f} kN", ha="right", va="bottom", color=INK2, fontsize=9)
        ax.fill_betweenx(z, np.minimum(np.array(pr["Fe"]) / 1e6, 0), 0, color=RESTR, alpha=0.10, lw=0)
        depth_ax(ax, zmax, "effective force F_eff [MN]   (tension +)")
        ax.set_xlim(-2.6, 2.1)
        ax.set_title(f'{NAME[k]} - free length 0-{zmax:,} m', pad=34)
        if k == "9-5/8":
            for case, col in (("base_free", FREE), ("base_restrained", RESTR)):
                nz = R[case]["summary"][k]["buckled_from_m"]
                ax.axhline(nz, color=col, lw=0.8, ls=(0, (2, 2)))
                ax.text(1.95, nz - 25, f"buckled below {nz:.0f} m", ha="right", color=INK, fontsize=9)
    h, l = axs[0].get_legend_handles_labels()
    fig.legend(h, l, loc="lower center", ncol=3)
    fig.tight_layout(rect=(0, 0.06, 1, 1))
    fig.savefig(os.path.join(OUT, "fig3_effective_force.png"), dpi=160)
    plt.close(fig)


def fig_restraint_sweep():
    pts = sorted([(s["u_wh_mm"], s["R_MN"]) for s in R["restraint_sweep"]])
    u, Rr = zip(*pts)
    fig, ax = plt.subplots(figsize=(7, 4.4))
    ax.plot(u, Rr, color=RESTR, marker="o", ms=5, mec=SURF, mew=1.5)
    for s in R["restraint_sweep"]:
        if abs(s["k_restraint"] - 3e8) < 1:
            ax.annotate(f'half the growth ({s["u_wh_mm"]:.0f} mm)\nneeds {s["R_MN"]:.1f} MN', (s["u_wh_mm"], s["R_MN"]),
                        (s["u_wh_mm"] + 6, s["R_MN"] + 3), arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    ax.annotate(f"fully restrained: {max(Rr):.1f} MN", (0, max(Rr)), (6, max(Rr) + 0.6))
    ax.annotate(f"free wellhead: {max(u):.0f} mm", (max(u), 0), (max(u) - 12, 5.5),
                arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    ax.set_xlabel("wellhead growth allowed by the restraint [mm]")
    ax.set_ylabel("restraint force on the wellhead [MN]")
    ax.set_xlim(-1, 66)
    ax.set_ylim(0, 22)
    ax.set_title("Restraint force vs. permitted wellhead growth (base well, 1 yr)")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "fig4_restraint_sweep.png"), dpi=160)
    plt.close(fig)


def fig_time():
    h = R["time_history"]
    t = np.array([x["t_h"] for x in h]) / 24
    m = t >= 1
    fig, (a, b) = plt.subplots(1, 2, figsize=(10, 3.9))
    a.plot(t[m], np.array([x["u_wh_mm"] for x in h])[m], color=FREE, marker="o", ms=4)
    a.set_xscale("log")
    a.set_xlabel("time since start-up [days]")
    a.set_ylabel("wellhead growth [mm]")
    a.set_title("Free wellhead: growth vs time")
    a.set_ylim(0, 75)
    b.plot(t[m], np.array([x["R_MN"] for x in h])[m], color=RESTR, marker="o", ms=4)
    b.set_xscale("log")
    b.set_xlabel("time since start-up [days]")
    b.set_ylabel("restraint force [MN]")
    b.set_title("Restrained wellhead: force vs time")
    b.set_ylim(0, 24)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "fig5_time_history.png"), dpi=160)
    plt.close(fig)


def fig_bars():
    SF, SR = R["base_free"]["summary"], R["base_restrained"]["summary"]
    keys = ["13-3/8", "9-5/8", "tubing"]
    fig, (a, b) = plt.subplots(1, 2, figsize=(10, 3.8), gridspec_kw=dict(width_ratios=[1.1, 1]))
    y = np.arange(len(keys))
    vf = [-SF[k]["dFa_MN"] for k in keys]
    vr = [-SR[k]["dFa_MN"] for k in keys]
    vfull = [-SR[k]["full_restraint_force_MN"] for k in keys]
    a.barh(y - 0.2, vf, 0.36, color=FREE, label="free wellhead")
    a.barh(y + 0.2, vr, 0.36, color=RESTR, label="restrained")
    for i in range(len(keys)):
        a.text(vfull[i] + 0.06, y[i] - 0.2, f"{vf[i]:.2f}", va="center", color=INK, fontsize=9)
        a.text(vfull[i] + 0.06, y[i] + 0.2, f"{vr[i]:.2f}  (+{100 * (vr[i] / vf[i] - 1):.0f} %)", va="center", color=INK, fontsize=9)
        a.plot([vfull[i]] * 2, [y[i] - 0.42, y[i] + 0.42], color=INK, lw=1.2)
    a.set_yticks(y, [NAME[k] for k in keys])
    a.invert_yaxis()
    a.set_xlabel("added axial compression from heating [MN]\n(black tick: fully restrained, no buckling relief)")
    a.set_xlim(0, 3.2)
    a.legend(loc="lower right")
    a.set_title("Inner strings")
    fk = ["30", "20"]
    yf = np.arange(2)
    sf = [SF["foundation"]["comp_top_MPa"][k] for k in fk]
    sr = [SR["foundation"]["comp_top_MPa"][k] for k in fk]
    b.barh(yf - 0.2, sf, 0.36, color=FREE, label="free wellhead")
    b.barh(yf + 0.2, sr, 0.36, color=RESTR, label="restrained")
    for i in range(2):
        b.text(sf[i] + 5, yf[i] - 0.2, f"{sf[i]:+.0f}", va="center", fontsize=9)
        b.text(sr[i] - 5, yf[i] + 0.2, f"{sr[i]:.0f}", va="center", ha="right", fontsize=9)
    b.axvline(0, color=INK, lw=1)
    b.set_yticks(yf, ['30" X-56 (yield 386)', '20" K-55 (yield 379)'])
    b.invert_yaxis()
    b.set_xlim(-260, 120)
    b.set_xlabel("axial stress change at seabed [MPa], tension +")
    b.set_title("Foundation strings")
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "fig6_free_vs_restrained.png"), dpi=160)
    plt.close(fig)


def fig_foundation():
    C = json.load(open(os.path.join(HERE, "results", "compare.json")))
    F, Rr = C["base_free"], C["base_restrained"]
    z = np.array(F["z"])
    m = z <= 200
    fig, (a, b) = plt.subplots(1, 2, figsize=(10, 5.6), sharey=True)
    a.plot(np.array(F["N_MN"])[m], z[m], color=FREE, label="free wellhead")
    a.plot(np.array(Rr["N_MN"])[m], z[m], color=RESTR, label="restrained wellhead")
    a.axvline(0, color=INK, lw=1)
    a.axhline(80, color=INK2, lw=0.8, ls=(0, (4, 3)))
    a.text(-16.5, 77, "conductor shoe 80 m", fontsize=9, color=INK2, va="bottom")
    a.axhspan(112, 200, color="#1baf7a", alpha=0.08, lw=0)
    a.text(-16.5, 160, "identical in both cases:\ncement + rock already hold the 20\"", fontsize=9, color=INK)
    a.annotate(f"+{F['N_MN'][0]:.1f} MN (tension)", (F["N_MN"][0], 0), (-1, 25), fontsize=9,
               arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    a.annotate(f"{Rr['N_MN'][0]:.1f} MN", (Rr["N_MN"][0], 0), (-13.5, 40), fontsize=9,
               arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    depth_ax(a, 200, "axial force, conductor + 20\" + cement [MN]  (tension +)")
    a.set_xlim(-17, 6)
    a.set_title("Foundation axial force", pad=34)
    a.legend(loc="lower right")
    for key, col in (("s20_MPa", None), ("s30_MPa", None)):
        pass
    b.plot([v for v, zz in zip(F["s20_MPa"], z) if v is not None and zz <= 200],
           [zz for v, zz in zip(F["s20_MPa"], z) if v is not None and zz <= 200], color=FREE, label='20", free')
    b.plot([v for v, zz in zip(Rr["s20_MPa"], z) if v is not None and zz <= 200],
           [zz for v, zz in zip(Rr["s20_MPa"], z) if v is not None and zz <= 200], color=RESTR, label='20", restrained')
    b.plot([v for v in F["s30_MPa"] if v is not None], [zz for v, zz in zip(F["s30_MPa"], z) if v is not None],
           color=FREE, ls=(0, (4, 2)), label='30", free')
    b.plot([v for v in Rr["s30_MPa"] if v is not None], [zz for v, zz in zip(Rr["s30_MPa"], z) if v is not None],
           color=RESTR, ls=(0, (4, 2)), label='30", restrained')
    b.axvline(0, color=INK, lw=1)
    b.axvline(-379, color=INK2, lw=0.8, ls=(0, (2, 2)))
    b.text(-375, 196, "K-55 yield", fontsize=9, color=INK2)
    pk = Rr["s20_min"]
    b.annotate(f"{pk['MPa']:.0f} MPa locally below\nthe conductor shoe", (pk["MPa"], pk["z"]), (-360, 120), fontsize=9,
               arrowprops=dict(arrowstyle="-", color=INK2, lw=0.8))
    depth_ax(b, 200, "steel axial stress change [MPa]  (tension +)")
    b.set_xlim(-400, 70)
    b.set_title("Steel stress in conductor and surface casing", pad=34)
    b.legend(loc="lower right", fontsize=9)
    fig.tight_layout()
    fig.savefig(os.path.join(OUT, "fig7_foundation_profiles.png"), dpi=160)
    plt.close(fig)


if __name__ == "__main__":
    fig_temperature()
    fig_effective_force()
    fig_restraint_sweep()
    fig_time()
    fig_bars()
    fig_foundation()
    print("figures in", OUT)
