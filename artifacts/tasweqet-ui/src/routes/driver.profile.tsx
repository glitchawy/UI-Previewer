import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppBar, Button, Card, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { useDriverTabs } from "@/lib/tb/nav";
import { driverApi, type DriverAccount } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";
import { logoutSession } from "@/lib/auth-session";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/driver/profile")({ component: DriverProfile });
const statusLabels: Record<string, [string, string]> = {
  PENDING: ["قيد الانتظار", "Pending"],
  UNDER_REVIEW: ["تحت المراجعة", "Under review"],
  APPROVED: ["موافق عليه", "Approved"],
  ACTIVE: ["نشط", "Active"],
  REJECTED: ["مرفوض", "Rejected"],
  SUSPENDED: ["موقوف", "Suspended"],
};
function DriverProfile() {
  const { t } = useTranslation();
  const driverTabs = useDriverTabs();
  const navigate = useNavigate();
  const query = useDriverData<DriverAccount>("/account");
  const [form, setForm] = useState({ fullName: "", area: "", vehicleType: "" });
  const [formDirty, setFormDirty] = useState(false);
  const [saving, setSaving] = useState(false), [message, setMessage] = useState("");
  useEffect(() => {
    if (query.data && !formDirty) {
      setForm({ fullName: query.data.fullName, area: query.data.area, vehicleType: query.data.vehicleType });
    }
  }, [formDirty, query.data]);
  async function save() {
    setSaving(true); setMessage("");
    try {
      await driverApi("/account", { method: "PATCH", body: JSON.stringify(form) });
      setMessage(t("تم حفظ البيانات", "Details saved")); setFormDirty(false); await query.retry();
    } catch (e) { setMessage(e instanceof Error ? e.message : t("تعذر الحفظ", "Could not save")); }
    finally { setSaving(false); }
  }
  async function logout() { await logoutSession(); navigate({ to: "/auth/login" }); }
  return <MobileShell tabs={driverTabs}><AppBar title={t("حسابي", "Profile")} /><div className="flex flex-col gap-md p-md">
    {query.loading ? <Card className="p-xl text-center">{t("جاري تحميل الحساب…", "Loading profile…")}</Card> :
     query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
     query.data ? <>
        <Card className="flex flex-col items-center gap-2 p-lg text-center"><span className="flex size-20 items-center justify-center rounded-full bg-primary-container"><Icon name="person" className="text-[36px]" /></span><p className="font-headline-md">{query.data.fullName}</p><p className="text-label-md text-on-surface-variant">{t(`${query.data.deliveries} توصيلة`, `${query.data.deliveries} deliveries`)} · {query.data.phone}</p><StatusBadge status={query.data.status} label={statusLabels[query.data.status] ? t(...statusLabels[query.data.status]) : query.data.status} /></Card>
       <Card className="flex flex-col gap-3 p-md">
          <label className="text-label-md">{t("الاسم", "Name")}<input aria-label={t("الاسم", "Name")} className="mt-1 w-full rounded-button border p-3" value={form.fullName} maxLength={100} onChange={e => { setFormDirty(true); setForm(v => ({ ...v, fullName: e.target.value })); }} /></label>
          <label className="text-label-md">{t("المنطقة", "Area")}<input aria-label={t("المنطقة", "Area")} className="mt-1 w-full rounded-button border p-3" value={form.area} maxLength={100} onChange={e => { setFormDirty(true); setForm(v => ({ ...v, area: e.target.value })); }} /></label>
          <label className="text-label-md">{t("نوع المركبة", "Vehicle type")}<input aria-label={t("نوع المركبة", "Vehicle type")} className="mt-1 w-full rounded-button border p-3" value={form.vehicleType} maxLength={100} onChange={e => { setFormDirty(true); setForm(v => ({ ...v, vehicleType: e.target.value })); }} /></label>
          {message ? <p className={message === t("تم حفظ البيانات", "Details saved") ? "text-success" : "text-error"}>{message}</p> : null}
          <Button onClick={save} disabled={saving}>{saving ? t("جاري الحفظ…", "Saving…") : t("حفظ التعديلات", "Save changes")}</Button>
       </Card>
        <Link to="/driver/documents"><Card className="flex items-center justify-between p-md"><span className="flex gap-2"><Icon name="verified_user" />{t("مستندات التوثيق", "Verification documents")}</span><Icon name="chevron_left" /></Card></Link>
        <Button variant="danger" icon="logout" onClick={logout}>{t("تسجيل الخروج", "Sign out")}</Button>
     </> : null}
  </div></MobileShell>;
}