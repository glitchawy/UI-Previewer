import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Field, Icon } from "@/components/tb/shell";
import { getSession, logoutSession, saveSession, getRoleDashboard } from "@/lib/auth-session";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/auth/onboard-customer")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    if (session.user.role !== "customer") throw redirect({ to: getRoleDashboard(session.user.role) });
    // Already completed onboarding → skip to app
    if (session.user.name) throw redirect({ to: "/app" });
  },
  head: () => ({
    meta: [{ title: translate("أكمل ملفك الشخصي | طلبات بيتك", "Complete your profile | Talabat Betak") }],
  }),
  component: OnboardCustomer,
});

function OnboardCustomer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const session = getSession();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) { setError(t("من فضلك أدخل اسمك الكامل", "Please enter your full name")); return; }
    if (trimmed.length < 3) { setError(t("الاسم يجب أن يكون 3 أحرف على الأقل", "Your name must be at least 3 characters")); return; }
    setSubmitting(true);
    setError("");
    try {
      const token = session?.token;
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? t("حصل خطأ", "Something went wrong"));
      }
      // Update cached session with the saved name
      if (session) {
        saveSession({ ...session, user: { ...session.user, name: trimmed } });
      }
      navigate({ to: "/app" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("حصل خطأ، حاول تاني", "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  }

  function handleSkip() {
    navigate({ to: "/app" });
  }

  async function handleLogout() {
    await logoutSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <AuthShell title={t("أكمل ملفك الشخصي", "Complete your profile")} subtitle={t("أدخل اسمك عشان نعرف نناديك صح", "Enter your name so we know what to call you")}>

      {/* Welcome banner */}
      <div className="flex items-center gap-3 rounded-card bg-primary-container p-md">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
          <Icon name="waving_hand" className="text-[20px]" />
        </span>
        <div>
          <p className="font-label-lg text-label-lg text-on-primary-container">{t("أهلاً بيك في طلبات بيتك!", "Welcome to Talabat Betak!")}</p>
          <p className="font-label-md text-label-md text-on-primary-container opacity-80" dir="ltr">
            +20{session?.user.phone}
          </p>
        </div>
      </div>

      {/* Name field */}
      <label className="flex flex-col gap-1.5">
         <span className="font-label-lg text-label-lg text-on-surface-variant">{t("الاسم بالكامل", "Full name")}</span>
        <span className={`flex items-center gap-2 rounded-button border bg-surface-container-lowest px-3 py-2.5 transition focus-within:border-secondary ${error ? "border-error" : "border-outline-variant"}`}>
          <Icon name="person" className="text-[20px] text-outline" />
          <input
            type="text"
            placeholder="مثال: أحمد محمد"
            value={name}
            onChange={(e) => { setName(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
            autoFocus
          />
        </span>
        {error && (
          <span className="flex items-center gap-1 font-label-md text-label-md text-error">
            <Icon name="error" className="text-[16px]" />{error}
          </span>
        )}
      </label>

      {/* Info chips */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-card bg-surface-container-low p-3">
          <Icon name="lock" className="text-[18px] text-on-surface-variant" />
           <p className="font-label-md text-label-md text-on-surface-variant">{t("اسمك بيظهر للمطعم والمندوب بس", "Your name is only shown to the restaurant and driver")}</p>
        </div>
        <div className="flex items-center gap-2 rounded-card bg-surface-container-low p-3">
          <Icon name="edit" className="text-[18px] text-on-surface-variant" />
           <p className="font-label-md text-label-md text-on-surface-variant">{t("تقدر تغيّره في أي وقت من الملف الشخصي", "You can change it anytime from your profile")}</p>
        </div>
      </div>

      <Button className="w-full" icon="check_circle" onClick={handleSubmit} disabled={submitting}>
         {submitting ? t("جاري الحفظ...", "Saving...") : t("متابعة", "Continue")}
      </Button>

      <button
        onClick={handleSkip}
        className="text-center font-label-lg text-label-lg text-outline transition hover:text-on-surface-variant"
      >
         {t("تخطي في الوقت الحالي", "Skip for now")}
      </button>

      <button
        onClick={handleLogout}
        className="flex items-center justify-center gap-1.5 font-label-md text-label-md text-on-surface-variant transition hover:text-error"
      >
        <Icon name="logout" className="text-[16px]" />
         {t("تسجيل الخروج", "Log out")}
      </button>

    </AuthShell>
  );
}
