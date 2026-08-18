import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Badge, Button, MapCanvas } from "@/components/tb/shell";
import { cart, cartTotals, customerWallet, EGP } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/checkout")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | إتمام الطلب" },
      { name: "description", content: "اختار طريقة الدفع وأكد طلبك" },
      { property: "og:title", content: "طلبات بيتك | إتمام الطلب" },
      { property: "og:description", content: "اختار طريقة الدفع وأكد طلبك" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppCheckout,
});

function AppCheckout() {
  const totals = cartTotals();

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="إتمام الطلب" back="/app/cart" />
      <div className="flex flex-col gap-lg p-md">
        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">عنوان التوصيل</h2>
          <MapCanvas height="h-32">
            <span className="absolute inset-0 flex items-center justify-center">
              <Icon name="location_on" className="text-[32px] text-error" filled />
            </span>
          </MapCanvas>
          <Card className="mt-2 flex items-center justify-between p-3">
            <div>
              <p className="font-label-lg text-label-lg text-on-surface">٧ ش ٩، المعادي</p>
              <p className="font-label-md text-label-md text-on-surface-variant">الدور ٣، شقة ٦</p>
            </div>
            <Link to="/app/address" className="font-label-md text-label-md text-secondary">
              تغيير
            </Link>
          </Card>
        </section>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">طريقة الدفع</h2>
          <div className="flex flex-col gap-2">
            {[
              { id: "cash", icon: "payments", title: "كاش عند الاستلام" },
              { id: "card", icon: "credit_card", title: "فيزا / أونلاين عبر Paymob" },
              { id: "wallet", icon: "account_balance_wallet", title: `المحفظة (${EGP(customerWallet.balance)})` },
            ].map((m, i) => (
              <label
                key={m.id}
                className="flex cursor-pointer items-center gap-3 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-3 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container"
              >
                <input type="radio" name="payment" defaultChecked={i === 1} className="accent-secondary" />
                <Icon name={m.icon} className="text-on-surface-variant" />
                <span className="font-body-md text-body-md text-on-surface">{m.title}</span>
              </label>
            ))}
          </div>
          <label className="mt-2 flex items-center justify-between rounded-button bg-surface-container-low px-3 py-2.5">
            <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
              <Icon name="savings" className="text-[18px]" />
              استخدام رصيد المحفظة جزئياً
            </span>
            <input type="checkbox" className="accent-secondary" />
          </label>
        </section>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">تفاصيل الطلب</h2>
          <div className="flex flex-col gap-2">
            {cart.map((group) => {
              const subtotal = group["lines"].reduce((s, l) => s + l["price"] * l["qty"], 0);
              return (
                <Card key={group["restaurantId"]} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-label-lg text-label-lg text-on-surface">{group["restaurantName"]}</p>
                    <Badge tone={group["deliveryProvider"] === "TALABAT_BETAK" ? "info" : "success"}>
                      {group["deliveryProvider"] === "TALABAT_BETAK" ? "طلبات بيتك" : "المطعم"}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
                    <span>الإجمالي الفرعي</span>
                    <span>{EGP(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
                    <span>رسوم التوصيل</span>
                    <span>{EGP(group["deliveryFee"])}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </section>

        <Card className="flex flex-col gap-2 p-md">
          <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
            <span>الإجمالي الفرعي</span>
            <span>{EGP(totals.subtotal)}</span>
          </div>
          <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
            <span>إجمالي رسوم التوصيل</span>
            <span>{EGP(totals.delivery)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-outline-variant pt-2 font-headline-md text-headline-md text-on-surface">
            <span>الإجمالي المطلوب</span>
            <span>{EGP(totals.total)}</span>
          </div>
        </Card>

        <Link to="/app/order-placed">
          <Button className="w-full" icon="task_alt">
            تأكيد الطلب
          </Button>
        </Link>
      </div>
    </MobileShell>
  );
}
