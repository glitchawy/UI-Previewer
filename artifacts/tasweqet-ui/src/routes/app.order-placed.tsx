import { createFileRoute, Link } from "@tanstack/react-router";
import { useListCustomerOrders } from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Badge, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/orders";

export const Route = createFileRoute("/app/order-placed")({
  validateSearch: (search: Record<string, unknown>) => ({
    ids: typeof search.ids === "string" ? search.ids : "",
  }),
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تم الطلب" },
      { name: "description", content: "تم استلام طلبك بنجاح وجاري تأكيده" },
    ],
  }),
  component: AppOrderPlaced,
});

function AppOrderPlaced() {
  const { ids } = Route.useSearch();
  const requestedIds = new Set(ids.split(",").map(Number).filter(Number.isInteger));
  const ordersQuery = useListCustomerOrders();
  const orders = (ordersQuery.data ?? []).filter((order) => requestedIds.has(order.id));

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="تم الطلب" />
      <div className="tb-fade-up flex flex-col items-center gap-lg p-lg text-center">
        <div className="relative flex size-24 items-center justify-center">
          <span className="tb-ping absolute inset-0 rounded-full bg-success/20" />
          <span className="flex size-20 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check_circle" className="text-[48px]" filled /></span>
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">تم إرسال طلبك بنجاح!</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">كل مطعم استلم طلب مستقل وهيبدأ تأكيده دلوقتي</p>
        </div>
        <Badge tone="info" className="px-4 py-2"><Icon name="schedule" className="text-[16px]" />الوقت المتوقع 30–40 دقيقة</Badge>

        {ordersQuery.isLoading ? <Icon name="progress_activity" className="animate-spin text-[32px] text-primary" /> : (
          <div className="w-full space-y-3 text-right">
            {orders.map((order) => (
              <Link key={order.id} to="/app/orders/$id" params={{ id: String(order.id) }} className="block">
                <Card className="flex items-center gap-3 p-md">
                  <span className="flex size-11 items-center justify-center rounded-full bg-primary-container text-on-primary-container"><Icon name="receipt_long" /></span>
                  <span className="min-w-0 flex-1"><span className="block font-label-lg text-label-lg">{order.restaurantName}</span><span className="block font-label-md text-label-md text-on-surface-variant">{order.code}</span></span>
                  <span className="font-headline-md text-headline-md">{EGP(order.total)}</span>
                  <Icon name="chevron_left" className="text-outline" />
                </Card>
              </Link>
            ))}
          </div>
        )}
        {!ordersQuery.isLoading && orders.length === 0 ? <p className="font-label-md text-label-md text-on-surface-variant">تقدر تلاقي الطلب في صفحة طلباتي.</p> : null}
        <div className="flex w-full flex-col gap-2">
          <Link to="/app/orders"><Button className="w-full" icon="receipt_long">عرض طلباتي</Button></Link>
          <Link to="/app"><Button variant="outline" className="w-full" icon="restaurant_menu">العودة للرئيسية</Button></Link>
        </div>
      </div>
    </MobileShell>
  );
}