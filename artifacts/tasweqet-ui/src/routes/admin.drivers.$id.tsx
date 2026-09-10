import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Button, Card, DashboardShell, Icon, SectionTitle, StatusBadge } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { useEffect } from "react";
import { getToken } from "@/lib/auth-session";
import { fetchDriverApplication, parseAppRouteId, updateDriverStatus, type ApplicationDecision, type ApplicationDocument, type DriverApplication } from "@/lib/tb/applications";

function storageUrl(objectPath: string): string {
  const token = getToken();
  return `/api/storage${objectPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export const Route = createFileRoute("/admin/drivers/$id")({
  head: () => ({
    meta: [
      { title: "ملف المندوب | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "مراجعة مستندات المندوب وحالة التوثيق والمحفظة." },
      { property: "og:title", content: "ملف المندوب | طلبات بيتك" },
      { property: "og:description", content: "مراجعة توثيق المندوب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDriverDetail,
});

const appStatusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  UNDER_REVIEW: "تحت المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
};
const driverTransitions: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["SUSPENDED"],
  SUSPENDED: ["APPROVED"],
  REJECTED: ["UNDER_REVIEW"],
};

const docLabels: Record<string, string> = {
  national_id_front: "صورة الرقم القومي (وجه)",
  national_id_back: "صورة الرقم القومي (ظهر)",
  criminal_record: "الفيش والتشبيه (السجل الجنائي)",
  license: "رخصة القيادة",
};

function StoredDriverDetail({ appId }: { appId: number }) {
  const [app, setApp] = useState<DriverApplication | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [documentHistory, setDocumentHistory] = useState<ApplicationDocument[]>([]);
  const [decisions, setDecisions] = useState<ApplicationDecision[]>([]);
  useEffect(() => {
    fetchDriverApplication(appId)
      .then((detail) => { setApp(detail.application); setDocumentHistory(detail.documents); setDecisions(detail.decisions); })
      .catch(() => setApp(null));
  }, [appId]);

  async function setStatus(status: string) {
    if (!app || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateDriverStatus(app.id, status, status === "REJECTED" ? reason : undefined);
      const detail = await fetchDriverApplication(app.id);
      setApp(detail.application); setDocumentHistory(detail.documents); setDecisions(detail.decisions);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "حدث خطأ — حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  const uploadedDocs: { key: string; label: string; url: string; uploadedAt: string | null }[] = [
    { key: "nationalIdFrontUrl", label: docLabels["national_id_front"], url: app?.nationalIdFrontUrl ?? "", uploadedAt: app?.nationalIdFrontUploadedAt ?? null },
    { key: "nationalIdBackUrl",  label: docLabels["national_id_back"],  url: app?.nationalIdBackUrl ?? "",  uploadedAt: app?.nationalIdBackUploadedAt ?? null },
    { key: "criminalRecordUrl",  label: docLabels["criminal_record"],   url: app?.criminalRecordUrl ?? "",  uploadedAt: app?.criminalRecordUploadedAt ?? null },
    { key: "licenseUrl",         label: docLabels["license"],           url: app?.licenseUrl ?? "",         uploadedAt: app?.licenseUploadedAt ?? null },
  ].filter((d) => d.url);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title={app?.fullName ?? "طلب تسجيل مندوب"}>
      <div className="tb-stagger flex flex-col gap-md">
        {app === undefined ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">جاري التحميل...</Card>
        ) : app === null ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">لم يتم العثور على الطلب.</Card>
        ) : (
          <>
            <Card className="flex flex-wrap items-center justify-between gap-sm p-md">
              <div>
                <p className="font-headline-md text-headline-md text-on-surface">{app.fullName}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  {app.phone ?? "—"} · {app.area} · {app.vehicleType}
                </p>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  تاريخ التقديم: {new Date(app.createdAt).toLocaleDateString("ar-EG")}
                </p>
              </div>
              <StatusBadge status={app.status} label={appStatusLabels[app.status] ?? app.status} />
            </Card>
            <Card className="p-md">
              <SectionTitle title="سجل نسخ المستندات" icon="history" />
              {documentHistory.length === 0 ? <p>لا توجد مستندات.</p> : documentHistory.map((doc) => (
                <div key={doc.id} className="mb-2 flex items-center justify-between rounded-card bg-surface-container p-3">
                  <span>{docLabels[doc.documentType] ?? doc.documentType} · النسخة {doc.version} · {new Date(doc.uploadedAt).toLocaleString("ar-EG")}</span>
                  <a href={storageUrl(doc.objectPath)} target="_blank" rel="noreferrer" className="text-primary">فتح عبر التخزين الآمن</a>
                </div>
              ))}
            </Card>
            <Card className="p-md">
              <SectionTitle title="سجل القرارات" icon="fact_check" />
              {decisions.length === 0 ? <p>لا توجد قرارات بعد.</p> : decisions.map((decision) => <p key={decision.id} className="mb-2">{decision.fromStatus} ← {decision.toStatus} · مشرف #{decision.actorAdminId} · {decision.reason ?? "بدون سبب"} · {new Date(decision.createdAt).toLocaleString("ar-EG")}</p>)}
            </Card>
            <Card className="p-md">
              <SectionTitle title="المستندات المرفوعة" icon="description" />
              {uploadedDocs.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">لا توجد مستندات مرفوعة.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {uploadedDocs.map((doc) => {
                    const isReUploaded = doc.uploadedAt !== null;
                    const timestampLabel = isReUploaded
                      ? `أُعيد الرفع: ${new Date(doc.uploadedAt!).toLocaleString("ar-EG")}`
                      : `رُفع: ${new Date(app!.createdAt).toLocaleString("ar-EG")}`;
                    return (
                      <div key={doc.key} className="flex flex-col gap-2 rounded-card border border-outline-variant overflow-hidden">
                        <a href={storageUrl(doc.url)} target="_blank" rel="noreferrer" className="block">
                          <img
                            src={storageUrl(doc.url)}
                            alt={doc.label}
                            className="w-full h-40 object-cover bg-surface-container"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = "none";
                              img.nextElementSibling?.classList.remove("hidden");
                            }}
                          />
                          <div className="hidden flex items-center justify-center h-40 bg-surface-container">
                            <Icon name="description" className="text-[40px] text-on-surface-variant" />
                          </div>
                        </a>
                        <div className="flex items-center gap-2 px-3 py-2">
                          <Icon name="check_circle" className="text-[16px] text-success flex-shrink-0" />
                          <span className="font-label-md text-label-md text-on-surface truncate">{doc.label}</span>
                          <a
                            href={storageUrl(doc.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="mr-auto flex items-center gap-1 font-label-md text-label-md text-primary"
                          >
                            <Icon name="open_in_new" className="text-[14px]" />
                            فتح
                          </a>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                          {isReUploaded ? (
                            <Badge tone="warn" className="text-[11px]">
                              <Icon name="upload" className="text-[11px]" />
                              أُعيد الرفع
                            </Badge>
                          ) : null}
                          <span className="font-label-sm text-label-sm text-on-surface-variant">{timestampLabel}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
            <Card className="p-md">
              <SectionTitle title="إجراء المراجعة" icon="verified" />
              {app.status === "APPROVED" ? (
                <p className="mb-sm font-body-md text-body-md text-success">تمت الموافقة على هذا المندوب — يمكنه استلام الطلبات.</p>
              ) : app.status === "REJECTED" ? (
                <p className="mb-sm font-body-md text-body-md text-error">تم رفض هذا الطلب.</p>
              ) : app.status === "SUSPENDED" ? (
                <p className="mb-sm font-body-md text-body-md text-error">هذا المندوب موقوف حالياً.</p>
              ) : (
                <p className="mb-sm font-body-md text-body-md text-on-surface-variant">راجع بيانات ومستندات المندوب ثم اعتمد أو ارفض التوثيق.</p>
              )}
              <div className="flex flex-wrap gap-sm">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض (مطلوب عند الرفض)" className="min-w-[260px] rounded-button border border-outline-variant px-3 py-2" />
                {driverTransitions[app.status]?.filter((status) => status !== "REJECTED").map((status) => (
                  <Button key={status} icon={status === "SUSPENDED" ? "pause_circle" : "check_circle"} variant={status === "SUSPENDED" ? "danger" : "primary"} disabled={busy} onClick={() => setStatus(status)}>
                    {status === "UNDER_REVIEW" ? "بدء المراجعة" : status === "SUSPENDED" ? "إيقاف المندوب" : "موافقة على التوثيق"}
                  </Button>
                ))}
                {driverTransitions[app.status]?.includes("REJECTED") ? (
                  <Button icon="cancel" variant="danger" disabled={busy} onClick={() => setStatus("REJECTED")}>
                    رفض الطلب
                  </Button>
                ) : null}
              </div>
              {actionError ? <p className="mt-sm font-label-md text-label-md text-error">{actionError}</p> : null}
            </Card>
          </>
        )}
      </div>
    </DashboardShell>
  );
}

function AdminDriverDetail() {
  const { id } = Route.useParams();
  const appId = parseAppRouteId(id);
  if (appId !== null) return <StoredDriverDetail appId={appId} />;
  return <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="طلب غير موجود"><Card className="p-md text-error">معرّف الطلب غير صحيح.</Card></DashboardShell>;
}
