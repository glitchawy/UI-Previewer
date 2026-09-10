import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Badge, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { FavButton } from "@/lib/tb/favorites";
import { ProductOptionsSheet } from "@/components/tb/product-options-sheet";

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
  acceptingOrders: boolean; acceptanceReason: string; nextOpeningSummary: string | null;
  variants: Variant[]; addons: Addon[];
  restaurant: { id: number; name: string; logoUrl: string | null; deliveryType: string };
};

function AppProductId() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cartSheetOpen, setCartSheetOpen] = useState(false);
  const [cartFeedback, setCartFeedback] = useState("");

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((r) => { if (!r.ok) throw new Error("المنتج غير موجود"); return r.json(); })
      .then((p: ProductDetail) => setProduct(p))
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
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => (
                <div key={v.id}
                  className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="font-body-md text-body-md text-on-surface">{v.name}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {Number(v.priceDelta) > 0 ? `+${EGP(v.priceDelta)}` : "مجاناً"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {product.addons.length > 0 && (
          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">إضافات</h2>
            <div className="flex flex-wrap gap-2">
              {product.addons.filter((a) => a.isAvailable).map((a) => (
                <div key={a.id}
                  className="flex items-center gap-2 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-2">
                  <span className="font-body-md text-body-md text-on-surface">{a.name}</span>
                  {Number(a.price) > 0 && (
                    <span className="font-label-md text-label-md text-on-surface-variant">+{EGP(a.price)}</span>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

      </div>

      <div className="sticky bottom-0 z-20 border-t border-outline-variant bg-surface-container-lowest/95 p-md backdrop-blur">
        {cartFeedback && <p className="mb-2 text-center font-label-md text-success" role="status">{cartFeedback}</p>}
        {!product.acceptingOrders && (
          <p className="mb-2 rounded-button bg-error-container p-3 text-center font-label-md text-error" role="alert">
            {product.acceptanceReason}{product.nextOpeningSummary ? ` — ${product.nextOpeningSummary}` : ""}
          </p>
        )}
        <Button className="w-full justify-between" icon="add_shopping_cart"
          disabled={!product.acceptingOrders} onClick={() => setCartSheetOpen(true)}>
          <span>{product.acceptingOrders ? "اختار وأضف للسلة" : "غير متاح للطلب حالياً"}</span><span>من {EGP(product.basePrice)}</span>
        </Button>
      </div>
      <ProductOptionsSheet
        product={cartSheetOpen ? product : null}
        onClose={() => setCartSheetOpen(false)}
        onAdded={() => {
          setCartFeedback("تمت الإضافة للسلة");
          window.setTimeout(() => setCartFeedback(""), 3000);
        }}
      />
    </MobileShell>
  );
}
