import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button, Card, DashboardShell, Field, Icon, SectionTitle, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, pricingTiers } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/pricing")({
  head: () => ({
    meta: [
      { title: "تسعير التوصيل | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "إدارة شرائح تسعير التوصيل حسب المسافة ونسبة عمولة المندوب." },
      { property: "og:title", content: "تسعير التوصيل | طلبات بيتك" },
      { property: "og:description", content: "إدارة شرائح تسعير التوصيل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPricing,
});

function AdminPricing() {
  const [rate, setRate] = useState(70);
  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="تسعير التوصيل">
      <div className="tb-stagger flex flex-col gap-md">
        <Card className="flex items-center gap-2 bg-secondary-container p-md text-on-secondary-container">
          <Icon name="info" />
          <span className="font-label-lg text-label-lg">التسعير قابل للتعديل بدون تغيير في الكود — أي تعديل يظهر فوراً على تطبيقات العملاء.</span>
        </Card>

        <Card className="p-md">
          <SectionTitle title="شرائح المسافة" icon="route" />
          <Table head={["من (كم)", "إلى (كم)", "السعر", "الحالة", ""]}>
            {pricingTiers.map((t) => (
              <tr key={t.id}>
                <Td>{t.from}</Td>
                <Td>{t.to}</Td>
                <Td>{EGP(t.price)}</Td>
                <Td><StatusBadge status={t.active ? "ACTIVE" : "PENDING"} label={t.active ? "نشط" : "غير نشط"} /></Td>
                <Td>
                  <div className="flex gap-1">
                    <Button variant="ghost" icon="edit">تعديل</Button>
                    <Button variant={t.active ? "outline" : "primary"} icon={t.active ? "toggle_off" : "toggle_on"}>
                      {t.active ? "تعطيل" : "تنشيط"}
                    </Button>
                    <Button variant="danger" icon="delete">حذف</Button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        </Card>

        <Card className="p-md">
          <SectionTitle title="إضافة شريحة جديدة" icon="add_road" />
          <div className="grid grid-cols-1 gap-sm md:grid-cols-4 md:items-end">
            <Field label="من مسافة (كم)" placeholder="0" />
            <Field label="إلى مسافة (كم)" placeholder="5" />
            <Field label="السعر (ج.م)" placeholder="20" />
            <label className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface-variant">
              <input type="checkbox" defaultChecked className="size-4" /> نشطة
            </label>
          </div>
          <Button className="mt-sm" icon="add">إضافة الشريحة</Button>
        </Card>

        <Card className="p-md">
          <SectionTitle title="عمولة المندوب" icon="two_wheeler" />
          <div className="flex items-center gap-sm">
            <input type="range" min={40} max={90} value={rate} onChange={(e) => setRate(Number(e.target.value))} className="flex-1" />
            <span className="font-headline-md text-headline-md text-on-surface">{rate}%</span>
          </div>
          <p className="mt-sm font-label-md text-label-md text-on-surface-variant">
            مثال: رسوم توصيل {EGP(50)} × {rate}% = {EGP(Math.round((50 * rate) / 100))} تُصرف للمندوب
          </p>
          <Button className="mt-sm" icon="save" variant="outline">حفظ نسبة المندوب</Button>
        </Card>
      </div>
    </DashboardShell>
  );
}
