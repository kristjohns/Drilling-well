"""Run all load cases, export JSON for the video and figures for the report."""
from __future__ import annotations

import json
import math
import os
import sys
from dataclasses import asdict

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from wellmodel import (Config, solve_well, summarise, pipe_table, thermal_profile,  # noqa: E402
                       E_S, ALPHA_S, P30, P20, P1338, P958, P512)

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "results")
os.makedirs(OUT, exist_ok=True)


def clean(o):
    if isinstance(o, dict):
        return {k: clean(v) for k, v in o.items()}
    if isinstance(o, (list, tuple)):
        return [clean(v) for v in o]
    if isinstance(o, (np.floating, np.integer)):
        return float(o)
    if isinstance(o, np.ndarray):
        return [None if (isinstance(x, float) and math.isnan(x)) else x for x in o.tolist()]
    if isinstance(o, float) and math.isnan(o):
        return None
    return o


def profiles(sol, step=10.0):
    """Down-sampled profiles for plotting / animation."""
    th = sol["th"]
    zt = np.arange(0, th["z"][-1] + 1e-9, step)
    P = dict(thermal=dict(z=zt, Tg=np.interp(zt, th["z"], th["Tg"]),
                          Tf=np.interp(zt, th["z"], th["Tf"])))
    for tag in ("tubing", "9-5/8", "13-3/8", "20", "30"):
        v = th[tag]
        m = ~np.isnan(v)
        zz = th["z"][m]
        zs = zt[zt <= zz[-1]]
        P["thermal"][tag] = dict(z=zs, T=np.interp(zs, zz, v[m]))
    for k, r in sol["strings"].items():
        n = max(1, int(round(step / (r.z[1] - r.z[0]))))
        P[k] = dict(z=r.z[::n], dT=r.dT[::n], Fe0=r.Fe0[::n], Fe_pre=r.Fe_pre[::n],
                    Fe=r.Fe[::n], Fa=r.Fa[::n], Fa_pre=r.Fa_pre[::n],
                    mode=r.buck["mode"][::n], pitch=r.buck["pitch"][::n],
                    sig_b=r.buck["sig_b"][::n], wc=r.buck["wc"][::n], vm=r.vm[::n],
                    Fs=float(np.max(r.buck["Fs"])), Fh=float(np.max(r.buck["Fh"])))
    f = sol["fnd"]
    n = int(round(step / (f.z[1] - f.z[0])))
    P["foundation"] = dict(z=f.z[::n], u=f.u[:-1:n], N=f.N[::n], N_th=f.N_th[::n],
                           comp={k: v[::n] for k, v in f.comp.items()},
                           mob=f.t_mob[:-1:n])
    return P


def main():
    results = {"pipes": pipe_table(), "config": asdict(Config())}
    cases = {
        "base_free": Config(name="base_free"),
        "base_restrained": Config(name="base_restrained", restrained=True),
        "partial20_free": Config(name="partial20_free", toc20=200.0),
        "partial20_restrained": Config(name="partial20_restrained", toc20=200.0, restrained=True),
    }
    sols = {}
    for key, cfg in cases.items():
        print("solving", key)
        sol = solve_well(cfg)
        sols[key] = sol
        results[key] = dict(summary=summarise(sol), profiles=profiles(sol))

    # -------- partial restraint sweep (base well) --------------------------
    print("restraint sweep")
    sweep = []
    for kr in [0, 3e7, 1e8, 3e8, 1e9, 3e9, 1e10, 1e11]:
        cfg = Config(name=f"kr{kr:g}", k_restraint=kr)
        s = summarise(solve_well(cfg))
        sweep.append(dict(k_restraint=kr, u_wh_mm=s["u_wh_mm"], R_MN=s["R_MN"],
                          dFa_1338=s["13-3/8"]["dFa_MN"], dFa_958=s["9-5/8"]["dFa_MN"],
                          f30=s["foundation"]["comp_top_MPa"]["30"],
                          f20=s["foundation"]["comp_top_MPa"]["20"]))
    s = results["base_restrained"]["summary"]
    sweep.append(dict(k_restraint=float("inf"), u_wh_mm=0.0, R_MN=s["R_MN"],
                      dFa_1338=s["13-3/8"]["dFa_MN"], dFa_958=s["9-5/8"]["dFa_MN"],
                      f30=s["foundation"]["comp_top_MPa"]["30"],
                      f20=s["foundation"]["comp_top_MPa"]["20"]))
    results["restraint_sweep"] = sweep

    # -------- time history (base well, free and restrained) ----------------
    print("time history")
    times_h = [1, 3, 6, 12, 24, 48, 96, 168, 336, 720, 2160, 4380, 8760, 26280, 87600]
    hist = []
    for th_ in times_h:
        t = th_ * 3600.0
        a = summarise(solve_well(Config(name="tf", t_prod=t)))
        b = summarise(solve_well(Config(name="tr", t_prod=t, restrained=True)))
        hist.append(dict(t_h=th_, WHFT=a["WHFT"], u_wh_mm=a["u_wh_mm"], R_MN=b["R_MN"],
                         dT_958=a["9-5/8"]["dT_top"], dT_1338=a["13-3/8"]["dT_top"],
                         dFa_1338_free=a["13-3/8"]["dFa_MN"], dFa_1338_res=b["13-3/8"]["dFa_MN"],
                         dFa_958_free=a["9-5/8"]["dFa_MN"], dFa_958_res=b["9-5/8"]["dFa_MN"],
                         f30_res=b["foundation"]["comp_top_MPa"]["30"],
                         f20_res=b["foundation"]["comp_top_MPa"]["20"]))
        print(hist[-1])
    results["time_history"] = hist

    # thermal snapshots for animation (casing dT at seabed vs time)
    snaps = []
    for th_ in [6, 24, 168, 720, 8760]:
        thp = thermal_profile(Config(), th_ * 3600.0, dz=10.0)
        snaps.append(dict(t_h=th_, z=thp["z"], Tf=thp["Tf"], Tg=thp["Tg"],
                          **{k: thp[k] for k in ("tubing", "9-5/8", "13-3/8", "20", "30")}))
    results["thermal_snapshots"] = snaps

    with open(os.path.join(OUT, "results.json"), "w") as fh:
        json.dump(clean(results), fh, indent=1)
    print("written", os.path.join(OUT, "results.json"))
    return results


if __name__ == "__main__":
    main()
