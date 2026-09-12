import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { useDriverTabs } from "@/lib/tb/nav";
import { type DriverDelivery } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";
import { useTranslation, translate } from "@/lib/i18n";
import { formatCurrency, formatDateTime } from "@/lib/tb/locale-format";

export const Route = createFileRoute("/driver/history")({
  head: () => ({ meta: [{ title: translate("سجل التوصيلات | طلبات بيتك", "Delivery history | Talabat Betak") }, { name: "description", content: translate("سجل التوصيلات الحقيقي للمندوب.", "The driver's delivery history.") }] }),
  component: DriverHistory,
});
const statusLabels: Record<string, [string, string]> = {
  delivered: ["تم التوصيل", "Delivered"],
  picked_up: ["خرج للتوصيل", "Out for delivery"],
  delivering: ["قيد التوصيل", "Out for delivery"],
  cancelled: ["ملغي", "Cancelled"],
};

function DriverHistory() {
  const { t, locale } = useTranslation();
  const driverTabs = useDriverTabs();
  const query = useDriverData<{ items: DriverDelivery[]; page: number; pageSize: number }>("/deliveries?page=1&pageSize=50");
  const rows = query.data?.items ?? [];
  return <MobileShell tabs={driverTabs}>
    <AppBar title={t("سجل التوصيلات", "Delivery history")} />
    <div className="tb-fade-up flex flex-col gap-md p-md">
      {query.loading ? <Card className="p-xl text-center"><Icon name="progress_activity" className="animate-spin text-[32px] text-primary" /><p>{t("جاري تحميل التوصيلات…", "Loading deliveries…")}</p></Card> :
       query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
       !rows.length ? <EmptyState icon="history" title={t("مفيش توصيلات", "No deliveries")} body={t("هتظهر هنا التوصيلات المسندة ليك", "Assigned deliveries will appear here")} /> :
       <>
          <Card className="flex items-center justify-between p-md"><span>{t(`إجمالي ${rows.length} توصيلة`, `Total ${rows.length} deliveries`)}</span><b className="text-success">{formatCurrency(rows.reduce((sum, row) => sum + row.earnings, 0), locale)}</b></Card>
         <div className="flex flex-col gap-2">{rows.map(row => <Card key={row.id} className="flex items-center justify-between gap-2 p-md">
            <div className="min-w-0"><p className="font-label-lg">{row.restaurantName}</p><p className="truncate text-label-md text-on-surface-variant">{row.code} · {formatDateTime(row.deliveredAt ?? row.createdAt, locale)}</p><p className="truncate text-label-md text-on-surface-variant">{row.deliveryAddressText}</p></div>
            <div className="shrink-0 text-left"><p className="font-label-lg text-success">{formatCurrency(row.earnings, locale)}</p><StatusBadge status={row.status.toUpperCase()} label={statusLabels[row.status] ? t(...statusLabels[row.status]) : row.status} /></div>
         </Card>)}</div>
       </>}
    </div>
  </MobileShell>;
}