import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useRef } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useVerifyOtp } from "@workspace/api-client-react";
import { saveSession, getSession, getRoleDashboard } from "@/lib/auth-session";
import {
  formatEgyptianMobileInternational,
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

type Role = "customer" | "partner" | "driver" | "admin";
type FlowType = "login" | "register";

function parseRole(value: unknown): Role | null {
  return value === "customer" || value === "partner" || value === "driver" || value === "admin"
    ? value
    : null;
}

const roleLabels: Record<Role, [string, string]> = {
  customer: ["حساب عميل", "Customer account"],
  partner: ["حساب مطعم", "Restaurant account"],
  driver: ["حساب مندوب", "Driver account"],
  admin: ["حساب مشرف", "Admin account"],
};

export const Route = createFileRoute("/auth/otp")({
  validateSearch: (search: Record<string, unknown>): { role?: Role; phone: string; type: FlowType } => {
    const role = parseRole(search["role"]);
    const p = typeof search["phone"] === "string" ? search["phone"] : "";
    const t = search["type"];
    const type = t === "register" ? "register" : "login";
    const phone = normalizeEgyptianMobile(p) ?? p;
    return {
      phone,
      type,
      // Login never carries a role, even if an old or malicious URL includes one.
      ...(type === "register" && role ? { role } : {}),
    };
  },
  beforeLoad: ({ search }) => {
    // If already logged in, skip OTP entirely
    const session = getSession();
    if (session) throw redirect({ to: getRoleDashboard(session.user.role) });
    // If no phone was passed, someone navigated here directly — send to login
    if (!search.phone) throw redirect({ to: "/auth/login" });
    // Registration needs the role chosen on the signup screen. Login does not.
    if (search.type === "register" && !search.role) throw redirect({ to: "/auth/register" });
  },
  head: () => ({
    meta: [{ title: translate("تأكيد الكود | طلبات بيتك", "Verify code | Talabat Betak") }],
  }),
  component: AuthOtp,
});

function AuthOtp() {
  const { t } = useTranslation();
  const { role, phone: searchPhone, type } = Route.useSearch();
  const phone = normalizeEgyptianMobile(searchPhone) ?? searchPhone;
  const internationalPhone = formatEgyptianMobileInternational(phone) ?? phone;
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const resendLock = useRef(false);
  const cooldown = useAuthCooldown(type, phone);

  async function routeAfterLogin(
    actualRole: Role,
    token: string,
    user: { lat?: number | null; lng?: number | null },
  ) {
    // Location is customer-only. A customer without a saved location must
    // always complete that step before entering the app.
    if (actualRole === "customer") {
      navigate({ to: user.lat !== null && user.lat !== undefined ? "/app" : "/auth/location" });
      return;
    }

    // Never let branch lookup outrank an administrator's canonical dashboard.
    if (actualRole === "admin") {
      navigate({ to: "/admin" });
      return;
    }

    // Branch assignment takes precedence over the partner dashboard and
    // onboarding status, but is intentionally never checked for admin or
    // customer sessions.
    if (actualRole === "partner") {
      try {
        const branchRes = await fetch("/api/branch/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (branchRes.ok) {
          const branchData = await branchRes.json() as { assigned: boolean };
          if (branchData.assigned) {
            navigate({ to: "/branch" });
            return;
          }
        }
      } catch {
        // Fall through to the status lookup on a transient branch failure.
      }
    }

    // A partner/driver account may have been created before its application
    // was completed. Resolve that state from the authenticated session rather
    // than from the URL role.
    let status: string | null | undefined;
    try {
      const statusRes = await fetch("/api/onboard/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statusRes.ok) {
        const statusData = await statusRes.json() as { status?: string | null };
        status = statusData.status ?? null;
      }
    } catch {
      // A transient status failure falls through to the normal dashboard gate.
    }

    if (status === null) {
      navigate({ to: actualRole === "partner" ? "/auth/register-restaurant" : "/auth/driver" });
      return;
    }
    if (status !== undefined && !["APPROVED", "ACTIVE"].includes(status)) {
      navigate({ to: "/auth/pending" });
      return;
    }

    navigate({ to: getRoleDashboard(actualRole) });
  }

  const verifyOtp = useVerifyOtp({
    mutation: {
      onSuccess: async (data) => {
        const actualRole = parseRole(data.user.role);
        if (!actualRole) {
          setError(t("الدور المستلم من الخادم غير صحيح", "The role returned by the server is invalid."));
          return;
        }
        saveSession({
          token: data.token,
          user: {
            id: data.user.id,
            phone: data.user.phone,
            role: actualRole,
            name: data.user.name ?? null,
            lat: data.user.lat ?? null,
            lng: data.user.lng ?? null,
          },
        });
        if (type === "register") {
          // New account → role-specific onboarding. The session response is
          // authoritative; the URL role is never used for this decision.
          if (actualRole === "customer") navigate({ to: "/auth/location" });
          else if (actualRole === "partner") navigate({ to: "/auth/register-restaurant" });
          else if (actualRole === "driver") navigate({ to: "/auth/driver" });
          else setError(t("لا يمكن إنشاء حساب مشرف من هنا", "Admin accounts cannot be created here."));
        } else {
          await routeAfterLogin(actualRole, data.token, data.user);
        }
      },
      onError: (err: unknown) => {
        const details = parseAuthApiError(err);
        if (details.retryAfterSeconds) cooldown.start(details.retryAfterSeconds);
        setError(authApiErrorMessage(err, {
          fallback: t("الكود غير صحيح، حاول تاني", "The code is incorrect. Please try again."),
          tooManyAttemptsFallback: t("محاولات كثيرة، استنى شوية وحاول تاني", "Too many attempts. Please wait a little and try again."),
        }));
        setDigits(Array(6).fill(""));
        inputRefs.current[0]?.focus();
      },
    },
  });

  function handleDigit(idx: number, val: string) {
    const ch = val.replace(/\D/g, "").slice(-1);
    const next = [...digits];
    next[idx] = ch;
    setDigits(next);
    setError("");
    if (ch && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text) {
      setDigits([...text.split(""), ...Array(6).fill("")].slice(0, 6));
      inputRefs.current[Math.min(text.length, 5)]?.focus();
    }
  }

  function handleConfirm() {
    const code = digits.join("");
    if (code.length < 6) { setError(t("أدخل الكود كامل (6 أرقام)", "Enter the complete 6-digit code")); return; }
    if (type === "register" && !role) {
      setError(t("اختار نوع الحساب أولاً", "Choose an account type first"));
      return;
    }
    verifyOtp.mutate({
      data: type === "register"
        ? { phone, otp: code, role, type }
        : { phone, otp: code, type },
    });
  }

  const mm = String(Math.floor(cooldown.seconds / 60)).padStart(2, "0");
  const ss = String(cooldown.seconds % 60).padStart(2, "0");
  const backTo = type === "register" ? "/auth/register" : "/auth/login";

  return (
     <AuthShell title={t("تأكيد الكود", "Verify code")} subtitle={`${t("الكود اتبعت برسالة SMS لـ", "The code was sent by SMS to")} ${internationalPhone}`} back={backTo}>

      <div className="flex items-center gap-2 rounded-card bg-secondary-container p-md">
        <Icon name={type === "register" ? "person_add" : "login"} className="text-[18px] text-on-secondary-container" />
         <p className="font-label-md text-label-md text-on-secondary-container">
           {type === "register" && role ? (
             <>{t("إنشاء", "Create")} {t(...roleLabels[role])}</>
           ) : (
             t("تسجيل الدخول", "Log in")
           )}{" "}
           — {t("أدخل الكود لتأكيد رقمك", "Enter the code to verify your number")}
        </p>
      </div>

      {/* OTP boxes */}
      <div className="tb-stagger flex items-center justify-center gap-2" dir="ltr" onPaste={handlePaste}>
        {Array.from({ length: 6 }).map((_, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digits[i]}
            onChange={(e) => handleDigit(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={`size-11 rounded-button border-2 bg-surface-container-lowest text-center font-headline-md text-headline-md text-on-surface outline-none transition ${
              error ? "border-error" : "border-outline-variant focus:border-secondary"
            }`}
          />
        ))}
      </div>

      {/* Resend row */}
      <div className="flex items-center justify-between">
        <span className="font-label-md text-label-md text-on-surface-variant">
           {cooldown.seconds > 0 ? t("إعادة الإرسال بعد {time}", "Resend in {time}", { time: `${mm}:${ss}` }) : t("يمكنك إعادة الإرسال الآن", "You can resend now")}
        </span>
        <button
           disabled={cooldown.seconds > 0 || resending}
          onClick={async () => {
             if (resendLock.current || cooldown.isActive) return;
             resendLock.current = true;
            setResending(true);
            setError("");
            try {
               const endpoint = type === "login" ? "/api/auth/request-otp" : "/api/auth/register";
               if (type === "register" && !role) {
                 setError(t("اختار نوع الحساب أولاً", "Choose an account type first"));
                 return;
               }
              const r = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                 body: JSON.stringify(type === "login" ? { phone } : { phone, role }),
              });
               const data = await r.json().catch(() => undefined);
               const responseError = { status: r.status, data, headers: r.headers };
               const details = parseAuthApiError(responseError);
              if (!r.ok) {
                 if (details.retryAfterSeconds) cooldown.start(details.retryAfterSeconds);
                 setError(authApiErrorMessage(responseError, {
                   fallback: t("تعذر إرسال كود التحقق، حاول مرة أخرى", "Unable to send a verification code. Please try again."),
                   tooManyAttemptsFallback: t("محاولات كثيرة، استنى شوية وحاول تاني", "Too many attempts. Please wait a little and try again."),
                 }));
              } else {
                 cooldown.start(details.retryAfterSeconds ?? AUTH_OTP_COOLDOWN_SECONDS);
                setDigits(Array(6).fill(""));
              }
            } catch {
               setError(t("تعذر إرسال كود التحقق، حاول مرة أخرى", "Unable to send a verification code. Please try again."));
            } finally {
              setResending(false);
            }
          }}
          className="rounded-button px-3 py-1.5 font-label-lg text-label-lg text-secondary disabled:text-outline"
        >
           {resending ? t("جاري الإرسال...", "Sending...") : t("إعادة الإرسال", "Resend")}
        </button>
      </div>

      <div className="flex items-center rounded-card bg-surface-container-low p-md">
        <Icon name="lock_clock" className="text-[18px] text-on-surface-variant" />
         <span className="mr-1.5 font-label-md text-label-md text-on-surface-variant">{t("الكود صالح 5 دقايق", "The code is valid for 5 minutes")}</span>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">{error}</p>
        </div>
      )}

      <Button className="w-full" icon="check_circle" onClick={handleConfirm} disabled={verifyOtp.isPending}>
         {verifyOtp.isPending ? t("جاري التأكيد...", "Verifying...") : t("تأكيد", "Verify")}
      </Button>

      <button onClick={() => navigate({ to: backTo })} className="text-center font-body-md text-body-md text-secondary hover:underline">
         {type === "register" ? t("تغيير الرقم أو نوع الحساب", "Change number or account type") : t("تغيير الرقم", "Change number")}
      </button>
    </AuthShell>
  );
}
