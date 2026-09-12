import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest } from "@/lib/admin-api";
import { adminCurrency, adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Rule = { id: number; name: string; scope: string; driverShareRate: string; bonusPerOrder: string; isActive: boolean };
export const Route = createFileRoute("/admin/driver-commissions")({ component: Rules });

function Rules() {
  const { t, locale } = useTranslation();
  const scopeLabel = (scope: string) => ({
    global: t("عام", "Global"),
    restaurant: t("مطعم", "Restaurant"),
    zone: t("منطقة", "Zone"),
  }[scope] ?? scope);
  const [data, setData] = useState<Rule[]>();
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name: "", scope: "all", driverShareRate: "70", bonusPerOrder: "0", reason: "" });
  const load = useCallback(() => adminRequest<Rule[]>("/admin/operations/driver-commissions")
    .then(setData)
    .catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data"))), [t]);
  useEffect(() => { void load(); }, [load]);

  async function add() {
    try {
      await adminRequest("/admin/operations/driver-commissions", {
        method: "POST",
        body: JSON.stringify({ ...form, driverShareRate: Number(form.driverShareRate), bonusPerOrder: Number(form.bonusPerOrder) }),
      });
      setForm({ ...form, name: "", reason: "" });
      void load();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("فشل", "Failed"));
    }
  }

  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("عمولات المندوبين", "Driver commissions")}>
    <Card className="grid gap-2 p-md md:grid-cols-5">
      <Field label={t("الاسم", "Name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      <Field label={t("النطاق", "Scope")} value={form.scope} onChange={(e) => setForm({ ...form, scope: e.target.value })} />
      <Field label={t("حصة المندوب %", "Driver share %")} value={form.driverShareRate} onChange={(e) => setForm({ ...form, driverShareRate: e.target.value })} />
      <Field label={t("مكافأة الطلب", "Per-order bonus")} value={form.bonusPerOrder} onChange={(e) => setForm({ ...form, bonusPerOrder: e.target.value })} />
      <Field label={t("السبب", "Reason")} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
      <Button onClick={() => void add()}>{t("إضافة قاعدة", "Add rule")}</Button>
    </Card>
    <SectionTitle title={t("قواعد محفوظة", "Saved rules")} icon="rule" />
    {error ? <Card className="p-md text-error">{error}</Card> :
      !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
        !data.length ? <Card className="p-md">{t("لا توجد قواعد.", "No rules.")}</Card> :
          <Table head={[t("الاسم", "Name"), t("النطاق", "Scope"), t("المندوب", "Driver"), t("المنصة", "Platform"), t("المكافأة", "Bonus")]}>
            {data.map((x) => <tr key={x.id}><Td>{x.name}</Td><Td>{scopeLabel(x.scope)}</Td><Td>{adminNumber(Number(x.driverShareRate), locale)}%</Td><Td>{adminNumber(100 - Number(x.driverShareRate), locale)}%</Td><Td>{adminCurrency(Number(x.bonusPerOrder), locale)}</Td></tr>)}
          </Table>}
  </DashboardShell>;
}