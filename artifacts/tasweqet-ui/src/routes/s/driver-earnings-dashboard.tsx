import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/driver-earnings-dashboard")({
  head: () => ({
    meta: [
      { title: "\u0623\u0631\u0628\u0627\u062d\u0643 - Tasweeqet Betak Driver | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0623\u0631\u0628\u0627\u062d\u0643 - Tasweeqet Betak Driver \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0623\u0631\u0628\u0627\u062d\u0643 - Tasweeqet Betak Driver | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0623\u0631\u0628\u0627\u062d\u0643 - Tasweeqet Betak Driver \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenDriverEarningsDashboard,
});

function ScreenDriverEarningsDashboard() {
  return (
    <ScreenFrame slug="driver-earnings-dashboard" title="\u0623\u0631\u0628\u0627\u062d\u0643 - Tasweeqet Betak Driver" bodyClassName="font-body-md min-h-screen pb-24 relative overflow-x-hidden">
      

<header className={"bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant/30 flex items-center justify-between px-margin-mobile h-16 w-full"}>
<div className={"flex items-center gap-sm"}>
<img className={"w-10 h-10 rounded-full object-cover"} data-alt={"A small, circular avatar portrait of a friendly delivery driver in a yellow uniform, well-lit studio shot, modern minimal background, realistic photo style, high quality."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCgPTZSQolGQtw4v57MQTUJ5FeSzGEX0n92CqII5L8rn88VJ9u8pbQzSDE8edX3soS2u7RvAK3dt4tvMBq0qF5OsoRjvDW0ZeuwCrBCCMY4C-W0wRpajoDyJfdEAKJIoaX9lGJ7UZdnafH_2daABqHwUNswnZlkUcJCR_t6-zCZ8R8vs_leii4nthzkFvt0oRLIvciCW2aXiNq9wD7FWty9RiIIJ0PpZrhgAKsmnnx82EMzEErMPqPz"} />
<h1 className={"font-headline-md text-headline-md font-bold text-on-surface dark:text-on-surface"}>Tasweeqet Betak Driver</h1>
</div>
<div className={"flex items-center"}>
<span className={"text-primary font-bold text-label-lg bg-surface-container-low px-3 py-1 rounded-full flex items-center gap-xs"}>
<span className={"w-2 h-2 rounded-full bg-primary block"}></span>
                Online
            </span>
</div>
</header>

<main className={"pt-24 px-margin-mobile flex flex-col gap-lg pb-10"}>

<div className={"flex justify-between items-center"}>
<h2 className={"font-headline-xl-mobile text-headline-xl-mobile text-on-background"}>أرباحك</h2>
<div className={"bg-surface-container-high rounded-full p-1 flex shadow-sm border border-outline-variant/30"}>
<button className={"px-3 py-1 rounded-full text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"}>اليوم</button>
<button className={"px-3 py-1 rounded-full text-label-lg bg-surface text-on-surface font-bold shadow-sm"}>هذا الأسبوع</button>
<button className={"px-3 py-1 rounded-full text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"}>هذا الشهر</button>
</div>
</div>

<div className={"bg-primary-container rounded-xl p-lg flex flex-col items-center justify-center border border-outline-variant/50 relative overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300"}>

<div className={"absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none"}></div>
<div className={"absolute -bottom-10 -left-10 w-32 h-32 bg-on-primary-container/10 rounded-full blur-2xl pointer-events-none"}></div>
<p className={"font-label-lg text-label-lg text-on-primary-container/80 mb-2 z-10"}>أرباح هذا الأسبوع</p>
<h3 className={"font-headline-xl-mobile text-headline-xl-mobile text-on-primary-container z-10 flex items-baseline gap-xs"}>
<span>450.00</span>
<span className={"font-headline-md text-headline-md"}>ر.س</span>
</h3>
</div>

<div className={"grid grid-cols-3 gap-sm"}>
<div className={"bg-surface rounded-xl p-md border border-outline-variant/50 flex flex-col items-center justify-center gap-xs hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300"}>
<span className={"material-symbols-outlined text-tertiary mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>local_shipping</span>
<span className={"font-headline-md text-headline-md text-on-surface"}>32</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>الطلبات</span>
</div>
<div className={"bg-surface rounded-xl p-md border border-outline-variant/50 flex flex-col items-center justify-center gap-xs hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300"}>
<span className={"material-symbols-outlined text-tertiary mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
<span className={"font-headline-md text-headline-md text-on-surface"}>24</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>ساعات العمل</span>
</div>
<div className={"bg-surface rounded-xl p-md border border-outline-variant/50 flex flex-col items-center justify-center gap-xs hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300"}>
<span className={"material-symbols-outlined text-primary mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
<span className={"font-headline-md text-headline-md text-on-surface"}>4.9</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>التقييم</span>
</div>
</div>

<div className={"bg-surface rounded-xl p-md border border-outline-variant/50 hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300"}>
<h4 className={"font-headline-md text-headline-md text-on-surface mb-md"}>نظرة عامة على الأرباح</h4>
<div className={"h-40 flex items-end justify-between gap-xs pt-4 border-b border-surface-variant"}>

<div className={"flex flex-col items-center gap-2 flex-1 group"}>
<div className={"w-full bg-surface-container rounded-t-sm h-full relative overflow-hidden group-hover:bg-surface-variant transition-colors"}>
<div className={"absolute bottom-0 w-full bg-primary-container h-[40%] rounded-t-sm"}></div>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>السبت</span>
</div>
<div className={"flex flex-col items-center gap-2 flex-1 group"}>
<div className={"w-full bg-surface-container rounded-t-sm h-full relative overflow-hidden group-hover:bg-surface-variant transition-colors"}>
<div className={"absolute bottom-0 w-full bg-primary-container h-[60%] rounded-t-sm"}></div>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>الأحد</span>
</div>
<div className={"flex flex-col items-center gap-2 flex-1 group"}>
<div className={"w-full bg-surface-container rounded-t-sm h-full relative overflow-hidden group-hover:bg-surface-variant transition-colors"}>
<div className={"absolute bottom-0 w-full bg-primary-container h-[30%] rounded-t-sm"}></div>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>الإثنين</span>
</div>
<div className={"flex flex-col items-center gap-2 flex-1 group"}>
<div className={"w-full bg-surface-container rounded-t-sm h-full relative overflow-hidden group-hover:bg-surface-variant transition-colors"}>
<div className={"absolute bottom-0 w-full bg-primary-container h-[80%] rounded-t-sm"}></div>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>الثلاثاء</span>
</div>
<div className={"flex flex-col items-center gap-2 flex-1 group"}>
<div className={"w-full bg-surface-container rounded-t-sm h-full relative overflow-hidden group-hover:bg-surface-variant transition-colors"}>
<div className={"absolute bottom-0 w-full bg-primary-container h-[50%] rounded-t-sm"}></div>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>الأربعاء</span>
</div>
<div className={"flex flex-col items-center gap-2 flex-1 group"}>
<div className={"w-full bg-surface-container rounded-t-sm h-full relative overflow-hidden group-hover:bg-surface-variant transition-colors"}>
<div className={"absolute bottom-0 w-full bg-primary-container h-[90%] rounded-t-sm"}></div>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant font-bold text-on-surface"}>الخميس</span>
</div>
<div className={"flex flex-col items-center gap-2 flex-1 group"}>
<div className={"w-full bg-surface-container rounded-t-sm h-full relative overflow-hidden group-hover:bg-surface-variant transition-colors"}>
<div className={"absolute bottom-0 w-full bg-primary-container h-[20%] rounded-t-sm"}></div>
</div>
<span className={"font-label-md text-label-md text-on-surface-variant"}>الجمعة</span>
</div>
</div>
</div>

<div>
<div className={"flex justify-between items-center mb-md"}>
<h4 className={"font-headline-md text-headline-md text-on-surface"}>المدفوعات الأخيرة</h4>
<button className={"font-label-lg text-label-lg text-tertiary bg-transparent hover:text-tertiary-container transition-colors"}>عرض الكل</button>
</div>
<div className={"flex flex-col gap-sm"}>

<div className={"bg-surface rounded-xl p-md border border-outline-variant/50 flex justify-between items-center hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300"}>
<div className={"flex items-center gap-md"}>
<div className={"w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center"}>
<span className={"material-symbols-outlined text-primary"}>account_balance_wallet</span>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface"}>تحويل بنكي</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>24 أكتوبر 2023</p>
</div>
</div>
<div className={"flex flex-col items-end"}>
<p className={"font-headline-md text-headline-md text-on-surface"}>120.00 ر.س</p>
<span className={"font-label-md text-label-md text-primary bg-primary-container/30 px-2 py-0.5 rounded-sm"}>ناجح</span>
</div>
</div>

<div className={"bg-surface rounded-xl p-md border border-outline-variant/50 flex justify-between items-center hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300"}>
<div className={"flex items-center gap-md"}>
<div className={"w-12 h-12 bg-surface-container-high rounded-full flex items-center justify-center"}>
<span className={"material-symbols-outlined text-tertiary"}>account_balance_wallet</span>
</div>
<div>
<p className={"font-label-lg text-label-lg text-on-surface"}>تحويل بنكي</p>
<p className={"font-label-md text-label-md text-on-surface-variant"}>22 أكتوبر 2023</p>
</div>
</div>
<div className={"flex flex-col items-end"}>
<p className={"font-headline-md text-headline-md text-on-surface"}>85.50 ر.س</p>
<span className={"font-label-md text-label-md text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-sm"}>قيد الانتظار</span>
</div>
</div>
</div>
</div>
</main>

<nav className={"bg-surface dark:bg-surface-container-lowest fixed bottom-0 w-full z-50 rounded-t-xl shadow-lg border-t border-outline-variant/50 flex justify-around items-center h-20 px-2 pb-safe"}>

<a className={"flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1.5 active:scale-90 transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
<span className={"font-label-md text-label-md"}>Earnings</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low active:scale-90 transition-all duration-200 px-4 py-1.5 rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"}>local_shipping</span>
<span className={"font-label-md text-label-md"}>Deliveries</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low active:scale-90 transition-all duration-200 px-4 py-1.5 rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"}>explore</span>
<span className={"font-label-md text-label-md"}>Map</span>
</a>

<a className={"flex flex-col items-center justify-center text-on-surface-variant hover:bg-surface-container-low active:scale-90 transition-all duration-200 px-4 py-1.5 rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"}>settings</span>
<span className={"font-label-md text-label-md"}>Settings</span>
</a>
</nav>

    </ScreenFrame>
  );
}
