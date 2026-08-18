import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, SectionTitle, Badge, Icon, Button } from "@/components/tb/shell";
import { branchNav } from "@/lib/tb/nav";
import { EGP, orders, stateLabels } from "@/lib/tb/data";

export const Route = createFileRoute("/branch/")({
  head: () => ({
    meta: [
      { title: "شاشة المطبخ — طلبات بيتك" },
      { name: "description", content: "متابعة طلبات فرع المعادي لحظياً وإدارة تحضيرها." },
      { property: "og:title", content: "شاشة المطبخ — طلبات بيتك" },
      { property: "og:description", content: "متابعة طلبات فرع المعادي لحظياً وإدارة تحضيرها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BranchIndex,
});

const columns = [
  { key: "PLACED", label: "جديد" },
  { key: "PREPARING", label: "تحضير" },
  { key: "READY", label: "جاهز" },
  { key: "PICKED_UP", label: "تم الاستلام" },
];

function BranchIndex() {
  const [sound, setSound] = useState(true);
  const branchOrders = orders.filter((o) => o.subOrders.some((s) => s.branch === "فرع المعادي"));

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="مدير فرع — فرع المعادي"
      nav={branchNav}
      title="شاشة المطبخ"
      actions={
        <button
          onClick={() => setSound((s) => !s)}
          className={`flex items-center gap-1.5 rounded-button px-3 py-2 font-label-md text-label-md transition ${sound ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"}`}
        >
          <Icon name={sound ? "volume_up" : "volume_off"} className="text-[18px]" />
          تنبيه صوتي
        </button>
      }
    >
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit">
          <Icon name="storefront" className="text-[16px]" />
          البيانات المعروضة خاصة بفرع المعادي فقط
        </Badge>

        <Card className="flex items-center gap-2 bg-primary-container/40 p-md">
          <Icon name="notifications_active" className="text-[22px] text-on-primary-container" />
          <p className="font-label-lg text-label-lg text-on-surface">يوجد طلب جديد بانتظار التأكيد!</p>
        </Card>

        <div className="grid grid-cols-1 gap-md md:grid-cols-4">
          {columns.map((col) => {
            const items = branchOrders.filter((o) => {
              const sub = o.subOrders.find((s) => s.branch === "فرع المعادي");
              return sub?.status === col.key;
            });
            return (
              <div key={col.key} className="flex flex-col gap-sm">
                <SectionTitle title={`${col.label} (${items.length})`} />
                <div className="flex flex-col gap-sm">
                  {items.map((o) => (
                    <Card key={o.id} className="flex flex-col gap-2 p-md">
                      <div className="flex items-center justify-between">
                        <p className="font-label-lg text-label-lg text-on-surface">{o.code}</p>
                        <span className="font-label-md text-[11px] text-outline">{o.placedAt}</span>
                      </div>
                      <p className="font-label-md text-label-md text-on-surface-variant">{EGP(o.total)}</p>
                      <Button variant="outline" className="!py-1.5">التالي: {stateLabels[col.key]}</Button>
                    </Card>
                  ))}
                  {items.length === 0 ? (
                    <p className="rounded-button border border-dashed border-outline-variant p-md text-center font-label-md text-label-md text-outline">لا توجد طلبات</p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardShell>
  );
}
