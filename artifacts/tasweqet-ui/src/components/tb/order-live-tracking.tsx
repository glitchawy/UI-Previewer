import { useEffect, useState } from "react";
import { getGetOrderDriverLocationQueryKey, useGetOrderDriverLocation } from "@workspace/api-client-react";
import { Card, Icon } from "./shell";
import { TrackingMap } from "./tracking-map";
import { useTranslation } from "@/lib/i18n";

export function OrderLiveTracking({ id, destination, driverName, driverPhone }: {
  id: number;
  destination: { lat: number; lng: number };
  driverName?: string | null;
  driverPhone?: string | null;
}) {
  const { t } = useTranslation();
  const [now, setNow] = useState(Date.now);
  const [online, setOnline] = useState(navigator.onLine);
  const location = useGetOrderDriverLocation(id, {
    query: { queryKey: getGetOrderDriverLocationQueryKey(id), refetchInterval: 10_000, staleTime: 0 },
  });
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 5_000);
    const recover = () => {
      setOnline(navigator.onLine);
      if (navigator.onLine && document.visibilityState === "visible") void location.refetch();
    };
    window.addEventListener("online", recover);
    window.addEventListener("offline", recover);
    document.addEventListener("visibilitychange", recover);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("online", recover);
      window.removeEventListener("offline", recover);
      document.removeEventListener("visibilitychange", recover);
    };
  }, [id, location.refetch]);
  const point = location.data;
  const hasPoint = point?.lat != null && point?.lng != null;
  const fresh = !!point?.updatedAt && now - Date.parse(point.updatedAt) <= 45_000;
  return (
    <section className="space-y-3" data-testid="order-live-tracking">
      <div>
        <h2 className="font-headline-md text-headline-md">{t("خرج للتوصيل", "Out for delivery")}</h2>
        <p className="text-body-md text-on-surface-variant">
          {driverName ? t("طلبك مع الكابتن {name} وفي الطريق إليك.", "Your order is with {name} and on its way to you.", { name: driverName }) : t("الكابتن استلم طلبك وهو في الطريق إليك.", "The driver has collected your order and is on the way.")}
        </p>
      </div>
      {driverPhone ? (
        <a href={`tel:${driverPhone}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-secondary-container px-4 text-secondary" aria-label={`${t("اتصل بالكابتن", "Call driver")}: ${driverPhone}`}>
          <Icon name="call" />
          <span dir="ltr">{driverPhone}</span>
        </a>
      ) : null}
      {hasPoint ? <>
        <TrackingMap driver={{ lat: point.lat!, lng: point.lng! }} destination={destination} />
        <p role="status" className="text-label-md text-on-surface-variant">
          {!online ? t("لا يوجد اتصال — نعرض آخر موقع معروف", "Offline — showing last known location") :
            location.isError || !fresh ? t("الموقع غير محدث — نعرض آخر موقع معروف", "Location delayed — showing last known location") :
            t("موقع الكابتن وطلبك — يتم التحديث كل ١٠ ثوانٍ", "Driver and your order — updated every 10 seconds")}
        </p>
        <p className="text-label-md text-on-surface-variant">{t("علامة الكابتن: طلبك معه • علامة البيت: عنوان التوصيل", "Driver marker: your order is with them • Home marker: delivery address")}</p>
      </> : <Card className="flex items-center gap-3 p-md">
        <Icon name="location_searching" />
        <p role="status">{t("الكابتن استلم طلبك. في انتظار موقعه لعرض الخريطة.", "The driver has your order. Waiting for their location to show the map.")}</p>
      </Card>}
      {location.isError ? <button className="text-primary underline" onClick={() => location.refetch()}>{t("تعذر تحديث الموقع — إعادة المحاولة", "Unable to update location — retry")}</button> : null}
    </section>
  );
}