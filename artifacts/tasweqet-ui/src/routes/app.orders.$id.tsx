import { createFileRoute } from "@tanstack/react-router";
import { getGetCustomerOrderQueryKey, useGetCustomerOrder } from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Badge, EmptyState } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { EGP, formatOrderDate, orderStatusLabels, orderStatusTones } from "@/lib/tb/orders";

export const Route = createFileRoute("/app/orders/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تفاصيل الطلب" },
      { name: "description", content: "تفاصيل طلبك وحالته" },
    ],
  }),
  component: AppOrderDetail,
});

function AppOrderDetail() {
  const { id: rawId } = Route.useParams();
  const parsedId = Number(rawId);
  const id = Number.isInteger(parsedId) ? parsedId : 0;
  const orderQuery = useGetCustomerOrder(id, {
    query: { enabled: id > 0, queryKey: getGetCustomerOrderQueryKey(id) },
  });

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title={orderQuery.data?.code || "تفاصيل الطلب"} back="/app/orders" />
      {orderQuery.isLoading ? <div className="flex h-64 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[36px] text-primary" /></div> :
      orderQuery.isError || !orderQuery.data ? <div className="p-md"><EmptyState icon="error" title="الطلب غير موجود" body="تأكد من رقم الطلب وحاول مرة أخرى" /></div> : (
        <div className="flex flex-col gap-lg p-md">
          <Card className="p-md">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-headline-md text-headline-md">{orderQuery.data.restaurantName}</p><p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(orderQuery.data.createdAt)}</p></div>
              <Badge tone={orderStatusTones[orderQuery.data.status]}>{orderStatusLabels[orderQuery.data.status]}</Badge>
            </div>
          </Card>

          <section>
            <h2 className="mb-sm font-headline-md text-headline-md">محتويات الطلب</h2>
            <Card className="divide-y divide-outline-variant px-md">
              {orderQuery.data.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 py-3">
                  <div className="min-w-0"><p className="font-label-lg text-label-lg">{item.quantity.toLocaleString("ar-EG")} × {item.name}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{[item.variantName, ...item.addons.map((addon) => addon.name)].filter(Boolean).join(" · ") || "بدون إضافات"}</p></div>
                  <span className="shrink-0 font-label-lg text-label-lg">{EGP(item.lineTotal)}</span>
                </div>
              ))}
            </Card>
          </section>

          <section>
            <h2 className="mb-sm font-headline-md text-headline-md">حالة الطلب</h2>
            <Card className="p-md">
              {orderQuery.data.timeline.map((event, index) => (
                <div key={`${event.status}-${String(event.at)}`} className="flex gap-3">
                  <div className="flex flex-col items-center"><span className="flex size-7 items-center justify-center rounded-full bg-success/15 text-success"><Icon name="check" className="text-[16px]" /></span>{index < orderQuery.data.timeline.length - 1 ? <span className="h-8 w-0.5 bg-success/30" /> : null}</div>
                  <div><p className="font-label-lg text-label-lg">{event.label}</p><p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(event.at)}</p></div>
                </div>
              ))}
            </Card>
          </section>

          <Card className="space-y-2 p-md">
            <div className="flex justify-between text-on-surface-variant"><span>الإجمالي الفرعي</span><span>{EGP(orderQuery.data.subtotal)}</span></div>
            <div className="flex justify-between text-on-surface-variant"><span>رسوم التوصيل</span><span>{EGP(orderQuery.data.deliveryFee)}</span></div>
            <div className="flex justify-between border-t border-outline-variant pt-2 font-headline-md text-headline-md"><span>الإجمالي</span><span>{EGP(orderQuery.data.total)}</span></div>
          </Card>

          <Card className="space-y-3 p-md">
            <div className="flex gap-3"><Icon name="location_on" className="text-secondary" /><div><p className="font-label-lg text-label-lg">عنوان التوصيل</p><p className="font-body-md text-body-md text-on-surface-variant">{orderQuery.data.deliveryAddressText}</p></div></div>
            <div className="flex gap-3"><Icon name="payments" className="text-secondary" /><div><p className="font-label-lg text-label-lg">طريقة الدفع</p><p className="font-body-md text-body-md text-on-surface-variant">كاش عند الاستلام</p></div></div>
            {orderQuery.data.notes ? <div className="flex gap-3"><Icon name="notes" className="text-secondary" /><div><p className="font-label-lg text-label-lg">ملاحظات</p><p className="font-body-md text-body-md text-on-surface-variant">{orderQuery.data.notes}</p></div></div> : null}
          </Card>
        </div>
      )}
    </MobileShell>
  );
}