import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Button, Icon } from "@/components/tb/shell";
import { useTranslation } from "@/lib/i18n";
export const Route = createFileRoute("/branch/drivers")({ component: BranchDriversUnavailable });
function BranchDriversUnavailable() {
  const { t, locale, dir } = useTranslation();
  return <main className="flex min-h-screen items-center justify-center bg-surface p-md" dir={dir} lang={locale}><Card className="flex max-w-xl flex-col items-center gap-3 p-lg text-center"><Icon name="lock" className="text-[40px] text-outline" /><h1 className="font-headline-lg text-headline-lg">{t("إدارة توصيل الفرع غير متاحة", "Branch delivery management unavailable")}</h1><p className="text-on-surface-variant">{t("لا توجد حالياً هوية موظف فرع أو علاقة مندوب بمطعم تسمح بهذه العملية بأمان. تعيين مندوبي المنصة يتم عبر دورة الطلب المعتمدة.", "There is no secure branch-staff identity or restaurant-driver relationship for this operation. Platform drivers are assigned through the approved order flow.")}</p><Link to="/auth/login"><Button variant="outline">{t("تسجيل الدخول", "Sign in")}</Button></Link></Card></main>;
}