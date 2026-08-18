import { createFileRoute } from "@tanstack/react-router";
import { ScreenFrame } from "@/components/ScreenFrame";

export const Route = createFileRoute("/s/add-address")({
  head: () => ({
    meta: [
      { title: "Add Address - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { name: "description", content: "\u0634\u0627\u0634\u0629 Add Address - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643 \u0644\u0644\u062a\u0648\u0635\u064a\u0644 \u0648\u0627\u0644\u062a\u062c\u0627\u0631\u0629 \u0627\u0644\u0645\u062d\u0644\u064a\u0629." },
      { property: "og:title", content: "Add Address - Tasweeqet Betak | \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643" },
      { property: "og:description", content: "\u0634\u0627\u0634\u0629 Add Address - Tasweeqet Betak \u0645\u0646 \u0646\u0638\u0627\u0645 \u062a\u0633\u0648\u064a\u0642\u0627\u062a \u0628\u064a\u062a\u0643." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScreenAddAddress,
});

function ScreenAddAddress() {
  return (
    <ScreenFrame slug="add-address" title="Add Address - Tasweeqet Betak" bodyClassName="bg-background text-on-background min-h-screen flex flex-col font-body-md antialiased md:flex-row">
      

<header className={"flex flex-row-reverse justify-between items-center px-margin-mobile py-4 w-full bg-surface sticky top-0 z-50 border-b border-outline-variant md:hidden"}>
<div className={"font-headline-lg-mobile text-headline-lg-mobile font-bold text-secondary flex-1 text-center pr-8"}>
            إضافة عنوان
        </div>
<button className={"w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-low transition-colors text-on-surface"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 0" }}>arrow_forward</span>
</button>
</header>

<aside className={"hidden md:flex flex-col w-72 h-screen fixed right-0 top-0 border-l border-outline-variant bg-surface-container-low p-md z-40"}>
<div className={"mb-lg mt-8 flex items-center gap-4 cursor-pointer hover:bg-surface-container-high p-2 rounded-lg transition-colors"}>
<span className={"material-symbols-outlined text-on-surface-variant"}>arrow_forward</span>
<span className={"font-label-lg text-label-lg text-on-surface-variant"}>العودة للخلف</span>
</div>
<div className={"mt-auto"}>
<h1 className={"font-headline-xl text-headline-xl text-secondary mb-2"}>Tasweeqet Betak</h1>
<p className={"text-on-surface-variant font-body-md text-sm"}>تسليم سريع وموثوق</p>
</div>
</aside>

<main className={"flex-1 w-full max-w-3xl mx-auto px-margin-mobile py-lg md:mr-72 md:px-margin-desktop md:py-12 mb-24 md:mb-0"}>
<div className={"hidden md:block mb-8"}>
<h1 className={"font-headline-xl text-headline-xl text-on-surface font-bold"}>إضافة عنوان جديد</h1>
<p className={"text-on-surface-variant mt-2 font-body-lg text-body-lg"}>أدخل تفاصيل موقعك لتوصيل أسرع.</p>
</div>
<form className={"space-y-8 bg-surface-container-lowest p-6 md:p-8 rounded-card border border-[#F0E8D0] shadow-sm relative overflow-hidden"}>

<div className={"w-full h-48 bg-surface-variant rounded-xl mb-6 relative overflow-hidden border border-outline-variant/30 flex items-center justify-center group cursor-pointer"}>

<div className={"absolute inset-0 bg-cover bg-center opacity-50"} data-alt={"A detailed, clean, light-mode stylized digital map of Riyadh city center. The map features a minimalist UI aesthetic with soft cream and warm yellow tones (#FFFDF5, #FFD502) highlighting major roads. No text is visible. A prominent, elegant deep brown (#5E3C1A) location pin sits at the center, casting a soft shadow on the map surface."} data-location={"Riyadh"} style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBKtczD75Wg73Lm96LmlIWdPTeq-SUy3Vd4e1pHUXzpN2bk7XYIXS8-xG21sBzU8Mvhn2am7IuUygS07AAyF0qxSNkZM3SSGlVIlwhQ6Q_if76Um7zx5gu2yY1_0bABaYxWheSapKE1f6aW-K9pE5p1f1ac2fNucXBTXfT0lfsOytJBTwRJNeMTsC6qSaw8_Tz8y69niYcokSjNPtvlOFhZNdJQ8uTpGIPmiqVkY9wHmVOQIFkx0_Ks')" }}></div>
<div className={"z-10 bg-surface-container-lowest/90 backdrop-blur-sm py-2 px-4 rounded-full border border-[#F0E8D0] text-secondary font-label-md text-label-md flex items-center gap-2 group-hover:scale-105 transition-transform"}>
<span className={"material-symbols-outlined text-[18px]"}>my_location</span>
                    تحديد الموقع على الخريطة
                </div>
</div>
<fieldset className={"space-y-4"}>
<legend className={"font-headline-md text-headline-md text-on-surface mb-4"}>تفاصيل الموقع</legend>
<div className={"grid grid-cols-1 md:grid-cols-2 gap-4"}>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-2"} htmlFor={"city"}>المنطقة والمدينة</label>
<input className={"input-pill"} id={"city"} placeholder={"\u0645\u062b\u0627\u0644: \u0627\u0644\u0631\u064a\u0627\u0636\u060c \u062d\u064a \u0627\u0644\u0645\u0644\u0642\u0627"} type={"text"} />
</div>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-2"} htmlFor={"street"}>الشارع</label>
<input className={"input-pill"} id={"street"} placeholder={"\u0645\u062b\u0627\u0644: \u0634\u0627\u0631\u0639 \u0627\u0644\u0623\u0645\u064a\u0631 \u0645\u062d\u0645\u062f \u0628\u0646 \u0633\u0639\u062f"} type={"text"} />
</div>
</div>
<div className={"grid grid-cols-3 gap-4"}>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-2"} htmlFor={"building"}>رقم العقار</label>
<input className={"input-pill"} id={"building"} placeholder={"12"} type={"text"} />
</div>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-2"} htmlFor={"floor"}>الدور</label>
<input className={"input-pill"} id={"floor"} placeholder={"3"} type={"text"} />
</div>
<div>
<label className={"block font-label-lg text-label-lg text-on-surface-variant mb-2"} htmlFor={"apartment"}>رقم الشقة</label>
<input className={"input-pill"} id={"apartment"} placeholder={"14"} type={"text"} />
</div>
</div>
</fieldset>
<fieldset>
<legend className={"font-headline-md text-headline-md text-on-surface mb-4"}>نوع العنوان</legend>
<div className={"flex gap-4"}>
<label className={"type-chip"}>
<input defaultChecked={true} className={"hidden"} name={"address_type"} type={"radio"} value={"home"} />
<div className={"type-chip-content py-4"}>
<span className={"material-symbols-outlined text-[28px]"} style={{ fontVariationSettings: "'FILL' 1" }}>home</span>
<span className={"font-label-lg text-label-lg"}>المنزل</span>
</div>
</label>
<label className={"type-chip"}>
<input className={"hidden"} name={"address_type"} type={"radio"} value={"work"} />
<div className={"type-chip-content py-4 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[28px]"} style={{ fontVariationSettings: "'FILL' 0" }}>work</span>
<span className={"font-label-lg text-label-lg"}>العمل</span>
</div>
</label>
<label className={"type-chip"}>
<input className={"hidden"} name={"address_type"} type={"radio"} value={"other"} />
<div className={"type-chip-content py-4 text-on-surface-variant"}>
<span className={"material-symbols-outlined text-[28px]"} style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
<span className={"font-label-lg text-label-lg"}>آخر</span>
</div>
</label>
</div>
</fieldset>
<fieldset>
<legend className={"font-headline-md text-headline-md text-on-surface mb-4"}>تعليمات التوصيل (اختياري)</legend>
<textarea className={"w-full bg-surface-container-lowest border border-[#F0E8D0] rounded-xl p-4 text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-colors resize-none placeholder:text-[#8A6742]"} placeholder={"\u0623\u0636\u0641 \u0623\u064a \u062a\u0641\u0627\u0635\u064a\u0644 \u062a\u0633\u0627\u0639\u062f \u0627\u0644\u0645\u0646\u062f\u0648\u0628 \u0641\u064a \u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u064a\u0643 \u0628\u0633\u0647\u0648\u0644\u0629..."} rows={3}></textarea>
</fieldset>

<div className={"fixed bottom-0 left-0 right-0 p-4 bg-surface-container-lowest border-t border-[#F0E8D0] md:relative md:p-0 md:bg-transparent md:border-t-0 md:mt-8 z-40"}>
<button className={"w-full bg-[#FFD502] text-[#5E3C1A] font-bold font-headline-md text-headline-md py-4 rounded-button hover:bg-primary-fixed-dim transition-colors flex items-center justify-center gap-2"} type={"button"}>
<span className={"material-symbols-outlined"} style={{ fontVariationSettings: "'FILL' 1" }}>save</span>
                    حفظ العنوان
                </button>
</div>
</form>
</main>



    </ScreenFrame>
  );
}
