import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/mission/complete — Planned — there is no task list to complete against yet. */
export const Route = createFileRoute("/api/v1/mission/complete")({
  server: {
    handlers: {
      POST: ({ request }) => respond("mission", "complete", request),
    },
  },
});
