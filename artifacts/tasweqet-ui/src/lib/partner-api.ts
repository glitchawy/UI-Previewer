import { useCallback, useEffect, useState } from "react";
import { getToken } from "./auth-session";

export function partnerHeaders(json = false): HeadersInit {
  const token = getToken();
  return {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(json ? { "Content-Type": "application/json" } : {}),
  };
}

export async function partnerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, { ...init, headers: { ...partnerHeaders(Boolean(init?.body)), ...init?.headers } });
  const body = await response.json().catch(() => null) as T | { error?: string } | null;
  if (!response.ok) throw new Error((body as { error?: string } | null)?.error ?? "تعذر تنفيذ الطلب");
  return body as T;
}

export function usePartnerResource<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await partnerRequest<T>(path)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحميل البيانات"); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}