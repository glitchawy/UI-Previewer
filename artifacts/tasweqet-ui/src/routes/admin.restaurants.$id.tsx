import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Bars, Button, Card, DashboardShell, Field, Icon, SectionTitle, Stat, StatusBadge } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, branches, restaurantOf, restaurantStats } from "@/lib/tb/data";
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

const steps = ["PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE"];
const stepLabels: Record<string, string> = { PENDING: "بانتظار المراجعة", UNDER_REVIEW: "تحت المراجعة", APPROVED: "معتمد", ACTIVE: "نشط" };

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

function MockRestaurantDetail({ id }: { id: string }) {
  const r = restaurantOf(id) ?? restaurantOf("burger-house")!;
  const [commission, setCommission] = useState(r.commission);
  const currentStep = steps.indexOf(r.status === "REJECTED" ? "PENDING" : r.status);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title={r.name}>
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="overflow-hidden">
          <div className="h-36 w-full bg-cover bg-center" style={{ backgroundImage: `url(${r.cover})` }} />
          <div className="flex flex-wrap items-center gap-md p-md">
            <img src={r.logo} alt="" className="-mt-12 size-20 rounded-full border-4 border-surface-container-lowest object-cover" />
            <div className="flex-1">
              <p className="font-headline-md text-headline-md text-on-surface">{r.name}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">{r.phone} · {r.email}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">{r.address} · مواعيد العمل: {r.hours}</p>
            </div>
            <StatusBadge status={r.status} label={stepLabels[r.status] ?? r.status} />
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="حالة التوثيق" icon="verified" />
          <div className="mb-md flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span
                  className={`flex size-8 shrink-0 items-center justify-center rounded-full font-label-md text-label-md ${
                    i <= currentStep ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="font-label-md text-label-md text-on-surface-variant">{stepLabels[s]}</span>
                {i < steps.length - 1 ? <span className="h-px flex-1 bg-outline-variant" /> : null}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-sm">
            <Button icon="check_circle" variant="primary">موافقة على التوثيق</Button>
            <Button icon="cancel" variant="danger">رفض</Button>
            <div className="min-w-[240px] flex-1">
              <Field label="سبب الرفض (لو تم الرفض)" placeholder="اكتب السبب هنا" />
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <Card className="p-md">
            <SectionTitle title="نسبة العمولة" icon="percent" />
            <div className="flex items-center gap-sm">
              <input
                type="range"
                min={5}
                max={30}
                value={commission}
                onChange={(e) => setCommission(Number(e.target.value))}
                className="flex-1"
              />
              <span className="font-headline-md text-headline-md text-on-surface">{commission}%</span>
            </div>
            <p className="mt-sm font-label-md text-label-md text-on-surface-variant">تُحتسب العمولة على قيمة الطلب فقط دون رسوم التوصيل — يتحكم بها السوبر أدمن فقط.</p>
            <Button className="mt-sm" icon="save" variant="outline">حفظ العمولة</Button>
          </Card>

          <Card className="p-md">
            <SectionTitle title="مزود التوصيل" icon="local_shipping" />
            <p className="font-body-md text-body-md text-on-surface-variant">
              {r.deliveryProvider === "TALABAT_BETAK" ? "توصيل عبر مندوبين طلبات بيتك" : "توصيل عبر مندوبين المطعم الخاصين"}
            </p>
            <p className="mt-1 font-label-md text-label-md text-outline">رسوم توصيل أساسية: {EGP(r.deliveryFee)}</p>
          </Card>
        </div>

        <Card className="p-md">
          <SectionTitle title="الفروع" icon="store" />
          <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
            {branches.map((b) => (
              <div key={b.id} className="rounded-button border border-outline-variant p-md">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-label-lg text-label-lg text-on-surface">{b.name}</span>
                  <Icon name={b.open ? "check_circle" : "cancel"} className={`text-[18px] ${b.open ? "text-success" : "text-error"}`} />
                </div>
                <p className="font-label-md text-label-md text-on-surface-variant">{b.manager} · {b.staff} موظفين</p>
                <p className="font-label-md text-label-md text-on-surface-variant">{b.ordersToday} طلب اليوم</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="الإيرادات" value={EGP(restaurantStats.revenue)} icon="payments" tone="warn" />
          <Stat label="الطلبات" value={String(restaurantStats.orders)} icon="receipt_long" tone="info" />
          <Stat label="متوسط الطلب" value={EGP(restaurantStats.aov)} icon="calculate" tone="success" />
          <Stat label="نسبة التكرار" value={`${restaurantStats.repeatRate}%`} icon="repeat" tone="info" />
        </div>

        <Card className="p-md">
          <SectionTitle title="أداء المطعم أسبوعياً" icon="bar_chart" />
          <Bars values={[...restaurantStats.series]} labels={[...restaurantStats.days]} />
        </Card>

        <Link to="/admin/settlements">
          <Button icon="account_balance" variant="outline">عرض التسويات المالية للمطعم</Button>
        </Link>
      </div>
    </DashboardShell>
  );
}
