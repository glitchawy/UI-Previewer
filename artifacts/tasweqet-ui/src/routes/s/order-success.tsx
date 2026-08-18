import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/order-success")({
  head: () => ({
    meta: [
      { title: "Order Success | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Order Success \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Order Success | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Order Success \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenOrderSuccess,
});

function ScreenOrderSuccess() {
  return (
    <ScreenFrame slug="order-success" title="Order Success" bodyClassName="bg-surface text-on-surface min-h-screen flex flex-col items-center justify-center font-body-md antialiased p-margin-mobile md:p-margin-desktop">
      

<main className={"w-full max-w-md bg-surface-container-lowest rounded-2xl border border-outline-variant p-xl flex flex-col items-center text-center shadow-[0_4px_8px_rgba(94,60,26,0.04)]"}>

<div className={"mb-lg flex justify-center items-center w-32 h-32 bg-primary-container rounded-full relative overflow-hidden"}>

<div className={"absolute top-4 right-4 w-2 h-2 bg-on-primary-container rounded-full animate-ping opacity-75"}></div>
<div className={"absolute bottom-6 left-6 w-3 h-3 bg-secondary rounded-full animate-bounce opacity-50"}></div>
<span className={"material-symbols-outlined text-6xl text-on-primary-container"} data-icon={"check_circle"} style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
</div>

<h1 className={"font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-secondary mb-sm"}>
            تم استلام طلبك بنجاح!
        </h1>

<div className={"w-full bg-surface-container-low rounded-xl p-md mt-md mb-xl flex flex-col gap-sm border border-outline-variant"}>
<div className={"flex justify-between items-center w-full"}>
<span className={"font-label-lg text-label-lg text-on-surface-variant"}>رقم الطلب</span>
<span className={"font-headline-md text-headline-md text-secondary"} style={{ direction: "ltr" }}>#12345</span>
</div>
<div className={"h-px bg-outline-variant w-full my-xs"}></div>
<div className={"flex justify-between items-center w-full"}>
<span className={"font-label-lg text-label-lg text-on-surface-variant"}>الوقت المتوقع للتوصيل</span>
<div className={"flex items-center gap-2"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"schedule"}>schedule</span>
<span className={"font-body-md text-body-md text-on-surface font-semibold"}>35 دقيقة</span>
</div>
</div>
</div>

<div className={"w-full flex flex-col gap-md"}>
<button className={"w-full bg-primary-container text-on-tertiary-fixed font-headline-md text-headline-md rounded-xl py-sm flex justify-center items-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98]"}>
<span className={"material-symbols-outlined"} data-icon={"location_on"}>location_on</span>
                تتبع الطلب
            </button>
<button className={"w-full bg-surface-container-lowest border-2 border-secondary text-secondary font-headline-md text-headline-md rounded-xl py-sm flex justify-center items-center hover:bg-surface-container-low transition-colors active:scale-[0.98]"}>
                العودة للرئيسية
            </button>
</div>
</main>



    </ScreenFrame>
  );
}
