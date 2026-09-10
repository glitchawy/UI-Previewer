import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppBar, Button, Card, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { driverTabs } from "@/lib/tb/nav";
import { driverApi, type DriverAccount } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";
import { logoutSession } from "@/lib/auth-session";

export const Route = createFileRoute("/driver/profile")({ component: DriverProfile });
function DriverProfile() {
  const navigate = useNavigate();
  const query = useDriverData<DriverAccount>("/account");
  const [form, setForm] = useState({ fullName: "", area: "", vehicleType: "" });
  const [saving, setSaving] = useState(false), [message, setMessage] = useState("");
  useEffect(() => { if (query.data) setForm({ fullName: query.data.fullName, area: query.data.area, vehicleType: query.data.vehicleType }); }, [query.data]);
  async function save() {
    setSaving(true); setMessage("");
    try {
      await driverApi("/account", { method: "PATCH", body: JSON.stringify(form) });
      setMessage("تم حفظ البيانات"); await query.retry();
    } catch (e) { setMessage(e instanceof Error ? e.message : "تعذر الحفظ"); }
    finally { setSaving(false); }
  }
  async function logout() { await logoutSession(); navigate({ to: "/auth/login" }); }
  return <MobileShell tabs={driverTabs}><AppBar title="حسابي" /><div className="flex flex-col gap-md p-md">
    {query.loading ? <Card className="p-xl text-center">جاري تحميل الحساب…</Card> :
     query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>إعادة المحاولة</Button></Card> :
     query.data ? <>
       <Card className="flex flex-col items-center gap-2 p-lg text-center"><span className="flex size-20 items-center justify-center rounded-full bg-primary-container"><Icon name="person" className="text-[36px]" /></span><p className="font-headline-md">{query.data.fullName}</p><p className="text-label-md text-on-surface-variant">{query.data.deliveries} توصيلة · {query.data.phone}</p><StatusBadge status={query.data.status} /></Card>
       <Card className="flex flex-col gap-3 p-md">
         <label className="text-label-md">الاسم<input className="mt-1 w-full rounded-button border p-3" value={form.fullName} maxLength={100} onChange={e => setForm(v => ({ ...v, fullName: e.target.value }))} /></label>
         <label className="text-label-md">المنطقة<input className="mt-1 w-full rounded-button border p-3" value={form.area} maxLength={100} onChange={e => setForm(v => ({ ...v, area: e.target.value }))} /></label>
         <label className="text-label-md">نوع المركبة<input className="mt-1 w-full rounded-button border p-3" value={form.vehicleType} maxLength={100} onChange={e => setForm(v => ({ ...v, vehicleType: e.target.value }))} /></label>
         {message ? <p className={message.startsWith("تم") ? "text-success" : "text-error"}>{message}</p> : null}
         <Button onClick={save} disabled={saving}>{saving ? "جاري الحفظ…" : "حفظ التعديلات"}</Button>
       </Card>
       <Link to="/driver/documents"><Card className="flex items-center justify-between p-md"><span className="flex gap-2"><Icon name="verified_user" />مستندات التوثيق</span><Icon name="chevron_left" /></Card></Link>
       <Button variant="danger" icon="logout" onClick={logout}>تسجيل الخروج</Button>
     </> : null}
  </div></MobileShell>;
}