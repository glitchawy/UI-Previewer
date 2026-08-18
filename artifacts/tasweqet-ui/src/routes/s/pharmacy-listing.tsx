import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/pharmacy-listing")({
  head: () => ({
    meta: [
      { title: "Tasweeqet Betak - \u0635\u064a\u062f\u0644\u064a\u0627\u062a | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - \u0635\u064a\u062f\u0644\u064a\u0627\u062a \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Tasweeqet Betak - \u0635\u064a\u062f\u0644\u064a\u0627\u062a | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - \u0635\u064a\u062f\u0644\u064a\u0627\u062a \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenPharmacyListing,
});

function ScreenPharmacyListing() {
  return (
    <ScreenFrame slug="pharmacy-listing" title="Tasweeqet Betak - \u0635\u064a\u062f\u0644\u064a\u0627\u062a" bodyClassName="font-body-md text-on-background min-h-screen flex flex-col relative pb-[80px] md:pb-0">
      

<header className={"bg-surface dark:bg-surface-dim font-headline-md text-headline-md-mobile docked full-width top-0 sticky z-50 border-b border-outline-variant dark:border-outline flat no shadows"}>
<div className={"flex flex-row-reverse justify-between items-center px-margin-mobile w-full backdrop-blur-md h-16"}>
<div className={"font-headline-lg-mobile text-headline-lg-mobile font-bold text-secondary dark:text-secondary-fixed-dim flex items-center gap-2 flex-row-reverse"}>
<span className={"material-symbols-outlined text-primary dark:text-primary-fixed-dim"} data-icon={"location_on"}>location_on</span>
<span>Tasweeqet Betak</span>
</div>
<button className={"text-primary dark:text-primary-fixed-dim hover:bg-surface-container-low dark:hover:bg-surface-container-highest transition-colors rounded-full p-2 active:opacity-80 duration-150"}>
<span className={"material-symbols-outlined"} data-icon={"notifications"}>notifications</span>
</button>
</div>
</header>
<div className={"flex flex-1"}>

<nav className={"hidden lg:flex flex-col p-md h-screen fixed right-0 top-0 border-l border-outline-variant dark:border-outline bg-surface-container-low dark:bg-surface-dim w-72 pt-20"}>
<div className={"flex flex-col items-end mb-lg px-4"}>
<h2 className={"font-headline-xl text-headline-xl text-secondary"}>متجر التوفير</h2>
<p className={"text-on-surface-variant font-label-md text-label-md"}>تاجر معتمد</p>
</div>
<ul className={"flex flex-col gap-2 w-full font-label-lg text-label-lg"}>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 text-on-surface-variant dark:text-outline hover:bg-surface-container-high rounded-lg transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"dashboard"}>dashboard</span>
<span>لوحة التحكم</span>
</a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 text-on-surface-variant dark:text-outline hover:bg-surface-container-high rounded-lg transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"shopping_bag"}>shopping_bag</span>
<span>الطلبات</span>
</a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 bg-secondary text-on-secondary rounded-lg font-bold transition-all duration-200 active:brightness-95"} href={"#"}>
<span className={"material-symbols-outlined icon-filled"} data-icon={"inventory_2"}>inventory_2</span>
<span>المنتجات</span>
</a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 text-on-surface-variant dark:text-outline hover:bg-surface-container-high rounded-lg transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"analytics"}>analytics</span>
<span>التحليلات</span>
</a>
</li>
<li>
<a className={"flex flex-row-reverse items-center gap-3 p-3 text-on-surface-variant dark:text-outline hover:bg-surface-container-high rounded-lg transition-all duration-200"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"settings"}>settings</span>
<span>الإعدادات</span>
</a>
</li>
</ul>
</nav>

<main className={"flex-1 lg:mr-72 p-margin-mobile md:p-margin-desktop w-full max-w-7xl mx-auto"}>

<div className={"mb-lg flex flex-row-reverse items-center justify-between"}>
<h1 className={"font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-background"}>صيدليات</h1>
<div className={"relative w-full max-w-sm ml-4"}>
<input className={"w-full h-12 pl-4 pr-12 rounded-full border border-outline-variant bg-surface-container-lowest focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors text-on-surface font-body-md text-body-md placeholder-tertiary"} placeholder={"\u0627\u0628\u062d\u062b \u0641\u064a \u0627\u0644\u0635\u064a\u062f\u0644\u064a\u0627\u062a..."} type={"text"} />
<span className={"material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-tertiary"} data-icon={"search"}>search</span>
</div>
</div>

<div className={"flex flex-row-reverse gap-sm overflow-x-auto pb-4 mb-lg hide-scrollbar snap-x"}>
<button className={"whitespace-nowrap px-6 py-2 rounded-full bg-primary-container text-on-primary-container font-label-lg text-label-lg snap-start"}>الكل</button>
<button className={"whitespace-nowrap px-6 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-lg text-label-lg snap-start"}>أدوية</button>
<button className={"whitespace-nowrap px-6 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-lg text-label-lg snap-start"}>عناية شخصية</button>
<button className={"whitespace-nowrap px-6 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-lg text-label-lg snap-start"}>فيتامينات</button>
<button className={"whitespace-nowrap px-6 py-2 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface hover:bg-surface-container-low transition-colors font-label-lg text-label-lg snap-start"}>عناية بالطفل</button>
</div>

<div className={"grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-md md:gap-lg"}>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-all duration-300 flex flex-col"}>
<div className={"relative w-full aspect-square bg-surface-container-low flex items-center justify-center p-4"}>
<img className={"object-contain w-full h-full mix-blend-multiply"} data-alt={"A clean, minimalist 3D render of a generic white medicine bottle with a simple blue label, placed on a light cream surface. Soft, high-key studio lighting creates a sterile yet approachable pharmacy aesthetic. Gentle shadows add depth without overpowering the bright, modern visual style."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuAI_8U96Pa4AX_MkOPwfSNF6F1Ba6zG4MFYDLATL4J4CHT-BLmzIrafMFmmIQZYj6ajDz43rxSlSh0fgL_e0rAlSRiII__wAcb4xcuW9EctgPnH5tlbEwv61eAPywm9yqJ7u0BWJeNtmyLAihLSj2lVwmBQDyTO9_i39VAV-WgMJ6brhpJets7NEdRl8-kgihp-nPX_lOuPgC1vjQSPdqATVorlagrqw2HbQY4Z-XBwc3qqHDw_7M7i"} />
<div className={"absolute top-2 right-2 bg-error text-on-error px-2 py-1 rounded text-[10px] font-bold flex flex-row-reverse items-center gap-1"}>
<span className={"material-symbols-outlined text-[14px]"} data-icon={"prescription"}>prescriptions</span>
                            وصفة طبية
                        </div>
</div>
<div className={"p-4 flex-1 flex flex-col justify-between"}>
<div>
<p className={"font-label-md text-label-md text-tertiary mb-1 text-right"}>أدوية</p>
<h3 className={"font-headline-md text-headline-md text-on-background line-clamp-2 text-right mb-2"}>بانادول اكسترا 24 قرص</h3>
</div>
<div className={"flex flex-row-reverse items-center justify-between mt-auto"}>
<span className={"font-headline-md text-headline-md text-secondary"}>25 ج.م</span>
<button className={"w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add_shopping_cart"}>add_shopping_cart</span>
</button>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-all duration-300 flex flex-col"}>
<div className={"relative w-full aspect-square bg-surface-container-low flex items-center justify-center p-4"}>
<img className={"object-contain w-full h-full mix-blend-multiply"} data-alt={"A bright, modern flat-lay photograph of various colorful vitamin gummies scattered around a clear plastic jar with a vibrant yellow lid. The background is a warm cream color, and the lighting is soft and inviting, emphasizing the health and wellness category within a clean e-commerce context."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBP5gnRVm_DaYUrGpQgQ65TVkpnkzM16EFzZUc7J0boQlSnywsh0H7z6fthPCKMBZK9aSJepzbHT9HOL0KAG33q9qs7pH16ehys1F71J8xl_STIABfCYUwRGsUCvsKyVuNz9CuElTJW3eXyqifKeo0uQvF6CGLRjnln0ImNnOtYUmQ7DwLIV9k3eByblgdld_j-hvhRF9FpA04o-ZeyYShMZXfor4d21LmmEKQIMFO2WaOg4bjqosXk"} />
</div>
<div className={"p-4 flex-1 flex flex-col justify-between"}>
<div>
<p className={"font-label-md text-label-md text-tertiary mb-1 text-right"}>فيتامينات</p>
<h3 className={"font-headline-md text-headline-md text-on-background line-clamp-2 text-right mb-2"}>سنترم مع لوتين 30 قرص</h3>
</div>
<div className={"flex flex-row-reverse items-center justify-between mt-auto"}>
<span className={"font-headline-md text-headline-md text-secondary"}>350 ج.م</span>
<button className={"w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add_shopping_cart"}>add_shopping_cart</span>
</button>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-all duration-300 flex flex-col"}>
<div className={"relative w-full aspect-square bg-surface-container-low flex items-center justify-center p-4"}>
<img className={"object-contain w-full h-full mix-blend-multiply"} data-alt={"A sophisticated, softly lit product shot of a high-end skincare pump bottle. The bottle is minimalist white with subtle beige typography, standing on a slightly reflective cream surface. The aesthetic is clean, calming, and premium, perfectly suited for a modern pharmacy personal care section."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuBH3RynIl2ZVG_4XPD9Xq7kd4IRVEZJwKlOF4kCYtp4FmFpjF2prv-XNUQXOLDlaZv34QDKNYEPtSDOpPtjWTGENlJfxI6hZDvh7OTVtIgbL8UmGQg6eYSA-1as6FgK8eVaYzGv--HdbvyKCqaNoVdaJhoDqM7bmgjqx6RHmHDaaW7tm9WqQGYj37B3Rc8nChecFT7M2f4BFm-JoV4SvPj-2yRb4hSDPINBuBFJ0YqYQDkzp2UwGXTv"} />
</div>
<div className={"p-4 flex-1 flex flex-col justify-between"}>
<div>
<p className={"font-label-md text-label-md text-tertiary mb-1 text-right"}>عناية شخصية</p>
<h3 className={"font-headline-md text-headline-md text-on-background line-clamp-2 text-right mb-2"}>غسول وجه سيرافي 236 مل</h3>
</div>
<div className={"flex flex-row-reverse items-center justify-between mt-auto"}>
<span className={"font-headline-md text-headline-md text-secondary"}>420 ج.م</span>
<button className={"w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add_shopping_cart"}>add_shopping_cart</span>
</button>
</div>
</div>
</div>

<div className={"bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden group hover:shadow-[0_4px_8px_rgba(94,60,26,0.04)] transition-all duration-300 flex flex-col"}>
<div className={"relative w-full aspect-square bg-surface-container-low flex items-center justify-center p-4"}>
<img className={"object-contain w-full h-full mix-blend-multiply"} data-alt={"A cute and clean studio shot of baby care products, including a pastel yellow baby shampoo bottle and a stack of soft white towels. The scene is illuminated with warm, gentle light against a light cream backdrop, conveying safety, softness, and trust for the baby care category."} src={"https://lh3.googleusercontent.com/aida-public/AB6AXuDI3gp1roaXophbSmoFpkVGAWZw-Pp4qnIpPGJXgoau6rlGndmb5ZfVnZ7NEic_KlorCxmBoMq-5TX19NG5WnCCyvzQbaoUSCnfdYTuGo6gBaRWLEES5z6n8bYLtdPsxiiWAbJu1Eb9NfnPvF0xQLI0UkPQR1WfIMl6mwxFzSYBRzjunetmFLjdVg6h3Falr7E8UTChOp7gSjzxgdGa13VGlxrt8cHNcPQIVghJ-6GJT3DkEaSbDLGF"} />
</div>
<div className={"p-4 flex-1 flex flex-col justify-between"}>
<div>
<p className={"font-label-md text-label-md text-tertiary mb-1 text-right"}>عناية بالطفل</p>
<h3 className={"font-headline-md text-headline-md text-on-background line-clamp-2 text-right mb-2"}>شامبو جونسون للأطفال 500 مل</h3>
</div>
<div className={"flex flex-row-reverse items-center justify-between mt-auto"}>
<span className={"font-headline-md text-headline-md text-secondary"}>95 ج.م</span>
<button className={"w-10 h-10 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:bg-primary hover:text-on-primary transition-colors"}>
<span className={"material-symbols-outlined"} data-icon={"add_shopping_cart"}>add_shopping_cart</span>
</button>
</div>
</div>
</div>
</div>
</main>
</div>

<nav className={"md:hidden bg-surface dark:bg-surface-dim font-label-md text-label-md docked full-width bottom-0 fixed z-50 border-t border-outline-variant dark:border-outline flat no shadows pb-safe pt-2 px-2 flex flex-row-reverse justify-around items-center w-full"}>
<a className={"flex flex-col items-center justify-center bg-primary-container dark:bg-primary text-on-primary-container dark:text-on-primary rounded-xl px-4 py-1 scale-95 transition-transform duration-200"} href={"#"}>
<span className={"material-symbols-outlined icon-filled"} data-icon={"home"}>home</span>
<span>الرئيسية</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"receipt_long"}>receipt_long</span>
<span>طلباتي</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"local_offer"}>local_offer</span>
<span>العروض</span>
</a>
<a className={"flex flex-col items-center justify-center text-on-surface-variant dark:text-outline p-2 hover:bg-surface-container-high dark:hover:bg-surface-container-highest rounded-xl"} href={"#"}>
<span className={"material-symbols-outlined"} data-icon={"person"}>person</span>
<span>حسابي</span>
</a>
</nav>


    </ScreenFrame>
  );
}
