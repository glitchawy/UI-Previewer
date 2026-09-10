import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, Badge, Button } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { partnerRequest, usePartnerResource } from "@/lib/partner-api";

export const Route = createFileRoute("/partner/inventory")({ component: PartnerInventory });
type Inventory = { branches: { id: number; name: string }[]; products: { id: number; name: string; globallyAvailable: boolean; branches: { branchId: number; quantity: number; isAvailable: boolean }[] }[] };

function PartnerInventory() {
  const query = usePartnerResource<Inventory>("/api/partner/operations/inventory");
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  async function update(branchId: number, productId: number, quantity: number, isAvailable: boolean) {
    const key = `${branchId}:${productId}`; setSaving(key); setError("");
    try { await partnerRequest(`/api/partner/operations/inventory/${branchId}/${productId}`, { method: "PUT", body: JSON.stringify({ quantity, isAvailable }) }); await query.reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذر تحديث المخزون"); }
    finally { setSaving(""); }
  }
  return <DashboardShell brand="طلبات بيتك" role="صاحب المطعم" nav={partnerNav} title="مخزون الفروع">
    {query.loading ? <Card className="p-md">جارٍ التحميل...</Card> : query.error ? <Card className="p-md text-error">{query.error}<Button onClick={query.reload}>إعادة المحاولة</Button></Card> :
      <div className="flex flex-col gap-md">
        <Card className="p-3 text-on-surface-variant">الكميات هنا سجل تشغيلي لكل فرع. إتاحة المنتج للعملاء تُدار من صفحة المنتجات، ولا تخصم الكمية تلقائياً قبل اكتمال دورة حجز مخزون آمنة.</Card>
        {error ? <p role="alert" className="text-error">{error}</p> : null}
        {!query.data?.branches.length ? <Card className="p-lg text-center">أضف فرعاً أولاً لإدارة مخزونه.</Card> : null}
        {query.data?.products.map(product => <Card key={product.id} className="p-md">
          <div className="mb-3 flex items-center justify-between gap-2"><strong>{product.name}</strong>{!product.globallyAvailable ? <Badge tone="danger">المنتج معطّل من القائمة</Badge> : null}</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{product.branches.map(value => {
            const branch = query.data?.branches.find(item => item.id === value.branchId);
            const key = `${value.branchId}:${product.id}`;
            return <div key={value.branchId} className="flex flex-wrap items-center justify-between gap-2 rounded-button border border-outline-variant p-2">
              <span>{branch?.name}</span>
              <input aria-label={`كمية ${product.name} في ${branch?.name}`} type="number" min={0} max={1000000} defaultValue={value.quantity} id={`qty-${key}`} className="w-24 rounded-button border border-outline-variant p-2" />
              <Button disabled={saving === key} onClick={() => {
                const quantity = Number((document.getElementById(`qty-${key}`) as HTMLInputElement).value);
                void update(value.branchId, product.id, quantity, value.isAvailable);
              }}>{saving === key ? "..." : "حفظ"}</Button>
            </div>;
          })}</div>
        </Card>)}
        {query.data?.branches.length && !query.data.products.length ? <Card className="p-lg text-center">لا توجد منتجات في القائمة.</Card> : null}
      </div>}
  </DashboardShell>;
}