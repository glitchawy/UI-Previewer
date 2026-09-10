import { createFileRoute, Link, Outlet, useChildMatches } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, EmptyState, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/data";
import { adminApi, type AdminOrder, type Page } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });
const statuses = ["", "pending", "confirmed", "preparing", "ready", "picked_up", "delivered", "cancelled"];
const labels: Record<string, string> = { "": "الكل", pending: "جديد", confirmed: "مؤكد", preparing: "قيد التحضير", ready: "جاهز", picked_up: "خرج للتوصيل", delivered: "تم التوصيل", cancelled: "ملغي" };

function AdminOrders() {
  const childMatches = useChildMatches();
  return childMatches.length ? <Outlet /> : <AdminOrdersList />;
}

function AdminOrdersList() {
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
  return <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="الطلبات">
    <div className="flex flex-col gap-md">
      <Card className="flex flex-col gap-sm p-md">
        <label className="font-label-lg text-on-surface-variant">بحث
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="رقم الطلب، العميل، الهاتف أو المطعم" className="mt-1 w-full rounded-button border border-outline-variant bg-transparent px-3 py-2" />
        </label>
        <div className="flex flex-wrap gap-2">{statuses.map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`rounded-full px-3 py-1.5 ${status === s ? "bg-primary-container" : "bg-surface-container"}`}>{labels[s]}</button>)}</div>
        <div className="flex gap-2">{[["", "كل طرق الدفع"], ["cash", "كاش"], ["card", "بطاقة"]].map(([v,l]) => <button key={v} onClick={() => { setPayment(v); setPage(1); }} className={`rounded-full px-3 py-1.5 ${payment === v ? "bg-secondary-container" : "bg-surface-container"}`}>{l}</button>)}</div>
      </Card>
      {error ? <Card className="p-md text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry((x) => x + 1)}>إعادة المحاولة</Button></Card> : !data ? <Card className="p-lg text-center">جاري تحميل الطلبات…</Card> :
      !data.items.length ? <Card><EmptyState icon="receipt_long" title="لا توجد طلبات" body="لا توجد نتائج مطابقة للفلاتر الحالية." /></Card> :
      <Table mobile="scroll" head={["الكود", "الوقت", "العميل", "المطعم", "الإجمالي", "الدفع", "الحالة"]}>{data.items.map((o) => <tr key={o.id}>
        <Td><Link to="/admin/orders/$id" params={{ id: String(o.id) }} className="text-secondary">{o.code}</Link></Td>
        <Td>{new Date(o.createdAt).toLocaleString("ar-EG")}</Td><Td>{o.customerName || o.customerPhone || "—"}</Td><Td>{o.restaurantName}</Td><Td>{EGP(o.total)}</Td>
        <Td>{o.paymentMethod === "cash" ? "كاش" : "بطاقة"} · {o.paymentStatus}</Td><Td><StatusBadge status={o.status.toUpperCase()} label={labels[o.status]} /></Td>
      </tr>)}</Table>}
      {data ? <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button><span>صفحة {page.toLocaleString("ar-EG")} من {data.totalPages.toLocaleString("ar-EG")}</span><Button variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>التالي</Button></div> : null}
    </div>
  </DashboardShell>;
}