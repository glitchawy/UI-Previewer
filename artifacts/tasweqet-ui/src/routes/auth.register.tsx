import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Button, Field } from "@/components/tb/shell";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | طلبات بيتك" },
      { name: "description", content: "أنشئ حساب عميل جديد على طلبات بيتك خلال دقيقة." },
      { property: "og:title", content: "إنشاء حساب | طلبات بيتك" },
      { property: "og:description", content: "أنشئ حساب عميل جديد على طلبات بيتك خلال دقيقة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthRegister,
});

function AuthRegister() {
  return (
    <AuthShell
      title="إنشاء حساب جديد"
      subtitle="بيانات بسيطة عشان نجهزلك الحساب"
      step={{ current: 1, total: 3 }}
      back="/auth/login"
    >
      <Field label="الاسم بالكامل" placeholder="أحمد محمود" icon="person" />
      <Field label="رقم الموبايل (واتساب)" placeholder="100 123 4567" icon="chat" type="tel" />
      <Field label="البريد الإلكتروني (اختياري)" placeholder="you@example.com" icon="mail" type="email" />
      <Field label="كلمة السر" placeholder="••••••••" icon="lock" type="password" />

      <label className="flex items-start gap-2">
        <input type="checkbox" className="mt-1 size-4 rounded border-outline-variant accent-primary" />
        <span className="font-label-md text-label-md text-on-surface-variant">
          موافق على الشروط والأحكام وسياسة الخصوصية
        </span>
      </label>

      <Link to="/auth/otp" search={{ role: "customer" as const }}>
        <Button className="w-full" icon="how_to_reg">إنشاء الحساب</Button>
      </Link>

      <p className="text-center font-body-md text-body-md text-on-surface-variant">
        عندك حساب بالفعل؟{" "}
        <Link to="/auth/login" className="text-secondary hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </AuthShell>
  );
}
