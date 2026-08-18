import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/sign-up-screen")({
  head: () => ({
    meta: [
      { title: "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenSignUpScreen,
});

function ScreenSignUpScreen() {
  return (
    <ScreenFrame slug="sign-up-screen" title="\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f - Tasweeqet Betak" bodyClassName="bg-surface text-on-surface font-body-md min-h-screen flex items-center justify-center p-margin-mobile md:p-margin-desktop">
      
<main className={"w-full max-w-md"}>
<div className={"mb-xl text-center"}>
<h1 className={"font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-primary mb-sm"}>Tasweeqet Betak</h1>
<h2 className={"font-headline-md text-headline-md text-secondary"}>إنشاء حساب جديد</h2>
</div>
<form className={"bg-surface-container-lowest p-lg rounded-xl border border-outline-variant shadow-sm space-y-md"}>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-xs"} htmlFor={"fullName"}>الاسم بالكامل</label>
<div className={"relative"}>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-[50px] px-lg py-sm text-on-surface placeholder:text-tertiary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"} id={"fullName"} placeholder={"\u0627\u0644\u0627\u0633\u0645 \u0628\u0627\u0644\u0643\u0627\u0645\u0644"} type={"text"} />
<span className={"material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary"} data-icon={"person"}>person</span>
</div>
</div>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-xs"} htmlFor={"mobile"}>رقم الموبايل</label>
<div className={"relative"}>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-[50px] px-lg py-sm text-on-surface placeholder:text-tertiary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"} dir={"ltr"} id={"mobile"} placeholder={"\u0631\u0642\u0645 \u0627\u0644\u0645\u0648\u0628\u0627\u064a\u0644"} type={"tel"} />
<span className={"material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary"} data-icon={"phone_iphone"}>phone_iphone</span>
</div>
</div>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-xs"} htmlFor={"email"}>البريد الإلكتروني</label>
<div className={"relative"}>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-[50px] px-lg py-sm text-on-surface placeholder:text-tertiary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"} dir={"ltr"} id={"email"} placeholder={"\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a"} type={"email"} />
<span className={"material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary"} data-icon={"mail"}>mail</span>
</div>
</div>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-xs"} htmlFor={"password"}>كلمة المرور</label>
<div className={"relative"}>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-[50px] px-lg py-sm text-on-surface placeholder:text-tertiary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors"} dir={"ltr"} id={"password"} placeholder={"\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631"} type={"password"} />
<span className={"material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-tertiary cursor-pointer hover:text-secondary transition-colors"} data-icon={"visibility"}>visibility</span>
</div>
</div>
<div className={"flex items-start gap-xs pt-xs"}>
<input className={"mt-1 rounded border-outline-variant text-primary-container focus:ring-primary-container cursor-pointer w-4 h-4"} id={"terms"} type={"checkbox"} />
<label className={"font-label-md text-label-md text-on-surface-variant cursor-pointer leading-tight"} htmlFor={"terms"}>
          بالتسجيل، أنت توافق على <a className={"text-secondary font-bold hover:underline"} href={"#"}>الشروط والأحكام</a> و <a className={"text-secondary font-bold hover:underline"} href={"#"}>سياسة الخصوصية</a>.
        </label>
</div>
<button className={"w-full bg-primary-container text-on-primary-container font-label-lg text-label-lg font-bold py-sm rounded-xl mt-lg hover:brightness-95 transition-all"} type={"button"}>
        إنشاء حساب
      </button>
</form>
<div className={"mt-lg text-center"}>
<p className={"font-body-md text-body-md text-on-surface-variant"}>
        لديك حساب بالفعل؟ <a className={"text-secondary font-bold hover:underline"} href={"#"}>تسجيل الدخول</a>
</p>
</div>
</main>

    </ScreenFrame>
  );
}
