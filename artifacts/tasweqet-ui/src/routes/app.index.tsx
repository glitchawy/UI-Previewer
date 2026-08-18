import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import {
  Icon,
  Card,
  SectionTitle,
  Badge,
  MobileShell,
} from "@/components/tb/shell";
import { categories, restaurants, offers, notifications } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";
import { getSession, clearSession, getRoleDashboard } from "@/lib/auth-session";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    // Wrong role — redirect to their actual dashboard
    if (session.user.role !== "customer") throw redirect({ to: getRoleDashboard(session.user.role) });
  },
  head: () => ({
    meta: [
      { title: "طلبات بيتك | الرئيسية" },
      { name: "description", content: "اطلب أكلك المفضل من أقرب المطاعم إليك" },
    ],
  }),
  component: AppIndex,
});

function AppIndex() {
  const navigate = useNavigate();
  const session = getSession();
  const unread = notifications.filter((n) => n["unread"]).length;
  const sorted = [...restaurants].sort((a, b) => a.distanceKm - b.distanceKm);

  function handleLogout() {
    clearSession();
    navigate({ to: "/auth/login" });
  }

  return (
    <MobileShell tabs={customerTabs}>
      <header className="sticky top-0 z-20 flex items-center gap-sm border-b border-outline-variant bg-surface-container-lowest/95 px-md py-3 backdrop-blur">
        <Link to="/app/address" className="flex min-w-0 flex-1 items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name="location_on" className="text-[20px]" />
          </span>
          <span className="min-w-0 flex-1 text-right">
            <span className="block font-label-md text-label-md text-on-surface-variant">التوصيل إلى</span>
            <span className="block truncate font-label-lg text-label-lg text-on-surface">
              {session?.user.lat ? "موقعك الحالي" : "٧ ش ٩، المعادي"}
            </span>
          </span>
          <Icon name="expand_more" className="text-on-surface-variant" />
        </Link>
        <Link
          to="/app/notifications"
          className="relative flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
        >
          <Icon name="notifications" />
          {unread > 0 && <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-error" />}
        </Link>
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
          title="تسجيل الخروج"
        >
          <Icon name="logout" className="text-[20px]" />
        </button>
      </header>

      {/* User greeting */}
      {session && (
        <div className="flex items-center gap-2 bg-surface-container-low px-md py-2">
          <Icon name="waving_hand" className="text-[18px] text-secondary" />
          <p className="font-label-md text-label-md text-on-surface-variant">
            أهلاً 👋 رقمك{" "}
            <span className="font-label-lg text-on-surface" dir="ltr">+20{session.user.phone}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-lg p-md">
        <Link
          to="/app/search"
          className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-low px-3 py-3 text-on-surface-variant transition hover:border-secondary"
        >
          <Icon name="search" />
          <span className="font-body-md text-body-md">دور على مطعم أو أكلة...</span>
        </Link>

        <section>
          <SectionTitle title="الفئات" icon="category" />
          <div className="tb-stagger grid grid-cols-4 gap-3">
            {categories.map((c) => (
              <Link
                key={c["id"]}
                to="/app/category/$id"
                params={{ id: c["id"] }}
                className="flex flex-col items-center gap-1.5 rounded-card border border-outline-variant bg-surface-container-lowest p-2 transition hover:border-secondary active:scale-95"
              >
                <span className="flex size-12 items-center justify-center rounded-full bg-tertiary-container text-on-tertiary-container">
                  <Icon name={c["icon"]} className="text-[22px]" />
                </span>
                <span className="truncate font-label-md text-label-md text-on-surface">{c["name"]}</span>
              </Link>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="عروض النهاردة" icon="local_offer" />
          <div className="tb-stagger flex gap-3 overflow-x-auto pb-1">
            {offers.map((o) => (
              <Card key={o["id"]} className="min-w-[240px] shrink-0 bg-primary-container p-md text-on-primary-container">
                <p className="font-label-md text-label-md opacity-80">{o["scope"]}</p>
                <p className="mt-1 font-headline-md text-headline-md">{o["title"]}</p>
                <p className="mt-2 font-label-md text-label-md opacity-80">حتى {o["to"]}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle title="أقرب المطاعم" icon="near_me" />
          <div className="tb-stagger flex flex-col gap-3">
            {sorted.map((r) => (
              <Link key={r["id"]} to="/app/restaurant/$id" params={{ id: r["id"] }} className="block">
                <Card className="overflow-hidden transition hover:border-secondary active:scale-[0.99]">
                  <div className="relative h-32 w-full">
                    <img src={r["cover"]} alt={r["name"]} className="h-full w-full object-cover" />
                    {r["open"] === false && (
                      <div className="absolute inset-0 flex items-center justify-center bg-scrim/60">
                        <Badge tone="danger">مغلق حالياً</Badge>
                      </div>
                    )}
                    <button type="button" aria-label="مفضلة" className="absolute left-2 top-2 flex size-8 items-center justify-center rounded-full bg-surface-container-lowest/90 text-error">
                      <Icon name="favorite" className="text-[18px]" filled />
                    </button>
                    {r["offer"] && (
                      <span className="absolute bottom-2 right-2">
                        <Badge tone="warn">{r["offer"]}</Badge>
                      </span>
                    )}
                  </div>
                  <div className="p-md">
                    <div className="flex items-center justify-between gap-sm">
                      <h3 className="font-headline-md text-headline-md text-on-surface">{r["name"]}</h3>
                      <span className="flex items-center gap-0.5 font-label-lg text-label-lg text-on-surface">
                        <Icon name="star" className="text-[16px] text-primary" filled />{r["rating"]}
                      </span>
                    </div>
                    <p className="mt-1 truncate font-body-md text-body-md text-on-surface-variant">{r["description"]}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge tone="neutral"><Icon name="near_me" className="text-[14px]" />{r["distanceKm"]} كم</Badge>
                      <Badge tone="neutral"><Icon name="schedule" className="text-[14px]" />{r["etaMin"]} د</Badge>
                      <Badge tone={r["deliveryProvider"] === "TALABAT_BETAK" ? "info" : "success"}>
                        {r["deliveryProvider"] === "TALABAT_BETAK" ? "توصيل طلبات بيتك" : "توصيل المطعم"}
                      </Badge>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </MobileShell>
  );
}
