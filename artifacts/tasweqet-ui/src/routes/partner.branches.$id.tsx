import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Button, Badge } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";

export const Route = createFileRoute("/partner/branches/$id")({ component: PartnerBranchDetail });
type Branch = { id: number; name: string; address: string; phone: string | null; isOpen: boolean; notes: string | null };
function PartnerBranchDetail() {
  const { id } = Route.useParams();
  const numericId = Number(id);
  const query = usePartnerResource<Branch>(Number.isInteger(numericId) && numericId > 0 ? `/api/partner/branches/${numericId}` : "/api/partner/branches/invalid");
  return <DashboardShell brand="طلبات بيتك" role="صاحب المطعم" nav={partnerNav} title="بيانات الفرع">
    {query.loading ? <Card className="p-md">جارٍ التحميل...</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button className="mt-2" onClick={query.reload}>إعادة المحاولة</Button></Card> : query.data ?
      <Card className="mx-auto flex max-w-2xl flex-col gap-3 p-lg">
        <div className="flex items-center justify-between gap-2"><h2 className="font-headline-lg text-headline-lg">{query.data.name}</h2><Badge tone={query.data.isOpen ? "success" : "neutral"}>{query.data.isOpen ? "مفتوح" : "مغلق"}</Badge></div>
        <p>{query.data.address}</p><p dir="ltr" className="text-right">{query.data.phone || "لا يوجد هاتف"}</p>{query.data.notes ? <p className="text-on-surface-variant">{query.data.notes}</p> : null}
        <p className="rounded-button bg-surface-container p-3 text-on-surface-variant">تعديل بيانات الفرع وحالته متاح من قائمة الفروع. إدارة حسابات الموظفين مخفية حتى يتوفر دور فرعي آمن.</p>
        <Link to="/partner/branches"><Button variant="outline">العودة للفروع</Button></Link>
      </Card> : null}
  </DashboardShell>;
}