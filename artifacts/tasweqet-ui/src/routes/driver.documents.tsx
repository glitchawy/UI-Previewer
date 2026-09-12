import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { useDriverTabs } from "@/lib/tb/nav";
import { type DriverDocuments } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";
import { getToken } from "@/lib/auth-session";
import { useTranslation } from "@/lib/i18n";
import { formatDateTime } from "@/lib/tb/locale-format";

export const Route = createFileRoute("/driver/documents")({ component: DriverDocumentsPage });
const labels: Record<string, [string, string]> = {
  national_id_front: ["الرقم القومي — الوجه", "National ID — front"],
  national_id_back: ["الرقم القومي — الظهر", "National ID — back"],
  criminal_record: ["الفيش والتشبيه", "Criminal record"],
  license: ["رخصة القيادة", "Driver's license"],
};
const statusLabels: Record<string, [string, string]> = {
  PENDING: ["قيد الانتظار", "Pending"],
  UNDER_REVIEW: ["تحت المراجعة", "Under review"],
  APPROVED: ["موافق عليه", "Approved"],
  ACTIVE: ["نشط", "Active"],
  REJECTED: ["مرفوض", "Rejected"],
  SUSPENDED: ["موقوف", "Suspended"],
};
function DriverDocumentsPage() {
  const { t, locale } = useTranslation();
  const driverTabs = useDriverTabs();
  const query = useDriverData<DriverDocuments>("/documents");
  return <MobileShell tabs={driverTabs}><AppBar title={t("مركز التوثيق", "Verification center")} back="/driver/profile" /><div className="flex flex-col gap-md p-md">
     {query.loading ? <Card className="p-xl text-center">{t("جاري تحميل المستندات…", "Loading documents…")}</Card> :
      query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
     query.data ? <>
        <Card className="flex items-center justify-between p-md"><span>{t("حالة طلب الانضمام", "Application status")}</span><StatusBadge status={query.data.applicationStatus} label={statusLabels[query.data.applicationStatus] ? t(...statusLabels[query.data.applicationStatus]) : query.data.applicationStatus} /></Card>
        {query.data.rejectionReason ? <Card className="bg-error-container p-md text-on-error-container">{t("سبب الرفض:", "Rejection reason:")} {query.data.rejectionReason}</Card> : null}
        {!query.data.items.length ? <EmptyState icon="description" title={t("لا يوجد سجل مستندات", "No document history")} body={t("ارفع مستنداتك من طلب الانضمام", "Upload your documents from the application")} /> :
        <div className="flex flex-col gap-2">{query.data.items.map(doc => { const label = labels[doc.documentType]; const status = statusLabels[doc.reviewStatus]; return <Card key={doc.id} className="p-md"><div className="flex items-center justify-between"><div><p className="font-label-lg">{label ? t(label[0], label[1]) : doc.documentType}</p><p className="text-label-md text-on-surface-variant">{t(`الإصدار ${doc.version}`, `Version ${doc.version}`)} · {formatDateTime(doc.uploadedAt, locale)}</p></div><StatusBadge status={doc.reviewStatus} label={status ? t(status[0], status[1]) : doc.reviewStatus} /></div>{doc.reviewReason ? <p className="mt-2 text-error">{t("سبب المراجعة:", "Review reason:")} {doc.reviewReason}</p> : null}<a className="mt-2 inline-flex items-center gap-1 text-primary underline" href={`${doc.accessUrl}?token=${encodeURIComponent(getToken() ?? "")}`} target="_blank" rel="noreferrer"><Icon name="visibility" className="text-[17px]" />{t("تنزيل آمن", "Secure download")}</a></Card>; })}</div>}
     </> : null}
  </div></MobileShell>;
}