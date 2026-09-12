import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, normalizeLocale, type Locale } from '../lib/i18n';

export interface LocaleStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

export async function readPersistedLocale(storage: LocaleStorage): Promise<Locale> {
  return normalizeLocale(await storage.getItem(LOCALE_STORAGE_KEY));
}

export async function persistLocale(storage: LocaleStorage, locale: Locale): Promise<void> {
  await storage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
}

export function defaultLocale(): Locale {
  return DEFAULT_LOCALE;
}