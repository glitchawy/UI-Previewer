import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Button, Icon } from "@/components/tb/shell";

export const Route = createFileRoute("/branch/")({ component: BranchUnavailable });
function BranchUnavailable() {
  return <main className="flex min-h-screen items-center justify-center bg-surface p-md" dir="rtl"><Card className="flex max-w-xl flex-col items-center gap-3 p-lg text-center"><Icon name="admin_panel_settings" className="text-[40px] text-outline" /><h1 className="font-headline-lg text-headline-lg">لوحة الفرع غير متاحة</h1><p className="text-on-surface-variant">لا يدعم نموذج الحسابات الحالي هوية موظف فرع مستقلة وآمنة. إدارة الفروع متاحة لصاحب المطعم فقط من لوحة الشريك.</p><Link to="/auth/login"><Button variant="outline">تسجيل الدخول</Button></Link></Card></main>;
}