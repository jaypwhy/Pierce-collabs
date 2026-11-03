import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/ruhbi/verify — replays the ledger and confirms it matches the balance. */
export const Route = createFileRoute("/api/v1/ruhbi/verify")({
  server: {
    handlers: {
      GET: ({ request }) => respond("ruhbi", "verify", request),
    },
  },
});
