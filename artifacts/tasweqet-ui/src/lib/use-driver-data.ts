import { useCallback, useEffect, useState } from "react";
import { driverApi } from "./driver-api";

export function useDriverData<T>(path: string) {
  const [data, setData] = useState<T>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true); setError("");
    try { setData(await driverApi<T>(path)); }
    catch (value) { setError(value instanceof Error ? value.message : "تعذر تحميل البيانات"); }
    finally { setLoading(false); }
  }, [path]);
  useEffect(() => { void load(); }, [load]);
  return { data, error, loading, retry: load, setData };
}
