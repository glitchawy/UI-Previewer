import { createFileRoute } from "@tanstack/react-router";
import { Card, DashboardShell, Field, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/customers")({
  head: () => ({
    meta: [
      { title: "العملاء | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "قائمة عملاء المنصة، أرصدة المحافظ والإنفاق." },
      { property: "og:title", content: "العملاء | طلبات بيتك" },
      { property: "og:description", content: "قائمة عملاء المنصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminCustomers,
});

const customers = [
  { name: "أحمد محمود", phone: "01•• ••• 4567", area: "المعادي", orders: 42, spend: 8640, wallet: 340, joined: "يناير 2024", status: "ACTIVE" },
  { name: "سارة علي", phone: "01•• ••• 6543", area: "مصر الجديدة", orders: 18, spend: 3120, wallet: 0, joined: "مارس 2024", status: "ACTIVE" },
  { name: "محمد خالد", phone: "01•• ••• 4455", area: "الجيزة", orders: 9, spend: 1450, wallet: 60, joined: "مايو 2024", status: "ACTIVE" },
  { name: "نورهان سمير", phone: "01•• ••• 2233", area: "القاهرة", orders: 3, spend: 315, wallet: 105, joined: "يوليو 2024", status: "SUSPENDED" },
  { name: "ياسمين عادل", phone: "01•• ••• 7788", area: "المهندسين", orders: 27, spend: 5210, wallet: 0, joined: "فبراير 2024", status: "ACTIVE" },
  { name: "عمر حسن", phone: "01•• ••• 9911", area: "التجمع", orders: 61, spend: 12480, wallet: 220, joined: "نوفمبر 2023", status: "ACTIVE" },
];

function AdminCustomers() {
  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="العملاء">
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="privacy_tip" />
          <span className="font-label-lg text-label-lg">بيانات العملاء لا تُشارك مع المطاعم — تظهر فقط داخل لوحة سوبر أدمن.</span>
        </Card>

        <Card className="p-md">
          <Field label="بحث" icon="search" placeholder="ابحث باسم العميل أو رقم الهاتف" />
        </Card>

        <Table head={["الاسم", "الهاتف", "المنطقة", "الطلبات", "إجمالي الإنفاق", "رصيد المحفظة", "تاريخ الانضمام", "الحالة"]}>
          {customers.map((c) => (
            <tr key={c.phone} className="transition hover:bg-surface-container-low">
              <Td>{c.name}</Td>
              <Td className="text-on-surface-variant">
                <span dir="ltr">{c.phone}</span>
              </Td>
              <Td>{c.area}</Td>
              <Td>{c.orders}</Td>
              <Td>{EGP(c.spend)}</Td>
              <Td>{EGP(c.wallet)}</Td>
              <Td className="text-on-surface-variant">{c.joined}</Td>
              <Td><StatusBadge status={c.status} label={c.status === "ACTIVE" ? "نشط" : "موقوف"} /></Td>
            </tr>
          ))}
        </Table>
      </div>
    </DashboardShell>
  );
}
