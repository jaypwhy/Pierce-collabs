import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-neutral-950 px-6 py-12 text-center text-neutral-100">
      <p className="text-xs uppercase tracking-[0.4em] text-lime-400">
        The Gaming Layer
      </p>
      <h1 className="font-pixel text-2xl leading-relaxed text-lime-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)] sm:text-3xl">
        GAMES WITH HONEST LOOPS
      </h1>
      <p className="max-w-xl text-sm leading-relaxed text-neutral-400">
        A published rule set for closed-loop game economies: no ads, no loot
        boxes, no pay-to-win, no pay-to-skip. Free entrance, free exit, and
        nothing decays while you are away. Don't read about it — play it.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <a
          href="/bin-runner"
          className="pixel-btn bg-lime-300 px-6 py-4 text-sm text-neutral-950"
        >
          ▶ TRY THE LOOP — BIN RUNNER
        </a>
        <a
          href="/brick-break"
          data-testid="home-brick-break"
          className="pixel-btn bg-amber-700 px-6 py-4 text-sm text-amber-50"
        >
          ▶ TRY THE LOOP — BRICK BREAK
        </a>
        <a
          href="/paper-airplane"
          data-testid="home-paper-airplane"
          className="pixel-btn bg-neutral-800 px-6 py-4 text-sm text-amber-200"
        >
          ▶ TRY THE LOOP — PAPER AIRPLANE
        </a>
        <a
          href="/soil-stack"
          data-testid="home-soil-stack"
          className="pixel-btn bg-[#3a2a15] px-6 py-4 text-sm text-lime-300"
        >
          ▶ TRY THE LOOP — SOIL STACK
        </a>
        <a
          href="/local-energy"
          data-testid="home-local-energy"
          className="pixel-btn bg-[#1d2733] px-6 py-4 text-sm text-amber-200"
        >
          ▶ TRY THE LOOP — KETTLE LANE
        </a>
        <a
          href="/repair-cafe"
          data-testid="home-repair-cafe"
          className="pixel-btn bg-[#3a2a18] px-6 py-4 text-sm text-amber-100"
        >
          ▶ TRY THE LOOP — LEND &amp; MEND
        </a>
      </div>
      <div className="grid max-w-3xl gap-6 text-left sm:grid-cols-2">
        <div className="border-2 border-lime-500/20 bg-neutral-900/40 p-4">
          <p className="font-pixel text-[10px] text-lime-300">BIN RUNNER</p>
          <p className="mt-2 max-w-md text-[10px] leading-relaxed text-neutral-500">
            A 90-second sorting run inside the loop: sort scrap, print repaired
            jacks, earn Stamps, unlock boards. In-game units only — no
            purchases, no accounts, no real-money conversion.
          </p>
        </div>
        <div className="border-2 border-amber-500/20 bg-neutral-900/40 p-4">
          <p className="font-pixel text-[10px] text-amber-300">BRICK BREAK</p>
          <p className="mt-2 max-w-md text-[10px] leading-relaxed text-neutral-500">
            A wall, a ram and a salvage cart — the wall is the run: break
            bricks for materials, clear rows for Seals, and lay what you reclaim
            back into the yard. No clock, no purchases, nothing decays while
            you are away.
          </p>
        </div>
        <div className="border-2 border-amber-500/20 bg-neutral-900/40 p-4">
          <p className="font-pixel text-[10px] text-amber-200">PAPER AIRPLANE</p>
          <p className="mt-2 max-w-md text-[10px] leading-relaxed text-neutral-500">
            Fold a sheet into a plane, throw it off the mill's roofline rail and
            land it in a baler: the landing ends the flight — no clock, no
            charge, no board. Earn sheets and medallions, buy skill ranks with
            medallions, and read the wind before every throw.
          </p>
        </div>
        <div className="border-2 border-lime-500/20 bg-neutral-900/40 p-4">
          <p className="font-pixel text-[10px] text-lime-300">SOIL STACK</p>
          <p className="mt-2 max-w-md text-[10px] leading-relaxed text-neutral-500">
            Glean scraps free at the gate, load the bin green and brown, turn
            the pile until it ripens, and empty it as soil for the beds — a
            hot pile (one brown per three loads) takes half the turns. The bin
            is sealed when you leave: the pile advances only on your turn.
          </p>
        </div>
        <div className="border-2 border-amber-500/20 bg-neutral-900/40 p-4">
          <p className="font-pixel text-[10px] text-amber-300">KETTLE LANE</p>
          <p className="mt-2 max-w-md text-[10px] leading-relaxed text-neutral-500">
            A fictional street battery, a dynamo and a call sheet: crank the
            battery, answer the small call and the big call, and a call answered
            from a full battery pays double. The sheet waits for ever — no clock,
            no randomness, nothing decays while you are away.
          </p>
        </div>
        <div className="border-2 border-amber-500/20 bg-neutral-900/40 p-4">
          <p className="font-pixel text-[10px] text-amber-200">LEND &amp; MEND</p>
          <p className="mt-2 max-w-md text-[10px] leading-relaxed text-neutral-500">
            A fictional repair cafe and tool library: carry parts onto the
            bench, fix the small job and the big job, and a fix that leaves the
            bench exactly empty pays full — leave a part over and it pays half.
            The card waits for ever; nothing decays while you are away.
          </p>
        </div>
      </div>
    </main>
  );
}