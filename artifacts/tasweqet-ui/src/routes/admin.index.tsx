import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bars, Button, Card, DashboardShell, EmptyState, SectionTitle, Stat, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { adminApi, adminRequest } from "@/lib/admin-api";
import { adminCurrency, adminNumber } from "@/lib/admin-i18n";
import { useTranslation } from "@/lib/i18n";

type Overview = {
  gmv: number; orders: number; activeOrders: number; customers: number; restaurants: number;
  activeRestaurants: number; activeDrivers: number;
  topRestaurants: { id: number; name: string; orders: number; gmv: number }[];
  monthly: { month: string; orders: number; gmv: number }[];
};
type OperationsHealth = {
  worker: { healthy: boolean; lastSucceededAt: string | null } | null;
  pendingWebhookEvents: number;
  deadWebhookEvents: number;
  notificationDeadLetters: number;
  notificationFailures: number;
  cashReconciliationDeadLetters: number;
  alerts: { active: number; pending: number; deadLetter: number };
  configuration: {
    expoPushReady: boolean;
    notificationWebhookConfigured: boolean;
    operationsAlertWebhookConfigured: boolean;
  };
};
export const Route = createFileRoute("/admin/")({ component: AdminIndex });
function AdminIndex() {
  const { t, locale } = useTranslation();
  const [data, setData] = useState<Overview>(), [error, setError] = useState(""), [retry, setRetry] = useState(0);
  const [health, setHealth] = useState<OperationsHealth>(), [healthError, setHealthError] = useState(""), [healthRetry, setHealthRetry] = useState(0);
  useEffect(() => { const c = new AbortController(); setError(""); adminApi<Overview>("/overview", c.signal).then(setData).catch(e => { if (e instanceof Error && e.name !== "AbortError") setError(e.message); }); return () => c.abort(); }, [retry]);
  useEffect(() => {
    const c = new AbortController();
    setHealthError("");
    setHealth(undefined);
    adminRequest<OperationsHealth>("/admin/operations/health", { signal: c.signal }).then(setHealth).catch(e => {
      if (e instanceof Error && e.name !== "AbortError") setHealthError(e.message);
    });
    return () => c.abort();
  }, [healthRetry]);
  const healthStatus = !health ? "loading" :
    !health.worker?.healthy || health.deadWebhookEvents > 0 || health.notificationDeadLetters > 0 ||
      health.cashReconciliationDeadLetters > 0 || health.alerts.deadLetter > 0
      ? "critical"
      : health.alerts.active > 0 || health.notificationFailures > 0 || health.pendingWebhookEvents > 0 ||
        !health.configuration.expoPushReady || !health.configuration.notificationWebhookConfigured ||
        !health.configuration.operationsAlertWebhookConfigured
        ? "warning"
        : "healthy";
  const healthTone = healthStatus === "critical" ? "bg-error-container text-on-error-container" :
    healthStatus === "warning" ? "bg-tertiary-container text-on-tertiary-container" :
      healthStatus === "healthy" ? "bg-primary-container text-on-primary-container" : "bg-surface-container";
  return <DashboardShell brand={t("طلبات بيتك", "Talabat Betak")} role={t("سوبر أدمن", "Super admin")} nav={adminNav} title={t("نظرة عامة", "Overview")}>
    {error ? <Card className="p-lg text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry(x => x + 1)}>{t("إعادة المحاولة", "Try again")}</Button></Card> :
    !data ? <Card className="p-xl text-center">{t("جاري تحميل إحصاءات المنصة…", "Loading platform statistics…")}</Card> :
    <div className="flex flex-col gap-md">
      <Card className={`p-md ${healthTone}`}>
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <SectionTitle title={t("حالة التشغيل", "Operations health")} icon="monitor_heart" />
          <div className="flex items-center gap-2">
            {health ? <strong>{healthStatus === "critical" ? t("حرجة", "Critical") : healthStatus === "warning" ? t("تحتاج انتباه", "Needs attention") : t("سليمة", "Healthy")}</strong> : null}
            <Button variant="outline" onClick={() => setHealthRetry(x => x + 1)}>{t("تحديث", "Refresh")}</Button>
          </div>
        </div>
        {healthError ? <p className="text-error">{t("تعذر تحميل حالة التشغيل: ", "Unable to load operations health: ")}{healthError}</p> : !health ? <p>{t("جاري فحص حالة التشغيل…", "Checking operations health…")}</p> :
          <div className="grid gap-2 text-label-md sm:grid-cols-2 lg:grid-cols-3">
            <p>{t("عامل التشغيل: ", "Worker: ")}{health.worker?.healthy ? t("يعمل", "Running") : t("متوقف أو نبضه متأخر", "Stopped or heartbeat delayed")}</p>
            <p>{t("التنبيهات النشطة: ", "Active alerts: ")}{adminNumber(health.alerts.active, locale)} · {t("المتعثرة: ", "Dead-letter: ")}{adminNumber(health.alerts.deadLetter, locale)}</p>
            <p>{t("تسويات الكاش المتعثرة: ", "Dead-letter cash reconciliations: ")}{adminNumber(health.cashReconciliationDeadLetters, locale)}</p>
            <p>{t("فشل Webhook: ", "Webhook failures: ")}{adminNumber(health.deadWebhookEvents, locale)} · {t("فشل الإشعارات: ", "Notification failures: ")}{adminNumber(health.notificationFailures, locale)}</p>
            <p>{t("Expo Push: ", "Expo Push: ")}{health.configuration.expoPushReady ? t("جاهز", "Ready") : t("يلزم الإعداد", "Needs setup")}</p>
            <p>{t("Webhook الإشعارات: ", "Notification webhook: ")}{health.configuration.notificationWebhookConfigured ? t("جاهز", "Ready") : t("يلزم الإعداد", "Needs setup")} · {t("Webhook التنبيهات: ", "Alert webhook: ")}{health.configuration.operationsAlertWebhookConfigured ? t("جاهز", "Ready") : t("يلزم الإعداد", "Needs setup")}</p>
          </div>}
      </Card>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-3 lg:grid-cols-6">
        <Stat label={t("إجمالي المبيعات", "Total sales")} value={adminCurrency(data.gmv, locale)} icon="payments" />
        <Stat label={t("الطلبات", "Orders")} value={adminNumber(data.orders, locale)} icon="receipt_long" tone="info" />
        <Stat label={t("طلبات جارية", "Active orders")} value={adminNumber(data.activeOrders, locale)} icon="local_shipping" tone="warn" />
        <Stat label={t("العملاء", "Customers")} value={adminNumber(data.customers, locale)} icon="group" tone="info" />
        <Stat label={t("المطاعم النشطة", "Active restaurants")} value={`${adminNumber(data.activeRestaurants, locale)} / ${adminNumber(data.restaurants, locale)}`} icon="storefront" />
        <Stat label={t("المندوبون المعتمدون", "Approved drivers")} value={adminNumber(data.activeDrivers, locale)} icon="two_wheeler" tone="success" />
      </div>
      <Card className="p-md"><SectionTitle title={t("آخر ٦ أشهر", "Last 6 months")} icon="show_chart" />{data.monthly.length ? <Bars values={data.monthly.map(x => x.gmv)} labels={data.monthly.map(x => x.month)} /> : <EmptyState icon="show_chart" title={t("لا توجد مبيعات بعد", "No sales yet")} body={t("ستظهر البيانات الشهرية عند إنشاء الطلبات.", "Monthly data will appear when orders are created.")} />}</Card>
      <Card className="p-md"><SectionTitle title={t("أفضل المطاعم", "Top restaurants")} icon="military_tech" />{data.topRestaurants.length ? <Table head={[t("المطعم", "Restaurant"), t("الطلبات", "Orders"), t("المبيعات", "Sales")]}>{data.topRestaurants.map(r => <tr key={r.id}><Td>{r.name}</Td><Td>{adminNumber(Number(r.orders), locale)}</Td><Td>{adminCurrency(r.gmv, locale)}</Td></tr>)}</Table> : <EmptyState icon="storefront" title={t("لا توجد بيانات", "No data")} body={t("لم تُسجل طلبات للمطاعم بعد.", "No restaurant orders have been recorded yet.")} />}</Card>
    </div>}
  </DashboardShell>;
}