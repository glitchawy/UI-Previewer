import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Badge, Button, EmptyState } from "@/components/tb/shell";
import { cart, cartTotals, EGP } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/cart")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | السلة" },
      { name: "description", content: "راجع طلباتك من كل المطاعم قبل إتمام الشراء" },
      { property: "og:title", content: "طلبات بيتك | السلة" },
      { property: "og:description", content: "راجع طلباتك من كل المطاعم قبل إتمام الشراء" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppCart,
});

function AppCart() {
  const totals = cartTotals();

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="السلة" back="/app" subtitle={`${totals.groups} مطعم`} />
      <div className="flex flex-col gap-lg p-md">
        {cart.length === 0 ? (
          <EmptyState icon="shopping_cart" title="السلة فاضية" body="ضيف أكلات من مطعمك المفضل" />
        ) : (
          <>
            <Card className="flex items-center gap-2 bg-secondary-container p-3 text-on-secondary-container">
              <Icon name="info" className="text-[18px]" />
              <span className="font-label-md text-label-md">كل مطعم بيتحضر وبيتوصل بشكل منفصل</span>
            </Card>

            <div className="tb-stagger flex flex-col gap-4">
              {cart.map((group) => {
                const subtotal = group["lines"].reduce((s, l) => s + l["price"] * l["qty"], 0);
                return (
                  <Card key={group["restaurantId"]} className="p-md">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="font-headline-md text-headline-md text-on-surface">{group["restaurantName"]}</p>
                      <Badge tone={group["deliveryProvider"] === "TALABAT_BETAK" ? "info" : "success"}>
                        {group["deliveryProvider"] === "TALABAT_BETAK" ? "توصيل طلبات بيتك" : "توصيل المطعم"}
                      </Badge>
                    </div>
                    <div className="flex flex-col gap-3">
                      {group["lines"].map((line) => (
                        <div key={line["productId"]} className="flex items-center gap-3">
                          <img src={line["image"]} alt={line["name"]} className="size-14 shrink-0 rounded-card object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-label-lg text-label-lg text-on-surface">{line["name"]}</p>
                            <p className="truncate font-label-md text-label-md text-on-surface-variant">
                              {line["variation"]}{line["addons"].length ? ` · ${line["addons"].join("، ")}` : ""}
                            </p>
                            <p className="font-label-lg text-label-lg text-on-surface">{EGP(line["price"])}</p>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label="حذف"
                              className="flex size-7 items-center justify-center rounded-full text-error transition hover:bg-error-container"
                            >
                              <Icon name="delete" className="text-[16px]" />
                            </button>
                            <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-1.5 py-1">
                              <button type="button" className="flex size-6 items-center justify-center">
                                <Icon name="remove" className="text-[14px]" />
                              </button>
                              <span className="w-4 text-center font-label-md text-label-md">{line["qty"]}</span>
                              <button type="button" className="flex size-6 items-center justify-center">
                                <Icon name="add" className="text-[14px]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-outline-variant pt-2 font-label-lg text-label-lg text-on-surface">
                      <span>الإجمالي الفرعي</span>
                      <span>{EGP(subtotal)}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Link to="/app/address">
              <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                <Icon name="location_on" className="text-on-surface-variant" />
                <div className="min-w-0 flex-1">
                  <p className="font-label-lg text-label-lg text-on-surface">عنوان التوصيل</p>
                  <p className="truncate font-label-md text-label-md text-on-surface-variant">٧ ش ٩، المعادي، الدور ٣، شقة ٦</p>
                </div>
                <Icon name="chevron_left" className="text-on-surface-variant" />
              </Card>
            </Link>

            <Card className="flex flex-col gap-2 p-md">
              <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
                <span>الإجمالي الفرعي</span>
                <span>{EGP(totals.subtotal)}</span>
              </div>
              <div className="flex items-center justify-between font-body-md text-body-md text-on-surface-variant">
                <span>رسوم التوصيل ({totals.groups} مطعم)</span>
                <span>{EGP(totals.delivery)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant pt-2 font-headline-md text-headline-md text-on-surface">
                <span>الإجمالي</span>
                <span>{EGP(totals.total)}</span>
              </div>
            </Card>

            <Link to="/app/checkout">
              <Button className="w-full" icon="shopping_cart_checkout">
                إتمام الطلب
              </Button>
            </Link>
          </>
        )}
      </div>
    </MobileShell>
  );
}
