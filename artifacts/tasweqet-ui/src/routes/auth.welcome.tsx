import { createFileRoute, Link } from "@tanstack/react-router";
import { AuthShell, Button, Icon } from "@/components/tb/shell";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/auth/welcome")({
  head: () => ({
    meta: [
      { title: translate("أهلاً بيك في طلبات بيتك | تسجيل الدخول", "Welcome to Talabat Betak | Log in") },
      { name: "description", content: translate("ابدأ رحلتك مع طلبات بيتك: حساب عميل، مطعم أو مندوب توصيل.", "Start your Talabat Betak journey: customer, restaurant, or delivery driver account.") },
      { property: "og:title", content: translate("أهلاً بيك في طلبات بيتك", "Welcome to Talabat Betak") },
      { property: "og:description", content: translate("اختر نوع الحساب وابدأ التسجيل بتأكيد واتساب.", "Choose an account type and sign up with WhatsApp verification.") },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Welcome,
});

const paths = [
  { to: "/auth/register", ar: "حساب عميل", en: "Customer account", descAr: "اطلب أكلك المفضل من أقرب المطاعم", descEn: "Order your favorite food from nearby restaurants", icon: "shopping_bag" },
  { to: "/auth/register-restaurant", ar: "حساب مطعم", en: "Restaurant account", descAr: "سجّل مطعمك وفروعه على المنصة", descEn: "Register your restaurant and branches on the platform", icon: "storefront" },
  { to: "/auth/driver", ar: "حساب مندوب", en: "Driver account", descAr: "اشتغل مع طلبات بيتك وحصّل أرباحك", descEn: "Work with Talabat Betak and earn more", icon: "two_wheeler" },
];

function Welcome() {
  const { t } = useTranslation();
  return (
    <AuthShell
      title={t("أهلاً بيك في طلبات بيتك", "Welcome to Talabat Betak")}
      subtitle={t("اختار نوع الحساب المناسب ليك. حساب العميل مستقل تماماً عن حساب المطعم.", "Choose the right account type. Customer accounts are completely separate from restaurant accounts.")}
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
              <span className="block font-label-lg text-label-lg text-on-surface">{t(p.ar, p.en)}</span>
              <span className="block font-label-md text-label-md text-on-surface-variant">
                {t(p.descAr, p.descEn)}
              </span>
            </span>
            <Icon name="chevron_left" className="text-outline transition group-hover:-translate-x-1" />
          </Link>
        ))}
      </div>

      <Link to="/auth/login">
        <Button className="w-full" icon="login">
           {t("عندي حساب بالفعل — تسجيل الدخول", "I already have an account — Log in")}
        </Button>
      </Link>
      <Link
        to="/app"
        className="text-center font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface"
      >
        {t("تصفح كضيف", "Browse as guest")}
      </Link>
    </AuthShell>
  );
}
