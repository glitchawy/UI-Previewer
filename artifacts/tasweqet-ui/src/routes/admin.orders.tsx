import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, EmptyState, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminApi, type AdminOrder, type Page } from "@/lib/admin-api";
import { adminCurrency, adminDateTime, adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });
const statuses = ["", "pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"];
const statusLabel = (status: string, t: ReturnType<typeof useTranslation>["t"]) => ({
  "": t("الكل", "All"),
  pending: t("جديد", "New"),
  confirmed: t("مؤكد", "Confirmed"),
  preparing: t("قيد التحضير", "Preparing"),
  ready: t("جاهز", "Ready"),
  picked_up: t("خرج للتوصيل", "Out for delivery"),
  delivered: t("تم التوصيل", "Delivered"),
  cancelled: t("ملغي", "Cancelled"),
}[status] ?? status);
const paymentLabel = (status: string, t: ReturnType<typeof useTranslation>["t"]) => ({
  pending: t("في انتظار الدفع", "Payment pending"),
  paid: t("مدفوع", "Paid"),
  failed: t("فشل الدفع", "Payment failed"),
  refunded: t("تم الاسترداد", "Refunded"),
}[status] ?? status);

function AdminOrders() {
  const childMatches = useChildMatches();
  return childMatches.length ? <Outlet /> : <AdminOrdersList />;
}

function AdminOrdersList() {
  const { t, locale } = useTranslation();
  const [page, setPage] = useState(1), [q, setQ] = useState(""), [status, setStatus] = useState(""), [payment, setPayment] = useState("");
  const [data, setData] = useState<Page<AdminOrder>>(), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    const controller = new AbortController(); setError(""); setData(undefined);
    const params = new URLSearchParams({ page: String(page), pageSize: "20" });
    if (q.trim()) params.set("q", q.trim()); if (status) params.set("status", status); if (payment) params.set("payment", payment);
    adminApi<Page<AdminOrder>>(`/orders?${params}`, controller.signal).then(setData).catch((e) => {
      if (e instanceof Error && e.name !== "AbortError") setError(e.message);
    });
    return () => controller.abort();
  }, [page, q, status, payment, retry]);
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={t("الطلبات", "Orders")}>
    <div className="flex flex-col gap-md">
      <Card className="flex flex-col gap-sm p-md">
        <label className="font-label-lg text-on-surface-variant">{t("بحث", "Search")}
          <input aria-label={t("بحث في الطلبات", "Search orders")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("رقم الطلب، العميل، الهاتف أو المطعم", "Order number, customer, phone, or restaurant")} className="mt-1 w-full rounded-button border border-outline-variant bg-transparent px-3 py-2" />
        </label>
        <div className="flex flex-wrap gap-2">{statuses.map((s) => <button key={s} aria-pressed={status === s} onClick={() => { setStatus(s); setPage(1); }} className={`rounded-full px-3 py-1.5 ${status === s ? "bg-primary-container" : "bg-surface-container"}`}>{statusLabel(s, t)}</button>)}</div>
        <div className="flex gap-2">{[["", t("كل طرق الدفع", "All payment methods")], ["cash", t("كاش", "Cash")], ["card", t("بطاقة", "Card")]].map(([v,l]) => <button key={v} aria-pressed={payment === v} onClick={() => { setPayment(v); setPage(1); }} className={`rounded-full px-3 py-1.5 ${payment === v ? "bg-secondary-container" : "bg-surface-container"}`}>{l}</button>)}</div>
      </Card>
      {error ? <Card className="p-md text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry((x) => x + 1)}>{t("إعادة المحاولة", "Try again")}</Button></Card> : !data ? <Card className="p-lg text-center">{t("جاري تحميل الطلبات…", "Loading orders…")}</Card> :
      !data.items.length ? <Card><EmptyState icon="receipt_long" title={t("لا توجد طلبات", "No orders")} body={t("لا توجد نتائج مطابقة للفلاتر الحالية.", "No results match the current filters.")} /></Card> :
      <Table mobile="scroll" head={[t("الكود", "Code"), t("الوقت", "Time"), t("العميل", "Customer"), t("المطعم", "Restaurant"), t("الإجمالي", "Total"), t("الدفع", "Payment"), t("الحالة", "Status")]}>{data.items.map((o) => <tr key={o.id}>
        <Td><Link to="/admin/orders/$id" params={{ id: String(o.id) }} className="text-secondary">{o.code}</Link></Td>
        <Td>{adminDateTime(o.createdAt, locale)}</Td><Td>{o.customerName || o.customerPhone || "—"}</Td><Td>{o.restaurantName}</Td><Td>{adminCurrency(o.total, locale)}</Td>
        <Td>{o.paymentMethod === "cash" ? t("كاش", "Cash") : t("بطاقة", "Card")} · {paymentLabel(o.paymentStatus, t)}</Td><Td><StatusBadge status={o.status.toUpperCase()} label={statusLabel(o.status, t)} /></Td>
      </tr>)}</Table>}
      {data ? <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("السابق", "Previous")}</Button><span>{t("صفحة", "Page")} {adminNumber(page, locale)} {t("من", "of")} {adminNumber(data.totalPages, locale)}</span><Button variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>{t("التالي", "Next")}</Button></div> : null}
    </div>
  </DashboardShell>;
}