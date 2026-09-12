import { getToken } from "@/lib/auth-session";
import { localizedFetch } from "@/lib/i18n-fetch";
import { translate } from "@/lib/i18n";
import {
  privateStorageObjectUrl,
  refundProofValidationError,
  REFUND_PROOF_MAX_BYTES,
  REFUND_PROOF_MIME_TYPES,
  type RefundProofFile,
} from "./refund-proof-helpers";

export { privateStorageObjectUrl, REFUND_PROOF_MAX_BYTES, REFUND_PROOF_MIME_TYPES };

/**
 * Validate the client-side constraints before sending a proof to the server.
 * The server still validates the byte signature and size; this only gives the
 * customer immediate, accessible feedback.
 */
export function validateRefundProofFile(file: RefundProofFile | null | undefined): string | null {
  const validationError = refundProofValidationError(file);
  if (validationError === "missing") {
    return translate("اختار صورة لإثبات الشكوى", "Choose a photo to support your complaint");
  }
  if (validationError === "type") {
    return translate(
      "نوع الصورة غير مقبول. استخدم JPG أو PNG أو WebP.",
      "Unsupported image type. Use JPG, PNG, or WebP.",
    );
  }
  if (validationError === "size") {
    return translate(
      "حجم الصورة يجب ألا يتجاوز 10 ميجابايت.",
      "The photo must be no larger than 10 MB.",
    );
  }
  return null;
}

function apiErrorMessage(body: unknown, fallback: string): string {
  if (body && typeof body === "object" && "error" in body) {
    const error = (body as { error?: unknown }).error;
    if (typeof error === "string" && error.trim()) return error;
  }
  return fallback;
}

async function readResponseBody(response: Response): Promise<unknown> {
  return response.json().catch(() => null);
}

/**
 * Upload raw photo bytes for a particular order. This deliberately uses the
 * token-aware fetch pattern rather than an unauthenticated image/upload URL.
 */
export async function uploadRefundProof(orderId: number, file: Blob): Promise<string> {
  const token = getToken();
  if (!token) {
    throw new Error(translate("يجب تسجيل الدخول أولاً", "You must sign in first"));
  }

  const response = await localizedFetch(`/api/orders/${orderId}/refund-proof`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": file.type,
      Accept: "application/json",
    },
    body: file,
  });
  const body = await readResponseBody(response);
  if (!response.ok) {
    throw new Error(
      apiErrorMessage(body, translate("تعذر رفع صورة الإثبات", "Unable to upload the proof photo")),
    );
  }
  const objectPath =
    body && typeof body === "object" && "objectPath" in body
      ? (body as { objectPath?: unknown }).objectPath
      : null;
  if (typeof objectPath !== "string" || !objectPath.trim()) {
    throw new Error(translate("تعذر قراءة نتيجة رفع الصورة", "The photo upload response was invalid"));
  }
  return objectPath;
}

/** Fetch a private object as a blob using the current session bearer token. */
export async function fetchPrivateStorageObject(objectPath: string): Promise<Blob> {
  const url = privateStorageObjectUrl(objectPath);
  if (!url) {
    throw new Error(translate("مسار صورة الإثبات غير صالح", "The proof photo path is invalid"));
  }
  const token = getToken();
  if (!token) {
    throw new Error(translate("يجب تسجيل الدخول أولاً", "You must sign in first"));
  }

  const response = await localizedFetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    const body = await readResponseBody(response);
    throw new Error(
      apiErrorMessage(body, translate("تعذر تحميل صورة الإثبات", "Unable to load the proof photo")),
    );
  }
  if (typeof response.blob !== "function") {
    throw new Error(translate("المتصفح لا يدعم معاينة الصورة", "This browser cannot preview the photo"));
  }
  return response.blob();
}