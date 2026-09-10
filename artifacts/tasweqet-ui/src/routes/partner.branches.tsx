import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Button, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/partner/branches")({
  head: () => ({ meta: [{ title: "الفروع — طلبات بيتك" }] }),
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
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ─── Add branch modal ─────────────────────────────────────────────────────────

function AddBranchModal({ onSave, onClose }: {
  onSave: (data: { name: string; address: string; phone: string }) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!name.trim()) { setErr("اسم الفرع مطلوب"); return; }
    if (!address.trim()) { setErr("عنوان الفرع مطلوب"); return; }
    setSaving(true); setErr("");
    try { await onSave({ name: name.trim(), address: address.trim(), phone: phone.trim() }); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-md" onClick={onClose}>
      <div className="w-full max-w-sm rounded-card bg-surface p-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-md font-headline-md text-headline-md text-on-surface">إضافة فرع جديد</h3>
        <div className="flex flex-col gap-3">
          {[
            { label: "اسم الفرع *", value: name, set: setName, placeholder: "مثال: فرع المعادي" },
            { label: "العنوان *", value: address, set: setAddress, placeholder: "الحي، المحافظة" },
            { label: "رقم الهاتف", value: phone, set: setPhone, placeholder: "01XXXXXXXXX" },
          ].map(({ label, value, set, placeholder }) => (
            <div key={label}>
              <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">{label}</label>
              <input value={value} onChange={(e) => set(e.target.value)} placeholder={placeholder}
                className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
            </div>
          ))}
          {err && <p className="font-label-md text-label-md text-error">{err}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={saving}>{saving ? "جاري الحفظ..." : "إضافة"}</Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PartnerBranches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/partner/branches", { headers: authHeaders() });
      if (!r.ok) throw new Error("فشل تحميل الفروع");
      setBranches(await r.json() as Branch[]);
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleAddBranch(data: { name: string; address: string; phone: string }) {
    const r = await fetch("/api/partner/branches", {
      method: "POST", headers: authHeaders(), body: JSON.stringify(data),
    });
    if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ"); }
    await load();
  }

  async function handleToggleOpen(b: Branch) {
    setToggling(b.id);
    setError("");
    try {
      const r = await fetch(`/api/partner/branches/${b.id}/open`, { method: "PATCH", headers: authHeaders() });
      if (!r.ok) { const data = await r.json().catch(() => null) as { error?: string } | null; throw new Error(data?.error ?? "تعذر تحديث حالة الفرع"); }
      setBranches((prev) => prev.map((x) => x.id === b.id ? { ...x, isOpen: !x.isOpen } : x));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحديث حالة الفرع"); }
    finally { setToggling(null); }
  }

  async function handleDelete(b: Branch) {
    if (!confirm(`حذف فرع "${b.name}"؟`)) return;
    setError("");
    try {
      const r = await fetch(`/api/partner/branches/${b.id}`, { method: "DELETE", headers: authHeaders() });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "تعذر حذف الفرع"); }
      setBranches((prev) => prev.filter((x) => x.id !== b.id));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر حذف الفرع"); }
  }

  if (loading) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الفروع">
      <div className="flex h-40 items-center justify-center"><Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" /></div>
    </DashboardShell>
  );

  if (error) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الفروع">
      <div className="flex flex-col items-center gap-md py-xl text-center">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
        <Button onClick={load}>إعادة المحاولة</Button>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="صاحب مطعم"
      nav={partnerNav}
      title="الفروع"
      actions={<Button icon="add" onClick={() => setShowAdd(true)}>إضافة فرع</Button>}
    >
      {showAdd && <AddBranchModal onSave={handleAddBranch} onClose={() => setShowAdd(false)} />}

      {branches.length === 0 ? (
        <div className="flex flex-col items-center gap-md rounded-card border border-dashed border-outline-variant py-xl text-center">
          <Icon name="storefront" className="text-[48px] text-outline" />
          <p className="font-body-md text-body-md text-on-surface-variant">لا توجد فروع بعد — أضف أول فرع لمطعمك</p>
          <Button icon="add" onClick={() => setShowAdd(true)}>إضافة فرع</Button>
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
                  title={b.isOpen ? "إغلاق الفرع" : "فتح الفرع"}
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
                <Badge tone={b.isOpen ? "success" : "danger"}>{b.isOpen ? "مفتوح" : "مغلق"}</Badge>
              </div>

              <div className="mt-auto flex items-center gap-2 border-t border-outline-variant pt-2">
                <Link to="/partner/branches/$id" params={{ id: String(b.id) }}
                  className="flex flex-1 items-center justify-center gap-1 rounded-button bg-surface-container px-2 py-1.5 font-label-md text-label-md text-on-surface transition hover:bg-surface-container-high">
                  <Icon name="open_in_new" className="text-[14px]" /> التفاصيل
                </Link>
                <button type="button" onClick={() => handleDelete(b)}
                  className="flex items-center gap-1 rounded-button px-2 py-1.5 font-label-md text-label-md text-on-surface-variant transition hover:bg-error-container hover:text-error">
                  <Icon name="delete" className="text-[14px]" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
