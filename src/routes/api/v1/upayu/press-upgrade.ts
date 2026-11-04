import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/upayu/press-upgrade — Buy Double Your Clicks (100 points, once). */
export const Route = createFileRoute("/api/v1/upayu/press-upgrade")({
  server: {
    handlers: {
      POST: ({ request }) => respond("upayu", "press-upgrade", request),
    },
  },
});
