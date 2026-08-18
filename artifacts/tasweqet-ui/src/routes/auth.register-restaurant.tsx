import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Badge, Button, Field, Icon, MapCanvas, StatusBadge } from "@/components/tb/shell";
import { categories } from "@/lib/tb/data";

export const Route = createFileRoute("/auth/register-restaurant")({
  head: () => ({
    meta: [
      { title: "تسجيل مطعم جديد | طلبات بيتك" },
      { name: "description", content: "سجّل مطعمك وابدأ البيع على منصة طلبات بيتك بدون مستندات معقدة." },
      { property: "og:title", content: "تسجيل مطعم جديد | طلبات بيتك" },
      { property: "og:description", content: "سجّل مطعمك وابدأ البيع على منصة طلبات بيتك بدون مستندات معقدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthRegisterRestaurant,
});

const steps = ["PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE"];
const stepLabels: Record<string, string> = {
  PENDING: "قيد الإرسال",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "تمت الموافقة",
  ACTIVE: "نشط",
};

function AuthRegisterRestaurant() {
  return (
    <AuthShell title="تسجيل مطعم جديد" subtitle="ابدأ البيع على طلبات بيتك خطوة بخطوة" back="/auth/welcome">
      <p className="font-label-lg text-label-lg text-on-surface">بيانات المالك</p>
      <Field label="اسم المالك" placeholder="هاني رمضان" icon="person" />
      <Field label="رقم الموبايل (واتساب)" placeholder="100 123 4567" icon="chat" type="tel" />
      <Field label="البريد الإلكتروني" placeholder="owner@restaurant.eg" icon="mail" type="email" />
      <Field label="كلمة السر" placeholder="••••••••" icon="lock" type="password" />

      <hr className="border-outline-variant" />

      <p className="font-label-lg text-label-lg text-on-surface">بيانات المطعم</p>
      <Field label="اسم المطعم" placeholder="برجر هاوس" icon="storefront" />
      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">الوصف</span>
        <textarea
          rows={2}
          placeholder="وصف قصير عن مطعمك"
          className="w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:border-secondary"
        />
      </label>

      <div className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">التصنيفات</span>
        <div className="flex flex-wrap gap-2">
          {categories.slice(0, 6).map((c, i) => (
            <Badge key={c.id} tone={i === 0 ? "warn" : "neutral"} className="cursor-pointer">
              <Icon name={c.icon} className="text-[14px]" />
              {c.name}
            </Badge>
          ))}
        </div>
      </div>

      <Field label="هاتف المطعم" placeholder="0100 123 4567" icon="call" type="tel" />
      <Field label="العنوان" placeholder="شارع 9، المعادي، القاهرة" icon="place" />
      <MapCanvas height="h-40" />
      <Field label="عدد الفروع" placeholder="1" icon="store" type="number" />
      <Field label="مواعيد العمل" placeholder="10:00 ص — 2:00 ص" icon="schedule" />

      <div className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">نوع التوصيل</span>
        <div className="grid grid-cols-2 gap-2">
          <button className="rounded-button border-2 border-secondary bg-secondary-container px-3 py-2.5 font-label-lg text-label-lg text-on-secondary-container">
            توصيل المطعم
          </button>
          <button className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-label-lg text-label-lg text-on-surface-variant">
            توصيل طلبات بيتك
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-outline-variant py-6">
          <Icon name="add_photo_alternate" className="text-[24px] text-outline" />
          <span className="font-label-md text-label-md text-on-surface-variant">شعار المطعم</span>
        </label>
        <label className="flex flex-col items-center justify-center gap-1.5 rounded-card border-2 border-dashed border-outline-variant py-6">
          <Icon name="image" className="text-[24px] text-outline" />
          <span className="font-label-md text-label-md text-on-surface-variant">صورة الغلاف</span>
        </label>
      </div>

      <div className="flex items-center gap-2 rounded-card bg-success/10 p-md">
        <Icon name="verified_user" className="text-[18px] text-success" />
        <p className="font-label-md text-label-md text-success">لا نطلب مستندات KYC للمطاعم</p>
      </div>

      <div>
        <p className="mb-2 font-label-lg text-label-lg text-on-surface">مسار التوثيق</p>
        <div className="flex items-center gap-1">
          {steps.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={`flex size-7 items-center justify-center rounded-full font-label-md text-[11px] ${
                    i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-center font-label-md text-[10px] text-on-surface-variant">{stepLabels[s]}</span>
              </div>
              {i < steps.length - 1 ? <span className="h-0.5 flex-1 bg-outline-variant" /> : null}
            </div>
          ))}
        </div>
        <div className="mt-2">
          <StatusBadge status="PENDING" label="الحالة الحالية: قيد الإرسال" />
        </div>
      </div>

      <Link to="/auth/otp" search={{ role: "partner" as const }}>
        <Button className="w-full" icon="send">إرسال للتوثيق</Button>
      </Link>
    </AuthShell>
  );
}
