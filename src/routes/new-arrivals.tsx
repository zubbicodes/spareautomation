import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/new-arrivals")({
  beforeLoad: () => {
    throw redirect({ to: "/control-panels-software", replace: true });
  },
  component: () => null,
});
