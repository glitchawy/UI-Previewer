import { createHash } from "node:crypto";
import { Router, type Response } from "express";
import { and, eq } from "drizzle-orm";
import { db, notificationDeviceTokensTable } from "@workspace/db";
import { requireAuth } from "../middleware/auth";

const router = Router();
router.use("/notification-devices", requireAuth);

router.post("/notification-devices", async (req, res: Response): Promise<void> => {
  const token = typeof req.body?.token === "string" ? req.body.token.trim() : "";
  const platform = req.body?.platform;
  if (!/^ExponentPushToken\[[^\]\s]{8,}\]$|^ExpoPushToken\[[^\]\s]{8,}\]$/.test(token) ||
      !["ios", "android", "web"].includes(platform)) {
    res.status(400).json({ error: "رمز الجهاز أو المنصة غير صحيح" });
    return;
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const now = new Date();
  const [record] = await db.insert(notificationDeviceTokensTable).values({
    userId: req.authUser!.id, sessionId: req.authSession!.id, token, tokenHash, platform, activeAt: now,
  }).onConflictDoUpdate({
    target: notificationDeviceTokensTable.tokenHash,
    set: { userId: req.authUser!.id, sessionId: req.authSession!.id, token, platform, activeAt: now, revokedAt: null, updatedAt: now },
    setWhere: eq(notificationDeviceTokensTable.userId, req.authUser!.id),
  }).returning({
    id: notificationDeviceTokensTable.id,
    platform: notificationDeviceTokensTable.platform,
    activeAt: notificationDeviceTokensTable.activeAt,
    revokedAt: notificationDeviceTokensTable.revokedAt,
  });
  if (!record) {
    res.status(409).json({ error: "رمز الجهاز مسجل لحساب آخر" });
    return;
  }
  res.status(201).json(record);
});

router.delete("/notification-devices/:id", async (req, res: Response): Promise<void> => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id < 1) { res.status(400).json({ error: "رقم الجهاز غير صحيح" }); return; }
  const [record] = await db.update(notificationDeviceTokensTable).set({
    revokedAt: new Date(), updatedAt: new Date(),
  }).where(and(eq(notificationDeviceTokensTable.id, id),
    eq(notificationDeviceTokensTable.userId, req.authUser!.id),
    eq(notificationDeviceTokensTable.sessionId, req.authSession!.id))).returning({
    id: notificationDeviceTokensTable.id,
    revokedAt: notificationDeviceTokensTable.revokedAt,
  });
  if (!record) { res.status(404).json({ error: "الجهاز غير موجود" }); return; }
  res.json(record);
});

export default router;