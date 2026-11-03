import { createFileRoute } from "@tanstack/react-router";

import { respond } from "~/lib/universal/registry";

/** POST /api/v1/upayu/sip — Points into the account. Body: { points?, note? } */
export const Route = createFileRoute("/api/v1/upayu/sip")({
  server: {
    handlers: {
      POST: ({ request }) => respond("upayu", "sip", request),
    },
  },
});
