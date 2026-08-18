import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Badge, Button, Icon, StatusBadge } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, payments, paymentStatusLabels, methodLabels } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/payments")({
  head: () => ({
    meta: [
      { title: "المدفوعات — طلبات بيتك" },
      { name: "description", content: "متابعة مدفوعات Paymob والفيزا والنقدي وحالات الدفع والاسترداد." },
      { property: "og:title", content: "المدفوعات — طلبات بيتك" },
      { property: "og:description", content: "متابعة مدفوعات Paymob والفيزا والنقدي وحالات الدفع والاسترداد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPayments,
});

const statuses = ["الكل", "PENDING", "PROCESSING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED", "PARTIAL_REFUND"];

function AdminPayments() {
  const [status, setStatus] = useState("الكل");
  const list = payments.filter((p) => (status === "الكل" ? true : p.status === status));
  const success = payments.filter((p) => p.status === "SUCCESS").reduce((s, p) => s + p.amount, 0);

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن — المنصة"
      nav={adminNav}
      title="المدفوعات"
      actions={<Button variant="outline" icon="download">تصدير</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="مدفوعات ناجحة اليوم" value={EGP(success)} icon="credit_score" tone="success" delta="8%" />
          <Stat label="نقدي مستحق من المندوبين" value={EGP(4820)} icon="payments" tone="warn" />
          <Stat label="عمليات فاشلة (24س)" value="18" icon="error" tone="danger" />
          <Stat label="مستردة" value={EGP(320)} icon="currency_exchange" tone="info" />
        </div>

        <Card className="flex flex-wrap items-center gap-2 p-md">
          <Icon name="filter_alt" className="text-[18px] text-on-surface-variant" />
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3.5 py-1.5 font-label-md text-label-md transition ${
                status === s
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {s === "الكل" ? s : paymentStatusLabels[s]}
            </button>
          ))}
        </Card>

        <div>
          <SectionTitle title="سجل عمليات الدفع" icon="receipt" />
          <Table head={["الكود", "الطلب", "العميل", "الطريقة", "المبلغ", "الحالة", "مرجع المزوّد", "الوقت"]} mobile="scroll">
            {list.map((p) => (
              <tr key={p.id} className="transition hover:bg-surface-container-low">
                <Td>{p.id}</Td>
                <Td><span dir="ltr">{p.order}</span></Td>
                <Td>{p.customer}</Td>
                <Td><Badge tone={p.method === "CASH" ? "neutral" : "info"}>{methodLabels[p.method]}</Badge></Td>
                <Td>{EGP(p.amount)}</Td>
                <Td>
                  <StatusBadge
                    status={p.status === "PARTIAL_REFUND" ? "REFUNDED" : p.status}
                    label={paymentStatusLabels[p.status]}
                  />
                </Td>
                <Td><span dir="ltr" className="text-on-surface-variant">{p.ref}</span></Td>
                <Td>{p.at}</Td>
              </tr>
            ))}
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle title="طرق الدفع المتاحة" icon="account_balance_wallet" />
            {[
              { label: "نقدي عند الاستلام", icon: "payments", on: true },
              { label: "فيزا / ماستركارد (Paymob)", icon: "credit_card", on: true },
              { label: "محافظ إلكترونية (Paymob)", icon: "smartphone", on: true },
              { label: "محفظة طلبات بيتك", icon: "account_balance_wallet", on: true },
            ].map((m) => (
              <div key={m.label} className="flex items-center justify-between rounded-button bg-surface-container-low px-3 py-2.5">
                <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface">
                  <Icon name={m.icon} className="text-[18px] text-on-surface-variant" />
                  {m.label}
                </span>
                <Badge tone={m.on ? "success" : "neutral"}>{m.on ? "مُفعّل" : "موقوف"}</Badge>
              </div>
            ))}
          </Card>

          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle title="سلامة العمليات المالية" icon="verified" />
            {[
              "كل الحسابات المالية تُنفَّذ على السيرفر فقط",
              "كل تغيير في الرصيد له حركة مسجّلة في السجل",
              "العمليات تُنفَّذ داخل معاملة قاعدة بيانات واحدة",
              "المبالغ بالقروش لتجنب أخطاء الأرقام العشرية",
            ].map((t) => (
              <p key={t} className="flex items-start gap-2 font-label-md text-label-md text-on-surface-variant">
                <Icon name="check_circle" className="text-[16px] text-success" />
                {t}
              </p>
            ))}
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
