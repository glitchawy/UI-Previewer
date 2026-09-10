import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";

type Outbox = { id: number; title: string; body: string; audience: { role: string }; status: string; createdAt: string };
export const Route = createFileRoute("/admin/notifications")({ component: Notifications });

function Notifications() {
  const [data, setData] = useState<Page<Outbox>>();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", body: "", audienceRole: "customer", reason: "" });
  const load = useCallback(() => {
    setError("");
    void adminRequest<Page<Outbox>>("/admin/operations/notifications?page=1&pageSize=50").then(setData).catch(e => setError(e.message));
  }, []);
  useEffect(load, [load]);
  async function mutate(path: string, method: "POST" | "PATCH", body: object) {
    try { await adminRequest(path, { method, body: JSON.stringify(body) }); load(); }
    catch (e) { setError(e instanceof Error ? e.message : "فشل الحفظ"); }
  }
  async function replay(itemId: number) {
    const reason = prompt("سبب إعادة المحاولة"); if (reason) await mutate(`/admin/operations/notifications/${itemId}/replay`, "POST", { reason });
  }
  async function cancel(itemId: number) {
    const reason = prompt("سبب الإلغاء"); if (reason && confirm("تأكيد إلغاء حدث الإرسال؟")) await mutate(`/admin/operations/notifications/${itemId}`, "PATCH", { status: "cancelled", reason });
  }
  return <DashboardShell brand="طلبات بيتك" role="الإدارة" nav={adminNav} title="صندوق الإشعارات">
    <Card className="grid gap-2 p-md md:grid-cols-2">
      <Field label="العنوان" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
      <Field label="النص" value={form.body} onChange={e => setForm({ ...form, body: e.target.value })} />
      <select value={form.audienceRole} onChange={e => setForm({ ...form, audienceRole: e.target.value })} className="rounded-button border p-2">
        <option value="customer">العملاء</option><option value="partner">المطاعم</option><option value="driver">المندوبون</option>
      </select>
      <Field label="سبب الإرسال" value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })} />
      <Button onClick={() => mutate("/admin/operations/notifications", "POST", form)}>حفظ كحدث معلّق</Button>
    </Card>
    <SectionTitle title="أحداث الإرسال المرصودة" icon="outbox" />
    {error ? <Card className="p-md text-error">{error}<Button onClick={load}>إعادة</Button></Card> : !data ? <Card className="p-md">جاري التحميل…</Card> : !data.items.length ? <Card className="p-md">الصندوق فارغ.</Card> :
      <Table head={["العنوان", "النص", "الجمهور", "الحالة", "الوقت", ""]}>
        {data.items.map(x => <tr key={x.id}><Td>{x.title}</Td><Td>{x.body}</Td><Td>{x.audience.role}</Td><Td>{x.status}</Td><Td>{new Date(x.createdAt).toLocaleString("ar-EG")}</Td><Td><div className="flex gap-1"><Button onClick={() => replay(x.id)}>إعادة</Button>{x.status === "pending" && <Button variant="danger" onClick={() => cancel(x.id)}>إلغاء</Button>}</div></Td></tr>)}
      </Table>}
  </DashboardShell>;
}