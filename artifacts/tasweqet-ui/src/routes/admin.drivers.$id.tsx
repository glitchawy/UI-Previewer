import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Badge, Button, Card, DashboardShell, Icon, SectionTitle, Stat, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, drivers, driverWallet } from "@/lib/tb/data";
import { useEffect } from "react";
import { getToken } from "@/lib/auth-session";
import { fetchDriverApplications, parseAppRouteId, updateDriverStatus, type DriverApplication } from "@/lib/tb/applications";

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

const steps = ["PENDING", "UNDER_REVIEW", "APPROVED"];
const stepLabels: Record<string, string> = { PENDING: "بانتظار المراجعة", UNDER_REVIEW: "تحت المراجعة", APPROVED: "معتمد" };

const documents = [
  { id: "nid", title: "الرقم القومي", icon: "badge" },
  { id: "crim", title: "الفيش والتشبيه", icon: "gavel" },
  { id: "extra", title: "مستند إضافي", icon: "description" },
];

const historyRows = [
  { code: "#12343", restaurant: "محطة المشويات", earning: 21, at: "أمس 22:10" },
  { code: "#12341", restaurant: "برجر هاوس", earning: 35, at: "أمس 19:30" },
  { code: "#12338", restaurant: "كشري التحرير", earning: 18, at: "أمس 16:05" },
];

const appStatusLabels: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  UNDER_REVIEW: "تحت المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
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
  useEffect(() => {
    fetchDriverApplications()
      .then((apps) => setApp(apps.find((a) => a.id === appId) ?? null))
      .catch(() => setApp(null));
  }, [appId]);

  async function setStatus(status: string) {
    if (!app || busy) return;
    setBusy(true);
    setActionError(null);
    try {
      await updateDriverStatus(app.id, status);
      setApp({ ...app, status });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "حدث خطأ — حاول مرة أخرى");
    } finally {
      setBusy(false);
    }
  }

  const uploadedDocs: { key: string; label: string; url: string }[] = [
    { key: "nationalIdFrontUrl", label: docLabels["national_id_front"], url: app?.nationalIdFrontUrl ?? "" },
    { key: "nationalIdBackUrl",  label: docLabels["national_id_back"],  url: app?.nationalIdBackUrl ?? "" },
    { key: "criminalRecordUrl",  label: docLabels["criminal_record"],   url: app?.criminalRecordUrl ?? "" },
    { key: "licenseUrl",         label: docLabels["license"],           url: app?.licenseUrl ?? "" },
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
              <SectionTitle title="المستندات المرفوعة" icon="description" />
              {uploadedDocs.length === 0 ? (
                <p className="font-body-md text-body-md text-on-surface-variant">لا توجد مستندات مرفوعة.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {uploadedDocs.map((doc) => (
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
                    </div>
                  ))}
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
                {app.status !== "APPROVED" ? (
                  <Button icon="check_circle" variant="primary" disabled={busy} onClick={() => setStatus("APPROVED")}>
                    موافقة على التوثيق
                  </Button>
                ) : (
                  <Button icon="pause_circle" variant="danger" disabled={busy} onClick={() => setStatus("SUSPENDED")}>
                    إيقاف المندوب
                  </Button>
                )}
                {app.status !== "REJECTED" && app.status !== "APPROVED" ? (
                  <Button icon="cancel" variant="danger" disabled={busy} onClick={() => setStatus("REJECTED")}>
                    رفض الطلب
                  </Button>
                ) : null}
                {app.status === "REJECTED" || app.status === "SUSPENDED" ? (
                  <Button icon="undo" variant="outline" disabled={busy} onClick={() => setStatus("PENDING")}>
                    إعادة للمراجعة
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
  return <MockDriverDetail id={id} />;
}

function MockDriverDetail({ id }: { id: string }) {
  const d = drivers.find((x) => x.id === id) ?? drivers[0]!;
  const [suspended, setSuspended] = useState(d.status === "SUSPENDED");
  const currentStep = steps.indexOf(d.status === "REJECTED" || d.status === "SUSPENDED" ? "PENDING" : d.status);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title={d.name}>
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex flex-wrap items-center justify-between gap-sm p-md">
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{d.name}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">{d.phone} · {d.area} · {d.vehicle}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">{d.type === "TALABAT_BETAK" ? "مندوب المنصة" : "مندوب مطعم"} · ⭐ {d.rating || "—"} · {d.deliveries} توصيلة</p>
          </div>
          <StatusBadge status={suspended ? "SUSPENDED" : d.status} />
        </Card>

        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="رصيد المحفظة" value={EGP(driverWallet.balance)} icon="account_balance_wallet" tone="success" />
          <Stat label="أرباح اليوم" value={EGP(driverWallet.today)} icon="today" tone="info" />
          <Stat label="أرباح الأسبوع" value={EGP(driverWallet.week)} icon="calendar_view_week" tone="warn" />
          <Stat label="نسبة المندوب" value={`${driverWallet.commissionRate}%`} icon="percent" tone="info" />
        </div>

        <Card className="p-md">
          <SectionTitle title="المستندات المقدمة" icon="folder" />
          <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
            {documents.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-2 rounded-button border border-outline-variant p-md">
                <div className="flex items-center gap-2">
                  <Icon name={doc.icon} className="text-[20px] text-on-surface-variant" />
                  <span className="font-label-lg text-label-lg text-on-surface">{doc.title}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  <Button variant="ghost" icon="visibility">معاينة</Button>
                  <Button variant="primary" icon="check">موافقة</Button>
                  <Button variant="danger" icon="close">رفض</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="حالة التوثيق" icon="verified" />
          <div className="flex items-center gap-2">
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
        </Card>

        <Card className="flex items-center justify-between gap-sm p-md">
          <div className="flex items-center gap-2">
            <Icon name={suspended ? "block" : "check_circle"} className={suspended ? "text-error" : "text-success"} />
            <span className="font-label-lg text-label-lg text-on-surface">{suspended ? "المندوب موقوف حالياً" : "المندوب نشط ويستلم طلبات"}</span>
          </div>
          <Button variant={suspended ? "primary" : "danger"} icon={suspended ? "play_circle" : "pause_circle"} onClick={() => setSuspended((s) => !s)}>
            {suspended ? "تفعيل المندوب" : "إيقاف المندوب"}
          </Button>
        </Card>

        <Card className="p-md">
          <SectionTitle title="سجل التوصيلات" icon="history" />
          <Table head={["الطلب", "المطعم", "الأرباح", "الوقت"]}>
            {historyRows.map((h) => (
              <tr key={h.code}>
                <Td><Badge tone="neutral">{h.code}</Badge></Td>
                <Td>{h.restaurant}</Td>
                <Td>{EGP(h.earning)}</Td>
                <Td className="text-on-surface-variant">{h.at}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
