"""Full-resolution foundation (conductor + surface casing) profiles for the
free vs. restrained comparison video and report.  Writes results/compare.json."""
import json
import math
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
from wellmodel import Config, solve_well, P20, P30, HOLE  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))


def main():
    out = {}
    for key, cfg in {
        "base_free": Config(),
        "base_restrained": Config(restrained=True),
        "partial20_free": Config(toc20=200.0),
        "partial20_restrained": Config(toc20=200.0, restrained=True),
    }.items():
        sol = solve_well(cfg)
        f = sol["fnd"]
        m = f.z <= 250
        d = dict(z=f.z[m].tolist(), N_MN=(f.N[m] / 1e6).tolist(), Nth_MN=(f.N_th[m] / 1e6).tolist(),
                 u_mm=(f.u[:-1][m] * 1000).tolist())
        for name, A in (("20", P20.As), ("30", P30.As)):
            if name in f.comp:
                v = f.comp[name][m]
                d[f"s{name}_MPa"] = [None if math.isnan(x) else x / A / 1e6 for x in v]
        if "20" in f.comp:
            s20 = f.comp["20"] / P20.As / 1e6
            i = int(np.nanargmin(s20))
            d["s20_min"] = dict(z=float(f.z[i]), MPa=float(s20[i]))
        out[key] = d
        print(key, "N0", round(d["N_MN"][0], 2), "s20min", d.get("s20_min"))
    json.dump(out, open(os.path.join(HERE, "results", "compare.json"), "w"))


if __name__ == "__main__":
    main()
