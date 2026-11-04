import { createFileRoute } from "@tanstack/react-router";
import { DocShell, RawDoc } from "~/components/doc-view";
import design from "../content/preventative-health-design.md?raw";

export const Route = createFileRoute("/preventative-health-design")({
  component: PreventativeHealthDesignPage,
});

/* Carried VERBATIM from Part E of the design document (design.md, the paragraph
 * under E2 "claims intentionally NOT made"). Do not summarise, trim or reword
 * it — the design calls it the most important paragraph in the document and
 * says it must not be paraphrased on the site. Sliced out of the raw document
 * so it cannot drift from the source. */
const GUARDRAIL_MARK = "**Guardrail note for this game specifically";
function guardrailOf(raw: string): string {
  const start = raw.indexOf(GUARDRAIL_MARK);
  if (start < 0) return "";
  const end = raw.indexOf("\n\n", start);
  const para = raw.slice(start, end < 0 ? undefined : end).trim();
  return para
    .split("\n")
    .map((line) => line.replace(/^>\s?/, ""))
    .join("\n")
    .trim();
}
const E2_GUARDRAIL = guardrailOf(design);

function PreventativeHealthDesignPage() {
  return (
    <DocShell
      title="PREVENTATIVE HEALTH (TEND) — CLOSED-LOOP DESIGN + LAYER INCORPORATION"
      subtitle="Fourth of the five further loops — a fictional herb-bed sim: planting is free and unlimited, a bunch takes two plants and pays one credit for every plant standing at the cut, so cutting from a full bed is the taught line and impatience is the mistake (3 actions for 2 credits instead of 3 for 4). No clock, no randomness, 113-credit price list, four tools P1–P4 that move actions and never payouts; balance machine-checked by checks.py (13 asserts green) and re-checked live in the build at /preventative-health. Working copy for owner review — source of truth lives in /home/team/shared/Documents/Shared/new-games/preventative-health/design.md."
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
