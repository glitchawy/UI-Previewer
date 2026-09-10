import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bars, Button, Card, DashboardShell, EmptyState, SectionTitle, Stat, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/data";
import { adminApi } from "@/lib/admin-api";

type Overview = {
  gmv: number; orders: number; activeOrders: number; customers: number; restaurants: number;
  activeRestaurants: number; activeDrivers: number;
  topRestaurants: { id: number; name: string; orders: number; gmv: number }[];
  monthly: { month: string; orders: number; gmv: number }[];
};
export const Route = createFileRoute("/admin/")({ component: AdminIndex });
function AdminIndex() {
  const [data, setData] = useState<Overview>(), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => { const c = new AbortController(); setError(""); adminApi<Overview>("/overview", c.signal).then(setData).catch(e => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); }); return () => c.abort(); }, [retry]);
  return <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="نظرة عامة">
    {error ? <Card className="p-lg text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry(x => x + 1)}>إعادة المحاولة</Button></Card> :
    !data ? <Card className="p-xl text-center">جاري تحميل إحصاءات المنصة…</Card> :
    <div className="flex flex-col gap-md">
      <div className="grid grid-cols-2 gap-sm md:grid-cols-3 lg:grid-cols-6">
        <Stat label="إجمالي المبيعات" value={EGP(data.gmv)} icon="payments" />
        <Stat label="الطلبات" value={data.orders.toLocaleString("ar-EG")} icon="receipt_long" tone="info" />
        <Stat label="طلبات جارية" value={data.activeOrders.toLocaleString("ar-EG")} icon="local_shipping" tone="warn" />
        <Stat label="العملاء" value={data.customers.toLocaleString("ar-EG")} icon="group" tone="info" />
        <Stat label="المطاعم النشطة" value={`${data.activeRestaurants.toLocaleString("ar-EG")} / ${data.restaurants.toLocaleString("ar-EG")}`} icon="storefront" />
        <Stat label="المندوبون المعتمدون" value={data.activeDrivers.toLocaleString("ar-EG")} icon="two_wheeler" tone="success" />
      </div>
      <Card className="p-md"><SectionTitle title="آخر ٦ أشهر" icon="show_chart" />{data.monthly.length ? <Bars values={data.monthly.map(x => x.gmv)} labels={data.monthly.map(x => x.month)} /> : <EmptyState icon="show_chart" title="لا توجد مبيعات بعد" body="ستظهر البيانات الشهرية عند إنشاء الطلبات." />}</Card>
      <Card className="p-md"><SectionTitle title="أفضل المطاعم" icon="military_tech" />{data.topRestaurants.length ? <Table head={["المطعم", "الطلبات", "المبيعات"]}>{data.topRestaurants.map(r => <tr key={r.id}><Td>{r.name}</Td><Td>{Number(r.orders).toLocaleString("ar-EG")}</Td><Td>{EGP(r.gmv)}</Td></tr>)}</Table> : <EmptyState icon="storefront" title="لا توجد بيانات" body="لم تُسجل طلبات للمطاعم بعد." />}</Card>
    </div>}
  </DashboardShell>;
}