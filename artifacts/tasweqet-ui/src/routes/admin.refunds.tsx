import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  getListAdminPaymentRefundsQueryKey,
  getListAdminRefundsQueryKey,
  useApproveAdminRefund,
  useListAdminPaymentRefunds,
  useListAdminRefunds,
  useRejectAdminRefund,
  useResolveAdminPaymentRefund,
} from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Button, Badge, EmptyState } from "@/components/tb/shell";
import { adminCurrency, adminDateTime } from "@/lib/admin-i18n";
import { translate, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/admin/refunds")({
  head: () => ({
    meta: [
      { title: translate("طلبات بيتك | مراجعة الاستردادات", "Talabat Betak | Refund review") },
      { name: "description", content: translate("مراجعة واعتماد طلبات استرداد العملاء وتسوية استردادات Paymob", "Review and approve customer refunds and reconcile Paymob refunds") },
    ],
  }),
  component: AdminRefunds,
});

function errorMessage(error: unknown, fallback: string) {
  return (error as { data?: { error?: string } } | null)?.data?.error || fallback;
}

function AdminRefunds() {
  const { t, locale } = useTranslation();
  const statusLabel = (status: string) => ({
    pending: t("قيد المراجعة", "Pending review"),
    processing: t("جاري التنفيذ", "Processing"),
    approved: t("تمت الموافقة", "Approved"),
    rejected: t("مرفوض", "Rejected"),
    failed: t("تعذر التنفيذ", "Failed"),
  }[status] ?? status);
  const queryClient = useQueryClient();
  const refunds = useListAdminRefunds();
  const paymentRefunds = useListAdminPaymentRefunds();
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [claimNotes, setClaimNotes] = useState<Record<number, string>>({});

  const refreshRefunds = () => queryClient.invalidateQueries({ queryKey: getListAdminRefundsQueryKey() });
  const refreshClaims = () => queryClient.invalidateQueries({ queryKey: getListAdminPaymentRefundsQueryKey() });
  const approve = useApproveAdminRefund({ mutation: { onSuccess: refreshRefunds } });
  const reject = useRejectAdminRefund({ mutation: { onSuccess: refreshRefunds } });
  const resolve = useResolveAdminPaymentRefund({ mutation: { onSuccess: refreshClaims } });
  const isLoading = refunds.isLoading || paymentRefunds.isLoading;

  return (
    <MobileShell>
      <AppBar title={t("طلبات الاسترداد", "Refund requests")} subtitle={t("مراجعة مالية", "Financial review")} back="/admin" right={<Icon name="account_balance_wallet" className="text-secondary" />} />
      <div className="flex flex-col gap-xl p-md">
        <section>
          <div className="mb-sm flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md">{t("طلبات العملاء", "Customer requests")}</h2>
              <p className="font-label-md text-label-md text-on-surface-variant">{t("الموافقة تضيف المبلغ للمحفظة مرة واحدة", "Approval adds the amount to the wallet once")}</p>
            </div>
            <Badge tone="warn">{(refunds.data?.filter((item) => item.status === "pending").length ?? 0).toLocaleString(locale === "ar" ? "ar-EG" : "en-EG")} {t("معلّق", "pending")}</Badge>
          </div>

          {refunds.isLoading ? (
            <div className="flex h-44 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[34px] text-primary" /></div>
          ) : refunds.isError ? (
            <EmptyState icon="error" title={t("تعذر تحميل الطلبات", "Unable to load requests")} body={t("حاول مرة أخرى بعد قليل", "Try again shortly")} />
          ) : refunds.data?.length === 0 ? (
             <EmptyState icon="task_alt" title={t("لا توجد طلبات استرداد", "No refund requests")} body={t("ستظهر طلبات العملاء الجديدة هنا", "New customer requests will appear here")} />
          ) : (
            <div className="flex flex-col gap-3">
              {refunds.data?.map((refund) => {
                const pending = refund.status === "pending";
                const note = notes[refund.id] ?? "";
                return (
                  <Card key={refund.id} className="space-y-3 p-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-headline-md text-headline-md">{refund.orderCode}</p>
                        <p className="font-label-md text-label-md text-on-surface-variant">{refund.restaurantName} · {adminDateTime(refund.createdAt, locale)}</p>
                      </div>
                       <Badge tone={refund.status === "approved" ? "success" : refund.status === "rejected" || refund.status === "failed" ? "danger" : "warn"}>{statusLabel(refund.status)}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-card bg-surface-container p-3 text-label-md">
                       <span className="text-on-surface-variant">{t("العميل", "Customer")}</span><strong>{refund.customerName || refund.customerPhone}</strong>
                       <span className="text-on-surface-variant">{t("المبلغ", "Amount")}</span><strong>{adminCurrency(refund.amount, locale)}</strong>
                       <span className="text-on-surface-variant">{t("السبب", "Reason")}</span><strong>{refund.reason}</strong>
                    </div>
                     {refund.resolutionNote ? <p className="rounded-button bg-surface-container p-2 text-label-md text-on-surface-variant">{t("ملاحظة الإدارة: ", "Admin note: ")}{refund.resolutionNote}</p> : null}
                    {pending ? (
                      <>
                        <textarea value={note} onChange={(event) => setNotes((current) => ({ ...current, [refund.id]: event.target.value }))}
                           maxLength={1000} aria-label={t("ملاحظة القرار", "Decision note")} placeholder={t("ملاحظة القرار (مطلوبة عند الرفض)", "Decision note (required when rejecting)")}
                          className="min-h-20 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-primary" />
                        <div className="grid grid-cols-2 gap-2">
                          <Button icon="check" disabled={approve.isPending || reject.isPending}
                            onClick={() => approve.mutate({ id: refund.id, data: note.trim() ? { note: note.trim() } : {} })}>
                             {t("موافقة", "Approve")}
                          </Button>
                          <Button variant="danger" icon="close" disabled={!note.trim() || approve.isPending || reject.isPending}
                            onClick={() => reject.mutate({ id: refund.id, data: { note: note.trim() } })}>
                             {t("رفض", "Reject")}
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </Card>
                );
              })}
               {(approve.isError || reject.isError) ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error">{errorMessage(approve.error || reject.error, t("تعذر تنفيذ القرار", "Unable to apply decision"))}</p> : null}
            </div>
          )}
        </section>

        <section>
          <div className="mb-sm">
            <h2 className="font-headline-md text-headline-md">{t("تسوية Paymob اليدوية", "Manual Paymob reconciliation")}</h2>
            <p className="font-label-md text-label-md text-on-surface-variant">{t("راجع لوحة Paymob أولاً. الأزرار هنا تسجل النتيجة فقط ولا ترسل استرداداً جديداً.", "Check the Paymob dashboard first. These buttons record the outcome only; they do not send a new refund.")}</p>
          </div>
          {paymentRefunds.isLoading ? (
            <div className="flex h-32 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[30px] text-primary" /></div>
          ) : paymentRefunds.isError ? (
            <EmptyState icon="error" title={t("تعذر تحميل تسويات Paymob", "Unable to load Paymob reconciliations")} body={t("حاول مرة أخرى بعد قليل", "Try again shortly")} />
          ) : paymentRefunds.data?.length === 0 ? (
            <Card className="flex items-center gap-3 p-md"><Icon name="verified" className="text-success" /><span className="font-label-lg text-label-lg">{t("لا توجد عمليات غامضة تحتاج مراجعة", "No ambiguous transactions need review")}</span></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {paymentRefunds.data?.map((claim) => {
                const note = claimNotes[claim.id] ?? "";
                return (
                  <Card key={claim.id} className="space-y-3 border-warning/30 p-md">
                    <div className="flex items-start justify-between">
                       <div><p className="font-headline-md text-headline-md">{claim.orderCode}</p><p className="font-label-md text-label-md text-on-surface-variant">{t("عملية Paymob: ", "Paymob transaction: ")}{claim.transactionId}</p></div>
                       <Badge tone="danger">{claim.status === "ambiguous" ? t("نتيجة غامضة", "Ambiguous result") : t("تعذر تلقائياً", "Automatic processing failed")}</Badge>
                    </div>
                    <div className="flex justify-between rounded-button bg-surface-container p-3"><span>{claim.customerPhone}</span><strong>{adminCurrency(claim.amount, locale)}</strong></div>
                    <textarea value={note} onChange={(event) => setClaimNotes((current) => ({ ...current, [claim.id]: event.target.value }))}
                       maxLength={1000} aria-label={t("ملاحظة التحقق", "Verification note")} placeholder={t("اكتب مرجع أو ملاحظة التحقق من لوحة Paymob", "Enter a reference or verification note from the Paymob dashboard")}
                      className="min-h-20 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-primary" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button icon="verified" disabled={note.trim().length < 3 || resolve.isPending}
                        onClick={() => resolve.mutate({ id: claim.id, data: { outcome: "refunded", note: note.trim() } })}>
                         {t("تأكد الاسترداد", "Confirm refund")}
                      </Button>
                      <Button variant="outline" icon="money_off" disabled={note.trim().length < 3 || resolve.isPending}
                        onClick={() => resolve.mutate({ id: claim.id, data: { outcome: "not_refunded", note: note.trim() } })}>
                         {t("لم يُسترد", "Not refunded")}
                      </Button>
                    </div>
                  </Card>
                );
              })}
               {resolve.isError ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error">{errorMessage(resolve.error, t("تعذر تنفيذ القرار", "Unable to apply decision"))}</p> : null}
            </div>
          )}
        </section>

         {isLoading ? <span className="sr-only">{t("جاري التحميل", "Loading")}</span> : null}
      </div>
    </MobileShell>
  );
}