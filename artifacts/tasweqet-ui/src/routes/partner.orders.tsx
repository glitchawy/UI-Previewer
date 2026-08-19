import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import {
  getListPartnerOrdersQueryKey,
  type OrderStatus,
  useListPartnerOrders,
} from "@workspace/api-client-react";
import { Badge, Button, DashboardShell, EmptyState, Icon, StatusBadge, Table, Td } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { EGP, formatOrderDate, orderStatusLabels } from "@/lib/tb/orders";

export const Route = createFileRoute("/partner/orders")({
  head: () => ({
    meta: [
      { title: "الطلبات — طلبات بيتك" },
      { name: "description", content: "متابعة طلبات مطعمك الواردة من طلبات بيتك." },
    ],
  }),
  component: PartnerOrdersRoute,
});

const filters: Array<"all" | OrderStatus> = [
  "all", "pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled",
];

function maskPhone(phone: string | null) {
  return phone ? `${phone.slice(0, 4)} •• ${phone.slice(-4)}` : "—";
}

function PartnerOrdersRoute() {
  const isList = useRouterState({ select: (state) => state.location.pathname.endsWith("/partner/orders") });
  return isList ? <PartnerOrdersList /> : <Outlet />;
}

function PartnerOrdersList() {
  const [filter, setFilter] = useState<"all" | OrderStatus>("all");
  const query = useListPartnerOrders({
    query: { queryKey: getListPartnerOrdersQueryKey(), refetchInterval: 15_000 },
  });
  const list = (query.data ?? []).filter((order) => filter === "all" || order.status === filter);

  return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="الطلبات">
      <div className="tb-stagger flex flex-col gap-md">
        <Badge tone="info" className="w-fit"><Icon name="sync" className="text-[16px]" />الطلبات تتحدث تلقائياً كل ١٥ ثانية</Badge>
        <div className="flex flex-wrap gap-2">
          {filters.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`rounded-full px-3 py-1.5 font-label-md text-label-md transition ${
                filter === status ? "bg-primary-container text-on-primary-container" : "bg-surface-container text-on-surface-variant hover:bg-surface-container-low"
              }`}
            >
              {status === "all" ? "الكل" : orderStatusLabels[status]}
            </button>
          ))}
        </div>

        {query.isLoading ? (
          <div className="flex h-52 items-center justify-center"><Icon name="progress_activity" className="animate-spin text-[34px] text-primary" /></div>
        ) : query.isError ? (
          <EmptyState icon="error" title="تعذر تحميل الطلبات" body="تأكد من تسجيل الدخول وحاول مرة أخرى" />
        ) : list.length === 0 ? (
          <EmptyState icon="receipt_long" title="مفيش طلبات في الحالة دي" body="الطلبات الجديدة هتظهر هنا تلقائياً" />
        ) : (
          <Table head={["الكود", "الوقت", "العميل", "الفرع", "الإجمالي", "الدفع", "الحالة", ""]}>
            {list.map((order) => (
              <tr key={order.id} className="transition hover:bg-surface-container-low">
                <Td>{order.code}</Td>
                <Td>{formatOrderDate(order.createdAt)}</Td>
                <Td>{order.customerName || "عميل"}<span className="block font-label-md text-[11px] text-outline">{maskPhone(order.customerPhone)}</span></Td>
                <Td>{order.branchName || "الفرع الرئيسي"}</Td>
                <Td>{EGP(order.total)}</Td>
                <Td>{order.paymentMethod === "cash" ? "كاش" : order.paymentStatus === "paid" ? "أونلاين — مدفوع" : "أونلاين"}</Td>
                <Td><StatusBadge status={order.status} label={orderStatusLabels[order.status]} /></Td>
                <Td><Link to="/partner/orders/$id" params={{ id: String(order.id) }}><Button variant="outline" icon="visibility" className="!px-3 !py-1.5">التفاصيل</Button></Link></Td>
              </tr>
            ))}
          </Table>
        )}
      </div>
    </DashboardShell>
  );
}