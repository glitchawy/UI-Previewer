import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Button, Icon } from "@/components/tb/shell";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/branch/")({ component: BranchUnavailable });
function BranchUnavailable() {
  const { t, locale, dir } = useTranslation();
  return <main className="flex min-h-screen items-center justify-center bg-surface p-md" dir={dir} lang={locale}><Card className="flex max-w-xl flex-col items-center gap-3 p-lg text-center"><Icon name="admin_panel_settings" className="text-[40px] text-outline" /><h1 className="font-headline-lg text-headline-lg">{t("لوحة الفرع غير متاحة", "Branch dashboard unavailable")}</h1><p className="text-on-surface-variant">{t("لا يدعم نموذج الحسابات الحالي هوية موظف فرع مستقلة وآمنة. إدارة الفروع متاحة لصاحب المطعم فقط من لوحة الشريك.", "The current account model does not support a separate secure branch identity. Branch management is available to the restaurant owner from the partner dashboard.")}</p><Link to="/auth/login"><Button variant="outline">{t("تسجيل الدخول", "Sign in")}</Button></Link></Card></main>;
}