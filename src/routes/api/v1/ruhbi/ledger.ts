import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/ruhbi/ledger — Every entry, newest first. `?limit=`, `?kind=`, `?account=` */
export const Route = createFileRoute("/api/v1/ruhbi/ledger")({
  server: {
    handlers: {
      GET: ({ request }) => respond("ruhbi", "ledger", request),
    },
  },
});
