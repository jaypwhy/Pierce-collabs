import { createFileRoute, redirect } from "@tanstack/react-router";

/* The compost game was renamed SOIL STACK. The old path keeps working. */
export const Route = createFileRoute("/compost-to-soil")({
  beforeLoad: () => {
    throw redirect({ to: "/soil-stack" });
  },
});
