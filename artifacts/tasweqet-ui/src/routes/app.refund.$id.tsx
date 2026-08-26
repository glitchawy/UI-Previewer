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

export const Route = createFileRoute("/app/refund/$id")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | طلب استرداد" },
      { name: "description", content: "قدّم طلب استرداد مبلغ عن طلب سابق" },
    ],
  }),
  component: AppRefundId,
});

const reasons = ["صنف ناقص", "الطلب وصل بارد أو تالف", "الطلب مختلف عن المطلوب", "تأخر كبير في التوصيل", "سبب آخر"];

function errorMessage(error: unknown) {
  return (error as { data?: { error?: string } } | null)?.data?.error || "تعذر إرسال طلب الاسترداد";
}

function AppRefundId() {
  const { id: rawId } = Route.useParams();
  const id = Number(rawId);
  const [reason, setReason] = useState(reasons[0]!);
  const [otherReason, setOtherReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const order = useGetCustomerOrder(id, {
    query: { enabled: Number.isInteger(id) && id > 0, queryKey: getGetCustomerOrderQueryKey(id) },
  });
  const refund = useCreateCustomerRefundRequest({
    mutation: { onSuccess: () => { setSubmitted(true); order.refetch(); } },
  });
  const finalReason = reason === "سبب آخر" ? otherReason.trim() : reason;

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="طلب استرداد" back={`/app/orders/${rawId}`} />
      {order.isLoading ? (
        <div className="flex h-64 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[36px] text-primary" /></div>
      ) : !order.data ? (
        <div className="p-md"><EmptyState icon="error" title="الطلب غير موجود" body="ارجع لطلباتك وحاول مرة أخرى" /></div>
      ) : submitted || order.data.refundRequestStatus ? (
        <div className="flex flex-col gap-md p-md">
          <Card className="flex flex-col items-center gap-3 bg-success/10 p-lg text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success text-white"><Icon name="check" className="text-[28px]" /></span>
            <p className="font-headline-md text-headline-md">تم إرسال طلب الاسترداد</p>
            <p className="font-body-md text-body-md text-on-surface-variant">فريق الإدارة هيراجع الطلب، وعند الموافقة المبلغ هينزل في محفظتك.</p>
            <Badge tone="warn">بانتظار مراجعة الإدارة</Badge>
          </Card>
          <Link to="/app/wallet"><Button className="w-full" icon="account_balance_wallet">فتح المحفظة</Button></Link>
        </div>
      ) : !order.data.canRequestRefund ? (
        <div className="p-md"><EmptyState icon="policy" title="الطلب غير متاح للاسترداد حالياً" body="طلب الاسترداد متاح بعد اكتمال التوصيل فقط" /></div>
      ) : (
        <div className="flex flex-col gap-lg p-md">
          <Card className="p-md">
            <div className="flex items-center justify-between">
              <div><p className="font-headline-md text-headline-md">{order.data.code}</p><p className="font-label-md text-label-md text-on-surface-variant">{formatOrderDate(order.data.createdAt)}</p></div>
              <span className="font-label-lg text-label-lg">{EGP(order.data.total)}</span>
            </div>
          </Card>

          <section>
            <h2 className="mb-sm font-headline-md text-headline-md">سبب الاسترداد</h2>
            <div className="flex flex-col gap-2">
              {reasons.map((item) => (
                <label key={item} className="flex items-center gap-2 rounded-button border border-outline-variant bg-surface-container-lowest px-3 py-2.5 has-[:checked]:border-secondary has-[:checked]:bg-secondary-container">
                  <input type="radio" name="refund-reason" checked={reason === item} onChange={() => setReason(item)} className="accent-secondary" />
                  <span className="font-body-md text-body-md">{item}</span>
                </label>
              ))}
            </div>
            {reason === "سبب آخر" ? (
              <textarea value={otherReason} onChange={(event) => setOtherReason(event.target.value)} maxLength={1000} placeholder="اكتب تفاصيل السبب"
                className="mt-2 min-h-24 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-secondary" />
            ) : null}
          </section>

          <Card className="space-y-2 p-md">
            <div className="flex justify-between"><span className="text-on-surface-variant">المبلغ المطلوب</span><strong>{EGP(order.data.total)}</strong></div>
            <div className="flex justify-between"><span className="text-on-surface-variant">طريقة الاسترداد</span><Badge tone="info">محفظة طلبات بيتك</Badge></div>
          </Card>

          <Card className="flex items-center gap-2 bg-secondary-container p-3 text-on-secondary-container">
            <Icon name="info" className="text-[18px]" />
            <span className="font-label-md text-label-md">الطلب هيتراجع من فريق الإدارة قبل إضافة المبلغ للمحفظة</span>
          </Card>

          {refund.isError ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error">{errorMessage(refund.error)}</p> : null}
          <Button className="w-full" icon="send" disabled={refund.isPending || finalReason.length < 3}
            onClick={() => refund.mutate({ id, data: { reason: finalReason } })}>
            {refund.isPending ? "جاري الإرسال…" : "إرسال طلب الاسترداد"}
          </Button>
        </div>
      )}
    </MobileShell>
  );
}