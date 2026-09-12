import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Icon, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { useTranslation } from "@/lib/i18n";
export const Route = createFileRoute("/partner/staff")({ component: PartnerStaffUnavailable });
function PartnerStaffUnavailable() {
  const { t } = useTranslation();
  const partnerNav = usePartnerNav();
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("موظفو الفروع", "Branch staff")}><Card className="mx-auto flex max-w-xl flex-col items-center gap-3 p-lg text-center"><Icon name="lock" className="text-[40px] text-outline" /><h2 className="font-headline-md text-headline-md">{t("إدارة حسابات موظفي الفروع غير متاحة", "Branch staff accounts are not available")}</h2><p className="text-on-surface-variant">{t("أزيلت أدوات التعيين لأنها كانت تربط حسابات العملاء بالفروع دون دور دخول مخصص. ستظل إدارة بيانات الفروع متاحة لصاحب المطعم.", "Assignment tools were removed because they connected customer accounts to branches without a dedicated login role. Branch data remains available to the restaurant owner.")}</p><Link to="/partner/branches"><Button variant="outline">{t("إدارة الفروع", "Manage branches")}</Button></Link></Card></DashboardShell>;
}