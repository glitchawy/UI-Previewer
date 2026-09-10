import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { clearSession, getRoleDashboard, validateWithServer } from "@/lib/auth-session";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    let session;
    try {
      session = await validateWithServer({ allowCachedOnNetworkError: false });
    } catch {
      clearSession();
      throw redirect({ to: "/auth/login" });
    }
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "admin") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  component: Outlet,
});