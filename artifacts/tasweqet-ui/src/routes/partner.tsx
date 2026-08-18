// Layout guard for the whole /partner tree: unapproved partners only get the
// application-status view — no operational navigation or pages.
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { DashboardShell, Icon } from "@/components/tb/shell";
import { getSession, clearSession, getRoleDashboard } from "@/lib/auth-session";
import { GateBlockedCard, GateLoadingCard, useApplicationGate } from "@/components/tb/approval-gate";

export const Route = createFileRoute("/partner")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "partner") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  component: PartnerLayout,
});

function PartnerLayout() {
  const gate = useApplicationGate(["APPROVED", "ACTIVE"]);
  const navigate = useNavigate();
  const session = getSession();

  if (gate.kind === "approved") return <Outlet />;

  function handleLogout() {
    clearSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role={`مطعم — +20${session?.user.phone ?? ""}`}
      nav={[]}
      title="حالة الحساب"
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="flex items-center justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-button border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition hover:border-error hover:text-error"
          >
            <Icon name="logout" className="text-[16px]" />
            خروج
          </button>
        </div>
        {gate.kind === "loading" ? <GateLoadingCard /> : <GateBlockedCard status={gate.status} role="partner" />}
      </div>
    </DashboardShell>
  );
}
