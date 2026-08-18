import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Table, Td, Badge, Button, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { staff } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/staff")({
  head: () => ({
    meta: [
      { title: "الموظفين — طلبات بيتك" },
      { name: "description", content: "إدارة موظفي المطعم في كل الفروع وصلاحياتهم." },
      { property: "og:title", content: "الموظفين — طلبات بيتك" },
      { property: "og:description", content: "إدارة موظفي المطعم في كل الفروع وصلاحياتهم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerStaff,
});

function PartnerStaff() {
  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="صاحب مطعم — برجر هاوس"
      nav={partnerNav}
      title="الموظفين"
      actions={<Button icon="person_add">إضافة موظف</Button>}
    >
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          الموظف ينتمي لفرع واحد فقط
        </Badge>
        <Table head={["الاسم", "الوظيفة", "الفرع", "الهاتف", "الحالة", ""]}>
          {staff.map((s) => (
            <tr key={s.id} className="transition hover:bg-surface-container-low">
              <Td>{s.name}</Td>
              <Td><Badge tone="neutral">{s.role}</Badge></Td>
              <Td>{s.branch}</Td>
              <Td>{s.phone}</Td>
              <Td><Badge tone={s.active ? "success" : "danger"}>{s.active ? "نشط" : "موقوف"}</Badge></Td>
              <Td>
                <Button variant="outline" icon="swap_horiz" className="!px-3 !py-1.5">نقل فرع</Button>
              </Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
