import { createFileRoute } from "@tanstack/react-router";

import { servicesResponse } from "~/lib/universal/registry";

/** GET /api/v1/services — the registry: every service, its status and its actions. */
export const Route = createFileRoute("/api/v1/services")({
  server: {
    handlers: {
      GET: () => servicesResponse(),
    },
  },
});
