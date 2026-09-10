import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, SectionTitle, StatusBadge, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";

type Payment={id:number;reference:string;status:string;amount:number;refundedAmount:number;currency:string;transactionId:string|null;customerName:string|null;createdAt:string};
export const Route=createFileRoute("/admin/payments")({component:AdminPayments});
function AdminPayments(){
 const [data,setData]=useState<Page<Payment>>();const [error,setError]=useState("");const [status,setStatus]=useState("");const [page,setPage]=useState(1);
 const load=useCallback(()=>{setError("");adminRequest<Page<Payment>>(`/admin/operations/payments?page=${page}&pageSize=20&status=${status}`).then(setData).catch(e=>setError(e instanceof Error?e.message:"تعذر التحميل"));},[page,status]);
 useEffect(load,[load]);
 return <DashboardShell brand="طلبات بيتك" role="الإدارة" nav={adminNav} title="المدفوعات">
  <Card className="flex flex-wrap gap-2 p-md">{["","pending","paid","failed","refunded"].map(s=><Button key={s||"all"} variant={status===s?"primary":"outline"} onClick={()=>{setStatus(s);setPage(1)}}>{s||"الكل"}</Button>)}</Card>
  <SectionTitle title="سجل Paymob الموثق" icon="payments"/>
  {error?<Card className="p-md text-error">{error}<Button className="ms-2" onClick={load}>إعادة المحاولة</Button></Card>:!data?<Card className="p-md">جاري التحميل…</Card>:data.items.length===0?<Card className="p-md">لا توجد عمليات.</Card>:<Table head={["المرجع","العميل","المبلغ","المسترد","الحالة","معاملة المزوّد","الوقت"]} mobile="scroll">{data.items.map(x=><tr key={x.id}><Td>{x.reference}</Td><Td>{x.customerName||"—"}</Td><Td>{x.amount} {x.currency}</Td><Td>{x.refundedAmount}</Td><Td><StatusBadge status={x.status.toUpperCase()} label={x.status}/></Td><Td>{x.transactionId||"—"}</Td><Td>{new Date(x.createdAt).toLocaleString("ar-EG")}</Td></tr>)}</Table>}
  {data&&<div className="flex justify-end gap-2"><Button disabled={page<=1} onClick={()=>setPage(p=>p-1)}>السابق</Button><Button disabled={page>=data.totalPages} onClick={()=>setPage(p=>p+1)}>التالي</Button></div>}
 </DashboardShell>;
}