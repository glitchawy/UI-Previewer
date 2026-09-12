import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";
import { FavButton, useFavoriteIds } from "@/lib/tb/favorites";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/favorites")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | المفضلة", "Talabat Betak | Favorites") },
      { name: "description", content: translate("مطاعمك ومنتجاتك المفضلة في مكان واحد", "Your favorite restaurants and products in one place") },
    ],
  }),
  component: AppFavorites,
});

const EGP = (n: string | number) => `${Number(n).toLocaleString(translate("ar-EG", "en-EG"), { minimumFractionDigits: 0 })} ${translate("ج.م", "EGP")}`;

type FavRestaurant = { id: number; name: string; description: string | null; category: string | null; logoUrl: string | null; coverUrl: string | null; deliveryType: string };
type FavProduct = { id: number; name: string; description: string | null; imageUrl: string | null; basePrice: string; restaurantId: number; isAvailable: boolean };
type FavData = { restaurants: FavRestaurant[]; products: FavProduct[] };

function AppFavorites() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<FavData>({ restaurants: [], products: [] });
  const [loading, setLoading] = useState(true);
  const { isFav } = useFavoriteIds();

  useEffect(() => {
    const token = getToken();
    if (!token) { setLoading(false); return; }
    const controller = new AbortController();
    setLoading(true);
    fetch("/api/customer/favorites", { headers: { Authorization: `Bearer ${token}` }, signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d: FavData) => setData({ restaurants: d.restaurants, products: d.products }))
      .catch(() => {})
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [locale]);

  // Hide items un-hearted since load so removal is reflected immediately
  const shownRestaurants = data.restaurants.filter((r) => isFav("restaurant", r.id));
  const shownProducts = data.products.filter((p) => isFav("product", p.id));
  const empty = shownRestaurants.length === 0 && shownProducts.length === 0;

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("المفضلة", "Favorites")} back="/app/profile" />
      <div className="flex flex-col gap-lg p-md">
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" />
          </div>
        ) : empty ? (
          <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-outline-variant py-xl text-center">
            <Icon name="favorite" className="text-[48px] text-outline" />
            <p className="font-body-md text-body-md text-on-surface-variant">
               {t("لسه مفيش مفضلات — دوس على القلب ❤️ على أي مطعم أو منتج", "No favorites yet — tap the heart ❤️ on any restaurant or product")}
            </p>
             <Link to="/app" className="font-label-lg text-label-lg text-secondary">{t("تصفح المطاعم", "Browse restaurants")}</Link>
          </div>
        ) : (
          <>
            {shownRestaurants.length > 0 && (
              <section>
                 <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">{t("المطاعم المفضلة", "Favorite restaurants")}</h2>
                <div className="tb-stagger flex flex-col gap-3">
                  {shownRestaurants.map((r) => (
                    <Link key={r.id} to="/app/restaurant/$id" params={{ id: String(r.id) }}>
                      <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                        {r.logoUrl ? (
                          <img src={`/api/storage${r.logoUrl}`} alt={r.name} className="size-14 rounded-full object-cover" />
                        ) : (
                          <span className="flex size-14 items-center justify-center rounded-full bg-surface-container">
                            <Icon name="storefront" className="text-outline" />
                          </span>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-label-lg text-label-lg text-on-surface">{r.name}</p>
                          {r.category && <p className="font-label-md text-label-md text-on-surface-variant">{r.category}</p>}
                        </div>
                        <FavButton targetType="restaurant" targetId={r.id} />
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {shownProducts.length > 0 && (
              <section>
                 <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">{t("المنتجات المفضلة", "Favorite products")}</h2>
                <div className="tb-stagger grid grid-cols-2 gap-3">
                  {shownProducts.map((p) => (
                    <Link key={p.id} to="/app/product/$id" params={{ id: String(p.id) }}>
                      <Card className="overflow-hidden transition hover:border-secondary">
                        <div className="relative">
                          {p.imageUrl ? (
                            <img src={`/api/storage${p.imageUrl}`} alt={p.name} className="h-24 w-full object-cover" />
                          ) : (
                            <div className="flex h-24 items-center justify-center bg-surface-container">
                              <Icon name="fastfood" className="text-[28px] text-outline" />
                            </div>
                          )}
                          <FavButton targetType="product" targetId={p.id} className="absolute left-1.5 top-1.5 size-7" />
                        </div>
                        <div className="p-2">
                          <p className="truncate font-label-lg text-label-lg text-on-surface">{p.name}</p>
                          <p className="font-label-md text-label-md text-on-surface-variant">{EGP(p.basePrice)}</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </MobileShell>
  );
}
