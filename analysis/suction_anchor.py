"""Suction anchor to restrict wellhead growth of the 20"-only well (no conductor), for different
percentages of restriction.

Restriction p = share of the free (10-year) wellhead growth that is prevented.  The force the
anchor must hold at allowed rise u = (1 - p) * u_free comes from the well model (imposed-displacement
solve, 10 years of production).

Anchor uplift capacity under a SUSTAINED pull (suction bleeds away, no reverse end bearing):
    Q = outside friction + min(inside friction, plug weight) + submerged anchor weight
    friction = alpha * s_u * perimeter, alpha = 0.6, s_u = 10 + 2z kPa (same clay as the well model)
    required: soil part >= FS * (P - W'),  FS = 2
Stiffness (rigid caisson, outside shaft only - the plug moves with the anchor):
    Randolph & Wroth (1978): k_el = 2 pi G_avg L / ln(r_m / r0),  r_m = 2.5 rho (1 - nu) L, nu = 0.5,
    G = 300 s_u (range 150-600 s_u), secant at load P: k = k_el * (1 - 0.9 P / Q_ult)  (hyperbolic)
Writes results/suction_anchor.json.
"""
import json
import math
import os
import sys

import numpy as np
from scipy.optimize import brentq

sys.path.insert(0, os.path.dirname(__file__))
from wellmodel import Config  # noqa: E402
from pile_sizing import su_int, GAMMA_S_SUB, FS  # noqa: E402
from no_conductor import r_at_factory, TEN  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
ALPHA = 0.6
GAMMA_SOIL = 7.0e3          # N/m3, submerged soft clay
CFG = Config()


def wall(D):
    return max(0.025, D / 200.0)


def capacity(D, L):
    t = wall(D)
    Di = D - 2 * t
    I = su_int(L)
    out = ALPHA * math.pi * D * I
    inn = ALPHA * math.pi * Di * I
    plug = GAMMA_SOIL * math.pi * Di ** 2 / 4 * L
    steel = math.pi * D * t * L + math.pi * D ** 2 / 4 * 0.05          # wall + 50 mm lid
    W = 1.3 * GAMMA_S_SUB * steel                                        # +30 % stiffeners, top structure
    mass_t = 1.3 * 7850 * steel / 1000
    return dict(out=out, inner=min(inn, plug), plug_limited=plug < inn, W=W, mass_t=mass_t,
                Q_ult=out + min(inn, plug) + W)


def required_L(D, P, fs=FS):
    f = lambda L: (lambda c: c["out"] + c["inner"] - fs * (P - c["W"]))(capacity(D, L))
    if f(0.5) >= 0:
        return 0.5
    return brentq(f, 0.5, 300.0)


def stiffness(D, L, P, g_ratio=300.0):
    su = lambda z: min(CFG.su0 + CFG.su_grad * z, CFG.su_max)
    G_avg = g_ratio * su_int(L) / L
    G_L = g_ratio * su(L)
    rho = G_avg / G_L
    rm = 2.5 * rho * 0.5 * L
    zeta = max(math.log(rm / (D / 2)), 0.5)
    k_el = 2 * math.pi * G_avg * L / zeta
    Q = capacity(D, L)["Q_ult"]
    return k_el * max(1 - 0.9 * P / Q, 0.05), k_el


def main():
    R_at = r_at_factory(TEN)
    R0 = R_at(0.0)
    u_free = brentq(R_at, 0.03, 0.2, xtol=1e-6)
    print(f"20\" alone, 10 yr: fully locked {R0 / 1e6:.2f} MN, free growth {u_free * 1000:.1f} mm")
    rows = []
    for p in (0.25, 0.5, 0.75, 0.9, 0.95, 1.0):
        u = (1 - p) * u_free
        R = R_at(u)
        r = dict(pct=p * 100, allow_mm=u * 1000, R_MN=R / 1e6, R_pct=R / R0 * 100,
                 k_req_MN_per_m=(R / u / 1e6) if u > 0 else None)
        single = []
        for D in (4.0, 5.0, 6.0, 8.0):
            L = math.ceil(required_L(D, R) * 2) / 2
            c = capacity(D, L)
            k, k_el = stiffness(D, L, R)
            single.append(dict(D=D, L=L, mass_t=c["mass_t"], k_MN_per_m=k / 1e6, plug_limited=c["plug_limited"]))
        r["single"] = single
        four = []
        for D in (2.5, 3.0, 4.0):
            L = math.ceil(required_L(D, R / 4) * 2) / 2
            four.append(dict(D=D, L=L, mass_t=capacity(D, L)["mass_t"]))
        r["four"] = four
        rows.append(r)
    # what a rigidly connected anchor actually does (no stroke / spring): coupled operating point
    nat = []
    for D, L in [(s["D"], s["L"]) for s in rows[-1]["single"]] + [(6.0, s["L"]) for s in rows[1]["single"] if s["D"] == 6.0]:
        for g in (150.0, 300.0, 600.0):
            def resid(u):
                R = R_at(u)
                return u - R / stiffness(D, L, R, g)[0]
            u = brentq(resid, 1e-5, u_free * 0.999, xtol=1e-6)
            R = R_at(u)
            nat.append(dict(D=D, L=L, G_ratio=g, rise_mm=u * 1000, pct=100 * (1 - u / u_free), R_MN=R / 1e6,
                            FS=(capacity(D, L)["Q_ult"] - capacity(D, L)["W"]) / (R - capacity(D, L)["W"])))
    out = dict(R0_MN=R0 / 1e6, u_free_mm=u_free * 1000, rows=rows, natural=nat)
    json.dump(out, open(os.path.join(HERE, "results", "suction_anchor.json"), "w"), indent=1, default=float)
    for r in rows:
        print(f"{r['pct']:5.0f} %  rise {r['allow_mm']:5.1f} mm  R {r['R_MN']:5.2f} MN ({r['R_pct']:4.0f} %)  "
              f"k_req {r['k_req_MN_per_m'] or float('inf'):8.0f} MN/m")
        print("        single:", [(s["D"], s["L"], round(s["mass_t"]), round(s["k_MN_per_m"]), s["plug_limited"]) for s in r["single"]])
        print("        four:  ", [(s["D"], s["L"], round(s["mass_t"])) for s in r["four"]])
    for n in nat:
        print("   natural", {k: round(v, 2) for k, v in n.items()})


if __name__ == "__main__":
    main()
