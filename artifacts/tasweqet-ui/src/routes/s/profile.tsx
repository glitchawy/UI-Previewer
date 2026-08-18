import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/profile")({
  head: () => ({
    meta: [
      { title: "\u062d\u0633\u0627\u0628\u064a - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u062d\u0633\u0627\u0628\u064a - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u062d\u0633\u0627\u0628\u064a - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u062d\u0633\u0627\u0628\u064a - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenProfile,
});

function ScreenProfile() {
  return (
    <ScreenFrame slug="profile" title="\u062d\u0633\u0627\u0628\u064a - Tasweeqet Betak" bodyClassName="pb-24">
      

<header className={"bg-surface dark:bg-surface-dim docked full-width top-0 sticky z-50 flat no shadows border-b border-outline-variant dark:border-outline"}>
<div className={"flex flex-row-reverse justify-between items-center px-margin-mobile w-full backdrop-blur-md h-16"}>
<div className={"flex items-center"}>
<span className={"material-symbols-outlined text-primary dark:text-primary-fixed-dim text-2xl mr-2"} data-icon={"location_on"} style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
<span className={"font-headline-lg-mobile text-headline-lg-mobile font-bold text-secondary dark:text-secondary-fixed-dim"}>Tasweeqet Betak</span>
</div>
<button className={"text-on-surface-variant dark:text-surface-variant hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors rounded-full p-2 active:opacity-80 duration-150"}>
<span className={"material-symbols-outlined text-2xl"} data-icon={"notifications"}>notifications</span>
</button>
</div>
</header>

<main className={"container mx-auto px-margin-mobile pt-lg max-w-lg md:max-w-2xl"}>

<section className={"flex flex-col items-center mb-xl"}>
<div className={"relative mb-4"}>
<img className={"w-24 h-24 rounded-full object-cover border-4 border-surface-container-lowest shadow-sm"} data-alt={"A close-up portrait of a friendly Middle Eastern person smiling warmly. The lighting is soft and natural, creating a welcoming and optimistic mood. The background is a slightly blurred, vibrant local marketplace setting. The color palette incorporates warm yellows and deep browns, aligning with a modern, clean light-mode aesthetic."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBriVEAAihOO7k7Yfx1-tRcQzipRk3wToNflPAqCOGFp6FI12XxcjgssGNt_x7afVmMIAlG4FdOvVfnIMGwsldDKkrIDP-wrIQIMTbF98IzuovDbtaArK7iivMm_G8N3wBkw1IPl-87-q1XdgFPlf3aMIhBZ8Cz-gXbuOYN_3H5tQZ08f2XVj37Lu9bLDGy2QWrxxiGY4axduNMUkZvPkc8L3JfwN22OjKUc8iFI9_cnthEsr0hrxCh"} />
<button className={"absolute bottom-0 right-0 bg-primary-container text-on-primary-container rounded-full p-2 shadow-sm hover:scale-105 transition-transform"}>
<span className={"material-symbols-outlined text-sm"} data-icon={"edit"}>edit</span>
</button>
</div>
<h1 className={"font-headline-md text-headline-md text-on-background mb-1"}>أحمد محمد</h1>
<p className={"font-body-md text-body-md text-on-surface-variant"}>ahmed.mohamed@example.com</p>
<p className={"font-label-md text-label-md text-secondary mt-2 bg-secondary-container px-3 py-1 rounded-full"}>+966 50 123 4567</p>
</section>

<section className={"grid grid-cols-1 gap-md"}>

<div className={"bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden"}>
<a className={"flex items-center p-md menu-item-hover border-b border-surface-variant"} href={"#"}>
<div className={"bg-surface-container-low p-2 rounded-lg ml-md"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"person"}>person</span>
</div>
<div className={"flex-grow"}>
<span className={"font-label-lg text-label-lg text-on-background"}>المعلومات الشخصية</span>
</div>
<span className={"material-symbols-outlined text-on-surface-variant"} data-icon={"chevron_left"}>chevron_left</span>
</a>
<a className={"flex items-center p-md menu-item-hover border-b border-surface-variant"} href={"#"}>
<div className={"bg-surface-container-low p-2 rounded-lg ml-md"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"location_city"}>location_city</span>
</div>
<div className={"flex-grow"}>
<span className={"font-label-lg text-label-lg text-on-background"}>العناوين</span>
</div>
<span className={"material-symbols-outlined text-on-surface-variant"} data-icon={"chevron_left"}>chevron_left</span>
</a>
<a className={"flex items-center p-md menu-item-hover"} href={"#"}>
<div className={"bg-surface-container-low p-2 rounded-lg ml-md"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"payment"}>payment</span>
</div>
<div className={"flex-grow"}>
<span className={"font-label-lg text-label-lg text-on-background"}>طرق الدفع</span>
</div>
<span className={"material-symbols-outlined text-on-surface-variant"} data-icon={"chevron_left"}>chevron_left</span>
</a>
</div>

<div className={"bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden mt-sm"}>
<a className={"flex items-center p-md menu-item-hover border-b border-surface-variant"} href={"#"}>
<div className={"bg-surface-container-low p-2 rounded-lg ml-md"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"favorite"}>favorite</span>
</div>
<div className={"flex-grow"}>
<span className={"font-label-lg text-label-lg text-on-background"}>المفضلة</span>
</div>
<span className={"material-symbols-outlined text-on-surface-variant"} data-icon={"chevron_left"}>chevron_left</span>
</a>
<a className={"flex items-center p-md menu-item-hover"} href={"#"}>
<div className={"bg-surface-container-low p-2 rounded-lg ml-md"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"list_alt"}>list_alt</span>
</div>
<div className={"flex-grow"}>
<span className={"font-label-lg text-label-lg text-on-background"}>طلباتي</span>
</div>
<span className={"material-symbols-outlined text-on-surface-variant"} data-icon={"chevron_left"}>chevron_left</span>
</a>
</div>

<div className={"bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden mt-sm"}>
<a className={"flex items-center p-md menu-item-hover border-b border-surface-variant"} href={"#"}>
<div className={"bg-surface-container-low p-2 rounded-lg ml-md"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"help_outline"}>help_outline</span>
</div>
<div className={"flex-grow"}>
<span className={"font-label-lg text-label-lg text-on-background"}>المساعدة والدعم</span>
</div>
<span className={"material-symbols-outlined text-on-surface-variant"} data-icon={"chevron_left"}>chevron_left</span>
</a>
<a className={"flex items-center p-md menu-item-hover"} href={"#"}>
<div className={"bg-surface-container-low p-2 rounded-lg ml-md"}>
<span className={"material-symbols-outlined text-secondary"} data-icon={"settings"}>settings</span>
</div>
<div className={"flex-grow"}>
<span className={"font-label-lg text-label-lg text-on-background"}>الإعدادات</span>
</div>
<span className={"material-symbols-outlined text-on-surface-variant"} data-icon={"chevron_left"}>chevron_left</span>
</a>
</div>

<div className={"mt-lg mb-xl"}>
<button className={"w-full flex items-center justify-center p-md bg-error-container text-on-error-container rounded-xl font-label-lg text-label-lg border border-error-container hover:bg-error hover:text-on-error transition-colors"}>
<span className={"material-symbols-outlined ml-2 text-xl"} data-icon={"logout"}>logout</span>
                    تسجيل الخروج
                </button>
</div>
</section>
</main>

<nav className={"bg-surface dark:bg-surface-dim docked full-width bottom-0 fixed z-50 flat no shadows border-t border-outline-variant dark:border-outline md:hidden"}>
<div className={"flex flex-row-reverse justify-around items-center w-full pb-safe pt-2 px-2 h-16"}>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-lg transition-colors"} href={"#"}>
<span className={"material-symbols-outlined text-2xl mb-1"} data-icon={"home"}>home</span>
<span className={"font-label-md text-label-md"}>الرئيسية</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-lg transition-colors"} href={"#"}>
<span className={"material-symbols-outlined text-2xl mb-1"} data-icon={"receipt_long"}>receipt_long</span>
<span className={"font-label-md text-label-md"}>طلباتي</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-lg transition-colors"} href={"#"}>
<span className={"material-symbols-outlined text-2xl mb-1"} data-icon={"local_offer"}>local_offer</span>
<span className={"font-label-md text-label-md"}>العروض</span>
</a>
<a className={"flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-4 py-1 active:scale-95 transition-transform duration-200 shadow-sm"} href={"#"}>
<span className={"material-symbols-outlined text-2xl mb-1"} data-icon={"person"} style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
<span className={"font-label-md text-label-md font-bold"}>حسابي</span>
</a>
</div>
</nav>

    </ScreenFrame>
  );
}
