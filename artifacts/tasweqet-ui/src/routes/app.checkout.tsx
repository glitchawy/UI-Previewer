import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListCustomerOrdersQueryKey,
  useGetCustomerAddress,
  useGetCustomerWallet,
  useGetPaymentCapabilities,
  usePlaceOrder,
} from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Badge, Button, MapCanvas, EmptyState } from "@/components/tb/shell";
import { DeliveryEstimateLine, DeliveryEstimateSummary } from "@/components/tb/delivery-estimate";
import { customerTabs } from "@/lib/tb/nav";
import { resetCartAfterOrder, useCart } from "@/lib/tb/cart";
import { EGP } from "@/lib/tb/orders";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/checkout")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | إتمام الطلب", "Talabat Betak | Checkout") },
      { name: "description", content: translate("راجع عنوانك واختر طريقة الدفع المناسبة", "Review your address and choose a payment method") },
    ],
  }),
  component: AppCheckout,
});

const DELIVERY_FEE = 25;

function errorMessage(error: unknown) {
  const data = (error as { data?: { error?: string } } | null)?.data;
  return data?.error || translate("تعذر تأكيد الطلب. حاول مرة أخرى.", "Unable to confirm the order. Please try again.");
}

function AppCheckout() {
  const { t, locale } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cart, isLoading: cartLoading, refresh: refreshCart } = useCart();
  const address = useGetCustomerAddress();
  const wallet = useGetCustomerWallet({ page: 1, pageSize: 1 });
  const paymentCapabilities = useGetPaymentCapabilities();
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [useWallet, setUseWallet] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const deliveryTotal = cart.restaurants.length * DELIVERY_FEE;
  const grandTotal = cart.total + deliveryTotal;
  const placeOrder = usePlaceOrder({
    mutation: {
      onSuccess: async (result) => {
        if (!result.paymentUrl) resetCartAfterOrder();
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: getListCustomerOrdersQueryKey() }),
          queryClient.invalidateQueries({ queryKey: ["/api/customer/wallet"] }),
        ]);
        if (result.paymentUrl) {
          window.location.assign(result.paymentUrl);
          return;
        }
        navigate({
          to: "/app/order-placed",
          search: { ids: result.orders.map((order) => order.id).join(","), paymentSession: "" },
        });
      },
      onError: (error) => setSubmitError(errorMessage(error)),
    },
  });
  const hasAddress = Boolean(address.data?.addressText && address.data.lat != null && address.data.lng != null);
  const walletBalance = wallet.data?.balance ?? 0;
  const walletAmount = useWallet ? Math.min(walletBalance, grandTotal) : 0;
  const amountDue = Math.max(0, grandTotal - walletAmount);
  const cardPaymentsAvailable =
    paymentCapabilities.isSuccess && paymentCapabilities.data.cardPaymentsAvailable === true;
  const unavailableRestaurants = cart.restaurants.filter((group) => !group.acceptingOrders);

  async function submitOrder() {
    setSubmitError("");
    try {
      const freshCart = await refreshCart();
      const unavailable = freshCart.restaurants.find((group) => !group.acceptingOrders);
      if (unavailable) {
        setSubmitError(`${unavailable.restaurantName}: ${unavailable.acceptanceReason}${unavailable.nextOpeningSummary ? ` — ${unavailable.nextOpeningSummary}` : ""}`);
        return;
      }
      placeOrder.mutate({ data: { paymentMethod, useWalletAmount: walletAmount, ...(notes.trim() ? { notes: notes.trim() } : {}) } });
    } catch {
       setSubmitError(t("تعذر تحديث حالة المطعم. لم نرسل الطلب؛ حاول مرة أخرى.", "Unable to refresh restaurant status. The order was not sent; please try again."));
    }
  }

  if (cartLoading || address.isLoading || wallet.isLoading) {
    return <MobileShell tabs={customerTabs}><div className="flex h-screen items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[40px] text-primary" /></div></MobileShell>;
  }

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("إتمام الطلب", "Checkout")} back="/app/cart" subtitle={t("راجع التفاصيل قبل التأكيد", "Review the details before confirming")} />
      {cart.itemCount === 0 ? (
        <div className="p-md">
           <EmptyState icon="shopping_cart" title={t("السلة فاضية", "Your cart is empty")} body={t("ضيف أكلات للسلة قبل إتمام الطلب", "Add dishes to your cart before checkout")} />
           <Link to="/app"><Button className="w-full" icon="restaurant_menu">{t("تصفح المطاعم", "Browse restaurants")}</Button></Link>
        </div>
      ) : (
        <div className="flex flex-col gap-lg p-md pb-32">
          <section>
            <div className="mb-sm flex items-center justify-between">
               <h2 className="font-headline-md text-headline-md text-on-surface">{t("عنوان التوصيل", "Delivery address")}</h2>
               <Link to="/app/address" className="font-label-md text-label-md text-secondary" data-testid="link-edit-address">{t("تغيير", "Change")}</Link>
            </div>
            <MapCanvas height="h-28">
              <span className="absolute inset-0 flex items-center justify-center">
                <Icon name="location_on" className="text-[34px] text-error" filled />
              </span>
            </MapCanvas>
            <Card className={`mt-2 flex items-center gap-3 p-3 ${hasAddress ? "" : "border-error/40 bg-error-container/30"}`}>
              <Icon name={hasAddress ? "home_pin" : "location_off"} className={hasAddress ? "text-secondary" : "text-error"} />
              <div className="min-w-0 flex-1">
                 <p className="font-label-lg text-label-lg text-on-surface">{address.data?.addressText || t("محتاجين عنوان التوصيل", "A delivery address is required")}</p>
                {address.data?.addressDetails ? <p className="font-label-md text-label-md text-on-surface-variant">{address.data.addressDetails}</p> : null}
              </div>
            </Card>
           {!hasAddress ? <Link to="/app/address"><Button variant="outline" className="mt-2 w-full" icon="add_location_alt">{t("أضف عنوان التوصيل", "Add delivery address")}</Button></Link> : null}
          </section>

          <section>
             <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">{t("استخدام المحفظة", "Use wallet")}</h2>
            <label className={`flex cursor-pointer items-center gap-3 rounded-card border-2 p-4 ${useWallet ? "border-primary bg-primary-container/40" : "border-outline-variant bg-surface-container-lowest"}`}>
              <input type="checkbox" checked={useWallet} disabled={walletBalance <= 0} onChange={(event) => setUseWallet(event.target.checked)} className="accent-primary" />
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-primary"><Icon name="account_balance_wallet" /></span>
              <span className="flex-1">
                 <span className="block font-label-lg text-label-lg">{t("استخدم رصيد المحفظة", "Use wallet balance")}</span>
                 <span className="block font-label-md text-label-md text-on-surface-variant">{t("الرصيد المتاح:", "Available balance:")} {EGP(walletBalance)}</span>
              </span>
              {useWallet ? <span className="font-label-lg text-label-lg text-success">− {EGP(walletAmount)}</span> : null}
            </label>
             {walletBalance <= 0 ? <p className="mt-1 font-label-md text-label-md text-on-surface-variant">{t("رصيدك الحالي صفر — أي استرداد معتمد هيظهر هنا.", "Your current balance is zero — approved refunds will appear here.")}</p> : null}
          </section>

          <section>
             <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">{t("طريقة دفع المبلغ المتبقي", "Payment method for remaining amount")}</h2>
            {amountDue === 0 ? (
              <Card className="flex items-center gap-3 border-success/30 bg-success/10 p-4">
                <Icon name="check_circle" className="text-success" filled />
                 <div><p className="font-label-lg text-label-lg">{t("مدفوع بالكامل من المحفظة", "Paid in full from wallet")}</p><p className="font-label-md text-label-md text-on-surface-variant">{t("مش هتحتاج كاش أو بطاقة للطلب ده", "You won't need cash or a card for this order")}</p></div>
              </Card>
            ) : (
              <>
            <label className={`flex cursor-pointer items-center gap-3 rounded-card border-2 p-4 ${paymentMethod === "cash" ? "border-secondary bg-secondary-container/60" : "border-outline-variant bg-surface-container-lowest"}`}>
              <input type="radio" name="payment" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="accent-secondary" />
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-secondary"><Icon name="payments" /></span>
              <span className="flex-1">
                 <span className="block font-label-lg text-label-lg text-on-surface">{t("كاش عند الاستلام", "Cash on delivery")}</span>
                 <span className="block font-label-md text-label-md text-on-surface-variant">{t("ادفع للمندوب لما طلبك يوصل", "Pay the driver when your order arrives")}</span>
              </span>
              {paymentMethod === "cash" ? <Icon name="check_circle" className="text-success" filled /> : null}
            </label>
            <label aria-disabled={!cardPaymentsAvailable} className={`mt-2 flex items-center gap-3 rounded-card border-2 p-4 ${cardPaymentsAvailable ? "cursor-pointer" : "cursor-not-allowed opacity-70"} ${paymentMethod === "card" ? "border-secondary bg-secondary-container/60" : "border-outline-variant bg-surface-container-lowest"}`}>
              <input type="radio" name="payment" checked={paymentMethod === "card"} disabled={!cardPaymentsAvailable} onChange={() => setPaymentMethod("card")} className="accent-secondary" />
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-secondary"><Icon name="credit_card" /></span>
              <span className="flex-1">
                <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
                   {t("بطاقة أو محفظة إلكترونية", "Card or digital wallet")}
                   {!cardPaymentsAvailable ? <Badge tone="neutral">{t("غير متاح حالياً", "Currently unavailable")}</Badge> : null}
                </span>
                <span className="block font-label-md text-label-md text-on-surface-variant">
                  {cardPaymentsAvailable
                     ? t("فيزا، ميزة ومحافظ وخيارات Paymob المتاحة", "Visa, Meeza, wallets, and available Paymob options")
                     : t("سيتم تفعيل الدفع أونلاين بعد إتمام إعداد مزود الدفع.", "Online payments will be enabled after the payment provider is configured.")}
                </span>
              </span>
              {paymentMethod === "card" ? <Icon name="check_circle" className="text-success" filled /> : null}
            </label>
              </>
            )}
          </section>

           <DeliveryEstimateSummary
             estimates={cart.restaurants.map((group) => group.deliveryEstimate)}
             testId="checkout-delivery-estimate-summary"
           />

           <section>
             <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">{t("تفاصيل الطلب", "Order details")}</h2>
            <div className="flex flex-col gap-3">
              {cart.restaurants.map((group) => (
                <Card key={group.restaurantId} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-3 py-2.5">
                    <p className="font-label-lg text-label-lg text-on-surface">{group.restaurantName}</p>
                     <Badge tone="info">{t("طلب منفصل", "Separate order")}</Badge>
                  </div>
                   <div className="border-b border-outline-variant/40 px-3 py-3">
                     <DeliveryEstimateLine estimate={group.deliveryEstimate} testId={`checkout-delivery-estimate-${group.restaurantId}`} />
                   </div>
                  <div className="divide-y divide-outline-variant px-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                           <p className="font-label-lg text-label-lg text-on-surface">{item.quantity.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} × {item.name}</p>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                             {[item.variant?.name, ...item.addons.map((addon) => addon.name)].filter(Boolean).join(" · ") || t("بدون إضافات", "No extras")}
                          </p>
                        </div>
                        <span className="shrink-0 font-label-lg text-label-lg">{EGP(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 bg-surface-container-low/60 px-3 py-2.5 font-label-md text-label-md">
                     <div className="flex justify-between text-on-surface-variant"><span>{t("الإجمالي الفرعي", "Subtotal")}</span><span>{EGP(group.subtotal)}</span></div>
                     <div className="flex justify-between text-on-surface-variant"><span>{t("رسوم التوصيل", "Delivery fee")}</span><span>{EGP(DELIVERY_FEE)}</span></div>
                     <div className="flex justify-between font-label-lg text-on-surface"><span>{t("إجمالي طلب المطعم", "Restaurant order total")}</span><span>{EGP(group.subtotal + DELIVERY_FEE)}</span></div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
             <label htmlFor="order-notes" className="mb-sm block font-headline-md text-headline-md text-on-surface">{t("ملاحظات للمطعم", "Notes for the restaurant")}</label>
             <textarea id="order-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000}
               placeholder={t("مثلاً: بدون بصل", "For example: no onions")} data-testid="input-order-notes"
              className="min-h-20 w-full resize-none rounded-card border border-outline-variant bg-surface-container-lowest p-3 font-body-md text-body-md outline-none focus:border-secondary" />
          </section>

          <Card className="space-y-2 p-md">
             <div className="flex justify-between text-on-surface-variant"><span>{t("إجمالي الأكل", "Food total")}</span><span>{EGP(cart.total)}</span></div>
             <div className="flex justify-between text-on-surface-variant"><span>{t("التوصيل", "Delivery")} ({cart.restaurants.length.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t("مطعم", "restaurant")})</span><span>{EGP(deliveryTotal)}</span></div>
             {walletAmount > 0 ? <div className="flex justify-between text-success"><span>{t("من المحفظة", "From wallet")}</span><span>− {EGP(walletAmount)}</span></div> : null}
             <div className="flex justify-between border-t border-outline-variant pt-2 font-headline-md text-headline-md"><span>{t("المطلوب بعد المحفظة", "Amount due after wallet")}</span><span>{EGP(amountDue)}</span></div>
          </Card>
           <p className="font-label-md text-label-md text-on-surface-variant">{t("يتم مراجعة الأسعار والتوفر مرة أخيرة عند التأكيد.", "Prices and availability are checked one last time on confirmation.")}</p>
          {unavailableRestaurants.map((group) => (
            <p key={group.restaurantId} className="rounded-button bg-error-container p-3 text-center font-label-md text-error" role="alert">
              {group.restaurantName}: {group.acceptanceReason}{group.nextOpeningSummary ? ` — ${group.nextOpeningSummary}` : ""}
            </p>
          ))}
          {submitError ? <p className="rounded-button bg-error-container p-3 text-center font-label-md text-label-md text-error" role="alert">{submitError}</p> : null}
        </div>
      )}

      {cart.itemCount > 0 ? (
        <div className="fixed bottom-[68px] z-20 w-full max-w-[480px] border-t border-outline-variant bg-surface-container-lowest/95 p-md backdrop-blur">
          <Button className="w-full justify-between" icon="task_alt" disabled={!hasAddress || placeOrder.isPending || unavailableRestaurants.length > 0}
            onClick={submitOrder}
            data-testid="button-place-order">
             <span>{placeOrder.isPending ? t("جاري تأكيد الطلب...", "Confirming order...") : amountDue === 0 ? t("تأكيد الطلب بالمحفظة", "Confirm order with wallet") : paymentMethod === "card" ? t("المتابعة للدفع الآمن", "Continue to secure payment") : t("تأكيد الطلب كاش", "Confirm cash order")}</span>
            <span>{EGP(amountDue)}</span>
          </Button>
        </div>
      ) : null}
    </MobileShell>
  );
}