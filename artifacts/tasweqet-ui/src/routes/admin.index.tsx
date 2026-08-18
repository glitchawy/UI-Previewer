import { createFileRoute, Link } from "@tanstack/react-router";
import { Bars, Card, DashboardShell, Icon, SectionTitle, Stat, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, platformStats } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "نظرة عامة | لوحة سوبر أدمن - طلبات بيتك" },
      { name: "description", content: "تحليلات المنصة الكاملة: إجمالي المبيعات، الإيرادات، الطلبات، المطاعم والمندوبين." },
      { property: "og:title", content: "نظرة عامة | طلبات بيتك" },
      { property: "og:description", content: "تحليلات المنصة الكاملة لسوبر أدمن طلبات بيتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminIndex,
});

const pendingActions = [
  { to: "/admin/restaurants", icon: "storefront", label: "مطاعم بانتظار المراجعة", count: 4 },
  { to: "/admin/drivers", icon: "two_wheeler", label: "مندوبين بانتظار التوثيق", count: 3 },
  { to: "/admin/refunds", icon: "currency_exchange", label: "طلبات استرداد معلّقة", count: 1 },
  { to: "/admin/settlements", icon: "account_balance", label: "تسويات بانتظار الاعتماد", count: 1 },
] as const;

function AdminIndex() {
  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="نظرة عامة">
      <div className="tb-stagger flex flex-col gap-md">
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4 lg:grid-cols-7">
          <Stat label="إجمالي المبيعات (GMV)" value={EGP(platformStats.gmv)} icon="payments" delta={`${platformStats.growth}%`} tone="warn" />
          <Stat label="إيرادات المنصة" value={EGP(platformStats.revenue)} icon="account_balance_wallet" tone="success" />
          <Stat label="الطلبات" value={platformStats.orders.toLocaleString("ar-EG")} icon="receipt_long" tone="info" />
          <Stat label="العملاء" value={platformStats.customers.toLocaleString("ar-EG")} icon="group" tone="info" />
          <Stat label="المطاعم" value={platformStats.restaurants.toLocaleString("ar-EG")} icon="storefront" tone="warn" />
          <Stat label="المندوبين النشطين" value={platformStats.activeDrivers.toLocaleString("ar-EG")} icon="two_wheeler" tone="success" />
          <Stat label="نسبة النمو" value={`${platformStats.growth}%`} icon="trending_up" tone="success" />
        </div>

        <Card className="grid grid-cols-1 gap-md p-md md:grid-cols-3">
          <div className="flex items-center gap-sm rounded-button bg-secondary-container p-md text-on-secondary-container">
            <Icon name="local_shipping" className="text-[24px]" />
            <div>
              <p className="font-headline-md text-headline-md">142</p>
              <p className="font-label-md text-label-md">طلبات جارية الآن</p>
            </div>
          </div>
          <div className="flex items-center gap-sm rounded-button bg-success/15 p-md text-success">
            <Icon name="two_wheeler" className="text-[24px]" />
            <div>
              <p className="font-headline-md text-headline-md">{platformStats.activeDrivers}</p>
              <p className="font-label-md text-label-md">مندوبين متصلين</p>
            </div>
          </div>
          <div className="flex items-center gap-sm rounded-button bg-error-container p-md text-on-error-container">
            <Icon name="storefront" className="text-[24px]" />
            <div>
              <p className="font-headline-md text-headline-md">6</p>
              <p className="font-label-md text-label-md">مطاعم مغلقة الآن</p>
            </div>
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="نمو المنصة الشهري" icon="show_chart" />
          <Bars values={[...platformStats.series]} labels={[...platformStats.months]} />
        </Card>

        <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
          <Card className="p-md">
            <SectionTitle title="أفضل المطاعم" icon="military_tech" />
            <Table head={["المطعم", "الطلبات", "GMV"]}>
              {platformStats.topRestaurants.map((r) => (
                <tr key={r.name}>
                  <Td>{r.name}</Td>
                  <Td>{r.orders.toLocaleString("ar-EG")}</Td>
                  <Td>{EGP(r.gmv)}</Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card className="p-md">
            <SectionTitle title="أفضل المناطق" icon="location_on" />
            <div className="flex flex-col gap-sm">
              {platformStats.topAreas.map((a) => (
                <div key={a.name}>
                  <div className="mb-1 flex items-center justify-between font-label-lg text-label-lg text-on-surface">
                    <span>{a.name}</span>
                    <span className="text-on-surface-variant">{a.orders.toLocaleString("ar-EG")} طلب · {a.share}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-surface-container">
                    <div className="h-full rounded-full bg-primary-container" style={{ width: `${a.share * 3}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-md">
          <SectionTitle title="إجراءات بانتظار المراجعة" icon="pending_actions" />
          <div className="grid grid-cols-1 gap-sm md:grid-cols-2 lg:grid-cols-4">
            {pendingActions.map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center justify-between gap-sm rounded-button border border-outline-variant bg-surface-container-low p-md transition hover:bg-surface-container"
              >
                <div className="flex items-center gap-2">
                  <Icon name={a.icon} className="text-[20px] text-on-surface-variant" />
                  <span className="font-label-lg text-label-lg text-on-surface">{a.label}</span>
                </div>
                <span className="flex size-7 items-center justify-center rounded-full bg-primary-container font-label-md text-label-md text-on-primary-container">
                  {a.count}
                </span>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
