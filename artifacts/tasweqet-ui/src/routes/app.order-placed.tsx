import { useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getGetPaymentSessionQueryKey,
  getListCustomerOrdersQueryKey,
  useGetPaymentSession,
  useListCustomerOrders,
} from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Badge, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/orders";
import { resetCartAfterOrder } from "@/lib/tb/cart";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/order-placed")({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: typeof search.ids === "string" ? search.ids : "",
    paymentSession: typeof search.paymentSession === "string" ? search.paymentSession : "",
  }),
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | تم الطلب", "Talabat Betak | Order placed") },
      { name: "description", content: translate("تم استلام طلبك بنجاح وجاري تأكيده", "Your order was received and is being confirmed") },
    ],
  }),
  component: AppOrderPlaced,
});

function AppOrderPlaced() {
  const { t } = useTranslation();
  const { ids } = Route.useSearch();
  const { paymentSession: rawPaymentSession } = Route.useSearch();
  const paymentSessionId = Number(rawPaymentSession);
  const hasPaymentSession = Number.isInteger(paymentSessionId) && paymentSessionId > 0;
  const paymentQuery = useGetPaymentSession(paymentSessionId, {
    query: {
      enabled: hasPaymentSession,
      queryKey: getGetPaymentSessionQueryKey(paymentSessionId),
      refetchInterval: hasPaymentSession ? 2000 : false,
    },
  });
  const requestedIds = new Set([
    ...ids.split(",").map(Number).filter(Number.isInteger),
    ...(paymentQuery.data?.orderIds ?? []),
  ]);
  const ordersQuery = useListCustomerOrders({
    query: {
      queryKey: getListCustomerOrdersQueryKey(),
      refetchInterval: hasPaymentSession ? 2000 : false,
    },
  });
  const orders = (ordersQuery.data ?? []).filter((order) => requestedIds.has(order.id));
  const paymentStatus = paymentQuery.data?.status;
  const paymentFailed = hasPaymentSession && paymentStatus === "failed";
  const paymentPending = hasPaymentSession && (paymentStatus === "pending" || paymentQuery.isLoading);
  const title = paymentFailed ? t("لم يكتمل الدفع", "Payment was not completed") : paymentPending ? t("جاري تأكيد الدفع", "Confirming payment") : hasPaymentSession ? t("تم الدفع بنجاح!", "Payment successful!") : t("تم إرسال طلبك بنجاح!", "Your order was sent successfully!");
  const subtitle = paymentFailed
    ? t("لم يتم خصم أي مبلغ مؤكد. يمكنك الرجوع للسلة والمحاولة مرة أخرى.", "No confirmed amount was charged. You can return to the cart and try again.")
    : paymentPending
      ? t("بنتأكد من Paymob دلوقتي. هتتحدث الحالة تلقائياً.", "Paymob is confirming your payment. The status will update automatically.")
      : t("كل مطعم استلم طلب مستقل وهيبدأ تأكيده دلوقتي", "Each restaurant received a separate order and will start confirming it now");
  useEffect(() => {
    if (paymentStatus === "paid") resetCartAfterOrder();
  }, [paymentStatus]);

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("تم الطلب", "Order placed")} />
      <div className="tb-fade-up flex flex-col items-center gap-lg p-lg text-center">
        <div className="relative flex size-24 items-center justify-center">
          {!paymentFailed ? <span className="tb-ping absolute inset-0 rounded-full bg-success/20" /> : null}
          <span className={`flex size-20 items-center justify-center rounded-full ${paymentFailed ? "bg-error-container text-error" : paymentPending ? "bg-primary-container text-primary" : "bg-success/15 text-success"}`}><Icon name={paymentFailed ? "error" : paymentPending ? "progress_activity" : "check_circle"} className={`text-[48px] ${paymentPending ? "animate-spin" : ""}`} filled={!paymentPending} /></span>
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
        </div>
        {!paymentFailed ? <Badge tone={paymentPending ? "warn" : "info"} className="px-4 py-2"><Icon name="schedule" className="text-[16px]" />{paymentPending ? t("بانتظار تأكيد الدفع", "Awaiting payment confirmation") : t("الوقت المتوقع 30–40 دقيقة", "Estimated time: 30–40 minutes")}</Badge> : null}

        {ordersQuery.isLoading ? <Icon name="progress_activity" className="animate-spin text-[32px] text-primary" /> : (
          <div className="w-full space-y-3 text-right">
            {orders.map((order) => (
              <Link key={order.id} to="/app/orders/$id" params={{ id: String(order.id) }} className="block">
                <Card className="flex items-center gap-3 p-md">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><Icon name="receipt_long" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-label-lg text-label-lg">{order.restaurantName}</span><span className="block font-label-md text-label-md text-on-surface-variant">{order.code}</span></span>
                  <span className="font-headline-md text-headline-md">{EGP(order.total)}</span>
                  <Icon name="chevron_left" className="text-outline" />
                </Card>
              </Link>
            ))}
          </div>
        )}
        {!ordersQuery.isLoading && orders.length === 0 ? <p className="font-label-md text-label-md text-on-surface-variant">{t("تقدر تلاقي الطلب في صفحة طلباتي.", "You can find the order on your Orders page.")}</p> : null}
        <div className="flex w-full flex-col gap-2">
          <Link to={paymentFailed ? "/app/cart" : "/app/orders"}><Button className="w-full" icon={paymentFailed ? "shopping_cart" : "receipt_long"}>{paymentFailed ? t("الرجوع للسلة", "Back to cart") : t("عرض طلباتي", "View my orders")}</Button></Link>
          <Link to="/app"><Button variant="outline" className="w-full" icon="restaurant_menu">{t("العودة للرئيسية", "Back to home")}</Button></Link>
        </div>
      </div>
    </MobileShell>
  );
}