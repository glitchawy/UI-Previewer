import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Badge, Button, Card, Icon, MobileShell } from "@/components/tb/shell";
import { EGP, driverWallet } from "@/lib/tb/data";
import { driverTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/driver/wallet")({
  head: () => ({
    meta: [
      { title: "المحفظة | طلبات بيتك" },
      { name: "description", content: "راجع رصيدك وأرباحك وحركاتك المالية كمندوب توصيل." },
      { property: "og:title", content: "المحفظة | طلبات بيتك" },
      { property: "og:description", content: "راجع رصيدك وأرباحك وحركاتك المالية كمندوب توصيل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DriverWallet,
});

function DriverWallet() {
  const [sheet, setSheet] = useState<"form" | "done" | null>(null);

  return (
    <MobileShell tabs={driverTabs}>
      <AppBar title="المحفظة" />
      <div className="tb-fade-up flex flex-col gap-md p-md">
        <Card className="bg-primary-container p-lg text-on-primary-container">
          <p className="font-label-md text-label-md opacity-80">الرصيد الحالي</p>
          <p className="font-headline-lg text-headline-lg">{EGP(driverWallet["balance"])}</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="font-label-md text-label-md">اليوم: {EGP(driverWallet["today"])}</span>
            <span className="font-label-md text-label-md">الأسبوع: {EGP(driverWallet["week"])}</span>
          </div>
        </Card>

        <Card className="flex items-center justify-between p-md">
          <span className="flex items-center gap-2 font-label-lg text-label-lg text-on-surface">
            <Icon name="percent" className="text-[18px] text-on-surface-variant" />
            نسبة عمولة المندوب
          </span>
          <Badge tone="info">{driverWallet["commissionRate"]}%</Badge>
        </Card>

        <Button className="w-full" icon="account_balance" onClick={() => setSheet("form")}>
          طلب تحويل
        </Button>

        <div>
          <p className="mb-sm font-headline-md text-headline-md text-on-surface">الحركات المالية</p>
          <div className="tb-stagger flex flex-col gap-2">
            {driverWallet["transactions"].map((t) => (
              <Card key={t["id"]} className="flex items-center justify-between p-md">
                <div className="flex items-center gap-2">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full ${
                      t["type"] === "credit" ? "bg-success/15 text-success" : "bg-error-container text-on-error-container"
                    }`}
                  >
                    <Icon name={t["type"] === "credit" ? "call_received" : "call_made"} className="text-[18px]" />
                  </span>
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">{t["title"]}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">
                      {t["ref"]} · {t["at"]}
                    </p>
                  </div>
                </div>
                <span
                  className={`font-label-lg text-label-lg ${t["type"] === "credit" ? "text-success" : "text-on-error-container"}`}
                >
                  {t["type"] === "credit" ? "+" : "-"}
                  {EGP(t["amount"])}
                </span>
              </Card>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-2 rounded-card bg-surface-container-low p-md">
          <Icon name="info" className="mt-0.5 text-[18px] text-on-surface-variant" />
          <p className="font-label-md text-label-md text-on-surface-variant">كل تغيير في الرصيد له حركة مالية موضحة بالتفصيل</p>
        </div>
      </div>

      {sheet ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" onClick={() => setSheet(null)}>
          <div
            className="tb-fade-up w-full max-w-[480px] rounded-t-[24px] bg-surface-container-lowest p-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-md h-1 w-10 rounded-full bg-outline-variant" />
            {sheet === "form" ? (
              <div className="flex flex-col gap-md">
                <p className="font-headline-md text-headline-md text-on-surface">طلب تحويل الرصيد</p>
                <div className="flex flex-col gap-1">
                  <label className="font-label-md text-label-md text-on-surface-variant">المبلغ (ج.م)</label>
                  <input
                    defaultValue={driverWallet["balance"]}
                    className="rounded-button border-2 border-outline-variant bg-surface-container-lowest px-3 py-2.5 font-label-lg text-label-lg text-on-surface outline-none focus:border-secondary"
                  />
                </div>
                <div className="flex items-center justify-between rounded-card bg-surface-container-low p-md">
                  <span className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant">
                    <Icon name="account_balance" className="text-[18px]" />
                    محفظة فودافون كاش
                  </span>
                  <span className="font-label-md text-label-md text-on-surface-variant" dir="ltr">
                    010•••4567
                  </span>
                </div>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  التحويل بيتم خلال 24 ساعة عمل بعد موافقة الإدارة
                </p>
                <Button className="w-full" icon="send" onClick={() => setSheet("done")}>
                  تأكيد الطلب
                </Button>
                <Button variant="ghost" className="w-full" onClick={() => setSheet(null)}>
                  إلغاء
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-md py-md text-center">
                <span className="tb-grow flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
                  <Icon name="check_circle" className="text-[28px]" />
                </span>
                <p className="font-headline-md text-headline-md text-on-surface">تم إرسال الطلب</p>
                <p className="font-label-md text-label-md text-on-surface-variant">
                  هتوصلك رسالة على واتساب أول ما التحويل يتم
                </p>
                <Button className="w-full" onClick={() => setSheet(null)}>
                  تم
                </Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </MobileShell>
  );
}
