import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/admin-dashboard-overview-mobile")({
  head: () => ({
    meta: [
      { title: "Tasweeqet Betak - Admin Console | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Admin Console \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Tasweeqet Betak - Admin Console | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Admin Console \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenAdminDashboardOverviewMobile,
});

function ScreenAdminDashboardOverviewMobile() {
  return (
    <ScreenFrame slug="admin-dashboard-overview-mobile" title="Tasweeqet Betak - Admin Console" bodyClassName="bg-surface-cream text-on-surface font-body-md antialiased md:hidden pb-20">
      

<header className={"bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed docked full-width top-0 h-16 border-b border-border-subtle bg-surface-cream flex justify-between items-center w-full px-4 sticky top-0 z-40"}>
<div className={"flex items-center gap-3"}>
<button className={"material-symbols-outlined text-primary cursor-pointer active:opacity-80"}>menu</button>
<h1 className={"font-headline-lg text-headline-lg font-black text-secondary"}>Tasweeqet</h1>
</div>
<div className={"flex items-center gap-4"}>
<span className={"material-symbols-outlined cursor-pointer hover:bg-surface-container-high p-2 rounded-full transition-all text-on-surface-variant"}>notifications</span>
<img alt={"Admin User Avatar"} className={"w-8 h-8 rounded-full border border-border-subtle object-cover"} data-alt={"A small, professional headshot of an administrative user, slightly smiling, well-lit studio photography, clean white background, high resolution, suitable for a dashboard avatar."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAoCf0pftjtmp_7zci1WRf81R4lyyjWhmW28jHy62PPy0JiV1vFr_adcLbwUlM18b7KqPSrtmxK_SN6B5UyOGb88ZKxYoNHyF0uUGcuSPKBHsfE8b4xGXx7BY0c4AcES8SWIEnq88cCovw6yZZ7IODliuPujUP7UbQAvJdmMvaS68vUKWDdwJFgT-HLOWFaqmPLVpHmRmgxTwn-TOmcN_UtRqzvOc5GtvpCU6cKkuN1B8LdFBxY8xrw"} />
</div>
</header>
<main className={"p-4 flex flex-col gap-6"}>

<div className={"flex justify-between items-center"}>
<div>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>Overview</h2>
<p className={"font-body-md text-body-md text-on-surface-variant"}>Today's snapshot</p>
</div>
<button className={"bg-primary-container text-on-primary-container font-label-lg text-label-lg px-4 py-2 rounded-lg flex items-center gap-2 active:scale-95 transition-transform"}>
<span className={"material-symbols-outlined text-[18px]"}>calendar_today</span>
                Today
            </button>
</div>

<section className={"flex gap-4 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-2 snap-x"}>

<div className={"min-w-[160px] bg-surface-white border border-border-subtle rounded-[16px] p-4 flex flex-col gap-3 snap-start"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-primary bg-table-header p-2 rounded-lg"}>shopping_bag</span>
<span className={"text-success font-data-mono text-data-mono flex items-center"}>+12%<span className={"material-symbols-outlined text-[14px]"}>arrow_upward</span></span>
</div>
<div>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Total Orders</p>
<p className={"font-headline-lg text-headline-lg text-secondary"}>1,248</p>
</div>
</div>

<div className={"min-w-[160px] bg-surface-white border border-border-subtle rounded-[16px] p-4 flex flex-col gap-3 snap-start"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-primary bg-table-header p-2 rounded-lg"}>payments</span>
<span className={"text-success font-data-mono text-data-mono flex items-center"}>+8%<span className={"material-symbols-outlined text-[14px]"}>arrow_upward</span></span>
</div>
<div>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Revenue</p>
<p className={"font-headline-lg text-headline-lg text-secondary"}>OMR 4.2k</p>
</div>
</div>

<div className={"min-w-[160px] bg-surface-white border border-border-subtle rounded-[16px] p-4 flex flex-col gap-3 snap-start"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-primary bg-table-header p-2 rounded-lg"}>storefront</span>
<span className={"text-on-surface-variant font-data-mono text-data-mono flex items-center"}>-1%<span className={"material-symbols-outlined text-[14px]"}>arrow_downward</span></span>
</div>
<div>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Merchants</p>
<p className={"font-headline-lg text-headline-lg text-secondary"}>342</p>
</div>
</div>

<div className={"min-w-[160px] bg-surface-white border border-border-subtle rounded-[16px] p-4 flex flex-col gap-3 snap-start"}>
<div className={"flex justify-between items-start"}>
<span className={"material-symbols-outlined text-primary bg-table-header p-2 rounded-lg"}>local_shipping</span>
<span className={"text-success font-data-mono text-data-mono flex items-center"}>+5%<span className={"material-symbols-outlined text-[14px]"}>arrow_upward</span></span>
</div>
<div>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Drivers</p>
<p className={"font-headline-lg text-headline-lg text-secondary"}>89</p>
</div>
</div>
</section>

<section className={"bg-surface-white border border-border-subtle rounded-[16px] p-4"}>
<h3 className={"font-headline-md text-headline-md text-on-surface mb-4"}>Live Operations</h3>
<div className={"grid grid-cols-2 gap-4"}>
<div className={"bg-surface-container-low p-3 rounded-lg text-center"}>
<p className={"font-headline-md text-headline-md text-primary"}>42</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Preparing</p>
</div>
<div className={"bg-table-header p-3 rounded-lg text-center border border-primary-container"}>
<p className={"font-headline-md text-headline-md text-secondary"}>18</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>On Route</p>
</div>
<div className={"bg-error-container p-3 rounded-lg text-center col-span-2"}>
<div className={"flex items-center justify-center gap-2"}>
<span className={"material-symbols-outlined text-error text-[20px]"}>warning</span>
<p className={"font-headline-md text-headline-md text-error"}>3</p>
</div>
<p className={"font-label-md text-label-md text-on-error-container"}>Delayed Orders</p>
</div>
</div>
</section>

<section className={"bg-surface-white border border-border-subtle rounded-[16px] overflow-hidden"}>
<div className={"p-4 border-b border-border-subtle flex justify-between items-center"}>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>Recent Orders</h3>
<button className={"font-label-md text-label-md text-primary font-semibold"}>View All</button>
</div>
<div className={"flex flex-col"}>

<div className={"p-4 border-b border-border-subtle flex justify-between items-center active:bg-surface-container-high transition-colors"}>
<div className={"flex gap-3 items-center"}>
<div className={"w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold"}>
                            #A1
                        </div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface"}>Order #A1042</p>
<p className={"font-body-md text-body-md text-on-surface-variant"}>Al Baik - Seeb</p>
</div>
</div>
<div className={"text-right flex flex-col items-end gap-1"}>
<span className={"bg-[#FFF8D6] text-secondary font-label-md text-label-md px-2 py-1 rounded-full whitespace-nowrap"}>Pending</span>
<p className={"font-data-mono text-data-mono text-on-surface"}>OMR 12.5</p>
</div>
</div>

<div className={"p-4 border-b border-border-subtle flex justify-between items-center active:bg-surface-container-high transition-colors"}>
<div className={"flex gap-3 items-center"}>
<div className={"w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold"}>
                            #B2
                        </div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface"}>Order #B2091</p>
<p className={"font-body-md text-body-md text-on-surface-variant"}>KFC - Mawaleh</p>
</div>
</div>
<div className={"text-right flex flex-col items-end gap-1"}>
<span className={"bg-table-header text-secondary font-label-md text-label-md px-2 py-1 rounded-full whitespace-nowrap border border-primary-container"}>On Route</span>
<p className={"font-data-mono text-data-mono text-on-surface"}>OMR 8.2</p>
</div>
</div>

<div className={"p-4 flex justify-between items-center active:bg-surface-container-high transition-colors"}>
<div className={"flex gap-3 items-center"}>
<div className={"w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary font-bold"}>
                            #C3
                        </div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface"}>Order #C3812</p>
<p className={"font-body-md text-body-md text-on-surface-variant"}>Pizza Hut - Al Khoud</p>
</div>
</div>
<div className={"text-right flex flex-col items-end gap-1"}>
<span className={"bg-[#e6f4ea] text-success font-label-md text-label-md px-2 py-1 rounded-full whitespace-nowrap"}>Delivered</span>
<p className={"font-data-mono text-data-mono text-on-surface"}>OMR 15.0</p>
</div>
</div>
</div>
</section>
</main>

<nav className={"fixed bottom-0 w-full bg-inverse-surface dark:bg-inverse-surface border-t border-outline-variant flex justify-around items-center h-16 z-50"}>
<a className={"flex flex-col items-center justify-center w-full h-full text-primary-container"} href={"#"}>
<span className={"material-symbols-outlined mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>dashboard</span>
<span className={"font-label-md text-label-md"}>Dashboard</span>
</a>
<a className={"flex flex-col items-center justify-center w-full h-full text-surface-variant opacity-70"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>shopping_cart</span>
<span className={"font-label-md text-label-md"}>Orders</span>
</a>
<a className={"flex flex-col items-center justify-center w-full h-full text-surface-variant opacity-70"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>storefront</span>
<span className={"font-label-md text-label-md"}>Merchants</span>
</a>
<a className={"flex flex-col items-center justify-center w-full h-full text-surface-variant opacity-70"} href={"#"}>
<span className={"material-symbols-outlined mb-1"}>monitoring</span>
<span className={"font-label-md text-label-md"}>Analytics</span>
</a>
</nav>

    </ScreenFrame>
  );
}
