import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/finance-payouts-mobile")({
  head: () => ({
    meta: [
      { title: "Finance &amp; Payouts Dashboard | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Finance &amp; Payouts Dashboard \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Finance &amp; Payouts Dashboard | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Finance &amp; Payouts Dashboard \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenFinancePayoutsMobile,
});

function ScreenFinancePayoutsMobile() {
  return (
    <ScreenFrame slug="finance-payouts-mobile" title="Finance &amp; Payouts Dashboard" bodyClassName="bg-surface-cream text-on-surface font-body-md min-h-screen">
      

<header className={"bg-surface border-b border-border-subtle bg-surface-cream docked full-width top-0 h-16 flex justify-between items-center w-full px-4 sticky top-0 z-40 md:hidden"}>
<div className={"flex items-center gap-3"}>
<button className={"text-on-surface-variant p-2 -ml-2 rounded-full hover:bg-surface-container-high transition-all"}>
<span className={"material-symbols-outlined"} data-icon={"menu"}>menu</span>
</button>
<h1 className={"font-headline-lg text-headline-lg font-black text-secondary"}>Tasweeqet Betak</h1>
</div>
<div className={"flex items-center gap-2"}>
<button className={"text-on-surface-variant p-2 rounded-full hover:bg-surface-container-high transition-all"}>
<span className={"material-symbols-outlined"} data-icon={"notifications"}>notifications</span>
</button>
<div className={"w-8 h-8 rounded-full overflow-hidden border border-border-subtle"}>
<img alt={"Admin User Avatar"} className={"w-full h-full object-cover"} data-alt={"A professional headshot of an administrative user in a brightly lit modern office environment. The styling is clean and corporate, fitting a high-end dashboard interface."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuA9c0M-PJJe1uTKgZvuSXj2xldJyYsRB_vWQQhrAyeL-qz963jy64NM5WJqAllT1Jc7WjCHAZecCO1hiqcCZQh5KUjkpUodkATqsbDtzYchTUx2vucUZfx-ItBNlgRj84Y-XSow01_j9FagAa2P8_RW951Y8WIVA8IqDmHSwAaZdx_L8eLxIVzHUr7ZJhGXOm4_N-F9T_9oA1vAJENW2y-CTpt7dtw7BPu5Mlcn7qtnbcaGq4baSYW_"} />
</div>
</div>
</header>
<main className={"p-4 space-y-6 pb-24 md:hidden"}>

<div className={"flex justify-between items-center"}>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>Finance</h2>
<button className={"bg-primary-container text-inverse-surface font-label-lg text-label-lg px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-inverse-primary transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"} data-icon={"download"}>download</span>
                Export
            </button>
</div>

<div className={"grid grid-cols-2 gap-4"}>

<div className={"col-span-2 bg-surface-white border border-border-subtle rounded-xl p-5 flex flex-col justify-between relative overflow-hidden"}>
<div className={"flex justify-between items-start z-10 relative"}>
<span className={"font-label-md text-label-md text-on-surface-variant uppercase tracking-wider"}>Available Balance</span>
<span className={"material-symbols-outlined text-primary-container bg-table-header p-1.5 rounded-lg"} data-icon={"account_balance_wallet"}>account_balance_wallet</span>
</div>
<div className={"mt-4 z-10 relative"}>
<span className={"font-headline-xl text-headline-xl text-inverse-surface"}>$45,231.89</span>
<div className={"flex items-center gap-1 mt-1 text-success"}>
<span className={"material-symbols-outlined text-[16px]"} data-icon={"trending_up"}>trending_up</span>
<span className={"font-label-md text-label-md"}>+12.5% this week</span>
</div>
</div>

<div className={"absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4"}>
<span className={"material-symbols-outlined text-[120px]"} data-icon={"payments"} style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col justify-between"}>
<span className={"font-label-md text-label-md text-on-surface-variant"}>Monthly Commission</span>
<div className={"mt-3"}>
<span className={"font-headline-md text-headline-md text-inverse-surface"}>$12,840</span>
</div>
</div>

<div className={"bg-table-header border border-primary-container/30 rounded-xl p-4 flex flex-col justify-between"}>
<span className={"font-label-md text-label-md text-inverse-surface font-semibold"}>Pending Payouts</span>
<div className={"mt-3"}>
<span className={"font-headline-md text-headline-md text-inverse-surface"}>$3,450</span>
</div>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-xl overflow-hidden"}>
<div className={"px-4 py-3 bg-table-header border-b border-border-subtle flex justify-between items-center"}>
<h3 className={"font-label-lg text-label-lg text-inverse-surface"}>Recent Transactions</h3>
<button className={"text-secondary font-label-md text-label-md hover:underline"}>View All</button>
</div>
<div className={"divide-y divide-border-subtle"}>

<div className={"p-4 flex items-center justify-between hover:bg-surface-cream transition-colors"}>
<div className={"flex items-center gap-3"}>
<div className={"w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[20px]"} data-icon={"arrow_outward"}>arrow_outward</span>
</div>
<div>
<p className={"font-data-mono text-data-mono text-inverse-surface"}>Payout to Bank</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Today, 10:24 AM</p>
</div>
</div>
<div className={"text-right"}>
<p className={"font-data-mono text-data-mono text-inverse-surface"}>-$2,500.00</p>
<span className={"inline-block px-2 py-0.5 mt-1 rounded bg-[#FFF8D6] text-inverse-surface font-label-md text-[10px]"}>Processing</span>
</div>
</div>

<div className={"p-4 flex items-center justify-between hover:bg-surface-cream transition-colors"}>
<div className={"flex items-center gap-3"}>
<div className={"w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"}>
<span className={"material-symbols-outlined text-[20px]"} data-icon={"percent"}>percent</span>
</div>
<div>
<p className={"font-data-mono text-data-mono text-inverse-surface"}>Commission Fee</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Yesterday, 03:45 PM</p>
</div>
</div>
<div className={"text-right"}>
<p className={"font-data-mono text-data-mono text-success"}>+$145.50</p>
<span className={"inline-block px-2 py-0.5 mt-1 rounded bg-[#E6F4EA] text-success font-label-md text-[10px]"}>Completed</span>
</div>
</div>

<div className={"p-4 flex items-center justify-between hover:bg-surface-cream transition-colors"}>
<div className={"flex items-center gap-3"}>
<div className={"w-10 h-10 rounded-full bg-error-container/30 flex items-center justify-center text-error"}>
<span className={"material-symbols-outlined text-[20px]"} data-icon={"undo"}>undo</span>
</div>
<div>
<p className={"font-data-mono text-data-mono text-inverse-surface"}>Customer Refund</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Oct 24, 09:12 AM</p>
</div>
</div>
<div className={"text-right"}>
<p className={"font-data-mono text-data-mono text-inverse-surface"}>-$85.00</p>
<span className={"inline-block px-2 py-0.5 mt-1 rounded bg-[#E6F4EA] text-success font-label-md text-[10px]"}>Completed</span>
</div>
</div>

<div className={"p-4 flex items-center justify-between hover:bg-surface-cream transition-colors"}>
<div className={"flex items-center gap-3"}>
<div className={"w-10 h-10 rounded-full bg-primary-container/20 flex items-center justify-center text-primary-container"}>
<span className={"material-symbols-outlined text-[20px]"} data-icon={"percent"}>percent</span>
</div>
<div>
<p className={"font-data-mono text-data-mono text-inverse-surface"}>Commission Fee</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>Oct 23, 11:30 AM</p>
</div>
</div>
<div className={"text-right"}>
<p className={"font-data-mono text-data-mono text-success"}>+$320.00</p>
<span className={"inline-block px-2 py-0.5 mt-1 rounded bg-[#E6F4EA] text-success font-label-md text-[10px]"}>Completed</span>
</div>
</div>
</div>
</div>
</main>

<nav className={"fixed bottom-0 w-full bg-surface-white border-t border-border-subtle flex justify-around items-center h-16 pb-safe md:hidden z-50 shadow-[0_-4px_6px_-1px_rgba(94,60,26,0.05)]"}>
<a className={"flex flex-col items-center justify-center w-full h-full text-on-surface-variant opacity-70 hover:opacity-100 transition-colors"} href={"#"}>
<span className={"material-symbols-outlined text-[24px]"} data-icon={"dashboard"}>dashboard</span>
<span className={"font-label-md text-[10px] mt-1"}>Dashboard</span>
</a>
<a className={"flex flex-col items-center justify-center w-full h-full text-on-surface-variant opacity-70 hover:opacity-100 transition-colors"} href={"#"}>
<span className={"material-symbols-outlined text-[24px]"} data-icon={"shopping_cart"}>shopping_cart</span>
<span className={"font-label-md text-[10px] mt-1"}>Orders</span>
</a>
<a className={"flex flex-col items-center justify-center w-full h-full text-inverse-surface border-t-2 border-primary-container relative"} href={"#"}>
<div className={"absolute -top-1 w-8 h-1 bg-primary-container rounded-b-full"}></div>
<span className={"material-symbols-outlined text-[24px] text-primary-container"} data-icon={"payments"} style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
<span className={"font-label-md text-[10px] mt-1 font-bold"}>Finance</span>
</a>
<a className={"flex flex-col items-center justify-center w-full h-full text-on-surface-variant opacity-70 hover:opacity-100 transition-colors"} href={"#"}>
<span className={"material-symbols-outlined text-[24px]"} data-icon={"analytics"}>analytics</span>
<span className={"font-label-md text-[10px] mt-1"}>Analytics</span>
</a>
</nav>

    </ScreenFrame>
  );
}
