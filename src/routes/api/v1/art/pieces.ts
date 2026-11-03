import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** GET /api/v1/art/pieces — Every saved piece, newest first, without the thumbnails. */
export const Route = createFileRoute("/api/v1/art/pieces")({
  server: {
    handlers: {
      GET: ({ request }) => respond("art", "list", request),
    },
  },
});
