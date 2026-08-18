import { createFileRoute, Link } from "@tanstack/react-router";
import { AppBar, Button, Card, Icon, MobileShell } from "@/components/tb/shell";
import { EGP, driverWallet } from "@/lib/tb/data";

export const Route = createFileRoute("/driver/delivered")({
  head: () => ({
    meta: [
      { title: "تم التوصيل | طلبات بيتك" },
      { name: "description", content: "تهانينا، تم توصيل الطلب بنجاح وإضافة أرباحك." },
      { property: "og:title", content: "تم التوصيل | طلبات بيتك" },
      { property: "og:description", content: "تهانينا، تم توصيل الطلب بنجاح وإضافة أرباحك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverDelivered,
});

const fee = 20;
const rate = driverWallet["commissionRate"];
const net = Math.round((fee * rate) / 100);

function DriverDelivered() {
  return (
    <MobileShell>
      <AppBar title="تم التوصيل" back="/driver" />
      <div className="tb-fade-up flex flex-col items-center gap-md p-md">
        <div className="relative flex size-20 items-center justify-center rounded-full bg-success/15">
          <span className="tb-pulse-ring absolute inset-0 rounded-full border-2 border-success" />
          <Icon name="check_circle" className="text-[42px] text-success" filled />
        </div>
        <p className="font-headline-lg text-headline-lg text-on-surface">تم توصيل الطلب بنجاح</p>

        <Card className="w-full p-md">
          <div className="flex items-center justify-between border-b border-outline-variant py-2">
            <span className="font-body-md text-body-md text-on-surface-variant">رسوم التوصيل</span>
            <span className="font-body-md text-body-md text-on-surface">{EGP(fee)}</span>
          </div>
          <div className="flex items-center justify-between border-b border-outline-variant py-2">
            <span className="font-body-md text-body-md text-on-surface-variant">نسبة المندوب ({rate}%)</span>
            <span className="font-body-md text-body-md text-on-surface">{EGP(net)}</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="font-label-lg text-label-lg text-on-surface">صافي أرباحك</span>
            <span className="font-headline-md text-headline-md text-success">{EGP(net)}</span>
          </div>
        </Card>

        <div className="flex w-full items-center gap-2 rounded-card bg-primary-container/40 p-md">
          <Icon name="payments" className="text-[18px] text-on-primary-container" />
          <p className="font-label-md text-label-md text-on-primary-container">تم تحصيل {EGP(623)} كاش من العميل</p>
        </div>

        <div className="flex w-full items-center gap-2 rounded-card bg-surface-container-low p-md">
          <Icon name="star" className="text-[18px] text-on-surface-variant" />
          <p className="font-label-md text-label-md text-on-surface-variant">هيتم إرسال طلب تقييم للعميل عن التوصيلة</p>
        </div>

        <div className="grid w-full grid-cols-2 gap-sm">
          <Link to="/driver/wallet">
            <Button variant="outline" className="w-full" icon="account_balance_wallet">المحفظة</Button>
          </Link>
          <Link to="/driver">
            <Button className="w-full" icon="two_wheeler">استلام طلب جديد</Button>
          </Link>
        </div>
      </div>
    </MobileShell>
  );
}
