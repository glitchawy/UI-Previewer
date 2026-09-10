import { createFileRoute } from "@tanstack/react-router";
import {
  getGetCustomerOrderQueryKey,
  getGetOrderDriverLocationQueryKey,
  useGetCustomerOrder,
  useGetOrderDriverLocation,
  type OrderStatus,
} from "@workspace/api-client-react";
import { AppBar, Badge, Card, EmptyState, Icon, MobileShell } from "@/components/tb/shell";
import { TrackingMap } from "@/components/tb/tracking-map";
import { customerTabs } from "@/lib/tb/nav";
import { formatOrderDate, orderStatusTones } from "@/lib/tb/orders";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/app/track/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تتبع الطلب" },
      { name: "description", content: "تابع حالة طلبك ومكان الكابتن لحظة بلحظة" },
    ],
  }),
  component: AppTrackId,
});

const timelineSteps = [
  { label: "تم الاستلام", statuses: ["pending", "confirmed"] as OrderStatus[] },
  { label: "قيد التحضير", statuses: ["preparing"] as OrderStatus[] },
  { label: "جاهز", statuses: ["ready"] as OrderStatus[] },
  { label: "الكابتن في الطريق", statuses: ["picked_up"] as OrderStatus[] },
  { label: "تم التوصيل", statuses: ["delivered"] as OrderStatus[] },
];

function statusStep(status: OrderStatus) {
  if (status === "confirmed" || status === "pending") return 0;
  if (status === "preparing") return 1;
  if (status === "ready") return 2;
  if (status === "picked_up") return 3;
  if (status === "delivered") return 4;
  return -1;
}

function AppTrackId() {
  const [connected, setConnected] = useState(navigator.onLine);
  const { id: rawId } = Route.useParams();
  const parsedId = Number(rawId);
  const id = Number.isInteger(parsedId) ? parsedId : 0;
  const orderQuery = useGetCustomerOrder(id, {
    query: { enabled: id > 0, refetchInterval: 15_000, queryKey: getGetCustomerOrderQueryKey(id) },
  });
  const isOutForDelivery = orderQuery.data?.status === "picked_up";
  const locationQuery = useGetOrderDriverLocation(id, {
    query: { enabled: id > 0 && isOutForDelivery, refetchInterval: 10_000, queryKey: getGetOrderDriverLocationQueryKey(id) },
  });

  const order = orderQuery.data;
  const driverLat = locationQuery.data?.lat ?? order?.driverLat ?? null;
  const driverLng = locationQuery.data?.lng ?? order?.driverLng ?? null;
  const locationUpdatedAt = locationQuery.data?.updatedAt ?? order?.driverLocationUpdatedAt ?? null;
  const currentStep = order ? statusStep(order.status) : -1;
  const stale = locationUpdatedAt ? Date.now() - new Date(locationUpdatedAt).getTime() > 45_000 : true;
  useEffect(() => {
    const recover = () => {
      setConnected(navigator.onLine);
      if (navigator.onLine && document.visibilityState === "visible") {
        orderQuery.refetch(); if (isOutForDelivery) locationQuery.refetch();
      }
    };
    window.addEventListener("online", recover); window.addEventListener("offline", recover);
    document.addEventListener("visibilitychange", recover); window.addEventListener("pageshow", recover);
    return () => { window.removeEventListener("online", recover); window.removeEventListener("offline", recover); document.removeEventListener("visibilitychange", recover); window.removeEventListener("pageshow", recover); };
  }, [isOutForDelivery, id]);

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title={order?.code ? `تتبع ${order.code}` : "تتبع الطلب"} back="/app/orders" />
      {orderQuery.isLoading ? (
        <div className="flex h-72 items-center justify-center">
          <Icon name="progress_activity" className="animate-spin text-[38px] text-primary" />
        </div>
      ) : orderQuery.isError || !order ? (
        <div className="p-md"><EmptyState icon="error" title="تعذر تحميل التتبع" body="تأكد من رقم الطلب وحاول مرة أخرى" /><button className="mt-md w-full rounded-button bg-primary p-3 text-on-primary" onClick={() => orderQuery.refetch()}>إعادة المحاولة</button></div>
      ) : (
        <div className="flex flex-col gap-lg p-md">
          {order.status === "picked_up" && driverLat != null && driverLng != null ? (
            <section className="space-y-2">
              <TrackingMap
                driver={{ lat: driverLat, lng: driverLng }}
                destination={{ lat: order.deliveryLat, lng: order.deliveryLng }}
              />
              <div className="flex items-center justify-between gap-3 px-1 text-label-md text-on-surface-variant">
                <span className="flex items-center gap-1.5"><span className={`size-2 rounded-full ${connected && !stale ? "animate-pulse bg-success" : "bg-warning"}`} />{!connected ? "لا يوجد اتصال — نعرض آخر موقع" : stale ? "آخر موقع قديم — جاري إعادة الاتصال" : "الموقع مباشر"}</span>
                {locationUpdatedAt ? <span>{formatOrderDate(locationUpdatedAt)}</span> : null}
              </div>
            </section>
          ) : (
            <Card className="flex min-h-44 flex-col items-center justify-center gap-2 bg-surface-container-low p-lg text-center">
              <Icon name={order.driverName ? "two_wheeler" : "schedule"} className="text-[42px] text-secondary" />
              <p className="font-headline-md text-headline-md">
                {order.driverName ? "الخريطة هتظهر بعد استلام الكابتن للطلب" : "جاري تجهيز طلبك"}
              </p>
              <p className="font-body-md text-body-md text-on-surface-variant">هنحدّث الحالة تلقائياً كل ١٥ ثانية</p>
            </Card>
          )}
          {isOutForDelivery && locationQuery.isError ? <Card className="flex items-center justify-between gap-2 p-md text-error"><span>تعذر تحديث موقع الكابتن؛ لا يتم عرض أي موقع من طلب آخر.</span><button className="underline" onClick={() => locationQuery.refetch()}>إعادة</button></Card> : null}

          {order.driverName ? (
            <Card className="flex items-center gap-3 p-md">
              <span className="flex size-12 items-center justify-center rounded-full bg-secondary-container text-secondary">
                <Icon name="person" className="text-[24px]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-label-lg text-label-lg">{order.driverName}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">الكابتن المسؤول عن التوصيل</p>
              </div>
              {order.driverPhone ? (
                <a href={`tel:${order.driverPhone}`} className="flex size-10 items-center justify-center rounded-full bg-secondary-container text-secondary" aria-label="اتصل بالكابتن">
                  <Icon name="call" className="text-[19px]" />
                </a>
              ) : null}
            </Card>
          ) : null}

          <section>
            <div className="mb-sm flex items-center justify-between">
              <h2 className="font-headline-md text-headline-md">حالة الطلب</h2>
              {order.status === "cancelled" ? <Badge tone={orderStatusTones.cancelled}>تم الإلغاء</Badge> : null}
            </div>
            <Card className="p-md">
              {timelineSteps.map((step, index) => {
                const complete = currentStep >= index;
                const current = currentStep === index;
                const event = [...order.timeline].reverse().find((entry) => step.statuses.includes(entry.status));
                return (
                  <div key={step.label} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`flex size-8 items-center justify-center rounded-full border-2 ${
                        current ? "border-primary bg-primary text-on-primary" :
                        complete ? "border-success bg-success/15 text-success" :
                        "border-outline-variant bg-surface-container-low text-outline"
                      }`}>
                        <Icon name={complete ? "check" : "circle"} className="text-[16px]" />
                      </span>
                      {index < timelineSteps.length - 1 ? <span className={`h-10 w-0.5 ${complete && currentStep > index ? "bg-success/40" : "bg-outline-variant"}`} /> : null}
                    </div>
                    <div className="pt-1">
                      <p className={`font-label-lg text-label-lg ${current ? "text-primary" : complete ? "text-on-surface" : "text-outline"}`}>{step.label}</p>
                      {event ? <p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(event.at)}</p> : null}
                    </div>
                  </div>
                );
              })}
            </Card>
          </section>

          <Card className="flex gap-3 p-md">
            <Icon name="location_on" className="text-secondary" />
            <div><p className="font-label-lg text-label-lg">عنوان التوصيل</p><p className="font-body-md text-body-md text-on-surface-variant">{order.deliveryAddressText}</p></div>
          </Card>
        </div>
      )}
    </MobileShell>
  );
}