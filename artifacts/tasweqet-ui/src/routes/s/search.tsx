import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/search")({
  head: () => ({
    meta: [
      { title: "Tasweeqet Betak - Search | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Search \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Tasweeqet Betak - Search | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Tasweeqet Betak - Search \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenSearch,
});

function ScreenSearch() {
  return (
    <ScreenFrame slug="search" title="Tasweeqet Betak - Search" bodyClassName="font-body-md text-on-surface flex flex-col min-h-screen">
      

<header className={"sticky top-0 z-40 bg-surface/90 backdrop-blur-md pt-6 pb-4 px-margin-mobile md:px-margin-desktop border-b border-outline-variant/30"}>
<div className={"max-w-screen-xl mx-auto w-full"}>
<div className={"flex items-center gap-4"}>
<button className={"text-on-surface-variant hover:text-on-surface transition-colors"}>
<span className={"material-symbols-outlined text-3xl"}>arrow_forward</span>
</button>
<div className={"relative flex-1"}>
<span className={"material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[#8A6742]"}>search</span>
<input className={"search-input w-full py-3 pr-12 pl-4 font-body-md text-on-surface focus:ring-0"} placeholder={"\u062f\u0648\u0631 \u0639\u0644\u0649 \u0645\u0637\u0639\u0645\u060c \u0645\u0646\u062a\u062c\u060c \u0623\u0648 \u0623\u064a \u062d\u0627\u062c\u0629 \u0645\u062d\u062a\u0627\u062c\u0647\u0627"} type={"text"} />
<button className={"absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"}>
<span className={"material-symbols-outlined"}>mic</span>
</button>
</div>
</div>

<div className={"flex overflow-x-auto gap-3 mt-4 pb-2 snap-x hide-scrollbar"}>
<button className={"chip shrink-0 px-4 py-2 flex items-center gap-2 font-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors snap-start"}>
<span className={"material-symbols-outlined text-[18px]"}>tune</span>
                    ترتيب
                </button>
<button className={"chip shrink-0 px-4 py-2 flex items-center gap-2 font-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors snap-start"}>
<span className={"material-symbols-outlined text-[18px]"}>star</span>
                    التقييم
                </button>
<button className={"chip shrink-0 px-4 py-2 flex items-center gap-2 font-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors snap-start"}>
<span className={"material-symbols-outlined text-[18px]"}>schedule</span>
                    وقت التوصيل
                </button>
<button className={"chip shrink-0 px-4 py-2 flex items-center gap-2 font-label-md text-on-surface-variant hover:bg-surface-container-high transition-colors snap-start"}>
<span className={"material-symbols-outlined text-[18px]"}>local_offer</span>
                    العروض
                </button>
</div>
</div>
</header>
<main className={"flex-1 max-w-screen-xl mx-auto w-full px-margin-mobile md:px-margin-desktop py-lg"}>

<section className={"mb-xl"}>
<div className={"flex justify-between items-center mb-md"}>
<h2 className={"font-headline-md-mobile md:font-headline-md text-on-surface font-semibold"}>عمليات البحث الأخيرة</h2>
<button className={"ghost-btn font-label-md"}>مسح الكل</button>
</div>
<div className={"flex flex-wrap gap-3"}>
<button className={"card-level-1 card-hover px-4 py-2 rounded-full flex items-center gap-2 font-body-md text-on-surface-variant transition-all"}>
<span className={"material-symbols-outlined text-lg text-outline"}>history</span>
                    بيتزا مارجريتا
                </button>
<button className={"card-level-1 card-hover px-4 py-2 rounded-full flex items-center gap-2 font-body-md text-on-surface-variant transition-all"}>
<span className={"material-symbols-outlined text-lg text-outline"}>history</span>
                    سوبر ماركت
                </button>
<button className={"card-level-1 card-hover px-4 py-2 rounded-full flex items-center gap-2 font-body-md text-on-surface-variant transition-all"}>
<span className={"material-symbols-outlined text-lg text-outline"}>history</span>
                    صيدلية العزبي
                </button>
</div>
</section>

<section>
<h2 className={"font-headline-md-mobile md:font-headline-md text-on-surface font-semibold mb-md"}>تصنيفات شائعة</h2>
<div className={"grid grid-cols-2 md:grid-cols-4 gap-4"}>

<a className={"col-span-2 row-span-2 card-level-1 card-hover rounded-xl overflow-hidden relative group h-48 md:h-64 flex flex-col justify-end p-4 transition-all"} href={"#"}>
<div className={"absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"} data-alt={"A vibrant overhead shot of fresh, colorful groceries including vegetables, fruits, and bread scattered artistically on a rustic wooden table. Warm, inviting natural light highlighting the textures. Bright and modern aesthetic."} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCpCeYeIyuMGDBn2zip0PIkVj-todMi8aPv2vE7-Oz1iauR_Ko_aZtLPR8z7U_UIAebB40TNq1BAJXIflnNGBCPMH9nToXzLX_gjDU94yrILdTBQDaXCIu-v6SFQYeTo4JuD16sTevaTFgZBJR6bbdRy1STSlFlTMjqXZNWSZWUNspFvb4oUZK0ovIb4TOflk_zIE58qP0j98F9ny7WkWHduGxiBQYplbjKXnETxlucemSxzy-j3U0r')" }}></div>
<div className={"absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"}></div>
<h3 className={"relative z-10 font-headline-lg-mobile text-white font-bold"}>البقالة والسوبر ماركت</h3>
</a>

<a className={"card-level-1 card-hover rounded-xl overflow-hidden relative group h-32 md:h-full flex flex-col justify-end p-4 transition-all"} href={"#"}>
<div className={"absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"} data-alt={"A close up shot of a delicious, juicy burger with melted cheese and fresh lettuce on a wooden board. Warm, appetizing lighting with a slightly blurred background to emphasize the food. Fast food aesthetic."} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuC6oQEOH2n--B3pX-to6aurUWIPdLV9e84k4xF6LAy1b7fpquK7dFu7ZniY7yQuqTMRBb0FV1JQgDo5qfmgzbkk71-BlWCScUgppOa4CXzi6c2DZNrrLeuNj9ze3mMt8iyFHVly_DoCo5aKoc5NU0zxzju4LlXmMPMYqX7hSx-EEExeFIGzfFlRHkUXJE3nKyUIn7thpI41DwAX-R6wSICbk4lJMi_ptZobJGJsdbLwHJEDhB9jgHMf')" }}></div>
<div className={"absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"}></div>
<h3 className={"relative z-10 font-headline-md text-white font-bold"}>وجبات سريعة</h3>
</a>

<a className={"card-level-1 card-hover rounded-xl overflow-hidden relative group h-32 md:h-full flex flex-col justify-end p-4 transition-all"} href={"#"}>
<div className={"absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"} data-alt={"A clean, modern flat lay of assorted pharmacy items like pill bottles, blister packs, and a stethoscope on a pristine white background with soft blue shadows. Clinical yet approachable aesthetic."} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuADGrCbA1hitdb66KL4310d1adz_a5M14Q2D67wM-2D6kfolliu1svlJMLXJFKOazXXEK7s7o4euF2aIqV4ebvZjxkpS3IogyQVfVBA7OVzWpgn2QszlMtl1Qk14RDH2F00Oac56yh3nljnnQG2vQv8HUgt0p_3Pb6_TIZY7RO9ifYyTZTgPNEePl-Qt_0-470mig9nt1Rv3endRi_dMeEadsu-IbUiROHo1YTRElkgLMRqjJu9E-cG')" }}></div>
<div className={"absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"}></div>
<h3 className={"relative z-10 font-headline-md text-white font-bold"}>الصيدليات</h3>
</a>

<a className={"card-level-1 card-hover rounded-xl overflow-hidden relative group h-32 flex flex-col justify-end p-4 transition-all"} href={"#"}>
<div className={"absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"} data-alt={"A steaming cup of artisanal cappuccino with latte art on a saucer, placed on a dark marble cafe table. Warm, cozy, low-key lighting suggesting a relaxing afternoon break. Coffee shop aesthetic."} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAjNLA3XJHDLG_yTAu2J0p-AYOvzO9I1B96eVwIvr_Kt0Y5clV2iPQ0PuXFLBzo8yDZ2Q6DbTSz-OLtoYyT9_0kZyXRIKQaM9lTJkhvKDKzC6bgmr8mdLBKzu1wiHuz5bAzTYZty1PS6sXMz3vCz18kTOQM6PgasoGc2SIXLsJAJFt9fbBnm-aJGcubEI2RZlxn73PNMOwHwbQ9Xr5vmwfm-9eXr6yyqaWzwdMcwQpTT1WkzXZkKOLp')" }}></div>
<div className={"absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"}></div>
<h3 className={"relative z-10 font-headline-md text-white font-bold"}>قهوة ومشروبات</h3>
</a>

<a className={"card-level-1 card-hover rounded-xl overflow-hidden relative group h-32 flex flex-col justify-end p-4 transition-all"} href={"#"}>
<div className={"absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"} data-alt={"A colorful display of fresh, decadent pastries and cakes in a brightly lit bakery window. High-key lighting, soft and sweet aesthetic emphasizing the textures of frosting and baked goods."} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCWK3lHWo3USrzdLA8zCuyNCiQvDtQmkmyk5te4EMHMLHhHF1bR-b2ix8K_TOfyAhqr7bZcb6nDvzgtcsli7XSfR7Lx-MfIpjS3J4WMUmWJoivGCaP6z3hW-cRdRi5m2MyaJwkRKaj-_W8PPp6PT28kkvyzANEg-Yjbv3wekEJqN0Jr3ifJJNFmGJTXDrAFc-cqmtdEIG3DpPH7lQcqTHrVIxAPpFiOVRGb6LfZe-eEJ9PFWYYUV2rC')" }}></div>
<div className={"absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"}></div>
<h3 className={"relative z-10 font-headline-md text-white font-bold"}>مخبوزات وحلويات</h3>
</a>
</div>
</section>
</main>

    </ScreenFrame>
  );
}
