import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, SectionTitle, EmptyState } from "@/components/tb/shell";
import { categories, restaurants, products, EGP } from "@/lib/tb/data";
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

function AppCategoryId() {
  const { id } = Route.useParams();
  const category = categories.find((c) => c["id"] === id);
  const catRestaurants = restaurants.filter((r) => r["categories"].includes(id));
  const catProducts = products.filter((p) => p["category"] === id);

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title={category?.["name"] ?? "الفئة"} back="/app" />
      <div className="flex flex-col gap-lg p-md">
        <Card className="flex items-center gap-3 bg-tertiary-container p-md text-on-tertiary-container">
          <span className="flex size-12 items-center justify-center rounded-full bg-surface-container-lowest/40">
            <Icon name={category?.["icon"] ?? "category"} className="text-[24px]" />
          </span>
          <div>
            <p className="font-headline-md text-headline-md">{category?.["name"]}</p>
            <p className="font-label-md text-label-md opacity-80">{catRestaurants.length} مطعم · {catProducts.length} منتج</p>
          </div>
        </Card>

        <section>
          <SectionTitle title="مطاعم" icon="storefront" />
          {catRestaurants.length ? (
            <div className="tb-stagger flex flex-col gap-3">
              {catRestaurants.map((r) => (
                <Link key={r["id"]} to="/app/restaurant/$id" params={{ id: r["id"] }}>
                  <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                    <img src={r["logo"]} alt={r["name"]} className="size-14 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{r["name"]}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">
                        {r["distanceKm"]} كم · {r["etaMin"]} د · ⭐ {r["rating"]}
                      </p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon="storefront" title="مفيش مطاعم" body="مفيش مطاعم في الفئة دي حالياً" />
          )}
        </section>

        <section>
          <SectionTitle title="منتجات" icon="fastfood" />
          {catProducts.length ? (
            <div className="tb-stagger grid grid-cols-2 gap-3">
              {catProducts.map((p) => (
                <Link key={p["id"]} to="/app/product/$id" params={{ id: p["id"] }}>
                  <Card className="overflow-hidden transition hover:border-secondary">
                    <img src={p["image"]} alt={p["name"]} className="h-24 w-full object-cover" />
                    <div className="p-2">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{p["name"]}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">{EGP(p["price"])}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          ) : (
            <EmptyState icon="fastfood" title="مفيش منتجات" body="مفيش منتجات في الفئة دي حالياً" />
          )}
        </section>
      </div>
    </MobileShell>
  );
}
