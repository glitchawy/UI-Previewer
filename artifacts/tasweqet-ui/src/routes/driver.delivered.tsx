import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, Button, Card, Icon, MobileShell } from "@/components/tb/shell";
import { type DriverEarnings } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";
import { useTranslation } from "@/lib/i18n";
import { formatCurrency } from "@/lib/tb/locale-format";

export const Route = createFileRoute("/driver/delivered")({ component: DriverDelivered });
function DriverDelivered() {
  const { t, locale } = useTranslation();
  const query = useDriverData<DriverEarnings>("/earnings");
  const latest = query.data?.entries[0];
   return <MobileShell><AppBar title={t("تم التوصيل", "Delivered")} back="/driver" /><div className="flex flex-col items-center gap-md p-md text-center">
     <Icon name="check_circle" className="text-[72px] text-success" filled /><h1 className="font-headline-lg">{t("تم توصيل الطلب بنجاح", "Order delivered successfully")}</h1>
     {query.loading ? <Card className="w-full p-md">{t("جاري تثبيت حركة الأرباح…", "Finalizing earnings activity…")}</Card> :
      query.error ? <Card className="w-full p-md text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
      latest ? <Card className="w-full p-md text-right"><div className="flex justify-between py-2"><span>{t("رسوم التوصيل", "Delivery fee")}</span><span>{formatCurrency(latest.deliveryFee, locale)}</span></div><div className="flex justify-between border-y py-2"><span>{t(`النسبة المثبتة (${latest.shareRate}%)`, `Confirmed share (${latest.shareRate}%)`)}</span><span>{formatCurrency(latest.netAmount - latest.bonus, locale)}</span></div>{latest.bonus ? <div className="flex justify-between py-2"><span>{t("مكافأة", "Bonus")}</span><span>{formatCurrency(latest.bonus, locale)}</span></div> : null}<div className="flex justify-between pt-2 font-bold text-success"><span>{t("صافي أرباحك", "Your net earnings")}</span><span>{formatCurrency(latest.netAmount, locale)}</span></div></Card> : <Card className="w-full p-md">{t("لم تظهر حركة مالية بعد. افتح كشف الأرباح لإعادة التحميل.", "No financial activity yet. Open the earnings statement to reload.")}</Card>}
     <div className="grid w-full grid-cols-2 gap-sm"><Link to="/driver/wallet"><Button variant="outline" className="w-full">{t("الأرباح", "Earnings")}</Button></Link><Link to="/driver"><Button className="w-full">{t("الرئيسية", "Home")}</Button></Link></div>
  </div></MobileShell>;
}