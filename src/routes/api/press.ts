import { createFileRoute } from "@tanstack/react-router";

import { pressPoints } from "~/lib/upayu-core";

/**
 * POST /api/press — one press of the Press Pay Btn.
 *
 * Body: { tier?: "one" | "ten" | "pi" } — defaults to the one-point button.
 * Points only: the press spends points and pays ten times as many back into
 * the same account every other app writes to, and records a RUHBI ledger line.
 */
export const Route = createFileRoute("/api/press")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { tier?: unknown } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          /* an empty body presses the one-point button */
        }
        const tier = typeof body.tier === "string" ? body.tier : undefined;
        const result = await pressPoints({ tier });
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});
