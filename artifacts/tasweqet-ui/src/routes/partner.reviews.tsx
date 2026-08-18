import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Badge, Icon, Bars } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { reviews } from "@/lib/tb/data";

export const Route = createFileRoute("/partner/reviews")({
  head: () => ({
    meta: [
      { title: "التقييمات — طلبات بيتك" },
      { name: "description", content: "متابعة تقييمات العملاء والرد عليها." },
      { property: "og:title", content: "التقييمات — طلبات بيتك" },
      { property: "og:description", content: "متابعة تقييمات العملاء والرد عليها." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PartnerReviews,
});

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Icon key={i} name="star" filled={i < n} className={`text-[16px] ${i < n ? "text-primary" : "text-outline"}`} />
      ))}
    </div>
  );
}

function PartnerReviews() {
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const dist = [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);
  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم — برجر هاوس" nav={partnerNav} title="التقييمات">
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-1 gap-md md:grid-cols-3">
          <Card className="flex flex-col items-center justify-center p-md">
            <p className="font-headline-lg text-headline-lg text-on-surface">{avg}</p>
            <Stars n={Math.round(Number(avg))} />
            <p className="font-label-md text-label-md text-on-surface-variant">{reviews.length} تقييم</p>
          </Card>
          <Card className="p-md md:col-span-2">
            <SectionTitle title="توزيع التقييمات" icon="bar_chart" />
            <Bars values={dist} labels={["5", "4", "3", "2", "1"]} />
          </Card>
        </div>

        <div className="flex flex-col gap-md">
          {reviews.map((r) => (
            <Card key={r.id} className="flex flex-col gap-2 p-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">{r.customer}</p>
                  <p className="font-label-md text-label-md text-on-surface-variant">{r.at}</p>
                </div>
                <Badge tone="neutral">{r.targetType}: {r.target}</Badge>
              </div>
              <Stars n={r.rating} />
              <p className="font-body-md text-body-md text-on-surface">{r.text}</p>
              {r.reply ? (
                <div className="rounded-button bg-secondary-container p-2.5 text-on-secondary-container">
                  <span className="font-label-md text-label-md">رد المطعم:</span>
                  <p className="font-body-md text-body-md">{r.reply}</p>
                </div>
              ) : (
                <textarea placeholder="اكتب رد المطعم..." className="min-h-16 rounded-button border border-outline-variant bg-surface-container-lowest p-2.5 font-body-md text-body-md outline-none" />
              )}
            </Card>
          ))}
        </div>
      </div>
    </DashboardShell>
  );
}
