import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetPartnerOrderQueryKey,
  getListPartnerOrdersQueryKey,
  type OrderStatus,
  useGetPartnerOrder,
  useUpdatePartnerOrderStatus,
} from "@workspace/api-client-react";
import {
  Badge,
  Button,
  Card,
  DashboardShell,
  EmptyState,
  Icon,
  SectionTitle,
  StatusBadge,
  Table,
  Td,
} from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import {
  EGP,
  formatOrderDate,
  orderStatusLabels,
  paymentStatusLabels,
  paymentStatusTones,
} from "@/lib/tb/orders";

export const Route = createFileRoute("/partner/orders/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الطلب — طلبات بيتك" },
      { name: "description", content: "متابعة حالة الطلب وتفاصيله الكاملة." },
    ],
  }),
  component: PartnerOrderDetail,
});

const restaurantFlow: OrderStatus[] = ["pending", "confirmed", "preparing", "ready"];
const nextStatus: Partial<Record<OrderStatus, "confirmed" | "preparing" | "ready">> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
};

function PartnerOrderDetail() {
  const { id } = Route.useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();
  const query = useGetPartnerOrder(orderId, {
    query: { queryKey: getGetPartnerOrderQueryKey(orderId), enabled: Number.isInteger(orderId), refetchInterval: 15_000 },
  });
  const updateStatus = useUpdatePartnerOrderStatus();
  const order = query.data;

  function advanceOrder() {
    if (!order) return;
    const status = nextStatus[order.status];
    if (!status) return;
    updateStatus.mutate(
      { id: order.id, data: { status } },
      {
        onSuccess: async () => {
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: getGetPartnerOrderQueryKey(order.id) }),
            queryClient.invalidateQueries({ queryKey: getListPartnerOrdersQueryKey() }),
          ]);
        },
      },
    );
  }

  if (query.isLoading) {
    return <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="تفاصيل الطلب"><div className="flex h-72 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[38px] text-primary" /></div></DashboardShell>;
  }
  if (!order) {
    return <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="تفاصيل الطلب"><EmptyState icon="error" title="تعذر تحميل الطلب" body="الطلب غير موجود أو لا يخص مطعمك" /></DashboardShell>;
  }

  const currentFlowIndex = restaurantFlow.indexOf(order.status);
  const availableNextStatus = nextStatus[order.status];

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title={`طلب ${order.code}`}>
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="flex items-center justify-between">
          <Link to="/partner/orders" className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface"><Icon name="arrow_forward" className="text-[18px]" />رجوع للطلبات</Link>
          <StatusBadge status={order.status} label={orderStatusLabels[order.status]} />
        </div>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <div className="flex flex-col gap-md lg:col-span-2">
            <Card className="p-md">
              <SectionTitle title="عناصر الطلب" icon="restaurant_menu" />
              <Table head={["الصنف", "الكمية", "السعر"]}>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td><span>{item.name}{item.variantName ? ` — ${item.variantName}` : ""}</span>{item.addons.length ? <span className="block text-[11px] text-outline">{item.addons.map((addon) => addon.name).join("، ")}</span> : null}</Td>
                    <Td>{item.quantity}</Td>
                    <Td>{EGP(item.lineTotal)}</Td>
                  </tr>
                ))}
              </Table>
              <div className="mt-md flex flex-col gap-1.5 border-t border-outline-variant pt-md font-body-md text-body-md">
                <div className="flex justify-between"><span className="text-on-surface-variant">الإجمالي الفرعي</span><span>{EGP(order.subtotal)}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">رسوم التوصيل</span><span>{EGP(order.deliveryFee)}</span></div>
                <div className="flex justify-between font-label-lg text-label-lg"><span>الإجمالي</span><span>{EGP(order.total)}</span></div>
              </div>
            </Card>

            <Card className="p-md">
              <SectionTitle title="تحديث حالة الطلب" icon="task_alt" />
              <div className="mb-md flex flex-wrap gap-2">
                {restaurantFlow.map((status, index) => (
                  <Badge key={status} tone={index <= currentFlowIndex ? "success" : "neutral"}>{orderStatusLabels[status]}</Badge>
                ))}
              </div>
              {availableNextStatus ? (
                <Button onClick={advanceOrder} disabled={updateStatus.isPending} icon="arrow_back">
                  {updateStatus.isPending ? "جاري التحديث…" : `نقل إلى: ${orderStatusLabels[availableNextStatus]}`}
                </Button>
              ) : (
                <Badge tone="info">{order.status === "ready" ? "الطلب متاح الآن لعروض التوصيل" : "المندوب مسؤول عن المراحل التالية"}</Badge>
              )}
              {updateStatus.isError ? <p className="mt-sm text-label-md text-error">تعذر تحديث الحالة. تأكد من ترتيب المراحل وحالة الدفع.</p> : null}
            </Card>

            <Card className="p-md">
              <SectionTitle title="التوصيل" icon="delivery_dining" />
              {order.driverName ? <Badge tone="success">الكابتن: {order.driverName}</Badge> : <Badge tone="info">{order.status === "ready" ? "جاري انتظار قبول كابتن" : "سيبدأ البحث عن كابتن عند جاهزية الطلب"}</Badge>}
            </Card>
          </div>

          <div className="flex flex-col gap-md">
            <Card className="p-md">
              <SectionTitle title="بيانات العميل" icon="person" />
              <p className="font-label-lg text-label-lg">{order.customerName || "عميل طلبات بيتك"}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{order.customerPhone || "رقم الهاتف غير متاح"}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{order.deliveryAddressText}</p>
              {order.notes ? <p className="mt-sm rounded-button bg-surface-container p-2 text-body-md">{order.notes}</p> : null}
              <Badge tone={paymentStatusTones[order.paymentStatus]} className="mt-sm">{order.paymentMethod === "cash" ? "الدفع كاش" : paymentStatusLabels[order.paymentStatus]}</Badge>
            </Card>

            <Card className="p-md">
              <SectionTitle title="سجل الطلب" icon="history" />
              <ol className="flex flex-col gap-3">
                {order.timeline.map((entry, index) => (
                  <li key={`${entry.status}-${index}`} className="flex gap-2">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary-container" />
                    <div><p className="font-label-lg text-label-lg">{entry.label}</p><p className="font-label-md text-[11px] text-outline">{formatOrderDate(entry.at)}</p></div>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}