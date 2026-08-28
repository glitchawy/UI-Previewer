import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useCart } from "@/lib/tb/cart";
import { getSession, logoutSession } from "@/lib/auth-session";

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
  return (
    <div className="mb-sm flex items-center justify-between gap-sm">
      <h2 className="flex items-center gap-2 font-headline-md text-headline-md text-on-surface">
        {icon ? <Icon name={icon} className="text-[20px] text-on-surface-variant" /> : null}
        {title}
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
  return <Badge tone={statusTone[status] ?? "neutral"}>{label ?? status}</Badge>;
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
      {children}
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
}: {
  label: string;
  placeholder?: string;
  icon?: string;
  type?: string;
  hint?: string;
  value?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-label-lg text-label-lg text-on-surface-variant">{label}</span>
      <span className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 focus-within:border-secondary">
        {icon ? <Icon name={icon} className="text-[20px] text-outline" /> : null}
        <input
          type={type}
          defaultValue={value}
          placeholder={placeholder}
          className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
        />
      </span>
      {hint ? <span className="font-label-md text-label-md text-outline">{hint}</span> : null}
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
      <p className="font-label-md text-label-md text-on-surface-variant">{label}</p>
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
  return (
    <div
      className={`tb-map relative overflow-hidden rounded-card border border-outline-variant ${height} ${className}`}
    >
      <div className="tb-map-grid absolute inset-0" />
      <div className="tb-route absolute inset-0" />
      {children}
      <span className="absolute bottom-2 left-2 rounded-full bg-surface-container-lowest/90 px-2 py-1 font-label-md text-[10px] text-on-surface-variant">
        Google Maps
      </span>
    </div>
  );
}

export function EmptyState({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-xl text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-surface-container text-on-surface-variant">
        <Icon name={icon} className="text-[28px]" />
      </span>
      <p className="font-headline-md text-headline-md text-on-surface">{title}</p>
      <p className="max-w-xs font-body-md text-body-md text-on-surface-variant">{body}</p>
    </div>
  );
}

/* ============================ mobile app shell ============================ */

export type Tab = { to: string; label: string; icon: string };

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
  return (
    <header className="tb-appbar sticky top-0 z-20 flex items-center gap-sm border-b border-outline-variant bg-surface-container-lowest/95 px-md pb-3 backdrop-blur">

      {back ? (
        <Link
          to={back}
          aria-label="رجوع"
          className="flex size-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-surface-container"
        >
          <Icon name="arrow_forward" />
        </Link>
      ) : null}
      <div className="min-w-0 flex-1">
        <h1 className="truncate font-headline-md text-headline-md text-on-surface">{title}</h1>
        {subtitle ? (
          <p className="truncate font-label-md text-label-md text-on-surface-variant">{subtitle}</p>
        ) : null}
      </div>
      {right}
    </header>
  );
}

export function MobileShell({
  children,
  tabs,
  brand,
  fab,
}: {
  children: ReactNode;
  tabs?: Tab[];
  brand?: string;
  fab?: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { cart } = useCart();
  const isDevMode = getSession()?.isDevMode === true;
  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen justify-center bg-surface-variant/40">
      <div className="tb-fade-up relative flex min-h-screen w-full max-w-full flex-col bg-surface sm:max-w-[480px] sm:shadow-[0_0_60px_rgba(94,60,26,0.12)]">
        {isDevMode ? (
          <span className="pointer-events-none fixed left-2 top-2 z-50 rounded-full bg-error px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow">
            DEV MODE
          </span>
        ) : null}
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
                          <span className="absolute -left-1 -top-1 flex min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] leading-4 text-white">
                            {cart.itemCount > 99 ? "99+" : cart.itemCount.toLocaleString("ar-EG")}
                          </span>
                        ) : null}
                      </span>
                      <span className="max-w-full truncate px-0.5 font-label-md text-[11px]">{t.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : null}
        {brand ? (
          <span className="pointer-events-none absolute -top-6 right-0 hidden font-label-md text-label-md text-outline lg:block">
            {brand}
          </span>
        ) : null}
      </div>
    </div>
  );
}

/* ============================ dashboard shell ============================ */

export type NavGroup = { label: string; items: Tab[] };

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
  const isDevMode = getSession()?.isDevMode === true;
  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen bg-surface-variant/40">
      {isDevMode ? (
        <span className="pointer-events-none fixed left-2 top-2 z-50 rounded-full bg-error px-2.5 py-1 text-[10px] font-bold tracking-wide text-white shadow">
          DEV MODE
        </span>
      ) : null}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface-container-lowest p-md lg:flex">
        <Link to="/" className="mb-md flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="local_mall" className="text-[20px]" />
          </span>
          <span>
            <span className="block font-headline-md text-headline-md text-on-surface">{brand}</span>
            <span className="block font-label-md text-label-md text-outline">{role}</span>
          </span>
        </Link>
        {nav.map((g) => (
          <div key={g.label} className="mb-md">
            <p className="mb-1 px-2 font-label-md text-label-md text-outline">{g.label}</p>
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
                      {i.label}
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
          تسجيل الخروج
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="tb-appbar sticky top-0 z-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-sm border-b border-outline-variant bg-surface-container-lowest/95 px-md pb-3 backdrop-blur sm:flex">
          <h1 className="min-w-0 flex-1 truncate font-headline-md text-headline-md text-on-surface sm:font-headline-lg sm:text-headline-lg">
            {title}
          </h1>
          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
          <button
            type="button"
            onClick={async () => {
              await logoutSession();
              navigate({ to: "/auth/login" });
            }}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-error-container hover:text-error"
            title="تسجيل الخروج"
            aria-label="تسجيل الخروج"
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
                {i.label}
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
  const labelVars = Object.fromEntries(
    head.map((h, i) => [`--th-${i + 1}`, h ? `"${h}"` : '""']),
  ) as React.CSSProperties;

  return (
    <Card className="overflow-hidden">
      <div className={`overflow-x-auto ${mobile === "scroll" ? "tb-scroll-fade md:[&::after]:hidden" : ""}`}>
        <table
          style={labelVars}
          className={`w-full text-right ${
            mobile === "cards"
              ? "tb-table-cards md:min-w-[640px]"
              : "tb-table-scroll min-w-[640px]"
          }`}
        >
          <thead className="bg-table-header">
            <tr>
              {head.map((h, i) => (
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
  return (
    <div
      dir="rtl"
      lang="ar"
      className="flex min-h-screen items-center justify-center bg-surface-variant/40 p-md"
    >
      <div className="tb-fade-up w-full max-w-[440px]">
        <div className="mb-md flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-10 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon name="local_mall" />
            </span>
            <span className="font-headline-md text-headline-md text-on-surface">طلبات بيتك</span>
          </Link>
          {back ? (
            <Link
              to={back}
              className="flex items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface"
            >
              رجوع
              <Icon name="arrow_forward" className="text-[18px]" />
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
          <h1 className="font-headline-lg text-headline-lg text-on-surface">{title}</h1>
          {subtitle ? (
            <p className="mt-1 font-body-md text-body-md text-on-surface-variant">{subtitle}</p>
          ) : null}
          <div className="mt-lg flex flex-col gap-md">{children}</div>
        </Card>
      </div>
    </div>
  );
}
