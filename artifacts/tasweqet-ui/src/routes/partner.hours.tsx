import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Badge, Icon, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";

export const Route = createFileRoute("/partner/hours")({
  head: () => ({
    meta: [
      { title: "مواعيد العمل — طلبات بيتك" },
      { name: "description", content: "تحديد مواعيد عمل المطعم والاستثناءات." },
      { property: "og:title", content: "مواعيد العمل — طلبات بيتك" },
      { property: "og:description", content: "تحديد مواعيد عمل المطعم والاستثناءات." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerHours,
});

const days = ["السبت", "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"];

function PartnerHours() {
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="مواعيد العمل">
      <div className="tb-stagger flex flex-col gap-lg">
        <Badge tone="info" className="w-fit">
          <Icon name="info" className="text-[16px]" />
          المواعيد على مستوى المطعم وتُطبق على كل الفروع
        </Badge>

        <Card className="p-md">
          <SectionTitle title="أيام الأسبوع" icon="schedule" />
          <div className="flex flex-col gap-2">
            {days.map((d) => (
              <div key={d} className="flex flex-wrap items-center gap-3 rounded-button border border-outline-variant p-2.5">
                <span className="w-20 font-label-lg text-label-lg text-on-surface">{d}</span>
                <input type="time" defaultValue="10:00" className="rounded-button border border-outline-variant bg-surface-container-lowest px-2 py-1.5 font-body-md text-body-md" />
                <span className="text-on-surface-variant">إلى</span>
                <input type="time" defaultValue="02:00" className="rounded-button border border-outline-variant bg-surface-container-lowest px-2 py-1.5 font-body-md text-body-md" />
                <label className="mr-auto flex items-center gap-1.5 font-label-md text-label-md text-on-surface-variant">
                  <input type="checkbox" />
                  مغلق
                </label>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-md">
          <SectionTitle title="استثناءات وإجازات" icon="event_busy" action={<Button variant="outline" icon="add" className="!px-3 !py-1.5">إضافة استثناء</Button>} />
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between rounded-button border border-outline-variant p-2.5">
              <span className="font-body-md text-body-md text-on-surface">عيد الفطر — إجازة كاملة</span>
              <Icon name="delete" className="text-[18px] text-error" />
            </div>
          </div>
        </Card>

        <Button className="w-fit">حفظ المواعيد</Button>
      </div>
    </DashboardShell>
  );
}
