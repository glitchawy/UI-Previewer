import express, { Router, type Request, type Response } from "express";
import { ObjectStorageService } from "../lib/objectStorage";
import { requireAdminPermission, requireAuth, requireRole } from "../middleware/auth";
import {
  ManualPayoutError,
  adminTransitionPayout,
  bindManualPayoutProof,
  cancelOwnPayout,
  getPayoutWithProof,
  listAdminPayouts,
  listOwnPayouts,
  readPayoutSettings,
  requestManualPayout,
  serializeManualPayout,
  updatePayoutSettings,
  type PayoutChannel,
  type PayoutRole,
} from "../lib/manual-payouts";

const router = Router();
const objectStorage = new ObjectStorageService();
const MAX_PROOF_BYTES = 10_000_000;
const channelValues = ["instapay", "mobile_wallet", "cash_branch"] as const;

function parseId(value: string | string[] | undefined) {
  const id = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function errorResponse(res: Response, error: unknown) {
  if (error instanceof ManualPayoutError) {
    res.status(error.status).json({ error: error.message, code: error.code });
    return;
  }
  throw error;
}

function payoutRole(req: Request): PayoutRole {
  return req.authUser!.role as PayoutRole;
}

function detectProofType(data: Buffer): "image/jpeg" | "image/png" | "image/webp" | null {
  if (data.length >= 3 && data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return "image/jpeg";
  if (data.length >= 8 && data[0] === 0x89 && data[1] === 0x50 && data[2] === 0x4e && data[3] === 0x47 &&
      data[4] === 0x0d && data[5] === 0x0a && data[6] === 0x1a && data[7] === 0x0a) return "image/png";
  if (data.length >= 12 && data[0] === 0x52 && data[1] === 0x49 && data[2] === 0x46 && data[3] === 0x46 &&
      data[8] === 0x57 && data[9] === 0x45 && data[10] === 0x42 && data[11] === 0x50) return "image/webp";
  return null;
}

router.use("/payouts", requireAuth, requireRole("driver", "partner"));

router.get("/payouts", async (req, res: Response): Promise<void> => {
  try {
    res.json(await listOwnPayouts(req.authUser!.id, payoutRole(req)));
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/payouts", async (req, res: Response): Promise<void> => {
  const channel = req.body?.channel;
  const idempotencyKey = typeof req.body?.idempotencyKey === "string" ? req.body.idempotencyKey.trim() : "";
  if (!channelValues.includes(channel)) {
    res.status(400).json({ error: "قناة التحويل غير صحيحة", code: "INVALID_CHANNEL" });
    return;
  }
  try {
    const result = await requestManualPayout({
      userId: req.authUser!.id,
      role: payoutRole(req),
      channel: channel as PayoutChannel,
      destination: req.body?.destination,
      idempotencyKey,
      requestId: String(req.id ?? req.headers["x-request-id"] ?? ""),
    });
    const full = await getPayoutWithProof(result.payout.id);
    res.status(result.existing ? 200 : 201).json(full ?? serializeManualPayout(result.payout));
  } catch (error) {
    errorResponse(res, error);
  }
});

router.post("/payouts/:id/cancel", async (req, res: Response): Promise<void> => {
  const payoutId = parseId(req.params.id);
  if (!payoutId) {
    res.status(400).json({ error: "رقم التحويل غير صحيح", code: "INVALID_ID" });
    return;
  }
  try {
    const payout = await cancelOwnPayout(
      req.authUser!.id,
      payoutRole(req),
      payoutId,
      String(req.id ?? req.headers["x-request-id"] ?? ""),
    );
    const full = await getPayoutWithProof(payout.id);
    res.json(full ?? serializeManualPayout(payout));
  } catch (error) {
    errorResponse(res, error);
  }
});

router.use("/admin/payouts", requireAuth, requireRole("admin"));

router.get("/admin/payouts", requireAdminPermission("payouts.read"), async (req, res: Response): Promise<void> => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 20);
  const status = typeof req.query.status === "string" ? req.query.status : undefined;
  const role = typeof req.query.role === "string" ? req.query.role : undefined;
  if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50 ||
      (status && !["pending", "approved", "rejected", "cancelled", "paid"].includes(status)) ||
      (role && !["driver", "partner"].includes(role))) {
    res.status(400).json({ error: "بيانات التصفية أو الصفحات غير صحيحة", code: "INVALID_FILTER" });
    return;
  }
  res.json(await listAdminPayouts({ page, pageSize, status, role }));
});

async function transition(req: Request, res: Response, action: "approve" | "reject" | "paid") {
  const payoutId = parseId(req.params.id);
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (!payoutId) {
    res.status(400).json({ error: "رقم التحويل غير صحيح", code: "INVALID_ID" });
    return;
  }
  try {
    const payout = await adminTransitionPayout({
      payoutId,
      action,
      adminId: req.authUser!.id,
      reason,
      transferReference: typeof req.body?.transferReference === "string" ? req.body.transferReference : undefined,
      requestId: String(req.id ?? req.headers["x-request-id"] ?? ""),
    });
    const full = await getPayoutWithProof(payout.id);
    res.json(full ?? serializeManualPayout(payout));
  } catch (error) {
    errorResponse(res, error);
  }
}

router.post("/admin/payouts/:id/approve", requireAdminPermission("payouts.manage"), async (req, res) => {
  await transition(req, res, "approve");
});
router.post("/admin/payouts/:id/reject", requireAdminPermission("payouts.manage"), async (req, res) => {
  await transition(req, res, "reject");
});
router.post("/admin/payouts/:id/paid", requireAdminPermission("payouts.manage"), async (req, res) => {
  await transition(req, res, "paid");
});

router.post(
  "/admin/payouts/:id/proof",
  requireAdminPermission("payouts.manage"),
  express.raw({ type: "*/*", limit: MAX_PROOF_BYTES }),
  async (req: Request, res: Response): Promise<void> => {
    const payoutId = parseId(req.params.id);
    const body = req.body as Buffer;
    if (!payoutId || !Buffer.isBuffer(body) || body.length === 0 || body.length > MAX_PROOF_BYTES) {
      res.status(body?.length > MAX_PROOF_BYTES ? 413 : 400).json({ error: "ملف الإثبات غير صحيح", code: "INVALID_PROOF" });
      return;
    }
    const contentType = detectProofType(body);
    if (!contentType) {
      res.status(400).json({ error: "يسمح فقط بإثبات JPEG أو PNG أو WebP", code: "INVALID_PROOF_TYPE" });
      return;
    }
    const payout = await getPayoutWithProof(payoutId);
    if (!payout) {
      res.status(404).json({ error: "طلب التحويل غير موجود", code: "PAYOUT_NOT_FOUND" });
      return;
    }
    const isSignedReceipt = req.header("x-receipt-signed")?.toLowerCase() === "true";
    let objectPath: string | null = null;
    try {
      objectPath = await objectStorage.uploadObjectEntity(body, contentType);
      await objectStorage.trySetObjectEntityAclPolicy(objectPath, {
        owner: String(payout.recipientUserId),
        visibility: "private",
      });
      const bound = await bindManualPayoutProof({
        payoutId,
        adminId: req.authUser!.id,
        objectPath,
        contentType,
        size: body.length,
        isSignedReceipt,
        requestId: String(req.id ?? req.headers["x-request-id"] ?? ""),
      });
      if (bound.oldProofPath && bound.oldProofPath !== objectPath) {
        await objectStorage.deleteObjectEntity(bound.oldProofPath).catch((error) => {
          req.log.warn({ err: error, objectPath: bound.oldProofPath }, "Failed to delete replaced payout proof");
        });
      }
      res.status(201).json({ objectPath });
    } catch (error) {
      if (objectPath) await objectStorage.deleteObjectEntity(objectPath).catch(() => undefined);
      errorResponse(res, error);
    }
  },
);

router.get("/admin/payout-settings", requireAuth, requireRole("admin"), requireAdminPermission("payouts.read"), async (_req, res) => {
  res.json(await readPayoutSettings());
});

router.put("/admin/payout-settings", requireAuth, requireRole("admin"), requireAdminPermission("payouts.manage"), async (req, res: Response): Promise<void> => {
  try {
    const updated = await updatePayoutSettings({
      version: Number(req.body?.version),
      channels: req.body?.channels,
      defaultFeePayer: req.body?.defaultFeePayer,
      reason: typeof req.body?.reason === "string" ? req.body.reason : "",
      adminId: req.authUser!.id,
      requestId: String(req.id ?? req.headers["x-request-id"] ?? ""),
    });
    res.json(updated);
  } catch (error) {
    errorResponse(res, error);
  }
});

export default router;