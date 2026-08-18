import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppBar, MobileShell, Icon, Card, StatusBadge, EmptyState } from "@/components/tb/shell";
import { orders, stateLabels, EGP } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/orders")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | طلباتي" },
      { name: "description", content: "تابع طلباتك الحالية والسابقة والملغية" },
      { property: "og:title", content: "طلبات بيتك | طلباتي" },
      { property: "og:description", content: "تابع طلباتك الحالية والسابقة والملغية" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppOrders,
});

const tabs = [
  { id: "current", label: "الحالية" },
  { id: "past", label: "السابقة" },
  { id: "cancelled", label: "الملغية" },
];

function AppOrders() {
  const [tab, setTab] = useState("current");
  const filtered = orders.filter((o) => {
    if (tab === "cancelled") return o["status"] === "CANCELLED";
    if (tab === "past") return o["status"] === "DELIVERED";
    return o["status"] !== "CANCELLED" && o["status"] !== "DELIVERED";
  });

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="طلباتي" back="/app" />
      <div className="flex flex-col gap-lg p-md">
        <div className="flex gap-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                tab === t.id ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-on-surface-variant"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="receipt_long" title="مفيش طلبات" body="مفيش طلبات في القسم ده حالياً" />
        ) : (
          <div className="tb-stagger flex flex-col gap-3">
            {filtered.map((o) => (
              <Card key={o["id"]} className="p-md">
                <div className="flex items-center justify-between">
                  <p className="font-headline-md text-headline-md text-on-surface">{o["code"]}</p>
                  <StatusBadge status={o["status"]} label={stateLabels[o["status"]]} />
                </div>
                <p className="mt-1 font-label-md text-label-md text-on-surface-variant">{o["placedAt"]}</p>
                <p className="mt-1 truncate font-body-md text-body-md text-on-surface-variant">
                  {o["subOrders"].map((s) => s["restaurantName"]).join("، ")}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="font-label-lg text-label-lg text-on-surface">{EGP(o["total"])}</span>
                  <div className="flex items-center gap-3">
                    {o["status"] !== "CANCELLED" && o["status"] !== "DELIVERED" ? (
                      <Link to="/app/track/$id" params={{ id: o["id"] }} className="flex items-center gap-1 font-label-md text-label-md text-secondary">
                        <Icon name="location_on" className="text-[16px]" />
                        تتبع
                      </Link>
                    ) : null}
                    {o["status"] === "DELIVERED" ? (
                      <Link to="/app/rate/$id" params={{ id: o["id"] }} className="flex items-center gap-1 font-label-md text-label-md text-secondary">
                        <Icon name="star_rate" className="text-[16px]" />
                        تقييم
                      </Link>
                    ) : null}
                    <Link to="/app/refund/$id" params={{ id: o["id"] }} className="flex items-center gap-1 font-label-md text-label-md text-secondary">
                      <Icon name="currency_exchange" className="text-[16px]" />
                      استرداد
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}
