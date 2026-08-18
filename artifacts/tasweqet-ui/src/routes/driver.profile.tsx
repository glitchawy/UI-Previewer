import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppBar, Badge, Card, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { drivers } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/driver/profile")({
  head: () => ({
    meta: [
      { title: "حسابي | طلبات بيتك" },
      { name: "description", content: "إدارة بيانات حسابك وإعداداتك كمندوب توصيل." },
      { property: "og:title", content: "حسابي | طلبات بيتك" },
      { property: "og:description", content: "إدارة بيانات حسابك وإعداداتك كمندوب توصيل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverProfile,
});

const me = drivers[0]!;

function DriverProfile() {
  const [notif, setNotif] = useState(true);

  return (
    <MobileShell tabs={driverTabs}>
      <AppBar title="حسابي" />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        <Card className="flex flex-col items-center gap-2 p-lg text-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="person" className="text-[36px]" />
          </span>
          <p className="font-headline-md text-headline-md text-on-surface">{me["name"]}</p>
          <span className="flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
            <Icon name="star" className="text-[16px] text-primary" filled />
            {me["rating"]} · {me["deliveries"]} توصيلة
          </span>
        </Card>

        <Card className="grid grid-cols-2 gap-2 p-md text-center">
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">المركبة</p>
            <p className="font-label-lg text-label-lg text-on-surface">{me["vehicle"]}</p>
          </div>
          <div>
            <p className="font-label-md text-label-md text-on-surface-variant">المنطقة</p>
            <p className="font-label-lg text-label-lg text-on-surface">{me["area"]}</p>
          </div>
        </Card>

        <Link to="/driver/documents">
          <Card className="flex items-center justify-between p-md">
            <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
              <Icon name="verified_user" className="text-[18px] text-on-surface-variant" />
              حالة التوثيق
            </span>
            <span className="flex items-center gap-2">
              <StatusBadge status={me["status"]} />
              <Icon name="chevron_left" className="text-on-surface-variant" />
            </span>
          </Card>
        </Link>

        <Card className="flex items-center justify-between p-md">
          <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
            <Icon name="notifications" className="text-[18px] text-on-surface-variant" />
            إشعارات الطلبات
          </span>
          <button
            onClick={() => setNotif((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition ${notif ? "bg-success" : "bg-surface-container-high"}`}
          >
            <span
              className={`absolute top-1 size-5 rounded-full bg-surface-container-lowest transition-all ${notif ? "right-1" : "right-6"}`}
            />
          </button>
        </Card>

        <Card className="flex items-center justify-between p-md">
          <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
            <Icon name="language" className="text-[18px] text-on-surface-variant" />
            اللغة والعملة
          </span>
          <span className="font-label-md text-label-md text-on-surface-variant">العربية · EGP</span>
        </Card>

        <Link to="/auth/welcome">
          <Card className="flex items-center gap-2 p-md text-error">
            <Icon name="logout" className="text-[18px] text-error" />
            <span className="font-label-lg text-label-lg text-error">تسجيل الخروج</span>
          </Card>
        </Link>
      </div>
    </MobileShell>
  );
}
