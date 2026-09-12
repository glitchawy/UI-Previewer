import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Button, Icon } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";
import { useTranslation, translate, getLocale } from "@/lib/i18n";

export const Route = createFileRoute("/partner/branches")({
  head: () => ({ meta: [{ title: translate("الفروع — طلبات بيتك", "Branches — Talabat Betak") }] }),
  component: PartnerBranches,
});

type Branch = {
  id: number; restaurantId: number; name: string; address: string;
  phone: string | null; lat: number | null; lng: number | null;
  isOpen: boolean; notes: string | null; activeStaff: number;
  createdAt: string; updatedAt: string;
};

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json", "Accept-Language": getLocale() } : { "Content-Type": "application/json", "Accept-Language": getLocale() };
}

// ─── Add branch modal ─────────────────────────────────────────────────────────

function AddBranchModal({ onSave, onClose }: {
  onSave: (data: { name: string; address: string; phone: string }) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!name.trim()) { setErr(t("اسم الفرع مطلوب", "Branch name is required")); return; }
    if (!address.trim()) { setErr(t("عنوان الفرع مطلوب", "Branch address is required")); return; }
    setSaving(true); setErr("");
    try { await onSave({ name: name.trim(), address: address.trim(), phone: phone.trim() }); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : t("خطأ", "Something went wrong")); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-md" onClick={onClose}>
      <div className="w-full max-w-sm rounded-card bg-surface p-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-md font-headline-md text-headline-md text-on-surface">{t("إضافة فرع جديد", "Add a new branch")}</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: t("اسم الفرع *", "Branch name *"), value: name, set: setName, placeholder: t("مثال: فرع المعادي", "Example: Maadi branch") },
            { label: t("العنوان *", "Address *"), value: address, set: setAddress, placeholder: t("الحي، المحافظة", "District, governorate") },
            { label: t("رقم الهاتف", "Phone number"), value: phone, set: setPhone, placeholder: "01XXXXXXXXX" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">{label}</label>
              <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
            </div>
          ))}
          {err && <p className="font-label-md text-label-md text-error">{err}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={saving}>{saving ? t("جاري الحفظ...", "Saving…") : t("إضافة", "Add")}</Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>{t("إلغاء", "Cancel")}</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PartnerBranches() {
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const loadedRef = useRef(false);

  async function load() {
    const initialLoad = !loadedRef.current;
    if (initialLoad) setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/partner/branches", { headers: authHeaders() });
      if (!r.ok) throw new Error(t("فشل تحميل الفروع", "Failed to load branches"));
      setBranches(await r.json() as Branch[]);
      loadedRef.current = true;
    } catch (e) { setError(e instanceof Error ? e.message : t("خطأ", "Something went wrong")); }
    finally { if (initialLoad) setLoading(false); }
  }

  useEffect(() => { void load(); }, [locale]);

  async function handleAddBranch(data: { name: string; address: string; phone: string }) {
    const r = await fetch("/api/partner/branches", {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? t("خطأ", "Something went wrong")); }
    await load();
  }

  async function handleToggleOpen(b: Branch) {
    setToggling(b.id);
    setError("");
    try {
      const r = await fetch(`/api/partner/branches/${b.id}/open`, { method: "PATCH", headers: authHeaders() });
      if (!r.ok) { const data = await r.json().catch(() => null) as { error?: string } | null; throw new Error(data?.error ?? t("تعذر تحديث حالة الفرع", "Could not update branch status")); }
      setBranches((prev) => prev.map((x) => x.id === b.id ? { ...x, isOpen: !x.isOpen } : x));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("تعذر تحديث حالة الفرع", "Could not update branch status")); }
    finally { setToggling(null); }
  }

  async function handleDelete(b: Branch) {
    if (!confirm(t(`حذف فرع "${b.name}"؟`, `Delete branch "${b.name}"?`))) return;
    setError("");
    try {
      const r = await fetch(`/api/partner/branches/${b.id}`, { method: "DELETE", headers: authHeaders() });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? t("تعذر حذف الفرع", "Could not delete branch")); }
      setBranches((prev) => prev.filter((x) => x.id !== b.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : t("تعذر حذف الفرع", "Could not delete branch")); }
  }

  if (loading) return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("الفروع", "Branches")}>
      <div className="flex h-40 items-center justify-center"><Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" /></div>
    </DashboardShell>
  );

  if (error && !loadedRef.current) return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("الفروع", "Branches")}>
      <div className="flex flex-col items-center gap-md py-xl text-center">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
        <Button onClick={load}>{t("إعادة المحاولة", "Try again")}</Button>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell
      brand={t("طلبات بيتك", "Talabat Betak")}
      role={t("صاحب مطعم", "Restaurant owner")}
      nav={partnerNav}
      title={t("الفروع", "Branches")}
      actions={<Button icon="add" onClick={() => setShowAdd(true)}>{t("إضافة فرع", "Add branch")}</Button>}
    >
      {showAdd && <AddBranchModal onSave={handleAddBranch} onClose={() => setShowAdd(false)} />}
      {error ? <p role="alert" className="mb-md font-label-md text-label-md text-error">{error}</p> : null}

      {branches.length === 0 ? (
        <div className="flex flex-col items-center gap-md rounded-card border border-dashed border-outline-variant py-xl text-center">
          <Icon name="storefront" className="text-[48px] text-outline" />
          <p className="font-body-md text-body-md text-on-surface-variant">{t("لا توجد فروع بعد — أضف أول فرع لمطعمك", "No branches yet — add your restaurant's first branch")}</p>
          <Button icon="add" onClick={() => setShowAdd(true)}>{t("إضافة فرع", "Add branch")}</Button>
        </div>
      ) : (
        <div className="tb-stagger grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
          {branches.map((b) => (
            <Card key={b.id} className="flex flex-col gap-sm p-md transition hover:shadow-md">
              <div className="flex items-center justify-between gap-2">
                <Link to="/partner/branches/$id" params={{ id: String(b.id) }}
                  className="font-headline-md text-headline-md text-on-surface hover:underline">
                  {b.name}
                </Link>
                {/* Open/closed toggle */}
                <button
                  type="button"
                  disabled={toggling === b.id}
                  onClick={() => handleToggleOpen(b)}
                  title={b.isOpen ? t("إغلاق الفرع", "Close branch") : t("فتح الفرع", "Open branch")}
                  aria-label={b.isOpen ? t("إغلاق الفرع", "Close branch") : t("فتح الفرع", "Open branch")}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${b.isOpen ? "bg-success" : "bg-surface-container-high"}`}
                >
                  <span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow transition-all ${b.isOpen ? "left-5" : "left-0.5"}`} />
                </button>
              </div>

              <p className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
                <Icon name="location_on" className="text-[16px]" />{b.address}
              </p>
              {b.phone && (
                <p className="flex items-center gap-1.5 font-body-md text-body-md text-on-surface-variant">
                  <Icon name="call" className="text-[16px]" />{b.phone}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={b.isOpen ? "success" : "danger"}>{b.isOpen ? t("مفتوح", "Open") : t("مغلق", "Closed")}</Badge>
              </div>

              <div className="mt-auto flex items-center gap-2 border-t border-outline-variant pt-2">
                <Link to="/partner/branches/$id" params={{ id: String(b.id) }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-button bg-surface-container px-2 py-1.5 font-label-md text-label-md text-on-surface transition hover:bg-surface-container-high">
                   <Icon name="open_in_new" className="text-[14px]" /> {t("التفاصيل", "Details")}
                </Link>
                <button type="button" onClick={() => handleDelete(b)}
                  className="flex items-center gap-1 rounded-button px-2 py-1.5 font-label-md text-label-md text-on-surface-variant transition hover:bg-error-container hover:text-error">
                   <Icon name="delete" className="text-[14px]" /> <span className="sr-only">{t("حذف الفرع", "Delete branch")}</span>
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
