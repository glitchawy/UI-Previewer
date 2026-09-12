import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, SectionTitle, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminApi, adminRequest } from "@/lib/admin-api";
import { adminCurrency, adminDateTime, adminIntlLocale } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Detail = {
  id: number; code: string; status: string; paymentMethod: string; paymentStatus: string;
  restaurantName: string; branchName: string | null; deliveryAddressText: string; notes: string | null;
  subtotal: number; deliveryFee: number; total: number; walletAmountUsed: number; externalAmountDue: number; createdAt: string;
  customer: { id: number; name: string | null; phone: string | null; walletBalance: number };
  restaurant: { id: number; name: string; status: string | null }; driver: { id: number; name: string; phone: string | null; area: string } | null;
  dispatchStatus: { state: "not_started" | "actively_offered" | "retry_scheduled" | "assigned" | "terminal"; nextRetryAt: string | null; offerExpiresAt: string | null; reason: string | null };
  items: { id: number; productName: string; variantName: string | null; quantity: number; unitPrice: number; lineTotal: number; addons: { name: string; price: number }[] }[];
  history: { id: number; status: string; createdAt: string }[];
  relatedOrders: { id: number; code: string; restaurantName: string; total: number; status: string }[];
  refunds: { id: number; amount: number; status: string; reason: string; createdAt: string }[];
};
type EligibleDriver = { id: number; fullName: string; area: string; currentWorkload: number; distanceKm: number; locationUpdatedAt: string };
export const Route = createFileRoute("/admin/orders/$id")({ component: AdminOrderDetail });
function AdminOrderDetail() {
  const { t, locale } = useTranslation();
  const { id } = Route.useParams(); const [data, setData] = useState<Detail>(), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const [drivers,setDrivers]=useState<EligibleDriver[]>([]),[dispatchError,setDispatchError]=useState(""),[busy,setBusy]=useState(false);
  useEffect(() => { const c = new AbortController(); setError(""); setData(undefined); adminApi<Detail>(`/orders/${id}`, c.signal).then(setData).catch(e => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); }); return () => c.abort(); }, [id, retry]);
  useEffect(()=>{if(data?.status!=="ready")return;const c=new AbortController();adminApi<EligibleDriver[]>(`/orders/${id}/eligible-drivers`,c.signal).then(setDrivers).catch(e=>{if(e instanceof Error&&e.name!=="AbortError")setDispatchError(e.message)});return()=>c.abort()},[id,data?.status,retry]);
  async function dispatch(action:"assign"|"unassign"|"reoffer",driverProfileId?:number){
    const label=action==="assign"?t("إسناد الطلب", "Assign order"):action==="unassign"?t("إلغاء الإسناد", "Unassign order"):t("إعادة عرض الطلب", "Reoffer order");
    if(!window.confirm(`${t("تأكيد", "Confirm")} ${label}؟`))return;
    const reason=window.prompt(t("اكتب سبب العملية للسجل الإداري:", "Enter a reason for the admin audit log:"));
    if(!reason)return;
    setBusy(true);setDispatchError("");
    try{await adminRequest(`/admin/core/orders/${id}/dispatch`,{method:"POST",body:JSON.stringify({action,driverProfileId,reason})});setRetry(x=>x+1)}
     catch(e){setDispatchError(e instanceof Error?e.message:t("تعذر تنفيذ الإسناد", "Unable to update assignment"))}finally{setBusy(false)}
  }
  const orderStatusLabel = (status: string) => ({
    pending: t("جديد", "New"), confirmed: t("مؤكد", "Confirmed"), preparing: t("قيد التحضير", "Preparing"),
    ready: t("جاهز", "Ready"), picked_up: t("خرج للتوصيل", "Out for delivery"), delivered: t("تم التوصيل", "Delivered"),
    cancelled: t("ملغي", "Cancelled"),
  }[status] ?? status);
  const paymentStatusLabel = (status: string) => ({
    pending: t("في انتظار الدفع", "Payment pending"), paid: t("مدفوع", "Paid"),
    failed: t("فشل الدفع", "Payment failed"), refunded: t("تم الاسترداد", "Refunded"),
  }[status] ?? status);
  const paymentMethodLabel = (method: string) => ({
    cash: t("كاش", "Cash"), card: t("بطاقة", "Card"), wallet: t("محفظة", "Wallet"),
  }[method] ?? method);
  const refundStatusLabel = (status: string) => ({
    pending: t("قيد المراجعة", "Pending review"), processing: t("جاري التنفيذ", "Processing"),
    approved: t("تمت الموافقة", "Approved"), rejected: t("مرفوض", "Rejected"), failed: t("تعذر التنفيذ", "Failed"),
  }[status] ?? status);
  const dispatchStateLabel = (state: string) => ({
    actively_offered: t("يوجد عرض توصيل نشط بانتظار الرد", "An active delivery offer is awaiting a response"),
    retry_scheduled: t("لا يوجد مندوب مؤهل الآن؛ إعادة المحاولة مجدولة", "No eligible driver is available; retry scheduled"),
    terminal: t("انتهت مرحلة الإسناد", "Assignment has ended"),
  }[state] ?? t("لم يتم تعيين مندوب", "No driver assigned"));
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={data ? `${t("الطلب", "Order")} ${data.code}` : t("تفاصيل الطلب", "Order details")}>
    {error ? <Card className="p-lg text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry(x => x + 1)}>{t("إعادة المحاولة", "Try again")}</Button></Card> : !data ? <Card className="p-xl text-center">{t("جاري تحميل تفاصيل الطلب…", "Loading order details…")}</Card> :
    <div className="flex flex-col gap-md">
      <Card className="flex flex-wrap items-start justify-between gap-sm p-md"><div><p className="font-headline-md">{data.customer.name || t("عميل بدون اسم", "Unnamed customer")}</p><p dir="ltr" className="text-on-surface-variant">{data.customer.phone}</p><p>{data.deliveryAddressText}</p></div><div className="flex gap-2"><StatusBadge status={data.status.toUpperCase()} label={orderStatusLabel(data.status)} /><StatusBadge status={data.paymentStatus.toUpperCase()} label={paymentStatusLabel(data.paymentStatus)} /></div></Card>
      <Card className="p-md"><SectionTitle title={t("المطعم والتوصيل", "Restaurant & delivery")} icon="storefront" /><p>{data.restaurant.name} {data.branchName ? `— ${data.branchName}` : ""}</p><p className="text-on-surface-variant">{data.driver ? `${t("المندوب", "Driver")}: ${data.driver.name} · ${data.driver.phone || ""} · ${data.driver.area}` : dispatchStateLabel(data.dispatchStatus.state)}</p></Card>
      {data.status==="ready"?<Card className="p-md"><SectionTitle title={t("التحكم في الإسناد", "Assignment controls")} icon="local_shipping" />{dispatchError?<p className="mb-sm text-error">{dispatchError}</p>:null}{data.driver?<div className="flex flex-wrap gap-2"><Button variant="danger" disabled={busy} onClick={()=>dispatch("unassign")}>{t("إلغاء الإسناد", "Unassign")}</Button><Button variant="outline" disabled={busy} onClick={()=>dispatch("reoffer")}>{t("إلغاء وإعادة العرض", "Unassign and reoffer")}</Button></div>:drivers.length?<div className="flex flex-col gap-2">{drivers.map(driver=><div key={driver.id} className="flex items-center justify-between rounded-button bg-surface-container p-sm"><div><b>{driver.fullName}</b><p className="text-label-md text-on-surface-variant">{driver.area} · {driver.distanceKm.toLocaleString(adminIntlLocale(locale), { maximumFractionDigits: 1 })} {t("كم", "km")} · {t("الموقع", "Updated")} {new Date(driver.locationUpdatedAt).toLocaleTimeString(adminIntlLocale(locale))}</p></div><Button disabled={busy} onClick={()=>dispatch("assign",driver.id)}>{t("إسناد", "Assign")}</Button></div>)}</div>:<p className="text-on-surface-variant">{t("لا يوجد كابتن متصل بموقع حديث داخل نطاق الخدمة.", "No driver with a recent location is connected within the service area.")}</p>}</Card>:null}
      <Card className="p-md"><SectionTitle title={t("العناصر", "Items")} icon="restaurant" /><Table head={[t("الصنف", "Item"), t("الكمية", "Quantity"), t("سعر الوحدة", "Unit price"), t("الإجمالي", "Total")]}>{data.items.map(i => <tr key={i.id}><Td>{i.productName}{i.variantName ? ` — ${i.variantName}` : ""}{i.addons.length ? <small className="block text-on-surface-variant">{i.addons.map(a => a.name).join(locale === "ar" ? "، " : ", ")}</small> : null}</Td><Td>{i.quantity}</Td><Td>{adminCurrency(i.unitPrice, locale)}</Td><Td>{adminCurrency(i.lineTotal, locale)}</Td></tr>)}</Table></Card>
      <Card className="p-md"><SectionTitle title={t("توزيع الدفع", "Payment breakdown")} icon="account_balance" /><div className="grid grid-cols-2 gap-sm md:grid-cols-4"><p>{t("الإجمالي", "Total")}: {adminCurrency(data.total, locale)}</p><p>{t("المنتجات", "Items")}: {adminCurrency(data.subtotal, locale)}</p><p>{t("التوصيل", "Delivery")}: {adminCurrency(data.deliveryFee, locale)}</p><p>{t("المحفظة", "Wallet")}: {adminCurrency(data.walletAmountUsed, locale)}</p><p>{t("المبلغ الخارجي", "External amount")}: {adminCurrency(data.externalAmountDue, locale)}</p><p>{t("الطريقة", "Method")}: {paymentMethodLabel(data.paymentMethod)}</p></div></Card>
      {data.relatedOrders.length > 1 ? <Card className="p-md"><SectionTitle title={t("طلبات نفس عملية الدفع", "Orders from the same payment")} icon="receipt_long" />{data.relatedOrders.map(o => <Link key={o.id} to="/admin/orders/$id" params={{ id: String(o.id) }} className="mb-2 flex justify-between rounded-button bg-surface-container p-sm"><span>{o.code} · {o.restaurantName}</span><span>{adminCurrency(o.total, locale)}</span></Link>)}</Card> : null}
      <Card className="p-md"><SectionTitle title={t("سجل الحالة", "Status history")} icon="history" />{data.history.length ? <ol className="flex flex-col gap-2 border-s-2 ps-md">{data.history.map(h => <li key={h.id}><b>{orderStatusLabel(h.status)}</b><span className="ms-2 text-on-surface-variant">{adminDateTime(h.createdAt, locale)}</span></li>)}</ol> : <p>{t("لا يوجد سجل حالة.", "No status history.")}</p>}</Card>
      {data.refunds.length ? <Card className="p-md"><SectionTitle title={t("الاستردادات", "Refunds")} icon="currency_exchange" />{data.refunds.map(r => <p key={r.id}>{adminCurrency(r.amount, locale)} · {refundStatusLabel(r.status)} · {r.reason}</p>)}</Card> : null}
    </div>}
  </DashboardShell>;
}