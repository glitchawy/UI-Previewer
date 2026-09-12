import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell } from "@/components/tb/shell";
import { useDriverTabs } from "@/lib/tb/nav";
import { type DriverEarnings } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";
import { useTranslation, translate } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/tb/locale-format";

export const Route = createFileRoute("/driver/wallet")({
  head: () => ({ meta: [{ title: translate("الأرباح | طلبات بيتك", "Earnings | Talabat Betak") }, { name: "description", content: translate("كشف أرباح المندوب من سجلات مالية غير قابلة للتعديل.", "Driver earnings from immutable financial records.") }] }),
  component: DriverWallet,
});
function DriverWallet() {
  const { t, locale } = useTranslation();
  const driverTabs = useDriverTabs();
  const query = useDriverData<DriverEarnings>("/earnings");
  const data = query.data;
   return <MobileShell tabs={driverTabs}><AppBar title={t("الأرباح", "Earnings")} /><div className="flex flex-col gap-md p-md">
     {query.loading ? <Card className="p-xl text-center">{t("جاري تحميل كشف الأرباح…", "Loading earnings statement…")}</Card> :
     query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
     data ? <>
        <Card className="bg-primary-container p-lg text-on-primary-container"><p className="text-label-md opacity-80">{t("إجمالي الأرباح المثبتة", "Total confirmed earnings")}</p><p className="font-headline-lg">{formatCurrency(data.total, locale)}</p><div className="mt-3 flex gap-4"><span>{t("اليوم:", "Today:")} {formatCurrency(data.today, locale)}</span><span>{t("آخر ٧ أيام:", "Last 7 days:")} {formatCurrency(data.week, locale)}</span></div></Card>
        <Card className="flex gap-2 p-md"><Icon name="verified" className="text-success" /><p className="text-label-md text-on-surface-variant">{t("الأرقام ناتجة من لقطات عمولة ثابتة عند التسليم، ولا يوجد رصيد قابل للتعديل يدوياً.", "Figures come from fixed commission snapshots at delivery; there is no manually editable balance.")}</p></Card>
        <h2 className="font-headline-md">{t("الحركات المالية", "Financial activity")}</h2>
        {!data.entries.length ? <EmptyState icon="payments" title={t("لا توجد أرباح بعد", "No earnings yet")} body={t("تُضاف الحركة تلقائياً بعد تسليم الطلب", "Activity is added automatically after delivery")} /> :
        <div className="flex flex-col gap-2">{data.entries.map(entry => <Card key={entry.id} className="flex items-center justify-between p-md"><div><p className="font-label-lg">{t(`أرباح الطلب TB-${String(entry.orderId).padStart(6, "0")}`, `Order earnings TB-${String(entry.orderId).padStart(6, "0")}`)}</p><p className="text-label-md text-on-surface-variant">{formatDateTime(entry.createdAt, locale)} · {t("نسبة", "Share")} {entry.shareRate}%</p></div><b className="text-success">+{formatCurrency(entry.netAmount, locale)}</b></Card>)}</div>}
     </> : null}
  </div></MobileShell>;
}