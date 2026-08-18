import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useUpdateLocation } from "@workspace/api-client-react";
import { getToken } from "@/lib/auth-session";

// Fix Leaflet default icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const Route = createFileRoute("/auth/location")({
  head: () => ({
    meta: [{ title: "تحديد الموقع | طلبات بيتك" }],
  }),
  component: AuthLocation,
});

/* ── types ─────────────────────────────────────────────────── */
type GeoState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; lat: number; lng: number; label: string; accuracy: number }
  | { status: "error"; message: string };

type SearchResult = { display_name: string; lat: string; lon: string };

/* ── helper: fly map to coords when they change ─────────────── */
function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1.2 });
  }, [lat, lng, map]);
  return null;
}

/* ── accuracy badge text ────────────────────────────────────── */
function accuracyLabel(meters: number) {
  if (meters < 50) return `دقة ممتازة (~${Math.round(meters)} متر)`;
  if (meters < 200) return `دقة جيدة (~${Math.round(meters)} متر)`;
  if (meters < 1000) return `دقة متوسطة (~${Math.round(meters)} متر)`;
  return `دقة منخفضة (~${(meters / 1000).toFixed(1)} كم) — يُنصح باستخدام الجوال`;
}

function accuracyColor(meters: number) {
  if (meters < 50) return "text-success";
  if (meters < 200) return "text-secondary";
  if (meters < 1000) return "text-primary-container";
  return "text-error";
}

/* ── main component ─────────────────────────────────────────── */
function AuthLocation() {
  const navigate = useNavigate();
  const [geo, setGeo] = useState<GeoState>({ status: "idle" });
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateLocation = useUpdateLocation({
    mutation: {
      onSuccess: () => navigate({ to: "/app" }),
      onError: () => navigate({ to: "/app" }),
    },
  });

  /* ── geolocation ──────────────────────────────────────────── */
  function requestGeo() {
    if (!navigator.geolocation) {
      setGeo({ status: "error", message: "المتصفح لا يدعم تحديد الموقع" });
      return;
    }
    setGeo({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy } = pos.coords;
        let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`,
          );
          const data = (await r.json()) as { display_name?: string };
          if (data.display_name)
            label = data.display_name.split(",").slice(0, 3).join("،");
        } catch { /* keep coordinate fallback */ }
        setGeo({ status: "success", lat, lng, label, accuracy });
        setSearch("");
        setResults([]);
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "تم رفض الإذن — اسمح للمتصفح بالوصول للموقع من الإعدادات",
          2: "تعذر تحديد الموقع، حاول مرة أخرى",
          3: "انتهت مهلة التحديد، حاول مرة أخرى",
        };
        setGeo({ status: "error", message: msgs[err.code] ?? "خطأ غير معروف" });
      },
      { timeout: 12000, maximumAge: 0, enableHighAccuracy: true },
    );
  }

  /* ── address search (Nominatim, debounced 500 ms) ─────────── */
  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); return; }
    setSearching(true);
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=ar&countrycodes=eg`,
      );
      setResults((await r.json()) as SearchResult[]);
    } catch { setResults([]); }
    setSearching(false);
  }, []);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 500);
  }

  function pickResult(r: SearchResult) {
    const lat = parseFloat(r.lat);
    const lng = parseFloat(r.lon);
    setGeo({ status: "success", lat, lng, label: r.display_name, accuracy: 50 });
    setSearch("");
    setResults([]);
  }

  /* ── confirm ──────────────────────────────────────────────── */
  function handleConfirm() {
    const token = getToken();
    if (geo.status === "success" && token) {
      updateLocation.mutate({ data: { lat: geo.lat, lng: geo.lng, token } });
    } else {
      navigate({ to: "/app" });
    }
  }

  const hasLocation = geo.status === "success";
  const defaultCenter: [number, number] = [30.0444, 31.2357]; // Cairo fallback

  return (
    <AuthShell title="عنوان التوصيل" subtitle="حدد موقعك عشان نوصلك بأسرع وقت">

      {/* ── Map ─────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-card border border-outline-variant" style={{ height: 280 }}>
        <MapContainer
          center={hasLocation ? [geo.lat, geo.lng] : defaultCenter}
          zoom={hasLocation ? 16 : 11}
          style={{ height: "100%", width: "100%" }}
          zoomControl={true}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {hasLocation && (
            <>
              <FlyTo lat={geo.lat} lng={geo.lng} />
              <Marker position={[geo.lat, geo.lng]} />
              <Circle
                center={[geo.lat, geo.lng]}
                radius={geo.accuracy}
                pathOptions={{
                  color: "#5c3d1e",
                  fillColor: "#ffd502",
                  fillOpacity: 0.15,
                  weight: 1.5,
                }}
              />
            </>
          )}
        </MapContainer>

        {/* Loading overlay */}
        {geo.status === "loading" && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-surface/70 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">
                my_location
              </span>
              <p className="font-label-md text-label-md text-on-surface">جاري تحديد الموقع...</p>
            </div>
          </div>
        )}
      </div>

      {/* ── Accuracy badge ───────────────────────────────────── */}
      {hasLocation && (
        <div className="flex items-center gap-2 rounded-card bg-surface-container-low px-md py-sm">
          <Icon name="radar" className={`text-[18px] ${accuracyColor(geo.accuracy)}`} />
          <p className={`font-label-md text-label-md ${accuracyColor(geo.accuracy)}`}>
            {accuracyLabel(geo.accuracy)}
          </p>
        </div>
      )}

      {/* ── GPS button ──────────────────────────────────────── */}
      <Button
        variant="outline"
        className="w-full"
        icon="my_location"
        onClick={requestGeo}
        disabled={geo.status === "loading"}
      >
        {geo.status === "loading" ? "جاري التحديد..." : "تحديد موقعي الحالي تلقائياً"}
      </Button>

      {/* ── Manual search ────────────────────────────────────── */}
      <div className="relative flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">
          أو ابحث عن عنوانك يدوياً
        </span>
        <span className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 focus-within:border-secondary">
          <Icon name="search" className="text-[20px] text-outline" />
          <input
            type="text"
            placeholder="مثال: المعادي، شارع ٩..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
            dir="rtl"
          />
          {searching && (
            <span className="material-symbols-outlined animate-spin text-[18px] text-outline">
              progress_activity
            </span>
          )}
        </span>

        {/* Results dropdown */}
        {results.length > 0 && (
          <ul className="absolute top-full z-50 mt-1 w-full overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-lift">
            {results.map((r, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => pickResult(r)}
                  className="flex w-full items-start gap-2 px-md py-sm text-right transition hover:bg-surface-container-low"
                >
                  <Icon name="place" className="mt-0.5 shrink-0 text-[16px] text-outline" />
                  <span className="font-label-md text-label-md text-on-surface leading-snug line-clamp-2">
                    {r.display_name}
                  </span>
                </button>
                {i < results.length - 1 && <div className="h-px bg-border-subtle mx-md" />}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* ── Detected address ─────────────────────────────────── */}
      {hasLocation && (
        <div className="flex items-start gap-2 rounded-card bg-surface-container-low p-md">
          <Icon name="place" className="mt-0.5 text-[18px] text-secondary" />
          <div>
            <p className="font-body-md text-body-md text-on-surface">{geo.label}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">الموقع المحدد</p>
          </div>
        </div>
      )}

      {/* ── Error ────────────────────────────────────────────── */}
      {geo.status === "error" && (
        <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">{geo.message}</p>
        </div>
      )}

      {/* ── Idle hint ────────────────────────────────────────── */}
      {geo.status === "idle" && (
        <div className="flex items-center gap-2 rounded-card bg-primary-container/60 p-md">
          <Icon name="info" className="text-[18px] text-on-primary-container" />
          <p className="font-label-md text-label-md text-on-primary-container">
            اضغط "تحديد موقعي" للسماح بالوصول للموقع، أو ابحث يدوياً أعلاه
          </p>
        </div>
      )}

      <Button
        className="w-full"
        icon="check_circle"
        onClick={handleConfirm}
        disabled={updateLocation.isPending || (!hasLocation)}
      >
        {updateLocation.isPending ? "جاري الحفظ..." : "تأكيد ومتابعة"}
      </Button>

      {/* Skip link */}
      <button
        onClick={() => navigate({ to: "/app" })}
        className="text-center font-label-lg text-label-lg text-outline hover:text-on-surface-variant transition"
      >
        تخطي في الوقت الحالي
      </button>

    </AuthShell>
  );
}
