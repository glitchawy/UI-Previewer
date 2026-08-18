import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Table, Td, StatusBadge, Badge, Icon, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, orders, ORDER_STATES, stateLabels } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات — طلبات بيتك" },
      { name: "description", content: "متابعة طلبات مطعمك الواردة من طلبات بيتك." },
      { property: "og:title", content: "الطلبات — طلبات بيتك" },
      { property: "og:description", content: "متابعة طلبات مطعمك الواردة من طلبات بيتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerOrders,
});

const maskPhone = (p: string) => `${p.slice(0, 4)} •• ${p.slice(-4)}`;

function PartnerOrders() {
  const [filter, setFilter] = useState<string>("ALL");
  const list = orders.filter((o) => filter === "ALL" || o.status === filter);
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="الطلبات">
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit">
          <Icon name="lock" className="text-[16px]" />
          لا يمكن رفض الطلب بعد استلامه
        </Badge>

        <div className="flex flex-wrap gap-2">
          {["ALL", ...ORDER_STATES, "CANCELLED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                filter === s
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {s === "ALL" ? "الكل" : stateLabels[s]}
            </button>
          ))}
        </div>

        <Table head={["الكود", "الوقت", "العميل", "الفرع", "الإجمالي", "الدفع", "الحالة", ""]}>
          {list.map((o) => (
            <tr key={o.id} className="transition hover:bg-surface-container-low">
              <Td>{o.code}</Td>
              <Td>{o.placedAt}</Td>
              <Td>
                {o.customer.split(" ")[0]}
                <span className="block font-label-md text-[11px] text-outline">{maskPhone(o.customerPhone)}</span>
              </Td>
              <Td>{o.subOrders[0]?.branch}</Td>
              <Td>{EGP(o.total)}</Td>
              <Td>{o.payment}</Td>
              <Td>
                <StatusBadge status={o.status} label={stateLabels[o.status]} />
              </Td>
              <Td>
                <Link to="/partner/orders/$id" params={{ id: o.id }}>
                  <Button variant="outline" icon="visibility" className="!px-3 !py-1.5">
                    التفاصيل
                  </Button>
                </Link>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
