import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { AppBar, MobileShell, Icon, Card, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import {
  useGetCustomerAddress,
  useSaveCustomerAddress,
  useReverseGeocode,
  searchAddress,
} from "@workspace/api-client-react";

// Fix Leaflet default icon paths broken by Vite bundling
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export const Route = createFileRoute("/app/address")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | عنوان التوصيل" },
      { name: "description", content: "أدر عنوان التوصيل الخاص بك" },
    ],
  }),
  component: AppAddress,
});

type Picked = { lat: number; lng: number; label: string; placeId: string | null };
type SearchResult = { label: string; lat: number; lng: number; placeId: string | null };

function FlyTo({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 16, { duration: 1 });
  }, [lat, lng, map]);
  return null;
}

function AppAddress() {
  const navigate = useNavigate();
  const [picked, setPicked] = useState<Picked | null>(null);
  const [details, setDetails] = useState("");
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loadedRef = useRef(false);

  const saved = useGetCustomerAddress();
  const save = useSaveCustomerAddress({
    mutation: { onSuccess: () => navigate({ to: "/app" }) },
  });
  const geocode = useReverseGeocode();

  // Prefill from saved address once
  useEffect(() => {
    const d = saved.data;
    if (!loadedRef.current && d && d.lat != null && d.lng != null && d.addressText) {
      loadedRef.current = true;
      setPicked({ lat: d.lat, lng: d.lng, label: d.addressText, placeId: d.placeId ?? null });
      setDetails(d.addressDetails ?? "");
    }
  }, [saved.data]);

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError("المتصفح لا يدعم تحديد الموقع");
      return;
    }
    setGeoLoading(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        geocode.mutate(
          { data: { lat, lng } },
          {
            onSuccess: (r) => {
              setPicked({ lat, lng, label: r.addressText, placeId: null });
              setGeoLoading(false);
            },
            onError: () => {
              setPicked({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}`, placeId: null });
              setGeoLoading(false);
            },
          },
        );
        setSearch("");
        setResults([]);
      },
      (err) => {
        const msgs: Record<number, string> = {
          1: "تم رفض الإذن — اسمح للمتصفح بالوصول للموقع من الإعدادات",
          2: "تعذر تحديد الموقع، حاول مرة أخرى",
          3: "انتهت مهلة التحديد، حاول مرة أخرى",
        };
        setGeoError(msgs[err.code] ?? "خطأ غير معروف");
        setGeoLoading(false);
      },
      { timeout: 12000, maximumAge: 0, enableHighAccuracy: true },
    );
  }

  const latestQuery = useRef("");
  const doSearch = useCallback(async (q: string) => {
    latestQuery.current = q;
    if (q.trim().length < 3) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await searchAddress({ q });
      if (latestQuery.current === q) setResults(r as SearchResult[]);
    } catch {
      if (latestQuery.current === q) setResults([]);
    }
    if (latestQuery.current === q) setSearching(false);
  }, []);

  function handleSearchChange(val: string) {
    setSearch(val);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => doSearch(val), 500);
  }

  function pickResult(r: SearchResult) {
    latestQuery.current = "";
    setPicked({ lat: r.lat, lng: r.lng, label: r.label, placeId: r.placeId });
    setSearch("");
    setResults([]);
  }

  function handleSave() {
    if (!picked) return;
    save.mutate({
      data: {
        lat: picked.lat,
        lng: picked.lng,
        addressText: picked.label,
        ...(details.trim() ? { addressDetails: details.trim() } : {}),
        ...(picked.placeId ? { placeId: picked.placeId } : {}),
      },
    });
  }

  const defaultCenter: [number, number] = [30.0444, 31.2357]; // Cairo

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="عنوان التوصيل" back="/app" />
      <div className="flex flex-col gap-lg p-md">
        {/* Map */}
        <div className="relative overflow-hidden rounded-card border border-outline-variant" style={{ height: 260 }}>
          <MapContainer
            center={picked ? [picked.lat, picked.lng] : defaultCenter}
            zoom={picked ? 16 : 11}
            style={{ height: "100%", width: "100%" }}
            zoomControl
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {picked && (
              <>
                <FlyTo lat={picked.lat} lng={picked.lng} />
                <Marker position={[picked.lat, picked.lng]} />
              </>
            )}
          </MapContainer>
          {geoLoading && (
            <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-surface/70 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">my_location</span>
                <p className="font-label-md text-label-md text-on-surface">جاري تحديد الموقع...</p>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          icon="my_location"
          className="w-full"
          onClick={detectLocation}
          disabled={geoLoading}
        >
          {geoLoading ? "جاري التحديد..." : "تحديد موقعي الحالي"}
        </Button>

        {/* Search */}
        <div className="relative flex flex-col gap-1.5">
          <span className="font-label-lg text-label-lg text-on-surface-variant">أو ابحث عن عنوانك</span>
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
              <span className="material-symbols-outlined animate-spin text-[18px] text-outline">progress_activity</span>
            )}
          </span>
          {results.length > 0 && (
            <ul className="absolute top-full z-[1100] mt-1 w-full overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-lift">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => pickResult(r)}
                    className="flex w-full items-start gap-2 px-md py-sm text-right transition hover:bg-surface-container-low"
                  >
                    <Icon name="place" className="mt-0.5 shrink-0 text-[16px] text-outline" />
                    <span className="font-label-md text-label-md text-on-surface leading-snug line-clamp-2">{r.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Selected address */}
        {picked && (
          <div className="flex items-start gap-2 rounded-card bg-surface-container-low p-md">
            <Icon name="place" className="mt-0.5 text-[18px] text-secondary" />
            <div>
              <p className="font-body-md text-body-md text-on-surface">{picked.label}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">العنوان المحدد</p>
            </div>
          </div>
        )}

        {geoError && (
          <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
            <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
            <p className="font-label-md text-label-md text-on-error-container">{geoError}</p>
          </div>
        )}

        {/* Details */}
        <div className="flex flex-col gap-1.5">
          <span className="font-label-lg text-label-lg text-on-surface-variant">
            تفاصيل إضافية (رقم العقار، الدور، الشقة، علامة مميزة)
          </span>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="مثال: عمارة ٧، الدور ٣، شقة ٦ — بجوار صيدلية"
            rows={2}
            dir="rtl"
            className="w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:border-secondary"
          />
        </div>

        <Card className="flex items-center gap-2 bg-secondary-container p-3 text-on-secondary-container">
          <Icon name="info" className="text-[18px]" />
          <span className="font-label-md text-label-md">طلبات بيتك بتدعم عنوان واحد محفوظ فقط — الحفظ يستبدل العنوان السابق</span>
        </Card>

        {save.isError && (
          <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
            <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
            <p className="font-label-md text-label-md text-on-error-container">تعذر حفظ العنوان — حاول مرة أخرى</p>
          </div>
        )}

        <Button className="w-full" icon="save" onClick={handleSave} disabled={!picked || save.isPending}>
          {save.isPending ? "جاري الحفظ..." : "حفظ العنوان"}
        </Button>
      </div>
    </MobileShell>
  );
}
