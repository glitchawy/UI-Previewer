import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Icon } from "@/components/tb/shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك — منظومة توصيل وتجارة محلية" },
      {
        name: "description",
        content:
          "طلبات بيتك: تطبيق واحد يجمع العميل، المطعم، الفرع، المندوب والإدارة بواجهة عربية كاملة.",
      },
      { property: "og:title", content: "طلبات بيتك — منظومة توصيل وتجارة محلية" },
      {
        property: "og:description",
        content: "اختر دورك: عميل، مطعم، فرع، مندوب أو إدارة، وجرّب المنظومة كاملة.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RoleEntry,
});

const roles = [
  {
    to: "/app",
    label: "العميل",
    desc: "تصفح المطاعم، اطلب من أكثر من مطعم، تابع المندوب على الخريطة.",
    icon: "shopping_bag",
    tone: "bg-primary-container text-on-primary-container",
  },
  {
    to: "/partner",
    label: "صاحب المطعم",
    desc: "لوحة أداء الأعمال، الفروع، القائمة، الموظفين والتسويات.",
    icon: "storefront",
    tone: "bg-secondary-container text-on-secondary-container",
  },
  {
    to: "/branch",
    label: "الفرع والموظفين",
    desc: "شاشة المطبخ، حالة الطلبات ومخزون الفرع.",
    icon: "soup_kitchen",
    tone: "bg-tertiary-container text-on-tertiary-container",
  },
  {
    to: "/driver",
    label: "المندوب",
    desc: "عروض التوصيل، الملاحة، الأرباح والمحفظة.",
    icon: "two_wheeler",
    tone: "bg-primary-container text-on-primary-container",
  },
  {
    to: "/admin",
    label: "الإدارة / السوبر أدمن",
    desc: "تحليلات المنصة، التوثيق، التسعير، العمولات والصلاحيات.",
    icon: "admin_panel_settings",
    tone: "bg-secondary-container text-on-secondary-container",
  },
];

function RoleEntry() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-surface-variant/40 px-md py-xl">
      <div className="mx-auto max-w-4xl">
        <header className="tb-fade-up mb-lg text-center">
          <span className="mx-auto mb-sm flex size-14 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-[0_6px_20px_rgba(94,60,26,0.15)]">
            <Icon name="local_mall" className="text-[28px]" filled />
          </span>
          <h1 className="font-headline-xl-mobile text-headline-xl-mobile text-on-surface md:font-headline-xl md:text-headline-xl">
            طلبات بيتك
          </h1>
          <p className="mx-auto mt-2 max-w-xl font-body-md text-body-md text-on-surface-variant">
            منظومة واحدة بأدوار مختلفة: عميل، مطعم، فرع، مندوب وإدارة. واجهة عربية RTL بالكامل
            بالجنيه المصري.
          </p>
        </header>

        <div className="tb-stagger grid gap-md md:grid-cols-2">
          {roles.map((r) => (
            <Link key={r.to} to={r.to} className="group">
              <Card className="flex h-full items-start gap-sm p-md transition group-hover:-translate-y-0.5 group-hover:shadow-[0_10px_28px_rgba(94,60,26,0.12)]">
                <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${r.tone}`}>
                  <Icon name={r.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block font-headline-md text-headline-md text-on-surface">
                    {r.label}
                  </span>
                  <span className="mt-0.5 block font-body-md text-body-md text-on-surface-variant">
                    {r.desc}
                  </span>
                </span>
                <Icon
                  name="chevron_left"
                  className="mr-auto text-outline transition group-hover:-translate-x-1"
                />
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-lg flex flex-wrap justify-center gap-sm font-label-lg text-label-lg">
          <Link
            to="/auth/welcome"
            className="flex items-center gap-1.5 rounded-full bg-inverse-surface px-4 py-2 text-inverse-on-surface transition hover:scale-[1.02]"
          >
            <Icon name="login" className="text-[18px]" />
            رحلة التسجيل و OTP واتساب
          </Link>
          <Link
            to="/screens"
            className="flex items-center gap-1.5 rounded-full bg-surface-container px-4 py-2 text-on-surface-variant transition hover:bg-surface-container-high"
          >
            <Icon name="grid_view" className="text-[18px]" />
            التصميم المرجعي
          </Link>
        </div>
      </div>
    </div>
  );
}
