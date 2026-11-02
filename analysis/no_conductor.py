"""Lock-in load when the 20" surface casing is restrained alone (no conductor).

The 20" (133 ppf K-55, shoe 700 m) is cemented to the seabed in a 26" hole and carries the
wellhead; there is no 30"/36" conductor (shoe30 <= 0 in the model). Compared with the
30" x 1" and 36" x 1.5" cases from lockin.json, and sized for four hold-down piles.
Writes results/no_conductor.json.
"""
import json
import math
import os
import sys

import numpy as np
from scipy.optimize import brentq

sys.path.insert(0, os.path.dirname(__file__))
from wellmodel import (Config, solve_well, summarise, thermal_profile, hung_strings, solve_string,  # noqa: E402
                       solve_foundation, E_S, E_C, ALPHA_S, ALPHA_C, P20, HOLE)
from pile_sizing import required_length, pile_head, row_for_mass, N_PILES  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
TEN = 3650 * 86400.0
K55 = 379.0


def cfg_nc(**kw):
    return Config(shoe30=-1.0, name="no conductor", **kw)


def hand(cfg):
    th = thermal_profile(cfg, dz=1.0)
    i = 1
    tg = th["Tg"][i]
    A_cem = math.pi * (HOLE["26"] ** 2 - P20.ro ** 2)
    rows = []
    for name, E, A, a, dT in (('20" steel', E_S, P20.As, ALPHA_S, th["20"][i] - tg),
                              ('cement 20"/26" hole', E_C, A_cem, ALPHA_C, th["cement20"][i] - tg)):
        rows.append(dict(name=name, A_cm2=A * 1e4, kN_per_C=E * A * a / 1e3, dT=dT, F_MN=E * A * a * dT / 1e6,
                         sigma_MPa=E * a * dT / 1e6))
    return rows


def case(t):
    cf, cr = cfg_nc(t_prod=t), cfg_nc(restrained=True, t_prod=t)
    sf, sol_r = summarise(solve_well(cf)), solve_well(cr)
    sr = summarise(sol_r)
    hc = hand(cr)
    inner_full = {k: -sr[k]["full_restraint_force_MN"] for k in ("13-3/8", "9-5/8", "tubing")}
    f = sol_r["fnd"]
    s20 = f.comp["20"] / P20.As / 1e6
    ff = solve_well(cf)["fnd"]
    s20f = ff.comp["20"] / P20.As / 1e6
    return dict(free_mm=sf["u_wh_mm"], R_MN=sr["R_MN"], found_top_MN=-sr["foundation"]["N_top_MN"],
                comp_top_MN={k: -v for k, v in sr["foundation"]["comp_top_MN"].items()},
                inner_MN={k: -sr[k]["dFa_MN"] for k in ("13-3/8", "9-5/8", "tubing")},
                inner_free_MN={k: -sf[k]["dFa_MN"] for k in ("13-3/8", "9-5/8", "tubing")},
                inner_full_MN=inner_full, hand=hc, hand_found_MN=sum(r["F_MN"] for r in hc),
                bound_MN=sum(r["F_MN"] for r in hc) + sum(inner_full.values()),
                s20_restr=dict(min_MPa=float(np.nanmin(s20)), z=float(f.z[int(np.nanargmin(s20))]), top_MPa=float(s20[0])),
                s20_free=dict(min_MPa=float(np.nanmin(s20f)), z=float(ff.z[int(np.nanargmin(s20f))]), top_MPa=float(s20f[0])),
                buck_1338_free=sf["13-3/8"]["buckled_len_m"], buck_1338_restr=sr["13-3/8"]["buckled_len_m"])


def r_at_factory(t):
    """restraint force needed to hold the wellhead at an imposed rise u (Dirichlet solve, robust)"""
    cfg = cfg_nc(t_prod=t)
    th = thermal_profile(cfg)
    strings = hung_strings(cfg)

    def R_at(u):
        res = [solve_string(cfg, s, th, u) for s in strings]
        return -solve_foundation(cfg, th, None, u).top_force - sum(r.dFa_th for r in res)
    return R_at


def coupled(D, L, t=TEN):
    R_at = r_at_factory(t)
    u = brentq(lambda u: u - pile_head(D, L, R_at(u) / N_PILES)[0], 0.0, 0.15, xtol=2e-6)
    R = R_at(u)
    return dict(D_m=D, L_m=L, growth_mm=u * 1000, R_MN=R / 1e6)


def main():
    out = dict(y1=case(365 * 86400.0), y10=case(TEN))
    part = []
    R1 = r_at_factory(365 * 86400.0)
    for kr in (1e8, 3e8, 1e9, 3e9):
        u = brentq(lambda u: R1(u) - kr * u, 0.0, 0.2, xtol=2e-6)
        part.append(dict(k_MN_per_m=kr / 1e6, growth_mm=u * 1000, R_MN=kr * u / 1e6))
    out["partial_1yr"] = part
    Pd = out["y10"]["bound_MN"] * 1e6 / N_PILES
    piles = []
    for D in (1.0, 1.25, 1.5):
        L = required_length(D, Pd)
        piles.append(dict(D_m=D, L_m=L, L_round=math.ceil(L), mass_t=row_for_mass(D, math.ceil(L))))
    out["P_pile_MN"] = Pd / 1e6
    out["piles"] = piles
    out["coupled"] = [coupled(p["D_m"], p["L_round"]) for p in piles if p["D_m"] in (1.0, 1.5)]
    json.dump(out, open(os.path.join(HERE, "results", "no_conductor.json"), "w"), indent=1, default=float)
    lk = json.load(open(os.path.join(HERE, "results", "lockin.json")))
    for k in ("y1", "y10"):
        c = out[k]
        print(k, "free", round(c["free_mm"], 1), "R", round(c["R_MN"], 2), "found", round(c["found_top_MN"], 2),
              "bound", round(c["bound_MN"], 2), "hand_found", round(c["hand_found_MN"], 2))
        print("   comp", {a: round(b, 2) for a, b in c["comp_top_MN"].items()}, "inner", {a: round(b, 2) for a, b in c["inner_MN"].items()},
              "inner_free", {a: round(b, 2) for a, b in c["inner_free_MN"].items()})
        print("   hand", [(r["name"], round(r["dT"], 1), round(r["F_MN"], 2), round(r["sigma_MPa"])) for r in c["hand"]])
        print("   s20 restr", c["s20_restr"], "free", c["s20_free"], "buck1338", c["buck_1338_free"], c["buck_1338_restr"])
    print("partial", [(p["k_MN_per_m"], round(p["growth_mm"], 1), round(p["R_MN"], 2)) for p in part])
    print("per pile", round(Pd / 1e6, 2), [(p["D_m"], round(p["L_m"], 1), p["L_round"], round(p["mass_t"])) for p in piles])
    print("coupled", [{a: round(b, 2) for a, b in c.items()} for c in out["coupled"]])
    for key in ("30x1", "36x1.5"):
        print("ref", key, "free", round(lk[key]["free_growth_mm"], 1), "R", round(lk[key]["R_MN"], 2), "s20pk", lk[key]["s20_peak"])


if __name__ == "__main__":
    main()
