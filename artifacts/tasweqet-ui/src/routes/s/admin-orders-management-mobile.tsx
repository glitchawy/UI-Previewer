import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/admin-orders-management-mobile")({
  head: () => ({
    meta: [
      { title: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenAdminOrdersManagementMobile,
});

function ScreenAdminOrdersManagementMobile() {
  return (
    <ScreenFrame slug="admin-orders-management-mobile" title="\u0625\u062f\u0627\u0631\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a - Tasweeqet Betak" bodyClassName="bg-surface-cream text-on-surface font-body-md min-h-screen pb-20 md:pb-0">
      

<header className={"bg-surface border-b border-border-subtle bg-surface-cream docked full-width top-0 h-16 flex justify-between items-center w-full px-4 sticky top-0 z-40 md:px-margin-desktop shadow-sm"}>
<div className={"flex items-center gap-3"}>
<button className={"md:hidden text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all"}>
<span className={"material-symbols-outlined"}>menu</span>
</button>
<h1 className={"font-headline-lg-mobile text-headline-lg-mobile font-black text-secondary"}>Admin Dashboard</h1>
</div>
<div className={"flex items-center gap-2"}>
<button className={"text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all cursor-pointer active:opacity-80"}>
<span className={"material-symbols-outlined"} data-icon={"notifications"}>notifications</span>
</button>
<button className={"text-on-surface-variant hover:bg-surface-container-high p-2 rounded-full transition-all cursor-pointer active:opacity-80"}>
<span className={"material-symbols-outlined"} data-icon={"language"}>language</span>
</button>
<img alt={"Admin User Avatar"} className={"w-8 h-8 rounded-full object-cover ml-2 border border-border-subtle"} data-alt={"A small, circular avatar portrait of an administrator. The portrait should be well-lit and professional, fitting within a warm, corporate modern dashboard environment with cream and yellow accents."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAouLvWacsa3XL_1pqRJi6ORXyOPt0DM0CtwK88cr9MET4W_OuNyMomw2zUSHFW8UvgJJ9NNLj7nvEHQ3k15TN0fleOKkE5Cs5amMw6UMqNXIgWNfzmSFumRbe1hQMLL90lK5PldOmzPBxtA-h6pthnOO0CRPPsMo1obK9HC7Dx6dBbluqNyGeLCzgs4i-iZEkIbyI4ZZy9if-W4buJfkQiiKUCpC4Lf4xaVHfLsEad5mAeUvymDpRT"} />
</div>
</header>
<div className={"flex flex-col md:flex-row min-h-[calc(100vh-64px)]"}>

<nav className={"hidden md:flex flex-col h-full py-stack-lg fixed right-0 top-0 h-full w-sidebar-width bg-inverse-surface border-l border-outline-variant z-50"}>
<div className={"px-6 mb-8"}>
<h2 className={"font-headline-md text-headline-md font-bold text-primary-container"}>Tasweeqet Betak</h2>
<p className={"text-surface-variant opacity-70 font-label-md text-label-md"}>Admin Console</p>
</div>
<div className={"flex-1 overflow-y-auto"}>
<ul className={"flex flex-col gap-1 px-2 font-label-lg text-label-lg"}>
<li>
<a className={"flex items-center gap-3 text-surface-variant opacity-70 hover:opacity-100 px-4 py-3 hover:bg-surface-variant hover:text-on-surface-variant transition-colors duration-200 rounded-lg"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"dashboard"}>dashboard</span>
                            Dashboard
                        </a>
</li>
<li>
<a className={"flex items-center gap-3 bg-primary text-on-primary font-bold rounded-lg px-4 py-3 border-r-4 border-primary-container scale-95 active:scale-90 transition-transform"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"shopping_cart"}>shopping_cart</span>
                            Orders
                        </a>
</li>
<li>
<a className={"flex items-center gap-3 text-surface-variant opacity-70 hover:opacity-100 px-4 py-3 hover:bg-surface-variant hover:text-on-surface-variant transition-colors duration-200 rounded-lg"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"group"}>group</span>
                            Customers
                        </a>
</li>
<li>
<a className={"flex items-center gap-3 text-surface-variant opacity-70 hover:opacity-100 px-4 py-3 hover:bg-surface-variant hover:text-on-surface-variant transition-colors duration-200 rounded-lg"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"storefront"}>storefront</span>
                            Merchants
                        </a>
</li>
<li>
<a className={"flex items-center gap-3 text-surface-variant opacity-70 hover:opacity-100 px-4 py-3 hover:bg-surface-variant hover:text-on-surface-variant transition-colors duration-200 rounded-lg"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"local_shipping"}>local_shipping</span>
                            Drivers
                        </a>
</li>
</ul>
</div>
<div className={"p-4 mt-auto"}>
<button className={"w-full bg-primary-container text-on-primary-fixed font-bold py-3 rounded-lg hover:bg-primary-fixed-dim transition-colors shadow-sm"}>
                    Export Report
                </button>
</div>
</nav>

<main className={"flex-1 w-full md:mr-sidebar-width p-4 md:p-margin-desktop"}>

<div className={"flex flex-col gap-4 mb-6"}>
<div>
<h2 className={"font-headline-xl text-headline-xl text-on-surface mb-1"}>الطلبات</h2>
<p className={"text-on-surface-variant font-body-md"}>إدارة وتتبع الطلبات الحالية.</p>
</div>
<div className={"relative"}>
<span className={"material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-outline"}>search</span>
<input className={"w-full bg-surface-white border border-border-subtle rounded-lg py-3 pr-10 pl-4 font-data-mono text-data-mono text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-shadow shadow-sm"} placeholder={"\u0628\u062d\u062b \u0628\u0631\u0642\u0645 \u0627\u0644\u0637\u0644\u0628\u060c \u0627\u0644\u0645\u062a\u062c\u0631\u060c \u0623\u0648 \u0627\u0644\u0639\u0645\u064a\u0644..."} type={"text"} />
</div>
</div>

<div className={"flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-6"}>
<button className={"whitespace-nowrap px-4 py-2 rounded-full bg-surface-variant text-on-surface-variant font-label-md text-label-md border border-outline-variant hover:bg-surface-container-high transition-colors"}>الكل (124)</button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full bg-surface-container-highest text-on-surface font-bold font-label-md text-label-md border border-primary-container shadow-sm"}>قيد الانتظار (42)</button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full bg-surface-variant text-on-surface-variant font-label-md text-label-md border border-outline-variant hover:bg-surface-container-high transition-colors"}>جاري التجهيز (18)</button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full bg-surface-variant text-on-surface-variant font-label-md text-label-md border border-outline-variant hover:bg-surface-container-high transition-colors"}>في الطريق (30)</button>
<button className={"whitespace-nowrap px-4 py-2 rounded-full bg-surface-variant text-on-surface-variant font-label-md text-label-md border border-outline-variant hover:bg-surface-container-high transition-colors"}>مكتمل (34)</button>
</div>

<div className={"flex flex-col gap-4"}>

<div className={"bg-surface-white border border-border-subtle rounded-xl p-4 shadow-sm hover:bg-surface-bright transition-colors"}>
<div className={"flex justify-between items-start mb-3"}>
<div>
<span className={"font-data-mono text-data-mono text-on-surface-variant block mb-1"}>#ORD-9823</span>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>مخبز الأمل</h3>
</div>
<span className={"bg-[#FFF8D6] text-on-surface px-3 py-1 rounded-full font-label-md text-label-md border border-border-subtle flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>pending</span>
                            قيد الانتظار
                        </span>
</div>
<div className={"grid grid-cols-2 gap-y-2 mb-4"}>
<div>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>العميل</span>
<span className={"font-body-md text-on-surface block"}>أحمد عبدالله</span>
</div>
<div>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>الإجمالي</span>
<span className={"font-data-mono text-data-mono text-on-surface block font-bold"}>145.50 ر.س</span>
</div>
<div className={"col-span-2"}>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>الوقت</span>
<span className={"font-body-md text-on-surface block"}>منذ 15 دقيقة</span>
</div>
</div>
<div className={"flex gap-2 border-t border-border-subtle pt-3"}>
<button className={"flex-1 bg-surface-white border border-on-surface text-on-surface font-label-lg text-label-lg py-2 rounded-lg hover:bg-surface-variant transition-colors text-center"}>التفاصيل</button>
<button className={"flex-1 bg-primary-container text-on-primary-fixed font-label-lg text-label-lg py-2 rounded-lg hover:bg-primary-fixed-dim transition-colors text-center"}>قبول الطلب</button>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-xl p-4 shadow-sm hover:bg-surface-bright transition-colors"}>
<div className={"flex justify-between items-start mb-3"}>
<div>
<span className={"font-data-mono text-data-mono text-on-surface-variant block mb-1"}>#ORD-9822</span>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>مطعم البخاري</h3>
</div>
<span className={"bg-surface-container-highest text-on-surface px-3 py-1 rounded-full font-label-md text-label-md border border-border-subtle flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>skillet</span>
                            جاري التجهيز
                        </span>
</div>
<div className={"grid grid-cols-2 gap-y-2 mb-4"}>
<div>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>العميل</span>
<span className={"font-body-md text-on-surface block"}>سارة محمد</span>
</div>
<div>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>الإجمالي</span>
<span className={"font-data-mono text-data-mono text-on-surface block font-bold"}>85.00 ر.س</span>
</div>
<div className={"col-span-2"}>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>الوقت</span>
<span className={"font-body-md text-on-surface block"}>منذ 32 دقيقة</span>
</div>
</div>
<div className={"flex gap-2 border-t border-border-subtle pt-3"}>
<button className={"w-full bg-surface-white border border-on-surface text-on-surface font-label-lg text-label-lg py-2 rounded-lg hover:bg-surface-variant transition-colors text-center"}>عرض التفاصيل</button>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-xl p-4 shadow-sm hover:bg-surface-bright transition-colors opacity-80"}>
<div className={"flex justify-between items-start mb-3"}>
<div>
<span className={"font-data-mono text-data-mono text-on-surface-variant block mb-1"}>#ORD-9810</span>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>كافيه النخيل</h3>
</div>
<span className={"bg-[#E6F4EA] text-success px-3 py-1 rounded-full font-label-md text-label-md border border-[#CEEAD6] flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>check_circle</span>
                            مكتمل
                        </span>
</div>
<div className={"grid grid-cols-2 gap-y-2 mb-4"}>
<div>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>العميل</span>
<span className={"font-body-md text-on-surface block"}>خالد علي</span>
</div>
<div>
<span className={"text-on-surface-variant font-label-md text-label-md block"}>الإجمالي</span>
<span className={"font-data-mono text-data-mono text-on-surface block font-bold"}>42.00 ر.س</span>
</div>
</div>
<div className={"flex gap-2 border-t border-border-subtle pt-3"}>
<button className={"w-full bg-surface-white border border-outline-variant text-on-surface-variant font-label-lg text-label-lg py-2 rounded-lg hover:bg-surface-variant transition-colors text-center"}>التفاصيل</button>
</div>
</div>
</div>
</main>
</div>

    </ScreenFrame>
  );
}
