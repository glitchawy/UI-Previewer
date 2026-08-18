import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, Button, Card, Icon, MapCanvas, MobileShell } from "@/components/tb/shell";
import { EGP, driverWallet } from "@/lib/tb/data";

export const Route = createFileRoute("/driver/offer")({
  head: () => ({
    meta: [
      { title: "عرض توصيل جديد | طلبات بيتك" },
      { name: "description", content: "راجع تفاصيل عرض التوصيل الجديد وقرر القبول أو الرفض." },
      { property: "og:title", content: "عرض توصيل جديد | طلبات بيتك" },
      { property: "og:description", content: "راجع تفاصيل عرض التوصيل الجديد وقرر القبول أو الرفض." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverOffer,
});

const fee = 20;
const earnings = Math.round((fee * driverWallet["commissionRate"]) / 100);

function DriverOffer() {
  return (
    <MobileShell>
      <AppBar title="عرض توصيل جديد" back="/driver" />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        <div className="flex flex-col items-center gap-2 py-sm">
          <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-primary-container">
            <span className="font-headline-lg text-headline-lg text-on-surface">18</span>
            <span className="absolute -bottom-1 rounded-full bg-surface-container-lowest px-2 font-label-md text-[10px] text-on-surface-variant">
              ثانية
            </span>
          </div>
          <p className="font-label-md text-label-md text-on-surface-variant">هيتم تحويل العرض لو ماردتش</p>
        </div>

        <MapCanvas height="h-48">
          <Icon name="storefront" className="absolute right-10 top-10 text-[26px] text-primary" filled />
          <Icon name="location_on" className="absolute bottom-10 left-12 text-[30px] text-error" filled />
        </MapCanvas>

        <Card className="flex flex-col gap-3 p-md">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
              <Icon name="storefront" className="text-[18px] text-on-surface-variant" />
              برجر هاوس — فرع المعادي
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">1.2 كم</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
              <Icon name="location_on" className="text-[18px] text-on-surface-variant" />
              التسليم في المعادي
            </span>
            <span className="font-label-md text-label-md text-on-surface-variant">3.4 كم</span>
          </div>
        </Card>

        <Card className="grid grid-cols-3 divide-x divide-x-reverse divide-outline-variant p-md text-center">
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{EGP(623)}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">قيمة الطلب</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-on-surface">{EGP(fee)}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">رسوم التوصيل</p>
          </div>
          <div>
            <p className="font-headline-md text-headline-md text-success">{EGP(earnings)}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">أرباحك</p>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-sm">
          <Link to="/driver">
            <Button variant="danger" className="w-full" icon="close">رفض</Button>
          </Link>
          <Link to="/driver/navigate">
            <Button className="w-full" icon="check">قبول</Button>
          </Link>
        </div>

        <p className="text-center font-label-md text-label-md text-on-surface-variant">
          لو رفضت، العرض هيروح لأقرب مندوب تاني
        </p>
      </div>
    </MobileShell>
  );
}
