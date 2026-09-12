import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, Icon, Badge, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { FavButton } from "@/lib/tb/favorites";
import { ProductOptionsSheet } from "@/components/tb/product-options-sheet";
import { useCart } from "@/lib/tb/cart";
import { restaurantHoursSummary } from "@/lib/tb/restaurant-hours";
import { getLocale, translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/restaurant/$id")({
  head: () => ({
    meta: [{ title: translate("طلبات بيتك | صفحة المطعم", "Talabat Betak | Restaurant") }],
  }),
  component: AppRestaurantId,
});

const EGP = (n: string | number) => `${Number(n).toLocaleString(getLocale() === "ar" ? "ar-EG" : "en-EG", { minimumFractionDigits: 0 })} ${translate("ج.م", "EGP")}`;

type Variant = { id: number; name: string; priceDelta: string; isDefault: boolean };
type Addon = { id: number; name: string; price: string; isAvailable: boolean };
type Product = { id: number; restaurantId: number; categoryId: number | null; name: string; description: string | null; imageUrl: string | null; basePrice: string; isAvailable: boolean; acceptingOrders: boolean; acceptanceReason: string; nextOpeningSummary: string | null; variants: Variant[]; addons: Addon[] };
type Category = { id: number; name: string; isActive: boolean };
type Restaurant = { id: number; name: string; description: string | null; address: string; category: string | null; deliveryType: string; logoUrl: string | null; coverUrl: string | null; hours: string | null; acceptingOrders: boolean; acceptanceReason: string; nextOpeningSummary: string | null };
type MenuData = { restaurant: Restaurant; categories: Category[]; products: Product[] };

function AppRestaurantId() {
  const { t, locale } = useTranslation();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const { cart } = useCart();

  // Product sheet state
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [cartFeedback, setCartFeedback] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    if (!menu) setLoading(true);
    setError("");
    fetch(`/api/restaurants/${id}/menu`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(t("المطعم غير موجود أو غير نشط", "Restaurant not found or inactive")); return r.json(); })
      .then((d: MenuData) => setMenu(d))
      .catch((e: Error) => { if (!controller.signal.aborted) setError(e.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id, locale]);

  function openSheet(p: Product) {
    if (!p.acceptingOrders) return;
    setSheetProduct(p);
  }

  const activeCats = menu?.categories.filter((c) => c.isActive) ?? [];
  const products = menu?.products ?? [];
  const filtered = activeCat === null ? products : products.filter((p) => p.categoryId === activeCat);

  if (loading) return (
    <MobileShell tabs={customerTabs}>
      <div className="flex h-screen items-center justify-center">
        <Icon name="hourglass_empty" className="animate-spin text-[40px] text-on-surface-variant" />
      </div>
    </MobileShell>
  );

  if (error || !menu) return (
    <MobileShell tabs={customerTabs}>
      <div className="flex flex-col items-center gap-md p-xl text-center">
        <Icon name="error" className="text-[48px] text-error" />
         <p className="font-body-md text-body-md text-on-surface-variant">{error || t("المطعم غير موجود", "Restaurant not found")}</p>
         <Button onClick={() => navigate({ to: "/app" })}>{t("العودة للرئيسية", "Back to home")}</Button>
      </div>
    </MobileShell>
  );

  const r = menu.restaurant;
  const hours = restaurantHoursSummary(r.hours);

  return (
    <MobileShell tabs={customerTabs}>
      {/* Header image + back */}
      <div className="relative">
        <Link to="/app" className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface">
          <Icon name="arrow_forward" />
        </Link>
        <FavButton targetType="restaurant" targetId={Number(id)} className="absolute left-3 top-3 z-20 size-9" />
        {r.coverUrl ? (
          <img src={`/api/storage${r.coverUrl}`} alt={r.name} className="h-44 w-full object-cover" />
        ) : (
          <div className="flex h-44 items-center justify-center bg-surface-container">
            <Icon name="restaurant" className="text-[64px] text-outline" />
          </div>
        )}
      </div>

      {/* Restaurant info */}
      <div className="flex flex-col gap-sm px-md pb-sm">
        <div className="-mt-10 flex items-end gap-3">
          {r.logoUrl ? (
            <img src={`/api/storage${r.logoUrl}`} alt={r.name} className="size-16 rounded-xl border-2 border-surface object-cover shadow" />
          ) : (
            <div className="flex size-16 items-center justify-center rounded-xl border-2 border-surface bg-surface-container shadow">
              <Icon name="storefront" className="text-[32px] text-outline" />
            </div>
          )}
          <div className="pb-1">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{r.name}</h1>
          </div>
        </div>
        {r.description && <p className="font-body-md text-body-md text-on-surface-variant">{r.description}</p>}
        <div className="flex flex-wrap gap-2">
          {r.category && <Badge tone="neutral">{r.category}</Badge>}
          <span className="max-w-full" title={hours?.full ?? r.acceptanceReason} aria-label={hours?.full ?? r.acceptanceReason}>
              <Badge tone={r.acceptingOrders ? "success" : "neutral"} className="max-w-full whitespace-normal break-words">
                <Icon name="schedule" className="shrink-0 text-[14px]" />{r.acceptanceReason}
              </Badge>
          </span>
          <Badge tone={r.deliveryType === "platform" ? "info" : "success"}>
             {r.deliveryType === "platform" ? t("توصيل طلبات بيتك", "Talabat Betak delivery") : t("توصيل المطعم", "Restaurant delivery")}
          </Badge>
        </div>
      </div>
      {!r.acceptingOrders && (
        <p className="mx-md rounded-button bg-error-container p-3 text-center font-label-md text-error" role="alert">
          {r.acceptanceReason}{r.nextOpeningSummary ? ` — ${r.nextOpeningSummary}` : ""}
        </p>
      )}

      {cartFeedback && (
        <p className="mx-md rounded-button bg-success/10 p-3 text-center font-label-md text-success" role="status">
          <Icon name="check_circle" className="ml-1 align-middle text-[18px]" filled />{cartFeedback}
        </p>
      )}

      {/* Category tabs */}
      {activeCats.length > 0 && (
        <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-outline-variant bg-surface px-md py-2">
          <button type="button" onClick={() => setActiveCat(null)}
            className={`shrink-0 rounded-button px-3 py-1.5 font-label-md text-label-md transition ${activeCat === null ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"}`}>
             {t("الكل", "All")}
          </button>
          {activeCats.map((c) => (
            <button key={c.id} type="button" onClick={() => setActiveCat(c.id)}
              className={`shrink-0 rounded-button px-3 py-1.5 font-label-md text-label-md transition ${activeCat === c.id ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"}`}>
              {c.name}
            </button>
          ))}
        </div>
      )}

      {/* Products */}
      <div className="flex flex-col gap-2 p-md pb-32">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-xl text-center">
            <Icon name="restaurant_menu" className="text-[48px] text-outline" />
             <p className="font-body-md text-body-md text-on-surface-variant">{t("لا توجد منتجات متاحة", "No products available")}</p>
          </div>
        ) : (
          filtered.map((p) => (
            <button key={p.id} type="button" onClick={() => openSheet(p)}
              disabled={!p.acceptingOrders}
               aria-label={p.acceptingOrders ? `${t("إضافة", "Add")} ${p.name}` : `${p.name} — ${p.acceptanceReason}`}
              className="relative flex items-center gap-3 rounded-card border border-outline-variant bg-surface-container-lowest p-md text-right transition enabled:hover:border-secondary enabled:active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60">
              <FavButton targetType="product" targetId={p.id} className="absolute left-2 top-2" />
              {p.imageUrl ? (
                <img src={`/api/storage${p.imageUrl}`} alt={p.name} className="size-20 shrink-0 rounded-button object-cover" />
              ) : (
                <div className="flex size-20 shrink-0 items-center justify-center rounded-button bg-surface-container">
                  <Icon name="fastfood" className="text-[28px] text-outline" />
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1">
                <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                {p.description && <p className="line-clamp-2 font-body-md text-[12px] text-on-surface-variant">{p.description}</p>}
                <div className="flex items-center gap-2">
                  <span className="font-headline-md text-headline-md text-primary">{EGP(p.basePrice)}</span>
                   {p.variants.length > 0 && <Badge tone="info">{t("أحجام متعددة", "Multiple sizes")}</Badge>}
                </div>
              </div>
              {p.acceptingOrders
                ? <Icon name="add_circle" className="text-[28px] text-primary" />
                 : <Badge tone="neutral">{p.isAvailable ? t("المطعم مغلق", "Restaurant closed") : t("غير متاح", "Unavailable")}</Badge>}
            </button>
          ))
        )}
      </div>

      {/* Cart FAB */}
      {cart.itemCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-md">
          <Link to="/app/cart"
            className="flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-on-primary shadow-lg transition hover:opacity-90">
            <Icon name="shopping_cart" />
             <span className="font-label-lg text-label-lg">{t("السلة", "Cart")} ({cart.itemCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")})</span>
          </Link>
        </div>
      )}

      <ProductOptionsSheet
        product={sheetProduct}
        onClose={() => setSheetProduct(null)}
        onAdded={() => {
           setCartFeedback(t("تمت الإضافة للسلة", "Added to cart"));
          window.setTimeout(() => setCartFeedback(""), 3000);
        }}
      />
    </MobileShell>
  );
}
