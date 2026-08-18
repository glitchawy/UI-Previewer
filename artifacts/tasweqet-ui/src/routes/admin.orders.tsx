import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Button, Card, DashboardShell, Field, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, ORDER_STATES, orders, stateLabels } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "متابعة كل طلبات المنصة عبر المطاعم والمندوبين وحالات الدفع." },
      { property: "og:title", content: "الطلبات | طلبات بيتك" },
      { property: "og:description", content: "متابعة كل طلبات المنصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOrders,
});

const statusFilters = ["الكل", ...ORDER_STATES, "CANCELLED"];
const paymentFilters = ["الكل", "CASH", "CARD", "WALLET"] as const;
const paymentLabels: Record<string, string> = { CASH: "كاش", CARD: "بطاقة", WALLET: "محفظة" };

function AdminOrders() {
  const [status, setStatus] = useState("الكل");
  const [payment, setPayment] = useState<(typeof paymentFilters)[number]>("الكل");

  const rows = orders.filter(
    (o) => (status === "الكل" || o.status === status) && (payment === "الكل" || o.payment === payment),
  );

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن"
      nav={adminNav}
      title="الطلبات"
      actions={<Button icon="download" variant="outline">تصدير</Button>}
    >
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex flex-col gap-sm p-md">
          <Field label="بحث" icon="search" placeholder="ابحث برقم الطلب أو اسم العميل" />
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                  status === s ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {s === "الكل" ? "الكل" : stateLabels[s]}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {paymentFilters.map((p) => (
              <button
                key={p}
                onClick={() => setPayment(p)}
                className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                  payment === p ? "bg-secondary-container text-on-secondary-container" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {p === "الكل" ? "كل طرق الدفع" : paymentLabels[p]}
              </button>
            ))}
          </div>
        </Card>

        <Table head={["الكود", "الوقت", "العميل", "المطاعم", "الإجمالي", "العمولة", "الدفع", "حالة الطلب"]}>
          {rows.map((o) => (
            <tr key={o.id} className="transition hover:bg-surface-container-low">
              <Td>
                <Link to="/admin/orders/$id" params={{ id: o.id }} className="font-label-lg text-label-lg text-secondary">
                  {o.code}
                </Link>
              </Td>
              <Td className="text-on-surface-variant">{o.placedAt}</Td>
              <Td>{o.customer}</Td>
              <Td>
                <div className="flex flex-wrap gap-1">
                  {o.subOrders.map((s) => (
                    <Badge key={s.id} tone="neutral">{s.restaurantName}</Badge>
                  ))}
                </div>
              </Td>
              <Td>{EGP(o.total)}</Td>
              <Td>{EGP(o.commission)}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  {paymentLabels[o.payment]}
                  <StatusBadge status={o.paymentStatus} label={o.paymentStatus === "SUCCESS" ? "ناجح" : o.paymentStatus === "PENDING" ? "معلّق" : o.paymentStatus === "FAILED" ? "فشل" : "مسترد"} />
                </div>
              </Td>
              <Td>
                <StatusBadge status={o.status} label={stateLabels[o.status]} />
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
