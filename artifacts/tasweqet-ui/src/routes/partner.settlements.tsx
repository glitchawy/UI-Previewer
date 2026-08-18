import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, StatusBadge, Badge, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, settlements } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/settlements")({
  head: () => ({
    meta: [
      { title: "التسويات — طلبات بيتك" },
      { name: "description", content: "متابعة التسويات المالية الأسبوعية لمطعمك." },
      { property: "og:title", content: "التسويات — طلبات بيتك" },
      { property: "og:description", content: "متابعة التسويات المالية الأسبوعية لمطعمك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerSettlements,
});

function PartnerSettlements() {
  const mine = settlements.filter((s) => s.party === "برجر هاوس");
  const current = mine[0] ?? settlements[0]!;
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="التسويات">
      <div className="tb-stagger flex flex-col gap-lg">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          التسوية أسبوعية ويتم صرفها من الإدارة
        </Badge>

        <Card className="p-md">
          <SectionTitle title={`التسوية الحالية — ${current.period}`} icon="account_balance" action={<StatusBadge status={current.status} />} />
          <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
            <Stat label="الطلبات" value={String(current.orders)} icon="receipt_long" tone="info" />
            <Stat label="الإجمالي" value={EGP(current.gross)} icon="payments" tone="neutral" />
            <Stat label="العمولة" value={EGP(current.commission)} icon="percent" tone="warn" />
            <Stat label="التوصيل" value={EGP(current.delivery)} icon="delivery_dining" tone="neutral" />
            <Stat label="التسويات" value={EGP(current.adjustments)} icon="tune" tone="neutral" />
            <Stat label="المرتجعات" value={EGP(current.refunds)} icon="undo" tone="danger" />
            <Stat label="الصافي المستحق" value={EGP(current.net)} icon="account_balance_wallet" tone="success" />
          </div>
        </Card>

        <div>
          <SectionTitle title="سجل التسويات" icon="history" />
          <Table head={["الكود", "الفترة", "الطلبات", "الإجمالي", "الصافي", "الحالة"]}>
            {settlements.map((s) => (
              <tr key={s.id} className="transition hover:bg-surface-container-low">
                <Td>{s.id}</Td>
                <Td>{s.period}</Td>
                <Td>{s.orders}</Td>
                <Td>{EGP(s.gross)}</Td>
                <Td>{EGP(s.net)}</Td>
                <Td><StatusBadge status={s.status} /></Td>
              </tr>
            ))}
          </Table>
        </div>
      </div>
    </DashboardShell>
  );
}
