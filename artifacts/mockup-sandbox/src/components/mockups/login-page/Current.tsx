import { useState } from "react";
import "./_group.css";

type Role = "customer" | "partner" | "driver" | "admin";

const loginRoles: { value: Role; label: string; icon: string }[] = [
  { value: "customer", label: "عميل", icon: "shopping_bag" },
  { value: "partner", label: "مطعم", icon: "storefront" },
  { value: "driver", label: "مندوب", icon: "two_wheeler" },
  { value: "admin", label: "مشرف", icon: "admin_panel_settings" },
];

const EG_PHONE_RE = /^01[0125]\d{8}$/;

function Icon({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  return (
    <span aria-hidden className={`material-symbols-outlined ${className}`}>
      {name}
    </span>
  );
}

function DemoButton({
  children,
  variant = "primary",
  className = "",
  icon,
  ...rest
}: {
  children: React.ReactNode;
  variant?: "primary" | "outline";
  className?: string;
  icon?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles =
    variant === "primary"
      ? "bg-primary-container text-on-primary-container hover:brightness-105 shadow-[0_2px_8px_rgba(94,60,26,0.12)]"
      : "border-2 border-secondary text-secondary hover:bg-surface-container-low bg-surface-container-lowest";

  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-button px-4 py-2.5 font-label-lg text-label-lg transition-all active:scale-[0.98] ${styles} ${className}`}
    >
      {icon ? <Icon name={icon} className="text-[18px]" /> : null}
      {children}
    </button>
  );
}

function validateEgPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s-]/g, "");
  if (!cleaned) return "أدخل رقم الموبايل";
  if (!/^\d+$/.test(cleaned)) return "الرقم يجب أن يحتوي على أرقام فقط";
  if (cleaned.length !== 11) return "رقم الموبايل يجب أن يكون 11 رقماً";
  if (!cleaned.startsWith("01")) return "رقم الموبايل المصري يبدأ بـ 01";
  if (!EG_PHONE_RE.test(cleaned)) {
    return "الشبكة غير معروفة — يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015";
  }
  return null;
}

export function Current() {
  const [role, setRole] = useState<Role>("customer");
  const [phone, setPhone] = useState("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState("");

  const inlineError = touched ? validateEgPhone(phone) : null;

  function handleSubmit() {
    setTouched(true);
    setStatus("");
    const validationError = validateEgPhone(phone);
    if (validationError) return;
    setStatus(
      `تم إرسال كود تجريبي لحساب ${loginRoles.find((item) => item.value === role)?.label} على الرقم ${phone.replace(/[\s-]/g, "")}`,
    );
  }

  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-screen items-center justify-center bg-surface-variant/40 p-md"
    >
      <div className="tb-fade-up w-full max-w-[440px]">
        <div className="mb-md flex items-center justify-between">
          <button type="button" className="flex items-center gap-2 text-right">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="local_mall" />
            </span>
            <span className="font-headline-md text-headline-md text-on-surface">
              طلبات بيتك
            </span>
          </button>
          <span className="rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface-variant">
            وضع الاختبار
          </span>
        </div>

        <div className="rounded-card border border-outline-variant bg-surface-container-lowest p-lg shadow-[0_2px_10px_rgba(94,60,26,0.05)]">
          <h1 className="font-headline-lg text-headline-lg text-on-surface">
            تسجيل الدخول
          </h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">
            ادخل برقم موبايلك عشان نبعتلك كود التأكيد
          </p>

          <div className="mt-lg flex flex-col gap-md">
            <label className="flex flex-col gap-1.5">
              <span className="font-label-lg text-label-lg text-on-surface-variant">
                رقم الموبايل
              </span>
              <span
                className={`flex items-center gap-2 rounded-button border bg-surface-container-lowest px-3 py-2.5 transition focus-within:border-secondary ${
                  inlineError ? "border-error" : "border-outline-variant"
                }`}
              >
                <span className="select-none font-label-lg text-label-lg text-on-surface-variant">
                  +20
                </span>
                <span className="h-5 w-px bg-outline-variant" />
                <Icon name="call" className="text-[20px] text-outline" />
                <input
                  aria-label="رقم الموبايل"
                  type="tel"
                  inputMode="numeric"
                  placeholder="01X XXXX XXXX"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    setStatus("");
                  }}
                  onBlur={() => setTouched(true)}
                  onKeyDown={(event) => event.key === "Enter" && handleSubmit()}
                  className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
                  maxLength={13}
                  dir="ltr"
                />
              </span>
              {inlineError && (
                <span className="flex items-center gap-1 font-label-md text-label-md text-error">
                  <Icon name="error" className="text-[16px]" />
                  {inlineError}
                </span>
              )}
            </label>

            <div className="flex flex-col gap-1.5">
              <span className="font-label-lg text-label-lg text-on-surface-variant">
                نوع الحساب
              </span>
              <div className="grid grid-cols-3 gap-2">
                {loginRoles.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => {
                      setRole(item.value);
                      setStatus("");
                    }}
                    className={`flex flex-col items-center gap-1 rounded-button border px-2 py-2.5 font-label-md text-label-md transition ${
                      role === item.value
                        ? "border-2 border-secondary bg-secondary-container text-on-secondary-container"
                        : "border-outline-variant bg-surface-container-lowest text-on-surface-variant hover:border-secondary"
                    }`}
                  >
                    <Icon name={item.icon} className="text-[20px]" />
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="font-label-md text-label-md text-on-surface-variant">
                العميل والمطعم والمندوب لهم حسابات منفصلة
              </p>
            </div>

            {status && (
              <div className="flex items-start gap-2 rounded-card bg-secondary-container p-md text-on-secondary-container">
                <Icon name="check_circle" className="mt-0.5 text-[18px]" />
                <p className="font-label-md text-label-md">{status}</p>
              </div>
            )}

            <DemoButton className="w-full" icon="arrow_forward" onClick={handleSubmit}>
              دخول
            </DemoButton>

            <div className="flex items-center gap-3">
              <span className="h-px flex-1 bg-outline-variant" />
              <span className="font-label-md text-label-md text-on-surface-variant">
                أو
              </span>
              <span className="h-px flex-1 bg-outline-variant" />
            </div>

            <DemoButton
              variant="outline"
              className="w-full"
              icon="person_add"
              onClick={() => setStatus("زر إنشاء الحساب تجريبي في هذا الـ mockup")}
            >
              إنشاء حساب جديد
            </DemoButton>

            <div className="flex items-center gap-2 rounded-card bg-surface-container-low p-md">
              <Icon name="sms" className="text-[18px] text-on-surface-variant" />
              <p className="font-label-md text-label-md text-on-surface-variant">
                هنبعتلك كود تأكيد برسالة SMS على رقمك المصري
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}