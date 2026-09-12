import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/partner/menu/$id")({ component: PartnerMenuDetail });
function PartnerMenuDetail() {
  const { t } = useTranslation();
  const partnerNav = usePartnerNav();
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("تعديل المنتج", "Edit product")}>
    <Card className="mx-auto max-w-xl p-lg text-center">
      <p className="mb-4 text-on-surface-variant">{t("صفحة التعديل القديمة أزيلت لأنها كانت تعرض بيانات تجريبية. استخدم محرر المنتجات الحقيقي في صفحة القائمة.", "The old edit page was removed because it showed sample data. Use the real product editor on the menu page.")}</p>
      <Link to="/partner/menu"><Button>{t("فتح قائمة المنتجات", "Open product menu")}</Button></Link>
    </Card>
  </DashboardShell>;
}