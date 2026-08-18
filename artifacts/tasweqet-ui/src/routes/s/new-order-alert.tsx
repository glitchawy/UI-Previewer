import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/new-order-alert")({
  head: () => ({
    meta: [
      { title: "Merchant New Order Alert | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Merchant New Order Alert \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Merchant New Order Alert | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Merchant New Order Alert \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenNewOrderAlert,
});

function ScreenNewOrderAlert() {
  return (
    <ScreenFrame slug="new-order-alert" title="Merchant New Order Alert" bodyClassName="bg-pattern min-h-screen w-full flex items-center justify-center p-margin-mobile overflow-hidden relative">
      

<div className={"absolute inset-0 bg-primary-container/20 backdrop-blur-[2px] z-0"}></div>

<main className={"w-full max-w-[420px] bg-surface-container-lowest rounded-3xl shadow-[0_16px_40px_-10px_rgba(94,60,26,0.15)] flex flex-col relative z-10 overflow-hidden animate-modal-enter border border-outline-variant/30"}>

<header className={"p-lg flex justify-between items-start border-b border-surface-container-highest bg-surface/50"}>
<div className={"flex flex-col gap-1"}>
<div className={"flex items-center gap-2"}>
<div className={"relative w-3 h-3 rounded-full bg-error animate-pulse-ring shrink-0 flex items-center justify-center"}></div>
<h1 className={"font-headline-xl-mobile text-headline-xl-mobile text-on-surface"}>طلب جديد</h1>
</div>
<p className={"font-label-lg text-label-lg text-on-surface-variant flex items-center gap-1 mt-1"}>
<span className={"material-symbols-outlined text-[18px]"}>receipt_long</span>
                    طلب #8932
                </p>
</div>

<div className={"bg-error-container text-on-error-container px-3 py-1 rounded-full font-label-lg text-label-lg flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[16px]"}>timer</span>
                الآن
            </div>
</header>

<div className={"p-lg flex flex-col gap-6"}>

<div className={"flex items-center gap-3"}>
<div className={"w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"}>
<span className={"material-symbols-outlined"} data-weight={"fill"} style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
</div>
<div className={"flex flex-col"}>
<span className={"font-label-md text-label-md text-on-surface-variant"}>العميل</span>
<span className={"font-headline-md-mobile text-headline-md-mobile text-on-surface"}>سارة ك.</span>
</div>
</div>
<div className={"w-full h-px bg-surface-container-highest"}></div>

<div className={"flex flex-col gap-4"}>
<h2 className={"font-label-md text-label-md text-on-surface-variant"}>العناصر المطلوبة</h2>
<ul className={"flex flex-col gap-3"}>
<li className={"flex items-start justify-between font-body-lg text-body-lg text-on-surface"}>
<div className={"flex items-start gap-2"}>
<span className={"font-headline-md-mobile text-headline-md-mobile text-primary-container bg-inverse-surface rounded-md px-1.5 py-0.5 min-w-[28px] text-center"}>2x</span>
<span>برجر كلاسيك</span>
</div>
</li>
<li className={"flex items-start justify-between font-body-lg text-body-lg text-on-surface"}>
<div className={"flex items-start gap-2"}>
<span className={"font-headline-md-mobile text-headline-md-mobile text-primary-container bg-inverse-surface rounded-md px-1.5 py-0.5 min-w-[28px] text-center"}>1x</span>
<span>بطاطس كبير</span>
</div>
</li>
</ul>
</div>

<div className={"flex justify-between items-center bg-surface-container-low p-4 rounded-xl border border-outline-variant/30"}>
<span className={"font-headline-md-mobile text-headline-md-mobile text-on-surface-variant"}>الإجمالي</span>
<span className={"font-headline-lg text-headline-lg text-on-surface"}>85 ر.س</span>
</div>
</div>

<div className={"px-lg pb-4 flex flex-col gap-3"}>
<span className={"font-label-md text-label-md text-on-surface-variant"}>وقت التحضير المتوقع</span>
<div className={"grid grid-cols-4 gap-2"}>

<button className={"py-2.5 rounded-lg border border-outline-variant font-label-lg text-label-lg text-on-surface-variant bg-surface-container-lowest hover:bg-surface-variant transition-colors flex flex-col items-center justify-center"}>
                    15 <span className={"text-[10px] font-normal"}>دقيقة</span>
</button>

<button className={"py-2.5 rounded-lg border-2 border-on-surface font-label-lg text-label-lg text-surface-container-lowest bg-on-surface flex flex-col items-center justify-center shadow-md transform scale-[1.02] transition-transform"}>
                    20 <span className={"text-[10px] font-normal text-outline-variant"}>دقيقة</span>
</button>

<button className={"py-2.5 rounded-lg border border-outline-variant font-label-lg text-label-lg text-on-surface-variant bg-surface-container-lowest hover:bg-surface-variant transition-colors flex flex-col items-center justify-center"}>
                    30 <span className={"text-[10px] font-normal"}>دقيقة</span>
</button>

<button className={"py-2.5 rounded-lg border border-outline-variant font-label-lg text-label-lg text-on-surface-variant bg-surface-container-lowest hover:bg-surface-variant transition-colors flex flex-col items-center justify-center"}>
                    45 <span className={"text-[10px] font-normal"}>دقيقة</span>
</button>
</div>
</div>

<footer className={"p-lg pt-4 flex flex-col gap-3 bg-surface-container-lowest"}>

<button className={"w-full h-[60px] bg-primary-container text-on-primary-container rounded-xl font-headline-md-mobile text-headline-md-mobile flex items-center justify-center gap-2 hover:bg-[#FFE14D] active:scale-[0.98] transition-all shadow-sm"}>
<span className={"material-symbols-outlined"} data-weight={"fill"} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                قبول الطلب
            </button>

<button className={"w-full py-3 text-on-surface-variant rounded-xl font-label-lg text-label-lg flex items-center justify-center gap-2 hover:bg-error-container/30 hover:text-error active:bg-error-container/50 transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"}>close</span>
                رفض
            </button>
</footer>
</main>


    </ScreenFrame>
  );
}
