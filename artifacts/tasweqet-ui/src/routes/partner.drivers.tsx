import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Icon, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { drivers } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/drivers")({
  head: () => ({
    meta: [
      { title: "مندوبين المطعم — طلبات بيتك" },
      { name: "description", content: "إدارة مندوبي توصيل المطعم الخاصين." },
      { property: "og:title", content: "مندوبين المطعم — طلبات بيتك" },
      { property: "og:description", content: "إدارة مندوبي توصيل المطعم الخاصين." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerDrivers,
});

function PartnerDrivers() {
  const list = drivers.filter((d) => d["type"] === "RESTAURANT");
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="مندوبين المطعم">
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          هؤلاء مندوبون تابعون للمطعم وليسوا مندوبي طلبات بيتك — المطعم يحدد رسوم التوصيل الخاصة بهم
        </Badge>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
          {list.map((d) => (
            <Card key={d.id} className="flex flex-col gap-sm p-md transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <p className="font-headline-md text-headline-md text-on-surface">{d.name}</p>
                <Badge tone={d.online ? "success" : "neutral"}>{d.online ? "متصل" : "غير متصل"}</Badge>
              </div>
              <p className="font-body-md text-body-md text-on-surface-variant">{d.phone} · {d.vehicle}</p>
              <div className="flex items-center gap-2">
                <Badge tone="warn"><Icon name="star" className="text-[14px]" filled />{d.rating}</Badge>
                <Badge tone="neutral"><Icon name="local_shipping" className="text-[14px]" />{d.deliveries} توصيلة</Badge>
              </div>
              <Button variant="outline" icon="task" disabled={!d.online}>تعيين لطلب</Button>
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
