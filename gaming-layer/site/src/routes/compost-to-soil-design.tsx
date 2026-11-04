import { createFileRoute, redirect } from "@tanstack/react-router";

/* The compost design page was renamed SOIL STACK DESIGN. The old path keeps working. */
export const Route = createFileRoute("/compost-to-soil-design")({
  beforeLoad: () => {
    throw redirect({ to: "/soil-stack-design" });
  },
});
