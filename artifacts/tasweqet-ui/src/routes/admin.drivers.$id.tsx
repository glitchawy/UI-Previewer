import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Button, Card, DashboardShell, Icon, SectionTitle, StatusBadge } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { useEffect } from "react";
import { getToken } from "@/lib/auth-session";
import { fetchDriverApplication, parseAppRouteId, updateDriverStatus, type ApplicationDecision, type ApplicationDocument, type DriverApplication } from "@/lib/tb/applications";
import { adminDate, adminDateTime, adminNumber } from "@/lib/admin-i18n";
import { translate, useTranslation } from "@/lib/i18n";

function storageUrl(objectPath: string): string {
  const token = getToken();
  return `/api/storage${objectPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export const Route = createFileRoute("/admin/drivers/$id")({
  head: () => ({
    meta: [
      { title: translate("ملف المندوب | لوحة سوبر أدمن - طلبات بيتك", "Driver profile | Super admin panel - Talabat Betak") },
      { name: "description", content: translate("مراجعة مستندات المندوب وحالة التوثيق والمحفظة.", "Review driver documents, verification status, and wallet.") },
      { property: "og:title", content: translate("ملف المندوب | طلبات بيتك", "Driver profile | Talabat Betak") },
      { property: "og:description", content: translate("مراجعة توثيق المندوب.", "Review driver verification.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDriverDetail,
});

const driverTransitions: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["SUSPENDED"],
  SUSPENDED: ["APPROVED"],
  REJECTED: ["UNDER_REVIEW"],
};

function StoredDriverDetail({ appId }: { appId: number }) {
  const { t, locale } = useTranslation();
  const statusLabel = (status: string) => ({
    PENDING: t("بانتظار المراجعة", "Pending review"),
    UNDER_REVIEW: t("تحت المراجعة", "Under review"),
    APPROVED: t("معتمد", "Approved"),
    REJECTED: t("مرفوض", "Rejected"),
    SUSPENDED: t("موقوف", "Suspended"),
  }[status] ?? status);
  const documentLabel = (type: string) => ({
    national_id_front: t("صورة الرقم القومي (وجه)", "National ID (front)"),
    national_id_back: t("صورة الرقم القومي (ظهر)", "National ID (back)"),
    criminal_record: t("الفيش والتشبيه (السجل الجنائي)", "Criminal record"),
    license: t("رخصة القيادة", "Driver's license"),
  }[type] ?? type);
  const vehicleLabel = (type: string) => ({
    motorcycle: t("موتوسيكل", "Motorcycle"),
    motorbike: t("موتوسيكل", "Motorcycle"),
    bicycle: t("دراجة", "Bicycle"),
    car: t("سيارة", "Car"),
  }[type.toLowerCase()] ?? type);
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
      setActionError(err instanceof Error ? err.message : t("حدث خطأ — حاول مرة أخرى", "An error occurred — try again"));
    } finally {
      setBusy(false);
    }
  }

  const uploadedDocs: { key: string; label: string; url: string; uploadedAt: string | null }[] = [
    { key: "nationalIdFrontUrl", label: documentLabel("national_id_front"), url: app?.nationalIdFrontUrl ?? "", uploadedAt: app?.nationalIdFrontUploadedAt ?? null },
    { key: "nationalIdBackUrl",  label: documentLabel("national_id_back"),  url: app?.nationalIdBackUrl ?? "",  uploadedAt: app?.nationalIdBackUploadedAt ?? null },
    { key: "criminalRecordUrl",  label: documentLabel("criminal_record"),   url: app?.criminalRecordUrl ?? "",  uploadedAt: app?.criminalRecordUploadedAt ?? null },
    { key: "licenseUrl",         label: documentLabel("license"),           url: app?.licenseUrl ?? "",         uploadedAt: app?.licenseUploadedAt ?? null },
  ].filter((d) => d.url);

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={app?.fullName ?? t("طلب تسجيل مندوب", "Driver application")}>
      <div className="tb-stagger flex flex-col gap-md">
        {app === undefined ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">{t("جاري التحميل...", "Loading...")}</Card>
        ) : app === null ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">{t("لم يتم العثور على الطلب.", "Application not found.")}</Card>
        ) : (
          <>
            <Card className="flex flex-wrap items-center justify-between gap-sm p-md">
              <div>
                <p className="font-headline-md text-headline-md text-on-surface">{app.fullName}</p>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  {app.phone ?? "—"} · {app.area} · {vehicleLabel(app.vehicleType)}
                </p>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  {t("تاريخ التقديم: ", "Applied: ")}{adminDate(app.createdAt, locale)}
                </p>
              </div>
              <StatusBadge status={app.status} label={statusLabel(app.status)} />
            </Card>
            <Card className="p-md">
              <SectionTitle title={t("سجل نسخ المستندات", "Document version history")} icon="history" />
              {documentHistory.length === 0 ? <p>{t("لا توجد مستندات.", "No documents.")}</p> : documentHistory.map((doc) => (
                <div key={doc.id} className="mb-2 flex items-center justify-between rounded-card bg-surface-container p-3">
                  <span>{documentLabel(doc.documentType)} · {t("النسخة", "Version")} {adminNumber(doc.version, locale)} · {adminDateTime(doc.uploadedAt, locale)}</span>
                  <a href={storageUrl(doc.objectPath)} target="_blank" rel="noreferrer" className="text-primary">{t("فتح عبر التخزين الآمن", "Open securely")}</a>
                </div>
              ))}
            </Card>
            <Card className="p-md">
              <SectionTitle title={t("سجل القرارات", "Decision history")} icon="fact_check" />
              {decisions.length === 0 ? <p>{t("لا توجد قرارات بعد.", "No decisions yet.")}</p> : decisions.map((decision) => <p key={decision.id} className="mb-2">{statusLabel(decision.fromStatus)} ← {statusLabel(decision.toStatus)} · {t("مشرف", "Admin")} #{decision.actorAdminId} · {decision.reason ?? t("بدون سبب", "No reason")} · {adminDateTime(decision.createdAt, locale)}</p>)}
            </Card>
            <Card className="p-md">
              <SectionTitle title={t("المستندات المرفوعة", "Uploaded documents")} icon="description" />
              {uploadedDocs.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">{t("لا توجد مستندات مرفوعة.", "No uploaded documents.")}</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {uploadedDocs.map((doc) => {
                    const isReUploaded = doc.uploadedAt !== null;
                    const timestampLabel = isReUploaded
                      ? `${t("أُعيد الرفع: ", "Re-uploaded: ")}${adminDateTime(doc.uploadedAt!, locale)}`
                      : `${t("رُفع: ", "Uploaded: ")}${adminDateTime(app!.createdAt, locale)}`;
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
                             className="ms-auto flex items-center gap-1 font-label-md text-label-md text-primary"
                          >
                            <Icon name="open_in_new" className="text-[14px]" />
                            {t("فتح", "Open")}
                          </a>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                          {isReUploaded ? (
                            <Badge tone="warn" className="text-[11px]">
                              <Icon name="upload" className="text-[11px]" />
                               {t("أُعيد الرفع", "Re-uploaded")}
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
                <SectionTitle title={t("إجراء المراجعة", "Review action")} icon="verified" />
              {app.status === "APPROVED" ? (
                <p className="mb-sm font-body-md text-body-md text-success">{t("تمت الموافقة على هذا المندوب — يمكنه استلام الطلبات.", "This driver is approved — they can receive orders.")}</p>
              ) : app.status === "REJECTED" ? (
                <p className="mb-sm font-body-md text-body-md text-error">{t("تم رفض هذا الطلب.", "This application was rejected.")}</p>
              ) : app.status === "SUSPENDED" ? (
                <p className="mb-sm font-body-md text-body-md text-error">{t("هذا المندوب موقوف حالياً.", "This driver is currently suspended.")}</p>
              ) : (
                <p className="mb-sm font-body-md text-body-md text-on-surface-variant">{t("راجع بيانات ومستندات المندوب ثم اعتمد أو ارفض التوثيق.", "Review the driver's information and documents, then approve or reject verification.")}</p>
              )}
              <div className="flex flex-wrap gap-sm">
                <input aria-label={t("سبب الرفض", "Rejection reason")} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("سبب الرفض (مطلوب عند الرفض)", "Rejection reason (required when rejecting)")} className="min-w-[260px] rounded-button border border-outline-variant px-3 py-2" />
                {driverTransitions[app.status]?.filter((status) => status !== "REJECTED").map((status) => (
                  <Button key={status} icon={status === "SUSPENDED" ? "pause_circle" : "check_circle"} variant={status === "SUSPENDED" ? "danger" : "primary"} disabled={busy} onClick={() => setStatus(status)}>
                    {status === "UNDER_REVIEW" ? t("بدء المراجعة", "Start review") : status === "SUSPENDED" ? t("إيقاف المندوب", "Suspend driver") : t("موافقة على التوثيق", "Approve verification")}
                  </Button>
                ))}
                {driverTransitions[app.status]?.includes("REJECTED") ? (
                  <Button icon="cancel" variant="danger" disabled={busy} onClick={() => setStatus("REJECTED")}>
                    {t("رفض الطلب", "Reject application")}
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
  const { t } = useTranslation();
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={t("طلب غير موجود", "Application not found")}><Card className="p-md text-error">{t("معرّف الطلب غير صحيح.", "Invalid application ID.")}</Card></DashboardShell>;
}
