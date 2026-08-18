import { Link, useRouter } from "@tanstack/react-router";
import { useCallback, type MouseEvent, type ReactNode } from "react";
import { resolveNavTarget, familyOf } from "@/lib/screen-nav";
import { screenGroups } from "@/lib/screens";

type ScreenFrameProps = {
  slug: string;
  title: string;
  bodyClassName?: string;
  children: ReactNode;
};

const APP_ENTRIES = [
  { id: "customer", label: "العميل", icon: "shopping_bag", slug: "home-discovery" },
  { id: "merchant", label: "التاجر", icon: "storefront", slug: "merchant-dashboard-restaurant" },
  { id: "driver", label: "المندوب", icon: "two_wheeler", slug: "driver-home-online" },
  { id: "admin", label: "الإدارة", icon: "admin_panel_settings", slug: "admin-dashboard-overview-mobile" },
];

/**
 * Presentational shell for every screen.
 * Keeps the original body classes + per-screen namespaced CSS working, adds RTL
 * context, an entry animation, and click-delegated navigation so the static
 * markup behaves like a real app (tabs, flows, back buttons) with no logic.
 */
export function ScreenFrame({ slug, title, bodyClassName = "", children }: ScreenFrameProps) {
  const router = useRouter();
  const family = familyOf(slug);

  const onClick = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      const node = event.target as HTMLElement;
      // Anchors/buttons first, then card-like containers so list rows are tappable too.
      const el =
        node.closest<HTMLElement>("a,button,[role='button'],[data-nav]") ??
        node.closest<HTMLElement>(
          'li,article,[class*="card"],[class*="rounded-card"],[class*="rounded-2xl"],[class*="rounded-xl"]',
        );
      if (!el) return;
      if (el instanceof HTMLAnchorElement && el.getAttribute("href")?.startsWith("/")) return;

      const icons = Array.from(el.querySelectorAll(".material-symbols-outlined")).map(
        (i) => i.textContent?.trim() ?? "",
      );
      const label = Array.from(el.childNodes)
        .map((n) =>
          n.nodeType === Node.TEXT_NODE
            ? (n.textContent ?? "")
            : ((n as HTMLElement).innerText ?? n.textContent ?? ""),
        )
        .join(" ");

      const target = resolveNavTarget(slug, label || (el.textContent ?? ""), icons);
      if (!target) return;

      event.preventDefault();
      if (target === "back") {
        router.history.back();
        return;
      }
      router.navigate({ to: `/s/${target}` as never });
    },
    [router, slug],
  );

  return (
    <div dir="rtl" lang="ar" className="flex min-h-screen justify-center bg-surface-variant/40">
      {/* Desktop-only app switcher rail */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col gap-xs border-l border-border-subtle bg-surface-cream p-md lg:flex">
        <Link to="/" className="mb-md flex items-center gap-2 font-headline-md text-headline-md text-on-primary-container">
          <span className="material-symbols-outlined">local_mall</span>
          تسويقة بيتك
        </Link>
        {APP_ENTRIES.map((app) => (
          <Link
            key={app.id}
            to={`/s/${app.slug}` as never}
            className={`flex items-center gap-2 rounded-button px-3 py-2 font-label-lg text-label-lg transition ${
              family === app.id
                ? "bg-primary-container text-on-primary-container shadow-tactile"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">{app.icon}</span>
            {app.label}
          </Link>
        ))}

        <div className="mt-md border-t border-border-subtle pt-md">
          <p className="mb-xs font-label-md text-label-md text-outline">شاشات {sectionLabel(family)}</p>
          <div className="flex max-h-[45vh] flex-col gap-0.5 overflow-y-auto pl-1">
            {(screenGroups.find((g) => g.id === family)?.screens ?? []).map((s) => (
              <Link
                key={s.slug}
                to={`/s/${s.slug}` as never}
                className={`truncate rounded-md px-2 py-1.5 font-body-md text-body-md transition ${
                  s.slug === slug
                    ? "bg-table-header text-on-primary-container"
                    : "text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                {s.title}
              </Link>
            ))}
          </div>
        </div>

        <Link
          to="/screens"
          className="mt-auto flex items-center gap-2 font-label-md text-label-md text-outline hover:text-on-primary-container"
        >
          <span className="material-symbols-outlined text-[18px]">grid_view</span>
          كل الشاشات
        </Link>
      </aside>

      {/* Device viewport */}
      <div
        onClick={onClick}
        data-screen={slug}
        className={`tb-screen tb-fade-up relative min-h-screen w-full max-w-[480px] bg-surface shadow-lift ${bodyClassName}`}
      >
        {children}
      </div>

      {/* Balances the sidebar so the device stays visually centered */}
      <div aria-hidden className="hidden w-56 shrink-0 lg:block" />

      <Link
        to="/screens"
        aria-label="كل الشاشات"
        title={title}
        className="fixed bottom-24 left-4 z-50 flex items-center gap-2 rounded-full bg-inverse-surface/90 px-4 py-2 font-label-lg text-label-lg text-inverse-on-surface shadow-lift backdrop-blur transition hover:scale-105 hover:bg-inverse-surface lg:hidden"
      >
        <span className="material-symbols-outlined text-[18px]">grid_view</span>
        <span className="hidden sm:inline">الشاشات</span>
      </Link>
    </div>
  );
}

function sectionLabel(family: string) {
  return screenGroups.find((g) => g.id === family)?.label ?? "";
}
