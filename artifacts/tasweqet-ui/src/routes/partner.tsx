// Layout guard for the whole /partner tree: unapproved partners only get the
// application-status view — no operational navigation or pages.
import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { DashboardShell, Icon } from "@/components/tb/shell";
import { getSession, logoutSession, getRoleDashboard } from "@/lib/auth-session";
import { GateBlockedCard, GateLoadingCard, useApplicationGate } from "@/components/tb/approval-gate";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/partner")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "partner") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  component: PartnerLayout,
});

function PartnerLayout() {
  const { t } = useTranslation();
  const gate = useApplicationGate(["APPROVED", "ACTIVE"]);
  const navigate = useNavigate();
  const session = getSession();

  if (gate.kind === "approved") return <Outlet />;

  async function handleLogout() {
    await logoutSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <DashboardShell
      brand={t("طلبات بيتك", "Talabat Betak")}
      role={`${t("مطعم", "Restaurant")} — +20${session?.user.phone ?? ""}`}
      nav={[]}
      title={t("حالة الحساب", "Account status")}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="flex items-center justify-end">
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-button border border-outline-variant px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition hover:border-error hover:text-error"
          >
            <Icon name="logout" className="text-[16px]" />
            {t("خروج", "Sign out")}
          </button>
        </div>
        {gate.kind === "loading" ? <GateLoadingCard /> : <GateBlockedCard status={gate.status} role="partner" />}
      </div>
    </DashboardShell>
  );
}
