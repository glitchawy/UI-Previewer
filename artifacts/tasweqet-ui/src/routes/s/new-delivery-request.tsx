import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/new-delivery-request")({
  head: () => ({
    meta: [
      { title: "New Delivery Request | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 New Delivery Request \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "New Delivery Request | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 New Delivery Request \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenNewDeliveryRequest,
});

function ScreenNewDeliveryRequest() {
  return (
    <ScreenFrame slug="new-delivery-request" title="New Delivery Request" bodyClassName="bg-background text-on-surface antialiased h-screen w-full relative overflow-hidden flex flex-col justify-end">
      

<div className={"absolute inset-0 z-0"}>
<img className={"w-full h-full object-cover opacity-60"} data-alt={"A top-down view of a modern city map interface, featuring light cream and subtle gold tones for roads and parks. The map displays a clear route line connecting a restaurant to a residential area. The overall lighting is bright and sunny, fitting a light-mode UI aesthetic. The mood is functional and energetic, with high-contrast legibility."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBfdZXILx0T2h0ZJnkggUhBPBtXy8zJEvGoBVTjqfhQyy38bC9D0yyEmkuxlnh7cEA1KtnnOcK41HxaX8IjTRyXVFUb2Lp0PrN8Z5nSn35tEAaq9HOD27rKyh_LWXX--H8k3-bEKlk2yH5tFJ_v4h4_tSncls-REYtnANF_GHsm_ZbL58JgDu9QvzBQijVfFMBZA1yIQzkhkUXQzmhYxgwoPXNaurwMPO5tvSqZgLPqitLIXqoElMep"} />

<div className={"absolute inset-0 bg-gradient-to-t from-surface-dim/90 via-surface/40 to-transparent"}></div>
</div>

<main className={"relative z-10 bg-surface w-full rounded-t-[32px] shadow-2xl pb-safe flex flex-col"}>

<div className={"w-full flex justify-center pt-sm pb-md"}>
<div className={"w-12 h-1.5 bg-outline-variant rounded-full"}></div>
</div>
<div className={"px-margin-mobile flex flex-col gap-lg pb-xl"}>

<div className={"flex items-center justify-between"}>
<div className={"flex items-center gap-md"}>
<div className={"w-16 h-16 bg-primary-container rounded-full flex items-center justify-center shadow-lg relative"}>
<span className={"material-symbols-outlined text-on-primary-container text-[32px] absolute z-10"} data-weight={"fill"} style={{ fontVariationSettings: "'FILL' 1" }}>local_mall</span>
<div className={"absolute inset-0 rounded-full animate-ping bg-primary-container opacity-20"}></div>
</div>
<div>
<h1 className={"font-headline-xl-mobile text-headline-xl-mobile text-on-surface"}>طلب جديد!</h1>
<p className={"font-body-md text-body-md text-on-surface-variant"}>لديك طلب توصيل جديد</p>
</div>
</div>

<div className={"relative w-16 h-16 flex items-center justify-center"}>
<svg className={"w-full h-full transform -rotate-90"} viewBox={"0 0 100 100"}>
<circle className={"text-surface-variant"} cx={"50"} cy={"50"} fill={"none"} r={"45"} stroke={"currentColor"} strokeWidth={"6"}></circle>
<circle className={"text-error timer-ring"} cx={"50"} cy={"50"} fill={"none"} r={"45"} stroke={"currentColor"} strokeLinecap={"round"} strokeWidth={"6"}></circle>
</svg>
<span className={"absolute font-headline-md text-headline-md text-error"} id={"countdownText"}>25</span>
</div>
</div>

<div className={"bg-surface-container-low border border-outline-variant rounded-xl p-md flex flex-col gap-md relative"}>

<div className={"flex items-start gap-md relative z-10"}>
<div className={"flex flex-col items-center gap-xs mt-1"}>
<span className={"material-symbols-outlined text-tertiary"} style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
<div className={"w-0.5 h-8 bg-outline-variant rounded-full"}></div>
</div>
<div className={"flex-1"}>
<p className={"font-label-md text-label-md text-on-surface-variant"}>استلام من</p>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>مطعم برجر هاوس</h2>
</div>
<div className={"text-left"}>
<span className={"font-label-lg text-label-lg text-tertiary"}>1.2 كم</span>
</div>
</div>

<div className={"flex items-start gap-md relative z-10"}>
<div className={"flex flex-col items-center mt-1"}>
<span className={"material-symbols-outlined text-primary"} style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
</div>
<div className={"flex-1"}>
<p className={"font-label-md text-label-md text-on-surface-variant"}>تسليم إلى</p>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>حي النخيل</h2>
</div>
<div className={"text-left"}>
<span className={"font-label-lg text-label-lg text-primary"}>4.5 كم</span>
</div>
</div>

<div className={"absolute right-[33px] top-[40px] bottom-[40px] w-0.5 bg-outline-variant rounded-full z-0"}></div>
</div>

<div className={"flex gap-md"}>
<div className={"flex-1 bg-surface border border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center gap-xs"}>
<span className={"material-symbols-outlined text-on-surface-variant"}>payments</span>
<p className={"font-label-md text-label-md text-on-surface-variant"}>الأرباح المتوقعة</p>
<p className={"font-headline-md text-headline-md text-on-surface"}>12.00 ر.س</p>
</div>
<div className={"flex-1 bg-surface border border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center gap-xs"}>
<span className={"material-symbols-outlined text-on-surface-variant"}>route</span>
<p className={"font-label-md text-label-md text-on-surface-variant"}>المسافة الإجمالية</p>
<p className={"font-headline-md text-headline-md text-on-surface"}>5.7 كم</p>
</div>
</div>

<div className={"flex flex-col gap-sm mt-sm"}>
<button className={"w-full bg-primary-container text-on-primary-container font-headline-md text-headline-md py-md rounded-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-sm"}>
<span className={"material-symbols-outlined"}>check_circle</span>
                    قبول الطلب
                </button>
<button className={"w-full bg-transparent border-2 border-on-tertiary-fixed-variant text-on-tertiary-fixed-variant font-headline-md text-headline-md py-md rounded-xl active:scale-[0.98] transition-transform"}>
                    رفض
                </button>
</div>
</div>
</main>


    </ScreenFrame>
  );
}
