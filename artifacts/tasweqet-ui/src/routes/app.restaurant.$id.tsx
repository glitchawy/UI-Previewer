import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Badge, Button } from "@/components/tb/shell";
import { restaurantOf, productsOf, categories, reviews, EGP, cartTotals } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/restaurant/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | صفحة المطعم" },
      { name: "description", content: "تصفح قائمة الطعام وأضف طلبك من المطعم" },
      { property: "og:title", content: "طلبات بيتك | صفحة المطعم" },
      { property: "og:description", content: "تصفح قائمة الطعام وأضف طلبك من المطعم" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppRestaurantId,
});

function AppRestaurantId() {
  const { id } = Route.useParams();
  const restaurant = restaurantOf(id);
  const products = productsOf(id);
  const totals = cartTotals();
  const restReviews = reviews.filter((r) => r["target"] === restaurant?.["name"]);

  if (!restaurant) {
    return (
      <MobileShell tabs={customerTabs}>
        <AppBar title="المطعم" back="/app" />
      </MobileShell>
    );
  }

  return (
    <MobileShell tabs={customerTabs}>
      <div className="relative">
        <div className="absolute right-0 top-0 z-20 p-md">
          <Link
            to="/app"
            className="flex size-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface"
          >
            <Icon name="arrow_forward" />
          </Link>
        </div>
        <button
          type="button"
          aria-label="مفضلة"
          className="absolute left-0 top-0 z-20 m-md flex size-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-error"
        >
          <Icon name="favorite" filled />
        </button>
        <img src={restaurant["cover"]} alt={restaurant["name"]} className="h-44 w-full object-cover" />
      </div>

      <div className="flex flex-col gap-lg p-md">
        <div className="-mt-12 flex items-end gap-3">
          <img
            src={restaurant["logo"]}
            alt={restaurant["name"]}
            className="size-20 rounded-full border-4 border-surface object-cover"
          />
          <div className="min-w-0 flex-1 pb-1">
            <h1 className="truncate font-headline-lg text-headline-lg text-on-surface">{restaurant["name"]}</h1>
            <p className="truncate font-body-md text-body-md text-on-surface-variant">{restaurant["description"]}</p>
          </div>
        </div>

        {restaurant["offer"] ? (
          <Card className="flex items-center gap-2 bg-primary-container p-3 text-on-primary-container">
            <Icon name="local_offer" />
            <span className="font-label-lg text-label-lg">{restaurant["offer"]}</span>
          </Card>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warn">
            <Icon name="star" className="text-[14px]" filled />
            {restaurant["rating"]} ({restaurant["reviews"]})
          </Badge>
          <Badge tone="neutral">
            <Icon name="near_me" className="text-[14px]" />
            {restaurant["distanceKm"]} كم
          </Badge>
          <Badge tone="neutral">
            <Icon name="schedule" className="text-[14px]" />
            {restaurant["etaMin"]} د
          </Badge>
          <Badge tone={restaurant["deliveryProvider"] === "TALABAT_BETAK" ? "info" : "success"}>
            {restaurant["deliveryProvider"] === "TALABAT_BETAK" ? "توصيل طلبات بيتك" : "توصيل المطعم"} · {EGP(restaurant["deliveryFee"])}
          </Badge>
          {restaurant["open"] === false ? <Badge tone="danger">مغلق</Badge> : null}
        </div>

        <Card className="flex items-center gap-2 p-3">
          <Icon name="schedule" className="text-on-surface-variant" />
          <span className="font-label-md text-label-md text-on-surface-variant">مواعيد العمل: {restaurant["hours"]}</span>
        </Card>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {restaurant["categories"].map((cid) => {
            const c = categories.find((cc) => cc["id"] === cid);
            return (
              <span
                key={cid}
                className="shrink-0 rounded-full bg-surface-container-low px-3 py-1.5 font-label-md text-label-md text-on-surface"
              >
                {c?.["name"] ?? cid}
              </span>
            );
          })}
        </div>

        <section className="flex flex-col gap-3">
          {products.map((p) => (
            <Link
              key={p["id"]}
              to="/app/product/$id"
              params={{ id: p["id"] }}
              className={p["available"] ? "" : "pointer-events-none"}
            >
              <Card
                className={`flex items-center gap-3 p-3 transition hover:border-secondary ${
                  p["available"] ? "" : "opacity-50"
                }`}
              >
                <img src={p["image"]} alt={p["name"]} className="size-16 shrink-0 rounded-card object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-label-lg text-label-lg text-on-surface">{p["name"]}</p>
                  <p className="truncate font-label-md text-label-md text-on-surface-variant">{p["description"]}</p>
                  <p className="mt-1 font-label-lg text-label-lg text-on-surface">{EGP(p["price"])}</p>
                </div>
                {!p["available"] ? <Badge tone="danger">غير متاح</Badge> : <Icon name="add_circle" className="text-primary" />}
              </Card>
            </Link>
          ))}
        </section>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">التقييمات</h2>
          <div className="flex flex-col gap-2">
            {restReviews.length ? (
              restReviews.map((r) => (
                <Card key={r["id"]} className="p-3">
                  <div className="flex items-center justify-between">
                    <p className="font-label-lg text-label-lg text-on-surface">{r["customer"]}</p>
                    <span className="flex items-center gap-0.5 font-label-md text-label-md text-primary">
                      <Icon name="star" className="text-[14px]" filled />
                      {r["rating"]}
                    </span>
                  </div>
                  <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{r["text"]}</p>
                </Card>
              ))
            ) : (
              <p className="font-body-md text-body-md text-on-surface-variant">لا توجد تقييمات بعد</p>
            )}
          </div>
        </section>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-outline-variant bg-surface-container-lowest/95 p-md backdrop-blur">
        <Link to="/app/cart">
          <Button className="w-full justify-between" icon="shopping_cart">
            <span>عرض السلة</span>
            <span>{EGP(totals.total)}</span>
          </Button>
        </Link>
      </div>
    </MobileShell>
  );
}
