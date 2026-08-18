import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/location-selection")({
  head: () => ({
    meta: [
      { title: "\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenLocationSelection,
});

function ScreenLocationSelection() {
  return (
    <ScreenFrame slug="location-selection" title="\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0645\u0648\u0642\u0639" bodyClassName="min-h-screen flex flex-col items-center justify-center bg-pattern p-margin-mobile md:p-margin-desktop">
      

<main className={"w-full max-w-md bg-surface-container-lowest rounded-[24px] shadow-sm border border-surface-container-high overflow-hidden relative z-10 flex flex-col p-lg md:p-xl"}>

<div className={"w-full h-64 mb-xl relative flex justify-center items-center"}>

<div className={"absolute inset-0 flex justify-center items-center opacity-20"}>
<div className={"w-48 h-48 bg-primary-container rounded-full blur-2xl absolute translate-x-4 -translate-y-4"}></div>
<div className={"w-40 h-40 bg-secondary-container rounded-full blur-2xl absolute -translate-x-8 translate-y-8"}></div>
</div>
<img alt={"Location Illustration"} className={"object-contain h-full w-full relative z-10 drop-shadow-md rounded-2xl"} data-alt={"A stylized, modern 3D illustration of a map location pin with a friendly, welcoming vibe. The illustration uses a warm palette of yellow and deep brown against a bright cream background. The style is clean, geometric, and minimalistic, fitting a local delivery ecosystem brand. Soft, ambient lighting creates a tactile, premium feel without heavy shadows. The composition is central and balanced."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBkMwu2nAipce4EG6jpPRmNMPQdpqocig7C9gZROpZO5yKOT-XbpkhpZr8ZUylsMz72-Xss-QKxmDV5yPi7X24jRaHDUjFpKTBt_u_hpJfqSB56FzNr1sRojY7T7AbepSUcycQHJQP5cv9AgUxm1YZnn1DB3xifUN87iryYBe8uHdWrc4P8665EN51ubp2V3G3cSN6Odz87he33V94Z0ZSVawhUR-5iZIazVYA0gHhKEvG8mjScRoBA"} />
</div>

<div className={"text-center mb-xl"}>
<h1 className={"font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl text-on-surface mb-sm"}>فين تحب نستلمك الطلب؟</h1>
<p className={"font-body-md text-body-md text-on-surface-variant max-w-[280px] mx-auto"}>
                عشان نقدر نوصلك أقرب العروض والمتاجر المتاحة في منطقتك بسرعة وسهولة.
            </p>
</div>

<div className={"flex flex-col gap-md w-full mt-auto"}>
<button className={"w-full bg-primary-container text-on-tertiary-fixed font-headline-md text-headline-md py-4 px-6 rounded-[12px] flex items-center justify-center gap-sm hover:brightness-95 transition-all active:scale-[0.98]"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>my_location</span>
<span>استخدام الموقع الحالي</span>
</button>
<button className={"w-full bg-surface-container-lowest border-2 border-on-tertiary-fixed text-on-tertiary-fixed font-headline-md text-headline-md py-4 px-6 rounded-[12px] flex items-center justify-center gap-sm hover:bg-surface-container-low transition-all active:scale-[0.98]"}>
<span className={"material-symbols-outlined"}>edit_location_alt</span>
<span>إدخال العنوان يدوياً</span>
</button>
</div>

<div className={"mt-lg text-center"}>
<button className={"text-tertiary font-label-lg text-label-lg hover:underline underline-offset-4"}>
                تخطي في الوقت الحالي
             </button>
</div>
</main>

    </ScreenFrame>
  );
}
