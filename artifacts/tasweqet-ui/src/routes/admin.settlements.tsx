import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, DashboardShell, Icon, SectionTitle, Stat, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, settlements } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/settlements")({
  head: () => ({
    meta: [
      { title: "التسويات | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "تسويات المطاعم الأسبوعية بين العمولات ورسوم التوصيل والاستردادات." },
      { property: "og:title", content: "التسويات | طلبات بيتك" },
      { property: "og:description", content: "متابعة تسويات المطاعم الأسبوعية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminSettlements,
});

const periods = ["3 — 9 أغسطس", "10 — 16 أغسطس", "17 — 23 أغسطس"];

function AdminSettlements() {
  const [period, setPeriod] = useState(periods[1]);
  const rows = settlements.filter((s) => s.period === period);
  const totalNet = rows.reduce((s, r) => s + r.net, 0);
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0);
  const totalDelivery = rows.reduce((s, r) => s + r.delivery, 0);
  const totalRefunds = rows.reduce((s, r) => s + r.refunds, 0);

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن"
      nav={adminNav}
      title="التسويات"
      actions={<Button icon="download" variant="outline">تصدير Excel</Button>}
    >
      <div className="tb-stagger flex flex-col gap-md">
        <div className="flex flex-wrap gap-2">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                period === p ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="إجمالي المستحق (صافي)" value={EGP(totalNet)} icon="account_balance" tone="success" />
          <Stat label="العمولات" value={EGP(totalCommission)} icon="percent" tone="warn" />
          <Stat label="رسوم التوصيل" value={EGP(totalDelivery)} icon="local_shipping" tone="info" />
          <Stat label="الاستردادات" value={EGP(totalRefunds)} icon="currency_exchange" tone="danger" />
        </div>

        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">التسوية أسبوعية ولا يوجد ربط بنكي آلي حالياً — التحويل يتم يدوياً بعد الاعتماد.</span>
        </Card>

        <Table head={["رقم التسوية", "المطعم", "الفترة", "الطلبات", "الإجمالي", "العمولة", "التوصيل", "التسويات", "الاستردادات", "الصافي", "الحالة", ""]} mobile="scroll">
          {rows.map((s) => (
            <tr key={s.id}>
              <Td>{s.id}</Td>
              <Td>{s.party}</Td>
              <Td className="text-on-surface-variant">{s.period}</Td>
              <Td>{s.orders}</Td>
              <Td>{EGP(s.gross)}</Td>
              <Td>{EGP(s.commission)}</Td>
              <Td>{EGP(s.delivery)}</Td>
              <Td>{EGP(s.adjustments)}</Td>
              <Td>{EGP(s.refunds)}</Td>
              <Td className="font-label-lg text-label-lg">{EGP(s.net)}</Td>
              <Td><StatusBadge status={s.status} label={s.status === "PENDING" ? "بانتظار الاعتماد" : s.status === "APPROVED" ? "معتمد" : "مدفوع"} /></Td>
              <Td>
                <div className="flex gap-1">
                  {s.status === "PENDING" ? <Button variant="primary" icon="check">اعتماد</Button> : null}
                  {s.status !== "PAID" ? <Button variant="outline" icon="task_alt">تعليم كمدفوع</Button> : null}
                </div>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
