import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  getGetCustomerOrderQueryKey,
  useCreateCustomerRefundRequest,
  useGetCustomerOrder,
} from "@workspace/api-client-react";
import { AppBar, MobileShell, Icon, Card, Button, Badge, EmptyState } from "@/components/tb/shell";
import { CustomerCompensationSummary } from "@/components/tb/customer-compensation-summary";
import { customerTabs } from "@/lib/tb/nav";
import { EGP, formatOrderDate } from "@/lib/tb/orders";
import { translate, useTranslation } from "@/lib/i18n";
import {
  uploadRefundProof,
  validateRefundProofFile,
} from "@/lib/refund-proof";

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
const MIN_DESCRIPTION_LENGTH = 10;
const MAX_DESCRIPTION_LENGTH = 2000;
const MAX_REASON_LENGTH = 1000;

function errorMessage(error: unknown) {
  return (error as { data?: { error?: string } } | null)?.data?.error || translate("تعذر إرسال طلب الاسترداد", "Unable to submit the refund request");
}

function refundStatusCopy(status: string, t: ReturnType<typeof useTranslation>["t"]) {
  if (status === "approved") {
    return {
      tone: "success" as const,
      icon: "check_circle",
      title: t("تمت الموافقة على طلب الاسترداد", "Refund request approved"),
      body: t("تم تنفيذ قرار فريق الإدارة وإضافة المبلغ المعتمد إلى محفظتك.", "The reviewed decision was completed and the approved amount was added to your wallet."),
      badge: t("تمت الموافقة", "Approved"),
    };
  }
  if (status === "rejected") {
    return {
      tone: "danger" as const,
      icon: "cancel",
      title: t("تم رفض طلب الاسترداد", "Refund request rejected"),
      body: t("راجع تفاصيل الطلب أو تواصل مع الدعم لمزيد من المساعدة.", "Review your order details or contact support for help."),
      badge: t("مرفوض", "Rejected"),
    };
  }
  if (status === "failed") {
    return {
      tone: "danger" as const,
      icon: "error",
      title: t("تعذر تنفيذ طلب الاسترداد", "Refund request could not be completed"),
      body: t("يحتاج الطلب إلى مراجعة فريق الإدارة. لن يتم خصم أي مبلغ إضافي.", "The request needs an admin review. No additional amount will be charged."),
      badge: t("تعذر التنفيذ", "Failed"),
    };
  }
  if (status === "processing") {
    return {
      tone: "info" as const,
      icon: "hourglass_top",
      title: t("طلب الاسترداد قيد التنفيذ", "Refund request is being processed"),
      body: t("سيظهر المبلغ في محفظتك بعد اكتمال التنفيذ.", "The amount will appear in your wallet once processing is complete."),
      badge: t("جاري التنفيذ", "Processing"),
    };
  }
  return {
    tone: "warn" as const,
    icon: "schedule",
    title: t("تم إرسال طلب الاسترداد", "Refund request submitted"),
    body: t("فريق الإدارة هيراجع الطلب، وعند الموافقة المبلغ هينزل في محفظتك.", "The team will review your request, and approved funds will be added to your wallet."),
    badge: t("بانتظار مراجعة الإدارة", "Awaiting review"),
  };
}

function AppRefundId() {
  const { t } = useTranslation();
  const { id: rawId } = Route.useParams();
  const id = Number(rawId);
  const [reason, setReason] = useState<RefundReason>(reasons[0]![0]);
  const [otherReason, setOtherReason] = useState("");
  const [description, setDescription] = useState("");
  const [selectedProof, setSelectedProof] = useState<File | null>(null);
  const [proofPreviewUrl, setProofPreviewUrl] = useState<string | null>(null);
  const [proofObjectPath, setProofObjectPath] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const uploadAttemptRef = useRef(0);
  const order = useGetCustomerOrder(id, {
    query: { enabled: Number.isInteger(id) && id > 0, queryKey: getGetCustomerOrderQueryKey(id) },
  });
  const refund = useCreateCustomerRefundRequest({
    mutation: { onSuccess: () => { setSubmitted(true); order.refetch(); } },
  });
  const finalReason = reason === reasons[4]![0] ? otherReason.trim() : reason;
  const refundStatus = order.data?.refundRequestStatus;
  const refundCompensation = order.data?.refundCompensation;

  useEffect(() => {
    if (!selectedProof) {
      setProofPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(selectedProof);
    setProofPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [selectedProof]);

  const handleProofSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    // Clear the native value so selecting the same file after a failure retries.
    event.target.value = "";
    if (!file) return;

    setValidationError(null);
    setUploadError(null);
    setProofObjectPath(null);
    setSelectedProof(file);
    const attempt = ++uploadAttemptRef.current;
    setUploadingProof(false);
    if (!file) return;
    const fileError = validateRefundProofFile(file);
    if (fileError) {
      setUploadError(fileError);
      return;
    }

    setUploadingProof(true);
    try {
      const objectPath = await uploadRefundProof(id, file);
      if (attempt === uploadAttemptRef.current) setProofObjectPath(objectPath);
    } catch (error) {
      if (attempt === uploadAttemptRef.current) {
        setUploadError(error instanceof Error ? error.message : t("تعذر رفع صورة الإثبات", "Unable to upload the proof photo"));
      }
    } finally {
      if (attempt === uploadAttemptRef.current) setUploadingProof(false);
    }
  };

  const removeProof = () => {
    uploadAttemptRef.current += 1;
    setSelectedProof(null);
    setProofObjectPath(null);
    setProofPreviewUrl(null);
    setUploadError(null);
    setValidationError(null);
  };

  const handleSubmit = () => {
    const trimmedDescription = description.trim();
    if (finalReason.length < 3 || finalReason.length > MAX_REASON_LENGTH) {
      setValidationError(t("اكتب سبباً صحيحاً (من 3 إلى 1000 حرف).", "Enter a valid reason (3–1000 characters)."));
      return;
    }
    if (trimmedDescription.length < MIN_DESCRIPTION_LENGTH || trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      setValidationError(t("وصف الشكوى مطلوب من 10 إلى 2000 حرف.", "Complaint description must be 10–2000 characters."));
      return;
    }
    if (!selectedProof || !proofObjectPath) {
      setValidationError(t("ارفع صورة واحدة لإثبات الشكوى قبل الإرسال.", "Upload one proof photo before submitting."));
      return;
    }
    if (uploadingProof || refund.isPending) return;

    setValidationError(null);
    const refundData = {
      reason: finalReason,
      description: trimmedDescription,
      proofPath: proofObjectPath,
    };
    refund.mutate({ id, data: refundData });
  };

  return (
    <MobileShell tabs={customerTabs}>
       <AppBar title={t("طلب استرداد", "Request a refund")} back={`/app/orders/${rawId}`} />
      {order.isLoading ? (
        <div className="flex h-64 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[36px] text-primary" /></div>
      ) : !order.data ? (
         <div className="p-md"><EmptyState icon="error" title={t("الطلب غير موجود", "Order not found")} body={t("ارجع لطلباتك وحاول مرة أخرى", "Go back to your orders and try again")} /></div>
       ) : submitted || refundStatus ? (
        <div className="flex flex-col gap-md p-md">
           {(() => {
             const status = refundStatusCopy(refundStatus ?? "pending", t);
             return (
               <Card className={`flex flex-col items-center gap-3 p-lg text-center ${status.tone === "success" ? "bg-success/10" : status.tone === "danger" ? "bg-error-container/60" : status.tone === "info" ? "bg-secondary-container/60" : "bg-primary-container/40"}`}>
                 <span className={`flex size-14 items-center justify-center rounded-full text-white ${status.tone === "success" ? "bg-success" : status.tone === "danger" ? "bg-error" : "bg-secondary"}`}><Icon name={status.icon} className="text-[28px]" /></span>
                 <p className="font-headline-md text-headline-md">{status.title}</p>
                 <p className="font-body-md text-body-md text-on-surface-variant">{status.body}</p>
                 <Badge tone={status.tone}>{status.badge}</Badge>
               </Card>
             );
           })()}
            <CustomerCompensationSummary compensation={refundCompensation} orderTotal={order.data.total} status={refundStatus} />
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
                <textarea value={otherReason} onChange={(event) => { setOtherReason(event.target.value); setValidationError(null); }} maxLength={MAX_REASON_LENGTH} minLength={3} required placeholder={t("اكتب تفاصيل السبب", "Describe the reason")}
                className="mt-2 min-h-24 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-secondary" />
            ) : null}
          </section>

           <section>
             <div className="mb-sm flex items-end justify-between gap-2">
               <div>
                 <h2 className="font-headline-md text-headline-md">{t("وصف الشكوى", "Complaint description")} <span className="text-error" aria-hidden="true">*</span></h2>
                 <p className="font-label-md text-label-md text-on-surface-variant">{t("اشرح المشكلة بالتفصيل (من 10 إلى 2000 حرف).", "Explain what happened (10–2000 characters).")}</p>
               </div>
               <span className="shrink-0 font-label-md text-label-md text-on-surface-variant" aria-live="polite">{description.length}/{MAX_DESCRIPTION_LENGTH}</span>
             </div>
             <textarea
               value={description}
               onChange={(event) => { setDescription(event.target.value); setValidationError(null); }}
               minLength={MIN_DESCRIPTION_LENGTH}
               maxLength={MAX_DESCRIPTION_LENGTH}
               required
               aria-required="true"
               aria-label={t("وصف الشكوى", "Complaint description")}
               placeholder={t("مثال: وصل الطلب ناقصاً وكان الكيس مفتوحاً...", "Example: My order was missing an item and the bag was open...")}
               className="min-h-32 w-full rounded-card border border-outline-variant bg-surface-container-lowest p-3 outline-none focus:border-secondary"
             />
           </section>

           <section>
             <div className="mb-sm">
               <h2 className="font-headline-md text-headline-md">{t("صورة إثبات الشكوى", "Complaint proof photo")} <span className="text-error" aria-hidden="true">*</span></h2>
               <p className="font-label-md text-label-md text-on-surface-variant">{t("صورة واحدة بصيغة JPG أو PNG أو WebP، بحد أقصى 10 ميجابايت.", "One JPG, PNG, or WebP photo, up to 10 MB.")}</p>
             </div>
             <div className="rounded-card border border-dashed border-outline-variant bg-surface-container-low p-3">
               {proofPreviewUrl ? (
                 <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                   <img src={proofPreviewUrl} alt={t("معاينة صورة إثبات الشكوى", "Complaint proof photo preview")} className="h-32 w-full rounded-button object-cover sm:w-40" />
                   <div className="min-w-0 flex-1">
                     <p className="truncate font-label-lg text-label-lg">{selectedProof?.name}</p>
                     <p className="font-label-md text-label-md text-on-surface-variant">{selectedProof ? `${(selectedProof.size / (1024 * 1024)).toFixed(2)} MB` : ""}</p>
                     <p className={`mt-1 font-label-md text-label-md ${uploadingProof ? "text-on-surface-variant" : proofObjectPath ? "text-success" : "text-error"}`} role="status">
                       {uploadingProof ? t("جاري رفع الصورة…", "Uploading photo…") : proofObjectPath ? t("تم رفع الصورة", "Photo uploaded") : t("تعذر رفع الصورة", "Photo upload failed")}
                     </p>
                     <div className="mt-2 flex flex-wrap gap-2">
                       <label className="inline-flex cursor-pointer items-center gap-1 rounded-button border border-secondary px-3 py-2 font-label-md text-label-md text-secondary hover:bg-surface-container">
                         <Icon name="swap_horiz" className="text-[18px]" />
                         {t("استبدال", "Replace")}
                         <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleProofSelected} disabled={uploadingProof || refund.isPending} />
                       </label>
                       <Button type="button" variant="ghost" icon="delete" onClick={removeProof} disabled={uploadingProof || refund.isPending}>{t("إزالة", "Remove")}</Button>
                     </div>
                   </div>
                 </div>
               ) : (
                 <label className="flex cursor-pointer flex-col items-center gap-2 py-5 text-center">
                   <span className="flex size-12 items-center justify-center rounded-full bg-secondary-container text-on-secondary-container"><Icon name="add_a_photo" className="text-[24px]" /></span>
                   <span className="font-label-lg text-label-lg">{t("اختار صورة من جهازك", "Choose a photo from your device")}</span>
                   <span className="font-label-md text-label-md text-on-surface-variant">{t("الصورة مطلوبة لإرسال الشكوى", "A photo is required to submit the complaint")}</span>
                   <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleProofSelected} disabled={uploadingProof || refund.isPending} />
                 </label>
               )}
             </div>
             {uploadError ? <p className="mt-2 rounded-button bg-error-container p-3 text-center text-label-md text-error" role="alert">{uploadError}</p> : null}
           </section>

          <Card className="space-y-2 p-md">
              <div className="flex justify-between"><span className="text-on-surface-variant">{t("الحد الأقصى للمبلغ المراجع", "Maximum amount for review")}</span><strong>{EGP(order.data.total)}</strong></div>
             <div className="flex justify-between"><span className="text-on-surface-variant">{t("طريقة الاسترداد", "Refund method")}</span><Badge tone="info">{t("محفظة طلبات بيتك", "Talabat Betak wallet")}</Badge></div>
          </Card>

          <Card className="flex items-center gap-2 bg-secondary-container p-3 text-on-secondary-container">
            <Icon name="info" className="text-[18px]" />
              <span className="font-label-md text-label-md">{t("فريق الإدارة هيراجع الحالة وقد يضيف كل المبلغ أو جزءاً منه للمحفظة؛ القرار النهائي يظهر بعد المراجعة", "The team will review the case and may credit all or part of the amount; the final decision appears after review.")}</span>
          </Card>

           {validationError ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error" role="alert">{validationError}</p> : null}
           {refund.isError ? <p className="rounded-button bg-error-container p-3 text-center text-label-md text-error" role="alert">{errorMessage(refund.error)}</p> : null}
           <Button className="w-full" icon="send" disabled={uploadingProof || refund.isPending || !proofObjectPath}
             onClick={handleSubmit}>
              {uploadingProof ? t("جاري رفع الصورة…", "Uploading photo…") : refund.isPending ? t("جاري الإرسال…", "Submitting…") : t("إرسال طلب الاسترداد", "Submit refund request")}
          </Button>
        </div>
      )}
    </MobileShell>
  );
}