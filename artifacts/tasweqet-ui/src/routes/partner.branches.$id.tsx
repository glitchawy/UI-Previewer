import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Button, Badge } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { usePartnerResource } from "@/lib/partner-api";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/partner/branches/$id")({ component: PartnerBranchDetail });
type Branch = { id: number; name: string; address: string; phone: string | null; isOpen: boolean; notes: string | null };
function PartnerBranchDetail() {
  const { t } = useTranslation();
  const partnerNav = usePartnerNav();
  const { id } = Route.useParams();
  const numericId = Number(id);
  const query = usePartnerResource<Branch>(Number.isInteger(numericId) && numericId > 0 ? `/api/partner/branches/${numericId}` : "/api/partner/branches/invalid");
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("بيانات الفرع", "Branch details")}>
    {query.loading ? <Card className="p-md">{t("جارٍ التحميل...", "Loading…")}</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button className="mt-2" onClick={query.reload}>{t("إعادة المحاولة", "Try again")}</Button></Card> : query.data ?
      <Card className="mx-auto flex max-w-2xl flex-col gap-3 p-lg">
        <div className="flex items-center justify-between gap-2"><h2 className="font-headline-lg text-headline-lg">{query.data.name}</h2><Badge tone={query.data.isOpen ? "success" : "neutral"}>{query.data.isOpen ? t("مفتوح", "Open") : t("مغلق", "Closed")}</Badge></div>
        <p>{query.data.address}</p><p dir="ltr" className="text-right">{query.data.phone || t("لا يوجد هاتف", "No phone")}</p>{query.data.notes ? <p className="text-on-surface-variant">{query.data.notes}</p> : null}
        <p className="rounded-button bg-surface-container p-3 text-on-surface-variant">{t("تعديل بيانات الفرع وحالته متاح من قائمة الفروع. إدارة حسابات الموظفين مخفية حتى يتوفر دور فرعي آمن.", "Edit branch details and status from the branch list. Staff account management is hidden until a secure branch role is available.")}</p>
        <Link to="/partner/branches"><Button variant="outline">{t("العودة للفروع", "Back to branches")}</Button></Link>
      </Card> : null}
  </DashboardShell>;
}