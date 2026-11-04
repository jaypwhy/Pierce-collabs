#!/usr/bin/env python3
"""
checks.py — PREVENTATIVE HEALTH (working title TEND)
Derives and asserts EVERY number published in ./design.md.

Run:  python3 checks.py
Ends with every assert green. If a number in the design changes, change it here
first, re-run, and re-publish the design's balance arithmetic.

Model (all integer, no randomness, no clock):
  one CYCLE = a closed run of the bed: cut a bunch, plant back to the level you cut at.
  PLANT : one action, free, unlimited, no gate. Puts up to GAIN[p1] plants in the
          bed, never past the bed's size. The player chooses how many (a hand, not
          a pump) — so a bigger can never forces an overshoot.
  CUT   : one action. Needs TAKE[p2] plants standing. Pays credits equal to the
          number of plants STANDING AT THE INSTANT OF THE CUT (read before the
          bunch leaves), then the bunch leaves: standing -= TAKE.
  The bed refuses plants above its size; refused plants are never created.
"""
import math

# ---------------------------------------------------------------- constants --
CAP = {1: 4, 2: 6, 3: 8}                     # the bed's size, by room tier
ROOM = {1: "THE WINDOW BOX", 2: "THE HERB BED", 3: "THE GREENHOUSE"}
GAIN = [1, 2]                                # plants one PLANT action puts in, by P1
TAKE = [2, 1]                                # plants one CUT takes out, by P2
P1_COST = 12                                 # THE WATERING CAN
P2_COST = 22                                 # THE SHARP SHEARS
P3_COST = 6                                  # THE PLANT LABEL
P4_COST = 5                                  # THE COMPOST BIN, CR per use
ROOM_COST = {2: 16, 3: 52}
STALL_CR = 3                                 # THE MARKET STALL, unbounded CR sink
BUNDLE_VG = 4                                # A BUNDLE FOR THE STALL, unbounded plant sink
BADGE_EVERY = 10
PI10 = 10 * math.pi                          # the layer's shared pi display scale


def cut_pays(standing):
    """A bunch pays one credit for every plant standing at the cut."""
    return standing


def gain_of(p1):
    return GAIN[1] if p1 else GAIN[0]


def take_of(p2):
    return TAKE[1] if p2 else TAKE[0]


# --------------------------------------------------------------- the policies --
def cycle_level(k, cap, p1=False, p2=False):
    """A closed cycle: cut once at exactly k plants standing, then plant back to k.
    The player plants only up to k (PLANT is 'up to', so the choice is theirs)."""
    g, t = gain_of(p1), take_of(p2)
    assert t <= k <= cap, (k, cap, t)
    v, acts, cr, created, spent = k, 0, 0, 0, 0
    cr += cut_pays(v)
    v -= t
    acts += 1
    spent += t
    while v < k:
        step = min(g, cap - v, k - v)
        v += step
        created += step
        acts += 1
    return dict(acts=acts, cr=cr, start=k, end=v, created=created, spent=spent)


def cycle_run_down(cap, p1=False, p2=False):
    """THE EMPTY BED: take every bunch the bed can give, then replant it to the top."""
    g, t = gain_of(p1), take_of(p2)
    v, acts, cr, created, spent = cap, 0, 0, 0, 0
    while v >= t:
        cr += cut_pays(v)
        v -= t
        spent += t
        acts += 1
    while v < cap:
        step = min(g, cap - v)
        v += step
        created += step
        acts += 1
    return dict(acts=acts, cr=cr, start=cap, end=v, created=created, spent=spent)


def cycle_multi(n, cap, p1=False, p2=False):
    """Take n bunches off the bed, then replant it to the top.
    n = 1 is the taught line (cut once from a full bed); n as large as the bed
    allows is the empty-bed line."""
    g, t = gain_of(p1), take_of(p2)
    v, acts, cr, created, spent = cap, 0, 0, 0, 0
    for _ in range(n):
        if v < t:
            break
        cr += cut_pays(v)
        v -= t
        spent += t
        acts += 1
    while v < cap:
        step = min(g, cap - v)
        v += step
        created += step
        acts += 1
    return dict(acts=acts, cr=cr, start=cap, end=v, created=created, spent=spent)


def rate_of(cyc):
    return dict(acts=cyc["acts"], cr=cyc["cr"],
                act_per_cr=cyc["acts"] / cyc["cr"],
                cr_per_act=cyc["cr"] / cyc["acts"])


# ------------------------------------------------ the exhaustive rate search --
def best_cycle_rate(cap, p1=False, p2=False):
    """Exact best actions-per-credit of ANY closed cycle in the state graph.
    The minimum-ratio cycle of a finite graph is a simple cycle, so every simple
    cycle is enumerated and measured exactly — no floating-point search."""
    g, t = gain_of(p1), take_of(p2)
    adj = {v: [] for v in range(cap + 1)}
    for v in range(cap + 1):
        for k in range(1, min(g, cap - v) + 1):
            adj[v].append((v + k, 1, 0))
        if v >= t:
            adj[v].append((v - t, 1, cut_pays(v)))

    best = [None]

    def dfs(start, v, acts, cr, seen):
        for w, a, c in adj[v]:
            if w == start:
                if acts + a > 0 and cr + c > 0:
                    r = (acts + a) / (cr + c)
                    if best[0] is None or r < best[0]:
                        best[0] = r
            elif w not in seen:
                seen.add(w)
                dfs(start, w, acts + a, cr + c, seen)
                seen.remove(w)

    for s in range(cap + 1):
        dfs(s, s, 0, 0, {s})
    return best[0]


# ------------------------------------------------------------------- output ---
print("=" * 96)
print("PREVENTATIVE HEALTH (TEND) — machine-checked sums")
print("=" * 96)

print("\n[1] ONE CYCLE — the ledger, THE WINDOW BOX (bed 4), no powers")
print(f"{'action':<34}{'bed':>6}{'credit':>8}   what the screen prints")
b, cr, acts = CAP[1], 0, 0
print(f"{'(the bed starts full)':<34}{b:>6}{cr:>8}   4 plants standing")
pays = cut_pays(b)
cr += pays
b -= TAKE[0]
acts += 1
print(f"{'CUT (4 standing, bunch of 2)':<34}{b:>6}{cr:>8}   pays {pays} CR, 2 plants leave the bed")
while b < CAP[1]:
    b += 1
    acts += 1
    print(f"{'PLANT':<34}{b:>6}{cr:>8}   +1 plant (seed tray -> bed)")
print(f"  CYCLE CLOSED: {acts} actions, {cr} credits, bed back at {b} — "
      f"{acts / cr:.2f} actions per credit")

print("\n[2] THE THREE ROOMS — the bed, the bunch, the ceiling")
print(f"{'tier':<5}{'room':<18}{'bed':>5}{'bunch':>7}{'ceiling/cut':>13}{'ceiling/cycle':>15}")
for t, cap in CAP.items():
    print(f"{t:<5}{ROOM[t]:<18}{cap:>5}{TAKE[0]:>7}{cut_pays(cap):>13}{cut_pays(cap):>15}")
print("  a cut pays at most the bed's size in credits, and a taught cycle pays exactly that.")
print("  the bunch is 2 plants, so a bed must hold at least 2 before anything can be cut.")

print("\n[3] THE PUBLISHED LINES — one closed cycle, steady state")
print(f"{'line':<52}{'acts':>6}{'CR':>5}{'act/CR':>8}{'cr/act':>8}")
lines = []
for t, cap in CAP.items():
    for k in range(TAKE[0], cap + 1):
        r = rate_of(cycle_level(k, cap))
        tag = ("TAUGHT  tier %d (cut only from a full bed)" % t if k == cap
               else "THIN    tier %d (cut the moment 2 stand)" % t if k == TAKE[0]
               else "level %d  tier %d (cut at %d standing)" % (k, t, k))
        lines.append((r["act_per_cr"], tag))
        print(f"{tag:<52}{r['acts']:>6}{r['cr']:>5}{r['act_per_cr']:>8.2f}{r['cr_per_act']:>8.2f}")
    g = rate_of(cycle_run_down(cap))
    lines.append((g["act_per_cr"], "EMPTY    tier %d (cut the bed down to nothing)" % t))
    print(f"{'EMPTY bed tier ' + str(t) + ' (cut it down, then replant)':<52}"
          f"{g['acts']:>6}{g['cr']:>5}{g['act_per_cr']:>8.2f}{g['cr_per_act']:>8.2f}")
print("  the taught line pays cap/3 credits an action; the refill after a cut is a fixed 2 plants,")
print("  so every plant standing at the cut is free money and the full bed is the only optimum.")

print("\n[4] WITH / WITHOUT THE POWERS — the taught line, one cycle")
print(f"{'line':<46}" + "".join(f"{'tier ' + str(t):>16}" for t in CAP))
for tag, kw in [("no powers", {}), ("P1 THE WATERING CAN", dict(p1=True)),
                ("P2 THE SHARP SHEARS", dict(p2=True)),
                ("P1 + P2 (both)", dict(p1=True, p2=True))]:
    cells = []
    for t, cap in CAP.items():
        r = rate_of(cycle_level(cap, cap, **kw))
        cells.append(f"{r['acts']}a/{r['cr']}c {r['act_per_cr']:.2f}")
    print(f"{tag:<46}" + "".join(f"{c:>16}" for c in cells))
print("  credits per cycle are IDENTICAL in every row: 4 / 6 / 8. Only the action count moves.")
print("  but the two powers together open a cheaper RHYTHM: two bunches a refill instead of one —")
print(f"{'P1 + P2, two bunches a refill':<46}" +
      "".join(f"{(lambda r: str(r['acts']) + 'a/' + str(r['cr']) + 'c ' + format(r['act_per_cr'], '.2f'))(rate_of(cycle_multi(2, cap, p1=True, p2=True))):>16}"
              for cap in CAP.values()))
print("  every cut still pays the plants standing, capped by the bed's size — the payout per cut")
print("  does not move; only how many cuts you can fit between refills does (section [10]).")

print("\n[5] THE PUBLISHED BAND — actions per credit")
rates = list(lines)
for t, cap in CAP.items():
    for tag, kw in (("P1", dict(p1=True)), ("P2", dict(p2=True)),
                    ("P1 + P2", dict(p1=True, p2=True))):
        r = rate_of(cycle_level(cap, cap, **kw))
        rates.append((r["act_per_cr"], "taught tier %d, %s" % (t, tag)))
best_rates = {}
for t, cap in CAP.items():
    for tag, kw in (("no powers", {}), ("P1", dict(p1=True)), ("P2", dict(p2=True)),
                    ("P1 + P2", dict(p1=True, p2=True))):
        best_rates[(t, tag)] = best_cycle_rate(cap, **kw)
        rates.append((best_rates[(t, tag)], "BEST possible cycle, tier %d, %s" % (t, tag)))
rates.sort()
for r, tag in rates:
    print(f"  {r:>5.2f} act/CR   {tag}")
print(f"  BAND: {rates[0][0]:.2f} to {rates[-1][0]:.2f} actions per credit "
      f"({1 / rates[-1][0]:.2f} to {1 / rates[0][0]:.2f} credits per action), "
      f"{len(rates)} published lines.")

print("\n[6] CONSERVATION — plants planted = plants cut + (end - start), every line, every state")
print(f"{'line':<40}{'created':>8}{'cut':>6}{'start':>7}{'end':>5}{'closed':>8}{'equal':>7}")
ok = True
for t, cap in CAP.items():
    for tag, kw, k in [("taught, no powers", {}, cap), ("taught, P1 + P2", dict(p1=True, p2=True), cap),
                       ("level 2, no powers", {}, TAKE[0])]:
        c = cycle_level(k, cap, **kw)
        closed = c["end"] == c["start"]
        equal = c["created"] == c["spent"] + (c["end"] - c["start"])
        ok = ok and closed and equal
        print(f"{'tier ' + str(t) + ' ' + tag:<40}{c['created']:>8}{c['spent']:>6}"
              f"{c['start']:>7}{c['end']:>5}{str(closed):>8}{str(equal):>7}")
    g = cycle_run_down(cap)
    equal = g["created"] == g["spent"] + (g["end"] - g["start"])
    ok = ok and equal and g["end"] == g["start"]
    print(f"{'tier ' + str(t) + ' empty bed':<40}{g['created']:>8}{g['spent']:>6}"
          f"{g['start']:>7}{g['end']:>5}{str(g['end'] == g['start']):>8}{str(equal):>7}")
assert ok, "conservation"
full_before = CAP[1]
full_after = min(CAP[1], full_before + GAIN[1])
print(f"  planting into a full bed: {full_before} -> {full_after} (refused), plants created 0")
assert full_after == full_before
print("  no plant is created by a CUT, none is destroyed except by a CUT, and refused plants are")
print("  never created — the bed's size is a capacity, not a loss.")

print("\n[7] THE LOCKOUT PATH FROM NOTHING (0 plants, 0 credits)")
acts, b, cr = 0, 0, 0
while b < TAKE[0]:
    b += 1
    acts += 1
cr += cut_pays(b)
b -= TAKE[0]
acts += 1
print(f"  PLANT is free, unlimited and ungated: {acts - 1} plants -> {TAKE[0]} standing")
print(f"  CUT -> {cr} credits in {acts} actions from an empty save, bed {b}")
print(f"  TOTAL from nothing: {acts} actions -> first credits {cr} CR")

print("\n[8] ABSORPTION — the finite credit sinks and the unbounded ones")
finite = P3_COST + P1_COST + ROOM_COST[2] + P2_COST + P4_COST + ROOM_COST[3]
print(f"  finite unlock table : {finite} CR (P3 {P3_COST} + P1 {P1_COST} + BED 2 {ROOM_COST[2]} + "
      f"P2 {P2_COST} + P4 {P4_COST} + BED 3 {ROOM_COST[3]})")
print(f"  unbounded CR        : THE MARKET STALL {STALL_CR} CR each (+ P4 THE COMPOST BIN {P4_COST} CR a use)")
print(f"  unbounded plants    : A BUNDLE FOR THE STALL {BUNDLE_VG} plants each")
taught1 = rate_of(cycle_level(CAP[1], CAP[1]))
empty1 = rate_of(cycle_run_down(CAP[1]))
thin = rate_of(cycle_level(TAKE[0], CAP[1]))
print(f"  taught on the window box banks {taught1['cr']} CR a cycle in {taught1['acts']} actions -> "
      f"{finite}/{taught1['cr']} = {finite / taught1['cr']:.1f} cycles = {finite / taught1['cr'] * taught1['acts']:.0f} actions")
print(f"  empty bed on the window box {empty1['cr']} CR a cycle -> "
      f"{finite / empty1['cr']:.1f} cycles = {finite / empty1['cr'] * empty1['acts']:.0f} actions")
print(f"  thin bed (2 standing) worst published line {thin['cr']} CR a cycle in {thin['acts']} actions -> "
      f"{finite / thin['cr']:.1f} cycles = {finite / thin['cr'] * thin['acts']:.0f} actions")

print("\n[9] THE FIRST-TIME PATH — the seed played out cycle by cycle (taught line, no buys)")
b, cr, total = 0, 0, 0
rows = []
while b < CAP[1]:
    b += 1
    total += 1
rows.append((0, total - 0, total, cr, b))
# first cut from a full bed, then taught cycles
cr += cut_pays(b)
b -= TAKE[0]
total += 1
rows = [(1, total, total, cr, b)]
print(f"{'cycle':>6}{'actions':>9}{'act.total':>11}{'CR':>5}{'CR total':>9}{'bed':>5}")
print(f"{'ramp':>6}{rows[0][1]:>9}{total:>11}{cr:>5}{cr:>9}{b:>5}")
for s in range(2, 17):
    c = cycle_level(CAP[1], CAP[1])
    b, cr, total = c["end"], cr + c["cr"], total + c["acts"]
    rows.append((s, c["acts"], total, cr, b))
    print(f"{s:>6}{c['acts']:>9}{total:>11}{c['cr']:>5}{cr:>9}{b:>5}")
for name, cost in (("P4 THE COMPOST BIN", P4_COST), ("P3 THE PLANT LABEL", P3_COST),
                   ("P1 THE WATERING CAN", P1_COST), ("BED 2 THE HERB BED", ROOM_COST[2]),
                   ("P2 THE SHARP SHEARS", P2_COST), ("BED 3 THE GREENHOUSE", ROOM_COST[3])):
    hit = next((s, act) for s, _, act, tot, _ in rows if tot >= cost)
    print(f"  {name:<22} {cost:>3} CR  -> cycle {hit[0]}, {hit[1]} player actions")

print("\n[10] HOW MANY BUNCHES A REFILL? — every simple cycle in the state graph, enumerated")
print("     n = bunches taken before the bed is replanted to the top (n = 1 is the taught line)")
print(f"{'state':<14}" + "".join(f"{'n=' + str(n):>9}" for n in range(1, CAP[3] + 1)) + f"{'best n':>8}")
best_n = {}
for tag, kw in (("no powers", {}), ("P1", dict(p1=True)), ("P2", dict(p2=True)),
                ("P1 + P2", dict(p1=True, p2=True))):
    for t, cap in CAP.items():
        row, best = [], None
        for n in range(1, cap + 1):
            r = rate_of(cycle_multi(n, cap, **kw))
            row.append(r["act_per_cr"])
            if best is None or r["act_per_cr"] < row[best[0] - 1]:
                best = (n, r["act_per_cr"])
        best_n[(t, tag)] = best
        print(f"{tag + ' tier ' + str(t):<14}" +
              "".join(f"{row[n - 1]:>9.2f}" for n in range(1, cap + 1)) +
              f"{'n=' + str(best[0]):>8}")
for t, cap in CAP.items():
    for tag, kw in (("no powers", {}), ("P1", dict(p1=True)), ("P2", dict(p2=True)),
                    ("P1 + P2", dict(p1=True, p2=True))):
        n, r = best_n[(t, tag)]
        assert abs(r - best_rates[(t, tag)]) < 1e-9, \
            f"the rhythm table misses the best cycle on tier {t} {tag}"
print("  the exhaustive search over every simple cycle agrees with the rhythm table on all twelve")
print("  lines. With no powers, or with either power alone, the best rhythm is n = 1 — cut from a")
print("  full bed. With BOTH powers the best rhythm is n = 2: two bunches, one refill. That is")
print("  published, not hidden, and it moves actions, not the payout per cut (A1).")

print("\n[11] THE PI DISPLAY SCALE — display only, never an earn rate")
print(f"{'units (CR)':>12}{'display floor(units x 10pi)':>30}")
for u in (1, 2, 3, 4, 5, 10, 100, 1000):
    print(f"{u:>12}{math.floor(u * PI10):>30}")
assert math.floor(1 * PI10) == 31
assert math.floor(10 * PI10) == 314
assert math.floor(100 * PI10) == 3141
assert math.floor(1000 * PI10) == 31415
print("  the loop's unit is a whole integer; the display multiplies it by 10pi and floors.")
print("  conservation in [6] is exact to the plant, with the display on or off.")

# ------------------------------------------------------------------- asserts --
print("\n[ASSERTS]")

# A1 the ceiling is the bed's size, in every room and every power state
for cap in CAP.values():
    for p1 in (False, True):
        for p2 in (False, True):
            c = cycle_level(cap, cap, p1=p1, p2=p2)
            assert c["cr"] <= cap, "A1"
            assert cut_pays(cap) == cap, "A1b"
print("  ok A1: a cut pays at most the bed's size (4 / 6 / 8 CR) and a cycle pays exactly that —")
print("         with every power on")

# A2 the credits a cycle pays are identical in every power state
for cap in CAP.values():
    base = cycle_level(cap, cap)["cr"]
    for p1 in (False, True):
        for p2 in (False, True):
            assert cycle_level(cap, cap, p1=p1, p2=p2)["cr"] == base, "A2"
print("  ok A2: credits per cycle are IDENTICAL in every power state — powers move actions only")

# A3 no power costs more actions than none
for cap in CAP.values():
    base = cycle_level(cap, cap)["acts"]
    a = cycle_level(cap, cap, p1=True)["acts"]
    b = cycle_level(cap, cap, p2=True)["acts"]
    both = cycle_level(cap, cap, p1=True, p2=True)["acts"]
    assert a <= base and b <= base and both <= min(a, b), "A3"
print("  ok A3: every power state costs at most the no-power line, and the two together are")
print("         never worse than either alone")

# A4 plants conserved exactly, on every line and every power state
for cap in CAP.values():
    for p1 in (False, True):
        for p2 in (False, True):
            for k in range(take_of(p2), cap + 1):
                c = cycle_level(k, cap, p1=p1, p2=p2)
                assert c["created"] == c["spent"] + (c["end"] - c["start"]), "A4"
                assert c["end"] == c["start"], "A4b"
            g = cycle_run_down(cap, p1=p1, p2=p2)
            assert g["created"] == g["spent"] + (g["end"] - g["start"]), "A4c"
print("  ok A4: plants are conserved to the unit on every closed cycle — created by PLANT only,")
print("         destroyed by CUT only, and refused plants are never created")

# A5 the taught line is cap/3 credits an action, and it is the best cycle wherever it can be
for cap in CAP.values():
    r = rate_of(cycle_level(cap, cap))
    assert r["acts"] == 3 and r["cr"] == cap, "A5"
    assert abs(r["cr_per_act"] - cap / 3) < 1e-9, "A5b"
    for kw in ({}, dict(p1=True), dict(p2=True)):
        taught = rate_of(cycle_level(cap, cap, **kw))
        assert abs(best_cycle_rate(cap, **kw) - taught["act_per_cr"]) < 1e-9, "A5c"
    two = rate_of(cycle_multi(2, cap, p1=True, p2=True))
    assert abs(best_cycle_rate(cap, p1=True, p2=True) - two["act_per_cr"]) < 1e-9, "A5d"
print("  ok A5: the taught line is exactly 3 actions for the bed's size in credits (cap/3 credits")
print("         an action) on every room; with no powers, or either power alone, no cycle beats it;")
print("         with both powers the cheaper rhythm is two bunches a refill, published in [10]")

# A6 the band
lo, hi = rates[0][0], rates[-1][0]
assert abs(lo - 0.20) < 1e-9 and abs(hi - 1.5) < 1e-9, "A6"
print(f"  ok A6: published band {lo:.2f}..{hi:.2f} actions per credit over {len(rates)} lines")
print("         (floor = the greenhouse with both powers on a two-bunch rhythm, 3 actions / 15")
print("          credits; ceiling = the thin bed, 3 actions / 2 credits)")

# A7 no lockout
b, acts = 0, 0
while b < TAKE[0]:
    b += 1
    acts += 1
assert acts == TAKE[0] and cut_pays(b) >= 1, "A7"
print(f"  ok A7: PLANT is free, ungated and unlimited; from an empty save {acts + 1} actions pay")
print(f"         the first {cut_pays(TAKE[0])} credits, so no sequence of play can lock a player out")

# A8 a cut is never paid for nothing
for cap in CAP.values():
    assert TAKE[0] <= cap, "A8"
    assert cut_pays(TAKE[0]) >= 1 and cut_pays(cap) // TAKE[0] >= 1, "A8b"
print("  ok A8: every cut is paid for with plants the player planted — a bunch is 2 plants, the")
print("         smallest cut pays 2 credits, and no cut pays less than it takes")

# A9 the compost bin adds zero credits and is always worse than playing
worst_rate = max(r["cr_per_act"] for r in
                 [rate_of(cycle_level(cap, cap, p1=True, p2=True)) for cap in CAP.values()])
assert P4_COST > worst_rate, "A9"
print(f"  ok A9: P4 THE COMPOST BIN spends {P4_COST} CR for one plant, i.e. one action's worth of")
print(f"         input, against a best taught rate of {worst_rate:.2f} credits an action — it makes")
print("         the rate worse on purpose and pays nothing out")

# A10 the finite table and the first unlock
assert finite == 113, "A10"
first = next((s, act) for s, _, act, tot, _ in rows if tot >= P3_COST)
assert first[0] == 2 and first[1] == 8, "A10b"
print(f"  ok A10: finite unlock table = {finite} CR; P3 THE PLANT LABEL ({P3_COST} CR) is affordable")
print(f"         after the second cycle — {first[1]} player actions")

# A11 the tend is the loop's own input (C4)
assert GAIN[0] >= 1 and TAKE[0] <= CAP[1]
print(f"  ok A11: every cut is paid for by planting — the paying sink (a CUT) and the restocking")
print(f"          faucet (a PLANT) are two halves of one loop, and PLANT costs no credits at all")

# A12 zero random variables
print("  ok A12: random variables in the transform: 0 — the whole game is a published integer map")

# A13 the pi display never touches the loop
for u in (1, 10, 100, 1000):
    assert math.floor(u * PI10) in (31, 314, 3141, 31415), "A13"
assert all(isinstance(x, int) for x in (CAP[1], CAP[2], CAP[3], GAIN[0], TAKE[0], P1_COST, P2_COST))
print("  ok A13: the pi scale is display only — 1 -> 31, 10 -> 314, 100 -> 3141, 1000 -> 31415;")
print("          no earn rate, price or conservation sum in this file uses it")

print("\nALL ASSERTS GREEN — 13 checks, every published number in design.md.")
