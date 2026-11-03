import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/upayu/balance — Points, Pi Algo dollars and the pieces on the one account. */
export const Route = createFileRoute("/api/v1/upayu/balance")({
  server: {
    handlers: {
      GET: ({ request }) => respond("upayu", "balance", request),
    },
  },
});
