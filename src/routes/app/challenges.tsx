import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/challenges")({
  beforeLoad: () => { throw redirect({ to: "/app/achievements" }); },
});
