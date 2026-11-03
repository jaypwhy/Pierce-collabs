import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/acorn-tap/deposit — Planned — nothing here moves money yet. */
export const Route = createFileRoute("/api/v1/acorn-tap/deposit")({
  server: {
    handlers: {
      POST: ({ request }) => respond("acorn-tap", "deposit", request),
    },
  },
});
