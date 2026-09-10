import { useState } from "react";
import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useRequestOtp } from "@workspace/api-client-react";
import { getSession, getRoleDashboard, saveSession, validateWithServer } from "@/lib/auth-session";

export const Route = createFileRoute("/auth/login")({
  beforeLoad: () => {
    // Already logged in → skip to the right dashboard
    const session = getSession();
    if (session) throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | طلبات بيتك" },
      { name: "description", content: "سجّل دخولك برقم موبايلك واستلم كود التأكيد." },
    ],
  }),
  component: AuthLogin,
});

type Role = "customer" | "partner" | "driver" | "admin";

const loginRoles: { value: Role; label: string; icon: string }[] = [
  { value: "customer", label: "عميل", icon: "shopping_bag" },
  { value: "partner", label: "مطعم", icon: "storefront" },
  { value: "driver", label: "مندوب", icon: "two_wheeler" },
  { value: "admin", label: "مشرف", icon: "admin_panel_settings" },
];

const EG_PHONE_RE = /^01[0125]\d{8}$/;

function validateEgPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-]/g, "");
  if (!cleaned) return "أدخل رقم الموبايل";
  if (!/^\d+$/.test(cleaned)) return "الرقم يجب أن يحتوي على أرقام فقط";
  if (cleaned.length !== 11) return "رقم الموبايل يجب أن يكون 11 رقماً";
  if (!cleaned.startsWith("01")) return "رقم الموبايل المصري يبدأ بـ 01";
  if (!EG_PHONE_RE.test(cleaned)) return "الشبكة غير معروفة — يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015";
  return null;
}

function AuthLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [devRolePending, setDevRolePending] = useState<Role | null>(null);

  const cleaned = phone.replace(/[\s\-]/g, "");
  const inlineError = touched ? validateEgPhone(phone) : null;

  const requestOtp = useRequestOtp({
    mutation: {
      onSuccess: () => {
        navigate({ to: "/auth/otp", search: { role, phone: cleaned, type: "login" } });
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? "اتاكد من رقم التليفون , او اعمل اكونت جديد");
      },
    },
  });

  function handleSubmit() {
    setTouched(true);
    setError("");
    const validationError = validateEgPhone(phone);
    if (validationError) { setError(validationError); return; }
    requestOtp.mutate({ data: { phone: cleaned, role } });
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
        throw new Error(apiMessage ?? "تعذر بدء جلسة الاختبار");
      }
      saveSession({ token: data.token, user: data.user, isDevMode: true });
      const validated = await validateWithServer();
      if (!validated) throw new Error("تعذر التحقق من جلسة الاختبار");
      navigate({ to: getRoleDashboard(validated.user.role) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر بدء جلسة الاختبار");
    } finally {
      setDevRolePending(null);
    }
  }

  return (
    <AuthShell title="تسجيل الدخول" subtitle="ادخل برقم موبايلك عشان نبعتلك كود التأكيد">

      {/* Phone field */}
      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">رقم الموبايل</span>
        <span className={`flex items-center gap-2 rounded-button border bg-surface-container-lowest px-3 py-2.5 transition focus-within:border-secondary ${inlineError ? "border-error" : "border-outline-variant"}`}>
          <span className="select-none font-label-lg text-label-lg text-on-surface-variant">+20</span>
          <span className="h-5 w-px bg-outline-variant" />
          <Icon name="call" className="text-[20px] text-outline" />
          <input
            type="tel"
            inputMode="numeric"
            placeholder="01X XXXX XXXX"
            value={phone}
            onChange={(e) => { setPhone(e.target.value); setError(""); }}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
            maxLength={13}
            dir="ltr"
          />
        </span>
        {inlineError && !error && (
          <span className="flex items-center gap-1 font-label-md text-label-md text-error">
            <Icon name="error" className="text-[16px]" />{inlineError}
          </span>
        )}
      </label>

      {/* Role selector */}
      <div className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">نوع الحساب</span>
        <div className="grid grid-cols-3 gap-2">
          {loginRoles.map((r) => (
            <button
              key={r.value}
              type="button"
              onClick={() => setRole(r.value)}
              className={`flex flex-col items-center gap-1 rounded-button border px-2 py-2.5 font-label-md text-label-md transition ${
                role === r.value
                  ? "border-2 border-secondary bg-secondary-container text-on-secondary-container"
                  : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary"
              }`}
            >
              <Icon name={r.icon} className="text-[20px]" />
              {r.label}
            </button>
          ))}
        </div>
        <p className="font-label-md text-label-md text-on-surface-variant">العميل والمطعم والمندوب لهم حسابات منفصلة</p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
          <div>
            <p className="font-label-md text-label-md text-on-error-container">{error}</p>
            {error.includes("مش مسجل") && (
              <Link to="/auth/register" className="mt-1 inline-flex items-center gap-1 font-label-md text-label-md text-on-error-container underline">
                <Icon name="person_add" className="text-[16px]" />سجّل حساب جديد
              </Link>
            )}
          </div>
        </div>
      )}

      <Button className="w-full" icon="arrow_forward" onClick={handleSubmit} disabled={requestOtp.isPending}>
        {requestOtp.isPending ? "جاري الإرسال..." : "دخول"}
      </Button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-outline-variant" />
        <span className="font-label-md text-label-md text-on-surface-variant">أو</span>
        <span className="h-px flex-1 bg-outline-variant" />
      </div>

      <Link to="/auth/register">
        <Button variant="outline" className="w-full" icon="person_add">إنشاء حساب جديد</Button>
      </Link>

      <section className="flex flex-col gap-3 rounded-card border-2 border-dashed border-error/40 bg-error-container/40 p-md">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-label-lg text-label-lg text-on-error-container">تسجيل دخول الاختبار</p>
            <p className="font-label-md text-label-md text-on-surface-variant">
              حسابات قاعدة بيانات حقيقية — للاختبار عبر الويب
            </p>
          </div>
          <span className="rounded-full bg-error px-2 py-1 text-[10px] font-bold tracking-wide text-white">
            DEV MODE
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {loginRoles.map((testRole) => (
            <Button
              key={testRole.value}
              type="button"
              variant="outline"
              icon={testRole.icon}
              disabled={devRolePending !== null}
              onClick={() => handleDevLogin(testRole.value)}
            >
              {devRolePending === testRole.value ? "جاري الدخول..." : testRole.label}
            </Button>
          ))}
        </div>
      </section>

      <div className="flex items-center gap-2 rounded-card bg-surface-container-low p-md">
        <Icon name="sms" className="text-[18px] text-on-surface-variant" />
        <p className="font-label-md text-label-md text-on-surface-variant">هنبعتلك كود تأكيد برسالة SMS على رقمك المصري</p>
      </div>
    </AuthShell>
  );
}
