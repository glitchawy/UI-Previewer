import { createFileRoute } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Button, Badge } from "@/components/tb/shell";
import { orderOf, EGP } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/refund/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | طلب استرداد" },
      { name: "description", content: "قدّم طلب استرداد مبلغ عن طلب سابق" },
      { property: "og:title", content: "طلبات بيتك | طلب استرداد" },
      { property: "og:description", content: "قدّم طلب استرداد مبلغ عن طلب سابق" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppRefundId,
});

const reasons = ["الطلب اتلغى بعد الدفع", "صنف ناقص", "طلب وصل بارد أو تالف", "تأخر كبير في التوصيل", "سبب آخر"];

function AppRefundId() {
  const { id } = Route.useParams();
  const order = orderOf(id);

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="طلب استرداد" back="/app/orders" />
      <div className="flex flex-col gap-lg p-md">
        <Card className="p-md">
          <div className="flex items-center justify-between">
            <p className="font-headline-md text-headline-md text-on-surface">{order["code"]}</p>
            <span className="font-label-lg text-label-lg text-on-surface">{EGP(order["total"])}</span>
          </div>
          <p className="mt-1 font-label-md text-label-md text-on-surface-variant">{order["placedAt"]}</p>
        </Card>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">سبب الاسترداد</h2>
          <div className="flex flex-col gap-2">
            {reasons.map((r, i) => (
              <label key={r} className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container">
                <input type="radio" name="refund-reason" defaultChecked={i === 0} className="accent-secondary" />
                <span className="font-body-md text-body-md text-on-surface">{r}</span>
              </label>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">المبلغ المطلوب استرداده</h2>
          <div className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5">
            <Icon name="payments" className="text-outline" />
            <input
              type="text"
              defaultValue={String(order["total"])}
              className="w-full bg-transparent font-body-md text-body-md text-on-surface outline-none"
            />
            <span className="font-label-md text-label-md text-on-surface-variant">ج.م</span>
          </div>
        </section>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">طريقة الاسترداد</h2>
          <div className="flex gap-2">
            {["المحفظة", "البطاقة"].map((m, i) => (
              <label key={m} className="flex flex-1 items-center justify-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container">
                <input type="radio" name="refund-method" defaultChecked={i === 0} className="accent-secondary" />
                <span className="font-body-md text-body-md text-on-surface">{m}</span>
              </label>
            ))}
          </div>
        </section>

        <Card className="flex items-center gap-2 bg-secondary-container p-3 text-on-secondary-container">
          <Icon name="info" className="text-[18px]" />
          <span className="font-label-md text-label-md">الطلب هيتراجع من فريق الإدارة قبل التنفيذ</span>
        </Card>

        <section>
          <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">حالة الطلب</h2>
          <div className="flex items-center justify-between">
            {["الطلب", "مراجعة الإدارة", "الموافقة", "تنفيذ الاسترداد"].map((s, i) => (
              <div key={s} className="flex flex-1 flex-col items-center gap-1 text-center">
                <span className={`flex size-7 items-center justify-center rounded-full ${i === 0 ? "bg-primary-container text-on-primary-container" : "bg-surface-container-low text-outline"}`}>
                  <Icon name={i === 0 ? "check" : "circle"} className="text-[14px]" />
                </span>
                <span className="font-label-md text-[10px] text-on-surface-variant">{s}</span>
              </div>
            ))}
          </div>
        </section>

        <Button className="w-full" icon="send">
          إرسال طلب الاسترداد
        </Button>
      </div>
    </MobileShell>
  );
}
