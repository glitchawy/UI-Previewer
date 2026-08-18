import { createFileRoute } from "@tanstack/react-router";
import { AppBar, MobileShell, Icon, Card, Button } from "@/components/tb/shell";
import { notifications } from "@/lib/tb/data";
import { customerTabs } from "@/lib/tb/nav";

export const Route = createFileRoute("/app/notifications")({
  head: () => ({
    meta: [
      { title: "طلبات بيتك | الإشعارات" },
      { name: "description", content: "تابع آخر تحديثات طلباتك والعروض" },
      { property: "og:title", content: "طلبات بيتك | الإشعارات" },
      { property: "og:description", content: "تابع آخر تحديثات طلباتك والعروض" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AppNotifications,
});

function AppNotifications() {
  const today = notifications.filter((n) => n["at"] !== "أمس");
  const yesterday = notifications.filter((n) => n["at"] === "أمس");

  const renderList = (list: typeof notifications) => (
    <div className="tb-stagger flex flex-col gap-2">
      {list.map((n) => (
        <Card
          key={n["id"]}
          className={`flex items-start gap-3 p-3 ${n["unread"] ? "border-secondary bg-secondary-container/40" : ""}`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name={n["icon"]} className="text-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-label-lg text-label-lg text-on-surface">{n["title"]}</p>
            <p className="font-body-md text-body-md text-on-surface-variant">{n["body"]}</p>
            <p className="mt-1 font-label-md text-label-md text-outline">{n["at"]}</p>
          </div>
          {n["unread"] ? <span className="mt-1 size-2 shrink-0 rounded-full bg-error" /> : null}
        </Card>
      ))}
    </div>
  );

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="الإشعارات" back="/app" />
      <div className="flex flex-col gap-lg p-md">
        <Card className="flex items-center gap-3 bg-tertiary-container p-3 text-on-tertiary-container">
          <Icon name="notifications_active" className="text-[20px]" />
          <span className="flex-1 font-label-md text-label-md">فعّل إشعارات الدفع علشان توصلك آخر أخبار طلباتك أول بأول</span>
          <Button variant="ghost" className="shrink-0 px-2 py-1 text-on-tertiary-container">
            تفعيل
          </Button>
        </Card>

        {today.length ? (
          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">اليوم</h2>
            {renderList(today)}
          </section>
        ) : null}

        {yesterday.length ? (
          <section>
            <h2 className="mb-sm font-headline-md text-headline-md text-on-surface">أمس</h2>
            {renderList(yesterday)}
          </section>
        ) : null}
      </div>
    </MobileShell>
  );
}
