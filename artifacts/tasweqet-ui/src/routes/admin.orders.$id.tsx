import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button, Card, DashboardShell, SectionTitle, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/data";
import { adminApi, adminRequest } from "@/lib/admin-api";

type Detail = {
  id: number; code: string; status: string; paymentMethod: string; paymentStatus: string;
  restaurantName: string; branchName: string | null; deliveryAddressText: string; notes: string | null;
  subtotal: number; deliveryFee: number; total: number; walletAmountUsed: number; externalAmountDue: number; createdAt: string;
  customer: { id: number; name: string | null; phone: string | null; walletBalance: number };
  restaurant: { id: number; name: string; status: string | null }; driver: { id: number; name: string; phone: string | null; area: string } | null;
  items: { id: number; productName: string; variantName: string | null; quantity: number; unitPrice: number; lineTotal: number; addons: { name: string; price: number }[] }[];
  history: { id: number; status: string; createdAt: string }[];
  relatedOrders: { id: number; code: string; restaurantName: string; total: number; status: string }[];
  refunds: { id: number; amount: number; status: string; reason: string; createdAt: string }[];
};
type EligibleDriver = { id: number; fullName: string; area: string; currentWorkload: number; distanceKm: number; locationUpdatedAt: string };
export const Route = createFileRoute("/admin/orders/$id")({ component: AdminOrderDetail });
function AdminOrderDetail() {
  const { id } = Route.useParams(); const [data, setData] = useState<Detail>(), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const [drivers,setDrivers]=useState<EligibleDriver[]>([]),[dispatchError,setDispatchError]=useState(""),[busy,setBusy]=useState(false);
  useEffect(() => { const c = new AbortController(); setError(""); setData(undefined); adminApi<Detail>(`/orders/${id}`, c.signal).then(setData).catch(e => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); }); return () => c.abort(); }, [id, retry]);
  useEffect(()=>{if(data?.status!=="ready")return;const c=new AbortController();adminApi<EligibleDriver[]>(`/orders/${id}/eligible-drivers`,c.signal).then(setDrivers).catch(e=>{if(e instanceof Error&&e.name!=="AbortError")setDispatchError(e.message)});return()=>c.abort()},[id,data?.status,retry]);
  async function dispatch(action:"assign"|"unassign"|"reoffer",driverProfileId?:number){
    const label=action==="assign"?"إسناد الطلب":action==="unassign"?"إلغاء الإسناد":"إعادة عرض الطلب";
    if(!window.confirm(`تأكيد ${label}؟`))return;
    const reason=window.prompt("اكتب سبب العملية للسجل الإداري:");
    if(!reason)return;
    setBusy(true);setDispatchError("");
    try{await adminRequest(`/admin/core/orders/${id}/dispatch`,{method:"POST",body:JSON.stringify({action,driverProfileId,reason})});setRetry(x=>x+1)}
    catch(e){setDispatchError(e instanceof Error?e.message:"تعذر تنفيذ الإسناد")}finally{setBusy(false)}
  }
  return <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title={data ? `الطلب ${data.code}` : "تفاصيل الطلب"}>
    {error ? <Card className="p-lg text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry(x => x + 1)}>إعادة المحاولة</Button></Card> : !data ? <Card className="p-xl text-center">جاري تحميل تفاصيل الطلب…</Card> :
    <div className="flex flex-col gap-md">
      <Card className="flex flex-wrap items-start justify-between gap-sm p-md"><div><p className="font-headline-md">{data.customer.name || "عميل بدون اسم"}</p><p dir="ltr" className="text-on-surface-variant">{data.customer.phone}</p><p>{data.deliveryAddressText}</p></div><div className="flex gap-2"><StatusBadge status={data.status.toUpperCase()} label={data.status} /><StatusBadge status={data.paymentStatus.toUpperCase()} label={data.paymentStatus} /></div></Card>
      <Card className="p-md"><SectionTitle title="المطعم والتوصيل" icon="storefront" /><p>{data.restaurant.name} {data.branchName ? `— ${data.branchName}` : ""}</p><p className="text-on-surface-variant">{data.driver ? `المندوب: ${data.driver.name} · ${data.driver.phone || ""} · ${data.driver.area}` : "لم يتم تعيين مندوب"}</p></Card>
      {data.status==="ready"?<Card className="p-md"><SectionTitle title="التحكم في الإسناد" icon="local_shipping" />{dispatchError?<p className="mb-sm text-error">{dispatchError}</p>:null}{data.driver?<div className="flex flex-wrap gap-2"><Button variant="danger" disabled={busy} onClick={()=>dispatch("unassign")}>إلغاء الإسناد</Button><Button variant="outline" disabled={busy} onClick={()=>dispatch("reoffer")}>إلغاء وإعادة العرض</Button></div>:drivers.length?<div className="flex flex-col gap-2">{drivers.map(driver=><div key={driver.id} className="flex items-center justify-between rounded-button bg-surface-container p-sm"><div><b>{driver.fullName}</b><p className="text-label-md text-on-surface-variant">{driver.area} · {driver.distanceKm.toFixed(1)} كم · الموقع {new Date(driver.locationUpdatedAt).toLocaleTimeString("ar-EG")}</p></div><Button disabled={busy} onClick={()=>dispatch("assign",driver.id)}>إسناد</Button></div>)}</div>:<p className="text-on-surface-variant">لا يوجد كابتن متصل بموقع حديث داخل نطاق الخدمة.</p>}</Card>:null}
      <Card className="p-md"><SectionTitle title="العناصر" icon="restaurant" /><Table head={["الصنف", "الكمية", "سعر الوحدة", "الإجمالي"]}>{data.items.map(i => <tr key={i.id}><Td>{i.productName}{i.variantName ? ` — ${i.variantName}` : ""}{i.addons.length ? <small className="block text-on-surface-variant">{i.addons.map(a => a.name).join("، ")}</small> : null}</Td><Td>{i.quantity}</Td><Td>{EGP(i.unitPrice)}</Td><Td>{EGP(i.lineTotal)}</Td></tr>)}</Table></Card>
      <Card className="p-md"><SectionTitle title="توزيع الدفع" icon="account_balance" /><div className="grid grid-cols-2 gap-sm md:grid-cols-4"><p>الإجمالي: {EGP(data.total)}</p><p>المنتجات: {EGP(data.subtotal)}</p><p>التوصيل: {EGP(data.deliveryFee)}</p><p>المحفظة: {EGP(data.walletAmountUsed)}</p><p>المبلغ الخارجي: {EGP(data.externalAmountDue)}</p><p>الطريقة: {data.paymentMethod}</p></div></Card>
      {data.relatedOrders.length > 1 ? <Card className="p-md"><SectionTitle title="طلبات نفس عملية الدفع" icon="receipt_long" />{data.relatedOrders.map(o => <Link key={o.id} to="/admin/orders/$id" params={{ id: String(o.id) }} className="mb-2 flex justify-between rounded-button bg-surface-container p-sm"><span>{o.code} · {o.restaurantName}</span><span>{EGP(o.total)}</span></Link>)}</Card> : null}
      <Card className="p-md"><SectionTitle title="سجل الحالة" icon="history" />{data.history.length ? <ol className="flex flex-col gap-2 border-r-2 pr-md">{data.history.map(h => <li key={h.id}><b>{h.status}</b><span className="mr-2 text-on-surface-variant">{new Date(h.createdAt).toLocaleString("ar-EG")}</span></li>)}</ol> : <p>لا يوجد سجل حالة.</p>}</Card>
      {data.refunds.length ? <Card className="p-md"><SectionTitle title="الاستردادات" icon="currency_exchange" />{data.refunds.map(r => <p key={r.id}>{EGP(r.amount)} · {r.status} · {r.reason}</p>)}</Card> : null}
    </div>}
  </DashboardShell>;
}