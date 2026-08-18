import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Badge, Button } from "@/components/tb/shell";
import { orderOf } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/order-placed")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تم الطلب" },
      { name: "description", content: "تم استلام طلبك بنجاح وجاري تجهيزه" },
      { property: "og:title", content: "طلبات بيتك | تم الطلب" },
      { property: "og:description", content: "تم استلام طلبك بنجاح وجاري تجهيزه" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppOrderPlaced,
});

function AppOrderPlaced() {
  const order = orderOf("12345");

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="تم الطلب" />
      <div className="tb-fade-up flex flex-col items-center gap-lg p-lg text-center">
        <div className="relative flex size-24 items-center justify-center">
          <span className="tb-ping absolute inset-0 rounded-full bg-success/20" />
          <span className="flex size-20 items-center justify-center rounded-full bg-success/15 text-success">
            <Icon name="check_circle" className="text-[48px]" filled />
          </span>
        </div>
        <div>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">تم إرسال طلبك بنجاح!</h1>
          <p className="mt-1 font-body-md text-body-md text-on-surface-variant">هيوصلك خلال 30-40 دقيقة تقريباً</p>
        </div>

        <Card className="w-full p-md text-right">
          <div className="flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">رقم الطلب</span>
            <span className="font-headline-md text-headline-md text-on-surface">{order["code"]}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-label-md text-label-md text-on-surface-variant">الوقت المتوقع</span>
            <Badge tone="info">
              <Icon name="schedule" className="text-[14px]" />
              30-40 دقيقة
            </Badge>
          </div>
        </Card>

        <div className="w-full">
          <p className="mb-2 text-right font-label-lg text-label-lg text-on-surface">طلباتك الفرعية</p>
          <div className="flex flex-wrap gap-2">
            {order["subOrders"].map((s) => (
              <Badge key={s["id"]} tone="neutral">
                {s["restaurantName"]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Link to="/app/track/$id" params={{ id: "12345" }}>
            <Button className="w-full" icon="location_on">
              تتبع الطلب
            </Button>
          </Link>
          <Link to="/app/orders">
            <Button variant="outline" className="w-full" icon="receipt_long">
              طلباتي
            </Button>
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
