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
  logoUploadedAt: string | null;
  coverUrl: string | null;
  coverUploadedAt: string | null;
  status: string;
  rejectionReason: string | null;
  latestDocumentUploadedAt: string | null;
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
  nationalIdFrontUploadedAt: string | null;
  nationalIdBackUrl: string | null;
  nationalIdBackUploadedAt: string | null;
  criminalRecordUrl: string | null;
  criminalRecordUploadedAt: string | null;
  licenseUrl: string | null;
  licenseUploadedAt: string | null;
  phone: string | null;
  status: string;
  rejectionReason: string | null;
  latestDocumentUploadedAt: string | null;
  createdAt: string;
}

function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface ApplicationList<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface ApplicationDocument {
  id: number;
  documentType: string;
  objectPath: string;
  uploaderUserId: number;
  version: number;
  uploadedAt: string;
  reviewStatus: string;
  reviewedByAdminId: number | null;
  reviewedAt: string | null;
  reviewReason: string | null;
}

export interface ApplicationDecision {
  id: number;
  actorAdminId: number;
  fromStatus: string;
  toStatus: string;
  reason: string | null;
  requestId: string | null;
  createdAt: string;
}

function queryString(params?: { q?: string; status?: string; reuploaded?: boolean; sort?: string; page?: number; pageSize?: number }) {
  const query = new URLSearchParams();
  if (params?.q) query.set("q", params.q);
  if (params?.status) query.set("status", params.status);
  if (params?.reuploaded) query.set("reuploaded", "true");
  if (params?.sort) query.set("sort", params.sort);
  if (params?.page) query.set("page", String(params.page));
  if (params?.pageSize) query.set("pageSize", String(params.pageSize));
  const value = query.toString();
  return value ? `?${value}` : "";
}

export async function fetchRestaurantApplications(params?: Parameters<typeof queryString>[0]): Promise<ApplicationList<RestaurantApplication>> {
  const res = await fetch(`/api/admin/restaurants${queryString(params)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load restaurant applications");
  return (await res.json()) as ApplicationList<RestaurantApplication>;
}

export async function fetchDriverApplications(params?: Parameters<typeof queryString>[0]): Promise<ApplicationList<DriverApplication>> {
  const res = await fetch(`/api/admin/drivers${queryString(params)}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load driver applications");
  return (await res.json()) as ApplicationList<DriverApplication>;
}

export async function fetchRestaurantApplication(id: number): Promise<{ application: RestaurantApplication; documents: ApplicationDocument[]; decisions: ApplicationDecision[] }> {
  const res = await fetch(`/api/admin/restaurants/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("تعذر تحميل بيانات الطلب");
  return res.json();
}

export async function fetchDriverApplication(id: number): Promise<{ application: DriverApplication; documents: ApplicationDocument[]; decisions: ApplicationDecision[] }> {
  const res = await fetch(`/api/admin/drivers/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error("تعذر تحميل بيانات الطلب");
  const result = await res.json() as { application: { profile: DriverApplication; phone: string | null }; documents: ApplicationDocument[]; decisions: ApplicationDecision[] };
  return { application: { ...result.application.profile, phone: result.application.phone }, documents: result.documents, decisions: result.decisions };
}

export async function updateRestaurantStatus(id: number, status: string, reason?: string): Promise<void> {
  const res = await fetch(`/api/admin/restaurants/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to update restaurant status");
  }
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

/** Current user's own application status (partner/driver dashboards). */
export async function fetchMyApplicationStatus(): Promise<string | null> {
  const res = await fetch("/api/onboard/status", { headers: authHeaders() });
  if (!res.ok) throw new Error("Failed to load application status");
  const body = (await res.json()) as { status: string | null };
  return body.status;
}

export async function updateDriverStatus(id: number, status: string, reason?: string): Promise<void> {
  const res = await fetch(`/api/admin/drivers/${id}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status, reason }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Failed to update driver status");
  }
}
