import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Badge, Button } from "@/components/tb/shell";
import { productOf, EGP } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/product/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تفاصيل المنتج" },
      { name: "description", content: "اختار الحجم والإضافات وأضف المنتج للسلة" },
      { property: "og:title", content: "طلبات بيتك | تفاصيل المنتج" },
      { property: "og:description", content: "اختار الحجم والإضافات وأضف المنتج للسلة" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppProductId,
});

function AppProductId() {
  const { id } = Route.useParams();
  const product = productOf(id);

  if (!product) {
    return (
      <MobileShell tabs={customerTabs}>
        <AppBar title="المنتج" back="/app" />
      </MobileShell>
    );
  }

  return (
    <MobileShell tabs={customerTabs}>
      <div className="relative">
        <Link
          to="/app/restaurant/$id"
          params={{ id: product["restaurantId"] }}
          className="absolute right-0 top-0 z-20 m-md flex size-9 items-center justify-center rounded-full bg-surface-container-lowest/90 text-on-surface"
        >
          <Icon name="arrow_forward" />
        </Link>
        <img src={product["image"]} alt={product["name"]} className="h-56 w-full object-cover" />
      </div>

      <div className="flex flex-col gap-lg p-md">
        <div>
          <div className="flex items-center justify-between gap-sm">
            <h1 className="font-headline-lg text-headline-lg text-on-surface">{product["name"]}</h1>
            <Badge tone="warn">
              <Icon name="star" className="text-[14px]" filled />
              {product["rating"]}
            </Badge>
          </div>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{product["description"]}</p>
        </div>

        {product["variations"].length ? (
          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">الحجم</h2>
            <div className="flex flex-col gap-2">
              {product["variations"].map((v, i) => (
                <label
                  key={v["id"]}
                  className="flex cursor-pointer items-center justify-between rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container"
                >
                  <span className="flex items-center gap-2">
                    <input type="radio" name="variation" defaultChecked={i === 0} className="accent-secondary" />
                    <span className="font-body-md text-body-md text-on-surface">{v["name"]}</span>
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    {v["price"] > 0 ? `+${EGP(v["price"])}` : v["price"] < 0 ? `-${EGP(Math.abs(v["price"]))}` : "مجاناً"}
                  </span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        {product["addons"].length ? (
          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">إضافات</h2>
            <div className="flex flex-col gap-2">
              {product["addons"].map((a) => (
                <label
                  key={a["id"]}
                  className="flex cursor-pointer items-center justify-between rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container"
                >
                  <span className="flex items-center gap-2">
                    <input type="checkbox" className="accent-secondary" />
                    <span className="font-body-md text-body-md text-on-surface">{a["name"]}</span>
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant">+{EGP(a["price"])}</span>
                </label>
              ))}
            </div>
          </section>
        ) : null}

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">ملاحظات</h2>
          <textarea
            rows={2}
            placeholder="اكتب أي ملاحظة على الطلب..."
            className="w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:border-secondary"
          />
        </section>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface transition active:scale-95"
          >
            <Icon name="remove" />
          </button>
          <span className="w-8 text-center font-headline-md text-headline-md text-on-surface">1</span>
          <button
            type="button"
            className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container transition active:scale-95"
          >
            <Icon name="add" />
          </button>
        </div>
      </div>

      <div className="sticky bottom-0 z-20 border-t border-outline-variant bg-surface-container-lowest/95 p-md backdrop-blur">
        <Link to="/app/cart">
          <Button className="w-full justify-between" icon="shopping_cart">
            <span>أضف للسلة</span>
            <span>{EGP(product["price"])}</span>
          </Button>
        </Link>
      </div>
    </MobileShell>
  );
}
