import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, Button, Field, Icon } from "@/components/tb/shell";
import { useRequestOtp } from "@workspace/api-client-react";

export const Route = createFileRoute("/auth/login")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول | طلبات بيتك" },
      { name: "description", content: "سجّل دخولك برقم موبايلك واستلم كود التأكيد." },
    ],
  }),
  component: AuthLogin,
});

type Role = "customer" | "partner" | "driver";

const loginRoles: { value: Role; label: string; icon: string }[] = [
  { value: "customer", label: "عميل", icon: "shopping_bag" },
  { value: "partner", label: "مطعم", icon: "storefront" },
  { value: "driver", label: "مندوب", icon: "two_wheeler" },
];

function AuthLogin() {
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("customer");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const requestOtp = useRequestOtp({
    mutation: {
      onSuccess: () => {
        navigate({ to: "/auth/otp", search: { role, phone } });
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
        setError(msg ?? "حصل خطأ، حاول تاني");
      },
    },
  });

  function handleSubmit() {
    setError("");
    const cleaned = phone.replace(/\s/g, "");
    if (!cleaned || cleaned.length < 10) {
      setError("أدخل رقم موبايل صحيح");
      return;
    }
    requestOtp.mutate({ data: { phone: cleaned, role } });
  }

  return (
    <AuthShell title="تسجيل الدخول" subtitle="ادخل برقم موبايلك عشان نبعتلك كود التأكيد" back="/auth/welcome">

      <label className="flex flex-col gap-1.5">
        <span className="font-label-lg text-label-lg text-on-surface-variant">رقم الموبايل</span>
        <span className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 focus-within:border-secondary">
          <span className="font-label-lg text-label-lg text-on-surface-variant">+20</span>
          <span className="h-5 w-px bg-outline-variant" />
          <Icon name="call" className="text-[20px] text-outline" />
          <input
            type="tel"
            placeholder="100 123 4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
          />
        </span>
      </label>

      <div className="flex items-start gap-2 rounded-card bg-secondary-container p-md">
        <Icon name="info" className="mt-0.5 text-[18px] text-on-secondary-container" />
        <p className="font-label-md text-label-md text-on-secondary-container">
          العميل والمطعم لهم حسابات منفصلة. تأكد إنك بتسجل بالحساب الصح.
        </p>
      </div>

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
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">{error}</p>
        </div>
      )}

      <Button
        className="w-full"
        icon="arrow_back"
        onClick={handleSubmit}
        disabled={requestOtp.isPending}
      >
        {requestOtp.isPending ? "جاري الإرسال..." : "متابعة"}
      </Button>

      <div className="flex items-center gap-2 rounded-card bg-success/10 p-md">
        <Icon name="sms" className="text-[18px] text-success" />
        <p className="font-label-md text-label-md text-success">هنبعتلك كود التأكيد برسالة SMS</p>
      </div>

      <p className="text-center font-body-md text-body-md text-on-surface-variant">
        مفيش حساب؟{" "}
        <a href="/auth/register" className="text-secondary hover:underline">
          إنشاء حساب جديد
        </a>
      </p>
    </AuthShell>
  );
}
