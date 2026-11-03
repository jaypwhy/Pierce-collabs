import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/morbraii/nodes — what Morbraii can output, and each node's limit. */
export const Route = createFileRoute("/api/v1/morbraii/nodes")({
  server: {
    handlers: {
      GET: ({ request }) => respond("morbraii", "nodes", request),
    },
  },
});
