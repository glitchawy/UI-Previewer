import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Table, Td, Badge, Button, Icon, Card, SectionTitle } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/partner/staff")({
  head: () => ({ meta: [{ title: "الموظفين — طلبات بيتك" }] }),
  component: PartnerStaff,
});

type StaffRow = {
  staffId: number; userId: number; role: string;
  joinedAt: string; leftAt: string | null;
  branchId: number; branchName: string;
  phone: string | null; name: string | null;
};

type Branch = { id: number; name: string };

const ROLE_LABELS: Record<string, string> = { MANAGER: "مدير", STAFF: "موظف", CASHIER: "كاشير" };
const ROLE_TONES: Record<string, "neutral" | "info" | "warn"> = { MANAGER: "info", STAFF: "neutral", CASHIER: "warn" };

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

// ─── Transfer modal ───────────────────────────────────────────────────────────

function TransferModal({
  staff, branches, onSave, onClose,
}: {
  staff: StaffRow;
  branches: Branch[];
  onSave: () => void;
  onClose: () => void;
}) {
  const [toBranchId, setToBranchId] = useState<number | "">("");
  const [role, setRole] = useState(staff.role);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const otherBranches = branches.filter((b) => b.id !== staff.branchId);

  async function submit() {
    if (!toBranchId) { setErr("برجاء تحديد الفرع"); return; }
    setSaving(true); setErr("");
    try {
      const r = await fetch(`/api/partner/staff/${staff.staffId}/transfer`, {
        method: "PATCH", headers: authHeaders(),
        body: JSON.stringify({ toBranchId, role }),
      });
      if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ"); }
      onSave(); onClose();
    } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-md" onClick={onClose}>
      <div className="w-full max-w-sm rounded-card bg-surface p-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-1 font-headline-md text-headline-md text-on-surface">نقل موظف لفرع آخر</h3>
        <p className="mb-md font-body-md text-body-md text-on-surface-variant">
          {staff.name ?? staff.phone} — الفرع الحالي: <strong>{staff.branchName}</strong>
        </p>

        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">الفرع الجديد *</label>
            {otherBranches.length === 0 ? (
              <p className="rounded-button border border-outline-variant px-3 py-2 font-body-md text-body-md text-on-surface-variant">
                لا توجد فروع أخرى — أضف فرعاً أولاً
              </p>
            ) : (
              <select value={toBranchId} onChange={(e) => setToBranchId(Number(e.target.value))}
                className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary">
                <option value="">— اختر فرعاً —</option>
                {otherBranches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">الدور في الفرع الجديد</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary">
              <option value="MANAGER">مدير</option>
              <option value="STAFF">موظف</option>
              <option value="CASHIER">كاشير</option>
            </select>
          </div>

          {err && <p className="font-label-md text-label-md text-error">{err}</p>}

          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={saving || otherBranches.length === 0}>
              {saving ? "جاري النقل..." : "تأكيد النقل"}
            </Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Role change inline ───────────────────────────────────────────────────────

async function changeRole(staffId: number, newRole: string): Promise<boolean> {
  const r = await fetch(`/api/partner/staff/${staffId}/role`, {
    method: "PATCH", headers: authHeaders(), body: JSON.stringify({ role: newRole }),
  });
  return r.ok;
}

// ─── History drawer ───────────────────────────────────────────────────────────

function HistoryDrawer({ userId, onClose }: { userId: number; onClose: () => void }) {
  const [history, setHistory] = useState<StaffRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/partner/staff/${userId}/history`, { headers: authHeaders() })
      .then((r) => r.ok ? r.json() as Promise<StaffRow[]> : Promise.resolve([]))
      .then((d) => { setHistory(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userId]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-scrim/50 sm:items-center sm:p-md" onClick={onClose}>
      <div className="w-full max-w-lg rounded-t-card bg-surface p-lg shadow-xl sm:rounded-card" onClick={(e) => e.stopPropagation()}>
        <div className="mb-md flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-on-surface">سجل التنقلات</h3>
          <button type="button" onClick={onClose}><Icon name="close" className="text-[20px] text-on-surface-variant" /></button>
        </div>
        {loading ? (
          <div className="flex h-24 items-center justify-center"><Icon name="hourglass_empty" className="animate-spin text-[28px] text-on-surface-variant" /></div>
        ) : history.length === 0 ? (
          <p className="font-body-md text-body-md text-on-surface-variant">لا يوجد سجل</p>
        ) : (
          <div className="flex flex-col gap-2">
            {history.map((h) => (
              <div key={h.staffId} className="flex items-center justify-between rounded-button border border-outline-variant p-sm">
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">{h.branchName}</p>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {new Date(h.joinedAt).toLocaleDateString("ar-EG")}
                    {h.leftAt ? ` ← ${new Date(h.leftAt).toLocaleDateString("ar-EG")}` : " ← الآن"}
                  </p>
                </div>
                <Badge tone={ROLE_TONES[h.role] ?? "neutral"}>{ROLE_LABELS[h.role] ?? h.role}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PartnerStaff() {
  const [staff, setStaff] = useState<StaffRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [transferTarget, setTransferTarget] = useState<StaffRow | null>(null);
  const [historyUserId, setHistoryUserId] = useState<number | null>(null);
  const [roleChanging, setRoleChanging] = useState<number | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [staffRes, branchRes] = await Promise.all([
        fetch("/api/partner/staff", { headers: authHeaders() }),
        fetch("/api/partner/branches", { headers: authHeaders() }),
      ]);
      if (!staffRes.ok || !branchRes.ok) throw new Error("فشل تحميل البيانات");
      setStaff(await staffRes.json() as StaffRow[]);
      const br = await branchRes.json() as { id: number; name: string }[];
      setBranches(br.map((b) => ({ id: b.id, name: b.name })));
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleRoleChange(s: StaffRow, newRole: string) {
    if (newRole === s.role) return;
    setRoleChanging(s.staffId);
    const ok = await changeRole(s.staffId, newRole);
    if (ok) setStaff((prev) => prev.map((x) => x.staffId === s.staffId ? { ...x, role: newRole } : x));
    setRoleChanging(null);
  }

  if (loading) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الموظفين">
      <div className="flex h-40 items-center justify-center"><Icon name="hourglass_empty" className="animate-spin text-[32px] text-on-surface-variant" /></div>
    </DashboardShell>
  );

  if (error) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الموظفين">
      <div className="flex flex-col items-center gap-md py-xl">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
        <Button onClick={load}>إعادة المحاولة</Button>
      </div>
    </DashboardShell>
  );

  // Group by branch for summary cards
  const byBranch = branches.map((b) => ({
    branch: b,
    staff: staff.filter((s) => s.branchId === b.id),
  }));

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الموظفين">
      {transferTarget && (
        <TransferModal
          staff={transferTarget}
          branches={branches}
          onSave={load}
          onClose={() => setTransferTarget(null)}
        />
      )}
      {historyUserId !== null && (
        <HistoryDrawer userId={historyUserId} onClose={() => setHistoryUserId(null)} />
      )}

      <div className="tb-stagger flex flex-col gap-lg">
        {/* Rule reminder */}
        <Card className="flex items-center gap-2 bg-primary-container/30 p-md">
          <Icon name="info" className="shrink-0 text-[20px] text-on-primary-container" />
          <p className="font-label-md text-label-md text-on-surface">
            كل موظف ينتمي لفرع واحد فقط — النقل يغلق العلاقة القديمة ويحتفظ بالسجل التاريخي
          </p>
        </Card>

        {/* Summary per branch */}
        <div className="grid grid-cols-1 gap-sm sm:grid-cols-3">
          {byBranch.map(({ branch, staff: bs }) => (
            <Card key={branch.id} className="flex items-center gap-3 p-md">
              <Icon name="storefront" className="text-[24px] text-on-surface-variant" />
              <div>
                <p className="font-label-lg text-label-lg text-on-surface">{branch.name}</p>
                <p className="font-body-md text-body-md text-on-surface-variant">{bs.length} موظف نشط</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Full staff table */}
        {staff.length === 0 ? (
          <div className="flex flex-col items-center gap-md rounded-card border border-dashed border-outline-variant py-xl text-center">
            <Icon name="group_off" className="text-[48px] text-outline" />
            <p className="font-body-md text-body-md text-on-surface-variant">لا يوجد موظفون مضافون بعد</p>
            <p className="font-body-sm text-body-sm text-on-surface-variant">أضف موظفين من صفحة تفاصيل الفرع</p>
          </div>
        ) : (
          <Card className="p-md">
            <SectionTitle title="كل الموظفين النشطين" icon="group" />
            <Table head={["الاسم / الهاتف", "الفرع", "الدور", "انضم في", ""]}>
              {staff.map((s) => (
                <tr key={s.staffId} className="transition hover:bg-surface-container-low">
                  <Td>
                    <div className="flex flex-col">
                      <span className="font-label-lg text-label-lg text-on-surface">{s.name ?? "—"}</span>
                      <span className="font-body-sm text-body-sm text-on-surface-variant">{s.phone ?? "—"}</span>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone="neutral">{s.branchName}</Badge>
                  </Td>
                  <Td>
                    {/* Inline role change */}
                    <select
                      value={s.role}
                      disabled={roleChanging === s.staffId}
                      onChange={(e) => handleRoleChange(s, e.target.value)}
                      className="rounded-button border border-outline-variant bg-surface-container-low px-2 py-1 font-label-md text-label-md text-on-surface outline-none focus:border-primary disabled:opacity-50"
                    >
                      <option value="MANAGER">مدير</option>
                      <option value="STAFF">موظف</option>
                      <option value="CASHIER">كاشير</option>
                    </select>
                  </Td>
                  <Td>{new Date(s.joinedAt).toLocaleDateString("ar-EG")}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <button type="button" title="نقل لفرع آخر"
                        onClick={() => setTransferTarget(s)}
                        className="rounded-button px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant transition hover:bg-secondary-container hover:text-on-secondary-container">
                        <Icon name="swap_horiz" className="text-[16px]" />
                      </button>
                      <button type="button" title="سجل التنقلات"
                        onClick={() => setHistoryUserId(s.userId)}
                        className="rounded-button px-2 py-1.5 font-label-sm text-label-sm text-on-surface-variant transition hover:bg-surface-container-high">
                        <Icon name="history" className="text-[16px]" />
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </Table>
          </Card>
        )}
      </div>
    </DashboardShell>
  );
}
