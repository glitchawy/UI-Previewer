import { createFileRoute, Link } from "@tanstack/react-router";
import { Badge, Button, Card, DashboardShell, Icon, SectionTitle, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, orderHistory, orderOf, stateLabels } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/orders/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الطلب | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "تفاصيل الطلب الكاملة مع توزيع الطلبات الفرعية والدفع والتوصيل." },
      { property: "og:title", content: "تفاصيل الطلب | طلبات بيتك" },
      { property: "og:description", content: "متابعة كل تفاصيل طلب معيّن." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminOrderDetail,
});

function AdminOrderDetail() {
  const { id } = Route.useParams();
  const order = orderOf(id);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title={`الطلب ${order.code}`}>
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex flex-wrap items-center justify-between gap-sm p-md">
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{order.customer}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">{order.customerPhone} · {order.address}</p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={order.status} label={stateLabels[order.status]} />
            <StatusBadge status={order.paymentStatus} label={order.paymentStatus} />
          </div>
        </Card>

        {order.status === "CANCELLED" && order.cancelReason ? (
          <Card className="flex items-center gap-2 bg-error-container p-md text-on-error-container">
            <Icon name="cancel" />
            <span className="font-label-lg text-label-lg">سبب الإلغاء: {order.cancelReason}</span>
          </Card>
        ) : null}

        <Card className="p-md">
          <SectionTitle title="الطلبات الفرعية حسب المطعم" icon="storefront" />
          <div className="flex flex-col gap-sm">
            {order.subOrders.map((s) => (
              <div key={s.id} className="rounded-button border border-outline-variant p-md">
                <div className="mb-sm flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">{s.restaurantName} — {s.branch}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">مزود التوصيل: {s.deliveryProvider === "TALABAT_BETAK" ? "طلبات بيتك" : "المطعم"} {s.driver ? `· المندوب: ${s.driver}` : ""}</p>
                  </div>
                  <StatusBadge status={s.status} label={stateLabels[s.status]} />
                </div>
                <ul className="mb-sm flex flex-col gap-1">
                  {s.items.map((it, i) => (
                    <li key={i} className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
                      <span>{it.qty}× {it.name}</span>
                      <span>{EGP(it.price)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t border-outline-variant pt-sm font-label-md text-label-md text-on-surface-variant">
                  <span>الإجمالي الفرعي: {EGP(s.subtotal)}</span>
                  <span>رسوم التوصيل: {EGP(s.deliveryFee)}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="توزيع الدفع لكل مطعم" icon="account_balance" />
          <Table head={["المطعم", "قيمة الطلب", "نسبة العمولة", "إيراد المنصة", "مستحق المطعم"]}>
            {order.subOrders.map((s) => {
              const commissionPct = 15;
              const platformRev = Math.round((s.subtotal * commissionPct) / 100);
              return (
                <tr key={s.id}>
                  <Td>{s.restaurantName}</Td>
                  <Td>{EGP(s.subtotal)}</Td>
                  <Td>{commissionPct}%</Td>
                  <Td>{EGP(platformRev)}</Td>
                  <Td>{EGP(s.subtotal - platformRev)}</Td>
                </tr>
              );
            })}
          </Table>
        </Card>

        <Card className="p-md">
          <SectionTitle title="التوصيل ومحاولات تعيين المندوب" icon="two_wheeler" />
          <div className="flex flex-col gap-1 font-body-md text-body-md text-on-surface-variant">
            <div className="flex items-center gap-2"><Badge tone="danger">محاولة 1</Badge> مندوب رفض الطلب (بعيد عن المنطقة) → التالي</div>
            <div className="flex items-center gap-2"><Badge tone="warn">محاولة 2</Badge> مندوب رفض الطلب (غير متاح) → التالي</div>
            <div className="flex items-center gap-2"><Badge tone="success">محاولة 3</Badge> تم قبول الطلب من محمود سعيد</div>
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="سجل الحالة الكامل" icon="history" />
          <ol className="flex flex-col gap-sm border-r-2 border-outline-variant pr-md">
            {orderHistory.map((h, i) => (
              <li key={i} className="relative">
                <span className="absolute -right-[calc(1.5rem+1px)] top-1 size-2.5 rounded-full bg-primary-container" />
                <p className="font-label-lg text-label-lg text-on-surface">
                  {stateLabels[h.status]} — {h.actor} <span className="text-on-surface-variant">({h.role})</span>
                </p>
                <p className="font-label-md text-label-md text-on-surface-variant">{h.at}</p>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="flex flex-wrap items-center justify-between gap-sm p-md">
          <div className="flex items-center gap-2">
            <Link to="/admin/refunds">
              <Button icon="currency_exchange" variant="outline">استرداد المبلغ</Button>
            </Link>
            <Button icon="sync" variant="outline">إعادة تعيين مندوب</Button>
          </div>
          <p className="font-label-md text-label-md text-outline">هذه الإجراءات متاحة فقط لأدوار مصرح لها بالمالية والتشغيل</p>
        </Card>
      </div>
    </DashboardShell>
  );
}
