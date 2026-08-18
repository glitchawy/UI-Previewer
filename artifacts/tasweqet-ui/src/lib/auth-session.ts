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
