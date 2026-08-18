import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/driver-operations-mobile")({
  head: () => ({
    meta: [
      { title: "Driver Operations &amp; Live Map | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Driver Operations &amp; Live Map \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Driver Operations &amp; Live Map | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Driver Operations &amp; Live Map \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenDriverOperationsMobile,
});

function ScreenDriverOperationsMobile() {
  return (
    <ScreenFrame slug="driver-operations-mobile" title="Driver Operations &amp; Live Map" bodyClassName="bg-surface-cream text-on-surface h-screen flex flex-col overflow-hidden antialiased">
      

<header className={"bg-surface dark:bg-surface-dim border-b border-border-subtle bg-surface-cream docked full-width top-0 h-16 flex justify-between items-center w-full px-stack-md sticky top-0 z-40"}>
<div className={"flex items-center gap-3 cursor-pointer active:opacity-80 transition-transform"}>
<span className={"material-symbols-outlined text-primary dark:text-primary-fixed"} data-icon={"menu"}>menu</span>
<span className={"font-headline-lg-mobile text-headline-lg-mobile font-black text-secondary"}>Tasweeqet Betak</span>
</div>
<div className={"flex items-center gap-4"}>
<span className={"material-symbols-outlined text-on-surface-variant cursor-pointer active:opacity-80"} data-icon={"search"}>search</span>
<span className={"material-symbols-outlined text-on-surface-variant cursor-pointer active:opacity-80"} data-icon={"notifications"}>notifications</span>
<img className={"w-8 h-8 rounded-full object-cover border border-border-subtle"} data-alt={"A small circular avatar of an admin user, wearing a headset, professional warm studio lighting, simple cream background, modern professional aesthetic."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBBovg5hISP8zH7agAWm4QOjZLqijnWIyg3QmPGi6roeekfQBHuj8ie5YMy9E1m7swsvEFVSjW5z5jzVKH7DjrdtOk2r5FvCXZlvIl_ArOFjZpT9a048OAXcK6zLZmnKrDgWZw2I9bDvFl4c8Nl5Y4ypHoKyR87h0vjmUfTxfx66b64C9ybpe1mUCtM4rcYDeR_RjRKBK4g6jprJ10VEpvgRyKjzwqZaAM8CCUb4ECpjGaAR-EWAtZm"} />
</div>
</header>

<main className={"flex-1 flex flex-col relative w-full h-[calc(100vh-64px)]"}>

<div className={"h-1/2 w-full relative z-0"}>

<img className={"w-full h-full object-cover"} data-alt={"A detailed overhead satellite style map of a sprawling modern city layout with winding roads and distinct neighborhoods. The map uses a sophisticated color palette featuring subtle warm cream tones and soft sandy browns, perfectly aligning with a modern corporate aesthetic. Gentle lighting highlights primary routes while secondary streets remain subtly detailed in the background."} data-location={"Riyadh"} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuA9mRgeM1Em76XuFg2TDIEY8zu2uGEd-JERlYLtRp0IgJtgUvBrzrjR43Td92lQ2HMBtFNDOYnJkk3VsoBLjVj7lJFqqcjleCscoiRqth5CdTIDS7Zo8ILUUDJibwqQVOtKzkLDmNxk5eLR8xD0wEPv7MVLXzfWzWnZJV-PUg2fMWlw-ufi4fWfpNBvHgfxyuWr5Yuf_aCf9BPqycswjb3P0vR17S4-Sq5ri9fPl7IdGllD0tE-c6sO"} />

<div className={"absolute top-stack-md right-stack-md flex flex-col gap-stack-sm"}>
<button className={"bg-surface-white w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-border-subtle text-primary"}>
<span className={"material-symbols-outlined"} data-icon={"my_location"}>my_location</span>
</button>
<button className={"bg-surface-white w-10 h-10 rounded-full flex items-center justify-center shadow-md border border-border-subtle text-primary"}>
<span className={"material-symbols-outlined"} data-icon={"layers"}>layers</span>
</button>
</div>

<div className={"absolute top-1/4 left-1/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"}>
<div className={"bg-surface-white px-2 py-1 rounded shadow text-label-md font-label-md text-on-surface border border-border-subtle mb-1 whitespace-nowrap"}>Ali K. - Idle</div>
<div className={"w-6 h-6 bg-primary-container rounded-full border-2 border-surface-white shadow-sm flex items-center justify-center"}>
<div className={"w-2 h-2 bg-on-primary-container rounded-full"}></div>
</div>
</div>
<div className={"absolute top-1/2 left-2/3 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"}>
<div className={"bg-surface-white px-2 py-1 rounded shadow text-label-md font-label-md text-on-surface border border-border-subtle mb-1 whitespace-nowrap"}>Omar S. - Busy</div>
<div className={"w-6 h-6 bg-surface-white rounded-full border-2 border-error text-error shadow-sm flex items-center justify-center"}>
<span className={"material-symbols-outlined text-[14px]"} data-icon={"local_shipping"}>local_shipping</span>
</div>
</div>
<div className={"absolute bottom-1/4 left-1/4 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"}>
<div className={"bg-surface-white px-2 py-1 rounded shadow text-label-md font-label-md text-on-surface border border-border-subtle mb-1 whitespace-nowrap"}>Faisal H. - Online</div>
<div className={"w-6 h-6 bg-success rounded-full border-2 border-surface-white shadow-sm flex items-center justify-center"}>
<span className={"material-symbols-outlined text-[14px] text-surface-white"} data-icon={"check"}>check</span>
</div>
</div>
</div>

<div className={"h-1/2 w-full bg-surface-white rounded-t-xl shadow-[0_-4px_12px_rgba(94,60,26,0.08)] z-10 flex flex-col transition-transform duration-300 ease-in-out border-t border-border-subtle relative -mt-4 pt-2"}>

<div className={"w-full flex justify-center cursor-grab active:cursor-grabbing pb-2"}>
<div className={"bottom-sheet-handle"}></div>
</div>

<div className={"px-stack-md pb-stack-sm border-b border-border-subtle flex justify-between items-center"}>
<div>
<h2 className={"font-headline-md-mobile text-headline-md-mobile text-on-surface"}>Active Drivers</h2>
<p className={"font-body-md text-body-md text-on-surface-variant"}>12 Online · 5 Busy</p>
</div>
<button className={"bg-surface-variant hover:bg-surface-container-high transition-colors p-2 rounded-lg text-on-surface-variant"}>
<span className={"material-symbols-outlined"} data-icon={"filter_list"}>filter_list</span>
</button>
</div>

<div className={"flex-1 overflow-y-auto no-scrollbar p-stack-md flex flex-col gap-stack-sm"}>

<div className={"bg-surface-cream border border-border-subtle rounded-lg p-3 flex items-center gap-3 hover:bg-table-header transition-colors"}>
<div className={"relative"}>
<img className={"w-12 h-12 rounded-full object-cover border border-outline-variant"} data-alt={"Headshot of a professional delivery driver wearing a company uniform, confident expression, well-lit studio lighting against a neutral background."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBOpi4CmKp7VJmtDhpdOOqB0BDeuIu810a-dM4qMsNkLbt0cQEU8u5agYyPr3qefpxMgoRpHzjf9CvyUrdM6uNSCIxpLCkx29KGuJejPorwdmKArULnNGV_l9p9lWfDR6OaGLIm2bvkBnBgHKUIvhWLZnhsCiHIaMyqIEYlysPRmWy-P-450senD7PDed_SF50e7pYb1sAHrNhLftxWRKxN_c_cdG-pzmKiKC81E5r-0wOE1QtiQh1O"} />
<div className={"absolute bottom-0 right-0 w-3 h-3 bg-error rounded-full border-2 border-surface-white"}></div>
</div>
<div className={"flex-1"}>
<h3 className={"font-label-lg text-label-lg text-on-surface"}>Omar S.</h3>
<p className={"font-label-md text-label-md text-on-surface-variant flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"} data-icon={"shopping_bag"}>shopping_bag</span>
                            Order #8892 • 15m away
                        </p>
</div>
<div className={"flex flex-col items-end gap-1"}>
<span className={"bg-error-container text-on-error-container px-2 py-0.5 rounded font-label-md text-label-md"}>Busy</span>
<button className={"text-primary font-label-md text-label-md flex items-center gap-1"}>
                            Details <span className={"material-symbols-outlined text-[14px]"} data-icon={"chevron_right"}>chevron_right</span>
</button>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-lg p-3 flex items-center gap-3 hover:bg-table-header transition-colors"}>
<div className={"relative"}>
<img className={"w-12 h-12 rounded-full object-cover border border-outline-variant"} data-alt={"Headshot of a professional female delivery driver smiling, wearing a subtle company uniform, soft natural lighting."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBgaSDXagBMBsEyq1qQ4G7GZuzyB3zM6N9FMVMO20UOh0sByKh6kjoQ4O7k8R9quvqaWqK7G5zmZTUNFfb0c76tpx4SC9jQgaYM0kMq4yzqd7qb5AUPxvvQzq-qIYAULSgAl0LpeIjp_plVCyVHC1Xz0PcQR3xmdlLYpJqbvMNfN_N6vGMavnOsxh_5pP7dy6FP-enrQD7BhH0vSD7Z-liM0HqDXyBOzWHXjx7sxndyIDqnaJ1NgzRp"} />
<div className={"absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface-white"}></div>
</div>
<div className={"flex-1"}>
<h3 className={"font-label-lg text-label-lg text-on-surface"}>Sara A.</h3>
<p className={"font-label-md text-label-md text-on-surface-variant flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"} data-icon={"location_on"}>location_on</span>
                            Downtown Area
                        </p>
</div>
<div className={"flex flex-col items-end gap-1"}>
<span className={"bg-[#e8f5e9] text-success px-2 py-0.5 rounded font-label-md text-label-md"}>Online</span>
<button className={"text-primary font-label-md text-label-md flex items-center gap-1"}>
                            Assign <span className={"material-symbols-outlined text-[14px]"} data-icon={"add"}>add</span>
</button>
</div>
</div>

<div className={"bg-surface-white border border-border-subtle rounded-lg p-3 flex items-center gap-3 hover:bg-table-header transition-colors"}>
<div className={"relative"}>
<img className={"w-12 h-12 rounded-full object-cover border border-outline-variant"} data-alt={"Headshot of a mature delivery driver looking focused, wearing a cap and uniform, well-lit professional portrait."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDMdIcb3WiVNj2BymBkwWjmHWi0U_jO2nuWH1DgeBbg4FfjkT5OWQ7Ko4-BhbNWdXe3KoP0lwV5O2atONZlkY0XJgZ_qSUFqGOv0TS6xNAN1tyReuIfGaHwaN6cFurAPQ8CXjyjEHQwHXJTLj2YL9OsSwoUNnAvyyd2eJl2a9C88fCCuBYIvYUTYYy8Xwg6t7QorqPq7K3AM2mLe0N3kaFGYvl7f2CgZi3rIePJgadelynrzvB5nWOR"} />
<div className={"absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-surface-white"}></div>
</div>
<div className={"flex-1"}>
<h3 className={"font-label-lg text-label-lg text-on-surface"}>Faisal H.</h3>
<p className={"font-label-md text-label-md text-on-surface-variant flex items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"} data-icon={"location_on"}>location_on</span>
                            North District
                        </p>
</div>
<div className={"flex flex-col items-end gap-1"}>
<span className={"bg-[#e8f5e9] text-success px-2 py-0.5 rounded font-label-md text-label-md"}>Online</span>
<button className={"text-primary font-label-md text-label-md flex items-center gap-1"}>
                            Assign <span className={"material-symbols-outlined text-[14px]"} data-icon={"add"}>add</span>
</button>
</div>
</div>
</div>
</div>
</main>


    </ScreenFrame>
  );
}
