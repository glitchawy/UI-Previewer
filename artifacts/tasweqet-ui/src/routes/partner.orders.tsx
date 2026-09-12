import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  getListPartnerOrdersQueryKey,
  type OrderStatus,
  useListPartnerOrders,
} from "@workspace/api-client-react";
import { Badge, Button, DashboardShell, EmptyState, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { orderStatusLabel } from "@/lib/tb/orders";
import { formatCurrency, formatDateTime } from "@/lib/tb/locale-format";
import { useTranslation, translate } from "@/lib/i18n";

export const Route = createFileRoute("/partner/orders")({
  head: () => ({
    meta: [
      { title: translate("الطلبات — طلبات بيتك", "Orders — Talabat Betak") },
      { name: "description", content: translate("متابعة طلبات مطعمك الواردة من طلبات بيتك.", "Track incoming restaurant orders from Talabat Betak.") },
    ],
  }),
  component: PartnerOrdersRoute,
});

const filters: Array<"all" | OrderStatus> = [
  "all", "pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled",
];

function PartnerOrdersRoute() {
  const isList = useRouterState({ select: (state) => state.location.pathname.endsWith("/partner/orders") });
  return isList ? <PartnerOrdersList /> : <Outlet />;
}

function PartnerOrdersList() {
  const { t, locale } = useTranslation();
  const partnerNav = usePartnerNav();
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const params = { page: 1, pageSize: 50 };
  const query = useListPartnerOrders(params, {
    query: { queryKey: getListPartnerOrdersQueryKey(params), refetchInterval: 15_000 },
  });
  const list = (query.data ?? []).filter((order) => filter === "all" || order.status === filter);

  return (
    <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب مطعم", "Restaurant owner")} nav={partnerNav} title={t("الطلبات", "Orders")}>
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit"><Icon name="sync" className="text-[16px]" />{t("الطلبات تتحدث تلقائياً كل ١٥ ثانية", "Orders refresh automatically every 15 seconds")}</Badge>
        <div className="flex flex-wrap gap-2">
          {filters.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                filter === status ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {status === "all" ? t("الكل", "All") : orderStatusLabel(status, t)}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <div className="flex h-52 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[34px] text-primary" /></div>
        ) : query.isError ? (
           <EmptyState icon="error" title={t("تعذر تحميل الطلبات", "Could not load orders")} body={t("تأكد من تسجيل الدخول وحاول مرة أخرى", "Check your sign-in and try again")} />
        ) : list.length === 0 ? (
           <EmptyState icon="receipt_long" title={t("مفيش طلبات في الحالة دي", "No orders in this status")} body={t("الطلبات الجديدة هتظهر هنا تلقائياً", "New orders will appear here automatically")} />
        ) : (
           <Table head={[t("الكود", "Code"), t("الوقت", "Time"), t("العميل", "Customer"), t("الفرع", "Branch"), t("الإجمالي", "Total"), t("الدفع", "Payment"), t("الحالة", "Status"), ""]}>
            {list.map((order) => (
              <tr key={order.id} className="transition hover:bg-surface-container-low">
                <Td>{order.code}</Td>
                 <Td>{formatDateTime(order.createdAt, locale)}</Td>
                 <Td>{order.customerName || t("عميل", "Customer")}<span className="block font-label-md text-[11px] text-outline">{order.customerPhone || "—"}</span></Td>
                 <Td>{order.branchName || t("الفرع الرئيسي", "Main branch")}</Td>
                 <Td>{formatCurrency(order.total, locale)}</Td>
                 <Td>{order.paymentMethod === "cash" ? t("كاش", "Cash") : order.paymentStatus === "paid" ? t("أونلاين — مدفوع", "Online — paid") : t("أونلاين", "Online")}</Td>
                 <Td><StatusBadge status={order.status} label={orderStatusLabel(order.status, t)} /></Td>
                 <Td><Link to="/partner/orders/$id" params={{ id: String(order.id) }}><Button variant="outline" icon="visibility" className="!px-3 !py-1.5">{t("التفاصيل", "Details")}</Button></Link></Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </DashboardShell>
  );
}