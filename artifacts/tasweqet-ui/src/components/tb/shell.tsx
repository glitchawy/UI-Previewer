import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ChangeEventHandler, ReactNode } from "react";
import { useCart } from "@/lib/tb/cart";
import { getSession, logoutSession } from "@/lib/auth-session";
import { LanguageSwitcher } from "@/components/tb/language-switcher";
import { useTranslation, type LocalizedText } from "@/lib/i18n";

export { LanguageSwitcher };

export type LabelValue = string | LocalizedText;

const SHELL_TRANSLATIONS: Record<string, string> = {
  "طلبات بيتك": "Talabat Betak",
  "تسجيل الخروج": "Log out",
  رجوع: "Back",
  الإدارة: "Administration",
  "سوبر أدمن": "Super admin",
  "صاحب مطعم": "Restaurant owner",
  "صاحب المطعم": "Restaurant owner",
  الرئيسية: "Home",
  البحث: "Search",
  السلة: "Cart",
  طلباتي: "My orders",
  حسابي: "Profile",
  الطلبات: "Orders",
  السجل: "History",
  المحفظة: "Wallet",
  التشغيل: "Operations",
  "لوحة الأداء": "Performance",
  الفروع: "Branches",
  "مواعيد العمل": "Opening hours",
  القائمة: "Menu",
  المنتجات: "Products",
  "مخزون الفروع": "Branch inventory",
  الأعمال: "Business",
  التحليلات: "Analytics",
  التسويات: "Settlements",
  التقييمات: "Reviews",
  "بيانات المطعم": "Restaurant details",
  المنصة: "Platform",
  "نظرة عامة": "Overview",
  العملاء: "Customers",
  التوثيق: "Verification",
  المطاعم: "Restaurants",
  المندوبين: "Drivers",
  المالية: "Finance",
  المدفوعات: "Payments",
  الاستردادات: "Refunds",
  "تسعير التوصيل": "Delivery pricing",
  "عمولات المطاعم": "Restaurant commissions",
  "عمولات المندوبين": "Driver commissions",
  الإشعارات: "Notifications",
  التقارير: "Reports",
  "الأدوار والصلاحيات": "Roles & permissions",
  "سجل التدقيق": "Audit log",
  "إعدادات المنصة": "Platform settings",
  "تفاصيل الطلب": "Order details",
  "جاري التحميل…": "Loading…",
  "لا توجد بيانات": "No data available",
  "لم تُسجل طلبات للمطاعم بعد.": "No restaurant orders have been recorded yet.",
  "إغلاق": "Close",
  "بحث": "Search",
  إعادة: "Retry",
  السابق: "Previous",
  التالي: "Next",
  "تم التوصيل": "Delivered",
  "تم التأكيد": "Confirmed",
  "جاري التحضير": "Preparing",
  "جاهز للاستلام": "Ready for pickup",
  "خرج للتوصيل": "Out for delivery",
  ملغي: "Cancelled",
  "في انتظار التأكيد": "Awaiting confirmation",
  "في انتظار الدفع": "Awaiting payment",
  مدفوع: "Paid",
  "فشل الدفع": "Payment failed",
  "تم الاسترداد": "Refunded",
};

function shellText(value: LabelValue, t: ReturnType<typeof useTranslation>["t"]): string {
  if (typeof value !== "string") return t(value.ar, value.en);
  const english = SHELL_TRANSLATIONS[value];
  return english ? t(value, english) : value;
}

function shellNode(value: ReactNode, t: ReturnType<typeof useTranslation>["t"]): ReactNode {
  return typeof value === "string" ? shellText(value, t) : value;
}

/* ============================== primitives ============================== */

export function Icon({
  name,
  className = "",
  filled = false,
}: {
  name: string;
  className?: string;
  filled?: boolean;
}) {
  return (
    <span
      aria-hidden
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

export function Card({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "li";
}) {
  const Tag = as;
  return (
    <Tag
      className={`rounded-card border border-outline-variant bg-surface-container-lowest shadow-[0_2px_10px_rgba(94,60,26,0.05)] ${className}`}
    >
      {children}
    </Tag>
  );
}

export function SectionTitle({
  title,
  action,
  icon,
}: {
  title: string;
  action?: ReactNode;
  icon?: string;
}) {
  const { t } = useTranslation();
  return (
    <div className="mb-sm flex items-center justify-between gap-sm">
      <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
        {icon ? <Icon name={icon} className="text-[20px] text-on-surface-variant" /> : null}
        {shellText(title, t)}
      </h2>
      {action}
    </div>
  );
}

const toneMap: Record<string, string> = {
  neutral: "bg-surface-container text-on-surface-variant",
  info: "bg-secondary-container text-on-secondary-container",
  warn: "bg-primary-container text-on-primary-container",
  success: "bg-success/15 text-success",
  danger: "bg-error-container text-on-error-container",
};

export function Badge({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: keyof typeof toneMap | string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-label-md text-label-md ${toneMap[tone] ?? toneMap['neutral']} ${className}`}
    >
      {children}
    </span>
  );
}

const statusTone: Record<string, string> = {
  PLACED: "info",
  CONFIRMED: "info",
  PREPARING: "warn",
  READY: "warn",
  ASSIGNED: "info",
  PICKED_UP: "info",
  DELIVERING: "info",
  DELIVERED: "success",
  CANCELLED: "danger",
  PENDING: "warn",
  UNDER_REVIEW: "info",
  APPROVED: "success",
  ACTIVE: "success",
  PAID: "success",
  REJECTED: "danger",
  SUSPENDED: "danger",
  SUCCESS: "success",
  FAILED: "danger",
  REFUNDED: "info",
};

export function StatusBadge({ status, label }: { status: string; label?: string | undefined }) {
  const { t } = useTranslation();
  return <Badge tone={statusTone[status] ?? "neutral"}>{shellText(label ?? status, t)}</Badge>;
}

export function Button({
  children,
  variant = "primary",
  className = "",
  icon,
  ...rest
}: {
  children?: ReactNode;
  variant?: "primary" | "outline" | "ghost" | "danger";
  className?: string;
  icon?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { t } = useTranslation();
  const styles = {
    primary:
      "bg-primary-container text-on-primary-container hover:brightness-105 shadow-[0_2px_8px_rgba(94,60,26,0.12)]",
    outline:
      "border-2 border-secondary text-secondary hover:bg-surface-container-low bg-surface-container-lowest",
    ghost: "text-on-surface-variant hover:bg-surface-container-low",
    danger: "bg-error-container text-on-error-container hover:brightness-105",
  }[variant];
  return (
    <button
      {...rest}
      className={`inline-flex items-center justify-center gap-2 rounded-button px-4 py-2.5 font-label-lg text-label-lg transition-all active:scale-[0.98] ${styles} ${className}`}
    >
      {icon ? <Icon name={icon} className="text-[18px]" /> : null}
      {shellNode(children, t)}
    </button>
  );
}

export function Field({
  label,
  placeholder,
  icon,
  type = "text",
  hint,
  value,
  onChange,
}: {
  label: string;
  placeholder?: string;
  icon?: string;
  type?: string;
  hint?: string;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}) {
  const { t } = useTranslation();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label-lg text-label-lg text-on-surface-variant">{shellText(label, t)}</span>
      <span className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 focus-within:border-secondary">
        {icon ? <Icon name={icon} className="text-[20px] text-outline" /> : null}
        <input
          type={type}
          {...(onChange ? { value, onChange } : { defaultValue: value })}
          placeholder={placeholder ? shellText(placeholder, t) : undefined}
          className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
        />
      </span>
      {hint ? <span className="font-label-md text-label-md text-outline">{shellText(hint, t)}</span> : null}
    </label>
  );
}

export function Stat({
  label,
  value,
  delta,
  icon,
  tone = "warn",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: string;
  tone?: string;
}) {
  const { t } = useTranslation();
  return (
    <Card className="p-md">
      <div className="mb-sm flex items-center justify-between">
        <span
          className={`flex size-9 items-center justify-center rounded-full ${toneMap[tone] ?? toneMap['warn']}`}
        >
          <Icon name={icon} className="text-[20px]" />
        </span>
        {delta ? (
          <span className="flex items-center gap-0.5 font-label-md text-label-md text-success">
            <Icon name="trending_up" className="text-[16px]" />
            {delta}
          </span>
        ) : null}
      </div>
      <p className="font-headline-md text-headline-md text-on-surface">{value}</p>
      <p className="font-label-md text-label-md text-on-surface-variant">{shellText(label, t)}</p>
    </Card>
  );
}

export function Bars({
  values,
  labels,
  className = "",
}: {
  values: number[];
  labels: string[];
  className?: string;
}) {
  const max = Math.max(...values);
  return (
    <div className={`flex h-40 items-end gap-2 ${className}`}>
      {values.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1">
          <div
            className="tb-bar w-full rounded-t-md bg-primary-container"
            style={{ height: `${Math.max(8, (v / max) * 100)}%`, animationDelay: `${i * 60}ms` }}
            title={String(v)}
          />
          <span className="truncate font-label-md text-[10px] text-outline">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

export function MapCanvas({
  children,
  className = "",
  height = "h-64",
}: {
  children?: ReactNode;
  className?: string;
  height?: string;
}) {
  const { t } = useTranslation();
  return (
    <div
      className={`tb-map relative overflow-hidden rounded-card border border-outline-variant ${height} ${className}`}
    >
      <div className="tb-map-grid absolute inset-0" />
      <div className="tb-route absolute inset-0" />
      {children}
      <span className="absolute bottom-2 start-2 rounded-full bg-surface-container-lowest/90 px-2 py-1 font-label-md text-[10px] text-on-surface-variant">
        {t("خرائط Google", "Google Maps")}
      </span>
    </div>
  );
}

export function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center gap-2 py-xl text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name={icon} className="text-[28px]" />
      </span>
      <p className="font-headline-md text-headline-md text-on-surface">{shellText(title, t)}</p>
      <p className="max-w-xs font-body-md text-body-md text-on-surface-variant">{shellText(body, t)}</p>
    </div>
  );
}

/* ============================ mobile app shell ============================ */

export type Tab = { to: string; label: LabelValue; icon: string };

export function AppBar({
  title,
  subtitle,
  back,
  right,
}: {
  title: string;
  subtitle?: string;
  back?: string;
  right?: ReactNode;
}) {
  const { t, dir, locale } = useTranslation();
  return (
    <header
      className="tb-appbar sticky top-0 z-20 flex items-center gap-sm border-b border-outline-variant bg-surface-container-lowest/95 px-md pb-3 backdrop-blur"
      dir={dir}
      lang={locale}
    >

      {back ? (
        <Link
          to={back}
          aria-label={t("رجوع", "Back")}
          className="flex size-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
        >
          <Icon name={dir === "rtl" ? "arrow_forward" : "arrow_back"} />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-headline-md text-headline-md text-on-surface">{shellText(title, t)}</h1>
        {subtitle ? (
          <p className="truncate font-label-md text-label-md text-on-surface-variant">{shellText(subtitle, t)}</p>
        ) : null}
      </div>
      {right}
    </header>
  );
}

type MobileShellProps = {
  children: ReactNode;
  tabs?: Tab[];
  brand?: string;
  fab?: ReactNode;
};

export function MobileShell(props: MobileShellProps) {
  return <LocalizedMobileShell {...props} />;
}

function LocalizedMobileShell({
  children,
  tabs,
  brand,
  fab,
}: MobileShellProps) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { cart } = useCart();
  const { t: translate, dir, locale } = useTranslation();
  const isDevMode = getSession()?.isDevMode === true;
  return (
    <div dir={dir} lang={locale} className="flex min-h-screen justify-center bg-surface-variant/40">
      <div className="tb-fade-up relative flex min-h-screen w-full max-w-full flex-col bg-surface sm:max-w-[480px] sm:shadow-[0_0_60px_rgba(94,60,26,0.12)]">
        {isDevMode ? (
          <span className="pointer-events-none fixed start-2 top-2 z-50 rounded-full bg-error px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow">
            DEV MODE
          </span>
        ) : null}
        <div className="flex justify-end px-md pt-2">
          <LanguageSwitcher />
        </div>
        <div className="tb-tabbar-space min-w-0 flex-1">{children}</div>
        {fab}
        {tabs?.length ? (
          <nav className="tb-tabbar fixed bottom-0 z-30 w-full max-w-full border-t border-outline-variant bg-surface-container-lowest/95 backdrop-blur sm:max-w-[480px]">
            <ul className="flex items-stretch justify-around px-1 pt-1.5">

              {tabs.map((t) => {
                const active = pathname === t.to || pathname.startsWith(`${t.to}/`);
                return (
                  <li key={t.to} className="flex-1">
                    <Link
                      to={t.to}
                      className={`flex flex-col items-center gap-0.5 rounded-button py-1.5 transition ${
                        active
                          ? "text-on-primary-container"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      <span
                        className={`relative flex h-7 w-12 items-center justify-center rounded-full transition ${
                          active ? "bg-primary-container" : ""
                        }`}
                      >
                        <Icon name={t.icon} className="text-[22px]" filled={active} />
                        {t.to === "/app/cart" && cart.itemCount > 0 ? (
                          <span className="absolute -start-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] leading-4 text-white">
                            {cart.itemCount > 99 ? "99+" : cart.itemCount.toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")}
                          </span>
                        ) : null}
                      </span>
                      <span className="max-w-full truncate px-0.5 font-label-md text-[11px]">{shellText(t.label, translate)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
        {brand ? (
          <span className="pointer-events-none absolute -top-6 end-0 hidden font-label-md text-label-md text-outline lg:block">
            {brand ? shellText(brand, translate) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ============================ dashboard shell ============================ */

export type NavGroup = { label: LabelValue; items: Tab[] };

export function DashboardShell({
  children,
  title,
  brand,
  role,
  nav,
  actions,
}: {
  children: ReactNode;
  title: string;
  brand: string;
  role: string;
  nav: NavGroup[];
  actions?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const { t, dir, locale } = useTranslation();
  const isDevMode = getSession()?.isDevMode === true;
  return (
    <div dir={dir} lang={locale} className="flex min-h-screen bg-surface-variant/40">
      {isDevMode ? (
        <span className="pointer-events-none fixed start-2 top-2 z-50 rounded-full bg-error px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow">
          DEV MODE
        </span>
      ) : null}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-e border-outline-variant bg-surface-container-lowest p-md lg:flex">
        <Link to="/" className="mb-md flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="local_mall" className="text-[20px]" />
          </span>
          <span>
            <span className="block font-headline-md text-headline-md text-on-surface">{shellText(brand, t)}</span>
            <span className="block font-label-md text-label-md text-outline">{shellText(role, t)}</span>
          </span>
        </Link>
        {nav.map((g) => (
          <div key={typeof g.label === "string" ? g.label : g.label.ar} className="mb-md">
            <p className="mb-1 px-2 font-label-md text-label-md text-outline">{shellText(g.label, t)}</p>
            <ul className="flex flex-col gap-0.5">
              {g.items.map((i) => {
                const active = pathname === i.to;
                return (
                  <li key={i.to}>
                    <Link
                      to={i.to}
                      className={`flex items-center gap-2 rounded-button px-3 py-2 font-label-lg text-label-lg transition ${
                        active
                          ? "bg-primary-container text-on-primary-container"
                          : "text-on-surface-variant hover:bg-surface-container-low"
                      }`}
                    >
                      <Icon name={i.icon} className="text-[20px]" filled={active} />
                      {shellText(i.label, t)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <button
          type="button"
          onClick={async () => {
            await logoutSession();
            navigate({ to: "/auth/login" });
          }}
          className="mt-auto flex items-center gap-2 rounded-button px-3 py-2 font-label-md text-label-md text-outline hover:bg-surface-container-low"
        >
          <Icon name="logout" className="text-[18px]" />
          {t("تسجيل الخروج", "Log out")}
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="tb-appbar sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-sm border-b border-outline-variant bg-surface-container-lowest/95 px-md pb-3 backdrop-blur sm:flex">
          <h1 className="min-w-0 flex-1 truncate font-headline-md text-headline-md text-on-surface sm:font-headline-lg sm:text-headline-lg">
            {shellText(title, t)}
          </h1>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          <LanguageSwitcher />
          <button
            type="button"
            onClick={async () => {
              await logoutSession();
              navigate({ to: "/auth/login" });
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-error-container hover:text-error"
            title={t("تسجيل الخروج", "Log out")}
            aria-label={t("تسجيل الخروج", "Log out")}
          >
            <Icon name="logout" className="text-[20px]" />
          </button>
        </header>

        {/* mobile nav */}
        <div className="tb-hide-scroll flex gap-2 overflow-x-auto border-b border-outline-variant bg-surface-container-lowest px-md py-2 lg:hidden">
          {nav.flatMap((g) => g.items).map((i) => {
            const active = pathname === i.to;
            return (
              <Link
                key={i.to}
                to={i.to}
                className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                  active
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container text-on-surface-variant"
                }`}
              >
                <Icon name={i.icon} className="text-[16px]" />
                {shellText(i.label, t)}
              </Link>
            );
          })}
        </div>


        <main className="tb-fade-up flex-1 p-md md:p-lg">{children}</main>
      </div>
    </div>
  );
}

/* ================================ tables ================================= */

export function Table({
  head,
  children,
  mobile = "cards",
}: {
  head: string[];
  children: ReactNode;
  /** cards = each row stacks into a card below md; scroll = keep horizontal scroll */
  mobile?: "cards" | "scroll";
}) {
  const { t } = useTranslation();
  const localizedHead = head.map((value) => shellText(value, t));
  const labelVars = Object.fromEntries(
    localizedHead.map((h, i) => [`--th-${i + 1}`, h ? `"${h}"` : '""']),
  ) as React.CSSProperties;

  return (
    <Card className="overflow-hidden">
      <div className={`overflow-x-auto ${mobile === "scroll" ? "tb-scroll-fade md:[&::after]:hidden" : ""}`}>
        <table
          style={labelVars}
          className={`w-full text-start ${
            mobile === "cards"
              ? "tb-table-cards md:min-w-[640px]"
              : "tb-table-scroll min-w-[640px]"
          }`}
        >
          <thead className="bg-table-header">
            <tr>
              {localizedHead.map((h, i) => (
                <th
                  key={`${h}-${i}`}
                  className="whitespace-nowrap px-md py-3 font-label-md text-label-md text-on-surface-variant"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">{children}</tbody>
        </table>
      </div>
    </Card>
  );
}

export function Td({ children, className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <td
      className={`px-md py-3 font-body-md text-body-md text-on-surface md:whitespace-nowrap ${className}`}
    >
      {children}
    </td>
  );
}


/* ================================ auth shell ============================== */

export function AuthShell({
  children,
  title,
  subtitle,
  step,
  back,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
  step?: { current: number; total: number };
  back?: string;
}) {
  const { t, dir, locale } = useTranslation();
  return (
    <div
      dir={dir}
      lang={locale}
      className="flex min-h-screen items-center justify-center bg-surface-variant/40 p-md"
    >
      <div className="tb-fade-up w-full max-w-[440px]">
        <div className="mb-md flex items-center justify-between gap-sm">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="local_mall" />
            </span>
            <span className="font-headline-md text-headline-md text-on-surface">{t("طلبات بيتك", "Talabat Betak")}</span>
          </Link>
          <LanguageSwitcher />
          {back ? (
            <Link
              to={back}
              aria-label={t("رجوع", "Back")}
              className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface"
            >
              {dir === "rtl" ? (
                <>
                  {t("رجوع", "Back")}
                  <Icon name="arrow_forward" className="text-[18px]" />
                </>
              ) : (
                <>
                  <Icon name="arrow_back" className="text-[18px]" />
                  <span>{t("رجوع", "Back")}</span>
                </>
              )}
            </Link>
          ) : null}
        </div>

        <Card className="p-lg">
          {step ? (
            <div className="mb-md flex items-center gap-1.5">
              {Array.from({ length: step.total }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 flex-1 rounded-full transition ${
                    i < step.current ? "bg-primary-container" : "bg-surface-container-high"
                  }`}
                />
              ))}
            </div>
          ) : null}
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{shellText(title, t)}</h1>
          {subtitle ? (
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{shellText(subtitle, t)}</p>
          ) : null}
          <div className="mt-lg flex flex-col gap-md">{children}</div>
        </Card>
      </div>
    </div>
  );
}
