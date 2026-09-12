import { localizedFetch as fetch } from "@/lib/i18n-fetch";

const SESSION_KEY = "tasweqet_session";

export interface AuthUser {
  id: number;
  phone: string;
  role: "customer" | "partner" | "driver" | "admin";
  name: string | null;
  lat: number | null;
  lng: number | null;
  addressText?: string | null;
  addressDetails?: string | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  isDevMode?: boolean;
}

export function saveSession(session: AuthSession): void {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}

/**
 * Invalidate the opaque token on the server, then clear the local copy even
 * when the request cannot be completed.
 */
export async function logoutSession(): Promise<void> {
  const token = getToken();
  try {
    if (token) {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  } finally {
    clearSession();
  }
}

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

/** Where each role lands after login */
export function getRoleDashboard(role: string): string {
  if (role === "admin") return "/admin";
  if (role === "partner") return "/partner";
  if (role === "driver") return "/driver";
  return "/app";
}

/**
 * Validate the stored token against the server.
 * Returns the session if valid, null if expired/invalid (and clears local storage).
 * Falls back to the cached session on network error.
 */
export async function validateWithServer(options?: { allowCachedOnNetworkError?: boolean }): Promise<AuthSession | null> {
  const session = getSession();
  if (!session) return null;
  try {
    const res = await fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${session.token}` },
    });
    if (!res.ok) {
      clearSession();
      return null;
    }
    const user = (await res.json()) as AuthUser;
    const updated: AuthSession = { token: session.token, user, isDevMode: session.isDevMode };
    saveSession(updated);
    return updated;
  } catch {
    if (options?.allowCachedOnNetworkError === false) return null;
    return session; // non-admin offline experience may trust cache
  }
}
