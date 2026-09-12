import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, SectionTitle } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { FavButton } from "@/lib/tb/favorites";
import { getLocale, translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: typeof search.q === "string" ? search.q : undefined,
  }),
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | البحث", "Talabat Betak | Search") },
      { name: "description", content: translate("دور على مطاعم وأكلات وفئات في طلبات بيتك", "Search restaurants, dishes, and categories on Talabat Betak") },
    ],
  }),
  component: AppSearch,
});

const EGP = (n: string | number) => `${Number(n).toLocaleString(getLocale() === "ar" ? "ar-EG" : "en-EG", { minimumFractionDigits: 0 })} ${translate("ج.م", "EGP")}`;

type SearchRestaurant = { id: number; name: string; description: string | null; category: string | null; logoUrl: string | null };
type SearchProduct = { id: number; name: string; description: string | null; imageUrl: string | null; basePrice: string; restaurantId: number; restaurantName: string };
type SearchCategory = { id: number; name: string; restaurantId: number; restaurantName: string };
type Suggestion = { type: "restaurant" | "product" | "category"; id: number; label: string; restaurantId?: number };
type SearchData = { restaurants: SearchRestaurant[]; products: SearchProduct[]; categories: SearchCategory[]; suggestions: Suggestion[] };

const EMPTY: SearchData = { restaurants: [], products: [], categories: [], suggestions: [] };

const RECENT_KEY = "tb_recent_searches";
function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]") as string[]; } catch { return []; }
}
function pushRecent(q: string) {
  const list = [q, ...getRecent().filter((r) => r !== q)].slice(0, 6);
  localStorage.setItem(RECENT_KEY, JSON.stringify(list));
}

function AppSearch() {
  const { t, dir, locale } = useTranslation();
  const { q: initialQ } = Route.useSearch();
  const [query, setQuery] = useState(initialQ ?? "");
  const [data, setData] = useState<SearchData>(EMPTY);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [recent, setRecent] = useState(getRecent());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef("");

  const runSearch = useCallback(async (q: string, autocompleteOnly: boolean) => {
    latest.current = q;
    if (q.trim().length < 2) { setData(EMPTY); setSuggestions([]); return; }
    if (!autocompleteOnly) setLoading(true);
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q)}${autocompleteOnly ? "&autocomplete=true" : ""}`);
      const d = (await r.json()) as SearchData;
      if (latest.current !== q) return;
      if (autocompleteOnly) {
        setSuggestions(d.suggestions);
      } else {
        setData(d);
        setSuggestions([]);
        pushRecent(q.trim());
        setRecent(getRecent());
      }
    } catch {
      if (latest.current === q) { setData(EMPTY); setSuggestions([]); }
    }
    if (latest.current === q) setLoading(false);
  }, []);

  // Initial query from URL (e.g. category chip link)
  useEffect(() => {
    if (query.trim().length >= 2) runSearch(query, false);
    // Re-run the current search when the API's localized fields change.
    // Keep query, suggestions, and recent-search state intact.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  function handleChange(val: string) {
    setQuery(val);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => runSearch(val, true), 350);
  }

  function submit(q: string) {
    setQuery(q);
    if (timer.current) clearTimeout(timer.current);
    runSearch(q, false);
  }

  const hasResults = data.restaurants.length + data.products.length + data.categories.length > 0;

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("البحث", "Search")} back="/app" />
      <div className="flex flex-col gap-lg p-md">
        <div className="relative">
          <div className="flex items-center gap-2 rounded-button border border-secondary bg-surface-container-lowest px-3 py-3">
            <Icon name="search" className="text-on-surface-variant" />
            <input
              className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none placeholder:text-outline"
               placeholder={t("دور على مطعم، أكلة أو فئة...", "Search for a restaurant, dish, or category...")}
              value={query}
              onChange={(e) => handleChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(query); }}
               dir={dir}
              autoFocus
            />
            {loading && <span className="material-symbols-outlined animate-spin text-[18px] text-outline">progress_activity</span>}
          </div>
          {suggestions.length > 0 && (
            <ul className="absolute top-full z-30 mt-1 w-full overflow-hidden rounded-card border border-outline-variant bg-surface-container-lowest shadow-lift">
              {suggestions.map((s, i) => (
                <li key={`${s.type}-${s.id}-${i}`}>
                  <button type="button" onClick={() => submit(s.label)}
                    className="flex w-full items-center gap-2 px-md py-sm text-right transition hover:bg-surface-container-low">
                    <Icon name={s.type === "restaurant" ? "storefront" : s.type === "category" ? "category" : "fastfood"}
                      className="text-[16px] text-outline" />
                    <span className="font-label-md text-label-md text-on-surface">{s.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!hasResults && recent.length > 0 && (
          <section>
             <SectionTitle title={t("عمليات بحث سابقة", "Recent searches")} icon="history" />
            <div className="flex flex-wrap gap-2">
              {recent.map((r) => (
                <button key={r} type="button" onClick={() => submit(r)}
                  className="rounded-full bg-surface-container-low px-3 py-1.5 font-label-md text-label-md text-on-surface-variant transition hover:bg-surface-container">
                  {r}
                </button>
              ))}
            </div>
          </section>
        )}

        {!loading && query.trim().length >= 2 && !hasResults && suggestions.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-xl text-center">
            <Icon name="search_off" className="text-[48px] text-outline" />
             <p className="font-body-md text-body-md text-on-surface-variant">{t("لا توجد نتائج لـ «{query}»", "No results for “{query}”", { query })}</p>
          </div>
        )}

        {data.categories.length > 0 && (
          <section>
             <SectionTitle title={t("فئات", "Categories")} icon="category" />
            <div className="tb-stagger flex flex-col gap-2">
              {data.categories.map((c) => (
                <Link key={c.id} to="/app/restaurant/$id" params={{ id: String(c.restaurantId) }}
                  className="flex items-center gap-3 rounded-button bg-surface-container-low p-3 transition hover:bg-surface-container">
                  <Icon name="category" className="text-on-surface-variant" />
                  <span className="flex-1 font-body-md text-body-md text-on-surface">{c.name}</span>
                  <span className="font-label-md text-label-md text-on-surface-variant">{c.restaurantName}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {data.restaurants.length > 0 && (
          <section>
             <SectionTitle title={t("مطاعم", "Restaurants")} icon="storefront" />
            <div className="tb-stagger flex flex-col gap-2">
              {data.restaurants.map((r) => (
                <Link key={r.id} to="/app/restaurant/$id" params={{ id: String(r.id) }}>
                  <Card className="relative flex items-center gap-3 p-3 transition hover:border-secondary">
                    {r.logoUrl ? (
                      <img src={`/api/storage${r.logoUrl}`} alt={r.name} className="size-12 rounded-full object-cover" />
                    ) : (
                      <span className="flex size-12 items-center justify-center rounded-full bg-surface-container">
                        <Icon name="storefront" className="text-outline" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{r.name}</p>
                      {r.description && <p className="truncate font-label-md text-label-md text-on-surface-variant">{r.description}</p>}
                    </div>
                    <FavButton targetType="restaurant" targetId={r.id} />
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {data.products.length > 0 && (
          <section>
             <SectionTitle title={t("منتجات", "Products")} icon="fastfood" />
            <div className="tb-stagger flex flex-col gap-2">
              {data.products.map((p) => (
                <Link key={p.id} to="/app/product/$id" params={{ id: String(p.id) }}>
                  <Card className="relative flex items-center gap-3 p-3 transition hover:border-secondary">
                    {p.imageUrl ? (
                      <img src={`/api/storage${p.imageUrl}`} alt={p.name} className="size-12 rounded-card object-cover" />
                    ) : (
                      <span className="flex size-12 items-center justify-center rounded-card bg-surface-container">
                        <Icon name="fastfood" className="text-outline" />
                      </span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-label-lg text-label-lg text-on-surface">{p.name}</p>
                      <p className="truncate font-label-md text-label-md text-on-surface-variant">
                        {p.restaurantName} · {EGP(p.basePrice)}
                      </p>
                    </div>
                    <FavButton targetType="product" targetId={p.id} />
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </MobileShell>
  );
}
