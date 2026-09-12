// Layout guard for the whole /driver tree: unapproved drivers only get the
// application-status view (plus the documents route to complete their file).
import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { AppBar, Icon, MobileShell } from "@/components/tb/shell";
import { getSession, logoutSession, getRoleDashboard } from "@/lib/auth-session";
import { GateBlockedCard, GateLoadingCard, useApplicationGate } from "@/components/tb/approval-gate";
import { useTranslation } from "@/lib/i18n";
import { personalGreeting } from "@/lib/personal-greeting";

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
  const { t } = useTranslation();
  const gate = useApplicationGate(["APPROVED"]);
  const location = useLocation();
  const navigate = useNavigate();
  const session = getSession();

  if (gate.kind === "approved") return <Outlet />;
  if (EXEMPT_PATHS.some((p) => location.pathname.startsWith(p))) return <Outlet />;

  async function handleLogout() {
    await logoutSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <MobileShell>
      <AppBar
         title={personalGreeting(t("أهلاً 👋", "Hello 👋"), session?.user.name)}
         subtitle={t("مندوب طلبات بيتك", "Talabat Betak driver")}
        right={
          <button
            onClick={handleLogout}
            className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
             title={t("تسجيل الخروج", "Sign out")}
             aria-label={t("تسجيل الخروج", "Sign out")}
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
