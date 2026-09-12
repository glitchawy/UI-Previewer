import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect, useCallback, type MouseEvent } from "react";
import { Icon } from "@/components/tb/shell";
import { getToken } from "@/lib/auth-session";
import { useTranslation } from "@/lib/i18n";

export type FavTarget = "restaurant" | "product";

type FavIdsState = Set<string>; // "restaurant:3", "product:12"

const key = (t: FavTarget, id: number) => `${t}:${id}`;

// Module store, keyed by the session token that produced it. When the token
// changes (logout / another customer signs in), the cache is discarded.
let cache: FavIdsState | null = null;
let cacheToken: string | null = null;
let loadPromise: Promise<void> | null = null;
let initialLoadComplete = false;
// Desired states changed before the first GET returns. They are overlaid on
// the server snapshot so a fast first tap never drops older saved favorites.
const pendingInitialDesired = new Map<string, boolean>();
// Bumped on every user mutation; an initial GET that resolves after a
// mutation started must merge its snapshot instead of overwriting it.
let mutationVersion = 0;
// Each favorite has its own promise chain. This preserves the customer's
// tap order even when the network completes requests in a different order.
const mutationQueues = new Map<string, Promise<void>>();
const targetVersions = new Map<string, number>();

const listeners = new Set<(s: FavIdsState) => void>();

function notify(next: FavIdsState) {
  cache = next;
  listeners.forEach((l) => l(next));
}

/** Ensure the cache belongs to the current session; reset it if not. */
function syncToken(): string | null {
  const token = getToken();
  if (token !== cacheToken) {
    cacheToken = token;
    cache = null;
    loadPromise = null;
    initialLoadComplete = false;
    pendingInitialDesired.clear();
    mutationVersion = 0;
    mutationQueues.clear();
    targetVersions.clear();
    listeners.forEach((l) => l(new Set()));
  }
  return token;
}

function ensureLoaded(): void {
  const token = syncToken();
  if (cache !== null || loadPromise !== null) return;
  if (!token) { notify(new Set()); return; }
  const startedToken = token;
  loadPromise = fetch("/api/customer/favorites", {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then(async (r) => {
      if (!r.ok) throw new Error("load failed");
      const data = (await r.json()) as { ids: { targetType: FavTarget; targetId: number }[] };
      if (cacheToken !== startedToken) return;
      // The request may predate one or more optimistic taps. Start with the
      // complete server snapshot, then apply those explicit desired states.
      const merged = new Set(data.ids.map((i) => key(i.targetType, i.targetId)));
      pendingInitialDesired.forEach((favorited, favoriteKey) => {
        if (favorited) merged.add(favoriteKey); else merged.delete(favoriteKey);
      });
      pendingInitialDesired.clear();
      initialLoadComplete = true;
      notify(merged);
    })
    .catch(() => {
      if (cacheToken === startedToken && cache === null) notify(new Set());
    })
    .finally(() => { loadPromise = null; });
}

/** Shared favorite-ids store with optimistic, race-safe toggles. */
export function useFavoriteIds() {
  const [ids, setIds] = useState<FavIdsState>(() => { syncToken(); return cache ?? new Set(); });

  useEffect(() => {
    listeners.add(setIds);
    ensureLoaded();
    // Pick up any state produced between render and effect
    setIds(cache ?? new Set());
    return () => { listeners.delete(setIds); };
  }, []);

  const toggle = useCallback(async (targetType: FavTarget, targetId: number) => {
    const token = syncToken();
    if (!token) return;
    mutationVersion += 1;
    const k = key(targetType, targetId);
    const targetVersion = (targetVersions.get(k) ?? 0) + 1;
    targetVersions.set(k, targetVersion);
    const prev = cache ?? new Set<string>();
    const next = new Set(prev);
    const desired = !next.has(k);
    if (desired) next.add(k); else next.delete(k);
    if (!initialLoadComplete) pendingInitialDesired.set(k, desired);
    notify(next); // optimistic
    const run = async () => {
      try {
        // The per-target queue means requests reach the API in exactly the
        // same order as taps. Desired-state writes are therefore deterministic.
        const r = await fetch("/api/customer/favorites", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ targetType, targetId, favorited: desired }),
        });
        if (!r.ok) throw new Error("toggle failed");
        const { favorited } = (await r.json()) as { favorited: boolean };
        // A newer tap already owns the UI state; never let an old response
        // reverse it, even if it completed later.
        if (cacheToken !== token || targetVersions.get(k) !== targetVersion) return;
        const confirmed = new Set(cache ?? next);
        if (favorited) confirmed.add(k); else confirmed.delete(k);
        notify(confirmed);
      } catch {
        // Roll back only the latest action for this exact heart.
        if (cacheToken === token && targetVersions.get(k) === targetVersion) {
          // If the initial snapshot is still pending, do not let it later
          // resurrect this failed desired state over the server response.
          if (!initialLoadComplete) pendingInitialDesired.delete(k);
          notify(prev);
        }
      }
    };

    const queued = (mutationQueues.get(k) ?? Promise.resolve()).then(run, run);
    mutationQueues.set(k, queued);
    try {
      await queued;
    } finally {
      if (mutationQueues.get(k) === queued) mutationQueues.delete(k);
    }
  }, []);

  const isFav = useCallback((t: FavTarget, id: number) => ids.has(key(t, id)), [ids]);
  return { isFav, toggle };
}

/** Heart toggle for cards. Rendered as a span so it can nest inside buttons/links. */
export function FavButton({
  targetType,
  targetId,
  className = "",
}: {
  targetType: FavTarget;
  targetId: number;
  className?: string;
}) {
  const { isFav, toggle } = useFavoriteIds();
  const { t } = useTranslation();
  const fav = isFav(targetType, targetId);

  function onClick(e: MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle(targetType, targetId);
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(e as unknown as MouseEvent); }}
      aria-label={fav ? t("إزالة من المفضلة", "Remove from favorites") : t("أضف للمفضلة", "Add to favorites")}
      className={`flex size-8 cursor-pointer items-center justify-center rounded-full bg-surface-container-lowest/90 transition active:scale-90 ${fav ? "text-error" : "text-on-surface-variant"} ${className}`}
    >
      <Icon name="favorite" className="text-[18px]" filled={fav} />
    </span>
  );
}
