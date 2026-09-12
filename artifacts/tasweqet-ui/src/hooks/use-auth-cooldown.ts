import { useCallback, useEffect, useMemo, useState } from "react";

export const AUTH_OTP_COOLDOWN_SECONDS = 120;

export type AuthCooldownAction = "login" | "register";

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function authCooldownStorageKey(
  action: AuthCooldownAction,
  phone: string,
): string {
  return `tb:auth-otp-cooldown:${action}:${encodeURIComponent(phone)}`;
}

export function cooldownSecondsFromDeadline(
  deadline: number | null | undefined,
  now = Date.now(),
): number {
  if (!deadline || !Number.isFinite(deadline)) return 0;
  return Math.max(0, Math.ceil((deadline - now) / 1_000));
}

export function readAuthCooldownDeadline(
  action: AuthCooldownAction,
  phone: string,
  store: Pick<Storage, "getItem" | "removeItem"> | null = storage(),
): number | null {
  if (!phone || !store) return null;
  try {
    const raw = store.getItem(authCooldownStorageKey(action, phone));
    const deadline = raw ? Number(raw) : NaN;
    if (!Number.isFinite(deadline) || deadline <= Date.now()) {
      if (raw) store.removeItem(authCooldownStorageKey(action, phone));
      return null;
    }
    return deadline;
  } catch {
    return null;
  }
}

export function useAuthCooldown(
  action: AuthCooldownAction,
  phone: string | null | undefined,
) {
  const key = useMemo(
    () => phone ? authCooldownStorageKey(action, phone) : null,
    [action, phone],
  );
  const [deadline, setDeadline] = useState<number | null>(() =>
    phone ? readAuthCooldownDeadline(action, phone) : null,
  );
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    setDeadline(phone ? readAuthCooldownDeadline(action, phone) : null);
    setNow(Date.now());
  }, [action, phone]);

  const seconds = cooldownSecondsFromDeadline(deadline, now);

  useEffect(() => {
    if (!deadline) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => window.clearInterval(timer);
  }, [deadline]);

  useEffect(() => {
    if (seconds !== 0 || !key) return;
    const store = storage();
    try {
      store?.removeItem(key);
    } catch {
      // Storage can be unavailable in private browsing/webviews.
    }
  }, [key, seconds]);

  const start = useCallback((durationSeconds: number) => {
    const duration = Number.isFinite(durationSeconds)
      ? Math.max(0, Math.ceil(durationSeconds))
      : 0;
    if (!key || duration <= 0) {
      setDeadline(null);
      return;
    }
    const nextDeadline = Date.now() + duration * 1_000;
    setDeadline(nextDeadline);
    const store = storage();
    try {
      store?.setItem(key, String(nextDeadline));
    } catch {
      // The in-memory countdown still prevents duplicate submissions.
    }
  }, [key]);

  const clear = useCallback(() => {
    setDeadline(null);
    const store = storage();
    try {
      if (key) store?.removeItem(key);
    } catch {
      // Ignore unavailable session storage.
    }
  }, [key]);

  return {
    seconds,
    deadline,
    isActive: seconds > 0,
    start,
    clear,
  };
}