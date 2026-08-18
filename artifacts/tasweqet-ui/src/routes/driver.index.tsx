import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AppBar, Badge, Card, Icon, MobileShell, Stat } from "@/components/tb/shell";
import { EGP, driverWallet, drivers } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";
import { getSession, clearSession, getRoleDashboard } from "@/lib/auth-session";

export const Route = createFileRoute("/driver/")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "driver") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: "طلبات المندوب | طلبات بيتك" },
      { name: "description", content: "تابع حالتك وابدأ استلام طلبات التوصيل من طلبات بيتك." },
    ],
  }),
  component: DriverIndex,
});

const me = drivers[0]!;

function DriverIndex() {
  const navigate = useNavigate();
  const session = getSession();
  const [online, setOnline] = useState(true);
  // Approval gating happens in the /driver layout route (driver.tsx).

  function handleLogout() {
    clearSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <MobileShell tabs={driverTabs}>
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
        <Card className="p-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">
                {online ? "متاح للطلبات" : "غير متصل"}
              </p>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {online ? "بتستقبل عروض توصيل جديدة" : "فعّل الحالة عشان تبدأ تستقبل طلبات"}
              </p>
            </div>
            <button
              onClick={() => setOnline((v) => !v)}
              className={`relative h-9 w-16 rounded-full transition ${online ? "bg-success" : "bg-surface-container-high"}`}
              aria-label="تبديل الحالة"
            >
              <span className={`absolute top-1 size-7 rounded-full bg-surface-container-lowest shadow transition-all ${online ? "right-1" : "right-8"}`} />
            </button>
          </div>
        </Card>

        {online && (
          <Link to="/driver/offer" className="block">
            <Card className="tb-pulse-ring border-primary bg-primary-container/30 p-md">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
                  <Icon name="notifications_active" className="text-[20px] text-primary" />
                  عرض توصيل جديد وصلك الآن
                </span>
                <Icon name="chevron_left" className="text-on-surface-variant" />
              </div>
            </Card>
          </Link>
        )}

        <Link to="/driver/navigate" className="block">
          <Card className="p-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon name="two_wheeler" className="text-[20px] text-on-surface-variant" />
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">لديك توصيلة نشطة الآن</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">طلب #12345 — برجر هاوس</p>
                </div>
              </div>
              <Icon name="chevron_left" className="text-on-surface-variant" />
            </div>
          </Card>
        </Link>

        <div>
          <p className="mb-sm font-headline-md text-headline-md text-on-surface">إحصائيات اليوم</p>
          <div className="tb-stagger grid grid-cols-2 gap-sm">
            <Stat label="توصيلات اليوم" value="8" icon="local_shipping" tone="info" />
            <Stat label="أرباح اليوم" value={EGP(driverWallet["today"])} icon="payments" tone="success" delta="12%" />
            <Stat label="المسافة" value="34 كم" icon="route" tone="warn" />
            <Stat label="التقييم" value={me["rating"].toString()} icon="star" tone="warn" />
          </div>
        </div>

        <Card className="flex items-start gap-2 p-md">
          <Icon name="near_me" className="mt-0.5 text-[18px] text-secondary" />
          <p className="font-label-md text-label-md text-on-surface-variant">
            بيتم تعيين الطلبات تلقائياً لأقرب مندوب متاح لمكان الاستلام.
          </p>
        </Card>
      </div>
    </MobileShell>
  );
}
