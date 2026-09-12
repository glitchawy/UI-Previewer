import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type Locale = "ar" | "en";
export type Direction = "rtl" | "ltr";
export type TranslationParams = Record<string, string | number>;
export type LocalizedText = { ar: string; en: string };
export type TranslationArgs = readonly [
  ar: string,
  en: string,
  params?: TranslationParams,
];

export const LOCALE_STORAGE_KEY = "tb_locale";

const localeDirection: Record<Locale, Direction> = { ar: "rtl", en: "ltr" };
const localeIntl: Record<Locale, string> = { ar: "ar-EG", en: "en-EG" };

let currentLocale: Locale = readStoredLocale();
const queryClients = new Set<{ invalidateQueries: () => unknown }>();
const localeListeners = new Set<(locale: Locale) => void>();

function isLocale(value: unknown): value is Locale {
  return value === "ar" || value === "en";
}

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "ar";
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : "ar";
  } catch {
    return "ar";
  }
}

function persistLocale(locale: Locale): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Storage can be unavailable in private browsing and embedded webviews.
  }
}

function applyDocumentLocale(locale: Locale): void {
  if (typeof document === "undefined") return;
  document.documentElement.lang = locale;
  document.documentElement.dir = localeDirection[locale];
}

function interpolate(value: string, params?: TranslationParams): string {
  if (!params) return value;
  return value.replace(/\{([A-Za-z0-9_]+)\}/g, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(params, key) ? String(params[key]) : match,
  );
}

function selectedTranslation(
  locale: Locale,
  ar: string,
  en: string,
  params?: TranslationParams,
): string {
  // Empty translations intentionally fall back to the other language. This
  // keeps an incomplete inline pair useful without ever rendering "undefined".
  const selected = locale === "ar" ? ar : en;
  const fallback = locale === "ar" ? en : ar;
  return interpolate(selected || fallback, params);
}

export function getLocale(): Locale {
  return currentLocale;
}

export function translate(ar: string, en: string, params?: TranslationParams): string {
  return selectedTranslation(currentLocale, ar, en, params);
}

export function getDirection(locale: Locale = currentLocale): Direction {
  return localeDirection[locale];
}

export function setLocale(locale: Locale): void {
  if (!isLocale(locale)) {
    applyDocumentLocale(currentLocale);
    return;
  }
  if (locale === currentLocale) {
    persistLocale(locale);
    applyDocumentLocale(currentLocale);
    return;
  }
  currentLocale = locale;
  persistLocale(locale);
  applyDocumentLocale(locale);
  for (const listener of localeListeners) {
    try {
      listener(locale);
    } catch {
      // A component unmounting during a locale update should not block it.
    }
  }
  for (const queryClient of queryClients) {
    try {
      void Promise.resolve(queryClient.invalidateQueries()).catch(() => undefined);
    } catch {
      // A disposed client should not prevent language switching.
    }
  }
}

export function subscribeLocale(listener: (locale: Locale) => void): () => void {
  localeListeners.add(listener);
  return () => localeListeners.delete(listener);
}

/** Register the app's QueryClient so locale changes refresh server messages. */
export function registerLocaleQueryClient(
  queryClient: { invalidateQueries: () => unknown },
): () => void {
  queryClients.add(queryClient);
  return () => queryClients.delete(queryClient);
}

export function formatNumber(
  value: number | string,
  optionsOrLocale?: Intl.NumberFormatOptions | Locale,
  locale: Locale = currentLocale,
): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const activeLocale = isLocale(optionsOrLocale) ? optionsOrLocale : locale;
  const options = isLocale(optionsOrLocale) ? undefined : optionsOrLocale;
  return new Intl.NumberFormat(localeIntl[activeLocale], options).format(numeric);
}

export function formatCurrency(
  value: number | string,
  currencyOrLocale: string | Locale | Intl.NumberFormatOptions = "EGP",
  locale: Locale = currentLocale,
): string {
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  const activeLocale = isLocale(currencyOrLocale) ? currencyOrLocale : locale;
  const currency =
    typeof currencyOrLocale === "object"
      ? String(currencyOrLocale.currency ?? "EGP")
      : isLocale(currencyOrLocale)
        ? "EGP"
        : currencyOrLocale;
  const extraOptions = typeof currencyOrLocale === "object" ? currencyOrLocale : {};
  return new Intl.NumberFormat(localeIntl[activeLocale], {
    style: "currency",
    currency,
    currencyDisplay: currency === "EGP" ? "symbol" : "code",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...extraOptions,
  }).format(numeric);
}

export function formatDate(
  value: string | number | Date,
  optionsOrLocale: Intl.DateTimeFormatOptions | Locale = {
    dateStyle: "medium",
    timeStyle: "short",
  },
  locale: Locale = currentLocale,
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const activeLocale = isLocale(optionsOrLocale) ? optionsOrLocale : locale;
  const options: Intl.DateTimeFormatOptions = isLocale(optionsOrLocale)
    ? { dateStyle: "medium", timeStyle: "short" }
    : optionsOrLocale;
  return new Intl.DateTimeFormat(localeIntl[activeLocale], {
    ...options,
    timeZone: options.timeZone ?? "Africa/Cairo",
  }).format(date);
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const moduleLocale = getLocale();
  const [locale, setProviderLocale] = useState<Locale>(() => initialLocale ?? moduleLocale);

  useEffect(() => {
    // Fast Refresh can preserve provider state while replacing this module.
    // Reconcile that state with storage before applying both document attrs.
    const next = initialLocale ?? (moduleLocale === locale ? locale : readStoredLocale());
    if (next !== moduleLocale) setLocale(next);
    if (next !== locale) {
      setProviderLocale(next);
      return;
    }
    applyDocumentLocale(next);
  }, [initialLocale, locale, moduleLocale]);

  useEffect(() => {
    applyDocumentLocale(locale);
  }, [locale]);

  useEffect(() => {
    return subscribeLocale(setProviderLocale);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY || !isLocale(event.newValue)) return;
      setLocale(event.newValue);
      setProviderLocale(event.newValue);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const changeLocale = useCallback((next: Locale) => {
    if (!isLocale(next)) return;
    setLocale(next);
    setProviderLocale(next);
  }, []);

  const t = useCallback(
    (...args: TranslationArgs) => {
      const [ar, en, params] = args;
      return selectedTranslation(locale, ar, en, params);
    },
    [locale],
  );

  const value = useMemo(
    () => ({
      t,
      locale,
      dir: localeDirection[locale],
      setLocale: changeLocale,
    }),
    [changeLocale, locale, t],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

type TranslationContext = {
  t: (...args: TranslationArgs) => string;
  locale: Locale;
  dir: Direction;
  setLocale: (locale: Locale) => void;
};

const LocaleContext = createContext<TranslationContext | null>(null);

export function useTranslation(): TranslationContext {
  const context = useContext(LocaleContext);
  if (!context) throw new Error("useTranslation must be used inside LocaleProvider");
  return context;
}

applyDocumentLocale(currentLocale);