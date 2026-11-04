#!/usr/bin/env python3
"""
WINDWARD (paper-airplane sample, game 3 of The Gaming Layer)
Machine checks for paper-airplane-design.md. Run:  python3 paper-airplane-checks.py
Everything the design publishes is derived here, so the doc and the build share one source.
"""
from math import floor

# ---------------------------------------------------------------- constants
GLIDE = {"DART": 20, "GLIDER": 32, "KITE": 40}   # yards, before lift and aim
COST  = {"DART": 0,  "GLIDER": 4,  "KITE": 8}    # sheets, per flight
RIDES = {"DART": False, "GLIDER": True, "KITE": True}   # can it ride the mill draft?
AIM_MAX = 10
GUST   = {"C1": (0, 3, 6), "C2": (0, 3, 6), "C3": (0, 4, 8), "C4": (0, 5, 10)}
COLUMN = {"C1": (2, 6), "C2": (1, 8), "C3": (3, 5), "C4": (2, 8)}   # (count, lift each)
PADS   = {"C1": (16, 32, 46, 58), "C2": (12, 32, 42, 58),
          "C3": (18, 34, 46, 64), "C4": (20, 38, 56, 72)}
PAY_SH = [1, 3, 7, 12, 18]       # index 0 = SHORT, 1..4 = PAD 1..4
PAY_MD = [0, 1, 2, 4, 6]
SQUALL_FOLD_MULT = 1.25          # F2 skill, 1 rank, 12 MD, permanent
MILL_HAND_MAX    = 2             # F1 skill, 2 ranks, 6 / 18 MD
BALE_SH  = 8                     # unbounded sheet sink: 8 SH -> one bale pressed
PLATE_MD = 5                     # unbounded medallion sink: 5 MD -> one bench plate
RECHART_MD = 3                   # repeatable: 3 MD -> the course's next chart
SECOND_PRESS_MD = 4              # F3 per-flight power (repeatable)
WIND_CHART_MD   = 10             # F4 tool, 1 rank
UNLOCKS = [("F1 MILL HAND r1", 6), ("COURSE 2 HARBOUR FLAT", 10), ("F4 WIND CHART", 10),
           ("F2 SQUALL FOLD", 12), ("F1 MILL HAND r2", 18), ("COURSE 3 RIDGE LINE", 24),
           ("COURSE 4 NIGHT RUN", 48)]

# ---------------------------------------------------------------- model
def base(fold, course, squall=False):
    b = GLIDE[fold] + (COLUMN[course][0] * COLUMN[course][1] if RIDES[fold] else 0)
    return floor(b * SQUALL_FOLD_MULT) if squall else b

def reach(fold, course, aim, gust, squall=False, hand=0):
    return base(fold, course, squall) + aim - max(0, gust - hand)

def grade(course, r):
    return sum(1 for p in PADS[course] if r >= p)

def gset(fold, course, squall=False, hand=0):
    lo = reach(fold, course, 0, max(GUST[course]), squall, hand)
    hi = reach(fold, course, AIM_MAX, 0, squall, hand)
    return lo, hi, sorted({grade(course, r) for r in range(lo, hi + 1)})

def band(fold, course, squall=False, hand=0):
    _, _, g = gset(fold, course, squall, hand)
    return PAY_SH[g[0]] - COST[fold], PAY_SH[g[-1]] - COST[fold], PAY_MD[g[0]], PAY_MD[g[-1]]

ALL = [(c, f, sq, hand) for c in PADS for f in GLIDE for sq in (False, True)
       for hand in (0, MILL_HAND_MAX)]

print("=" * 80)
print("A4  FOLD TABLE   (glide and lift are spent into a plane; reach = base + aim - gust)")
print("=" * 80)
print(f"{'fold':7}{'glide':>6}{'rides':>7}{'cost SH':>8}   base reach per course  (with SQUALL FOLD)")
for f in GLIDE:
    cells = []
    for c in PADS:
        b = base(f, c)
        cells.append(f"{c} {b:>3}" + (f"->{base(f, c, True):>3}" if b != base(f, c, True) else "     "))
    print(f"{f:7}{GLIDE[f]:>6}{str(RIDES[f]):>7}{COST[f]:>8}   " + "  ".join(cells))
print()
print("=" * 80)
print("A4  GRADE MATRIX   (unpowered, and with SQUALL FOLD +- MILL HAND 2)")
print("=" * 80)
NAMES = ["SHORT", "PAD1", "PAD2", "PAD3", "PAD4"]
for c in PADS:
    print(f"\n{c}  pads {PADS[c]}  gust {GUST[c]}  draft {COLUMN[c][0]} x lift {COLUMN[c][1]}")
    for f in GLIDE:
        lo, hi, g = gset(f, c)
        lo2, hi2, g2 = gset(f, c, True, MILL_HAND_MAX)
        print(f"   {f:7} {lo:>3}..{hi:>3} -> {','.join(NAMES[i] for i in g):14} | "
              f"all-on {lo2:>3}..{hi2:>3} -> {','.join(NAMES[i] for i in g2)}")

print()
print("=" * 80)
print("PAYOUT TABLE (identical on every course; the ladder's top is the ceiling)")
print("=" * 80)
for i, n in enumerate(NAMES):
    print(f"   {n:6} SH +{PAY_SH[i]:<3} MD +{PAY_MD[i]}")
print()
print("=" * 80)
print("THE BAND PER FLIGHT, and the WITH / WITHOUT-POWER comparison")
print("=" * 80)
print(f"{'course':7}{'fold':8}{'SQUALL':7}{'grades':9}{'SH gross':10}{'SH net':10}{'MD gross':10}")
for c in PADS:
    for f in GLIDE:
        for sq in (False, True):
            lo, hi, g = gset(c and f or f, c, sq)
            _, _, g = gset(f, c, sq)
            nlo, nhi, mlo, mhi = band(f, c, sq)
            print(f"{c:7}{f:8}{str(sq):7}{f'{g[0]}..{g[-1]}':9}"
                  f"{f'{PAY_SH[g[0]]}..{PAY_SH[g[-1]]}':10}{f'{nlo:+d}..{nhi:+d}':10}"
                  f"{f'{mlo}..{mhi}':10}")

gross_lo = min(PAY_SH[gset(f, c)[2][0]] for c in PADS for f in GLIDE)
gross_hi = max(PAY_SH[gset(f, c)[2][-1]] for c in PADS for f in GLIDE)
md_hi    = max(PAY_MD[gset(f, c)[2][-1]] for c in PADS for f in GLIDE)
gross_hi_on = max(PAY_SH[gset(f, c, True, MILL_HAND_MAX)[2][-1]] for c in PADS for f in GLIDE)
md_hi_on    = max(PAY_MD[gset(f, c, True, MILL_HAND_MAX)[2][-1]] for c in PADS for f in GLIDE)
net_lo = min(band(f, c)[0] for c in PADS for f in GLIDE)
net_hi = max(band(f, c)[1] for c in PADS for f in GLIDE)
net_hi_on = max(band(f, c, True, MILL_HAND_MAX)[1] for c in PADS for f in GLIDE)
print()
print(f"  FAUCET CEILING per flight, no powers : SH gross {gross_lo}..{gross_hi}   MD gross 0..{md_hi}")
print(f"  FAUCET CEILING per flight, ALL powers: SH gross {gross_lo}..{gross_hi_on}   MD gross 0..{md_hi_on}"
      f"   -> the top of the band does NOT move")
print(f"  NET band (payout - fold cost), no powers : {net_lo:+d}..{net_hi:+d} SH")
print(f"  NET band, all powers on                  : {net_lo:+d}..{net_hi_on:+d} SH")
assert gross_hi == gross_hi_on and md_hi == md_hi_on == 6
print("  ASSERT ok: no skill, power or multiplier can pay more than the far bale.")

print()
print("  power effect, per fold, on COURSE 1 (the published with/without arithmetic):")
print(f"    {'fold':8}{'without SQUALL FOLD':22}{'with SQUALL FOLD':22}{'delta (worst case)'}")
for f in GLIDE:
    a = band(f, "C1"); b = band(f, "C1", True)
    print(f"    {f:8}{f'{a[0]:+d}..{a[1]:+d} SH / {a[2]}-{a[3]} MD':22}"
          f"{f'{b[0]:+d}..{b[1]:+d} SH / {b[2]}-{b[3]} MD':22}"
          f"+{b[0]-a[0]} SH, +{b[2]-a[2]} MD")
print(f"    (full-ladder shift of the GLIDER draft: {band('GLIDER','C1')} -> {band('GLIDER','C1',True)})")
print(f"    (MILL HAND r2 alone, DART on C1, worst gust: "
      f"reach {reach('DART','C1',0,6,False,0)} -> {reach('DART','C1',0,6,False,2)}; it can lift a borderline")
print("     landing by one pad and can never lift any landing past the far bale.)")

print()
print("=" * 80)
print("LOCKOUT TEST  (L1/L2: at zero sheets, is the loop still reachable?)")
print("=" * 80)
for c in PADS:
    lo, hi, g = gset("DART", c)
    assert COST["DART"] == 0
    assert PAY_SH[g[0]] >= 1, "a free dart must always return at least one sheet"
    assert g[-1] <= 1, "a free dart must never reach PAD 2"
    print(f"   {c}: DART costs 0 SH, reach {lo:>3}..{hi:>3} -> {','.join(NAMES[i] for i in g):10}"
          f" worst payout SH +{PAY_SH[g[0]]}, best SH +{PAY_SH[g[-1]]}")
print("   -> at 0 sheets the free DART still returns at least +1 SH on every course, at the")
print("      worst gust: no player can ever be locked out of the loop.")

print()
print("=" * 80)
print("NEGATIVE-LINE TEST  (does any published fold ever lose the player material?)")
print("=" * 80)
neg = [(c, f, sq, hand, band(f, c, sq, hand)[0]) for c, f, sq, hand in ALL
       if band(f, c, sq, hand)[0] < 0]
for c, f, sq, hand, n in neg:
    print(f"   NEGATIVE: {c} {f} squall={sq} millhand={hand} -> {n:+d} SH")
if not neg:
    print("   no line loses material")
addressed = [x for x in ALL if (x[0], x[1]) == ("C4", "KITE")]
print("   the only case the design accepts: C4 KITE flown WITHOUT SQUALL FOLD, worst gust:")
for c, f, sq, hand in addressed:
    if not sq:
        print(f"      C4 KITE squall={sq} -> net {band(f, c, sq, hand)[0]:+d} SH, "
              f"gross MD {band(f, c, sq, hand)[2]}..{band(f, c, sq, hand)[3]}")

print()
print("=" * 80)
print("REFERENCE POINTS  (four published lines, per flight, COURSE 1)")
print("=" * 80)
refs = [("free DART line (0 sheets held)", "C1", "DART", 7, 3, False, 0),
        ("competent GLIDER line", "C1", "GLIDER", 7, 3, False, 0),
        ("skilled KITE line", "C1", "KITE", 9, 0, False, 0),
        ("KITE + SQUALL FOLD + MILL HAND 2 (everything on)", "C1", "KITE", 10, 6, True, MILL_HAND_MAX)]
print(f"{'line':52}{'base':>5}{'aim':>4}{'gust':>5}{'reach':>6}{'grade':>6}{'SH':>16}{'MD':>4}")
for name, c, f, aim, gust, sq, hand in refs:
    r = reach(f, c, aim, gust, sq, hand)
    g = grade(c, r)
    print(f"{name:52}{base(f,c,sq):>5}{aim:>4}{gust:>5}{r:>6}{NAMES[g]:>6}"
          f"{f'+{PAY_SH[g]}-{COST[f]}={PAY_SH[g]-COST[f]:+d}':>16}{PAY_MD[g]:>4}")
print("   top of the ladder, reached by a 9-aim KITE and by the same KITE with every power on:")
print(f"      unpowered PAD4 = SH +{PAY_SH[4]} / MD +{PAY_MD[4]} | all powers on PAD4 = "
      f"SH +{PAY_SH[4]} / MD +{PAY_MD[4]}  -> identical")

print()
print("=" * 80)
print("C2  ABSORPTION")
print("=" * 80)
fin_md = sum(v for _, v in UNLOCKS)
print(f"   finite MD sinks (the entire unlock table): {fin_md} MD")
print("      " + " + ".join(f"{n} {v}" for n, v in UNLOCKS))
comp_md = PAY_MD[3]
print(f"   competent line earns MD +{comp_md} per flight -> {fin_md} / {comp_md} = "
      f"{fin_md/comp_md:.0f} flights to exhaust every finite MD sink")
print(f"      (~{fin_md/comp_md:.0f} flights x ~45 s = {fin_md/comp_md*45/60:.0f} min, designed, not measured)")
print(f"   then unbounded MD sinks: bench plates {PLATE_MD} MD each, re-chart {RECHART_MD} MD, "
      f"SECOND PRESS {SECOND_PRESS_MD} MD per flight")
comp_net = band("GLIDER", "C1")[1]
print(f"   competent GLIDER line: SH +{PAY_SH[3]} gross - {COST['GLIDER']} fold cost = {comp_net:+d} SH/flight")
print(f"   unbounded sheet sink, the baling order: {BALE_SH} SH per bale, no cap")
print(f"      -> one competent flight presses exactly {comp_net/BALE_SH:.2f} bale"
      f" (net {comp_net} SH vs {BALE_SH} SH per bale)")
dart_net = PAY_SH[1] - COST["DART"]
print(f"   worst-case accumulation (DART only): {dart_net:+d} SH/flight -> 1 bale per "
      f"{BALE_SH/dart_net:.2f} flights")
print(f"   -> every faucet has a sink that can absorb it, and the two material sinks are unbounded")
print(f"      (10 flights of the competent line = {comp_net*10} SH of faucet vs "
      f"{comp_net*10/BALE_SH:.0f} bales = {comp_net*10} SH of sink).")

print()
print("=" * 80)
print("COURSE LADDER  (is every course's far bale reachable, and by what?)")
print("=" * 80)
for c in PADS:
    top = PADS[c][3]
    plain = max(reach(f, c, AIM_MAX, 0) for f in GLIDE)
    sq = max(reach(f, c, AIM_MAX, 0, True) for f in GLIDE)
    sq2 = max(reach(f, c, AIM_MAX, 0, True, MILL_HAND_MAX) for f in GLIDE)
    print(f"   {c} far bale {top:>3} | best unpowered {plain:>3} "
          f"{'REACHABLE' if plain>=top else 'NOT reachable':13} | SQUALL FOLD {sq:>3} "
          f"{'REACHABLE' if sq>=top else 'NOT reachable':13} | +MILL HAND 2 {sq2:>3}")

print()
print("=" * 80)
print("MONOTONICITY  (does any skill or power ever make a flight worse?)")
print("=" * 80)
bad = []
for c in PADS:
    for f in GLIDE:
        b0 = band(f, c); b1 = band(f, c, True); b2 = band(f, c, True, MILL_HAND_MAX)
        if b1[0] < b0[0] or b1[1] < b0[1] or b2[1] < b1[1]:
            bad.append((c, f, b0, b1, b2))
print(f"   courses x folds checked: {len(PADS)*len(GLIDE)}  regressions found: {len(bad)}")
assert not bad
print("   SQUALL FOLD and MILL HAND can only add reach, and more reach is never worse")
print("   (the pads are monotone: a longer flight lands in a pad at least as far down the")
print("   ladder, and the far bale is the last one there is).")

print()
print("=" * 80)
print("UNLOCK TABLE TIMINGS  (designed, not measured)")
print("=" * 80)
for name, cost in UNLOCKS:
    at = lambda md: f"{cost/md:.1f}"
    print(f"   {name:26} {cost:>3} MD | at +1 MD/flight {at(1):>5} flights | "
          f"+2 (PAD2) {at(2):>5} | +4 (PAD3) {at(4):>5} | +6 (PAD4) {at(6):>5}")
print(f"   the headline unlock - COURSE 2 at 10 MD - is {10/2:.0f} flights on a player who lands")
print(f"   PAD 2, i.e. ~5-8 minutes for a first-time player once folding and reading the gust")
print(f"   band are included. Every figure in this table is designed, not measured.")
print(f"   ALL finite MD sinks together: {fin_md} MD = {fin_md/4:.0f} competent flights.")

print()
print("=" * 80)
print("GUST AUDITABILITY")
print("=" * 80)
for c in PADS:
    b = GUST[c]
    print(f"   {c} band {b}, uniform, mean {sum(b)/len(b):.1f} yards, worst case {max(b)} (never more)")
print("   drawn on a counter (gustIndex) stored in the save; the last 20 values are in the export,")
print("   so a stranger can check the band is honest. No power ever re-rolls it: SECOND PRESS")
print("   re-rolls the THROW, not the wind.")
print()
print("=" * 80)
print("ALL ASSERTS PASSED — these are the numbers the design publishes.")
print("=" * 80)
