import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/merchant-dashboard-restaurant")({
  head: () => ({
    meta: [
      { title: "\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenMerchantDashboardRestaurant,
});

function ScreenMerchantDashboardRestaurant() {
  return (
    <ScreenFrame slug="merchant-dashboard-restaurant" title="\u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 - \u0644\u0648\u062d\u0629 \u0627\u0644\u062a\u062d\u0643\u0645" bodyClassName="font-body-md text-on-surface pb-24 md:pb-0 pt-16 font-[Inter]">
      

<header className={"bg-surface dark:bg-surface-dim fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant dark:border-outline flat no shadows flex justify-between items-center h-16 px-margin-mobile w-full"}>

<div className={"flex items-center gap-2"}>
<div className={"w-10 h-10 rounded-full overflow-hidden border border-outline-variant"}>
<img className={"w-full h-full object-cover"} data-alt={"A clean, appetizing minimalist vector logo of a local restaurant on a white background, featuring a subtle culinary element like a stylized flame or leaf. The logo uses warm deep brown and vibrant yellow tones, fitting a modern light-mode app interface."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBeruMKxPyCjK7GPzq7sqjRptrE-vnNviwuPyRJxP_m24Y3It7nKcGntb6ilBAVESbmmcOlg_NnHN5rNN0MVrjAzWDjJI0dx7N2ckXiKtu8via0nhVKJ4vutGvYftsXCQGXwk0U-eHLBN7QpOOHYUaCvOJc25LP7Tqm1wHYSUfZDVb3_-uc8YIMa1fsTYUYi6It6HDlXchAqaegOi_kGGVvfMBym83ctzsl8uG7AMiZRQxkK_jUN7Ca"} />
</div>
<h1 className={"font-headline-md-mobile text-headline-md-mobile font-bold text-primary dark:text-primary-fixed-dim"} style={{ color: "#5E3C1A" }}>تسويقة بيتك</h1>
</div>

<div className={"flex items-center gap-2"}>
<span className={"font-label-lg text-label-lg text-on-surface-variant dark:text-surface-variant"}>مفتوح</span>
<div className={"relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in"}>
<input defaultChecked={true} className={"toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"} id={"store-status"} name={"toggle"} type={"checkbox"} />
<label className={"toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"} htmlFor={"store-status"}></label>
</div>
</div>
</header>

<main className={"max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop mt-lg flex flex-col gap-lg"}>

<section>
<h2 className={"font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-xs"} style={{ color: "#5E3C1A" }}>مرحباً بك،</h2>
<p className={"font-body-lg text-body-lg text-on-surface-variant"}>نظرة عامة على أداء مطعمك اليوم.</p>
</section>

<section className={"grid grid-cols-2 md:grid-cols-4 gap-sm md:gap-md"}>

<div className={"bg-white rounded-xl border border-outline-variant p-md flex flex-col gap-sm hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-primary-container"} style={{ color: "#FFD502" }}>receipt_long</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>اليوم</span>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface-variant mb-xs"}>طلبات اليوم</p>
<p className={"font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold"} style={{ color: "#5E3C1A" }}>24</p>
</div>
</div>

<div className={"bg-primary-container rounded-xl border border-outline-variant p-md flex flex-col gap-sm hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-on-primary-container"}>payments</span>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-primary-container mb-xs"}>إجمالي المبيعات</p>
<p className={"font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-primary-container font-bold"}>1,250 <span className={"font-label-md text-label-md font-normal"}>ر.س</span></p>
</div>
</div>

<div className={"bg-white rounded-xl border border-outline-variant p-md flex flex-col gap-sm hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-secondary"} style={{ color: "#5E3C1A" }}>hourglass_top</span>
<div className={"w-2 h-2 rounded-full bg-primary-container animate-pulse"}></div>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface-variant mb-xs"}>قيد التجهيز</p>
<p className={"font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold"} style={{ color: "#5E3C1A" }}>5</p>
</div>
</div>

<div className={"bg-white rounded-xl border border-outline-variant p-md flex flex-col gap-sm hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-on-surface-variant"}>trending_up</span>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface-variant mb-xs"}>متوسط قيمة الطلب</p>
<p className={"font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-bold"} style={{ color: "#5E3C1A" }}>52 <span className={"font-label-md text-label-md font-normal"}>ر.س</span></p>
</div>
</div>
</section>

<section className={"flex flex-col gap-md"}>
<h3 className={"font-headline-md-mobile md:font-headline-md text-headline-md-mobile md:text-headline-md text-on-surface"} style={{ color: "#5E3C1A" }}>إجراءات سريعة</h3>
<div className={"grid grid-cols-4 gap-sm"}>

<button className={"bg-white border border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center gap-2 hover:bg-surface-variant/50 transition-colors h-24"}>
<div className={"w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center"}>
<span className={"material-symbols-outlined text-on-surface"} style={{ color: "#5E3C1A" }}>add_circle</span>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant text-center"}>إضافة منتج</span>
</button>

<button className={"bg-white border border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center gap-2 hover:bg-surface-variant/50 transition-colors h-24"}>
<div className={"w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center"}>
<span className={"material-symbols-outlined text-on-surface"} style={{ color: "#5E3C1A" }}>list_alt</span>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant text-center"}>إدارة الطلبات</span>
</button>

<button className={"bg-white border border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center gap-2 hover:bg-surface-variant/50 transition-colors h-24"}>
<div className={"w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center"}>
<span className={"material-symbols-outlined text-on-surface"} style={{ color: "#5E3C1A" }}>local_offer</span>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant text-center"}>إضافة عرض</span>
</button>

<button className={"bg-white border border-outline-variant rounded-xl p-sm flex flex-col items-center justify-center gap-2 hover:bg-surface-variant/50 transition-colors h-24"}>
<div className={"w-10 h-10 rounded-full bg-surface-container-low flex items-center justify-center"}>
<span className={"material-symbols-outlined text-on-surface"} style={{ color: "#5E3C1A" }}>inventory_2</span>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant text-center"}>المخزون</span>
</button>
</div>
</section>

<section className={"flex flex-col gap-md"}>
<div className={"flex justify-between items-center"}>
<h3 className={"font-headline-md-mobile md:font-headline-md text-headline-md-mobile md:text-headline-md text-on-surface"} style={{ color: "#5E3C1A" }}>أحدث الطلبات</h3>
<button className={"font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface transition-colors"} style={{ color: "#8A6742" }}>عرض الكل</button>
</div>
<div className={"flex flex-col gap-sm"}>

<div className={"bg-white rounded-xl border border-outline-variant p-md flex justify-between items-center hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow cursor-pointer"}>
<div className={"flex items-center gap-md"}>
<div className={"w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-headline-md-mobile text-headline-md-mobile text-on-surface font-bold"} style={{ color: "#5E3C1A" }}>
                            #104
                        </div>
<div className={"flex flex-col"}>
<span className={"font-label-lg text-label-lg text-on-surface"} style={{ color: "#5E3C1A" }}>أحمد محمد</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>3 عناصر • 145 ر.س</span>
</div>
</div>
<div>
<span className={"px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-label-md text-label-md flex items-center gap-1"}>
<span className={"w-1.5 h-1.5 rounded-full bg-on-primary-container"}></span>
                            جديد
                        </span>
</div>
</div>

<div className={"bg-white rounded-xl border border-outline-variant p-md flex justify-between items-center hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow cursor-pointer"}>
<div className={"flex items-center gap-md"}>
<div className={"w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-headline-md-mobile text-headline-md-mobile text-on-surface font-bold"} style={{ color: "#5E3C1A" }}>
                            #103
                        </div>
<div className={"flex flex-col"}>
<span className={"font-label-lg text-label-lg text-on-surface"} style={{ color: "#5E3C1A" }}>سارة خالد</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>1 عنصر • 45 ر.س</span>
</div>
</div>
<div>
<span className={"px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container font-label-md text-label-md flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>skillet</span>
                            قيد التجهيز
                        </span>
</div>
</div>

<div className={"bg-white rounded-xl border border-outline-variant p-md flex justify-between items-center hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow cursor-pointer opacity-70"}>
<div className={"flex items-center gap-md"}>
<div className={"w-12 h-12 rounded-lg bg-surface-container flex items-center justify-center font-headline-md-mobile text-headline-md-mobile text-on-surface font-bold"} style={{ color: "#5E3C1A" }}>
                            #102
                        </div>
<div className={"flex flex-col"}>
<span className={"font-label-lg text-label-lg text-on-surface"} style={{ color: "#5E3C1A" }}>فهد العتيبي</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>5 عناصر • 320 ر.س</span>
</div>
</div>
<div>
<span className={"px-3 py-1 rounded-full bg-surface-container-highest text-on-surface-variant font-label-md text-label-md flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>check_circle</span>
                            مكتمل
                        </span>
</div>
</div>
</div>
</section>
</main>

<nav className={"bg-surface dark:bg-surface-container-lowest fixed bottom-0 w-full z-50 rounded-t-xl border-t border-outline-variant dark:border-outline shadow-lg flex justify-around items-center h-20 pb-safe px-2 md:hidden"}>

<button className={"flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-3 py-1 scale-90 transition-transform duration-150"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
<span className={"font-label-md text-label-md"}>الرئيسية</span>
</button>

<button className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"}>
<span className={"material-symbols-outlined"}>receipt_long</span>
<span className={"font-label-md text-label-md"}>الطلبات</span>
</button>
<button className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"}>
<span className={"material-symbols-outlined"}>inventory_2</span>
<span className={"font-label-md text-label-md"}>المنتجات</span>
</button>
<button className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"}>
<span className={"material-symbols-outlined"}>analytics</span>
<span className={"font-label-md text-label-md"}>التحليلات</span>
</button>
<button className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"}>
<span className={"material-symbols-outlined"}>menu</span>
<span className={"font-label-md text-label-md"}>المزيد</span>
</button>
</nav>

    </ScreenFrame>
  );
}
