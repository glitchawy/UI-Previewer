import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { DashboardShell, Card, Badge, Button } from "@/components/tb/shell";
import { usePartnerNav } from "@/lib/tb/nav";
import { partnerRequest, usePartnerResource } from "@/lib/partner-api";
import { useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/partner/inventory")({ component: PartnerInventory });
type Inventory = { branches: { id: number; name: string }[]; products: { id: number; name: string; globallyAvailable: boolean; branches: { branchId: number; quantity: number; isAvailable: boolean }[] }[] };

function PartnerInventory() {
  const { t } = useTranslation();
  const partnerNav = usePartnerNav();
  const query = usePartnerResource<Inventory>("/api/partner/operations/inventory");
  const [saving, setSaving] = useState("");
  const [error, setError] = useState("");
  async function update(branchId: number, productId: number, quantity: number, isAvailable: boolean) {
    const key = `${branchId}:${productId}`; setSaving(key); setError("");
    try { await partnerRequest(`/api/partner/operations/inventory/${branchId}/${productId}`, { method: "PUT", body: JSON.stringify({ quantity, isAvailable }) }); await query.reload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : t("تعذر تحديث المخزون", "Could not update inventory")); }
    finally { setSaving(""); }
  }
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("صاحب المطعم", "Restaurant owner")} nav={partnerNav} title={t("مخزون الفروع", "Branch inventory")}>
    {query.loading && !query.data ? <Card className="p-md">{t("جارٍ التحميل...", "Loading…")}</Card> : query.error && !query.data ? <Card className="p-md text-error">{query.error}<Button onClick={query.reload}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
      <div className="flex flex-col gap-md">
        {query.error ? <p role="alert" className="text-error">{query.error} <Button variant="outline" onClick={query.reload}>{t("إعادة المحاولة", "Try again")}</Button></p> : null}
        <Card className="p-3 text-on-surface-variant">{t("الكميات هنا سجل تشغيلي لكل فرع. إتاحة المنتج للعملاء تُدار من صفحة المنتجات، ولا تخصم الكمية تلقائياً قبل اكتمال دورة حجز مخزون آمنة.", "Quantities are an operational record for each branch. Customer availability is managed from Products; quantities are not deducted before a safe inventory reservation is complete.")}</Card>
        {error ? <p role="alert" className="text-error">{error}</p> : null}
        {!query.data?.branches.length ? <Card className="p-lg text-center">{t("أضف فرعاً أولاً لإدارة مخزونه.", "Add a branch first to manage its inventory.")}</Card> : null}
        {query.data?.products.map(product => <Card key={product.id} className="p-md">
          <div className="mb-3 flex items-center justify-between gap-2"><strong>{product.name}</strong>{!product.globallyAvailable ? <Badge tone="danger">{t("المنتج معطّل من القائمة", "Product disabled from menu")}</Badge> : null}</div>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{product.branches.map(value => {
            const branch = query.data?.branches.find(item => item.id === value.branchId);
            const key = `${value.branchId}:${product.id}`;
            return <div key={value.branchId} className="flex flex-wrap items-center justify-between gap-2 rounded-button border border-outline-variant p-2">
              <span>{branch?.name}</span>
              <input aria-label={t(`كمية ${product.name} في ${branch?.name}`, `Quantity of ${product.name} at ${branch?.name}`)} type="number" min={0} max={1000000} defaultValue={value.quantity} id={`qty-${key}`} className="w-24 rounded-button border border-outline-variant p-2" />
              <Button disabled={saving === key} onClick={() => {
                const quantity = Number((document.getElementById(`qty-${key}`) as HTMLInputElement).value);
                void update(value.branchId, product.id, quantity, value.isAvailable);
              }}>{saving === key ? "…" : t("حفظ", "Save")}</Button>
            </div>;
          })}</div>
        </Card>)}
        {query.data?.branches.length && !query.data.products.length ? <Card className="p-lg text-center">{t("لا توجد منتجات في القائمة.", "No products in the menu.")}</Card> : null}
      </div>}
  </DashboardShell>;
}