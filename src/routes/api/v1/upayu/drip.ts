import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/upayu/drip — The base-income drip. Honours the 60s cooldown (429 while resting). */
export const Route = createFileRoute("/api/v1/upayu/drip")({
  server: {
    handlers: {
      POST: ({ request }) => respond("upayu", "drip", request),
    },
  },
});
