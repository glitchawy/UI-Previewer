import { randomUUID } from "node:crypto";
import { and, asc, eq, gt, sql } from "drizzle-orm";
import {
  cartItemsTable,
  db,
  driverProfilesTable,
  notificationDeliveryAttemptsTable,
  notificationDeviceTokensTable,
  authSessionsTable,
  notificationOutboxTable,
  notificationsTable,
  ordersTable,
  orderStatusEventsTable,
  paymobWebhookInboxTable,
  paymentSessionsTable,
  usersTable,
  operationsWorkerHeartbeatTable,
  operationsAlertDeliveriesTable,
} from "@workspace/db";
import { expireDuePaymentSessions, expireLockedPaymentSession, restoreWalletForCancelledOrders } from "./payment-session-lifecycle";
import { logger } from "./logger";
import { dispatchReadyOrders } from "./driver-dispatch";
import { processNotificationDelivery } from "./notification-delivery";
import { evaluateOperationsHealth, processOperationsAlertDelivery } from "./operations-health";

type PaymobCallback = {
  obj?: Record<string, unknown>;
  [key: string]: unknown;
};

const MAX_ATTEMPTS = 8;
const BATCH_SIZE = 20;
const LEASE_SECONDS = 60;
const RECIPIENT_BATCH_SIZE = 500;

function bool(value: unknown) {
  return value === true || value === "true";
}

function terminalBoolean(value: unknown) {
  return value === true || value === false || value === "true" || value === "false";
}

function boundedError(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 2000);
}

function retryDelay(attempt: number) {
  return Math.min(60 * 60_000, 1_000 * (2 ** Math.min(attempt, 12)));
}

class QuarantinedEvent extends Error {}

async function claimRows(table: "paymob_webhook_inbox" | "notification_outbox" | "notification_delivery_attempts" | "operations_alert_deliveries", owner: string) {
  const result = await db.execute(sql.raw(`
    UPDATE ${table} AS work
    SET status = 'processing', lease_owner = '${owner.replaceAll("'", "''")}',
        lease_expires_at = now() + interval '${LEASE_SECONDS} seconds',
        attempt_count = attempt_count + 1
    WHERE work.id IN (
      SELECT id FROM ${table}
      WHERE status IN ('pending','retry','processing')
        AND next_attempt_at <= now()
        AND (status <> 'processing' OR lease_expires_at IS NULL OR lease_expires_at <= now())
      ORDER BY next_attempt_at, id
      FOR UPDATE SKIP LOCKED
      LIMIT ${BATCH_SIZE}
    )
    RETURNING work.id
  `));
  return result.rows.map((row) => Number(row.id));
}

export async function processPaymobInboxEvent(id: number) {
  return db.transaction(async (tx) => {
    const [inbox] = await tx.select().from(paymobWebhookInboxTable)
      .where(and(eq(paymobWebhookInboxTable.id, id), eq(paymobWebhookInboxTable.status, "processing")))
      .limit(1);
    if (!inbox) return;
    const callback = inbox.payload as PaymobCallback;
    const transaction = (callback.obj ?? callback) as Record<string, unknown>;
    const order = (transaction.order ?? {}) as Record<string, unknown>;
    const providerOrderId = order.id === undefined ? "" : String(order.id);
    const reference = typeof order.merchant_order_id === "string"
      ? order.merchant_order_id
      : typeof transaction.special_reference === "string" ? transaction.special_reference : "";
    if (!providerOrderId && !reference) throw new QuarantinedEvent("PAYMOB_REFERENCE_MISSING");

    const candidates = providerOrderId
      ? await tx.select().from(paymentSessionsTable).where(eq(paymentSessionsTable.paymobOrderId, providerOrderId)).limit(1)
      : [];
    const [session] = candidates.length
      ? candidates
      : reference
        ? await tx.select().from(paymentSessionsTable).where(eq(paymentSessionsTable.reference, reference)).limit(1)
        : [];
    if (!session) throw new Error("PAYMENT_SESSION_NOT_FOUND");
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${session.id})`);
    const [locked] = await tx.select().from(paymentSessionsTable).where(eq(paymentSessionsTable.id, session.id)).limit(1);
    if (!locked) throw new Error("PAYMENT_SESSION_NOT_FOUND");
    const quarantine = async (reason: string) => {
      await tx.update(paymobWebhookInboxTable).set({
        status: "dead_letter", deadLetteredAt: new Date(), paymentSessionId: locked.id,
        leaseOwner: null, leaseExpiresAt: null, lastError: reason.slice(0, 2000),
      }).where(eq(paymobWebhookInboxTable.id, id));
    };

    const success = bool(transaction.success);
    const pending = bool(transaction.pending);
    if (pending || !terminalBoolean(transaction.success)) {
      await tx.update(paymobWebhookInboxTable).set({
        status: "processed", processedAt: new Date(), paymentSessionId: locked.id,
        leaseOwner: null, leaseExpiresAt: null, lastError: null,
      }).where(eq(paymobWebhookInboxTable.id, id));
      return;
    }
    if ((reference && reference !== locked.reference) ||
      (providerOrderId && locked.paymobOrderId && providerOrderId !== locked.paymobOrderId)) {
      await quarantine("PAYMOB_REFERENCE_MISMATCH");
      return;
    }
    const receivedCents = Number(transaction.amount_cents);
    const expectedCents = Math.round(Number(locked.amount) * 100);
    const receivedCurrency = typeof transaction.currency === "string" ? transaction.currency.toUpperCase() : "";
    const integrationId = transaction.integration_id === undefined ? "" : String(transaction.integration_id);
    const expectedIntegrations = locked.paymobIntegrationIds?.length
      ? locked.paymobIntegrationIds : locked.paymobIntegrationId ? [locked.paymobIntegrationId] : [];
    if (!Number.isSafeInteger(receivedCents) || receivedCents !== expectedCents ||
      receivedCurrency !== locked.currency.toUpperCase() || !expectedIntegrations.includes(integrationId)) {
      await quarantine("PAYMOB_PAYMENT_DETAILS_MISMATCH");
      return;
    }
    const desired = success ? "paid" : "failed";
    if (locked.status !== "pending") {
      const duplicateTerminal = locked.status === desired || (success && locked.status === "refunded");
      if (!duplicateTerminal) {
        await quarantine(`CONTRADICTORY_TERMINAL_EVENT:${locked.status}:${desired}`);
        return;
      }
      await tx.update(paymobWebhookInboxTable).set({
        status: "processed", processedAt: new Date(), paymentSessionId: locked.id,
        leaseOwner: null, leaseExpiresAt: null, lastError: null,
      }).where(eq(paymobWebhookInboxTable.id, id));
      return;
    }
    if (await expireLockedPaymentSession(tx, locked)) {
      await quarantine("PAYMENT_SESSION_EXPIRED");
      return;
    }
    const transactionId = transaction.id === undefined ? null : String(transaction.id);
    const nextOrderStatus: "confirmed" | "cancelled" = success ? "confirmed" : "cancelled";
    await tx.update(paymentSessionsTable).set({
      status: desired, paymobTransactionId: transactionId,
      failureReason: success ? null : "Paymob transaction was declined or failed", processedAt: new Date(),
    }).where(and(eq(paymentSessionsTable.id, locked.id), eq(paymentSessionsTable.status, "pending")));
    const changedOrders = await tx.update(ordersTable).set({
      paymentStatus: desired, paymobTransactionId: transactionId, status: nextOrderStatus,
    }).where(and(eq(ordersTable.paymentSessionId, locked.id), eq(ordersTable.status, "pending"),
      eq(ordersTable.paymentStatus, "pending"))).returning({ id: ordersTable.id, walletAmountUsed: ordersTable.walletAmountUsed });
    if (!success) await restoreWalletForCancelledOrders(tx, locked, changedOrders);
    if (changedOrders.length) await tx.insert(orderStatusEventsTable).values(changedOrders.map((row) => ({
      orderId: row.id, status: nextOrderStatus,
    })));
    if (success) {
      await tx.delete(cartItemsTable).where(and(eq(cartItemsTable.userId, locked.customerId),
        eq(cartItemsTable.paymentSessionId, locked.id)));
    } else {
      await tx.update(cartItemsTable).set({ paymentSessionId: null }).where(and(
        eq(cartItemsTable.userId, locked.customerId), eq(cartItemsTable.paymentSessionId, locked.id)));
    }
    await tx.update(paymobWebhookInboxTable).set({
      status: "processed", processedAt: new Date(), paymentSessionId: locked.id,
      orderIds: changedOrders.map((row) => row.id), leaseOwner: null, leaseExpiresAt: null, lastError: null,
    }).where(eq(paymobWebhookInboxTable.id, id));
  });
}

async function failInbox(id: number, error: unknown) {
  const [row] = await db.select({ attempts: paymobWebhookInboxTable.attemptCount })
    .from(paymobWebhookInboxTable).where(eq(paymobWebhookInboxTable.id, id)).limit(1);
  if (!row) return;
  const dead = error instanceof QuarantinedEvent || row.attempts >= MAX_ATTEMPTS;
  await db.update(paymobWebhookInboxTable).set({
    status: dead ? "dead_letter" : "retry",
    deadLetteredAt: dead ? new Date() : null,
    nextAttemptAt: new Date(Date.now() + retryDelay(row.attempts)),
    leaseOwner: null, leaseExpiresAt: null, lastError: boundedError(error),
  }).where(and(eq(paymobWebhookInboxTable.id, id), eq(paymobWebhookInboxTable.status, "processing")));
  if (dead) logger.error({ inboxEventId: id, attempts: row.attempts }, "Webhook event dead-lettered");
}

export async function processNotification(id: number) {
  await db.transaction(async (tx) => {
    const [event] = await tx.select().from(notificationOutboxTable).where(and(
      eq(notificationOutboxTable.id, id), eq(notificationOutboxTable.status, "processing")))
      .limit(1).for("update");
    if (!event) return;
    const audience = event.audience as { role?: string; driverProfileId?: number; userId?: number };
    let userIds: number[] = [];
    let hasMore = false;
    if (Number.isInteger(audience.userId)) {
      userIds = event.recipientCursor < audience.userId! ? [audience.userId!] : [];
    }
    else if (Number.isInteger(audience.driverProfileId)) {
      userIds = (await tx.select({ id: driverProfilesTable.userId }).from(driverProfilesTable)
        .where(and(
          eq(driverProfilesTable.id, audience.driverProfileId!),
          gt(driverProfilesTable.userId, event.recipientCursor),
        )).limit(1)).map((row) => row.id);
    } else if (audience.role && ["customer", "partner", "driver"].includes(audience.role)) {
      const recipients = await tx.select({ id: usersTable.id }).from(usersTable)
        .where(and(
          eq(usersTable.role, audience.role as "customer" | "partner" | "driver"),
          gt(usersTable.id, event.recipientCursor),
        ))
        .orderBy(asc(usersTable.id))
        .limit(RECIPIENT_BATCH_SIZE + 1);
      hasMore = recipients.length > RECIPIENT_BATCH_SIZE;
      userIds = recipients.slice(0, RECIPIENT_BATCH_SIZE).map((row) => row.id);
    } else throw new Error("UNSUPPORTED_NOTIFICATION_AUDIENCE");
    const inserted = userIds.length ? await tx.insert(notificationsTable).values(userIds.map((userId) => ({
      userId, eventType: event.eventType, title: event.title, body: event.body,
      deduplicationKey: `${event.deduplicationKey}:${userId}`,
    }))).onConflictDoNothing().returning({ id: notificationsTable.id, userId: notificationsTable.userId }) : [];
    for (const notification of inserted) {
      const now = new Date();
      const devices = await tx.select({ id: notificationDeviceTokensTable.id })
        .from(notificationDeviceTokensTable)
        .innerJoin(authSessionsTable, eq(authSessionsTable.id, notificationDeviceTokensTable.sessionId))
        .where(and(
          eq(notificationDeviceTokensTable.userId, notification.userId),
          sql`${notificationDeviceTokensTable.revokedAt} is null`,
          sql`${authSessionsTable.revokedAt} is null`,
          gt(authSessionsTable.absoluteExpiresAt, now),
          gt(authSessionsTable.idleExpiresAt, now),
        ));
      const [activeSession] = await tx.select({ id: authSessionsTable.id }).from(authSessionsTable)
        .where(and(eq(authSessionsTable.userId, notification.userId),
          sql`${authSessionsTable.revokedAt} is null`,
          gt(authSessionsTable.absoluteExpiresAt, now),
          gt(authSessionsTable.idleExpiresAt, now))).limit(1);
      const payload = {
        title: event.title,
        body: event.body,
        data: { eventType: event.eventType, notificationId: notification.id, userId: notification.userId },
      };
      if (devices.length) {
        await tx.insert(notificationDeliveryAttemptsTable).values(devices.map((device) => ({
          notificationId: notification.id, deviceTokenId: device.id, channel: "expo" as const,
          payload, deduplicationKey: `notification:${notification.id}:expo:${device.id}`,
        }))).onConflictDoNothing();
      }
      if (activeSession && process.env.NOTIFICATION_WEBHOOK_URL) {
        await tx.insert(notificationDeliveryAttemptsTable).values({
          notificationId: notification.id, channel: "webhook", payload,
          deduplicationKey: `notification:${notification.id}:webhook`,
        }).onConflictDoNothing();
      }
      if (!devices.length && (!activeSession || !process.env.NOTIFICATION_WEBHOOK_URL)) {
        await tx.insert(notificationDeliveryAttemptsTable).values({
          notificationId: notification.id, channel: "none", status: "skipped", payload,
          deduplicationKey: `notification:${notification.id}:none`,
          deliveredAt: new Date(), lastError: activeSession ? "NO_EXTERNAL_RECIPIENT" : "NO_ACTIVE_SESSION",
        }).onConflictDoNothing();
      }
    }
    const recipientCursor = userIds[userIds.length - 1] ?? event.recipientCursor;
    await tx.update(notificationOutboxTable).set({
      status: hasMore ? "pending" : "sent",
      sentAt: hasMore ? null : new Date(),
      recipientCursor,
      attemptCount: hasMore ? 0 : event.attemptCount,
      nextAttemptAt: new Date(),
      updatedAt: new Date(),
      leaseOwner: null, leaseExpiresAt: null, lastError: null,
    }).where(and(eq(notificationOutboxTable.id, id), eq(notificationOutboxTable.status, "processing")));
  });
}

async function failNotification(id: number, error: unknown) {
  const [row] = await db.select({ attempts: notificationOutboxTable.attemptCount })
    .from(notificationOutboxTable).where(eq(notificationOutboxTable.id, id)).limit(1);
  if (!row) return;
  const dead = row.attempts >= MAX_ATTEMPTS;
  await db.update(notificationOutboxTable).set({
    status: dead ? "dead_letter" : "retry", nextAttemptAt: new Date(Date.now() + retryDelay(row.attempts)),
    leaseOwner: null, leaseExpiresAt: null, lastError: boundedError(error), updatedAt: new Date(),
  }).where(and(eq(notificationOutboxTable.id, id), eq(notificationOutboxTable.status, "processing")));
}

async function reconcileDirectNotifications() {
  const rows = await db.select({
    id: notificationsTable.id, userId: notificationsTable.userId,
    eventType: notificationsTable.eventType, title: notificationsTable.title, body: notificationsTable.body,
  }).from(notificationsTable).where(sql`not exists (
    select 1 from ${notificationDeliveryAttemptsTable}
    where ${notificationDeliveryAttemptsTable.notificationId} = ${notificationsTable.id}
  )`).orderBy(notificationsTable.id).limit(100);
  for (const notification of rows) {
    await db.transaction(async (tx) => {
      const now = new Date();
      const devices = await tx.select({ id: notificationDeviceTokensTable.id })
        .from(notificationDeviceTokensTable)
        .innerJoin(authSessionsTable, eq(authSessionsTable.id, notificationDeviceTokensTable.sessionId))
        .where(and(
          eq(notificationDeviceTokensTable.userId, notification.userId),
          sql`${notificationDeviceTokensTable.revokedAt} is null`,
          sql`${authSessionsTable.revokedAt} is null`,
          gt(authSessionsTable.absoluteExpiresAt, now),
          gt(authSessionsTable.idleExpiresAt, now),
        ));
      const [activeSession] = await tx.select({ id: authSessionsTable.id }).from(authSessionsTable)
        .where(and(eq(authSessionsTable.userId, notification.userId),
          sql`${authSessionsTable.revokedAt} is null`,
          gt(authSessionsTable.absoluteExpiresAt, now),
          gt(authSessionsTable.idleExpiresAt, now))).limit(1);
      const payload = {
        title: notification.title,
        body: notification.body,
        data: { eventType: notification.eventType, notificationId: notification.id, userId: notification.userId },
      };
      if (devices.length) await tx.insert(notificationDeliveryAttemptsTable).values(devices.map((device) => ({
        notificationId: notification.id, deviceTokenId: device.id, channel: "expo" as const,
        payload, deduplicationKey: `notification:${notification.id}:expo:${device.id}`,
      }))).onConflictDoNothing();
      if (activeSession && process.env.NOTIFICATION_WEBHOOK_URL) await tx.insert(notificationDeliveryAttemptsTable).values({
        notificationId: notification.id, channel: "webhook", payload,
        deduplicationKey: `notification:${notification.id}:webhook`,
      }).onConflictDoNothing();
      if (!devices.length && (!activeSession || !process.env.NOTIFICATION_WEBHOOK_URL)) {
        await tx.insert(notificationDeliveryAttemptsTable).values({
          notificationId: notification.id, channel: "none", status: "skipped", payload,
          deduplicationKey: `notification:${notification.id}:none`,
          deliveredAt: new Date(), lastError: activeSession ? "NO_EXTERNAL_RECIPIENT" : "NO_ACTIVE_SESSION",
        }).onConflictDoNothing();
      }
    });
  }
  return rows.length;
}

async function failNotificationDelivery(id: number, error: unknown) {
  const [row] = await db.select({ attempts: notificationDeliveryAttemptsTable.attemptCount })
    .from(notificationDeliveryAttemptsTable).where(eq(notificationDeliveryAttemptsTable.id, id)).limit(1);
  if (!row) return;
  const dead = row.attempts >= MAX_ATTEMPTS;
  await db.update(notificationDeliveryAttemptsTable).set({
    status: dead ? "dead_letter" : "retry",
    nextAttemptAt: new Date(Date.now() + retryDelay(row.attempts)),
    leaseOwner: null, leaseExpiresAt: null, lastError: boundedError(error), updatedAt: new Date(),
  }).where(and(eq(notificationDeliveryAttemptsTable.id, id),
    eq(notificationDeliveryAttemptsTable.status, "processing")));
  if (dead) logger.error({ notificationDeliveryId: id, attempts: row.attempts },
    "Notification delivery dead-lettered");
}

async function failOperationsAlertDelivery(id: number, error: unknown) {
  const [row] = await db.select({ attempts: operationsAlertDeliveriesTable.attemptCount })
    .from(operationsAlertDeliveriesTable).where(eq(operationsAlertDeliveriesTable.id, id)).limit(1);
  if (!row) return;
  const dead = row.attempts >= MAX_ATTEMPTS;
  await db.update(operationsAlertDeliveriesTable).set({
    status: dead ? "dead_letter" : "retry",
    nextAttemptAt: new Date(Date.now() + retryDelay(row.attempts)),
    leaseOwner: null, leaseExpiresAt: null, lastError: boundedError(error), updatedAt: new Date(),
  }).where(and(eq(operationsAlertDeliveriesTable.id, id),
    eq(operationsAlertDeliveriesTable.status, "processing")));
  if (dead) logger.error({ operationsAlertDeliveryId: id, attempts: row.attempts },
    "Operations alert delivery dead-lettered");
}

export async function runOperationsWorkerOnce(owner = randomUUID()) {
  const inboxIds = await claimRows("paymob_webhook_inbox", owner);
  for (const id of inboxIds) {
    try { await processPaymobInboxEvent(id); } catch (error) { await failInbox(id, error); }
  }
  const outboxIds = await claimRows("notification_outbox", owner);
  for (const id of outboxIds) {
    try { await processNotification(id); } catch (error) { await failNotification(id, error); }
  }
  const reconciledNotifications = await reconcileDirectNotifications();
  const deliveryIds = await claimRows("notification_delivery_attempts", owner);
  for (const id of deliveryIds) {
    try { await processNotificationDelivery(id); } catch (error) { await failNotificationDelivery(id, error); }
  }
  const dispatch = await dispatchReadyOrders();
  const heartbeatAt = new Date();
  await db.insert(operationsWorkerHeartbeatTable).values({
    workerName: "operations", owner, lastStartedAt: heartbeatAt, lastSucceededAt: heartbeatAt,
  }).onConflictDoUpdate({
    target: operationsWorkerHeartbeatTable.workerName,
    set: { owner, lastSucceededAt: heartbeatAt, lastError: null, updatedAt: heartbeatAt },
  });
  const health = await evaluateOperationsHealth();
  const alertIds = await claimRows("operations_alert_deliveries", owner);
  for (const id of alertIds) {
    try { await processOperationsAlertDelivery(id); } catch (error) { await failOperationsAlertDelivery(id, error); }
  }
  return {
    inbox: inboxIds.length, outbox: outboxIds.length, reconciledNotifications,
    deliveries: deliveryIds.length, alerts: alertIds.length, healthCritical: health.critical, dispatch,
  };
}

let timer: ReturnType<typeof setTimeout> | null = null;
let healthTimer: ReturnType<typeof setTimeout> | null = null;
let active: Promise<void> | null = null;
let healthActive: Promise<void> | null = null;
let stopped = true;

export function startOperationsWorker() {
  if (!stopped) return stopOperationsWorker;
  stopped = false;
  const owner = randomUUID();
  let nextReconciliationAt = 0;
  let heartbeatInitialized = false;
  const poll = async () => {
    if (stopped) return;
    active = (async () => {
      try {
        if (!heartbeatInitialized) {
          const startedAt = new Date();
          await db.insert(operationsWorkerHeartbeatTable).values({
            workerName: "operations", owner, lastStartedAt: startedAt,
          }).onConflictDoUpdate({
            target: operationsWorkerHeartbeatTable.workerName,
            set: { owner, lastStartedAt: startedAt, updatedAt: startedAt },
          });
          heartbeatInitialized = true;
        }
        await runOperationsWorkerOnce(owner);
        await db.update(operationsWorkerHeartbeatTable).set({
          lastSucceededAt: new Date(), lastError: null, updatedAt: new Date(),
        }).where(eq(operationsWorkerHeartbeatTable.workerName, "operations"));
        if (Date.now() >= nextReconciliationAt) {
          nextReconciliationAt = Date.now() + 60_000;
          await expireDuePaymentSessions();
        }
      } catch (error) {
        await db.update(operationsWorkerHeartbeatTable).set({
          lastErrorAt: new Date(), lastError: boundedError(error), updatedAt: new Date(),
        }).where(eq(operationsWorkerHeartbeatTable.workerName, "operations")).catch(() => undefined);
        logger.error({ err: error }, "Operations worker poll failed");
      }
    })();
    await active;
    active = null;
    if (!stopped) {
      timer = setTimeout(() => { void poll(); }, 2_000);
      timer.unref();
    }
  };
  const monitor = async () => {
    if (stopped) return;
    healthActive = (async () => {
      try {
        await evaluateOperationsHealth();
        const ids = await claimRows("operations_alert_deliveries", `${owner}:health`);
        for (const id of ids) {
          try { await processOperationsAlertDelivery(id); }
          catch (error) { await failOperationsAlertDelivery(id, error); }
        }
      } catch (error) {
        logger.error({ err: error }, "Proactive operations health evaluation failed");
      }
    })();
    await healthActive;
    healthActive = null;
    if (!stopped) {
      healthTimer = setTimeout(() => { void monitor(); }, 15_000);
      healthTimer.unref();
    }
  };
  void poll();
  healthTimer = setTimeout(() => { void monitor(); }, 15_000);
  healthTimer.unref();
  return stopOperationsWorker;
}

export async function stopOperationsWorker() {
  stopped = true;
  if (timer) clearTimeout(timer);
  if (healthTimer) clearTimeout(healthTimer);
  timer = null;
  healthTimer = null;
  await active;
  await healthActive;
}