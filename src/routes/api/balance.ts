import { createFileRoute } from "@tanstack/react-router";

import { readSnapshot } from "~/lib/upayu-core";

/** GET /api/balance — the whole account: points, dollars, drip state, ladder. */
export const Route = createFileRoute("/api/balance")({
  server: {
    handlers: {
      GET: async () => Response.json(await readSnapshot()),
    },
  },
});
