import { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { Icon, Card, SectionTitle, Badge, MobileShell } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { getSession, logoutSession, getRoleDashboard, getToken } from "@/lib/auth-session";
import { FavButton } from "@/lib/tb/favorites";

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
  isOpen: boolean; distanceKm: number | null;
};

function AppIndex() {
  const navigate = useNavigate();
  const session = getSession();
  const [restaurants, setRestaurants] = useState<ApiRestaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openOnly, setOpenOnly] = useState(false);
  const [sortByDistance, setSortByDistance] = useState(true);
  const [radiusKm, setRadiusKm] = useState<number | null>(null);
  const hasSavedLocation = session?.user.lat != null && session.user.lng != null;

  useEffect(() => {
    const token = getToken();
    const params = new URLSearchParams();
    if (openOnly) params.set("open", "true");
    if (sortByDistance) params.set("sort", "distance");
    if (activeCategory) params.set("category", activeCategory);
    if (radiusKm) params.set("radiusKm", String(radiusKm));
    setLoading(true);
    let cancelled = false;
    fetch(`/api/restaurants?${params.toString()}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((d: ApiRestaurant[]) => { if (!cancelled) setRestaurants(Array.isArray(d) ? d : []); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [openOnly, sortByDistance, activeCategory, radiusKm]);

  // Category chips need the full list, not the filtered one
  const [allCategories, setAllCategories] = useState<string[]>([]);
  useEffect(() => {
    fetch("/api/restaurants")
      .then((r) => r.json())
      .then((d: ApiRestaurant[]) =>
        setAllCategories(Array.from(new Set((Array.isArray(d) ? d : []).map((r) => r.category).filter((c): c is string => !!c)))))
      .catch(() => {});
  }, []);

  async function handleLogout() {
    await logoutSession();
    navigate({ to: "/auth/login" });
  }

  const byCategory = allCategories;

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
        <Link to="/app/search" search={{ q: undefined }}
          className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-low px-3 py-3 text-on-surface-variant transition hover:border-secondary">
          <Icon name="search" />
          <span className="font-body-md text-body-md">دور على مطعم أو أكلة...</span>
        </Link>

        {/* Category filter chips derived from real restaurant data */}
        {byCategory.length > 0 && (
          <section>
            <SectionTitle title="الفئات" icon="category" />
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setActiveCategory(null)}
                className={`rounded-button border px-3 py-1.5 font-label-md text-label-md transition ${activeCategory === null ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary"}`}>
                الكل
              </button>
              {byCategory.map((cat) => (
                <button key={cat} type="button" onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  className={`rounded-button border px-3 py-1.5 font-label-md text-label-md transition ${activeCategory === cat ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <SectionTitle title="المطاعم المتاحة" icon="storefront" />
          {/* Discovery filters: open now + nearest first (wired to /api/restaurants query params) */}
          <div className="mb-sm flex flex-wrap gap-2">
            <button type="button" onClick={() => setOpenOnly((v) => !v)}
              className={`flex items-center gap-1.5 rounded-button border px-3 py-1.5 font-label-md text-label-md transition ${openOnly ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary"}`}>
              <Icon name="schedule" className="text-[16px]" />
              مفتوح الآن
              {openOnly && <Icon name="close" className="text-[14px]" />}
            </button>
            <button type="button" onClick={() => setSortByDistance((v) => !v)}
              className={`flex items-center gap-1.5 rounded-button border px-3 py-1.5 font-label-md text-label-md transition ${sortByDistance ? "border-primary bg-primary text-on-primary" : "border-outline-variant bg-surface-container-lowest text-on-surface hover:border-secondary"}`}>
              <Icon name="near_me" className="text-[16px]" />
              الأقرب أولاً
              {sortByDistance && <Icon name="close" className="text-[14px]" />}
            </button>
            <label className={`flex items-center gap-1.5 rounded-button border border-outline-variant px-3 py-1.5 font-label-md text-label-md ${hasSavedLocation ? "bg-surface-container-lowest text-on-surface" : "cursor-not-allowed bg-surface-container text-outline"}`}>
              <Icon name="distance" className="text-[16px]" />
              <span>ضمن</span>
              <select
                aria-label="نطاق المسافة"
                value={radiusKm ?? ""}
                disabled={!hasSavedLocation}
                onChange={(e) => setRadiusKm(e.target.value ? Number(e.target.value) : null)}
                className="bg-transparent font-label-md text-label-md outline-none"
              >
                <option value="">أي مسافة</option>
                <option value="5">٥ كم</option>
                <option value="10">١٠ كم</option>
                <option value="20">٢٠ كم</option>
              </select>
            </label>
            {!hasSavedLocation && (
              <Link to="/app/address" className="flex items-center gap-1 font-label-md text-label-md text-secondary">
                <Icon name="location_on" className="text-[15px]" />حدد موقعك
              </Link>
            )}
          </div>
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
              {(activeCategory ? restaurants.filter((r) => r.category === activeCategory) : restaurants).map((r) => (
                <Link key={r.id} to="/app/restaurant/$id" params={{ id: String(r.id) }} className="block">
                  <Card className="overflow-hidden transition hover:border-secondary active:scale-[0.99]">
                    <div className="relative h-32 w-full">
                      {r.coverUrl ? (
                        <img src={`/api/storage${r.coverUrl}`} alt={r.name} className={`h-full w-full object-cover ${r.isOpen ? "" : "grayscale"}`} />
                      ) : (
                        <div className="flex h-full items-center justify-center bg-surface-container">
                          <Icon name="restaurant" className="text-[48px] text-outline" />
                        </div>
                      )}
                      <FavButton targetType="restaurant" targetId={r.id} className="absolute left-2 top-2 z-10" />
                      {!r.isOpen && (
                        <span className="absolute inset-x-0 bottom-0 bg-scrim/60 py-1 text-center font-label-md text-label-md text-white">
                          مغلق حالياً
                        </span>
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
                        {r.distanceKm != null && (
                          <Badge tone="neutral"><Icon name="near_me" className="text-[14px]" />{r.distanceKm.toLocaleString("ar-EG")} كم</Badge>
                        )}
                        <Badge tone={r.isOpen ? "success" : "neutral"}>{r.isOpen ? "مفتوح" : "مغلق"}</Badge>
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
