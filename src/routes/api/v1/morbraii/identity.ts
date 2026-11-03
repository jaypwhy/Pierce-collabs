import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/morbraii/identity — Planned — identity is Morbraii's job and Morbraii does not exist yet. */
export const Route = createFileRoute("/api/v1/morbraii/identity")({
  server: {
    handlers: {
      GET: ({ request }) => respond("morbraii", "identity", request),
    },
  },
});
