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
import { EGP, formatOrderDate } from "@/lib/tb/orders";

export const Route = createFileRoute("/admin/refunds")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | مراجعة الاستردادات" },
      { name: "description", content: "مراجعة واعتماد طلبات استرداد العملاء وتسوية استردادات Paymob" },
    ],
  }),
  component: AdminRefunds,
});

const statusLabel = {
  pending: "قيد المراجعة",
  processing: "جاري التنفيذ",
  approved: "تمت الموافقة",
  rejected: "مرفوض",
  failed: "تعذر التنفيذ",
} as const;

function errorMessage(error: unknown) {
  return (error as { data?: { error?: string } } | null)?.data?.error || "تعذر تنفيذ القرار";
}

function AdminRefunds() {
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
      <AppBar title="طلبات الاسترداد" subtitle="مراجعة مالية" back="/admin" right={<Icon name="account_balance_wallet" className="text-secondary" />} />
      <div className="flex flex-col gap-xl p-md">
        <section>
          <div className="mb-sm flex items-center justify-between">
            <div>
              <h2 className="font-headline-md text-headline-md">طلبات العملاء</h2>
              <p className="font-label-md text-label-md text-on-surface-variant">الموافقة تضيف المبلغ للمحفظة مرة واحدة</p>
            </div>
            <Badge tone="warn">{(refunds.data?.filter((item) => item.status === "pending").length ?? 0).toLocaleString("ar-EG")} معلّق</Badge>
          </div>

          {refunds.isLoading ? (
            <div className="flex h-44 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[34px] text-primary" /></div>
          ) : refunds.isError ? (
            <EmptyState icon="error" title="تعذر تحميل الطلبات" body="حاول مرة أخرى بعد قليل" />
          ) : refunds.data?.length === 0 ? (
            <EmptyState icon="task_alt" title="مفيش طلبات استرداد" body="طلبات العملاء الجديدة هتظهر هنا" />
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
                        <p className="font-label-md text-label-md text-on-surface-variant">{refund.restaurantName} · {formatOrderDate(refund.createdAt)}</p>
                      </div>
                      <Badge tone={refund.status === "approved" ? "success" : refund.status === "rejected" || refund.status === "failed" ? "danger" : "warn"}>{statusLabel[refund.status]}</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-2 rounded-card bg-surface-container p-3 text-label-md">
                      <span className="text-on-surface-variant">العميل</span><strong>{refund.customerName || refund.customerPhone}</strong>
                      <span className="text-on-surface-variant">المبلغ</span><strong>{EGP(refund.amount)}</strong>
                      <span className="text-on-surface-variant">السبب</span><strong>{refund.reason}</strong>
                    </div>
                    {refund.resolutionNote ? <p className="rounded-button bg-surface-container p-2 text-label-md text-on-surface-variant">ملاحظة الإدارة: {refund.resolutionNote}</p> : null}
                    {pending ? (
                      <>
                        <textarea value={note} onChange={(event) => setNotes((current) => ({ ...current, [refund.id]: event.target.value }))}
                          maxLength={1000} placeholder="ملاحظة القرار (مطلوبة عند الرفض)"
                          className="min-h-20 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-primary" />
                        <div className="grid grid-cols-2 gap-2">
                          <Button icon="check" disabled={approve.isPending || reject.isPending}
                            onClick={() => approve.mutate({ id: refund.id, data: note.trim() ? { note: note.trim() } : {} })}>
                            موافقة
                          </Button>
                          <Button variant="danger" icon="close" disabled={!note.trim() || approve.isPending || reject.isPending}
                            onClick={() => reject.mutate({ id: refund.id, data: { note: note.trim() } })}>
                            رفض
                          </Button>
                        </div>
                      </>
                    ) : null}
                  </Card>
                );
              })}
              {(approve.isError || reject.isError) ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error">{errorMessage(approve.error || reject.error)}</p> : null}
            </div>
          )}
        </section>

        <section>
          <div className="mb-sm">
            <h2 className="font-headline-md text-headline-md">تسوية Paymob اليدوية</h2>
            <p className="font-label-md text-label-md text-on-surface-variant">راجع لوحة Paymob أولاً. الأزرار هنا تسجل النتيجة فقط ولا ترسل استرداداً جديداً.</p>
          </div>
          {paymentRefunds.isLoading ? (
            <div className="flex h-32 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[30px] text-primary" /></div>
          ) : paymentRefunds.isError ? (
            <EmptyState icon="error" title="تعذر تحميل تسويات Paymob" body="حاول مرة أخرى بعد قليل" />
          ) : paymentRefunds.data?.length === 0 ? (
            <Card className="flex items-center gap-3 p-md"><Icon name="verified" className="text-success" /><span className="font-label-lg text-label-lg">لا توجد عمليات غامضة تحتاج مراجعة</span></Card>
          ) : (
            <div className="flex flex-col gap-3">
              {paymentRefunds.data?.map((claim) => {
                const note = claimNotes[claim.id] ?? "";
                return (
                  <Card key={claim.id} className="space-y-3 border-warning/30 p-md">
                    <div className="flex items-start justify-between">
                      <div><p className="font-headline-md text-headline-md">{claim.orderCode}</p><p className="font-label-md text-label-md text-on-surface-variant">عملية Paymob: {claim.transactionId}</p></div>
                      <Badge tone="danger">{claim.status === "ambiguous" ? "نتيجة غامضة" : "تعذر تلقائياً"}</Badge>
                    </div>
                    <div className="flex justify-between rounded-button bg-surface-container p-3"><span>{claim.customerPhone}</span><strong>{EGP(claim.amount)}</strong></div>
                    <textarea value={note} onChange={(event) => setClaimNotes((current) => ({ ...current, [claim.id]: event.target.value }))}
                      maxLength={1000} placeholder="اكتب مرجع أو ملاحظة التحقق من لوحة Paymob"
                      className="min-h-20 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-primary" />
                    <div className="grid grid-cols-2 gap-2">
                      <Button icon="verified" disabled={note.trim().length < 3 || resolve.isPending}
                        onClick={() => resolve.mutate({ id: claim.id, data: { outcome: "refunded", note: note.trim() } })}>
                        تأكد الاسترداد
                      </Button>
                      <Button variant="outline" icon="money_off" disabled={note.trim().length < 3 || resolve.isPending}
                        onClick={() => resolve.mutate({ id: claim.id, data: { outcome: "not_refunded", note: note.trim() } })}>
                        لم يُسترد
                      </Button>
                    </div>
                  </Card>
                );
              })}
              {resolve.isError ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error">{errorMessage(resolve.error)}</p> : null}
            </div>
          )}
        </section>

        {isLoading ? <span className="sr-only">جاري التحميل</span> : null}
      </div>
    </MobileShell>
  );
}