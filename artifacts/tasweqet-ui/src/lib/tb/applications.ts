// Fetch helpers for real onboarding applications stored in the database.
import { getToken } from "@/lib/auth-session";

export interface RestaurantApplication {
  id: number;
  ownerUserId: number;
  ownerName: string | null;
  email: string | null;
  name: string;
  description: string | null;
  phone: string | null;
  address: string;
  branches: number;
  hours: string | null;
  category: string | null;
  deliveryType: string;
  logoUrl: string | null;
  coverUrl: string | null;
  status: string;
  createdAt: string;
}

export interface DriverApplication {
  id: number;
  userId: number;
  fullName: string;
  area: string;
  vehicleType: string;
  documents: string | null;
  nationalIdFrontUrl: string | null;
  nationalIdBackUrl: string | null;
  criminalRecordUrl: string | null;
  licenseUrl: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchRestaurantApplications(): Promise<RestaurantApplication[]> {
  const res = await fetch("/api/admin/restaurants", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load restaurant applications");
  return (await res.json()) as RestaurantApplication[];
}

export async function fetchDriverApplications(): Promise<DriverApplication[]> {
  const res = await fetch("/api/admin/drivers", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load driver applications");
  return (await res.json()) as DriverApplication[];
}

/** ids of stored applications are routed as "db-<id>" to distinguish from demo data */
export function appRouteId(id: number): string {
  return `db-${id}`;
}

export function parseAppRouteId(routeId: string): number | null {
  if (!routeId.startsWith("db-")) return null;
  const n = Number(routeId.slice(3));
  return Number.isInteger(n) && n > 0 ? n : null;
}
