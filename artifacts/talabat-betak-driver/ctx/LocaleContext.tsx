import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setLocaleGetter } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import {
  DEFAULT_LOCALE,
  directionForLocale,
  normalizeLocale,
  translate,
  type Locale,
} from '@/lib/i18n';
import { persistLocale, readPersistedLocale } from '@/utils/localeStorage';

interface LocaleState {
  locale: Locale;
  isRTL: boolean;
  direction: 'rtl' | 'ltr';
  isLoading: boolean;
  setLocale: (locale: Locale) => Promise<void>;
  toggleLocale: () => Promise<void>;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleState | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  const [isLoading, setIsLoading] = useState(true);
  const localeRef = useRef<Locale>(DEFAULT_LOCALE);
  const queryClient = useQueryClient();
  localeRef.current = locale;

  useEffect(() => {
    // The shared fetcher reads this getter immediately before every request,
    // including requests made by background refreshes. Keeping the locale in a
    // ref avoids replacing the getter or reloading the native app on a switch.
    setLocaleGetter(() => localeRef.current);
    return () => {
      setLocaleGetter(null);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    void readPersistedLocale(AsyncStorage)
      .then((saved) => {
        if (mounted) setLocaleState(saved);
      })
      .catch((error: unknown) => {
        console.warn('Failed to read saved driver locale:', error);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const setLocale = useCallback(async (nextLocale: Locale) => {
    const normalized = normalizeLocale(nextLocale);
    if (normalized === localeRef.current) return;
    setLocaleState(normalized);
    localeRef.current = normalized;
    try {
      await persistLocale(AsyncStorage, normalized);
    } catch (error) {
      // A storage failure must not leave the in-memory language or API header
      // stale; the current session remains usable and can retry persistence.
      console.warn('Failed to save driver locale:', error);
    }
    // Server-provided notifications and errors are localized per request.
    // Refetch active queries so already-mounted screens update immediately.
    try {
      await queryClient.invalidateQueries({ refetchType: 'active' });
    } catch (error) {
      console.warn('Failed to refresh localized driver data:', error);
    }
  }, [queryClient]);

  const toggleLocale = useCallback(
    () => setLocale(locale === 'ar' ? 'en' : 'ar'),
    [locale, setLocale],
  );

  const value = useMemo<LocaleState>(() => {
    const direction = directionForLocale(locale);
    return {
      locale,
      isRTL: direction === 'rtl',
      direction,
      isLoading,
      setLocale,
      toggleLocale,
      t: (key, params = {}) => translate(locale, key, params),
    };
  }, [isLoading, locale, setLocale, toggleLocale]);

  return (
    <LocaleContext.Provider value={value}>
      {isLoading ? null : children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleState {
  const context = useContext(LocaleContext);
  if (!context) throw new Error('useLocale must be used within a LocaleProvider');
  return context;
}