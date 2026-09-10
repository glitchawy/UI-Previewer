import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  getGetActiveDriverOrderQueryKey,
  useGetActiveDriverOrder,
  useUpdateDriverLocation,
  useUpdateDriverOrderStatus,
} from "@workspace/api-client-react";
import { AppBar, Badge, Button, Card, EmptyState, Icon, MobileShell } from "@/components/tb/shell";
import { TrackingMap } from "@/components/tb/tracking-map";
import { EGP } from "@/lib/tb/data";
import { selectDriverDestination } from "@/lib/driver-location";
import { runStickyAction } from "@/lib/tb/single-submission";

const LOCATION_BUFFER_KEY = "driver_location_buffer_v1";
type BufferedPoint = DriverPoint & { at: number };
function readBuffer(): BufferedPoint[] {
  try { return JSON.parse(localStorage.getItem(LOCATION_BUFFER_KEY) ?? "[]") as BufferedPoint[]; } catch { return []; }
}
function bufferPoint(point: DriverPoint) {
  const next = [...readBuffer(), { ...point, at: Date.now() }].slice(-20);
  localStorage.setItem(LOCATION_BUFFER_KEY, JSON.stringify(next));
}

export const Route = createFileRoute("/driver/navigate")({
  head: () => ({
    meta: [
      { title: "توصيلة نشطة | طلبات بيتك" },
      { name: "description", content: "حدّث موقعك ومراحل توصيل الطلب للعميل." },
    ],
  }),
  component: DriverNavigate,
});

type DriverPoint = { lat: number; lng: number };

function DriverNavigate() {
  const navigate = useNavigate();
  const activeOrder = useGetActiveDriverOrder({
    query: { refetchInterval: 15_000, queryKey: getGetActiveDriverOrderQueryKey() },
  });
  const locationMutation = useUpdateDriverLocation();
  const statusMutation = useUpdateDriverOrderStatus();
  const statusActionLock = useRef(false);
  const [statusActionLocked, setStatusActionLocked] = useState(false);
  const locationMutationRef = useRef(locationMutation.mutate);
  locationMutationRef.current = locationMutation.mutate;
  const [position, setPosition] = useState<DriverPoint | null>(null);
  const positionRef = useRef<DriverPoint | null>(null);
  const [geoStatus, setGeoStatus] = useState("جاري تحديد موقعك…");
  const order = activeOrder.data;
  const destination = order ? selectDriverDestination(order) : null;
  const activeOrderId = order?.id ?? null;
  const authoritativeStatusKey = order ? `${order.id}:${order.status}` : null;
  const previousStatusKey = useRef(authoritativeStatusKey);
  useEffect(() => {
    if (previousStatusKey.current !== authoritativeStatusKey) {
      previousStatusKey.current = authoritativeStatusKey;
      statusActionLock.current = false;
      setStatusActionLocked(false);
    }
  }, [authoritativeStatusKey]);
  const sendPoint = (point: DriverPoint) => {
    locationMutationRef.current({ data: point }, {
      onSuccess: () => { localStorage.removeItem(LOCATION_BUFFER_KEY); setGeoStatus("الموقع مباشر"); },
      onError: () => { bufferPoint(point); setGeoStatus("الاتصال منقطع — تم حفظ آخر موقع مؤقتاً"); },
    });
  };

  useEffect(() => {
    if (order?.driverLat != null && order.driverLng != null && !position) {
      const stored = { lat: order.driverLat, lng: order.driverLng };
      setPosition(stored);
      positionRef.current = stored;
    }
  }, [order?.driverLat, order?.driverLng, position]);

  useEffect(() => {
    if (!activeOrderId) {
      positionRef.current = null;
      setPosition(null);
      setGeoStatus("الموقع متوقف — لا توجد توصيلة نشطة");
      return;
    }
    if (!navigator.geolocation) {
      setGeoStatus("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (result) => {
        const next = { lat: result.coords.latitude, lng: result.coords.longitude };
        const isFirstFix = positionRef.current === null;
        setPosition(next);
        positionRef.current = next;
        setGeoStatus("الموقع مباشر");
        if (isFirstFix) {
          sendPoint(next);
        }
      },
      (error) => {
        const message = error.code === 1
          ? "اسمح بالوصول للموقع عشان العميل يقدر يتابعك"
          : "تعذر تحديد الموقع — تأكد من تشغيل GPS";
        setGeoStatus(message);
      },
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [activeOrderId]);

  useEffect(() => {
    if (!activeOrderId) return;
    const heartbeat = window.setInterval(() => {
      const latest = positionRef.current;
      if (!latest) return;
      sendPoint(latest);
    }, 10_000);
    return () => window.clearInterval(heartbeat);
  }, [activeOrderId]);

  useEffect(() => {
    if (!activeOrderId) return;
    const recover = () => {
      if (!navigator.onLine || document.visibilityState !== "visible") return;
      const buffered = readBuffer().at(-1);
      const point = buffered ? { lat: buffered.lat, lng: buffered.lng } : positionRef.current;
      if (point) sendPoint(point);
      activeOrder.refetch();
    };
    window.addEventListener("online", recover);
    window.addEventListener("pageshow", recover);
    document.addEventListener("visibilitychange", recover);
    return () => {
      window.removeEventListener("online", recover);
      window.removeEventListener("pageshow", recover);
      document.removeEventListener("visibilitychange", recover);
    };
  }, [activeOrderId]);

  async function updateStatus(status: "picked_up" | "delivered") {
    if (!order) return;
    await runStickyAction({
      lock: statusActionLock,
      submit: () => statusMutation.mutateAsync({ id: order.id, data: { status } }),
      onStart: () => setStatusActionLocked(true),
      onSuccess: () => {
        void activeOrder.refetch();
        if (status === "delivered") {
          navigate({ to: "/driver/delivered" });
        }
      },
      onError: () => setStatusActionLocked(false),
    });
  }

  return (
    <MobileShell>
      <AppBar title={order?.code || "التوصيلة النشطة"} subtitle={order?.restaurantName} back="/driver" />
      {activeOrder.isLoading ? (
        <div className="flex h-72 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[38px] text-primary" /></div>
      ) : activeOrder.isError ? (
        <div className="p-md"><EmptyState icon="error" title="تعذر تحميل التوصيلة" body="تأكد من تسجيل الدخول وحاول مرة أخرى" /></div>
      ) : !order ? (
        <div className="p-md"><EmptyState icon="two_wheeler" title="مفيش توصيلة نشطة" body="هتظهر هنا أول ما يتم إسناد طلب جاهز ليك" /></div>
      ) : (
        <div className="flex flex-col gap-md p-md">
          {position && destination ? (
            <TrackingMap
              driver={position}
              destination={destination}
              heightClass="h-60"
            />
          ) : (
            <Card className="flex h-52 flex-col items-center justify-center gap-2 bg-surface-container-low text-center">
              <Icon name="location_searching" className="animate-pulse text-[42px] text-secondary" />
              <p className="font-label-lg text-label-lg">جاري تحديد موقعك على الخريطة</p>
            </Card>
          )}

          <Badge tone={geoStatus === "الموقع مباشر" ? "success" : "warn"} className="w-fit">
            <span className={`size-2 rounded-full ${geoStatus === "الموقع مباشر" ? "animate-pulse bg-success" : "bg-warning"}`} />
            {geoStatus}
          </Badge>
          <Card className="flex gap-2 bg-surface-container-low p-md text-label-md text-on-surface-variant">
            <Icon name="info" className="shrink-0 text-[18px]" />
            <p>التتبع عبر المتصفح يعمل أثناء فتح الصفحة ويستعيد الإرسال بعد رجوع الاتصال أو ظهور الصفحة. التتبع الحقيقي والشاشة مقفلة يحتاج تطبيق الموبايل الأصلي.</p>
          </Card>

          <Card className="flex flex-col gap-3 p-md">
            {[
              { label: "الطلب جاهز للاستلام", complete: true },
              { label: "استلمت الطلب وفي الطريق", complete: order.status === "picked_up" },
              { label: "تم التوصيل للعميل", complete: order.status === "delivered" },
            ].map((step, index) => (
              <div key={step.label} className="flex items-center gap-3">
                <span className={`flex size-8 items-center justify-center rounded-full ${step.complete ? "bg-success/15 text-success" : index === (order.status === "ready" ? 1 : 2) ? "bg-primary text-on-primary" : "bg-surface-container-low text-outline"}`}>
                  <Icon name={step.complete ? "check" : "radio_button_checked"} className="text-[16px]" />
                </span>
                <span className={`font-label-lg text-label-lg ${step.complete ? "text-on-surface" : "text-on-surface-variant"}`}>{step.label}</span>
              </div>
            ))}
          </Card>

          <Card className="p-md">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="font-label-lg text-label-lg">{order.customerName || "عميل طلبات بيتك"}</span>
              {order.customerPhone ? <a href={`tel:${order.customerPhone}`} className="flex size-9 items-center justify-center rounded-full bg-secondary-container text-secondary" aria-label="اتصال بالعميل"><Icon name="call" /></a> : null}
            </div>
            <p className="flex items-start gap-2 font-body-md text-body-md text-on-surface-variant"><Icon name="place" className="mt-0.5 text-[18px]" />{order.status === "picked_up" ? order.deliveryAddressText : order.pickupAddressText}</p>
            {order.notes ? <p className="mt-2 flex items-start gap-2 font-label-md text-label-md text-on-surface-variant"><Icon name="sticky_note_2" className="mt-0.5 text-[17px]" />{order.notes}</p> : null}
          </Card>

          <Card className="p-md">
            <p className="mb-2 font-label-lg text-label-lg">ملخص الطلب</p>
            <ul className="flex flex-col gap-1 text-body-md text-on-surface-variant">
              {order.items.map((item) => <li key={item.id}>{item.quantity.toLocaleString("ar-EG")}× {item.name}</li>)}
            </ul>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <Badge tone={order.paymentMethod === "cash" ? "warn" : "success"}>
              <Icon name="payments" className="text-[15px]" />
              {order.paymentMethod === "cash" ? `حصّل ${EGP(order.total)}` : "مدفوع أونلاين"}
            </Badge>
            <span className="text-label-md text-on-surface-variant">الوقت المتوقع: ٢٠–٣٠ دقيقة</span>
          </div>

          {statusMutation.isError ? <p className="rounded-button bg-error-container px-3 py-2 text-label-md text-on-error-container">تعذر تحديث حالة الطلب. حاول مرة أخرى.</p> : null}
          {order.status === "ready" ? (
            <Button type="button" className="w-full" icon="two_wheeler" disabled={statusActionLocked || statusMutation.isPending} onClick={() => void updateStatus("picked_up")}>
              استلمت الطلب
            </Button>
          ) : (
            <Button type="button" className="w-full" icon="done_all" disabled={statusActionLocked || statusMutation.isPending} onClick={() => void updateStatus("delivered")}>
              تم التوصيل
            </Button>
          )}
        </div>
      )}
    </MobileShell>
  );
}