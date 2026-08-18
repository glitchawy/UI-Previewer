import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/merchant-analytics")({
  head: () => ({
    meta: [
      { title: "\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenMerchantAnalytics,
});

function ScreenMerchantAnalytics() {
  return (
    <ScreenFrame slug="merchant-analytics" title="\u062a\u062d\u0644\u064a\u0644\u0627\u062a \u0627\u0644\u0645\u0628\u064a\u0639\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643" bodyClassName="bg-background text-on-background pb-32">
      

<header className={"fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant dark:border-outline"}>
<div className={"flex justify-between items-center h-16 px-margin-mobile w-full"}>

<div className={"flex items-center gap-sm"}>
<img alt={"Store Logo"} className={"w-10 h-10 rounded-full object-cover border border-outline-variant shadow-sm"} data-alt={"A clean, minimalist abstract logo design representing a local grocery store or merchant, rendered in a warm, appetizing palette of deep brown and bright yellow against a pristine white background. The style is modern, approachable, and highly legible, reflecting a high-quality local delivery service ecosystem. Studio lighting, sharp focus."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDLkabWG-kAW4LjFDhMeweGah1hEtyn1FcO4DcDg4Bt6eWMCkDHeEx3ENo1w02J4J0fzU82wyBkVhoF3iNL2paYA-tytaAvJMAfrfwv5Uig9kVIEZxd4JfTda1fpejrwCBvPGZxjIKYA2QRMYa1rnKDgAvK__o-agEW35XPxDxPqsG1Pdx2PGlR7-pfF5w-oXxyYZuMdwhHJ1UE5MJoekyqDibIt3ZaIQfqj_WZKpjubU1v4lneJt4f"} />
</div>

<h1 className={"font-headline-md-mobile text-headline-md-mobile font-bold text-primary dark:text-primary-fixed-dim tracking-tight"}>تسويقة بيتك</h1>

<div>
<span className={"font-label-lg text-label-lg text-primary bg-primary-container px-3 py-1 rounded-full font-bold"}>مفتوح</span>
</div>
</div>
</header>

<main className={"pt-24 px-margin-mobile md:px-margin-desktop space-y-xl max-w-4xl mx-auto"}>

<section className={"flex flex-col gap-md md:flex-row md:justify-between md:items-end"}>
<div>
<h2 className={"font-headline-xl-mobile md:font-headline-xl text-on-surface"}>تحليلات المبيعات</h2>
<p className={"font-body-md text-on-surface-variant mt-1"}>نظرة عامة على أداء متجرك</p>
</div>

<div className={"flex gap-sm overflow-x-auto hide-scrollbar pb-1"}>
<button className={"px-4 py-2 rounded-full font-label-lg text-label-lg bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors whitespace-nowrap shadow-sm"}>اليوم</button>
<button className={"px-4 py-2 rounded-full font-label-lg text-label-lg bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors whitespace-nowrap shadow-sm"}>هذا الأسبوع</button>
<button className={"px-4 py-2 rounded-full font-label-lg text-label-lg bg-primary-container text-on-primary-container font-bold whitespace-nowrap shadow-sm"}>هذا الشهر</button>
<button className={"px-4 py-2 rounded-full font-label-lg text-label-lg bg-surface border border-outline-variant text-on-surface-variant hover:bg-surface-variant transition-colors whitespace-nowrap shadow-sm"}>هذا العام</button>
</div>
</section>

<section className={"grid grid-cols-1 md:grid-cols-3 gap-md"}>

<div className={"bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant shadow-[0_4px_8px_rgba(94,60,26,0.04)] relative overflow-hidden group hover:shadow-[0_8px_16px_rgba(94,60,26,0.08)] transition-all"}>
<div className={"absolute top-0 right-0 w-24 h-24 bg-primary-container/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"}></div>
<div className={"relative z-10 flex justify-between items-start"}>
<div>
<p className={"font-body-md text-on-surface-variant"}>إجمالي الإيرادات</p>
<h3 className={"font-headline-xl-mobile md:font-headline-xl text-primary mt-2"}>12,450 د.ك</h3>
</div>
<div className={"p-2 bg-primary-container rounded-lg text-on-primary-container"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
</div>
</div>
<div className={"mt-4 flex items-center text-primary font-label-lg text-label-lg bg-primary/10 w-fit px-2 py-1 rounded-md"}>
<span className={"material-symbols-outlined text-sm mr-1"}>trending_up</span>
<span dir={"ltr"}>+15.3%</span>
</div>
</div>

<div className={"bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant shadow-[0_4px_8px_rgba(94,60,26,0.04)] relative overflow-hidden group hover:shadow-[0_8px_16px_rgba(94,60,26,0.08)] transition-all"}>
<div className={"absolute top-0 right-0 w-24 h-24 bg-tertiary-container/20 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"}></div>
<div className={"relative z-10 flex justify-between items-start"}>
<div>
<p className={"font-body-md text-on-surface-variant"}>الطلبات المكتملة</p>
<h3 className={"font-headline-xl-mobile md:font-headline-xl text-on-surface mt-2"}>842</h3>
</div>
<div className={"p-2 bg-surface-container-high rounded-lg text-on-surface"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>local_mall</span>
</div>
</div>
<div className={"mt-4 flex items-center text-primary font-label-lg text-label-lg bg-primary/10 w-fit px-2 py-1 rounded-md"}>
<span className={"material-symbols-outlined text-sm mr-1"}>trending_up</span>
<span dir={"ltr"}>+8.1%</span>
</div>
</div>

<div className={"bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant shadow-[0_4px_8px_rgba(94,60,26,0.04)] relative overflow-hidden group hover:shadow-[0_8px_16px_rgba(94,60,26,0.08)] transition-all"}>
<div className={"absolute top-0 right-0 w-24 h-24 bg-surface-variant/50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"}></div>
<div className={"relative z-10 flex justify-between items-start"}>
<div>
<p className={"font-body-md text-on-surface-variant"}>متوسط قيمة الطلب</p>
<h3 className={"font-headline-xl-mobile md:font-headline-xl text-on-surface mt-2"}>14.7 د.ك</h3>
</div>
<div className={"p-2 bg-surface-container-high rounded-lg text-on-surface"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>point_of_sale</span>
</div>
</div>
<div className={"mt-4 flex items-center text-on-surface-variant font-label-lg text-label-lg bg-surface-variant/50 w-fit px-2 py-1 rounded-md"}>
<span className={"material-symbols-outlined text-sm mr-1"}>trending_flat</span>
<span dir={"ltr"}>-0.5%</span>
</div>
</div>
</section>

<section className={"bg-surface-container-lowest rounded-2xl p-lg border border-outline-variant shadow-[0_4px_8px_rgba(94,60,26,0.04)]"}>
<div className={"flex justify-between items-center mb-6"}>
<h3 className={"font-headline-md text-on-surface"}>اتجاهات المبيعات</h3>
<button className={"p-2 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors"}>
<span className={"material-symbols-outlined"}>more_horiz</span>
</button>
</div>
<div className={"w-full relative"}>
<canvas id={"salesChart"}></canvas>
</div>
</section>

<section>
<h3 className={"font-headline-md text-on-surface mb-md"}>المنتجات الأكثر مبيعاً</h3>
<div className={"bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-[0_4px_8px_rgba(94,60,26,0.04)]"}>

<div className={"flex items-center p-md border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors group cursor-pointer"}>
<div className={"w-16 h-16 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0 relative"}>
<img alt={"Product Image"} className={"w-full h-full object-cover"} data-alt={"A high-quality studio photograph of a bundle of fresh, bright green mint leaves resting on a clean white surface. Soft, natural lighting highlighting the texture of the leaves. The aesthetic is clean, appetizing, and modern, fitting for a premium grocery delivery app."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuA47JImNT5dNxoyzLhV3ctuzAzwqQg307A7QQ5ufWPQp1plnxSC_B_X8NLfDScuyCTYGOA5Co0Hh6fURKIktQK-87-DkzHDjSBJNQkqeHLQnLB9fUqGy-IlMPg2c0C79b78yEOGiBMFk-t922X1Zi--WE0ghH1YG_CirlYv1Ufr5h_aAU4s71uzY5vjd3zJ_r-K7zVnQAXxUwmUW3aMDYRCJUCjBnlE3fW_A5l1ktdl8ROO5HWRZQT5"} />
<div className={"absolute top-1 right-1 bg-surface-container-lowest/80 rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs text-primary shadow-sm backdrop-blur-sm"}>1</div>
</div>
<div className={"ml-auto mr-4 flex-grow"}>
<h4 className={"font-body-lg text-on-surface font-semibold group-hover:text-primary transition-colors"}>نعناع طازج حزمة</h4>
<p className={"font-label-md text-on-surface-variant"}>الخضروات الورقية</p>
</div>
<div className={"text-left flex flex-col items-end"}>
<span className={"font-body-lg text-on-surface font-bold"}>420 د.ك</span>
<span className={"font-label-md text-primary flex items-center gap-1"}><span className={"material-symbols-outlined text-[14px]"}>shopping_cart</span> 210 طلب</span>
</div>
</div>

<div className={"flex items-center p-md border-b border-outline-variant/50 hover:bg-surface-container-low transition-colors group cursor-pointer"}>
<div className={"w-16 h-16 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0 relative"}>
<img alt={"Product Image"} className={"w-full h-full object-cover"} data-alt={"A high-quality studio photograph of a crusty artisanal sourdough bread loaf on a clean white background. Warm, appetizing lighting highlighting the golden crust. The aesthetic is clean, premium, and modern, fitting for a local bakery delivery app."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBfJTZfcOr_Qbmwv9fuivKbgbbvxsZhgZLaNaEnpOAn1vXhXiQW5_zM7JzhPmD0fp75LC9oTZ_zDrkFyxBFTLgcXdTICEbKLI2mzXJA-WcaW1Ulg1FydCXw-gdqOf-argO53HwlDwOqr8Fwa24uTO1jDJnwavhsD6KYeWm3lsVdTAR6L_GB86wI9bmXZSD-QO8bNibgcnCmWJsMxUUi8BK4_HNXV9g18l0pTpJvj0fXxbgcvpjR-TAn"} />
<div className={"absolute top-1 right-1 bg-surface-container-lowest/80 rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs text-on-surface shadow-sm backdrop-blur-sm"}>2</div>
</div>
<div className={"ml-auto mr-4 flex-grow"}>
<h4 className={"font-body-lg text-on-surface font-semibold group-hover:text-primary transition-colors"}>خبز أسمر طازج</h4>
<p className={"font-label-md text-on-surface-variant"}>المخبوزات</p>
</div>
<div className={"text-left flex flex-col items-end"}>
<span className={"font-body-lg text-on-surface font-bold"}>385 د.ك</span>
<span className={"font-label-md text-primary flex items-center gap-1"}><span className={"material-symbols-outlined text-[14px]"}>shopping_cart</span> 154 طلب</span>
</div>
</div>

<div className={"flex items-center p-md hover:bg-surface-container-low transition-colors group cursor-pointer"}>
<div className={"w-16 h-16 rounded-xl overflow-hidden bg-surface-variant flex-shrink-0 relative"}>
<img alt={"Product Image"} className={"w-full h-full object-cover"} data-alt={"A high-quality studio photograph of bright red, plump tomatoes clustered together on a clean white surface. Soft, natural lighting. The aesthetic is clean, fresh, and modern, fitting for a premium local produce delivery app."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAFM6NaBk1oYsHon-0McEBqCGSfyQqE9tlgTDdxEjDUQlrahClaaCm1LgYhXkxh5V2x6OYQhwNIxePgwud3baxKt8oCUaKRHTr60clv6UewJunU-hOaKQb31bS8UEiS5q7agfph1F-BwkaWG8vYyXcy1dPXUFWx5_Hy6MFUtelIilSUqxCLPvxYPKJ9VCQ9jCirsVMq6-ehHs4J2Scd3w0Iwk7xuF3j_l-J1FWkpy7Jtj77lqqH2R_Q"} />
<div className={"absolute top-1 right-1 bg-surface-container-lowest/80 rounded-full w-5 h-5 flex items-center justify-center font-bold text-xs text-on-surface shadow-sm backdrop-blur-sm"}>3</div>
</div>
<div className={"ml-auto mr-4 flex-grow"}>
<h4 className={"font-body-lg text-on-surface font-semibold group-hover:text-primary transition-colors"}>طماطم كرزية عضوية</h4>
<p className={"font-label-md text-on-surface-variant"}>الخضراوات</p>
</div>
<div className={"text-left flex flex-col items-end"}>
<span className={"font-body-lg text-on-surface font-bold"}>290 د.ك</span>
<span className={"font-label-md text-primary flex items-center gap-1"}><span className={"material-symbols-outlined text-[14px]"}>shopping_cart</span> 120 طلب</span>
</div>
</div>
</div>
<button className={"w-full mt-4 py-3 border-2 border-primary text-primary font-label-lg rounded-xl hover:bg-primary/5 transition-colors"}>
                عرض كل المنتجات
            </button>
</section>

<div className={"h-6"}></div>
</main>

<nav className={"md:hidden fixed bottom-0 w-full z-50 rounded-t-xl border-t border-outline-variant dark:border-outline bg-surface dark:bg-surface-container-lowest shadow-lg"}>
<div className={"flex justify-around items-center h-20 pb-safe px-2"}>

<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>home</span>
<span className={"font-label-md text-label-md"}>الرئيسية</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>receipt_long</span>
<span className={"font-label-md text-label-md"}>الطلبات</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>inventory_2</span>
<span className={"font-label-md text-label-md"}>المنتجات</span>
</a>

<a className={"flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-3 py-1 scale-90 transition-transform duration-150"} href={"#"}>
<span className={"material-symbols-outlined mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
<span className={"font-label-md text-label-md font-bold"}>التحليلات</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-surface-variant px-3 py-1 hover:bg-surface-variant/50 rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>menu</span>
<span className={"font-label-md text-label-md"}>المزيد</span>
</a>
</div>
</nav>



    </ScreenFrame>
  );
}
