import { createFileRoute, redirect } from "@tanstack/react-router";
import { getSession, getRoleDashboard } from "@/lib/auth-session";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const session = getSession();
    if (session) {
      // Already logged in → go straight to the right dashboard
      throw redirect({ to: getRoleDashboard(session.user.role) });
    }
    throw redirect({ to: "/auth/login" });
  },
});
