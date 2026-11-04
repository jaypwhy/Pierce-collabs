import { createFileRoute } from "@tanstack/react-router";
import { DocShell, RawDoc } from "~/components/doc-view";
import design from "../content/brick-break-design.md?raw";

export const Route = createFileRoute("/brick-break-design")({
  component: BBDesignPage,
});

function BBDesignPage() {
  return (
    <DocShell
      title="BRICK BREAK — CLOSED-LOOP DESIGN + LAYER INCORPORATION"
      subtitle="The second playable sample: breakout-style, no clock, Seal meta; balance band +6 to +71 machine-checked. Working copy for owner review — source of truth lives in /home/team/shared/brick-break-design.md."
    >
      <RawDoc text={design} />
    </DocShell>
  );
}