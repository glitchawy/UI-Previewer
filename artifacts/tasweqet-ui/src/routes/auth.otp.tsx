import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";

type Role = "customer" | "partner" | "driver";

const roleLabels: Record<Role, string> = {
  customer: "حساب عميل",
  partner: "حساب مطعم",
  driver: "حساب مندوب",
};

export const Route = createFileRoute("/auth/otp")({
  validateSearch: (search: Record<string, unknown>): { role: Role } => {
    const r = search["role"];
    return { role: r === "partner" || r === "driver" ? r : "customer" };
  },
  head: () => ({
    meta: [
      { title: "تأكيد الكود | طلبات بيتك" },
      { name: "description", content: "أدخل كود التأكيد اللي وصلك على واتساب لتفعيل حسابك." },
      { property: "og:title", content: "تأكيد الكود | طلبات بيتك" },
      { property: "og:description", content: "أدخل كود التأكيد اللي وصلك على واتساب لتفعيل حسابك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthOtp,
});

function AuthOtp() {
  const { role } = Route.useSearch();

  return (
    <AuthShell title="تأكيد الكود" subtitle="الكود اتبعت على واتساب لـ ‎+20 100 123 4567" back="/auth/login">
      <div className="flex items-center gap-2 rounded-card bg-secondary-container p-md">
        <Icon name="badge" className="text-[18px] text-on-secondary-container" />
        <p className="font-label-md text-label-md text-on-secondary-container">
          بتأكد {roleLabels[role]} — بعد التأكيد هتدخل لوحة الحساب بتاعتك
        </p>
      </div>
      <div className="tb-stagger flex items-center justify-center gap-2" dir="ltr">
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            maxLength={1}
            defaultValue={i < 2 ? "5" : ""}
            className="size-11 rounded-button border-2 border-outline-variant bg-surface-container-lowest text-center font-headline-md text-headline-md text-on-surface outline-none focus:border-secondary"
          />
        ))}
      </div>

      <div className="flex items-center justify-between">
        <span className="font-label-md text-label-md text-on-surface-variant">إعادة الإرسال بعد 00:47</span>
        <button
          disabled
          className="rounded-button px-3 py-1.5 font-label-lg text-label-lg text-outline"
        >
          إعادة الإرسال
        </button>
      </div>

      <div className="flex items-center justify-between rounded-card bg-surface-container-low p-md">
        <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
          <Icon name="lock_clock" className="text-[18px]" />
          الكود صالح 5 دقايق
        </span>
        <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
          <Icon name="warning" className="text-[18px]" />
          محاولات متبقية: 3
        </span>
      </div>

      <div className="flex items-center gap-2 rounded-card bg-error-container p-md">
        <Icon name="error" className="text-[18px] text-on-error-container" />
        <p className="font-label-md text-label-md text-on-error-container">مثال: كود غير صحيح، حاول تاني</p>
      </div>

      {role === "customer" ? (
        <Link to="/auth/location">
          <Button className="w-full" icon="check_circle">تأكيد</Button>
        </Link>
      ) : (
        <Link to={role === "partner" ? "/partner" : "/driver"}>
          <Button className="w-full" icon="check_circle">
            {role === "partner" ? "تأكيد ودخول لوحة المطعم" : "تأكيد ودخول تطبيق المندوب"}
          </Button>
        </Link>
      )}

      <Link to="/auth/login" className="text-center font-body-md text-body-md text-secondary hover:underline">
        تغيير الرقم
      </Link>
    </AuthShell>
  );
}
