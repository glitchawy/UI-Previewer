import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/delivery-completed")({
  head: () => ({
    meta: [
      { title: "Delivered Successfully | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Delivered Successfully \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Delivered Successfully | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Delivered Successfully \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenDeliveryCompleted,
});

function ScreenDeliveryCompleted() {
  return (
    <ScreenFrame slug="delivery-completed" title="Delivered Successfully" bodyClassName="bg-surface text-on-surface font-body-md min-h-screen flex flex-col relative overflow-hidden">
      

<div className={"absolute inset-0 pointer-events-none z-0"} id={"confetti-container"}></div>

<main className={"flex-1 flex flex-col items-center justify-center px-margin-mobile py-xl z-10 w-full max-w-md mx-auto"}>

<div className={"relative w-40 h-40 mb-8 flex items-center justify-center"}>
<div className={"absolute inset-0 bg-primary-container rounded-full opacity-20 animate-pulse"}></div>
<div className={"absolute inset-4 bg-primary-container rounded-full opacity-50 shadow-[0_4px_16px_rgba(94,60,26,0.1)]"}></div>
<div className={"relative w-24 h-24 bg-primary-container rounded-full flex items-center justify-center check-anim shadow-[0_8px_24px_rgba(94,60,26,0.2)]"}>
<span className={"material-symbols-outlined text-on-primary-container"} style={{ fontSize: "64px", fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                </span>
</div>
</div>

<h1 className={"font-headline-xl-mobile text-headline-xl-mobile text-on-surface text-center mb-10"}>
            تم التوصيل بنجاح!
        </h1>

<div className={"w-full bg-surface-container-lowest rounded-[16px] border border-outline-variant p-6 mb-8 transition-transform hover:-translate-y-1 hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] duration-300"}>
<div className={"flex justify-between items-center pb-4 border-b border-outline-variant/50 mb-4"}>
<span className={"font-label-lg text-label-lg text-on-surface-variant"}>رقم الطلب</span>
<span className={"font-label-lg text-label-lg text-on-surface"}>#8932</span>
</div>
<div className={"space-y-4 mb-6"}>
<div className={"flex justify-between items-center"}>
<div className={"flex items-center gap-2 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[20px]"}>payments</span>
<span className={"font-body-md text-body-md"}>أرباح التوصيل</span>
</div>
<span className={"font-headline-md text-headline-md text-primary"}>12.00 ر.س</span>
</div>
<div className={"flex justify-between items-center"}>
<div className={"flex items-center gap-2 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[20px]"}>schedule</span>
<span className={"font-body-md text-body-md"}>المدة</span>
</div>
<span className={"font-body-md text-body-md text-on-surface font-semibold"}>18 دقيقة</span>
</div>
</div>

<div className={"bg-surface-container-low rounded-xl p-4 flex justify-between items-center"}>
<div className={"flex items-center gap-2"}>
<span className={"material-symbols-outlined text-primary"} style={{ fontVariationSettings: "'FILL' 1" }}>
                        stars
                    </span>
<span className={"font-label-lg text-label-lg text-on-surface-variant"}>إجمالي أرباح اليوم</span>
</div>
<span className={"font-headline-md text-headline-md text-on-surface"}>27.50 ر.س</span>
</div>
</div>

<div className={"w-full space-y-4 mt-auto"}>
<button className={"w-full bg-primary-container text-on-primary-container font-label-lg text-label-lg h-14 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform shadow-[0_2px_8px_rgba(94,60,26,0.1)]"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>search</span>
                البحث عن طلب جديد
            </button>
<button className={"w-full bg-surface-container-lowest border-2 border-outline-variant text-on-surface font-label-lg text-label-lg h-14 rounded-xl flex items-center justify-center active:scale-[0.98] transition-transform hover:bg-surface-container-low"}>
                إيقاف العمل
            </button>
</div>
</main>


    </ScreenFrame>
  );
}
