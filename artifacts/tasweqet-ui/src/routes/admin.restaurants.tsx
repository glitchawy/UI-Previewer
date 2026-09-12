import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { appRouteId, fetchRestaurantApplications, type RestaurantApplication } from "@/lib/tb/applications";
import { adminNumber } from "@/lib/admin-i18n";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/admin/restaurants")({
  head: () => ({
    meta: [
      { title: translate("المطاعم | لوحة سوبر أدمن - طلبات بيتك", "Restaurants | Super admin panel - Talabat Betak") },
      { name: "description", content: translate("توثيق ومتابعة حالة المطاعم المسجلة على المنصة.", "Verify and monitor registered restaurants on the platform.") },
      { property: "og:title", content: translate("المطاعم | طلبات بيتك", "Restaurants | Talabat Betak") },
      { property: "og:description", content: translate("توثيق ومتابعة حالة المطاعم.", "Manage restaurant verification and status.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRestaurants,
});

const filters = ["ALL", "PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE", "REJECTED"] as const;

function AdminRestaurants() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <AdminRestaurantsList />;
}

function AdminRestaurantsList() {
  const { t, locale } = useTranslation();
  const filterLabel = (status: string) => ({
    ALL: t("الكل", "All"),
    PENDING: t("بانتظار المراجعة", "Pending review"),
    UNDER_REVIEW: t("تحت المراجعة", "Under review"),
    APPROVED: t("معتمد", "Approved"),
    ACTIVE: t("نشط", "Active"),
    REJECTED: t("مرفوض", "Rejected"),
  }[status] ?? status);
  const [filter, setFilter] = useState<(typeof filters)[number]>("ALL");
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  const [query, setQuery] = useState("");
  const [reuploaded, setReuploaded] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true); setError("");
        fetchRestaurantApplications({ q: query, status: filter === "ALL" ? undefined : filter, reuploaded, sort: reuploaded ? "reuploaded" : undefined, page })
        .then((result) => { setApplications(result.items); setTotal(result.total); })
        .catch(() => setError(t("تعذر تحميل طلبات المطاعم. حاول مرة أخرى.", "Unable to load restaurant applications. Try again.")))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [filter, page, query, reuploaded]);
  const appRows = applications;

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={t("المطاعم", "Restaurants")}>
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">{t("لا توجد مستندات KYC للمطاعم — المراجعة تتم يدوياً حسب بيانات التسجيل فقط.", "Restaurants have no KYC documents — review is based on registration data only.")}</span>
        </Card>

        <Card className="flex flex-col gap-sm p-md">
          <label className="flex flex-col gap-1.5"><span className="font-label-lg text-label-lg text-on-surface-variant">{t("بحث", "Search")}</span><input aria-label={t("بحث عن مطاعم", "Search restaurants")} value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder={t("اسم المطعم أو المنطقة", "Restaurant name or area")} className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5" /></label>
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

        {loading ? <Card className="p-md">{t("جاري تحميل الطلبات...", "Loading applications...")}</Card> : error ? <Card className="p-md text-error">{error}</Card> : appRows.length === 0 ? <Card className="p-md">{t("لا توجد طلبات مطابقة.", "No matching applications.")}</Card> : <Table head={[t("المطعم", "Restaurant"), t("المنطقة", "Area"), t("الفروع", "Branches"), t("التقييم", "Rating"), t("العمولة", "Commission"), t("مزود التوصيل", "Delivery provider"), t("الحالة", "Status")]}>
          {appRows.map((a) => (
            <tr key={`app-${a.id}`} className="bg-secondary-container/20 transition hover:bg-surface-container-low">
              <Td>
                <Link to="/admin/restaurants/$id" params={{ id: appRouteId(a.id) }} className="flex items-center gap-2 font-label-lg text-label-lg text-secondary">
                  <span className="flex size-8 items-center justify-center rounded-full bg-secondary-container">
                    <Icon name="storefront" className="text-[16px] text-on-secondary-container" />
                  </span>
                  {a.name}
                </Link>
              </Td>
              <Td className="text-on-surface-variant">{a.address}</Td>
              <Td>{adminNumber(a.branches, locale)}</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>{a.deliveryType === "platform" ? t("طلبات بيتك", "Talabat Betak") : t("المطعم", "Restaurant")}</Td>
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
