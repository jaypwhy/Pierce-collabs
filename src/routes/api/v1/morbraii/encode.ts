import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/morbraii/encode — Body: { text, profile?, node?, wpm?, unitMs? } */
export const Route = createFileRoute("/api/v1/morbraii/encode")({
  server: {
    handlers: {
      POST: ({ request }) => respond("morbraii", "encode", request),
    },
  },
});
