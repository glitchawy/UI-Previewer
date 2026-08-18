import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Button, Card, DashboardShell, Icon, SectionTitle, Stat, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, drivers, driverWallet } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/drivers/$id")({
  head: () => ({
    meta: [
      { title: "ملف المندوب | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "مراجعة مستندات المندوب وحالة التوثيق والمحفظة." },
      { property: "og:title", content: "ملف المندوب | طلبات بيتك" },
      { property: "og:description", content: "مراجعة توثيق المندوب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDriverDetail,
});

const steps = ["PENDING", "UNDER_REVIEW", "APPROVED"];
const stepLabels: Record<string, string> = { PENDING: "بانتظار المراجعة", UNDER_REVIEW: "تحت المراجعة", APPROVED: "معتمد" };

const documents = [
  { id: "nid", title: "الرقم القومي", icon: "badge" },
  { id: "crim", title: "الفيش والتشبيه", icon: "gavel" },
  { id: "extra", title: "مستند إضافي", icon: "description" },
];

const historyRows = [
  { code: "#12343", restaurant: "محطة المشويات", earning: 21, at: "أمس 22:10" },
  { code: "#12341", restaurant: "برجر هاوس", earning: 35, at: "أمس 19:30" },
  { code: "#12338", restaurant: "كشري التحرير", earning: 18, at: "أمس 16:05" },
];

function AdminDriverDetail() {
  const { id } = Route.useParams();
  const d = drivers.find((x) => x.id === id) ?? drivers[0]!;
  const [suspended, setSuspended] = useState(d.status === "SUSPENDED");
  const currentStep = steps.indexOf(d.status === "REJECTED" || d.status === "SUSPENDED" ? "PENDING" : d.status);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title={d.name}>
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex flex-wrap items-center justify-between gap-sm p-md">
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{d.name}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">{d.phone} · {d.area} · {d.vehicle}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">{d.type === "TALABAT_BETAK" ? "مندوب المنصة" : "مندوب مطعم"} · ⭐ {d.rating || "—"} · {d.deliveries} توصيلة</p>
          </div>
          <StatusBadge status={suspended ? "SUSPENDED" : d.status} />
        </Card>

        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="رصيد المحفظة" value={EGP(driverWallet.balance)} icon="account_balance_wallet" tone="success" />
          <Stat label="أرباح اليوم" value={EGP(driverWallet.today)} icon="today" tone="info" />
          <Stat label="أرباح الأسبوع" value={EGP(driverWallet.week)} icon="calendar_view_week" tone="warn" />
          <Stat label="نسبة المندوب" value={`${driverWallet.commissionRate}%`} icon="percent" tone="info" />
        </div>

        <Card className="p-md">
          <SectionTitle title="المستندات المقدمة" icon="folder" />
          <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-2 rounded-button border border-outline-variant p-md">
                <div className="flex items-center gap-2">
                  <Icon name={doc.icon} className="text-[20px] text-on-surface-variant" />
                  <span className="font-label-lg text-label-lg text-on-surface">{doc.title}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button variant="ghost" icon="visibility">معاينة</Button>
                  <Button variant="primary" icon="check">موافقة</Button>
                  <Button variant="danger" icon="close">رفض</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="حالة التوثيق" icon="verified" />
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full font-label-md text-label-md ${
                    i <= currentStep ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">{stepLabels[s]}</span>
                {i < steps.length - 1 ? <span className="h-px flex-1 bg-outline-variant" /> : null}
              </div>
            ))}
          </div>
        </Card>

        <Card className="flex items-center justify-between gap-sm p-md">
          <div className="flex items-center gap-2">
            <Icon name={suspended ? "block" : "check_circle"} className={suspended ? "text-error" : "text-success"} />
            <span className="font-label-lg text-label-lg text-on-surface">{suspended ? "المندوب موقوف حالياً" : "المندوب نشط ويستلم طلبات"}</span>
          </div>
          <Button variant={suspended ? "primary" : "danger"} icon={suspended ? "play_circle" : "pause_circle"} onClick={() => setSuspended((s) => !s)}>
            {suspended ? "تفعيل المندوب" : "إيقاف المندوب"}
          </Button>
        </Card>

        <Card className="p-md">
          <SectionTitle title="سجل التوصيلات" icon="history" />
          <Table head={["الطلب", "المطعم", "الأرباح", "الوقت"]}>
            {historyRows.map((h) => (
              <tr key={h.code}>
                <Td><Badge tone="neutral">{h.code}</Badge></Td>
                <Td>{h.restaurant}</Td>
                <Td>{EGP(h.earning)}</Td>
                <Td className="text-on-surface-variant">{h.at}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
