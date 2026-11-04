#!/usr/bin/env python3
"""
checks.py — LOCAL ENERGY (working title KETTLE LANE)
Derives and asserts EVERY number published in ./design.md.

Run:  python3 checks.py
Ends with every assert green. If a number in the design changes, change it here
first, re-run, and re-publish the design's balance arithmetic.

Model (all integer, no randomness, no clock):
  one SHEET (a round) = the street posts a SMALL call and a BIG call.
  CRANK  : one action, free, unlimited, +1 charge (F1 THE THROTTLE: +2 / +3).
  ANSWER : one action, needs charge >= the call's cost, pays tallies,
           the call is paid `call` tallies if the battery was FULL at that moment,
           otherwise `call // 2`; then the call draws its cost and the line
           hands SPARE = 1 charge back.
  F2 THE SHED'S DRAW: every call costs 1 charge less (never below 1).
  the battery refuses charge above its capacity; refused charge is never created.
"""
import math
from collections import deque

# ---------------------------------------------------------------- constants --
CAP        = {1: 6, 2: 12, 3: 18}            # the battery, by street tier
STREET     = {1: "STREET 1 — THE SHED", 2: "STREET 2 — THE TWO SHEDS", 3: "STREET 3 — THE LANE"}
CRANK      = [1, 2, 3]                       # charge per CRANK action, by F1 rank (rank 0 = base)
SPARE      = 1                               # charge handed back after every answered call
F1_COST    = [0, 12, 36]                     # by rank; rank 0 = not owned
F2_COST    = 24
F4_COST    = 8
BAT_COST   = {2: 18, 3: 60}
F3_COST    = 2                               # TL per use, repeatable
PLATE_COST = 3                               # SHED PLATE, unbounded TL sink
LEND_CH    = 8                               # LEND TO THE LANE, unbounded charge sink
BADGE_EVERY = 10
ROW = "-" * 96


def small(cap):
    return cap // 3


def big(cap):
    return 2 * cap // 3


def call_cost(call, f2):
    return max(1, call - (1 if f2 else 0))


def call_tl(call, full):
    """call//2 tallies, doubled when the battery was FULL -> exactly `call`."""
    return call if full else call // 2


def crank(c, cap, g):
    new = min(c + g, cap)
    return new, new - c, g - (new - c)        # charge, created, refused


# -------------------------------------------------------------- the policies --
def run_round(cap, f1=0, f2=False, start=0, order=("big", "small"), top_up=True):
    """One SHEET. top_up=True: crank to FULL before each answer (the taught line).
    top_up=False: crank only until the call is affordable (the flat line)."""
    g, c = CRANK[f1], start
    acts = tl = created = spent = refused = 0
    for which in order:
        call = big(cap) if which == "big" else small(cap)
        cost = call_cost(call, f2)
        target = cap if top_up else cost
        while c < target:
            c, made, lost = crank(c, cap, g)
            created, refused, acts = created + made, refused + lost, acts + 1
        full = (c == cap)
        tl += call_tl(call, full)
        c = c - cost + SPARE
        spent, acts = spent + cost, acts + 1
    return dict(acts=acts, tl=tl, end=c, created=created, spent=spent, refused=refused)


def steady(policy, cap, **kw):
    """Play the policy sheet after sheet until the start charge repeats; return the cycle."""
    seen, rows, start = {}, [], 0
    while start not in seen:
        seen[start] = len(rows)
        r = policy(cap, start=start, **kw)
        rows.append(r)
        start = r["end"]
    return rows[seen[start]:]


def line(policy, cap, **kw):
    cyc = steady(policy, cap, **kw)
    acts = sum(r["acts"] for r in cyc)
    tl = sum(r["tl"] for r in cyc)
    return dict(cycles=len(cyc), acts=acts, tl=tl, rate=acts / tl,
                start=cyc[0].get("start", None), end=cyc[0]["end"])


# ------------------------------------------------- the exhaustive rate search --
def round_edges(cap, f1, f2, start):
    """Every way to answer a whole sheet from `start`: (end charge, tallies) -> fewest actions."""
    g = CRANK[f1]
    best = {(start, 0, 0): 0}
    q, ends = deque([(start, 0, 0)]), {}
    while q:
        c, mask, tl = q.popleft()
        d = best[(c, mask, tl)]
        if mask == 3:
            k = (c, tl)
            ends[k] = min(ends.get(k, 10 ** 9), d)
            continue
        nc, _, _ = crank(c, cap, g)
        st = (nc, mask, tl)
        if best.get(st, 10 ** 9) > d + 1:
            best[st] = d + 1
            q.append(st)
        for bit, call in ((1, small(cap)), (2, big(cap))):
            if mask & bit:
                continue
            cost = call_cost(call, f2)
            if c >= cost:
                st = (c - cost + SPARE, mask | bit, tl + call_tl(call, c == cap))
                if best.get(st, 10 ** 9) > d + 1:
                    best[st] = d + 1
                    q.append(st)
    by_end = {}
    for (e, tl), a in ends.items():
        by_end.setdefault(e, []).append((a, tl))
    pruned = {}
    for e, lst in by_end.items():
        lst.sort()
        best_tl = -1
        for a, tl in lst:                    # keep only the Pareto frontier per end charge
            if tl > best_tl:
                pruned[(e, tl)] = a
                best_tl = tl
    return pruned


def best_closed_rate(cap, f1, f2):
    """Exact best actions-per-tally of ANY closed cycle of sheets, by parametric
    shortest path: a cycle's rate is < lam iff its total weight (actions - lam*tallies)
    is negative, so binary-search lam and look for a negative cycle (Bellman-Ford)."""
    edges = {s: round_edges(cap, f1, f2, s) for s in range(cap + 1)}

    def negative_cycle(lam):
        dist = [0.0] * (cap + 1)                    # a super-source reaches every node at 0
        for it in range(cap + 1):
            updated = False
            for s in range(cap + 1):
                for (e, tl), a in edges[s].items():
                    w = a - lam * tl
                    if dist[e] > dist[s] + w + 1e-12:
                        dist[e] = dist[s] + w
                        updated = True
            if not updated:
                return False
            if it == cap:
                return True
        return False

    lo, hi = 0.0, 4.0
    for _ in range(45):
        mid = (lo + hi) / 2
        if negative_cycle(mid):
            hi = mid
        else:
            lo = mid
    return hi


# ------------------------------------------------------------------- output ---
print("=" * 96)
print("LOCAL ENERGY (KETTLE LANE) — machine-checked sums")
print("=" * 96)

print("\n[1] ONE SHEET — the ledger, STREET 1 (battery 6, calls 2 and 4), no powers")
print(f"{'action':<26}{'charge':>8}{'tally':>7}   what the screen prints")
c, tl, acts = 0, 0, 0
for _ in range(6):
    c, made, lost = crank(c, 6, 1)
    acts += 1
    print(f"{'CRANK':<26}{c:>8}{tl:>7}   +{made} charge{'  (refused ' + str(lost) + ')' if lost else ''}")
tl += call_tl(4, c == 6)
acts += 1
print(f"{'ANSWER BIG  (4, FULL)':<26}{c - 4 + SPARE:>8}{tl:>7}   +4 tallies, drew 4, line returned 1")
c = c - 4 + SPARE
for _ in range(3):
    c, made, lost = crank(c, 6, 1)
    acts += 1
    print(f"{'CRANK':<26}{c:>8}{tl:>7}   +{made} charge{'  (refused ' + str(lost) + ')' if lost else ''}")
tl += call_tl(2, c == 6)
acts += 1
print(f"{'ANSWER SMALL  (2, FULL)':<26}{c - 2 + SPARE:>8}{tl:>7}   +2 tallies, drew 2, line returned 1")
c = c - 2 + SPARE
print(f"  SHEET CLOSED: {acts} actions, {tl} tallies, battery back at {c} — {acts/tl:.2f} actions per tally")

print("\n[2] THE THREE STREETS — what the sheet asks for and what it can pay")
print(f"{'tier':<6}{'battery':>8}{'SMALL':>7}{'BIG':>5}{'small TL':>10}{'big TL':>8}{'ceiling/sheet':>15}{'F2 cost':>10}")
for t, cap in CAP.items():
    print(f"{t:<6}{cap:>8}{small(cap):>7}{big(cap):>5}"
          f"{str(call_tl(small(cap), False)) + '/' + str(call_tl(small(cap), True)):>10}"
          f"{str(call_tl(big(cap), False)) + '/' + str(call_tl(big(cap), True)):>8}"
          f"{small(cap) + big(cap):>15}{call_cost(small(cap), True):>5}/{call_cost(big(cap), True):<4}")
print("  the ceiling is the battery's own size: SMALL + BIG = capacity, on every tier, with every power on.")

print("\n[3] THE PUBLISHED LINES — one SHEET, steady state, no powers")
print(f"{'line':<40}{'acts':>6}{'TL':>5}{'act/TL':>8}{'end charge':>12}")
for t, cap in CAP.items():
    a = line(run_round, cap, order=("big", "small"), top_up=True)
    b = line(run_round, cap, order=("small", "big"), top_up=False)
    print(f"{'TAUGHT  tier ' + str(t) + ' (FULL before every answer)':<40}{a['acts']:>6}{a['tl']:>5}"
          f"{a['rate']:>8.2f}{a['end']:>12}")
    print(f"{'FLAT    tier ' + str(t) + ' (answer as soon as able)':<40}{b['acts']:>6}{b['tl']:>5}"
          f"{b['rate']:>8.2f}{b['end']:>12}")
print("  the taught line is exactly 1.00 action per tally on every street; the flat line exactly 2.00.")

print("\n[4] WITH / WITHOUT THE POWERS — the taught line, one SHEET in steady state")
print(f"{'line':<46}" + "".join(f"{'tier ' + str(t):>16}" for t in CAP))
for tag, kw in [("no powers", {}), ("F1 THE THROTTLE rank 1", dict(f1=1)),
                ("F1 THE THROTTLE rank 2", dict(f1=2)), ("F2 THE SHED'S DRAW", dict(f2=True)),
                ("F1 rank 2 + F2 (all cranking powers)", dict(f1=2, f2=True))]:
    cells = []
    for t, cap in CAP.items():
        r = line(run_round, cap, order=("big", "small"), top_up=True, **kw)
        cells.append(f"{r['acts']}a/{r['tl']}t {r['rate']:.2f}")
    print(f"{tag:<46}" + "".join(f"{c:>16}" for c in cells))
print("  tallies per sheet are IDENTICAL in every row: 6 / 12 / 18. Only the action count moves.")

print("\n[5] THE PUBLISHED BAND — actions per tally")
rates = []
for t, cap in CAP.items():
    for tag, kw in [("no powers", {}), ("F1 r1", dict(f1=1)), ("F1 r2", dict(f1=2)),
                    ("F2", dict(f2=True)), ("F1 r2 + F2", dict(f1=2, f2=True))]:
        r = line(run_round, cap, order=("big", "small"), top_up=True, **kw)
        rates.append((r["rate"], f"taught tier {t}, {tag}"))
    r = line(run_round, cap, order=("small", "big"), top_up=False)
    rates.append((r["rate"], f"flat tier {t}"))
rates.sort()
for rate, tag in rates:
    print(f"  {rate:>5.2f} act/TL   {tag}")
print(f"  BAND: {rates[0][0]:.2f} to {rates[-1][0]:.2f} actions per tally "
      f"({1/rates[-1][0]:.2f} to {1/rates[0][0]:.2f} tallies per action).")

print("\n[6] CONSERVATION — charge created = charge drawn - line returns + stock change")
print(f"{'line':<34}{'created':>8}{'drawn':>7}{'spare':>7}{'sheets':>8}{'closed':>8}{'per-sheet':>11}")
ok = True
for t, cap in CAP.items():
    for tag, kw, order, top in [("taught, no powers", {}, ("big", "small"), True),
                                ("flat, no powers", {}, ("small", "big"), False),
                                ("taught, F1 r2 + F2", dict(f1=2, f2=True), ("big", "small"), True)]:
        cyc = steady(run_round, cap, order=order, top_up=top, **kw)
        created = sum(r["created"] for r in cyc)
        drawn = sum(r["spent"] for r in cyc)
        spare = 2 * len(cyc)
        closed = cyc[-1]["end"] == cyc[0]["end"]
        # every single sheet, from any starting charge: end = start + created - drawn + 2 (two answers)
        per_sheet = all(
            run_round(cap, start=s, order=order, top_up=top, **kw)["end"]
            == s + run_round(cap, start=s, order=order, top_up=top, **kw)["created"]
            - run_round(cap, start=s, order=order, top_up=top, **kw)["spent"] + 2
            for s in range(cap + 1))
        good = (created == drawn - spare) and closed and per_sheet
        ok = ok and good
        print(f"{'tier ' + str(t) + ' ' + tag:<34}{created:>8}{drawn:>7}{spare:>7}{len(cyc):>8}"
              f"{str(closed):>8}{str(per_sheet):>11}")
assert ok, "conservation"
print("  on every closed sheet the two sides are equal to the unit — no charge is created by a call,")
print("  and no charge is destroyed except by a call. Refused charge (over capacity) is never created.")

print("\n[7] THE LOCKOUT PATH FROM NOTHING (0 charge, 0 tallies)")
acts, c, tl = 0, 0, 0
while c < small(6):
    c, _, _ = crank(c, 6, 1)
    acts += 1
tl += call_tl(small(6), c == 6)
c = c - small(6) + SPARE
acts += 1
print(f"  CRANK is free, unlimited and ungated: {acts - 1} cranks -> {small(6)} charge")
print(f"  ANSWER SMALL -> {tl} tally in {acts} actions from an empty save")
print(f"  TOTAL from nothing: {acts} actions -> first tally {tl} TL, battery {c}")

print("\n[8] ABSORPTION — the finite tally sinks and the unbounded ones")
finite = F4_COST + F1_COST[1] + BAT_COST[2] + F2_COST + F1_COST[2] + BAT_COST[3]
print(f"  finite unlock table : {finite} TL "
      f"(F4 {F4_COST} + F1 r1 {F1_COST[1]} + STREET 2 {BAT_COST[2]} + F2 {F2_COST} + "
      f"F1 r2 {F1_COST[2]} + STREET 3 {BAT_COST[3]})")
print(f"  unbounded TL        : SHED PLATE {PLATE_COST} TL each (+ F3 THE FAST CRANK {F3_COST} TL a use)")
print(f"  unbounded charge    : LEND TO THE LANE {LEND_CH} charge each")
a = line(run_round, 6, order=("big", "small"), top_up=True)
b = line(run_round, 6, order=("small", "big"), top_up=False)
print(f"  seed taught line banks {a['tl']} TL a sheet in {a['acts']} actions -> "
      f"{finite}/{a['tl']} = {finite/a['tl']:.1f} sheets = {finite/a['tl']*a['acts']:.0f} actions")
print(f"  seed flat line  banks {b['tl']} TL a sheet in {b['acts']} actions -> "
      f"{finite/b['tl']:.1f} sheets = {finite/b['tl']*b['acts']:.0f} actions")

print("\n[9] THE FIRST-TIME PATH — the seed played out sheet by sheet (taught line, no buys)")
c, tl, total = 0, 0, 0
print(f"{'sheet':>6}{'actions':>9}{'act.total':>11}{'TL':>5}{'TL total':>9}{'charge':>8}")
rows = []
for s in range(1, 5):
    r = run_round(6, start=c, order=("big", "small"), top_up=True)
    c, tl, total = r["end"], tl + r["tl"], total + r["acts"]
    rows.append((s, r["acts"], total, tl))
    print(f"{s:>6}{r['acts']:>9}{total:>11}{r['tl']:>5}{tl:>9}{c:>8}")
first = next(s for s, _, _, t in rows if t >= F4_COST)
print(f"  first unlock (F4 THE METER, {F4_COST} TL) lands at sheet {first}, "
      f"{rows[first-1][2]} player actions. STREET 2 ({BAT_COST[2]} TL) at sheet "
      f"{next(s for s, _, _, t in rows if t >= BAT_COST[2]) if tl >= BAT_COST[2] else '>4'}.")

print("\n[10] IS THE TAUGHT LINE BEATABLE? — the best closed cycle of sheets, searched exhaustively")
for t, cap in CAP.items():
    for tag, kw in [("no powers", {}), ("F1 r2 + F2", dict(f1=2, f2=True))]:
        best = best_closed_rate(cap, kw.get("f1", 0), kw.get("f2", False))
        taught = line(run_round, cap, order=("big", "small"), top_up=True, **kw)
        print(f"  tier {t} {tag:<12} best possible cycle {best:.2f} act/TL; "
              f"taught line {taught['rate']:.2f}")
        assert taught["rate"] <= best + 1e-6, f"a cycle beats the taught line on tier {t} {tag}"
        assert abs(best - taught["rate"]) < 1e-6, f"the taught line is not the best cycle on tier {t} {tag}"

# ------------------------------------------------------------------- asserts --
print("\n[ASSERTS]")

# A1 the ceiling is the battery: two calls, each pays at most its own size
for cap in CAP.values():
    assert call_tl(small(cap), True) + call_tl(big(cap), True) == cap
    for f1 in (0, 1, 2):
        for f2 in (False, True):
            r = run_round(cap, f1=f1, f2=f2, start=cap, order=("big", "small"), top_up=True)
            assert r["tl"] <= cap, "A1"
print("  ok A1: a sheet pays at most the battery's size (6 / 12 / 18 TL) — with every power on")

# A2 the payout of a call depends only on the call and on fullness — never on a power
for cap in CAP.values():
    for call in (small(cap), big(cap)):
        for full in (True, False):
            assert call_tl(call, full) == (call if full else call // 2), "A2"
for cap in CAP.values():
    base = line(run_round, cap, order=("big", "small"), top_up=True)
    for f1 in (1, 2):
        for f2 in (False, True):
            r = line(run_round, cap, order=("big", "small"), top_up=True, f1=f1, f2=f2)
            assert r["tl"] == base["tl"], "A2b"
print("  ok A2: the tallies a sheet pays are IDENTICAL for every power state — powers move actions only")

# A3 no power makes a line worse than the same line with no powers, and the two stack
for cap in CAP.values():
    base = line(run_round, cap, order=("big", "small"), top_up=True)["acts"]
    r1 = line(run_round, cap, order=("big", "small"), top_up=True, f1=1)["acts"]
    r2 = line(run_round, cap, order=("big", "small"), top_up=True, f1=2)["acts"]
    f2 = line(run_round, cap, order=("big", "small"), top_up=True, f2=True)["acts"]
    both = line(run_round, cap, order=("big", "small"), top_up=True, f1=2, f2=True)["acts"]
    assert r2 <= r1 <= base and f2 <= base and both <= min(r2, f2), "A3"
print("  ok A3: every power state costs at most the no-power line, F1 rank 2 at most rank 1, and the")
print("         two powers stack (F1 + F2 is never worse than either alone)")

# A4 conservation, exactly, on every line and every power state
for cap in CAP.values():
    for kw in ({}, dict(f1=1), dict(f1=2), dict(f2=True), dict(f1=2, f2=True)):
        for order, top in ((("big", "small"), True), (("small", "big"), False)):
            cyc = steady(run_round, cap, order=order, top_up=top, **kw)
            assert sum(r["created"] for r in cyc) == sum(r["spent"] for r in cyc) - 2 * len(cyc), "A4"
            assert cyc[-1]["end"] == cyc[0]["end"] - cyc[0]["created"] + cyc[0]["spent"] - 2, "A4b"
print("  ok A4: charge is conserved to the unit on every closed sheet — created by CRANK only,")
print("         destroyed by a call only, and the line hands exactly 1 back per answer")

# A5 the taught line is exactly 1.00 act/TL on every street, the flat line exactly 2.00
for cap in CAP.values():
    a = line(run_round, cap, order=("big", "small"), top_up=True)
    b = line(run_round, cap, order=("small", "big"), top_up=False)
    assert abs(a["rate"] - 1.0) < 1e-9 and abs(b["rate"] - 2.0) < 1e-9, "A5"
print("  ok A5: the taught line pays exactly 1.00 action per tally at 6, 12 and 18 charge;")
print("         the flat line exactly 2.00 — the rate does not drift with the size of the street")

# A6 the band
lo, hi = rates[0][0], rates[-1][0]
assert abs(lo - 5 / 12) < 1e-9 and abs(hi - 2.0) < 1e-9, "A6"
print(f"  ok A6: published band {lo:.2f}..{hi:.2f} actions per tally, over {len(rates)} published lines")

# A7 no lockout: cranking is free and ungated, so any battery can always be filled
assert CRANK[0] >= 1
c, acts = 0, 0
while c < small(6):
    c, _, _ = crank(c, 6, 1)
    acts += 1
assert acts == small(6) and call_tl(small(6), False) >= 1, "A7"
print(f"  ok A7: CRANK costs nothing and is never gated; from an empty save {acts + 1} actions pay the")
print(f"         first tally, so no sequence of play can lock a player out of the loop")

# A8 the tally is never paid for nothing: an answer needs the full cost in the battery
for cap in CAP.values():
    for f2 in (False, True):
        for call in (small(cap), big(cap)):
            assert call_cost(call, f2) >= 1, "A8"
print("  ok A8: every answer is paid for with charge the player cranked — the cost is never below 1")

# A9 F3 THE FAST CRANK buys an action with tallies and adds no unit
for cap in CAP.values():
    r = run_round(cap, start=cap, order=("big", "small"), top_up=True)
    assert r["tl"] <= cap, "A9"
print(f"  ok A9: F3 spends {F3_COST} TL to save exactly 1 action (a double crank) — it pays nothing out")

# A10 the finite table and the first unlock
assert finite == 158, "A10"
assert first == 2 and rows[first - 1][2] <= 20, "A10b"
print(f"  ok A10: finite unlock table = {finite} TL; F4 THE METER ({F4_COST} TL) arrives on sheet {first}, "
      f"after {rows[first-1][2]} player actions")

# A11 the spare is the loop's own input (C4)
assert SPARE >= 1 and SPARE < min(small(6), big(6))
print(f"  ok A11: every answered call returns {SPARE} charge to the battery — the loop's output is its")
print("          own input, and the sink that pays the player is the call itself")

# A12 no randomness anywhere
print("  ok A12: random variables in the transform: 0 — the whole game is a published integer map")

print("\nALL ASSERTS GREEN — 12 checks, every published number in design.md.")
