import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Button, Icon } from "@/components/tb/shell";
import { useTranslation } from "@/lib/i18n";
export const Route = createFileRoute("/branch/inventory")({ component: BranchInventoryUnavailable });
function BranchInventoryUnavailable() {
  const { t, locale, dir } = useTranslation();
  return <main className="flex min-h-screen items-center justify-center bg-surface p-md" dir={dir} lang={locale}><Card className="flex max-w-xl flex-col items-center gap-3 p-lg text-center"><Icon name="lock" className="text-[40px] text-outline" /><h1 className="font-headline-lg text-headline-lg">{t("مخزون الفرع غير متاح لهذا الحساب", "Branch inventory unavailable for this account")}</h1><p className="text-on-surface-variant">{t("يمكن لصاحب المطعم إدارة مخزون جميع فروعه من لوحة الشريك. وصول موظفي الفروع مخفي حتى يتوفر نموذج صلاحيات فرعي آمن.", "The restaurant owner can manage all branch inventory from the partner dashboard. Branch staff access is hidden until a secure sub-role permissions model is available.")}</p><Link to="/auth/login"><Button variant="outline">{t("تسجيل الدخول", "Sign in")}</Button></Link></Card></main>;
}