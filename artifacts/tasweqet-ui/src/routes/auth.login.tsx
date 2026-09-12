import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useRef, useState } from "react";
import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useGetAuthCapabilities, useRequestOtp } from "@workspace/api-client-react";
import { getSession, getRoleDashboard, saveSession, validateWithServer } from "@/lib/auth-session";
import {
  getEgyptianMobileValidationMessage,
  normalizeEgyptianMobile,
} from "@/lib/egyptian-phone";
import { translate, useTranslation } from "@/lib/i18n";
import {
  authApiErrorMessage,
  parseAuthApiError,
} from "@/lib/auth-errors";
import {
  AUTH_OTP_COOLDOWN_SECONDS,
  useAuthCooldown,
} from "@/hooks/use-auth-cooldown";

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    // Already logged in → skip to the right dashboard
    const session = getSession();
    if (session) throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: translate("تسجيل الدخول | طلبات بيتك", "Log in | Talabat Betak") },
      { name: "description", content: translate("سجّل دخولك برقم موبايلك واستلم كود التأكيد.", "Log in with your mobile number and receive a verification code.") },
    ],
  }),
  component: AuthLogin,
});

type Role = "customer" | "partner" | "driver" | "admin";

// These shortcuts are deliberately kept inside the DEV MODE section below.
// Normal login is identified by phone only; the server owns the account role.
const devRoles: { value: Role; ar: string; en: string; icon: string }[] = [
  { value: "customer", ar: "عميل", en: "Customer", icon: "shopping_bag" },
  { value: "partner", ar: "مطعم", en: "Restaurant", icon: "storefront" },
  { value: "driver", ar: "مندوب", en: "Driver", icon: "two_wheeler" },
  { value: "admin", ar: "مشرف", en: "Admin", icon: "admin_panel_settings" },
];

function AuthLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const capabilities = useGetAuthCapabilities();
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [devRolePending, setDevRolePending] = useState<Role | null>(null);
  const [canContinueToOtp, setCanContinueToOtp] = useState(false);
  const loginLock = useRef(false);

  const cleaned = normalizeEgyptianMobile(phone);
  const inlineError = touched ? getEgyptianMobileValidationMessage(phone, t) : null;
  const loginCooldown = useAuthCooldown("login", cleaned);

  const requestOtp = useRequestOtp({
    mutation: {
      onSuccess: () => {
        if (!cleaned) return;
        loginCooldown.start(AUTH_OTP_COOLDOWN_SECONDS);
        navigate({ to: "/auth/otp", search: { phone: cleaned, type: "login" } });
      },
      onError: (err: unknown) => {
        const details = parseAuthApiError(err);
        if (details.retryAfterSeconds) loginCooldown.start(details.retryAfterSeconds);
        setCanContinueToOtp(details.isOtpAlreadyRequested);
        setError(authApiErrorMessage(err, {
          fallback: translate("تعذر إرسال كود التحقق، حاول مرة أخرى", "Unable to send a verification code. Please try again."),
          tooManyAttemptsFallback: translate("محاولات كثيرة، استنى شوية وحاول تاني", "Too many attempts. Please wait a little and try again."),
        }));
      },
      onSettled: () => {
        loginLock.current = false;
      },
    },
  });

  function handleSubmit() {
    if (loginLock.current) return;
    setTouched(true);
    setError("");
    setCanContinueToOtp(false);
    const validationError = getEgyptianMobileValidationMessage(phone, t);
    if (validationError) { setError(validationError); return; }
    if (!cleaned) return;
    if (loginCooldown.isActive) {
      setError(t("استنى انتهاء العد التنازلي قبل طلب كود جديد", "Please wait for the countdown before requesting a new code."));
      return;
    }
    loginLock.current = true;
    requestOtp.mutate({ data: { phone: cleaned } });
  }

  function continueToExistingOtp() {
    if (!cleaned || !canContinueToOtp) return;
    navigate({ to: "/auth/otp", search: { phone: cleaned, type: "login" } });
  }

  async function handleDevLogin(testRole: Role) {
    setError("");
    setDevRolePending(testRole);
    try {
      const response = await fetch("/api/auth/dev-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: testRole }),
      });
      const data = (await response.json().catch(() => null)) as
        | {
          token?: string;
          user?: Parameters<typeof saveSession>[0]["user"];
          error?: string | { message?: string };
        }
        | null;
      if (!response.ok || !data?.token || !data.user) {
        const apiMessage = typeof data?.error === "string"
          ? data.error
          : data?.error?.message;
        throw new Error(apiMessage ?? translate("تعذر بدء جلسة الاختبار", "Unable to start the test session"));
      }
      saveSession({ token: data.token, user: data.user, isDevMode: true });
      const validated = await validateWithServer();
      if (!validated) throw new Error(translate("تعذر التحقق من جلسة الاختبار", "Unable to verify the test session"));
      navigate({ to: getRoleDashboard(validated.user.role) });
    } catch (err) {
      setError(authApiErrorMessage(err, {
        fallback: translate("تعذر بدء جلسة الاختبار", "Unable to start the test session"),
        tooManyAttemptsFallback: translate("محاولات كثيرة، استنى شوية وحاول تاني", "Too many attempts. Please wait a little and try again."),
      }));
    } finally {
      setDevRolePending(null);
    }
  }

  return (
    <AuthShell title={t("تسجيل الدخول", "Log in")} subtitle={t("ادخل برقم موبايلك عشان نبعتلك كود التأكيد", "Enter your mobile number and we'll send you a verification code")}>

      {/* Phone field */}
      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">{t("رقم الموبايل", "Mobile number")}</span>
        <span className={`flex items-center gap-2 rounded-button border bg-surface-container-lowest px-3 py-2.5 transition focus-within:border-secondary ${inlineError ? "border-error" : "border-outline-variant"}`}>
          <span dir="ltr" className="select-none font-label-lg text-label-lg text-on-surface-variant">+20</span>
          <span className="h-5 w-px bg-outline-variant" />
          <Icon name="call" className="text-[20px] text-outline" />
          <input
            type="tel"
            inputMode="numeric"
            placeholder="1X XXXX XXXX"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); setCanContinueToOtp(false); }}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
            maxLength={32}
            dir="ltr"
          />
        </span>
        <span className="font-label-md text-label-md text-on-surface-variant">
          {t("اكتب 10 أرقام بعد +20 أو 11 رقمًا محليًا يبدأ بـ 01 — يمكنك لصق الرقم كاملًا", "Enter 10 digits after +20 or an 11-digit local number starting with 01 — you can paste the full number")}
        </span>
        {inlineError && !error && (
          <span className="flex items-center gap-1 font-label-md text-label-md text-error">
            <Icon name="error" className="text-[16px]" />{inlineError}
          </span>
        )}
      </label>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
          <div>
            <p className="font-label-md text-label-md text-on-error-container">{error}</p>
            {error.includes("مش مسجل") && (
              <Link to="/auth/register" className="mt-1 inline-flex items-center gap-1 font-label-md text-label-md text-on-error-container underline">
                <Icon name="person_add" className="text-[16px]" />{t("سجّل حساب جديد", "Create a new account")}
              </Link>
            )}
          </div>
        </div>
      )}

      {canContinueToOtp && (
        <Button
          type="button"
          variant="outline"
          className="w-full"
          icon="sms"
          onClick={continueToExistingOtp}
        >
          {t("إدخال الكود الموجود", "Continue with the code already sent")}
        </Button>
      )}

      {loginCooldown.isActive && (
        <p role="status" className="text-center font-label-md text-label-md text-on-surface-variant">
          {t("يمكن طلب كود جديد بعد {time}", "You can request a new code in {time}", {
            time: `${String(Math.floor(loginCooldown.seconds / 60)).padStart(2, "0")}:${String(loginCooldown.seconds % 60).padStart(2, "0")}`,
          })}
        </p>
      )}

      <Button className="w-full" icon="arrow_forward" onClick={handleSubmit} disabled={requestOtp.isPending || loginCooldown.isActive}>
        {requestOtp.isPending ? t("جاري الإرسال...", "Sending...") : loginCooldown.isActive ? t("استنى شوية...", "Please wait...") : t("دخول", "Log in")}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-outline-variant" />
        <span className="font-label-md text-label-md text-on-surface-variant">{t("أو", "or")}</span>
        <span className="h-px flex-1 bg-outline-variant" />
      </div>

      <Link to="/auth/register">
        <Button variant="outline" className="w-full" icon="person_add">{t("إنشاء حساب جديد", "Create a new account")}</Button>
      </Link>

      {capabilities.data?.publicTestLoginEnabled === true && (
        <section className="flex flex-col gap-3 rounded-card border-2 border-dashed border-error/40 bg-error-container/40 p-md">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-label-lg text-label-lg text-on-error-container">{t("تسجيل دخول الاختبار", "Test login")}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {t("حسابات قاعدة بيانات حقيقية — للاختبار عبر الويب", "Real database accounts — for web testing")}
              </p>
            </div>
            <span className="rounded-full bg-error px-2 py-1 text-[10px] font-bold tracking-wide text-white">
              DEV MODE
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {devRoles.map((testRole) => (
              <Button
                key={testRole.value}
                type="button"
                variant="outline"
                icon={testRole.icon}
                disabled={devRolePending !== null}
                onClick={() => handleDevLogin(testRole.value)}
              >
                {devRolePending === testRole.value ? t("جاري الدخول...", "Logging in...") : t(testRole.ar, testRole.en)}
              </Button>
            ))}
          </div>
        </section>
      )}

      <div className="flex items-center gap-2 rounded-card bg-surface-container-low p-md">
        <Icon name="sms" className="text-[18px] text-on-surface-variant" />
        <p className="font-label-md text-label-md text-on-surface-variant">{t("هنبعتلك كود تأكيد برسالة SMS على رقمك المصري", "We'll send a verification code by SMS to your Egyptian number")}</p>
      </div>
    </AuthShell>
  );
}
