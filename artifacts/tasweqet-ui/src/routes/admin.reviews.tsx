import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { DashboardShell, Card, SectionTitle, Stat, Badge, Button, Icon } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { reviews } from "@/lib/tb/data";

export const Route = createFileRoute("/admin/reviews")({
  head: () => ({
    meta: [
      { title: "التقييمات — طلبات بيتك" },
      { name: "description", content: "مراجعة تقييمات المطاعم والمنتجات والمندوبين وإخفاء المحتوى المخالف." },
      { property: "og:title", content: "التقييمات — طلبات بيتك" },
      { property: "og:description", content: "مراجعة تقييمات المطاعم والمنتجات والمندوبين وإخفاء المحتوى المخالف." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminReviews,
});

const tabs = ["الكل", "مطعم", "منتج", "مندوب", "طلب", "مخفي"] as const;

function Stars({ n }: { n: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" filled={i <= n} className={`text-[16px] ${i <= n ? "text-primary" : "text-outline-variant"}`} />
      ))}
    </span>
  );
}

function AdminReviews() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("الكل");
  const [hidden, setHidden] = useState<string[]>(reviews.filter((r) => r.hidden).map((r) => r.id));

  const list = reviews.filter((r) =>
    tab === "الكل" ? true : tab === "مخفي" ? hidden.includes(r.id) : r.targetType === tab,
  );
  const avg = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);

  return (
    <DashboardShell brand="طلبات بيتك" role="سوبر أدمن — المنصة" nav={adminNav} title="التقييمات">
      <div className="tb-stagger flex flex-col gap-lg">
        <div className="grid grid-cols-2 gap-sm md:grid-cols-4">
          <Stat label="متوسط التقييم" value={avg} icon="star" tone="warn" />
          <Stat label="إجمالي التقييمات" value="9,412" icon="reviews" tone="info" />
          <Stat label="تحتاج مراجعة" value="7" icon="flag" tone="danger" />
          <Stat label="تقييمات مخفية" value={String(hidden.length)} icon="visibility_off" tone="neutral" />
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 font-label-md text-label-md transition ${
                tab === t
                  ? "bg-primary-container text-on-primary-container"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-sm">
          <SectionTitle title="مراجعة المحتوى" icon="rate_review" />
          {list.map((r) => {
            const isHidden = hidden.includes(r.id);
            return (
              <Card key={r.id} className={`flex flex-col gap-sm p-md transition ${isHidden ? "opacity-70" : ""}`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-9 items-center justify-center rounded-full bg-secondary-container font-label-lg text-label-lg text-on-secondary-container">
                      {r.customer.charAt(0)}
                    </span>
                    <div>
                      <p className="font-label-lg text-label-lg text-on-surface">{r.customer}</p>
                      <p className="font-label-md text-label-md text-on-surface-variant">{r.at}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="neutral">{r.targetType}: {r.target}</Badge>
                    <Stars n={r.rating} />
                    {isHidden ? <Badge tone="danger">مخفي</Badge> : null}
                  </div>
                </div>

                <p className="font-body-md text-body-md text-on-surface">{r.text}</p>

                {r.reply ? (
                  <div className="rounded-card bg-surface-container-low p-sm">
                    <p className="mb-1 flex items-center gap-1 font-label-md text-label-md text-on-surface-variant">
                      <Icon name="storefront" className="text-[16px]" /> رد المطعم
                    </p>
                    <p className="font-body-md text-body-md text-on-surface">{r.reply}</p>
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant={isHidden ? "outline" : "danger"}
                    icon={isHidden ? "visibility" : "visibility_off"}
                    className="!px-3 !py-1.5"
                    onClick={() =>
                      setHidden((h) => (isHidden ? h.filter((x) => x !== r.id) : [...h, r.id]))
                    }
                  >
                    {isHidden ? "إظهار التقييم" : "إخفاء التقييم"}
                  </Button>
                  <Button variant="ghost" icon="history" className="!px-3 !py-1.5">سجل الإجراءات</Button>
                  <Badge tone="info"><Icon name="fingerprint" className="text-[14px]" />{r.id}</Badge>
                </div>
              </Card>
            );
          })}
        </div>

        <Card className="flex items-start gap-2 p-md">
          <Icon name="info" className="mt-0.5 text-[18px] text-secondary" />
          <p className="font-label-md text-label-md text-on-surface-variant">
            المطعم يمكنه الرد على التقييمات فقط. الإخفاء والحذف من صلاحيات الإدارة، وكل إجراء يُسجّل في سجل التدقيق. لا يوجد تقييم بين العملاء.
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
