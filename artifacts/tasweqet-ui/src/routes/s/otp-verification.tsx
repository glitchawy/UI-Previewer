import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/otp-verification")({
  head: () => ({
    meta: [
      { title: "OTP Verification - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 OTP Verification - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "OTP Verification - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 OTP Verification - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenOtpVerification,
});

function ScreenOtpVerification() {
  return (
    <ScreenFrame slug="otp-verification" title="OTP Verification - Tasweeqet Betak" bodyClassName="min-h-screen flex flex-col font-body-md">
      

<main className={"flex-1 flex items-center justify-center p-margin-mobile md:p-margin-desktop relative overflow-hidden"}>

<div className={"absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary-container opacity-10 blur-3xl -z-10 pointer-events-none"}></div>
<div className={"absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-tertiary-container opacity-10 blur-3xl -z-10 pointer-events-none"}></div>
<div className={"w-full max-w-md bg-surface-container-lowest rounded-xl border border-outline-variant p-lg md:p-xl shadow-[0_4px_8px_rgba(94,60,26,0.04)] relative z-10"}>

<div className={"text-center mb-xl"}>
<div className={"w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-md"}>
<span className={"material-symbols-outlined text-[32px] text-on-primary-container"} data-icon={"lock_open"}>lock_open</span>
</div>
<h1 className={"font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-sm"}>تفعيل الحساب</h1>
<p className={"font-body-md text-body-md text-on-surface-variant"}>أدخل الكود المرسل إلى رقم موبايلك <span className={"font-bold text-on-surface"} dir={"ltr"}>****012</span></p>
</div>

<form className={"flex flex-col gap-lg"}>

<div className={"flex justify-between gap-sm rtl:flex-row-reverse"} dir={"ltr"}>
<input autoComplete={"off"} autoFocus={true} className={"otp-input w-12 h-14 text-center font-headline-md text-headline-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg transition-all duration-200"} maxLength={1} type={"text"} />
<input autoComplete={"off"} className={"otp-input w-12 h-14 text-center font-headline-md text-headline-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg transition-all duration-200"} maxLength={1} type={"text"} />
<input autoComplete={"off"} className={"otp-input w-12 h-14 text-center font-headline-md text-headline-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg transition-all duration-200"} maxLength={1} type={"text"} />
<input autoComplete={"off"} className={"otp-input w-12 h-14 text-center font-headline-md text-headline-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg transition-all duration-200"} maxLength={1} type={"text"} />
<input autoComplete={"off"} className={"otp-input w-12 h-14 text-center font-headline-md text-headline-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg transition-all duration-200"} maxLength={1} type={"text"} />
<input autoComplete={"off"} className={"otp-input w-12 h-14 text-center font-headline-md text-headline-md text-on-surface bg-surface-container-lowest border border-outline-variant rounded-lg transition-all duration-200"} maxLength={1} type={"text"} />
</div>

<div className={"flex flex-col gap-md mt-sm"}>
<button className={"w-full bg-primary-container text-on-primary-container font-headline-md text-headline-md py-md rounded-xl hover:brightness-95 transition-all duration-200 active:scale-[0.98]"} type={"button"}>
            تأكيد
          </button>
<div className={"flex flex-col items-center justify-center gap-xs mt-sm"}>
<p className={"font-label-md text-label-md text-on-surface-variant"}>إعادة الإرسال خلال <span className={"font-bold text-primary"} dir={"ltr"}>00:55</span></p>
<button className={"font-label-lg text-label-lg text-secondary border-b border-transparent hover:border-secondary transition-colors duration-200"} disabled={true} type={"button"}>
              إعادة إرسال الكود
            </button>
</div>
</div>
</form>
</div>
</main>


    </ScreenFrame>
  );
}
