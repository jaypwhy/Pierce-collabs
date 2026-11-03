import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/upayu/convert — Points become dollars through the Pi Algo. Body: { points } */
export const Route = createFileRoute("/api/v1/upayu/convert")({
  server: {
    handlers: {
      POST: ({ request }) => respond("upayu", "convert", request),
    },
  },
});
