import { createFileRoute, Link } from "@tanstack/react-router";
import {
  DashboardShell,
  Card,
  SectionTitle,
  Stat,
  Bars,
  Table,
  Td,
  Badge,
  StatusBadge,
  Icon,
} from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, restaurantStats, orders } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/")({
  head: () => ({
    meta: [
      { title: "لوحة الأداء — طلبات بيتك" },
      { name: "description", content: "نظرة عامة على أداء مطعمك، الإيرادات، الطلبات والفروع." },
      { property: "og:title", content: "لوحة الأداء — طلبات بيتك" },
      { property: "og:description", content: "نظرة عامة على أداء مطعمك، الإيرادات، الطلبات والفروع." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerIndex,
});

function PartnerIndex() {
  const liveOrders = orders.filter((o) => !["DELIVERED", "CANCELLED"].includes(o.status));
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="لوحة الأداء">
      <div className="tb-stagger flex flex-col gap-lg">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          هذه اللوحة تعرض طلبات طلبات بيتك فقط
        </Badge>

        <div className="grid grid-cols-2 gap-sm md:grid-cols-3 xl:grid-cols-6">
          <Stat label="الإيرادات" value={EGP(restaurantStats.revenue)} delta="+12%" icon="payments" tone="warn" />
          <Stat label="الطلبات" value={String(restaurantStats.orders)} delta="+8%" icon="receipt_long" tone="info" />
          <Stat label="متوسط قيمة الطلب" value={EGP(restaurantStats.aov)} icon="shopping_basket" tone="neutral" />
          <Stat label="الطلبات الملغية" value={String(restaurantStats.cancelled)} icon="cancel" tone="danger" />
          <Stat label="عمولة المنصة" value={EGP(restaurantStats.commission)} icon="percent" tone="warn" />
          <Stat label="الصافي المستحق" value={EGP(restaurantStats.net)} icon="account_balance_wallet" tone="success" />
        </div>

        <Card className="p-md">
          <SectionTitle title="الطلبات خلال الأسبوع" icon="bar_chart" />
          <Bars values={restaurantStats.series} labels={restaurantStats.days} />
        </Card>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <div>
            <SectionTitle title="أفضل المنتجات" icon="trending_up" />
            <Table head={["المنتج", "الطلبات", "الإيرادات"]}>
              {restaurantStats.best.map((p) => (
                <tr key={p.name} className="transition hover:bg-surface-container-low">
                  <Td>{p.name}</Td>
                  <Td>{p.orders}</Td>
                  <Td>{EGP(p.revenue)}</Td>
                </tr>
              ))}
            </Table>
          </div>
          <div>
            <SectionTitle title="أقل المنتجات" icon="trending_down" />
            <Table head={["المنتج", "الطلبات", "الإيرادات"]}>
              {restaurantStats.worst.map((p) => (
                <tr key={p.name} className="transition hover:bg-surface-container-low">
                  <Td>{p.name}</Td>
                  <Td>{p.orders}</Td>
                  <Td>{EGP(p.revenue)}</Td>
                </tr>
              ))}
            </Table>
          </div>
        </div>

        <div>
          <SectionTitle title="أداء الفروع" icon="store" />
          <Table head={["الفرع", "الطلبات", "الإيرادات", "التقييم"]}>
            {restaurantStats.branchPerf.map((b) => (
              <tr key={b.name} className="transition hover:bg-surface-container-low">
                <Td>{b.name}</Td>
                <Td>{b.orders}</Td>
                <Td>{EGP(b.revenue)}</Td>
                <Td>
                  <span className="flex items-center gap-1">
                    <Icon name="star" className="text-[16px] text-primary" filled />
                    {b.rating}
                  </span>
                </Td>
              </tr>
            ))}
          </Table>
        </div>

        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          <Card className="p-md">
            <SectionTitle title="نمو العملاء" icon="group_add" />
            <p className="font-headline-md text-headline-md text-on-surface">{restaurantStats.newCustomers}</p>
            <p className="font-label-md text-label-md text-on-surface-variant">عميل جديد هذا الأسبوع</p>
          </Card>
          <Card className="p-md">
            <SectionTitle title="العملاء المتكررين" icon="repeat" />
            <p className="font-headline-md text-headline-md text-on-surface">{restaurantStats.repeatRate}%</p>
            <p className="font-label-md text-label-md text-on-surface-variant">من إجمالي العملاء</p>
          </Card>
        </div>

        <div>
          <SectionTitle title="طلبات جارية" icon="local_fire_department" />
          <div className="flex flex-col gap-sm">
            {liveOrders.map((o) => (
              <Link key={o.id} to="/partner/orders/$id" params={{ id: o.id }}>
                <Card className="flex items-center justify-between p-md transition hover:shadow-md">
                  <div>
                    <p className="font-label-lg text-label-lg text-on-surface">{o.code}</p>
                    <p className="font-label-md text-label-md text-on-surface-variant">{o.placedAt} · {EGP(o.total)}</p>
                  </div>
                  <StatusBadge status={o.status} />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
