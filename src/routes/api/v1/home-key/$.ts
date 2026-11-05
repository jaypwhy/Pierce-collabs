import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/**
 * /api/v1/home-key/<anything> — Planned — reserved, so every path under it
 * answers `not_connected` naming the action that was asked for, rather than 404
 * pretending the service is unknown.
 */
export const Route = createFileRoute("/api/v1/home-key/$")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        respond("home-key", (params as { _splat?: string })._splat || "index", request),
      POST: ({ request, params }) =>
        respond("home-key", (params as { _splat?: string })._splat || "index", request),
    },
  },
});
