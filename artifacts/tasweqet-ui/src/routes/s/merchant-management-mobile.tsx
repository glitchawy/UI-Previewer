import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/merchant-management-mobile")({
  head: () => ({
    meta: [
      { title: "Merchant Verification - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Merchant Verification - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Merchant Verification - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Merchant Verification - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenMerchantManagementMobile,
});

function ScreenMerchantManagementMobile() {
  return (
    <ScreenFrame slug="merchant-management-mobile" title="Merchant Verification - Tasweeqet Betak" bodyClassName="bg-surface-cream text-on-surface font-body-md antialiased min-h-screen flex flex-col md:hidden">
      

<header className={"bg-surface border-b border-border-subtle sticky top-0 z-40 w-full h-16 px-4 flex justify-between items-center shrink-0"}>
<div className={"flex items-center gap-3"}>
<button className={"text-on-surface-variant hover:bg-surface-container-high transition-all p-2 rounded-full active:opacity-80"}>
<span className={"material-symbols-outlined"} data-icon={"menu"}>menu</span>
</button>
<h1 className={"font-headline-md text-headline-md font-black text-secondary"}>Merchants</h1>
</div>
<div className={"flex items-center gap-2"}>
<button className={"text-on-surface-variant hover:bg-surface-container-high transition-all p-2 rounded-full active:opacity-80"}>
<span className={"material-symbols-outlined"} data-icon={"search"}>search</span>
</button>
<button className={"text-on-surface-variant hover:bg-surface-container-high transition-all p-2 rounded-full active:opacity-80"}>
<span className={"material-symbols-outlined"} data-icon={"filter_list"}>filter_list</span>
</button>
</div>
</header>

<main className={"flex-1 w-full pb-20 flex flex-col"}>

<div className={"bg-surface border-b border-border-subtle px-4 overflow-x-auto hide-scrollbar shrink-0"}>
<div className={"flex gap-6 min-w-max"}>
<button className={"py-3 px-1 text-primary font-bold border-b-2 border-primary font-label-md text-label-md"}>Pending</button>
<button className={"py-3 px-1 text-on-surface-variant font-label-md text-label-md"}>Active</button>
<button className={"py-3 px-1 text-on-surface-variant font-label-md text-label-md"}>Suspended</button>
</div>
</div>

<div className={"flex-1 overflow-y-auto p-4 flex flex-col gap-4"}>

<div className={"bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:bg-surface transition-colors"}>
<div className={"flex items-start justify-between"}>
<div className={"flex items-center gap-3"}>
<div className={"w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center shrink-0"}>
<img className={"w-full h-full object-cover rounded-lg"} data-alt={"A close up view of a small local bakery storefront with warm lighting and freshly baked goods in the window. The aesthetic is clean and modern professional."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCRkIqIMwcUc_JIzDKm29AgSevdFWQkryck6Oy3IgS9QwmXpcew4IcibM7sh8UzRSx0D6ArsELTCeuheXmSi1D1QjfVDLy4k3EA9FQUxmVBWoev22zKHbNp87wPbBsfgcCrNI-tcvAcIkYPc7hocok8Qc3sf2oP9tGsBo1BQiv-30QKy9BSnLkplZM-VpRLJkbliktC4asgZxkdjaBDHEPgCzTjOelEoYuG9p8wA9lbiP3Wh-R1sd1O"} />
</div>
<div>
<h3 className={"font-label-lg text-label-lg text-on-surface mb-0.5"}>Al-Madina Bakery</h3>
<p className={"font-label-md text-label-md text-on-surface-variant flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>person</span> Ahmed Hassan
                            </p>
</div>
</div>
<span className={"inline-flex items-center px-2 py-1 rounded-md bg-[#FFF8D6] text-on-surface font-label-md text-label-md"}>
                        Pending
                    </span>
</div>
<div className={"flex flex-wrap gap-2 mb-1"}>
<span className={"inline-flex items-center gap-1 text-on-surface-variant bg-surface-container py-1 px-2 rounded font-label-md text-label-md"}>
<span className={"material-symbols-outlined text-[14px]"}>category</span> Bakery
                     </span>
<span className={"inline-flex items-center gap-1 text-on-surface-variant bg-surface-container py-1 px-2 rounded font-label-md text-label-md"}>
<span className={"material-symbols-outlined text-[14px]"}>location_on</span> Riyadh
                     </span>
</div>
<div className={"flex gap-2 pt-2 border-t border-border-subtle mt-auto"}>
<button className={"flex-1 bg-surface-white border border-secondary text-secondary font-label-md text-label-md py-2 rounded-lg flex items-center justify-center gap-2 active:bg-surface-container-low transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"}>description</span> Review
                    </button>
<button className={"flex-1 bg-primary-container text-on-primary-container font-label-md text-label-md py-2 rounded-lg flex items-center justify-center gap-2 active:opacity-90 transition-opacity"}>
<span className={"material-symbols-outlined text-[18px]"}>check_circle</span> Approve
                    </button>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:bg-surface transition-colors"}>
<div className={"flex items-start justify-between"}>
<div className={"flex items-center gap-3"}>
<div className={"w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center shrink-0"}>
<img className={"w-full h-full object-cover rounded-lg"} data-alt={"A modern coffee shop interior with espresso machines and warm wooden accents. The lighting is bright and inviting, typical of a high-end cafe in a modern city."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuACXvxMZZKlW4WGg3ttRc3ZsAKFxKE0VQTR3CMPO6UnYywQHbwWAAd_i8ux7PeeYmUoQF6Lhsz_BZiWKmRZ391UDsH6P2BukCs7N2z7D3fYFx7dJzwY_458-ISiHsNLAxqoSd0WZID0I5wUXNslc94rzjRurfpTUKO1P_Ofz-hiLXvuV4fPEgp_k6mMgmJKqm90QJYDPBpsalhLxpiILJ1NeADMOSt1DV0MwRccHnrks6iy_TIFeEuN"} />
</div>
<div>
<h3 className={"font-label-lg text-label-lg text-on-surface mb-0.5"}>Golden Bean Roasters</h3>
<p className={"font-label-md text-label-md text-on-surface-variant flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>person</span> Fatima Ali
                            </p>
</div>
</div>
<span className={"inline-flex items-center px-2 py-1 rounded-md bg-[#FFF8D6] text-on-surface font-label-md text-label-md"}>
                        Pending
                    </span>
</div>
<div className={"flex flex-wrap gap-2 mb-1"}>
<span className={"inline-flex items-center gap-1 text-on-surface-variant bg-surface-container py-1 px-2 rounded font-label-md text-label-md"}>
<span className={"material-symbols-outlined text-[14px]"}>category</span> Cafe
                     </span>
<span className={"inline-flex items-center gap-1 text-on-surface-variant bg-surface-container py-1 px-2 rounded font-label-md text-label-md"}>
<span className={"material-symbols-outlined text-[14px]"}>location_on</span> Jeddah
                     </span>
</div>
<div className={"flex gap-2 pt-2 border-t border-border-subtle mt-auto"}>
<button className={"flex-1 bg-surface-white border border-secondary text-secondary font-label-md text-label-md py-2 rounded-lg flex items-center justify-center gap-2 active:bg-surface-container-low transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"}>description</span> Review
                    </button>
<button className={"flex-1 bg-primary-container text-on-primary-container font-label-md text-label-md py-2 rounded-lg flex items-center justify-center gap-2 active:opacity-90 transition-opacity"}>
<span className={"material-symbols-outlined text-[18px]"}>check_circle</span> Approve
                    </button>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-xl p-4 flex flex-col gap-4 relative overflow-hidden group hover:bg-surface transition-colors"}>
<div className={"flex items-start justify-between"}>
<div className={"flex items-center gap-3"}>
<div className={"w-12 h-12 rounded-lg bg-surface-variant flex items-center justify-center shrink-0"}>
<div className={"text-on-surface-variant"}><span className={"material-symbols-outlined"} data-icon={"storefront"}>storefront</span></div>
</div>
<div>
<h3 className={"font-label-lg text-label-lg text-on-surface mb-0.5"}>Fresh Mart Groceries</h3>
<p className={"font-label-md text-label-md text-on-surface-variant flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"}>person</span> Omar Saeed
                            </p>
</div>
</div>
<span className={"inline-flex items-center px-2 py-1 rounded-md bg-[#FFF8D6] text-on-surface font-label-md text-label-md"}>
                        Pending
                    </span>
</div>
<div className={"flex flex-wrap gap-2 mb-1"}>
<span className={"inline-flex items-center gap-1 text-on-surface-variant bg-surface-container py-1 px-2 rounded font-label-md text-label-md"}>
<span className={"material-symbols-outlined text-[14px]"}>category</span> Grocery
                     </span>
<span className={"inline-flex items-center gap-1 text-on-surface-variant bg-surface-container py-1 px-2 rounded font-label-md text-label-md"}>
<span className={"material-symbols-outlined text-[14px]"}>location_on</span> Dammam
                     </span>
</div>
<div className={"flex gap-2 pt-2 border-t border-border-subtle mt-auto"}>
<button className={"flex-1 bg-surface-white border border-secondary text-secondary font-label-md text-label-md py-2 rounded-lg flex items-center justify-center gap-2 active:bg-surface-container-low transition-colors"}>
<span className={"material-symbols-outlined text-[18px]"}>description</span> Review
                    </button>
<button className={"flex-1 bg-primary-container text-on-primary-container font-label-md text-label-md py-2 rounded-lg flex items-center justify-center gap-2 active:opacity-90 transition-opacity"}>
<span className={"material-symbols-outlined text-[18px]"}>check_circle</span> Approve
                    </button>
</div>
</div>

<div className={"py-4 flex justify-center"}>
<button className={"text-secondary font-label-md text-label-md flex items-center gap-1"}>
                     Load More <span className={"material-symbols-outlined text-[16px]"}>expand_more</span>
</button>
</div>
</div>
</main>

<nav className={"fixed bottom-0 left-0 w-full bg-surface border-t border-border-subtle flex justify-around items-center h-16 pb-safe z-50"}>
<a className={"flex flex-col items-center justify-center gap-1 text-on-surface-variant opacity-70 w-16 h-full active:scale-95 transition-transform"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"dashboard"}>dashboard</span>
<span className={"font-label-md text-[10px]"}>Home</span>
</a>
<a className={"flex flex-col items-center justify-center gap-1 text-primary font-bold opacity-100 w-16 h-full active:scale-95 transition-transform"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"storefront"} data-weight={"fill"} style={{ fontVariationSettings: "'FILL' 1" }}>storefront</span>
<span className={"font-label-md text-[10px]"}>Merchants</span>
</a>
<a className={"flex flex-col items-center justify-center gap-1 text-on-surface-variant opacity-70 w-16 h-full active:scale-95 transition-transform"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"group"}>group</span>
<span className={"font-label-md text-[10px]"}>Customers</span>
</a>
<a className={"flex flex-col items-center justify-center gap-1 text-on-surface-variant opacity-70 w-16 h-full active:scale-95 transition-transform"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"settings"}>settings</span>
<span className={"font-label-md text-[10px]"}>Settings</span>
</a>
</nav>

    </ScreenFrame>
  );
}
