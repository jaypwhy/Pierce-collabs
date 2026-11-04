import { createFileRoute } from "@tanstack/react-router";
import { DocShell, RawDoc } from "~/components/doc-view";
import design from "../content/local-energy-design.md?raw";

export const Route = createFileRoute("/local-energy-design")({
  component: LocalEnergyDesignPage,
});

/* Carried VERBATIM from Part E of the design document (design.md, the paragraph
 * under E2 "claims intentionally NOT made"). Do not summarise, trim or reword
 * it: open question 7 asks for it to appear on the site page word for word. */
const E2_GUARDRAIL = "**Guardrail note for this game specifically.** The fiction is a street battery, a dynamo and a call sheet \u2014 the closest this layer has come to a real utility. The following sentences **must not be written anywhere**, in-game, in store copy, in a pitch or on the site: \"powers your home\", \"cuts your real bill\", \"each sheet saves real energy\", \"playing reduces emissions / carbon / demand on the grid\", \"community energy transition\", \"energy independence\", \"renewable by design\", \"the loop models a real microgrid\", \"teaches energy literacy\" or \"teaches grid engineering\" (educational **intent** may be described only with \"may\" or \"intend\"), and anything implying a tally, a plate or a lamp post is a real-world object or a measured quantity. **The counters measure the save file and nothing else** \u2014 a sheet of 6 tallies is six numbers in a JSON object, and the start screen says so. The words **\"regenerative\"** and **\"circular\"** stay held back pending the owner's open question 5 (what the owner's other businesses already claim). Real power systems involve frequency, voltage, protection, forecasting, weather and failure modes; **this game models an action count**, and says so.";

function LocalEnergyDesignPage() {
  return (
    <DocShell
      title="LOCAL ENERGY (KETTLE LANE) — CLOSED-LOOP DESIGN + LAYER INCORPORATION"
      subtitle="Second of the five further loops — a fictional street battery, a dynamo and a call sheet: crank the battery, answer the two calls, a call answered from a full battery pays double. No clock, no randomness, 158-tally unlock table, powers F1–F4; balance machine-checked by checks.py (12 asserts green). Working copy for owner review — source of truth lives in /home/team/shared/Documents/Shared/new-games/local-energy/design.md."
    >
      <section
        data-testid="l15-guardrail"
        className="mb-4 border-2 border-red-500/50 bg-red-950/20 p-4"
      >
        <p className="font-pixel text-[9px] text-red-300">
          E2 — L15 HONEST CLAIMS · CARRIED VERBATIM FROM THE DESIGN, NOT SUMMARISED
        </p>
        <p className="mt-2 whitespace-pre-wrap text-[11px] leading-relaxed text-red-100/90">
          {E2_GUARDRAIL}
        </p>
      </section>
      <RawDoc text={design} />
    </DocShell>
  );
}
