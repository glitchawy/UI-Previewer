import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, Button, Card, Icon, MobileShell } from "@/components/tb/shell";
import { EGP } from "@/lib/tb/data";
import { type DriverEarnings } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";

export const Route = createFileRoute("/driver/delivered")({ component: DriverDelivered });
function DriverDelivered() {
  const query = useDriverData<DriverEarnings>("/earnings");
  const latest = query.data?.entries[0];
  return <MobileShell><AppBar title="تم التوصيل" back="/driver" /><div className="flex flex-col items-center gap-md p-md text-center">
    <Icon name="check_circle" className="text-[72px] text-success" filled /><h1 className="font-headline-lg">تم توصيل الطلب بنجاح</h1>
    {query.loading ? <Card className="w-full p-md">جاري تثبيت حركة الأرباح…</Card> :
     query.error ? <Card className="w-full p-md text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>إعادة المحاولة</Button></Card> :
     latest ? <Card className="w-full p-md text-right"><div className="flex justify-between py-2"><span>رسوم التوصيل</span><span>{EGP(latest.deliveryFee)}</span></div><div className="flex justify-between border-y py-2"><span>النسبة المثبتة ({latest.shareRate}%)</span><span>{EGP(latest.netAmount - latest.bonus)}</span></div>{latest.bonus ? <div className="flex justify-between py-2"><span>مكافأة</span><span>{EGP(latest.bonus)}</span></div> : null}<div className="flex justify-between pt-2 font-bold text-success"><span>صافي أرباحك</span><span>{EGP(latest.netAmount)}</span></div></Card> : <Card className="w-full p-md">لم تظهر حركة مالية بعد. افتح كشف الأرباح لإعادة التحميل.</Card>}
    <div className="grid w-full grid-cols-2 gap-sm"><Link to="/driver/wallet"><Button variant="outline" className="w-full">الأرباح</Button></Link><Link to="/driver"><Button className="w-full">الرئيسية</Button></Link></div>
  </div></MobileShell>;
}