import { createFileRoute } from "@tanstack/react-router";
import { DocShell, RawDoc } from "~/components/doc-view";
import design from "../content/repair-cafe-design.md?raw";

export const Route = createFileRoute("/repair-cafe-design")({
  component: RepairCafeDesignPage,
});

/* Carried VERBATIM from Part E of the design document (design.md, the paragraph
 * under E2 "claims intentionally NOT made"). Do not summarise, trim or reword
 * it — the design's tension 3 asks for it to appear on the site page word for
 * word. Sliced out of the raw document so it cannot drift from the source. */
const GUARDRAIL_MARK = "**Guardrail note for this game specifically.**";
function guardrailOf(raw: string): string {
  const start = raw.indexOf(GUARDRAIL_MARK);
  if (start < 0) return "";
  const end = raw.indexOf("\n\n", start);
  return raw.slice(start, end < 0 ? undefined : end).trim();
}
const E2_GUARDRAIL = guardrailOf(design);

function RepairCafeDesignPage() {
  return (
    <DocShell
      title="REPAIR CAFE / LIBRARY OF THINGS (LEND & MEND) — CLOSED-LOOP DESIGN + LAYER INCORPORATION"
      subtitle="Third of the five further loops — a fictional repair cafe and tool library: carry parts onto the bench, fix the small job and the big job, and a fix that leaves the bench exactly empty pays its full parts count in credits (leave a part over and it pays half). No clock, no randomness, 146-credit unlock table, powers F1–F4; balance machine-checked by checks.py (12 asserts green) and re-checked live in the build at /repair-cafe. Working copy for owner review — source of truth lives in /home/team/shared/Documents/Shared/new-games/repair-cafe/design.md."
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
