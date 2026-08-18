import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/checkout")({
  head: () => ({
    meta: [
      { title: "Checkout - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Checkout - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Checkout - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Checkout - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenCheckout,
});

function ScreenCheckout() {
  return (
    <ScreenFrame slug="checkout" title="Checkout - Tasweeqet Betak" bodyClassName="bg-surface text-on-surface antialiased font-body-md pb-24 md:pb-0">
      

<header className={"bg-surface dark:bg-surface-dim docked full-width top-0 sticky z-50 border-b border-outline-variant dark:border-outline flat no shadows flex flex-row-reverse justify-between items-center px-margin-mobile w-full backdrop-blur-md py-4"}>
<button className={"text-primary dark:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors opacity-80 duration-150 p-2 rounded-full"}>
<span className={"material-symbols-outlined"}>arrow_forward</span>
</button>
<h1 className={"font-headline-md text-headline-md font-bold text-secondary dark:text-secondary-fixed-dim"}>
            إتمام الطلب
        </h1>
<div className={"w-10"}></div> 
</header>
<main className={"max-w-3xl mx-auto px-margin-mobile md:px-margin-desktop py-lg space-y-lg"}>

<section className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md"}>
<div className={"flex items-center justify-between mb-sm"}>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>عنوان التوصيل</h2>
<button className={"text-tertiary font-label-lg text-label-lg hover:underline"}>تغيير</button>
</div>
<div className={"flex items-start gap-md"}>
<div className={"bg-surface-container-low p-2 rounded-lg text-secondary"}>
<span className={"material-symbols-outlined icon-filled"}>home</span>
</div>
<div>
<p className={"font-body-md text-on-surface font-semibold"}>المنزل</p>
<p className={"font-label-md text-label-md text-on-surface-variant mt-xs"}>شارع الملك فهد, حي العليا, الرياض</p>
</div>
</div>
</section>

<section className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md"}>
<h2 className={"font-headline-md text-headline-md text-on-surface mb-sm"}>تعليمات التوصيل (اختياري)</h2>
<textarea className={"w-full bg-surface-container-lowest border border-outline-variant rounded-xl p-sm font-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-none h-24 placeholder:text-on-surface-variant/50"} placeholder={"\u0645\u062b\u0627\u0644: \u0627\u062a\u0631\u0643 \u0627\u0644\u0637\u0644\u0628 \u0639\u0646\u062f \u0627\u0644\u0628\u0627\u0628..."}></textarea>
</section>

<section className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md"}>
<h2 className={"font-headline-md text-headline-md text-on-surface mb-sm"}>طريقة الدفع</h2>
<div className={"space-y-sm"}>

<label className={"flex items-center justify-between p-sm border border-primary-container bg-surface-container-low rounded-lg cursor-pointer"}>
<div className={"flex items-center gap-sm"}>
<span className={"material-symbols-outlined text-secondary"}>credit_card</span>
<span className={"font-body-md text-on-surface"}>البطاقة الائتمانية / مدى</span>
</div>
<input defaultChecked={true} className={"text-primary-container focus:ring-primary-container"} name={"payment"} type={"radio"} />
</label>

<label className={"flex items-center justify-between p-sm border border-outline-variant hover:bg-surface-container-low rounded-lg cursor-pointer transition-colors"}>
<div className={"flex items-center gap-sm"}>
<span className={"material-symbols-outlined text-secondary"}>account_balance_wallet</span>
<span className={"font-body-md text-on-surface"}>المحفظة الإلكترونية (Apple Pay)</span>
</div>
<input className={"text-primary-container focus:ring-primary-container"} name={"payment"} type={"radio"} />
</label>

<label className={"flex items-center justify-between p-sm border border-outline-variant hover:bg-surface-container-low rounded-lg cursor-pointer transition-colors"}>
<div className={"flex items-center gap-sm"}>
<span className={"material-symbols-outlined text-secondary"}>payments</span>
<span className={"font-body-md text-on-surface"}>الدفع عند الاستلام</span>
</div>
<input className={"text-primary-container focus:ring-primary-container"} name={"payment"} type={"radio"} />
</label>
</div>
</section>

<section className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-end gap-sm"}>
<div className={"flex-grow"}>
<label className={"block font-label-lg text-label-lg text-on-surface mb-xs"}>كود الخصم</label>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-full px-4 py-2 font-body-md text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container"} placeholder={"\u0623\u062f\u062e\u0644 \u0627\u0644\u0643\u0648\u062f \u0647\u0646\u0627"} type={"text"} />
</div>
<button className={"bg-surface-container-highest text-on-surface-variant font-label-lg text-label-lg px-6 py-2.5 rounded-full hover:bg-outline-variant transition-colors"}>
                تطبيق
            </button>
</section>

<section className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md"}>
<h2 className={"font-headline-md text-headline-md text-on-surface mb-md"}>ملخص الطلب</h2>
<div className={"space-y-sm font-body-md text-on-surface-variant"}>
<div className={"flex justify-between"}>
<span>المجموع الفرعي</span>
<span className={"font-semibold text-on-surface"}>١٥٠ ر.س</span>
</div>
<div className={"flex justify-between"}>
<span>رسوم التوصيل</span>
<span className={"font-semibold text-on-surface"}>١٥ ر.س</span>
</div>
<div className={"flex justify-between text-secondary"}>
<span>الخصم</span>
<span className={"font-semibold"}>-٠ ر.س</span>
</div>
<div className={"border-t border-outline-variant pt-sm mt-sm flex justify-between font-headline-md text-headline-md text-on-surface"}>
<span>الإجمالي</span>
<span className={"text-secondary font-bold"}>١٦٥ ر.س</span>
</div>
</div>
</section>
</main>

<div className={"fixed bottom-0 left-0 right-0 bg-surface border-t border-outline-variant p-margin-mobile shadow-[0_-4px_8px_rgba(94,60,26,0.04)] z-40 md:relative md:border-none md:shadow-none md:bg-transparent md:max-w-3xl md:mx-auto md:px-margin-desktop md:pt-0"}>
<button className={"w-full bg-primary-container text-on-tertiary-fixed font-headline-md text-headline-md font-bold py-3 rounded-xl hover:bg-primary-fixed transition-colors flex justify-center items-center gap-2"}>
<span>تأكيد الطلب</span>
<span className={"material-symbols-outlined"}>check_circle</span>
</button>
</div>

    </ScreenFrame>
  );
}
