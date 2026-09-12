import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Button, Card, DashboardShell, Icon, SectionTitle, StatusBadge } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { useEffect } from "react";
import { getToken } from "@/lib/auth-session";
import { fetchRestaurantApplication, parseAppRouteId, updateRestaurantStatus, type ApplicationDecision, type ApplicationDocument, type RestaurantApplication } from "@/lib/tb/applications";
import { adminDate, adminDateTime, adminNumber } from "@/lib/admin-i18n";
import { translate, useTranslation } from "@/lib/i18n";

function storageUrl(objectPath: string): string {
  const token = getToken();
  return `/api/storage${objectPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export const Route = createFileRoute("/admin/restaurants/$id")({
  head: () => ({
    meta: [
      { title: translate("ملف المطعم | لوحة سوبر أدمن - طلبات بيتك", "Restaurant profile | Super admin panel - Talabat Betak") },
      { name: "description", content: translate("مراجعة توثيق المطعم، العمولة، الفروع والأداء.", "Review restaurant verification, commission, branches, and performance.") },
      { property: "og:title", content: translate("ملف المطعم | طلبات بيتك", "Restaurant profile | Talabat Betak") },
      { property: "og:description", content: translate("مراجعة بيانات وتوثيق مطعم.", "Review restaurant information and verification.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRestaurantDetail,
});

const restaurantTransitions: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["ACTIVE", "REJECTED"],
  ACTIVE: ["REJECTED"],
  REJECTED: ["UNDER_REVIEW"],
};

function StoredRestaurantDetail({ appId }: { appId: number }) {
  const { t, locale } = useTranslation();
  const statusLabel = (status: string) => ({
    PENDING: t("بانتظار المراجعة", "Pending review"),
    UNDER_REVIEW: t("تحت المراجعة", "Under review"),
    APPROVED: t("معتمد", "Approved"),
    REJECTED: t("مرفوض", "Rejected"),
    ACTIVE: t("نشط", "Active"),
  }[status] ?? status);
  const documentLabel = (type: string) => ({
    logo: t("شعار المطعم", "Restaurant logo"),
    cover: t("صورة الغلاف", "Cover image"),
    registration: t("مستند التسجيل", "Registration document"),
  }[type] ?? type);
  const [app, setApp] = useState<RestaurantApplication | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [decisions, setDecisions] = useState<ApplicationDecision[]>([]);
  useEffect(() => {
    fetchRestaurantApplication(appId)
      .then((detail) => { setApp(detail.application); setDocuments(detail.documents); setDecisions(detail.decisions); })
      .catch(() => setApp(null));
  }, [appId]);

  async function setStatus(status: string) {
    if (!app || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateRestaurantStatus(app.id, status, status === "REJECTED" ? reason : undefined);
      const detail = await fetchRestaurantApplication(app.id);
      setApp(detail.application); setDocuments(detail.documents); setDecisions(detail.decisions);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("حدث خطأ — حاول مرة أخرى", "An error occurred — try again"));
    } finally {
      setBusy(false);
    }
  }


  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={app?.name ?? t("طلب تسجيل مطعم", "Restaurant application")}>
      <div className="tb-stagger flex flex-col gap-md">
        {app === undefined ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">{t("جاري التحميل...", "Loading...")}</Card>
        ) : app === null ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">{t("لم يتم العثور على الطلب.", "Application not found.")}</Card>
        ) : (
          <>
            {/* Cover + logo header */}
            <Card className="overflow-hidden">
              <div
                className="h-36 w-full bg-surface-container bg-cover bg-center"
                style={app.coverUrl ? { backgroundImage: `url(${storageUrl(app.coverUrl)})` } : undefined}
              >
                {!app.coverUrl && (
                  <div className="flex h-full items-center justify-center">
                    <Icon name="image" className="text-[40px] text-on-surface-variant/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-end gap-md p-md">
                <div className="-mt-10 size-16 flex-shrink-0 overflow-hidden rounded-full border-4 border-surface-container-lowest bg-surface-container">
                  {app.logoUrl ? (
                    <img src={storageUrl(app.logoUrl!)} alt={t("شعار", "Logo")} className="size-full object-cover" />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <Icon name="storefront" className="text-[28px] text-on-surface-variant/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-headline-md text-headline-md text-on-surface">{app.name}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    {app.phone ?? "—"} · {app.email ?? "—"}
                  </p>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                     {app.address} · {t("مواعيد العمل: ", "Hours: ")}{app.hours ?? "—"}
                  </p>
                </div>
                 <StatusBadge status={app.status} label={statusLabel(app.status)} />
              </div>
            </Card>

            <Card className="p-md">
               <SectionTitle title={t("بيانات الطلب", "Application details")} icon="description" />
              <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
                {[
                   [t("اسم المالك", "Owner name"), app.ownerName ?? "—"],
                   [t("الوصف", "Description"), app.description ?? "—"],
                   [t("التصنيفات", "Categories"), app.category ?? "—"],
                    [t("عدد الفروع", "Branches"), adminNumber(app.branches, locale)],
                   [t("نوع التوصيل", "Delivery type"), app.deliveryType === "platform" ? t("توصيل طلبات بيتك", "Talabat Betak delivery") : t("توصيل المطعم", "Restaurant delivery")],
                   [t("تاريخ التقديم", "Applied"), adminDate(app.createdAt, locale)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-card bg-surface-container p-md">
                    <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
                    <p className="font-body-md text-body-md text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-md">
               <SectionTitle title={t("سجل نسخ المستندات", "Document version history")} icon="history" />
               {documents.length === 0 ? <p>{t("لا توجد مستندات.", "No documents.")}</p> : documents.map((doc) => (
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

            {/* Uploaded images */}
            {(app.logoUrl || app.coverUrl) && (
              <Card className="p-md">
                 <SectionTitle title={t("الصور المرفوعة", "Uploaded images")} icon="image" />
                <div className="grid grid-cols-2 gap-3">
                  {app.logoUrl && (() => {
                    const isReUploaded = app.logoUploadedAt !== null;
                    return (
                      <div className="flex flex-col gap-1 rounded-card border border-outline-variant overflow-hidden">
                        <a href={storageUrl(app.logoUrl!)} target="_blank" rel="noreferrer">
                           <img src={storageUrl(app.logoUrl!)} alt={t("شعار المطعم", "Restaurant logo")} className="w-full h-32 object-contain bg-surface-container" />
                        </a>
                         <p className="px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">{t("شعار المطعم", "Restaurant logo")}</p>
                        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                          {isReUploaded ? (
                            <Badge tone="warn" className="text-[11px]">
                              <Icon name="upload" className="text-[11px]" />
                               {t("أُعيد الرفع", "Re-uploaded")}
                            </Badge>
                          ) : null}
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {isReUploaded
                               ? `${t("أُعيد الرفع: ", "Re-uploaded: ")}${adminDateTime(app.logoUploadedAt!, locale)}`
                               : `${t("رُفع: ", "Uploaded: ")}${adminDateTime(app.createdAt, locale)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                  {app.coverUrl && (() => {
                    const isReUploaded = app.coverUploadedAt !== null;
                    return (
                      <div className="flex flex-col gap-1 rounded-card border border-outline-variant overflow-hidden">
                        <a href={storageUrl(app.coverUrl!)} target="_blank" rel="noreferrer">
                           <img src={storageUrl(app.coverUrl!)} alt={t("صورة الغلاف", "Cover image")} className="w-full h-32 object-cover bg-surface-container" />
                        </a>
                         <p className="px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">{t("صورة الغلاف", "Cover image")}</p>
                        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                          {isReUploaded ? (
                            <Badge tone="warn" className="text-[11px]">
                              <Icon name="upload" className="text-[11px]" />
                               {t("أُعيد الرفع", "Re-uploaded")}
                            </Badge>
                          ) : null}
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {isReUploaded
                               ? `${t("أُعيد الرفع: ", "Re-uploaded: ")}${adminDateTime(app.coverUploadedAt!, locale)}`
                               : `${t("رُفع: ", "Uploaded: ")}${adminDateTime(app.createdAt, locale)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            )}
            <Card className="p-md">
               <SectionTitle title={t("إجراء المراجعة", "Review action")} icon="verified" />
              {app.status === "APPROVED" || app.status === "ACTIVE" ? (
                 <p className="mb-sm font-body-md text-body-md text-success">{t("تمت الموافقة على هذا المطعم — الحساب مفعّل.", "This restaurant is approved — the account is active.")}</p>
              ) : app.status === "REJECTED" ? (
                 <p className="mb-sm font-body-md text-body-md text-error">{t("تم رفض هذا الطلب.", "This application was rejected.")}</p>
              ) : (
                 <p className="mb-sm font-body-md text-body-md text-on-surface-variant">{t("راجع بيانات الطلب ثم اعتمد أو ارفض التسجيل.", "Review the application, then approve or reject registration.")}</p>
              )}
              <div className="flex flex-wrap gap-sm">
                 <input aria-label={t("سبب الرفض", "Rejection reason")} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("سبب الرفض (مطلوب عند الرفض)", "Rejection reason (required when rejecting)")} className="min-w-[260px] rounded-button border border-outline-variant px-3 py-2" />
                {restaurantTransitions[app.status]?.filter((status) => status !== "REJECTED").map((status) => (
                  <Button key={status} icon="check_circle" variant="primary" disabled={busy} onClick={() => setStatus(status)}>
                     {status === "UNDER_REVIEW" ? t("بدء المراجعة", "Start review") : status === "ACTIVE" ? t("تنشيط المطعم", "Activate restaurant") : t("موافقة على التوثيق", "Approve verification")}
                  </Button>
                ))}
                {restaurantTransitions[app.status]?.includes("REJECTED") ? (
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

function AdminRestaurantDetail() {
  const { id } = Route.useParams();
  const appId = parseAppRouteId(id);
  if (appId !== null) return <StoredRestaurantDetail appId={appId} />;
  const { t } = useTranslation();
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={t("طلب غير موجود", "Application not found")}><Card className="p-md text-error">{t("معرّف الطلب غير صحيح.", "Invalid application ID.")}</Card></DashboardShell>;
}
