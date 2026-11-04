import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { getPressPay, press, upgradePress } from "~/lib/press-pay";
import {
  PI_BUTTON_PRESSES,
  PRESS_TIERS,
  PRESS_UPGRADE_COST,
  type PressTierView,
} from "~/lib/press-pay-rules";
import { piAlgoDollars } from "~/lib/upayu";
import type { Snapshot } from "~/lib/upayu";

export const Route = createFileRoute("/press-pay")({
  head: () => ({ meta: [{ title: "Press Pay Btn — Pierce Collabs" }] }),
  component: PressPayPage,
});

type Reply = Snapshot & { message?: string; error?: string; awarded?: number };

const KIND_LABEL: Record<string, string> = {
  sip: "Sip",
  drip: "Drip",
  convert: "Converted",
  art: "Art",
  press: "Press",
};

/** Before the bridge answers, the first button still has to look pressable. */
const FALLBACK_TIERS: PressTierView[] = PRESS_TIERS.map((tier) => ({
  ...tier,
  unlocked: !tier.hidden,
  affordable: false,
  net: tier.pays - tier.cost,
}));

function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function count(n: number): string {
  return n.toLocaleString("en-US");
}

type Float = { id: number; text: string; tier: string };

function PressPayPage() {
  const [snapshot, setSnapshot] = useState<Reply | null>(null);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [floats, setFloats] = useState<Float[]>([]);
  const [hit, setHit] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  // Presses can be in flight together; only the newest answer may land, so a
  // slow reply can never drag the balance backwards.
  const sent = useRef(0);
  const applied = useRef(0);
  const floatId = useRef(0);

  useEffect(() => {
    let live = true;
    getPressPay()
      .then((result) => {
        if (live) setSnapshot(result);
      })
      .catch(() => {
        if (live) setNote({ text: "The bridge is unreachable — the balance can't be read.", ok: false });
      });
    return () => {
      live = false;
    };
  }, []);

  async function doPress(tier: PressTierView) {
    const seq = ++sent.current;
    setHit(tier.id);
    window.setTimeout(() => setHit((current) => (current === tier.id ? null : current)), 140);

    try {
      const reply = await press({ data: { tier: tier.id } });
      if (seq < applied.current) return;
      applied.current = seq;
      setSnapshot(reply);

      if (reply.ok) {
        const id = ++floatId.current;
        const gained = reply.awarded ?? tier.net;
        setFloats((list) => [...list, { id, text: `+${count(gained)}`, tier: tier.id }].slice(-8));
        window.setTimeout(() => setFloats((list) => list.filter((f) => f.id !== id)), 1100);
        setNote(null);
      } else {
        setNote({ text: reply.error ?? "That press didn't go through.", ok: false });
      }
    } catch {
      setNote({ text: "The bridge is unreachable — nothing changed.", ok: false });
    }
  }

  async function doUpgrade() {
    setUpgrading(true);
    try {
      const reply = await upgradePress();
      setSnapshot(reply);
      setNote(
        reply.ok
          ? { text: reply.message ?? "Double Your Clicks is on.", ok: true }
          : { text: reply.error ?? "The upgrade didn't go through.", ok: false },
      );
    } catch {
      setNote({ text: "The bridge is unreachable — nothing changed.", ok: false });
    } finally {
      setUpgrading(false);
    }
  }

  const pressState = snapshot?.press ?? null;
  const points = snapshot?.account?.points ?? 0;
  const presses = pressState?.presses ?? 0;
  const perClick = pressState?.perClick ?? 1;
  const upgraded = pressState?.upgraded ?? false;
  const piUnlocked = pressState?.piUnlocked ?? false;
  const tiers = pressState?.tiers ?? FALLBACK_TIERS;

  // Hidden means hidden: the Pi button is not in the markup until it is open.
  const visible = tiers.filter((tier) => tier.unlocked || !tier.hidden);
  const ledger = (snapshot?.account?.ledger ?? []).slice(0, 6);
  const dollarValue = snapshot?.dollarValue ?? piAlgoDollars(points);
  const progress = Math.min(1, presses / PI_BUTTON_PRESSES);

  const hint =
    presses >= PI_BUTTON_PRESSES
      ? "The Pi button is here."
      : presses >= 500
        ? "Something unlocks at a rounder number."
        : presses >= 100
          ? "The counter is keeping track."
          : "Every press counts towards something.";

  return (
    <div className="pp-page">
      <header className="pp-head">
        <Link to="/" className="pp-brand">
          Pierce Collabs
        </Link>
        <nav className="pp-nav">
          <Link to="/art">Art studio</Link>
          <Link to="/sip-drip">Sip Drip</Link>
          <Link to="/press-pay" className="pp-on">
            Press Pay Btn
          </Link>
          <Link to="/balance">Balance</Link>
        </nav>
      </header>

      <main className="pp-wrap">
        <section>
          <p className="pp-kicker">Press Pay Btn</p>
          <h1 className="pp-title">Every press pays ten times what it costs.</h1>
          <p className="pp-lede">
            One point in, ten points back — the points land on the same UPayU account every app in
            the ecosystem writes to, and every press writes a line to the RUHBI ledger. Points only:
            nothing here moves money. The dollar figures are the Pi Algo's reading of the points.
          </p>
        </section>

        <section className="pp-stage">
          <div className="pp-buttons">
            {visible.map((tier) => {
              const isMain = tier.id === "one";
              const isPi = tier.id === "pi";
              const size = isMain ? "pp-btn-main" : isPi ? "pp-btn-pi" : "pp-btn-mid";
              return (
                <div className="pp-slot" key={tier.id}>
                  <button
                    type="button"
                    className={`pp-btn ${size} ${isPi ? "pp-btn-pi" : ""} ${hit === tier.id ? "pp-btn-hit" : ""}`}
                    disabled={!tier.affordable}
                    onClick={() => doPress(tier)}
                    aria-label={`${tier.label} — press ${tier.cost} point${tier.cost === 1 ? "" : "s"}, get ${tier.pays} back`}
                  >
                    <span className="pp-cap">{isPi ? "π" : "Press"}</span>
                    <span className="pp-num">+{count(tier.pays)}</span>
                    <span className="pp-btn-fine">{count(tier.cost)} in</span>
                  </button>
                  {floats
                    .filter((f) => f.tier === tier.id)
                    .map((f) => (
                      <span className="pp-float" key={f.id}>
                        {f.text}
                      </span>
                    ))}
                  <span className="pp-slot-cap">{tier.label}</span>
                </div>
              );
            })}
          </div>

          <div className="pp-panel">
            <p className="pp-panel-label">UPayU balance</p>
            <p className="pp-balance">
              {count(points)}
              <small>points</small>
            </p>
            <p className="pp-sub">
              ${money(dollarValue)} at the Pi Algo — floor(π × 100 × points²).{" "}
              {upgraded ? "Double Your Clicks is on: every press counts twice." : hint}
            </p>

            <div className="pp-bar" aria-hidden="true">
              <div className="pp-bar-fill" style={{ width: `${Math.round(progress * 100)}%` }} />
            </div>
            <div className="pp-count">
              <span className="pp-count-num">{count(presses)}</span>
              <span className="pp-count-label">
                presses counted
                {perClick > 1 ? ` · ×${perClick} per click` : ""}
              </span>
            </div>

            {note && (
              <p className={`pp-note ${note.ok ? "pp-note-ok" : "pp-note-bad"}`}>{note.text}</p>
            )}
          </div>
        </section>

        {piUnlocked && (
          <p className="pp-note pp-note-ok" style={{ marginTop: 18 }}>
            You found the Pi button — a hundred points in, a thousand back.
          </p>
        )}

        <section className="pp-cards">
          {visible.map((tier) => {
            const isPi = tier.id === "pi";
            return (
              <article
                key={tier.id}
                className={`pp-card ${tier.unlocked ? "" : "pp-card-off"} ${isPi ? "pp-card-pi" : ""}`}
              >
                <div className="pp-card-top">
                  <h2 className="pp-card-name">{tier.label}</h2>
                  <span className="pp-card-net">+{count(tier.net)}</span>
                </div>
                <p className="pp-card-body">
                  {tier.blurb} That reads as ${money(piAlgoDollars(tier.cost))} in and $
                  {money(piAlgoDollars(tier.pays))} back at the Pi Algo — points, not money.
                </p>
                <p className="pp-card-body">
                  {tier.unlocked
                    ? tier.affordable
                      ? "Open. Press it whenever you like."
                      : `Open, but the account needs ${count(tier.cost)} points to press it.`
                    : `Opens at ${count(tier.unlockPoints)} points — the account holds ${count(points)}.`}
                </p>
                <div className="pp-card-act">
                  <button
                    type="button"
                    className={`pp-mini ${isPi ? "pp-mini-gold" : ""}`}
                    disabled={!tier.unlocked || !tier.affordable}
                    onClick={() => doPress(tier)}
                  >
                    {tier.unlocked ? `Press · ${count(tier.cost)} in` : `Locked · ${count(tier.unlockPoints)}`}
                  </button>
                </div>
              </article>
            );
          })}
        </section>

        <section className={`pp-upgrade ${upgraded ? "pp-upgrade-on" : ""}`}>
          <div>
            <h2>Double Your Clicks</h2>
            <p>
              {upgraded
                ? "On. Every press counts twice, so the counter climbs twice as fast."
                : `Costs ${count(PRESS_UPGRADE_COST)} points, once. From then on every press counts twice — and the counter at ${count(PI_BUTTON_PRESSES)} leads somewhere.`}
            </p>
          </div>
          <button
            type="button"
            className={`pp-mini ${upgraded ? "" : "pp-mini-gold"}`}
            disabled={upgraded || upgrading || points < PRESS_UPGRADE_COST}
            onClick={doUpgrade}
          >
            {upgraded
              ? "On"
              : upgrading
                ? "Buying…"
                : points < PRESS_UPGRADE_COST
                  ? `Needs ${count(PRESS_UPGRADE_COST)} points`
                  : `Buy · ${count(PRESS_UPGRADE_COST)} points`}
          </button>
        </section>

        <section className="pp-stats">
          <div className="pp-stat">
            <p className="pp-stat-label">Points in</p>
            <p className="pp-stat-value">{count(pressState?.paid ?? 0)}</p>
          </div>
          <div className="pp-stat">
            <p className="pp-stat-label">Points out</p>
            <p className="pp-stat-value">{count(pressState?.earned ?? 0)}</p>
          </div>
          <div className="pp-stat">
            <p className="pp-stat-label">Presses counted</p>
            <p className="pp-stat-value">{count(presses)}</p>
          </div>
          <div className="pp-stat">
            <p className="pp-stat-label">Value at the algo</p>
            <p className="pp-stat-value">${money(dollarValue)}</p>
          </div>
        </section>

        {ledger.length > 0 && (
          <section className="pp-recent">
            <h2>Recent activity</h2>
            <ul>
              {ledger.map((entry) => (
                <li key={entry.id}>
                  <span className="pp-what">
                    <b>{KIND_LABEL[entry.kind] ?? entry.kind}</b> · {entry.note}
                  </span>
                  <span className={entry.points < 0 ? "pp-pts pp-pts-neg" : "pp-pts"}>
                    {entry.points > 0 ? "+" : ""}
                    {count(entry.points)} pts
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="pp-fine">
          Points only. A press spends points and pays ten times as many back into the same account
          — no money changes hands in this app, and none is taken. The $314, $3,141 and $31,415
          figures are the Pi Algo's reading of 1, 10 and 100 points, not a payout. Every press is
          one line in the RUHBI ledger, which replays to the balance the account holds.
        </p>
      </main>

      <footer className="pp-foot">
        <p>Pierce Collabs. Draft concept, not yet launched.</p>
      </footer>
    </div>
  );
}
