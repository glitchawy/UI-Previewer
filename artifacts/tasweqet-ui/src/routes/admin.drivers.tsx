import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { appRouteId, fetchDriverApplications, type DriverApplication } from "@/lib/tb/applications";
import { adminNumber } from "@/lib/admin-i18n";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/admin/drivers")({
  head: () => ({
    meta: [
      { title: translate("المندوبين | لوحة سوبر أدمن - طلبات بيتك", "Drivers | Super admin panel - Talabat Betak") },
      { name: "description", content: translate("إدارة توثيق ومتابعة مندوبي التوصيل على المنصة.", "Manage driver verification and monitoring on the platform.") },
      { property: "og:title", content: translate("المندوبين | طلبات بيتك", "Drivers | Talabat Betak") },
      { property: "og:description", content: translate("إدارة توثيق المندوبين وحالتهم.", "Manage driver verification and status.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDrivers,
});

const filters = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;

function AdminDrivers() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <AdminDriversList />;
}

function AdminDriversList() {
  const { t, locale } = useTranslation();
  const filterLabel = (status: string) => ({
    ALL: t("الكل", "All"),
    PENDING: t("بانتظار المراجعة", "Pending review"),
    UNDER_REVIEW: t("تحت المراجعة", "Under review"),
    APPROVED: t("معتمد", "Approved"),
    REJECTED: t("مرفوض", "Rejected"),
    SUSPENDED: t("موقوف", "Suspended"),
  }[status] ?? status);
  const vehicleLabel = (type: string) => ({
    motorcycle: t("موتوسيكل", "Motorcycle"),
    motorbike: t("موتوسيكل", "Motorcycle"),
    bicycle: t("دراجة", "Bicycle"),
    car: t("سيارة", "Car"),
  }[type.toLowerCase()] ?? type);
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [query, setQuery] = useState("");
  const [reuploaded, setReuploaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true); setError("");
        fetchDriverApplications({ q: query, status: filter === "ALL" ? undefined : filter, reuploaded, sort: reuploaded ? "reuploaded" : undefined, page })
        .then((result) => { setApplications(result.items); setTotal(result.total); })
        .catch(() => setError(t("تعذر تحميل طلبات المندوبين. حاول مرة أخرى.", "Unable to load driver applications. Try again.")))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [filter, page, query, reuploaded]);
  const appRows = applications;

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={t("المندوبين", "Drivers")}>
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">{t("المندوب غير المعتمد لا يستلم طلبات حتى تكتمل مراجعة توثيقه.", "Unapproved drivers cannot receive orders until verification is complete.")}</span>
        </Card>

        <Card className="flex flex-col gap-sm p-md">
          <label className="flex flex-col gap-1.5"><span className="font-label-lg text-label-lg text-on-surface-variant">{t("بحث", "Search")}</span><input aria-label={t("بحث عن مندوبين", "Search drivers")} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={t("اسم المندوب أو المنطقة", "Driver name or area")} className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5" /></label>
          <label className="flex items-center gap-2 font-label-md text-label-md"><input type="checkbox" checked={reuploaded} onChange={(e) => { setReuploaded(e.target.checked); setPage(1); }} /> {t("مستندات أُعيد رفعها حديثاً", "Recently re-uploaded documents")}</label>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                  filter === f ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {filterLabel(f)}
              </button>
            ))}
          </div>
        </Card>

        {loading ? <Card className="p-md">{t("جاري تحميل الطلبات...", "Loading applications...")}</Card> : error ? <Card className="p-md text-error">{error}</Card> : appRows.length === 0 ? <Card className="p-md">{t("لا توجد طلبات مطابقة.", "No matching applications.")}</Card> : <Table head={[t("المندوب", "Driver"), t("الهاتف", "Phone"), t("النوع", "Type"), t("المنطقة", "Area"), t("المركبة", "Vehicle"), t("التقييم", "Rating"), t("التوصيلات", "Deliveries"), t("الحالة", "Status")]}>
          {appRows.map((a) => (
            <tr key={`app-${a.id}`} className="bg-secondary-container/20 transition hover:bg-surface-container-low">
              <Td>
                <Link to="/admin/drivers/$id" params={{ id: appRouteId(a.id) }} className="font-label-lg text-label-lg text-secondary">
                  {a.fullName}
                </Link>
              </Td>
              <Td className="text-on-surface-variant">{a.phone ?? "—"}</Td>
              <Td>{t("مندوب المنصة", "Platform driver")}</Td>
              <Td>{a.area}</Td>
              <Td>{vehicleLabel(a.vehicleType)}</Td>
              <Td>⭐ —</Td>
              <Td>{adminNumber(0, locale)}</Td>
              <Td>
            <StatusBadge status={a.status} label={filterLabel(a.status)} />
              </Td>
            </tr>
          ))}
        </Table>}
        <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("السابق", "Previous")}</Button><span>{t("صفحة", "Page")} {adminNumber(page, locale)} · {adminNumber(total, locale)} {t("طلب", "applications")}</span><Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>{t("التالي", "Next")}</Button></div>
      </div>
    </DashboardShell>
  );
}
