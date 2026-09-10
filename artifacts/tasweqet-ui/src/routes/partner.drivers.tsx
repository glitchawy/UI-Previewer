import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Icon, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";

export const Route = createFileRoute("/partner/drivers")({ component: PartnerDrivers });
function PartnerDrivers() {
  return <DashboardShell brand="طلبات بيتك" role="صاحب المطعم" nav={partnerNav} title="مندوبو المطعم">
    <Card className="mx-auto flex max-w-xl flex-col items-center gap-3 p-lg text-center">
      <Icon name="lock" className="text-[36px] text-outline" />
      <h2 className="font-headline-md text-headline-md">الميزة غير متاحة حالياً</h2>
      <p className="text-on-surface-variant">لا يحتوي نموذج التشغيل الحالي على علاقة آمنة بين مندوب ومطعم. تتم إدارة مندوبي المنصة وتعيينهم للطلبات مركزياً.</p>
      <Link to="/partner/orders"><Button variant="outline">العودة إلى الطلبات</Button></Link>
    </Card>
  </DashboardShell>;
}