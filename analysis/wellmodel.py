"""
Restrained thermal wellhead growth in a subsea well
====================================================

A transparent 1-D engineering model of what happens to the casing strings of a
subsea production well when it heats up, comparing

  * FREE       - the wellhead is allowed to grow upward (normal design), and
  * RESTRAINED - the wellhead / conductor is held so it cannot move upward.

Model chain
-----------
1.  Thermal: geothermal profile + flowing fluid temperature (Ramey / Hasan-Kabir
    steady wellbore, transient formation) + radial thermal-resistance network
    -> temperature rise dT(z) of every casing string at every depth.
2.  Hung strings (tubing, 9-5/8", 13-3/8", optionally an uncemented 20"): each
    is a column fixed at its top-of-cement (TOC) and attached to the wellhead.
    Load history: hanging weight frozen at cementing -> fluid changes
    (ballooning) -> production heating.  Axial compatibility over the free
    length incl. helical-buckling shortening.  Effective force (Lubinski) used
    for buckling.
3.  Foundation (conductor + cemented surface casing) : composite axial bar on
    non-linear t-z soil springs with thermal strain.
4.  Wellhead equilibrium: free -> solve for wellhead growth; restrained ->
    growth = 0 and the restraint reaction is computed.

Sign conventions: depth z positive downward from the wellhead datum (~seabed).
Axial force: tension positive.  Displacement u positive upward.

Units: SI internally (m, N, Pa, degC).  Imperial casing sizes as per API 5CT.
"""
from __future__ import annotations

import json
import math
from dataclasses import dataclass, field, asdict
from typing import Callable

import numpy as np
from scipy.optimize import brentq

# --------------------------------------------------------------------------
# Constants & material properties
# --------------------------------------------------------------------------
G = 9.81
INCH = 0.0254
E_S = 207e9          # steel Young's modulus [Pa]
NU = 0.30            # Poisson's ratio
ALPHA_S = 1.24e-5    # steel thermal expansion [1/degC] (6.9e-6 /degF, API TR 5C3)
RHO_S = 7850.0       # steel density
E_C = 10e9           # set cement Young's modulus
ALPHA_C = 1.0e-5     # cement thermal expansion
K_STEEL = 45.0       # W/mK carbon steel
K_CR13 = 25.0        # W/mK 13Cr


@dataclass
class Pipe:
    label: str
    od_in: float
    wt_in: float
    ppf: float
    grade: str
    yield_mpa: float

    @property
    def ro(self):
        return self.od_in * INCH / 2

    @property
    def ri(self):
        return (self.od_in - 2 * self.wt_in) * INCH / 2

    @property
    def As(self):
        return math.pi * (self.ro ** 2 - self.ri ** 2)

    @property
    def Ao(self):
        return math.pi * self.ro ** 2

    @property
    def Ai(self):
        return math.pi * self.ri ** 2

    @property
    def I(self):
        return math.pi / 4 * (self.ro ** 4 - self.ri ** 4)

    @property
    def EA(self):
        return E_S * self.As

    @property
    def EI(self):
        return E_S * self.I


# Standard API sizes ---------------------------------------------------------
P30 = Pipe('30" conductor', 30.0, 1.000, 309.7, "X-56", 386)
P36 = Pipe('36" conductor', 36.0, 1.500, 553.0, "X-56", 386)
P36T1 = Pipe('36" x 1" conductor', 36.0, 1.000, 374.0, "X-56", 386)
P20 = Pipe('20" surface casing', 20.0, 0.635, 133.0, "K-55", 379)
P1338 = Pipe('13-3/8" intermediate', 13.375, 0.514, 72.0, "L-80", 552)
P958 = Pipe('9-5/8" production', 9.625, 0.545, 53.5, "P-110", 758)
P7 = Pipe('7" liner', 7.0, 0.408, 29.0, "P-110", 758)
P512 = Pipe('5-1/2" tubing', 5.5, 0.304, 17.0, "13Cr-80", 552)

HOLE = {"42": 42.0 * INCH / 2, "36": 36.0 * INCH / 2, "26": 26.0 * INCH / 2, "17.5": 17.5 * INCH / 2,
        "12.25": 12.25 * INCH / 2, "8.5": 8.5 * INCH / 2}


# --------------------------------------------------------------------------
# Well configuration
# --------------------------------------------------------------------------
@dataclass
class Config:
    name: str = "base"
    water_depth: float = 350.0      # m MSL-seabed
    rkb_msl: float = 25.0           # m (semi-sub air gap + rig floor)
    T_seabed: float = 6.0           # degC
    grad: float = 0.033             # degC/m below seabed
    z_bh: float = 3400.0            # m below seabed: producing interval (mid)
    # casing points (m below seabed)
    shoe30: float = 80.0            # <= 0: no conductor (20" cemented to seabed in the 26" hole)
    shoe20: float = 700.0
    toc20: float = 0.0              # 0 = cemented to seabed
    shoe1338: float = 1800.0
    toc1338: float = 1300.0
    shoe958: float = 3250.0
    toc958: float = 2550.0
    packer: float = 3100.0
    # fluids (SG)
    sg_seawater: float = 1.03
    sg_mud_20: float = 1.03         # 20" run riserless, seawater displacement
    sg_mud_1338: float = 1.25       # mud when 13-3/8" cemented (left in C-annulus)
    sg_mud_958: float = 1.40        # mud when 9-5/8" cemented (left in B-annulus)
    sg_brine: float = 1.03          # A-annulus packer fluid
    sg_cement: float = 1.90
    # production
    mdot: float = 30.0              # kg/s total liquid (~3000 m3/d)
    cp: float = 2400.0              # J/kgK
    beta_f: float = 8e-4            # 1/K fluid expansivity (gravity/JT term)
    t_prod: float = 365 * 86400.0   # s
    # thermal properties
    h_film: float = 1500.0          # W/m2K tubing inside film
    k_brine: float = 4.0            # effective (natural convection) A-annulus
    k_mud: float = 1.0              # effective mud in B/C annulus
    k_sw_ann: float = 2.0           # uncemented seawater-filled 20x30 annulus
    k_cement: float = 0.9
    k_form: float = 2.0
    diff_form: float = 8.3e-7       # m2/s
    # soil (t-z) for foundation
    su0: float = 10e3               # Pa at seabed
    su_grad: float = 2.0e3          # Pa/m
    su_max: float = 400e3
    adhesion: float = 0.6
    tz_peak_frac: float = 0.01      # peak friction mobilised at 1 % of D
    # wellhead
    restrained: bool = False
    conductor: str = "30x1"         # "30x1" (36" hole), "36x1.5" or "36x1" (42" hole)
    k_restraint: float = 0.0        # N/m, partial restraint spring (if not fully restrained)
    include_tubing: bool = True

    @property
    def h_riser(self):
        return self.water_depth + self.rkb_msl


CONDUCTORS = {"30x1": (P30, "36"), "36x1.5": (P36, "42"), "36x1": (P36T1, "42")}


def cond(cfg):
    return CONDUCTORS[cfg.conductor][0]


def cond_hole(cfg):
    return HOLE[CONDUCTORS[cfg.conductor][1]]


# --------------------------------------------------------------------------
# 1. Thermal model
# --------------------------------------------------------------------------
def f_time(tD: float) -> float:
    """Hasan & Kabir (1991) dimensionless transient heat conduction function."""
    if tD <= 1.5:
        return 1.1281 * math.sqrt(tD) * (1 - 0.3 * math.sqrt(tD))
    return (0.4063 + 0.5 * math.log(tD)) * (1 + 0.6 / tD)


def radial_layers(cfg: Config, z: float):
    """Radial build-up at depth z, from the flowing fluid outward.

    Returns list of (r_in, r_out, k, tag) and the wellbore (hole) radius where
    the formation starts.  'tag' identifies steel walls so their temperature
    can be read.  Film resistance is represented as a pseudo-layer.
    """
    L = []
    if z <= cfg.packer:
        L.append(("film", P512.ri, cfg.h_film))
        L.append((P512.ri, P512.ro, K_CR13, "tubing"))
        L.append((P512.ro, P958.ri, cfg.k_brine, "A-ann"))
    else:
        L.append(("film", P958.ri, cfg.h_film))
    # 9-5/8"
    L.append((P958.ri, P958.ro, K_STEEL, "9-5/8"))
    outer = P1338.ri if z <= cfg.shoe1338 else HOLE["12.25"]
    kB = cfg.k_mud if z < cfg.toc958 else cfg.k_cement
    L.append((P958.ro, outer, kB, "B-ann" if z < cfg.toc958 else "cement958"))
    if z > cfg.shoe1338:
        return L, HOLE["12.25"]
    # 13-3/8"
    L.append((P1338.ri, P1338.ro, K_STEEL, "13-3/8"))
    outer = P20.ri if z <= cfg.shoe20 else HOLE["17.5"]
    kC = cfg.k_mud if z < cfg.toc1338 else cfg.k_cement
    L.append((P1338.ro, outer, kC, "C-ann" if z < cfg.toc1338 else "cement1338"))
    if z > cfg.shoe20:
        return L, HOLE["17.5"]
    # 20"
    L.append((P20.ri, P20.ro, K_STEEL, "20"))
    outer = cond(cfg).ri if z <= cfg.shoe30 else HOLE["26"]
    k20 = cfg.k_cement if z >= cfg.toc20 else cfg.k_sw_ann
    L.append((P20.ro, outer, k20, "cement20" if z >= cfg.toc20 else "D-ann"))
    if z > cfg.shoe30:
        return L, HOLE["26"]
    # 30"
    L.append((cond(cfg).ri, cond(cfg).ro, K_STEEL, "30"))
    L.append((cond(cfg).ro, cond_hole(cfg), cfg.k_cement, "cement30"))
    return L, cond_hole(cfg)


def thermal_at(cfg: Config, z: float, Tf: float, Tg: float, t: float):
    """Return total resistance R' [K m/W] and temperatures of each layer
    (at mid-radius) for fluid temperature Tf and geotherm Tg at depth z."""
    layers, r_wb = radial_layers(cfg, z)
    Rs = []
    tags = []
    for lay in layers:
        if lay[0] == "film":
            Rs.append(1.0 / (2 * math.pi * lay[1] * lay[2]))
            tags.append(("film", None))
        else:
            ri, ro, k, tag = lay
            Rs.append(math.log(ro / ri) / (2 * math.pi * k))
            tags.append((tag, (ri, ro, k)))
    tD = cfg.diff_form * t / r_wb ** 2
    R_form = f_time(tD) / (2 * math.pi * cfg.k_form)
    R_tot = sum(Rs) + R_form
    q = (Tf - Tg) / R_tot          # W/m
    temps = {}
    Rcum = 0.0
    for R, (tag, geo) in zip(Rs, tags):
        if geo is not None:
            ri, ro, k = geo
            rm = math.sqrt(ri * ro)
            Rmid = Rcum + math.log(rm / ri) / (2 * math.pi * k)
            temps[tag] = Tf - q * Rmid
        Rcum += R
    temps["sandface"] = Tf - q * Rcum
    return R_tot, temps, q


def thermal_profile(cfg: Config, t: float | None = None, dz: float = 2.0):
    """Flowing temperature and casing temperatures vs depth after time t."""
    t = cfg.t_prod if t is None else t
    zs = np.arange(0.0, cfg.z_bh + 1e-9, dz)
    Tg = cfg.T_seabed + cfg.grad * zs
    Tf = np.zeros_like(zs)
    Tf[-1] = Tg[-1]
    # march upward (z decreasing): dTf/dx = -(Tf-Tg)/A - beta*T*g/cp
    for i in range(len(zs) - 1, 0, -1):
        def dTdx(zz, T):
            tg = cfg.T_seabed + cfg.grad * zz
            R, _, _ = thermal_at(cfg, zz, T, tg, t)
            A = cfg.mdot * cfg.cp * R
            return -(T - tg) / A - cfg.beta_f * (T + 273.15) * G / cfg.cp
        z0, z1 = zs[i], zs[i - 1]
        h = z0 - z1
        k1 = dTdx(z0, Tf[i])
        k2 = dTdx(z1, Tf[i] + h * k1)
        Tf[i - 1] = Tf[i] + 0.5 * h * (k1 + k2)
    tags = ["tubing", "A-ann", "9-5/8", "B-ann", "13-3/8", "C-ann", "20",
            "cement20", "D-ann", "30", "cement30", "sandface", "cement958",
            "cement1338"]
    out = {tg: np.full_like(zs, np.nan) for tg in tags}
    q = np.zeros_like(zs)
    for i, z in enumerate(zs):
        _, temps, q[i] = thermal_at(cfg, z, Tf[i], Tg[i], t)
        for k, v in temps.items():
            out[k][i] = v
    return dict(z=zs, Tg=Tg, Tf=Tf, q=q, **out)


# --------------------------------------------------------------------------
# 2. Buckling mechanics (vertical well, Lubinski / Mitchell / Wu-Wold)
# --------------------------------------------------------------------------
def buckling_state(Fe, pipe: Pipe, rc, w_e):
    """Given effective force Fe (tension +) arrays, return dict with buckling
    mode, strain (shortening, +), bending stress, pitch, contact force."""
    Fc = np.maximum(-Fe, 0.0)                # compressive effective force
    base = np.cbrt(pipe.EI * np.maximum(w_e, 1.0) ** 2)
    Fs = 2.55 * base                         # Wu & Wold sinusoidal onset
    Fh = 5.55 * base                         # Wu & Wold helical onset
    mode = np.where(Fc > Fh, 2, np.where(Fc > Fs, 1, 0))
    eps_hel = rc ** 2 * Fc / (4 * pipe.EI)   # Lubinski / Mitchell helical
    eps = np.where(mode == 2, eps_hel, np.where(mode == 1, 0.5 * eps_hel, 0.0))
    sig_b = np.where(mode > 0, 2 * pipe.ro * rc * Fc / (4 * pipe.I), 0.0)
    with np.errstate(divide="ignore"):
        pitch = np.where(mode > 0, math.pi * np.sqrt(8 * pipe.EI / np.maximum(Fc, 1.0)), np.nan)
    wc = np.where(mode == 2, rc * Fc ** 2 / (4 * pipe.EI), 0.0)
    kappa = np.where(mode > 0, rc * Fc / (2 * pipe.EI), 0.0)      # 1/m
    return dict(Fc=Fc, Fs=Fs, Fh=Fh, mode=mode, eps=eps, sig_b=sig_b,
                pitch=pitch, wc=wc, dls=np.degrees(kappa) * 30.0)


def von_mises(pipe: Pipe, Fa, sig_b, pi, po):
    """Max von Mises over inner/outer fibre and both bending sides [Pa]."""
    ri, ro = pipe.ri, pipe.ro
    a = (pi * ri ** 2 - po * ro ** 2) / (ro ** 2 - ri ** 2)
    b = (pi - po) * ri ** 2 * ro ** 2 / (ro ** 2 - ri ** 2)
    best = np.zeros_like(Fa)
    for r in (ri, ro):
        st = a + b / r ** 2
        sr = a - b / r ** 2
        for s in (+1, -1):
            sz = Fa / pipe.As + s * sig_b * r / ro
            vm = np.sqrt(0.5 * ((sz - st) ** 2 + (st - sr) ** 2 + (sr - sz) ** 2))
            best = np.maximum(best, vm)
    return best


# --------------------------------------------------------------------------
# 3. Hung strings (top at wellhead, fixed at TOC)
# --------------------------------------------------------------------------
@dataclass
class HungString:
    key: str
    pipe: Pipe
    shoe: float
    toc: float                       # fixity depth (TOC or packer)
    sg_cementing: float              # mud in/out when cement set
    sg_in_prod: float                # fluid inside during production
    sg_out: float                    # fluid outside (annulus left behind)
    temp_tag: str
    rc_fn: Callable[[np.ndarray], np.ndarray]
    sg_cement: float = 1.90
    cemented_below: bool = True      # False for tubing (packer)
    p_in_extra: float = 0.0          # extra inside pressure at WH in production
    hang_load: float | None = None   # override top tension (tubing)


def hung_strings(cfg: Config):
    def rc_958(z):
        outer = np.where(z <= cfg.shoe1338, P1338.ri, HOLE["12.25"])
        return outer - P958.ro

    def rc_1338(z):
        outer = np.where(z <= cfg.shoe20, P20.ri, HOLE["17.5"])
        return outer - P1338.ro

    def rc_20(z):
        outer = np.where(z <= cfg.shoe30, cond(cfg).ri, HOLE["26"])
        return outer - P20.ro

    def rc_tbg(z):
        return np.full_like(z, P958.ri - P512.ro)

    S = []
    if cfg.toc20 > 0:
        S.append(HungString("20", P20, cfg.shoe20, cfg.toc20, cfg.sg_mud_20,
                            cfg.sg_mud_1338, cfg.sg_seawater, "20", rc_20))
    S.append(HungString("13-3/8", P1338, cfg.shoe1338, cfg.toc1338,
                        cfg.sg_mud_1338, cfg.sg_mud_958, cfg.sg_mud_1338,
                        "13-3/8", rc_1338))
    S.append(HungString("9-5/8", P958, cfg.shoe958, cfg.toc958, cfg.sg_mud_958,
                        cfg.sg_brine, cfg.sg_mud_958, "9-5/8", rc_958))
    if cfg.include_tubing:
        S.append(HungString("tubing", P512, cfg.packer, cfg.packer, cfg.sg_brine,
                            0.80, cfg.sg_brine, "tubing", rc_tbg,
                            cemented_below=False))
    return S


@dataclass
class StringResult:
    key: str
    z: np.ndarray
    dT: np.ndarray
    Fe0: np.ndarray          # effective force at cementing
    Fe_pre: np.ndarray       # before production (after fluid changes)
    Fe: np.ndarray           # production
    Fa_pre: np.ndarray
    Fa: np.ndarray
    dFa_th: float            # uniform change of true axial force (production)
    free_elong: float        # thermal elongation if unrestrained [m]
    k_axial: float           # EA/L
    buck: dict
    vm: np.ndarray
    p_in: np.ndarray
    p_out: np.ndarray


def solve_string(cfg: Config, s: HungString, th: dict, u_wh: float, dz=2.0):
    p = s.pipe
    z = np.arange(0.0, s.toc + 1e-9, dz)
    dT = np.interp(z, th["z"], th[s.temp_tag] - th["Tg"])
    rho_w = 1000.0
    h = cfg.h_riser
    # --- state at cementing: same mud in & out above TOC -------------------
    w_above = (RHO_S - s.sg_cementing * rho_w) * G * p.As
    if s.cemented_below:
        w_below = (RHO_S * p.As - s.sg_cement * rho_w * p.Ao
                   + s.sg_cementing * rho_w * p.Ai) * G
        F_toc = w_below * (s.shoe - s.toc)
    else:   # tubing: landed with neutral weight at the packer (common practice)
        F_toc = 0.0
    Fe0 = F_toc + w_above * (s.toc - z)
    # --- fluid changes before production (ballooning, fixed ends) ----------
    p_in0 = s.sg_cementing * rho_w * G * (h + z)
    p_out0 = s.sg_cementing * rho_w * G * (h + z)
    p_in = s.sg_in_prod * rho_w * G * (h + z) + s.p_in_extra
    p_out = s.sg_out * rho_w * G * (h + z)
    dpi, dpo = p_in - p_in0, p_out - p_out0
    L = s.toc
    dFa_bal = 2 * NU * np.trapezoid(dpi * p.Ai - dpo * p.Ao, z) / L
    Fe_pre = Fe0 + dFa_bal - dpi * p.Ai + dpo * p.Ao
    Fa_pre = Fe_pre + p_in * p.Ai - p_out * p.Ao
    # production effective weight (for buckling thresholds)
    w_prod = (RHO_S * p.As - s.sg_out * rho_w * p.Ao + s.sg_in_prod * rho_w * p.Ai) * G
    rc = s.rc_fn(z)
    th_int = ALPHA_S * np.trapezoid(dT, z)

    def mismatch(dF):
        Fe = Fe_pre + dF
        b = buckling_state(Fe, p, rc, w_prod)
        return dF * L / p.EA + th_int - np.trapezoid(b["eps"], z) - u_wh

    lo, hi = -500e6, 500e6
    dF = brentq(mismatch, lo, hi, xtol=1.0)
    Fe = Fe_pre + dF
    Fa = Fe + p_in * p.Ai - p_out * p.Ao
    b = buckling_state(Fe, p, rc, w_prod)
    vm = von_mises(p, Fa, b["sig_b"], p_in, p_out)
    return StringResult(s.key, z, dT, Fe0, Fe_pre, Fe, Fa_pre, Fa, dF, th_int,
                        p.EA / L, b, vm, p_in, p_out)


# --------------------------------------------------------------------------
# 4. Foundation: composite bar on non-linear t-z springs
# --------------------------------------------------------------------------
@dataclass
class FoundationResult:
    z: np.ndarray
    u: np.ndarray
    N: np.ndarray                # composite axial force change at element mid
    comp: dict                   # component forces {name: array}
    N_th: np.ndarray             # fully-restrained thermal force
    t_mob: np.ndarray            # mobilised friction / capacity
    top_force: float             # force WH applies on foundation top (tension +)


def foundation_components(cfg: Config, z: float, th_row: dict):
    """List of (name, EA, alpha, dT) for the axially bonded composite at z,
    and the diameter in contact with soil."""
    comps = []
    bonded_20 = cfg.toc20 <= 0.0 or z >= cfg.toc20
    if z <= cfg.shoe30:
        comps.append(("30", E_S * cond(cfg).As, ALPHA_S, th_row["30"]))
        A = math.pi * (cond_hole(cfg) ** 2 - cond(cfg).ro ** 2)
        comps.append(("cement30", E_C * A, ALPHA_C, th_row["cement30"]))
        if bonded_20:
            comps.append(("20", E_S * P20.As, ALPHA_S, th_row["20"]))
            A = math.pi * (cond(cfg).ri ** 2 - P20.ro ** 2)
            comps.append(("cement20", E_C * A, ALPHA_C, th_row["cement20"]))
        D = 2 * cond_hole(cfg)
    else:
        if not bonded_20:
            return [], 2 * HOLE["26"]
        comps.append(("20", E_S * P20.As, ALPHA_S, th_row["20"]))
        A = math.pi * (HOLE["26"] ** 2 - P20.ro ** 2)
        comps.append(("cement20", E_C * A, ALPHA_C, th_row["cement20"]))
        D = 2 * HOLE["26"]
    return comps, D


def solve_foundation(cfg: Config, th: dict, top_force: float | None,
                     u_top: float | None, dz: float = 1.0):
    """Either top_force (Neumann) or u_top (Dirichlet) is given."""
    z_end = cfg.shoe20 if (cfg.toc20 <= 0.0) else cfg.shoe30
    zn = np.arange(0.0, z_end + 1e-9, dz)
    n = len(zn)
    zm = 0.5 * (zn[1:] + zn[:-1])
    EA = np.zeros(n - 1)
    Nth = np.zeros(n - 1)
    comps_list = []
    Dn = np.zeros(n)
    for e, zz in enumerate(zm):
        row = {k: float(np.interp(zz, th["z"], th[k] - th["Tg"])) for k in
               ("30", "cement30", "20", "cement20")}
        comps, D = foundation_components(cfg, zz, row)
        comps_list.append(comps)
        EA[e] = sum(c[1] for c in comps)
        Nth[e] = sum(c[1] * c[2] * c[3] for c in comps)
    for i, zz in enumerate(zn):
        _, Dn[i] = foundation_components(cfg, min(zz, z_end - 1e-6),
                                         {k: 0.0 for k in ("30", "cement30", "20", "cement20")})
    su = np.minimum(cfg.su0 + cfg.su_grad * zn, cfg.su_max)
    trib = np.full(n, dz)
    trib[0] = trib[-1] = dz / 2
    tmax = cfg.adhesion * su * math.pi * Dn * trib          # N per node
    kel = tmax / (cfg.tz_peak_frac * Dn)                    # N/m per node
    u = np.zeros(n)
    ksec = kel.copy()
    for it in range(200):
        K = np.zeros((n, n))
        F = np.zeros(n)
        for e in range(n - 1):
            k = EA[e] / dz
            # element tension N_e = k*(u_e - u_{e+1}) - Nth_e.
            # Node eq. (x -1): -N_{i-1} + N_i + k_soil u_i = P_i
            K[e, e] += k
            K[e, e + 1] -= k
            K[e + 1, e] -= k
            K[e + 1, e + 1] += k
            F[e] += Nth[e]
            F[e + 1] -= Nth[e]
        K[np.arange(n), np.arange(n)] += ksec
        if u_top is None:
            F[0] += top_force
        else:
            K[0, :] = 0.0
            K[0, 0] = 1.0
            F[0] = u_top
        u_new = np.linalg.solve(K, F)
        ksec_new = np.where(np.abs(u_new) * kel > tmax,
                            tmax / np.maximum(np.abs(u_new), 1e-12), kel)
        if np.max(np.abs(u_new - u)) < 1e-8 and it > 2:
            u = u_new
            break
        u = u_new
        ksec = 0.5 * ksec + 0.5 * ksec_new
    eps = (u[:-1] - u[1:]) / dz
    N = EA * eps - Nth
    comp = {}
    for e, comps in enumerate(comps_list):
        for name, ea, al, dT in comps:
            comp.setdefault(name, np.full(n - 1, np.nan))[e] = ea * (eps[e] - al * dT)
    mob = np.minimum(np.abs(u) * kel, tmax) / np.maximum(tmax, 1e-9)
    tf = N[0] + ksec[0] * u[0] if u_top is not None else top_force
    return FoundationResult(zm, u, N, comp, Nth, mob, tf)


# --------------------------------------------------------------------------
# 5. Wellhead equilibrium
# --------------------------------------------------------------------------
def solve_well(cfg: Config, t: float | None = None):
    th = thermal_profile(cfg, t)
    strings = hung_strings(cfg)

    def strings_at(u):
        return [solve_string(cfg, s, th, u) for s in strings]

    if cfg.restrained:
        u_wh = 0.0
        res = strings_at(0.0)
        fnd = solve_foundation(cfg, th, None, 0.0)
        R = -fnd.top_force - sum(r.dFa_th for r in res)
    else:
        kr = cfg.k_restraint

        def resid(u):
            res = strings_at(u)
            P = -sum(r.dFa_th for r in res) - kr * u
            f = solve_foundation(cfg, th, P, None)
            return f.u[0] - u
        u_wh = brentq(resid, -0.05, 3.0, xtol=1e-6)
        res = strings_at(u_wh)
        R = kr * u_wh
        fnd = solve_foundation(cfg, th, -sum(r.dFa_th for r in res) - R, None)
    return dict(cfg=cfg, th=th, strings={r.key: r for r in res}, fnd=fnd,
                u_wh=u_wh, R=R)


# --------------------------------------------------------------------------
# Summaries
# --------------------------------------------------------------------------
def summarise(sol):
    out = dict(case=sol["cfg"].name, restrained=sol["cfg"].restrained,
               u_wh_mm=sol["u_wh"] * 1000, R_MN=sol["R"] / 1e6,
               WHFT=float(sol["th"]["Tf"][0]))
    for k, r in sol["strings"].items():
        b = r.buck
        buck = b["mode"] > 0
        out[k] = dict(
            free_len=float(r.z[-1]),
            dT_top=float(r.dT[0]), dT_avg=float(np.mean(r.dT)),
            free_thermal_elong_m=float(r.free_elong),
            k_MN_per_m=r.k_axial / 1e6,
            full_restraint_force_MN=float(-r.k_axial * r.free_elong / 1e6),
            dFa_MN=r.dFa_th / 1e6,
            Fe_top_pre_MN=float(r.Fe_pre[0] / 1e6), Fe_top_MN=float(r.Fe[0] / 1e6),
            Fe_toc_pre_MN=float(r.Fe_pre[-1] / 1e6), Fe_toc_MN=float(r.Fe[-1] / 1e6),
            Fa_top_MN=float(r.Fa[0] / 1e6), Fa_toc_MN=float(r.Fa[-1] / 1e6),
            buckled_from_m=float(r.z[buck][0]) if buck.any() else None,
            buckled_len_m=float(buck.sum() * (r.z[1] - r.z[0])),
            helical_len_m=float((b["mode"] == 2).sum() * (r.z[1] - r.z[0])),
            max_Fc_MN=float(b["Fc"].max() / 1e6),
            min_pitch_m=float(np.nanmin(b["pitch"])) if buck.any() else None,
            max_sig_b_MPa=float(b["sig_b"].max() / 1e6),
            max_contact_kN_m=float(b["wc"].max() / 1e3),
            max_dls_deg30m=float(b["dls"].max()),
            max_vm_MPa=float(r.vm.max() / 1e6),
            yield_MPa=r.key and hung_pipe(r.key).yield_mpa,
            buckling_relief_mm=float(np.trapezoid(b["eps"], r.z) * 1000),
        )
    f = sol["fnd"]
    out["foundation"] = dict(
        top_force_MN=f.top_force / 1e6,
        N_top_MN=float(f.N[0] / 1e6),
        Nth_top_MN=float(f.N_th[0] / 1e6),
        comp_top_MN={k: float(v[0] / 1e6) for k, v in f.comp.items()},
        comp_top_MPa={k: float(v[0] / (_area(k, sol["cfg"])) / 1e6) for k, v in f.comp.items()},
        max_mob=float(f.t_mob.max()),
    )
    return out


def hung_pipe(key):
    return {"20": P20, "13-3/8": P1338, "9-5/8": P958, "tubing": P512}[key]


def _area(name, cfg=None):
    c, h = (cond(cfg), cond_hole(cfg)) if cfg is not None else (P30, HOLE["36"])
    no_cond = cfg is not None and cfg.shoe30 <= 0.0      # no conductor: 20" cemented in the 26" hole
    return {"30": c.As, "20": P20.As,
            "cement30": math.pi * (h ** 2 - c.ro ** 2),
            "cement20": math.pi * ((HOLE["26"] if no_cond else c.ri) ** 2 - P20.ro ** 2)}[name]


def pipe_table():
    rows = []
    for p in (P30, P20, P1338, P958, P7, P512):
        rows.append(dict(label=p.label, od_mm=2 * p.ro * 1000, id_mm=2 * p.ri * 1000,
                         wt_mm=p.wt_in * 25.4, ppf=p.ppf, grade=p.grade,
                         As_cm2=p.As * 1e4, EA_MN=p.EA / 1e6, EI_MNm2=p.EI / 1e6,
                         force_per_degC_kN=E_S * ALPHA_S * p.As / 1e3,
                         yield_MPa=p.yield_mpa))
    return rows


if __name__ == "__main__":
    import pprint
    for p in pipe_table():
        print(p)
    for restrained in (False, True):
        cfg = Config(restrained=restrained, name="base")
        sol = solve_well(cfg)
        pprint.pprint(summarise(sol), sort_dicts=False, width=110)
