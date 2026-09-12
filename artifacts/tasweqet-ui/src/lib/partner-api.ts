import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useCallback, useEffect, useRef, useState } from "react";
import { getToken } from "./auth-session";
import { getLocale, translate, useTranslation } from "@/lib/i18n";

export function partnerHeaders(json = false): HeadersInit {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Accept-Language": getLocale(),
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export async function partnerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { ...partnerHeaders(Boolean(init?.body)), ...init?.headers } });
  const body = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) throw new Error((body as { error?: string } | null)?.error ?? translate("تعذر تنفيذ الطلب", "Could not complete request"));
  return body as T;
}

export function usePartnerResource<T>(path: string) {
  const { locale } = useTranslation();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const loadedRef = useRef(false);
  const reload = useCallback(async () => {
    if (!loadedRef.current) setLoading(true);
    setError("");
    try { setData(await partnerRequest<T>(path)); loadedRef.current = true; }
    catch (cause) { setError(cause instanceof Error ? cause.message : translate("تعذر تحميل البيانات", "Could not load data")); }
    finally { setLoading(false); }
  }, [path, locale]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}