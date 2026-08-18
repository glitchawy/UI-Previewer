import { createFileRoute, Link } from "@tanstack/react-router";
import { screenGroups, totalScreens } from "@/lib/screens";

export const Route = createFileRoute("/screens")({
  head: () => ({
    meta: [
      { title: "تسويقة بيتك — معرض شاشات منظومة التوصيل" },
      {
        name: "description",
        content:
          "معرض تفاعلي لكل شاشات تسويقة بيتك: تطبيق العميل، لوحة التاجر، تطبيق المندوب ولوحة الإدارة بتصميم عربي كامل.",
      },
      { property: "og:title", content: "تسويقة بيتك — معرض شاشات منظومة التوصيل" },
      {
        property: "og:description",
        content: "استعرض 35 شاشة جاهزة لمنظومة التجارة المحلية والتوصيل: عميل، تاجر، مندوب، إدارة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Gallery,
});

function Gallery() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-surface font-body-md text-on-surface">
      {/* Hero */}
      <header className="relative overflow-hidden border-b border-border-subtle bg-surface-cream">
        <div
          className="pointer-events-none absolute -top-24 -left-24 size-80 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #ffd502 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 -right-16 size-96 rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #feca9d 0%, transparent 70%)" }}
        />
        <div className="relative mx-auto max-w-6xl px-margin-mobile py-xl md:px-margin-desktop md:py-16">
          <span
            className="tb-fade-up inline-flex items-center gap-2 rounded-full bg-primary-container px-4 py-1.5 font-label-lg text-label-lg text-on-primary-container"
          >
            <span className="material-symbols-outlined text-[18px]">bolt</span>
            منظومة تجارة محلية وتوصيل
          </span>

          <h1
            style={{ animationDelay: "60ms" }}
            className="tb-fade-up mt-md max-w-2xl font-headline-xl text-headline-xl-mobile text-on-surface md:text-[44px] md:leading-[52px]"
          >
            تسويقة بيتك — كل اللي محتاجه لحد باب بيتك
          </h1>

          <p
            style={{ animationDelay: "120ms" }}
            className="tb-fade-up mt-sm max-w-xl font-body-lg text-body-lg text-on-surface-variant"
          >
            {totalScreens} شاشة جاهزة عبر أربعة تطبيقات: العميل، التاجر، المندوب، والإدارة — بتصميم
            عربي أولاً وحركات ناعمة.
          </p>

          <div
            style={{ animationDelay: "180ms" }}
            className="tb-fade-up mt-lg flex flex-wrap gap-sm"
          >
            <Link
              to="/s/home-discovery"
              className="inline-flex items-center gap-2 rounded-button bg-primary-container px-6 py-3 font-headline-md text-headline-md text-on-primary-container shadow-tactile transition hover:brightness-95 active:scale-[0.98]"
            >
              ابدأ من الرئيسية
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <Link
              to="/s/merchant-dashboard-restaurant"
              className="inline-flex items-center gap-2 rounded-button border-2 border-on-primary-container bg-surface-container-lowest px-6 py-3 font-headline-md text-headline-md text-on-primary-container transition hover:bg-surface-container-low active:scale-[0.98]"
            >
              لوحة التاجر
            </Link>
          </div>

          <div className="mt-xl flex flex-wrap gap-sm">
            {screenGroups.map((g, i) => (
              <a
                key={g.id}
                href={`#${g.id}`}
                style={{ animationDelay: `${220 + i * 50}ms` }}
                className="tb-fade-up flex items-center gap-2 rounded-full border border-border-subtle bg-surface-container-lowest px-4 py-2 font-label-lg text-label-lg text-on-surface-variant transition hover:-translate-y-0.5 hover:border-primary-container hover:text-on-primary-container"
              >
                <span className="material-symbols-outlined text-[18px]">{g.icon}</span>
                {g.label}
                <span className="rounded-full bg-table-header px-2 py-0.5 font-label-md text-label-md text-on-primary-container">
                  {g.screens.length}
                </span>
              </a>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-margin-mobile py-xl md:px-margin-desktop">
        {screenGroups.map((group) => (
          <section key={group.id} id={group.id} className="scroll-mt-8 pb-xl">
            <div className="mb-lg flex items-end justify-between gap-md border-b border-border-subtle pb-sm">
              <div>
                <h2 className="flex items-center gap-2 font-headline-lg text-headline-lg text-on-surface">
                  <span className="material-symbols-outlined text-on-primary-container">
                    {group.icon}
                  </span>
                  {group.label}
                </h2>
                <p className="mt-xs font-body-md text-body-md text-on-surface-variant">
                  {group.subtitle}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-surface-container px-3 py-1 font-label-md text-label-md text-on-surface-variant">
                {group.screens.length} شاشة
              </span>
            </div>

            <div className="grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-4">
              {group.screens.map((screen, i) => (
                <div
                  key={screen.slug}
                  style={{ animationDelay: `${(i % 8) * 60}ms` }}
                  className="tb-fade-up transition-transform duration-300 hover:-translate-y-1.5"
                >
                  <a
                    href={`/s/${screen.slug}`}
                    className="group block overflow-hidden rounded-card border border-border-subtle bg-surface-container-lowest shadow-tactile transition-shadow hover:shadow-lift"
                  >
                    <div className="relative h-56 overflow-hidden bg-surface-container-low">
                      <iframe
                        src={`/s/${screen.slug}`}
                        title={screen.title}
                        loading="lazy"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="pointer-events-none absolute top-0 right-0 origin-top-right"
                        style={{
                          width: "390px",
                          height: "844px",
                          transform: "scale(0.42)",
                          border: "0",
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-on-surface/25 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                      <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 font-label-md text-label-md text-on-primary-container opacity-0 transition-all group-hover:opacity-100">
                        عرض الشاشة
                        <span className="material-symbols-outlined text-[16px]">open_in_full</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 border-t border-border-subtle px-4 py-3">
                      <span className="material-symbols-outlined flex size-9 shrink-0 items-center justify-center rounded-lg bg-table-header text-[20px] text-on-primary-container transition group-hover:bg-primary-container">
                        {screen.icon}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-headline-md text-[15px] leading-tight text-on-surface">
                          {screen.title}
                        </p>
                        <p className="truncate font-label-md text-label-md text-outline">
                          {screen.slug}
                        </p>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <footer className="border-t border-border-subtle bg-surface-cream py-lg text-center font-label-lg text-label-lg text-on-surface-variant">
        تسويقة بيتك · نظام تصميم عربي أولاً · أصفر ذهبي وبُني دافئ
      </footer>
    </div>
  );
}
