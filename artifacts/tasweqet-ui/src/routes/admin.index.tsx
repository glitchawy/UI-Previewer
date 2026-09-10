import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Bars, Button, Card, DashboardShell, EmptyState, SectionTitle, Stat, Table, Td } from "@/components/tb/shell";
import { adminNav } from "@/lib/tb/nav";
import { EGP } from "@/lib/tb/data";
import { adminApi, adminRequest } from "@/lib/admin-api";

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
  return <DashboardShell brand="طلبات بيتك" role="سوبر أدمن" nav={adminNav} title="نظرة عامة">
    {error ? <Card className="p-lg text-center text-error"><p>{error}</p><Button className="mt-sm" onClick={() => setRetry(x => x + 1)}>إعادة المحاولة</Button></Card> :
    !data ? <Card className="p-xl text-center">جاري تحميل إحصاءات المنصة…</Card> :
    <div className="flex flex-col gap-md">
      <Card className={`p-md ${healthTone}`}>
        <div className="flex flex-wrap items-center justify-between gap-sm">
          <SectionTitle title="حالة التشغيل" icon="monitor_heart" />
          <div className="flex items-center gap-2">
            {health ? <strong>{healthStatus === "critical" ? "حرجة" : healthStatus === "warning" ? "تحتاج انتباه" : "سليمة"}</strong> : null}
            <Button variant="outline" onClick={() => setHealthRetry(x => x + 1)}>تحديث</Button>
          </div>
        </div>
        {healthError ? <p className="text-error">تعذر تحميل حالة التشغيل: {healthError}</p> : !health ? <p>جاري فحص حالة التشغيل…</p> :
          <div className="grid gap-2 text-label-md sm:grid-cols-2 lg:grid-cols-3">
            <p>عامل التشغيل: {health.worker?.healthy ? "يعمل" : "متوقف أو نبضه متأخر"}</p>
            <p>التنبيهات النشطة: {health.alerts.active.toLocaleString("ar-EG")} · المتعثرة: {health.alerts.deadLetter.toLocaleString("ar-EG")}</p>
            <p>تسويات الكاش المتعثرة: {health.cashReconciliationDeadLetters.toLocaleString("ar-EG")}</p>
            <p>فشل Webhook: {health.deadWebhookEvents.toLocaleString("ar-EG")} · فشل الإشعارات: {health.notificationFailures.toLocaleString("ar-EG")}</p>
            <p>Expo Push: {health.configuration.expoPushReady ? "جاهز" : "يلزم الإعداد"}</p>
            <p>Webhook الإشعارات: {health.configuration.notificationWebhookConfigured ? "جاهز" : "يلزم الإعداد"} · Webhook التنبيهات: {health.configuration.operationsAlertWebhookConfigured ? "جاهز" : "يلزم الإعداد"}</p>
          </div>}
      </Card>
      <div className="grid grid-cols-2 gap-sm md:grid-cols-3 lg:grid-cols-6">
        <Stat label="إجمالي المبيعات" value={EGP(data.gmv)} icon="payments" />
        <Stat label="الطلبات" value={data.orders.toLocaleString("ar-EG")} icon="receipt_long" tone="info" />
        <Stat label="طلبات جارية" value={data.activeOrders.toLocaleString("ar-EG")} icon="local_shipping" tone="warn" />
        <Stat label="العملاء" value={data.customers.toLocaleString("ar-EG")} icon="group" tone="info" />
        <Stat label="المطاعم النشطة" value={`${data.activeRestaurants.toLocaleString("ar-EG")} / ${data.restaurants.toLocaleString("ar-EG")}`} icon="storefront" />
        <Stat label="المندوبون المعتمدون" value={data.activeDrivers.toLocaleString("ar-EG")} icon="two_wheeler" tone="success" />
      </div>
      <Card className="p-md"><SectionTitle title="آخر ٦ أشهر" icon="show_chart" />{data.monthly.length ? <Bars values={data.monthly.map(x => x.gmv)} labels={data.monthly.map(x => x.month)} /> : <EmptyState icon="show_chart" title="لا توجد مبيعات بعد" body="ستظهر البيانات الشهرية عند إنشاء الطلبات." />}</Card>
      <Card className="p-md"><SectionTitle title="أفضل المطاعم" icon="military_tech" />{data.topRestaurants.length ? <Table head={["المطعم", "الطلبات", "المبيعات"]}>{data.topRestaurants.map(r => <tr key={r.id}><Td>{r.name}</Td><Td>{Number(r.orders).toLocaleString("ar-EG")}</Td><Td>{EGP(r.gmv)}</Td></tr>)}</Table> : <EmptyState icon="storefront" title="لا توجد بيانات" body="لم تُسجل طلبات للمطاعم بعد." />}</Card>
    </div>}
  </DashboardShell>;
}