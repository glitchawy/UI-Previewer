import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, MapCanvas, Badge, Icon, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";
import { useTranslation, translate, getLocale } from "@/lib/i18n";

export const Route = createFileRoute("/partner/settings")({
  head: () => ({ meta: [{ title: translate("بيانات المطعم — طلبات بيتك", "Restaurant details — Talabat Betak") }] }),
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
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json", "Accept-Language": getLocale() } : { "Content-Type": "application/json", "Accept-Language": getLocale() };
}

function bearerOnly(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Accept-Language": getLocale() } : { "Accept-Language": getLocale() };
}

const STATUS_STEPS = [
  { key: "PENDING", ar: "قيد الانتظار", en: "Pending" },
  { key: "UNDER_REVIEW", ar: "تحت المراجعة", en: "Under review" },
  { key: "APPROVED", ar: "موافق عليه", en: "Approved" },
  { key: "ACTIVE", ar: "نشط", en: "Active" },
];

// ─── Image upload helper ──────────────────────────────────────────────────────

async function uploadImage(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const r = await fetch("/api/storage/uploads", { method: "POST", headers: bearerOnly(), body: form });
  if (!r.ok) throw new Error(translate("فشل رفع الصورة", "Image upload failed"));
  const d = await r.json() as { url: string };
  return d.url;
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PartnerSettings() {
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
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
  const formDirtyRef = useRef(false);

  async function load() {
    const initialLoad = restaurant === null;
    if (initialLoad) setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/partner/restaurant", { headers: authHeaders() });
      if (!r.ok) throw new Error(t("فشل تحميل بيانات المطعم", "Failed to load restaurant details"));
      const data = await r.json() as RestaurantProfile;
      setRestaurant(data);
      if (!formDirtyRef.current) {
        setName(data.name);
        setDescription(data.description ?? "");
        setPhone(data.phone ?? "");
        setEmail(data.email ?? "");
        setAddress(data.address);
        setCategory(data.category ?? "");
        setDeliveryType(data.deliveryType);
        setLogoUrl(data.logoUrl);
        setCoverUrl(data.coverUrl);
      }
    } catch (e) { setError(e instanceof Error ? e.message : t("خطأ", "Something went wrong")); }
    finally { if (initialLoad) setLoading(false); }
  }

  useEffect(() => { void load(); }, [locale]);

  async function handleSave() {
    if (!name.trim()) { setSaveErr(t("اسم المطعم مطلوب", "Restaurant name is required")); return; }
    if (!address.trim()) { setSaveErr(t("عنوان المطعم مطلوب", "Restaurant address is required")); return; }
    setSaving(true); setSaveErr(""); setSaveOk(false);
    try {
      const r = await fetch("/api/partner/restaurant", {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ name, description, phone, email, address, category, deliveryType, logoUrl, coverUrl }),
      });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? t("خطأ", "Something went wrong")); }
      const updated = await r.json() as RestaurantProfile;
      setRestaurant(updated);
      formDirtyRef.current = false;
      setSaveOk(true);
    } catch (e) { setSaveErr(e instanceof Error ? e.message : t("خطأ", "Something went wrong")); }
    finally { setSaving(false); }
  }

  async function handleImageUpload(type: "logo" | "cover", file: File) {
    setUploading(type);
    try {
      const url = await uploadImage(file);
      formDirtyRef.current = true;
      if (type === "logo") setLogoUrl(url);
      else setCoverUrl(url);
      // Persist immediately
      await fetch("/api/partner/restaurant", {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify(type === "logo" ? { logoUrl: url } : { coverUrl: url }),
      });
    } catch { setSaveErr(t("فشل رفع الصورة", "Image upload failed")); }
    finally { setUploading(null); }
  }

  if (loading) return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("بيانات المطعم", "Restaurant details")}>
      <div className="flex h-40 items-center justify-center"><Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" /></div>
    </DashboardShell>
  );

  if (!restaurant) return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("بيانات المطعم", "Restaurant details")}>
      <div className="flex flex-col items-center gap-md py-xl text-center">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error || t("خطأ في التحميل", "Loading error")}</p>
        <Button onClick={load}>{t("إعادة المحاولة", "Try again")}</Button>
      </div>
    </DashboardShell>
  );

  const currentStep = STATUS_STEPS.findIndex((s) => s.key === restaurant.status);

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={`${t("صاحب مطعم", "Restaurant owner")} — ${restaurant.name}`} nav={partnerNav} title={t("بيانات المطعم", "Restaurant details")}>
      <div className="tb-stagger flex flex-col gap-lg">
        {error ? <p role="alert" className="font-label-md text-label-md text-error">{error}</p> : null}

        {/* Cover + Logo images */}
        <Card className="overflow-hidden">
          <div className="relative h-40 w-full bg-surface-container-high">
            {coverUrl
              ? <img src={coverUrl} alt={t("غلاف المطعم", "Restaurant cover")} className="h-full w-full object-cover" />
              : <div className="flex h-full items-center justify-center"><Icon name="image" className="text-[48px] text-outline" /></div>}
            <img
              src={logoUrl ?? ""}
              alt={t("شعار المطعم", "Restaurant logo")}
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
              {uploading === "cover" ? t("جاري الرفع...", "Uploading…") : t("تغيير الغلاف", "Change cover")}
            </Button>
            <Button variant="outline" icon="add_a_photo" disabled={uploading !== null}
              onClick={() => logoInputRef.current?.click()}>
              {uploading === "logo" ? t("جاري الرفع...", "Uploading…") : t("تغيير الشعار", "Change logo")}
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          {/* Core info */}
          <Card className="p-md">
            <SectionTitle title={t("البيانات الأساسية", "Basic details")} icon="storefront" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                { label: t("اسم المطعم *", "Restaurant name *"), value: name, set: setName },
                { label: t("الهاتف", "Phone"), value: phone, set: setPhone },
                { label: t("البريد الإلكتروني", "Email"), value: email, set: setEmail },
                { label: t("العنوان *", "Address *"), value: address, set: setAddress },
                { label: t("التصنيف", "Category"), value: category, set: setCategory, placeholder: t("مثال: برجر، بيتزا", "Example: burgers, pizza") },
              ].map(({ label, value, set, placeholder }) => (
                <div key={label}>
                  <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">{label}</label>
                  <input value={value} onChange={(e) => { formDirtyRef.current = true; set(e.target.value); }} placeholder={placeholder ?? ""}
                    className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
                </div>
              ))}
            </div>
            <div className="mt-3">
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">{t("الوصف", "Description")}</label>
              <textarea value={description} onChange={(e) => { formDirtyRef.current = true; setDescription(e.target.value); }} rows={3}
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
                <p className="font-label-md text-label-md text-outline">{t("لم يتم تحديد موقع المطعم بعد", "Restaurant location has not been set")}</p>
              </div>
            )}
          </MapCanvas>
        </div>

        {/* Delivery type */}
        <Card className="p-md">
          <SectionTitle title={t("طريقة التوصيل", "Delivery method")} icon="delivery_dining" />
          <div className="flex flex-wrap gap-2">
            {[
              { key: "restaurant" as const, title: t("توصيل المطعم", "Restaurant delivery"), sub: t("مندوبين خاصين بالمطعم", "Restaurant's own drivers") },
              { key: "platform" as const, title: t("توصيل المنصة", "Platform delivery"), sub: t("مندوبي طلبات بيتك", "Talabat Betak drivers") },
            ].map(({ key, title, sub }) => (
              <button key={key} type="button" onClick={() => { formDirtyRef.current = true; setDeliveryType(key); }}
                className={`flex-1 rounded-button border-2 p-md text-right transition ${deliveryType === key ? "border-secondary bg-secondary-container/40" : "border-outline-variant"}`}>
                <p className="font-label-lg text-label-lg text-on-surface">{title}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">{sub}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Verification status */}
        <Card className="p-md">
          <SectionTitle title={t("حالة التوثيق", "Verification status")} icon="verified" />
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
            {STATUS_STEPS.map(({ key, ar, en }) => <span key={key}>{t(ar, en)}</span>)}
          </div>
          <Badge
            tone={restaurant.status === "ACTIVE" ? "success" : restaurant.status === "REJECTED" ? "danger" : "info"}
            className="mt-sm w-fit"
          >
             {t("الحالة الحالية:", "Current status:")} {(() => { const step = STATUS_STEPS.find((s) => s.key === restaurant.status); return step ? t(step.ar, step.en) : restaurant.status; })()}
          </Badge>
        </Card>

        {/* Save */}
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving}>{saving ? t("جاري الحفظ...", "Saving…") : t("حفظ التعديلات", "Save changes")}</Button>
          {saveErr && <p className="font-label-md text-label-md text-error">{saveErr}</p>}
          {saveOk && <p className="font-label-md text-label-md text-success">{t("تم الحفظ بنجاح ✓", "Saved successfully ✓")}</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
