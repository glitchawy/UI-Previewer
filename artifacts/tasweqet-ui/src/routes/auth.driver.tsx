import { useRef, useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthShell, Badge, Button, Icon, StatusBadge } from "@/components/tb/shell";
import { getSession, getRoleDashboard, getToken } from "@/lib/auth-session";

/** Build a URL to serve a stored object, attaching the session token as a query param
 *  so plain <img src> and CSS backgrounds work without Bearer header support. */
function storageUrl(objectPath: string): string {
  const token = getToken();
  return `/api/storage${objectPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export const Route = createFileRoute("/auth/driver")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "driver") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: "تسجيل مندوب توصيل | طلبات بيتك" },
      { name: "description", content: "انضم كمندوب توصيل وارفع مستنداتك لتفعيل حسابك." },
    ],
  }),
  component: AuthDriver,
});

const areas = ["المعادي", "مدينة نصر", "الدقي", "شبرا", "مصر الجديدة", "الزمالك", "الهرم", "المهندسين"];
const vehicles = ["موتوسيكل", "دراجة هوائية", "سيارة"];

const statusLabels: Record<string, string> = {
  PENDING: "قيد الإرسال",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
};

type DocKey = "nationalIdFrontUrl" | "nationalIdBackUrl" | "criminalRecordUrl" | "licenseUrl";

const requiredDocs: { key: DocKey; label: string; accept: string }[] = [
  { key: "nationalIdFrontUrl",  label: "صورة الرقم القومي (وجه)",              accept: "image/*" },
  { key: "nationalIdBackUrl",   label: "صورة الرقم القومي (ظهر)",             accept: "image/*" },
  { key: "criminalRecordUrl",   label: "الفيش والتشبيه (السجل الجنائي)",      accept: "image/*,application/pdf" },
  { key: "licenseUrl",          label: "رخصة القيادة",                         accept: "image/*" },
];

/** Upload a file to object storage via presigned URL. Returns objectPath or throws. */
async function uploadFileToStorage(file: File): Promise<string> {
  const token = getToken();
  // Step 1: get presigned URL
  const urlRes = await fetch("/api/storage/uploads/request-url", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type || "application/octet-stream" }),
  });
  if (!urlRes.ok) throw new Error("تعذّر الحصول على رابط الرفع");
  const { uploadURL, objectPath } = (await urlRes.json()) as { uploadURL: string; objectPath: string };
  // Step 2: PUT directly to GCS
  const putRes = await fetch(uploadURL, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!putRes.ok) throw new Error("فشل رفع الملف إلى التخزين");
  return objectPath;
}

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
  const uploaded = !!objectPath;

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-card border p-md transition ${
        uploaded ? "border-success bg-success/5" : "border-outline-variant"
      }`}
    >
      <div className="flex items-center gap-2 min-w-0">
        {uploaded ? (
          <img
            src={storageUrl(objectPath)}
            alt={label}
            className="size-10 rounded-button object-cover border border-outline-variant flex-shrink-0"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        ) : (
          <Icon
            name={uploading ? "hourglass_empty" : "description"}
            className={`text-[20px] flex-shrink-0 ${uploading ? "text-primary animate-spin" : "text-on-surface-variant"}`}
          />
        )}
        <span className="font-body-md text-body-md text-on-surface truncate">{label}</span>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        {uploaded && (
          <span className="flex items-center gap-1 font-label-md text-label-md text-success">
            <Icon name="check_circle" className="text-[14px]" />
            تم
          </span>
        )}
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className={`flex items-center gap-1 rounded-button px-3 py-1.5 font-label-md text-label-md transition ${
            uploading
              ? "bg-surface-container text-on-surface-variant cursor-wait"
              : uploaded
              ? "bg-secondary-container/50 text-on-secondary-container"
              : "bg-secondary-container text-on-secondary-container"
          }`}
        >
          <Icon name={uploading ? "hourglass_empty" : uploaded ? "refresh" : "upload"} className="text-[14px]" />
          {uploading ? "جاري..." : uploaded ? "تغيير" : "رفع"}
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

function AuthDriver() {
  const navigate = useNavigate();
  const session = getSession();

  const [fullName, setFullName] = useState("");
  const [area, setArea] = useState(areas[0]);
  const [vehicle, setVehicle] = useState(vehicles[0]);

  const [docPaths, setDocPaths] = useState<Record<DocKey, string | null>>({
    nationalIdFrontUrl: null,
    nationalIdBackUrl: null,
    criminalRecordUrl: null,
    licenseUrl: null,
  });
  const [docUploading, setDocUploading] = useState<Record<DocKey, boolean>>({
    nationalIdFrontUrl: false,
    nationalIdBackUrl: false,
    criminalRecordUrl: false,
    licenseUrl: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const uploadedCount = Object.values(docPaths).filter(Boolean).length;
  const allUploaded = uploadedCount === requiredDocs.length;

  async function handleDocFile(key: DocKey, file: File) {
    setDocUploading((prev) => ({ ...prev, [key]: true }));
    setError("");
    try {
      const objectPath = await uploadFileToStorage(file);
      setDocPaths((prev) => ({ ...prev, [key]: objectPath }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل رفع المستند");
    } finally {
      setDocUploading((prev) => ({ ...prev, [key]: false }));
    }
  }

  async function handleSubmit() {
    if (!fullName.trim()) { setError("من فضلك أدخل اسمك الكامل"); return; }
    if (!allUploaded) { setError(`برجاء رفع جميع المستندات المطلوبة (${uploadedCount}/${requiredDocs.length})`); return; }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/onboard/driver", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.token ?? ""}`,
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          area,
          vehicleType: vehicle,
          documents: requiredDocs.filter((d) => docPaths[d.key]).map((d) => d.key).join(","),
          nationalIdFrontUrl: docPaths.nationalIdFrontUrl,
          nationalIdBackUrl: docPaths.nationalIdBackUrl,
          criminalRecordUrl: docPaths.criminalRecordUrl,
          licenseUrl: docPaths.licenseUrl,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(data?.error ?? "حدث خطأ أثناء الإرسال، حاول مرة أخرى");
        setSubmitting(false);
        return;
      }
      navigate({ to: "/auth/pending" });
    } catch {
      setError("تعذر الاتصال بالخادم، حاول مرة أخرى");
      setSubmitting(false);
    }
  }

  return (
    <AuthShell title="تسجيل مندوب توصيل" subtitle="انضم لأسطول طلبات بيتك واربح من توصيلاتك" back="/auth/register">

      {/* Account info banner */}
      <div className="flex items-center gap-2 rounded-card bg-secondary-container p-md">
        <Icon name="phone" className="text-[18px] text-on-secondary-container" />
        <p className="font-label-md text-label-md text-on-secondary-container">
          الحساب مرتبط بـ{" "}
          <span className="font-label-lg" dir="ltr">+20{session?.user.phone}</span>
        </p>
      </div>

      {/* Personal info */}
      <p className="font-label-lg text-label-lg text-on-surface">البيانات الشخصية</p>

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">الاسم بالكامل</span>
        <span className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 focus-within:border-secondary">
          <Icon name="person" className="text-[20px] text-outline" />
          <input
            type="text"
            placeholder="محمود سعيد"
            value={fullName}
            onChange={(e) => { setFullName(e.target.value); setError(""); }}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
          />
        </span>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">المنطقة</span>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-secondary"
        >
          {areas.map((a) => <option key={a}>{a}</option>)}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">نوع المركبة</span>
        <div className="grid grid-cols-3 gap-2">
          {vehicles.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVehicle(v)}
              className={`rounded-button border py-2 font-label-md text-label-md transition ${
                vehicle === v
                  ? "border-2 border-secondary bg-secondary-container text-on-secondary-container"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface-variant"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </label>

      <hr className="border-outline-variant" />

      {/* Documents */}
      <div className="flex items-center justify-between">
        <p className="font-label-lg text-label-lg text-on-surface">المستندات المطلوبة</p>
        <Badge tone={allUploaded ? "success" : "neutral"}>
          {uploadedCount}/{requiredDocs.length} مستندات
        </Badge>
      </div>
      <p className="font-label-md text-label-md text-on-surface-variant -mt-2">
        يُقبل: صور (JPG / PNG) أو PDF
      </p>

      <div className="tb-stagger flex flex-col gap-2">
        {requiredDocs.map((d) => (
          <DocSlot
            key={d.key}
            label={d.label}
            accept={d.accept}
            objectPath={docPaths[d.key]}
            uploading={docUploading[d.key]}
            onFile={(file) => handleDocFile(d.key, file)}
          />
        ))}
      </div>

      {/* Review status preview */}
      <div>
        <p className="mb-2 font-label-lg text-label-lg text-on-surface">مسار المراجعة</p>
        <div className="flex items-center gap-1">
          {Object.keys(statusLabels).map((s, i, arr) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <span className={`flex size-7 items-center justify-center rounded-full font-label-md text-[11px] ${i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"}`}>
                  {i + 1}
                </span>
                <span className="text-center font-label-md text-[10px] text-on-surface-variant">{statusLabels[s]}</span>
              </div>
              {i < arr.length - 1 && <span className="mb-4 h-0.5 flex-1 bg-outline-variant" />}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <StatusBadge status="PENDING" label="الحالة الحالية: قيد الإرسال" />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-card bg-error-container/60 p-md">
        <Icon name="warning" className="mt-0.5 text-[18px] text-on-error-container" />
        <p className="font-label-md text-label-md text-on-error-container">
          لن تتمكن من استلام الطلبات حتى تكتمل مراجعة مستنداتك وتفعيل حسابك.
        </p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">{error}</p>
        </div>
      )}

      <Button className="w-full" icon="send" onClick={handleSubmit} disabled={submitting || Object.values(docUploading).some(Boolean)}>
        {submitting ? "جاري الإرسال..." : "إرسال للمراجعة"}
      </Button>

    </AuthShell>
  );
}
