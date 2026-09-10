import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Button, Card, DashboardShell, Icon, SectionTitle, StatusBadge } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { useEffect } from "react";
import { getToken } from "@/lib/auth-session";
import { fetchRestaurantApplication, parseAppRouteId, updateRestaurantStatus, type ApplicationDecision, type ApplicationDocument, type RestaurantApplication } from "@/lib/tb/applications";

function storageUrl(objectPath: string): string {
  const token = getToken();
  return `/api/storage${objectPath}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

export const Route = createFileRoute("/admin/restaurants/$id")({
  head: () => ({
    meta: [
      { title: "ملف المطعم | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "مراجعة توثيق المطعم، العمولة، الفروع والأداء." },
      { property: "og:title", content: "ملف المطعم | طلبات بيتك" },
      { property: "og:description", content: "مراجعة بيانات وتوثيق مطعم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRestaurantDetail,
});

const appStatusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  UNDER_REVIEW: "تحت المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  ACTIVE: "نشط",
};
const restaurantTransitions: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["ACTIVE", "REJECTED"],
  ACTIVE: ["REJECTED"],
  REJECTED: ["UNDER_REVIEW"],
};

function StoredRestaurantDetail({ appId }: { appId: number }) {
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
      setActionError(err instanceof Error ? err.message : "حدث خطأ — حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }


  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title={app?.name ?? "طلب تسجيل مطعم"}>
      <div className="tb-stagger flex flex-col gap-md">
        {app === undefined ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">جاري التحميل...</Card>
        ) : app === null ? (
          <Card className="p-md font-body-md text-body-md text-on-surface-variant">لم يتم العثور على الطلب.</Card>
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
                    <img src={storageUrl(app.logoUrl!)} alt="شعار" className="size-full object-cover" />
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
                    {app.address} · مواعيد العمل: {app.hours ?? "—"}
                  </p>
                </div>
                <StatusBadge status={app.status} label={appStatusLabels[app.status] ?? app.status} />
              </div>
            </Card>

            <Card className="p-md">
              <SectionTitle title="بيانات الطلب" icon="description" />
              <div className="grid grid-cols-1 gap-sm md:grid-cols-2">
                {[
                  ["اسم المالك", app.ownerName ?? "—"],
                  ["الوصف", app.description ?? "—"],
                  ["التصنيفات", app.category ?? "—"],
                  ["عدد الفروع", String(app.branches)],
                  ["نوع التوصيل", app.deliveryType === "platform" ? "توصيل طلبات بيتك" : "توصيل المطعم"],
                  ["تاريخ التقديم", new Date(app.createdAt).toLocaleDateString("ar-EG")],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-card bg-surface-container p-md">
                    <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
                    <p className="font-body-md text-body-md text-on-surface">{value}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="p-md">
              <SectionTitle title="سجل نسخ المستندات" icon="history" />
              {documents.length === 0 ? <p>لا توجد مستندات.</p> : documents.map((doc) => (
                <div key={doc.id} className="mb-2 flex items-center justify-between rounded-card bg-surface-container p-3">
                  <span>{doc.documentType} · النسخة {doc.version} · {new Date(doc.uploadedAt).toLocaleString("ar-EG")}</span>
                  <a href={storageUrl(doc.objectPath)} target="_blank" rel="noreferrer" className="text-primary">فتح عبر التخزين الآمن</a>
                </div>
              ))}
            </Card>
            <Card className="p-md">
              <SectionTitle title="سجل القرارات" icon="fact_check" />
              {decisions.length === 0 ? <p>لا توجد قرارات بعد.</p> : decisions.map((decision) => <p key={decision.id} className="mb-2">{decision.fromStatus} ← {decision.toStatus} · مشرف #{decision.actorAdminId} · {decision.reason ?? "بدون سبب"} · {new Date(decision.createdAt).toLocaleString("ar-EG")}</p>)}
            </Card>

            {/* Uploaded images */}
            {(app.logoUrl || app.coverUrl) && (
              <Card className="p-md">
                <SectionTitle title="الصور المرفوعة" icon="image" />
                <div className="grid grid-cols-2 gap-3">
                  {app.logoUrl && (() => {
                    const isReUploaded = app.logoUploadedAt !== null;
                    return (
                      <div className="flex flex-col gap-1 rounded-card border border-outline-variant overflow-hidden">
                        <a href={storageUrl(app.logoUrl!)} target="_blank" rel="noreferrer">
                          <img src={storageUrl(app.logoUrl!)} alt="شعار المطعم" className="w-full h-32 object-contain bg-surface-container" />
                        </a>
                        <p className="px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">شعار المطعم</p>
                        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                          {isReUploaded ? (
                            <Badge tone="warn" className="text-[11px]">
                              <Icon name="upload" className="text-[11px]" />
                              أُعيد الرفع
                            </Badge>
                          ) : null}
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {isReUploaded
                              ? `أُعيد الرفع: ${new Date(app.logoUploadedAt!).toLocaleString("ar-EG")}`
                              : `رُفع: ${new Date(app.createdAt).toLocaleString("ar-EG")}`}
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
                          <img src={storageUrl(app.coverUrl!)} alt="صورة الغلاف" className="w-full h-32 object-cover bg-surface-container" />
                        </a>
                        <p className="px-3 py-1.5 font-label-md text-label-md text-on-surface-variant">صورة الغلاف</p>
                        <div className="flex flex-wrap items-center gap-2 px-3 pb-2">
                          {isReUploaded ? (
                            <Badge tone="warn" className="text-[11px]">
                              <Icon name="upload" className="text-[11px]" />
                              أُعيد الرفع
                            </Badge>
                          ) : null}
                          <span className="font-label-sm text-label-sm text-on-surface-variant">
                            {isReUploaded
                              ? `أُعيد الرفع: ${new Date(app.coverUploadedAt!).toLocaleString("ar-EG")}`
                              : `رُفع: ${new Date(app.createdAt).toLocaleString("ar-EG")}`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </Card>
            )}
            <Card className="p-md">
              <SectionTitle title="إجراء المراجعة" icon="verified" />
              {app.status === "APPROVED" || app.status === "ACTIVE" ? (
                <p className="mb-sm font-body-md text-body-md text-success">تمت الموافقة على هذا المطعم — الحساب مفعّل.</p>
              ) : app.status === "REJECTED" ? (
                <p className="mb-sm font-body-md text-body-md text-error">تم رفض هذا الطلب.</p>
              ) : (
                <p className="mb-sm font-body-md text-body-md text-on-surface-variant">راجع بيانات الطلب ثم اعتمد أو ارفض التسجيل.</p>
              )}
              <div className="flex flex-wrap gap-sm">
                <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="سبب الرفض (مطلوب عند الرفض)" className="min-w-[260px] rounded-button border border-outline-variant px-3 py-2" />
                {restaurantTransitions[app.status]?.filter((status) => status !== "REJECTED").map((status) => (
                  <Button key={status} icon="check_circle" variant="primary" disabled={busy} onClick={() => setStatus(status)}>
                    {status === "UNDER_REVIEW" ? "بدء المراجعة" : status === "ACTIVE" ? "تنشيط المطعم" : "موافقة على التوثيق"}
                  </Button>
                ))}
                {restaurantTransitions[app.status]?.includes("REJECTED") ? (
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

function AdminRestaurantDetail() {
  const { id } = Route.useParams();
  const appId = parseAppRouteId(id);
  if (appId !== null) return <StoredRestaurantDetail appId={appId} />;
  return <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="طلب غير موجود"><Card className="p-md text-error">معرّف الطلب غير صحيح.</Card></DashboardShell>;
}
