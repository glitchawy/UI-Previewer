import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppBar, MobileShell, Icon, Card, Badge, Button, StatusBadge, MapCanvas } from "@/components/tb/shell";
import { orderOf, ORDER_STATES, stateLabels, orderHistory, drivers } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/track/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تتبع الطلب" },
      { name: "description", content: "تابع حالة طلبك ومكان المندوب لحظة بلحظة" },
      { property: "og:title", content: "طلبات بيتك | تتبع الطلب" },
      { property: "og:description", content: "تابع حالة طلبك ومكان المندوب لحظة بلحظة" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppTrackId,
});

const cancelReasons = ["غيرت رأيي", "الطلب هياخد وقت كتير", "طلبت بالغلط", "سبب آخر"];

function AppTrackId() {
  const { id } = Route.useParams();
  const order = orderOf(id);
  const [showCancel, setShowCancel] = useState(false);
  const driver = drivers[0]!;
  const canCancel = ORDER_STATES.indexOf(order["status"] as (typeof ORDER_STATES)[number]) < ORDER_STATES.indexOf("PREPARING");

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title={`تتبع الطلب ${order["code"]}`} back="/app/orders" />
      <div className="flex flex-col gap-lg p-md">
        <MapCanvas>
          <span className="absolute right-[20%] top-[30%] flex size-8 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="storefront" className="text-[16px]" />
          </span>
          <span className="absolute left-[25%] bottom-[25%] flex size-8 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="home" className="text-[16px]" />
          </span>
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="tb-ping absolute inset-0 rounded-full bg-success/30" />
            <span className="relative flex size-9 items-center justify-center rounded-full bg-success text-on-primary-container">
              <Icon name="two_wheeler" className="text-[18px]" />
            </span>
          </span>
        </MapCanvas>

        <Card className="flex items-center gap-3 p-3">
          <img
            src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&w=200&q=70"
            alt={driver["name"]}
            className="size-14 rounded-full object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="font-label-lg text-label-lg text-on-surface">{driver["name"]}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">
              ⭐ {driver["rating"]} · {driver["vehicle"]}
            </p>
          </div>
          <button type="button" className="flex size-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="call" className="text-[18px]" />
          </button>
          <button type="button" className="flex size-9 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
            <Icon name="chat" className="text-[18px]" />
          </button>
        </Card>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">حالة الطلب</h2>
          <div className="flex flex-col gap-3">
            {ORDER_STATES.map((state, idx) => {
              const historyIdx = orderHistory.findIndex((h) => h["status"] === state);
              const currentIdx = orderHistory.length - 1;
              const completed = historyIdx !== -1 && historyIdx <= currentIdx;
              const isCurrent = historyIdx === currentIdx;
              return (
                <div key={state} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex size-6 items-center justify-center rounded-full ${
                        completed
                          ? isCurrent
                            ? "bg-primary-container text-on-primary-container"
                            : "bg-success/20 text-success"
                          : "bg-surface-container-low text-outline"
                      }`}
                    >
                      <Icon name={completed ? "check" : "circle"} className="text-[14px]" />
                    </span>
                    {idx < ORDER_STATES.length - 1 ? (
                      <span className={`h-6 w-0.5 ${completed ? "bg-success/40" : "bg-outline-variant"}`} />
                    ) : null}
                  </div>
                  <div className="pb-1">
                    <p className={`font-label-lg text-label-lg ${completed ? "text-on-surface" : "text-outline"}`}>
                      {stateLabels[state]}
                    </p>
                    {historyIdx !== -1 ? (
                      <p className="font-label-md text-label-md text-on-surface-variant">{orderHistory[historyIdx]?.["at"]}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">الطلبات الفرعية</h2>
          <div className="flex flex-col gap-2">
            {order["subOrders"].map((s) => (
              <Card key={s["id"]} className="flex items-center justify-between p-3">
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">{s["restaurantName"]}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">{s["branch"]}</p>
                </div>
                <StatusBadge status={s["status"]} label={stateLabels[s["status"]]} />
              </Card>
            ))}
          </div>
        </section>

        <div className="flex flex-col gap-2">
          <Button
            variant="danger"
            className="w-full"
            icon="cancel"
            disabled={!canCancel}
            onClick={() => setShowCancel(true)}
          >
            إلغاء الطلب
          </Button>
          <Link to="/app/refund/$id" params={{ id: order["id"] }} className="text-center font-label-md text-label-md text-secondary">
            طلب استرداد
          </Link>
        </div>

        {showCancel ? (
          <div className="fixed inset-0 z-40 flex items-end justify-center bg-scrim/50">
            <Card className="w-full max-w-[480px] rounded-b-none p-md">
              <p className="mb-sm font-headline-md text-headline-md text-on-surface">سبب الإلغاء</p>
              <div className="flex flex-col gap-2">
                {cancelReasons.map((r) => (
                  <label key={r} className="flex items-center gap-2 rounded-button bg-surface-container-low px-3 py-2.5">
                    <input type="radio" name="cancel-reason" className="accent-secondary" />
                    <span className="font-body-md text-body-md text-on-surface">{r}</span>
                  </label>
                ))}
              </div>
              <div className="mt-md flex gap-2">
                <Button variant="ghost" className="flex-1" onClick={() => setShowCancel(false)}>
                  رجوع
                </Button>
                <Button variant="danger" className="flex-1">
                  تأكيد الإلغاء
                </Button>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    </MobileShell>
  );
}
