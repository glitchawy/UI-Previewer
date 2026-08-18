import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Field, MapCanvas, Stat, Badge, Icon, Table, Td } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { branches, staff, products } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/branches/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الفرع — طلبات بيتك" },
      { name: "description", content: "بيانات الفرع، الموقع، الموظفين والمخزون." },
      { property: "og:title", content: "تفاصيل الفرع — طلبات بيتك" },
      { property: "og:description", content: "بيانات الفرع، الموقع، الموظفين والمخزون." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerBranchDetail,
});

function PartnerBranchDetail() {
  const { id } = Route.useParams();
  const branch = branches.find((b) => b.id === id) ?? branches[0]!;
  const branchStaff = staff.filter((s) => s.branch === branch.name);
  const items = products.filter((p) => p["restaurantId"] === "burger-house").slice(0, 4);

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title={branch.name}>
      <div className="tb-stagger flex flex-col gap-lg">
        <Link to="/partner/branches" className="flex w-fit items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface">
          <Icon name="arrow_forward" className="text-[18px]" />
          رجوع للفروع
        </Link>

        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="طلبات اليوم" value={String(branch.ordersToday)} icon="receipt_long" tone="info" />
          <Stat label="الموظفين" value={String(branch.staff)} icon="group" tone="neutral" />
          <Stat label="المنطقة" value={branch.area} icon="place" tone="warn" />
          <Stat label="الحالة" value={branch.open ? "مفتوح" : "مغلق"} icon="storefront" tone={branch.open ? "success" : "danger"} />
        </div>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <Card className="p-md">
            <SectionTitle title="بيانات الفرع" icon="edit" />
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <Field label="اسم الفرع" value={branch.name} />
              <Field label="المدير" value={branch.manager} />
              <Field label="الهاتف" value={branch.phone} icon="call" />
              <Field label="المنطقة" value={branch.area} icon="place" />
            </div>
            <div className="mt-sm flex items-center gap-2">
              <span className="font-label-lg text-label-lg text-on-surface-variant">حالة التشغيل</span>
              <button className={`relative h-6 w-11 rounded-full transition ${branch.open ? "bg-primary-container" : "bg-surface-container-high"}`}>
                <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${branch.open ? "right-0.5" : "right-5"}`} />
              </button>
            </div>
            <Badge tone="info" className="mt-sm w-fit">مواعيد العمل على مستوى المطعم وليس الفرع</Badge>
          </Card>

          <MapCanvas>
            <span className="absolute right-1/2 top-1/2 flex size-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-lg">
              <Icon name="storefront" className="text-[18px]" />
            </span>
          </MapCanvas>
        </div>

        <Card className="p-md">
          <SectionTitle title="فريق الفرع" icon="group" />
          <Table head={["الاسم", "الوظيفة", "الهاتف", "الحالة"]}>
            {branchStaff.map((s) => (
              <tr key={s.id}>
                <Td>{s.name}</Td>
                <Td>{s.role}</Td>
                <Td>{s.phone}</Td>
                <Td><Badge tone={s.active ? "success" : "neutral"}>{s.active ? "نشط" : "موقوف"}</Badge></Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card className="p-md">
          <SectionTitle title="مخزون الفرع" icon="inventory_2" />
          <Table head={["المنتج", "المخزون"]}>
            {items.map((p, i) => (
              <tr key={p.id}>
                <Td>{p.name}</Td>
                <Td>{20 - i * 3}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </DashboardShell>
  );
}
