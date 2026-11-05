import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/**
 * /api/v1/home-key — Planned — the repository is empty, so the service is
 * reserved and has no actions of its own. Asking for the service itself answers
 * `not_connected`; "index" is the route, not an action it claims.
 */
export const Route = createFileRoute("/api/v1/home-key/")({
  server: {
    handlers: {
      GET: ({ request }) => respond("home-key", "index", request),
      POST: ({ request }) => respond("home-key", "index", request),
    },
  },
});
