import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";

export const Route = createFileRoute("/partner/menu/$id")({ component: PartnerMenuDetail });
function PartnerMenuDetail() {
  return <DashboardShell brand="طلبات بيتك" role="صاحب المطعم" nav={partnerNav} title="تعديل المنتج">
    <Card className="mx-auto max-w-xl p-lg text-center">
      <p className="mb-4 text-on-surface-variant">صفحة التعديل القديمة أزيلت لأنها كانت تعرض بيانات تجريبية. استخدم محرر المنتجات الحقيقي في صفحة القائمة.</p>
      <Link to="/partner/menu"><Button>فتح قائمة المنتجات</Button></Link>
    </Card>
  </DashboardShell>;
}