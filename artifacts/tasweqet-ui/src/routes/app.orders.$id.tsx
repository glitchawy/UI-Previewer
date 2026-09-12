import { createFileRoute, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetCustomerOrderQueryKey,
  getGetCustomerWalletQueryKey,
  getListCustomerOrdersQueryKey,
  useCancelCustomerOrder,
  useGetCustomerOrder,
} from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Badge, Button, EmptyState } from "@/components/tb/shell";
import { DeliveryEstimateCard } from "@/components/tb/delivery-estimate";
import { OrderLiveTracking } from "@/components/tb/order-live-tracking";
import { customerTabs } from "@/lib/tb/nav";
import { EGP, formatOrderDate, orderStatusLabels, orderStatusTones, paymentStatusLabels, paymentStatusTones } from "@/lib/tb/orders";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/orders/$id")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | تفاصيل الطلب", "Talabat Betak | Order details") },
      { name: "description", content: translate("تفاصيل طلبك وحالته", "Your order details and status") },
    ],
  }),
  component: AppOrderDetail,
});

function AppOrderDetail() {
  const { t, locale } = useTranslation();
  const { id: rawId } = Route.useParams();
  const parsedId = Number(rawId);
  const id = Number.isInteger(parsedId) ? parsedId : 0;
  const queryClient = useQueryClient();
  const orderQuery = useGetCustomerOrder(id, {
    query: { enabled: id > 0, queryKey: getGetCustomerOrderQueryKey(id), refetchInterval: 10_000 },
  });
  const orderEstimate = (orderQuery.data as unknown as { deliveryEstimate?: unknown } | undefined)?.deliveryEstimate;
  const cancelOrder = useCancelCustomerOrder({
    mutation: {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getGetCustomerOrderQueryKey(id) }),
          queryClient.invalidateQueries({ queryKey: getListCustomerOrdersQueryKey() }),
          queryClient.invalidateQueries({ queryKey: getGetCustomerWalletQueryKey() }),
        ]);
      },
    },
  });

  function handleCancel() {
    if (!window.confirm(t("متأكد إنك عايز تلغي الطلب؟ لو الدفع أونلاين هنبدأ استرداد المبلغ تلقائياً.", "Are you sure you want to cancel the order? Online payments will be refunded automatically."))) return;
    cancelOrder.mutate({ id });
  }

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={orderQuery.data?.code || t("تفاصيل الطلب", "Order details")} back="/app/orders" />
      {orderQuery.isLoading ? <div className="flex h-64 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[36px] text-primary" /></div> :
       orderQuery.isError || !orderQuery.data ? <div className="p-md"><EmptyState icon="error" title={t("الطلب غير موجود", "Order not found")} body={t("تأكد من رقم الطلب وحاول مرة أخرى", "Check the order number and try again")} /></div> : (
        <div className="flex flex-col gap-lg p-md">
          <Card className="p-md">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-headline-md text-headline-md">{orderQuery.data.restaurantName}</p><p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(orderQuery.data.createdAt)}</p></div>
              <Badge tone={orderStatusTones[orderQuery.data.status]}>{orderStatusLabels[orderQuery.data.status]}</Badge>
            </div>
          </Card>

           {orderQuery.data && !["cancelled", "delivered"].includes(orderQuery.data.status) ? (
             <DeliveryEstimateCard
               estimate={orderEstimate}
               title={t("المدة المتوقعة وقت تأكيد الطلب", "Estimated at order placement")}
               testId="order-detail-delivery-estimate"
             />
           ) : null}

           {orderQuery.data.status === "picked_up" ? (
             <OrderLiveTracking
               key={id}
               id={id}
               driverName={orderQuery.data.driverName}
               destination={{ lat: orderQuery.data.deliveryLat, lng: orderQuery.data.deliveryLng }}
             />
           ) : null}

           <section>
             <h2 className="mb-sm font-headline-md text-headline-md">{t("محتويات الطلب", "Order contents")}</h2>
            <Card className="divide-y divide-outline-variant px-md">
              {orderQuery.data.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                   <div className="min-w-0"><p className="font-label-lg text-label-lg">{item.quantity.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} × {item.name}</p>
                     <p className="font-label-md text-label-md text-on-surface-variant">{[item.variantName, ...item.addons.map((addon) => addon.name)].filter(Boolean).join(" · ") || t("بدون إضافات", "No extras")}</p></div>
                  <span className="shrink-0 font-label-lg text-label-lg">{EGP(item.lineTotal)}</span>
                </div>
              ))}
            </Card>
          </section>

          <section>
             <h2 className="mb-sm font-headline-md text-headline-md">{t("حالة الطلب", "Order status")}</h2>
            <Card className="p-md">
              {orderQuery.data.timeline.map((event, index) => (
                <div key={`${event.status}-${String(event.at)}`} className="flex gap-3">
                  <div className="flex flex-col items-center"><span className="flex size-7 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="text-[16px]" /></span>{index < orderQuery.data.timeline.length - 1 ? <span className="h-8 w-0.5 bg-success/30" /> : null}</div>
                  <div><p className="font-label-lg text-label-lg">{event.label}</p><p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(event.at)}</p></div>
                </div>
              ))}
            </Card>
          </section>

          <Card className="space-y-2 p-md">
             <div className="flex justify-between text-on-surface-variant"><span>{t("الإجمالي الفرعي", "Subtotal")}</span><span>{EGP(orderQuery.data.subtotal)}</span></div>
             <div className="flex justify-between text-on-surface-variant"><span>{t("رسوم التوصيل", "Delivery fee")}</span><span>{EGP(orderQuery.data.deliveryFee)}</span></div>
             {orderQuery.data.walletAmountUsed > 0 ? <div className="flex justify-between text-success"><span>{t("مدفوع من المحفظة", "Paid from wallet")}</span><span>− {EGP(orderQuery.data.walletAmountUsed)}</span></div> : null}
             <div className="flex justify-between text-on-surface-variant"><span>{t("المبلغ خارج المحفظة", "Amount outside wallet")}</span><span>{EGP(orderQuery.data.externalAmountDue)}</span></div>
             <div className="flex justify-between border-t border-outline-variant pt-2 font-headline-md text-headline-md"><span>{t("الإجمالي", "Total")}</span><span>{EGP(orderQuery.data.total)}</span></div>
          </Card>

          <Card className="space-y-3 p-md">
             <div className="flex gap-3"><Icon name="location_on" className="text-secondary" /><div><p className="font-label-lg text-label-lg">{t("عنوان التوصيل", "Delivery address")}</p><p className="font-body-md text-body-md text-on-surface-variant">{orderQuery.data.deliveryAddressText}</p></div></div>
             <div className="flex gap-3"><Icon name="payments" className="text-secondary" /><div><p className="font-label-lg text-label-lg">{t("طريقة الدفع", "Payment method")}</p><p className="font-body-md text-body-md text-on-surface-variant">{orderQuery.data.paymentMethod === "card" ? t("بطاقة / أونلاين", "Card / online") : t("كاش عند الاستلام", "Cash on delivery")}</p><Badge tone={paymentStatusTones[orderQuery.data.paymentStatus]} className="mt-1">{paymentStatusLabels[orderQuery.data.paymentStatus]}</Badge></div></div>
             {orderQuery.data.notes ? <div className="flex gap-3"><Icon name="notes" className="text-secondary" /><div><p className="font-label-lg text-label-lg">{t("ملاحظات", "Notes")}</p><p className="font-body-md text-body-md text-on-surface-variant">{orderQuery.data.notes}</p></div></div> : null}
          </Card>

          {orderQuery.data.canCancel ? (
            <Card className="space-y-3 border-error/30 p-md">
               <div><p className="font-label-lg text-label-lg">{t("محتاج تلغي الطلب؟", "Need to cancel your order?")}</p><p className="font-label-md text-label-md text-on-surface-variant">{t("الإلغاء متاح قبل ما المطعم يبدأ التحضير.", "Cancellation is available before the restaurant starts preparing.")}</p></div>
              <Button variant="danger" className="w-full" icon="cancel" disabled={cancelOrder.isPending} onClick={handleCancel}>
                 {cancelOrder.isPending ? t("جاري الإلغاء…", "Cancelling…") : t("إلغاء الطلب", "Cancel order")}
              </Button>
               {cancelOrder.isError ? <p className="text-label-md text-error">{(cancelOrder.error as { data?: { error?: string } })?.data?.error || t("تعذر إلغاء الطلب", "Unable to cancel order")}</p> : null}
            </Card>
          ) : ["preparing", "ready", "picked_up"].includes(orderQuery.data.status) ? (
            <Card className="flex items-center gap-2 bg-surface-container p-3 text-on-surface-variant">
               <Icon name="lock" /><span className="font-label-md text-label-md">{t("لا يمكن إلغاء الطلب بعد بدء التحضير.", "The order cannot be cancelled after preparation begins.")}</span>
            </Card>
          ) : null}

          {orderQuery.data.canRequestRefund ? (
            <Link to="/app/refund/$id" params={{ id: String(orderQuery.data.id) }}>
               <Button variant="outline" className="w-full" icon="currency_exchange">{t("طلب استرداد للمحفظة", "Request wallet refund")}</Button>
            </Link>
          ) : orderQuery.data.refundRequestStatus ? (
            <Card className="flex items-center justify-between p-md">
               <span className="font-label-lg text-label-lg">{t("طلب الاسترداد", "Refund request")}</span>
              <Badge tone={orderQuery.data.refundRequestStatus === "approved" ? "success" : orderQuery.data.refundRequestStatus === "rejected" || orderQuery.data.refundRequestStatus === "failed" ? "danger" : "warn"}>
                 {orderQuery.data.refundRequestStatus === "approved" ? t("تمت الموافقة", "Approved") : orderQuery.data.refundRequestStatus === "rejected" ? t("مرفوض", "Rejected") : orderQuery.data.refundRequestStatus === "failed" ? t("يحتاج مراجعة", "Needs review") : t("بانتظار المراجعة", "Awaiting review")}
              </Badge>
            </Card>
          ) : null}
        </div>
      )}
    </MobileShell>
  );
}