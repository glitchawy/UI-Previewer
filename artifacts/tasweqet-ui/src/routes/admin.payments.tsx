import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, SectionTitle, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";
import { adminCurrency, adminDateTime } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Payment = { id: number; reference: string; status: string; amount: number; refundedAmount: number; currency: string; transactionId: string | null; customerName: string | null; createdAt: string };
export const Route = createFileRoute("/admin/payments")({ component: AdminPayments });

function AdminPayments() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<Page<Payment>>();
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const statusLabel = (value: string) => ({
    "": t("الكل", "All"),
    pending: t("قيد الانتظار", "Pending"),
    paid: t("مدفوع", "Paid"),
    failed: t("فشل", "Failed"),
    refunded: t("تم الاسترداد", "Refunded"),
  }[value] ?? value);
  const load = useCallback(() => {
    setError("");
    void adminRequest<Page<Payment>>(`/admin/operations/payments?page=${page}&pageSize=20&status=${status}`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data")));
  }, [page, status, t]);
  useEffect(() => { void load(); }, [load]);

  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("المدفوعات", "Payments")}>
    <Card className="flex flex-wrap gap-2 p-md">{["", "pending", "paid", "failed", "refunded"].map((s) => <Button key={s || "all"} variant={status === s ? "primary" : "outline"} onClick={() => { setStatus(s); setPage(1); }}>{statusLabel(s)}</Button>)}</Card>
    <SectionTitle title={t("سجل Paymob الموثق", "Verified Paymob ledger")} icon="payments" />
    {error ? <Card className="p-md text-error">{error}<Button className="ms-2" onClick={() => void load()}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
      !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
        data.items.length === 0 ? <Card className="p-md">{t("لا توجد عمليات.", "No transactions.")}</Card> :
          <Table head={[t("المرجع", "Reference"), t("العميل", "Customer"), t("المبلغ", "Amount"), t("المسترد", "Refunded"), t("الحالة", "Status"), t("معاملة المزوّد", "Provider transaction"), t("الوقت", "Time")]} mobile="scroll">
            {data.items.map((x) => <tr key={x.id}><Td>{x.reference}</Td><Td>{x.customerName || "—"}</Td><Td>{adminCurrency(x.amount, locale, x.currency)}</Td><Td>{adminCurrency(x.refundedAmount, locale, x.currency)}</Td><Td><StatusBadge status={x.status.toUpperCase()} label={statusLabel(x.status)} /></Td><Td>{x.transactionId || "—"}</Td><Td>{adminDateTime(x.createdAt, locale)}</Td></tr>)}
          </Table>}
    {data && <div className="flex justify-end gap-2"><Button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>{t("السابق", "Previous")}</Button><Button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>{t("التالي", "Next")}</Button></div>}
  </DashboardShell>;
}