import { createFileRoute } from "@tanstack/react-router";
import { DocShell, RawDoc } from "~/components/doc-view";
import design from "../content/compost-to-soil-design.md?raw";

export const Route = createFileRoute("/soil-stack-design")({
  component: SoilStackDesignPage,
});

function SoilStackDesignPage() {
  return (
    <DocShell
      title="SOIL STACK — CLOSED-LOOP DESIGN + LAYER INCORPORATION"
      subtitle="First of the four community loops: food &amp; green waste back to soil, batch by batch, only when you turn the pile (the owner's no-decay ruling). The playable build is SOIL STACK — the simple spine, one screen. The deluxe comical build this document was written around is now ADV. HOT HEAP, a secret variant unlocked from SOIL STACK by the old cartridge code. Working copy for owner review — source of truth lives in /home/team/shared/compost-to-soil-design.md."
    >
      <div className="mb-4 border-2 border-lime-500/30 bg-lime-950/20 p-3 text-[10px] leading-relaxed text-lime-100/70">
        <p className="font-pixel text-[10px] text-lime-300">NAMING — OWNER RULING</p>
        <p className="mt-2">
          The main compost game is <strong>SOIL STACK</strong> at <code>/soil-stack</code>: the
          simple spine only — GLEAN → LOAD → TURN → EMPTY → FEED → HARVEST — readable from the
          first screen. The comical deluxe build stays as <strong>ADV. HOT HEAP</strong>, a secret
          variant unlocked from SOIL STACK by a cartridge code; it is never linked and the code is
          never printed. Both builds share the same economy rules and the same L1 guarantee (glean
          is free and unlimited), and both keep the balance machine-checked by
          compost-to-soil-checks.py. The document below is the full design, written before the
          rename; where it says HOT HEAP, read ADV. HOT HEAP.
        </p>
      </div>
      <RawDoc text={design} />
    </DocShell>
  );
}
