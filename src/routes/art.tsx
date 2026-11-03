import { Link, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";

import { ArtEngine, MEDIA, mediumById } from "~/lib/art";
import type { MediumId } from "~/lib/art";
import { getBalance, piAlgoDollars, saveArt } from "~/lib/upayu";
import type { ArtPiece } from "~/lib/upayu";

export const Route = createFileRoute("/art")({
  head: () => ({ meta: [{ title: "Art Integration — Pierce Collabs" }] }),
  component: ArtPage,
});

type Piece = ArtPiece;

function ArtPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<ArtEngine | null>(null);

  const [medium, setMedium] = useState<MediumId>("graphite");
  const [colour, setColour] = useState("#555555");
  const [size, setSize] = useState(14);
  const [sculptMode, setSculptMode] = useState<"push" | "pull">("push");
  const [wheelSpeed, setWheelSpeed] = useState(0.5);

  const [balance, setBalance] = useState(0);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [marks, setMarks] = useState(0);
  const [savedMarks, setSavedMarks] = useState(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const spec = mediumById(medium);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new ArtEngine(canvas);
    engineRef.current = engine;
    engine.onChange = () => {
      setCanUndo(engine.hasUndo());
      setMarks(engine.marks);
    };
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const snapshot = await getBalance();
        if (!live) return;
        setBalance(snapshot.account.points);
        setPieces(snapshot.account.pieces);
      } catch {
        /* the bridge is unreachable — the canvas still works, saving will say so */
      }
    })();
    return () => {
      live = false;
    };
  }, []);

  function pickMedium(id: MediumId) {
    const m = mediumById(id);
    const nextColour = m.colours[0] ?? colour;
    setMedium(id);
    setColour(nextColour);
    setSize(m.size);
    setNote("");
    const engine = engineRef.current;
    if (engine) {
      engine.setMedium(id);
      engine.setColour(nextColour);
      engine.setSize(m.size);
      setMarks(engine.marks);
    }
  }

  function pickColour(hex: string) {
    setColour(hex);
    engineRef.current?.setColour(hex);
  }

  function pickSize(n: number) {
    setSize(n);
    engineRef.current?.setSize(n);
  }

  function pickSculpt(mode: "push" | "pull") {
    setSculptMode(mode);
    engineRef.current?.setSculptMode(mode);
  }

  function pickSpeed(v: number) {
    setWheelSpeed(v);
    engineRef.current?.setWheelSpeed(v);
  }

  function undo() {
    const engine = engineRef.current;
    if (!engine) return;
    if (!engine.undoOne()) return;
    setCanUndo(engine.hasUndo());
    setMarks(engine.marks);
  }

  function clearAll() {
    const engine = engineRef.current;
    if (!engine) return;
    engine.clearAll();
    setCanUndo(engine.hasUndo());
    setMarks(engine.marks);
    setNote("");
  }

  async function savePiece() {
    const engine = engineRef.current;
    if (!engine) return;
    if (engine.marks === 0) {
      setNote("Nothing to save yet — make a mark first.");
      return;
    }
    const distinct = engine.used.size;
    const effort = Math.min(60, Math.floor(engine.marks / 60));
    const points = 100 + distinct * 25 + effort;
    const mediaNames = [...engine.used].map((id) => mediumById(id).name);
    const marksAtSave = engine.marks;

    setSaving(true);
    try {
      const result = await saveArt({
        data: {
          name: name.trim() || "Untitled piece",
          media: mediaNames.join(", ") || mediumById(engine.medium).name,
          points,
          thumb: engine.snapshot(240, 160),
        },
      });
      if (!result.ok) {
        setNote(result.error ?? "The bridge didn't take that piece — try again.");
        return;
      }
      setBalance(result.account.points);
      setPieces(result.account.pieces);
      setSavedMarks(marksAtSave);
      setName("");
      setNote(result.message ?? `Saved — ${points} points into your UPayU balance.`);
    } catch {
      setNote("The bridge is unreachable — your piece wasn't saved.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = marks > 0 && marks !== savedMarks;

  return (
    <div className="min-h-dvh bg-white text-slate-900">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          Pierce Collabs
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/sip-drip"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Sip Drip
          </Link>
          <Link
            to="/balance"
            className="text-sm font-medium text-slate-600 underline-offset-4 hover:text-slate-900 hover:underline"
          >
            Balance
          </Link>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-800">
            UPayU Bridge · live
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <section className="pt-6 sm:pt-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">
            Art Integration App
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Make something. It counts.
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-slate-600">
            Eight media, each behaving like the material it is: graphite that builds with every pass,
            ink that sits opaque on top, watercolour that blooms and dries lighter, acrylic and gesso
            that cover, pastel that catches the paper and smears, relief you push and pull, and a
            wheel that actually turns. Save a finished piece and it earns points in the same balance
            as everything else in the bridge.
          </p>
        </section>

        <section className="mt-10 rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Medium
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Not one brush in eight colours — eight different materials.
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                UPayU balance
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">
                {balance.toLocaleString()}
                <span className="ml-2 text-sm font-normal text-slate-500">
                  points · ${piAlgoDollars(balance).toLocaleString("en-US")}
                </span>
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {MEDIA.map((m) => {
              const active = m.id === medium;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pickMedium(m.id)}
                  className={
                    active
                      ? "rounded-xl bg-slate-900 px-3 py-3 text-left text-white"
                      : "rounded-xl border border-slate-200 px-3 py-3 text-left text-slate-700 transition hover:border-slate-400"
                  }
                >
                  <span className="block text-sm font-semibold">{m.name}</span>
                  <span className="mt-1 block text-xs leading-snug opacity-70">{m.blurb}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-4 border-t border-slate-200 pt-5">
            {spec.colours.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  {medium === "pottery" ? "Clay" : "Colour"}
                </span>
                <div className="flex items-center gap-1.5">
                  {spec.colours.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      aria-label={`Colour ${hex}`}
                      onClick={() => pickColour(hex)}
                      style={{ backgroundColor: hex }}
                      className={
                        hex === colour
                          ? "h-7 w-7 rounded-full ring-2 ring-slate-900 ring-offset-2"
                          : "h-7 w-7 rounded-full ring-1 ring-slate-300 ring-offset-1"
                      }
                    />
                  ))}
                </div>
              </div>
            )}

            {medium === "sculpt" && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  Tool
                </span>
                <div className="flex overflow-hidden rounded-lg border border-slate-300">
                  {(["push", "pull"] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => pickSculpt(mode)}
                      className={
                        sculptMode === mode
                          ? "bg-slate-900 px-3 py-1.5 text-xs font-medium text-white"
                          : "px-3 py-1.5 text-xs font-medium text-slate-600"
                      }
                    >
                      {mode === "push" ? "Push (raise)" : "Pull (sink)"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {medium === "pottery" && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  Wheel
                </span>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={wheelSpeed}
                  onChange={(e) => pickSpeed(Number(e.target.value))}
                  className="w-32 accent-slate-900"
                />
                <span className="text-xs tabular-nums text-slate-500">
                  {Math.round(wheelSpeed * 100)}%
                </span>
              </div>
            )}

            {medium !== "pottery" && (
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium uppercase tracking-widest text-slate-400">
                  Size
                </span>
                <input
                  type="range"
                  min={spec.minSize}
                  max={spec.maxSize}
                  value={size}
                  onChange={(e) => pickSize(Number(e.target.value))}
                  className="w-32 accent-slate-900"
                />
                <span className="text-xs tabular-nums text-slate-500">{size}</span>
              </div>
            )}

            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={undo}
                disabled={!canUndo}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 disabled:opacity-40"
              >
                Undo
              </button>
              <button
                type="button"
                onClick={clearAll}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700"
              >
                Clear
              </button>
            </div>
          </div>
        </section>

        <section className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-3">
          <canvas
            ref={canvasRef}
            width={1200}
            height={800}
            className="block w-full touch-none rounded-xl bg-white shadow-inner"
          />
          <p className="mt-2 px-1 text-xs leading-relaxed text-slate-500">{spec.hint}</p>
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Save the piece
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                A finished piece goes into the same account as everything else and earns points
                through the bridge. 100 points = $1.
              </p>
            </div>
            <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="name this piece"
                className="min-w-[12rem] flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              />
              <button
                type="button"
                onClick={savePiece}
                disabled={!canSave || saving}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
              >
                {saving ? "Saving…" : "Save piece"}
              </button>
            </div>
          </div>

          {note && <p className="mt-3 text-sm font-medium text-amber-800">{note}</p>}

          {pieces.length > 0 && (
            <>
              <h3 className="mt-6 text-xs font-semibold uppercase tracking-widest text-slate-500">
                Your pieces
              </h3>
              <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                {pieces.map((piece) => (
                  <li
                    key={piece.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-200 p-2"
                  >
                    {piece.thumb ? (
                      <img
                        src={piece.thumb}
                        alt=""
                        className="h-14 w-20 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-14 w-20 shrink-0 rounded-md bg-slate-100" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{piece.name}</p>
                      <p className="truncate text-xs text-slate-500">{piece.media}</p>
                      <p className="text-xs tabular-nums text-slate-400">
                        +{piece.points} points
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}

          <p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-500">
            A saved piece goes straight into the bridge: points land on the account behind{" "}
            <Link to="/balance" className="font-medium text-slate-700 underline underline-offset-4">
              your balance
            </Link>
            , where 100 points = $1. It survives a reload and a restart. The RUHBI ledger and the
            payroll behind it are the next piece of work — nothing pays out yet.
          </p>
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8">
        <p className="mx-auto max-w-5xl px-6 text-xs text-slate-400">
          Pierce Collabs. Draft concept, not yet launched.
        </p>
      </footer>
    </div>
  );
}
