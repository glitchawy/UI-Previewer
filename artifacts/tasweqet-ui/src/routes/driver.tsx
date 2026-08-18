// Layout guard for the whole /driver tree: unapproved drivers only get the
// application-status view (plus the documents route to complete their file).
import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { AppBar, Icon, MobileShell } from "@/components/tb/shell";
import { getSession, clearSession, getRoleDashboard } from "@/lib/auth-session";
import { GateBlockedCard, GateLoadingCard, useApplicationGate } from "@/components/tb/approval-gate";

export const Route = createFileRoute("/driver")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "driver") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  component: DriverLayout,
});

/** Routes an unapproved driver may still visit (complete/fix their application). */
const EXEMPT_PATHS = ["/driver/documents", "/driver/profile"];

function DriverLayout() {
  const gate = useApplicationGate(["APPROVED"]);
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();

  if (gate.kind === "approved") return <Outlet />;
  if (EXEMPT_PATHS.some((p) => location.pathname.startsWith(p))) return <Outlet />;

  function handleLogout() {
    clearSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <MobileShell>
      <AppBar
        title={`أهلاً 👋 +20${session?.user.phone ?? ""}`}
        subtitle="مندوب طلبات بيتك"
        right={
          <button
            onClick={handleLogout}
            className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            title="تسجيل الخروج"
          >
            <Icon name="logout" className="text-[20px]" />
          </button>
        }
      />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        {gate.kind === "loading" ? <GateLoadingCard /> : <GateBlockedCard status={gate.status} role="driver" />}
      </div>
    </MobileShell>
  );
}
