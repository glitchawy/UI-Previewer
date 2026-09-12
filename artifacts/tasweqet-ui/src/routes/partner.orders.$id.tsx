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
import { usePartnerNav } from "@/lib/tb/nav";
import {
  orderStatusLabel,
  paymentStatusLabel,
  paymentStatusTones,
} from "@/lib/tb/orders";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/tb/locale-format";
import { useTranslation, translate } from "@/lib/i18n";

export const Route = createFileRoute("/partner/orders/$id")({
  head: () => ({
    meta: [
      { title: translate("تفاصيل الطلب — طلبات بيتك", "Order details — Talabat Betak") },
      { name: "description", content: translate("متابعة حالة الطلب وتفاصيله الكاملة.", "Track the order status and full details.") },
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
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
  const { id } = Route.useParams();
  const orderId = Number(id);
  const queryClient = useQueryClient();
  const query = useGetPartnerOrder(orderId, {
    query: {
      queryKey: getGetPartnerOrderQueryKey(orderId),
      enabled: Number.isInteger(orderId),
      retry: false,
      refetchInterval: (result) => result.state.status === "success" ? 15_000 : false,
    },
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
    return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("تفاصيل الطلب", "Order details")}><div className="flex h-72 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[38px] text-primary" /></div></DashboardShell>;
  }
  if (query.isError || !order) {
    return (
      <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("تفاصيل الطلب", "Order details")}>
        <div className="flex flex-col items-center gap-md">
          <EmptyState icon="lock" title={t("تعذر الوصول إلى الطلب", "Could not access order")} body={t("الطلب غير متاح أو لا تملك صلاحية عرضه.", "The order is unavailable or you do not have permission to view it.")} />
          <Link to="/partner/orders"><Button variant="outline" icon="arrow_forward">{t("رجوع للطلبات", "Back to orders")}</Button></Link>
        </div>
      </DashboardShell>
    );
  }

  const currentFlowIndex = restaurantFlow.indexOf(order.status);
  const availableNextStatus = nextStatus[order.status];

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t(`طلب ${order.code}`, `Order ${order.code}`)}>
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="flex items-center justify-between">
          <Link to="/partner/orders" className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface"><Icon name="arrow_forward" className="text-[18px]" />{t("رجوع للطلبات", "Back to orders")}</Link>
          <StatusBadge status={order.status} label={orderStatusLabel(order.status, t)} />
        </div>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <div className="flex flex-col gap-md lg:col-span-2">
            <Card className="p-md">
              <SectionTitle title={t("عناصر الطلب", "Order items")} icon="restaurant_menu" />
              <Table head={[t("الصنف", "Item"), t("الكمية", "Quantity"), t("السعر", "Price")]}>
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <Td><span>{item.name}{item.variantName ? ` — ${item.variantName}` : ""}</span>{item.addons.length ? <span className="block text-[11px] text-outline">{item.addons.map((addon) => addon.name).join("، ")}</span> : null}</Td>
                    <Td>{formatNumber(item.quantity, locale)}</Td>
                    <Td>{formatCurrency(item.lineTotal, locale)}</Td>
                  </tr>
                ))}
              </Table>
              <div className="mt-md flex flex-col gap-1.5 border-t border-outline-variant pt-md font-body-md text-body-md">
                <div className="flex justify-between"><span className="text-on-surface-variant">{t("الإجمالي الفرعي", "Subtotal")}</span><span>{formatCurrency(order.subtotal, locale)}</span></div>
                <div className="flex justify-between"><span className="text-on-surface-variant">{t("رسوم التوصيل", "Delivery fee")}</span><span>{formatCurrency(order.deliveryFee, locale)}</span></div>
                <div className="flex justify-between font-label-lg text-label-lg"><span>{t("الإجمالي", "Total")}</span><span>{formatCurrency(order.total, locale)}</span></div>
              </div>
            </Card>

            <Card className="p-md">
              <SectionTitle title={t("تحديث حالة الطلب", "Update order status")} icon="task_alt" />
              <div className="mb-md flex flex-wrap gap-2">
                {restaurantFlow.map((status, index) => (
                  <Badge key={status} tone={index <= currentFlowIndex ? "success" : "neutral"}>{orderStatusLabel(status, t)}</Badge>
                ))}
              </div>
              {availableNextStatus ? (
                <Button onClick={advanceOrder} disabled={updateStatus.isPending} icon="arrow_back">
                   {updateStatus.isPending ? t("جاري التحديث…", "Updating…") : t(`نقل إلى: ${orderStatusLabel(availableNextStatus, t)}`, `Move to: ${orderStatusLabel(availableNextStatus, t)}`)}
                </Button>
              ) : (
                 <Badge tone="info">{order.status === "ready" ? t("الطلب متاح الآن لعروض التوصيل", "The order is now available for delivery offers") : t("المندوب مسؤول عن المراحل التالية", "The driver handles the next stages")}</Badge>
              )}
               {updateStatus.isError ? <p className="mt-sm text-label-md text-error">{t("تعذر تحديث الحالة. تأكد من ترتيب المراحل وحالة الدفع.", "Could not update status. Check the stage order and payment status.")}</p> : null}
            </Card>

            <Card className="p-md">
               <SectionTitle title={t("التوصيل", "Delivery")} icon="delivery_dining" />
              {order.dispatchStatus.state === "assigned" ? (
                 <Badge tone="success">{order.driverName ? t(`الكابتن: ${order.driverName}`, `Driver: ${order.driverName}`) : t("تم إسناد كابتن للطلب", "A driver has been assigned")}</Badge>
              ) : order.dispatchStatus.state === "actively_offered" ? (
                 <Badge tone="info">{t("تم إرسال عرض لكابتن وجارٍ انتظار الرد", "An offer was sent to a driver; waiting for a response")}</Badge>
              ) : order.dispatchStatus.state === "retry_scheduled" ? (
                 <Badge tone="warn">{t("لا يوجد كابتن مؤهل حالياً — ستتم إعادة المحاولة تلقائياً", "No eligible driver is available — we will retry automatically")}</Badge>
              ) : order.dispatchStatus.state === "terminal" ? (
                 <Badge tone="neutral">{t("انتهت مرحلة الإسناد لهذا الطلب", "Assignment has ended for this order")}</Badge>
              ) : (
                 <Badge tone="info">{t("سيبدأ البحث عن كابتن عند جاهزية الطلب", "Driver search starts when the order is ready")}</Badge>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-md">
            <Card className="p-md">
               <SectionTitle title={t("بيانات العميل", "Customer details")} icon="person" />
               <p className="font-label-lg text-label-lg">{order.customerName || t("عميل طلبات بيتك", "Talabat Betak customer")}</p>
               <p className="font-body-md text-body-md text-on-surface-variant">{order.customerPhone || t("رقم الهاتف غير متاح", "Phone number unavailable")}</p>
              <p className="font-body-md text-body-md text-on-surface-variant">{order.deliveryAddressText}</p>
              {order.notes ? <p className="mt-sm rounded-button bg-surface-container p-2 text-body-md">{order.notes}</p> : null}
               <Badge tone={paymentStatusTones[order.paymentStatus]} className="mt-sm">{order.paymentMethod === "cash" ? t("الدفع كاش", "Cash payment") : paymentStatusLabel(order.paymentStatus, t)}</Badge>
            </Card>

            <Card className="p-md">
               <SectionTitle title={t("سجل الطلب", "Order timeline")} icon="history" />
              <ol className="flex flex-col gap-3">
                {order.timeline.map((entry, index) => (
                  <li key={`${entry.status}-${index}`} className="flex gap-2">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-primary-container" />
                     <div><p className="font-label-lg text-label-lg">{entry.label}</p><p className="font-label-md text-[11px] text-outline">{formatDateTime(entry.at, locale)}</p></div>
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