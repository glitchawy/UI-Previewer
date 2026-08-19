import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { Icon, Card, SectionTitle, Badge, MobileShell } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { getSession, clearSession, getRoleDashboard } from "@/lib/auth-session";

export const Route = createFileRoute("/app/")({
  beforeLoad: () => {
    const session = getSession();
    if (!session) throw redirect({ to: "/auth/login" });
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

type ApiRestaurant = {
  id: number; name: string; description: string | null; address: string;
  category: string | null; deliveryType: string; logoUrl: string | null;
  coverUrl: string | null; hours: string | null; status: string;
};

function AppIndex() {
  const navigate = useNavigate();
  const session = getSession();
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then((d: ApiRestaurant[]) => setRestaurants(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  function handleLogout() { clearSession(); navigate({ to: "/auth/login" }); }

  const byCategory = Array.from(new Set(restaurants.map((r) => r.category).filter(Boolean)));

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
              {session?.user.lat ? "موقعك الحالي" : "اضبط موقعك"}
            </span>
          </span>
          <Icon name="expand_more" className="text-on-surface-variant" />
        </Link>
        <Link to="/app/notifications" className="relative flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container">
          <Icon name="notifications" />
        </Link>
        <button onClick={handleLogout} className="flex size-9 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container" title="تسجيل الخروج">
          <Icon name="logout" className="text-[20px]" />
        </button>
      </header>

      {session && (
        <div className="flex items-center gap-2 bg-surface-container-low px-md py-2">
          <Icon name="waving_hand" className="text-[18px] text-secondary" />
          <p className="font-label-md text-label-md text-on-surface-variant">
            أهلاً 👋{" "}
            <span className="font-label-lg text-on-surface" dir="ltr">+20{session.user.phone}</span>
          </p>
        </div>
      )}

      <div className="flex flex-col gap-lg p-md">
        <Link to="/app/search"
          className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-low px-3 py-3 text-on-surface-variant transition hover:border-secondary">
          <Icon name="search" />
          <span className="font-body-md text-body-md">دور على مطعم أو أكلة...</span>
        </Link>

        {/* Category chips derived from real restaurant data */}
        {byCategory.length > 0 && (
          <section>
            <SectionTitle title="الفئات" icon="category" />
            <div className="flex flex-wrap gap-2">
              {byCategory.map((cat) => (
                <Link key={cat} to="/app/search" search={{ q: cat ?? "" }}
                  className="rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-1.5 font-label-md text-label-md text-on-surface transition hover:border-secondary">
                  {cat}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle title="المطاعم المتاحة" icon="storefront" />
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" />
            </div>
          ) : restaurants.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-card border border-dashed border-outline-variant py-xl text-center">
              <Icon name="storefront" className="text-[48px] text-outline" />
              <p className="font-body-md text-body-md text-on-surface-variant">لا توجد مطاعم نشطة بعد</p>
            </div>
          ) : (
            <div className="tb-stagger flex flex-col gap-3">
              {restaurants.map((r) => (
                <Link key={r.id} to="/app/restaurant/$id" params={{ id: String(r.id) }} className="block">
                  <Card className="overflow-hidden transition hover:border-secondary active:scale-[0.99]">
                    <div className="relative h-32 w-full">
                      {r.coverUrl ? (
                        <img src={`/api/storage${r.coverUrl}`} alt={r.name} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-surface-container">
                          <Icon name="restaurant" className="text-[48px] text-outline" />
                        </div>
                      )}
                    </div>
                    <div className="p-md">
                      <div className="flex items-center justify-between gap-sm">
                        <div className="flex items-center gap-2">
                          {r.logoUrl && (
                            <img src={`/api/storage${r.logoUrl}`} alt="" className="size-9 rounded-full border border-outline-variant object-cover" />
                          )}
                          <h3 className="font-headline-md text-headline-md text-on-surface">{r.name}</h3>
                        </div>
                      </div>
                      {r.description && (
                        <p className="mt-1 truncate font-body-md text-body-md text-on-surface-variant">{r.description}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {r.category && <Badge tone="neutral">{r.category}</Badge>}
                        <Badge tone={r.deliveryType === "platform" ? "info" : "success"}>
                          {r.deliveryType === "platform" ? "توصيل طلبات بيتك" : "توصيل المطعم"}
                        </Badge>
                        {r.hours && <Badge tone="neutral"><Icon name="schedule" className="text-[14px]" />{r.hours}</Badge>}
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </MobileShell>
  );
}
