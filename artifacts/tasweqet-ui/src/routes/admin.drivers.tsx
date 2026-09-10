import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { appRouteId, fetchDriverApplications, type DriverApplication } from "@/lib/tb/applications";

export const Route = createFileRoute("/admin/drivers")({
  head: () => ({
    meta: [
      { title: "المندوبين | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "إدارة توثيق ومتابعة مندوبي التوصيل على المنصة." },
      { property: "og:title", content: "المندوبين | طلبات بيتك" },
      { property: "og:description", content: "إدارة توثيق المندوبين وحالتهم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDrivers,
});

const filters = ["الكل", "PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"] as const;
const filterLabels: Record<string, string> = {
  الكل: "الكل",
  PENDING: "بانتظار المراجعة",
  UNDER_REVIEW: "تحت المراجعة",
  APPROVED: "معتمد",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
};

function AdminDrivers() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <AdminDriversList />;
}

function AdminDriversList() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("الكل");
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
      fetchDriverApplications({ q: query, status: filter === "الكل" ? undefined : filter, reuploaded, sort: reuploaded ? "reuploaded" : undefined, page })
        .then((result) => { setApplications(result.items); setTotal(result.total); })
        .catch(() => setError("تعذر تحميل طلبات المندوبين. حاول مرة أخرى."))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [filter, page, query, reuploaded]);
  const appRows = applications;

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="المندوبين">
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">المندوب غير المعتمد لا يستلم طلبات حتى تكتمل مراجعة توثيقه.</span>
        </Card>

        <Card className="flex flex-col gap-sm p-md">
          <label className="flex flex-col gap-1.5"><span className="font-label-lg text-label-lg text-on-surface-variant">بحث</span><input value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="اسم المندوب أو المنطقة" className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5" /></label>
          <label className="flex items-center gap-2 font-label-md text-label-md"><input type="checkbox" checked={reuploaded} onChange={(e) => { setReuploaded(e.target.checked); setPage(1); }} /> مستندات أُعيد رفعها حديثاً</label>
          <div className="flex flex-wrap gap-2">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                  filter === f ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
          </div>
        </Card>

        {loading ? <Card className="p-md">جاري تحميل الطلبات...</Card> : error ? <Card className="p-md text-error">{error}</Card> : appRows.length === 0 ? <Card className="p-md">لا توجد طلبات مطابقة.</Card> : <Table head={["المندوب", "الهاتف", "النوع", "المنطقة", "المركبة", "التقييم", "التوصيلات", "الحالة"]}>
          {appRows.map((a) => (
            <tr key={`app-${a.id}`} className="bg-secondary-container/20 transition hover:bg-surface-container-low">
              <Td>
                <Link to="/admin/drivers/$id" params={{ id: appRouteId(a.id) }} className="font-label-lg text-label-lg text-secondary">
                  {a.fullName}
                </Link>
              </Td>
              <Td className="text-on-surface-variant">{a.phone ?? "—"}</Td>
              <Td>مندوب المنصة</Td>
              <Td>{a.area}</Td>
              <Td>{a.vehicleType}</Td>
              <Td>⭐ —</Td>
              <Td>٠</Td>
              <Td>
                <StatusBadge status={a.status} label={filterLabels[a.status] ?? a.status} />
              </Td>
            </tr>
          ))}
        </Table>}
        <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>السابق</Button><span>صفحة {page} · {total} طلب</span><Button variant="outline" disabled={page * 20 >= total} onClick={() => setPage((p) => p + 1)}>التالي</Button></div>
      </div>
    </DashboardShell>
  );
}
