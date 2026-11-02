"""Size four tension (hold-down) piles that keep the wellhead from rising.

The restraint frame pushes down on the wellhead with the lock-in load R; the frame is held
down by four piles, so each pile carries ~R/4 in sustained tension (uplift).

  * Soil: same clay profile as the well model, s_u = 10 + 2 z kPa (cap 400 kPa).
  * Uplift capacity of an open-ended driven steel pipe pile = outside shaft friction
    alpha * s_u * pi * D over the embedded length + submerged steel weight.
    No end bearing in uplift, soil plug and inside friction ignored (conservative).
  * Required: Q_shaft >= FS * (P_pile - W'_pile).
  * Pile head stiffness from an axial t-z model (API RP 2GEO clay t-z curve), then coupled to
    the well model: a pile group that stretches lets the wellhead rise a little, which lowers R.

Writes results/piles.json.
"""
import json
import math
import os
import sys

import numpy as np
from scipy.optimize import brentq

sys.path.insert(0, os.path.dirname(__file__))
from wellmodel import Config, solve_well, summarise, E_S, RHO_S, G  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
N_PILES = 4
FS = 2.0                     # axial pile capacity, operating / sustained (API RP 2GEO WSD)
RHO_SW = 1025.0
GAMMA_S_SUB = (RHO_S - RHO_SW) * G      # N/m3, submerged steel
TEN_YEARS = 3650 * 86400.0

# design loads (MN): 10-year model value and the hand upper bound (no credit for soil)
LK = json.load(open(os.path.join(HERE, "results", "lockin.json")))


def design_loads(key):
    c = LK[key]
    r10 = [t for t in c["time"] if t["days"] == 3650][0]["R_MN"]
    # hand bound scales with the temperature rise; 10-yr bound from the ratio of model values
    ub1 = c["upper_bound_MN"]
    ub10 = ub1 * r10 / c["R_MN"]
    return dict(R_1yr=c["R_MN"], R_10yr=r10, bound_1yr=ub1, bound_10yr=ub10)


def wall(D):
    """Wall thickness: D/t = 40 (driveable template pile), rounded up to 5 mm,
    not less than the API minimum 6.35 mm + D/100."""
    t = max(D / 40.0, 0.00635 + D / 100.0)
    return math.ceil(t * 1000 / 5.0) * 5.0 / 1000


def su_int(L, cfg=Config()):
    """integral of s_u dz from 0 to L [Pa*m]"""
    zc = (cfg.su_max - cfg.su0) / cfg.su_grad
    if L <= zc:
        return cfg.su0 * L + 0.5 * cfg.su_grad * L ** 2
    return su_int(zc, cfg) + cfg.su_max * (L - zc)


def capacity(D, L, alpha=0.6, t=None):
    t = t or wall(D)
    As = math.pi * (D ** 2 - (D - 2 * t) ** 2) / 4
    Qs = alpha * math.pi * D * su_int(L)
    W = GAMMA_S_SUB * As * L
    return Qs, W, As


def required_length(D, P, alpha=0.6, fs=FS):
    """shortest embedded length with Qs >= fs*(P - W')"""
    f = lambda L: capacity(D, L, alpha)[0] - fs * (P - capacity(D, L, alpha)[1])
    return brentq(f, 1.0, 400.0)


# --- API RP 2GEO t-z curve for clay (no post-peak softening) -----------------------
TZ_X = np.array([0.0, 0.0016, 0.0031, 0.0057, 0.0080, 0.0100, 10.0])
TZ_Y = np.array([0.0, 0.30, 0.50, 0.75, 0.90, 1.00, 1.00])


def pile_head(D, L, P, alpha=0.6, dz=0.5):
    """head displacement [m] of a pile pulled up with P [N] (t-z springs + elastic steel)."""
    t = wall(D)
    As = math.pi * (D ** 2 - (D - 2 * t) ** 2) / 4
    EA = E_S * As
    n = int(round(L / dz)) + 1
    z = np.linspace(0, L, n)
    dz = z[1] - z[0]
    cfg = Config()
    su = np.minimum(cfg.su0 + cfg.su_grad * z, cfg.su_max)
    trib = np.full(n, dz)
    trib[0] = trib[-1] = dz / 2
    tmax = alpha * su * math.pi * D * trib
    k0 = tmax * TZ_Y[1] / (TZ_X[1] * D)
    ksec = k0.copy()
    u = np.zeros(n)
    k = EA / dz
    for it in range(300):
        K = np.zeros((n, n))
        idx = np.arange(n - 1)
        K[idx, idx] += k
        K[idx + 1, idx + 1] += k
        K[idx, idx + 1] -= k
        K[idx + 1, idx] -= k
        K[np.arange(n), np.arange(n)] += ksec
        F = np.zeros(n)
        F[0] = P
        u_new = np.linalg.solve(K, F)
        tz = tmax * np.interp(np.abs(u_new) / D, TZ_X, TZ_Y)
        ks_new = np.where(np.abs(u_new) > 1e-12, tz / np.maximum(np.abs(u_new), 1e-12), k0)
        if np.max(np.abs(u_new - u)) < 1e-9 and it > 2:
            u = u_new
            break
        u = u_new
        ksec = 0.5 * ksec + 0.5 * ks_new
    mob = np.interp(np.abs(u) / D, TZ_X, TZ_Y)
    stretch = u[0] - u[-1]
    return float(u[0]), float(stretch), float(mob[0])


def coupled(key, D, L, alpha=0.6, k_frame=None):
    """Couple the pile group (and optionally a flexible frame) to the well model."""
    k = 3e9
    for it in range(30):
        sol = summarise(solve_well(Config(conductor=key, k_restraint=k, t_prod=TEN_YEARS)))
        R = sol["R_MN"] * 1e6
        u_pile, _, _ = pile_head(D, L, R / N_PILES, alpha)
        u = u_pile + (R / k_frame if k_frame else 0.0)
        k_new = R / u
        if abs(k_new - k) / k < 2e-3:
            k = k_new
            break
        k = 0.5 * k + 0.5 * k_new
    return dict(k_group_MN_per_m=k / 1e6, R_MN=sol["R_MN"], growth_mm=sol["u_wh_mm"],
                pile_load_MN=sol["R_MN"] / N_PILES)


def main():
    out = dict(n_piles=N_PILES, FS=FS, alpha=0.6, cases={})
    diam = [1.0, 1.25, 1.5, 1.83, 2.0, 2.5]
    for key, label in (("30x1", '30" x 1"'), ("36x1.5", '36" x 1.5"')):
        dl = design_loads(key)
        Pd = dl["bound_10yr"] * 1e6 / N_PILES
        rows = []
        for D in diam:
            L = required_length(D, Pd)
            Qs, W, As = capacity(D, L)
            u, stretch, mob = pile_head(D, L, Pd)
            rows.append(dict(D_m=D, t_mm=wall(D) * 1000, L_m=L, Qs_MN=Qs / 1e6, W_MN=W / 1e6,
                             mass_t=RHO_S * As * L / 1000, head_mm=u * 1000, stretch_mm=stretch * 1000,
                             mob_top=mob, k_pile_MN_per_m=Pd / u / 1e6))
        # sensitivities on the 1.5 m pile
        sens = []
        for name, P_MN, alpha, fs in (("10-yr model R, FS 2", dl["R_10yr"], 0.6, 2.0),
                                      ("10-yr bound, FS 2 (base)", dl["bound_10yr"], 0.6, 2.0),
                                      ("10-yr bound, FS 1.5", dl["bound_10yr"], 0.6, 1.5),
                                      ("10-yr bound, FS 2, alpha 0.45 (cyclic)", dl["bound_10yr"], 0.45, 2.0),
                                      ("10-yr bound, FS 2, alpha 0.85 (API, no reduction)", dl["bound_10yr"], 0.85, 2.0)):
            sens.append(dict(case=name, P_MN=P_MN / N_PILES,
                             L_1p5=required_length(1.5, P_MN * 1e6 / N_PILES, alpha, fs),
                             L_2p0=required_length(2.0, P_MN * 1e6 / N_PILES, alpha, fs)))
        # coupled: how 'fully' does a real (stretching) pile group hold the wellhead?
        cpl = []
        for D in (1.5, 2.0):
            L = math.ceil(required_length(D, Pd))
            for kf, kname in ((None, "rigid frame"), (5e9, "frame 5 GN/m")):
                c = coupled(key, D, L, k_frame=kf)
                c.update(D_m=D, L_m=L, frame=kname)
                cpl.append(c)
                print("   coupled", key, D, L, kname, {k: round(v, 2) for k, v in c.items() if isinstance(v, float)})
        # suction-anchor alternative (rough, sustained uplift: outside + inside friction,
        # inside limited by plug weight, no reverse end bearing)
        suc = []
        for Dc in (5.0, 6.0, 7.0):
            def cap(Lc):
                out_f = 0.6 * math.pi * Dc * su_int(Lc)
                in_f = 0.6 * math.pi * (Dc - 0.06) * su_int(Lc)
                plug = 7e3 * math.pi * (Dc - 0.06) ** 2 / 4 * Lc
                steel = GAMMA_S_SUB * math.pi * Dc * 0.03 * Lc + GAMMA_S_SUB * math.pi * Dc ** 2 / 4 * 0.05
                return out_f, min(in_f, plug), steel
            Lc = brentq(lambda Lc: cap(Lc)[0] + cap(Lc)[1] - FS * (Pd - cap(Lc)[2]), 1.0, 200.0)
            suc.append(dict(D_m=Dc, L_m=Lc))
        out["cases"][key] = dict(label=label, loads_MN=dl, P_design_pile_MN=Pd / 1e6, piles=rows,
                                 sens=sens, coupled=cpl, suction=suc,
                                 partial=LK[key]["partial"], free_growth_mm=LK[key]["free_growth_mm"])
        print(label, {k: round(v, 2) for k, v in dl.items()}, "P/pile", round(Pd / 1e6, 2))
        for r in rows:
            print("   ", {k: round(v, 2) for k, v in r.items()})
        for s in sens:
            print("   ", s["case"], round(s["P_MN"], 2), round(s["L_1p5"], 1), round(s["L_2p0"], 1))
        print("    suction", [(s["D_m"], round(s["L_m"], 1)) for s in suc])
    json.dump(out, open(os.path.join(HERE, "results", "piles.json"), "w"), indent=1, default=float)


if __name__ == "__main__":
    main()
