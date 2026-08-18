import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppBar, Badge, Card, Icon, MobileShell, Stat } from "@/components/tb/shell";
import { EGP, driverWallet, drivers } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/driver/")({
  head: () => ({
    meta: [
      { title: "طلبات المندوب | طلبات بيتك" },
      { name: "description", content: "تابع حالتك وابدأ استلام طلبات التوصيل من طلبات بيتك." },
      { property: "og:title", content: "طلبات المندوب | طلبات بيتك" },
      { property: "og:description", content: "تابع حالتك وابدأ استلام طلبات التوصيل من طلبات بيتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverIndex,
});

const me = drivers[0]!;

function DriverIndex() {
  const [online, setOnline] = useState(true);
  const approved = me["status"] === "APPROVED";

  return (
    <MobileShell tabs={driverTabs}>
      <AppBar title="أهلاً، محمود" subtitle="مندوب طلبات بيتك" />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        {!approved ? (
          <Link
            to="/driver/documents"
            className="flex items-center justify-between gap-2 rounded-card bg-error-container p-md"
          >
            <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-error-container">
              <Icon name="warning" className="text-[18px]" />
              حسابك لسه قيد المراجعة، اتمم مستنداتك
            </span>
            <Icon name="chevron_left" className="text-on-error-container" />
          </Link>
        ) : null}

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
              <span
                className={`absolute top-1 size-7 rounded-full bg-surface-container-lowest shadow transition-all ${
                  online ? "right-1" : "right-8"
                }`}
              />
            </button>
          </div>
        </Card>

        {online ? (
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
        ) : null}

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
