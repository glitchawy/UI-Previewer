import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Table, Td, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";

export const Route = createFileRoute("/partner/settlements")({ component: PartnerSettlements });
type Settlement = { id: number; periodStart: string; periodEnd: string; orderCount: number; grossAmount: string; commissionAmount: string; refundAmount: string; netAmount: string; status: "pending" | "approved" | "paid"; paidAt: string | null };
type Page = { items: Settlement[]; total: number };
const egp = (value: string) => `${Number(value).toLocaleString("ar-EG")} ج.م`;

function PartnerSettlements() {
  const query = usePartnerResource<Page>("/api/partner/operations/settlements?page=1&pageSize=50");
  return <DashboardShell brand="طلبات بيتك" role="صاحب المطعم" nav={partnerNav} title="التسويات">
    {query.loading ? <Card className="p-md">جارٍ التحميل...</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button className="mt-2" onClick={query.reload}>إعادة المحاولة</Button></Card> :
      query.data?.items.length ? <div className="overflow-x-auto"><Table head={["الفترة", "الطلبات", "الإجمالي", "العمولة", "المرتجعات", "الصافي", "الحالة"]}>{query.data.items.map(item =>
        <tr key={item.id}><Td>{item.periodStart} — {item.periodEnd}</Td><Td>{item.orderCount}</Td><Td>{egp(item.grossAmount)}</Td><Td>{egp(item.commissionAmount)}</Td><Td>{egp(item.refundAmount)}</Td><Td>{egp(item.netAmount)}</Td><Td><Badge tone={item.status === "paid" ? "success" : item.status === "approved" ? "info" : "warn"}>{item.status === "paid" ? "مدفوعة" : item.status === "approved" ? "معتمدة" : "قيد المراجعة"}</Badge></Td></tr>)}</Table></div> :
      <Card className="p-lg text-center text-on-surface-variant">لا توجد تسويات صادرة لمطعمك حتى الآن. تظهر هنا فور إصدارها من الإدارة.</Card>}
  </DashboardShell>;
}