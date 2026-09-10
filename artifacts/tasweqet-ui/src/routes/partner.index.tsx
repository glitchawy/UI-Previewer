import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";

export const Route = createFileRoute("/partner/")({ component: PartnerIndex });
type Analytics = {
  summary: { orders: number; revenue: number; cancelled: number; averageOrderValue: number };
  customers: { unique: number; repeat: number };
  series: { date: string; orders: number; revenue: number }[];
  bestProducts: { name: string; orders: number; revenue: number }[];
  branches: { branchId: number; name: string; orders: number; revenue: number }[];
};
const egp = (value: number) => `${value.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;

function PartnerIndex() {
  const query = usePartnerResource<Analytics>("/api/partner/operations/analytics?days=7");
  return <DashboardShell brand="طلبات بيتك" role="صاحب المطعم" nav={partnerNav} title="لوحة الأداء">
    {query.loading ? <Card className="p-md">جارٍ تحميل بيانات المطعم...</Card> :
      query.error ? <Card className="flex flex-col gap-3 p-md text-error">{query.error}<Button variant="outline" onClick={query.reload}>إعادة المحاولة</Button></Card> :
      query.data ? <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-2 gap-sm lg:grid-cols-4">
          <Stat label="إيرادات الطلبات المسلّمة" value={egp(query.data.summary.revenue)} icon="payments" tone="success" />
          <Stat label="الطلبات" value={String(query.data.summary.orders)} icon="receipt_long" tone="info" />
          <Stat label="متوسط قيمة الطلب" value={egp(query.data.summary.averageOrderValue)} icon="shopping_basket" />
          <Stat label="الطلبات الملغاة" value={String(query.data.summary.cancelled)} icon="cancel" tone="danger" />
        </div>
        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <Card className="p-md">
            <SectionTitle title="أفضل المنتجات خلال 7 أيام" icon="trending_up" />
            {query.data.bestProducts.length ? <Table head={["المنتج", "الكمية", "الإيراد"]}>{query.data.bestProducts.map(item =>
              <tr key={item.name}><Td>{item.name}</Td><Td>{item.orders}</Td><Td>{egp(item.revenue)}</Td></tr>)}</Table> :
              <p className="text-on-surface-variant">لا توجد مبيعات مسلّمة في هذه الفترة.</p>}
          </Card>
          <Card className="p-md">
            <SectionTitle title="أداء الفروع" icon="store" />
            {query.data.branches.length ? <Table head={["الفرع", "الطلبات", "الإيراد"]}>{query.data.branches.map(branch =>
              <tr key={branch.branchId}><Td>{branch.name}</Td><Td>{branch.orders}</Td><Td>{egp(branch.revenue)}</Td></tr>)}</Table> :
              <p className="text-on-surface-variant">لم تتم إضافة فروع بعد.</p>}
          </Card>
        </div>
        <div className="flex flex-wrap gap-2"><Link to="/partner/orders"><Button>عرض الطلبات</Button></Link><Link to="/partner/analytics"><Button variant="outline">التحليلات التفصيلية</Button></Link></div>
      </div> : null}
  </DashboardShell>;
}