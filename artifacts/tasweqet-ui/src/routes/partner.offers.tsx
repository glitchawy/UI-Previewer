import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Icon, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { useTranslation } from "@/lib/i18n";
export const Route = createFileRoute("/partner/offers")({ component: PartnerOffersUnavailable });
function PartnerOffersUnavailable() {
  const { t } = useTranslation();
  const partnerNav = usePartnerNav();
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("العروض", "Offers")}><Card className="mx-auto flex max-w-xl flex-col items-center gap-3 p-lg text-center"><Icon name="lock" className="text-[40px] text-outline" /><h2 className="font-headline-md text-headline-md">{t("العروض غير متاحة للعملاء حالياً", "Offers are not currently available to customers")}</h2><p className="text-on-surface-variant">{t("أخفينا أدوات العروض حتى يكتمل تطبيق الخصم والتحقق منه داخل التسعير والدفع دون المساس بقيود المحاسبة. لن تظهر أي أزرار توهم بتفعيل خصم غير مطبق.", "We hid offer tools until discount application and validation are complete in pricing and checkout. No controls will suggest that an unapplied discount is active.")}</p><Link to="/partner/menu"><Button variant="outline">{t("إدارة المنتجات", "Manage products")}</Button></Link></Card></DashboardShell>;
}