import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Badge, Icon, Button } from "@/components/tb/shell";
import { branchNav } from "@/lib/tb/nav";
import { orders, drivers } from "@/lib/tb/data";

export const Route = createFileRoute("/branch/drivers")({
  head: () => ({
    meta: [
      { title: "التوصيل — طلبات بيتك" },
      { name: "description", content: "إدارة تسليم الطلبات وطلب مندوبين لفرع المعادي." },
      { property: "og:title", content: "التوصيل — طلبات بيتك" },
      { property: "og:description", content: "إدارة تسليم الطلبات وطلب مندوبين لفرع المعادي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BranchDrivers,
});

function BranchDrivers() {
  const pending = orders.filter((o) => o.subOrders.some((s) => s.branch === "فرع المعادي" && s.status === "READY"));
  const restaurantDrivers = drivers.filter((d) => d["type"] === "RESTAURANT");

  return (
    <DashboardShell brand="طلبات بيتك" role="مدير فرع — فرع المعادي" nav={branchNav} title="التوصيل">
      <div className="tb-stagger flex flex-col gap-lg">
        <Card className="p-md">
          <SectionTitle title="طلبات بانتظار الاستلام" icon="pending_actions" />
          <div className="flex flex-col gap-sm">
            {pending.length === 0 ? (
              <p className="rounded-button border border-dashed border-outline-variant p-md text-center font-label-md text-label-md text-outline">لا توجد طلبات جاهزة الآن</p>
            ) : (
              pending.map((o) => (
                <div key={o.id} className="flex items-center justify-between rounded-button border border-outline-variant p-2.5">
                  <span className="font-label-lg text-label-lg text-on-surface">{o.code}</span>
                  <Badge tone="warn">جاهز</Badge>
                  <Button variant="outline" icon="delivery_dining" className="!px-3 !py-1.5">طلب مندوب طلبات بيتك</Button>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="مراحل تعيين مندوب طلبات بيتك" icon="route" />
          <ol className="flex flex-col gap-2">
            {["البحث عن أقرب مندوب", "إرسال العرض", "قبول / رفض المندوب", "تعيين المندوب للطلب"].map((step, i) => (
              <li key={step} className="flex items-center gap-2 font-body-md text-body-md text-on-surface">
                <span className="flex size-6 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container font-label-md text-[11px]">{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-md">
          <SectionTitle title="مندوبين المطعم المتاحين" icon="two_wheeler" />
          <div className="flex flex-col gap-2">
            {restaurantDrivers.map((d) => (
              <div key={d.id} className="flex items-center justify-between rounded-button border border-outline-variant p-2.5">
                <span className="font-label-lg text-label-lg text-on-surface">{d.name}</span>
                <Badge tone={d.online ? "success" : "neutral"}>{d.online ? "متاح" : "غير متاح"}</Badge>
                <Button variant="outline" disabled={!d.online} className="!px-3 !py-1.5">تعيين</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
