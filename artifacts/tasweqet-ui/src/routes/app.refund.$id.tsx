import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getGetCustomerOrderQueryKey,
  useCreateCustomerRefundRequest,
  useGetCustomerOrder,
} from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Button, Badge, EmptyState } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import { EGP, formatOrderDate } from "@/lib/tb/orders";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/app/refund/$id")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | طلب استرداد", "Talabat Betak | Request a refund") },
      { name: "description", content: translate("قدّم طلب استرداد مبلغ عن طلب سابق", "Request a refund for a previous order") },
    ],
  }),
  component: AppRefundId,
});

const reasons = [["صنف ناقص", "Missing item"], ["الطلب وصل بارد أو تالف", "Order arrived cold or damaged"], ["الطلب مختلف عن المطلوب", "Order differs from what was requested"], ["تأخر كبير في التوصيل", "Significant delivery delay"], ["سبب آخر", "Other reason"]] as const;
type RefundReason = (typeof reasons)[number][0];

function errorMessage(error: unknown) {
  return (error as { data?: { error?: string } } | null)?.data?.error || translate("تعذر إرسال طلب الاسترداد", "Unable to submit the refund request");
}

function AppRefundId() {
  const { t } = useTranslation();
  const { id: rawId } = Route.useParams();
  const id = Number(rawId);
  const [reason, setReason] = useState<RefundReason>(reasons[0]![0]);
  const [otherReason, setOtherReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const order = useGetCustomerOrder(id, {
    query: { enabled: Number.isInteger(id) && id > 0, queryKey: getGetCustomerOrderQueryKey(id) },
  });
  const refund = useCreateCustomerRefundRequest({
    mutation: { onSuccess: () => { setSubmitted(true); order.refetch(); } },
  });
  const finalReason = reason === reasons[4]![0] ? otherReason.trim() : reason;

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("طلب استرداد", "Request a refund")} back={`/app/orders/${rawId}`} />
      {order.isLoading ? (
        <div className="flex h-64 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[36px] text-primary" /></div>
      ) : !order.data ? (
         <div className="p-md"><EmptyState icon="error" title={t("الطلب غير موجود", "Order not found")} body={t("ارجع لطلباتك وحاول مرة أخرى", "Go back to your orders and try again")} /></div>
      ) : submitted || order.data.refundRequestStatus ? (
        <div className="flex flex-col gap-md p-md">
          <Card className="flex flex-col items-center gap-3 bg-success/10 p-lg text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success text-white"><Icon name="check" className="text-[28px]" /></span>
             <p className="font-headline-md text-headline-md">{t("تم إرسال طلب الاسترداد", "Refund request submitted")}</p>
             <p className="font-body-md text-body-md text-on-surface-variant">{t("فريق الإدارة هيراجع الطلب، وعند الموافقة المبلغ هينزل في محفظتك.", "The team will review your request, and approved funds will be added to your wallet.")}</p>
             <Badge tone="warn">{t("بانتظار مراجعة الإدارة", "Awaiting review")}</Badge>
          </Card>
           <Link to="/app/wallet"><Button className="w-full" icon="account_balance_wallet">{t("فتح المحفظة", "Open wallet")}</Button></Link>
        </div>
      ) : !order.data.canRequestRefund ? (
         <div className="p-md"><EmptyState icon="policy" title={t("الطلب غير متاح للاسترداد حالياً", "Order is not currently eligible for a refund")} body={t("طلب الاسترداد متاح بعد اكتمال التوصيل فقط", "Refund requests are available after delivery is complete")} /></div>
      ) : (
        <div className="flex flex-col gap-lg p-md">
          <Card className="p-md">
            <div className="flex items-center justify-between">
              <div><p className="font-headline-md text-headline-md">{order.data.code}</p><p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(order.data.createdAt)}</p></div>
              <span className="font-label-lg text-label-lg">{EGP(order.data.total)}</span>
            </div>
          </Card>

          <section>
             <h2 className="mb-sm font-headline-md text-headline-md">{t("سبب الاسترداد", "Refund reason")}</h2>
            <div className="flex flex-col gap-2">
               {reasons.map((item) => (
                 <label key={item[0]} className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container">
                   <input type="radio" name="refund-reason" checked={reason === item[0]} onChange={() => setReason(item[0])} className="accent-secondary" />
                   <span className="font-body-md text-body-md">{t(item[0], item[1])}</span>
                </label>
              ))}
            </div>
             {reason === reasons[4]![0] ? (
               <textarea value={otherReason} onChange={(event) => setOtherReason(event.target.value)} maxLength={1000} placeholder={t("اكتب تفاصيل السبب", "Describe the reason")}
                className="mt-2 min-h-24 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-secondary" />
            ) : null}
          </section>

          <Card className="space-y-2 p-md">
             <div className="flex justify-between"><span className="text-on-surface-variant">{t("المبلغ المطلوب", "Requested amount")}</span><strong>{EGP(order.data.total)}</strong></div>
             <div className="flex justify-between"><span className="text-on-surface-variant">{t("طريقة الاسترداد", "Refund method")}</span><Badge tone="info">{t("محفظة طلبات بيتك", "Talabat Betak wallet")}</Badge></div>
          </Card>

          <Card className="flex items-center gap-2 bg-secondary-container p-3 text-on-secondary-container">
            <Icon name="info" className="text-[18px]" />
             <span className="font-label-md text-label-md">{t("الطلب هيتراجع من فريق الإدارة قبل إضافة المبلغ للمحفظة", "The team will review the request before adding funds to your wallet")}</span>
          </Card>

          {refund.isError ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error">{errorMessage(refund.error)}</p> : null}
          <Button className="w-full" icon="send" disabled={refund.isPending || finalReason.length < 3}
            onClick={() => refund.mutate({ id, data: { reason: finalReason } })}>
             {refund.isPending ? t("جاري الإرسال…", "Submitting…") : t("إرسال طلب الاسترداد", "Submit refund request")}
          </Button>
        </div>
      )}
    </MobileShell>
  );
}