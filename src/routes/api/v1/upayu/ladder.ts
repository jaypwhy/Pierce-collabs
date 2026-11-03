import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/upayu/ladder — The pi ladder — the Pi Algo at 1, 10, 100 and 1,000 points. */
export const Route = createFileRoute("/api/v1/upayu/ladder")({
  server: {
    handlers: {
      GET: ({ request }) => respond("upayu", "ladder", request),
    },
  },
});
