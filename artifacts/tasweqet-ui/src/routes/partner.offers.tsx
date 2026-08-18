import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Table, Td, Badge, Field, Button, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { offers } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/offers")({
  head: () => ({
    meta: [
      { title: "العروض — طلبات بيتك" },
      { name: "description", content: "إنشاء وإدارة عروض الخصم الخاصة بالمطعم." },
      { property: "og:title", content: "العروض — طلبات بيتك" },
      { property: "og:description", content: "إنشاء وإدارة عروض الخصم الخاصة بالمطعم." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerOffers,
});

function PartnerOffers() {
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="العروض">
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          لا يوجد استهداف عملاء أو نقاط ولاء
        </Badge>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Table head={["العرض", "النوع", "القيمة", "النطاق", "الفترة", "الاستخدام", "الحالة"]}>
              {offers.map((o) => (
                <tr key={o.id} className="transition hover:bg-surface-container-low">
                  <Td>{o.title}</Td>
                  <Td>{o.type}</Td>
                  <Td>{o.value}</Td>
                  <Td>{o.scope}</Td>
                  <Td>{o.from} — {o.to}</Td>
                  <Td>{o.used}</Td>
                  <Td>
                    <button className={`relative h-6 w-11 rounded-full transition ${o.active ? "bg-primary-container" : "bg-surface-container-high"}`}>
                      <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${o.active ? "right-0.5" : "right-5"}`} />
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          </div>
          <Card className="h-fit p-md">
            <SectionTitle title="إنشاء عرض" icon="local_offer" />
            <div className="flex flex-col gap-md">
              <Field label="عنوان العرض" placeholder="مثال: خصم 15% على البيتزا" />
              <label className="flex flex-col gap-1.5">
                <span className="font-label-lg text-label-lg text-on-surface-variant">نوع العرض</span>
                <select className="rounded-button border border-outline-variant bg-surface-container-lowest p-2.5 font-body-md text-body-md text-on-surface">
                  <option>نسبة خصم</option>
                  <option>خصم ثابت</option>
                  <option>منتج مجاني</option>
                </select>
              </label>
              <Field label="القيمة" placeholder="مثال: 15%" />
              <Field label="النطاق" placeholder="كل المنتجات / منتج محدد" />
              <div className="grid grid-cols-2 gap-sm">
                <Field label="من" type="date" />
                <Field label="إلى" type="date" />
              </div>
              <Button icon="add">إنشاء العرض</Button>
            </div>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
