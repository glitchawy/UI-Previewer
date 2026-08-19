import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, MapCanvas, Badge, Icon, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/partner/settings")({
  head: () => ({ meta: [{ title: "بيانات المطعم — طلبات بيتك" }] }),
  component: PartnerSettings,
});

type RestaurantProfile = {
  id: number; name: string; description: string | null;
  phone: string | null; email: string | null; address: string;
  lat: number | null; lng: number | null;
  category: string | null; deliveryType: "restaurant" | "platform";
  logoUrl: string | null; coverUrl: string | null;
  status: string; ownerName: string | null;
};

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function bearerOnly(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const STATUS_STEPS = [
  { key: "PENDING", label: "قيد الانتظار" },
  { key: "UNDER_REVIEW", label: "تحت المراجعة" },
  { key: "APPROVED", label: "موافق عليه" },
  { key: "ACTIVE", label: "نشط" },
];

// ─── Image upload helper ──────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch("/api/storage/uploads", { method: "POST", headers: bearerOnly(), body: form });
  if (!r.ok) throw new Error("فشل رفع الصورة");
  const d = await r.json() as { url: string };
  return d.url;
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PartnerSettings() {
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Form state (mirrors restaurant fields)
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [category, setCategory] = useState("");
  const [deliveryType, setDeliveryType] = useState<"restaurant" | "platform">("restaurant");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [saveOk, setSaveOk] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/partner/restaurant", { headers: authHeaders() });
      if (!r.ok) throw new Error("فشل تحميل بيانات المطعم");
      const data = await r.json() as RestaurantProfile;
      setRestaurant(data);
      setName(data.name);
      setDescription(data.description ?? "");
      setPhone(data.phone ?? "");
      setEmail(data.email ?? "");
      setAddress(data.address);
      setCategory(data.category ?? "");
      setDeliveryType(data.deliveryType);
      setLogoUrl(data.logoUrl);
      setCoverUrl(data.coverUrl);
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!name.trim()) { setSaveErr("اسم المطعم مطلوب"); return; }
    if (!address.trim()) { setSaveErr("عنوان المطعم مطلوب"); return; }
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      const r = await fetch("/api/partner/restaurant", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ name, description, phone, email, address, category, deliveryType, logoUrl, coverUrl }),
      });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ"); }
      const updated = await r.json() as RestaurantProfile;
      setRestaurant(updated);
      setSaveOk(true);
    } catch (e) { setSaveErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  async function handleImageUpload(type: "logo" | "cover", file: File) {
    setUploading(type);
    try {
      const url = await uploadImage(file);
      if (type === "logo") setLogoUrl(url);
      else setCoverUrl(url);
      // Persist immediately
      await fetch("/api/partner/restaurant", {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify(type === "logo" ? { logoUrl: url } : { coverUrl: url }),
      });
    } catch { setSaveErr("فشل رفع الصورة"); }
    finally { setUploading(null); }
  }

  if (loading) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="بيانات المطعم">
      <div className="flex h-40 items-center justify-center"><Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" /></div>
    </DashboardShell>
  );

  if (error || !restaurant) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="بيانات المطعم">
      <div className="flex flex-col items-center gap-md py-xl text-center">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error || "خطأ في التحميل"}</p>
        <Button onClick={load}>إعادة المحاولة</Button>
      </div>
    </DashboardShell>
  );

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === restaurant.status);

  return (
    <DashboardShell brand="طلبات بيتك" role={`صاحب مطعم — ${restaurant.name}`} nav={partnerNav} title="بيانات المطعم">
      <div className="tb-stagger flex flex-col gap-lg">

        {/* Cover + Logo images */}
        <Card className="overflow-hidden">
          <div className="relative h-40 w-full bg-surface-container-high">
            {coverUrl
              ? <img src={coverUrl} alt="غلاف المطعم" className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center"><Icon name="image" className="text-[48px] text-outline" /></div>}
            <img
              src={logoUrl ?? ""}
              alt="شعار المطعم"
              className="absolute -bottom-6 right-md size-16 rounded-full border-4 border-surface-container-lowest bg-surface-container object-cover"
            />
          </div>
          <div className="flex gap-2 p-md pt-8">
            {/* Hidden file inputs */}
            <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload("logo", f); }} />
            <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload("cover", f); }} />

            <Button variant="outline" icon="image" disabled={uploading !== null}
              onClick={() => coverInputRef.current?.click()}>
              {uploading === "cover" ? "جاري الرفع..." : "تغيير الغلاف"}
            </Button>
            <Button variant="outline" icon="add_a_photo" disabled={uploading !== null}
              onClick={() => logoInputRef.current?.click()}>
              {uploading === "logo" ? "جاري الرفع..." : "تغيير الشعار"}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          {/* Core info */}
          <Card className="p-md">
            <SectionTitle title="البيانات الأساسية" icon="storefront" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: "اسم المطعم *", value: name, set: setName },
                { label: "الهاتف", value: phone, set: setPhone },
                { label: "البريد الإلكتروني", value: email, set: setEmail },
                { label: "العنوان *", value: address, set: setAddress },
                { label: "التصنيف", value: category, set: setCategory, placeholder: "مثال: برجر، بيتزا" },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">{label}</label>
                  <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder ?? ""}
                    className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">الوصف</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
            </div>
          </Card>

          {/* Map placeholder */}
          <MapCanvas>
            {restaurant.lat && restaurant.lng ? (
              <span className="absolute right-1/2 top-1/2 flex size-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-lg">
                <Icon name="place" className="text-[18px]" />
              </span>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center p-md">
                <Icon name="location_off" className="text-[32px] text-outline" />
                <p className="font-label-md text-label-md text-outline">لم يتم تحديد موقع المطعم بعد</p>
              </div>
            )}
          </MapCanvas>
        </div>

        {/* Delivery type */}
        <Card className="p-md">
          <SectionTitle title="طريقة التوصيل" icon="delivery_dining" />
          <div className="flex flex-wrap gap-2">
            {[
              { key: "restaurant" as const, title: "توصيل المطعم", sub: "مندوبين خاصين بالمطعم" },
              { key: "platform" as const, title: "توصيل المنصة", sub: "مندوبي طلبات بيتك" },
            ].map(({ key, title, sub }) => (
              <button key={key} type="button" onClick={() => setDeliveryType(key)}
                className={`flex-1 rounded-button border-2 p-md text-right transition ${deliveryType === key ? "border-secondary bg-secondary-container/40" : "border-outline-variant"}`}>
                <p className="font-label-lg text-label-lg text-on-surface">{title}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">{sub}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Verification status */}
        <Card className="p-md">
          <SectionTitle title="حالة التوثيق" icon="verified" />
          <div className="flex items-center gap-2">
            {STATUS_STEPS.map(({ key }, i) => (
              <div key={key} className="flex flex-1 items-center gap-2">
                <span className={`flex size-8 items-center justify-center rounded-full font-label-md text-label-md ${i <= currentStep ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"}`}>
                  {i + 1}
                </span>
                {i < STATUS_STEPS.length - 1 && (
                  <span className={`h-0.5 flex-1 ${i < currentStep ? "bg-primary-container" : "bg-surface-container"}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-sm flex justify-between font-label-md text-label-md text-on-surface-variant">
            {STATUS_STEPS.map(({ label }) => <span key={label}>{label}</span>)}
          </div>
          <Badge
            tone={restaurant.status === "ACTIVE" ? "success" : restaurant.status === "REJECTED" ? "danger" : "info"}
            className="mt-sm w-fit"
          >
            الحالة الحالية: {STATUS_STEPS.find((s) => s.key === restaurant.status)?.label ?? restaurant.status}
          </Badge>
        </Card>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التعديلات"}</Button>
          {saveErr && <p className="font-label-md text-label-md text-error">{saveErr}</p>}
          {saveOk && <p className="font-label-md text-label-md text-success">تم الحفظ بنجاح ✓</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
