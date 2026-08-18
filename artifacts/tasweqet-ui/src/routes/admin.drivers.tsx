import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, DashboardShell, Field, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { drivers } from "@/lib/tb/data";

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
  const [filter, setFilter] = useState<(typeof filters)[number]>("الكل");
  const rows = drivers.filter((d) => filter === "الكل" || d.status === filter);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="المندوبين">
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">المندوب غير المعتمد لا يستلم طلبات حتى تكتمل مراجعة توثيقه.</span>
        </Card>

        <Card className="flex flex-col gap-sm p-md">
          <Field label="بحث" icon="search" placeholder="اسم المندوب أو المنطقة" />
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

        <Table head={["المندوب", "الهاتف", "النوع", "المنطقة", "المركبة", "التقييم", "التوصيلات", "الحالة"]}>
          {rows.map((d) => (
            <tr key={d.id} className="transition hover:bg-surface-container-low">
              <Td>
                <Link to="/admin/drivers/$id" params={{ id: d.id }} className="font-label-lg text-label-lg text-secondary">
                  {d.name}
                </Link>
              </Td>
              <Td className="text-on-surface-variant">{d.phone}</Td>
              <Td>{d.type === "TALABAT_BETAK" ? "مندوب المنصة" : "مندوب مطعم"}</Td>
              <Td>{d.area}</Td>
              <Td>{d.vehicle}</Td>
              <Td>⭐ {d.rating || "—"}</Td>
              <Td>{d.deliveries.toLocaleString("ar-EG")}</Td>
              <Td>
                <StatusBadge status={d.status} label={filterLabels[d.status]} />
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
