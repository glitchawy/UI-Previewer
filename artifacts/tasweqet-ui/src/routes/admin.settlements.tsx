import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";
import { adminCurrency, adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Item = {
  settlement: { id: number; restaurantId: number; periodStart: string; periodEnd: string; orderCount: number; grossAmount: string; commissionAmount: string; refundAmount: string; netAmount: string; status: string };
  restaurantName: string | null;
};
export const Route = createFileRoute("/admin/settlements")({ component: Settlements });

function Settlements() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<Page<Item>>();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ restaurantId: "", periodStart: "", periodEnd: "", reason: "" });
  const statusLabel = (status: string) => ({ pending: t("قيد المراجعة", "Pending"), approved: t("معتمد", "Approved"), paid: t("مدفوع", "Paid") }[status] ?? status);
  const load = useCallback(() => adminRequest<Page<Item>>("/admin/operations/settlements?page=1&pageSize=50")
    .then(setData)
    .catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data"))), [t]);
  useEffect(() => { void load(); }, [load]);
  async function generate() {
    try {
      await adminRequest("/admin/operations/settlements/generate", { method: "POST", body: JSON.stringify({ ...form, restaurantId: Number(form.restaurantId) }) });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("فشل", "Failed"));
    }
  }
  async function changeState(item: Item) {
    const target = item.settlement.status === "pending" ? "approved" : "paid";
    const reason = prompt(`${t("سبب", "Reason")} ${statusLabel(target)}`);
    if (!reason || !confirm(t("تأكيد تغيير حالة التسوية؟", "Confirm changing settlement status?"))) return;
    try {
      await adminRequest(`/admin/operations/settlements/${item.settlement.id}/state`, { method: "POST", body: JSON.stringify({ status: target, reason }) });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("فشل", "Failed"));
    }
  }
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("تسويات المطاعم", "Restaurant settlements")}>
    <Card className="grid gap-2 p-md md:grid-cols-4">
      <Field label={t("رقم المطعم", "Restaurant ID")} value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })} />
      <Field label={t("من", "From")} type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
      <Field label={t("إلى", "To")} type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
      <Field label={t("سبب الإنشاء", "Reason for creation")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <Button onClick={() => void generate()}>{t("إنشاء لقطة تسوية", "Create settlement snapshot")}</Button>
    </Card>
    <SectionTitle title={t("لقطات مالية غير قابلة للتعديل", "Immutable financial snapshots")} icon="account_balance" />
    {error ? <Card className="p-md text-error">{error}<Button onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card> :
      !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
        !data.items.length ? <Card className="p-md">{t("لا توجد تسويات.", "No settlements.")}</Card> :
          <Table head={[t("المطعم", "Restaurant"), t("الفترة", "Period"), t("الطلبات", "Orders"), t("الإجمالي", "Gross"), t("العمولة", "Commission"), t("الاسترداد", "Refunds"), t("الصافي", "Net"), t("الحالة", "Status"), t("الإجراء", "Action")]} mobile="scroll">
            {data.items.map((x) => <tr key={x.settlement.id}><Td>{x.restaurantName || x.settlement.restaurantId}</Td><Td>{x.settlement.periodStart} — {x.settlement.periodEnd}</Td><Td>{adminNumber(x.settlement.orderCount, locale)}</Td><Td>{adminCurrency(Number(x.settlement.grossAmount), locale)}</Td><Td>{adminCurrency(Number(x.settlement.commissionAmount), locale)}</Td><Td>{adminCurrency(Number(x.settlement.refundAmount), locale)}</Td><Td>{adminCurrency(Number(x.settlement.netAmount), locale)}</Td><Td>{statusLabel(x.settlement.status)}</Td><Td>{x.settlement.status !== "paid" && <Button onClick={() => void changeState(x)}>{x.settlement.status === "pending" ? t("اعتماد", "Approve") : t("تعليم كمدفوع", "Mark paid")}</Button>}</Td></tr>)}
          </Table>}
  </DashboardShell>;
}