import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppBar, Card, EmptyState, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { EGP, orders } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/driver/history")({
  head: () => ({
    meta: [
      { title: "سجل التوصيلات | طلبات بيتك" },
      { name: "description", content: "راجع كل توصيلاتك السابقة وأرباحك عنها." },
      { property: "og:title", content: "سجل التوصيلات | طلبات بيتك" },
      { property: "og:description", content: "راجع كل توصيلاتك السابقة وأرباحك عنها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverHistory,
});

const filters = ["اليوم", "الأسبوع", "الشهر"];

const deliveries = orders.flatMap((o) =>
  o["subOrders"]
    .filter((s) => s["driver"])
    .map((s) => ({
      code: o["code"],
      date: o["placedAt"],
      restaurant: s["restaurantName"],
      area: o["address"],
      distance: (Math.random() * 5 + 1).toFixed(1),
      earnings: Math.round(s["deliveryFee"] * 0.7),
      status: s["status"],
    })),
);

function DriverHistory() {
  const [active, setActive] = useState("اليوم");
  const totalEarnings = deliveries.reduce((s, d) => s + d.earnings, 0);

  return (
    <MobileShell tabs={driverTabs}>
      <AppBar title="سجل التوصيلات" />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        <div className="flex gap-2">
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActive(f)}
              className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                active === f ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <Card className="flex items-center justify-between p-md">
          <span className="font-label-lg text-label-lg text-on-surface">إجمالي {deliveries.length} توصيلة</span>
          <span className="font-headline-md text-headline-md text-success">{EGP(totalEarnings)}</span>
        </Card>

        {deliveries.length ? (
          <div className="tb-stagger flex flex-col gap-2">
            {deliveries.map((d, i) => (
              <Card key={`${d.code}-${i}`} className="flex items-center justify-between p-md">
                <div className="flex items-center gap-2">
                  <span className="flex size-9 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
                    <Icon name="two_wheeler" className="text-[18px]" />
                  </span>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">{d.restaurant}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      {d.code} · {d.date} · {d.distance} كم
                    </p>
                  </div>
                </div>
                <div className="text-left">
                  <p className="font-label-lg text-label-lg text-success">{EGP(d.earnings)}</p>
                  <StatusBadge status={d.status} />
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState icon="history" title="مفيش توصيلات" body="لسه معملتش أي توصيلة في الفترة دي" />
        )}
      </div>
    </MobileShell>
  );
}
