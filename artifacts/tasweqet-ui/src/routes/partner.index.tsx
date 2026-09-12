import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency, formatNumber } from "@/lib/tb/locale-format";

export const Route = createFileRoute("/partner/")({ component: PartnerIndex });
type Analytics = {
  summary: { orders: number; revenue: number; cancelled: number; averageOrderValue: number };
  customers: { unique: number; repeat: number };
  series: { date: string; orders: number; revenue: number }[];
  bestProducts: { name: string; orders: number; revenue: number }[];
  branches: { branchId: number; name: string; orders: number; revenue: number }[];
};
function PartnerIndex() {
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
  const query = usePartnerResource<Analytics>("/api/partner/operations/analytics?days=7");
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("لوحة الأداء", "Dashboard")}>
    {query.loading ? <Card className="p-md">{t("جارٍ تحميل بيانات المطعم...", "Loading restaurant data…")}</Card> :
      query.error ? <Card className="flex flex-col gap-3 p-md text-error">{query.error}<Button variant="outline" onClick={query.reload}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
      query.data ? <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-2 gap-sm lg:grid-cols-4">
          <Stat label={t("إيرادات الطلبات المسلّمة", "Delivered order revenue")} value={formatCurrency(query.data.summary.revenue, locale)} icon="payments" tone="success" />
          <Stat label={t("الطلبات", "Orders")} value={formatNumber(query.data.summary.orders, locale)} icon="receipt_long" tone="info" />
          <Stat label={t("متوسط قيمة الطلب", "Average order value")} value={formatCurrency(query.data.summary.averageOrderValue, locale)} icon="shopping_basket" />
          <Stat label={t("الطلبات الملغاة", "Cancelled orders")} value={formatNumber(query.data.summary.cancelled, locale)} icon="cancel" tone="danger" />
        </div>
        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <Card className="p-md">
            <SectionTitle title={t("أفضل المنتجات خلال 7 أيام", "Top products over 7 days")} icon="trending_up" />
            {query.data.bestProducts.length ? <Table head={[t("المنتج", "Product"), t("الكمية", "Quantity"), t("الإيراد", "Revenue")]}>{query.data.bestProducts.map(item =>
              <tr key={item.name}><Td>{item.name}</Td><Td>{formatNumber(item.orders, locale)}</Td><Td>{formatCurrency(item.revenue, locale)}</Td></tr>)}</Table> :
              <p className="text-on-surface-variant">{t("لا توجد مبيعات مسلّمة في هذه الفترة.", "No delivered sales in this period.")}</p>}
          </Card>
          <Card className="p-md">
            <SectionTitle title={t("أداء الفروع", "Branch performance")} icon="store" />
            {query.data.branches.length ? <Table head={[t("الفرع", "Branch"), t("الطلبات", "Orders"), t("الإيراد", "Revenue")]}>{query.data.branches.map(branch =>
              <tr key={branch.branchId}><Td>{branch.name}</Td><Td>{formatNumber(branch.orders, locale)}</Td><Td>{formatCurrency(branch.revenue, locale)}</Td></tr>)}</Table> :
              <p className="text-on-surface-variant">{t("لم تتم إضافة فروع بعد.", "No branches have been added yet.")}</p>}
          </Card>
        </div>
        <div className="flex flex-wrap gap-2"><Link to="/partner/orders"><Button>{t("عرض الطلبات", "View orders")}</Button></Link><Link to="/partner/analytics"><Button variant="outline">{t("التحليلات التفصيلية", "Detailed analytics")}</Button></Link></div>
      </div> : null}
  </DashboardShell>;
}