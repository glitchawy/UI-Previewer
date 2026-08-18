import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Badge, Button, Icon, Bars } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, platformStats, reportPresets, monitors } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/reports")({
  head: () => ({
    meta: [
      { title: "التقارير — طلبات بيتك" },
      { name: "description", content: "تقارير شهرية ومخصصة لأداء المنصة مع تصدير Excel ومتابعة الأعطال." },
      { property: "og:title", content: "التقارير — طلبات بيتك" },
      { property: "og:description", content: "تقارير شهرية ومخصصة لأداء المنصة مع تصدير Excel ومتابعة الأعطال." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminReports,
});

const ranges = ["اليوم", "آخر 7 أيام", "هذا الشهر", "آخر 3 شهور", "فترة مخصصة"] as const;

function AdminReports() {
  const [range, setRange] = useState<(typeof ranges)[number]>("هذا الشهر");
  const [exported, setExported] = useState<string | null>(null);

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن — المنصة"
      nav={adminNav}
      title="التقارير"
      actions={<Button icon="download" onClick={() => setExported("التقرير الشهري")}>تصدير Excel</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <Card className="flex flex-wrap items-end gap-sm p-md">
          <div className="flex flex-wrap gap-2">
            {ranges.map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-4 py-2 font-label-md text-label-md transition ${
                  range === r
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {range === "فترة مخصصة" ? (
            <div className="flex flex-wrap items-center gap-2">
              <input type="date" className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface outline-none" />
              <span className="text-on-surface-variant">—</span>
              <input type="date" className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface outline-none" />
              <Button variant="outline" icon="search" className="!px-3 !py-1.5">تطبيق</Button>
            </div>
          ) : null}
        </Card>

        {exported ? (
          <Card className="flex items-center gap-2 border-2 border-success/40 p-md">
            <Icon name="task_alt" className="text-[20px] text-success" />
            <p className="font-label-lg text-label-lg text-success">تم تجهيز «{exported}» بصيغة Excel وبدأ التنزيل.</p>
            <Button variant="ghost" icon="close" className="!px-2 !py-1" onClick={() => setExported(null)} />
          </Card>
        ) : null}

        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="GMV" value={EGP(platformStats.gmv)} icon="payments" tone="warn" delta={`${platformStats.growth}%`} />
          <Stat label="إيرادات المنصة" value={EGP(platformStats.revenue)} icon="account_balance" tone="success" />
          <Stat label="الطلبات" value={platformStats.orders.toLocaleString("ar-EG")} icon="receipt_long" tone="info" />
          <Stat label="متوسط قيمة الطلب" value={EGP(Math.round(platformStats.gmv / platformStats.orders))} icon="shopping_bag" tone="neutral" />
        </div>

        <Card className="p-md">
          <SectionTitle title="التقرير الشهري — GMV" icon="bar_chart" action={<Badge tone="info">{range}</Badge>} />
          <Bars values={platformStats.series} labels={platformStats.months} />
        </Card>

        <div>
          <SectionTitle title="تقارير جاهزة" icon="table_view" />
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
            {reportPresets.map((p) => (
              <Card key={p.id} className="flex flex-col gap-sm p-md transition hover:shadow-md">
                <span className="flex size-9 items-center justify-center rounded-full bg-secondary-container">
                  <Icon name={p.icon} className="text-[20px] text-on-secondary-container" />
                </span>
                <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">{p.desc}</p>
                <div className="flex items-center gap-2">
                  <Button variant="outline" icon="visibility" className="!px-3 !py-1.5">عرض</Button>
                  <Button icon="download" className="!px-3 !py-1.5" onClick={() => setExported(p.name)}>Excel</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
          <div>
            <SectionTitle title="أفضل المطاعم" icon="storefront" />
            <Table head={["المطعم", "الطلبات", "GMV"]}>
              {platformStats.topRestaurants.map((r) => (
                <tr key={r.name} className="transition hover:bg-surface-container-low">
                  <Td>{r.name}</Td>
                  <Td>{r.orders.toLocaleString("ar-EG")}</Td>
                  <Td>{EGP(r.gmv)}</Td>
                </tr>
              ))}
            </Table>
          </div>
          <div>
            <SectionTitle title="أفضل المناطق" icon="location_on" />
            <Table head={["المنطقة", "الطلبات", "النسبة"]}>
              {platformStats.topAreas.map((a) => (
                <tr key={a.name} className="transition hover:bg-surface-container-low">
                  <Td>{a.name}</Td>
                  <Td>{a.orders.toLocaleString("ar-EG")}</Td>
                  <Td><Badge tone="info">{a.share}%</Badge></Td>
                </tr>
              ))}
            </Table>
          </div>
        </div>

        <div>
          <SectionTitle title="مراقبة الأعطال" icon="monitor_heart" />
          <div className="grid grid-cols-2 gap-sm md:grid-cols-3 xl:grid-cols-6">
            {monitors.map((m) => (
              <Card key={m.id} className="p-md">
                <Badge tone={m.tone}>{m.value}</Badge>
                <p className="mt-2 font-label-lg text-label-lg text-on-surface">{m.label}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">{m.detail}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
