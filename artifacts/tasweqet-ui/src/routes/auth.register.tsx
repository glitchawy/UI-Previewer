import { useRef, useState } from "react";
import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useDevRegister, useGetAuthCapabilities, useRegisterOtp } from "@workspace/api-client-react";
import { clearSession, getSession, getRoleDashboard, saveSession, validateWithServer } from "@/lib/auth-session";
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

export const Route = createFileRoute("/auth/register")({
  beforeLoad: () => {
    const session = getSession();
    if (session) throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: translate("إنشاء حساب | طلبات بيتك", "Create an account | Talabat Betak") },
      { name: "description", content: translate("أنشئ حسابك الجديد برقم موبايلك المصري.", "Create your new account with your Egyptian mobile number.") },
    ],
  }),
  component: AuthRegister,
});

type Role = "customer" | "partner" | "driver";

const registerRoles: { value: Role; ar: string; en: string; icon: string; descAr: string; descEn: string }[] = [
  { value: "customer", ar: "عميل", en: "Customer", icon: "shopping_bag", descAr: "اطلب أكل من مطاعم قريبة منك", descEn: "Order food from nearby restaurants" },
  { value: "partner", ar: "مطعم / شريك", en: "Restaurant / Partner", icon: "storefront", descAr: "سجّل مطعمك واستقبل طلبات", descEn: "Register your restaurant and receive orders" },
  { value: "driver", ar: "مندوب توصيل", en: "Delivery driver", icon: "two_wheeler", descAr: "وصّل الطلبات واكسب أكتر", descEn: "Deliver orders and earn more" },
];

function AuthRegister() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const capabilities = useGetAuthCapabilities();
  const [role, setRole] = useState<Role>("customer");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [devRolePending, setDevRolePending] = useState<Role | null>(null);
  const registerLock = useRef(false);
  const devRegisterLock = useRef(false);

  const cleaned = normalizeEgyptianMobile(phone);
  const inlineError = touched ? getEgyptianMobileValidationMessage(phone, t) : null;
  const registerCooldown = useAuthCooldown("register", cleaned);

  const registerOtp = useRegisterOtp({
    mutation: {
      onSuccess: () => {
        if (!cleaned) return;
        registerCooldown.start(AUTH_OTP_COOLDOWN_SECONDS);
        navigate({ to: "/auth/otp", search: { role, phone: cleaned, type: "register" } });
      },
      onError: (err: unknown) => {
        const details = parseAuthApiError(err);
        if (details.retryAfterSeconds) registerCooldown.start(details.retryAfterSeconds);
        setError(authApiErrorMessage(err, {
          fallback: translate("تعذر إرسال كود التحقق، حاول مرة أخرى", "Unable to send a verification code. Please try again."),
          tooManyAttemptsFallback: translate("محاولات كثيرة، استنى شوية وحاول تاني", "Too many attempts. Please wait a little and try again."),
        }));
      },
      onSettled: () => {
        registerLock.current = false;
      },
    },
  });

  function handleSubmit() {
    if (registerLock.current) return;
    setTouched(true);
    setError("");
    const validationError = getEgyptianMobileValidationMessage(phone, t);
    if (validationError) { setError(validationError); return; }
    if (!cleaned) return;
    if (registerCooldown.isActive) {
      setError(t("استنى انتهاء العد التنازلي قبل طلب كود جديد", "Please wait for the countdown before requesting a new code."));
      return;
    }
    registerLock.current = true;
    registerOtp.mutate({ data: { phone: cleaned, role } });
  }

  const devRegister = useDevRegister();

  async function handleDevSignup(testRole: Role) {
    // React state is asynchronous; this ref closes the duplicate-click window
    // before React Query has a chance to update isPending.
    if (devRegisterLock.current) return;
    devRegisterLock.current = true;
    setError("");
    setDevRolePending(testRole);
    try {
      const data = await devRegister.mutateAsync({ data: { role: testRole } });
      // Replace any stale local role/session caches before writing the fresh
      // bearer so cart/favorites stores cannot leak between test accounts.
      clearSession();
      saveSession({
        token: data.token,
        user: {
          id: data.user.id,
          phone: data.user.phone,
          role: data.user.role as Role,
          name: data.user.name ?? null,
          lat: data.user.lat ?? null,
          lng: data.user.lng ?? null,
          addressText: data.user.addressText ?? null,
          addressDetails: data.user.addressDetails ?? null,
        },
        isDevMode: true,
      });
      const validated = await validateWithServer();
      if (!validated) throw new Error(translate("تعذر التحقق من جلسة حساب الاختبار", "Unable to verify the test account session"));
      if (validated.user.role === "customer") navigate({ to: "/auth/location" });
      else if (validated.user.role === "partner") navigate({ to: "/auth/register-restaurant" });
      else if (validated.user.role === "driver") navigate({ to: "/auth/driver" });
      else throw new Error(translate("دور حساب الاختبار غير صحيح", "The test account role is invalid"));
    } catch (err) {
      clearSession();
      setError(authApiErrorMessage(err, {
        fallback: translate("تعذر إنشاء حساب الاختبار", "Unable to create the test account"),
        tooManyAttemptsFallback: translate("محاولات كثيرة، استنى شوية وحاول تاني", "Too many attempts. Please wait a little and try again."),
      }));
    } finally {
      devRegisterLock.current = false;
      setDevRolePending(null);
    }
  }

  return (
    <AuthShell title={t("إنشاء حساب جديد", "Create a new account")} subtitle={t("أنشئ حسابك الجديد برقم موبايلك المصري", "Create your new account with your Egyptian mobile number")}>

      {/* Phone */}
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
            onChange={(e) => { setPhone(e.target.value); setError(""); }}
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

      {/* Role cards */}
      <div className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">{t("نوع الحساب", "Account type")}</span>
        <div className="flex flex-col gap-2">
          {registerRoles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex items-center gap-3 rounded-button border px-md py-sm text-right transition ${
                role === r.value
                  ? "border-2 border-secondary bg-secondary-container"
                  : "border-outline-variant bg-surface-container-lowest hover:border-secondary"
              }`}
            >
              <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${role === r.value ? "bg-secondary text-on-secondary" : "bg-surface-container text-on-surface-variant"}`}>
                <Icon name={r.icon} className="text-[20px]" />
              </span>
              <div className="flex flex-col items-start">
                  <span className={`font-label-lg text-label-lg ${role === r.value ? "text-on-secondary-container" : "text-on-surface"}`}>{t(r.ar, r.en)}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">{t(r.descAr, r.descEn)}</span>
              </div>
              {role === r.value && <Icon name="check_circle" className="mr-auto text-[20px] text-secondary" filled />}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start gap-2 rounded-card bg-primary-container/60 p-md">
        <Icon name="info" className="mt-0.5 text-[18px] text-on-primary-container" />
        <p className="font-label-md text-label-md text-on-primary-container">
          {t("رقم الموبايل بيتسجّل مرة واحدة فقط، ونوع الحساب مايتغيرش بعد التسجيل.", "A phone number can be registered only once, and the account type cannot be changed later.")}
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
          <div>
            <p className="font-label-md text-label-md text-on-error-container">{error}</p>
            {error.includes("مسجل بالفعل") && (
              <Link to="/auth/login" className="mt-1 inline-flex items-center gap-1 font-label-md text-label-md text-on-error-container underline">
                  <Icon name="login" className="text-[16px]" />{t("سجّل دخول بدلاً من ذلك", "Log in instead")}
              </Link>
            )}
          </div>
        </div>
      )}

      {registerCooldown.isActive && (
        <p role="status" className="text-center font-label-md text-label-md text-on-surface-variant">
          {t("يمكن طلب كود جديد بعد {time}", "You can request a new code in {time}", {
            time: `${String(Math.floor(registerCooldown.seconds / 60)).padStart(2, "0")}:${String(registerCooldown.seconds % 60).padStart(2, "0")}`,
          })}
        </p>
      )}

      <Button className="w-full" icon="person_add" onClick={handleSubmit} disabled={registerOtp.isPending || registerCooldown.isActive}>
        {registerOtp.isPending ? t("جاري الإنشاء...", "Creating...") : registerCooldown.isActive ? t("استنى شوية...", "Please wait...") : t("إنشاء الحساب", "Create account")}
      </Button>

      {capabilities.data?.publicTestLoginEnabled === true && (
        <section className="flex flex-col gap-3 rounded-card border-2 border-dashed border-error/40 bg-error-container/40 p-md">
          <div className="flex items-start justify-between gap-2">
            <div>
                <p className="font-label-lg text-label-lg text-on-error-container">{t("إنشاء حساب اختبار جديد", "Create a new test account")}</p>
              <p className="font-label-md text-label-md text-on-surface-variant">
                {t("حساب مستقل جديد ببيانات تجريبية — بدون رقم حقيقي أو رسالة OTP", "A new independent account with test data — no real number or OTP required")}
              </p>
            </div>
            <span className="rounded-full bg-error px-2 py-1 text-[10px] font-bold tracking-wide text-white">
              DEV MODE
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {registerRoles.map((testRole) => (
              <Button
                key={testRole.value}
                type="button"
                variant="outline"
                icon={testRole.icon}
                disabled={devRolePending !== null}
                onClick={() => handleDevSignup(testRole.value)}
              >
                {devRolePending === testRole.value ? t("جاري الإنشاء...", "Creating...") : t(testRole.ar, testRole.en)}
              </Button>
            ))}
          </div>
          {devRolePending !== null && (
            <p role="status" className="font-label-md text-label-md text-on-surface-variant">
              {t("جاري إنشاء حساب اختبار جديد وتأمين الجلسة...", "Creating a new test account and securing the session...")}
            </p>
          )}
        </section>
      )}

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-outline-variant" />
          <span className="font-label-md text-label-md text-on-surface-variant">{t("عندك حساب؟", "Already have an account?")}</span>
        <span className="h-px flex-1 bg-outline-variant" />
      </div>

      <Link to="/auth/login">
          <Button variant="outline" className="w-full" icon="login">{t("تسجيل الدخول", "Log in")}</Button>
      </Link>
    </AuthShell>
  );
}
