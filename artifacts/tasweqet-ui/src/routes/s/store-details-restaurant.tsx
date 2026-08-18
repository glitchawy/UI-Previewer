import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/store-details-restaurant")({
  head: () => ({
    meta: [
      { title: "Customer App Store Details | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Customer App Store Details \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Customer App Store Details | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Customer App Store Details \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenStoreDetailsRestaurant,
});

function ScreenStoreDetailsRestaurant() {
  return (
    <ScreenFrame slug="store-details-restaurant" title="Customer App Store Details" bodyClassName="bg-surface text-on-surface font-body-md antialiased pb-24 md:pb-0">
      

<header className={"docked full-width top-0 sticky z-50 border-b border-outline-variant bg-surface flex flex-row-reverse justify-between items-center px-margin-mobile w-full backdrop-blur-md h-[64px] hidden md:flex"}>
<div className={"flex items-center gap-4"}>
<span className={"material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-low transition-colors p-2 rounded-full"} data-icon={"location_on"}>location_on</span>
<h1 className={"font-headline-md text-headline-md font-bold text-secondary"}>Tasweeqet Betak</h1>
</div>
<span className={"material-symbols-outlined text-primary cursor-pointer hover:bg-surface-container-low transition-colors p-2 rounded-full"} data-icon={"notifications"}>notifications</span>
</header>

<div className={"md:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur-sm border-b border-outline-variant p-margin-mobile flex items-center justify-between"}>
<button className={"w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-lowest border border-outline-variant text-on-surface hover:bg-surface-container-low transition-colors"}>
<span className={"material-symbols-outlined"}>arrow_forward</span>
</button>
<div className={"flex-1 mr-4"}>
<div className={"relative"}>
<input className={"w-full bg-surface-container-lowest border border-outline-variant rounded-full py-2 pr-10 pl-4 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-[#8A6742]"} placeholder={"\u0627\u0644\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0642\u0627\u0626\u0645\u0629..."} type={"text"} />
<span className={"material-symbols-outlined absolute right-3 top-2.5 text-on-surface-variant"}>search</span>
</div>
</div>
</div>

<main className={"max-w-7xl mx-auto md:flex md:gap-lg md:p-margin-desktop"}>

<nav className={"hidden md:flex flex-col p-md h-[calc(100vh-64px)] fixed right-0 top-[64px] border-l border-outline-variant bg-surface-container-low w-72 z-40"}>
<div className={"flex flex-col items-start mb-lg px-4 pt-4"}>
<h2 className={"font-headline-xl text-headline-xl text-secondary mb-2"}>متجر التوفير</h2>
<span className={"font-label-lg text-label-lg text-on-surface-variant"}>تاجر معتمد</span>
</div>
<ul className={"flex-1 space-y-2"}>
<li>
<a className={"flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"dashboard"}>dashboard</span>
<span className={"font-label-lg text-label-lg"}>لوحة التحكم</span>
</a>
</li>
<li>
<a className={"flex items-center gap-3 p-3 rounded-lg bg-secondary text-on-secondary font-bold transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"shopping_bag"}>shopping_bag</span>
<span className={"font-label-lg text-label-lg"}>الطلبات</span>
</a>
</li>
<li>
<a className={"flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"inventory_2"}>inventory_2</span>
<span className={"font-label-lg text-label-lg"}>المنتجات</span>
</a>
</li>
<li>
<a className={"flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"analytics"}>analytics</span>
<span className={"font-label-lg text-label-lg"}>التحليلات</span>
</a>
</li>
<li>
<a className={"flex items-center gap-3 p-3 rounded-lg text-on-surface-variant hover:bg-surface-container-high transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"settings"}>settings</span>
<span className={"font-label-lg text-label-lg"}>الإعدادات</span>
</a>
</li>
</ul>
</nav>

<div className={"hidden md:block w-72 flex-shrink-0"}></div>

<div className={"flex-1 flex flex-col gap-lg"}>

<section className={"bg-surface-container-lowest rounded-xl overflow-hidden border border-outline-variant shadow-sm relative"}>

<div className={"h-48 md:h-64 w-full relative"}>
<img className={"w-full h-full object-cover"} data-alt={"A high-quality, appetizing cover photo for a gourmet burger restaurant in a modern minimal app design. Bright lighting, warm yellow and rich brown tones, showcasing a juicy double cheeseburger with fresh lettuce and tomato against a clean, slightly blurred background."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDE6UgC-XC5uIF9wbrbdqDrZGDoeVfRNItOFo19C8hAj_pvkXxMFJjTTOYP562qIpPqAXVwQODeMseefX0-Q4fl8KOc5C-Y8VjWgu2Nv9t1c3nX0H3omzx42Y2SRk9jD1UI1LxBzp8qzV0y2jsXP3eRmCZbw3z4s6xUSGModzntTDylFPtamtbg99W8jaMf33ntiHX7i0O5a8DUOz_raUfVz_BqT-pgNj6YHY2lq__drrOHDMOnyawC"} />

<div className={"absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"}></div>
</div>

<div className={"p-margin-mobile relative"}>

<div className={"absolute -top-12 right-margin-mobile w-24 h-24 rounded-xl border-4 border-surface-container-lowest bg-white overflow-hidden shadow-sm flex items-center justify-center"}>
<img className={"w-full h-full object-contain p-2"} data-alt={"A clean, bold, and modern logo for a burger restaurant. Minimalist vector illustration featuring warm yellows and rich browns. Flat design, no gradients, friendly organic curves, appetizing aesthetic."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuATbPWdYjyh0xvOEjhWgvFGdSCOLyPoG0MohzRO3WZgCom9R2fHpz_m7tCLA6ediR45dMQ25zZKEQU9OCYqiHc_Da7FNm3qT0ehWKgrZLy1b-BLJoOlRDwivU1RmjPRk-b5-_8FVluHgz-cO0q1jmM59atdIfB0zP-X6_XuPFtb-eBxTsXk0l5VEibYKcuGTnbUxqJRfpKtQJPprajJ63uj1hN2lG59Kkdv1MNtA_xdBNfIflBJ6GFR"} />
</div>
<div className={"mt-12 md:mt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"}>
<div>
<h2 className={"font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-on-surface mb-1"}>برجر ستيشن - Burger Station</h2>
<p className={"font-body-md text-body-md text-on-surface-variant flex items-center gap-1"}>
<span className={"material-symbols-outlined text-primary text-sm"}>fastfood</span>
                                برجر، أمريكي، وجبات سريعة
                            </p>
</div>
<div className={"flex gap-4 items-center bg-surface-container-low p-3 rounded-lg border border-outline-variant"}>
<div className={"flex flex-col items-center border-l border-outline-variant pl-4"}>
<div className={"flex items-center gap-1 text-on-surface font-bold"}>
<span className={"material-symbols-outlined filled text-primary text-md"}>star</span>
<span>4.8</span>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>(1.2k+ تقييم)</span>
</div>
<div className={"flex flex-col items-center border-l border-outline-variant pl-4"}>
<span className={"material-symbols-outlined text-on-surface-variant text-md"}>schedule</span>
<span className={"font-label-md text-label-md text-on-surface-variant mt-1"}>20-30 دقيقة</span>
</div>
<div className={"flex flex-col items-center"}>
<span className={"material-symbols-outlined text-on-surface-variant text-md"}>two_wheeler</span>
<span className={"font-label-md text-label-md text-on-surface-variant mt-1"}>15 ر.س</span>
</div>
</div>
</div>
</div>
</section>

<div className={"sticky top-[64px] md:top-0 z-30 bg-surface border-b border-outline-variant pt-2"}>
<div className={"flex justify-around md:justify-start md:gap-8 hide-scrollbar overflow-x-auto"}>
<button className={"pb-3 px-4 font-label-lg text-label-lg text-primary border-b-2 border-primary font-bold whitespace-nowrap"}>القائمة</button>
<button className={"pb-3 px-4 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface whitespace-nowrap"}>التقييمات</button>
<button className={"pb-3 px-4 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface whitespace-nowrap"}>معلومات</button>
</div>
</div>

<div className={"overflow-x-auto hide-scrollbar -mx-margin-mobile px-margin-mobile md:mx-0 md:px-0"}>
<div className={"flex gap-3 pb-2 w-max"}>
<button className={"px-5 py-2 rounded-full bg-on-surface text-surface font-label-lg text-label-lg transition-colors"}>الأكثر مبيعاً</button>
<button className={"px-5 py-2 rounded-full bg-surface-container-low border border-outline-variant text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"}>الوجبات</button>
<button className={"px-5 py-2 rounded-full bg-surface-container-low border border-outline-variant text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"}>برجر</button>
<button className={"px-5 py-2 rounded-full bg-surface-container-low border border-outline-variant text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"}>مقبلات</button>
<button className={"px-5 py-2 rounded-full bg-surface-container-low border border-outline-variant text-on-surface font-label-lg text-label-lg hover:bg-surface-container-high transition-colors"}>مشروبات</button>
</div>
</div>

<div className={"space-y-xl"}>

<section>
<h3 className={"font-headline-md text-headline-md font-bold text-on-surface mb-md"}>الأكثر مبيعاً</h3>
<div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md"}>

<div className={"bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 flex gap-4 hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-all duration-200 group"}>
<div className={"flex-1 flex flex-col justify-between"}>
<div>
<h4 className={"font-label-lg text-label-lg font-bold text-on-surface mb-1"}>دبل ستيشن برجر</h4>
<p className={"font-body-md text-[14px] leading-snug text-on-surface-variant line-clamp-2"}>شريحتين لحم أنجوس، جبن ذائب، صوص ستيشن السري، خس، طماطم، مخلل في خبز بريوش محمص.</p>
</div>
<div className={"mt-4 flex items-center justify-between"}>
<span className={"font-headline-md text-headline-md font-bold text-[#5E3C1A]"}>35 ر.س</span>
<button className={"w-8 h-8 rounded-full bg-surface-container-low border border-[#5E3C1A] text-[#5E3C1A] flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-[#5E3C1A] transition-colors"}>
<span className={"material-symbols-outlined text-sm"}>add</span>
</button>
</div>
</div>
<div className={"w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low"}>
<img className={"w-full h-full object-cover"} data-alt={"A mouth-watering close-up of a double cheeseburger. High contrast, warm lighting, rich colors, isolated on a clean light background. Modern UI style, appetizing."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCYK2Y1Y5nZaEtWwuD8nB7pGqWaQ6sH3LgXV3DjWwK3yb7X_Ti9xcp8OGi_9wYAktAAnmQJHhCsxzlvjpWWQpZwLzJ7bg2pSdhHOVXe7WBxUWU1S_SBY3pG553JUpClhVepammw9wsK9RLQJk4gVWk2RSwrhmOTMIcxU5kXuXKDoVrH6um7BEOS1BeyhEbToR_2r4S-ILHtQYuvg68JXSscAT1J9I_EmI1G_QwBGsmxntShWqqZXjKs"} />
</div>
</div>

<div className={"bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 flex gap-4 hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-all duration-200 group"}>
<div className={"flex-1 flex flex-col justify-between"}>
<div>
<h4 className={"font-label-lg text-label-lg font-bold text-on-surface mb-1"}>وجبة كلاسيك</h4>
<p className={"font-body-md text-[14px] leading-snug text-on-surface-variant line-clamp-2"}>برجر كلاسيك مع بطاطس مقلية ذهبية ومشروب غازي من اختيارك.</p>
</div>
<div className={"mt-4 flex items-center justify-between"}>
<span className={"font-headline-md text-headline-md font-bold text-[#5E3C1A]"}>42 ر.س</span>
<button className={"w-8 h-8 rounded-full bg-surface-container-low border border-[#5E3C1A] text-[#5E3C1A] flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-[#5E3C1A] transition-colors"}>
<span className={"material-symbols-outlined text-sm"}>add</span>
</button>
</div>
</div>
<div className={"w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low"}>
<img className={"w-full h-full object-cover"} data-alt={"A fast food meal combo featuring a classic burger, crispy golden french fries, and a soft drink. Warm appetizing colors, minimalist styling, high-quality photography."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBKbpyIzXafUnVBHKuflao3sbBetX8e25p3N8-ZXqlO2aCRgCJ2nIhemafURaR_H98ZVQZiTsug16CoBkkBnIfzOV9yQVzYnXRkhuOKLMaUtvQ23wnkdKt2zsD7RdXhc6apYopOeiy-QlavTLcx_E64gQbAioi3Ve9FRZEP3TZRlUgH-rX2_QcGR0hbIOplIJ6dUGUUX7d7ZZ1S_3NaC4FLivcfTe3y3j5ok8rNMvYQNg5d0nrNO097"} />
</div>
</div>
</div>
</section>

<section>
<h3 className={"font-headline-md text-headline-md font-bold text-on-surface mb-md mt-lg"}>برجر</h3>
<div className={"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-md"}>

<div className={"bg-surface-container-lowest rounded-2xl border border-outline-variant p-4 flex gap-4 hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-all duration-200 group"}>
<div className={"flex-1 flex flex-col justify-between"}>
<div>
<h4 className={"font-label-lg text-label-lg font-bold text-on-surface mb-1"}>كرسبي تشيكن</h4>
<p className={"font-body-md text-[14px] leading-snug text-on-surface-variant line-clamp-2"}>صدر دجاج مقرمش، جبن، سلطة ملفوف، صوص حار.</p>
</div>
<div className={"mt-4 flex items-center justify-between"}>
<span className={"font-headline-md text-headline-md font-bold text-[#5E3C1A]"}>28 ر.س</span>
<button className={"w-8 h-8 rounded-full bg-surface-container-low border border-[#5E3C1A] text-[#5E3C1A] flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-[#5E3C1A] transition-colors"}>
<span className={"material-symbols-outlined text-sm"}>add</span>
</button>
</div>
</div>
<div className={"w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-surface-container-low"}>
<img className={"w-full h-full object-cover"} data-alt={"A crispy fried chicken sandwich in a brioche bun. Golden brown texture, vibrant green coleslaw, appetizing lighting, clean background."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAWIN-ahN4rRmkTQCDjd-0iGHaLBaE3HDUELdxTaOTtaNJ55zbKB_IuvpYiRubokS_M2AKFuICUvRStd-ccfIEFSbZTQwgLcpQ2-VgYy1ZwXmjRQQ1Z85qnJWGGwSPA0r-NEOlCXl5cwuQlHH8yIN5EcM8puhDwM2g-dOBlCGJITxnoRbRonLX97h3w1oSOLnt7AFiRL89irsgHBbwiMQfsZExSmUxGFpeNbTPkeNIQLXynKIOPQaz9"} />
</div>
</div>
</div>
</section>
</div>

<div className={"h-24 md:h-0"}></div>
</div>
</main>

<div className={"fixed bottom-[80px] md:bottom-lg left-0 right-0 px-margin-mobile md:left-auto md:right-lg md:w-80 flex justify-center z-40"}>
<button className={"w-full bg-[#FFD502] text-[#5E3C1A] rounded-[12px] p-4 flex items-center justify-between font-bold shadow-[0_4px_12px_rgba(94,60,26,0.12)] hover:bg-[#ffe174] transition-colors"}>
<div className={"flex items-center gap-2"}>
<div className={"bg-[#5E3C1A] text-white w-6 h-6 rounded-full flex items-center justify-center text-xs"}>2</div>
<span className={"font-label-lg text-label-lg"}>عرض السلة</span>
</div>
<span className={"font-headline-md text-headline-md"}>77 ر.س</span>
</button>
</div>

<nav className={"docked full-width bottom-0 fixed z-50 border-t border-outline-variant bg-surface flex flex-row-reverse justify-around items-center w-full pb-safe pt-2 px-2 md:hidden"}>
<a className={"flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1 scale-95 transition-transform duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"home"}>home</span>
<span className={"font-label-md text-label-md mt-1"}>الرئيسية</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container-high rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"receipt_long"}>receipt_long</span>
<span className={"font-label-md text-label-md mt-1"}>طلباتي</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container-high rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"local_offer"}>local_offer</span>
<span className={"font-label-md text-label-md mt-1"}>العروض</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant p-2 hover:bg-surface-container-high rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"person"}>person</span>
<span className={"font-label-md text-label-md mt-1"}>حسابي</span>
</a>
</nav>

    </ScreenFrame>
  );
}
