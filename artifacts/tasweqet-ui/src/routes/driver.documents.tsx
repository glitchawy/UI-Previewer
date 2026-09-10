import { createFileRoute } from "@tanstack/react-router";
import { AppBar, Button, Card, EmptyState, Icon, MobileShell, StatusBadge } from "@/components/tb/shell";
import { driverTabs } from "@/lib/tb/nav";
import { type DriverDocuments } from "@/lib/driver-api";
import { useDriverData } from "@/lib/use-driver-data";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/driver/documents")({ component: DriverDocumentsPage });
const labels: Record<string, string> = { national_id_front: "الرقم القومي — الوجه", national_id_back: "الرقم القومي — الظهر", criminal_record: "الفيش والتشبيه", license: "رخصة القيادة" };
function DriverDocumentsPage() {
  const query = useDriverData<DriverDocuments>("/documents");
  return <MobileShell tabs={driverTabs}><AppBar title="مركز التوثيق" back="/driver/profile" /><div className="flex flex-col gap-md p-md">
    {query.loading ? <Card className="p-xl text-center">جاري تحميل المستندات…</Card> :
     query.error ? <Card className="p-lg text-center text-error"><p>{query.error}</p><Button className="mt-sm" onClick={query.retry}>إعادة المحاولة</Button></Card> :
     query.data ? <>
       <Card className="flex items-center justify-between p-md"><span>حالة طلب الانضمام</span><StatusBadge status={query.data.applicationStatus} /></Card>
       {query.data.rejectionReason ? <Card className="bg-error-container p-md text-on-error-container">سبب الرفض: {query.data.rejectionReason}</Card> : null}
       {!query.data.items.length ? <EmptyState icon="description" title="لا يوجد سجل مستندات" body="ارفع مستنداتك من طلب الانضمام" /> :
       <div className="flex flex-col gap-2">{query.data.items.map(doc => <Card key={doc.id} className="p-md"><div className="flex items-center justify-between"><div><p className="font-label-lg">{labels[doc.documentType] ?? doc.documentType}</p><p className="text-label-md text-on-surface-variant">الإصدار {doc.version} · {new Date(doc.uploadedAt).toLocaleString("ar-EG")}</p></div><StatusBadge status={doc.reviewStatus} /></div>{doc.reviewReason ? <p className="mt-2 text-error">سبب المراجعة: {doc.reviewReason}</p> : null}<a className="mt-2 inline-flex items-center gap-1 text-primary underline" href={`${doc.accessUrl}?token=${encodeURIComponent(getToken() ?? "")}`} target="_blank" rel="noreferrer"><Icon name="visibility" className="text-[17px]" />تنزيل آمن</a></Card>)}</div>}
     </> : null}
  </div></MobileShell>;
}