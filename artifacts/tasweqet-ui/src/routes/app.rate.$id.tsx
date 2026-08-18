import { createFileRoute } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Button } from "@/components/tb/shell";
import { orderOf } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/rate/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | تقييم الطلب" },
      { name: "description", content: "قيّم المطعم والأكل والمندوب والطلب ككل" },
      { property: "og:title", content: "طلبات بيتك | تقييم الطلب" },
      { property: "og:description", content: "قيّم المطعم والأكل والمندوب والطلب ككل" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppRateId,
});

function Stars() {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <button key={i} type="button" className="text-primary transition active:scale-90">
          <Icon name="star" className="text-[26px]" filled={i < 4} />
        </button>
      ))}
    </div>
  );
}

function RateBlock({ title, hint }: { title: string; hint: string }) {
  return (
    <Card className="p-md">
      <div className="flex items-center justify-between">
        <p className="font-label-lg text-label-lg text-on-surface">{title}</p>
        <Stars />
      </div>
      <p className="mt-1 font-label-md text-label-md text-on-surface-variant">{hint}</p>
      <textarea
        rows={2}
        placeholder="اكتب تعليقك..."
        className="mt-2 w-full rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2 font-body-md text-body-md text-on-surface outline-none placeholder:text-outline focus:border-secondary"
      />
    </Card>
  );
}

function AppRateId() {
  const { id } = Route.useParams();
  const order = orderOf(id);

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title={`تقييم الطلب ${order["code"]}`} back="/app/orders" />
      <div className="flex flex-col gap-md p-md">
        <RateBlock title="تقييم المطعم" hint={order["subOrders"][0]?.["restaurantName"] ?? "المطعم"} />
        <RateBlock title="تقييم الأكل" hint="كل صنف بجودته" />
        <RateBlock title="تقييم المندوب" hint={order["subOrders"][0]?.["driver"] ?? "المندوب"} />
        <RateBlock title="تقييم الطلب ككل" hint="تجربتك العامة مع الطلب" />
        <Button className="w-full" icon="send">
          إرسال التقييم
        </Button>
      </div>
    </MobileShell>
  );
}
