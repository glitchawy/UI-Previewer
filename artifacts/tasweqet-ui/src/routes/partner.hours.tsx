import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Badge, Icon, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";
import { useTranslation, translate, getLocale } from "@/lib/i18n";

export const Route = createFileRoute("/partner/hours")({
  head: () => ({ meta: [{ title: translate("مواعيد العمل — طلبات بيتك", "Opening hours — Talabat Betak") }] }),
  component: PartnerHours,
});

type DayKey = "SAT" | "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI";
type DayEntry = { open: string; close: string; closed: boolean };
type Hours = Record<DayKey, DayEntry>;

const DAY_LABELS: { key: DayKey; ar: string; en: string }[] = [
  { key: "SAT", ar: "السبت", en: "Saturday" },
  { key: "SUN", ar: "الأحد", en: "Sunday" },
  { key: "MON", ar: "الإثنين", en: "Monday" },
  { key: "TUE", ar: "الثلاثاء", en: "Tuesday" },
  { key: "WED", ar: "الأربعاء", en: "Wednesday" },
  { key: "THU", ar: "الخميس", en: "Thursday" },
  { key: "FRI", ar: "الجمعة", en: "Friday" },
];

const DEFAULT_HOURS: Hours = {
  SAT: { open: "10:00", close: "02:00", closed: false },
  SUN: { open: "10:00", close: "02:00", closed: false },
  MON: { open: "10:00", close: "02:00", closed: false },
  TUE: { open: "10:00", close: "02:00", closed: false },
  WED: { open: "10:00", close: "02:00", closed: false },
  THU: { open: "10:00", close: "02:00", closed: false },
  FRI: { open: "12:00", close: "02:00", closed: false },
};

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json", "Accept-Language": getLocale() } : { "Content-Type": "application/json", "Accept-Language": getLocale() };
}

function PartnerHours() {
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
  const [hours, setHours] = useState<Hours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);
  const formDirtyRef = useRef(false);

  async function load() {
    const initialLoad = !formDirtyRef.current && loading;
    if (initialLoad) setLoading(true);
    setErr("");
    try {
      const r = await fetch("/api/partner/restaurant/hours", { headers: authHeaders() });
      if (!r.ok) throw new Error();
      const data = await r.json() as Hours;
      if (!formDirtyRef.current) setHours(data);
    } catch { setErr(t("تعذر تحميل المواعيد الافتراضية. يمكنك مراجعتها وحفظها.", "Could not load saved hours. Review the defaults and save them.")); }
    finally { if (initialLoad) setLoading(false); }
  }

  useEffect(() => { void load(); }, [locale]);

  function update(day: DayKey, field: keyof DayEntry, value: string | boolean) {
    formDirtyRef.current = true;
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }));
    setOk(false);
  }

  async function save() {
    setSaving(true); setErr(""); setOk(false);
    try {
      const r = await fetch("/api/partner/restaurant/hours", {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(hours),
      });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? t("خطأ", "Something went wrong")); }
      formDirtyRef.current = false;
      setOk(true);
    } catch (e) { setErr(e instanceof Error ? e.message : t("خطأ", "Something went wrong")); }
    finally { setSaving(false); }
  }

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("مواعيد العمل", "Opening hours")}>
      <div className="tb-stagger flex flex-col gap-lg">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          {t("المواعيد على مستوى المطعم وتُطبق على كل الفروع", "Hours are set for the restaurant and apply to all branches")}
        </Badge>

        <Card className="p-md">
           <SectionTitle title={t("أيام الأسبوع", "Days of the week")} icon="schedule" />
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Icon name="hourglass_empty" className="animate-spin text-[28px] text-on-surface-variant" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
               {DAY_LABELS.map(({ key, ar, en }) => {
                const entry = hours[key];
                return (
                  <div key={key}
                    className={`flex flex-wrap items-center gap-3 rounded-button border p-2.5 transition ${entry.closed ? "border-outline-variant bg-surface-container-low opacity-60" : "border-outline-variant"}`}>
                     <span className="w-20 font-label-lg text-label-lg text-on-surface">{t(ar, en)}</span>
                    <input type="time" value={entry.open} disabled={entry.closed}
                      onChange={(e) => update(key, "open", e.target.value)}
                      className="rounded-button border border-outline-variant bg-surface-container-lowest px-2 py-1.5 font-body-md text-body-md disabled:opacity-40" />
                     <span className="text-on-surface-variant">{t("إلى", "to")}</span>
                    <input type="time" value={entry.close} disabled={entry.closed}
                      onChange={(e) => update(key, "close", e.target.value)}
                      className="rounded-button border border-outline-variant bg-surface-container-lowest px-2 py-1.5 font-body-md text-body-md disabled:opacity-40" />
                    <label className="mr-auto flex cursor-pointer items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
                      <input type="checkbox" checked={entry.closed}
                        onChange={(e) => update(key, "closed", e.target.checked)}
                        className="rounded" />
                       {t("مغلق", "Closed")}
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex items-center gap-3">
           <Button onClick={save} disabled={saving || loading}>{saving ? t("جاري الحفظ...", "Saving…") : t("حفظ المواعيد", "Save hours")}</Button>
          {err && <p className="font-label-md text-label-md text-error">{err}</p>}
           {ok && <p className="font-label-md text-label-md text-success">{t("تم حفظ المواعيد بنجاح ✓", "Hours saved successfully ✓")}</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
