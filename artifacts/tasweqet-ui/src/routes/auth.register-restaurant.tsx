import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useRef, useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthShell, Badge, Button, Icon, MapCanvas, StatusBadge } from "@/components/tb/shell";
import { categories } from "@/lib/tb/data";
import { getSession, getRoleDashboard, getToken } from "@/lib/auth-session";
import { translate, useTranslation } from "@/lib/i18n";

function storageUrl(objectPath: string): string {
  const token = getToken();
  return `/api/storage${objectPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export const Route = createFileRoute("/auth/register-restaurant")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "partner") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: translate("تسجيل مطعم جديد | طلبات بيتك", "Register a restaurant | Talabat Betak") },
      { name: "description", content: translate("سجّل مطعمك وابدأ البيع على منصة طلبات بيتك.", "Register your restaurant and start selling on Talabat Betak.") },
    ],
  }),
  component: AuthRegisterRestaurant,
});

const steps = ["PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE"];
const stepLabels: Record<string, [string, string]> = {
  PENDING: ["قيد الإرسال", "Submitted"],
  UNDER_REVIEW: ["قيد المراجعة", "Under review"],
  APPROVED: ["تمت الموافقة", "Approved"],
  ACTIVE: ["نشط", "Active"],
};

const deliveryOptions = [
  { value: "restaurant", ar: "توصيل المطعم", en: "Restaurant delivery", descAr: "أنت مسؤول عن التوصيل", descEn: "You handle delivery" },
  { value: "platform", ar: "توصيل طلبات بيتك", en: "Talabat Betak delivery", descAr: "مناديبنا بيوصّلوا عنك", descEn: "Our drivers deliver for you" },
];

/** Upload a file to object storage via the server proxy. Returns objectPath or throws. */
async function uploadFileToStorage(file: File): Promise<string> {
  const token = getToken();
  const contentType = file.type || "application/octet-stream";
  const res = await fetch("/api/storage/uploads", {
    method: "POST",
    headers: {
      "Content-Type": contentType,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: file,
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(data?.error ?? translate("فشل رفع الملف إلى التخزين", "Failed to upload the file to storage"));
  }
  const { objectPath } = (await res.json()) as { objectPath: string };
  return objectPath;
}

function ImageUploadSlot({
  label,
  icon,
  objectPath,
  uploading,
  onFile,
  previewClass,
}: {
  label: string;
  icon: string;
  objectPath: string | null;
  uploading: boolean;
  onFile: (file: File) => void;
  previewClass?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  return (
    <label
      className="relative flex flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-outline-variant cursor-pointer hover:border-secondary transition overflow-hidden"
      style={{ minHeight: "7rem" }}
      onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }}
    >
      {objectPath ? (
        <>
          <img
            src={storageUrl(objectPath)}
            alt={label}
            className={`absolute inset-0 w-full h-full object-cover ${previewClass ?? ""}`}
          />
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1">
            <Icon name="refresh" className="text-[20px] text-white" />
            <span className="font-label-md text-label-md text-white">{t("تغيير", "Change")}</span>
          </div>
        </>
      ) : uploading ? (
        <>
          <Icon name="hourglass_empty" className="text-[24px] text-primary animate-spin" />
          <span className="font-label-md text-label-md text-on-surface-variant">{t("جاري الرفع...", "Uploading...")}</span>
        </>
      ) : (
        <>
          <Icon name={icon} className="text-[24px] text-outline" />
          <span className="font-label-md text-label-md text-on-surface-variant">{label}</span>
        </>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { onFile(f); e.target.value = ""; }
        }}
      />
    </label>
  );
}

function Field({ label, placeholder, value, onChange, onClear, type = "text", icon }: {
  label: string; placeholder: string; value: string;
  onChange: (v: string) => void; onClear?: () => void; type?: string; icon?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label-lg text-label-lg text-on-surface-variant">{label}</span>
      <span className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 focus-within:border-secondary transition">
        {icon && <Icon name={icon} className="text-[20px] text-outline shrink-0" />}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => { onChange(e.target.value); onClear?.(); }}
          className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
        />
      </span>
    </label>
  );
}

function AuthRegisterRestaurant() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = getSession();

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [branches, setBranches] = useState("1");
  const [hours, setHours] = useState("10:00 ص — 2:00 ص");
  const [delivery, setDelivery] = useState("restaurant");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function toggleCategory(id: string) {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  }

  async function handleImageUpload(
    file: File,
    setUrl: (v: string | null) => void,
    setUploading: (v: boolean) => void,
  ) {
    // Client-side pre-checks (belt-and-suspenders before hitting the server)
    if (file.size > 10_000_000) {
      setError(t("حجم الملف كبير جداً — الحد الأقصى 10 ميجابايت", "File is too large — maximum size is 10 MB"));
      return;
    }
    const mime = file.type || "application/octet-stream";
    if (!mime.startsWith("image/")) {
      setError(t("نوع الملف غير مقبول — يُسمح فقط بالصور (JPG، PNG، …)", "Unsupported file type — only images (JPG, PNG, …) are allowed"));
      return;
    }

    setUploading(true);
    setError("");
    try {
      const objectPath = await uploadFileToStorage(file);
      setUrl(objectPath);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("فشل رفع الصورة", "Image upload failed"));
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit() {
    if (!ownerName.trim()) { setError(t("من فضلك أدخل اسم المالك", "Please enter the owner's name")); return; }
    if (!restaurantName.trim()) { setError(t("من فضلك أدخل اسم المطعم", "Please enter the restaurant name")); return; }
    if (!address.trim()) { setError(t("من فضلك أدخل عنوان المطعم", "Please enter the restaurant address")); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboard/partner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.token ?? ""}`,
        },
        body: JSON.stringify({
          ownerName: ownerName.trim(),
          email: email.trim() || undefined,
          name: restaurantName.trim(),
          description: description.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim(),
          branches: Number(branches) || 1,
          hours: hours.trim() || undefined,
          category: selectedCategories.join(",") || undefined,
          deliveryType: delivery,
          logoUrl: logoUrl || undefined,
          coverUrl: coverUrl || undefined,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? t("حدث خطأ أثناء الإرسال، حاول مرة أخرى", "An error occurred while submitting. Please try again."));
        setSubmitting(false);
        return;
      }
      navigate({ to: "/auth/pending" });
    } catch {
      setError(t("تعذر الاتصال بالخادم، حاول مرة أخرى", "Unable to connect to the server. Please try again."));
      setSubmitting(false);
    }
  }

  const anyUploading = logoUploading || coverUploading;
  const clearError = () => setError("");

  return (
    <AuthShell title={t("تسجيل مطعم جديد", "Register a restaurant")} subtitle={t("ابدأ البيع على طلبات بيتك خطوة بخطوة", "Start selling on Talabat Betak, step by step")} back="/auth/register">

      {/* Account info banner */}
      <div className="flex items-center gap-2 rounded-card bg-secondary-container p-md">
        <Icon name="phone" className="text-[18px] text-on-secondary-container" />
        <p className="font-label-md text-label-md text-on-secondary-container">
          {t("الحساب مرتبط بـ", "Account linked to")}{" "}
          <span className="font-label-lg" dir="ltr">+20{session?.user.phone}</span>
        </p>
      </div>

      {/* Owner info */}
      <p className="font-label-lg text-label-lg text-on-surface">{t("بيانات المالك", "Owner information")}</p>
      <Field label={t("اسم المالك", "Owner name")} placeholder={t("هاني رمضان", "Hany Ramadan")} value={ownerName} onChange={setOwnerName} icon="person" onClear={clearError} />
      <Field label={t("البريد الإلكتروني (اختياري)", "Email (optional)")} placeholder="owner@restaurant.eg" value={email} onChange={setEmail} type="email" icon="mail" onClear={clearError} />

      <hr className="border-outline-variant" />

      {/* Restaurant info */}
      <p className="font-label-lg text-label-lg text-on-surface">{t("بيانات المطعم", "Restaurant information")}</p>
      <Field label={t("اسم المطعم", "Restaurant name")} placeholder={t("برجر هاوس", "Burger House")} value={restaurantName} onChange={setRestaurantName} icon="storefront" onClear={clearError} />

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">الوصف (اختياري)</span>
        <textarea
          rows={2}
          placeholder={t("وصف قصير عن مطعمك", "A short description of your restaurant")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:border-secondary"
        />
      </label>

      {/* Categories */}
      <div className="flex flex-col gap-1.5">
         <span className="font-label-lg text-label-lg text-on-surface-variant">{t("التصنيفات", "Categories")}</span>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 8).map((c) => {
            const selected = selectedCategories.includes(c.id);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleCategory(c.id)}
                className={`flex items-center gap-1 rounded-full border px-3 py-1.5 font-label-md text-label-md transition ${
                  selected
                    ? "border-secondary bg-secondary-container text-on-secondary-container"
                    : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
                }`}
              >
                <Icon name={c.icon} className="text-[14px]" />
                {translate(c.name, ({ burger: "Burgers", pizza: "Pizza", grill: "Grills", seafood: "Seafood", dessert: "Desserts", drinks: "Drinks", koshary: "Koshary", breakfast: "Breakfast" } as Record<string, string>)[c.id] ?? c.name)}
              </button>
            );
          })}
        </div>
      </div>

      <Field label={t("هاتف المطعم", "Restaurant phone")} placeholder="0100 123 4567" value={phone} onChange={setPhone} type="tel" icon="call" onClear={clearError} />
      <Field label={t("العنوان", "Address")} placeholder={t("شارع 9، المعادي، القاهرة", "Street 9, Maadi, Cairo")} value={address} onChange={setAddress} icon="place" onClear={clearError} />
      <MapCanvas height="h-40" />
      <Field label={t("عدد الفروع", "Number of branches")} placeholder="1" value={branches} onChange={setBranches} type="number" icon="store" onClear={clearError} />
      <Field label={t("مواعيد العمل", "Opening hours")} placeholder={t("10:00 ص — 2:00 ص", "10:00 AM — 2:00 AM")} value={hours} onChange={setHours} icon="schedule" onClear={clearError} />

      {/* Delivery type */}
      <div className="flex flex-col gap-1.5">
         <span className="font-label-lg text-label-lg text-on-surface-variant">{t("نوع التوصيل", "Delivery type")}</span>
        <div className="grid grid-cols-2 gap-2">
          {deliveryOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDelivery(opt.value)}
              className={`flex flex-col items-start rounded-button border p-3 text-right transition ${
                delivery === opt.value
                  ? "border-2 border-secondary bg-secondary-container"
                  : "border-outline-variant bg-surface-container-lowest"
              }`}
            >
              <span className={`font-label-lg text-label-lg ${delivery === opt.value ? "text-on-secondary-container" : "text-on-surface"}`}>
                 {t(opt.ar, opt.en)}
              </span>
              <span className="font-label-md text-label-md text-on-surface-variant">{t(opt.descAr, opt.descEn)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Logo / cover upload slots */}
      <div className="flex flex-col gap-1.5">
         <span className="font-label-lg text-label-lg text-on-surface-variant">{t("صور المطعم", "Restaurant images")}</span>
        <div className="grid grid-cols-2 gap-2">
          <ImageUploadSlot
            label={t("شعار المطعم", "Restaurant logo")}
            icon="add_photo_alternate"
            objectPath={logoUrl}
            uploading={logoUploading}
            onFile={(f) => handleImageUpload(f, setLogoUrl, setLogoUploading)}
          />
          <ImageUploadSlot
            label={t("صورة الغلاف", "Cover image")}
            icon="image"
            objectPath={coverUrl}
            uploading={coverUploading}
            onFile={(f) => handleImageUpload(f, setCoverUrl, setCoverUploading)}
            previewClass="object-cover"
          />
        </div>
        <p className="font-label-md text-label-md text-on-surface-variant">{t("اختياري — يساعد على تمييز مطعمك للعملاء", "Optional — helps customers recognize your restaurant")}</p>
      </div>

      {/* No KYC badge */}
      <div className="flex items-center gap-2 rounded-card bg-success/10 p-md">
        <Icon name="verified_user" className="text-[18px] text-success" />
        <p className="font-label-md text-label-md text-success">{t("لا نطلب مستندات KYC للمطاعم — بيانات فقط", "Restaurants do not need KYC documents — information only")}</p>
      </div>

      {/* Review steps */}
      <div>
        <p className="mb-2 font-label-lg text-label-lg text-on-surface">{t("مسار التوثيق", "Verification process")}</p>
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <span className={`flex size-7 items-center justify-center rounded-full font-label-md text-[11px] ${i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"}`}>
                  {i + 1}
                </span>
                <span className="text-center font-label-md text-[10px] text-on-surface-variant">{t(...stepLabels[s])}</span>
              </div>
              {i < steps.length - 1 && <span className="mb-4 h-0.5 flex-1 bg-outline-variant" />}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <StatusBadge status="PENDING" label={t("الحالة الحالية: قيد الإرسال", "Current status: Submitted")} />
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">{error}</p>
        </div>
      )}

      <Button className="w-full" icon="send" onClick={handleSubmit} disabled={submitting || anyUploading}>
        {submitting ? t("جاري الإرسال...", "Submitting...") : t("إرسال للتوثيق", "Submit for verification")}
      </Button>

    </AuthShell>
  );
}
