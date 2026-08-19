import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListCustomerOrdersQueryKey,
  useGetCustomerAddress,
  usePlaceOrder,
} from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Badge, Button, MapCanvas, EmptyState } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { resetCartAfterOrder, useCart } from "@/lib/tb/cart";
import { EGP } from "@/lib/tb/orders";

export const Route = createFileRoute("/app/checkout")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | إتمام الطلب" },
      { name: "description", content: "راجع عنوانك واختر طريقة الدفع المناسبة" },
    ],
  }),
  component: AppCheckout,
});

const DELIVERY_FEE = 25;

function errorMessage(error: unknown) {
  const data = (error as { data?: { error?: string } } | null)?.data;
  return data?.error || "تعذر تأكيد الطلب. حاول مرة أخرى.";
}

function AppCheckout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { cart, isLoading: cartLoading } = useCart();
  const address = useGetCustomerAddress();
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card">("cash");
  const [submitError, setSubmitError] = useState("");
  const deliveryTotal = cart.restaurants.length * DELIVERY_FEE;
  const grandTotal = cart.total + deliveryTotal;
  const placeOrder = usePlaceOrder({
    mutation: {
      onSuccess: async (result) => {
        if (!result.paymentUrl) resetCartAfterOrder();
        await queryClient.invalidateQueries({ queryKey: getListCustomerOrdersQueryKey() });
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

  if (cartLoading || address.isLoading) {
    return <MobileShell tabs={customerTabs}><div className="flex h-screen items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[40px] text-primary" /></div></MobileShell>;
  }

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="إتمام الطلب" back="/app/cart" subtitle="راجع التفاصيل قبل التأكيد" />
      {cart.itemCount === 0 ? (
        <div className="p-md">
          <EmptyState icon="shopping_cart" title="السلة فاضية" body="ضيف أكلات للسلة قبل إتمام الطلب" />
          <Link to="/app"><Button className="w-full" icon="restaurant_menu">تصفح المطاعم</Button></Link>
        </div>
      ) : (
        <div className="flex flex-col gap-lg p-md pb-32">
          <section>
            <div className="mb-sm flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md text-on-surface">عنوان التوصيل</h2>
              <Link to="/app/address" className="font-label-md text-label-md text-secondary" data-testid="link-edit-address">تغيير</Link>
            </div>
            <MapCanvas height="h-28">
              <span className="absolute inset-0 flex items-center justify-center">
                <Icon name="location_on" className="text-[34px] text-error" filled />
              </span>
            </MapCanvas>
            <Card className={`mt-2 flex items-center gap-3 p-3 ${hasAddress ? "" : "border-error/40 bg-error-container/30"}`}>
              <Icon name={hasAddress ? "home_pin" : "location_off"} className={hasAddress ? "text-secondary" : "text-error"} />
              <div className="min-w-0 flex-1">
                <p className="font-label-lg text-label-lg text-on-surface">{address.data?.addressText || "محتاجين عنوان التوصيل"}</p>
                {address.data?.addressDetails ? <p className="font-label-md text-label-md text-on-surface-variant">{address.data.addressDetails}</p> : null}
              </div>
            </Card>
            {!hasAddress ? <Link to="/app/address"><Button variant="outline" className="mt-2 w-full" icon="add_location_alt">أضف عنوان التوصيل</Button></Link> : null}
          </section>

          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">طريقة الدفع</h2>
            <label className={`flex cursor-pointer items-center gap-3 rounded-card border-2 p-4 ${paymentMethod === "cash" ? "border-secondary bg-secondary-container/60" : "border-outline-variant bg-surface-container-lowest"}`}>
              <input type="radio" name="payment" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="accent-secondary" />
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-secondary"><Icon name="payments" /></span>
              <span className="flex-1">
                <span className="block font-label-lg text-label-lg text-on-surface">كاش عند الاستلام</span>
                <span className="block font-label-md text-label-md text-on-surface-variant">ادفع للمندوب لما طلبك يوصل</span>
              </span>
              {paymentMethod === "cash" ? <Icon name="check_circle" className="text-success" filled /> : null}
            </label>
            <label className={`mt-2 flex cursor-pointer items-center gap-3 rounded-card border-2 p-4 ${paymentMethod === "card" ? "border-secondary bg-secondary-container/60" : "border-outline-variant bg-surface-container-lowest"}`}>
              <input type="radio" name="payment" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} className="accent-secondary" />
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-container-lowest text-secondary"><Icon name="credit_card" /></span>
              <span className="flex-1">
                <span className="block font-label-lg text-label-lg text-on-surface">بطاقة أو محفظة إلكترونية</span>
                <span className="block font-label-md text-label-md text-on-surface-variant">فيزا، ميزة ومحافظ وخيارات Paymob المتاحة</span>
              </span>
              {paymentMethod === "card" ? <Icon name="check_circle" className="text-success" filled /> : null}
            </label>
          </section>

          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">تفاصيل الطلب</h2>
            <div className="flex flex-col gap-3">
              {cart.restaurants.map((group) => (
                <Card key={group.restaurantId} className="overflow-hidden">
                  <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-3 py-2.5">
                    <p className="font-label-lg text-label-lg text-on-surface">{group.restaurantName}</p>
                    <Badge tone="info">طلب منفصل</Badge>
                  </div>
                  <div className="divide-y divide-outline-variant px-3">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                        <div className="min-w-0">
                          <p className="font-label-lg text-label-lg text-on-surface">{item.quantity.toLocaleString("ar-EG")} × {item.name}</p>
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            {[item.variant?.name, ...item.addons.map((addon) => addon.name)].filter(Boolean).join(" · ") || "بدون إضافات"}
                          </p>
                        </div>
                        <span className="shrink-0 font-label-lg text-label-lg">{EGP(item.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1 bg-surface-container-low/60 px-3 py-2.5 font-label-md text-label-md">
                    <div className="flex justify-between text-on-surface-variant"><span>الإجمالي الفرعي</span><span>{EGP(group.subtotal)}</span></div>
                    <div className="flex justify-between text-on-surface-variant"><span>رسوم التوصيل</span><span>{EGP(DELIVERY_FEE)}</span></div>
                    <div className="flex justify-between font-label-lg text-on-surface"><span>إجمالي طلب المطعم</span><span>{EGP(group.subtotal + DELIVERY_FEE)}</span></div>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          <section>
            <label htmlFor="order-notes" className="mb-sm block font-headline-md text-headline-md text-on-surface">ملاحظات للمطعم</label>
            <textarea id="order-notes" value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={1000}
              placeholder="مثلاً: بدون بصل" data-testid="input-order-notes"
              className="min-h-20 w-full resize-none rounded-card border border-outline-variant bg-surface-container-lowest p-3 font-body-md text-body-md outline-none focus:border-secondary" />
          </section>

          <Card className="space-y-2 p-md">
            <div className="flex justify-between text-on-surface-variant"><span>إجمالي الأكل</span><span>{EGP(cart.total)}</span></div>
            <div className="flex justify-between text-on-surface-variant"><span>التوصيل ({cart.restaurants.length.toLocaleString("ar-EG")} مطعم)</span><span>{EGP(deliveryTotal)}</span></div>
            <div className="flex justify-between border-t border-outline-variant pt-2 font-headline-md text-headline-md"><span>الإجمالي المطلوب</span><span>{EGP(grandTotal)}</span></div>
          </Card>
          <p className="font-label-md text-label-md text-on-surface-variant">يتم مراجعة الأسعار والتوفر مرة أخيرة عند التأكيد.</p>
          {submitError ? <p className="rounded-button bg-error-container p-3 text-center font-label-md text-label-md text-error" role="alert">{submitError}</p> : null}
        </div>
      )}

      {cart.itemCount > 0 ? (
        <div className="fixed bottom-[68px] z-20 w-full max-w-[480px] border-t border-outline-variant bg-surface-container-lowest/95 p-md backdrop-blur">
          <Button className="w-full justify-between" icon="task_alt" disabled={!hasAddress || placeOrder.isPending}
            onClick={() => { setSubmitError(""); placeOrder.mutate({ data: { paymentMethod, ...(notes.trim() ? { notes: notes.trim() } : {}) } }); }}
            data-testid="button-place-order">
            <span>{placeOrder.isPending ? "جاري تأكيد الطلب..." : paymentMethod === "card" ? "المتابعة للدفع الآمن" : "تأكيد الطلب كاش"}</span>
            <span>{EGP(grandTotal)}</span>
          </Button>
        </div>
      ) : null}
    </MobileShell>
  );
}