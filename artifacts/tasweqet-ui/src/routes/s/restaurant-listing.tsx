import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/restaurant-listing")({
  head: () => ({
    meta: [
      { title: "\u0645\u0637\u0627\u0639\u0645 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 \u0645\u0637\u0627\u0639\u0645 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "\u0645\u0637\u0627\u0639\u0645 | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 \u0645\u0637\u0627\u0639\u0645 \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenRestaurantListing,
});

function ScreenRestaurantListing() {
  return (
    <ScreenFrame slug="restaurant-listing" title="\u0645\u0637\u0627\u0639\u0645" bodyClassName="bg-background text-on-background font-body-md min-h-screen pb-24 md:pb-0 flex flex-col md:flex-row">
      

<header className={"md:hidden flex flex-row-reverse justify-between items-center px-margin-mobile w-full backdrop-blur-md bg-surface dark:bg-surface-dim text-primary dark:text-primary-fixed-dim border-b border-outline-variant dark:border-outline flat no shadows top-0 sticky z-50 h-16"}>
<div className={"flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors cursor-pointer active:opacity-80 duration-150"}>
<span className={"material-symbols-outlined"} data-icon={"location_on"}>location_on</span>
</div>
<div className={"font-headline-lg-mobile text-headline-lg-mobile font-bold text-secondary dark:text-secondary-fixed-dim"}>
            مطاعم
        </div>
<div className={"flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors cursor-pointer active:opacity-80 duration-150"}>
<span className={"material-symbols-outlined"} data-icon={"notifications"}>notifications</span>
</div>
</header>

<nav className={"hidden md:flex flex-col p-md h-screen sticky right-0 top-0 border-l border-outline-variant dark:border-outline bg-surface-container-low dark:bg-surface-dim text-primary dark:text-primary-fixed-dim w-72 flex-shrink-0 z-40"}>
<div className={"flex flex-col items-end mb-lg"}>
<div className={"font-headline-xl text-headline-xl text-secondary mb-lg"}>Tasweeqet Betak</div>
<div className={"flex items-center gap-sm flex-row-reverse w-full"}>
<img className={"w-12 h-12 rounded-full object-cover border border-outline-variant"} data-alt={"A stylized portrait icon of a confident local merchant, looking welcoming and professional. Warm lighting, flat vector style with soft shadows, using a palette of deep brown and cream to match the brand identity."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAJjURM12e7_WCtbVa8zeLFN6nZYjnTX_zMO0MN3Aw0rie24m-hnK-K7HkrWnV31q4DrIIu0clBie-xUY2mklBfosQYusXfOBlXDpRDg0dyXWOdZyeYNvChrVtrqKBZQK3RKQGwsl2kjxbrUkRi9FAzVpGXKd83A4NllNUpefntKk73Q9A1QBx2VBJwCOILP280bRXbzD0GqUW37SCJivsvmzcPJIwETITPJo5HJUUQBd4bpeqj6V1v"} />
<div className={"flex flex-col text-right"}>
<span className={"font-headline-md text-headline-md text-on-surface"}>متجر التوفير</span>
<span className={"font-label-md text-label-md text-on-surface-variant"}>تاجر معتمد</span>
</div>
</div>
</div>
<ul className={"flex flex-col gap-sm flex-grow"}>
<li className={"flex items-center gap-md p-md rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high transition-all duration-200 cursor-pointer flex-row-reverse active:brightness-95"}>
<span className={"material-symbols-outlined"} data-icon={"dashboard"}>dashboard</span>
<span className={"font-label-lg text-label-lg"}>لوحة التحكم</span>
</li>
<li className={"flex items-center gap-md p-md rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high transition-all duration-200 cursor-pointer flex-row-reverse active:brightness-95"}>
<span className={"material-symbols-outlined"} data-icon={"shopping_bag"}>shopping_bag</span>
<span className={"font-label-lg text-label-lg"}>الطلبات</span>
</li>

<li className={"flex items-center gap-md p-md bg-secondary text-on-secondary rounded-lg font-bold transition-all duration-200 cursor-pointer flex-row-reverse active:brightness-95"}>
<span className={"material-symbols-outlined"} data-icon={"inventory_2"} data-weight={"fill"} style={{ fontVariationSettings: "'FILL' 1" }}>inventory_2</span>
<span className={"font-label-lg text-label-lg"}>المنتجات</span>
</li>
<li className={"flex items-center gap-md p-md rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high transition-all duration-200 cursor-pointer flex-row-reverse active:brightness-95"}>
<span className={"material-symbols-outlined"} data-icon={"analytics"}>analytics</span>
<span className={"font-label-lg text-label-lg"}>التحليلات</span>
</li>
<li className={"flex items-center gap-md p-md rounded-lg text-on-surface-variant dark:text-outline hover:bg-surface-container-high transition-all duration-200 cursor-pointer flex-row-reverse active:brightness-95 mt-auto"}>
<span className={"material-symbols-outlined"} data-icon={"settings"}>settings</span>
<span className={"font-label-lg text-label-lg"}>الإعدادات</span>
</li>
</ul>
</nav>

<main className={"flex-1 w-full max-w-7xl mx-auto flex flex-col pt-lg"}>

<div className={"hidden md:flex justify-between items-center px-margin-desktop mb-xl w-full"}>
<h1 className={"font-headline-xl text-headline-xl text-on-surface"}>المطاعم</h1>
<div className={"flex items-center gap-md"}>
<div className={"relative"}>
<span className={"material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant"}>search</span>
<input className={"bg-surface-container-lowest border border-outline-variant rounded-full py-2 pr-10 pl-4 font-body-md text-on-surface w-64 focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container placeholder-on-tertiary-container"} dir={"rtl"} placeholder={"\u0627\u0628\u062d\u062b \u0639\u0646 \u0645\u0637\u0639\u0645..."} type={"text"} />
</div>
</div>
</div>

<section className={"mb-lg px-margin-mobile md:px-margin-desktop w-full"}>
<div className={"flex overflow-x-auto gap-md no-scrollbar pb-2 flex-row-reverse"}>
<button className={"flex-shrink-0 bg-primary-container text-on-tertiary-fixed font-label-lg text-label-lg px-6 py-2 rounded-full font-bold shadow-[0_4px_8px_rgba(94,60,26,0.04)]"}>الكل</button>
<button className={"flex-shrink-0 bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-label-lg text-label-lg px-6 py-2 rounded-full hover:bg-surface-container-low transition-colors"}>برجر</button>
<button className={"flex-shrink-0 bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-label-lg text-label-lg px-6 py-2 rounded-full hover:bg-surface-container-low transition-colors"}>بيتزا</button>
<button className={"flex-shrink-0 bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-label-lg text-label-lg px-6 py-2 rounded-full hover:bg-surface-container-low transition-colors"}>شاورما</button>
<button className={"flex-shrink-0 bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-label-lg text-label-lg px-6 py-2 rounded-full hover:bg-surface-container-low transition-colors"}>حلويات</button>
<button className={"flex-shrink-0 bg-surface-container-lowest border border-outline-variant text-on-surface-variant font-label-lg text-label-lg px-6 py-2 rounded-full hover:bg-surface-container-low transition-colors"}>مشروبات</button>
</div>
</section>

<section className={"px-margin-mobile md:px-margin-desktop flex-1 mb-xl"}>
<div className={"grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg w-full"} dir={"rtl"}>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300 relative cursor-pointer flex flex-col"}>
<div className={"absolute top-3 left-3 bg-error text-on-error font-label-md text-label-md px-2 py-1 rounded-md z-10 font-bold"}>خصم 20%</div>
<div className={"relative w-full h-48 overflow-hidden"}>
<img className={"w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"} data-alt={"A juicy, towering double cheeseburger with fresh lettuce and tomato, presented on a wooden board in a warm, inviting rustic restaurant setting. Soft background blur, vibrant yellow and deep brown color palette, high-contrast lighting."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBwrLpb7S9GeXID0-qOAbO6Xl72PNrROb5q1QxPNgWAQ4yeXOTRvJj7JCQoZ_R0zm0vNmi4qybe-jO641IWerOGhhALvRxyvRwn3KEcFxOBa2Al1GhfRT7xRBoCAV8eu_Lvd2O5KqTc1iQeQxp_DSl0oUlhibVcy8CR2npscw5JLNKj_-N8IY6CjkgwZ0X9kclzIiACK7NiEoNlDtCWkYUFbNS6zRK15v1vNce8Na3JdTEaKs-_DGDV"} />
</div>
<div className={"p-4 flex flex-col flex-grow"}>
<div className={"flex justify-between items-start mb-2"}>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>برجر هاوس</h3>
<div className={"flex items-center gap-xs bg-surface-container-low px-2 py-1 rounded-md"}>
<span className={"font-label-md text-label-md font-bold text-on-surface"}>4.8</span>
<span className={"material-symbols-outlined text-primary-container text-[16px]"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
</div>
<p className={"font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-1"}>برجر لحم، دجاج مقرمش، بطاطس بالجبنة</p>
<div className={"mt-auto flex justify-between items-center border-t border-surface-variant pt-3"}>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>schedule</span>
<span className={"font-label-md text-label-md"}>25-35 دقيقة</span>
</div>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>two_wheeler</span>
<span className={"font-label-md text-label-md"}>15 ج.م</span>
</div>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300 relative cursor-pointer flex flex-col"}>
<div className={"absolute top-3 left-3 bg-primary-container text-on-primary-container font-label-md text-label-md px-2 py-1 rounded-md z-10 font-bold"}>توصيل مجاني</div>
<div className={"relative w-full h-48 overflow-hidden"}>
<img className={"w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"} data-alt={"A freshly baked pepperoni pizza with bubbling cheese and slightly charred crust, sitting on a metal serving tray in a lively Italian pizzeria. Warm overhead lighting emphasizing the red sauce and golden cheese, optimistic and energetic mood."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDbc388cBp8k2ONvNBFKrRrzwmg6jc1YaXC0aBR8nEsbIjK8dm7cI2SUpyQHoEcjjPixtNsnAbdDp-6dfCJmVRzZbrKQmC18e-CsAfObScEEkttaafltNf_-_pZBRKE4q9OCvu26R8PdnKdbDg_sQsys2P95TZxkLPX_JiBIQ9K79uc1V9mE_xBRT3nUO1BXFpMXRdQsM4sA50JCwIYeSdt7jyyPma5ItFrx7ej2XeVwP0hICq6kUdK"} />
</div>
<div className={"p-4 flex flex-col flex-grow"}>
<div className={"flex justify-between items-start mb-2"}>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>بيتزا مارغريتا</h3>
<div className={"flex items-center gap-xs bg-surface-container-low px-2 py-1 rounded-md"}>
<span className={"font-label-md text-label-md font-bold text-on-surface"}>4.6</span>
<span className={"material-symbols-outlined text-primary-container text-[16px]"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
</div>
<p className={"font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-1"}>بيتزا إيطالية أصلية، باستا، مقبلات</p>
<div className={"mt-auto flex justify-between items-center border-t border-surface-variant pt-3"}>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>schedule</span>
<span className={"font-label-md text-label-md"}>30-45 دقيقة</span>
</div>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>two_wheeler</span>
<span className={"font-label-md text-label-md line-through mr-1"}>10 ج.م</span>
<span className={"font-label-md text-label-md text-primary font-bold"}>مجاناً</span>
</div>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300 relative cursor-pointer flex flex-col"}>
<div className={"relative w-full h-48 overflow-hidden"}>
<img className={"w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"} data-alt={"A close-up shot of a savory chicken shawarma wrap being carved from a rotating spit, with garlic sauce drizzling over fresh vegetables. Warm amber tones, appetizing and authentic local street food aesthetic, high clarity."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDdLpuE5WSouOlq2dWcHtHIXUOIPcuCI3FazRNMHCB-3C_8QR-JJid5U_JuQttftRAk7XdQEUBtbGSaSizR_sNlyxPWhVwr1gGFTR0Mon97zStPaKt12gMgvk12y8C1U9e5L5SM66ZBVaygIY0LwLsewdMsURIYfWirRz3ERbYCqRqC7ijFfsL0HLBZ6GWbilyYtTrh7xpnPocCH7VyxG4V4-T0Tf7y_Fou8QtDQ2a_Oedpu8CAzwVe"} />
</div>
<div className={"p-4 flex flex-col flex-grow"}>
<div className={"flex justify-between items-start mb-2"}>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>شاورما الشام</h3>
<div className={"flex items-center gap-xs bg-surface-container-low px-2 py-1 rounded-md"}>
<span className={"font-label-md text-label-md font-bold text-on-surface"}>4.9</span>
<span className={"material-symbols-outlined text-primary-container text-[16px]"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
</div>
<p className={"font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-1"}>شاورما عربي، فلافل، فتة شاورما</p>
<div className={"mt-auto flex justify-between items-center border-t border-surface-variant pt-3"}>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>schedule</span>
<span className={"font-label-md text-label-md"}>15-25 دقيقة</span>
</div>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>two_wheeler</span>
<span className={"font-label-md text-label-md"}>12 ج.م</span>
</div>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-shadow duration-300 relative cursor-pointer flex flex-col"}>
<div className={"absolute top-3 left-3 bg-secondary text-on-secondary font-label-md text-label-md px-2 py-1 rounded-md z-10 font-bold"}>جديد</div>
<div className={"relative w-full h-48 overflow-hidden"}>
<img className={"w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"} data-alt={"A decadent slice of rich chocolate cake with a molten center and a scoop of vanilla ice cream on top, resting on a clean white plate. Soft, appealing light mode aesthetic, emphasizing the appetizing brown and cream colors of the dessert."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuCcbjL09y1hruZVqJ_Gt8Og4S2ciWTwAehAa5_Elnd8UCP0kDhGAIpwhhlEqHoY1n6xTYxstizmXqX8DzEj5xuTmdhnfwfqjzpq1VxlN-UYH6I_MTNazFa50OOmk241dWH1RRNUSxsHgM_TcTJ-G6Bs_ziR1Tpw-eUQ_xBfwojsjEu2qrx5why03_8aXjMH1bHG25olP73q0sDSxzjJwIwRJ5G5iAFWpy6EFdbLS_6y5C8RbPkIa0hA"} />
</div>
<div className={"p-4 flex flex-col flex-grow"}>
<div className={"flex justify-between items-start mb-2"}>
<h3 className={"font-headline-md text-headline-md text-on-surface"}>حلويات السلطان</h3>
<div className={"flex items-center gap-xs bg-surface-container-low px-2 py-1 rounded-md"}>
<span className={"font-label-md text-label-md font-bold text-on-surface"}>4.5</span>
<span className={"material-symbols-outlined text-primary-container text-[16px]"} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
</div>
</div>
<p className={"font-body-md text-body-md text-on-surface-variant mb-4 line-clamp-1"}>كنافة، بسبوسة، حلويات شرقية وغربية</p>
<div className={"mt-auto flex justify-between items-center border-t border-surface-variant pt-3"}>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>schedule</span>
<span className={"font-label-md text-label-md"}>40-50 دقيقة</span>
</div>
<div className={"flex items-center gap-1 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[18px]"}>two_wheeler</span>
<span className={"font-label-md text-label-md"}>20 ج.م</span>
</div>
</div>
</div>
</div>
</div>
</section>
</main>

<nav className={"md:hidden flex flex-row-reverse justify-around items-center w-full pb-safe pt-2 px-2 bg-surface dark:bg-surface-dim border-t border-outline-variant dark:border-outline flat no shadows docked full-width bottom-0 fixed z-50 h-16"}>

<a className={"flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-4 py-1 active:scale-95 transition-transform duration-200"} href={"#"}>
<span className={"material-symbols-outlined mb-1"} data-icon={"home"}>home</span>
<span className={"font-label-md text-label-md"}>الرئيسية</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined mb-1"} data-icon={"receipt_long"}>receipt_long</span>
<span className={"font-label-md text-label-md"}>طلباتي</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined mb-1"} data-icon={"local_offer"}>local_offer</span>
<span className={"font-label-md text-label-md"}>العروض</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-xl transition-colors"} href={"#"}>
<span className={"material-symbols-outlined mb-1"} data-icon={"person"}>person</span>
<span className={"font-label-md text-label-md"}>حسابي</span>
</a>
</nav>

    </ScreenFrame>
  );
}
