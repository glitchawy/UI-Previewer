import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/driver-home-online")({
  head: () => ({
    meta: [
      { title: "Driver Home - Online | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Driver Home - Online \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Driver Home - Online | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Driver Home - Online \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenDriverHomeOnline,
});

function ScreenDriverHomeOnline() {
  return (
    <ScreenFrame slug="driver-home-online" title="Driver Home - Online" bodyClassName="bg-background text-on-surface antialiased overflow-hidden h-screen w-full relative">
      

<div className={"absolute inset-0 z-0"}>
<img className={"w-full h-full object-cover opacity-80 mix-blend-multiply"} data-alt={"A top-down digital map view of a city grid with bright modern styling. The map features smooth rounded corners on buildings and streets, rendered in a light mode palette of cream, white, and subtle warm grays. High contrast roads and gentle depth layering give a tactile, clean look."} data-location={"Riyadh, Saudi Arabia"} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDp81BQAavSjAqbHvZG_EyyEkorjafMRFyReW2o53hEdLCaIi8pWCM4GNvaUHi6l34q_8ClgMOS6tzK3zsROyNS3wncd0f_UOYSSdHH2zgNFH3Q8rN125E5-jdUExHQr0_QM--Yhvks0ixLfE1_tkDc2akhVrPxpsH2MAOx-ElMwVpNkr_CFn26U3vgTWIse2FSJRNqERhsJesCiZTmY7Lx2j1dU4r0kL2x7VlKn2AIQz8dBEb33geJ"} />
<div className={"absolute inset-0 bg-gradient-to-b from-surface/40 via-transparent to-surface/90"}></div>
</div>

<header className={"fixed top-0 w-full z-50 bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md border-b border-outline-variant/30 flex items-center justify-between px-margin-mobile h-16 transition-colors"}>
<div className={"flex items-center gap-sm"}>
<div className={"w-10 h-10 rounded-full overflow-hidden border-2 border-primary-container"}>
<img className={"w-full h-full object-cover"} data-alt={"A close-up portrait of a delivery driver wearing a yellow uniform cap, smiling warmly in good natural lighting. The style is modern, approachable, and brightly lit, reflecting an optimistic and reliable service brand identity."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDTyY4aN_Lx_Xs93niPeAJb8kegjKPdobSgD1k5kITYYnxCwaYwUEs5qB-Scl2D5Yu4_NjNjTzb7ibUNz6mhUMXmBSzGxDLDAjCkgrCSDkuAuZEKRrpnweguCq1DeAGJUW9mAzkHWgnGd7QDq85KWlNei-4pgaHbB7QpLLB3PoQAXkmYyMeeh5pO5kOaHxTr-tOg6oXA0CDz_YBXbgbbAdSodbw43xvOeJ06ksXmt68Ydubnx-fWgf-"} />
</div>
<h1 className={"font-headline-md text-headline-md font-bold text-on-surface dark:text-on-surface truncate"}>Tasweeqet Betak Driver</h1>
</div>
<div className={"flex items-center gap-2 bg-primary-container/20 px-3 py-1.5 rounded-full border border-primary-container/50"}>
<div className={"w-2 h-2 rounded-full bg-[#10b981] pulse-dot"}></div>
<span className={"font-label-lg text-label-lg text-primary"}>Online</span>
</div>
</header>

<main className={"relative z-10 w-full h-full pt-[88px] px-margin-mobile flex flex-col justify-between pb-[180px]"}>

<div className={"w-full max-w-sm mx-auto bg-surface border border-outline-variant/30 rounded-xl p-md shadow-[0_4px_8px_rgba(94,60,26,0.04)] flex items-center justify-between"}>
<div className={"flex items-center gap-md"}>
<div className={"relative flex items-center justify-center w-10 h-10"}>
<div className={"absolute w-full h-full bg-primary-container rounded-full pulse-ring"}></div>
<div className={"relative w-3 h-3 bg-primary rounded-full z-10"}></div>
</div>
<div>
<h2 className={"font-headline-md text-headline-md text-on-surface"}>أنت متاح الآن</h2>
<p className={"font-body-md text-body-md text-on-surface-variant"}>Searching for orders...</p>
</div>
</div>
</div>

<div className={"absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"}>
<div className={"relative"}>
<div className={"w-16 h-16 bg-primary-container/20 rounded-full absolute -inset-2 animate-pulse"}></div>
<div className={"w-12 h-12 bg-surface rounded-full shadow-lg border-2 border-primary-container flex items-center justify-center z-10 relative"}>
<span className={"material-symbols-outlined text-primary text-2xl"} style={{ fontVariationSettings: "'FILL' 1" }}>two_wheeler</span>
</div>
<div className={"w-2 h-2 bg-primary rounded-full absolute -bottom-1 left-1/2 transform -translate-x-1/2 z-0"}></div>
</div>
</div>
</main>

<div className={"fixed bottom-[100px] left-0 w-full z-40 px-margin-mobile flex flex-col items-center gap-md"}>

<div className={"w-full max-w-md bg-surface border border-outline-variant/50 rounded-xl shadow-lg p-md flex justify-between items-center"}>
<div className={"flex-1 text-center border-l border-outline-variant/30"}>
<p className={"font-label-md text-label-md text-on-surface-variant mb-xs"}>أرباح اليوم</p>
<p className={"font-headline-lg text-headline-lg text-primary"}>15.5 <span className={"font-label-md text-label-md"}>ر.س</span></p>
</div>
<div className={"flex-1 text-center"}>
<p className={"font-label-md text-label-md text-on-surface-variant mb-xs"}>طلبات اليوم</p>
<p className={"font-headline-lg text-headline-lg text-primary"}>8</p>
</div>
</div>

<button className={"bg-[#5E3C1A] text-white font-headline-md text-headline-md py-md px-xl rounded-xl shadow-lg w-full max-w-xs flex items-center justify-center gap-sm active:scale-95 transition-transform duration-150"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 0" }}>power_settings_new</span>
            إيقاف العمل
        </button>
</div>

<nav className={"fixed bottom-0 w-full z-50 bg-surface dark:bg-surface-container-lowest rounded-t-xl border-t border-outline-variant/50 shadow-lg flex justify-around items-center h-20 px-2 pb-safe"}>

<button aria-label={"Earnings"} className={"flex flex-col items-center justify-center text-on-surface-variant w-16 hover:bg-surface-container-low active:scale-90 transition-all duration-200 rounded-xl py-1.5"}>
<span className={"material-symbols-outlined text-2xl mb-1"} style={{ fontVariationSettings: "'FILL' 0" }}>payments</span>
<span className={"font-label-md text-label-md"}>Earnings</span>
</button>

<button aria-label={"Deliveries"} className={"flex flex-col items-center justify-center text-on-surface-variant w-16 hover:bg-surface-container-low active:scale-90 transition-all duration-200 rounded-xl py-1.5"}>
<span className={"material-symbols-outlined text-2xl mb-1"} style={{ fontVariationSettings: "'FILL' 0" }}>local_shipping</span>
<span className={"font-label-md text-label-md"}>Deliveries</span>
</button>

<button aria-label={"Map"} className={"flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-xl px-4 py-1.5 w-16 active:scale-90 transition-all duration-200"}>
<span className={"material-symbols-outlined text-2xl mb-1"} style={{ fontVariationSettings: "'FILL' 1" }}>explore</span>
<span className={"font-label-md text-label-md font-bold"}>Map</span>
</button>

<button aria-label={"Settings"} className={"flex flex-col items-center justify-center text-on-surface-variant w-16 hover:bg-surface-container-low active:scale-90 transition-all duration-200 rounded-xl py-1.5"}>
<span className={"material-symbols-outlined text-2xl mb-1"} style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
<span className={"font-label-md text-label-md"}>Settings</span>
</button>
</nav>

    </ScreenFrame>
  );
}
