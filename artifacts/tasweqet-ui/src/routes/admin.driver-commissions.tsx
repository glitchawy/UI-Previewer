import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Table, Td, Badge, Button, Icon, Field } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP, driverCommissionRules } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/driver-commissions")({
  head: () => ({
    meta: [
      { title: "عمولات المندوبين — طلبات بيتك" },
      { name: "description", content: "تحديد نسبة المندوب من التوصيل، مكافآت الذروة، وحصة المنصة." },
      { property: "og:title", content: "عمولات المندوبين — طلبات بيتك" },
      { property: "og:description", content: "تحديد نسبة المندوب من التوصيل، مكافآت الذروة، وحصة المنصة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminDriverCommissions,
});

function AdminDriverCommissions() {
  const [share, setShare] = useState(70);
  const [active, setActive] = useState<string[]>(driverCommissionRules.filter((r) => r.active).map((r) => r.id));
  const fee = 30;

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="سوبر أدمن — المنصة"
      nav={adminNav}
      title="عمولات المندوبين"
      actions={<Button icon="add">قاعدة جديدة</Button>}
    >
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="نسبة المندوب الافتراضية" value={`${share}%`} icon="percent" tone="warn" />
          <Stat label="حصة المنصة" value={`${100 - share}%`} icon="account_balance" tone="info" />
          <Stat label="أرباح المندوبين (الشهر)" value={EGP(184300)} icon="two_wheeler" tone="success" />
          <Stat label="مكافآت مدفوعة" value={EGP(12450)} icon="redeem" tone="neutral" />
        </div>

        <div className="grid grid-cols-1 gap-md xl:grid-cols-[1.2fr_1fr]">
          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle title="النسبة الافتراضية" icon="tune" />
            <input
              type="range"
              min={50}
              max={95}
              value={share}
              onChange={(e) => setShare(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex items-center justify-between font-label-md text-label-md text-on-surface-variant">
              <span>50%</span>
              <span className="font-headline-md text-headline-md text-on-surface">{share}%</span>
              <span>95%</span>
            </div>
            <Button icon="save" className="w-fit">حفظ النسبة</Button>
          </Card>

          <Card className="flex flex-col gap-sm p-md">
            <SectionTitle title={`مثال محسوب — توصيل ${EGP(fee)}`} icon="calculate" />
            {[
              { l: "رسوم التوصيل", v: EGP(fee) },
              { l: `نصيب المندوب (${share}%)`, v: EGP(Math.round((fee * share) / 100)) },
              { l: `حصة المنصة (${100 - share}%)`, v: EGP(Math.round((fee * (100 - share)) / 100)) },
            ].map((row) => (
              <div key={row.l} className="flex items-center justify-between rounded-button bg-surface-container-low px-3 py-2.5">
                <span className="font-label-md text-label-md text-on-surface-variant">{row.l}</span>
                <span className="font-label-lg text-label-lg text-on-surface">{row.v}</span>
              </div>
            ))}
            <p className="flex items-start gap-1 font-label-md text-label-md text-outline">
              <Icon name="info" className="text-[16px]" />
              مندوبين المطاعم لا تُطبّق عليهم عمولة المنصة.
            </p>
          </Card>
        </div>

        <div>
          <SectionTitle title="قواعد العمولة" icon="rule" />
          <Table head={["القاعدة", "النطاق", "المندوب", "المنصة", "مكافأة", "الحالة"]} mobile="scroll">
            {driverCommissionRules.map((r) => {
              const on = active.includes(r.id);
              return (
                <tr key={r.id} className="transition hover:bg-surface-container-low">
                  <Td>{r.name}</Td>
                  <Td>{r.scope}</Td>
                  <Td><Badge tone="success">{r.driverShare}%</Badge></Td>
                  <Td><Badge tone="info">{r.platformShare}%</Badge></Td>
                  <Td>{r.bonus}</Td>
                  <Td>
                    <button
                      onClick={() => setActive((a) => (on ? a.filter((x) => x !== r.id) : [...a, r.id]))}
                      className={`relative h-6 w-11 rounded-full transition ${on ? "bg-primary-container" : "bg-surface-container-high"}`}
                      aria-label="تشغيل/إيقاف"
                    >
                      <span className={`absolute top-0.5 size-5 rounded-full bg-surface-container-lowest transition ${on ? "right-0.5" : "right-5"}`} />
                    </button>
                  </Td>
                </tr>
              );
            })}
          </Table>
        </div>

        <Card className="flex flex-col gap-sm p-md">
          <SectionTitle title="إضافة قاعدة" icon="add_circle" />
          <div className="grid grid-cols-1 gap-sm md:grid-cols-4">
            <Field label="اسم القاعدة" placeholder="مثال: ساعات الذروة" icon="label" />
            <Field label="النطاق" placeholder="مثال: 6 م — 11 م" icon="schedule" />
            <Field label="نسبة المندوب %" placeholder="80" icon="percent" />
            <Field label="مكافأة لكل طلب" placeholder="5 ج.م" icon="redeem" />
          </div>
          <Button icon="check" className="w-fit">إضافة القاعدة</Button>
        </Card>
      </div>
    </DashboardShell>
  );
}
