import { createFileRoute } from "@tanstack/react-router";
import { DocShell, RawDoc } from "~/components/doc-view";
import design from "../content/paper-airplane-design.md?raw";

export const Route = createFileRoute("/paper-airplane-design")({
  component: PADesignPage,
});

function PADesignPage() {
  return (
    <DocShell
      title="PAPER AIRPLANE (WINDWARD) — CLOSED-LOOP DESIGN + LAYER INCORPORATION"
      subtitle="The third playable sample: fold → throw → land → bank → spend Medallions; disclosed headwind; four earned powers (F1–F4). Balance band machine-checked by paper-airplane-checks.py. Working copy for owner review — source of truth lives in /home/team/shared/paper-airplane-design.md."
    >
      <RawDoc text={design} />
    </DocShell>
  );
}