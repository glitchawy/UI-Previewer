import { useCallback, useEffect, useState } from "react";
import { driverApi } from "./driver-api";
import { useTranslation } from "./i18n";

export function useDriverData<T>(path: string) {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await driverApi<T>(path)); }
    catch (value) { setError(value instanceof Error ? value.message : t("تعذر تحميل البيانات", "Could not load data")); }
    finally { setLoading(false); }
  }, [path, locale, t]);
  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, retry: load, setData };
}
