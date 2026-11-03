import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/art/save — Save a piece. Body: { name, media, thumb? } */
export const Route = createFileRoute("/api/v1/art/save")({
  server: {
    handlers: {
      POST: ({ request }) => respond("art", "save", request),
    },
  },
});
