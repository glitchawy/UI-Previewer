import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";
import { adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Group = { id: number; key: string; name: string; permissions: string[]; members: number };
type Account = { userId: number; name: string | null; phone: string; email: string | null; isActive: boolean; isSuperAdmin: boolean; groupName: string | null };
const PERMS = ["overview.read", "orders.read", "orders.manage", "customers.read", "applications.read", "applications.manage", "payments.read", "refunds.read", "refunds.manage", "settlements.read", "settlements.manage", "pricing.read", "pricing.manage", "commissions.read", "commissions.manage", "reports.read", "reports.export", "notifications.read", "notifications.manage", "audit.read", "settings.read", "settings.manage", "access.read", "access.manage", "reviews.read", "reviews.moderate"];

export const Route = createFileRoute("/admin/roles")({ component: Roles });

function Roles() {
  const { t, locale } = useTranslation();
  const [groups, setGroups] = useState<Page<Group>>();
  const [accounts, setAccounts] = useState<Page<Account>>();
  const [error, setError] = useState("");
  const [group, setGroup] = useState({ key: "", name: "", reason: "", permissions: ["overview.read"] });
  const [account, setAccount] = useState({ name: "", phone: "", email: "", permissionGroupId: "", reason: "" });
  const permissionLabel = (permission: string) => ({
    "overview.read": t("قراءة النظرة العامة", "Read overview"), "orders.read": t("قراءة الطلبات", "Read orders"), "orders.manage": t("إدارة الطلبات", "Manage orders"),
    "customers.read": t("قراءة العملاء", "Read customers"), "applications.read": t("قراءة طلبات التوثيق", "Read applications"), "applications.manage": t("إدارة طلبات التوثيق", "Manage applications"),
    "payments.read": t("قراءة المدفوعات", "Read payments"), "refunds.read": t("قراءة الاستردادات", "Read refunds"), "refunds.manage": t("إدارة الاستردادات", "Manage refunds"),
    "settlements.read": t("قراءة التسويات", "Read settlements"), "settlements.manage": t("إدارة التسويات", "Manage settlements"), "pricing.read": t("قراءة التسعير", "Read pricing"),
    "pricing.manage": t("إدارة التسعير", "Manage pricing"), "commissions.read": t("قراءة العمولات", "Read commissions"), "commissions.manage": t("إدارة العمولات", "Manage commissions"),
    "reports.read": t("قراءة التقارير", "Read reports"), "reports.export": t("تصدير التقارير", "Export reports"), "notifications.read": t("قراءة الإشعارات", "Read notifications"),
    "notifications.manage": t("إدارة الإشعارات", "Manage notifications"), "audit.read": t("قراءة سجل التدقيق", "Read audit log"), "settings.read": t("قراءة الإعدادات", "Read settings"),
    "settings.manage": t("إدارة الإعدادات", "Manage settings"), "access.read": t("قراءة الوصول", "Read access"), "access.manage": t("إدارة الوصول", "Manage access"),
    "reviews.read": t("قراءة التقييمات", "Read reviews"), "reviews.moderate": t("إدارة التقييمات", "Moderate reviews"),
  }[permission] ?? permission);
  const load = useCallback(() => {
    void Promise.all([
      adminRequest<Page<Group>>("/admin/access/groups?page=1&pageSize=50"),
      adminRequest<Page<Account>>("/admin/access/accounts?page=1&pageSize=50"),
    ]).then(([g, a]) => { setGroups(g); setAccounts(a); }).catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data")));
  }, [t]);
  useEffect(() => { void load(); }, [load]);
  async function submit(path: string, body: object) {
    try { await adminRequest(path, { method: "POST", body: JSON.stringify(body) }); void load(); }
    catch (e) { setError(e instanceof Error ? e.message : t("فشل الحفظ", "Save failed")); }
  }
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("الأدوار والصلاحيات", "Roles & permissions")}>
    {error && <Card className="p-md text-error">{error}<Button onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card>}
    <Card className="grid gap-2 p-md md:grid-cols-3">
      <Field label={t("مفتاح المجموعة", "Group key")} value={group.key} onChange={(e) => setGroup({ ...group, key: e.target.value })} />
      <Field label={t("اسم المجموعة", "Group name")} value={group.name} onChange={(e) => setGroup({ ...group, name: e.target.value })} />
      <Field label={t("سبب الإنشاء", "Creation reason")} value={group.reason} onChange={(e) => setGroup({ ...group, reason: e.target.value })} />
      <div className="col-span-full grid gap-1 md:grid-cols-4">{PERMS.map((permission) => <label key={permission}><input type="checkbox" checked={group.permissions.includes(permission)} onChange={() => setGroup({ ...group, permissions: group.permissions.includes(permission) ? group.permissions.filter((x) => x !== permission) : [...group.permissions, permission] })} />{permissionLabel(permission)}</label>)}</div>
      <Button onClick={() => void submit("/admin/access/groups", group)}>{t("إنشاء مجموعة", "Create group")}</Button>
    </Card>
    <Card className="grid gap-2 p-md md:grid-cols-3">
      <Field label={t("اسم الأدمن", "Admin name")} value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
      <Field label={t("الهاتف", "Phone")} value={account.phone} onChange={(e) => setAccount({ ...account, phone: e.target.value })} />
      <Field label={t("البريد", "Email")} value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
      <select aria-label={t("مجموعة الصلاحيات", "Permission group")} className="rounded-button border p-2" value={account.permissionGroupId} onChange={(e) => setAccount({ ...account, permissionGroupId: e.target.value })}><option value="">{t("اختر المجموعة", "Choose group")}</option>{groups?.items.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}</select>
      <Field label={t("سبب الإنشاء", "Creation reason")} value={account.reason} onChange={(e) => setAccount({ ...account, reason: e.target.value })} />
      <Button onClick={() => void submit("/admin/access/accounts", { ...account, permissionGroupId: Number(account.permissionGroupId) })}>{t("إنشاء حساب", "Create account")}</Button>
    </Card>
    <SectionTitle title={t("المجموعات", "Groups")} icon="groups" />
    {!groups ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> : <Table head={[t("الاسم", "Name"), t("المفتاح", "Key"), t("الأعضاء", "Members"), t("الصلاحيات", "Permissions")]}>{groups.items.map((x) => <tr key={x.id}><Td>{x.name}</Td><Td>{x.key}</Td><Td>{adminNumber(x.members, locale)}</Td><Td>{x.permissions.map(permissionLabel).join(locale === "ar" ? "، " : ", ")}</Td></tr>)}</Table>}
    <SectionTitle title={t("حسابات الإدارة", "Admin accounts")} icon="badge" />
    {accounts && <Table head={[t("الاسم", "Name"), t("الهاتف", "Phone"), t("البريد", "Email"), t("المجموعة", "Group"), t("الحالة", "Status")]}>{accounts.items.map((x) => <tr key={x.userId}><Td>{x.name}</Td><Td>{x.phone}</Td><Td>{x.email || "—"}</Td><Td>{x.isSuperAdmin ? t("سوبر أدمن", "Super admin") : x.groupName || t("بدون مجموعة", "No group")}</Td><Td>{x.isActive ? t("نشط", "Active") : t("موقوف", "Suspended")}</Td></tr>)}</Table>}
  </DashboardShell>;
}