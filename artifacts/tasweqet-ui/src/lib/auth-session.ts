const SESSION_KEY = "tasweqet_session";

export interface AuthUser {
  id: number;
  phone: string;
  role: "customer" | "partner" | "driver";
  name: string | null;
  lat: number | null;
  lng: number | null;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
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

export function getToken(): string | null {
  return getSession()?.token ?? null;
}

/** Where each role lands after login */
export function getRoleDashboard(role: string): string {
  if (role === "partner") return "/partner";
  if (role === "driver") return "/driver";
  return "/app";
}

/**
 * Validate the stored token against the server.
 * Returns the session if valid, null if expired/invalid (and clears local storage).
 * Falls back to the cached session on network error.
 */
export async function validateWithServer(): Promise<AuthSession | null> {
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
    const updated: AuthSession = { token: session.token, user };
    saveSession(updated);
    return updated;
  } catch {
    return session; // offline / server down → trust cache
  }
}
