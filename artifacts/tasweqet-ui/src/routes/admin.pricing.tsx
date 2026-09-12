import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest } from "@/lib/admin-api";
import { adminCurrency, adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Tier = { id: number; fromKm: string; toKm: string; price: string; isActive: boolean };
export const Route = createFileRoute("/admin/pricing")({ component: Pricing });

function Pricing() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<Tier[]>();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ fromKm: "", toKm: "", price: "", reason: "" });
  const load = useCallback(() => adminRequest<Tier[]>("/admin/operations/pricing")
    .then(setData)
    .catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data"))), [t]);
  useEffect(() => { void load(); }, [load]);

  async function add() {
    try {
      await adminRequest("/admin/operations/pricing", { method: "POST", body: JSON.stringify({ ...form, fromKm: Number(form.fromKm), toKm: Number(form.toKm), price: Number(form.price) }) });
      setForm({ fromKm: "", toKm: "", price: "", reason: "" });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("فشل", "Failed"));
    }
  }
  async function toggle(x: Tier) {
    const reason = prompt(t("سبب التغيير", "Reason for change"));
    if (!reason) return;
    try {
      await adminRequest(`/admin/operations/pricing/${x.id}`, { method: "PATCH", body: JSON.stringify({ isActive: !x.isActive, reason }) });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("فشل", "Failed"));
    }
  }

  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("تسعير التوصيل", "Delivery pricing")}>
    <Card className="grid gap-2 p-md md:grid-cols-4">
      <Field label={t("من كم", "From km")} value={form.fromKm} onChange={(e) => setForm({ ...form, fromKm: e.target.value })} />
      <Field label={t("إلى كم", "To km")} value={form.toKm} onChange={(e) => setForm({ ...form, toKm: e.target.value })} />
      <Field label={t("السعر", "Price")} value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      <Field label={t("السبب", "Reason")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <Button onClick={() => void add()}>{t("إضافة", "Add")}</Button>
    </Card>
    <SectionTitle title={t("شرائح محفوظة", "Saved tiers")} icon="route" />
    {error ? <Card className="p-md text-error">{error}</Card> :
      !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
        !data.length ? <Card className="p-md">{t("لا توجد شرائح.", "No tiers.")}</Card> :
          <Table head={[t("من", "From"), t("إلى", "To"), t("السعر", "Price"), t("الحالة", "Status"), t("الإجراء", "Action")]}>
             {data.map((x) => <tr key={x.id}><Td>{adminNumber(Number(x.fromKm), locale)}</Td><Td>{adminNumber(Number(x.toKm), locale)}</Td><Td>{adminCurrency(Number(x.price), locale)}</Td><Td>{x.isActive ? t("نشطة", "Active") : t("معطلة", "Inactive")}</Td><Td><Button onClick={() => void toggle(x)}>{x.isActive ? t("تعطيل", "Disable") : t("تنشيط", "Enable")}</Button></Td></tr>)}
          </Table>}
  </DashboardShell>;
}