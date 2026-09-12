import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, SectionTitle, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminRequest, type Page } from "@/lib/admin-api";
import { adminDateTime, adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Row = { restaurantId: number; name: string; rate: number; updatedAt: string | null };
export const Route = createFileRoute("/admin/commissions")({ component: Commissions });

function Commissions() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<Page<Row>>();
  const [error, setError] = useState("");
  const load = useCallback(() => adminRequest<Page<Row>>("/admin/operations/restaurant-commissions?page=1&pageSize=50")
    .then(setData)
    .catch((e) => setError(e instanceof Error ? e.message : t("تعذر التحميل", "Unable to load data"))), [t]);
  useEffect(() => { void load(); }, [load]);

  async function edit(x: Row) {
    const rate = prompt(t(`نسبة ${x.name}`, `Rate for ${x.name}`), String(x.rate));
    const reason = rate == null ? null : prompt(t("سبب التعديل", "Reason for change"));
    if (rate == null || !reason) return;
    try {
      await adminRequest(`/admin/operations/restaurant-commissions/${x.restaurantId}`, {
        method: "PUT",
        body: JSON.stringify({ rate: Number(rate), reason }),
      });
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : t("فشل", "Failed"));
    }
  }

  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("عمولات المطاعم", "Restaurant commissions")}>
    <SectionTitle title={t("النسبة المطبقة على قيمة الطلب", "Rate applied to the order value")} icon="percent" />
    {error ? <Card className="p-md text-error">{error}<Button onClick={() => void load()}>{t("إعادة", "Retry")}</Button></Card> :
      !data ? <Card className="p-md">{t("جاري التحميل…", "Loading…")}</Card> :
        !data.items.length ? <Card className="p-md">{t("لا توجد مطاعم.", "No restaurants.")}</Card> :
          <Table head={[t("المطعم", "Restaurant"), t("النسبة", "Rate"), t("آخر تحديث", "Last updated"), t("الإجراء", "Action")]}>
            {data.items.map((x) => <tr key={x.restaurantId}><Td>{x.name}</Td><Td>{adminNumber(x.rate, locale)}%</Td><Td>{x.updatedAt ? adminDateTime(x.updatedAt, locale) : t("لم تحدد", "Not set")}</Td><Td><Button onClick={() => void edit(x)}>{t("تعديل", "Edit")}</Button></Td></tr>)}
          </Table>}
  </DashboardShell>;
}