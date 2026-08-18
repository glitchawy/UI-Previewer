import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/merchant-orders-management")({
  head: () => ({
    meta: [
      { title: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenMerchantOrdersManagement,
});

function ScreenMerchantOrdersManagement() {
  return (
    <ScreenFrame slug="merchant-orders-management" title="\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643" bodyClassName="bg-background text-on-background antialiased pb-[100px] pt-[120px]">
      

<header className={"fixed top-0 w-full z-50 bg-surface/80 backdrop-blur-md border-b border-outline-variant flex justify-between items-center h-16 px-margin-mobile"}>
<div className={"flex items-center gap-sm"}>
<div className={"w-8 h-8 rounded-full overflow-hidden bg-surface-container-high border border-outline-variant flex items-center justify-center"}>
<img alt={"Store Logo"} className={"w-full h-full object-cover"} data-alt={"A small, stylized circular logo for a local grocery store or delivery service, featuring warm tones of yellow and brown. The design is modern, clean, and appetizing, set against a light cream background."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCa_1MSFhUUqXktBzStoonrXTVxqOLs_5gTbSzewBc2hBDe_JewcHIPmU91LrtW4jrYB6HaVgvIx8sxb020VNpW6GpflcreA4fpf9woFv4jFp_lgP_cF4I55sqiLXGL-O8pCaHFtcvHISIqdDqHcKovd8dL7iN3U2GEFObZi24MB53cswcFx_cmLrNzbdoNUEUCj-qQJiR0e2TY9M1lvxaQg6CKwO92B7lXmxEP-q9zdt6ssoZPt2Ha"} />
</div>
<h1 className={"font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary"}>تسويقة بيتك</h1>
</div>
<div>
<span className={"font-label-lg text-label-lg text-primary px-3 py-1 rounded-full bg-primary-container/20"}>مفتوح</span>
</div>
</header>

<div className={"fixed top-16 w-full z-40 bg-surface/95 backdrop-blur-sm border-b border-surface-container-high"}>
<div className={"flex overflow-x-auto no-scrollbar px-margin-mobile py-sm gap-md"}>

<button className={"whitespace-nowrap px-4 py-2 rounded-full bg-secondary text-on-secondary font-label-lg text-label-lg flex items-center gap-2"}>
                الجديدة
                <span className={"bg-primary-container text-on-primary-container text-xs px-2 py-0.5 rounded-full font-bold"}>2</span>
</button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 font-label-lg text-label-lg transition-colors"}>
                المقبولة
            </button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 font-label-lg text-label-lg transition-colors"}>
                قيد التجهيز
            </button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 font-label-lg text-label-lg transition-colors"}>
                جاهزة
            </button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 font-label-lg text-label-lg transition-colors"}>
                مكتملة
            </button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full border border-outline-variant text-on-surface-variant hover:bg-surface-variant/50 font-label-lg text-label-lg transition-colors"}>
                ملغاة
            </button>
</div>
</div>

<main className={"px-margin-mobile max-w-3xl mx-auto space-y-md"}>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-card p-4 card-shadow-hover"}>
<div className={"flex justify-between items-start mb-3 border-b border-surface-container-highest pb-3"}>
<div>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>طلب #8932</h2>
<p className={"font-body-md text-body-md text-on-surface-variant mt-1"}>العميل: أحمد م.</p>
</div>
<div className={"text-left"}>
<span className={"font-headline-md text-headline-md text-secondary block"}>145 ر.س</span>
<span className={"font-body-md text-body-md text-on-surface-variant text-sm flex items-center gap-1 mt-1 justify-end"}>
<span className={"material-symbols-outlined text-[16px]"}>schedule</span> 2:30 م
                    </span>
</div>
</div>
<div className={"mb-4"}>
<p className={"font-body-md text-body-md text-on-surface flex items-center gap-2"}>
<span className={"material-symbols-outlined text-primary"}>shopping_bag</span>
                    3 عناصر
                </p>

<div className={"text-sm text-on-surface-variant mt-2 pr-8"}>
                    1x حليب طازج المراعي، 2x خبز أبيض، ...
                </div>
</div>
<div className={"flex gap-sm pt-2"}>
<button className={"flex-1 bg-secondary text-on-secondary font-label-lg text-label-lg py-3 rounded-[12px] font-bold hover:opacity-90 transition-opacity"}>
                    قبول الطلب
                </button>
<button className={"flex-1 bg-surface-container-lowest border-2 border-error text-error font-label-lg text-label-lg py-3 rounded-[12px] hover:bg-error-container transition-colors"}>
                    رفض
                </button>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-card p-4 card-shadow-hover"}>
<div className={"flex justify-between items-start mb-3 border-b border-surface-container-highest pb-3"}>
<div>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>طلب #8933</h2>
<p className={"font-body-md text-body-md text-on-surface-variant mt-1"}>العميل: سارة خ.</p>
</div>
<div className={"text-left"}>
<span className={"font-headline-md text-headline-md text-secondary block"}>89 ر.س</span>
<span className={"font-body-md text-body-md text-on-surface-variant text-sm flex items-center gap-1 mt-1 justify-end"}>
<span className={"material-symbols-outlined text-[16px]"}>schedule</span> 2:45 م
                    </span>
</div>
</div>
<div className={"mb-4"}>
<p className={"font-body-md text-body-md text-on-surface flex items-center gap-2"}>
<span className={"material-symbols-outlined text-primary"}>shopping_bag</span>
                    5 عناصر
                </p>

<div className={"text-sm text-on-surface-variant mt-2 pr-8"}>
                    1x دجاج الوطنية، 1x طماطم (كيلو)، 3x بيبسي...
                </div>
</div>
<div className={"flex gap-sm pt-2"}>
<button className={"flex-1 bg-secondary text-on-secondary font-label-lg text-label-lg py-3 rounded-[12px] font-bold hover:opacity-90 transition-opacity"}>
                    قبول الطلب
                </button>
<button className={"flex-1 bg-surface-container-lowest border-2 border-error text-error font-label-lg text-label-lg py-3 rounded-[12px] hover:bg-error-container transition-colors"}>
                    رفض
                </button>
</div>
</div>
</main>

<nav className={"md:hidden fixed bottom-0 w-full z-50 rounded-t-xl border-t border-outline-variant bg-surface-container-lowest shadow-lg flex justify-around items-center h-20 pb-[env(safe-area-inset-bottom)] px-2"}>

<a className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>home</span>
<span className={"font-label-md text-label-md"}>الرئيسية</span>
</a>

<a className={"flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-3 py-1 scale-90 transition-transform duration-150 shadow-sm"} href={"#"}>
<span className={"material-symbols-outlined mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>receipt_long</span>
<span className={"font-label-md text-label-md font-bold"}>الطلبات</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>inventory_2</span>
<span className={"font-label-md text-label-md"}>المنتجات</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>analytics</span>
<span className={"font-label-md text-label-md"}>التحليلات</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant px-3 py-1 hover:bg-surface-variant/50 transition-colors rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>menu</span>
<span className={"font-label-md text-label-md"}>المزيد</span>
</a>
</nav>

    </ScreenFrame>
  );
}
