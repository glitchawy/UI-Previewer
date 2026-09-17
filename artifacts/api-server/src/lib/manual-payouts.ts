import { and, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import {
  db,
  driverEarningsTable,
  driverProfilesTable,
  manualPayoutAllocationsTable,
  manualPayoutProofsTable,
  manualPayoutRequestsTable,
  platformSettingsTable,
  restaurantSettlementsTable,
  restaurantsTable,
  usersTable,
  walletTransactionsTable,
} from "@workspace/db";
import { recordBusinessAudit } from "./business-audit";
import { debitWallet, fromCents, toCents, type DbTransaction } from "./wallet-ledger";

export const DEFAULT_PAYOUT_SETTINGS = {
  channels: {
    instapay: { fee: 5 },
    mobile_wallet: { fee: 10 },
    cash_branch: { fee: 100 },
  },
  defaultFeePayer: "recipient" as PayoutFeePayer,
};

export type PayoutChannel = keyof typeof DEFAULT_PAYOUT_SETTINGS.channels;
export type PayoutFeePayer = "recipient" | "platform";
export type PayoutRole = "driver" | "partner";

export class ManualPayoutError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ManualPayoutError";
  }
}

type PayoutDestination = {
  accountName: string;
  instapayAddress?: string;
  mobileNumber?: string;
  branch?: string;
};

type PayoutOwner = {
  userId: number;
  role: PayoutRole;
  driverProfileId?: number;
};

type EligibleSource = {
  sourceType: "driver_earning" | "restaurant_settlement";
  sourceId: number;
  sourceReferenceId: number;
  amount: string;
};

type PayoutSettings = typeof DEFAULT_PAYOUT_SETTINGS;

export function serializeManualPayout(
  payout: typeof manualPayoutRequestsTable.$inferSelect,
  proof: typeof manualPayoutProofsTable.$inferSelect | null = null,
) {
  return {
    id: payout.id,
    recipientUserId: payout.recipientUserId,
    recipientRole: payout.recipientRole,
    channel: payout.channel,
    destination: payout.destination,
    idempotencyKey: payout.idempotencyKey,
    grossAmount: Number(payout.grossAmount),
    feeAmount: Number(payout.feeAmount),
    feePayer: payout.feePayer,
    netAmount: Number(payout.netAmount),
    status: payout.status,
    provider: payout.provider,
    providerMetadata: payout.providerMetadata,
    transferReference: payout.transferReference,
    rejectionReason: payout.rejectionReason,
    proof: proof ? {
      objectPath: proof.objectPath,
      contentType: proof.contentType,
      size: proof.size,
      isSignedReceipt: proof.isSignedReceipt,
      uploadedByAdminId: proof.uploadedByAdminId,
      createdAt: proof.createdAt,
    } : null,
    approvedByAdminId: payout.approvedByAdminId,
    approvedAt: payout.approvedAt,
    rejectedByAdminId: payout.rejectedByAdminId,
    rejectedAt: payout.rejectedAt,
    paidByAdminId: payout.paidByAdminId,
    paidAt: payout.paidAt,
    createdAt: payout.createdAt,
    updatedAt: payout.updatedAt,
  };
}

function cleanDestination(channel: PayoutChannel, input: unknown): PayoutDestination {
  if (!input || typeof input !== "object") {
    throw new ManualPayoutError(400, "INVALID_DESTINATION", "وجهة التحويل مطلوبة");
  }
  const body = input as Record<string, unknown>;
  const accountName = typeof body.accountName === "string" ? body.accountName.trim() : "";
  const instapayAddress = typeof body.instapayAddress === "string" ? body.instapayAddress.trim() : "";
  const mobileNumber = typeof body.mobileNumber === "string" ? body.mobileNumber.trim() : "";
  const branch = typeof body.branch === "string" ? body.branch.trim() : "";
  if (accountName.length < 2 || accountName.length > 120) {
    throw new ManualPayoutError(400, "INVALID_DESTINATION", "اسم صاحب الحساب غير صحيح");
  }
  if (channel === "instapay" && (instapayAddress.length < 3 || instapayAddress.length > 200 || mobileNumber || branch)) {
    throw new ManualPayoutError(400, "INVALID_DESTINATION", "بيانات إنستا باي غير صحيحة");
  }
  if (channel === "mobile_wallet" && (!/^[+]?[0-9 ()-]{8,24}$/.test(mobileNumber) || instapayAddress || branch)) {
    throw new ManualPayoutError(400, "INVALID_DESTINATION", "رقم المحفظة غير صحيح");
  }
  if (channel === "cash_branch" && (branch.length < 2 || branch.length > 160 || instapayAddress || mobileNumber)) {
    throw new ManualPayoutError(400, "INVALID_DESTINATION", "الفرع المطلوب غير صحيح");
  }
  return {
    accountName,
    ...(channel === "instapay" ? { instapayAddress } : {}),
    ...(channel === "mobile_wallet" ? { mobileNumber } : {}),
    ...(channel === "cash_branch" ? { branch } : {}),
  };
}

function parseSettings(value: unknown): PayoutSettings {
  if (!value || typeof value !== "object") throw new Error("PAYOUT_SETTINGS_INVALID");
  const input = value as Record<string, unknown>;
  const channels = input.channels;
  const payer = input.defaultFeePayer;
  if (!channels || typeof channels !== "object" || (payer !== "recipient" && payer !== "platform")) {
    throw new Error("PAYOUT_SETTINGS_INVALID");
  }
  const channelValues = channels as Record<string, unknown>;
  const result = { channels: {} as PayoutSettings["channels"], defaultFeePayer: payer as PayoutFeePayer };
  for (const channel of ["instapay", "mobile_wallet", "cash_branch"] as const) {
    const row = channelValues[channel];
    const fee = row && typeof row === "object" ? Number((row as Record<string, unknown>).fee) : NaN;
    if (!Number.isFinite(fee) || fee < 0 || fee > 100_000) throw new Error("PAYOUT_SETTINGS_INVALID");
    result.channels[channel] = { fee: Math.round(fee * 100) / 100 };
  }
  return result;
}

export async function readPayoutSettings(executor: Pick<typeof db, "select"> = db) {
  const [row] = await executor.select().from(platformSettingsTable)
    .where(eq(platformSettingsTable.key, "payouts")).limit(1);
  if (!row) return { ...DEFAULT_PAYOUT_SETTINGS, version: 1, updatedAt: null as Date | null };
  return { ...parseSettings(row.value), version: row.version, updatedAt: row.updatedAt };
}

export async function updatePayoutSettings(input: {
  version: number;
  channels: unknown;
  defaultFeePayer: unknown;
  reason: string;
  adminId: number;
  requestId: string;
}) {
  if (!Number.isInteger(input.version) || input.reason.trim().length < 3) {
    throw new ManualPayoutError(400, "INVALID_PAYOUT_SETTINGS", "الإعدادات والإصدار والسبب مطلوبة");
  }
  let next: PayoutSettings;
  try {
    next = parseSettings({ channels: input.channels, defaultFeePayer: input.defaultFeePayer });
  } catch {
    throw new ManualPayoutError(400, "INVALID_PAYOUT_SETTINGS", "رسوم التحويل أو صاحب الرسوم غير صحيحة");
  }
  return db.transaction(async (tx) => {
    let [row] = await tx.select().from(platformSettingsTable)
      .where(eq(platformSettingsTable.key, "payouts")).limit(1);
    if (!row) {
      [row] = await tx.insert(platformSettingsTable).values({
        key: "payouts", value: DEFAULT_PAYOUT_SETTINGS, version: 1,
      }).returning();
    }
    if (row.version !== input.version) {
      throw new ManualPayoutError(409, "PAYOUT_SETTINGS_VERSION_CONFLICT", "تم تعديل الإعدادات، أعد التحميل");
    }
    const [updated] = await tx.update(platformSettingsTable).set({
      value: next,
      version: row.version + 1,
      updatedByAdminId: input.adminId,
      updatedAt: new Date(),
    }).where(and(eq(platformSettingsTable.key, "payouts"), eq(platformSettingsTable.version, row.version))).returning();
    if (!updated) throw new ManualPayoutError(409, "PAYOUT_SETTINGS_VERSION_CONFLICT", "تم تعديل الإعدادات، أعد المحاولة");
    await recordBusinessAudit(tx, {
      actorAdminId: input.adminId, action: "manual_payout.settings_updated", entityType: "platform_setting",
      entityId: "payouts", before: row, after: updated, reason: input.reason, requestId: input.requestId,
    });
    return { ...next, version: updated.version, updatedAt: updated.updatedAt };
  });
}

async function payoutOwner(tx: DbTransaction, userId: number, role: string): Promise<PayoutOwner | null> {
  if (role === "driver") {
    const [profile] = await tx.select({ id: driverProfilesTable.id })
      .from(driverProfilesTable)
      .where(eq(driverProfilesTable.userId, userId))
      .orderBy(desc(driverProfilesTable.createdAt)).limit(1);
    return profile ? { userId, role: "driver", driverProfileId: profile.id } : null;
  }
  if (role === "partner") {
    const [restaurant] = await tx.select({ id: restaurantsTable.id })
      .from(restaurantsTable).where(eq(restaurantsTable.ownerUserId, userId)).limit(1);
    return restaurant ? { userId, role: "partner" } : null;
  }
  return null;
}

async function eligibleSources(tx: DbTransaction, owner: PayoutOwner): Promise<EligibleSource[]> {
  const credit = alias(walletTransactionsTable, "payout_source_credit");
  const debit = alias(walletTransactionsTable, "payout_source_debit");
  if (owner.role === "driver") {
    const rows = await tx.select({
      sourceId: driverEarningsTable.id,
      sourceReferenceId: driverEarningsTable.orderId,
      sourceAmount: driverEarningsTable.netAmount,
      creditAmount: credit.amount,
    }).from(driverEarningsTable)
      .innerJoin(credit, and(
        eq(credit.userId, owner.userId),
        eq(credit.type, "credit"),
        eq(credit.referenceType, "driver_earning"),
        eq(credit.referenceId, driverEarningsTable.orderId),
      ))
      .leftJoin(debit, and(
        eq(debit.userId, owner.userId),
        eq(debit.type, "debit"),
        eq(debit.referenceType, "driver_earning"),
        eq(debit.referenceId, driverEarningsTable.orderId),
      ))
      .where(and(
        eq(driverEarningsTable.driverProfileId, owner.driverProfileId!),
        isNull(debit.id),
      ));
    return rows.flatMap((row) => {
      if (toCents(row.sourceAmount) !== toCents(row.creditAmount)) return [];
      return [{ sourceType: "driver_earning" as const, sourceId: row.sourceId, sourceReferenceId: row.sourceReferenceId, amount: row.sourceAmount }];
    });
  }
  const settlementCredit = alias(walletTransactionsTable, "settlement_source_credit");
  const settlementDebit = alias(walletTransactionsTable, "settlement_source_debit");
  const rows = await tx.select({
    sourceId: restaurantSettlementsTable.id,
    sourceReferenceId: restaurantSettlementsTable.orderId,
    sourceAmount: restaurantSettlementsTable.netAmount,
    creditAmount: settlementCredit.amount,
  }).from(restaurantSettlementsTable)
    .innerJoin(restaurantsTable, eq(restaurantsTable.id, restaurantSettlementsTable.restaurantId))
    .innerJoin(settlementCredit, and(
      eq(settlementCredit.userId, owner.userId),
      eq(settlementCredit.type, "credit"),
      eq(settlementCredit.referenceType, "restaurant_settlement"),
      eq(settlementCredit.referenceId, restaurantSettlementsTable.orderId),
    ))
    .leftJoin(settlementDebit, and(
      eq(settlementDebit.userId, owner.userId),
      eq(settlementDebit.type, "debit"),
      eq(settlementDebit.referenceType, "restaurant_settlement"),
      eq(settlementDebit.referenceId, restaurantSettlementsTable.orderId),
    ))
    .where(and(
      eq(restaurantsTable.ownerUserId, owner.userId),
      inArray(restaurantSettlementsTable.status, ["pending", "approved"]),
      isNull(settlementDebit.id),
      sql`${restaurantSettlementsTable.orderId} is not null`,
      sql`not exists (
        select 1
        from restaurant_settlements legacy_aggregate
        where legacy_aggregate.restaurant_id = ${restaurantSettlementsTable.restaurantId}
          and legacy_aggregate.order_id is null
          and legacy_aggregate.status = 'paid'
          and legacy_aggregate.period_start <= ${restaurantSettlementsTable.periodStart}
          and legacy_aggregate.period_end >= ${restaurantSettlementsTable.periodEnd}
      )`,
    ));
  return rows.flatMap((row) => {
    if (row.sourceReferenceId == null || toCents(row.sourceAmount) !== toCents(row.creditAmount)) return [];
    return [{ sourceType: "restaurant_settlement" as const, sourceId: row.sourceId, sourceReferenceId: row.sourceReferenceId, amount: row.sourceAmount }];
  });
}

async function freeSources(tx: DbTransaction, owner: PayoutOwner, sources: EligibleSource[]) {
  if (!sources.length) return sources;
  const active = await tx.select({
    sourceType: manualPayoutAllocationsTable.sourceType,
    sourceId: manualPayoutAllocationsTable.sourceId,
  }).from(manualPayoutAllocationsTable).where(and(
    eq(manualPayoutAllocationsTable.recipientUserId, owner.userId),
    inArray(manualPayoutAllocationsTable.status, ["reserved", "consumed"]),
  ));
  const occupied = new Set(active.map((row) => `${row.sourceType}:${row.sourceId}`));
  return sources.filter((source) => !occupied.has(`${source.sourceType}:${source.sourceId}`));
}

async function lockSources(tx: DbTransaction, sources: EligibleSource[]) {
  for (const source of [...sources].sort((a, b) => a.sourceId - b.sourceId || a.sourceType.localeCompare(b.sourceType))) {
    const namespace = source.sourceType === "driver_earning" ? 78249 : 78250;
    await tx.execute(sql`select pg_advisory_xact_lock(${namespace}, ${source.sourceId})`);
  }
}

function sumCents(sources: EligibleSource[]) {
  return sources.reduce((total, source) => total + toCents(source.amount), 0);
}

function capSources(sources: EligibleSource[], maxCents: number) {
  let remaining = maxCents;
  return sources.flatMap((source) => {
    if (remaining <= 0) return [];
    const amountCents = Math.min(toCents(source.amount), remaining);
    remaining -= amountCents;
    return amountCents > 0 ? [{ ...source, amount: fromCents(amountCents) }] : [];
  });
}

async function loadPayout(tx: DbTransaction, payoutId: number) {
  const [payout] = await tx.select().from(manualPayoutRequestsTable)
    .where(eq(manualPayoutRequestsTable.id, payoutId)).limit(1);
  return payout ?? null;
}

async function proofFor(tx: DbTransaction, payoutId: number) {
  const [proof] = await tx.select().from(manualPayoutProofsTable)
    .where(eq(manualPayoutProofsTable.payoutRequestId, payoutId)).limit(1);
  return proof ?? null;
}

export async function requestManualPayout(input: {
  userId: number;
  role: PayoutRole;
  channel: PayoutChannel;
  destination: unknown;
  idempotencyKey: string;
  requestId: string;
}) {
  const destination = cleanDestination(input.channel, input.destination);
  if (input.idempotencyKey.length < 8 || input.idempotencyKey.length > 160) {
    throw new ManualPayoutError(400, "INVALID_IDEMPOTENCY_KEY", "مفتاح التكرار غير صحيح");
  }
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"manual-payout-user:" + input.userId}, 0))`);
    const [existing] = await tx.select().from(manualPayoutRequestsTable).where(and(
      eq(manualPayoutRequestsTable.recipientUserId, input.userId),
      eq(manualPayoutRequestsTable.idempotencyKey, input.idempotencyKey),
    )).limit(1);
    if (existing) {
      if (existing.channel !== input.channel || JSON.stringify(existing.destination) !== JSON.stringify(destination)) {
        throw new ManualPayoutError(409, "IDEMPOTENCY_KEY_REUSED", "مفتاح التكرار مستخدم لطلب مختلف");
      }
      return { payout: existing, existing: true };
    }
    const owner = await payoutOwner(tx, input.userId, input.role);
    if (!owner) throw new ManualPayoutError(403, "PAYOUT_ROLE_NOT_ELIGIBLE", "حسابك غير مؤهل لطلب تحويل");
    const settings = await readPayoutSettings(tx);
    let sources = await eligibleSources(tx, owner);
    await lockSources(tx, sources);
    sources = await freeSources(tx, owner, await eligibleSources(tx, owner));
    const wallet = await tx.execute(sql`select wallet_balance from users where id = ${input.userId} for update`);
    const walletBalance = Number((wallet.rows[0] as { wallet_balance?: string } | undefined)?.wallet_balance ?? 0);
    const [held] = await tx.select({ amount: sql<string>`coalesce(sum(${manualPayoutAllocationsTable.amount}), 0)` })
      .from(manualPayoutAllocationsTable).where(and(
        eq(manualPayoutAllocationsTable.recipientUserId, input.userId),
        eq(manualPayoutAllocationsTable.status, "reserved"),
      ));
    const spendableCents = Math.max(0, toCents(walletBalance) - toCents(held?.amount ?? "0"));
    sources = capSources(sources, spendableCents);
    const grossCents = sumCents(sources);
    if (grossCents <= 0) throw new ManualPayoutError(422, "NO_SPENDABLE_EARNINGS", "لا يوجد رصيد أرباح قابل للتحويل");
    const feeCents = toCents(settings.channels[input.channel].fee);
    const netCents = grossCents - (settings.defaultFeePayer === "recipient" ? feeCents : 0);
    if (netCents <= 0) throw new ManualPayoutError(422, "PAYOUT_NET_NOT_POSITIVE", "قيمة التحويل بعد المصروف يجب أن تكون موجبة");
    const [payout] = await tx.insert(manualPayoutRequestsTable).values({
      recipientUserId: input.userId,
      recipientRole: input.role,
      channel: input.channel,
      destination,
      idempotencyKey: input.idempotencyKey,
      grossAmount: fromCents(grossCents),
      feeAmount: fromCents(feeCents),
      feePayer: settings.defaultFeePayer,
      netAmount: fromCents(netCents),
      provider: "manual",
      providerMetadata: { rail: input.channel, automation: "not_configured" },
    }).returning();
    await tx.insert(manualPayoutAllocationsTable).values(sources.map((source) => ({
      payoutRequestId: payout.id,
      recipientUserId: input.userId,
      sourceType: source.sourceType,
      sourceId: source.sourceId,
      sourceReferenceId: source.sourceReferenceId,
      amount: source.amount,
    })));
    await recordBusinessAudit(tx, {
      actorAdminId: null,
      actorUserId: input.userId,
      actorRole: input.role,
      action: "manual_payout.requested",
      entityType: "manual_payout",
      entityId: payout.id,
      after: payout,
      reason: "Recipient requested full spendable earnings balance",
      requestId: input.requestId,
    });
    return { payout, existing: false };
  });
}

export async function listOwnPayouts(userId: number, role: PayoutRole) {
  return db.transaction(async (tx) => {
    const settings = await readPayoutSettings(tx);
    const owner = await payoutOwner(tx, userId, role);
    if (!owner) throw new ManualPayoutError(403, "PAYOUT_ROLE_NOT_ELIGIBLE", "حسابك غير مؤهل لعرض التحويلات");
    const sources = await freeSources(tx, owner, await eligibleSources(tx, owner));
    const [reserved] = await tx.select({ total: sql<string>`coalesce(sum(${manualPayoutAllocationsTable.amount}), 0)` })
      .from(manualPayoutAllocationsTable).where(and(
        eq(manualPayoutAllocationsTable.recipientUserId, userId),
        eq(manualPayoutAllocationsTable.status, "reserved"),
      ));
    const wallet = await tx.execute(sql`select wallet_balance from users where id = ${userId}`);
    const walletBalanceCents = toCents(Number((wallet.rows[0] as { wallet_balance?: string } | undefined)?.wallet_balance ?? 0));
    const reservedCents = toCents(reserved?.total ?? "0");
    const [approved] = await tx.select({ total: sql<string>`coalesce(sum(${manualPayoutRequestsTable.netAmount}), 0)` })
      .from(manualPayoutRequestsTable).where(and(
        eq(manualPayoutRequestsTable.recipientUserId, userId),
        eq(manualPayoutRequestsTable.status, "approved"),
      ));
    const [paid] = await tx.select({ total: sql<string>`coalesce(sum(${manualPayoutRequestsTable.netAmount}), 0)` })
      .from(manualPayoutRequestsTable).where(and(
        eq(manualPayoutRequestsTable.recipientUserId, userId),
        eq(manualPayoutRequestsTable.status, "paid"),
      ));
    const requests = await tx.select().from(manualPayoutRequestsTable)
      .where(eq(manualPayoutRequestsTable.recipientUserId, userId))
      .orderBy(desc(manualPayoutRequestsTable.createdAt), desc(manualPayoutRequestsTable.id)).limit(100);
    const proofs = await tx.select().from(manualPayoutProofsTable)
      .where(inArray(manualPayoutProofsTable.payoutRequestId, requests.map((request) => request.id)));
    const proofByPayout = new Map(proofs.map((proof) => [proof.payoutRequestId, proof]));
    return {
      summary: {
        available: Number(fromCents(Math.min(sumCents(sources), Math.max(0, walletBalanceCents - reservedCents)))),
        reserved: Number(reserved?.total ?? 0),
        approved: Number(approved?.total ?? 0),
        paid: Number(paid?.total ?? 0),
        fee: 0,
        currency: "EGP" as const,
      },
      settings,
      requests: requests.map((request) => serializeManualPayout(request, proofByPayout.get(request.id) ?? null)),
    };
  });
}

export async function cancelOwnPayout(userId: number, role: PayoutRole, payoutId: number, requestId: string) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"manual-payout-user:" + userId}, 0))`);
    const payout = await loadPayout(tx, payoutId);
    if (!payout || payout.recipientUserId !== userId || payout.recipientRole !== role) {
      throw new ManualPayoutError(404, "PAYOUT_NOT_FOUND", "طلب التحويل غير موجود");
    }
    if (payout.status === "cancelled") return payout;
    if (payout.status !== "pending") throw new ManualPayoutError(409, "PAYOUT_NOT_CANCELLABLE", "لا يمكن إلغاء الطلب بعد مراجعته");
    await tx.update(manualPayoutAllocationsTable).set({ status: "released", releasedAt: new Date() })
      .where(and(eq(manualPayoutAllocationsTable.payoutRequestId, payoutId), eq(manualPayoutAllocationsTable.status, "reserved")));
    const [updated] = await tx.update(manualPayoutRequestsTable).set({
      status: "cancelled", updatedAt: new Date(),
    }).where(and(eq(manualPayoutRequestsTable.id, payoutId), eq(manualPayoutRequestsTable.status, "pending"))).returning();
    if (!updated) throw new ManualPayoutError(409, "PAYOUT_TRANSITION_CONFLICT", "تم تعديل الطلب، أعد المحاولة");
    await recordBusinessAudit(tx, {
      actorAdminId: null, actorUserId: userId, actorRole: role,
      action: "manual_payout.cancelled", entityType: "manual_payout", entityId: payoutId,
      before: payout, after: updated, reason: "Recipient cancelled payout request", requestId,
    });
    return updated;
  });
}

export async function adminTransitionPayout(input: {
  payoutId: number;
  action: "approve" | "reject" | "paid";
  adminId: number;
  reason: string;
  transferReference?: string;
  requestId: string;
}) {
  if (input.reason.trim().length < 3) throw new ManualPayoutError(400, "REASON_REQUIRED", "سبب العملية مطلوب");
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(78251, ${input.payoutId})`);
    const payout = await loadPayout(tx, input.payoutId);
    if (!payout) throw new ManualPayoutError(404, "PAYOUT_NOT_FOUND", "طلب التحويل غير موجود");
    if (input.action === "approve" && payout.status === "approved") return payout;
    if (input.action === "reject" && payout.status === "rejected") return payout;
    if (input.action === "paid" && payout.status === "paid") return payout;
    if (input.action === "approve") {
      if (payout.status !== "pending") throw new ManualPayoutError(409, "PAYOUT_TRANSITION_CONFLICT", "لا يمكن اعتماد الطلب في حالته الحالية");
      const [updated] = await tx.update(manualPayoutRequestsTable).set({
        status: "approved", approvedByAdminId: input.adminId, approvedAt: new Date(), updatedAt: new Date(),
      }).where(and(eq(manualPayoutRequestsTable.id, input.payoutId), eq(manualPayoutRequestsTable.status, "pending"))).returning();
      if (!updated) throw new ManualPayoutError(409, "PAYOUT_TRANSITION_CONFLICT", "تم تعديل الطلب، أعد المحاولة");
      await recordBusinessAudit(tx, {
        actorAdminId: input.adminId, action: "manual_payout.approved", entityType: "manual_payout",
        entityId: input.payoutId, before: payout, after: updated, reason: input.reason, requestId: input.requestId,
      });
      return updated;
    }
    if (input.action === "reject") {
      if (!["pending", "approved"].includes(payout.status)) {
        throw new ManualPayoutError(409, "PAYOUT_TRANSITION_CONFLICT", "لا يمكن رفض الطلب في حالته الحالية");
      }
      await tx.update(manualPayoutAllocationsTable).set({ status: "released", releasedAt: new Date() })
        .where(and(eq(manualPayoutAllocationsTable.payoutRequestId, input.payoutId), eq(manualPayoutAllocationsTable.status, "reserved")));
      const [updated] = await tx.update(manualPayoutRequestsTable).set({
        status: "rejected", rejectionReason: input.reason, rejectedByAdminId: input.adminId,
        rejectedAt: new Date(), updatedAt: new Date(),
      }).where(and(eq(manualPayoutRequestsTable.id, input.payoutId), inArray(manualPayoutRequestsTable.status, ["pending", "approved"]))).returning();
      if (!updated) throw new ManualPayoutError(409, "PAYOUT_TRANSITION_CONFLICT", "تم تعديل الطلب، أعد المحاولة");
      await recordBusinessAudit(tx, {
        actorAdminId: input.adminId, action: "manual_payout.rejected", entityType: "manual_payout",
        entityId: input.payoutId, before: payout, after: updated, reason: input.reason, requestId: input.requestId,
      });
      return updated;
    }

    if (payout.status !== "approved") throw new ManualPayoutError(409, "PAYOUT_TRANSITION_CONFLICT", "اعتماد الطلب مطلوب قبل تسجيل الدفع");
    const proof = await proofFor(tx, input.payoutId);
    if (!proof) throw new ManualPayoutError(422, "PAYOUT_PROOF_REQUIRED", "إثبات التحويل مطلوب قبل تسجيل الدفع");
    if (payout.channel === "cash_branch" && !proof.isSignedReceipt) {
      throw new ManualPayoutError(422, "SIGNED_RECEIPT_REQUIRED", "إيصال نقدي موقّع مطلوب");
    }
    if (payout.channel !== "cash_branch" && !input.transferReference?.trim()) {
      throw new ManualPayoutError(422, "TRANSFER_REFERENCE_REQUIRED", "مرجع التحويل الإلكتروني مطلوب");
    }
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"manual-payout-user:" + payout.recipientUserId}, 0))`);
    await debitWallet(tx, {
      userId: payout.recipientUserId,
      amountCents: toCents(payout.grossAmount),
      description: `Manual payout ${payout.id}`,
      referenceType: "manual_payout",
      referenceId: payout.id,
    });
    const allocations = await tx.select().from(manualPayoutAllocationsTable)
      .where(and(eq(manualPayoutAllocationsTable.payoutRequestId, payout.id), eq(manualPayoutAllocationsTable.status, "reserved")));
    if (!allocations.length) throw new ManualPayoutError(409, "PAYOUT_ALLOCATIONS_MISSING", "لا توجد حجوزات صالحة لهذا الطلب");
    const consumed = await tx.update(manualPayoutAllocationsTable).set({ status: "consumed", consumedAt: new Date() })
      .where(and(eq(manualPayoutAllocationsTable.payoutRequestId, payout.id), eq(manualPayoutAllocationsTable.status, "reserved"))).returning();
    if (consumed.length !== allocations.length) throw new ManualPayoutError(409, "PAYOUT_ALLOCATIONS_CHANGED", "تغيّرت مصادر الرصيد، أعد المحاولة");
    const [updated] = await tx.update(manualPayoutRequestsTable).set({
      status: "paid", paidByAdminId: input.adminId, paidAt: new Date(),
      transferReference: payout.channel === "cash_branch" ? null : input.transferReference!.trim(),
      updatedAt: new Date(),
    }).where(and(eq(manualPayoutRequestsTable.id, payout.id), eq(manualPayoutRequestsTable.status, "approved"))).returning();
    if (!updated) throw new ManualPayoutError(409, "PAYOUT_TRANSITION_CONFLICT", "تم تعديل الطلب، أعد المحاولة");
    await recordBusinessAudit(tx, {
      actorAdminId: input.adminId, action: "manual_payout.paid", entityType: "manual_payout",
      entityId: input.payoutId, before: payout, after: updated, reason: input.reason, requestId: input.requestId,
    });
    return updated;
  });
}

export async function bindManualPayoutProof(input: {
  payoutId: number;
  adminId: number;
  objectPath: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
  size: number;
  isSignedReceipt: boolean;
  requestId: string;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(78251, ${input.payoutId})`);
    const payout = await loadPayout(tx, input.payoutId);
    if (!payout) throw new ManualPayoutError(404, "PAYOUT_NOT_FOUND", "طلب التحويل غير موجود");
    if (payout.status === "paid" || payout.status === "rejected" || payout.status === "cancelled") {
      throw new ManualPayoutError(409, "PAYOUT_PROOF_IMMUTABLE", "لا يمكن تغيير إثبات هذا الطلب");
    }
    if (payout.channel === "cash_branch" && !input.isSignedReceipt) {
      throw new ManualPayoutError(400, "SIGNED_RECEIPT_REQUIRED", "أرسل إيصالاً نقدياً موقّعاً");
    }
    const old = await proofFor(tx, input.payoutId);
    const [proof] = old
      ? await tx.update(manualPayoutProofsTable).set({
        objectPath: input.objectPath, contentType: input.contentType, size: input.size,
        isSignedReceipt: input.isSignedReceipt, uploadedByAdminId: input.adminId,
      }).where(eq(manualPayoutProofsTable.payoutRequestId, input.payoutId)).returning()
      : await tx.insert(manualPayoutProofsTable).values({
        payoutRequestId: input.payoutId, objectPath: input.objectPath, contentType: input.contentType,
        size: input.size, isSignedReceipt: input.isSignedReceipt, uploadedByAdminId: input.adminId,
      }).returning();
    await recordBusinessAudit(tx, {
      actorAdminId: input.adminId, action: "manual_payout.proof_uploaded", entityType: "manual_payout",
      entityId: input.payoutId, before: old, after: proof, reason: "Manual payout proof uploaded", requestId: input.requestId,
    });
    return { payout, proof, oldProofPath: old?.objectPath ?? null };
  });
}

export async function getPayoutWithProof(payoutId: number) {
  const [payout] = await db.select().from(manualPayoutRequestsTable)
    .where(eq(manualPayoutRequestsTable.id, payoutId)).limit(1);
  if (!payout) return null;
  const [proof] = await db.select().from(manualPayoutProofsTable)
    .where(eq(manualPayoutProofsTable.payoutRequestId, payoutId)).limit(1);
  return serializeManualPayout(payout, proof);
}

export async function listAdminPayouts(input: {
  status?: string;
  role?: string;
  page: number;
  pageSize: number;
}) {
  const filters = [
    input.status ? eq(manualPayoutRequestsTable.status, input.status as typeof manualPayoutRequestsTable.status.enumValues[number]) : undefined,
    input.role ? eq(manualPayoutRequestsTable.recipientRole, input.role as typeof manualPayoutRequestsTable.recipientRole.enumValues[number]) : undefined,
  ].filter(Boolean);
  const where = filters.length ? and(...filters) : undefined;
  const [rows, [{ value: total }]] = await Promise.all([
    db.select({ payout: manualPayoutRequestsTable, recipientName: usersTable.name, recipientPhone: usersTable.phone })
      .from(manualPayoutRequestsTable).leftJoin(usersTable, eq(usersTable.id, manualPayoutRequestsTable.recipientUserId))
      .where(where).orderBy(desc(manualPayoutRequestsTable.createdAt), desc(manualPayoutRequestsTable.id))
      .limit(input.pageSize).offset((input.page - 1) * input.pageSize),
    db.select({ value: sql<number>`count(*)` }).from(manualPayoutRequestsTable).where(where),
  ]);
  const ids = rows.map((row) => row.payout.id);
  const proofs = ids.length ? await db.select().from(manualPayoutProofsTable).where(inArray(manualPayoutProofsTable.payoutRequestId, ids)) : [];
  const proofByPayout = new Map(proofs.map((proof) => [proof.payoutRequestId, proof]));
  return {
    items: rows.map((row) => ({
      ...serializeManualPayout(row.payout, proofByPayout.get(row.payout.id) ?? null),
      recipientName: row.recipientName,
      recipientPhone: row.recipientPhone,
    })),
    page: input.page,
    pageSize: input.pageSize,
    total: Number(total),
    totalPages: Math.ceil(Number(total) / input.pageSize),
  };
}