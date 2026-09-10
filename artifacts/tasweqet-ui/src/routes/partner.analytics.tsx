import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";

export const Route = createFileRoute("/partner/analytics")({ component: PartnerAnalytics });
type Analytics = {
  summary: { orders: number; revenue: number; cancelled: number; averageOrderValue: number };
  customers: { unique: number; repeat: number };
  series: { date: string; orders: number; revenue: number }[];
  bestProducts: { name: string; orders: number; revenue: number }[];
  worstProducts: { name: string; orders: number; revenue: number }[];
  branches: { branchId: number; name: string; orders: number; revenue: number }[];
};
const egp = (n: number) => `${n.toLocaleString("ar-EG", { maximumFractionDigits: 2 })} ج.م`;

function PartnerAnalytics() {
  const [days, setDays] = useState(30);
  const query = usePartnerResource<Analytics>(`/api/partner/operations/analytics?days=${days}`);
  const data = query.data;
  return <DashboardShell brand="طلبات بيتك" role="صاحب المطعم" nav={partnerNav} title="التحليلات">
    <div className="flex flex-col gap-lg">
      <div className="flex gap-2">{[7, 30, 90].map(value => <Button key={value} variant={days === value ? "primary" : "outline"} onClick={() => setDays(value)}>{value} يوم</Button>)}</div>
      {query.loading ? <Card className="p-md">جارٍ التحميل...</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button className="mt-2" onClick={query.reload}>إعادة المحاولة</Button></Card> : data ? <>
        <div className="grid grid-cols-2 gap-sm lg:grid-cols-4">
          <Stat label="الإيرادات المسلّمة" value={egp(data.summary.revenue)} icon="payments" tone="success" />
          <Stat label="الطلبات" value={String(data.summary.orders)} icon="receipt_long" tone="info" />
          <Stat label="متوسط الطلب" value={egp(data.summary.averageOrderValue)} icon="shopping_basket" />
          <Stat label="عملاء متكررون" value={`${data.customers.repeat} / ${data.customers.unique}`} icon="repeat" />
        </div>
        <Card className="p-md"><SectionTitle title="الأداء اليومي" icon="calendar_month" />
          {data.series.length ? <Table head={["اليوم", "الطلبات المسلّمة", "الإيراد"]}>{data.series.map(row => <tr key={row.date}><Td>{row.date}</Td><Td>{row.orders}</Td><Td>{egp(row.revenue)}</Td></tr>)}</Table> : <p>لا توجد بيانات في الفترة.</p>}
        </Card>
        <Card className="p-md"><SectionTitle title="مقارنة الفروع" icon="store" />
          {data.branches.length ? <Table head={["الفرع", "الطلبات", "الإيراد"]}>{data.branches.map(row => <tr key={row.branchId}><Td>{row.name}</Td><Td>{row.orders}</Td><Td>{egp(row.revenue)}</Td></tr>)}</Table> : <p>لا توجد فروع.</p>}
        </Card>
      </> : null}
    </div>
  </DashboardShell>;
}