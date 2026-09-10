import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";

type Group = { id: number; key: string; name: string; permissions: string[]; members: number };
type Account = { userId: number; name: string | null; phone: string; email: string | null; isActive: boolean; isSuperAdmin: boolean; groupName: string | null };
const PERMS = ["overview.read","orders.read","orders.manage","customers.read","applications.read","applications.manage","payments.read","refunds.read","refunds.manage","settlements.read","settlements.manage","pricing.read","pricing.manage","commissions.read","commissions.manage","reports.read","reports.export","notifications.read","notifications.manage","audit.read","settings.read","settings.manage","access.read","access.manage","reviews.read","reviews.moderate"];
export const Route = createFileRoute("/admin/roles")({ component: Roles });

function Roles() {
  const [groups, setGroups] = useState<Page<Group>>();
  const [accounts, setAccounts] = useState<Page<Account>>();
  const [error, setError] = useState("");
  const [group, setGroup] = useState({ key: "", name: "", reason: "", permissions: ["overview.read"] });
  const [account, setAccount] = useState({ name: "", phone: "", email: "", permissionGroupId: "", reason: "" });
  const load = useCallback(() => {
    void Promise.all([adminRequest<Page<Group>>("/admin/access/groups?page=1&pageSize=50"), adminRequest<Page<Account>>("/admin/access/accounts?page=1&pageSize=50")])
      .then(([g, a]) => { setGroups(g); setAccounts(a); }).catch(e => setError(e.message));
  }, []);
  useEffect(load, [load]);
  async function submit(path: string, body: object) {
    try { await adminRequest(path, { method: "POST", body: JSON.stringify(body) }); load(); }
    catch (e) { setError(e instanceof Error ? e.message : "فشل الحفظ"); }
  }
  return <DashboardShell brand="طلبات بيتك" role="الإدارة" nav={adminNav} title="الأدوار والصلاحيات">
    {error && <Card className="p-md text-error">{error}<Button onClick={load}>إعادة</Button></Card>}
    <Card className="grid gap-2 p-md md:grid-cols-3">
      <Field label="مفتاح المجموعة" value={group.key} onChange={e => setGroup({ ...group, key: e.target.value })} />
      <Field label="اسم المجموعة" value={group.name} onChange={e => setGroup({ ...group, name: e.target.value })} />
      <Field label="سبب الإنشاء" value={group.reason} onChange={e => setGroup({ ...group, reason: e.target.value })} />
      <div className="col-span-full grid gap-1 md:grid-cols-4">{PERMS.map(p => <label key={p}><input type="checkbox" checked={group.permissions.includes(p)} onChange={() => setGroup({ ...group, permissions: group.permissions.includes(p) ? group.permissions.filter(x => x !== p) : [...group.permissions, p] })} />{p}</label>)}</div>
      <Button onClick={() => submit("/admin/access/groups", group)}>إنشاء مجموعة</Button>
    </Card>
    <Card className="grid gap-2 p-md md:grid-cols-3">
      <Field label="اسم الأدمن" value={account.name} onChange={e => setAccount({ ...account, name: e.target.value })} />
      <Field label="الهاتف" value={account.phone} onChange={e => setAccount({ ...account, phone: e.target.value })} />
      <Field label="البريد" value={account.email} onChange={e => setAccount({ ...account, email: e.target.value })} />
      <select className="rounded-button border p-2" value={account.permissionGroupId} onChange={e => setAccount({ ...account, permissionGroupId: e.target.value })}><option value="">اختر المجموعة</option>{groups?.items.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
      <Field label="سبب الإنشاء" value={account.reason} onChange={e => setAccount({ ...account, reason: e.target.value })} />
      <Button onClick={() => submit("/admin/access/accounts", { ...account, permissionGroupId: Number(account.permissionGroupId) })}>إنشاء حساب</Button>
    </Card>
    <SectionTitle title="المجموعات" icon="groups" />
    {!groups ? <Card className="p-md">جاري التحميل…</Card> : <Table head={["الاسم","المفتاح","الأعضاء","الصلاحيات"]}>{groups.items.map(x => <tr key={x.id}><Td>{x.name}</Td><Td>{x.key}</Td><Td>{x.members}</Td><Td>{x.permissions.join("، ")}</Td></tr>)}</Table>}
    <SectionTitle title="حسابات الإدارة" icon="badge" />
    {accounts && <Table head={["الاسم","الهاتف","البريد","المجموعة","الحالة"]}>{accounts.items.map(x => <tr key={x.userId}><Td>{x.name}</Td><Td>{x.phone}</Td><Td>{x.email || "—"}</Td><Td>{x.isSuperAdmin ? "سوبر أدمن" : x.groupName || "بدون مجموعة"}</Td><Td>{x.isActive ? "نشط" : "موقوف"}</Td></tr>)}</Table>}
  </DashboardShell>;
}