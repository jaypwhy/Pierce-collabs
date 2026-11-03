import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/ruhbi/summary — points issued, converted, dollars settled, outstanding balance. */
export const Route = createFileRoute("/api/v1/ruhbi/summary")({
  server: {
    handlers: {
      GET: ({ request }) => respond("ruhbi", "summary", request),
    },
  },
});
