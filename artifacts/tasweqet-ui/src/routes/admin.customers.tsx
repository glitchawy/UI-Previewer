import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, EmptyState, Icon, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminApi, type AdminCustomer, type Page } from "@/lib/admin-api";
import { adminCurrency, adminDate, adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/admin/customers")({ component: AdminCustomers });
function AdminCustomers() {
  const { t, locale } = useTranslation();
  const [page, setPage] = useState(1), [q, setQ] = useState(""), [data, setData] = useState<Page<AdminCustomer>>(), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  useEffect(() => {
    const c = new AbortController(); setData(undefined); setError("");
    const params = new URLSearchParams({ page: String(page), pageSize: "20", ...(q.trim() ? { q: q.trim() } : {}) });
    adminApi<Page<AdminCustomer>>(`/customers?${params}`, c.signal).then(setData).catch((e) => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); });
    return () => c.abort();
  }, [page, q, retry]);
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={t("العملاء", "Customers")}><div className="flex flex-col gap-md">
    <Card className="flex items-center gap-2 bg-secondary-container p-md"><Icon name="privacy_tip" />{t("بيانات العملاء متاحة للمشرفين المصرح لهم فقط.", "Customer data is available only to authorized administrators.")}</Card>
    <Card className="p-md"><input aria-label={t("بحث عن العملاء", "Search customers")} value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} placeholder={t("ابحث باسم العميل أو رقم الهاتف", "Search by customer name or phone")} className="w-full rounded-button border border-outline-variant bg-transparent px-3 py-2" /></Card>
    {error ? <Card className="p-md text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry(x => x + 1)}>{t("إعادة المحاولة", "Try again")}</Button></Card> : !data ? <Card className="p-lg text-center">{t("جاري تحميل العملاء…", "Loading customers…")}</Card> :
    !data.items.length ? <Card><EmptyState icon="group" title={t("لا يوجد عملاء", "No customers")} body={t("لا توجد نتائج مطابقة للبحث.", "No results match your search.")} /></Card> :
    <Table mobile="scroll" head={[t("الاسم", "Name"), t("الهاتف", "Phone"), t("العنوان", "Address"), t("الطلبات", "Orders"), t("الإنفاق", "Spend"), t("المحفظة", "Wallet"), t("الانضمام", "Joined")]}>{data.items.map(c => <tr key={c.id}><Td>{c.name || t("بدون اسم", "Unnamed")}</Td><Td><span dir="ltr">{c.phone}</span></Td><Td>{c.addressText || "—"}</Td><Td>{adminNumber(c.orders, locale)}</Td><Td>{adminCurrency(c.spend, locale)}</Td><Td>{adminCurrency(c.walletBalance, locale)}</Td><Td>{adminDate(c.createdAt, locale)}</Td></tr>)}</Table>}
    {data ? <div className="flex items-center justify-between"><Button variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>{t("السابق", "Previous")}</Button><span>{t("صفحة", "Page")} {adminNumber(page, locale)} {t("من", "of")} {adminNumber(data.totalPages, locale)}</span><Button variant="outline" disabled={page >= data.totalPages} onClick={() => setPage(page + 1)}>{t("التالي", "Next")}</Button></div> : null}
  </div></DashboardShell>;
}