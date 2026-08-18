import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Badge } from "@/components/tb/shell";
import { restaurants, products, EGP } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/favorites")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | المفضلة" },
      { name: "description", content: "مطاعمك ومنتجاتك المفضلة في مكان واحد" },
      { property: "og:title", content: "طلبات بيتك | المفضلة" },
      { property: "og:description", content: "مطاعمك ومنتجاتك المفضلة في مكان واحد" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppFavorites,
});

function AppFavorites() {
  const favRestaurants = restaurants.slice(0, 3);
  const favProducts = products.slice(0, 4);

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="المفضلة" back="/app/profile" />
      <div className="flex flex-col gap-lg p-md">
        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">المطاعم المفضلة</h2>
          <div className="tb-stagger flex flex-col gap-3">
            {favRestaurants.map((r) => (
              <Link key={r["id"]} to="/app/restaurant/$id" params={{ id: r["id"] }}>
                <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                  <img src={r["logo"]} alt={r["name"]} className="size-14 rounded-full object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-label-lg text-label-lg text-on-surface">{r["name"]}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      ⭐ {r["rating"]} · {r["distanceKm"]} كم
                    </p>
                  </div>
                  <Icon name="favorite" className="text-error" filled />
                </Card>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">المنتجات المفضلة</h2>
          <div className="tb-stagger grid grid-cols-2 gap-3">
            {favProducts.map((p) => (
              <Link key={p["id"]} to="/app/product/$id" params={{ id: p["id"] }}>
                <Card className="overflow-hidden transition hover:border-secondary">
                  <div className="relative">
                    <img src={p["image"]} alt={p["name"]} className="h-24 w-full object-cover" />
                    <span className="absolute left-1.5 top-1.5 flex size-7 items-center justify-center rounded-full bg-surface-container-lowest/90 text-error">
                      <Icon name="favorite" className="text-[14px]" filled />
                    </span>
                  </div>
                  <div className="p-2">
                    <p className="truncate font-label-lg text-label-lg text-on-surface">{p["name"]}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{EGP(p["price"])}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
