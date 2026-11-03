import { createFileRoute } from "@tanstack/react-router";

import { sipPoints } from "~/lib/upayu-core";

/** POST /api/sip — points into the account. Body: { points?: number, note?: string } */
export const Route = createFileRoute("/api/sip")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { points?: unknown; note?: unknown } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          /* empty body is fine — a sip defaults to 10 points */
        }
        const note = typeof body.note === "string" ? body.note : undefined;
        const points = body.points === undefined ? undefined : Number(body.points);
        const result = await sipPoints({ points, note });
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});
