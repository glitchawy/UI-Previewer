import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, SectionTitle, EmptyState, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/category/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تصفح الفئة" },
      { name: "description", content: "تصفح مطاعم ومنتجات الفئة المختارة" },
      { property: "og:title", content: "طلبات بيتك | تصفح الفئة" },
      { property: "og:description", content: "تصفح مطاعم ومنتجات الفئة المختارة" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppCategoryId,
});

type Restaurant = {
  id: number;
  name: string;
  category: string | null;
  logoUrl: string | null;
  distanceKm: number | null;
};

type MenuCategory = { id: number; name: string; isActive: boolean };
type Product = {
  id: number;
  categoryId: number | null;
  name: string;
  imageUrl: string | null;
  basePrice: string;
  isAvailable: boolean;
};
type Menu = {
  restaurant: Restaurant;
  categories: MenuCategory[];
  products: Product[];
};
type CategoryData = {
  name: string;
  restaurants: Restaurant[];
  products: Product[];
};

const EGP = (value: string) =>
  `${Number(value).toLocaleString("ar-EG", { minimumFractionDigits: 0 })} ج.م`;

function AppCategoryId() {
  const { id } = Route.useParams();
  const [data, setData] = useState<CategoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function loadCategory() {
      setLoading(true);
      setError("");
      setData(null);
      try {
        const restaurantsResponse = await fetch("/api/restaurants", { signal: controller.signal });
        if (!restaurantsResponse.ok) throw new Error("تعذر تحميل المطاعم حالياً");
        const restaurants = (await restaurantsResponse.json()) as Restaurant[];
        if (!Array.isArray(restaurants)) throw new Error("تعذر قراءة بيانات المطاعم");

        const menuResults = await Promise.allSettled(
          restaurants.map(async (restaurant) => {
            const response = await fetch(`/api/restaurants/${restaurant.id}/menu`, { signal: controller.signal });
            if (!response.ok) throw new Error("تعذر تحميل قائمة المطعم");
            return (await response.json()) as Menu;
          }),
        );
        if (controller.signal.aborted) return;

        const menus = menuResults
          .filter((result): result is PromiseFulfilledResult<Menu> => result.status === "fulfilled")
          .map((result) => result.value);
        if (restaurants.length > 0 && menus.length === 0) throw new Error("تعذر تحميل قوائم المطاعم حالياً");

        const decodedId = decodeURIComponent(id);
        const numericId = Number(id);
        const matchingMenus = menus.flatMap((menu) => {
          const matchingCategories = menu.categories.filter(
            (category) =>
              category.isActive &&
              ((!Number.isNaN(numericId) && category.id === numericId) || category.name === decodedId),
          );
          const restaurantCategoryMatches = menu.restaurant.category === decodedId;
          if (matchingCategories.length === 0 && !restaurantCategoryMatches) return [];
          const categoryIds = new Set(matchingCategories.map((category) => category.id));
          return [{
            menu,
            name: matchingCategories[0]?.name ?? menu.restaurant.category ?? decodedId,
            products: menu.products.filter(
              (product) =>
                product.isAvailable &&
                (categoryIds.has(product.categoryId ?? -1) || (restaurantCategoryMatches && matchingCategories.length === 0)),
            ),
          }];
        });

        setData({
          name: matchingMenus[0]?.name ?? decodedId,
          restaurants: matchingMenus.map(({ menu }) => menu.restaurant),
          products: matchingMenus.flatMap(({ products }) => products),
        });
      } catch (cause) {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause.message : "حدث خطأ أثناء تحميل الفئة");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    void loadCategory();
    return () => controller.abort();
  }, [id]);

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title={data?.name ?? "الفئة"} back="/app" />
      <div className="flex flex-col gap-lg p-md">
        {loading ? (
          <Card className="flex min-h-40 items-center justify-center p-md">
            <Icon name="progress_activity" className="animate-spin text-[36px] text-primary" />
            <span className="mr-3 font-body-md text-body-md text-on-surface-variant">جاري تحميل الفئة...</span>
          </Card>
        ) : error ? (
          <Card className="flex flex-col items-center gap-3 p-xl text-center">
            <Icon name="error" className="text-[48px] text-error" />
            <p className="font-headline-md text-headline-md text-on-surface">تعذر تحميل الفئة</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
            <Button onClick={() => window.location.reload()}>حاول مرة أخرى</Button>
          </Card>
        ) : !data || data.restaurants.length === 0 ? (
          <EmptyState icon="category" title="الفئة غير موجودة" body="لا توجد مطاعم أو قوائم نشطة في الفئة دي حالياً" />
        ) : (
          <>
            <Card className="flex items-center gap-3 bg-tertiary-container p-md text-on-tertiary-container">
              <span className="flex size-12 items-center justify-center rounded-full bg-surface-container-lowest/40">
                <Icon name="category" className="text-[24px]" />
              </span>
              <div>
                <p className="font-headline-md text-headline-md">{data.name}</p>
                <p className="font-label-md text-label-md opacity-80">
                  {data.restaurants.length.toLocaleString("ar-EG")} مطعم · {data.products.length.toLocaleString("ar-EG")} منتج
                </p>
              </div>
            </Card>

            <section>
              <SectionTitle title="مطاعم" icon="storefront" />
              <div className="tb-stagger flex flex-col gap-3">
                {data.restaurants.map((restaurant) => (
                  <Link key={restaurant.id} to="/app/restaurant/$id" params={{ id: String(restaurant.id) }}>
                    <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                      {restaurant.logoUrl ? (
                        <img src={`/api/storage${restaurant.logoUrl}`} alt={restaurant.name} className="size-14 rounded-full object-cover" />
                      ) : (
                        <span className="flex size-14 items-center justify-center rounded-full bg-surface-container">
                          <Icon name="storefront" className="text-outline" />
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-label-lg text-label-lg text-on-surface">{restaurant.name}</p>
                        {restaurant.distanceKm != null && (
                          <p className="font-label-md text-label-md text-on-surface-variant">
                            {restaurant.distanceKm.toLocaleString("ar-EG")} كم
                          </p>
                        )}
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <SectionTitle title="منتجات" icon="fastfood" />
              {data.products.length ? (
                <div className="tb-stagger grid grid-cols-2 gap-3">
                  {data.products.map((product) => (
                    <Link key={product.id} to="/app/product/$id" params={{ id: String(product.id) }}>
                      <Card className="overflow-hidden transition hover:border-secondary">
                        {product.imageUrl ? (
                          <img src={`/api/storage${product.imageUrl}`} alt={product.name} className="h-24 w-full object-cover" />
                        ) : (
                          <div className="flex h-24 items-center justify-center bg-surface-container">
                            <Icon name="fastfood" className="text-[28px] text-outline" />
                          </div>
                        )}
                        <div className="p-2">
                          <p className="truncate font-label-lg text-label-lg text-on-surface">{product.name}</p>
                          <p className="font-label-md text-label-md text-on-surface-variant">{EGP(product.basePrice)}</p>
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <EmptyState icon="fastfood" title="مفيش منتجات" body="مفيش منتجات متاحة في الفئة دي حالياً" />
              )}
            </section>
          </>
        )}
      </div>
    </MobileShell>
  );
}