import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Badge, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { FavButton } from "@/lib/tb/favorites";

export const Route = createFileRoute("/app/product/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تفاصيل المنتج" },
      { name: "description", content: "اختار الحجم والإضافات وأضف المنتج للسلة" },
    ],
  }),
  component: AppProductId,
});

const EGP = (n: string | number) => `${Number(n).toLocaleString("ar-EG", { minimumFractionDigits: 0 })} ج.م`;

type Variant = { id: number; name: string; priceDelta: string; isDefault: boolean };
type Addon = { id: number; name: string; price: string; isAvailable: boolean };
type ProductDetail = {
  id: number; restaurantId: number; name: string; description: string | null;
  imageUrl: string | null; basePrice: string; isAvailable: boolean;
  variants: Variant[]; addons: Addon[];
  restaurant: { id: number; name: string; logoUrl: string | null; deliveryType: string };
};

function AppProductId() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [variantId, setVariantId] = useState<number | null>(null);
  const [addonIds, setAddonIds] = useState<number[]>([]);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => { if (!r.ok) throw new Error("المنتج غير موجود"); return r.json(); })
      .then((p: ProductDetail) => {
        setProduct(p);
        const def = p.variants.find((v) => v.isDefault) ?? p.variants[0];
        setVariantId(def?.id ?? null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <MobileShell tabs={customerTabs}>
      <div className="flex h-screen items-center justify-center">
        <Icon name="hourglass_empty" className="animate-spin text-[40px] text-on-surface-variant" />
      </div>
    </MobileShell>
  );

  if (error || !product) return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="المنتج" back="/app" />
      <div className="flex flex-col items-center gap-md p-xl text-center">
        <Icon name="error" className="text-[48px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error || "المنتج غير موجود"}</p>
        <Button onClick={() => navigate({ to: "/app" })}>العودة للرئيسية</Button>
      </div>
    </MobileShell>
  );

  const selectedVariant = product.variants.find((v) => v.id === variantId) ?? null;
  const addonObjs = product.addons.filter((a) => addonIds.includes(a.id));
  const unitTotal =
    Number(product.basePrice) +
    (selectedVariant ? Number(selectedVariant.priceDelta) : 0) +
    addonObjs.reduce((s, a) => s + Number(a.price), 0);

  return (
    <MobileShell tabs={customerTabs}>
      <div className="relative">
        <Link
          to="/app/restaurant/$id"
          params={{ id: String(product.restaurantId) }}
          className="absolute right-0 top-0 z-20 m-md flex size-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface"
        >
          <Icon name="arrow_forward" />
        </Link>
        <FavButton targetType="product" targetId={product.id} className="absolute left-0 top-0 z-20 m-md size-9" />
        {product.imageUrl ? (
          <img src={`/api/storage${product.imageUrl}`} alt={product.name} className="h-56 w-full object-cover" />
        ) : (
          <div className="flex h-56 items-center justify-center bg-surface-container">
            <Icon name="fastfood" className="text-[64px] text-outline" />
          </div>
        )}
      </div>

      <div className="flex flex-col gap-lg p-md pb-28">
        <div>
          <div className="flex items-center justify-between gap-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{product.name}</h1>
            <span className="font-headline-md text-headline-md text-primary">{EGP(product.basePrice)}</span>
          </div>
          {product.description && (
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{product.description}</p>
          )}
          <Link to="/app/restaurant/$id" params={{ id: String(product.restaurantId) }}
            className="mt-2 inline-flex items-center gap-2">
            {product.restaurant.logoUrl && (
              <img src={`/api/storage${product.restaurant.logoUrl}`} alt="" className="size-6 rounded-full object-cover" />
            )}
            <Badge tone="neutral"><Icon name="storefront" className="text-[14px]" />{product.restaurant.name}</Badge>
          </Link>
        </div>

        {product.variants.length > 0 && (
          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">الحجم</h2>
            <div className="flex flex-col gap-2">
              {product.variants.map((v) => (
                <label key={v.id}
                  className="flex cursor-pointer items-center justify-between rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container">
                  <span className="flex items-center gap-2">
                    <input type="radio" name="variant" checked={variantId === v.id}
                      onChange={() => setVariantId(v.id)} className="accent-secondary" />
                    <span className="font-body-md text-body-md text-on-surface">{v.name}</span>
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {Number(v.priceDelta) > 0 ? `+${EGP(v.priceDelta)}` : "مجاناً"}
                  </span>
                </label>
              ))}
            </div>
          </section>
        )}

        {product.addons.length > 0 && (
          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">إضافات</h2>
            <div className="flex flex-col gap-2">
              {product.addons.map((a) => (
                <label key={a.id}
                  className="flex cursor-pointer items-center justify-between rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container">
                  <span className="flex items-center gap-2">
                    <input type="checkbox" checked={addonIds.includes(a.id)}
                      onChange={(e) => setAddonIds((prev) => e.target.checked ? [...prev, a.id] : prev.filter((x) => x !== a.id))}
                      className="accent-secondary" />
                    <span className="font-body-md text-body-md text-on-surface">{a.name}</span>
                  </span>
                  {Number(a.price) > 0 && (
                    <span className="font-label-md text-label-md text-on-surface-variant">+{EGP(a.price)}</span>
                  )}
                </label>
              ))}
            </div>
          </section>
        )}

      </div>

      <div className="sticky bottom-0 z-20 border-t border-outline-variant bg-surface-container-lowest/95 p-md backdrop-blur">
        <Button className="w-full" icon="restaurant" onClick={() => navigate({
          to: "/app/restaurant/$id",
          params: { id: String(product.restaurantId) },
        })}>
          عرض قائمة {product.restaurant.name}
        </Button>
      </div>
    </MobileShell>
  );
}
