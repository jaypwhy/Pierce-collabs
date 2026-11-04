import { createFileRoute } from "@tanstack/react-router";
import { DocShell, RawDoc } from "~/components/doc-view";
import spec from "../content/layer-spec.md?raw";

export const Route = createFileRoute("/layer")({
  component: LayerPage,
});

function LayerPage() {
  return (
    <DocShell
      title="THE GAMING LAYER — FORM & STRUCTURE v0.1"
      subtitle="The layer's published rule set: five closed-loop conditions, fifteen rules (L1–L15), the only permitted revenue models, and two worked samples. Working copy for owner review — source of truth lives in /home/team/shared/layer-spec-v0.1.md."
    >
      <RawDoc text={spec} />
    </DocShell>
  );
}