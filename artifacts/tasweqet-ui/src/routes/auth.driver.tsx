import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Badge, Button, Field, Icon, StatusBadge } from "@/components/tb/shell";

export const Route = createFileRoute("/auth/driver")({
  head: () => ({
    meta: [
      { title: "تسجيل مندوب توصيل | طلبات بيتك" },
      { name: "description", content: "انضم كمندوب توصيل وارفع مستنداتك لتفعيل حسابك." },
      { property: "og:title", content: "تسجيل مندوب توصيل | طلبات بيتك" },
      { property: "og:description", content: "انضم كمندوب توصيل وارفع مستنداتك لتفعيل حسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthDriver,
});

const docs = [
  { label: "صورة الرقم القومي (وجه)", uploaded: true },
  { label: "صورة الرقم القومي (ظهر)", uploaded: true },
  { label: "الفيش والتشبيه (السجل الجنائي)", uploaded: false },
  { label: "رخصة القيادة / مستند إضافي", uploaded: false },
];

const statuses = ["PENDING", "UNDER_REVIEW", "APPROVED", "REJECTED", "SUSPENDED"];
const statusLabels: Record<string, string> = {
  PENDING: "قيد الإرسال",
  UNDER_REVIEW: "قيد المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  SUSPENDED: "موقوف",
};

function AuthDriver() {
  return (
    <AuthShell title="تسجيل مندوب توصيل" subtitle="انضم لأسطول طلبات بيتك واربح من توصيلاتك" back="/auth/welcome">
      <p className="font-label-lg text-label-lg text-on-surface">البيانات الشخصية</p>
      <Field label="الاسم بالكامل" placeholder="محمود سعيد" icon="person" />
      <Field label="رقم الموبايل (واتساب)" placeholder="100 222 3333" icon="chat" type="tel" />
      <Field label="كلمة السر" placeholder="••••••••" icon="lock" type="password" />

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">المنطقة</span>
        <select className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-secondary">
          <option>المعادي</option>
          <option>مدينة نصر</option>
          <option>الدقي</option>
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">نوع المركبة</span>
        <select className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-body-md text-body-md text-on-surface outline-none focus:border-secondary">
          <option>موتوسيكل</option>
          <option>دراجة</option>
          <option>سيارة</option>
        </select>
      </label>

      <hr className="border-outline-variant" />

      <p className="font-label-lg text-label-lg text-on-surface">المستندات المطلوبة</p>
      <div className="tb-stagger flex flex-col gap-2">
        {docs.map((d) => (
          <div
            key={d.label}
            className="flex items-center justify-between gap-2 rounded-card border border-outline-variant p-md"
          >
            <div className="flex items-center gap-2">
              <Icon name="description" className="text-[20px] text-on-surface-variant" />
              <span className="font-body-md text-body-md text-on-surface">{d.label}</span>
            </div>
            {d.uploaded ? (
              <Badge tone="success">تم الرفع</Badge>
            ) : (
              <Button variant="outline" icon="upload" className="!px-3 !py-1.5 text-[12px]">
                رفع
              </Button>
            )}
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 font-label-lg text-label-lg text-on-surface">حالة التوثيق</p>
        <div className="flex flex-wrap items-center gap-1.5">
          {statuses.map((s) => (
            <Badge key={s} tone={s === "UNDER_REVIEW" ? "info" : "neutral"}>
              {statusLabels[s]}
            </Badge>
          ))}
        </div>
        <div className="mt-2">
          <StatusBadge status="UNDER_REVIEW" label="حسابك الآن قيد المراجعة" />
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-card bg-error-container/60 p-md">
        <Icon name="warning" className="mt-0.5 text-[18px] text-on-error-container" />
        <p className="font-label-md text-label-md text-on-error-container">
          المندوبين غير الموافق عليهم لا يمكنهم استلام طلبات حتى تكتمل المراجعة.
        </p>
      </div>

      <Link to="/auth/otp" search={{ role: "driver" as const }}>
        <Button className="w-full" icon="send">إرسال للمراجعة</Button>
      </Link>
    </AuthShell>
  );
}
