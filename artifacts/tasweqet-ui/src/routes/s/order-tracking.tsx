import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/order-tracking")({
  head: () => ({
    meta: [
      { title: "Live Order Tracking - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Live Order Tracking - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Live Order Tracking - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Live Order Tracking - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenOrderTracking,
});

function ScreenOrderTracking() {
  return (
    <ScreenFrame slug="order-tracking" title="Live Order Tracking - Tasweeqet Betak" bodyClassName="bg-background text-on-background antialiased min-h-screen flex flex-col font-body-md">
      

<header className={"bg-surface border-b border-outline-variant flex flex-row items-center px-margin-mobile py-4 w-full sticky top-0 z-50"}>
<button className={"text-on-surface-variant hover:bg-surface-container-low p-2 rounded-full transition-colors flex items-center justify-center"}>
<span className={"material-symbols-outlined"}>arrow_forward</span>
</button>
<div className={"flex-1 text-center font-headline-md text-headline-md font-bold text-secondary"}>
            تتبع الطلب
        </div>
<div className={"w-10"}></div> 
</header>
<main className={"flex-1 flex flex-col relative w-full max-w-[480px] mx-auto bg-surface-container-lowest"}>

<div className={"relative w-full h-[353px] bg-surface-variant overflow-hidden"} data-alt={"A top-down view of a modern city map in a light UI style. The map features subtle cream and warm grey tones matching a minimalist aesthetic. A stylized pin indicates a delivery driver's location on a road, with soft highlights denoting the route. The visual style is clean, vector-like, and easy to read, with no heavy shadows, just flat, bold blocks of color and soft curves."} data-location={"Riyadh"} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBKtczD75Wg73Lm96LmlIWdPTeq-SUy3Vd4e1pHUXzpN2bk7XYIXS8-xG21sBzU8Mvhn2am7IuUygS07AAyF0qxSNkZM3SSGlVIlwhQ6Q_if76Um7zx5gu2yY1_0bABaYxWheSapKE1f6aW-K9pE5p1f1ac2fNucXBTXfT0lfsOytJBTwRJNeMTsC6qSaw8_Tz8y69niYcokSjNPtvlOFhZNdJQ8uTpGIPmiqVkY9wHmVOQIFkx0_Ks')" }}>

<div className={"absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-transparent opacity-80"}></div>

<div className={"absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"}>
<div className={"bg-primary-container text-on-primary-container p-2 rounded-full shadow-md"}>
<span className={"material-symbols-outlined text-[32px]"}>two_wheeler</span>
</div>
<div className={"w-2 h-2 bg-primary rounded-full mt-1"}></div>
</div>
</div>

<div className={"flex-1 flex flex-col bg-surface-container-lowest rounded-t-[32px] -mt-6 relative z-10 p-margin-mobile space-y-lg shadow-[0_-4px_16px_rgba(94,60,26,0.04)]"}>

<div className={"w-12 h-1.5 bg-surface-variant rounded-full mx-auto mb-2"}></div>

<div className={"flex flex-col items-center text-center space-y-2"}>
<h1 className={"font-headline-lg-mobile text-headline-lg-mobile text-on-background"}>الطلب في الطريق</h1>
<p className={"font-body-md text-body-md text-on-surface-variant"}>يصل خلال <span className={"font-bold text-primary"}>12 دقيقة</span></p>
<p className={"font-label-md text-label-md text-outline"}>وقت الوصول المتوقع 02:45 مساءً</p>
</div>

<div className={"bg-surface border border-[#F0E8D0] rounded-xl p-md"}>
<div className={"flex flex-col space-y-6"}>

<div className={"flex items-start gap-4"}>
<div className={"flex flex-col items-center mt-1"}>
<div className={"w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center"}>
<span className={"material-symbols-outlined text-[14px]"}>check</span>
</div>
<div className={"w-0.5 h-8 bg-primary-container my-1"}></div>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-background"}>تم تأكيد الطلب</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>02:15 مساءً</p>
</div>
</div>

<div className={"flex items-start gap-4"}>
<div className={"flex flex-col items-center mt-1"}>
<div className={"w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center"}>
<span className={"material-symbols-outlined text-[14px]"}>check</span>
</div>
<div className={"w-0.5 h-8 bg-primary-container my-1"}></div>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-background"}>قيد التجهيز</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>02:20 مساءً</p>
</div>
</div>

<div className={"flex items-start gap-4"}>
<div className={"flex flex-col items-center mt-1"}>
<div className={"w-6 h-6 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center"}>
<span className={"material-symbols-outlined text-[14px]"}>check</span>
</div>
<div className={"w-0.5 h-8 bg-primary-container my-1"}></div>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-background"}>تم الاستلام من المتجر</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>02:30 مساءً</p>
</div>
</div>

<div className={"flex items-start gap-4"}>
<div className={"flex flex-col items-center mt-1"}>
<div className={"w-6 h-6 rounded-full border-2 border-primary bg-surface flex items-center justify-center"}>
<div className={"w-2 h-2 rounded-full bg-primary"}></div>
</div>
</div>
<div>
<p className={"font-label-lg text-label-lg text-primary"}>في الطريق إليك</p>
<p className={"font-label-md text-label-md text-primary"}>المندوب في طريقه الآن</p>
</div>
</div>
</div>
</div>

<div className={"bg-surface border border-[#F0E8D0] rounded-xl p-md flex flex-row items-center justify-between shadow-[0_4px_8px_rgba(94,60,26,0.04)]"}>
<div className={"flex items-center gap-4"}>
<img className={"w-12 h-12 rounded-full object-cover border-2 border-[#F0E8D0]"} data-alt={"A headshot portrait of a friendly delivery driver wearing a clean uniform jacket. The lighting is bright and modern, illuminating his face softly. The background is a warm, solid cream color matching the UI palette. The aesthetic is approachable and professional, conveying trust and reliability."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuChAPqIP3eHuxSULwBAgDlnkq6--_CEi2egfhRFmW0ZfZVEHAzed3pOAZHdOOIJ4l_uCdQnNsu-WBgMNwElvb5_JY-I89ilkVHaN33XUo1noY-MmmQiRs76bCBIaTnp5p0K_klv8Aj1Q8-kbyIVwQ0St0eTqFu17h_MVcs0IGPtrIHNefoH8UOREIbFBmMwFWVzFrq5Gx2yA2yPcznC-KegYzeYKg1Eq5ncj96W3hr-UJnJ4yaZB3K3"} />
<div>
<p className={"font-label-lg text-label-lg text-on-background"}>أحمد خالد</p>
<div className={"flex items-center gap-1 text-on-surface-variant font-label-md text-label-md"}>
<span className={"material-symbols-outlined text-primary-fixed-dim text-[16px]"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span>4.8</span>
<span className={"mx-1"}>•</span>
<span>دراجة نارية (أ د 1234)</span>
</div>
</div>
</div>

<div className={"flex gap-2"}>
<button className={"w-10 h-10 rounded-full border-2 border-secondary text-secondary flex items-center justify-center hover:bg-surface-container-low transition-colors"}>
<span className={"material-symbols-outlined"}>chat</span>
</button>
<button className={"w-10 h-10 rounded-full bg-primary-container text-[#5E3C1A] flex items-center justify-center hover:opacity-90 transition-opacity"}>
<span className={"material-symbols-outlined"}>call</span>
</button>
</div>
</div>

<div className={"bg-surface-container-low rounded-xl p-md border border-outline-variant"}>
<div className={"flex justify-between items-center mb-2"}>
<span className={"font-label-lg text-label-lg text-on-background"}>رقم الطلب #89324</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>تفاصيل الطلب</span>
</div>
<div className={"flex items-center gap-2 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[20px]"}>storefront</span>
<span className={"font-body-md text-body-md"}>متجر التوفير</span>
</div>
</div>
</div>
</main>

    </ScreenFrame>
  );
}
