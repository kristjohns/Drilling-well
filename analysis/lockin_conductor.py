"""Conductor lock-in load: hand calculation inputs + model results for a 30" x 1" and a
36" x 1.5" conductor.  Writes results/lockin.json.

Lock-in load = force the restraint must hold when wellhead and conductor are not allowed
to rise while the well heats (base well, 1 year of production unless stated).
"""
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from wellmodel import (Config, solve_well, summarise, thermal_profile, cond, cond_hole,  # noqa: E402
                       E_S, E_C, ALPHA_S, ALPHA_C, P20, HOLE)

HERE = os.path.dirname(os.path.abspath(__file__))
CASES = {"30x1": '30" x 1" (36" hole)', "36x1.5": '36" x 1.5" (42" hole)'}


def hand_calc(cfg):
    th = thermal_profile(cfg, dz=1.0)
    i = 1   # z = 1 m below seabed (restraint level ~ seabed)
    tg = th["Tg"][i]
    c, h = cond(cfg), cond_hole(cfg)
    comps = [
        ("conductor steel", E_S, c.As, ALPHA_S, th["30"][i] - tg),
        ('20" steel', E_S, P20.As, ALPHA_S, th["20"][i] - tg),
        ('cement 20"/conductor', E_C, math.pi * (c.ri ** 2 - P20.ro ** 2), ALPHA_C, th["cement20"][i] - tg),
        ("cement conductor/hole", E_C, math.pi * (h ** 2 - c.ro ** 2), ALPHA_C, th["cement30"][i] - tg),
    ]
    rows = []
    for name, E, A, a, dT in comps:
        rows.append(dict(name=name, E_GPa=E / 1e9, A_cm2=A * 1e4, alpha=a, kN_per_C=E * A * a / 1e3, dT=dT,
                         F_MN=E * A * a * dT / 1e6, sigma_MPa=E * a * dT / 1e6))
    return rows, float(th["Tf"][0])


def run(cfg):
    return summarise(solve_well(cfg))


def main():
    out = {}
    for key, label in CASES.items():
        base = Config(conductor=key)
        hc, whft = hand_calc(base)
        sf = run(Config(conductor=key))
        sr_sol = solve_well(Config(conductor=key, restrained=True))
        sr = summarise(sr_sol)
        inner = {k: -sr[k]["dFa_MN"] for k in ("13-3/8", "9-5/8", "tubing")}
        inner_full = {k: -sr[k]["full_restraint_force_MN"] for k in ("13-3/8", "9-5/8", "tubing")}
        f = sr_sol["fnd"]
        A = {"30": cond(base).As, "20": P20.As}
        s20 = f.comp["20"] / A["20"] / 1e6
        i_pk = int(np.nanargmin(s20))
        res = dict(
            label=label, whft=whft, hand=hc,
            hand_found_MN=sum(r["F_MN"] for r in hc),
            inner_MN=inner, inner_full_MN=inner_full,
            upper_bound_MN=sum(r["F_MN"] for r in hc) + sum(inner_full.values()),
            free_growth_mm=sf["u_wh_mm"], R_MN=sr["R_MN"],
            found_top_MN=-sr["foundation"]["N_top_MN"],
            comp_top_MN={k: -v for k, v in sr["foundation"]["comp_top_MN"].items()},
            comp_top_MPa={k: v for k, v in sr["foundation"]["comp_top_MPa"].items()},
            comp_free_MPa={k: v for k, v in sf["foundation"]["comp_top_MPa"].items()},
            s20_peak=dict(z=float(f.z[i_pk]), MPa=float(s20[i_pk])),
            hanging_top_MN={k: sr[k]["Fa_top_MN"] for k in ("13-3/8", "9-5/8", "tubing")},
        )
        # soil sensitivity (scale undrained shear strength profile)
        soil = []
        for fac in (0.1, 0.25, 1.0, 4.0):
            kw = dict(conductor=key, su0=10e3 * fac, su_grad=2e3 * fac, su_max=400e3 * max(fac, 0.25))
            a = run(Config(**kw))
            b = run(Config(restrained=True, **kw))
            soil.append(dict(factor=fac, su_top_kPa=10 * fac, su_80m_kPa=(10 + 2 * 80) * fac, free_mm=a["u_wh_mm"], R_MN=b["R_MN"],
                             found_MN=-b["foundation"]["N_top_MN"]))
        res["soil"] = soil
        # partial restraint
        part = []
        for kr in (1e8, 3e8, 1e9, 3e9):
            p = run(Config(conductor=key, k_restraint=kr))
            part.append(dict(k_MN_per_m=kr / 1e6, growth_mm=p["u_wh_mm"], R_MN=p["R_MN"]))
        res["partial"] = part
        # time
        tim = []
        for days in (1, 30, 365, 3650):
            p = run(Config(conductor=key, restrained=True, t_prod=days * 86400.0))
            q = run(Config(conductor=key, t_prod=days * 86400.0))
            tim.append(dict(days=days, R_MN=p["R_MN"], free_mm=q["u_wh_mm"]))
        res["time"] = tim
        out[key] = res
        print(key, json.dumps({k: res[k] for k in ("free_growth_mm", "R_MN", "found_top_MN", "upper_bound_MN", "hand_found_MN")}, default=float))
        for r in hc:
            print("   ", {k: (round(v, 3) if isinstance(v, float) else v) for k, v in r.items()})
        print("   inner", {k: round(v, 2) for k, v in inner.items()}, "full", {k: round(v, 2) for k, v in inner_full.items()})
        print("   comp MN", {k: round(v, 2) for k, v in res["comp_top_MN"].items()}, "MPa", {k: round(v) for k, v in res["comp_top_MPa"].items()},
              "free MPa", {k: round(v) for k, v in res["comp_free_MPa"].items()}, "s20pk", res["s20_peak"])
        print("   soil", [(s["factor"], round(s["free_mm"], 1), round(s["R_MN"], 2)) for s in soil])
        print("   partial", [(p["k_MN_per_m"], round(p["growth_mm"], 1), round(p["R_MN"], 2)) for p in part])
        print("   time", [(t["days"], round(t["R_MN"], 2), round(t["free_mm"], 1)) for t in tim])
        print("   hanging", res["hanging_top_MN"])
    json.dump(out, open(os.path.join(HERE, "results", "lockin.json"), "w"), indent=1, default=float)


if __name__ == "__main__":
    main()
