import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/app/trainers")({
  beforeLoad: () => { throw redirect({ to: "/app/about" }); },
});
