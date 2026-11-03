import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { piAlgoDollars } from "~/lib/upayu";
import type { Snapshot } from "~/lib/upayu";
import { SIP_POINTS, createSipDripGame, setMuted } from "~/lib/sip-drip-game";
import type { SipDripGame } from "~/lib/sip-drip-game";

export const Route = createFileRoute("/sip-drip")({
  head: () => ({ meta: [{ title: "Sip Drip — Pierce Collabs" }] }),
  component: SipDripPage,
});

type BridgeReply = Snapshot & { message?: string; error?: string };

/** Fallback rungs before the bridge answers — the same Pi Algo rungs. */
const FALLBACK_LADDER = [1, 10, 100, 1000].map((points) => ({
  points,
  dollars: piAlgoDollars(points),
}));

function money(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function SipDripPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const gameRef = useRef<SipDripGame | null>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [note, setNote] = useState<{ text: string; ok: boolean } | null>(null);
  const [muted, setMutedState] = useState(false);
  const [, setTick] = useState(0);

  // The engine owns the pixels; every number it draws comes back from the bridge.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let alive = true;

    const apply = (reply: BridgeReply) => {
      if (!alive) return;
      setSnapshot(reply);
      gameRef.current?.setSnapshot(reply);
      if (!reply.ok) {
        const message = reply.error ?? "That didn't go through.";
        setNote({ text: message, ok: false });
        gameRef.current?.flash("NOT YET", false);
      } else if (reply.message) {
        setNote({ text: reply.message, ok: true });
      }
    };

    const send = async (path: string, body?: unknown) => {
      try {
        const response = await fetch(path, {
          method: "POST",
          headers: body === undefined ? undefined : { "content-type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        apply((await response.json()) as BridgeReply);
      } catch {
        if (alive) setNote({ text: "The bridge is unreachable — nothing changed.", ok: false });
      }
    };

    const game = createSipDripGame(canvas, {
      onSip: () => {
        void send("/api/sip", { points: SIP_POINTS, note: "Sip Drip — sip" });
      },
      onDrip: () => {
        void send("/api/drip");
      },
    });
    gameRef.current = game;

    fetch("/api/balance", { headers: { accept: "application/json" } })
      .then((response) => response.json() as Promise<Snapshot>)
      .then((reply) => {
        if (!alive) return;
        setSnapshot(reply);
        game.setSnapshot(reply);
      })
      .catch(() => {
        if (alive) {
          setNote({ text: "The bridge is unreachable — the balance can't be read.", ok: false });
        }
      });

    return () => {
      alive = false;
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  // Keyboard: space/enter sips, D drips. Buttons and links keep their own keys.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      if (tag === "BUTTON" || tag === "A") return;

      if (event.code === "Space" || event.code === "Enter" || event.code === "ArrowUp") {
        event.preventDefault();
        gameRef.current?.tapSip();
      } else if (event.key.toLowerCase() === "d") {
        event.preventDefault();
        gameRef.current?.tapDrip();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Local clock for the countdown; the server's lastDripAt stays the source of truth.
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 250);
    return () => clearInterval(timer);
  }, []);

  const ladder = snapshot?.ladder?.length ? snapshot.ladder : FALLBACK_LADDER;
  const points = snapshot?.account.points ?? 0;
  const dollars = snapshot?.account.dollars ?? 0;
  const dripPoints = snapshot?.drip.points ?? 25;

  const cooldownMs = snapshot?.drip.cooldownMs ?? 60_000;
  const lastDripAt = snapshot?.account.lastDripAt ? Date.parse(snapshot.account.lastDripAt) : 0;
  const remainingMs = lastDripAt ? Math.max(0, lastDripAt + cooldownMs - Date.now()) : 0;
  const remainingS = Math.ceil(remainingMs / 1000);
  const ready = snapshot !== null && remainingMs === 0;

  const nextRung = ladder.find((rung) => points < rung.points) ?? null;
  const progress = nextRung ? Math.min(1, points / nextRung.points) : 1;

  return (
    <div className="sd-page">
      <header className="sd-head sd-wrap">
        <Link to="/" className="sd-brand">
          Pierce Collabs
        </Link>
        <nav className="sd-nav">
          <Link to="/balance">Balance</Link>
          <Link to="/art">Art</Link>
        </nav>
      </header>

      <main className="sd-wrap">
        <div className="sd-top">
          <div>
            <p className="sd-kicker">Arcade / UPayU</p>
            <h1 className="sd-title">Sip Drip</h1>
          </div>
          <button
            type="button"
            className="sd-sound"
            aria-pressed={muted}
            onClick={() => {
              const next = !muted;
              setMutedState(next);
              setMuted(next);
            }}
          >
            Sound {muted ? "off" : "on"}
          </button>
        </div>

        <section className="sd-screen">
          <canvas
            ref={canvasRef}
            className="sd-canvas"
            role="application"
            aria-label="Sip Drip arcade: tap SIP to earn points, tap DRIP once a minute for a larger amount"
          />
        </section>

        <div className="sd-controls">
          <button type="button" className="sd-btn sd-btn-sip" onClick={() => gameRef.current?.tapSip()}>
            Sip +{SIP_POINTS}
          </button>
          <button
            type="button"
            className={ready ? "sd-btn sd-btn-drip" : "sd-btn sd-btn-off"}
            aria-disabled={!ready}
            onClick={() => gameRef.current?.tapDrip()}
          >
            {ready ? `Drip +${dripPoints}` : `Drip in ${remainingS}s`}
          </button>
        </div>

        <p className="sd-hint">Space or Enter = sip · D = drip · tap the cup buttons on a phone</p>

        {note && (
          <p aria-live="polite" className={`sd-note ${note.ok ? "sd-note-ok" : "sd-note-bad"}`}>
            {note.text}
          </p>
        )}

        <section className="sd-cards">
          <div className="sd-card">
            <p className="sd-label">Points</p>
            <p className="sd-value">{points.toLocaleString("en-US")}</p>
            <p className="sd-sub">in the bridge</p>
          </div>
          <div className="sd-card">
            <p className="sd-label">Bridge value</p>
            <p className="sd-value sd-value-green">${money(points / 100)}</p>
            <p className="sd-sub">
              100 pts = $1 · ${money(dollars)} settled
            </p>
          </div>
          <div className="sd-card">
            <p className="sd-label">Drip</p>
            <p className="sd-value sd-value-amber">{ready ? "READY" : `${remainingS}s`}</p>
            <p className="sd-sub">+{dripPoints} pts every 60s</p>
          </div>
        </section>

        <section className="sd-ladder">
          <div className="sd-ladder-top">
            <h2 className="sd-label">The pi ladder</h2>
            <p className="sd-sub">
              {nextRung
                ? `${points.toLocaleString("en-US")} / ${nextRung.points.toLocaleString("en-US")} pts`
                : "top rung reached"}
            </p>
          </div>

          <div className="sd-bar">
            <div
              className="sd-bar-fill"
              style={{ width: `${Math.round(progress * 100)}%` }}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              aria-label="Progress toward the next pi rung"
            />
          </div>

          <ul className="sd-rungs">
            {ladder.map((rung) => {
              const reached = points >= rung.points;
              const isNext = nextRung?.points === rung.points;
              const fill = Math.min(1, points / rung.points);
              const classes = ["sd-rung"];
              if (reached) classes.push("sd-rung-hit");
              if (isNext) classes.push("sd-rung-next");
              return (
                <li key={rung.points} className={classes.join(" ")}>
                  <div className="sd-rung-row">
                    <span className="sd-rung-pts">
                      {rung.points.toLocaleString("en-US")} pts
                    </span>
                    <span className="sd-rung-usd">
                      ${rung.dollars.toLocaleString("en-US")}
                    </span>
                  </div>
                  <div className="sd-rung-bar">
                    <div
                      className={reached ? "sd-rung-bar-hit" : "sd-rung-bar-next"}
                      style={{ width: `${Math.round(fill * 100)}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>

          <p className="sd-fine">
            The Pi Algo — floor(π × 100 × points²). 1 point = $314, 10 points = $31,415, and
            conversions settle at exactly that rate on the bridge.
          </p>
        </section>

        <p className="sd-copy">
          Every sip and drip is a real call to the UPayU bridge — points land on the same account the
          art app and the balance page read, so a reload or a restart keeps them. Nothing here pays
          out yet; the RUHBI ledger is the next piece.
        </p>
      </main>

      <footer className="sd-foot">
        <p>Pierce Collabs. Draft concept, not yet launched.</p>
      </footer>
    </div>
  );
}
