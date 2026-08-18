import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Button, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { branches } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/branches")({
  head: () => ({
    meta: [
      { title: "الفروع — طلبات بيتك" },
      { name: "description", content: "إدارة فروع مطعمك، فتحها وإغلاقها ومتابعة أداء كل فرع." },
      { property: "og:title", content: "الفروع — طلبات بيتك" },
      { property: "og:description", content: "إدارة فروع مطعمك، فتحها وإغلاقها ومتابعة أداء كل فرع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerBranches,
});

function PartnerBranches() {
  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="صاحب مطعم — برجر هاوس"
      nav={partnerNav}
      title="الفروع"
      actions={<Button icon="add">إضافة فرع</Button>}
    >
      <div className="tb-stagger grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
        {branches.map((b) => (
          <Card key={b.id} className="flex flex-col gap-sm p-md transition hover:shadow-md">
            <div className="flex items-center justify-between">
              <Link to="/partner/branches/$id" params={{ id: b.id }} className="font-headline-md text-headline-md text-on-surface hover:underline">
                {b.name}
              </Link>
              <button className={`relative h-6 w-11 rounded-full transition ${b.open ? "bg-primary-container" : "bg-surface-container-high"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${b.open ? "right-0.5" : "right-5"}`} />
              </button>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant">المدير: {b.manager}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{b.phone}</p>
            <div className="flex items-center gap-2">
              <Badge tone="neutral"><Icon name="group" className="text-[14px]" />{b.staff} موظف</Badge>
              <Badge tone="info"><Icon name="receipt_long" className="text-[14px]" />{b.ordersToday} طلب اليوم</Badge>
              <Badge tone={b.open ? "success" : "danger"}>{b.open ? "مفتوح" : "مغلق"}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </DashboardShell>
  );
}
