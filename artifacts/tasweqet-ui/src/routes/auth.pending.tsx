import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useRef, useState, useEffect } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Icon, Badge } from "@/components/tb/shell";
import { getSession, logoutSession, getRoleDashboard, getToken } from "@/lib/auth-session";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/auth/pending")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    // Customers don't go through review — send to app
    if (session.user.role === "customer") throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [{ title: translate("قيد المراجعة | طلبات بيتك", "Under review | Talabat Betak") }],
  }),
  component: AuthPending,
});

const roleConfig = {
  partner: {
    icon: "storefront",
    title: ["تم استلام طلب تسجيل مطعمك!", "Your restaurant registration was received!"],
    subtitle: ["فريق طلبات بيتك بيراجع بياناتك دلوقتي", "The Talabat Betak team is reviewing your information"],
    steps: [
      { label: ["استلام الطلب", "Application received"], done: true, active: false },
      { label: ["مراجعة البيانات", "Information review"], done: false, active: true },
      { label: ["تنشيط الحساب", "Account activation"], done: false, active: false },
    ],
    eta: ["خلال 24–48 ساعة عمل", "Within 24–48 business hours"],
    nextTitle: ["إيه اللي هيحصل بعد كده؟", "What happens next?"],
    nextSteps: [
      { icon: "reviews", text: ["هيراجع الفريق بياناتك والصور", "Our team will review your information and images"] },
      { icon: "call", text: ["ممكن نتواصل معاك تليفونياً للتأكيد", "We may call you to confirm your details"] },
      { icon: "storefront", text: ["بعد القبول هتقدر تضيف المنيو وتستقبل طلبات", "After approval, you can add your menu and receive orders"] },
    ],
    dashboardTo: "/partner",
    dashboardLabel: ["لوحة التحكم (عرض فقط)", "Dashboard (view only)"],
  },
  driver: {
    icon: "two_wheeler",
    title: ["تم إرسال طلبك للمراجعة!", "Your application was submitted for review!"],
    subtitle: ["فريق التوثيق بيراجع مستنداتك الآن", "The verification team is reviewing your documents"],
    steps: [
      { label: ["رفع المستندات", "Documents uploaded"], done: true, active: false },
      { label: ["مراجعة التوثيق", "Verification review"], done: false, active: true },
      { label: ["تفعيل الحساب", "Account activation"], done: false, active: false },
    ],
    eta: ["خلال 24–72 ساعة عمل", "Within 24–72 business hours"],
    nextTitle: ["ماذا يحدث بعد ذلك؟", "What happens next?"],
    nextSteps: [
      { icon: "fact_check", text: ["بيتم التحقق من الرقم القومي ورخصة القيادة", "Your national ID and driving license will be verified"] },
      { icon: "sms", text: ["هتوصلك رسالة SMS لما الحساب يتفعّل", "You will receive an SMS when your account is activated"] },
      { icon: "two_wheeler", text: ["بعد القبول تقدر تبدأ تستقبل عروض التوصيل فوراً", "After approval, you can immediately receive delivery offers"] },
    ],
    dashboardTo: "/driver",
    dashboardLabel: ["صفحتي (عرض فقط)", "My page (view only)"],
  },
} as const;

// ─── Storage helpers ──────────────────────────────────────────────────────────

function storageUrl(objectPath: string): string {
  const token = getToken();
  return `/api/storage${objectPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

async function uploadFileToStorage(file: File): Promise<string> {
  const token = getToken();
  // POST the raw file bytes; server validates type via magic-byte detection
  const res = await fetch("/api/storage/uploads", {
    method: "POST",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
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

// ─── Driver document slot ─────────────────────────────────────────────────────

type DocKey = "nationalIdFrontUrl" | "nationalIdBackUrl" | "criminalRecordUrl" | "licenseUrl";

const driverDocs: { key: DocKey; label: string; accept: string }[] = [
  { key: "nationalIdFrontUrl",  label: "صورة الرقم القومي (وجه)",         accept: "image/*" },
  { key: "nationalIdBackUrl",   label: "صورة الرقم القومي (ظهر)",        accept: "image/*" },
  { key: "criminalRecordUrl",   label: "الفيش والتشبيه (السجل الجنائي)", accept: "image/*,application/pdf" },
  { key: "licenseUrl",          label: "رخصة القيادة",                    accept: "image/*" },
];

function DocSlot({
  label,
  accept,
  objectPath,
  uploading,
  onFile,
}: {
  label: string;
  accept: string;
  objectPath: string | null;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  const uploaded = !!objectPath;
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-card border p-md transition ${
        uploaded ? "border-success bg-success/5" : "border-outline-variant"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        {uploaded ? (
          <img
            src={storageUrl(objectPath)}
            alt={label}
            className="size-10 shrink-0 rounded-button border border-outline-variant object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Icon
            name={uploading ? "hourglass_empty" : "description"}
            className={`shrink-0 text-[20px] ${uploading ? "animate-spin text-primary" : "text-on-surface-variant"}`}
          />
        )}
        <span className="truncate font-body-md text-body-md text-on-surface">{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {uploaded && (
          <span className="flex items-center gap-1 font-label-md text-label-md text-success">
            <Icon name="check_circle" className="text-[14px]" />
            {t("تم", "Done")}
          </span>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center gap-1 rounded-button px-3 py-1.5 font-label-md text-label-md transition ${
            uploading
              ? "cursor-wait bg-surface-container text-on-surface-variant"
              : uploaded
              ? "bg-secondary-container/50 text-on-secondary-container"
              : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          <Icon name={uploading ? "hourglass_empty" : uploaded ? "refresh" : "upload"} className="text-[14px]" />
          {uploading ? t("جاري...", "Uploading...") : uploaded ? t("تغيير", "Change") : t("رفع", "Upload")}
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) { onFile(f); e.target.value = ""; }
        }}
      />
    </div>
  );
}

// ─── Partner image upload slot ────────────────────────────────────────────────

function ImageUploadSlot({
  label,
  icon,
  objectPath,
  uploading,
  onFile,
}: {
  label: string;
  icon: string;
  objectPath: string | null;
  uploading: boolean;
  onFile: (file: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();
  return (
    <label
      className="relative flex min-h-[7rem] cursor-pointer flex-col items-center justify-center gap-1.5 overflow-hidden rounded-card border-2 border-dashed border-outline-variant transition hover:border-secondary"
      onClick={(e) => { e.preventDefault(); inputRef.current?.click(); }}
    >
      {objectPath ? (
        <>
          <img src={storageUrl(objectPath)} alt={label} className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40">
            <Icon name="refresh" className="text-[20px] text-white" />
            <span className="font-label-md text-label-md text-white">{t("تغيير", "Change")}</span>
          </div>
        </>
      ) : uploading ? (
        <>
          <Icon name="hourglass_empty" className="animate-spin text-[24px] text-primary" />
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

// ─── Main component ───────────────────────────────────────────────────────────

function AuthPending() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = getSession();
  const role = session?.user.role as "partner" | "driver" | undefined;
  const cfg = role ? roleConfig[role] : roleConfig.driver;

  // Application status from the server
  const [appStatus, setAppStatus] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [statusError, setStatusError] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);

  // Update documents panel
  const [showUpdate, setShowUpdate] = useState(false);

  // Driver doc paths
  const [driverDocPaths, setDriverDocPaths] = useState<Record<DocKey, string | null>>({
    nationalIdFrontUrl: null,
    nationalIdBackUrl: null,
    criminalRecordUrl: null,
    licenseUrl: null,
  });
  const [driverDocUploading, setDriverDocUploading] = useState<Record<DocKey, boolean>>({
    nationalIdFrontUrl: false,
    nationalIdBackUrl: false,
    criminalRecordUrl: false,
    licenseUrl: false,
  });

  // Partner image paths
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);

  const [patchError, setPatchError] = useState("");
  const [patchSuccess, setPatchSuccess] = useState(false);
  const [patching, setPatching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const token = getToken();
      setStatusLoading(true);
      try {
        const r = await fetch("/api/onboard/status", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!r.ok) throw new Error(t("تعذر تحميل حالة الطلب", "Unable to load application status"));
        const d = (await r.json()) as { status?: string | null; rejectionReason?: string | null };
        if (!cancelled) { setAppStatus(d.status ?? null); setRejectionReason(d.rejectionReason ?? null); setStatusError(""); }
      } catch {
        if (!cancelled) setStatusError(t("تعذر تحديث حالة الطلب. تحقق من الاتصال وحاول مجدداً.", "Unable to update application status. Check your connection and try again."));
      } finally {
        if (!cancelled) setStatusLoading(false);
      }
    }

    refresh();
    const interval = setInterval(refresh, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  function manualRefresh() {
    const token = getToken();
    setStatusLoading(true);
    fetch("/api/onboard/status", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d: { status?: string | null; rejectionReason?: string | null }) => { setAppStatus(d.status ?? null); setRejectionReason(d.rejectionReason ?? null); setStatusError(""); })
      .catch(() => setStatusError(t("تعذر تحديث حالة الطلب. حاول مجدداً.", "Unable to update application status. Please try again.")))
      .finally(() => setStatusLoading(false));
  }

  const canUpdate = appStatus === "PENDING" || appStatus === "REJECTED";

  async function handleLogout() {
    await logoutSession();
    navigate({ to: "/auth/login" });
  }

  // ── Driver doc upload ──
  async function handleDriverDocFile(key: DocKey, file: File) {
    if (file.size > 10_000_000) { setPatchError(t("حجم الملف كبير جداً — الحد الأقصى 10 ميجابايت", "File is too large — maximum size is 10 MB")); return; }
    const mime = file.type || "application/octet-stream";
    if (!mime.startsWith("image/") && mime !== "application/pdf") {
      setPatchError(t("نوع الملف غير مقبول — يُسمح فقط بالصور (JPG، PNG، …) أو ملفات PDF", "Unsupported file type — only images (JPG, PNG, …) or PDF files are allowed"));
      return;
    }
    setDriverDocUploading((prev) => ({ ...prev, [key]: true }));
    setPatchError("");
    setPatchSuccess(false);
    try {
      const objectPath = await uploadFileToStorage(file);
      setDriverDocPaths((prev) => ({ ...prev, [key]: objectPath }));
    } catch (err) {
      setPatchError(err instanceof Error ? err.message : t("فشل رفع المستند", "Document upload failed"));
    } finally {
      setDriverDocUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  // ── Partner image upload ──
  async function handlePartnerImageFile(
    file: File,
    setUrl: (v: string | null) => void,
    setUploading: (v: boolean) => void,
  ) {
    if (file.size > 10_000_000) { setPatchError(t("حجم الملف كبير جداً — الحد الأقصى 10 ميجابايت", "File is too large — maximum size is 10 MB")); return; }
    const mime = file.type || "application/octet-stream";
    if (!mime.startsWith("image/")) {
      setPatchError(t("نوع الملف غير مقبول — يُسمح فقط بالصور (JPG، PNG، …)", "Unsupported file type — only images (JPG, PNG, …) are allowed"));
      return;
    }
    setUploading(true);
    setPatchError("");
    setPatchSuccess(false);
    try {
      const objectPath = await uploadFileToStorage(file);
      setUrl(objectPath);
    } catch (err) {
      setPatchError(err instanceof Error ? err.message : t("فشل رفع الصورة", "Image upload failed"));
    } finally {
      setUploading(false);
    }
  }

  // ── Submit update ──
  async function handleSaveUpdate() {
    const token = getToken();
    setPatchError("");
    setPatchSuccess(false);

    if (role === "driver") {
      const uploads = Object.entries(driverDocPaths).filter(([, v]) => v !== null);
      if (uploads.length === 0) { setPatchError(t("من فضلك ارفع مستنداً واحداً على الأقل", "Please upload at least one document")); return; }
      setPatching(true);
      try {
        const body: Record<string, string> = {};
        uploads.forEach(([k, v]) => { if (v) body[k] = v; });
        const res = await fetch("/api/onboard/driver", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setPatchError(data?.error ?? t("حدث خطأ أثناء الحفظ", "An error occurred while saving"));
          return;
        }
        setPatchSuccess(true);
        setShowUpdate(false);
        // Reset uploaded paths
        setDriverDocPaths({ nationalIdFrontUrl: null, nationalIdBackUrl: null, criminalRecordUrl: null, licenseUrl: null });
      } catch {
        setPatchError(t("تعذر الاتصال بالخادم، حاول مرة أخرى", "Unable to connect to the server. Please try again."));
      } finally {
        setPatching(false);
      }
    } else if (role === "partner") {
      if (!logoUrl && !coverUrl) { setPatchError(t("من فضلك ارفع صورة واحدة على الأقل", "Please upload at least one image")); return; }
      setPatching(true);
      try {
        const body: Record<string, string> = {};
        if (logoUrl) body.logoUrl = logoUrl;
        if (coverUrl) body.coverUrl = coverUrl;
        const res = await fetch("/api/onboard/partner", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(body),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { error?: string } | null;
          setPatchError(data?.error ?? t("حدث خطأ أثناء الحفظ", "An error occurred while saving"));
          return;
        }
        setPatchSuccess(true);
        setShowUpdate(false);
        setLogoUrl(null);
        setCoverUrl(null);
      } catch {
        setPatchError(t("تعذر الاتصال بالخادم، حاول مرة أخرى", "Unable to connect to the server. Please try again."));
      } finally {
        setPatching(false);
      }
    }
  }

  const anyDocUploading = Object.values(driverDocUploading).some(Boolean) || logoUploading || coverUploading;

  return (
    <AuthShell title="" subtitle="">

      {/* Success hero */}
      <div className="flex flex-col items-center gap-md py-sm text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-success/15">
          <Icon name="check_circle" className="text-[48px] text-success" filled />
        </span>
        <div>
         <p className="font-headline-md text-headline-md text-on-surface">{t(cfg.title[0], cfg.title[1])}</p>
         <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{t(cfg.subtitle[0], cfg.subtitle[1])}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="info">
            <Icon name="schedule" className="text-[14px]" />
             {t(cfg.eta[0], cfg.eta[1])}
          </Badge>
          <button
            type="button"
            onClick={manualRefresh}
            disabled={statusLoading}
            title={t("تحديث الحالة", "Refresh status")}
            className="flex items-center justify-center rounded-full p-1 text-on-surface-variant transition hover:bg-surface-container disabled:opacity-50"
          >
            <Icon
              name="refresh"
              className={`text-[18px] ${statusLoading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        {appStatus && (
          <p className="font-label-md text-label-md text-on-surface-variant">
             {t("الحالة الحالية:", "Current status:")}{" "}
            <span className={`font-label-lg ${
              appStatus === "APPROVED" || appStatus === "ACTIVE" ? "text-success" :
              appStatus === "REJECTED" ? "text-error" :
              "text-secondary"
            }`}>
               {appStatus === "PENDING" ? t("قيد الانتظار", "Pending") : appStatus === "UNDER_REVIEW" ? t("قيد المراجعة", "Under review") : appStatus === "APPROVED" ? t("مقبول", "Approved") : appStatus === "ACTIVE" ? t("نشط", "Active") : appStatus === "REJECTED" ? t("مرفوض", "Rejected") : appStatus === "SUSPENDED" ? t("موقوف", "Suspended") : appStatus}
            </span>
          </p>
        )}
        {appStatus === "REJECTED" && rejectionReason ? (
          <div className="w-full rounded-card bg-error-container p-md text-right text-on-error-container">
             <p className="font-label-lg text-label-lg">{t("سبب الرفض", "Rejection reason")}</p>
            <p className="font-body-md text-body-md">{rejectionReason}</p>
          </div>
        ) : null}
        {statusError ? <p className="font-label-md text-label-md text-error">{statusError}</p> : null}
      </div>

      {/* Progress stepper */}
      <div className="rounded-card border border-outline-variant p-md">
         <p className="mb-3 font-label-lg text-label-lg text-on-surface">{t("مسار المراجعة", "Review process")}</p>
        <div className="flex items-center gap-1">
          {cfg.steps.map((step, i) => (
             <div key={step.label[0]} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={`flex size-8 items-center justify-center rounded-full transition ${
                    step.done
                      ? "bg-success text-on-primary"
                      : step.active
                      ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {step.done ? (
                    <Icon name="check" className="text-[16px]" />
                  ) : (
                    <span className="font-label-md text-[11px]">{i + 1}</span>
                  )}
                </span>
                <span className={`text-center font-label-md text-[10px] ${step.active ? "font-label-lg text-on-surface" : "text-on-surface-variant"}`}>
                    {t(step.label[0], step.label[1])}
                </span>
              </div>
              {i < cfg.steps.length - 1 && (
                <span className={`mb-4 h-0.5 flex-1 ${step.done ? "bg-success" : "bg-outline-variant"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Update documents panel (PENDING or REJECTED only) */}
      {canUpdate && (
        <div className="rounded-card border border-outline-variant">
          <button
            type="button"
            onClick={() => { setShowUpdate((v) => !v); setPatchError(""); setPatchSuccess(false); }}
            className="flex w-full items-center justify-between p-md text-right"
          >
            <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
              <Icon name="upload_file" className="text-[18px] text-secondary" />
               {t("تحديث المستندات", "Update documents")}
            </span>
            <Icon name={showUpdate ? "expand_less" : "expand_more"} className="text-[20px] text-on-surface-variant" />
          </button>

          {showUpdate && (
            <div className="flex flex-col gap-3 border-t border-outline-variant p-md">
              <p className="font-label-md text-label-md text-on-surface-variant">
                {role === "driver"
                   ? t("ارفع المستندات التي تريد تحديثها — يكفي رفع المستندات الناقصة أو المرفوضة فقط.", "Upload the documents you want to update — only missing or rejected documents are needed.")
                   : t("يمكنك استبدال شعار مطعمك أو صورة الغلاف.", "You can replace your restaurant logo or cover image.")}
              </p>

              {role === "driver" && (
                <div className="flex flex-col gap-2">
                  {driverDocs.map((d) => (
                    <DocSlot
                      key={d.key}
                       label={t(d.label, d.key === "nationalIdFrontUrl" ? "National ID (front)" : d.key === "nationalIdBackUrl" ? "National ID (back)" : d.key === "criminalRecordUrl" ? "Criminal record certificate" : "Driving license")}
                      accept={d.accept}
                      objectPath={driverDocPaths[d.key]}
                      uploading={driverDocUploading[d.key]}
                      onFile={(file) => handleDriverDocFile(d.key, file)}
                    />
                  ))}
                </div>
              )}

              {role === "partner" && (
                <div className="grid grid-cols-2 gap-2">
                  <ImageUploadSlot
                     label={t("شعار المطعم", "Restaurant logo")}
                    icon="add_photo_alternate"
                    objectPath={logoUrl}
                    uploading={logoUploading}
                    onFile={(f) => handlePartnerImageFile(f, setLogoUrl, setLogoUploading)}
                  />
                  <ImageUploadSlot
                     label={t("صورة الغلاف", "Cover image")}
                    icon="image"
                    objectPath={coverUrl}
                    uploading={coverUploading}
                    onFile={(f) => handlePartnerImageFile(f, setCoverUrl, setCoverUploading)}
                  />
                </div>
              )}

              {patchError && (
                <div className="flex items-center gap-2 rounded-card bg-error-container p-md">
                  <Icon name="error" className="text-[18px] text-on-error-container" />
                  <p className="font-label-md text-label-md text-on-error-container">{patchError}</p>
                </div>
              )}

              <Button
                className="w-full"
                icon="save"
                onClick={handleSaveUpdate}
                disabled={patching || anyDocUploading}
              >
                 {patching ? t("جاري الحفظ...", "Saving...") : t("حفظ التحديثات", "Save updates")}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Success feedback after update */}
      {patchSuccess && (
        <div className="flex items-center gap-2 rounded-card bg-success/10 p-md">
          <Icon name="check_circle" className="text-[18px] text-success" />
           <p className="font-label-md text-label-md text-success">{t("تم تحديث المستندات بنجاح — سيراجعها الفريق قريباً.", "Documents updated successfully — the team will review them soon.")}</p>
        </div>
      )}

      {/* Next steps */}
      <div className="rounded-card border border-outline-variant p-md">
         <p className="mb-3 font-label-lg text-label-lg text-on-surface">{t(cfg.nextTitle[0], cfg.nextTitle[1])}</p>
        <div className="flex flex-col gap-3">
          {cfg.nextSteps.map((s) => (
             <div key={s.text[0]} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <Icon name={s.icon} className="text-[18px]" />
              </span>
                <p className="pt-1 font-body-md text-body-md text-on-surface-variant">{t(s.text[0], s.text[1])}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="flex items-start gap-2 rounded-card bg-surface-container-low p-md">
        <Icon name="support_agent" className="mt-0.5 text-[18px] text-on-surface-variant" />
        <p className="font-label-md text-label-md text-on-surface-variant">
           {t("عندك استفسار؟ تواصل معنا على", "Have a question? Contact us at")}{" "}
          <a href="mailto:support@tasweqet.eg" className="text-secondary underline">
            support@tasweqet.eg
          </a>
        </p>
      </div>

      <Button
        className="w-full"
        icon={cfg.icon}
        onClick={() => navigate({ to: cfg.dashboardTo as Parameters<typeof navigate>[0]["to"] })}
      >
         {t(cfg.dashboardLabel[0], cfg.dashboardLabel[1])}
      </Button>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-1.5 font-label-md text-label-md text-on-surface-variant transition hover:text-error"
      >
        <Icon name="logout" className="text-[16px]" />
         {t("تسجيل الخروج", "Log out")}
      </button>

    </AuthShell>
  );
}
