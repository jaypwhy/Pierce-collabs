import { createFileRoute } from "@tanstack/react-router";

import { dripPoints } from "~/lib/upayu-core";

/** POST /api/drip — claim the base-income drip, once per cooldown window. */
export const Route = createFileRoute("/api/drip")({
  server: {
    handlers: {
      POST: async () => {
        const result = await dripPoints();
        return Response.json(result, { status: result.ok ? 200 : 429 });
      },
    },
  },
});
