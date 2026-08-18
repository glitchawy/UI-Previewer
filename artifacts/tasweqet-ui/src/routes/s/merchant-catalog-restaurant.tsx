import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/merchant-catalog-restaurant")({
  head: () => ({
    meta: [
      { title: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenMerchantCatalogRestaurant,
});

function ScreenMerchantCatalogRestaurant() {
  return (
    <ScreenFrame slug="merchant-catalog-restaurant" title="\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643" bodyClassName="text-on-surface bg-surface font-body-md min-h-screen pb-24 md:pb-0">
      

<header className={"fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center h-16 px-margin-mobile"}>
<div className={"flex items-center gap-3"}>
<div className={"w-10 h-10 rounded-full overflow-hidden border border-outline-variant bg-surface-container"}>
<img alt={"Store Logo"} className={"w-full h-full object-cover"} data-alt={"A high-quality, perfectly circular logo for a modern local restaurant named '\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643'. The design features a stylized, appetizing illustration of a burger or culinary icon in deep brown (#5E3C1A) against a vibrant yellow background (#FFD502). The aesthetic is friendly, approachable, and uses flat vector style with smooth curves."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuB0BYWHWyiDBiPvNVJiYnWU5Uf5ktb2n9Va-R3xfroiObnd7hY0j0Wcxa5SaU8KLZk_407Lp71z-IjM_TR0Vxs6i2qYCjaS6BiRcJPJe7vyT99oJjyPKZvESkGJ4GsKgumbHu4oQFenHSVXTmtkWmfYCquz2M82bPrabATEN9Mtjpo3FXqg_c9ovibzeRxD63WvBaFceVoOB1liW9Qedd_aJKMj4BlXENQDYhcuHbKlyWcRyM4tM692"} />
</div>
<h1 className={"font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary"}>تسويقة بيتك</h1>
</div>
<div>
<span className={"font-label-lg text-label-lg text-primary px-3 py-1 rounded-full bg-primary-container/20"}>مفتوح</span>
</div>
</header>

<main className={"pt-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto"}>

<div className={"flex justify-between items-center mb-6"}>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>إدارة المنتجات</h2>
<button className={"hidden md:flex items-center gap-2 bg-primary-container text-on-primary-container font-label-lg text-label-lg px-4 py-2 rounded-xl hover:bg-primary-container/80 transition-colors"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
                إضافة منتج
            </button>
</div>

<section className={"mb-lg"}>
<h3 className={"font-label-lg text-label-lg text-on-surface-variant mb-4"}>التصنيفات</h3>
<div className={"flex md:grid md:grid-cols-4 gap-4 overflow-x-auto hide-scrollbar horizontal-scroll-container pb-4 md:pb-0"}>

<button className={"flex-shrink-0 w-32 md:w-full h-32 relative rounded-xl overflow-hidden border border-primary group"}>
<div className={"absolute inset-0 bg-black/20 z-10 transition-opacity group-hover:bg-black/30"}></div>
<img alt={"Burgers"} className={"absolute inset-0 w-full h-full object-cover"} data-alt={"A vibrant, appetizing close-up of a classic cheeseburger with fresh lettuce, tomato, and melted cheese, set against a warm, slightly out-of-focus background. The lighting is soft and inviting, highlighting the textures of the bun and ingredients. Food photography style, high resolution."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDcIppGQPdhkoMknzqGPSbJnxWFj54VN5BG2l1yxR2NDgoCfWsl-F9raVIOtRVYd6n12Jh6ehVXRZkoEckJoHI7jQDujFz2J04Ogxyp1hMw9o2_k8Zr6VTZpDuuF5K721krITcl6wfFmRclDpP9Uq0pJReJ1Oxb4FhIF9dET7jHh87JBIf31akBzFw3UwNKuCuU3HxjKngm35cSVrdIfnl7B5Z9oCa3lmpdh6h-S_EoDcZKaI8JZx9l"} />
<div className={"absolute inset-0 flex flex-col justify-end p-3 z-20"}>
<span className={"font-headline-md text-headline-md text-white font-bold mb-1"}>برجر</span>
<span className={"font-label-md text-label-md text-white/90 bg-black/40 w-fit px-2 py-0.5 rounded-full"}>12 منتج</span>
</div>

<div className={"absolute top-2 right-2 z-20 w-3 h-3 rounded-full bg-primary-container shadow-sm border border-white"}></div>
</button>

<button className={"flex-shrink-0 w-32 md:w-full h-32 relative rounded-xl overflow-hidden border border-outline-variant group"}>
<div className={"absolute inset-0 bg-black/40 z-10 transition-opacity group-hover:bg-black/30"}></div>
<img alt={"Pizza"} className={"absolute inset-0 w-full h-full object-cover"} data-alt={"A delicious overhead shot of a freshly baked pizza with bubbling mozzarella cheese and vibrant basil leaves, resting on a rustic wooden board. The lighting is warm and directional, casting soft shadows that emphasize the crust's texture. High-end culinary photography."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCl45G78cyKh5zfaMyesWXZxogwi5lpbSE0fPYbiY82qImAmjDK4kJedGtQYcYB6isM_QRuKeAoaAGYBLezwWoaIZefohKBa9-xBj1GVWCaaNWuCtJIQTNsYSTkmbdExYQVYFeVdU-bDtToR8un0Kh3ym1BhkcCvMP9bYPOLr_FW-dg_72859izGWwKomwzr0yUkMEx0GuyAJwr8Pxv7xLZ8zz70mdxyBqdq5055EJnVhA4mtXUIIZW"} />
<div className={"absolute inset-0 flex flex-col justify-end p-3 z-20"}>
<span className={"font-headline-md text-headline-md text-white font-bold mb-1"}>بيتزا</span>
<span className={"font-label-md text-label-md text-white/90 bg-black/40 w-fit px-2 py-0.5 rounded-full"}>8 منتجات</span>
</div>
</button>

<button className={"flex-shrink-0 w-32 md:w-full h-32 relative rounded-xl overflow-hidden border border-outline-variant group"}>
<div className={"absolute inset-0 bg-black/40 z-10 transition-opacity group-hover:bg-black/30"}></div>
<img alt={"Meals"} className={"absolute inset-0 w-full h-full object-cover"} data-alt={"A beautifully plated main course meal featuring grilled chicken, roasted vegetables, and a side of quinoa on a clean white plate. The setting is modern and minimal, with warm, bright lighting that makes the food look fresh and healthy. Professional food styling."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDFgKxmgXXUpO70umFhcbnNmgZF5TCZimE_TKpAi5U0iLfWb3CxHnVkufPcDO4sDJ5DxymOvRh_tsh90cUHSPb82CoZNoIyinYekxbDdmc4gufokOvFryYZiCOkO1z-MP0VPzWit7wUdfRGH5SWRdgMUQ7Sik5zurhQx6oTZkLDtF5xpyx93HF1RcaMcWnxLeSnN2Nakh4pgHAN4BIdSDnFvgqjHFt-vjOmMy1a7fQC8liOQ_0nkLNS"} />
<div className={"absolute inset-0 flex flex-col justify-end p-3 z-20"}>
<span className={"font-headline-md text-headline-md text-white font-bold mb-1"}>وجبات</span>
<span className={"font-label-md text-label-md text-white/90 bg-black/40 w-fit px-2 py-0.5 rounded-full"}>15 منتج</span>
</div>
</button>

<button className={"flex-shrink-0 w-32 md:w-full h-32 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest hover:bg-surface-container transition-colors text-secondary"}>
<span className={"material-symbols-outlined text-3xl"}>add_circle</span>
<span className={"font-label-lg text-label-lg"}>إضافة صنف</span>
</button>
</div>
</section>

<section>
<div className={"flex justify-between items-center mb-4"}>
<h3 className={"font-label-lg text-label-lg text-on-surface-variant"}>المنتجات (برجر)</h3>
<div className={"flex gap-2"}>
<button className={"p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"}>
<span className={"material-symbols-outlined"}>filter_list</span>
</button>
<button className={"p-2 rounded-full hover:bg-surface-variant text-on-surface-variant transition-colors"}>
<span className={"material-symbols-outlined"}>search</span>
</button>
</div>
</div>
<div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}>

<div className={"bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow"}>
<div className={"flex p-3 gap-4"}>
<div className={"w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative"}>
<img alt={"Classic Burger"} className={"w-full h-full object-cover"} data-alt={"A perfectly constructed classic beef burger with a shiny brioche bun, crisp lettuce, a slice of red tomato, and melting cheddar cheese. The background is a clean, minimal light cream color to make the burger pop. Studio lighting, highly detailed and appetizing."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAtklL5o4L107isviSts4OjjtTR9KKcA7PydmpUelZY5dQHikMl2g5gFIl4bbbiHaplUv9cIi4h1doc6fmqQ8NdcABgJBFwk-uWrVgf0UC56vuS2HVn5wUCQ2n-sJonwiy5TiQx6Itea33ZATloVuMEebCnCy0fBnsPcgLM1WXJXobWTGu89WLr8tHSCLHjcHBx8sG8avWlEgev-_QkyI1KXy7gX2hEe5XUNWAiQJal3My77SWFM7Zs"} />
<button className={"absolute top-1 right-1 p-1 bg-white/80 backdrop-blur rounded-full text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"}>edit</span>
</button>
</div>
<div className={"flex-1 flex flex-col justify-between py-1"}>
<div>
<h4 className={"font-label-lg text-label-lg text-on-surface mb-1"}>برجر كلاسيك</h4>
<p className={"font-headline-md text-headline-md text-secondary font-bold"}>35 ر.س</p>
</div>
<div className={"flex justify-between items-center mt-2"}>
<span className={"font-label-md text-label-md text-on-surface-variant"}>متاح</span>

<div className={"relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in"}>
<input defaultChecked={true} className={"toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-2 border-outline-variant appearance-none cursor-pointer z-10 top-0.5 right-0.5 transition-transform duration-200 ease-in-out checked:translate-x-[-1.25rem] checked:border-primary-container"} id={"toggle1"} name={"toggle"} type={"checkbox"} />
<label className={"toggle-label block overflow-hidden h-6 rounded-full bg-primary-container cursor-pointer"} htmlFor={"toggle1"}></label>
</div>
</div>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow"}>
<div className={"flex p-3 gap-4"}>
<div className={"w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative"}>
<img alt={"Double Burger"} className={"w-full h-full object-cover"} data-alt={"A mouth-watering double cheeseburger featuring two juicy beef patties, double layers of melted cheese, caramelized onions, and a special sauce, all packed in a toasted sesame seed bun. The setting is minimal and clean, emphasizing the tall, layered structure of the burger."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuC1B9upzl6NWHjyAVVOk51jsSbVpPYFZ48AQKCTksmYVnsc9wPvi4Asgeho-BQi_--uKzj1Xi8LYAUm2N2JQ3dRz9INmCYNBVpJox8wj_kBBG8Crkp2NPrsqIfpkwnhOA4g_QzeOISGoC8hP80fNU78oESI2jibST_oFisSUSO-210_LmA1spFp-ktmW55jUbaG5ll_SdmaI3G0Ynsxvwb56YE2Eza5D0DCpwNWKTp1BWP0a5u52grs"} />
<button className={"absolute top-1 right-1 p-1 bg-white/80 backdrop-blur rounded-full text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"}>edit</span>
</button>
</div>
<div className={"flex-1 flex flex-col justify-between py-1"}>
<div>
<h4 className={"font-label-lg text-label-lg text-on-surface mb-1"}>دبل برجر</h4>
<p className={"font-headline-md text-headline-md text-secondary font-bold"}>48 ر.س</p>
</div>
<div className={"flex justify-between items-center mt-2"}>
<span className={"font-label-md text-label-md text-on-surface-variant"}>متاح</span>
<div className={"relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in"}>
<input defaultChecked={true} className={"toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-2 border-outline-variant appearance-none cursor-pointer z-10 top-0.5 right-0.5 transition-transform duration-200 ease-in-out checked:translate-x-[-1.25rem] checked:border-primary-container"} id={"toggle2"} name={"toggle"} type={"checkbox"} />
<label className={"toggle-label block overflow-hidden h-6 rounded-full bg-primary-container cursor-pointer"} htmlFor={"toggle2"}></label>
</div>
</div>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden opacity-75 hover:opacity-100 transition-opacity"}>
<div className={"flex p-3 gap-4"}>
<div className={"w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container relative grayscale"}>
<img alt={"Spicy Chicken Burger"} className={"w-full h-full object-cover"} data-alt={"A crispy fried chicken burger with spicy mayo, crunchy pickles, and shredded lettuce on a soft potato bun. The visual style is slightly desaturated to indicate it is currently out of stock, but still looks appealing with high-quality food styling."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBXf77_GrsNlHiVRgyuXgZnAdIPHFHiqZj9cRTa-kwEFDPNggWOXI3u_f8Ut0V4xiazi3mea4Opvk_aVtWAnpqRCvHjS7JrzorUwOGuQot5L_hVnsmkSXELz0R1rfMN0FJt0vAlHrAumpgthabPSkWIn0bHqhhx4tn6Fb0Zrtm7oPsE0EkY0bZnwXT0dJ0H36Gubq5GW_mh3g1pr1gc_68aPCqFLVkERABoGGw0_XsIzYGgzPyFnS1Q"} />
<button className={"absolute top-1 right-1 p-1 bg-white/80 backdrop-blur rounded-full text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"}>edit</span>
</button>
<div className={"absolute inset-0 bg-surface/40 flex items-center justify-center"}>
<span className={"bg-surface px-2 py-1 rounded text-[10px] font-bold text-error"}>نفذت الكمية</span>
</div>
</div>
<div className={"flex-1 flex flex-col justify-between py-1"}>
<div>
<h4 className={"font-label-lg text-label-lg text-on-surface mb-1"}>برجر دجاج سبايسي</h4>
<p className={"font-headline-md text-headline-md text-secondary font-bold"}>38 ر.س</p>
</div>
<div className={"flex justify-between items-center mt-2"}>
<span className={"font-label-md text-label-md text-on-surface-variant"}>غير متاح</span>
<div className={"relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in"}>
<input className={"toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-2 border-outline-variant appearance-none cursor-pointer z-10 top-0.5 right-0.5 transition-transform duration-200 ease-in-out"} id={"toggle3"} name={"toggle"} type={"checkbox"} />
<label className={"toggle-label block overflow-hidden h-6 rounded-full bg-surface-container-highest cursor-pointer"} htmlFor={"toggle3"}></label>
</div>
</div>
</div>
</div>
</div>
</div>
</section>

<div className={"h-24 md:h-8"}></div>
</main>

<button className={"md:hidden fixed bottom-24 left-4 z-40 bg-primary-container text-on-primary-container w-14 h-14 rounded-[16px] shadow-lg flex items-center justify-center hover:bg-primary-container/90 transition-transform active:scale-95"}>
<span className={"material-symbols-outlined text-3xl"} style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
</button>

<nav className={"md:hidden fixed bottom-0 w-full z-50 rounded-t-xl border-t border-outline-variant bg-surface flex justify-around items-center h-20 pb-safe px-2 shadow-lg"}>
<button className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors"}>
<span className={"material-symbols-outlined mb-1"}>home</span>
<span className={"font-label-md text-label-md"}>الرئيسية</span>
</button>
<button className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors"}>
<span className={"material-symbols-outlined mb-1"}>receipt_long</span>
<span className={"font-label-md text-label-md"}>الطلبات</span>
</button>

<button className={"flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-3 py-1 scale-90 transition-transform duration-150"}>
<span className={"material-symbols-outlined mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
<span className={"font-label-md text-label-md font-bold"}>المنتجات</span>
</button>
<button className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors"}>
<span className={"material-symbols-outlined mb-1"}>analytics</span>
<span className={"font-label-md text-label-md"}>التحليلات</span>
</button>
<button className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors"}>
<span className={"material-symbols-outlined mb-1"}>menu</span>
<span className={"font-label-md text-label-md"}>المزيد</span>
</button>
</nav>

<aside className={"hidden md:flex flex-col fixed right-0 top-16 bottom-0 w-64 bg-surface border-l border-outline-variant pt-6 px-4 z-40"}>
<nav className={"space-y-2"}>
<a className={"flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/50 transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"}>home</span>
<span className={"font-label-lg text-label-lg"}>الرئيسية</span>
</a>
<a className={"flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/50 transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"}>receipt_long</span>
<span className={"font-label-lg text-label-lg"}>الطلبات</span>
<span className={"mr-auto bg-primary text-on-primary text-xs font-bold px-2 py-0.5 rounded-full"}>3</span>
</a>
<a className={"flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-container text-on-primary-container font-bold"} href={"#"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
<span className={"font-label-lg text-label-lg"}>المنتجات</span>
</a>
<a className={"flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/50 transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"}>analytics</span>
<span className={"font-label-lg text-label-lg"}>التحليلات</span>
</a>
<a className={"flex items-center gap-3 px-4 py-3 rounded-xl text-on-surface-variant hover:bg-surface-variant/50 transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"}>settings</span>
<span className={"font-label-lg text-label-lg"}>الإعدادات</span>
</a>
</nav>
</aside>


    </ScreenFrame>
  );
}
