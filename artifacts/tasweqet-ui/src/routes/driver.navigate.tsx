import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppBar, Badge, Button, Card, Icon, MapCanvas, MobileShell } from "@/components/tb/shell";
import { EGP } from "@/lib/tb/data";

export const Route = createFileRoute("/driver/navigate")({
  head: () => ({
    meta: [
      { title: "توصيلة نشطة | طلبات بيتك" },
      { name: "description", content: "تابع مراحل توصيل الطلب من الاستلام حتى التسليم للعميل." },
      { property: "og:title", content: "توصيلة نشطة | طلبات بيتك" },
      { property: "og:description", content: "تابع مراحل توصيل الطلب من الاستلام حتى التسليم للعميل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverNavigate,
});

const steps = [
  { key: "PICKUP", label: "الاستلام من المطعم", done: true },
  { key: "TO_CUSTOMER", label: "التوجه للعميل", done: true },
  { key: "DELIVER", label: "التسليم", done: false },
];

function DriverNavigate() {
  const [delivering, setDelivering] = useState(true);

  return (
    <MobileShell>
      <AppBar title="طلب #12345" subtitle="برجر هاوس — فرع المعادي" back="/driver" />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        <MapCanvas height="h-56">
          <span className="tb-pulse-ring absolute right-1/2 top-1/2 flex size-5 -translate-y-1/2 translate-x-1/2 items-center justify-center rounded-full bg-secondary text-on-secondary">
            <Icon name="two_wheeler" className="text-[14px]" />
          </span>
          <Icon name="location_on" className="absolute bottom-8 left-10 text-[28px] text-error" filled />
        </MapCanvas>

        <Card className="flex flex-col gap-3 p-md">
          {steps.map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <span
                className={`flex size-7 items-center justify-center rounded-full ${
                  s.done ? "bg-success/20 text-success" : "bg-primary-container text-on-primary-container"
                }`}
              >
                <Icon name={s.done ? "check" : "radio_button_checked"} className="text-[16px]" />
              </span>
              <span className={`font-label-lg text-label-lg ${s.done ? "text-on-surface-variant line-through" : "text-on-surface"}`}>
                {s.label}
              </span>
              {i < steps.length - 1 ? null : null}
            </div>
          ))}
        </Card>

        <Card className="p-md">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-label-lg text-label-lg text-on-surface">أحمد محمود</span>
            <span className="font-label-md text-label-md text-on-surface-variant" dir="ltr">
              010* *** 4567
            </span>
          </div>
          <p className="mb-2 flex items-start gap-1.5 font-body-md text-body-md text-on-surface-variant">
            <Icon name="place" className="mt-0.5 text-[16px]" />
            ٧ شارع ٩، المعادي، الدور ٣، شقة ٦
          </p>
          <p className="mb-3 flex items-start gap-1.5 font-label-md text-label-md text-on-surface-variant">
            <Icon name="sticky_note_2" className="mt-0.5 text-[16px]" />
            اتصل قبل ما تطلع فوق
          </p>
          <div className="grid grid-cols-2 gap-sm">
            <Button variant="outline" icon="call" className="w-full">اتصال</Button>
            <Button variant="outline" icon="chat" className="w-full">واتساب</Button>
          </div>
        </Card>

        <Card className="p-md">
          <p className="mb-2 font-label-lg text-label-lg text-on-surface">ملخص الطلب</p>
          <ul className="flex flex-col gap-1 font-body-md text-body-md text-on-surface-variant">
            <li>2× برجر كلاسيك دوبل</li>
            <li>1× تشيكن كرانشي</li>
          </ul>
        </Card>

        <Badge tone="warn" className="w-fit">
          <Icon name="payments" className="text-[14px]" />
          كاش: حصّل {EGP(623)}
        </Badge>

        {delivering ? (
          <Button className="w-full" icon="task_alt" onClick={() => setDelivering(false)}>
            تم الاستلام والتوجه للعميل
          </Button>
        ) : (
          <Link to="/driver/delivered">
            <Button className="w-full" icon="done_all">تم التوصيل</Button>
          </Link>
        )}
      </div>
    </MobileShell>
  );
}
