import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Icon, Badge } from "@/components/tb/shell";
import { getSession, clearSession, getRoleDashboard } from "@/lib/auth-session";

export const Route = createFileRoute("/auth/pending")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    // Customers don't go through review — send to app
    if (session.user.role === "customer") throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [{ title: "قيد المراجعة | طلبات بيتك" }],
  }),
  component: AuthPending,
});

const roleConfig = {
  partner: {
    icon: "storefront",
    title: "تم استلام طلب تسجيل مطعمك!",
    subtitle: "فريق طلبات بيتك بيراجع بياناتك دلوقتي",
    steps: [
      { label: "استلام الطلب", done: true },
      { label: "مراجعة البيانات", done: false, active: true },
      { label: "تنشيط الحساب", done: false },
    ],
    eta: "خلال 24–48 ساعة عمل",
    nextTitle: "إيه اللي هيحصل بعد كده؟",
    nextSteps: [
      { icon: "reviews", text: "هيراجع الفريق بياناتك والصور" },
      { icon: "call", text: "ممكن نتواصل معاك تليفونياً للتأكيد" },
      { icon: "storefront", text: "بعد القبول هتقدر تضيف المنيو وتستقبل طلبات" },
    ],
    dashboardTo: "/partner",
    dashboardLabel: "لوحة التحكم (عرض فقط)",
  },
  driver: {
    icon: "two_wheeler",
    title: "تم إرسال طلبك للمراجعة!",
    subtitle: "فريق التوثيق بيراجع مستنداتك الآن",
    steps: [
      { label: "رفع المستندات", done: true },
      { label: "مراجعة التوثيق", done: false, active: true },
      { label: "تفعيل الحساب", done: false },
    ],
    eta: "خلال 24–72 ساعة عمل",
    nextTitle: "ماذا يحدث بعد ذلك؟",
    nextSteps: [
      { icon: "fact_check", text: "بيتم التحقق من الرقم القومي ورخصة القيادة" },
      { icon: "sms", text: "هتوصلك رسالة SMS لما الحساب يتفعّل" },
      { icon: "two_wheeler", text: "بعد القبول تقدر تبدأ تستقبل عروض التوصيل فوراً" },
    ],
    dashboardTo: "/driver",
    dashboardLabel: "صفحتي (عرض فقط)",
  },
} as const;

function AuthPending() {
  const navigate = useNavigate();
  const session = getSession();
  const role = session?.user.role as "partner" | "driver" | undefined;
  const cfg = role ? roleConfig[role] : roleConfig.driver;

  function handleLogout() {
    clearSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <AuthShell title="" subtitle="">

      {/* Success hero */}
      <div className="flex flex-col items-center gap-md py-sm text-center">
        <span className="flex size-20 items-center justify-center rounded-full bg-success/15">
          <Icon name="check_circle" className="text-[48px] text-success" filled />
        </span>
        <div>
          <p className="font-headline-md text-headline-md text-on-surface">{cfg.title}</p>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{cfg.subtitle}</p>
        </div>
        <Badge tone="info">
          <Icon name="schedule" className="text-[14px]" />
          {cfg.eta}
        </Badge>
      </div>

      {/* Progress stepper */}
      <div className="rounded-card border border-outline-variant p-md">
        <p className="mb-3 font-label-lg text-label-lg text-on-surface">مسار المراجعة</p>
        <div className="flex items-center gap-1">
          {cfg.steps.map((step, i) => (
            <div key={step.label} className="flex flex-1 items-center gap-1">
              <div className="flex flex-1 flex-col items-center gap-1">
                <span
                  className={`flex size-8 items-center justify-center rounded-full transition ${
                    step.done
                      ? "bg-success text-on-primary"
                      : step.active
                      ? "bg-primary-container text-on-primary-container ring-2 ring-primary"
                      : "bg-surface-container text-on-surface-variant"
                  }`}
                >
                  {step.done ? (
                    <Icon name="check" className="text-[16px]" />
                  ) : (
                    <span className="font-label-md text-[11px]">{i + 1}</span>
                  )}
                </span>
                <span className={`text-center font-label-md text-[10px] ${step.active ? "text-on-surface font-label-lg" : "text-on-surface-variant"}`}>
                  {step.label}
                </span>
              </div>
              {i < cfg.steps.length - 1 && (
                <span className={`mb-4 h-0.5 flex-1 ${step.done ? "bg-success" : "bg-outline-variant"}`} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Next steps */}
      <div className="rounded-card border border-outline-variant p-md">
        <p className="mb-3 font-label-lg text-label-lg text-on-surface">{cfg.nextTitle}</p>
        <div className="flex flex-col gap-3">
          {cfg.nextSteps.map((s) => (
            <div key={s.text} className="flex items-start gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container">
                <Icon name={s.icon} className="text-[18px]" />
              </span>
              <p className="pt-1 font-body-md text-body-md text-on-surface-variant">{s.text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact info */}
      <div className="flex items-start gap-2 rounded-card bg-surface-container-low p-md">
        <Icon name="support_agent" className="mt-0.5 text-[18px] text-on-surface-variant" />
        <p className="font-label-md text-label-md text-on-surface-variant">
          عندك استفسار؟ تواصل معنا على{" "}
          <a href="mailto:support@tasweqet.eg" className="text-secondary underline">
            support@tasweqet.eg
          </a>
        </p>
      </div>

      <Button
        className="w-full"
        icon={cfg.icon}
        onClick={() => navigate({ to: cfg.dashboardTo as Parameters<typeof navigate>[0]["to"] })}
      >
        {cfg.dashboardLabel}
      </Button>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-1.5 font-label-md text-label-md text-on-surface-variant transition hover:text-error"
      >
        <Icon name="logout" className="text-[16px]" />
        تسجيل الخروج
      </button>

    </AuthShell>
  );
}
