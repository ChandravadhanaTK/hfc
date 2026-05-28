import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/app/calorie")({
  component: () => <Navigate to="/app/health" />,
});

