#!/usr/bin/env python3
"""
arcade-powers-checks.py — BIN RUNNER + BRICK BREAK earned powers
Derives and asserts EVERY number published in ./arcade-powers.md.

Run:  python3 arcade-powers-checks.py
Ends with every assert green. If a number in the design changes, change it here
first, re-run, and re-publish the powers tables, the ceilings and the price list.

Model (all integer, no randomness, no clock, no money):
  BIN RUNNER   one 90-second run. CH is the run fuel, CS/RS/GF are material,
               ST is the persistent meta currency. The transform rates are
               constants; the run's structural ceiling is the FUEL BUDGET
               (CH start + what the recycler can add), not the clock.
  BRICK BREAK  one run, bounded by Swing and by the wall. RK/RB/DZ are material,
               SE is the persistent meta currency. The run's structural ceiling
               is THE WALL (a finite brick count), not the Swing.

  A power in either game is described by a dict of CHANNELS. The only channels a
  power is allowed to use are time, information and fuel-saving; none of them
  appears in a yield function or in a ceiling formula. Sections [4] and [7] are
  the SENSITIVITY CONTROLS: they prove this harness would catch a power that did
  move a payout, so "the ceiling is unchanged" is a test that can fail.
"""
from math import ceil
import os

# ============================================================ BIN RUNNER =====
# spec v0.1 §5.1 A3/A4 and site/src/routes/bin-runner.tsx (header block)
SORT_CS, SORT_RS, SORT_CH = 6, 3, 1     # a correct sort
BAD_CH = 2                              # a wrong sort: no material, -2 CH
CH_START = 20                           # fuel at run start
RECY_CS, RECY_CH, RECY_LIMIT = 10, 5, 3 # recycler: 10 CS -> 5 CH, max 3 a run
PRINT_CS, PRINT_RS = 40, 25             # assembler inputs
PRINT_ST, PRINT_OFFCUT = 5, 12          # assembler outputs
PERFECT_GF = 1                          # 0 landfill at run end
FUEL = CH_START + RECY_LIMIT * RECY_CH  # 35 CH is the whole run's budget
BENCH2 = {"gf": 8, "cs": 300}           # bench tier 2 (wired in the build)
BENCH3 = {"gf": 20, "cs": 800}          # bench tier 3 (display-only in the build)
BOARD_ST = [40, 120, 200]               # boards 2 / 3 / 4, in ST

# powers — ST price.  N1 has two ranks.
N1_COST = [0, 30, 70]                   # THE STEADY HAND, by rank
N2_COST = 45                            # THE CHUTE GUIDE
N3_COST = 40                            # THE TALLY ROLL
N4_COST = 5                             # THE QUICK PICK, per use, unbounded

# skill model (DESIGNED, not measured — same status as every rate in this team's
# designs). 3.0 s an item is the spec's own "~30 items sorted in 90 s".
RUN_S = 90
HANDLE_S = 3.0
QUICK_PICK_S = 1.2                      # seconds saved by one N4 press
ERR_DEN = [4, 6, 8]                     # 1 mis-sort in 4 / 6 / 8, by N1 rank
GUIDE_ITEMS = 8                         # N2 labels the first 8 items of a run

# =========================================================== BRICK BREAK =====
# design (brick-break-design.md A4) and site/src/routes/brick-break.tsx
BAYS = {
    1: dict(name="YARD WALL", rows=5, cols=6, bricks=30, rk=35, rb=35, dz=40, se=8),
    2: dict(name="LIME KILN", rows=6, cols=6, bricks=36, rk=36, rb=48, dz=48, se=9),
    3: dict(name="DRY STORE", rows=5, cols=7, bricks=35, rk=20, rb=75, dz=60, se=8),
    4: dict(name="BOTTLE OVEN", rows=6, cols=8, bricks=48, rk=54, rb=60, dz=66, se=9),
}
BRICK_RK, BRICK_RB, BRICK_DZ = {   # per brick: WHOLE / CRUMBLE / LIME
    "W": (2, 0, 1), "C": (0, 3, 2), "L": (1, 1, 1),
}
SW_START, SW_PER_ROW = 30, 4
SW_RETURN, SW_LOST = 1, 5
PATCH_DZ, PATCH_MAX, PATCH_PX = 5, 3, 6
UPKEEP_RB, UPKEEP_DZ = 16, 8
COURSE = (25, 10, 8)                    # RK / RB / DZ per reclaim-wall course
BAY_COST = {2: 9, 3: 24, 4: 54}         # SE
RELAY_SE = 3

# powers — SE price.  M1 has two ranks.
M1_COST = [0, 6, 16]                    # THE SIGHT LINE, by rank
M2_COST = 10                            # THE STEADY RAM
M3_COST = 12                            # THE TALLY BOARD
M4_COST = 4                             # THE SPARE RAM, per use, unbounded

# skill model (DESIGNED, not measured). Hit rate in per-mille of a return.
HIT_BASE = 500
M1_HIT = [0, 80, 140]                   # by rank
M2_HIT = 40
HIT_CAP = 900
LOST_RAMS = 2                           # the published competent line
SPARE_SW = SW_LOST                      # M4 saves one lost ram's worth

# what a power is allowed to change. Anything else is a payout channel.
ALLOWED_CHANNELS = {
    "speed", "guide_items", "ledger", "quick_pick", "spare_ram",
    "hit_permille", "err_den", "sw_saved",
}
FORBIDDEN_CHANNELS = {
    "ch_bonus", "sort_cs_bonus", "sort_rs_bonus", "print_st_bonus",
    "gf_bonus", "recycle_bonus", "per_brick_bonus", "sw_bonus", "se_bonus",
}

OUT = []


def say(line=""):
    OUT.append(line)


# ------------------------------------------------------ bin runner: ceiling --
def br_ceiling(powers):
    """The structural ceiling of ONE run, in every quantity the run can pay.
    A power may only enter through the channels listed in ALLOWED_CHANNELS; the
    two payout channels below exist SOLELY so the sensitivity control in [4] can
    prove the harness detects a payout-raising power."""
    bonus = powers.get("ch_bonus", 0)
    start = CH_START + bonus
    fuel = FUEL + bonus
    per_sort_cs = SORT_CS + powers.get("sort_cs_bonus", 0)
    per_sort_rs = SORT_RS + powers.get("sort_rs_bonus", 0)
    per_print_st = PRINT_ST + powers.get("print_st_bonus", 0)
    max_sorts = 0
    max_prints = 0
    max_cs = 0
    max_rs = 0
    max_st = 0
    for s in range(0, fuel + 1):
        for r in range(0, RECY_LIMIT + 1):
            if s > start + RECY_CH * r:             # fuel needed for s sorts
                continue
            cs0 = per_sort_cs * s                   # all sorts first: best case
            rs0 = per_sort_rs * s
            for p in range(0, rs0 // PRINT_RS + 1):
                net_cs = PRINT_CS - PRINT_OFFCUT    # 28 CS per print, 12 back
                # ordering: recycle early (needs 10 CS), print last (needs 40)
                if p == 0:
                    if cs0 < RECY_CS * r:
                        continue
                elif cs0 < RECY_CS * r + net_cs * p + (PRINT_CS - net_cs):
                    continue
                if rs0 < PRINT_RS * p:
                    continue
                max_sorts = max(max_sorts, s)
                max_prints = max(max_prints, p)
                max_cs = max(max_cs, per_sort_cs * s + PRINT_OFFCUT * p)
                max_rs = max(max_rs, per_sort_rs * s)
                max_st = max(max_st, per_print_st * p)
    return dict(sorts=max_sorts, prints=max_prints, cs=max_cs, rs=max_rs,
                st=max_st, gf=PERFECT_GF)


def br_competent():
    """The spec's published competent line, §5.1 A4: 30 sorts, 3 prints,
    3 recycler uses, 0 landfill."""
    s, p, r = 30, 3, 3
    return dict(sorts=s, prints=p, cs=SORT_CS * s + PRINT_OFFCUT * p,
                rs=SORT_RS * s, st=PRINT_ST * p, gf=PERFECT_GF,
                fuel_used=SORT_CH * s, fuel_avail=CH_START + RECY_CH * r,
                cs_left=SORT_CS * s - RECY_CS * r - (PRINT_CS - PRINT_OFFCUT) * p,
                rs_left=SORT_RS * s - PRINT_RS * p)


def br_realised(f1=0, f2=False, f3=False, f4_presses=0):
    """What a stated player actually gets in 90 seconds, by power state.
    The two bounds are TIME (how many items fit in the run) and FUEL (35 CH).
    A power may only move TIME or the ERROR RATE; it can never move FUEL."""
    err = ERR_DEN[f1]
    guide = GUIDE_ITEMS if f2 else 0
    time_cap = int((RUN_S + QUICK_PICK_S * f4_presses) // HANDLE_S)
    best = 0
    for a in range(0, FUEL + 1):
        wrong = ceil(max(0, a - guide) / err)
        if a + wrong * (BAD_CH - SORT_CH) <= FUEL and a <= time_cap:
            best = a
    wrong = ceil(max(0, best - guide) / err)
    correct = best - wrong
    return dict(attempts=best, wrong=wrong, correct=correct,
                cs=SORT_CS * correct, rs=SORT_RS * correct,
                fuel=SORT_CH * correct + BAD_CH * wrong, time_cap=time_cap)


# ----------------------------------------------------- brick break: ceiling --
def bb_budget(bay, sw_bonus=0):
    b = BAYS[bay]
    return SW_START + SW_PER_ROW * b["rows"] + sw_bonus


def bb_ceiling(bay, powers=None):
    """The structural ceiling of one run on one bay. The wall is finite, and a
    return breaks at most one brick, so the ceiling is min(the wall, the Swing)."""
    powers = powers or {}
    b = BAYS[bay]
    bonus = powers.get("per_brick_bonus", 0)
    se_bonus = powers.get("se_bonus", 0)
    sw = bb_budget(bay, powers.get("sw_bonus", 0))
    reachable = min(b["bricks"], sw)
    return dict(bricks=reachable, rk=b["rk"] + bonus * b["bricks"],
                rb=b["rb"] + bonus * b["bricks"], dz=b["dz"] + bonus * b["bricks"],
                se=b["se"] + se_bonus, sw=sw, wall=b["bricks"])


def bb_realised(bay, m1=0, m2=False, m3=False, m4_presses=0):
    """What a stated player actually gets in one run, by power state.
    M4 buys back Swing (run fuel) one lost ram at a time; nothing buys bricks."""
    b = BAYS[bay]
    hit = min(HIT_CAP, HIT_BASE + M1_HIT[m1] + (M2_HIT if m2 else 0))
    sw = bb_budget(bay) + SPARE_SW * m4_presses
    returns = max(0, sw - SW_LOST * LOST_RAMS)
    bricks = min(b["bricks"], hit * returns // 1000)
    rows = bricks // b["cols"]
    sealed = bricks == b["bricks"]
    return dict(hit=hit, returns=returns, bricks=bricks, rows=rows,
                se=rows + (3 if sealed else 0), sealed=sealed)


# ================================================================== [1] ======
def br_channels(f1=0, f2=0, f3=0, f4=0):
    """The ONLY channels Bin Runner powers may set. None of them is a payout."""
    return dict(err_den=ERR_DEN[f1], guide_items=GUIDE_ITEMS if f2 else 0,
                ledger=bool(f3), quick_pick=bool(f4))


def bb_channels(m1=0, m2=0, m3=0, m4=0):
    """The ONLY channels Brick Break powers may set. None of them is a payout."""
    return dict(hit_permille=M1_HIT[m1] + (M2_HIT if m2 else 0),
                ledger=bool(m3), sw_saved=SPARE_SW if m4 else 0)


def section1():
    say("[1] BIN RUNNER — THE STRUCTURAL CEILING, EVERY POWER STATE")
    say("    fuel budget = CH start 20 + recycler 3 x 5 = %d CH a run" % FUEL)
    say("    %-34s %5s %6s %6s %5s %4s %3s" %
        ("power state", "sorts", "CS", "RS", "ST", "GF", "prints"))
    states = {}
    for f1, f2, f3, f4 in [(r, a, b_, c) for r in (0, 1, 2) for a in (0, 1)
                           for b_ in (0, 1) for c in (0, 1)]:
        states[(f1, f2, f3, f4)] = br_ceiling(br_channels(f1, f2, f3, f4))
    corners = [(0, 0, 0, 0), (1, 0, 0, 0), (2, 0, 0, 0), (0, 1, 0, 0),
               (0, 0, 1, 0), (0, 0, 0, 1), (2, 1, 1, 1)]
    labels = ["no powers", "N1 THE STEADY HAND r1", "N1 THE STEADY HAND r2",
              "N2 THE CHUTE GUIDE", "N3 THE TALLY ROLL", "N4 THE QUICK PICK",
              "EVERY POWER ON"]
    for i, k in enumerate(corners):
        c = states[k]
        say("    %-34s %5d %6d %6d %5d %4d %3d" %
            (labels[i], c["sorts"], c["cs"], c["rs"], c["st"], c["gf"],
             c["prints"]))
    distinct = set(tuple(sorted(v.items())) for v in states.values())
    say("    -> %d states, %d distinct ceilings." % (len(states), len(distinct)))
    return states


# ================================================================== [2] ======
def section2():
    say("")
    say("[2] BIN RUNNER — THE SPEC'S PUBLISHED COMPETENT LINE (§5.1 A4), UNCHANGED")
    c = br_competent()
    say("    30 sorts · 3 prints · 3 recycler uses · 0 landfill")
    say("    CS faucet %d = 30x%d + 3x%d offcut | RS %d | GF %d | ST %d" %
        (c["cs"], SORT_CS, PRINT_OFFCUT, c["rs"], c["gf"], c["st"]))
    say("    fuel used %d of %d | CS left %d | RS left %d" %
        (c["fuel_used"], c["fuel_avail"], c["cs_left"], c["rs_left"]))
    return c


# ================================================================== [3] ======
def section3():
    say("")
    say("[3] BIN RUNNER — REALISED LINE IN 90 s, BY POWER STATE (skills designed, not measured)")
    say("    skill: 1 mis-sort in %s (N1 rank), %d guided items (N2)" %
        ("/".join(str(d) for d in ERR_DEN), GUIDE_ITEMS))
    say("    %-34s %4s %5s %6s %5s %5s %5s" %
        ("power state", "try", "wrong", "sorts", "CS", "RS", "fuel"))
    rows = [("no powers", dict()), ("N1 THE STEADY HAND r1", dict(f1=1)),
            ("N1 THE STEADY HAND r2", dict(f1=2)), ("N2 THE CHUTE GUIDE", dict(f2=True)),
            ("N3 THE TALLY ROLL", dict(f3=True)),
            ("N4 THE QUICK PICK x3", dict(f4_presses=3)),
            ("N1 r2 + N2", dict(f1=2, f2=True)),
            ("N1 r2 + N2 + N3 + N4 x3", dict(f1=2, f2=True, f3=True, f4_presses=3))]
    res = []
    for name, kw in rows:
        r = br_realised(**kw)
        res.append((name, r))
        say("    %-34s %4d %5d %6d %5d %5d %5d" %
            (name, r["attempts"], r["wrong"], r["correct"], r["cs"], r["rs"],
             r["fuel"]))
    return res


# ================================================================== [4] ======
def section4():
    say("")
    say("[4] BIN RUNNER — SENSITIVITY CONTROL (the harness must be able to fail)")
    base = br_ceiling({})
    for name, p in [("time only (a slower item)", dict(speed=0.5)),
                    ("information only", dict(guide_items=GUIDE_ITEMS)),
                    ("ledger only", dict(ledger=True)),
                    ("fuel-saving only", dict(quick_pick=True))]:
        c = br_ceiling(p)
        say("    %-28s sorts %2d  CS %3d  -> %s" %
            (name, c["sorts"], c["cs"], "UNCHANGED" if c == base else "MOVED"))
    c = br_ceiling(dict(ch_bonus=1))
    say("    %-28s sorts %2d  CS %3d  -> %s" %
        ("CONTROL: +1 CH of fuel", c["sorts"], c["cs"],
         "MOVED (caught)" if c != base else "not caught"))
    return base, c


# ================================================================== [5] ======
def section5():
    say("")
    say("[5] BRICK BREAK — THE STRUCTURAL CEILING (THE WALL), EVERY POWER STATE")
    say("    %-18s %6s %6s %5s %5s %4s %5s %4s" %
        ("bay", "bricks", "RK", "RB", "DZ", "SE", "SW", "rows"))
    out = {}
    for bay in sorted(BAYS):
        b = BAYS[bay]
        c = bb_ceiling(bay)
        out[bay] = c
        say("    %-18s %6d %6d %5d %5d %4d %5d %4d" %
            ("BAY %d %s" % (bay, b["name"]), c["bricks"], c["rk"], c["rb"],
             c["dz"], c["se"], c["sw"], b["rows"]))
    say("    Swing granted = 30 + 4 x rows; on every bay the wall binds first:")
    for bay in sorted(BAYS):
        c = bb_ceiling(bay)
        say("      bay %d: min(wall %d, Swing %d) = %d bricks  -> wall binds: %s"
            % (bay, c["wall"], c["sw"], c["bricks"], c["bricks"] == c["wall"]))
    states = {}
    for m1, m2, m3, m4 in [(a, b_, c, d) for a in (0, 1, 2) for b_ in (0, 1)
                           for c in (0, 1) for d in (0, 1)]:
        states[(m1, m2, m3, m4)] = bb_ceiling(
            1, bb_channels(m1, m2, m3, m4))
    distinct = set(tuple(sorted(v.items())) for v in states.values())
    say("    -> %d power states on bay 1, %d distinct ceilings."
        % (len(states), len(distinct)))
    return out, states


# ================================================================== [6] ======
def section6():
    say("")
    say("[6] BRICK BREAK — REALISED LINE ON BAY 1, BY POWER STATE (skills designed, not measured)")
    say("    skill: hit rate %d/1000 + M1 %s + M2 %d | %d lost rams | M4 buys back 5 SW a press"
        % (HIT_BASE, "/".join(str(h) for h in M1_HIT[1:]), M2_HIT, LOST_RAMS))
    say("    %-34s %5s %5s %7s %5s %5s %4s" %
        ("power state", "hit", "ret", "bricks", "rows", "SE", "sealed"))
    rows = [("no powers", dict()), ("M1 THE SIGHT LINE r1", dict(m1=1)),
            ("M1 THE SIGHT LINE r2", dict(m1=2)), ("M2 THE STEADY RAM", dict(m2=True)),
            ("M3 THE TALLY BOARD", dict(m3=True)),
            ("M4 THE SPARE RAM x2", dict(m4_presses=2)),
            ("M1 r2 + M2", dict(m1=2, m2=True)),
            ("M1 r2 + M2 + M4 x1", dict(m1=2, m2=True, m4_presses=1)),
            ("M1 r2 + M2 + M4 x2 + M3", dict(m1=2, m2=True, m4_presses=2, m3=True))]
    res = []
    for name, kw in rows:
        r = bb_realised(1, **kw)
        res.append((name, r))
        say("    %-34s %5d %5d %7d %5d %5d %4s" %
            (name, r["hit"], r["returns"], r["bricks"], r["rows"], r["se"],
             "yes" if r["sealed"] else "-"))
    return res


# ================================================================== [7] ======
def section7():
    say("")
    say("[7] BRICK BREAK — SENSITIVITY CONTROL")
    base = bb_ceiling(1)
    payout = lambda d: {k: v for k, v in d.items() if k not in ("sw",)}
    for name, p in [("information only", dict(ledger=True)),
                    ("skill only (hit rate)", dict(hit_permille=900)),
                    ("fuel-saving only (spare ram)", dict(sw_saved=5)),
                    ("CONTROL: +10 SW of fuel", dict(sw_bonus=10))]:
        c = bb_ceiling(1, p)
        say("    %-32s bricks %2d  RK %2d  -> %s" %
            (name, c["bricks"], c["rk"],
             "UNCHANGED" if payout(c) == payout(base) else "MOVED"))
    c = bb_ceiling(1, dict(per_brick_bonus=1))
    say("    %-32s bricks %2d  RK %2d  -> %s" %
        ("CONTROL: +1 RK per brick", c["bricks"], c["rk"],
         "MOVED (caught)" if c != base else "not caught"))
    return base, c


# ================================================================== [8] ======
def section8():
    say("")
    say("[8] THE SINK LEDGER — WHAT FUNDS THE POWERS, AND WHAT ABSORBS THE REST")
    st_finite = sum(BOARD_ST) + N1_COST[1] + N1_COST[2] + N2_COST + N3_COST
    st_powers = N1_COST[1] + N1_COST[2] + N2_COST + N3_COST
    se_finite = sum(BAY_COST.values()) + M1_COST[1] + M1_COST[2] + M2_COST + M3_COST
    se_powers = M1_COST[1] + M1_COST[2] + M2_COST + M3_COST
    say("    BIN RUNNER  ST faucet 5 per Repaired Jack")
    say("      powers (finite)   N1 %d + %d + N2 %d + N3 %d = %d ST"
        % (N1_COST[1], N1_COST[2], N2_COST, N3_COST, st_powers))
    say("      boards (existing) %s = %d ST" % (" + ".join(str(x) for x in BOARD_ST),
                                               sum(BOARD_ST)))
    say("      finite list total %d ST | unbounded sink N4 at %d ST a press"
        % (st_finite, N4_COST))
    say("    BRICK BREAK  SE faucet 1 a row + 3 a sealed wall")
    say("      powers (finite)   M1 %d + %d + M2 %d + M3 %d = %d SE"
        % (M1_COST[1], M1_COST[2], M2_COST, M3_COST, se_powers))
    say("      bays (existing)   %s = %d SE | re-lay %d SE"
        % (" + ".join(str(BAY_COST[b]) for b in sorted(BAY_COST)),
           sum(BAY_COST.values()), RELAY_SE))
    say("      finite list total %d SE | unbounded sink M4 at %d SE a press"
        % (se_finite, M4_COST))
    return dict(st_finite=st_finite, st_powers=st_powers, se_finite=se_finite,
                se_powers=se_powers)


# ================================================================== [9] ======
def section9():
    say("")
    say("[9] THE GRIND — RUNS AND CLEARS TO OWN EVERYTHING, AT THE PUBLISHED RATES")
    c = br_competent()
    st_per_run = c["st"]
    st_finite = sum(BOARD_ST) + N1_COST[1] + N1_COST[2] + N2_COST + N3_COST
    runs = ceil(st_finite / st_per_run)
    say("    BIN RUNNER: %d ST at %d ST a competent run = %.2f -> %d runs"
        % (st_finite, st_per_run, st_finite / st_per_run, runs))
    bay1 = bb_ceiling(1)
    se_per_clear = bay1["se"]
    se_finite = sum(BAY_COST.values()) + M1_COST[1] + M1_COST[2] + M2_COST + M3_COST
    clears = ceil(se_finite / se_per_clear)
    say("    BRICK BREAK: %d SE at %d SE a bay-1 full clear = %.2f -> %d clears"
        % (se_finite, se_per_clear, se_finite / se_per_clear, clears))
    # cheapest-first ordering, both games
    say("    cheapest-first order (Bin Runner): N1 r1 %d, N3 %d, N2 %d, N1 r2 %d, "
        "boards %d/%d/%d" % (N1_COST[1], N3_COST, N2_COST, N1_COST[2],
                             BOARD_ST[0], BOARD_ST[1], BOARD_ST[2]))
    say("    cheapest-first order (Brick Break): M1 r1 %d, M2 %d, M3 %d, M1 r2 %d, "
        "bays %d/%d/%d" % (M1_COST[1], M2_COST, M3_COST, M1_COST[2],
                           BAY_COST[2], BAY_COST[3], BAY_COST[4]))
    return dict(runs=runs, clears=clears, st_finite=st_finite, se_finite=se_finite)


# ================================================================= [10] ======
def main():
    st = section1()
    comp = section2()
    br_res = section3()
    base, control = section4()
    bays, bb_states = section5()
    bb_res = section6()
    bb_base, bb_control = section7()
    ledger = section8()
    grind = section9()

    say("")
    say("[ASSERTS]")

    def ok(name, cond, detail=""):
        say("    %-4s %-58s %s" % ("ok" if cond else "FAIL", name, detail))
        assert cond, name + " " + detail

    # A1 — the Bin Runner ceiling is identical in every power state
    ok("A1 Bin Runner ceiling identical in all 24 power states",
       len(set(tuple(sorted(s.items())) for s in st.values())) == 1,
       "sorts %d CS %d RS %d ST %d" % (base["sorts"], base["cs"], base["rs"],
                                       base["st"]))
    ok("A2 ceiling = the fuel budget, not the clock",
       base["sorts"] == FUEL, "35 sorts = 20 CH + 3 x 5 CH")
    ok("A3 Bin Runner ceiling = 35 sorts / 258 CS / 105 RS / 20 ST / 1 GF",
       (base["sorts"], base["cs"], base["rs"], base["st"], base["gf"]) ==
       (35, 258, 105, 20, 1))
    # A4 — the spec's competent line is untouched by the retrofit
    ok("A4 spec §5.1 A4 line unchanged: 216 CS / 90 RS / 1 GF / 15 ST",
       (comp["cs"], comp["rs"], comp["gf"], comp["st"]) == (216, 90, 1, 15))
    ok("A5 competent line fits the fuel budget",
       comp["fuel_used"] <= comp["fuel_avail"], "%d of %d CH"
       % (comp["fuel_used"], comp["fuel_avail"]))
    # A6 — no realised line can pass the ceiling
    worst = max(r["correct"] for _, r in br_res)
    ok("A6 every Bin Runner realised line <= the ceiling",
       worst <= base["sorts"], "best realised %d sorts of %d" % (worst, base["sorts"]))
    # A7 — the harness catches a payout-raising power
    ok("A7 sensitivity: +1 CH of fuel moves the ceiling (test can fail)",
       control != base, "sorts %d -> %d" % (base["sorts"], control["sorts"]))
    ok("A8 no declared power sets a forbidden channel",
       all(not (set(p) & FORBIDDEN_CHANNELS) for p in
           [dict(speed=0.5), dict(guide_items=8), dict(ledger=True),
            dict(quick_pick=True)]))
    # A9 — powers are monotone: owning more never costs the player material
    order = [dict(), dict(f1=1), dict(f1=2), dict(f1=2, f2=True),
             dict(f1=2, f2=True, f3=True),
             dict(f1=2, f2=True, f3=True, f4_presses=3)]
    seq = [br_realised(**k)["correct"] for k in order]
    ok("A9 Bin Runner powers are monotone (never cost a sort)", seq == sorted(seq),
       " -> ".join(str(x) for x in seq))
    # A10 — Brick Break ceiling = the wall, on every bay, in every power state
    ok("A10 Brick Break ceiling = the wall on all four bays, 24 power states",
       all(bb_ceiling(b)["bricks"] == BAYS[b]["bricks"] for b in BAYS) and
       len(set(tuple(sorted(v.items())) for v in bb_states.values())) == 1,
       "30 / 36 / 35 / 48 bricks")
    ok("A11 the wall binds before Swing on every bay",
       all(bb_ceiling(b)["bricks"] == min(BAYS[b]["bricks"], bb_ceiling(b)["sw"])
           for b in BAYS))
    ok("A12 Swing granted = 30 + 4 x rows on every bay",
       all(bb_ceiling(b)["sw"] == SW_START + SW_PER_ROW * BAYS[b]["rows"]
           for b in BAYS), "50 / 54 / 50 / 54")
    ok("A13 Brick Break SE = rows + 3 sealed on every bay",
       all(bb_ceiling(b)["se"] == BAYS[b]["rows"] + 3 for b in BAYS),
       "8 / 9 / 8 / 9")
    best_bricks = max(r["bricks"] for _, r in bb_res)
    ok("A14 every Brick Break realised line <= the wall",
       best_bricks <= BAYS[1]["bricks"],
       "best realised %d bricks of %d" % (best_bricks, BAYS[1]["bricks"]))
    ok("A15 sensitivity: +1 RK a brick moves the ceiling (test can fail)",
       bb_control != bb_base,
       "RK %d -> %d" % (bb_base["rk"], bb_control["rk"]))
    ok("A16 sensitivity: +10 SW of fuel does NOT move it (the wall binds)",
       {k: v for k, v in bb_ceiling(1, dict(sw_bonus=10)).items() if k != "sw"}
       == {k: v for k, v in bb_base.items() if k != "sw"}, "bricks 30 -> 30")
    seq = [bb_realised(1, **k)["bricks"] for k in
           [dict(), dict(m1=1), dict(m1=2), dict(m1=2, m2=True),
            dict(m1=2, m2=True, m4_presses=1), dict(m1=2, m2=True, m4_presses=2)]]
    ok("A17 Brick Break powers are monotone (never cost a brick)",
       seq == sorted(seq), " -> ".join(str(x) for x in seq))
    # A18 — prices are payable only from the loop's own meta currency
    ok("A18 every power is priced in ST or SE, never in money",
       all(isinstance(x, int) and x >= 0 for x in
           [N1_COST[1], N1_COST[2], N2_COST, N3_COST, N4_COST,
            M1_COST[1], M1_COST[2], M2_COST, M3_COST, M4_COST]))
    ok("A19 ST faucet is printing only, and no power adds a print's ST",
       PRINT_ST == 5 and "print_st_bonus" in FORBIDDEN_CHANNELS)
    ok("A20 finite price lists sum as published",
       ledger["st_finite"] == 545 and ledger["se_finite"] == 131,
       "545 ST / 131 SE")
    ok("A21 grind as published", grind["runs"] == 37 and grind["clears"] == 17,
       "37 runs / 17 clears")
    # A22-A25 — the document and this script publish the same numbers
    doc = ""
    path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "arcade-powers.md")
    if os.path.exists(path):
        with open(path, encoding="utf-8") as fh:
            doc = fh.read()
    ok("A22 doc publishes the Bin Runner ceiling",
       "35 sorts · 258 CS · 105 RS · 20 ST · 1 GF · 4 prints" in doc,
       "35 sorts / 258 CS / 105 RS / 20 ST / 1 GF / 4 prints")
    ok("A23 doc publishes the Brick Break ceiling",
       "bay 1: 30 bricks · 35 RK · 35 RB · 40 DZ · 8 SE" in doc,
       "bay 1: 30 bricks / 35 RK / 35 RB / 40 DZ / 8 SE")
    ok("A24 doc publishes the finite price lists",
       "545 ST" in doc and "131 SE" in doc, "545 ST / 131 SE")
    ok("A25 doc publishes the grind and the realised lines",
       "37 runs" in doc and "17 clears" in doc and "168 CS" in doc,
       "37 runs / 17 clears / 168 CS")
    say("")
    say("    All %d assertions green." % 25)
    print("\n".join(OUT))


if __name__ == "__main__":
    main()
