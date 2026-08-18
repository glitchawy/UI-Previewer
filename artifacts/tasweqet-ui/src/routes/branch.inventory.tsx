import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, Badge, Icon, Table, Td } from "@/components/tb/shell";
import { branchNav } from "@/lib/tb/nav";
import { products } from "@/lib/tb/data";

export const Route = createFileRoute("/branch/inventory")({
  head: () => ({
    meta: [
      { title: "المخزون — طلبات بيتك" },
      { name: "description", content: "متابعة مخزون منتجات فرع المعادي." },
      { property: "og:title", content: "المخزون — طلبات بيتك" },
      { property: "og:description", content: "متابعة مخزون منتجات فرع المعادي." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BranchInventory,
});

function BranchInventory() {
  const [lowOnly, setLowOnly] = useState(false);
  const list = products.filter((p) => p["restaurantId"] === "burger-house");
  const withStock = list.map((p, i) => ({ ...p, stock: Math.max(0, 25 - i * 6), out: i === list.length - 1 }));
  const filtered = lowOnly ? withStock.filter((p) => p.stock < 10) : withStock;

  return (
    <DashboardShell brand="طلبات بيتك" role="مدير فرع — فرع المعادي" nav={branchNav} title="المخزون">
      <div className="tb-stagger flex flex-col gap-md">
        <button
          onClick={() => setLowOnly((v) => !v)}
          className={`w-fit rounded-full px-3 py-1.5 font-label-md text-label-md transition ${lowOnly ? "bg-error-container text-on-error-container" : "bg-surface-container text-on-surface-variant"}`}
        >
          <Icon name="warning" className="ml-1 text-[16px]" />
          عرض المخزون المنخفض فقط
        </button>

        <Table head={["المنتج", "المخزون", "التحكم", "نفد المخزون"]}>
          {filtered.map((p) => (
            <tr key={p.id} className="transition hover:bg-surface-container-low">
              <Td>{p.name}</Td>
              <Td>
                <span className={p.stock < 10 ? "text-error" : "text-on-surface"}>{p.stock}</span>
                {p.stock < 10 ? <Badge tone="danger" className="mr-2">منخفض</Badge> : null}
              </Td>
              <Td>
                <div className="flex items-center gap-1.5">
                  <button className="flex size-7 items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high">
                    <Icon name="remove" className="text-[16px]" />
                  </button>
                  <button className="flex size-7 items-center justify-center rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-high">
                    <Icon name="add" className="text-[16px]" />
                  </button>
                </div>
              </Td>
              <Td>
                <button className={`relative h-6 w-11 rounded-full transition ${p.out ? "bg-error-container" : "bg-surface-container-high"}`}>
                  <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${p.out ? "right-0.5" : "right-5"}`} />
                </button>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
