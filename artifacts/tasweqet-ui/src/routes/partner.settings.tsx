import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, SectionTitle, Field, MapCanvas, Badge, Icon, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { restaurantOf } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/settings")({
  head: () => ({
    meta: [
      { title: "بيانات المطعم — طلبات بيتك" },
      { name: "description", content: "إدارة الملف الشخصي للمطعم وإعدادات التوصيل." },
      { property: "og:title", content: "بيانات المطعم — طلبات بيتك" },
      { property: "og:description", content: "إدارة الملف الشخصي للمطعم وإعدادات التوصيل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerSettings,
});

function PartnerSettings() {
  const r = restaurantOf("burger-house")!;
  const [provider, setProvider] = useState(r.deliveryProvider);
  const steps = ["PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE"];
  const currentIdx = steps.indexOf(r.status);

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="بيانات المطعم">
      <div className="tb-stagger flex flex-col gap-lg">
        <Card className="overflow-hidden">
          <div className="relative h-36 w-full">
            <img src={r.cover} alt="" className="h-full w-full object-cover" />
            <img src={r.logo} alt="" className="absolute -bottom-6 right-md size-16 rounded-full border-4 border-surface-container-lowest object-cover" />
          </div>
          <div className="p-md pt-8 flex gap-2">
            <Button variant="outline" icon="image">تغيير الغلاف</Button>
            <Button variant="outline" icon="add_a_photo">تغيير الشعار</Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <Card className="p-md">
            <SectionTitle title="البيانات الأساسية" icon="storefront" />
            <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
              <Field label="اسم المطعم" value={r.name} />
              <Field label="الهاتف" value={r.phone} icon="call" />
              <Field label="البريد الإلكتروني" value={r.email} icon="mail" />
              <Field label="العنوان" value={r.address} icon="place" />
            </div>
            <label className="mt-md flex flex-col gap-1.5">
              <span className="font-label-lg text-label-lg text-on-surface-variant">الوصف</span>
              <textarea defaultValue={r.description} className="min-h-20 rounded-button border border-outline-variant bg-surface-container-lowest p-2.5 font-body-md text-body-md outline-none" />
            </label>
          </Card>
          <MapCanvas>
            <span className="absolute right-1/2 top-1/2 flex size-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-lg">
              <Icon name="place" className="text-[18px]" />
            </span>
          </MapCanvas>
        </div>

        <Card className="p-md">
          <SectionTitle title="طريقة التوصيل" icon="delivery_dining" />
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setProvider("RESTAURANT")}
              className={`flex-1 rounded-button border-2 p-md text-right transition ${provider === "RESTAURANT" ? "border-secondary bg-secondary-container/40" : "border-outline-variant"}`}
            >
              <p className="font-label-lg text-label-lg text-on-surface">توصيل المطعم</p>
              <p className="font-label-md text-label-md text-on-surface-variant">مندوبين خاصين بالمطعم</p>
            </button>
            <button
              onClick={() => setProvider("TALABAT_BETAK")}
              className={`flex-1 rounded-button border-2 p-md text-right transition ${provider === "TALABAT_BETAK" ? "border-secondary bg-secondary-container/40" : "border-outline-variant"}`}
            >
              <p className="font-label-lg text-label-lg text-on-surface">توصيل طلبات بيتك</p>
              <p className="font-label-md text-label-md text-on-surface-variant">مندوبين المنصة</p>
            </button>
          </div>
          <div className="mt-md max-w-xs">
            <Field label="رسوم التوصيل" type="number" value={String(r.deliveryFee)} hint={provider === "RESTAURANT" ? "يمكنك تعديل الرسوم" : "الرسوم تحددها المنصة"} />
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="حالة التوثيق" icon="verified" />
          <div className="flex items-center gap-2">
            {steps.map((s, i) => (
              <div key={s} className="flex flex-1 items-center gap-2">
                <span className={`flex size-8 items-center justify-center rounded-full font-label-md text-label-md ${i <= currentIdx ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"}`}>
                  {i + 1}
                </span>
                {i < steps.length - 1 ? <span className={`h-0.5 flex-1 ${i < currentIdx ? "bg-primary-container" : "bg-surface-container"}`} /> : null}
              </div>
            ))}
          </div>
          <div className="mt-sm flex justify-between font-label-md text-label-md text-on-surface-variant">
            <span>قيد الانتظار</span><span>تحت المراجعة</span><span>موافق عليه</span><span>نشط</span>
          </div>
          <Badge tone="success" className="mt-sm w-fit">الحالة الحالية: نشط</Badge>
        </Card>

        <Card className="p-md">
          <SectionTitle title="العمولة" icon="percent" />
          <p className="font-body-md text-body-md text-on-surface-variant">تحددها الإدارة: {r.commission}%</p>
        </Card>

        <Button className="w-fit">حفظ التعديلات</Button>
      </div>
    </DashboardShell>
  );
}
