import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useVerifyOtp } from "@workspace/api-client-react";
import { saveSession, getSession, getRoleDashboard } from "@/lib/auth-session";
import { translate, useTranslation } from "@/lib/i18n";

type Role = "customer" | "partner" | "driver" | "admin";
type FlowType = "login" | "register";

const roleLabels: Record<Role, [string, string]> = {
  customer: ["حساب عميل", "Customer account"],
  partner: ["حساب مطعم", "Restaurant account"],
  driver: ["حساب مندوب", "Driver account"],
  admin: ["حساب مشرف", "Admin account"],
};

const RESEND_SECONDS = 60;

export const Route = createFileRoute("/auth/otp")({
  validateSearch: (search: Record<string, unknown>): { role: Role; phone: string; type: FlowType } => {
    const r = search["role"];
    const p = typeof search["phone"] === "string" ? search["phone"] : "";
    const t = search["type"];
    return {
      role: r === "partner" || r === "driver" || r === "admin" ? r : "customer",
      phone: p,
      type: t === "register" ? "register" : "login",
    };
  },
  beforeLoad: ({ search }) => {
    // If already logged in, skip OTP entirely
    const session = getSession();
    if (session) throw redirect({ to: getRoleDashboard(session.user.role) });
    // If no phone was passed, someone navigated here directly — send to login
    if (!search.phone) throw redirect({ to: "/auth/login" });
  },
  head: () => ({
    meta: [{ title: translate("تأكيد الكود | طلبات بيتك", "Verify code | Talabat Betak") }],
  }),
  component: AuthOtp,
});

function AuthOtp() {
  const { t } = useTranslation();
  const { role, phone, type } = Route.useSearch();
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const [resending, setResending] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const verifyOtp = useVerifyOtp({
    mutation: {
      onSuccess: async (data) => {
        saveSession({
          token: data.token,
          user: {
            id: data.user.id,
            phone: data.user.phone,
            role: data.user.role as Role,
            name: data.user.name ?? null,
            lat: data.user.lat ?? null,
            lng: data.user.lng ?? null,
          },
        });
        if (type === "register") {
          // New account → role-specific onboarding
          if (role === "customer") navigate({ to: "/auth/location" });
          else if (role === "partner") navigate({ to: "/auth/register-restaurant" });
          else navigate({ to: "/auth/driver" });
        } else {
          // Login → check for branch assignment first; branch staff land on /branch
          // regardless of their primary account role
          if (role === "customer") {
            navigate({ to: data.user.lat ? "/app" : "/auth/location" });
          } else {
            try {
              const branchRes = await fetch("/api/branch/me", {
                headers: { Authorization: `Bearer ${data.token}` },
              });
              if (branchRes.ok) {
                const branchData = await branchRes.json() as { assigned: boolean };
                if (branchData.assigned) {
                  navigate({ to: "/branch" });
                  return;
                }
              }
            } catch { /* network error — fall through to role-based redirect */ }
            navigate({ to: getRoleDashboard(role) });
          }
        }
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? t("الكود غير صحيح، حاول تاني", "The code is incorrect. Please try again."));
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
    verifyOtp.mutate({ data: { phone, otp: code, role, type } });
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const backTo = type === "register" ? "/auth/register" : "/auth/login";

  return (
    <AuthShell title={t("تأكيد الكود", "Verify code")} subtitle={`${t("الكود اتبعت برسالة SMS لـ", "The code was sent by SMS to")} +20${phone}`} back={backTo}>

      <div className="flex items-center gap-2 rounded-card bg-secondary-container p-md">
        <Icon name={type === "register" ? "person_add" : "login"} className="text-[18px] text-on-secondary-container" />
         <p className="font-label-md text-label-md text-on-secondary-container">
           {type === "register" ? t("إنشاء", "Create") : t("دخول", "Log in")} {t(...roleLabels[role])} — {t("أدخل الكود لتأكيد رقمك", "Enter the code to verify your number")}
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
           {seconds > 0 ? t("إعادة الإرسال بعد {time}", "Resend in {time}", { time: `${mm}:${ss}` }) : t("يمكنك إعادة الإرسال الآن", "You can resend now")}
        </span>
        <button
          disabled={seconds > 0 || resending}
          onClick={async () => {
            setResending(true);
            setError("");
            try {
              const endpoint = type === "login" ? "/api/auth/request-otp" : "/api/auth/register";
              const r = await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ phone, role }),
              });
              const data = await r.json() as { error?: string; retryAfterSeconds?: number };
              if (!r.ok) {
                if (r.status === 429 && data.retryAfterSeconds) {
                  setSeconds(data.retryAfterSeconds);
                } else {
                   setError(data.error ?? t("فشل إعادة الإرسال", "Resending failed"));
                }
              } else {
                setSeconds(RESEND_SECONDS);
                setDigits(Array(6).fill(""));
              }
            } catch {
               setError(t("خطأ في الاتصال — تأكد من اتصالك بالإنترنت", "Connection error — check your internet connection"));
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
