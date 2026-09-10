import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { EGP } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";
import { type DriverDelivery } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";

export const Route = createFileRoute("/driver/history")({
  head: () => ({ meta: [{ title: "سجل التوصيلات | طلبات بيتك" }, { name: "description", content: "سجل التوصيلات الحقيقي للكابتن." }] }),
  component: DriverHistory,
});

function DriverHistory() {
  const query = useDriverData<{ items: DriverDelivery[]; page: number; pageSize: number }>("/deliveries?page=1&pageSize=50");
  const rows = query.data?.items ?? [];
  return <MobileShell tabs={driverTabs}>
    <AppBar title="سجل التوصيلات" />
    <div className="tb-fade-up flex flex-col gap-md p-md">
      {query.loading ? <Card className="p-xl text-center"><Icon name="progress_activity" className="animate-spin text-[32px] text-primary" /><p>جاري تحميل التوصيلات…</p></Card> :
       query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>إعادة المحاولة</Button></Card> :
       !rows.length ? <EmptyState icon="history" title="مفيش توصيلات" body="هتظهر هنا التوصيلات المسندة ليك" /> :
       <>
         <Card className="flex items-center justify-between p-md"><span>إجمالي {rows.length} توصيلة</span><b className="text-success">{EGP(rows.reduce((sum, row) => sum + row.earnings, 0))}</b></Card>
         <div className="flex flex-col gap-2">{rows.map(row => <Card key={row.id} className="flex items-center justify-between gap-2 p-md">
           <div className="min-w-0"><p className="font-label-lg">{row.restaurantName}</p><p className="truncate text-label-md text-on-surface-variant">{row.code} · {new Date(row.deliveredAt ?? row.createdAt).toLocaleString("ar-EG")}</p><p className="truncate text-label-md text-on-surface-variant">{row.deliveryAddressText}</p></div>
           <div className="shrink-0 text-left"><p className="font-label-lg text-success">{EGP(row.earnings)}</p><StatusBadge status={row.status.toUpperCase()} label={row.status === "delivered" ? "تم التوصيل" : row.status} /></div>
         </Card>)}</div>
       </>}
    </div>
  </MobileShell>;
}