import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";
import { adminDateTime } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Outbox = { id: number; title: string; body: string; audience: { role: string }; status: string; createdAt: string };
export const Route = createFileRoute("/admin/notifications")({ component: Notifications });

function Notifications() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<Page<Outbox>>();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ title: "", body: "", audienceRole: "customer", reason: "" });
  const audienceLabel = (role: string) => ({ customer: t("العملاء", "Customers"), partner: t("المطاعم", "Restaurants"), driver: t("المندوبون", "Drivers") }[role] ?? role);
  const statusLabel = (status: string) => ({ pending: t("معلّق", "Pending"), sent: t("تم الإرسال", "Sent"), failed: t("فشل", "Failed"), cancelled: t("ملغي", "Cancelled") }[status] ?? status);
  const load = useCallback(() => {
    setError("");
    void adminRequest<Page<Outbox>>("/admin/operations/notifications?page=1&pageSize=50").then(setData).catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data")));
  }, [t]);
  useEffect(() => { void load(); }, [load]);
  async function mutate(path: string, method: "POST" | "PATCH", body: object) {
    try { await adminRequest(path, { method, body: JSON.stringify(body) }); void load(); }
    catch (e) { setError(e instanceof Error ? e.message : t("فشل الحفظ", "Save failed")); }
  }
  async function replay(itemId: number) {
    const reason = prompt(t("سبب إعادة المحاولة", "Reason for retry"));
    if (reason) await mutate(`/admin/operations/notifications/${itemId}/replay`, "POST", { reason });
  }
  async function cancel(itemId: number) {
    const reason = prompt(t("سبب الإلغاء", "Reason for cancellation"));
    if (reason && confirm(t("تأكيد إلغاء حدث الإرسال؟", "Confirm cancelling this delivery event?"))) await mutate(`/admin/operations/notifications/${itemId}`, "PATCH", { status: "cancelled", reason });
  }
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("صندوق الإشعارات", "Notification outbox")}>
    <Card className="grid gap-2 p-md md:grid-cols-2">
      <Field label={t("العنوان", "Title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <Field label={t("النص", "Body")} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
      <select aria-label={t("الجمهور", "Audience")} value={form.audienceRole} onChange={(e) => setForm({ ...form, audienceRole: e.target.value })} className="rounded-button border p-2">
        <option value="customer">{t("العملاء", "Customers")}</option><option value="partner">{t("المطاعم", "Restaurants")}</option><option value="driver">{t("المندوبون", "Drivers")}</option>
      </select>
      <Field label={t("سبب الإرسال", "Reason for sending")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <Button onClick={() => void mutate("/admin/operations/notifications", "POST", form)}>{t("حفظ كحدث معلّق", "Save as pending event")}</Button>
    </Card>
    <SectionTitle title={t("أحداث الإرسال المرصودة", "Observed delivery events")} icon="outbox" />
    {error ? <Card className="p-md text-error">{error}<Button onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card> :
      !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
        !data.items.length ? <Card className="p-md">{t("الصندوق فارغ.", "The outbox is empty.")}</Card> :
          <Table head={[t("العنوان", "Title"), t("النص", "Body"), t("الجمهور", "Audience"), t("الحالة", "Status"), t("الوقت", "Time"), t("الإجراء", "Action")]}>
            {data.items.map((x) => <tr key={x.id}><Td>{x.title}</Td><Td>{x.body}</Td><Td>{audienceLabel(x.audience.role)}</Td><Td>{statusLabel(x.status)}</Td><Td>{adminDateTime(x.createdAt, locale)}</Td><Td><div className="flex gap-1"><Button onClick={() => void replay(x.id)}>{t("إعادة", "Retry")}</Button>{x.status === "pending" && <Button variant="danger" onClick={() => void cancel(x.id)}>{t("إلغاء", "Cancel")}</Button>}</div></Td></tr>)}
          </Table>}
  </DashboardShell>;
}