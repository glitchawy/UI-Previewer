import { and, eq, gt, isNull } from "drizzle-orm";
import {
  db,
  notificationDeliveryAttemptsTable,
  notificationDeviceTokensTable,
  notificationsTable,
  authSessionsTable,
} from "@workspace/db";

export function notificationProviderConfiguration() {
  return {
    expoProviderSupported: true,
    notificationWebhookConfigured: Boolean(process.env.NOTIFICATION_WEBHOOK_URL),
    operationsAlertWebhookConfigured: Boolean(process.env.OPERATIONS_ALERT_WEBHOOK_URL),
  };
}

export async function processNotificationDelivery(id: number) {
  const [attempt] = await db.select().from(notificationDeliveryAttemptsTable).where(and(
    eq(notificationDeliveryAttemptsTable.id, id),
    eq(notificationDeliveryAttemptsTable.status, "processing"),
  )).limit(1);
  if (!attempt) return;
  if (attempt.channel === "none") {
    await db.update(notificationDeliveryAttemptsTable).set({
      status: "skipped", deliveredAt: new Date(), leaseOwner: null, leaseExpiresAt: null,
      lastError: "NO_EXTERNAL_RECIPIENT", updatedAt: new Date(),
    }).where(eq(notificationDeliveryAttemptsTable.id, id));
    return;
  }
  let url: string;
  let body: unknown;
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (attempt.channel === "expo") {
    const [device] = attempt.deviceTokenId
      ? await db.select({ device: notificationDeviceTokensTable }).from(notificationDeviceTokensTable)
        .innerJoin(authSessionsTable, eq(authSessionsTable.id, notificationDeviceTokensTable.sessionId))
        .where(and(eq(notificationDeviceTokensTable.id, attempt.deviceTokenId),
          isNull(notificationDeviceTokensTable.revokedAt),
          isNull(authSessionsTable.revokedAt),
          gt(authSessionsTable.absoluteExpiresAt, new Date()),
          gt(authSessionsTable.idleExpiresAt, new Date()))).limit(1)
      : [];
    if (!device) {
      await db.update(notificationDeliveryAttemptsTable).set({
        status: "skipped", deliveredAt: new Date(), leaseOwner: null, leaseExpiresAt: null,
        lastError: "DEVICE_TOKEN_REVOKED", updatedAt: new Date(),
      }).where(eq(notificationDeliveryAttemptsTable.id, id));
      return;
    }
    url = "https://exp.host/--/api/v2/push/send";
    body = { to: device.device.token, ...(attempt.payload as object) };
    if (process.env.EXPO_ACCESS_TOKEN) headers.authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  } else {
    const [activeRecipient] = await db.select({ id: authSessionsTable.id }).from(notificationsTable)
      .innerJoin(authSessionsTable, eq(authSessionsTable.userId, notificationsTable.userId))
      .where(and(eq(notificationsTable.id, attempt.notificationId),
        isNull(authSessionsTable.revokedAt),
        gt(authSessionsTable.absoluteExpiresAt, new Date()),
        gt(authSessionsTable.idleExpiresAt, new Date()))).limit(1);
    if (!activeRecipient) {
      await db.update(notificationDeliveryAttemptsTable).set({
        status: "skipped", deliveredAt: new Date(), leaseOwner: null, leaseExpiresAt: null,
        lastError: "NO_ACTIVE_SESSION", updatedAt: new Date(),
      }).where(eq(notificationDeliveryAttemptsTable.id, id));
      return;
    }
    const configured = process.env.NOTIFICATION_WEBHOOK_URL;
    if (!configured) throw new Error("NOTIFICATION_WEBHOOK_NOT_CONFIGURED");
    const parsed = new URL(configured);
    if (parsed.protocol !== "https:") throw new Error("NOTIFICATION_WEBHOOK_MUST_USE_HTTPS");
    url = parsed.toString();
    body = attempt.payload;
    if (process.env.NOTIFICATION_WEBHOOK_SECRET) {
      headers.authorization = `Bearer ${process.env.NOTIFICATION_WEBHOOK_SECRET}`;
    }
  }
  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`NOTIFICATION_PROVIDER_HTTP_${response.status}`);
  if (attempt.channel === "expo") {
    const result = await response.json() as { data?: { status?: string } | { status?: string }[] };
    const tickets = Array.isArray(result.data) ? result.data : result.data ? [result.data] : [];
    if (!tickets.length || tickets.some((ticket) => ticket.status !== "ok")) {
      throw new Error("EXPO_PUSH_TICKET_REJECTED");
    }
  }
  await db.update(notificationDeliveryAttemptsTable).set({
    status: "delivered", deliveredAt: new Date(), leaseOwner: null, leaseExpiresAt: null,
    lastError: null, updatedAt: new Date(),
  }).where(and(eq(notificationDeliveryAttemptsTable.id, id),
    eq(notificationDeliveryAttemptsTable.status, "processing")));
}