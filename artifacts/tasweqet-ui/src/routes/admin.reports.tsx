import { localizedFetch as fetch } from "@/lib/i18n-fetch";
import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Button, Card, DashboardShell, Field, SectionTitle } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { getToken } from "@/lib/auth-session";
import { getLocale, useTranslation } from "@/lib/i18n";

export const Route = createFileRoute("/admin/reports")({ component: Reports });

function Reports() {
  const { t } = useTranslation();
  const now = new Date().toISOString().slice(0, 10);
  const [start, setStart] = useState(`${now.slice(0, 8)}01`);
  const [end, setEnd] = useState(now);
  const [error, setError] = useState("");
  async function download() {
    setError("");
    try {
      const response = await fetch(`/api/admin/operations/reports/orders.csv?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${getToken()}`, "Accept-Language": getLocale() },
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null) as { error?: string } | null;
        setError(body?.error || t("تعذر تنزيل التقرير", "Unable to download report"));
        return;
      }
      const url = URL.createObjectURL(await response.blob());
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `orders-${start}-${end}.csv`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("تعذر تنزيل التقرير", "Unable to download report"));
    }
  }
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("الإدارة", "Administration")} nav={adminNav} title={t("التقارير", "Reports")}>
    <Card className="flex flex-wrap items-end gap-2 p-md">
      <Field label={t("من (توقيت القاهرة)", "From (Cairo time)")} type="date" value={start} onChange={(e) => setStart(e.target.value)} />
      <Field label={t("إلى (توقيت القاهرة)", "To (Cairo time)")} type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
      <Button icon="download" onClick={() => void download()}>{t("تنزيل CSV حقيقي", "Download real CSV")}</Button>
    </Card>
    {error && <Card className="p-md text-error">{error}</Card>}
    <SectionTitle title={t("تقرير الطلبات", "Orders report")} icon="table_view" />
    <Card className="p-md">{t("يتضمن التقرير رقم الطلب والمطعم والحالة وطريقة الدفع والإجمالي ووقت الإنشاء بالقاهرة. الحد الأقصى سنة واحدة و50,000 صف.", "The report includes the order number, restaurant, status, payment method, total, and creation time in Cairo. Maximum: one year and 50,000 rows.")}</Card>
  </DashboardShell>;
}