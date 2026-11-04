import {
  formatPi,
  piValue,
  PI_SCALE_LABEL,
  PI_SCALE_TABLE,
} from "~/lib/pi-scale";

/**
 * The shared π-scale HUD strip. Every game shows the same table, plus the
 * loop's own integer unit and its π display value. Display only — the game's
 * earn rates and prices are untouched by anything in this component.
 */
export function PiScaleBadge({
  units,
  unit,
  tone = "cyan",
}: {
  /** The loop's own integer unit, exactly as the game counts it. */
  units: number;
  /** Short name of that unit, e.g. "CS", "RK", "SH", "SO", "TL", "CR". */
  unit: string;
  tone?: "cyan" | "amber";
}) {
  const shown = Number.isFinite(units) ? Math.max(0, Math.floor(units)) : 0;
  const value = piValue(shown);
  const accent = tone === "amber" ? "text-amber-300" : "text-cyan-300";
  const border = tone === "amber" ? "border-amber-500/30" : "border-cyan-500/30";
  const bg = tone === "amber" ? "bg-amber-950/20" : "bg-cyan-950/20";

  return (
    <div
      data-testid="pi-scale"
      data-pi-units={shown}
      data-pi-value={value}
      className={`border-b-2 ${border} ${bg} px-4 py-2`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 text-[9px]">
        <span className={`font-pixel ${accent}`}>{PI_SCALE_LABEL}</span>

        <span className="font-pixel text-lime-200">
          THIS SAVE · {unit} {shown} → π {formatPi(value)}
        </span>

        <table className="border-collapse font-pixel text-[8px]">
          <caption className="sr-only">
            The published π scale: value = floor(units × 10π)
          </caption>
          <thead>
            <tr className={tone === "amber" ? "text-amber-200/70" : "text-cyan-200/70"}>
              <th scope="col" className="px-2 py-0.5 text-left font-normal">
                UNITS
              </th>
              <th scope="col" className="px-2 py-0.5 text-left font-normal">
                π VALUE
              </th>
            </tr>
          </thead>
          <tbody>
            {PI_SCALE_TABLE.map((row) => {
              const here = row.units === shown;
              return (
                <tr
                  key={row.units}
                  data-testid={`pi-row-${row.units}`}
                  className={
                    here
                      ? "bg-lime-400/20 text-lime-100"
                      : "text-cyan-100/60"
                  }
                >
                  <td className="px-2 py-0.5">{formatPi(row.units)}</td>
                  <td className="px-2 py-0.5">{formatPi(row.value)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <a
          href="/pi-scale"
          data-testid="link-to-pi-scale"
          className={`pixel-btn bg-neutral-900 px-2 py-1 text-[8px] ${accent}`}
        >
          ▤ WHAT IS THIS?
        </a>
      </div>
    </div>
  );
}
