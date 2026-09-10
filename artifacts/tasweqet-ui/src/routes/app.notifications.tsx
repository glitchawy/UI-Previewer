import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AppBar, MobileShell, Icon, Card, Button } from "@/components/tb/shell";
import { customerTabs } from "@/lib/tb/nav";
import {
  getListNotificationsQueryKey,
  useListNotifications,
  useReadAllNotifications,
  useReadNotification,
} from "@workspace/api-client-react";

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
  const queryClient = useQueryClient();
  const notifications = useListNotifications({ page: 1, pageSize: 50 });
  const refresh = () => queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey({ page: 1, pageSize: 50 }) });
  const readOne = useReadNotification({ mutation: { onSuccess: refresh } });
  const readAll = useReadAllNotifications({ mutation: { onSuccess: refresh } });
  const items = notifications.data?.items ?? [];

  function linkFor(entityType: string | null | undefined, entityId: number | null | undefined) {
    if (!entityId || !Number.isInteger(entityId)) return null;
    if (entityType === "order") return `/app/orders/${entityId}`;
    if (entityType === "restaurant") return `/app/restaurant/${entityId}`;
    return null;
  }

  const renderList = () => (
    <div className="tb-stagger flex flex-col gap-2">
      {items.map((n) => {
        const href = linkFor(n.entityType, n.entityId);
        const content = (
        <Card
          className={`flex items-start gap-3 p-3 ${!n.readAt ? "border-secondary bg-secondary-container/40" : ""}`}
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
            <Icon name={n.eventType.includes("ORDER") ? "receipt_long" : "notifications"} className="text-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-label-lg text-label-lg text-on-surface">{n.title}</p>
            <p className="break-words font-body-md text-body-md text-on-surface-variant">{n.body}</p>
            <p className="mt-1 font-label-md text-label-md text-outline">
              {new Intl.DateTimeFormat("ar-EG", { dateStyle: "medium", timeStyle: "short" }).format(new Date(n.createdAt))}
            </p>
          </div>
          {!n.readAt ? <span className="mt-1 size-2 shrink-0 rounded-full bg-error" /> : null}
        </Card>
        );
        return href ? (
          <a
            key={n.id}
            href={href}
            onClick={(event) => {
              if (n.readAt) return;
              event.preventDefault();
              void readOne.mutateAsync({ id: n.id })
                .catch(() => undefined)
                .then(() => window.location.assign(href));
            }}
          >
            {content}
          </a>
        ) : (
          <button key={n.id} type="button" className="text-right" onClick={() => { if (!n.readAt) readOne.mutate({ id: n.id }); }}>
            {content}
          </button>
        );
      })}
    </div>
  );

  return (
    <MobileShell tabs={customerTabs}>
      <AppBar title="الإشعارات" back="/app" />
      <div className="flex flex-col gap-lg p-md">
        <div className="flex min-h-10 items-center justify-between gap-2">
          <p className="font-label-md text-label-md text-on-surface-variant">
            {notifications.data ? `${notifications.data.unreadCount} غير مقروء` : "جارٍ التحميل..."}
          </p>
          {(notifications.data?.unreadCount ?? 0) > 0 ? (
            <Button variant="ghost" className="px-2 py-1" onClick={() => readAll.mutate()} disabled={readAll.isPending}>
              تحديد الكل كمقروء
            </Button>
          ) : null}
        </div>

        {notifications.isLoading ? (
          <Card className="p-md text-center font-body-md text-body-md text-on-surface-variant">جارٍ تحميل الإشعارات...</Card>
        ) : notifications.isError ? (
          <Card className="flex flex-col items-center gap-3 p-md text-center">
            <p className="font-body-md text-body-md text-error">تعذر تحميل الإشعارات</p>
            <Button variant="outline" onClick={() => notifications.refetch()}>إعادة المحاولة</Button>
          </Card>
        ) : items.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-lg text-center">
            <Icon name="notifications_off" className="text-[32px] text-outline" />
            <p className="font-body-md text-body-md text-on-surface-variant">لا توجد إشعارات حتى الآن</p>
          </Card>
        ) : renderList()}
      </div>
    </MobileShell>
  );
}
