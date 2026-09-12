import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";
import { adminDateTime } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Log = {
  id: number;
  actorAdminId: number;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string;
  before: unknown;
  after: unknown;
  reason: string | null;
  requestId: string;
  createdAt: string;
};

export const Route = createFileRoute("/admin/audit-logs")({ component: PageView });

function PageView() {
  const { t, locale } = useTranslation();
  const actionLabel = (action: string) => ({
    "order.driver_assigned": t("إسناد المندوب للطلب", "Driver assigned to order"),
    "order.driver_unassigned": t("إلغاء إسناد المندوب", "Driver unassigned"),
    "order.driver_reoffered": t("إعادة عرض الطلب", "Order reoffered"),
    "platform_settings.updated": t("تحديث إعدادات المنصة", "Platform settings updated"),
    "delivery_pricing.created": t("إنشاء شريحة توصيل", "Delivery pricing tier created"),
    "delivery_pricing.updated": t("تحديث شريحة توصيل", "Delivery pricing tier updated"),
    "restaurant_commission.updated": t("تحديث عمولة المطعم", "Restaurant commission updated"),
    "driver_commission.created": t("إنشاء قاعدة عمولة المندوب", "Driver commission rule created"),
    "restaurant_settlement.generated": t("إنشاء تسوية المطعم", "Restaurant settlement generated"),
    "notification.composed": t("إنشاء إشعار", "Notification composed"),
    "notification.replayed": t("إعادة إرسال إشعار", "Notification replayed"),
    "notification.cancelled": t("إلغاء إشعار", "Notification cancelled"),
    "review.moderated": t("إدارة تقييم", "Review moderated"),
  }[action] ?? (action === "restaurant_settlement.approved"
    ? t("اعتماد تسوية المطعم", "Restaurant settlement approved")
    : action === "restaurant_settlement.paid"
      ? t("تعليم تسوية المطعم كمدفوعة", "Restaurant settlement marked paid")
      : action));
  const entityLabel = (entity: string) => ({
    order: t("طلب", "Order"),
    platform_setting: t("إعداد منصة", "Platform setting"),
    delivery_pricing_tier: t("شريحة توصيل", "Delivery pricing tier"),
    restaurant: t("مطعم", "Restaurant"),
    driver_commission_rule: t("قاعدة عمولة مندوب", "Driver commission rule"),
    restaurant_settlement: t("تسوية مطعم", "Restaurant settlement"),
    notification_outbox: t("إشعار", "Notification"),
    order_review: t("تقييم طلب", "Order review"),
  }[entity] ?? entity);
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<Page<Log>>();
  const [error, setError] = useState("");
  const load = useCallback(() => adminRequest<Page<Log>>(`/admin/audit-logs?page=${page}&pageSize=20&q=${encodeURIComponent(q)}`)
    .then(setData)
    .catch((e) => setError(e instanceof Error ? e.message : t("تعذر تحميل السجل", "Unable to load the audit log"))), [page, q, t]);
  useEffect(() => { void load(); }, [load]);

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("سجل التدقيق", "Audit log")}>
      <Card className="flex gap-2 p-md">
        <Field label={t("بحث", "Search")} value={q} onChange={(e) => setQ(e.target.value)} />
        <Button onClick={() => { setPage(1); void load(); }}>{t("بحث", "Search")}</Button>
      </Card>
      <SectionTitle title={t("سجل أعمال غير قابل للحذف", "Immutable activity log")} icon="history" />
      {error ? <Card className="p-md text-error">{error}<Button onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card> :
        !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
          !data.items.length ? <Card className="p-md">{t("لا توجد سجلات.", "No records.")}</Card> :
            <Table head={[t("الوقت", "Time"), t("الفاعل", "Actor"), t("الإجراء", "Action"), t("الكيان", "Entity"), t("السبب", "Reason"), t("Request ID", "Request ID")]} mobile="scroll">
              {data.items.map((x) => <tr key={x.id}>
                <Td>{adminDateTime(x.createdAt, locale)}</Td><Td>{x.actorName || x.actorAdminId}</Td><Td>{actionLabel(x.action)}</Td>
                <Td>{entityLabel(x.entityType)} #{x.entityId}</Td><Td>{x.reason || "—"}</Td><Td>{x.requestId}</Td>
              </tr>)}
            </Table>}
      {data && <div className="flex justify-end gap-2">
        <Button disabled={page === 1} onClick={() => setPage((p) => p - 1)}>{t("السابق", "Previous")}</Button>
        <Button disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>{t("التالي", "Next")}</Button>
      </div>}
    </DashboardShell>
  );
}