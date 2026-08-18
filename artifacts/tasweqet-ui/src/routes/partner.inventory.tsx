import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { products, branches } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/inventory")({
  head: () => ({
    meta: [
      { title: "مخزون الفروع — طلبات بيتك" },
      { name: "description", content: "متابعة مخزون المنتجات في كل فرع." },
      { property: "og:title", content: "مخزون الفروع — طلبات بيتك" },
      { property: "og:description", content: "متابعة مخزون المنتجات في كل فرع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerInventory,
});

function stockFor(seed: number, i: number) {
  return ((seed * 7 + i * 13) % 40) + (i % 2 === 0 ? 0 : -5);
}

function PartnerInventory() {
  const list = products.filter((p) => p["restaurantId"] === "burger-house");
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="مخزون الفروع">
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          الأسعار موحدة بين الفروع والمخزون لكل فرع
        </Badge>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-right">
              <thead className="bg-table-header">
                <tr>
                  <th className="whitespace-nowrap px-md py-3 font-label-md text-label-md text-on-surface-variant">المنتج</th>
                  {branches.map((b) => (
                    <th key={b.id} className="whitespace-nowrap px-md py-3 font-label-md text-label-md text-on-surface-variant">{b.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {list.map((p, i) => (
                  <tr key={p.id} className="transition hover:bg-surface-container-low">
                    <td className="whitespace-nowrap px-md py-3 font-body-md text-body-md text-on-surface">{p.name}</td>
                    {branches.map((b, bi) => {
                      const stock = Math.max(0, stockFor(i + 1, bi));
                      const low = stock < 10;
                      return (
                        <td key={b.id} className="whitespace-nowrap px-md py-3">
                          <span className={`font-label-lg text-label-lg ${low ? "text-error" : "text-on-surface"}`}>{stock}</span>
                          {low ? <Badge tone="danger" className="mr-2">منخفض</Badge> : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
