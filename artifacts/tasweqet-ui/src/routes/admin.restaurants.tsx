import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, DashboardShell, Field, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { restaurants } from "@/lib/tb/data";
import { appRouteId, fetchRestaurantApplications, type RestaurantApplication } from "@/lib/tb/applications";

export const Route = createFileRoute("/admin/restaurants")({
  head: () => ({
    meta: [
      { title: "المطاعم | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "توثيق ومتابعة حالة المطاعم المسجلة على المنصة." },
      { property: "og:title", content: "المطاعم | طلبات بيتك" },
      { property: "og:description", content: "توثيق ومتابعة حالة المطاعم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminRestaurants,
});

const filters = ["الكل", "PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE", "REJECTED"] as const;
const filterLabels: Record<string, string> = {
  الكل: "الكل",
  PENDING: "بانتظار المراجعة",
  UNDER_REVIEW: "تحت المراجعة",
  APPROVED: "معتمد",
  ACTIVE: "نشط",
  REJECTED: "مرفوض",
};

function AdminRestaurants() {
  const childMatches = useChildMatches();
  if (childMatches.length > 0) return <Outlet />;
  return <AdminRestaurantsList />;
}

function AdminRestaurantsList() {
  const [filter, setFilter] = useState<(typeof filters)[number]>("الكل");
  const [applications, setApplications] = useState<RestaurantApplication[]>([]);
  useEffect(() => {
    fetchRestaurantApplications().then(setApplications).catch(() => setApplications([]));
  }, []);
  const rows = restaurants.filter((r) => filter === "الكل" || r.status === filter);
  const appRows = applications.filter((a) => filter === "الكل" || a.status === filter);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="المطاعم">
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">لا توجد مستندات KYC للمطاعم — المراجعة تتم يدوياً حسب بيانات التسجيل فقط.</span>
        </Card>

        <Card className="flex flex-col gap-sm p-md">
          <Field label="بحث" icon="search" placeholder="اسم المطعم أو المنطقة" />
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

        <Table head={["المطعم", "المنطقة", "الفروع", "التقييم", "العمولة", "مزود التوصيل", "الحالة"]}>
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
              <Td>{a.branches}</Td>
              <Td>—</Td>
              <Td>—</Td>
              <Td>{a.deliveryType === "platform" ? "طلبات بيتك" : "المطعم"}</Td>
              <Td>
                <StatusBadge status={a.status} label={filterLabels[a.status] ?? a.status} />
              </Td>
            </tr>
          ))}
          {rows.map((r) => (
            <tr key={r.id} className="transition hover:bg-surface-container-low">
              <Td>
                <Link to="/admin/restaurants/$id" params={{ id: r.id }} className="flex items-center gap-2 font-label-lg text-label-lg text-secondary">
                  <img src={r.logo} alt="" className="size-8 rounded-full object-cover" />
                  {r.name}
                </Link>
              </Td>
              <Td className="text-on-surface-variant">{r.address}</Td>
              <Td>{r.branches}</Td>
              <Td>⭐ {r.rating}</Td>
              <Td>{r.commission}%</Td>
              <Td>{r.deliveryProvider === "TALABAT_BETAK" ? "طلبات بيتك" : "المطعم"}</Td>
              <Td>
                <StatusBadge status={r.status} label={filterLabels[r.status]} />
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
