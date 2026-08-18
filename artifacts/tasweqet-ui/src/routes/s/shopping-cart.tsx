import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/shopping-cart")({
  head: () => ({
    meta: [
      { title: "\u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenShoppingCart,
});

function ScreenShoppingCart() {
  return (
    <ScreenFrame slug="shopping-cart" title="\u0633\u0644\u0629 \u0627\u0644\u0645\u0634\u062a\u0631\u064a\u0627\u062a - \u062a\u0633\u0648\u064a\u0642\u0629 \u0628\u064a\u062a\u0643" bodyClassName="bg-background text-on-background min-h-screen flex flex-col font-body-md">
      

<header className={"bg-surface dark:bg-surface-dim docked full-width top-0 sticky z-50 border-b border-outline-variant dark:border-outline flat no shadows flex flex-row-reverse justify-between items-center px-margin-mobile md:px-margin-desktop w-full backdrop-blur-md h-16"}>
<div className={"flex items-center"}>
<span className={"material-symbols-outlined text-primary dark:text-primary-fixed-dim"} data-icon={"notifications"}>notifications</span>
</div>
<h1 className={"font-headline-lg-mobile text-headline-lg-mobile md:font-headline-lg md:text-headline-lg font-bold text-secondary dark:text-secondary-fixed-dim"}>Tasweeqet Betak</h1>
<div className={"flex items-center"}>
<span className={"material-symbols-outlined text-primary dark:text-primary-fixed-dim"} data-icon={"location_on"}>location_on</span>
</div>
</header>
<main className={"flex-grow container mx-auto px-margin-mobile md:px-margin-desktop py-lg grid grid-cols-1 md:grid-cols-12 gap-gutter max-w-7xl"}>

<section className={"md:col-span-8 flex flex-col gap-md"}>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>سلة المشتريات</h2>
<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex items-center justify-between"}>
<div className={"flex items-center gap-sm"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"storefront"}>storefront</span>
<span className={"font-label-lg text-label-lg text-on-surface"}>برجر هاوس</span>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex gap-md items-center hover:bg-surface-container-low transition-colors group relative overflow-hidden"}>
<div className={"w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant"}>
<img className={"w-full h-full object-cover"} data-alt={"A mouth-watering, high-resolution photo of a classic cheeseburger with fresh lettuce, tomato, and melting yellow cheese on a toasted sesame seed bun. The image is brightly lit, showcasing the appetizing textures in a warm, appetizing light-mode setting. Designed for a local commerce food delivery app."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuB4TYBXjvun_xikoZrrC3OW0q6Ou0uVq1mS-8FTa-uWB9erWgyJ9zD-gBZTkfbcxfGA3fyp90uUirne_-9eUYIHUgJIGbJHzRf5W8_ezXaGJ4MPkk2kFu-JqN2aTynpb3DrnPu_9Lr85w2NsRwYEcYCtWf2fS-FKi-sZ-Xkkhu7S0plPSVwG9STY4z82VXMQN0rc45d_fxNpRRpYLlQhyBViRApJNncmSRpDRxBvWbYXVGidrXvCCNE"} />
</div>
<div className={"flex-grow flex flex-col justify-between h-full py-1"}>
<div>
<h3 className={"font-headline-md text-headline-md text-on-surface line-clamp-1"}>برجر كلاسيك بالجبنة</h3>
<p className={"font-body-md text-body-md text-on-surface-variant line-clamp-1"}>شريحة لحم بقري، جبنة، خس، طماطم، صوص خاص</p>
</div>
<div className={"font-headline-md text-headline-md font-bold text-on-surface"}>25.00 ر.س</div>
</div>
<div className={"flex flex-col items-center justify-between h-full bg-surface-container rounded-lg p-1"}>
<button className={"w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add"}>add</span>
</button>
<span className={"font-label-lg text-label-lg font-bold text-on-surface"}>2</span>
<button className={"w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"remove"}>remove</span>
</button>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-md flex gap-md items-center hover:bg-surface-container-low transition-colors group relative overflow-hidden"}>
<div className={"w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 border border-outline-variant"}>
<img className={"w-full h-full object-cover"} data-alt={"A crisp, high-resolution photo of golden french fries in a red cardboard container. The fries are perfectly crispy and seasoned, photographed on a bright, minimalist surface. The lighting is warm and appetizing, fitting a modern food delivery interface."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuB9BFyso1qSivYVERXfAzx56cq1UzVNPwKdRA7Oegd5cb-lG8BkIRGD9G-_lH1N32_gaXbTJlnTR4WgezJeGcD7UsaojDJHKprF25CzrTgo4pTiLEgp_qEgTw_1gpCrY1AFILEwyupnMJHJbuHo_arcbUz4hYU0bswIEaH495gYnYRC2XAnMtgVG65-qivVCyewCfqQkYFJvHmrupX7OQ8gXScyYaBCcIoUNHKg7EdKPXJl3lJtqjUF"} />
</div>
<div className={"flex-grow flex flex-col justify-between h-full py-1"}>
<div>
<h3 className={"font-headline-md text-headline-md text-on-surface line-clamp-1"}>بطاطس مقلية حجم كبير</h3>
<p className={"font-body-md text-body-md text-on-surface-variant line-clamp-1"}>بطاطس مقرمشة مع توابل خاصة</p>
</div>
<div className={"font-headline-md text-headline-md font-bold text-on-surface"}>12.00 ر.س</div>
</div>
<div className={"flex flex-col items-center justify-between h-full bg-surface-container rounded-lg p-1"}>
<button className={"w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add"}>add</span>
</button>
<span className={"font-label-lg text-label-lg font-bold text-on-surface"}>1</span>
<button className={"w-8 h-8 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"remove"}>remove</span>
</button>
</div>
</div>
<button className={"flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-outline-variant text-on-surface font-label-lg text-label-lg hover:bg-surface-container transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add_circle"}>add_circle</span>
                إضافة المزيد من العناصر
            </button>
</section>

<section className={"md:col-span-4 h-fit sticky top-24"}>
<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl p-lg flex flex-col gap-md"}>
<h3 className={"font-headline-md text-headline-md text-on-surface border-b border-outline-variant pb-sm"}>ملخص الطلب</h3>
<div className={"flex flex-col gap-sm"}>
<div className={"flex justify-between items-center text-on-surface-variant font-body-md text-body-md"}>
<span>المجموع الفرعي</span>
<span>62.00 ر.س</span>
</div>
<div className={"flex justify-between items-center text-on-surface-variant font-body-md text-body-md"}>
<span>رسوم التوصيل</span>
<span>15.00 ر.س</span>
</div>
<div className={"flex justify-between items-center text-on-surface-variant font-body-md text-body-md"}>
<span>رسوم الخدمة</span>
<span>3.10 ر.س</span>
</div>
</div>
<div className={"border-t border-outline-variant pt-md flex justify-between items-center"}>
<span className={"font-headline-md text-headline-md font-bold text-on-surface"}>الإجمالي</span>
<span className={"font-headline-xl-mobile text-headline-xl-mobile md:font-headline-xl md:text-headline-xl font-bold text-secondary"}>80.10 ر.س</span>
</div>
<button className={"w-full bg-primary-container text-on-primary-container font-headline-md text-headline-md font-bold py-3 rounded-xl hover:bg-primary-fixed transition-colors mt-4"}>
                    تأكيد الطلب
                </button>
<button className={"w-full text-secondary font-label-lg text-label-lg py-2 rounded-xl hover:bg-surface-container-low transition-colors"}>
                    إلغاء الطلب
                </button>
</div>
</section>
</main>

<nav className={"md:hidden bg-surface dark:bg-surface-dim docked full-width bottom-0 fixed z-50 border-t border-outline-variant dark:border-outline flat no shadows flex flex-row-reverse justify-around items-center w-full pb-safe pt-2 px-2"}>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"home"}>home</span>
<span className={"font-label-md text-label-md mt-1"}>الرئيسية</span>
</a>
<a className={"flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-4 py-1 scale-95 transition-transform duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"receipt_long"}>receipt_long</span>
<span className={"font-label-md text-label-md mt-1"}>طلباتي</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"local_offer"}>local_offer</span>
<span className={"font-label-md text-label-md mt-1"}>العروض</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest transition-colors"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"person"}>person</span>
<span className={"font-label-md text-label-md mt-1"}>حسابي</span>
</a>
</nav>

    </ScreenFrame>
  );
}
