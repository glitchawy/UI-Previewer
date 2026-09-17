import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Table, Td, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatDateTime, formatNumber } from "@/lib/tb/locale-format";
import { PayoutRequestPanel, createPayoutClient } from "@/components/tb/manual-payout";
import { payoutRequest } from "@/lib/manual-payout";
import type { ManualPayoutCreate, ManualPayoutRequest, PayoutResponse } from "@/lib/manual-payout";

export const Route = createFileRoute("/partner/settlements")({ component: PartnerSettlements });
type Settlement = { id: number; periodStart: string; periodEnd: string; orderCount: number; grossAmount: string; commissionAmount: string; refundAmount: string; netAmount: string; status: "pending" | "approved" | "paid"; paidAt: string | null };
type Page = { items: Settlement[]; total: number };

const partnerPayoutClient = createPayoutClient(
  () => payoutRequest<PayoutResponse>("/payouts"),
  (body: ManualPayoutCreate) => payoutRequest<ManualPayoutRequest>("/payouts", {
    method: "POST",
    body: JSON.stringify(body),
  }),
  (id: number | string) => payoutRequest<ManualPayoutRequest>(`/payouts/${id}/cancel`, {
    method: "POST",
  }),
);

function PartnerSettlements() {
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
  const query = usePartnerResource<Page>("/api/partner/operations/settlements?page=1&pageSize=50");
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("التسويات والتحويلات", "Settlements & payouts")}>
    <div className="flex flex-col gap-xl">
      <PayoutRequestPanel client={partnerPayoutClient} />
      <section>
        <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">{t("لقطات التسوية", "Settlement snapshots")}</h2>
        {query.loading ? <Card className="p-md">{t("جارٍ التحميل...", "Loading…")}</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button className="mt-2" onClick={query.reload}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
          query.data?.items.length ? <div className="overflow-x-auto"><Table head={[t("الفترة", "Period"), t("الطلبات", "Orders"), t("الإجمالي", "Gross"), t("العمولة", "Commission"), t("المرتجعات", "Refunds"), t("الصافي", "Net"), t("الحالة", "Status")]}>{query.data.items.map(item =>
            <tr key={item.id}><Td>{formatDateTime(item.periodStart, locale)} — {formatDateTime(item.periodEnd, locale)}</Td><Td>{formatNumber(item.orderCount, locale)}</Td><Td>{formatCurrency(item.grossAmount, locale)}</Td><Td>{formatCurrency(item.commissionAmount, locale)}</Td><Td>{formatCurrency(item.refundAmount, locale)}</Td><Td>{formatCurrency(item.netAmount, locale)}</Td><Td><Badge tone={item.status === "paid" ? "success" : item.status === "approved" ? "info" : "warn"}>{item.status === "paid" ? t("مدفوعة", "Paid") : item.status === "approved" ? t("معتمدة", "Approved") : t("قيد المراجعة", "Pending review")}</Badge></Td></tr>)}</Table></div> :
          <Card className="p-lg text-center text-on-surface-variant">{t("لا توجد تسويات صادرة لمطعمك حتى الآن. تظهر هنا فور إصدارها من الإدارة.", "No settlements have been issued for your restaurant yet. They appear here when issued by the platform.")}</Card>}
      </section>
    </div>
  </DashboardShell>;
}