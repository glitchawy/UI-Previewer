import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Icon, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/partner/drivers")({ component: PartnerDrivers });
function PartnerDrivers() {
  const { t } = useTranslation();
  const partnerNav = usePartnerNav();
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("مندوبو المطعم", "Restaurant drivers")}>
    <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 p-lg text-center">
      <Icon name="lock" className="text-[36px] text-outline" />
       <h2 className="font-headline-md text-headline-md">{t("الميزة غير متاحة حالياً", "This feature is not currently available")}</h2>
       <p className="text-on-surface-variant">{t("لا يحتوي نموذج التشغيل الحالي على علاقة آمنة بين مندوب ومطعم. تتم إدارة مندوبي المنصة وتعيينهم للطلبات مركزياً.", "The current operating model has no secure restaurant-driver relationship. Platform drivers are managed and assigned to orders centrally.")}</p>
       <Link to="/partner/orders"><Button variant="outline">{t("العودة إلى الطلبات", "Back to orders")}</Button></Link>
    </Card>
  </DashboardShell>;
}