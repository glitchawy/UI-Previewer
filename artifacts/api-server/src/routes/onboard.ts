import { Router } from "express";
import { and, asc, count, desc, eq, ilike, inArray, isNull, max, or, sql } from "drizzle-orm";
import {
  applicationDecisionsTable,
  applicationDocumentsTable,
  branchesTable,
  branchStaffTable,
  db,
  driverProfilesTable,
  notificationsTable,
  restaurantsTable,
  usersTable,
} from "@workspace/db";
import { OnboardDriverBody, OnboardPartnerBody } from "@workspace/api-zod";
import { requireActiveAdmin, requireAdminPermission, requireAuth, requireRole } from "../middleware/auth";
import { revokeAllUserSessions } from "../lib/session";

const router = Router();
const applicantAuth = [requireAuth];
const adminAuth = [requireAuth, requireRole("admin"), requireActiveAdmin];
const adminReadAuth = [...adminAuth, requireAdminPermission("applications.read")];
const adminManageAuth = [...adminAuth, requireAdminPermission("applications.manage")];

const RESTAURANT_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["ACTIVE", "REJECTED", "SUSPENDED"],
  ACTIVE: ["REJECTED", "SUSPENDED"],
  SUSPENDED: ["APPROVED", "REJECTED"],
  REJECTED: ["UNDER_REVIEW"],
};
const DRIVER_TRANSITIONS: Record<string, string[]> = {
  PENDING: ["UNDER_REVIEW", "REJECTED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["SUSPENDED"],
  SUSPENDED: ["APPROVED"],
  REJECTED: ["UNDER_REVIEW"],
};

const restaurantDocumentFields = {
  logoUrl: "logo",
  coverUrl: "cover",
} as const;
const driverDocumentFields = {
  nationalIdFrontUrl: "national_id_front",
  nationalIdBackUrl: "national_id_back",
  criminalRecordUrl: "criminal_record",
  licenseUrl: "license",
} as const;

const driverApplicationFields = {
  id: driverProfilesTable.id,
  userId: driverProfilesTable.userId,
  fullName: driverProfilesTable.fullName,
  area: driverProfilesTable.area,
  vehicleType: driverProfilesTable.vehicleType,
  documents: driverProfilesTable.documents,
  nationalIdFrontUrl: driverProfilesTable.nationalIdFrontUrl,
  nationalIdFrontUploadedAt: driverProfilesTable.nationalIdFrontUploadedAt,
  nationalIdBackUrl: driverProfilesTable.nationalIdBackUrl,
  nationalIdBackUploadedAt: driverProfilesTable.nationalIdBackUploadedAt,
  criminalRecordUrl: driverProfilesTable.criminalRecordUrl,
  criminalRecordUploadedAt: driverProfilesTable.criminalRecordUploadedAt,
  licenseUrl: driverProfilesTable.licenseUrl,
  licenseUploadedAt: driverProfilesTable.licenseUploadedAt,
  status: driverProfilesTable.status,
  rejectionReason: driverProfilesTable.rejectionReason,
  latestDocumentUploadedAt: driverProfilesTable.latestDocumentUploadedAt,
  createdAt: driverProfilesTable.createdAt,
  updatedAt: driverProfilesTable.updatedAt,
} as const;

function requestId(req: import("express").Request): string | null {
  const value = req.headers["x-request-id"] ?? req.headers["x-correlation-id"];
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 200) : null;
}

function pagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1);
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function appendDocuments(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  applicationType: "restaurant" | "driver",
  applicationId: number,
  uploaderUserId: number,
  documents: { documentType: string; objectPath: string }[],
) {
  for (const document of documents) {
    const [latest] = await tx.select({
      version: max(applicationDocumentsTable.version),
      objectPath: sql<string | null>`(array_agg(${applicationDocumentsTable.objectPath} order by ${applicationDocumentsTable.version} desc))[1]`,
    }).from(applicationDocumentsTable).where(and(
      eq(applicationDocumentsTable.applicationType, applicationType),
      eq(applicationDocumentsTable.applicationId, applicationId),
      eq(applicationDocumentsTable.documentType, document.documentType),
    ));
    if (latest?.objectPath === document.objectPath) continue;
    await tx.insert(applicationDocumentsTable).values({
      applicationType,
      applicationId,
      uploaderUserId,
      documentType: document.documentType,
      objectPath: document.objectPath,
      version: (latest?.version ?? 0) + 1,
    });
  }
}

router.post("/onboard/partner", ...applicantAuth, requireRole("partner"), async (req, res): Promise<void> => {
  const parsed = OnboardPartnerBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = req.authUser!;
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"onboard:restaurant:" + user.id}, 0))`);
      const existing = await tx.select({ id: restaurantsTable.id }).from(restaurantsTable)
        .where(and(eq(restaurantsTable.ownerUserId, user.id), inArray(restaurantsTable.status, ["PENDING", "UNDER_REVIEW", "APPROVED", "ACTIVE"]))).limit(1);
      if (existing.length) throw new Error("ACTIVE_APPLICATION");
      const b = parsed.data;
      const [row] = await tx.insert(restaurantsTable).values({
        ownerUserId: user.id, ownerName: b.ownerName?.trim() || null, email: b.email?.trim() || null,
        name: b.name.trim(), description: b.description?.trim() || null, phone: b.phone?.trim() || null,
        address: b.address.trim(), branches: b.branches && b.branches > 0 ? Math.floor(b.branches) : 1,
        hours: b.hours?.trim() || null, category: b.category?.trim() || null, deliveryType: b.deliveryType ?? "restaurant",
        logoUrl: b.logoUrl?.trim() || null, coverUrl: b.coverUrl?.trim() || null, status: "PENDING",
        latestDocumentUploadedAt: b.logoUrl || b.coverUrl ? new Date() : null,
      }).returning();
      const docs = Object.entries(restaurantDocumentFields).flatMap(([field, documentType]) => {
        const value = b[field as keyof typeof b];
        return typeof value === "string" && value.trim() ? [{ documentType, objectPath: value.trim() }] : [];
      });
      await appendDocuments(tx, "restaurant", row.id, user.id, docs);
      return row;
    });
    res.json({ success: true, id: result.id, status: result.status });
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_APPLICATION") {
      res.status(409).json({ error: "يوجد طلب مسجّل بالفعل — لا يمكن تقديم طلب جديد" }); return;
    }
    throw error;
  }
});

router.post("/onboard/driver", ...applicantAuth, requireRole("driver"), async (req, res): Promise<void> => {
  const parsed = OnboardDriverBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const user = req.authUser!;
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${"onboard:driver:" + user.id}, 0))`);
      const existing = await tx.select({ id: driverProfilesTable.id }).from(driverProfilesTable)
        .where(and(eq(driverProfilesTable.userId, user.id), inArray(driverProfilesTable.status, ["PENDING", "UNDER_REVIEW", "APPROVED", "SUSPENDED"]))).limit(1);
      if (existing.length) throw new Error("ACTIVE_APPLICATION");
      const b = parsed.data;
      const [row] = await tx.insert(driverProfilesTable).values({
        userId: user.id, fullName: b.fullName.trim(), area: b.area.trim(), vehicleType: b.vehicleType.trim(),
        documents: b.documents?.trim() || null, nationalIdFrontUrl: b.nationalIdFrontUrl?.trim() || null,
        nationalIdBackUrl: b.nationalIdBackUrl?.trim() || null, criminalRecordUrl: b.criminalRecordUrl?.trim() || null,
        licenseUrl: b.licenseUrl?.trim() || null, status: "PENDING",
        latestDocumentUploadedAt: [b.nationalIdFrontUrl, b.nationalIdBackUrl, b.criminalRecordUrl, b.licenseUrl].some(Boolean) ? new Date() : null,
      }).returning();
      const docs = Object.entries(driverDocumentFields).flatMap(([field, documentType]) => {
        const value = b[field as keyof typeof b];
        return typeof value === "string" && value.trim() ? [{ documentType, objectPath: value.trim() }] : [];
      });
      await appendDocuments(tx, "driver", row.id, user.id, docs);
      return row;
    });
    res.json({ success: true, id: result.id, status: result.status });
  } catch (error) {
    if (error instanceof Error && error.message === "ACTIVE_APPLICATION") {
      res.status(409).json({ error: "يوجد طلب مسجّل بالفعل — لا يمكن تقديم طلب جديد" }); return;
    }
    throw error;
  }
});

router.get("/onboard/status", ...applicantAuth, async (req, res): Promise<void> => {
  const user = req.authUser!;
  if (user.role === "partner") {
    const [row] = await db.select({ status: restaurantsTable.status, rejectionReason: restaurantsTable.rejectionReason })
      .from(restaurantsTable).where(eq(restaurantsTable.ownerUserId, user.id)).orderBy(desc(restaurantsTable.createdAt)).limit(1);
    res.json({ role: user.role, status: row?.status ?? null, rejectionReason: row?.rejectionReason ?? null }); return;
  }
  if (user.role === "driver") {
    const [row] = await db.select({ status: driverProfilesTable.status, rejectionReason: driverProfilesTable.rejectionReason })
      .from(driverProfilesTable).where(eq(driverProfilesTable.userId, user.id)).orderBy(desc(driverProfilesTable.createdAt)).limit(1);
    res.json({ role: user.role, status: row?.status ?? null, rejectionReason: row?.rejectionReason ?? null }); return;
  }
  res.json({ role: user.role, status: null, rejectionReason: null });
});

router.patch("/onboard/partner", ...applicantAuth, requireRole("partner"), async (req, res): Promise<void> => {
  const incoming = Object.entries(restaurantDocumentFields).flatMap(([field, documentType]) => {
    const value = (req.body as Record<string, unknown>)[field];
    return typeof value === "string" && value.trim() ? [{ field, documentType, objectPath: value.trim() }] : [];
  });
  if (!incoming.length) { res.status(400).json({ error: "لم يتم إرسال أي تحديثات" }); return; }
  const user = req.authUser!;
  const [existing] = await db.select().from(restaurantsTable).where(eq(restaurantsTable.ownerUserId, user.id)).orderBy(desc(restaurantsTable.createdAt)).limit(1);
  if (!existing) { res.status(404).json({ error: "لم يتم العثور على طلب مسجّل" }); return; }
  if (!["PENDING", "REJECTED"].includes(existing.status)) { res.status(422).json({ error: "لا يمكن تعديل المستندات في الحالة الحالية", status: existing.status }); return; }
  const now = new Date();
  const updates: Record<string, string | Date> = { latestDocumentUploadedAt: now };
  for (const doc of incoming) {
    updates[doc.field] = doc.objectPath;
    updates[doc.field === "logoUrl" ? "logoUploadedAt" : "coverUploadedAt"] = now;
  }
  await db.transaction(async (tx) => {
    const changed = await tx.update(restaurantsTable).set(updates).where(and(eq(restaurantsTable.id, existing.id), eq(restaurantsTable.status, existing.status))).returning({ id: restaurantsTable.id });
    if (!changed.length) throw new Error("CONCURRENT_UPDATE");
    await appendDocuments(tx, "restaurant", existing.id, user.id, incoming);
  });
  res.json({ success: true, id: existing.id, status: existing.status });
});

router.patch("/onboard/driver", ...applicantAuth, requireRole("driver"), async (req, res): Promise<void> => {
  const incoming = Object.entries(driverDocumentFields).flatMap(([field, documentType]) => {
    const value = (req.body as Record<string, unknown>)[field];
    return typeof value === "string" && value.trim() ? [{ field, documentType, objectPath: value.trim() }] : [];
  });
  if (!incoming.length) { res.status(400).json({ error: "لم يتم إرسال أي تحديثات" }); return; }
  const user = req.authUser!;
  const [existing] = await db.select().from(driverProfilesTable).where(eq(driverProfilesTable.userId, user.id)).orderBy(desc(driverProfilesTable.createdAt)).limit(1);
  if (!existing) { res.status(404).json({ error: "لم يتم العثور على طلب مسجّل" }); return; }
  if (!["PENDING", "REJECTED"].includes(existing.status)) { res.status(422).json({ error: "لا يمكن تعديل المستندات في الحالة الحالية", status: existing.status }); return; }
  const now = new Date();
  const updates: Record<string, string | Date> = { latestDocumentUploadedAt: now };
  const stampFields: Record<string, string> = {
    nationalIdFrontUrl: "nationalIdFrontUploadedAt", nationalIdBackUrl: "nationalIdBackUploadedAt",
    criminalRecordUrl: "criminalRecordUploadedAt", licenseUrl: "licenseUploadedAt",
  };
  for (const doc of incoming) { updates[doc.field] = doc.objectPath; updates[stampFields[doc.field]!] = now; }
  await db.transaction(async (tx) => {
    const changed = await tx.update(driverProfilesTable).set(updates).where(and(eq(driverProfilesTable.id, existing.id), eq(driverProfilesTable.status, existing.status))).returning({ id: driverProfilesTable.id });
    if (!changed.length) throw new Error("CONCURRENT_UPDATE");
    await appendDocuments(tx, "driver", existing.id, user.id, incoming);
  });
  res.json({ success: true, id: existing.id, status: existing.status });
});

router.get("/admin/restaurants", ...adminReadAuth, async (req, res): Promise<void> => {
  const { page, pageSize, offset } = pagination(req.query);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const reuploaded = req.query.reuploaded === "true";
  const conditions = [
    q ? or(ilike(restaurantsTable.name, `%${q}%`), ilike(restaurantsTable.address, `%${q}%`), ilike(restaurantsTable.ownerName, `%${q}%`)) : undefined,
    status ? eq(restaurantsTable.status, status as typeof restaurantsTable.$inferSelect.status) : undefined,
    reuploaded ? sql`${restaurantsTable.latestDocumentUploadedAt} is not null` : undefined,
  ].filter(Boolean);
  const where = conditions.length ? and(...conditions) : undefined;
  const [totalRow] = await db.select({ total: count() }).from(restaurantsTable).where(where);
  const rows = await db.select().from(restaurantsTable).where(where)
    .orderBy(req.query.sort === "reuploaded" ? desc(restaurantsTable.latestDocumentUploadedAt) : desc(restaurantsTable.createdAt))
    .limit(pageSize).offset(offset);
  const activeMemberships = rows.length
    ? await db.select({
        restaurantId: branchesTable.restaurantId,
        userId: branchStaffTable.userId,
      })
        .from(branchStaffTable)
        .innerJoin(branchesTable, eq(branchesTable.id, branchStaffTable.branchId))
        .where(and(
          inArray(branchesTable.restaurantId, rows.map((row) => row.id)),
          isNull(branchStaffTable.leftAt),
        ))
    : [];
  const activeMembershipKeys = new Set(
    activeMemberships.map((membership) => `${membership.restaurantId}:${membership.userId}`),
  );
  res.json({ items: rows.map((r) => ({
    ...r,
    fulfillmentAccessIssue: ["APPROVED", "ACTIVE"].includes(r.status) &&
      !activeMembershipKeys.has(`${r.id}:${r.ownerUserId}`)
      ? "MISSING_ACTIVE_BRANCH_MEMBERSHIP"
      : null,
    createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
    logoUploadedAt: r.logoUploadedAt?.toISOString() ?? null,
    coverUploadedAt: r.coverUploadedAt?.toISOString() ?? null,
    latestDocumentUploadedAt: r.latestDocumentUploadedAt?.toISOString() ?? null,
  })), page, pageSize, total: totalRow?.total ?? 0 });
});

router.get("/admin/drivers", ...adminReadAuth, async (req, res): Promise<void> => {
  const { page, pageSize, offset } = pagination(req.query);
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const reuploaded = req.query.reuploaded === "true";
  const conditions = [
    q ? or(ilike(driverProfilesTable.fullName, `%${q}%`), ilike(driverProfilesTable.area, `%${q}%`), ilike(usersTable.phone, `%${q}%`)) : undefined,
    status ? eq(driverProfilesTable.status, status as typeof driverProfilesTable.$inferSelect.status) : undefined,
    reuploaded ? sql`${driverProfilesTable.latestDocumentUploadedAt} is not null` : undefined,
  ].filter(Boolean);
  const where = conditions.length ? and(...conditions) : undefined;
  const base = db.select({ ...driverApplicationFields, phone: usersTable.phone }).from(driverProfilesTable).leftJoin(usersTable, eq(driverProfilesTable.userId, usersTable.id));
  const [totalRow] = await db.select({ total: count() }).from(driverProfilesTable).leftJoin(usersTable, eq(driverProfilesTable.userId, usersTable.id)).where(where);
  const rows = await base.where(where).orderBy(req.query.sort === "reuploaded" ? desc(driverProfilesTable.latestDocumentUploadedAt) : desc(driverProfilesTable.createdAt)).limit(pageSize).offset(offset);
  res.json({ items: rows.map((profile) => ({ ...profile, createdAt: profile.createdAt.toISOString(), updatedAt: profile.updatedAt.toISOString(), latestDocumentUploadedAt: profile.latestDocumentUploadedAt?.toISOString() ?? null, nationalIdFrontUploadedAt: profile.nationalIdFrontUploadedAt?.toISOString() ?? null, nationalIdBackUploadedAt: profile.nationalIdBackUploadedAt?.toISOString() ?? null, criminalRecordUploadedAt: profile.criminalRecordUploadedAt?.toISOString() ?? null, licenseUploadedAt: profile.licenseUploadedAt?.toISOString() ?? null })), page, pageSize, total: totalRow?.total ?? 0 });
});

async function applicationDetail(type: "restaurant" | "driver", id: number) {
  const application = type === "restaurant"
    ? (await db.select().from(restaurantsTable).where(eq(restaurantsTable.id, id)).limit(1))[0]
    : (await db.select({ profile: driverApplicationFields, phone: usersTable.phone }).from(driverProfilesTable).leftJoin(usersTable, eq(driverProfilesTable.userId, usersTable.id)).where(eq(driverProfilesTable.id, id)).limit(1))[0];
  if (!application) return null;
  const documents = await db.select().from(applicationDocumentsTable).where(and(eq(applicationDocumentsTable.applicationType, type), eq(applicationDocumentsTable.applicationId, id))).orderBy(asc(applicationDocumentsTable.documentType), desc(applicationDocumentsTable.version));
  const decisions = await db.select().from(applicationDecisionsTable).where(and(eq(applicationDecisionsTable.applicationType, type), eq(applicationDecisionsTable.applicationId, id))).orderBy(desc(applicationDecisionsTable.createdAt));
  return { application, documents: documents.map((d) => ({ ...d, uploadedAt: d.uploadedAt.toISOString(), reviewedAt: d.reviewedAt?.toISOString() ?? null })), decisions: decisions.map((d) => ({ ...d, createdAt: d.createdAt.toISOString() })) };
}

router.get("/admin/restaurants/:id", ...adminReadAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }
  const detail = await applicationDetail("restaurant", id); if (!detail) { res.status(404).json({ error: "لم يتم العثور على الطلب" }); return; }
  res.json(detail);
});
router.get("/admin/drivers/:id", ...adminReadAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id); if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }
  const detail = await applicationDetail("driver", id); if (!detail) { res.status(404).json({ error: "لم يتم العثور على الطلب" }); return; }
  res.json(detail);
});

async function transitionApplication(type: "restaurant" | "driver", id: number, newStatus: string, reason: string | null, adminId: number, correlationId: string | null) {
  const table = type === "restaurant" ? restaurantsTable : driverProfilesTable;
  const transitions = type === "restaurant" ? RESTAURANT_TRANSITIONS : DRIVER_TRANSITIONS;
  return db.transaction(async (tx) => {
    if (correlationId) {
      const [prior] = await tx.select().from(applicationDecisionsTable).where(and(eq(applicationDecisionsTable.applicationType, type), eq(applicationDecisionsTable.applicationId, id), eq(applicationDecisionsTable.requestId, correlationId))).limit(1);
      if (prior) return { status: prior.toStatus, replayed: true };
    }
    const [current] = await tx.select().from(table).where(eq(table.id, id)).limit(1);
    if (!current) throw new Error("NOT_FOUND");
    const allowed = transitions[current.status] ?? [];
    if (!allowed.includes(newStatus)) throw new Error(`INVALID_TRANSITION:${current.status}:${allowed.join(",")}`);
    const rejectionReason = newStatus === "REJECTED" ? reason : null;
    const operationalReset = type === "driver" && newStatus === "SUSPENDED"
      ? { isOnline: false, isAvailable: false }
      : {};
    const changed = await tx.update(table).set({ status: newStatus as never, rejectionReason, ...operationalReset })
      .where(and(eq(table.id, id), eq(table.status, current.status as never))).returning();
    if (!changed.length) throw new Error("CONCURRENT_UPDATE");
    const applicantUserId = type === "restaurant"
      ? (current as typeof restaurantsTable.$inferSelect).ownerUserId
      : (current as typeof driverProfilesTable.$inferSelect).userId;
    if (type === "restaurant") {
      const restaurant = current as typeof restaurantsTable.$inferSelect;
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${"partner-membership:" + applicantUserId}, 0))`,
      );
      const restaurantBranches = await tx.select({ id: branchesTable.id })
        .from(branchesTable)
        .where(eq(branchesTable.restaurantId, restaurant.id))
        .orderBy(asc(branchesTable.id));

      if (newStatus === "APPROVED" || newStatus === "ACTIVE") {
        if (restaurantBranches.length > 1) {
          throw new Error("AMBIGUOUS_BRANCH_MEMBERSHIP");
        }
        let branchId = restaurantBranches[0]?.id;
        if (!branchId) {
          const [createdBranch] = await tx.insert(branchesTable).values({
            restaurantId: restaurant.id,
            name: `${restaurant.name} — الفرع الرئيسي`,
            address: restaurant.address,
            phone: restaurant.phone,
            lat: restaurant.lat,
            lng: restaurant.lng,
            notes: "Created during partner approval",
          }).returning({ id: branchesTable.id });
          branchId = createdBranch.id;
        }
        await tx.update(branchStaffTable).set({ leftAt: new Date() }).where(and(
          eq(branchStaffTable.userId, applicantUserId),
          isNull(branchStaffTable.leftAt),
          sql`${branchStaffTable.branchId} <> ${branchId}`,
        ));
        const [active] = await tx.select({ id: branchStaffTable.id })
          .from(branchStaffTable)
          .where(and(
            eq(branchStaffTable.userId, applicantUserId),
            eq(branchStaffTable.branchId, branchId),
            isNull(branchStaffTable.leftAt),
          ))
          .limit(1);
        if (!active) {
          const [prior] = await tx.select({ id: branchStaffTable.id })
            .from(branchStaffTable)
            .where(and(
              eq(branchStaffTable.userId, applicantUserId),
              eq(branchStaffTable.branchId, branchId),
            ))
            .orderBy(asc(branchStaffTable.id))
            .limit(1);
          if (prior) {
            await tx.update(branchStaffTable).set({
              leftAt: null,
              role: "MANAGER",
              joinedAt: new Date(),
            }).where(eq(branchStaffTable.id, prior.id));
          } else {
            await tx.insert(branchStaffTable).values({
              branchId,
              userId: applicantUserId,
              role: "MANAGER",
            });
          }
        }
      } else if (newStatus === "REJECTED" || newStatus === "SUSPENDED") {
        const branchIds = restaurantBranches.map((branch) => branch.id);
        if (branchIds.length) {
          await tx.update(branchStaffTable).set({ leftAt: new Date() }).where(and(
            eq(branchStaffTable.userId, applicantUserId),
            inArray(branchStaffTable.branchId, branchIds),
            isNull(branchStaffTable.leftAt),
          ));
        }
      }
    }
    if (newStatus === "SUSPENDED") {
      await revokeAllUserSessions(applicantUserId, "account_suspended", tx);
    }
    await tx.insert(applicationDecisionsTable).values({
      applicationType: type, applicationId: id, applicantUserId, actorAdminId: adminId,
      fromStatus: current.status, toStatus: newStatus, reason, requestId: correlationId,
    });
    if (newStatus === "APPROVED" || newStatus === "REJECTED") {
      await tx.insert(notificationsTable).values({
        userId: applicantUserId,
        eventType: newStatus === "APPROVED" ? "APPLICATION_APPROVED" : "APPLICATION_REJECTED",
        title: newStatus === "APPROVED" ? "تم قبول طلبك" : "تم رفض طلبك",
        body: newStatus === "APPROVED" ? "تهانينا، تمت الموافقة على طلب الانضمام." : `تم رفض طلب الانضمام: ${reason}`,
        entityType: type, entityId: id,
        deduplicationKey: `application:${type}:${id}:${newStatus}:${correlationId ?? `${current.status}-${newStatus}`}`,
      }).onConflictDoNothing();
    }
    return { status: newStatus, replayed: false };
  });
}

for (const type of ["restaurants", "drivers"] as const) {
  router.patch(`/admin/${type}/:id/status`, ...adminManageAuth, async (req, res): Promise<void> => {
    const id = Number(req.params.id);
    const status = (req.body as { status?: unknown }).status;
    const reason = typeof (req.body as { reason?: unknown }).reason === "string" ? (req.body as { reason: string }).reason.trim() : null;
    if (!Number.isInteger(id) || id <= 0 || typeof status !== "string") { res.status(400).json({ error: "بيانات غير صحيحة" }); return; }
    if (status === "REJECTED" && !reason) { res.status(400).json({ error: "سبب الرفض مطلوب" }); return; }
    try {
      const result = await transitionApplication(type === "restaurants" ? "restaurant" : "driver", id, status, reason, req.authUser!.id, requestId(req));
      res.json({ success: true, id, ...result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message === "NOT_FOUND") { res.status(404).json({ error: "لم يتم العثور على الطلب" }); return; }
      if (message === "CONCURRENT_UPDATE") { res.status(409).json({ error: "تم تعديل الطلب بواسطة مشرف آخر، حدّث الصفحة" }); return; }
      if (message === "AMBIGUOUS_BRANCH_MEMBERSHIP") {
        res.status(422).json({
          error: "تعذر تحديد فرع الشريك تلقائياً؛ يجب حل تعارض الفروع قبل الموافقة",
          code: "AMBIGUOUS_BRANCH_MEMBERSHIP",
        });
        return;
      }
      if (message.startsWith("INVALID_TRANSITION:")) {
        const [, currentStatus, allowed] = message.split(":");
        res.status(422).json({ error: "انتقال الحالة غير مسموح", currentStatus, allowedTransitions: allowed ? allowed.split(",") : [] }); return;
      }
      throw error;
    }
  });
}

router.get("/notifications", ...applicantAuth, async (req, res): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
    res.status(400).json({ error: "بيانات الصفحات غير صحيحة" });
    return;
  }
  const offset = (page - 1) * pageSize;
  const own = eq(notificationsTable.userId, req.authUser!.id);
  const [[totalRow], [unreadRow], items] = await Promise.all([
    db.select({ total: count() }).from(notificationsTable).where(own),
    db.select({ total: count() }).from(notificationsTable).where(and(own, isNull(notificationsTable.readAt))),
    db.select().from(notificationsTable).where(own).orderBy(desc(notificationsTable.createdAt), desc(notificationsTable.id)).limit(pageSize).offset(offset),
  ]);
  res.json({
    items: items.map((n) => ({ ...n, createdAt: n.createdAt.toISOString(), readAt: n.readAt?.toISOString() ?? null })),
    page,
    pageSize,
    total: totalRow?.total ?? 0,
    unreadCount: unreadRow?.total ?? 0,
  });
});

router.patch("/notifications/:id/read", ...applicantAuth, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: "معرّف غير صحيح" }); return; }
  const [row] = await db.update(notificationsTable).set({ readAt: new Date() }).where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.authUser!.id))).returning();
  if (!row) { res.status(404).json({ error: "الإشعار غير موجود" }); return; }
  res.json({ success: true, readAt: row.readAt?.toISOString() });
});

router.patch("/notifications/read-all", ...applicantAuth, async (req, res): Promise<void> => {
  const rows = await db.update(notificationsTable)
    .set({ readAt: new Date() })
    .where(and(eq(notificationsTable.userId, req.authUser!.id), isNull(notificationsTable.readAt)))
    .returning({ id: notificationsTable.id });
  res.json({ success: true, updatedCount: rows.length });
});

export default router;