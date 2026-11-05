import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/worldvolume/results — Planned — the solves that have been kept. */
export const Route = createFileRoute("/api/v1/worldvolume/results")({
  server: {
    handlers: {
      GET: ({ request }) => respond("worldvolume", "results", request),
    },
  },
});
