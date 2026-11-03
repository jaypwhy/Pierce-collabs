import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/morbraii/schedule — Body: { text, profile?, wpm?, unitMs? } */
export const Route = createFileRoute("/api/v1/morbraii/schedule")({
  server: {
    handlers: {
      POST: ({ request }) => respond("morbraii", "schedule", request),
    },
  },
});
