import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Badge, Icon, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/partner/hours")({
  head: () => ({ meta: [{ title: "مواعيد العمل — طلبات بيتك" }] }),
  component: PartnerHours,
});

type DayKey = "SAT" | "SUN" | "MON" | "TUE" | "WED" | "THU" | "FRI";
type DayEntry = { open: string; close: string; closed: boolean };
type Hours = Record<DayKey, DayEntry>;

const DAY_LABELS: { key: DayKey; label: string }[] = [
  { key: "SAT", label: "السبت" },
  { key: "SUN", label: "الأحد" },
  { key: "MON", label: "الإثنين" },
  { key: "TUE", label: "الثلاثاء" },
  { key: "WED", label: "الأربعاء" },
  { key: "THU", label: "الخميس" },
  { key: "FRI", label: "الجمعة" },
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
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

function PartnerHours() {
  const [hours, setHours] = useState<Hours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/partner/restaurant/hours", { headers: authHeaders() });
      if (!r.ok) throw new Error();
      setHours(await r.json() as Hours);
    } catch { /* fallback to defaults */ }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  function update(day: DayKey, field: keyof DayEntry, value: string | boolean) {
    setHours((h) => ({ ...h, [day]: { ...h[day], [field]: value } }));
    setOk(false);
  }

  async function save() {
    setSaving(true); setErr(""); setOk(false);
    try {
      const r = await fetch("/api/partner/restaurant/hours", {
        method: "PATCH", headers: authHeaders(), body: JSON.stringify(hours),
      });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ"); }
      setOk(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="مواعيد العمل">
      <div className="tb-stagger flex flex-col gap-lg">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          المواعيد على مستوى المطعم وتُطبق على كل الفروع
        </Badge>

        <Card className="p-md">
          <SectionTitle title="أيام الأسبوع" icon="schedule" />
          {loading ? (
            <div className="flex h-32 items-center justify-center">
              <Icon name="hourglass_empty" className="animate-spin text-[28px] text-on-surface-variant" />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {DAY_LABELS.map(({ key, label }) => {
                const entry = hours[key];
                return (
                  <div key={key}
                    className={`flex flex-wrap items-center gap-3 rounded-button border p-2.5 transition ${entry.closed ? "border-outline-variant bg-surface-container-low opacity-60" : "border-outline-variant"}`}>
                    <span className="w-20 font-label-lg text-label-lg text-on-surface">{label}</span>
                    <input type="time" value={entry.open} disabled={entry.closed}
                      onChange={(e) => update(key, "open", e.target.value)}
                      className="rounded-button border border-outline-variant bg-surface-container-lowest px-2 py-1.5 font-body-md text-body-md disabled:opacity-40" />
                    <span className="text-on-surface-variant">إلى</span>
                    <input type="time" value={entry.close} disabled={entry.closed}
                      onChange={(e) => update(key, "close", e.target.value)}
                      className="rounded-button border border-outline-variant bg-surface-container-lowest px-2 py-1.5 font-body-md text-body-md disabled:opacity-40" />
                    <label className="mr-auto flex cursor-pointer items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
                      <input type="checkbox" checked={entry.closed}
                        onChange={(e) => update(key, "closed", e.target.checked)}
                        className="rounded" />
                      مغلق
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving || loading}>{saving ? "جاري الحفظ..." : "حفظ المواعيد"}</Button>
          {err && <p className="font-label-md text-label-md text-error">{err}</p>}
          {ok && <p className="font-label-md text-label-md text-success">تم حفظ المواعيد بنجاح ✓</p>}
        </div>
      </div>
    </DashboardShell>
  );
}
