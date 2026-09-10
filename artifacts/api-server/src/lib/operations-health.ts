import { createHmac } from "node:crypto";
import { and, count, eq, inArray, lt, sql } from "drizzle-orm";
import {
  db,
  cashOrderReconciliationsTable,
  notificationDeliveryAttemptsTable,
  operationsAlertConditionsTable,
  operationsAlertDeliveriesTable,
  operationsWorkerHeartbeatTable,
  ordersTable,
  paymobWebhookInboxTable,
} from "@workspace/db";

const ALERT_COOLDOWN_MS = 15 * 60_000;

export async function collectOperationsHealth(now = new Date()) {
  const staleBefore = new Date(now.getTime() - 5 * 60_000);
  const [heartbeat, [pending], [deadWebhook], [deadNotification], [deadCashReconciliation], [staleReady]] = await Promise.all([
    db.select().from(operationsWorkerHeartbeatTable)
      .where(eq(operationsWorkerHeartbeatTable.workerName, "operations")).limit(1),
    db.select({ value: count() }).from(paymobWebhookInboxTable)
      .where(inArray(paymobWebhookInboxTable.status, ["pending", "retry", "processing"])),
    db.select({ value: count() }).from(paymobWebhookInboxTable)
      .where(eq(paymobWebhookInboxTable.status, "dead_letter")),
    db.select({ value: count() }).from(notificationDeliveryAttemptsTable)
      .where(eq(notificationDeliveryAttemptsTable.status, "dead_letter")),
    db.select({ value: count() }).from(cashOrderReconciliationsTable)
      .where(eq(cashOrderReconciliationsTable.status, "dead_letter")),
    db.select({ value: count() }).from(ordersTable).where(and(
      eq(ordersTable.status, "ready"), lt(ordersTable.updatedAt, staleBefore),
      sql`${ordersTable.driverProfileId} is null`,
    )),
  ]);
  const worker = heartbeat[0];
  const workerStalled = !worker ||
    (!worker.lastSucceededAt && now.getTime() - worker.lastStartedAt.getTime() > 60_000) ||
    Boolean(worker.lastSucceededAt && now.getTime() - worker.lastSucceededAt.getTime() > 60_000);
  const metrics = {
    pendingWebhookEvents: Number(pending.value),
    deadWebhookEvents: Number(deadWebhook.value),
    notificationDeadLetters: Number(deadNotification.value),
    cashReconciliationDeadLetters: Number(deadCashReconciliation.value),
    staleReadyOrders: Number(staleReady.value),
  };
  const conditions = [
    { key: "worker_stalled", active: workerStalled, severity: "critical" as const, value: workerStalled ? 1 : 0 },
    { key: "paymob_backlog", active: metrics.pendingWebhookEvents >= 20,
      severity: (metrics.pendingWebhookEvents >= 100 ? "critical" : "warning") as "critical" | "warning",
      value: metrics.pendingWebhookEvents },
    { key: "paymob_dead_letters", active: metrics.deadWebhookEvents > 0,
      severity: "critical" as const, value: metrics.deadWebhookEvents },
    { key: "notification_dead_letters", active: metrics.notificationDeadLetters > 0,
      severity: "warning" as const, value: metrics.notificationDeadLetters },
    { key: "cash_reconciliation_dead_letters", active: metrics.cashReconciliationDeadLetters > 0,
      severity: "critical" as const, value: metrics.cashReconciliationDeadLetters },
    { key: "stale_ready_orders", active: metrics.staleReadyOrders > 0,
      severity: (metrics.staleReadyOrders >= 10 ? "critical" : "warning") as "critical" | "warning",
      value: metrics.staleReadyOrders },
  ];
  return {
    worker,
    metrics,
    conditions,
    critical: conditions.some((condition) => condition.active && condition.severity === "critical"),
  };
}

export async function evaluateOperationsHealth(now = new Date()) {
  const health = await collectOperationsHealth(now);
  for (const condition of health.conditions) {
    await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${`operations:${condition.key}`}))`);
      const [previous] = await tx.select().from(operationsAlertConditionsTable)
        .where(eq(operationsAlertConditionsTable.conditionKey, condition.key)).limit(1);
      const dueReminder = Boolean(condition.active && previous?.active && previous.lastAlertAt &&
        now.getTime() - previous.lastAlertAt.getTime() >= ALERT_COOLDOWN_MS);
      const eventKind = condition.active && (!previous?.active || dueReminder)
        ? "active" as const
        : !condition.active && previous?.active ? "recovery" as const : null;
      const sequence = (previous?.sequence ?? 0) + (eventKind ? 1 : 0);
      await tx.insert(operationsAlertConditionsTable).values({
        conditionKey: condition.key,
        active: condition.active,
        severity: condition.severity,
        sequence,
        firstDetectedAt: condition.active ? previous?.firstDetectedAt ?? now : null,
        lastDetectedAt: condition.active ? now : previous?.lastDetectedAt,
        lastAlertAt: eventKind ? now : previous?.lastAlertAt,
        recoveredAt: eventKind === "recovery" ? now : previous?.recoveredAt,
      }).onConflictDoUpdate({
        target: operationsAlertConditionsTable.conditionKey,
        set: {
          active: condition.active, severity: condition.severity, sequence,
          firstDetectedAt: condition.active ? previous?.firstDetectedAt ?? now : null,
          lastDetectedAt: condition.active ? now : previous?.lastDetectedAt,
          lastAlertAt: eventKind ? now : previous?.lastAlertAt,
          recoveredAt: eventKind === "recovery" ? now : previous?.recoveredAt,
          updatedAt: now,
        },
      });
      if (eventKind) {
        const payload = {
          condition: condition.key,
          event: eventKind,
          severity: condition.severity,
          value: condition.value,
          evaluatedAt: now.toISOString(),
        };
        await tx.insert(operationsAlertDeliveriesTable).values({
          conditionKey: condition.key,
          eventKind,
          severity: condition.severity,
          payload,
          deduplicationKey: `${condition.key}:${sequence}:${eventKind}`,
          status: process.env.OPERATIONS_ALERT_WEBHOOK_URL ? "pending" : "skipped",
          deliveredAt: process.env.OPERATIONS_ALERT_WEBHOOK_URL ? null : now,
          lastError: process.env.OPERATIONS_ALERT_WEBHOOK_URL ? null : "OPERATIONS_ALERT_SINK_NOT_CONFIGURED",
        }).onConflictDoNothing();
      }
    });
  }
  await db.update(operationsWorkerHeartbeatTable).set({
    lastHealthEvaluatedAt: now,
    lastHealthCritical: health.critical,
    updatedAt: now,
  }).where(eq(operationsWorkerHeartbeatTable.workerName, "operations"));
  return health;
}

export async function processOperationsAlertDelivery(id: number) {
  const [attempt] = await db.select().from(operationsAlertDeliveriesTable).where(and(
    eq(operationsAlertDeliveriesTable.id, id),
    eq(operationsAlertDeliveriesTable.status, "processing"),
  )).limit(1);
  if (!attempt) return;
  const configured = process.env.OPERATIONS_ALERT_WEBHOOK_URL;
  if (!configured) throw new Error("OPERATIONS_ALERT_WEBHOOK_NOT_CONFIGURED");
  const url = new URL(configured);
  if (url.protocol !== "https:") throw new Error("OPERATIONS_ALERT_WEBHOOK_MUST_USE_HTTPS");
  const body = JSON.stringify(attempt.payload);
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (process.env.OPERATIONS_ALERT_WEBHOOK_SECRET) {
    headers["x-talabat-signature"] = createHmac("sha256", process.env.OPERATIONS_ALERT_WEBHOOK_SECRET)
      .update(body).digest("hex");
  }
  const response = await fetch(url, {
    method: "POST", headers, body, signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`OPERATIONS_ALERT_HTTP_${response.status}`);
  await db.update(operationsAlertDeliveriesTable).set({
    status: "delivered", deliveredAt: new Date(), leaseOwner: null, leaseExpiresAt: null,
    lastError: null, updatedAt: new Date(),
  }).where(and(eq(operationsAlertDeliveriesTable.id, id),
    eq(operationsAlertDeliveriesTable.status, "processing")));
}