import { createFileRoute } from "@tanstack/react-router";

import { convertPoints } from "~/lib/upayu-core";

/** POST /api/convert — Pi Algo: dollars = floor(π × 100 × points²), from 1 point upward. Body: { points?: number } (defaults to the whole balance). */
export const Route = createFileRoute("/api/convert")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let body: { points?: unknown } = {};
        try {
          body = (await request.json()) as typeof body;
        } catch {
          /* empty body converts the whole balance */
        }
        const points = body.points === undefined ? undefined : Number(body.points);
        const result = await convertPoints({ points });
        return Response.json(result, { status: result.ok ? 200 : 400 });
      },
    },
  },
});
