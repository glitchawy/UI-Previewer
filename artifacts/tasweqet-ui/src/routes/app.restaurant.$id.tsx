import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MobileShell, Icon, Badge, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/restaurant/$id")({
  head: () => ({
    meta: [{ title: "طلبات بيتك | صفحة المطعم" }],
  }),
  component: AppRestaurantId,
});

const EGP = (n: string | number) => `${Number(n).toLocaleString("ar-EG", { minimumFractionDigits: 0 })} ج.م`;

type Variant = { id: number; name: string; priceDelta: string; isDefault: boolean };
type Addon = { id: number; name: string; price: string; isAvailable: boolean };
type Product = { id: number; categoryId: number | null; name: string; description: string | null; imageUrl: string | null; basePrice: string; isAvailable: boolean; variants: Variant[]; addons: Addon[] };
type Category = { id: number; name: string; isActive: boolean };
type Restaurant = { id: number; name: string; description: string | null; address: string; category: string | null; deliveryType: string; logoUrl: string | null; coverUrl: string | null; hours: string | null };
type MenuData = { restaurant: Restaurant; categories: Category[]; products: Product[] };

// ── Cart state (session-scoped, shared via module-level singleton) ─────────────
// Full cart state lives in app.cart.tsx; here we only track a local session copy
type CartLine = { productId: number; name: string; variantId: number | null; variantName: string | null; addonIds: number[]; addonNames: string[]; basePrice: number; variantDelta: number; addonTotal: number; qty: number };

function getCart(): CartLine[] {
  try { return JSON.parse(sessionStorage.getItem("tb_cart") ?? "[]") as CartLine[]; }
  catch { return []; }
}
function saveCart(c: CartLine[]) { sessionStorage.setItem("tb_cart", JSON.stringify(c)); }
function cartCount() { return getCart().reduce((acc, l) => acc + l.qty, 0); }

function AppRestaurantId() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [count, setCount] = useState(cartCount());

  // Product sheet state
  const [sheetProduct, setSheetProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedAddons, setSelectedAddons] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/restaurants/${id}/menu`)
      .then((r) => { if (!r.ok) throw new Error("المطعم غير موجود أو غير نشط"); return r.json(); })
      .then((d: MenuData) => setMenu(d))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  function openSheet(p: Product) {
    setSheetProduct(p);
    const def = p.variants.find((v) => v.isDefault) ?? p.variants[0] ?? null;
    setSelectedVariant(def);
    setSelectedAddons([]);
  }

  function addToCart() {
    if (!sheetProduct) return;
    const p = sheetProduct;
    const addonObjs = p.addons.filter((a) => selectedAddons.includes(a.id));
    const addonTotal = addonObjs.reduce((s, a) => s + Number(a.price), 0);
    const line: CartLine = {
      productId: p.id,
      name: p.name,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      addonIds: addonObjs.map((a) => a.id),
      addonNames: addonObjs.map((a) => a.name),
      basePrice: Number(p.basePrice),
      variantDelta: selectedVariant ? Number(selectedVariant.priceDelta) : 0,
      addonTotal,
      qty: 1,
    };
    const cart = getCart();
    const existing = cart.findIndex(
      (l) => l.productId === p.id && l.variantId === line.variantId && JSON.stringify(l.addonIds.sort()) === JSON.stringify(line.addonIds.sort())
    );
    if (existing >= 0) cart[existing].qty += 1;
    else cart.push(line);
    saveCart(cart);
    setCount(cartCount());
    setSheetProduct(null);
  }

  const activeCats = menu?.categories.filter((c) => c.isActive) ?? [];
  const products = menu?.products.filter((p) => p.isAvailable) ?? [];
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
        <p className="font-body-md text-body-md text-on-surface-variant">{error || "المطعم غير موجود"}</p>
        <Button onClick={() => navigate({ to: "/app" })}>العودة للرئيسية</Button>
      </div>
    </MobileShell>
  );

  const r = menu.restaurant;

  return (
    <MobileShell tabs={customerTabs}>
      {/* Header image + back */}
      <div className="relative">
        <Link to="/app" className="absolute right-3 top-3 z-20 flex size-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface">
          <Icon name="arrow_forward" />
        </Link>
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
          {r.hours && <Badge tone="neutral"><Icon name="schedule" className="text-[14px]" />{r.hours}</Badge>}
          <Badge tone={r.deliveryType === "platform" ? "info" : "success"}>
            {r.deliveryType === "platform" ? "توصيل طلبات بيتك" : "توصيل المطعم"}
          </Badge>
        </div>
      </div>

      {/* Category tabs */}
      {activeCats.length > 0 && (
        <div className="sticky top-0 z-10 flex gap-2 overflow-x-auto border-b border-outline-variant bg-surface px-md py-2">
          <button type="button" onClick={() => setActiveCat(null)}
            className={`shrink-0 rounded-button px-3 py-1.5 font-label-md text-label-md transition ${activeCat === null ? "bg-primary text-on-primary" : "text-on-surface-variant hover:bg-surface-container"}`}>
            الكل
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
            <p className="font-body-md text-body-md text-on-surface-variant">لا توجد منتجات متاحة</p>
          </div>
        ) : (
          filtered.map((p) => (
            <button key={p.id} type="button" onClick={() => openSheet(p)}
              className="flex items-center gap-3 rounded-card border border-outline-variant bg-surface-container-lowest p-md text-right transition hover:border-secondary active:scale-[0.99]">
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
                  {p.variants.length > 0 && <Badge tone="info">أحجام متعددة</Badge>}
                </div>
              </div>
              <Icon name="add_circle" className="text-[28px] text-primary" />
            </button>
          ))
        )}
      </div>

      {/* Cart FAB */}
      {count > 0 && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center px-md">
          <Link to="/app/cart"
            className="flex items-center gap-2 rounded-button bg-primary px-6 py-3 text-on-primary shadow-lg transition hover:opacity-90">
            <Icon name="shopping_cart" />
            <span className="font-label-lg text-label-lg">السلة ({count})</span>
          </Link>
        </div>
      )}

      {/* Product bottom sheet */}
      {sheetProduct && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setSheetProduct(null)}>
          <div className="absolute inset-0 bg-scrim/40" />
          <div className="relative w-full rounded-t-[24px] bg-surface p-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Product details */}
            <div className="mb-md flex items-start gap-3">
              {sheetProduct.imageUrl ? (
                <img src={`/api/storage${sheetProduct.imageUrl}`} alt={sheetProduct.name} className="size-20 rounded-button object-cover" />
              ) : (
                <div className="flex size-20 items-center justify-center rounded-button bg-surface-container">
                  <Icon name="fastfood" className="text-[32px] text-outline" />
                </div>
              )}
              <div className="flex-1">
                <h2 className="font-headline-md text-headline-md text-on-surface">{sheetProduct.name}</h2>
                {sheetProduct.description && <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{sheetProduct.description}</p>}
                <p className="mt-2 font-headline-md text-headline-md text-primary">{EGP(sheetProduct.basePrice)}</p>
              </div>
            </div>

            {/* Variants */}
            {sheetProduct.variants.length > 0 && (
              <div className="mb-md">
                <p className="mb-2 font-label-lg text-label-lg text-on-surface">الحجم</p>
                <div className="flex flex-wrap gap-2">
                  {sheetProduct.variants.map((v) => (
                    <button key={v.id} type="button" onClick={() => setSelectedVariant(v)}
                      className={`rounded-button border px-3 py-1.5 font-label-md text-label-md transition ${selectedVariant?.id === v.id ? "border-primary bg-primary-container text-on-primary-container" : "border-outline-variant text-on-surface"}`}>
                      {v.name}{Number(v.priceDelta) !== 0 ? ` (+${EGP(v.priceDelta)})` : ""}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            {sheetProduct.addons.filter((a) => a.isAvailable).length > 0 && (
              <div className="mb-md">
                <p className="mb-2 font-label-lg text-label-lg text-on-surface">إضافات</p>
                <div className="flex flex-col gap-2">
                  {sheetProduct.addons.filter((a) => a.isAvailable).map((a) => (
                    <label key={a.id} className="flex cursor-pointer items-center justify-between gap-2 rounded-button border border-outline-variant p-3">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedAddons.includes(a.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedAddons((prev) => [...prev, a.id]);
                            else setSelectedAddons((prev) => prev.filter((id) => id !== a.id));
                          }}
                          className="size-4 accent-primary" />
                        <span className="font-label-md text-label-md text-on-surface">{a.name}</span>
                      </div>
                      {Number(a.price) > 0 && <span className="font-label-md text-label-md text-secondary">+{EGP(a.price)}</span>}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Total + Add button */}
            {(() => {
              const base = Number(sheetProduct.basePrice);
              const vDelta = selectedVariant ? Number(selectedVariant.priceDelta) : 0;
              const addonTotal = sheetProduct.addons.filter((a) => selectedAddons.includes(a.id)).reduce((s, a) => s + Number(a.price), 0);
              const total = base + vDelta + addonTotal;
              return (
                <Button className="w-full" icon="add_shopping_cart" onClick={addToCart}>
                  أضف للسلة — {EGP(total)}
                </Button>
              );
            })()}
          </div>
        </div>
      )}
    </MobileShell>
  );
}
