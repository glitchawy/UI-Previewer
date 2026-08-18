import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/home-discovery")({
  head: () => ({
    meta: [
      { title: "Customer Home - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Customer Home - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Customer Home - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Customer Home - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenHomeDiscovery,
});

function ScreenHomeDiscovery() {
  return (
    <ScreenFrame slug="home-discovery" title="Customer Home - Tasweeqet Betak" bodyClassName="bg-background text-on-surface font-body-md min-h-screen pb-24 relative overflow-x-hidden">
      

<header className={"bg-surface border-b border-outline-variant docked full-width top-0 sticky z-50 flat no shadows flex flex-row-reverse justify-between items-center px-margin-mobile w-full backdrop-blur-md py-4"}>

<div className={"flex items-center gap-2 cursor-pointer group"}>
<span className={"material-symbols-outlined text-primary text-2xl group-hover:bg-surface-container-low transition-colors rounded-full p-1"} style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
<div className={"flex flex-col"}>
<span className={"font-label-md text-label-md text-on-surface-variant"}>التوصيل إلى</span>
<span className={"font-headline-md text-headline-md-mobile text-primary flex items-center gap-1"}>المنزل، المعادي <span className={"material-symbols-outlined text-sm"}>expand_more</span></span>
</div>
</div>

<button className={"relative p-2 text-primary hover:bg-surface-container-low transition-colors rounded-full opacity-80 hover:opacity-100 duration-150"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
<span className={"absolute top-2 right-2 w-2 h-2 bg-error rounded-full"}></span>
</button>
</header>
<main className={"max-w-7xl mx-auto px-margin-mobile pt-lg pb-xl space-y-lg"}>

<section className={"w-full"}>
<div className={"input-pill flex items-center px-4 py-3 gap-3 w-full transition-all"}>
<span className={"material-symbols-outlined text-secondary opacity-60"}>search</span>
<input className={"w-full bg-transparent border-none focus:ring-0 text-on-surface placeholder:text-[#8A6742] font-body-md rtl text-right"} placeholder={"\u062f\u0648\u0631 \u0639\u0644\u0649 \u0645\u0637\u0639\u0645\u060c \u0645\u0646\u062a\u062c\u060c \u0623\u0648 \u0623\u064a \u062d\u0627\u062c\u0629 \u0645\u062d\u062a\u0627\u062c\u0647\u0627"} type={"text"} />
<button className={"p-1 text-secondary opacity-60 hover:opacity-100"}>
<span className={"material-symbols-outlined"}>tune</span>
</button>
</div>
</section>

<section className={"w-full"}>
<div className={"bg-primary-container rounded-card p-6 flex items-center justify-between overflow-hidden relative isolate"}>

<div className={"absolute -right-8 -top-8 w-32 h-32 bg-white opacity-20 rounded-full blur-2xl"}></div>
<div className={"absolute -left-4 -bottom-4 w-24 h-24 bg-white opacity-20 rounded-full blur-xl"}></div>
<div className={"z-10 flex flex-col gap-2"}>
<h2 className={"font-headline-lg-mobile text-headline-lg-mobile text-secondary font-bold"}>خصم ٢٠٪ على طلبك الأول</h2>
<p className={"font-body-md text-body-md text-secondary opacity-80"}>استخدم كود: TASWEQ20</p>
<button className={"btn-primary w-fit px-6 py-2 mt-2 shadow-sm"}>اطلب دلوقتي</button>
</div>
<div className={"z-10 hidden sm:block w-32 h-32"}>
<img className={"w-full h-full object-contain"} data-alt={"A vibrant, stylized 3D illustration of a generic food delivery bag and a burger, illuminated with warm, appetizing lighting, set against a bright yellow background. The style is modern, energetic, and clean, suitable for a mobile app promotional banner."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDK5jE2kGgrT3lop8Hiarm5aSxdIhDsgCBEqXFF8mWkVgI-iCvlv_n-aGR3IE90Gj29Qq72yVLGYDFZcW0VNeRHdPBAfv8lH0Ubj6neGS2KycVfrU4v8Ros2ul4ksPzs_67_s0G0es2IE32qfCM8wtS_g2Awhvdbqv7QL-ctruEgMmZFoEniJn23CxGxRdfop4p5nSdYjJ6ComNbhOX_oZbYeurzZXaI_E58NOoWz2Vfppr6kO3m02A"} />
</div>
</div>
</section>

<section className={"w-full pt-4"}>
<h3 className={"font-headline-md text-headline-md text-secondary mb-4 font-bold"}>بتدور على إيه؟</h3>
<div className={"grid grid-cols-4 gap-4"}>

<button className={"card-level-1 card-level-2 flex flex-col items-center justify-center p-4 gap-3"}>
<div className={"w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center"}>
<span className={"material-symbols-outlined text-secondary text-3xl"} style={{ fontVariationSettings: "'FILL' 1" }}>restaurant</span>
</div>
<span className={"font-label-lg text-label-lg text-secondary"}>مطاعم</span>
</button>

<button className={"card-level-1 card-level-2 flex flex-col items-center justify-center p-4 gap-3"}>
<div className={"w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center"}>
<span className={"material-symbols-outlined text-secondary text-3xl"} style={{ fontVariationSettings: "'FILL' 1" }}>local_cafe</span>
</div>
<span className={"font-label-lg text-label-lg text-secondary"}>كافيهات</span>
</button>

<button className={"card-level-1 card-level-2 flex flex-col items-center justify-center p-4 gap-3"}>
<div className={"w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center"}>
<span className={"material-symbols-outlined text-secondary text-3xl"} style={{ fontVariationSettings: "'FILL' 1" }}>local_pharmacy</span>
</div>
<span className={"font-label-lg text-label-lg text-secondary"}>صيدلية</span>
</button>

<button className={"card-level-1 card-level-2 flex flex-col items-center justify-center p-4 gap-3"}>
<div className={"w-12 h-12 bg-primary-container/20 rounded-full flex items-center justify-center"}>
<span className={"material-symbols-outlined text-secondary text-3xl"} style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
</div>
<span className={"font-label-lg text-label-lg text-secondary"}>سوبر ماركت</span>
</button>
</div>
</section>

<section className={"w-full pt-6"}>
<div className={"flex items-center justify-between mb-4"}>
<h3 className={"font-headline-md text-headline-md text-secondary font-bold"}>عروض قريبة منك</h3>
<button className={"text-secondary font-label-md text-label-md flex items-center hover:opacity-80 transition-opacity"}>
                    عرض الكل <span className={"material-symbols-outlined text-sm"}>chevron_left</span>
</button>
</div>
<div className={"flex overflow-x-auto gap-4 pb-4 -mx-margin-mobile px-margin-mobile snap-x scrollbar-hide"} style={{ scrollbarWidth: "none" }}>

<div className={"card-level-1 card-level-2 min-w-[280px] sm:min-w-[320px] snap-center overflow-hidden flex flex-col cursor-pointer"}>
<div className={"h-36 w-full relative"}>
<img className={"w-full h-full object-cover"} data-alt={"A high-quality, mouth-watering close-up photograph of a juicy, double-patty cheeseburger from 'Burger House'. The burger is perfectly assembled with fresh lettuce and melting cheese, softly lit in a warm, appetizing light against a clean, modern background."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAIckd9swk-ZvZ5HdKo7y04w5CPRx8UAQ1eLmagpyHDv4V-11wWeF6VEBNr4T112wJ-QxK8wkbLn0NbPBdUf3FuMO26frKgOORDk51qdYZR-QUzFI9UBZcJZv_6kgWYTItEcDPbpIGCGQLcKhDcc9T2Dlmcbul8qmohIeHsNrKGzT7NZvlszEo8MaBZcJ22ffvqhH2ByBoGEp7t2R65RMTVDkyN2jEFNkY6pGSGYjICMsMw0LilYJfc"} />
<div className={"absolute top-2 right-2 bg-primary-container text-secondary font-label-md text-label-md px-2 py-1 rounded-full font-bold flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>local_offer</span> 15% خصم
                        </div>
</div>
<div className={"p-4 flex flex-col gap-2"}>
<div className={"flex justify-between items-start"}>
<h4 className={"font-headline-md text-headline-md text-secondary font-bold"}>برجر هاوس</h4>
<div className={"flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full"}>
<span className={"material-symbols-outlined text-primary text-sm"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className={"font-label-md text-label-md text-secondary"}>4.8</span>
</div>
</div>
<div className={"flex items-center gap-4 text-on-surface-variant font-label-md text-label-md mt-1"}>
<div className={"flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>schedule</span> 25-35 دقيقة
                            </div>
<div className={"flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>two_wheeler</span> توصيل 15 ج.م
                            </div>
</div>
</div>
</div>

<div className={"card-level-1 card-level-2 min-w-[280px] sm:min-w-[320px] snap-center overflow-hidden flex flex-col cursor-pointer"}>
<div className={"h-36 w-full relative"}>
<img className={"w-full h-full object-cover"} data-alt={"A high-resolution, appetizing photograph of a freshly baked, artisan pepperoni pizza from a local pizzeria. The cheese is perfectly melted and bubbly, with a warm, inviting lighting setup that highlights the textures. The style is modern and clean."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBtmmM1tJ6opJ6qiul9KK0GbdDH4ZyN360gt5nfdm0ugipEtqi5LG9WJCZm5GWiyIZIDlfTWfamAq8A_0j8C70VBBtXMRc-WehgEM4XnUw5VrFsiqT_b-4OXo5BiLV8BdPIvxC1lc9wu1zk8eiXclqOJenoGtz-xLFnB85JG135wsMOErT3y80RvmZBBpAJzhMiWiNMlmbNFBcw0AsttTtlUmDLolugXQTwaQNfY_ynxUbC2m7kR_BW"} />
</div>
<div className={"p-4 flex flex-col gap-2"}>
<div className={"flex justify-between items-start"}>
<h4 className={"font-headline-md text-headline-md text-secondary font-bold"}>بيتزا روما</h4>
<div className={"flex items-center gap-1 bg-surface-container px-2 py-1 rounded-full"}>
<span className={"material-symbols-outlined text-primary text-sm"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className={"font-label-md text-label-md text-secondary"}>4.5</span>
</div>
</div>
<div className={"flex items-center gap-4 text-on-surface-variant font-label-md text-label-md mt-1"}>
<div className={"flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>schedule</span> 30-40 دقيقة
                            </div>
<div className={"flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>two_wheeler</span> توصيل مجاني
                            </div>
</div>
</div>
</div>
</div>
</section>
</main>

<nav className={"bg-surface border-t border-outline-variant docked full-width bottom-0 fixed z-50 flat no shadows flex flex-row-reverse justify-around items-center w-full pb-safe pt-2 px-2 md:hidden"}>

<a className={"flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 scale-95 transition-transform duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
<span className={"font-label-md text-label-md mt-1"}>الرئيسية</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container-high rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"}>receipt_long</span>
<span className={"font-label-md text-label-md mt-1"}>طلباتي</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container-high rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"}>local_offer</span>
<span className={"font-label-md text-label-md mt-1"}>العروض</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container-high rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"}>person</span>
<span className={"font-label-md text-label-md mt-1"}>حسابي</span>
</a>
</nav>

    </ScreenFrame>
  );
}
