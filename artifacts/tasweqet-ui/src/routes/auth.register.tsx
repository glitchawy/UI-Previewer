import { useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useRegisterOtp } from "@workspace/api-client-react";

export const Route = createFileRoute("/auth/register")({
  head: () => ({
    meta: [
      { title: "إنشاء حساب | طلبات بيتك" },
      { name: "description", content: "أنشئ حسابك الجديد برقم موبايلك المصري." },
    ],
  }),
  component: AuthRegister,
});

type Role = "customer" | "partner" | "driver";

const registerRoles: { value: Role; label: string; icon: string; desc: string }[] = [
  { value: "customer", label: "عميل", icon: "shopping_bag", desc: "اطلب أكل من مطاعم قريبة منك" },
  { value: "partner", label: "مطعم / شريك", icon: "storefront", desc: "سجّل مطعمك واستقبل طلبات" },
  { value: "driver", label: "مندوب توصيل", icon: "two_wheeler", desc: "وصّل الطلبات واكسب أكتر" },
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

function AuthRegister() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");

  const cleaned = phone.replace(/[\s\-]/g, "");
  const inlineError = touched ? validateEgPhone(phone) : null;

  const registerOtp = useRegisterOtp({
    mutation: {
      onSuccess: () => {
        navigate({ to: "/auth/otp", search: { role, phone: cleaned, type: "register" } });
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? "حصل خطأ، حاول تاني");
      },
    },
  });

  function handleSubmit() {
    setTouched(true);
    setError("");
    const validationError = validateEgPhone(phone);
    if (validationError) { setError(validationError); return; }
    registerOtp.mutate({ data: { phone: cleaned, role } });
  }

  return (
    <AuthShell title="إنشاء حساب جديد" subtitle="أنشئ حسابك الجديد برقم موبايلك المصري">

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
                <span className={`font-label-lg text-label-lg ${role === r.value ? "text-on-secondary-container" : "text-on-surface"}`}>{r.label}</span>
                <span className="font-label-md text-label-md text-on-surface-variant">{r.desc}</span>
              </div>
              {role === r.value && (
                <Icon name="check_circle" className="mr-auto text-[20px] text-secondary" filled />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="mt-0.5 text-[18px] text-on-error-container" />
          <div>
            <p className="font-label-md text-label-md text-on-error-container">{error}</p>
            {error.includes("مسجل بالفعل") && (
              <Link
                to="/auth/login"
                className="mt-1 inline-flex items-center gap-1 font-label-md text-label-md text-on-error-container underline"
              >
                <Icon name="login" className="text-[16px]" />
                سجّل دخول بدلاً من ذلك
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Register button */}
      <Button className="w-full" icon="person_add" onClick={handleSubmit} disabled={registerOtp.isPending}>
        {registerOtp.isPending ? "جاري الإنشاء..." : "إنشاء الحساب"}
      </Button>

      {/* Login CTA */}
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-outline-variant" />
        <span className="font-label-md text-label-md text-on-surface-variant">عندك حساب؟</span>
        <span className="h-px flex-1 bg-outline-variant" />
      </div>

      <Link to="/auth/login">
        <Button variant="outline" className="w-full" icon="login">
          تسجيل الدخول
        </Button>
      </Link>

    </AuthShell>
  );
}
