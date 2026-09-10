import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, EmptyState, Icon, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/data";
import { adminApi, type AdminCustomer, type Page } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });
function AdminCustomers() {
  const [page, setPage] = useState(1), [q, setQ] = useState(""), [data, setData] = useState<Page<AdminCustomer>>(), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController(); setData(undefined); setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "20", ...(q.trim() ? { q: q.trim() } : {}) });
    adminApi<Page<AdminCustomer>>(`/customers?${params}`, c.signal).then(setData).catch((e) => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); });
    return () => c.abort();
  }, [page, q, retry]);
  return <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="العملاء"><div className="flex flex-col gap-md">
    <Card className="flex items-center gap-2 bg-secondary-container p-md"><Icon name="privacy_tip" />بيانات العملاء متاحة للمشرفين المصرح لهم فقط.</Card>
    <Card className="p-md"><input value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder="ابحث باسم العميل أو رقم الهاتف" className="w-full rounded-button border border-outline-variant bg-transparent px-3 py-2" /></Card>
    {error ? <Card className="p-md text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry(x => x + 1)}>إعادة المحاولة</Button></Card> : !data ? <Card className="p-lg text-center">جاري تحميل العملاء…</Card> :
    !data.items.length ? <Card><EmptyState icon="group" title="لا يوجد عملاء" body="لا توجد نتائج مطابقة للبحث." /></Card> :
    <Table mobile="scroll" head={["الاسم", "الهاتف", "العنوان", "الطلبات", "الإنفاق", "المحفظة", "الانضمام"]}>{data.items.map(c => <tr key={c.id}><Td>{c.name || "بدون اسم"}</Td><Td><span dir="ltr">{c.phone}</span></Td><Td>{c.addressText || "—"}</Td><Td>{c.orders.toLocaleString("ar-EG")}</Td><Td>{EGP(c.spend)}</Td><Td>{EGP(c.walletBalance)}</Td><Td>{new Date(c.createdAt).toLocaleDateString("ar-EG")}</Td></tr>)}</Table>}
    {data ? <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>السابق</Button><span>صفحة {page.toLocaleString("ar-EG")} من {data.totalPages.toLocaleString("ar-EG")}</span><Button variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>التالي</Button></div> : null}
  </div></DashboardShell>;
}