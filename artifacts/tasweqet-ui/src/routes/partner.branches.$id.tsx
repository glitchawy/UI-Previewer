import { useState, useEffect, useCallback } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, MapCanvas, Stat, Badge, Icon, Table, Td, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/partner/branches/$id")({
  head: () => ({ meta: [{ title: "تفاصيل الفرع — طلبات بيتك" }] }),
  component: PartnerBranchDetail,
});

type StaffMember = {
  id: number; userId: number; role: string; joinedAt: string;
  phone: string | null; name: string | null;
};

type BranchDetail = {
  id: number; restaurantId: number; name: string; address: string;
  phone: string | null; lat: number | null; lng: number | null;
  isOpen: boolean; notes: string | null;
  createdAt: string; updatedAt: string;
  staff: StaffMember[];
};

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

const roleLabels: Record<string, string> = { MANAGER: "مدير", STAFF: "موظف", CASHIER: "كاشير" };

// ─── Add staff modal ──────────────────────────────────────────────────────────

function AddStaffModal({ branchId, onSave, onClose }: {
  branchId: number;
  onSave: () => void;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("STAFF");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!phone.trim()) { setErr("رقم الهاتف مطلوب"); return; }
    setSaving(true); setErr("");
    try {
      const r = await fetch(`/api/partner/branches/${branchId}/staff`, {
        method: "POST", headers: authHeaders(), body: JSON.stringify({ phone: phone.trim(), role }),
      });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ"); }
      onSave(); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-md" onClick={onClose}>
      <div className="w-full max-w-sm rounded-card bg-surface p-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-md font-headline-md text-headline-md text-on-surface">إضافة موظف للفرع</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">رقم الهاتف *</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX"
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">الوظيفة</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary">
              <option value="MANAGER">مدير</option>
              <option value="STAFF">موظف</option>
              <option value="CASHIER">كاشير</option>
            </select>
          </div>
          {err && <p className="font-label-md text-label-md text-error">{err}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={saving}>{saving ? "جاري الإضافة..." : "إضافة"}</Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline edit form ─────────────────────────────────────────────────────────

function EditBranchCard({ branch, onSaved }: { branch: BranchDetail; onSaved: (updated: Partial<BranchDetail>) => void }) {
  const [name, setName] = useState(branch.name);
  const [address, setAddress] = useState(branch.address);
  const [phone, setPhone] = useState(branch.phone ?? "");
  const [notes, setNotes] = useState(branch.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  async function save() {
    if (!name.trim()) { setErr("اسم الفرع مطلوب"); return; }
    if (!address.trim()) { setErr("عنوان الفرع مطلوب"); return; }
    setSaving(true); setErr(""); setSuccess(false);
    try {
      const r = await fetch(`/api/partner/branches/${branch.id}`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ name: name.trim(), address: address.trim(), phone: phone.trim(), notes: notes.trim() }),
      });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ"); }
      onSaved({ name: name.trim(), address: address.trim(), phone: phone.trim() || null, notes: notes.trim() || null });
      setSuccess(true);
    } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  return (
    <Card className="p-md">
      <SectionTitle title="بيانات الفرع" icon="edit" />
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        {[
          { label: "اسم الفرع", value: name, set: setName },
          { label: "الهاتف", value: phone, set: setPhone },
          { label: "العنوان", value: address, set: setAddress },
          { label: "ملاحظات", value: notes, set: setNotes },
        ].map(({ label, value, set }) => (
          <div key={label}>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">{label}</label>
            <input value={value} onChange={(e) => set(e.target.value)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
          </div>
        ))}
      </div>
      <div className="mt-md flex items-center gap-2">
        <Badge tone="info" className="flex-1"><Icon name="info" className="text-[14px]" />مواعيد العمل على مستوى المطعم</Badge>
        <Button onClick={save} disabled={saving}>{saving ? "جاري الحفظ..." : "حفظ التعديلات"}</Button>
      </div>
      {err && <p className="mt-2 font-label-md text-label-md text-error">{err}</p>}
      {success && <p className="mt-2 font-label-md text-label-md text-success">تم الحفظ بنجاح ✓</p>}
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PartnerBranchDetail() {
  const { id } = Route.useParams();
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/partner/branches/${id}`, { headers: authHeaders() });
      if (!r.ok) throw new Error("فشل تحميل بيانات الفرع");
      setBranch(await r.json() as BranchDetail);
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleToggle() {
    if (!branch) return;
    setToggling(true);
    try {
      const r = await fetch(`/api/partner/branches/${branch.id}/open`, { method: "PATCH", headers: authHeaders() });
      if (!r.ok) throw new Error();
      const d = await r.json() as { isOpen: boolean };
      setBranch((b) => b ? { ...b, isOpen: d.isOpen } : b);
    } catch { /* ignore */ }
    finally { setToggling(false); }
  }

  async function handleRemoveStaff(staffId: number) {
    if (!branch || !confirm("إزالة هذا الموظف من الفرع؟")) return;
    try {
      await fetch(`/api/partner/branches/${branch.id}/staff/${staffId}`, { method: "DELETE", headers: authHeaders() });
      setBranch((b) => b ? { ...b, staff: b.staff.filter((s) => s.id !== staffId) } : b);
    } catch { /* ignore */ }
  }

  if (loading) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الفرع">
      <div className="flex h-40 items-center justify-center"><Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" /></div>
    </DashboardShell>
  );

  if (error || !branch) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الفرع">
      <div className="flex flex-col items-center gap-md py-xl text-center">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error || "الفرع غير موجود"}</p>
        <Button onClick={load}>إعادة المحاولة</Button>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title={branch.name}
      actions={
        <div className="flex items-center gap-2">
          <span className="font-label-md text-label-md text-on-surface-variant">{branch.isOpen ? "مفتوح" : "مغلق"}</span>
          <button type="button" disabled={toggling} onClick={handleToggle}
            className={`relative h-6 w-11 rounded-full transition disabled:opacity-50 ${branch.isOpen ? "bg-success" : "bg-surface-container-high"}`}>
            <span className={`absolute top-0.5 size-5 rounded-full bg-surface shadow transition-all ${branch.isOpen ? "left-5" : "left-0.5"}`} />
          </button>
        </div>
      }
    >
      {showAddStaff && <AddStaffModal branchId={branch.id} onSave={load} onClose={() => setShowAddStaff(false)} />}

      <div className="tb-stagger flex flex-col gap-lg">
        <Link to="/partner/branches" className="flex w-fit items-center gap-1 font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface">
          <Icon name="arrow_forward" className="text-[18px]" />رجوع للفروع
        </Link>

        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="الموظفين النشطين" value={String(branch.staff.length)} icon="group" tone="neutral" />
          <Stat label="الهاتف" value={branch.phone ?? "—"} icon="call" tone="info" />
          <Stat label="تاريخ الإنشاء" value={new Date(branch.createdAt).toLocaleDateString("ar-EG")} icon="calendar_today" tone="warn" />
          <Stat label="الحالة" value={branch.isOpen ? "مفتوح" : "مغلق"} icon="storefront" tone={branch.isOpen ? "success" : "danger"} />
        </div>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <EditBranchCard branch={branch} onSaved={(u) => setBranch((b) => b ? { ...b, ...u } : b)} />
          <MapCanvas>
            {branch.lat && branch.lng ? (
              <span className="absolute right-1/2 top-1/2 flex size-9 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-primary-container text-on-primary-container shadow-lg">
                <Icon name="storefront" className="text-[18px]" />
              </span>
            ) : (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
                <Icon name="location_off" className="text-[32px] text-outline" />
                <p className="font-label-md text-label-md text-outline">لم يتم تحديد الموقع بعد</p>
              </div>
            )}
          </MapCanvas>
        </div>

        {/* Staff management */}
        <Card className="p-md">
          <div className="mb-md flex items-center justify-between">
            <SectionTitle title="فريق الفرع" icon="group" />
            <Button icon="person_add" variant="outline" onClick={() => setShowAddStaff(true)}>إضافة موظف</Button>
          </div>
          {branch.staff.length === 0 ? (
            <div className="flex flex-col items-center gap-md rounded-button border border-dashed border-outline-variant py-lg text-center">
              <Icon name="group_off" className="text-[36px] text-outline" />
              <p className="font-body-md text-body-md text-on-surface-variant">لا يوجد موظفون مضافون لهذا الفرع</p>
              <Button icon="person_add" variant="outline" onClick={() => setShowAddStaff(true)}>إضافة موظف</Button>
            </div>
          ) : (
            <Table head={["الاسم / الهاتف", "الوظيفة", "تاريخ الانضمام", ""]}>
              {branch.staff.map((s) => (
                <tr key={s.id}>
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg text-on-surface">{s.name ?? "—"}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{s.phone ?? "—"}</span>
                    </div>
                  </Td>
                  <Td><Badge tone="neutral">{roleLabels[s.role] ?? s.role}</Badge></Td>
                  <Td>{new Date(s.joinedAt).toLocaleDateString("ar-EG")}</Td>
                  <Td>
                    <button type="button" onClick={() => handleRemoveStaff(s.id)}
                      className="rounded-button px-2 py-1 font-label-sm text-label-sm text-on-surface-variant transition hover:bg-error-container hover:text-error">
                      إزالة
                    </button>
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
