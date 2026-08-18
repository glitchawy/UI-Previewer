import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, SectionTitle, Bars, Table, Td, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, restaurantStats } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/analytics")({
  head: () => ({
    meta: [
      { title: "التحليلات — طلبات بيتك" },
      { name: "description", content: "تحليلات معمقة لأداء المطعم والفروع." },
      { property: "og:title", content: "التحليلات — طلبات بيتك" },
      { property: "og:description", content: "تحليلات معمقة لأداء المطعم والفروع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerAnalytics,
});

function PartnerAnalytics() {
  const [range, setRange] = useState("week");
  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="صاحب مطعم — برجر هاوس"
      nav={partnerNav}
      title="التحليلات"
      actions={<Button variant="outline" icon="download">تصدير Excel</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="flex gap-2">
          {[{ id: "week", label: "أسبوع" }, { id: "month", label: "شهر" }, { id: "custom", label: "مخصص" }].map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                range === r.id ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <Card className="p-md">
          <SectionTitle title="الطلبات عبر الوقت" icon="show_chart" />
          <Bars values={restaurantStats.series} labels={restaurantStats.days} />
        </Card>

        <div className="grid grid-cols-1 gap-md md:grid-cols-3">
          <Card className="p-md">
            <SectionTitle title="متوسط قيمة الطلب" icon="payments" />
            <p className="font-headline-md text-headline-md text-on-surface">{EGP(restaurantStats.aov)}</p>
          </Card>
          <Card className="p-md">
            <SectionTitle title="نسبة الطلبات الملغية" icon="cancel" />
            <p className="font-headline-md text-headline-md text-on-surface">{((restaurantStats.cancelled / restaurantStats.orders) * 100).toFixed(1)}%</p>
          </Card>
          <Card className="p-md">
            <SectionTitle title="العملاء المتكررين" icon="repeat" />
            <p className="font-headline-md text-headline-md text-on-surface">{restaurantStats.repeatRate}%</p>
          </Card>
        </div>

        <div>
          <SectionTitle title="مقارنة الفروع" icon="store" />
          <Table head={["الفرع", "الطلبات", "الإيرادات", "التقييم"]}>
            {restaurantStats.branchPerf.map((b) => (
              <tr key={b.name}>
                <Td>{b.name}</Td>
                <Td>{b.orders}</Td>
                <Td>{EGP(b.revenue)}</Td>
                <Td>{b.rating}</Td>
              </tr>
            ))}
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <div>
            <SectionTitle title="أفضل المنتجات" icon="trending_up" />
            <Table head={["المنتج", "الطلبات", "الإيرادات"]}>
              {restaurantStats.best.map((p) => (
                <tr key={p.name}>
                  <Td>{p.name}</Td>
                  <Td>{p.orders}</Td>
                  <Td>{EGP(p.revenue)}</Td>
                </tr>
              ))}
            </Table>
          </div>
          <div>
            <SectionTitle title="أقل المنتجات" icon="trending_down" />
            <Table head={["المنتج", "الطلبات", "الإيرادات"]}>
              {restaurantStats.worst.map((p) => (
                <tr key={p.name}>
                  <Td>{p.name}</Td>
                  <Td>{p.orders}</Td>
                  <Td>{EGP(p.revenue)}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
