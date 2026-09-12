import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/tb/locale-format";

export const Route = createFileRoute("/partner/analytics")({ component: PartnerAnalytics });
type Analytics = {
  summary: { orders: number; revenue: number; cancelled: number; averageOrderValue: number };
  customers: { unique: number; repeat: number };
  series: { date: string; orders: number; revenue: number }[];
  bestProducts: { name: string; orders: number; revenue: number }[];
  worstProducts: { name: string; orders: number; revenue: number }[];
  branches: { branchId: number; name: string; orders: number; revenue: number }[];
};
function PartnerAnalytics() {
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
  const [days, setDays] = useState(30);
  const query = usePartnerResource<Analytics>(`/api/partner/operations/analytics?days=${days}`);
  const data = query.data;
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("التحليلات", "Analytics")}>
    <div className="flex flex-col gap-lg">
      <div className="flex gap-2">{[7, 30, 90].map(value => <Button key={value} variant={days === value ? "primary" : "outline"} onClick={() => setDays(value)}>{t(`${value} يوم`, `${value} days`, { value })}</Button>)}</div>
      {query.loading ? <Card className="p-md">{t("جارٍ التحميل...", "Loading…")}</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button className="mt-2" onClick={query.reload}>{t("إعادة المحاولة", "Try again")}</Button></Card> : data ? <>
        <div className="grid grid-cols-2 gap-sm lg:grid-cols-4">
          <Stat label={t("الإيرادات المسلّمة", "Delivered revenue")} value={formatCurrency(data.summary.revenue, locale)} icon="payments" tone="success" />
          <Stat label={t("الطلبات", "Orders")} value={formatNumber(data.summary.orders, locale)} icon="receipt_long" tone="info" />
          <Stat label={t("متوسط الطلب", "Average order")} value={formatCurrency(data.summary.averageOrderValue, locale)} icon="shopping_basket" />
          <Stat label={t("عملاء متكررون", "Returning customers")} value={`${formatNumber(data.customers.repeat, locale)} / ${formatNumber(data.customers.unique, locale)}`} icon="repeat" />
        </div>
        <Card className="p-md"><SectionTitle title={t("الأداء اليومي", "Daily performance")} icon="calendar_month" />
          {data.series.length ? <Table head={[t("اليوم", "Date"), t("الطلبات المسلّمة", "Delivered orders"), t("الإيراد", "Revenue")]}>{data.series.map(row => <tr key={row.date}><Td>{row.date}</Td><Td>{formatNumber(row.orders, locale)}</Td><Td>{formatCurrency(row.revenue, locale)}</Td></tr>)}</Table> : <p>{t("لا توجد بيانات في الفترة.", "No data for this period.")}</p>}
        </Card>
        <Card className="p-md"><SectionTitle title={t("مقارنة الفروع", "Branch comparison")} icon="store" />
          {data.branches.length ? <Table head={[t("الفرع", "Branch"), t("الطلبات", "Orders"), t("الإيراد", "Revenue")]}>{data.branches.map(row => <tr key={row.branchId}><Td>{row.name}</Td><Td>{formatNumber(row.orders, locale)}</Td><Td>{formatCurrency(row.revenue, locale)}</Td></tr>)}</Table> : <p>{t("لا توجد فروع.", "No branches yet.")}</p>}
        </Card>
      </> : null}
    </div>
  </DashboardShell>;
}