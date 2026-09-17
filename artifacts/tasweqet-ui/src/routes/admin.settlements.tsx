import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { AdminPayoutManagement } from "@/components/tb/admin-payout-management";
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
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("تسويات وتحويلات المطاعم", "Restaurant settlements & payouts")}>
    <div className="flex flex-col gap-xl">
      <AdminPayoutManagement />
      <section>
        <SectionTitle title={t("لقطات مالية غير قابلة للتعديل", "Immutable financial snapshots")} icon="account_balance" />
        <Card className="mb-md grid gap-2 p-md md:grid-cols-4">
          <Field label={t("رقم المطعم", "Restaurant ID")} value={form.restaurantId} onChange={(e) => setForm({ ...form, restaurantId: e.target.value })} />
          <Field label={t("من", "From")} type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
          <Field label={t("إلى", "To")} type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
          <Field label={t("سبب الإنشاء", "Reason for creation")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
          <Button onClick={() => void generate()}>{t("إنشاء لقطة تسوية", "Create settlement snapshot")}</Button>
        </Card>
        <p className="mb-md rounded-button bg-surface-container-low p-sm font-body-md text-body-md text-on-surface-variant">
          {t("هذه اللقطات للعرض والمراجعة فقط. لا يمكن تعليم التسوية كمدفوعة هنا؛ استخدم طلب التحويل مع إثبات الدفع.", "These snapshots are view-only. A settlement cannot be marked paid here; use the payout request with payment proof.")}
        </p>
        {error ? <Card className="p-md text-error">{error}<Button className="mt-2" onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card> :
          !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
            !data.items.length ? <Card className="p-md">{t("لا توجد تسويات.", "No settlements.")}</Card> :
              <Table head={[t("المطعم", "Restaurant"), t("الفترة", "Period"), t("الطلبات", "Orders"), t("الإجمالي", "Gross"), t("العمولة", "Commission"), t("الاسترداد", "Refunds"), t("الصافي", "Net"), t("الحالة", "Status")]} mobile="scroll">
                {data.items.map((x) => <tr key={x.settlement.id}><Td>{x.restaurantName || x.settlement.restaurantId}</Td><Td>{x.settlement.periodStart} — {x.settlement.periodEnd}</Td><Td>{adminNumber(x.settlement.orderCount, locale)}</Td><Td>{adminCurrency(Number(x.settlement.grossAmount), locale)}</Td><Td>{adminCurrency(Number(x.settlement.commissionAmount), locale)}</Td><Td>{adminCurrency(Number(x.settlement.refundAmount), locale)}</Td><Td>{adminCurrency(Number(x.settlement.netAmount), locale)}</Td><Td>{x.settlement.status}</Td></tr>)}
              </Table>}
      </section>
    </div>
  </DashboardShell>;
}