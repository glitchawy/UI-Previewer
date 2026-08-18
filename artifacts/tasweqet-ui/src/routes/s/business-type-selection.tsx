import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/business-type-selection")({
  head: () => ({
    meta: [
      { title: "\u0625\u064a\u0647 \u0646\u0648\u0639 \u0646\u0634\u0627\u0637\u0643\u061f | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0625\u064a\u0647 \u0646\u0648\u0639 \u0646\u0634\u0627\u0637\u0643\u061f \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0625\u064a\u0647 \u0646\u0648\u0639 \u0646\u0634\u0627\u0637\u0643\u061f | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0625\u064a\u0647 \u0646\u0648\u0639 \u0646\u0634\u0627\u0637\u0643\u061f \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenBusinessTypeSelection,
});

function ScreenBusinessTypeSelection() {
  return (
    <ScreenFrame slug="business-type-selection" title="\u0625\u064a\u0647 \u0646\u0648\u0639 \u0646\u0634\u0627\u0637\u0643\u061f" bodyClassName="bg-background text-on-background antialiased min-h-screen flex flex-col items-center justify-center p-margin-mobile md:p-margin-desktop">
      

<main className={"w-full max-w-[600px] flex flex-col gap-lg"}>

<header className={"text-center mb-xl"}>
<h1 className={"font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-primary mb-sm"}>إيه نوع نشاطك؟</h1>
<p className={"font-body-md text-body-md text-on-surface-variant"}>اختر نوع النشاط الأقرب لطبيعة عملك لتخصيص تجربتك.</p>
</header>

<div className={"grid grid-cols-2 gap-gutter md:gap-lg"}>

<button aria-pressed={"true"} className={"card-base card-active relative flex flex-col items-center p-lg bg-surface-container-lowest border border-outline-variant rounded-[16px] text-center w-full group focus:outline-none"}>

<div className={"absolute top-sm left-sm w-6 h-6 bg-primary-container rounded-full flex items-center justify-center opacity-100 transition-opacity"}>
<span className={"material-symbols-outlined text-[14px] text-on-primary-container font-bold"}>check</span>
</div>
<div className={"icon-container w-16 h-16 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center mb-md transition-colors"}>
<span className={"material-symbols-outlined text-[32px]"}>restaurant</span>
</div>
<h2 className={"font-headline-md text-headline-md text-primary mb-xs"}>مطعم</h2>
<p className={"font-label-md text-label-md text-on-surface-variant"}>وجبات، مشويات، أسماك وغيرها</p>
</button>

<button aria-pressed={"false"} className={"card-base relative flex flex-col items-center p-lg bg-surface-container-lowest border border-outline-variant rounded-[16px] text-center w-full group focus:outline-none"}>
<div className={"absolute top-sm left-sm w-6 h-6 bg-primary-container rounded-full flex items-center justify-center opacity-0 transition-opacity"}>
<span className={"material-symbols-outlined text-[14px] text-on-primary-container font-bold"}>check</span>
</div>
<div className={"icon-container w-16 h-16 rounded-full bg-surface-container text-primary flex items-center justify-center mb-md transition-colors"}>
<span className={"material-symbols-outlined text-[32px]"}>local_cafe</span>
</div>
<h2 className={"font-headline-md text-headline-md text-primary mb-xs"}>كافيه</h2>
<p className={"font-label-md text-label-md text-on-surface-variant"}>مشروبات ساخنة، عصائر، وحلويات</p>
</button>

<button aria-pressed={"false"} className={"card-base relative flex flex-col items-center p-lg bg-surface-container-lowest border border-outline-variant rounded-[16px] text-center w-full group focus:outline-none"}>
<div className={"absolute top-sm left-sm w-6 h-6 bg-primary-container rounded-full flex items-center justify-center opacity-0 transition-opacity"}>
<span className={"material-symbols-outlined text-[14px] text-on-primary-container font-bold"}>check</span>
</div>
<div className={"icon-container w-16 h-16 rounded-full bg-surface-container text-primary flex items-center justify-center mb-md transition-colors"}>
<span className={"material-symbols-outlined text-[32px]"}>local_pharmacy</span>
</div>
<h2 className={"font-headline-md text-headline-md text-primary mb-xs"}>صيدلية</h2>
<p className={"font-label-md text-label-md text-on-surface-variant"}>أدوية، مستحضرات تجميل، وعناية</p>
</button>

<button aria-pressed={"false"} className={"card-base relative flex flex-col items-center p-lg bg-surface-container-lowest border border-outline-variant rounded-[16px] text-center w-full group focus:outline-none"}>
<div className={"absolute top-sm left-sm w-6 h-6 bg-primary-container rounded-full flex items-center justify-center opacity-0 transition-opacity"}>
<span className={"material-symbols-outlined text-[14px] text-on-primary-container font-bold"}>check</span>
</div>
<div className={"icon-container w-16 h-16 rounded-full bg-surface-container text-primary flex items-center justify-center mb-md transition-colors"}>
<span className={"material-symbols-outlined text-[32px]"}>storefront</span>
</div>
<h2 className={"font-headline-md text-headline-md text-primary mb-xs"}>سوبر ماركت</h2>
<p className={"font-label-md text-label-md text-on-surface-variant"}>بقالة، مواد غذائية، ومستلزمات منزلية</p>
</button>
</div>

<div className={"mt-xl flex justify-between items-center"}>
<button className={"px-lg py-md rounded-[12px] text-secondary font-label-lg text-label-lg bg-transparent hover:bg-surface-container-high transition-colors"}>رجوع</button>
<button className={"px-xl py-md rounded-[12px] bg-primary-container text-[#5E3C1A] font-headline-md text-headline-md shadow-sm hover:opacity-90 transition-opacity"}>التالي</button>
</div>
</main>


    </ScreenFrame>
  );
}
