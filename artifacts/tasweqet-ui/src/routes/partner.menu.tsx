import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Button, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, products, categories } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/menu")({
  head: () => ({
    meta: [
      { title: "المنتجات — طلبات بيتك" },
      { name: "description", content: "إدارة قائمة منتجات مطعمك وأسعارها وتوفرها." },
      { property: "og:title", content: "المنتجات — طلبات بيتك" },
      { property: "og:description", content: "إدارة قائمة منتجات مطعمك وأسعارها وتوفرها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerMenu,
});

function PartnerMenu() {
  const list = products.filter((p) => p["restaurantId"] === "burger-house");
  const catName = (id: string) => categories.find((c) => c.id === id)?.name ?? id;
  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="صاحب مطعم — برجر هاوس"
      nav={partnerNav}
      title="المنتجات"
      actions={<Button icon="add">إضافة منتج</Button>}
    >
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          المنتجات مشتركة بين كل الفروع
        </Badge>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
          {list.map((p) => (
            <Link key={p.id} to="/partner/menu/$id" params={{ id: p.id }}>
              <Card className="overflow-hidden transition hover:shadow-md">
                <img src={p.image} alt={p.name} className="h-36 w-full object-cover" />
                <div className="flex flex-col gap-1.5 p-md">
                  <div className="flex items-center justify-between">
                    <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                    <Badge tone={p.available ? "success" : "danger"}>{p.available ? "متاح" : "غير متاح"}</Badge>
                  </div>
                  <p className="line-clamp-1 font-label-md text-label-md text-on-surface-variant">{p.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="font-headline-md text-headline-md text-on-surface">{EGP(p.price)}</span>
                    <Badge tone="neutral">{catName(p.category)}</Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
