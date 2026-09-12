import { Badge, Card, Icon } from "@/components/tb/shell";
import type { RefundCompensation } from "@workspace/api-client-react";
import { adminCurrency } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";
import { compensationTypeLabel, responsiblePartyLabel } from "./compensation-choice";

export type CustomerRefundCompensation = RefundCompensation;

export function CustomerCompensationSummary({
  compensation,
  orderTotal,
  status,
}: {
  compensation: CustomerRefundCompensation | null | undefined;
  orderTotal?: number;
  status?: string | null;
}) {
  const { t, locale } = useTranslation();
  if (!compensation) return null;
  const rejected = status === "rejected";
  const amountLabel = adminCurrency(rejected ? 0 : compensation.amount, locale);

  return (
    <Card className={`space-y-3 p-md ${rejected ? "border-error/30 bg-error-container/40" : "border-success/30 bg-success/10"}`} data-testid="customer-refund-compensation">
      <div className="flex items-start gap-3">
        <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${rejected ? "bg-error/15 text-error" : "bg-success/15 text-success"}`}><Icon name={rejected ? "cancel" : "account_balance_wallet"} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-headline-md text-headline-md">{rejected ? t("نتيجة مراجعة الاسترداد", "Refund review outcome") : t("التعويض المعتمد", "Approved compensation")}</p>
          <p className="font-label-md text-label-md text-on-surface-variant">
            {rejected
              ? t("لم تتم إضافة مبلغ إلى محفظتك لأن الطلب مرفوض.", "No amount was added to your wallet because the request was rejected.")
              : t("هذا هو المبلغ الذي أُضيف فعلياً لمحفظتك بعد المراجعة.", "This is the amount actually added to your wallet after review.")}
          </p>
        </div>
        <Badge tone={rejected ? "danger" : "success"}>{amountLabel}</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 rounded-button bg-surface-container-lowest/70 p-3 text-label-md">
        <span className="text-on-surface-variant">{t("نوع التعويض", "Compensation type")}</span>
        <strong>{rejected ? t("لا يوجد تعويض", "No compensation") : compensationTypeLabel(compensation.type, t)}</strong>
        <span className="text-on-surface-variant">{t("الجهة المسؤولة", "Responsible party")}</span>
        <strong>{responsiblePartyLabel(compensation.responsibleParty, t)}</strong>
        {orderTotal !== undefined ? (
          <>
            <span className="text-on-surface-variant">{t("إجمالي الطلب", "Order total")}</span>
            <strong>{adminCurrency(orderTotal, locale)}</strong>
          </>
        ) : null}
      </div>
      {compensation.items?.length ? (
        <div className="rounded-button bg-surface-container-lowest/70 p-3">
          <p className="font-label-md text-label-md text-on-surface-variant">{t("الأصناف المعوضة", "Compensated items")}</p>
          <ul className="mt-1 space-y-1 font-label-md text-label-md">
            {compensation.items.map((item, index) => (
              <li key={`${item.orderItemId ?? item.productName ?? "item"}-${index}`} className="flex justify-between gap-2">
                <span>{item.productName || t(`الصنف ${item.orderItemId}`, `Item ${item.orderItemId}`)}{item.variantName ? ` · ${item.variantName}` : ""} · {t("الكمية", "Qty")} {item.quantity}</span>
                <strong>{adminCurrency(item.amount, locale)}</strong>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {compensation.note ? <p className="whitespace-pre-wrap break-words rounded-button bg-surface-container-lowest/70 p-3 font-label-md text-label-md">{compensation.note}</p> : null}
    </Card>
  );
}