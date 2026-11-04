import { createFileRoute } from "@tanstack/react-router";
import {
  formatPi,
  piValue,
  PI_SCALE_NOTE,
  PI_SCALE_TABLE,
} from "~/lib/pi-scale";

export const Route = createFileRoute("/pi-scale")({
  component: PiScalePage,
});

function PiScalePage() {
  return (
    <main className="min-h-dvh bg-[#0a0d12] px-4 py-8 text-amber-100">
      <div className="mx-auto max-w-3xl">
        <header className="border-b-4 border-cyan-500/40 pb-4">
          <h1 className="font-pixel text-lg text-cyan-300 drop-shadow-[3px_3px_0_rgba(0,0,0,0.9)]">
            THE π SCALE
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-[0.25em] text-cyan-500/70">
            one display scale, shared by every game in the layer
          </p>
        </header>

        <section className="mt-5 space-y-3 text-[12px] leading-relaxed text-amber-100/80">
          <p>
            Every game on this site counts in its own whole unit — CS in Bin
            Runner, RK in brick break, SH in paper airplane, SO in SOIL STACK, TL
            in KETTLE LANE, CR in LEND &amp; MEND. Those integers are the game:
            they are what you earn, what you spend, and what the loop conserves.
          </p>
          <p>
            The π scale is a second way of writing the same number so that all
            six games read alike. A value on the π scale is the game&apos;s own
            integer multiplied by ten π, then rounded down to a whole number:
          </p>
          <p className="border-2 border-cyan-500/30 bg-cyan-950/20 px-4 py-3 text-center font-pixel text-sm text-cyan-200">
            value = floor(units × 10π)
          </p>
        </section>

        <section className="mt-6">
          <h2 className="font-pixel text-xs text-lime-300">THE PUBLISHED TABLE</h2>
          <table className="mt-3 w-full border-collapse text-[12px]">
            <thead>
              <tr className="border-b-2 border-cyan-500/30 text-left font-pixel text-[9px] text-cyan-200/80">
                <th scope="col" className="py-2 pr-4 font-normal">
                  LOOP UNITS
                </th>
                <th scope="col" className="py-2 font-normal">
                  π SCALE VALUE
                </th>
              </tr>
            </thead>
            <tbody>
              {PI_SCALE_TABLE.map((row) => (
                <tr key={row.units} className="border-b border-cyan-500/15">
                  <td className="py-2 pr-4 font-pixel text-amber-200">
                    {formatPi(row.units)}
                  </td>
                  <td className="py-2 font-pixel text-cyan-200">
                    {formatPi(row.value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-[10px] text-amber-100/50">
            Any other number scales the same way — 37 units is{" "}
            {formatPi(piValue(37))}, 250 units is {formatPi(piValue(250))}.
          </p>
        </section>

        <section className="mt-6 border-2 border-amber-500/30 bg-amber-950/20 px-4 py-3">
          <h2 className="font-pixel text-xs text-amber-300">
            IT IS A DISPLAY SCALE, NOT A PAYOUT
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-amber-100/80">
            {PI_SCALE_NOTE}
          </p>
          <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-amber-100/70">
            <li>· Earn rates, prices and ceilings are unchanged — nothing here multiplies a reward.</li>
            <li>· The game&apos;s own unit stays a whole integer; conservation stays exact.</li>
            <li>· The π value is never a price, a balance, a reward, or money.</li>
            <li>· There is no path from a loop unit to money, on this page or in any game.</li>
          </ul>
        </section>

        <section className="mt-6">
          <h2 className="font-pixel text-xs text-lime-300">WHERE YOU SEE IT</h2>
          <ul className="mt-2 grid gap-1 text-[11px] text-amber-100/70 sm:grid-cols-2">
            <li>
              <a href="/bin-runner" className="text-cyan-300 underline">
                /bin-runner
              </a>{" "}
              — CS
            </li>
            <li>
              <a href="/brick-break" className="text-cyan-300 underline">
                /brick-break
              </a>{" "}
              — RK
            </li>
            <li>
              <a href="/paper-airplane" className="text-cyan-300 underline">
                /paper-airplane
              </a>{" "}
              — SH
            </li>
            <li>
              <a href="/soil-stack" className="text-cyan-300 underline">
                /soil-stack
              </a>{" "}
              — SO
            </li>
            <li>
              <a href="/local-energy" className="text-cyan-300 underline">
                /local-energy
              </a>{" "}
              — TL
            </li>
            <li>
              <a href="/repair-cafe" className="text-cyan-300 underline">
                /repair-cafe
              </a>{" "}
              — CR
            </li>
          </ul>
        </section>

        <footer className="mt-8 border-t-2 border-cyan-500/20 pt-3 text-[9px] text-amber-100/40">
          A shared convention of the Pierce Collabs gaming layer, taken from the
          owner&apos;s π thresholds working note. Fictional loops only — no
          real-world income, health or environmental claim.
        </footer>
      </div>
    </main>
  );
}
