import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell } from "@/components/tb/shell";
import { EGP } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";
import { type DriverEarnings } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";

export const Route = createFileRoute("/driver/wallet")({
  head: () => ({ meta: [{ title: "الأرباح | طلبات بيتك" }, { name: "description", content: "كشف أرباح الكابتن من سجلات مالية غير قابلة للتعديل." }] }),
  component: DriverWallet,
});
function DriverWallet() {
  const query = useDriverData<DriverEarnings>("/earnings");
  const data = query.data;
  return <MobileShell tabs={driverTabs}><AppBar title="الأرباح" /><div className="flex flex-col gap-md p-md">
    {query.loading ? <Card className="p-xl text-center">جاري تحميل كشف الأرباح…</Card> :
     query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>إعادة المحاولة</Button></Card> :
     data ? <>
       <Card className="bg-primary-container p-lg text-on-primary-container"><p className="text-label-md opacity-80">إجمالي الأرباح المثبتة</p><p className="font-headline-lg">{EGP(data.total)}</p><div className="mt-3 flex gap-4"><span>اليوم: {EGP(data.today)}</span><span>آخر ٧ أيام: {EGP(data.week)}</span></div></Card>
       <Card className="flex gap-2 p-md"><Icon name="verified" className="text-success" /><p className="text-label-md text-on-surface-variant">الأرقام ناتجة من لقطات عمولة ثابتة عند التسليم، ولا يوجد رصيد قابل للتعديل يدوياً.</p></Card>
       <h2 className="font-headline-md">الحركات المالية</h2>
       {!data.entries.length ? <EmptyState icon="payments" title="لا توجد أرباح بعد" body="تُضاف الحركة تلقائياً بعد تسليم الطلب" /> :
       <div className="flex flex-col gap-2">{data.entries.map(entry => <Card key={entry.id} className="flex items-center justify-between p-md"><div><p className="font-label-lg">أرباح الطلب TB-{String(entry.orderId).padStart(6, "0")}</p><p className="text-label-md text-on-surface-variant">{new Date(entry.createdAt).toLocaleString("ar-EG")} · نسبة {entry.shareRate}%</p></div><b className="text-success">+{EGP(entry.netAmount)}</b></Card>)}</div>}
     </> : null}
  </div></MobileShell>;
}