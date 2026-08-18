import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/login-screen")({
  head: () => ({
    meta: [
      { title: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenLoginScreen,
});

function ScreenLoginScreen() {
  return (
    <ScreenFrame slug="login-screen" title="\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 - Tasweeqet Betak" bodyClassName="bg-surface text-on-surface antialiased min-h-screen flex flex-col justify-center items-center p-margin-mobile md:p-margin-desktop relative overflow-hidden">
      

<div className={"absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary-container rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"}></div>
<div className={"absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-secondary-container rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none"}></div>
<main className={"w-full max-w-md z-10"}>

<div className={"text-center mb-xl"}>
<h1 className={"font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-[#5E3C1A] mb-sm"}>تسجيل الدخول</h1>
<p className={"font-body-md text-body-md text-on-surface-variant"}>أهلاً بك مرة أخرى! سجل دخولك لمتابعة طلباتك.</p>
</div>

<div className={"bg-surface-container-lowest rounded-card border border-outline-variant p-lg shadow-[0_4px_8px_rgba(94,60,26,0.04)]"}>
<form className={"space-y-md"}>

<div className={"relative"}>
<label className={"sr-only"} htmlFor={"mobile"}>رقم الموبايل</label>
<div className={"absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"}>
<span className={"material-symbols-outlined text-tertiary"}>phone_iphone</span>
</div>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-input py-3 pr-12 pl-4 font-body-md text-body-md text-on-surface placeholder:text-[#8A6742] focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"} id={"mobile"} name={"mobile"} placeholder={"\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064a\u0644"} required={true} type={"tel"} />
</div>

<div className={"relative"}>
<label className={"sr-only"} htmlFor={"password"}>كلمة المرور</label>
<div className={"absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none"}>
<span className={"material-symbols-outlined text-tertiary"}>lock</span>
</div>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-input py-3 pr-12 pl-12 font-body-md text-body-md text-on-surface placeholder:text-[#8A6742] focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"} id={"password"} name={"password"} placeholder={"\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631"} required={true} type={"password"} />
<button className={"absolute inset-y-0 left-0 flex items-center pl-4 text-tertiary hover:text-[#5E3C1A] transition-colors focus:outline-none"} type={"button"}>
<span className={"material-symbols-outlined"}>visibility</span>
</button>
</div>

<div className={"flex justify-start"}>
<a className={"font-label-md text-label-md text-secondary hover:text-[#5E3C1A] transition-colors"} href={"#"}>نسيت كلمة المرور؟</a>
</div>

<button className={"w-full bg-primary-container text-[#5E3C1A] font-label-lg text-label-lg py-3 rounded-button btn-hover-effect flex justify-center items-center gap-2 mt-4"} type={"submit"}>
<span>تسجيل الدخول</span>
<span className={"material-symbols-outlined icon-fill"}>arrow_back</span>
</button>
</form>

<div className={"relative my-lg"}>
<div className={"absolute inset-0 flex items-center"}>
<div className={"w-full border-t border-outline-variant"}></div>
</div>
<div className={"relative flex justify-center text-sm"}>
<span className={"px-2 bg-surface-container-lowest text-on-surface-variant font-label-md text-label-md"}>أو</span>
</div>
</div>

<div className={"space-y-md"}>
<button className={"w-full bg-surface-container-lowest border-2 border-[#5E3C1A] text-[#5E3C1A] font-label-lg text-label-lg py-3 rounded-button btn-hover-effect flex justify-center items-center gap-3"} type={"button"}>
<img alt={"Google Logo"} className={"w-5 h-5"} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCJM-BJfqNUMVJSIyGOJ7F6GQ881pqOYaOKNHg7HJgwsrnyI_ps8RSI0SSy3DU2eUND8QNHHbQFF42Jd1LZwnV2ENxH8k600okzZODkBstyIkoI2ORl6aQjNnq-P5dqdVIqo2BkSbJd9UQAeAry9Q8fMyrBfW8k9iXBHEwO6mzgAr1PnXshUd_U04ze3xV715UlJ9EfYCHzBG4CSc5DrTgDWlRcDypRK6esgO1lyyt70SFAQPMt6jxy"} />
<span>المتابعة باستخدام Google</span>
</button>
<button className={"w-full bg-surface-container-lowest border-2 border-[#5E3C1A] text-[#5E3C1A] font-label-lg text-label-lg py-3 rounded-button btn-hover-effect flex justify-center items-center gap-3"} type={"button"}>
<img alt={"Apple Logo"} className={"w-5 h-5"} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAKcfeaky7xp53-IHvXnxWH7B5CDpNJAA5dlY8bDEABpahNTErzTdpLZPqYySiehUfCHXvSmGwCay-fRRtiG-cvSUn9jBxw_DKjSPseEnco3xdup-eBH88LA3OMe2EVbtKSq_-ZvIBsyUT1kmm8MSF1-rbxYg24UdHj1SdPRiJTgbVEook0OGaYHVsitdLZtc5x12Kb15KwvnAd7ggRKFtPkDRNIf7fdgDB2WL7-4A1GOiA1qZCGjP5"} />
<span>المتابعة باستخدام Apple</span>
</button>
</div>
</div>

<div className={"mt-lg text-center"}>
<p className={"font-body-md text-body-md text-on-surface-variant"}>
                ليس لديك حساب؟ 
                <a className={"text-[#5E3C1A] font-bold hover:underline underline-offset-4 decoration-primary-container decoration-2"} href={"#"}>إنشاء حساب جديد</a>
</p>
</div>
</main>


    </ScreenFrame>
  );
}
