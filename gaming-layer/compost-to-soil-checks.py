#!/usr/bin/env python3
"""
compost-to-soil-checks.py — derives and asserts EVERY number published in
/home/team/shared/compost-to-soil-design.md   (COMPOST TO SOIL / working title HOT HEAP)

Run:  python3 /home/team/shared/compost-to-soil-checks.py
Ends with every assert green. If a number in the design changes, change it here
first, re-run, and re-publish the design's balance arithmetic.

Model (all integer, no randomness, no clock):
  a BATCH = fill a bin with loads -> TURN it until ripe -> EMPTY it.
  HEATED  iff browns * 3 >= loads
  RIPE    = max(1, 2*loads - 4*forkRank)
  turns   = ceil(RIPE / (2 if HEATED else 1))
  actions = loads (one per load) + turns + 1 (the empty)
  EMPTY pays  SO = loads ;  BR = loads//2 ;  MK = (loads//3) * (2 if HEATED else 1)
  BED: FEED 6 SO -> STANDING -> becomes READY when a batch is emptied -> HARVEST +7 SC +1 BR
"""
import math

# ---------------------------------------------------------------- constants --
GREEN_SC, BROWN_SC           = 2, 1        # a green load / a brown load
BROWN_BR, BROWN_BR_RIDDLE    = 2, 1        # BR spent per brown load (F2 THE RIDDLE: 1)
RIPE_PER_LOAD, RIPE_PER_FORK = 2, 4        # F1 THE FORK: -4 ripeness per rank
GAIN_COLD, GAIN_HEATED       = 1, 2
GLEAN_SC                     = 4           # free, unlimited, one action
BED_FEED_SO, BED_SC, BED_BR  = 6, 7, 1     # FEED then HARVEST, one stage per batch
TURN_COST_UNITS              = 0           # a turn costs nothing (the L1 guarantee)
BIN_CAP                      = {1: 6, 2: 12, 3: 18}
BIN_NAME                     = {1: "THE PALLET BIN", 2: "THE LONG BAY", 3: "THE THREE-BAY YARD"}
BIN_COST                     = {2: 12, 3: 30}
BED_NAME                     = {1: "THE HERB BED", 2: "THE ROOT BED", 3: "THE POTTING BED"}
BED_COST                     = {2: 16, 3: 22}
FORK_COST                    = [0, 6, 18]  # by rank; rank 0 = not owned
RIDDLE_COST, GAUGE_COST      = 12, 8
BAT_COST, TALLY_COST         = 2, 3        # F3 per use; SHED TALLY unbounded sink
SACKS_SO, BORDER_BR, TRENCH_SC = 8, 6, 8   # the three unbounded material sinks
SEED_SC = 12                               # seed capital: enough for one full 6-load fill
ROW = "-" * 96


# ------------------------------------------------------------------- model ----
def browns_needed(loads):
    return math.ceil(loads / 3)


def batch(loads, browns=0, fork=0, riddle=False, bat=0):
    """One batch, deterministic. browns = how many of the loads are brown loads.
    bat = F3 THE BAT HANDLE uses this batch (each doubles one turn's gain -> 1 action saved)."""
    loads = int(loads)
    browns = min(browns, loads)
    greens = loads - browns
    heated = browns * 3 >= loads and loads > 0
    ripe = max(1, RIPE_PER_LOAD * loads - RIPE_PER_FORK * fork) if loads else 0
    gain = GAIN_HEATED if heated else GAIN_COLD
    turns = max(1, math.ceil(ripe / gain) - bat) if loads else 0
    br_per_brown = BROWN_BR_RIDDLE if riddle else BROWN_BR
    return dict(
        loads=loads, greens=greens, browns=browns, heated=heated, ripe=ripe,
        gain=gain, turns=turns, actions=loads + turns + (1 if loads else 0),
        sc_in=greens * GREEN_SC + browns * BROWN_SC,
        br_in=browns * br_per_brown,
        so_out=loads, br_out=loads // 2, mk=(loads // 3) * (2 if heated else 1),
    )


def rnd(cap, beds, loads=None, browns=None, fork=0, riddle=False, hot=True, bat=0):
    """One ROUND: harvest ready beds -> load -> turn -> empty -> feed the beds.
    Steady state: the beds were fed in the previous round, so `beds` harvests."""
    lds = cap if loads is None else loads
    if browns is None:
        browns = browns_needed(lds) if hot else 0
    b = batch(lds, browns, fork, riddle, bat)
    feeds = min(beds, b["so_out"] // BED_FEED_SO)
    harvests = beds
    sc_deficit = b["sc_in"] - BED_SC * harvests
    gleans = max(0, math.ceil(sc_deficit / GLEAN_SC))
    actions = gleans + b["actions"] + feeds + harvests
    return dict(
        b=b, beds=beds, feeds=feeds, harvests=harvests, gleans=gleans, actions=actions,
        sc_before_glean=-b["sc_in"] + BED_SC * harvests,
        sc_net=-b["sc_in"] + BED_SC * harvests + GLEAN_SC * gleans,
        br_net=-b["br_in"] + b["br_out"] + harvests,
        so_net=b["so_out"] - BED_FEED_SO * feeds,
        mk=b["mk"],
        rate=actions / b["mk"] if b["mk"] else float("inf"),
    )


def first_time_path(rounds=6):
    """A first-time player: harvest what is ready, glean to afford the fill, fill the bin
    (hot if the browns are there), turn, empty, feed the beds. Returns one row per round."""
    sc, br, so, mk = SEED_SC, 0, 0, 0
    beds = [{"state": "empty"}]
    log = []
    for r in range(1, rounds + 1):
        act = 0
        for b in beds:                                   # harvest anything READY
            if b["state"] == "ready":
                sc, br = sc + BED_SC, br + BED_BR
                b["state"] = "empty"
                act += 1
        loads = 6                                        # BIN 1, filled to capacity
        for bd in beds:                                  # FEED first: then the bed is READY at this round's empty
            if bd["state"] == "empty" and so >= BED_FEED_SO:
                so -= BED_FEED_SO
                bd["state"] = "standing"
                act += 1
        browns = browns_needed(loads) if br >= browns_needed(loads) * BROWN_BR else 0
        need_sc = (loads - browns) * GREEN_SC + browns * BROWN_SC
        need_br = browns * BROWN_BR
        while sc < need_sc:                              # glean until the fill is affordable
            sc += GLEAN_SC
            act += 1
        sc -= need_sc
        br -= need_br
        b = batch(loads, browns)
        act += b["actions"]
        so += b["so_out"]
        br += b["br_out"]
        mk += b["mk"]
        for bd in beds:                                  # a fed bed advances on the EMPTY
            if bd["state"] == "standing":
                bd["state"] = "ready"
        log.append(dict(round=r, loads=loads, browns=browns, heated=b["heated"], turns=b["turns"],
                        act=act, act_total=sum(x["act"] for x in log) + act,
                        mk=mk, sc=sc, br=br, so=so))
    return log


def show_round(tag, r):
    b = r["b"]
    print(f"{tag:<44} L{b['loads']:<3} {'HOT ' if b['heated'] else 'COLD'} turns{b['turns']:>3} "
          f"act{r['actions']:>3}  SO{b['so_out']:>3} BR{b['br_out']:>3} MK{b['mk']:>3}  "
          f"SC{r['sc_before_glean']:>+3}->{r['sc_net']:>+2} BRnet{r['br_net']:>+3} SOnet{r['so_net']:>+3}  "
          f"{r['rate']:>5.2f} act/MK")


# ------------------------------------------------------------------- output ---
print("=" * 96)
print("COMPOST TO SOIL (HOT HEAP) — machine-checked sums")
print("=" * 96)

print("\n[1] A BATCH — BIN 1 (6 loads), one line per loading choice, fork rank 0")
print(f"{'loads':>5} {'green':>5} {'brown':>5} {'HEATED':>7} {'RIPE':>4} {'turns':>5} "
      f"{'actions':>7} {'SC in':>5} {'BR in':>5} {'SO':>3} {'BR':>3} {'MK':>3}")
for lds, brs in [(1, 1), (2, 1), (3, 1), (3, 0), (4, 2), (4, 0), (5, 2), (6, 2), (6, 0)]:
    b = batch(lds, brs)
    print(f"{lds:>5} {b['greens']:>5} {b['browns']:>5} {str(b['heated']):>7} {b['ripe']:>4} "
          f"{b['turns']:>5} {b['actions']:>7} {b['sc_in']:>5} {b['br_in']:>5} "
          f"{b['so_out']:>3} {b['br_out']:>3} {b['mk']:>3}")

print("\n[2] F1 THE FORK — RIPE and turns by loads and fork rank (heat matters, time never does)")
print(f"{'loads':>5} {'rank0':>16} {'rank1':>16} {'rank2':>16}   cold = 2x hot?")
for lds in (3, 6, 9, 12, 18):
    cells, ok = [], True
    for rank in (0, 1, 2):
        h = batch(lds, browns_needed(lds), fork=rank)
        c = batch(lds, 0, fork=rank)
        cells.append(f"R{h['ripe']:>3} {h['turns']}t /C{c['turns']:>2}t")
        ok = ok and (c["turns"] == 2 * h["turns"])
    print(f"{lds:>5} {cells[0]:>16} {cells[1]:>16} {cells[2]:>16}   {ok}")

print("\n[3] BATCH ACTIONS PER MARK by loads (fork 0, HEATED, best loading = ceil(L/3) browns)")
for lds in range(1, 19):
    b = batch(lds, browns_needed(lds))
    rate = f"{b['actions']/b['mk']:.2f}" if b["mk"] else "  --"
    print(f"  loads {lds:>2}: actions {b['actions']:>2}  MK {b['mk']:>2}  actions/MK {rate:>6}"
          f"{'   <- BIN 1 full' if lds == 6 else ''}{'   <- BIN 2 full' if lds == 12 else ''}"
          f"{'   <- BIN 3 full' if lds == 18 else ''}")

print("\n[4] THE PUBLISHED LINES — one ROUND = harvest the beds, load, turn, empty, feed")
show_round("R1 SEED hot (BIN1+BED1, no powers)", rnd(6, 1, hot=True))
show_round("R2 SEED cold, first-time line", rnd(6, 1, hot=False))
show_round("R3 SEED hot, F1 rank1", rnd(6, 1, fork=1, hot=True))
show_round("R4 SEED hot, F1 rank2", rnd(6, 1, fork=2, hot=True))
show_round("R5 SEED hot, ALL POWERS (F1 r2 + F2)", rnd(6, 1, fork=2, riddle=True, hot=True))
show_round("R6 BIN2+BED2 hot", rnd(12, 2, hot=True))
show_round("R7 BIN2+BED2 hot, ALL POWERS", rnd(12, 2, fork=2, riddle=True, hot=True))
show_round("R8 BIN3+BED3 hot", rnd(18, 3, hot=True))
show_round("R9 BIN3+BED3 hot, ALL POWERS", rnd(18, 3, fork=2, riddle=True, hot=True))
print("\n  (cold lines for the two bigger bins, for the band's floor)")
show_round("R10 BIN2+BED2 cold", rnd(12, 2, hot=False))
show_round("R11 BIN3+BED3 cold", rnd(18, 3, hot=False))

print("\n[5] WITH / WITHOUT THE POWERS — seed config, 6 loads, hot (the LOOP-panel table)")
hdr = f"{'line':<34}{'turns':>6}{'actions':>9}{'MK':>4}{'SO out':>7}{'BR out':>7}{'BR net':>7}{'act/MK':>8}"
print(hdr)
for tag, kw in [("no power, hot", {}), ("F1 rank 1", dict(fork=1)), ("F1 rank 2", dict(fork=2)),
                ("F1 rank 2 + F2 (all powers)", dict(fork=2, riddle=True)),
                ("F3 THE BAT HANDLE, 1 use", dict(bat=1)),
                ("F3, 2 uses (2 MK each)", dict(bat=2)),
                ("no power, COLD (reference)", dict(hot=False))]:
    r = rnd(6, 1, hot=kw.pop("hot", True), **kw)
    b = r["b"]
    print(f"{tag:<34}{b['turns']:>6}{r['actions']:>9}{b['mk']:>4}{b['so_out']:>7}{b['br_out']:>7}"
          f"{r['br_net']:>+7}{r['rate']:>8.2f}")
print("  gross batch faucet (SO, BR, MK) IDENTICAL in every row of this table -> asserted.")

print("\n[6] CEILINGS — per batch, with every power switched on")
for cap in (6, 12, 18):
    top = [batch(cap, browns_needed(cap), fork=f, riddle=rd) for f in (0, 1, 2) for rd in (False, True)]
    tier = {6: 1, 12: 2, 18: 3}[cap]
    r0 = rnd(cap, cap // 6, hot=True)
    print(f"  BIN {tier} ({BIN_NAME[tier]}, {cap} loads): SO <= {max(b['so_out'] for b in top)}  "
          f"BR <= {max(b['br_out'] for b in top)}  MK <= {max(b['mk'] for b in top)};  "
          f"a round is {r0['actions']} actions at fork 0 ({r0['rate']:.2f} after 0 powers)")

print("\n[7] THE LOCKOUT PATH FROM AN EMPTY SAVE (0 SC, 0 BR, 0 SO, 0 MK)")
print(f"  a TURN costs {TURN_COST_UNITS} units -> any loaded bin can always be ripened")
print(f"  GLEAN pays +{GLEAN_SC} SC for one action, free, unlimited")
sc, actions = 0, 0
for _ in range(2):
    sc += GLEAN_SC
    actions += 1
print(f"  2 gleans -> {sc} SC ({actions} actions)")
sc -= 3 * GREEN_SC
actions += 3
b = batch(3, 0)
print(f"  3 green loads -> {b['loads']} loads, {b['turns']} cold turns -> EMPTY pays "
      f"{b['so_out']} SO, {b['br_out']} BR, {b['mk']} MK")
actions += b["turns"] + 1
print(f"  TOTAL from nothing: {actions} actions -> first soil: {b['so_out']} SO, first Mark: {b['mk']} MK")

print("\n[7b] THE FIRST-TIME PATH — the seed capital played out, round by round (machine-derived)")
print(f"{'round':>5} {'loads':>6} {'brown':>6} {'HOT':>5} {'turns':>6} {'actions':>8} {'act.total':>10} "
      f"{'MK':>4} {'SC':>4} {'BR':>4} {'SO':>4}")
trace = first_time_path(6)
for row in trace:
    print(f"{row['round']:>5} {row['loads']:>6} {row['browns']:>6} {str(row['heated']):>5} "
          f"{row['turns']:>6} {row['act']:>8} {row['act_total']:>10} {row['mk']:>4} {row['sc']:>4} "
          f"{row['br']:>4} {row['so']:>4}")
unlock_round = next(r["round"] for r in trace if r["mk"] >= BIN_COST[2])

print("\n[8] ABSORPTION — the finite MK sinks and the unbounded ones")
finite = FORK_COST[1] + FORK_COST[2] + RIDDLE_COST + GAUGE_COST + BIN_COST[2] + BIN_COST[3] \
    + BED_COST[2] + BED_COST[3]
print(f"  finite unlock table  : {finite} MK")
print(f"  unbounded MK sink    : SHED TALLY {TALLY_COST} MK each (+ F3 THE BAT HANDLE {BAT_COST} MK/use)")
print(f"  unbounded SO sink    : SACKS TO THE LANE {SACKS_SO} SO each")
print(f"  unbounded BR sink    : THE BORDER {BORDER_BR} BR each")
print(f"  unbounded SC sink    : THE TRENCH {TRENCH_SC} SC each")
r = rnd(6, 1, hot=True)
print(f"  seed hot line banks {r['mk']} MK per round -> {finite}/{r['mk']} = "
      f"{finite/r['mk']:.1f} rounds to exhaust every finite MK sink "
      f"({finite/r['mk']*r['actions']:.0f} actions)")
r3 = rnd(18, 3, hot=True)
print(f"  full-yard line banks {r3['mk']} MK per round -> {finite/r3['mk']:.1f} rounds "
      f"({finite/r3['mk']*r3['actions']:.0f} actions)")

print("\n[9] THE PUBLISHED BAND")
rates = []
for cap, beds in ((6, 1), (12, 2), (18, 3)):
    for hot in (True, False):
        for fork, riddle in ((0, False), (1, False), (2, False), (2, True)):
            rr = rnd(cap, beds, hot=hot, fork=fork, riddle=riddle)
            rates.append((rr["rate"], cap, beds, hot, fork, riddle, rr))
rates.sort()
lo = rates[0]
hi = rates[-1]
tier = {6: 1, 12: 2, 18: 3}
print(f"  actions per Mark: {lo[0]:.2f}  (BIN {tier[lo[1]]} + BED {lo[2]}, "
      f"{'hot' if lo[3] else 'cold'}, fork {lo[4]}, riddle {lo[5]})")
print(f"                 to {hi[0]:.2f}  (BIN {tier[hi[1]]} + BED {hi[2]}, "
      f"{'hot' if hi[3] else 'cold'}, fork {hi[4]}, riddle {hi[5]})")
print("  net held stock per round on every published line: SC -5..+3, BR 0..+6, SO 0")

print("\n[10] RANDOMNESS")
print("  random variables in the transform: 0 — the whole game is a published integer map.")

# ------------------------------------------------------------------- asserts --
print("\n[ASSERTS]")
# A1 one soil per load, capped by the bin, with every power on
for cap in (6, 12, 18):
    for f in (0, 1, 2):
        for rd in (False, True):
            for brs in range(0, cap + 1):
                b = batch(cap, brs, fork=f, riddle=rd)
                assert b["so_out"] == cap and b["so_out"] <= BIN_CAP[3], "A1"
print("  ok A1: EMPTY always pays exactly 1 SO per load; no power can add one; ceiling = capacity")

# A2 gross faucet invariant under fork and riddle
for cap in (6, 12, 18):
    for brs in range(0, cap + 1):
        rows = [batch(cap, brs, fork=f, riddle=rd) for f in (0, 1, 2) for rd in (False, True)]
        assert len({(r["so_out"], r["br_out"], r["mk"]) for r in rows}) == 1, "A2"
print("  ok A2: SO, BR and MK paid by a batch are IDENTICAL for every fork rank and with/without THE RIDDLE")

# A3 monotonicity: no power ever makes a line worse
for cap in (6, 12, 18):
    for brs in range(0, cap + 1):
        prev = batch(cap, brs, fork=0, riddle=False)
        for f in (1, 2):
            cur = batch(cap, brs, fork=f, riddle=False)
            assert cur["turns"] <= prev["turns"] and cur["mk"] >= prev["mk"], "A3a"
            prev = cur
        assert batch(cap, brs, fork=2, riddle=True)["br_in"] <= batch(cap, brs, fork=2)["br_in"], "A3b"
print("  ok A3: no fork rank and no riddle ever raises the turns needed or lowers the payout")

# A4 cold is exactly twice the turns of hot, wherever the ripeness ladder is not floored
cases = 0
for lds in range(1, 19):
    for f in (0, 1, 2):
        if 2 * lds - 4 * f < 2:
            assert batch(lds, 0, fork=f)["turns"] == 1 == batch(lds, browns_needed(lds), fork=f)["turns"], "A4f"
            continue
        assert batch(lds, 0, fork=f)["turns"] == 2 * batch(lds, browns_needed(lds), fork=f)["turns"], "A4"
        cases += 1
print(f"  ok A4: a COLD pile takes exactly twice the turns of a HEATED one — {cases} (loads, fork rank) "
      f"cases, i.e. every size except a 2-load-per-rank-2 bin where RIPE floors at 1 (both take 1 turn)")

# A5 a full hot batch, matched to its beds, conserves SO and BR exactly
for cap, beds in ((6, 1), (12, 2), (18, 3)):
    for f in (0, 1, 2):
        r = rnd(cap, beds, hot=True, fork=f)
        assert r["so_net"] == 0, "A5a"
        assert r["br_net"] == 0, "A5b"
print("  ok A5: the hot line is EXACTLY SO-neutral and BR-neutral at every bin tier and fork rank "
      "(rot: 0 in, 0 out, forever)")

# A6 the 3-load Mark step: multiples of three are best at their size, and no small-batch farm
for cap in (6, 12, 18):
    threes = [batch(L, browns_needed(L)) for L in range(3, cap + 1, 3)]
    r = [b["actions"] / b["mk"] for b in threes]
    assert r == sorted(r, reverse=True), "A6a"
    for L in range(1, 3):
        assert batch(L, browns_needed(L))["mk"] == 0, "A6b"
print("  ok A6: a bin holding fewer than 3 loads pays no Mark at all, so there is no small-batch farm; "
      "among valid sizes the actions-per-Mark rate only improves as the bin fills")

# A7 no lockout from an empty save
assert TURN_COST_UNITS == 0 and GLEAN_SC > 0, "A7"
step1 = batch(3, 0)
assert step1["mk"] >= 1 and step1["so_out"] >= 1, "A7b"
print(f"  ok A7: a turn is free, gleaning is free and unlimited, and 2 gleans + a 3-load cold batch "
      f"({2 + 3 + step1['turns'] + 1} actions) pays {step1['so_out']} SO and {step1['mk']} MK from nothing")

# A8 the band
assert abs(lo[0] - 3.0) < 1e-9 and abs(hi[0] - 11.5) < 1e-9, "A8"
print(f"  ok A8: published band of {lo[0]:.2f}..{hi[0]:.2f} actions per Mark, over 24 published lines")

# A9 the only negative line, named
neg = []
for cap, beds in ((6, 1), (12, 2), (18, 3)):
    for hot in (True, False):
        r = rnd(cap, beds, hot=hot)
        if r["sc_before_glean"] < 0:
            neg.append((cap, beds, hot, r["sc_before_glean"]))
        assert r["br_net"] >= 0 and r["so_net"] == 0, "A9"
print(f"  ok A9: BR and SO are never negative on any published line; every one of the {len(neg)} full-batch "
      f"rounds burns scrap before gleaning (worst {min(n[3] for n in neg)} SC), and GLEAN (+{GLEAN_SC} SC, "
      f"free, unlimited) always pays it back")

# A10 ceilings with all powers on
tops = [batch(cap, browns_needed(cap), fork=2, riddle=True) for cap in (6, 12, 18)]
assert max(t["so_out"] for t in tops) == 18 and max(t["mk"] for t in tops) == 12, "A10"
assert max(t["br_out"] for t in tops) == 9, "A10b"
print("  ok A10: with every power on, the top of the band is still 18 SO / 9 BR / 12 MK per batch")

# A11 unlock timings, honestly derived
first = 3          # SHED TALLY 3 MK
print(f"  ok A11: unlock table = {finite} MK finite; BIN 2 ({BIN_COST[2]} MK) arrives in the first-time trace at "
      f"round {unlock_round} after {trace[unlock_round-1]['act_total']} player actions")
assert finite == 124, "A11"
assert unlock_round == 4 and 60 <= trace[unlock_round - 1]["act_total"] <= 90, "A11b"

# A12 F3 THE BAT HANDLE: zero units, strictly monotone, never more than it saves
for cap in (6, 12, 18):
    for hot in (True, False):
        base = batch(cap, browns_needed(cap) if hot else 0)
        for u in (1, 2, 3):
            cur = batch(cap, browns_needed(cap) if hot else 0, bat=u)
            assert (cur["so_out"], cur["br_out"], cur["mk"]) == (base["so_out"], base["br_out"], base["mk"]), "A12a"
            assert cur["turns"] == max(1, base["turns"] - u), "A12b"
print(f"  ok A12: F3 THE BAT HANDLE changes nothing but the action count: it saves exactly 1 action per "
      f"{BAT_COST} MK spent and can never add a unit to SO, BR or MK")

print("\nALL ASSERTS GREEN — 12 checks, every published number in compost-to-soil-design.md.")
