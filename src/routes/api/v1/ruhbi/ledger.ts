import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/ruhbi/ledger — Planned — the RUHBI ledger does not exist yet, so this answers not_connected. */
export const Route = createFileRoute("/api/v1/ruhbi/ledger")({
  server: {
    handlers: {
      GET: ({ request }) => respond("ruhbi", "ledger", request),
    },
  },
});
