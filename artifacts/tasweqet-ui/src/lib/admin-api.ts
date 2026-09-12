import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { getToken } from "./auth-session";
import { translate } from "@/lib/i18n";

export async function adminApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  return adminRequest<T>(`/admin/core${path}`, { signal });
}

export async function adminRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error(translate("يجب تسجيل الدخول أولاً", "You must sign in first"));
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...(options.body ? { "Content-Type": "application/json" } : {}), ...options.headers },
  });
  const body = await response.json().catch(() => null) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(body?.error || translate("تعذر تحميل البيانات", "Unable to load data"));
  return body as T;
}

export type Page<T> = { items: T[]; page: number; pageSize: number; total: number; totalPages: number };
export type AdminOrder = {
  id: number; code: string; customerName: string | null; customerPhone: string | null;
  restaurantName: string; status: string; paymentMethod: string; paymentStatus: string;
  total: number; walletAmountUsed: number; createdAt: string;
};
export type AdminCustomer = {
  id: number; name: string | null; phone: string; addressText: string | null;
  walletBalance: number; createdAt: string; orders: number; spend: number;
};