import { useState, useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { DashboardShell, Card, Badge, Button, Icon } from "@/components/tb/shell";
import { partnerNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";

export const Route = createFileRoute("/partner/menu")({
  head: () => ({
    meta: [{ title: "المنتجات — طلبات بيتك" }],
  }),
  component: PartnerMenu,
});

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = { id: number; restaurantId: number; name: string; description: string | null; imageUrl: string | null; sortOrder: number; isActive: boolean };
type Variant = { id: number; productId: number; name: string; priceDelta: string; isDefault: boolean; sortOrder: number };
type Addon = { id: number; productId: number; name: string; price: string; isAvailable: boolean; sortOrder: number };
type Product = { id: number; restaurantId: number; categoryId: number | null; name: string; description: string | null; imageUrl: string | null; basePrice: string; isAvailable: boolean; sortOrder: number; variants: Variant[]; addons: Addon[] };
type MenuData = { categories: Category[]; products: Product[] };

const EGP = (n: string | number) => `${Number(n).toLocaleString("ar-EG", { minimumFractionDigits: 0 })} ج.م`;

function storageUrl(p: string) {
  const token = getToken();
  return `/api/storage${p}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
}

async function apiPost(path: string, body: unknown) {
  const r = await fetch(path, { method: "POST", headers: authHeaders(), body: JSON.stringify(body) });
  if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ في الخادم"); }
  return r.json();
}
async function apiPatch(path: string, body: unknown) {
  const r = await fetch(path, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
  if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ في الخادم"); }
  return r.json();
}
async function apiDelete(path: string) {
  const r = await fetch(path, { method: "DELETE", headers: authHeaders() });
  if (!r.ok) { const d = await r.json().catch(() => null) as { error?: string } | null; throw new Error(d?.error ?? "خطأ في الخادم"); }
  return r.json();
}

// ─── Small shared components ──────────────────────────────────────────────────

function InlineField({ label, value, onSave, type = "text" }: { label: string; value: string; onSave: (v: string) => Promise<void>; type?: string }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { setVal(value); }, [value]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);

  async function save() {
    setSaving(true); setErr("");
    try { await onSave(val); setEditing(false); }
    catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  if (!editing) return (
    <button type="button" onClick={() => setEditing(true)}
      className="flex items-center gap-1 text-right font-label-md text-label-md text-on-surface hover:text-primary">
      {value || <span className="text-on-surface-variant">{label}</span>}
      <Icon name="edit" className="text-[14px] text-on-surface-variant" />
    </button>
  );
  return (
    <div className="flex flex-col gap-1">
      <input ref={ref} type={type} value={val} onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") setEditing(false); }}
        className="w-full rounded-button border border-outline-variant bg-surface px-2 py-1 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
      {err && <span className="font-label-md text-[11px] text-error">{err}</span>}
      <div className="flex gap-1">
        <button type="button" disabled={saving} onClick={save}
          className="rounded-button bg-primary px-2 py-0.5 font-label-md text-[11px] text-on-primary disabled:opacity-50">
          {saving ? "..." : "حفظ"}
        </button>
        <button type="button" onClick={() => setEditing(false)}
          className="rounded-button bg-surface-container px-2 py-0.5 font-label-md text-[11px] text-on-surface">
          إلغاء
        </button>
      </div>
    </div>
  );
}

// ─── Add-category dialog ──────────────────────────────────────────────────────

function AddCategoryModal({ onSave, onClose }: { onSave: (name: string, desc: string) => Promise<void>; onClose: () => void }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  async function submit() {
    if (!name.trim()) { setErr("الاسم مطلوب"); return; }
    setSaving(true); setErr("");
    try { await onSave(name, desc); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-md" onClick={onClose}>
      <div className="w-full max-w-sm rounded-card bg-surface p-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-md font-headline-md text-headline-md text-on-surface">إضافة قسم جديد</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">اسم القسم *</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">وصف (اختياري)</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
          </div>
          {err && <p className="font-label-md text-label-md text-error">{err}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={saving}>{saving ? "جاري الحفظ..." : "إضافة"}</Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Add/edit product dialog ──────────────────────────────────────────────────

function ProductModal({ categories, product, onSave, onClose }: {
  categories: Category[];
  product?: Product;
  onSave: (data: Partial<Product>) => Promise<void>;
  onClose: () => void;
}) {
  const [name, setName] = useState(product?.name ?? "");
  const [desc, setDesc] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product?.basePrice ?? "0");
  const [catId, setCatId] = useState<number | null>(product?.categoryId ?? null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  async function submit() {
    if (!name.trim()) { setErr("اسم المنتج مطلوب"); return; }
    const p = parseFloat(price);
    if (isNaN(p) || p < 0) { setErr("السعر غير صحيح"); return; }
    setSaving(true); setErr("");
    try { await onSave({ name: name.trim(), description: desc.trim() || null, basePrice: p.toFixed(2), categoryId: catId }); onClose(); }
    catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-scrim/50 p-md" onClick={onClose}>
      <div className="w-full max-w-sm rounded-card bg-surface p-lg shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="mb-md font-headline-md text-headline-md text-on-surface">{product ? "تعديل المنتج" : "إضافة منتج"}</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">اسم المنتج *</label>
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">وصف</label>
            <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={2}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">السعر (ج.م) *</label>
            <input type="number" min="0" step="0.5" value={price} onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary" />
          </div>
          <div>
            <label className="mb-1 block font-label-md text-label-md text-on-surface-variant">القسم</label>
            <select value={catId ?? ""} onChange={(e) => setCatId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-button border border-outline-variant bg-surface-container-low px-3 py-2 font-body-md text-body-md text-on-surface outline-none focus:border-primary">
              <option value="">— بدون قسم —</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {err && <p className="font-label-md text-label-md text-error">{err}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={submit} disabled={saving}>{saving ? "جاري الحفظ..." : product ? "حفظ" : "إضافة"}</Button>
            <Button className="flex-1" variant="outline" onClick={onClose}>إلغاء</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Variant/addon inline list ────────────────────────────────────────────────

function VariantsSection({ product, onRefresh }: { product: Product; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDelta, setNewDelta] = useState("0");
  const [err, setErr] = useState("");

  async function addVariant() {
    if (!newName.trim()) { setErr("الاسم مطلوب"); return; }
    try {
      await apiPost(`/api/partner/products/${product.id}/variants`, { name: newName, priceDelta: parseFloat(newDelta) || 0 });
      setNewName(""); setNewDelta("0"); setAdding(false); onRefresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
  }

  return (
    <div>
      <p className="mb-1 font-label-md text-label-md text-on-surface-variant">الأحجام / الأنواع</p>
      <div className="flex flex-col gap-1">
        {product.variants.map((v) => (
          <div key={v.id} className="flex items-center justify-between rounded-button bg-surface-container-low px-2 py-1">
            <span className="font-label-md text-label-md text-on-surface">{v.name}</span>
            <div className="flex items-center gap-2">
              {Number(v.priceDelta) !== 0 && <span className="font-label-md text-[11px] text-secondary">+{EGP(v.priceDelta)}</span>}
              {v.isDefault && <Badge tone="success">افتراضي</Badge>}
              <button type="button" onClick={() => apiDelete(`/api/partner/variants/${v.id}`).then(onRefresh)}
                className="text-error hover:opacity-70"><Icon name="delete" className="text-[14px]" /></button>
            </div>
          </div>
        ))}
        {adding ? (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <input placeholder="الاسم" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded-button border border-outline-variant px-2 py-1 font-body-md text-[12px] text-on-surface outline-none focus:border-primary" />
              <input type="number" placeholder="+سعر" value={newDelta} onChange={(e) => setNewDelta(e.target.value)}
                className="w-20 rounded-button border border-outline-variant px-2 py-1 font-body-md text-[12px] text-on-surface outline-none focus:border-primary" />
            </div>
            {err && <p className="font-label-md text-[10px] text-error">{err}</p>}
            <div className="flex gap-1">
              <button type="button" onClick={addVariant} className="rounded-button bg-primary px-2 py-0.5 font-label-md text-[11px] text-on-primary">إضافة</button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-button bg-surface-container px-2 py-0.5 font-label-md text-[11px] text-on-surface">إلغاء</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)}
            className="flex items-center gap-1 font-label-md text-[11px] text-secondary hover:underline">
            <Icon name="add" className="text-[12px]" /> إضافة حجم
          </button>
        )}
      </div>
    </div>
  );
}

function AddonsSection({ product, onRefresh }: { product: Product; onRefresh: () => void }) {
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newPrice, setNewPrice] = useState("0");
  const [err, setErr] = useState("");

  async function addAddon() {
    if (!newName.trim()) { setErr("الاسم مطلوب"); return; }
    try {
      await apiPost(`/api/partner/products/${product.id}/addons`, { name: newName, price: parseFloat(newPrice) || 0 });
      setNewName(""); setNewPrice("0"); setAdding(false); onRefresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "خطأ"); }
  }

  return (
    <div>
      <p className="mb-1 font-label-md text-label-md text-on-surface-variant">الإضافات</p>
      <div className="flex flex-col gap-1">
        {product.addons.map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded-button bg-surface-container-low px-2 py-1">
            <span className="font-label-md text-label-md text-on-surface">{a.name}</span>
            <div className="flex items-center gap-2">
              {Number(a.price) > 0 && <span className="font-label-md text-[11px] text-secondary">+{EGP(a.price)}</span>}
              {!a.isAvailable && <Badge tone="danger">غير متاح</Badge>}
              <button type="button" onClick={() => apiDelete(`/api/partner/addons/${a.id}`).then(onRefresh)}
                className="text-error hover:opacity-70"><Icon name="delete" className="text-[14px]" /></button>
            </div>
          </div>
        ))}
        {adding ? (
          <div className="flex flex-col gap-1">
            <div className="flex gap-1">
              <input placeholder="الاسم" value={newName} onChange={(e) => setNewName(e.target.value)}
                className="flex-1 rounded-button border border-outline-variant px-2 py-1 font-body-md text-[12px] text-on-surface outline-none focus:border-primary" />
              <input type="number" placeholder="سعر" value={newPrice} onChange={(e) => setNewPrice(e.target.value)}
                className="w-20 rounded-button border border-outline-variant px-2 py-1 font-body-md text-[12px] text-on-surface outline-none focus:border-primary" />
            </div>
            {err && <p className="font-label-md text-[10px] text-error">{err}</p>}
            <div className="flex gap-1">
              <button type="button" onClick={addAddon} className="rounded-button bg-primary px-2 py-0.5 font-label-md text-[11px] text-on-primary">إضافة</button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-button bg-surface-container px-2 py-0.5 font-label-md text-[11px] text-on-surface">إلغاء</button>
            </div>
          </div>
        ) : (
          <button type="button" onClick={() => setAdding(true)}
            className="flex items-center gap-1 font-label-md text-[11px] text-secondary hover:underline">
            <Icon name="add" className="text-[12px]" /> إضافة إضافة
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

function PartnerMenu() {
  const [menu, setMenu] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeCat, setActiveCat] = useState<number | null>(null);
  const [showAddCat, setShowAddCat] = useState(false);
  const [addProduct, setAddProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [expandedProduct, setExpandedProduct] = useState<number | null>(null);

  async function loadMenu() {
    setLoading(true);
    try {
      const r = await fetch("/api/partner/menu", { headers: authHeaders() });
      if (!r.ok) throw new Error("فشل تحميل المنيو");
      const d = await r.json() as MenuData;
      setMenu(d);
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadMenu(); }, []);

  const cats = menu?.categories ?? [];
  const allProducts = menu?.products ?? [];
  const filtered = activeCat === null ? allProducts : allProducts.filter((p) => p.categoryId === activeCat);
  const catName = (id: number | null) => id === null ? "الكل" : (cats.find((c) => c.id === id)?.name ?? "غير مصنف");

  async function handleToggleAvailability(p: Product) {
    try {
      await apiPatch(`/api/partner/products/${p.id}/availability`, { isAvailable: !p.isAvailable });
      await loadMenu();
    } catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
  }

  async function handleDeleteProduct(p: Product) {
    if (!confirm(`حذف "${p.name}"؟ لا يمكن التراجع.`)) return;
    try { await apiDelete(`/api/partner/products/${p.id}`); await loadMenu(); }
    catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
  }

  async function handleDeleteCategory(c: Category) {
    if (!confirm(`حذف قسم "${c.name}"؟`)) return;
    try { await apiDelete(`/api/partner/categories/${c.id}`); await loadMenu(); }
    catch (e) { setError(e instanceof Error ? e.message : "خطأ"); }
  }

  async function handleAddCategory(name: string, desc: string) {
    await apiPost("/api/partner/categories", { name, description: desc });
    await loadMenu();
  }

  async function handleAddProduct(data: Partial<Product>) {
    await apiPost("/api/partner/products", data);
    await loadMenu();
  }

  async function handleEditProduct(data: Partial<Product>) {
    if (!editProduct) return;
    await apiPatch(`/api/partner/products/${editProduct.id}`, data);
    await loadMenu();
  }

  if (loading) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="المنيو">
      <div className="flex h-40 items-center justify-center text-on-surface-variant">
        <Icon name="hourglass_empty" className="animate-spin text-[32px]" />
      </div>
    </DashboardShell>
  );

  if (error) return (
    <DashboardShell brand="طلبات بيتك" role="صاحب مطعم" nav={partnerNav} title="المنيو">
      <div className="flex flex-col items-center gap-md py-xl text-center">
        <Icon name="error" className="text-[40px] text-error" />
        <p className="font-body-md text-body-md text-on-surface-variant">{error}</p>
        <Button onClick={loadMenu}>إعادة المحاولة</Button>
      </div>
    </DashboardShell>
  );

  return (
    <DashboardShell
      brand="طلبات بيتك"
      role="صاحب مطعم"
      nav={partnerNav}
      title="المنيو"
      actions={
        <div className="flex gap-2">
          <Button icon="category" variant="outline" onClick={() => setShowAddCat(true)}>قسم جديد</Button>
          <Button icon="add" onClick={() => setAddProduct(true)}>منتج جديد</Button>
        </div>
      }
    >
      {/* Modals */}
      {showAddCat && <AddCategoryModal onSave={handleAddCategory} onClose={() => setShowAddCat(false)} />}
      {addProduct && <ProductModal categories={cats} onSave={handleAddProduct} onClose={() => setAddProduct(false)} />}
      {editProduct && <ProductModal categories={cats} product={editProduct} onSave={handleEditProduct} onClose={() => setEditProduct(null)} />}

      <div className="flex flex-col gap-lg">
        {/* Category tabs */}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setActiveCat(null)}
            className={`rounded-button px-3 py-1.5 font-label-md text-label-md transition ${activeCat === null ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"}`}>
            الكل ({allProducts.length})
          </button>
          {cats.map((c) => (
            <div key={c.id} className="flex items-center gap-1">
              <button type="button" onClick={() => setActiveCat(c.id)}
                className={`rounded-button px-3 py-1.5 font-label-md text-label-md transition ${activeCat === c.id ? "bg-primary text-on-primary" : "bg-surface-container text-on-surface hover:bg-surface-container-high"}`}>
                {c.name} ({allProducts.filter((p) => p.categoryId === c.id).length})
              </button>
              <button type="button" onClick={() => handleDeleteCategory(c)}
                className="text-on-surface-variant hover:text-error"><Icon name="close" className="text-[14px]" /></button>
            </div>
          ))}
          <Badge tone="info" className="ml-auto">المنتجات مشتركة بين جميع الفروع</Badge>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-md rounded-card border border-dashed border-outline-variant py-xl text-center">
            <Icon name="restaurant_menu" className="text-[48px] text-outline" />
            <p className="font-body-md text-body-md text-on-surface-variant">لا توجد منتجات{activeCat !== null ? ` في قسم "${catName(activeCat)}"` : ""}</p>
            <Button icon="add" onClick={() => setAddProduct(true)}>أضف أول منتج</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-md lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => {
              const expanded = expandedProduct === p.id;
              return (
                <Card key={p.id} className={`flex flex-col overflow-hidden transition ${!p.isAvailable ? "opacity-60" : ""}`}>
                  {/* Image */}
                  {p.imageUrl ? (
                    <img src={storageUrl(p.imageUrl)} alt={p.name} className="h-32 w-full object-cover" />
                  ) : (
                    <div className="flex h-32 items-center justify-center bg-surface-container">
                      <Icon name="restaurant_menu" className="text-[40px] text-outline" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col gap-2 p-md">
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-label-lg text-label-lg text-on-surface">{p.name}</p>
                        {p.description && <p className="mt-0.5 line-clamp-1 font-body-md text-[12px] text-on-surface-variant">{p.description}</p>}
                      </div>
                      <p className="shrink-0 font-headline-md text-headline-md text-primary">{EGP(p.basePrice)}</p>
                    </div>

                    {/* Category + availability row */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      {p.categoryId !== null && <Badge tone="neutral">{catName(p.categoryId)}</Badge>}
                      <Badge tone={p.isAvailable ? "success" : "danger"}>{p.isAvailable ? "متاح" : "غير متاح"}</Badge>
                      {p.variants.length > 0 && <Badge tone="info">{p.variants.length} حجم</Badge>}
                      {p.addons.length > 0 && <Badge tone="info">{p.addons.length} إضافة</Badge>}
                    </div>

                    {/* Action row */}
                    <div className="mt-auto flex items-center gap-2">
                      <button type="button" onClick={() => handleToggleAvailability(p)}
                        className="flex items-center gap-1 rounded-button bg-surface-container px-2 py-1 font-label-md text-[11px] text-on-surface transition hover:bg-surface-container-high">
                        <Icon name={p.isAvailable ? "visibility_off" : "visibility"} className="text-[14px]" />
                        {p.isAvailable ? "إخفاء" : "إظهار"}
                      </button>
                      <button type="button" onClick={() => setEditProduct(p)}
                        className="flex items-center gap-1 rounded-button bg-secondary-container px-2 py-1 font-label-md text-[11px] text-on-secondary-container transition hover:opacity-80">
                        <Icon name="edit" className="text-[14px]" /> تعديل
                      </button>
                      <button type="button" onClick={() => setExpandedProduct(expanded ? null : p.id)}
                        className="flex items-center gap-1 rounded-button bg-surface-container px-2 py-1 font-label-md text-[11px] text-on-surface transition hover:bg-surface-container-high">
                        <Icon name={expanded ? "expand_less" : "tune"} className="text-[14px]" />
                        {expanded ? "إغلاق" : "أحجام / إضافات"}
                      </button>
                      <button type="button" onClick={() => handleDeleteProduct(p)}
                        className="mr-auto flex size-7 items-center justify-center rounded-full text-on-surface-variant hover:bg-error-container hover:text-error">
                        <Icon name="delete" className="text-[16px]" />
                      </button>
                    </div>

                    {/* Expanded: variants + addons */}
                    {expanded && (
                      <div className="flex flex-col gap-3 border-t border-outline-variant pt-3">
                        <VariantsSection product={p} onRefresh={loadMenu} />
                        <AddonsSection product={p} onRefresh={loadMenu} />
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
