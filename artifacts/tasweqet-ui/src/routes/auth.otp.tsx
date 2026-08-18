import { useState, useEffect, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { useVerifyOtp } from "@workspace/api-client-react";
import { saveSession } from "@/lib/auth-session";

type Role = "customer" | "partner" | "driver";

const roleLabels: Record<Role, string> = {
  customer: "حساب عميل",
  partner: "حساب مطعم",
  driver: "حساب مندوب",
};

const RESEND_SECONDS = 60;

export const Route = createFileRoute("/auth/otp")({
  validateSearch: (search: Record<string, unknown>): { role: Role; phone: string } => {
    const r = search["role"];
    const p = typeof search["phone"] === "string" ? search["phone"] : "";
    return {
      role: r === "partner" || r === "driver" ? r : "customer",
      phone: p,
    };
  },
  head: () => ({
    meta: [{ title: "تأكيد الكود | طلبات بيتك" }],
  }),
  component: AuthOtp,
});

function AuthOtp() {
  const { role, phone } = Route.useSearch();
  const navigate = useNavigate();
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState("");
  const [seconds, setSeconds] = useState(RESEND_SECONDS);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer
  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const verifyOtp = useVerifyOtp({
    mutation: {
      onSuccess: (data) => {
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
        if (role === "customer") {
          navigate({ to: "/auth/location" });
        } else if (role === "partner") {
          navigate({ to: "/partner" });
        } else {
          navigate({ to: "/driver" });
        }
      },
      onError: () => {
        setError("الكود غير صحيح، حاول تاني");
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
    if (ch && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
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
    if (code.length < 6) {
      setError("أدخل الكود كامل (6 أرقام)");
      return;
    }
    verifyOtp.mutate({ data: { phone, otp: code, role } });
  }

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <AuthShell
      title="تأكيد الكود"
      subtitle={`الكود اتبعت برسالة SMS لـ +20${phone}`}
      back="/auth/login"
    >
      <div className="flex items-center gap-2 rounded-card bg-secondary-container p-md">
        <Icon name="badge" className="text-[18px] text-on-secondary-container" />
        <p className="font-label-md text-label-md text-on-secondary-container">
          بتأكد {roleLabels[role]} — بعد التأكيد هتدخل لوحة الحساب بتاعتك
        </p>
      </div>

      {/* OTP inputs */}
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
              error
                ? "border-error focus:border-error"
                : "border-outline-variant focus:border-secondary"
            }`}
          />
        ))}
      </div>

      {/* Resend row */}
      <div className="flex items-center justify-between">
        <span className="font-label-md text-label-md text-on-surface-variant">
          إعادة الإرسال بعد {mm}:{ss}
        </span>
        <button
          disabled={seconds > 0}
          onClick={() => setSeconds(RESEND_SECONDS)}
          className="rounded-button px-3 py-1.5 font-label-lg text-label-lg text-secondary disabled:text-outline"
        >
          إعادة الإرسال
        </button>
      </div>

      {/* Timer info */}
      <div className="flex items-center justify-between rounded-card bg-surface-container-low p-md">
        <span className="flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
          <Icon name="lock_clock" className="text-[18px]" />
          الكود صالح 5 دقايق
        </span>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 rounded-card bg-error-container p-md">
          <Icon name="error" className="text-[18px] text-on-error-container" />
          <p className="font-label-md text-label-md text-on-error-container">{error}</p>
        </div>
      )}

      <Button
        className="w-full"
        icon="check_circle"
        onClick={handleConfirm}
        disabled={verifyOtp.isPending}
      >
        {verifyOtp.isPending ? "جاري التأكيد..." : "تأكيد"}
      </Button>

      <button
        onClick={() => navigate({ to: "/auth/login" })}
        className="text-center font-body-md text-body-md text-secondary hover:underline"
      >
        تغيير الرقم
      </button>
    </AuthShell>
  );
}
