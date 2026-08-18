import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/product-details-burger")({
  head: () => ({
    meta: [
      { title: "Tasweeqet Betak - Product Details | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Product Details \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Tasweeqet Betak - Product Details | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Product Details \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenProductDetailsBurger,
});

function ScreenProductDetailsBurger() {
  return (
    <ScreenFrame slug="product-details-burger" title="Tasweeqet Betak - Product Details" bodyClassName="bg-surface text-on-surface min-h-screen pb-32">
      

<header className={"flex flex-row-reverse justify-between items-center px-margin-mobile py-4 w-full sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-outline-variant"}>
<button aria-label={"Back"} className={"w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary"}>
<span className={"material-symbols-outlined"} data-icon={"arrow_forward"}>arrow_forward</span>
</button>
<div className={"font-headline-md text-headline-md-mobile font-bold text-secondary"}>
            تفاصيل المنتج
        </div>
<button aria-label={"Favorite"} className={"w-10 h-10 flex items-center justify-center rounded-full bg-surface-container hover:bg-surface-container-high transition-colors text-primary"}>
<span className={"material-symbols-outlined"} data-icon={"favorite_border"}>favorite_border</span>
</button>
</header>
<main className={"max-w-4xl mx-auto md:grid md:grid-cols-12 md:gap-gutter pt-4 px-margin-mobile"}>

<div className={"md:col-span-6 lg:col-span-7 mb-lg md:mb-0 relative rounded-2xl overflow-hidden shadow-[0_4px_16px_rgba(94,60,26,0.08)] bg-white border border-outline-variant aspect-[4/3] md:aspect-square group"}>
<img className={"object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"} data-alt={"A mouth-watering, high-resolution close-up of a premium double cheeseburger. The burger features two perfectly seared, juicy beef patties, melted bright orange cheddar cheese dripping down the sides, fresh crisp green lettuce, ripe red tomato slices, and a shiny, golden-brown brioche bun toasted to perfection. The setting is a bright, modern culinary environment with warm, inviting lighting that highlights the textures and colors of the ingredients, giving it an appetizing and optimistic vibe consistent with a modern local commerce delivery platform."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAKt5uRx_IiZj34rIWScx8vjOEsRzI5aNIgCJjpraZ3xWbFA8ZqMyD5IA3teEXfPDUiIeps_wztFW3QtxklBtCZoM00KR3r8HX86fcwPAFl34AYKLN-a2bowQ2Hsy09kgroXe_Qg9bjZlpFEiby7QnA5m2zpmoPoH6XY0Xn_YM_qRtIYYJSHam7GE247wp9Y16qpMbjem6srVi_7DNpEDepchbqdKVj93oSC2GBPNPrTZ1Iztx2c4_O"} />
<div className={"absolute bottom-4 right-4 bg-primary-container text-on-primary-container font-label-md text-label-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[16px]"} data-icon={"star"} data-weight={"fill"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                4.8
            </div>
</div>

<div className={"md:col-span-6 lg:col-span-5 flex flex-col gap-lg"}>

<section className={"bg-white rounded-2xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm"}>
<h1 className={"font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface"}>برجر لحم دبل كلاسيك</h1>
<p className={"font-body-md text-body-md text-on-surface-variant"}>شريحتين من اللحم البقري الطازج المشوي، مع جبن الشيدر الذائب، الخس المقرمش، الطماطم، وصلصة البيت الخاصة في خبز البريوش المحمص.</p>
<div className={"mt-2 flex items-center justify-between"}>
<span className={"font-headline-xl text-headline-xl-mobile md:text-headline-xl text-secondary"}>35 ر.س</span>
<div className={"flex items-center gap-xs text-on-surface-variant bg-surface-container px-2 py-1 rounded-full font-label-sm text-label-sm"}>
<span className={"material-symbols-outlined text-[16px]"} data-icon={"schedule"}>schedule</span>
                        20-30 دقيقة
                    </div>
</div>
</section>

<section className={"bg-white rounded-2xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm"}>
<h2 className={"font-headline-md text-headline-md-mobile text-on-surface border-b border-outline-variant pb-2"}>الحجم</h2>
<div className={"flex flex-col gap-2 mt-2"}>
<label className={"flex items-center justify-between p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/10"}>
<div className={"flex items-center gap-3"}>
<input defaultChecked={true} className={"text-primary-container focus:ring-primary-container w-5 h-5"} name={"size"} type={"radio"} />
<span className={"font-label-lg text-label-lg text-on-surface"}>عادي</span>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>+0 ر.س</span>
</label>
<label className={"flex items-center justify-between p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/10"}>
<div className={"flex items-center gap-3"}>
<input className={"text-primary-container focus:ring-primary-container w-5 h-5"} name={"size"} type={"radio"} />
<span className={"font-label-lg text-label-lg text-on-surface"}>كبير (ميجا)</span>
</div>
<span className={"font-label-md text-label-md text-secondary"}>+10 ر.س</span>
</label>
</div>
</section>

<section className={"bg-white rounded-2xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm"}>
<div className={"flex justify-between items-end border-b border-outline-variant pb-2"}>
<h2 className={"font-headline-md text-headline-md-mobile text-on-surface"}>إضافات</h2>
<span className={"font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full"}>اختياري</span>
</div>
<div className={"flex flex-col gap-2 mt-2"}>
<label className={"flex items-center justify-between p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/10"}>
<div className={"flex items-center gap-3"}>
<input className={"rounded text-primary-container focus:ring-primary-container w-5 h-5"} type={"checkbox"} />
<span className={"font-label-lg text-label-lg text-on-surface"}>شريحة جبن إضافية</span>
</div>
<span className={"font-label-md text-label-md text-secondary"}>+3 ر.س</span>
</label>
<label className={"flex items-center justify-between p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/10"}>
<div className={"flex items-center gap-3"}>
<input className={"rounded text-primary-container focus:ring-primary-container w-5 h-5"} type={"checkbox"} />
<span className={"font-label-lg text-label-lg text-on-surface"}>هلابينو</span>
</div>
<span className={"font-label-md text-label-md text-secondary"}>+2 ر.س</span>
</label>
<label className={"flex items-center justify-between p-3 rounded-xl border border-outline-variant cursor-pointer hover:bg-surface-container-low transition-colors has-[:checked]:border-primary-container has-[:checked]:bg-primary-container/10"}>
<div className={"flex items-center gap-3"}>
<input className={"rounded text-primary-container focus:ring-primary-container w-5 h-5"} type={"checkbox"} />
<span className={"font-label-lg text-label-lg text-on-surface"}>صوص البيت الخاص</span>
</div>
<span className={"font-label-md text-label-md text-secondary"}>+4 ر.س</span>
</label>
</div>
</section>

<section className={"bg-white rounded-2xl p-md border border-outline-variant shadow-sm flex flex-col gap-sm"}>
<h2 className={"font-headline-md text-headline-md-mobile text-on-surface mb-1"}>تعليمات خاصة</h2>
<textarea className={"w-full rounded-xl border-outline-variant bg-white text-on-surface focus:border-primary-container focus:ring-primary-container placeholder:text-outline p-3 font-body-md text-body-md resize-none"} placeholder={"\u0645\u062b\u0627\u0644: \u0628\u062f\u0648\u0646 \u0628\u0635\u0644\u060c \u0632\u064a\u0627\u062f\u0629 \u0635\u0648\u0635..."} rows={3}></textarea>
</section>
</div>
</main>

<div className={"fixed bottom-0 left-0 w-full bg-white border-t border-outline-variant p-4 pb-safe z-50 shadow-[0_-4px_16px_rgba(94,60,26,0.05)]"}>
<div className={"max-w-4xl mx-auto flex items-center justify-between gap-4"}>

<div className={"flex items-center gap-3 bg-surface-container-low border border-outline-variant rounded-[50px] p-1"}>
<button aria-label={"Decrease quantity"} className={"w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-secondary hover:bg-surface-container transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"remove"}>remove</span>
</button>
<span className={"font-headline-md text-headline-md-mobile w-6 text-center text-on-surface"}>1</span>
<button aria-label={"Increase quantity"} className={"w-10 h-10 flex items-center justify-center rounded-full bg-white shadow-sm text-secondary hover:bg-surface-container transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add"}>add</span>
</button>
</div>

<button className={"flex-1 bg-primary-container text-on-primary-container font-headline-md text-headline-md-mobile font-bold py-3 px-6 rounded-[12px] flex items-center justify-center gap-2 hover:brightness-95 transition-all shadow-sm active:scale-95"}>
<span className={"material-symbols-outlined"} data-icon={"shopping_cart"}>shopping_cart</span>
                أضف للسلة - 35 ر.س
            </button>
</div>
</div>

    </ScreenFrame>
  );
}
