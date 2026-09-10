import { getToken } from "./auth-session";
export { getFreshForegroundFix } from "./driver-location";

export async function driverApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  if (!token) throw new Error("يجب تسجيل الدخول أولاً");
  const response = await fetch(`/api/driver${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });
  const body = await response.json().catch(() => null) as ({ error?: string } & T) | null;
  if (!response.ok) throw new Error(body?.error || "تعذر تنفيذ الطلب");
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
