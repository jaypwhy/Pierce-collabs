import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/**
 * /api/v1/worldvolume/solve — Planned — one boundary-condition problem, checked
 * against the closed form. The toolkit is a skeleton, so this answers
 * `not_connected`. GET is accepted as well as POST so a client can ask whether
 * the door is open without shaping a body first.
 */
export const Route = createFileRoute("/api/v1/worldvolume/solve")({
  server: {
    handlers: {
      GET: ({ request }) => respond("worldvolume", "solve", request),
      POST: ({ request }) => respond("worldvolume", "solve", request),
    },
  },
});
