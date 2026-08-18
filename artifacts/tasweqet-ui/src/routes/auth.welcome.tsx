import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";

export const Route = createFileRoute("/auth/welcome")({
  head: () => ({
    meta: [
      { title: "أهلاً بيك في طلبات بيتك | تسجيل الدخول" },
      { name: "description", content: "ابدأ رحلتك مع طلبات بيتك: حساب عميل، مطعم أو مندوب توصيل." },
      { property: "og:title", content: "أهلاً بيك في طلبات بيتك" },
      { property: "og:description", content: "اختر نوع الحساب وابدأ التسجيل بتأكيد واتساب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const paths = [
  { to: "/auth/register", label: "حساب عميل", desc: "اطلب أكلك المفضل من أقرب المطاعم", icon: "shopping_bag" },
  { to: "/auth/register-restaurant", label: "حساب مطعم", desc: "سجّل مطعمك وفروعه على المنصة", icon: "storefront" },
  { to: "/auth/driver", label: "حساب مندوب", desc: "اشتغل مع طلبات بيتك وحصّل أرباحك", icon: "two_wheeler" },
];

function Welcome() {
  return (
    <AuthShell
      title="أهلاً بيك في طلبات بيتك"
      subtitle="اختار نوع الحساب المناسب ليك. حساب العميل مستقل تماماً عن حساب المطعم."
      back="/"
    >
      <div className="flex flex-col gap-sm">
        {paths.map((p) => (
          <Link
            key={p.to}
            to={p.to}
            className="group flex items-center gap-sm rounded-card border border-outline-variant bg-surface-container-lowest p-3 transition hover:border-secondary hover:bg-surface-container-low"
          >
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name={p.icon} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-label-lg text-label-lg text-on-surface">{p.label}</span>
              <span className="block font-label-md text-label-md text-on-surface-variant">
                {p.desc}
              </span>
            </span>
            <Icon name="chevron_left" className="text-outline transition group-hover:-translate-x-1" />
          </Link>
        ))}
      </div>

      <Link to="/auth/login">
        <Button className="w-full" icon="login">
          عندي حساب بالفعل — تسجيل الدخول
        </Button>
      </Link>
      <Link
        to="/app"
        className="text-center font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface"
      >
        تصفح كضيف
      </Link>
    </AuthShell>
  );
}
