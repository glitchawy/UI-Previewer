import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, Button, Icon, MapCanvas } from "@/components/tb/shell";
import { useUpdateLocation } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/auth/location")({
  head: () => ({
    meta: [{ title: "تحديد الموقع | طلبات بيتك" }],
  }),
  component: AuthLocation,
});

type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; lat: number; lng: number; label: string }
  | { status: "error"; message: string };

function AuthLocation() {
  const navigate = useNavigate();
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });

  const updateLocation = useUpdateLocation({
    mutation: {
      onSuccess: () => {
        navigate({ to: "/app" });
      },
      onError: () => {
        navigate({ to: "/app" }); // non-blocking — location is optional
      },
    },
  });

  function requestGeo() {
    if (!navigator.geolocation) {
      setGeo({ status: "error", message: "المتصفح لا يدعم تحديد الموقع" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
          );
          const data = (await r.json()) as { display_name?: string };
          if (data.display_name) label = data.display_name.split(",").slice(0, 3).join("،");
        } catch {
          // keep coordinate fallback
        }
        setGeo({ status: "success", lat, lng, label });
      },
      (err) => {
        const messages: Record<number, string> = {
          1: "تم رفض الإذن — يرجى السماح بالوصول للموقع من إعدادات المتصفح",
          2: "تعذر تحديد الموقع، حاول مرة أخرى",
          3: "انتهت مهلة تحديد الموقع، حاول مرة أخرى",
        };
        setGeo({ status: "error", message: messages[err.code] ?? "خطأ غير معروف" });
      },
      { timeout: 10000, maximumAge: 0 },
    );
  }

  function handleConfirm() {
    const token = getToken();
    if (geo.status === "success" && token) {
      updateLocation.mutate({ data: { lat: geo.lat, lng: geo.lng, token } });
    } else {
      navigate({ to: "/app" });
    }
  }

  return (
    <AuthShell title="عنوان التوصيل" subtitle="حدد موقعك عشان نوصلك بأسرع وقت">
      <MapCanvas height="h-56">
        <div className="absolute inset-0 flex items-center justify-center">
          {geo.status === "loading" ? (
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[36px] text-secondary">
                my_location
              </span>
              <p className="font-label-md text-label-md text-on-surface-variant">جاري التحديد...</p>
            </div>
          ) : geo.status === "success" ? (
            <Icon name="location_on" className="tb-pulse-ring text-[36px] text-secondary" filled />
          ) : (
            <Icon name="location_on" className="tb-pulse-ring text-[36px] text-error" filled />
          )}
        </div>
      </MapCanvas>

      <Button
        variant="outline"
        className="w-full"
        icon="my_location"
        onClick={requestGeo}
        disabled={geo.status === "loading"}
      >
        {geo.status === "loading" ? "جاري التحديد..." : "تحديد موقعي الحالي"}
      </Button>

      {geo.status === "success" && (
        <div className="flex items-start gap-2 rounded-card bg-surface-container-low p-md">
          <Icon name="place" className="mt-0.5 text-[18px] text-secondary" />
          <div>
            <p className="font-body-md text-body-md text-on-surface">{geo.label}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">تم تحديد العنوان تلقائياً</p>
          </div>
        </div>
      )}

      {geo.status === "error" && (
        <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">{geo.message}</p>
        </div>
      )}

      {geo.status === "idle" && (
        <div className="flex items-center gap-2 rounded-card bg-primary-container/60 p-md">
          <Icon name="info" className="text-[18px] text-on-primary-container" />
          <p className="font-label-md text-label-md text-on-primary-container">
            اضغط "تحديد موقعي" للسماح للمتصفح بالوصول لموقعك
          </p>
        </div>
      )}

      <Button
        className="w-full"
        icon="check_circle"
        onClick={handleConfirm}
        disabled={updateLocation.isPending}
      >
        {updateLocation.isPending ? "جاري الحفظ..." : "تأكيد ومتابعة"}
      </Button>
    </AuthShell>
  );
}
