import { useState } from "react";
import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useListCustomerOrders } from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Badge, EmptyState } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { currentOrderStatuses, EGP, formatOrderDate, orderStatusLabels, orderStatusTones } from "@/lib/tb/orders";

export const Route = createFileRoute("/app/orders")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | طلباتي" },
      { name: "description", content: "تابع طلباتك الحالية والسابقة والملغية" },
    ],
  }),
  component: OrdersRoute,
});

const tabs = [
  { id: "current", label: "الحالية" },
  { id: "past", label: "السابقة" },
  { id: "cancelled", label: "الملغية" },
] as const;

function OrdersRoute() {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return pathname === "/app/orders" ? <AppOrders /> : <Outlet />;
}

function AppOrders() {
  const [tab, setTab] = useState<(typeof tabs)[number]["id"]>("current");
  const ordersQuery = useListCustomerOrders();
  const filtered = (ordersQuery.data ?? []).filter((order) => {
    if (tab === "cancelled") return order.status === "cancelled";
    if (tab === "past") return order.status === "delivered";
    return currentOrderStatuses.has(order.status);
  });

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="طلباتي" back="/app" subtitle={`${(ordersQuery.data?.length ?? 0).toLocaleString("ar-EG")} طلب`} />
      <div className="flex flex-col gap-lg p-md">
        <div className="grid grid-cols-3 gap-2 rounded-full bg-surface-container-low p-1">
          {tabs.map((item) => (
            <button key={item.id} type="button" onClick={() => setTab(item.id)} data-testid={`tab-orders-${item.id}`}
              className={`rounded-full px-3 py-2 font-label-md text-label-md transition ${tab === item.id ? "bg-surface-container-lowest text-on-surface shadow-sm" : "text-on-surface-variant"}`}>
              {item.label}
            </button>
          ))}
        </div>

        {ordersQuery.isLoading ? <div className="flex h-48 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[36px] text-primary" /></div> :
        ordersQuery.isError ? <EmptyState icon="error" title="تعذر تحميل الطلبات" body="حاول مرة أخرى بعد قليل" /> :
        filtered.length === 0 ? <EmptyState icon="receipt_long" title="مفيش طلبات" body="مفيش طلبات في القسم ده حالياً" /> : (
          <div className="tb-stagger flex flex-col gap-3">
            {filtered.map((order) => (
              <Card key={order.id} className="p-md transition hover:border-secondary">
                <Link to="/app/orders/$id" params={{ id: String(order.id) }} className="block" data-testid={`link-order-${order.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div><p className="font-headline-md text-headline-md text-on-surface">{order.restaurantName}</p><p className="font-label-md text-label-md text-on-surface-variant">{order.code}</p></div>
                    <Badge tone={orderStatusTones[order.status]}>{orderStatusLabels[order.status]}</Badge>
                  </div>
                  <div className="mt-3 flex items-center justify-between pt-3">
                    <span className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(order.createdAt)}</span>
                    <span className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface">{EGP(order.total)}<Icon name="chevron_left" className="text-outline" /></span>
                  </div>
                </Link>
                {currentOrderStatuses.has(order.status) ? (
                  <Link
                    to="/app/track/$id"
                    params={{ id: String(order.id) }}
                    className="mt-3 flex items-center justify-center gap-2 border-t border-outline-variant pt-3 font-label-lg text-label-lg text-secondary"
                    data-testid={`link-track-order-${order.id}`}
                  >
                    <Icon name="location_searching" className="text-[18px]" />
                    تتبع الطلب
                  </Link>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </div>
    </MobileShell>
  );
}