import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/upayu/press — One press. Body: { tier?: "one" | "ten" | "pi" } */
export const Route = createFileRoute("/api/v1/upayu/press")({
  server: {
    handlers: {
      POST: ({ request }) => respond("upayu", "press", request),
    },
  },
});
