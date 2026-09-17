import { localizedFetch } from "@/lib/i18n-fetch";
import { getToken } from "@/lib/auth-session";
import { getLocale, translate } from "@/lib/i18n";
import {
  fetchPrivateStorageObject,
  privateStorageObjectUrl,
} from "@/lib/refund-proof";

export const PAYOUT_CHANNELS = ["instapay", "mobile_wallet", "cash_branch"] as const;
export type PayoutChannel = (typeof PAYOUT_CHANNELS)[number];
export type PayoutRole = "driver" | "partner";
export type PayoutStatus = "pending" | "approved" | "paid" | "rejected" | "cancelled";
export type PayoutFeePayer = "recipient" | "platform";

export const DEFAULT_PAYOUT_FEES: Record<PayoutChannel, number> = {
  instapay: 5,
  mobile_wallet: 10,
  cash_branch: 100,
};

export type PayoutDestination = {
  accountName: string;
  instapayAddress?: string;
  mobileNumber?: string;
  branch?: string;
};

export type ManualPayoutCreate = {
  channel: PayoutChannel;
  destination: PayoutDestination;
  idempotencyKey: string;
};

export type PayoutProof = {
  objectPath: string;
  contentType?: "image/jpeg" | "image/png" | "image/webp";
  size?: number;
  isSignedReceipt?: boolean;
  uploadedByAdminId?: number;
  uploadedAt?: string;
  createdAt?: string;
};

/**
 * The API contract intentionally keeps this DTO separate from settlement
 * snapshots. Amounts are numbers in EGP; the optional aliases let the UI
 * display older server records while the payout API is rolled out.
 */
export type ManualPayoutRequest = {
  id: number | string;
  role?: PayoutRole;
  recipientUserId?: number;
  recipientRole?: PayoutRole;
  recipientName?: string | null;
  recipientPhone?: string | null;
  channel: PayoutChannel;
  destination: PayoutDestination;
  idempotencyKey?: string;
  status: PayoutStatus;
  grossAmount?: number;
  gross?: number;
  fee?: number;
  feeAmount?: number;
  netAmount?: number;
  net?: number;
  currency?: "EGP";
  feePayer?: PayoutFeePayer;
  createdAt: string;
  updatedAt?: string | null;
  approvedAt?: string | null;
  paidAt?: string | null;
  rejectedAt?: string | null;
  cancelledAt?: string | null;
  approvedByAdminId?: number | null;
  rejectedByAdminId?: number | null;
  paidByAdminId?: number | null;
  reason?: string | null;
  decisionReason?: string | null;
  rejectionReason?: string | null;
  adminNote?: string | null;
  transferReference?: string | null;
  provider?: string;
  providerMetadata?: Record<string, unknown> | null;
  proof?: PayoutProof | null;
  proofObjectPath?: string | null;
};

export type PayoutSummary = {
  available: number;
  reserved: number;
  approved: number;
  paid: number;
  fee: number;
  currency: "EGP";
  feePayer?: PayoutFeePayer;
  fees?: Partial<Record<PayoutChannel, number>>;
};

export type PayoutResponse = {
  summary: PayoutSummary;
  settings: PayoutSettingsPreview;
  requests: ManualPayoutRequest[];
};

export type PayoutPage = {
  items: ManualPayoutRequest[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

export type PayoutClient = {
  get: () => Promise<PayoutResponse>;
  create: (body: ManualPayoutCreate) => Promise<ManualPayoutRequest>;
  cancel: (id: number | string) => Promise<ManualPayoutRequest>;
};

export type AdminPayoutSettings = {
  version: number;
  channels: {
    instapay: { fee: number };
    mobile_wallet: { fee: number };
    cash_branch: { fee: number };
  };
  defaultFeePayer: PayoutFeePayer;
  updatedAt: string | null;
};

export type AdminPayoutSettingsInput = Omit<AdminPayoutSettings, "updatedAt"> & {
  reason: string;
};

export type PayoutSettingsPreview = {
  version?: number;
  channels: {
    instapay: { fee: number };
    mobile_wallet: { fee: number };
    cash_branch: { fee: number };
  };
  defaultFeePayer: PayoutFeePayer;
  updatedAt?: string | null;
};

export function payoutChannelLabel(
  channel: PayoutChannel,
  t: (ar: string, en: string) => string,
): string {
  return {
    instapay: t("إنستاباي", "Instapay"),
    mobile_wallet: t("محفظة هاتف", "Mobile wallet"),
    cash_branch: t("فرع نقدي", "Cash branch"),
  }[channel];
}

export function payoutStatusLabel(
  status: PayoutStatus,
  t: (ar: string, en: string) => string,
): string {
  return {
    pending: t("قيد المراجعة", "Pending"),
    approved: t("معتمد — بانتظار التحويل", "Approved — awaiting transfer"),
    paid: t("تم الدفع", "Paid"),
    rejected: t("مرفوض", "Rejected"),
    cancelled: t("ملغى", "Cancelled"),
  }[status];
}

export function payoutStatusTone(status: PayoutStatus): "neutral" | "info" | "warn" | "success" | "danger" {
  const tones: Record<PayoutStatus, "neutral" | "info" | "warn" | "success" | "danger"> = {
    pending: "warn",
    approved: "info",
    paid: "success",
    rejected: "danger",
    cancelled: "neutral",
  };
  return tones[status];
}

export function payoutGross(request: ManualPayoutRequest): number {
  return request.grossAmount ?? request.gross ?? 0;
}

export function payoutFee(request: ManualPayoutRequest): number {
  return request.feeAmount ?? request.fee ?? 0;
}

export function payoutNet(request: ManualPayoutRequest): number {
  return request.netAmount ?? request.net ?? 0;
}

export function payoutProofPath(request: ManualPayoutRequest): string | null {
  return request.proof?.objectPath ?? request.proofObjectPath ?? null;
}

export function payoutFeeForChannel(
  summary: PayoutSummary | null,
  channel: PayoutChannel,
  settings?: PayoutSettingsPreview,
): number {
  const configuredFee = settings?.channels[channel].fee;
  if (typeof configuredFee === "number") return configuredFee;
  const channelFee = summary?.fees?.[channel];
  if (typeof channelFee === "number") return channelFee;
  if (typeof summary?.fee === "number" && summary.fee > 0) return summary.fee;
  return DEFAULT_PAYOUT_FEES[channel];
}

export function payoutNetPreview(
  available: number,
  fee: number,
  feePayer: PayoutFeePayer,
): number {
  return feePayer === "recipient" ? available - fee : available;
}

export function isPayoutDestinationValid(
  channel: PayoutChannel,
  destination: PayoutDestination,
): boolean {
  if (!destination.accountName.trim()) return false;
  if (channel === "instapay") return Boolean(destination.instapayAddress?.trim());
  if (channel === "mobile_wallet") return Boolean(destination.mobileNumber?.trim());
  return Boolean(destination.branch?.trim());
}

export async function adminPayoutProof(
  id: number | string,
  file: Blob,
  isSignedReceipt: boolean,
): Promise<string> {
  const token = getToken();
  if (!token) {
    throw new Error(translate("يجب تسجيل الدخول أولاً", "You must sign in first"));
  }

  const response = await localizedFetch(`/api/admin/payouts/${id}/proof`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
      "X-Receipt-Signed": String(isSignedReceipt),
      "Accept-Language": getLocale(),
      Accept: "application/json",
    },
    body: file,
  });
  const body = await response.json().catch(() => null) as { objectPath?: unknown; error?: unknown } | null;
  if (!response.ok) {
    throw new Error(
      typeof body?.error === "string"
        ? body.error
        : translate("تعذر إرفاق صورة الإثبات", "Unable to attach the proof photo"),
    );
  }
  if (typeof body?.objectPath !== "string" || !body.objectPath.trim()) {
    throw new Error(translate("نتيجة إرفاق الصورة غير صالحة", "The proof attachment response was invalid"));
  }
  return body.objectPath;
}

export async function adminPayoutRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error(translate("يجب تسجيل الدخول أولاً", "You must sign in first"));
  }
  const response = await localizedFetch(`/api${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": getLocale(),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null) as ({ error?: string } & T) | null;
  if (!response.ok) {
    throw new Error(body?.error ?? translate("تعذر تنفيذ الطلب", "Could not complete request"));
  }
  return body as T;
}

/** Role-scoped payout resource. The server derives driver/partner from auth. */
export async function payoutRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = getToken();
  if (!token) {
    throw new Error(translate("يجب تسجيل الدخول أولاً", "You must sign in first"));
  }
  const response = await localizedFetch(`/api${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Accept-Language": getLocale(),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
  });
  const body = await response.json().catch(() => null) as ({ error?: string } & T) | null;
  if (!response.ok) {
    throw new Error(body?.error ?? translate("تعذر تنفيذ الطلب", "Could not complete request"));
  }
  return body as T;
}

export async function loadPrivatePayoutProof(objectPath: string): Promise<string> {
  const safeUrl = privateStorageObjectUrl(objectPath);
  if (!safeUrl) {
    throw new Error(translate("مسار صورة الإثبات غير صالح", "The proof photo path is invalid"));
  }
  const blob = await fetchPrivateStorageObject(objectPath);
  return URL.createObjectURL(blob);
}