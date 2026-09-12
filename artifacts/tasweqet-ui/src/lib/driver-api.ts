import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { getToken } from "./auth-session";
import { getLocale, translate } from "@/lib/i18n";
export { getFreshForegroundFix } from "./driver-location";

export async function driverApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error(translate("يجب تسجيل الدخول أولاً", "Please sign in first"));
  const response = await fetch(`/api/driver${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": getLocale(),
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(body?.error || translate("تعذر تنفيذ الطلب", "Could not complete request"));
  return body as T;
}

export type DriverAccount = {
  id: number; fullName: string; phone: string; area: string; vehicleType: string; status: string;
  isOnline: boolean; isAvailable: boolean; lastHeartbeatAt: string | null;
  locationUpdatedAt: string | null; dispatchLocationUpdatedAt: string | null;
  dispatchLocationSource: "foreground_idle" | "active_tracking" | null;
  currentWorkload: number; deliveries: number;
};
export type DriverDelivery = {
  id: number; code: string; restaurantName: string; deliveryAddressText: string;
  status: string; deliveredAt: string | null; createdAt: string; earnings: number;
};
export type DriverEarning = {
  id: number; orderId: number; deliveryFee: number; shareRate: number;
  bonus: number; netAmount: number; createdAt: string;
};
export type DriverEarnings = {
  total: number; today: number; week: number; orderCount: number; entries: DriverEarning[];
};
export type DriverDocument = {
  id: number; documentType: string; version: number; reviewStatus: string;
  reviewReason: string | null; uploadedAt: string; accessUrl: string;
};
export type DriverDocuments = {
  applicationStatus: string; rejectionReason: string | null; items: DriverDocument[];
};
