import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, SectionTitle } from "@/components/tb/shell";
import { categories, restaurants, products } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/search")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | البحث" },
      { name: "description", content: "دور على مطاعم وأكلات ومنتجات في طلبات بيتك" },
      { property: "og:title", content: "طلبات بيتك | البحث" },
      { property: "og:description", content: "دور على مطاعم وأكلات ومنتجات في طلبات بيتك" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppSearch,
});

const recent = ["برجر", "بيتزا روما", "كشري", "حلويات"];

function AppSearch() {
  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="البحث" back="/app" />
      <div className="flex flex-col gap-lg p-md">
        <div className="flex items-center gap-2 rounded-button border border-secondary bg-surface-container-lowest px-3 py-3">
          <Icon name="search" className="text-on-surface-variant" />
          <input
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
            placeholder="دور على مطعم، أكلة أو فئة..."
            defaultValue="برجر"
          />
        </div>

        <section>
          <SectionTitle title="عمليات بحث سابقة" icon="history" />
          <div className="flex flex-wrap gap-2">
            {recent.map((r) => (
              <span
                key={r}
                className="rounded-full bg-surface-container-low px-3 py-1.5 font-label-md text-label-md text-on-surface-variant"
              >
                {r}
              </span>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="فئات" icon="category" />
          <div className="tb-stagger flex flex-col gap-2">
            {categories.slice(0, 2).map((c) => (
              <Link
                key={c["id"]}
                to="/app/category/$id"
                params={{ id: c["id"] }}
                className="flex items-center gap-3 rounded-button bg-surface-container-low p-3 transition hover:bg-surface-container"
              >
                <Icon name={c["icon"]} className="text-on-surface-variant" />
                <span className="font-body-md text-body-md text-on-surface">{c["name"]}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="مطاعم" icon="storefront" />
          <div className="tb-stagger flex flex-col gap-2">
            {restaurants
              .filter((r) => r["name"].includes("برجر"))
              .map((r) => (
                <Link key={r["id"]} to="/app/restaurant/$id" params={{ id: r["id"] }}>
                  <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                    <img src={r["logo"]} alt={r["name"]} className="size-12 rounded-full object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{r["name"]}</p>
                      <p className="truncate font-label-md text-label-md text-on-surface-variant">{r["description"]}</p>
                    </div>
                    <Icon name="chevron_left" className="text-on-surface-variant" />
                  </Card>
                </Link>
              ))}
          </div>
        </section>

        <section>
          <SectionTitle title="منتجات" icon="fastfood" />
          <div className="tb-stagger flex flex-col gap-2">
            {products
              .filter((p) => p["name"].includes("برجر"))
              .map((p) => (
                <Link key={p["id"]} to="/app/product/$id" params={{ id: p["id"] }}>
                  <Card className="flex items-center gap-3 p-3 transition hover:border-secondary">
                    <img src={p["image"]} alt={p["name"]} className="size-12 rounded-card object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{p["name"]}</p>
                      <p className="truncate font-label-md text-label-md text-on-surface-variant">{p["description"]}</p>
                    </div>
                    <Icon name="chevron_left" className="text-on-surface-variant" />
                  </Card>
                </Link>
              ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
