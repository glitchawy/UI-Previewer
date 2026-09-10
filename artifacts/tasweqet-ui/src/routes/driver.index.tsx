import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { AppBar, Badge, Button, Card, Icon, MobileShell, Stat } from "@/components/tb/shell";
import { EGP } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";
import { getSession, logoutSession, getRoleDashboard } from "@/lib/auth-session";
import {
  getGetActiveDriverOrderQueryKey,
  getGetAvailableDriverOrderQueryKey,
  useGetActiveDriverOrder,
  useGetAvailableDriverOrder,
  useUpdateDriverAvailability,
  useUpdateDriverDispatchLocation,
} from "@workspace/api-client-react";
import { getFreshForegroundFix, type DriverAccount, type DriverEarnings } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";

export const Route = createFileRoute("/driver/")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "driver") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: "طلبات المندوب | طلبات بيتك" },
      { name: "description", content: "تابع حالتك وابدأ استلام طلبات التوصيل من طلبات بيتك." },
    ],
  }),
  component: DriverIndex,
});

function DriverIndex() {
  const navigate = useNavigate();
  const session = getSession();
  const account = useDriverData<DriverAccount>("/account");
  const earnings = useDriverData<DriverEarnings>("/earnings");
  const availability = useUpdateDriverAvailability();
  const location = useUpdateDriverDispatchLocation();
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionDenied, setLocationPermissionDenied] = useState(false);
  const locationMutationRef = useRef(location.mutateAsync);
  const locationFlightRef = useRef<Promise<boolean> | null>(null);
  locationMutationRef.current = location.mutateAsync;
  const online = account.data?.isOnline ?? false;
  const dispatchLocationAge = account.data?.dispatchLocationUpdatedAt
    ? Date.now() - Date.parse(account.data.dispatchLocationUpdatedAt)
    : Number.POSITIVE_INFINITY;
  const dispatchLocationStatus = dispatchLocationAge <= 120_000
    ? "محدّث"
    : account.data?.dispatchLocationUpdatedAt
      ? "بحاجة للتحديث"
      : "غير متاح";
  const activeOrder = useGetActiveDriverOrder({
    query: { queryKey: getGetActiveDriverOrderQueryKey(), refetchInterval: 15_000 },
  });
  const availableOrder = useGetAvailableDriverOrder({
    query: { queryKey: getGetAvailableDriverOrderQueryKey(), enabled: online, refetchInterval: online ? 10_000 : false },
  });
  const availableOrderRef = useRef(availableOrder.refetch);
  availableOrderRef.current = availableOrder.refetch;
  // Approval gating happens in the /driver layout route (driver.tsx).

  async function handleLogout() {
    await logoutSession();
    navigate({ to: "/auth/login" });
  }
  const refreshDispatchLocation = useCallback(() => {
    if (locationFlightRef.current) return locationFlightRef.current;
    const flight = (async () => {
      setLocationError(null);
      try {
        if (!navigator.geolocation) throw new Error("خدمة الموقع غير متاحة على هذا الجهاز");
        const fix = await getFreshForegroundFix(navigator.geolocation);
        await locationMutationRef.current({
          data: {
            lat: fix.position.coords.latitude,
            lng: fix.position.coords.longitude,
            capturedAt: new Date(fix.capturedAt).toISOString(),
          },
        });
        await account.retry();
        await availableOrderRef.current();
        return true;
      } catch (cause) {
        if (typeof cause === "object" && cause && "code" in cause &&
            Number((cause as { code: unknown }).code) === 1) {
          setLocationPermissionDenied(true);
        }
        const status = typeof cause === "object" && cause && "status" in cause
          ? Number((cause as { status: unknown }).status)
          : null;
        setLocationError(status === 400
          ? "الموقع غير حديث أو خارج نطاق مصر. حاول تحديث الموقع مرة أخرى."
          : "تعذر الوصول للموقع. اسمح بخدمة الموقع ثم أعد المحاولة.");
        return false;
      } finally {
        locationFlightRef.current = null;
      }
    })();
    locationFlightRef.current = flight;
    return flight;
  }, []);

  function toggleOnline() {
    setLocationError(null);
    setLocationPermissionDenied(false);
    availability.mutate({ data: { available: !online } }, {
      onSuccess: async () => {
        await account.retry();
        if (!online) {
          await refreshDispatchLocation();
        } else {
        }
        availableOrder.refetch();
      },
    });
  }

  useEffect(() => {
    if (!online || activeOrder.data || locationPermissionDenied) return;
    let timer: number | null = null;
    const stop = () => {
      if (timer !== null) window.clearInterval(timer);
      timer = null;
    };
    const start = () => {
      stop();
      if (document.visibilityState === "visible") {
        timer = window.setInterval(() => void refreshDispatchLocation(), 60_000);
      }
    };
    const visibilityChanged = () => {
      if (document.visibilityState === "visible") {
        void refreshDispatchLocation();
        start();
      } else {
        stop();
      }
    };
    start();
    document.addEventListener("visibilitychange", visibilityChanged);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", visibilityChanged);
    };
  }, [online, activeOrder.data, locationPermissionDenied, refreshDispatchLocation]);

  return (
    <MobileShell tabs={driverTabs}>
      <AppBar
        title={`أهلاً 👋 +20${session?.user.phone ?? ""}`}
        subtitle="مندوب طلبات بيتك"
        right={
          <button
            onClick={handleLogout}
            className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
            title="تسجيل الخروج"
          >
            <Icon name="logout" className="text-[20px]" />
          </button>
        }
      />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        <Card className="p-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-headline-md text-headline-md text-on-surface">
                {online ? "متاح للطلبات" : "غير متصل"}
              </p>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {online ? "بتستقبل عروض توصيل جديدة" : "فعّل الحالة عشان تبدأ تستقبل طلبات"}
              </p>
            </div>
            <button
              onClick={toggleOnline}
              disabled={availability.isPending || account.loading}
              className={`relative h-9 w-16 rounded-full transition ${online ? "bg-success" : "bg-surface-container-high"}`}
              aria-label="تبديل الحالة"
            >
              <span className={`absolute top-1 size-7 rounded-full bg-surface-container-lowest shadow transition-all ${online ? "right-1" : "right-8"}`} />
            </button>
          </div>
        </Card>

        {availability.isError || account.error ? <Card className="p-md text-error"><p>{account.error || "تعذر تحديث حالة الاتصال"}</p><Button className="mt-sm" onClick={account.retry}>إعادة المحاولة</Button></Card> : null}
        {locationError ? <Card className="p-md text-error"><p>{locationError}</p></Card> : null}
        {online && !activeOrder.data ? (
          <Card className="flex items-center justify-between gap-3 p-md">
            <div>
              <p className="font-label-lg text-label-lg">موقع الإسناد</p>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {locationError ? "تعذر التحديث" : dispatchLocationAge < 120_000
                  ? "حديث" : "يحتاج تحديث"}
              </p>
            </div>
            <Button disabled={location.isPending} onClick={() => void refreshDispatchLocation()}>
              تحديث موقع الإسناد
            </Button>
          </Card>
        ) : null}
        {online && availableOrder.data && !activeOrder.data ? (
          <Link to="/driver/offer" className="block">
            <Card className="tb-pulse-ring border-primary bg-primary-container/30 p-md">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
                  <Icon name="notifications_active" className="text-[20px] text-primary" />
                  عرض توصيل جديد من {availableOrder.data.restaurantName}
                </span>
                <Icon name="chevron_left" className="text-on-surface-variant" />
              </div>
            </Card>
          </Link>
        ) : null}

        {activeOrder.data ? (
          <Link to="/driver/navigate" className="block">
            <Card className="p-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name="two_wheeler" className="text-[20px] text-on-surface-variant" />
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">لديك توصيلة نشطة الآن</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{activeOrder.data.code} — {activeOrder.data.restaurantName}</p>
                  </div>
                </div>
                <Icon name="chevron_left" className="text-on-surface-variant" />
              </div>
            </Card>
          </Link>
        ) : null}

        <div>
          <p className="mb-sm font-headline-md text-headline-md text-on-surface">إحصائيات اليوم</p>
          <div className="tb-stagger grid grid-cols-2 gap-sm">
            <Stat label="إجمالي التوصيلات" value={String(account.data?.deliveries ?? "—")} icon="local_shipping" tone="info" />
            <Stat label="أرباح اليوم" value={earnings.data ? EGP(earnings.data.today) : "—"} icon="payments" tone="success" />
            <Stat label="الحمل الحالي" value={String(account.data?.currentWorkload ?? "—")} icon="route" tone="warn" />
            <Stat label="حالة موقع الإسناد" value={dispatchLocationStatus} icon="location_on" tone="warn" />
          </div>
        </div>

        <Card className="flex items-start gap-2 p-md">
          <Icon name="near_me" className="mt-0.5 text-[18px] text-secondary" />
          <p className="font-label-md text-label-md text-on-surface-variant">
            بيتم تعيين الطلبات تلقائياً لأقرب مندوب متاح لمكان الاستلام.
          </p>
        </Card>
      </div>
    </MobileShell>
  );
}
