import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { convert, drip, getBalance, piAlgoDollars, sip } from "~/lib/upayu";
import type { Snapshot } from "~/lib/upayu";

export const Route = createFileRoute("/balance")({
  head: () => ({ meta: [{ title: "UPayU Balance — Pierce Collabs" }] }),
  component: BalancePage,
});

const KIND_LABEL: Record<string, string> = {
  sip: "Sip",
  drip: "Drip",
  convert: "Converted",
  art: "Art",
};

function money(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function BalancePage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const result = await getBalance();
        if (live) setSnapshot(result);
      } catch {
        if (live) setNote("The bridge is unreachable — the balance can't be read right now.");
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  // Keep the drip countdown honest without asking the server every second.
  useEffect(() => {
    const timer = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  async function run(action: () => Promise<Snapshot & { message?: string }>) {
    setBusy(true);
    try {
      const result = await action();
      setSnapshot(result);
      setNote(result.ok ? (result.message ?? "") : (result.error ?? "That didn't go through."));
    } catch {
      setNote("The bridge is unreachable — nothing changed.");
    } finally {
      setBusy(false);
    }
  }

  const account = snapshot?.account;
  const points = account?.points ?? 0;
  const dollars = account?.dollars ?? 0;
  const dollarValue = snapshot?.dollarValue ?? piAlgoDollars(points);

  // A claim is ready once the server says so; the countdown ticks locally.
  const lastDrip = snapshot?.account.lastDripAt ? Date.parse(snapshot.account.lastDripAt) : 0;
  const remaining = snapshot
    ? Math.max(0, Math.ceil((lastDrip + snapshot.drip.cooldownMs - Date.now()) / 1000))
    : 0;
  const ready = snapshot ? snapshot.drip.ready || remaining === 0 : false;
  void tick;

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          Pierce Collabs
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/art"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Art app
          </Link>
          <Link
            to="/sip-drip"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Sip Drip
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24">
        <section className="pt-6 sm:pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            UPayU Bridge
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            One account, everything settles here.
          </h1>
          <p className="mt-4 leading-relaxed text-slate-600">
            Points earned in any app in the ecosystem land on this account and stay there — through
            a reload, through a restart. The Pi Algo sets the rate: 1 point = $314, 10 points = $31,415.
          </p>
        </section>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Points</p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">{points.toLocaleString()}</p>
            <p className="mt-1 text-sm text-slate-500">held in the bridge</p>
          </div>
          <div className="rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Dollar value
            </p>
            <p className="mt-2 text-4xl font-semibold tabular-nums">${money(dollarValue)}</p>
            <p className="mt-1 text-sm text-slate-500">
              ${money(dollars)} already converted
            </p>
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Base income drip
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                +{snapshot?.drip.points ?? 25} points, once a minute.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !ready}
                onClick={() => run(() => drip())}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {ready ? "Drip" : `Drip in ${remaining}s`}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(() => sip({ data: { points: 10, note: "Sip from the balance page" } }))}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                Sip 10
              </button>
              <button
                type="button"
                disabled={busy || points < 1}
                onClick={() => run(() => convert({ data: {} }))}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
              >
                Convert to $
              </button>
            </div>
          </div>
          {note && <p className="mt-3 text-sm font-medium text-amber-800">{note}</p>}
        </section>

        <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            The pi ladder
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            The Pi Algo — floor(π × 100 × points²). 1 point = $314, 10 points = $31,415, 100 points =
            $3,141,592.
          </p>
          <ul className="mt-4 space-y-2">
            {(snapshot?.ladder ?? []).map((rung) => (
              <li
                key={rung.points}
                className="flex items-baseline justify-between rounded-xl bg-white px-4 py-3"
              >
                <span className="text-sm font-medium tabular-nums">
                  {rung.points.toLocaleString()} points
                </span>
                <span className="text-lg font-semibold tabular-nums">
                  ${rung.dollars.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {account && account.ledger.length > 0 && (
          <section className="mt-4 rounded-2xl border border-slate-200 p-5">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
              Recent activity
            </h2>
            <ul className="mt-3 divide-y divide-slate-100">
              {account.ledger.slice(0, 8).map((entry) => (
                <li key={entry.id} className="flex items-baseline justify-between gap-3 py-2">
                  <span className="min-w-0 truncate text-sm text-slate-600">
                    <span className="font-medium text-slate-900">
                      {KIND_LABEL[entry.kind] ?? entry.kind}
                    </span>{" "}
                    · {entry.note}
                  </span>
                  <span
                    className={
                      entry.points < 0
                        ? "shrink-0 text-sm tabular-nums text-slate-400"
                        : "shrink-0 text-sm tabular-nums text-emerald-700"
                    }
                  >
                    {entry.points > 0 ? "+" : ""}
                    {entry.points} pts
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-500">
          The account is a single record held server-side in the bridge — one person, one balance,
          the same one the art app writes into. Nothing here pays out yet: the RUHBI ledger and the
          payroll behind it are the next piece of work.
        </p>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <p className="mx-auto max-w-3xl px-6 text-xs text-slate-400">
          Pierce Collabs. Draft concept, not yet launched.
        </p>
      </footer>
    </div>
  );
}
