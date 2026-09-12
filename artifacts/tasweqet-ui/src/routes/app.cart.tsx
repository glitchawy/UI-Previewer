import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Badge, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { clearCart, updateCartItem, useCart } from "@/lib/tb/cart";
import { getSession } from "@/lib/auth-session";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/cart")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | السلة", "Talabat Betak | Cart") },
      { name: "description", content: translate("راجع طلباتك من كل المطاعم قبل إتمام الشراء", "Review your orders from all restaurants before checkout") },
      { property: "og:title", content: translate("طلبات بيتك | السلة", "Talabat Betak | Cart") },
      { property: "og:description", content: translate("راجع طلباتك من كل المطاعم قبل إتمام الشراء", "Review your orders from all restaurants before checkout") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppCart,
});

function AppCart() {
  const { t, locale } = useTranslation();
  const { cart, isLoading } = useCart();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const session = getSession();
  const EGP = (value: number) => `${value.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} ${t("ج.م", "EGP")}`;

  async function setQuantity(id: number, quantity: number) {
    setPendingId(id);
    try { await updateCartItem(id, quantity); } finally { setPendingId(null); }
  }

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar
        title={t("السلة", "Cart")}
        back="/app"
        subtitle={cart.restaurants.length > 0 ? `${cart.restaurants.length.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} ${t("مطعم", "restaurant")}` : t("سلتك فاضية", "Your cart is empty")}
        right={cart.itemCount > 0 ? (
          <button type="button" onClick={() => clearCart()} className="flex items-center gap-1 font-label-md text-[13px] text-error hover:bg-error-container px-2 py-1 rounded-button transition-colors">
            <Icon name="delete" className="text-[16px]" />
            {t("مسح الكل", "Clear all")}
          </button>
        ) : undefined}
      />

      <div className="flex flex-col gap-5 p-4 pb-[8rem]">
        {isLoading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-4 text-primary">
            <Icon name="progress_activity" className="animate-spin text-[40px]" />
            <p className="font-label-lg text-label-lg animate-pulse">{t("جاري تحضير السلة...", "Preparing your cart...")}</p>
          </div>
        ) : cart.restaurants.length === 0 ? (
          <div className="mt-12 flex flex-col items-center text-center animate-[tb-fade-up_0.5s_ease-out]">
            <div className="relative mb-6 flex size-32 items-center justify-center rounded-full bg-surface-container-high border-4 border-surface-container-lowest shadow-sm">
              <Icon name="shopping_cart" className="text-[56px] text-outline" />
              <div className="absolute -bottom-2 -right-2 flex size-12 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-md">
                <Icon name="restaurant_menu" className="text-[24px]" />
              </div>
            </div>
             <h2 className="mb-2 font-headline-lg text-headline-lg text-on-surface">{t("سلتك لسة فاضية", "Your cart is still empty")}</h2>
            <p className="mb-8 max-w-[260px] font-body-lg text-[15px] text-on-surface-variant leading-relaxed">
               {t("اكتشف أكلات جديدة من مطاعمك المفضلة وضيفها للسلة دلوقتي.", "Discover new dishes from your favorite restaurants and add them to your cart.")}
            </p>
            <Link to="/app">
               <Button icon="explore" className="px-8 shadow-md">{t("تصفح المطاعم", "Browse restaurants")}</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 rounded-[16px] bg-secondary-container/50 border border-secondary/20 p-4 text-on-secondary-container shadow-sm animate-[tb-fade-up_0.3s_ease-out]">
              <Icon name="info" className="text-[22px] shrink-0 text-secondary mt-0.5" filled />
              <span className="font-label-lg text-[14px] leading-relaxed font-medium">
                 {t("علشان نضمن جودة وسخونة أكلك، كل مطعم بيتحضر وبيتوصل في طلب منفصل.", "To keep your food fresh and hot, each restaurant is prepared and delivered as a separate order.")}
              </span>
            </div>

            <div className="tb-stagger flex flex-col gap-5">
              {cart.restaurants.map((group) => {
                return (
                  <div key={group.restaurantId} className="relative flex flex-col rounded-[20px] bg-surface-container-lowest shadow-sm border border-outline-variant/60 overflow-hidden">
                    <div className="flex items-center justify-between border-b border-outline-variant/40 bg-surface-container-lowest px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="flex size-10 items-center justify-center rounded-full bg-surface-container text-on-surface-variant shadow-inner">
                           <Icon name="storefront" className="text-[20px]" />
                        </div>
                        <p className="font-headline-md text-[17px] text-on-surface">{group.restaurantName}</p>
                      </div>
                      <Badge tone={group.deliveryType === "platform" ? "info" : "success"} className="gap-1 px-3 py-1 shadow-sm border border-transparent">
                        <Icon name={group.deliveryType === "platform" ? "local_shipping" : "storefront"} className="text-[14px]" />
                         {group.deliveryType === "platform" ? t("توصيل طلبات بيتك", "Talabat Betak delivery") : t("توصيل المطعم", "Restaurant delivery")}
                      </Badge>
                    </div>

                    <div className="flex flex-col divide-y divide-outline-variant/40 bg-surface-container-lowest">
                      {group.items.map((line) => (
                        <div key={line.id} className="flex gap-4 p-4 transition-opacity duration-300" style={{ opacity: pendingId === line.id ? 0.5 : 1 }}>
                          <div className="relative">
                            {line.imageUrl ? (
                              <img src={`/api/storage${line.imageUrl}`} alt={line.name} className="size-[72px] shrink-0 rounded-[14px] object-cover shadow-sm border border-outline-variant/30" />
                            ) : (
                              <div className="flex size-[72px] shrink-0 items-center justify-center rounded-[14px] bg-surface-container-high border border-outline-variant/30 text-outline shadow-inner">
                                <Icon name="fastfood" className="text-[28px]" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1 flex flex-col">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <p className="truncate font-label-lg text-[16px] text-on-surface">{line.name}</p>
                              <button
                                type="button"
                                 aria-label={t("حذف", "Delete")}
                                onClick={() => setQuantity(line.id, 0)}
                                disabled={pendingId === line.id}
                                className="flex size-8 shrink-0 items-center justify-center rounded-full text-outline hover:text-error hover:bg-error-container transition-colors active:scale-95"
                              >
                                <Icon name="delete_outline" className="text-[20px]" />
                              </button>
                            </div>
                            <p className="font-label-md text-[13px] text-on-surface-variant leading-relaxed line-clamp-2 mb-3 pr-1">
                               {[line.variant?.name, ...line.addons.map((addon) => addon.name)].filter(Boolean).join(" · ") || t("بدون اختيارات إضافية", "No extra options")}
                            </p>

                            <div className="flex items-center justify-between mt-auto">
                              <p className="font-headline-md text-[16px] text-on-surface">{EGP(line.unitPrice)}</p>

                              <div className="flex items-center gap-3 rounded-full bg-surface-container px-1 py-1 shadow-inner border border-outline-variant/20">
                                <button type="button" onClick={() => setQuantity(line.id, line.quantity - 1)} disabled={pendingId === line.id} className="flex size-7 items-center justify-center rounded-full bg-surface-container-lowest shadow-sm hover:brightness-95 transition-all text-on-surface active:scale-95">
                                  <Icon name="remove" className="text-[16px]" />
                                </button>
                                <span className="w-5 text-center font-label-lg text-[15px]">{line.quantity.toLocaleString("ar-EG")}</span>
                                <button type="button" onClick={() => setQuantity(line.id, line.quantity + 1)} disabled={pendingId === line.id} className="flex size-7 items-center justify-center rounded-full bg-primary-container shadow-sm text-on-primary-container hover:brightness-105 transition-all active:scale-95">
                                  <Icon name="add" className="text-[16px]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between bg-surface-container-low/50 px-5 py-3 border-t border-outline-variant/40">
                       <span className="font-label-lg text-[14px] text-on-surface-variant">{t("الإجمالي الفرعي للمطعم", "Restaurant subtotal")}</span>
                      <span className="font-headline-md text-[17px] text-on-surface">{EGP(group.subtotal)}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/app/address" className="group relative overflow-hidden block rounded-[20px] shadow-sm animate-[tb-fade-up_0.4s_ease-out]">
              <div className="absolute inset-0 bg-gradient-to-r from-secondary-container/20 to-transparent pointer-events-none" />
              <Card className="flex items-center gap-4 p-4 transition-all group-hover:border-secondary group-hover:shadow-md border border-outline-variant bg-surface-container-lowest rounded-[20px]">
                <div className="flex size-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container shrink-0 shadow-inner">
                  <Icon name="location_on" className="text-[24px]" filled />
                </div>
                <div className="min-w-0 flex-1">
                   <p className="font-label-lg text-[15px] text-on-surface mb-0.5">{t("عنوان التوصيل", "Delivery address")}</p>
                  <p className="truncate font-body-md text-[14px] text-on-surface-variant">
                     {session?.user.addressText || t("اضغط هنا لتحديد عنوان التوصيل", "Tap here to set your delivery address")}
                  </p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant group-hover:bg-secondary group-hover:text-white transition-colors">
                  <Icon name="chevron_left" className="text-[20px]" />
                </div>
              </Card>
            </Link>
          </>
        )}
      </div>

      {cart.itemCount > 0 && !isLoading && (
        <div className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-20 mx-auto w-full max-w-[480px] px-4 sm:bottom-[5rem] animate-[tb-fade-up_0.5s_ease-out]">
          <div className="overflow-hidden rounded-[20px] shadow-lift border border-outline-variant/50 bg-surface-container-lowest/95 backdrop-blur-md p-3">
            <Link to="/app/checkout" className="block">
              <Button className="w-full h-14 justify-between shadow-md text-lg">
                <span className="flex items-center gap-2">
                  <Icon name="shopping_cart_checkout" className="text-[22px]" />
                   <span className="font-label-lg text-[17px]">{t("متابعة لإتمام الطلب", "Continue to checkout")}</span>
                </span>
                <span className="font-headline-md text-[18px] bg-white/20 px-3 py-1 rounded-md">
                  {EGP(cart.total)}
                </span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </MobileShell>
  );
}
