import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/my-orders")({
  head: () => ({
    meta: [
      { title: "\u0637\u0644\u0628\u0627\u062a\u064a - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0637\u0644\u0628\u0627\u062a\u064a - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0637\u0644\u0628\u0627\u062a\u064a - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0637\u0644\u0628\u0627\u062a\u064a - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenMyOrders,
});

function ScreenMyOrders() {
  return (
    <ScreenFrame slug="my-orders" title="\u0637\u0644\u0628\u0627\u062a\u064a - Tasweeqet Betak" bodyClassName="bg-background text-on-background min-h-screen pb-24 md:pb-0 md:pr-72 font-body-md">
      

<header className={"bg-surface dark:bg-surface-dim docked full-width top-0 sticky z-50 flat no shadows flex flex-row-reverse justify-between items-center px-margin-mobile w-full backdrop-blur-md md:hidden"}>
<button className={"p-2 text-primary dark:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors rounded-full"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 0" }}>notifications</span>
</button>
<h1 className={"font-headline-lg-mobile text-headline-lg-mobile font-bold text-secondary dark:text-secondary-fixed-dim"}>Tasweeqet Betak</h1>
<button className={"p-2 text-primary dark:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors rounded-full"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
</button>
</header>

<nav className={"bg-surface-container-low dark:bg-surface-dim h-full w-72 flex-col flat no shadows hidden lg:flex flex-col p-md h-screen fixed right-0 top-0 border-l border-outline-variant dark:border-outline"}>
<div className={"flex flex-col items-end mb-lg w-full text-right"}>
<div className={"flex items-center gap-4 mb-4 flex-row-reverse"}>
<img className={"w-16 h-16 rounded-full object-cover border-2 border-primary-container"} data-alt={"A professional circular avatar portrait of a friendly local market merchant in a bright, modern setting. They are wearing a casual apron. The background is slightly blurred with soft, warm lighting. The color palette emphasizes rich earthy browns and vibrant yellows, consistent with a clean, high-end UI design."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCwZ5rZItmEIJnSC2Itlicb-9bBiNOwcZrJeQE3eBJjA0BVNERHBF1WO7TsAlDVnTz4wMMVDwvIsWaMAlsHD2bF5yQteefPEFoolDoIODMI1OAnKLew2xxD22U9Nwzk8-Z9nO0NnO-XYI4wHZ1hlFqV8b7j2YaFRWCxboEda8F_nEBQR3nvoPyI5BzhNxEzt8RlRcZbZxZxqGwdFUA8vfz2fyzYm0SgU-V68WvLLImN12WvRSYnT_iV"} />
<div>
<h2 className={"font-headline-md text-headline-md font-bold text-primary dark:text-primary-fixed-dim"}>متجر التوفير</h2>
<p className={"font-label-lg text-label-lg text-on-surface-variant dark:text-outline"}>تاجر معتمد</p>
</div>
</div>
<h1 className={"font-headline-xl text-headline-xl text-secondary mb-lg"}>Tasweeqet Betak</h1>
</div>
<ul className={"flex flex-col gap-2 w-full"}>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high hover:bg-primary-container/20 transition-all duration-200 font-label-lg text-label-lg"} href={"#"}>
<span className={"material-symbols-outlined"}>dashboard</span>
                    لوحة التحكم
                </a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 rounded-lg bg-secondary text-on-secondary rounded-lg font-bold hover:bg-primary-container/20 transition-all duration-200 font-label-lg text-label-lg Click: brightness-95"} href={"#"}>
<span className={"material-symbols-outlined"}>shopping_bag</span>
                    الطلبات
                </a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high hover:bg-primary-container/20 transition-all duration-200 font-label-lg text-label-lg"} href={"#"}>
<span className={"material-symbols-outlined"}>inventory_2</span>
                    المنتجات
                </a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high hover:bg-primary-container/20 transition-all duration-200 font-label-lg text-label-lg"} href={"#"}>
<span className={"material-symbols-outlined"}>analytics</span>
                    التحليلات
                </a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high hover:bg-primary-container/20 transition-all duration-200 font-label-lg text-label-lg"} href={"#"}>
<span className={"material-symbols-outlined"}>settings</span>
                    الإعدادات
                </a>
</li>
</ul>
</nav>

<main className={"max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop py-lg"}>
<header className={"mb-xl text-center md:text-right"}>
<h2 className={"font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-background mb-sm"}>طلباتي</h2>
<p className={"font-body-md text-body-md text-on-surface-variant"}>تتبع وإدارة جميع طلباتك السابقة والحالية.</p>
</header>

<div className={"flex border-b border-surface-container-high mb-xl"}>
<button className={"flex-1 pb-md font-headline-md text-headline-md text-primary border-b-2 border-primary-container text-center transition-colors"}>
                الطلبات الحالية
            </button>
<button className={"flex-1 pb-md font-headline-md text-headline-md text-on-surface-variant border-b-2 border-transparent hover:text-primary text-center transition-colors"}>
                الطلبات السابقة
            </button>
</div>

<div className={"grid grid-cols-1 md:grid-cols-2 gap-gutter"}>

<article className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md transition-all duration-200 card-hover flex flex-col gap-md"}>
<div className={"flex justify-between items-start"}>
<div className={"bg-primary-container/20 text-on-tertiary-fixed font-label-lg text-label-lg px-3 py-1 rounded-full flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>local_shipping</span>
                        قيد التوصيل
                    </div>
<div className={"flex items-center gap-3 flex-row-reverse"}>
<div className={"text-right"}>
<h3 className={"font-headline-md text-headline-md text-on-background"}>سوبر ماركت الهدى</h3>
<p className={"font-label-md text-label-md text-on-surface-variant"}>طلب #8472 • اليوم، 2:30 م</p>
</div>
<img className={"w-12 h-12 rounded-lg object-cover border border-outline-variant"} data-alt={"A vibrant, clean logo of a local neighborhood grocery store named 'Al Huda Supermarket', featuring fresh produce icons in bright green and yellow, set against a pristine white background. The image has a crisp, modern aesthetic suitable for a high-end e-commerce UI."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAlgSFDfPb98S-2nmjSyWDdIfwFV8-nae1ozO5IsGHHycZFEF2akLJEZLjNdOER5sEz8qctLHdNAiUlWjXqvCb6xo3TYwtr7qcC3KalDNo-0At8P76R0JxtJ3ELSdxe_-CljSJnB58wJtWIVNXg4pCWJmsfWnAdpbs1EAmO-bwvgPaOP_amOD2PB083kD5Muwm5eApLuR3dTwP8k0rnWTnknEAy3HrSMA5Uwp3101PIRQzEK1GH_2DD"} />
</div>
</div>
<div className={"bg-surface-container-low rounded-lg p-sm flex justify-between items-center mt-sm"}>
<span className={"font-headline-md text-headline-md text-secondary"}>145.50 ر.س</span>
<span className={"font-body-md text-body-md text-on-surface-variant"}>5 عناصر</span>
</div>
<div className={"flex gap-sm mt-auto pt-sm border-t border-surface-container-high"}>
<button className={"flex-1 bg-primary-container text-on-tertiary-fixed font-label-lg text-label-lg py-2 rounded-lg hover:bg-primary-fixed transition-colors"}>
                        تتبع الطلب
                    </button>
<button className={"flex-1 bg-surface-container-lowest border border-secondary text-secondary font-label-lg text-label-lg py-2 rounded-lg hover:bg-surface-container-low transition-colors"}>
                        تفاصيل
                    </button>
</div>
</article>

<article className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md transition-all duration-200 card-hover flex flex-col gap-md"}>
<div className={"flex justify-between items-start"}>
<div className={"bg-secondary-container/30 text-on-secondary-fixed font-label-lg text-label-lg px-3 py-1 rounded-full flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>schedule</span>
                        قيد التجهيز
                    </div>
<div className={"flex items-center gap-3 flex-row-reverse"}>
<div className={"text-right"}>
<h3 className={"font-headline-md text-headline-md text-on-background"}>مخبز الأمل</h3>
<p className={"font-label-md text-label-md text-on-surface-variant"}>طلب #8475 • اليوم، 3:15 م</p>
</div>
<img className={"w-12 h-12 rounded-lg object-cover border border-outline-variant"} data-alt={"A warm, inviting logo of a local bakery named 'Al Amal Bakery', featuring a stylized golden croissant on a soft cream background. The design is modern, appetizing, and fits a premium delivery app interface. The colors focus on warm browns and rich yellows."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBrhQBatdo5awa6JCYghtj9tHktXm4Fah_lbR_xfTWNL9mg7CNXW5rs08GTzOGfXfo7VL5sDhLEvb7QmkuKwtEI7JgM2F9ZwwsGTjGs_UaYy-1hhJTmiGWDsFxw0YYSYOIGiyWlGSOVzjkKItYeCoz5J8N0JxfrOmKuERsH4qnHO1LOP3LpiW_nZn7JoMCHZ0Wmk1tZUelbKvm2YYIedzGKiCPvF31RmVCYJw8w4ciynIJyZdvCjTm9"} />
</div>
</div>
<div className={"bg-surface-container-low rounded-lg p-sm flex justify-between items-center mt-sm"}>
<span className={"font-headline-md text-headline-md text-secondary"}>32.00 ر.س</span>
<span className={"font-body-md text-body-md text-on-surface-variant"}>2 عناصر</span>
</div>
<div className={"flex gap-sm mt-auto pt-sm border-t border-surface-container-high"}>
<button className={"flex-1 bg-primary-container text-on-tertiary-fixed font-label-lg text-label-lg py-2 rounded-lg hover:bg-primary-fixed transition-colors opacity-50 cursor-not-allowed"}>
                        تتبع الطلب
                    </button>
<button className={"flex-1 bg-surface-container-lowest border border-secondary text-secondary font-label-lg text-label-lg py-2 rounded-lg hover:bg-surface-container-low transition-colors"}>
                        تفاصيل
                    </button>
</div>
</article>

<article className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md transition-all duration-200 card-hover flex flex-col gap-md md:col-span-2"}>
<div className={"flex justify-between items-start"}>
<div className={"bg-surface-variant text-on-surface font-label-lg text-label-lg px-3 py-1 rounded-full flex items-center gap-1"}>
<span className={"material-symbols-outlined text-sm"}>check_circle</span>
                        تم الاستلام
                    </div>
<div className={"flex items-center gap-3 flex-row-reverse"}>
<div className={"text-right"}>
<h3 className={"font-headline-md text-headline-md text-on-background"}>صيدلية النهدي</h3>
<p className={"font-label-md text-label-md text-on-surface-variant"}>طلب #8460 • أمس، 8:00 م</p>
</div>
<img className={"w-12 h-12 rounded-lg object-cover border border-outline-variant"} data-alt={"A clean, professional logo for a pharmacy, featuring a modern health cross symbol in subtle, calming tones on a white background, designed for a sleek local commerce UI."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCtEzS8pugxmA8PYQ0iAyaSsh1H7vhrb2kOUsw0NztVt00CrGtbz9ybus8LWhjTEvQUxmzWET4piOhfg1s5B6bn9iQJKQrpIzPo8JJwKcatdTPO1cbyAa422ssTYBmcEnVTghasbOkTJyuewfwykez1TKVkVhF-EWzkswwRVso7Bi4tLYkWA7t7ajpGOMQbMCVadbo7SoN1H64EYyR_k51B9yRQjFk17CRG90C4KNjIAQrTBO8Dfhn0"} />
</div>
</div>
<div className={"bg-surface-container-low rounded-lg p-sm flex justify-between items-center mt-sm"}>
<span className={"font-headline-md text-headline-md text-secondary"}>85.00 ر.س</span>
<span className={"font-body-md text-body-md text-on-surface-variant"}>1 عنصر</span>
</div>
<div className={"flex gap-sm mt-auto pt-sm border-t border-surface-container-high"}>
<button className={"flex-1 bg-surface-container-lowest border border-secondary text-secondary font-label-lg text-label-lg py-2 rounded-lg hover:bg-surface-container-low transition-colors"}>
                        إعادة الطلب
                    </button>
<button className={"flex-1 bg-surface-container-lowest border border-transparent text-secondary font-label-lg text-label-lg py-2 rounded-lg hover:bg-surface-container-low transition-colors"}>
                        تقييم
                    </button>
</div>
</article>
</div>
</main>

<nav className={"bg-surface dark:bg-surface-dim docked full-width bottom-0 fixed z-50 flat no shadows flex flex-row-reverse justify-around items-center w-full pb-safe pt-2 px-2 border-t border-outline-variant dark:border-outline md:hidden"}>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest"} href={"#"}>
<span className={"material-symbols-outlined"}>home</span>
<span className={"font-label-md text-label-md mt-1"}>الرئيسية</span>
</a>
<a className={"flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-4 py-1 hover:bg-surface-container-high dark:hover:bg-surface-container-highest Active: scale-95 transition-transform duration-200"} href={"#"}>
<span className={"material-symbols-outlined"}>receipt_long</span>
<span className={"font-label-md text-label-md mt-1"}>طلباتي</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest"} href={"#"}>
<span className={"material-symbols-outlined"}>local_offer</span>
<span className={"font-label-md text-label-md mt-1"}>العروض</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest"} href={"#"}>
<span className={"material-symbols-outlined"}>person</span>
<span className={"font-label-md text-label-md mt-1"}>حسابي</span>
</a>
</nav>

    </ScreenFrame>
  );
}
